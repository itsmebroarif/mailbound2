# MAILBOUND — Architecture Decisions

This document exists because the project prompt asks for documented decisions, and because any
contributor (or future-me) should be able to re-derive this in one read.

## 1. Phaser 3 = engine, Three.js = renderer (real 3D, no fakes)

**Contract:** Phaser drives the *game* (loop, scenes, HUD canvas). Three.js draws the *world*.
They never share a canvas: Three renders to `#three-root` (z-index 0), Phaser renders transparent
over it (`#phaser-root`, z-index 1), and the DOM overlays (z-index 2) sit on top.

**Why not Phaser 3's `phaser3-3d-plugin`/`easy3d` style hacks?** They couple the scene graph to
Phaser and would limit quality & control for zero benefit — the UI and game loop are Phaser's to
keep, the visuals are WebGL's to keep. This split also means swapping the renderer later (e.g., to
WebGPURenderer) is a one-file change behind `Renderer3D`.

## 2. Full-outline toon look (art direction)

- Every mesh built via `celMesh()` (MeshToonMaterial with a 5-step `gradientMap`).
- Every mesh carries an **inverted-hull outline child** (BackSide shader pushing vertices along
  view-space normals) — thick enough to read as a comic frame, cheap to render (no post pipeline).
- HUD uses Phaser vector drawing with strong outlines too.
- Neon-ish accent palette per world theme, 5-step banding → "gritty cel" read.

## 3. No binary asset pipeline (yet)

Every texture is drawn on a `<canvas>` at boot (`AssetManager.tex()`) — grass, asphalt, wood,
sand, stone, window lit/night, checker. Every model is assembled from primitives
(`ProceduralModels`). Every SFX/OST note is synthesized with Web Audio (`AudioManager`,
`MusicEngine`). Benefits: tiny distribution size, zero licensing surface, full parameter
control. Costs: more draw-call pressure (mitigated via instancing pressure on shared geo refs
and pooled effects), authoring tools needed per new model.

**Replaceable pipeline:** all asset factories are keyed in one place
(`render3/ProceduralModels.js`, `render3/Props.js`), and `AssetManager.tex()` yields a cached
`CanvasTexture` — migrating any of these to real binaries (glTF/KTX2) only touches these files.

## 4. Two save files, versioned

- `mailbound-save-v2` — game state (player, worlds, missions, items, stamps, playtime).
- `mailbound-settings-v1` — user settings.

`SaveManager.state.version === 2`; migration path = `if (raw.version === 2)` branch in
`load()`, which currently only supports v2 (will grow with future saves).

## 5. Input strategy (and the tap/hold Shift rule)

`InputManager` is a document-level listener-based system *outside* Phaser scenes
(works identically in pause/dialog/world).

- **Shift**: `_shiftDownT` timestamped on keydown; on keyup, if held `< CONFIG.shiftHold` (0.19s)
  → queue **dash**; if held longer, **sprint** state engages while held. No double-trigger.
- **Pointer lock** for camera; mouse-sensitivity & invert-Y from settings.
- **Edge-triggered buffers** (`pressed`, `takeClickLeft`, `takeDash`) are consumed once per world
  tick — no double-fire, no queue flooding.
- **Auto-pause** on pointer-lock loss (suppressed when a modal closed it intentionally).

## 6. Performance budget

- No real-time lights other than HemisphereLight + one DirectionalLight (no shadowmaps; blob shadows instead).
- Object pools: projectiles (`ProjectilePool`), particles (`Effects`), XP/coin/heart orbs (`EnemyManager`),
  ghost trails, damage-number sprites, slash arcs, rings.
- Enemy count hard-cap (`CONFIG.maxActiveEnemies` = 10) + only-sim-within-90m culling.
- World 5's boss fight in the Horizon is the heaviest scene but stays inside budget.

## 7. Where the testing happens

`scripts/deep-smoke.mjs` (Playwright + Chrome) drives the game end-to-end: boot → menu → world →
dialog → world-complete → travel → boss → victory → credits, and asserts zero console/page errors.
Run `npx vite build && node scripts/deep-smoke.mjs` with `npm run preview` serving `:4173`.
`scripts/shots.mjs` captures screenshots for reference.

## 8. Known intentional simplifications

- Enemy separation is faked by knockback & wander (no full flocking).
- Boss is a **single** spectacular fight (by design) — no phase-selection.
- Rooftop navigation in Metropolis is by climbable crates/stairs with automatic step-up (no IK).
- Fragile packages take damage from hits (integrity 100→0), with reward scaling.
