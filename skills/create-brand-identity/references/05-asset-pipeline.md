# Phase 5 — Asset pipeline

The technical layer. Dual-track SVGs (text-based + outlined), PNG exports at 1x/2x, OG card, PDF brand book. Driven by `brand-config.json` so the pipeline drops into any new project.

**Outputs (in `05-Assets/`):**
- `brand-config.json` — single source of truth for company name, colours, fonts, wordmark geometry
- `logos/` — every SVG + PNG variant
- `[Company]-Brand-Identity.pdf` — exported brand book

**Phase exit gate:** running `node generate-pdf.js && node outline-logos.js && node generate-pngs.js && node generate-og-image.js` produces a complete kit with no errors.

---

## 5.1 — `brand-config.json` schema

This file is the **single source of truth** for the asset pipeline. All four generator scripts read from it. Editing the brand colours in one place propagates everywhere.

See `scaffold/brand-config.sample.json` for the full schema. Excerpt:

```json
{
  "company": {
    "name": "Autopilot",
    "legalName": "Autopilot Pte. Ltd.",
    "domain": "autopilot.sg",
    "tagline": "Your business should run without you."
  },
  "colours": {
    "primary": "#1B2A4A",
    "accent": "#D03C3C",
    "offWhite": "#F5F5F0",
    "white": "#FFFFFF"
  },
  "wordmark": {
    "fontFile": "PlayfairDisplay-Bold.ttf",
    "fontFamily": "Playfair Display",
    "fontSize": 56,
    "yBaseline": 48,
    "viewBoxHeight": 68,
    "viewBoxWidthWithPeriod": 450,
    "viewBoxWidthNoPeriod": 430,
    "letters": [
      { "char": "A", "dx": 0 },
      { "char": "u", "dx": -2 },
      { "char": "t", "dx": -0.5 }
    ],
    "period": {
      "cx": 437,
      "cy": 48,
      "radius": 5.5
    }
  },
  "brandBookFile": "../04-BrandBook/brand-book.html",
  "outputs": {
    "logosDir": "logos",
    "pdfName": "Autopilot-Brand-Identity.pdf",
    "ogCardName": "logos/autopilot-og-card.png"
  }
}
```

Every value is read by at least one generator. Hard-coding values in the scripts is forbidden.

---

## 5.2 — Dual-track SVG system

A wordmark using a custom typeface needs two SVG variants:

| Variant | Format | Dependencies | Use |
|---|---|---|---|
| **Text-based** | `<text>` element with `<tspan>` per letter | Google Fonts or @font-face | Web — fast load, editable, smaller file |
| **Outlined** | `<path>` element with vector outlines | None (paths embedded) | Email, print, PDF, any context where the font may not load |

**Why both?**

A text-based wordmark depends on the typeface being loaded. In email clients (Gmail, Outlook), custom fonts often fail to load — and the wordmark renders in the user's default font, butchering the brand. Outlined wordmarks have the letterforms baked in as `<path d="...">`, so they render identically everywhere.

**Trade-off:** outlined SVGs are larger (4–5KB vs 1.5KB) and not text-editable.

**Rule:** ship both. Use text-based on web. Use outlined in email signatures, PDF brand book, print collateral, social cards.

---

## 5.3 — opentype.js outlining

`scaffold/outline-logos.js` converts the wordmark from text to outlined SVG using opentype.js.

### The scale-factor problem

opentype.js produces glyph paths at the typeface's native units. The native paths are **narrower** than the browser-rendered text — typically by a factor of ~1.5–2×, depending on the typeface.

If you paste the native path into an SVG with the same viewBox as the text-based wordmark, the outlined version looks shrunken. The period (placed at fixed coordinates from the text-based design intent) ends up floating in space.

### Solution: uniform scale factor

The script:

1. Loads the font (e.g. `PlayfairDisplay-Bold.ttf`).
2. Builds the combined glyph path for the wordmark letters at native scale.
3. Measures where the native path ends (`nativeTextEndX`).
4. Reads the design-intent text end (`targetTextEndX`) from `brand-config.json`.
5. Calculates `scaleFactor = targetTextEndX / nativeTextEndX`.
6. Wraps the path in `<g transform="scale(S)">`.
7. Places the period as a separate `<circle>` (NOT a path) at the design-intent coordinates.

