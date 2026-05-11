/**
 * NPC "brain" — builds prompts and calls {@link ./ollamaBridge.js} for patron dialogue.
 *
 * @module npcInterrogator
 */

import { generateOllamaText } from './ollamaBridge.js';

/**
 * @typedef {object} NPCData
 * @property {string} [name]
 * @property {string} [race]
 * @property {string|number} [age]
 * @property {string} [reason] - Why they are in line / what they want
 * @property {'Aggressive' | 'Pleading' | string} [mood] - Steers tone (hostile vs desperate)
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
 * Mood branch copy for prompt engineering ("vibe check").
 * @param {NPCData} npcData
 */
function moodDirective(npcData) {
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
 * Builds one prompt string for Ollama `generate`: persona, few-shot examples, structured NPC input.
 *
 * @param {NPCData} npcData
 * @returns {string}
 */
export function generateBouncerPrompt(npcData) {
  const moodBlock = moodDirective(npcData);
  const current = formatNpcPayload(npcData);

  return [
    '=== PERSONA ===',
    'You are a gritty, frustrated patron standing in a queue (not the bouncer, not staff).',
    'Speak in first person as that patron.',
    '',
    '=== RULES ===',
    '- Exactly ONE sentence maximum (one period or equivalent; no bullet lists).',
    '- No quotation marks around your line.',
    '- No stage directions (no *asterisks*, no "he says").',
    '- Stay in voice: urban night-out impatience, grounded not cartoonish.',
    '',
    '=== VIBE / MOOD ===',
    moodBlock,
    '',
    '=== FEW-SHOT (match Input -> Output shape and tone) ===',
    'Input: {"name":"Rico","race":"Human","age":34,"reason":"VIP list mix-up","mood":"Neutral"} -> Output: I have been baking in this line since midnight and your list still does not have my name—someone with a radio needs to fix it now.',
    'Input: {"name":"Mara","race":"Elf","age":120,"reason":"Forgot ID at home","mood":"Pleading"} -> Output: Please, I am begging you, I can recite the door code and my booking email word for word if you just give me thirty seconds before you turn me away.',
    'Input: {"name":"Jonas","race":"Dwarf","age":41,"reason":"Accused of cutting","mood":"Aggressive"} -> Output: I did not cut in front of anyone—he muscled past me and now you are eyeing me like I started it, and I am done being polite about it.',
    '',
    '=== YOUR TURN ===',
    `Input: ${current} -> Output:`,
  ].join('\n');
}

/**
 * Runs the LLM for this NPC. Returns the same shape as {@link generateOllamaText}
 * (`ok`, `fromFallback`, `text` on success; `dialogue` on fallback).
 *
 * @param {NPCData} npcData
 * @param {{ model?: string, signal?: AbortSignal, extraBody?: Record<string, unknown> }} [bridgeOptions] - passed through to `generateOllamaText`
 */
export async function getNPCResponse(npcData, bridgeOptions) {
  const prompt = generateBouncerPrompt(npcData);
  return generateOllamaText(prompt, bridgeOptions);
}
