// Cursor — MD3-styled custom cursor for the whole app.
// A yellow-cream dot wrapped in an amber ring (courier-branded); the ring
// widens and recolors on interactive elements, compresses on mouse-down,
// and disappears while the world pointer-lock is engaged (no cursor in FPS mode).
// Hidden on coarse-pointer (touch) devices.

export class Cursor {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'mb-cursor';
    this.root.innerHTML = `
      <span class="mb-cursor-ring"></span>
      <span class="mb-cursor-dot"></span>
    `;
    this._x = window.innerWidth / 2;
    this._y = window.innerHeight / 2;
    this._tx = this._x;
    this._ty = this._y;
    this._visible = true;
    this._locked = false;
    this._hover = false;
    this._down = false;
    this._enabled = matchMedia('(pointer: fine)').matches;
    this._reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.appendChild(this.root);
    this._bind();
    this._loop();
    this.render();
  }

  _bind() {
    document.addEventListener('mousemove', (e) => {
      this._tx = e.clientX;
      this._ty = e.clientY;
      // hover target detection (cheap)
      const t = e.target;
      this._hover = !!(t && (t.closest?.('button, a, input, select, [role="button"], .md-btn, .dlg-choice, .md-icon-btn, [data-cursor]')));
      this.render();
    }, { passive: true });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) { this._down = true; this.render(); }
    });
    document.addEventListener('mouseup', () => {
      this._down = false;
      this.render();
    });

    document.addEventListener('pointerlockchange', () => {
      this._locked = !!document.pointerLockElement;
      this.render();
    });

    document.addEventListener('mouseleave', () => {
      this._visible = false;
      this.render();
    });
    document.addEventListener('mouseenter', () => {
      this._visible = true;
      this.render();
    });
  }

  _loop() {
    requestAnimationFrame(() => {
      const k = this._reduceMotion ? 1 : 0.22;
      this._x += (this._tx - this._x) * k;
      this._y += (this._ty - this._y) * k;
      this.root.style.transform = `translate(${this._x}px, ${this._y}px)`;
      this._loop();
    });
  }

  render() {
    const cls = ['mb-cursor'];
    if (!this._enabled || !this._visible || this._locked) cls.push('is-hidden');
    if (this._hover) cls.push('is-hover');
    if (this._down) cls.push('is-down');
    this.root.className = cls.join(' ');
  }

  destroy() {
    this.root.remove();
  }
}
