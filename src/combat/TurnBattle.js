// TurnBattle — pertarungan taktis: dunia ter-pause, giliran bergantian dengan
// animasi lunge, damage, hitmarker, dan boss AI sederhana.
// Trigger: sentuh musuh di dunia terbuka. Maksimum 3 musuh per pertarungan.

import * as THREE from 'three';
import { app } from '../core/App.js';
import { SKILLS, CONFIG } from '../core/Constants.js';

const T = { INTRO: 'intro', PLAYER: 'player', PLAYER_ANIM: 'anim', ENEMY_ANIM: 'enemy', END: 'end' };
const LUNGE_TIME = 0.62;
const ENEMY_TIME = 0.5;

export class TurnBattle {
  constructor(ctx) {
    this.ctx = ctx;                 // WorldScene
    this.active = false;
    this.state = null;
    this.t = 0;
    this.enemies = [];              // pulled-in enemies
    this._pending = null;           // { kind, targetIndex, targets, hits }
    this._enemyIdx = 0;
    this._enemyHitDone = false;
    this._defend = false;
    this._skillCd = [0, 0, 0, 0];   // skill cooldowns counted in PLAYER TURNS
    this._ui = null;
    this._escapeOk = false;
  }

  /* ------------------------------------------------------------------ */
  startEncounter(enemies) {
    if (this.active) return;
    const pull = enemies.filter((e) => e.alive).slice(0, 3);
    if (!pull.length) return;

    this.enemies = pull;
    this.active = true;
    this.state = T.INTRO;
    this.t = 0;
    this._defend = false;
    this._enemyIdx = 0;
    this._enemyHitDone = false;
    for (const e of this.enemies) {
      e.vel?.set?.(0, 0, 0);
      e.facing = Math.atan2(this.ctx.player.pos.x - e.pos.x, this.ctx.player.pos.z - e.pos.z);
      e.ai?.setState?.('recover');
    }
    app.audio.sfx('boss_intro');
    this._buildPanel();
    this._refreshPanel();
    this._buildPersonaLayer();
    this._showPersonaBars(true);
    this._showBanner(this.ctx.boss && pull.includes(this.ctx.boss) ? 'UYEHH!!!' : 'PERTARUNGAN!');
    app.bus.emit('battle-start', { count: pull.length });
  }

  /* ---------------- PERSONA stage ---------------- */
  _buildPersonaLayer() {
    if (this._bars?.parentElement) return;
    this._bars = document.createElement('div');
    this._bars.id = 'persona-bars';
    this._bars.innerHTML = '<div class="persona-bar top"></div><div class="persona-bar bottom"></div>';
    this._flash = document.createElement('div');
    this._flash.id = 'persona-flash';
    this._banner = document.createElement('div');
    this._banner.id = 'persona-banner';
    this._banner.className = 'persona-banner';
    const root = document.getElementById('ui-root');
    root.appendChild(this._bars);
    root.appendChild(this._flash);
    root.appendChild(this._banner);
  }

  _showPersonaBars(show) {
    this._bars?.classList.toggle('open', !!show);
  }

  _flashHit() {
    if (!this._flash) return;
    this._flash.classList.remove('hit');
    void this._flash.offsetWidth;
    this._flash.classList.add('hit');
  }

  _showBanner(text) {
    if (!this._banner) return;
    this._banner.textContent = text;
    this._banner.classList.remove('show');
    void this._banner.offsetWidth;
    this._banner.classList.add('show');
  }

