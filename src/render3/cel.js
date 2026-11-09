// FULL-OUTLINED TOON LOOK:
//  - MeshToonMaterial with a banded gradientMap (cel shading)
//  - every mesh gets an "inverted hull" outline child (BackSide shader that
//    pushes vertices along their view-space normals)

import * as THREE from 'three';
import { tex } from '../core/AssetManager.js';

export const OUTLINE_COLOR = 0x141628;

const _gradientMapCache = { value: null };
const _outlineMatCache = new Map();
const _celMatCache = new Map();

export function gradientMap() {
  if (!_gradientMapCache.value) {
    const bands = new Uint8Array([70, 115, 160, 215, 255]);
    const t = new THREE.DataTexture(bands, bands.length, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    _gradientMapCache.value = t;
  }
  return _gradientMapCache.value;
}

function outlineMaterial(thickness = 0.045) {
  const key = Math.round(thickness * 1000);
  if (_outlineMatCache.has(key)) return _outlineMatCache.get(key);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(OUTLINE_COLOR) },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * (mv + vec4(n, 0.0) * uThickness * 0.01);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() { gl_FragColor = vec4(uColor, 1.0); }
    `,
    side: THREE.BackSide,
  });
  _outlineMatCache.set(key, mat);
  return mat;
}

// Shared cel material cache (color + optional texture id).
export function celMat(color, { mapId, opacity = 1, emissive = 0x000000 } = {}) {
  const key = `${color}|${mapId ?? ''}|${opacity}|${emissive}`;
  if (_celMatCache.has(key)) return _celMatCache.get(key);
  const params = { color, gradientMap: gradientMap() };
  if (mapId) params.map = tex(mapId);
  if (emissive) {
    params.emissive = new THREE.Color(emissive);
    params.emissiveIntensity = 0.55;
  }
  const mat = new THREE.MeshToonMaterial(params);
  if (opacity < 1) {
    mat.transparent = true;
    mat.opacity = opacity;
  }
  _celMatCache.set(key, mat);
  return mat;
}

/**
 * Build a cel-shaded mesh with an outline child.
 * opts: { outline: true|false, thickness: number, mapId, opacity, emissive }
 * The outline shares the geometry and follows all transforms of its parent.
 */
export function celMesh(geometry, color, opts = {}) {
  const mesh = new THREE.Mesh(geometry, celMat(color, opts));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.cel = true;
  if (opts.outline !== false) {
    const ol = new THREE.Mesh(geometry, outlineMaterial(opts.thickness ?? 0.045));
    ol.userData.isOutline = true;
    if (opts.opacity !== undefined && opts.opacity < 1) ol.renderOrder = 1;
    mesh.add(ol);
  }
  return mesh;
}

// Add an outline child to an already-constructed mesh/group of meshes.
export function outlineAll(obj, thickness = 0.05) {
  obj?.traverse?.((child) => {
    if (child.isMesh && !child.userData.isOutline && child.userData.cel) {
      if (!child.children.some((c) => c.userData.isOutline)) {
        const ol = new THREE.Mesh(child.geometry, outlineMaterial(thickness));
        ol.userData.isOutline = true;
        child.add(ol);
      }
    }
  });
}

/**
 * Standard toon lighting rig: warm sun + cool fill.
 * Returns { sun, hemi } so worlds can animate them (dusk, sunset…).
 */
export function celLights(scene, {
  sunIntensity = 1.0,
  hemiIntensity = 0.65,
  sky = 0xbfe3ff,
  ground = 0x8a7a58,
  sunColor = 0xfff2d6,
  sunPos = [30, 60, 20],
} = {}) {
  const hemi = new THREE.HemisphereLight(sky, ground, hemiIntensity);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
  sun.position.set(...sunPos);
  scene.add(sun);
  return { sun, hemi };
}
