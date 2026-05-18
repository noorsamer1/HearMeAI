# Sign Keyboard: How Arabic and English Letters Were Mapped to Emojis

**Project:** HearMeAI — AI Communication Solutions for Deaf & Mute Individuals  
**Audience:** Students (thesis, viva, or supervisor Q&A)  
**Purpose:** Explain exactly how we mapped **English (ASL-style)** and **Arabic (ArSL-style)** letters to emojis in the sign composer keyboard.

---

## 1. Executive summary (say this to your supervisor)

We built a **sign composer keyboard** in the chat UI so deaf or bilingual users can tap letters or phrases instead of typing on a normal keyboard. For each letter we show a **Unicode emoji** as a **visual hint** for a hand shape (finger-spelling). The mapping is **not downloaded from a website**; it is a **lookup table written in TypeScript** in our repository.

| Language tab | Letters | Map variable | File |
|--------------|---------|--------------|------|
| English (A–Z) | 26 Latin letters | `ASL_LETTER_EMOJI` | `frontend/src/lib/sign/vocabulary.ts` |
| Arabic (عربي) | 28 Arabic letters | `ARSL_LETTER_MAP` | `frontend/src/lib/sign/vocabulary.ts` |

**Important limitations (be honest):**

- Emojis are **simplified icons**, not certified sign-language photographs or videos.
- Tapping a key adds the **letter character** to the message; emojis are **display only**.
- **Arabic letter → emoji is not auto-imported from any website.** The table is hand-written in code. A **public fingerspelling chart** (AI-Media, see §2.5) can be cited in your thesis as **design reference** if your team used it when choosing gestures — but the repo does not contain a per-letter traceability file unless you add one.

---

## 2. Evidence audit — what exists in the repo (read this before the viva)

If a supervisor asks *“Show me proof you mapped Arabic letters using KArSL / ArabSign research”*, the honest answer is: **that proof does not exist for the keyboard.** Below is what the repository actually contains.

### 2.1 Arabic keyboard (`ARSL_LETTER_MAP`) — no research traceability

| Question | Answer in this project |
|----------|-------------------------|
| Was each Arabic letter matched to a KArSL video label? | **No** |
| Was each Arabic letter matched to an ArabSign gloss? | **No** |
| Is there a CSV/JSON mapping file from dataset → emoji? | **No** |
| Is there a commit message or doc with per-letter citations? | **No** |
| Where was the map created? | **Manually** in `frontend/src/lib/sign/vocabulary.ts` (lines 40–69) |
| What does the code comment say? | Only: *“ArSL finger-spelling hand shapes (one gesture per Arabic letter)”* — naming intent, not a data source |

**Conclusion for students:** `ARSL_LETTER_MAP` is a **prototype UX glossary**. The label “ArSL” in variable names means *we intend Saudi/Gulf Arabic sign context for the product*, not *this table was extracted from a research dataset*.

### 2.2 What KArSL and ArabSign are used for (different subsystem)

These names **do** appear in the project, but **not** for the emoji keyboard:

| Artifact | Path | Purpose |
|----------|------|---------|
| KArSL adapter | `backend/tools/sign_data/sources/karsl_adapter.py` | Ingest **`.mp4` sign videos** from a local KArSL folder into `CanonicalSignSample` for ML/training |
| ArabSign adapter | `backend/tools/sign_data/sources/arabsign_adapter.py` | Same for ArabSign videos |
| Pipeline doc | `docs/sign-data-pipeline.md` | Phase 1 dataset build, schema, training — **word/sign clips**, not A–Z keyboard keys |
| Schema | `docs/sign-schema-v1.md` | Provenance fields like `"source": "karsl"` on **video samples** |

Example: `iter_karsl_samples()` walks `**/*.mp4` under a configured `root_dir` and guesses a gloss from the **filename** — it never reads `ARSL_LETTER_MAP` and never outputs emojis.

**Conclusion:** Citing KArSL/ArabSign in a thesis is correct for **future sign recognition / avatar motion**, but it is **misleading** if presented as the method used to build the chat keyboard emoji grid.

### 2.3 English keyboard (`ASL_LETTER_EMOJI`) — informal public reference only

| Question | Answer |
|----------|--------|
| Copied from Wikipedia/Lifeprint automatically? | **No** — same manual table in `vocabulary.ts` |
| Aligned with common ASL manual alphabet ideas? | **Loosely** — team picked emojis that suggest fist/palm/point shapes |
| Per-letter proof in repo? | **No** — only the static map |

