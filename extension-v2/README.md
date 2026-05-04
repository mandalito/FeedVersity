# Feedversity

> *We are what we watch.*

Chrome extension that surfaces YouTube's recommendation dynamics. Tracks your weekly **Diet** across 15 content categories, computes a **Diversity Score**, and helps you actively broaden what you watch — all on your device.

| Surface | Where | Goal |
|---|---|---|
| **Floating dish** + sidebar entry | bottom-right + YouTube guide | DG3 — present, non-intrusive launcher |
| **Smart banner** | bottom-left toast, after ≥10 watches when diet is concentrated | DG1 — gentle reflection moment |
| **Weekly Mirror** modal | opens from the dish, sidebar, or banner | DG1 + DG2 + DG4 — surface diet, score, suggestions |
| **Why this Video?** pill + 3-dot menu entry | next to Share on watch page | DG2 + F1 — explain the recommendation |
| **Warm Welcome** | first install or `?` button in the Mirror | DG5 — onboarding in 5 slides |

Real watch data lives in `chrome.storage.local` (key `bb_watches`). Mocks in `src/shared/mock-data.js` fill the gaps before the user has 5 watches.

## Install (Chrome desktop) — for testers

1. Download / clone the repo to a local folder.
2. Open `chrome://extensions/`.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked** → pick the `extension-v2/` folder.
5. Open `https://www.youtube.com/` — the Warm Welcome opens automatically on first install.

To update later: pull the latest code, then click the **↻ refresh** icon under the *Feedversity* card on `chrome://extensions/`.

## Smoke checklist

- [ ] Warm Welcome opens automatically on first YouTube visit
- [ ] Floating **🍞 / 🥪 / 🥗 / 🍱 / 🍲** dish appears bottom-right (icon depends on diversity)
- [ ] **Feedversity** entry appears at the top of the left sidebar (full + mini)
- [ ] Dish click → Weekly Mirror modal opens; ESC or backdrop click closes it
- [ ] Mirror at 0-4 watches shows the empty-state with progress bar (`N / 5`)
- [ ] Mirror at 5+ watches shows: Your Diet bar, Diversity Score card, NEW CHANNELS TO EXPLORE with hero card, Recent Watches with reclassification dropdown
- [ ] After ≥10 watches with one category > 65 % → smart banner pops bottom-centre (24h snooze on dismiss)
- [ ] On a `/watch` page, a **Why this Video?** pill is added next to Share
- [ ] Pill / 3-dot menu entry shows a contextual tooltip with a real-data reason
- [ ] `?` button in the Mirror header re-opens the Warm Welcome

## Resetting state (for user tests)

Open the BubbleBreak v2 context in DevTools console:

```js
chrome.storage.local.clear();        // wipe everything
location.reload();                    // re-trigger Warm Welcome on next visit
```

Or use the **Reset** button (red, in the Mirror header) to wipe only the watch history while keeping mute settings and onboarding state.

## Mobile preview (Chrome desktop)

DevTools → Toggle device toolbar → set viewport to 390 × 844 (iPhone 14).
The banner repositions, the channel list stays vertical, and the Mirror
modal becomes scrollable.

## File map

```
extension-v2/
├── manifest.json
├── DESIGN_DECISIONS.md              # full rationale (course-grounded)
├── icons/
└── src/
    ├── background/background.js              # service worker
    ├── shared/
    │   ├── mock-data.js                      # palette + curated channels + mocks
    │   ├── classifier.js                     # 3-tier categorisation
    │   └── stats.js                          # watch history + diversity computation
    ├── styles/
    │   ├── tokens.css                        # design tokens (colours, typo, radii)
    │   └── bubblebreak.css                   # components (legacy file name)
    └── content/
        ├── watch-tracker.js                  # records each /watch?v= visited
        ├── feed-filter.js                    # mute → hide cards
        ├── feed-indicator.js                 # "N hidden" pill
        ├── floating-button.js                # food-themed dynamic island
        ├── sidebar-entry.js                  # YouTube nav entry
        ├── weekly-mirror.js                  # Diet card + Diversity Score + suggestions + Recent Watches
        ├── similar-content-banner.js         # smart trigger banner
        ├── why-this-video.js                 # pill + 3-dot menu + real-data reasons
        ├── warm-welcome.js                   # 5-slide onboarding
        └── bubblebreak-main.js               # boot + message bus (legacy file name)
```

> File names prefixed `bubblebreak` and CSS classes prefixed `.bb-` are kept for now. They're internal naming; the user-facing brand is **Feedversity** everywhere.

## Known fragile selectors

YouTube's DOM is rebuilt on client-side navigation. The MutationObserver in
each module re-injects when YouTube tears the tree down, but if Google ships
a redesign these selectors will need updating:

- `ytd-guide-renderer #sections > ytd-guide-section-renderer` (sidebar)
- `ytd-mini-guide-renderer #items` (mini sidebar)
- `ytd-watch-metadata #actions #top-row` (Why pill anchor)
- `ytd-popup-container tp-yt-paper-listbox` (3-dot menu)

## Course context

Built for the **Interaction Design (IxD) Spring 2026** capstone at HEC Lausanne, Group D.
Design rationale and course alignment live in `DESIGN_DECISIONS.md`.
