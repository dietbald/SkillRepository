---
name: odoo-changeset
description: "Author an Odoo customization (BICC, IGEBC, or any other TJ-owned Odoo instance) as a changeset that CI deploys automatically. Use this skill whenever the user asks to add, change, or fix anything in an Odoo instance — a view, a website page, a server action, a cron, an automated action, a custom field, a menu, a record. You author files only in `changesets/<NNN>_<name>/` inside the instance repo (default `~/claw/BiccOdoo/`), push to an `ai/*` branch, and CI handles validate + deploy-dev + audit + rollback. You never run odoo-deploy locally, never trigger promote-staging/promote-prod, never edit workflows or anything outside `changesets/`. For Odoo-side rules (safe_eval surface, fields that exist, datetime quirks) defer to /odoo-v19-guide."
---

# Odoo Changeset Author — author + push, CI does the rest

You are authoring an Odoo customization for one of TJ's instance repos (default: **BiccOdoo** — covers BICC + IGEBC shared Odoo at `~/claw/BiccOdoo/`). The instance repo's CI pipeline handles deployment, verification, audit, and rollback automatically. **You only write changeset content and push to an `ai/*` branch — never run deploys, never touch staging or production.**

User's request: $ARGUMENTS

---

## What you do, in one sentence

Create a `changesets/<NNN_short_name>/` folder with a `manifest.yaml` + referenced content files, then push it on an `ai/*` branch. CI takes over.

---

## Where you work

Default instance repo: `~/claw/BiccOdoo/`
Other instance repos (ContourOdoo, etc.) have identical structure — just substitute the path. Always confirm the right repo with the user before starting if it's ambiguous.

### Allowed write surfaces (only these)

```
changesets/<NNN_short_name>/manifest.yaml          required
changesets/<NNN_short_name>/*.xml                  referenced by ops via arch_file:
changesets/<NNN_short_name>/*.py                   referenced by ops via code_file:
changesets/<NNN_short_name>/README.md              optional human notes
config/blocklist/*.txt                             optional — entries that TIGHTEN what AI can author
```

### Forbidden paths (CI guard will reject your push if you touch any of these)

| Path | Why |
|------|-----|
| `.github/workflows/` | CI logic. Never. |
| `config/` (except `config/blocklist/`) | Instance config — TJ owns this. |
| `audits/staging/` + `audits/production/` | Deployment evidence — promotion gate would be bypassable. |
| `rollback_snapshots/staging/` + `rollback_snapshots/production/` | Recovery evidence — tampering breaks rollback. |
| `baseline/` | Drift-detection reference — only the export-baseline workflow writes here. |
| Any file outside `changesets/` (other than a blocklist edit) | Not your surface. |

If a task seems to require touching one of these, **stop and ask TJ.** It's almost always a wrong understanding of the system.

---

## The full workflow loop

1. **Read context first.** Always:
   - `~/claw/BiccOdoo/CLAUDE.md` (if present) and `~/claw/BiccOdoo/README.md`
   - `~/claw/BiccOdoo/audits/dev/` — what's already deployed and how recent deploys went
   - `~/claw/BiccOdoo/changesets/` — existing changesets as examples
   - `~/claw/BiccOdoo/config/instance.yaml` — Odoo version, companies, edition
   - `~/claw/BiccOdoo/baseline/production/` — full snapshot of every customization-layer record currently in prod (`ir.ui.view`, `ir.actions.server`, `base.automation`, `ir.cron`, `ir.model.fields`, `ir.ui.menu`, `mail.template`, `website.page`, etc.). **This is your source of truth for "which view/xml_id/key already exists and what does it look like."** Browse it with `grep`/`rg` rather than reading whole files — it's large.

   ### How the baseline export is laid out (critical for finding the right target)

   For each model there's a directory. Inside, every record has either:
   - `<xml_id>.<ext>` + `<xml_id>.meta.json` — records that have an `ir.model.data` xml_id
   - `id_<N>.<ext>` + `id_<N>.meta.json` — builder-created records without an xml_id

   The `.xml` / `.py` file holds the **payload only** (e.g. `arch_db` for views, `code` for server actions). All other fields — including `key`, `website_id`, `name`, `inherit_id`, etc. — live in the **sibling `.meta.json`** under a `lookup` object.

   **Worked example — finding the BICC homepage view:**

   ```bash
   # Wrong: opening the arch file and reading `t-name="..."`
   #   id_1739.xml starts with `<t t-name="website.homepage">` — but t-name is
   #   the QWeb template name, NOT the ir.ui.view.key field. Builder-COW'd views
   #   keep `t-name` from the parent but get a unique `key` rewritten on the row.
   #   Using t-name as your manifest `key:` will fail at deploy time.

   # Right: grep the meta.json files for the actual key + website_id
   rg -l '"name": *"BiCC' baseline/production/ir_ui_view/*.meta.json
   #   → id_1739.meta.json

   cat baseline/production/ir_ui_view/id_1739.meta.json
   #   → "lookup": {
   #         "key": "website.bicc-construction-engineering-services-in-iloilo",
   #         "name": "BiCC - Construction & Engineering Services in Iloilo",
   #         "website_id": 1,
   #         "website_id_display": "BICC",
   #         "type": "qweb"
   #     }
   ```

   Then the manifest uses the values from `lookup`:
   ```yaml
   - type: update_view
     key: website.bicc-construction-engineering-services-in-iloilo
     website_id: 1
     arch_file: ...
   ```

   **Rule: the `key`, `website_id`, and `inherit_id` in your manifest MUST come from `meta.json`'s `lookup` object — never from the arch XML's `t-name=`, never from a filename, never from neighbouring `website.page` records.** If a baseline meta.json doesn't have a `lookup` field (older export), stop and ask the user to re-run `export-baseline` before authoring — guessing will fail at CI.
