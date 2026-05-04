# Iloilo Provincial Government BAC Watcher

Watches [iloilo.gov.ph/en/bac-reports-view](https://iloilo.gov.ph/en/bac-reports-view) for new procurement notices from the Iloilo Provincial Government Bids and Awards Committee.

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\iloiloprov-watcher
```

No npm install needed — uses only Node.js built-in `https` module.

## Usage

```
node check.js
```

Or double-click `run.bat`.

## How it works

1. Fetches page 1 (sorted newest first) via plain https
2. Parses bid numbers (pattern: `HMO-26-604-B`, `PEO-26-54-B`, `GSO-26-570-B`) from stripped text
3. Deduplicates by bid number in `seen.json`
4. Flags [CONSTRUCTION] items by keyword matching on title
5. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **URL**: `https://iloilo.gov.ph/en/bac-reports-view` (page 1 = newest entries)
- **No Cloudflare / auth** — plain https works
- **Page structure**: Drupal-based div list with `.views-row` items; each has bid number, taxonomy tags, author, date (YYYY-MM-DD)
- **636+ pages** but page 1 always shows newest — only page 1 needed
- **Bid number prefixes**: HMO (hospital), RTH, CDH, IPH (health), GSO (general), PEO (engineering), AGR (agriculture), PSW, DDH, DRL, etc.
- **Construction bid prefix**: PEO- (Provincial Engineering Office) most common for civil works

## BAC Contact

5F Right Wing, Iloilo Provincial Capitol, Bonifacio Drive, Iloilo City | bac@iloilo.gov.ph

## Output

- `results/YYYY-MM-DD.json` — new items found that day
- `seen.json` — dedup map of bid number → first-seen date
