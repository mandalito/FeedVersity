# FeedVersity — Making YouTube's Recommendation Dynamics Visible

> *We are what we watch.*

A Chrome extension that makes the shape of your YouTube media diet legible — without judgment, without cloud calls, without leaving your browser.

Built for **UNIL MScIS · Interaction Design (IxD) · Spring 2026 · Group D** as part of the course project on transforming democratic discourse.

📊 **[View the final presentation →](https://mandalito.github.io/FeedVersity/presentation.html)**

---

## The pivot: from BubbleBreak (v1) to Feedversity (v2)

This repository contains **two iterations** of the same artefact. The transformation between them is the story of the project.

### v1 — BubbleBreak *(January 2026, CIVIS BIP workshop)*

A first prototype built in one week without formative user research. It featured:

- A 0–5 **radicalisation risk score** per video, computed via OpenAI GPT-4o-mini
- An **active blackout** that hid the YouTube homepage and Shorts above a threshold
- A D3.js zoomable circle-packing **dashboard**
- Framing: *"You are at risk."*

Lives at [`extension/`](./extension). Functional but **deprecated** — the formative research conducted in Spring 2026 invalidated several of its core assumptions.

### v2 — Feedversity *(May 2026, IxD course)*

A research-driven redesign following 11 semi-structured interviews and a 32-respondent screener. v2 retires features that were technically working but conceptually incompatible with what users actually told us. It introduces:

- A **Diet metaphor** with 15 neutral categories (no risk score, no judgmental colour)
- A **Dynamic Island** in the bottom-right corner with an evolving food emoji (🥖 → 🥪 → 🥗 → 🍱 → 🍲) encoding diversity at a glance
- A **Weekly Mirror** modal with the Diet card, a Diversity Score, channel-discovery suggestions, and a Recent Watches list with per-row reclassification
- A **"Why this Video?"** tooltip that explains each recommendation in plain language, grounded in the user's actual watch history
- A **three-tier local classifier** (channel signals → metadata → keywords) — no OpenAI dependency, nothing leaves the browser
- Framing: *"Here is what you've been eating."*

Lives at [`extension-v2/`](./extension-v2). See [`extension-v2/DESIGN_DECISIONS.md`](./extension-v2/DESIGN_DECISIONS.md) for the single-source rationale behind every design choice, with course-slide and finding traceability.

### The shift in five lines

| v1 (deprecated) | → | v2 (current) | Driven by |
|---|---|---|---|
| Per-video risk score 0–5 | → | Diet metaphor, 15 neutral categories | F4 (legitimacy) |
| Active blackout of homepage | → | Reversible mute overlay | F3 (transparency over control) |
| OpenAI cloud dependency | → | Three-tier local classifier | F5 (trust = local) |
| D3 risk dashboard | → | Diet card + Why this Video? | F3 (explain, don't measure) |
| "You are at risk" | → | "Here is what you've been eating" | F1 + F4 (awareness without stigma) |

---

## Repository layout

```
BubbleBreak/
├── extension/             # v1 BubbleBreak (deprecated, kept for reference)
├── extension-v2/          # v2 Feedversity (current)
│   ├── DESIGN_DECISIONS.md   # Single-source rationale for every choice
│   ├── manifest.json
│   ├── icons/
│   └── src/
├── presentation.html      # Final presentation (Prism-style, 13 scenes)
├── qr-feedversity.png     # QR code shown on the closing slide
├── scripts/
└── README.md
```

---

## Install (v2 Feedversity)

1. Clone this repository

   ```bash
   git clone https://github.com/mandalito/FeedVersity.git
   ```

2. Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the `extension-v2/` folder.

3. Visit YouTube. A 5-slide warm welcome modal appears on first install.

That's it. No API key, no sign-up, no data leaves your browser.

---

## Final presentation

A single-file HTML presentation, prism-style, 13 scenes, ~12 minutes.

- **Live**: [mandalito.github.io/FeedVersity/presentation.html](https://mandalito.github.io/FeedVersity/presentation.html)
- **Local**: open [`presentation.html`](./presentation.html) in any modern browser
- **Navigation**: `→` / `Space` / `PageDown` advance, `←` / `PageUp` rewind, click anywhere advances

Built with vanilla HTML/CSS/JS, GSAP animations, and the Feedversity design language (peach/coral/ink palette, Inter + JetBrains Mono).

---

## Course context

This project was submitted as the final deliverable for **Interaction Design (IxD)**, Spring 2026, taught at the University of Lausanne (UNIL) HEC, MScIS programme. The accompanying final report (44 pages) documents the formative research methodology, the design rationale, the within-subjects usability test with five participants, and a reflection on the **audience paradox**: five out of five test participants placed themselves outside the tool's target audience, while projecting it onto a hypothetical other.

The most valuable finding was one we could not have anticipated from formative research alone. User-centred design didn't just shape our features — it told us we were designing for the wrong audience.

---

## Team — Group D

| Role | Name |
|---|---|
| Project Manager | Christian Russo |
| UX Researcher | Léa Jouffrey |
| IxD Designers | Aurélie Rihs · Kevin Verderame |
| Software Engineers | Halim Youssef · Sacha Jocic |

---

## Privacy

Feedversity runs **entirely on your device**. The extension uses Chrome's `storage.local` API, a content script on `youtube.com`, and a three-tier classifier built from local rules — no external API, no telemetry, no third-party services.

The v1 extension (deprecated, in `extension/`) does send video titles and channel names to OpenAI for categorisation. If you load it, you must provide your own API key, which is stored only in your browser's local storage.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- **Prof. Cherubini** — for the office-hours guidance that surfaced the guardians-and-adolescents repositioning hypothesis
- **The 16 participants** across formative interviews and usability tests who shaped this design
- The IxD Spring 2026 cohort — for the structured feedback at every milestone
- [GSAP](https://gsap.com/) for the presentation animations
- The original CIVIS BIP "Digital Transformation of the Democratic Discourse" workshop (January 2026) for the v1 prototype that gave us a working artefact to confront with research
