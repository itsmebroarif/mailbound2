// Enemy finite state machine: idle → patrol → alert → chase → windup →
// attack → recover. Lateral states: stagger → dead.

export const STATE = {
  IDLE: 'idle',
  PATROL: 'patrol',
  ALERT: 'alert',
  CHASE: 'chase',
  WINDUP: 'windup',
  ATTACK: 'attack',
  RECOVER: 'recover',
  STAGGER: 'stagger',
  DEAD: 'dead',
};

export class EnemyAI {
  constructor(enemy) {
    this.e = enemy;
    this.state = STATE.IDLE;
    this.t = 0;
    this.idleT = 0.6 + Math.random() * 1.8;
    this.patrolTarget = null;
    this.alertRange = 11 + Math.random() * 4;
    this.eyeDot = Math.cos(Math.PI * 0.42); // ~75° cone
    this.attackCd = 0;
  }

  setState(s) {
    if (this.state === STATE.DEAD && s !== STATE.DEAD) return;
    this.state = s;
    this.t = 0;
    this.e.attackStateT = 0;
  }

  stagger() {
    if (this.state === STATE.DEAD) return;
    this.setState(STATE.STAGGER);
  }

  update(dt, ctx) {
    const e = this.e;
    const player = ctx.player;
    this.t += dt;
    if (this.attackCd > 0) this.attackCd -= dt;

    const toPlayer = {
      x: player.pos.x - e.pos.x,
      z: player.pos.z - e.pos.z,
    };
    const dist = Math.hypot(toPlayer.x, toPlayer.z);
    const facing = { x: Math.sin(e.facing), z: Math.cos(e.facing) };
    const dot = facing.x * (player.pos.x - e.pos.x) + facing.z * (player.pos.z - e.pos.z);

    switch (this.state) {
      case STATE.IDLE: {
        this.idleT -= dt;
        if (this._canSee(dist, dot)) return this.setState(STATE.ALERT);
        if (this.idleT <= 0) {
          // wander inside home radius
          this.patrolTarget = {
            x: e.homePos.x + (Math.random() - 0.5) * e.patrolRadius * 2,
            z: e.homePos.z + (Math.random() - 0.5) * e.patrolRadius * 2,
          };
          this.setState(STATE.PATROL);
        }
        break;
      }
      case STATE.PATROL: {
        if (this._canSee(dist, dot)) return this.setState(STATE.ALERT);
        const done = this._walkToward(this.patrolTarget.x, this.patrolTarget.z, dt, e.speed * 0.55);
        if (done) this.setState(STATE.IDLE);
        break;
      }
      case STATE.ALERT: {
        this._face(player.pos.x, player.pos.z, dt, 7);
        if (this.t > 0.42) this.setState(STATE.CHASE);
        break;
      }
      case STATE.CHASE: {
        this._face(player.pos.x, player.pos.z, dt, 9);
        const spacing = e.arch === 'shooter' ? 8 : (e.arch === 'brute' || e.arch === 'elite' ? 1.9 : 1.5);
        if (dist > spacing * 0.7) {
          if (e.arch === 'shooter') {
            // keep distance: advance if far, back off if too close
            const toward = dist > spacing ? 1 : -0.6;
            this._moveAlong(toPlayer.x, toPlayer.z, dt, e.speed * toward);
          } else {
            this._walkToward(player.pos.x, player.pos.z, dt, e.speed);
          }
        } else {
          this._moveAlong(0, 0, dt, 0); // stop & strafe pause
        }
        const inRange = e.arch === 'shooter' ? dist < 13 : dist < e.attackRange;
        if (inRange && this.attackCd <= 0) return this.setState(STATE.WINDUP);
        if (this._playerBackToHome(dist)) this.setState(STATE.PATROL);
        break;
      }
      case STATE.WINDUP: {
        e.phaseT = this.t;
        this._face(player.pos.x, player.pos.z, dt, 5);
        if (this.t >= (e.arch === 'brute' ? 0.62 : 0.35)) {
          this.setState(STATE.ATTACK);
          e.attackHitDone = false;
        }
        break;
      }
      case STATE.ATTACK: {
        if (!e.attackHitDone) {
          e.attackHitDone = true;
          ctx.onAttack(e); // dealt with by EnemyManager
          this.attackCd = e.attackCd;
        }
        if (this.t > 0.3) this.setState(STATE.RECOVER);
        break;
      }
      case STATE.RECOVER: {
        if (this.t > 0.7) this.setState(STATE.CHASE);
        break;
      }
      case STATE.STAGGER: {
        if (this.t > 0.34) this.setState(STATE.CHASE);
        break;
      }
      case STATE.DEAD: break;
    }

    // facing follows target during windup/attack so telegraphs read well
    if (this.state === STATE.WINDUP || this.state === STATE.ATTACK) {
      e.facing = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
    }
  }

  _canSee(dist, dot) {
    return dist < this.alertRange && dot > this.eyeDot;
  }

  _playerBackToHome(distToPlayer) {
    const d = Math.hypot(this.e.homePos.x - this.e.pos.x, this.e.homePos.z - this.e.pos.z);
    if (d > this.e.leashRadius) return true;
    return false;
  }

  _face(tx, tz, dt, rate) {
    const want = Math.atan2(tx - this.e.pos.x, tz - this.e.pos.z);
    this.e.facing = lerpAngle(this.e.facing, want, Math.min(1, dt * rate));
  }

  _walkToward(tx, tz, dt, speed) {
    const dx = tx - this.e.pos.x;
    const dz = tz - this.e.pos.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.5) return true;
    this._moveAlong(dx, dz, dt, speed);
    this.e.facing = Math.atan2(dx, dz);
    return false;
  }

  _moveAlong(dx, dz, dt, sign) {
    const len = Math.hypot(dx, dz);
    if (len > 1e-5) {
      this.e.vel.x += (dx / len) * sign * 24 * dt;
      this.e.vel.z += (dz / len) * sign * 24 * dt;
    }
  }
}

export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
