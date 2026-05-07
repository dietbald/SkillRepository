# BrowserControl Skill

You are controlling a Chrome browser via Puppeteer connected to a remote debug port. Follow this skill precisely on every invocation.

---

## Operating principle: scope every change to the smallest unit that needs it

When you need a different network egress, user-agent, cookie jar, or proxy for ONE site, do NOT make a system-wide change. **Use per-process scoping always:**

- Need a different egress for one site → **launch a second Chrome on a different port** (e.g. `--remote-debugging-port=9223`) with `--proxy-server=...` and a separate `--user-data-dir`. Don't touch system routing, the existing Chrome, or any global proxy env var.
- Need a residential exit for one site → SOCKS5 over SSH (`ssh -D 1080 user@residential-host`) or per-Chrome `--proxy-server=socks5://...`. **Never** use `tailscale up --exit-node=...` — that routes ALL outbound traffic system-wide, including the SSH session driving Claude Code itself, and will lock you out of the host.
- Need a different cookie session → second Chrome with its own `--user-data-dir`, not deleting the first one's cookies.
- Need a different DNS or hosts entry → write to a per-launch hosts file via `--host-resolver-rules="MAP example.com 1.2.3.4"`, not `/etc/hosts`.

The cost of a per-process scope is small (one extra Chrome instance, one extra port). The cost of a system-wide change you got wrong is your SSH session and a trip to the local console.

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

**NEVER kill any existing Chrome instance.** If the debug port is already up, connect to it. If not, launch a new Chrome instance alongside whatever is already running.

### 3a — Check if debug port is already available

```bash
curl -s http://127.0.0.1:9222/json/version
```

If this returns JSON, Chrome is already running in debug mode — skip to Step 3c.

### 3b — Debug port not up: launch Chrome via Bash

Run directly from Bash — no PowerShell needed. This launches a new instance without touching any existing Chrome windows.

**Windows — visible Chrome:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\ChromeDebug" &
sleep 3
curl -s http://127.0.0.1:9222/json/version
```

**Windows — headless:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\ChromeDebug" --headless=new &
sleep 3
curl -s http://127.0.0.1:9222/json/version
```

**Linux/Ubuntu — headless:**
```bash
chromium --remote-debugging-port=9222 --user-data-dir=$HOME/.chromedebug --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage &
sleep 3
curl -s http://127.0.0.1:9222/json/version
```

**ChromeDebug profile note:** `--user-data-dir=C:\ChromeDebug` (Windows) or `~/.chromedebug` (Linux) is a dedicated profile separate from the user's regular Chrome. Sessions persist between runs. Never delete this directory or sessions will be lost.

**Closing the last tab kills the whole Chrome process.** Chrome exits when no windows remain. If a script or `/json/close/<id>` call closes the only remaining tab, the debug port goes down and subsequent `puppeteer.connect()` calls fail with `ECONNREFUSED`. Always keep at least one tab alive — open a new one (`/json/new?<url>`) before closing the last existing one, or relaunch Chrome from scratch.

### Connect-via-debug-port vs `puppeteer.launch()` — choose by use case

These are TWO different patterns with different trade-offs:

- **`puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' })`** — attaches to an already-running Chrome (debug-port mode). Use during interactive development when the user has a Chrome window open with persistent cookies/sessions. The script does NOT own the Chrome process and must NOT kill it on exit.

- **`puppeteer.launch({ executablePath, headless: 'new', userDataDir })`** — spawns and owns the Chrome process. Use for unattended/scheduled scripts. `await browser.close()` cleans up the entire process tree; no `taskkill` or PID juggling needed.

```javascript
// ✅ Unattended pattern — Chrome lifecycle managed by puppeteer
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  userDataDir: 'C:\\ChromeDebug<TaskName>',   // dedicated, persists session cookies
  defaultViewport: { width: 1920, height: 1080 },
  protocolTimeout: 180000,
  args: ['--disable-gpu', '--no-first-run', '--no-default-browser-check'],
});
try {
  const page = await browser.newPage();
  // ... do work ...
} finally {
  await browser.close();   // kills Chrome cleanly, zero leaks
}
```

Don't mix: never use `taskkill` against a Chrome started with `puppeteer.launch()` (puppeteer's `browser.close()` handles it), and never call `browser.close()` against a `puppeteer.connect()` session (it'll terminate the user's Chrome).

**When you must kill Chrome manually**, filter by command-line, NOT window title — Chrome doesn't put debug port or profile path in `WINDOWTITLE`, so `taskkill /FI "WINDOWTITLE eq *port=9223*"` matches nothing. Use:
```powershell
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
  Where-Object { $_.CommandLine -like '*<your-user-data-dir>*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

### Recovering from a stuck tab — `puppeteer.connect()` hangs at `Network.enable`

Symptom: `puppeteer.connect()` succeeds but `browser.pages()` never returns, eventually erroring with `ProtocolError: Network.enable timed out` from `NetworkManager.addClient`. Cause: an existing tab in Chrome got into a bad state (often a stale Wicket / OAuth / heavy-SPA URL) and won't respond to CDP. Puppeteer initializes every existing page on connect, so one stuck tab blocks the whole connect.

Recover via Chrome's HTTP DevTools API directly — bypass puppeteer:
```bash
# 1. List tabs
curl -s http://127.0.0.1:9222/json/list

# 2. Open a fresh tab on a known-good URL FIRST (so closing the stuck one doesn't kill Chrome)
curl -s -X PUT "http://127.0.0.1:9222/json/new?https://www.example.com/"

# 3. Close the stuck tab by id
curl -s -X PUT "http://127.0.0.1:9222/json/close/<stuck-tab-id>"
```

Then `puppeteer.connect()` works again. If the symptom keeps recurring, the underlying page is the issue — relaunch Chrome with a fresh `--user-data-dir`, or switch to the `puppeteer.launch()` pattern above for that workflow.

#### Linux troubleshooting — when chromium fails to bind 9222

1. **Snap chromium can't write to a user-data-dir outside its confinement.** `/snap/bin/chromium` aborts with `Failed to create <user-data-dir>/SingletonLock: Permission denied (13)` even on directories you own. Solution: launch the **puppeteer-bundled** chrome instead — it has no sandbox restrictions:
   ```bash
   CHROME=$(ls -d ~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome 2>/dev/null | tail -1)
   DISPLAY=:99 nohup "$CHROME" \
     --remote-debugging-port=9222 \
     --user-data-dir="$HOME/.chromedebug" \
     --no-sandbox --disable-gpu --disable-dev-shm-usage \
     </dev/null >/tmp/chromedebug.log 2>&1 &
   ```
   Confirm `cat /tmp/chromedebug.log` shows `DevTools listening on ws://127.0.0.1:9222/...`.

2. **`~/bin/Xvfb` may be a shim that only writes the lock file** (no real X server is started). Test with `DISPLAY=:99 xset q` — if it says "unable to open display :99" but a process named "bash /home/tj/bin/Xvfb" is running, that's the shim. Start the real one yourself:
   ```bash
   pkill -f "/home/tj/bin/Xvfb" 2>/dev/null; rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
   /usr/bin/Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp & disown
   sleep 2 && DISPLAY=:99 xset q   # should succeed now
   ```

After launching, navigate to the target site and wait for login using the `ensureLoggedIn` pattern in Step 4.

