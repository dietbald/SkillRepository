# UPV (University of the Philippines Visayas) BAC Watcher

Watches [upv.edu.ph/index.php/bids-and-awards](https://www.upv.edu.ph/index.php/bids-and-awards) for new procurement and infrastructure bids from UP Visayas (Miagao, Iloilo).

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\upv-watcher
```

No npm install needed — uses only Node.js built-in `https` module.

## Usage

```
node check.js
```

Or double-click `run.bat`.

## How it works

1. Fetches the page via plain https (no Cloudflare, no auth needed)
2. Finds the "INVITATION TO BID" section and parses `<li>` items
3. Extracts PDF links with pattern `/files/itb-YYYY-NNN.pdf` or `/files/BD-YY-NNN.pdf`
4. Deduplicates by PDF URL in `seen.json`
5. Flags [CONSTRUCTION] items by keyword matching on title
6. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **URL**: `https://www.upv.edu.ph/index.php/bids-and-awards`
- **No Cloudflare / auth** — plain https works
- **Page structure**: Single HTML page with two sections: INVITATION TO BID + REQUEST FOR QUOTATION
- **PDF naming**: `/files/itb-YYYY-NNN.pdf` (2024+) or `/files/BD-YY-NNN.pdf` (2023)
- **All bids listed on one page** — no pagination
- **Campuses covered**: Miagao (main), Iloilo City, Brackishwater Aquaculture Station (Leganes)
- **Common construction bids**: dorm rehabilitation, lab renovation, fire safety provisions, solar panels, building repairs
- **Contact**: Supply and Property Services Office | (033) 315-9858 | (033) 315-8141

## Output

- `results/YYYY-MM-DD.json` — new items found that day
- `seen.json` — dedup map of PDF URL → first-seen date
