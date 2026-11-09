// Reusable environment prop factories. Every prop: name-keyed factory that
// returns a THREE.Group. Colliders are declared in userData.collider
// ({type:'box', w,d,h} or {type:'cyl', r, h}) in LOCAL space; WorldBase lifts
// them to world space at placement time. Animated props define
// userData.update(t, dt).

import * as THREE from 'three';
import { celMesh, gradientMap } from './cel.js';
import { tex } from '../core/AssetManager.js';

// Horizontal plane helper (ground patches)
function planeH(w, d) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  return g;
}

// Vertical plane helper (signs, waterfalls, awnings)
function planeV(w, h) {
  return new THREE.PlaneGeometry(w, h);
}

function toonMat(color, mapId = null) {
  return new THREE.MeshToonMaterial({ color, map: mapId ? tex(mapId) : null, gradientMap: gradientMap() });
}

/* ------------------------------------------------------------------ */
/* Buildings                                                            */
/* ------------------------------------------------------------------ */
function house({ w = 5, d = 5, h = 3, wall = 0xfff1d6, roofColor = 0xc95d4a, door = 0x8a5a33, ry = 0 } = {}) {
  const g = new THREE.Group();
  const base = celMesh(new THREE.BoxGeometry(w, h, d), wall, { mapId: null });
  base.position.y = h / 2;
  g.add(base);
  const roof = celMesh(new THREE.ConeGeometry(0.78, 1.5, 4), roofColor);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(w / 3.4, 1, d / 3.4);
  roof.position.y = h + 0.72;
  g.add(roof);
  const doorMesh = celMesh(new THREE.BoxGeometry(0.8, 1.5, 0.1), door);
  doorMesh.position.set(0, 0.75, d / 2 + 0.05);
  g.add(doorMesh);
  for (const sx of [-1, 1]) {
    const win = new THREE.Mesh(planeV(0.9, 0.9), toonMat(0x2a3040, 'window'));
    win.position.set(sx * w * 0.28, 1.7, d / 2 + 0.06);
    g.add(win);
  }
  const ch = celMesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), 0x8d8d94);
  ch.position.set(w * 0.3, h + 1.0, -d * 0.28);
  g.add(ch);
  g.userData.collider = { type: 'box', w, d, h: h };
  g.userData.footprint = { w, d };
  g.rotation.y = ry;
  return g;
}

function tower({ w = 7, d = 7, h = 18, color = 0x8aa4c8, roofColor = 0x4c5870 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(geoBox(w, h, d), celMatTwin(0x2a3040, 'window'));
  // toon windows texture + tintable walls: bake tint by overlay color
  base.position.y = h / 2;
  g.add(base);
  const parapet = celMesh(new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3), roofColor);
  parapet.position.y = h + 0.2;
  g.add(parapet);
  const acBox = celMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x9aa0ad);
  acBox.position.set(w * 0.2, h + 0.6, d * 0.25);
  g.add(acBox);
  const antenna = celMesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), 0xffce4b);
  antenna.position.set(-w * 0.25, h + 1.4, -d * 0.2);
  g.add(antenna);
  g.userData.collider = { type: 'box', w, d, h: h };
  g.userData.footprint = { w, d };
  return g;
}

