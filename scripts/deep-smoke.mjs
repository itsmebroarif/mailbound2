// Headless deep-playthrough smoke: boot, menu, W1, dialogue, forced endgame
// progression, jet transition, boss finale, victory screen.

import { chromium } from 'playwright-core';

const errors = [];
const logs = [];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });

page.on('console', (msg) => {
  logs.push(`[${msg.type()}] ${msg.text()}`);
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message} @ ${(err.stack || '').split('\n')[1] ?? ''}`));

const step = (name) => console.log(`=== step: ${name} ===`);
const evalJS = (fn) => page.evaluate(fn);

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
step('menu');
console.log('mm-title present:', await evalJS(() => !!document.querySelector('.mm-title')));

// start new game
await evalJS(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await evalJS(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForTimeout(3000);
step('world1');
console.log('world1 canvas:', await evalJS(() => !!document.querySelector('#three-root canvas')));
console.log('world scene active:', await evalJS(() => !!window.MB?.app.worldScene));

// walk forward briefly
await page.keyboard.down('w');
await page.waitForTimeout(800);
await page.keyboard.up('w');

// Esc pause → resume via DOM (exercises Escape handler)
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const pauseVisible = await evalJS(() => !!document.querySelector('.pause-card'));
console.log('pause opens on Esc:', pauseVisible);
if (pauseVisible) {
  await evalJS(() => document.querySelector('[data-act="resume"]').click());
  await page.waitForTimeout(250);
}

// open NPC dialogue with postmaster Pip (walk to his stall first — teleport for determinism)
await evalJS(() => {
  const p = window.MB.app.worldScene.player;
  p.pos.set(1.2, 0, -4.5);
  p.model.position.set(1.2, 0, -4.5);
});
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(600);
const dlgOpen = await evalJS(() => !!document.querySelector('.dlg-card'));
console.log('dialogue opens:', dlgOpen);
if (dlgOpen) {
  await page.waitForTimeout(2200);           // typewriter
  await evalJS(() => document.querySelector('.dlg-continue')?.click());
  await page.waitForTimeout(2500);
  await evalJS(() => document.querySelector('.dlg-continue')?.click());
  await page.waitForTimeout(400);
  await evalJS(() => document.querySelector('.dlg-continue')?.click());
  await page.waitForTimeout(400);
  // accept first offer if any
  const accepted = await evalJS(() => {
    const btns = [...document.querySelectorAll('.dlg-choice')];
    const primary = btns.find((b) => b.classList.contains('primary'));
    primary?.click();
    return !!primary;
  });
  console.log('accepted an offer:', accepted);
  console.log('active mission:', await evalJS(() => window.MB.app.worldScene.delivery.active?.def?.title ?? null));
}

// force-complete W1 main missions, simulate jet arrival
await evalJS(() => {
  const { save } = window.MB.app;
  for (const m of ['w1_m1', 'w1_m2', 'w1_m3']) save.markMission(m);
  save.save();
  window.MB.app.worldScene._onWorldComplete('w1', 0);
});
await page.waitForTimeout(300);
console.log('jet spawned:', await evalJS(() => window.MB.app.worldScene.jet.state));

// commit the whole next-world transition (bypass the boarding cinematic)
await evalJS(() => {
  const sm = window.MB.app.game.scene;
  sm.stop('World');
  sm.stop('HUD');
  sm.start('Transition', { toWorld: 'w2' });
});
await page.waitForTimeout(2000);
step('transition');
console.log('transition scene active:', await evalJS(() => !!document.querySelector('.world-card')));
if (await evalJS(() => !!document.querySelector('.world-card'))) {
  await evalJS(() => document.querySelector('[data-act="go"]')?.click());
  await page.waitForTimeout(2200);
} else {
  // auto-advance fallback
  await page.waitForTimeout(6500);
}
step('world2');
console.log('now in world 2:', await evalJS(() => window.MB.app.worldScene?.worldId));

// jump straight to W5 and into the boss fight for the finale check
await evalJS(() => {
  const sm = window.MB.app.game.scene;
  sm.stop('World');
  sm.stop('HUD');
  sm.start('World', { worldId: 'w5', entry: 'first' });
});
await page.waitForTimeout(2800);
step('world5');
console.log('now in world 5:', await evalJS(() => window.MB.app.worldScene?.worldId));

// accept the finale mission programmatically, then walk into the arena
await evalJS(() => {
  const ws = window.MB.app.worldScene;
  const mission = ws.worldDef.missions.find((m) => m.id === 'w5_m3');
  ws.delivery.accept(mission);
  const p = ws.player;
  const arena = ws.worldDef.arena;
  p.pos.set(arena.cx, 0, arena.cz + 1);
  p.model.position.set(arena.cx, 0, arena.cz + 1);
});
await page.waitForTimeout(1000);
console.log('boss spawned:', await evalJS(() => !!window.MB.app.worldScene.boss));
console.log('boss state:', await evalJS(() => window.MB.app.worldScene.boss?.state));

// kill the boss (simulate a long fight)
await evalJS(() => {
  const boss = window.MB.app.worldScene.boss;
  boss.hp = 1;
  window.MB.app.worldScene.damage.applyToEnemy(boss, 99999, { knock: 0, isCrit: true });
});
await page.waitForTimeout(3600);
step('victory');
console.log('victory screen:', await evalJS(() => !!document.querySelector('.victory-card')));

// credits from victory
await evalJS(() => document.querySelector('[data-act="credits"]')?.click());
await page.waitForTimeout(600);
console.log('credits visible:', await evalJS(() => !!document.querySelector('.credits-scroll')));
console.log('credits include Arif Alexander:', await evalJS(() => document.body.innerText.includes('ARIF ALEXANDER')));
await page.screenshot({ path: '/tmp/opencode/deep-smoke.png' });

await browser.close();

console.log('\n==== ERRORS (' + errors.length + ') ====');
for (const e of errors.slice(0, 20)) console.log(e);
console.log('\n==== TAIL ====\n' + logs.slice(-10).join('\n'));
process.exit(errors.length ? 1 : 0);
