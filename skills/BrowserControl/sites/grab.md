# Grab (Philippines) — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Phone numbers,
     emails, passwords, names, account numbers belong in .env only. -->

## Status: ⚠️ Partial — login flow verified up to challenge-options (2026-05-04). Help-Centre article click-through and food.grab.com cart flow not yet verified.

## Task
Document the user-facing flows for **booking a new order** and **tracking an ongoing order** across Grab's PH services (Transport / Food / Mart / Express / Pabili).

## Surfaces
- `https://www.grab.com/ph/` — marketing-only homepage. No consumer ordering.
- `https://help.grab.com/passenger/en-ph/` — public Help Centre (search works without login; article body click-through has only been verified after login).
- `https://food.grab.com/ph/en/` — GrabFood web ordering (SPA; renders fully only after a few seconds; "Login/Sign-Up" gate at the top).
- `https://gifts.grab.com/ph/` — GrabGifts (vouchers).
- **The actual ride/transport booking is mobile-app-only.** The web has no rider booking surface; web-side guidance points users to download the app.

## Login
- Method: phone number (PH +63) → choose Push / OTP / Passkey → complete on device
- Login domain: `weblogin.grab.com` (OAuth-PKCE; redirects back to the originating service after success)
- Pages in sequence:
  1. `/passenger/login` — phone-entry + Continue (also offers "Continue with Google/Facebook/Apple")
  2. `/passenger/saved-accounts` — transient redirect on devices with a previous session; shows a green spinner before bouncing back to /login or to challenge-options
  3. `/passenger/challenge-options` — picker: Send App Push Notification / Send OTP / Continue with Passkey
  4. `/passenger/challenge/{push_notification|otp|passkey}` — auth method-specific screen
  5. Redirect back to the originating service (e.g. `help.grab.com/passenger/en-ph/login` then `/passenger/en-ph/`)

### Phone input
- `<input type="tel" placeholder="12345678">` — country code `+63` is selected by default; type the phone WITHOUT the leading 0 (e.g. `9616281397`, not `09616281397`).
- Continue button enables only after a valid-looking number is entered.

### Challenge picker selectors
The three options are `<div role="button" class="styles__challengeItem___XXXX">` rows inside `<ul class="styles__challengeList___YYYY">`. Class names are CSS-modules-hashed, so use a partial match:

```javascript
const rows = [...document.querySelectorAll('div[role="button"]')]
  .filter(d => /styles__challengeItem/.test(d.className) && d.offsetParent !== null);
const target = rows.find(d => /Push Notification|Send OTP|Passkey/.test(d.innerText));
```

DO NOT text-search the broader DOM (`querySelectorAll('*').find(e => /Continue with Passkey/...)`) — it returns the LI/UL ancestor whose innerText contains all three options' labels, and click coords land on the wrong row.

### Passkey caveat
**Don't try to automate "Continue with Passkey".** CDP-injected click navigates to `/challenge/passkey` but no Windows Hello dialog fires (WebAuthn requires real user activation). The page hangs forever. See skill.md "WebAuthn / passkey login — don't try to automate".

If the user wants passkey, automate phone-entry only and let them click the row themselves.

### Session expiry on challenge-options
The `ctx_id` in the URL expires within ~5 minutes. If the user takes too long to pick a method, the click triggers "Oops, something went wrong" instead of advancing. Recovery: click "Back to login", re-enter phone from scratch — don't `history.back()` and reuse the same `ctx_id`.

## Help Centre — public flows for tracking & booking

The Help Centre's category tiles (Transport / Food / Mart / Express / etc.) are non-clickable `<div>` panels — clicking them does not navigate or expand a panel.

**Search is the way in.** Type into `<input placeholder="Search for a solution">` and a dropdown of `<li>` suggestions appears. Verified search terms and the canonical articles surfaced (titles match `[Category] Article title`):

### Tracking an ongoing order
Search "track" returns these article titles:
- `[Food] How can I track my booking status`
- `[Mart] How to track my GrabMart order`
- `[Express] How can I track my GrabExpress delivery`
- `[Transport] Sharing my ride details`
- `[Transport] Why is my ride delayed`

