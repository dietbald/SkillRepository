'use strict';

const puppeteer    = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const { execFile } = require('child_process');

const BASE    = 'https://coastguard.gov.ph';
const SEEN_F  = path.join(__dirname, 'seen.json');
const RES_DIR = path.join(__dirname, 'results');

const cfCookie = JSON.parse(fs.readFileSync(path.join(__dirname, 'cf_clearance.json'), 'utf8'));

const DEBUG_PORT   = 9223;
const USER_DATA    = 'C:\\ChromeDebugPCG';
const MONTHS_BACK  = 3;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function monthName(n) {
  return ['january','february','march','april','may','june',
          'july','august','september','october','november','december'][n];
}

function targetMonths() {
  const now = new Date();
  const months = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: monthName(d.getMonth()) });
  }
  return months;
}

function checkDebugPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

async function ensureChrome() {
  // Check if debug port is already up
  const running = await checkDebugPort(DEBUG_PORT);
  if (running) {
    console.log(`  Chrome already running (${running.Browser})`);
    return false; // didn't launch
  }

  // Find Chrome executable
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  // Also check puppeteer cache
  const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(cacheDir)) {
    const builds = fs.readdirSync(cacheDir).sort().reverse();
    for (const b of builds) {
      const c = path.join(cacheDir, b, 'chrome-win64', 'chrome.exe');
      if (fs.existsSync(c)) { candidates.unshift(c); break; }
    }
  }

  const chromePath = candidates.find(c => fs.existsSync(c));
  if (!chromePath) throw new Error('Chrome not found');

  console.log(`  Launching Chrome: ${chromePath}`);
  execFile(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--no-first-run',
    '--no-default-browser-check',
  ]);

  // Wait for it to be ready
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const v = await checkDebugPort(DEBUG_PORT);
    if (v) { console.log(`  Chrome ready (${v.Browser})`); return true; }
  }
  throw new Error('Chrome failed to start on port ' + DEBUG_PORT);
}

function parseArticleLinks(html) {
  const re = /<h2[^>]*itemprop="name"[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].startsWith('http') ? m[1] : BASE + m[1];
    const title = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (title.length > 5) results.push({ href, title });
  }
  return results;
}

function parsePdfLinks(html) {
  // Scope to id="content" to avoid navigation/sidebar PDFs
  const contentMatch = html.match(/id="content"[\s\S]*/) ;
  const scope = contentMatch ? contentMatch[0] : html;
  const re = /href="([^"]*\.pdf[^"]*)"/gi;
  const links = [];
  let m;
  while ((m = re.exec(scope)) !== null) {
    const href = m[1].startsWith('http') ? m[1] : BASE + m[1];
    if (href.includes('coastguard.gov.ph')) links.push(href);
  }
  return [...new Set(links)];
}

function parseDetailBody(html) {
  // Scope to content area to avoid navigation clutter
  const contentMatch = html.match(/id="content"([\s\S]*)/);
  const scope = contentMatch ? contentMatch[1] : html;
  const text = scope.replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ').trim().substring(0, 3000);
  const pdfs = parsePdfLinks(html);
  return { text, pdfs };
}

function extractDates(text) {
  const patterns = [
    /(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})/gi,
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/gi,
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
  ];
  const dates = [];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) dates.push(m[0].trim());
  }
  return [...new Set(dates)].slice(0, 5);
}

async function tryPdfParse(buf) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buf);
    return data.text ? data.text.substring(0, 3000) : '';
  } catch {
    return '';
  }
}

async function downloadViaBrowser(page, reqUrl) {
  // Download binary via browser's fetch (same session/cookies as navigation)
  const result = await page.evaluate(async (pdfUrl) => {
    try {
      const resp = await fetch(pdfUrl, { credentials: 'include' });
      if (!resp.ok) return { status: resp.status, data: null };
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return { status: resp.status, data: btoa(binary) };
    } catch (e) {
      return { status: 0, error: e.message, data: null };
    }
  }, reqUrl);
  if (!result.data) return { status: result.status || 0, body: Buffer.alloc(0) };
  return { status: result.status, body: Buffer.from(result.data, 'base64') };
}

