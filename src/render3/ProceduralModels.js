// All characters, creatures, props and vehicles are BUILT in code from Three.js
// primitives (toon material + outline). No external model files: the whole
// pipeline is procedural as decided in the architecture.

import * as THREE from 'three';
import { celMesh, celMat, gradientMap } from './cel.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------------ */
/* Courier — the player                                                */
/* ------------------------------------------------------------------ */
export function makeCourier({ scale = 1 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.86;
  root.add(body);

  const torso = celMesh(new THREE.CapsuleGeometry(0.3, 0.42, 4, 10), 0x2e6df2);
  torso.position.y = 0.16;
  body.add(torso);
  // stamp badge on chest
  const badge = celMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.045, 14), 0xffce4b);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 0.24, 0.26);
  body.add(badge);

  const head = new THREE.Group();
  head.position.y = 0.66;
  body.add(head);
  head.add(celMesh(new THREE.SphereGeometry(0.26, 14, 12), 0xffd9b3));
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  for (const x of [-0.09, 0.09]) {
    const eye = celMesh(eyeGeo, 0x141628, { outline: false });
    eye.position.set(x, 0.02, 0.23);
    head.add(eye);
  }
  // courier cap
  const cap = new THREE.Group();
  cap.position.y = 0.14;
  head.add(cap);
  cap.add(celMesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x12a5b8));
  const brim = celMesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12, 1, false, -Math.PI * 0.65, Math.PI * 1.3), 0x0d8797);
  brim.position.set(0, 0.09, 0.16);
  cap.add(brim);

  // arms (pivot at shoulders)
  const armGeo = new THREE.CapsuleGeometry(0.085, 0.3, 4, 8);
  const armL = new THREE.Group(); armL.position.set(-0.33, 0.34, 0);
  const armR = new THREE.Group(); armR.position.set(0.33, 0.34, 0);
  const armLM = celMesh(armGeo, 0x2e6df2); armLM.position.y = -0.2; armL.add(armLM);
  const armRM = celMesh(armGeo, 0x2e6df2); armRM.position.y = -0.2; armR.add(armRM);
  const handGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const handLM = celMesh(handGeo, 0xffd9b3); handLM.position.y = -0.42; armL.add(handLM);
  const handRM = celMesh(handGeo, 0xffd9b3); handRM.position.y = -0.42; armR.add(handRM);
  body.add(armL, armR);

  // legs (pivot at hips)
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.3, 4, 8);
  const legL = new THREE.Group(); legL.position.set(-0.13, -0.18, 0);
  const legR = new THREE.Group(); legR.position.set(0.13, -0.18, 0);
  const legLm = celMesh(legGeo, 0x31363f); legLm.position.y = -0.2; legL.add(legLm);
  const legRm = celMesh(legGeo, 0x31363f); legRm.position.y = -0.2; legR.add(legRm);
  const shoeGeo = new THREE.BoxGeometry(0.14, 0.09, 0.22);
  const shoeL = celMesh(shoeGeo, 0xffce4b); shoeL.position.set(0, -0.4, 0.04); legL.add(shoeL);
  const shoeR = celMesh(shoeGeo, 0xffce4b); shoeR.position.set(0, -0.4, 0.04); legR.add(shoeR);
  body.add(legL, legR);

  // mail backpack — the identifying silhouette
  const bag = new THREE.Group();
  bag.position.set(0, 0.2, -0.31);
  body.add(bag);
  bag.add(celMesh(new THREE.BoxGeometry(0.44, 0.5, 0.24), 0xffb43d));
  const flap = celMesh(new THREE.BoxGeometry(0.44, 0.2, 0.06), 0xf59e19);
  flap.position.set(0, 0.18, -0.14);
  flap.rotation.x = -0.28;
  bag.add(flap);
  const emblem = celMesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), 0xffffff);
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, 0.02, -0.14);
  bag.add(emblem);
  // straps
  for (const x of [-0.12, 0.12]) {
    const strap = celMesh(new THREE.BoxGeometry(0.05, 0.5, 0.02), 0x141628, { outline: false });
    strap.position.set(x, 0.12, 0.0);
    bag.add(strap);
  }

  // Samurai katana — the courier's signature weapon
  const blade = makeKatana();
  blade.position.set(0, -0.42, 0.06);
  armR.add(blade);

  root.scale.setScalar(scale);
  root.userData.parts = { body, head, cap, armL, armR, legL, legR, bag, blade, torso };
  return root;
}

