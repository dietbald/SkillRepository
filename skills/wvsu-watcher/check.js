'use strict';

/**
 * WVSU BAC Watcher
 * Checks wvsu.edu.ph/bids-and-awards-committee/ for new procurement notices.
 *
 * Usage:    node check.js
 * Schedule: Windows Task Scheduler → daily, action = run.bat
 *
 * Note: WVSU PDFs are scanned images — deadlines are estimated from posting date.
 *   RFQ: ~10-day window | IB/ITB: ~45-day window
 *
 * State:  seen.json          — notices already processed
 * Output: results/YYYY-MM-DD.json
 */

const puppeteer = require('puppeteer-core');
const fs        = require('fs');
const path      = require('path');

const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const LISTING_URL = 'https://wvsu.edu.ph/bids-and-awards-committee/';
const STATE_FILE  = path.join(__dirname, 'seen.json');
const RESULTS_DIR = path.join(__dirname, 'results');

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const TODAY_STR = TODAY.toISOString().split('T')[0];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function parsePostedDate(str) {
  // MM/DD/YYYY
  const m = str && str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const d = new Date(+m[3], +m[1] - 1, +m[2]);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function estimateStatus(notice) {
  const d = parsePostedDate(notice.datePosted);
  if (!d) return 'unknown';
  const daysSince = Math.floor((TODAY - d) / 86400000);
  const isIb = /\bib\b|itb|invitation/i.test(notice.rfqNo + ' ' + notice.title);
  return daysSince <= (isIb ? 45 : 10) ? 'possibly-open' : 'likely-closed';
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  let seen = {};
  if (fs.existsSync(STATE_FILE)) {
    try { seen = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  console.log(`\nWVSU BAC Watcher — ${TODAY_STR}`);
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

  console.log('Fetching listing page...');
  await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded' });
  await sleep(4000);

  const notices = await page.evaluate(() => {
    const results = [];
    let current = null;
    // Known column header text — skip rows where the value cell contains these
    const isHeaderText = t => /^(?:project\s*name|rfq\s*\/|ib\s*\/|campus\/|date\s*posted|bid\s*bulletin)/i.test(t.trim());

    for (const row of document.querySelectorAll('tr')) {
      // Use direct children only — each record renders as 4 separate 2-cell rows (mobile layout)
      const cells = [...row.children].filter(c => c.tagName === 'TD' || c.tagName === 'TH');
      if (cells.length !== 2) continue;

      const label = cells[0].innerText.trim();
      const valueCell = cells[1];
      const valueText = valueCell.innerText.trim().replace(/\s+/g, ' ');
      const pdfLinks = [...valueCell.querySelectorAll('a[href*=".pdf"], a[href*=".PDF"]')].map(a => a.href);

      if (/project\s*name/i.test(label)) {
        // Skip if value is also a column header label or too short
        if (isHeaderText(valueText) || valueText.length < 5) continue;
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
        }
      }
    }
    if (current && current.title && current.datePosted) results.push(current);
    return results;
  });

  await browser.close();

  const newNotices = notices.filter(n => !seen[n.rfqNo || n.title]);

  console.log(`Notices on page : ${notices.length}`);
  console.log(`New (unseen)    : ${newNotices.length}`);

  if (newNotices.length === 0) {
    console.log('\nNo new notices. Nothing to check.\n');
    return;
  }

  console.log('\nNew notices:\n');
  const possiblyOpen  = [];
  const likelyClosed  = [];

  for (const n of newNotices) {
    const status = estimateStatus(n);
    const key = n.rfqNo || n.title;
    const tag = status === 'possibly-open' ? 'OPEN?' : 'CLOSED?';
    process.stdout.write(`[${tag}] ${n.title.substring(0, 60)}\n`);
    console.log(`  Ref     : ${n.rfqNo || '(none)'}`);
    console.log(`  Campus  : ${n.campus}`);
    console.log(`  Posted  : ${n.datePosted}`);
    if (n.pdfUrl) console.log(`  PDF     : ${n.pdfUrl}`);
    console.log();

    (status === 'possibly-open' ? possiblyOpen : likelyClosed).push(n);
    seen[key] = { title: n.title, checkedOn: TODAY_STR };
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(seen, null, 2));

  console.log('═'.repeat(70));
  console.log(`Summary: ${possiblyOpen.length} possibly open | ${likelyClosed.length} likely closed`);
  console.log('(Deadlines estimated: RFQ ≈10 days from posting, IB/ITB ≈45 days)');
  console.log('═'.repeat(70));

  const outFile = path.join(RESULTS_DIR, `${TODAY_STR}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ date: TODAY_STR, possiblyOpen, likelyClosed }, null, 2));
  console.log(`\nSaved: ${outFile}\n`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
