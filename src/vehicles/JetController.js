// JetController — the cinematic travel mechanic.
// Phases: hidden → inbound (soaring descent) → parked (prompt) → takeoff
// (gear up, taxi, launch) → fire transition scene.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { makeJet } from '../render3/ProceduralModels.js';
import { WORLD_ORDER } from '../core/Constants.js';
import { travelTo } from '../core/GameFlow.js';

export class JetController {
  constructor(worldScene) {
    this.scene = worldScene;
    this.state = 'hidden';
    this.jet = null;
    this.t = 0;
    this._exhaustAcc = 0;
  }

  spawn() {
    if (this.jet) return;
    const pad = this.scene.worldDef.jetPad ?? [0, -48];
    this.pad = new THREE.Vector3(pad[0], 0, pad[1]);
    this.jet = makeJet();
    this.origin = new THREE.Vector3(this.pad.x - 60, 26, this.pad.z - 150);
    this.jet.position.copy(this.origin);
    this.jet.scale.setScalar(1.05);
    this.scene.worldBase.scene.add(this.jet);
    this.state = 'inbound';
    this.t = 0;
    app.audio.sfx('takeoff');
    app.bus.emit('jet-arriving');
  }

  update(dt) {
    if (!this.jet) return;
    const pad = this.pad;

    if (this.state === 'inbound') {
      this.t += dt;
      const k = Math.min(1, this.t / 2.6);
      const ease = 1 - Math.pow(1 - k, 3.2);
      this.jet.position.lerpVectors(this.origin, new THREE.Vector3(pad.x, 0, pad.z), ease);
      // dive pitch as it flares out
      this.jet.rotation.x = THREE.MathUtils.lerp(0.45, 0, ease);
      this.jet.rotation.y = THREE.MathUtils.lerp(0.6, Math.atan2(pad.x - this.origin.x, pad.z - this.origin.z) + Math.PI / 2, ease);
      if (k >= 1) {
        this.state = 'parked';
        this.jet.rotation.x = 0;
        this.jet.rotation.y = Math.PI / 2;
        this.noseToPlayer?.();
        app.audio.jetLoop(false);
        app.ui.toast('Pesawat MAILWING tiba!', { icon: '✈️', title: 'RUTE BARU TERBUKA' });
        app.bus.emit('jet-parked');
      }
      this._emitExhaust(dt, 0.35);
      return;
    }

    if (this.state === 'landing') {
      this.t += dt;
      const k = Math.min(1, this.t / 2.0);
      const ease = 1 - Math.pow(1 - k, 2.6);
      this.jet.position.lerpVectors(this.origin, new THREE.Vector3(pad.x, 0, pad.z), ease);
      this.jet.rotation.x = 0.06;
      if (k >= 1) {
        this.state = 'parked';
        this.jet.rotation.x = 0;
        app.audio.jetLoop(false);
      }
      return;
    }

    if (this.state === 'boarding') {
      this.t += dt;
      const k = Math.min(1, this.t / 2.6);
      // taxi away + liftoff
      this.jet.position.z -= dt * (6 + k * 34) * (Math.PI / 2) * 0.55;
      this.jet.rotation.x = -k * 0.32;
      app.audio.jetLoop(true);
      this._emitExhaust(dt, 1);
      if (k >= 1) {
        this.state = 'gone';
        app.ui.closeAll();
        travelTo(this.scene.nextWorldIndex);
      }
      return;
    }

    // parked idle: gentle bob on gear
    this.jet.position.y = Math.sin(app.worldScene?.t * 1.6 ?? 0) * 0.02;
  }

  tryInteract() {
    if (this.state !== 'parked') return false;
    const playerPos = this.scene.player.pos;
    const d = Math.hypot(playerPos.x - this.pad.x, playerPos.z - this.pad.z);
    if (d > 3.3) return false;

    const nextName = WORLD_ORDER[this.scene.worldIndex + 1]
      ? (this.scene.worldDef?.name ?? 'dunia selanjutnya')
      : 'alam terakhir';

    app.ui.showScreen('confirm', {
      title: 'Naik MAILWING?',
      body: `Pesawat emas akan membawamu ke ${this.scene.worldDef.nextName ?? 'dunia berikutnya'}. Progres tersimpan otomatis.`,
      okText: 'Mendar ✈️',
      cancelText: 'Nanti dulu',
      onOk: () => this._boardJet(),
      onCancel: () => app.ui.closeAll(),
    });
    return true;
  }

  _boardJet() {
    this.state = 'boarding';
    this.t = 0;
    app.ui.closeAll();
    app.ui.modalOpen = false;
    this.scene.player.model.visible = false;
    app.audio.jetLoop(true);
    app.audio.sfx('takeoff');
  }

  distance() {
    if (!this.jet) return Infinity;
    const p = this.scene.player.pos;
    return Math.hypot(p.x - this.pad.x, p.z - this.pad.z);
  }

  _emitExhaust(dt, intensity) {
    if (!this.jet) return;
    this._exhaustAcc += dt;
    if (this._exhaustAcc < 0.05) return;
    this._exhaustAcc = 0;
    const n = 1 + Math.floor(intensity * 2);
    for (let i = 0; i < n; i++) {
      const off = i % 2 ? 1.35 : -1.35;
      this.scene.vfx.spawnBurst(
        this.jet.position.clone().add(new THREE.Vector3(-2.9, -0.3, off)),
        { color: 0xffc46e, count: 2, speed: 1.4 + intensity * 2.5, life: 0.7, gravity: -1, upBias: -0.2 },
      );
    }
  }

  disposeSceneObjects(scene) {
    if (!this.jet) return;
    scene?.remove(this.jet);
    this.jet = null;
    this.state = 'hidden';
  }
}