export function makeLetterBlade() {
  const g = new THREE.Group();
  const blade = celMesh(new THREE.BoxGeometry(0.07, 0.78, 0.16), 0xdfe9f5);
  blade.position.y = 0.42;
  g.add(blade);
  const tip = celMesh(new THREE.ConeGeometry(0.09, 0.2, 4), 0xdfe9f5);
  tip.position.y = 0.9;
  tip.scale.z = 1.9;
  g.add(tip);
  const guard = celMesh(new THREE.BoxGeometry(0.2, 0.06, 0.24), 0xffce4b);
  guard.position.y = 0.03;
  g.add(guard);
  const handle = celMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 8), 0x8a5a33);
  handle.position.y = -0.09;
  g.add(handle);
  return g;
}

/* ------------------------------------------------------------------ */
/* NPCs                                                                */
/* ------------------------------------------------------------------ */
export function makeNPC({ shirt = 0xe8635f, pants = 0x4b5563, skin = 0xffd9b3, hair = 0x5b3a24, hat = null, scale = 1 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.82;
  root.add(body);

  const torso = celMesh(new THREE.CapsuleGeometry(0.28, 0.4, 4, 10), shirt);
  torso.position.y = 0.14;
  body.add(torso);

  const head = new THREE.Group();
  head.position.y = 0.62;
  body.add(head);
  head.add(celMesh(new THREE.SphereGeometry(0.25, 14, 12), skin));
  for (const x of [-0.09, 0.09]) {
    const eye = celMesh(new THREE.SphereGeometry(0.034, 6, 6), 0x141628, { outline: false });
    eye.position.set(x, 0.02, 0.22);
    head.add(eye);
  }
  const hairCap = celMesh(new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), hair);
  hairCap.position.y = 0.03;
  head.add(hairCap);
  if (hat === 'bun') {
    const bun = celMesh(new THREE.SphereGeometry(0.12, 8, 8), hair);
    bun.position.set(0, 0.28, -0.08);
    head.add(bun);
  } else if (hat === 'cap') {
    const c2 = celMesh(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xffce4b);
    c2.position.y = 0.1;
    head.add(c2);
  } else if (hat === 'straw') {
    const brim = celMesh(new THREE.CylinderGeometry(0.4, 0.42, 0.05, 14), 0xe3c077);
    brim.position.y = 0.2;
    head.add(brim);
    const top = celMesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 12), 0xe3c077);
    top.position.y = 0.28;
    head.add(top);
  }

  const armGeo = new THREE.CapsuleGeometry(0.075, 0.28, 4, 8);
  const armL = new THREE.Group(); armL.position.set(-0.31, 0.32, 0);
  const armR = new THREE.Group(); armR.position.set(0.31, 0.32, 0);
  const aL = celMesh(armGeo, shirt); aL.position.y = -0.18; armL.add(aL);
  const aR = celMesh(armGeo, shirt); aR.position.y = -0.18; armR.add(aR);
  body.add(armL, armR);

  const legGeo = new THREE.CapsuleGeometry(0.095, 0.28, 4, 8);
  const legL = new THREE.Group(); legL.position.set(-0.12, -0.16, 0);
  const legR = new THREE.Group(); legR.position.set(0.12, -0.16, 0);
  const lL = celMesh(legGeo, pants); lL.position.y = -0.19; legL.add(lL);
  const lR = celMesh(legGeo, pants); lR.position.y = -0.19; legR.add(lR);
  body.add(legL, legR);

  root.scale.setScalar(scale);
  root.userData.parts = { body, head, armL, armR, legL, legR };
  return root;
}


/* ------------------------------------------------------------------ */
/* Weapons — courier arsenal (all procedural)                           */
/* ------------------------------------------------------------------ */

