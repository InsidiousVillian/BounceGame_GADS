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

---

## Session 11 - 2026-04-22

### Prompt
**Asset loading** before play: placeholders **`background_club`**, **`npc_base`**, **`effect_punch`**; refactor **`NPC.draw`** to **sprites** with **flip** by movement / hit; **world** render with **background first**; **punch particles** + **white hit flash** on damage; update **TO_DO.md** / **PROMPT_LOG.md**.

### Tasks Completed
- **`AssetManager.js`:** **`load(onComplete, onProgress?)`** rasterizes three placeholder canvases to **`Image`** (fallback: raw canvas on decode error); **`get(key)`**; keys **`background_club`** (club entrance / arch / neon), **`npc_base`** (silhouette), **`effect_punch`** (starburst + **POW**).
- **`index.html`:** Script order **`AssetManager.js`** → **`NPCSystem.js`** → **`game.js`**.
- **`game.js`:** **`init`** calls **`AssetManager.load`** then starts the RAF loop; **`drawBackgroundClub()`** (cover + darken) + **`drawWorldOverlay()`** (grid + floor rect); **`NPC.draw`** uses **`ctx.drawImage`** with **`scale(-1,1)`** when **`_facingLeft`** (queue approach, knockout velocity, aggro toward door, **0.14s** **`_hitFacingTimer`** after punch to preserve flip); **CSS filters** for aggro/knockout tint; **screen / brightness** pass for **`_punchFlash`**; vector fallback if asset missing; **`PunchParticle`** + **`effect_punch`** sparks; **`tickCombatFx`** in **`gameLoop`** when playing or paused; clear FX on **shift / menu reset**.
- **Docs:** **`TO_DO.md`** — **Art Asset Integration System** **[x]**; Session 11 note; this entry.

### Status
Sprite pipeline + preload + punch VFX: COMPLETE

---

## Session 12 - 2026-04-22

### Prompt
**Sound** placeholders (**`SoundManager.js`**): bg loop, punch, approve/deny stamps, chaos **>80** alarm; **juice**: CSS **vignette**, canvas **scanlines**, **bouncer station** glow vs **Vibe**; **Shift report** on end screens (earnings, fines, grade **S–F**); finalize **TO_DO** / **PROMPT_LOG**.

### Tasks Completed
- **`SoundManager.js`:** **`play`**, **`startBgMusic` / `stopBgMusic`** (interval + **`console.log`** stand-in for bass loop), **`updateChaosAlarm`** (**`> 80`**), **`register(key,url)`** for **`HTMLAudioElement`** when assets exist; **`sfx_punch`**, **`sfx_stamp_approve`**, **`sfx_stamp_deny`**, **`sfx_alarm`** messages.
- **`index.html` / `style.css`:** **`#screen-vignette`** radial mask; **shift report** tables on win/loss; **`.shift-grade--*`** colors.
- **`game.js`:** **`shiftLegitLetInCount`** / **`shiftMinorLetInCount`**, **`$10`** / **`$50`** economics, **`populateEndScreenReport`**, grade **S/A/B/C/F** (shutdown or loss → **F**); **`updateBouncerStationGlow`** + **`drawScanlines`**; hooks in **`onLetIn`**, **`onDeny`**, **`playCombatSound`**, **`updateHUD`**, **`startShift`** / **`stopShiftAudio`** on end + menu reset.

### Status
Sound hooks + atmosphere + shift report: COMPLETE

---

## Session 13 - 2026-04-22

### Prompt
Replace audio file placeholders with **Web Audio API** synthesis: **`playPunch()`** (low thump + noise), **`playStamp()`** (click/pop), **`playAlarm()`** (repeating oscillating beep for high chaos), **`startMusic()`** (low-pass sawtooth **thump-thump** bass); wire existing game events; update **TO_DO.md** / **PROMPT_LOG.md**.

