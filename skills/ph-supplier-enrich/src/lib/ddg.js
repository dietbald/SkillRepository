// DuckDuckGo HTML search via Puppeteer.
//
// Tries multiple query variants for a given supplier name, in order:
//   1. Bare name + region          (broadest, no quotes)
//   2. Quoted exact phrase + region (more precise)
//   3. Stripped legal-suffix variant (CORP/INC/CO/SUPPLY/HARDWARE removed) + region
// Returns combined deduped results from whichever variants returned hits.

import { newPage } from './browser.js';
import { log } from './log.js';

const SEARCH_URL = 'https://html.duckduckgo.com/html/';

const SUFFIXES_TO_TRY_STRIP = [
  /\b(corp|corporation|inc|incorporated|co|company|llc|ltd|opc|enterprises?)\b\.?/gi,
];

const ALL_BUSINESS_TAILS = /\b(corp|corporation|inc|incorporated|co|company|llc|ltd|opc|enterprises?|trading|merchandise|merchandising|marketing|hardware|supply|supplies|builders?|builders?\s+and\s+supply|lumber|construction|const|center|depot|mart)\b\.?/gi;

function buildQueryVariants(name, region) {
  const variants = new Set();
  const trimmed = name.trim();
  // Strip trailing punctuation noise (apostrophes, periods)
  const punctClean = trimmed.replace(/['']/g, '').replace(/\s+/g, ' ').trim();

  variants.add(`${trimmed} ${region}`);                          // bare original
  if (punctClean !== trimmed) variants.add(`${punctClean} ${region}`);  // no apostrophes

  // Drop legal suffix only (e.g., "GOLDEN DELTA STEEL CORP" -> "GOLDEN DELTA STEEL")
  let legalStripped = trimmed;
  for (const re of SUFFIXES_TO_TRY_STRIP) legalStripped = legalStripped.replace(re, '').trim();
  legalStripped = legalStripped.replace(/\s+/g, ' ').trim();
  if (legalStripped && legalStripped !== trimmed) {
    variants.add(`${legalStripped} ${region}`);
  }

  // Strip ALL business-tail words (e.g., "3KEY'S BUILDES AND SUPPLY" -> "3KEY'S")
  let coreOnly = punctClean.replace(ALL_BUSINESS_TAILS, '').trim();
  coreOnly = coreOnly.replace(/\b(and|the)\b/gi, '').replace(/\s+/g, ' ').trim();
  if (coreOnly && coreOnly !== trimmed && coreOnly !== legalStripped && coreOnly.length >= 3) {
    variants.add(`${coreOnly} ${region}`);
  }

  // Quoted-strict last (only useful for unique multi-word names)
  if (trimmed.split(/\s+/).length >= 2) {
    variants.add(`"${trimmed}" ${region}`);
  }
  return [...variants];
}

async function runOneQuery(page, query, limit) {
  await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    const inp = document.querySelector('input[name="q"]');
    if (inp) inp.value = '';
  });
  await page.type('input[name="q"]', query, { delay: 25 });
  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
  ]);
  return page.evaluate((max) => {
    const out = [];
    const blocks = document.querySelectorAll('.result, .web-result');
    for (const b of blocks) {
      const titleEl = b.querySelector('.result__a, .result__title a');
      const snipEl = b.querySelector('.result__snippet');
      const urlEl = b.querySelector('.result__a, .result__url');
      if (!titleEl) continue;
      let url = titleEl.getAttribute('href') || urlEl?.textContent || '';
      if (url.startsWith('//')) url = 'https:' + url;
      try {
        const u = new URL(url, location.origin);
        const inner = u.searchParams.get('uddg');
        if (inner) url = decodeURIComponent(inner);
      } catch {}
      out.push({
        title: (titleEl.textContent || '').trim(),
        snippet: (snipEl?.textContent || '').trim(),
        url,
      });
      if (out.length >= max) break;
    }
    return out;
  }, limit);
}

export async function ddgSearch(query, { limit = 10, region = 'Iloilo Philippines' } = {}) {
  const variants = buildQueryVariants(query, region);
  const page = await newPage();
  const seen = new Map(); // url -> result
  let queriesUsed = [];
  try {
    for (const v of variants) {
      log.dbg(`DDG query: ${v}`);
      try {
        const results = await runOneQuery(page, v, limit);
        queriesUsed.push({ query: v, count: results.length });
        for (const r of results) {
          if (r.url && !seen.has(r.url)) seen.set(r.url, r);
        }
      } catch (e) {
        log.warn(`DDG variant failed (${v}): ${e.message}`);
      }
      // Stop if we have enough good results from the first variant
      if (seen.size >= limit) break;
      await new Promise((r) => setTimeout(r, 1500));  // gap between variants
    }
  } finally {
    await page.close().catch(() => {});
  }
  log.dbg(`DDG: ${seen.size} unique results from ${queriesUsed.length} variants`);
  return [...seen.values()].slice(0, limit);
}
