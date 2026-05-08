---
name: halingo-docs
description: Comprehensive knowledge pack for the halingo.be SaaS — what every feature does, how it works in legacy Meteor, what the spec contracts say, what helpdesk documents, what gaps were found in Phase 1 discovery. Use this skill ONLY when the user asks about a Halingo product feature, a screen in the app, how something is documented in the helpdesk, what was found in discovery, what a spec contract requires, or which area covers a particular concept. Self-contained — bundles all 25 Phase 1 discovery files (with verifications), all HalingoDoc helpdesk + from_source content, glossary, application map, coverage matrix, and indexes of all 105 specs. DO NOT activate for questions about Belgian regulation generally (use logopedist-be instead), generic software engineering, or topics unrelated to Halingo product.
---

# Halingo Documentation Knowledge Pack

You have access to a complete, self-contained knowledge pack on the halingo.be product — the legacy Meteor SaaS, the Phase 1 discovery findings, and the Phase 2 spec contracts.

## When to use this skill

- "What does <feature> do?" / "How does <screen> work?"
- "Where is <concept> documented?" / "What does the helpdesk say about X?"
- "Which area covers Y?" / "What's the spec for Z?"
- "What gaps did Phase 1 find in <area>?"
- "What's in the application map?"
- "What collections / methods / routes exist in the legacy?"
- "What's in the deprecation list?" / "What bugs were found?"

## When NOT to use this skill

- Belgian healthcare regulation in general — use `logopedist-be` instead.
- New Halingo-MonoRepo architecture, conventions, allowed packages — use `halingo-backend`, `halingo-frontend`, `typescript-halingo`.
- Generic software engineering, non-Belgian healthcare, non-Halingo SaaS — out of scope.

## Quick lookup tables

| To find... | Open... |
|---|---|
| A feature, alphabetically | `references/00-feature-index.md` (157 entries — 105 specs + 52 from-source pages) |
| The 20 functional groupings + screen tree | `references/01-application-map.md` |
| Belgian/Halingo terminology | `references/02-glossary.md` |
| What's documented where (master cross-reference) | `references/03-coverage-matrix.md` |
| All spec contracts grouped by area | `references/specs-index.md` |
| Deep dive on one product area | `references/areas/<area>.md` (26 area files including `shared`) |
| Helpdesk articles (NL/FR Zendesk dump) | `references/helpdesk/` (8 files) |
| Code-derived legacy notes per feature | `references/from-source/features/` (51 files) |
| Code-derived gap fills (GDPR, analytics) | `references/from-source/gaps/` (2 files) |
| MongoDB collections, methods, routes, publications, jobs | `references/from-source/technical/` (7 files) |
| Bugs and security findings | `references/from-source/bugs-and-security.md` (14 items) |
| Deprecation list (kill / dead-code / legacy / move) | `references/from-source/deprecation-list.md` (22 items) |
| 44 product-owner Q&A | `references/from-source/open-questions.md` |
| Original scout pass over the legacy code | `references/from-source/scout-pass.md` |
| Master from-source cross-reference | `references/from-source/inventory.md` |
| Where each piece of data came from | `references/meta/provenance.md` |
| How to query this skill | `references/meta/how-to-query.md` |
| Skill file → original source mapping | `references/meta/source-paths.md` |

## Areas at a glance (26 area files in `references/areas/`)

