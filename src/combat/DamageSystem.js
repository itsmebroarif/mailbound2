// Damage application for both factions. Owns i-frames, dodges, damage numbers,
// hit particles and knockback, so player & enemy code stays tiny.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { spawnConfetti } from '../render3/Effects.js';

export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
  }

  applyToPlayer(dmg, { fromPos } = {}) {
    const { player } = this.scene;
    if (!player) return false;
    const s = player.stats;
    if (s.invulnT > 0) return false;

    // dodge roll (item-granted)
    if (Math.random() < s.dodgeChance) {
      this.scene.vfx.spawnGhost(player.pos, { color: 0xbfe8ff });
      app.audio.sfx('dash', { vol: 0.7 });
      return false;
    }

    s.hp = Math.max(0, s.hp - dmg);
    s.lastHitAt = this.scene.t;
    s.invulnT = 0.8; // CONFIG.invulnTime

    // knockback
    if (fromPos) {
      const dir = player.pos.clone().sub(fromPos).setY(0).normalize();
      player.applyKnockback(dir, 5.5);
    }
    app.audio.sfx('hurt');
    this.scene.camera?.shake(0.55);
    this.scene.vfx.spawnBurst(player.pos.clone().add({ x: 0, y: 1.4, z: 0 }), {
      color: 0xff5d73, count: 8, speed: 3, life: 0.35,
    });
    const vig = document.getElementById('vignette');
    vig?.classList.add('hurt');
    setTimeout(() => vig?.classList.remove('hurt'), 300);
    app.bus.emit('player-hurt', s.hp);

    if (s.hp <= 0) {
      app.audio.sfx('enemy_die');
      app.bus.emit('player-death');
    }
    return true;
  }

  applyToEnemy(enemy, dmg, {
    knock = 2, knockDir, isCrit = false, stagger = true, silent = false,
  } = {}) {
    if (!enemy?.alive) return 0;
    // boss belly weak-point takes 2.5×
    let amount = dmg;
    if (enemy.bellyExposed) amount *= 2.5;
    amount = Math.max(1, Math.round(amount));

    enemy.hp -= amount;
    enemy.flashT = 0.12;

    const { vfx } = this.scene;
    if (!silent && app.save.settings.showDamage) {
      vfx.spawnDamageNumber(enemy.pos, amount, {
        color: isCrit ? '#ffd34d' : '#ffffff',
        crit: isCrit,
      });
    }
    vfx.spawnBurst(enemy.pos.clone().add({ x: 0, y: 1.1, z: 0 }), {
      color: enemy.hurtColor ?? 0xffd34d,
      count: 6, speed: 4, life: 0.3,
    });
    app.audio.sfx(enemy.hp <= 0 ? 'enemy_die' : 'hit');

    if (knockDir || (enemy.pos && knock > 0)) {
      const dir = knockDir?.clone?.() ?? null;
      const away = dir ? dir.clone().setY(0) : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
      if (away.lengthSq() < 1e-6) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      away.normalize();
      enemy.vel.x += away.x * knock;
      enemy.vel.z += away.z * knock;
    }
    if (stagger && amount >= 6) enemy.ai?.stagger();
    app.bus.emit('enemy-damaged', { enemy, amount });

    if (enemy.hp <= 0) {
      if (enemy.isBoss && enemy.die) enemy.die();
      else this._killEnemy(enemy);
    }
    return amount;
  }

  _killEnemy(enemy) {
    enemy.alive = false;
    enemy.ai?.setState('dead');
    const { vfx } = this.scene;
    vfx.spawnBurst(enemy.pos.clone().add({ x: 0, y: 1.2, z: 0 }), {
      color: enemy.hurtColor ?? 0x9d4edd, count: 22, speed: 6, life: 0.6,
    });
    if (enemy.isBoss) {
      spawnConfetti(vfx, enemy.pos.clone().add({ x: 0, y: 2, z: 0 }), 90);
    } else {
      // reward orbs (xp always, coins & hearts chance-based)
      this.scene.enemyManager?.spawnOrb?.(enemy.pos, 'xp');
      if (Math.random() < 0.35) this.scene.enemyManager?.spawnOrb?.(enemy.pos, 'coin');
      if (Math.random() < 0.14) this.scene.enemyManager?.spawnOrb?.(enemy.pos, 'heart');
    }
    app.bus.emit('enemy-killed', enemy);
  }
}
