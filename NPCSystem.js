/**
 * NPC data generation — Papers, Please style fields.
 * Loaded before game.js; exposes window.NPCSystem.generateNpcData().
 */
(function (global) {
  const FIRST_NAMES = [
    'Alex', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Quinn', 'Reese', 'Skyler',
    'Jamie', 'Drew', 'Sam', 'Taylor', 'Avery', 'Cameron', 'Blake', 'Rowan',
  ];
  const LAST_NAMES = [
    'Vega', 'Knox', 'Reed', 'Shaw', 'Blake', 'Cross', 'Fox', 'Stone',
    'Wolf', 'Crow', 'Nash', 'Pike', 'Drake', 'Frost', 'Lane', 'Vale',
  ];

  const REASONS_FOR_ENTRY = [
    "It's my birthday",
    'I know the DJ',
    'VIP list — check under Stone',
    'Just here for one drink',
    'My cousin works the bar',
    'Industry night — I’m with the label',
    'Bachelorette party, we’re all together',
    'I left my wallet but I have a photo of my ID',
    'The promoter said I’m on the list',
    'I’m only grabbing a friend inside',
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const PORTRAIT_COLORS = [
    '#3d5a80', '#5c4d7c', '#2d6a4f', '#8b4a4a', '#4a6670', '#6b5b3d', '#4f5d75', '#5c4033',
    '#2a5c5c', '#6a4c6a', '#455a64', '#5d4037',
  ];

  /**
   * 3–4 geometric shapes suggesting a face (abstract portrait).
   * @returns {{ type: string, cx?: number, cy?: number, r?: number, x?: number, y?: number, size?: number, fill: string }[]}
   */
  function generatePortraitShapes() {
    const count = 3 + Math.floor(Math.random() * 2);
    const shapes = [];
    const faceR = 20 + Math.random() * 10;
    const cx = 44 + (Math.random() - 0.5) * 10;
    const cy = 54 + (Math.random() - 0.5) * 12;
    shapes.push({ type: 'circle', cx, cy, r: faceR, fill: pick(PORTRAIT_COLORS) });
    const eyeY = cy - 6 + Math.random() * 6;
    const eyeSpread = 11 + Math.random() * 6;
    shapes.push({
      type: 'circle',
      cx: cx - eyeSpread + Math.random() * 3,
      cy: eyeY,
      r: 3.5 + Math.random() * 3,
      fill: pick(PORTRAIT_COLORS),
    });
    shapes.push({
      type: 'circle',
      cx: cx + eyeSpread + Math.random() * 3,
      cy: eyeY,
      r: 3.5 + Math.random() * 3,
      fill: pick(PORTRAIT_COLORS),
    });
    if (count >= 4) {
      const noseSize = 7 + Math.random() * 6;
      shapes.push({
        type: 'triangle',
        x: cx + (Math.random() - 0.5) * 4,
        y: cy + 10 + Math.random() * 4,
        size: noseSize,
        fill: pick(PORTRAIT_COLORS),
      });
    } else {
      shapes.push({
        type: 'circle',
        cx: cx + (Math.random() - 0.5) * 8,
        cy: cy + 16 + Math.random() * 4,
        r: 2.5 + Math.random() * 2.5,
        fill: pick(PORTRAIT_COLORS),
      });
    }
    return shapes;
  }

  function portraitShapesToSvg(shapes) {
    const uid = `p${Math.floor(Math.random() * 1e9)}`;
    const parts = shapes.map((s) => {
      if (s.type === 'circle') {
        return `<circle cx="${s.cx.toFixed(2)}" cy="${s.cy.toFixed(2)}" r="${s.r.toFixed(2)}" fill="${s.fill}" opacity="0.94"/>`;
      }
      if (s.type === 'triangle') {
        const h = s.size * 0.866;
        const x1 = s.x;
        const y1 = s.y - (h * 2) / 3;
        const x2 = s.x - s.size / 2;
        const y2 = s.y + h / 3;
        const x3 = s.x + s.size / 2;
        const y3 = s.y + h / 3;
        return `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="${s.fill}" opacity="0.94"/>`;
      }
      return '';
    });
    return (
      `<svg class="id-portrait-svg" viewBox="0 0 88 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<defs><linearGradient id="${uid}-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d4d8dc"/><stop offset="100%" stop-color="#9aa3ad"/></linearGradient></defs>` +
      `<rect width="88" height="112" fill="url(#${uid}-bg)"/>` +
      parts.join('') +
      `</svg>`
    );
  }

  /**
   * @param {number} [aggressionBonus=0] — added to rolled aggression (e.g. difficulty scaling), capped at 1
   */
  function generateNpcData(aggressionBonus) {
    const bonus = typeof aggressionBonus === 'number' ? aggressionBonus : 0;
    const age = 16 + Math.floor(Math.random() * 35);
    const isMinor = age < 21;
    const isValidID = Math.random() > 0.32;
    const vibeContribution = Math.round(4 + Math.random() * 18);
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const idNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;
    const reasonForEntry = pick(REASONS_FOR_ENTRY);
    let aggressionChance = 0.14 + Math.random() * 0.48;
    aggressionChance = Math.min(1, aggressionChance + bonus);

    const portraitShapes = generatePortraitShapes();
    const portraitSvg = portraitShapesToSvg(portraitShapes);
    /** @type {'valid'|'missing'|'broken'} */
    let securitySealVariant = 'valid';
    if (!isValidID) {
      securitySealVariant = Math.random() < 0.5 ? 'missing' : 'broken';
    }

    return {
      name,
      age,
      isValidID,
      isMinor,
      reasonForEntry,
      vibeContribution,
      idNumber,
      aggressionChance,
      portraitSvg,
      securitySealVariant,
    };
  }

  global.NPCSystem = { generateNpcData, generatePortraitShapes, portraitShapesToSvg };
})(typeof window !== 'undefined' ? window : globalThis);
