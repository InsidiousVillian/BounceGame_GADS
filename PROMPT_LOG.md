# Prompt Log

## Session 1 - 2026-04-22

### Prompt
Initial project setup for a 2D Top-Down Bouncer game using HTML5 Canvas and Vanilla JavaScript.

### Tasks Completed
- Created TO_DO.md with full task checklist
- Created PROMPT_LOG.md (this file)
- Created index.html with full-screen canvas and UI overlay container
- Created style.css with dark club aesthetic
- Created game.js with canvas context, GameState object, NPC class, and requestAnimationFrame loop

### Status
[x] Initial 2D Project Setup: COMPLETE

---

## Session 2 - 2026-04-22

### Prompt
Implement core gameplay: NPC spawning and movement to a door stop line, inspection UI on click, vibe/chaos reactions for Let In / Deny Entry, and aggression-based fight state on deny.

### Tasks Completed
- **Spawning:** NPCs spawn every 5–10 seconds from the bottom; capped count; move toward a fixed stop point in front of the DOOR.
- **Movement / queue:** Arriving NPCs enter `waiting` at the stop line; queue spreads horizontally; `inspecting` pauses the sim while the menu is open.
- **Inspection UI:** Click a waiting NPC to open the overlay with name, age, ID number, and a photo placeholder; buttons **Let In** and **Deny Entry**.
- **Vibe / chaos:** Let In applies `vibeContribution` and removes the NPC. Deny Entry rolls against `aggressionChance`; on success the NPC enters `fighting` (red pulse, chaos spike); otherwise the NPC is removed. HUD bars stay in sync via `updateHUD`.
- **Docs:** `TO_DO.md` updated; remaining work flagged under full combat mechanics.

### Status
NPC loop, inspection flow, and vibe/chaos/deny-fight prototype: COMPLETE

---

## Session 3 - 2026-04-22

### Prompt
Fix layout so the canvas and door/game area read clearly; center **Bouncer Station**; drive NPCs with a dedicated `npcs` array; spawn every 5s from the bottom toward the station; stop at the station; click logs name and ID; draw **E** when ready for inspection.

### Tasks Completed
- **Layers:** `#gameCanvas` is `position: fixed; inset: 0; z-index: 0` as the full-screen background. `#ui-overlay` is `z-index: 10` with `pointer-events: none` so clicks reach the canvas. `#hud` is `position: absolute; top/left: 16px; z-index: 20` with `pointer-events: none`.
- **Bouncer Station:** New `#bouncer-station` div centered on the viewport (purple frame + label) as the door; `pointer-events: none` so it does not block canvas input.
- **`npcs` array:** All entities use top-level `const npcs = []`; spawn via `setInterval(..., 5000)` plus one initial spawn; movement targets `getStationGeometry().stopX/stopY` (aligned with the station); `atStation` state stops NPCs and queues them horizontally.
- **World read:** Radial floor gradient, light grid, dashed “club floor” rect, soft glow under station center so the play area is visible.
- **Interaction:** Canvas click hit-test (top-most NPC first) → `console.log` name and **ID**. NPCs at the station show an **E** prompt under their name label.
- **Tracking:** `TO_DO.md` — **Game Loop** and **NPC Spawning & Movement** remain marked complete.

### Status
Layout / station / movement / click logging: COMPLETE

---

## Session 4 - 2026-04-22

### Prompt
Functional loop: spawn every 6s, square NPCs in grunge colors moving up to the **Bouncer Station** box, **`#inspection-menu`** folder-style UI with Name/Age and neon **Let In** / **Deny**, decisions affecting Vibe/Chaos, logs updated.

### Tasks Completed
- **Spawns:** `setInterval(spawnNPC, 6000)`; NPCs are **squares** (`size` 20) filled from a muted green / purple / gray palette; movement targets the station until the sprite **hits** the station AABB (top vs. box bottom), then queues on `getQueueLineY`.
- **Station sync:** `STATION_W` / `STATION_H` (160) match CSS `#bouncer-station`; `getStationBounds()` drives collision and queue layout.
- **`#inspection-menu`:** Folder / ID-card styling; `#inspect-name`, `#inspect-age`; **Let In** (`#btn-let-in`) green neon, **Deny** (`#btn-deny`) red neon; `pointer-events: auto` on menu only.
- **Interaction:** Clicking an **`atStation`** NPC **toggles** the menu and fills fields; same NPC again closes. **`inspecting`** pauses simulation; **E** prompt hides while that NPC’s sheet is open.
- **Decisions:** **Let In** → `addVibe(vibeContribution)`, remove NPC, hide menu. **Deny** → `addChaos` base 5–8; extra +12 chaos on failed **aggro** roll (`aggressionChance`); NPC removed; menu hidden.
- **Docs:** `TO_DO.md` / this log updated.

### Status
Inspection menu + vibe/chaos decisions + station collision: COMPLETE

---

## Session 5 - 2026-04-22