#### Site returns 403 / "Service unavailable" / "request blocked" before Chrome interaction

Region or datacenter-IP block at the WAF (often Azure Front Door, Cloudflare, Akamai). Confirm with plain `curl -I` from the same machine — if curl also 403s, it's not bot detection, it's **the IP**.

**Distinguish three IP-restriction classes before spending time on proxies:**

1. **Soft geo-block via WAF** — datacenter US works, GB/JP block. Use webshare. Verified with PhilGEPS Starbucks-style sites.
2. **Hard country-only firewall at the host** — datacenter proxies in *any* country still time out; only residential ISP IPs in the target country answer. Verified for some `.gov.ph` and `.mil.ph` sites (e.g. `paf.mil.ph`). Webshare datacenter pool won't help — you need a residential proxy plan in the target country, OR a SOCKS5 over SSH to a real device on a residential connection.
3. **Site is genuinely down** — `host` resolves, no machine on the planet can connect. Confirm with `check-host.net` or `archive.org/wayback/available`. Don't burn time building proxy infra for a dead host.

Quick triage:
```bash
# 1. Direct
curl -sI --max-time 10 "$URL" -H "User-Agent: Mozilla/5.0" -o /dev/null -w "%{http_code}\n"
# 2. Third-party (Dallas node) — distinguishes "down" from "blocks us specifically"
curl -s --max-time 15 "https://check-host.net/check-http?host=$URL&node=us2.node.check-host.net" -H "Accept: application/json"
# 3. Wayback — zero snapshots = chronically unreachable, build won't help
curl -s "https://archive.org/wayback/available?url=$(echo $URL | sed 's|https*://||')"
```

Test webshare/residential proxies and find one that returns 200, **and** check its egress country — different regional WAF rules may pass US but block GB/JP, etc:
```bash
while IFS=: read -r host port user pass; do
  code=$(timeout 8 curl -s -o /dev/null -w "%{http_code}" -x "http://$user:$pass@$host:$port" \
    -H 'User-Agent: Mozilla/5.0' "https://<site>/...")
  geo=$(timeout 5 curl -s -x "http://$user:$pass@$host:$port" https://ipinfo.io/json \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('country','?'),d.get('city','?'))")
  echo "$host:$port -> $code | $geo"
done < ~/.openclaw/workspace/webshare_proxies.txt
```

