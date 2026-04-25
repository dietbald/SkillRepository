# Skill Repository

Custom Claude Code skills, shared across machines via git.

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

---

## Daily workflow

```bash
# Pull updates from another machine
cd C:\Repos\SkillRepository
git pull

# After editing a skill — commit and push
git add skills/ commands/
git commit -m "describe what changed"
git push
```

---

## What is NOT synced (set up manually per machine)

| Item | Where |
|---|---|
| Credentials & API keys | `skills/<SkillName>/.env` — never committed |
| puppeteer-core | Run `npm install puppeteer-core` inside each project that uses BrowserControl |
| ChromeDebug profile | Created on first Chrome launch at `C:\ChromeDebug` — log in to each site once |
| AWS credentials (gpu-task) | `~/.aws/credentials` and `~/gpu-runner/config.env` |
