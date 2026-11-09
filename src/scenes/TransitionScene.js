// TransitionScene — cinematic jet flight through cloud belts + world card UI.
// Launched when the player finishes a world (jet journey). Auto-advances after
// a few seconds, or on the "Mendar" button on the world-card screen.

import Phaser from 'phaser';
import * as THREE from 'three';
import { app } from '../core/App.js';
import { celLights, celMesh } from '../render3/cel.js';
import { makeJet } from '../render3/ProceduralModels.js';
import { Effects, spawnConfetti } from '../render3/Effects.js';
import { WORLD_ORDER, WORLD_META } from '../core/Constants.js';
import { enterWorld } from '../core/GameFlow.js';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Transition' });
  }

  init(data) {
    this.toWorld = data?.toWorld || 'w2';
  }

  create() {
    this.toIndex = Math.max(0, WORLD_ORDER.indexOf(this.toWorld));
    this.worldId = this.toWorld;
    this.worldName = WORLD_META[this.worldId]?.name ?? this.worldId;

    // ---------- 3D sky gantry ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1638);
    scene.fog = new THREE.Fog(0x1c1638, 10, 80);
    celLights(scene, { sunColor: 0xffd6a0, hemiIntensity: 0.7, sunIntensity: 1.0, groundFill: 0x2c2248, skyFill: 0x4a3f7a, sunPos: [8, 16, 10] });

    // the jet — chase camera behind
    this.jet = makeJet();
    this.jet.position.set(0, 0, 0);
    this.jet.rotation.y = Math.PI / 2;
    scene.add(this.jet);

    // cloud puffs (toon spheres) scattered along the flight line
    this.clouds = [];
    for (let i = 0; i < 26; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 5; j += 1) {
        const puff = celMesh(
          new THREE.SphereGeometry(1.1 + Math.random() * 1.3, 8, 6),
          0xf3f6ff,
        );
        puff.position.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 1.4);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 36, (Math.random() - 0.5) * 10, -i * 6 - 6);


      scene.add(cloud);
      this.clouds.push(cloud);
    }

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starArr = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i += 1) {
      starArr[i * 3] = (Math.random() - 0.5) * 220;
      starArr[i * 3 + 1] = (Math.random() - 0.5) * 120;
      starArr[i * 3 + 2] = -Math.random() * 320;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.32, transparent: true, opacity: 0.85 }));
    scene.add(stars);

    // camera chase
    this.cam3d = app.renderer.makeCamera(52, 0.1, 300);
    this.cam3d.position.set(-6.4, 1.6, 4.2);
    this.cam3d.lookAt(4, 0.3, 0);

    this.vfx = new Effects(scene);

    app.renderer.setActive(scene, this.cam3d);
    app.audio.stopMusic();
    app.audio.stopAmbient();
    app.audio.jetLoop(true);

    // ---------- world card in DOM ----------
    app.ui.showScreen('world-card', {
      worldId: this.toWorld,
      worldIndex: this.toIndex,
      missions: this._missionsCount(this.toWorld),
    });

    // safety: auto-advance even if the player never presses the button
    this._autoEnter = setTimeout(() => {
      this._finish();
    }, 6000);

    this.events.once('shutdown', () => {
      clearTimeout(this._autoEnter);
      app.audio.jetLoop(false);
      this.sceneFX?.dispose?.();
      this.vfx?.dispose?.();
      app.renderer.disposeScene(scene);
    });
  }

  _missionsCount(worldId) {
    // hand-counted per world (long-form design truth)
    const counters = { w1: 5, w2: 5, w3: 5, w4: 5, w5: 5 };
    return counters[worldId] ?? 5;
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    clearTimeout(this._autoEnter);
    app.ui.closeAll();
    app.ui.modalOpen = false;
    app.audio.jetLoop(false);
    app.audio.sfx('takeoff');
    enterWorld(this.toWorld || 'w2', 'landing');
  }

  update(time, delta) {
    const dt = Math.min((delta ?? 16) / 1000, 0.05);
    this._t = (this._t ?? 0) + dt;
    const t = this._t;

    // gentle chase-camera sway + forward speed
    this.jet.position.y = Math.sin(t * 1.4) * 0.18;
    this.jet.rotation.z = Math.sin(t * 0.9) * 0.08 + 0.12;
    this.cam3d.position.set(
      -6.4 + Math.sin(t * 0.7) * 0.25,
      1.6 + Math.sin(t * 0.55) * 0.22,
      4.2 + Math.cos(t * 0.6) * 0.25,
    );
    this.cam3d.lookAt(4, 0.4, 0);

    // push clouds toward the viewer, wrap around
    for (const cloud of this.clouds) {
      cloud.position.z += dt * 11.5;
      if (cloud.position.z > 10) {
        cloud.position.z -= 170 + Math.random() * 30;
        cloud.position.x = (Math.random() - 0.5) * 36;
        cloud.position.y = (Math.random() - 0.5) * 10;
      }
    }

    // periodic exhaust puffs
    this._acc = (this._acc ?? 0) + dt;
    if (this._acc > 0.06) {
      this._acc = 0;
      this.vfx.spawnBurst(this.jet.position.clone().add(new THREE.Vector3(-3.1, -0.3, 1.35)), {
        color: 0xffc46e, count: 2, speed: 1.2, life: 0.5, gravity: -1,
      });
      this.vfx.spawnBurst(this.jet.position.clone().add(new THREE.Vector3(-3.1, -0.3, -1.35)), {
        color: 0xffc46e, count: 2, speed: 1.2, life: 0.5, gravity: -1,
      });
    }

    this.vfx.update(dt, this.cam3d.position);

    // once the world card is visible, advance on either button or timeout
    if (!this._done && this._t > 6.2) this._finish();

    app.renderer.render();
  }
}

