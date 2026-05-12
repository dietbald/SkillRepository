# Brand asset pipeline — scaffold

Drop-in pipeline for generating a brand identity kit (outlined SVGs, PNG exports, OG card, PDF brand book) from a single config file.

## Setup

```bash
# Copy this scaffold to the client's 05-Assets/ directory
cp -r scaffold/ ../path/to/ACME-Brand/05-Assets/
cd ../path/to/ACME-Brand/05-Assets

# Copy the sample config and edit values
cp brand-config.sample.json brand-config.json
# Edit brand-config.json — company name, colours, wordmark geometry, font file

# Place the brand's font file (e.g. PlayfairDisplay-Bold.ttf) in this directory

# Install deps
npm install
```

## Run

```bash
# Generate everything
npm run build

# Or individually
npm run outline   # outlined SVGs from opentype.js
npm run og        # 1200x630 OG / social card
npm run pdf       # A4 PDF brand book
```

## What gets generated

In `logos/`:
- `{prefix}-wordmark-primary-outlined.svg` — outlined wordmark, primary colour, with period
- `{prefix}-wordmark-white-outlined.svg` — outlined wordmark, white, with period
- `{prefix}-wordmark-primary-no-period-outlined.svg` — outlined wordmark, no period device
- `{prefix}-og-card.png` — 1200×630 OG card

In the directory root:
- `{Company}-Brand-Identity.pdf` — A4 brand book

## Files in this scaffold

- `brand-config.sample.json` — schema with inline comments. Copy to `brand-config.json` and edit.
- `outline-logos.js` — opentype.js outliner. Reads config, calculates scale factor, writes outlined SVGs.
- `generate-pdf.js` — Puppeteer PDF generator. Reads config, opens brand book HTML, freezes animations, exports A4.
- `generate-og-image.js` — Puppeteer OG card generator. Reads config, opens `og-image-template.html`, captures `.og` element.
- `og-image-template.html` — single-file HTML for the OG card. Edit content; pipeline takes care of capture.
- `templates/email-signature.html` — Outlook-safe table HTML. Includes install instructions for Gmail/Outlook/Apple Mail.
- `templates/letterhead.html` — A4 print-ready, contenteditable body. Print or save as PDF.
- `templates/deck-cover.html` — 16:9 presentation cover slide. Fullscreen in browser, or screenshot for PowerPoint.

## What you need to bring

1. **A font file (TTF or OTF)** matching `wordmark.fontFile` in your config. Place it in this directory.
2. **A completed brand book HTML** at the path specified in `brandBookFile` (typically `../04-BrandBook/brand-book.html`). The `generate-pdf.js` script reads from there.
3. **Outlined wordmark in the templates.** After running `outline-logos.js`, the templates can reference the generated SVGs at `logos/{prefix}-wordmark-*-outlined.svg`.

## Common edits when adapting to a new brand

- `company.name` → wordmark text + ARIA labels.
- `colours.primary` and `colours.accent` → all SVG fills.
- `wordmark.letters` → per-letter kerning. **You must re-author this for any new wordmark word.**
- `wordmark.period.cx/cy/radius` → position of the period device in the SVG viewBox.
- `wordmark.targetTextEndX` → measured from the text-based SVG. Without this, outlined ≠ text-based.

## When the outlined wordmark doesn't match

The most common failure is the outlined SVG looking shrunken vs the text-based design. The fix:

1. Open the text-based wordmark in a vector tool. Measure the X coordinate where the final letter visually ends.
2. Set `wordmark.targetTextEndX` to that value in `brand-config.json`.
3. Re-run `npm run outline`.

The outliner calculates `scaleFactor = targetTextEndX / nativeOpentypeEndX` and applies it uniformly. As long as `targetTextEndX` matches the text-based design, the outlined version will match too.

## Dependencies

- Node.js ≥ 18
- `puppeteer` (auto-downloads Chromium on install — ~170MB)
- `opentype.js` (lightweight)

If you don't want Chromium downloaded automatically, set `PUPPETEER_SKIP_DOWNLOAD=true` and use `puppeteer-core` against a system Chrome instead.
