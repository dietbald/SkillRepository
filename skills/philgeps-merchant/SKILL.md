---
name: philgeps-merchant
description: |
  Look up a Philippine company in PhilGEPS (Philippine Government Electronic
  Procurement System) merchant registry. Returns: registered legal name, type
  (Corporation / Sole Proprietorship / Partnership), certification level (Platinum/
  Gold/Silver/Bronze/Red), PhilGEPS registration number, Mayor's Permit, Tax
  Clearance, and SEC number — all with expiry dates. Use it when you need
  authoritative legal name + government-registration data for a Philippine supplier,
  to confirm a supplier is a real registered business, or to enrich a list of
  procurement vendors. Supports single keyword lookup and batch CSV/list enrichment
  with on-disk caching. STRONG TRIGGERS: "PhilGEPS", "philgeps lookup", "is this
  supplier registered", "find SEC number for", "Mayor's Permit for", "verify
  Philippine company", "is this supplier accredited".
trigger_keywords:
  - philgeps
  - phil geps
  - merchant accreditation
  - supplier accreditation philippines
  - SEC number lookup
  - mayors permit lookup
---

# PhilGEPS Merchant Lookup

Queries the public PhilGEPS Open Data merchant endpoint at
`https://open.philgeps.gov.ph/analytics/merchant/load/` (POST). The endpoint takes
a `keyword` (any substring of the registered company name) and a fixed `template`
parameter, and returns HTML containing 0..N matching merchants. Each row carries:

| Field | Example |
|---|---|
| name | `BELGIAN ILOILO CONSTRUCTION CORP.` |
| type | `Corporation` |
| certification_level | `Platinum` / `Gold` / `Silver` / `Bronze` / `Red` |
| philgeps_reg_no | `202212-327064-893721085` |
| philgeps_reg_expiry | `2027-02-05 23:59:59` |
| mayors_permit_no | `C202601101` |
| mayors_permit_expiry | `2026-12-31` |
| tax_clearance_no | `11-074-04-06-R0408-2026-M` |
| tax_clearance_expiry | `2027-04-06` |
| sec_number | `202109002558300` |

## Single lookup

```bash
python ~/.claude/skills/philgeps-merchant/lookup.py "BELGIAN"
```

Prints JSON: list of merchant records. Caches the response on disk
(`~/.cache/philgeps/<sha1(keyword)>.json`) so re-running is free.

## Batch enrichment of a list

```bash
python ~/.claude/skills/philgeps-merchant/lookup.py --batch suppliers.csv \
    --name-column capitol_name \
    --output suppliers_philgeps.csv
```

The batch mode is **search-aware**: for each name it strips common business-suffix
tokens (CORP, INC, LTD, TRADING, MARKETING) and tries shortened keyword forms to
maximize hits. It records every candidate found, with a match-confidence score.

## When to invoke this skill

- The user asks to verify a PH supplier's legal name or registration
- The user asks for a Mayor's Permit / SEC# / Tax Clearance number
- The user asks "is X accredited?" or "is X PhilGEPS-registered?"
- You're enriching a list of Philippine procurement vendors and need authoritative names
- A supplier name on a purchase document is ambiguous and you need the registered form

## When NOT to invoke

- The user wants procurement notices/tenders (PhilGEPS award/bid data) — that's a
  different endpoint, not this skill
- The user wants non-Philippine companies — PhilGEPS is PH-only
- The company is foreign (e.g. RS Components UK, Schneider Electric France)

## Etiquette

PhilGEPS is a public-good endpoint. Don't hammer it: this skill rate-limits to
~1 request / second and aggressively caches. If you need to enrich thousands of
names, run overnight in the background.

## API failure modes

- HTTP 200 with empty `<tbody></tbody>` → no merchant matches the keyword
- HTTP 200 with the merchant page itself (no table) → the `template` parameter
  changed upstream; re-extract from the page source
- HTTP 5xx → transient; the script retries with exponential backoff (3 attempts)
- Captcha or rate-limit page → not yet seen, but if it appears use the
  `2captcha-cli` skill to solve

## Implementation details — the `template` parameter

The form posts `template=AHVTN1F3VXxQEwI2BmZVOA8zXndRSAZpUW0Aaw==` which is a
base64-encoded internal template ID. As of 2026-05-13 it is stable. If lookups
start returning the page-shell HTML instead of the merchant table, fetch the
merchant search page (`https://open.philgeps.gov.ph/analytics/load/merchantInfo`),
grep for `template:` in the embedded JS to read the current value, and update
`TEMPLATE` at the top of `lookup.py`.
