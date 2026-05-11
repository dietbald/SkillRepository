#!/usr/bin/env node
// ph-supplier-enrich orchestrator.
//
// Reads a CSV or JSON list of supplier names. For each name, runs the
// available sources (DDG / DTI / SEC), writes per-name JSON, aggregates
// discoveries, and emits a summary.
//
// Resumable: skips names whose output file already exists (use --force to
// re-enrich).

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import minimist from 'minimist';
import { ddgSearch } from './lib/ddg.js';
import { dtiSearch } from './lib/dti.js';
import { secSearch } from './lib/sec.js';
import { extractCandidates, extractDiscoveries, extractContacts } from './lib/candidates.js';
import { closeBrowser } from './lib/browser.js';
import { log, setLogFile } from './lib/log.js';

const args = minimist(process.argv.slice(2), {
  string: ['input', 'output', 'column', 'skip', 'filter-column', 'filter-value', 'region'],
  boolean: ['force', 'help'],
  default: {
    column: null,
    region: 'Iloilo Philippines',
    output: './enriched/',
    skip: 'sec',  // SEC via OpenCorporates is hCaptcha-brittle — opt in via --skip ''
  },
});

if (args.help || !args.input) {
  console.log(`
Usage:
  node src/enrich.js --input <file.csv|file.json> [options]

Options:
  --column <name>             CSV column with supplier names (auto-detect if omitted)
  --filter-column <name>      Only enrich rows where this column matches --filter-value
  --filter-value <value>      Required value for --filter-column
  --output <dir>              Output dir (default: ./enriched/)
  --limit <n>                 Process at most N names
  --skip ddg,dti,sec          Comma-separated sources to skip
  --force                     Re-enrich names even if output exists
  --region <text>             Search region context (default: "Iloilo Philippines")
`);
  process.exit(args.help ? 0 : 2);
}

const SKIP = new Set(String(args.skip || '').split(',').map((s) => s.trim()).filter(Boolean));
const OUT = resolve(args.output);
const BY_NAME_DIR = join(OUT, 'by-name');
const DISCOVERIES_FILE = join(OUT, 'discovered_suppliers.json');
const SUMMARY_FILE = join(OUT, 'enrichment_summary.md');
const AUDIT_FILE = join(OUT, '_audit.log');

mkdirSync(BY_NAME_DIR, { recursive: true });
setLogFile(AUDIT_FILE);

