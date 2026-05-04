# ISUFST Watcher

Watches [isufst.edu.ph/bids-and-awards/](https://isufst.edu.ph/bids-and-awards/) for new procurement notices, highlights construction/infrastructure bids.

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\isufst-watcher
```

No npm install needed — uses only Node.js built-in `https` module.

## Usage

```
node check.js
```

Or double-click `run.bat`.

## How it works

1. Fetches the page via plain https (no Cloudflare, no auth needed)
2. Parses WordPress table rows (`<tr class="row-N">`, columns 1–4: type, title, PDF link, year)
3. Deduplicates by PDF URL in `seen.json`
4. Flags [CONSTRUCTION] items matching keywords: rehabilitation, repair, civil works, fencing, drainage, etc.
5. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **No Puppeteer required** — plain Node.js https works
- **Page URL**: `https://isufst.edu.ph/bids-and-awards/`
- **PDF storage**: `/bidsandawards/{campus}/` — campuses: Dingle, Tiwi, Poblacion, Barotac Nuevo, Dumangas, San Enrique
- **Table structure**: WordPress table plugin rows with `class="row-N"`, columns `class="column-1..4"`
- **Page does NOT paginate** — all entries on one page (117+ rows as of May 2026)

## Output

- `results/YYYY-MM-DD.json` — new items found that day
- `seen.json` — dedup map of PDF URL → first-seen date
