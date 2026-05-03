/**
 * PAF Procurement Watcher
 * Checks paf.mil.ph/notice-of-procurement/ for new upcoming Invitation to Bid notices.
 *
 * Usage:    node check.js
 * Schedule: Windows Task Scheduler → trigger daily, action = node check.js
 *
 * No BrowserControl, no AI, no debug port needed.
 * Launches Chrome headlessly, scrapes, parses PDFs, closes.
 *
 * State:   seen.json   — URLs already processed (skip on next run)
 * Output:  results/YYYY-MM-DD.json
 */

'use strict';

const puppeteer = require('puppeteer-core');
const pdfParse  = require('pdf-parse');
const fs        = require('fs');
const path      = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const LISTING_URL = 'https://www.paf.mil.ph/notice-of-procurement/';
const STATE_FILE  = path.join(__dirname, 'seen.json');
const RESULTS_DIR = path.join(__dirname, 'results');

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const TODAY_STR = TODAY.toISOString().split('T')[0];

const MONTH = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,june:5,july:6,
  august:7,september:8,october:9,november:10,december:11
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseDate(str) {
  if (!str) return null;
  str = str.trim().replace(/\s+/g, ' ');
  let m = str.match(/([A-Za-z]+)\s+(\d{1,2})[,\s]+(\d{4})/);
  if (m) {
    const mon = MONTH[m[1].toLowerCase().substring(0, 3)];
    if (mon !== undefined) {
      const d = new Date(+m[3], mon, +m[2]);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  m = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const mon = MONTH[m[2].toLowerCase().substring(0, 3)];
    if (mon !== undefined) {
      const d = new Date(+m[3], mon, +m[1]);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  return null;
}

function phpFormat(n) {
  if (!n && n !== 0) return 'N/A';
  return 'PHP ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function isItb2026(title) {
  const t = title.toLowerCase();
  const itb = t.includes('invitation to bid') || /\bitb\b/.test(t);
  const yr26 = /\d+-26\b/.test(title) || /-026\b/.test(title);
  return itb && yr26;
}

// ── PDF parsing ───────────────────────────────────────────────────────────────
async function parsePdfBuffer(buf) {
  const data = await pdfParse(buf);
  const t = data.text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');

  // Bid opening date
  let bidOpenDate = null;
  let bidOpenRaw  = null;
  const sec9 = t.match(/[Bb]id\s+opening\s+shall\s+be\s+on\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4})/);
  if (sec9) {
    bidOpenRaw  = sec9[1].trim();
    bidOpenDate = parseDate(bidOpenRaw);
  }

  // Location (from section 9 base name)
  let location = 'Colonel Jesus Villamor Air Base, Pasay City';
  const baseM = t.match(/((?:Colonel\s+Jesus\s+Villamor|Mactan[- ]Benito\s+Ebuen|Basa|Lipa|Edwin\s+Andrews|Daniel\s+Romualdez|Antonio\s+Bautista)[^,.\n]{0,60}(?:Air Base|Airfield)[^,.\n]{0,40})/i);
  if (baseM) location = baseM[1].trim();

  // Lots + ABC
  const lots = [];
  let totalABC = 0;
  const refPat = /PB-PAF[A-Z0-9]+-(\d+)[-_]26\s+([\s\S]+?)\s+([\d,]+\.00)\s+([\d,]+\.00)/g;
  let rm;
  while ((rm = refPat.exec(t)) !== null) {
    const desc = rm[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/^\d+\s+/, '').trim();
    const abc  = parseFloat(rm[3].replace(/,/g, ''));
    lots.push({ ref: `PB-...${rm[1]}-26`, description: desc, abc });
    totalABC += abc;
  }

  return { lots, totalABC: totalABC || null, location, bidOpenDate, bidOpenRaw };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Load seen state
  let seen = {};
  if (fs.existsSync(STATE_FILE)) {
    try { seen = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  console.log(`\nPAF Procurement Watcher — ${TODAY_STR}`);
  console.log('Launching Chrome headlessly...');

  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`Chrome not found at: ${CHROME_PATH}`);
    console.error('Set CHROME_PATH env var to your Chrome executable path.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(30000);

  // ── Step 1: fetch listing ─────────────────────────────────────────────────
  console.log('Fetching listing page...');
  await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  const allLinks = await page.evaluate((listingUrl) => {
    const seen = new Set();
    return [...document.querySelectorAll('a')]
      .filter(a => {
        const href = a.href || '';
        const text = (a.innerText || '').trim();
        return href.includes('/notice-of-procurement/') &&
               href !== listingUrl &&
               !href.endsWith('/notice-of-procurement/') &&
               text.length > 5 &&
               !a.closest('nav') && !a.closest('header') &&
               !a.closest('footer') && !a.closest('.widget') &&
               !seen.has(href) && seen.add(href);
      })
      .map(a => ({ title: (a.innerText || '').trim(), href: a.href }));
  }, LISTING_URL);

  const itbLinks = allLinks.filter(l => isItb2026(l.title));
  const newLinks  = itbLinks.filter(l => !seen[l.href]);

  console.log(`Notices on page : ${allLinks.length}`);
  console.log(`ITB 2026        : ${itbLinks.length}`);
  console.log(`New (unseen)    : ${newLinks.length}`);

  if (newLinks.length === 0) {
    console.log('\nNo new ITB notices. Nothing to check.\n');
    await browser.close();
    return;
  }

  console.log('\nChecking new notices...\n');

  const upcoming    = [];
  const alreadyPast = [];
  const noDate      = [];

  for (let i = 0; i < newLinks.length; i++) {
    const link = newLinks[i];
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${newLinks.length}] ${link.title.substring(0, 55)}... `);

    const result = { title: link.title, url: link.href };

    try {
      // Get notice page → find PDF URL
      await page.goto(link.href, { waitUntil: 'domcontentloaded' });
      await sleep(1000);

      const pdfUrl = await page.evaluate(() => {
        const a = document.querySelector('a[href*=".pdf"], a[href*=".PDF"]');
        if (a) return a.href;
        const o = document.querySelector('object[data*=".pdf"]');
        return o ? o.data : null;
      });

      if (!pdfUrl) throw new Error('No PDF found');
      result.pdfUrl = pdfUrl;

      // Download PDF via in-page fetch (bypasses server IP block)
      const b64 = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        const bytes = new Uint8Array(ab);
        let bin = '';
        for (let j = 0; j < bytes.length; j += 32768)
          bin += String.fromCharCode.apply(null, bytes.subarray(j, j + 32768));
        return btoa(bin);
      }, pdfUrl);

      const buf = Buffer.from(b64, 'base64');
      if (buf.slice(0, 4).toString() !== '%PDF') throw new Error('Downloaded bytes are not a PDF');

      const fields = await parsePdfBuffer(buf);
      Object.assign(result, fields);

      if (!fields.bidOpenDate) {
        console.log('date unknown');
        noDate.push(result);
      } else if (fields.bidOpenDate >= TODAY) {
        console.log(`UPCOMING — opens ${fields.bidOpenRaw}`);
        upcoming.push(result);
      } else {
        console.log(`past — ${fields.bidOpenRaw}`);
        alreadyPast.push(result);
      }
    } catch (e) {
      console.log(`ERROR: ${e.message.substring(0, 60)}`);
      result.error = e.message;
      noDate.push(result);
    }

    seen[link.href] = { title: link.title, checkedOn: TODAY_STR };
    await sleep(800);
  }

  await browser.close();

  // ── Save state ────────────────────────────────────────────────────────────
  fs.writeFileSync(STATE_FILE, JSON.stringify(seen, null, 2));

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  if (upcoming.length === 0) {
    console.log(`No upcoming biddings in today's new notices (${newLinks.length} checked).`);
    console.log('All bid openings are either past or dates could not be parsed.');
  } else {
    console.log(`UPCOMING BIDDINGS FOUND: ${upcoming.length}`);
    console.log('═'.repeat(70));
    upcoming.forEach((r, i) => {
      console.log(`\n[${i+1}] ${r.title}`);
      console.log(`  Bid Opening : ${r.bidOpenRaw}`);
      console.log(`  Location    : ${r.location}`);
      console.log(`  Total ABC   : ${phpFormat(r.totalABC)}`);
      if (r.lots?.length) {
        r.lots.forEach(l =>
          console.log(`    • ${l.description.substring(0, 80)}\n      ABC: ${phpFormat(l.abc)}`));
      }
      console.log(`  Page : ${r.url}`);
      console.log(`  PDF  : ${r.pdfUrl}`);
    });
  }
  console.log('═'.repeat(70));
  console.log(`\nSummary: ${upcoming.length} upcoming | ${alreadyPast.length} already past | ${noDate.length} date unknown`);

  // Save results
  const outFile = path.join(RESULTS_DIR, `${TODAY_STR}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ date: TODAY_STR, upcoming, alreadyPast, noDate }, null, 2));
  console.log(`Saved: ${outFile}\n`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
