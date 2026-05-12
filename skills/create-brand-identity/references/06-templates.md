# Phase 6 — Templates

Email signature, letterhead, deck cover. The applied brand. Each template is self-contained HTML that demonstrates the brand in a real medium.

**Outputs:**
- `06-Templates/email-signature.html` — Outlook-safe table HTML, copy-paste ready
- `06-Templates/letterhead.html` — A4 print-ready, contenteditable body
- `06-Templates/deck-cover.html` — 16:9 cover slide

**Phase exit gate:** each template renders correctly in its target environment (Gmail + Outlook for signature, browser print preview for letterhead, browser fullscreen for deck cover).

---

## 6.1 — Why HTML templates, not InDesign / PowerPoint

The same reasons as the brand book (Phase 4):
- One source. Designer, developer, brand manager all edit the same file.
- Brand tokens stay in sync — colours, fonts, spacing all reference the same CSS values.
- Version-controllable in git.
- No licensing dependency.

The templates output to their target medium **without re-authoring** in another tool:
- Email signature: copy-paste the rendered HTML into Gmail / Outlook signature settings.
- Letterhead: print to PDF for distribution, or save the HTML as the master document.
- Deck cover: screenshot to use as a PowerPoint slide image, or convert the HTML to a slide deck format (Reveal.js, Marp).

---

## 6.2 — Email signature

### Constraints

Email is the hostile environment. Constraints:

- **No external CSS.** All styles inline (Gmail strips `<style>`).
- **No external fonts.** Custom fonts won't load in most clients. Use system-font fallback stacks.
- **Tables, not flexbox.** Outlook still renders email using Word's HTML engine. Tables work; flexbox / grid does not.
- **No SVG `<text>` elements.** Outlook renders these as image fallbacks at low quality. Use outlined SVGs (`<path>` only) or PNG.
- **Width: ~400–500px.** Most email clients clip wider signatures.

### Structure

```html
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: Georgia, 'Times New Roman', serif;">
  <tr>
    <td style="padding-right: 20px; border-right: 2px solid #1B2A4A;">
      <!-- Outlined wordmark, fixed width -->
      <img src="https://autopilot.sg/static/autopilot-wordmark-navy-outlined.png" width="200" alt="Autopilot.">
    </td>
    <td style="padding-left: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #1B2A4A;">
      <div style="font-weight: bold; font-size: 16px; color: #1B2A4A;">{{NAME}}</div>
      <div style="color: #6E6E68;">{{TITLE}}</div>
      <div style="margin-top: 8px;">
        <a href="mailto:{{EMAIL}}" style="color: #1B2A4A; text-decoration: none;">{{EMAIL}}</a>
      </div>
      <div style="color: #6E6E68;">autopilot.sg</div>
    </td>
  </tr>
</table>
```

### Outlook compatibility

Outlook's HTML engine needs:
- `mso-line-height-rule: exactly` on text blocks
- `<!--[if mso]> ... <![endif]-->` conditionals for Outlook-specific overrides
- Explicit `cellpadding="0" cellspacing="0" border="0"` on every table

### Placeholders

Use `{{NAME}}`, `{{TITLE}}`, `{{EMAIL}}` etc. Each user replaces them before pasting into their email client. The `06-Templates/email-signature.html` should include:

1. A **preview** section at the top (rendered, what the signature will look like)
2. An **instruction panel** (how to install in Gmail, Outlook, Apple Mail)
3. The **raw HTML** in a `<pre>` block or a "Copy HTML" button

Or split into two files: `email-signature-preview.html` (for the user) and `email-signature-raw.html` (the raw HTML to copy).

### What to avoid

- Animated GIFs (some clients block; reads as spam).
- Phone numbers as text (Outlook auto-links to Skype). Use hyperlinks.
- Social media icons. They date the signature and most recipients ignore them.
- Quotes / mottos / disclaimers below the signature. The brand voice already does that work.

---

## 6.3 — Letterhead

### Structure

A4 page (210mm × 297mm). Print CSS to remove browser chrome on print. Contenteditable body for ad-hoc letter drafting.

```html
<!doctype html>
<html>
<head>
<style>
  @page { size: A4; margin: 0; }
  @media print {
    body { margin: 0; box-shadow: none; }
    .no-print { display: none; }
  }
  body {
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    padding: 40mm 25mm 25mm 25mm;
    background: #FFFFFF;
    font-family: 'Inter', -apple-system, sans-serif;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    position: relative;
  }
  .stripe {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3mm;
    background: #1B2A4A;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 60px;
  }
  .header .wm { width: 160px; }
  .header .meta {
    text-align: right;
    font-size: 11px;
    color: #6E6E68;
    line-height: 1.5;
  }
  .body {
    min-height: 600px;
    font-size: 13px;
    line-height: 1.7;
    color: #2C2C28;
  }
  .footer {
    position: absolute;
    bottom: 25mm;
    left: 25mm;
    right: 25mm;
    border-top: 1px solid #EEEEE9;
    padding-top: 12px;
    font-size: 10px;
    color: #6E6E68;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="stripe"></div>
  <div class="header">
    <div class="wm"><img src="../05-Assets/logos/autopilot-wordmark-navy-outlined.svg"></div>
    <div class="meta">
      Autopilot Pte. Ltd.<br>
      160 Robinson Road<br>
      Singapore<br>
      autopilot.sg
    </div>
  </div>
  <div class="body" contenteditable="true">
    <p>Date: [Date]</p>
    <p>[Recipient name]<br>[Recipient address]</p>
    <p>Dear [Name],</p>
    <p>[Letter body...]</p>
    <p>Sincerely,</p>
    <p>[Signature]</p>
  </div>
  <div class="footer">
    Autopilot Pte. Ltd. · 160 Robinson Road · Singapore · autopilot.sg
  </div>
</body>
</html>
```

