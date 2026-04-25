# Thai Airways — BrowserControl Knowledge

## Status: ✅ Verified (2026-04-17) — e-receipt extracted via e-Receipt portal

## Task
Download e-Receipt from Thai Airways' e-Receipt portal using PNR + passenger name.

## Portal URLs
- e-Receipt portal: `https://www.thaiairways.com/en-ph/book/e-Receipt/`
- Mileage statement (ROP): `https://www.thaiairways.com/en-ph/rop/miles-management/mileage-statement`
- Manage Booking (requires PNR + last name): `https://www.thaiairways.com/en-ph/` → Manage Booking tab

## Login
- e-Receipt portal: **no login required** — needs Booking Reference (PNR) + First Name + Last Name (read from `.env` `THAIAIRWAYS_FIRST_NAME` / `THAIAIRWAYS_LAST_NAME`)
- ROP portal: requires Royal Orchid Plus credentials — read from `.env` under `THAIAIRWAYS_*`

## Flow — e-Receipt portal
1. Navigate to `https://www.thaiairways.com/en-ph/book/e-Receipt/`
2. Fill in: Booking Reference (PNR), First Name, Last Name (from `.env`)
3. Check the Terms & Conditions checkbox
4. Click "Continue"
5. If success: URL becomes `.../e-receipt/success` — page shows receipt and "Download PDF" / "Print e-Receipt" buttons
6. **"Download PDF" button does nothing in Puppeteer** — use `page.pdf()` instead:
   ```javascript
   await page.pdf({ path: fp, format: 'A4', printBackground: true });
   ```

## Flow — Mileage Statement (fallback)
1. Log in to Royal Orchid Plus (credentials from `.env`)
2. Navigate to `/rop/miles-management/mileage-statement`
3. Select "1 Year" period
4. Use `page.pdf()` — the "Download PDF" button on the page does nothing in Puppeteer

## Document format
- e-Receipt: HTML page on success URL → save with `page.pdf()`
- Mileage statement: HTML page → save with `page.pdf()`

## File naming
`ThaiAirways_{flightNumber}_{YYYY-MM-DD}_{PNR}_receipt.pdf`
`ThaiAirways_{flightNumber}_{YYYY-MM-DD}_mileage_statement.pdf`

## Known edge cases
- **6-month limit**: e-Receipt portal rejects PNRs older than 6 months from ticket issuance — returns "No Matching Records Found"
- **Multiple PNRs per booking**: same flight can have different PNRs — try all PNRs from booking confirmation emails if one fails
- **Max 9 requests**: the success page shows "Maximum limit for request is 9 times" — don't regenerate unnecessarily
- **ROP portal has no receipt download**: only shows Mileage Statement, My Profile, Miles management — no booking history or receipt link

## Gotchas
- The e-Receipt portal is the only self-service option; for expired PNRs the only alternative is contacting Thai Airways customer service directly with the PNR
- PNRs are in the original booking confirmation email — check there first before attempting the portal
- "Download PDF" buttons on Thai Airways pages consistently fail in Puppeteer — always use `page.pdf()`

## How to re-extract
1. Navigate to `https://www.thaiairways.com/en-ph/book/e-Receipt/`
2. Enter PNR + first/last name from `.env`, accept T&C, click Continue
3. On success page, use `page.pdf()` to save
