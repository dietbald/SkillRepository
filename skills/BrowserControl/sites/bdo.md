# BDO Business Online Banking (BOB) — `business.bdo.com.ph`

Apache Wicket portal. Two BDO business portals exist — confirm which one the user is on:
- **CURRENT (BOB / Wicket)**: `https://business.bdo.com.ph/fo/login` ← this file
- **NEW (CBX)**: `https://www.businessonline.bdo.com.ph/cbx/CBXLogin.jsp` (separate flow, not covered here)

Status: **partially verified 2026-05-09** — login + OTP automated, dashboard navigation pattern confirmed. Per-page extraction flows (Transaction History, Account Portfolio, eSOA) NOT yet completed end-to-end; first attempt was killed by session expiry mid-debug.

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

**90-day cap**: BDO refuses date ranges longer than ~90 days for transaction history. Always chunk:
- `2025-04-22 → 2025-07-21`
- `2025-07-22 → 2025-10-21`
- `2025-10-22 → 2026-01-21`
- `2026-01-22 → 2026-04-21`
- `2026-04-22 → today`
- (older: try one quarter at a time; portal may accept up to 12-18 months back)

After Search, a result table renders with a "Download" link (XLS preferred) and likely a PDF option. Both worth saving — XLS has cleaner columns, PDF is the visual archive.

**Download-button capture pattern** (NOT yet verified for BDO — reuse the BPI BizLink approach as starting point):
- Watch for `application/vnd.ms-excel` or `application/pdf` Content-Type via CDP `Fetch` domain
- Fallback: `Browser.setDownloadBehavior` with `eventsEnabled: true`, then real `mouse.click` on the link

---

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
