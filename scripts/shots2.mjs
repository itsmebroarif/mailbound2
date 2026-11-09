import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3200);
await page.mouse.move(430, 430);
await page.screenshot({ path: '/tmp/opencode/cursor-hover.png' });
await page.mouse.move(200, 260);
await page.screenshot({ path: '/tmp/opencode/cursor-menu.png' });
await browser.close();
console.log('done');
