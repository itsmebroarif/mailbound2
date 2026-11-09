// UIRoot: owns the Material Design DOM overlay layer (#ui-root). Screens are
// modular builders living in ./screens/*. Ripple + click sfx are global here.

import { app } from '../core/App.js';
import { buildMainMenu } from './screens/MainMenu.js';
import { buildPause, buildSettings, buildConfirm } from './screens/Menus.js';
import { buildJournal, buildInventory, buildSkills } from './screens/Panels.js';
import { buildWorldCard, buildGameOver, buildVictory, buildCredits, buildIntroCard } from './screens/Flow.js';
import { buildWorldSelect } from './screens/WorldSelect.js';

export class UIRoot {
  constructor() {
    this.root = document.getElementById('ui-root');
    this.modalOpen = false;
    this.suppressPauseOnUnlock = false;
    this._current = null;
    this._toasts = new Set();
  }

  init() {
    if (this._inited) return;
    this._inited = true;

    // Global MD3 ripple + click sounds on buttons.
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('.md-btn, .md-list-item, .md-icon-btn');
      if (btn) {
        this._ripple(btn, e);
        const sfx = btn.dataset.sfx;
        app.audio.sfx(sfx === 'cancel' ? 'ui_cancel' : sfx === 'none' ? '_mute' : 'ui_click');
      }
    }, true);

    // Escape: toggle pause / back out of panels & confirm dialogs.
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape') return;
      if (!app.worldScene) return;
      if (!this.modalOpen) {
        this.showPause();
        return;
      }
      const cur = this._current;
      if (cur === 'pause') {
        this.closeAll();
        this.modalOpen = false;
        app.worldScene.refocus();
      } else if (cur === 'settings') {
        this.showScreen('pause');
      } else if (cur === 'confirm') {
        this.root.querySelector('[data-act="cancel"]')?.click();
      } else if (cur === 'journal' || cur === 'inventory' || cur === 'skills') {
        this.showScreen('pause');
      }
    });
  }

  _ripple(btn, e) {
    const r = btn.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 1.15;
    const span = document.createElement('span');
    span.className = 'md-ripple';
    span.style.width = span.style.height = `${d}px`;
    span.style.left = `${e.clientX - r.left - d / 2}px`;
    span.style.top = `${e.clientY - r.top - d / 2}px`;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 520);
  }

  /* ------------------------------------------------------------------ */
  /* Screen lifecycle                                                    */
  /* ------------------------------------------------------------------ */
  showScreen(name, data = {}) {
    this.closeAll(true);
    const el = this._build(name, data);
    if (!el) return;
    this.root.appendChild(el);
    this._current = name;
    this.modalOpen = true;
    // menu/dialog visible → machine cursor must appear, release pointer lock
    app.input?.releaseLock?.();
    requestAnimationFrame(() => el.classList.add('visible'));
  }

  _build(name, data) {
    switch (name) {
      case 'main-menu': return buildMainMenu(data);
      case 'world-select': return buildWorldSelect();
      case 'pause': return buildPause();
      case 'settings': return buildSettings(data);
      case 'confirm': return buildConfirm(data);
      case 'journal': return buildJournal(data);
      case 'inventory': return buildInventory(data);
      case 'skills': return buildSkills(data);
      case 'world-card': return buildWorldCard(data);
      case 'intro-card': return buildIntroCard(data);
      case 'game-over': return buildGameOver(data);
      case 'victory': return buildVictory(data);
      case 'credits': return buildCredits();
      default:
        console.warn(`[ui] unknown screen ${name}`);
        return null;
    }
  }

  closeAll(instant = false) {
    for (const child of [...this.root.children]) {
      if (child.dataset.toast != null) continue;
      child.classList.remove('visible');
      const die = () => child.remove();
      instant ? die() : setTimeout(die, 260);
    }
    this._current = null;
    this.modalOpen = false;
    // returning to the world → hide cursor, request pointer lock back
    if (app.worldScene && app.input && !instant) app.input.requestLock();
  }

  show(name, data) {
    this.showScreen(name, data);
  }

  showPause() {
    if (app.worldScene && !this.modalOpen) this.showScreen('pause');
  }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  toast(text, { icon = '✉️', title = 'MAILBOUND' } = {}) {
    const el = document.createElement('div');
    el.className = 'md-toast';
    el.dataset.toast = '1';
    el.innerHTML = `
      <div class="md-toast-icon">${icon}</div>
      <div>
        <div class="md-toast-title">${title}</div>
        <div class="md-toast-text">${text}</div>
      </div>`;
    this.root.appendChild(el);
    this._toasts.add(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => { el.remove(); this._toasts.delete(el); }, 350);
    }, 3600);
  }
}
