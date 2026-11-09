// NPC villager: model + idle animation + name label + secret data.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { makeNPC } from '../render3/ProceduralModels.js';

export class NPC {
  constructor(ctx, spec, index) {
    this.ctx = ctx;
    this.spec = spec;
    this.id = spec.id;
    this.name = spec.name;
    this.pos = new THREE.Vector3(spec.pos[0], 0, spec.pos[1]);
    this.facing = spec.facing ?? 0;
    this.secret = spec.secret ?? null;
    this.role = spec.role ?? 'npc';
    this.dialog = spec.dialog ?? {};

    this.model = makeNPC(spec.palette);
    this.parts = this.model.userData.parts;
    this.model.position.copy(this.pos);
    this.model.rotation.y = this.facing;
    ctx.worldBase.scene.add(this.model);

    // name label
    this.label = ctx.vfx.makeNameLabel(this.name, { color: '#ffd34d' });
    this.label.position.set(0, 2.25, 0);
    this.label.visible = false;
    this.model.add(this.label);

    this.bobT = Math.random() * 8;
    this.talkPulse = 0;
  }

  grantSecretCheck() {
    return this.secret && !app.save.state.secretsFound?.includes(this.id);
  }

  talkCount() {
    return app.save.state.dialogue[this.id] ?? 0;
  }

  update(dt, playerPos) {
    this.bobT += dt;
    this.parts.body.position.y = 0.82 + Math.sin(this.bobT * 1.7 + 1) * 0.035;
    this.parts.armL.rotation.x = Math.sin(this.bobT * 1.3) * 0.08;
    this.parts.armR.rotation.x = -Math.sin(this.bobT * 1.3) * 0.08;

    const dist = playerPos.distanceTo(this.pos);
    this.label.visible = dist < 23 && dist > 1.2;
    if (this.label.visible) {
      this.label.material.opacity = Math.min(1, (23 - dist) / 6);
    }
    if (this.talkPulse > 0) this.talkPulse -= dt;
  }

  facePlayer(playerPos) {
    this.facing = Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
    this.model.rotation.y = this.facing;
    this.talkPulse = 1.2;
  }
}
