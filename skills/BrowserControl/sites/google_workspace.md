# Google Workspace — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Tenant domains, billing IDs,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — full invoice history extractable per tenant, with rate-limit caveats

## Task
Download all PDF Invoices from a Google Workspace billing account's Transactions page.

## Portal URL
- Admin: `https://admin.google.com/ac/billing/accounts/<billing-account-id>/transactions`
- Inner iframe: `https://payments.google.com/payments/u/0/timelineview` (this is where the actual DOM lives)

## Login
- Method: Google account that is a **billing admin** on the target Workspace tenant
- Each tenant (each primary domain) is a separate billing context — the same Google account may be a billing admin on tenant A but not tenant B. Sign-in must be repeated per tenant.
- Session expires; Google will force a password re-verify after detecting "unusual activity" (i.e. heavy automation) — see Gotchas

## Flow
1. Navigate to the Admin Transactions URL above
2. Wait for the iframe whose URL contains `payments.google.com` AND `timelineview` — all subsequent DOM ops happen on that frame, not the top page
3. Set date range to **All time** if not already — the dropdown chip shows the current range; click it then click the "All time" menu item
4. Scroll to bottom repeatedly to lazy-load all months
5. Expand every collapsed card: `.b3id-collapsing-card.collapsed` → click its `.b3id-header-container` (loop until none remain)
6. Enumerate PDF invoice zippys:
   - Each is `.b3id-document-zippy-line-item-header` whose parent is `.jfk-freestanding-menu-button`
   - Inside a "PDF Invoice" subsection (sibling to "CSV Invoice" — only PDF is reliable)
7. For each invoice:
   a. Scroll the zippy into view
   b. **Trusted click** the zippy → opens a popup menu containing "Download" and "Regenerate invoice"
   c. Find the **visible** Download action: `.b3id-document-zippy-action` whose `textContent === 'Download'` AND `offsetParent !== null` (clicking creates a new hidden popup each time — must filter for visible one)
   d. Tag it with a temporary class (e.g. `__pw_dl`) so the next click is unambiguous
   e. Wrap the click in `expect_download()` / Puppeteer's download equivalent
   f. **Strip 4-byte protobuf envelope prefix**: `idx = body.find(b'%PDF')`; if `idx > 0`, slice `body = body[idx:]`
   g. Pace at least 2 seconds between invoices to avoid rate limit
8. Save as `GoogleWorkspace_{invoiceId}_{YYYY-MM-DD}.pdf`

## Document format
PDF, but wrapped in a 4-byte protobuf-style length prefix that Chrome's native download path strips automatically. When fetching directly via JS, the prefix is present and must be removed before the file is a valid PDF (look for `%PDF` magic).

## File naming
`GoogleWorkspace_{invoiceId}_{YYYY-MM-DD}.pdf`
Folder: `receipts/{YYYY}/{MM}/`

## Known edge cases
- **Multi-tenant billing**: each Workspace tenant (each primary domain) has its own billing account, its own admin console, and may need different sign-in credentials. Treat each tenant as a separate extraction run.
- **Suspended subscriptions**: still surface their historical invoices in Transactions — extract the same way.
- **CSV invoice URLs (`data-download-url` directly on the header)**: 500 on fetch. Ignore; only use PDF zippys.
- **Q4 2021-era invoices**: some legacy invoices are no longer available in the Transactions UI; falling back to email support (`gws-apac-cs@google.com` for APAC) is the only path.

## Gotchas
- **Iframe**: nearly all DOM is inside `payments.google.com/timelineview` iframe — `frame.evaluate(...)` not `page.evaluate(...)`
- **Each zippy click creates a new popup**: the DOM accumulates hidden popups; filter every Download action by `offsetParent !== null`
- **Direct URL fetch returns HTTP 500**: the `data-download-url` extracted from the menu only works through Chrome's native download flow. Don't try `fetch(url, {credentials:'include'})` — must trigger via trusted click + download capture.
- **Rate limiting**: ~20 rapid-fire downloads triggers Google's anti-automation, which forces a password re-verify and may sign the user out. Pacing of 2s/invoice was stable; faster paces failed.
- **Protobuf prefix**: every downloaded file starts with 4 bytes before `%PDF`. Strip before saving.
- **First-100-bytes hashing for dedup is wrong**: Google reuses the header for many invoices, so prefix-only hashing produces false positives that delete valid files. Use full-file MD5.
- **Date-range chip text**: "Last 3 months" / "All time" / "This year" — detect current value before deciding whether to change

## How to re-extract
1. Sign in to `admin.google.com` as a billing admin of the target tenant
2. Navigate to `Billing → Transactions`
3. Run the Google Workspace extraction script with `SLOW = 2.0`+ pacing
4. If rate-limited: wait at least an hour, then retry; or fall back to support email
