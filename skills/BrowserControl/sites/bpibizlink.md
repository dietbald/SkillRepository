# BPI BizLink (bpibizlink.com)

**Status:** Verified working 2026-05-06 — extracted 10 monthly Statements of Account (May 2025 → March 2026).

BPI's corporate online banking portal for Philippines SME / corporate accounts. Built on Apache Wicket (URLs full of `IBehaviorListener`, `ILinkListener`, opaque numeric component refs).

## Login

- URL: `https://www.bpibizlink.com/`
- Three fields, all on the landing page:
  - `#corpCd` — Corporate Code (BIZLINK_CORPORATE_CODE in .env)
  - `#userCd` — User ID (BIZLINK_USER_ID)
  - `#pswd`   — Password (BIZLINK_PASSWORD)
- Submit: `input[type="submit"]` (red "Sign In" button)
- After login lands at `/fo/main?<n>`

**Gotcha — `dispatchEvent('input'/'change')` does NOT register on the login form.** The classic React-style bulk setter pattern fails silently — fields look filled in code but the form submit treats them as empty. Use `page.type(selector, value, { delay: 40 })` instead, with `page.click(selector, { clickCount: 3 })` first to clear any prior value.

**Session timeout** is short — single-digit minutes of idle = logged out, back to landing page. Always re-login at the start of a fresh script run, don't assume a previous session is still alive.

## Navigation

The hamburger menu (`☰` top-left) toggles a side panel, but the `<div id="nav">` container is `display: none` in normal state and does NOT slide open via `mouse.click()` on the toggle. The menu items are present in the DOM but rendered off-screen at `x = -10283` until activated.

**Do not try to click menu items via the visible UI.** Instead:

1. Run a one-time DOM dump to extract `href` for each menu link — they all follow this pattern:
   ```
   /fo/main?<n>-1.ILinkListener-menuPanel-zeroLevelMenu-<group>-recursiveMenu-rows-<row>-row-menuLink
   ```
2. Navigate directly via `page.goto(href)` — works perfectly, lands on the target page.

Captured menu hrefs (use these directly):
- **Account Portfolio**:    `?<n>-1.ILinkListener-menuPanel-zeroLevelMenu-0-recursiveMenu-rows-0-row-menuLink`
- **Transaction History**:  `?<n>-1.ILinkListener-menuPanel-zeroLevelMenu-0-recursiveMenu-rows-1-row-menuLink`
- **Statement of Account**: `?<n>-1.ILinkListener-menuPanel-zeroLevelMenu-0-recursiveMenu-rows-2-row-menuLink` → resolves to `/fo/FC9311?<n>`
- **Transfer to Own Accounts**, **Pay BPI Accounts**, **Pay non-BPI Accounts** — same pattern, group=1.

The numeric session id `<n>` in the URL changes between sessions. The path (`/fo/FC9311` for SOA) is stable.

## Statement of Account — extraction flow

**URL after navigation:** `https://www.bpibizlink.com/fo/FC9311?<n>`

Form structure:
1. **Account dropdown** — `<select name="accountWmc:accountPanel:wmc:account">`
   - Single option for this corp: value `8a05ebc68343019c018359e2594e12a8` → `1470006974 (PHP) · BELGIAN ILOILO CONSTRUCTION CORP`
2. **Statement Period dropdown** — `<select name="soaWmc:stmtPeriod:startMonth">` — appears AFTER account is selected (3 second wait required for AJAX to populate)
   - Options are the last **10 monthly statements** (≈10 months back)
   - Each option's `value` is a token like `CABPSTMT202604071242131470-0069-74` (account + statement-period encoded)
   - Each option's `text` is human readable: `FEB 28, 2026 - MAR 31, 2026`
3. **Download button** — `<input type="submit" name="downloadWmc:download" value="Download">`

10 months is the maximum history available via this UI. Beyond that you need to call BPI directly.

## The download capture pattern — Fetch domain interception (mandatory)

The Download button POSTs to `?<n>-<m>.IBehaviorListener.0-tab0-tranHistSearchPanel-container-contentPanel-form` and the response is `Content-Type: application/pdf` with `Content-Disposition: attachment; filename="<token>.pdf"`. The PDF is ~340–450 KB.

**Three approaches that fail — do not waste time on them:**

1. **CDP `Browser.setDownloadBehavior`** — Click registers, no file ever lands in download dir. Chrome's PDF viewer or download flow consumes the response and never writes to disk via this path for Wicket-style attachments.

