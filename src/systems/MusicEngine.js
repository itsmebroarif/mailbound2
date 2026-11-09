// Procedural OST engine. Tracks are described as compact musical data
// (key, mode, chord loop, bpm, drum pattern) and rendered in real time with a
// look-ahead scheduler. No audio files — everything is synthesized.

const SCALE_PERCENT = [0, 2, 4, 5, 7, 9, 11];      // major
const SCALE_MINOR = [0, 2, 3, 5, 7, 8, 10];        // aeolian

const TRACKS = {
  menu: {
    bpm: 96, root: 64 /* E4 */, mode: 'maj', chords: [0, 5, 7, 5],
    lead: 'bright', drums: 'soft', bass: 'round', swing: 0.02,
  },
  w1: { bpm: 104, root: 65, mode: 'maj', chords: [0, 3, 5, 4], lead: 'bright', drums: 'soft', bass: 'round' },
  w2: { bpm: 122, root: 61, mode: 'min', chords: [0, 5, 3, 6], lead: 'edge', drums: 'drive', bass: 'sawtooth' },
  w3: { bpm: 132, root: 67, mode: 'maj', chords: [0, 4, 5, 6], lead: 'carnival', drums: 'drive', bass: 'square' },
  w4: { bpm: 88, root: 62, mode: 'min', chords: [0, 3, 7, 5], lead: 'soft', drums: 'none', bass: 'round' },
  w5: { bpm: 108, root: 66, mode: 'maj', chords: [0, 5, 3, 4], lead: 'bright', drums: 'soft', bass: 'round' },
  boss: { bpm: 148, root: 59, mode: 'min', chords: [0, 0, 6, 6], lead: 'edge', drums: 'drive', bass: 'sawtooth' },
  victory: { bpm: 120, root: 69, mode: 'maj', chords: [0, 4, 0, 0], lead: 'fanfare', drums: 'soft', bass: 'round' },
  gameover: { bpm: 70, root: 60, mode: 'min', chords: [0, -2, 0, -2], lead: 'soft', drums: 'none', bass: 'sine' },
};

const semis = (n) => Math.pow(2, n / 12);

export class MusicEngine {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = out;
    this.trackId = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.enabled = true;
  }

  play(id) {
    if (!this.ctx || this.trackId === id) return;
    this.stop();
    const t = TRACKS[id];
    if (!t) return;
    this.trackId = id;
    this.track = t;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this._pump(), 110);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.trackId = null;
  }

  dispose() {
    this.stop();
  }

  _pump() {
    if (!this.enabled) return;
    const t = this.track;
    const sPerStep = 60 / t.bpm / 4; // 16th notes
    while (this.nextTime < this.ctx.currentTime + 0.3) {
      this._scheduleStep(t, this.step, this.nextTime, sPerStep);
      this.step = (this.step + 1) % 128; // 8 bars × 16
      this.nextTime += sPerStep;
    }
  }

  _scheduleStep(t, step, at, sPerStep) {
    const ctx = this.ctx;
    const bar = Math.floor(step / 16) % 4;
    const inBeat = step % 16;
    const root = t.root + t.chords[bar];

    // --- bass ---
    if (inBeat % 4 === 0 || (t.drums === 'drive' && inBeat % 16 === 10)) {
      const norm = t.mode === 'maj' ? SCALE_PERCENT : SCALE_MINOR;
      const bnote = inBeat % 16 === 0 ? 0 : norm[(bar * 2 + inBeat / 4) % norm.length] ;
      this._voice(root - 24 + bnote, at, sPerStep * 3.4, t.bass === 'round' ? 'triangle' : t.bass, 0.16);
    }

    // --- chord pad (sustained soft pluck each half-bar) ---
    if (inBeat === 0 || inBeat === 8) {
      const norm = t.mode === 'maj' ? SCALE_PERCENT : SCALE_MINOR;
      for (const iv of [0, 2, 4]) {
        this._voice(root + norm[iv] - 12, at, sPerStep * 6.4, 'square', 0.035);
      }
    }

    // --- lead melody ---
    let chance = { bright: 0.5, edge: 0.6, soft: 0.34, carnival: 0.7, fanfare: 0.55 }[t.lead] ?? 0.5;
    if (inBeat % 2 === 0 && Math.sin(step * 12.9898) * 43758.5453 % 1 < chance) {
      const norm = t.mode === 'maj' ? SCALE_PERCENT : SCALE_MINOR;
      const deg = Math.floor(Math.abs(Math.sin(step * 3.17 + bar) * 43758.5453 % 1) * 5);
      const oct = (Math.sin(step * 1.3) > 0.6) ? 12 : 0;
      const ntype = t.lead === 'edge' ? 'sawtooth' : t.lead === 'carnival' ? 'square' : 'triangle';
      this._voice(root + 12 + oct + norm[deg], at, sPerStep * (Math.random?1:1) * 2.2, ntype, 0.09);
    }

    // --- drums ---
    if (t.drums === 'none') return;
    const kick = inBeat === 0 || inBeat === 8 || (t.drums === 'drive' && (inBeat === 11 || inBeat === 14));
    const hat = inBeat % 2 === 0;
    const snare = inBeat === 4 || inBeat === 12;
    if (kick) this._kick(at);
    if (hat) this._hat(at, t.drums === 'drive' ? 0.05 : 0.03);
    if (snare) this._snare(at);
  }

  _voice(midi, at, dur, type, vol) {
    const ctx = this.ctx;
    const freq = 440 * semis(midi - 69);
    if (!Number.isFinite(freq) || !Number.isFinite(at) || !Number.isFinite(dur) || freq <= 0) return;
    const safeAt = Math.max(0, at - ctx.currentTime) + ctx.currentTime;
    const safeDur = Math.max(0.05, Math.min(dur, 8));
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, safeAt);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, vol), safeAt + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, safeAt + safeDur);
    osc.connect(g).connect(this.out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  _kick(at) {
    if (!Number.isFinite(at)) return;
    const ctx = this.ctx;
    at = Math.max(0, at);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, at);
    g.gain.exponentialRampToValueAtTime(0.005, at + 0.16);
    osc.connect(g).connect(this.out);
    osc.start(at);
    osc.stop(at + 0.2);
  }

  _hat(at, vol = 0.04) {
    if (!Number.isFinite(at)) return;
    at = Math.max(0, at);
    const ctx = this.ctx;
    const buf = this._noizeBuf(0.06);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.002, at + 0.05);
    src.connect(hp).connect(g).connect(this.out);
    src.start(at);
  }

  _snare(at) {
    if (!Number.isFinite(at)) return;
    at = Math.max(0, at);
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noizeBuf(0.18);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, at);
    g.gain.exponentialRampToValueAtTime(0.004, at + 0.16);
    src.connect(bp).connect(g).connect(this.out);
    src.start(at);
  }

  _noizeBuf(dur) {
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
}
