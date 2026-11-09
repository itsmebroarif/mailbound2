import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/opencode/cutscene-early.png' });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/opencode/cutscene-mid.png' });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/opencode/cutscene-late.png' });
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 60000 });
console.log('entered world ok');
await browser.close();
console.log('CUTSCENE FLOW OK');
