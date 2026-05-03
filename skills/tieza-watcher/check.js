'use strict';

/**
 * TIEZA Bidding Watcher
 * Checks tieza.gov.ph WordPress category pages for new procurement notices.
 * Downloads and parses PDFs to extract bid opening dates.
 *
 * Usage:    node check.js
 * Schedule: Windows Task Scheduler → daily, action = run.bat
 *
 * State:  seen.json          — post URLs already processed
 * Output: results/YYYY-MM-DD.json
 */

const puppeteer = require('puppeteer-core');
const pdfParse  = require('pdf-parse');
const https     = require('https');
const fs        = require('fs');
const path      = require('path');

const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const CATEGORIES = [
  'https://tieza.gov.ph/category/public-bidding/infrastructure/',
  'https://tieza.gov.ph/category/public-bidding/consultancy/',
  'https://tieza.gov.ph/category/request-for-quotation/',
];

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
  m = str.match(/(\d{1,2})\s+([A-Za-z]+)[,\s]+(\d{4})/);
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

function httpsGetBuf(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGetBuf(res.headers.location));
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function parsePdfBuf(buf) {
  const data = await pdfParse(buf);
  const t = data.text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');

  let bidOpenDate = null;
  let bidOpenRaw  = null;

  // Philippine Bidding Documents patterns (PBD and RFQ)
  const patterns = [
    /[Tt]he\s+date\s+and\s+time\s+of\s+bid\s+opening\s+is\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    /[Tt]he\s+deadline\s+for\s+submission\s+of\s+bids\s+is\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    /[Bb]id\s+opening\s+shall\s+be\s+on\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    /[Oo]pening\s+of\s+[Bb]ids[^:]*:\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    /[Ss]ubmission\s+(?:and\s+[Rr]eceipt\s+of\s+[Bb]ids?)[^:]*:\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    // RFQ form: "not later than DD Month, YYYY"
    /not\s+later\s+than\s+(\d{1,2}\s+[A-Za-z]+,?\s+\d{4})/i,
    /not\s+later\s+than\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /[Oo]n\s+or\s+before\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4})/,
    /[Oo]n\s+or\s+before\s+(\d{1,2}\s+[A-Za-z]+,?\s*\d{4})/,
  ];

  for (const pat of patterns) {
    const m = t.match(pat);
    if (m) {
      bidOpenRaw  = m[1].trim().replace(/\s+/g, ' ');
      bidOpenDate = parseDate(bidOpenRaw);
      if (bidOpenDate) break;
    }
  }

  // ABC extraction
  let totalABC = null;
  const abcM = t.match(/[Aa]pproved\s+[Bb]udget[^:]*:?\s*(?:PHP|PhP|₱)?\s*([\d,]+(?:\.\d+)?)/);
  if (abcM) totalABC = parseFloat(abcM[1].replace(/,/g, ''));

  return { bidOpenDate, bidOpenRaw, totalABC };
}

function phpFormat(n) {
  if (!n && n !== 0) return 'N/A';
  return 'PHP ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

async function scrapeCategory(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await sleep(3000);
  // Dismiss cookie consent if present (blocks content in fresh headless sessions)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => /accept all|accept|got it/i.test(b.innerText || ''));
    if (btn) btn.click();
  }).catch(() => {});
  await sleep(1000);
  // Wait until articles actually appear (handles lazy-rendered pages)
  await page.waitForFunction(() => document.querySelectorAll('article').length > 0, { timeout: 15000 })
    .catch(() => {});
  return await page.evaluate(() => {
    const posts = [...document.querySelectorAll('article, .post, .hentry')]
      .map(el => ({
        title: (el.querySelector('h1,h2,h3,.entry-title,.post-title')?.innerText || '').trim(),
        url:   el.querySelector('h2 a, h3 a, .entry-title a, a')?.href || '',
        date:  (el.querySelector('time,.entry-date,.post-date')?.getAttribute('datetime') ||
                el.querySelector('time,.entry-date,.post-date')?.innerText || '').trim(),
      }))
      .filter(a => a.title.length > 3 && a.url && a.url.includes('tieza.gov.ph'));
    // Fallback: entry-title links if article selector found nothing
    if (posts.length === 0) {
      return [...document.querySelectorAll('h2.entry-title a, h3.entry-title a')]
        .map(a => ({ title: a.innerText.trim(), url: a.href, date: '' }))
        .filter(a => a.title.length > 3);
    }
    return posts;
  });
}