function geoBox(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

// window-textured wall material (cached per tint)
const wallMats = new Map();
function celMatTwin(tint, mapId) {
  const key = `${tint}:${mapId}`;
  if (wallMats.has(key)) return wallMats.get(key);
  const m = new THREE.MeshToonMaterial({
    color: tint,
    map: tex(mapId, { size: 256, repeatX: 3, repeatY: 3 }),
    gradientMap: gradientMap(),
  });
  wallMats.set(key, m);
  return m;
}

function shop({ w = 6, d = 5, h = 3, color = 0x9fd08a, ry = 0 } = {}) {
  const g = house({ w, d, h, wall: color, roofColor: 0x74b352, ry });
  const front = celMesh(new THREE.BoxGeometry(w * 0.8, 1.4, 0.08), 0xbfe8ff);
  front.position.set(0, 1.05, (g.userData.footprint?.d ?? d) / 2 + 0.09);
  g.add(front);
  const sign = celMesh(new THREE.BoxGeometry(w * 0.6, 0.5, 0.12), 0xffce4b);
  sign.position.set(0, h + 0.3, ((g.userData.footprint?.d ?? d)) / 2 + 0.1);
  g.add(sign);
  return g;
}

function hauntedHouse({ ry = 0 } = {}) {
  const g = new THREE.Group();
  const base = celMesh(new THREE.BoxGeometry(6, 5, 5), 0x6b5f86);
  base.position.y = 2.5;
  g.add(base);
  const roof = celMesh(new THREE.ConeGeometry(1.2, 2.4, 4), 0x37304d);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(2.4, 1, 2);
  roof.position.y = 6.3;
  g.add(roof);
  const tower = celMesh(new THREE.CylinderGeometry(0.9, 1.0, 6, 8), 0x544a70);
  tower.position.set(2.6, 3, -1.4);
  g.add(tower);
  const cap = celMesh(new THREE.ConeGeometry(1.2, 1.6, 8), 0x37304d);
  cap.position.set(2.6, 6.8, -1.4);
  g.add(cap);
  g.userData.collider = { type: 'box', w: 6, d: 5, h: 5.6 };
  g.rotation.y = ry;
  return g;
}

function cabin({ ry = 0 } = {}) {
  const g = new THREE.Group();
  const base = celMesh(new THREE.BoxGeometry(5, 2.8, 4.2), 0xb58a5a, { mapId: 'wood' });
  base.position.y = 1.4;
  g.add(base);
  const roof = celMesh(new THREE.ConeGeometry(1.3, 1.6, 4), 0x6e4f2a);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(2.2, 1, 1.9);
  roof.position.y = 3.6;
  g.add(roof);
  g.userData.collider = { type: 'box', w: 5, d: 4.2, h: 2.8 };
  g.rotation.y = ry;
  return g;
}

function lighthouse() {
  const g = new THREE.Group();
  const rings = [
    { h: 4, r: 1.6, c: 0xff5d73 }, { h: 4, r: 1.4, c: 0xfdf8f8 },
    { h: 4, r: 1.2, c: 0xff5d73 }, { h: 3.4, r: 1.05, c: 0xfdf8f8 },
  ];
  let y = 0;
  for (const r of rings) {
    const seg = celMesh(new THREE.CylinderGeometry(r.r, r.r + 0.12, r.h, 14), r.c);
    seg.position.y = y + r.h / 2;
    g.add(seg);
    y += r.h;
  }
  const lantern = celMesh(new THREE.CylinderGeometry(0.75, 0.85, 1.1, 10), 0x2a3040);
  lantern.position.y = y + 0.55;
  g.add(lantern);
  const light = celMesh(new THREE.SphereGeometry(0.5, 10, 8), 0xffe066, { emissive: 0xffd23a });
  light.position.y = y + 0.6;
  g.add(light);
  const capP = celMesh(new THREE.ConeGeometry(1.0, 0.9, 10), 0x2a3040);
  capP.position.y = y + 1.5;
  g.add(capP);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 16, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.position.y = y + 0.6;
  beam.rotation.z = -Math.PI / 2.6;
  beam.position.x = 8.2;
  g.add(beam);
  g.userData.update = (t) => {
    beam.rotation.y = -t * 0.9;
  };
  g.userData.animatable = true;
  g.userData.collider = { type: 'cyl', r: 1.75, h: y };
  return g;
}

/* ------------------------------------------------------------------ */
/* Street furniture, nature, park                                       */
/* ------------------------------------------------------------------ */
function tree({ trunkColor = 0x8a5a33, leafColors = [0x74b352, 0x8fce67], scale = 1 } = {}) {
  const g = new THREE.Group();
  const trunk = celMesh(new THREE.CylinderGeometry(0.16, 0.24, 1.4, 8), trunkColor);
  trunk.position.y = 0.7;
  g.add(trunk);
  const leafGeo = new THREE.SphereGeometry(0.95, 10, 8);
  [[0, 1.9, 0, leafColors[0]], [0.5, 1.55, 0.25, leafColors[1] ?? leafColors[0]], [-0.45, 1.6, -0.3, leafColors[0]]]
    .forEach(([x, y, z, c], i) => {
      const leaf = celMesh(leafGeo, c);
      leaf.position.set(x, y, z);
      leaf.scale.setScalar(i === 0 ? 1 : 0.68);
      g.add(leaf);
    });
  g.userData.collider = { type: 'cyl', r: 0.3, h: 2.4 };
  g.scale.setScalar(scale);
  return g;
}

function pine({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const trunk = celMesh(new THREE.CylinderGeometry(0.15, 0.22, 1.2, 8), 0x6e4f2a);
  trunk.position.y = 0.6;
  g.add(trunk);
  const coneColors = [0x2f7a4d, 0x3f9757, 0x57b86e];
  for (let i = 0; i < 3; i++) {
    const cone = celMesh(new THREE.ConeGeometry(1.1 - i * 0.28, 1.3, 8), coneColors[i]);
    cone.position.y = 1.5 + i * 0.95;
    g.add(cone);
  }
  g.userData.collider = { type: 'cyl', r: 0.28, h: 2.6 };
  g.scale.setScalar(scale);
  return g;
}

function palm({ scale = 1 } = {}) {
  const g = new THREE.Group();
  let y = 0;
  let tilt = 0.06;
  for (let i = 0; i < 4; i++) {
    const seg = celMesh(new THREE.CylinderGeometry(0.14 - i * 0.015, 0.17 - i * 0.015, 1.0, 7), 0xa97c50);
    seg.position.set(0.14 * i, y + 0.5, 0);
    seg.rotation.z = -tilt * i;
    g.add(seg);
    y += 0.95;
  }
  const top = new THREE.Group();
  top.position.set(0.52, y + 0.15, 0);
  g.add(top);
  for (let i = 0; i < 6; i++) {
    const frond = celMesh(new THREE.ConeGeometry(0.28, 1.9, 4), i % 2 ? 0x3f9757 : 0x57b86e);
    frond.scale.set(1, 1, 0.22);
    const a = (i / 6) * Math.PI * 2;
    frond.position.set(Math.cos(a) * 0.75, 0.16, Math.sin(a) * 0.75);
    frond.rotation.z = Math.cos(a) * 0.5;
    frond.rotation.x = Math.sin(a) * 0.5;
    top.add(frond);
  }
  g.userData.collider = { type: 'cyl', r: 0.25, h: 2.8 };
  g.scale.setScalar(scale);
  return g;
}

function rock({ scale = 1, color = 0x9aa0ad } = {}) {
  const g = new THREE.Group();
  const r = celMesh(new THREE.SphereGeometry(0.8, 7, 6), color);
  r.scale.set(1, 0.7, 0.85);
  r.position.y = 0.42;
  g.add(r);
  g.userData.collider = { type: 'cyl', r: 0.7 * scale, h: 0.9 };
  g.scale.setScalar(scale);
  return g;
}

function bush({ color = 0x57b86e } = {}) {
  const g = new THREE.Group();
  const b = celMesh(new THREE.SphereGeometry(0.55, 8, 6), color);
  b.position.y = 0.4;
  b.scale.set(1.15, 0.75, 1.05);
  g.add(b);
  return g; // walk-through (no collider)
}

function lamp({ color = 0xffe9b0 } = {}) {
  const g = new THREE.Group();
  const pole = celMesh(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 8), 0x31363f);
  pole.position.y = 1.7;
  g.add(pole);
  const head = celMesh(new THREE.SphereGeometry(0.24, 10, 8), color, { emissive: color });
  head.position.y = 3.5;
  g.add(head);
  g.userData.collider = { type: 'cyl', r: 0.18, h: 3.6 };
  return g;
}

function bench() {
  const g = new THREE.Group();
  const seat = celMesh(new THREE.BoxGeometry(1.8, 0.12, 0.55), 0xb58a5a, { mapId: 'wood' });
  seat.position.y = 0.45;
  g.add(seat);
  const back = celMesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), 0xb58a5a);
  back.position.set(0, 0.75, -0.25);
  back.rotation.x = -0.15;
  g.add(back);
  for (const sx of [-1, 1]) {
    const leg = celMesh(new THREE.BoxGeometry(0.12, 0.45, 0.5), 0x31363f);
    leg.position.set(sx * 0.75, 0.22, 0);
    g.add(leg);
  }
  g.userData.collider = { type: 'box', w: 1.8, d: 0.6, h: 0.5 };
  return g;
}