Then launch a **second** Chrome on a different port through the working proxy (you can't add a proxy to an already-running Chrome):
```bash
mkdir -p $HOME/.chromedebug-proxy
DISPLAY=:99 nohup "$CHROME" \
  --remote-debugging-port=9223 \
  --user-data-dir="$HOME/.chromedebug-proxy" \
  --proxy-server="http://<host>:<port>" \
  --no-sandbox --disable-gpu --disable-dev-shm-usage \
  </dev/null >/tmp/chromedebug-proxy.log 2>&1 &
```

In puppeteer, attach proxy basic-auth on each page (Chrome's `--proxy-server` doesn't accept creds in the URL — they must come via CDP `Network.setExtraHTTPHeaders` or, simpler, `page.authenticate()`):
```javascript
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
const page = (await browser.pages())[0] || await browser.newPage();
await page.authenticate({ username: PROXY_USER, password: PROXY_PASS });
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/120.0.0.0 Safari/537.36');
```

Keep the proxied Chrome on a separate `--user-data-dir` so it doesn't fight the unproxied one for the SingletonLock or share session cookies across egress IPs (Akamai-style WAFs flag IP changes mid-session).

#### Cloudflare managed challenge (Turnstile) — `cf_clearance` is fingerprint-bound, not just IP-bound

`cf_clearance` is tied to **both the originating IP AND the TLS/browser fingerprint** of the Chrome that solved it. Injecting it into any other process will fail:

- **Plain Node.js `https` + `cf_clearance` cookie → 403** — Node's TLS stack has a different JA3 fingerprint than Chrome, even with correct headers and Client Hints (`Sec-CH-UA-*`). Cloudflare detects the mismatch before ever checking the cookie.
- **`curl` + `cf_clearance` → 403** — Same reason.
- **Fresh headless Chrome + stealth + injected `cf_clearance` → blocked** — New Chrome instance has a different browser fingerprint (different canvas, font, plugin signatures) even on the same IP.
- **2captcha Turnstile token → rejected** — 2captcha solves from their server's IP; the token is bound to that IP, not yours.

**The only working approach:** Reuse the **same Chrome user-data-dir** that originally solved the challenge. Connect to it via Puppeteer. The `cf_clearance` cookie stored in that profile is valid for 1 year.

```javascript
// Launch Chrome with the same profile that solved the challenge
execFile(chromePath, [
  `--remote-debugging-port=9223`,
  `--user-data-dir=C:\\ChromeDebugPCG`,  // same dir as original solve
  '--no-first-run', '--no-default-browser-check',
]);
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
```

When `cf_clearance` expires or IP changes: navigate to the site in that same Chrome, solve the challenge manually once, then resume automation.

#### Downloading files from Cloudflare-protected sites — use page.evaluate(fetch())

Plain `https` requests from Node.js get 403 on Cloudflare-protected sites even with the full cookie jar, because the TLS fingerprint doesn't match Chrome. Use `page.evaluate(fetch(...))` to download binary files through the browser's own network stack:

```javascript
async function downloadViaBrowser(page, url) {
  const result = await page.evaluate(async (fileUrl) => {
    const resp = await fetch(fileUrl, { credentials: 'include' });
    if (!resp.ok) return { status: resp.status, data: null };
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return { status: resp.status, data: btoa(binary) };
  }, url);
  return {
    status: result.status,
    body: result.data ? Buffer.from(result.data, 'base64') : Buffer.alloc(0),
  };
}
```

Why base64: `page.evaluate` can only return JSON-serializable values. Binary buffers must be encoded as base64 strings and decoded back in Node.js.

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
  defaultViewport: null,  // use actual window size — coordinates align with getBoundingClientRect()
  protocolTimeout: 60000  // raise from default 30s — required for heavy async SPAs (Kendo, React)
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

### jQuery `data-function` buttons — use jQuery trigger, not a direct click

Some sites (TMDB, older jQuery-based SPAs) wire button clicks via delegated jQuery handlers: `$('[data-function="openConfirmDialog()"]').on('click', ...)`. Neither `page.mouse.click()` nor `dispatchEvent('click')` fires these — the jQuery listener never sees the event.

```javascript
// ❌ Both fail on jQuery-delegated handlers
await page.mouse.click(x, y);
await page.evaluate(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

// ✅ Correct — trigger via jQuery's own event system
await page.evaluate(() => {
  $('[data-function="openConfirmDialog()"]').trigger('click');
});
```

This works because jQuery synthetic events travel through jQuery's internal dispatcher, which is where the `data-function` listener is registered. Check for this pattern by inspecting the button's HTML — if it has `data-function="someCall()"` with no `onclick` or `href`, it's jQuery-delegated.

### Async dynamic import dialogs — wait 10–12 seconds after trigger

Some UI components (Kendo UI, older lazy-loaded dialogs) load their module asynchronously on first use: `import('/kendo.dialog.js').then(init)`. The button click that opens the dialog succeeds immediately, but the dialog DOM isn't created until the async import resolves — typically 5–12 seconds on first load.

```javascript
// Trigger via jQuery (see above), then wait for the async module to load
await page.evaluate(() => $('[data-function="openConfirmDialog()"]').trigger('click'));
await sleep(12000);  // Kendo loads via async import — needs 10-12s on first trigger

const dialogVisible = await page.evaluate(() => !!document.querySelector('.k-dialog, .k-window'));
if (!dialogVisible) {
  // retry once if still not visible
  await page.evaluate(() => $('[data-function="openConfirmDialog()"]').trigger('click'));
  await sleep(10000);
}
```

Why 12 seconds: the async `import()` call initiates a network fetch for the module bundle. On a slow connection or cold CDN, this can exceed 10 seconds. Fixed sleeps are necessary here — `waitForFunction` works too but the selector (`.k-dialog`) is Kendo-specific.

### Click silently no-ops — check `aria-disabled` and `pointer-events`

A click that triggers no network requests, no navigation, no console error usually means the target element is visually rendered but interactively disabled. Inspect the actual DOM node:

```javascript
const state = await page.evaluate(() => {
  const el = [...document.querySelectorAll('a, button')].find(e => /Download/i.test(e.innerText || ''));
  return {
    ariaDisabled: el?.getAttribute('aria-disabled'),
    pointerEvents: el && getComputedStyle(el).pointerEvents,
    classes: el?.className,
  };
});
```

If `aria-disabled === 'true'` or `pointerEvents === 'none'`, look for a **disclaimer checkbox** above/below the button — sites commonly gate downloads behind an "I understand…" acknowledgement. Tick it (real `.click()`, not just setting `.checked = true` — React needs the event), wait ~1s, then re-click the button.

### Dismiss marketing/onboarding popups before clicking ANY CTA on a fresh page load

First-time visits to consumer sites frequently spawn YouTube subscribe popups, newsletter modals, cookie banners, or feature tours that overlay the page. Your CTA click lands on the popup, not the button — and the popup's element-from-point hit consumes the click silently.

Sweep for the common dismissal labels before every CTA:
```javascript
const dismissOverlays = async () => {
  for (let i = 0; i < 6; i++) {
    const did = await page.evaluate(() => {
      const labels = ['Maybe later', 'No thanks', 'Skip', 'Skip tour', 'Not now',
                      'Got it', 'Close', 'Dismiss', "Let's get started", 'Use this', 'Done'];
      for (const lbl of labels) {
        const el = [...document.querySelectorAll('button, a')]
          .find(e => e.innerText?.trim() === lbl && e.offsetParent !== null);
        if (el) { el.click(); return lbl; }
      }
      const x = [...document.querySelectorAll('button')].find(b =>
        (b.getAttribute('aria-label') || '').toLowerCase().includes('close') &&
        b.offsetParent !== null);
      if (x) { x.click(); return 'X'; }
      return null;
    });
    if (!did) return;
    await sleep(1200);
  }
};
```

Some sites chain multiple onboarding panels — call this in a loop until it returns nothing. Proton Mail is a known offender: ~5 sequential panels (welcome carousel, "Distraction-free", "Anytime, anywhere access", theme picker) on first login, all blocking the inbox.

### reCAPTCHA v2 on a login form — solve with 2captcha-cli

A submit that times out *only after the form was filled correctly* usually means a captcha widget is gating it. If you see `<div class="g-recaptcha" data-sitekey="...">` or an iframe whose `src` includes `recaptcha`, solve it offline and inject the token before submitting:

```javascript
const { execFileSync } = require('child_process');
const CAPTCHA = '/home/tj/.agents/skills/2captcha-cli/solve-captcha';

// 1. Discover the sitekey
const sitekey = await page.evaluate(() => {
  const el = document.querySelector('[data-sitekey]');
  if (el) return el.getAttribute('data-sitekey');
  const iframe = [...document.querySelectorAll('iframe')].find(f => f.src.includes('recaptcha'));
  return iframe ? new URL(iframe.src).searchParams.get('k') : null;
});

// 2. Pay 2captcha workers (~$0.003, ~30-60s wait). Note `-u` is the page URL,
//    NOT the iframe URL — Google validates the token against the parent origin.
const token = execFileSync('python3', [CAPTCHA, 'recaptcha2', '-s', sitekey, '-u', page.url()],
  { encoding: 'utf8', timeout: 180000 }).trim().split('\n').pop();

// 3. Inject token into the hidden textarea + fire any registered callback
await page.evaluate((t) => {
  const ta = document.querySelector('textarea[name="g-recaptcha-response"]') || (() => {
    const x = document.createElement('textarea');
    x.name = 'g-recaptcha-response'; x.id = 'g-recaptcha-response';
    document.querySelector('form').appendChild(x); return x;
  })();
  ta.style.display = ''; ta.value = t;
  // Some sites validate via the JS callback rather than the form post — invoke it
  try {
    const clients = window.___grecaptcha_cfg?.clients || {};
    for (const c of Object.values(clients))
      for (const v of Object.values(c))
        if (v && typeof v === 'object')
          for (const v2 of Object.values(v))
            if (typeof v2?.callback === 'function') v2.callback(t);
  } catch {}
}, token);

// 4. Submit normally
```

If the form submit STILL fails after a valid token, the site likely uses **reCAPTCHA Enterprise** (different sitekey format, longer keys starting with `6Ld...`) — switch to `recaptchaV2 enterprise` mode in 2captcha or look for `recaptchaV3` markers (`grecaptcha.execute(sitekey, {action: '...'})` calls in page source).

Don't bother trying to "click I'm not a robot" with the mouse — Google detects automation and shows the image challenge, which Puppeteer can't solve interactively in a reasonable time. Always go straight to 2captcha.

### Text-match must pick the smallest matching element

```javascript
// ❌ Wrong — `.find()` returns the first DOM-order match, often a wrapper div
//    spanning multiple rows. Click coords land in the middle of the wrapper,
//    hitting whatever row happens to be at viewport-center.
const el = [...document.querySelectorAll('*')].find(e => /Subject text/.test(e.innerText));

// ✅ Correct — collect all matches, pick the smallest (most specific) visible one
const matches = [...document.querySelectorAll('*')]
  .filter(e => /Subject text/.test(e.textContent || '') &&
               e.children.length < 5 && e.offsetParent !== null);
const el = matches.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
```

This is the difference between clicking the inbox row you wanted and clicking whichever row is at y=450.

### Scraping PDF/link lists — scope to content area, not the full page

CMS portals (Joomla, WordPress, Drupal) embed hundreds of navigation, sidebar, and footer links in every page's HTML. If you `querySelectorAll('a[href$=".pdf"]')` on the full page, you'll get all of them — e.g. Joomla sites routinely have 1,200+ sidebar PDFs that have nothing to do with the article being scraped.

Always scope link extraction to the main content element first:

```javascript
// ✅ Correct — scope to main content area before scanning for PDFs
function parsePdfLinks(html) {
  // id="content" on Joomla; ".entry-content" on WordPress; ".field-items" on Drupal
  const contentMatch = html.match(/id="content"[\s\S]*/) ||
                       html.match(/class="entry-content"[\s\S]*/);
  const scope = contentMatch ? contentMatch[0] : html;
  const re = /href="([^"]*\.pdf[^"]*)"/gi;
  const links = [];
  let m;
  while ((m = re.exec(scope)) !== null) links.push(m[1]);
  return [...new Set(links)];
}
```

### Image-based nav (classic ASP.NET WebForms) — `__doPostBack`, not text

Old government / enterprise portals (PhilGEPS, BIR eFPS, DPWH portals) build their primary navigation as `<img>` tags inside `<a href="javascript:__doPostBack('controlID','arg')">`. The visible label is in the image (`menu_myorg.jpg`), not in any text node. Searching `[...document.querySelectorAll('a')].find(a => /My Organization/.test(a.innerText))` returns nothing, and the visible text near the tabs is whitespace.

```javascript
// ❌ Wrong — the label lives in the <img>, not the DOM text
const link = [...document.querySelectorAll('a')]
  .find(a => /My Organization/i.test(a.innerText));   // null

// ✅ Correct — find the <a> wrapping the image whose src matches the label
const link = [...document.querySelectorAll('a')]
  .find(a => a.querySelector('img[src*="menu_myorg"]'));

// Extract postback args from href and call directly — survives icon redesigns
//   href="javascript:__doPostBack('ctl01$LoginMenu1','2')"
const m = link.getAttribute('href').match(/__doPostBack\('([^']+)','([^']*)'\)/);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
  page.evaluate((target, arg) => __doPostBack(target, arg), m[1], m[2]),
]);
```

When you can't tell which image-src corresponds to which label, dump the page HTML once (`fs.writeFileSync('page.html', await page.content())`) and grep for the visible label — the surrounding `<img src="…">` tells you the URL fragment to filter on.

**The `ctl0X` prefix in postback target IDs is NOT stable across pages.** ASP.NET composes it from the page's control tree, so the same nav menu can be `ctl01$LoginMenu1` on the dashboard and `ctl03$LoginMenu1` on a detail page. Never hardcode the prefix — always parse the live `__doPostBack(...)` from the rendered `href` (or use the trailing identifier like `LoginMenu1` to filter):

```javascript
// Match by the stable suffix, not the dynamic ctl0X prefix
const link = [...document.querySelectorAll('a')]
  .find(a => /\$LoginMenu1','4'/.test(a.getAttribute('href') || ''));   // 4 = Opportunities
```

### Downloading a PDF that Chrome renders inline

When you `page.goto(pdfUrl)` and the response is `Content-Type: application/pdf`, Chrome's PDF viewer plugin **wraps the response in a 500-byte HTML stub** before puppeteer can read it. `await response.buffer()` then returns the wrapper, not the PDF, and CDP `Browser.setDownloadBehavior` won't force a save because the browser already chose "render inline":

```html
<!doctype html><html><head><link rel="stylesheet" href="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/pdf_embedder.css"></head>
<body><template shadowrootmode="closed">…<iframe src="about:blank" type="application/pdf">…</template></body></html>
```

**Fix: re-fetch the URL via in-page `fetch()` after navigating somewhere else first.** The fetch call uses the page's session cookies and returns raw bytes:

```javascript
// 1. First navigate to a non-PDF page on the same origin (so cookies are scoped right)
await page.goto('https://site.example/some-page', { waitUntil: 'domcontentloaded' });

// 2. fetch the PDF in-page; encode bytes for transfer back
const result = await page.evaluate(async (url) => {
  const r = await fetch(url, { credentials: 'include' });
  const ab = await r.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 32768)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return { status: r.status, ct: r.headers.get('content-type'), b64: btoa(bin) };
}, pdfUrl);

const buf = Buffer.from(result.b64, 'base64');
if (buf.slice(0, 4).toString() !== '%PDF') throw new Error('not a PDF: ' + buf.slice(0, 100));
fs.writeFileSync(savePath, buf);
```

The chunked `String.fromCharCode.apply(null, ...)` loop is required: a single call on a multi-MB Uint8Array blows out the JS argument stack with `RangeError: Maximum call stack size exceeded`. 32 KB chunks are safe.

**Don't try `Fetch.fulfillRequest` to inject `Content-Disposition: attachment`** when the response body might itself be a challenge/wrapper page — you'll save 850 bytes of HTML with a `.pdf` extension and look like you succeeded.

### OCR image-only PDFs (scans saved as PDF)

Many gov/enterprise portals serve scanned documents as `application/pdf` but with no embedded text — `pdfminer.six` extracts an empty string. Detect early (`extract_text(fp).strip()` is `""`) then OCR per page via PyMuPDF render → tesseract:

```python
import fitz, subprocess, tempfile, os
def ocr_pdf(path, dpi=250, psm=6):
    doc = fitz.open(path)
    pages = []
    for pg in doc:
        pix = pg.get_pixmap(dpi=dpi)
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as t:
            pix.save(t.name)
            r = subprocess.run(['tesseract', t.name, '-', '--psm', str(psm)],
                               capture_output=True, text=True, timeout=120)
            pages.append(r.stdout)
            os.unlink(t.name)
    doc.close()
    return '\n'.join(pages)
```

`--psm 6` (assume single uniform block of text) is the right default for tabular government documents. `dpi=250` is the floor for reliable OCR of small typeset text; bump to 300 if the result has obvious mis-recognitions on numerals.

**File-extension lies**: don't trust the filename. Some portals (PhilGEPS) auto-convert uploaded JPGs to PDF and serve them with `.jpg` in the URL but `Content-Type: application/pdf`. Check `buf.slice(0,4)` — `%PDF` means PDF regardless of extension.

### Don't extrapolate IDs from one observation

When a portal's resources have numeric IDs (file IDs, order IDs, document IDs), DON'T assume `+1, +2, +3` from one captured ID maps to siblings in the same logical group. Many portals issue IDs from a global sequence shared across all tenants/uploads, so neighbouring IDs belong to unrelated records (verified on PhilGEPS: fetching `FileID + 1..3` from one BAC Resolution returned office-supplies and medical-supplies docs from completely unrelated agencies).

If a portal exposes a tree/list endpoint that returns the canonical ID per record, use that. If not, click each row individually AND verify: filename match, content-disposition header, magic bytes, first-page OCR — if any of those don't match the expected document, the ID extrapolation is wrong.

### Imperva (Incapsula) hCaptcha — solve via 2captcha + iframe callback

Sites fronted by Imperva (`*.dpwh.gov.ph`, many gov / enterprise sites) serve an "Additional security check is required" page with hCaptcha. After clearance, the parent site is browsable but **file URLs (PDFs, exports) often re-trigger the challenge** even with valid `incap_ses_*` cookies — you must complete the captcha first, in the special Imperva iframe.

Detection signals:
- Response body is ~850 bytes and starts with `<html style="height:100%"`
- Body contains `<iframe id="main-iframe" src="/_Incapsula_Resource?...">`
- Page title is empty

**The full Imperva-hCaptcha bypass (~$0.003/solve via 2captcha):**

```javascript
const { execFileSync } = require('child_process');
const CAPTCHA = '/home/tj/.agents/skills/2captcha-cli/solve-captcha';

// 1. Trigger the challenge (any page on the site works)
await page.goto('https://www.example.com/', { waitUntil: 'networkidle2' });
await sleep(8000);

// 2. Find the Imperva iframe and pull the hCaptcha sitekey from inside it
//    (sitekey is in the iframe HTML, NOT the parent — page.evaluate misses it)
const incap = page.frames().find(f => /_Incapsula_Resource/.test(f.url()));
if (!incap) { /* already cleared, skip */ }
const sitekey = await incap.evaluate(() => {
  const el = document.querySelector('[data-sitekey]');
  return el ? el.getAttribute('data-sitekey') : null;
});

// 3. Solve via 2captcha (-u must be the parent page URL, not the iframe URL)
const out = execFileSync('python3', [CAPTCHA, 'hcaptcha', '-s', sitekey, '-u', page.url()],
  { encoding: 'utf8', timeout: 240000 });
const token = out.trim().split('\n').pop();

// 4. Inject token + invoke Imperva's success callback INSIDE the iframe
//    (just setting the textarea is not enough — Imperva listens for onCaptchaFinished)
await incap.evaluate((t) => {
  document.querySelectorAll('textarea').forEach(ta => { ta.style.display = ''; ta.value = t; });
  if (typeof window.onCaptchaFinished === 'function') window.onCaptchaFinished(t);
}, token);
await sleep(8000);   // Imperva's clearance roundtrip

// 5. The browser now has _ga, has_js, incap_ses_*, visid_incap_*, _gid cookies.
//    File URLs work, but only via in-page fetch (Chrome PDF viewer trick — see above).
```

If `page.frames()` doesn't show an `_Incapsula_Resource` iframe, the site already cleared you — go straight to the fetch step.

### Discovering CAPTCHA sitekeys — walk every frame

Site CAPTCHAs commonly live inside an iframe (Imperva, Stripe Radar, Google reCAPTCHA in embedded widgets). A `document.querySelector('[data-sitekey]')` on the parent page returns null. Always walk frames:

```javascript
for (const f of page.frames()) {
  try {
    const sitekey = await f.evaluate(() => {
      const el = document.querySelector('[data-sitekey]');
      if (el) return el.getAttribute('data-sitekey');
      const ifr = [...document.querySelectorAll('iframe')].find(i => /(hcaptcha|recaptcha)\.com|google\.com\/recaptcha/i.test(i.src || ''));
      if (ifr) {
        const u = new URL(ifr.src);
        return u.searchParams.get('sitekey') || u.searchParams.get('k');
      }
      return null;
    });
    if (sitekey) { console.log('found in', f.url(), '→', sitekey); break; }
  } catch { /* detached frame */ }
}
```

### Linked count cells — the cell text IS the link text

ASP.NET dashboards often render counters as `<a id="lbtnNosOfX">N</a>` where `N` is the number and the LABEL ("Document Request List", "Bid Supplements", "Pending Tasks") sits in a sibling cell. A heuristic that filters anchors by their innerText for the label returns nothing — the link's text is the digit.

```javascript
// ✅ Find by the stable element id (or postback target name)
const link = document.querySelector('a#lbtnNosOfDRL');
const count = parseInt(link.innerText, 10);
// Click via postback target since the id pattern is stable
await page.evaluate(() => __doPostBack('lbtnNosOfDRL', ''));
```

When the label and count are in separate cells, locate the postback link by parsing the page HTML for `<a id="lbtnNosOf*"` or `__doPostBack('lbtnNosOf*'`. The id pattern is stable across renders even when the `ctl0X` prefix isn't.

### Search-form filters silently exclude exact-ID matches

A "Detailed Search" with date-range, category, and budget filters defaults to a narrow window (often the last 1-3 months). Putting a record's ID in the keyword box AND-combines with all the other filters — so a notice published outside that window returns "No results" even though it exists.

For exact-ID lookups, prefer the **simple search box** (single keyword + Search submit) on the basic listing page, not the detailed/advanced search form. Detailed search is for filtering many results, not finding one.

If you must use detailed search, **widen all date ranges to the maximum span** before filling the keyword:
```javascript
await page.evaluate(() => {
  document.querySelectorAll('input[id*="dateText"], input[name*="datePicker"]').forEach(i => {
    if (/From|Min/.test(i.id)) i.value = '01-Jan-2020';
    if (/To|Max/.test(i.id)) i.value = '31-Dec-2030';
  });
});
```

### Don't guess deep-link URL patterns — discover them from a working link

Tempting shortcut: knowing a record's numeric ID, construct `/some/Path.aspx?refID=N` and `goto()`. On portals with versioned URL schemas (PhilGEPS, BIR, SEC), most guessed patterns redirect to a generic `ErrorPage.aspx` saying "Transaction cannot be completed". You can't tell from the error whether the URL is wrong, the record is gone, or the session lacks permission.

**Pattern**: search via the UI for any record, click the result row, capture the resulting URL — that's the canonical pattern. Then substitute the ID. Always note the EXACT query-string keys (some portals use `refID`, others `pubReferenceID`, `noticeId`, `Result=N`, `DirectFrom=…` — these are not interchangeable).

### Multi-step basket / order flows — download URLs only valid after final Submit

E-procurement / ticketing / membership portals often have a 4-step "add to cart → review → confirm → submit" pipeline before downloads work:

1. **Pre-cart**: links are `javascript:PassValue(itemID, ...)` — these don't download, they just stage the item
2. **Order Basket**: shows price/quantity, has a `Continue` button
3. **Order Confirmation**: shows summary + `Submit` button
4. **Order Complete**: only NOW do the per-item links become real `__doPostBack('ctlNN','')` triggers that stream files

Don't try to download from steps 1-3 — clicking the link calls a JS stub or refreshes the page. Walk the full flow first; the post-Submit page is also where the order/confirmation number appears (worth saving for receipts).

### Always log out before disconnecting puppeteer

Many portals (PhilGEPS, banking sites, some SaaS dashboards) reject a fresh login while another session is still active for the same user — leaves the next run unable to authenticate without manually killing the prior session in the web UI. Find the logout link by text (`Log-out`, `Logout`, `Sign out` — sometimes prefixed with `»`) and wait for the redirect to a login URL before disconnecting.

```javascript
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
  page.evaluate(() => {
    const link = [...document.querySelectorAll('a')]
      .find(a => /^(»\s*)?(Log[-\s]?out|Sign[-\s]?out)$/i.test((a.innerText || '').trim()));
    if (link) link.click();
  }),
]);
// Confirm by URL pattern before disconnect
if (!/log[-_]?in|signin|account\/sign/.test(page.url())) {
  console.warn('[logout may have failed]', page.url());
}
```

This is mandatory on PhilGEPS — leaving a session open blocks the next BrowserControl run for the same user. The same caution applies to single-session-per-user portals like banking dashboards and some HR/SAP systems.

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

### page.type() is too slow for multi-field forms — use evaluate bulk setter instead

`page.type(selector, text, { delay: 40 })` types at 40ms per character. A form with 8 fields averaging 15 chars each = ~5 seconds of typing. With `protocolTimeout: 60000` this can still hit the limit on complex SPAs, and it's always slower than necessary.

**Use `page.evaluate()` to set all field values at once:**
```javascript
await page.evaluate(() => {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set('application_name', 'Personal Movie App');
  set('application_url',  'https://bicc.ph');
  set('contact_first_name', 'Marcus');
  set('contact_last_name',  'Whitfield');
  // ... all fields in one round-trip
});
```

Why this works: React and Vue both update their internal state when `input`/`change` events fire on a native element — they don't require real keystrokes. The `set()` helper above is the minimal correct pattern: assign `.value`, then dispatch both events.

When NOT to use this: login forms with anti-bot checks (some sites detect that no keydown events fired) — use `page.type()` for username/password fields specifically.

**Also fails on legacy non-React forms (Apache Wicket, JSF, classic ASP.NET WebForms).** The submit handler on these reads from server-side component state, not the DOM `.value`, so dispatching `input`/`change` events is a no-op — the form posts as if blank. Symptom: code looks like fields are filled, the form submits, server says "required field missing". Switch to `page.click(sel, { clickCount: 3 })` (to clear) + `page.type(sel, value, { delay: 40 })` for these forms. Verified on BPI BizLink (Wicket).

### Hidden side-nav menus — extract `<a href>` and `page.goto()` directly

Legacy enterprise portals (Apache Wicket, JSF, older Bootstrap admin themes) commonly render the full navigation tree into the DOM at page load, hide it with `display: none` on the container, and rely on a JS toggle to slide it open. Clicking the toggle (`☰` hamburger) often does NOT work via `mouse.click()` — the items remain rendered far off-screen (e.g. `x = -10283`) and any element-by-text click misfires.

**Don't try to open the menu — extract the hrefs once, navigate by URL.** All menu items are `<a href="...">` in the hidden DOM:

```javascript
// One-time discovery: dump every menu link
const links = await page.evaluate(() =>
  [...document.querySelectorAll('a')]
    .filter(a => a.href && a.innerText?.trim())
    .map(a => ({ text: a.innerText.trim(), href: a.href }))
);
console.log(JSON.stringify(links, null, 2));
// Then navigate directly: await page.goto(links.find(l=>l.text==='Statement of Account').href);
```

Why this works: hidden ≠ unrendered. The `<a>` elements are fully present with valid hrefs; only the visual styling is suppressed. `page.goto(href)` skips the toggle entirely. Verified on BPI BizLink (Wicket).

For Wicket portals specifically, the menu hrefs follow `?<n>-1.ILinkListener-menuPanel-zeroLevelMenu-<group>-recursiveMenu-rows-<row>-row-menuLink` where `<n>` is a per-session id — capture them per-session, don't hardcode `<n>`.

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

### Intercepting PDF binary responses during navigation

Some portals (e.g. SEEK employer portal) serve documents as HTTP binary responses triggered by navigating to a page URL — there's no direct download link. Capture them with `page.on('response')`.

**Register the handler BEFORE `page.goto()`** or the response fires before you attach.

```javascript
async function downloadViaInterception(page, pageUrl, attachmentHostFragment) {
  return new Promise(async (resolve) => {
    let resolved = false;
    const done = (buf) => {
      if (!resolved) { resolved = true; page.off('response', handler); resolve(buf); }
    };
    const handler = async res => {
      const ct = res.headers()['content-type'] || '';
      const u = res.url();
      // Match all PDF content-type variants — see below
      const isPdf = ct.includes('application/pdf') || ct.includes('octet-stream');
      if (isPdf && u.includes(attachmentHostFragment)) {
        try { done(await res.buffer()); } catch(e) { done(null); }
      }
    };
    page.on('response', handler);
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    } catch(e) {}
    await new Promise(r => setTimeout(r, 5000));  // wait for any post-networkidle requests
    done(null);  // timeout fallback — null means no PDF received
  });
}
```

**Content-type variants** for PDF/binary attachments:
- `application/pdf` — standard
- `application/octet-stream` — common for binary downloads
- `binary/octet-stream` — non-standard variant used by some portals (e.g. SEEK)

Use `ct.includes('octet-stream')` to match all three. Do not check for only `application/pdf`.

**If the PDF doesn't fire immediately after goto**, the page may need UI interaction first (a panel to open, a button to click). Use `waitForFunction` to detect when the content panel opens, then wait for the response to arrive.

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

### WebAuthn / passkey login — don't try to automate, hand off to the user

CDP-injected `mouse.click()` does NOT trigger the OS-level credential dialog (Windows Hello, macOS Touch ID, Android biometric). The click registers, the URL may navigate to `/challenge/passkey` (or similar), but no Windows Hello prompt appears and no error fires — the page just sits there forever.

Why: WebAuthn (`navigator.credentials.get()`) requires "user activation" — a real human-input gesture. Chrome's WebAuthn implementation distinguishes CDP-injected events from genuine input and silently refuses to invoke the platform authenticator on the former. Same applies to Playwright.

**Pattern: automate up to the auth method picker, then stop.** Type the phone/email and click Continue, but let the user click "Continue with Passkey" (or "Send Push / Send OTP") themselves in the Chrome window. The user's click is a real gesture that satisfies WebAuthn, and out-of-band channels (push, SMS) need them anyway.

```javascript
// ✅ Automate phone-entry + Continue, then poll for the user's auth choice
await page.type('input[type="tel"]', PHONE);
await page.click('button:has-text("Continue")');
console.log('*** Pick auth method (Push/OTP/Passkey) in the Chrome window ***');
for (let t = 0; t < 60; t++) {                        // 5 min cap
  await sleep(5000);
  if (!page.url().includes('weblogin')) break;        // logged in
}
```

Don't go past two minutes of polling — OAuth `ctx_id` / `state` parameters typically expire fast (see next note).

### OAuth challenge-options session expires fast — act within ~2 minutes

OAuth-style auth-method-picker pages (Grab `/challenge-options`, similar Apple/Google flows) carry a server-side session keyed by `ctx_id`/`state` in the URL. If the user lingers on the picker for ~5+ minutes before clicking an option, the next click yields "Oops, something went wrong" instead of advancing — the session expired. `history.back()` to retry uses the now-invalid session and fails the same way.

**Recovery is to start completely fresh:** click "Back to login", re-enter the phone, re-pick the method. Don't try to reuse the URL's `ctx_id`.

**Prevention:** keep poll-for-user windows under ~2 minutes; if you need longer, prompt the user before starting so they're ready, rather than after.

### URL substring checks — `url.includes('challenge')` matches `code_challenge=` query param

OAuth/PKCE redirect URLs are stuffed with words that overlap with path segments: `code_challenge=`, `state=`, `redirect_uri=`, `nonce=`, `request_id=`. A naive `page.url().includes('login')` or `.includes('challenge')` will give wrong answers because the query string contains those substrings.

```javascript
// ❌ Wrong — `code_challenge=` in query string makes this true even on the phone-entry page
if (page.url().includes('challenge')) { /* misfires */ }

// ✅ Correct — check the pathname only
const path = new URL(page.url()).pathname;
if (path.endsWith('/login')) { /* phone-entry page */ }
if (path.includes('/challenge-options')) { /* auth-method picker */ }
```

This bites hardest on weblogin / OIDC providers whose URLs span 800+ chars of query parameters.

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

**`Page.captureScreenshot timed out` on heavy pages** — pages with many large embedded images (e.g. Proton Mail email bodies with 10+ attachments) can cause `page.screenshot()` to exceed the `protocolTimeout`. Two fixes:
1. Increase `protocolTimeout` to `180000` in `puppeteer.connect()` for sessions that need screenshots of email bodies.
2. Skip screenshots immediately after clicking to open an email — take them only after a plain navigation where the page is lighter.

### `page.click(selector)` timeout → use `page.type()` instead

When `page.click('#field')` throws `Runtime.callFunctionOn timed out`, the CDP call to locate the element is stalling (heavy SPA, blocked JS). For **input fields**, `page.type(selector, value)` is a lighter alternative — it sends keystrokes directly without the same CDP round-trip:

```javascript
// ❌ page.click() can time out on heavy SPAs before you even start typing
await page.click('#username');
await page.keyboard.type(value);

// ✅ page.type() sends keystrokes directly — doesn't time out in the same way
await page.type('#username', value, { delay: 60 });
```

Why: `page.click()` uses `Runtime.callFunctionOn` to evaluate a click-dispatch function in the page context. If the page's JS is still loading/executing, this stalls. `page.type()` bypasses that by injecting key events at the CDP `Input.insertText`/`Input.dispatchKeyEvent` level.

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

**Proton Mail email body is in a nested iframe.** The main page (`mail.proton.me`) renders the email list, but when a message is open, the email body (including all links like verification URLs) is rendered inside a sandboxed iframe that shares the same base URL. Iterating `page.frames()` and searching each frame is required:

```javascript
let verifyLink = null;
for (const frame of page.frames()) {
  try {
    const links = await frame.evaluate(() =>
      [...document.querySelectorAll('a')]
        .map(a => a.href)
        .filter(h => h.includes('themoviedb') || h.includes('verify') || h.includes('activate'))
    );
    if (links.length > 0) { verifyLink = links[0]; break; }
  } catch (e) {}  // some frames (extensions, sandboxed) throw on evaluate — ignore
}
```

The email body iframe is typically frame index 3–5 when Proton Mail is fully loaded.

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
await client.send('Browser.setDownloadBehavior', {
  behavior: 'allow', downloadPath: SAVE_DIR, eventsEnabled: true
});
client.on('Browser.downloadWillBegin', e => console.log('download:', e.suggestedFilename, e.url));
client.on('Browser.downloadProgress', e => { if (e.state !== 'inProgress') console.log('state:', e.state); });
await page.mouse.click(linkX, linkY);  // trusted click; do NOT use dispatchEvent here
// The file lands in SAVE_DIR — poll for the new file or wait for state==='completed'
```

Prefer `Browser.setDownloadBehavior` (with `eventsEnabled: true`) over the older `Page.setDownloadBehavior`. The Browser variant fires `Browser.downloadWillBegin` and `Browser.downloadProgress` events so you know the suggested filename and when the download has actually completed — instead of polling the directory blind.

Symptoms that the trusted-click path is needed:
- Direct `fetch()` of the URL returns 500 or empty
- The link element has `onclick` but no `href` (or an `href="#"`)
- The native browser download "just works" when clicked manually
- **The href is a `blob:` URL** — these only exist inside the originating page's context. `https.get` and `fetch` from outside the page will fail. Trusted-click + CDP capture is the only way (verified on Proton recovery kit downloads).

Pace these portals: Google Workspace rate-limits at ~20 rapid downloads → forces password re-verify. Add ≥ 2 second delay between downloads on any portal whose links are session-tokened.

### Capturing PDF/binary attachment downloads — CDP `Fetch` domain at Response stage

When a portal returns a download as a regular HTTP response (`Content-Type: application/pdf` + `Content-Disposition: attachment`), Chrome consumes the response body for its download flow before puppeteer can read it. Three approaches that all FAIL — don't waste time on them:

1. **`Browser.setDownloadBehavior` + `Browser.downloadWillBegin`** — click registers, no file ever lands in the configured download dir.
2. **`page.on('response', async r => r.buffer())`** — response IS detected with correct headers, but `r.buffer()` throws `Could not load response body for this request`.
3. **`Network.responseReceived` + `Network.getResponseBody`** — detects the requestId, but `getResponseBody` returns `Protocol error: No resource with given identifier found`. Download responses are evicted from Chrome's network cache faster than the puppeteer event loop can call back.

**The working approach: CDP `Fetch` domain at Response stage**, which PAUSES the request before Chrome consumes it.

```javascript
const cdpClient = await page.target().createCDPSession();
await cdpClient.send('Fetch.enable', {
  patterns: [{ urlPattern: '*', requestStage: 'Response' }]
});

const buf = await new Promise((resolve) => {
  const handler = async (event) => {
    const { requestId, responseHeaders, responseStatusCode } = event;
    const ct = (responseHeaders || []).find(h => h.name.toLowerCase() === 'content-type')?.value || '';
    const cd = (responseHeaders || []).find(h => h.name.toLowerCase() === 'content-disposition')?.value || '';
    if (ct.includes('application/pdf') || cd.includes('attachment')) {
      const { body, base64Encoded } = await cdpClient.send('Fetch.getResponseBody', { requestId });
      const captured = base64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body);
      // MUST fulfill so Chrome doesn't hang
      await cdpClient.send('Fetch.fulfillRequest', {
        requestId, responseCode: responseStatusCode,
        responseHeaders, body: captured.toString('base64')
      });
      cdpClient.off('Fetch.requestPaused', handler);
      resolve(captured);
    } else {
      await cdpClient.send('Fetch.continueRequest', { requestId });
    }
  };
  cdpClient.on('Fetch.requestPaused', handler);
});

