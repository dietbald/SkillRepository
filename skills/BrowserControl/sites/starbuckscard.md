# Starbucks Card Philippines (starbuckscard.ph)

Status: verified 2026-05-02 — sign-in + scrape star/balance/rewards from the home dashboard.

Credentials in `.env`:
- `STARBUCKS_PH_EMAIL`
- `STARBUCKS_PH_PASSWORD`

## Egress requirement (CRITICAL)

The site is fronted by Azure Front Door with regional WAF rules. Direct requests from European/Asian datacenter IPs return **HTTP 403** with body `"The request is blocked"` — before any JS or bot-fingerprinting kicks in. Confirm with `curl -I https://starbuckscard.ph/sbcard/signin` from the same egress.

Empirically (webshare datacenter pool, 2026-05): **US passes (200), GB blocks (403), JP blocks (403)**. Run the proxy probe loop in skill.md → "Site returns 403 …" before assuming a bot-detection problem.

Launch a dedicated Chrome on `:9223` through a US webshare proxy with its own profile (`~/.chromedebug-proxy`) — don't share `--user-data-dir` with the main `:9222` instance.

## Sign in

URL: `https://starbuckscard.ph/sbcard/signin`

Form (no iframes, plain HTML):
- `input#email` (type=email, name=email)
- `input#password` (type=password, name=password)
- Hidden `input[name="_token"]` (Laravel CSRF — auto-included on submit)
- `input#submitButton` (type=submit, value="Sign In")

A cookie banner with `button: "I Agree"` covers the page on first load — dismiss before filling.

reCAPTCHA v2 (sitekey starts with `6Le...`) is **always rendered** on the signin form. Solve with 2captcha and inject the token (recipe in skill.md → "reCAPTCHA v2 on a login form"). Token must be in `textarea[name="g-recaptcha-response"]` before clicking submit.

After successful submit, page navigates to `https://starbuckscard.ph/sbcard/home`.

## Scraping the dashboard

The home page renders all the data plain-text into the body — no API call needed, just `page.evaluate(() => document.body.innerText)`. Layout (line-by-line, in order):

```
Good afternoon, <FirstName>! ☀️
STAR BALANCE
<starCount>
<starsToReward>
to a Reward
20
40
60
80
100
View History
…
Default Card
₱<balance>
as of <Mon DD, YYYY hh:mm AM/PM>
**** **** **** <last4>
…
REWARDS AND BENEFITS
…(promos)…
Free Drink or Food Reward          ← repeated 1× per redeemable
Get a free drink, pastry or slice of cake for every 100 Stars earned.
VALID UNTIL YYYY/MM/DD hh:mmAM
```

Counting `Free Drink or Food Reward` occurrences = number of redeemables. Each is followed by a `VALID UNTIL` line for the expiry.

Quick parser:
```javascript
const text = await page.evaluate(() => document.body.innerText);
const lines = text.split('\n').map(s => s.trim());
const stars     = lines[lines.indexOf('STAR BALANCE') + 1];
const cardLine  = lines.find(l => /^₱[\d,]+\.\d{2}$/.test(l));
const rewards   = lines.filter(l => l === 'Free Drink or Food Reward').length;
const expiries  = lines.filter(l => l.startsWith('VALID UNTIL '));
```

## Gotchas

- **Star balance line is just the number** (e.g. `25`) — no symbol, no label on the same line. Use the index trick above.
- The card balance line appears twice on the page (once in the card hero, once in the expanded card panel) — `.find()` is fine, you only need one.
- The "Reward" thresholds (20/40/60/80/100) appear as separate lines and look like data — ignore them.
- Session is fragile across egress IPs: if you log in via proxy A and resume the saved profile on proxy B, the WAF kills the session. Pin one proxy per profile.
