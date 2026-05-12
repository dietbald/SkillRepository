# Phase 1 — Discovery

Personas, positioning, audience map. This is the foundation everything else stands on. Don't skip; don't half-do.

**Outputs:**
- `01-Discovery/personas.md` — 3–5 personas with full profiles
- `01-Discovery/positioning.md` — positioning statement + manifesto seed
- `01-Discovery/audience-map.md` — segments, geographies, decision-trigger inventory

**Phase exit gate:** the user signs off on personas and positioning in writing. No moving to Phase 2 (Voice) without this.

---

## 1.1 — Personas

### Number of personas

3 is the floor. 5 is the ceiling. Below 3 the brand can't differentiate audiences; above 5 it loses focus.

**Rule:** if the company has multiple service lines or product segments, **one persona per service/segment**. Autopilot has 4 service lines → 4 personas. A SaaS with three plans might have 3 personas.

### What each persona contains

Use this template. Don't omit fields — the missing field is usually the one that bites you in Phase 3 (visual register) or Phase 7 (review).

```markdown
## Persona N: [Full Name] — [The One-Phrase Archetype]

> **Service line / segment**: [which offering]

### Demographics

| Field | Detail |
|-------|--------|
| Name | [Plausible local name — not "John Smith"; reflect the geography] |
| Age | [specific number] |
| Title | [Owner / CEO / Director / etc.] |
| Location | [City, Country — be specific] |
| Business | [What they do, one line] |
| Revenue | [Specific number with currency] |
| Staff | [Number, broken down by function if relevant] |
| Business age | [Years] |
| Family | [Marital status, kids — context for decisions] |
| Education | [Degree, school — credibility signal] |

### The business
[3–5 sentences. What it actually does, how big, who the clients are, what the market looks like.]

### A day in their life
[6–10 timestamped bullets, dawn to night. Make them concrete — actual decisions, specific frustrations, real meetings. This is the section that converts the persona from cardboard to recognisable.]

### Pain points
[Bullet list. 4–8 items. Each one is something they could not solve themselves.]

### What they have tried
[Bullet list of attempts that failed. Costs, durations, why each failed.]

### What they want
[Bullet list. Not aspirational fluff. Concrete outcomes.]

### Objections
[Bullet list of phrases they would actually say out loud. These are the lines your CTAs and FAQ must answer.]

### How they find you
1. Most likely channel
2. Second
3. Third

### Messaging that resonates
[5–7 exact phrases that, if read by this persona, would convert. Quote them.]

### Conversion trigger
[3–5 events that flip this persona from "interested" to "contacting." Be specific.]
```

### Persona quality checklist

A persona is good when:

- A second reader meeting one of these people in real life would recognise them.
- The "day in their life" section names specific people, specific times, specific decisions.
- The "objections" are phrases the persona would actually say, not phrases a marketer would write.
- The "messaging that resonates" lines could be lifted into website copy with minimal editing.

A persona is **not good** when:

- It says "Sarah is a busy professional who values quality." (Sarah does not exist. Quality is meaningless. Busy is universal.)
- It has no numbers. Real businesses have revenue figures. Real people have ages.
- It has no objections. Everyone has objections.
- It collapses into "the customer." If you only have one persona and it's "the customer," you have zero personas.

### Persona ↔ brand fingerprint

Every later decision should be defensible in terms of personas:

- **Colour choice:** "Why navy?" → "Persona 3 is a 63-year-old Indonesian engineer evaluating a transition. Navy reads as serious, considered, and bank-adjacent for him."
- **Typography:** "Why Playfair Display?" → "Persona 1 (Maria, Filipino civil engineer + MBA) reads editorial publications. Playfair signals editorial, not tech-startup."
- **Voice register:** "Why declarative not conversational?" → "Persona 4 (US MEP contractor) is blunt, opportunity-cost-focused, time-poor. Conversational reads as wasting his time."

If you can't answer those questions, the personas aren't doing their job. Go back.

### Autopilot worked example

See `02-Website/research/personas.md` in the Autopilot repo. 4 personas (Somchai/Thai/Systematise, Maria/Filipino/Franchise, Budi/Indonesian/Acquire, Bob/US/Outsource). Each persona ~100 lines. The "Bob is the Western buyer of SEA offshore teams" inversion is intentional — three SEA SME owners + one Western buyer.

---

## 1.2 — Positioning