export function makePistol() {
  const g = new THREE.Group();
  const frame = celMesh(new THREE.BoxGeometry(0.14, 0.11, 0.32), 0x2f3133, { outline: true });
  frame.position.set(0, 0.02, 0.08);
  g.add(frame);
  const grip = celMesh(new THREE.BoxGeometry(0.1, 0.2, 0.12), 0x6b4d2a);
  grip.position.set(0, -0.12, -0.03);
  grip.rotation.x = 0.22;
  g.add(grip);
  const barrel = celMesh(new THREE.CylinderGeometry(0.038, 0.038, 0.3, 8), 0x5b5e63);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.055, 0.36);
  g.add(barrel);
  const trigger = celMesh(new THREE.BoxGeometry(0.035, 0.06, 0.02), 0x141628);
  trigger.position.set(0, -0.03, 0.035);
  g.add(trigger);
  const sight = celMesh(new THREE.BoxGeometry(0.025, 0.03, 0.05), 0xffd34d);
  sight.position.set(0, 0.095, 0.1);
  g.add(sight);
  return g;
}

export function makeSMG() {
  const g = new THREE.Group();
  const body = celMesh(new THREE.BoxGeometry(0.15, 0.15, 0.54), 0x2b2f38);
  body.position.set(0, 0.02, 0.12);
  g.add(body);
  const suppressor = celMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 8), 0x1f2330);
  suppressor.rotation.x = Math.PI / 2;
  suppressor.position.set(0, 0.02, 0.48);
  g.add(suppressor);
  const topMount = celMesh(new THREE.BoxGeometry(0.06, 0.05, 0.16), 0xff8a3d);
  topMount.position.set(0, 0.13, 0.18);
  g.add(topMount);
  const mag = celMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 10), 0xffce4b);
  mag.position.set(0, -0.14, 0.06);
  g.add(mag);
  const grip = celMesh(new THREE.BoxGeometry(0.09, 0.16, 0.11), 0x4a5d50);
  grip.position.set(0, -0.11, -0.18);
  grip.rotation.x = 0.2;
  g.add(grip);
  return g;
}

export function makeKatana() {
  const g = new THREE.Group();
  // handle (tsuka) — dark with gold wraps
  const handle = celMesh(new THREE.CylinderGeometry(0.032, 0.036, 0.26, 8), 0x141628);
  handle.position.y = -0.06;
  g.add(handle);
  for (const y of [-0.14, -0.08, -0.02]) {
    const wrap = celMesh(new THREE.TorusGeometry(0.034, 0.008, 4, 10), 0xffce4b, { outline: false });
    wrap.position.y = y;
    wrap.rotation.x = Math.PI / 2;
    g.add(wrap);
  }
  // tsuba (guard)
  const tsuba = celMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.016, 12), 0xffce4b);
  tsuba.position.y = 0.075;
  g.add(tsuba);
  // blade (tapered)
  const blade = celMesh(new THREE.CylinderGeometry(0.005, 0.03, 0.86, 4), 0xdfe9f5);
  blade.position.y = 0.52;
  blade.scale.y = 1.05;
  blade.rotation.y = Math.PI / 4;
  g.add(blade);
  // fuller line
  const shine = celMesh(new THREE.BoxGeometry(0.006, 0.72, 0.014), 0xffffff, { outline: false });
  shine.position.y = 0.52;
  g.add(shine);
  return g;
}

export function makeRocketLauncher() {
  const g = new THREE.Group();
  // main tube
  const tube = celMesh(new THREE.CylinderGeometry(0.085, 0.085, 0.9, 12), 0x3a4a3f);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0.06, 0.3);
  g.add(tube);
  // muzzle ring (warhead visible)
  const ring = celMesh(new THREE.TorusGeometry(0.085, 0.02, 6, 16), 0xffce4b);
  ring.position.set(0, 0.06, 0.75);
  g.add(ring);
  const warhead = celMesh(new THREE.ConeGeometry(0.06, 0.1, 8), 0xff5d73, { emissive: 0x6b0e0e, outline: false });
  warhead.rotation.x = Math.PI / 2;
  warhead.position.set(0, 0.06, 0.72);
  g.add(warhead);
  // rear exhaust cone
  const rear = celMesh(new THREE.CylinderGeometry(0.11, 0.085, 0.14, 10), 0x2f3133);
  rear.rotation.x = Math.PI / 2;
  rear.position.set(0, 0.06, -0.2);
  g.add(rear);
  // sight box
  const sight = celMesh(new THREE.BoxGeometry(0.05, 0.09, 0.09), 0xffd34d);
  sight.position.set(0, 0.17, 0.25);
  g.add(sight);
  // shoulder rest
  const rest = celMesh(new THREE.BoxGeometry(0.12, 0.06, 0.1), 0x141628);
  rest.position.set(0, -0.06, -0.28);
  g.add(rest);
  return g;
}

