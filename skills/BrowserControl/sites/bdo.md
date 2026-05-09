# BDO Business Online Banking (BOB) — `business.bdo.com.ph`

Apache Wicket portal. Two BDO business portals exist — confirm which one the user is on:
- **CURRENT (BOB / Wicket)**: `https://business.bdo.com.ph/fo/login` ← this file
- **NEW (CBX)**: `https://www.businessonline.bdo.com.ph/cbx/CBXLogin.jsp` (separate flow, not covered here)

Status: **verified 2026-05-09** — login + OTP automated, dashboard nav, Transaction History (PDF + XLS) for all 3 BICC accounts, Account Portfolio (PDF) all working end-to-end via `page.evaluate(fetch())` against URLs extracted from button onclick handlers.

---

## Login flow

**URL**: `https://business.bdo.com.ph/fo/login`

Three required text fields:
| Field | id | name | env var |
|---|---|---|---|
| Corporation Code | `idd` | `corpCd` | `BDO_BOB_CORP_CD` |
| User ID | `ide` | `userCd` | `BDO_BOB_USER_CD` |
| Password | `idf` | `pswd` | `BDO_BOB_PSWD` |

Use `page.type(sel, val, { delay: 40 })` — Wicket reads server-side state, not DOM `.value`, so `evaluate(() => el.value = ...)` posts a blank form. Same applies to OTP.

Submit: `<input type="submit" value="Sign In">` inside the `corpCd/userCd/pswd` form. Click via `page.mouse.click(coords)` after extracting the bounding rect — DON'T `dispatchEvent` (the underlying postback won't fire).

After submit → SMS-OTP page. Field is `id29` (name `panel:main:smsOtp`). Submit button is `id2c`.

```javascript
// OTP — focus via evaluate then keystroke. page.click() with clickCount:3 times out.
await page.evaluate(() => {
  const e = document.getElementById('id29');
  e.scrollIntoView({ block: 'center' }); e.focus(); e.value = '';
});
await page.keyboard.type(OTP, { delay: 60 });
const c = await page.evaluate(() => {
  const r = document.getElementById('id2c').getBoundingClientRect();
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
  page.mouse.click(c.x, c.y),
]);
```

OTP delivery is to the user's registered mobile (`(63) 9...`) — must be supplied interactively each session. No way to skip.

---

## Dashboard menu — extract hrefs once, never click

The left sidebar (Standard Services / Cash Management Services / User Preferences) renders all submenu links into the DOM, but positions them at `x ≈ -9881` (off-screen) until the parent toggle is hovered/expanded. Mouse-clicking a returned coordinate hits empty space.

**Pattern: scoop hrefs on first dashboard load, then `page.goto(href)` for every navigation:**

```javascript
const menu = await page.evaluate(() => {
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();   // BDO uses NBSP between words!
  return [...document.querySelectorAll('a')]
    .filter(a => a.href && a.href.includes('/fo/?x='))
    .map(a => ({ text: norm(a.textContent), href: a.href }))
    .filter(o => o.text);
});
// → menu items: 'Account Portfolio', 'Transaction History', 'Fund Transfer - Own',
//   'Fund Transfer - Other Party', 'Wire Transfer', 'Checkbook Reorder',
//   'Stop Payment Order', 'Outward Payment', 'Disbursement', 'Bills Payment',
//   'ACA', 'User Profile', 'Change Password', 'Alerts', 'Configure Dashboard'
```

**NBSP gotcha**: every menu label uses `U+00A0` (non-breaking space) between words. `=== 'Transaction History'` will silently fail — always normalize via `replace(/\s+/g, ' ')` before comparison. (See the whitespace-normalization rule in skill.md.)

---

## Page URL patterns (post-login)

After clicking a menu item, BDO redirects from the long `?x=...` token URL to a function-code path:

| Function | URL | Description |
|---|---|---|
| FC9220 | `/fo/FC9220` | Transaction History |
| (TBD) | `/fo/?x=...` for Account Portfolio | First Standard Services link |

Function codes are stable across sessions. After landing on `/fo/FCxxxx`, the form fields use generated IDs (`iddb`, `iddc`, etc.) that DO change between sessions — locate inputs by `name` or by their position in the form rather than fixed id strings.

