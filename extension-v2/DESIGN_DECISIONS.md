# Feedversity — Design Decisions

> *We are what we watch.*
>
> Single-source rationale for every design choice in the v2 extension.
> Each decision is grounded in the **Interaction Design (IxD) Spring 2026** course material, our own research findings (F1–F5), and our Design Goals (DG1–DG5).
>
> Course slides referenced throughout: C02 *Universal Principles of Design*, C03 *Visual & Information Design*, C06 *Design Goals & Personas*, C07 *Inclusive Design*, C09 *Motion & Sound*, C10 *Interactive Prototyping*.

---

## 0. How to read this document

Each decision follows the same template:

| Field | Meaning |
|---|---|
| **What** | The concrete design choice |
| **Why (course)** | The IxD principle that justifies it, with slide reference |
| **Why (research)** | The finding (F1–F5) or design goal (DG1–DG5) it serves |
| **Trade-off** | What we gave up by choosing this |

When a decision integrates direct prof feedback, it is flagged **🟡 Prof feedback**.

---

## 1. Research foundations recap

Findings (F1–F5) and Design Goals (DG1–DG5) come from formative interviews + course Deliverable 1/2:

- **F1** — Users do not understand *why* the algorithm recommends what it recommends.
- **F2** — Users feel passive; they consume what is suggested without questioning.
- **F3** — Users want quantitative feedback on their consumption patterns.
- **F4** — Categorical labelling carries stigma risk (a "Politics" tag in red can shame the user).
- **F5** — Classifier mistakes erode trust irreversibly when the user has no recourse.

- **DG1** — Make algorithmic influence **visible**.
- **DG2** — Encourage **diversification** of content exposure.
- **DG3** — Give the user **control** over the feed (mute, hide, reclassify).
- **DG4** — Avoid **stigmatising** the user with red flags or moral judgment.
- **DG5** — Stay **glanceable** — a user shouldn't need to study the UI to use it.

---

## 2. Foundations (Vague 1)

### 2.1 Token-based palette in `tokens.css`

