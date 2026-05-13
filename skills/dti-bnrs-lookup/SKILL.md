---
name: dti-bnrs-lookup
description: |
  Look up a Philippine sole-proprietorship / single-business name in the DTI BNRS
  (Department of Trade and Industry — Business Name Registration System) public
  search. Returns the registered business name, certificate number, owner name,
  registration date, status (REGISTERED / EXPIRED / CANCELLED), territorial scope
  (BARANGAY / CITY/MUNICIPALITY / REGIONAL / NATIONAL), and territory. Authoritative
  for the millions of small Philippine hardware stores, single-proprietor traders,
  and family businesses that are registered with DTI rather than SEC. Single name
  lookup or batch CSV enrichment.

  Use it when you need to verify a small Philippine vendor is a real registered
  business, find the owner of a sole-proprietorship hardware store, or enrich a
  list of supplier short-names with their official DTI registration. STRONG
  TRIGGERS: "DTI lookup", "DTI BNRS", "is this DTI-registered", "find DTI cert
  number for", "verify Philippine sole-proprietor", "owner of <hardware store>",
  "DTI search batch".

  IMPORTANT: DTI BNRS protects its search with a captcha. This skill solves it via
  the 2Captcha service (~$0.001 / solve), so the `2captcha-cli` skill's API key
  must be configured at `~/.config/2captcha/api-key`. Without it, lookups fail
  with `captcha_unsolved`.
---

# DTI BNRS Lookup

Queries the public DTI Business Name Registration Search at
`https://bnrs.dti.gov.ph/search` via a headless Chrome session.

## Why a separate skill (vs. `ph-supplier-enrich`)?

`ph-supplier-enrich` is a multi-source enrichment pipeline (DuckDuckGo +
DTI BNRS + SEC). It runs a 3-stage waterfall per supplier and is the right
tool when you have an informal name list and want full enrichment. This
skill is the **DTI-only** path — use it when:

- You only need DTI registration data (faster, fewer captcha solves)
- You're verifying ONE name and don't want to invoke the full pipeline
- You're building a workflow that consults DTI alongside other authoritative
  sources (e.g. PhilGEPS via the `philgeps-merchant` skill)

## Returned fields per match

| Field | Example |
|---|---|
| `business_name` | `3 KEYS BUILDERS AND SUPPLY` |
| `owner_name` | `ARNEL JULIAGA ORDINAL` |
| `cert_no` | `3452121` |
| `registration_date` | `Jan 13 2022` |
| `status` | `REGISTERED` / `EXPIRED` / `CANCELLED` |
| `territory` | `REGIONAL - REGION VI (WESTERN VISAYAS)` |
| `scope` | `BARANGAY` / `CITY/MUNICIPALITY` / `REGIONAL` / `NATIONAL` |

## Single lookup

```bash
node ~/.claude/skills/dti-bnrs-lookup/src/lookup.js "3 KEYS BUILDERS AND SUPPLY"
```

Prints JSON. The DTI search is **exact-match** only (DTI explicitly disallows
fuzzy or random searches), so the input must be the candidate full name. If
the name doesn't match exactly, returns `note: "no_result"`.

## Batch enrichment of a CSV

```bash
node ~/.claude/skills/dti-bnrs-lookup/src/lookup.js \
  --batch suppliers.csv \
  --name-column capitol_name \
  --output suppliers_dti.csv
```

Adds columns: `dti_business_name`, `dti_owner_name`, `dti_cert_no`,
`dti_registration_date`, `dti_status`, `dti_territory`, `dti_scope`,
`dti_note` (matched / no_result / captcha_failed / error).

## Quirks of DTI BNRS

- **Exact-match required.** Per the site itself: "Random searches not allowed."
  The lookup `&` is normalized to `AND` automatically because DTI's text matcher
  rejects ampersands.
- **Captcha per request.** Every search submits a fresh SVG captcha. Cost is
  ~$0.001 per solve via 2Captcha. Budget accordingly for batch runs.
- **Sole proprietorships only.** Corporations and partnerships are registered
  with SEC, not DTI. If a query returns no results for what should be a
  corporation, try the SEC search or the `philgeps-merchant` skill instead.
- **Territory scope matters.** A name registered as `BARANGAY` scope can be
  legally reused at a higher scope by a different entity — DTI lets multiple
  "Joe's Hardware" exist as long as they're in different territories. The
  matcher returns every match, so the caller should pick the right one based
  on the supplier's known location.

## When to invoke this skill

- User asks "is X DTI-registered?" / "find DTI cert# for X"
- User asks "who owns <hardware store>?"
- You're building a supplier master list and want authoritative owner names
- You hit a Philippine sole proprietorship that PhilGEPS doesn't cover

## When NOT to invoke

- The user wants DDG/web search → use generic WebSearch or `ph-supplier-enrich`
- The supplier is clearly a corporation → use SEC search or `philgeps-merchant`
- The supplier is foreign / non-Philippine → DTI is PH-only
- You only have an initialism with no candidate full name → DTI exact-match
  will return nothing; run DDG first to get a candidate name

## Dependencies

- **Node.js ≥18** (uses fetch + ESM)
- **Puppeteer** (bundled Chromium; installed via `npm install` once)
- **2Captcha API key** at `~/.config/2captcha/api-key` (configured by the
  `2captcha-cli` skill)

After `git clone` of the SkillRepository, run once:
```bash
cd ~/.claude/skills/dti-bnrs-lookup && npm install
```

## Debugging

Set `DEBUG_DTI=1` to save before/after screenshots of each lookup to your
system temp dir. Set `DEBUG=1` for verbose logging.

```bash
DEBUG_DTI=1 DEBUG=1 node src/lookup.js "WILCON DEPOT"
```
