# Coverage matrix

Audit of how the imported helpdesk source material in `full_documentation/` maps onto the 20 functional groupings declared in `functional/application_map.md`. Use this as the working backlog for restructuring helpdesk content into the `manual/` and `technical/` trees.

Last audited: 2026-04-06 against ~150 articles across 8 source files (~4,400 lines).
**Code-derived findings integrated 2026-04-07** from `/home/tj/Repos/Halingo-Main` — see [`from_source/inventory.md`](from_source/inventory.md) for the master cross-reference (63 documentation files, ~16,200 lines), [`from_source/bugs_and_security_findings.md`](from_source/bugs_and_security_findings.md) for engineering-team triage (14 items post product-owner triage), [`from_source/deprecation_list.md`](from_source/deprecation_list.md) for the canonical cleanup backlog (22 entries), [`from_source/open_questions.md`](from_source/open_questions.md) for the answered questionnaire that drove the triage, and the per-grouping links added to the table below.

## Source files at a glance

| File | Lines | Language | Articles | Notes |
|---|---:|---|---:|---|
| `general_getting_started.md` | 2,191 | NL 75% / FR 22% | ~50+ | Catch-all dump; needs to be split |
| `invoicing_finances.md` | 1,124 | NL 99% | 22 | Strong coverage of certificates + invoicing |
| `patient_management.md` | 283 | NL 95% (1 FR dup) | 6 | Sparse; missing patient CRUD |
| `agenda_scheduling.md` | 236 | NL 95% | 8 | Solid scheduling coverage |
| `settings_practice_management.md` | 250 | NL 100% | 7 | Practice config |
| `integrations.md` | 153 | NL 100% | 3 | Rosa only |
| `compliance_riziv.md` | 124 | NL 98% | 1 (umbrella) | Aug 2024 convention rules |
| `faq_troubleshooting.md` | 79 | NL 98% | 2 | Stub-level |

## Functional groupings (from `functional/application_map.md` §2)

