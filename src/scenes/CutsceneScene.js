// CutsceneScene — OPENING "MAILBOUND" style-of-Persona-5 cinematic:
// a courier hangs off a train rail bar speeding through a neon city, then the
// world blurs past… and the route begins. Skippable with Esc / any key / click.
// All subtitles in Indonesian. Fully procedural.

import Phaser from 'phaser';
import * as THREE from 'three';
import { app } from '../core/App.js';
import { celLights, celMesh } from '../render3/cel.js';
import { makeCourier } from '../render3/ProceduralModels.js';
import { tex } from '../core/AssetManager.js';
import { enterWorld } from '../core/GameFlow.js';

const LINES = [
  { t: 0.4, dur: 3.2, text: 'Kota Rosy Fields…', sub: 'Tempat di mana setiap surat punya cerita.' },
  { t: 3.8, dur: 3.4, text: 'Kota di mana setiap surat sampai…', sub: 'Dan setiap kurir punya tujuan.' },
  { t: 7.4, dur: 3.4, text: 'KURIR MAILBOUND:', sub: 'ARIF ALEXANDER — pewaris Rute Terakhir.' },
];

const SCENE_END = 11.2;

export class CutsceneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Cutscene' });
  }

  init(data) {
    this.toWorld = data?.toWorld || 'w1';
    this._skipped = false;
    this._hud = null;
    this._t = 0;
  }

  create() {
    // ---------- 3D: tunnel of endless city lights ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1030);
    scene.fog = new THREE.Fog(0x0e1030, 4, 26);

    celLights(scene, { sunColor: 0xffe6b0, hemiIntensity: 0.75, groundFill: 0x241a30, skyFill: 0x4a3f7a, sunIntensity: 0.9, sunPos: [2, 6, 10] });

    // tunnel tube (interior of the mail train / city loop)
    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.4, 80, 18, 8, true),
      new THREE.MeshToonMaterial({ color: 0x20264a, map: tex('window', { size: 256, repeatX: 6, repeatY: 2 }), side: THREE.BackSide, gradientMap: null }),
    );
    tunnel.rotation.z = Math.PI / 2;
    tunnel.position.y = 1.6;
    this._tunnel = tunnel;
    scene.add(tunnel);

    // rail bar the courier hangs from
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 7.2, 8),
      new THREE.MeshToonMaterial({ color: 0xdfe9f5 }),
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.6, 3.2);
    scene.add(rail);

    // support pillars fly past (speed illusion)
    this._pillars = [];
    for (let i = 0; i < 26; i += 1) {
      const x = (Math.random() > 0.5 ? 1 : -1) * (3.05 + Math.random() * 0.9);
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 3.6, 0.32),
        new THREE.MeshToonMaterial({ color: i % 2 ? 0xffb43d : 0xff5d73, gradientMap: null }),
      );
      pillar.position.set(x, 1.6, -i * 3.4 - 4);
      scene.add(pillar);
      this._pillars.push(pillar);
    }

    // neon speed streaks
    this._streaks = [];
    for (let i = 0; i < 14; i += 1) {
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 3.2),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd34d : 0x5ec8ff }),
      );
      streak.position.set(
        (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2.2),
        Math.random() * 3.4 + 0.2,
        -Math.random() * 40,
      );
      scene.add(streak);
      this._streaks.push(streak);
    }

    // the courier hanging by one arm
    this.courier = makeCourier({ scale: 0.96 });
    const parts = this.courier.userData.parts;
    parts.armR.rotation.x = Math.PI;             // arm stretched upward (hanging)
    parts.armR.position.set(0.34, 0.4, 0);
    parts.legL.rotation.x = 0.35;
    parts.legR.rotation.x = -0.2;
    parts.body.rotation.z = 0.06;
    this.courier.position.set(0.1, 0.42, 3.2);
    this.courier.rotation.y = Math.PI;
    scene.add(this.courier);

    // camera
    this.cam3d = app.renderer.makeCamera(44, 0.1, 90);
    this.cam3d.position.set(2.6, 1.9, 5.4);
    this.cam3d.lookAt(0, 1.5, 2.6);
    app.renderer.setActive(scene, this.cam3d);

    // ---------- DOM: letterbox + subtitle + loading ----------
    this._hud = this._buildHud();
    document.getElementById('ui-root').appendChild(this._hud);
    requestAnimationFrame(() => this._hud.classList.add('open'));

    // ---------- skip & audio ----------
    this._skipKeys = (e) => {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') this.skip();
    };
    document.addEventListener('keydown', this._skipKeys);
    this._hudClick = () => this.skip();
    this._hud.addEventListener('click', this._hudClick);

    app.audio.stopMusic();
    app.audio.stopAmbient();
    app.audio.sfx('takeoff');
    app.worldScene = null;
    this._subs = [];

    this.events.once('shutdown', () => this._teardown());
  }

  _buildHud() {
    const el = document.createElement('div');
    el.id = 'cutscene-hud';
    el.innerHTML = `
      <div class="cs-bars" aria-hidden="true"><div class="cs-bar top"></div><div class="cs-bar bottom"></div></div>
      <div class="cs-skip">ESC / KLIK — LEWATI</div>
      <div class="cs-chapter">BAB I — SURAT TERAKHIR</div>
      <div class="cs-subtitles">
        ${LINES.map((l, i) => `
          <div class="cs-sub" data-i="${i}" style="opacity:0">
            <div class="cs-sub-line">${l.text}</div>
            <div class="cs-sub-sub">${l.sub}</div>
          </div>`).join('')}
      </div>
      <div class="cs-loading">
        <div class="cs-loading-label">MEMUAT CERITA…<span class="cs-pct">0%</span></div>
        <div class="cs-loading-track"><div class="cs-loading-fill"></div></div>
        <div class="cs-loading-tip">Bedil tidak diajarkan kurir. Katana dan martabat saja.</div>
      </div>
      <div class="cs-logo">MAIL<span>BOUND</span></div>
    `;
    return el;
  }

  update(time, delta) {
    const dt = Math.min((delta ?? 16) / 1000, 0.05);
    this._t += dt;
    const t = this._t;

    // tunnel & pillars flow past
    this._tunnel.material.map.offset.x -= dt * 1.6;
    for (const pillar of this._pillars) {
      pillar.position.z += dt * 26;
      if (pillar.position.z > 5) pillar.position.z -= 78;
    }
    for (const streak of this._streaks) {
      streak.position.z += dt * 60;
      if (streak.position.z > 5) streak.position.z -= 46;
    }

    // courier sways hanging
    const sway = Math.sin(t * 1.7) * 0.05;
    this.courier.rotation.z = sway;
    this.courier.position.y = 0.42 + Math.sin(t * 2.3) * 0.02;
    this.courier.userData.parts.body.position.y = 0.86 + Math.sin(t * 2.1) * 0.03;

    // camera drift & slight roll
    this.cam3d.position.set(2.6 + Math.sin(t * 0.4) * 0.2, 1.9 + Math.sin(t * 0.6) * 0.12, 5.4);
    this.cam3d.lookAt(0, 1.45, 2.4);
    this.cam3d.rotation.z = -0.05 + Math.sin(t * 0.5) * 0.02;

    // reveal subtitle stages
    for (let i = 0; i < LINES.length; i += 1) {
      const line = LINES[i];
      const show = t >= line.t && t <= line.t + line.dur + 0.5;
      const el = this._hud?.querySelector(`[data-i="${i}"]`);
      if (el) el.style.opacity = show ? String(Math.min(1, (t - line.t) / 0.25)) : '0';
      if (this._subs[i] !== true && t >= line.t + 0.05 && t <= line.t + 0.3) {
        this._subs[i] = true;
        app.audio.babble?.(line.text + ' ' + line.sub);
      }
    }

    // loading bar fill
    const lp = Math.min(1, Math.max(0, (t - 8.6) / 3.4));
    const fill = this._hud?.querySelector('.cs-loading-fill');
    const pct = this._hud?.querySelector('.cs-pct');
    if (fill) fill.style.width = `${lp * 100}%`;
    if (pct) pct.textContent = `${Math.round(lp * 100)}%`;
    this._hud?.classList.toggle('ready', lp >= 1);

    // logo crash-in
    this._hud?.classList.toggle('logo-crash', t > 6.2 && t < 9.4);

    // auto-advance at the end
    if (t >= SCENE_END) this.skip();

    app.renderer.render();
  }

  skip() {
    if (this._skipped) return;
    this._skipped = true;
    app.audio.sfx('ui_confirm');
    app.ui.closeAll();
    app.ui.modalOpen = false;
    this.scene.stop('Cutscene');
    enterWorld(this.toWorld || 'w1', 'landing');
  }

  _teardown() {
    document.removeEventListener('keydown', this._skipKeys);
    this._hud?.remove?.();
    this._hud = null;
  }
}
