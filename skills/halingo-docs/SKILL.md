---
name: halingo-docs
description: Halingo product knowledge pack — what every feature of the halingo.be SaaS does, how users use it, what the helpdesk documents, and the Belgian regulatory context that shapes each behavior. Use this skill when the user asks about a Halingo product feature, a screen in the app, what the helpdesk says about a topic, which product area covers a particular concept, or how a feature connects to Belgian RIZIV / mutualiteit / GDPR rules. DO NOT activate for questions about Belgian healthcare regulation in general (use `logopedist-be` instead) or for any question about Halingo's internal implementation, infrastructure, or codebase — this skill is product / business focused only.
---

# Halingo Product Knowledge Pack

Product and business knowledge for halingo.be — the SaaS practice-management product for Belgian logopedist (speech therapy) practices. This skill describes **what each feature does for the user, how users use it, and the Belgian regulatory context that constrains it**. It does not describe how the product is built or deployed.

## When to use this skill

- "What does <feature> do?" / "How does <screen> work?"
- "Which area of Halingo covers <concept>?"
- "What does the helpdesk say about <topic>?"
- "What's in the application map?" / "What screens does Halingo have?"
- "What Belgian regulation applies to <feature>?" (cross-checked against `logopedist-be` for the regulatory text itself)

## When NOT to use this skill

- Belgian healthcare regulation in general — use `logopedist-be` instead.
- Generic software engineering, non-Belgian healthcare, non-Halingo SaaS — out of scope.
- Questions about how Halingo is built / hosted / deployed / tested — out of scope for this skill.

## Quick lookup

| To find... | Open... |
|---|---|
| A feature, alphabetically | `references/00-feature-index.md` |
| The 20 functional groupings + screen tree | `references/01-application-map.md` |
| Belgian / Halingo terminology | `references/02-glossary.md` |
| What the helpdesk covers and where | `references/03-coverage-matrix.md` |
| Deep dive on one product area | `references/areas/<area>.md` (26 area files) |
| Helpdesk articles (NL / FR) | `references/helpdesk/` (8 files) |
| Functional application map | `references/functional/application-map.md` |
| Illustrative user stories | `references/functional/user-stories.md` |
| How to query this skill | `references/meta/how-to-query.md` |

## Product areas (26 area files in `references/areas/`)

| Area | Key topics |
|---|---|
| `client-side-error-logging` | Friendly error capture and support telemetry. |
| `clinical-reporting` | Rich-text clinical reports, RIZIV demand-form generation, dossier *Documenten / Verslagen* tab. |
| `compliance-monitoring` | "De Conventie 2024" rules engine, nomenclature lookup, R-waarde, session caps. |
| `debt-collection` | Unpaid-invoice tracking, manual reminders, dashboard widget. |
| `document-digitization` | Patient-file documents (PDF / images), upload, search. |
| `external-platform-sync-rosa` | Bidirectional Rosa.be integration with the "needs review" flow. |
| `identity` | Auth, profile, RBAC (owner / administrator / member), invitations, terms-of-service. |
| `in-app-notifications` | Notification inbox with new / seen / read states; navbar bell + dashboard tile. |
| `main-dashboard` | Post-login widget grid (statistics, notifications, todos, newsfeed). |
| `multi-view-scheduling` | Calendar D / W / M, recurring / group / private events, payback rules, iCal feed. |
| `mutualistic-billing` | Verzamelstaten generation by patient or by mutualiteit (CG1 / CG2, INSZ). |
| `newsfeed` | System-wide bilingual NL / FR announcements. |
| `patient-communication` | Invoice email send + history. |
| `patient-data-privacy` | Patient dossier CRUD, two-layer additive access control. |
| `payment-lifecycle` | Open / Unpaid / Partially-paid / Printed / Mailed / Paid state machine. |
| `practice-analytics` | Earnings, sessions, RIZIV stats, dashboard charts. |
| `practice-branding` | Logo, accent color, invoice and mail template selection, practice switcher. |
| `precision-printing` | Matrix-printer pipeline, certificate manual / printer modes, numbering. |
| `reimbursement-tracking` | Session counting, payback eligibility, low-session alerts. |
| `saas-lifecycle` | SaaS subscriptions, plan / payment-method change, referral programme. |
| `shared` | Cross-cutting: ZIP-code lookup, error pages. |
| `smart-invoicing` | Patient invoice generation + lifecycle, certificates, commissions, financial overview. |
| `telehealth` | Video consultation appointment type and dedicated RIZIV code. |
| `todos` | Per-user lightweight to-do list. |
| `treatment-planning` | Bilan lifecycle, long-term + short-term goals, treatment create. |
| `waitlist-optimization` | Waitlist status flag, list filter, statistics. |

## Reading order

1. **SKILL.md** (this file) — navigation.
2. **`references/00-feature-index.md`** — alphabetical feature lookup.
3. **`references/01-application-map.md`** — orient on the 20 functional groupings.
4. **`references/03-coverage-matrix.md`** — find which helpdesk file covers which area.
5. **`references/areas/<area>.md`** — deep dive on one area.
6. **`references/helpdesk/<file>.md`** — user-facing articles for step-by-step walkthroughs.

## Key things to remember

- **Halingo is built for Belgian logopedists.** The product is shaped by RIZIV nomenclature, "De Conventie", mutualiteiten, INSZ, the Kwaliteitswet's 30-year retention, and the GDPR Art. 9 obligations specific to health data.
- **Subscriptions are per-practice**, not per-user. One person can belong to several practices.
- **Roles are scoped per practice**: praktijkverantwoordelijke (owner), beheerder (administrator), lid (member).
- **Patient dossier access** combines the practice-level role with optional per-dossier grants, additively.
- **Convention rules are dated.** "De Conventie 2024" is currently in force; rule logic respects the historical cascade so prior periods stay correctly billed.
- **Some surfaces are intentionally minimal:** Patient Data Privacy lacks an end-user GDPR export surface; Waitlist Optimization is a flag rather than a queue; Patient Communication does not include automated appointment-reminder emails. These are real product gaps relative to user expectations and are documented in the area files.
- **Naming:** the discovery / area names sometimes differ slightly from the user-facing screen labels (e.g. *External Platform Sync* covers what the user sees as "Rosa integration"). Use the area files to translate.
