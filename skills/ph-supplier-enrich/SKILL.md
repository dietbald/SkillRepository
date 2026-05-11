---
name: ph-supplier-enrich
description: Enrich a list of Philippine supplier/business names with their full registered names, DTI/SEC registration, address, and contact info. Searches DuckDuckGo, DTI BNRS, and SEC company search in sequence per name. Use when working with informal supplier lists (procurement canvasses, bid attachments, contact spreadsheets) where short/colloquial names need to be matched against authoritative registered names. Also harvests "discovered" candidate suppliers found in search results that weren't in the input list. Resumable; rate-limited.
---

# Philippine Supplier Enrichment

Enriches informal Philippine supplier names with authoritative registration data.

## When to invoke

- User has a list of supplier short-names (e.g., "WILCON", "MOOSTBRAND", "3KEYS BUILDERS") and wants the full registered names
- Reconciling a procurement canvas list against a CRM/ERP supplier master
- Looking up DTI Business Name Registration or SEC company registration details for a list
- Harvesting candidate Philippine suppliers in a region/industry from web search

## Sources used (in order)

1. **DuckDuckGo HTML search** — fast, free, no API key. Captures top 10 result titles + snippets + URLs for `"<name>" Iloilo Philippines`. Extracts candidate full registered names by detecting business-suffix patterns (Inc., Corp., Trading, Hardware, Lumber, etc.).
2. **DTI BNRS** (`bnrs.dti.gov.ph/search`) — authoritative for sole proprietorships. Most small Iloilo hardwares fall here. Requires reCAPTCHA solving via the `2captcha-cli` skill.
3. **SEC company search** (`secexpress.ph` or `www.sec.gov.ph`) — authoritative for corporations and partnerships. Same CAPTCHA constraint.

## Inputs

CSV or JSON list of supplier names, one per row/element. Optional columns: `id`, `requisition_count`, `region` (defaults to "Iloilo Philippines").

```bash
# CSV input
node ~/.claude/skills/ph-supplier-enrich/src/enrich.js \
  --input ./suppliers.csv \
  --column capitol_name \
  --output ./enriched/

# JSON input
node ~/.claude/skills/ph-supplier-enrich/src/enrich.js \
  --input ./suppliers.json \
  --output ./enriched/

# Limit to N (for testing)
node ~/.claude/skills/ph-supplier-enrich/src/enrich.js \
  --input ./suppliers.csv --limit 5

# Skip a source
node ~/.claude/skills/ph-supplier-enrich/src/enrich.js \
  --input ./suppliers.csv --skip dti,sec
```

## Outputs

Per-name JSON files at `<output>/by-name/<slug>.json`:

```json
{
  "input_name": "MOOSTBRAND",
  "candidates": [
    { "source": "ddg", "full_name": "MOOST BRAND, INC.", "url": "...", "snippet": "...", "confidence": 0.85 },
    { "source": "dti_bnrs", "full_name": null, "note": "no result" },
    { "source": "sec", "full_name": "MOOST BRAND, INC.", "sec_no": "CS201801234", "address": "..." }
  ],
  "best": { "source": "sec", "full_name": "MOOST BRAND, INC.", "confidence": 1.0 },
  "enriched_at": "2026-05-09T11:00:00"
}
```

Aggregate files at `<output>/`:
- `enrichment_summary.md` — overall stats
- `discovered_suppliers.json` — companies found in search results NOT in the input list
- `_audit.log` — rate-limit / error events

## Resume behavior

If `<output>/by-name/<slug>.json` already exists, the name is skipped. Delete that file or pass `--force` to re-enrich.

## Rate limiting

- DuckDuckGo: 2s between queries (avoid soft block)
- DTI BNRS: 5s between queries (CAPTCHA cost ~$0.003 each)
- SEC: 5s between queries (CAPTCHA cost similar)

## Cost estimate (274 suppliers)

| Source | Per-name cost | Total |
|---|---|---|
| DDG | $0 | $0 |
| DTI BNRS | ~$0.003 (one Turnstile) | ~$0.82 |
| SEC | ~$0.003 (one reCAPTCHA) | ~$0.82 |
| **Total** | | **~$1.64 + 2-3 hours runtime** |

## Dependencies

- Node 18+ (uses native fetch where possible)
- `puppeteer` (Chromium auto-installed)
- `csv-parse`, `csv-stringify`
- 2captcha API key at `~/.config/2captcha/api-key` (only if running DTI/SEC)