2. **`page.on('response', async res => res.buffer())`** — The response IS detected (correct CT and CD headers), but `res.buffer()` throws `Could not load response body for this request`. Chrome has already discarded the body by the time the puppeteer event fires for an attachment.

3. **CDP `Network.getResponseBody` from `Network.responseReceived`** — Detects the requestId, but `getResponseBody` returns `Protocol error: No resource with given identifier found`. Same root cause: download responses are evicted from Chrome's network cache immediately, faster than the puppeteer event loop can call back.

**The working approach — CDP `Fetch` domain at Response stage**, which PAUSES the request before Chrome consumes it:

```javascript
await cdpClient.send('Fetch.enable', {
  patterns: [{ urlPattern: '*FC9311*', requestStage: 'Response' }]
});

const handler = async (event) => {
  const { requestId, responseHeaders, responseStatusCode } = event;
  const ct = (responseHeaders || []).find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  if (ct.includes('application/pdf')) {
    const { body, base64Encoded } = await cdpClient.send('Fetch.getResponseBody', { requestId });
    const buf = base64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body);
    fs.writeFileSync(savePath, buf);
    // Fulfill so Chrome doesn't hang
    await cdpClient.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: responseStatusCode,
      responseHeaders, body: buf.toString('base64')
    });
  } else {
    await cdpClient.send('Fetch.continueRequest', { requestId });
  }
};
cdpClient.on('Fetch.requestPaused', handler);
```

Critical: `requestStage: 'Response'` (not 'Request') — we need headers to identify the PDF, then grab the body. After capturing, you MUST call `Fetch.fulfillRequest` (or `continueRequest`) or Chrome stalls. Disable `Fetch` between iterations to avoid handler buildup.

Verified body magic bytes are `%PDF` — the captured PDFs open cleanly.

## Per-iteration flow (proven working)

For each statement period:
1. `page.goto(SOA_URL)` — fresh navigation each time (Wicket form gets stuck if you re-submit on same page)
2. `page.select(account_select_name, account_value)` + sleep 3000 ms (AJAX populates period dropdown)
3. `page.select(period_select_name, period_value)` + sleep 1000 ms
4. `Fetch.enable` with the URL pattern + register handler
5. `page.mouse.click(downloadBtnX, downloadBtnY)`
6. Wait up to 20 s for the handler to capture body
7. `Fetch.disable`
8. Sleep 2000 ms before next iteration

Total: ~10 seconds per statement, 10 statements ≈ 100 s.

## File naming

`receipts/BPIBizLink/BPIBizLink_<accountNumber>_<periodLabel>.pdf`

Example: `BPIBizLink_1470006974_FEB28_2026-MAR31_2026.pdf`

## Account Portfolio (FC9210) — Save as PDF / XLS / CSV

Verified working 2026-05-07. All three formats served as `<a>` links with stable labels "Save as PDF" / "Save as XLS" / "Save as CSV". Same Fetch-domain interception, triggered by real `page.mouse.click()` on the link coords (NOT `window.location.href = url` — that fails to trigger the export endpoint). PDF response is `application/pdf`, XLS is `application/vnd.ms-excel`, CSV is `text/csv`. Filenames suggested by server: `AccountPortfolioReport<DDMMYYYY><HHMMSS><CORP><USER>.<ext>`.

Recipe at `C:/Repos/bizlink_portfolio.js`. About 1 second per format.

## Transaction History (FC9220) — Save as PDF / XLS / CSV / HTML

Verified working 2026-05-07 with **219 transactions** over Last 90 Days. Hard limit confirmed: server rejects any From-date earlier than today minus 90 days with the feedback message `"From and To Dates should be later than MM/DD/YYYY."`. For older history, use the Statement of Account PDFs (last 10 months available).

Workflow:
1. Navigate to Transaction History (`gotoMenuByLabel(page, 'Transaction History')`)
2. Select account dropdown
3. Select period dropdown — `Last 7 Days` (`'2'`), `Last 30 Days` (`'3'`), `Last 60 Days` (`'4'`), `Last 90 Days` (`'5'`), `Custom Date Range` (`'6'`)
4. For Custom Date Range: set `#dateFrom` and `#dateTo` via JS `.value` setter in **MM/DD/YYYY** format (the picker is masked — `page.type` strips non-digits and `DD/MM/YYYY` gets reinterpreted)
5. Verify the account is still selected after period change (sometimes resets, reselect if needed)
6. Click Search button (`input[type="submit"][value="Search"]`)
7. Wait ≈ 8 s for results
8. The PDF/XLS/CSV/HTML links live in `<table class="actTable">` whose parent `<div class="report_box">` is `display: none`. Use **JS `.click()`** (not real mouse click) to trigger them — they work despite being hidden.
9. Capture via Fetch interception. Filenames: `TRANSACTION HISTORY REPORT<CORP><USER><DDMMYYYY><HHMMSS>.<ext>`.