export const WEAPON_BUILDERS = {
  pistol: makePistol,
  smg: makeSMG,
  katana: makeKatana,
  samurai: makeKatana,   // alias — WEAPONS catalog uses id 'samurai'
  launcher: makeRocketLauncher,
};

/* ------------------------------------------------------------------ */
/* Enemies                                                             */
/* ------------------------------------------------------------------ */
// arch: grunt | runner | brute | shooter | elite | beast
export function makeEnemy(arch, { primary = 0x9d4edd, secondary = 0x141628 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const parts = { body };

  const legH = arch === 'runner' ? 0.55 : 0.4;
  const legGeo = new THREE.CapsuleGeometry(arch === 'brute' ? 0.14 : 0.085, legH, 4, 8);
  const legL = new THREE.Group(); legL.position.set(-0.16, -legH * 0.45, 0);
  const legR = new THREE.Group(); legR.position.set(0.16, -legH * 0.45, 0);
  const lL = celMesh(legGeo, secondary); lL.position.y = -legH * 0.5; legL.add(lL);
  const lR = celMesh(legGeo, secondary); lR.position.y = -legH * 0.5; legR.add(lR);
  body.add(legL, legR);
  parts.legL = legL; parts.legR = legR;

  if (arch === 'brute' || arch === 'elite' || arch === 'beast') {
    body.position.y = 0.78;
  } else if (arch === 'runner') {
    body.position.y = 0.92;
  } else {
    body.position.y = 0.7;
  }

  const torso = celMesh(new THREE.CapsuleGeometry(arch === 'brute' ? 0.46 : arch === 'runner' ? 0.21 : 0.3, arch === 'runner' ? 0.5 : 0.35, 4, 10), primary);
  body.add(torso);
  parts.torso = torso;

  // head / face
  const head = new THREE.Group();
  head.position.y = arch === 'runner' ? 0.5 : 0.42;
  body.add(head);
  head.add(celMesh(new THREE.SphereGeometry(arch === 'brute' ? 0.3 : 0.24, 12, 10), secondary));
  parts.head = head;
  // glowing visor eyes
  for (const x of [-0.09, 0.09]) {
    const eye = celMesh(new THREE.SphereGeometry(0.05, 6, 6), 0xffe066, { emissive: 0xffe066, outline: false });
    eye.position.set(x, 0.03, 0.2);
    head.add(eye);
  }
  // horn
  if (arch === 'brute' || arch === 'beast' || arch === 'elite') {
    for (const sx of [-1, 1]) {
      const horn = celMesh(new THREE.ConeGeometry(0.055, 0.24, 6), 0xdfe9f5);
      horn.position.set(sx * 0.16, 0.26, 0);
      horn.rotation.z = -sx * 0.5;
      head.add(horn);
    }
  }
  if (arch === 'elite') {
    const crown = celMesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 8), 0xffce4b);
    crown.position.y = 0.3;
    head.add(crown);
    const cape = celMesh(new THREE.BoxGeometry(0.5, 0.8, 0.05), 0xff5d73);
    cape.position.set(0, 0.05, -0.36);
    cape.rotation.x = 0.1;
    body.add(cape);
  }

  // arms
  const armLen = arch === 'brute' || arch === 'elite' ? 0.36 : 0.24;
  const armGeo = new THREE.CapsuleGeometry(arch === 'brute' ? 0.13 : 0.08, armLen, 4, 8);
  const armL = new THREE.Group(); armL.position.set(arch === 'brute' ? -0.5 : -0.32, 0.25, 0);
  const armR = new THREE.Group(); armR.position.set(arch === 'brute' ? 0.5 : 0.32, 0.25, 0);
  const mLeft = celMesh(armGeo, secondary); mLeft.position.y = -(armLen * 0.55 + armGeo.parameters.radius); armL.add(mLeft);
  const mRight = celMesh(armGeo, secondary); mRight.position.y = -(armLen * 0.55 + armGeo.parameters.radius); armR.add(mRight);
  body.add(armL, armR);
  parts.armL = armL; parts.armR = armR;

  if (arch === 'shooter') {
    const cannon = celMesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8), 0x5b6273);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 0.18, 0.42);
    body.add(cannon);
    parts.cannon = cannon;
  }
  if (arch === 'runner') {
    for (const sx of [-1, 1]) { // goggles
      const lens = celMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), 0x5ec8ff, { emissive: 0x5ec8ff });
      lens.rotation.x = Math.PI / 2;
      lens.position.set(sx * 0.1, 0.1, 0.22);
      head.add(lens);
    }
  }
  root.userData.parts = parts;
  return root;
}

