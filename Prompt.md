# GAME DEVELOPMENT MASTER PROMPT
## Project: MAILBOUND — A 3D Mail Delivery Adventure

You are a Senior Game Developer, Game Designer, Technical Artist, Gameplay Programmer, and Game Systems Architect.

Your task is to design and develop a complete 3D action-adventure mail delivery game using JavaScript.

The game combines:
- Open-world exploration
- Mail delivery missions
- Hack-and-slash combat
- Character progression
- Jet transportation
- Multi-world exploration
- Action RPG mechanics

The project must be modular, scalable, maintainable, and optimized for browser-based gameplay.

---

# 1. CORE GAME CONCEPT

Create a 3D mail delivery adventure game in which the player works as a futuristic mail courier traveling across multiple expansive worlds.

The player must:
1. Explore different environments.
2. Accept and deliver packages.
3. Travel through dangerous areas.
4. Fight enemies using melee weapons and skills.
5. Discover hidden locations and collectibles.
6. Complete stage objectives.
7. Unlock new worlds.
8. Pilot a jet to travel between worlds.

The game should feel like a combination of:
- Open-world exploration.
- Action RPG.
- Hack-and-slash combat.
- Adventure and delivery simulation.

The game must not feel like a simple walking simulator.

Working title: MAILBOUND.

---

# 2. TECHNICAL STACK

Primary technology:
- JavaScript ES Modules.
- Phaser 3 as the primary game framework.
- Vite as the development server and bundler.
- HTML5.
- CSS3.

3D rendering requirement:
- The game must use genuine 3D rendering.
- Evaluate Phaser's current 3D capabilities before implementation.
- If Phaser alone cannot satisfy the required 3D rendering, use Three.js as the 3D renderer and Phaser for suitable game systems, input, UI, scene management, or supporting functionality.
- Do not fake 3D using ordinary 2D sprites or isometric rendering.
- Establish a clear integration architecture before implementation.

Additional systems:
- LocalStorage for initial save data.
- Web Audio API for audio.
- Modular asset management.
- Procedural environment generation where appropriate.

Performance targets:
- Responsive browser gameplay.
- Target 60 FPS on reasonably capable desktop hardware.
- Efficient asset loading.
- Frustum culling and LOD where appropriate.
- Object pooling for frequently spawned objects.
- Avoid unnecessary draw calls.

---

# 3. GAME WORLD STRUCTURE

Create five distinct worlds.

Each world must have a different environment, atmosphere, map layout, enemies, delivery objectives, and visual identity.

## WORLD 1 — RESIDENTIAL DISTRICT

Theme: Modern suburban neighborhood.

Environment:
- Residential houses.
- Small streets.
- Residential alleys.
- Gardens.
- Local shops.
- Parks.
- Mailboxes.
- Community buildings.

Gameplay:
- Introduction to mail delivery.
- Basic navigation.
- Basic melee combat.
- Introductory enemies.
- Tutorial missions.

## WORLD 2 — METROPOLIS

Theme: Large futuristic city.

Environment:
- High-rise buildings.
- Commercial districts.
- Office towers.
- Rooftops.
- Underground passages.
- Shopping districts.
- Parking areas.
- Elevated roads.

Gameplay:
- Vertical exploration.
- Rooftop deliveries.
- More challenging enemies.
- Multiple delivery routes.
- Advanced movement challenges.

## WORLD 3 — THEME PARK

Theme: Abandoned amusement park.

Environment:
- Roller coasters.
- Ferris wheels.
- Carousel attractions.
- Food stalls.
- Haunted houses.
- Water attractions.
- Maintenance buildings.
- Hidden underground facilities.

Gameplay:
- Environmental puzzles.
- Traps.
- Unusual enemy encounters.
- Hidden packages.
- Boss encounter.

## WORLD 4 — WILD FOREST

Theme: Dense wilderness.

Environment:
- Dense forests.
- Rivers.
- Waterfalls.
- Mountains.
- Wooden bridges.
- Caves.
- Abandoned cabins.
- Wildlife areas.

Gameplay:
- Exploration and survival.
- Difficult terrain.
- Ambush encounters.
- Hidden delivery routes.
- Special combat challenges.

