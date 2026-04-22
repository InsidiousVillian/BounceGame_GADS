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

---

## Session 8 - 2026-04-22

### Prompt
Game flow: main menu (**THE VELVET ROPE** / **START SHIFT**), **ESC** pause menu, **`GameState.currentStatus`** drives sim + spawn interval, chaos **100** → game over message, **120s** shift timer → win, **Guests processed** on end screens, **RETRY** full session reset without reload.

### Tasks Completed
- **`GameState.currentStatus`:** `MENU` | `PLAYING` | `PAUSED` | `GAMEOVER` | `WIN`. **`runSimulationStep(dt)`** runs only when **`PLAYING`** (timer, aggro tick, NPC updates with existing inspection sub-pause via **`isPaused`**). **`PAUSED`** freezes timer, chaos passives, and NPC motion.
- **Spawn:** **`setInterval`** only active after **START SHIFT**; **`spawnNPC`** no-ops unless **`PLAYING`**. **`clearSpawnInterval`** on **GAMEOVER**, **WIN**, and **RETRY** / menu reset.
- **Main menu:** Full-screen **`#main-menu`** (`z-index: 110`); **`#game-hud-wrap`** hidden until a shift starts; in-shift **SHIFT** countdown **`#shift-timer-display`** (`M:SS`).
- **Pause:** **`keydown` `Escape`** toggles **`PLAYING` ↔ PAUSED`**; closes inspection via **`hideInspectionForPause`**. **`#pause-menu`** with **RESUME**.
- **Loss:** **`chaos >= 100`** (checked after chaos changes + start of step) → **`GAMEOVER`**, exact copy: *“THE CLUB WAS SHUT DOWN. TOO MUCH CHAOS.”*
- **Win:** **`shiftTimerRemaining <= 0`** → **`WIN`**, “Shift Complete” panel + short flavor line.
- **Score:** **`guestsProcessed`** increments in **`removeNpc`** only while **`PLAYING`** (Let In / calm Deny / knockout off-screen).
- **RETRY:** **`resetSessionToMenu()`** — clears NPCs, resets vibe **50**, chaos **0**, timer **120**, guests **0**, status **`MENU`**, hides HUD/end/pause, shows main menu; no page refresh.
- **Docs:** **`TO_DO.md`** — **Game Flow (Main Menu & Game Over)** **[x]**; this entry.

### Status
Menus + win/loss + session reset: COMPLETE

---

## Session 9 - 2026-04-22

### Prompt
Tactical **Call Security** ability (HUD button + Space), **−25 chaos** / **−20 vibe**, **15s** cooldown with visual recharge; **dynamic difficulty** from **ShiftTimer** (every **30s**: faster spawns, higher **aggressionChance** on new NPCs); HUD **timer** (remaining seconds) + **guest let-in vs denied** counts; update **TO_DO.md** and **PROMPT_LOG.md**.

### Tasks Completed
- **`game.js`:** `callSecurity()` gated on **PLAYING**, not inspection-paused, vibe **≥20**, cooldown **≤0**; `tickSecurityCooldown(dt)` in **`runSimulationStep`** and while **PAUSED** in **`gameLoop`**; **Space** in **`onKeyDown`**; `guestsLetIn` / `guestsDenied` on **Let In** / **Deny** (including aggro path); `getDifficultyTier()` from shift elapsed (**floor(elapsed/30)**), `syncDifficultyScaling()` restarts spawn interval (**base 6s − tier×1s**, min **2s**), `NPCSystem.generateNpcData(tier * 0.1)` aggro bonus capped at **1**.
- **`NPCSystem.js`:** `generateNpcData(aggressionBonus)` optional bonus added to rolled aggression, clamped.
- **`index.html` / `style.css`:** **`#hud-top-center`** timer + guest line; **`#btn-call-security`** + **`#security-cd-overlay`**; **`.btn-security`** / **`.on-cooldown`**.
- **Docs:** **`TO_DO.md`** — **The Cool Down & Difficulty Scaling** **[x]**; Session 9 note; this entry.

### Status
Call Security + 30s difficulty tiers + HUD timer & guest stats: COMPLETE

---

## Session 10 - 2026-04-22

### Prompt
Redesign inspection from text list to a **visual ID card**: PVC-style layout with left **portrait** (abstract colored shapes), **monospace / official** typography for name and ID number, **security seal / hologram** (gold if valid; if fake, **50%** missing slot vs **broken** red icon), **draggable** card via top handle; update **TO_DO.md** and **PROMPT_LOG.md**.

### Tasks Completed
- **`style.css` / `index.html`:** **`#inspection-menu`** wraps **`.id-card`** — dark **drag handle** (“STATE ISSUED IDENTIFICATION”), **`.id-card-body`** with **portrait frame** + detail column; **`.field-value--official`** uses **Share Tech Mono** (Google Font link); seal row + **Let In** / **Deny** unchanged behavior.
- **`NPCSystem.js`:** **`generatePortraitShapes()`** (3–4 circles/triangle), **`portraitShapesToSvg()`**, embedded in **`generateNpcData`** as **`portraitSvg`**; **`securitySealVariant`**: **`valid`** | **`missing`** | **`broken`** (fake IDs: **50%** each for missing vs broken).
- **`game.js`:** **`inspect-portrait-host`**, **`inspect-id-number`**, **`inspect-security-seal`**; **`applySecuritySeal()`** with inline gold / broken SVGs; **`mousedown`** drag on **`#id-card-drag-handle`**, clamped to viewport; **`resetInspectionMenuLayout()`** on show / hide / pause / menu reset so the card recenters when reopened.
- **Docs:** **`TO_DO.md`** — **Advanced ID Visuals** **[x]**; Session 10 note; this entry.

### Status
Visual ID card + portraits + seal variants + draggable UI: COMPLETE