async function main() {
  if (!fs.existsSync(RES_DIR)) fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);
  const months = targetMonths();

  console.log(`PCG Watcher — ${today}`);
  console.log(`Checking months: ${months.map(m => `${m.year}/${m.month}`).join(', ')}`);

  await ensureChrome();

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${DEBUG_PORT}`,
    defaultViewport: null,
  });

  // Find or create a page
  let pages = await browser.pages();
  let page = pages.find(p => p.url().includes('coastguard.gov.ph'));
  if (!page) page = pages[0] || await browser.newPage();

  // Ensure cf_clearance is set
  await page.setCookie({
    name: cfCookie.name,
    value: cfCookie.value,
    domain: cfCookie.domain,
    path: cfCookie.path || '/',
    httpOnly: cfCookie.httpOnly || false,
    secure: cfCookie.secure || true,
    sameSite: cfCookie.sameSite || 'None',
  });

  const newArticles = [];

  for (const { year, month } of months) {
    const pageUrl = `${BASE}/index.php/related-links/bidding-opportunities/${year}/${month}`;
    console.log(`\nFetching ${year}/${month}...`);
    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await sleep(1500);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      continue;
    }

    const title = await page.title();
    if (/just a moment/i.test(title)) {
      console.log('  BLOCKED — cf_clearance expired or IP changed. Re-solve manually.');
      continue;
    }

    const html = await page.content();
    const articles = parseArticleLinks(html);
    console.log(`  ${articles.length} articles`);

    for (const art of articles) {
      const id = art.href.split('/').pop();
      if (seen[id]) continue;

      console.log(`  NEW: ${art.title}`);
      let detail = { ...art, id, year, month, foundDate: today, pdfs: [], text: '', dates: [] };

      try {
        await page.goto(art.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(1000);
        const detailHtml = await page.content();
        const { text, pdfs } = parseDetailBody(detailHtml);
        detail.text = text;
        detail.pdfs = pdfs;
        detail.dates = extractDates(text);
      } catch (e) {
        detail.error = e.message;
      }

      newArticles.push(detail);
      seen[id] = today;
      await sleep(800);
    }
  }

  fs.writeFileSync(SEEN_F, JSON.stringify(seen, null, 2));

  if (newArticles.length === 0) {
    console.log('\nNo new articles found.');
  } else {
    console.log(`\n=== ${newArticles.length} NEW ARTICLE(S) ===`);
    for (const a of newArticles) {
      console.log(`\n[${a.year}/${a.month}] ${a.title}`);
      console.log(`  URL: ${a.href}`);
      if (a.dates?.length) console.log(`  Dates: ${a.dates.join(', ')}`);
      if (a.pdfs?.length) {
        console.log(`  PDFs: ${a.pdfs.length}`);
        a.pdfs.forEach(p => console.log(`    ${p}`));
      }
      if (a.text) console.log(`  Preview: ${a.text.substring(0, 250).replace(/\s+/g, ' ')}...`);
    }

    // Download PDFs via browser fetch (session cookies bypass Cloudflare)
    for (const a of newArticles) {
      for (const pdfUrl of (a.pdfs || []).slice(0, 3)) {
        console.log(`\n  PDF: ${path.basename(new URL(pdfUrl).pathname)}`);
        try {
          const pdfRes = await downloadViaBrowser(page, pdfUrl);
          if (pdfRes.status === 200 && pdfRes.body.length > 500) {
            const fname = path.basename(new URL(pdfUrl).pathname);
            const savePath = path.join(RES_DIR, fname);
            fs.writeFileSync(savePath, pdfRes.body);
            console.log(`    Saved ${(pdfRes.body.length/1024).toFixed(0)} KB`);
            const pdfText = await tryPdfParse(pdfRes.body);
            if (pdfText) {
              a.pdfText = (a.pdfText || '') + `\n\n[${fname}]\n` + pdfText.substring(0, 2000);
              console.log(`    ${pdfText.substring(0, 200).replace(/\s+/g, ' ')}`);
            } else {
              console.log('    (scanned PDF)');
            }
          } else {
            console.log(`    HTTP ${pdfRes.status}`);
          }
        } catch (e) {
          console.log(`    ERROR: ${e.message}`);
        }
      }
    }
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newArticles.length, articles: newArticles }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
