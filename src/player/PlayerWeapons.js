// The courier arsenal: Pistol · SMG · Samurai katana · Rocket Launcher.
// Switch with Q or the mouse wheel, reload with R. Samurai stays melee.
// RMB = aim-down-sights (guns) / lock-on (samurai).

import * as THREE from 'three';
import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';
import { WEAPON_BUILDERS } from '../render3/ProceduralModels.js';
import { sectorHits, sphereHits, segmentHits } from '../combat/HitboxSystem.js';

export const WEAPONS = [
  {
    id: 'pistol', name: 'Pistol', icon: '🔫', slot: 'Q',
    desc: 'Senjata jujur bebuyutan. Kecil, bisa dipercaya.',
    dmg: 34, rate: 0.26, clip: 12, reserve: 96, reloadTime: 1.1,
    spread: 0.008, auto: false, pellets: 1, range: 130,
    muzzle: 0xfff2a0, tracer: 0xffe9a6, knock: 2.4,
  },
  {
    id: 'smg', name: 'SMG', icon: '⚡', slot: 'Q',
    desc: 'Kemarahan peluru — tahan pelatuknya.',
    dmg: 9, rate: 0.078, clip: 28, reserve: 140, reloadTime: 1.35,
    spread: 0.018, auto: true, pellets: 1, range: 60,
    muzzle: 0xffd9a0, tracer: 0xffc46e, knock: 0.8,
  },
  {
    id: 'samurai', name: 'Samurai', icon: '🗡️', slot: 'Q',
    desc: 'Katana kurir terakhir. Rantai 3 pukulan.',
    melee: true,
  },
  {
    id: 'launcher', name: 'Rocket Launcher', icon: '🚀', slot: 'Q',
    desc: 'Ledakan besar. Pendapat yang kuat.',
    dmg: 92, rate: 0.95, clip: 3, reserve: 15, reloadTime: 1.75,
    spread: 0.004, auto: false, pellets: 1, range: 220,
    muzzle: 0xffd2b0, tracer: 0xff9e6e, knock: 4,
    blastRadius: 3.4, blastDmg: 74,
  },
];

const AIM_TIME = 0.16;

export class PlayerWeapons {
  constructor(player) {
    this.player = player;
    this.weapons = WEAPONS;
    this.index = 0; // start with the trusty Pistol
    this.aimT = 0;              // 0 = hip, 1 = ADS
    this.cooldown = 0;
    this.reloadT = 0;           // >0 = reloading
    this.reloadMax = 1;
    this.ammoState = {
      pistol: { clip: 12, reserve: 96 },
      smg: { clip: 28, reserve: 140 },
      launcher: { clip: 3, reserve: 15 },
    };
    this._flashT = 0;
    this._recoilT = 0;
    this._hitmarkT = 0;
    this._fireAcc = 0;
    this._tracers = [];

    // weapon meshes attached to the right-hand group
    this._meshes = [];
    player.parts; // noop guard
  }

  /* ------------------------------------------------------------ */
  init(parts) {
    // create & attach one mesh per weapon class; only the active one is visible
    const arm = parts.armR;
    this._meshes = this.weapons.map((w) => {
      const builder = WEAPON_BUILDERS[w.id];
      const mesh = builder();
      mesh.visible = false;
      mesh.scale.setScalar(1);
      mesh.position.set(0, -0.4, 0.08);
      mesh.rotation.x = -0.35;
      arm.add(mesh);
      return mesh;
    });
    // the courier blade is the same mesh as samurai (hidden in hand)
    this._updateVisibility();
  }

  current() {
    return this.weapons[this.index];
  }

  isMelee() {
    return !!this.current().melee;
  }

  currentAmmo() {
    const a = this.ammoState[this.current().id];
    return a ?? { clip: Infinity, reserve: Infinity };
  }

  _updateVisibility() {
    for (let i = 0; i < this._meshes.length; i += 1) {
      this._meshes[i].visible = i === this.index;
    }
    // the arm holds the active weapon; hide punch-only poses
    this.player.parts.armR.visible = true;
  }