await cdpClient.send('Fetch.disable');
fs.writeFileSync(savePath, buf);
```

Critical points:
- `requestStage: 'Response'` (not `'Request'`) — you need response headers to identify the PDF, then grab the body.
- After capturing, MUST call `Fetch.fulfillRequest` (or `continueRequest` for non-matches) or Chrome stalls indefinitely.
- Always `Fetch.disable` between iterations so handlers don't accumulate.
- Validate magic bytes: `buf.slice(0,4).toString() === '%PDF'`.

Verified on BPI BizLink (Apache Wicket portal — `bpibizlink.com`). Likely the right approach for any other portal where Browser/Network domains all fail to capture an attachment download.

### `<textarea readonly>` values are invisible to `innerText` — read `.value` or parse HTML

`document.body.innerText` (and `document.body.textContent`) skips `<textarea>` element values — you get the label text but not the content of the textarea. This silently breaks API key extraction, confirmation codes, and any form where the value is pre-filled into a read-only textarea.

```javascript
// ❌ Wrong — returns "" for textarea content
const key = (await page.evaluate(() => document.body.innerText)).match(/[a-f0-9]{32}/)?.[0];

// ✅ Option A — read the textarea .value directly
const key = await page.evaluate(() => document.querySelector('#v3_api_key')?.value);