2. **Plan**, then confirm with TJ before authoring code if the change is non-trivial.
3. **Use the `/odoo-v19-guide` skill** for Odoo-side rules (safe_eval contents, fields that exist, Command API, etc.) when writing XML or Python bodies. Don't guess Odoo APIs.
4. **Pick a changeset id**: `<NNN>_<short_name>`, e.g. `002_employee_birthday_reminder`. NNN should be the next number above the highest existing folder.
5. **Sync to `main` FIRST, then branch off it.** This is critical: the `baseline/production/` directory and the latest workflow shims live only on `main`. If the local clone is checked out on a stale `ai/*` branch you'll either not see baseline at all (and incorrectly think it doesn't exist) or branch off old state. Run:
   ```bash
   git checkout main && git pull origin main && git checkout -b ai/<NNN>_<short_name>
   ```
   If `git checkout main` fails because of uncommitted changes on the current branch, stop and ask the user — never silently stash or discard.
6. **Author** the manifest + content files in `changesets/<id>/`.
7. **Push.** `git push -u origin ai/<NNN>_<short_name>`.
8. **Wait for CI** (run `gh run watch` or `gh run list --repo dietbald/BiccOdoo --limit 4`). Two workflows will run:
   - `validate` — static checks. If it fails, read `reports/ai_feedback/<id>.md` for the exact `file:line:msg` errors. Fix locally, push again.
   - `deploy-dev` — applies to the dev Odoo instance, writes `audits/dev/<id>.json` and any `rollback_snapshots/dev/<id>/` files, commits them back to your `ai/*` branch automatically.
9. **Verify on dev.** For user-facing changes, ask TJ to smoke-test in the dev Odoo UI. For backend changes, the post-deploy `verify` step in CI plus the audit `status: deployed` is your signal.
10. **Hand off to TJ.** TJ opens the PR `ai/<branch>` → `main`, reviews, merges, and then triggers `promote-staging.yml` followed by `promote-prod.yml` through the GitHub Actions UI. **You don't do these.**

---

## Manifest format

```yaml
id: 002_employee_birthday_reminder   # MUST equal folder name
schema_version: 1                    # REQUIRED — second line
description: |
  One-line summary of intent. Why this change exists, not just what.
author: ai
allow_generic_records: false         # default false; only set true if you use create_record / update_record

operations:
  - type: update_view
    key: http_routing.404            # or xml_id: module.view_id
    arch_file: http_routing_404.xml  # path relative to this folder
    backup: true                     # default true; leave at true

  - type: create_server_action
    xml_id: bicc_hr.birthday_reminder_action
    name: Employee Birthday Reminder
    model: hr.employee
    code_file: birthday_action.py
```

Operations apply **in order**. If one fails mid-deploy, CI automatically reverses every completed op — you will never see a half-applied state in the audit. The audit's `status` will be one of:

| Audit status | Meaning |
|---|---|
| `deployed` | All ops applied. Promotable. |
| `rolled_back_after_failure` | Mid-deploy op failed; every completed op was auto-reversed. Env is back to pre-deploy state. Fix the changeset and re-push. |
| `failed_partial` | Op 0 failed; nothing was written. Fix and re-push. |
| `failed_partial_rollback_incomplete` | Failure + auto-rollback couldn't finish cleanly. **TJ-only resolution.** Stop and hand off. |

---

## Supported operation types

| Type | Odoo model | Required fields | Notes |
|---|---|---|---|
| `update_view` | `ir.ui.view` | `key` *or* `xml_id`, `arch_file` | Multi-website Odoo: pass `website_id: false` (global) or `website_id: <int>` (specific site) if the key resolves ambiguously. |
| `create_view` | `ir.ui.view` | `xml_id`, `arch_file` | Optional `inherit_id` (xml_id), `model`, `priority`. |
| `create_field` | `ir.model.fields` | `xml_id`, `model`, `name`, `field_type` | Name MUST start with `x_` or `x_studio_`. Always uses `state='manual'`. |
| `create_server_action` | `ir.actions.server` | `xml_id`, `model`, `code_file` | `state='code'`. Python body subject to safe_eval rules. |
| `create_automated_action` | `base.automation` | `xml_id`, `model`, `trigger`, `code_file` | Odoo 17+ shape — handler creates a sibling `ir.actions.server` (xml_id `<id>__action`) automatically. |
| `create_cron` | `ir.cron` | `xml_id`, `model`, `code_file`, `interval_number`, `interval_type` | `interval_type` ∈ `minutes/hours/days/weeks/months`. |
| `create_menu` | `ir.ui.menu` | `xml_id`, `name` | Optional `parent_xml_id`, `action_xml_id`, `sequence`. |
| `create_record` | whitelist | `xml_id`, `model`, `values` | Requires `allow_generic_records: true`. **Prefer a typed op if one exists.** |
| `update_record` | whitelist | `xml_id`, `model`, `values` | Requires `allow_generic_records: true`. Record must already exist. |

