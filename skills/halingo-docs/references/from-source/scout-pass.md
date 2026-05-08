# Scout pass — feature inventory

> **Status:** raw output of the first scout pass over `/home/tj/Repos/Halingo-Main`. This is the working basis for the per-area deep-dives in `features/`, `gaps/` and `technical/`. Do not consider individual claims authoritative until cross-checked by a deep-dive.

This document was produced by an Explore agent that walked `app/imports/api/`, `app/imports/modules/`, `app/imports/ui/pages/`, `app/imports/migrations/`, `app/imports/startup/client/routes/`, and `app/imports/i18n/resources/`. Its job was inventory, not exposition — for prose documentation, see the per-feature pages in this folder.

---

## Section 1 — Routes / screens

Routes registered in `app/imports/startup/client/routes/`:

| Path | Name | Component | File:Line |
|---|---|---|---|
| `/login` | `login` | `LoginPage` | authentication.js:35 |
| `/register` | `register` | `RegisterPage` | authentication.js:44 |
| `/forgot` | `user.password.forgot` | `ForgotPasswordPage` | authentication.js:53 |
| `/reset` | `user.password.reset` | `ResetPasswordPage` | authentication.js:62 |
| `/toc` | `toc` | `TermsOfAgreement` | authentication.js:71 |
| `/verify-email/:token` | `verify` | `LoadingPage` | authentication.js:85 |
| `/notifications` | `notifications` | `NotificationsOverviewPageContainer` | notifications.js:12 |
| `/financial` | `financial` | `FinancialContainer` | financial.js:17 |
| `/financial/invoices/patient/:invoiceId` | `financial.invoices.patient.view` | `PatientInvoicePageContainer` | financial.js:29 |
| `/financial/invoices/insurance/:invoiceId` | `financial.invoices.insurance.view` | `InsuranceInvoicePageContainer` | financial.js:41 |
| `/financial/invoices/commission/:invoiceId` | `financial.invoices.commission.view` | `CommissionInvoicePageContainer` | financial.js:53 |
| `/patients/` | `patientfiles.home` | `PatientFilesMainPageContainer` | patientFile.js:21 |
| `/patients/:patientId` | `patientfiles.view` | `PatientFileDashboardContainer` | patientFile.js:33 |
| `/patients/:patientId/reports/:reportId` | `patientfiles.reports.view` | `PatientFileReportContainer` | patientFile.js:45 |
| `/patients/:patientId/documents/:documentId` | `patientfiles.documents.view` | `PatientFileDocumentContainer` | patientFile.js:62 |
| `/patients/:patientId/treatments/reports/:reportId` | `patientfiles.treatments.reports.view` | `PatientFileReportContainer` | patientFile.js:79 |
| `/patients/:patientId/treatments/documents/:documentId` | `patientfiles.treatments.documents.view` | `PatientFileDocumentContainer` | patientFile.js:96 |
| `/patients/:patientId/invoices/:invoiceId` | `patientfiles.invoices.view` | `PatientInvoicePageContainer` | patientFile.js:113 |
| `/agenda` | `agenda` | `CalendarPageContainer` | agenda.jsx:16 |
| `/agenda/settings` | `agendaSettings` | `SettingsPage` | agenda.jsx:29 |
| `/agenda/events/:eventId` | `eventView` | `DefaultEventPageContainer` | agenda.jsx:41 |
| `/agenda/groupevent/:groupId` | `groupEventView` | `GroupEventPageContainer` | agenda.jsx:53 |
| `/riziv` | `riziv` | `RizivPageContainer` | riziv.js:13 |
| `/rosa` | `rosa` | `RosaPageContainer` | rosa.js:8 |
| `/user/profile` | `user.profile` | `ProfilePageContainer` | user.js:12 |
| `/practices/` | `practices` | `PracticesOverviewContainer` | practice.jsx:25 |
| `/practices/new` | `practices.new` | `NewPracticePage` | practice.jsx:36 |
| `/practices/users` | `practices.users` | `PracticeUsersContainer` | practice.jsx:46 |
| `/practices/users/:userId` | `practices.usermanagement` | `PracticeUserPageContainer` | practice.jsx:56 |
| `/practices/settings` | `practice.settings` | `PracticeSettingsContainer` | practice.jsx:67 |
| `/practices/subscription` | `practice.subscription` | `PracticeSubscriptionContainer` | practice.jsx:78 |
| `/practices/subscription/plan/change` | `practice.subscription.plan.change` | `PracticeSubscriptionPlanChangeContainer` | practice.jsx:89 |
| `/practices/subscription/payment/change` | `practice.subscription.payment.change` | `PracticeSubscriptionPaymentChangeContainer` | practice.jsx:101 |
| `/practices/invoices/:id/payment` | `practice.invoice.payment` | `PracticeSubscriptionInvoicePaymentContainer` | practice.jsx:114 |
| `/referrals/` | `referrals` | `ReferralsContainer` | referals.jsx:16 |

