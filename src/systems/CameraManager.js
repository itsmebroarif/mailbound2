// Third-person spring-arm camera. Pointer-lock mouse look, collision pull-in
// against world colliders, FOV kick on sprint/dash, and screen shake support.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';

const V = new THREE.Vector3();

export class CameraManager {
  constructor(sceneCtx) {
    this.ctx = sceneCtx;               // WorldScene
    this.yaw = 0;                     // facing into the world (+z) on arrival
    this.pitch = 0.5;
    this.dist = CONFIG.camDist;
    this._shake = 0;
    this._fovKick = 0;
    this.fov = 58;
    this.cam = app.renderer.makeCamera(58);
    this.position = V.set(0, 4, 6).clone();
    this.enabled = true;
  }

  shake(amount = 0.3) {
    this._shake = Math.min(0.9, this._shake + amount);
  }

  kick(amount = 6) {
    this._fovKick += amount;
  }

  update(dt) {
    const { player, worldBase } = this.ctx;
    if (!player || !worldBase) return;

    // --- look input ---
    if (this.enabled && !app.ui.modalOpen) {
      const { dx, dy } = app.input.takeLook();
      const sens = 0.0022 * app.save.settings.sensitivity;
      this.yaw -= dx * sens;
      const invert = app.save.settings.invertY ? -1 : 1;
      this.pitch += dy * sens * invert;      // moving mouse up looks up
      this.pitch = THREE.MathUtils.clamp(this.pitch, CONFIG.camPitchMin, CONFIG.camPitchMax);
    } else {
      app.input.takeLook();
    }

    // lock-on bias: gently steer yaw toward the target
    if (player.combat.lockTarget && player.combat.lockTarget.alive) {
      const to = new THREE.Vector3().subVectors(player.combat.lockTarget.pos, player.pos);
      const wantYaw = Math.atan2(to.x, to.z) + Math.PI;
      this.yaw = THREE.MathUtils.lerp(this.yaw, wantYaw, Math.min(1, dt * 6));
    }

    // --- desired position (spring arm) ---
    const aim = player.weapons?.aimT ?? 0;
    const target = new THREE.Vector3(player.pos.x, player.pos.y + CONFIG.camHeight, player.pos.z);
    const dir = new THREE.Vector3(
      Math.sin(this.yaw + Math.PI) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw + Math.PI) * Math.cos(this.pitch),
    );
    const cfgDist = CONFIG.camDist - aim * 1.7;
    let dist = cfgDist;
    dist = this._clipAgainstColliders(target, dir, dist);
    const desired = target.clone().addScaledVector(dir, dist);

    // smooth
    const k = 1 - Math.exp(-CONFIG.camLerp * dt);
    this.position.lerp(desired, k);

    // shake decay
    let shake = new THREE.Vector3();
    if (this._shake > 0.005) {
      this._shake *= Math.exp(-dt * 7);
      shake = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(this._shake * 0.4);
    }

    this.cam.position.copy(this.position).add(shake);
    this.cam.lookAt(target);
    if (this.dutch) this.cam.rotateZ(this.dutch);

    // FOV kick (sprint/dash rush) & aim-down-sights zoom
    const baseFov = 58 - (player.weapons?.aimT ?? 0) * 16;
    const wantFov = this._fovKick > 0.5 ? baseFov + Math.min(12, this._fovKick) : (player.sprinting ? baseFov + 7 : baseFov);
    this.cam.fov = THREE.MathUtils.lerp(this.cam.fov, wantFov, dt * 4.5);
    this.cam.updateProjectionMatrix();
    this._fovKick *= Math.exp(-dt * 5);
  }

  // Shorten the spring arm when a collider is between target & camera.
  _clipAgainstColliders(target, dir, maxDist) {
    let best = maxDist;
    const eps = 0.35;
    for (const c of this.ctx.worldBase.colliders) {
      const hitDist = rayVsAABBOrCyl(target, dir, c);
      if (hitDist != null && hitDist < best) best = Math.max(CONFIG.camMinDist, hitDist - eps);
    }
    if (best < maxDist) return best;
    return maxDist;
  }

  // Dutch-angle roll, applied fresh every frame (set from WorldScene)
  dutch = 0;

  applyBindings(renderer) {
    renderer.setActive(this.ctx.worldBase?.scene ?? null, this.cam);
  }

  // Screen-space projection helper for HUD markers.
  projectToScreen(v3) {
    const p = new THREE.Vector3().copy(v3).project(this.cam);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
      behind: p.z > 1,
    };
  }
}

/* Ray vs box/cyl collider (fast analytic). Colliders are precomputed world AABBs. */
function rayVsAABBOrCyl(origin, dirOne, c) {
  return c.type === 'box' ? rayBox(origin, dirOne, c) : rayCyl(origin, dirOne, c);
}

function rayBox(o, d, c) {
  // AABB data already world-space: {minX,maxX,minZ,maxZ,minY,maxY}
  const t = slabRay(o, d, c);
  return t;
}

function slabRay(o, d, c) {
  let tmin = 0.02, tmax = 60;
  const axes = [['x', c.minX, c.maxX], ['y', c.minY, c.maxY], ['z', c.minZ, c.maxZ]];
  for (const [ax, lo, hi] of axes) {
    const din = d[ax];
    const start = o[ax];
    if (Math.abs(din) < 1e-7) {
      if (start < lo || start > hi) return null;
    } else {
      let t1 = (lo - start) / din;
      let t2 = (hi - start) / din;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmax < tmin) return null;
    }
  }
  return tmin;
}

function rayCyl(o, d, c) {
  // infinite y-extruded cylinder approximation
  const ox = o.x - c.cx;
  const oz = o.z - c.cz;
  const a = d.x * d.x + d.z * d.z;
  if (a < 1e-8) return null;
  const b = 2 * (ox * d.x + oz * d.z);
  const cc = ox * ox + oz * oz - c.r * c.r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t < 0.02) return null;
  // vertical check
  const y = o.y + d.y * t;
  if (y < c.minY || y > c.maxY) return null;
  return t;
}