  /* ------------------------------------------------------------ */
  switchTo(i) {
    if (i === this.index) return;
    if (i < 0 || i >= this.weapons.length) return;
    this.index = i;
    this.reloadT = 0;
    this.cooldown = 0.15;
    this._fireAcc = 0;
    app.audio.sfx('ui_click');
    this._updateVisibility();
    app.bus.emit('weapon-changed', { index: i, weapon: this.current() });
  }

  cycle(dir = 1) {
    const n = this.weapons.length;
    this.switchTo((this.index + dir + n) % n);
  }

  reload() {
    const w = this.current();
    if (w.melee || this.reloadT > 0) return;
    const a = this.ammoState[w.id];
    if (a.clip === w.clip || a.reserve <= 0) return;
    // refill as much as possible
    this.reloadT = w.reloadTime;
    this.reloadMax = w.reloadTime;
    app.audio.sfx('reload');
  }

  /* ------------------------------------------------------------ */
  update(dt) {
    // weapon switch via Q / wheel
    const input = app.input;
    if (input.pressed('KeyQ')) this.cycle(1);
    if (Math.abs(input.wheelDelta) > 40) {
      this.cycle(input.wheelDelta > 0 ? 1 : -1);
      input.wheelDelta = 0;
    }

    // aim state (guns hold RMB; samurai keeps RMB lock-on)
    const wantAim = !this.isMelee() && input.mouseRightDown;
    this.aimT = THREE.MathUtils.clamp(this.aimT + (wantAim ? dt / AIM_TIME : -dt / AIM_TIME), 0, 1);

    // cooldowns & reload
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    const w = this.current();
    if (this.reloadT > 0) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        const a = this.ammoState[w.id];
        const need = w.clip - a.clip;
        const take = Math.min(need, a.reserve);
        a.clip += take;
        a.reserve -= take;
        app.audio.sfx('ui_confirm');
      }
    }

    // fire with LMB (semi on the edge, auto while held) — swords stay on PlayerCombat
    if (!this.isMelee() && input.mouseLeftDown && this.reloadT <= 0) {
      if (w.auto) {
        this._fireAcc += dt;
        if (this._fireAcc >= w.rate) {
          this._fireAcc = 0;
          this.tryFire();
        }
      } else if (input.takeClickLeft()) {
        this.tryFire();
      }
    }

    // reload on R
    if (input.pressed('KeyR')) this.reload();

    // effects & flashes
    this._flashT = Math.max(0, this._flashT - dt);
    this._recoilT = Math.max(0, this._recoilT - dt);
    this._hitmarkT = Math.max(0, this._hitmarkT - dt);
    this._updateTracers(dt);
  }

  ammoFraction() {
    const w = this.current();
    if (w.melee) return 1;
    const a = this.ammoState[w.id];
    return a.clip / w.clip;
  }

  get reloadProgress() {
    return this.reloadT > 0 ? 1 - this.reloadT / this.reloadMax : 0;
  }

  /* ------------------------------------------------------------ */
  tryFire() {
    const w = this.current();
    if (w.melee) {
      this.player.combat.tryAttack();
      return true;
    }
    if (this.cooldown > 0 || this.reloadT > 0) return false;
    const a = this.ammoState[w.id];
    if (a.clip <= 0) {
      app.audio.sfx('dry');
      this.reload();
      return false;
    }

    a.clip -= 1;
    this.cooldown = w.rate;
    this._flashT = 0.09;
    this._recoilT = 0.16;

    // muzzle world position (approx hand tip)
    const origin = this.player.pos.clone()
      .add(new THREE.Vector3(Math.sin(this.player.facing) * 0.55, 1.32, Math.cos(this.player.facing) * 0.55));

    // screen-center ray → target direction
    const ray = this._centerRay();
    const spread = w.spread * (1 - this.aimT * 0.85);
    const fx = Math.sin(this.player.facing);
    const fz = Math.cos(this.player.facing);
    const dir = ray.clone();
    dir.x += (Math.random() - 0.5) * spread * 20;
    dir.z += (Math.random() - 0.5) * spread * 20;
    dir.y += (Math.random() - 0.5) * spread * 12;
    dir.normalize();

    // audio + flash VFX
    app.audio.sfx(w.id === 'launcher' ? 'rocket' : w.id === 'smg' ? 'smgshot' : 'gunshot');
    this.player.ctx.vfx.spawnBurst(origin, { color: w.muzzle, count: 4, speed: 2, life: 0.12, gravity: 0 });

    if (w.id === 'launcher') {
      // ballistic projectile, AoE
      this.player.ctx.projectiles.spawn({
        origin, direction: dir, speed: 26, dmg: w.dmg, color: 0xffa040,
        owner: 'player', blastRadius: w.blastRadius, blastDmg: w.blastDmg,
      });
      this.player.ctx.camera?.shake(0.5);
    } else {
      // hitscan
      const reach = w.range;
      const end = origin.clone().addScaledVector(dir, reach);
      const targets = this.player.ctx.enemies.getTargets();
      // nearest enemy along the ray
      let bestT = Infinity;
      let best = null;
      for (const t of targets) {
        const rel = new THREE.Vector3(t.pos.x - origin.x, 0, t.pos.z - origin.z);
        const along = rel.dot(new THREE.Vector3(dir.x, 0, dir.z));
        if (along < 0) continue;
        const closest = new THREE.Vector3(dir.x * along, 0, dir.z * along);
        const dx = rel.x - closest.x;
        const dz = rel.z - closest.z;
        const dSq = dx * dx + dz * dz;
        const r = (t.radius ?? 0.5) + 0.28;
        if (dSq < r * r && along < bestT) {
          bestT = along;
          best = t;
        }
      }
      const hitPoint = best ? origin.clone().addScaledVector(dir, bestT) : origin.clone().addScaledVector(dir, Math.min(reach, 70));
      this._spawnTracer(origin, hitPoint, w.tracer);

      if (best) {
        const knockDir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
        this.player.ctx.damage.applyToEnemy(best, w.dmg, {
          knock: w.knock, knockDir, isCrit: this.aimT > 0.7,
        });
        this._hitmarkT = 0.32;
      } else {
        this.player.ctx.vfx.spawnBurst(hitPoint, { color: 0xd7b284, count: 3, speed: 1.6, life: 0.22 });
      }
      this.player.ctx.camera?.kick(1.6);
    }
    // slight pull
    this.player.vel.x -= dir.x * 0.35;
    this.player.vel.z -= dir.z * 0.35;

    if (a.clip === 0) this.reload();
    return true;
  }

  /* ------------------------------------------------------------ */
  _centerRay() {
    const cam = this.player.ctx.camera?.cam;
    const ray = new THREE.Vector3(0, 0, 0.5).unproject(cam).sub(cam.position);
    return ray.normalize();
  }

  _spawnTracer(from, to, color) {
    // pooled thin beam
    let t = this._tracers.find((x) => !x.alive);
    if (!t) {
      if (this._tracers.length >= 10) return;
      const geo = new THREE.BoxGeometry(0.02, 0.02, 1);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      this.player.ctx.worldBase.scene.add(mesh);
      t = { mesh, alive: false, t: 0, life: 0.09 };
      this._tracers.push(t);
    }
    t.alive = true;
    t.t = 0;
    const mid = from.clone().lerp(to, 0.5);
    const len = from.distanceTo(to);
    t.mesh.position.copy(mid);
    t.mesh.scale.set(1, 1, len);
    t.mesh.lookAt(to);
    t.mesh.material.color.setHex(color ?? 0xffe9a6);
    t.mesh.material.opacity = 0.85;
    t.mesh.visible = true;
  }

  _updateTracers(dt) {
    for (const t of this._tracers) {
      if (!t.alive) continue;
      t.t += dt;
      const k = Math.min(1, t.t / t.life);
      t.mesh.material.opacity = 0.85 * (1 - k);
      if (k >= 1) {
        t.alive = false;
        t.mesh.visible = false;
      }
    }
  }

  /* ------------------------------------------------------------ */
  getRecoil() {
    return this._recoilT > 0 ? this._recoilT / 0.16 : 0;
  }

  getHitmarker() {
    return this._hitmarkT;
  }

  getMuzzleFlash() {
    return this._flashT;
  }

  /* HUD helper */
  hotbarInfo() {
    return this.weapons.map((w, i) => ({
      id: w.id, name: w.name, icon: w.icon, active: i === this.index,
    }));
  }
}