| # | Grouping | Coverage | Primary source | Notes |
|---:|---|---|---|---|
| 1 | Identity Management | **Well covered** | `general_getting_started.md` | Account, login, password, email, profile photo, language. Role granularity (owner/beheerder/lid) implicit, not formally documented. → Code: full 62-permission RBAC matrix in [`from_source/features/practice_user_roles.md`](from_source/features/practice_user_roles.md); auth flow in [`from_source/features/identity_and_authentication.md`](from_source/features/identity_and_authentication.md). |
| 2 | Practice Branding | **Well covered** | `settings_practice_management.md` | Logo, invoice templates, accent color, comments. |
| 3 | Patient Data Privacy | **Not covered** | — | No GDPR export, retention, or right-to-erasure articles. → Code: **gap confirmed empty** in [`from_source/gaps/03_patient_data_privacy.md`](from_source/gaps/03_patient_data_privacy.md). No data export, soft-delete only, no consent capture, no audit trail, document URLs leak `userId`, `users.delete` doesn't cascade. |
| 4 | Waitlist Optimization | **Not covered** | — | No queue / intake / prioritization workflow documented. → Code: **gap confirmed empty** — no `Waitlist`/`Queue`/`Intake`/`Priority` model exists in code. |
| 5 | Multi-View Scheduling | **Well covered** | `agenda_scheduling.md` + `general_getting_started.md` | Day/week/month, custom hour range, multi-praktijk switching, color coding. |
| 6 | Treatment Planning | **Well covered** *(post code-read)* | `general_getting_started.md` | Long-term goals with sub-goals, short-term plans, goal completion. → Code: [`from_source/features/treatments_and_bilans.md`](from_source/features/treatments_and_bilans.md) (18 treatment types, bilan ordering, observers) and [`from_source/features/long_term_therapy_plan.md`](from_source/features/long_term_therapy_plan.md) (11 categories quoted from code). |
| 7 | Reimbursement Tracking | **Well covered** | `invoicing_finances.md` + `general_getting_started.md` | Session counters, end-of-coverage alerts, supplemental insurance, external session counting. → Code: precise session-counting math in [`from_source/features/session_counting.md`](from_source/features/session_counting.md), payback decision tree in [`from_source/features/event_payback.md`](from_source/features/event_payback.md). |
| 8 | Compliance Monitoring | **Well covered** | `compliance_riziv.md` | Aug 2024 rules, automatic 2-year brackets, code routing by location, age-based eligibility. Time-bound — needs refresh on next convention. → Code: full nomenclature matrix quoted in [`from_source/features/nomenclature_codes.md`](from_source/features/nomenclature_codes.md), rules engine in [`from_source/features/riziv_compliance.md`](from_source/features/riziv_compliance.md). |
| 9 | Clinical Reporting | **Partial** | `general_getting_started.md` | Document upload + tagging + search. → Code: rich-text editor + per-locale demand-form PDF generator in [`from_source/features/clinical_reports.md`](from_source/features/clinical_reports.md). Still missing: signature workflow, structured forms beyond stock demand forms. |
| 10 | Document Digitization | **Well covered** | `general_getting_started.md` | PDF/image upload, tagging, search filters. |
| 11 | Smart Invoicing | **Well covered** | `invoicing_finances.md` | One-click invoice from sessions, per-patient grouping, bulk selection. |
| 12 | Payment Lifecycle | **Well covered** | `invoicing_finances.md` | Open / Paid / Overdue / Cancelled states, status changes, payment methods. |
| 13 | Debt Collection | **Partial** | `invoicing_finances.md` | Reminder email automation only. No escalation, no SMS, no collection agency hooks. |
| 14 | Mutualistic Billing | **Well covered** | `invoicing_finances.md` | Verzamelstaat generation by patient or by fund, CG1/CG2, INSZ. |
| 15 | Precision Printing | **Well covered** | `invoicing_finances.md` | Matrix printer setup, margin tuning, certificate numbering, duplicates, browser-specific quirks. |
| 16 | Patient Communication | **Partial** | `settings_practice_management.md` + `invoicing_finances.md` | Invoice/reminder email templates only. → Code **confirms** the gap is worse than the helpdesk implies: no `APPOINTMENT_REMINDER` email type exists, no scheduled job sends patient reminders. Only template *selection* (4 hard-coded React components), no authoring. See [`from_source/features/email_delivery.md`](from_source/features/email_delivery.md), [`from_source/features/email_templates.md`](from_source/features/email_templates.md). |
| 17 | Telehealth Integration | **Well covered** | `agenda_scheduling.md` | Video consultation appointment type with location-based code routing. → Code: hardcoded `VideoConsultationCode = 792433`, no meeting-link generation in code. See [`from_source/features/telehealth_consultation.md`](from_source/features/telehealth_consultation.md). |
| 18 | External Platform Sync | **Well covered** *(post code-read)* | `integrations.md` | → Code **corrects** the scout pass: Rosa is genuinely bidirectional via a 5-min cron pull + real-time push. **Auth is a long-lived integration token, not OAuth2.** Full picture in [`from_source/features/rosa_integration.md`](from_source/features/rosa_integration.md). |
| 19 | Practice Analytics | **Partial** *(post code-read)* | — | → Code: **partially closes the gap**. Five inline statistics methods + four chart screens exist (main dashboard, financial overview, RIZIV graph, session overview). Still missing: forecasting, exports (CSV/XLSX/PDF/scheduled), KPI thresholding, therapist ranking, cohort analysis, Ziekenfonds-level analytics, aging buckets, utilisation metric. See [`from_source/gaps/19_practice_analytics.md`](from_source/gaps/19_practice_analytics.md). |
| 20 | SaaS Lifecycle | **Well covered** | `general_getting_started.md` | Plan selection, change, cancel, payment methods, free trial, referral bonus (aanbrengbonus). |

