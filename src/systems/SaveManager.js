// Versioned LocalStorage save system (game state + settings).
// Save format v2 keeps per-world progress, items, player stats andScalars.

import { SAVE_KEY, SETTINGS_KEY, WORLD_ORDER, CONFIG } from '../core/Constants.js';
import { app } from '../core/App.js';

function freshState() {
  return {
    version: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    world: 0,               // index into WORLD_ORDER (0 => w1)
    completedWorlds: [],
    player: {
      level: 1,
      xp: 0,
      coins: 0,
      hp: CONFIG.baseHp,
    },
    items: {},                // itemId -> true (secret items from NPCs)
    stamps: {},               // worldId -> count collected
    flags: {},                // arbitrary story flags
    missions: {},             // missionId -> { done: true, ts }
    dialogue: {},             // npcId -> talk count
    secretsFound: [],         // npcIds that granted items
    playtimeMs: 0,
    deliveryCount: 0,
    defeatedBoss: false,
  };
}

function freshSettings() {
  return {
    version: 1,
    sensitivity: 1.0,
    invertY: false,
    quality: 'medium',
    volumes: { master: 0.8, music: 0.6, sfx: 0.85 },
    showDamage: true,
  };
}

export class SaveManager {
  constructor() {
    this.state = freshState();
    this.settings = freshSettings();
    this._loadSettings();
  }

  /* ---------------- game state ---------------- */
  exists() {
    localStorage.setItem('__mb_probe', '1');
    const probe = localStorage.getItem('__mb_probe') === '1';
    localStorage.removeItem('__mb_probe');
    if (!probe) return false;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      return JSON.parse(raw)?.player?.level != null;
    } catch {
      return false;
    }
  }

  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (raw && raw.version === 2) {
        this.state = { ...freshState(), ...raw };
        return true;
      }
    } catch { /* corrupt → fresh */ }
    return false;
  }

  save(extra = {}) {
    Object.assign(this.state, extra);
    this.state.updatedAt = Date.now();
    this.state.world = app.worldScene ? app.worldScene.worldIndex : this.state.world;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.warn('[save] write failed', err);
    }
  }

  newGame() {
    const playtime = this.state.playtimeMs;
    this.state = freshState();
    this.state.playtimeMs = playtime;
    this.save();
  }

  wipe() {
    localStorage.removeItem(SAVE_KEY);
    this.state = freshState();
  }

  /* ---------------- settings ---------------- */
  loadSettings() {
    return this._loadSettings();
  }

  _loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (raw) this.settings = { ...freshSettings(), ...raw };
    } catch { /* fresh */ }
    return this.settings;
  }

  saveSettings(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (err) {
      console.warn('[settings] write failed', err);
    }
    app.bus?.emit('settings-changed', this.settings);
  }

  /* ---------------- convenience ---------------- */
  worldId() {
    return WORLD_ORDER[Math.min(this.state.world, WORLD_ORDER.length - 1)];
  }

  hasItem(id) {
    return !!this.state.items[id];
  }

  grantItem(id) {
    if (this.state.items[id]) return false;
    this.state.items[id] = true;
    return true;
  }

  markMission(id, done = true) {
    this.state.missions[id] = { done, ts: Date.now() };
  }

  isMissionDone(id) {
    return !!this.state.missions[id]?.done;
  }

  talkCount(npcId) {
    return this.state.dialogue[npcId] || 0;
  }

  addPlaytime(ms) {
    this.state.playtimeMs += ms;
  }
}
