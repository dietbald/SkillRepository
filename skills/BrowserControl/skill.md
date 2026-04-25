# BrowserControl Skill

You are controlling a Chrome browser via Puppeteer connected to a remote debug port. Follow this skill precisely on every invocation.

---

## Step 0 — Load credentials

Read `~/.claude/skills/BrowserControl/.env` with the Read tool. Parse every non-comment, non-empty line as `KEY=VALUE`. Store these values in memory for this session — use them whenever the task requires a name, email, password, or API key. Never hardcode credentials in scripts.

When a script needs credentials, inject them as variables at the top:
```javascript
const FIRST_NAME = 'Thibault';   // from .env USER_FIRST_NAME
const LAST_NAME  = 'Judicq';     // from .env USER_LAST_NAME
```

If a required credential is missing from `.env`, ask the user before proceeding. After the session, if new credentials were provided, add them to `.env`.

**Site knowledge files (`sites/*.md`) must never contain personal information or credentials** — no emails, passwords, names, account numbers, API keys, PNRs, or member IDs. Those belong exclusively in `.env`. Site files describe *how* to do something, not *who* is doing it.

---

## Step 1 — Identify the site and task

Parse the user's request for:
- **Site**: the target website (e.g. "Fiverr", "AirAsia", "Stripe")
- **Task**: what to extract or do (e.g. "download all receipts", "save invoices", "screenshot billing page")

---

## Step 2 — Load or create the site knowledge file

Check if `~/.claude/skills/BrowserControl/sites/<sitename>.md` exists (use lowercase, no spaces, e.g. `airasia.md`, `cebupacific.md`).

**If the file exists:** Read it. Use it as your primary guide for this site — its flow, selectors, gotchas, and known working techniques. Skip to Step 3.

**If the file does NOT exist:**
1. Do a web search: `"<site name>" receipts download portal how to` and `"<site name>" billing invoices download`
2. Read the most relevant results to understand:
   - Where the billing/receipts section lives in the portal
   - Whether documents are HTML pages, direct PDFs, or pre-signed URLs
   - Any known login requirements or access restrictions
3. Create `~/.claude/skills/BrowserControl/sites/<sitename>.md` using the `_template.md` structure, populating what you learned from the web search as your **hypothesis**. Mark it clearly as "unverified — from web research".
4. Continue to Step 3 using this as your starting plan.

---

## Step 3 — Launch or connect to Chrome

### 3a — Check if debug port is already available

```bash
curl -s http://127.0.0.1:9222/json/version
```

If this returns JSON, Chrome is already running in debug mode — skip to Step 3c.

### 3b — Chrome is NOT on debug port: ask to kill and relaunch

Check if a regular Chrome instance is running:
```powershell
tasklist /FI "IMAGENAME eq chrome.exe" /NH
```

If Chrome IS running, ask the user for confirmation before killing it:

> "Chrome is currently running but not in debug mode. I need to close it and relaunch it with the remote debugging port enabled. This will close all open Chrome windows. **Do you want to proceed? (yes/no)**"

Wait for the user to respond. If **yes**, proceed. If **no**, stop — Chrome must be in debug mode to continue.

**On Windows — always use PowerShell to kill and launch Chrome. `start ""` in bash does NOT work reliably.**

```powershell
# Kill existing Chrome
taskkill /F /IM chrome.exe /T
Start-Sleep 2

# Relaunch with debug port
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222","--user-data-dir=C:\ChromeDebug"
Start-Sleep 4

# Verify
Invoke-RestMethod http://127.0.0.1:9222/json/version
```

If Chrome is NOT running at all, launch directly (no confirmation needed):
```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222","--user-data-dir=C:\ChromeDebug"
Start-Sleep 4
Invoke-RestMethod http://127.0.0.1:9222/json/version
```

**ChromeDebug profile note:** `--user-data-dir=C:\ChromeDebug` is a separate Chrome profile. On first use it is completely fresh — no saved sessions, no cookies. The user must log in manually. After logging in, the session persists for all future runs using the same `--user-data-dir`. Never delete `C:\ChromeDebug` or sessions will be lost.

