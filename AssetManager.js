/**
 * Preloads drawable assets. Placeholders are rasterized from canvas for now;
 * swap draw functions or add URL loading when real art is ready.
 * Keys: background_club_entrance, foreground_club, npc_base, npc_walk_a/b, effect_punch.
 */
(function (global) {
  const BG_W = 960;
  const BG_H = 540;
  const NPC_W = 56;
  const NPC_H = 88;
  const POW_W = 72;
  const POW_H = 72;

  function drawBackgroundClub(c) {
    c.width = BG_W;
    c.height = BG_H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, BG_H);
    g.addColorStop(0, '#0d0a14');
    g.addColorStop(0.45, '#151022');
    g.addColorStop(1, '#08060c');
    x.fillStyle = g;
    x.fillRect(0, 0, BG_W, BG_H);

    x.fillStyle = '#12101a';
    x.fillRect(0, BG_H * 0.72, BG_W, BG_H * 0.28);

    const archX = BG_W * 0.38;
    const archW = BG_W * 0.24;
    const archTop = BG_H * 0.18;
    const archBot = BG_H * 0.78;
    x.fillStyle = '#1a1528';
    x.beginPath();
    x.moveTo(archX, archBot);
    x.lineTo(archX, archTop + 40);
    x.quadraticCurveTo(archX + archW / 2, archTop - 20, archX + archW, archTop + 40);
    x.lineTo(archX + archW, archBot);
    x.closePath();
    x.fill();

    x.strokeStyle = 'rgba(123, 47, 247, 0.55)';
    x.lineWidth = 4;
    x.stroke();
    x.strokeStyle = 'rgba(0, 255, 200, 0.25)';
    x.lineWidth = 2;
    x.stroke();

    x.fillStyle = '#0a0810';
    x.fillRect(archX + 18, archTop + 50, archW - 36, archBot - archTop - 50);

    x.fillStyle = 'rgba(224, 64, 251, 0.12)';
    for (let i = 0; i < 5; i++) {
      const py = archTop + 60 + i * 28;
      x.fillRect(archX + 22, py, archW - 44, 3);
    }

    x.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 20; col++) {
        if ((row + col) % 3 === 0) x.fillRect(col * 48 + (row % 2) * 24, BG_H * 0.75 + row * 6, 2, 2);
      }
    }

    x.fillStyle = 'rgba(30, 25, 45, 0.9)';
    x.fillRect(0, 0, BG_W * 0.22, BG_H);
    x.fillRect(BG_W * 0.78, 0, BG_W * 0.22, BG_H);

    x.fillStyle = 'rgba(255, 255, 255, 0.03)';
    x.fillRect(BG_W * 0.5 - 2, archTop + 30, 4, archBot - archTop - 30);
  }

  /** @param {number} frame 0 or 1 — slight lean for walk cycle */
  function drawNpcBaseFrame(c, frame) {
    c.width = NPC_W;
    c.height = NPC_H;
    const x = c.getContext('2d');
    x.clearRect(0, 0, NPC_W, NPC_H);

    const lean = frame === 1 ? 2.2 : -1.1;
    const squash = frame === 1 ? 0.96 : 1.02;
    const cx = NPC_W / 2 + lean;

    const body = x.createLinearGradient(0, 0, NPC_W, NPC_H);
    body.addColorStop(0, '#2a2438');
    body.addColorStop(0.5, '#1a1524');
    body.addColorStop(1, '#0e0c14');
    x.fillStyle = body;

    x.save();
    x.translate(cx, 22);
    x.scale(squash, 1);
    x.translate(-cx, -22);

    x.beginPath();
    x.ellipse(cx, 22, 14, 16, 0, 0, Math.PI * 2);
    x.fill();

    x.beginPath();
    x.moveTo(cx - 18, 38);
    x.lineTo(cx + 18, 38);
    x.lineTo(cx + 22, 72);
    x.lineTo(cx - 22, 72);
    x.closePath();
    x.fill();

    x.fillRect(cx - 8, 72, 16, 16);
    x.fillRect(cx - 22, 48, 10, 36);
    x.fillRect(cx + 12, 48, 10, 36);

    x.fillStyle = 'rgba(0, 0, 0, 0.35)';
    x.beginPath();
    x.ellipse(cx - 4, 20, 5, 6, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();
  }

  function drawNpcBase(c) {
    drawNpcBaseFrame(c, 0);
  }

  function drawForegroundClub(c) {
    c.width = BG_W;
    c.height = BG_H;
    const x = c.getContext('2d');
    x.clearRect(0, 0, BG_W, BG_H);

    x.fillStyle = 'rgba(0, 0, 0, 0)';
    x.fillRect(0, 0, BG_W, BG_H);

    const floorY = BG_H * 0.78;
    const podiumW = BG_W * 0.34;
    const podiumH = BG_H * 0.22;
    const podiumX = (BG_W - podiumW) / 2;

    const gradPod = x.createLinearGradient(0, floorY - podiumH, 0, BG_H);
    gradPod.addColorStop(0, 'rgba(18, 14, 28, 0.92)');
    gradPod.addColorStop(0.55, 'rgba(12, 10, 20, 0.88)');
    gradPod.addColorStop(1, 'rgba(6, 5, 12, 0.95)');
    x.fillStyle = gradPod;
    x.beginPath();
    x.moveTo(podiumX + 20, floorY);
    x.lineTo(podiumX + podiumW - 20, floorY);
    x.lineTo(podiumX + podiumW, floorY + podiumH);
    x.lineTo(podiumX, floorY + podiumH);
    x.closePath();
    x.fill();

    x.strokeStyle = 'rgba(123, 47, 247, 0.35)';
    x.lineWidth = 2;
    x.stroke();

    const ropeY = floorY - 8;
    x.strokeStyle = 'rgba(224, 64, 251, 0.55)';
    x.lineWidth = 4;
    x.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      const sx = BG_W / 2 + side * (podiumW * 0.42);
      x.beginPath();
      x.moveTo(sx, ropeY - 50);
      x.quadraticCurveTo(sx + side * 80, ropeY - 10, BG_W / 2 + side * 18, ropeY + 6);
      x.stroke();
    }
    x.strokeStyle = 'rgba(255, 200, 120, 0.4)';
    x.lineWidth = 2.5;
    for (let side = -1; side <= 1; side += 2) {
      const sx = BG_W / 2 + side * (podiumW * 0.42);
      x.beginPath();
      x.moveTo(sx, ropeY - 48);
      x.quadraticCurveTo(sx + side * 76, ropeY - 8, BG_W / 2 + side * 16, ropeY + 4);
      x.stroke();
    }

    x.fillStyle = 'rgba(30, 22, 40, 0.75)';
    for (let side = -1; side <= 1; side += 2) {
      const px = BG_W / 2 + side * (podiumW * 0.52 + 24);
      x.fillRect(px - 6, ropeY - 4, 12, 38);
      x.fillStyle = 'rgba(224, 64, 251, 0.25)';
      x.beginPath();
      x.arc(px, ropeY - 4, 8, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = 'rgba(30, 22, 40, 0.75)';
    }

    x.fillStyle = 'rgba(0, 0, 0, 0.35)';
    x.fillRect(0, floorY + podiumH - 6, BG_W, BG_H - floorY - podiumH + 6);
  }

  function drawEffectPunch(c) {
    c.width = POW_W;
    c.height = POW_H;
    const x = c.getContext('2d');
    x.clearRect(0, 0, POW_W, POW_H);

    const spikes = 10;
    x.save();
    x.translate(POW_W / 2, POW_H / 2);
    for (let i = 0; i < spikes; i++) {
      x.rotate((Math.PI * 2) / spikes);
      const grd = x.createLinearGradient(0, 0, 22, 0);
      grd.addColorStop(0, 'rgba(255, 248, 200, 0)');
      grd.addColorStop(0.4, 'rgba(255, 220, 100, 0.95)');
      grd.addColorStop(1, 'rgba(255, 180, 40, 0)');
      x.fillStyle = grd;
      x.beginPath();
      x.moveTo(4, 0);
      x.lineTo(26, -7);
      x.lineTo(32, 0);
      x.lineTo(26, 7);
      x.closePath();
      x.fill();
    }
    x.restore();

    x.fillStyle = 'rgba(255, 255, 255, 0.9)';
    x.font = 'bold 14px Impact, "Arial Black", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.strokeStyle = 'rgba(200, 60, 20, 0.85)';
    x.lineWidth = 3;
    x.strokeText('POW', POW_W / 2, POW_H / 2);
    x.fillStyle = '#fffde7';
    x.fillText('POW', POW_W / 2, POW_H / 2);
  }

  function canvasToImage(canvas, onLoad, onError) {
    const img = new Image();
    img.onload = () => onLoad(img);
    img.onerror = () => onError(new Error('Image decode failed'));
    img.src = canvas.toDataURL('image/png');
  }

  const AssetManager = {
    ready: false,
    /** @type {Record<string, HTMLImageElement>} */
    images: {},

    /**
     * @param {() => void} onComplete
     * @param {(loaded:number,total:number)=>void} [onProgress]
     */
    load(onComplete, onProgress) {
      const jobs = [
        ['background_club_entrance', drawBackgroundClub],
        ['foreground_club', drawForegroundClub],
        ['npc_base', drawNpcBase],
        ['npc_walk_a', (cv) => drawNpcBaseFrame(cv, 0)],
        ['npc_walk_b', (cv) => drawNpcBaseFrame(cv, 1)],
        ['effect_punch', drawEffectPunch],
      ];
      let finished = 0;
      const total = jobs.length;
      const bump = () => {
        finished += 1;
        if (typeof onProgress === 'function') onProgress(finished, total);
        if (finished >= total) {
          this.ready = true;
          onComplete();
        }
      };

      jobs.forEach(([key, drawFn]) => {
        const canvas = document.createElement('canvas');
        drawFn(canvas);
        canvasToImage(
          canvas,
          (img) => {
            this.images[key] = img;
            bump();
          },
          () => {
            this.images[key] = canvas;
            bump();
          }
        );
      });
    },

    /** @param {string} key */
    get(key) {
      return this.images[key] || null;
    },
  };

  global.AssetManager = AssetManager;
})(typeof window !== 'undefined' ? window : globalThis);
