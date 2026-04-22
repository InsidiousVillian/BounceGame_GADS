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