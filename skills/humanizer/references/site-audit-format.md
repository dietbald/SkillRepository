# Mode B — site / corpus audit format

Use when the user gives you a multi-page artefact (website, doc set, blog series, deck) and asks "does this read as AI" or "humanness review" or "scrub this corpus."

The output is structured so the user can prioritise edits across many pages, not just rewrite one passage.

---

## Step 1 — Inventory

List the pages you're auditing. If screenshots are available (e.g. `*/verification/compact/*.jpg`), prefer those — the rendered output is what matters, not the source. If only source is available, read it directly.

State the inventory at the top of the audit so the user knows what was covered:

```
Audited 10 pages: home, systematise, franchise, outsource, acquire, results, approach, about, contact, blog index + 3 sampled posts.
```

If pages were excluded (e.g. legal), say so.

---

## Step 2 — Score each page 0–10

### Rubric

| Score | Meaning |
|---|---|
| **10** | Genuinely human. Specific, opinionated, varied rhythm. Indistinguishable from a senior practitioner. |
| **9** | Strong. One or two minor tells but the voice carries. |
| **8** | Mostly human. A few patterns from `references/patterns.md` fire but the page works. |
| **7** | Clean-but-AI. No glaring tells in isolation, but the rhythm, vocabulary, or structure broadcasts "AI-drafted." |
| **6** | Visible AI tells. Tricolons stacked, copula avoidance, `-ing` depth-faking, or signposting visible in one read. |
| **5** | Obviously AI. Multiple patterns per paragraph. Reads as a draft that was never edited. |
| **≤4** | Raw GPT output. Rule of three, em-dashes, "It is important to note," "Let's dive in," all present. |

### What pushes a score down

- Multiple patterns from `references/patterns.md` in one paragraph.
- Brand-tic accumulation (patterns 30–34): perfect octocolons, repeated rhetorical move, methodology drift, book-citation roll-call.
- Em-dashes present on a site whose style guide bans them.
- Locale slippage (-ize on a -ise site, "color" on a "colour" site).
- Generic positive conclusions.
- Boldface-header inline lists.

### What pushes a score up

- Specific people, numbers, sources, dates.
- First-person sentences when the writer has a stake.
- One or two sentences that are *unmistakably* a practitioner ("That's expensive cheerleading", "We deliver the implementation", quotes from a real client).
- Rhythm variation — short and long sentences mixed, not metronomic.
- Acknowledged complexity, mixed feelings, edge.

---

## Step 3 — Per-page findings

For each page, structure as:

```markdown
### [Page name] — score X/10

[One-paragraph summary of what works and what doesn't on this page specifically.]

**AI tells found**:
- [Pattern N, with the exact line from the page quoted.]
- [Pattern N, with the exact line.]

**Em-dashes**: [count]

**Suggested rewrites**:
- ORIGINAL: "[exact copy from page]"
  REWRITE: "[your rewrite]" ([one-line rationale])
```

### Worked example

```markdown
### Franchise — score 7/10

Weakest service page. The tagline reads like a franchise-development sales deck.

**AI tells found**:
- (Pattern 4 — promotional language) "You built something that works. Let's make it work everywhere." — the "Let's" + "everywhere" combination is marketing-y. Drops the McKinsey register.
- (Pattern 5 — vague attribution) "Your business model is proven. One location, consistent results, customers asking 'Can I open one of these?'" — the manufactured customer quote is a stock copywriter device.
- (KEEP) "Other firms franchise your business. We make your business franchise-ready, then franchise it. The order matters." — this is the strongest line on the page. Brand voice working. Keep verbatim.

**Em-dashes**: 0.

**Suggested rewrites**:
- ORIGINAL: "You built something that works. Let's make it work everywhere."
  REWRITE: "One location works. Now replicate it." (Drops the marketing rhythm; matches the declarative voice of /systematise.)
- ORIGINAL: "Your business model is proven. One location, consistent results, customers asking 'Can I open one of these?'"
  REWRITE: "The model is proven in one location. Customers are asking when you will open the next." (Cuts the manufactured quote; same payload.)
```

Quote the *actual copy* from the page. Vague paraphrases ("the headline feels off") are useless to the user.

---

## Step 4 — Patterns across the corpus

This is the section single-page review can't produce. List patterns 30–34 hits with concrete frequency:

