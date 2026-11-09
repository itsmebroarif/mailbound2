import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3200);
await page.screenshot({ path: '/tmp/opencode/shot-menu.png' });
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForTimeout(4500);
await page.screenshot({ path: '/tmp/opencode/shot-world.png' });
await browser.close();
console.log('done');
