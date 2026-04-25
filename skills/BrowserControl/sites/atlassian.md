# Atlassian — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Org IDs, billing IDs,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — full invoice history extracted via paginated invoices page

## Task
Download all invoice PDFs for an Atlassian organization's billing account.

## Portal URL
`https://admin.atlassian.com/o/<org-id>/billing/<billing-account-id>/invoices`
(Note: `/billing-history` works too. The bare `/invoices` path 404s on some org configs — use the org/account-scoped URL.)

## Login
- Method: Atlassian account with **Billing admin** role on the target organization
- Credentials in `.env` under `ATLASSIAN_*`
- **Org admin and Site admin are NOT enough** — clicking "Invoices" without Billing admin shows a "You'll need to request access" wall with a "Request access" button (sends a notification to the current billing admin).
- The billing admin role often lives on a dedicated billing email, not the user's primary Atlassian account.

## Flow
1. Navigate to the org-scoped `/invoices` URL
2. List invoices on the current page: every `<a download href*="/invoices/">` is an invoice download link. Walk up parent elements to find the row containing the invoice number and date.
3. Pagination: ~20 invoices per page. Find the **enabled** "Next" button (`<button>` with text starting with "Next" and not disabled), click it, wait ~2.5s, repeat until disabled/missing.
4. For each invoice, fetch the PDF directly via authenticated `fetch(url, {credentials: 'include', redirect: 'follow'})` from the page context — cookies inherit, no extra auth headers needed.
5. Save as `Atlassian_{invoiceNumber}_{YYYY-MM-DD}.pdf`

## Document format
Direct PDF — fetched from the `<a download>` href with credentials inheritance from the page context.

## File naming
`Atlassian_{invoiceNumber}_{YYYY-MM-DD}.pdf`
Folder: `receipts/{YYYY}/{MM}/`

## Known edge cases
- **Two invoice ID formats**:
  - Modern: `IN-\d+-\d+-\d+` (e.g. seven-digit triplets)
  - Legacy (pre-2021): `AT-\d+` (Jira/Confluence-era)
  - Regex must match both: `(IN-\d+-\d+-\d+|AT-\d+)`
- **Currency varies per row** (USD, EUR, etc.) — capture the actual unit when extracting amounts
- **Cancelled / refunded invoices** still appear in the list with normal download links
- **Long history**: orgs going back 5+ years can have 100+ invoices — pagination loop is required

## Gotchas
- **Permission boundary**: Org admin ≠ Billing admin. Org/site admin sees the link but hits the request-access wall when clicking through. Only Billing admin sees the actual invoices table.
- **Self-service "Request access" button**: sends an in-app notification to the current billing admin — usable as a path when the user can't easily switch accounts.
- **Direct fetch works** because the page context carries the session cookies. Don't try to construct authenticated URLs externally — always fetch from inside `page.evaluate()`.
- **Scroll the table to the bottom before checking for Next** — the Next button is below the rows and may be off-screen on tall lists
- **`AT-` legacy format will silently be skipped** if your regex is `IN-` only; this loses Q4 2021 and earlier invoices

## How to re-extract
1. Sign into `admin.atlassian.com` as a Billing admin user (the email with the role, not necessarily the user's primary login)
2. Navigate to `Billing → Invoices` for the target org
3. Run the Atlassian extraction script — it paginates automatically and skips already-saved files
