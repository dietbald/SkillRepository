# ph-supplier-enrich

Node.js skill that enriches a list of Philippine supplier short-names with their authoritative registered names by searching DuckDuckGo, DTI BNRS, and SEC company search.

See `SKILL.md` for full description and triggers.

## Quick start

```bash
cd ~/.claude/skills/ph-supplier-enrich
npm install                   # installs puppeteer + chromium

# Smoke test on 1 supplier
node src/test-ddg.js "MOOSTBRAND"

# Run enrichment on a CSV
node src/enrich.js \
  --input C:/Users/TJatBICC/Documents/Procurement/extracted/capitol/_supplier_reconciliation.csv \
  --column capitol_name \
  --filter-column match_method --filter-value unmatched \
  --output C:/Users/TJatBICC/Documents/Procurement/extracted/capitol/enriched/ \
  --limit 5
```

## File layout

```
ph-supplier-enrich/
├── SKILL.md              # skill metadata + triggers (loaded by Claude)
├── README.md             # this file
├── package.json
└── src/
    ├── enrich.js         # main orchestrator
    ├── lib/
    │   ├── ddg.js        # DuckDuckGo HTML search
    │   ├── dti.js        # DTI BNRS lookup (with 2captcha)
    │   ├── sec.js        # SEC company search (with 2captcha)
    │   ├── captcha.js    # thin wrapper over 2captcha API
    │   ├── candidates.js # extract registered-name candidates from text
    │   ├── browser.js    # shared puppeteer setup
    │   └── log.js        # structured logging
    ├── test-ddg.js
    ├── test-dti.js
    └── test-sec.js
```

## Environment

- `TWOCAPTCHA_API_KEY` env var, OR
- `~/.config/2captcha/api-key` file (preferred — same as the `2captcha-cli` skill)
- Optional: `PH_REGION` to override default search region (default: `"Iloilo Philippines"`)
