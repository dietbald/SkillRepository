---
name: tieza-watcher
description: Watches tieza.gov.ph WordPress category pages for new procurement notices (Infrastructure, Consultancy, RFQ). Downloads and parses PDFs to extract bid opening dates.
trigger: /tieza-watcher
---

# /tieza-watcher

Monitor TIEZA (Tourism Infrastructure and Enterprise Zone Authority) procurement category pages for new upcoming biddings.

## What it does

1. Launches Chrome headlessly (no debug port, no BrowserControl)
2. Scrapes 3 WordPress category archive pages:
   - `/category/public-bidding/infrastructure/`
   - `/category/public-bidding/consultancy/`
   - `/category/request-for-quotation/`
3. For each new post: navigates to it, finds the PDF, downloads and parses it
4. Extracts bid opening / deadline date from PDF text
5. Reports upcoming vs. already-past vs. date-unknown
6. Saves state to `seen.json` and results to `results/YYYY-MM-DD.json`

## Usage

```
/tieza-watcher run            # node check.js
/tieza-watcher schedule       # instructions to add to Windows Task Scheduler
/tieza-watcher reset          # delete seen.json to reprocess all notices from scratch
```

## Setup

```bash
mkdir tieza-watcher && cd tieza-watcher
# copy check.js, package.json, run.bat
npm install
node check.js
```

Required npm packages:
- `puppeteer-core` — launches Chrome headlessly
- `pdf-parse@1.1.1` — **must be 1.1.1** (v2 breaks CJS export)

Chrome must be installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` or override via `CHROME_PATH`.

## Scheduling (Windows Task Scheduler)

Same as paf-watcher: Daily trigger → run.bat → logs to `results\watcher.log`.

## Key technical notes

### Splash page warm-up required
Fresh headless Chrome sessions hit a TIEZA splash page ("Enter Website" `<a>` link) that blocks the WordPress content. Navigate to `https://tieza.gov.ph/` first and click "Enter Website" to set the session cookie before scraping any category pages.

```javascript
await page.goto('https://tieza.gov.ph/', { waitUntil: 'domcontentloaded' });
await sleep(2000);
await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(a => /enter website/i.test(a.innerText || ''));
  if (a) a.click();
});
await sleep(2000);
// then scrape categories
```

Without this, the first category (infrastructure) returns 0 posts. Consultancy/RFQ work by coincidence — the 15s `waitForFunction` timeout on infrastructure happens to give the splash JS time to set the cookie.

### Category page scraping
Uses `waitUntil: 'networkidle2'` + cookie consent dismissal + `waitForFunction('article.length > 0')`. Selectors that work:
- `article, .post, .hentry` → post elements
- `h1,h2,h3,.entry-title,.post-title` → title within post
- `h2 a, h3 a, .entry-title a, a` → post URL

Fallback: `h2.entry-title a, h3.entry-title a` if article selector finds nothing.

### PDF download — direct Node.js https
TIEZA PDFs are publicly accessible. No session required. Use Node.js `https.get()` with redirect-following. Do NOT need `page.evaluate(() => fetch(...))` like PAF watcher.

### PDF date patterns (Philippine Bidding Documents)
PBD format (Infrastructure / Consultancy):
- `"The deadline for submission of bids is May 19, 2026"`
- `"The date and time of bid opening is May 19, 2026"`
- `"Bid opening shall be on May 19, 2026"`
- `"Opening of Bids: May 19, 2026"`

RFQ format:
- `"not later than 27 April, 2026"`
- `"not later than April 27, 2026"`
- `"on or before April 27, 2026"`

### Date parsing — handle both "Month DD, YYYY" and "DD Month, YYYY"
The separator between month name and year in PH documents is often `", "` (comma+space) — use `[,\s]+` not `\s+` to avoid missing the comma.

Also normalize extracted date strings with `.replace(/\s+/g, ' ')` since PDF text can embed newlines inside what appears to be a single date.

### PDF selection priority per post
1. Link whose text/href matches `/bid.*doc|pbd/i` (bidding documents PDF)
2. Link whose text exactly matches "Request for Quotation" or href matches `/\bRFQ\b(?!.*BOQ|.*plan|.*spec)/i`
3. First PDF link on page

Exclude links matching `/organizational|staffing|chart|pattern/i`.

### ABC extraction
Pattern: `Approved Budget[^:]*:?\s*(?:PHP|PhP|₱)?\s*([\d,]+(?:\.\d+)?)` — note some TIEZA PDFs omit the currency prefix; match is still reliable from the "Approved Budget" label.

## Output

`results/YYYY-MM-DD.json`:
```json
{
  "date": "2026-05-03",
  "upcoming": [ { "title": "...", "url": "...", "pdfUrl": "...", "bidOpenRaw": "May 19, 2026", "totalABC": null, "category": "public-bidding infrastructure" } ],
  "alreadyPast": [...],
  "noDate": [...]
}
```
