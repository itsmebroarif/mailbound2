// Tunable, shared gameplay constants. Everything gameplay-tuning related lives here.

export const GAME_VERSION = '0.1.0';
export const SAVE_KEY = 'mailbound-save-v2';
export const SETTINGS_KEY = 'mailbound-settings-v1';

export const WORLD_ORDER = ['w1', 'w2', 'w3', 'w4', 'w5'];

export const WORLD_META = {
  w1: { name: 'Distrik Perumahan', subtitle: 'Tempat setiap surat bermula', music: 'w1' },
  w2: { name: 'Metropolis', subtitle: 'Naik, lari, antar. Ulang.', music: 'w2' },
  w3: { name: 'Taman Bermain', subtitle: 'Gerbangnya tak pernah benar-benar tertutup', music: 'w3' },
  w4: { name: 'Hutan Liar', subtitle: 'Dengarkan sungainya', music: 'w4' },
  w5: { name: 'Pantai Surga', subtitle: 'Ada sesuatu besar yang semakin dekat', music: 'w5' },
};

export const CONFIG = {
  // ---- Player movement -------------------------------------------------
  walk: 4.4,
  sprint: 7.1,
  accel: 46,
  friction: 11,
  airAccel: 18,
  gravity: 23,
  jumpV: 8.6,
  stepH: 0.56,        // max auto step-up (makes staircase props climbable)
  coyote: 0.09,
  jumpBuf: 0.12,
  dashCdBase: 1.0,    // seconds (items may multiply)
  dashTime: 0.18,
  dashSpeed: 13.5,
  shiftHold: 0.19,    // shorter than this = dash, longer = sprint

  // ---- Player stats ----------------------------------------------------
  staminaMax: 100,
  staminaRegen: 17,
  staminaDelay: 0.7,
  sprintDrain: 13,
  energyMax: 60,
  energyRegen: 6.5,
  baseHp: 100,
  baseAtk: 12,
  hpPerLevel: 12,
  atkPerLevel: 2.2,
  invulnTime: 0.8,

  // ---- XP / economy ----------------------------------------------------
  xpBase: 70,
  xpGrowth: 1.38,
  coinPerLevelBonus: 8,

  // ---- Combat ----------------------------------------------------------
  comboWindow: 0.55,
  attackWindup: 0.09,
  attackHitAt: 0.12,
  attackTimes: [0.34, 0.36, 0.5],
  comboDmg: [1.0, 1.15, 1.55],
  attackRange: 2.35,
  attackHalfAngle: Math.PI / 3,   // 120° sector
  lockOnRange: 16,
  pickupRadius: 1.4,

  // ---- Skills (unlock levels) ------------------------------------------
  skillUnlocks: [1, 3, 5, 7],

  // ---- World / camera --------------------------------------------------
  boundsDefault: 78,
  camDist: 4.6,
  camMinDist: 1.6,
  camPitchMin: -0.42,
  camPitchMax: 1.16,
  camHeight: 1.62,
  camLerp: 12,

  // ---- Enemies ---------------------------------------------------------
  maxActiveEnemies: 10,
  enemyRespawn: 14,
  alertBase: 11,

  // ---- HUD -------------------------------------------------------------
  minimapRange: 52,     // metres visible on minimap radius
};

export const SKILLS = [
  {
    id: 'quick_slash', name: 'Tebasan Kilat', key: '1', unlockLvl: 1,
    cd: 5, energy: 12, dmgMult: 0.95, desc: 'Melompat 3,5 m dan melepaskan tiga tebasan cepat.',
  },
  {
    id: 'spin_blade', name: 'Putaran Pedang', key: '2', unlockLvl: 3,
    cd: 9, energy: 18, dmgMult: 1.3, desc: 'Badai pedang 360°. Dua gelombang menyapu.',
  },
  {
    id: 'shadow_dash', name: 'Tebasan Bayangan', key: '3', unlockLvl: 5,
    cd: 8, energy: 14, dmgMult: 1.15, desc: 'Melintasi musuh sejauh 8 meter, memotong semua yang lewat.',
  },
  {
    id: 'courier_strike', name: 'Tebasan Kurir', key: '4', unlockLvl: 7,
    cd: 12, energy: 26, dmgMult: 2.6, desc: 'Melompat dan mengempas surat ke bawah. Finisher area besar.',
  },
];

export const HUD_COLORS = {
  hp: '#ff5d73',
  hpBack: 'rgba(255,93,115,0.18)',
  stamina: '#7dd45f',
  staminaBack: 'rgba(125,212,95,0.16)',
  xp: '#ffc24b',
  energy: '#5ec8ff',
  panelBg: 'rgba(10, 12, 32, 0.62)',
  panelStroke: 'rgba(255,255,255,0.22)',
  textOn: '#ffffff',
  textSub: '#cfd6ff',
  gold: '#ffce4b',
  npc: '#6ee7a0',
  enemy: '#ff6a5e',
  dest: '#ffd34d',
};
