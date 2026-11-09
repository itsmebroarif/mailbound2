// UYEHH — the Jelly Slime. Sweet exterior (sparkling eyes, blush), vicious
// interior (belly resonance when exposed). Final boss of Coastal Paradise.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { makeSlime } from '../render3/ProceduralModels.js';
import { lerpAngle } from './EnemyAI.js';

const STATE = { intro: 'intro', hop: 'hop', telegraph: 'telegraph', air: 'air', land: 'land', spit: 'spit', split: 'split', belly: 'belly', dead: 'dead' };

export class BossSlime {
  constructor(ctx, point, onDefeat) {
    this.isBoss = true;
    this.ctx = ctx;
    this.onDefeat = onDefeat;
    this.maxHp = Math.round(260 * (1 + app.save.state.player.level * 0.1));
    this.hp = this.maxHp;
    this.atk = 18;
    this.radius = 1.15;
    this.hurtColor = 0x5efff2;

    this.pos = new THREE.Vector3(point.x, 0, point.z);
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.state = STATE.intro;
    this.stateT = 0;
    this.legT = 0;
    this.flashT = 0;
    this.alive = true;
    this.bellyExposed = false;
    this._enraged = false;
    this._splitA = false;
    this._splitB = false;
    this._attackTimer = 2.4;
    this._eyeBlinkT = 0;
    this._target = new THREE.Vector3();

    this.model = makeSlime();
    this.parts = this.model.userData.parts;
    this.model.position.copy(this.pos);
    this.model.scale.setScalar(1.6);
    ctx.worldBase.scene.add(this.model);

    // squash-stretch animation driver state
    this._squashPhase = 0;
  }

  update(dt, { player }) {
    if (!this.alive) {
      this.stateT += dt;
      if (this.stateT < 2.0) {
        const k = Math.max(0, 1 - this.stateT * 1.2);
        this.model.scale.set(1.6 + (1 - k) * 0.4, 1.6 * k, 1.6 + (1 - k) * 0.4);
        this.model.position.copy(this.pos);
      }
      return;
    }

    this.stateT += dt;
    this.legT += dt;
    if (this.flashT > 0) this.flashT -= dt;

    const toPlayer = player.pos.clone().sub(this.pos).setY(0);
    const dist = toPlayer.length();
    this.facing = lerpAngle(this.facing, Math.atan2(toPlayer.x, toPlayer.z), Math.min(1, dt * 4));

    const enrage = !this._enraged && this.hp <= this.maxHp * 0.3;
    if (enrage) {
      this._enraged = true;
      app.audio.sfx('slime_angry');
      this._setAngry(true);
      app.ui.toast('«UYEEEHH!!»', { icon: '💢', title: 'Uyehh' });
    }

    const bounceRate = this._enraged ? 1.5 : 1;
    if (this.stateTimer !== undefined) void this.stateTimer;
    this._attackTimer -= dt * bounceRate;

    // blinky eyes
    this._eyeBlinkT -= dt;
    if (this._eyeBlinkT <= 0) {
      this._eyeBlinkT = 2.2 + Math.random() * 2.6;
      this._blink();
    }

    switch (this.state) {
      case STATE.intro:
        this._bounceAnim(dt);
        if (this.stateT > 1.6) { this._switch(STATE.hop); app.audio.sfx('boss_intro'); }
        break;

      case STATE.hop:
        this.walkTowardPlayer(dt, dist);
        if (this._attackTimer <= 0) this._chooseAttack();
        break;

      case STATE.telegraph: {
        this._telegraph(dt);
        break;
      }

      case STATE.air: {
        this._airPhase(dt, player, dist);
        break;
      }

      case STATE.land: {
        this._landPhase(dt, player);
        break;
      }

      case STATE.spit: {
        this._spitPhase(dt, player);
        break;
      }

      case STATE.split: {
        this._splitSink(dt);
        break;
      }

      case STATE.belly: {
        this._bellyPhase(dt);
        break;
      }
    }

    this.model.position.copy(this.pos);
    if (!this.bellyExposed && this.state !== STATE.dead) {
      const s = 1.6 + Math.sin(this.legT * 3.2) * 0.1;
      this.model.scale.set(s, 1.6 / s, s);
    } else if (this.bellyExposed) {
      this.model.scale.set(1.75, 1.0, 1.75);
    }

    this.model.rotation.y = this.facing;
    app.bus.emit('boss-hp', { hp: Math.max(0, this.hp), max: this.maxHp });

    // phase splits
    const hpRatio = this.hp / this.maxHp;
    if (!this._splitA && hpRatio <= 0.66 && hpRatio > 0.33) { this._splitA = true; this._switch(STATE.split); }
    if (!this._splitB && hpRatio <= 0.33) { this._splitB = true; this._switch(STATE.split); }
  }

  /* ------------------------------------------------------------------ */
  walkTowardPlayer(dt, dist) {
    const stride = 3.2 + (this._enraged ? 1.6 : 0);
    this._bounceAnim(dt);
    if (this.pos.y > 0.01 || this._airborneLock) return;
    if (dist > 2.4) {
      const dir = this.playerDir().multiplyScalar(stride);
      this._hopToward(dir.x, dir.z, 5.2);
    }
  }

  playerDir() {
    const p = this.ctx.player.pos;
    const d = p.clone().sub(this.pos).setY(0);
    return d.lengthSq() > 1e-6 ? d.normalize() : new THREE.Vector3(0, 0, -1);
  }

  _bounceAnim(dt) {
    // stuck-squash idle feel between hops
    this.parts.body.position.y = 0.78 + Math.abs(Math.sin(this.legT * 5.6)) * 0.08;
  }