// ✅ Option B — parse innerHTML with a regex if you don't know the selector
const key = (await page.evaluate(() => document.body.innerHTML))
  .match(/<textarea[^>]*>([a-f0-9]{32})<\/textarea>/)?.[1];
```

Sites known to use this pattern: TMDB (`#v3_api_key` textarea), any portal that shows tokens/secrets in a read-only field.

### Reading values from the page after a "Copy" button — read the DOM, not the clipboard

When a page has a "Copy to clipboard" button (recovery phrases, API keys, share links), do **not** rely on `navigator.clipboard.readText()` to capture the value:

- The clipboard returns whatever was on the **OS clipboard** before — possibly stale content from another app
- Clipboard read access is gated by browser permissions and may silently return null
- Many "Copy" links don't actually copy — they toggle the UI to reveal the value (Proton's `copy recovery phrase` link is one example: it swaps the recovery card from PDF mode to phrase-display mode with a `Show` button)

Instead: click the reveal/show control, then extract the value from the DOM:

```javascript
// e.g. recovery phrase = 12 lowercase words space-separated
const phrase = await page.evaluate(() => {
  const lines = document.body.innerText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const words = line.split(/\s+/);
    if (words.length >= 12 && words.length <= 24 && words.every(w => /^[a-z]+$/.test(w))) {
      return line;
    }
  }
  return null;
});
```