function fountain() {
  const g = new THREE.Group();
  const base = celMesh(new THREE.CylinderGeometry(2.2, 2.5, 0.7, 18), 0xbfc8d9);
  base.position.y = 0.35;
  g.add(base);
  const water = new THREE.Mesh(planeH(3.6, 3.6), new THREE.MeshToonMaterial({ color: 0x57b7e8, transparent: true, opacity: 0.85, gradientMap: gradientMap() }));
  water.position.y = 0.72;
  g.add(water);
  const spire = celMesh(new THREE.CylinderGeometry(0.3, 0.5, 1.6, 10), 0x9aa0ad);
  spire.position.y = 1.4;
  g.add(spire);
  const top = celMesh(new THREE.SphereGeometry(0.4, 10, 8), 0x9fd06e);
  top.position.y = 2.3;
  g.add(top);
  g.userData.collider = { type: 'cyl', r: 2.5, h: 0.8 };
  g.userData.update = (t) => {
    water.scale.setScalar(1 + Math.sin(t * 2.2) * 0.012);
  };
  g.userData.animatable = true;
  return g;
}

function mailbox() {
  const g = new THREE.Group();
  const post = celMesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6), 0x6e4f2a);
  post.position.y = 0.5;
  g.add(post);
  const box = celMesh(new THREE.BoxGeometry(0.5, 0.32, 0.34), 0xff5d73);
  box.position.y = 1.14;
  g.add(box);
  const flag = celMesh(new THREE.BoxGeometry(0.05, 0.28, 0.05), 0xffce4b);
  flag.position.set(0.28, 1.32, 0);
  g.add(flag);
  g.userData.collider = { type: 'box', w: 0.5, d: 0.4, h: 1.3 };
  return g;
}

function fenceRun({ len = 10, color = 0xfdf1cf } = {}) {
  const g = new THREE.Group();
  const step = 1.8;
  const n = Math.max(2, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const post = celMesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), color);
    post.position.set(-len / 2 + i * (len / n), 0.5, 0);
    g.add(post);
  }
  for (const yy of [0.4, 0.8]) {
    const rail = celMesh(new THREE.BoxGeometry(len, 0.09, 0.09), color);
    rail.position.y = yy;
    g.add(rail);
  }
  g.userData.rail = true;
  return g;
}

function stall({ color = 0xffce4b, ry = 0 } = {}) {
  const g = new THREE.Group();
  const counter = celMesh(new THREE.BoxGeometry(2.4, 1.0, 1.1), 0xb58a5a, { mapId: 'wood' });
  counter.position.y = 0.5;
  g.add(counter);
  const awning = new THREE.Mesh(planeV(3.0, 2.0), toonMat(0xffffff, 'checker'));
  awning.position.set(0, 2.0, -0.3);
  awning.rotation.x = -0.4;
  g.add(awning);
  for (const sx of [-1, 1]) {
    const pole = celMesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), color);
    pole.position.set(sx * 1.2, 1.15, -0.3);
    g.add(pole);
  }
  g.userData.collider = { type: 'box', w: 2.4, d: 1.2, h: 1.0 };
  g.rotation.y = ry;
  return g;
}

/* ------------------------------------------------------------------ */
/* Park spectacle (mall, coaster, wheel)                                */
/* ------------------------------------------------------------------ */
function ferrisWheel() {
  const g = new THREE.Group();
  const wheel = new THREE.Group();
  wheel.position.y = 9;
  g.add(wheel);
  wheel.add(celMesh(new THREE.TorusGeometry(8, 0.35, 8, 40), 0xff5d73));
  for (let i = 0; i < 6; i++) {
    const spoke = celMesh(new THREE.CylinderGeometry(0.14, 0.14, 15.6, 6), 0xffb43d);
    spoke.rotation.z = (i / 6) * Math.PI;
    wheel.add(spoke);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 8, Math.sin(a) * 8, 0);
    const cabin = celMesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), i % 2 ? 0xffce4b : 0x59d0c8);
    cabin.position.y = -0.5;
    pivot.add(cabin);
    wheel.add(pivot);
  }
  for (const sx of [-1, 1]) {
    const leg = celMesh(new THREE.CylinderGeometry(0.2, 0.28, 10, 8), 0x8a8f9c);
    leg.position.set(sx * 1.6, 4.7, 0);
    leg.rotation.z = -sx * 0.24;
    g.add(leg);
  }
  g.userData.collider = { type: 'box', w: 3, d: 3, h: 17 };
  g.userData.update = (t) => {
    wheel.rotation.z = -t * 0.22;
  };
  g.userData.animatable = true;
  return g;
}

