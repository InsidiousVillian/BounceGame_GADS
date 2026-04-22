// ═══════════════════════════════════════════════════════════════════════════════
// Declarations
// ═══════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameStage = document.getElementById('game-stage');
const stageBackgroundEl = document.getElementById('stage-background');
const stageForegroundEl = document.getElementById('stage-foreground');

const STATION_W = 160;
const STATION_H = 160;

const STATE_MOVING = 'moving';
const STATE_AT_STATION = 'atStation';
const STATE_INSPECTING = 'inspecting';
const STATE_AGGRESSIVE = 'aggressive';
const STATE_KNOCKOUT = 'knockout';

/** App / session flow */
const STATUS = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  WIN: 'WIN',
};

const AGGRO_CHAOS_PER_SEC = 0.1;
const NPC_MAX_HEALTH = 3;
const KNOCKOUT_SPEED = 520;
const SHIFT_LENGTH_SEC = 120;
const BASE_SPAWN_MS = 6000;
const SPAWN_MS_STEP = 1000;
const MIN_SPAWN_MS = 2000;
const DIFFICULTY_INTERVAL_SEC = 30;
const AGGRO_BONUS_PER_TIER = 0.1;
const SECURITY_COOLDOWN_SEC = 15;
const SECURITY_CHAOS_REDUCE = 25;
const SECURITY_VIBE_COST = 20;
const SHIFT_EARN_PER_LEGIT_LET_IN = 10;
const SHIFT_FINE_MINOR_LET_IN = 50;
const LS_HIGH_GUESTS = 'velvetRope_mostGuestsProcessed';
const LS_BEST_GRADE = 'velvetRope_bestGrade';
/** S tier: flawless + busy shift */
const GRADE_S_MIN_LET_IN = 10;
const GRADE_S_MIN_HANDLED = 8;
const DAILY_RULE_STANDARD_SEC = 60;
const RULE_STANDARD = 'standard';
const RULE_NO_MINORS = 'no_minors';
const RULE_NO_SECTOR_7 = 'no_sector_7';
const RULE_VIOLATION_CHAOS = 20;
const NPC_WALK_FRAME_MS = 200;
const SCREEN_SHAKE_DECAY = 0.82;
const SCREEN_SHAKE_MAX = 14;

const GameState = {
  vibe: 50,
  chaos: 0,
  activeNpc: null,
  isPaused: false,
  currentStatus: STATUS.MENU,

  clamp(val, min = 0, max = 100) {
    return Math.max(min, Math.min(max, val));
  },

  addVibe(amount) {
    this.vibe = this.clamp(this.vibe + amount);
    updateHUD();
  },

  addChaos(amount) {
    if (amount <= 0) return;
    this.chaos = this.clamp(this.chaos + amount);
    updateHUD();
    notifyChaosIncrease(amount);
    checkGameOverChaos();
  },

  addChaosPassive(amount) {
    if (amount <= 0) return;
    this.chaos = this.clamp(this.chaos + amount);
    updateHUD();
    checkGameOverChaos();
  },

  /** Tactical reduction (e.g. Call Security) — no chaos spike VFX */
  reduceChaos(amount) {
    if (amount <= 0) return;
    this.chaos = this.clamp(this.chaos - amount);
    updateHUD();
  },

  spendVibe(amount) {
    if (amount <= 0) return;
    this.vibe = this.clamp(this.vibe - amount);
    updateHUD();
  },
};

let npcs = [];
let shiftTimerRemaining = SHIFT_LENGTH_SEC;
let guestsProcessed = 0;
let guestsLetIn = 0;
let guestsDenied = 0;
let shiftLegitLetInCount = 0;
let shiftMinorLetInCount = 0;
let shiftCorrectDenials = 0;
let shiftMistakes = 0;
let shiftVipSuccessCount = 0;
let dailyRuleTransitionDone = false;
/** @type {'no_minors'|'no_sector_7'} active after first 60s */
let dailyRuleSpecialMode = RULE_NO_MINORS;
/** @type {ReturnType<typeof setTimeout>|null} */
let ruleToastHideId = null;
let stationPulsePhase = 0;
let securityCooldownRemaining = 0;
let appliedDifficultyTier = -1;
let currentSpawnIntervalMs = BASE_SPAWN_MS;

const GRUNGE_PALETTE = [
  '#5d6d5a', '#4a5d52', '#5c6b58', '#6b7d6a',
  '#5c4d6b', '#5a4f66', '#6a5d7a', '#4a3f5c',
  '#6b6b6b', '#5a5a5c', '#7a7570', '#4f4f52',
];

const MAX_NPCS = 14;

const punchParticles = [];
const punchSparks = [];
const stationDustParticles = [];

let screenShakeMagnitude = 0;

const gameHudWrap = document.getElementById('game-hud-wrap');
const timerSecondsDisplay = document.getElementById('timer-seconds-display');
const guestLetInEl = document.getElementById('guest-let-in');
const guestDeniedEl = document.getElementById('guest-denied');
const btnCallSecurity = document.getElementById('btn-call-security');
const securityCdOverlay = document.getElementById('security-cd-overlay');
const vibeBar = document.getElementById('vibe-bar');
const chaosBar = document.getElementById('chaos-bar');
const hudEl = document.getElementById('hud');
const bouncerStation = document.getElementById('bouncer-station');
const stationLabelEl = bouncerStation ? bouncerStation.querySelector('.station-label') : null;

const mainMenu = document.getElementById('main-menu');
const pauseMenu = document.getElementById('pause-menu');
const gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen');
const btnStartShift = document.getElementById('btn-start-shift');
const btnResume = document.getElementById('btn-resume');
const btnRetryLoss = document.getElementById('btn-retry-loss');
const btnRetryWin = document.getElementById('btn-retry-win');
const gameOverGuestsEl = document.getElementById('game-over-guests');
const winGuestsEl = document.getElementById('win-guests');

const inspectionMenu = document.getElementById('inspection-menu');
const inspectPortraitHost = document.getElementById('inspect-portrait-host');
const inspectSecuritySeal = document.getElementById('inspect-security-seal');
const inspectIdNumber = document.getElementById('inspect-id-number');
const inspectName = document.getElementById('inspect-name');
const inspectAge = document.getElementById('inspect-age');
const inspectValidity = document.getElementById('inspect-id-validity');
const inspectReason = document.getElementById('inspect-reason');
const idCardDragHandle = document.getElementById('id-card-drag-handle');
const btnLetIn = document.getElementById('btn-let-in');
const btnDeny = document.getElementById('btn-deny');

let spawnIntervalId = null;
let lastFrameTime = 0;

const inspectMenuDrag = { active: false, offsetX: 0, offsetY: 0 };

function getAssetImage(key) {
  if (typeof AssetManager === 'undefined' || !AssetManager.get) return null;
  const img = AssetManager.get(key);
  if (!img) return null;
  if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) return img;
  if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)
    return img;
  return null;
}

function drawableToCssUrl(drawable) {
  if (!drawable) return '';
  if (typeof HTMLCanvasElement !== 'undefined' && drawable instanceof HTMLCanvasElement) {
    try {
      return drawable.toDataURL('image/png');
    } catch (_) {
      return '';
    }
  }
  if (typeof HTMLImageElement !== 'undefined' && drawable instanceof HTMLImageElement && drawable.src) return drawable.src;
  return '';
}

function syncStageLayerImages() {
  const bgDraw = getAssetImage('background_club_entrance');
  const fgDraw = getAssetImage('foreground_club');
  const bgUrl = drawableToCssUrl(bgDraw);
  const fgUrl = drawableToCssUrl(fgDraw);
  if (stageBackgroundEl && bgUrl) {
    stageBackgroundEl.style.backgroundImage = `url("${bgUrl}")`;
  }
  if (stageForegroundEl && fgUrl) {
    stageForegroundEl.style.backgroundImage = `url("${fgUrl}")`;
  }
}

