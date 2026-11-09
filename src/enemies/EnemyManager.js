// Spawns and manages pooled enemies from world "enemyZones" definitions,
// district respawn timers, orb drops, boss arena hooks, and target queries.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { Enemy } from './Enemy.js';
import { makeOrb } from '../render3/ProceduralModels.js';
import { CONFIG } from '../core/Constants.js';

const MAX_ORBS = 30;

export class EnemyManager {
  constructor(worldScene) {
    this.scene = worldScene;
    this.zones = worldScene.worldDef.enemyZones ?? [];
    this.enemies = [];
    this.arenaBoss = null;      // set during final boss fight
    this.pool = { grunt: [], runner: [], brute: [], shooter: [], elite: [], beast: [] };
    this.respawnTimer = CONFIG.enemyRespawn;

    // XP / coin / heart orbs pooled
    this.orbs = [];
    this.orbsFree = [];
    this._buildOrbPool();
    this._spawnAll();
  }

  _buildOrbPool() {
    for (let i = 0; i < MAX_ORBS; i++) {
      const kind = 'xp';
      const mesh = makeOrb(kind);
      mesh.visible = false;
      this.scene.worldBase.scene.add(mesh);
      this.orbs.push({ mesh, alive: false, kind });
    }
  }

  _spawnAll() {
    for (const zone of this.zones) {
      for (const spec of zone.archs) {
        for (let i = 0; i < spec.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (zone.radius * 0.6);
          this.spawn(spec.arch, { x: zone.cx + Math.cos(angle) * r, z: zone.cz + Math.sin(angle) * r });
        }
      }
    }
  }

  spawn(arch, point) {
    if (this.enemies.filter((e) => e.alive).length >= CONFIG.maxActiveEnemies) return null;
    const enemy = new Enemy(this.scene, {
      arch,
      worldIndex: this.scene.worldIndex,
      anchor: point,
      palette: null,
    });
    enemy.homePos.set(point.x, 0, point.z);
    this.scene.worldBase.scene.add(enemy.model);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnBoss(arch, point) {
    const boss = new Enemy(this.scene, { arch: 'elite', worldIndex: 4, anchor: point });
    boss.isBoss = true;
    this.scene.worldBase.scene.add(boss.model);
    this.enemies.push(boss);
    this.arenaBoss = boss;
    return boss;
  }

  getTargets() {
    return this.enemies.filter((e) => e.alive);
  }

  get nearest() {
    let best = null;
    let bestD = Infinity;
    const p = this.scene.player.pos;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = e.pos.distanceToSquared(p);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  update(dt, ctx) {
    const px = this.scene.player.pos.x;
    const pz = this.scene.player.pos.z;

    // orb pickup magnet
    this._updateOrbs(dt, px, pz);

    for (const e of this.enemies) {
      if (!e.alive) {
        if (e.model && e.model.parent) {
          e.model.scale.multiplyScalar(Math.exp(-dt * 6));
          if (e.model.scale.x < 0.01) {
            e.model.geometry?.dispose?.();
            e.model.removeFromParent();
            e.model = null;
          }
        }
        continue;
      }
      // far-culling: beyond 55m, skip sim but keep mesh visible if <90m
      const distSq = (e.pos.x - px) ** 2 + (e.pos.z - pz) ** 2;
      if (distSq > 90 * 90) continue;
      e.update(dt, {
        player: this.scene.player,
        onAttack: (enemy) => this._resolveAttack(enemy, ctx),
      });
    }
  }

  _resolveAttack(enemy) {
    const player = this.scene.player;
    if (!player) return;
    if (enemy.arch === 'shooter') {
      const origin = enemy.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
      const dir = player.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin).normalize();
      this.scene.projectiles?.spawn({
        origin, direction: dir, speed: 13, dmg: enemy.atk, color: 0x9fd6ff,
      });
      app.audio.sfx('spit');
      return;
    }
    const facing = enemy.facing;
    const origin = enemy.pos;
    const arc = 1.1;
    const radius = enemy.arch === 'brute' || enemy.arch === 'elite' ? 2.5 : 1.85;
    const fx = Math.sin(facing);
    const fz = Math.cos(facing);
    const px = player.pos.x - origin.x;
    const pz = player.pos.z - origin.z;
    const dist = Math.hypot(px, pz);
    if (dist > radius + 0.4) return;
    const angle = Math.atan2(px, pz) - facing;
    const norm = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(norm) > arc) return;

    this.scene.damage.applyToPlayer(enemy.atk, { fromPos: origin });
  }

  _updateOrbs(dt, px, pz) {
    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      const dx = px - orb.mesh.position.x;
      const dz = pz - orb.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.1) {
        orb.mesh.position.x += dx * dt * 6;
        orb.mesh.position.z += dz * dt * 6;
      }
      orb.mesh.position.y += Math.sin((this.scene.t ?? 0) * 3 + orb.mesh.id) * dt * 0.15;
      orb.mesh.rotation.y += dt * 2.4;
      if (dist < CONFIG.pickupRadius) {
        this._collectOrb(orb);
      }
    }
  }

  spawnOrb(pos, kind = 'xp') {
    for (const orb of this.orbs) {
      if (orb.alive) continue;
      orb.alive = true;
      orb.kind = kind;
      orb.mesh.material.color?.setHex(kind === 'coin' ? 0xffd34d : kind === 'heart' ? 0xff5d73 : 0x6ee7a0);
      orb.mesh.position.set(pos.x + (Math.random() - 0.5), 0.7 + Math.random() * 0.3, pos.z + (Math.random() - 0.5));
      orb.mesh.visible = true;
      return orb;
    }
    return null;
  }

  _collectOrb(orb) {
    orb.alive = false;
    orb.mesh.visible = false;
    const stats = this.scene.player.stats;
    if (orb.kind === 'xp') stats.addXp(8);
    else if (orb.kind === 'coin') stats.addCoins(6);
    else if (orb.kind === 'heart') stats.heal(14);
    app.audio.sfx(orb.kind === 'coin' ? 'coin' : 'pickup');
  }

  counts() {
    let alive = 0;
    for (const e of this.enemies) if (e.alive) alive++;
    return alive;
  }

  reset() {
    for (const e of this.enemies) {
      if (e.model?.parent) e.model.removeFromParent();
    }
    this.enemies = [];
    for (const orb of this.orbs) {
      orb.alive = false;
      orb.mesh.visible = false;
    }
  }
}
