// MAILBOUND entry point.
// All CSS is modular: index.css composes token / base / screen stylesheets.

import './styles/index.css';

import { startGame } from './core/Game.js';

// Boot once the DOM layers exist.
const boot = () => {
  startGame();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