function triggerScreenShake(amount = 4) {
  const a = Math.max(0, amount);
  screenShakeMagnitude = Math.min(SCREEN_SHAKE_MAX, screenShakeMagnitude + a);
}

function tickScreenShake(dt) {
  if (screenShakeMagnitude < 0.05) {
    screenShakeMagnitude = 0;
    if (gameStage) gameStage.style.transform = '';
    return;
  }
  screenShakeMagnitude *= Math.pow(SCREEN_SHAKE_DECAY, dt * 60);
  const px = screenShakeMagnitude;
  const sx = (Math.random() * 2 - 1) * px;
  const sy = (Math.random() * 2 - 1) * px;
  if (gameStage) gameStage.style.transform = `translate(${sx}px, ${sy}px)`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Flow & session
// ═══════════════════════════════════════════════════════════════════════════════

function isPlayingSession() {
  return GameState.currentStatus === STATUS.PLAYING;
}

function clearSpawnInterval() {
  if (spawnIntervalId) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
  }
}

function getShiftElapsedSec() {
  return Math.max(0, SHIFT_LENGTH_SEC - shiftTimerRemaining);
}

function getDailyRuleMode() {
  if (getShiftElapsedSec() < DAILY_RULE_STANDARD_SEC) return RULE_STANDARD;
  return dailyRuleSpecialMode;
}

function resetDailyRuleState() {
  dailyRuleTransitionDone = false;
  dailyRuleSpecialMode = RULE_NO_MINORS;
  if (ruleToastHideId != null) {
    clearTimeout(ruleToastHideId);
    ruleToastHideId = null;
  }
  const toast = document.getElementById('rule-change-toast');
  if (toast) {
    toast.classList.remove('rule-change-toast--visible');
    toast.textContent = '';
  }
  updateDailyRuleHud();
}

function updateDailyRuleHud() {
  const el = document.getElementById('hud-daily-rule-text');
  if (!el) return;
  const mode = getDailyRuleMode();
  if (mode === RULE_STANDARD) {
    el.textContent = 'Standard Entry — valid adults only; watch for fakes & minors';
  } else if (mode === RULE_NO_MINORS) {
    el.textContent = '21+ ONLY — no minors on the list tonight';
  } else {
    el.textContent = 'No IDs from SECTOR 7 — deny even if the card looks clean';
  }
}

function tickDailyRuleTransition() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  if (dailyRuleTransitionDone) return;
  if (getShiftElapsedSec() < DAILY_RULE_STANDARD_SEC) return;
  dailyRuleTransitionDone = true;
  dailyRuleSpecialMode = Math.random() < 0.5 ? RULE_NO_MINORS : RULE_NO_SECTOR_7;
  updateDailyRuleHud();
  showRuleChangeToast();
}

function showRuleChangeToast() {
  const el = document.getElementById('rule-change-toast');
  if (!el) return;
  const msg =
    dailyRuleSpecialMode === RULE_NO_MINORS
      ? 'NEW RULE: NO MINORS ALLOWED (21+ ONLY)'
      : 'NEW RULE: NO IDs FROM SECTOR 7';
  el.textContent = msg;
  el.classList.add('rule-change-toast--visible');
  if (ruleToastHideId != null) clearTimeout(ruleToastHideId);
  ruleToastHideId = setTimeout(() => {
    el.classList.remove('rule-change-toast--visible');
    ruleToastHideId = null;
  }, 4500);
}

/**
 * Letting this guest in violates the active (post-60s) house rule.
 */
function letInViolatesDailyRule(npc) {
  const mode = getDailyRuleMode();
  if (mode === RULE_STANDARD) return false;
  if (mode === RULE_NO_MINORS && npc.isMinor) return true;
  if (mode === RULE_NO_SECTOR_7 && npc.idSector === 7) return true;
  return false;
}

function getDifficultyTier() {
  return Math.floor(getShiftElapsedSec() / DIFFICULTY_INTERVAL_SEC);
}

function getSpawnIntervalForTier(tier) {
  return Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - tier * SPAWN_MS_STEP);
}

function getAggressionBonusForTier(tier) {
  return tier * AGGRO_BONUS_PER_TIER;
}

function restartSpawnIntervalWithCurrentTier() {
  clearSpawnInterval();
  currentSpawnIntervalMs = getSpawnIntervalForTier(appliedDifficultyTier);
  spawnIntervalId = setInterval(() => {
    if (GameState.currentStatus === STATUS.PLAYING) spawnNPC();
  }, currentSpawnIntervalMs);
}

function syncDifficultyScaling() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  const tier = getDifficultyTier();
  if (tier === appliedDifficultyTier) return;
  appliedDifficultyTier = tier;
  restartSpawnIntervalWithCurrentTier();
}

function startSpawnInterval() {
  appliedDifficultyTier = getDifficultyTier();
  restartSpawnIntervalWithCurrentTier();
}

function stopShiftAlarmOnly() {
  if (typeof SoundManager !== 'undefined' && SoundManager.stopAlarm) SoundManager.stopAlarm();
}

function stopShiftMusicAndAlarm() {
  if (typeof SoundManager !== 'undefined') {
    if (SoundManager.stopAlarm) SoundManager.stopAlarm();
    if (SoundManager.stopBgMusic) SoundManager.stopBgMusic();
  }
}

function syncChaosAlarmFromHud() {
  if (typeof SoundManager !== 'undefined' && SoundManager.updateChaosAlarm) {
    SoundManager.updateChaosAlarm(GameState.chaos);
  }
}

function updateBouncerStationGlow(dt) {
  if (!bouncerStation) return;
  const step = typeof dt === 'number' && dt > 0 ? dt : 0.016;
  stationPulsePhase += step * (1.15 + GameState.vibe * 0.018);
  const pulse = 0.52 + 0.48 * Math.sin(stationPulsePhase);
  const t = GameState.vibe / 100;
  const hue = 265 + t * 85;
  const sat = 62 + t * 28;
  const light = 52 + t * 10;
  const borderA = 0.52 + pulse * t * 0.43;
  const glowOut = (0.18 + t * 0.82) * pulse;
  const insetA = 0.08 + t * 0.22 + pulse * 0.12;
  bouncerStation.style.borderColor = `hsla(${hue}, ${sat}%, ${light}%, ${borderA})`;
  bouncerStation.style.boxShadow = `0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 48px hsla(${hue}, ${sat}%, 42%, ${insetA}), 0 0 ${24 + glowOut * 52}px hsla(${hue}, ${sat}%, 55%, ${glowOut * 0.85})`;
  if (stationLabelEl) {
    stationLabelEl.style.color = `hsl(${hue}, ${sat}%, ${72 + t * 8}%)`;
    stationLabelEl.style.textShadow = `0 0 ${10 + glowOut * 14}px hsla(${hue}, ${sat}%, 55%, ${0.45 + glowOut * 0.35})`;
  }
}

function computeShiftEconomics() {
  const earnings = shiftLegitLetInCount * SHIFT_EARN_PER_LEGIT_LET_IN;
  const fines = shiftMinorLetInCount * SHIFT_FINE_MINOR_LET_IN;
  const net = earnings - fines;
  return { earnings, fines, net };
}

function gradeRank(letter) {
  const r = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
  return r[letter] ?? 0;
}

/**
 * F if chaos shutdown. S = 0 mistakes & strong guest volume. A–D from mistake ratio vs guests processed.
 */
function calculateGrade({ chaosLoss, mistakes, guestsLetIn, guestsProcessed }) {
  if (chaosLoss) return 'F';
  const denom = Math.max(1, guestsProcessed);
  const ratio = mistakes / denom;
  if (mistakes === 0 && guestsLetIn >= GRADE_S_MIN_LET_IN && guestsProcessed >= GRADE_S_MIN_HANDLED) return 'S';
  if (mistakes === 0) return 'A';
  if (ratio <= 0.1) return 'B';
  if (ratio <= 0.22) return 'C';
  return 'D';
}