async function getPostPdfUrl(page, postUrl) {
  await page.goto(postUrl, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  return await page.evaluate(() => {
    const pdfs = [...document.querySelectorAll('a[href*=".pdf"], a[href*=".PDF"]')]
      .filter(a => !/organizational|staffing|chart|pattern/i.test(a.href));
    // Priority: bidding docs PDF > RFQ form PDF > any other PDF
    const bidDoc = pdfs.find(a => /bid.*doc|pbd/i.test(a.innerText || a.href));
    const rfqForm = pdfs.find(a => /^request for quotation$/i.test((a.innerText || '').trim()) ||
                                    /\bRFQ\b(?!.*BOQ|.*plan|.*spec)/i.test(a.href));
    return (bidDoc || rfqForm || pdfs[0])?.href || null;
  });
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  let seen = {};
  if (fs.existsSync(STATE_FILE)) {
    try { seen = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  console.log(`\nTIEZA Bidding Watcher — ${TODAY_STR}`);
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

  // Warm up: fresh headless sessions hit a splash page ("Enter Website") that blocks content.
  // Clicking it sets the session cookie so subsequent category navigations show real archives.
  console.log('Warming up session (Enter Website splash)...');
  await page.goto('https://tieza.gov.ph/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await sleep(2000);
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find(a => /enter website/i.test(a.innerText || ''));
    if (a) a.click();
  }).catch(() => {});
  await sleep(2000);

  // Collect all posts across categories
  const allPosts = [];
  for (const catUrl of CATEGORIES) {
    const label = catUrl.split('/category/')[1]?.replace(/\//g, ' ').trim() || catUrl;
    console.log(`Scanning ${label}...`);
    const posts = await scrapeCategory(page, catUrl);
    console.log(`  ${posts.length} posts found`);
    for (const p of posts) {
      if (!allPosts.find(x => x.url === p.url)) allPosts.push({ ...p, category: label });
    }
  }

  const newPosts = allPosts.filter(p => !seen[p.url]);
  console.log(`\nTotal posts    : ${allPosts.length}`);
  console.log(`New (unseen)   : ${newPosts.length}`);

  if (newPosts.length === 0) {
    console.log('\nNo new posts. Nothing to check.\n');
    await browser.close();
    return;
  }

  console.log('\nChecking new posts...\n');

  const upcoming    = [];
  const alreadyPast = [];
  const noDate      = [];

  for (let i = 0; i < newPosts.length; i++) {
    const post = newPosts[i];
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${newPosts.length}] ${post.title.substring(0, 55)}... `);

    const result = { title: post.title, url: post.url, postDate: post.date, category: post.category };

    try {
      const pdfUrl = await getPostPdfUrl(page, post.url);
      if (!pdfUrl) throw new Error('No PDF found on post page');
      result.pdfUrl = pdfUrl;

      const buf = await httpsGetBuf(pdfUrl);
      if (buf.slice(0, 4).toString() !== '%PDF') throw new Error('Downloaded bytes are not a PDF');

      const fields = await parsePdfBuf(buf);
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

    seen[post.url] = { title: post.title, checkedOn: TODAY_STR };
    await sleep(1000);
  }

  await browser.close();
  fs.writeFileSync(STATE_FILE, JSON.stringify(seen, null, 2));

  console.log('\n' + '═'.repeat(70));
  if (upcoming.length === 0) {
    console.log(`No upcoming biddings in today's new posts (${newPosts.length} checked).`);
  } else {
    console.log(`UPCOMING BIDDINGS FOUND: ${upcoming.length}`);
    console.log('═'.repeat(70));
    upcoming.forEach((r, i) => {
      console.log(`\n[${i+1}] ${r.title}`);
      console.log(`  Category    : ${r.category}`);
      console.log(`  Bid Opening : ${r.bidOpenRaw}`);
      console.log(`  Total ABC   : ${phpFormat(r.totalABC)}`);
      console.log(`  Post        : ${r.url}`);
      if (r.pdfUrl) console.log(`  PDF         : ${r.pdfUrl}`);
    });
  }
  console.log('═'.repeat(70));
  console.log(`\nSummary: ${upcoming.length} upcoming | ${alreadyPast.length} already past | ${noDate.length} date unknown`);

  const outFile = path.join(RESULTS_DIR, `${TODAY_STR}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ date: TODAY_STR, upcoming, alreadyPast, noDate }, null, 2));
  console.log(`Saved: ${outFile}\n`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
