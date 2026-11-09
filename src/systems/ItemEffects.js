// Secret items gifted by NPCs. Effects are re-applied into PlayerStats by id
// so stats stay computed, stored only as flags in the save file.

export const ITEMS = {
  maple_cookie: {
    name: "Maple's Divine Cookie", icon: '🍪',
    desc: '+15% attack power for the rest of the run.',
    fx: { atkMult: 0.15 },
  },
  quill_shield: {
    name: 'Quill Shield Charm', icon: '🪶',
    desc: '10% chance to dodge any attack.',
    fx: { dodge: 0.10 },
  },
  pigeon_whistle: {
    name: 'Pigeon Whistle', icon: '🕊️',
    desc: 'The pigeons point your camera arrow at secrets nearby.',
    fx: { reveal: 1 },
  },
  turbo_greaves: {
    name: 'Turbo Greaves', icon: '👟',
    desc: 'Dash cooldown reduced by 30%.',
    fx: { dashCdMult: -0.30 },
  },
  lucky_ball: {
    name: "Chuckles' Lucky Ball", icon: '🎪',
    desc: '+8% chance to dodge any attack.',
    fx: { dodge: 0.08 },
  },
  honey_vial: {
    name: 'Honey Energy Vial', icon: '🍯',
    desc: '+30% energy regeneration.',
    fx: { energyRegen: 0.30 },
  },
  forest_charm: {
    name: 'Forest Heart Charm', icon: '🍀',
    desc: '+40 max HP.',
    fx: { maxHp: 40 },
  },
  tide_trinket: {
    name: 'Tide Trinket', icon: '🐚',
    desc: 'Slowly regenerates 0.6 HP every second.',
    fx: { hpRegen: 0.6 },
  },
};

// Aggregate all owned item effects into one modifier object.
export function collectItemFx(state) {
  const fx = {
    atkMult: 1, dodge: 0, reveal: 0, dashCdMult: 1, energyRegen: 1, maxHp: 0, hpRegen: 0,
  };
  for (const id of Object.keys(state?.items ?? {})) {
    if (!state.items[id]) continue;
    const it = ITEMS[id];
    if (!it) continue;
    for (const [k, v] of Object.entries(it.fx)) {
      if (k === 'atkMult' || k === 'dashCdMult' || k === 'energyRegen') {
        fx[k] *= 1 + v;
      } else {
        fx[k] += v;
      }
    }
  }
  return fx;
}