## WORLD 5 — COASTAL PARADISE

Theme: Tropical coastal environment.

Environment:
- Beaches.
- Oceanfront roads.
- Resorts.
- Fishing villages.
- Docks.
- Lighthouses.
- Coastal cliffs.
- Islands.
- Marine facilities.

Gameplay:
- Advanced delivery missions.
- Coastal exploration.
- Water-adjacent combat encounters.
- Final boss.
- Main storyline conclusion.

---

# 4. OPEN-WORLD MAP REQUIREMENTS

Each world must be expansive and feel like a real explorable environment.

Requirements:
- Multiple interconnected areas.
- Different routes between locations.
- Hidden areas.
- Shortcuts.
- Collectibles.
- Delivery destinations.
- Enemy spawn zones.
- Environmental landmarks.
- Exploration rewards.

Do not create five small disconnected arenas.

Each world should contain a main playable region with multiple subregions.

Use modular environment generation and reusable environment assets.

Implement world boundaries naturally through geography, obstacles, and world design.

---

# 5. PLAYER CHARACTER

Create a fully controllable 3D mail courier character.

Character features:
- Third-person camera.
- Idle animation.
- Walking animation.
- Running animation.
- Sprint animation.
- Jump animation.
- Dash animation.
- Melee attack animations.
- Skill animations.
- Damage reaction.
- Death animation.

The character should carry a mail delivery backpack.

The backpack should be visually identifiable throughout the game.

---

# 6. PLAYER CONTROLS

Implement the following control scheme.

## Movement

| Input | Action |
|---|---|
| W | Move forward |
| A | Move left |
| S | Move backward |
| D | Move right |
| Mouse movement | Camera rotation |
| Mouse left click | Basic attack |
| Mouse right click | Lock-on / secondary combat action |
| Space | Jump |
| Shift tap | Dash |
| Shift hold | Sprint |
| E | Interact |
| Esc | Pause menu |

Important Shift behavior:
- A short Shift press triggers a dash.
- Holding Shift activates sprint.
- Avoid triggering both actions simultaneously.
- Use a configurable hold threshold.
- Dash must have cooldown and movement distance.
- Sprint must drain stamina.

Mouse requirements:
- Pointer lock camera.
- Adjustable mouse sensitivity.
- Smooth third-person camera movement.
- Camera collision handling.
- Camera inversion option.

Movement must be relative to camera direction.

---

# 7. COMBAT SYSTEM — HACK AND SLASH

Build a responsive hack-and-slash combat system.

Combat features:
- Basic attack combo.
- Heavy attack.
- Dash attack.
- Air attack.
- Enemy targeting.
- Hit detection.
- Damage calculation.
- Knockback.
- Stagger.
- Enemy health.
- Player health.
- Stamina.
- Combat feedback.

The combat should feel responsive rather than turn-based.

## Skill System

The player has four active skills.

| Key | Skill | Description |
|---|---|---|
| 1 | Quick Slash | Fast forward melee attack |
| 2 | Spinning Blade | 360-degree area attack |
| 3 | Shadow Dash | Fast movement through enemies with damage |
| 4 | Courier Strike | Powerful finishing attack |

Each skill must have:
- Cooldown.
- Damage value.
- Animation.
- Visual effects.
- Sound effects.
- Skill indicator.
- Optional stamina or energy cost.

Make the skill architecture configurable so new skills can be added later.

---

# 8. ENEMY SYSTEM

Create different enemy archetypes for every world.

Examples:
- Basic melee enemy.
- Fast enemy.
- Heavy enemy.
- Ranged enemy.
- Elite enemy.
- Boss enemy.

Enemy behavior:
- Idle.
- Patrol.
- Detection.
- Chase.
- Attack.
- Take damage.
- Stagger.
- Death.

Enemies should have basic AI state machines.

Enemy difficulty should increase between worlds.

Avoid spawning enemies excessively.

---

# 9. MAIL DELIVERY SYSTEM

Mail delivery is the central gameplay mechanic.

Create a delivery mission system.

Mission flow:

