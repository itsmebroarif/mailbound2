// LoadingScene: branded progress bar, then hands off to the main menu.

import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Loading' });
  }

  preload() {
    // all assets procedural — just animate the bar for posterity
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barW = Math.min(420, w * 0.62);
    const x = (w - barW) / 2;
    const y = h / 2;

    this.add.text(w / 2, y - 90, 'MAILBOUND', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '64px',
      fontStyle: '800',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(w / 2, y - 30, 'Semua surat jalan sampai tujuan…', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '17px',
      color: '#cfd6ff',
    }).setOrigin(0.5);

    this.add.rectangle(w / 2, y + 28, barW + 18, 30, 0x1a1c3a).setStrokeStyle(3, 0xffffff, 0.18);
    const fill = this.add.rectangle(x, y + 28, 2, 22, 0x1565df).setOrigin(0, 0.5);

    const label = this.add.text(w / 2, y + 76, '0%', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '15px',
      color: '#cfd6ff',
    }).setOrigin(0.5);

    const progress = { v: 0 };
    this.tweens.add({
      targets: progress,
      v: 1,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        fill.displayWidth = barW * progress.v;
        label.setText(`${Math.round(progress.v * 100)}%`);
      },
      onComplete: () => {
        this.scene.start('MainMenu');
      },
    });
  }
}