function loadHighScores() {
  try {
    const raw = parseInt(localStorage.getItem(LS_HIGH_GUESTS) || '0', 10);
    const guests = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    let grade = (localStorage.getItem(LS_BEST_GRADE) || 'F').toUpperCase().trim();
    const valid = new Set(['S', 'A', 'B', 'C', 'D', 'F']);
    if (!valid.has(grade)) grade = 'F';
    return { guests, grade };
  } catch (_) {
    return { guests: 0, grade: 'F' };
  }
}

function persistHighScoresIfBeat(guestsCount, grade) {
  try {
    const prev = loadHighScores();
    const beatGuests = guestsCount > prev.guests;
    const beatGrade = gradeRank(grade) > gradeRank(prev.grade);
    if (beatGuests) localStorage.setItem(LS_HIGH_GUESTS, String(guestsCount));
    if (beatGrade) localStorage.setItem(LS_BEST_GRADE, grade);
    return beatGuests || beatGrade;
  } catch (_) {
    return false;
  }
}

function updateMainMenuHighScore() {
  const { guests, grade } = loadHighScores();
  const mg = document.getElementById('menu-high-guests');
  const mgr = document.getElementById('menu-high-grade');
  if (mg) mg.textContent = String(guests);
  if (mgr) {
    mgr.textContent = grade;
    setShiftGradeClass(mgr, grade);
  }
}

function refreshEndScreenAllTime(screenKey) {
  const { guests, grade } = loadHighScores();
  const gid = screenKey === 'win' ? 'win-all-time-guests' : 'loss-all-time-guests';
  const rid = screenKey === 'win' ? 'win-all-time-grade' : 'loss-all-time-grade';
  const gEl = document.getElementById(gid);
  const rEl = document.getElementById(rid);
  if (gEl) gEl.textContent = String(guests);
  if (rEl) rEl.textContent = grade;
}

function formatShiftMoney(n) {
  const v = Math.round(Math.abs(n));
  return `${n < 0 ? '-' : ''}$${v}`;
}

function setShiftGradeClass(el, grade) {
  if (!el) return;
  const g = (grade || 'F').toUpperCase();
  el.classList.remove('shift-grade--s', 'shift-grade--a', 'shift-grade--b', 'shift-grade--c', 'shift-grade--d', 'shift-grade--f');
  el.classList.add(`shift-grade--${g.toLowerCase()}`);
}

function populateEndScreenReport(screenKey, chaosShutdown) {
  const grade = calculateGrade({
    chaosLoss: chaosShutdown,
    mistakes: shiftMistakes,
    guestsLetIn,
    guestsProcessed,
  });

  const letInEl = document.getElementById(`report-let-in-${screenKey}`);
  const mistEl = document.getElementById(`report-mistakes-${screenKey}`);
  const vipRep = document.getElementById(`report-vip-${screenKey}`);
  const gg = document.getElementById(`report-grade-${screenKey}`);
  if (letInEl) letInEl.textContent = String(guestsLetIn);
  if (mistEl) mistEl.textContent = String(shiftMistakes);
  if (vipRep) vipRep.textContent = String(shiftVipSuccessCount);
  if (gg) {
    gg.textContent = grade;
    setShiftGradeClass(gg, grade);
  }

  const { earnings, fines, net } = computeShiftEconomics();
  const ge = document.getElementById(`report-earnings-${screenKey}`);
  const gf = document.getElementById(`report-fines-${screenKey}`);
  const gn = document.getElementById(`report-net-${screenKey}`);
  if (ge) ge.textContent = formatShiftMoney(earnings);
  if (gf) gf.textContent = fines > 0 ? `-$${Math.round(fines)}` : '$0';
  if (gn) {
    gn.textContent = formatShiftMoney(net);
    gn.style.color = net >= 0 ? '#b9f6ca' : '#ff8a80';
  }

  const newRecord = persistHighScoresIfBeat(guestsProcessed, grade);
  const panelId = screenKey === 'win' ? 'win-panel' : 'game-over-panel';
  const badgeId = screenKey === 'win' ? 'win-new-high-badge' : 'loss-new-high-badge';
  const panel = document.getElementById(panelId);
  const badge = document.getElementById(badgeId);
  if (panel) {
    panel.classList.remove('flow-panel--new-record');
    if (newRecord) panel.classList.add('flow-panel--new-record');
  }
  if (badge) badge.classList.toggle('hidden', !newRecord);

  refreshEndScreenAllTime(screenKey);
  updateMainMenuHighScore();
}

function updateTimerAndGuestHud() {
  if (timerSecondsDisplay) {
    timerSecondsDisplay.textContent = String(Math.max(0, Math.ceil(shiftTimerRemaining)));
  }
  if (guestLetInEl) guestLetInEl.textContent = String(guestsLetIn);
  if (guestDeniedEl) guestDeniedEl.textContent = String(guestsDenied);
  updateSecurityButton();
}

function updateSecurityButton() {
  if (!btnCallSecurity || !securityCdOverlay) return;
  const onCd = securityCooldownRemaining > 0;
  const canAfford = GameState.vibe >= SECURITY_VIBE_COST;
  const playable = GameState.currentStatus === STATUS.PLAYING && !GameState.isPaused;
  btnCallSecurity.disabled = !playable || onCd || !canAfford;
  const pct = onCd ? (securityCooldownRemaining / SECURITY_COOLDOWN_SEC) * 100 : 0;
  securityCdOverlay.style.height = `${pct}%`;
  btnCallSecurity.classList.toggle('on-cooldown', onCd);
}

function callSecurity() {
  if (!isPlayingSession() || GameState.isPaused) return;
  if (securityCooldownRemaining > 0) return;
  if (GameState.vibe < SECURITY_VIBE_COST) return;

  GameState.spendVibe(SECURITY_VIBE_COST);
  GameState.reduceChaos(SECURITY_CHAOS_REDUCE);
  securityCooldownRemaining = SECURITY_COOLDOWN_SEC;
  updateSecurityButton();
}

function tickSecurityCooldown(dt) {
  if (securityCooldownRemaining <= 0) return;
  securityCooldownRemaining = Math.max(0, securityCooldownRemaining - dt);
  updateSecurityButton();
}

function showMainMenu() {
  mainMenu.classList.remove('hidden');
}

function hideMainMenu() {
  mainMenu.classList.add('hidden');
}

function showGameHud() {
  gameHudWrap.classList.remove('hidden');
}

function hideGameHud() {
  gameHudWrap.classList.add('hidden');
}

function showPauseMenu() {
  pauseMenu.classList.remove('hidden');
}

function hidePauseMenu() {
  pauseMenu.classList.add('hidden');
}

function hideEndScreens() {
  gameOverScreen.classList.add('hidden');
  winScreen.classList.add('hidden');
}

function checkGameOverChaos() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  if (GameState.chaos >= 100) triggerGameOver();
}

function triggerGameOver() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  GameState.currentStatus = STATUS.GAMEOVER;
  clearSpawnInterval();
  hideInspectionForPause();
  hidePauseMenu();
  hideMainMenu();
  stopShiftAlarmOnly();
  if (typeof SoundManager !== 'undefined' && SoundManager.setMusicMuffled) SoundManager.setMusicMuffled(false);
  gameOverGuestsEl.textContent = String(guestsProcessed);
  populateEndScreenReport('loss', true);
  gameOverScreen.classList.remove('hidden');
}

function triggerWin() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  GameState.currentStatus = STATUS.WIN;
  clearSpawnInterval();
  hideInspectionForPause();
  hidePauseMenu();
  hideMainMenu();
  stopShiftAlarmOnly();
  if (typeof SoundManager !== 'undefined' && SoundManager.setMusicMuffled) SoundManager.setMusicMuffled(false);
  winGuestsEl.textContent = String(guestsProcessed);
  populateEndScreenReport('win', false);
  winScreen.classList.remove('hidden');
}

