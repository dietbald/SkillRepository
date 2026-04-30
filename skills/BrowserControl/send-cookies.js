// send-cookies.js — Export browser cookies from Windows Chrome to a remote BrowserControl server
// Generic: works for any site, any BrowserControl script running on the server.
//
// Usage:
//   node send-cookies.js <hostname>
//   node send-cookies.js ph.employer.seek.com
//
// Workflow:
//   1. Server script hits login wall → prints "Run send-cookies.js <hostname> on Windows"
//   2. You run this script on Windows (Chrome must be open and logged into that site)
//   3. Cookies are SCP'd to the server; the server script imports them and resumes

const puppeteer = require('puppeteer-core');
const fs        = require('fs');
const os        = require('os');
const path      = require('path');
const { execSync } = require('child_process');

const SERVER_USER   = 'tj';
const SERVER_HOST   = 'humanpower.one';
const REMOTE_DIR    = '~/.browsercontrol/pending-cookies';
const CHROME_EXE    = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DATA   = 'C:\\ChromeDebug';

const hostname = process.argv[2];
if (!hostname) {
  console.error('Usage:   node send-cookies.js <hostname>');
  console.error('Example: node send-cookies.js ph.employer.seek.com');
  process.exit(1);
}

function isDebugPortUp() {
  try { JSON.parse(execSync('curl -s http://127.0.0.1:9222/json/version', { timeout: 3000 }).toString()); return true; } catch { return false; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // ── Ensure Chrome is running on debug port ────────────────────────────────
  if (!isDebugPortUp()) {
    console.log('Chrome not on debug port — launching...');
    require('child_process').spawn(CHROME_EXE, ['--remote-debugging-port=9222', `--user-data-dir=${CHROME_DATA}`], { detached: true, stdio: 'ignore' }).unref();
    for (let i = 0; i < 10; i++) { await sleep(1000); if (isDebugPortUp()) break; }
    if (!isDebugPortUp()) { console.error('Chrome did not start on port 9222'); process.exit(1); }
  }

  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });

  // ── Grab cookies via CDP (gets all cookies for the domain, not just current page) ──
  const pages  = await browser.pages();
  const page   = pages[0] || await browser.newPage();

  // Navigate to the site if not already there — ensures session cookies are loaded
  if (!page.url().includes(hostname)) {
    console.log(`Navigating to https://${hostname} ...`);
    await page.goto(`https://${hostname}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
  }

  // Use CDP Network.getAllCookies to capture everything (including subdomain + root domain cookies)
  const client = await page.target().createCDPSession();
  const { cookies: allCookies } = await client.send('Network.getAllCookies');
  await client.detach();

  // Filter to cookies relevant to this hostname (exact domain + root domain)
  const parts      = hostname.split('.');
  const rootDomain = parts.slice(-2).join('.');
  const cookies    = allCookies.filter(c => {
    const d = c.domain.replace(/^\./, '');
    return hostname.endsWith(d) || d.endsWith(rootDomain);
  });

  if (cookies.length === 0) {
    console.error(`No cookies found for ${hostname}. Make sure you are logged in to this site in Chrome.`);
    process.exit(1);
  }
  console.log(`Found ${cookies.length} cookies for ${hostname}`);

  // ── Save to temp file ─────────────────────────────────────────────────────
  const safeHost = hostname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const tmpFile  = path.join(os.tmpdir(), `bc-cookies-${safeHost}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(cookies, null, 2));

  // ── SCP to server ─────────────────────────────────────────────────────────
  console.log(`Sending to ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/${safeHost}.json ...`);
  execSync(`ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}"`);
  execSync(`scp "${tmpFile}" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/${safeHost}.json"`);

  fs.unlinkSync(tmpFile);
  console.log(`Done — cookies sent. The server script will resume automatically.`);
})().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
