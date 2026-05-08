# Routes

Reference for every FlowRouter route registered under `app/imports/startup/client/routes/` plus the "home" entry and the `/invitations/accept/:token` outlier. Halingo uses `meteor/ostrio:flow-router-extra` for routing.

## Mount helpers

All routes go through one of three mount helpers defined in `app/imports/startup/client/routes/common.js`:

- `mount2(container, props)` (`common.js:7-10`) — raw mount without auth check.
- `authenticatedMount(container, props)` (`common.js:12-14`) — wraps the container in `AuthenticationContainer` before mounting, enforcing login.
- For routes that need a practice to be selected, `requiresPractice: true` is passed as a prop, which the container layer checks.

Authenticated routes all use `AppContainer` from `app/imports/ui/containers/AppContainer.jsx` as the outer layout; unauthenticated auth flows use either `AuthenticationContainer` or `EmptyContainer`.

---

## Bootstrap / root

**File:** `app/imports/startup/client/routes-flow.jsx`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/` | `home` | `MainDashboardPage` | yes | yes | `navigation.home` | `routes-flow.jsx:43` |
| `*` (404) | — | `NotFoundPage` | yes | no | — | `routes-flow.jsx:25` |

The `*` catch-all mounts the 404 page; any URL not matched by an earlier route ends up here (including unauthenticated users, who will be bounced to login by `authenticatedMount`).

A global `FlowRouter.triggers.enter([localeCheck])` (`routes-flow.jsx:37`) reads `context.queryParams.locale` and sets the i18n locale — any route URL can include `?locale=fr` to switch language on the fly.

`routes-flow.jsx` imports the nine route modules via `./routes/index.js` and additionally imports `../../api/invitations/routes.jsx` (which defines `/invitations/accept/:token`).

The `./routes/index.js` file simply re-imports the nine route files:

```js
import "./agenda";
import "./authentication";
import "./notifications";
import "./patientFile";
import "./practice";
import "./riziv";
import "./user";
import "./financial";
import "./referals";
import "./rosa";
```

Note the misspelling `referals` (single `r`) in the file name.

---

## Authentication routes

**File:** `app/imports/startup/client/routes/authentication.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/login` | `login` | `LoginPage` in `AuthenticationContainer` | no | — | — | `authentication.js:35` |
| `/register` | `register` | `RegisterPage` in `AuthenticationContainer` | no | — | — | `authentication.js:44` |
| `/forgot` | `user.password.forgot` | `ForgotPasswordPage` | no | — | — | `authentication.js:53` |
| `/reset` | `user.password.reset` | `ResetPasswordPage` | no | — | — | `authentication.js:62` |
| `/toc` | `toc` | `TermsOfAgreement` in `EmptyContainer` | no | — | — | `authentication.js:71` |
| `/verify-email/:token` | `verify` | `LoadingPage` in `EmptyContainer` | yes | — | — | `authentication.js:85` |

`/verify-email/:token` uses `triggersEnter` to call `verifyEmail.call({token})` once authentication completes, then redirects to `home` with a success/error notification (`authentication.js:87-108`).

---

## Invitations route

**File:** `app/imports/api/invitations/routes.jsx`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/invitations/accept/:token` | *(anonymous)* | `LoadingPage` in `EmptyContainer` | yes | — | — | `api/invitations/routes.jsx:29` |

This route has no `name` attribute. It uses a `triggersEnter` hook to call `acceptInvitation.call({token})` once the user is logged in, then redirects to whatever URL the server returns (`routes.jsx:33-47`). Note that it duplicates its own `mount2` / `authenticatedMount` helpers instead of importing them from `common.js` (`routes.jsx:20-27`).

---

## Notifications routes

**File:** `app/imports/startup/client/routes/notifications.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/notifications` | `notifications` | `NotificationsOverviewPageContainer` | yes | no | `notifications.title` | `notifications.js:12` |

---

## User profile routes

**File:** `app/imports/startup/client/routes/user.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/user/profile` | `user.profile` | `ProfilePageContainer` | yes | no | `profile.title` | `user.js:12` |

This is the only route with `parent: "home"` explicitly set.

---

## Financial routes

**File:** `app/imports/startup/client/routes/financial.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/financial` | `financial` | `FinancialContainer` | yes | yes | `navigation.financial` | `financial.js:17` |
| `/financial/invoices/patient/:invoiceId` | `financial.invoices.patient.view` | `PatientInvoicePageContainer` | yes | yes | `BreadcrumbTitles.PATIENTINVOICE` | `financial.js:29` |
| `/financial/invoices/insurance/:invoiceId` | `financial.invoices.insurance.view` | `InsuranceInvoicePageContainer` | yes | yes | `BreadcrumbTitles.INSURANCEINVOICE` | `financial.js:41` |
| `/financial/invoices/commission/:invoiceId` | `financial.invoices.commission.view` | `CommissionInvoicePageContainer` | yes | yes | `BreadcrumbTitles.COMMISSIONINVOICE` | `financial.js:53` |