**Generic-record whitelist** (for `create_record`/`update_record`): `ir.actions.act_window`, `ir.actions.act_url`, `ir.actions.report`, `ir.filters`, `ir.sequence`, `mail.template`, `mail.activity.type`, `product.category`, `uom.uom`, `uom.category`, `account.tax`, `account.account.tag`, `account.journal`. If you need a model not on this list, **stop and ask TJ** — it requires a TJ-only edit elsewhere.

---

## Python bodies (server-action / cron / automation `code_file`)

These run inside Odoo's `safe_eval` sandbox. **For everything you can and cannot do in these bodies — pre-bound names, forbidden patterns, datetime shape, Command API — invoke `/odoo-v19-guide`.** Don't guess from memory; the SaaS surface has quirks the guide documents.

What's deployer-specific (not in `/odoo-v19-guide`): CI's static validator parses your Python with `ast` and rejects the obvious sandbox-escape patterns (imports, `eval`/`exec`, `os`/`sys`/`subprocess` attribute access, dunder walks, `_cr`/`_uid`) **before** anything runs against Odoo. So if you accidentally write a forbidden pattern, you get a fast structured failure in `reports/ai_feedback/<id>.md` instead of a mid-deploy traceback.

---

## XML view bodies (`arch_file`)

Standard Odoo view inheritance / replacement XML. Must parse with `xml.etree.ElementTree.fromstring` — CI checks this in validate. For multi-website templates (anything in `http_routing.*` or `website.*`) be aware: Odoo COW's per-website copies; if you're targeting the global template, set `website_id: false` in the op.

---

## Safety properties you can rely on

- **Idempotency**: re-running a changeset with the same content is a no-op at the Odoo layer. Handlers check current state first; canonical-equal → `skipped`, no write.
- **Pre-write snapshots**: every write takes a backup, stored in `rollback_snapshots/<env>/<id>/`. You don't manage these — handlers do it.
- **Auto-rollback on failure**: if any op fails mid-deploy, the deployer immediately reverses every op that already completed. The audit records `rolled_back_after_failure` and the env is back to pre-deploy state. **You never have to debug a half-applied state.**
- **Promotion gate**: lower-env audits with matching `manifest_sha256` are required to promote. You can't accidentally skip dev.
- **Env-alignment check**: at promote time, the target env's actual pre-deploy state for op 0 must match what the lower env recorded. Catches "tested on dev against state X, dev got modified, now promoting against state Y" silently.
- **Three production write barriers**: GitHub env approval + required reviewer + missing prod password (TJ-entered per run). Production cannot be touched without TJ.

---

## Things that are NOT your job

- Running `odoo-deploy` locally (don't install it; don't try; CI handles it).
- Triggering `deploy-dev` manually (push to `ai/*` does it).
- Triggering `promote-staging` / `promote-prod` / `rollback` / `export-baseline` (TJ only, via GitHub UI).
- Editing workflow files, deployer code, or anything outside `changesets/`.
- Writing tests for handlers (handlers are not your surface).
- Bumping `schema_version` (it's `1` for the current format — set it and forget it).

If you're tempted to do any of these: stop and ask TJ. The answer is almost always "no, just author the changeset."

---

## Quick sanity checklist before you push

- [ ] Folder name matches `manifest.id`
- [ ] `schema_version: 1` is on the second line of the manifest
- [ ] Branch starts with `ai/`
- [ ] No edits outside `changesets/<id>/` (and optionally `config/blocklist/`)
- [ ] Every `arch_file:` and `code_file:` reference points to a file that exists in this folder
- [ ] Python bodies have no `import`, no `eval/exec`, no `os/sys/subprocess`, no dunder attribute access
- [ ] XML bodies parse (try `python3 -c 'import xml.etree.ElementTree as E; E.parse("path.xml")'` if unsure)
- [ ] For `create_record` / `update_record`: model is on the whitelist AND manifest has `allow_generic_records: true`
- [ ] For multi-website views: `website_id` is set if the `key` lookup is ambiguous

---

## When CI fails

1. **Read `reports/ai_feedback/<id>.md`** in the repo (CI commits it back). It tells you `file:line: msg` for every issue.
2. **Read `reports/validation/<id>.json`** for the structured form (if you want to grep).
3. Fix in your local clone, `git add changesets/<id>/`, `git commit`, `git push`. CI re-runs automatically.
4. If `deploy-dev` (not `validate`) failed: the env is auto-rolled-back to pre-deploy state. Read `audits/dev/<id>.json` for what happened. Fix the changeset and push again.
5. If status is `failed_partial_rollback_incomplete`: stop. Hand off to TJ. Do not push again.