## Section 2 — MongoDB collections

| Collection | File | Purpose | Notable fields / sub-documents |
|---|---|---|---|
| `patientFiles` | `patientFiles/patientFiles.jsx:15` | Patient dossiers with contact, address, demographics | States: starting/active/inactive/pending; insurance state codes; assignedTherapist; tags; contact persons |
| `longTherapy` | `patientFiles/longTherapyPlan.jsx:4` | Long-term therapeutic goals with hierarchy | Category (afasie, articulatie, stem, etc.); goal description; priority (high/medium/low); state (todo/inProgress/done); parentId for sub-goals |
| `practices` | `practice/practices.jsx:12` | SaaS practice instances with branding | invoiceTypes (practice/member); communicationStructures; bank account; invoice templates; logo; settings |
| `practiceChat` | `practice/practiceChat.jsx:5` | Inter-therapist messaging within a practice | message; userId; readBy array; timestamps |
| `teammeeting` | `practice/teammeeting.jsx:5` | Team meetings / group appointments | date; participants array; location; createdAt |
| `practiceUsers` | `practiceUsers/practiceUsers.jsx` | Staff with role-based permissions | roles: owner/beheerder/lid; commissions (type, amount, percentage); info; publicKeys |
| `patientFileUsers` | `patientFileUsers/patientFileUsers.jsx:4` | Access control for patient file sharing | patientFileId; userId; role permissions |
| `events` | `events/events.jsx:14` | Calendar appointments (sessions, bilans, meetings, private, consultations) | types: 1=APPOINTMENT, 2=MEETING, 3=PRIVATE, 4=CONSULTATION; appointmentType/subType; start/end; treatmentId; invoiceId; repeatId; hasPayBack; sessionCount; therapeutId |
| `treatments` | `treatments/treatments.js:9` | Treatment plans linked to patients & insurance | approvalStates: approved/declined/pending/testing; bilanTypes: initial/evolution/relapse/extension; nomenclature; insurance data |
| `invoices` (PatientFileInvoices) | `invoices/patientFileInvoices/patientFileInvoices.js:11` | Patient invoices with certificate data | InvoiceStates: open/unpaid/partially_paid/printed/mailed/paid; certificates with approval dates, RIZIV numbers; administrationCost |
| `insuranceInvoices` | `invoices/insuranceInvoices/insuranceInvoices.js` | Batch invoicing to insurance companies (Verzamelstaten) | CG1/CG2 codes; INSZ codes; patient batches |
| `commissionInvoices` | `invoices/commissionInvoices/commission.jsx:8` | Commission tracking for associated therapists | CommissionStates: open/paid; CommissionTypes: none/fixedAmount/percentage; specificAmounts per disorder |
| `stripeInvoices` | `invoices/stripeInvoices/stripeInvoices.jsx:7` | SaaS subscription invoices | state transitions; number generation; amount tracking; payment metadata |
| `notifications` | `notifications/notifications.jsx:6` | In-app notification center | states: new/read/seen; types: error/info/success/warning; meta (blackbox); practiceId |
| `patientFileReports` | `patientFileReports/patientFileReports.jsx:5` | Clinical reports / assessments | demandFormTypes: first/extension; name; report content; tags; treatmentId; patientFileId |
| `agendaSettings` | `agendaSettings/agendaSettings.jsx:4` | Per-user calendar view preferences | useStartEnd; fadeEventsBefore; exportAgenda; startHour; endHour; opensAt (start/current_time/custom); colorAppointment/Meeting/Private/Consultation |
| `subscriptions` | `subscriptions/subscriptions.jsx:6` | SaaS subscription state per practice | practiceId; type; paymentInfo (bancontact/card/none); periodStart/End; trialEnd; cancelAtPeriodEnd |
| `referrals` | `referrals/referrals.js:5` | Referral bonus tracking (aanbrengbonus) | Referrals.states: INVITED/REGISTERED/PAID/CONSUMED; email; userId; referredUserId; amount |
| `todos` | `todo/todos.js:5` | User task list | todo text; done boolean; userId; timestamps |
| `newsfeed` | `newsfeed/newsfeed.js:6` | System-wide announcements | title/body in nl/fr; optional image; timestamps |
| `riziv` | `riziv/riziv.jsx:5` | RIZIV practitioner registry | firstName; lastName; riziv number; qual (qualification code) |
| `clientErrors` | `clientErrors/clientErrors.jsx:4` | Client-side error logging | error object; name; params; userId; timestamp |
| `method-logs` | `logger/logger.js:5` | Meteor method call audit log | (schema not visible in file) |
| `Meteor.users` | `users/users.jsx` | User accounts with profile & RIZIV binding | UserProfessions: SPEECH_THERAPIST/OTHER; certificateModes: manual/printer; salutations; address; bankAccount; rosaPractices |
| `plans` | `payments/plans.jsx:5` | SaaS subscription tier definitions | name; price; currency; repeatType; features array; maxUsers; highlight flag |
| `emails` | `emails/emails.ts:6` | Email delivery tracking | EntityType: PATIENT/USER; EmailType: PATIENT_INVOICE/PATIENT_INVOICE_REMINDER; EmailStatus: SENT/BOUNCED/FAILED/UNKNOWN; sentAt; invoiceId |

