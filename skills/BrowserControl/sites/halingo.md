# Halingo (dev.app.halingo.be)

**Status:** Phase A discovery completed 2026-05-08. Login + signup form structure verified. Phases B-F pending.

Halingo is a Belgian SaaS for logopedists (speech therapists) — patient management, agenda, RIZIV billing, eAttest/eFact, treatment plans, bilans. Stack: React (uses `react-select` for dropdowns), embeds Stripe (billing) + Segment (`ajs_*` cookies) + GA + Zendesk launcher + Facebook Pixel.

**Hard rule — STAGING ONLY.** Always `https://dev.app.halingo.be`. Production `https://halingo.be` is forbidden — it would corrupt real customer data and trigger real RIZIV billing.

## Chrome launch (always 1920×1080)

Halingo is a B2B desktop SaaS. Launch Chrome at full HD so screenshots match what real therapists see:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="C:\\ChromeDebug" \
  --window-size=1920,1080 \
  --window-position=0,0 \
  "https://dev.app.halingo.be/" &
```

Verify the actual viewport (window chrome eats ~135px on Windows):
```bash
node ~/.claude/skills/BrowserControl/eval.js --filter halingo "({w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio})"
```
Expect `{w: 1920, h: ≈945, dpr: 1}`.

## URL map

| Path | Purpose |
|---|---|
| `/` | Login page (redirect target after logout) |
| `/login` | Same as `/` — login form |
| `/register` | Signup form |
| `/forgot` | Password reset request |
| `/ToC` | Terms of service / gebruiksvoorwaarden |

Other routes will be discovered post-login in Phase D.

## Login page (`/`)

Pure email + password — **no eID, no itsme, no magic-link**, no captcha visible (may appear after N failed attempts; not yet probed).

Form structure (verified via `inspect.js`):
- `input[name="email"]` placeholder *"Vul je e-mailadres in"*
- `input[name="password"]` placeholder *"Vul je wachtwoord in"*
- `<button type="submit">` text *"AANMELDEN"* (Dutch for Sign in)
- Links: *"Nog geen account?"* → `/register` · *"Wachtwoord vergeten?"* → `/forgot`

Default locale on login is Dutch (NL-BE) — `<html>` has no `lang` attribute, locale is determined post-login from the user profile setting.

Login flow (Wicket-style typing isn't needed — Halingo is React, dispatch-event setter works):
```javascript
await page.evaluate((email, pwd) => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set('input[name="email"]', email);
  set('input[name="password"]', pwd);
}, EMAIL, PASSWORD);
await page.click('button[type="submit"]');
```
If that fails (e.g. React's controlled input rejects raw `value=`), fall back to `page.click(sel,{clickCount:3}); page.type(sel, val, {delay: 40})`.

## Signup page (`/register`)

Form fields (verified via `inspect.js`):
- `input[name="email"]` — placeholder *"Vul je e-mailadres in"*
- `input#react-select-2-input` — **language picker (react-select)**, not country/profession. Default *"Nederlands"*. Other option observed: *"Français"*. To pick Français, click the field, then click the option:
  ```javascript
  await page.click('#react-select-2-input');
  await new Promise(r => setTimeout(r, 500));
  // The dropdown opens; click the option by text
  await page.evaluate(() => {
    const opt = [...document.querySelectorAll('div[id^="react-select-2-option"]')]
      .find(d => /Français|Frans/i.test(d.innerText));
    if (opt) opt.click();
  });
  ```
- `input[name="password"]` — placeholder *"Vul je wachtwoord in"*
- `input[name="confirmPassword"]` — placeholder *"Herhaal je wachtwoord"*
- `input[type="checkbox"]` — Terms acceptance: *"Ik heb de gebruiksvoorwaarden gelezen en goedgekeurd"*. **Required** — submit will fail if unchecked. Use `el.click()` (not `el.checked = true`), since React listens for the change event.
- `<button type="submit">` text *"REGISTREER"*

After REGISTREER: expect a confirmation email to the entered address. Retrieve via the existing Proton recipe (`sites/proton.md`). Verification link probably routes back to a "complete your profile" page.

## Embedded third-party iframes (always present)

- `iframe[name^="__privateStripeMetricsController"]` — Stripe.js metrics on every page
- `iframe[id="launcher"]` — Zendesk help-launcher (the floating "?" widget); occupies a fixed position bottom-right and may overlap CTAs at smaller viewports
- `iframe[src="about:blank"]` — likely Stripe's hidden iframe parent

When using `inspect.js` always pass `--filter halingo` to avoid getting Stripe iframes as the inspected page.

## Tracking cookies on first load

`__stripe_mid`, `_gid`, `_ga_*`, `ajs_anonymous_id`, `ajs_user_id` (Segment), `ajs_group_id`, `__zlcmid` (Zendesk), `_fbp` (Facebook Pixel). Auth cookies will land after login — to be captured in Phase B.

## Test accounts

In `~/.claude/skills/BrowserControl/.env`:
- `TEST_CANDIDATE2_EMAIL` / `TEST_CANDIDATE2_PASSWORD` → display name **Nele Van den Broeck**, locale NL, role: practice owner. (User: Liam Castillo Proton inbox)
- `TEST_CANDIDATE_EMAIL`  / `TEST_CANDIDATE_PASSWORD`  → display name **Sophie Dubois**, locale FR, role: invited member. (User: Marcus Whitfield Proton inbox)

Confirmation emails arrive in those Proton inboxes. Use the existing `sites/proton.md` recipe to fetch verification links.

## Cleanup-identifier strategy (no synthetic prefix)

Display data is fully realistic (no `_BC_` prefix). Cleanup is via `manifest.json` written during the test run:
- Therapist accounts identified by Proton email (`*.proton.me`).
- Practice + patients + treatments + invoices scoped to those accounts.
- The manifest in `C:/Repos/halingo_uat_2026-05-08/manifest.json` lists every entity created with its in-app ID and creation timestamp; cleanup walks it in reverse.

## Pitfalls

- **`<html>` has no `lang` attribute.** Don't infer locale from that — read the user profile via `eval.js` after login.
- **`react-select` dropdowns** require click-then-click-option (see signup snippet). Setting `value` on the hidden input does nothing.
- **Stripe metrics iframe** generates background traffic on every page. When using CDP `Fetch` interception for downloads, scope `urlPattern` tightly (e.g. `*/api/*`) so the Stripe traffic doesn't dominate.
- **Zendesk launcher** is `position: fixed` and can overlap CTAs at the bottom-right of the viewport. If a click at the visible coordinates does nothing, the launcher iframe may be capturing it — scroll the target up first or hide the launcher with `document.getElementById('launcher').style.display='none'`.
- **No CAPTCHA observed yet** but signup may gate after repeat attempts from the same IP. If signup hangs with no error, take a `screenshot.js` and inspect for a Cloudflare/hCaptcha frame.

## Status by phase

- ✅ Phase A — login + signup structure captured, recipe written
- ⏳ Phase B — signup of Nele Van den Broeck (TEST_CANDIDATE2)
- ⏳ Phase C — practice setup
- ⏳ Phase D — 113-feature tour
- ⏳ Phase E — Belgian regulatory probes
- ⏳ Phase F — reporting + commit

Working directory for outputs: `C:/Repos/halingo_uat_2026-05-08/`
