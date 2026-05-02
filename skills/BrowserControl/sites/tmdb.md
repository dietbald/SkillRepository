# TMDB — The Movie Database

**Status:** Verified 2026-05-02 — full signup + API key acquisition flow confirmed working.

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

## Requesting an API key

1. Navigate to `https://www.themoviedb.org/settings/api/request`
2. The page shows "Register for an API key" with a **Yes** button
3. The Yes button uses jQuery delegated events — `data-function="openConfirmDialog()"` — and does NOT respond to `mouse.click()` or `dispatchEvent`:
   ```javascript
   await page.evaluate(() => $('[data-function="openConfirmDialog()"]').trigger('click'));
   ```
4. Wait **10–12 seconds** — the dialog loads via async `import('/kendo.dialog.js').then(...)`:
   ```javascript
   await sleep(12000);
   ```
5. A Kendo UI dialog appears with:
   - A **checkbox** to accept terms — must be checked first (coordinates vary; find by `input[type=checkbox]` with y > 400)
   - A **"Yes, this is for personal use"** button — find by exact text match, click with `mouse.click()`

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
- **`protocolTimeout` must be 60000+**: The async Kendo dialog import + form fill can exceed the default 30s CDP timeout.
- **Direct nav to `/subscribe/developer` doesn't work**: TMDB redirects back to `/settings/api/request`. Always trigger the Yes→Kendo→personal use flow first.
- **Subscribe button below viewport**: With `defaultViewport: { height: 900 }`, the Subscribe button renders at y≈994. Use `scrollIntoView` or set viewport height to 1200.
- **Proton Mail onboarding panels**: On first login, Proton shows 4–5 sequential onboarding modals before the inbox is accessible. Dismiss each one before searching for the TMDB email.