### Inline `node -e` with CSS ID selectors — bash treats `#` as a comment

Running `node -e 'console.log(page.$("#login"))'` in bash will silently truncate everything after the `#` — bash treats it as a comment character. The script runs but the selector is empty, causing confusing `null` results with no error.

**Always write scripts to `.js` files when using CSS ID selectors:**
```bash
# ❌ Bash silently strips everything after # — page.$( gets "" as selector
node -e "const p = ...; p.$('#login').click();"

# ✅ Write to file first, then run
cat > /tmp/click.js << 'EOF'
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const [p] = await b.pages();
  await p.$('#login').click();
})();
EOF
node /tmp/click.js
```

This applies to any bash heredoc or `-e` argument containing `#id`, `#selector`, or `#comment-text`. Single-quoted heredocs (`<< 'EOF'`) are the safe container — bash does not interpret `#` inside them.

### Running a long Node script in a visible Windows terminal

When a script runs for minutes and the user needs to watch live output, do NOT run it as a background Bash command — the output is hidden. Instead open a persistent PowerShell window:

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node C:\path\to\script.js"
```

`-NoExit` keeps the window open after the script finishes so the user can read the final summary. The window prints stdout/stderr live as the script runs.

### Killing a running Node process on Windows

```powershell
Stop-Process -Name "node" -Force
```

This kills all `node.exe` processes. On Windows, `pkill node` (bash) is unreliable — use `Stop-Process` via PowerShell instead.

### File output on Windows — no emoji in stdout

Python's default Windows stdout encoding is `cp1252`, which throws `UnicodeEncodeError` on emoji like ✅ ❌. Use ASCII tags `[OK]` / `[FAIL]` in log lines, or set `PYTHONIOENCODING=utf-8` before running. Same issue applies to Node only when piping to non-UTF-8 consoles, but it's safer to keep log output ASCII.

### Remote server cookie bridge — login on Windows, run on Linux headless server

When a BrowserControl script runs on a remote headless Linux server and hits a login wall, use this pattern to inject fresh cookies from the Windows Chrome session without touching the server.

**Server-side (any script, any site):**

```javascript
const fs   = require('fs');
const os   = require('os');
const path = require('path');

