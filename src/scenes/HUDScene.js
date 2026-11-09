// HUDScene: Phaser-canvas head-up display (health/stamina/XP bars, skills with
// cooldown sweep, minimap, mission tracker, boss bar, interaction prompt).

import Phaser from 'phaser';
import { app } from '../core/App.js';
import { WORLD_META, CONFIG } from '../core/Constants.js';
import { SKILLS } from '../core/Constants.js';
import { HUD_COLORS } from '../core/Constants.js';

const TXT = { fontFamily: "'Outfit', system-ui, sans-serif", fontSize: '15px', color: '#ffffff' };
const TXT_SMALL = { ...TXT, fontSize: '12px', color: '#cfd6ff' };
const TXT_BOLD = { ...TXT, fontStyle: '700', fontSize: '15px' };

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
    this._bossHp = 0;
    this._bossMax = 1;
    this._bossVisible = false;
    this._bossHideAt = 0;
    this._castFlash = new Array(4).fill(0);
  }

  create() {
    this.gfx = this.add.graphics();

    this.barsTitle = this.add.text(16, 0, '', TXT_BOLD).setOrigin(0, 1);
    this.missionTitle = this.add.text(16, 18, '', TXT_BOLD);
    this.missionSub = this.add.text(16, 40, '', TXT_SMALL);
    this.missionTimer = this.add.text(16, 62, '', { ...TXT_BOLD, fontSize: '14px', color: '#ffd34d' });
    this.missionFragile = this.add.text(16, 62, '', { ...TXT_BOLD, fontSize: '13px', color: '#d6a5ff' });

    this.worldName = this.add.text(16, 112, '', { ...TXT_BOLD, fontSize: '13px', color: '#ffffff' }).setAlpha(0.9);
    this.distText = this.add.text(0, 0, '', { ...TXT_BOLD, fontSize: '12px', color: '#ffd34d' });

    this.prompt = this.add.text(0, 0, '', {
      ...TXT_BOLD,
      backgroundColor: 'rgba(10,12,32,0.78)',
      padding: { x: 16, y: 10 },
      fontSize: '15px',
    }).setOrigin(0.5, 1).setVisible(false);

    this.toast = this.add.text(0, 0, '', TXT_SMALL).setVisible(false);

    this.pauseHint = this.add.text(0, 0, '', TXT_SMALL).setVisible(false);
    this.weaponText = this.add.text(0, 0, '', { ...TXT_BOLD, fontSize: '12px', color: '#ffd34d' }).setOrigin(0.5, 1);
    this.distTextCenter = this.add.text(0, 0, '', { ...TXT_BOLD, fontSize: '12px', color: '#ffe9a6' }).setOrigin(0.5, 0);

    this.bossName = this.add.text(0, 0, '🫧 UYEHH — THE JELLY OVERLORD', {
      ...TXT_BOLD, fontSize: '15px', color: '#ffa6a6',
    }).setOrigin(0.5, 0.5).setVisible(false);

    this.skillCast = [0, 0, 0, 0];

    this.events.once('shutdown', () => {
      this._bossVisible = false;
    });

    this._offs = [
      app.bus.on('skill-cast', ({ index }) => { this.skillCast[index] = 0.6; }),
      app.bus.on('boss-start', () => { this._bossVisible = true; }),
      app.bus.on('boss-hp', ({ hp, max }) => { this._bossHp = hp; this._bossMax = max; this._bossVisible = true; this._bossHideAt = 0; }),
      app.bus.on('boss-end', () => { this._bossVisible = false; }),
    ];
  }

  shutdown() {
    for (const off of this._offs ?? []) off?.();
  }

  update(time, delta) {
    const dt = (delta ?? 16) / 1000;
    const scene = app.worldScene;
    const w = this.scale.width;
    const h = this.scale.height;
    const g = this.gfx;
    g.clear();

    if (this.pauseHint) this.pauseHint.setVisible(false);
    if (!scene || !scene.player) {
      if (this.prompt) this.prompt.setVisible(false);
      return;
    }

    const p = scene.player;
    const stats = p.stats;

    // ================= bottom-left: vitals =================
    const HP_W = Math.min(300, w * 0.3);
    const HP_H = 14;
    const HP_X = 16;
    const HP_Y = h - 96;

    drawBar(g, HP_X, HP_Y, HP_W, HP_H, stats.hp / stats.maxHp, 0xff5d73, 0x42171f);
    const ST_Y = HP_Y + HP_H + 5;
    drawBar(g, HP_X, ST_Y, HP_W, 10, stats.stamina / CONFIG.staminaMax, 0x7dd45f, 0x1b3514);
    const EN_Y = ST_Y + 15;
    drawBar(g, HP_X, EN_Y, HP_W, 7, stats.energy / CONFIG.energyMax, 0x5ec8ff, 0x0f2a3e);
    const XP_W = Math.min(180, HP_W * 0.62);
    const xpFrac = stats.xpFraction ?? (stats.xpToNext ? stats.xp / stats.xpToNext() : 0);
    drawBar(g, HP_X, EN_Y + 10, XP_W, 4, xpFrac, 0xffc24b, 0x3a2c0c);

    this.barsTitle.setText(`${'LV ' + stats.level}  ·  🪙 ${stats.coins}`).setPosition(16, HP_Y - 4).setVisible(true);

    // ================= bottom-center: skills =================
    const skills = SKILLS;
    const slot = 58;
    const gap = 12;
    const totalW = skills.length * slot + (skills.length - 1) * gap;
    let sx = (w - totalW) / 2;
    const sy = h - slot - 18;
    for (let i = 0; i < skills.length; i += 1) {
      this._drawSkill(g, sx, sy, slot, i, skills[i]);
      sx += slot + gap;
    }

    // ================= top-right: minimap =================
    const MM_R = 84;
    const mmX = w - MM_R - 14;
    const mmY = MM_R + 14;
    this._drawMinimap(g, scene, mmX, mmY, MM_R);

    // ================= top-left: world + mission =================
    const worldNameText = WORLD_META[scene.worldId]?.name ?? scene.worldId;
    this.worldName.setText(`📍 ${worldNameText}`).setPosition(16, 112).setVisible(true);

    const active = scene.delivery?.active;
    if (active) {
      this.missionTitle.setText(`📨 ${active.def.title}`).setVisible(true);
      const stepsLeft = active.steps.length - active.index;
      this.missionSub.setText(`${active.def.type === 'fragile' ? '🫧 fragile  ·  ' : ''}${stepsLeft} pemberhentian tersisa`).setVisible(true);

      if (active.timeLeft != null) {
        const tl = Math.max(0, active.timeLeft);
        const mm = Math.floor(tl / 60);
        const ss = Math.floor(tl % 60);
        this.missionTimer.setText(`⏱ ${mm}:${String(ss).padStart(2, '0')}`).setPosition(16, 62).setVisible(true);
        this.missionFragile.setVisible(false);
      } else if (active.integrity != null) {
        this.missionFragile.setText(`🫧 Integritas: ${Math.round(active.integrity)}%`).setPosition(16, 62).setVisible(true);
        this.missionTimer.setVisible(false);
      } else {
        this.missionTimer.setVisible(false);
        this.missionFragile.setVisible(false);
      }
    } else {
      this.missionTitle.setText('📨 Tidak ada misi aktif').setVisible(true);
      this.missionSub.setText('Temui kurir stasiun setempat (E)').setVisible(true);
      this.missionTimer.setVisible(false);
      this.missionFragile.setVisible(false);
    }

    // distance chip under minimap
    const d = scene.delivery?.distanceToTarget?.();
    if (d != null) {
      this.distText.setText(`→ ${Math.round(d)} m`).setPosition(mmX - 4, mmY + MM_R + 4).setVisible(true);
    } else {
      this.distText.setVisible(false);
    }

    // ================= boss bar =================
    if (this._bossVisible && this._bossMax > 0) {
      const bw = Math.min(560, w * 0.55);
      const bx = (w - bw) / 2;
      const by = 16;
      drawBar(g, bx, by + 18, bw, 15, Math.max(0, this._bossHp) / this._bossMax, 0xff8a8a, 0x2c1014);
      g.lineStyle(2, 0xffce4b, 1);
      g.strokeRoundedRect(bx - 2, by + 16, bw + 4, 19, 6);
      this.bossName.setPosition(w / 2, by + 6).setVisible(true);
    } else {
      this.bossName.setVisible(false);
    }

    // ================= crosshair, meter marks, weapon HUD =================
    const weps = scene.player.weapons;
    if (weps) {
      const cx = w / 2;
      const cy = h / 2;
      const aim = weps.aimT ?? 0;
      const recoil = weps.getRecoil?.() ?? 0;
      const spreadCfg = weps.current?.()?.spread ?? 0.01;
      const gap = 9 + (spreadCfg / 0.01) * 6 * (1 - aim * 0.85) + recoil * 8;
      const tick = 9;

      g.lineStyle(3.4, 0x141628, 0.85);
      g.lineBetween(cx - gap - tick, cy, cx - gap, cy);
      g.lineBetween(cx + gap, cy, cx + gap + tick, cy);
      g.lineBetween(cx, cy - gap - tick, cx, cy - gap);
      g.lineBetween(cx, cy + gap, cx, cy + gap + tick);
      g.lineStyle(1.8, 0xffffff, 0.95);
      g.lineBetween(cx - gap - tick, cy, cx - gap, cy);
      g.lineBetween(cx + gap, cy, cx + gap + tick, cy);
      g.lineBetween(cx, cy - gap - tick, cx, cy - gap);
      g.lineBetween(cx, cy + gap, cx, cy + gap + tick);
      g.fillStyle(0xff5d73, 1);
      g.fillCircle(cx, cy, aim > 0.5 ? 2.3 : 3.4);
      g.lineStyle(1.4, 0x141628, 0.9);
      g.strokeCircle(cx, cy, aim > 0.5 ? 2.3 : 3.4);

      // hitmarker
      const hm = weps.getHitmarker?.() ?? 0;
      if (hm > 0) {
        const a = Math.min(1, hm / 0.32);
        g.lineStyle(3, 0xffe066, a);
        const o = 6, l = 7;
        g.lineBetween(cx - o - l, cy - o - l, cx - o + 1, cy - o + 1);
        g.lineBetween(cx + o - 1, cy - o - l, cx + o + l, cy - o + 1);
        g.lineBetween(cx - o - l, cy + o + l, cx - o + 1, cy + o - 1);
        g.lineBetween(cx + o - 1, cy + o + l, cx + o + l, cy + o - 1);
      }

      // reload progress bar
      if (weps.reloadT > 0) {
        const pw = 110;
        const p = weps.reloadProgress ?? 0;
        g.fillStyle(0x0a0b1e, 0.65);
        g.fillRoundedRect(cx - pw / 2, cy + 16, pw, 7, 4);
        g.fillStyle(0x5ec8ff, 0.95);
        g.fillRoundedRect(cx - pw / 2, cy + 16, Math.max(7, pw * p), 7, 4);
      }

      // weapon name + ammo above the crosshair
      const wdef = weps.current?.();
      const ammo = weps.currentAmmo?.() ?? { clip: Infinity, reserve: Infinity };
      const melee = !!wdef?.melee;
      this.weaponText
        .setText(`${wdef?.icon ?? ''}  ${wdef?.name ?? ''}`)
        .setPosition(cx, cy - 26)
        .setVisible(true);
      this.distTextCenter
        .setText(melee ? 'Jarak dekat (katana)' : `${ammo.clip} / ${ammo.reserve}`)
        .setPosition(cx, cy + 26)
        .setVisible(true);
      // hotbar above the skills
      const info = weps.hotbarInfo?.() ?? [];
      const hs = 34;
      const hgap = 8;
      const total = info.length * hs + (info.length - 1) * hgap;
      const hy = h - 118 - 46;
      let hx = (w - total) / 2;
      for (const slot of info) {
        g.fillStyle(slot.active ? 0x1565df : 0x101230, 0.85);
        g.fillRoundedRect(hx, hy, hs, hs, 9);
        g.lineStyle(2, slot.active ? 0xffd34d : 0xffffff, slot.active ? 0.95 : 0.2);
        g.strokeRoundedRect(hx, hy, hs, hs, 9);
        this._drawWeaponGlyph(g, hx + hs / 2, hy + hs / 2, slot.id);
        hx += hs + hgap;
      }
    } else {
      this.weaponText.setVisible(false);
      this.distTextCenter.setVisible(false);
    }

    // meter marks: huge target arrow around the crosshair
    const target2 = scene.delivery?.currentTarget?.();
    if (target2?.pos) {
      const p = scene.player.pos;
      const dx = target2.pos.x - p.x;
      const dz = target2.pos.z - p.z;
      const dist = Math.hypot(dx, dz);
      const fwdComp = Math.sin(scene.camera.yaw) * dx + Math.cos(scene.camera.yaw) * dz;
      const rgtComp = -Math.cos(scene.camera.yaw) * dx + Math.sin(scene.camera.yaw) * dz;
      const phi = Math.atan2(rgtComp, fwdComp);
      // unit axis directions
      const Tx = Math.sin(phi), Ty = -Math.cos(phi);
      const Px = Math.cos(phi), Py = Math.sin(phi);
      const bx = w / 2 + Tx * 82;
      const by = h / 2 + Ty * 82;
      const pulse = 1 + Math.sin(scene.t * 6) * 0.14;
      const len = 18 * pulse, hw = 10;
      g.fillStyle(0xffd34d, 0.96);
      g.beginPath();
      g.moveTo(bx + Tx * len, by + Ty * len);
      g.lineTo(bx + Px * hw, by + Py * hw);
      g.lineTo(bx - Px * hw, by - Py * hw);
      g.closePath();
      g.fillPath();
      g.lineStyle(2.2, 0x141628, 0.9);
      g.strokePath();
    }

    // ================= prompt =================
    const prompt = scene.prompt;
    if (prompt) {
      this.prompt.setText(`[${prompt.key}]  ${prompt.text}`)
        .setPosition(w / 2, h - 150)
        .setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }
  }

  _drawSkill(g, x, y, slot, i, skill) {
    const level = app.save.state.player.level;
    const locked = level < skill.unlockLvl;
    this.skillCast[i] = Math.max(0, this.skillCast[i] - 0.02);

    g.fillStyle(0x101230, 0.78);
    g.fillRoundedRect(x, y, slot, slot, 14);
    g.lineStyle(3, 0xffffff, 0.16);
    g.strokeRoundedRect(x + 1.5, y + 1.5, slot - 3, slot - 3, 12);

    if (locked) {
      g.fillStyle(0x0a0b1e, 0.5);
      g.fillRoundedRect(x, y, slot, slot, 14);
      return;
    }

    const scene = app.worldScene;
    const cd = scene.player.skills.getCooldown(i);
    const maxCd = skill.cd ?? 8;
    const swap = scene.player.skills.castFlash?.[i] ?? 0;
    void swap;

    if (this.skillCast[i] > 0) {
      g.lineStyle(4, 0xffce4b, 1);
      g.strokeRoundedRect(x + 2, y + 2, slot - 4, slot - 4, 12);
    }

    // glyph
    g.fillStyle(0xffffff, 1);
    // centered key label drawn via graphics for perf of glyph letters
    // (use simple drawn letterform paths)
    drawGlyph(g, x + slot / 2, y + slot / 2, skill.key, 26, this.skillCast[i] > 0 ? '#ffe9a6' : '#ffffff');

    // cooldown overlay sweep
    if (cd > 0) {
      const frac = cd / maxCd;
      g.fillStyle(0x0a0b1e, 0.55);
      g.beginPath();
      g.moveTo(x + slot / 2, y + slot / 2);
      g.arc(x + slot / 2, y + slot / 2, slot * 0.62, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false);
      g.closePath();
      g.fillPath();
    }
  }

  _drawWeaponGlyph(g, cx, cy, id) {
    g.lineStyle(2.4, 0xffffff, 0.96);
    g.fillStyle(0xffffff, 1);
    const L = 8;
    if (id === 'pistol') {
      g.lineBetween(cx - L, cy + 1, cx + L, cy - 3);
      g.lineBetween(cx + L, cy - 3, cx + L + 2, cy - 4);
      g.lineBetween(cx - L - 2, cy + 2, cx - L - 4, cy + 6);
      g.lineBetween(cx - L, cy + 1, cx - L - 4, cy + 6);
      g.lineBetween(cx - 3, cy, cx - 4, cy + 6);
    } else if (id === 'smg') {
      g.lineBetween(cx - L - 2, cy, cx + L, cy);
      g.lineBetween(cx + L, cy, cx + L + 4, cy);
      g.strokeCircle(cx - 2, cy + 5, 3.4);
      g.lineBetween(cx - L - 2, cy, cx - L - 6, cy + 5);
    } else if (id === 'katana') {
      g.lineBetween(cx - L, cy + L, cx + L, cy - L);
      g.lineBetween(cx - L, cy + L, cx - L - 3, cy + L + 3);
      g.lineBetween(cx - L + 3, cy + L + 1, cx - L - 1, cy + L - 1);
      g.lineBetween(cx + L, cy - L, cx + L + 2, cy - L - 2);
    } else { // launcher
      g.lineBetween(cx - L - 2, cy, cx + L + 2, cy);
      g.strokeCircle(cx + L + 2, cy, 4);
      g.lineBetween(cx - L - 2, cy, cx - L - 5, cy + 5);
    }
  }

  _drawMinimap(g, scene, cx, cy, r) {
    // backdrop disc + rings
    g.fillStyle(0x0a0b1e, 0.62);
    g.fillCircle(cx, cy, r);
    g.lineStyle(3, 0xffffff, 0.28);
    g.strokeCircle(cx, cy, r);
    g.lineStyle(1.5, 0xffffff, 0.12);
    g.strokeCircle(cx, cy, r * 0.66);
    g.strokeCircle(cx, cy, r * 0.33);

    const range = CONFIG.minimapRange;
    const k = r / range;
    const px = scene.player.pos.x;
    const pz = scene.player.pos.z;

    // clip helper
    const clip = (x, y) => {
      const dx = x - px;
      const dz = y - pz;
      const d = Math.hypot(dx, dz);
      if (d < range) return [cx + dx * k, cy + dz * k];
      const s = range / d;
      return [cx + dx * s * k, cy + dz * s * k];
    };

    // destination
    const target = scene.delivery?.currentTarget?.();
    if (target?.pos) {
      const [tx, ty] = clip(target.pos.x, target.pos.z);
      g.fillStyle(0xffd34d, 1);
      g.fillCircle(tx, ty, 6 + Math.sin(scene.t * 6) * 1.4);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeCircle(tx, ty, 6 + Math.sin(scene.t * 6) * 1.4);
    }

    // NPCs
    for (const n of scene.npcManager?.all() ?? []) {
      const [nx, ny] = clip(n.pos.x, n.pos.z);
      g.fillStyle(0x6ee7a0, 0.95);
      g.fillCircle(nx, ny, 3);
    }

    // enemies
    for (const e of scene.enemies?.getTargets() ?? []) {
      const d = Math.hypot(e.pos.x - px, e.pos.z - pz);
      if (d > range) continue;
      const [ex, ey] = clip(e.pos.x, e.pos.z);
      g.fillStyle(0xff6a5e, 0.95);
      g.fillCircle(ex, ey, 3);
    }

    // jet on ground
    if (scene.jet?.state === 'parked') {
      const pad = scene.worldDef.jetPad ?? [0, -48];
      const [jx, jy] = clip(pad[0], pad[1]);
      g.fillStyle(0xffce4b, 1);
      drawPlane(g, jx, jy, scene.t);
    }

    // facing triangle
    const yaw = scene.player.facing;
    const tipx = Math.sin(yaw) * 8;
    const tipz = Math.cos(yaw) * 8;
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(cx + tipx, cy + tipz);
    g.lineTo(cx - Math.cos(yaw) * 4.5 - Math.sin(yaw) * 2.6, cy + Math.sin(yaw) * 4.5 - Math.cos(yaw) * 2.6);
    g.lineTo(cx - Math.cos(yaw) * 4.5 + Math.sin(yaw) * 2.6, cy + Math.sin(yaw) * 4.5 + Math.cos(yaw) * 2.6);
    g.closePath();
    g.fillPath();
  }
}