After launching Chrome fresh, navigate to the target site and wait for login using the `ensureLoggedIn` pattern in Step 4.

### 3c — Check puppeteer-core is installed

Before writing any script, verify puppeteer-core is available in the project directory:
```bash
node -e "require('puppeteer-core'); console.log('OK')"
```

If this fails with `Cannot find module`, install it **locally** (not globally — global installs are not found when running scripts from a project directory):
```bash
npm install puppeteer-core
```

### 3d — Connect via Puppeteer

```javascript
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.connect({
  browserURL: 'http://127.0.0.1:9222',
  defaultViewport: null   // use actual window size — coordinates align with getBoundingClientRect()
});

// Get existing tab or open new one
let pages = await browser.pages();
let page = pages.find(p => p.url().includes('<site-domain>'));
if (!page) {
  page = pages[0] || await browser.newPage();
  await page.goto('https://<site-url>', { waitUntil: 'domcontentloaded', timeout: 30000 });
}
await page.bringToFront();
```

---

## Step 4 — Execute the task

Use the techniques below. Always prefer the site knowledge file's proven approach over guessing.

### Clicking — choose the right technique

**React synthetic events** (dropdowns, toggles, chip filters):
```javascript
await page.evaluate((coords) => {
  const el = document.elementFromPoint(coords.x, coords.y);
  if (el) el.dispatchEvent(new MouseEvent('click', {
    bubbles: true, cancelable: true, view: window,
    clientX: coords.x, clientY: coords.y
  }));
}, coords);
```

**Navigation links and download buttons** (anything that opens a new page or new tab):
```javascript
await page.mouse.click(x, y);  // real browser mouse event required
```

Why `mouse.click()` and not `dispatchEvent` here: `dispatchEvent` fires on the element you target, but does NOT automatically propagate into child elements. Many download buttons are a `<div>` or `<button>` wrapping an inner `<a>` — the `<a>` is what actually handles navigation/tab opening. `mouse.click()` goes through the browser's full hit-testing pipeline and lands on the correct inner element.

**When in doubt:** try `mouse.click()` first. If it does nothing, try `dispatchEvent`.

### "Download PDF" / "Print" buttons that do nothing in Puppeteer

Many portals render a "Download PDF" or "Print" button that triggers a browser print dialog or uses `window.print()`. These **do nothing useful in Puppeteer** — the print dialog never appears and no file is saved.

**Always use `page.pdf()` as the fallback:**
```javascript
// Don't rely on the portal's own download button — save the page directly
await page.pdf({ path: fp, format: 'A4', printBackground: true });
```

This is confirmed across: Thai Airways, Cebu Pacific (mileage statement), and likely any portal that uses `window.print()` or opens a print preview instead of generating a direct download URL.

### Finding elements safely

```javascript
// By text content
const coords = await page.evaluate((label) => {
  const el = [...document.querySelectorAll('button, a, li, div')]
    .find(e => e.innerText?.trim() === label);
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return r.width > 0 ? { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) } : null;
}, 'Download receipt');
```

If `getBoundingClientRect()` returns empty `{}` or width=0, the element is off-screen or not rendered. Use `document.elementFromPoint(x, y)` scanning instead:
```javascript
for (let y = 100; y < 900; y += 10) {
  const el = document.elementFromPoint(targetX, y);
  if (el?.innerText?.trim() === 'Target') { /* found */ break; }
}
```

### Stale element references — "Node is either not clickable or not an Element"

This Puppeteer error means an `ElementHandle` was stored before a navigation, then used after — the node no longer exists in the new page's DOM.

**Never store `ElementHandle` objects across navigations.** Always use `page.evaluate()` to extract coordinates as plain numbers, then use `page.mouse.click(x, y)`. Plain numbers survive navigations; element handles do not.

```javascript
// ❌ Wrong — ElementHandle goes stale after navigation
const btn = await page.$('button.submit');
await page.goto('/next');
await btn.click();  // "Node is either not clickable or not an Element"

// ✅ Correct — extract coords first, click with coordinates
const coords = await page.evaluate(() => {
  const el = document.querySelector('button.submit');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
if (coords) await page.mouse.click(coords.x, coords.y);
```