Result: the outlined SVG matches the text-based SVG visually, pixel-for-pixel.

### What you must NOT do

- Don't outline the period. Keep it as `<circle>` — that way it stays a perfect circle at any scale, and it doesn't pick up rendering artifacts from path subdivisions.
- Don't try to outline the wordmark in a vector tool by hand. The scale factor and period alignment are too fiddly. Use the script.

---

## 5.4 — PNG export at 1x and 2x

`scaffold/generate-pngs.js` produces PNG variants of the wordmark and the monogram/mark.

For each variant, generate:
- Standard resolution: source SVG → screenshot at viewBox dimensions
- Retina (`@2x`): screenshot at 2× viewBox dimensions

Both with `omitBackground: true` for transparency, except white-on-primary variants which need the primary-colour fill behind the white text.

The script reads `brand-config.json` for the colour values and uses Puppeteer to render the SVG, then `page.screenshot({ clip, omitBackground })` to capture.

### Common pitfalls

- **Font load failure.** Puppeteer must wait for `document.fonts.ready` before screenshotting, otherwise the text-based wordmark renders in a fallback font.
- **Anti-aliasing on transparent backgrounds.** Some Puppeteer versions produce washed-out edges on transparent PNGs. If this happens, use `omitBackground: false` and set the background colour explicitly to the brand's off-white or white.
- **Sub-pixel positioning.** PNG exports at 1× can show half-pixel artifacts where SVG anti-aliases. Render at 2× and downscale if quality matters.

---

## 5.5 — OG card / social card

`scaffold/generate-og-image.js` renders `og-image-template.html` to a 1200×630 PNG with `deviceScaleFactor: 2` for crisp output.

The template is a single full-viewport HTML page with:
- Brand-primary background
- Centred wordmark (outlined SVG)
- Optional manifesto line below
- Optional URL or strapline

```html
<!doctype html>
<html>
<head>
<style>
  body { margin: 0; background: #1B2A4A; }
  .og { width: 1200px; height: 630px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; }
  .og .wm { width: 600px; }
  .og .manifesto { color: #F5F5F0; font-family: 'Playfair Display', Georgia, serif;
                   font-size: 32px; margin-top: 60px; }
</style>
</head>
<body>
  <div class="og">
    <div class="wm"><svg>[outlined wordmark, white variant]</svg></div>
    <div class="manifesto">[Manifesto first line]</div>
  </div>
</body>
</html>
```

The script captures only the `.og` element, not the body, to avoid padding artifacts.

---

## 5.6 — PDF brand book export

`scaffold/generate-pdf.js` renders `04-BrandBook/brand-book.html` to A4 PDF.

### The four load-bearing settings

1. **Viewport: 800×1100.** Above mobile breakpoint, fits A4 cleanly at 0.88 scale.
2. **`deviceScaleFactor: 2`.** Crisp text in the PDF (no anti-alias mush on small captions).
3. **`scale: 0.88`** in `page.pdf({ scale })`. The standard ratio for 800px viewport → A4. Don't change without testing.
4. **`printBackground: true`.** Otherwise CSS background colours don't render and the brand book is mostly white.

### Animation freezing

CSS animations and JS-driven `IntersectionObserver` reveals will leave elements mid-transition (or hidden at `opacity: 0`) when Puppeteer captures the page. The script runs a `page.evaluate()` that:

```js
['.animate-in', '.animate-in-left', '.animate-scale'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
  });
});
```

Plus the cover animation (CSS keyframes):

```js
['.cover-company', '.cover-accent-line', '.cover-wordmark', '.cover-subtitle'].forEach(sel => {
  const el = document.querySelector(sel);
  if (el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.animation = 'none';
  }
});

// Restore the accent line to its final width
const accentLine = document.querySelector('.cover-accent-line');
if (accentLine) accentLine.style.width = '160px';
```

### Page-break control

