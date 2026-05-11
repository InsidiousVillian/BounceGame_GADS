/**
 * Ollama bridge — async communication with a local Ollama server for bouncer-style copy.
 *
 * Import from your game (ES modules):
 *   import { generateOllamaText, ollamaBridgeState, OLLAMA_FALLBACK_RESULT } from './ollamaBridge.js';
 * Your entry script must be loaded with type="module" (or use a bundler).
 *
 * CORS / file:// vs http://localhost:11434
 * ────────────────────────────────────────
 * Loading the game from file:// (double-click index.html) and calling fetch(...) to another
 * origin is often restricted or inconsistently handled. Prefer serving the folder over HTTP
 * (e.g. `npx serve .`, VS Code Live Server, or Python `python -m http.server`) so the page
 * origin is http://localhost:<port>. Ollama usually answers localhost; if the browser still
 * reports CORS errors, check Ollama/release notes for CORS/origin settings or use a small
 * same-origin proxy that forwards POST /api/generate to 11434.
 */

export const DEFAULT_OLLAMA_MODEL = 'llama3'; // alternate: 'mistral'

export const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';

/** Shared loading flag — bind UI to this for "..." / "Thinking" while awaiting inference. */
export const ollamaBridgeState = {
  isModelLoading: false,
};

/**
 * Returned when Ollama is down, unreachable, or the response is unusable.
 * Shape is stable so game code can branch on `fromFallback` / `ok`.
 */
export const OLLAMA_FALLBACK_RESULT = {
  ok: false,
  fromFallback: true,
  model: DEFAULT_OLLAMA_MODEL,
  error: 'OLLAMA_UNAVAILABLE',
  /** Primary line for HUD / speech bubble */
  dialogue:
    "Listen — I don't make the rules. You're not getting in like this. Step back and come back when you're sorted.",
  /** Optional alternates for variety if your UI supports rotation */
  alternates: [
    'Not tonight. Queue moves that way.',
    'ID and attitude check out, or you walk. Right now they do not.',
    'Club policy. I need you to comply or we’re done here.',
  ],
};

/**
 * @param {object} [overrides] - Fields merged shallowly onto a copy of OLLAMA_FALLBACK_RESULT.
 * @returns {typeof OLLAMA_FALLBACK_RESULT}
 */
export function buildFallbackResult(overrides = {}) {
  return { ...OLLAMA_FALLBACK_RESULT, ...overrides };
}

/**
 * @typedef {object} GenerateOptions
 * @property {string} [model] - Ollama model name (default: DEFAULT_OLLAMA_MODEL).
 * @property {AbortSignal} [signal] - Optional AbortController signal for timeouts/cancel.
 * @property {Record<string, unknown>} [extraBody] - Extra JSON fields for /api/generate (advanced).
 */

/**
 * POST to Ollama /api/generate with stream: false. Does not block the UI thread beyond normal fetch.
 *
 * @param {string} prompt
 * @param {GenerateOptions} [options]
 * @returns {Promise<{ ok: true, fromFallback: false, model: string, text: string, raw: unknown } | typeof OLLAMA_FALLBACK_RESULT & { text?: string }>}
 */
export async function generateOllamaText(prompt, options = {}) {
  const model = options.model ?? DEFAULT_OLLAMA_MODEL;
  const body = {
    model,
    prompt: String(prompt),
    stream: false,
    ...(options.extraBody && typeof options.extraBody === 'object' ? options.extraBody : {}),
  };

  ollamaBridgeState.isModelLoading = true;
  try {
    const res = await fetch(OLLAMA_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      return buildFallbackResult({
        error: `HTTP_${res.status}`,
        model,
      });
    }

    /** @type {unknown} */
    let data;
    try {
      data = await res.json();
    } catch {
      return buildFallbackResult({
        error: 'INVALID_JSON',
        model,
      });
    }

    const text =
      typeof data === 'object' &&
      data !== null &&
      'response' in data &&
      typeof /** @type {{ response?: unknown }} */ (data).response === 'string'
        ? /** @type {{ response: string }} */ (data).response.trim()
        : '';

    if (!text) {
      return buildFallbackResult({
        error: 'EMPTY_RESPONSE',
        model,
      });
    }

    return {
      ok: true,
      fromFallback: false,
      model,
      text,
      raw: data,
    };
  } catch (err) {
    const isAbort =
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      /** @type {{ name?: string }} */ (err).name === 'AbortError';

    return buildFallbackResult({
      error: isAbort ? 'ABORTED' : 'NETWORK_OR_SERVER_DOWN',
      model,
    });
  } finally {
    ollamaBridgeState.isModelLoading = false;
  }
}

export default {
  DEFAULT_OLLAMA_MODEL,
  OLLAMA_GENERATE_URL,
  ollamaBridgeState,
  OLLAMA_FALLBACK_RESULT,
  buildFallbackResult,
  generateOllamaText,
};
