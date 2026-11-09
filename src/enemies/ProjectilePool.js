// Pooled projectiles with team routing and rocket-style AoE blasts.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { sphereHits } from '../combat/HitboxSystem.js';

const MAX = 32;

export class ProjectilePool {
  constructor(scene3) {
    this.scene = scene3;
    this.fx = null;            // injected by WorldScene: Effects instance
    this.shake = null;         // injected by WorldScene: camera shake
    this.aoeDamage = null;     // injected: (enemy, dmg, point) => void
    this.list = [];
    this.geo = new THREE.SphereGeometry(0.2, 8, 6);
    for (let i = 0; i < MAX; i += 1) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: 0x9fd6ff }));
      m.visible = false;
      this.scene.add(m);
      this.list.push({
        mesh: m,
        alive: false,
        vel: new THREE.Vector3(),
        life: 0,
        dmg: 0,
        owner: 'enemy',
        blastRadius: 0,
        blastDmg: 0,
      });
    }
  }

  spawn({ origin, direction, speed = 14, dmg = 12, color = 0x9fd6ff, owner = 'enemy', blastRadius = 0, blastDmg = 0 }) {
    for (const p of this.list) {
      if (p.alive) continue;
      p.alive = true;
      p.mesh.visible = true;
      p.mesh.material.color.set(color);
      p.mesh.position.copy(origin).addScaledVector(direction, 0.5);
      p.vel.copy(direction).normalize().multiplyScalar(speed);
      p.life = 4;
      p.dmg = dmg;
      p.owner = owner;
      p.blastRadius = blastRadius;
      p.blastDmg = blastDmg;
      // rockets are bigger
      p.mesh.scale.setScalar(blastRadius > 0 ? 1.5 : 1);
      return p;
    }
    return null;
  }

  update(dt, targets) {
    // targets: { player, enemies } — team routing done per projectile owner
    const hits = [];
    for (const p of this.list) {
      if (!p.alive) continue;
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 4;

      if (p.owner === 'player') {
        // hits enemies → explode
        const enemies = targets?.enemies ?? [];
        let impacted = p.life <= 0 ? p.mesh.position : null;
        for (const e of enemies) {
          const dx = p.mesh.position.x - e.pos.x;
          const dz = p.mesh.position.z - e.pos.z;
          if (dx * dx + dz * dz < 1.15) {
            impacted = p.mesh.position.clone();
            break;
          }
        }
        if (impacted) {
          this._explode(p, impacted, targets?.enemies);
          continue;
        }
      } else {
        if (targets?.player) {
          const pp = targets.player.pos;
          const dx = p.mesh.position.x - pp.x;
          const dz = p.mesh.position.z - pp.z;
          const dy = p.mesh.position.y - (pp.y + 1);
          if (dx * dx + dz * dz + dy * dy < 1.15) {
            hits.push({ projectile: p, target: targets.player });
            this._kill(p);
            continue;
          }
        }
        if (p.life <= 0) this._kill(p);
      }
    }
    return hits;
  }

  _explode(p, point, enemies) {
    const radius = p.blastRadius || 3.2;
    const dmg = p.blastDmg || p.dmg;

    const targets = enemies ?? [];
    for (const e of targets) {
      const d = Math.hypot(e.pos.x - point.x, e.pos.z - point.z);
      if (d > radius) continue;
      const falloff = 1 - (d / radius) * 0.55;
      const dealt = Math.max(1, Math.round(dmg * falloff));
      if (this.aoeDamage) this.aoeDamage(e, dealt, point);
      else {
        e.hp -= dealt;
        if (e.hp <= 0 && !e.isBoss && e.die) e.die();
      }
    }

    if (this.fx) {
      this.fx.spawnBurst(point, { color: 0xffb060, count: 30, speed: 9, life: 0.65 });
      this.fx.spawnRing(point, { color: 0xff8a3d, r1: radius + 1.6, life: 0.5 });
    }
    this.shake?.(0.85);
    try { app.audio?.sfx('explosion'); } catch { /* audio optional */ }
    this._kill(p, true);
  }

  _kill(p, silent = false) {
    p.alive = false;
    p.mesh.visible = false;
  }

  clear() {
    for (const p of this.list) this._kill(p);
  }

  dispose() {
    for (const p of this.list) {
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.geo.dispose();
  }
}
