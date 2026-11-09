import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 60000 });
const out = await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  ws.camera.yaw = 0;
  const input = window.MB.app.input;
  const results = {};
  for (const key of ['KeyW', 'KeyS', 'KeyD', 'KeyA']) {
    input._down.clear();
    input._down.add(key);
    ws.player.vel.set(0, 0, 0);
    // two synthetic fixed-timestep updates to reach steady velocity
    ws.player.controller.update(1 / 60);
    ws.player.controller.update(1 / 60);
    ws.player.controller.update(1 / 60);
    results[key] = { x: +ws.player.vel.x.toFixed(2), z: +ws.player.vel.z.toFixed(2) };
  }
  return results;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
