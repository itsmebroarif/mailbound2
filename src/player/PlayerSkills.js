// PlayerSkills — the 4 courier skills, with level-gated unlocks.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { SKILLS, CONFIG } from '../core/Constants.js';
import { sectorHits, sphereHits, segmentHits } from '../combat/HitboxSystem.js';

export class PlayerSkills {
  constructor(player) {
    this.player = player;
    this.cooldowns = [0, 0, 0, 0];
    this._boost = [0, 0, 0, 0];
  }

  unlockedCount() {
    const level = app.save.state.player.level;
    return SKILLS.filter((s) => level >= s.unlockLvl).length;
  }

  update(dt) {
    for (let i = 0; i < 4; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    }
    const input = app.input;
    const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
    for (let i = 0; i < 4; i++) {
      if (input.pressed(keys[i])) this.cast(i);
    }
  }

  cast(index) {
    const p = this.player;
    const s = SKILLS[index];
    const level = app.save.state.player.level;
    if (!s) return;
    if (level < s.unlockLvl) {
      app.ui.toast(`Terbuka di kurir level ${s.unlockLvl}`, { icon: '🔒', title: s.name });
      return;
    }
    if (this.cooldowns[index] > 0) {
      app.ui.toast(`${Math.ceil(this.cooldowns[index])}s tersisa`, { icon: '⏳', title: s.name });
      return;
    }
    if (p.stats.energy < s.energy) {
      app.ui.toast('Energi kurir habis!', { icon: '💧', title: s.name });
      return;
    }

    p.stats.energy -= s.energy;
    this.cooldowns[index] = s.cd;
    this._flash(index, 'used');

    if (s.id === 'quick_slash') this._quickSlash();
    else if (s.id === 'spin_blade') this._spinBlade();
    else if (s.id === 'shadow_dash') this._shadowDash();
    else if (s.id === 'courier_strike') this._courierStrike();
  }

  /* ---------------- skills ---------------- */
  _damage(target, mult, knock, crit = false) {
    const p = this.player;
    this.player.ctx.damage.applyToEnemy(target, p.stats.atk * mult, { knock, knockDir: null, isCrit: crit });
  }

  _quickSlash() {
    const p = this.player;
    const dashDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));

    // a short explosive hop forward + 3 quick sector pulses
    p.vel.x = dashDir.x * 24;
    p.vel.z = dashDir.z * 24;
    p.controller.dashT = 0; // skills don't chain the dash-attack window

    app.audio.sfx('swing');
    const targets = p.ctx.enemies.getTargets();
    const hits = sectorHits(p.pos, p.facing, 3.6, Math.PI, targets); // 180° cone
    for (const t of hits) this._damage(t, 0.95, 5, false);
    p.ctx.vfx.spawnSlash(p.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), p.facing - Math.PI / 2, { color: 0xffce4b, scale: 1.25 });
    p.ctx.camera?.kick(4);
  }

  _spinBlade() {
    const p = this.player;
    app.audio.sfx('skill_spin');
    const ticks = 2;
    for (let i = 0; i < ticks; i++) {
      setTimeout(() => {
        const targets = p.ctx.enemies.getTargets();
        const hits = sectorHits(p.pos, 0, 3.0, Math.PI, targets);
        for (const t of hits) this._damage(t, 1.3, 7, i === ticks - 1);
        p.ctx.vfx.spawnSlash(p.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), p.facing - Math.PI / 2 + i * 1.2, { color: 0x9fd0ff, scale: 2 });
        p.ctx.vfx.spawnRing(p.pos.clone(), { color: 0x9fd0ff, r1: 3.4, life: 0.32 });
      }, i * 260);
    }
    p.ctx.camera?.shake(0.25);
  }

  _shadowDash() {
    const p = this.player;
    const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    const start = p.pos.clone();
    const end = start.clone().addScaledVector(dir, 8);
    // damage anything on the line
    const targets = p.ctx.enemies.getTargets();
    const hits = segmentHits(start, end, 1.3, targets);
    for (const t of hits) this._damage(t, 1.15, 6, false);

    p.pos.copy(end);
    p.pos.y = p.ctx.worldBase.groundHeightAt(end.x, end.z, end.y);
    app.audio.sfx('dash');
    p.ctx.vfx.spawnGhost(start, { color: 0xc58cff, life: 0.4 });
    p.ctx.vfx.spawnGhost(start.clone().lerp(end, 0.5), { color: 0xc58cff, life: 0.4 });
    p.ctx.vfx.spawnGhost(end, { color: 0xc58cff, life: 0.4 });
    p.ctx.camera?.kick(7);
  }

  _courierStrike() {
    const p = this.player;
    // launch into a rising arc…
    p.vel.y = 12.5;
    p.vel.x *= 0.25;
    p.vel.z *= 0.25;
    p.isGrounded = false;
    app.audio.sfx('skill4');
    p.ctx.combat.addSlowmo(0.9);
    p.ctx.combat.addHitStop(0.12);

    // …and the slam lands moment later (airborne arc sells the impact).
    setTimeout(() => {
      const targets = p.ctx.enemies.getTargets();
      const hits = sphereHits(p.pos, 4.4, targets);
      for (const t of hits) this._damage(t, 2.6, 12, true);
      p.ctx.vfx.spawnRing(p.pos.clone(), { color: 0xffce4b, r1: 5.6, life: 0.5 });
      p.ctx.vfx.spawnBurst(p.pos.clone(), { color: 0xffce4b, count: 24, speed: 7, life: 0.5 });
      p.ctx.vfx.spawnRing(p.pos.clone(), { color: 0xff5d73, r1: 3.5, life: 0.4 });
      p.ctx.camera?.shake(0.85);
      app.audio.sfx('hit_hard');
    }, 640);
  }

  describe(i) {
    return SKILLS[i];
  }

  _flash(index, kind) {
    app.bus.emit('skill-cast', { index, kind });
  }

  getCooldown(index) {
    return this.cooldowns[index];
  }

  getCooldownMax(index) {
    return SKILLS[index].cd;
  }
}
