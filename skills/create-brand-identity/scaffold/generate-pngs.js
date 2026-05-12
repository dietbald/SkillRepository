/**
 * generate-pngs.js — parameterised PNG exporter.
 *
 * Reads brand-config.json. Renders outlined SVGs from logos/ to PNG at 1x and 2x scales.
 * Use this AFTER running outline-logos.js (which produces the outlined SVGs).
 *
 * Run: node generate-pngs.js
 * Deps: puppeteer
 *
 * For each outlined wordmark SVG, produces:
 *   - {name}.png       (1x scale, transparent bg)
 *   - {name}@2x.png    (2x scale, transparent bg)
 *
 * For white-on-primary variant, produces with primary-colour background instead of transparent
 * (otherwise the white wordmark is invisible).
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
const W = config.wordmark;
const C = config.colours;
const O = config.outputs;
const LOGOS_DIR = path.resolve(__dirname, O.logosDir);
const prefix = O.filenamePrefix || 'wordmark';

// Variants to export. Each must have a corresponding outlined SVG in logos/.
const VARIANTS = [
  {
    sourceSvg: `${prefix}-wordmark-primary-outlined.svg`,
    outputName: `${prefix}-wordmark-primary`,
    bg: 'transparent'
  },
  {
    sourceSvg: `${prefix}-wordmark-white-outlined.svg`,
    outputName: `${prefix}-wordmark-white-on-primary`,
    bg: C.primary
  },
  {
    sourceSvg: `${prefix}-wordmark-primary-no-period-outlined.svg`,
    outputName: `${prefix}-wordmark-primary-no-period`,
    bg: 'transparent'
  }
];

const SCALES = [
  { suffix: '', deviceScale: 1 },
  { suffix: '@2x', deviceScale: 2 }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const v of VARIANTS) {
    const svgPath = path.join(LOGOS_DIR, v.sourceSvg);
    if (!fs.existsSync(svgPath)) {
      console.warn(`Skipping ${v.sourceSvg} — not found. Run outline-logos.js first.`);
      continue;
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Parse viewBox to get logical dimensions
    const vbMatch = svgContent.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (!vbMatch) {
      console.warn(`Skipping ${v.sourceSvg} — could not parse viewBox.`);
      continue;
    }
    const vbW = parseInt(vbMatch[1], 10);
    const vbH = parseInt(vbMatch[2], 10);

    for (const s of SCALES) {
      const page = await browser.newPage();
      await page.setViewport({
        width: vbW,
        height: vbH,
        deviceScaleFactor: s.deviceScale
      });

      const html = `<!doctype html><html><head><style>
        html, body { margin: 0; padding: 0; background: ${v.bg}; }
        body { width: ${vbW}px; height: ${vbH}px; }
        svg { display: block; width: ${vbW}px; height: ${vbH}px; }
      </style></head><body>${svgContent}</body></html>`;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const outPath = path.join(LOGOS_DIR, `${v.outputName}${s.suffix}.png`);
      await page.screenshot({
        path: outPath,
        omitBackground: v.bg === 'transparent',
        clip: { x: 0, y: 0, width: vbW, height: vbH }
      });

      console.log(`Written: ${v.outputName}${s.suffix}.png (${vbW * s.deviceScale}x${vbH * s.deviceScale})`);
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone. PNG exports in', O.logosDir + '/');
})();