function carousel() {
  const g = new THREE.Group();
  const platform = celMesh(new THREE.CylinderGeometry(4.2, 4.5, 0.5, 20), 0xffce4b);
  platform.position.y = 0.25;
  g.add(platform);
  const roof = celMesh(new THREE.ConeGeometry(4.6, 2.2, 16), 0xff5d73);
  roof.position.y = 4.6;
  g.add(roof);
  const spin = new THREE.Group();
  spin.position.y = 2.4;
  g.add(spin);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pole = celMesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), 0xdfe9f5);
    pole.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
    spin.add(pole);
    if (i % 2 === 0) {
      const horse = new THREE.Group();
      horse.position.set(Math.cos(a) * 3.2, 0.3, Math.sin(a) * 3.2);
      const bodn = celMesh(new THREE.SphereGeometry(0.4, 8, 6), i % 4 ? 0x6fd3ff : 0xff9e9e);
      bodn.scale.set(1.5, 0.75, 0.55);
      horse.add(bodn);
      const hed = celMesh(new THREE.SphereGeometry(0.2, 8, 6), 0xffffff);
      hed.position.set(0.5, 0.25, 0);
      horse.add(hed);
      spin.add(horse);
    }
  }
  g.userData.collider = { type: 'cyl', r: 4.5, h: 3 };
  g.userData.update = (t) => {
    spin.rotation.y = t * 0.5;
  };
  g.userData.animatable = true;
  return g;
}

function coaster() {
  const g = new THREE.Group();
  const track = celMesh(new THREE.TorusGeometry(7, 0.25, 8, 42), 0xffb43d);
  track.position.y = 8.5;
  track.rotation.y = 0.4;
  track.rotation.x = 0.15;
  g.add(track);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sup = celMesh(new THREE.CylinderGeometry(0.12, 0.16, 8.5, 6), 0x8a8f9c);
    sup.position.set(Math.cos(a) * 6.4, 4.25, Math.sin(a) * 6.4);
    g.add(sup);
  }
  const cart = celMesh(new THREE.BoxGeometry(1.4, 0.5, 0.8), 0xff5d73);
  cart.position.set(7, 9, 0);
  g.add(cart);
  g.userData.update = (t) => {
    const a = t * 0.8;
    cart.position.set(Math.cos(a) * 7 * 1.0, 8.5 + Math.sin(a) * 7 * 0.15, Math.sin(a) * 7 * 1.0);
    cart.rotation.y = -a;
  };
  g.userData.animatable = true;
  g.userData.collider = { type: 'cyl', r: 2.2, h: 4 };
  // colliders approximated by a few pillars
  g.userData.extraColliders = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.userData.extraColliders.push({ type: 'cyl', r: 0.5, h: 8.5, ox: Math.cos(a) * 6.4, oz: Math.sin(a) * 6.4 });
  }
  return g;
}

function gate({ ry = 0, color = 0xff5d73 } = {}) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const pillar = celMesh(new THREE.CylinderGeometry(0.5, 0.6, 6.5, 10), 0xfdf8f8);
    pillar.position.set(sx * 3, 3.25, 0);
    g.add(pillar);
    const roofTop = celMesh(new THREE.ConeGeometry(0.9, 1.1, 8), color);
    roofTop.position.set(sx * 3, 7.0, 0);
    g.add(roofTop);
  }
  const beam = celMesh(new THREE.BoxGeometry(7.4, 1.0, 0.6), color);
  beam.position.y = 6.0;
  g.add(beam);
  const sign = new THREE.Mesh(planeV(4.6, 0.9), toonMat(0xffffff, 'checker'));
  sign.position.set(0, 6.0, 0.36);
  g.add(sign);
  g.userData.collider = { type: 'box', w: 7.5, d: 1.2, h: 6 }; // walkable under arch gap
  g.rotation.y = ry;
  return g;
}

function stairs({ steps = 10, rise = 0.5, run = 0.6, w = 2.4 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const s = celMesh(new THREE.BoxGeometry(w, rise * (i + 1), run), 0xbfc8d9, { mapId: 'stone' });
    s.position.set(0, (rise * (i + 1)) / 2, -i * run - run / 2);
    g.add(s);
    s.userData.stairCollider = { type: 'box', w, d: run, h: rise * (i + 1), ox: 0, oz: -i * run - run / 2 };
  }
  g.userData.stairSteps = steps;
  return g;
}

function bridge({ len = 14 } = {}) {
  const g = new THREE.Group();
  const deck = celMesh(new THREE.BoxGeometry(len, 0.4, 3.4), 0xb58a5a, { mapId: 'wood' });
  deck.position.y = 0.3;
  g.add(deck);
  for (const sx of [-1, 1]) {
    const raila = celMesh(new THREE.BoxGeometry(len, 0.1, 0.1), 0x6e4f2a);
    raila.position.set(0, 1.2, sx * 1.6);
    g.add(raila);
    for (let i = 0; i <= 4; i++) {
      const post = celMesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), 0x6e4f2a);
      post.position.set(-len / 2 + (i * len) / 4, 1.1, sx * 1.6);
      g.add(post);
    }
  }
  for (const sx of [-1, 1]) {
    const pylon = celMesh(new THREE.CylinderGeometry(0.3, 0.36, 2.4, 8), 0x8a8f9c);
    pylon.position.set(sx * len * 0.3, -1.4, 0);
    g.add(pylon);
  }
  g.userData.collider = { type: 'box', w: len, d: 3.4, h: 0.5, walkableTop: true, step: true };
  return g;
}