### Tasks Completed
- **`SoundManager.js`:** Lazy **`AudioContext`** + **`resume()`**; **`scheduleBassThump`** (sawtooth → **lowpass** ~340Hz, decay envelope); **`startMusic` / `stopMusic`** (~1.08s bar, two kicks); **`playAlarm`** alternates **~920 / ~1180 Hz** on **380ms** interval; **`playStamp(true)`** duller deny vs approve; **`play(key)`** maps **`sfx_punch`**, **`sfx_stamp_*`**; **`startBgMusic` / `stopBgMusic`** aliased; **`updateChaosAlarm`** unchanged (**>80**).
- **`game.js`:** No change required — existing **`SoundManager.play`** / **`startBgMusic`** / **`stopBgMusic`** / **`updateChaosAlarm`** calls hit the new synthesis layer.
- **Docs:** **`TO_DO.md`** — **Web Audio API (synthetic SFX & music)** **[x]**; Session 13 note; project summary updated.

### Status
Procedural Web Audio SFX + club bass + chaos alarm: COMPLETE

---

## Session 14 - 2026-04-22

### Prompt
Use **`assets/audio/DavidKBD - Pink Bloom Pack - 02 - Portal to Underworld.ogg`** for music: **Web Audio** **lowpass** (**~400 Hz** muffled vs bypass **clear**); muffled on **menu/outside** behavior via **PAUSED**; **clear** in-club and on **Game Over / Win**; start on **START SHIFT**; update **PROMPT_LOG** / **TO_DO**.

### Tasks Completed
- **`SoundManager.js`:** **`HTMLAudioElement`** loop + **`createMediaElementSource`** → **`BiquadFilterNode`** (**`type: 'lowpass'`**, **`Q` ~0.85**) → **`GainNode`** → destination; **`setMusicMuffled(bool)`** ramps cutoff **400 Hz** vs **22 kHz**; **`startMusic`** resets track and **`play()`** after **`AudioContext.resume()`**; synthetic **thump-thump** removed; SFX unchanged.
- **`game.js`:** **`stopShiftAlarmOnly`** on **win/loss** (music continues, **clear**); **`stopShiftMusicAndAlarm`** on **menu reset**; **ESC pause** → **`setMusicMuffled(true)`**; **resume** → **`false`**; **START SHIFT** still calls **`startBgMusic`** (user gesture).
- **Docs:** **`TO_DO.md`** — **File-based club music** **[x]**; Session 14; project summary below.

### Status
OGG club track + dynamic lowpass routing: COMPLETE

---

## Session 15 - 2026-04-22

### Prompt
**High score** + **shift report**: track **guests let in**, **correct denials**, **mistakes** (bad let-in or legit deny); **`calculateGrade()`** (**S**–**F**, chaos → **F**); **`localStorage`** best guests + best grade; UI on **main menu** / **win** / **loss**; **New High Score** flair; update logs.

### Tasks Completed
- **`game.js`:** **`shiftMistakes`** (**`onLetIn`** if fake/minor, **`onDeny`** if legit); **`shiftCorrectDenials`** on proper deny; **`calculateGrade({ chaosLoss, mistakes, guestsLetIn, guestsProcessed })`** — **S** if **0** mistakes, **`guestsLetIn` ≥ 10**, **`guestsProcessed` ≥ 8**; **A** if **0** mistakes quieter shift; **B/C/D** by **`mistakes / guestsProcessed`** bands (**≤0.1**, **≤0.22**, else **D**); **`loadHighScores` / `persistHighScoresIfBeat` / `updateMainMenuHighScore`**; **`populateEndScreenReport`** fills new DOM ids + money summary + **`refreshEndScreenAllTime`**.
- **`index.html` / `style.css`:** Detailed **shift-report** list; **all-time** footers; **main-high-score** block; **`.new-high-score-badge`**, **`@keyframes new-high-pulse`**, **`flow-panel--new-record`**; **`.shift-grade--d`**.
- **Docs:** **`TO_DO.md`** — **High Score & Shift Report** **[x]**; Session 15; project summary.

### Status
Persistent high score + mistake-based grading + end-screen flair: COMPLETE

---

## Session 16 - 2026-04-22

