# Dot.PH — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Order numbers, transaction IDs,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — full transaction history accessible (>5 years)

## Task
Download payment receipt PDFs for Dot.PH domain orders / renewals.

## Portal URL
- Login: `https://www.dot.ph/`
- Transactions list: `https://www.dot.ph/manage/orders` (sidebar shows it as "My Transactions")
- Order detail: `https://www.dot.ph/manage/orders/<order-id>`
- Quick receipt: `https://www.dot.ph/quick_receipt?order_number=<id>` (summary)
- Full receipt: `https://www.dot.ph/receipt?order_number=<id>&sign_in=true` (authoritative)

Note: `secure.dot.ph` does not resolve — use `www.dot.ph`.

## Login
- Method: Dot.PH account (email/password)
- Credentials in `.env` under `DOTPH_*`
- Manual sign-in via the homepage Login button

## Flow
1. Sign in
2. Navigate **directly** to `/manage/orders` (don't click "My Transactions" — see Gotchas)
3. Extract order list via `document.body.innerText` parse — yields `Order No / Date Placed / Completed / Total` tuples
4. For each target order:
   a. Open `/manage/orders/<order-id>`
   b. Two receipt links exist:
      - **"Receipt"** (top-right of status row) → `/quick_receipt?order_number=<id>` (summary)
      - **"View Your Receipt"** button (on the quick_receipt page) → `/receipt?order_number=<id>&sign_in=true` (authoritative "Thank you" page with date, amount, merchant transaction ID)
   c. Save BOTH via `page.pdf()` for completeness — the authoritative one is the second
5. Save as `DotPH_{orderId}_{YYYY-MM-DD}.pdf`

## Document format
HTML pages → save with `page.pdf()`. No direct PDF download.

## File naming
`DotPH_{orderId}_{YYYY-MM-DD}_receipt.pdf`
`DotPH_{orderId}_{YYYY-MM-DD}_quick.pdf` (optional summary version)

## Known edge cases
- **The "12-month limit" claim is wrong**: the self-service portal shows the full transaction history (5+ years tested). No need to email support for older receipts.
- **Multiple domain renewals on one order**: a single order can cover several domains — merchant txn ID, total, and Stripe ID still uniquely identify it.

## Gotchas
- **"My Transactions" link appears twice in the DOM** (header dropdown + sidebar). The first match is hidden — clicking it does nothing. Navigate directly via `/manage/orders` instead.
- **Two receipt URLs**: the quick one is a summary; the full one (`/receipt?...&sign_in=true`) is the one with merchant transaction ID and proper "thank you" formatting. Save the full one as the primary receipt.
- **`secure.dot.ph` does NOT resolve** — there's no separate secure subdomain.

## How to re-extract
1. Sign in at `https://www.dot.ph/`
2. Navigate to `https://www.dot.ph/manage/orders`
3. For each target order, open `/manage/orders/<order-id>` then `/receipt?order_number=<id>&sign_in=true`
4. Save with `page.pdf()`