function dock({ len = 10, w = 4 } = {}) {
  const g = new THREE.Group();
  const deck = celMesh(new THREE.BoxGeometry(len, 0.4, w), 0xb58a5a, { mapId: 'wood' });
  deck.position.y = 0.28;
  g.add(deck);
  for (let i = 0; i <= 2; i++) {
    for (const sx of [-1, 1]) {
      const pylon = celMesh(new THREE.CylinderGeometry(0.16, 0.18, 1.6, 8), 0x6e4f2a);
      pylon.position.set(-len / 2 + (i * len) / 2, -0.6, sx * (w / 2 - 0.3));
      g.add(pylon);
    }
  }
  g.userData.collider = { type: 'box', w: len, d: w, h: 0.5, walkableTop: true, step: true };
  return g;
}

function boat() {
  const g = new THREE.Group();
  const hull = celMesh(new THREE.CapsuleGeometry(0.8, 2.4, 4, 10), 0xff9e9e);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(1, 0.6, 1);
  g.add(hull);
  const mast = celMesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), 0x8a5a33);
  mast.position.y = 2.1;
  g.add(mast);
  const sail = celMesh(new THREE.BoxGeometry(0.06, 1.8, 1.4), 0xfdf8f8);
  sail.position.set(0.02, 1.9, 0.5);
  sail.rotation.y = 0.3;
  g.add(sail);
  return g;
}

function umbrella({ color = 0xffce4b } = {}) {
  const g = new THREE.Group();
  const pole = celMesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), 0xdfe9f5);
  pole.position.y = 1.1;
  g.add(pole);
  const canopy = celMesh(new THREE.ConeGeometry(1.5, 0.65, 10), color, { mapId: null });
  canopy.position.y = 2.3;
  g.add(canopy);
  g.userData.collider = { type: 'cyl', r: 0.14, h: 2.4 };
  return g;
}

function campfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const log = celMesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), 0x6e4f2a);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 3) * Math.PI;
    log.position.y = 0.24;
    g.add(log);
  }
  const flame = celMesh(new THREE.ConeGeometry(0.5, 1.1, 7), 0xff9e4a, { emissive: 0xff7a1a, outline: false });
  flame.position.y = 0.85;
  g.add(flame);
  const light = new THREE.PointLight(0xff9e4a, 14, 9, 1.6);
  light.position.y = 1.4;
  g.add(light);
  g.userData.update = (t) => {
    flame.scale.setScalar(0.9 + Math.sin(t * 9 + t * t * 2) * 0.12);
    light.intensity = 12 + Math.sin(t * 11) * 3;
  };
  g.userData.animatable = true;
  g.userData.collider = { type: 'cyl', r: 0.75, h: 0.6 };
  return g;
}

function caveArch() {
  const g = new THREE.Group();
  const arch = celMesh(new THREE.TorusGeometry(2.4, 0.7, 8, 16, Math.PI), 0x9aa0ad, { mapId: 'stone' });
  arch.position.y = 0;
  g.add(arch);
  const dark = new THREE.Mesh(planeV(3.6, 3.0), new THREE.MeshBasicMaterial({ color: 0x141628 }));
  dark.position.set(0, 0.02, 0);
  dark.rotation.y = 0;
  g.add(dark);
  g.userData.collider = { type: 'box', w: 4.6, d: 4.6, h: 2.2 };
  return g;
}

function waterfall({ h = 9, w = 7 } = {}) {
  const g = new THREE.Group();
  const fall = new THREE.Mesh(
    planeV(w, h),
    new THREE.MeshToonMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.75, gradientMap: gradientMap() }),
  );
  fall.geometry.translate(0, h / 2, 0);
  g.add(fall);
  const lip = celMesh(new THREE.BoxGeometry(w + 1.2, 1.2, 2.2), 0x8a8f9c, { mapId: 'stone' });
  lip.position.y = h + 0.5;
  g.add(lip);
  g.userData.update = (t) => {
    fall.position.y = Math.sin(t * 6) * 0.08;
  };
  g.userData.animatable = true;
  return g;
}

function crateStack({ h = 2 } = {}) {
  const g = new THREE.Group();
  const sizes = [[1.1, 1.1, 1.1], [0.9, 0.9, 0.9], [0.7, 0.7, 0.7]];
  let y = 0;
  for (let i = 0; i < h; i++) {
    const [a, b, c] = sizes[i % sizes.length];
    const cr = celMesh(new THREE.BoxGeometry(a, b, c), 0xc89058, { mapId: 'wood' });
    cr.position.set((i % 2 ? 0.12 : -0.1), y + b / 2, (i % 2 ? -0.09 : 0.1));
    g.add(cr);
    y += b;
  }
  g.userData.collider = { type: 'box', w: 1.2, d: 1.2, h: Math.min(y, 2.2), category: 'step' };
  return g;
}


function roadPatch({ w = 20, d = 7, ry = 0, mapId = 'asphalt' } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(planeH(w, d), new THREE.MeshToonMaterial({ color: 0x8f8f9c, map: tex(mapId, { size: 256, repeatX: Math.max(1, Math.round(w / 6)), repeatY: Math.max(1, Math.round(d / 6)) }), gradientMap: gradientMap() }));
  m.position.y = 0.01;
  g.add(m);
  g.rotation.y = ry;
  g.userData.noCollideHint = true;
  return g;
}

