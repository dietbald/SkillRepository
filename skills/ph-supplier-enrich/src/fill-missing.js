#!/usr/bin/env node
// Fill missing source data in already-enriched supplier files.
//
// Walks each <output>/by-name/*.json. If a source (dti, sec) is not present
// or returned no result and we have a candidate name from DDG to query with,
// run that source and merge results into the existing file.
//
//   node src/fill-missing.js --dir <by-name dir> --source dti [--source sec] [--limit N]

import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import minimist from 'minimist';
import { dtiSearch } from './lib/dti.js';
import { secSearch } from './lib/sec.js';
import { closeBrowser } from './lib/browser.js';
import { log } from './lib/log.js';

const args = minimist(process.argv.slice(2), {
  string: ['dir', 'source'],
  boolean: ['help'],
  default: { source: 'dti' },
});

if (args.help || !args.dir) {
  console.log('Usage: fill-missing.js --dir <by-name dir> [--source dti|sec] [--limit N]');
  process.exit(args.help ? 0 : 2);
}

const SOURCES = String(args.source).split(',').map((s) => s.trim()).filter(Boolean);
const DIR = resolve(args.dir);

function bestQueryName(data) {
  // Prefer DDG-best candidate; fall back to input name.
  const ddgBest = (data.candidates || []).find((c) => c.source === 'ddg' && c.full_name);
  if (ddgBest) return ddgBest.full_name;
  return data.input_name;
}

function alreadyHas(data, source) {
  // Check if this source has been tried and got a real hit (not just a "no_result").
  const s = (data.sources || {})[source];
  return s && (s.full_name || s.note === 'no_result');
}

const SKIP_PATTERNS = [
  /\bDEO\b/i, /\bPEO\b/i, /\bDPWH\b/i, /\bCAPITOL\b/i,
  /\bPROVINCE\b/i, /\b(1ST|2ND|3RD|4TH)\s+DISTRICT\b/i,
  /^[\W_]+$/,                       // pure punctuation/junk
  /^.{0,2}$/,                       // 0-2 char name
];

function shouldSkip(name) {
  for (const p of SKIP_PATTERNS) {
    if (p.test(name)) return true;
  }
  return false;
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
  log.info(`Scanning ${files.length} enrichment files in ${DIR}`);
  let processed = 0, hits = 0, skipped = 0;
  const limit = args.limit ? Math.min(parseInt(args.limit, 10), files.length) : files.length;

  for (const f of files) {
    if (processed >= limit) break;
    const path = join(DIR, f);
    let data;
    try { data = JSON.parse(readFileSync(path, 'utf8')); }
    catch { continue; }

    let touched = false;
    if (shouldSkip(data.input_name)) {
      log.dbg(`skip ${data.input_name}: matched skip pattern`);
      skipped++;
      continue;
    }
    for (const source of SOURCES) {
      if (alreadyHas(data, source)) { continue; }
      const q = bestQueryName(data);
      if (!q) continue;
      log.info(`[${source}] ${data.input_name} -> "${q}"`);
      try {
        const r = source === 'dti'
          ? await dtiSearch(q)
          : await secSearch(q);
        data.sources = data.sources || {};
        data.sources[source] = r;
        if (r.full_name) {
          hits++;
          data.candidates = data.candidates || [];
          data.candidates.push({
            source: source === 'dti' ? 'dti_bnrs' : 'sec',
            full_name: r.full_name,
            owner: r.owner,
            cert_no: r.cert_no,
            registration_date: r.registration_date,
            status: r.status,
            territory: r.territory,
            score: 1.0,
          });
        }
        touched = true;
        await sleep(source === 'dti' ? 5000 : 3000);
      } catch (e) {
        log.warn(`[${source}] error: ${e.message}`);
      }
    }
    if (touched) {
      writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
      processed++;
    } else {
      skipped++;
    }
  }

  log.info(`fill-missing done. processed=${processed} hits=${hits} skipped=${skipped}`);
  await closeBrowser();
})();
