/**
 * generate-og-image.js — parameterised OG card generator.
 *
 * Reads brand-config.json. Renders og-image-template.html to a {width}x{height} PNG
 * via Puppeteer at deviceScaleFactor 2 for crisp output.
 *
 * Run: node generate-og-image.js
 * Deps: puppeteer
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
const OG = config.ogCard;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, OG.templateFile);
  if (!fs.existsSync(htmlPath)) {
    console.error('OG template not found at', htmlPath);
    process.exit(1);
  }

  const outPath = path.resolve(__dirname, config.outputs.ogCardName);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await page.setViewport({ width: OG.width, height: OG.height, deviceScaleFactor: 2 });

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
  await new Promise(r => setTimeout(r, 250));

  // Crop to the .og element only, avoiding body padding
  const og = await page.$('.og');
  if (!og) {
    console.error('No .og element found in template. Did you wrap the card content in <div class="og">?');
    process.exit(1);
  }

  await og.screenshot({ path: outPath, omitBackground: false });
  console.log('OG card saved to:', outPath);

  await browser.close();
})();
