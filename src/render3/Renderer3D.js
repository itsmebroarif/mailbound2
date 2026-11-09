// The Three.js renderer host. Owns the WebGL canvas that sits UNDER the Phaser
// canvas. Phaser drives the loop; whoever owns the active frame calls setActive
// (scene, camera) and then app.renderer.render() each tick.

import * as THREE from "three";

export class Renderer3D {
  constructor() {
    this.host = document.getElementById("three-root");
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x0e1030, 1);
    this.setSize(window.innerWidth, window.innerHeight);
    this.host.appendChild(this.renderer.domElement);

    this.scene = null;
    this.camera = null;
    this.quality = "medium";
    this.setQuality(this.quality);

    this._onResize = () => {
      this.setSize(window.innerWidth, window.innerHeight);
      if (this.camera) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      }
    };
    window.addEventListener("resize", this._onResize);
  }

  get domElement() {
    return this.renderer.domElement;
  }

  setSize(w, h) {
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
  }

  makeCamera(fov = 58, near = 0.1, far = 720) {
    return new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far,
    );
  }

  setActive(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    if (camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  }

  render() {
    if (this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (err) {
        console.error("[renderer3] render failed", err);
        this.scene = null; // stop error spam; a shutdown/new set will restore
      }
    }
  }

  setQuality(q) {
    this.quality = q;
    const dpr = window.devicePixelRatio || 1;
    const ratio =
      q === "low"
        ? 0.75
        : q === "high"
          ? Math.min(dpr, 2)
          : Math.min(dpr, 1.25);
    this.renderer.setPixelRatio(ratio);
  }

  // Deep-dispose a scene's GPU resources on world shutdown (memory hygiene).
  disposeScene(scene) {
    if (!scene) return;
    const dis = (obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const mats = Array.isArray(obj.material)
        ? obj.material
        : obj.material
          ? [obj.material]
          : [];
      for (const m of mats) {
        for (const key of ["map", "gradientMap", "alphaMap"]) {
          if (m[key] && m[key].dispose) m[key].dispose();
        }
        m.dispose?.();
      }
    };
    scene.traverse(dis);
  }
}
