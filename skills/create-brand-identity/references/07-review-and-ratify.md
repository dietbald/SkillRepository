# Phase 7 — Review & ratify

LLM Council ratification. Persona review. Lock the version. Set the review window.

**Outputs:**
- `07-Review/council/council-transcript-[YYYY-MM-DD]-logo.html` — full ratification transcript
- `07-Review/persona-reviews/` — 3–5 reviews, one per persona
- `07-Review/specialist/` (optional) — specialist lens reviews (brand strategist, art director, etc.)
- Brand book updated with **LOCK** notice and review-window date
- Project memory or CLAUDE.md updated with lock details

**Phase exit gate:** unanimous council verdict + at least 80% positive persona reviews + brand book lock notice in place.

---

## 7.1 — Why review-and-ratify is not optional

A brand identity that hasn't been pressure-tested by independent critics will:

- Drift in the first six months when the founder asks for "small tweaks."
- Get re-litigated every time a new designer joins.
- Fail in council if a competitor adopts a similar mark and forces a comparison.
- Carry visual assumptions that nobody can defend in writing.

The ratification step closes those failure modes. Once council-ratified and the review window is set, the brand is locked. Anyone proposing changes must wait for the review window or trigger an early re-council.

---

## 7.2 — LLM Council pattern

Based on Karpathy's LLM Council methodology (see `llm-council` skill in this repo). Five advisors, independent analysis, peer review, synthesis.

### The five seats

| Seat | Role | Lens |
|---|---|---|
| **Contrarian** | Argue the strongest case against the locked direction | Risk, downside, what could go wrong |
| **First-Principles Thinker** | Strip the decision to basics and rebuild | Why this and not nothing? Why this and not the opposite? |
| **Expansionist** | Push the brand beyond the immediate use | How does this scale to 10× the audience, 5× the geography? |
| **Outsider** | Speak from outside the category | Would a fashion buyer / a hedge-fund analyst / a 16-year-old recognise this? |
| **Chairman** | Synthesise the four, render a verdict | Final call: lock, iterate, or reverse |

The five seats balance against each other. The Contrarian counters complacency. The Expansionist counters short-termism. The Outsider counters category insularity. The First-Principles Thinker counters tradition. The Chairman synthesises.

### How to run the council

For a logo ratification (the Autopilot case): frame the decision as **Option A** (the current locked candidate, e.g. v7) vs **Option B** (a deliberate counter-proposal — usually the best non-chosen direction from v5 or v6, or an explicit alternative that some stakeholder argued for).

Each advisor receives:
1. The brand book HTML (or its rendered PDF)
2. The Option A vs Option B brief — both visuals, both rationales
3. The personas from Phase 1
4. The voice spec from Phase 2
5. A prompt: *"Review both options. Identify which one better fits the brand. Be specific. Identify risks of locking the wrong one."*

Each advisor writes their verdict independently. The Chairman reads all four and writes the synthesis.

### Use the `/llm-council` skill

If this is a Claude Code session, invoke the `llm-council` skill rather than reimplementing the pattern. The skill handles seat assignment, parallel querying, peer review, and synthesis.

```
/llm-council Should we lock the v7 logo (Option A: pure typographic wordmark with red period) or iterate to v8 (Option B: red ring replacing the 'o' with three accent dots)? Brand book attached. Personas in 01-Discovery/personas.md. Voice spec in 02-Voice/voice-spec.md.
```

### Output format

The council produces a single HTML or markdown file: `council-transcript-[YYYY-MM-DD]-logo.html`. Structure:

```markdown
# Council Verdict — [Date]

## Decision framing

Option A: [description]
Option B: [description]

## Seats

### Contrarian
[Their verdict, ~200–400 words.]

### First-Principles Thinker
[~200–400 words.]

### Expansionist
[~200–400 words.]

### Outsider
[~200–400 words.]

### Chairman (synthesis)
[400–600 words.]

## Outcome

- **Verdict:** [LOCK Option A / LOCK Option B / ITERATE]
- **Unanimity:** [Yes / Split — describe]
- **Review window:** [12 months from today, default; longer for established brands, shorter for experimental]
- **Lock notice:** added to brand book section [X] / CLAUDE.md / project memory
```