### Prompt
Fix `ReferenceError: can't access lexical declaration 'npcs' before initialization` caused by `resizeCanvas()` running before `npcs` was defined; centralize startup in `init()`; guard `repositionStationQueue`; confirm render pipeline after `clearRect`; update logs.

### Tasks Completed
- **Declaration order:** `canvas`, `ctx`, `STATION_*`, `GameState`, `let npcs = []`, palettes, `MAX_NPCS`, HUD/inspection DOM refs, and `spawnIntervalId` / `lastTime` are grouped at the **top** of `game.js` before any runtime calls.
- **`init()`:** Performs first `resizeCanvas()`, registers `resize`, starts `setInterval(spawnNPC, 6000)`, initial `spawnNPC()`, `updateHUD()`, click listeners, and `requestAnimationFrame(gameLoop)`. **`init()`** is the only top-level invocation besides `init()` itself.
- **`repositionStationQueue`:** Returns early if `npcs` is missing/not an array, `length === 0`, or no queued `atStation`/`inspecting` NPCs.
- **Visibility:** Documented in `render()` that `clearRect` is intentional and NPCs are redrawn immediately after the background in the **same frame**; stacking is draw-order on one bitmap (not CSS z-index).

### Status
Initialization / TDZ bugfix: COMPLETE

---

## Session 6 - 2026-04-22

### Prompt
Papers, Please–style mechanics: grunge physical folder inspection UI with neon type, `reasonForEntry` + `isMinor` from **`NPCSystem.js`**, dossier fields (name, age, ID validity, reason), rule-based **Let In** / **Deny**, chaos feedback (shake / red flash), speech bubbles **!** / **?**, smoother bar width transitions, logs updated.

### Tasks Completed
- **`NPCSystem.js`:** `generateNpcData()` adds **`reasonForEntry`** (rotating excuses) and **`isMinor`** (`age < 21`). Ages **16–50** so minors appear; **`isValidID`** models fake vs real. Loaded before **`game.js`**.
- **`#inspection-menu`:** Dark grunge folder body, paper texture overlay, **metal clip**, magenta/cyan **neon** labels; fields **`#inspect-id-validity`**, **`#inspect-reason`**; tab **ENTRY DOSSIER**.
- **Rules — Let In:** If **fake ID** (`!isValidID`) **or** **under 21** → **Chaos +15**; else **Vibe +** `vibeContribution`. **Deny:** If guest is **legit** (`isValidID && !isMinor`) → **Chaos +5**; denying non-legit adds no chaos from this rule.
- **Chaos feedback:** **`notifyChaosIncrease`**: gain **≥10** → HUD **shake** + chaos bar / track **red flash**; **5–9** → flash only (covers annoyed legit denial). **`GameState.addChaos`** triggers feedback.
- **Speech bubbles:** Rounded bubble + tail toward NPC, **!** or **?** per NPC; shown at station unless that NPC’s dossier is open.
- **Bars:** **`transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1)`** on **`.bar`** for smooth Vibe/Chaos updates.
- **Docs:** **`TO_DO.md`** — **ID Inspection Menu** and **Vibe/Chaos Logic** marked complete (Session 6 note).

### Status
Papers Please core loop + polish: COMPLETE

---

## Session 7 - 2026-04-22

### Prompt
Combat when denials go wrong: **`STATE_AGGRESSIVE`** on failed deny (`aggressionChance`), pulsing red + shake, passive chaos tick, punch clicks (flash + screenshake), HP / knockout slide, aggro bubble **`#!@%`**, `console.log('POW!')` placeholder, logs updated.

### Tasks Completed
- **`NPCSystem.js`:** Restored **`aggressionChance`** (`0.14–0.62` approx.) on generated NPCs.
- **State machine:** `STATE_MOVING` → `STATE_AT_STATION` / `STATE_INSPECTING` → on **Deny** roll → **`STATE_AGGRESSIVE`** (NPC **not** removed, menu closed) or removed if calm. **`STATE_KNOCKOUT`** after **3 punches**; sprite slides along vector away from station until off-screen, then **`removeNpc`**.
- **Chaos:** While **any** aggressive NPC exists, **`GameState.addChaosPassive(0.1 * dt)`** per second (no spike VFX). Legit-deny **+5** still applies before aggro roll when applicable.
- **Draw:** Aggressive fill uses **HSL red pulse**; **dual sine shake** offsets sprite + bubble; red border; speech bubble **dark red / `#!@%` in `#ff5252`**.
- **Punch:** **`playCombatSound()`** → `console.log('POW!')`; **`_punchFlash`** white overlay; **`triggerPunchScreenshake()`** reuses HUD keyframe shake.
- **Loop:** **`dt`** from `requestAnimationFrame`; **`tickAggroChaos`** once per frame; when inspection **paused**, still updates **aggressive** / **knockout** + passive chaos tick.
- **Docs:** **`TO_DO.md`** — **NPC Aggro & Combat Mechanics** marked **[x]**; this session entry.

### Status
Aggro + punch + knockout combat loop: COMPLETE