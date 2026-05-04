# Iloilo City BAC Watcher

Watches [iloilocity.gov.ph/bids-and-awards-committee/](https://iloilocity.gov.ph/bids-and-awards-committee/) for new procurement notices from the Iloilo City Government Bids and Awards Committee.

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\iloilocity-watcher
```

No npm install needed — uses only Node.js built-in `https` module.

## Usage

```
node check.js
```

Or double-click `run.bat`.

## How it works

1. Fetches the page via plain https (no Cloudflare, no auth needed)
2. Parses custom HTML tables — two column layouts: 7-col (SVP/RFQ) and 8-col (INFRA bids)
3. Deduplicates by P.R. No. in `seen.json`
4. Flags [CONSTRUCTION] items via `Classification = INFRA` (reliable) and keyword fallback
5. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **URL**: `https://iloilocity.gov.ph/bids-and-awards-committee/`
- **No Cloudflare / auth** — plain https works
- **Table structure**: two formats on same page:
  - 8-column: Item No. | Doc Type | **Classification** | P.R. No. | Title | Publish Date | Closing Date | File
  - 7-column: Item No. | Doc Type | P.R. No. | Title | Publish Date | Closing Date | File
- **Classification = "INFRA"** is the reliable flag for construction/infrastructure bids
- **PDF links**: Google Drive (`drive.google.com/file/d/...`)
- **Date selector dropdown** on page — but all entries appear on single page load (no pagination needed)

## Known active construction bids (as of May 2026)

All March 2026 INFRA bids (26-008 through 26-032) had April 2026 deadlines — already closed. New bids for Q2 2026 not yet posted as of 2026-05-04.

## Output

- `results/YYYY-MM-DD.json` — new items found that day
- `seen.json` — dedup map of P.R. No. → first-seen date
