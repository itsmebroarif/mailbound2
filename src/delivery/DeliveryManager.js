// The delivery pipeline — the game's beating heart:
//   offer → accept → carry → marker locks → confirm → payout → chain.
// Owns the delivery marker object and fragile/timed integrity tracking.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { WORLD_ORDER } from '../core/Constants.js';
import { makeParcel } from '../render3/ProceduralModels.js';

export class DeliveryManager {
  constructor(worldScene) {
    this.scene = worldScene;
    this.worldDef = worldScene.worldDef;
    this.worldIndex = worldScene.worldIndex;
    this.worldId = worldScene.worldDef.id;

    this.active = null;            // {def, steps, index, integrity, timeLeft}
    this.marker = null;
    this.failed = false;

    // collect bonus
    this.lastDeliveryWasFragileOk = true;
  }

  /* ---------------- offers ---------------- */
  offersFor(npc) {
    if (this.active) return [];
    const s = app.save.state;
    return (this.worldDef.missions ?? [])
      .filter((m) => m.from?.npc === npc.id)
      .filter((m) => !s.missions[m.id]?.done)
      .filter((m) => (m.requireMissions ?? []).every((r) => s.missions[r]?.done))
      .filter((m) => (m.requireLevel ?? 0) <= s.player.level)
      .map((m) => m);
  }

  // Dialogue hook: completing a delivery at an NPC.
  completeDeliveryAt(npc) {
    const a = this.active;
    if (!a) return false;
    const step = a.steps[a.index];
    if (step?.type !== 'npc') return false;
    this._completeStep();
    return true;
  }

  deliveriesTo(npc) {
    // is there a pending delivery step whose target is THIS npc?
    if (!this.active) return false;
    const step = this.active.steps[this.active.index];
    return step?.type === 'npc' && step.npcId === npc.id;
  }

  accept(mission) {
    if (this.active) return false;
    const steps = [];
    const pushStep = (n) => {
      if (!n) return;
      if (n.npc) {
        const npc = this.scene.npcManager.byId(n.npc);
        steps.push({ type: 'npc', npcId: n.npc, pos: npc ? npc.pos.clone() : null });
      } else if (n.point) {
        steps.push({ type: 'point', point: n.point, pos: new THREE.Vector3(n.point[0], 0, n.point[1]) });
      }
    };
    if (mission.to?.multi) mission.to.multi.forEach(pushStep);
    else pushStep(mission.to);

    if (mission.boss) {
      // Boss finale: objective points to the arena instead of a destination.
      this.active = {
        def: mission,
        steps: [{ type: 'arena', pos: this.scene.arenaPos ?? new THREE.Vector3(0, 0, -16) }],
        index: 0,
        boss: true,
      };
    } else {
      this.active = {
        def: mission,
        steps,
        index: 0,
        boss: false,
        integrity: mission.fragile ? 100 : null,
        timeLeft: mission.timeLimit ?? null,
      };
    }

    this._spawnMarker(this.active.steps[0]);
    this.scene.player.showPackage(mission.type);
    app.audio.sfx('quest');
    app.ui.toast(`Misi: ${mission.title}`, { icon: '📨', title: 'MISI BARU' });
    app.bus.emit('mission-changed', this.active);
    return true;
  }

  /* ---------------- marker ---------------- */
  _spawnMarker(step) {
    if (this.marker) {
      this.scene.worldBase.scene.remove(this.marker);
    }
    this.marker = this.scene.vfx.makeMarker({
      color: this.active.def.type === 'urgent' ? 0xff5d73 : this.active.def.type === 'fragile' ? 0xb28cff : 0xffce4b,
    });
    this.marker.position.copy(step.pos);
    this.scene.worldBase.scene.add(this.marker);
  }

  currentTarget() {
    return this.active?.steps?.[this.active.index] ?? null;
  }

  distanceToTarget() {
    const t = this.currentTarget();
    if (!t) return null;
    const p = this.scene.player.pos;
    return Math.hypot(p.x - t.pos.x, p.z - t.pos.z);
  }