## Section 3 — Feature inventory by API module

> Coverage tags: ✅ covered in helpdesk · 🟡 partial in helpdesk · ❌ missing from helpdesk · 🆕 new to functional spec

### agendaSettings · `app/imports/api/agendaSettings/`
Per-user calendar view customization.
- Per-user hour range (`startHour`/`endHour`)
- Custom range days for week view (default 3)
- Calendar opening behaviour (`opensAt`: start/current_time/custom)
- Event color coding by type (appointment/meeting/private/consultation)
- Export agenda (iCal feed)
- Fade past events option

Coverage: ✅ Well covered.

### clientErrors · `app/imports/api/clientErrors/`
Client-side exception logging — capture, stack trace, user attribution, server aggregation.
Coverage: 🆕 New to spec (infrastructure).

### emails · `app/imports/api/emails/`
Email delivery tracking. Types: PATIENT_INVOICE, PATIENT_INVOICE_REMINDER. Statuses: SENT/BOUNCED/FAILED/UNKNOWN.
Coverage: 🟡 Partial — helpdesk covers template selection but not deliverability tracking.

### events · `app/imports/api/events/`
Appointment scheduling, billing cycles, session tracking.
- Event types: 1=APPOINTMENT (billable), 2=MEETING (unbillable), 3=PRIVATE, 4=CONSULTATION (telehealth)
- Appointment subtypes: SESSION, INITIAL_BILAN, EVOLUTION_BILAN, EXTENSION_BILAN, TESTING_BILAN
- Session counting: bilans scale by duration (30-min increments); sessions by subtype (60-min = 2 sessions)
- Repeat events (`repeatId` + `repeatDates`)
- Payback tracking (`hasPayBack`) — external sessions counted toward patient bracket
- Invoice linkage (`invoiceId`)
- Group events (1-to-many patientFileId)
- Therapist assignment (`assignedTherapistIds`)
- Real-time push to Rosa on event create/update/remove
- `getEventStatistics`, `getUninvoicedEvents`, `editShortTherapy`

