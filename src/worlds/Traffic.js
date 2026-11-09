// TrafficSystem — menggerakkan mobil, motor, dan kereta pajangan di sepanjang
// rute garis lurus. Sepenuhnya visual (tanpa collider) supaya dunia terasa hidup.

import * as THREE from 'three';
import { PROPS } from '../render3/Props.js';
import { app } from '../core/App.js';

export class TrafficSystem {
  constructor(worldScene, routes = []) {
    this.scene = worldScene;
    this.entries = [];
    for (const route of routes) {
      const count = route.count ?? 1;
      for (let i = 0; i < count; i += 1) {
        const t = (i + 0.5) / count; // evenly spaced along the route
        this.entries.push(this._spawn(route, t));
      }
    }
  }

  _spawn(route, t) {
    const x = route.x1 + (route.x2 - route.x1) * t;
    const z = route.z1 + (route.z2 - route.z1) * t;
    const colors = route.colors ?? [0xffd34d];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let mesh;
    let kind = route.kind;
    if (kind === 'bike') mesh = PROPS.motorbike({ color });
    else if (kind === 'train') mesh = PROPS.trainProp();
    else mesh = PROPS.makeCar({ color });

    const dx = route.x2 - route.x1;
    const dz = route.z2 - route.z1;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    mesh.position.set(x, kind === 'train' ? -0.2 : 0.05, z);
    mesh.rotation.y = yaw;
    this.scene.worldBase.scene.add(mesh);

    return {
      route,
      kind,
      mesh,
      dir: 1,
      yaw,
      len,
      speed: route.speed ?? 10,
      every: route.every ?? Infinity,
      clock: Math.random() * 6,   // desync trains
      tParam: t,
      hornPlayed: false,
    };
  }

  update(dt) {
    for (const e of this.entries) {
      const r = e.route;
      if (e.kind === 'train') {
        e.clock += dt;
        // train passes on a schedule, then rests off-map
        const period = e.every ?? 18;
        const cycle = e.clock % (period + e.len / e.speed);
        const moving = cycle < e.len / e.speed;
        if (moving) {
          e.mesh.position.x = r.x1 + e.dir * (cycle * e.speed);
          if (!e.hornPlayed && cycle * e.speed > e.len * 0.35) {
            e.hornPlayed = true;
            app.audio.sfx('train_horn');
          }
        } else {
          e.mesh.position.x = r.x1 + e.dir * (e.len + 30);
          if (cycle > e.len / e.speed + period) {
            e.hornPlayed = false;
            e.clock = 0;
            e.hornPlayed = false;
          }
        }
        continue;
      }

      // ground vehicles ping-pong along the straight route
      e.tParam += (dt * e.speed * e.dir) / e.len;
      if (e.tParam >= 1) {
        e.tParam = 1 - (e.tParam - 1);
        e.dir = -1;
        e.mesh.rotation.y = e.yaw + Math.PI;
      } else if (e.tParam <= 0) {
        e.tParam = -e.tParam;
        e.dir = 1;
        e.mesh.rotation.y = e.yaw;
      }
      e.mesh.position.set(
        r.x1 + (r.x2 - r.x1) * e.tParam,
        e.kind === 'bike' ? 0.05 + (Math.random() - 0.5) * 0.01 : 0.03,
        r.z1 + (r.z2 - r.z1) * e.tParam,
      );
    }
  }

  dispose() {
    for (const e of this.entries) {
      e.mesh.removeFromParent();
    }
    this.entries = [];
  }
}
