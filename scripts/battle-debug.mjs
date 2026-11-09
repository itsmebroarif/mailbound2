import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message, '|', (e.stack||'').split('\n').slice(0,5).join(' | ')));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, { timeout: 120000 });
await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  const e = ws.enemies.getTargets()[0];
  ws.player.pos.set(e.pos.x + 0.8, 0, e.pos.z + 0.8);
  ws.player.model.position.copy(ws.player.pos);
});
await page.waitForTimeout(3000);
console.log('state after spawn:', await page.evaluate(() => {
  const b = window.MB?.app.worldScene?.battle;
  return { state: b?.state, roster: b?.enemies?.map((e) => ({ arch: e.arch, hp: e.hp, alive: e.alive, atk: e.atk })) };
}));
for (let i = 0; i < 30; i++) {
  const info = await page.evaluate(() => {
    const b = window.MB?.app.worldScene?.battle;
    const e = b?.enemies?.[0];
    return { state: b?.state, t: b?.t?.toFixed(2), enemyAlive: e?.alive, enemyHp: e?.hp, playerHp: window.MB?.app.worldScene?.player?.stats?.hp, defend: b?._defend, idx: b?._enemyIdx };
  });
  console.log(JSON.stringify(info));
  if (info.state === 'player' && info.t > 0.5) break;
  await page.evaluate(() => window.MB?.app.worldScene?.battle?.update(0.1));
}
// simulate a full attack
await page.keyboard.press('1');
await page.evaluate(() => window.MB?.app.worldScene?.battle?.update(0.1));
for (let i = 0; i < 40; i++) {
  const info = await page.evaluate(() => {
    const b = window.MB?.app.worldScene?.battle;
    return { state: b?.state, t: b?.t?.toFixed(2), hps: b?.enemies?.map((e) => e.hp), playerHp: window.MB?.app.worldScene?.player?.stats?.hp };
  });
  console.log('after attack:', JSON.stringify(info));
  if (info.state !== 'anim' && info.state !== 'enemy') break;
  await page.evaluate(() => window.MB?.app.worldScene?.battle?.update(0.1));
}
await browser.close();
