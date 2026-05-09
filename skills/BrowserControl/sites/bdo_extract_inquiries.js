// BDO BOB — Inquiry archives extractor (multi-year history of OUTGOING transactions).
//
// The Inquiry tabs under each action menu hold ~5 years of records — far longer than
// the Account Services TxnHist 92-day cap. This script sweeps all 5 inquiry types
// and downloads PDF + XLS + CSV reports for each one that has data.
//
// Coverage:
//   FC9230 Fund Transfer - Own
//   FC9240 Fund Transfer - Other Party    ← typically has data
//   FC9260 Wire Transfer
//   FC9339 Outward Payment                ← BICC's main disbursement archive
//   FC9331 Bills Payment
//
// .env keys consumed: BDO_BOB_CORP_CD, BDO_BOB_USER_CD, BDO_BOB_PSWD, BDO_BOB_OUTPUT_DIR (optional)
//
// Run modes:
//   node bdo_extract_inquiries.js                            # interactive — own Chrome + OTP
//   node bdo_extract_inquiries.js --connect 9222             # attach to existing Chrome
//   node bdo_extract_inquiries.js --from 01/01/2020 --to 05/09/2026   # custom range

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const HOME = os.homedir();
const ENV_PATH = path.join(HOME, '.claude', 'skills', 'BrowserControl', '.env');
const CHROME_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome';
const PROFILE_DIR = path.join(os.tmpdir(), 'ChromeDebugBDO');

const PAGES = [
  { menu: 'Fund Transfer - Own',          fc: 'FC9230', tab: 'Fund Transfer Inquiry'   },
  { menu: 'Fund Transfer - Other Party',  fc: 'FC9240', tab: 'Fund Transfer Inquiry'   },
  { menu: 'Wire Transfer',                fc: 'FC9260', tab: 'Wire Transfer Inquiry'   },
  { menu: 'Outward Payment',              fc: 'FC9339', tab: 'Outward Payment Inquiry' },
  { menu: 'Bills Payment',                fc: 'FC9331', tab: 'Bills Payment Inquiry'   },
];

const args = process.argv.slice(2);
const argVal = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };
const CONNECT_PORT = argVal('--connect');
const today = new Date();
const fmtMDY = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
const fmtYMD = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const FROM = argVal('--from') || '01/01/2020';
const TO   = argVal('--to')   || fmtMDY(today);

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) throw new Error('.env not found: ' + ENV_PATH);
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ['BDO_BOB_CORP_CD', 'BDO_BOB_USER_CD', 'BDO_BOB_PSWD']) {
    if (!env[k]) throw new Error('Missing required .env key: ' + k);
  }
  return env;
}

function ask(q) { const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(q, a => { rl.close(); res(a.trim()); })); }

const log = [];
const event = e => { console.log(`[${new Date().toISOString()}] ${e.event}`, JSON.stringify(e)); log.push({ ts: new Date().toISOString(), ...e }); };

async function downloadInPage(page, url) {
  return await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' });
    if (!r.ok) return { ok: false, status: r.status };
    const ab = await r.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let bin = ''; for (let i = 0; i < bytes.length; i += 32768)
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return { ok: true, ct: r.headers.get('content-type'), cd: r.headers.get('content-disposition'), b64: btoa(bin), size: bytes.length };
  }, url);
}

async function login(page, env) {
  await page.goto('https://business.bdo.com.ph/fo/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  for (const [sel, val] of [['#idd', env.BDO_BOB_CORP_CD], ['#ide', env.BDO_BOB_USER_CD], ['#idf', env.BDO_BOB_PSWD]]) {
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, val, { delay: 35 });
  }
  const c = await page.evaluate(() => {
    const sb = document.getElementById('idf').closest('form').querySelector('input[type="submit"]');
    sb.scrollIntoView({ block: 'center' });
    const r = sb.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(c.x, c.y),
  ]);
  await sleep(2500);
  console.log('\n*** SMS OTP required ***');
  const otp = await ask('Enter OTP: ');
  await page.evaluate(() => {
    const e = document.getElementById('id29');
    if (e) { e.scrollIntoView({ block: 'center' }); e.focus(); e.value = ''; }
  });
  await page.keyboard.type(otp, { delay: 50 });
  const sub = await page.evaluate(() => {
    const e = document.getElementById('id2c');
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(sub.x, sub.y),
  ]);
  await sleep(2500);
  if (!(await page.evaluate(() => document.body.innerText)).includes('You are logged in')) throw new Error('Login failed');
}

