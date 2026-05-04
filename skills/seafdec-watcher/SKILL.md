# SEAFDEC AQD Watcher

Watches [seafdec.org.ph/invitation-to-bid/](https://www.seafdec.org.ph/invitation-to-bid/) for new civil works procurement notices from the SEAFDEC Aquaculture Department (Tigbauan, Iloilo).

## Setup

```
cd C:\Users\TJatBICC\Documents\JobstreetOdooLink\seafdec-watcher
```

No npm install needed — uses only Node.js built-ins + Windows `curl.exe`.

## Usage

```
node check.js
```

Or double-click `run.bat`.

## How it works

1. Fetches the page via Windows `curl.exe` (SEAFDEC server is slow ~4s — Node.js `https` module times out, curl handles it correctly)
2. Parses job request numbers (pattern: `028-02-2026`) and descriptions from the bid table
3. Deduplicates by job number in `seen.json`
4. All SEAFDEC bids are civil works/construction — always flagged accordingly
5. Saves results to `results/YYYY-MM-DD.json`

## Key technical notes

- **URL**: `https://www.seafdec.org.ph/invitation-to-bid/` (with www — non-www times out)
- **No Cloudflare / auth** — plain https works, server is just slow (~4s response)
- **Use curl, not Node.js https** — Node.js http socket idle timeout fires during slow initial response
- **Page is WordPress** — single page updated manually when new bids are posted
- **Bids**: Always civil works (construction, drainage, tanks, walls) at Tigbauan, Iloilo
- **Contact**: BAC Office, AFD Building, Buyu-an, Tigbauan, Iloilo | (+63) 33 330-7004

## Known bids (as of May 2026)

| Job No. | Description | Budget | Status |
|---------|-------------|--------|--------|
| 028-02-2026 | Retaining wall + drain + waste water treatment canal (Ulang hatchery) | PHP 4.49M | Closed Apr 17 |
| 041-03-2026 | Cistern tank near Crab Hatchery | PHP 1.36M | No deadline yet |

## Output

- `results/YYYY-MM-DD.json` — new bids found that day
- `seen.json` — dedup map of job number → first-seen date