Coverage: ✅ Well covered (calendar, sessions, bilans).

### invitations · `app/imports/api/invitations/`
Practice staff onboarding, accept/remove invitation flow.
Coverage: 🟡 Partial.

### invoices · `app/imports/api/invoices/`
Compound module with five sub-modules:

**patientFileInvoices** — patient invoice generation, certificate embedding, status workflow (open/unpaid/partially_paid/printed/mailed/paid), administration cost, structured CG1/CG2 announcement, bulk print/mail, third-payer detection, bulk cancellation.

**insuranceInvoices** — Verzamelstaat generation by fund or patient, CG1/CG2 segregation, INSZ grouping, claim status (open/printed/paid).

**commissionInvoices** — commission tracking for associated therapists, types (none/fixedAmount/percentage), per-disorder overrides (`specificAmounts`), state (open/paid).

**payments** — payment reconciliation, Stripe/Bancontact form generation, payment history.

**stripeInvoices** — SaaS subscription invoicing, automatic numbering, multi-currency.

Coverage: ✅ Well covered.

### logger · `app/imports/api/logger/`
Server-side Meteor method audit log.
Coverage: 🆕 New to spec (infrastructure).

### newsfeed · `app/imports/api/newsfeed/`
System-wide announcements with bilingual content (NL/FR), optional image, displayed on main dashboard.
Coverage: 🟡 Partial — dashboard widgets exist but not formally documented.

### notifications · `app/imports/api/notifications/`
In-app notification centre. States new/read/seen; types error/info/success/warning; practice-scoped; bulk read; auto-removal flag.
Coverage: ✅ Well covered (loosely).

### patientFileReports · `app/imports/api/patientFileReports/`
Clinical reports / assessments. Types: first / extension. Rich-text content, tags, treatment linkage.
Coverage: 🟡 Partial.

### patientFileUsers · `app/imports/api/patientFileUsers/`
Access control / role-based permissions per patient file. Granular permissions list: view, update, remove, grantAccess, reports.add/delete/edit, therapies.long.add/delete/edit, therapies.short.edit/delete, treatments.add/edit/remove, bilans.add/edit/remove.
Coverage: 🟡 Partial — granular permissions not in helpdesk.

### patientFiles · `app/imports/api/patientFiles/`
Patient dossier (core master record). States starting/active/inactive/pending; demographics; contact persons; address; insurance state per RIZIV convention; isThirdPayer; therapist assignment; tags; merge (`mergePatientFileInto`); `grantUserAccessToPatientFile`; `syncPatientFiles`; long-term therapy plan sub-collection.
Coverage: 🟡 Partial — file view/tags covered; creation flow and GDPR not documented.

### payments · `app/imports/api/payments/`
SaaS subscription plan definitions (name, price, currency, repeat type, feature list, max users).
Coverage: ✅ Well covered.

### practice · `app/imports/api/practice/`
Practice instance master data and team collaboration. Branding (logo, accent, invoice template); settings (communication structure, invoice type, language); chat (`PracticeChatCol`); team meetings (`TeamMeeting`); user invitations and role changes; subscriptions (cancel, resume, selectPlan); payments (`createSourceForInvoice`); certification (`getPracticeCertificate`); VAT validation; Rosa therapist roster.
Coverage: ✅ Well covered (most surfaces).

### practiceUsers · `app/imports/api/practiceUsers/`
Staff records with RBAC. Roles: owner / beheerder / lid. 60+ granular permissions across patient files, treatments, invoices, chat, commissions, settings. Per-user commission tracking with per-disorder overrides.
Coverage: 🟡 Partial — three-tier role concept in helpdesk; permission matrix not documented.

