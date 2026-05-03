---
name: paf-watcher
description: Watches paf.mil.ph/notice-of-procurement/ for new upcoming Invitation to Bid (ITB) notices. Launches Chrome headlessly, scrapes listings, parses PDFs, reports upcoming biddings.
trigger: /paf-watcher
---

# /paf-watcher

Monitor the Philippine Air Force procurement page for new ITB 2026 notices with upcoming bid opening dates.

## What it does

1. Launches Chrome headlessly (no debug port, no BrowserControl)
2. Fetches `https://www.paf.mil.ph/notice-of-procurement/`
3. Filters links to ITB 2026 notices not yet in `seen.json`
4. For each new notice: navigates to the page, finds the PDF, downloads it via in-page `fetch()`, parses it with `pdf-parse`
5. Extracts: bid opening date, location, project lots, ABC (Approved Budget for the Contract)
6. Reports upcoming vs. past vs. date-unknown
7. Saves state to `seen.json` (skipped on next run) and results to `results/YYYY-MM-DD.json`

## Usage

```
/paf-watcher setup          # copy script files into a new subfolder and npm install
/paf-watcher run            # run check.js directly (node check.js)
/paf-watcher schedule       # instructions to add to Windows Task Scheduler
/paf-watcher reset          # delete seen.json to reprocess all notices from scratch
```

## Setup

The watcher lives in its own subfolder with its own `package.json`. To deploy to a new location:

```bash
mkdir paf-watcher && cd paf-watcher
# copy check.js, package.json, run.bat from SkillRepository
npm install
node check.js
```

Required npm packages (installed locally in the watcher folder):
- `puppeteer-core` — connects to or launches Chrome
- `pdf-parse@1.1.1` — **must be 1.1.1**, not v2.x (v2 has a broken CJS export)

Chrome must be installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` or override via `CHROME_PATH` env var.

## Scheduling (Windows Task Scheduler)

1. Open Task Scheduler → Create Basic Task
2. Trigger: Daily (recommended: 8:00 AM)
3. Action: Start a program → `run.bat` (full path)
4. Log output goes to `results\watcher.log`

## Key technical notes

### PAF site blocks non-Chrome HTTP connections
Direct Node.js `https` requests and `curl` both get `ETIMEDOUT` at TCP level. Only Chrome's TLS fingerprint gets through. The watcher uses `puppeteer.launch()` with `executablePath` (not `puppeteer.connect()`) so it works without an existing Chrome instance.

### PDF download via in-page fetch
After navigating to the notice page, PDFs are downloaded using `page.evaluate(() => fetch(url))` — this uses Chrome's session and TLS fingerprint, bypassing the server IP block that would reject a direct Node.js download.

### pdf-parse version must be 1.1.1
`pdf-parse` v2.x changed its export to ESM-only and breaks with `pdfParse is not a function`. Pin to `"pdf-parse": "1.1.1"` in `package.json`.

### ITB 2026 filter
Links are filtered by title: must contain "Invitation to Bid" or `\bITB\b`, AND match `\d+-26\b` or `-026\b` (the bid reference number format, not dates in the text).

### PDF structure
Bid opening date: Section 9 — `"Bid opening shall be on [Month DD, YYYY]"`
Lot table rows: `PB-PAF[BAC1/BAC2]-NNN-26 [description] [ABC amount] [bid doc price]`

### Rate limiting on fresh sessions
Fetching many PDFs rapidly from a fresh headless Chrome (no session cookies) can trigger rate limiting. This only affects the first/baseline run which processes all historical notices. Subsequent daily runs check 1-3 new notices and are well within limits.

## Output

`results/YYYY-MM-DD.json`:
```json
{
  "date": "2026-05-03",
  "upcoming": [ { "title": "...", "url": "...", "pdfUrl": "...", "bidOpenRaw": "May 20, 2026", "location": "...", "lots": [...], "totalABC": 1234567 } ],
  "alreadyPast": [...],
  "noDate": [...]
}
```

`seen.json` — keyed by notice URL, value `{ title, checkedOn }`. Delete this file to reprocess all notices.
