// BDO Business Online Banking — weekly Transaction History extractor.
//
// Pulls last N days (default 30) of TxnHist for every account listed in
//   ~/.claude/skills/BrowserControl/.env  →  BDO_BOB_ACCOUNTS_JSON
// Saves each account's PDF + XLS into <output_dir>/weekly_<YYYY-MM-DD>/<acct_num>/.
//
// .env keys consumed:
//   BDO_BOB_CORP_CD          — corporation code
//   BDO_BOB_USER_CD          — user id
//   BDO_BOB_PSWD             — password
//   BDO_BOB_ACCOUNTS_JSON    — JSON array: [{"num":"7579","name":"Collection","value":"<dropdown-hash>"}, ...]
//   BDO_BOB_OUTPUT_DIR       — optional. Default: process.cwd()
//
// Run modes:
//   node bdo_weekly_extract.js                  # interactive — own Chrome + OTP prompt in terminal
//   node bdo_weekly_extract.js --connect 9222   # attach to existing Chrome (you logged in manually)
//   node bdo_weekly_extract.js --days 7         # change lookback window (max ~92 by BDO's policy)
//
// Requires: puppeteer-core in NODE_PATH (run from a project that has it, or set NODE_PATH).

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Config ──────────────────────────────────────────────────────────
const HOME = os.homedir();
const ENV_PATH = path.join(HOME, '.claude', 'skills', 'BrowserControl', '.env');
const CHROME_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome';
const PROFILE_DIR = path.join(os.tmpdir(), 'ChromeDebugBDO');

const args = process.argv.slice(2);
const argVal = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };
const CONNECT_PORT = argVal('--connect');
const DAYS_BACK = parseInt(argVal('--days') || '30', 10);

// ── Helpers ─────────────────────────────────────────────────────────

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) throw new Error('.env not found: ' + ENV_PATH);
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ['BDO_BOB_CORP_CD', 'BDO_BOB_USER_CD', 'BDO_BOB_PSWD', 'BDO_BOB_ACCOUNTS_JSON']) {
    if (!env[k]) throw new Error('Missing required .env key: ' + k);
  }
  let accounts;
  try { accounts = JSON.parse(env.BDO_BOB_ACCOUNTS_JSON); }
  catch (e) { throw new Error('BDO_BOB_ACCOUNTS_JSON is not valid JSON: ' + e.message); }
  if (!Array.isArray(accounts) || accounts.length === 0) throw new Error('BDO_BOB_ACCOUNTS_JSON must be a non-empty array');
  for (const a of accounts) if (!a.num || !a.value) throw new Error('Each account needs num + value: ' + JSON.stringify(a));
  return { ...env, accounts };
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question, a => { rl.close(); res(a.trim()); }));
}

const fmtMDY = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
const fmtYMD = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

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

// ── Login ───────────────────────────────────────────────────────────

async function login(page, env) {
  await page.goto('https://business.bdo.com.ph/fo/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);

  for (const [sel, val] of [['#idd', env.BDO_BOB_CORP_CD], ['#ide', env.BDO_BOB_USER_CD], ['#idf', env.BDO_BOB_PSWD]]) {
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, val, { delay: 35 });
  }

  const coords = await page.evaluate(() => {
    const sb = document.getElementById('idf').closest('form').querySelector('input[type="submit"]');
    sb.scrollIntoView({ block: 'center' });
    const r = sb.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(coords.x, coords.y),
  ]);
  await sleep(2500);

  console.log('\n*** SMS OTP required — check your phone ***');
  const otp = await ask('Enter OTP: ');
  await page.evaluate(() => {
    const e = document.getElementById('id29');
    if (e) { e.scrollIntoView({ block: 'center' }); e.focus(); e.value = ''; }
  });
  await page.keyboard.type(otp, { delay: 50 });
  const submit = await page.evaluate(() => {
    const e = document.getElementById('id2c');
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(submit.x, submit.y),
  ]);
  await sleep(2500);

  const text = await page.evaluate(() => document.body.innerText);
  if (!text.includes('You are logged in')) throw new Error('Login failed — no dashboard text');
  event({ event: 'logged_in' });
}

// ── Extraction ──────────────────────────────────────────────────────

async function gotoTxnHist(page) {
  const href = await page.evaluate(() => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll('a')]
      .find(a => norm(a.textContent) === 'Transaction History' && a.href.includes('?x='))?.href;
  });
  if (!href) throw new Error('TxnHist link not found — session may have expired');
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
}

