#!/usr/bin/env node
// Smoke test: run a single DDG search and print results + extracted candidates.
//
//   node src/test-ddg.js "MOOSTBRAND"

import { ddgSearch } from './lib/ddg.js';
import { extractCandidates, extractDiscoveries } from './lib/candidates.js';
import { closeBrowser } from './lib/browser.js';

const query = process.argv[2];
if (!query) {
  console.error('usage: test-ddg.js "<supplier name>"');
  process.exit(2);
}

(async () => {
  console.log(`\n=== DDG search: "${query}" ===`);
  const results = await ddgSearch(query, { limit: 10 });
  console.log(`got ${results.length} results\n`);
  for (const [i, r] of results.entries()) {
    console.log(`  [${i + 1}] ${r.title}`);
    console.log(`      url: ${r.url}`);
    if (r.snippet) console.log(`      ${r.snippet.slice(0, 180)}`);
    console.log();
  }

  const candidates = extractCandidates(query, results);
  console.log(`=== Extracted full-name candidates (${candidates.length}) ===`);
  for (const c of candidates.slice(0, 8)) {
    console.log(`  ${c.score.toFixed(2)}  ${c.full_name}`);
    console.log(`             from=${c.from} ${c.url}`);
  }

  const discoveries = extractDiscoveries(query, results);
  console.log(`\n=== Discovered other suppliers (${discoveries.length}) ===`);
  for (const d of discoveries.slice(0, 8)) {
    console.log(`  ${d.full_name}`);
    console.log(`             from=${d.from} ${d.url}`);
  }

  await closeBrowser();
})();
