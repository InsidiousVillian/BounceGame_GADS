// ═══════════════════════════════════════════════════════════════════════════════
// Declarations (must run before any function calls that reference these bindings)
// ═══════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/** Match #bouncer-station in style.css */
const STATION_W = 160;
const STATION_H = 160;

const GameState = {
  vibe: 50,
  chaos: 0,
  activeNpc: null,
  isPaused: false,

  clamp(val, min = 0, max = 100) {
    return Math.max(min, Math.min(max, val));
  },

  addVibe(amount) {
    this.vibe = this.clamp(this.vibe + amount);
    updateHUD();
  },

  addChaos(amount) {
    this.chaos = this.clamp(this.chaos + amount);
    updateHUD();
  },
};

let npcs = [];

const GRUNGE_PALETTE = [
  '#5d6d5a', '#4a5d52', '#5c6b58', '#6b7d6a',
  '#5c4d6b', '#5a4f66', '#6a5d7a', '#4a3f5c',
  '#6b6b6b', '#5a5a5c', '#7a7570', '#4f4f52',
];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Quinn', 'Reese', 'Skyler',
  'Jamie', 'Drew', 'Sam', 'Taylor', 'Avery', 'Cameron', 'Blake', 'Rowan',
];
const LAST_NAMES = [
  'Vega', 'Knox', 'Reed', 'Shaw', 'Blake', 'Cross', 'Fox', 'Stone',
  'Wolf', 'Crow', 'Nash', 'Pike', 'Drake', 'Frost', 'Lane', 'Vale',
];

const MAX_NPCS = 14;

const vibeBar = document.getElementById('vibe-bar');
const chaosBar = document.getElementById('chaos-bar');

const inspectionMenu = document.getElementById('inspection-menu');
const inspectName = document.getElementById('inspect-name');
const inspectAge = document.getElementById('inspect-age');
const btnLetIn = document.getElementById('btn-let-in');
const btnDeny = document.getElementById('btn-deny');

/** Set in init(); cleared if we ever need to tear down */
let spawnIntervalId = null;
let lastTime = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// Functions
// ═══════════════════════════════════════════════════════════════════════════════

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

  const atStation = npcs.filter((n) => n.state === 'atStation' || n.state === 'inspecting');
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

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNpcData() {
  const age = 18 + Math.floor(Math.random() * 48);
  const isValidID = Math.random() > 0.35;
  const isAggressive = Math.random() > 0.72;
  const aggressionChance = 0.12 + Math.random() * 0.55;
  const vibeContribution = Math.round(-5 + Math.random() * 22);
  const name = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
  const idNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;
  return {
    name,
    age,
    isValidID,
    vibeContribution,
    isAggressive,
    aggressionChance,
    idNumber,
  };
}

class NPC {
  constructor(data) {
    Object.assign(this, data);
    this.state = 'moving';
    this.size = 20;
    this.half = this.size / 2;
    this.x = 20 + Math.random() * (canvas.width - 40);
    this.y = canvas.height + this.half + 24;
    this.speed = 0.65 + Math.random() * 0.45;
    this.color = randomFrom(GRUNGE_PALETTE);
  }

  update() {
    if (this.state === 'atStation' || this.state === 'inspecting') return;

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
      this.state = 'atStation';
      repositionStationQueue();
      return;
    }

    if (dist > 0.5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.half, this.y - this.half, this.size, this.size);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - this.half + 0.5, this.y - this.half + 0.5, this.size - 1, this.size - 1);

    if (this.state === 'atStation' || this.state === 'inspecting') {
      ctx.strokeStyle = 'rgba(224, 64, 251, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.half - 2, this.y - this.half - 2, this.size + 4, this.size + 4);
    }

    ctx.fillStyle = '#e8e8e8';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    const atReady = this.state === 'atStation' || this.state === 'inspecting';
    const nameLift = atReady ? 30 : 6;
    ctx.fillText(this.name.split(' ')[0], this.x, this.y - this.half - nameLift);

    if (this.state === 'atStation' && GameState.activeNpc !== this) {
      ctx.fillStyle = '#e1bee7';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('E', this.x, this.y - this.half - 10);
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
  if (!Array.isArray(npcs) || npcs.length >= MAX_NPCS) return;
  npcs.push(new NPC(generateNpcData()));
}

function updateHUD() {
  vibeBar.style.width = GameState.vibe + '%';
  chaosBar.style.width = GameState.chaos + '%';
}

function hideInspection() {
  inspectionMenu.classList.add('hidden');
  if (GameState.activeNpc && GameState.activeNpc.state === 'inspecting') {
    GameState.activeNpc.state = 'atStation';
  }
  GameState.activeNpc = null;
  GameState.isPaused = false;
  repositionStationQueue();
}

function showInspection(npc) {
  GameState.activeNpc = npc;
  npc.state = 'inspecting';
  GameState.isPaused = true;
  inspectName.textContent = npc.name;
  inspectAge.textContent = String(npc.age);
  inspectionMenu.classList.remove('hidden');
  repositionStationQueue();
}

function toggleInspection(npc) {
  if (npc.state !== 'atStation' && npc.state !== 'inspecting') return;
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
  if (i !== -1) npcs.splice(i, 1);
  if (GameState.activeNpc === npc) GameState.activeNpc = null;
}

function onLetIn() {
  const npc = GameState.activeNpc;
  if (!npc) return;
  GameState.addVibe(npc.vibeContribution);
  removeNpc(npc);
  hideInspection();
}

function onDeny() {
  const npc = GameState.activeNpc;
  if (!npc) return;
  const baseChaos = 5 + Math.floor(Math.random() * 4);
  if (Math.random() < npc.aggressionChance) {
    GameState.addChaos(baseChaos + 12);
  } else {
    GameState.addChaos(baseChaos);
  }
  removeNpc(npc);
  hideInspection();
}

function onCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;

  for (let i = npcs.length - 1; i >= 0; i--) {
    const npc = npcs[i];
    if (!npc.containsCanvasPoint(mx, my)) continue;
    if (npc.state === 'atStation' || npc.state === 'inspecting') {
      toggleInspection(npc);
    }
    return;
  }
}

function gameLoop(timestamp) {
  lastTime = timestamp;
  if (!GameState.isPaused) {
    for (const npc of npcs) npc.update();
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
  // Single 2D canvas: clear full buffer, repaint background, then sprites in the same frame.
  // (Canvas draw order is paint order; z-index applies to DOM elements, not to these paths.)
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

  spawnIntervalId = setInterval(spawnNPC, 6000);
  spawnNPC();

  updateHUD();

  btnLetIn.addEventListener('click', onLetIn);
  btnDeny.addEventListener('click', onDeny);
  canvas.addEventListener('click', onCanvasClick);

  requestAnimationFrame(gameLoop);
}

init();
