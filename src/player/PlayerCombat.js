// PlayerCombat: pointer-locked LMB combo builder (3-hit chain), dash-attack
// weave, air plunge, RMB lock-on, damage via HitboxSystem + DamageSystem.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';
import { sectorHits, sphereHits } from '../combat/HitboxSystem.js';

const COMBO_DUR = [0.34, 0.36, 0.5];

export class PlayerCombat {
  constructor(player) {
    this.player = player;

    this.comboIdx = 0;             // next attack in chain
    this.currentStep = 0;         // step being performed
    this.comboTimer = 0;           // chain window after a swing ends
    this.attackT = 0;              // time left in current swing
    this.attackDur = COMBO_DUR[0];
    this.hitDone = false;
    this.dashAttack = false;       // this swing is a dash attack
    this.bufferNext = false;
    this.airPlunge = false;
    this.lockTarget = null;
  }

  get attacking() {
    return this.attackT > 0;
  }

  get swingProgress() {
    return this.attacking ? 1 - this.attackT / this.attackDur : 0;
  }

  update(dt) {
    const input = app.input;

    if (this.attackT > 0) {
      this.attackT -= dt;
      const elapsed = this.attackDur - Math.max(0, this.attackT);
      if (!this.hitDone && elapsed >= CONFIG.attackHitAt) {
        this.hitDone = true;
        this._applyHit();
      }
      if (this.attackT <= 0) {
        this.comboTimer = CONFIG.comboWindow;
        if (this.bufferNext) {
          this.bufferNext = false;
          this.tryAttack();
        }
      }
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboIdx = 0;
    }

    if (input.takeClickLeft() && this.player.weapons?.isMelee()) this.tryAttack();
    if (input.takeClickRight() && this.player.weapons?.isMelee()) this.toggleLock();

    if (this.lockTarget) {
      const t = this.lockTarget;
      if (!t.alive || this.player.pos.distanceTo(t.pos) > CONFIG.lockOnRange + 9) {
        this.lockTarget = null;
      }
    }
  }

  tryAttack() {
    const p = this.player;
    if (!p.weapons?.isMelee()) return;   // guns fire instead of sword swings
    if (this.attackT > 0) {
      // buffer the next hit if we're far enough into the current swing
      if (this.attackDur - this.attackT > this.attackDur * 0.45) this.bufferNext = true;
      return;
    }

    if (!p.isGrounded) {
      this.airPlunge = true;
      p.vel.y = -27;
      this.attackDur = COMBO_DUR[0];
      this.attackT = this.attackDur;
      this.hitDone = true; // hit resolves on landing via resolveLandingPlunge()
      this.currentStep = 0;
      this._announce('PLUNGE!');
      return;
    }

    this.dashAttack = p.controller.dashAttackReadyT > 0;
    this.currentStep = this.dashAttack ? 2 : this.comboIdx;
    this.attackDur = COMBO_DUR[this.currentStep];
    this.attackT = this.attackDur;
    this.hitDone = false;

    this.comboIdx = this.dashAttack ? 0 : (this.comboIdx + 1) % 3;
    p.swingArmT = this.attackDur;
    app.audio.sfx('swing');
  }

  resolveLandingPlunge() {
    if (!this.airPlunge) return;
    this.airPlunge = false;
    const p = this.player;
    const targets = p.ctx.enemies.getTargets();
    const hits = sphereHits(p.pos, 2.9, targets);
    this._dealDamage(hits, 1.6, 9, new THREE.Vector3(0, 0, 0));
    p.ctx.vfx.spawnRing(p.pos.clone(), { color: 0xffce4b, r1: 4.4, life: 0.42 });
    p.ctx.camera?.shake(0.5);
    app.audio.sfx('hit_hard');
  }

  _applyHit() {
    const p = this.player;
    const mult = this.dashAttack ? 1.9 : CONFIG.comboDmg[this.currentStep];
    const airBonus = p.isGrounded ? 1 : 1.2;
    const targets = p.ctx.enemies.getTargets();
    const hits = sectorHits(p.pos, p.facing, CONFIG.attackRange, CONFIG.attackHalfAngle, targets);
    p.ctx.vfx.spawnSlash(
      p.pos.clone().add(new THREE.Vector3(Math.sin(p.facing) * 1.35, 1.05, Math.cos(p.facing) * 1.35)),
      p.facing - Math.PI / 2,
      { color: this.dashAttack ? 0x9fd0ff : 0xbfe8ff },
    );
    if (hits.length === 0) {
      p.ctx.camera?.kick(2.5);
      return;
    }
    this._dealDamage(hits, mult * airBonus, 4 + mult * 4, new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)));
    p.ctx.camera?.shake(0.16 + hits.length * 0.05);
    p.swingStep = this.currentStep;
    if (this.currentStep >= 2) p.ctx.referenceSlowmo(0.03);
  }

  _dealDamage(targets, mult, knock, facingDir) {
    const p = this.player;
    const dmg = p.stats.atk * mult;
    for (const t of targets) {
      const dir = new THREE.Vector3(t.pos.x - p.pos.x, 0, t.pos.z - p.pos.z);
      if (dir.lengthSq() < 1e-4) dir.copy(facingDir);
      dir.normalize();
      p.ctx.damage.applyToEnemy(t, dmg, { knock, knockDir: dir, isCrit: this.currentStep >= 2 });
    }
  }

  toggleLock() {
    const p = this.player;
    if (this.lockTarget) {
      this.lockTarget = null;
      app.audio.sfx('ui_cancel');
      return;
    }
    const list = p.ctx.enemies.getTargets();
    let best = null;
    let bestD = Infinity;
    for (const e of list) {
      const to = new THREE.Vector3(e.pos.x - p.pos.x, 0, e.pos.z - p.pos.z);
      const distSq = to.lengthSq();
      if (distSq > CONFIG.lockOnRange * CONFIG.lockOnRange) continue;
      const ang = Math.atan2(to.x, to.z) - p.facing;
      const norm = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
      const score = distSq * (0.55 + norm);
      if (score < bestD) { bestD = score; best = e; }
    }
    this.lockTarget = best;
    if (best) app.audio.sfx('ui_confirm');
  }

  _announce(txt) {
    app.ui.toast(txt, { icon: '⚔️', title: 'MAJU!' });
  }
}