```markdown
## Patterns across the site

1. **The "Not X. Y." sentence rhythm.** Used 30+ times site-wide. On-brand and effective in moderation; in blog longform it becomes a tic. Aim for ≤3 instances per 1,000 words.

2. **Tricolons everywhere.** Every page has at least one. /about has six. The brand voice can absorb this because periods are a brand device, but watch for blog sections where every bolded subheading is parallel-constructed.

3. **Methodology label inconsistency.** Four-phase variant on home/about/approach. Five-phase variant on /outsource. Different five-phase variant on /franchise. Decide whether the brand has one methodology with service-specific phases, or service-specific methodologies, and align the labelling.

4. **Book citations as evidence stand-ins.** Across the blog, references to Gerber / Martell / Michalowicz / Warrillow do the work that proprietary case data should be doing. Use the case data more in the blog body.

5. **[Other corpus-wide pattern.]**
```

---

## Step 5 — Voice-spec compliance table

Only include this section if the project has a style guide (CLAUDE.md, brand book, voice spec). Skip otherwise.

```markdown
## Voice-spec compliance check

| Spec | Status | Notes |
|------|--------|-------|
| Declarative, terse | Pass | Average sentence ~10–14 words on service pages. |
| Evidence then opinion | Pass on service pages, partial on blog | Blog occasionally opens with opinion, then back-fills citation. Acceptable but inverts the spec. |
| International English (-ise) | Pass | No -ize slips. |
| Period as brand device on key headlines | Pass | Correctly rationed: H1, section H2, CTA banner. Not present on card H3s, phase H3s, footer. |
| Anonymous by design | Pass | No founder, no team, no bios. |
| No pricing | Pass | Result-based language only. |
| Zero em-dashes | Effectively pass | 2 found on /results testimonials. Recommend a source-side scrub. |
```

The table format makes pass/fail/partial visible at a glance. Use the project's actual style-guide spec for the rows.

---

## Step 6 — Top-N lines to fix first

Prioritise by `off-brand-ness × visibility`. The H1 of a heavily-trafficked page beats a soft tell in a footer.

```markdown
## Top 10 lines to fix first

1. /franchise H1: "You built something that works. Let's make it work everywhere." → "One location works. Now replicate it."
2. /franchise subhead: drop the manufactured customer quote.
3. /results testimonial: replace the em-dash attribution prefix (style-guide violation).
4. /results "100% Performance-tied fees tied to measurable outcomes" → "100% of fees tied to measurable outcomes" (duplicated word).
5. /about "guaranteed one-business-day response" → "We reply within one business day."
[...up to 10]
```

10 is the typical target. Adjust 5–15 depending on corpus size. Each line should be one fix the user can paste in.

---

## Step 7 — Executive summary at the top

Once the body is done, write a 3–4 paragraph executive summary at the **top** of the audit (before the inventory). It should cover:

1. **Overall verdict** in one sentence. ("The site reads, on the whole, like a senior practitioner wrote it.")
2. **Average humanness score** across all pages, plus the spread (e.g. "Average 8.2/10; service pages average 8.5, blog longform averages 7.7").
3. **The 2–3 patterns that surface across the corpus.** Most useful insight, because it's not visible from any single page.
4. **The worst single page** and the line that earned it.

The summary is what the user reads first to decide whether to keep reading. Make it specific and rankable.

---

## Step 8 — Overall verdict (close of audit)

One paragraph at the bottom. State the work to do in concrete terms ("Two hours of careful editing across the blog would push the average from 7.7 to 8.5+"), then state the final site-wide score.

---

## Full template (copy-paste skeleton)

```markdown
# Humanizer Audit — [site/corpus name]

## Executive Summary

[3–4 paragraphs as per Step 7.]

---

## Per-page findings

### [Page 1] — score X/10
[as per Step 3]

### [Page 2] — score X/10
[as per Step 3]

[...]

---

## Patterns across the site

[as per Step 4]

---

## Voice-spec compliance check

[as per Step 5, if applicable]

---

## Top N lines to fix first

[as per Step 6]

---

## Overall verdict

[one paragraph]

Site-wide humanness: **X/10**.
```

---

## Notes

- **Don't propose mass rewrites.** Patterns are signals, not commands. A consulting site with periods as a brand device legitimately uses tricolons; flag them only when they accumulate.
- **Quote the actual copy.** Specificity is what makes the audit usable. "The headline is too marketing-y" is not actionable; "You built something that works. Let's make it work everywhere." is.
- **Save the file when working in a repo.** A site audit usually lives at `*/reviews/humanizer-audit.md` or similar; check the project structure and place it where other reviews live.
- **Run a final pass on your own audit.** The humanizer skill applies to the audit itself. If your audit reads as AI-drafted, re-edit it.
