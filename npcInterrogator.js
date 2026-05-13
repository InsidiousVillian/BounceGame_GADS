/**
 * NPC "brain" — builds prompts and calls {@link ./ollamaBridge.js} for patron dialogue.
 *
 * @module npcInterrogator
 */

import { generateOllamaText } from './ollamaBridge.js';

/** Bouncer is reviewing ID / dossier just opened. */
export const INTERACTION_GREETING = 'Greeting';

/** Patron reacts to being denied / ejected from line (existing frustrated queue voice). */
export const INTERACTION_DENIAL = 'Denial';

/**
 * @typedef {object} NPCData
 * @property {string} [name]
 * @property {string} [race]
 * @property {string|number} [age]
 * @property {string} [reason] - Why they are in line / what they want
 * @property {'Aggressive' | 'Pleading' | 'Neutral' | 'Impatient' | 'Nervous' | string} [mood]
 */

/**
 * Stable JSON line for the current NPC (strict block for the model).
 * @param {NPCData} npcData
 */
function formatNpcPayload(npcData) {
  const d = npcData && typeof npcData === 'object' ? npcData : {};
  return JSON.stringify({
    name: d.name != null ? String(d.name) : 'Unknown',
    race: d.race != null ? String(d.race) : 'Unknown',
    age: d.age != null ? d.age : '?',
    reason: d.reason != null ? String(d.reason) : 'No reason given',
    mood: d.mood != null ? String(d.mood) : 'Neutral',
  });
}

/**
 * @param {'Greeting' | 'Denial' | string} interactionType
 */
function normalizeInteractionType(interactionType) {
  const t = String(interactionType || INTERACTION_DENIAL).trim().toLowerCase();
  if (t === 'greeting') return INTERACTION_GREETING;
  if (t === 'denial') return INTERACTION_DENIAL;
  return INTERACTION_DENIAL;
}

/**
 * Mood branch for **denial** prompts (post-reject queue rage / plea).
 * @param {NPCData} npcData
 */
function denialMoodDirective(npcData) {
  const mood = String(npcData?.mood ?? 'Neutral').trim().toLowerCase();
  if (mood === 'aggressive') {
    return [
      'MOOD: AGGRESSIVE.',
      'Lean HOSTILE: snarling patience, blunt threats or insults, ready to escalate—still believable as someone in a real queue.',
    ].join(' ');
  }
  if (mood === 'pleading') {
    return [
      'MOOD: PLEADING.',
      'Lean DESPERATE: bargaining, begging, or fragile hope—emotionally exposed, still one gritty sentence.',
    ].join(' ');
  }
  return 'MOOD: not specified — default to tired, cynical queue frustration without going extreme.';
}

/**
 * Tone for **greeting** prompts (rope / ID check in progress).
 * @param {NPCData} npcData
 */
function greetingMoodDirective(npcData) {
  const mood = String(npcData?.mood ?? 'Neutral').trim().toLowerCase();
  if (mood === 'impatient' || mood === 'aggressive') {
    return [
      'TONE: IMPATIENT.',
      'You are annoyed to be held up—eye-roll energy, clipped, you want the check finished yesterday.',
    ].join(' ');
  }
  if (mood === 'nervous' || mood === 'pleading') {
    return [
      'TONE: NERVOUS.',
      'You are uneasy under scrutiny—fidgety honesty, hoping nothing on the card trips you up.',
    ].join(' ');
  }
  return 'TONE: mixed — a little guarded, neither fully chill nor melting down; one tight sentence.';
}

/**
 * @param {NPCData} npcData
 * @param {'Greeting' | 'Denial' | string} [interactionType]
 */
export function generateBouncerPrompt(npcData, interactionType = INTERACTION_DENIAL) {
  const kind = normalizeInteractionType(interactionType);
  const current = formatNpcPayload(npcData);

  if (kind === INTERACTION_GREETING) {
    const toneBlock = greetingMoodDirective(npcData);
    return [
      '=== INTERACTION ===',
      'Type: GREETING — the bouncer has stopped you at the rope and is inspecting your ID / dossier right now.',
      'You are the patron being checked (not the bouncer).',
      '',
      '=== PERSONA ===',
      'You are in line at a club; the scan feels personal—one sentence only.',
      'Speak in first person as that patron.',
      '',
      '=== RULES ===',
      '- Exactly ONE sentence maximum.',
      '- No quotation marks around your line.',
      '- No stage directions (no *asterisks*).',
      '- Sound like someone under a real flashlight at the door—impatient or nervous per tone below.',
      '',
      '=== TONE (greeting at rope) ===',
      toneBlock,
      '',
      '=== FEW-SHOT (Greeting — match Input -> Output) ===',
      'Input: {"name":"Tess","race":"Human","age":29,"reason":"Birthday party inside","mood":"Impatient"} -> Output: Yeah, it is me, the hologram is literally in my hand—can we scan and move before my whole group clocks me standing here like a prop?',
      'Input: {"name":"Vex","race":"Orc","age":37,"reason":"Guest list","mood":"Nervous"} -> Output: I know the photo looks harsh under this light—if anything reads weird, I swear the chip is legit, just tell me what you need me to spell.',
      'Input: {"name":"Len","race":"Human","age":22,"reason":"Industry night","mood":"Nervous"} -> Output: My heart is doing eighty right now because if you flag the sector code I am not getting another band tonight.',
      '',
      '=== YOUR TURN ===',
      `Input: ${current} -> Output:`,
    ].join('\n');
  }

  const moodBlock = denialMoodDirective(npcData);
  return [
    '=== INTERACTION ===',
    'Type: DENIAL — you were denied entry; you are reacting as the patron in line (not staff).',
    '',
    '=== PERSONA ===',
    'You are a gritty, frustrated patron in the queue aftermath of a rejection (not the bouncer).',
    'Speak in first person as that patron.',
    '',
    '=== RULES ===',
    '- Exactly ONE sentence maximum (one period or equivalent; no bullet lists).',
    '- No quotation marks around your line.',
    '- No stage directions (no *asterisks*, no "he says").',
    '- Stay in voice: urban night-out impatience, grounded not cartoonish.',
    '',
    '=== VIBE / MOOD (denial) ===',
    moodBlock,
    '',
    '=== FEW-SHOT (Denial — match Input -> Output shape and tone) ===',
    'Input: {"name":"Rico","race":"Human","age":34,"reason":"VIP list mix-up","mood":"Neutral"} -> Output: I have been baking in this line since midnight and your list still does not have my name—someone with a radio needs to fix it now.',
    'Input: {"name":"Mara","race":"Elf","age":120,"reason":"Forgot ID at home","mood":"Pleading"} -> Output: Please, I am begging you, I can recite the door code and my booking email word for word if you just give me thirty seconds before you turn me away.',
    'Input: {"name":"Jonas","race":"Dwarf","age":41,"reason":"Accused of cutting","mood":"Aggressive"} -> Output: I did not cut in front of anyone—he muscled past me and now you are eyeing me like I started it, and I am done being polite about it.',
    '',
    '=== YOUR TURN ===',
    `Input: ${current} -> Output:`,
  ].join('\n');
}

/**
 * @param {NPCData} npcData
 * @param {{ model?: string, signal?: AbortSignal, extraBody?: Record<string, unknown> }} [bridgeOptions]
 * @param {'Greeting' | 'Denial' | string} [interactionType]
 */
export async function getNPCResponse(npcData, bridgeOptions, interactionType = INTERACTION_DENIAL) {
  const prompt = generateBouncerPrompt(npcData, interactionType);
  return generateOllamaText(prompt, bridgeOptions);
}
