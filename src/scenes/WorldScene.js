// WorldScene: the one and only gameplay scene. Phaser drives the loop;
// Three.js renders the world underneath; HUD is launched as a sibling scene.

import Phaser from 'phaser';
import * as THREE from 'three';
import { app, } from '../core/App.js';
import { WORLD_ORDER, WORLD_META, SKILLS, CONFIG } from '../core/Constants.js';
import { getWorldData } from '../worlds/index.js';
import { WorldBase } from '../worlds/WorldBase.js';
import { Effects } from '../render3/Effects.js';
import { Player } from '../player/Player.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { ProjectilePool } from '../enemies/ProjectilePool.js';
import { NPCManager } from '../npc/NPCManager.js';
import { DeliveryManager } from '../delivery/DeliveryManager.js';
import { JetController } from '../vehicles/JetController.js';
import { DialogueSystem } from '../dialogue/DialogueSystem.js';
import { CameraManager } from '../systems/CameraManager.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { DamageSystem } from '../combat/DamageSystem.js';
import { BossSlime } from '../enemies/BossSlime.js';
import { TrafficSystem } from '../worlds/Traffic.js';
import { TurnBattle } from '../combat/TurnBattle.js';
import { makeStamp } from '../render3/ProceduralModels.js';
import { spawnConfetti } from '../render3/Effects.js';

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'World' });
  }

  init(data) {
    this._entry = (data && data.entry) || 'first';
    this._requestedWorldId = data?.worldId || WORLD_ORDER[app.save.state.world ?? 0] || 'w1';
  }

  create() {
    const worldId = this._requestedWorldId;
    const worldIndex = Math.max(0, WORLD_ORDER.indexOf(worldId));
    this.worldId = worldId;
    this.worldIndex = worldIndex;
    this.worldDef = getWorldData(worldId);
    this.nextWorldIndex = worldIndex + 1;

    this.t = 0;
    this.worldActive = true;
    this.bossActive = false;
    this.boss = null;
    this._bossDefeatHandled = false;
    this._deathHandled = false;
    this.prompt = null;
    this._introShown = false;
    this._collectStamps = [];
    this._worldToastClock = 0;

    // store world index in save immediately (used by journal aggregates etc.)
    app.save.state.world = this.worldIndex;
    app.save.state.stamps = app.save.state.stamps ?? {};

    // ---------- build the 3D world ----------
    this.worldBase = new WorldBase(worldId, this.worldDef);
    this.vfx = new Effects(this.worldBase.scene);
    this.vfx.setAmbient(this.worldDef.theme?.ambient ?? null);

    // ---------- player ----------
    const spawn = this._entry === 'respawn' || this._entry === 'hub'
      ? this.worldDef.hub ?? this.worldDef.spawn
      : this.worldDef.spawn;
    this.player = new Player(this, spawn);
    if (this._entry === 'respawn') {
      this.player.stats.hp = Math.ceil(this.player.stats.maxHp * 0.55);
      this.player.stats.energy = CONFIG.energyMax;
    }

    // ---------- systems ----------
    this.camera = new CameraManager(this);
    this.damage = new DamageSystem(this);
    this.combat = new CombatSystem(this);
    this.enemies = new EnemyManager(this);
    this.projectiles = new ProjectilePool(this.worldBase.scene);
    this.projectiles.fx = this.vfx;
    this.projectiles.shake = (a) => this.camera?.shake(a);
    this.projectiles.aoeDamage = (enemy, dmg) => this.damage.applyToEnemy(enemy, dmg, { knock: 7 });
    this.npcManager = new NPCManager(this);
    this.traffic = this.worldDef.traffic ? new TrafficSystem(this, this.worldDef.traffic) : null;
    this.delivery = new DeliveryManager(this);
    this.jet = new JetController(this);
    this.dialogue = new DialogueSystem(this);
    this.battle = new TurnBattle(this);

    app.renderer.setActive(this.worldBase.scene, this.camera.cam);

    // ---------- collectibles (golden stamps) ----------
    this._spawnStamps();

    // ---------- HUD ----------
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    this.scene.launch('HUD');

    // ---------- audio ----------
    app.audio.playMusic(WORLD_META[worldId]?.music ?? 'w1');
    app.audio.playAmbient(worldId);

    // ---------- registry ----------
    app.worldScene = this;
    this.events.once('shutdown', () => this._teardown());
    if (this._entry === 'landing') this._entryLanding();
    this._toastIntro();
    this._bindBus();

    // write the world index into the save
    app.save.save();
  }

  /* ------------------------------------------------------------------ */
  _spawnStamps() {
    this._collectStamps = (this.worldDef.collectibles ?? []).map((point, i) => {
      const flags = app.save.state.flags ?? {};
      const key = `${this.worldId}:stamp:${i}`;
      if (flags[key]) return { taken: true };
      const mesh = makeStamp();
      mesh.position.set(point[0], 1.1, point[1]);
      this.worldBase.scene.add(mesh);
      return { mesh, taken: false, index: i, point };
    });
  }

  _updateStamps(dt) {
    const p = this.player.pos;
    for (const s of this._collectStamps) {
      if (s.taken) continue;
      s.mesh.rotation.y += dt * 2.1;
      s.mesh.position.y = 1.1 + Math.sin(this.t * 2.4 + s.index) * 0.16;
      const d = Math.hypot(s.mesh.position.x - p.x, s.mesh.position.z - p.z);
      if (d < 1.5) this._collectStamp(s);
    }
  }

  _collectStamp(s) {
    s.taken = true;
    this.worldBase.scene.remove(s.mesh);
    const worldId = this.worldId;
    const flags = app.save.state.flags = app.save.state.flags ?? {};
    flags[`${worldId}:stamp:${s.index}`] = true;
    const stamps = app.save.state.stamps = app.save.state.stamps ?? {};
    stamps[worldId] = (stamps[worldId] ?? 0) + 1;
    app.save.save();
    this.vfx.spawnBurst(s.mesh.position.clone(), { color: 0xffce4b, count: 14, speed: 4, life: 0.45 });
    app.audio.sfx('coin');
    app.bus.emit('stamp-collected', { worldId, count: stamps[worldId] });
    app.ui.toast('Stempel emas!', { icon: '🔖', title: 'KOLEKSI' });
  }

  /* ------------------------------------------------------------------ */
  _entryLanding() {
    // firework greeting for every new world arrival by air
    this.vfx.spawnBurst(this.player.pos.clone().add(new THREE.Vector3(0, 3.4, -4)), {
      color: 0xffce4b, count: 26, speed: 6, life: 0.6,
    });
    this.vfx.spawnRing(this.player.pos.clone(), { color: 0xffce4b, r1: 6, life: 0.5 });
    app.audio.sfx('takeoff');
  }

  _toastIntro() {
    if (this._entry === 'respawn') return;
    const first = WORLD_ORDER.indexOf(this.worldId) === 0;
    this._introShown = true;
    if (first) {
      app.ui.toast('Temukan Postmaster Pip di stasiun pos', { icon: '📬', title: 'ROSY FIELDS' });
    } else {
      app.ui.toast(`Selamat datang di ${WORLD_META[this.worldId]?.name ?? this.worldId}`, { icon: '✈️', title: 'PERLOMBAAN BARU' });
    }
    app.ui.toast('🖱 Klik di dunia untuk mengunci mouse · Esc untuk pause', { icon: '🖱️', title: 'KENDALI' });
  }

  _bindBus() {
    this._offs = [
      app.bus.on('world-main-complete', ({ worldId, worldIndex }) => this._onWorldComplete(worldId, worldIndex)),
      app.bus.on('player-death', () => this._onPlayerDeath()),
      app.bus.on('boss-end', () => this._onBossEnd()),
      app.bus.on('player-hurt', () => this.delivery.notePlayerHit()),
      app.bus.on('jet-parked', () => {
        if (this.jet.state === 'parked') {
          app.ui.toast('Papan "NAIK" berkilau — tekan E di dekat pesawat', { icon: '🛫', title: 'GEMAS' });
        }
      }),
    ];
  }

  _onWorldComplete(worldId, worldIndex) {
    if (worldIndex >= WORLD_ORDER.length - 1) {
      // final world — never spawn jet, boss flow takes over
      return;
    }
    app.ui.toast('Rute utama selesai! Pesawat sudah mendarat di landasan.', {
      icon: '🏰', title: 'DUNIA SELESAI',
    });
    this.jet.spawn();
    app.save.save();
  }

  _onPlayerDeath() {
    if (this._deathHandled) return;
    this._deathHandled = true;
    app.ui.showScreen('game-over', { reason: 'Kau tumbang di rute yang berbahaya…' });
  }

  _onBossEnd() {
    this.bossActive = false;
    if (this._bossDefeatHandled) return;
    this._bossDefeatHandled = true;
    app.save.state.defeatedBoss = true;
    app.save.markMission('w5_m3');
    app.save.save();
    spawnConfetti(this.vfx, this.player.pos.clone().add(new THREE.Vector3(0, 2, 0)), 100);
    app.audio.playMusic('victory');
    setTimeout(() => {
      app.ui.showScreen('victory', {
        coins: app.save.state.player.coins,
        stamps: Object.values(app.save.state.stamps ?? {}).reduce((a, b) => a + Number(b || 0), 0),
        deliveries: app.save.state.deliveryCount,
        playtimeMs: app.save.state.playtimeMs ?? 0,
      });
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  arenaPosVec() {
    return this.worldDef.arena ? new THREE.Vector3(this.worldDef.arena.cx, 0, this.worldDef.arena.cz) : null;
  }

  _checkBattleTrigger() {
    if (this.battle?.active) return;
    for (const e of this.enemies.getTargets()) {
      const distSq = e.pos.distanceToSquared(this.player.pos);
      if (distSq < 2.6 * 2.6) {
        const group = this.enemies.getTargets().filter((x) => x.pos.distanceToSquared(e.pos) < 60);
        this.battle.startEncounter(group);
        break;
      }
    }
  }

  _checkBossTrigger() {
    if (this.boss != null) return;
    const active = this.delivery.active;
    if (!active?.boss) return;
    const arena = this.worldDef.arena;
    if (!arena) return;
    const d = Math.hypot(this.player.pos.x - arena.cx, this.player.pos.z - arena.cz);
    if (d <= arena.radius + 1.2) {
      // start the fight!
      this.boss = new BossSlime(this, { x: arena.cx, z: arena.cz }, () => this._onBossEnd());
      this.bossActive = true;
      this._bossDefeatHandled = false;
      app.audio.playMusic('boss');
      app.ui.toast('«UYEEEHHH!!»', { icon: '🫧', title: 'UYEHH MUNCUL!' });
      app.bus.emit('boss-start');
    }
  }

  /* ------------------------------------------------------------------ */
  // interaction scan each frame (cheap: few objects)
  _updatePrompt() {
    const p = this.player.pos;
    let prompt = null;

    // Jet > delivery target > NPC
    if (this.jet.distance() < 3.4 && this.jet.state === 'parked') {
      prompt = { key: 'E', text: 'Naik MAILWING → ke destinasi berikutnya', accent: 'gold' };
    } else if (this.delivery.currentTarget()) {
      const d = this.delivery.distanceToTarget() ?? Infinity;
      if (d < 2.8) {
        prompt = { key: 'E', text: 'Antarkan paket', accent: 'gold' };
      }
    }
    // NPC prompts override destination-order when close
    const nearNpc = this.npcManager.nearest(2.6);
    if (nearNpc) {
      const hasParcel = this.delivery.deliveriesTo(nearNpc);
      prompt = {
        key: 'E',
        text: `${hasParcel ? 'Serahkan paket kepada' : 'Ngobrol dengan'} ${nearNpc.name}`,
        npcId: nearNpc.id,
      };
    }

    // interact key edge pressing
    if (prompt && app.input.pressed('KeyE')) {
      if (prompt.npcId) {
        const npc = this.npcManager.byId(prompt.npcId);
        this.dialogue.open(npc);
      } else if (this.jet.state === 'parked' && this.jet.distance() < 3.4) {
        this.jet.tryInteract();
      } else {
        this.delivery.tryInteract();
      }
      prompt = null;
    }

    this.prompt = prompt;
  }

  /* ------------------------------------------------------------------ */
  refocus() {
    // called after a modal is closed from the world (pause "Lanjutkan")
    app.input.requestLock();
  }

  referenceSlowmo(seconds) {
    this.combat.addSlowmo(seconds);
  }

  update(time, delta) {
    const dt = Math.min((delta ?? 16) / 1000, 0.05);
    this.t += dt;
    app.save.state.playtimeMs = (app.save.state.playtimeMs ?? 0) + dt * 1000;

    if (app.ui.modalOpen || !this.worldActive) {
      // keep the world alive visually; no sim when in a menu/dialog
      this.camera.update(dt * 0.3);
      this.worldBase.update(dt);
      this.vfx.update(dt, this.camera.position);
      this.combat.update(dt);
      this.render_frame();
      app.input.endFrame();
      return;
    }

    const ts = this.combat.worldTimeScale;
    const simDt = dt * ts;
    this.camera.dutch = 0;

    if (this.battle?.active) {
      // TACTICAL CLASH — world paused, boss fights inside the same system
      this.battle.update(dt);
      this.camera.dutch = -0.062;
      this.vfx.update(simDt, this.camera.position);
      this.camera.update(dt);
      this.delivery.update(simDt);
      this.jet.update(simDt);
      // keep boss arena clamp alive
      if (this.bossActive && this.worldDef.arena) {
        const arena = this.worldDef.arena;
        const dx = this.player.pos.x - arena.cx;
        const dz = this.player.pos.z - arena.cz;
        const d = Math.hypot(dx, dz);
        const lim = arena.radius + 0.4;
        if (d > lim) {
          const s = lim / d;
          this.player.pos.x = arena.cx + dx * s;
          this.player.pos.z = arena.cz + dz * s;
        }
      }
      app.input.endFrame();
      app.input.update();
      this.render_frame();
      return;
    }

    // core sim
    this.player.update(simDt);
    this.worldBase.update(simDt);
    this.vfx.update(simDt, this.camera.position);
    this.camera.update(dt);
    this.enemies.update(simDt, this.player);
    const projHits = this.projectiles.update(simDt, { player: this.player, enemies: this.enemies.getTargets() });
    for (const hit of projHits) {
      this.damage.applyToPlayer(hit.projectile.dmg, { fromPos: hit.projectile.mesh.position });
    }
    this.npcManager.update(simDt);
    this.delivery.update(simDt);
    this.jet.update(simDt);
    this.traffic?.update(simDt);
    this.combat.update(dt);
    if (this.boss) this.boss.update(simDt, { player: this.player });

    // arena clamp during the boss fight
    if (this.bossActive && this.worldDef.arena) {
      const arena = this.worldDef.arena;
      const dx = this.player.pos.x - arena.cx;
      const dz = this.player.pos.z - arena.cz;
      const d = Math.hypot(dx, dz);
      const lim = arena.radius + 0.4;
      if (d > lim) {
        const s = lim / d;
        this.player.pos.x = arena.cx + dx * s;
        this.player.pos.z = arena.cz + dz * s;
      }
    }

    this._updateStamps(simDt);
    this._updatePrompt();
    this._checkBossTrigger();
    this._checkBattleTrigger();

    // periodic autosave (every 45s)
    this._worldToastClock += dt;
    if (this._worldToastClock > 45) {
      this._worldToastClock = 0;
      app.save.save();
    }

    app.input.endFrame();
    app.input.update();
    this.render_frame();
  }

  render_frame() {
    app.renderer.render();
  }

  _teardown() {
    if (this._offs) for (const off of this._offs) off?.();
    this.traffic?.dispose?.();
    app.audio.stopAmbient();
    this.projectiles?.dispose?.();
    if (this.worldBase?.scene) {
      app.renderer.disposeScene(this.worldBase.scene);
    }
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    app.worldScene = null;
  }
}
