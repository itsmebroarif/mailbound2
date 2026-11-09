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
  // find an enemy to test on
  const e = ws.enemies.getTargets()[0];
  if (!e) return { error: 'no enemies' };
  const before = e.hp;
  // teleport it right in front of the player
  e.pos.set(player.pos.x + Math.sin(player.facing) * 2, 0, player.pos.z + Math.cos(player.facing) * 2);
  e.model.position.copy(e.pos);
  // simulate LMB input edges & verify combat consumes them
  const leftBefore = ws.player.combat;
  player.combat.tryAttack();
  // step weapon/combat logic by hand: set attackT to just before hit window
  player.combat.attackDur = 0.34;
  player.combat.attackT = Math.max(0.001, 0.34 - 0.125);
  // force-process the hit application directly
  player.combat.hitDone = false;
  player.combat._applyHit();
  const after = e.hp;
  return { before, after, attacking: player.combat.attacking, swingArmT: player.swingArmT };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
