# MAILBOUND — Content Bible

## The five worlds

| # | World | Theme | Main gimmick | Elite / boss |
|---|---|---|---|---|
| 1 | **Residential District** — Rosy Fields Village | Warm suburb, tutorial | Postal linchpin + hidden stamps | — |
| 2 | **Metropolis** — Neon Crayon City | Vertical cybercity | Rooftop routes + underpass codes | Ringmaster on the rooftops (elite) |
| 3 | **Theme Park** — The Ferris-Graveyard Fair | Abandoned carnival | Carousel/wheel/coaster, haunted house | **Ringmaster** (elite) on the coaster |
| 4 | **Wild Forest** — The Whispering Hollow | Dusk forest + river | Bridge crossing, cave mouth | Beast ecology (3 zones) |
| 5 | **Coastal Paradise** — The Drowned Lighthouse | Tropical coastline | Boss arena at the lighthouse plaza | **UYEHH, the Jelly Slime** (final boss) |

Each world ships with:

- **~8 NPCs** (40 total), each with greeting lines, repeat lines, mission offers, and (for 8 of them) **secret-item** flows.
- **3 main missions + 2 side missions** (chain-gated) — finishes "the Main Route" and opens the MAILWING jet.
- **8 hidden golden stamps** — used by some NPCs to unlock their secret items.
- **3–5 enemy zones** (W3 includes an elite solo).
- A **distinct sun/fog/palette** (no desert at sunset = no repeated vibes).

## Secret items (NPC-gifted, run-permanent)

| Item | From | Cost | Effect |
|---|---|---|---|
| 🍪 Maple's Divine Cookie | Granny Maple (W1) | 2 golden stamps | +15% attack |
| 🪶 Quill Shield Charm | Mailman Sage (W1) | Talk 3 times | +10% dodge |
| 🕊️ Pigeon Whistle | Pia the Pigeon Keeper (W2) | Talk 2 times | Secrets revealed on minimap |
| 👟 Turbo Greaves | ZIP the Mechanist (W2) | 3 golden stamps | Dash cooldown −30% |
| 🎪 Chuckles' Lucky Ball | Chuckles the Clown (W3) | Talk 2 times | +8% dodge |
| 🍀 Forest Heart Charm | Ranger Rowan (W4) | Talk 2 times | +40 max HP |
| 🍯 Honey Energy Vial | Beatrix the Beekeeper (W4) | 4 golden stamps | +30% energy regen |
| 🐚 Tide Trinket | Captain Coral (W5) | Talk 2 times | +0.6 HP regen/sec |

## The boss — UYEHH, the Jelly Slime

**Concept:** so adorable you want to hug him. So ganas you shouldn't.

**Presentation**
- Translucent-teal jelly dome, sparkling white eyes with shine dots, permanent blush, sparkles on top, fat belly stamp core.
- Cute voice (`slime_cute`) when he misbehaves *kindly*; furious voice (`slime_angry`) below 30% HP.
- Slime jiggle on idle, wild squash-stretch on movement, goo droplets, mouth-arc that flips from happy (∩) to angry when enraged.

**Moveset**
1. **Bounce Slam** — telegraph squash (0.6s), leaps at the player, AoE shockwave ring on landing.
2. **Belly Exposure** — after every slam, flops down for ~2.4s; the stamp core glows — **2.5× damage window**.
3. **Goo Spit** — 3-fan glob projectiles (arcing), unlocked below 66% HP.
4. **Split** — at 66% and again at 33% HP, spawns 3 slime minions.
5. **Enrage (<30%)** — bounce speed ×1.5, attack CD ×0.66, angry visor face.

**Flow:** accept mission `w5_m3` from Captain Coral → walk into the lighthouse plaza arena →
barrier logic clamps the arena → fight → on death: confetti storm, `victory` fanfare, 
the **Victory screen** → **Credits** (scrolling) → back to menu.

## Credits (as shipped in-game)

**ARIF ALEXANDER** in every listed role:
Developer · Designer · Tester · Analyze · Marketing · Customer Service · Editor ·
Script Writer · Dubber · Research · Accountant · Business Development

(plus an epilogue thanking *you*, the courier.)

## Save files

- `mailbound-save-v2` — progress, items, missions, playtime, defeatedBoss flag.
- `mailbound-settings-v1` — quality, volumes, sensitivity, inversion, damage numbers.

## Design principles kept

1. **Skills every few seconds**, S3 (Shadow Dash) becomes the fold-button.
2. **Everything on the critical path is rewarded** — coyote time, buffered combo, auto-step stairs, readable marker beams.
3. **Secrets for the curious** — hidden stamps reward attention, not grind.
4. **Full outlined toon** — everything in the world wears a dark rim, HUD included.
