#!/usr/bin/env node
// Take a screenshot of the active page in the running Chrome (debug port 9222).
//
// Usage:
//   node screenshot.js <output.png>                      # full page, default tab
//   node screenshot.js <output.png> --filter halingo     # pick tab by URL fragment
//   node screenshot.js <output.png> --frame 2            # screenshot inside iframe
//   node screenshot.js <output.png> --viewport           # viewport-only (default is fullPage)
//   node screenshot.js <output.png> --port 9223
//   node screenshot.js <output.png> --selector "#main"   # clip to element bounding box

const puppeteer = require('puppeteer-core');

function parseArgs(argv) {
  const args = { port: 9222, frame: 0, fullPage: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = parseInt(argv[++i], 10);
    else if (a === '--frame') args.frame = parseInt(argv[++i], 10);
    else if (a === '--filter') args.filter = argv[++i];
    else if (a === '--viewport') args.fullPage = false;
    else if (a === '--selector') args.selector = argv[++i];
    else if (a.startsWith('--')) { /* ignore */ }
    else if (!args.outPath) args.outPath = a;
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  if (!args.outPath) { console.error('Usage: node screenshot.js <output.png> [--filter X] [--viewport] [--selector SEL]'); process.exit(1); }

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${args.port}`,
    defaultViewport: null,
    protocolTimeout: 60000,
  });
  const pages = await browser.pages();
  const candidates = pages.filter(p => !/^chrome|^devtools/.test(p.url()));
  const page = args.filter ? candidates.find(p => p.url().includes(args.filter)) : candidates[0];
  if (!page) { console.error('No matching tab.'); process.exit(1); }

  if (args.selector) {
    const el = await page.$(args.selector);
    if (!el) { console.error('Selector not found: ' + args.selector); process.exit(1); }
    await el.screenshot({ path: args.outPath });
  } else {
    await page.screenshot({ path: args.outPath, fullPage: args.fullPage });
  }
  const fs = require('fs');
  const sizeKb = (fs.statSync(args.outPath).size / 1024).toFixed(1);
  console.log(`saved ${args.outPath} (${sizeKb} KB)`);
})();
