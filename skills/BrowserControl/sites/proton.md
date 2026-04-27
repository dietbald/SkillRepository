# Proton — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Names, emails, passwords,
     API keys, account numbers, and recovery phrases belong in .env only. -->

## Status: ✅ Verified (2026-04-26) — account creation flow

## Task
Create a new Proton Mail account on the free plan.

## Portal URL
- Signup: `https://account.proton.me/signup?plan=free`
- Login: `https://account.proton.me/login`

## Login
- Method: username + password (Proton domain handle, no real email needed)
- Notes: drag-puzzle CAPTCHA on signup. No SSO.

## Flow

1. Navigate to `https://account.proton.me/signup?plan=free` — wait `domcontentloaded` + `sleep(4000)`.
2. **Username field is inside an iframe** with URL fragment `Name=email` (`account-api.proton.me/challenge/v4/html?...Name=email`). Use `page.frames().find(f => f.url().includes('Name=email'))` then `frame.type('input#username', ...)`.
3. **Password and confirm-password are on the main page**: `input#password` and `input#password-confirm` (the confirm field appears only after the first password is filled).
4. Click `button` whose text is `Start using Proton Mail now`.
5. **Upsell modal "Special Offer: Get Mail Plus for US$1"** appears immediately. The dismiss link "No, thanks" is below the offer card — but in the verified run the modal auto-dismissed when the CAPTCHA loaded behind it. Look for the CAPTCHA modal next; if upsell remains, click `No, thanks`.
6. **Drag-puzzle CAPTCHA** (Proton custom). NOT solvable by 2captcha CLI here (only image/recaptcha2/turnstile/hcaptcha are wired). Pause for the user to solve manually. There is also an "Email" tab as fallback that asks for an email + verification code.
7. After CAPTCHA: "Secure your account / Save your recovery kit to continue" page.
   - The **purple circular download icon** on the recovery card is a `<button>` (52×52) with empty innerText — find it as the only zero-text visible button on the page, or click coordinates from `getBoundingClientRect()`.
   - Click triggers a **blob: URL download** (`blob:https://account.proton.me/...`) named `proton-recovery-kit.pdf`. Capture via:
     ```js
     await client.send('Browser.setDownloadBehavior',
       { behavior: 'allow', downloadPath: SAVE_DIR, eventsEnabled: true });
     ```
     The `Browser.downloadWillBegin` event fires with the suggestedFilename.
   - Optional: click `copy recovery phrase` link to swap the card into "phrase mode" — this reveals a `Show` button. Click `Show`, then read the 12-word phrase from the DOM (lowercase, space-separated). To go back to PDF mode, click `download PDF` link.
8. Tick the `input[type="checkbox"]` "I understand…" then click the `Continue` button.
9. **Display name** page — the field is pre-filled with the username. Clear with `Ctrl+A, Delete`, retype the human-readable name, click `Continue`.
10. Lands on the Proton "Welcome" app picker — account creation done.

## Document format
- Recovery kit: blob: URL → captured via CDP `Browser.setDownloadBehavior`. Lands directly in `downloadPath` as `proton-recovery-kit.pdf`.

## File naming
- `proton-recovery-kit.pdf` (Proton's own filename — keep as-is for the user to recognise it)

## Known edge cases
- The signup form's username input lives in a sandbox iframe (`account-api.proton.me/challenge/v4/html?...Name=email`). `page.type('input#username')` on the main page fills a hidden mirror, not the visible field — must address the iframe directly with `frame.type()`.
- The confirm-password field is dynamically inserted after the password field has any value — don't query for it before typing the first password.
- "Special Offer" upsell modal can intercept the first submit click. If the post-submit screenshot shows the upsell, dismiss with `No, thanks` link.
- Display-name input has no `id` and no `name` attribute — find it via `input[type="text"]` + visibility check.

## Gotchas
- **Custom drag-puzzle CAPTCHA**: cannot be auto-solved with the wired 2captcha skill. The 2captcha service does support a "Coordinates"/grid type that *could* solve drag puzzles, but it's not exposed in `solve-captcha`. Pause for human, or use the "Email" tab fallback.
- Recovery kit download is a **blob URL** — `https.get` won't work; you must trust-click the download button with `page.mouse.click` after enabling `Browser.setDownloadBehavior`.
- Proton screenshots can be very small (e.g. 480×525) when the window is at certain widths — coordinates from a screenshot won't match `getBoundingClientRect()`. Always derive click coords from `getBoundingClientRect()`, never from screenshot pixels.
- `navigator.clipboard.readText()` returns whatever was on the OS clipboard from before — Proton's `copy recovery phrase` button copies via the page, but reading via `page.evaluate` may return stale values. Prefer reading the visible phrase from the DOM after clicking `Show`.

## How to re-extract
1. Open `https://account.proton.me/signup?plan=free`
2. Type username into the `Name=email` iframe's `input#username`
3. Type password into `input#password`, wait, then into `input#password-confirm`
4. Click `Start using Proton Mail now`
5. Solve the drag-puzzle CAPTCHA manually
6. On recovery page: click the unlabeled 52×52 button on the card → captures `proton-recovery-kit.pdf` via blob download
7. Tick "I understand", click `Continue`
8. Type display name, click `Continue`
