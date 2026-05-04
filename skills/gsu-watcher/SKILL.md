---
name: gsu-watcher
description: Watches Guimaras State University (GSU) BAC page for new procurement notices. Static Bootstrap table, paginated (1,284+ postings). Plain HTTPS, no Puppeteer needed.
trigger: /gsu-watcher
---

# /gsu-watcher

Monitor GSU (Guimaras State University, Guimaras Province, Region VI) BAC listing page for new procurement notices.

## What it does

1. Fetches `https://www.gsu.edu.ph/bids-and-awards-committee/` via plain HTTPS
2. Initial run (empty seen.json): scrapes pages 1–5 to seed dedup state
3. Subsequent runs: page 1 only (newest entries appear first)
4. Strips HTML comments (`<!-- <td></td> -->`) before parsing table rows
5. Extracts: row number, date, title, and post URL from each `<tr>`
6. Flags construction bids via title keyword matching
7. Deduplicates on post URL, saves state to `seen.json`
8. Outputs to `results/YYYY-MM-DD.json`

## Usage

```
/gsu-watcher run      # node check.js
/gsu-watcher reset    # delete seen.json to reprocess from scratch
```

## Setup

```bash
mkdir gsu-watcher && cd gsu-watcher
# copy check.js, run.bat (no npm install needed — uses built-in https)
node check.js
```

No npm dependencies — uses Node.js built-in `https` module only.

## Key technical notes

### Page structure — Bootstrap table, paginated
Page has a Bootstrap `<table class="table table-striped">` with rows:
```html
<tr>
  <td>1</td>
  <td>April 16, 2026</td>
  <!-- <td></td> -->   ← commented-out Type column
  <td>Title text here</td>
  <td><a class="btn" href="https://www.gsu.edu.ph/YYYY/MM/DD/slug/">
    <svg>...</svg>
  </a></td>
</tr>
```

**Critical**: Strip HTML comments before parsing — `<!-- <td></td> -->` has `>` characters that break naive td-matching regexes. Use `html.replace(/<!--[\s\S]*?-->/g, '')` first.

The link button is SVG-only (no text). Extract URL from `href` attribute of `<a class="btn">`.

### Dedup key
Post URL: `https://www.gsu.edu.ph/YYYY/MM/DD/slug/` — standard WordPress permalink, unique per post.

### No type field
The "Type" column is commented out in the HTML. Rely on title keyword matching for construction detection.

### Pagination
Page 1 URL: `https://www.gsu.edu.ph/bids-and-awards-committee/`
Page N URL: `https://www.gsu.edu.ph/bids-and-awards-committee/page/N/`
Entries per page: ~10. Only scrape page 1 for daily monitoring.

## Output

```json
{
  "date": "2026-05-04",
  "newCount": 5,
  "construction": [
    { "date": "April 16, 2026", "title": "Materials for the Construction of Concrete Canal...", "url": "..." }
  ],
  "other": [...]
}
```
