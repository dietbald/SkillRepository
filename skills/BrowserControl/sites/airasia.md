# AirAsia — BrowserControl Knowledge

## Status: ✅ Verified (2026-04-17) — 11/12 bookings extracted

## Task
Download all past booking receipts (or itineraries as fallback) from the AirAsia orders portal.

## Portal URL
`https://www.airasia.com/myorders/en/gb`

## Login
- Method: AirAsia account (email + password) — credentials in `.env` under `AIRASIA_*`
- Must be done manually in the browser before running the script
- Session survives for the duration of a script run

## Flow
1. Navigate to `/myorders/en/gb`
2. Click "Past" chip tab — use `dispatchEvent` (React synthetic event):
   ```javascript
   el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX, clientY }));
   ```
   Selector: element where `innerText === 'Past'` AND `className.includes('Chip__ChipContainer')`
3. Wait for `tr` rows with `[id="bookingNumber"]` cells
4. Collect all booking rows (scroll to bottom for lazy-loaded rows, deduplicate by booking number)
5. For each booking:
   a. Re-navigate to `/myorders/en/gb` + click Past (avoids stale state)
   b. Find the row by `[id="bookingNumber"]` matching the booking number
   c. Click the 3-dot `[id="airasia-dropdown-options"]` via `dispatchEvent`
   d. Wait for "Manage booking" `<li>` to be visible (`offsetParent !== null`)
   e. Click "Manage booking" via `dispatchEvent` → new tab opens at `/flights/pb/detail/...`
   f. On detail tab, wait for `<a>` elements, sleep 3s
   g. Find "Download receipt" (or "Download itinerary" as fallback)
   h. Click via `page.mouse.click(x, y)` — opens another new tab with pre-signed PDF URL
   i. Download PDF via Node `https` (no auth needed — token in URL)
   j. Close detail tab

## Document format
Pre-signed PDF URL at `https://flights-mmb.airasia.com/fp/itinerary-service/v3/invoice/<token>?isAaItinerary=true`
- Receipt: `.../invoice/<token>`
- Itinerary: `.../itinerary/<token>`
- Download directly with Node https — no auth headers needed

## File naming
`AirAsia_{bookingNumber}_{YYYY-MM-DD}_{ORIGIN}-{DEST}.pdf`
`AirAsia_{bookingNumber}_{YYYY-MM-DD}_{ORIGIN}-{DEST}_itinerary.pdf` (when no receipt)

City slug mappings (replace full city names with IATA codes): Bangkok/Don Mueang → BKK, Udon Thani → UTH, Phitsanulok → PHS, Manila → MNL, Iloilo → ILO

## Known edge cases
- **Cancelled bookings** (e.g. JF6STQ): No download button on detail page — skip silently
- **Itinerary-only** (e.g. QDJU2D): Only "Download itinerary" shown — save with `_itinerary` suffix
- **Gmail service workers**: Fire `targetcreated` as false positives — always filter by URL containing `airasia.com` or `flights-mmb`

## Gotchas
- **3-dot menu and "Manage booking"**: must use `dispatchEvent` (React synthetic events) — `mouse.click()` does not trigger them
- **Download receipt/itinerary button**: must use `mouse.click()` — inner `<a>` link needs real mouse event to trigger new-tab navigation; `dispatchEvent` fails here
- **New tab detection**: register `browser.on('targetcreated')` BEFORE clicking, resolve only for AirAsia-domain URLs
- **All bookings on one page**: no "Show more" needed (tested: 12 bookings load at once)

## How to re-extract
1. Open `https://www.airasia.com/myorders/en/gb` and log in
2. Run `node airasia_extract.js` — already-saved files are skipped automatically
