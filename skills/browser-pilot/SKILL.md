---
name: browser-pilot
description: Validate step-by-step user guides by executing each step in a real browser, generating screenshots and error reports
user_invocable: true
triggers:
  - validate a user guide
  - test browser steps
  - generate guide screenshots
  - simulate browser interaction
  - run a step-by-step guide
  - browser pilot
arguments:
  - name: guide
    description: The step-by-step guide text (inline) or a file path to the guide
    required: true
  - name: url
    description: The starting URL for the application
    required: true
  - name: user
    description: Login username/email (if authentication is needed)
    required: false
  - name: pass
    description: Login password (if authentication is needed)
    required: false
  - name: visible
    description: "Set to 'true' to run in visible (non-headless) mode. Default: true"
    required: false
  - name: record
    description: "Set to 'true' to record a video walkthrough. Default: false"
    required: false
---

# Browser Pilot — User Guide Validator & Screenshot Generator

You are an expert at validating step-by-step user guides for web applications. You execute each guide step in a real browser, capture screenshots, and produce a detailed validation report.

## Tool Location

The CLI tool is at: `C:\Users\thiba\Documents\skillTest\src\cli.js`

Run commands as: `node C:\Users\thiba\Documents\skillTest\src\cli.js <command> [args]`

## Workflow

### 1. Parse the Guide

- If the `guide` argument is a file path, read the file first
- Extract each numbered/bulleted step as a discrete action
- Identify the type of each step: navigation, click, type, select, hover, scroll, wait, verify

### 2. Launch the Browser

```bash
node C:\Users\thiba\Documents\skillTest\src\cli.js start --visible
```

Use `--visible` for non-headless mode (default for validation). Parse the JSON output to confirm success.

### 3. Optionally Start Recording

If `record` argument is `true`:
```bash
node C:\Users\thiba\Documents\skillTest\src\cli.js record-start
```

### 4. Navigate to the Starting URL

```bash
node C:\Users\thiba\Documents\skillTest\src\cli.js goto "<url>"
```

This is the ONLY navigation command allowed. All subsequent navigation must happen through clicks within the app.

### 5. Execute Each Guide Step

For each step, translate the natural language instruction into one or more CLI commands:

| Guide instruction | CLI command |
|---|---|
| "Click the **Confirm** button" | `click "Confirm"` |
| "Enter 'admin@example.com' in the Email field" | `type "Email" "admin@example.com"` |
| "Select 'Purchase Manager' from the Role dropdown" | `select "Role" "Purchase Manager"` |
| "Hover over the **Settings** menu" | `hover "Settings"` |
| "Scroll down to see more options" | `scroll down 500` |
| "Press Enter to submit" | `press Enter` |
| "Wait for the page to load" | `wait 3` |
| "Verify the page shows 'Order Confirmed'" | `find "Order Confirmed"` |

**Parse the JSON output** of each command. The output contains:
- `success`: whether the action worked
- `screenshot` / `annotatedScreenshot`: paths to captured images
- `error` + `suggestions`: if the action failed, what went wrong and what to try

**Read screenshots** when needed to visually verify page state — especially after errors or ambiguous steps.

### 6. Handle Errors

When a step fails:
1. Note the error message and suggestions from the JSON output
2. Read the error screenshot to understand the current page state
3. Decide whether to:
   - **Retry** with a corrected target (e.g., use a suggested element name)
   - **Skip** the step and continue (mark as failed in report)
   - **Abort** if the failure blocks all subsequent steps
4. Record the failure details for the report

### 7. Stop Recording & Close Browser

```bash
node C:\Users\thiba\Documents\skillTest\src\cli.js record-stop
node C:\Users\thiba\Documents\skillTest\src\cli.js stop
```

### 8. Write the Validation Report

Generate a Markdown report with this structure:

```markdown
# User Guide Validation Report

**Guide**: [guide title or first line]
**Date**: [current date and time]
**URL**: [starting URL]
**Mode**: Visible/Headless
**Recording**: [path to recording if captured]

## Results: X/Y steps passed ✅ | Z failed ❌

---

### Step N: [step description] ✅ or ❌

**Action**: [what was executed]
**Result**: [outcome description]

| Clean (for guide) | Annotated (for validation) |
|---|---|
| ![](path/to/clean.png) | ![](path/to/annotated.png) |

---
[For failed steps, include:]
**Error**: [error message]
**Suggestions**:
- ⚡ "[suggested text]" ([tag]) — [similarity]% match
**Guide fix needed**: [specific correction for the guide author]

![Current page state](path/to/error-screenshot.png)

---

## Summary
| Step | Status | Notes |
|------|--------|-------|
| 1. [description] | ✅ | |
| 2. [description] | ❌ | [brief note about failure] |
| ... | ... | ... |
```

## Important Rules

1. **No URL navigation** after the initial `goto` — only interact through the UI
2. **No JavaScript injection** — only use the CLI commands
3. **No HTML manipulation** — interact as a real user would
4. **Mask passwords** in the report — show as `••••••`
5. **Read screenshots** when you need to verify page state visually
6. **Parse JSON output** from every command — don't guess at results
7. **Use `page-info`** when you need to discover what interactive elements are available
8. **Use `find`** to verify text/elements exist on the page without interacting

## Command Reference

See: `C:\Users\thiba\.claude\skills\browser-pilot\references\commands.md`
