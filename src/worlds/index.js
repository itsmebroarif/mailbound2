// Aggregated content: missions + collectible totals used by journal/aggregates.

import w1 from './World1.js';
import w2 from './World2.js';
import w3 from './World3.js';
import w4 from './World4.js';
import w5 from './World5.js';

const WORLDS = { w1, w2, w3, w4, w5 };

export const WORLD_DATA = WORLDS;

export const MISSIONS_ALL = Object.fromEntries(
  Object.values(WORLDS).map((w) => [w.id, w.missions ?? []]),
);

export const COLLECTIBLE_TOTALS = Object.fromEntries(
  Object.values(WORLDS).map((w) => [w.id, (w.collectibles ?? []).length]),
);

export function getWorldData(id) {
  return WORLDS[id] ?? WORLDS.w1;
}