| Area | Spec folder | Key topics |
|---|---|---|
| `client-side-error-logging` | (cross-cutting) | Browser-side error capture, `clientErrors` collection |
| `clinical-reporting` | `clinical-reporting/` | Rich-text reports, RIZIV demand-form PDFs, Documenten/Verslagen tab |
| `compliance-monitoring` | `compliance-monitoring/` | De Conventie 2024 rules engine, nomenclature lookup, R-waarde, session caps |
| `debt-collection` | `debt-collection/` | Unpaid invoice tracking, manual reminders, dashboard widget |
| `document-digitization` | `document-digitization/` | Patient-file documents (PDF/images), upload, search, S3 |
| `external-platform-sync-rosa` | `rosa-sync/` | Bidirectional Rosa.be EHR sync (5-min cron pull + push), token auth |
| `identity` | `identity/` | Auth, profile, RBAC (62 perms × 3 roles), invitations, ToS, password mgmt |
| `in-app-notifications` | `notifications/` | Notification centre with new/seen/read; navbar bell + dashboard tile |
| `main-dashboard` | `main-dashboard/` | Post-login widget grid (statistics band, notifications, todos, newsfeed) |
| `multi-view-scheduling` | `scheduling/` | Calendar D/W/M, recurring/group/private events, payback rules, iCal feed |
| `mutualistic-billing` | `mutualistic-billing/` | Verzamelstaten generation by patient or fund (CG1/CG2, INSZ) |
| `newsfeed` | `newsfeed/` | System-wide bilingual NL/FR announcements (no author UI) |
| `patient-communication` | `patient-communication/` | Invoice email send + history (no appointment reminders exist) |
| `patient-data-privacy` | `patient/` | Patient dossier CRUD, access control, GDPR gap (confirmed empty in code) |
| `payment-lifecycle` | `payment-lifecycle/` | Open/Unpaid/Partially-paid/Printed/Mailed/Paid state machine, Stripe webhooks |
| `practice-analytics` | `practice-analytics/` | Earnings, sessions, RIZIV stats, dashboard charts (partial: no exports / forecasting) |
| `practice-branding` | `practice/` | Logo, accent color, invoice template, email template selection, switcher |
| `precision-printing` | `precision-printing/` | Matrix-printer pipeline, certificate manual/printer modes, numbering, 484×1311 px coords |
| `reimbursement-tracking` | `reimbursement-tracking/` | Session counting math, payback eligibility, low-session alerts |
| `saas-lifecycle` | `saas/` | SaaS subscriptions, plan/payment-method change, Stripe webhooks, referral programme |
| `shared` | `shared/` | Cross-cutting: ZIP code lookup, error pages |
| `smart-invoicing` | `smart-invoicing/` | Patient invoice generation + lifecycle, certificates, commissions, financial overview |
| `telehealth` | `telehealth/` | Video consultation event type, hardcoded `VideoConsultationCode = 792433` |
| `todos` | `todos/` | Per-user todo list (`userId`-scoped) |
| `treatment-planning` | `treatment-planning/` | Bilan lifecycle, long-term + short-term goals, treatment create, observers |
| `waitlist-optimization` | `waitlist/` | Waitlist status flag, list filter, statistics (gap: no queue/intake model in code) |

## Reading order

1. **SKILL.md** (this file) — navigation
2. **`references/00-feature-index.md`** — alphabetical feature lookup; jump from name → file
3. **`references/01-application-map.md`** — orient on the 20 functional groupings
4. **`references/03-coverage-matrix.md`** — see what's documented where, and what's a confirmed gap
5. **`references/areas/<area>.md`** — deep dive on one area; embeds Phase 1 discovery + verification + spec list
6. **Specific helpdesk / from-source / spec files** referenced in the area file

## Key things to remember

- **The spec is the contract.** When a `02-specs/<area>/<feature>/spec.md` exists, it is what the new code must satisfy. The legacy Meteor source (described in `from-source/`) is consulted only for understanding, not as a source of truth.
- **Two confirmed-empty gaps in legacy code**: Patient Data Privacy (#3) and Waitlist Optimization (#4). Both helpdesk and code agree there is nothing.
- **One worse-than-helpdesk-says gap**: Patient Communication (#16) — no appointment reminder email type exists at all.
- **Rosa is bidirectional, not push-only.** The scout pass got this wrong; `from-source/features/rosa_integration.md` is authoritative.
- **22 deprecation entries** — practice chat, `users.delete`, admin impersonation, the migrations folder, MethodLogger, per-praktijk invoice locale, the team_meetings scaffold, and others. Always check `references/from-source/deprecation-list.md` before doing porting work on those features.
- **Authoritative dates**: convention rules from Aug 2024; tariff history hard-coded as date cascades in `Events.getPrices()`; R-waarde history includes a 2023-05-01 group-sitting rate change.
- **Naming**: discovery names sometimes differ from spec folder names (`external-platform-sync-rosa` → `rosa-sync`, `multi-view-scheduling` → `scheduling`, etc.). The mapping is in `references/meta/source-paths.md`.

## Skill version + provenance

Built from:
- `/home/tj/halingoMigration/01-discovery/` (25 area discoveries + 25 verifications, dated 2026-04-08 to 2026-04-11)
- `/home/tj/halingoMigration/02-specs/` (105 spec.md files, dated 2026-04-10 to 2026-04-13)
- `/home/tj/HalingoDoc/docs/` (helpdesk + curated + code-read, dated 2026-04-06 to 2026-04-07)

If any of those source directories changes materially, this skill should be rebuilt. See `references/meta/source-paths.md` for the file-by-file source mapping and `references/meta/provenance.md` for the build philosophy.