  _hopToward(dx, dz, vel) {
    this.vel.x = dx; this.vel.z = dz; this.vel.y = vel;
    this._airborneLock = true;
    this._switch(STATE.air);
    app.audio.sfx('slime_bounce', { up: 0 });
  }

  _chooseAttack() {
    const p = this.hp / this.maxHp;
    if (p < 0.66 && Math.random() < 0.34 && !this.bellyExposed) {
      this._switch(STATE.spit);
      return;
    }
    this._target.copy(this.ctx.player.pos);
    this._switch(STATE.telegraph);
    this._squashPhase = 0;
  }

  _telegraph(dt) {
    // squash down hard, quiver, then leap
    this._squashPhase += dt;
    const k = Math.min(1, this.stateT / 0.62);
    this.model.scale.set(1.6 + k * 0.65, 1.6 - k * 0.62, 1.6 + k * 0.65);
    this.parts.face.position.y = 0.12 - k * 0.09;
    if (this.stateT >= 0.62) {
      const dir = this._target.clone().sub(this.pos).setY(0);
      const len = Math.min(dir.length(), 9.5);
      dir.normalize().multiplyScalar(len);
      this._hopToward(dir.x, dir.z, 6.2);
    }
  }

  _airPhase(dt, player) {
    this.vel.y -= 17 * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.model.rotation.y = this.facing;
    if (this.pos.y <= 0 && this.vel.y < 0) {
      this.pos.y = 0;
      this.vel.y = 0;
      this._airborneLock = false;
      this._switch(STATE.land);
    }
  }

  _landPhase(dt, player) {
    if (this.stateT < 0.08) {
      app.audio.sfx('slam');
      this.ctx.vfx.spawnRing(this.pos.clone(), { color: 0x59d0c8, r1: 7.5, life: 0.5 });
      this.ctx.vfx.spawnBurst(this.pos.clone(), { color: 0x59d0c8, count: 24, speed: 8, life: 0.6 });
      this.ctx.camera?.shake(0.8);
      // amplitude damage band near impact
      const d = player.pos.clone().sub(this.pos).setY(0).length();
      if (d < 3.4 && player.isGrounded) {
        this.ctx.damage.applyToPlayer(this.atk, { fromPos: this.pos });
      }
      this._attackTimer = this._enraged ? 2.0 : 3.0;
    }
    // flop belly for a reward window
    if (this.stateT > 0.5) {
      this._switch(STATE.belly);
    }
  }

  _spitPhase(dt, player) {
    if (this.stateT < 0.55) {
      this.model.scale.set(1.5 + Math.sin(this.stateT * 30) * 0.12, 1.45, 1.5 + Math.sin(this.stateT * 30) * 0.12);
      return;
    }
    // three globs
    const origin = this.pos.clone().add(new THREE.Vector3(0, 0.75, 0));
    for (let i = -1; i <= 1; i++) {
      const dir = player.pos.clone().sub(origin).normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.36);
      this.ctx.projectiles.spawn({ origin, direction: dir, speed: 15, dmg: Math.round(this.atk * 0.75), color: 0x7be4d5 });
    }
    app.audio.sfx('spit');
    this._attackTimer = this._enraged ? 2.2 : 3.1;
    this._switch(STATE.hop);
  }

  _splitSink(dt) {
    if (this.stateT > 0.7 && !this._minionSpawned) {
      this._minionSpawned = true;
      for (const [dx, dz] of [[-1.6, 0.4], [1.6, 0.4], [0, -1.6]]) {
        this.ctx.enemyManager.spawn('runner', { x: this.pos.x + dx, z: this.pos.z + dz });
      }
      app.audio.sfx('slime_bounce', { up: 40 });
      app.ui.toast('Uyehh membelah diri!', { icon: '🫧', title: 'Uyehh' });
    }
    if (this.stateT > 1.1) {
      this._minionSpawned = false;
      this._switch(STATE.hop);
    }
  }

  _bellyPhase(dt) {
    if (!this.bellyExposed) {
      this.bellyExposed = true;
      this.parts.stamp.scale.setScalar(1);
      app.audio.sfx('slime_cute');
      this.ctx.vfx.spawnBurst(this.pos.clone().add({ x: 0, y: 0.8, z: 0 }), { color: 0xff8a8a, count: 14, speed: 4 });
      app.ui.toast('Perut Uyehh terbuka — kepal!!', { icon: '🎯', title: 'Uyehh' });
    }
    if (this.stateT > 2.4) {
      this.bellyExposed = false;
      this.parts.stamp.scale.setScalar(0.001);
      this._switch(STATE.hop);
    }
  }

  _blink() {
    const s = this.parts.eyeL.scale;
    const s2 = this.parts.eyeR.scale;
    s.y = 0.06;
    s2.y = 0.06;
    setTimeout(() => { s.y = 1; s2.y = 1; }, 160);
  }

  _setAngry(v) {
    this.parts.mouth.rotation.z = v ? 0 : Math.PI;
    this.parts.mouth.scale.setScalar(v ? 1.35 : 1);
  }

  _switch(s) {
    this.state = s;
    this.stateT = 0;
  }

  takeDamage(amount) {
    this.flashT = 0.1;
  }

  die() {
    this.alive = false;
    this.state = STATE.dead;
    this.stateT = 0;
    app.audio.sfx('enemy_die');
    app.audio.sfx('levelup');
    app.bus.emit('boss-end');
    this.onDefeat?.();
  }

  emitBite(amount = 12) {
    return amount;
  }
}