### Autopilot worked example

Autopilot's council met on 2026-05-06. Option A: v7 pure-typographic wordmark with red period device. Option B: red ring replacing the 'o' with three red accent dots, mixed weights.

Outcome:
- Unanimous: lock Option A (v7).
- Rationale: Option B violated the brand's own 60-30-10 rule (5 red elements vs red-as-accent-only). Option B broke the manifesto ("the period is not decoration" yet deletes the period). Pure typography scales better to favicon. Period as device is the atomic unit for system expansion.
- Review window: 12 months (next review May 2027).

The transcript is at `council/council-transcript-2026-05-06-logo.html` in the Autopilot repo.

---

## 7.3 — Persona review

In parallel with the council, run each persona from Phase 1 through the brand book and the website (if it exists).

For each persona, write a review that answers:

1. **Did this persona find what they came for?** Yes / partially / no.
2. **What works for them?** Top 3–5 things ranked.
3. **What's missing or off-key for them?** Top 3–5 things with fixes.
4. **Would this persona engage?** Yes / not yet / no, with the trigger that would tip them.

Format: first person, **as the persona**, written in the persona's voice (not the brand voice).

Length: 800–1,200 words per persona.

### Why persona review matters

The council reviews the brand at the category-and-craft level. Personas review at the recognition level. Both are necessary. A logo can be craft-perfect and still fail to land with the audience it's meant for.

Autopilot ran 4 versions of persona reviews (v1, v3, v4) over multiple iterations. The v4 round (run after the website was rebuilt) confirmed that the visual + voice + page structure landed for all 4 personas at 8+/10. See `02-Website/reviews/persona-reviews/v4-*.md`.

### How to run a persona review

If you have Claude Code with Agent dispatch, run all personas in parallel:

```
Dispatch 4 agents in parallel, one per persona. Each agent reads the persona profile, views the brand book PDF (or the website screenshots), and writes a first-person review.
```

If you don't, run them sequentially. Either way, write the reviews to `07-Review/persona-reviews/[N]-[name]-[service].md`.

### Persona review structure

```markdown
# Persona Review — [Name] ([Service line])

[One-paragraph framing of who you are and what you came looking for.]

## Did I find what I came for?

[Yes / partially / no, with the sharpest reason.]

## Page-by-page walkthrough

[For each page of the brand book or website: what spoke to me, what missed, what's missing.]

## What works

1. [Item, ranked]
2. ...

## What's missing or wrong

1. [Item, ranked, with the fix]
2. ...

## Would I engage?

[Yes / not yet / no, with the trigger.]
```

---

## 7.4 — Specialist review (optional)

If the budget supports it, dispatch additional specialist lenses. The Autopilot website was reviewed by a 14-role specialist panel:

Brand Strategist · UX Designer · Frontend Engineer · CRO · Art Director · Copywriter · SEO · Accessibility · Performance · Security · Analytics · Legal/Compliance · Localisation · Director (synthesis).

For a brand identity (not a website), 4–6 specialists is enough:

- Brand Strategist
- Art Director
- Typography Specialist
- Print Production
- (Optional) Accessibility / Legal / Localisation

Each writes a specialist review at `07-Review/specialist/[role].md`. The director writes a synthesis at `07-Review/specialist/00-director-synthesis.md`.

For a brand identity that's pre-website, you can skip specialist review and rely on council + personas. Add specialist review later when the website goes live.

---

## 7.5 — The lock notice

Once council and personas verdict positively, **lock**. The lock is durable. Editing the locked logo without re-council is forbidden.