| | |
|---|---|
| **What** | All colours, typography, radii and spacing live as CSS custom properties in `tokens.css`, loaded **before** `bubblebreak.css`. Components reference semantic tokens (`--bb-cta`, `--bb-bg-page`) instead of raw hex. |
| **Why (course)** | C03 slide 56 — *"design in grayscale first, keep luminescence values when moving to color"*: a token layer enforces that constraint. C02 slide 42 *Consistency* (Nielsen #4) — same hue must mean the same thing across surfaces. |
| **Why (research)** | DG5 (glanceable) requires colour-as-language; if the same orange means CTA in one place and risk in another, the user has to re-learn each surface. |
| **Trade-off** | One extra HTTP-style indirection layer; slight CSS bloat. Worth it for the consistency guarantee. |

### 2.2 Locked 15-category palette in `mock-data.js`

| | |
|---|---|
| **What** | `BB_MOCK.categoryColors` is the single source of truth. `tokens.css` mirrors it as `--bb-cat-*`. A node script verifies they stay in sync. The Diet bar, category labels, dropdown borders, channel chips, hero card accents all read from this dictionary. |
| **Why (course)** | C02 slide 23 *Similarity* — *"elements that are similar are perceived to be more related"*. If Music is `#7BB6E8` in one spot and `#2563EB` in another, the user reads them as distinct. C02 slide 42 *Consistency*. |
| **Why (research)** | DG1 (visibility) — colour is one of three redundant signals (with label + position) per C02 slide 22 *Redundancy*. |
| **Trade-off** | Updating one hue requires touching two files. We mitigate with a `node` cross-check. |

### 2.3 Risk-only red semantic

| | |
|---|---|
| **What** | Red (`--bb-risk #DC2626`) is **reserved**. It appears only when a category from `BB_MOCK.riskCategories` (Conspiracy, Misinformation, Politics, News) **increases** week-over-week. Falling Tech, growing Music, etc. → all stay neutral grey. The Reset button is also red because it is destructive. |
| **Why (course)** | C07 slide 56 *Cultural conventions* — red = error / stop / danger in Western contexts. Using it for a neutral movement (Tech −12%) imposes a value judgment. C02 slide 35 *Forgiveness* — destructive actions should look destructive. |
| **Why (research)** | **F4** — colour-as-judgment is exactly the stigmatisation pattern we promised to avoid. **DG4**. |
| **Trade-off** | Less visual contrast on the diet rows; the user gives up "pretty rainbow" for honesty about what we're flagging. |

### 2.4 Typography hierarchy (3 levels)

| | |
|---|---|
| **What** | H1 (modal titles) 18 px / 700 ; H2 (card eyebrows) 11 px / 700 / uppercase / tracked ; H3 (row titles) 14 px / 600 ; body 13 px / 400 ; small 12 px / 500. Defined as tokens, applied across the modal. |
| **Why (course)** | C03 slide 8 *"size contrasts communicate hierarchy"*; slide 9 *"scale and weight improve legibility"*; C02 slide 19 *Hierarchy* — *"the simplest structure for visualising complexity"*. |
| **Why (research)** | DG5 (glanceable) — the eye can locate the entry point of each section in <300 ms only if hierarchy is encoded in size. |
| **Trade-off** | Less individual typographic flexibility per component; gain a coherent rhythm. |

### 2.5 WCAG AA contrast pass

| | |
|---|---|
| **What** | Bumped `--bb-text-muted` from `#5b5b5b` to `#4A4A4A` (9 : 1 on peach). Mute button opacity 0.55 → 0.85. Politics, News, Vlogs, Music, Tech category hues deepened (e.g. Politics `#F4C26B` → `#D97706`, contrast 1.8 : 1 → 4.6 : 1 on white). |
| **Why (course)** | C07 slide 30 *"Make content easier to see and hear"* + the *Curb Cut Effect* (HiddenAce note) — accessibility benefits everyone. WCAG AA = 4.5 : 1 for body text. |
| **Why (research)** | The "1-in-4" universal-design constraint (C07 slide 25). |
| **Trade-off** | Some pastel charm lost; the visual is more saturated, less "soft". |

---

## 3. Mirror — Header

### 3.1 Title `Your YouTube Diet — Weekly Mirror`

| | |
|---|---|
| **What** 🟡 Prof feedback | We renamed the modal title from `BubbleBreak — Weekly Mirror` to `Your YouTube Diet — Weekly Mirror`. "Diet" sits first; "Weekly Mirror" becomes the subtitle in lighter weight. |
| **Why (course)** | C02 *Match between system and real world* (Nielsen #2) — "diet" is everyday vocabulary; "mirror" is metaphor; the combination sets expectations within 2 seconds. C02 slide 36 *Pictorial realism* — diet = food, the user already knows that food has a balance. |
| **Why (research)** | The professor explicitly highlighted that **"Diet" was the strongest piece of vocabulary** in our pitch and asked us to surface it earlier. Cohesion across the Warm Welcome slide 2 + the YOUR DIET card + this title means the metaphor is reinforced 3 times in 30 seconds. |
| **Trade-off** | The brand name "BubbleBreak" loses prominence on this surface (it lives in the dynamic island and the sidebar entry instead). |

### 3.2 Subtitle = `Based on N videos · Apr 27 – May 4`

| | |
|---|---|
| **What** | Removed the date pill from the top-right; combined into one italic subtitle that includes the watch count. |
| **Why (course)** | C02 *Visibility of system status* (Nielsen #1) — the user must know the data window AND the sample size to trust the chart. C03 slide 10 *"the text is organized from most important information to the least"* — count first because it gates trust, then date. |
| **Why (research)** | F3 (users want quantitative feedback) implies we owe them transparency on the source. |
| **Trade-off** | A bit more prose at the top of the modal; offset by removing the orphan date pill. |

### 3.3 Reset button as red ghost + count-aware confirm

| | |
|---|---|
| **What** | Reset is now a red-bordered ghost pill that fills red on hover. Hidden when there is nothing to reset. Confirmation message includes the actual count: *"Erase 24 tracked watches? This cannot be undone."* |
| **Why (course)** | C02 slide 35 *Forgiveness* — destructive actions should be reversible OR confirmed. C02 slide 33 *Confirmation* — explicit confirmation prevents unintended actions. C02 *Affordance* (slide 32) — destructive style signals consequences before the click. |
| **Why (research)** | Discovered during user-test prep — moderators kept hitting Reset by accident, wiping participant data. |
| **Trade-off** | Slightly more visual weight on a destructive action; intentional. |

### 3.4 Help button (`?`)

| | |
|---|---|
| **What** | Round outlined button next to the close (×). Re-opens the Warm Welcome onboarding on demand. |
| **Why (course)** | C02 *Help and documentation* (Nielsen #10) — help should be easy to find. C02 slide 30 *Recognition over recall* — the user shouldn't have to remember what each section means. |
| **Why (research)** | DG5 — even glanceable UI benefits from optional depth. |
| **Trade-off** | One more button in the header. Mitigated by visual weight (small, low contrast). |

---

## 4. Mirror — Diet card

### 4.1 Mute toggle pills (was speaker icons)

| | |
|---|---|
| **What** | Each diet row has a `Mute` / `✓ Muted` pill instead of the prior 🔇 / 🔈 icons. Active state = solid CTA orange + white text. Tooltip clarifies the action. |
| **Why (course)** | C02 *Affordance* slide 32 — physical/visual properties should suggest the action. A speaker icon at 55 % opacity afforded *nothing* — users in our pre-tests didn't notice it was clickable. C02 slide 65 *"Icons help only when they facilitate repeat recognition"* — the speaker metaphor was wrong (it implies sound, not category visibility). C02 slide 40 *Visibility* — state must be visible. |
| **Why (research)** | DG3 (control over feed) is the most under-used capability in v1; we made it impossible to miss. |
| **Trade-off** | More horizontal space per row; we gave up the icon's compactness for clarity. |

### 4.2 Delta colours: neutral by default, red only on F4-risk increase

| | |
|---|---|
| **What** | All deltas are neutral grey with up/down arrow. The single exception: a category from `riskCategories` increasing → red. The arrow keeps the absolute direction; colour adds the value judgment **only when warranted**. |
| **Why (course)** | C02 slide 22 *Redundancy* — direction comes from the arrow (form), severity from colour (hue) — separated channels. C07 slide 56 *Cultural conventions*. |
| **Why (research)** | F4. The prior "Tech −12 % in red" was telling the user they had failed. They had not — they had just balanced their diet. |
| **Trade-off** | Less colourful card; better-calibrated emotional load. |

### 4.3 Delta tooltip with reference

| | |
|---|---|
| **What** | Hovering a delta shows *"+5 % vs last week (24 videos tracked)"*. Risk increases append *"⚠ This category is sensitive — keep an eye on it."* |
| **Why (course)** | C02 *Visibility of system status* — a number without a denominator is unactionable. C02 slide 30 *Recognition over recall* — the user shouldn't have to remember sample size. |
| **Why (research)** | F3 — quantitative feedback. |
| **Trade-off** | Hover-only revelation; touch users see the static number. Acceptable since the extension is desktop-first. |

### 4.4 Top-3 / long-tail collapsible (B4)

| | |
|---|---|
| **What** | Top 3 categories always visible. If `diet.length > 3`, a `Show N more ↓` toggle reveals the rest, collapsed by default. |
| **Why (course)** | C02 slide 39 *Progressive disclosure* — *"only necessary or requested information is displayed at any given time"*. C02 slide 17 *Chunking*. |
| **Why (research)** | DG5 (glanceable). At 8 + categories the card scrolled, drowning the dominant ones. |
| **Trade-off** | One more interaction to reach the long tail; outweighed by the cleaner default state. |

### 4.5 Mute state propagates visually to bar segment + label (UI-2)

| | |
|---|---|
| **What** | When a category is muted, three things happen simultaneously: (a) the pill flips to `✓ Muted` solid orange, (b) the matching segment in the stacked bar drops to ~35% opacity with a diagonal stripe overlay, and (c) the row label gets a `text-decoration: line-through` and reduced weight. |
| **Why (course)** | C02 slide 22 *Redundancy* — the same state surfaces in three independent visual channels (form, position, typography). C02 slide 32 *Affordance* + slide 40 *Visibility* — the consequence of the click is impossible to miss. C09 *microinteraction* loop — trigger → rules → feedback completes within 200 ms. |
| **Why (research)** | DG3 (control) is hollow if the user doesn't see what their mute did. The previous behaviour (icon flip only) hid the consequence in a 16 px button. |
| **Trade-off** | More CSS state machine; minor JS coupling between pill, segment and label. |

### 4.6 Microinteractions: bar transition + mute pill spring (UI-4)

| | |
|---|---|
| **What** | Diet bar segments animate their `width` over 450 ms `cubic-bezier(0.65, 0, 0.35, 1)` whenever a reclassification re-balances the diet. The mute pill bounces (`scale 0.92 → 1.06 → 1.00`, 320 ms spring) on activation. |
| **Why (course)** | C09 *Motion & Sound Design* — animation completes the action loop ("did my click land?"). C02 slide 38 *Predictive aiding* — the animated transition makes the cause-effect visible without text. |
| **Why (research)** | DG5 (glanceable) — micro-confirmation at the action site means the user doesn't have to scan the rest of the modal to verify. |
| **Trade-off** | Slight lag (450 ms) before the new bar geometry is fully readable; preferable to a teleport. |

---

## 5. Mirror — Diversity Score (was "VS LAST WEEK")

### 5.1 Renamed `DIVERSITY SCORE`

| | |
|---|---|
| **What** 🟡 Prof feedback | The card title changed from `VS. LAST WEEK` to `DIVERSITY SCORE`. The headline shows an absolute count (`5 categories this week`) instead of a percentage delta. |
| **Why (course)** | C02 slide 20 *Mapping* — the prior "−9 % broader" was an oxymoron (− = less, broader = more); the user had to translate. Absolute counts map directly to mental model. C02 *Visibility of system status* — we expose the metric we actually compute. |
| **Why (research)** | Direct prof feedback: *"Indicateur de progression : Expliquer clairement la signification de la mention verte"*. |
| **Trade-off** | Loses the dramatic "−9 %" hook. Gains intelligibility. |

### 5.2 Comparison line `↑ N more than last week (was X)`

| | |
|---|---|
| **What** | Sub-line under the headline: *"↑ 1 more than last week (was 6)"* — explicit reference frame. For first-week users we compare to *"avg user"*. |
| **Why (course)** | C02 slide 22 *Redundancy* — arrow + word + number reinforce the same fact. |
| **Why (research)** | DG1 (algorithmic influence visible) — the comparison reveals trend, not just snapshot. |
| **Trade-off** | More text in the headline area. Worth it. |

### 5.3 Permanent help line under the score

| | |
|---|---|
| **What** 🟡 Prof feedback | A small italic line stays visible under the comparison: *"How many distinct content categories appeared this week. Higher = broader exposure."* |
| **Why (course)** | C02 *Recognition over recall* (slide 30) — the user shouldn't have to remember what the metric means. C02 *Help and documentation* (Nielsen #10) — help should be in context, not in a separate page. |
| **Why (research)** | Direct prof feedback (warm welcome + persistent help). |
| **Trade-off** | The card is taller; mitigated by removing the empty-space problem (5.4 below). |

### 5.4 Card height = `fit-content` (no more empty box)

| | |
|---|---|
| **What** | The `.bb-vs` card now sizes to its content. The prior implementation matched the height of the Diet card on the left, leaving 70 % empty pastel space. |
| **Why (course)** | C03 slide 14 *Visual hierarchy* — *"the most important content is given visual prominence"*. A bigger box reads as more important; an empty bigger box reads as broken. |
| **Why (research)** | DG5 (glanceable). |
| **Trade-off** | The grid is asymmetric; we use it intentionally to signal "two different kinds of info". |

### 5.5 Green only when broader than the baseline

| | |
|---|---|
| **What** | The card background is success-green only when `thisCats > previousCats`. Otherwise neutral white. No "broader = good" assumption baked in unless the data supports it. |
| **Why (course)** | C02 slide 44 *Framing* — colour-coding implies value judgment. C07 slide 56 — colour conventions are powerful, use them sparingly. |
| **Why (research)** | DG4 — same colour-judgment rationale as 4.2. |
| **Trade-off** | The card is sometimes "boring white"; honesty wins. |

---

## 6. Mirror — New Channels to Explore

### 6.1 Vertical 1-column layout (D1)

| | |
|---|---|
| **What** | Channels are now a single vertical list, no longer a 2 × 3 grid. |
| **Why (course)** | C03 slide 16 *Reading pattern* — Western readers scan top-to-bottom-then-right; the prior 2-column grid forced a Z-pattern that fragmented attention. C03 slide 51 *Top-alignment for vertical layout*. |
| **Why (research)** | DG2 (diversification) requires the user to *consider* each suggestion; zig-zag scanning encourages skipping. |
| **Trade-off** | Card is taller; we cap at 4–6 channels. |

### 6.2 Per-channel reason line (D2)

| | |
|---|---|
| **What** | Below each channel name: an italic line explaining *why* this channel was suggested. Five reason patterns: discovered-by-user, missing-category, low-share, high-share, generic. |
| **Why (course)** | C02 slide 38 *Predictive aiding* — proactive explanation reduces cognitive load. C02 *Help and documentation* (Nielsen #10). |
| **Why (research)** | **F1** — *"users don't understand why the algorithm recommends what it recommends"*. This is the most direct UI answer to that finding. |
| **Trade-off** | More text per row; mitigated by italic + muted colour. |

### 6.3 Featured Pick (hero card, D3)

| | |
|---|---|
| **What** | The first suggestion gets a dedicated card with larger avatar, accent border (tinted by category colour), uppercase "FEATURED PICK" eyebrow, big bold name, category chip, italic reason, and a prominent CTA. |
| **Why (course)** | C03 slide 14 *Visual hierarchy* — *"the most important content is given visual prominence"*. C02 slide 19 *Hierarchy*. C02 *Pace* (C03 slide 11) — *"draw people in, help orient"*. |
| **Why (research)** | DG2 (diversification) — without a hero, the eye treats 6 suggestions as equivalent and acts on none. |
| **Trade-off** | The other suggestions look secondary by comparison. Intentional. |

### 6.4 Curated suggestions take priority over watch-history (cross-page consistency fix)

| | |
|---|---|
| **What** | The "NEW CHANNELS TO EXPLORE" section now **always** runs `pickCuratedChannels(diet, watchedSet)` first, even when the user has watch history. Channels the user already watches are excluded by the `watchedSet` filter. The previous "discovered this week" framing only kicks in as a fallback when curated returns empty (rare). |
| **Why (course)** | C02 slide 42 *Consistency* (Nielsen #4) — the section title says "to **explore**", so listing channels the user already watches breaks the contract. C02 *Match between system and real world* (Nielsen #2). |
| **Why (research)** | Bug discovered in user testing: the section content varied confusingly between YouTube pages (home → curated suggestions, channel page → user's own watches). DG2 requires consistent diversification prompts regardless of context. |
| **Trade-off** | The "discovered this week" reason is now rarely surfaced; that information lives in Recent Watches anyway. |

### 6.5 Resilient channel URL resolution

| | |
|---|---|
| **What** | `resolveChannelUrl(ch)` always returns a usable URL via a 3-step fallback: handle → captured channelUrl → YouTube search query for the channel name. The `Open channel` button is never dead. |
| **Why (course)** | C02 slide 35 *Forgiveness* — broken affordances erode trust. A button that does nothing is worse than no button. |
| **Why (research)** | DG2 (diversification) — every dead "Open channel" button = one fewer chance for the user to actually try a new content source. |
| **Trade-off** | Search-fallback URLs occasionally land on a search results page instead of the channel; still better than nothing. |

---

## 7. Mirror — Recent Watches

### 7.1 Per-row category dropdown

| | |
|---|---|
| **What** | Each watch row has an inline category select tinted by the category colour. The user can override the auto-classification at any time. Conspiracy / Misinformation are intentionally hidden from the dropdown (auto-detected only). |
| **Why (course)** | C02 slide 35 *Forgiveness* — *"designs should help people minimise the negative consequences of errors"*. C02 *User control and freedom* (Nielsen #3). |
| **Why (research)** | **F5** — classifier mistakes erode trust. The override is the trust-recovery mechanism. **DG3**. |
| **Trade-off** | The dropdown is busier visually than a static chip; the trust gain is worth the noise. |

### 7.2 Title becomes an `<a>` (E2)

| | |
|---|---|
| **What** | Clicking the title opens the YouTube watch page in a new tab. Hover shows underline + CTA-coloured text. |
| **Why (course)** | C02 *Affordance* (slide 32) — links should look like links. C07 slide 29 *Screen readers translate a page in a linear sequence* — `<a>` is semantic; a clickable `<div>` is not. |
| **Why (research)** | DG5 (glanceable) — direct re-watch / verification path. |
| **Trade-off** | None significant. |

### 7.3 Relative timestamp (E3)

| | |
|---|---|
| **What** | Channel name + relative time on the same line: *"WolfeyVGC · 2h ago"*. Plain English: just now / 2m / 2h / yesterday / 3d / 2w / date. |
| **Why (course)** | C02 *Visibility of system status*. C02 slide 21 *Proximity* — channel and time read as one unit because they sit on the same line. C07 — natural language is screen-reader-friendly. |
| **Why (research)** | DG5. |
| **Trade-off** | Times become approximate; absolute date appears in the dropdown tooltip if needed. |

### 7.4 Group dedup at N≥3 (E4)

| | |
|---|---|
| **What** | Watches sharing the same `(channel, category)` are collapsed into a summary row when there are 3 or more. The summary shows count + most-recent timestamp + a read-only category chip. *Show all N ↓* expand reveals individual rows with their own reclassification dropdowns. |
| **Why (course)** | C02 slide 17 *Chunking* — *"combining many units into a limited number of units"*. C02 slide 39 *Progressive disclosure*. |
| **Why (research)** | DG5 (glanceable). A user who watched 6 WolfeyVGC videos in a row was previously confronted with 6 nearly-identical rows, drowning the rest of the history. |
| **Trade-off** | One extra interaction to reclassify a single video inside a group; outweighed by readability gains. |

### 7.5 Reclassify glow microinteraction (UI-4)

| | |
|---|---|
| **What** | When the user picks a new category from the dropdown, the entire row pulses with the new category's colour at ~20% alpha for 900 ms (`bb-row-glow` keyframe). The colour is injected as a CSS custom property `--bb-glow-color` so the animation always matches the chosen category. |
| **Why (course)** | C09 *Motion & Sound Design* — feedback closes the action loop. Without this, the user wonders "did my reclassification register?". C02 slide 35 *Forgiveness* — visible confirmation reduces fear of mis-clicking. |
| **Why (research)** | F5 (classifier-mistakes erode trust) is mitigated by making the recovery visible AND immediately rewarding. |
| **Trade-off** | Mild colour flash; could be distracting for users with motion sensitivity. Mitigation: 900 ms is below the 1.5 s flash threshold for vestibular triggers. |

---

## 8. Warm Welcome (Vague 4)

### 8.1 5-slide carousel triggered on first install

| | |
|---|---|
| **What** 🟡 Prof feedback | A modal carousel with 5 slides: Hook → Diet metaphor → Diversity Score → Control → CTA. Auto-opens on first YouTube visit after install (via `chrome.runtime.onInstalled`). Re-openable via the `?` button in the Mirror. Persists `bb_warm_welcome_seen` so it never auto-opens twice. |
| **Why (course)** | C02 slide 41 *Learning* — *"design should help the user learn unfamiliar conceptual models"*. C02 slide 39 *Progressive disclosure* — introduce capability one screen at a time, not all at once. C03 slide 80 protocol pattern *intro → warm-up → tasks → wrap-up*. |
| **Why (research)** | Direct prof feedback: *"Création d'un Warm Welcome — l'application est actuellement difficile à comprendre au premier coup d'œil"*. Solves the "what does this thing do?" problem in 90 seconds. |
| **Trade-off** | Adds a friction step on first install; mitigated by the Skip button (always visible). |

### 8.2 CSS-only mockups (no PNG screenshots)

| | |
|---|---|
| **What** | Each slide's visual is built from real DOM elements styled to look like a mini-version of the real component (mini Diet bar, mini Diversity card, mini mute pills, mini dynamic island). |
| **Why (course)** | C02 *Consistency* — if we re-skin the real components later, the onboarding stays in sync automatically. Avoids the "stale screenshot" problem. C03 slide 56 — colour discipline is already enforced via tokens; the mini-mockups inherit. |
| **Why (research)** | Direct user request — interactive over screenshots. |
| **Trade-off** | More CSS than a static image; ~150 extra lines, well-encapsulated. |

### 8.3 Slide 2 "Diet" + slide 3 "Diversity Score" are the conceptual core

| | |
|---|---|
| **What** | Two of the five slides are dedicated to the two key vocabularies (Diet, Diversity). Slides 1, 4, 5 frame them. |
| **Why (course)** | C02 slide 36 *Pictorial realism* — show the metaphor (food = media) before naming it. C02 slide 30 *Recognition over recall* — the user will see this vocabulary again in the Mirror; they recognise it instead of recalling it cold. |
| **Why (research)** | The professor specifically asked us to surface "Diet" early. Slide 2 introduces it; the modal title and the YOUR DIET card reinforce it. |
| **Trade-off** | The first impression is heavy on metaphor; we accept it because the metaphor is the product. |

### 8.4 Skip / Back / Next + progress dots

| | |
|---|---|
| **What** | Linear navigation with explicit Back, Next, Skip. Progress dots at the bottom (active dot stretches into a pill). Keyboard shortcuts ←, →, Esc. Click outside = close. |
| **Why (course)** | C02 *User control and freedom* (Nielsen #3). C02 slide 40 *Visibility* — the dots show progress through a finite sequence. C07 slide 31 — keyboard accessibility. |
| **Why (research)** | DG3 (control). |
| **Trade-off** | None. |

---

## 9. Mirror — Empty State (Vague 5)

### 9.1 Threshold = 5 watches (aligned with Warm Welcome promise)

| | |
|---|---|
| **What** | The Mirror shows a dedicated empty state whenever `watchCount < 5`. The threshold matches the Warm Welcome slide 5 promise: *"After 5 videos, your real Mirror unlocks."* `MIN_SAMPLES` in `stats.js` was raised from 3 → 5 for the same reason. |
| **Why (course)** | C02 slide 42 *Consistency* (Nielsen #4) — promise made in onboarding must hold in the surface. Mismatched thresholds are the textbook cause of "broken trust" reports. |
| **Why (research)** | F5 — promises that don't hold = trust erosion. |
| **Trade-off** | Users see "Mirror not ready" longer than before; honesty wins over fake-data optimism. |

### 9.2 Always-returning `getStats()` (no more null at low counts)

| | |
|---|---|
| **What** | `BBStats.getStats()` now returns `{ ready: false, watchCount: N, minSamples: 5, dateRange: ... }` when below threshold, instead of `null`. Consumers can show progress without hitting "no data" branches. |
| **Why (course)** | C02 *Visibility of system status* (Nielsen #1) — the consumer (UI) needs to know **why** there's no data, not just that there isn't. |
| **Why (research)** | F3 (quantitative feedback) starts on day 1 ("0 / 5 — let's go"). |
| **Trade-off** | Slightly larger payload at low counts; negligible. |

### 9.3 Adaptive headline + emoji per progress (0 / 1-3 / 4 / 5+)

| | |
|---|---|
| **What** | The empty-state headline and emoji evolve with `watchCount`: 0 → *"Your Diet is empty"* 🍽️, 1-3 → *"N more videos to unlock"* 🍳, 4 → *"One more video to go!"* 🍳, 5+ → real Mirror unlocks (no empty state). The CTA toggles between *"Browse YouTube ↗"* (fresh) and *"Keep watching ↗"* (in-progress). |
| **Why (course)** | C02 slide 38 *Predictive aiding* — the next action is named at every step. C02 slide 44 *Framing* — the headline frames remaining work positively (one more!) rather than as a deficit. |
| **Why (research)** | DG5 (glanceable) — the user knows what to do without reading the body. |
| **Trade-off** | More copy variants to maintain; worth it for the felt-progress effect. |

### 9.4 5-cell progress bar with cell-pop animation

| | |
|---|---|
| **What** | A horizontal bar of 5 cells (`flex: 1`) sits below the body. Filled cells (`bb-filled`) are CTA-orange; empty cells are muted. Each newly-filled cell triggers a `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoot pop (350 ms). |
| **Why (course)** | C02 slide 36 *Pictorial realism* — the bar **is** the progress; no caption needed to interpret. C02 slide 19 *Hierarchy* — the bar visualises a finite goal. C09 — the cell-pop animation rewards each step. |
| **Why (research)** | F3 — quantitative feedback even before unlock. DG5. |
| **Trade-off** | Adds vertical space to the empty card; offset by the motivation gain. |

### 9.5 Recent Watches surfaced even during the empty state

| | |
|---|---|
| **What** | Even at 1-4 watches, the Recent Watches section renders below the empty state placeholder. The user can already test the reclassification dropdown on day 1. |
| **Why (course)** | C02 slide 41 *Learning* — the user discovers the override mechanism while it has low stakes. C02 slide 38 *Predictive aiding* — the user prepares for the post-unlock workflow. |
| **Why (research)** | DG3 (control) starts on day 1, not day 5. F5 trust-recovery mechanism is testable immediately. |
| **Trade-off** | Slightly busier empty state; the additional content reads as "what you can already do" not as data. |

---

## 10. Smart triggers — beyond static rules (Vague 5)

### 10.1 "Similar content" banner uses real diet stats (UI-6)

| | |
|---|---|
| **What** | The banner's prior trigger (3 navigations) is replaced with a stats-based rule: ≥10 watches in the week AND (top category > 65 % of diet OR distinct categories ≤ 2). Dismissal sets a 24-hour snooze. Re-evaluation throttled to once per 30 s + on `bb-watch-recorded`. The body text names the actual dominant category (e.g. *"You've watched a lot of Tech this week (78 % of your diet)"*). |
| **Why (course)** | C02 slide 33 *Confirmation* — interruptions must be earned. C02 slide 8 *Attention* — *"avoid clutter and make information relevant to the task salient"*. C02 *Match between system and real world* (Nielsen #2) — the banner must reflect what's actually happening. |
| **Why (research)** | F1 — the user understands **why** the prompt appears (concrete number), not just that something happened. DG2 — the prompt is now an actionable nudge, not noise. |
| **Trade-off** | Many users won't see the banner at all (good). The rule may need calibration after user testing — current thresholds (10 watches, 65 %) are first-order hypotheses. |

### 10.2 "Why this Video?" hierarchical reasons from real watch history (UI-7)

| | |
|---|---|
| **What** | The tooltip's reason is generated from `BBStats.load()` at click-time. Hierarchy: (1) same-channel signal if user watched ≥2 videos from this creator this week; (2) same-category in diet, with rank (#1 / #2 / #3+) and concrete count + share; (3) category outside diet → "algorithm exploration" framing; (4) <3 watches → honest "not enough data" message. The tooltip also surfaces a colored category chip matching the locked palette. |
| **Why (course)** | C02 slide 38 *Predictive aiding* — naming the cause in concrete terms ("4 videos from WolfeyVGC") removes guesswork. C02 *Help and documentation* (Nielsen #10) — explanations should be specific, not generic. C02 slide 30 *Recognition over recall* — the chip uses the same colour the user sees in the Mirror. |
| **Why (research)** | **F1** — strongest possible answer to "why was this recommended?". The reason is grounded in the user's own data, not a mock template. |
| **Trade-off** | Async load + stat scan adds ~50 ms latency; hidden behind a *"Analysing your week…"* loading state. |

### 10.3 Dynamic "DIVERSITY SCORE" baseline (last week vs avg user)

| | |
|---|---|
| **What** | The card's comparison reference auto-switches: *"vs last week"* when last-week data exists, otherwise *"vs avg user"* using the `BB_MOCK.avgUserDiet` baseline. This is set once in `stats.js`, surfaced as `data.diversity.comparison`. |
| **Why (course)** | C02 *Visibility of system status* — never compare against an undefined reference. C02 slide 40 *Visibility* — the reference label is always shown. |
| **Why (research)** | F3 (quantitative feedback) — even week 1 users get a meaningful number. |
| **Trade-off** | Avg-user baseline is mocked, not empirically measured; flagged as a hypothesis in §15. |

---

## 11. Cross-cutting decisions

### 11.1 Diet metaphor as the product's spine

The word **"diet"** appears in:
1. Modal title (`Your YouTube Diet`)
2. YOUR DIET card eyebrow
3. Warm Welcome slide 2 ("Your media is like food")
4. Reclassification microcopy (*"your diet updates instantly"*)
5. Subtitle (*"Based on N videos watched"*)

**Why (course)** C02 slide 42 *Consistency* — repeated vocabulary builds a mental model. C02 slide 36 *Pictorial realism* — food has balance; media has balance.

**Why (research)** Prof feedback that "Diet" was the strongest vocabulary in our pitch.

### 11.2 Risk-only red across the entire UI

No surface uses red except:
- F4-risk category increases (Diet card delta)
- The Reset destructive button

**Why (course)** C07 slide 56 *Cultural conventions*; C02 *Forgiveness* (slide 35).

**Why (research)** F4 / DG4.

### 11.3 Help-on-demand pattern, not help-by-default

We do **not** add inline tooltips to every element. Instead:
- The Warm Welcome covers the conceptual onboarding once.
- The `?` button re-opens it whenever the user wants.
- A permanent help line lives only on the Diversity Score (the most ambiguous metric).
- Tooltips appear on **delta** values (the most calibration-dependent number).

**Why (course)** C02 slide 8 *Attention* — *"avoid clutter and make information relevant to the task salient"*. Help everywhere = help nowhere.

**Why (research)** DG5 (glanceable).

### 11.4 Single-source palette + cross-check script

Both `tokens.css` (`--bb-cat-*`) and `mock-data.js` (`BB_MOCK.categoryColors`) declare the 15 hues. A `node` script in `Bash` cross-checks both files agree.

**Why (course)** C02 *Consistency*; the C03 grayscale-first principle (slide 56) requires a single colour authority.

**Trade-off** Two files to update; mitigated by the script.

### 11.5 Dark-mode parity

Every Mirror surface (header, cards, mute pills, hero card, watch group, Warm Welcome, Empty State) has dark-mode overrides via `[dark]` and `html[dark]` selectors (YouTube's own dark-mode flags).

**Why (course)** C07 — accessibility-as-default; users in dark environments need parity.

### 11.6 v1-surface refresh aligned with tokens (UI-1)

Four pre-existing UI surfaces (Similar-content banner, Why-this-Video pill, tooltip, hidden-card overlay) were retrofitted with the new tokens, typography hierarchy, and dark-mode overrides so the v2 visual rhythm carries across every surface — not only the Mirror.

**Why (course)** C02 slide 42 *Consistency* (Nielsen #4) — same brand language across surfaces. C03 slide 9 *Scale and weight improve legibility*.

**Trade-off** Three v1 components touched without functional change; risk of regression mitigated by manual visual diff.

### 11.7 English-only UI strings

All user-facing strings in the extension are English. Two exceptions are intentional and stay in French: (a) `watch-tracker.js` filters on YouTube's actual French boilerplate strings ("Profitez des vidéos…"), (b) `why-this-video.js` regex matches both English and French YouTube menu items so the dropdown injection works for francophone users. The classifier `BB_MOCK.categoryKeywords` keeps multilingual keywords (necessary to classify French videos correctly).

**Why (course)** C07 slide 9 *Internationalization* — separate localization-time strings (UI labels) from runtime detection strings (DOM scrapers). The current scope is single-locale UI (EN) with multilingual content detection.

**Trade-off** Real bilingual UI deferred to post-MVP. Acceptable because demo + tests are in English.

---

## 12. Mapping decisions to Design Goals

| DG | Decisions covering it |
|---|---|
| **DG1 — Visibility of algorithm** | 4.3 delta tooltip · 5.x Diversity Score · 6.2 per-channel reason · 8.x Warm Welcome · 10.2 Why-this-Video real reasons · 10.3 dynamic baseline |
| **DG2 — Encourage diversification** | 5.x Diversity Score · 6.1 vertical layout · 6.3 hero card · 6.4 curated priority · 6.5 resilient channel URL · 10.1 smart banner |
| **DG3 — User control** | 4.1 mute pills · 4.5 mute state propagation · 7.1 reclassification dropdown · 8.4 Skip/Back/Next · 3.3 Reset · 9.5 Recent Watches in empty state |
| **DG4 — Avoid stigmatisation** | 2.3 risk-only red · 4.2 neutral deltas · 5.5 conditional green · 11.2 cross-cutting · 10.1 dominant-category framing (no shame) |
| **DG5 — Glanceable** | 2.4 typography hierarchy · 4.4 long-tail collapse · 4.6 microinteractions · 5.4 fit-content card · 7.4 group dedup · 7.5 reclassify glow · 9.3 adaptive empty headline · 11.3 help-on-demand |

---

## 13. Mapping decisions to research findings

| Finding | Decisions addressing it |
|---|---|
| **F1 — Why was this recommended?** | 6.2 per-channel reason · 8.1 Warm Welcome slide 1 · 10.1 dominant-category banner text · **10.2 Why-this-Video real-data hierarchy** |
| **F2 — Passive consumption** | 6.3 hero card (active suggestion) · 5.x Diversity (self-comparison) · 10.1 actionable banner |
| **F3 — Want quantitative feedback** | 3.2 watch-count subtitle · 4.3 delta tooltip · 5.2 comparison line · 9.2 always-on counts · 9.4 progress bar |
| **F4 — Stigma risk of red labels** | 2.3 risk-only red · 4.2 neutral deltas · 5.5 conditional green · 11.2 cross-cutting |
| **F5 — Classifier mistakes erode trust** | 7.1 reclassification dropdown · 7.4 group dedup keeps individual edits · 7.5 reclassify glow (recovery feedback) · 9.1 5-watches threshold (no fake data) |

---

## 14. What we explicitly chose **not** to do

| Decision | Reason |
|---|---|
| Do *not* show ML-confidence percentages on each video | Implies a precision we don't have (rule-based + YouTube genre, not ML). Would erode trust per F5. |
| Do *not* gamify with badges or streaks | Would re-introduce the very dopamine pattern we're critiquing. |
| Do *not* add a "share your week" social feature | Privacy risk + scope creep. Out of MVP. |
| Do *not* auto-mute risk categories | Removes user agency. DG3. |
| Do *not* bake in absolute "good diet" thresholds | Imposes a stranger's ideal on the user. C03 slide 11 *Pace* — we suggest, we don't prescribe. |

---

## 15. Open questions for user testing

These are questions that the design *attempts* to answer but that only user tests can validate (per C10 *Standardised questionnaires* protocol):

1. Does the user grasp the Diet metaphor on first view (Warm Welcome slide 2)? Measure: ASQ on slide 2.
2. Does the Diversity Score read as comprehensible without the help line? A/B with help-line hidden.
3. Does the risk-only red avoid feeling judgmental? Post-test interview.
4. Do users notice the mute pills (DG3 lever) without prompting? First-click test.
5. Does the hero card actually drive clicks vs. equally-weighted suggestions? Click-through tracking.
6. **Are the smart-banner thresholds (≥10 watches, >65 % top share or ≤2 categories) calibrated correctly?** Track banner-trigger rate per cohort and Yes / No / Snooze response.
7. **Does the "Why this Video?" reason hierarchy actually answer the user's mental model of "why"?** Compare same-channel vs same-category vs new-category framings via post-test prompt.
8. **Does the 5-cell progress bar in the Empty State actually motivate the user to reach 5 watches?** Track time-to-unlock per install cohort.
9. **Does the reclassify glow (7.5) reduce post-action anxiety?** Measure subsequent dropdown re-opens (proxy for "did I do it right?").
10. **Is the avg-user baseline (5.x, 10.3) credible to users?** Direct ask in debrief: "Where do you think this number comes from?"

To be quantified via SUS (delta A/B per C10 slide 91, benchmark 68 = grade C).

---

## 16. The rebrand: BubbleBreak → Feedversity

| | |
|---|---|
| **What** | The product was renamed from *BubbleBreak* to **Feedversity** late in design. *BubbleBreak* mixed two metaphors (filter-bubble + something-to-break); *Feedversity* (Feed + Diversity) keeps a single metaphor and signals the *outcome* (more diverse feed) rather than the *problem* (bubble). The brand tagline is *"We are what we watch."* |
| **Why (course)** | C02 *Match between system and real world* (Nielsen #2) — the name should describe what the user gets, not a fight against an abstraction. C02 slide 42 *Consistency* — every surface (Mirror title "Your YouTube Diet", food emojis on the dynamic island, Diet card eyebrow, Warm Welcome metaphor) speaks **food/diet** language. The old "BubbleBreak" name was the only piece of the experience still speaking *bubble*. |
| **Why (research)** | Direct user-test feedback on the prior naming: testers were unsure whether the extension was about *eliminating* content (negative framing) or *broadening* it (positive). "Feedversity" reads as additive — university-of-the-feed, more diversity. Aligned with **DG2** (encourage diversification) rather than DG3 (control). |
| **Trade-off** | All file names, CSS classes (`.bb-*`), and JS globals (`BB_MOCK`, `BBStats`, `BBWeeklyMirror`, etc.) keep the legacy `bb-` / `BB` prefix. Renaming them would require touching ~600 references with no user-visible benefit. The user-facing brand and the internal namespace diverge intentionally — documented here so future contributors know it's a deliberate split, not technical debt. |

---

## 17. References

### Course materials
- C02 — *Universal Principles of Design* (cognition, attention, perception, memory, learning; Nielsen heuristics)
- C03 — *Visual & Information Design* (hierarchy, typography, alignment, colour, reading patterns)
- C06 — *Design Goals & Personas* (DG formulation, requirements analysis)
- C07 — *Inclusive Design* (accessibility, i18n, microinteractions, qualitative coding)
- C09 — *Motion & Sound Design* (microinteraction model)
- C10 — *Interactive Prototyping* (SUS, standardised questionnaires, baseline comparison)

### Books referenced in course
- Don Norman — *The Design of Everyday Things*
- Lidwell — *Universal Principles of Design*
- Don Norman — *Affordances and Design*

### Research deliverables
- BubbleBreak D1 — research findings F1–F5
- BubbleBreak D2 — design goals DG1–DG5
- Prof feedback notes — collected verbatim, integrated above where flagged 🟡
