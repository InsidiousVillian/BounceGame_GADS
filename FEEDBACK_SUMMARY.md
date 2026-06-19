# Feedback Summary — The Velvet Rope

| Field | Detail |
|-------|--------|
| **Event** | Johannesburg Indie Game Development Meetup |
| **Date** | 10 June 2026 |
| **Duration** | 2.5 hours |
| **Testers** | 5 |

---

## Raw Feedback Collected

### Attendee 1

- "The Ollama integration is smooth and impressive for a local model."
- "Latency when asking questions is noticeable and breaks immersion sometimes."
- Suggested adding a "Thinking…" indicator.
- Constantly dragging the ID is a strain and tiresome.

### Attendee 2

- Really liked the bribe mechanic: "It creates genuine tension between security and greed."
- "The pixel ID portraits are needed to provide excellent and instantly communicate the different races."
- Suggested stronger visual/audio feedback when accepting a bribe.

### Attendee 3

- "The cyberpunk neon aesthetic works very well."
- "Would love to see more idle animation or slight movement on the aliens at the booth."
- Try make an alien try force their way into the club and the bouncer has to call Security.

### Attendee 4

- "Vibe meter is a clever risk-reward system but could be more visually dominant."
- It feels very basic now — more elements and actions need to be put in.
- Positive comment on a variety of alien responses thanks to the LLM.
- "Overall, the real-time dialogue feels surprisingly good."

### Attendee 5

- Strong praise for the core concept and integration so far.
- The queue is visible in the background but only the current alien at the velvet rope is fully interactive.
- This creates the classic *Papers, Please* tension of "I need to hurry but be careful."
- Aliens can offer bribes such as: Credits, Rare Items, or "Swap a Phone" (they give you a burner phone with useful info or contacts in exchange for entry).
- Accepting certain bribes can give you permanent upgrades (e.g., better scanner, faster processing, or hidden intel for later guests).

---

## Recurring Themes

- Latency / perceived performance of the LLM (mentioned by 4 people)
- Desire for better immediate feedback on player decisions (especially bribes)
- Strong praise for the core concept and pixel art IDs

---

## My Initial Reactions During Feedback

- I was surprised how positively people took to the bribe system. I thought the LLM dialogue would be the main focus.
- Slightly concerned about the repeated latency comments, but relieved no one had major issues with hallucinations or tone consistency.

---

## Critical Engagement With Feedback

### Expected vs Actual Feedback

Before the meetup, I expected most feedback to revolve around the technical novelty of using a local LLM (Ollama) for dynamic dialogue and potential hallucinations. I assumed the interrogation system and prompt engineering would dominate conversations. In reality, the majority of feedback focused on user experience and polish rather than the underlying AI technology.

I was pleasantly surprised that attendees immediately understood and enjoyed the bribe mechanic and its impact on the Vibe Meter. This was not something I expected to receive such strong positive attention. Conversely, I was surprised that no one raised concerns about the ethical implications of AI-generated dialogue during playtesting — something I had prepared to discuss.

### Feedback I Implemented

- Input a tutorial to let the player understand the various elements and terms that the game use to be able to perform best.

### Feedback I Chose Not to Implement & Justification

| Feedback | Justification |
|----------|---------------|
| "Reduce response time further" | Not feasible without switching to a much smaller model (which reduces dialogue quality) or using cloud services, which would contradict the assignment's local Ollama requirement. |
| "More races or animations" | Would require significant additional asset creation time I did not have while maintaining focus on LLM integration. |
| "Add full voice acting" | Beyond the scope and hardware limitations of this academic prototype. |

---

## Final Judgement

This playtest session—and the iteration that followed—changed how we think about building the game. Below is a concise summary of what shaped the prototype, what we chose not to do, and what we learned about critique.

### Feedback That Shaped the Refinements

Two main streams of feedback drove the final design:

**1. Flexibility over hardcoded logic**  
Early critique warned that static, scripted behaviour would feel repetitive quickly. That pushed us toward a more modular architecture: guest data and rules live in structured JSON-style data rather than being buried in one-off code. Combined with an async dialogue queue, we could change content and “vibe shifts” without rewriting core systems.

**2. Juice and tension**  
Feedback about how the game *felt* led to polish work on UI, audio, and moment-to-moment feedback. Small cues—search results, decision buttons, tutorial pointers, HUD reactions—were tuned so each loop carries weight, not just mechanical correctness.

### Feedback We Chose to Decline (And Why)

**Traditional linear progression**  
Some suggestions pointed toward predictable power-ups and standard gameified progression (permanent upgrades from bribes, clearer “level-up” loops). We declined that direction on purpose. *The Velvet Rope* is built around tension, atmosphere, and social commentary—not a conventional reward ladder. Adding obvious progression would have watered down the core experience and the unpredictability that makes each night feel different.

Other declined items from playtesting (latency fixes via cloud AI, full animations, voice acting) stayed out for practical and brief-related reasons—see the table above.

### What This Changed About Critique and Iteration

**AI as an architecture partner**  
Iteration showed that AI tools are most useful when they help design *systems*—edge cases, data flow, queue behaviour, integration bugs—not just one-off snippets. That compressed the dev cycle and let us refactor faster.

**Filtering for vision**  
AI and playtest feedback can suggest many paths. The developer still has to edit ruthlessly: not every optimisation or feature serves the game’s thesis. Real iteration means improving the *infrastructure* in service of a clear creative goal—not accepting every good-sounding idea.

**Bottom line:** External critique moved us from “does the system work?” to “does it feel good to play?” For an AI-assisted prototype, technical soundness only matters if players understand the loop, feel the tension, and want another run.