  stop() {
    this.active = false;
    this.state = null;
    this._showPersonaBars(false);
    this._banner?.remove?.();
    this._bars?.remove?.();
    this._flash?.remove?.();
    this._bars = null;
    this._banner = null;
    this._flash = null;
    this._hidePanel();
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;

    // idle breathing for everyone involved
    this._idleBreathe(this.t);

    switch (this.state) {
      case T.PLAYER: {
        const input = app.input;
        if (input.pressed('Digit1')) this.playerAttack();
        else if (input.pressed('Digit2')) this.playerSkill(0);
        else if (input.pressed('Digit3')) this.playerSkill(1);
        else if (input.pressed('Digit4')) this.playerSkill(2);
        else if (input.pressed('Digit5')) this.playerSkill(3);
        else if (input.pressed('Digit6')) this.playerDefend();
        else if (input.pressed('Digit7')) this.playerFlee();
        else if (input.pressed('Digit8')) this.playerCycleWeapon();
        else if (input.pressed('Digit9')) this.playerInspire();
        break;
      }
      case T.INTRO:
        if (this.t > 0.85) this._startPlayerTurn();
        break;
      case T.PLAYER_ANIM:
        this._stepPlayerAnim(dt);
        break;
      case T.ENEMY_ANIM:
        this._stepEnemyAnim(dt);
        break;
      case T.END:
        if (this.t > 1.25) this.stop();
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /* shared helpers                                                       */
  /* ------------------------------------------------------------------ */
  _facingTarget(target) {
    const p = this.ctx.player.pos;
    return Math.atan2(target.pos.x - p.x, target.pos.z - p.z);
  }

  _lungeOffset(entity, target, k) {
    // k in [0..1]; piecewise ease (rush in, hit, return)
    const peak = 0.42;
    const in_ = Math.min(k / peak, 1);
    const out = Math.max(0, (k - peak) / (1 - peak));
    const amp = in_ < 1 ? easeOutCubic(in_) * 1.5 : (1 - easeOutCubic(out)) * 1.5;
    const dir = new THREE.Vector3(Math.sin(entity.facing ?? entity.model.rotation.y), 0, Math.cos(entity.facing ?? entity.model.rotation.y));
    return dir.multiplyScalar(amp);
  }

  _idleBreathe(t) {
    const p = this.ctx.player?.model;
    if (p) p.userData.parts.body.position.y = 0.86 + Math.sin(t * 2.1) * 0.035;
    for (const e of this.enemies) {
      if (!e.alive || !e.model) continue;
      const parts = e.parts;
      if (parts?.body) parts.body.position.y = (e.arch === 'runner' ? 0.92 : e.arch === 'brute' || e.arch === 'elite' || e.arch === 'beast' ? 0.78 : 0.7) + Math.abs(Math.sin(t * 3 + e.homePos.x)) * 0.05;
    }
  }

  /* ------------------------------------------------------------------ */
  /* player actions                                                       */
  /* ------------------------------------------------------------------ */
  playerCycleWeapon() {
    if (this.state !== T.PLAYER) return;
    const w = this.ctx.weapons;
    if (!w) return;
    w.cycle(1);
    this._refreshPanel();
  }

  playerInspire() {
    if (this.state !== T.PLAYER) return;
    if (this._inspired) {
      app.ui.toast('Semangat Kurir sudah nyala!', { icon: '🔥', title: 'SEMANGAT KURIR' });
      return;
    }
    this._inspired = true;
    app.audio.sfx('levelup');
    this.ctx.vfx.spawnBurst(this.ctx.player.pos.clone().add({ x: 0, y: 1.4, z: 0 }), {
      color: 0xff9e4a, count: 16, speed: 4, life: 0.5,
    });
    app.ui.toast('Satu serangan berikutnya +80%!', { icon: '🔥', title: 'SEMANGAT KURIR!' });
    this._refreshPanel();
  }

  playerAttack() {
    if (this.state !== T.PLAYER) return;
    const w = this.ctx.weapons?.current();
    const multBase = w?.id === 'smg' ? 0.62 : w?.id === 'samurai' ? 1.18 : w?.id === 'launcher' ? 1.5 : 0.92;
    const mult = this._inspired ? multBase * 1.8 : multBase;
    this._inspired = false;
    const aoe = w?.id === 'launcher';
    const hits = w?.id === 'smg' ? 2 : 1;
    this._beginPlayerAction({ kind: 'attack', mult, hits, aoe, weapon: w?.id });
  }

  playerSkill(index) {
    if (this.state !== T.PLAYER) return;
    const skill = SKILLS[index];
    const stats = this.ctx.player.stats;
    if (stats.level < skill.unlockLvl) {
      this.ctx.vfx && app.ui.toast(`Skill terbuka di kurir level ${skill.unlockLvl}`, { icon: '🔒', title: skill.name });
      return;
    }
    if (this._skillCd[index] > 0) {
      app.ui.toast(`Cooldown ${this._skillCd[index]} turn`, { icon: '⏳', title: skill.name });
      return;
    }
    if (stats.energy < skill.energy) {
      app.ui.toast('Energi kurir habis!', { icon: '💧', title: skill.name });
      return;
    }
    stats.energy -= skill.energy;
    this._skillCd[index] = skill.cd + 1;
    const aoe = skill.id === 'spin_blade';
    const crit = skill.id === 'shadow_dash';
    const stun = skill.id === 'courier_strike' ? 1 : 0;
    const mult = skill.id === 'courier_strike' ? 2.6
      : skill.id === 'spin_blade' ? 1.2
      : skill.id === 'shadow_dash' ? 1.35
      : 1.35;
    this._beginPlayerAction({ kind: 'skill', skill: skill.id, mult, hits: 1, aoe, crit, stun });
  }

  playerDefend() {
    if (this.state !== T.PLAYER) return;
    this._defend = true;
    app.audio.sfx('pickup');
    this.ctx.vfx.spawnRing(this.ctx.player.pos.clone(), { color: 0x5ec8ff, r1: 2.4, life: 0.4 });
    this._endPlayerTurn(false);
  }

  playerFlee() {
    if (this.state !== T.PLAYER) return;
    const alive = this.enemies.filter((e) => e.alive).length;
    const chance = Math.max(0.25, 0.8 - (alive - 1) * 0.2);
    if (Math.random() < chance) {
      this._escape();
    } else {
      app.ui.toast('Gagal kabur!', { icon: '😤', title: 'Tertangkap!' });
      this._endPlayerTurn(true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* animation orchestration                                              */
  /* ------------------------------------------------------------------ */
  _beginPlayerAction(pending) {
    const target = this._nearestAlive();
    if (!target) return this._victory();

    this._pending = pending;
    this._pendingStrikeDone = false;
    this._playerLungeTarget = target;
    this.state = T.PLAYER_ANIM;
    this.t = 0;

    // face the target
    this.ctx.player.facing = this._facingTarget(target);
    this.ctx.player.model.rotation.y = this.ctx.player.facing;

    // audio & muzzle flash-ish anticipation
    if (pending.kind === 'attack') {
      if (pending.weapon === 'launcher') { app.audio.sfx('rocket'); this._showBanner('ROKETTT!!'); }
      else if (pending.weapon === 'smg') { app.audio.sfx('smgshot'); this._showBanner('MESINNN!!'); }
      else if (pending.weapon === 'pistol') { app.audio.sfx('gunshot'); this._showBanner('PINGLI!!'); }
      else { app.audio.sfx('swing'); this._showBanner('TEBASAN!!'); }
    } else {
      this.ctx.vfx.spawnRing(this.ctx.player.pos.clone(), { color: 0xffce4b, r1: 3.2, life: 0.35 });
      app.audio.sfx('skill_spin');
      const skillName = { quick_slash: 'TEBASAN KILAT!!', spin_blade: 'BADAI!!', shadow_dash: 'BAYANGAN!!', courier_strike: 'TEBASAN KURIR!!' }[pending.skill] ?? 'JURUS!!';
      this._showBanner(skillName);
    }
    this._refreshPanel();
  }

  _stepPlayerAnim(dt) {
    const target = this._playerLungeTarget;
    if (!target || !target.alive) {
      // target died mid-anim (e.g., leftover force) — pick another
      this._playerLungeTarget = this._nearestAlive();
      if (!this._playerLungeTarget) return this._victory();
      this.t = Math.min(this.t, LUNGE_TIME * 0.4);
    }

    const k = Math.min(1, this.t / LUNGE_TIME);
    const offset = this._lungeOffset(this.ctx.player, this._playerLungeTarget ?? this.ctx.player, k);
    this.ctx.player.model.position.copy(this.ctx.player.pos).add(offset);

    if (k >= 0.38 && !this._pendingStrikeDone) {
      this._pendingStrikeDone = true;
      this._applyPlayerHit();
    }
    if (k >= 1) {
      this.ctx.player.model.position.copy(this.ctx.player.pos);
      if (!this.enemies.some((e) => e.alive)) return this._victory();
      this._startEnemyTurn();
    }
  }

  _applyPlayerHit() {
    const p = this.ctx.player;
    const pending = this._pending;
    const targets = pending.aoe
      ? this.enemies.filter((e) => e.alive)
      : [this._playerLungeTarget].filter((e) => e?.alive);

    const weaponSpread = pending.weapon === 'launcher' ? 1.35 : 1;
    for (const t of targets) {
      const hitRoll = Math.random();
      const crit = !!pending.crit || (p.weapons?.currentAmmo && hitRoll < 0.1) || hitRoll < 0.12;
      const wobble = 0.9 + Math.random() * 0.25;
      const dmg = Math.max(1, Math.round(p.stats.atk * pending.mult * (crit ? 1.6 : 1) * wobble));
      const dir = new THREE.Vector3(t.pos.x - p.pos.x, 0, t.pos.z - p.pos.z).normalize();
      p.ctx.damage.applyToEnemy(t, dmg, {
        knock: weaponSpread * 6,
        knockDir: dir.lengthSq() > 0.01 ? dir : null,
        isCrit: crit,
      });
      if (pending.stun && t.alive) {
        t.ai?.stagger?.();
        t.staggerSkip = (t.staggerSkip ?? 0) + pending.stun;
      }
      if (pending.skill === 'spin_blade') {
        p.ctx.vfx.spawnRing(p.pos.clone(), { color: 0x9fd0ff, r1: 3.4, life: 0.4 });
      }
      // boss phases (real triggers in the turn-based world)
      if (t.isBoss) this._checkBossPhase(t);
    }
    p.ctx.vfx.spawnBurst(p.pos.clone().add(new THREE.Vector3(Math.sin(p.facing) * 1.4, 1.1, Math.cos(p.facing) * 1.4)), {
      color: pending.weapon === 'launcher' ? 0xff9e4a : 0xffd34d,
      count: pending.kind === 'skill' ? 12 : 8,
      speed: 5,
      life: 0.4,
    });
    p.ctx.camera?.shake(0.35);
    if (pending.weapon === 'launcher' || pending.skill === 'courier_strike' || pending.crit) this._flashHit();
    app.audio.sfx('hit_hard');
    // decrement skill cooldowns each player action? only skill actions consume turns fully after anim
  }

  _endPlayerTurn(failedFlee = false) {
    for (let i = 0; i < 4; i++) {
      if (this._skillCd[i] > 0) this._skillCd[i] -= 1;
    }
    this._startEnemyTurn();
  }

  /* ------------------------------------------------------------------ */
  /* enemy turn                                                          */
  /* ------------------------------------------------------------------ */
  _startEnemyTurn() {
    this.state = T.ENEMY_ANIM;
    this.t = 0;
    this._enemyIdx = 0;
    this._enemyHitDone = false;
    // skip dead enemies right away
    this._advanceEnemy();
  }

  _advanceEnemy() {
    // find next attacker
    while (this._enemyIdx < this.enemies.length) {
      const e = this.enemies[this._enemyIdx];
      if (e?.alive) {
        // stagger skip (stunned)?
        if (e.staggerSkip > 0) {
          e.staggerSkip -= 1;
          this._enemyIdx += 1;
          app.ui.toast(`${e.name ?? 'Musuh'} terpana!`, { icon: '💫', title: 'STUN' });
          continue;
        }
        // face player
        e.facing = Math.atan2(this.ctx.player.pos.x - e.pos.x, this.ctx.player.pos.z - e.pos.z);
        e.model.rotation.y = e.facing;
        this.t = 0;
        this._enemyHitDone = false;
        return;
      }
      this._enemyIdx += 1;
    }
    this._startPlayerTurn();
  }

  _stepEnemyAnim(dt) {
    const e = this.enemies[this._enemyIdx];
    if (!e) return this._startPlayerTurn();
    const k = Math.min(1, this.t / ENEMY_TIME);

    // lunge toward player
    const offset = this._lungeOffset(e, this.ctx.player, k);
    e.model.position.copy(e.pos).add(offset);

    if (k >= 0.45 && !this._enemyHitDone) {
      this._enemyHitDone = true;
      // boss cycles into a vicious "gelisahkan!" every 3rd turn
      if (e.isBoss) {
        e._bossMoveCounter = (e._bossMoveCounter ?? 0) + 1;
        e._bossBigHit = e._bossMoveCounter % 3 === 0;
      }
      const mult = e._bossBigHit ? 1.65 : 1;
      const dmg = Math.max(1, Math.round(e.atk * (this._defend ? 0.45 : 1) * mult));
      const fromPos = e.pos.clone();
      if (e._bossBigHit) app.ui.toast('«UYEEHHH!! 💢»', { icon: '🫧', title: 'UYEHH BERANG!' });
      this.ctx.damage.applyToPlayer(dmg, { fromPos });
      app.audio.sfx('swing');
    }

    if (k >= 1) {
      e.model.position.copy(e.pos);
      this._enemyIdx += 1;
      this._advanceEnemy();
    }
  }

  _startPlayerTurn() {
    this.state = T.PLAYER;
    this.t = 0;
    this._defend = false;
    this._refreshPanel();
  }

  /* ------------------------------------------------------------------ */
  /* outcomes                                                            */
  /* ------------------------------------------------------------------ */
  _victory() {
    // orbs & rewards are dropped by DamageSystem already; grant bonus coins
    const coins = this.enemies.reduce((n, e) => n + (e.coins ?? 4), 0);
    this.ctx.player.stats.addCoins(coins);
    app.bus.emit('battle-victory', { coins, count: this.enemies.length });
    app.ui.toast(`+${coins} koin bonus`, { icon: '🪙', title: 'MENANG!' });
    app.audio.sfx('levelup');
    this.state = T.END;
    this.t = 0;
    this._hidePanel();
  }

  _escape() {
    const p = this.ctx.player.pos;
    const away = new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(7);
    p.x += away.x;
    p.z += away.z;
    if (p.lengthSq() === 0) {
      p.x = 0; p.z = 10;
    }
    this.ctx.player.model.position.copy(p);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.ai?.setState?.('patrol');
      e.vel?.set?.(0, 0, 0);
    }
    app.ui.toast('Kabur dengan gaya!', { icon: '💨', title: 'BERHASIL KABUR' });
    this.state = T.END;
    this.t = 0;
    this._hidePanel();
  }

  _checkBossPhase(boss) {
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    for (const th of [0.66, 0.33]) {
      const key = `_bossSplit_${th}`;
      if (!this[key] && ratio <= th) {
        this[key] = true;
        const spot = boss.pos.clone();
        for (const [dx, dz] of [[-2.2, 1.2], [2.2, 1.2], [0, -2.4]]) {
          const m = this.ctx.enemyManager?.spawn?.('runner', { x: spot.x + dx, z: spot.z + dz });
          if (m) this.enemies.push(m);
        }
        this._refreshPanel();
        app.ui.toast('UYEHH membelah diri!', { icon: '🫧', title: 'PHASE SHIFT' });
        this.ctx.vfx.spawnBurst(spot.clone().add(new THREE.Vector3(0, 1, 0)), { color: 0x59d0c8, count: 20, speed: 6, life: 0.6 });
        app.audio.sfx('slime_bounce', { up: 40 });
      }
    }
    if (ratio <= 0.3 && !this._bossEnraged) {
      this._bossEnraged = true;
      boss.atk = Math.round(boss.atk * 1.25);
      app.ui.toast('«UYEEEHH!!»', { icon: '💢', title: 'UYEHH BERANG!' });
      this.ctx.vfx.spawnBurst(boss.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), { color: 0xff5d73, count: 26, speed: 6, life: 0.6 });
    }
  }

  _nearestAlive() {
    const p = this.ctx.player.pos;
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = e.pos.distanceToSquared(p);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* UI panel                                                            */
  /* ------------------------------------------------------------------ */
  _buildPanel() {
    if (this._ui?.parentElement) return;
    const el = document.createElement('div');
    el.id = 'battle-panel';
    el.innerHTML = `
      <div class="bp-head">
        <span class="bp-badge">⚔ TACTICAL CLASH</span>
        <span class="bp-turn">GILIRAN KAMU</span>
        <span class="bp-x">| tombol 1–9 atau klik aksi</span>
      </div>
      <div class="bp-enemies"></div>
      <div class="bp-actions">
        <button class="bp-btn bp-attack" data-act="attack">
          <span class="bp-key">1</span>
          <b>Serang</b>
          <small>Senjata yang dipakai</small>
        </button>
        <button class="bp-btn" data-act="skill0"><span class="bp-key">2</span><b>Tebasan Kilat</b><small>Cepat · 135% tunggal</small></button>
        <button class="bp-btn" data-act="skill1"><span class="bp-key">3</span><b>Putaran Pedang</b><small>360° · semua musuh</small></button>
        <button class="bp-btn" data-act="skill2"><span class="bp-key">4</span><b>Tebasan Bayangan</b><small>Kritis 135% tunggal</small></button>
        <button class="bp-btn" data-act="skill3"><span class="bp-key">5</span><b>Tebasan Kurir</b><small>260% + stun 1 giliran</small></button>
        <button class="bp-btn" data-act="weapon"><span class="bp-key">8</span><b>Ganti Senjata</b><small>Pistol · SMG · Samurai · Roket</small></button>
        <button class="bp-btn bp-inspire" data-act="inspire"><span class="bp-key">9</span><b>Semangat Kurir</b><small>Serangan berikutnya +80%</small></button>
        <button class="bp-btn" data-act="defend"><span class="bp-key">6</span><b>Bertahan</b><small>Damage diterima −55%</small></button>
        <button class="bp-btn bp-flee" data-act="flee"><span class="bp-key">7</span><b>Kabur</b><small>Peluang kabur 80%</small></button>
      </div>
    `;
    document.getElementById('ui-root').appendChild(el);
    this._ui = el;
    el.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        app.audio.sfx('ui_click');
        const act = b.dataset.act;
        if (act === 'attack') this.playerAttack();
        else if (act === 'defend') this.playerDefend();
        else if (act === 'flee') this.playerFlee();
        else if (act === 'weapon') this.playerCycleWeapon();
        else if (act === 'inspire') this.playerInspire();
        else if (act.startsWith('skill')) this.playerSkill(Number(act.slice(5)));
      });
    });
  }

