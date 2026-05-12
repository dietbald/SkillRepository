/**
 * outline-logos.js — parameterised outliner.
 *
 * Reads brand-config.json from the same directory.
 * Loads the wordmark font via opentype.js, builds the combined glyph path,
 * calculates a uniform scale factor to match the text-based SVG metrics,
 * writes outlined SVG variants to {outputs.logosDir}/.
 *
 * Variants produced (filenames use {outputs.filenamePrefix}):
 *   - {prefix}-wordmark-primary-outlined.svg     (with period)
 *   - {prefix}-wordmark-white-outlined.svg       (with period, white)
 *   - {prefix}-wordmark-primary-no-period-outlined.svg
 *
 * Run: node outline-logos.js
 * Deps: opentype.js (npm install opentype.js)
 */

const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, 'brand-config.json');
if (!fs.existsSync(CONFIG_PATH)) {
  console.error('brand-config.json not found at', CONFIG_PATH);
  console.error('Copy brand-config.sample.json to brand-config.json and edit values.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const W = config.wordmark;
const C = config.colours;
const O = config.outputs;
const FONT_PATH = path.resolve(__dirname, W.fontFile);
const LOGOS_DIR = path.resolve(__dirname, O.logosDir);

if (!fs.existsSync(FONT_PATH)) {
  console.error('Font file not found at', FONT_PATH);
  console.error('Place the TTF/OTF in the same directory as brand-config.json.');
  process.exit(1);
}

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

(async () => {
  const font = await opentype.load(FONT_PATH);
  console.log('Font loaded:', font.names.fontFamily.en);

  // Build the outlined wordmark path at native opentype.js metrics
  const leftPad = W.leftPad || 2;
  const unitScale = W.fontSize / font.unitsPerEm;
  let x = leftPad;
  let combinedPath = new opentype.Path();

  W.letters.forEach((letter) => {
    x += letter.dx;
    const glyph = font.charToGlyph(letter.char);
    const glyphPath = glyph.getPath(x, W.yBaseline, W.fontSize);
    glyphPath.commands.forEach(cmd => combinedPath.commands.push(cmd));
    x += glyph.advanceWidth * unitScale;
  });

  const nativeTextEndX = x;
  console.log(`Native opentype text end X: ${nativeTextEndX.toFixed(1)}`);

  // Uniform scale factor: native opentype metrics → design-intent metrics
  const scaleFactor = W.targetTextEndX / nativeTextEndX;
  console.log(`Scale factor: ${scaleFactor.toFixed(4)} (${W.targetTextEndX} / ${nativeTextEndX.toFixed(1)})`);

  const textPathD = combinedPath.toPathData(2);
  const vbH = W.viewBoxHeight;
  const vbWWithPeriod = W.viewBoxWidthWithPeriod;
  const vbWNoPeriod = W.viewBoxWidthNoPeriod;

  // Period is rendered as an SVG <circle>, NOT as a path — perfect circle at any scale,
  // placed at design-intent coordinates OUTSIDE the scaled <g>.
  const periodCx = W.period.cx;
  const periodCy = W.period.cy;
  const periodR = W.period.radius;
  console.log(`Period: cx=${periodCx}, cy=${periodCy}, r=${periodR}`);

  // === Generate outlined SVGs ===
  const prefix = O.filenamePrefix || 'wordmark';
  const ariaLabel = `${config.company.name}.`;
  const ariaLabelNoPeriod = config.company.name;

  // 1. Wordmark Primary (outlined)
  const wmPrimary = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWWithPeriod} ${vbH}" role="img" aria-label="${ariaLabel}">
  <g transform="scale(${scaleFactor.toFixed(6)})">
    <path d="${textPathD}" fill="${C.primary}"/>
  </g>
  <circle cx="${periodCx}" cy="${periodCy}" r="${periodR}" fill="${C.accent}"/>
</svg>`;

  // 2. Wordmark White (outlined)
  const wmWhite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWWithPeriod} ${vbH}" role="img" aria-label="${ariaLabel}">
  <g transform="scale(${scaleFactor.toFixed(6)})">
    <path d="${textPathD}" fill="${C.white}"/>
  </g>
  <circle cx="${periodCx}" cy="${periodCy}" r="${periodR}" fill="${C.accent}"/>
</svg>`;

  // 3. Wordmark Primary no-period (outlined)
  const wmNoPeriod = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWNoPeriod} ${vbH}" role="img" aria-label="${ariaLabelNoPeriod}">
  <g transform="scale(${scaleFactor.toFixed(6)})">
    <path d="${textPathD}" fill="${C.primary}"/>
  </g>
</svg>`;

  const files = [
    [`${prefix}-wordmark-primary-outlined.svg`, wmPrimary],
    [`${prefix}-wordmark-white-outlined.svg`, wmWhite],
    [`${prefix}-wordmark-primary-no-period-outlined.svg`, wmNoPeriod],
  ];

  files.forEach(([name, content]) => {
    const filePath = path.join(LOGOS_DIR, name);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Written:', name, `(${content.length} bytes)`);
  });

  console.log(`\nWith-period viewBox: 0 0 ${vbWWithPeriod} ${vbH}`);
  console.log(`No-period viewBox: 0 0 ${vbWNoPeriod} ${vbH}`);
  console.log(`\nDone. ${files.length} outlined SVGs created in ${O.logosDir}/`);
})();
