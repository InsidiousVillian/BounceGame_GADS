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

  function generateNpcData() {
    const age = 16 + Math.floor(Math.random() * 35);
    const isMinor = age < 21;
    const isValidID = Math.random() > 0.32;
    const vibeContribution = Math.round(4 + Math.random() * 18);
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const idNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;
    const reasonForEntry = pick(REASONS_FOR_ENTRY);
    const aggressionChance = 0.14 + Math.random() * 0.48;

    return {
      name,
      age,
      isValidID,
      isMinor,
      reasonForEntry,
      vibeContribution,
      idNumber,
      aggressionChance,
    };
  }

  global.NPCSystem = { generateNpcData };
})(typeof window !== 'undefined' ? window : globalThis);
