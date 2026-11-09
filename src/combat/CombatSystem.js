// CombatSystem: orchestration layer between player/enemy/hitbox/damage.
// Keeps WorldScene lean and gives worlds one entry point for combat ticks.

import { CONFIG } from '../core/Constants.js';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitStopT = 0;  // brief world freeze on courier strike
    this.slowmoT = 0;
  }

  get worldTimeScale() {
    if (this.hitStopT > 0) return 0.05;
    if (this.slowmoT > 0) return 0.45;
    return 1;
  }

  addHitStop(t) {
    this.hitStopT = Math.max(this.hitStopT, t);
  }

  addSlowmo(t) {
    this.slowmoT = Math.max(this.slowmoT, t);
  }

  update(dt) {
    if (this.hitStopT > 0) this.hitStopT -= dt;
    if (this.slowmoT > 0) this.slowmoT -= dt;
  }
}


