---
name: create-brand-identity
version: 1.0.0
description: |
  Build a complete brand identity for a company from scratch, following the iteration + review
  pattern used to produce the Autopilot brand book. Walks through 7 phases: discovery (personas
  + positioning), voice spec, visual system (colour/type/logo concepts iterated v1→vN), brand-
  book HTML build (19 sections), asset pipeline (dual-track SVGs, PNGs, OG cards, PDF export),
  template library (email sig, letterhead, deck cover), and LLM-council ratification before
  lock. Provides parameterised scaffold scripts (opentype.js outliner, Puppeteer PDF/PNG
  generators) so the technical pipeline drops into a new client folder in ~2 hours once visual
  direction is set. STRONG TRIGGERS: "build a brand", "create a brand identity", "design a logo
  system", "make a brand book", "brand guidelines for [company]". Adapted from the Autopilot
  Pte. Ltd. brand-identity work (4 review rounds, 7 logo iterations, council-ratified).
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Create Brand Identity

A 7-phase process for taking a company from "we need a brand" to "council-ratified, production-ready brand kit." This is the same process used for [Autopilot](https://autopilot.sg) (Singapore consultancy, locked at v7 in 2026). The scaffold scripts are parameterised so the technical pipeline (outlined SVGs, PNG exports, PDF brand book) is reusable per client.

---

## When this fires

The user says any of:

- "Build a brand for [company]"
- "Create a brand identity / brand book / brand guidelines"
- "Design a logo system"
- "We need a visual identity / typography system / colour system"
- "Help us position [company]"

Skip if the user only wants a logo file (no system) or only copy work (no visual). This skill is for **full systems**.

---

## The 7 phases

| # | Phase | Output | Reference |
|---|---|---|---|
| 1 | **Discovery** | 3–5 personas, positioning statement, mission, audience map | `references/01-discovery.md` |
| 2 | **Voice** | Voice spec: principles, exclusions, rhythm, locale, signature device | `references/02-voice.md` |
| 3 | **Visual system** | Colour palette, type pairing, logo concepts iterated v1→vN | `references/03-visual-system.md` |
| 4 | **Brand book** | Single-file HTML (19 sections), scrollable, animated, section-nav | `references/04-brand-book.md` |
| 5 | **Asset pipeline** | Dual-track SVGs (text-based + outlined), PNG exports, OG cards, PDF | `references/05-asset-pipeline.md` |
| 6 | **Templates** | Email signature, letterhead, deck cover (HTML, Outlook-safe, printable) | `references/06-templates.md` |
| 7 | **Review & ratify** | LLM council, persona review, lock the version | `references/07-review-and-ratify.md` |

Don't skip phases. Each one is a gate for the next. A logo without personas can't be defended in review. A brand book without a locked logo is a moving target. A template kit without a brand book has no source of truth.

The phases overlap in practice — voice work informs visual register, persona work feeds back into positioning — but the **outputs** sequence strictly.

---

## Working directory layout

For a new client `ACME`, scaffold:

```
ACME-Brand/
├── 01-Discovery/
│   ├── personas.md
│   ├── positioning.md
│   └── audience-map.md
├── 02-Voice/
│   └── voice-spec.md
├── 03-Visual/
│   ├── colour-system.md
│   ├── type-pairing.md
│   ├── logo-research.md
│   └── concepts/                      # v1, v2, ... vN as HTML
│       ├── logo-concepts-v1.html
│       ├── logo-concepts-v2.html
│       └── logo-concepts-v7.html      # locked version
├── 04-BrandBook/
│   └── brand-book.html                # symlink or copy of locked concepts file
├── 05-Assets/
│   ├── brand-config.json              # company name, colours, fonts — single source of truth
│   ├── PlayfairDisplay-Bold.ttf       # or whatever serif you picked
│   ├── Inter-Variable.ttf             # or whatever sans you picked
│   ├── outline-logos.js               # from scaffold/, reads brand-config.json
│   ├── generate-pdf.js                # from scaffold/, reads brand-config.json
│   ├── generate-pngs.js               # from scaffold/, reads brand-config.json
│   ├── generate-og-image.js           # from scaffold/, reads brand-config.json
│   └── logos/                         # generated SVGs + PNGs
├── 06-Templates/
│   ├── email-signature.html
│   ├── letterhead.html
│   └── deck-cover.html
├── 07-Review/
│   ├── council/                       # LLM council transcripts + verdicts
│   ├── persona-reviews/               # 3–5 reviews, one per persona
│   └── specialist/                    # optional: brand strategist, art director, etc.
├── README.md                          # client-facing overview
└── ACME-Brand-Identity.pdf            # final PDF export of brand-book.html
```

The numeric prefixes (01–07) mirror the phase order and let the directory be navigated chronologically.

---

## Discovery → Voice → Visual is non-negotiable order

A common failure mode is the user pushing straight to "let's design the logo." Resist. Logo concepts produced before personas + voice exist will:

- Optimise for the founder's taste instead of the audience's recognition.
- Get torn apart in council review with no rebuttal because there's no positioning to defend against.
- Lock you into a visual register that the voice can't sustain (e.g. a playful logo on a McKinsey-register firm).

When the user pushes early, say: *"We can sketch directions, but until personas and voice are signed off, every concept is provisional. Want to do the discovery first so the visual work has somewhere to anchor?"*

---

## Iteration is the work

The Autopilot logo went through **7 numbered versions** before lock. Each version was a full HTML concepts file with multiple options inside. The progression matters:

- **v1–v3**: range exploration. Show 3–5 directions per version. Kill 80% each round.
- **v4–v5**: refinement. Two surviving directions. Test against personas, voice, scale (favicon to billboard).
- **v6**: one direction, multiple variants (with/without period, mono/colour, etc.).
- **v7**: locked. One concepts file, the final variants only. Council-ratified.

Don't number `v2-final-final-v3`. Use sequential integers. Keep all prior versions in `03-Visual/concepts/`. The history is the audit trail.

---

## The council ratification gate

A locked logo is one that survived **LLM Council** review (see `references/07-review-and-ratify.md`). Until council ratification, the visual is "current" not "final."

Council pattern:
1. Frame the decision as Option A (keep current vN) vs Option B (a deliberate counter-proposal — usually the best non-chosen direction from v5 or v6).
2. Five advisors (Contrarian, First-Principles Thinker, Expansionist, Outsider, Chairman) review independently.
3. Each writes a verdict. Chairman synthesises.
4. If verdict is unanimous keep-vN, **lock**. Set a 12-month review window.
5. If verdict is split or favours Option B, iterate to v(N+1) and re-council.

The lock is durable. Editing a locked logo without re-council is forbidden. CLAUDE.md / project memory should record the lock date + review window.

---

## The asset pipeline — what makes it reusable

The Autopilot pipeline is parameterised through a single `brand-config.json` file. Drop the scaffold scripts into the client's `05-Assets/`, edit the config, run the generators. The dual-track SVG system (text-based + outlined) and Puppeteer PDF export are the load-bearing pieces.

**Scaffold files at** `scaffold/`:
- `brand-config.sample.json` — schema with comments
- `outline-logos.js` — opentype.js outliner, reads config
- `generate-pdf.js` — Puppeteer brand-book → A4 PDF
- `generate-pngs.js` — wordmark/mark PNG exporter at 1x/2x
- `generate-og-image.js` — 1200×630 OG card
- `templates/email-signature.html` — Outlook-safe table HTML
- `templates/letterhead.html` — A4 print-ready
- `templates/deck-cover.html` — presentation cover slide

Copy the whole `scaffold/` directory into `05-Assets/`, edit `brand-config.json`, and the generators work.

Detailed walkthrough: `references/05-asset-pipeline.md`.

---

## Quick rules

Things that bite you if you don't know them:

1. **Single source of truth for brand tokens.** Colours, font sizes, font families, letter-spacing, period radius — all in `brand-config.json`. The HTML brand book reads from CSS variables that match. The outlined-SVG generator reads from the same config. If you fork the values, the wordmark and the brand book drift, and you won't notice until someone screenshots both side by side.

2. **Dual-track SVGs are non-negotiable for any brand using a custom typeface.** Text-based SVGs depend on Google Fonts (or @font-face) being loaded — fine on web, fatal in email and PDF. Outlined SVGs (paths only) work everywhere but are ~3× the file size. Ship both. Document which to use where.

3. **opentype.js metrics differ from browser metrics.** When you outline a wordmark, the native opentype.js path will be narrower than the browser-rendered text. The outliner calculates a uniform scale factor (`targetTextEndX / nativeTextEndX`) and wraps the path in `<g transform="scale(S)">`. This is in `scaffold/outline-logos.js`. Don't fight it.

4. **The PDF generator must freeze CSS animations.** If the brand book uses `.animate-in` classes or CSS keyframe animations, Puppeteer captures a single frame which may show elements mid-transition (or invisible at `opacity: 0`). The generator script runs a `page.evaluate()` that forces every animated element to its final state before calling `page.pdf()`. See `scaffold/generate-pdf.js`.

5. **A4 at 800px viewport renders at scale 0.88.** Don't override unless you know what you're doing. The brand-book HTML is designed against 800px (above mobile breakpoint, below desktop). 0.88 scale fits it cleanly to A4. Other scales clip or leave white space.

6. **Em-dash policy is a brand decision.** Decide early. Autopilot's voice bans em-dashes entirely (period as device). Other brands may use them liberally. Whatever you decide, document it in the voice spec and enforce it across the brand book + templates + future copy.

7. **Locale and spelling rules are part of the brand.** International English (-ise), American English (-ize), British (-ise + -our), or mixed. Decide once. Apply everywhere. The voice spec is the source of truth.

8. **Personas drive everything, including colour.** "Why navy?" should be answerable in terms of the personas (e.g., "Somchai is 53, runs a manufacturing SME; navy reads as trustworthy and serious to him, not playful"). If you can't answer that question, the colour isn't locked — it's just preferred by the designer.

9. **The brand book is single-file HTML, not a Figma file or PDF-first.** Source HTML lets the designer + developer + Claude all edit it. PDF is a snapshot exported from HTML. Figma is a parallel deliverable but not the source of truth.

10. **Lock the logo before building templates.** Templates (email sig, letterhead, deck cover) embed the locked logo. If you ship templates against a provisional logo, every template will need regenerating when the logo locks. Wait.

---

## Output format

When the user kicks this off:

1. **Confirm scope.** Get the company name, sector, geography, audience in one or two paragraphs. Don't assume.
2. **Propose the working directory.** Show the layout above. Confirm path before scaffolding.
3. **Start Phase 1 (Discovery).** Don't jump phases. Pull the user through with concrete prompts — "Who are the 3–5 personas? What's the core positioning sentence? What's the audience map?"
4. **At every phase boundary**, summarise what's locked and what's next.
5. **At the end of each iteration round in Phase 3**, ask: "Does this advance the brand or are we churning?" If churning, run the council early to break the deadlock.

---

## Source

This skill is the codified process behind the Autopilot brand identity (Singapore consultancy, Pte. Ltd., locked at logo v7 on 2026-05-06). The original work spans:

- `01-Branding/` — 4 review rounds, 7 logo versions, B- → A- grade progression
- `02-Website/research/personas.md` — 4 personas, one per service line
- `02-Website/reviews/persona-reviews/` — v1, v3, v4 persona reviews
- `council/council-transcript-2026-05-06-logo.html` — final ratification record

The Autopilot brand is the worked example throughout the references. When you build a brand for ACME Corp, you're following the same process — substituting ACME's discovery, voice, and visual choices into the same scaffold.
