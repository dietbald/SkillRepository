# Cock.li — BrowserControl Knowledge

**Status:** Verified 2026-05-03 — login, inbox read, email body text extraction confirmed working.

## Overview

Cock.li is a free, privacy-focused email provider offering aliases at domains like `airmail.cc`, `cock.li`, `cumallover.me`, etc. Webmail is at `https://mail.cock.li`. Useful as a recovery or alias email for test personas that need a separate address from their Proton account.

Credentials in `.env` (no standard key prefix — add per persona):
- E.g. `TEST_CANDIDATE2_COCKLI_EMAIL=username@airmail.cc`
- E.g. `TEST_CANDIDATE2_COCKLI_PASSWORD=...`

---

## Login

URL: `https://mail.cock.li`

Form fields:
- `#rcmloginuser` — username (full email address)
- `#rcmloginpwd` — password
- `#rcmloginsubmit` — login button

```javascript
await page.goto('https://mail.cock.li', { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(2000);
await page.type('#rcmloginuser', COCKLI_EMAIL, { delay: 60 });
await page.type('#rcmloginpwd', COCKLI_PASSWORD, { delay: 60 });
const btn = await page.evaluate(() => {
  const el = document.querySelector('#rcmloginsubmit');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(btn.x, btn.y);
await page.waitForFunction(() => !window.location.href.includes('_task=login'), { timeout: 15000 });
```

---

## Reading emails — CRITICAL: all `<a>` tags have empty `href`

Cock.li's webmail (Roundcube) is **fully JavaScript-navigated** — every `<a>` tag in the message list has an empty or `#` `href`. You **cannot** navigate by clicking links programmatically with `page.evaluate(() => el.click())` in the usual way.

**Open an email by DOM coordinates:**

Email rows use a `[data-element-id]` attribute. Find rows, get their `getBoundingClientRect()`, and click with `page.mouse.click()`.

```javascript
// List all email rows visible in the inbox
const rows = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-element-id]')].map(e => {
    const r = e.getBoundingClientRect();
    return {
      id: e.getAttribute('data-element-id'),
      text: e.innerText?.substring(0, 200).replace(/\n/g, ' '),
      x: Math.round(r.x + r.width/2),
      y: Math.round(r.y + r.height/2)
    };
  });
});

// Find the row you want by text content
const target = rows.find(r => r.text?.includes('TMDB') || r.text?.includes('Movie Database'));
if (!target) throw new Error('Email not found in inbox');

await page.mouse.click(target.x, target.y);
await sleep(4000);  // wait for email to load in the reading pane
```

**Note on y=0**: After programmatic navigation, `getBoundingClientRect()` may return `y=0` for all rows even when they're visible at the top of the viewport. Clicking at `(x, 0)` still works because the rows genuinely start near y=0. This is not a blocking issue.

---

## Reading email body text

Unlike Proton, cock.li renders the email body in the main page DOM (not an iframe). Use `document.body.innerText` directly.

```javascript
const bodyText = await page.evaluate(() => document.body.innerText);

// Extract URLs from the email body
const urls = bodyText.match(/https?:\/\/\S+/g) || [];
console.log('URLs found:', urls);
```

**Finding a specific verification URL:**

```javascript
// Example: extract a Proton account verification URL
const protonUrl = bodyText.match(/https?:\/\/account\.proton\.me\/[^\s\n]+/)?.[0];
if (protonUrl) {
  const cleanUrl = protonUrl.replace(/[.,;)]+$/, '');  // strip trailing punctuation
  await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
}
```

---

## Gotchas

- **All `<a>` hrefs are empty**: Cock.li Roundcube client uses JavaScript event listeners, not `href` attributes, for all navigation. Never try `page.evaluate(() => el.href)` to get a link — it will return `''` or `'#'`. Extract URLs from `document.body.innerText` instead.
- **`[data-element-id]` for email rows**: This is the reliable selector. `tr.message` or `li.message` selectors from older Roundcube versions may not work on this installation.
- **Email body in main frame, not iframe**: Unlike Proton, no iframe traversal needed. `page.evaluate()` on the main page sees the full email content.
- **No onboarding modals**: Cock.li has no first-login overlay. The inbox is immediately accessible after login.
- **URL sanitization**: URLs extracted from `document.body.innerText` may have trailing punctuation (`.`, `,`, `)`) from the email sentence context. Strip with `.replace(/[.,;)]+$/, '')`.
