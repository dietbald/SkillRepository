# PCG Watcher

Watches [coastguard.gov.ph](https://coastguard.gov.ph) bidding opportunities for new procurement notices, downloads ITB PDFs, and reports new articles.

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\pcg-watcher
npm install
```

## Usage

```
node check.js
```

Or double-click `run.bat`.

## Requirements

- Chrome running on debug port 9223 with user-data-dir `C:\ChromeDebugPCG` (the profile that has the valid `cf_clearance` session)
- If Chrome 9223 is not running, the script will launch it automatically using that same profile
- `cf_clearance.json` — obtained by manually solving Cloudflare challenge once. Expires **2027-05-04**. When it expires, re-solve: open Chrome with `--remote-debugging-port=9223 --user-data-dir="C:\ChromeDebugPCG"`, navigate to coastguard.gov.ph, solve the challenge, then run `pcg-get-cookie.js` from the pcg-test folder.

## How it works

1. Connects to (or launches) Chrome on port 9223 — the profile with a valid Cloudflare session
2. Injects `cf_clearance` cookie so Cloudflare passes requests
3. Scrapes bidding opportunity listing pages for the current and 2 prior months
4. Parses `<h2 itemprop="name"><a href="...">` article links (Joomla blog layout)
5. Tracks seen articles in `seen.json`
6. For new articles: fetches detail page, extracts PDF links from `id="content"` area
7. Downloads PDFs via `page.evaluate(fetch(...))` — required because Cloudflare blocks plain Node.js https
8. Tries `pdf-parse`; PCG PDFs are typically scanned (CamScanner images), so text extraction may be empty
9. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **Cloudflare**: Cannot be bypassed with plain https or even a fresh headless Chrome + stealth. Must use the existing Chrome profile that has the solved session. `cf_clearance` is IP-bound and browser-fingerprint-bound.
- **PDF scoping**: PCG pages include 1,200+ navigation PDFs in the sidebar. Must scope PDF extraction to `id="content"` area only.
- **PDF downloads**: Must go through `page.evaluate(fetch(...))` inside the browser context — plain Node.js https gets 403 even with the cf_clearance cookie (TLS fingerprint mismatch).
- **Article structure**: Joomla 3.x blog layout — articles are in `<h2 itemprop="name">` within `class="blog"` div.
- **Month URLs**: `/index.php/related-links/bidding-opportunities/{year}/{month}` e.g. `/2026/april`
- **May 2026**: No articles yet as of 2026-05-04 (month just started).

## Output

- `results/YYYY-MM-DD.json` — full detail for each new article
- `results/*.pdf` — downloaded ITB PDFs
- `seen.json` — dedup map of article slug → first-seen date
