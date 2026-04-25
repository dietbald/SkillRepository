# Cebu Pacific — BrowserControl Knowledge

## Status: ✅ Verified (2026-04-25) — 13/14 bookings extracted

## Task
Download itinerary PDFs for all past (and upcoming) bookings via the Manage Bookings portal.

## Portal URL
`https://www.cebupacificair.com/en-PH/manage/my-bookings`

## Login
- Method: MyCebuPacific account (email + password) — credentials in `.env` under `CEBUPACIFIC_*`
- Session expires — script polls for re-login automatically
- Must be logged in before running

## Flow
1. Navigate to `/manage/my-bookings`
2. Apply "Past bookings" filter: click the filter dropdown then the list item
3. Click "Show more" repeatedly until no more button (loads all bookings)
4. Collect booking refs with regex `^([A-Z0-9]{6})$` on `document.body.innerText`
5. Parse origin/dest from adjacent IATA code pairs `^([A-Z]{2,3})  ([A-Z]{2,3})$`
6. Repeat steps 2–5 for "Upcoming bookings" filter, deduplicate
7. For each unsaved booking:
   a. Navigate back to `/manage/my-bookings`, re-apply filter, reload all
   b. Find the booking's "Manage" button, scroll into view, `mouse.click(x, y)`
   c. Wait for URL: `pathname.includes('/manage/my-booking') && !pathname.includes('/manage/my-bookings')` — **both checks required**
   d. Wait for "View itinerary" button
   e. `mouse.click()` on "View itinerary"
   f. Wait for URL containing `/manage/itinerary`
   g. `page.pdf({ format: 'A4', printBackground: true })`

## Document format
HTML page rendered by Angular SPA — save with `page.pdf()`

## File naming
`CebuPacific_{ref}_{YYYY-MM-DD}_{ORIGIN}-{DEST}.pdf`

## Known edge cases
- **YE5ZVL (MNL→ILO, Jan 2025)**: Manage button is visible but fires no Angular navigation event — booking has no status badge (unlike "✅ Confirmed" on others), likely voided/refunded. Skip it.
- **Session expiry**: modal appears saying "Your session has expired" — `dismissSessionModal()` clicks "Back to home"; then `ensureLoggedIn()` polls until user logs back in

## Gotchas
- **URL check bug**: `pathname.includes('/manage/my-booking')` ALSO matches `/manage/my-bookings` (the list page). Always add `&& !pathname.includes('/manage/my-bookings')` or the script incorrectly reports success immediately without navigating
- **Angular SPA**: use `mouse.click()` for all navigation — `dispatchEvent` is not needed here
- **Page is slow**: set all waitForFunction timeouts to 30000ms minimum
- **PDFs are large**: ~3MB each (full page render) — normal, not a sign of error
- **Booking with no return flight**: return column shows "–" — still has a Manage button but it may not work (see YE5ZVL edge case)

## How to re-extract
1. Open `https://www.cebupacificair.com/en-PH/manage/my-bookings` and log in
2. Run `node cebupacific_extract.js` — already-saved files are skipped
3. If session expired prompt appears, log in in the browser — script resumes automatically