/* ------------------------------------------------------------------ */
function drawBar(g, x, y, w, h, frac, color, back) {
  frac = Math.max(0, Math.min(1, frac || 0));
  g.fillStyle(hexToInt(back), 1);
  g.fillRoundedRect(x, y, w, h, h / 2);
  if (frac > 0.01) {
    g.fillStyle(hexToInt(color), 1);
    g.fillRoundedRect(x, y, Math.max(h, w * frac), h, h / 2);
  }
}

function hexToInt(hex) {
  if (typeof hex === 'number') return hex;
  const h = String(hex).replace('#', '');
  return parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16) >>> 0;
}

// minimalistic inline glyph strokes for skill keys (1..4)
function drawGlyph(g, cx, cy, key, size, colorHex) {
  g.fillStyle(hexToInt(colorHex), 1);
  const s = size / 2;
  const map = {
    '1': [[-0.28, s], [-0.28, -s], [0.16, -s], [0.16, -s * 0.55], [-0.28, -s * 0.25], [-0.28, s]],
    '2': [[-s * 0.5, -s * 0.5], [s * 0.5, -s * 0.5], [-s * 0.5, s * 0.5], [s * 0.5, s * 0.5]],
    '3': [[-s * 0.5, -s * 0.55], [s * 0.5, -s * 0.55], [-s * 0.3, 0], [s * 0.5, 0], [-s * 0.5, s * 0.55], [s * 0.1, s * 0.85], [s * 0.5, s * 0.55]],
    '4': [[-s * 0.5, -s * 0.6], [-s * 0.5, s * 0.1], [s * 0.5, s * 0.1], [s * 0.5, -s * 0.6], [-s * 0.5, -s * 0.6], [0, s * 0.85]],
  };
  // fallback: big outlined rectangle with centered key text is tricky; draw simple digit via text-like primitives
  const pts = map[key];
  if (pts) {
    g.lineStyle(3.2, hexToInt(colorHex), 1);
    g.beginPath();
    g.moveTo(cx + pts[0][0], cy + pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(cx + pts[i][0], cy + pts[i][1]);
    g.strokePath();
  }
}

function drawPlane(g, x, y, t) {
  const bob = Math.sin(t * 2.2) * 1.6;
  g.fillTriangle(x, y + bob - 9, x - 7, y + bob + 6, x + 7, y + bob + 6);
  g.fillTriangle(x - 7, y + bob + 2, x - 10, y + bob + 7, x - 3, y + bob + 6);
  g.fillTriangle(x + 7, y + bob + 2, x + 10, y + bob + 7, x + 3, y + bob + 6);
}