async function waitForCookieBridge(page, hostname) {
  const safeHost  = hostname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cookieDir = path.join(os.homedir(), '.browsercontrol', 'pending-cookies');
  const cookieFile = path.join(cookieDir, `${safeHost}.json`);

  console.log(`\n*** SESSION EXPIRED for ${hostname} ***`);
  console.log(`*** Run on Windows: node send-cookies.js ${hostname} ***\n`);

  fs.mkdirSync(cookieDir, { recursive: true });

  for (let i = 0; i < 120; i++) {   // wait up to 10 minutes
    await new Promise(r => setTimeout(r, 5000));
    if (fs.existsSync(cookieFile)) {
      const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      await page.setCookie(...cookies);
      fs.unlinkSync(cookieFile);
      console.log(`[${cookies.length} cookies imported — resuming]`);
      // Reload current page to activate new session
      await page.reload({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      return;
    }
  }
  throw new Error('Timed out waiting for cookie bridge (10 min)');
}
```

Call it immediately after detecting a login redirect:
```javascript
if (page.url().includes('/login') || page.url().includes('/signin')) {
  await waitForCookieBridge(page, 'ph.employer.seek.com');
  // then retry the operation
}
```

**Windows-side (one command):**
```bash
node ~/.claude/skills/BrowserControl/send-cookies.js ph.employer.seek.com
```

`send-cookies.js` connects to Windows Chrome (launching it if needed), extracts all cookies for the domain via CDP `Network.getAllCookies`, and SCPs them to `tj@humanpower.one:~/.browsercontrol/pending-cookies/{hostname}.json`. The server detects the file, imports the cookies, and resumes automatically.

**Requirements:**
- Key-based SSH from Windows to server (no password prompt for `scp`/`ssh`)
- Chrome must be logged into the site on Windows before running `send-cookies.js`
- Server config: `REMOTE_SSH_USER=tj`, `REMOTE_SSH_HOST=humanpower.one` (stored in `.env`)

**Why CDP `Network.getAllCookies` instead of `page.cookies()`:** `page.cookies()` only returns cookies for the current page's exact URL. `Network.getAllCookies` returns the entire browser cookie store — including root-domain cookies (e.g. `.seek.com`), httpOnly cookies, and cookies set by other tabs — which is what the server needs to fully restore the session.

### Headless Chrome on Linux (Ubuntu server)

```bash
# Launch once; sessions persist in ~/.chromedebug
chromium --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.chromedebug \
  --headless=new \
  --no-sandbox --disable-gpu \
  --disable-dev-shm-usage \
  </dev/null &
sleep 3
curl -s http://127.0.0.1:9222/json/version
```

`--disable-dev-shm-usage` is required on most Ubuntu servers — `/dev/shm` is too small by default and causes Chrome to crash silently.

Puppeteer connects identically: `puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' })` — same code as Windows.

### Idempotent re-runs handle browser context drops

`TargetClosedError` (Playwright) / `Protocol error: Target closed` (Puppeteer) can fire mid-iteration on long runs — the CDP connection just drops. There's no clean recovery; design every script around `if fs.existsSync(fp) skip` so a re-run picks up where it left off rather than re-downloading everything.

### Auditing a plain-HTTPS scraper — use BrowserControl to find missing link patterns

Before writing a scraper's `href` regex, use BrowserControl to extract every link on the page and identify all URL patterns in use. Sites frequently mix link types (direct PDFs, Google Drive, OneDrive, internal paths) across different sections or tabs — a regex that only matches one pattern silently misses the rest.

```javascript
// Extract all links and group by URL pattern
const links = await page.evaluate(() =>
  [...document.querySelectorAll('a[href]')].map(a => a.href)
);
const patterns = {};
for (const url of links) {
  const host = new URL(url).hostname;
  patterns[host] = (patterns[host] || 0) + 1;
}
console.log(patterns);
// e.g. { 'isufst.edu.ph': 80, 'drive.google.com': 37 } → scraper must match BOTH
```

Why: a scraper that only matches `.pdf` hrefs will silently pass with 0 errors but miss every Google Drive / OneDrive entry. The count mismatch between BrowserControl and the scraper's output is the signal.

### DataTables pages — all rows are in the raw HTML (no AJAX needed)

Sites using the jQuery DataTables plugin render all rows in a `<tbody>` at page load — pagination, search, and tab-filtering happen entirely client-side. A plain HTTPS fetch gets every row across every tab, even though the browser only displays the active tab.

Why this matters: don't add Puppeteer tab-clicking just because the UI has campus/category tabs. Verify first with `html.match(/<tr[^>]*class="row-\d+"/g)?.length` — if the count equals the total shown in all tabs combined, the data is all inline.

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
