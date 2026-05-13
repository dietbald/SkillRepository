#!/usr/bin/env node
/**
 * DTI BNRS lookup — single name or batch CSV.
 *
 *   Single:
 *     node src/lookup.js "3 KEYS BUILDERS AND SUPPLY"
 *
 *   Batch:
 *     node src/lookup.js --batch suppliers.csv \
 *         --name-column capitol_name \
 *         --output suppliers_dti.csv
 *
 *   Options:
 *     --batch <file>          Input CSV
 *     --name-column <col>     Column with the supplier name (auto-detect if omitted)
 *     --output <file>         Output CSV (required with --batch)
 *     --max <N>               Stop after N rows (for testing)
 *     --skip-empty            Skip blank names
 *     --debug-dti             Save before/after screenshots to temp
 *
 *  Cost note: each lookup consumes one 2Captcha solve (~$0.001).
 *  Rate limit: 1.5 s between lookups (in addition to captcha solve time).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import minimist from 'minimist';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

import { dtiSearch } from './lib/dti.js';
import { closeBrowser } from './lib/browser.js';
import { log } from './lib/log.js';
import { getApiKey, balance } from './lib/captcha.js';

const RATE_LIMIT_MS = 1500;

function fail(msg) { console.error(msg); process.exit(2); }

async function singleLookup(name) {
  const r = await dtiSearch(name);
  console.log(JSON.stringify(r, null, 2));
}

async function batchLookup({ inputPath, nameColumn, outputPath, max, skipEmpty }) {
  if (!existsSync(inputPath)) fail(`input not found: ${inputPath}`);
  const raw = readFileSync(inputPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  if (rows.length === 0) fail('empty CSV');
  const fields = Object.keys(rows[0]);
  if (!nameColumn) {
    for (const c of ['supplier_name', 'capitol_name', 'name', 'company', 'vendor', 'business_name']) {
      if (fields.includes(c)) { nameColumn = c; break; }
    }
    if (!nameColumn) fail(`Could not auto-detect name column. Columns: ${fields.join(', ')}`);
  }

  const newCols = ['dti_business_name', 'dti_owner_name', 'dti_cert_no',
                   'dti_registration_date', 'dti_status', 'dti_territory',
                   'dti_scope', 'dti_note'];
  const outFields = [...fields, ...newCols.filter((c) => !fields.includes(c))];

  const bal = await balance();
  if (bal !== null) log.info(`2Captcha balance: $${bal.toFixed(3)}`);

  mkdirSync(dirname(outputPath) || '.', { recursive: true });
  const todo = max ? rows.slice(0, max) : rows;
  const out = [];
  for (let i = 0; i < todo.length; i++) {
    const row = todo[i];
    const name = (row[nameColumn] || '').trim();
    if (!name && skipEmpty) {
      out.push({ ...row });
      continue;
    }
    log.info(`[${i + 1}/${todo.length}] ${name}`);
    if (!name) {
      out.push({ ...row, dti_note: 'empty_input' });
      continue;
    }
    let r;
    try {
      r = await dtiSearch(name);
    } catch (e) {
      r = { note: `error: ${e.message}`, candidates: [] };
    }
    const c0 = (r.candidates && r.candidates[0]) || {};
    out.push({
      ...row,
      dti_business_name: c0.business_name || '',
      dti_owner_name: c0.owner_name || '',
      dti_cert_no: c0.cert_no || '',
      dti_registration_date: c0.registration_date || '',
      dti_status: c0.status || '',
      dti_territory: c0.territory || '',
      dti_scope: c0.scope || '',
      dti_note: r.note || '',
    });
    // Persist after each row so we can resume after a crash
    writeFileSync(outputPath, stringify(out, { header: true, columns: outFields }), 'utf8');
    if (i + 1 < todo.length) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }
  log.info(`Wrote ${outputPath} (${out.length} rows)`);
}

(async () => {
  const argv = minimist(process.argv.slice(2), {
    string: ['batch', 'name-column', 'output'],
    boolean: ['skip-empty', 'debug-dti'],
    alias: { 'name-column': 'nameColumn', 'debug-dti': 'debugDti' },
  });
  if (argv.debugDti) process.env.DEBUG_DTI = '1';

  if (!getApiKey()) fail('Missing 2Captcha API key. Place in ~/.config/2captcha/api-key or set TWOCAPTCHA_API_KEY env var.');

  try {
    if (argv.batch) {
      if (!argv.output) fail('--output is required with --batch');
      await batchLookup({
        inputPath: argv.batch,
        nameColumn: argv.nameColumn,
        outputPath: argv.output,
        max: argv.max ? parseInt(argv.max, 10) : null,
        skipEmpty: argv.skipEmpty,
      });
    } else {
      const name = argv._.join(' ').trim();
      if (!name) fail('Usage: lookup.js "BUSINESS NAME"  |  --batch in.csv --output out.csv');
      await singleLookup(name);
    }
  } finally {
    await closeBrowser();
  }
})();
