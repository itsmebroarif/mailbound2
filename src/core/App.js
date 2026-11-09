// The App singleton: every manager lives here and is imported everywhere else.
// IMPORTANT: modules must only touch `app` inside functions/constructors that run
// after setupApp() — never in module top-level code (live bindings make this safe).

import { bus } from './EventBus.js';
import { GAME_VERSION } from './Constants.js';

import { InputManager } from '../systems/InputManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { Renderer3D } from '../render3/Renderer3D.js';
import { UIRoot } from '../ui/UIRoot.js';
import { Cursor } from '../ui/cursor/Cursor.js';

export const app = {
  version: GAME_VERSION,
  bus: null,          // set in setupApp
  game: null,         // Phaser.Game
  input: null,        // InputManager
  audio: null,        // AudioManager (SFX + MusicEngine + ambience)
  save: null,         // SaveManager
  renderer: null,     // Renderer3D (Three.js)
  ui: null,           // UIRoot (Material Design DOM overlays)
  worldScene: null,   // active WorldScene (HUD + systems read this)
  pendingTransition: null, // world card data for the transition overlay
};

export function setupApp() {
  app.bus = bus;
  app.renderer = new Renderer3D();
  app.input = new InputManager();
  app.audio = new AudioManager();
  app.save = new SaveManager();
  app.ui = new UIRoot();
  app.cursor = new Cursor();
  app.input.attach();
  return app;
}
