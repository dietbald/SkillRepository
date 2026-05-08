# Feature index — alphabetical

Every Halingo feature in one alphabetical list. **Two layers**:

- **`spec`** — Phase 2 spec contract under `02-specs/<area>/<feature>/spec.md`. The contract used by Phase 4 porting.
- **`from-source`** — Phase 1 code-derived feature note under `references/from-source/features/<name>.md`. The legacy Meteor source description.

**Total entries**: 157 (105 spec features + 52 from-source features).

| Name | Kind | Area | Summary | Path |
|---|---|---|---|---|
| **admin_impersonation** | from-source | (legacy code-derived) | Admin impersonation — A `Meteor.methods({ impersonateUser })` definition is present at `app/imports/api/shared/methods.js:49-71`. It is server | `references/from-source/features/admin_impersonation.md` |
| **agenda-settings** | spec | scheduling | Feature: scheduling/agenda-settings — feature: scheduling/agenda-settings | `scheduling/agenda-settings/spec.md` |
| **agenda_settings** | from-source | (legacy code-derived) | Agenda settings — Per-user calendar preferences. Each record in the `agendaSettings` collection is keyed by `userId` (not by practice — th | `references/from-source/features/agenda_settings.md` |
| **belgian_zip_code_lookup** | from-source | (legacy code-derived) | Belgian ZIP code lookup — A two-method autocomplete API backed by a static JSON file of every Belgian ZIP code, the city it belongs to, and its la | `references/from-source/features/belgian_zip_code_lookup.md` |
| **bilan-lifecycle** | spec | treatment-planning | Feature: treatment-planning/bilan-lifecycle — feature: treatment-planning/bilan-lifecycle | `treatment-planning/bilan-lifecycle/spec.md` |
| **billing** | spec | saas | Feature: saas/billing — feature: saas/billing | `saas/billing/spec.md` |
| **calendar-views** | spec | scheduling | Feature: scheduling/calendar-views — feature: scheduling/calendar-views | `scheduling/calendar-views/spec.md` |
| **calendar_overview** | from-source | (legacy code-derived) | Calendar overview — The `agenda` screen is Halingo's operational heart: a day / week / month view of everything a therapist does (`Events.ty | `references/from-source/features/calendar_overview.md` |
| **certificate-management** | spec | smart-invoicing | Feature: smart-invoicing/certificate-management — feature: smart-invoicing/certificate-management | `smart-invoicing/certificate-management/spec.md` |
| **certificate-manual-mode** | spec | precision-printing | Feature: precision-printing/certificate-manual-mode — feature: precision-printing/certificate-manual-mode | `precision-printing/certificate-manual-mode/spec.md` |
| **certificate-numbering** | spec | precision-printing | Feature: precision-printing/certificate-numbering — feature: precision-printing/certificate-numbering | `precision-printing/certificate-numbering/spec.md` |
| **certificate-printer-mode** | spec | precision-printing | Feature: precision-printing/certificate-printer-mode — feature: precision-printing/certificate-printer-mode | `precision-printing/certificate-printer-mode/spec.md` |
| **certificate_printing** | from-source | (legacy code-derived) | Certificate printing — Halingo's *getuigschrift* printing flow puts a Belgian RIZIV `Getuigschrift voor verstrekte hulp` certificate onto a she | `references/from-source/features/certificate_printing.md` |
| **client_error_logging** | from-source | (legacy code-derived) | Client error logging — A very small server-side sink for JavaScript exceptions caught on the client. When a React component or a user action in | `references/from-source/features/client_error_logging.md` |
| **clinical_reports** | from-source | (legacy code-derived) | Clinical reports — A clinical report ("verslag") in Halingo is one of three things stored under the dossier's *Documenten* tab: | `references/from-source/features/clinical_reports.md` |
| **commission-invoicing** | spec | smart-invoicing | Feature: smart-invoicing/commission-invoicing — feature: smart-invoicing/commission-invoicing | `smart-invoicing/commission-invoicing/spec.md` |
| **commission-manual** | spec | payment-lifecycle | Feature: payment-lifecycle/commission-manual — feature: payment-lifecycle/commission-manual | `payment-lifecycle/commission-manual/spec.md` |
| **commission_invoices** | from-source | (legacy code-derived) | Commission invoices — A commission invoice is the **monthly statement of money owed by a group practice (the *praktijkverantwoordelijke*) to o | `references/from-source/features/commission_invoices.md` |
| **commissions** | from-source | (legacy code-derived) | Commissions (configuration) — A commission rule attached to a member of a group practice. When the practice books and invoices an appointment performe | `references/from-source/features/commissions.md` |
| **create-patient** | spec | patient | Feature: patient/create-patient — feature: patient/create-patient | `patient/create-patient/spec.md` |
| **create-practice** | spec | practice | Feature: practice/create-practice — feature: practice/create-practice | `practice/create-practice/spec.md` |
| **dashboard-weekly-activity** | spec | practice-analytics | Feature: practice-analytics/dashboard-weekly-activity — feature: practice-analytics/dashboard-weekly-activity | `practice-analytics/dashboard-weekly-activity/spec.md` |
| **dashboard-widget** | spec | debt-collection | Feature: debt-collection/dashboard-widget — feature: debt-collection/dashboard-widget | `debt-collection/dashboard-widget/spec.md` |
| **demand-form-generate** | spec | clinical-reporting | Feature: clinical-reporting/demand-form-generate — feature: clinical-reporting/demand-form-generate | `clinical-reporting/demand-form-generate/spec.md` |
| **deprecated-do-not-port** | spec | identity | Feature: identity/deprecated-do-not-port — feature: identity/deprecated-do-not-port | `identity/deprecated-do-not-port/spec.md` |
| **deprecated-do-not-port** | spec | practice | Feature: practice/deprecated-do-not-port — feature: practice/deprecated-do-not-port | `practice/deprecated-do-not-port/spec.md` |
| **deprecated-do-not-port** | spec | saas | Feature: saas/deprecated-do-not-port — feature: saas/deprecated-do-not-port | `saas/deprecated-do-not-port/spec.md` |
| **deprecated-do-not-port** | spec | telehealth | Feature: telehealth/deprecated-do-not-port — feature: telehealth/deprecated-do-not-port | `telehealth/deprecated-do-not-port/spec.md` |
| **document-list-and-search** | spec | document-digitization | Feature: document-digitization/document-list-and-search — feature: document-digitization/document-list-and-search | `document-digitization/document-list-and-search/spec.md` |
| **document-upload** | spec | document-digitization | Feature: document-digitization/document-upload — feature: document-digitization/document-upload | `document-digitization/document-upload/spec.md` |
| **document-view-and-edit** | spec | document-digitization | Feature: document-digitization/document-view-and-edit — feature: document-digitization/document-view-and-edit | `document-digitization/document-view-and-edit/spec.md` |
| **earnings-overview** | spec | practice-analytics | Feature: practice-analytics/earnings-overview — feature: practice-analytics/earnings-overview | `practice-analytics/earnings-overview/spec.md` |
| **email-history** | spec | patient-communication | Feature: patient-communication/email-history — feature: patient-communication/email-history | `patient-communication/email-history/spec.md` |
| **email-management** | spec | identity | Feature: identity/email-management — feature: identity/email-management | `identity/email-management/spec.md` |
| **email_delivery** | from-source | (legacy code-derived) | Email delivery — Halingo sends transactional email via **AWS Simple Email Service** (SES) through a thin `HalingoEmails` façade. When a p | `references/from-source/features/email_delivery.md` |
| **email_templates** | from-source | (legacy code-derived) | Email templates — Transactional email templates in Halingo are **React components authored in the source tree**, not documents stored in t | `references/from-source/features/email_templates.md` |
| **error-pages** | spec | shared | Feature: shared/error-pages — feature: shared/error-pages | `shared/error-pages/spec.md` |
| **eval-session** | spec | compliance-monitoring | Feature: compliance-monitoring/eval-session — feature: compliance-monitoring/eval-session | `compliance-monitoring/eval-session/spec.md` |
| **event-crud** | spec | scheduling | Feature: scheduling/event-crud — feature: scheduling/event-crud | `scheduling/event-crud/spec.md` |
| **event-deletion** | spec | scheduling | Feature: scheduling/event-deletion — feature: scheduling/event-deletion | `scheduling/event-deletion/spec.md` |
| **event-edit-pages** | spec | scheduling | Feature: scheduling/event-edit-pages — feature: scheduling/event-edit-pages | `scheduling/event-edit-pages/spec.md` |
| **event_payback** | from-source | (legacy code-derived) | Event payback (hasPayBack flag) — `hasPayBack` is a boolean on every `events` row that answers the question: "should this session count against the patien | `references/from-source/features/event_payback.md` |
| **event_types** | from-source | (legacy code-derived) | Event types — Everything in the `events` collection is one of four discrete *kinds* enumerated at `app/imports/api/events/events.jsx:3 | `references/from-source/features/event_types.md` |
| **financial-overview** | spec | smart-invoicing | Feature: smart-invoicing/financial-overview — feature: smart-invoicing/financial-overview | `smart-invoicing/financial-overview/spec.md` |
| **financial_overview** | from-source | (legacy code-derived) | Financial overview screen — Route: `/financial` (`app/imports/startup/client/routes/financial.js:17-27`). Container: `FinancialContainer` (`app/impo | `references/from-source/features/financial_overview.md` |
| **generate-verzamelstaten** | spec | mutualistic-billing | Feature: mutualistic-billing/generate-verzamelstaten — feature: mutualistic-billing/generate-verzamelstaten | `mutualistic-billing/generate-verzamelstaten/spec.md` |
| **group-events** | spec | scheduling | Feature: scheduling/group-events — feature: scheduling/group-events | `scheduling/group-events/spec.md` |
| **group_events** | from-source | (legacy code-derived) | Group events — A group event is a single scheduled session attended by multiple patients. Under the hood there is **no** 1-to-many pati | `references/from-source/features/group_events.md` |
| **ical-feed** | spec | scheduling | Feature: scheduling/ical-feed — feature: scheduling/ical-feed | `scheduling/ical-feed/spec.md` |
| **identity_and_authentication** | from-source | (legacy code-derived) | Identity and authentication — Everything the user does to prove who they are to Halingo, from first sign-up through day-to-day login, plus the lifecyc | `references/from-source/features/identity_and_authentication.md` |
| **in_app_notifications** | from-source | (legacy code-derived) | In-app notification centre — An in-app message inbox, per user, that collects system-generated events such as "you've been given access to a patient  | `references/from-source/features/in_app_notifications.md` |
| **insurance-cascade** | spec | payment-lifecycle | Feature: payment-lifecycle/insurance-cascade — feature: payment-lifecycle/insurance-cascade | `payment-lifecycle/insurance-cascade/spec.md` |
| **insurance_invoices** | from-source | (legacy code-derived) | Insurance invoices (Verzamelstaten) — A `Verzamelstaat (derdebetaler)` is the batched/aggregated invoice that a Belgian healthcare provider sends to a Ziekenf | `references/from-source/features/insurance_invoices.md` |
| **invitations** | spec | identity | Feature: identity/invitations — feature: identity/invitations | `identity/invitations/spec.md` |
| **invitations** | from-source | (legacy code-derived) | Invitations — The machinery that lets an owner or beheerder generate a one-click link, send it by email, and — when the recipient clic | `references/from-source/features/invitations.md` |
| **invoice-cancel** | spec | payment-lifecycle | Feature: payment-lifecycle/invoice-cancel — feature: payment-lifecycle/invoice-cancel | `payment-lifecycle/invoice-cancel/spec.md` |
| **invoice-delivery** | spec | smart-invoicing | Feature: smart-invoicing/invoice-delivery — feature: smart-invoicing/invoice-delivery | `smart-invoicing/invoice-delivery/spec.md` |
| **invoice-email-send** | spec | patient-communication | Feature: patient-communication/invoice-email-send — feature: patient-communication/invoice-email-send | `patient-communication/invoice-email-send/spec.md` |
| **invoice-settings** | spec | practice | Feature: practice/invoice-settings — feature: practice/invoice-settings | `practice/invoice-settings/spec.md` |
| **invoices_overview** | from-source | (legacy code-derived) | Invoices overview — Halingo's `invoices/` API module is a **compound module** of five independent sub-modules, each backed by its own MongoD | `references/from-source/features/invoices_overview.md` |
| **list-filter** | spec | waitlist | Feature: waitlist/list-filter — feature: waitlist/list-filter | `waitlist/list-filter/spec.md` |
| **login-and-logout** | spec | identity | Feature: identity/login-and-logout — feature: identity/login-and-logout | `identity/login-and-logout/spec.md` |
| **long-term-goals** | spec | treatment-planning | Feature: treatment-planning/long-term-goals — feature: treatment-planning/long-term-goals | `treatment-planning/long-term-goals/spec.md` |
| **long_term_therapy_plan** | from-source | (legacy code-derived) | Long-term therapy plan — A per-dossier kanban-style therapy plan made of hierarchical goals ("doelstellingen"). Each goal has a free-text `goal`  | `references/from-source/features/long_term_therapy_plan.md` |
| **low-session-alert** | spec | reimbursement-tracking | Feature: reimbursement-tracking/low-session-alert — feature: reimbursement-tracking/low-session-alert | `reimbursement-tracking/low-session-alert/spec.md` |
| **mail-settings** | spec | practice | Feature: practice/mail-settings — feature: practice/mail-settings | `practice/mail-settings/spec.md` |
| **main-dashboard** | spec | main-dashboard | Feature: main-dashboard/layout — feature: main-dashboard/layout | `main-dashboard/spec.md` |
| **main_dashboard** | from-source | (legacy code-derived) | Main dashboard — The landing screen immediately after login. Route `/` (`app/imports/startup/client/routes-flow.jsx:43-54`), mounted by ` | `references/from-source/features/main_dashboard.md` |
| **manual-reminder** | spec | debt-collection | Feature: debt-collection/manual-reminder — feature: debt-collection/manual-reminder | `debt-collection/manual-reminder/spec.md` |
| **method_audit_log** | from-source | (legacy code-derived) | Method audit log — A server-side log of Meteor method invocations that **fail**. Every method defined with `LoggedInValidatedMethod` wraps  | `references/from-source/features/method_audit_log.md` |
| **newsfeed** | spec | newsfeed | Feature: newsfeed/dashboard-widget — feature: newsfeed/dashboard-widget | `newsfeed/spec.md` |
| **newsfeed** | from-source | (legacy code-derived) | Newsfeed — A read-only, system-wide announcement stream that Halingo publishes to every signed-in user. Each item carries a bilingu | `references/from-source/features/newsfeed.md` |
| **nomenclature-lookup** | spec | compliance-monitoring | Feature: compliance-monitoring/nomenclature-lookup — feature: compliance-monitoring/nomenclature-lookup | `compliance-monitoring/nomenclature-lookup/spec.md` |
| **nomenclature_codes** | from-source | (legacy code-derived) | Nomenclature codes — A *nomenclatuurcode* is the official RIZIV billing code that identifies what kind of care was delivered. Every reimbursa | `references/from-source/features/nomenclature_codes.md` |
| **notifications** | spec | compliance-monitoring | Feature: compliance-monitoring/notifications — feature: compliance-monitoring/notifications | `compliance-monitoring/notifications/spec.md` |
| **notifications** | spec | notifications | Feature: notifications/inbox — feature: notifications/inbox | `notifications/spec.md` |
| **password-management** | spec | identity | Feature: identity/password-management — feature: identity/password-management | `identity/password-management/spec.md` |
| **patient-access-control** | spec | patient | Feature: patient/patient-access-control — feature: patient/patient-access-control | `patient/patient-access-control/spec.md` |
| **patient-detail** | spec | patient | Feature: patient/patient-detail — feature: patient/patient-detail | `patient/patient-detail/spec.md` |
| **patient-edit** | spec | patient | Feature: patient/patient-edit — feature: patient/patient-edit | `patient/patient-edit/spec.md` |
| **patient-invoice-generation** | spec | smart-invoicing | Feature: smart-invoicing/patient-invoice-generation — feature: smart-invoicing/patient-invoice-generation | `smart-invoicing/patient-invoice-generation/spec.md` |
| **patient-invoice-lifecycle** | spec | smart-invoicing | Feature: smart-invoicing/patient-invoice-lifecycle — feature: smart-invoicing/patient-invoice-lifecycle | `smart-invoicing/patient-invoice-lifecycle/spec.md` |
| **patient-list** | spec | patient | Feature: patient/patient-list — feature: patient/patient-list | `patient/patient-list/spec.md` |
| **patient-manual** | spec | payment-lifecycle | Feature: payment-lifecycle/patient-manual — feature: payment-lifecycle/patient-manual | `payment-lifecycle/patient-manual/spec.md` |
| **patient_creation** | from-source | (legacy code-derived) | Patient creation — The entry point to the patient-file lifecycle. A therapist opens the roster, clicks the floating **+** button in the top | `references/from-source/features/patient_creation.md` |
| **patient_documents** | from-source | (legacy code-derived) | Patient documents — The "Documenten" tab on a patient dossier mixes two collections: in-app rich-text reports (`patientFileReports` — see `c | `references/from-source/features/patient_documents.md` |
| **patient_file_access_control** | from-source | (legacy code-derived) | Patient file access control — Halingo enforces patient-file access at two levels: | `references/from-source/features/patient_file_access_control.md` |
| **patient_files** | from-source | (legacy code-derived) | Patient files — The core patient dossier (in Dutch: *patiëntendossier*) is the master record that every appointment, treatment, invoice, | `references/from-source/features/patient_files.md` |
| **patient_invoices** | from-source | (legacy code-derived) | Patient invoices — The `patientFileInvoices` sub-module is the heart of Halingo's billing surface: every reimbursable event delivered by a  | `references/from-source/features/patient_invoices.md` |
| **patient_merge** | from-source | (legacy code-derived) | Patient merge — A way to collapse two patient dossiers that refer to the same person into a single "winner" dossier. In Halingo this fun | `references/from-source/features/patient_merge.md` |
| **payback-eligibility** | spec | reimbursement-tracking | Feature: reimbursement-tracking/payback-eligibility — feature: reimbursement-tracking/payback-eligibility | `reimbursement-tracking/payback-eligibility/spec.md` |
| **payback-promotion-and-override** | spec | reimbursement-tracking | Feature: reimbursement-tracking/payback-promotion-and-override — feature: reimbursement-tracking/payback-promotion-and-override | `reimbursement-tracking/payback-promotion-and-override/spec.md` |
| **payback-rules** | spec | scheduling | Feature: scheduling/payback-rules — feature: scheduling/payback-rules | `scheduling/payback-rules/spec.md` |
| **payment_reconciliation** | from-source | (legacy code-derived) | Payment reconciliation — "Payment reconciliation" in Halingo is **not a feature** so much as a side effect of `setState` mutations on the various | `references/from-source/features/payment_reconciliation.md` |
| **pdf_generation** | from-source | (legacy code-derived) | PDF generation — A single server helper — `SharedUtil.generatePDF(html, options)` — that renders an HTML fragment to an A4 PDF via the `h | `references/from-source/features/pdf_generation.md` |
| **practice-info** | spec | practice | Feature: practice/practice-info — feature: practice/practice-info | `practice/practice-info/spec.md` |
| **practice-patient-stats** | spec | practice-analytics | Feature: practice-analytics/practice-patient-stats — feature: practice-analytics/practice-patient-stats | `practice-analytics/practice-patient-stats/spec.md` |
| **practice-switcher** | spec | practice | Feature: practice/practice-switcher — feature: practice/practice-switcher | `practice/practice-switcher/spec.md` |
| **practice_chat** | from-source | (legacy code-derived) | Practice chat — A lightweight one-channel text chat shared by every member (therapist) of a single praktijk. It is exposed as a floating | `references/from-source/features/practice_chat.md` |
| **practice_user_management** | from-source | (legacy code-derived) | Practice user management — The two screens an owner or beheerder uses to manage the people in a practice: a roster page and a per-user detail page. | `references/from-source/features/practice_user_management.md` |
| **practice_user_roles** | from-source | (legacy code-derived) | Practice user roles and permissions — Halingo has a three-tier role model scoped to a **practice**: each user, for each practice they belong to, has exactly o | `references/from-source/features/practice_user_roles.md` |
| **practitioner-lookup** | spec | compliance-monitoring | Feature: compliance-monitoring/practitioner-lookup — feature: compliance-monitoring/practitioner-lookup | `compliance-monitoring/practitioner-lookup/spec.md` |
| **print-mail-state** | spec | payment-lifecycle | Feature: payment-lifecycle/print-mail-state — feature: payment-lifecycle/print-mail-state | `payment-lifecycle/print-mail-state/spec.md` |
| **profile** | spec | identity | Feature: identity/profile — feature: identity/profile | `identity/profile/spec.md` |
| **r-waarde-stats** | spec | compliance-monitoring | Feature: compliance-monitoring/r-waarde-stats — feature: compliance-monitoring/r-waarde-stats | `compliance-monitoring/r-waarde-stats/spec.md` |
| **r_waarden** | from-source | (legacy code-derived) | R-waarden — An *R-waarde* is the RIZIV time-equivalent metric used to quantify a logopedist's annual workload. Each nomenclatuurcode | `references/from-source/features/r_waarden.md` |
| **rbac** | spec | identity | Feature: identity/rbac — feature: identity/rbac | `identity/rbac/spec.md` |
| **recurring-events** | spec | scheduling | Feature: scheduling/recurring-events — feature: scheduling/recurring-events | `scheduling/recurring-events/spec.md` |
| **recurring_events** | from-source | (legacy code-derived) | Recurring events — Halingo models recurrence by **materialising every occurrence** as its own row in the `events` collection, then linking  | `references/from-source/features/recurring_events.md` |
| **referral-programme** | spec | saas | Feature: saas/referral-programme — feature: saas/referral-programme | `saas/referral-programme/spec.md` |
| **referral_programme** | from-source | (legacy code-derived) | Referral programme (aanbrengbonus) — The "aanbrengbonus" — Halingo's word-of-mouth bounty. An existing customer (the **referrer**) sends a personal invitatio | `references/from-source/features/referral_programme.md` |
| **report-create-edit** | spec | clinical-reporting | Feature: clinical-reporting/report-create-edit — feature: clinical-reporting/report-create-edit | `clinical-reporting/report-create-edit/spec.md` |
| **report-delete** | spec | clinical-reporting | Feature: clinical-reporting/report-delete — feature: clinical-reporting/report-delete | `clinical-reporting/report-delete/spec.md` |
| **riziv-overview** | spec | practice-analytics | Feature: practice-analytics/riziv-overview — feature: practice-analytics/riziv-overview | `practice-analytics/riziv-overview/spec.md` |
| **riziv_compliance** | from-source | (legacy code-derived) | RIZIV compliance — Halingo's RIZIV compliance machinery is the **set of constants, enforcement rules and lookup tables that ensure every bi | `references/from-source/features/riziv_compliance.md` |
| **rosa-connect** | spec | rosa-sync | Feature: rosa-sync/rosa-connect — feature: rosa-sync/rosa-connect | `rosa-sync/rosa-connect/spec.md` |
| **rosa-disconnect** | spec | rosa-sync | Feature: rosa-sync/rosa-disconnect — feature: rosa-sync/rosa-disconnect | `rosa-sync/rosa-disconnect/spec.md` |
| **rosa-inbound-sync** | spec | rosa-sync | Feature: rosa-sync/rosa-inbound-sync — feature: rosa-sync/rosa-inbound-sync | `rosa-sync/rosa-inbound-sync/spec.md` |
| **rosa-integration** | spec | scheduling | Feature: scheduling/rosa-integration — feature: scheduling/rosa-integration | `scheduling/rosa-integration/spec.md` |
| **rosa-outbound-push** | spec | rosa-sync | Feature: rosa-sync/rosa-outbound-push — feature: rosa-sync/rosa-outbound-push | `rosa-sync/rosa-outbound-push/spec.md` |
| **rosa-patient-merge** | spec | rosa-sync | Feature: rosa-sync/rosa-patient-merge — feature: rosa-sync/rosa-patient-merge | `rosa-sync/rosa-patient-merge/spec.md` |
| **rosa-review-flow** | spec | rosa-sync | Feature: rosa-sync/rosa-review-flow — feature: rosa-sync/rosa-review-flow | `rosa-sync/rosa-review-flow/spec.md` |
| **rosa_integration** | from-source | (legacy code-derived) | Rosa integration — Two-way synchronisation between Halingo and Rosa.be, a Belgian practice-management / online booking platform for healthc | `references/from-source/features/rosa_integration.md` |
| **rules-engine** | spec | compliance-monitoring | Feature: compliance-monitoring/rules-engine — feature: compliance-monitoring/rules-engine | `compliance-monitoring/rules-engine/spec.md` |
| **saas-stripe-sync** | spec | payment-lifecycle | Feature: payment-lifecycle/saas-stripe-sync — feature: payment-lifecycle/saas-stripe-sync | `payment-lifecycle/saas-stripe-sync/spec.md` |
| **saas_subscriptions** | from-source | (legacy code-derived) | SaaS subscriptions — Halingo's per-practice SaaS billing layer. A subscription is owned by a **practice** (not by a user) and is the gate tha | `references/from-source/features/saas_subscriptions.md` |
| **session-caps** | spec | compliance-monitoring | Feature: compliance-monitoring/session-caps — feature: compliance-monitoring/session-caps | `compliance-monitoring/session-caps/spec.md` |
| **session-overview** | spec | practice-analytics | Feature: practice-analytics/session-overview — feature: practice-analytics/session-overview | `practice-analytics/session-overview/spec.md` |
| **session-unit-calculation** | spec | reimbursement-tracking | Feature: reimbursement-tracking/session-unit-calculation — feature: reimbursement-tracking/session-unit-calculation | `reimbursement-tracking/session-unit-calculation/spec.md` |
| **session_counting** | from-source | (legacy code-derived) | Session counting — Belgian RIZIV conventions cap the number of reimbursable speech-therapy sessions per patient per treatment type (the *br | `references/from-source/features/session_counting.md` |
| **shared_utilities** | from-source | (legacy code-derived) | Shared utilities — `app/imports/api/shared/` is a catch-all for cross-cutting server helpers that do not belong to a specific API module. I | `references/from-source/features/shared_utilities.md` |
| **short-term-goals** | spec | treatment-planning | Feature: treatment-planning/short-term-goals — feature: treatment-planning/short-term-goals | `treatment-planning/short-term-goals/spec.md` |
| **signup** | spec | identity | Feature: identity/signup — feature: identity/signup | `identity/signup/spec.md` |
| **statistics-count** | spec | waitlist | Feature: waitlist/statistics-count — feature: waitlist/statistics-count | `waitlist/statistics-count/spec.md` |
| **status-flag** | spec | waitlist | Feature: waitlist/status-flag — feature: waitlist/status-flag | `waitlist/status-flag/spec.md` |
| **stripe-webhooks** | spec | saas | Feature: saas/stripe-webhooks — feature: saas/stripe-webhooks | `saas/stripe-webhooks/spec.md` |
| **stripe_invoices** | from-source | (legacy code-derived) | Stripe (SaaS) invoices — The `stripeInvoices` collection is **Halingo's own invoice to its praktijk customers** for SaaS subscription fees. It is | `references/from-source/features/stripe_invoices.md` |
| **subscription-management** | spec | saas | Feature: saas/subscription-management — feature: saas/subscription-management | `saas/subscription-management/spec.md` |
| **tariff_indexation** | from-source | (legacy code-derived) | Tariff indexation — This file documents the **absence** of tariff indexation as a code feature, the workarounds the codebase uses to approxi | `references/from-source/features/tariff_indexation.md` |
| **team-management** | spec | identity | Feature: identity/team-management — feature: identity/team-management | `identity/team-management/spec.md` |
| **team_meetings** | from-source | (legacy code-derived) | Team meetings — A dormant feature scaffold for planning in-practice team meetings (teamvergaderingen / réunions d'équipe) separately fro | `references/from-source/features/team_meetings.md` |
| **team_meetings_in_calendar** | from-source | (legacy code-derived) | Team meetings on the calendar (event type 2) — `event.type === 2` is the MEETING kind — a scheduled block on a therapist's calendar labelled as a team meeting, adminis | `references/from-source/features/team_meetings_in_calendar.md` |
| **telehealth_consultation** | from-source | (legacy code-derived) | Telehealth consultation (event type 4) — "Consultation" is the fourth event type in `Events.types` (`app/imports/api/events/events.jsx:43-46`) and exists alongsi | `references/from-source/features/telehealth_consultation.md` |
| **terms-of-service** | spec | identity | Feature: identity/terms-of-service — feature: identity/terms-of-service | `identity/terms-of-service/spec.md` |
| **todos** | spec | todos | Feature: todos/crud — feature: todos/crud | `todos/spec.md` |
| **todos** | from-source | (legacy code-derived) | Todos — A lightweight personal to-do list kept per user. Each therapist sees only their own items, can add new ones from the das | `references/from-source/features/todos.md` |
| **treatment-create** | spec | treatment-planning | Feature: treatment-planning/treatment-create — feature: treatment-planning/treatment-create | `treatment-planning/treatment-create/spec.md` |
| **treatment-notifications** | spec | treatment-planning | Feature: treatment-planning/treatment-notifications — feature: treatment-planning/treatment-notifications | `treatment-planning/treatment-notifications/spec.md` |
| **treatments_and_bilans** | from-source | (legacy code-derived) | Treatments and bilans — A *treatment* (`Treatments` collection) is a RIZIV-aligned therapy plan attached to a patient file. It carries the treat | `references/from-source/features/treatments_and_bilans.md` |
| **unpaid-filter** | spec | debt-collection | Feature: debt-collection/unpaid-filter — feature: debt-collection/unpaid-filter | `debt-collection/unpaid-filter/spec.md` |
| **user_profile** | from-source | (legacy code-derived) | User profile — Everything the user manages about *themselves*, independent of which practice they are currently working in: name, gende | `references/from-source/features/user_profile.md` |
| **verzamelstaat** | spec | smart-invoicing | Feature: smart-invoicing/verzamelstaat — feature: smart-invoicing/verzamelstaat | `smart-invoicing/verzamelstaat/spec.md` |
| **verzamelstaat-detail-view** | spec | mutualistic-billing | Feature: mutualistic-billing/verzamelstaat-detail-view — feature: mutualistic-billing/verzamelstaat-detail-view | `mutualistic-billing/verzamelstaat-detail-view/spec.md` |
| **verzamelstaat-lifecycle** | spec | mutualistic-billing | Feature: mutualistic-billing/verzamelstaat-lifecycle — feature: mutualistic-billing/verzamelstaat-lifecycle | `mutualistic-billing/verzamelstaat-lifecycle/spec.md` |
| **video-consultation-billing** | spec | telehealth | Feature: telehealth/video-consultation-billing — feature: telehealth/video-consultation-billing | `telehealth/video-consultation-billing/spec.md` |
| **video-consultation-scheduling** | spec | telehealth | Feature: telehealth/video-consultation-scheduling — feature: telehealth/video-consultation-scheduling | `telehealth/video-consultation-scheduling/spec.md` |
| **zip-code-lookup** | spec | shared | Feature: shared/zip-code-lookup — feature: shared/zip-code-lookup | `shared/zip-code-lookup/spec.md` |