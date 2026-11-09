import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });
const clickAt = async (selector) => {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);

console.log('custom cursor present:', await page.locator('#mb-cursor').count());
console.log('system cursor style on body:', await page.evaluate(() => getComputedStyle(document.body).cursor));

await clickAt('[data-act="new"]');
await page.waitForTimeout(700);
console.log('intro card visible:', await page.locator('.intro-card-screen').count());
await clickAt('[data-act="go"]');
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 40000 });
console.log('world scene active:', await page.evaluate(() => !!window.MB?.app.worldScene));

// Esc → pause, real click resume
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
console.log('pause visible:', await page.locator('.pause-card').count());
await page.screenshot({ path: '/tmp/opencode/flow-pause.png' });
await clickAt('[data-act="resume"]');
await page.waitForTimeout(500);
console.log('pause gone after click:', (await page.locator('.pause-card').count()) === 0);

// Esc again → settings → back
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await clickAt('[data-act="settings"]');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/opencode/flow-settings.png' });
// slider works with real mouse
const before = await page.evaluate(() => window.MB.app.save.settings.sensitivity);
await page.mouse.move(500, 132);
await page.mouse.down();
await page.mouse.move(700, 132);
await page.mouse.up();
const after = await page.evaluate(() => window.MB.app.save.settings.sensitivity);
console.log('sensitivity drag:', before, '→', after);

await browser.close();
console.log('CLICK FLOW OK');
