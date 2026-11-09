import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 60000 });

// start the encounter
await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  const e = ws.enemies.getTargets()[0];
  ws.player.pos.set(e.pos.x + 0.8, 0, e.pos.z + 0.8);
  ws.player.model.position.copy(ws.player.pos);
});
await page.waitForTimeout(2500);

const stepTo = async (target) => page.evaluate((state) => {
  const ws = window.MB.app.worldScene;
  for (let i = 0; i < 400 && ws.battle?.state !== state; i += 1) ws.battle.update(0.05);
  return ws.battle?.state;
}, target);
console.log('reach PLAYER phase:', await stepTo('player'));

await page.keyboard.press('9');
await page.evaluate(() => { const ws = window.MB.app.worldScene; ws.battle.update(0.01); });
console.log('inspired after 9:', await page.evaluate(() => window.MB?.app.worldScene?.battle?._inspired));

const hpBefore = await page.evaluate(() => window.MB?.app.worldScene?.battle?.enemies?.[0]?.hp ?? -1);
await page.keyboard.press('1');
await page.evaluate(() => { const ws = window.MB.app.worldScene; for (let i = 0; i < 40; i += 1) ws.battle.update(0.05); });
const hpAfter = await page.evaluate(() => window.MB?.app.worldScene?.battle?.enemies?.[0]?.hp ?? -1);
console.log('enemy hp 1 → attack:', hpBefore, '→', hpAfter);

const weaponBefore = await page.evaluate(() => window.MB?.app.worldScene?.player?.weapons?.index);
await page.keyboard.press('8');
await page.evaluate(() => { const ws = window.MB.app.worldScene; for (let i = 0; i < 30; i += 1) ws.battle.update(0.05); });
console.log('weapon index:', weaponBefore, '→', await page.evaluate(() => window.MB?.app.worldScene?.player?.weapons?.index));

// back to player phase, press 6 (defend) → defend applies → enemy strikes ↓
await stepTo('player');
await page.keyboard.press('6');
console.log('defend set to true before enemy phase:', await page.evaluate(() => window.MB?.app.worldScene?.battle?._defend));
await page.evaluate(() => { const ws = window.MB.app.worldScene; for (let i = 0; i < 80; i += 1) ws.battle.update(0.05); });
console.log('back to player phase after enemy turn:', await page.evaluate(() => window.MB?.app.worldScene?.battle?.state));
await page.screenshot({ path: '/tmp/opencode/battle-keys.png' });
await browser.close();
console.log('BATTLE KEYS OK');
