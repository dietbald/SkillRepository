---
name: wvsu-watcher
description: Watches wvsu.edu.ph/bids-and-awards-committee/ for new procurement notices (RFQ, IB, ITB). Estimates open/closed status from posting date since WVSU PDFs are scanned images.
trigger: /wvsu-watcher
---

# /wvsu-watcher

Monitor WVSU BAC (Bids and Awards Committee) listing page for new procurement notices.

## What it does

1. Connects to Chrome on port 9223 if available; falls back to launching headless Chrome
2. Navigates to `https://wvsu.edu.ph/about-wvsu/good-governance/bids-and-awards-committee/`
3. Waits for JS rendering then scrapes the AJAX-rendered table (each entry = its own `<table>`)
4. On initial run (empty seen.json): scrapes pages 1–5 to seed the dedup state
5. On subsequent runs: page 1 only (newest entries appear first)
6. Flags [CONSTRUCTION] items via keyword match on title
7. Estimates open/closed status from posting date (RFQ ≤10 days, IB/ITB ≤45 days)
8. Saves state to `seen.json` and results to `results/YYYY-MM-DD.json`

## Usage

```
/wvsu-watcher run            # node check.js
/wvsu-watcher schedule       # instructions to add to Windows Task Scheduler
/wvsu-watcher reset          # delete seen.json to reprocess all notices from scratch
```

## Setup

```bash
mkdir wvsu-watcher && cd wvsu-watcher
# copy check.js, package.json, run.bat
npm install
node check.js
```

Required npm packages (already installed in wvsu-watcher/):
- `puppeteer-extra` + `puppeteer-extra-plugin-stealth` — connects to port 9223 or launches headless
- `puppeteer-core` (fallback, headless launch only)

Chrome must be installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` or override via `CHROME_PATH`.

**Page is JavaScript-rendered** — plain `https` fetch returns no bid data. Puppeteer required.
**URL changed** from `/bids-and-awards-committee/` to `/about-wvsu/good-governance/bids-and-awards-committee/`.

## Scheduling (Windows Task Scheduler)

Same as paf-watcher: Daily trigger → run.bat → logs to `results\watcher.log`.

## Key technical notes

### WVSU PDFs are scanned images — no text extraction
All WVSU procurement PDFs are scanned document images. `pdf-parse` extracts 0 characters. Do not use pdf-parse; use posting date as a proxy for the deadline.

### Deadline estimation
- RFQ: deadline ≈ 10 days from date posted
- Invitation to Bid (IB/ITB): deadline ≈ 45 days from date posted
- Detection: if `rfqNo + title` matches `/\bib\b|itb|invitation/i`, use 45-day window; else 10-day.

### Table structure — use direct children, not querySelectorAll
The page uses a responsive table where each record renders as 4 separate `<tr>` rows each with exactly 2 `<td>` cells (label | value). Desktop view also adds a 1-cell combined row with many nested descendants.

**Critical**: use `[...row.children].filter(c => c.tagName === 'TD' || c.tagName === 'TH')` to get only direct children. Using `row.querySelectorAll('td, th')` picks up nested elements from the combined row and gives wrong cell counts.

Only process rows where `cells.length === 2`. The 4 label/value pairs are:
- `Project Name` → title
- `RFQ / IB / REI / No.` → rfqNo, pdfUrl (from links in value cell)
- `Campus / Office` → campus
- `Date Posted` → datePosted (MM/DD/YYYY format)

### Skip header rows
After grouping by "Project Name" label, skip if the value cell itself contains a column header pattern (e.g., "RFQ / IB / REI / No.", "Project Name/ Bid Bulletin"). Check with:
```javascript
const isHeaderText = t => /^(?:project\s*name|rfq\s*\/|ib\s*\/|campus\/|date\s*posted|bid\s*bulletin)/i.test(t.trim());
```

### Deduplication key
`seen[n.rfqNo || n.title]` — prefer rfqNo when available.

## Output

`results/YYYY-MM-DD.json`:
```json
{
  "date": "2026-05-03",
  "possiblyOpen": [ { "title": "...", "rfqNo": "...", "campus": "...", "datePosted": "...", "pdfUrl": "..." } ],
  "likelyClosed": [...]
}
```