async function extractAccount(page, acct, dateFrom, dateTo, outDir) {
  const dir = path.join(outDir, acct.num);
  fs.mkdirSync(dir, { recursive: true });

  await gotoTxnHist(page);

  await page.evaluate((v) => {
    const sel = [...document.querySelectorAll('select')].find(s => s.name?.includes('account'));
    sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, acct.value);
  await sleep(2500);

  await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find(s => s.name?.includes('viewingType'));
    sel.value = '6'; sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(3500);

  for (const [namePart, val] of [['dateFrom', dateFrom], ['dateTo', dateTo]]) {
    const id = await page.evaluate((np) => [...document.querySelectorAll('input')].find(i => i.name?.includes(np))?.id, namePart);
    if (!id) throw new Error('input not found ' + namePart);
    const sel = '#' + id;
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, val, { delay: 25 });
  }

  const sCoords = await page.evaluate(() => {
    const sb = [...document.querySelectorAll('input[type="submit"]')].find(s => s.value === 'Search');
    sb.scrollIntoView({ block: 'center' });
    const r = sb.getBoundingClientRect();
    return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.mouse.click(sCoords.x, sCoords.y),
  ]);
  await sleep(4000);

  const errs = await page.evaluate(() => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll('.feedbackPanelERROR, [class*="rror"]')]
      .filter(e => e.offsetParent !== null).map(e => norm(e.innerText)).filter(Boolean);
  });
  if (errs.length) { event({ event: 'search_errors', acct: acct.num, errs }); return; }

  const exportUrls = await page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('input[type="button"], input[type="submit"]')) {
      const v = (el.value || '').trim();
      const oc = el.getAttribute('onclick') || '';
      const m = oc.match(/window\.location\.href\s*=\s*'(\?x=[^']+)'/);
      if (m) {
        if (/PDF/i.test(v))      out.pdf = m[1];
        else if (/XLS/i.test(v)) out.xls = m[1];
      }
    }
    return out;
  });
  const baseUrl = page.url().split('?')[0];
  for (const [fmt, relUrl] of Object.entries(exportUrls)) {
    const url = baseUrl + relUrl;
    const fn = `BDO_TxnHist_${acct.num}_${dateFrom.replace(/\//g,'-')}_to_${dateTo.replace(/\//g,'-')}.${fmt}`;
    const fp = path.join(dir, fn);
    const r = await downloadInPage(page, url);
    if (r.ok) {
      fs.writeFileSync(fp, Buffer.from(r.b64, 'base64'));
      event({ event: 'saved', acct: acct.num, fmt, file: fp, size: r.size });
    } else {
      event({ event: 'download_fail', acct: acct.num, fmt, status: r.status });
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────

(async () => {
  const env = loadEnv();
  const today = new Date();
  const dateTo = fmtMDY(today);
  const dateFromObj = new Date(today); dateFromObj.setDate(dateFromObj.getDate() - DAYS_BACK);
  const dateFrom = fmtMDY(dateFromObj);
  const baseOut = env.BDO_BOB_OUTPUT_DIR || process.cwd();
  const outDir = path.join(baseOut, `weekly_${fmtYMD(today)}`);
  fs.mkdirSync(outDir, { recursive: true });

  event({ event: 'run_start', range: { from: dateFrom, to: dateTo }, days: DAYS_BACK, accounts: env.accounts.map(a => a.num), out: outDir });

  let browser, owns = false;
  if (CONNECT_PORT) {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${CONNECT_PORT}`, defaultViewport: null, protocolTimeout: 120000 });
    event({ event: 'connect_mode', port: CONNECT_PORT });
  } else {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,                           // OTP step needs a visible window
      userDataDir: PROFILE_DIR,
      defaultViewport: null,
      protocolTimeout: 120000,
      args: ['--disable-gpu', '--no-first-run', '--no-default-browser-check'],
    });
    owns = true;
    event({ event: 'launch_mode' });
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

    for (const acct of env.accounts) {
      try { await extractAccount(page, acct, dateFrom, dateTo, outDir); }
      catch (e) { event({ event: 'account_error', acct: acct.num, error: e.message }); }
    }

    fs.writeFileSync(path.join(outDir, 'weekly_log.json'), JSON.stringify({
      run: fmtYMD(today), range: { from: dateFrom, to: dateTo }, events: log,
    }, null, 2));
    event({ event: 'run_done', out: outDir });
  } finally {
    if (owns) await browser.close(); else browser.disconnect();
  }
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
