// AudioManager: Web Audio synthesis for all SFX, ambience and the procedural
// OST (MusicEngine). The AudioContext is created lazily on first user gesture.

import { MusicEngine } from './MusicEngine.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.music = null;        // MusicEngine
    this._ambient = null;     // { src, gains }
    this._jet = null;         // looping engine nodes
    this.volumes = { master: 0.8, music: 0.6, sfx: 0.85 };
  }

  buildBuses() {
    // settings may already exist (SaveManager built before audio)
    try {
      const s = JSON.parse(localStorage.getItem('mailbound-settings-v1') || 'null');
      if (s?.volumes) this.volumes = { ...this.volumes, ...s.volumes };
    } catch { /* defaults */ }
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume?.();
      return;
    }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volumes.master;
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.volumes.music;
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.volumes.sfx;
    this.sfxBus.connect(this.master);
    this.music = new MusicEngine(this.ctx, this.musicBus);
  }

  setVolumes(v) {
    this.volumes = { ...this.volumes, ...v };
    if (this.master) this.master.gain.value = this.volumes.master;
    if (this.musicBus) this.musicBus.gain.value = this.volumes.music;
    if (this.sfxBus) this.sfxBus.gain.value = this.volumes.sfx;
  }

  /* ---------------- OST ---------------- */
  playMusic(trackId) {
    this.unlock();
    this.music?.play(trackId);
  }

  stopMusic() {
    this.music?.stop();
  }

  /* ---------------- ambience ---------------- */
  playAmbient(worldId) {
    this.unlock();
    this.stopAmbient();
    if (!this.ctx) return;
    const cfg = {
      w1: { type: 'birds', freq: 2400, lfo: 0.3 },
      w2: { type: 'hum', freq: 160, lfo: 0.9 },
      w3: { type: 'fair', freq: 420, lfo: 0.6 },
      w4: { type: 'birds', freq: 1800, lfo: 0.25 },
      w5: { type: 'waves', freq: 500, lfo: 0.14 },
    }[worldId];
    if (!cfg) return;

    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = cfg.lfo * 0.5;
    g.connect(this.sfxBus);

    const src = ctx.createBufferSource();
    const len = ctx.sampleRate * 2.4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    src.buffer = buf;
    src.loop = true;

    const f = ctx.createBiquadFilter();
    f.type = cfg.type === 'waves' ? 'lowpass' : 'bandpass';
    f.frequency.value = cfg.freq;
    f.Q.value = cfg.type === 'waves' ? 0.4 : 12;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = cfg.type === 'waves' ? 0.16 : 0.6;
    const lfoG = ctx.createGain();
    lfoG.gain.value = cfg.freq * 0.3;
    lfo.connect(lfoG);
    lfoG.connect(f.frequency);
    lfo.start();

    src.connect(f).connect(g);
    src.start();
    this._ambient = { src, g, lfo };
    // periodic bird chirps in green worlds
    if (cfg.type === 'birds') {
      this._birdTimer = setInterval(() => this.chirp(), 2600 + Math.random() * 4000);
    }
  }

  stopAmbient() {
    if (this._birdTimer) { clearInterval(this._birdTimer); this._birdTimer = null; }
    if (this._ambient) {
      try { this._ambient.src.stop(); this._ambient.lfo.stop(); } catch { /* gone */ }
      this._ambient = null;
    }
  }

  /* ---------------- jet engine loop ---------------- */
  jetLoop(on) {
    this.unlock();
    if (!this.ctx) return;
    if (on && !this._jet) {
      const ctx = this.ctx;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.7);
      g.connect(this.sfxBus);
      const src = ctx.createBufferSource();
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      src.buffer = buf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(220, ctx.currentTime);
      f.frequency.linearRampToValueAtTime(360, ctx.currentTime + 4);
      f.Q.value = 2.2;
      const rumble = ctx.createOscillator();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(70, ctx.currentTime);
      rumble.frequency.linearRampToValueAtTime(105, ctx.currentTime + 4);
      const rg = ctx.createGain();
      rg.gain.value = 0.16;
      rumble.connect(rg).connect(g);
      rumble.start();
      src.connect(f).connect(g);
      src.start();
      this._jet = { g, src, rumble };
    } else if (!on && this._jet) {
      const j = this._jet;
      this._jet = null;
      try {
        j.g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        j.src.stop(this.ctx.currentTime + 0.55);
        j.rumble.stop(this.ctx.currentTime + 0.55);
      } catch { /* done */ }
    }
  }

  /* ---------------- SFX synthesis ---------------- */
  // Every effect is generated on the fly; `vol` scales instead of per-call mix.
  sfx(name, opts = {}) {
    this.unlock();
    if (!this.ctx) return;
    const fn = SFX[name] ?? SFX._unknown;
    try {
      fn(this.ctx, this.sfxBus, opts);
    } catch (err) {
      console.warn(`[audio] sfx ${name} failed`, err);
    }
  }

  chirp() {
    this.sfx('chirp', { vol: 0.05 });
  }

  /* ---------------- BAHASA INDONESIA "BABBLE" DUB --------- */
  // Retrokina-style gibberish voice synthesized on the fly per line.
  // Not a recorded human — but it is 100% spoken-game-language, in Indonesian.
  babble(text, { voice = 'narrator' } = {}) {
    this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const base = voice === 'narrator'
      ? 150 + (voiceId(text) % 55)
      : 95 + (voiceId(text) % 60);
    const sylls = Math.max(3, Math.floor(text.length / 4));
    let at = now(ctx) + 0.02;
    for (let i = 0; i < sylls; i += 1) {
      const freq = base * (0.9 + Math.random() * 0.5);
      const dur = 0.05 + Math.random() * 0.085;
      const vol = voice === 'narrator' ? 0.09 : 0.07;
      // two detuned saws → band-passed for the "formant" feel
      for (const det of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(Math.max(30, freq + det), at);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(freq * (2.3 + Math.random()), at);
        bp.Q.value = 5.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0006, at + dur);
        o.connect(bp).connect(g).connect(this.sfxBus);
        o.start(at);
        o.stop(at + dur + 0.02);
      }
      at += dur + 0.008 + Math.random() * 0.02;
      // pause at word boundaries
      if (text[i * 4] === ' ' || text[i * 4 + 1] === ' ') at += 0.05;
    }
  }
}

