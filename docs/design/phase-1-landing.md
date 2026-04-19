# Phase 1 — Landing Page Design

> **Status:** Locked (design phase complete, ready for implementation handoff)
> **Mode:** Brainstorming skill output
> **Project:** HearMeAI — AI Communication Platform for Deaf & Mute Individuals
> **Scope:** Frontend landing page (`/`)

---

## 1. Understanding Summary

- **What:** Redesign the HearMeAI landing page as a showcase surface for academic and demo-day evaluation.
- **Why:** This is a graduation/student project being presented to a mixed evaluation audience. The page must convince three groups in a single scroll: judges, professors, and walk-up visitors.
- **For whom (visitors):** Demo-day public (curious, fast), judges (impact-focused), professors (rigor-focused).
- **For whom (clones):** Other students will clone the frontend repository — the landing page must demo safely without backend running.
- **Key constraints:**
  - Mic permissions and network may be unreliable on demo day.
  - Page must load fast and be visually striking on a projector / large monitor.
  - Must respect existing brand (dark theme, slate/indigo/violet, glassmorphism).
  - Must remain accessible end-to-end (the product is about accessibility).
- **Non-goals (explicit):**
  - Not a marketing/sales conversion page.
  - No pricing, no testimonials block.
  - No team-recruiting CTA.
  - Not SEO-optimized (it's a project, not a public service).

---

## 2. Audience & Primary Outcomes

| Audience | Primary need | What the page must do for them |
|---|---|---|
| Demo-day visitor | "What is this and is it cool?" | Visual wow + one-click demo video |
| Judges | "Does it work and does it matter?" | Working product proof + impact narrative |
| Professors | "Is the engineering and methodology rigorous?" | Cited stats, accessibility depth, academic credit |

**Primary CTA:** Watch demo video.
**Secondary CTA:** Try Live Demo.
**Tertiary CTA:** About the project (academic + research).

---

## 3. Section Structure (Story-First Order)

1. Hero + Video
2. Problem
3. Animated Live Preview
4. Core Features (Bento)
5. Accessibility Commitments
6. Impact / Mission
7. Academic / Research Credit

---

## 4. Section Designs

### Section 1 — Hero + Video

**Layout**
- Full-viewport hero (100vh desktop, auto on mobile)
- Two-column on desktop: left = copy + CTAs, right = video frame
- Single column on mobile: copy top, video below
- Sticky compact nav appears after first scroll

**Content**
- Eyebrow: `AI-POWERED · INCLUSIVE COMMUNICATION`
- H1: *"Communication without barriers."*
- Subheadline: *"HearMeAI turns speech into captions, text into voice, and ideas into signs — in real time, in two languages, for everyone."*
- Primary CTA: `▶ Watch Demo` (opens embedded video, muted by default)
- Secondary CTA: `Try Live Demo` (opens `/app`, no login required)
- Tertiary scroll hint: `↓ See why we built this`

**Video presentation**
- 16:9 frame with soft slate-indigo glow border
- Poster image: a styled chat-room frame
- Animated pulse on the play button
- Caption strip: *"60-second demo · muted by default · captions on"*
- Click-to-play, never autoplay

**Visual treatment**
- Subtle animated gradient mesh background (slate → indigo → violet)
- Faint floating glyphs (mic / caption / sign hand) at low opacity
- Brand wordmark + nav top-left, language toggle top-right

**Behavior + fallbacks**
- `prefers-reduced-motion` → gradient and glyphs freeze; CTAs unchanged
- Video fails to load → frame swaps to existing animated chat preview
- Mobile → CTAs stack full-width, video frame shrinks to 16:9 card

---

### Section 2 — Problem

**Layout**
- Full-width band, slightly lighter slate than Hero
- Centered single-column content, max width ~880px
- Three stat tiles below the headline (3-up desktop, stacked mobile)

**Content**
- Eyebrow: `THE PROBLEM`
- Headline: *"Every conversation has a barrier. Most people just don't see it."*
- Body (~40 words): *"Hundreds of millions of people are deaf, hard-of-hearing, or non-speaking. Today's tools force them to pick between speed, accuracy, or accessibility — almost never all three. HearMeAI exists to remove that trade-off."*

**Stat tiles**

| Stat | Subtitle | Source |
|---|---|---|
| 430M+ | people live with disabling hearing loss worldwide | WHO |
| ~2.5B | projected to have some degree of hearing loss by 2050 | WHO |
| 70+ | active sign languages globally | WFD |

**Visual treatment**
- Slow fade-up entrance on scroll
- Animated number counters (0 → final value)
- Quiet visual: audio waveform morphs into caption text on scroll
- Dim accent line under the headline

**Behavior + fallbacks**
- `prefers-reduced-motion` → no counters, no morph; numbers static
- All sources cited via small footnote-style links
- Copy externalized to i18n for Arabic toggle

---

### Section 3 — Animated Live Preview

**Layout**
- Full-width band, slightly darker tone for visual rhythm
- Section heading + one-line description above
- Centered chat-workspace mockup, max width ~1100px
- Wrapped in a subtle macOS-style window frame

**12-second scripted loop**

| Beat | Time | Animation |
|---|---|---|
| 1 | 0–4s | Speech → Caption (waveform + streaming text) |
| 2 | 4–8s | Text → Voice (typing + pulsing speaker icon) |
| 3 | 8–12s | AI Assist (Simplify hover → text morph) |
| 4 | 12s | Smooth fade, loop restarts |

**Visual treatment**
- Glass chat frame with soft slate-indigo border glow
- Captions match real `/app` typeface and styling
- Small AI avatar gradient orb for assistant bubble
- Faint floating signing-hand glyphs

**Behavior + fallbacks**
- IntersectionObserver: animate only in view
- `prefers-reduced-motion` → static composite frame showing all 3 features at rest
- Tab hidden / blur → pause loop
- Mobile → scale frame, increase caption font

**Micro-CTA at section end**
- Small text: *"This is a recording. → Try it for real"* (links to `/app`)

---

### Section 4 — Core Features (Bento)

**Layout**
- Asymmetric bento grid: 2 hero tiles + 4 standard tiles
- Mobile: stacks to single column

**Tiles**

| # | Title | Description | Visual |
|---|---|---|---|
| 1 | Real-time Captions | Whisper-powered STT with confidence cues | Animated waveform → text |
| 2 | Natural Voice | Edge TTS in EN & AR, multiple voices | Pulsing speaker glyph |
| 3 | AI Message Assist | Simplify, clarify, translate inline | Before/after text morph |
| 4 | 3D Hologram Signer | Visual sign sequences for known phrases | Rotating gradient hand |
| 5 | Bilingual + RTL | English & Arabic with proper RTL | "EN ⇄ AR" toggle |
| 6 | Live Rooms | Create, join by code, or matchmaking | Invite code chip |

**Visual treatment**
- Glass surface tiles with subtle slate-indigo border
- Featured (large) tiles: brighter accent gradient
- Color-coded accent dots: audio = indigo, AI = violet, visual = teal, language = amber

**Behavior + fallbacks**
- Hover: tile lifts 4px, border glows
- `prefers-reduced-motion` → no lift, only color shift
- Keyboard navigation: each tile is a focusable button with visible focus ring
- Optional modal-on-click deferred to v2

---

### Section 5 — Accessibility Commitments

**Layout**
- Split: mission left / commitments right
- Mobile: stacks
- Subtle teal accent background tint

**Content**
- Eyebrow: `ACCESSIBILITY · OUR FOUNDATION`
- Headline: *"Inclusion isn't a feature. It's the foundation."*
- Body: *"HearMeAI is built for the people most software forgets. Every screen, every interaction, and every fallback in this product is shaped by accessibility-first principles — not added at the end."*

**Commitments checklist (8)**

| ✓ | Commitment |
|---|---|
| ✓ | WCAG 2.1 AA contrast targeted across all surfaces |
| ✓ | High-contrast mode toggle (live, no reload) |
| ✓ | Font scaling: Normal · Large · X-Large |
| ✓ | Full keyboard navigation with visible focus rings |
| ✓ | ARIA live regions for transcripts and status |
| ✓ | RTL layout for Arabic, end-to-end |
| ✓ | No critical information conveyed by audio alone |
| ✓ | `prefers-reduced-motion` respected everywhere |

**Meta-feature**
- Button: `Try high-contrast mode now` — toggles the entire landing page into high-contrast in real time.

**Visual treatment**
- Calm, quieter than the bento section
- Check icons draw-in on scroll
- Subtle accent line connecting checklist items
- Extra-visible keyboard focus ring on this section

**Behavior + fallbacks**
- Every checklist item is keyboard focusable
- `prefers-reduced-motion` → no draw animation
- High-contrast preference persists in `localStorage`
- Section heading is `<h2>` with proper semantic structure

---

### Section 6 — Impact / Mission

**Layout**
- Top: centered manifesto block
- Below: 3 persona cards (stacks on mobile)
- Quieter, almost editorial tone

**Content**
- Eyebrow: `OUR MISSION`
- Headline: *"A platform built so no one is left out of the conversation."*
- Body: *"HearMeAI started as a student project but lives in service of a larger goal: an internet where deaf and mute users aren't accommodated by extensions or workarounds — they're supported by software designed with them in mind from the first line of code."*

**Personas (3)**

| Persona | Scenario |
|---|---|
| Deaf student | Joins a lecture remotely. Captions stream the moment the professor speaks. |
| Mute professional | Speaks in a meeting through natural TTS — without typing in front of the room. |
| Mixed conversation | Two users with different needs join one room; both understand each other in real time. |

**Visual treatment**
- Editorial spacing — generous whitespace
- Headline in a slightly larger refined weight
- Persona cards: glass tiles with soft slate-violet glow
- One thin horizontal accent line under the headline

**Behavior + fallbacks**
- Cards fade in sequentially (0.1s offset)
- `prefers-reduced-motion` → instant appearance
- SVG illustrations only (no real photos)
- Each persona card is keyboard focusable

---

### Section 7 — Academic / Research Credit

**Layout**
- Two-column credit block + resource bar
- Left = institution & program; right = team
- Resource bar below
- Mobile: stacks

**Institution & Project (left)**

| Field | Value |
|---|---|
| University | *[University Name]* |
| Faculty / Department | *[Department]* |
| Program / Course | *[Program / Course]* |
| Supervisor | *[Supervisor Name, Title]* |
| Academic Year | *[YYYY–YYYY]* |
| Project Type | Graduation / Capstone / Research |

**Team (right)**

| Role | Person |
|---|---|
| Project lead | *[Your Name]* |
| Frontend | *[Name(s)]* |
| Backend | *[Name(s)]* |
| AI / Models | *[Name(s)]* |
| Accessibility advisor | *[Name, optional]* |

**Resource bar**
- `↗ Frontend on GitHub`
- `↗ Design Documentation`
- `↗ Contact`
- (Optional) `↗ Project Report (PDF)`

**Visual treatment**
- Quiet, formal — slightly muted background
- Headline in refined display weight; body in clean sans
- Subtle horizontal divider above the resource bar
- University seal/logo placeholder top-right (optional, with permission)

**Behavior + fallbacks**
- External links open in a new tab with `rel="noopener"`
- `prefers-reduced-motion` → no entrance fade
- Empty rows hidden gracefully (e.g., missing role)

---

## 5. Decision Log

| # | Decision | Rationale |
|---|---|---|
| D1 | Goal = showcase | Evaluation, not conversion |
| D2 | Audience = mixed (judges + professors + visitors) | Triple-layered design needed |
| D3 | CTA priority: Watch Video > Try Demo | Demo-day reliability first |
| D4 | 7 sections selected (out of 11 options) | Avoid scroll fatigue |
| D5 | Story-First ordering | Best fit for mixed audience |
| D6 | Hero = two-column, click-to-play video | Quiet rooms, mic-friendly |
| D7 | Problem = stats + cited sources | Rigor signal for professors |
| D8 | Live preview = scripted 3-beat 12s loop | Permission-free product motion |
| D9 | Features = bento grid (2 large + 4 small) | Modern, hierarchy-friendly |
| D10 | Accessibility includes meta "Try high-contrast" button | Product-as-demo move |
| D11 | Impact = manifesto + 3 personas | Humanizes social value |
| D12 | Academic = split (institution + team) + resource bar | Closes accountability loop |
| D13 | All sections respect `prefers-reduced-motion` | Accessibility is the thesis |

---

## 6. Assumptions

| # | Assumption |
|---|---|
| A1 | A short demo video exists or will be recorded before evaluation |
| A2 | Backend may be down during demo; landing must not break |
| A3 | Default language = English; Arabic via toggle |
| A4 | Academic info (university, supervisor, year) will be provided before launch |
| A5 | Page must be responsive end-to-end |

---

## 7. Open Questions (Carry Forward)

| # | Open question | When to resolve |
|---|---|---|
| Q1 | Who records the demo video, and what's the script? | Before Hero implementation |
| Q2 | Real academic info (university, supervisor, team) | Before Section 7 implementation |
| Q3 | Real or aspirational impact stats — any partner orgs to cite? | Before Section 6 implementation |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Demo video not ready by deadline | Hero falls back to animated chat preview |
| Backend down during evaluation | Landing entirely client-side; Try Demo gracefully shows offline notice |
| Mobile viewers from QR code at booth | Every section designed mobile-first |
| Accessibility regressions during dev | Section 5 itself becomes a regression test |
| Placeholder academic info accidentally shipped | Add a build-time check for `[University Name]` etc. |

---

## 9. Exit Criteria — Met

- [x] Understanding Lock confirmed
- [x] At least one design approach explicitly accepted
- [x] Major assumptions documented
- [x] Key risks acknowledged
- [x] Decision Log complete

---

## 10. Implementation Handoff Notes (for later)

When implementation begins:

1. Treat this document as the source of truth for the landing page.
2. Replace placeholder fields (`[University Name]`, etc.) before any public deploy.
3. Verify all sections against `prefers-reduced-motion` in CI if possible.
4. Verify keyboard navigation order matches reading order on every section.
5. Add a build-time check for unfilled placeholder strings.
6. Confirm video asset, alt text, and captions before recording is shipped.

---

*Generated via the `brainstorming` skill — design facilitation pass, no implementation performed.*