1. Accept delivery mission.
2. Receive package information.
3. Locate destination.
4. Navigate through the world.
5. Encounter obstacles and enemies.
6. Deliver the package.
7. Receive rewards.
8. Unlock additional missions.

Mission types:
- Standard package delivery.
- Urgent delivery.
- Fragile package.
- Special delivery.
- Dangerous delivery.
- Multi-destination delivery.
- Timed delivery.

Delivery mechanics:
- Delivery markers.
- Destination indicators.
- Package inventory.
- Mission tracking.
- Delivery confirmation.
- Rewards and experience.

Delivery destinations must be integrated into the world rather than existing as abstract menu-only objectives.

---

# 10. JET TRANSPORTATION SYSTEM

One of the most important game features.

Every world must have a jet transportation system.

After completing the main stage of a world:

1. The player receives a world completion notification.
2. The jet landing sequence begins.
3. The player approaches the jet.
4. The player interacts with the jet.
5. A cinematic takeoff sequence plays.
6. The jet flies through a transition sequence.
7. A new world is loaded.
8. The player arrives at the next world.

Create a jet model with:
- Cockpit.
- Wings.
- Engine.
- Landing gear.
- Jet exhaust effects.
- Engine audio.
- Takeoff animation.
- Landing animation.

The jet transition should feel cinematic.

The jet is primarily used as a world-travel mechanic, not necessarily a full flight simulator.

However, design the architecture so optional manual flight controls can be added later.

World progression:

WORLD 1 → WORLD 2 → WORLD 3 → WORLD 4 → WORLD 5.

The fifth world contains the final storyline mission.

---

# 11. USER INTERFACE

Create a polished futuristic adventure-game interface.

HUD requirements:
- Player health bar.
- Stamina bar.
- Experience bar.
- Skill hotkeys 1–4.
- Skill cooldown indicators.
- Current mission.
- Delivery target indicator.
- Distance to destination.
- Package status.
- Mini-map.
- Interaction prompt.

Additional interfaces:
- Main menu.
- Pause menu.
- Settings.
- Inventory.
- Mission journal.
- World map.
- Skill information.
- World transition screen.
- Mission completed screen.
- Game over screen.

Visual direction:
- Modern futuristic courier interface.
- Clean typography.
- Subtle neon accents.
- Strong visual hierarchy.
- Minimal unnecessary UI.
- Responsive HUD.

---

# 12. WORLD PROGRESSION AND SAVE SYSTEM

Implement:
- World unlock progression.
- Mission completion tracking.
- Player level.
- Experience points.
- Skill unlocks.
- Collectibles.
- Player statistics.
- Save and load functionality.

Use LocalStorage for the initial version.

Save data should be versioned to support future migrations.

---

# 13. AUDIO AND VISUAL EFFECTS

Implement:
- Footstep sounds.
- Sword attack sounds.
- Hit impact sounds.
- Dash sound.
- Skill sounds.
- Enemy sounds.
- Ambient environment sounds.
- Jet engine sounds.
- Delivery confirmation sounds.
- Background music.

Visual effects:
- Slash trails.
- Impact particles.
- Dash trails.
- Skill particles.
- Enemy damage effects.
- Environment particles.
- Jet exhaust.
- World transition effects.

Use optimized particle systems.

---

# 14. PROJECT ARCHITECTURE

Create a modular architecture.

Suggested structure:

