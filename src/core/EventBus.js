// Tiny synchronous pub/sub bus shared by every game system.
class EventBus {
  constructor() {
    this._map = new Map();
  }
  on(name, cb) {
    if (!this._map.has(name)) this._map.set(name, new Set());
    this._map.get(name).add(cb);
    return () => this.off(name, cb);
  }

  once(name, cb) {
    const off = this.on(name, (...args) => {
      off();
      cb(...args);
    });
    return off;
  }

  off(name, cb) {
    this._map.get(name)?.delete(cb);
  }

  emit(name, ...args) {
    const set = this._map.get(name);
    if (!set) return;
    for (const cb of [...set]) {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[bus] listener failed for "${name}"`, err);
      }
    }
  }
}

export { EventBus };
export const bus = new EventBus();