function resetSessionToMenu() {
  clearSpawnInterval();
  npcs.length = 0;
  GameState.vibe = 50;
  GameState.chaos = 0;
  GameState.activeNpc = null;
  GameState.isPaused = false;
  GameState.currentStatus = STATUS.MENU;
  shiftTimerRemaining = SHIFT_LENGTH_SEC;
  guestsProcessed = 0;
  guestsLetIn = 0;
  guestsDenied = 0;
  shiftLegitLetInCount = 0;
  shiftMinorLetInCount = 0;
  shiftCorrectDenials = 0;
  shiftMistakes = 0;
  shiftVipSuccessCount = 0;
  resetDailyRuleState();
  stationPulsePhase = 0;
  securityCooldownRemaining = 0;
  appliedDifficultyTier = -1;
  currentSpawnIntervalMs = BASE_SPAWN_MS;
  lastFrameTime = 0;

  inspectionMenu.classList.add('hidden');
  resetInspectionMenuLayout();
  punchParticles.length = 0;
  punchSparks.length = 0;
  stationDustParticles.length = 0;
  screenShakeMagnitude = 0;
  if (gameStage) gameStage.style.transform = '';
  stopShiftMusicAndAlarm();
  hidePauseMenu();
  hideEndScreens();
  hideGameHud();
  showMainMenu();

  updateHUD();
  updateTimerAndGuestHud();
  repositionStationQueue();
  updateMainMenuHighScore();
}

function startShift() {
  hideEndScreens();
  hideMainMenu();
  hidePauseMenu();

  npcs.length = 0;
  GameState.vibe = 50;
  GameState.chaos = 0;
  GameState.activeNpc = null;
  GameState.isPaused = false;
  GameState.currentStatus = STATUS.PLAYING;
  shiftTimerRemaining = SHIFT_LENGTH_SEC;
  guestsProcessed = 0;
  guestsLetIn = 0;
  guestsDenied = 0;
  shiftLegitLetInCount = 0;
  shiftMinorLetInCount = 0;
  shiftCorrectDenials = 0;
  shiftMistakes = 0;
  shiftVipSuccessCount = 0;
  resetDailyRuleState();
  stationPulsePhase = 0;
  securityCooldownRemaining = 0;
  appliedDifficultyTier = -1;
  currentSpawnIntervalMs = BASE_SPAWN_MS;
  lastFrameTime = 0;

  inspectionMenu.classList.add('hidden');
  resetInspectionMenuLayout();
  punchParticles.length = 0;
  punchSparks.length = 0;
  stationDustParticles.length = 0;
  screenShakeMagnitude = 0;
  if (gameStage) gameStage.style.transform = '';
  if (typeof SoundManager !== 'undefined' && SoundManager.startBgMusic) SoundManager.startBgMusic();
  showGameHud();
  updateHUD();
  updateTimerAndGuestHud();
  repositionStationQueue();

  startSpawnInterval();
  spawnNPC();
}

function togglePause() {
  if (GameState.currentStatus === STATUS.PLAYING) {
    GameState.currentStatus = STATUS.PAUSED;
    hideInspectionForPause();
    showPauseMenu();
    if (typeof SoundManager !== 'undefined' && SoundManager.setMusicMuffled) SoundManager.setMusicMuffled(true);
  } else if (GameState.currentStatus === STATUS.PAUSED) {
    GameState.currentStatus = STATUS.PLAYING;
    hidePauseMenu();
    if (typeof SoundManager !== 'undefined' && SoundManager.setMusicMuffled) SoundManager.setMusicMuffled(false);
  }
}

function resumeFromPause() {
  if (GameState.currentStatus === STATUS.PAUSED) {
    GameState.currentStatus = STATUS.PLAYING;
    hidePauseMenu();
    if (typeof SoundManager !== 'undefined' && SoundManager.setMusicMuffled) SoundManager.setMusicMuffled(false);
  }
}