### The positioning statement

One sentence. Maximum three. This is the **load-bearing sentence** for the entire brand.

Template:
> *"For [target audience] who [need / problem], [company] is the [category] that [unique value], unlike [alternatives] which [shortcomings]."*

Autopilot example:
> *"For C-suite leaders and boards who need to move from strategy to execution, Autopilot is the business architecture consultancy that delivers structured, evidence-based transformation — not slide decks and frameworks, but operating change that lands."*

### Positioning quality checklist

- **Audience is named.** "C-suite leaders and boards" beats "businesses."
- **Need is specific.** "Move from strategy to execution" beats "grow."
- **Category is owned.** "Business architecture consultancy" — Autopilot defined this category instead of competing in "management consulting."
- **Value is concrete.** "Operating change that lands" beats "transformative impact."
- **Alternatives are acknowledged.** "Not slide decks and frameworks" — names what the competition delivers.

### The manifesto seed

A positioning statement is operational. A manifesto is emotional. Write both.

The manifesto is the sentence (or short paragraph) that you'd put on the brand-book cover. Autopilot's:

> *"The period is not decoration. It is a declaration."*
>
> *"Every engagement has a conclusion. Every strategy has a destination. Every answer has a full stop."*

Notice:
- One sentence carries a punctuation choice forward into a brand device.
- It's not about the company. It's about a worldview.
- It can be quoted verbatim by anyone in the firm.

If you can't find a manifesto seed in Phase 1, it'll surface in Phase 2 (Voice). Don't force it.

### Don't confuse positioning with tagline

- **Positioning** is internal and exhaustive. ~30 words.
- **Manifesto** is the emotional carrier. ~10 words.
- **Tagline** is the public surface. ~5 words. May not exist at all in Phase 1.

Autopilot's tagline ("Your business should run without you") emerged in Phase 3 / 4 — after voice was settled. Don't try to lock it in Phase 1.

---

## 1.3 — Audience map

A document that lists every audience touchpoint, channel, and decision-trigger. Used in Phase 3 (visual register decisions) and Phase 6 (template targeting).

Minimum sections:

```markdown
# Audience Map

## Segments
- [Segment 1]: [size, profile, share of revenue, share of attention]
- [Segment 2]: ...

## Geographies
- Primary: [country/region, with rationale]
- Secondary: [country/region]
- Excluded: [country/region — and WHY]

## Channels — where they find you
- Search: [keywords, search intent, expected SERP behaviour]
- Referral: [from whom, in what context]
- Direct: [if the brand is established]
- Social: [if relevant — many B2B brands DON'T need this]

## Decision triggers
- [Event 1]: e.g., "Bank offers expansion financing they can't draw down"
- [Event 2]: e.g., "Senior estimator retires"
- [Event 3]: ...

## Disqualifications — who you don't serve
- [Profile]: e.g., "Sole traders / micro-businesses"
- [Profile]: e.g., "Pre-revenue startups"
- Rationale per disqualification.
```

### Why disqualifications matter

A brand that serves "everyone" serves nobody. The "who we don't work with" list is part of the brand. Premium tier-1 consultancies (McKinsey, Bain, Deloitte) implicitly disqualify 99% of potential clients through pricing and engagement criteria. Make the implicit explicit in the audience map.

---

## Phase 1 exit checklist

Before moving to Phase 2:

- [ ] 3–5 personas written in full, using the template above
- [ ] Each persona has demographics, day-in-life, pain points, objections, messaging, triggers
- [ ] Positioning statement: one sentence, audience + need + category + value + alternative
- [ ] Manifesto seed (optional but encouraged)
- [ ] Audience map: segments, geographies, channels, triggers, disqualifications
- [ ] **User has signed off on personas and positioning in writing.** Verbal nod is not signoff.

If any item is incomplete, the visual work in Phase 3 will be unmoored. Stop and finish.

---

## When the user resists

Common resistance pattern: *"Can we just skip this and start on the logo? We already know who we are."*

The response: *"What you already know is exactly what we need to write down. Once it's on the page, we can defend every visual choice against it. If we skip this and the council asks 'why this colour?' in Phase 7, the answer 'because the founder likes it' loses the council. We need a written persona for the colour to defend against."*

If they still refuse, push them to at least write the positioning statement and a one-paragraph audience description. That's the minimum for the rest of the process to function.
