# Phase 2 — Voice

Voice is the discipline that makes copy recognisable as the brand even when the logo isn't visible. Headlines, taglines, error messages, email subject lines, slide titles — all of it carries voice.

**Outputs:**
- `02-Voice/voice-spec.md` — principles, exclusions, rhythm, locale, signature device, examples

**Phase exit gate:** the voice spec passes a "rewrite test" — pick three sentences from a competitor's website, rewrite them in the new voice, and the user recognises them as theirs. If you can't pass this test, the spec isn't done.

---

## 2.1 — The voice spec

A voice spec has six sections. Keep them tight. The spec lives in one file, ideally under 300 lines.

### 1. Voice principles (3–6 statements)

Each principle is a one-line declaration of *what the voice does*. Not aspirational adjectives — operational rules.

Bad principles:
- *"Confident."*
- *"Professional."*
- *"Authoritative."*

These are adjectives. They tell you nothing about how to write a sentence.

Good principles (Autopilot example):
- *"Conclude, don't qualify."* (Tells you to delete hedging words.)
- *"One sentence, not three."* (Tells you to merge or cut.)
- *"Evidence then opinion."* (Tells you to structure paragraphs evidence-first.)
- *"International English (-ise spellings, Singapore standard)."* (Tells you the locale.)

Test: read each principle and ask, "Can I follow this rule when editing a sentence?" If the answer is yes, it's a principle. If the answer is "I think so?" — it's an adjective.

### 2. Exclusions

What the voice **never does**. This is more important than the principles. Most voice failures are not "we didn't sound bold enough" — they're "we let a banned pattern slip in."

Autopilot exclusions:
- No em-dashes (`—`, `&mdash;`, `&#8212;`). Use periods, full stops, or restructure.
- No marketing slop ("transformative," "synergy," "best-in-class").
- No exclamation marks except in error states.
- No emojis in body copy.
- No "we are passionate about X."

Each exclusion should have a *reason* in the spec, even if just one line. The reason is what survives when someone challenges the rule.

### 3. Rhythm

How sentences and paragraphs should flow. Specify:

- **Sentence length** — average and range. "10–14 words on service pages. 6–10 words on CTAs. Up to 25 words allowed once per paragraph."
- **Paragraph length** — number of sentences. "Service pages: 2–4 sentences per paragraph. Blog longform: up to 6."
- **Variation rule** — when to break the rhythm. "If three sentences in a row are the same length, the fourth should be much shorter or much longer."

### 4. Locale

- Spelling: International English (`-ise`, `colour`), American (`-ize`, `color`), British (`-ise`, `-our`), or mixed.
- Date format: `2026-05-12`, `12 May 2026`, `May 12, 2026`, or `12/05/2026`.
- Number format: `1,000.50` or `1.000,50` or `1 000,50`.
- Currency: where the symbol goes, when to include the currency code.
- Time format: 24-hour or 12-hour, AM/PM capitalisation.

A locale slip (`organize` on a `-ise` site) is a brand violation. Document it once, enforce site-wide.

### 5. Signature device(s)

The one or two patterns that are unmistakably the brand. Autopilot's signature device is the **period as declaration**:

- Logo: red period after "Autopilot"
- H1: ends with a red `<span class="period">.</span>`
- Section H2: same
- CTA banner: same
- Four-word mantra: "Diagnose. Design. Deliver. Sustain."

The signature device is **rationed**. If every heading on every page has the red period, the device loses force. Autopilot's rule: H1 of page, H2 of section header, CTA banner. Not on card H3s, not on phase labels, not in the footer.

Document where the device fires and where it doesn't. The exclusion list is as important as the inclusion list.

### 6. Worked examples — before/after

10–20 paired examples of the same sentence rewritten in the voice. This is the most useful part of the spec for a copywriter or a developer writing UI strings.

Format:
```markdown
### Headline

BEFORE: "Transforming businesses through innovative solutions"
AFTER:  "Operating change that lands."

Why: "Transforming," "innovative," "solutions" are all banned. Active not gerund. Specific not abstract. Period closes the declaration.
```

