---
name: browser-fetch
description: Headless Puppeteer browser for fetching JavaScript-rendered pages or taking screenshots, with automatic CAPTCHA solving via 2Captcha. Use when web requests return blank content because the page requires JavaScript (Grab tracking, SPAs, dashboards) or hits a CAPTCHA wall (Cloudflare, reCAPTCHA, hCaptcha). Automatically detects and solves CAPTCHAs. Triggers on: open this link, read this page, screenshot this URL, page needs javascript, or when web_fetch returns blank/bot-check content.
---

# Browser Fetch

Headless Chromium (Puppeteer) with auto CAPTCHA solving via 2Captcha.

## CLI

```bash
node ~/.agents/skills/browser-fetch/src/cli.js <command> [args]
```

| Command | Usage | Returns |
|---------|-------|---------|
| `fetch` | `fetch <url>` | title, text (5000 chars max) |
| `screenshot` | `screenshot <url> [/path.png]` | path to PNG |
| `ping` | `ping` | alive/dead |

## CAPTCHA Solving
Automatically detects and solves: Cloudflare Turnstile, reCAPTCHA v2, hCaptcha.
Uses 2Captcha service (~$0.003/solve). API key at `~/.config/2captcha/api-key`.
Disable with: `{ "cmd": "fetch", "url": "...", "solveCaptcha": false }`

## Examples

```bash
# Fetch any page (auto-solves CAPTCHAs)
node ~/.agents/skills/browser-fetch/src/cli.js fetch "https://example.com"

# Screenshot
node ~/.agents/skills/browser-fetch/src/cli.js screenshot "https://example.com" "/tmp/out.png"
```

## Notes
- Waits for networkidle2 + 2s JS render
- Screenshots to `~/.agents/skills/browser-fetch/output/` if no path given
- For static HTML pages prefer web_fetch (faster)