/* ------------------------------------------------------------------ */
/* UYEHH — the jelly slime boss                                        */
/* ------------------------------------------------------------------ */
export function makeSlime() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.72;
  root.add(body);

  const jelly = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 14),
    new THREE.MeshToonMaterial({
      color: 0x59d0c8,
      transparent: true,
      opacity: 0.82,
      gradientMap,
    }),
  );
  jelly.scale.set(1, 0.78, 1);
  body.add(jelly);
  // jelly outline (thicker)
  const outline = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), new THREE.MeshBasicMaterial({
    color: 0x0e6f68,
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide,
  }));
  outline.scale.set(1.07, 0.85, 1.07);
  body.add(outline);

  // goo core
  const core = celMesh(new THREE.SphereGeometry(0.42, 12, 10), 0x2fbdb2, { opacity: 0.94 });
  core.position.y = -0.14;
  body.add(core);

  // face — big sparkling eyes + blush + wide mouth
  const face = new THREE.Group();
  face.position.set(0, 0.12, 0.86);
  body.add(face);
  const mkEye = (sx) => {
    const g = new THREE.Group();
    g.position.set(sx * 0.28, 0.1, 0);
    const white = celMesh(new THREE.SphereGeometry(0.17, 10, 8), 0xffffff, { outline: false });
    g.add(white);
    const pupil = celMesh(new THREE.SphereGeometry(0.08, 8, 6), 0x141628, { outline: false });
    pupil.position.z = 0.1;
    g.add(pupil);
    const shine = celMesh(new THREE.SphereGeometry(0.03, 6, 4), 0xffffff, { outline: false });
    shine.position.set(0.04, 0.06, 0.16);
    g.add(shine);
    return g;
  };
  const eyeL = mkEye(-1);
  const eyeR = mkEye(1);
  face.add(eyeL, eyeR);
  const blushL = celMesh(new THREE.SphereGeometry(0.09, 8, 6), 0xff9e9e, { outline: false, opacity: 0.75 });
  blushL.scale.set(1, 0.6, 0.4);
  blushL.position.set(-0.5, -0.08, 0.05);
  const blushR = blushL.clone();
  blushR.position.x = 0.5;
  face.add(blushL, blushR);
  // mouth: happy arc (torus segment), swapped to angry in BossSlime
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.035, 6, 14, Math.PI),
    celMat(0x141628),
  );
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.1, 0.02);
  face.add(mouth);

  // goo droplets on top
  for (let i = 0; i < 5; i++) {
    const drop = celMesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 8, 6), 0x59d0c8, { opacity: 0.9 });
    const a = (i / 5) * Math.PI * 2;
    drop.position.set(Math.cos(a) * 0.55, 0.78, Math.sin(a) * 0.55);
    body.add(drop);
  }

  // belly stamp (boss weak point, glows when vulnerable)
  const stamp = new THREE.Group();
  stamp.position.set(0, -0.32, 0.82);
  stamp.scale.setScalar(0.001);
  body.add(stamp);
  const stampDisk = celMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), 0xff5d73, { emissive: 0xff5d73 });
  stampDisk.rotation.x = Math.PI / 2;
  stamp.add(stampDisk);
  const star = celMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 5), 0xffce4b, { emissive: 0xffce4b });
  star.rotation.x = Math.PI / 2;
  star.position.z = 0.02;
  stamp.add(star);

  root.userData.parts = { body, jelly, core, face, eyeL, eyeR, mouth, stamp, blushL, blushR };
  return root;
}

