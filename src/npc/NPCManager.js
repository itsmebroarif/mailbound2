// NPC manager: spawn villagers, idle behaviors, nearest interactable lookup.

import { app } from '../core/App.js';
import { NPC } from './NPC.js';

export class NPCManager {
  constructor(worldScene) {
    this.scene = worldScene;
    this.list = (worldScene.worldDef.npcs ?? []).map((n, i) => new NPC(worldScene, n, i));
  }

  update(dt) {
    const playerPos = this.scene.player.pos;
    for (const n of this.list) n.update(dt, playerPos);
  }

  nearest(range = 2.6) {
    const playerPos = this.scene.player.pos;
    let best = null;
    let bestD = range;
    for (const n of this.list) {
      const d = n.pos.distanceTo(playerPos);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  byId(id) {
    return this.list.find((n) => n.id === id) ?? null;
  }

  all() {
    return this.list;
  }

  count() {
    return this.list.length;
  }
}