### Waiting for navigation

**`waitUntil` strategy — choose carefully:**

| Use | When |
|---|---|
| `domcontentloaded` | Default choice. Always safe. Use on pages that may redirect (login, OAuth) — `networkidle2` causes "Execution context was destroyed" errors on redirects |
| `networkidle2` | Only when you know the page is stable and you need all XHR/fetch to finish (e.g. a dashboard that loads data via API) |
| `load` | Rarely needed — use only when you specifically need all images/iframes loaded |

**`networkidle2` on a page that redirects = guaranteed crash.** If `page.goto()` throws "Execution context was destroyed", switch to `domcontentloaded`.

```javascript
// Safe default
await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

// Wait for URL change — ALWAYS exclude the source URL
await page.waitForFunction(
  () => window.location.pathname.includes('/target-path')
     && !window.location.pathname.includes('/source-path'),
  { timeout: 30000 }
);
```

Prefer `waitForFunction` over fixed sleeps. Use `sleep()` only for brief UI settle delays (500–2000ms).

**Exception — heavy React/SPA portals:** Some SPAs update the DOM client-side *after* `networkidle2` fires, so `waitForFunction` times out even though content is present. If `waitForFunction` consistently fails on a known-working page, replace it with `sleep(8000)` and document this in the site knowledge file.

### Loading paginated lists

```javascript
let rounds = 0;
while (rounds < 30) {
  const coords = await page.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(e => e.innerText?.trim() === 'Show more');
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return r.y > 0 ? { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) } : null;
  });
  if (!coords) break;
  await page.mouse.click(coords.x, coords.y);
  await sleep(2500);
  rounds++;
}
```

### Detecting new tabs (download links that open a new tab)

```javascript
// Register BEFORE clicking
const popupPromise = new Promise(resolve => {
  function handler(t) {
    const url = t.url();
    if (url.includes('target-domain.com') || url.endsWith('.pdf')) {
      browser.off('targetcreated', handler);
      resolve(t);
    }
  }
  browser.on('targetcreated', handler);
  sleep(8000).then(() => { browser.off('targetcreated', handler); resolve(null); });
});
await page.mouse.click(btnX, btnY);  // click AFTER registering
const target = await popupPromise;
const popupUrl = target?.url();
```

Filter by URL to avoid Gmail service workers and extension tabs firing as false positives.

### Saving a page as PDF

```javascript
await page.pdf({ path: '/path/to/file.pdf', format: 'A4', printBackground: true });
```

Use when the portal renders documents as HTML (not direct PDF download).

### Downloading a PDF from a URL

```javascript
const https = require('https');
function downloadUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? require('https') : require('http');
    lib.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302)
        return resolve(downloadUrl(res.headers.location));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}
// Validate before saving
const buf = await downloadUrl(url);
if (buf.slice(0, 4).toString() !== '%PDF') throw new Error('Not a PDF');
fs.writeFileSync(fp, buf);
```

### Skip already-saved files

```javascript
if (fs.existsSync(fp)) { skipped++; continue; }
```

**Cached extraction files — validate before trusting.** If a script caches intermediate results (e.g. `candidates_raw.json`) and an earlier run failed mid-way, the cached file may be empty or incomplete. Before loading from cache, verify it's non-empty:
```javascript
if (fs.existsSync(cachePath)) {
  const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  if (Array.isArray(data) && data.length > 0) {
    allItems = data;  // safe to use
  } else {
    fs.unlinkSync(cachePath);  // delete and re-extract
  }
}
```

### Login detection and session expiry — never block on stdin

Two patterns depending on the site:

**Pattern A — OAuth/redirect-based login** (site redirects to `/login`, `/oauth/login`, `/signin` etc.):
```javascript
async function ensureLoggedIn(page, loginUrlFragment = '/login') {
  const isOnLoginPage = () => page.url().includes(loginUrlFragment);
  if (!isOnLoginPage()) return;
  console.log('*** NOT LOGGED IN — please log in in the browser, script will wait ***');
  for (let t = 0; t < 60; t++) {   // wait up to 5 minutes
    await sleep(5000);
    if (!isOnLoginPage()) { console.log('[logged in, resuming]'); return; }
  }
  throw new Error('Timed out waiting for login');
}
```

