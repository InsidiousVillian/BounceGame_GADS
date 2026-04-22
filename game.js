// ═══════════════════════════════════════════════════════════════════════════════
// Declarations
// ═══════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
let securityCooldownRemaining = 0;
let appliedDifficultyTier = -1;
let currentSpawnIntervalMs = BASE_SPAWN_MS;

const GRUNGE_PALETTE = [
  '#5d6d5a', '#4a5d52', '#5c6b58', '#6b7d6a',
  '#5c4d6b', '#5a4f66', '#6a5d7a', '#4a3f5c',
  '#6b6b6b', '#5a5a5c', '#7a7570', '#4f4f52',
];

const MAX_NPCS = 14;

const gameHudWrap = document.getElementById('game-hud-wrap');
const timerSecondsDisplay = document.getElementById('timer-seconds-display');
const guestLetInEl = document.getElementById('guest-let-in');
const guestDeniedEl = document.getElementById('guest-denied');
const btnCallSecurity = document.getElementById('btn-call-security');
const securityCdOverlay = document.getElementById('security-cd-overlay');
const vibeBar = document.getElementById('vibe-bar');
const chaosBar = document.getElementById('chaos-bar');
const hudEl = document.getElementById('hud');

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
const inspectName = document.getElementById('inspect-name');
const inspectAge = document.getElementById('inspect-age');
const inspectValidity = document.getElementById('inspect-id-validity');
const inspectReason = document.getElementById('inspect-reason');
const btnLetIn = document.getElementById('btn-let-in');
const btnDeny = document.getElementById('btn-deny');

let spawnIntervalId = null;
let lastFrameTime = 0;

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
  gameOverGuestsEl.textContent = String(guestsProcessed);
  gameOverScreen.classList.remove('hidden');
}

function triggerWin() {
  if (GameState.currentStatus !== STATUS.PLAYING) return;
  GameState.currentStatus = STATUS.WIN;
  clearSpawnInterval();
  hideInspectionForPause();
  hidePauseMenu();
  hideMainMenu();
  winGuestsEl.textContent = String(guestsProcessed);
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
  securityCooldownRemaining = 0;
  appliedDifficultyTier = -1;
  currentSpawnIntervalMs = BASE_SPAWN_MS;
  lastFrameTime = 0;

  inspectionMenu.classList.add('hidden');
  hidePauseMenu();
  hideEndScreens();
  hideGameHud();
  showMainMenu();

  updateHUD();
  updateTimerAndGuestHud();
  repositionStationQueue();
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
  securityCooldownRemaining = 0;
  appliedDifficultyTier = -1;
  currentSpawnIntervalMs = BASE_SPAWN_MS;
  lastFrameTime = 0;

  inspectionMenu.classList.add('hidden');
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
  } else if (GameState.currentStatus === STATUS.PAUSED) {
    GameState.currentStatus = STATUS.PLAYING;
    hidePauseMenu();
  }
}

function resumeFromPause() {
  if (GameState.currentStatus === STATUS.PAUSED) {
    GameState.currentStatus = STATUS.PLAYING;
    hidePauseMenu();
  }
}

function hideInspectionForPause() {
  inspectionMenu.classList.add('hidden');
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
  console.log('POW!');
}

function isLegitGuest(npc) {
  return npc.isValidID === true && npc.isMinor === false;
}

function formatValidityLine(npc) {
  if (!npc.isValidID) return { text: 'FORGED — FAKE ID', cls: 'field-value field-value--fake' };
  if (npc.isMinor) return { text: 'VALID ID — MINOR (UNDER 21)', cls: 'field-value field-value--legit field-value--minor-warn' };
  return { text: 'VERIFIED — LEGIT', cls: 'field-value field-value--legit' };
}

