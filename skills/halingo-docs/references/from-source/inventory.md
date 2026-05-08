# From-source inventory

Master cross-reference of every feature documented in this folder, mapped against the 20 functional groupings in `../functional/application_map.md` and the helpdesk audit in `../coverage_matrix.md`.

> **Status:** populated 2026-04-07 from a scout pass plus eight per-area deep-dive agents that read `/home/tj/Repos/Halingo-Main` end-to-end. **Triaged 2026-04-07** against the product owner's answers to [`open_questions.md`](open_questions.md) — many earlier "bugs" turned out to be intentional design or scheduled-for-removal features. Each per-feature claim in the linked pages has a `file:line` citation back to the source.

> **Two new artefacts came out of the triage:**
> - [`deprecation_list.md`](deprecation_list.md) — the canonical cleanup backlog: features being killed product-wide, dead code safe to delete, legacy code not to port to the mono repo, and code that should move to the mono repo backend-stack. 22 entries with file:line.
> - [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — re-triaged: dropped from ~40 items to 14 (5 security, 3 confirmed authorization bugs, 4 functional bugs, 3 schema-drift, 3 hygiene). The retraction summary at the bottom of that file lists every item that was dropped and where it landed.

## Statistics

| Metric | Value |
|---|---:|
| Documentation files written | **63** (60 from the initial pass + 3 added during 2026-04-07 triage: `deprecation_list.md`, `open_questions.md`, this file's expanded sections) |
| Total lines of documentation | ~16,200 |
| Largest single file | `features/nomenclature_codes.md` (575 lines) |
| MongoDB collections found | **28** (scout pass said 22 — three FilesCollections plus three more were missed) |
| Named FlowRouter routes | **36** + home + catch-all + unnamed `/invitations/accept/:token` |
| Meteor methods documented | **138** |
| Meteor publications documented | **40** + 4 `Counts.publish` channels |
| Migrations | **47** |
| Background jobs | **5** |
| REST endpoints | **4** (Stripe webhook, two stripe-invoice routes, iCal feed) |

## Coverage matrix update — quick view

Before / after, for the 20 functional groupings in `../functional/application_map.md` §2:

| # | Grouping | Helpdesk audit | After code reading |
|---:|---|---|---|
| 1 | Identity Management | ✅ Well covered | ✅ Well covered + RBAC matrix added |
| 2 | Practice Branding | ✅ Well covered | ✅ Well covered |
| 3 | Patient Data Privacy | ❌ Not covered | **❌ Confirmed empty in code** — see [`gaps/03_patient_data_privacy.md`](gaps/03_patient_data_privacy.md) |
| 4 | Waitlist Optimization | ❌ Not covered | **❌ Confirmed empty in code** — no `Waitlist`, `Queue`, `Intake` model exists |
| 5 | Multi-View Scheduling | ✅ Well covered | ✅ Well covered + recurring/group/payback documented |
| 6 | Treatment Planning | 🟡 Partial | ✅ Filled — see [`features/treatments_and_bilans.md`](features/treatments_and_bilans.md) and [`features/long_term_therapy_plan.md`](features/long_term_therapy_plan.md) |
| 7 | Reimbursement Tracking | ✅ Well covered | ✅ Well covered + session-counting math formalised |
| 8 | Compliance Monitoring | ✅ Well covered | ✅ Well covered + nomenclature matrix quoted from code |
| 9 | Clinical Reporting | 🟡 Partial | 🟡 Still partial — rich-text editor exists; no signature workflow, no structured forms beyond demand forms |
| 10 | Document Digitization | ✅ Well covered | ✅ Well covered + S3 storage layer documented |
| 11 | Smart Invoicing | ✅ Well covered | ✅ Well covered |
| 12 | Payment Lifecycle | ✅ Well covered | ✅ Well covered + Stripe webhook plumbing documented |
| 13 | Debt Collection | 🟡 Partial | 🟡 Still partial — only invoice-reminder email type; no escalation, no SMS |
| 14 | Mutualistic Billing | ✅ Well covered | ✅ Well covered |
| 15 | Precision Printing | ✅ Well covered | ✅ Well covered + 484×1311 px coordinate system documented |
| 16 | Patient Communication | 🟡 Partial | **❌ Worse than expected** — no appointment reminders to patients exist at all |
| 17 | Telehealth Integration | ✅ Well covered | ✅ Well covered + hardcoded `VideoConsultationCode = 792433` documented |
| 18 | External Platform Sync | 🟡 Partial | ✅ Filled — Rosa is **bidirectional** (5-min cron pull + push), not OAuth2 (long-lived integration token) |
| 19 | Practice Analytics | ❌ Not covered | **🟡 Partial** — five inline statistics methods + four chart screens exist, but no analytics module, no exports, no forecasting. See [`gaps/19_practice_analytics.md`](gaps/19_practice_analytics.md) |
| 20 | SaaS Lifecycle | ✅ Well covered | ✅ Well covered + Bancontact vs Stripe flows fully documented |

**Net change**: 14 → 15 well covered. 4 → 3 partial. 2 → 2 hard gaps (waitlist + GDPR confirmed empty). 1 grouping (#19 Practice Analytics) moved from "Not covered" to "Partial" because code has more than helpdesk admitted.

## Index by functional grouping

### 1 — Identity Management
- [`features/identity_and_authentication.md`](features/identity_and_authentication.md) — register, login, password reset, email verification, ToC, account deletion. 30-min token TTL, 3-day account-lock heuristic. **No 2FA, no SSO.**
- [`features/user_profile.md`](features/user_profile.md) — `UserProfile` + `UserSettings` schemas, `updateProfile` semantics, certificate booklet numbering, commission-invoice rename hook.
- [`features/invitations.md`](features/invitations.md) — practice staff onboarding, token lifecycle, upsert-on-resend.

### 2 — Practice Branding
Covered implicitly across [`features/saas_subscriptions.md`](features/saas_subscriptions.md) and [`features/patient_invoices.md`](features/patient_invoices.md) (which document the practice settings: logo, accent colour, invoice template, communication structure). Helpdesk's coverage of this grouping is already strong.

### 3 — Patient Data Privacy *(gap, confirmed empty in code)*
- [`gaps/03_patient_data_privacy.md`](gaps/03_patient_data_privacy.md) — the headline gap-fill. **Confirms** the helpdesk gap from code: no data export, soft-delete only, no consent capture, no audit trail, no retention policy, no field-level encryption, `users.delete` doesn't cascade, document URLs leak `userId`.

### 4 — Waitlist Optimization *(gap, confirmed empty in code)*
No code feature exists. Grep confirmed: no `Waitlist`, `Queue`, `Intake`, `Priority` model. Not documented as a separate gap file because there is literally nothing in code to describe.

### 5 — Multi-View Scheduling
- [`features/calendar_overview.md`](features/calendar_overview.md) — D/W/M/customRange views, drag-drop, multi-therapist view with privacy split, day-header bulk delete.
- [`features/agenda_settings.md`](features/agenda_settings.md) — per-user view preferences, `events_outside_of_constraints` confirm flow, iCal feed.
- [`features/event_types.md`](features/event_types.md) — APPOINTMENT / MEETING / PRIVATE / CONSULTATION dispatch.
- [`features/group_events.md`](features/group_events.md) — multi-patient sessions via `groupId` fan-out (no recurrence allowed).
- [`features/recurring_events.md`](features/recurring_events.md) — `repeatId` / `repeatDates`, series-edit whitelist, "remove from this date forward".
- [`features/event_payback.md`](features/event_payback.md) — `_canBePaidBack` decision tree, demotion cascade.
- [`features/team_meetings_in_calendar.md`](features/team_meetings_in_calendar.md) — MEETING type, the hard 401 when creating on a colleague's calendar.

### 6 — Treatment Planning
- [`features/treatments_and_bilans.md`](features/treatments_and_bilans.md) — `Treatments` schema, 18 types, `getDisorderSessions`, `getDisorderCodes`, bilan ordering, CRUD methods, `TreatmentDateObserver` and `TreatmentSessionObserver` cron jobs.
- [`features/long_term_therapy_plan.md`](features/long_term_therapy_plan.md) — 11 categories quoted verbatim, sub-goal hierarchy.
- [`features/clinical_reports.md`](features/clinical_reports.md) — rich-text editor, demand-form PDF generator with per-locale templates.

### 7 — Reimbursement Tracking
- [`features/riziv_compliance.md`](features/riziv_compliance.md) — rules engine, treatment taxonomy, registry, age limits.
- [`features/session_counting.md`](features/session_counting.md) — precise math: `INITIAL_BILAN = Math.ceil(min/30)`, `RELAPSE = min/30` no ceil, `SESSION = 1 or 2 by subType`.
- [`features/r_waarden.md`](features/r_waarden.md) — derivation table including 2023-05-01 group-sitting rate change.
- [`features/event_payback.md`](features/event_payback.md) — external session counting toward bracket.

### 8 — Compliance Monitoring
- [`features/riziv_compliance.md`](features/riziv_compliance.md) — De Conventie rules engine.
- [`features/nomenclature_codes.md`](features/nomenclature_codes.md) — full quoted code matrix for every disorder × type × subType × location.

### 9 — Clinical Reporting *(still partial)*
- [`features/clinical_reports.md`](features/clinical_reports.md) — rich-text reports, tag, treatment linkage, demand-form PDF generation.
- [`features/patient_documents.md`](features/patient_documents.md) — uploaded PDFs/images, S3 storage layer, Google Docs Viewer fallback.

> Still missing: signature workflow, structured assessment forms beyond stock demand forms, template authoring.

### 10 — Document Digitization
- [`features/patient_documents.md`](features/patient_documents.md) — upload, tagging, search, S3 with **non-presigned download URLs that leak `userId`**.

### 11 — Smart Invoicing
- [`features/invoices_overview.md`](features/invoices_overview.md) — orientation map of the 5 sub-modules.
- [`features/patient_invoices.md`](features/patient_invoices.md) — full `patientFileInvoices` deep dive (largest file in the set).

### 12 — Payment Lifecycle
- [`features/payment_reconciliation.md`](features/payment_reconciliation.md) — manual + Stripe-webhook state-flip flows.
- [`features/patient_invoices.md`](features/patient_invoices.md) — Open / Unpaid / Partially Paid / Printed / Mailed / Paid state machine.

### 13 — Debt Collection *(still partial)*
- [`features/email_delivery.md`](features/email_delivery.md) — only `PATIENT_INVOICE_REMINDER` exists. No SMS, no escalation, no collection-agency hooks.

### 14 — Mutualistic Billing
- [`features/insurance_invoices.md`](features/insurance_invoices.md) — Verzamelstaten, CG1/CG2, INSZ.

### 15 — Precision Printing
- [`features/certificate_printing.md`](features/certificate_printing.md) — matrix-printer pipeline, manual vs printer modes, 484×1311 px coordinate system.
- [`features/pdf_generation.md`](features/pdf_generation.md) — `html-pdf` (PhantomJS) pipeline.

### 16 — Patient Communication *(worse than expected)*
- [`features/email_delivery.md`](features/email_delivery.md) — only invoice-related emails go to patients.
- [`features/email_templates.md`](features/email_templates.md) — only template *selection* (4 hard-coded React components), no authoring.

> **Confirmed worse than helpdesk implies**: there is no appointment-reminder email type at all. No scheduled job notifies patients of upcoming sessions. The only crons that touch patients are billing-related.

### 17 — Telehealth Integration
- [`features/telehealth_consultation.md`](features/telehealth_consultation.md) — event type 4, hardcoded `VideoConsultationCode = 792433`, no meeting-link generation in code.

### 18 — External Platform Sync
- [`features/rosa_integration.md`](features/rosa_integration.md) — full picture: **bidirectional** (5-min cron pull + real-time push), long-lived integration token, every API endpoint with DTO, conflict rules, v28–v32 migrations.

### 19 — Practice Analytics
- [`gaps/19_practice_analytics.md`](gaps/19_practice_analytics.md) — gap-fill that **partially closes** the gap: five inline statistics methods + four chart screens documented, plus an explicit "gap inside the gap" listing what's still missing (forecasting, exports, KPI thresholding, therapist ranking, cohort analysis, Ziekenfonds-level analytics, aging buckets, utilisation).
- [`features/main_dashboard.md`](features/main_dashboard.md) — DashboardTop statistics band + 4-cell widget grid.
- [`features/financial_overview.md`](features/financial_overview.md) — `/financial` screen, EarningsGraph, the analytics-style "Overzicht sessies" sub-view with three doughnuts.

### 20 — SaaS Lifecycle
- [`features/saas_subscriptions.md`](features/saas_subscriptions.md) — full lifecycle, trial, Bancontact vs Stripe, plan change, payment method change, cancel/resume, the four `/practices/subscription/...` routes, NewPracticePage wizard. *Longest file in the identity batch.*
- [`features/stripe_invoices.md`](features/stripe_invoices.md) — SaaS-side invoice collection (custom collection class).
- [`features/referral_programme.md`](features/referral_programme.md) — INVITED → REGISTERED → PAID → CONSUMED state machine.

## Cross-cutting features (not tied to a single grouping)

These pages document features that span multiple groupings or live below them:

- [`features/patient_files.md`](features/patient_files.md) — the master patient dossier (touches groupings 3, 5, 6, 9, 10, 11, 14).
- [`features/patient_creation.md`](features/patient_creation.md) — the creation flow (helpdesk gap fill).
- [`features/patient_merge.md`](features/patient_merge.md) — `mergePatientFileInto`, Rosa-coupled.
- [`features/patient_file_access_control.md`](features/patient_file_access_control.md) — per-file RBAC matrix.
- [`features/practice_user_roles.md`](features/practice_user_roles.md) — **the centrepiece role matrix**: 62 permissions × 3 roles, with file:line citations. Documents the intentional two-layer design (`practiceUsers` + `patientFileUsers`) where the per-file matrix is additive on top of the practice-level matrix.
- [`features/practice_user_management.md`](features/practice_user_management.md) — staff management UI.
- [`features/commissions.md`](features/commissions.md) — commission *configuration* (CommissionSchema, types, debounced retroactive rewrite hook).
- [`features/commission_invoices.md`](features/commission_invoices.md) — commission *invoicing* (state machine, settlement).

## Net-new findings (not in helpdesk and not in `application_map.md`)

These are features that exist in code but were not in either the helpdesk source or the functional spec. They are candidates for the next revision of `application_map.md`:

| # | Feature | Page | Status |
|---:|---|---|---|
| 1 | Main dashboard widget grid | [`features/main_dashboard.md`](features/main_dashboard.md) | Live, not customizable, not role-aware |
| 2 | In-app notification centre | [`features/in_app_notifications.md`](features/in_app_notifications.md) | Live; **`notifications.delete` security bug confirmed (Q3)** — see [`bugs_and_security_findings.md`](bugs_and_security_findings.md) |
| 3 | System-wide newsfeed | [`features/newsfeed.md`](features/newsfeed.md) | Live; **content seeded directly via `meteor mongo`** (Q19) — no author UI by design |
| 4 | Per-user todos | [`features/todos.md`](features/todos.md) | Live |
| 5 | Practice chat | [`features/practice_chat.md`](features/practice_chat.md) | **🔥 Scheduled for removal (Q26)** — barely used; see [`deprecation_list.md` #1](deprecation_list.md) |
| 6 | Team meetings (collection + i18n) | [`features/team_meetings.md`](features/team_meetings.md) | **🪦 Abandoned (Q12)** — safe to delete; see [`deprecation_list.md` #20](deprecation_list.md) |
| 7 | Long-term therapy goal hierarchy | [`features/long_term_therapy_plan.md`](features/long_term_therapy_plan.md) | Live, sub-goals via `parentId` |
| 8 | Demand-form PDF generator | [`features/clinical_reports.md`](features/clinical_reports.md) | Per-locale stock PDFs + per-treatment-type variants |
| 9 | Group events (multi-patient sessions) | [`features/group_events.md`](features/group_events.md) | Live, recurrence not allowed |
| 10 | Recurring events | [`features/recurring_events.md`](features/recurring_events.md) | Live, series-edit whitelist |
| 11 | External session payback (`hasPayBack`) | [`features/event_payback.md`](features/event_payback.md) | Live, complex demotion cascade |
| 12 | Per-disorder commission overrides | [`features/commissions.md`](features/commissions.md) | Live |
| 13 | Patient file merge | [`features/patient_merge.md`](features/patient_merge.md) | Rosa-coupled, silent no-op without Rosa |
| 14 | Per-file RBAC matrix | [`features/patient_file_access_control.md`](features/patient_file_access_control.md) | Live, additive on top of practice-level RBAC by design |
| 15 | Practice-level RBAC matrix | [`features/practice_user_roles.md`](features/practice_user_roles.md) | 62 permissions × 3 roles, OR-combined with per-file matrix |
| 16 | Email delivery tracking | [`features/email_delivery.md`](features/email_delivery.md) | SES + nodemailer, bounce/failure status, only invoices |
| 17 | Client error logging | [`features/client_error_logging.md`](features/client_error_logging.md) | Write-only, `createdAt` field bug |
| 18 | Method audit log | [`features/method_audit_log.md`](features/method_audit_log.md) | **Intentionally disabled (Q22)** — not a bug; failures-only by design |
| 19 | PDF generation pipeline | [`features/pdf_generation.md`](features/pdf_generation.md) | `html-pdf` (PhantomJS, dead since 2018) |
| 20 | Belgian ZIP code lookup | [`features/belgian_zip_code_lookup.md`](features/belgian_zip_code_lookup.md) | Bundled ~2700-row JSON, case-sensitive substring scan |
| 21 | Admin impersonation | [`features/admin_impersonation.md`](features/admin_impersonation.md) | **🔥 Scheduled for removal (Q23)** — security warning until then; see [`deprecation_list.md` #3](deprecation_list.md) |
| 22 | Per-praktijk invoice language | [`features/patient_invoices.md`](features/patient_invoices.md) | **🪦 Deprecated (Q11/Q25)** — user locale is canonical; see [`deprecation_list.md` #18](deprecation_list.md) |

## Confirmed gaps (no code feature exists)

Where the helpdesk audit said "Not covered" and the code reading **confirms** there is genuinely nothing in the codebase:

| Topic | Functional grouping | Confirmation |
|---|---|---|
| Patient data privacy / GDPR / right-to-erasure | #3 | [`gaps/03_patient_data_privacy.md`](gaps/03_patient_data_privacy.md) |
| Waitlist / intake queue | #4 | No `Waitlist`/`Queue`/`Intake`/`Priority` model in code |
| Vacation / blocked time | (calendar gap) | [`features/calendar_overview.md`](features/calendar_overview.md) — workaround is MEETING/PRIVATE events |
| Patient appointment reminders | #16 | [`features/calendar_overview.md`](features/calendar_overview.md) — only invoice emails go to patients |
| Email template authoring | #16 | [`features/email_templates.md`](features/email_templates.md) — only selection from 4 hard-coded React components |
| Tariff indexation as a code feature | #11/#16 | [`features/tariff_indexation.md`](features/tariff_indexation.md) — tariff updates ship as code releases; `practice.ownTariffs` toggle is dead UI |
| Two-level (per-dossier) invoice comments | (helpdesk concept #15) | [`features/patient_invoices.md`](features/patient_invoices.md) — only practice-level + user-level exist |
| Forecasting, KPI thresholding, exports, scheduled reports | #19 | [`gaps/19_practice_analytics.md`](gaps/19_practice_analytics.md) — "gap inside the gap" section |
| Cohort analysis, therapist ranking, Ziekenfonds-level analytics, aging buckets, utilisation | #19 | Same |

## Bugs and security findings (post-triage)

> The full triage list is in [`bugs_and_security_findings.md`](bugs_and_security_findings.md), which also contains the retraction summary for items removed during the 2026-04-07 product-owner triage. Below is a quick view; consult the dedicated file for the canonical engineering backlog.

### Confirmed authorization bugs (4 — post-triage)

These four were confirmed by the product owner as bugs that need fixing:

- **`notifications.delete` no `userId` scoping** — `app/imports/api/notifications/methods.js:36-38`. Q3: "should idd be scoped to userId".
- **`practiceInvitations` publication has no auth check** — anyone with a `practiceId` can list pending invitations. Q4: "should idd be scoped".
- **`referrals` / `referrals.invite` permissions are declared but never enforced**. Q5: "should idd be scoped to practice owner".
- **Frontend-only access control on `patientFileUsers` ACL management** — Q1 clarified: "the frontend blocks the .default as no button is available to do the action, the backend didnt block it thats a bug". The intended `admin`-only ACL management is enforced cosmetically; a `default` per-file user can call the grant/revoke methods directly. **This is a class of bug**: any place in the codebase that hides a button for "missing permission" without also calling `checkPermission` server-side has the same shape — worth a focused audit.

> Retracted: `.select` checks `.resume` (Q6: ".resume is fine"); `.change` declared but unused (Q7: dead code, [`deprecation_list.md` #8](deprecation_list.md)); disjunctive whitelist (intentional additive design — separate from the frontend-only ACL bug above).

### Security-relevant (post-triage)

- **`pdf.generate` accepts arbitrary HTML with no admin check** — SSRF vector via embedded `<img>` tags pointing at internal hosts.
- **`admin_impersonation` exists, dormant** — `app/imports/api/shared/methods.js:49-71`. **Scheduled for removal** (Q23) — see [`deprecation_list.md` #3](deprecation_list.md). Until removed, the warning stands: bypasses `LoggedInValidatedMethod`, gated only by global `Meteor.users.roles.indexOf('admin') !== -1`, no audit, no banner.
- **Document download URLs leak `userId` in query string** — self-acknowledged TODO in `documentsConfig.js`.
- **Google Docs Viewer fallback** for non-PDF/non-image office docs sends the document URL (with `userId`) to Google.
- **Embedded test Stripe public key** in `PracticeSubscriptionInvoicePaymentPage.jsx:17` — production-facing file.

### Schema / validation issues

- **`stripeInvoices` SimpleSchema attachment is commented out** — `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx:131`. Collection silently bypasses validation entirely.
- **Latent typo `SimpleSchema.RegEx.id` (lowercase)** in `practiceUsers/methods.jsx` lines 13/14/29/30/51 — schemas don't validate the ID format on those parameters.
- **`EmailType` / `EmailStatus` TypeScript unions don't match the SimpleSchema `allowedValues`** — drift between the two definitions.

### Functional bugs (4 — post-triage)

- **`patientFileReports/server/publications.jsx:18` passes the entire report doc as `patientFileId`** — broken publication.
- **`commissionInvoice` publication selector overwrites instead of `$or`-ing** — owners with `practice.commission.view` cannot see their own commission rows.
- **`DashboardTop` Mon–Sat range with 7-day counts** — possible off-by-one in the busiest/quietest computation.
- **`clientErrors.createdAt` field bug** — index/field mismatch.

> The earlier draft listed 5 additional bugs here. All have been retracted: structured-announcement locale (intentional — user locale is canonical, see [`halingo_locale_rule.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md)), MeetingEvent description (feature being killed, [`deprecation_list.md` #14](deprecation_list.md)), 401 on colleague calendar (intentional validation), max-2-video disabled (was temporary), TeamMeeting.filters static now (whole feature abandoned, [`deprecation_list.md` #20](deprecation_list.md)).

### Operational hygiene (post-triage)

- **`SyncedCron.config({ log: false, logger: () => {} })`** — production has no audit trail of scheduled-job executions. (Distinct from the intentionally-silenced `MethodLogger`; see retraction below.)
- **`html-pdf` / PhantomJS** — dead-since-2018 dependency, fiber-blocking sync, used for every PDF in the product. **Tech debt; do not port to the mono repo.**

> Retracted: `MethodLogger` failures-only (Q22: disabled intentionally, see [`deprecation_list.md` #17](deprecation_list.md)); five hard-coded data-fix migrations + empty v47 (Q24/Q31: migrations deprecated entirely, see [`deprecation_list.md` #16](deprecation_list.md)).

### Dead code

All dead-code findings now live in [`deprecation_list.md`](deprecation_list.md). It is the canonical cleanup backlog with file:line for every entry, organized into 🔥 kill / 🧹 dead-code / 🪦 legacy / ↪️ move categories. **22 entries** total.

Highlights of the kill / dead-code categories (the engineering team can act on these immediately):

- 🔥 **Practice chat** — feature being killed; barely used (Q26).
- 🔥 **`users.delete` method** — being removed; GDPR self-deletion is not a planned feature (Q13).
- 🔥 **`admin_impersonation`** — should be removed (Q23). Until then, the security warning still applies.
- 🧹 **`monkey-calendar/`** folder — confirmed dead (Q38).
- 🧹 **`code_export.txt`** — build artefact, ignore/remove (Q28).
- 🧹 **`app/lib/methods.js`** + **`app/lib/routes.jsx`** — scaffolding stubs.
- 🧹 **`patientFileUsers.roles.owner`** — unused, can be removed (Q2).
- 🧹 **`practice.subscriptions.change`** permission — dead constant (Q7).
- 🧹 **`LongTherapyPlan.therapistId`** schema field — not used (Q18).
- 🧹 **`practice.ownTariffs`** toggle — feature got pulled (Q17).
- 🧹 Stub **`/referrals/`** page (Q14).
- 🧹 **`getInvoiceStatistics` / `latestInvoiceDate`** — abandoned analytics (Q15).
- 🧹 **`MeetingEvent` description-on-create field** — feature unused (Q9).
- 🧹 **`console.log("WTF")`** in `subscriptions/methods.jsx:76`.

## Phantoms (helpdesk vs code disagreements)

Where the helpdesk text differs from what the code actually does:

| Helpdesk says | Code says | Verdict |
|---|---|---|
| Rosa is bidirectional | Rosa is bidirectional (5-min cron pull + real-time push) | ✅ Helpdesk correct (scout pass was wrong about push-only) |
| Rosa uses OAuth2 | User pastes a long-lived integration token, no refresh | ❌ Helpdesk wrong |
| Two-level invoice comments (per-praktijk + per-dossier) | Only practice-level (`settings.invoices.remark`) + user-level (`invoices.personalNote`) | ❌ No per-dossier level |
| Tariff indexation feature | Tariff updates are hard-coded date cascades in `Events.getPrices()`; ship as code releases | ✅ Helpdesk technically correct (Q43) — indexation does happen, just via dated event pricing rather than a UI feature |
| Patient appointment reminders | No `APPOINTMENT_REMINDER` email type, no patient-side cron | ❌ Does not exist |
| Email template authoring | Picker over four hard-coded React components, plus per-template body text and instruction text | 🟡 Partial (Q44) — only **modification** is available, not authoring |
| 3-tier role hierarchy with differing financial visibility | Yes — and `patientFileUsers` adds an additive per-file layer (intentional) | ✅ Correct, with the additive layer worth documenting |
| Practice chat is owner/beheerder only | Chat permissions granted to all three roles (`owner`, `admin`, `default`) | 🟡 Q42: "It is meant as the owner can choose to disable/enable it" — moot since the feature is being killed (Q26) |

## File index (alphabetical)

### `features/` — 53 files

| File | Lines | Topic |
|---|---:|---|
| `admin_impersonation.md` | 126 | Dormant security-relevant method |
| `agenda_settings.md` | 130 | Per-user calendar preferences |
| `belgian_zip_code_lookup.md` | 139 | Bundled ZIP/city dataset |
| `calendar_overview.md` | 151 | Day/week/month/customRange views |
| `certificate_printing.md` | 278 | Matrix-printer pipeline |
| `client_error_logging.md` | 162 | Browser-side error capture |
| `clinical_reports.md` | 230 | Rich-text reports + demand-form PDFs |
| `commission_invoices.md` | 344 | Commission state machine |
| `commissions.md` | 207 | Commission *configuration* |
| `email_delivery.md` | 252 | `emails` collection + SES |
| `email_templates.md` | 143 | Selection only, no authoring |
| `event_payback.md` | 162 | `hasPayBack` decision tree |
| `event_types.md` | 171 | APPOINTMENT/MEETING/PRIVATE/CONSULTATION |
| `financial_overview.md` | 185 | `/financial` screen |
| `group_events.md` | 145 | Multi-patient sessions |
| `identity_and_authentication.md` | 222 | `users` API |
| `in_app_notifications.md` | 228 | Notification centre |
| `insurance_invoices.md` | 281 | Verzamelstaten |
| `invitations.md` | 238 | Staff invite lifecycle |
| `invoices_overview.md` | 171 | Compound module map |
| `long_term_therapy_plan.md` | 225 | Goal hierarchy |
| `main_dashboard.md` | 134 | Dashboard widget grid |
| `method_audit_log.md` | 189 | Failures-only logger |
| `newsfeed.md` | 108 | System announcements |
| `nomenclature_codes.md` | **575** | RIZIV code matrix (largest file) |
| `patient_creation.md` | 192 | Creation flow |
| `patient_documents.md` | 269 | S3 storage layer |
| `patient_file_access_control.md` | 267 | Per-file RBAC |
| `patient_files.md` | 355 | Master dossier |
| `patient_invoices.md` | 435 | `patientFileInvoices` deep dive |
| `patient_merge.md` | 149 | Rosa-coupled merge |
| `payment_reconciliation.md` | 218 | Manual + Stripe webhook flows |
| `pdf_generation.md` | 173 | `html-pdf` / PhantomJS |
| `practice_chat.md` | 210 | Inter-therapist messaging |
| `practice_user_management.md` | 218 | Staff roster UI |
| `practice_user_roles.md` | 291 | 62-permission RBAC matrix |
| `r_waarden.md` | 262 | RIZIV time-equivalent metric |
| `recurring_events.md` | 189 | `repeatId` series |
| `referral_programme.md` | 369 | Aanbrengbonus |
| `riziv_compliance.md` | 434 | Rules engine |
| `rosa_integration.md` | 313 | Bidirectional sync |
| `saas_subscriptions.md` | 483 | Full SaaS lifecycle |
| `session_counting.md` | 199 | Session math |
| `shared_utilities.md` | 227 | Cross-cutting helpers |
| `stripe_invoices.md` | 333 | SaaS-side invoicing |
| `tariff_indexation.md` | 155 | "Not a code feature" stub |
| `team_meetings.md` | 149 | Scaffold only |
| `team_meetings_in_calendar.md` | 179 | MEETING event type |
| `telehealth_consultation.md` | 191 | Event type 4 |
| `todos.md` | 139 | Per-user task list |
| `treatments_and_bilans.md` | 262 | `Treatments` schema + observers |
| `user_profile.md` | 187 | Profile + settings |

### `gaps/` — 2 files

| File | Lines | Topic |
|---|---:|---|
| `03_patient_data_privacy.md` | 267 | GDPR gap fill (confirms emptiness) |
| `19_practice_analytics.md` | 261 | Analytics gap fill (partial close) |

### `technical/` — 7 files

| File | Lines | Topic |
|---|---:|---|
| `background_jobs.md` | 113 | 5 cron mechanisms |
| `collections.md` | **1294** | 28 collections, full schemas |
| `methods.md` | 376 | 138 methods, alphabetical |
| `migrations_timeline.md` | 123 | 47 migrations + feature timeline prose |
| `publications.md` | 81 | 40 publications + 4 `Counts.publish` |
| `rest_endpoints.md` | 50 | 4 HTTP endpoints |
| `routes.md` | 261 | 36 named routes + alphabetical index |

### Root — 6 files

| File | Topic |
|---|---|
| `README.md` | Folder purpose, conventions, layout |
| `inventory.md` | (this file) — master cross-reference |
| `scout_pass.md` | Raw output of the initial scout walkthrough |
| `bugs_and_security_findings.md` | Engineering triage list — 14 items post-2026-04-07 triage |
| `deprecation_list.md` | Canonical cleanup backlog — 22 entries (kill / dead-code / legacy / move) |
| `open_questions.md` | Questionnaire for the product owner — answered 2026-04-07 |
