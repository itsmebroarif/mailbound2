// Central game-flow helpers: switching between Phaser scenes (menu, world,
// transition) without UI screens needing scene references directly.

import { app } from './App.js';
import { WORLD_ORDER, WORLD_META } from './Constants.js';

function scene(target, data) {
  const sm = app.game.scene;
  sm.stop('World');
  sm.stop('Transition');
  sm.stop('HUD');
  sm.start(target, data);
}

export function toMenu() {
  scene('MainMenu');
}

export function startCutscene(worldId = 'w1') {
  app.ui.closeAll(true);
  app.ui.modalOpen = false;
  scene('Cutscene', { toWorld: worldId });
}

export function playIntro(worldIdx = 0, { skipCard = false } = {}) {
  const id = WORLD_ORDER[Math.max(0, Math.min(worldIdx, WORLD_ORDER.length - 1))];
  scene('World', {
    worldId: id,
    entry: 'first',
    skipCard,
  });
}

export function travelTo(worldIdIdx) {
  const id = WORLD_ORDER[Math.max(0, Math.min(worldIdIdx, WORLD_ORDER.length - 1))];
  scene('Transition', { toWorld: id });
}

export function enterWorld(worldId, entry = 'landing') {
  scene('World', { worldId, entry });
}

export function worldName(id) {
  return WORLD_META[id]?.name ?? id;
}

export function worldSubtitle(id) {
  return WORLD_META[id]?.subtitle ?? '';
}

export function resumeWorld() {
  app.ui.closeAll();
  app.ui.modalOpen = false;
}

// Called by WorldScene when death occurs.
export function died() {
  const s = app.save.state;
  const idx = s.world ?? 0;
  const id = WORLD_ORDER[Math.max(0, Math.min(idx, WORLD_ORDER.length - 1))];
  scene('World', { worldId: id, entry: 'respawn' });
}
