---
name: humanizer
version: 1.0.0
description: |
  Remove signs of AI-generated writing from prose. Use when editing, reviewing, or auditing text
  to make it sound human-written. Three modes: (1) humanize a single passage, (2) audit a
  multi-page corpus / website with per-page scores and a prioritised fix list, (3) voice-match
  against a writing sample. Detects em-dashes, copula avoidance, -ing depth-faking, tricolons,
  rule of three, negative parallelisms, vague attributions, AI vocabulary, knowledge-cutoff
  hedges, signposting, sycophancy, hyphenated-pair overuse, sterile rhythm, and accumulated
  parallel-construction tics. STRONG TRIGGERS: "humanize this", "remove AI tells", "does this
  sound like AI", "AI-text audit", "humanness review", "scrub this copy". Adapted from
  blader/humanizer (MIT) + Wikipedia's "Signs of AI writing" + R18 site audit additions.
license: MIT
attribution:
  - blader/humanizer (MIT) — https://github.com/blader/humanizer
  - Wikipedia:Signs of AI writing (CC BY-SA) — https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
  - R18 brand-audit additions — Autopilot.sg site audit, 2026-05
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Humanizer

Edit prose so it stops broadcasting "AI wrote this." Three modes, one shared pattern library.

## Pick the mode first

| The user gives you... | Use mode | Output |
|---|---|---|
| A passage of text (inline or in one file) | **Humanize** | Draft → "what's still AI?" → final |
| A site / corpus / multi-page artefact | **Audit** | Per-page scores, voice-spec table, top-N fix list |
| A passage **plus** a writing sample | **Voice-match** | Same as Humanize, calibrated to the sample |

When ambiguous, ask once.

---

## Mode A — Humanize (single passage)

The draft-then-audit loop is the load-bearing mechanism. Do **not** skip the second pass.

1. **Read the input.** Note context (technical doc, marketing copy, blog post, email, etc.). The intended tone changes what counts as "human."
2. **Identify AI patterns.** Scan against `references/patterns.md`. Mark every hit.
3. **Draft a rewrite.** Replace patterns with natural alternatives. Preserve meaning. Vary rhythm. Allow opinion, mess, specificity.
4. **Self-audit.** Prompt yourself: *"What makes the below so obviously AI generated?"* Answer in 3–6 bullets. Be honest — a clean-but-soulless rewrite is still a fail.
5. **Final pass.** Prompt yourself: *"Now make it not obviously AI generated."* Revise.
6. **Deliver** in this format:
   - Draft rewrite
   - "What makes the below so obviously AI generated?" (bullets)
   - Final rewrite
   - Summary of changes made (optional, if useful)

### Soul beats sterility

Removing AI patterns gets you to "clean." Clean is not human. Human is:

- **Opinions**, not neutral reporting.
- **Varied rhythm.** Short. Then a longer one that breathes. Then short again.
- **Acknowledged complexity.** Mixed feelings, real uncertainty, not "this is concerning."
- **First person** when it fits. "I keep coming back to..." beats "It can be observed that..."
- **Specificity.** "Drafters in Manila working overnight" beats "offshore engineering team enabling 24-hour productivity gains."
- **Some mess.** Tangents, asides, half-formed thoughts. Perfect structure feels algorithmic.

If your "final" version reads like a press release, it failed step 5. Go again.

---

## Mode B — Site / corpus audit

For multi-page work (a website, a blog series, a doc set, a deck). Output is structured so the user can prioritise edits.

1. **Inventory the pages.** List what you're auditing. If screenshots are available (`*/verification/*.jpg` style), use them; else read the source.
2. **Score each page 0–10** for humanness. The rubric is in `references/site-audit-format.md`.
3. **Per-page findings:** AI tells found (quote the actual copy), em-dash count, suggested rewrites with ORIGINAL → REWRITE pairs.
4. **Patterns across the corpus:** repeated tics that survive single-page review (e.g. "Not X. Y." used 30+ times, accumulated tricolons, methodology-label drift across pages).
5. **Voice-spec compliance table.** If the project has a style guide (CLAUDE.md, brand book, etc.), check declarative voice, locale (-ise vs -ize), em-dash policy, sentence length, etc.
6. **Top-N lines to fix first**, ranked by `off-brand-ness × visibility`.
7. **Overall verdict** in one paragraph.

Template + worked example: `references/site-audit-format.md`.

---

## Mode C — Voice-match

User provides a writing sample (their own previous work) and a passage to humanize.

1. **Read the sample first.** Profile it:
   - Sentence length pattern (short and punchy / long and flowing / mixed)
   - Word-choice register (casual / academic / between)
   - Paragraph openings (jump in / set context)
   - Punctuation habits (dashes, parentheticals, semicolons)
   - Recurring phrases or verbal tics
   - Transition style (explicit connectors / just start the next point)
2. **Humanize against that profile**, not the generic "natural voice." If they write short sentences, don't produce long ones. If they use "stuff" and "things," don't upgrade to "elements" and "components."
3. **Deliver as Mode A**, but call out the sample-matched choices in the changes summary.

Full procedure: `references/voice-calibration.md`.

---

## Reference files

- **`references/patterns.md`** — the 29-pattern catalogue (Wikipedia-derived) plus R18 brand-tic additions (accumulated parallel-construction, perfect octocolons, the same rhetorical move twice in one piece, methodology-label drift). Read this whenever you scan.
- **`references/site-audit-format.md`** — Mode B output template + the 0–10 humanness rubric + worked example from a real site audit.
- **`references/voice-calibration.md`** — Mode C procedure with a worked example.

---

## Quick rules that catch the most output

If you only remember a handful, remember these:

1. **Replace em-dashes** with commas, periods, or parentheses. Almost always cleaner.
2. **Prefer `is` / `are` / `has`** over `serves as`, `stands as`, `marks`, `represents`, `boasts`, `features`.
3. **Kill `-ing` depth-faking.** "highlighting", "emphasizing", "showcasing", "reflecting" tacked onto a sentence to add fake meaning.
4. **Specific people, places, numbers, sources.** Replace "Industry observers note..." with "A 2024 New York Times interview reported..."
5. **Break the rule of three** when you catch yourself building one. Real life isn't tricolon-shaped.
6. **No collaborative artifacts.** "Of course!", "Great question!", "I hope this helps!", "Let me know if..." — strip every one.
7. **No knowledge-cutoff hedges.** "While specific details are limited..." → either find the detail or drop the sentence.
8. **Vary sentence length deliberately.** If three sentences in a row are 10–14 words, the next one should be 4 or 22.
9. **First person, when it fits, sounds human.** Don't add a fake "I"; do allow a real one when the writer has a stake.
10. **The final pass is non-negotiable.** "What's still AI about this?" → then revise.

---

## Output format (Mode A default)

```
**Draft rewrite:**
[draft]

**What makes the below so obviously AI generated?**
- [tell 1]
- [tell 2]
- [tell 3]

**Final rewrite:**
[final]

**Changes made:** (optional)
- [change 1]
- [change 2]
```

For Mode B, follow `references/site-audit-format.md`.

---

## Source & license

Adapted from [blader/humanizer](https://github.com/blader/humanizer) (MIT), itself based on [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (maintained by WikiProject AI Cleanup, CC BY-SA). Brand-audit additions and the site-audit format come from the R18 humanizer audit of autopilot.sg (2026-05).

Key insight from Wikipedia, worth repeating: *"LLMs use statistical algorithms to guess what should come next. The result tends toward the most statistically likely result that applies to the widest variety of cases."* Human writing isn't the most statistically likely result. It's specific, off-balance, and committed.
