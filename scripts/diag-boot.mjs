import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => console.log('[' + m.type() + ']', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message, '|', (e.stack||'').split('\n').slice(0,3).join(' | ')));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
const state = await page.evaluate(() => ({
  readyState: document.readyState,
  uiChildren: document.getElementById('ui-root')?.children.length,
  mm: !!document.querySelector('.main-menu-screen'),
  threeChildren: document.getElementById('three-root')?.children.length,
  bodyHTMLlen: document.body.innerHTML.length,
}));
console.log(JSON.stringify(state, null, 1));
await browser.close();