### Prompt
**Animated sprites** + **layered environment**: NPC **sprite sheet / frame** support, **2-frame walk** (**200ms**) while moving, **bobbing** square fallback; **stage** layers (**club entrance** back, **canvas** mid, **bouncer + velvet rope** fore); **screen shake** on punch + **chaos +10** spike; **dust** at station stop; docs.

### Tasks Completed
- **`AssetManager.js`:** **`background_club_entrance`** (club arch), **`foreground_club`** (podium + stanchions + rope curves), **`npc_walk_a` / `npc_walk_b`** (lean variants from **`drawNpcBaseFrame`**); jobs expanded.
- **`index.html` / `style.css`:** **`#game-stage`** wraps **`#stage-background`**, **`#gameCanvas`**, **`#bouncer-station`**, **`#stage-foreground`**; cover **background-image** layers; canvas **`pointer-events: auto`**.
- **`game.js`:** **`syncStageLayerImages`**, **`drawCanvasBackdropFallback`**; **`getNpcBodyDrawable`** + optional **`spriteFrameKeys`**; walk timing + **`spawnStationDust`** on **`STATE_MOVING` → `STATE_AT_STATION`**; **`StationDustParticle`**; **`triggerScreenShake`** + **`tickScreenShake`** on **`#game-stage`**; chaos **`notifyChaosIncrease`** adds shake for **≥10** / light shake **≥5**; render order: NPCs → dust → combat.
- **Docs:** **`TO_DO.md`** — **Animated Sprites & Environment** **[x]**; Session 16; project summary.

### Status
Layered club scene + walk cycle + shake/dust juice: COMPLETE

---

## Session 17 - 2026-04-22

### Prompt
**VIP system** (**10%**, visuals, **2× vibe** + **−5 chaos** on good let-in, complex ID); **timed house rules** (sticky **60s** then **21+ only** or **no Sector 7**); **+20 chaos** on rule break; **synthetic VIP chime**; shift report **VIP** count; docs.

### Tasks Completed
- **`NPCSystem.js`:** **`isVip`** (**`Math.random() < 0.1`**), **`idSector`** (1–12), long **`idNumber`** + **`vipAnnexLine`** for VIPs.
- **`game.js`:** **`getDailyRuleMode`**, **`tickDailyRuleTransition`**, **`letInViolatesDailyRule`**, **`onLetIn`** refactored (**`isDocBad` / `ruleBlocked` / `successfulLetIn`**); **`shiftVipSuccessCount`**; **`spawnNPC`** VIP chime; HUD **`updateDailyRuleHud`** + toast; **`showInspection`** sector / VIP UI; end report **`report-vip-*`**.
- **`SoundManager.js`:** **`playVipChime`** (stacked sines + shimmer), **`play('sfx_vip_chime')`**.
- **`index.html` / `style.css`:** Sticky **`#hud-daily-rule`**, **`#rule-change-toast`**, VIP ribbon + **`id-card--vip`**, **`inspect-sector`**, annex block.
- **Docs:** **`TO_DO.md`** — **VIPs & Special Rules** **[x]**; Session 17; project summary.

### Status
VIP rewards + rotating entry law + rule violation chaos: COMPLETE

---

## Session 18 - 2026-04-22

### Prompt
**Physical traits** on NPCs vs **ID Description**; **30%** fake IDs get one wrong **`idHair` / `idPiercings` / `idVibe`**; **Let In** mismatch → **chaos**; **TRAIT MISMATCH** deny; **procedural** hair / piercings / vibe **silhouette** on **`NPC.draw`**; docs.

