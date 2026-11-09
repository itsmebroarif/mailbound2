// Procedural asset factory. MAILBOUND ships zero binary assets — every texture
// is drawn on a canvas at boot and cached by id (the "manual assets" strategy).

import * as THREE from 'three';

const _texCache = new Map();
const _matCache = new Map();

/* ------------------------------------------------------------------ */
/* Canvas drawing helpers                                              */
/* ------------------------------------------------------------------ */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Seeded RNG so patterns are stable between sessions.
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PATTERNS = {
  grass(c, g, w, h) {
    g.fillStyle = '#7fbf59';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const t = Math.random();
      g.fillStyle = t > 0.6 ? '#8fce67' : t > 0.3 ? '#74b352' : '#a4d97c';
      g.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  },
  asphalt(c, g, w, h) {
    g.fillStyle = '#3c3f4c';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = Math.random() > 0.5 ? '#454958' : '#33363f';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.strokeStyle = 'rgba(255,220,120,0.55)';
    g.lineWidth = 10;
    g.setLineDash([70, 60]);
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.lineTo(w / 2, h);
    g.stroke();
  },
  sand(c, g, w, h) {
    g.fillStyle = '#f4d59b';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() > 0.5 ? '#eecb8e' : '#fbe3ae';
      g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  },
  wood(c, g, w, h) {
    g.fillStyle = '#b58a5a';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = y % 32 === 0 ? '#a87e4f' : '#c0925f';
      g.fillRect(0, y, w, 15);
      g.strokeStyle = 'rgba(70,45,20,0.35)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, y + 15);
      g.lineTo(w, y + 15);
      g.stroke();
    }
  },
  stone(c, g, w, h) {
    g.fillStyle = '#9aa0ad';
    g.fillRect(0, 0, w, h);
    const r = rng(31);
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 48) {
        const ox = (y / 32) % 2 ? 24 : 0;
        g.fillStyle = r() > 0.5 ? '#a4aab6' : '#8e95a3';
        g.fillRect(x + ox + 2, y + 2, 44, 28);
      }
    }
  },
  window(c, g, w, h) {
    g.fillStyle = '#2a3040';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 48) {
      for (let y = 0; y < h; y += 56) {
        const lit = Math.random() > 0.45;
        g.fillStyle = lit ? 'rgba(255,214,120,0.92)' : 'rgba(120,160,220,0.35)';
        g.fillRect(x + 8, y + 8, 32, 40);
      }
    }
  },
  roof(c, g, w, h) {
    g.fillStyle = '#c95d4a';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,30,22,0.4)';
    g.lineWidth = 2;
    for (let y = 0; y < h; y += 18) {
      for (let x = (y / 18) % 2 ? 0 : 30; x < w; x += 60) {
        g.beginPath();
        g.arc(x + 30, y + 18, 30, Math.PI, 0);
        g.stroke();
      }
    }
  },
  water(c, g, w, h) {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2f8fd6');
    grad.addColorStop(1, '#57b7e8');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = Math.random() * h;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x < w; x += 24) g.lineTo(x, y + Math.sin(x * 0.06) * 3);
      g.stroke();
    }
  },
  parkpath(c, g, w, h) {
    g.fillStyle = '#d8b078';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = i % 2 ? '#cf9f63' : '#e2bd85';
      g.fillRect(Math.random() * w, Math.random() * h, 30, 20);
    }
  },
  checker(c, g, w, h) {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e6335f';
    const s = w / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) g.fillRect(x * s, y * s, s, s);
      }
    }
  },
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

// Draws + caches a repeating CanvasTexture.
export function tex(id = 'grass', {
  size = 128, repeatX = 6, repeatY = 6,
} = {}) {
  const key = `${id}:${repeatX}x${repeatY}`;
  if (_texCache.has(key)) return _texCache.get(key);
  if (!PATTERNS[id]) throw new Error(`Unknown texture pattern: ${id}`);

  const canvas = makeCanvas(size, size);
  const g = canvas.getContext('2d');
  PATTERNS[id](canvas, g, size, size);

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.magFilter = THREE.NearestFilter;   // crisp pixel-toon look
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, t);
  return t;
}

export function hasTexture(id) {
  return PATTERNS[id] != null;
}

// Shared cached material factory (keeps draw-call state changes low).
export function networkedMaterialKey(color, opts = {}) {
  return [color, opts.map ?? '', opts.opacity ?? 1, opts.transparent ?? false].join('|');
}

export function disposeAll() {
  for (const t of _texCache.values()) t.dispose();
  for (const m of _matCache.values()) m.dispose();
  _texCache.clear();
  _matCache.clear();
}