The "Why" line is what makes the spec defensible against future edits.

---

## 2.2 — Voice ↔ persona test

For each persona from Phase 1, write 2–3 sentences in the voice that you believe would convert that persona. Read it aloud. Ask:

- Would this persona's eye stop on it?
- Would they screenshot it?
- Would they say it to themselves?

Autopilot example (Somchai persona, Thai construction-materials owner who tried general managers twice):

> *"You have hired general managers who failed inside a year. Not because the people were wrong. Because there was no documented business for them to operate within. These are not character flaws. They are structural symptoms. Structural symptoms have structural solutions."*

That paragraph is voice in action: declarative, structural, lands the reframe, no hedging, no em-dashes, periods do the work.

If you can't write a paragraph like that for each persona, the voice spec isn't ready.

---

## 2.3 — Common voice pitfalls

### Pitfall 1: adjective principles

"Confident, warm, intelligent." These are mood-board words, not voice rules. They cannot be followed. Rewrite as operational principles or delete.

### Pitfall 2: no exclusions

A voice spec without an exclusion list will drift. Within six months, em-dashes and "synergy" will appear in copy. The exclusion list is what the brand defends against.

### Pitfall 3: "professional but approachable"

This is two contradictory directives sitting next to each other. Pick one. If the brand really is dual-register (different tone for B2B sales pages vs error messages), document **both registers explicitly** with examples of when each fires.

### Pitfall 4: copying competitor voice

The voice spec must be defensible against the persona, not against what the competition does. "We sound like McKinsey" is not a voice — McKinsey doesn't sound like one thing.

### Pitfall 5: voice that ignores the medium

A voice spec must work in tweets, error messages, slide titles, email subject lines, SEO meta descriptions, and legal disclaimers. Test the spec against each. If "Conclude, don't qualify" can't survive a privacy policy, you need a section on legal/compliance register exemptions.

---

## 2.4 — Voice spec template

```markdown
# Voice Spec — [Company]

## Principles

1. [Principle 1 — operational, one line]
2. [Principle 2]
3. ...

## Exclusions

- [Banned pattern 1] — Reason: [one line]
- [Banned pattern 2] — Reason: ...

## Rhythm

- Sentence length: [average, range, max]
- Paragraph length: [sentences per paragraph]
- Variation rule: [when to break]

## Locale

- Spelling: [International / American / British / Mixed]
- Dates: [format]
- Numbers: [format]
- Currency: [format]
- Time: [12h / 24h]

## Signature device(s)

[Describe the device, where it fires, where it doesn't.]

## Examples

[10–20 before/after pairs.]

## Persona resonance test

[For each persona, 2–3 sentences in the voice that target that persona's situation.]
```

---

## 2.5 — Voice deliverable to Phase 3

When Phase 2 is done, you should hand Phase 3 (Visual System) two things:

1. **The voice spec file** (`02-Voice/voice-spec.md`).
2. **A one-sentence visual brief** derived from the voice. Examples:
   - *"Editorial register, not tech-startup. Wide leading, restrained colour, weight contrast. Periods as a visual device."*
   - *"Industrial register, blue-collar credible. Sans-serif, tight tracking, high-contrast caps, monochrome with one accent."*
   - *"Premium clinical, hospital-adjacent. Generous whitespace, single-weight type, two-colour minimum."*

That one-sentence brief is what guides colour and type decisions in Phase 3. If the voice spec is correct, the visual brief writes itself.

---

## 2.6 — Phase 2 exit checklist

- [ ] Voice spec written, all six sections present
- [ ] Principles are operational (not adjectives)
- [ ] Exclusions list with reasons
- [ ] Locale settled and documented
- [ ] Signature device(s) identified with inclusion/exclusion rules
- [ ] 10–20 worked before/after examples
- [ ] Voice passes the persona-resonance test for every persona from Phase 1
- [ ] One-sentence visual brief for Phase 3 written
- [ ] **User has signed off on voice spec in writing**

If the rewrite test fails (user doesn't recognise their voice in your rewrites), iterate. Voice spec lives or dies on the rewrite test.