---

## Transaction History (`/fo/FC9220`)

**Form layout** (verified 2026-05-09):
- Account dropdown — `<select>` (one of the 2 selects on page)
- Date-from / date-to pickers
- "Search" button (`<input type="submit" value="Search">`, id varies)
- "Clear" button (id varies)

**~90-day historical floor**: BDO BOB Transaction History rejects date-from values older than ~90 days from today with the error `From and To Dates should be later than MM/DD/YYYY`. The Maker view is *not* a substitute for monthly eSOAs — for older history, request eSOAs (different role required) or branch-issued bank certificates. Treat BDO BOB as a "rolling 90-day window" data source, not an archive.

**Date-range select** (`name="dateRangePanel:viewingType"`) options:
| value | label |
|---|---|
| 0 | Current Day |
| 1 | Previous Day |
| 2 | Last 7 Days |
| 3 | Last 30 Days |
| 4 | Last 60 Days |
| 5 | Last 90 Days |
| 6 | Custom Date Range — reveals dateFrom / dateTo text fields after AJAX |

For Custom Date Range, fields are `dateRangePanel:daysContainer:dateFrom` and `dateTo`, format `MM/DD/YYYY`. Type via `page.type()` — Wicket reads server-side state.

**Download (verified pattern)**: After Search, three Export buttons render: PDF, XLS, CSV. PDF and XLS use `onclick="window.location.href='?x=...'"` — extract the URL and fetch in-page (see the general rule "Export buttons with `onclick=...location.href`" in skill.md). CSV uses `wicketAjaxGet('?x=...')` — different mechanism, NOT yet captured. PDF + XLS together are sufficient for reconciliation; XLS has clean columns, PDF is the visual archive. Filenames returned via `Content-Disposition`: `Tran_Hist_PdfAndXls.pdf` / `.xls`.

---

## BICC account dropdown values (FC9220)

`<select name="accountPanel:wmc:account">` options for the BICC corporation:

| Account # | Type | Label | option value |
|---|---|---|---|
| 007470227579 | Savings (Collection) | `BELGIAN ILOILO CONSTRUCTION CORP-PHP-SA` | `8ac7a29989f3e008018a45b0f8124675` |
| 007470229547 | Savings (Tax)        | `BICC TAX-PHP-SA`                          | `8ac7a2998af6bb57018b4f43f32d4bfc` |
| 007478006789 | Current (Disb)       | `BICC OUT-PHP-CA`                          | `8ac7a2998af6bb57018b4f43f32d4bfd` |

Suffixes: `-PHP-SA` = peso savings, `-PHP-CA` = peso current. Option values are corporation-stable across sessions but not guaranteed across years — re-scout if a value stops resolving.

## Account Portfolio (FC9210)

Function code: `FC9210`. Single page, no form to fill. Renders a summary table of all 3 accounts with current balances. Export buttons same pattern as TxnHist:
- **Export to PDF** — `onclick="window.location.href='?x=...'"` → fetch in-page (works)
- **Export to CSV** — `wicketAjaxGet(...)` (NOT captured yet)

PDF is the live-balance stop-anchor for reconciliation.

## Inquiry pages — multi-year archives (CRITICAL — bypasses the 90-day TxnHist cap)

Every action menu item has TWO tabs: a "Create" tab (submit a new transaction) and an **Inquiry** tab (search past ones). The Inquiry archives accept date ranges of **at least 5 years**, providing the historical depth that Transaction History (FC9220) lacks.

| Function | Menu label | Inquiry tab label | Verified |
|---|---|---|---|
| FC9230 | Fund Transfer - Own | "Fund Transfer Inquiry" | ✓ accepts 5y |
| FC9240 | Fund Transfer - Other Party | "Fund Transfer Inquiry" | ✓ accepts 5y, BICC has data 2024-05+ |
| FC9260 | Wire Transfer | "Wire Transfer Inquiry" | ✓ form works, BICC no data |
| FC9339 | Outward Payment | "Outward Payment Inquiry" | ✓ accepts 5y, BICC has data 2024-06+ — main disbursement archive |
| FC9331 | Bills Payment | "Bills Payment Inquiry" | ✓ form works, BICC no data |

