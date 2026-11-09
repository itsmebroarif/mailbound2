// Headless smoke test: boot the game, walk the first playable steps and
// catch every console error / pageerror while we go.

import { chromium } from 'playwright-core';

const errors = [];
const logs = [];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });

page.on('console', (msg) => {
  logs.push(`[${msg.type()}] ${msg.text()}`);
  if (['error'].includes(msg.type())) errors.push(`[console.${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}\n${(err.stack||'').split('\n').slice(0,4).join('\n')}`));
page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText}`));

const step = (name) => console.log(`=== step: ${name} ===`);

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

// boot → loading (1.4s) → main menu
await page.waitForTimeout(2600);
step('main menu');
const menuHTML = await page.content();
console.log('menu has mm-title:', menuHTML.includes('mm-title'));

// click "New Game"
await page.evaluate(() => document.querySelector('[data-act="new"]').click());
await page.waitForTimeout(400);
step('intro card');

await page.evaluate(() => document.querySelector('[data-act="go"]').click());
await page.waitForTimeout(3200);
step('world 1');

const canvasCount = await page.locator('canvas').count();
console.log('canvas elements:', canvasCount);

const phaserInfo = await page.evaluate(() => {
  const c = document.querySelector('#phaser-root canvas');
  const t = document.querySelector('#three-root canvas');
  return {
    phaser: c ? { w: c.width, h: c.height } : null,
    three: t ? { w: t.width, h: t.height } : null,
  };
});
console.log('canvas sizes:', JSON.stringify(phaserInfo));

// walk forward & swing the sword
await page.keyboard.down('w');
await page.waitForTimeout(1300);
await page.keyboard.up('w');
await page.keyboard.press('1');
await page.mouse.click(720, 400);
await page.waitForTimeout(600);

// pause overlay opens via Esc
await page.keyboard.press('Escape');
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })));
await page.waitForTimeout(500);
step('pause');

const pauseVisible = await page.locator('.pause-card').count();
console.log('pause card visible:', pauseVisible);

await page.screenshot({ path: '/tmp/opencode/smoke-shot.png', timeout: 15000 });

// resume
const resume = page.locator('[data-act="resume"]').first();
if (await resume.count()) await resume.evaluate((el) => el.click());
await page.waitForTimeout(300);

step('diagnostics');
await page.screenshot({ path: '/tmp/opencode/smoke-shot2.png', timeout: 15000 });

await browser.close();

console.log('\n==== ERRORS (' + errors.length + ') ====');
for (const e of errors.slice(0, 30)) console.log(e);
console.log('\n==== LOG TAIL ====');
for (const l of logs.slice(-25)) console.log(l);
console.log('\nSMOKE DONE');
await page.screenshot({ path: '/tmp/opencode/smoke-final.png', timeout: 15000 });
console.log('screenshots saved');
process.exit(0);