/* ------------------------------------------------------------------ */
/* Vehicles & small items                                              */
/* ------------------------------------------------------------------ */
export function makeJet() {
  const root = new THREE.Group();

  const fuselage = celMesh(new THREE.CapsuleGeometry(0.85, 4.4, 6, 12), 0xf2f4f8);
  fuselage.rotation.z = Math.PI / 2;
  root.add(fuselage);

  const stripe = celMesh(new THREE.CylinderGeometry(0.86, 0.86, 1.4, 12, 1, true), 0xffb43d, { outline: false });
  stripe.rotation.z = Math.PI / 2;
  stripe.position.x = 1.1;
  root.add(stripe);

  // cockpit canopy
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshToonMaterial({ color: 0x6fd3ff, transparent: true, opacity: 0.8 }),
  );
  canopy.scale.set(1.15, 0.65, 1);
  canopy.position.set(1.6, 0.32, 0);
  root.add(canopy);

  // wings
  const wingGeo = new THREE.BoxGeometry(1.5, 0.12, 2.3);
  for (const sx of [-1, 1]) {
    const wing = celMesh(wingGeo, 0xdfe9f5);
    wing.position.set(-0.2, -0.1, sx * 1.9);
    wing.rotation.x = sx * 0.18;
    root.add(wing);
    const tip = celMesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), 0xffb43d);
    tip.position.set(-0.05, 0.1, sx * 3.0);
    root.add(tip);
    // engine nacelle
    const eng = celMesh(new THREE.CylinderGeometry(0.34, 0.42, 1.5, 10), 0x5b6273);
    eng.rotation.z = Math.PI / 2;
    eng.position.set(-2.1, -0.2, sx * 1.35);
    root.add(eng);
    const glow = celMesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 10), 0xff9e4a, { emissive: 0xff9e4a, outline: false });
    glow.rotation.z = Math.PI / 2;
    glow.position.set(-2.9, -0.2, sx * 1.35);
    root.add(glow);
  }

  // tail
  const fin = celMesh(new THREE.BoxGeometry(0.9, 1.5, 0.12), 0xff5d73);
  fin.position.set(-2.4, 0.9, 0);
  root.add(fin);
  for (const sx of [-1, 1]) {
    const stab = celMesh(new THREE.BoxGeometry(0.6, 0.1, 0.9), 0xdfe9f5);
    stab.position.set(-2.5, 0.25, sx * 0.66);
    root.add(stab);
  }

  // landing gear
  const gear = new THREE.Group();
  gear.name = 'gear';
  const strutGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8);
  const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.2, 12);
  for (const [poss] of [[V3(1.8, -1.0, 0)], [V3(-0.9, -1.0, -0.9)], [V3(-0.9, -1.0, 0.9)]]) {
    const strut = celMesh(strutGeo, 0x8a8f9c);
    strut.position.copy(poss);
    gear.add(strut);
    const wheel = celMesh(wheelGeo, 0x31363f);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.copy(poss).add(V3(0, -0.35, 0));
    gear.add(wheel);
  }
  root.add(gear);

  // exhaust glow anchors
  root.userData.exhaust = [V3(-3.0, -0.2, 1.35), V3(-3.0, -0.2, -1.35)];
  root.userData.parts = { gear };
  return root;
}

export function makeParcel({ color = 0xe8a33f } = {}) {
  const g = new THREE.Group();
  g.add(celMesh(new THREE.BoxGeometry(0.34, 0.3, 0.3), color));
  const tape = celMesh(new THREE.BoxGeometry(0.36, 0.31, 0.06), 0xd9a1ff, { outline: false });
  g.add(tape);
  return g;
}

export function makeStamp() {
  const g = new THREE.Group();
  const disc = celMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 5), 0xffce4b, { emissive: 0x8a6a10 });
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  const star = celMesh(new THREE.SphereGeometry(0.12, 8, 6), 0xfff3d0, { outline: false, emissive: 0xffd88a });
  star.position.z = 0.06;
  g.add(star);
  return g;
}

export function makeOrb(kind) {
  const color = kind === 'coin' ? 0xffd34d : kind === 'heart' ? 0xff5d73 : 0x6ee7a0;
  return celMesh(new THREE.SphereGeometry(0.17, 8, 6), color, { emissive: color });
}