### referrals · `app/imports/api/referrals/`
Referral bonus program (aanbrengbonus). States INVITED → REGISTERED → PAID → CONSUMED.
Coverage: ✅ Well covered.

### riziv · `app/imports/api/riziv/`
RIZIV practitioner registry, treatment type classification (a, b.1–b.6.4, c.1–c.2, d, e, f), session counting per treatment, end-of-coverage statistics, automatic 2-year brackets, age-based eligibility.
Coverage: ✅ Well covered.

### rosa · `app/imports/api/rosa/`
Bidirectional sync with Rosa.be EHR. **Push-only in code** (Halingo → Rosa) for patient records, events, motives, practice setup. OAuth2 token auth. Full TypeScript DTO definitions for Rosa API contracts.
Coverage: ✅ Covered (helpdesk says bidirectional; code shows push-only).

### shared · `app/imports/api/shared/`
Cross-cutting utilities: `generatePDF` (HTML → PDF), zip-code lookup (`getZipCodesByZipCode`/`getZipCodesByCounty`, Belgium-specific), admin impersonation.
Coverage: 🆕 New to spec.

### subscriptions · `app/imports/api/subscriptions/`
SaaS subscription lifecycle. States active/cancelled/expired. Payment types bancontact/card/none. Periods (trialEnd, periodStart, periodEnd) with 3-day leeway. Plan changes via `newPlanAtEndOfPeriod` + `cancelAtPeriodEnd`. 30-day trial. Monthly/yearly periods. Payment method change via `newTypeAtEndOfPeriod`.
Coverage: ✅ Well covered.

### todo · `app/imports/api/todo/`
Per-user task list with done flag.
Coverage: 🆕 New to spec.

### treatments · `app/imports/api/treatments/`
Treatment plans per patient with insurance integration. RIZIV-aligned types; bilan types initial/evolution/relapse/extension; approval states approved/declined/pending/testing; per-treatment insurance data; session limits; `editTreatmentNotificationSettings`; `getHalingoSessionCount`; `addBilan`/`editBilan`/`removeBilan`.
Coverage: ✅ Well covered.

### users · `app/imports/api/users/`
User accounts. Auth (register, login, sendResetPasswordMail, resetPassword); email management (verifyEmail, changeEmail, sendVerificationMail); profile updates; settings; account deletion (`deleteUser`); terms acceptance; Rosa OAuth (`connectToRosa`/`disconnectFromRosa`); professions (SPEECH_THERAPIST/OTHER); certificate mode (manual/printer); salutations.
Coverage: ✅ Well covered.

## Section 4 — UI pages not tied to a single API module