Public pages ([American manual alphabet](https://en.wikipedia.org/wiki/American_manual_alphabet), [Lifeprint ABC](https://www.lifeprint.com/asl101/fingerspelling/abc.htm)) are useful for **background reading** or bibliography, not as evidence that our emoji column was verified letter-by-letter.

### 2.4 External reference you can cite: AI-Media Arabic alphabet chart

**URL:** [Sign Language Alphabets From Around The World — AI-Media](https://www.ai-media.tv/knowledge-hub/insights/sign-language-alphabets/)

**What the page provides:**

- A blog article with **photograph grids** for several manual alphabets (ASL, BSL, Chinese, French, Japanese, Spanish, etc.).
- Under **“Arabic Sign Language”**, the text states that the Arab region has many sign varieties, and mentions **Levantine Arabic Sign Language** as one distinguished member of the family.
- The Arabic grid shows **28 letters** (ا … ي) with **real hand-shape photos** — this is the kind of **public, visual fingerspelling reference** students can show a supervisor (screenshot + URL + access date).

**Important caveats (say these clearly):**

| Point | Detail |
|-------|--------|
| **Variant** | The chart is tied to the **Arab sign-language family** / **Levantine** context on that page — **not** explicitly “Saudi Sign Language.” Gulf/Saudi fingerspelling can differ. |
| **Source type** | Industry **blog / accessibility** content (AI-Media), not a peer-reviewed linguistics paper or government standard. |
| **Our implementation** | HearMeAI still stores **emojis**, not those photos. There is **no script** in git that downloaded the AI-Media images into `ARSL_LETTER_MAP`. |
| **KArSL** | Still a **separate** ML video pipeline — not the same as this keyboard chart. |

**How to cite in a thesis (example — adapt to your style guide):**

> AI-Media. (2024). *Sign language alphabets from around the world* [Blog post]. Retrieved [date], from https://www.ai-media.tv/knowledge-hub/insights/sign-language-alphabets/

**What students can honestly claim if they used this page while building the keyboard:**

> “Arabic key labels were designed as emoji stand-ins for **one-hand fingerspelling gestures**, using a published 28-letter Arabic manual alphabet chart (AI-Media, 2024) as a **visual reference** for hand-shape ideas. Because the product uses Unicode emojis instead of photos, and because regional ArSL variants differ, the in-app map is an **approximation for prototyping**, not a certified Saudi ArSL standard.”

**What students should NOT claim:**

- “We automatically scraped AI-Media into our code.” → **False** unless you build that pipeline.
- “Our keyboard equals Saudi ArSL.” → **Not supported** by that page alone.
- “Every emoji matches the photo for that letter.” → **Not verified** in the repository (see §7.1).

#### 2.4.1 English tab on the same page

The same article includes an **American Sign Language (ASL)** alphabet image. That supports citing AI-Media for the **A–Z** tab as informal ASL fingerspelling context, with the same limitation: our `ASL_LETTER_EMOJI` table is still **manual emoji choices** in `vocabulary.ts`.

#### 2.4.2 Suggested evidence for the viva (if doctor asks for “research”)

Bring **three** items:

1. **Code:** `frontend/src/lib/sign/vocabulary.ts` → `ARSL_LETTER_MAP`
2. **Screenshot:** Arabic grid from AI-Media URL (with date accessed)
3. **Optional spreadsheet** (you create): columns `Letter | AI-Media gesture (words) | Our emoji | Our description | Match? (Y/partial/N)`

Until you fill row (3) for all 28 letters, the repo alone does not prove letter-by-letter alignment with AI-Media.

### 2.5 What to tell your supervisor (recommended wording)

> “The sign keyboard uses hand-written lookup tables in TypeScript. For English, we followed the general idea of ASL fingerspelling; the AI-Media article includes a standard ASL alphabet image we can cite. For Arabic, we used a 28-letter manual alphabet chart from the same AI-Media article (Arabic Sign Language / Levantine family context) as a **visual reference**, then encoded **emoji placeholders** in `ARSL_LETTER_MAP`. We did **not** import KArSL or ArabSign videos into the keyboard. KArSL/ArabSign are for a separate ML dataset pipeline in `docs/sign-data-pipeline.md`. Confirming Saudi-specific gestures or replacing emojis with licensed photos is **future work**.”

---

## 3. Why we used emojis

| Reason | Explanation |
|--------|-------------|
| Speed | No need to host 54+ image or video files per letter for a prototype |
| Consistency | Same approach for English and Arabic tabs |
| Accessibility | `title` / `aria-label` use text descriptions on Arabic keys |
| Avatar preview | The 3D/sign widget can animate through a sequence of emoji “steps” |
| Limitation | Emojis do not match real ASL/ArSL hand shapes with linguistic accuracy |

This is a **UX and demonstration** choice for an academic project, not a replacement for a professional sign-language lexicon.

---

## 4. Where the mapping lives in code

```
frontend/src/lib/sign/
├── vocabulary.ts      ← ALL letter → emoji tables (English + Arabic)
├── spellingPlan.ts    ← English/Latin text → sequence of SpellSteps with emoji
├── types.ts           ← SpellStep { label, emoji, description, durationMs }
frontend/src/components/chat/
├── SignKeyboard.tsx   ← UI: three tabs (A–Z, عربي, Phrases)
frontend/src/components/avatar/
├── SignLanguageWidget.tsx  ← Plays spell steps (shows emoji per letter)
├── SignPreview.tsx
frontend/src/lib/hooks/
├── useSession.ts      ← Chooses Arabic vs English spell plan for captions/avatar
```

**Backend (text only, no emojis):**

- `backend/app/api/v1/endpoints/sign_translate.py` — converts a list of sign tokens into a full English or Arabic sentence via LLM.

---

## 5. Data structure: how a “map” works in TypeScript

### 5.1 English — simple string map

Each key is one letter `A` … `Z`. Each value is one emoji string.

```typescript
export const ASL_LETTER_EMOJI: Record<string, string> = {
  A: "👊",
  B: "🖐",
  // ...
};
```

### 5.2 Arabic — object map (emoji + description)

Each key is one Arabic character. Each value has **emoji** (shown on the button) and **description** (tooltip / spell-step text).

```typescript
export const ARSL_LETTER_MAP: Record<string, { emoji: string; description: string }> = {
  ا: { emoji: "☝️", description: "Index up" },
  ب: { emoji: "🖐", description: "Palm flat" },
  // ...
};
```

The **description** was written in short English so developers and screen readers understand the intended hand pose (e.g. “Two fingers” for ت).

---

## 6. Complete English letter → emoji table (ASL-style tab)

**Implementation source (only):** `frontend/src/lib/sign/vocabulary.ts` — `ASL_LETTER_EMOJI`  
**Optional background reading (not used to generate the table):** [American manual alphabet (Wikipedia)](https://en.wikipedia.org/wiki/American_manual_alphabet), [Lifeprint fingerspelling ABC](https://www.lifeprint.com/asl101/fingerspelling/abc.htm)

| Letter | Emoji | Letter | Emoji | Letter | Emoji |
|--------|-------|--------|-------|--------|-------|
| A | 👊 | J | 🤙 | S | ✊ |
| B | 🖐 | K | ✌ | T | 👍 |
| C | 🤏 | L | 🤟 | U | ✌ |
| D | ☝ | M | 🤜 | V | ✌ |
| E | 🤞 | N | 🤛 | W | 🤟 |
| F | 👌 | O | 👌 | X | ☝ |
| G | 👈 | P | 👇 | Y | 🤙 |
| H | 👉 | Q | 👇 | Z | ☝ |
| I | 🤙 | R | 🤞 | | |

**How each English key was chosen (method):**

1. Start from the idea of **ASL manual alphabet** (one hand shape per letter).
2. Pick a **single Unicode emoji** that loosely suggests that shape (fist, open palm, pointing finger, etc.).
3. Store the pair in `ASL_LETTER_EMOJI` — no API call, no scraping.

Note: **J** and **I** both use 🤙 in our table; **O** and **F** both use 👌 — we reused emojis where the set of available characters is limited.

---

## 7. Complete Arabic letter → emoji table (عربي tab)

**Implementation source:** `frontend/src/lib/sign/vocabulary.ts` — `ARSL_LETTER_MAP`  

**Design reference (external, citable):** [AI-Media — Arabic Sign Language alphabet grid](https://www.ai-media.tv/knowledge-hub/insights/sign-language-alphabets/) (§2.4). Use when explaining *why* each key represents a distinct hand pose — not as proof the repo auto-synced to that page.

**Do not claim** this table was exported from KArSL or ArabSign datasets.

| Letter | Emoji | Description (tooltip) | Letter | Emoji | Description |
|--------|-------|---------------------|--------|-------|-------------|
| ا | ☝️ | Index up | ق | 👊 | Fist tap |
| ب | 🖐 | Palm flat | ك | 🤚 | Flat stop |
| ت | ✌ | Two fingers | ل | 🤟 | Love hand |
| ث | 🤟 | Three open | م | 👍 | Thumb up |
| ج | 🤞 | Cross fingers | ن | 👎 | Thumb down |
| ح | 🖖 | Split V | ه | 🖐 | Five spread |
| خ | 👋 | Wave out | و | 🤞 | Cross hope |
| د | 👆 | Point up | ي | 🤙 | Shaka |
| ذ | 👇 | Point down | | | |
| ر | 👉 | Point right | | | |
| ز | 👈 | Point left | | | |
| س | ✊ | Closed fist | | | |
| ش | 🤜 | Right fist | | | |
| ص | 🤛 | Left fist | | | |
| ض | 🤙 | Hang loose | | | |
| ط | 👌 | OK shape | | | |
| ظ | 🤚 | Stop palm | | | |
| ع | 🤲 | Open palms | | | |
| غ | 🙌 | Raised hands | | | |
| ف | 🤏 | Pinch | | | |

**How each Arabic key was actually chosen (what we can defend):**

1. List the **28 Arabic letters** shown on the keyboard (ا … ي).
2. For each letter, pick a **distinct-looking emoji** so keys are visually different in the grid (pointing, fist, palm, pinch, etc.).
3. Write a short **English description** for tooltips (`title`) and the spell animation (`buildArslSpellPlan`).
4. Commit the object literal `ARSL_LETTER_MAP` in source — **no import from datasets, no reviewer sign-off recorded in git**.

**What we cannot defend without new work:** that each emoji matches the official Saudi/Gulf ArSL fingerspelling hand shape for that letter, or that it matches any specific frame in KArSL/ArabSign.

### 7.1 Conceptual check vs AI-Media chart (illustrative — not a formal validation)

The AI-Media grid uses **photographs** of Levantine-family finger spelling. Our app uses **emojis** with short English blurbs. Some entries are **conceptually similar** (e.g. ت “two fingers” ↔ ✌; ف “pinch/OK” ↔ 🤏); others are **loose** or **generic** (e.g. ب “palm flat” on our key vs index-up on many published ب gestures).  

**For the viva:** do not say “verified against AI-Media” unless you complete a full 28-row review spreadsheet (§2.4.2). Say instead: **“informed by a published 28-letter Arabic fingerspelling chart; emoji mapping is a simplified UI layer.”**

---

## 8. Arabic variants (same emoji, different Unicode letter)

Users may type hamza or alef forms that are not separate keys on the keyboard. Function `lookupArslLetter()` in `vocabulary.ts` maps them to the same emoji as a base letter:

| User types | Resolved as | Uses emoji from |
|------------|-------------|-----------------|
| أ ، إ ، آ ، ٱ | ا | ا → ☝️ |
| ى | ي | ي → 🤙 |
| ة | ه | ه → 🖐 |
| ـ (tatweel) | (skipped) | — |
| Arabic diacritics (ً ٌ …) | (skipped) | — |

This keeps the avatar spell plan and lookups consistent when text comes from speech-to-text or paste, not only from the keyboard.

---

## 9. End-to-end story: from map to what the user sees

### 9.1 Sign keyboard UI

**Component:** `frontend/src/components/chat/SignKeyboard.tsx`

1. **Tab “A–Z” (ASL):**  
   - Loop `ASL_LETTERS` (A…Z).  
   - For each letter, show `ASL_LETTER_EMOJI[letter]` and the letter label.  
   - On click: `append(letter)` → adds `"A"`, `"B"`, … to composed tokens.

2. **Tab “عربي” (ArSL):**  
   - Loop `Object.keys(ARSL_LETTER_MAP)`.  
   - For each letter, show `info.emoji` and the Arabic glyph.  
   - `title={info.description}` for hover tooltip.  
   - On click: `append(letter)` → adds `"ا"`, `"ب"`, …  
   - Grid uses `dir="rtl"`.

3. **Tab “Phrases”:**  
   - Separate list `SIGN_PHRASES` in `SignKeyboard.tsx` (hello, thank you, …).  
   - Each phrase has its own emoji (👋, 🙏, …) for the button only.  
   - On send, phrase **keys** go to the API, not the emoji.

4. **Send:**  
   - `signTranslate(composed, outputLang)` → `POST /api/v1/sign-translate`  
   - LLM returns a full sentence in English or Arabic.  
   - That **text** goes to chat; emojis are not sent as the message body.

### 9.2 Avatar / live caption spell animation

When message text is shown as sign preview:

| Text type | Function | Emoji source |
|-----------|----------|--------------|
| Mostly Arabic | `buildArslSpellPlan()` in `vocabulary.ts` | `lookupArslLetter(ch)` → `arsl.emoji` |
| Mostly English/Latin | `buildSpellPlan()` in `spellingPlan.ts` | `ASL_LETTER_EMOJI[ch.toUpperCase()]` |

Each plan returns an array of `SpellStep` objects:

```typescript
interface SpellStep {
  label: string;       // e.g. "ا" or "A"
  durationMs: number;  // ~560 ms per letter
  description?: string;
  emoji?: string;      // shown in SignLanguageWidget
}
```

The widget displays one step at a time so the user sees “finger-spelling” as a sequence of emoji icons.

**Timing constants (same file):**

- `LETTER_MS = 560` — time per letter  
- `PAUSE_MS = 380` — optional pause between letters in a word  
- `WORD_BREAK_MS = 720` — pause marker after each word (✔️)

---

## 10. Phrases tab (emoji on buttons only)

Phrases are **not** in `vocabulary.ts`. They are defined in `SignKeyboard.tsx` as `SIGN_PHRASES`:

| Phrase key | English label | Arabic label | Button emoji |
|------------|---------------|--------------|--------------|
| hello | Hello | مرحبا | 👋 |
| thank you | Thank you | شكراً | 🙏 |
| how are you | How are you | كيف حالك | 🤔 |
| yes | Yes | نعم | ✅ |
| no | No | لا | ❌ |
| please | Please | من فضلك | 🙏 |
| help | Help | ساعدني | 🆘 |
| sorry | Sorry | آسف | 😔 |
| good | Good | جيد | 👍 |
| bad | Bad | سيء | 👎 |
| water | Water | ماء | 💧 |
| food | Food | طعام | 🍽️ |
| question | Question? | سؤال؟ | ❓ |

These emojis illustrate the **concept** of the phrase (wave, thanks, etc.), not official sign videos.

---

## 11. What we did **not** do

| Statement | True? |
|-----------|-------|
| Derive `ARSL_LETTER_MAP` from KArSL or ArabSign | **No** |
| Scrape a website to fill `ARSL_LETTER_MAP` | **No** |
| Use KArSL videos as one emoji per keyboard key | **No** (KArSL ingests `.mp4` for ML only) |
| Document per-letter research citations for Arabic emojis | **No** |
| Send emojis over WebSocket to the peer | **No** (text/transcript is sent) |
| Guarantee medically or linguistically correct ArSL | **No** (prototype glossary) |

---

## 12. References — two buckets (do not mix them up)

### Bucket A — Primary evidence for the keyboard (use these in the viva)

| What | Where |
|------|--------|
| Arabic + English emoji tables | `frontend/src/lib/sign/vocabulary.ts` |
| Keyboard UI | `frontend/src/components/chat/SignKeyboard.tsx` |
| Arabic spell steps | `buildArslSpellPlan()` in `vocabulary.ts` |
| English spell steps | `buildSpellPlan()` in `frontend/src/lib/sign/spellingPlan.ts` |

### Bucket B — Public fingerspelling charts (cite for keyboard **methodology**)

Use when explaining **where the team got the idea** for 28 Arabic letter gestures (and ASL A–Z):

| Resource | URL | Role |
|----------|-----|------|
| **AI-Media — Sign language alphabets** | https://www.ai-media.tv/knowledge-hub/insights/sign-language-alphabets/ | **Arabic 28-letter photo grid** + ASL grid; blog cites Arab sign-language family / Levantine variety |
| ASL manual alphabet (Wikipedia) | https://en.wikipedia.org/wiki/American_manual_alphabet | Extra background for English tab |
| Lifeprint ASL ABC | https://www.lifeprint.com/asl101/fingerspelling/abc.htm | Extra background for English tab |
| Saudi Sign Language (Wikipedia) | https://en.wikipedia.org/wiki/Saudi_Sign_Language | Regional context; **not** the same as the AI-Media chart variant |

Saved copy in repo (optional): `uploads/sign-language-alphabets-0.md` (text extract from the page; images are on the live site).

### Bucket C — ML datasets (NOT the keyboard emoji source)

| Resource | URL | Used in repo for |
|----------|-----|------------------|
| KArSL | https://hamzah-luqman.github.io/KArSL/ | `karsl_adapter.py` video ingestion |
| KArSL GitHub | https://github.com/Hamzah-Luqman/KArSL | Same |
| ArabSign | https://hamzah-luqman.github.io/ArabSign/ | `arabsign_adapter.py` |
| Sign data pipeline | `docs/sign-data-pipeline.md` | ML dataset build |

---

## 13. Future work — if you need research-backed Arabic mapping

To legitimately claim “mapped from research,” a follow-up study would need artifacts like:

1. **Source standard** — e.g. published ArSL fingerspelling chart, deaf consultant review, or labeled frames from KArSL **if** the dataset includes isolated alphabet clips (verify dataset contents first; KArSL in this repo is ingested as word videos, not as a built-in A–Z table).
2. **Traceability matrix** — spreadsheet: `letter | source_id | frame/time | chosen emoji | reviewer initials`.
3. **Code generation** — script that exports the matrix to `ARSL_LETTER_MAP` (or replace emojis with thumbnail images from approved frames).
4. **Ethics / license** — document permission to use dataset frames in the UI (`docs/sign-licensing-and-provenance.md`).

Until that exists, students should describe the keyboard as **Phase 1 UI prototype**, and KArSL/ArabSign as **Phase 1 data pipeline** (separate).

---

## 14. Sample Q&A for supervisor / examiner

**Q: Did you map Arabic letters using KArSL or ArabSign?**  
A: **No.** Those datasets are wired in `backend/tools/sign_data/` to ingest sign **videos** for training. The keyboard’s `ARSL_LETTER_MAP` was written manually in `frontend/src/lib/sign/vocabulary.ts` with emoji placeholders. We can show the exact lines in git; we cannot show a research-derived mapping table.

**Q: Then why is it called ArSL in the code?**  
A: It names the **product intent** (Arabic Sign Language–oriented UX for Saudi/Gulf users), not a certified linguistic mapping.

**Q: Where did you get the Arabic sign alphabet?**  
A: We use a 28-letter layout aligned with standard Arabic fingerspelling practice. A **citable visual reference** is the Arabic manual alphabet on AI-Media’s page (https://www.ai-media.tv/knowledge-hub/insights/sign-language-alphabets/), which discusses the Arab sign-language family and shows photo grids. Our app encodes that idea as **emojis + tooltips** in `ARSL_LETTER_MAP` in `vocabulary.ts` — not as imported photos.

**Q: Is that the same as KArSL?**  
A: **No.** KArSL is a research video dataset in our backend for ML. AI-Media is a public fingerspelling chart for **keyboard design reference**. They serve different parts of the project.

**Q: Why emojis instead of real sign videos on the keyboard?**  
A: MVP speed and consistency. Real clips from KArSL/ArabSign are the direction for **avatar/ML**, documented in `docs/sign-data-pipeline.md`, not implemented as per-key keyboard assets.

**Q: How is English different from Arabic in code?**  
A: English uses `ASL_LETTER_EMOJI` (letter → string). Arabic uses `ARSL_LETTER_MAP` (letter → `{ emoji, description }`) plus `lookupArslLetter()` for variant characters. Neither Arabic nor English table has dataset provenance in the repo.

**Q: Does the peer see emojis when I type?**  
A: No. They see the translated **text** (and optional TTS/avatar). Emojis appear on the keyboard buttons and in the local spell preview animation.

**Q: Can you show the mapping in the running app?**  
A: Log in as Deaf or Both → open session → sign keyboard → tabs **A–Z** and **عربي** → hover Arabic keys for descriptions → compose → Send to run `sign-translate`. For **proof of implementation**, open `vocabulary.ts` in the IDE.

---

## 15. Revision history

| Date | Note |
|------|------|
| 2026-05-18 | Initial student documentation for emoji letter mapping |
| 2026-05-18 | Added §2 evidence audit; clarified that KArSL/ArabSign do not justify Arabic emoji choices |
| 2026-05-18 | Added §2.4 AI-Media fingerspelling URL as citable design reference (Levantine / Arab family context) |

---

*This document describes the HearMeAI prototype implementation. For the latest code, always verify `frontend/src/lib/sign/vocabulary.ts` and `frontend/src/components/chat/SignKeyboard.tsx`.*
