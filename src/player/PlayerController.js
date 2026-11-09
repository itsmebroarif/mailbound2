// PlayerController: camera-relative WASD, jump (coyote + buffer), dash/sprint
// with the shift tap-or-hold rule, knockback override and entity collision.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';

export class PlayerController {
  constructor(player) {
    this.p = player;
    this.dashDir = new THREE.Vector3(0, 0, -1);
    this.dashCd = 0;
    this.dashT = 0;
    this.knock = new THREE.Vector3();

    this.coyoteT = 0;
    this.jumpBufT = 0;
    this.dashAttackReadyT = 0;
  }

  get sprinting() {
    return this.p.sprinting;
  }

  update(dt) {
    const input = app.input;
    const p = this.p;
    const cam = p.ctx.camera;

    // --- gather input ---
    const fwd = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const strafe = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    const moving = Math.abs(fwd) > 0.01 || Math.abs(strafe) > 0.01;

    const yaw = p.ctx.camera ? cam.yaw : 0;
    // F = horizontal view direction (into the screen)
    const F = { x: Math.sin(yaw), z: Math.cos(yaw) };
    // R = screen-right (F × up), consistent with third-person conventions
    const R = { x: -Math.cos(yaw), z: Math.sin(yaw) };
    let mx = F.x * fwd + R.x * strafe;
    let mz = F.z * fwd + R.z * strafe;
    const ml = Math.hypot(mx, mz);
    if (ml > 0.01) {
      mx /= ml;
      mz /= ml;
    }

    // --- stamina-driven sprint (hold shift beyond the threshold) ---
    const shiftHeldLong = (input.isDown('ShiftLeft') || input.isDown('ShiftRight'))
      && moving && p.stats.stamina > 2 && fwd !== 0;
    p.sprinting = shiftHeldLong;
    if (p.sprinting) {
      p.stats.drainStamina(CONFIG.sprintDrain * dt);
      // if draining to empty, drop out of sprint
      if (p.stats.stamina <= 0.01) p.sprinting = false;
    }

    // --- dash (the tap rule) ---
    if (input.takeDash() && this.dashCd <= 0 && p.stats.canDash()) {
      this.dashDir.set(mx || F.x, 0, mz || F.z).normalize();
      this.dashT = CONFIG.dashTime;
      this.dashCd = p.stats.dashCd;
      this.dashAttackReadyT = 0.32; // window to weave a dash attack next
      p.stats.drainStamina(25);
      app.audio.sfx('dash');
      p.ctx.vfx.spawnBurst(p.pos, { color: 0x9fd0ff, count: 6, speed: 3, life: 0.3 });
      p.ctx.camera?.kick(9);
    }
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.dashAttackReadyT > 0) this.dashAttackReadyT = Math.max(0, this.dashAttackReadyT - dt);

    // --- desired planar velocity ---
    const desiredSpd = this.dashT > 0
      ? CONFIG.dashSpeed
      : p.sprinting ? CONFIG.sprint : CONFIG.walk;

    if (this.dashT > 0) {
      this.dashT -= dt;
      p.vel.x = this.dashDir.x * desiredSpd;
      p.vel.z = this.dashDir.z * desiredSpd;
      p.dashTrail(dt);
    } else if (ml > 0.01) {
      // accelerate toward desired
      p.vel.x += (mx * desiredSpd - p.vel.x) * Math.min(1, dt * 9);
      p.vel.z += (mz * desiredSpd - p.vel.z) * Math.min(1, dt * 9);
      // slip a little if airborne
      if (!p.isGrounded) {
        p.vel.x *= 1.0; p.vel.z *= 1.0;
      }
    } else {
      const fr = Math.exp(-dt * CONFIG.friction);
      p.vel.x *= fr;
      p.vel.z *= fr;
    }

    // knockback overrides movement bits
    if (this.knock.lengthSq() > 0.01) {
      p.vel.x += this.knock.x;
      p.vel.z += this.knock.z;
      this.knock.multiplyScalar(Math.exp(-dt * 5.5));
    }

    // --- jump: coyote + input buffer ---
    this.coyoteT = p.isGrounded ? CONFIG.coyote : Math.max(0, this.coyoteT - dt);
    if (input.pressed('Space')) this.jumpBufT = CONFIG.jumpBuf;
    else if (this.jumpBufT > 0) this.jumpBufT = Math.max(0, this.jumpBufT - dt);
    if (this.jumpBufT > 0 && this.coyoteT > 0) {
      p.vel.y = CONFIG.jumpV;
      p.isGrounded = false;
      this.coyoteT = 0;
      this.jumpBufT = 0;
      app.audio.sfx('jump');
    }

    // --- integrate & collide vertically ---
    p.vel.y -= CONFIG.gravity * dt;
    p.pos.y += p.vel.y * dt;
    p.pos.x += p.vel.x * dt;
    p.pos.z += p.vel.z * dt;

    const floor = p.ctx.worldBase.groundHeightAt(p.pos.x, p.pos.z, p.pos.y + CONFIG.stepH);
    if (p.pos.y <= floor + 0.001 && p.vel.y <= 0) {
      if (!p.isGrounded && p.fallDistance > 0.8) app.audio.sfx('land');
      p.pos.y = floor;
      p.vel.y = 0;
      p.isGrounded = true;
      p.fallDistance = 0;
    } else if (p.pos.y > floor + 0.05) {
      p.isGrounded = false;
      p.fallDistance = (p.fallDistance || 0) + Math.max(0, -p.vel.y * dt);
    }
    return { moving, ml, F, R };
  }

  applyKnockback(dir, strength) {
    this.knock.x += dir.x * strength;
    this.knock.z += dir.z * strength;
  }
}