**Pattern B — Session expiry modal / page text change** (page stays at same URL but shows logout state):
```javascript
async function ensureLoggedIn(page) {
  for (let t = 0; t < 36; t++) {
    const text = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (!text.includes('Log in') && text.includes('My Account')) return;
    if (t === 0) console.log('*** SESSION EXPIRED — please log in in the browser ***');
    await sleep(5000);
  }
  throw new Error('Timed out waiting for login');
}
```

Use Pattern A for portals with OAuth (Google, Microsoft SSO, or any `/oauth/` URL in the redirect). Use Pattern B for portals with in-page session modals.

**Pattern C — Session expiry modal blocking the UI** (a modal appears on top of the page, blocking all interaction before the user can even re-login):
```javascript
async function dismissSessionModal(page) {
  const dismissed = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button, a')]
      .find(e => ['Back to home', 'OK', 'Dismiss', 'Close'].includes(e.innerText?.trim()));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (dismissed) { console.log('[session modal dismissed]'); await sleep(2000); }
  return dismissed;
}
```
Call `dismissSessionModal()` before `ensureLoggedIn()` on sites known to show blocking expiry modals (e.g. Cebu Pacific). The modal must be dismissed before the login polling can begin.

### Request interception — always use named handlers

**Never use anonymous functions with `page.on('request', ...)`** when interception needs to be enabled/disabled across multiple navigations. Anonymous handlers cannot be removed with `page.off()`, causing "Request Interception is not enabled!" crashes when a stale handler calls `req.continue()` after interception is disabled.

```javascript
// ❌ Wrong — anonymous handler can't be removed
await page.setRequestInterception(true);
page.on('request', req => { /* capture */ req.continue(); });
await page.goto(url);
await page.setRequestInterception(false);
// Later re-enabling interception will crash because the old handler still fires

// ✅ Correct — named handler, explicitly removed
const handler = req => { /* capture */ req.continue(); };
await page.setRequestInterception(true);
page.on('request', handler);
await page.goto(url);
page.off('request', handler);   // remove BEFORE disabling
await page.setRequestInterception(false);
```

Every `req.continue()` / `req.abort()` / `req.respond()` in a handler is a contract — if the handler fires after interception is disabled, it throws. Named handlers make that contract explicit and removable.

### Taking a screenshot for debugging

```javascript
await page.screenshot({ path: 'debug.png' });
// Then Read the file to inspect the current page state visually
```

Use screenshots when stuck — inspect the image before taking further action.

### Validate page state before prompting the user

**Always screenshot and read the page state before asking the user to log in or take an action.** Why: a page that's stuck on `400 Bad Request`, an error wall, or the wrong account isn't something the user can solve by typing credentials. Show them what you see, then ask.

```javascript
await page.screenshot({ path: 'state.png' });
// Read the screenshot, confirm it's the expected page (login form, dashboard, etc.)
// Only then print the *** PLEASE LOG IN *** prompt
```

If the page state is wrong (404, error, wrong account), report what you see and propose the next action — don't block waiting for a login on a non-login page.

### Iframes — `frame.evaluate()`, not `page.evaluate()`

Many enterprise admin portals (Google Workspace billing, payments providers, embedded SaaS dashboards) render their actual content inside an iframe. `page.evaluate()` only sees the outer chrome — selectors return null, clicks land on nothing.

```javascript
// Find the iframe whose URL matches the inner app
const frame = page.frames().find(f => f.url().includes('payments.google.com') && f.url().includes('timelineview'));
if (!frame) throw new Error('inner iframe not loaded yet');

// All DOM ops use frame.* not page.*
const result = await frame.evaluate(() => document.querySelectorAll('.b3id-collapsing-card').length);
```

When `page.evaluate(...)` returns `0` or `null` for elements you can clearly see in a screenshot, suspect an iframe. List `page.frames()` and look for one whose URL matches the inner application.

### Filtering out duplicate / hidden DOM nodes

Some portals create a NEW hidden popup each time a menu is opened (the old one stays in the DOM). The same element selector matches both the visible and the stale instances — clicking the wrong one does nothing.

