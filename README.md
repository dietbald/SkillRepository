# Skill Repository

Custom Claude Code skills, shared across machines via git.

## Setup on a new machine

```powershell
# 1. Clone the repo
git clone https://github.com/dietbald/SkillRepository.git C:\Repos\SkillRepository

# 2. Link skills — junction so ~/.claude/skills points into the repo
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills" -Target "C:\Repos\SkillRepository\skills"

# 3. Copy commands into ~/.claude/commands (no junction — commands folder may have others)
Copy-Item "C:\Repos\SkillRepository\commands\*" "$env:USERPROFILE\.claude\commands\" -Force
```

> **Linux/macOS:** Use `ln -s ~/Repos/SkillRepository/skills ~/.claude/skills` and
> `cp ~/Repos/SkillRepository/commands/* ~/.claude/commands/` instead.
> Note: `gpu-task.md` was written on Windows — review paths and binary locations before use.

That's it. Claude Code will now load skills from the repo.

## Daily workflow

```bash
# Pull latest skills from another machine
cd C:\Repos\SkillRepository
git pull

# After editing a skill — commit and push
git add skills/
git commit -m "update BrowserControl: add Stripe site knowledge"
git push
```

## Credentials (.env files)

Each skill can have a `.env` file for credentials and API keys.  
`.env` files are in `.gitignore` — **they are never committed**.  
You must create them manually on each machine.

Template for `skills/BrowserControl/.env` is in `skills/BrowserControl/sites/_template.md`.
