// InputManager: document-level keyboard + mouse + pointer-lock plumbing.
// Owns the Shift tap-dash / hold-sprint distinction with a configurable
// threshold, plus edge-triggered key buffers consumed once per frame.

import { app } from '../core/App.js';
import { CONFIG } from '../core/Constants.js';

export class InputManager {
  constructor() {
    this._down = new Set();
    this._pressedThisFrame = new Set();
    this._frameConsumed = false;

    this.mouseLeftEdge = 0;    // >0 once per click
    this.mouseRightEdge = 0;
    this.mouseLeftDown = false;
    this.mouseRightDown = false;
    this.wheelDelta = 0;
    this._dragging = false;
    this.lookDX = 0;
    this.lookDY = 0;
    this.pointerLocked = false;

    this._shiftDownT = 0;
    this.sprint = false;
    this.dashQueued = 0;       // >0 = queued dash consume
  }

  attach() {
    if (this._attached) return;
    this._attached = true;

    this._kd = (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (!this._down.has(e.code)) {
        this._down.add(e.code);
        this._pressedThisFrame.add(e.code);
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this._shiftDownT = performance.now();
      }
    };
    this._ku = (e) => {
      this._down.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const held = (performance.now() - this._shiftDownT) / 1000;
        if (held < CONFIG.shiftHold) this.dashQueued = performance.now();
        this.sprint = false;
      }
    };
    this._md = (e) => {
      if (e.button === 0) {
        if (this.pointerLocked) {
          this.mouseLeftEdge = performance.now();
          this.mouseLeftDown = true;
          return;
        }
        // Don't hijack clicks that belong to UI (menus, dialogs, buttons).
        const target = e.target;
        if (target && target.closest && target.closest('#ui-root')) {
          return;
        }
        this._dragging = true;
        this.requestLock();
        this.mouseLeftEdge = performance.now();
        this.mouseLeftDown = true;
      } else if (e.button === 2) {
        this.mouseRightDown = true;
        if (this.pointerLocked) this.mouseRightEdge = performance.now();
      }
    };
    this._mu = (e) => {
      if (e.button === 0) { this._dragging = false; this.mouseLeftDown = false; }
      else if (e.button === 2) this.mouseRightDown = false;
    };
    this._wheel = (e) => {
      this.wheelDelta = (this.wheelDelta ?? 0) + e.deltaY;
    };
    this._mm = (e) => {
      if (this.pointerLocked || this._dragging) {
        this.lookDX += e.movementX || 0;
        this.lookDY += e.movementY || 0;
      }
    };
    this._plc = () => {
      this.pointerLocked = document.pointerLockElement === app.renderer.domElement;
      app.bus.emit('pointer-lock', this.pointerLocked);
      if (!this.pointerLocked && app.worldScene && !app.ui.modalOpen && !app.ui.suppressPauseOnUnlock) {
        // exiting pointer lock outside a menu → open the pause menu
        app.ui.showPause();
      }
      app.ui.suppressPauseOnUnlock = false;
    };
    this._ctx = (e) => e.preventDefault();

    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup', this._ku);
    document.addEventListener('mousedown', this._md);
    document.addEventListener('mouseup', this._mu);
    document.addEventListener('mousemove', this._mm);
    document.addEventListener('pointerlockchange', this._plc);
    document.addEventListener('contextmenu', this._ctx);
    document.addEventListener('wheel', this._wheel, { passive: true });
  }

  detach() {
    if (!this._attached) return;
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup', this._ku);
    document.removeEventListener('mousedown', this._md);
    document.removeEventListener('mouseup', this._mu);
    document.removeEventListener('mousemove', this._mm);
    document.removeEventListener('pointerlockchange', this._plc);
    document.removeEventListener('contextmenu', this._ctx);
    document.removeEventListener('wheel', this._wheel);
    this._attached = false;
  }

  requestLock() {
    const el = app.renderer?.domElement;
    if (el && !this.pointerLocked && document.pointerLockElement !== el) {
      try {
        const p = el.requestPointerLock();
        p?.catch?.((err) => console.debug('[input] pointer lock not granted', err?.message ?? err));
      } catch { /* headless / unfocused tab */ }
    }
  }

  releaseLock() {
    app.ui.suppressPauseOnUnlock = app.ui.modalOpen === true;
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  isDown(code) {
    return this._down.has(code);
  }

  pressed(code) {
    return this._pressedThisFrame.has(code);
  }

  takeLook() {
    const dx = this.lookDX;
    const dy = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    return { dx, dy };
  }

  takeClickLeft() {
    if (this.mouseLeftEdge) {
      this.mouseLeftEdge = 0;
      return true;
    }
    return false;
  }

  takeClickRight() {
    if (this.mouseRightEdge) {
      this.mouseRightEdge = 0;
      return true;
    }
    return false;
  }

  takeDash() {
    if (this.dashQueued) {
      this.dashQueued = 0;
      return true;
    }
    return false;
  }

  endFrame() {
    this._pressedThisFrame.clear();
  }

  // called each world-scene tick: throttling of the sprint state
  update() {
    const shift = this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    if (!shift) this.sprint = false;
  }
}

// Axis helpers ---------------------------------------------------------
export function axisX() {
  const input = app.input;
  return (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
}

export function axisY() {
  const input = app.input;
  return (input.isDown('KeyS') ? 1 : 0) - (input.isDown('KeyW') ? 1 : 0);
}
