# AWS — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Account numbers, billing IDs,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — all monthly tax invoices extracted (Dec 2021 → present)

## Task
Download monthly Tax Invoice PDFs from AWS Billing console for the active account.

## Portal URL
`https://console.aws.amazon.com/billing/home#/bills`

## Login
- Method: AWS root user — sign in manually via `https://console.aws.amazon.com/`
- Credentials in `.env` under `AWS_*`
- Multiple AWS accounts may exist for the same business — confirm the account ID shown in the top-right corner matches the target account before downloading. Wrong-account is the most common pitfall.
- Session lasts ~12 hours; AWS will redirect to signin if expired

## Flow
1. Navigate to `#/bills` and verify the account ID badge (top-right)
2. Click the **"Billing period: <current>"** dropdown button (top of the page)
3. For each target month:
   a. Click the year (e.g. "2024") in the dropdown — expands its month submenu
   b. Click the month (e.g. "March 2024") — page reloads with that period's bills
   c. Scroll to the **"Tax Invoices and Additional Documents"** section at the bottom
   d. The VAT invoice row has a clickable Invoice ID link — `mouse.click()` triggers a Chrome native download
   e. Capture the download with `page.expect_download()` (Playwright) or the equivalent Puppeteer download path
4. Save as `AWS_{invoiceId}_{YYYY-MM-DD}.pdf`

## Document format
PDF — Chrome native download triggered by clicking the invoice ID link (no direct URL; the `<a>` has an `onclick` handler, no `href`).

## File naming
`AWS_{SGIN-id}_{YYYY-MM-DD}.pdf`
Folder: `receipts/{YYYY}/{MM}/`

## Known edge cases
- **Year submenu may show fewer months than expected**: e.g. the year a business *opened* its account only has months from that point onward. Iterate skip-on-fail rather than hard-failing on missing months.
- **Multiple business entities = multiple AWS accounts**: the account that holds historical invoices may not be the one currently logged in. Pre-cutover invoices live in the older account; signin must switch root user.
- **Service plan changes**: when a tier is upgraded/downgraded mid-month, two invoice rows can appear for the same period — download both.

## Gotchas
- The invoice link appears 3× on the page (once per Tax Invoices table). Use `.first` + scroll-into-view, or tag the visible one via JS (`offsetParent !== null`)
- `TargetClosedError` mid-iteration: the browser context can drop on long runs. Make the script idempotent (`if fs.existsSync(fp) skip`) and just re-run.
- **No emoji in log output on Windows**: stdout is cp1252 by default and will throw `UnicodeEncodeError`. Use `[OK]`/`[FAIL]` and set `PYTHONIOENCODING=utf-8` for Python scripts.
- The dropdown does not accept keyboard input — clicks only.

## How to re-extract
1. Sign into the correct AWS account at `https://console.aws.amazon.com/`
2. Navigate to `#/bills`, confirm account ID
3. Run the AWS extraction script — already-downloaded invoices are skipped
4. For a different historical AWS account, sign out and back in as that root user, then re-run