Recipe at `C:/Repos/bizlink_txhist.js`. About 30 seconds for all three formats.

**Period dropdown values** (numeric, found in `select[name*="dateRangePanel:viewingType"]`):
- `0` Current Day · `1` Previous Day · `2` Last 7 Days · `3` Last 30 Days · `4` Last 60 Days · `5` Last 90 Days · `6` Custom Date Range

## Other modules (not yet automated)

- **Transfer to Own Accounts**, **Pay BPI / non-BPI Accounts**, **Pay Bills**, **Pay Government** (BIR, SSS, PhilHealth, Pag-IBIG) — payment flows, **untested and risky** (Maker-staged transactions can be Authorizer-approved). Do not script unless explicitly asked.
- **Mobile Check Deposit** / **Check Deposit Inquiry** — untested.
- **User Profile** / **Change Password** / **Device Management** — untested.

## Statement of Account PDFs contain the full transaction list

Each monthly Statement PDF is **5 pages** (≈ 340–450 KB):
- **Page 1** — account summary (beginning balance, total credits/debits broken down by source, ending balance)
- **Pages 3–5** — full transaction-level detail: `Date | Description | Ref | Details | Debit | Credit | Running Balance` (same columns as the Transaction History CSV)

So the 10 saved monthly statements PLUS the 90-day Transaction History gives **continuous transaction-level coverage from May 2025 onward**. For consolidated analysis, parse the PDFs (text is selectable, no OCR needed — `pdftotext` works) and concatenate with the Last-90-Days CSV.

## "BPI BizLink Downtime Advisory" page — usually NOT real downtime

Navigating to a stale Wicket URL (e.g. an old `?<n>-<m>.IBehaviorListener-...` link from a previous session) renders a page titled **"BPI BizLink Advisory"** that says *"BPI BizLink is currently undergoing maintenance activities."* This is misleading — BizLink itself is up. Recover by navigating to `https://www.bpibizlink.com/` (the canonical entry point), which redirects to the login page or `/fo/main` if a session is still alive. Do NOT conclude the site is in maintenance from this page alone — verify via a fresh browser tab to the canonical URL.

## Unattended weekly snapshot

`C:/Repos/bizlink_weekly.js` runs the full workflow under `puppeteer.launch()` (no debug port, no manual cleanup) — login, idempotent statement download, weekly-stamped Transaction History + Account Portfolio in 3 formats each, sign out. Chrome lifecycle is owned by puppeteer; `browser.close()` leaves zero leaked processes. About 50 seconds end-to-end. Schedule via Task Scheduler with `bizlink_weekly_install_task.bat` (defaults to Monday 07:00).

## Gotchas summary

- Wicket session-id `<n>` in URL changes per session — never hardcode menu hrefs. Always start from `/fo/main`, find menu link by visible text, then `page.goto(href)`. Helper `gotoMenuByLabel()` does this.
- `display: none` side menu — never try to click visible nav items, navigate by href
- Login form rejects React-style bulk setter — use `page.type()` with delay
- Datepicker on `#dateFrom` / `#dateTo` is **masked input** — `page.type` strips non-digits. Set via JS `.value` and dispatch input/change/blur. Format must be **MM/DD/YYYY**.
- Export links inside `<div class="report_box">` are `display: none` until "Save As" is clicked. Bypass entirely with JS `.click()` on the hidden `<a>` — Wicket onclick fires regardless of visibility.
- `window.location.href = exportUrl` does NOT trigger the export endpoint. Use real `page.mouse.click()` on visible export links, or JS `.click()` on hidden ones.
- After period change in Transaction History, the account dropdown sometimes resets — verify and reselect before submitting.
- Transaction History hard limit: 90 days lookback. Server feedback: *"From and To Dates should be later than MM/DD/YYYY."* For older data, use Statement of Account PDFs (10 months max).
- Download button needs `Fetch` domain interception, not Browser/Network
- Always re-`page.goto(SOA_URL)` between downloads, don't reuse the page state
- Account-select → period-select dropdown is AJAX, sleep 3 s minimum
- Session times out fast (low-single-digit minutes idle)