function notifyChaosIncrease(amount) {
  if (amount >= 10) triggerChaosFeedback({ shake: true });
  else if (amount >= 5) triggerChaosFeedback({ shake: false });
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
  }

  update(dt) {
    if (this.state === STATE_KNOCKOUT) {
      this.x += this._koVx * dt;
      this.y += this._koVy * dt;
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
      this._pulse += dt * 5;
      this._shakePhase += dt * 28;
      if (this._punchFlash > 0) this._punchFlash = Math.max(0, this._punchFlash - dt);
      return;
    }

    if (this.state === STATE_AT_STATION || this.state === STATE_INSPECTING) return;

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
      this.state = STATE_AT_STATION;
      repositionStationQueue();
      return;
    }

    if (dist > 0.5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw(ctx) {
    let ox = 0;
    let oy = 0;
    if (this.state === STATE_AGGRESSIVE) {
      ox = Math.sin(this._shakePhase) * 3.2 + Math.sin(this._shakePhase * 1.7) * 1.2;
      oy = Math.cos(this._shakePhase * 1.3) * 2.4;
    }

    const px = this.x + ox;
    const py = this.y + oy;

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

    const atReady = this.state === STATE_AT_STATION || this.state === STATE_INSPECTING;
    if (this.state === STATE_AGGRESSIVE) {
      drawSpeechBubble(ctx, this, px, py);
    } else if (atReady && !(this.state === STATE_INSPECTING && GameState.activeNpc === this)) {
      drawSpeechBubble(ctx, this, px, py);
    }

    ctx.fillStyle = '#e8e8e8';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    const nameLift = atReady || this.state === STATE_AGGRESSIVE ? 40 : 6;
    if (this.state !== STATE_KNOCKOUT) {
      ctx.fillText(this.name.split(' ')[0], px, py - this.half - nameLift);
    }

    if (this.state === STATE_AT_STATION && GameState.activeNpc !== this) {
      ctx.fillStyle = '#e1bee7';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('E', px, py - this.half - 22);
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
  npcs.push(new NPC(NPCSystem.generateNpcData(bonus)));
}

function updateHUD() {
  vibeBar.style.width = GameState.vibe + '%';
  chaosBar.style.width = GameState.chaos + '%';
  updateSecurityButton();
}

function hideInspection() {
  inspectionMenu.classList.add('hidden');
  if (GameState.activeNpc && GameState.activeNpc.state === STATE_INSPECTING) {
    GameState.activeNpc.state = STATE_AT_STATION;
  }
  GameState.activeNpc = null;
  GameState.isPaused = false;
  repositionStationQueue();
}

function showInspection(npc) {
  if (!isPlayingSession()) return;
  GameState.activeNpc = npc;
  npc.state = STATE_INSPECTING;
  GameState.isPaused = true;

  inspectName.textContent = npc.name;
  inspectAge.textContent = String(npc.age);

  const v = formatValidityLine(npc);
  inspectValidity.textContent = v.text;
  inspectValidity.className = v.cls;

  inspectReason.textContent = npc.reasonForEntry || '—';

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
  npc._punchFlash = 0.22;
  triggerPunchScreenshake();
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

  const badLetIn = !npc.isValidID || npc.isMinor;
  if (badLetIn) {
    GameState.addChaos(15);
  } else {
    GameState.addVibe(npc.vibeContribution);
  }

  guestsLetIn += 1;
  updateTimerAndGuestHud();
  removeNpc(npc);
  hideInspection();
}

function onDeny() {
  if (!isPlayingSession()) return;
  const npc = GameState.activeNpc;
  if (!npc) return;

  if (isLegitGuest(npc)) {
    GameState.addChaos(5);
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
    npc.health = NPC_MAX_HEALTH;
    npc.maxHealth = NPC_MAX_HEALTH;
    npc._pulse = 0;
    npc._shakePhase = 0;
    npc._punchFlash = 0;
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

  render();
  requestAnimationFrame(gameLoop);
}

function drawGameArea() {
  const w = canvas.width;
  const h = canvas.height;
  const { cx, cy } = getStationBounds();

  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.55);
  g.addColorStop(0, '#222232');
  g.addColorStop(0.45, '#181824');
  g.addColorStop(1, '#0e0e14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(123, 47, 247, 0.12)';
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

  ctx.strokeStyle = 'rgba(123, 47, 247, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.strokeRect(cx - 200, cy - 140, 400, 280);
  ctx.setLineDash([]);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGameArea();

  const { cx, cy } = getStationBounds();
  ctx.fillStyle = 'rgba(123, 47, 247, 0.08)';
  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
  ctx.fill();

  for (const npc of npcs) npc.draw(ctx);
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

  btnStartShift.addEventListener('click', startShift);
  btnResume.addEventListener('click', resumeFromPause);
  btnRetryLoss.addEventListener('click', resetSessionToMenu);
  btnRetryWin.addEventListener('click', resetSessionToMenu);
  document.addEventListener('keydown', onKeyDown);

  if (btnCallSecurity) btnCallSecurity.addEventListener('click', callSecurity);

  btnLetIn.addEventListener('click', onLetIn);
  btnDeny.addEventListener('click', onDeny);
  canvas.addEventListener('click', onCanvasClick);

  requestAnimationFrame(gameLoop);
}

init();
