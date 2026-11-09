// Phaser bootstrap. Phaser is the primary engine: it owns the game loop, scene
// orchestration and the HUD canvas. Three.js renders the actual 3D world into a
// dedicated canvas underneath (see render3/Renderer3D.js).

import Phaser from "phaser";
import { setupApp, app } from "./App.js";
import { BootScene } from "../scenes/BootScene.js";
import { LoadingScene } from "../scenes/LoadingScene.js";
import { MainMenuScene } from "../scenes/MainMenuScene.js";
import { WorldScene } from "../scenes/WorldScene.js";
import { HUDScene } from "../scenes/HUDScene.js";
import { TransitionScene } from "../scenes/TransitionScene.js";
import { CutsceneScene } from "../scenes/CutsceneScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-root",
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true, // Three canvas shows through (z-index below Phaser)
  disableContextMenu: true, // RMB is lock-on
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    LoadingScene,
    MainMenuScene,
    WorldScene,
    HUDScene,
    TransitionScene,
    CutsceneScene,
  ],
};

export function startGame() {
  setupApp();
  app.ui.init();
  // Tiny global handle for debugging/automation smoke tests (not for players).
  if (typeof window !== 'undefined') window.MB = { app };

  // Global error surfacing (kept in console; UI crashes must not go silent).
  window.addEventListener("error", (e) =>
    console.error("[mailbound:error]", e?.message, e?.error),
  );

  app.game = new Phaser.Game(config);
}