Common pattern across all tracking articles (per Grab's standard guidance and verified search hits): tracking happens **inside the Grab app** on the order/booking detail screen, which displays driver/rider name, vehicle, real-time map, ETA, and a "Share my ride" link. There is no public web tracking surface — even GrabFood Web hands tracking off to the app once the order is placed.

### Booking a new order
Search "book ride" returns:
- `[Transport] How to book a ride abroad`
- `[Transport] How do I book Rides at the NAIA Airport`
- `[Transport] Can I book a ride for my family and friends`
- `[Transport] How to add extra stops to my Grab ride`
- `[Transport] What are Group Rides`

Booking a Transport ride is **app-only** in PH. GrabFood/Mart/Express orders can be placed via `food.grab.com/ph/en/` web after login.

### Click-through to article body — UNVERIFIED
The dropdown LI suggestions do not have `href` attributes; they're SPA links. Clicks on the LI element using my standard text-find selector (`querySelectorAll('li').find(e => e.innerText === '...')`) did not navigate or open the article body, and the page URL stayed at `/passenger/en-ph/`. Whether this is a logged-out gate, a wrong click target (the actionable element may be a child anchor or a parent div), or an SPA route I'm not triggering correctly is undetermined. Try logged-in next time, or inspect for a `data-id` / `data-href` attribute on the LI before clicking.

## Flow

### Phone-entry (automatable)
```javascript
// Lands on https://help.grab.com/passenger/en-ph/login → redirects to weblogin.grab.com
await page.goto('https://help.grab.com/passenger/en-ph/', { waitUntil: 'domcontentloaded' });
// Click LOGIN button (top-right)
const login = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button, a')]
    .find(e => (e.innerText || '').trim().toUpperCase() === 'LOGIN' && e.offsetParent !== null);
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
await page.mouse.click(login.x, login.y);

// Wait for redirect to weblogin
await page.waitForFunction(() => location.hostname === 'weblogin.grab.com', { timeout: 15000 });

// Wait through possible /saved-accounts spinner
await page.waitForFunction(() => {
  return new URL(location.href).pathname.endsWith('/login');
}, { timeout: 20000 });

// Type phone (no leading 0)
await page.type('input[type="tel"]', '9616281397');
await page.click('button:has-text("Continue")');   // or coordinate click on the Continue div

// Wait for challenge-options
await page.waitForFunction(() =>
  new URL(location.href).pathname.includes('/challenge-options'), { timeout: 15000 });
```

### Auth method (user does this)
Hand off — the user picks Push / OTP / Passkey themselves in the Chrome window and completes on their device. Poll up to 2 minutes for navigation away from `weblogin.grab.com`.

## Document format
N/A (this is interactive, not document extraction).

## Known edge cases
- **Cookie banner**: "Accept All Cookies" / "Accept Only Strictly Necessary Cookies" / "Cookies Settings" — dismiss with "Accept All Cookies" or "Accept Only Strictly Necessary".
- **Saved-accounts spinner**: on returning devices, transient blank page with green spinner shows briefly between LOGIN click and phone form. Wait for `/login` pathname before trying to fill input.
- **`code_challenge=` in URL**: the OAuth URL contains the substring `challenge` even on the phone-entry page. Use `new URL(url).pathname` for path checks, not `url.includes('challenge')`.

## Gotchas
- DON'T kill existing Chrome — launch on `--remote-debugging-port=9222` alongside it (already covered in skill.md operating principle).
- Help Centre search returns canonical article titles in a dropdown but clicking LI items doesn't open the body via standard selectors (see "UNVERIFIED" above).
- WebAuthn / passkey can't be CDP-driven (covered in skill.md).
- One Chrome `--user-data-dir` keeps the Grab session — once logged in, future runs against the same dir don't need login again.

## How to re-extract / next session
1. Connect to existing Chrome on 9222 (don't relaunch).
2. `goto` `https://help.grab.com/passenger/en-ph/`.
3. If LOGIN button visible → run phone-entry automation; hand off auth method.
4. Search bar accepts free-text queries; dropdown returns titled article suggestions.
5. To verify article click-through, inspect dropdown LI for `data-*` attributes or wrapping anchor before next attempt.
6. For ordering: `food.grab.com/ph/en/` is the GrabFood web surface (SPA — wait 4+ seconds for body to render).