function mountainCone({ scale = 1, color = 0x8e95a3 } = {}) {
  const g = new THREE.Group();
  const c = celMesh(new THREE.ConeGeometry(6, 12, 9), color);
  c.position.y = 5.2;
  g.add(c);
  const cap = celMesh(new THREE.ConeGeometry(2.1, 4, 9), 0xfdf8f8);
  cap.position.y = 10.4;
  g.add(cap);
  g.scale.setScalar(scale);
  return g;
}

function foamGate({ ry = 0 } = {}) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const pillar = celMesh(new THREE.CylinderGeometry(0.42, 0.5, 8.4, 10), 0xffe0f0);
    pillar.position.set(sx * 2.4, 4.2, 0);
    g.add(pillar);
  }
  const beam = celMesh(new THREE.BoxGeometry(6.2, 1.15, 0.55), 0xff5d73);
  beam.position.y = 7.5;
  g.add(beam);
  g.rotation.y = ry;
  return g;
}


function neonSign(text, { w = 2.6, h = 0.95, font = '800 46px \'Outfit\', sans-serif', bg = '#102a5c', fg = '#ffd34d', border = '#ffd34d' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 60; i++) g.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 3, 3);
  g.strokeStyle = border;
  g.lineWidth = 22;
  g.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  const texSign = new THREE.CanvasTexture(canvas);
  texSign.colorSpace = THREE.SRGBColorSpace;
  texSign.anisotropy = 4;
  const sign = new THREE.Mesh(planeV(w, h), new THREE.MeshToonMaterial({ map: texSign, color: 0xffffff, gradientMap: gradientMap() }));
  sign.userData.sign = true;
  return sign;
}

function shopWithSign({ w = 6, d = 5, h = 3.6, color = 0xffd9b3, roof = 0xc95d4a, signText = 'SHOP', signFg = '#ffd34d', signBg = '#102a5c', ry = 0 } = {}) {
  const g = new THREE.Group();
  const base = celMesh(new THREE.BoxGeometry(w, h, d), color);
  base.position.y = h / 2;
  g.add(base);
  const roofm = celMesh(new THREE.ConeGeometry(0.75, 1.1, 4), roof);
  roofm.rotation.y = Math.PI / 4;
  roofm.scale.set(w / 3.2, 1, d / 3.2);
  roofm.position.y = h + 0.55;
  g.add(roofm);
  const door = celMesh(new THREE.BoxGeometry(0.9, 1.6, 0.1), 0x4a3320);
  door.position.set(0, 0.8, d / 2 + 0.05);
  g.add(door);
  const win = new THREE.Mesh(planeV(w * 0.62, 1.0), new THREE.MeshToonMaterial({ color: 0x2a3040, map: tex('window'), gradientMap: gradientMap() }));
  win.position.set(0, h - 1.1, d / 2 + 0.05);
  g.add(win);
  const sign = neonSign(signText, { w: w * 0.86, h: 0.9, fg: signFg, bg: signBg, border: signFg });
  sign.position.set(0, h + 0.02, d / 2 + 0.1);
  g.add(sign);
  g.userData.collider = { type: 'box', w, d, h };
  g.userData.footprint = { w, d };
  g.rotation.y = ry;
  return g;
}

function wartel() {
  const g = new THREE.Group();
  const booth = celMesh(new THREE.BoxGeometry(1.6, 2.4, 1.4), 0xffce4b);
  booth.position.y = 1.2;
  g.add(booth);
  const roof = celMesh(new THREE.ConeGeometry(1.2, 0.5, 4), 0x141628);
  roof.position.y = 2.65;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const sign = neonSign('WARTEL', { w: 1.7, h: 0.55, font: '800 60px \'Outfit\', sans-serif', bg: '#1a2a5c', fg: '#ffffff', border: '#ffd34d' });
  sign.position.set(0, 2.0, 0.72);
  g.add(sign);
  const phone = celMesh(new THREE.BoxGeometry(0.5, 0.4, 0.25), 0x141628);
  phone.position.set(0, 1.4, 0.55);
  g.add(phone);
  g.userData.collider = { type: 'box', w: 1.6, d: 1.4, h: 2.4 };
  return g;
}

function warkop({ ry = 0 } = {}) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = celMesh(new THREE.CylinderGeometry(0.09, 0.11, 2.3, 6), 0x6e4f2a);
    post.position.set(sx * 1.55, 1.15, sz * 1.15);
    g.add(post);
  }
  const roof = celMesh(new THREE.BoxGeometry(4.0, 0.14, 3.2), 0x8a5a33);
  roof.position.y = 2.3;
  roof.rotation.z = 0.07;
  g.add(roof);
  const table = celMesh(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 10), 0xd8b078, { mapId: 'wood' });
  table.position.set(0, 0.72, 0);
  g.add(table);
  const pot = celMesh(new THREE.CylinderGeometry(0.32, 0.4, 0.75, 10), 0xff5d73);
  pot.position.set(0, 1.1, 0);
  g.add(pot);
  const sign = neonSign('WARKOP', { w: 2.6, h: 0.7, bg: '#3a2412', fg: '#ffce4b', border: '#ffce4b' });
  sign.position.set(0, 2.3, 1.62);
  g.add(sign);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const stool = celMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.32, 8), 0xffce4b);
    stool.position.set(Math.cos(a) * 1.1, 0.16, Math.sin(a) * 1.1);
    g.add(stool);
  }
  g.userData.collider = { type: 'cyl', r: 2.1, h: 2.3 };
  g.rotation.y = ry;
  return g;
}