/* ------------------------------------------------------------------ */
/* SFX library — small synth one-shots                                  */
/* ------------------------------------------------------------------ */
const now = (ctx) => ctx.currentTime;

// stable per-line pitch seed so one character always sounds the same
function voiceId(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function tone(ctx, out, {
  f0, f1, dur, type = 'sine', vol = 0.2, at = 0, curve = 'exp',
}) {
  const t = now(ctx) + at;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(1, f0), t);
  if (f1) o.frequency[curve === 'exp' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime'](Math.max(1, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noise(ctx, out, {
  dur = 0.2, type = 'bandpass', f0 = 800, f1, q = 1, vol = 0.2, at = 0,
}) {
  const t = now(ctx) + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

const SFX = {
  ui_click: (c, o) => tone(c, o, { f0: 900, f1: 1600, dur: 0.07, type: 'square', vol: 0.06 }),
  gunshot: (c, o) => { noise(c, o, { dur: 0.1, f0: 1500, f1: 200, q: 0.8, vol: 0.3 }); tone(c, o, { f0: 260, f1: 60, dur: 0.08, type: 'square', vol: 0.2 }); },
  smgshot: (c, o) => { noise(c, o, { dur: 0.055, f0: 1800, f1: 500, q: 0.9, vol: 0.2 }); tone(c, o, { f0: 320, f1: 120, dur: 0.05, type: 'square', vol: 0.13 }); },
  rocket: (c, o) => { noise(c, o, { dur: 0.7, f0: 400, f1: 1500, q: 1.4, vol: 0.22 }); tone(c, o, { f0: 90, f1: 180, dur: 0.7, type: 'sawtooth', vol: 0.1, curve: 'lin' }); },
  explosion: (c, o) => { noise(c, o, { dur: 0.9, f0: 900, f1: 60, q: 0.6, vol: 0.38 }); tone(c, o, { f0: 130, f1: 32, dur: 0.9, type: 'sine', vol: 0.3 }); },
  reload: (c, o) => { tone(c, o, { f0: 500, dur: 0.04, type: 'square', vol: 0.09 }); tone(c, o, { f0: 740, dur: 0.06, type: 'square', vol: 0.1, at: 0.09 }); tone(c, o, { f0: 1100, dur: 0.05, type: 'square', vol: 0.08, at: 0.2 }); },
  dry: (c, o) => tone(c, o, { f0: 1200, dur: 0.04, type: 'square', vol: 0.07 }),
  aim: (c, o) => tone(c, o, { f0: 1400, f1: 1900, dur: 0.05, type: 'sine', vol: 0.05 }),
  train_horn: (c, o) => { tone(c, o, { f0: 587, dur: 0.95, type: 'sawtooth', vol: 0.2, curve: 'lin' }); tone(c, o, { f0: 880, dur: 0.95, type: 'sawtooth', vol: 0.14, curve: 'lin' }); },
  ui_hover: (c, o) => tone(c, o, { f0: 1200, dur: 0.045, type: 'sine', vol: 0.03 }),
  ui_confirm: (c, o) => { tone(c, o, { f0: 660, f1: 990, dur: 0.12, type: 'triangle', vol: 0.12 }); tone(c, o, { f0: 1320, dur: 0.16, type: 'sine', vol: 0.06, at: 0.08 }); },
  ui_cancel: (c, o) => tone(c, o, { f0: 500, f1: 260, dur: 0.16, type: 'triangle', vol: 0.1 }),
  confirm: (c, o) => SFX.ui_confirm(c, o),
  cancel: (c, o) => SFX.ui_cancel(c, o),

  jump: (c, o) => tone(c, o, { f0: 300, f1: 640, dur: 0.18, type: 'triangle', vol: 0.14 }),
  land: (c, o) => noise(c, o, { dur: 0.12, f0: 300, f1: 120, vol: 0.16 }),
  step: (c, o, p = {}) => noise(c, o, { dur: 0.062, f0: 500 + Math.random() * 400, f1: 220, vol: 0.05 + (p.vol || 0) }),
  dash: (c, o) => noise(c, o, { dur: 0.26, f0: 1400, f1: 300, vol: 0.2 }),
  swing: (c, o, p = {}) => noise(c, o, { dur: 0.14, f0: 2400, f1: 500, q: 2.4, vol: 0.16 + (p.vol || 0) }),
  hit: (c, o, p = {}) => { noise(c, o, { dur: 0.09, f0: 900, f1: 160, vol: 0.22 }); tone(c, o, { f0: 210, f1: 90, dur: 0.09, type: 'square', vol: 0.12 }); },
  hit_hard: (c, o) => { noise(c, o, { dur: 0.16, f0: 700, f1: 100, vol: 0.3 }); tone(c, o, { f0: 160, f1: 62, dur: 0.16, type: 'square', vol: 0.18 }); },
  phase_step: (c, o) => tone(c, o, { f0: 180, f1: 70, dur: 0.24, type: 'sawtooth', vol: 0.16 }),
  skill_spin: (c, o) => { for (let i = 0; i < 3; i++) noise(c, o, { dur: 0.2, f0: 1200 + i * 400, f1: 400, vol: 0.12, at: i * 0.06 }); },
  skill4: (c, o) => { tone(c, o, { f0: 440, f1: 1760, dur: 0.3, type: 'sawtooth', vol: 0.16 }); noise(c, o, { dur: 0.5, f0: 2000, f1: 200, vol: 0.28, at: 0.24 }); },
  levelup: (c, o) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, o, { f0: f, dur: 0.24, type: 'triangle', vol: 0.12, at: i * 0.09 })); },
  pickup: (c, o) => { tone(c, o, { f0: 880, f1: 1560, dur: 0.1, type: 'sine', vol: 0.1 }); },
  coin: (c, o) => { tone(c, o, { f0: 1200, dur: 0.07, type: 'square', vol: 0.07 }); tone(c, o, { f0: 1800, dur: 0.1, type: 'square', vol: 0.05, at: 0.05 }); },
  deliver: (c, o) => { [660, 880, 1100].forEach((f, i) => tone(c, o, { f0: f, dur: 0.2, type: 'triangle', vol: 0.12, at: i * 0.11 })); },
  quest: (c, o) => { tone(c, o, { f0: 520, f1: 780, dur: 0.14, type: 'sine', vol: 0.1 }); tone(c, o, { f0: 1040, dur: 0.2, type: 'sine', vol: 0.08, at: 0.1 }); },
  hurt: (c, o) => { tone(c, o, { f0: 320, f1: 130, dur: 0.2, type: 'sawtooth', vol: 0.2 }); noise(c, o, { dur: 0.16, f0: 600, f1: 140, vol: 0.2 }); },
  enemy_die: (c, o) => { tone(c, o, { f0: 600, f1: 90, dur: 0.4, type: 'sawtooth', vol: 0.16 }); noise(c, o, { dur: 0.3, f0: 1400, f1: 200, vol: 0.14 }); },
  alert: (c, o) => { tone(c, o, { f0: 700, f1: 1000, dur: 0.09, type: 'square', vol: 0.08 }); },
  slime_bounce: (c, o, p = {}) => tone(c, o, { f0: 220 + (p.up || 0), f1: 160, dur: 0.24, type: 'sine', vol: 0.22 }),
  slime_cute: (c, o) => { tone(c, o, { f0: 620, f1: 940, dur: 0.16, type: 'sine', vol: 0.16, curve: 'lin' }); tone(c, o, { f0: 940, f1: 700, dur: 0.2, type: 'sine', vol: 0.12, at: 0.16, curve: 'lin' }); },
  slime_angry: (c, o) => { tone(c, o, { f0: 340, f1: 190, dur: 0.5, type: 'sawtooth', vol: 0.22 }); tone(c, o, { f0: 360, f1: 200, dur: 0.5, type: 'square', vol: 0.12 }); },
  slam: (c, o) => { noise(c, o, { dur: 0.4, f0: 420, f1: 60, vol: 0.34 }); tone(c, o, { f0: 120, f1: 40, dur: 0.4, type: 'sine', vol: 0.3 }); },
  spit: (c, o) => noise(c, o, { dur: 0.2, f0: 900, f1: 2000, q: 3, vol: 0.1 }),
  takeoff: (c, o) => { noise(c, o, { dur: 2.6, f0: 320, f1: 2400, q: 1.6, vol: 0.26 }); tone(c, o, { f0: 90, f1: 200, dur: 2.6, type: 'sawtooth', vol: 0.12, curve: 'lin' }); },
  chirp: (c, o, p = {}) => { tone(c, o, { f0: 2000 + Math.random() * 1400, f1: 2600, dur: 0.09, type: 'sine', vol: p.vol || 0.03, curve: 'lin' }); },
  splash: (c, o) => noise(c, o, { dur: 0.34, f0: 800, f1: 240, vol: 0.14 }),
  boss_intro: (c, o) => { tone(c, o, { f0: 130, f1: 65, dur: 0.8, type: 'sawtooth', vol: 0.24 }); tone(c, o, { f0: 520, f1: 630, dur: 0.7, type: 'sine', vol: 0.14, at: 0.1, curve: 'lin' }); },
  _unknown: (c, o) => tone(c, o, { f0: 500, dur: 0.08, type: 'square', vol: 0.08 }),
};
