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

This external critique session was invaluable. It forced me to shift my perspective from "the system technically works" to "does it feel good to play?" The experience highlighted that in AI-assisted game development, technical robustness must be paired with excellent player feedback loops.
