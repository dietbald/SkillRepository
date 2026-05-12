/**
 * generate-pdf.js — parameterised brand-book PDF generator.
 *
 * Reads brand-config.json. Renders the brand book HTML to A4 PDF via Puppeteer.
 * Freezes all CSS animations and JS-driven reveals to their final state before export.
 * Injects print CSS for page-break control.
 *
 * Run: node generate-pdf.js [optional-output-name]
 * Deps: puppeteer (npm install puppeteer)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, 'brand-config.json');
if (!fs.existsSync(CONFIG_PATH)) {
  console.error('brand-config.json not found at', CONFIG_PATH);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const PDF_OPTS = config.pdfExport;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, config.brandBookFile);
  if (!fs.existsSync(htmlPath)) {
    console.error('Brand book HTML not found at', htmlPath);
    console.error('Check brandBookFile in brand-config.json (path is relative to this script).');
    process.exit(1);
  }

  const outName = process.argv[2] || config.outputs.pdfName;
  const pdfPath = path.resolve(__dirname, outName);

  await page.setViewport(PDF_OPTS.viewport);

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for fonts + any SVG injection
  await page.evaluate(() => {
    return document.fonts ? document.fonts.ready : Promise.resolve();
  });
  await new Promise(r => setTimeout(r, PDF_OPTS.fontLoadTimeoutMs || 2000));

  // Force all animated elements to their final visible state
  await page.evaluate(() => {
    const animationSelectors = [
      '.animate-in', '.animate-in-left', '.animate-in-right',
      '.animate-in-alt-left', '.animate-in-alt-right',
      '.animate-scale', '.animate-in-child'
    ];
    animationSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      });
    });

    // Cover-specific animated elements (CSS keyframes)
    ['.cover-company', '.cover-accent-line', '.cover-wordmark', '.cover-subtitle'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.animation = 'none';
      }
    });

    const accentLine = document.querySelector('.cover-accent-line');
    if (accentLine) accentLine.style.width = '160px';

    document.querySelectorAll('.scale-row').forEach(row => {
      row.style.opacity = '1';
      row.style.transform = 'none';
      row.style.transition = 'none';
    });

    // Hide nav dots in PDF
    const nav = document.querySelector('.section-nav');
    if (nav) nav.style.display = 'none';
  });

  // Print CSS — page breaks + sizing
  await page.addStyleTag({ content: `
    @media print {
      .cover, .manifesto {
        min-height: 100vh;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        page-break-after: always;
      }

      .positioning-section, .scale-section, .mark-section,
      .spec-section, .photo-section, .dataviz-section,
      .motion-section, .color-application {
        page-break-before: always;
      }
      .digital-section, .asset-section {
        page-break-before: auto;
      }

      .noscript-banner { display: none !important; }

      .wm-hero, .construction, .color-bg-grid, .color-swatches-full,
      .app-hero-deck, .biz-card-wrapper, .browser-wrap, .email-client,
      .letterhead, .app-standalone-letterhead, .scale-strip, .micro-test,
      .voice-principles, .voice-examples, .clear-space-demo, .min-size-demo,
      .tagline-lockup-demo, .do-dont-grid, .mark-grid, .browser-tab-demo,
      .spec-table, .spec-gate, .positioning-statement, .positioning-personas,
      .type-ladder, .contrast-grid, .a11y-rule, .photo-grid, .photo-overlay-rules,
      .digital-grid, .digital-spec-table, .asset-table, .asset-quick-ref,
      .dataviz-palette, .dataviz-bar-demo, .dataviz-usage,
      .motion-grid, .motion-principle {
        page-break-inside: avoid;
      }

      .photo-overlay-rules { page-break-before: avoid; }

      .section-heading, .section-title-lg, .section-desc {
        page-break-after: avoid;
      }

      .app-grid > div { page-break-inside: avoid; }

      .color-bg-cell .wm svg {
        width: 100% !important;
        max-width: 200px !important;
      }
      .color-bg-cell { padding: 48px 16px !important; }

      .wordmark-section, .applications, .color-section,
      .voice-section, .governance, .mark-section,
      .positioning-section, .type-section, .a11y-section,
      .photo-section, .digital-section, .asset-section,
      .dataviz-section, .motion-section, .color-application {
        padding-top: 60px;
        padding-bottom: 60px;
      }
    }
  `});

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    scale: PDF_OPTS.scale,
    printBackground: true,
    margin: {
      top: PDF_OPTS.margin,
      right: PDF_OPTS.margin,
      bottom: PDF_OPTS.margin,
      left: PDF_OPTS.margin
    },
    preferCSSPageSize: false
  });

  console.log('PDF saved to:', pdfPath);
  await browser.close();
})();
