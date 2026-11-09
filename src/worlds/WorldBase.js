// WorldBase: builds a THREE.Scene from a world definition (plain data).
// Handles terrain, fog/sky, lights, natural boundary, water planes, collider
// registry (world-space AABB/cylinders), prop placement and camera raycasts.

import * as THREE from 'three';
import { PROPS } from '../render3/Props.js';
import { tex } from '../core/AssetManager.js';
import { gradientMap, celLights } from '../render3/cel.js';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';


// Dev-safety: catch a prop factory emitting NaN geometry before it hits the renderer.
function warnIfNaNGeometry(group, make, x, z) {
  group.traverse((child) => {
    const a = child.geometry?.attributes?.position?.array;
    if (!a) return;
    for (let i = 0; i < a.length; i++) {
      if (Number.isNaN(a[i])) {
        console.error(`[nan-prop] prop "${make}" at (${x},${z}) has NaN vertex data`);
        return;
      }
    }
  });
}

export class WorldBase {
  constructor(id, def) {
    this.id = id;
    this.def = def;
    this.t = 0;
    this.bounds = def.bounds ?? 78;
    this.colliders = [];
    this.animProps = [];
    this.waterTiles = [];

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(def.theme.fog, def.theme.fogNear ?? 40, def.theme.fogFar ?? 150);
    this.scene.background = new THREE.Color(def.theme.sky);
    this._buildEnvironment();
    this._placeProps();
  }

