# Phase 4 — Brand book

Single-file HTML brand book, 19 sections. Scrollable, animated, section-nav dots on the right. PDF-exportable via Puppeteer.

**Outputs:**
- `04-BrandBook/brand-book.html` — the master file (will eventually be `logo-concepts-vN.html` from Phase 3, renamed)
- (later, after Phase 5) the exported PDF

**Phase exit gate:** the brand book HTML is complete and self-contained. PDF export from it produces a clean A4 document.

---

## 4.1 — Why HTML, not Figma or InDesign

The Autopilot brand book is a single 3,584-line HTML file. Reasons this beats a Figma file or an InDesign document:

- **One source.** The same file renders in browser (live preview), exports to PDF (Puppeteer), and feeds the asset pipeline (SVG construction notes are read by the outliner).
- **Diff-able.** Git tracks line-level changes. A council reviewer can see what changed between v6 and v7 in a diff.
- **Editable by anyone.** Designer, developer, copywriter, Claude — all can read and edit HTML.
- **No license fee.** No Adobe subscription. No Figma seat. The brand book opens in any browser.
- **The CSS is the spec.** The values that style the brand book ARE the brand tokens. No drift between "the document" and "the system."

Figma and InDesign produce parallel deliverables (Figma library for designers, InDesign for print collateral), but the source of truth is the HTML.

---

## 4.2 — The 19 sections

Section list, in order. Numbers shown are display-numbers in the brand book; the file has 19 distinct sections.

| # | Section | Required? | Purpose |
|---|---|---|---|
| 1 | **Cover** | Yes | Gradient background, animated wordmark, manifesto preview |
| 2 | *(skipped in display; reserved)* | — | — |
| 3 | **The Brand Idea (manifesto)** | Yes | The one-paragraph statement of worldview |
| 4 | **The Wordmark** | Yes | Logo with construction notes, clear space, do/don't |
| 5 | **Colour System** | Yes | Full-width swatches with hex/CMYK/Pantone |
| 6 | **In the Real World** | Yes | Mockups: business cards, email sig, proposal |
| 7 | **At Every Scale** | Yes | Favicon → wordmark → monogram across sizes |
| 8 | **The Voice** | Yes | Voice spec excerpts, examples |
| 9 | **Brand Governance** | Yes | Usage rules, clear-space minima, do/don't grid |
| 10 | **The Mark** | If a mark exists | Standalone monogram / icon / favicon system |
| 11 | **Production Reference** | Yes | Spec tables for print and digital export |
| 12 | **A1. Brand Positioning** | Yes | Mission, service-line alignment, persona map |
| 13 | **A2. Typography Scale** | Yes | Size ladder, line-height, tracking, weight rules |
| 14 | **A4. Accessibility & Contrast** | Yes | WCAG AA matrix, colour-pair tests |
| 15 | **Colour Application** | Yes | 60-30-10 enforcement, when to use accent |
| 16 | **A3. Photography Direction** | Optional | If brand uses photography; mood, composition, grading |
| 17 | **A5. Digital Formats** | Yes | Web rendering, Retina, SVG embedding patterns |
| 18 | **A6. Asset Index** | Yes | Logo file inventory, naming convention, file-size targets |
| 19 | **Data Visualisation Palette** | Optional | Categorical + sequential palette for charts |
| 20 | **Motion Standards** | Optional | Timing curves, entrance/exit rules, reduced-motion |

**Of the 19, all but 3 are required.** Photography, dataviz, and motion are optional and depend on whether the brand uses them. Don't pad with empty sections.

---

## 4.3 — Cover section

```html
<section class="cover">
  <div class="cover-company">[Company] Pte. Ltd.</div>
  <div class="cover-accent-line"></div>
  <div class="cover-wordmark">
    <svg viewBox="0 0 450 68">[wordmark SVG, white variant]</svg>
  </div>
  <div class="cover-subtitle">Brand Identity v[N]</div>
  <div class="cover-manifesto-preview">"[First line of manifesto.]"</div>
</section>
```

CSS:
- Full-viewport height
- Gradient background from primary colour
- Animated entry: company name fades in, accent line draws (width: 0 → 160px), wordmark scales in, subtitle fades up
- Animation timing: 800ms ease, 100ms stagger
- All animations frozen to final state during PDF export

