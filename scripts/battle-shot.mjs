import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 60000 });
await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  const e = ws.enemies.getTargets()[0];
  ws.player.pos.set(e.pos.x + 1.2, 0, e.pos.z + 1.2);
  ws.player.model.position.copy(ws.player.pos);
});
await page.waitForTimeout(2500);
await page.evaluate(() => { const ws = window.MB.app.worldScene; for (let i = 0; i < 30; i += 1) ws.battle.update(0.05); });
await page.keyboard.press('1');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/opencode/battle-persona.png' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/opencode/battle-persona2.png' });
await browser.close();
console.log('done');
