# Phase 3 — Visual system

Colour, typography, logo. Iterate logo concepts v1 → vN until the **range collapses to one direction**. Don't lock — that happens in Phase 7.

**Outputs:**
- `03-Visual/colour-system.md` — palette with rationale, hex/Pantone/CMYK, application rules
- `03-Visual/type-pairing.md` — heading face, body face, weight ladder, fallback stacks
- `03-Visual/logo-research.md` — competitor + category audit, references
- `03-Visual/concepts/logo-concepts-v1.html` ... `vN.html` — iteration history

**Phase exit gate:** one logo direction with all variants drafted. Council ratification is Phase 7.

---

## 3.1 — Colour system

### Palette structure

Default to a **4–6 colour palette**. More than that and the brand becomes a paint chart.

| Role | Count | Use |
|---|---|---|
| **Primary** | 1 | Dominant brand colour. Backgrounds, headings, structure. |
| **Accent** | 1 | The "device" colour. Used sparingly. CTAs, periods, marks. |
| **Off-white / cream** | 1 | Background warmth. Off-white reads more premium than pure white. |
| **Pure white** | 1 | Surfaces, contrast plates. |
| **Neutral grey** | 1–2 | Body text, borders, secondary text. One mid, one light. |

Autopilot example: Deep Navy `#1B2A4A` (primary), Signal Red `#D03C3C` (accent), Warm Off-White `#F5F5F0`, White `#FFFFFF`, plus a 5-tone grey scale.

### Application rule

A palette without an application rule will be misused. Pick a ratio.

**60-30-10 rule** (the safe default):
- 60% primary
- 30% neutrals (off-white + white)
- 10% accent

The accent is **bounded**. Large blocks of accent break the rule. Document this in the brand book. Autopilot's CLAUDE.md captures it as: *"Red never used for body text — period, accents, CTAs only."*

### Pantone + CMYK

Even for digital-first brands, capture print-equivalents at Phase 3, not at handoff. Two reasons:

1. Print equivalents force you to test if the colour survives in CMYK. Some screen colours don't (vivid teals, magentas, neons). Discovering this at print time is too late.
2. The Pantone book is the universal print reference. Vendors will ask. Have an answer.

Format:
```markdown
| Name | Hex | RGB | CMYK | Pantone |
|---|---|---|---|---|
| Deep Navy | #1B2A4A | 27, 42, 74 | C100 M72 Y24 K70 | PMS 289 C |
| Signal Red | #D03C3C | 208, 60, 60 | C0 M91 Y87 K10 | PMS 1795 C |
```

### Accessibility contrast

Test every colour pair you'll actually use against WCAG AA:
- Body text on background: ≥ 4.5:1
- Large text (≥18pt or 14pt bold) on background: ≥ 3.0:1
- UI components / graphical objects: ≥ 3.0:1

Use the WebAIM contrast checker. Document the passing pairs in `03-Visual/colour-system.md` so a future copywriter doesn't put navy text on a navy box.

### Data-visualisation palette

Most brand exercises forget this. Charts and dashboards need a colour ramp that:
- Isn't just "primary + accent" (binary charts only)
- Has 6–10 distinct categorical colours that pass colour-blindness checks
- Has a sequential (single-hue gradient) variant for heatmaps

Pick or generate one in Phase 3. The Autopilot brand book has an 8-colour categorical palette + a navy-to-red diverging palette for two-series charts.

---

## 3.2 — Typography

### Type pairing

Two faces is the floor. Three is the ceiling. More is uncoordinated.

