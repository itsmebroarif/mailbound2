// Pooled visual effects: particles, slash arcs, shock rings, dash ghosts,
// floating damage numbers, name labels, delivery marker beams, confetti and
// per-world ambience. Everything recycles object instances to avoid GC churn.

import * as THREE from 'three';
import { celMesh } from './cel.js';

const MAX_PARTICLES = 900;
let fxTime = 0;

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this._children = [];       // { obj, t, life, update(obj, k) }
    this._ambientMode = null;
    this._ambientPts = null;
    this.initPools();
  }

  /* ------------------------------------------------------------------ */
  /* Pools                                                               */
  /* ------------------------------------------------------------------ */
  initPools() {
    // Particles (single Points draw call)
    const geo = new THREE.BufferGeometry();
    this.p_pos = new Float32Array(MAX_PARTICLES * 3);
    this.p_col = new Float32Array(MAX_PARTICLES * 3);
    this.p_data = new Array(MAX_PARTICLES).fill(null).map(() => ({
      vel: new THREE.Vector3(), life: 0, t: 0, grav: 0, size: 1,
    }));
    this.p_cursor = 0;
    geo.setAttribute('position', new THREE.BufferAttribute(this.p_pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.p_col, 3));
    this.p_geo = geo;
    this.p_draw = new Set(); // indices curently alive/dead-but-visible
    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(geo, mat);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
    // park all particles far away
    for (let i = 0; i < MAX_PARTICLES; i++) this.p_pos[i * 3 + 1] = -9999;

    this.slashPool = this.makePool(10, () => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.055, 6, 18, Math.PI * 0.9),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      this.scene.add(m);
      return m;
    });

    this.ringPool = this.makePool(6, () => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.09, 6, 40),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      m.rotation.x = -Math.PI / 2;
      this.scene.add(m);
      return m;
    });

    this.ghostPool = this.makePool(8, () => {
      const m = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.32, 0.7, 4, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, color: 0x9fd0ff, depthWrite: false }),
      );
      m.geometry.translate(0, 0.85, 0);
      this.scene.add(m);
      return m;
    });

    this.numPool = this.makePool(14, () => {
      const cv = document.createElement('canvas');
      cv.width = 160; cv.height = 74;
      const t2 = new THREE.CanvasTexture(cv);
      t2.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t2, transparent: true, depthWrite: false }));
      s.scale.set(1.35, 0.62, 1);
      s.userData.canvas = cv;
      s.userData.tex = t2;
      this.scene.add(s);
      return s;
    });
  }

  makePool(count, factory) {
    const list = [];
    for (let i = 0; i < count; i++) list.push({ obj: factory(), used: false });
    list.take = function* () { for (const e of this) if (!e.used) { e.used = true; yield e; } };
    return list;
  }

  /* ------------------------------------------------------------------ */
  /* Spawners                                                            */
  /* ------------------------------------------------------------------ */
  spawnBurst(pos, { color = 0xffd34d, count = 12, speed = 5, life = 0.55, gravity = -7, size = 1, upBias = 0.35 } = {}) {
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = this.p_cursor = (this.p_cursor + 1) % MAX_PARTICLES;
      const d = this.p_data[i];
      const a = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.35 + upBias) * 1.2;
      const sp = speed * (0.6 + Math.random() * 0.8);
      d.vel.set(Math.cos(a) * sp * Math.cos(pitch), Math.sin(pitch) * sp, Math.sin(a) * sp * Math.cos(pitch));
      d.life = d.t = life * (0.7 + Math.random() * 0.6);
      d.grav = gravity;
      d.size = size;
      this.p_pos[i * 3] = pos.x; this.p_pos[i * 3 + 1] = pos.y; this.p_pos[i * 3 + 2] = pos.z;
      this.p_col[i * 3] = c.r; this.p_col[i * 3 + 1] = c.g; this.p_col[i * 3 + 2] = c.b;
      this.p_draw.add(i);
    }
    this.p_geo.attributes.color.needsUpdate = true;
  }

  spawnSlash(pos, yaw, { color = 0xbfe8ff, scale = 1 } = {}) {
    for (const e of this.slashPool.take()) {
      e.obj.position.copy(pos);
      e.obj.rotation.set(0, yaw - Math.PI * 0.25, 0);
      e.obj.rotation.z = Math.PI * 0.55;
      e.obj.scale.setScalar(scale);
      e.obj.material.color.set(color);
      e.obj.material.opacity = 0.95;
      e.t = 0; e.life = 0.16;
      e.obj.visible = true;
      this._children.push({ obj: e.obj, t: 0, life: 0.16, pool: this.slashPool, update(o, k) {
        o.scale.setScalar(scale * (1 + k * 0.5));
        o.material.opacity = 0.95 * (1 - k);
      } });
      break;
    }
  }

  spawnRing(pos, { color = 0xffe08a, r1 = 6, life = 0.45 } = {}) {
    for (const e of this.ringPool.take()) {
      e.obj.position.copy(pos);
      e.obj.material.color.set(color);
      e.t = 0; e.life = life;
      e.obj.visible = true;
      const scale0 = 0.4;
      this._children.push({ obj: e.obj, t: 0, life, pool: this.ringPool, update(o, k) {
        o.scale.setScalar(scale0 + (r1 - scale0) * k);
        o.material.opacity = 0.9 * (1 - k);
      } });
      break;
    }
  }

  spawnGhost(pos, { color = 0x9fd0ff, life = 0.26 } = {}) {
    for (const e of this.ghostPool.take()) {
      e.obj.position.copy(pos);
      e.obj.material.color.set(color);
      e.t = 0; e.life = life;
      e.obj.visible = true;
      this._children.push({ obj: e.obj, t: 0, life, pool: this.ghostPool, update(o, k) {
        o.material.opacity = 0.42 * (1 - k);
      } });
      break;
    }
  }

  spawnDamageNumber(pos, amount, { color = '#ffffff', crit = false } = {}) {
    for (const e of this.numPool.take()) {
      const s = e.obj;
      const cv = s.userData.canvas;
      const g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height);
      g.font = `${crit ? '800 46px' : '700 34px'} 'Outfit', sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 8;
      g.strokeStyle = '#141628';
      g.strokeText(String(amount), cv.width / 2, 52);
      g.fillStyle = color;
      g.fillText(String(amount), cv.width / 2, 52);
      s.userData.tex.needsUpdate = true;
      s.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y + 1.9, pos.z);
      s.visible = true;
      const life = crit ? 0.85 : 0.65;
      this._children.push({ obj: s, t: 0, life, pool: this.numPool, update(o, k) {
        o.position.y += 0.016;
        o.material.opacity = 1 - k * k;
      } });
      break;
    }
  }

  /* Persistent helpers --------------------------------------------------- */
  makeNameLabel(text, { color = '#ffffff', size = 34, bg = '#141628' } = {}) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 96;
    const g = cv.getContext('2d');
    g.font = `600 ${size}px 'Outfit', sans-serif`;
    g.textAlign = 'center';
    const w = Math.min(500, g.measureText(text).width + 40);
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(256 - w / 2, 14, w, 66, 30);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = color;
    g.fillText(text, 256, 62);
    const t2 = new THREE.CanvasTexture(cv);
    t2.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t2, transparent: true, depthWrite: false }));
    s.scale.set(2.6, 0.48, 1);
    s.renderOrder = 5;
    return s;
  }

  // Delivery destination pillar: beam + bobbing arrow + ground ring.
  makeMarker({ color = 0xffce4b, height = 9 } = {}) {
    const g = new THREE.Group();
    const beam = celMesh(new THREE.CylinderGeometry(0.16, 0.26, height, 10), color, {
      opacity: 0.4, outline: false, emissive: color,
    });
    beam.position.y = height / 2;
    g.add(beam);
    const arrow = celMesh(new THREE.ConeGeometry(0.5, 1.0, 4), color, { emissive: color, outline: false });
    arrow.rotation.x = Math.PI;
    arrow.position.y = height + 0.6;
    g.add(arrow);
    const base = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.09, 6, 36),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.12;
    g.add(base);
    g.userData.update = (t) => {
      arrow.position.y = height + 0.6 + Math.sin(t * 3.4) * 0.35;
      arrow.rotation.y = t * 2.4;
      base.scale.setScalar(1 + Math.sin(t * 2.6) * 0.09);
    };
    return g;
  }

  setAmbient(mode) {
    this._ambientMode = mode;
    if (this._ambientPts) {
      this.scene.remove(this._ambientPts);
      this._ambientPts.geometry.dispose();
      this._ambientPts = null;
    }
    if (!mode) return;
    const N = mode === 'leaves' ? 60 : mode === 'fireflies' ? 40 : 30;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 44;
      arr[i * 3 + 1] = 1 + Math.random() * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      size: mode === 'fireflies' ? 0.28 : 0.2,
      color: mode === 'leaves' ? 0x9fd06e : mode === 'fireflies' ? 0xffe066 : mode === 'snow' ? 0xffffff : 0xffd9a0,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this._ambientPts = new THREE.Points(geo, mat);
    this._ambientPts.frustumCulled = false;
    this.scene.add(this._ambientPts);
  }

  /* ------------------------------------------------------------------ */
  update(dt, cameraPos) {
    fxTime += dt;
    // particles
    const pos = this.p_pos;
    for (const i of this.p_draw) {
      const d = this.p_data[i];
      if (d.t <= 0) continue;
      d.t -= dt;
      const j = i * 3;
      if (d.t <= 0) {
        pos[j + 1] = -9999;
        continue;
      }
      pos[j] += d.vel.x * dt;
      pos[j + 1] += d.vel.y * dt;
      pos[j + 2] += d.vel.z * dt;
      d.vel.y += d.grav * dt;
    }
    this.p_geo.attributes.position.needsUpdate = true;

    // transient children
    for (let idx = this._children.length - 1; idx >= 0; idx--) {
      const ch = this._children[idx];
      ch.t += dt;
      const k = Math.min(1, ch.t / ch.life);
      ch.update(ch.obj, k);
      if (k >= 1) {
        ch.obj.visible = false;
        if (ch.pool) for (const e of ch.pool) { if (e.obj === ch.obj) { e.used = false; break; } }
        else this.scene.remove(ch.obj);
        this._children.splice(idx, 1);
      }
    }

    // ambient drift, wrapped around the camera position
    if (this._ambientPts && cameraPos) {
      const arr = this._ambientPts.geometry.attributes.position.array;
      const mode = this._ambientMode;
      const fallSpeed = mode === 'leaves' ? 0.55 : mode === 'snow' ? 0.15 : 0;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= fallSpeed * dt;
        if (mode === 'fireflies') {
          const ph = i + fxTime;
          arr[i] += Math.cos(ph * 1.4) * 0.42 * dt;
          arr[i + 1] += Math.sin(ph * 2) * 0.2 * dt;
          arr[i + 2] += Math.sin(ph * 1.1) * 0.42 * dt;
        }
        if (arr[i + 1] < 0.2) {
          arr[i + 1] = 8 + Math.random() * 4;
          arr[i] = cameraPos.x + (Math.random() - 0.5) * 44;
          arr[i + 2] = cameraPos.z + (Math.random() - 0.5) * 44;
        }
      }
      this._ambientPts.geometry.attributes.position.needsUpdate = true;
    }
  }

  dispose() {
    this.p_geo.dispose();
    for (const pool of [this.slashPool, this.ringPool, this.ghostPool, this.numPool]) {
      for (const e of pool) {
        e.obj.geometry.dispose();
        e.obj.material.map?.dispose?.();
        e.obj.material.dispose();
      }
    }
  }
}

export function spawnConfetti(vfx, center, count = 90) {
  const colors = [0xff5d73, 0xffce4b, 0x6ee7a0, 0x5ec8ff, 0xc58cff];
  for (let i = 0; i < count; i++) {
    vfx.spawnBurst(center, {
      color: colors[i % colors.length],
      count: 1,
      speed: 4 + Math.random() * 5,
      life: 1.1 + Math.random() * 0.7,
      gravity: -4.5,
      size: 1,
    });
  }
}