**Score (helpdesk only):** 14 well covered · 4 partial · 2 not covered.
**Score (after code-read):** 15 well covered · 3 partial · 2 not covered. Treatment Planning (#6) and External Platform Sync (#18) move from partial to well covered; Practice Analytics (#19) moves from not covered to partial; Patient Data Privacy (#3) and Waitlist Optimization (#4) are confirmed empty in code as well as in helpdesk.

## Screens (from `functional/application_map.md` §1)

| Screen | Coverage | Notes |
|---|---|---|
| Main Dashboard | **Not covered** | No source article. Screen exists in spec but no helpdesk material. |
| Practice Selector | Partial | Switching documented; creation in `settings_practice_management.md`. |
| User Profile Settings | **Well covered** | |
| Main Calendar (D/W/M) | **Well covered** | |
| Appointment Modal | Partial | Create flows covered; edit/delete/cancel not documented. |
| Private Appointment Screen | **Well covered** | |
| Rosa Integration Dashboard | Partial | Token sync only. |
| Patient List | Partial | Filter-by-therapist; no search article. |
| Patient Detail Overview | Partial | Tags + therapist assignment; no patient creation flow. |
| Reimbursement Tab | **Well covered** | |
| Documents & Reports | Partial | Upload/search only. |
| Session History | Partial | Per-patient list only. |
| Invoice Overview | **Well covered** | |
| Batch Invoicing (Verzamelstaten) | **Well covered** | |
| Session Billing Screen | **Well covered** | |
| Certificate Print Modal | **Well covered** | |
| Commission Overview | Partial | View / generate only; commission editing fragmented across files. |
| General Practice Settings | **Well covered** | |
| Email Template Editor | Partial | Selection + color only; no template authoring. |
| Subscription Management | **Well covered** | |
| Nomenclature / Tariff Settings | **Not covered** | |

## Concepts present in helpdesk but missing from `application_map.md`

These are real product features the helpdesk documents but the functional spec does not list. They should either be folded into an existing grouping or get their own entry on the next revision of the application map. **Code-read verdicts added 2026-04-07** — each item now indicates whether the feature actually exists in code.

1. Matrix-printer hardware integration (driver setup, model selection). — ✅ exists in code, see [`from_source/features/certificate_printing.md`](from_source/features/certificate_printing.md).
2. RIZIV convention version tracking (compliance rules tied to a dated convention). — ✅ exists, hard-coded date cascades in `Events.getPrices()` and `riziv` module.
3. Tariff-indexation patient communication (templated price-change notices). — ❌ **not a code feature**. Tariff updates ship as code releases. `practice.ownTariffs` toggle in `lib/formSchemas/practices/accessibility.jsx:46-60` is dead UI. See [`from_source/features/tariff_indexation.md`](from_source/features/tariff_indexation.md).
4. School / care coordinator metadata on pediatric patient dossiers. — ✅ exists on the patient file schema.
5. Therapeutic goal hierarchy (main goals + sub-goals). — ✅ exists, see [`from_source/features/long_term_therapy_plan.md`](from_source/features/long_term_therapy_plan.md). 11 categories, sub-goals via `parentId`.
6. Practice chat (inter-therapist messaging, toggleable). — ✅ exists. **Helpdesk implication corrected**: chat is open to all three roles (owner / admin / default), not owner-only. See [`from_source/features/practice_chat.md`](from_source/features/practice_chat.md).
7. R-waarde tracking (RIZIV time-equivalent metric distinct from session count). — ✅ exists, derivation table including 2023-05-01 group-sitting rate change in [`from_source/features/r_waarden.md`](from_source/features/r_waarden.md).
8. Private (non-billable, hidden) appointments. — ✅ exists as event type 3 (PRIVATE), see [`from_source/features/event_types.md`](from_source/features/event_types.md).
9. Per-disorder commission overrides. — ✅ exists via `specificAmounts` array, see [`from_source/features/commissions.md`](from_source/features/commissions.md).
10. Appointment-type color coding. — ✅ exists, configurable per-user in `agendaSettings`.
11. Read-only iCal export to Google Calendar / Outlook (distinct from Rosa write-sync). — ✅ exists, REST endpoint `/api/agenda/{public|private}/{key}`.
12. Aanvullende verzekering (supplemental insurance) as a separate reimbursement plan type. — ✅ exists in `treatments` schema.
13. External session counting (sessions completed at other practices counted toward the same bracket). — ✅ exists via `hasPayBack` flag with a complex demotion cascade in [`from_source/features/event_payback.md`](from_source/features/event_payback.md).
14. Three-tier role model (owner / beheerder / lid) with differing financial visibility. — ✅ correct, and `patientFileUsers` adds a second per-file RBAC layer that is OR-combined with the practice-level matrix (intentional additive design — per-file grants top up access for users whose practice role would not otherwise allow it). See [`from_source/features/practice_user_roles.md`](from_source/features/practice_user_roles.md).
15. Two-level invoice comments (global per-praktijk vs. per-dossier). — ❌ **not in code**. Only practice-level (`settings.invoices.remark`) and user-level (`invoices.personalNote`) exist. No per-dossier field.
16. Aanbrengbonus referral program (one free month per converted referral). — ✅ exists, full state machine in [`from_source/features/referral_programme.md`](from_source/features/referral_programme.md). **Note**: `referrals` / `referrals.invite` permissions are declared but never enforced — the programme is de facto open to all logged-in users.
17. Per-praktijk invoice language (NL / FR), separate from per-user UI language. — ✅ exists via `settings.invoices.locale`. **Bug found**: structured-announcement uses `user.locale()` (therapist's locale) instead — flag for product validation.

### Net-new concepts found in code (not in helpdesk and not in `application_map.md`)

These were discovered during the code-read pass and should be considered for the next `application_map.md` revision:

1. **Main dashboard widget grid** with statistics band (today's list, weekly bar chart, busiest/quietest/average) and 4-cell grid (notifications, open bills, todos, newsfeed). Not customizable, not role-aware.
2. **In-app notification centre** with `new`/`seen`/`read` states, navbar bell, dashboard alert tile, and `/notifications` page.
3. **System-wide newsfeed** with bilingual NL/FR content. **No author UI exists** — content is seeded outside the app.
4. **Per-user todos** scoped strictly by `userId`.
5. **Team meetings** — collection + i18n + role permission exist, but the entire feature is **scaffold-only**: no methods, no publications, no routes, no live UI. The `TeamMeetingBox` is commented out behind a `ComingSoon` overlay.
6. **Demand-form PDF generator** — per-locale stock PDFs (`form_standard_<locale>.pdf`) and per-treatment-type variants for non-standard treatment types.
7. **Group events** — multi-patient sessions via `groupId` fan-out. Recurrence not allowed.
8. **Recurring events** — `repeatId`/`repeatDates` with a series-edit whitelist and "remove from this date forward" semantics.
9. **Patient file merge** — `mergePatientFileInto`. Rosa-coupled; silently no-op without Rosa.
10. **Per-file RBAC** — `patientFileUsers` defines an additive per-file permission matrix that is OR-combined with the practice-level matrix at check time. Intentional: per-file grants top up access; they cannot revoke practice-level access.
11. **Email delivery tracking** — `emails` collection with `SENT`/`BOUNCED`/`FAILED`/`UNKNOWN` status, AWS SES + nodemailer transport. Only invoice emails are tracked.
12. **Client-side error logging** to a `clientErrors` collection.
13. **Method audit log** — but **failures only**, not a true audit log.
14. **PDF generation pipeline** — `html-pdf` (PhantomJS, dead-since-2018 dependency). Used for every PDF in the product.
15. **Belgian ZIP code lookup** — bundled ~2700-row JSON, case-sensitive substring scan. `getZipCodesByCounty` is a misnomer (filters by city).
16. **Admin impersonation** — `impersonateUser` method exists but is dormant: zero callers, no UI, must be invoked via browser console / Meteor shell. Bypasses `LoggedInValidatedMethod` and therefore the audit log.
17. **iCal feed REST endpoint** at `/api/agenda/{public|private}/{key}` — distinct from Rosa.

## Quality issues to fix during restructuring

### Helpdesk source quality

- **~200 broken Zendesk image URLs** of the form `https://halingo.zendesk.com/hc/article_attachments/...`. Need to be re-pointed at `assets/` (where the binaries already exist under numeric IDs without extensions).
- **~20 absolute Zendesk article links** in source files. Replace with relative anchors when articles are moved into `manual/`.
- **Duplicates**: the tariff-indexation article exists nearly verbatim in both `general_getting_started.md` and `patient_management.md`; commission articles are scattered across three files; the Chrome / Firefox / Edge printing articles are ~70% identical.
- **Excessive blank lines** (4–6 in a row) throughout — Zendesk export artifact.
- **HTML entity artifacts** (`&amp;`, `&gt;`) embedded in Dutch prose.
- **Promotional boilerplate** (`Probeer Halingo gratis`) inside reference articles.

### Codebase issues surfaced during the code-read pass (2026-04-07, post-triage)

These are not documentation issues — they are findings about the live source code at `/home/tj/Repos/Halingo-Main` that surfaced while writing `from_source/`. The full canonical lists are in [`from_source/bugs_and_security_findings.md`](from_source/bugs_and_security_findings.md) (14 items, post product-owner triage) and [`from_source/deprecation_list.md`](from_source/deprecation_list.md) (22 cleanup entries). Highlights:

- **Confirmed authorization bugs (3)**: `notifications.delete` has no `userId` scoping (Q3); `practiceInvitations` publication has no auth check (Q4); `referrals` permissions are declared but never enforced (Q5). All three confirmed by the product owner as bugs that need fixing.
- **Security-relevant (5)**: `pdf.generate` accepts arbitrary HTML with no admin check (SSRF vector); document download URLs leak `userId` in the query string; non-PDF/non-image office docs are rendered via Google Docs Viewer (URL with `userId` sent to Google); embedded test Stripe public key in `PracticeSubscriptionInvoicePaymentPage.jsx:17`; `admin_impersonation` is dormant and scheduled for removal but until then bypasses the audit log.
- **Schema validation silently bypassed (3)**: `stripeInvoices` SimpleSchema attachment is commented out; `practiceUsers/methods.jsx` has a typo `SimpleSchema.RegEx.id` (lowercase) on five parameters; `EmailType`/`EmailStatus` TypeScript unions don't match SimpleSchema `allowedValues`.
- **Functional bugs (4)**: `patientFileReports/server/publications.jsx:18` passes the entire report doc as `patientFileId`; `commissionInvoice` publication selector overwrites instead of `$or`-ing; `DashboardTop` Mon-Sat range with 7-day counts; `clientErrors.createdAt` field/index mismatch.
- **Operational hygiene (3)**: `SyncedCron.config({ log: false })` — no scheduled-job audit trail (distinct from `MethodLogger`, which was disabled intentionally); `html-pdf` / PhantomJS used everywhere (dead-since-2018 dependency, fiber-blocking sync); `console.log("WTF")` left in `subscriptions/methods.jsx:76`.

### Confirmed for removal (cleanup backlog)

The product owner's answers identified 22 items for removal. Highlights:

- **🔥 Features being killed product-wide**: practice chat (barely used), `users.delete` method (no UI, GDPR self-deletion not planned), `admin_impersonation` (security-relevant).
- **🧹 Dead code safe to delete**: `app/imports/modules/monkey-calendar/` folder, `app/imports/code_export.txt` build artefact, `app/lib/methods.js` and `app/lib/routes.jsx` scaffolding stubs, `patientFileUsers.roles.owner` (unused), `practice.subscriptions.change` permission constant, `LongTherapyPlan.therapistId` field, `practice.ownTariffs` toggle, stub `/referrals/` page, `getInvoiceStatistics`/`latestInvoiceDate` orphan methods, `MeetingEvent` description-on-create field, stale `util.jsx` imports of `Events` instead of `Notifications`, `console.log("WTF")`.
- **🪦 Legacy — do not port to mono repo**: the entire `app/imports/migrations/` folder (replace with admin functions), `MethodLogger` (intentionally disabled, design fresh in mono repo), `practices.settings.invoices.locale` per-praktijk invoice language (user locale is canonical), the 3-day account-lock heuristic (mono repo enforces validation upstream), `team_meetings` scaffold (abandoned).
- **↪️ Move to mono repo backend-stack**: the 5-minute Rosa pull `setInterval` (should be a lambda function); `Events.getPrices()` tariff cascade (should eventually be DB-stored, but migration is deferred).

### Retracted from earlier draft

For the historical record: the following items were listed in the 2026-04-06 "Quality issues" draft but have been retracted after the product-owner triage:

- "Permission whitelist is disjunctive" — intentional additive design.
- "`patientFileUsers.admin` ≡ `patientFileUsers.default`" — admin actually has the access-management permission that default does not (Q1).
- "`practice.subscriptions.select` checks `.resume`" — `.resume` is fine (Q6).
- "Structured-announcement uses user locale instead of practice locale" — user locale is canonical (Q11/Q25).
- "MeetingEvent description on create dropped" — feature being killed (Q9).
- "401 on colleague calendar" — intentional validation (Q8).
- "Max 2 video/week disabled" — was temporary (Q10).
- "TeamMeeting.filters static now" — feature abandoned (Q12).
- "MethodLogger only failures" — disabled intentionally (Q22).
- "Hard-coded data-fix migrations" + "empty v47 migration" — migrations deprecated entirely (Q24/Q31).
- "`treatment.can.be.removed` parameter mismatch" — "It's fine" (Q16).
