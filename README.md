# The Velvet Rope

A local LLM-powered bouncer simulation game

**Game Design 3A — Portfolio of Evidence (Part 2 & 3)**

---

## Overview

You are the head bouncer at "The Veil" on planet Xyphos-9. Guard the velvet rope: inspect aliens, check IDs, search for contraband, question them using real-time Ollama dialogue, handle bribes, and manage the Vibe Meter to end the night with maximum pay.

**Core Feature:** Dynamic, context-aware alien dialogue and bribe offers powered by locally hosted Ollama.

---

## Requirements

- Ollama running locally (`ollama run llama3.2:3b`)
- Unity 2022.3+

---

## How to Run

1. Start Ollama with the chosen model.
2. Open the project in Unity.
3. Play the "BouncerBooth" scene.
4. Type questions in the input field.

> **Note:** Fallback dialogue is used if Ollama is unavailable.

---

## Controls

- Type questions and press **Enter**.
- Click decision buttons (**Let In**, **Deny**, **Detain**, **Accept Bribe**).

---

## AI Tools Used

- Ollama (local LLM)
- Grok (asset generation & documentation)

---

## Version History

| Version | Notes |
|---------|-------|
| v1.0 | Initial prototype |
| v1.1 | Post-meetup refinements |

---

## Credits

**Design & Development:** Sechaba Mokoena and Jet Tai Kingston  
**Pixel ID Portraits:** Grok Imagine

**Privacy Note:** Fully local LLM — no player data leaves your machine.
