// MainMenuScene — 3D diorama behind the Material Design main menu.
// A slow-orbiting island with the courier, the slime companion, and drifting
// envelopes. Replaces itself on menu → world transitions.

import Phaser from 'phaser';
import * as THREE from 'three';
import { app } from '../core/App.js';
import { celLights, celMesh } from '../render3/cel.js';
import { makeCourier, makeSlime } from '../render3/ProceduralModels.js';
import { Effects } from '../render3/Effects.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    // ---------- scene ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101336);
    scene.fog = new THREE.Fog(0x101336, 24, 60);
    celLights(scene, { sunColor: 0xffe0b3, hemiIntensity: 0.7, groundFill: 0x2e2350, skyFill: 0x6f5fff });

    // island platform
    const island = celMesh(new THREE.CylinderGeometry(7.6, 6.2, 1.8, 22), 0x8ef0d4);
    island.position.y = -0.95;
    scene.add(island);
    const ring = celMesh(new THREE.TorusGeometry(7, 0.3, 6, 40), 0xffce4b);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0;
    scene.add(ring);

    // crates & mailbox on the island
    const crate = celMesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), 0xc89058, { mapId: 'wood' });
    crate.position.set(2.8, 0.55, -1.6);
    crate.rotation.y = 0.6;
    scene.add(crate);
    const mailbox = celMesh(new THREE.BoxGeometry(0.6, 0.35, 0.42), 0xff5d73);
    mailbox.position.set(-2.6, 1.1, -1.2);
    scene.add(mailbox);
    const post = celMesh(new THREE.CylinderGeometry(0.07, 0.09, 1.15, 6), 0x6e4f2a);
    post.position.set(-2.6, 0.5, -1.2);
    scene.add(post);

    // the courier — idle pose with breathing & swing arms
    this.courier = makeCourier({ scale: 1.08 });
    this.courier.position.set(0, 0, 0);
    this.courier.rotation.y = Math.PI; // face the menu camera
    scene.add(this.courier);

    // the slime buddy
    this.slime = makeSlime();
    this.slime.position.set(2.1, 0.35, 1.8);
    this.slime.scale.setScalar(0.62);
    scene.add(this.slime);

    // floating envelopes orbital
    this.envelopes = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 3.6 + (i % 3) * 1.1;
      const env = celMesh(new THREE.BoxGeometry(0.52, 0.05, 0.36), 0xfdf8f8);
      const stamp = celMesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), 0xff5d73);
      stamp.position.set(0.17, 0.008, 0.08);
      env.add(stamp);
      env.position.set(Math.cos(a) * r, 1.4 + Math.sin(i * 2.1) * 0.7, Math.sin(a) * r);
      env.rotation.set(0.2, a, 0.12);
      this.envelopes.add(env);
    }
    scene.add(this.envelopes);

    // backdrop peaks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const cone = celMesh(new THREE.ConeGeometry(5 + (i % 2 ? 1.7 : 0.6), 12 + (i % 3) * 4, 6), 0x241d40);
      cone.position.set(Math.cos(a) * 22, -0.8, Math.sin(a) * 22);
      scene.add(cone);
    }

    this.sceneFX = new Effects(scene);

    // ---------- camera ----------
    this.camera = app.renderer.makeCamera(46, 0.1, 90);
    this.camera.position.set(8.6, 3.6, 10);
    this.camera.lookAt(0, 1.2, 0);
    app.renderer.setActive(scene, this.camera);

    // ---------- UI ----------
    app.audio.stopAmbient();
    app.audio.playMusic('menu');
    this._destroyUI = true;

    // enter the MD3 main menu
    app.ui.closeAll();
    app.ui.showScreen('main-menu');

    this.events.once('shutdown', () => {
      this.sceneFX?.dispose();
      app.renderer.disposeScene(scene);
    });
  }

  update(time, delta) {
    const dt = Math.min((delta ?? 16) / 1000, 0.05);
    this._t = (this._t ?? 0) + dt;
    const t = this._t;

    // orbit camera slowly on an arc
    const radius = 11;
    const angle = t * 0.16;
    this.camera.position.set(Math.cos(angle) * radius, 3.3 + Math.sin(t * 0.4) * 0.5, Math.sin(angle) * radius);
    this.camera.lookAt(0, 1.3, 0);

    // breathing courier
    const cp = this.courier.userData.parts;
    cp.body.position.y = 0.86 + Math.sin(t * 2.0) * 0.035;
    cp.legL.rotation.x = Math.sin(t * 1.7) * 0.06;
    cp.legR.rotation.x = -Math.sin(t * 1.7) * 0.06;
    cp.armL.rotation.x = -Math.sin(t * 1.7) * 0.2;
    cp.armR.rotation.x = Math.sin(t * 1.7) * 0.2 - 0.2;

    // cute slime bounce & squash
    const sq = Math.sin(t * 3.4);
    this.slime.scale.set(0.62 + -sq * 0.06, 0.62 + sq * 0.12, 0.62 + -sq * 0.06);
    this.slime.position.y = 0.35 + Math.abs(sq) * 0.24;
    this.slime.rotation.y = Math.sin(t * 0.8) * 0.5;
    const sp = this.slime.userData.parts;
    sp.face.position.y = 0.12 + Math.sin(t * 3.4) * 0.02;

    // orbit envelopes
    this.envelopes.rotation.y = t * 0.24;
    this.envelopes.position.y = Math.sin(t * 1.2) * 0.22;

    this.sceneFX.update(dt, this.camera.position);
    app.renderer.render();
  }
}