The script injects a `<style>` block with `@media print` rules. Forces page breaks before major sections (cover, manifesto, scale, mark, motion, colour application) and prevents breaks inside blocks (wordmark hero, colour swatches, biz card mockup, type ladder, etc.). See the full rule set in `scaffold/generate-pdf.js`.

### Expected output

A 18–24 page A4 PDF with:
- One title page (cover)
- One manifesto page
- 16–22 content pages
- All section starts begin at the top of a page
- No content split across pages mid-block

---

## 5.7 — Asset naming convention

Strict naming protects against confusion. Pattern: `{company}-{component}-{variant}-{modifier}[.{format}]`

Examples:
```
autopilot-wordmark-navy.svg              # text-based, primary colour
autopilot-wordmark-navy-outlined.svg     # outlined, primary colour
autopilot-wordmark-white-on-navy.svg     # text-based, white on primary bg
autopilot-wordmark-white-on-navy.png     # PNG export, 1x
autopilot-wordmark-white-on-navy@2x.png  # PNG export, 2x
autopilot-wordmark-navy-no-period.svg    # text-based, no period device
autopilot-monogram-navy-bg.svg           # monogram, navy background
autopilot-circle-mark.svg                # standalone circle mark
autopilot-favicon-16.svg                 # 16×16 favicon
autopilot-favicon-32.svg                 # 32×32 favicon
autopilot-og-card.png                    # 1200×630 OG card
autopilot-social-card.png                # alternate social card
```

The `-outlined` suffix is the disambiguator for outlined SVGs. Never embed it elsewhere in the name.

---

## 5.8 — Running the pipeline

After `brand-config.json` is filled in:

```bash
cd 05-Assets

# Install dependencies (one-time)
npm install puppeteer opentype.js

# Generate outlined SVGs (must run before PNG generation)
node outline-logos.js

# Generate PNG exports
node generate-pngs.js

# Generate OG card
node generate-og-image.js

# Generate the PDF brand book
node generate-pdf.js
```

Or all at once via a `package.json` script:

```json
{
  "scripts": {
    "build": "node outline-logos.js && node generate-pngs.js && node generate-og-image.js && node generate-pdf.js"
  }
}
```

Then `npm run build`.

---

## 5.9 — Common pipeline failures

### "PDF is mostly blank"

`printBackground: true` is missing. Add it to `page.pdf()`.

### "Animations stuck at opacity 0 in the PDF"

The animation-freezing block in `generate-pdf.js` isn't running, or you added new `.animate-in-*` class names that aren't in the selector list. Update the selector list.

### "Outlined wordmark looks shrunken vs text-based"

The scale factor isn't being applied. Check `outline-logos.js` is wrapping the path in `<g transform="scale(S)">`. Check the period is **not** inside the scaled group.

### "Outlined period is off-centre"

The period is being placed at native opentype.js coordinates instead of design-intent coordinates. Move the `<circle>` outside the `<g transform>` and use the values from `brand-config.json wordmark.period`.

### "Fonts don't load in the PDF"

The brand book HTML uses `@import` from Google Fonts. The PDF generator may export before fonts finish loading. The script already waits for `document.fonts.ready` and then 2 seconds. If still failing, increase the timeout or embed the font as base64 in `<style>`.

### "PNG exports have washed-out edges"

Disable `omitBackground` and explicitly set the background colour in the SVG before screenshotting. Some Puppeteer versions produce poor anti-alias on transparent PNGs.

---

## 5.10 — Phase 5 exit checklist

- [ ] `brand-config.json` filled in completely
- [ ] `node outline-logos.js` runs without error and produces all outlined variants
- [ ] `node generate-pngs.js` runs without error and produces 1x + 2x PNGs for every wordmark/mark variant
- [ ] `node generate-og-image.js` produces a 1200×630 PNG
- [ ] `node generate-pdf.js` produces a clean A4 PDF (18–24 pages, no broken sections, no mid-block breaks)
- [ ] All assets in `05-Assets/logos/` follow the naming convention
- [ ] Total kit size is reasonable (<5MB for the SVG/PNG kit; <3MB for the PDF)

Phase 6 (Templates) embeds these assets into the email signature, letterhead, and deck cover templates.
