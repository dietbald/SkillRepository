# How to query this skill

This skill is a product / business knowledge pack on the halingo.be SaaS for Belgian logopedist (speech therapy) practices. Pick the right entry point for your question.

## "What does <feature> do?"

1. Open `references/00-feature-index.md` and ctrl-F the feature name. The Area column tells you which product area it belongs to.
2. Open `references/areas/<area>.md` for the full product behavior, the Belgian regulatory context, and how this feature relates to the rest of the product.

## "How does <screen> work?"

1. Find the screen in `references/01-application-map.md` § 1 (Available Screens / Site Map). Each screen is grouped under A–E.
2. The grouping (A–E) maps to a functional area; that area is documented in `references/areas/`.
3. The helpdesk articles under `references/helpdesk/` describe screens from the user's perspective and may include step-by-step workflows.

## "Where is <concept> documented?"

1. `references/03-coverage-matrix.md` — a master cross-reference: 20 functional groupings × helpdesk file. It tells you where to look in the helpdesk for any concept.
2. For Belgian / Halingo terminology, `references/02-glossary.md`.
3. For the alphabetical feature list, `references/00-feature-index.md`.

## "What does the helpdesk say about <topic>?"

The helpdesk is in `references/helpdesk/` (8 files, mostly Dutch with some French):

| File | Topic |
|---|---|
| `agenda-scheduling.md` | Calendar, appointments, recurring / group events, Rosa, color coding |
| `compliance-riziv.md` | "De Conventie 2024", brackets, code routing, age-based eligibility |
| `faq-troubleshooting.md` | FAQ-style answers to common user questions |
| `general-getting-started.md` | Catch-all: account, login, profile, dashboard, multi-praktijk, treatment plan, reimbursement, documents |
| `integrations.md` | Rosa connection setup |
| `invoicing-finances.md` | Certificates, invoicing, verzamelstaten, payment statuses, commissions, matrix printer |
| `patient-management.md` | Patient roster overview (sparse) |
| `settings-practice-management.md` | Practice config: logo, accent color, email templates |

Use grep / ctrl-F across the directory. The coverage matrix maps each functional grouping to its primary helpdesk file.

## "Which area covers <feature>?"

1. `references/00-feature-index.md` — the Area column tells you.
2. Or `references/areas/` — the area names are short and self-explanatory.

## "What's in the application map?"

`references/01-application-map.md` (also in `references/functional/application-map.md`). The 20 functional groupings + the screen tree (A through E).

## "What user stories are documented?"

`references/functional/user-stories.md` — illustrative user stories for the main personas (therapist, practice owner) across the core competencies.

## When NOT to use this skill

- Belgian healthcare regulation in general — use `logopedist-be`.
- Generic software-engineering, non-Belgian healthcare, non-Halingo SaaS — out of scope.

## What this skill intentionally does not contain

This skill is a **product / business knowledge pack**. It does not document Halingo's internal implementation, infrastructure, deployment, or codebase organisation. Questions about how the product is built, tested, hosted, or deployed are out of scope for this skill — answer them from the appropriate engineering source instead.
