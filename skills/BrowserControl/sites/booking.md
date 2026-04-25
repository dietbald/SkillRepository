# Booking.com — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Booking refs, traveler names,
     and email addresses belong in .env only. -->

## Status: ✅ Verified (2026-04-25) — flight booking detail page saved as PDF

## Task
Save a booking confirmation page (flight or hotel) as PDF when no native download exists.

## Portal URL
- Bookings list: `https://secure.booking.com/myaccount/bookings`
  (NOT `account.booking.com/bookings` — that 404s)
- Flight detail page: `https://flights.booking.com/booking/order-details/<opaque-id>`
- Hotel reservations: same `/myaccount/bookings` list, separate detail URL pattern

## Login
- Method: Booking.com account (email/password or Google OAuth)
- Credentials in `.env` under `BOOKING_*`
- Manual sign-in at `https://account.booking.com/sign-in`
- Session persists in the ChromeDebug profile

## Flow
1. Navigate to `https://secure.booking.com/myaccount/bookings`
2. Scroll to the bottom — bookings list lazy-loads
3. Find the target booking card by its content (origin/dest + date for flights; hotel name + date for hotels)
   - Each card wraps the whole row in an `<a>` — `mouse.click()` on text matched by selector navigates to detail
4. On the detail page (`flights.booking.com/booking/order-details/...`), the booking confirmation is a full HTML page including booking ref, traveler, total, e-ticket info, and contact
5. Save with `page.pdf({ format: 'A4', printBackground: true })` — Booking.com does **not** issue tax invoices for flights and has no native download

## Document format
HTML page → save with `page.pdf()`. No direct PDF link exists for flight bookings.

## File naming
`Booking_{bookingRef}_{YYYY-MM-DD}_{ORIGIN}-{DEST}.pdf` (flights)
`Booking_{bookingRef}_{YYYY-MM-DD}_{hotelSlug}.pdf` (hotels)

## Known edge cases
- **Flights have no tax invoice**: only the booking confirmation page; if the user needs a VAT-compliant receipt, they must request it from the airline/travel agent that fulfilled the flight, not Booking.com.
- **Hotels do issue VAT invoices**: flow is similar but the detail page often has a "Get receipt" link.
- **Cancelled bookings** still appear with a "Cancelled" badge — detail page is still saveable.

## Gotchas
- **Wrong path**: `account.booking.com/bookings` and `secure.booking.com/bookings` 404. Use `secure.booking.com/myaccount/bookings`.
- **Lazy-load**: bookings further down the list don't render until scrolled into view; always scroll to bottom before searching for a card.
- **Subdomain sprawl**: detail pages for flights live on `flights.booking.com`, hotels on `secure.booking.com`. Filter `targetcreated` events accordingly.
- **Booking.com is not a tax-invoice issuer for flights**: setting expectations matters — the saved PDF is "proof of booking", not a BIR/VAT-compliant receipt.

## How to re-extract
1. Sign in at `https://account.booking.com/sign-in`
2. Navigate to `https://secure.booking.com/myaccount/bookings`, scroll, find target booking
3. Click into the detail page, run `page.pdf()` to save
