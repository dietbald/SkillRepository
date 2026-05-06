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

## Other modules (not yet automated)

- **Transaction History** (`?<n>-1.…rows-1-row-menuLink`) — for line-item history (last 90 days per BPI help docs). Same Wicket pattern — same Fetch interception trick should work.
- **Transfer to Own Accounts**, **Pay BPI / non-BPI Accounts**, **Pay Bills**, **Pay Government** (BIR, SSS, PhilHealth, Pag-IBIG) — payment flows, untested.
- **Statement of Account itself caps at 10 months.** For older statements, branch / phone request only.

## Gotchas summary

- Wicket session-id `<n>` in URL changes per session — never hardcode, always pull from current `page.url()` or use the path-only navigation
- `display: none` side menu — never try to click visible nav items, navigate by href
- Login form rejects React-style bulk setter — use `page.type()` with delay
- Download button needs `Fetch` domain interception, not Browser/Network
- Always re-`page.goto(SOA_URL)` between downloads, don't reuse the page state
- Account-select → period-select dropdown is AJAX, sleep 3 s minimum
- Session times out fast (low-single-digit minutes idle)