  tryInteract() {
    const step = this.currentTarget();
    if (!step || !this.active) return false;
    const d = this.distanceToTarget();
    if (d > 2.6) return false;

    if (this.active.boss) return false; // boss hook handled by WorldScene/BossSlime

    // step type npc → dialogue flow handles the handoff; point → direct complete
    if (step.type === 'point') {
      this._completeStep();
      return true;
    }
    return false; // NPC delivery resolved from DialogueSystem with its own confirm
  }

  _completeStep() {
    const a = this.active;
    a.index += 1;
    if (a.index >= a.steps.length) {
      this._finishMission();
      return true;
    }
    this._spawnMarker(a.steps[a.index]);
    app.audio.sfx('pickup');
    app.ui.toast(`Lanjut: ${a.steps.length - a.index} pemberhentian lagi`, { icon: '🗺️', title: this.active.def.title });
    app.bus.emit('mission-changed', this.active);
    return false;
  }

  _finishMission() {
    const a = this.active;
    const m = a.def;
    const bonus = m.fragile ? Math.round(m.rewards.coins * (a.integrity ?? 100) / 100) : m.rewards.coins;

    app.save.markMission(m.id);
    app.save.addPlaytime(0); // placeholder no-op, actual tick tracked by scene
    this.scene.player.stats.addXp(m.rewards.xp);
    this.scene.player.stats.addCoins(bonus);
    app.save.state.deliveryCount += 1;
    app.save.save();

    app.audio.sfx('deliver');
    app.ui.toast(`${m.title} selesai! +${m.rewards.xp} XP +${bonus} koin`, { icon: '✅', title: 'PENGIRIMAN SELESAI' });
    app.bus.emit('mission-complete', { mission: m });
    app.bus.emit('mission-changed', null);

    // fragile integrity bonus toast
    if (m.fragile) {
      const ok = (a.integrity ?? 100) >= 70;
      app.ui.toast(ok ? `Fragile bonus aktif (+${Math.round(m.rewards.coins * a.integrity / 100 - m.rewards.coins)} koin)` : 'Barang sedikit penyok... tapi selamat!', {
        icon: ok ? '🎁' : '📦',
        title: 'Fragile Report',
      });
    }

    if (this.marker) this.scene.worldBase.scene.remove(this.marker);
    this.marker = null;
    this.active = null;
    this.scene.player.hidePackage();

    // check world completion
    this._maybeCompleteWorld();
  }

  _maybeCompleteWorld() {
    const all = (this.worldDef.missions ?? []).filter((m) => m.main);
    const done = app.save.state.missions ?? {};
    const complete = all.every((m) => done[m.id]?.done);
    if (complete && !app.save.state.completedWorlds.includes(this.worldId)) {
      app.bus.emit('world-main-complete', { worldId: this.worldId, worldIndex: this.worldIndex });
    }
  }

  /* ---------------- damages reduce fragile integrity ---------------- */
  notePlayerHit() {
    const a = this.active;
    if (!a || !a.def.fragile) return;
    a.integrity = Math.max(0, (a.integrity ?? 100) - 25);
    app.bus.emit('mission-changed', a);
    if (a.integrity <= 0) {
      app.ui.toast('Paketnya kini kurang layak antarkan…', { icon: '📦', title: 'Fragile' });
      this.active.def = { ...a.def, fragile: false }; // stop scolding
    }
  }

  update(dt) {
    const a = this.active;
    if (!a) return;
    if (a.timeLeft != null) {
      a.timeLeft -= dt;
      if (a.timeLeft <= 0) {
        app.ui.toast('Waktu habis! Penerima pergi…', { icon: '⏰', title: a.def.title });
        this._spawnMarkerRemoval();
        app.audio.sfx('ui_cancel');
        this.active = null;
        this.scene.player.hidePackage();
        app.bus.emit('mission-changed', null);
        return;
      }
    }
    // marker bob
    if (this.marker) {
      this.marker.userData.update?.(this.scene.t);
    }
  }

  _spawnMarkerRemoval() {
    if (this.marker) this.scene.worldBase.scene.remove(this.marker);
    this.marker = null;
  }

  isFragileActive() {
    return this.active?.def?.fragile === true;
  }

  abandon() {
    this._spawnMarkerRemoval();
    this.active = null;
    this.scene.player.hidePackage();
    app.bus.emit('mission-changed', null);
  }
}