```text
mailbound/
├── public/
│   ├── assets/
│   │   ├── characters/
│   │   ├── environments/
│   │   ├── enemies/
│   │   ├── weapons/
│   │   ├── vehicles/
│   │   ├── animations/
│   │   ├── audio/
│   │   └── textures/
│   └── models/
│
├── src/
│   ├── core/
│   │   ├── Game.js
│   │   ├── GameConfig.js
│   │   └── AssetManager.js
│   │
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── LoadingScene.js
│   │   ├── MainMenuScene.js
│   │   ├── WorldScene.js
│   │   └── TransitionScene.js
│   │
│   ├── player/
│   │   ├── Player.js
│   │   ├── PlayerController.js
│   │   ├── PlayerCombat.js
│   │   ├── PlayerSkills.js
│   │   └── PlayerStats.js
│   │
│   ├── enemies/
│   │   ├── Enemy.js
│   │   ├── EnemyAI.js
│   │   └── EnemyManager.js
│   │
│   ├── combat/
│   │   ├── CombatSystem.js
│   │   ├── HitboxSystem.js
│   │   └── DamageSystem.js
│   │
│   ├── delivery/
│   │   ├── DeliveryManager.js
│   │   ├── MissionManager.js
│   │   └── PackageSystem.js
│   │
│   ├── worlds/
│   │   ├── WorldManager.js
│   │   ├── World1.js
│   │   ├── World2.js
│   │   ├── World3.js
│   │   ├── World4.js
│   │   └── World5.js
│   │
│   ├── vehicles/
│   │   └── JetController.js
│   │
│   ├── ui/
│   │   ├── HUD.js
│   │   ├── Menu.js
│   │   ├── Inventory.js
│   │   └── MissionUI.js
│   │
│   ├── systems/
│   │   ├── InputManager.js
│   │   ├── AudioManager.js
│   │   ├── SaveManager.js
│   │   └── CameraManager.js
│   │
│   └── main.js
│
├── index.html
├── package.json
└── vite.config.js
```

Adjust the structure based on the actual rendering architecture.

---

# 15. DEVELOPMENT RULES

Follow these rules strictly:

1. Inspect the existing project before making changes.
2. Do not overwrite existing files without inspecting them.
3. Do not implement everything inside one JavaScript file.
4. Keep game systems modular.
5. Use reusable components and systems.
6. Avoid unnecessary dependencies.
7. Do not use placeholder geometry as the final art direction.
8. Use temporary primitives only during the prototype stage.
9. Do not claim a feature is complete without testing it.
10. Maintain a working build after every development phase.
11. Document important architectural decisions.
12. Do not silently change the chosen rendering architecture.
13. Ask for confirmation before introducing major architectural changes.

If assets are unavailable, establish a clearly documented temporary asset strategy and maintain a replaceable asset pipeline.

---

# 16. DEVELOPMENT ROADMAP

Implement incrementally.

## Phase 1 — Technical Foundation
- Initialize project.
- Configure Phaser and the chosen 3D renderer.
- Create rendering architecture.
- Implement player movement.
- Implement third-person camera.
- Implement WASD and mouse controls.
- Implement Shift dash and sprint.

Deliverable: Playable 3D character prototype.

## Phase 2 — Combat Foundation
- Basic attacks.
- Attack combos.
- Four skills.
- Health and stamina.
- Enemy AI.
- Damage and hit detection.

Deliverable: Playable combat prototype.

## Phase 3 — World 1
- Residential map.
- Houses and streets.
- Delivery missions.
- Enemies.
- Mini-map.
- World completion.

Deliverable: Fully playable first world.

## Phase 4 — Jet Transportation
- Jet model.
- Interaction.
- Boarding sequence.
- Takeoff cinematic.
- World transition.

Deliverable: Working world transition system.

## Phase 5 — Worlds 2–5
- Metropolis.
- Theme Park.
- Forest.
- Coastal Paradise.

Each world must have unique map layouts, environmental identity, missions, enemies, and progression.

## Phase 6 — Polish
- Audio.
- Animations.
- VFX.
- Optimization.
- UI.
- Save system.
- Testing.

Deliverable: Complete playable game.

---

# 17. FIRST EXECUTION INSTRUCTION

IMPORTANT:

Do not immediately generate the entire game.

Start by:

1. Inspecting the current working directory.
2. Identifying the installed Node.js and npm versions.
3. Checking available rendering and game-development dependencies.
4. Evaluating Phaser and Three.js integration options.
5. Proposing the final architecture.
6. Identifying required external assets.
7. Creating a detailed implementation plan.

Then stop and present the analysis for approval.

After approval, implement Phase 1 only.

The priority is to establish a genuine playable 3D foundation with correct movement, camera control, dash, and sprint mechanics.

Do not proceed to subsequent phases until the current phase builds and passes its defined tests.

**Final objective:** Deliver a polished, expansive, third-person 3D mail delivery action-adventure game spanning five unique worlds, with responsive hack-and-slash combat and cinematic jet-based world transitions.