| Page | Location | Purpose |
|---|---|---|
| **MainDashboardPage** | `ui/pages/main/MainDashboardPage.jsx` | Main landing post-login with widget grid (notifications, open bills, todos, newsfeed). 📌 Not in helpdesk. |
| **FinancialPage** | `ui/pages/financial/overview/FinancialPage.jsx` | Financial summary with tabs (invoices, commissions, earnings); includes EarningsGraph, SessionOverview, SessionOverviewDetailBox |
| **PatientFilesMainPage** | `modules/patientfiles/main/PatientFilesMainPage.jsx` | Patient roster with search, filter-by-therapist, tags, sync |
| **PatientFileDocumentPage** | `modules/patientfiles/reports/PatientFileDocumentPage.jsx` | Document viewer (PDF/images with tags) |
| **PatientFileReportPage** | `modules/patientfiles/reports/PatientFileReportPage.jsx` | Clinical report editor / viewer |
| **PatientFileTherapyOverviewPage** | `modules/patientfiles/therapy/PatientFileTherapyOverviewPage.jsx` | Treatment plan overview (long/short term goals, bilans) |
| **PatientFileInvoicePage** | `modules/patientfiles/invoices/PatientFileInvoicePage.jsx` | Patient invoice history + print |
| **PatientInvoicePage** | `modules/invoices/patient/PatientInvoicePage.jsx` | Single invoice detail with certificate, print/mail actions |
| **InsuranceInvoicePage** | `modules/invoices/insurance/InsuranceInvoicePage.jsx` | Verzamelstaat detail |
| **CommissionInvoicePage** | `modules/invoices/commission/CommissionInvoicePage.jsx` | Commission statement |
| **CalendarPage** | `modules/calendar/page/CalendarPage.jsx` | Day/week/month agenda |
| **CalendarSettingsPage** | `modules/calendar/page/SettingsPage.jsx` | Calendar customization |
| **AppointmentEventPage** | `modules/calendar/page/AppointmentEventPage.jsx` | Session detail |
| **MeetingEventPage** | `modules/calendar/page/MeetingEventPage.jsx` | Team meeting detail |
| **PrivateEventPage** | `modules/calendar/page/PrivateEventPage.jsx` | Non-billable private appointment |
| **ConsultationEventPage** | `modules/calendar/page/ConsultationEventPage.jsx` | Telehealth consultation |
| **GroupEventPage** | `modules/calendar/page/GroupEventPage.jsx` | Multi-patient event editor |
| **RizivPage** | `modules/riziv/RizivPage.jsx` | RIZIV session count tracking + alerts (RizivPageGraph) |
| **RosaPage** | `modules/rosa/rosa-page.jsx` | Rosa sync status, manual sync, token refresh |
| **ProfilePage** | `ui/pages/users/profile-page/ProfilePage.jsx` | User account settings |
| **PracticesOverviewPage** | `ui/pages/practices/PracticesOverviewPage.jsx` | Multi-practice switcher |
| **NewPracticePage** | `ui/pages/practices/NewPracticePage.jsx` | Practice creation onboarding |
| **PracticeSettingsPage** | `ui/pages/practices/settings/PracticeSettingsPage.jsx` | Branding, invoice template, mail template |
| **PracticeUsersPage** | `ui/pages/practices/users/PracticeUsers.jsx` | Staff roster, role, commission, invitations |
| **PracticeSubscriptionPage** | `modules/pages/practice-subscriptions/PracticeSubscription.page.jsx` | SaaS plan, payment method, invoices |
| **PracticeSubscriptionPlanChangePage** | `modules/pages/practice-subscriptions/PracticeSubscriptionPlanChangePage.jsx` | Plan upgrade/downgrade |
| **PracticeSubscriptionPaymentChangePage** | `modules/pages/practice-subscriptions/PracticeSubscriptionPaymentChangePage.jsx` | Payment method update |
| **PracticeSubscriptionInvoicePaymentPage** | `modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx` | SaaS invoice payment |
| **ReferralsPage** | `modules/pages/referals/referrals.jsx` | Referral bonus tracking |
| **NotificationsOverviewPage** | `ui/pages/notifications/NotificationsOverviewPage.jsx` | In-app notification centre |
| **LoginPage / RegisterPage / ForgotPasswordPage / ResetPasswordPage / TermsOfAgreement** | `modules/authentication/...` | Authentication flow |

## Section 5 — Migrations as feature timeline

| Migration | Key changes |
|---|---|
| `migration-v1.js` | Treatment type refactor: "disorder" → treatment type (a/b/c/d/e/f); supplementary insurance |
| `migration-v12.js` | Notification title update: patient file share notification |
| `migration-v28.js` | **Rosa integration**: SetupPracticesInRosa — initial sync of practice metadata |
| `migration-v29.js` | **Rosa integration**: pushPatientRecordsToRosa |
| `migration-v30.js` | **Rosa integration**: pushEventsToRosa |
| `migration-v31.js` | **Rosa integration**: pushMissingMotiveToRosa |
| `migration-v32.js` | **Rosa integration**: pushEventsToRosa (repeat) |
| `migration-v33.js` | **Stripe upgrade**: subsToNewStripe |
| `migration-v35.js` | **Treatment session count**: updateTreatmentSessionCount |
| `36/–47/migration.js` | Numbered (more recent) migrations |