For BICC reconciliation, **Outward Payment Inquiry (FC9339)** is the gold mine — it lists every PESONET / InstaPay / RTGS payment to vendors and employees with reference numbers (`OPR-MMDDYYYY-...`), payee name+account, amount, and execution date.

### Inquiry form access pattern

Each inquiry page requires three setup steps before the search form is usable:

```javascript
// 1. Click the "* Inquiry" tab (sibling to "Create *" tab)
await page.evaluate(() => {
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  [...document.querySelectorAll('a')]
    .find(a => norm(a.textContent) === 'Outward Payment Inquiry')?.click();
});
await sleep(2200);

// 2. Expand the Search Options panel — it's wrapped in a hidden WidgetBody2
//    The toggle is a span with slidedownbutton="true" — call .click() in-page,
//    NOT mouse.click on coords (jQuery handler doesn't fire on coord clicks).
await page.evaluate(() => {
  const btn = document.querySelector('[slidedownbutton="true"]');
  if (btn && getComputedStyle(btn).display !== 'none') btn.click();
});
await sleep(2000);

// 3. Now all selects/inputs in the form are visible (offsetParent !== null).
```

### Required fields

`createDtFrom` and `createDtTo` are **required** on every Inquiry form. Empty values return `* This field is required` errors. Always set both, even if you only care about transaction date — use a wide window (e.g. `01/01/2020` → today).

```javascript
for (const [name, val] of [['createDtFrom','01/01/2020'], ['createDtTo','05/09/2026']]) {
  const id = await page.evaluate((n) =>
    [...document.querySelectorAll('input')].find(i => i.name === n && i.offsetParent !== null)?.id,
  name);
  await page.click('#'+id, { clickCount: 3 });
  await page.type('#'+id, val, { delay: 25 });
}
```

Optional secondary filters: `txnDateWmc:fromDt`/`txnDateWmc:toDt` (transaction date), `account` (Transfer from), `destWmc:destAccount` (Transfer to), `currCd` (PHP/USD/etc), `statusWmc:status` (Successful/Pending/etc), `wfStatusWmc:wfStatus` (workflow status).

### Submit button — match by `name="search"`

Inquiry pages have BOTH a Create form and an Inquiry form on the same page. The Inquiry submit is uniquely `<input type="submit" name="search" value="Search">` — do NOT pick by index, use the name:

```javascript
const sb = [...document.querySelectorAll('input[type="submit"][name="search"]')]
  .find(s => s.offsetParent !== null);
```

### Export downloads on Inquiry pages

Same pattern as Transaction History — three Export buttons (PDF, XLS, CSV) appear under the result table. ALL THREE use `onclick="window.location.href='?x=...'"` on Inquiry pages (CSV is `wicketAjaxGet` only on the Account Portfolio + TxnHist pages, not here). Extract the URL with the regex `window\.location\.href\s*=\s*'(\?x=[^']+)'` and `page.evaluate(fetch())`.

Filename patterns:
- FC9240: `Fund_Transfer_Header_FO_Report.{pdf,xls}`, `Fund_Transfer_Header_FO_Report_Csv.csv`
- FC9339: `Outward_Remittance_Header_FO_Report.{pdf,xls}`, `Outward_Remittance_Header_FO_Report_Csv.csv`

## Roles & module visibility

Maker role (TJMAKER on this corporation) sees:
- Standard Services: Account Portfolio, Transaction History, Fund Transfer (Own/Other), Wire Transfer, Checkbook Reorder, Stop Payment Order, Outward Payment
- Cash Management Services: Disbursement, Bills Payment, ACA
- User Preferences: User Profile, Change Password, Alerts

**Maker does NOT see**: eSOA / Statement of Account, Cheque Inquiry. These modules require a different role (Approver/Admin) or aren't enabled for this corporation. Skip A3/A4 from the BDO extraction guide for Maker-only sessions.

---

## Session expiry

