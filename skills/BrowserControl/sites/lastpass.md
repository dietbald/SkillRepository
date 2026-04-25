# LastPass — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Family-plan owner emails,
     payment method tail digits, and member IDs belong in .env only. -->

## Status: ⚠️ Blocked — wrong account; payment history is owned by the Family plan administrator, not members

## Task
Download Premium / Premium Family annual renewal receipts from LastPass.

## Portal URL
- Login: `https://lastpass.com/`
- Payment history: `https://lastpass.com/my.php?cmd=invoice` (only useful when signed in as the **payer**)
- Account settings → "Payment History" link (opens in new tab)

## Login
- Method: LastPass account (email + master password)
- **CRITICAL**: receipts only show under the account that *paid* — for Premium Family plans, that is the family-plan owner, not member accounts.
- Member accounts see "No payments have been made" on the payment history page even if they joined a paid family plan.
- Credentials in `.env` under `LASTPASS_*` (member accounts), or `LASTPASS_OWNER_*` for the family-plan owner

## Flow (when signed in as the payer)
1. Sign in to `https://lastpass.com/`
2. Open the vault → top-right Account → **Account Settings**
3. Open the **Links** tab → click **Payment History** (opens new tab)
4. Each receipt is its own HTML page → save with `page.pdf()`

## Flow (when signed in as a non-payer family member)
- Stop. Either:
  - Have the family-plan owner sign in and share the receipts, OR
  - Email `billing@lastpass.com` requesting copies of the renewal receipts (date + approximate amount). Note that pre-rebrand charges may appear under "LogMeIn Inc." — same transactions.

## Document format
Each receipt is an HTML page → `page.pdf()`. No direct PDF download from the portal.

## File naming
`LastPass_{invoiceId}_{YYYY-MM-DD}.pdf`

## Known edge cases
- **"No payments have been made"** when signed in as a Family-plan member — this is correct, not a bug. Only the payer sees receipts.
- **LogMeIn Inc. branding**: pre-split charges may show as "LogMeIn Inc." on the user's bank statement and on older receipts — same vendor, same transaction, no action needed.
- **Family plan owner email** is rarely the same as the billing email of the parent business. If the owner's email is unknown, check the renewal-confirmation emails received by the original purchaser.

## Gotchas
- The Payment History link is buried in **Account Settings → Links** — not the main settings panel. Easy to miss.
- **Don't try to scrape the payments page from a member account** — it will look empty regardless of how many seats are billed.
- The receipts portal opens in a NEW TAB (`window.open`). Register `targetcreated` before clicking.

## Support email fallback
- **To**: `billing@lastpass.com`
- **Subject**: Request for Family plan receipt copies — `<YYYY-MM>` and `<YYYY-MM>`
- Reference the family-plan owner's email and the approximate charge amounts; they can match by amount + date even without an invoice ID.

## How to re-extract
1. Sign in as the **payer / family-plan owner** at `https://lastpass.com/`
2. Vault → Account → Account Settings → Links → Payment History (new tab)
3. Save each receipt with `page.pdf()`
4. If the user is not the payer, fall back to email support
