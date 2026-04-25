# Skill Repository

Custom Claude Code skills and slash-commands, shared across machines via git.

---

## Setting up on a new machine

Just paste this prompt into Claude Code:

```
Set up my SkillRepository on this machine. Clone https://github.com/dietbald/SkillRepository.git
into C:\Repos\SkillRepository (Windows) or ~/Repos/SkillRepository (Linux/macOS), then link
the skills folder into ~/.claude/skills and copy the commands into ~/.claude/commands.
After setup, tell me which .env files I need to create manually and what keys go in each.
```

Claude will handle the clone, junction/symlink, and command copy automatically, then tell you exactly what credentials to fill in.

> **Important:** Two skills (`llm-council`, `openclaw-workspace`) are git **submodules** of upstream third-party repos. If you clone manually, use `--recurse-submodules`:
>
> ```bash
> git clone --recurse-submodules https://github.com/dietbald/SkillRepository.git
> # or, after a plain clone:
> cd SkillRepository && git submodule update --init
> ```
>
> Otherwise those two folders will be empty.

---

## What's inside

### Skills (`skills/`)

| Skill | What it does |
|---|---|
| `BrowserControl` | Drive Chrome via Puppeteer + a remote debug port. Per-site knowledge in `sites/*.md`. Credentials in `.env` (gitignored). |
| `browser-pilot` | Validate step-by-step user guides by executing them in a real browser, generating screenshots and error reports. |
| `browser-fetch` | Headless Puppeteer for JS-rendered pages or pages behind CAPTCHAs. Falls back to 2Captcha when needed. |
| `2captcha-cli` | Solve CAPTCHAs (reCAPTCHA, hCaptcha, Cloudflare Turnstile, image, FunCaptcha, GeeTest, AWS WAF) via 2Captcha. API key at `~/.config/2captcha/api-key`. |
| `youtube-transcript` | Pull transcripts from YouTube videos. |
| `openclaw-docs` | Full OpenClaw documentation reference (12 reference files: install, channels, gateway, security, multi-agent, mobile nodes, troubleshooting, ...). |
| `openclaw-workspace` *(submodule)* | OpenClaw workspace file maintenance — AGENTS.md, TOOLS.md, SOUL.md, etc. token budget audits, distillation. Upstream: [`win4r/openclaw-workspace`](https://github.com/win4r/openclaw-workspace). |
| `llm-council` *(submodule)* | Run a question through 5 AI advisors who anonymously peer-review each other and synthesize a final verdict. Karpathy's LLM Council pattern. Upstream: [`tenfoldmarc/llm-council-skill`](https://github.com/tenfoldmarc/llm-council-skill). |
| `logopedist-be` | Belgian speech-language therapist domain knowledge — RIZIV/INAMI nomenclature, eHealth/MyCareNet, regional rules (VAPH, AVIQ, COCOM…), GDPR, tax. For halingo.be work. |
| `odoo-v19-guide.md` | Odoo v19 Online (SaaS) customization expert. Single-file skill. |
| `ollama-runner.md` | Local Ollama model runner. |
| `uncodixfy.md` | Strip ChatGPT-/AI-tells from text (em-dashes, hedging, "delve", etc.). |

### Commands (`commands/`)

| Command | What it does |
|---|---|
| `/gpu-task` | Run heavy jobs (Whisper, Tesseract, ffmpeg) on an AWS GPU/CPU spot instance. Auto-warm queue, auto-terminate when idle. |
| `/reflect` | BrowserControl post-session self-improvement: distill site-specific learnings back into `sites/<name>.md`. |
| `/person-intel` | Build an OSINT report on a person, company, entity, or political figure. |
| `/sharepoint` | Access SharePoint files via the Microsoft Graph API. |

---

## Daily workflow

```bash
# Pull updates from another machine
cd ~/Repos/SkillRepository       # or  cd C:\Repos\SkillRepository
git pull --recurse-submodules

# After editing a skill — commit and push
git add skills/ commands/
git commit -m "describe what changed"
git push
```

---

## What is NOT synced (set up manually per machine)

| Item | Where |
|---|---|
| Credentials & API keys | `skills/BrowserControl/.env` — never committed |
| 2Captcha API key | `~/.config/2captcha/api-key` — single line |
| `puppeteer-core` | `npm install puppeteer-core` inside each project that uses BrowserControl |
| ChromeDebug profile | First Chrome launch creates `C:\ChromeDebug` (Windows) or `~/.chromedebug` (Linux/macOS) — log in to each site once |
| AWS credentials (gpu-task) | `~/.aws/credentials` and `~/gpu-runner/config.env` |
| `chromedebug-start` helper (Linux) | Created at `~/bin/chromedebug-start` — wraps Chromium launch with Xvfb auto-start |
