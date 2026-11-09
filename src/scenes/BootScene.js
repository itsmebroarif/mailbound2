// BootScene: initialize procedural textures & caches, then loading.

import Phaser from 'phaser';
import { tex } from '../core/AssetManager.js';
import '../render3/cel.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    // warm the procedural texture caches (generated once, reused everywhere)
    for (const id of ['grass', 'asphalt', 'sand', 'stone', 'window', 'roof', 'water', 'parkpath', 'checker', 'wood']) {
      try { tex(id, { repeatX: 8, repeatY: 8 }); }
      catch { /* ignore unknown pattern */ }
    }

    this.scene.start('Loading');
  }
}