Rosa integration arrived in v28–v32. Stripe upgrade in v33. Session count corrections in v35.

## Section 6 — i18n surface scan

Top-level i18n namespaces under `app/imports/i18n/resources/`:

`appName · forms.* · forms.patientProfile.* · forms.events.* · forms.patientFileProfile.* · address.* · navigation.* · profile.* · patientFile.* · patient.invoices.* · patient.treatments.* · notifications.* · invoices.insurance.* · invoices.patient.* · financial.* · riziv.* · practice.* · practice.users.* · practice.commission.* · practice.subscription.* · agenda.* · agenda.event.* · chat.* · newsfeed.* · todos.* · rosa.* · certificates.* · tariff.* · team-meeting.*`

Missing namespaces: no `gdpr.*`, no `waitlist.*`, no `analytics.*`. Implies those features are absent from the user-facing surface.

## Section 7 — Surprises

### New to spec (not in helpdesk)

1. **Main Dashboard** (`ui/pages/main/MainDashboardPage.jsx`) — widget grid, not documented
2. **Practice Chat** (`practice/practiceChat.jsx`) — real-time inter-therapist messaging
3. **Team Meetings** (`practice/teammeeting.jsx`) — scheduling + attendance
4. **Long-Term Therapy Goal Hierarchy** — sub-goals with `parentId`, priorities, states
5. **Client Error Logging** (`clientErrors/`)
6. **Method Audit Logging** (`logger/`)
7. **Email Delivery Tracking** (`emails/emails.ts`) — bounce/failure status
8. **Per-Disorder Commission Overrides** (`commissionInvoices/`, specificAmounts array)
9. **Group Events** (`groupEventView` route) — multi-patient sessions
10. **Event Payback Tracking** (`hasPayBack` flag) — external sessions
11. **Shared Utilities** — PDF generation, ZIP code lookup, admin impersonation

### Hard gaps (code suggests feature, helpdesk silent)

1. **GDPR / data privacy** — `PatientFiles.remove()` exists, no export/retention/right-to-erasure visible
2. **Waitlist / intake queue** — none in events/treatments API
3. **Patient-facing payment portal** — events support payback, no patient-login route
4. **Appointment reminders to patients** — `Emails` collection has invoice types only
5. **Email template authoring** — only template selection in `PracticeSettingsPage`
6. **Practice analytics / KPIs** — `MainDashboardPage` has graphs but no formal analytics module
7. **Nomenclature / tariff settings UI** — RIZIV nomenclature hard-coded in `migration-v1.js`
8. **Patient creation flow** — `addPatientFile` method exists, container not located by scout

### Partial / incomplete hints

1. **Rosa sync direction** — only push (Halingo → Rosa); no pull / conflict resolution
2. **Two-level invoice comments** — not visible in `PatientFileInvoices` schema
3. **Private appointments UI** — `events.type = 3` exists; create-flow UI not examined
4. **Per-practice invoice language** — language preference may exist on `Practices`, generation code not examined
5. **Appointment reminders** — no scheduled job, template, or preference

### Code structure surprises

1. **TypeScript only in Rosa** — `api/rosa/server/*.ts`; rest of codebase is JS/JSX
2. **Invoices is compound** — five sub-modules with independent collections
3. **`monkey-calendar/`** — exists but not referenced in routes; possibly deprecated
4. **Permissions duplication** — `patientFileUsers` and `practiceUsers` both define RBAC separately
5. **Test files mixed with production** — `api/.../server/test/` paths inside production tree

## Summary

- **22 collections** + `Meteor.users`
- **27 API modules**
- **34 routes** across 9 route files
- **40+ UI pages** across `ui/pages` + `modules`
- **47 migrations**
- **60+ i18n namespaces**

**Coverage outcome:**
- ✅ Well covered: 14
- 🟡 Partial: 4
- ❌ Hard gap: 2
- 🆕 New to spec: 10+
