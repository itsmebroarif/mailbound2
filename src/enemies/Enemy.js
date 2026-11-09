// Base enemy built on makeEnemy(). Handles model, physics, HP, stagger,
// damage flash, knockback and death cleanup.

import * as THREE from 'three';
import { makeEnemy } from '../render3/ProceduralModels.js';
import { EnemyAI, STATE } from './EnemyAI.js';

export class Enemy {
  constructor(ctx, spec) {
    this.ctx = ctx;               // WorldScene
    this.arch = spec.arch;
    this.worldIndex = spec.worldIndex ?? 0;
    const scaleMul = 1 + this.worldIndex * 0.22;
    const stats = Enemy.BASE[this.arch] ?? Enemy.BASE.grunt;

    this.maxHp = Math.round(stats.hp * scaleMul);
    this.hp = this.maxHp;
    this.atk = Math.round(stats.atk * scaleMul);
    this.speed = stats.speed;
    this.xp = Math.round(stats.xp * scaleMul);
    this.coins = stats.coins;
    this.attackRange = stats.attackRange;
    this.attackCd = stats.attackCd;
    this.patrolRadius = stats.patrolRadius;
    this.leashRadius = 26;
    this.hurtColor = stats.hurtColor;
    this.radius = stats.radius ?? 0.5;
    this.isBoss = false;

    this.homePos = new THREE.Vector3(spec.anchor.x, 0, spec.anchor.z);
    this.pos = new THREE.Vector3(spec.anchor.x, 0, spec.anchor.z);
    this.vel = new THREE.Vector3();
    this.facing = Math.random() * Math.PI * 2;
    this.flashT = 0;
    this.attackHitDone = false;
    this.alive = true;
    this.respawnAt = 0;
    this.phaseT = 0;
    this.legT = 0;

    this.model = makeEnemy(this.arch, { primary: stats.primary, secondary: stats.secondary });
    this.model.position.copy(this.pos);
    this.parts = this.model.userData.parts;
    this.model.traverse((m) => { m.userData.enemy = this; });

    this.ai = new EnemyAI(this);

    // ground blob shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(this.radius + 0.28, 20),
      new THREE.MeshBasicMaterial({ color: 0x0a0b1e, transparent: true, opacity: 0.4, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.02, 0);
    this.model.add(shadow);
  }

  static get BASE() {
    return {
      grunt: { hp: 42, atk: 8, speed: 3.3, xp: 22, coins: 5, attackRange: 1.7, attackCd: 1.35, patrolRadius: 4, primary: 0x9d4edd, secondary: 0x2a2334, hurtColor: 0xc77bff, radius: 0.5 },
      runner: { hp: 24, atk: 6, speed: 5.2, xp: 17, coins: 6, attackRange: 1.5, attackCd: 0.95, patrolRadius: 6, primary: 0xffa94d, secondary: 0x3a2a1c, hurtColor: 0xffd23a, radius: 0.38 },
      brute: { hp: 95, atk: 15, speed: 2.1, xp: 38, coins: 9, attackRange: 2.0, attackCd: 1.9, patrolRadius: 3, primary: 0x4f8f6b, secondary: 0x1d2b23, hurtColor: 0x7be3a7, radius: 0.7 },
      shooter: { hp: 30, atk: 10, speed: 2.9, xp: 26, coins: 7, attackRange: 12, attackCd: 1.6, patrolRadius: 5, primary: 0x59a6ff, secondary: 0x1c2a3a, hurtColor: 0x9fd6ff, radius: 0.44 },
      elite: { hp: 240, atk: 20, speed: 3.6, xp: 120, coins: 38, attackRange: 2.2, attackCd: 1.5, patrolRadius: 3, primary: 0xb4493a, secondary: 0x29110c, hurtColor: 0xff9d6a, radius: 0.85 },
      beast: { hp: 52, atk: 12, speed: 4.6, xp: 30, coins: 7, attackRange: 1.7, attackCd: 1.15, patrolRadius: 6, primary: 0xa9744f, secondary: 0x2e1d12, hurtColor: 0xdda15e, radius: 0.54 },
    };
  }

  update(dt, ctx) {
    if (!this.alive) return;
    this.ai.update(dt, ctx);

    // integrate velocity with drag
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.vel.multiplyScalar(Math.exp(-dt * 4.5));

    // wall collisions
    const agent = { x: this.pos.x, z: this.pos.z, y: this.pos.y };
    this.ctx.worldBase.collideAgent(agent, this.radius);
    agent.y = 0;
    this.pos.copy(new THREE.Vector3(agent.x, 0, agent.z));

    // collisions between enemies (cheap separation)
    // — handled centrally by EnemyManager

    // flash on hurt
    if (this.flashT > 0) this.flashT -= dt;
    const flash = this.flashT > 0;

    // face & position model
    this.model.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.model.rotation.y = this.facing;

    // animation weights
    this.legT += dt * Math.min(1, this.vel.length() / 4 + 0.35) * 7;
    const swing = Math.sin(this.legT) * 0.6 * Math.min(1, this.vel.lengthSq() * 4 + 0.15);
    if (this.parts.legL && this.parts.legR) {
      this.parts.legL.rotation.x = swing;
      this.parts.legR.rotation.x = -swing;
    }
    if (this.parts.armL && this.parts.armR) {
      this.parts.armL.rotation.x = -swing * 0.85;
      this.parts.armR.rotation.x = swing * 0.85 + (this.ai.state === STATE.WINDUP ? -1.35 : 0);
    }
    // idle bob
    this.parts.body.position.y = (this.arch === 'runner' ? 0.92 : this.arch === 'brute' || this.arch === 'elite' || this.arch === 'beast' ? 0.78 : 0.7)
      + Math.abs(Math.sin(this.legT * 0.5)) * 0.045;

    // hurt flash tint on torso
    if (this.parts.torso) {
      this.parts.torso.material.emissive = this.parts.torso.material.emissive ?? new THREE.Color(0x000000);
      this.parts.torso.material.emissive.setHex(flash ? 0x8a8a8a : 0x000000);
    }
  }

  takeDamage(amount, opts) {
    return this.ctx.damage.applyToEnemy(this, amount, opts);
  }

  velocityKnockback(dir, strength) {
    this.vel.x += dir.x * strength;
    this.vel.z += dir.z * strength;
  }

  dispose() {
    if (this.model) {
      this.ctx.worldBase.scene.remove(this.model);
      this.ctx.worldBase.disposeTree?.(this.model);
    }
  }
}