function rentalPS({ ry = 0 } = {}) {
  const g = shopWithSign({ w: 5.6, d: 4.6, h: 3.2, color: 0x2b3a5c, roof: 0x4a5dff, signText: 'RENTAL PS', signFg: '#8ef0d4', signBg: '#0c1b33', ry });
  for (const sx of [-1, 1]) {
    const ps = celMesh(new THREE.BoxGeometry(0.9, 0.35, 0.7), 0x1a1c28);
    ps.position.set(sx * 1.3, 0.16, 2.6);
    g.add(ps);
  }
  return g;
}

function warnet({ ry = 0 } = {}) {
  const g = shopWithSign({ w: 5.8, d: 4.8, h: 3.4, color: 0x20304f, roof: 0x3d5afe, signText: 'WARNET', signFg: '#8ef0d4', signBg: '#0c1b33', ry });
  // glowing console stacks beside the door
  for (const sx of [-1, 1]) {
    const pc = celMesh(new THREE.BoxGeometry(0.55, 0.7, 0.45), 0x1a1c28);
    pc.position.set(sx * 1.4, 0.35, 2.6);
    g.add(pc);
  }
  return g;
}

function warungKue({ ry = 0 } = {}) {
  return shopWithSign({ w: 6.2, d: 5, h: 3.4, color: 0xffc9de, roof: 0xff8ab8, signText: 'TOKO KUE', signFg: '#ff8ab8', signBg: '#3a0a22', ry });
}

function warungRoti({ ry = 0 } = {}) {
  return shopWithSign({ w: 6.2, d: 5, h: 3.4, color: 0xd9a754, roof: 0x8a5a33, signText: 'TOKO ROTI', signFg: '#ffe9b0', signBg: '#33210c', ry });
}

function pepStore({ ry = 0 } = {}) {
  return shopWithSign({ w: 7.4, d: 5.4, h: 3.6, color: 0x2d6df2, roof: 0xff8a3d, signText: 'PEP STORE', signFg: '#ffe9b0', signBg: '#0e2a5c', ry });
}

function cafeMegah({ ry = 0 } = {}) {
  const g = shopWithSign({ w: 8.2, d: 6.6, h: 4.6, color: 0xf5e8d2, roof: 0x8a5a33, signText: 'CAFE MEGAH', signFg: '#ffd34d', signBg: '#2d1b0c', ry });
  const awning = new THREE.Mesh(planeV(8.6, 1.4), new THREE.MeshToonMaterial({ color: 0xffffff, map: tex('checker', { size: 128, repeatX: 5, repeatY: 1 }), gradientMap: gradientMap() }));
  awning.position.set(0, 3.0, 3.4);
  awning.rotation.x = -0.35;
  g.add(awning);
  return g;
}

function dealerMobil({ ry = 0 } = {}) {
  const g = shopWithSign({ w: 10, d: 8, h: 5, color: 0xe4f0ff, roof: 0x2e6df2, signText: 'DEALER MOBIL', signFg: '#ffd34d', signBg: '#0c1f3f', ry });
  const car = makeCar({ color: 0xff5d73 });
  car.position.set(0, 0, 6.2);
  g.add(car);
  return g;
}

function makeCar({ color = 0xffd34d, ry = 0 } = {}) {
  const g = new THREE.Group();
  const body = celMesh(new THREE.BoxGeometry(2.0, 0.52, 3.4), color);
  body.position.y = 0.66;
  g.add(body);
  const cabin = celMesh(new THREE.BoxGeometry(1.7, 0.44, 1.7), color);
  cabin.position.set(0, 1.06, -0.2);
  g.add(cabin);
  const winF = new THREE.Mesh(planeV(1.5, 0.32), new THREE.MeshToonMaterial({ color: 0x303748, gradientMap: gradientMap() }));
  winF.position.set(0, 1.06, 0.66);
  g.add(winF);
  const winB = new THREE.Mesh(planeV(1.5, 0.32), new THREE.MeshToonMaterial({ color: 0x303748, gradientMap: gradientMap() }));
  winB.position.set(0, 1.06, -1.06);
  winB.rotation.y = Math.PI;
  g.add(winB);
  for (const [sx, sz] of [[-0.86, 1.1], [0.86, 1.1], [-0.86, -1.1], [0.86, -1.1]]) {
    const wheel = celMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10), 0x141628);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(sx, 0.34, sz);
    g.add(wheel);
    const hub = celMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.25, 8), 0xdfe9f5, { outline: false });
    hub.rotation.z = Math.PI / 2;
    hub.position.set(sx, 0.34, sz);
    g.add(hub);
  }
  for (const sx of [-1, 1]) {
    const hl = celMesh(new THREE.SphereGeometry(0.08, 6, 5), 0xfff6c8, { emissive: 0xffe37a, outline: false });
    hl.position.set(sx * 0.6, 0.68, 1.72);
    g.add(hl);
  }
  g.rotation.y = ry;
  return g;
}