---

## 4.4 — Section-nav dots

A vertical column of dots on the right edge of the viewport. Each dot links to a section. The active dot is filled.

```html
<nav class="section-nav">
  <a href="#cover" class="dot active"></a>
  <a href="#manifesto" class="dot"></a>
  <a href="#wordmark" class="dot"></a>
  [...]
</nav>
```

CSS:
- Position: fixed, right: 24px, vertical-centred
- Each dot: 8px circle, 4px gap, transparent fill, primary-colour border
- Active dot: solid primary fill
- IntersectionObserver in JS to update the active dot as you scroll

PDF export: `display: none` for the nav. See `scaffold/generate-pdf.js`.

---

## 4.5 — Animation pattern

Most sections animate in on scroll. The pattern is consistent:

```css
.animate-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms ease, transform 600ms ease;
}
.animate-in.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

JS (IntersectionObserver):
```js
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in-view');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-in').forEach(el => obs.observe(el));
```

Variants: `.animate-in-left`, `.animate-in-right`, `.animate-scale` (transform: scale(0.95) → 1).

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-in, .animate-in-left, .animate-in-right, .animate-scale {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

The PDF generator forces every animated element to its final state before exporting. See `scaffold/generate-pdf.js` lines 28–57.

---

## 4.6 — CSS variables

The brand book declares CSS variables at `:root` level. These are the brand tokens. They are read by:

1. The brand book itself.
2. The website (if Odoo / React / Vue, the tokens are mirrored as Tailwind theme or CSS custom props).
3. The outliner script (via `brand-config.json` — see `scaffold/brand-config.sample.json`).

```css
:root {
  --primary: #1B2A4A;
  --accent: #D03C3C;
  --off-white: #F5F5F0;
  --white: #FFFFFF;

  --gray-100: #FAFAF8;
  --gray-200: #EEEEE9;
  --gray-400: #B5B5AE;
  --gray-600: #6E6E68;
  --gray-800: #2C2C28;

  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  --period-radius: 5.5px;
  --period-color: var(--accent);
}
```

**These values must match `brand-config.json` exactly.** If they drift, the brand book and the outlined SVGs diverge.

---

## 4.7 — Print CSS (print-specific overrides)

The brand book is designed to render at **800px viewport width**. PDF export uses `scale: 0.88` to fit A4 with 10mm margins.

Print CSS handles three things:

1. **Page-break control.** Force breaks before major sections, prevent breaks inside blocks. See `scaffold/generate-pdf.js` lines 60–195 for the full rule set.
2. **Padding tightening.** Print padding is smaller than screen padding (60px not 100px) because A4 has its own margins.
3. **Animation freezing.** Every `.animate-in*` element forced to `opacity: 1; transform: none; transition: none`.
4. **Nav hiding.** `.section-nav { display: none !important; }`

```css
@media print {
  .cover, .manifesto {
    min-height: 100vh;
    page-break-after: always;
  }

  .positioning-section, .scale-section, .mark-section,
  .spec-section, .motion-section, .color-application {
    page-break-before: always;
  }

  .wm-hero, .construction, .color-bg-grid, .color-swatches-full,
  .biz-card-wrapper, .email-client, .letterhead, .scale-strip,
  .voice-principles, .clear-space-demo, .min-size-demo,
  .mark-grid, .spec-table, .positioning-statement,
  .type-ladder, .contrast-grid, .a11y-rule,
  .asset-table, .dataviz-palette, .motion-grid {
    page-break-inside: avoid;
  }

  .section-heading, .section-title-lg, .section-desc {
    page-break-after: avoid;
  }

  .section-nav { display: none !important; }
}
```

---

## 4.8 — Section-by-section guidance

### Section 3 — The Brand Idea (manifesto)

Full-viewport. Centred. Large editorial typography. One paragraph, two at most.

```html
<section class="manifesto">
  <p class="manifesto-line">[First line — the koan]</p>
  <p class="manifesto-body">[Two or three sentences expanding on the line.]</p>
