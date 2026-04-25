# Skill Repository

Custom Claude Code skills, shared across machines via git.

## Setup on a new machine

```bash
# 1. Clone the repo
git clone https://github.com/dietbald/SkillRepository.git C:\Repos\SkillRepository

# 2. Back up existing skills folder if any
mv ~/.claude/skills ~/.claude/skills.bak   # skip if it doesn't exist

# 3. Create a junction so ~/.claude/skills points into the repo
#    Run in Command Prompt (not PowerShell) or use the PowerShell equivalent below
mklink /J "C:\Users\<YourUser>\.claude\skills" "C:\Repos\SkillRepository\skills"

# PowerShell equivalent:
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills" -Target "C:\Repos\SkillRepository\skills"
```

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
