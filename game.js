// ── Canvas Setup ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Game State ────────────────────────────────────────────────────────────────
const GameState = {
  vibe:  50,   // 0-100: overall club atmosphere
  chaos: 0,    // 0-100: disorder level; hits 100 = game over
  npcs:  [],
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

// ── NPC Class ─────────────────────────────────────────────────────────────────
class NPC {
  constructor({ name, age, isValidID, vibeContribution, isAggressive }) {
    this.name             = name;
    this.age              = age;
    this.isValidID        = isValidID;
    this.vibeContribution = vibeContribution; // positive = good vibe, negative = bad
    this.isAggressive     = isAggressive;

    // Spawn at a random position on the canvas edge
    this.x      = Math.random() * canvas.width;
    this.y      = canvas.height + 20;          // start below screen
    this.radius = 10;
    this.speed  = 0.8 + Math.random() * 0.6;
    this.color  = isAggressive ? '#ff3d00' : '#7b2ff7';
  }

  update() {
    // Basic upward movement toward the door (top-centre)
    const targetX = canvas.width / 2;
    const targetY = canvas.height * 0.8;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - this.radius - 4);
  }
}

// ── HUD Sync ──────────────────────────────────────────────────────────────────
const vibeBar  = document.getElementById('vibe-bar');
const chaosBar = document.getElementById('chaos-bar');

function updateHUD() {
  vibeBar.style.width  = GameState.vibe  + '%';
  chaosBar.style.width = GameState.chaos + '%';
}
updateHUD();

// ── Game Loop ─────────────────────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!GameState.isPaused) {
    update(delta);
    render();
  }

  requestAnimationFrame(gameLoop);
}

function update(delta) {
  for (const npc of GameState.npcs) {
    npc.update(delta);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw door marker
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const doorW = 60;
  const doorX = canvas.width / 2 - doorW / 2;
  const doorY = canvas.height * 0.8 - 30;
  ctx.fillStyle = '#7b2ff7';
  ctx.fillRect(doorX, doorY, doorW, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('DOOR', canvas.width / 2, doorY + 19);

  for (const npc of GameState.npcs) {
    npc.draw(ctx);
  }
}

// ── Kick Off ──────────────────────────────────────────────────────────────────
requestAnimationFrame(gameLoop);