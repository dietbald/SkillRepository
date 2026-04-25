# BrowserControl Reflect — Self-Improvement After a Session

Analyse the current session for errors, retries, and workarounds, then update the BrowserControl skill so the same mistakes are never repeated.

Run this at the end of any BrowserControl session, or any time the user says "update the skill", "remember that", or "add that to the skill".

---

## Step 1 — Collect session evidence

Look back through the current conversation for:
- Any error messages that were thrown (`ERROR:`, `Error:`, `Cannot find`, `Timed out`, `Execution context destroyed`, etc.)
- Any approach that was tried and then abandoned or retried differently
- Any time the user corrected the approach ("no, do it this way", "that's wrong", "try X instead")
- Any workaround that had to be discovered through trial and error
- Any assumption that turned out to be false

List each finding as: **[what failed]** → **[what worked instead]**

---

## Step 2 — Check coverage in skill.md

Read `~/.claude/skills/BrowserControl/skill.md`.

For each finding from Step 1, answer:
- Is this failure mode already documented?
- Is the correct solution already shown?
- Is the WHY explained (so future Claude doesn't have to rediscover it)?

Mark each finding as: ✅ already covered | ❌ missing | ⚠️ partially covered

---

## Step 3 — Check coverage in the site knowledge file

Read `~/.claude/skills/BrowserControl/sites/<sitename>.md` (whichever site was worked on).

For each finding:
- Is this site-specific behaviour documented?
- Are the working selectors, click techniques, URL patterns recorded?
- Are edge cases (voided items, expired links, no-op buttons) noted?

---

## Step 4 — Update what's missing

**For each ❌ or ⚠️ finding:**

If it's a general Puppeteer/Chrome technique → update `skill.md`.
If it's specific to this site → update `sites/<sitename>.md`.
If it involves credentials → update `.env`.

Rules for writing updates:
- Lead with the **rule** (what to do), not the story of what went wrong
- Add a one-line **why** so future Claude understands the reason, not just the rule
- Include a working code snippet where relevant
- Keep it concise — no paragraph explanations, no session-specific references ("in this session we found...")

---

## Step 5 — Commit to the SkillRepository

```bash
cd C:/Repos/SkillRepository
git add skills/ commands/
git commit -m "reflect: <short summary of what was learned>"
git push
```

The commit message should name the concrete learnings, e.g.:
- `reflect: add domcontentloaded rule for OAuth redirect pages`
- `reflect: document Download PDF button useless in Puppeteer, use page.pdf()`
- `reflect: fix Chrome launch to use PowerShell Start-Process on Windows`

---

## Step 6 — Report to the user

Give a brief summary:
- How many issues were found
- Which were already covered vs. newly added
- What files were updated
- Confirm the commit was pushed
