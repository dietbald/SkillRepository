# coastguard.gov.ph

Philippine Coast Guard bidding opportunities portal. Protected by Cloudflare managed challenge (Turnstile).

## Status
Verified working as of 2026-05-04. `cf_clearance` expires **2027-05-04**.

## Cloudflare bypass — the only working approach

`cf_clearance` is bound to **both the originating IP AND the browser fingerprint** of the Chrome instance that solved it. The only way to reuse it is to:
1. Use the **same Chrome user-data-dir** (`C:\ChromeDebugPCG`) that originally solved the challenge
2. Connect to it via Puppeteer (`browserURL: 'http://127.0.0.1:9223'`)
3. Inject the saved cookie before navigating

**These approaches all get 403 — do not attempt:**
- Plain Node.js `https` with `cf_clearance` cookie (TLS JA3 fingerprint mismatch)
- `curl` with `cf_clearance` cookie (same reason)
- Fresh headless Chrome + stealth + injected `cf_clearance` (different fingerprint)
- 2captcha Turnstile token from their server (IP-bound, Cloudflare rejects from our IP)

## Launching / connecting

```javascript
// Check if port 9223 is up; if not, launch with the same profile
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
execFile(chromePath, [
  '--remote-debugging-port=9223',
  '--user-data-dir=C:\\ChromeDebugPCG',
  '--no-first-run',
  '--no-default-browser-check',
]);

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
```

## Renewing cf_clearance (when expired)

1. Launch visible Chrome: `chrome.exe --remote-debugging-port=9223 --user-data-dir="C:\ChromeDebugPCG"`
2. Navigate to `https://coastguard.gov.ph` — solve the Cloudflare challenge manually
3. Run `pcg-get-cookie.js` from the pcg-test folder to extract and save the new cookie
4. Copy `cf_clearance.json` to `pcg-watcher/`

## URL structure

- Monthly listings: `https://coastguard.gov.ph/index.php/related-links/bidding-opportunities/{year}/{month}`
  e.g. `/2026/april`, `/2026/march`
- Article detail: `{listing-url}/{id-slug}` e.g. `7145-monthly-subscription-of-satellite-internet-...`

## Parsing articles (Joomla blog layout)

```javascript
// h2 itemprop="name" contains article links on listing pages
const re = /<h2[^>]*itemprop="name"[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
```

## Parsing PDFs — MUST scope to id="content"

The page includes 1,200+ sidebar/navigation PDFs. Scope to `id="content"` or you'll pick them all up:

```javascript
function parsePdfLinks(html) {
  const contentMatch = html.match(/id="content"[\s\S]*/);
  const scope = contentMatch ? contentMatch[0] : html;
  const re = /href="([^"]*\.pdf[^"]*)"/gi;
  // ...
}
```

## Downloading PDFs — must go through browser fetch

Plain `https` gets 403. Use `page.evaluate(fetch(...))` inside the browser context:

```javascript
const result = await page.evaluate(async (pdfUrl) => {
  const resp = await fetch(pdfUrl, { credentials: 'include' });
  if (!resp.ok) return { status: resp.status, data: null };
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { status: resp.status, data: btoa(binary) };
}, pdfUrl);
const buf = Buffer.from(result.data, 'base64');
```

## PDFs

All ITB PDFs are scanned via CamScanner — pdf-parse returns only "CamScanner" repeated. Use PyMuPDF + pytesseract for OCR (tesseract must be installed separately on Windows).

## Watcher location

`C:\Users\TJatBICC\Documents\JobstreetOdooLink\pcg-watcher\` — also committed to SkillRepository as `skills/pcg-watcher/`.