  /* ------------------------------------------------------------------ */
  _buildEnvironment() {
    const { def } = this;
    const t = def.theme;
    celLights(this.scene, {
      sunColor: t.sun ?? 0xfff2d6,
      sunIntensity: t.sunIntensity ?? 1.0,
      hemiIntensity: t.hemiIntensity ?? 0.62,
      sky: t.skyFill ?? 0xbfe3ff,
      ground: t.groundFill ?? 0x8a7a58,
      sunPos: t.sunPos ?? [46, 64, 18],
    });

    // terrain disc (big square plane, texture from theme)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.bounds * 2 + 40, this.bounds * 2 + 40),
      new THREE.MeshToonMaterial({ color: t.groundTint ?? 0xffffff, map: tex(t.groundMap ?? 'grass', { size: 256, repeatX: 12, repeatY: 12 }), gradientMap: gradientMap() }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);

    if (t.water) {
      const w = t.water;
      const wmesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w.w, w.d),
        new THREE.MeshToonMaterial({ color: 0x49a9e2, map: tex('water', { size: 128, repeatX: w.repeatX ?? 8, repeatY: w.repeatY ?? 8 }), transparent: true, opacity: 0.9, gradientMap: gradientMap() }),
      );
      wmesh.rotation.x = -Math.PI / 2;
      wmesh.position.set(w.x, w.y ?? -0.55, w.z);
      wmesh.rotation.z = w.rotZ ?? 0;
      this.scene.add(wmesh);
      this.waterTiles.push(wmesh.material.map);
    }

    // natural boundary: ring of mountains/pines described per world
    for (const m of def.theme.boundary ?? []) this.placeProp(m);

    // invisible hard wall so the player cannot walk off the map
    this._wallCount = 0;
  }

  _placeProps() {
    for (const p of this.def.props ?? []) this.placeProp(p);
  }

  /* ------------------------------------------------------------------ */
  // Place a prop registered in PROPS (or {inline(obj)} for custom groups).
  placeProp({ make, opts = {}, x = 0, z = 0, y = 0, ry = 0, noCollide = false, extraColliders = null }) {
    const factory = PROPS[make];
    const group = factory ? factory(opts) : new THREE.Group();
    warnIfNaNGeometry(group, make, x, z);
    group.position.set(x, y, z);
    group.rotation.y = ry;
    this.scene.add(group);

    const c = group.userData.collider;
    if (c && !noCollide) {
      this.registerCollider(x, z, y, ry, c, group);
    }
    const extras = extraColliders ?? group.userData.extraColliders ?? [];
    for (const e of extras) {
      const cos = Math.cos(ry), sin = Math.sin(ry);
      const ox = (e.ox ?? 0), oz = (e.oz ?? 0);
      this.registerCollider(
        x + cos * ox + sin * oz, z - sin * ox + cos * oz,
        0, 0, e, group,
      );
    }
    // staircase helper auto-registers every step as a "step" collider
    group.traverse((child) => {
      if (child.userData.stairCollider) {
        const e = child.userData.stairCollider;
        const cos = Math.cos(ry), sin = Math.sin(ry);
        const ox = e.ox ?? 0, oz = e.oz ?? 0;
        const w = (e.w ?? 1.2);
        this.colliders.push({
          type: 'box',
          minX: x + cos * ox + sin * oz - w / 2,
          maxX: x + cos * ox + sin * oz + w / 2,
          minZ: z - sin * ox + cos * oz - (e.d ?? 0.6) / 2,
          maxZ: z - sin * ox + cos * oz + (e.d ?? 0.6) / 2,
          minY: 0,
          maxY: e.h ?? 1,
          top: e.h ?? 1,
          snap: false,
          step: true,
        });
      }
    });
    if (group.userData.animatable || typeof group.userData.update === 'function') {
      this.animProps.push(group);
    }
    return group;
  }

  registerCollider(x, z, y, ry, c) {
    const top = y + (c.h ?? 1);
    if (c.type === 'box') {
      const w = c.w ?? 1, d = c.d ?? 1;
      const hw = (Math.abs(Math.cos(ry)) * w + Math.abs(Math.sin(ry)) * d) / 2;
      const hd = (Math.abs(Math.sin(ry)) * w + Math.abs(Math.cos(ry)) * d) / 2;
      this.colliders.push({
        type: 'box', minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd,
        minY: y, maxY: top, top,
        // aero: step crates and bridges may raise the player
        snap: !!c.walkableTop || !!c.step,
        step: !!c.step,
        small: w <= 1.4 && d <= 1.4,
      });
    } else {
      this.colliders.push({
        type: 'cyl', cx: x, cz: z, r: c.r ?? 0.5,
        minY: y, maxY: top, top, snap: false, step: false,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  // Highest floor the agent can stand on at (x,z) given current feet height.
  groundHeightAt(x, z, feetY) {
    let floor = 0;
    for (const c of this.colliders) {
      if (c.type !== 'box') continue;
      if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) {
        if (c.top <= feetY + CONFIG.stepH && c.top > floor) floor = c.top;
      }
    }
    return floor;
  }

  // Circle-vs-colliders resolve with auto step-up for "step" props.
  // Agent = { x, z, y } — y is mutated on step-up/landing.
  collideAgent(agent, radius) {
    const feetY = agent.y;
    const start = { x: agent.x, z: agent.z };

    // -- pass 1: step-up candidates (stairs/crates/bridges tagged step) --
    let stepTop = -1;
    for (const c of this.colliders) {
      if (c.type !== 'box' || !c.step) continue;
      if (agent.x >= c.minX - radius && agent.x <= c.maxX + radius
          && agent.z >= c.minZ - radius && agent.z <= c.maxZ + radius
          && c.top - feetY > 0 && c.top - feetY <= CONFIG.stepH) {
        stepTop = Math.max(stepTop, c.top);
      }
    }
    if (stepTop > -1) {
      agent.y = stepTop;
      return { pushed: false, stepped: true, floor: stepTop };
    }

    // -- pass 2: push-out for real blockers --
    for (const c of this.colliders) {
      if (c.minY >= agent.y + 1.75) continue;      // entirely above body
      if (c.maxY <= agent.y + 0.02) continue;      // entirely below floor line
      if (c.type === 'cyl') {
        const dx = agent.x - c.cx;
        const dz = agent.z - c.cz;
        const rSum = radius + c.r;
        const distSq = dx * dx + dz * dz;
        if (distSq < rSum * rSum && distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          agent.x = c.cx + (dx / dist) * rSum;
          agent.z = c.cz + (dz / dist) * rSum;
        }
        continue;
      }
      // XZ margin circle test
      const dx = Math.max(c.minX - agent.x, 0, agent.x - c.maxX);
      const dz = Math.max(c.minZ - agent.z, 0, agent.z - c.maxZ);
      if (dx * dx + dz * dz > radius * radius) continue;
      const insideX = agent.x >= c.minX && agent.x <= c.maxX;
      const insideZ = agent.z >= c.minZ && agent.z <= c.maxZ;
      if (!insideX || !insideZ) {
        // push out along vector
        const dist = Math.sqrt(dx * dx + dz * dz) || 1e-6;
        agent.x += (dx / dist) * (radius - dist);
        agent.z += (dz / dist) * (radius - dist);
        continue;
      }
      // deep push-out on the smallest penetration axis
      const pL = agent.x - c.minX + radius;
      const pR = c.maxX - agent.x + radius;
      const pB = agent.z - c.minZ + radius;
      const pF = c.maxZ - agent.z + radius;
      const m = Math.min(pL, pR, pB, pF);
      if (m === pL) agent.x = c.minX - radius;
      else if (m === pR) agent.x = c.maxX + radius;
      else if (m === pB) agent.z = c.minZ - radius;
      else agent.z = c.maxZ + radius;
    }

    // -- best floor lying at/below feet within padding (bridges & docks) --
    let floor = 0;
    for (const c of this.colliders) {
      if (c.type !== 'box') continue;
      if (c.top > agent.y + CONFIG.stepH) continue;
      const px = agent.x, pz = agent.z;
      if (px >= c.minX - radius * 0.5 && px <= c.maxX + radius * 0.5
          && pz >= c.minZ - radius * 0.5 && pz <= c.maxZ + radius * 0.5) {
        if (c.top > floor) floor = c.top;
      }
    }

    // -- world boundary (natural wall) ---
    const rr = Math.hypot(agent.x, agent.z);
    if (rr > this.bounds) {
      const s = this.bounds / rr;
      agent.x *= s;
      agent.z *= s;
    }

    const pushed = start.x !== agent.x || start.z !== agent.z;
    return { pushed, stepped: false, floor };
  }

  /* ------------------------------------------------------------------ */
  update(dt) {
    this.t += dt;
    for (const p of this.animProps) {
      p.userData.update?.(this.t, dt);
    }
    for (const map of this.waterTiles) {
      map.offset.x += dt * 0.035;
      map.offset.y += dt * 0.009;
    }
  }
}
