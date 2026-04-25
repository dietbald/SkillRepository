---
name: 2captcha-cli
description: Solve CAPTCHAs programmatically using the 2Captcha human-powered service. Use when web automation hits CAPTCHA walls (reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile, image CAPTCHAs, FunCaptcha, GeeTest, Amazon WAF). Also wired into browser-fetch for automatic CAPTCHA bypass. API key stored at ~/.config/2captcha/api-key.
---

# 2Captcha CLI

Solves CAPTCHAs via 2Captcha human workers.

## Binary
```
/home/tj/.agents/skills/2captcha-cli/solve-captcha
```

## Config
- API key: `~/.config/2captcha/api-key`
- Balance: `python3 solve-captcha balance`

## Key Commands
```bash
CAPTCHA=/home/tj/.agents/skills/2captcha-cli/solve-captcha

# Check balance
python3 $CAPTCHA balance

# Image CAPTCHA
python3 $CAPTCHA image /path/to/captcha.png

# reCAPTCHA v2
python3 $CAPTCHA recaptcha2 -s <sitekey> -u <url>

# Cloudflare Turnstile
python3 $CAPTCHA turnstile -s <sitekey> -u <url>

# hCaptcha
python3 $CAPTCHA hcaptcha -s <sitekey> -u <url>
```

## Auto-wired
browser-fetch automatically calls this when it detects a CAPTCHA page.
Pass `"solveCaptcha": true` (default) in the fetch/screenshot command.

## Cost
~$0.001 image · ~$0.003 reCAPTCHA/hCaptcha/Turnstile
Current balance: $0.90
