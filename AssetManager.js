/**
 * Preloads drawable assets. Placeholders are rasterized from canvas for now;
 * swap draw functions or add URL loading when real art is ready.
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

  function drawNpcBase(c) {
    c.width = NPC_W;
    c.height = NPC_H;
    const x = c.getContext('2d');
    x.clearRect(0, 0, NPC_W, NPC_H);

    const body = x.createLinearGradient(0, 0, NPC_W, NPC_H);
    body.addColorStop(0, '#2a2438');
    body.addColorStop(0.5, '#1a1524');
    body.addColorStop(1, '#0e0c14');
    x.fillStyle = body;

    x.beginPath();
    x.ellipse(NPC_W / 2, 22, 14, 16, 0, 0, Math.PI * 2);
    x.fill();

    x.beginPath();
    x.moveTo(NPC_W / 2 - 18, 38);
    x.lineTo(NPC_W / 2 + 18, 38);
    x.lineTo(NPC_W / 2 + 22, 72);
    x.lineTo(NPC_W / 2 - 22, 72);
    x.closePath();
    x.fill();

    x.fillRect(NPC_W / 2 - 8, 72, 16, 16);
    x.fillRect(NPC_W / 2 - 22, 48, 10, 36);
    x.fillRect(NPC_W / 2 + 12, 48, 10, 36);

    x.fillStyle = 'rgba(0, 0, 0, 0.35)';
    x.beginPath();
    x.ellipse(NPC_W / 2 - 4, 20, 5, 6, 0, 0, Math.PI * 2);
    x.fill();
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
        ['background_club', drawBackgroundClub],
        ['npc_base', drawNpcBase],
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