### Tasks Completed
- **`NPCSystem.js`:** **`HAIR_STYLES`**, **`VIBE_TYPES`**, **`HAIR_HEX`**; per NPC **`hairStyle`**, **`hasPiercings`**, **`vibeType`** + parallel **`id*`** fields; on **`!isValidID`** **30%** flip one trait on ID only.
- **`game.js`:** **`idTraitsMismatchActual`**, **`formatIdDescriptionForCard`**, **`drawNpcTraitOverlays`**, **`TRAIT_MISMATCH_LET_IN_CHAOS`** (**12**); **`onLetIn`** requires trait match for **successful** entry; **`finalizeDeny`** + **`onTraitMismatchDeny`**; NPC constructor trait defaults.
- **`index.html` / `style.css`:** **Description** field; **`btn-trait-mismatch`** (full-width row).
- **Docs:** **`TO_DO.md`** — **Character Traits & Match Mechanic** **[x]**; Session 18; project summary.

### Status
Trait inspection + discrepancy denies + canvas read: COMPLETE

---

## Session 19 - 2026-04-22

### Prompt
**Slot-based queue** (**`QUEUE_SPACING`**, **`STATE_QUEUED`**), **`x = STATION_X - index * spacing`**; **aggro** steps down (**`+y`**), leaves line; **shuffle** on remove; **click** prioritizes **AGGRESSIVE**; **draw** aggro on top + scale + red stroke; docs.

### Tasks Completed
- **`game.js`:** **`QUEUE_SPACING` (60)**, **`STATE_QUEUED`**, **`assignQueueOrder` / `queueOrderSeq`**, **`getOrderedLineNpcs`**, **`isNpcLineFront`**; **`repositionStationQueue`** assigns **`npc.x = cx - i * QUEUE_SPACING`** and promotes/demotes head vs **QUEUED**; movers target **`stopX = cx - slotIndex * QUEUE_SPACING`**; **`removeNpc`** → **`repositionStationQueue`**; **aggro** **`AGGRO_QUEUE_STEP_Y` (50)** on deny; **`onCanvasClick`** aggro pass first; **`render`** draws aggro last; **`NPC.draw`** **`AGGRO_DRAW_SCALE` (1.08)** + **`#ff1744`** stroke; inspect / **E** only when **`isNpcLineFront`**.
- **Docs:** **`TO_DO.md`** — **Slot-Based Queueing** **[x]**; Session 19; project summary.

### Status
Line slots + combat offset + hit priority: COMPLETE

---

## Project summary — The Velvet Rope (bouncer shift simulator)

Vanilla **HTML5 Canvas** + **DOM** UI: **NPCSystem** generates guests (IDs, minors, **sectors**, **VIP** 10%, **hair / piercings / vibe** + ID **description** fields; **fake** IDs may **misprint one trait** vs the guest); **slot queue** at the **bouncer station** (**`STATE_QUEUED`**, **`QUEUE_SPACING`** along **−X** from door center; **aggro** steps toward camera and is **click-prioritized**); **PVC ID card** inspection (drag, seal, shape portraits, **VIP** ribbon / aux line, **Description**); **Let In / Deny / Trait mismatch** drives **Vibe** & **Chaos** (wrong let-in on **trait mismatch** adds **chaos**); **VIP** clean let-in = **double vibe** + **chaos** tick down; **after 60s** a **house rule** flips (**21+ only** or **no Sector 7**) with HUD sticky + toast — violating on **Let In** adds **+20 chaos**; deny can turn **aggressive** with **punch** combat and **particles**; **Call Security** tactical cooldown; **difficulty** scales every **30s**; **AssetManager** — **club entrance** + **foreground** (ropes / podium) + **two-frame NPC walk** + **POW**; **game stage** layers (**CSS** back / **canvas** characters & FX / **CSS** fore); **NPC** overlays (**hair cap**, **piercing studs**, **Punk / Goth / Cyber** silhouette); **screen shake** on punch and large **chaos** spikes; **dust** puffs when guests halt at the rope; **SoundManager** — procedural **SFX** (punch, stamps, chaos alarm, **VIP chime**) plus **DavidKBD *Portal to Underworld*** loop routed through a **lowpass** (muffled when **paused**, full on shift + end screens); **flow** menu / pause / win / loss with **shift report** (incl. **VIPs OK**), **mistake-based grades**, and **localStorage** high scores (**most guests processed** + **best letter grade**); **vignette**, **scanlines**, and **vibe-synced** door glow for polish.