```javascript
// Find the visible Download action only
const visibleDl = [...document.querySelectorAll('.menu-action')]
  .find(el => el.textContent.trim() === 'Download' && el.offsetParent !== null);
```

`offsetParent !== null` is the cheapest visibility check (also returns false for `display: none` ancestors). Use it whenever a selector matches more than expected — especially for popup menus that accumulate, or for invoice/action links that repeat across multiple tables on the same page.

### When the portal's own download button works only via a "trusted" click

Some portals (Google Workspace, AWS Billing) refuse to serve invoice PDFs to a `fetch(url, {credentials: 'include'})` call from inside `page.evaluate` — the URL returns HTTP 500 or empty body. The same URL works only when Chrome's native download flow handles it (trusted user-gesture click + `expect_download` / Puppeteer's download capture).

```javascript
// Puppeteer pattern — capture the download via CDP
const client = await page.target().createCDPSession();
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: SAVE_DIR });
await page.mouse.click(linkX, linkY);  // trusted click; do NOT use dispatchEvent here
// The PDF lands in SAVE_DIR — poll for the new file
```

Symptoms that the trusted-click path is needed:
- Direct `fetch()` of the URL returns 500 or empty
- The link element has `onclick` but no `href` (or an `href="#"`)
- The native browser download "just works" when clicked manually

Pace these portals: Google Workspace rate-limits at ~20 rapid downloads → forces password re-verify. Add ≥ 2 second delay between downloads on any portal whose links are session-tokened.

### File output on Windows — no emoji in stdout

Python's default Windows stdout encoding is `cp1252`, which throws `UnicodeEncodeError` on emoji like ✅ ❌. Use ASCII tags `[OK]` / `[FAIL]` in log lines, or set `PYTHONIOENCODING=utf-8` before running. Same issue applies to Node only when piping to non-UTF-8 consoles, but it's safer to keep log output ASCII.

### Idempotent re-runs handle browser context drops

`TargetClosedError` (Playwright) / `Protocol error: Target closed` (Puppeteer) can fire mid-iteration on long runs — the CDP connection just drops. There's no clean recovery; design every script around `if fs.existsSync(fp) skip` so a re-run picks up where it left off rather than re-downloading everything.

---

## Step 5 — File naming convention

`<SiteName>_<BookingRef>_<YYYY-MM-DD>_<ORIGIN>-<DEST>.pdf`

For non-travel portals: `<SiteName>_<InvoiceId>_<YYYY-MM-DD>.pdf`

Save to: `receipts/<SiteName>/`

Always write an `extraction_log.json` in the save directory:
```javascript
fs.writeFileSync(path.join(SAVE_DIR, 'extraction_log.json'), JSON.stringify({
  date: new Date().toISOString(), total, saved, skipped, errors, items: [...]
}, null, 2));
```

---

## Step 6 — Update knowledge and credentials

After the session (success or partial), update `sites/<sitename>.md`:
- Mark verified steps as confirmed
- Add any new gotchas discovered
- Record edge cases (cancelled bookings, expired links, voided items)
- Update the status line with date and outcome
- Remove the "unverified" label from anything that worked

If new credentials were used during the session, add them to `.env` under the appropriate site section.

If a general technique was discovered that applies to all sites (not just this one), also update `skill.md`.

## Step 7 — Run /reflect to self-improve

**At the end of every BrowserControl session**, run the `/reflect` command.

`/reflect` scans the session for errors, retries, and workarounds, checks whether each is already documented in `skill.md` or the site file, adds anything missing, and commits the update to the SkillRepository.

This is not optional — the skill only improves if every session's learnings are captured. If the user ends the conversation before `/reflect` runs, offer to run it before closing.

---

## Coordinate system notes

- `getBoundingClientRect()` returns CSS pixel coordinates = same space as `mouse.click(x, y)`
- Screenshots may be smaller than the viewport when device pixel ratio > 1 (e.g. a 1920px viewport captures as a 1534px PNG at DPR 1.25) — never use screenshot pixel positions for clicking
- Always use `scrollIntoView({ block: 'center' })` before reading an element's rect