function slugify(s) {
  return String(s || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'unknown';
}

function loadInput(path) {
  const content = readFileSync(path, 'utf8');
  if (path.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(content);
    if (Array.isArray(data)) return data;
    throw new Error('JSON input must be an array of objects');
  }
  return parseCsv(content, { columns: true, skip_empty_lines: true, trim: true });
}

function pickColumn(rows, hint) {
  if (hint && rows[0] && hint in rows[0]) return hint;
  const candidates = ['capitol_name', 'name', 'supplier', 'supplier_name', 'partner_name'];
  for (const c of candidates) {
    if (rows[0] && c in rows[0]) return c;
  }
  throw new Error(`Cannot auto-detect supplier-name column. Available: ${Object.keys(rows[0] || {}).join(', ')}. Pass --column.`);
}

function applyFilter(rows) {
  const col = args['filter-column'];
  const val = args['filter-value'];
  if (!col || val === undefined) return rows;
  return rows.filter((r) => r[col] === val);
}

function pickBest(candidates) {
  let best = null;
  for (const cand of candidates) {
    if (cand.full_name && (!best || cand.score > (best.score || 0))) {
      best = cand;
    }
  }
  return best;
}

async function enrichOne(name) {
  const slug = slugify(name);
  const out = join(BY_NAME_DIR, `${slug}.json`);
  if (!args.force && existsSync(out)) {
    log.dbg(`skip ${name}: output exists`);
    return { skipped: true };
  }

  log.info(`enriching: ${name}`);
  const result = {
    input_name: name,
    slug,
    region: args.region,
    sources: {},
    candidates: [],
    discoveries: [],
    enriched_at: new Date().toISOString(),
  };

  // 1. DuckDuckGo
  if (!SKIP.has('ddg')) {
    const ddgResults = await ddgSearch(name, { region: args.region, limit: 10 });
    result.sources.ddg = { result_count: ddgResults.length };
    const cands = extractCandidates(name, ddgResults).map((c) => ({
      ...c,
      source: 'ddg',
    }));
    result.candidates.push(...cands);
    result.discoveries = extractDiscoveries(name, ddgResults);
    result.contact = extractContacts(name, ddgResults);
    result.sources.ddg.raw = ddgResults.slice(0, 5).map((r) => ({
      title: r.title, snippet: r.snippet, url: r.url,
    }));
    await sleep(2000);  // rate limit
  }

  // 2. DTI — exact-match only. Try the DDG-best name first (higher hit rate
  // than the raw Capitol short name); fall back to original on miss.
  if (!SKIP.has('dti')) {
    const tried = new Set();
    const ddgBest = result.candidates.find((c) => c.source === 'ddg')?.full_name;
    const queries = [];
    if (ddgBest) queries.push(ddgBest);
    queries.push(name);
    for (const q of queries) {
      const norm = q.trim().toUpperCase();
      if (tried.has(norm)) continue;
      tried.add(norm);
      try {
        const dti = await dtiSearch(q);
        result.sources.dti = dti;
        if (dti.full_name) {
          result.candidates.push({
            source: 'dti_bnrs',
            full_name: dti.full_name,
            owner: dti.owner,
            cert_no: dti.cert_no,
            registration_date: dti.registration_date,
            status: dti.status,
            territory: dti.territory,
            score: 1.0,
          });
          break;  // got a hit, stop trying variants
        }
      } catch (e) {
        log.warn(`dti failed for "${q}": ${e.message}`);
        result.sources.dti = { error: e.message };
      }
      await sleep(5000);
    }
  }

  // 3. SEC
  if (!SKIP.has('sec')) {
    try {
      const sec = await secSearch(name);
      result.sources.sec = sec;
      if (sec.full_name) {
        result.candidates.push({ source: 'sec', full_name: sec.full_name, score: 1.0 });
      }
    } catch (e) {
      log.warn(`sec failed for ${name}: ${e.message}`);
      result.sources.sec = { error: e.message };
    }
    await sleep(5000);
  }

  result.best = pickBest(result.candidates);
  writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
  return { saved: true, candidates: result.candidates.length, best: result.best };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadDiscoveriesAggregate() {
  if (existsSync(DISCOVERIES_FILE)) {
    try { return JSON.parse(readFileSync(DISCOVERIES_FILE, 'utf8')); }
    catch { return {}; }
  }
  return {};
}

function saveDiscoveriesAggregate(map) {
  writeFileSync(DISCOVERIES_FILE,
    JSON.stringify(map, null, 2), 'utf8');
}

(async () => {
  log.info(`Input: ${args.input}`);
  log.info(`Output: ${OUT}`);
  log.info(`Skip sources: ${[...SKIP].join(',') || '(none)'}`);

  const rows = applyFilter(loadInput(args.input));
  const col = pickColumn(rows, args.column);
  log.info(`Loaded ${rows.length} rows. Using column: ${col}`);

  const limit = args.limit ? Math.min(parseInt(args.limit, 10), rows.length) : rows.length;
  const slice = rows.slice(0, limit);
  log.info(`Will process ${slice.length} names`);

  let processed = 0, skipped = 0, failed = 0;
  const discoveries = loadDiscoveriesAggregate();

  for (const row of slice) {
    const name = row[col];
    if (!name) continue;
    try {
      const r = await enrichOne(name);
      if (r.skipped) { skipped++; continue; }
      processed++;
      // Merge discoveries into the global map
      const slug = slugify(name);
      const onefile = join(BY_NAME_DIR, `${slug}.json`);
      const data = JSON.parse(readFileSync(onefile, 'utf8'));
      for (const d of (data.discoveries || [])) {
        const key = d.full_name.toUpperCase();
        if (!discoveries[key]) discoveries[key] = { ...d, surfaced_in: [] };
        if (!discoveries[key].surfaced_in.includes(name)) {
          discoveries[key].surfaced_in.push(name);
        }
      }
      log.info(`done: ${name} (${r.candidates} candidates, best=${r.best?.full_name || '(none)'})`);
    } catch (e) {
      failed++;
      log.err(`fail: ${name}: ${e.message}`);
    }
  }

  saveDiscoveriesAggregate(discoveries);

  // Summary
  const total = processed + skipped + failed;
  const md = [
    '# Supplier Enrichment Summary',
    '',
    `Run at: ${new Date().toISOString()}`,
    `Input: \`${args.input}\``,
    `Output: \`${OUT}\``,
    '',
    '## Counts',
    '',
    `- Names processed this run: **${processed}**`,
    `- Names skipped (already enriched): ${skipped}`,
    `- Names failed: ${failed}`,
    `- Aggregate discovered (companies surfacing in search results): **${Object.keys(discoveries).length}**`,
    '',
    '## Files',
    '',
    `- \`by-name/<slug>.json\` — one per supplier`,
    `- \`discovered_suppliers.json\` — companies found in result snippets, not in input`,
    `- \`_audit.log\` — per-name event log`,
  ];
  writeFileSync(SUMMARY_FILE, md.join('\n'), 'utf8');
  log.info(`processed=${processed} skipped=${skipped} failed=${failed}`);
  log.info(`discoveries=${Object.keys(discoveries).length}`);
  log.info(`Summary: ${SUMMARY_FILE}`);

  await closeBrowser();
})();