function hideInspectionForPause() {
  inspectionMenu.classList.add('hidden');
  resetInspectionMenuLayout();
  if (GameState.activeNpc && GameState.activeNpc.state === STATE_INSPECTING) {
    GameState.activeNpc.state = STATE_AT_STATION;
  }
  GameState.activeNpc = null;
  GameState.isPaused = false;
  repositionStationQueue();
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (GameState.currentStatus === STATUS.PLAYING || GameState.currentStatus === STATUS.PAUSED) {
      e.preventDefault();
      togglePause();
    }
    return;
  }
  if (e.code === 'Space' || e.key === ' ') {
    if (GameState.currentStatus === STATUS.PLAYING && !GameState.isPaused) {
      e.preventDefault();
      callSecurity();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playCombatSound() {
  if (typeof SoundManager !== 'undefined' && SoundManager.play) SoundManager.play('sfx_punch');
  else console.log('POW!');
}

function isLegitGuest(npc) {
  return npc.isValidID === true && npc.isMinor === false;
}

function formatValidityLine(npc) {
  let base;
  if (!npc.isValidID) base = { text: 'FORGED — FAKE ID', cls: 'field-value field-value--fake' };
  else if (npc.isMinor) base = { text: 'VALID ID — MINOR (UNDER 21)', cls: 'field-value field-value--legit field-value--minor-warn' };
  else base = { text: 'VERIFIED — LEGIT', cls: 'field-value field-value--legit' };
  if (npc.isVip) {
    return { text: `${base.text} · VIP LISTING`, cls: `${base.cls} field-value--vip-tag` };
  }
  return base;
}

function sealSvgValid() {
  const gid = `g${Math.random().toString(36).slice(2, 10)}`;
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${gid}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8e1"/><stop offset="45%" stop-color="#ffc107"/><stop offset="100%" stop-color="#ff8f00"/>
    </linearGradient>
    <filter id="${gid}-glow"><feGaussianBlur stdDeviation="1.05" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <path d="M20 3 L35 8.5 V19.5 Q35 29 20 36 Q5 29 5 19.5 V8.5 Z" fill="url(#${gid}-gold)" filter="url(#${gid}-glow)" stroke="#5d4037" stroke-width="0.75"/>
  <path d="M20 13 L21.6 17 L26 17.5 L22.6 20.4 L23.6 25 L20 22.8 L16.4 25 L17.4 20.4 L14 17.5 L18.4 17 Z" fill="#fffde7" opacity="0.95"/>
</svg>`;
}

function sealSvgBroken() {
  const id = `b${Math.random().toString(36).slice(2, 9)}`;
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-r" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff7961"/><stop offset="100%" stop-color="#b71c1c"/>
    </linearGradient>
  </defs>
  <path d="M20 3 L35 8.5 V19.5 Q35 29 20 36 Q5 29 5 19.5 V8.5 Z" fill="url(#${id}-r)" stroke="#3e2723" stroke-width="0.75" opacity="0.93"/>
  <path d="M9 11 L30 27 M30 11 L9 27" stroke="#3e2723" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
</svg>`;
}

function applySecuritySeal(el, variant) {
  if (!el) return;
  const v = variant === 'broken' || variant === 'missing' ? variant : 'valid';
  el.className = 'inspect-seal inspect-seal--' + v;
  if (v === 'valid') el.innerHTML = sealSvgValid();
  else if (v === 'broken') el.innerHTML = sealSvgBroken();
  else el.innerHTML = '<span class="inspect-seal-missing-label">NO HOLOGRAM</span>';
}

function resetInspectMenuDragListeners() {
  inspectMenuDrag.active = false;
  if (idCardDragHandle) idCardDragHandle.classList.remove('is-dragging');
  document.removeEventListener('mousemove', onInspectDragMove);
  document.removeEventListener('mouseup', onInspectDragEnd);
}

function resetInspectionMenuLayout() {
  if (!inspectionMenu) return;
  resetInspectMenuDragListeners();
  inspectionMenu.classList.remove('id-card-dragging-mode');
  inspectionMenu.style.left = '';
  inspectionMenu.style.top = '';
}

function ensureInspectMenuPixelPosition() {
  if (!inspectionMenu || inspectionMenu.classList.contains('id-card-dragging-mode')) return;
  const rect = inspectionMenu.getBoundingClientRect();
  inspectionMenu.classList.add('id-card-dragging-mode');
  inspectionMenu.style.transform = 'none';
  inspectionMenu.style.left = `${rect.left}px`;
  inspectionMenu.style.top = `${rect.top}px`;
}

function clampInspectMenuPosition(left, top) {
  const pad = 10;
  const w = inspectionMenu.offsetWidth || 320;
  const h = inspectionMenu.offsetHeight || 280;
  const maxL = Math.max(pad, window.innerWidth - w - pad);
  const maxT = Math.max(pad, window.innerHeight - h - pad);
  return {
    left: Math.max(pad, Math.min(left, maxL)),
    top: Math.max(pad, Math.min(top, maxT)),
  };
}

function onInspectDragStart(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  ensureInspectMenuPixelPosition();
  const rect = inspectionMenu.getBoundingClientRect();
  inspectMenuDrag.active = true;
  inspectMenuDrag.offsetX = e.clientX - rect.left;
  inspectMenuDrag.offsetY = e.clientY - rect.top;
  if (idCardDragHandle) idCardDragHandle.classList.add('is-dragging');
  document.addEventListener('mousemove', onInspectDragMove);
  document.addEventListener('mouseup', onInspectDragEnd);
}

function onInspectDragMove(e) {
  if (!inspectMenuDrag.active) return;
  const left = e.clientX - inspectMenuDrag.offsetX;
  const top = e.clientY - inspectMenuDrag.offsetY;
  const c = clampInspectMenuPosition(left, top);
  inspectionMenu.style.left = `${c.left}px`;
  inspectionMenu.style.top = `${c.top}px`;
}

function onInspectDragEnd() {
  resetInspectMenuDragListeners();
}

function notifyChaosIncrease(amount) {
  if (amount >= 10) {
    triggerChaosFeedback({ shake: true });
    triggerScreenShake(6);
  } else if (amount >= 5) {
    triggerChaosFeedback({ shake: false });
    triggerScreenShake(2.5);
  }
}

function triggerChaosFeedback(opts) {
  const shake = opts.shake !== false;
  const track = chaosBar.parentElement;

  chaosBar.classList.remove('chaos-spike-flash');
  void chaosBar.offsetWidth;
  chaosBar.classList.add('chaos-spike-flash');

  if (track) {
    track.classList.remove('chaos-track-flash');
    void track.offsetWidth;
    track.classList.add('chaos-track-flash');
  }

  if (shake && hudEl) {
    hudEl.classList.remove('hud-shake-anim');
    void hudEl.offsetWidth;
    hudEl.classList.add('hud-shake-anim');
    setTimeout(() => hudEl.classList.remove('hud-shake-anim'), 450);
  }

  setTimeout(() => {
    chaosBar.classList.remove('chaos-spike-flash');
    if (track) track.classList.remove('chaos-track-flash');
  }, 520);
}

function triggerPunchScreenshake() {
  triggerScreenShake(5);
  if (!hudEl) return;
  hudEl.classList.remove('hud-shake-anim');
  void hudEl.offsetWidth;
  hudEl.classList.add('hud-shake-anim');
  setTimeout(() => hudEl.classList.remove('hud-shake-anim'), 320);
}

function tickAggroChaos(dt) {
  const anyAggro = npcs.some((n) => n.state === STATE_AGGRESSIVE);
  if (anyAggro) GameState.addChaosPassive(AGGRO_CHAOS_PER_SEC * dt);
}

function getStationBounds() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const hw = STATION_W / 2;
  const hh = STATION_H / 2;
  return {
    cx,
    cy,
    left: cx - hw,
    right: cx + hw,
    top: cy - hh,
    bottom: cy + hh,
  };
}

function getQueueLineY(halfSize) {
  return getStationBounds().bottom + halfSize;
}

function repositionStationQueue() {
  if (!Array.isArray(npcs) || npcs.length === 0) return;

  const atStation = npcs.filter((n) => n.state === STATE_AT_STATION || n.state === STATE_INSPECTING);
  if (atStation.length === 0) return;

  const b = getStationBounds();
  const stopY = getQueueLineY(atStation[0].half ?? 10);
  const spacing = 28;
  for (let i = 0; i < atStation.length; i++) {
    const npc = atStation[i];
    const off = (i - (atStation.length - 1) / 2) * spacing;
    npc.x = b.cx + off;
    npc.y = stopY;
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  repositionStationQueue();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function getBubbleLabel(npc) {
  if (npc.state === STATE_AGGRESSIVE) return '#!@%';
  return npc.bubbleChar;
}

class PunchParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const a = Math.random() * Math.PI * 2;
    const sp = 90 + Math.random() * 140;
    this.vx = Math.cos(a) * sp;
    this.vy = Math.sin(a) * sp - 40;
    this.maxLife = 0.28 + Math.random() * 0.18;
    this.life = this.maxLife;
    this.size = 2 + Math.random() * 2.5;
    this.color = Math.random() < 0.55 ? '#fffde7' : '#ffe082';
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 420 * dt;
    this.vx *= 0.97;
    this.life -= dt;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = a;
    ctx.fillRect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

function spawnPunchParticles(x, y, count = 6) {
  const n = Math.max(1, count | 0);
  for (let i = 0; i < n; i++) punchParticles.push(new PunchParticle(x, y));
}

function spawnPunchSpark(x, y) {
  punchSparks.push({
    x,
    y,
    life: 0.2,
    maxLife: 0.2,
    rot: Math.random() * Math.PI * 2,
  });
}

class StationDustParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 55;
    this.vy = -28 - Math.random() * 42;
    this.maxLife = 0.42 + Math.random() * 0.22;
    this.life = this.maxLife;
    this.r = 3.5 + Math.random() * 5.5;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 48 * dt;
    this.vx *= 0.94;
    this.life -= dt;
  }

  draw(ctx) {
    const t = Math.max(0, this.life / this.maxLife);
    const rad = this.r * (1.35 + (1 - t) * 0.4);
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, rad);
    g.addColorStop(0, `rgba(210, 200, 220, ${0.5 * t})`);
    g.addColorStop(0.45, `rgba(130, 120, 145, ${0.28 * t})`);
    g.addColorStop(1, 'rgba(70, 65, 82, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spawnStationDust(x, y, spreadHalf = 12) {
  const n = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    stationDustParticles.push(
      new StationDustParticle(x + (Math.random() - 0.5) * spreadHalf * 2, y)
    );
  }
}

function tickStationDust(dt) {
  for (let i = stationDustParticles.length - 1; i >= 0; i--) {
    stationDustParticles[i].update(dt);
    if (stationDustParticles[i].life <= 0) stationDustParticles.splice(i, 1);
  }
}

function drawStationDust(ctx) {
  for (const p of stationDustParticles) p.draw(ctx);
}

function tickCombatFx(dt) {
  for (let i = punchParticles.length - 1; i >= 0; i--) {
    punchParticles[i].update(dt);
    if (punchParticles[i].life <= 0) punchParticles.splice(i, 1);
  }
  for (let i = punchSparks.length - 1; i >= 0; i--) {
    punchSparks[i].life -= dt;
    if (punchSparks[i].life <= 0) punchSparks.splice(i, 1);
  }
}

function drawCombatFx(ctx) {
  const powImg = getAssetImage('effect_punch');
  if (powImg) {
    for (const s of punchSparks) {
      const t = Math.max(0, s.life / s.maxLife);
      const scale = 0.75 + (1 - t) * 0.65;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot + (1 - t) * 0.8);
      ctx.globalAlpha = Math.min(1, t * 3);
      const w = powImg.width * scale;
      const h = powImg.height * scale;
      ctx.drawImage(powImg, -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  for (const p of punchParticles) p.draw(ctx);
}

function getNpcBodyFrameKeys(npc) {
  return npc.spriteFrameKeys && npc.spriteFrameKeys.length >= 2
    ? npc.spriteFrameKeys
    : ['npc_walk_a', 'npc_walk_b'];
}

function npcWalkFramesReadyFor(npc) {
  const keys = getNpcBodyFrameKeys(npc);
  return !!(getAssetImage(keys[0]) && getAssetImage(keys[1]));
}

/**
 * Body drawable: horizontal two-frame walk while moving (or custom `spriteFrameKeys`),
 * else single `npc_base`. A real sprite sheet can be split into two asset keys.
 */
function getNpcBodyDrawable(npc) {
  const keys = getNpcBodyFrameKeys(npc);
  const dual = npcWalkFramesReadyFor(npc);
  if (dual && npc.state === STATE_MOVING) {
    return npc._walkFrameIndex === 0 ? getAssetImage(keys[0]) : getAssetImage(keys[1]);
  }
  if (dual) return getAssetImage(keys[0]);
  return getAssetImage('npc_base');
}

function drawSpeechBubble(ctx, npc, anchorX, anchorY) {
  const ax = anchorX != null ? anchorX : npc.x;
  const ay = anchorY != null ? anchorY : npc.y;
  const label = getBubbleLabel(npc);
  const isAggro = npc.state === STATE_AGGRESSIVE;
  const b = getStationBounds();
  const leftSide = ax < b.cx;
  const bw = isAggro ? 52 : 28;
  const bh = isAggro ? 26 : 24;
  const pad = 8;
  const bx = leftSide ? ax - npc.half - bw - pad : ax + npc.half + pad;
  const by = ay - npc.half - 4;

  ctx.save();
  ctx.fillStyle = isAggro ? 'rgba(40, 12, 14, 0.95)' : 'rgba(248, 248, 255, 0.94)';
  ctx.strokeStyle = isAggro ? 'rgba(255, 60, 60, 0.85)' : 'rgba(20, 20, 28, 0.65)';
  ctx.lineWidth = isAggro ? 1.5 : 1.25;
  roundRectPath(ctx, bx, by, bw, bh, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isAggro ? 'rgba(40, 12, 14, 0.95)' : 'rgba(248, 248, 255, 0.94)';
  ctx.beginPath();
  if (leftSide) {
    ctx.moveTo(bx + bw - 2, by + bh - 6);
    ctx.lineTo(bx + bw + 7, by + bh - 2);
    ctx.lineTo(bx + bw - 2, by + bh - 12);
  } else {
    ctx.moveTo(bx + 2, by + bh - 6);
    ctx.lineTo(bx - 7, by + bh - 2);
    ctx.lineTo(bx + 2, by + bh - 12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isAggro ? '#ff5252' : '#1a1a22';
  ctx.font = isAggro ? 'bold 11px "Courier New", monospace' : 'bold 15px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
  ctx.restore();
}

class NPC {
  constructor(data) {
    Object.assign(this, data);
    /** @type {string[]|null} optional asset keys [frameA, frameB] for walk cycle */
    if (!Array.isArray(this.spriteFrameKeys) || this.spriteFrameKeys.length < 2) this.spriteFrameKeys = null;
    this.state = STATE_MOVING;
    this.size = 20;
    this.half = this.size / 2;
    this.x = 20 + Math.random() * (canvas.width - 40);
    this.y = canvas.height + this.half + 24;
    this.speed = 0.65 + Math.random() * 0.45;
    this.color = randomFrom(GRUNGE_PALETTE);
    this.bubbleChar = Math.random() < 0.5 ? '!' : '?';
    this.maxHealth = NPC_MAX_HEALTH;
    this.health = NPC_MAX_HEALTH;
    this._pulse = 0;
    this._shakePhase = 0;
    this._punchFlash = 0;
    this._koVx = 0;
    this._koVy = 0;
    this._facingLeft = false;
    this._hitFacingTimer = 0;
    this._walkAccumMs = 0;
    this._walkFrameIndex = 0;
    this._bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    if (this.state === STATE_KNOCKOUT) {
      this._walkAccumMs = 0;
      this.x += this._koVx * dt;
      this.y += this._koVy * dt;
      this._facingLeft = this._koVx < 0;
      const margin = 80;
      if (
        this.x < -margin ||
        this.x > canvas.width + margin ||
        this.y < -margin ||
        this.y > canvas.height + margin
      ) {
        removeNpc(this);
      }
      return;
    }

    if (this.state === STATE_AGGRESSIVE) {
      this._walkAccumMs = 0;
      this._pulse += dt * 5;
      this._shakePhase += dt * 28;
      if (this._punchFlash > 0) this._punchFlash = Math.max(0, this._punchFlash - dt);
      if (this._hitFacingTimer > 0) {
        this._hitFacingTimer -= dt;
      } else {
        const b = getStationBounds();
        this._facingLeft = this.x > b.cx;
      }
      return;
    }

    if (this.state === STATE_AT_STATION || this.state === STATE_INSPECTING) {
      this._walkAccumMs = 0;
      return;
    }

    const b = getStationBounds();
    const stopY = getQueueLineY(this.half);
    const stopX = b.cx;
    const dx = stopX - this.x;
    const dy = stopY - this.y;
    const dist = Math.hypot(dx, dy);

    const topY = this.y - this.half;
    const hitBox =
      topY <= b.bottom &&
      this.x >= b.left - this.half &&
      this.x <= b.right + this.half;

    if (hitBox || dist <= 1.5) {
      this.y = Math.max(this.y, stopY);
      if (this.state === STATE_MOVING) {
        spawnStationDust(this.x, this.y + this.half - 2, this.half + 4);
      }
      this.state = STATE_AT_STATION;
      this._walkAccumMs = 0;
      repositionStationQueue();
      return;
    }

    if (dist > 0.5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this._facingLeft = this.x > stopX;
      this._walkAccumMs += dt * 1000;
      while (this._walkAccumMs >= NPC_WALK_FRAME_MS) {
        this._walkAccumMs -= NPC_WALK_FRAME_MS;
        this._walkFrameIndex = 1 - this._walkFrameIndex;
      }
      this._bobPhase += dt * 12;
    }
  }

  draw(ctx) {
    let ox = 0;
    let oy = 0;
    if (this.state === STATE_AGGRESSIVE) {
      ox = Math.sin(this._shakePhase) * 3.2 + Math.sin(this._shakePhase * 1.7) * 1.2;
      oy = Math.cos(this._shakePhase * 1.3) * 2.4;
    }

    const img = getNpcBodyDrawable(this);
    const usingSprite = !!img;
    const bob =
      !usingSprite && this.state === STATE_MOVING ? Math.sin(this._bobPhase) * 3.2 : 0;

    const px = this.x + ox;
    const py = this.y + oy + bob;

    const drawW = this.size * 2.15;
    const drawH = this.size * 2.85;
    const hx = drawW * 0.5;
    const hy = drawH * 0.5;

    if (img) {
      ctx.save();
      ctx.translate(px, py);
      if (this._facingLeft) ctx.scale(-1, 1);

      let filter = 'none';
      if (this.state === STATE_AGGRESSIVE) {
        const l = 38 + Math.sin(this._pulse) * 14;
        filter = `sepia(0.35) saturate(1.8) hue-rotate(-12deg) brightness(${0.45 + l / 140})`;
      } else if (this.state === STATE_KNOCKOUT) {
        const l = 42 + Math.sin(this._pulse * 2) * 8;
        filter = `sepia(0.5) saturate(1.5) hue-rotate(-18deg) brightness(${0.4 + l / 120})`;
      }
      ctx.filter = filter;
      ctx.drawImage(img, -hx, -hy, drawW, drawH);
      ctx.filter = 'none';

      if (this._punchFlash > 0) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = Math.min(0.95, this._punchFlash * 4.2);
        ctx.filter = 'brightness(2.4)';
        ctx.drawImage(img, -hx, -hy, drawW, drawH);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();
    } else {
      let fill = this.color;
      if (this.state === STATE_AGGRESSIVE) {
        const l = 38 + Math.sin(this._pulse) * 14;
        fill = `hsl(0, 82%, ${l}%)`;
      } else if (this.state === STATE_KNOCKOUT) {
        fill = `hsl(0, 55%, ${42 + Math.sin(this._pulse * 2) * 8}%)`;
      }
      ctx.fillStyle = fill;
      ctx.fillRect(px - this.half, py - this.half, this.size, this.size);
      if (this._punchFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.92, this._punchFlash * 4)})`;
        ctx.fillRect(px - this.half, py - this.half, this.size, this.size);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - this.half + 0.5, py - this.half + 0.5, this.size - 1, this.size - 1);
    }

    if (this.state === STATE_AT_STATION || this.state === STATE_INSPECTING) {
      ctx.strokeStyle = 'rgba(224, 64, 251, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - this.half - 2, py - this.half - 2, this.size + 4, this.size + 4);
    }

    if (this.state === STATE_AGGRESSIVE) {
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - this.half - 2, py - this.half - 2, this.size + 4, this.size + 4);
    }

    if (this.isVip && this.state !== STATE_KNOCKOUT) {
      const rw = usingSprite ? drawW : this.size;
      const rh = usingSprite ? drawH : this.size;
      ctx.save();
      ctx.translate(px, py);
      ctx.strokeStyle = 'rgba(255, 215, 130, 0.95)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(255, 195, 80, 0.9)';
      ctx.shadowBlur = 16;
      ctx.strokeRect(-rw / 2 - 4, -rh / 2 - 4, rw + 8, rh + 8);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 245, 200, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-rw / 2 - 7, -rh / 2 - 7, rw + 14, rh + 14);
      ctx.restore();
    }

    const atReady = this.state === STATE_AT_STATION || this.state === STATE_INSPECTING;
    if (this.state === STATE_AGGRESSIVE) {
      drawSpeechBubble(ctx, this, px, py);
    } else if (atReady && !(this.state === STATE_INSPECTING && GameState.activeNpc === this)) {
      drawSpeechBubble(ctx, this, px, py);
    }

    ctx.fillStyle = '#e8e8e8';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    const spriteLift = usingSprite ? this.size * 2.85 * 0.5 + 10 : this.half;
    const nameLift =
      atReady || this.state === STATE_AGGRESSIVE ? spriteLift + 18 : usingSprite ? spriteLift + 4 : 6;
    if (this.state !== STATE_KNOCKOUT) {
      ctx.fillText(this.name.split(' ')[0], px, py - nameLift);
    }

    if (this.state === STATE_AT_STATION && GameState.activeNpc !== this) {
      ctx.fillStyle = '#e1bee7';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('E', px, py - spriteLift - 8);
    }
  }

  containsCanvasPoint(px, py) {
    return (
      px >= this.x - this.half &&
      px <= this.x + this.half &&
      py >= this.y - this.half &&
      py <= this.y + this.half
    );
  }
}

function spawnNPC() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  if (!Array.isArray(npcs) || npcs.length >= MAX_NPCS) return;
  if (typeof NPCSystem === 'undefined' || typeof NPCSystem.generateNpcData !== 'function') {
    console.error('NPCSystem.generateNpcData missing. Load NPCSystem.js before game.js.');
    return;
  }
  const tier = getDifficultyTier();
  const bonus = getAggressionBonusForTier(tier);
  const npc = new NPC(NPCSystem.generateNpcData(bonus));
  npcs.push(npc);
  if (npc.isVip && typeof SoundManager !== 'undefined') {
    if (SoundManager.playVipChime) SoundManager.playVipChime();
    else if (SoundManager.play) SoundManager.play('sfx_vip_chime');
  }
}

function updateHUD() {
  vibeBar.style.width = GameState.vibe + '%';
  chaosBar.style.width = GameState.chaos + '%';
  updateSecurityButton();
  syncChaosAlarmFromHud();
}

function hideInspection() {
  inspectionMenu.classList.add('hidden');
  resetInspectionMenuLayout();
  if (GameState.activeNpc && GameState.activeNpc.state === STATE_INSPECTING) {
    GameState.activeNpc.state = STATE_AT_STATION;
  }
  GameState.activeNpc = null;
  GameState.isPaused = false;
  repositionStationQueue();
}

function showInspection(npc) {
  if (!isPlayingSession()) return;
  resetInspectionMenuLayout();
  GameState.activeNpc = npc;
  npc.state = STATE_INSPECTING;
  GameState.isPaused = true;

  const idCardEl = document.getElementById('inspect-id-card');
  if (idCardEl) idCardEl.classList.toggle('id-card--vip', !!npc.isVip);

  const vipRibbon = document.getElementById('inspect-vip-ribbon');
  if (vipRibbon) vipRibbon.classList.toggle('hidden', !npc.isVip);

  const vipAnnexWrap = document.getElementById('inspect-vip-annex-wrap');
  const vipAnnex = document.getElementById('inspect-vip-annex');
  if (vipAnnexWrap && vipAnnex) {
    const showAnnex = !!(npc.isVip && npc.vipAnnexLine);
    vipAnnexWrap.classList.toggle('hidden', !showAnnex);
    vipAnnex.textContent = showAnnex ? npc.vipAnnexLine : '—';
  }

  const sectorEl = document.getElementById('inspect-sector');
  if (sectorEl) sectorEl.textContent = npc.idSector != null ? String(npc.idSector) : '—';

  if (inspectPortraitHost) {
    inspectPortraitHost.innerHTML = npc.portraitSvg || '';
  }
  if (inspectIdNumber) inspectIdNumber.textContent = npc.idNumber || '—';

  inspectName.textContent = npc.name;
  inspectAge.textContent = String(npc.age);

  const v = formatValidityLine(npc);
  inspectValidity.textContent = v.text;
  inspectValidity.className = v.cls;

  inspectReason.textContent = npc.reasonForEntry || '—';

  const sealVar =
    npc.securitySealVariant != null
      ? npc.securitySealVariant
      : npc.isValidID
        ? 'valid'
        : 'missing';
  applySecuritySeal(inspectSecuritySeal, sealVar);

  inspectionMenu.classList.remove('hidden');
  repositionStationQueue();
}

function toggleInspection(npc) {
  if (!isPlayingSession()) return;
  if (npc.state !== STATE_AT_STATION && npc.state !== STATE_INSPECTING) return;
  if (GameState.activeNpc === npc && !inspectionMenu.classList.contains('hidden')) {
    hideInspection();
    return;
  }
  if (GameState.activeNpc && GameState.activeNpc !== npc) {
    hideInspection();
  }
  showInspection(npc);
}

function removeNpc(npc) {
  const i = npcs.indexOf(npc);
  if (i === -1) return;
  if (GameState.currentStatus === STATUS.PLAYING) guestsProcessed += 1;
  npcs.splice(i, 1);
  if (GameState.activeNpc === npc) GameState.activeNpc = null;
}

function punchAggressiveNpc(npc) {
  if (!isPlayingSession()) return;
  if (npc.state !== STATE_AGGRESSIVE) return;
  playCombatSound();
  npc._facingLeft = !npc._facingLeft;
  npc._hitFacingTimer = 0.14;
  npc._punchFlash = 0.22;
  triggerPunchScreenshake();
  spawnPunchParticles(npc.x, npc.y, 7);
  spawnPunchSpark(npc.x, npc.y - npc.half * 0.35);
  npc.health -= 1;
  if (npc.health <= 0) {
    const b = getStationBounds();
    const dx = npc.x - b.cx;
    const dy = npc.y - b.cy;
    const len = Math.hypot(dx, dy) || 1;
    npc._koVx = (dx / len) * KNOCKOUT_SPEED;
    npc._koVy = (dy / len) * KNOCKOUT_SPEED;
    npc.state = STATE_KNOCKOUT;
    npc._pulse = 0;
  }
}

function onLetIn() {
  if (!isPlayingSession()) return;
  const npc = GameState.activeNpc;
  if (!npc) return;

  const isDocBad = !npc.isValidID || npc.isMinor;
  const ruleBlocked = letInViolatesDailyRule(npc);

  if (isDocBad) {
    GameState.addChaos(15);
  }
  if (ruleBlocked) {
    GameState.addChaos(RULE_VIOLATION_CHAOS);
    triggerScreenShake(8);
  }

  const successfulLetIn = !isDocBad && !ruleBlocked;
  if (successfulLetIn) {
    let vibeAmt = npc.vibeContribution * (npc.isVip ? 2 : 1);
    GameState.addVibe(vibeAmt);
    if (npc.isVip) GameState.reduceChaos(5);
  }

  if (successfulLetIn) shiftLegitLetInCount += 1;
  else if (npc.isMinor) shiftMinorLetInCount += 1;

  if (isDocBad) shiftMistakes += 1;
  else if (ruleBlocked) shiftMistakes += 1;

  if (successfulLetIn && npc.isVip) shiftVipSuccessCount += 1;

  if (typeof SoundManager !== 'undefined' && SoundManager.play) SoundManager.play('sfx_stamp_approve');

  guestsLetIn += 1;
  updateTimerAndGuestHud();
  removeNpc(npc);
  hideInspection();
}

function onDeny() {
  if (!isPlayingSession()) return;
  const npc = GameState.activeNpc;
  if (!npc) return;

  if (typeof SoundManager !== 'undefined' && SoundManager.play) SoundManager.play('sfx_stamp_deny');

  if (isLegitGuest(npc)) {
    GameState.addChaos(5);
    shiftMistakes += 1;
  } else {
    shiftCorrectDenials += 1;
  }

  const chance = npc.aggressionChance != null ? npc.aggressionChance : 0.28;
  const goesAggro = Math.random() < chance;

  guestsDenied += 1;
  updateTimerAndGuestHud();

  inspectionMenu.classList.add('hidden');
  GameState.activeNpc = null;
  GameState.isPaused = false;

  if (goesAggro) {
    npc.state = STATE_AGGRESSIVE;
    npc._walkAccumMs = 0;
    npc.health = NPC_MAX_HEALTH;
    npc.maxHealth = NPC_MAX_HEALTH;
    npc._pulse = 0;
    npc._shakePhase = 0;
    npc._punchFlash = 0;
    npc._hitFacingTimer = 0;
    {
      const b = getStationBounds();
      npc._facingLeft = npc.x > b.cx;
    }
    repositionStationQueue();
    return;
  }

  removeNpc(npc);
  repositionStationQueue();
}

function onCanvasClick(e) {
  if (!isPlayingSession()) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;

  for (let i = npcs.length - 1; i >= 0; i--) {
    const npc = npcs[i];
    if (!npc.containsCanvasPoint(mx, my)) continue;

    if (npc.state === STATE_AGGRESSIVE) {
      punchAggressiveNpc(npc);
      return;
    }

    if (npc.state === STATE_AT_STATION || npc.state === STATE_INSPECTING) {
      toggleInspection(npc);
    }
    return;
  }
}

function runSimulationStep(dt) {
  if (GameState.currentStatus !== STATUS.PLAYING) return;

  tickSecurityCooldown(dt);

  if (GameState.chaos >= 100) {
    triggerGameOver();
    return;
  }

  shiftTimerRemaining -= dt;
  syncDifficultyScaling();
  tickDailyRuleTransition();

  if (shiftTimerRemaining <= 0) {
    shiftTimerRemaining = 0;
    updateTimerAndGuestHud();
    triggerWin();
    return;
  }
  updateTimerAndGuestHud();

  tickAggroChaos(dt);

  if (!GameState.isPaused) {
    for (let i = npcs.length - 1; i >= 0; i--) npcs[i].update(dt);
  } else {
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i];
      if (n.state === STATE_AGGRESSIVE || n.state === STATE_KNOCKOUT) n.update(dt);
    }
  }
}

function gameLoop(timestamp) {
  const dt = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 1000, 0.1) : 0;
  lastFrameTime = timestamp;

  if (GameState.currentStatus === STATUS.PLAYING) {
    runSimulationStep(dt);
  } else if (GameState.currentStatus === STATUS.PAUSED) {
    tickSecurityCooldown(dt);
  }

  if (GameState.currentStatus === STATUS.PLAYING || GameState.currentStatus === STATUS.PAUSED) {
    tickCombatFx(dt);
    tickStationDust(dt);
    updateBouncerStationGlow(dt);
  }

  tickScreenShake(dt);
  render();
  requestAnimationFrame(gameLoop);
}

/** Fallback if stage background layer not ready — keeps canvas non-empty. */
function drawCanvasBackdropFallback() {
  const w = canvas.width;
  const h = canvas.height;
  const { cx, cy } = getStationBounds();
  const hasStageBg =
    stageBackgroundEl &&
    stageBackgroundEl.style.backgroundImage &&
    stageBackgroundEl.style.backgroundImage !== 'none';
  if (hasStageBg) return;

  const img = getAssetImage('background_club_entrance');
  if (img) {
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const ox = (w - dw) * 0.5;
    const oy = (h - dh) * 0.5;
    ctx.drawImage(img, ox, oy, dw, dh);
    ctx.fillStyle = 'rgba(6, 4, 12, 0.35)';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.55);
  g.addColorStop(0, '#222232');
  g.addColorStop(0.45, '#181824');
  g.addColorStop(1, '#0e0e14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawWorldOverlay() {
  const w = canvas.width;
  const h = canvas.height;
  const { cx, cy } = getStationBounds();

  ctx.strokeStyle = 'rgba(123, 47, 247, 0.1)';
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(123, 47, 247, 0.18)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.strokeRect(cx - 200, cy - 140, 400, 280);
  ctx.setLineDash([]);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCanvasBackdropFallback();
  drawWorldOverlay();

  const { cx, cy } = getStationBounds();
  ctx.fillStyle = 'rgba(123, 47, 247, 0.06)';
  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
  ctx.fill();

  for (const npc of npcs) npc.draw(ctx);
  drawStationDust(ctx);
  drawCombatFx(ctx);
  drawScanlines();
}

function drawScanlines() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.globalAlpha = 0.05;
  for (let y = 1; y < h; y += 3) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();
}

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  GameState.currentStatus = STATUS.MENU;
  clearSpawnInterval();
  hideGameHud();
  hidePauseMenu();
  hideEndScreens();
  showMainMenu();
  updateHUD();
  updateTimerAndGuestHud();
  updateMainMenuHighScore();
  updateDailyRuleHud();

  btnStartShift.addEventListener('click', startShift);
  btnResume.addEventListener('click', resumeFromPause);
  btnRetryLoss.addEventListener('click', resetSessionToMenu);
  btnRetryWin.addEventListener('click', resetSessionToMenu);
  document.addEventListener('keydown', onKeyDown);

  if (btnCallSecurity) btnCallSecurity.addEventListener('click', callSecurity);

  if (idCardDragHandle) idCardDragHandle.addEventListener('mousedown', onInspectDragStart);

  btnLetIn.addEventListener('click', onLetIn);
  btnDeny.addEventListener('click', onDeny);
  canvas.addEventListener('click', onCanvasClick);

  if (typeof AssetManager !== 'undefined' && typeof AssetManager.load === 'function') {
    AssetManager.load(() => {
      syncStageLayerImages();
      requestAnimationFrame(gameLoop);
    });
  } else {
    requestAnimationFrame(gameLoop);
  }
}

init();