The lock notice goes in three places:

1. **The brand book** — a small "Locked v[N] · [Date] · Next review [Date]" notice at the bottom of the cover section.
2. **CLAUDE.md** (or the project's equivalent) — a memory entry that future agents/sessions read:
   ```markdown
   ## Brand identity status
   - Logo v7 council-ratified on 2026-05-06. Wordmark + monogram + favicon + period device are locked.
   - Next review window: 2027-05-06 (12 months).
   - Do not propose logo/wordmark changes until the review window opens.
   - Broader brand system (motion, content rules, applications) remains in development.
   ```
3. **The repo README or brand-config.json** — a `"locked": true` flag or a `LOCKED.md` file in `03-Visual/`.

### What lock means

- **Locked:** logo, wordmark, monogram, favicon, period device, primary palette, type pairing.
- **Not locked (allowed to evolve):** brand book copy, additional applications (signature, letterhead, deck cover variants), data viz extensions, motion specs, content rules.

The locked items have a 12-month review window by default. The not-locked items can evolve continuously.

### What re-opens the lock

- The review window opens (12 months by default).
- A material change in the company (rebrand-triggering event: acquisition, pivot, name change, new category).
- A council-initiated re-review (e.g., a competitor adopts a confusingly similar mark).

Founder ennui ("I'm bored of it") does NOT re-open the lock. The lock is what protects the brand from founder ennui.

---

## 7.6 — Common pitfalls in Phase 7

### "Let's just ratify it ourselves"

The council pattern only works if the seats are genuinely independent. If you, the user, and the brand designer all sit on the council, you're not pressure-testing; you're confirming. Run the council with the `/llm-council` skill or with external reviewers.

### "Option B is too weak"

If Option B (the counter-proposal) is obviously worse than Option A, the council will rubber-stamp Option A. That's not a real test. Make Option B credible — usually the best non-chosen direction from v5 or v6, polished to the same level as Option A. The council's job is to choose between two real options, not to confirm an obvious winner.

### "We'll get the personas later"

You won't. Persona review at this phase costs maybe 1–2 hours per persona; persona review at month six costs a full re-litigation of the locked logo. Run them now.

### "The brand book isn't ready yet"

The brand book doesn't have to be perfect to be reviewed. It has to be **complete enough** that all 16 required sections exist with their core content. Polish lives on the other side of council ratification.

### "Skip the review window"

Setting a review window protects future you from being asked to re-design every quarter. Without a window, every quarter is open season. With a window, the answer to "can we change the logo?" is "yes, in [N] months."

---

## 7.7 — Phase 7 exit checklist

- [ ] Council ran with all 5 seats (Contrarian, First-Principles, Expansionist, Outsider, Chairman)
- [ ] Council verdict: unanimous LOCK Option A, or escalate
- [ ] Council transcript saved at `07-Review/council/council-transcript-[date]-logo.html`
- [ ] Persona reviews complete: one per persona, written in first-person
- [ ] Persona reviews show 80%+ "yes / partially yes" verdicts (otherwise iterate)
- [ ] Lock notice added to brand book cover
- [ ] CLAUDE.md or project memory updated with lock date + review window
- [ ] `brand-config.json` has `"locked": true` flag (or equivalent)
- [ ] **Next review window date documented** (12 months default)

Brand identity is now production-ready and locked. Handoff to website / collateral teams.

---

## 7.8 — After the lock

The locked brand is the foundation. The work that continues:

- **Brand system extensions** — motion specs, sound design, content guidelines, accessibility statements, ESG application, regional adaptations
- **Application templates** — additional templates beyond the core three (slide decks, PDF reports, infographics, video bumpers)
- **Brand-in-context audits** — quarterly review of how the brand is being used across channels, do/don't compliance, drift detection

These can move without re-council. Major changes (logo edits, palette shifts, type pairing changes) require re-council and re-lock.

The brand exists. Now defend it.
