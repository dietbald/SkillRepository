#!/usr/bin/env node
// Run a one-off JS expression against the active page in the running Chrome (debug port 9222).
// Result is printed as JSON. Use this instead of writing a fresh puppeteer script for each query.
//
// Usage:
//   node eval.js "document.title"
//   node eval.js "[...document.querySelectorAll('a')].length"
//   node eval.js "document.querySelector('#corpCd').value"
//   node eval.js < /tmp/expr.js                         # read from stdin
//   node eval.js --port 9223 "expression"
//   node eval.js --frame 2 "expression"                 # eval inside iframe N
//   node eval.js --filter bizlink "expression"          # pick tab by URL fragment
//
// The expression is sent verbatim to page.evaluate(...). To return an object/array,
// the expression should evaluate to that value (page.evaluate auto-serializes).
// Async: wrap in `(async () => { ... })()` if you need await inside.

const puppeteer = require('puppeteer-core');

function parseArgs(argv) {
  const args = { port: 9222, frame: 0, _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = parseInt(argv[++i], 10);
    else if (a === '--frame') args.frame = parseInt(argv[++i], 10);
    else if (a === '--filter') args.filter = argv[++i];
    else if (a.startsWith('--')) { /* ignore */ }
    else args._.push(a);
  }
  return args;
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

(async () => {
  const args = parseArgs(process.argv);
  let expr = args._.join(' ');
  if (!expr) expr = (await readStdin()).trim();
  if (!expr) {
    console.error('No expression provided. Pass as argv or pipe via stdin.');
    process.exit(1);
  }

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${args.port}`,
    defaultViewport: null,
    protocolTimeout: 30000,
  });
  const pages = await browser.pages();
  const candidates = pages.filter(p => !/^chrome|^devtools/.test(p.url()));
  const page = args.filter ? candidates.find(p => p.url().includes(args.filter)) : candidates[0];
  if (!page) { console.error('No matching tab. Open tabs:'); pages.forEach(p => console.error('  ' + p.url())); process.exit(1); }
  const target = args.frame === 0 ? page : page.frames()[args.frame];
  if (!target) { console.error(`No frame ${args.frame}. Available:`); page.frames().forEach((f,i)=>console.error(`  [${i}] ${f.url()}`)); process.exit(1); }

  // page.evaluate accepts a string and runs it in the page context. To allow
  // top-level expressions like "document.title", wrap in an IIFE that returns it.
  const wrapped = `(() => { return (${expr}); })()`;
  let result;
  try {
    result = await target.evaluate(wrapped);
  } catch (err) {
    console.error('Eval error:', err.message);
    process.exit(2);
  }
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
})();
