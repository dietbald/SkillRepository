# Slack — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Workspace IDs, member emails,
     and primary-owner addresses belong in .env only. -->

## Status: ⚠️ Partially blocked — extraction works only on workspaces where the user is a member with billing access

## Task
Download invoice PDFs for a Slack workspace's billing history.

## Portal URL
`https://app.slack.com/admin/<workspace-id>/billing/history`
(Workspace IDs look like `T034EFLJH8E` — the leading `T` denotes a team/workspace.)

## Login
- Method: Slack account that is a **member of the target workspace** with billing visibility (Primary Owner / Owner / Admin, depending on workspace setup)
- Credentials in `.env` under `SLACK_*`
- Sign-in via the standard Slack login flow; OTP/email-magic-link is common

## Flow
1. Sign in to Slack and confirm membership in the target workspace
2. Navigate to `https://app.slack.com/admin/<workspace-id>/billing/history`
3. The page lists invoices with download links — `mouse.click()` each link to capture the PDF
4. Save as `Slack_{invoiceId}_{YYYY-MM-DD}.pdf`

## Document format
PDF — direct download from the billing history page

## File naming
`Slack_{invoiceId}_{YYYY-MM-DD}.pdf`

## Known edge cases
- **A business may have multiple Slack workspaces over its lifetime**: e.g. a Free workspace today, plus a separate paid workspace from a previous year that was downgraded or wound down. The current Primary Owner may not be a member of the historical paid workspace at all.
- **Free-plan workspaces have no billing history** — the page returns Slack's generic "There's been a glitch" error.
- **Workspace deletion vs downgrade**: Slack preserves billing history after workspace termination, but only members of that workspace can view it through the UI. After deletion, the invoices are only retrievable via support.

## Gotchas
- **Wrong workspace = "There's been a glitch"**: this is Slack's misleading error for "you're not a member of this workspace" or "this workspace has no billing history". Confirm membership in the right workspace before assuming the script is broken.
- **Workspace ID confusion**: the workspace name displayed in the UI ("Autopilot", "Engineering", etc.) is not unique across Slack — multiple workspaces can share a name. Always use the workspace ID (`T...`) from the URL.
- **OAuth re-auth**: signing into a workspace from the user's account dashboard sometimes requires confirming a one-time code from email; allow ~2 min in `ensureLoggedIn`.

## Support email fallback
When the user no longer has access to the historical paid workspace:
- **To**: `feedback@slack.com`
- **Subject**: Request for invoice copies — workspace `<workspace-id>`, `<YYYY-MM>`
- Provide the workspace ID (`T...`), the approximate charge dates and amounts, and the email of the original Primary Owner if known. Slack support has retrieved invoices from terminated workspaces in the past.

## How to re-extract
1. Sign into the Slack account that is a member of the target workspace
2. Navigate to `https://app.slack.com/admin/<workspace-id>/billing/history`
3. Click each invoice's download link, save as PDF
4. If "There's been a glitch" appears, the user is not in the right workspace — fall back to support email