Wicket session times out after ~5–10 min of inactivity (server-side). Each `?x=` URL token is single-use. Implications:

- **Don't run more than 1–2 inspections per page.** Capture everything you need in one `inspect.js` call — re-running selector probes burns the clock with zero progress.
- After session expiry, the page redirects to login and the user must re-enter password + a fresh SMS OTP. There's no auto-recovery — the OTP is real-world phone delivery.
- For multi-account chunked downloads (3 accounts × 5 quarters = 15 chunks), structure the script to do all 15 in one continuous run after the OTP is in, not iteratively.

---

## Logout

Find the link by `Log[\s\xa0]?out` (NBSP-aware). Same single-session-per-user concern as other Wicket portals — leaving a session open may block the next maker login until idle-timeout.

---

## Output drop location

Per the BDO extraction guide, save raw downloads to:
```
~/claw/personalai/workers/active/bdo-recon/inbox/
   ├── tran_hist/{7579,6789,9547}/
   ├── portfolio/
   ├── esoa/
   ├── cheques/
   └── certificates/
```
Keep BDO's original filenames (`Tran_Hist_PdfAndXls.xls` etc.) — the recon pipeline dedupes by content hash.

---

## Production scripts

Two ready-to-run extractors live next to this file:

### `bdo_weekly_extract.js`

Pulls the last N days (default 30) of Transaction History for every account configured in `.env` → `BDO_BOB_ACCOUNTS_JSON`. PDF + XLS per account. Output goes to `BDO_BOB_OUTPUT_DIR` if set, otherwise `process.cwd()`, into a dated `weekly_<YYYY-MM-DD>/` subfolder.

```bash
# Interactive — own Chrome + OTP prompt in terminal
node ~/.claude/skills/BrowserControl/sites/bdo_weekly_extract.js

# Connect to existing logged-in Chrome (skip login)
node ~/.claude/skills/BrowserControl/sites/bdo_weekly_extract.js --connect 9222

# Custom lookback (max ~92 by BDO policy)
node ~/.claude/skills/BrowserControl/sites/bdo_weekly_extract.js --days 7
```

`puppeteer-core` must be reachable — run from a project that has it installed, or set `NODE_PATH=$PWD/node_modules`.

### `bdo_extract_inquiries.js`

Sweeps all 5 Inquiry archive pages (FT-Own, FT-Other, Wire, Outward Payment, Bills Payment) and downloads PDF + XLS + CSV reports for whichever ones return rows. Default range is 2020-01-01 → today, capturing the full multi-year archive in one run.

```bash
node ~/.claude/skills/BrowserControl/sites/bdo_extract_inquiries.js
node ~/.claude/skills/BrowserControl/sites/bdo_extract_inquiries.js --connect 9222
node ~/.claude/skills/BrowserControl/sites/bdo_extract_inquiries.js --from 01/01/2024 --to 12/31/2024
```

Output: `inquiries_<YYYY-MM-DD>/<FCxxxx>/<FCxxxx>_<from>_to_<to>.{pdf,xls,csv}`.

### Required `.env` keys

```
BDO_BOB_CORP_CD=...                 # corporation code
BDO_BOB_USER_CD=...                 # user id
BDO_BOB_PSWD=...                    # password
BDO_BOB_ACCOUNTS_JSON=[{"num":"7579","name":"Collection","value":"<dropdown-hash>"}, ...]
BDO_BOB_OUTPUT_DIR=...              # optional; default = process.cwd()
```

The `value` per account is the dropdown option hash on FC9220 — find it once via `inspect.js` on the Transaction History page (look for `<select name="accountPanel:wmc:account">` options) and paste it into `.env`.

### Windows Task Scheduler weekly run

```powershell
schtasks /Create /TN "BDO Weekly TxnHist" /SC WEEKLY /D SUN /ST 09:00 ^
  /TR "powershell -NoExit -Command \"cd C:\Users\me\Documents\bdo; node ~/.claude/skills/BrowserControl/sites/bdo_weekly_extract.js\"" /F
```

The OTP prompt appears in the spawned PowerShell window — type the SMS code and the run completes in ~30s. There is no fully unattended path on this portal; OTP is required for every login.
