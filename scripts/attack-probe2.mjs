import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 60000 });
const out = await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  const player = ws.player;
  const input = window.MB.app.input;
  // pretend we are pointer-locked (what happens in the real browser world)
  input.pointerLocked = true;
  // fire a synthetic LMB mousedown the way the browser delivers it
  const evt = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
  document.dispatchEvent(evt);
  const edgeSeen = input.mouseLeftEdge > 0;
  // now let the combat consume the edge the way the frame does
  player.combat.update(1 / 60);
  return { edgeSeen, attacking: player.combat.attacking, attackT: player.combat.attackT };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