The three invoice-detail routes set `parent: 'financial'` so the breadcrumb chain renders as `Financial › <invoice>`.

---

## Patient file routes

**File:** `app/imports/startup/client/routes/patientFile.js`

Uses `FlowRouter.group({ prefix: '/patients' })`; all paths below are relative to `/patients`.

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/patients/` | `patientfiles.home` | `PatientFilesMainPageContainer` | yes | yes | `navigation.patientFiles` | `patientFile.js:21` |
| `/patients/:patientId` | `patientfiles.view` | `PatientFileDashboardContainer` | yes | yes | `BreadcrumbTitles.PATIENTFILE` | `patientFile.js:33` |
| `/patients/:patientId/reports/:reportId` | `patientfiles.reports.view` | `PatientFileReportContainer` | yes | yes | `BreadcrumbTitles.PATIENTREPORT` | `patientFile.js:45` |
| `/patients/:patientId/documents/:documentId` | `patientfiles.documents.view` | `PatientFileDocumentContainer` | yes | yes | `BreadcrumbTitles.PATIENTDOCUMENT` | `patientFile.js:62` |
| `/patients/:patientId/treatments/reports/:reportId` | `patientfiles.treatments.reports.view` | `PatientFileReportContainer` | yes | yes | `BreadcrumbTitles.PATIENTREPORT` | `patientFile.js:79` |
| `/patients/:patientId/treatments/documents/:documentId` | `patientfiles.treatments.documents.view` | `PatientFileDocumentContainer` | yes | yes | `BreadcrumbTitles.PATIENTDOCUMENT` | `patientFile.js:96` |
| `/patients/:patientId/invoices/:invoiceId` | `patientfiles.invoices.view` | `PatientInvoicePageContainer` | yes | yes | `BreadcrumbTitles.PATIENTINVOICE` | `patientFile.js:113` |

Observations:

- The `/treatments/reports/:reportId` and `/treatments/documents/:documentId` routes mount the **same** containers as the top-level ones (`PatientFileReportContainer` / `PatientFileDocumentContainer`). They exist so that breadcrumbs nest under the patient-file tab "treatments" versus "documents/reports" — the behaviour is otherwise identical.
- All routes under `:patientId` set `parent: 'patientfiles.view'` so the breadcrumb chain is `Patients › <patient> › <report/document/invoice>`.

---

## Agenda routes

**File:** `app/imports/startup/client/routes/agenda.jsx`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/agenda` | `agenda` | `CalendarPageContainer` | yes | yes | `navigation.agenda` | `agenda.jsx:16` |
| `/agenda/settings` | `agendaSettings` | `SettingsPage` | yes | yes | `navigation.agendaSettings` | `agenda.jsx:29` |
| `/agenda/events/:eventId` | `eventView` | `DefaultEventPageContainer` | yes | yes | `navigation.agendaEventView` | `agenda.jsx:41` |
| `/agenda/groupevent/:groupId` | `groupEventView` | `GroupEventPageContainer` | yes | yes | `navigation.agendaEventView` | `agenda.jsx:53` |

`/agenda` additionally passes `hideBreadcrumb: true` and `removeWrapperClasses: true` (the calendar owns the whole viewport). The sub-routes set `parent: 'agenda'`.

Note that there is no separate route for each **event type** (appointment / meeting / private / consultation) — `DefaultEventPageContainer` dispatches internally on the loaded event's `type` field.

---

## Practice routes

**File:** `app/imports/startup/client/routes/practice.jsx`