async function processPage(page, target, outDir) {
  event({ event: 'start', menu: target.menu, fc: target.fc });
  const dir = path.join(outDir, target.fc);
  fs.mkdirSync(dir, { recursive: true });

  const href = await page.evaluate((m) => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll('a')].find(a => norm(a.textContent) === m && a.href.includes('?x='))?.href;
  }, target.menu);
  if (!href) { event({ event: 'no_href', menu: target.menu }); return; }
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);

  // Click Inquiry tab
  await page.evaluate((tab) => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    [...document.querySelectorAll('a')].find(a => norm(a.textContent) === tab)?.click();
  }, target.tab);
  await sleep(2500);

  // Expand the Search Options accordion
  await page.evaluate(() => {
    const btn = document.querySelector('[slidedownbutton="true"]');
    if (btn && getComputedStyle(btn).display !== 'none') btn.click();
  });
  await sleep(2000);

  // Set required createDtFrom / createDtTo
  for (const [name, val] of [['createDtFrom', FROM], ['createDtTo', TO]]) {
    const id = await page.evaluate((n) => [...document.querySelectorAll('input')].find(i => i.name === n && i.offsetParent !== null)?.id, name);
    if (!id) { event({ event: 'date_field_missing', menu: target.menu, name }); continue; }
    const sel = '#' + id;
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, val, { delay: 25 });
  }

  // Click the Inquiry submit (name=search disambiguates from the Create form's submit)
  const sCoords = await page.evaluate(() => {
    const sb = [...document.querySelectorAll('input[type="submit"][name="search"]')].find(s => s.offsetParent !== null);
    if (!sb) return null;
    sb.scrollIntoView({ block: 'center' });
    const r = sb.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  if (!sCoords) { event({ event: 'no_search_btn', menu: target.menu }); return; }
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(sCoords.x, sCoords.y),
  ]);
  await sleep(5000);

  const r = await page.evaluate(() => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    const errs = [...document.querySelectorAll('.feedbackPanelERROR, [class*="rror"]')]
      .filter(e => e.offsetParent !== null).map(e => norm(e.innerText)).filter(Boolean);
    const noRecs = /no records found/i.test(document.body.innerText);
    const exports = [...document.querySelectorAll('input[type="button"], a, button')]
      .filter(e => e.offsetParent !== null && /^export/i.test(norm(e.value || e.innerText || '')))
      .map(e => {
        const oc = e.getAttribute('onclick') || '';
        const m = oc.match(/window\.location\.href\s*=\s*'(\?x=[^']+|https?:\/\/[^']+)'/);
        return { label: norm(e.value || e.innerText), locUrl: m ? m[1] : null };
      });
    return { errs, noRecs, exports };
  });
  event({ event: 'searched', menu: target.menu, errs: r.errs.slice(0, 3), noRecs: r.noRecs, exports: r.exports.length });

  const baseUrl = page.url().split('?')[0];
  for (const ex of r.exports) {
    if (!ex.locUrl) continue;
    const fmt = (ex.label.match(/(pdf|xls|csv)/i) || ['', 'bin'])[1].toLowerCase();
    const fn = `${target.fc}_${FROM.replace(/\//g,'-')}_to_${TO.replace(/\//g,'-')}.${fmt}`;
    const fp = path.join(dir, fn);
    const dl = await downloadInPage(page, baseUrl + ex.locUrl);
    if (dl.ok) {
      fs.writeFileSync(fp, Buffer.from(dl.b64, 'base64'));
      event({ event: 'saved', menu: target.menu, fmt, file: fp, size: dl.size });
    } else {
      event({ event: 'download_fail', menu: target.menu, fmt, status: dl.status });
    }
  }
}

(async () => {
  const env = loadEnv();
  const baseOut = env.BDO_BOB_OUTPUT_DIR || process.cwd();
  const outDir = path.join(baseOut, `inquiries_${fmtYMD(today)}`);
  fs.mkdirSync(outDir, { recursive: true });
  event({ event: 'run_start', range: { from: FROM, to: TO }, out: outDir });

  let browser, owns = false;
  if (CONNECT_PORT) {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${CONNECT_PORT}`, defaultViewport: null, protocolTimeout: 120000 });
  } else {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH, headless: false, userDataDir: PROFILE_DIR,
      defaultViewport: null, protocolTimeout: 120000,
      args: ['--disable-gpu', '--no-first-run', '--no-default-browser-check'],
    });
    owns = true;
  }

  try {
    let page;
    if (CONNECT_PORT) {
      const pages = await browser.pages();
      page = pages.find(p => /business\.bdo/.test(p.url())) || pages[0] || await browser.newPage();
    } else {
      page = (await browser.pages())[0] || await browser.newPage();
      await login(page, env);
    }

    for (const target of PAGES) {
      try { await processPage(page, target, outDir); }
      catch (e) { event({ event: 'error', menu: target.menu, error: e.message }); }
    }

    fs.writeFileSync(path.join(outDir, 'inquiries_log.json'), JSON.stringify({
      date: new Date().toISOString(), range: { from: FROM, to: TO }, events: log,
    }, null, 2));
    event({ event: 'run_done', out: outDir });
  } finally {
    if (owns) await browser.close(); else browser.disconnect();
  }
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
