# TMDB — The Movie Database

**Status:** Verified 2026-05-03 — login, email verification, API key acquisition confirmed working.

## Overview

TMDB offers a free Developer Plan that grants API v3 (API key) and v4 (read access token) access for personal/educational projects. The account must be email-verified before the API section is accessible.

## Signup flow

URL: `https://www.themoviedb.org/signup`

Form field IDs (verified):
- `#username` — display name / login username
- `#email` — email address
- `#password` — password
- `#password_confirm` — confirm password (NOT `#confirm_password` — that ID does NOT exist)
- `#rules-agreement` — checkbox for terms

Use `page.type()` for all fields (not `page.evaluate()` setter) — TMDB signup form validates via real keystroke events. After submitting, a **Cloudflare CAPTCHA** may appear ("Let's confirm you are human") — this must be solved manually by the user. Script should wait and watch for URL change to `/confirm_email` or `/login`.

## Email verification

After signup, TMDB sends a "Verify Your Email" email to the registered address. The email contains an "ACTIVATE MY ACCOUNT" link.

If using **Proton Mail** for the test account:
- Navigate to `mail.proton.me` and open the TMDB email
- The email body is rendered in a **nested iframe** — `page.evaluate()` on the main page won't find the link
- Iterate `page.frames()` and search each frame for links containing `themoviedb.org`
- The verification link looks like: `https://www.themoviedb.org/account/verify?token=...`

## Login

Navigate to `https://www.themoviedb.org/login`. Form fields:
- `#username` — username or email
- `#password` — password
- `#login_button` — submit button (also matches `input[type=submit]`)

**Use `page.type()` not `page.click()` for fields** — `page.click(selector)` throws `Runtime.callFunctionOn timed out` on TMDB's heavy login page before the cursor even lands. `page.type()` goes directly via CDP `Input.dispatchKeyEvent` and bypasses this.

```javascript
await page.type('#username', TMDB_USER, { delay: 60 });
await page.type('#password', TMDB_PW, { delay: 60 });
const loginBtn = await page.evaluate(() => {
  const btn = document.querySelector('#login_button') || document.querySelector('input[type=submit]');
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(loginBtn.x, loginBtn.y);
await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
```

---

## Resend verification email

If the activation email hasn't arrived (Proton restriction, spam, etc.):

1. Navigate to `https://www.themoviedb.org/resend_verification`
2. The form has a single `#email` field and a submit button
3. **Use `page.type()` not `input.value =` setter** — TMDB validates via keystroke events; the value setter leaves the field technically populated but the submit button stays disabled or the server rejects it
4. After submit, URL stays on `/resend_verification` and a "Verification Email Sent" message appears

```javascript
await page.goto('https://www.themoviedb.org/resend_verification', { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(2000);
await page.focus('#email');
await page.type('#email', TMDB_EMAIL, { delay: 80 });
await sleep(500);
const submitCoords = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button, input[type=submit]')]
    .find(b => b.getBoundingClientRect().width > 0);
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(submitCoords.x, submitCoords.y);
await sleep(3000);
// Success: URL remains /resend_verification, page text contains "Verification Email Sent"
```

---

## Requesting an API key

**Verified flow (2026-05-03)** — the old jQuery/Kendo dialog no longer exists.

1. Navigate to `https://www.themoviedb.org/settings/api/request`
2. The page shows "Register for an API key" with a **Yes** radio button — click it with `page.mouse.click()`
3. A modal appears with:
   - A **checkbox** to accept terms — click it (`input[type=checkbox]`, find by `getBoundingClientRect()`)
   - A **"Yes, this is for personal use"** button — find by text match, click with `mouse.click()`
4. Page navigates to `https://www.themoviedb.org/subscribe/developer`

