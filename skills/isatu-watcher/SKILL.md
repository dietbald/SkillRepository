---
name: isatu-watcher
description: Watches Iloilo Science and Technology University (ISAT-U) BAC page for new procurement notices. Static WordPress page — no Puppeteer needed. INFRA type prefix = construction bid.
trigger: /isatu-watcher
---

# /isatu-watcher

Monitor ISAT-U (Iloilo Science and Technology University) BAC listing page for new procurement notices.

## What it does

1. Fetches `https://isatuniversity.isatupico.site/bids-and-awards/` via plain HTTPS
2. Parses sections for current year and previous year: `PUBLIC BIDDING {YEAR}`
3. Splits entries on `<hr>` separators within each section
4. Extracts: bidNo, title, ABC amount, ITB PDF link
5. Flags construction bids: `INFRA` type prefix OR title matches construction keywords
6. Deduplicates on bidNo, saves state to `seen.json`
7. Outputs to `results/YYYY-MM-DD.json`

## Usage

```
/isatu-watcher run       # node check.js
/isatu-watcher reset     # delete seen.json to reprocess all
```

## Setup

```bash
mkdir isatu-watcher && cd isatu-watcher
# copy check.js, run.bat (no npm install needed — uses built-in https)
node check.js
```

No npm dependencies — uses Node.js built-in `https` module only.

## Key technical notes

### Page structure — static WordPress HTML
Page is ~1.15MB static HTML. Each fiscal year has a separate `<h1>PUBLIC BIDDING YYYY</h1>` section, separated by the next `<h1>` heading.

Section boundary detection: find section title → find `</h1>` closing tag → find next `<h1` opening tag → that's the section.

Entries within a section are separated by `<hr>` tags.

### Entry format
Each entry:
```html
<h1>PUBLIC BIDDING 2025</h1>
<p><em><strong>ISAT U INFRA-2025-03-006 - CONSTRUCTION OF ISAT U I-HUB</strong></em><br>
<strong>ABC: Php 9,597,178.42</strong><br>
<strong>Contract Period: 180 Calendar Days...</strong></p>
<ul><li><ul>
  <li><a href="...Invitation-to-Bid-8.pdf">Invitation to Bid</a></li>
  ...
</ul></li></ul>
<hr />
```

### Reference number format
Two patterns (parse both):
- `ISAT U GOODS-YYYY-MM-NNN` (goods/services — uses hyphen)
- `ISAT U INFRA-YYYY-MM-NNN` (infrastructure/construction — uses hyphen in newer entries)

### Construction detection
- Primary: bid type `INFRA` = always construction
- Secondary: title keywords (construction, rehabilitation, renovation, building, civil works, etc.)

### Dedup key
`seen[bidNo]` e.g. `seen["ISAT U INFRA-2025-03-006"]`

## Output

```json
{
  "date": "2026-05-04",
  "newCount": 33,
  "construction": [
    { "bidNo": "ISAT U INFRA-2025-03-006", "title": "CONSTRUCTION OF ISAT U I-HUB", "abc": "PHP 9,597,178.42", ... }
  ],
  "other": [...]
}
```