Uses `FlowRouter.group({ prefix: '/practices' })`.

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/practices/` | `practices` | `PracticesOverviewContainer` | yes | yes | `navigation.practices` | `practice.jsx:25` |
| `/practices/new` | `practices.new` | `NewPracticePage` | yes | **no** | `navigation.practicesNew` | `practice.jsx:36` |
| `/practices/users` | `practices.users` | `PracticeUsersContainer` | yes | yes | `practice.users.title` | `practice.jsx:46` |
| `/practices/users/:userId` | `practices.usermanagement` | `PracticeUserPageContainer` | yes | yes | `BreadcrumbTitles.PRACTICEUSER` | `practice.jsx:56` |
| `/practices/settings` | `practice.settings` | `PracticeSettingsContainer` | yes | yes | `practice.settings.title` | `practice.jsx:67` |
| `/practices/subscription` | `practice.subscription` | `PracticeSubscriptionContainer` | yes | yes | `practice.subscription.title` | `practice.jsx:78` |
| `/practices/subscription/plan/change` | `practice.subscription.plan.change` | `PracticeSubscriptionPlanChangeContainer` | yes | yes | `practice.subscription.plan.change.title` | `practice.jsx:89` |
| `/practices/subscription/payment/change` | `practice.subscription.payment.change` | `PracticeSubscriptionPaymentChangeContainer` | yes | yes | `practice.subscription.payment.change.title` | `practice.jsx:101` |
| `/practices/invoices/:id/payment` | `practice.invoice.payment` | `PracticeSubscriptionInvoicePaymentContainer` | yes | yes | `practice.invoices.payment.title` | `practice.jsx:114` |

`/practices/new` is the only practice-prefixed route that does **not** require an active practice — by design, since creating the first practice is how you get one.

`/practices/invoices/:id/payment` sets `hideBreadcrumb: true` to present the payment flow full-bleed.

Subscription plan/payment change routes set `parent: 'practice.subscription'`.

---

## Referrals routes

**File:** `app/imports/startup/client/routes/referals.jsx` (note the spelling).

Uses `FlowRouter.group({ prefix: '/referrals' })` — note the prefix uses the correct double-r `referrals`.

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/referrals/` | `referrals` | `ReferralsContainer` | yes | yes | `navigation.referrals` | `referals.jsx:16` |

---

## RIZIV routes

**File:** `app/imports/startup/client/routes/riziv.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/riziv` | `riziv` | `RizivPageContainer` | yes | yes | `navigation.riziv` | `riziv.js:13` |

---

## Rosa routes

**File:** `app/imports/startup/client/routes/rosa.js`

| Path | Name | Component | Auth | Requires practice | Title key | Source |
|---|---|---|---|---|---|---|
| `/rosa` | `rosa` | `RosaPageContainer` | yes | yes | `navigation.rosa` | `rosa.js:8` |

---

## Alphabetical route-name → path index

| Name | Path |
|---|---|
| *(unnamed invitation accept)* | `/invitations/accept/:token` |
| `agenda` | `/agenda` |
| `agendaSettings` | `/agenda/settings` |
| `eventView` | `/agenda/events/:eventId` |
| `financial` | `/financial` |
| `financial.invoices.commission.view` | `/financial/invoices/commission/:invoiceId` |
| `financial.invoices.insurance.view` | `/financial/invoices/insurance/:invoiceId` |
| `financial.invoices.patient.view` | `/financial/invoices/patient/:invoiceId` |
| `groupEventView` | `/agenda/groupevent/:groupId` |
| `home` | `/` |
| `login` | `/login` |
| `notifications` | `/notifications` |
| `patientfiles.documents.view` | `/patients/:patientId/documents/:documentId` |
| `patientfiles.home` | `/patients/` |
| `patientfiles.invoices.view` | `/patients/:patientId/invoices/:invoiceId` |
| `patientfiles.reports.view` | `/patients/:patientId/reports/:reportId` |
| `patientfiles.treatments.documents.view` | `/patients/:patientId/treatments/documents/:documentId` |
| `patientfiles.treatments.reports.view` | `/patients/:patientId/treatments/reports/:reportId` |
| `patientfiles.view` | `/patients/:patientId` |
| `practice.invoice.payment` | `/practices/invoices/:id/payment` |
| `practice.settings` | `/practices/settings` |
| `practice.subscription` | `/practices/subscription` |
| `practice.subscription.payment.change` | `/practices/subscription/payment/change` |
| `practice.subscription.plan.change` | `/practices/subscription/plan/change` |
| `practices` | `/practices/` |
| `practices.new` | `/practices/new` |
| `practices.users` | `/practices/users` |
| `practices.usermanagement` | `/practices/users/:userId` |
| `referrals` | `/referrals/` |
| `register` | `/register` |
| `riziv` | `/riziv` |
| `rosa` | `/rosa` |
| `toc` | `/toc` |
| `user.password.forgot` | `/forgot` |
| `user.password.reset` | `/reset` |
| `user.profile` | `/user/profile` |
| `verify` | `/verify-email/:token` |

Total: **36 named routes** plus the `*` catch-all and the unnamed `/invitations/accept/:token`.

## Notes on `app/lib/routes.jsx`

The file `/home/tj/Repos/Halingo-Main/app/lib/routes.jsx` is present but is **completely empty** (two blank lines). It is not imported from anywhere under `app/imports/`. Similarly `app/lib/methods.js` holds a single stub `'lib/method_name'` method. These are leftover scaffolding from the original Meteor project generator and have no effect on the running application.
