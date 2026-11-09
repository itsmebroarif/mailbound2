// Player stats: HP, stamina, energy, XP/leveling, coins and item modifiers.
// Recomputed from the save file + secret item catalog — never store derived values.

import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';
import { collectItemFx, ITEMS } from '../systems/ItemEffects.js';

export class PlayerStats {
  constructor() {
    const s = app.save.state.player;
    this.level = s.level;
    this.xp = s.xp;
    this.coins = s.coins;
    this.hp = s.hp;
    this.stamina = CONFIG.staminaMax;
    this.energy = CONFIG.energyMax;
    this.invulnT = 0;
    this.staminaDelay = 0;
    this.regenTick = 0;
    this.lastHitAt = -1;
    this.recalc();
  }

  recalc() {
    const s = app.save.state.player;
    this.save = s;
    this.fx = collectItemFx(app.save.state);
    this.maxHp = CONFIG.baseHp + (this.level - 1) * CONFIG.hpPerLevel + (this.fx.maxHp ?? 0);
    this.atk = Math.round((CONFIG.baseAtk + (this.level - 1) * CONFIG.atkPerLevel) * (this.fx.atkMult ?? 1));
    this.dodgeChance = this.fx.dodge ?? 0;
    this.dashCd = CONFIG.dashCdBase * (this.fx.dashCdMult ?? 1);
    this.energyRegen = CONFIG.energyRegen * (this.fx.energyRegen ?? 1);
    this.hpRegen = this.fx.hpRegen ?? 0;
    this.hp = Math.min(this.hp ?? CONFIG.baseHp, this.maxHp);
  }

  /* --- economy / progression --- */
  xpToNext() {
    return Math.round(CONFIG.xpBase * Math.pow(this.level, CONFIG.xpGrowth - 1) * this.level);
  }

  addXp(n) {
    this.xp += n;
    let ups = 0;
    while (this.xp >= this.xpToNext()) {
      this.xp -= this.xpToNext();
      this.level += 1;
      ups += 1;
    }
    if (ups > 0) {
      const healBoost = ups * 44;
      this.recalc();
      this.hp = Math.min(this.maxHp, (this.hp || 0) + healBoost);
      this.energy = CONFIG.energyMax;
      app.audio.sfx('levelup');
      app.bus.emit('level-up', { level: this.level, ups });
      this._persist();
    }
    app.bus.emit('stat-changed');
  }

  addCoins(n) {
    this.coins += n;
    this._persist();
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    app.bus.emit('stat-changed');
  }

  /* --- stamina --- */
  drainStamina(n) {
    this.stamina = Math.max(0, this.stamina - n);
    this.staminaDelay = CONFIG.staminaDelay;
    app.bus.emit('stat-changed');
  }

  canDash() {
    return this.stamina >= 25;
  }

  /* --- per-frame regeneration --- */
  update(dt) {
    if (this.staminaDelay > 0) {
      this.staminaDelay -= dt;
    } else {
      this.stamina = Math.min(CONFIG.staminaMax, this.stamina + CONFIG.staminaRegen * dt);
    }
    this.energy = Math.min(CONFIG.energyMax, this.energy + this.energyRegen * dt);
    if (this.invulnT > 0) this.invulnT = Math.max(0, this.invulnT - dt);
    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.regenTick += dt;
      if (this.regenTick >= 0.5) {
        this.regenTick = 0;
        this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * 0.5);
      }
    }
  }

  _persist() {
    const s = app.save.state;
    s.player.level = this.level;
    s.player.xp = this.xp;
    s.player.coins = this.coins;
    s.player.hp = Math.round(this.hp);
    app.save.save();
    app.bus.emit('stat-changed');
  }
}

export { ITEMS };