  _refreshPanel() {
    if (!this._ui) return;
    const enemies = this._ui.querySelector('.bp-enemies');
    enemies.innerHTML = this.enemies.map((e, i) => {
      const hpFrac = Math.max(0, e.hp / e.maxHp);
      const color = e.arch === 'elite' ? '#ff8a6e' : e.arch === 'brute' ? '#7be3a7' : '#ff6a5e';
      return `
        <div class="bp-enemy ${e.alive ? '' : 'dead'}">
          <div class="bp-enemy-head">
            <span class="bp-enemy-icon">${e.isBoss ? '🫧' : e.arch === 'brute' ? '🗿' : e.arch === 'runner' ? '🏃' : '🤖'}</span>
            <span class="bp-enemy-name">${e.isBoss ? 'UYEHH THE JELLY' : e.arch.toUpperCase()}</span>
            <span class="bp-enemy-hpnum">${Math.max(0, Math.round(e.hp))}</span>
          </div>
          <div class="bp-enemy-bar"><div class="bp-enemy-fill" style="width:${hpFrac * 100}%;background:${color}"></div></div>
        </div>`;
    }).join('');
    const turnTag = this._ui.querySelector('.bp-turn');
    const skillBtns = this._ui.querySelectorAll('[data-act^="skill"]');
    const defBtns = this._ui.querySelectorAll('[data-act]');
    skillBtns.forEach((b, i) => {
      const cd = this._skillCd[i] ?? 0;
      b.classList.toggle('on-cd', cd > 0);
      b.querySelector('small').textContent = cd > 0 ? `CD ${cd} turn(s)` : ['Cepat · 135% single', '360° · semua musuh', 'Crit 135% tunggal', '260% + stun 1 turn'][i];
    });
    const canAct = this.state === T.PLAYER;
    defBtns.forEach((b) => b.classList.toggle('disabled', !canAct));
    turnTag.textContent = this.state === T.PLAYER ? '⚡ GILIRAN KAMU' : this.state === T.ENEMY_ANIM ? '👾 GILIRAN MUSUF' : '⚔';
    turnTag.classList.toggle('enemy', this.state === T.ENEMY_ANIM);
    // inspire buff indicator
    const inspireBtn = this._ui.querySelector('[data-act="inspire"]');
    if (inspireBtn) {
      inspireBtn.classList.toggle('inspired', !!this._inspired);
      const small = inspireBtn.querySelector('small');
      if (small) small.textContent = this._inspired ? '🔥 SIAP — +80%!' : 'Serangan berikutnya +80%';
    }
    this._ui.classList.add('open');
  }

  _hidePanel() {
    if (!this._ui) return;
    this._ui.classList.remove('open');
    setTimeout(() => {
      this._ui?.remove?.();
      this._ui = null;
    }, 260);
  }
}

/* util */
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}