### Key choices

- **3mm left stripe in primary colour** — subtle brand presence without overdoing it.
- **Outlined wordmark in header** — font-independent (the user may not have the brand font installed).
- **Right-aligned meta block** — address and contact at top right.
- **Body uses `contenteditable="true"`** — the brand manager opens the file in a browser, types directly, prints to PDF.
- **Print CSS removes the page margin and shadow** — when printed, the page fills A4 exactly.

### Where it breaks

- Browsers other than Chrome handle `@page { margin: 0 }` differently. Always test the print preview.
- If you print directly from the browser, the OS print dialog may add margins back. Print to PDF first.

---

## 6.4 — Deck cover

A 16:9 slide for use as a presentation cover. Two common output formats:

1. **Standalone HTML** — open fullscreen in a browser as the cover slide.
2. **PNG export** — screenshot the rendered HTML and insert as an image in PowerPoint / Keynote.

### Structure

```html
<!doctype html>
<html>
<head>
<style>
  body { margin: 0; background: #1B2A4A; overflow: hidden; }
  .slide {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #F5F5F0;
    font-family: 'Playfair Display', Georgia, serif;
  }
  .wm { width: 480px; }
  .title {
    font-size: 64px;
    font-weight: 700;
    margin-top: 80px;
    text-align: center;
    line-height: 1.2;
    max-width: 1000px;
  }
  .title .period { color: #D03C3C; }
  .meta {
    margin-top: 60px;
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    letter-spacing: 0.05em;
    color: rgba(245, 245, 240, 0.6);
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <div class="slide">
    <div class="wm"><img src="../05-Assets/logos/autopilot-wordmark-white-outlined.svg"></div>
    <h1 class="title" contenteditable="true">[Presentation title]<span class="period">.</span></h1>
    <div class="meta" contenteditable="true">[Client] · [Date]</div>
  </div>
</body>
</html>
```

### Variants

A deck cover can ship as a multi-slide template:
- Cover (above)
- Section divider
- Content slide
- Closing slide

Each as a separate `06-Templates/deck-*.html` file. The brand manager picks the right template for the situation.

### Export to PNG for PowerPoint

Use Puppeteer:

```js
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto('file:///path/to/deck-cover.html');
await page.screenshot({ path: 'deck-cover.png', fullPage: false });
```

This produces a 3840×2160 PNG. Drop it into PowerPoint as a fullscreen background image.

---

## 6.5 — Patterns across the three templates

1. **All three use the outlined wordmark, not text-based.** Email clients and PowerPoint can't be trusted to load custom fonts.
2. **All three use brand colours via inline values** (not CSS variables). Inline survives copy-paste and screenshot.
3. **All three include system-font fallbacks.** If the brand font fails to load (likely in email, possible in browser without internet), the fallback is a deliberate choice (Georgia for serif, Arial for sans), not a random browser default.
4. **All three have placeholders or `contenteditable`** for the parts that change per use.
5. **All three are self-contained HTML files.** No external CSS, no external JS, fonts via Google Fonts CDN with fallback.

---

## 6.6 — Optional additional templates

Beyond the core three, common additions:

- **Business card** (HTML, A4 sheet with multiple cards per page, print-ready)
- **Invoice** (HTML, A4, with line items, totals, contenteditable)
- **Proposal cover** (similar to deck cover, but A4 portrait for PDF distribution)
- **Email newsletter header** (HTML, table-based, brand wordmark + tagline)
- **Social media post** (HTML, square 1080×1080 or 4:5 1080×1350, screenshot for IG/LinkedIn)

Add these only if the client will use them. Otherwise they bloat the deliverable kit.

---

## 6.7 — Phase 6 exit checklist

- [ ] `email-signature.html` renders correctly in Gmail (paste rendered HTML into Gmail signature setting and send a test email)
- [ ] `email-signature.html` renders correctly in Outlook (paste and send test)
- [ ] `letterhead.html` print preview shows correct A4 layout with no extra margins
- [ ] Letterhead printed to PDF matches the design at 100% scale
- [ ] `deck-cover.html` renders correctly fullscreen at 1920×1080
- [ ] All templates use outlined wordmark, not text-based
- [ ] All templates include system-font fallback stacks
- [ ] All placeholder values (`{{NAME}}`, `[Date]`, etc.) are clearly marked

Phase 7 (Review & Ratify) takes the complete kit through the council ratification gate.
