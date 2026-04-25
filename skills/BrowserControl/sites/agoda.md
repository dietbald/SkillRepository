# Agoda — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Booking IDs, traveler names,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — older booking saved via "View bookings older than 18 months" path

## Task
Save a hotel booking confirmation page as PDF (proof of booking — not BIR/VAT-compliant).

## Portal URL
- Bookings: `https://www.agoda.com/account/bookings.html`
- Booking detail: `https://www.agoda.com/account/editbooking.html?bookingId=<encoded>`

## Login
- Method: Agoda account (email/password or Google OAuth)
- Credentials in `.env` under `AGODA_*`
- Manual sign-in at `https://www.agoda.com/account/signin.html`

## Flow
1. Navigate to `/account/bookings.html`
2. Click the **"Completed"** tab (default is "Upcoming" — target booking won't appear there)
3. Scroll to the bottom — if the target booking is older than 18 months, click the prompt **"Looking for bookings older than 18 months? View bookings"**
4. Scroll the now-extended list to find the target booking by booking ID
5. Click that card's **"Manage booking"** button → navigates to `/account/editbooking.html?bookingId=...`
6. Save with `page.pdf({ format: 'A4', printBackground: true })`

## Document format
HTML page → save with `page.pdf()`. No native invoice download in the user-facing portal.

## File naming
`Agoda_{bookingId}_{YYYY-MM-DD}_{hotelSlug}.pdf`

## Known edge cases
- **>18 month bookings hidden by default**: the bookings list only shows the last 18 months until the "View bookings" prompt at the bottom is clicked. Easy to miss; always scroll to bottom on Completed tab if the target isn't visible.
- **Search-by-booking-ID input does not actually filter**: at least in tested case, typing a booking ID doesn't reduce the list. Walk the DOM and match `ID: <id>` text instead.
- **Cancelled bookings**: still appear, still have a Manage button, still saveable.

## Gotchas
- **Default tab is Upcoming, not Completed** — historical bookings only show on Completed
- **Agoda's e-receipt is not BIR-compliant** for Philippine VAT purposes. The saved page is proof-of-booking only; users needing a Philippine VAT receipt must contact the hotel directly.
- **No direct PDF download**: `page.pdf()` is the only path

## How to re-extract
1. Sign in at `https://www.agoda.com/account/signin.html`
2. Navigate to `/account/bookings.html` → click "Completed" tab → scroll to bottom → click "View bookings older than 18 months" if needed
3. Find target booking ID, click Manage booking, save with `page.pdf()`
