# How to query this skill

This skill is for answering questions about the **legacy halingo.be SaaS product** and the **migration spec contracts** that govern the new build. Pick the right entry point for your question.

## "What does <feature> do?"

1. Open `references/00-feature-index.md` and ctrl-F the feature name. You'll see whether it's a `spec` (Phase 2 contract) or a `from-source` entry (Phase 1 code description).
2. If it's a `spec`: the path field tells you which `02-specs/<area>/<feature>/spec.md` is the contract. Open it; the spec has embedded Gherkin and `QUIRK-PRESERVE` blocks.
3. If it's a `from-source`: the path is `references/from-source/features/<name>.md`. That file describes the legacy Meteor implementation with file:line citations into `Halingo-Main`.
4. For a complete picture (spec + legacy + helpdesk + open questions), open `references/areas/<area>.md` — the area file embeds the full Phase 1 discovery and points at all the related specs/from-source/helpdesk content.

## "How does <screen> work?"

1. Find the screen in `references/01-application-map.md` § 1 (Available Screens / Site Map). Each screen is grouped under A–E.
2. The grouping (A–E) maps to a functional area; that area is documented in `references/areas/`.
3. The route + component for each screen lives in `references/from-source/scout-pass.md` § 1 (Routes / screens).
4. The full route reference is `references/from-source/technical/routes.md`.

## "Where is <concept> documented?"

1. `references/03-coverage-matrix.md` is the master cross-reference: 20 functional groupings × helpdesk coverage × code-read coverage. It tells you where to look in helpdesk + code for any concept.
2. For Belgian/Halingo terminology, `references/02-glossary.md`.
3. For the full alphabetical feature list, `references/00-feature-index.md`.

## "What does the helpdesk say about <topic>?"

The helpdesk is in `references/helpdesk/` (8 files, NL/FR mixed):

| File | Topic |
|---|---|
| `agenda-scheduling.md` | Calendar, appointments, recurring/group events, rosa, color coding |
| `compliance-riziv.md` | De Conventie 2024, brackets, code routing, age-based eligibility |
| `faq-troubleshooting.md` | Stub-level FAQ |
| `general-getting-started.md` | Catch-all (~2200 lines): account, login, profile, dashboard, multi-praktijk, treatment plan, reimbursement, documents, GDPR-adjacent |
| `integrations.md` | Rosa only |
| `invoicing-finances.md` | Certificates, invoicing, verzamelstaten, payment statuses, commissions, matrix printer |
| `patient-management.md` | Sparse — patient CRUD missing, has tariff-indexation duplicate |
| `settings-practice-management.md` | Practice config: logo, accent color, email templates |

Use grep/ctrl-F across the directory. The coverage matrix maps each functional grouping to its primary helpdesk file.

## "Which area covers <feature>?"

1. Open `references/00-feature-index.md` and find the feature — the "Area" column tells you.
2. Or open `references/areas/` and ls — the area names are short and self-explanatory.

## "What's the spec for <feature>?"

1. `references/specs-index.md` — grouped by area, one-line summary per spec.
2. Or `references/00-feature-index.md` rows where Kind=spec.

## "What gaps did Phase 1 find in <area>?"

1. Open `references/areas/<area>.md` and search for `NEEDS CLARIFICATION` or `NEEDS DOMAIN REVIEW`. Both Phase 1 discovery and verification append these.
2. Code-read gaps are in `references/from-source/gaps/`:
   - `03_patient_data_privacy.md` — confirmed empty in code (no GDPR export, soft-delete only, no consent capture, no audit, document URLs leak userId, etc.)
   - `19_practice_analytics.md` — partial close: 5 inline statistics methods + 4 chart screens exist, no analytics module / forecasting / exports
3. Coverage matrix § "Concepts present in helpdesk but missing from `application_map.md`" lists discovery-time additions.

## "What was triaged or deprecated?"

1. `references/from-source/deprecation-list.md` — 22 items in 4 categories (kill / dead-code / legacy-do-not-port / move-to-monorepo).
2. `references/from-source/bugs-and-security.md` — 14 confirmed engineering items (5 security, 3 auth, 4 functional bugs, 3 schema drift, 3 hygiene).
3. `references/from-source/open-questions.md` — the 44-question questionnaire that drove the triage, with verbatim product-owner answers.

## "What's in the application map?"

`references/01-application-map.md` (also in `references/functional/application-map.md`). The 20 functional groupings + the screen tree (A through E).

## "What technical infrastructure exists in legacy?"

`references/from-source/technical/`:

| File | What it lists |
|---|---|
| `collections.md` (1294 lines) | All 28 MongoDB collections + full schemas |
| `methods.md` (376 lines) | All 138 Meteor methods, alphabetical |
| `routes.md` (261 lines) | All 36 named FlowRouter routes + alphabetical index |
| `publications.md` (81 lines) | All 40 Meteor publications + 4 Counts.publish channels |
| `migrations-timeline.md` (123 lines) | All 47 migrations as a feature timeline (do not port to mono repo per Q24) |
| `background-jobs.md` (113 lines) | 5 cron mechanisms (the 5-min Rosa pull is to-move-to-lambda) |
| `rest-endpoints.md` (50 lines) | 4 HTTP endpoints (Stripe webhook, 2 stripe-invoice routes, iCal feed) |

## "What does the code-read inventory cover?"

`references/from-source/inventory.md` is the master cross-reference. It contains:
- Statistics (counts of methods, collections, etc.)
- Coverage matrix update (helpdesk→post-code-read)
- Index by functional grouping (1–20) with links to the per-feature pages
- Cross-cutting features list
- Net-new findings (22 items not in helpdesk)
- Confirmed gaps
- Bugs / security overview
- Phantoms (helpdesk vs code disagreements)
- Full file index of `from_source/`

## "What's the scout pass?"

`references/from-source/scout-pass.md` is the *raw* output of the first inventory walk over `Halingo-Main`. Useful for orientation but superseded by the per-feature deep dives in `from-source/features/`. Treat as historical context, not authoritative.

## When NOT to use this skill

- Belgian healthcare regulation in general — use `logopedist-be`.
- New Halingo-MonoRepo architecture, conventions, allowed packages — use `halingo-backend`, `halingo-frontend`, `typescript-halingo`.
- Generic software engineering, non-Belgian healthcare, non-Halingo SaaS — out of scope.

## When to update this skill

The skill is built from:
- `/home/tj/halingoMigration/01-discovery/`
- `/home/tj/halingoMigration/02-specs/`
- `/home/tj/HalingoDoc/docs/`

If any of those directories change materially (new discovery files, new specs, helpdesk re-import), the skill must be rebuilt. The build script lives in this skill's git history; re-run it against the updated sources.