```javascript
// Click the Yes radio/button
const yesCoords = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button, input[type=radio], a')]
    .find(e => e.innerText?.trim() === 'Yes' || e.value === 'Yes');
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(yesCoords.x, yesCoords.y);
await sleep(2000);

// Check the terms checkbox in the modal
const cbCoords = await page.evaluate(() => {
  const cb = document.querySelector('input[type=checkbox]');
  if (!cb) return null;
  const r = cb.getBoundingClientRect();
  return r.y > 0 ? { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) } : null;
});
if (cbCoords) await page.mouse.click(cbCoords.x, cbCoords.y);
await sleep(500);

// Click "Yes, this is for personal use"
const personalCoords = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button, a')]
    .find(e => e.innerText?.includes('personal use'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(personalCoords.x, personalCoords.y);
await page.waitForFunction(() => window.location.href.includes('subscribe/developer'), { timeout: 15000 });
```

## Developer form (after personal use confirmation)

URL after confirmation: `https://www.themoviedb.org/subscribe/developer`

Note: navigating directly to `/subscribe/developer` redirects to `/settings/api/request` — must go through the Yes button flow above.

Form field IDs (verified):
| Field | ID |
|---|---|
| Application Name | `#application_name` |
| Application URL | `#application_url` |
| Type of Use (select) | `#application_type` — use value `'Personal'` |
| Application Summary | `#application_summary` (textarea) |
| First Name | `#contact_first_name` |
| Last Name | `#contact_last_name` |
| Phone | `#contact_phone` |
| Address line 1 | `#business_address_1` |
| City | `#business_city` |
| State/Region | `#business_state` |
| Postal Code | `#business_postal_code` |
| TOS checkbox | `#tos-agreement` |

Use `page.evaluate()` bulk setter for all fields (fast, no timeout risk). Submit by clicking the "Subscribe" button — it may be below the viewport; `scrollIntoView({ block: 'center' })` before clicking.

## Extracting the API key

After subscribing, navigate to `https://www.themoviedb.org/settings/api`.

The API key is in a **`<textarea readonly>`** — NOT visible in `document.body.innerText`:
```javascript
// ✅ Correct
const key = await page.evaluate(() => document.querySelector('#v3_api_key')?.value);

// ❌ Wrong — returns null
const key = (await page.evaluate(() => document.body.innerText)).match(/[a-f0-9]{32}/)?.[0];
```

The key is 32 lowercase hex characters. Save to `.env` as `TMDB_API_KEY`.

## Gotchas

- **Cloudflare CAPTCHA on signup**: Appears after form submit. Script must pause and wait for the user to solve it manually. After solving, URL changes to `/confirm_email` — detect this and resume.
- **`protocolTimeout` must be 120000+**: TMDB pages can be heavy; keep `protocolTimeout: 120000` on the Puppeteer connect call.
- **Direct nav to `/subscribe/developer` doesn't work**: TMDB redirects back to `/settings/api/request`. Always go through the Yes → checkbox modal → "personal use" flow first.
- **Subscribe button below viewport**: With `defaultViewport: { height: 900 }`, the Subscribe button renders at y≈994. Use `scrollIntoView` or set viewport height to 1200.
- **Proton Mail onboarding panels**: On first login, Proton shows 4–5 sequential onboarding modals before the inbox is accessible. Dismiss each one before searching for the TMDB email.
- **Proton "unusual activity" restriction**: If the Proton account has been used to sign up for many third-party services, Proton's automated abuse detection blocks all incoming third-party registration emails. Fix: add and verify a recovery email address at `https://account.proton.me/u/0/mail/recovery` — after verification the restriction lifts and queued verification emails arrive.
- **`page.click(selector)` timeout on login/form pages**: Use `page.type(selector, value)` directly — bypasses `Runtime.callFunctionOn timed out` that `page.click()` throws on heavy TMDB pages.
- **API key is in a `<textarea readonly>`**: `document.body.innerText` doesn't expose it. Read with `page.evaluate(() => document.querySelector('#v3_api_key')?.value)` or take a screenshot.
