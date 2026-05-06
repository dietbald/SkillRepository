# 5-Axis Critique Rubric

Score every review on all five axes, 0–10. Each score needs a one-sentence justification grounded in something visible in the artefact.

---

## Axis 1 — Philosophy Alignment (哲学一致性)

**Question**: Does every detail embody the chosen philosophy's core principles, or is this surface-level cosplay?

| Score | Anchor |
|-------|--------|
| 9–10  | Every detail has a philosophical reason. The design *is* the philosophy. |
| 7–8   | Strong directional alignment; 1–2 minor deviations from the philosophy's rules. |
| 5–6   | Visible intent but mixed with foreign style elements; lacks purity. |
| 3–4   | Surface imitation without understanding — uses the visual vocabulary, breaks the principles. |
| 1–2   | Essentially unrelated to the chosen philosophy. |

---

## Axis 2 — Visual Hierarchy (视觉层级)

**Question**: Does the viewer's eye flow where the designer intended? Is information friction zero?

| Score | Anchor |
|-------|--------|
| 9–10  | Eye flows naturally along intent; zero friction reading the page. |
| 7–8   | Clear primary/secondary relationships; 1–2 slight ambiguities. |
| 5–6   | Headlines distinguish from body; middle layers (subheads, captions, meta) are confused. |
| 3–4   | Flat layout; no clear visual entry point. |
| 1–2   | Chaotic; viewer doesn't know where to look first. |

---

## Axis 3 — Craft Quality (细节执行)

**Question**: Pixel-level — alignment, spacing, colour consistency. The stuff that separates "designed" from "made in Canva."

| Score | Anchor |
|-------|--------|
| 9–10  | Pixel-precise. No alignment, spacing, or colour flaws survive close inspection. |
| 7–8   | Overall polished; 1–2 minor spacing or alignment issues. |
| 5–6   | Basic alignment present; inconsistent spacing; colours feel ad-hoc. |
| 3–4   | Obvious alignment errors; chaotic spacing; too many colours used inconsistently. |
| 1–2   | Crude — reads as a sketch, not a finished design. |

---

## Axis 4 — Functionality (功能性)

**Question**: Does every element serve the goal, or is there decoration competing with the message?

| Score | Anchor |
|-------|--------|
| 9–10  | Every element earns its place. Zero redundancy. |
| 7–8   | Clear functional intent; minor decorative additions that don't hurt. |
| 5–6   | Usable but with distracting ornament. |
| 3–4   | Form dominates function; users struggle to find the information. |
| 1–2   | Decoration overwhelms message delivery. |

---

## Axis 5 — Originality (创新性)

**Question**: Within the chosen philosophy, does this find a distinctive expression — or is it template/cliché?

| Score | Anchor |
|-------|--------|
| 9–10  | Fresh expression within the philosophy. The reviewer pauses on something specific. |
| 7–8   | Personal point of view evident; avoids template feel. |
| 5–6   | Conventional. Reads as a competent application of the style, not a contribution to it. |
| 3–4   | Heavy cliché — gradient orbs for "AI", glassmorphism for "modern", terminal green for "hacker". |
| 1–2   | Pure template or stock-asset collage. |

---

## Output template

Use this exact shape. Do not add headers, do not omit sections.

```
# Design Review — {{artefact name or path}}

**Target philosophy**: {{chosen philosophy}} ({{one-line reason for the pick}})
**Context weighting**: {{web hero | content/PDF | UI | brand identity}} → {{which 2 axes weighted heavier}}

## Scores

| Axis | Score | One-line justification |
|------|-------|------------------------|
| Philosophy Alignment | X/10 | … |
| Visual Hierarchy     | X/10 | … |
| Craft Quality        | X/10 | … |
| Functionality        | X/10 | … |
| Originality          | X/10 | … |
| **Overall**          | **X.X/10** | {{one-sentence verdict}} |

## Keep
- {{Working aspect, named in design terminology, tied to a specific element.}}
- …

## Fix

**Critical** (breaks the philosophy or the user task)
- {{Element}} — {{problem}} — {{what to do instead}}
- …

**Important** (won't break the design, will block a higher score)
- …

**Optimisation** (polish — only after the above)
- …

## Quick Wins (next 30 minutes of edit work)
1. {{Highest-impact <30min edit}}
2. {{Next}}
3. {{Next}}
```

## Notes on scoring discipline

- An overall score is **not** the average. It's a weighted judgment given the context weighting stated at the top.
- A design can score 9 on Craft and 4 on Originality — say so. Don't smooth scores toward the middle.
- "Keep" with nothing genuinely working should be empty. Don't pad it.
- If the design is so far from any philosophy that picking one is dishonest, name that as the first Critical Fix: *"design has no committed philosophical direction"* — and review against the closest neighbour anyway, so the user gets actionable feedback.
