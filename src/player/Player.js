// The Player entity: model + physics + facing + animation + knockback.
// Stats live in PlayerStats; combat in PlayerCombat; skills in PlayerSkills.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';
import { makeCourier, makeParcel } from '../render3/ProceduralModels.js';
import { PlayerStats } from './PlayerStats.js';
import { PlayerController } from './PlayerController.js';
import { PlayerCombat } from './PlayerCombat.js';
import { PlayerSkills } from './PlayerSkills.js';
import { PlayerWeapons } from './PlayerWeapons.js';

export class Player {
  constructor(ctx, spawn) {
    this.ctx = ctx;               // WorldScene
    this.pos = new THREE.Vector3(spawn[0], 0, spawn[1]);
    this.vel = new THREE.Vector3();
    this.facing = 0;               // model default faces +z (into the world)
    this.isGrounded = true;
    this.fallDistance = 0;
    this.sprinting = false;
    this.speedRatio = 0;

    this.stats = new PlayerStats();
    this.controller = new PlayerController(this);
    this.combat = new PlayerCombat(this);
    this.skills = new PlayerSkills(this);
    this.weapons = new PlayerWeapons(this);

    // --- model ---
    this.model = makeCourier();
    this.parts = this.model.userData.parts;
    this.model.position.copy(this.pos);
    this.model.rotation.y = this.facing;
    ctx.worldBase.scene.add(this.model);

    // blob shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 18),
      new THREE.MeshBasicMaterial({ color: 0x0a0b1e, transparent: true, opacity: 0.38, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.model.add(shadow);

    // attach the 4-weapon arsenal to the right hand
    this.weapons.init(this.parts);

    // carried package (spawns with active mission)
    this._package = makeParcel();
    this._package.visible = false;
    this._package.scale.setScalar(0.9);
    this._package.position.set(0, 0.32, -0.52);
    ctx.worldBase.scene.add(this._package);
    this._stepDist = 0;

    this.powerupT = 0;
    this.hurtFlashT = 0;
  }

  applyKnockback(dir, strength) {
    this.controller.applyKnockback(dir, strength);
  }

  get facingVector() {
    return new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
  }

  showPackage(type) {
    this._package.visible = true;
    this._package.material?.color?.setHex?.(type === 'urgent' ? 0xff8a8a : type === 'fragile' ? 0xb28cff : 0xe8a33f);
  }

  hidePackage() {
    this._package.visible = false;
  }

  update(dt) {
    // stats first (regen may matter)
    this.stats.update(dt);
    this.weapons.update(dt);
    this.skills.update(dt);

    // controller drives physics; collisions afterwards
    const t0 = this.pos.clone();
    this.controller.update(dt);

    // collider resolution (walls / props / bridges)
    const agent = { x: this.pos.x, z: this.pos.z, y: this.pos.y };
    this.ctx.worldBase.collideAgent(agent, 0.45);
    this.pos.x = agent.x;
    this.pos.z = agent.z;
    // step-up landed agents ride the resolved y
    if (this.isGrounded) this.pos.y = Math.max(this.pos.y, agent.y);

    // fight corpses of the world plane
    if (this.pos.y < -12) this.pos.set(t0.x, 0, t0.z);

    // combat handles attack input itself; Landing plunge resolution happens here
    if (this.isGrounded) this.combat.resolveLandingPlunge();

    // light knock / invuln timers
    if (this.hurtFlashT > 0) this.hurtFlashT -= dt;
    if (this.powerupT > 0) this.powerupT -= dt;

    // --- facing direction ---
    const hspd = Math.hypot(this.vel.x, this.vel.z);
    this.speedRatio = THREE.MathUtils.clamp(hspd / CONFIG.sprint, 0, 1);
    if (this.combat.lockTarget && this.combat.lockTarget.alive) {
      this.facing = Math.atan2(this.combat.lockTarget.pos.x - this.pos.x, this.combat.lockTarget.pos.z - this.pos.z);
    } else if (hspd > 0.6) {
      const target = Math.atan2(this.vel.x, this.vel.z);
      this.facing = lerpAngle(this.facing, target, Math.min(1, dt * 10));
    }

    // run collision hit from leader so plunge & stagger work hard
    // (nothing extra needed; EnemyManager resolves separately)

    // --- write to model ---
    this.model.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.model.rotation.y = this.facing;
    // slight lean into velocity
    this.model.rotation.x = this.isGrounded ? THREE.MathUtils.clamp(this.vel.length() * 0.012, 0, 0.16) : -0.22;
    this.model.rotation.z = this.sprinting ? Math.sin(this.ctx.t * 9) * 0.03 : 0;

    this._animate(dt);

    // --- footsteps ---
    this._stepDist += hspd * dt;
    if (this._stepDist > (this.sprinting ? 1.7 : 2.5)) {
      this._stepDist = 0;
      app.audio.sfx('step', { vol: this.sprinting ? 0.5 : 0.2 });
    }

    // carried package follows the backpack
    if (this._package.visible) {
      this._package.position.copy(this.pos)
        .add(this.facingVector.multiplyScalar(-0.52).setY(0));
      this._package.position.y = this.pos.y + 1.12;
      this._package.rotation.y = this.facing;
      this._package.rotation.z = Math.sin(this.ctx.t * 4) * 0.04;
    }

    // restore if level-up fired
    return;
  }

  dashTrail(dt) {
    this._ghostT = (this._ghostT ?? 0) + dt;
    if (this._ghostT >= 0.045) {
      this._ghostT = 0;
      this.ctx.vfx.spawnGhost(this.pos.clone(), { color: 0x9fd0ff, life: 0.3 });
    }
  }

  _animate(dt) {
    const parts = this.parts;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    const moving = speed > 0.6;
    this.walkT = (this.walkT ?? 0) + dt * (4.5 + speed * 1.5);
    const swing = moving ? Math.sin(this.walkT) : 0;
    const amp = THREE.MathUtils.clamp(speed / CONFIG.walk, 0, 1.35);

    // legs
    parts.legL.rotation.x = swing * 0.65 * amp;
    parts.legR.rotation.x = -swing * 0.65 * amp;

    // arms — attack overrides the left swing pose
    const attacking = this.combat.attacking;
    if (attacking) {
      const prog = this.combat.swingProgress;
      // wind up then slash across
      const wind = Math.min(prog * 2, 0.5);
      const strike = Math.max(0, prog - 0.5);
      parts.armR.rotation.x = -1.9 * wind + (strike * 3.6);
      parts.armR.rotation.z = -0.6 - prog * 0.4;
      parts.armL.rotation.x = swing * 0.25 * amp;
    } else {
      parts.armL.rotation.x = -swing * 0.6 * amp;
      parts.armR.rotation.x = swing * 0.6 * amp - 0.2;
      parts.armR.rotation.z = -0.35; // resting sword arm
    }

    // torso bob + idle breathing
    const bob = moving ? Math.abs(Math.sin(this.walkT)) * 0.05 * amp : Math.sin(this.ctx.t * 2.4) * 0.03;
    parts.body.position.y = 0.86 + bob;
    parts.head.rotation.x = moving ? Math.sin(this.walkT) * 0.04 : Math.sin(this.ctx.t * 1.7) * 0.02;

    // courier bag jiggle
    if (parts.bag) parts.bag.rotation.x = Math.sin(this.walkT) * 0.1 * amp;
  }

  setPowerup(t = 1.6) {
    this.powerupT = t;
  }

  knockback(dir, strength) {
    this.applyKnockback(dir, strength);
  }
}

// shared with PlayerCombat (bufferless angle lerp)
export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
