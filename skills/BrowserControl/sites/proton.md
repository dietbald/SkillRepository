# Proton — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Names, emails, passwords,
     API keys, account numbers, and recovery phrases belong in .env only. -->

Two flows verified, both at `account.proton.me` / `mail.proton.me`:
- **Account creation** (signup) — verified 2026-04-26
- **Sign-in + read inbox + retrieve magic-link / verification email** — verified 2026-05-02

Credentials in `.env`:
- `PROTON_EMAIL` (full address — `<username>@proton.me`)
- `PROTON_PASSWORD`

---

## Flow A — Account creation (free plan)

### Portal URL
- Signup: `https://account.proton.me/signup?plan=free`
- Login: `https://account.proton.me/login`

### Login
- Method: username + password (Proton domain handle, no real email needed)
- Notes: drag-puzzle CAPTCHA on signup. No SSO.

### Steps

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

### Document format
- Recovery kit: blob: URL → captured via CDP `Browser.setDownloadBehavior`. Lands directly in `downloadPath` as `proton-recovery-kit.pdf`.

### File naming
- `proton-recovery-kit.pdf` (Proton's own filename — keep as-is for the user to recognise it)

### Signup edge cases
- The signup form's username input lives in a sandbox iframe (`account-api.proton.me/challenge/v4/html?...Name=email`). `page.type('input#username')` on the main page fills a hidden mirror, not the visible field — must address the iframe directly with `frame.type()`.
- The confirm-password field is dynamically inserted after the password field has any value — don't query for it before typing the first password.
- "Special Offer" upsell modal can intercept the first submit click. If the post-submit screenshot shows the upsell, dismiss with `No, thanks` link.
- Display-name input has no `id` and no `name` attribute — find it via `input[type="text"]` + visibility check.

### Signup gotchas
- **Custom drag-puzzle CAPTCHA**: cannot be auto-solved with the wired 2captcha skill. The 2captcha service does support a "Coordinates"/grid type that *could* solve drag puzzles, but it's not exposed in `solve-captcha`. Pause for human, or use the "Email" tab fallback.
- Recovery kit download is a **blob URL** — `https.get` won't work; you must trust-click the download button with `page.mouse.click` after enabling `Browser.setDownloadBehavior`.
- Proton screenshots can be very small (e.g. 480×525) when the window is at certain widths — coordinates from a screenshot won't match `getBoundingClientRect()`. Always derive click coords from `getBoundingClientRect()`, never from screenshot pixels.
- `navigator.clipboard.readText()` returns whatever was on the OS clipboard from before — Proton's `copy recovery phrase` button copies via the page, but reading via `page.evaluate` may return stale values. Prefer reading the visible phrase from the DOM after clicking `Show`.

---

## Flow B — Sign in & read an email (e.g. retrieve magic-link code)

### Sign in

Navigating to `https://mail.proton.me/` redirects to `https://account.proton.me/mail`. Form:
- `input#username` — accepts the username portion OR the full email
- `input#password`
- `button` with text `Sign in`

Sign-in triggers a navigation; wrap any `page.evaluate()` calls afterwards in try/catch (or await navigation) — otherwise you'll hit "Execution context was destroyed".

### First-login onboarding gauntlet (CRITICAL)

A fresh Proton account walks the user through ~5 sequential modal panels on first inbox load. Each blocks all clicks underneath. They appear in this order:

1. **"Welcome to Proton Mail"** carousel — button: `Let's get started`
2. **"Distraction-free emailing"** (desktop app upsell) — button: `Maybe later`
3. **"Anytime, anywhere access"** (mobile app QR) — button: `Next`
4. **"Make it your own"** (theme picker) — button: `Use this`
5. Occasionally a Mail Plus upsell — button: `Maybe later` or `Close`

Sweep with the popup-dismiss helper from `skill.md` until none of those labels match, before attempting to click any inbox row.

### Open a specific email

Conversation rows render as nested divs without a clear `role="row"` — text-match against the subject and pick the **smallest** matching element (see skill.md "Text-match must pick the smallest matching element"). Clicking a wrapper at viewport-center hits whichever row happens to be there, NOT the top row.

```javascript
const coords = await page.evaluate(() => {
  const matches = [...document.querySelectorAll('span, div')]
    .filter(e => /Confirm your.+account/i.test(e.textContent || '') &&
                 e.children.length < 5 && e.offsetParent !== null);
  const el = matches.sort((a,b) =>
    a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
```

### Read the email body — it lives in an iframe

The email body renders inside an `about:blank` iframe — `page.evaluate()` won't see it. Iterate `page.frames()`:

```javascript
const frameContents = await Promise.all(page.frames().map(async f => {
  try {
    return {
      url: f.url(),
      text: await f.evaluate(() => document.body.innerText),
      links: await f.evaluate(() =>
        [...document.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.href }))),
    };
  } catch { return null; }
}));
const body = frameContents.find(f => f && /verification|magic|sign in/i.test(f.text));
```

The `about:blank` frame is where the email content lives; the `https://mail.proton.me/...` frame is just chrome.

### Free-account quirks
- Storage cap 500 MB; banner constantly upselling Mail Plus
- `Upgrade to send email from @pm.me addresses` banner pinned to the top of the inbox after onboarding — non-blocking
- "Get storage bonus" sidebar checklist is harmless; ignore it

---

## Proton "unusual activity" restriction — blocks third-party verification emails

**Symptom**: After creating the account and signing up for a third-party service, the verification email never arrives. Proton shows no error; the inbox is simply empty. The account itself works (can send/receive from other Proton users).

**Cause**: Proton's automated abuse detection flags accounts that register for many external services in a short window. The restriction blocks all incoming emails from non-Proton senders until resolved.

**Fix — add and verify a recovery email address:**

1. Navigate to `https://account.proton.me/u/0/mail/recovery` (the `/u/0/` segment may vary — `/u/1/` for second account, etc.)
2. Fill the recovery email field with a valid, accessible address (e.g. an `@airmail.cc` alias from cock.li)
3. Click "Save" — Proton sends a verification code to the recovery address
4. Retrieve the code from the recovery inbox, paste it back in the Proton verification field
5. After verification, Proton shows "Your account is fully secure" and queued third-party emails begin arriving within 2–5 minutes

**Important**: Once the restriction lifts, previously queued verification emails (e.g. a TMDB activation) will arrive. Check the inbox before requesting a resend.