</section>
```

Don't decorate. The manifesto carries on words alone.

### Section 4 — The Wordmark

Three things:
1. The wordmark itself, large, on the brand's standard background.
2. Construction notes (font, size, kerning, period geometry) in a side panel.
3. A clear-space diagram showing the minimum surrounding negative space.

```html
<section class="wordmark-section">
  <div class="wm-hero">
    <svg viewBox="0 0 450 68">[wordmark]</svg>
  </div>
  <div class="construction">
    <h3>Construction</h3>
    <dl>
      <dt>Typeface</dt><dd>Playfair Display Bold</dd>
      <dt>Cap height</dt><dd>56px</dd>
      <dt>Letter spacing</dt><dd>Custom kerning, see brand-config.json</dd>
      <dt>Period radius</dt><dd>5.5px (130% of natural glyph)</dd>
      <dt>Period offset from final letter</dt><dd>4px</dd>
    </dl>
  </div>
</section>
```

### Section 5 — Colour System

Full-width swatches. Each swatch shows the colour at scale, with the name, hex, RGB, CMYK, Pantone.

### Section 6 — In the Real World

Mockups embedded as HTML/CSS. Business card, email signature, proposal document cover. The mockups should be hand-built in HTML (not screenshots) — that way they update automatically if the brand tokens change.

### Section 9 — Brand Governance

The do/don't grid. Each rule shows the violation alongside the correct usage.

```html
<div class="do-dont-grid">
  <div class="rule">
    <div class="wrong"><span class="x">✕</span> Wordmark stretched</div>
    <div class="right"><span class="check">✓</span> Wordmark at proportional scale</div>
    <p>Never stretch or compress the wordmark.</p>
  </div>
</div>
```

5–8 rules. Each one a real risk, not a generic warning. *"Never put red text on red background"* is not useful. *"Period circle must never be a different colour from the wordmark accent"* is useful.

### Section 12 — A1. Brand Positioning

Restate the positioning statement from Phase 1. Map each persona to the service line. Include the manifesto.

### Section 18 — A6. Asset Index

A table listing every logo file by name, dimensions, format, use case, file size.

```html
<table class="asset-table">
  <thead>
    <tr><th>File</th><th>Format</th><th>Dimensions</th><th>Size</th><th>Use</th></tr>
  </thead>
  <tbody>
    <tr><td>autopilot-wordmark-navy.svg</td><td>SVG</td><td>450×68</td><td>1.5KB</td><td>Web, light backgrounds</td></tr>
    <tr><td>autopilot-wordmark-navy-outlined.svg</td><td>SVG</td><td>450×68</td><td>4.2KB</td><td>Email, print (font-independent)</td></tr>
    [...]
  </tbody>
</table>
```

---

## 4.9 — Build order within Phase 4

1. **Start by copying** the locked `logo-concepts-vN.html` from Phase 3 to `04-BrandBook/brand-book.html`. The concepts file already has the visual fingerprint; you're just expanding it.
2. **Replace the concepts grid** with proper sections (cover, manifesto, wordmark, etc.).
3. **Section by section, top to bottom.** Don't try to write all 19 sections at once. Cover → manifesto → wordmark → colour → real-world → scale → voice → governance is the natural reading order, build in that order.
4. **At each section's completion**, scroll-test the brand book in browser. Print-test by `Ctrl+P` and check the print preview. Catch print-specific issues early.
5. **Once all sections are present**, run `scaffold/generate-pdf.js` and check the PDF. Iterate on print CSS until the PDF is clean.

---

## 4.10 — Phase 4 exit checklist

- [ ] Single HTML file at `04-BrandBook/brand-book.html`
- [ ] All required sections present (16 of 16; 3 optional sections may be omitted with reason)
- [ ] CSS variables match `brand-config.json` exactly
- [ ] Section-nav dots functional (scroll + active state)
- [ ] Animations functional (and respect `prefers-reduced-motion`)
- [ ] Print CSS produces a clean PDF (run `scaffold/generate-pdf.js`)
- [ ] PDF is approximately 18–24 pages for a full brand book
- [ ] All asset paths resolve (no broken SVG embeds, no missing fonts)
- [ ] Brand book opens in Chrome, Firefox, Safari without errors

Phase 5 (Asset Pipeline) takes the brand book and produces the deliverable kit — SVGs, PNGs, OG card, PDF.
