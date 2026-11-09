import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.locator('[data-act="new"]').waitFor({ state: 'visible', timeout: 8000 });

const probe = await page.evaluate(() => {
  const btn = document.querySelector('[data-act="new"]');
  const r = btn.getBoundingClientRect();
  const cx = Math.floor(r.left + r.width / 2);
  const cy = Math.floor(r.top + r.height / 2);
  const el = document.elementFromPoint(cx, cy);
  const path = [];
  let cur = el;
  while (cur && cur !== document.body) {
    path.push(`${cur.tagName.toLowerCase()}#${cur.id ?? ''}.${(cur.className || '').toString().split(' ').slice(0, 4).join('.')}`);
    cur = cur.parentElement;
  }
  return {
    point: [cx, cy],
    btnRect: [r.left, r.top, r.width, r.height].map(Math.round),
    elementAtPoint: path.join(' > '),
    btn: btn.tagName,
    btnClasses: btn.className,
    btnVisible: r.width > 0 && r.height > 0,
    uiLayers: {
      threeRoot: getComputedStyle(document.getElementById('three-root')).pointerEvents + ' / z ' + getComputedStyle(document.getElementById('three-root')).zIndex,
      phaserRoot: getComputedStyle(document.getElementById('phaser-root')).pointerEvents + ' / z ' + getComputedStyle(document.getElementById('phaser-root')).zIndex,
      uiRoot: getComputedStyle(document.getElementById('ui-root')).pointerEvents + ' / z ' + getComputedStyle(document.getElementById('ui-root')).zIndex,
      uivignet: getComputedStyle(document.getElementById('vignette')).pointerEvents + ' / z ' + getComputedStyle(document.getElementById('vignette')).zIndex,
      screenNew: getComputedStyle(document.querySelector('.main-menu-screen')).pointerEvents,
      uirect: document.getElementById('ui-root').getBoundingClientRect().toJSON?.() ?? JSON.stringify(document.getElementById('ui-root').getBoundingClientRect()),
    },
  };
});
console.log(JSON.stringify(probe, null, 2));
await browser.close();