**Common patterns:**
- Editorial: serif headings + sans body (Playfair Display + Inter — Autopilot's choice)
- Modern: geometric sans heading + neo-grotesque body (Aeonik + Inter)
- Industrial: monospace heading + sans body (JetBrains Mono + IBM Plex Sans)
- Premium: classic serif everywhere (Domaine, Tiempos, Recoleta, GT Sectra)

### Weight ladder

For each face, document the weights you'll actually ship:

```
Playfair Display:
  - 700 (Bold) — headings only
  - 600 — disabled, not used
  - 400 — disabled, not used

Inter:
  - 400 (Regular) — body
  - 500 (Medium) — emphasis, sub-headings
  - 300 (Light) — large captions only, banned below 16px
```

Banning weights you won't use prevents drift.

### Size scale

Use a modular scale. The Tailwind type scale (12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96, 128) is a safe default. Pick 5–7 sizes from it. Don't create custom values.

### Fallback stacks

Document the full stack including system fallbacks. This protects against font-load failures.

```css
--font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

### Line-height + tracking

For each face × size, lock line-height (leading) and letter-spacing (tracking). Headlines run tight. Body runs open.

| Element | Font | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| H1 | Playfair Display | 72px | 700 | 1.05 | -0.02em |
| H2 | Playfair Display | 48px | 700 | 1.1 | -0.01em |
| Body | Inter | 16px | 400 | 1.6 | 0 |
| Caption | Inter | 14px | 400 | 1.5 | 0.01em |

---

## 3.3 — Logo iteration

This is where most brands spend the most time. Plan for 7 versions. Don't be discouraged if you hit 10.

### Version progression

| Version | What it contains | What you're testing |
|---|---|---|
| **v1** | 5–7 wildly different directions | Range. Are we doing wordmark, monogram, abstract mark, or combination? |
| **v2** | 3–4 directions, each more refined | Eliminate the worst. Refine the survivors. |
| **v3** | 2–3 directions | Narrow further. Each direction should now have 2–3 variants. |
| **v4** | 1–2 directions, full variant sets | Decide. Run the survivors at favicon size, billboard size, mono, colour. |
| **v5** | 1 direction, full variant family | Polish. Spacing, weights, period placement, letter overrides. |
| **v6** | 1 direction, every production variant | Add: with/without tagline, with/without strapline, mono, full colour, light/dark backgrounds. |
| **v7** | Locked candidate | Ready for council ratification (Phase 7). |

### Concepts file format

Each version is a single HTML file: `logo-concepts-vN.html`. Self-contained. Inline CSS. Inline SVGs. Opens in a browser without dependencies.

Structure:
```html
<!doctype html>
<html>
<head><title>Logo Concepts vN — [Company]</title>
<style>
  body { background: #F5F5F0; font-family: Inter, system-ui, sans-serif; padding: 60px; }
  .concept { padding: 60px; background: #FFF; margin-bottom: 40px; border: 1px solid #E5E5E5; }
  .concept-label { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 24px; }
  .concept svg { display: block; }
  .note { margin-top: 24px; font-size: 14px; line-height: 1.6; color: #444; max-width: 600px; }
</style>
</head>
<body>
  <h1>Logo Concepts v3</h1>

  <section class="concept">
    <div class="concept-label">Direction A — Pure typographic</div>
    <svg viewBox="0 0 450 68">[wordmark SVG]</svg>
    <div class="note">Wordmark only, Playfair Display Bold. Period as device (red, baseline-aligned, 130% of natural glyph). Tests: trust + editorial.</div>
  </section>

  <section class="concept">
    <div class="concept-label">Direction B — Monogram + wordmark lockup</div>
    [...]
  </section>

  [...]
</body>
</html>
```

Each concept gets a label, the SVG, and a short note about what it's testing. The note is what the future you (or the council) reads to remember why this direction existed.

### Eliminate aggressively

After v1, kill at least one direction per version. By v4, you should have one direction. If you're still at three by v4, the brief isn't tight enough — go back to Phase 1 personas + Phase 2 voice and find the missing constraint.

Common reasons to kill a direction:
- **Doesn't survive at 16px (favicon).** A logo that needs detail to read is dead at favicon size.
- **Doesn't survive in single-colour mono.** Will the logo work on a fax, in newspaper print, in laser-engraved metal?
- **Doesn't survive at 1500px (billboard / event banner).** Some marks look great at app-icon size and ugly at hero size.
- **Reads as a different category.** A logo that looks like a fintech when the brand is a B2B services firm.
- **Echoes a competitor.** Side-by-side with two existing brands in the same category, the new mark is the third in a family — bad. (Even more so if one of the lookalikes is the category leader.)

### Logo construction notes — keep them

For each variant, document the construction:

```markdown
### Wordmark — primary

- Font: Playfair Display Bold
- Letter sizing: 56px
- Letter spacing: custom tspans (A 0, u -2, t -0.5, o -0.5, p -0.8, i -0.3, l -0.3, o -0.5, t -0.8)
- Period: SVG <circle>, cx=437, cy=48, r=5.5, fill=#D03C3C
- ViewBox: 0 0 450 68
- Period radius: 130% of natural glyph period
- Period gap (from t): 4px
```

These notes are what the outliner script (`scaffold/outline-logos.js`) reads to regenerate the outlined SVG. The construction is the source of truth, not the rendered SVG.

### Dual-track from the start

For every wordmark direction in v4+, build **both** the text-based SVG and the outlined SVG. If the outlined version doesn't match (kerning drifts, period misaligns), the wordmark isn't producible. Catch this in v4, not v7.

See `references/05-asset-pipeline.md` for the dual-track mechanics.

---

## 3.4 — Things that almost always go wrong

### "We're using Helvetica"

Helvetica is fine but it's also what 50% of competitors use. If the voice spec says "premium" or "editorial," Helvetica is wrong. Pick a more specific face. If the voice says "industrial neutral," Helvetica is right but say so.

### "Make the logo blue and green"

Two-colour logos other than (primary + accent) usually fail. Most cases reduce to (primary + neutral) or (primary + accent), with the second colour serving a structural purpose. Don't add a third colour to "warm it up."

### "Can we add a gradient?"

Gradients age fast and break in CMYK. Default to flat. Allow gradients only if the brand explicitly trades on motion / dimension and the voice supports it.

### "It needs more personality"

Often means "the founder doesn't love it yet." Pause. Run the council early instead of cycling another version. Forcing more iterations without a verdict produces drift, not progress.

### Picking the second-best to please everyone

A logo chosen by committee compromise will be second-best on every axis. Better to lock the best of the surviving directions and council-ratify it. Compromise designs lose to clarity every time.

---

## 3.5 — Phase 3 exit checklist

- [ ] Colour system: palette + Pantone + CMYK + contrast pairs + application rule + dataviz extension
- [ ] Typography: 2–3 faces, weight ladder, size scale, line-height + tracking table, fallback stacks
- [ ] Logo: iteration history v1 → vN preserved in `03-Visual/concepts/`
- [ ] One direction survives with full variant family (mono, colour, with/without device, sizes 16px → 1500px)
- [ ] Both text-based and outlined SVGs produced for every variant
- [ ] Logo construction notes documented (for outliner script + future re-derivation)
- [ ] Pre-council confidence check: every visual choice can be defended in terms of personas + voice

Phase 4 (Brand Book) takes these outputs and assembles them into a single HTML brand book.
