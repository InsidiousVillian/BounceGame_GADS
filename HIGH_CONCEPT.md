# High Concept Document

## The Velvet Rope

**Game Design 3A — Portfolio of Evidence (Part 2)**

**Student:** Sechaba Mokena & Jet Tai Kingston  
**Date:** June 2026

---

## 1. Game Overview

| Field | Detail |
|-------|--------|
| **Title** | The Velvet Rope |
| **Genre** | Interactive Simulation / Narrative Interrogation Game |
| **Platform** | PC (HTML) |
| **Playtime** | One "night" = 3–6 minutes (12–18 aliens) |
| **Target Audience** | Fans of *Papers, Please*, narrative-driven indie games, and sci-fi comedy |

### Logline

On the neon-drenched alien planet Xyphos-9, you are the head bouncer at the exclusive underground club "The Velvet Rope". Stand at the velvet rope, inspect IDs, search for contraband, interrogate shady aliens using dynamic LLM-powered dialogue, accept or reject bribes, and carefully manage the Vibe Meter to maximise your pay without letting the party peak too early.

---

## 2. Core Gameplay Loop

For each alien at the velvet rope:

1. Visually inspect appearance and racial traits.
2. Compare holographic ID.
3. Search for weapons, drugs, or illegal alcohol.
4. Interrogate using free-text questions (powered by Ollama).
5. Decide: **Let In** / **Deny** / **Detain** / **Accept Bribe**

**Key Tension:** Correct security decisions slowly raise the Vibe Meter. Bribes give fast boosts but risk an early club closure if Vibe peaks too soon.

---

## 3. Unique Selling Points

- Living LLM interrogation system using local Ollama for AI dialogue.
- 10 distinct alien races with unique backstories.
- Meaningful bribe mechanic with risk/reward.
- Local AI integration focused on privacy and reproducibility.

---

## 4. Role of Local LLM

Ollama powers real-time dialogue, bribe offers, and adaptive responses — making every playthrough unique.

---

## 5. Visual & Audio Style

Cyberpunk neon aesthetic with pixel art ID portraits and holographic UI.

---

## 6. Technical Summary

| Component | Detail |
|-----------|--------|
| **Engine** | HTML |
| **LLM** | Ollama (`llama3.2:3b`) |
| **Core Focus** | Meaningful local LLM gameplay integration |