function motorbike({ color = 0x59d0c8, ry = 0 } = {}) {
  const g = new THREE.Group();
  const frame = celMesh(new THREE.BoxGeometry(0.22, 0.16, 1.05), color);
  frame.position.y = 0.48;
  g.add(frame);
  for (const sz of [0.42, -0.42]) {
    const wheel = celMesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 10), 0x141628);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.19, sz);
    g.add(wheel);
  }
  const tank = celMesh(new THREE.BoxGeometry(0.3, 0.14, 0.3), color);
  tank.position.set(0, 0.6, -0.05);
  g.add(tank);
  const bar = celMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), 0x8a8f9c);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0.74, 0.35);
  g.add(bar);
  const head = celMesh(new THREE.SphereGeometry(0.14, 8, 6), 0xffd9b3);
  head.position.set(0, 0.92, 0.28);
  g.add(head);
  const helmet = celMesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5d73);
  helmet.position.set(0, 0.97, 0.28);
  g.add(helmet);
  g.rotation.y = ry;
  return g;
}

function trainProp() {
  const g = new THREE.Group();
  const engine = celMesh(new THREE.BoxGeometry(2.6, 1.7, 9.5), 0x2d3142);
  engine.position.set(0, 1.55, 0);
  g.add(engine);
  const cab = celMesh(new THREE.BoxGeometry(2.4, 1.1, 2.2), 0xffd34d);
  cab.position.set(0, 2.9, -2.8);
  g.add(cab);
  const chimney = celMesh(new THREE.CylinderGeometry(0.24, 0.32, 0.7, 8), 0x141628);
  chimney.position.set(0, 2.7, 2.6);
  g.add(chimney);
  for (const wx of [-1.1, 1.1]) {
    for (const wz of [-3.4, -1.2, 1.2, 3.4]) {
      const wheel = celMesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 10), 0x141628);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.5, wz);
      g.add(wheel);
    }
  }
  for (const [carIdx, dz] of [[0, -8.4], [1, -16.8]]) {
    const car = celMesh(new THREE.BoxGeometry(2.6, 1.6, 7.0), [0xffce4b, 0x59d0c8][carIdx]);
    car.position.set(0, 1.5, dz);
    g.add(car);
    for (const wx of [-1.1, 1.1]) {
      for (const wz of [dz - 2.1, dz + 2.1]) {
        const wheel = celMesh(new THREE.CylinderGeometry(0.44, 0.44, 0.26, 8), 0x141628);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.5, wz);
        g.add(wheel);
      }
    }
  }
  return g;
}

function school({ type = 'SD', ry = 0 } = {}) {
  const palette = {
    SD: { body: 0xe85d5d, accent: 0xffce4b, name: 'SD NEGERI 01' },
    SMP: { body: 0x2d6df2, accent: 0xffd34d, name: 'SMP NEGERI 02' },
    SMA: { body: 0x2f7a4d, accent: 0x8ef0d4, name: 'SMA NEGERI 03' },
  }[type] ?? { body: 0xe85d5d, accent: 0xffce4b, name: 'SEKOLAH' };
  const g = new THREE.Group();
  const base = celMesh(new THREE.BoxGeometry(11, 4.4, 5.4), palette.body);
  base.position.y = 2.2;
  g.add(base);
  const roof = celMesh(new THREE.ConeGeometry(1.0, 1.4, 4), 0x8a5a33);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(4.6, 1, 2.4);
  roof.position.y = 5.1;
  g.add(roof);
  const flagPole = celMesh(new THREE.CylinderGeometry(0.07, 0.07, 6, 6), 0xdfe9f5);
  flagPole.position.set(0, 3.0, 3.1);
  g.add(flagPole);
  const flag = new THREE.Mesh(planeV(1.4, 0.8), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradientMap() }));
  flag.position.set(0.71, 5.1, 3.09);
  g.add(flag);
  const flagTop = new THREE.Mesh(planeV(1.4, 0.4), new THREE.MeshToonMaterial({ color: 0xe23232, gradientMap: gradientMap() }));
  flagTop.position.set(0.71, 5.3, 3.09);
  g.add(flagTop);
  const sign = neonSign(palette.name, { w: 5.2, h: 0.85, bg: '#0c1b33', fg: palette.accent, border: palette.accent });
  sign.position.set(0, 3.4, 2.75);
  g.add(sign);
  g.userData.collider = { type: 'box', w: 11, d: 5.4, h: 4.4 };
  g.rotation.y = ry;
  return g;
}

function saung() {
  const g = new THREE.Group();
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const stilt = celMesh(new THREE.CylinderGeometry(0.14, 0.18, 1.5, 8), 0x8a5a33);
    stilt.position.set(sx * 1.1, 0.75, sz * 1.1);
    g.add(stilt);
  }
  const floor = celMesh(new THREE.BoxGeometry(2.7, 0.18, 2.7), 0xb58a5a, { mapId: 'wood' });
  floor.position.y = 1.5;
  g.add(floor);
  const roof = celMesh(new THREE.ConeGeometry(2.3, 1.2, 4), 0x6e4f2a);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 3.05;
  g.add(roof);
  const bench = celMesh(new THREE.BoxGeometry(1.9, 0.18, 0.4), 0xb58a5a);
  bench.position.set(0, 1.7, 0.6);
  g.add(bench);
  g.userData.collider = { type: 'cyl', r: 1.6, h: 1.7 };
  return g;
}

export const PROPS = {
  house, shop, tower, hauntedHouse, cabin, lighthouse,
  tree, pine, palm, rock, bush, lamp, bench, fountain, mailbox,
  fenceRun, stall, roadPatch, mountainCone, foamGate,
  shopWithSign, wartel, warnet, warkop, rentalPS, warungKue, warungRoti, pepStore, cafeMegah, dealerMobil, makeCar, motorbike, trainProp, school, saung, neonSign,
  ferrisWheel, carousel, coaster, gate, stairs, bridge, dock, boat,
  umbrella, campfire, caveArch, waterfall, crateStack,
};
