'use strict';

/**
 * WVSU BAC Watcher
 * Checks wvsu.edu.ph/bids-and-awards-committee/ for new procurement notices.
 *
 * Page is JavaScript-rendered (AJAX pagination) — requires Puppeteer.
 * Connects to Chrome on port 9223 if available, otherwise launches headless Chrome.
 *
 * State:  seen.json
 * Output: results/YYYY-MM-DD.json
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const http = require('http');
const fs   = require('fs');
const path = require('path');

const CHROME_PATH  = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LISTING_URL  = 'https://wvsu.edu.ph/about-wvsu/good-governance/bids-and-awards-committee/';
const STATE_FILE   = path.join(__dirname, 'seen.json');
const RESULTS_DIR  = path.join(__dirname, 'results');
const TODAY_STR    = new Date().toISOString().slice(0, 10);
const TODAY        = new Date(TODAY_STR);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CONSTRUCTION_KW = [
  'rehabilitation', 'construction', 'civil works', 'repair of', 'building',
  'infrastructure', 'perimeter', 'fence', 'guardhouse', 'flooring',
  'roofing', 'painting', 'renovation', 'installation', 'improvement of',
  'concreting', 'drainage', 'road', 'pavement', 'electrical', 'plumbing',
  'engineering plans', 'engineering design', 'engineering services',
  'consultancy for.*construction', 'multi-storey', 'multi-story',
  'library building', 'gymnasium', 'dormitory', 'dorm',
];

function isConstruction(title, rfqNo) {
  const t = (title + ' ' + rfqNo).toLowerCase();
  return CONSTRUCTION_KW.some(k => new RegExp(k).test(t));
}

function parsePostedDate(str) {
  const m = str && str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
  return null;
}

function estimateStatus(notice) {
  const d = parsePostedDate(notice.datePosted);
  if (!d) return 'unknown';
  const daysSince = Math.floor((TODAY - d) / 86400000);
  const isIb = /\bib\b|itb|invitation/i.test(notice.rfqNo + ' ' + notice.title);
  return daysSince <= (isIb ? 45 : 10) ? 'possibly-open' : 'likely-closed';
}

function checkPort9223() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:9223/json/version', res => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function extractPage(page) {
  return page.evaluate(() => {
    const results = [];
    let current = null;
    for (const row of document.querySelectorAll('tr')) {
      const cells = [...row.children].filter(c => c.tagName === 'TD' || c.tagName === 'TH');
      if (cells.length !== 2) continue;
      const label     = cells[0].innerText.trim();
      const valueCell = cells[1];
      const valueText = valueCell.innerText.trim().replace(/\s+/g, ' ');
      const pdfLinks  = [...valueCell.querySelectorAll('a[href]')]
        .filter(a => a.href && (a.href.includes('.pdf') || a.href.includes('.PDF')))
        .map(a => a.href);

      if (/project\s*name/i.test(label)) {
        if (valueText.length < 5 || /^project\s*name/i.test(valueText)) continue;
        if (current && current.title && current.datePosted) results.push(current);
        current = { title: valueText, rfqNo: '', pdfUrl: null, campus: '', datePosted: '' };
      } else if (current) {
        if (/rfq|ib\b|rei/i.test(label)) {
          current.rfqNo = valueText;
          if (pdfLinks.length) current.pdfUrl = pdfLinks[0];
        } else if (/campus/i.test(label)) {
          current.campus = valueText;
        } else if (/date\s*posted/i.test(label)) {
          current.datePosted = valueText;
          if (pdfLinks.length && !current.pdfUrl) current.pdfUrl = pdfLinks[0];
        }
      }
    }
    if (current && current.title && current.datePosted) results.push(current);
    return results;
  });
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  let seen = {};
  if (fs.existsSync(STATE_FILE)) {
    try { seen = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  console.log(`\nWVSU BAC Watcher — ${TODAY_STR}`);

  let browser, ownBrowser = false;
  const port9223 = await checkPort9223();
  if (port9223) {
    console.log('Connecting to Chrome on port 9223...');
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null, protocolTimeout: 60000 });
  } else {
    console.log('Launching headless Chrome...');
    if (!fs.existsSync(CHROME_PATH)) { console.error(`Chrome not found: ${CHROME_PATH}`); process.exit(1); }
    browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    ownBrowser = true;
  }

  const pages = await browser.pages();
  const page  = pages.find(p => p.url().includes('wvsu.edu.ph')) || pages[0] || await browser.newPage();
  if (!page.url().includes('wvsu.edu.ph')) {
    console.log('Navigating to WVSU BAC...');
    await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
  } else {
    await page.bringToFront();
    await sleep(1000);
  }

  // Collect entries from page 1 (newest entries — sufficient for daily monitoring)
  let allNotices = await extractPage(page);
  console.log(`Page 1: ${allNotices.length} entries`);

  // Only scrape more pages if seen.json is empty (initial seed run)
  const isInitialRun = Object.keys(seen).length === 0;
  if (isInitialRun) {
    console.log('Initial run — scraping additional pages for seeding...');
    for (let p = 2; p <= 5; p++) {
      const nextBtn = await page.$(`a[data-page="${p}"], button[data-page="${p}"]`);
      if (nextBtn) {
        await nextBtn.click();
      } else {
        // Try clicking paginator by innerText
        const clicked = await page.evaluate((pageNum) => {
          const btns = [...document.querySelectorAll('a, button')];
          const btn = btns.find(b => b.innerText?.trim() === String(pageNum) && b.href?.includes('#'));
          if (btn) { btn.click(); return true; }
          return false;
        }, p);
        if (!clicked) break;
      }
      await sleep(2000);
      const more = await extractPage(page);
      console.log(`Page ${p}: ${more.length} entries`);
      allNotices = allNotices.concat(more);
    }
  }

  if (ownBrowser) await browser.close();

  // Deduplicate within this run
  const seen_this_run = new Set();
  const uniqueNotices = allNotices.filter(n => {
    const k = n.rfqNo || n.title;
    if (seen_this_run.has(k)) return false;
    seen_this_run.add(k);
    return true;
  });

  const newNotices = uniqueNotices.filter(n => !seen[n.rfqNo || n.title]);
  console.log(`Total entries: ${uniqueNotices.length} | New: ${newNotices.length}`);

  if (newNotices.length === 0) {
    console.log('\nNo new notices.\n');
    fs.writeFileSync(path.join(RESULTS_DIR, `${TODAY_STR}.json`), JSON.stringify({ date: TODAY_STR, newCount: 0, notices: [] }, null, 2));
    return;
  }

  console.log('\nNew notices:\n');
  const possiblyOpen = [];
  const likelyClosed = [];

  for (const n of newNotices) {
    const status = estimateStatus(n);
    const construction = isConstruction(n.title, n.rfqNo);
    const key = n.rfqNo || n.title;
    const tag = status === 'possibly-open' ? 'OPEN?' : 'CLOSED?';
    const ctag = construction ? ' [CONSTRUCTION]' : '';
    console.log(`[${tag}]${ctag} ${n.title.substring(0, 80)}`);
    console.log(`  Ref     : ${n.rfqNo || '(none)'}`);
    console.log(`  Campus  : ${n.campus}`);
    console.log(`  Posted  : ${n.datePosted}`);
    if (n.pdfUrl) console.log(`  PDF     : ${n.pdfUrl}`);
    console.log();

    (status === 'possibly-open' ? possiblyOpen : likelyClosed).push({ ...n, construction });
    seen[key] = { title: n.title, checkedOn: TODAY_STR };
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(seen, null, 2));

  console.log('═'.repeat(70));
  const openConstruction = possiblyOpen.filter(n => n.construction);
  if (openConstruction.length) {
    console.log(`\n** ${openConstruction.length} OPEN CONSTRUCTION/INFRA NOTICES **`);
    openConstruction.forEach(n => {
      console.log(`  ${n.rfqNo} — ${n.title}`);
      if (n.pdfUrl) console.log(`  ${n.pdfUrl}`);
    });
  }
  console.log(`\nSummary: ${possiblyOpen.length} possibly open | ${likelyClosed.length} likely closed`);
  console.log('(Deadlines estimated: RFQ ≈10 days, IB/ITB ≈45 days from posting)');
  console.log('═'.repeat(70));

  const outFile = path.join(RESULTS_DIR, `${TODAY_STR}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ date: TODAY_STR, newCount: newNotices.length, possiblyOpen, likelyClosed }, null, 2));
  console.log(`\nSaved: ${outFile}\n`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
