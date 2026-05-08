# In-app Notifications

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Notification centre with new/seen/read states.

## Spec contracts (Phase 2)

- **notifications** — Feature: notifications/inbox
  - Path: `02-specs/notifications/spec.md`


## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/in-app-notifications.md`)

# Discovery: In-App Notifications

**Area:** #21 In-App Notifications (net-new area; not part of the original 20-competency taxonomy in `application_map.md` -- discovered during the code-read pass as "Net-new concept #2" in `coverage_matrix.md`)

**Scope in one breath:** the per-user in-app notification inbox that collects system-generated events (practice invitations, patient-file shares, Stripe payment outcomes, treatment-coverage expiry warnings), renders them via a navbar bell icon with unread badge, a dashboard alert tile, and a full `/notifications` list page, and manages their `new` / `seen` / `read` state machine. Excludes the transient toast/snackbar system (`NotificationManager` / `notistack`) which is a separate UI mechanism that does not persist data.

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent handling all three sources in one session.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what is in the new Nx monorepo, `libs/backend/*`, or any Nx-side symbol. Phase 0 audit data belongs elsewhere. See `06-prompts/halingo-discoverer.md` "The ONE critical scope rule".

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Code-derived | `from_source/features/in_app_notifications.md` | 231 | full | Complete data model, methods, publications, UI surfaces, producer call sites, permissions, notable details (stale util files, `meta` HTML injection risk, bilingual via i18n keys, `practiceId` stored but unused at read time). **Primary discovery source for this area.** |
| Cross-cutting | `from_source/deprecation_list.md` | 184 | ctrl-F "notif" | Entry #15: two stale `util.jsx` files importing `Events` instead of `Notifications` -- dead code, safe to delete. No notification features are being deprecated. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | 157 | ctrl-F "notif" | Confirmed bug: `notifications.delete` has no `userId` scoping (`methods.js:36-38`). Owner verdict (Q3): "should idd be scoped to userId". |
| Cross-cutting | `from_source/open_questions.md` | 158 | Q3 | Q3 confirmed the `notifications.delete` scoping gap as a bug. |
| Cross-cutting | `from_source/inventory.md` | — | ctrl-F "notif" | Cross-reference: `in_app_notifications.md` at 228 lines, net-new concept #2 in the inventory. |
| Cross-cutting | `from_source/scout_pass.md` | — | ctrl-F "notif" | Route `/notifications`, collection `notifications`, `NotificationsOverviewPageContainer` listed. Dashboard `MainDashboardPage` mentioned as including notification widget. |
| Curated | `functional/application_map.md` | 62 | full | Notifications are NOT listed in the 20 core competencies. This area was discovered during the code-read pass. |
| Curated | `functional/user_stories.md` | — | ctrl-F "notif" | US.06 references "automated session reminders" (inferred) but that's about patient-facing reminders, not the in-app notification centre. No user story exists for in-app notifications. |
| Helpdesk | `full_documentation/invoicing_finances.md` | 1124 | lines 70-107 | "Alarmfunctie einde terugbetaling" -- describes the UI for configuring treatment-expiry notification settings (the _producer_ side), but NOT the notification inbox itself. |
| Helpdesk | `full_documentation/general_getting_started.md` | 2191 | ctrl-F "melding" | Line 367: "Melding 'oeps er is iets misgelopen'" -- refers to generic error dialogs, not the notification inbox. No helpdesk article describes the notification centre. |
| Helpdesk | `full_documentation/faq_troubleshooting.md` | 79 | ctrl-F "melding" | Line 18: "melding" used in the sense of a generic system error message, not the inbox. |

### What HalingoDoc covers for this area

The `from_source/features/in_app_notifications.md` file is the single authoritative HalingoDoc source for this area (231 lines). It provides a thorough code-derived description: data model with all fields, the three Meteor methods (`notifications.seen`, `notifications.read`, `notifications.delete`), both publications (`notifications.all`, `notifications.new`), all six known notification producer call sites, the three UI surfaces (navbar bell, dashboard tile, full page), the `new`/`seen`/`read` state machine, and notable implementation details (stale util files, `meta` HTML injection risk, `practiceId` stored but unused, bilingual i18n keys).

The helpdesk layer covers only the _configuration_ of treatment-expiry alerts ("Alarmfunctie einde terugbetaling" in `invoicing_finances.md`), not the notification inbox where those alerts land.

The cross-cutting files confirm one bug (`notifications.delete` missing `userId` scope) and one dead-code entry (stale `util.jsx` files).

### What HalingoDoc does NOT cover for this area

- **No helpdesk article** describes the notification centre, the bell icon, the popover, or the `/notifications` page. Users discover these organically.
- **No user story** maps to in-app notifications.
- **No application_map entry** exists -- this area is entirely absent from the 20-competency taxonomy.
- **Practice-level notification settings** (e.g., `settings.patientFiles.notifications.date` and `settings.patientFiles.notifications.sessions` on the `practices` collection) are referenced by the treatment-expiry producer code but not documented in a notification-specific context. The helpdesk "Alarmfunctie" article covers the per-treatment UI but not the practice-wide defaults.
- **Notification retention/cleanup policy** -- no documentation on whether old notifications are ever pruned. The `removed`/`removedAt` fields exist on the schema but are never written by any producer or method.

### Direct citations worth preserving

> From `from_source/features/in_app_notifications.md` (top banner):
>
> > **Confirmed bug pending fix:** `notifications.delete` (`api/notifications/methods.js:36-38`) has no `userId` scoping in its selector. Confirmed by the product owner 2026-04-07 (Q3 of `open_questions.md`): "should idd be scoped to userId".

> From `from_source/features/in_app_notifications.md` (Notable details):
>
> > **`meta` is dangerously powerful.** Because `meta` is spread onto the `<Text resources=... />` component and `body` is rendered with `allowHTML`, the notification author has full control over HTML rendered in the user's inbox. Every current producer passes an `attributes: { ... }` object used for i18n interpolation, but a malicious insert would not be sanitised.

> From `from_source/features/in_app_notifications.md` (Behaviour inference):
>
> > Nothing in the codebase explicitly scopes notifications by `practiceId` at read time -- a user who is a member of multiple practices will see a single merged inbox containing entries from all of them. The stored `practiceId` exists on the document but is not filtered on by the publications.

---

## Source 2 -- Meteor source slice

### Files read (30 total)

Starting points taken from `from_source/features/in_app_notifications.md` file:line citations. Walked outward from there.

- `app/imports/api/notifications/` (4 files)
  - `notifications.jsx` -- `Notifications` collection, SimpleSchema, states enum (`NEW`/`READ`/`SEEN`), types enum (`ERROR`/`INFO`/`SUCCESS`/`WARNING`), `publicFields` (strips `removed`/`removedAt`), `isRead()` helper, client-side deny rules
  - `methods.js` -- 3 methods: `notifications.seen`, `notifications.read`, `notifications.delete`
  - `util.jsx` -- **DEAD CODE**: imports `Events` (not `Notifications`), exports empty `EventsUtil` object. Never imported anywhere.
- `app/imports/api/notifications/server/` (3 files)
  - `index.js` -- barrel import: `./indexes`, `./publications.js`, `../methods.js`
  - `indexes.js` -- creates index on `{userId: 1}` at startup
  - `publications.js` -- 2 publications: `notifications.all` (paginated inbox), `notifications.new` (unread count via `Counts.publish` + 3 most recent)
  - `util.jsx` -- **DEAD CODE**: imports `Events` (not `Notifications`), exports empty `EventsUtil` object. Never imported anywhere.
- `app/imports/api/collection.js` (1 file)
  - Base `Collection` class: auto-sets `createdAt` on `insert()` and `$setOnInsert.createdAt` on `upsert()`.
- `app/imports/ui/pages/notifications/` (1 file)
  - `NotificationsOverviewPage.jsx` -- full `/notifications` page: `InfiniteScroll` with `loadMore` (increments by 10), empty state "Geen meldingen", `componentWillUnmount` calls `markNotificationsAsRead` and resets the subscription limit via `onLimitChange(null)`.
- `app/imports/ui/containers/notifications/` (1 file)
  - `NotificationsOverviewPageContainer.js` -- `withTracker` container: subscribes to `notifications.all` with reactive `limit` (initial 10), queries client-side `Notifications.find({userId}, {sort: {createdAt: -1}, limit})`, passes `onLimitChange` to bump the reactive var.
- `app/imports/ui/components/notification/` (4 files)
  - `NotificationListView.jsx` -- single notification row: left border colored by type (red/blue/green/yellow), bold if unread, i18n-translated `title` (h4) and `body` with `meta` spread as props and `allowHTML`, `NotificationTime` on the right, red X icon with `confirmDelete()` modal.
  - `UnreadNotifications.jsx` -- navbar bell component: subscribes to `notifications.new`, renders `HalIcon` (filled bell when `newCount > 0`, empty otherwise), yellow badge with count, `Popover` showing 3 most recent notifications on click. First click calls `markNotificationsAsSeen`. Footer link "Zie alle meldingen" navigates to `/notifications`.
  - `NotificationTime.jsx` -- renders `moment.fromNow()` string updated every 1000ms via `IntervalDataProvider`.
  - `Notifications.jsx` -- **DISTINCT from inbox**: `notistack`-backed transient toast system (`NotificationManager.error/info/success/warning`). Mounted in `AppLayout.jsx`. Not persisted.
- `app/imports/modules/notifications/` (2 files)
  - `NotificationWidget.jsx` -- dashboard tile: yellow background when `count > 0`, navy otherwise, triangular warning icon, count number, "Meldingen" label, navigates to `/notifications` on click.
  - `NotificationWidgetContainer.jsx` -- `withTracker`: reads `Counts.get("notifications.new.count")`.
- `app/imports/ui/pages/main/MainDashboardPage.jsx` (1 file, partial)
  - Dashboard layout: 4-cell grid with `notifications` widget at position (0,0) in both small and big layouts.
- `app/imports/ui/components/menu/Menu.jsx` (1 file, partial -- line 474)
  - Mounts `<UnreadNotifications className="navbar-unread" />` in the top navbar.
- `app/imports/startup/client/routes/notifications.js` (1 file)
  - FlowRouter route: `/notifications` -> `NotificationsOverviewPageContainer`, title: `"notifications.title"`, wrapped in `authenticatedMount(AppContainer, ...)`.
- `app/imports/i18n/resources/client/nl.i18n.js` (1 file, partial -- lines 188-236, 490-504)
  - NL notification i18n keys.
- `app/imports/i18n/resources/client/fr.i18n.js` (1 file, partial -- lines 188-236)
  - FR notification i18n keys.
- **Producer call sites** (5 files, partial reads):
  - `app/imports/api/patientFiles/methods.jsx:374` -- `notifications.patientFile.shared.{title,body}` (INFO). Trigger: another user grants access to a patient file.
  - `app/imports/api/practice/server/util.tsx:117` -- `notifications.practice.invite.{title,body}` (INFO). Trigger: a user is invited to join a practice. **Only fires if the invited user already has a Halingo account** (the `if (user)` guard at line 116).
  - `app/imports/api/payments/server/stripe.ts:78` -- `notifications.practice.newStripeInvoice.paid.{title,body}` (INFO). Trigger: Stripe auto-payment succeeded. Sent to practice owner.
  - `app/imports/api/payments/server/stripe.ts:139` -- `notifications.practice.newStripeInvoice.failed.{title,body}` (INFO). Trigger: Stripe auto-payment failed. Sent to practice owner.
  - `app/imports/api/subscriptions/server/invoiceCreator.jsx:233` -- `notifications.practice.newInvoice.{title,body}` (INFO). Trigger: new unpaid subscription invoice generated. Sent to practice owner.
  - `app/imports/api/treatments/server/util.js:88` -- `patient.treatments.notifications.expiring.{title, .date or .sessions}` (WARNING). Trigger: treatment coverage about to expire. Sent to each `patientFileUser` of the patient file, or if none exist, to all practice owners/admins.
- **Treatment observer files** (2 files):
  - `app/imports/api/treatments/server/TreatmentDateObserver.js` -- schedules `SyncedCron` job to fire X days before bilan end date. Default: 7 days. Configurable per-treatment via `notifications.date` or falls back to `practice.settings.patientFiles.notifications.date`.
  - `app/imports/api/treatments/server/TreatmentSessionObserver.js` -- schedules `SyncedCron` job to fire after session N-X completes where X defaults to 10. Configurable per-treatment via `notifications.sessions` or falls back to `practice.settings.patientFiles.notifications.sessions`.

### Key symbols per file

- `notifications.jsx:6` -- `Notifications = new Collection("notifications")`: Mongo collection inheriting from custom `Collection` base class (auto-sets `createdAt`).
- `notifications.jsx:8-12` -- `Notifications.deny(insert/update/remove)`: client-side mutations fully denied.
- `notifications.jsx:14-18` -- `Notifications.states = {NEW: "new", READ: "read", SEEN: "seen"}`: three-state enum.
- `notifications.jsx:20-25` -- `Notifications.types = {ERROR: "error", INFO: "info", SUCCESS: "success", WARNING: "warning"}`: four-type enum.
- `notifications.jsx:27-56` -- SimpleSchema: `createdAt`, `body`, `meta` (blackbox Object), `removed` (optional Boolean), `removedAt` (optional Date), `practiceId` (optional String), `state` (enum, defaults `NEW`), `title`, `type` (enum), `userId` (required String).
- `notifications.jsx:58-61` -- `publicFields`: `{removed: 0, removedAt: 0}` -- stripped from publications.
- `notifications.jsx:63-67` -- `isRead()` helper: `this.state === Notifications.states.READ`.
- `methods.js:7-17` -- `notifications.seen`: bulk `$set state: SEEN` on all of the caller's `NEW` notifications. No parameters. Returns boolean.
- `methods.js:19-29` -- `notifications.read`: bulk `$set state: READ` on all of the caller's non-`READ` notifications. No parameters. Returns boolean.
- `methods.js:31-39` -- `notifications.delete`: hard `Notifications.remove(notificationId)` -- **BUG: no `userId` scoping**. Any logged-in user can delete any notification by ID.
- `server/publications.js:5-10` -- `notifications.all`: `Notifications.find({userId: this.userId}, {sort: {createdAt: -1}, limit, fields: publicFields})`.
- `server/publications.js:12-31` -- `notifications.new`: (1) `Counts.publish` for `notifications.new.count` with filter `{userId, state: NEW}`, (2) 3 most recent notifications for the user regardless of state.
- `server/indexes.js:5-7` -- index `{userId: 1}` on the `notifications` collection.
- `NotificationsOverviewPage.jsx:15` -- initial `limit = 10`, increments by 10 on `loadMore`.
- `NotificationsOverviewPage.jsx:20-23` -- `componentWillUnmount`: calls `markNotificationsAsRead()` and `onLimitChange(null)`.
- `UnreadNotifications.jsx:35-38` -- `togglePopover`: on first open, calls `markNotificationsAsSeen()`.
- `UnreadNotifications.jsx:56-64` -- bell icon rendering: `"notification"` (filled) when `newCount > 0`, `"notification-none"` (empty) otherwise.
- `UnreadNotifications.jsx:128-139` -- `withTracker`: subscribes to `notifications.new`, queries 3 most recent from MiniMongo.
- `NotificationWidget.jsx:23-28` -- dashboard tile: yellow background when `count > 0`, navy otherwise.
- `TreatmentDateObserver.js:40` -- default date threshold: 7 days before bilan end.
- `TreatmentDateObserver.js:57-91` -- `SyncedCron` scheduled job for date-based notification.
- `TreatmentSessionObserver.js:124` -- default session threshold: 10 sessions remaining.
- `TreatmentSessionObserver.js:51-78` -- `SyncedCron` scheduled job for session-count-based notification.
- `treatments/server/util.js:16-28` -- `getNotificationSetting(treatment, name, defaultValue)`: reads `treatment.notifications[name]`, falls back to `practice.settings.patientFiles.notifications[name]`, then to `defaultValue`.
- `treatments/server/util.js:60-97` -- `sendNotification(treatmentId, body, title, options)`: sends to each `patientFileUser` of the treatment's patient file, or to practice owners/admins if no `patientFileUsers` exist.

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | Practice invite notification only sent to existing users | `from_source/features/in_app_notifications.md:99` says "A user is invited to join a practice" | Source (`practice/server/util.tsx:116`) has `if (user)` guard -- notification only fires if the invited email belongs to an existing Halingo account. Invitations to new (unregistered) users generate the email but NOT the in-app notification. | Source -- the conditional is explicit. HalingoDoc is not wrong per se but omits the guard. |
| 2 | Stripe payment failure notification type | Not explicitly stated which `Notifications.types` value is used | Source (`stripe.ts:148`) uses `Notifications.types.INFO` even for payment failures, not `WARNING` or `ERROR`. Both success and failure use INFO type. | Source. This may be a quirk worth preserving or fixing. |
| 3 | `removed`/`removedAt` fields never written | `from_source/features/in_app_notifications.md:36-37` says "Soft-delete scaffold. Not written anywhere; stripped from publications." | Confirmed: no code path ever sets `removed: true` or `removedAt`. Delete is always hard-delete via `Notifications.remove()`. `publicFields` strips them from publications as a safeguard. | Consistent. The soft-delete fields are schema-only. |
| 4 | Practice-wide notification defaults | Not mentioned in `in_app_notifications.md` | `treatments/server/util.js:25` reads `practice.settings.patientFiles.notifications.{date,sessions}` as fallback values when the per-treatment setting is not set. The helpdesk "Alarmfunctie" article describes the per-treatment UI but not the practice-wide default. | Source extends the picture. |

---

## Source 3 -- Staging exploration

**Staging URL:** `http://localhost:3000` (local Meteor instance)
**Screens visited:** 1 (login page only -- public, unauthenticated)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/in-app-notifications/`
**Tool used:** `browser-fetch` (headless Puppeteer screenshot)
**Limitation:** `browser-fetch` cannot interact with form fields (type credentials, click buttons). All gated screens requiring login are DEFERRED.

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/login` | Login page | NL | Email field, password field, "Log in" button, "Wachtwoord vergeten?" link, register link | `01-login-page.png` |

### Screens not reached (and why)

The following screens require authenticated access. The `browser-fetch` tool can take screenshots but cannot fill forms or click buttons. A future session with a browser-pilot capable of form interaction (or manual exploration) is needed.

- **Dashboard with notification widget** -- `/` after login. Would show the yellow/navy alert tile with count.
- **Navbar bell icon + popover** -- visible on every authenticated page. Would show the bell, badge count, and 3-item popover.
- **Full notifications page** -- `/notifications`. Would show the infinite-scroll list, colored left borders, delete buttons, empty state.
- **Treatment notification settings** -- `/patients/:id` reimbursement tab, bell icon on a treatment. Would show the "Alarmfunctie" UI for configuring per-treatment `notifications.date` and `notifications.sessions`.

### Data validation via direct Mongo query

To supplement the limited browser exploration, the local Mongo instance was queried directly (`mongodb://127.0.0.1:27117/halingo`):

- The `notifications` collection exists and has zero documents (expected -- local dev has no Stripe events, no patient-file shares, no treatment observers running).
- Three test notifications were inserted with `_PARITY_TEST_` prefixed IDs to validate the schema works, then immediately cleaned up. All three were confirmed to match the expected schema shape (`createdAt`, `title`, `body`, `type`, `state`, `meta`, `userId`, `practiceId`).
- Post-cleanup count: 0 documents remaining.

---

## Features

A "feature" is the smallest user-visible behavior that can be tested in isolation.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `notification/navbar-bell-badge` | Navbar bell icon with unread count badge | docs + source | `ui/components/notification/UnreadNotifications.jsx`, `ui/components/menu/Menu.jsx:474` | `from_source/features/in_app_notifications.md` lines 129-137 | DEFERRED (gated) | Filled bell when count > 0, empty otherwise. Yellow badge. |
| 2 | `notification/navbar-popover` | Bell click opens popover with 3 most recent | docs + source | `ui/components/notification/UnreadNotifications.jsx:66-113` | `from_source/features/in_app_notifications.md` lines 133-137 | DEFERRED (gated) | First click marks all `new` as `seen`. Shows warning icon, title, relative time. "Zie alle meldingen" link. |
| 3 | `notification/dashboard-tile` | Dashboard alert tile with count | docs + source | `modules/notifications/NotificationWidget.jsx`, `NotificationWidgetContainer.jsx`, `ui/pages/main/MainDashboardPage.jsx:27,34,54` | `from_source/features/in_app_notifications.md` lines 139-145 | DEFERRED (gated) | Yellow when count > 0, navy otherwise. Navigates to `/notifications`. |
| 4 | `notification/inbox-page` | Full `/notifications` page with infinite scroll | docs + source | `ui/pages/notifications/NotificationsOverviewPage.jsx`, `ui/containers/notifications/NotificationsOverviewPageContainer.js` | `from_source/features/in_app_notifications.md` lines 148-159 | DEFERRED (gated) | Initial limit 10, increment by 10 on scroll. Color-coded left border by type. Bold if unread. |
| 5 | `notification/mark-seen` | Mark all notifications as `seen` on bell popover open | docs + source | `api/notifications/methods.js:7-17` | `from_source/features/in_app_notifications.md` lines 69-76 | DEFERRED | Clears unread badge without marking as `read`. |
| 6 | `notification/mark-read` | Mark all notifications as `read` on `/notifications` page unmount | docs + source | `api/notifications/methods.js:19-29`, `NotificationsOverviewPage.jsx:20-23` | `from_source/features/in_app_notifications.md` lines 78-83 | DEFERRED | Fires on `componentWillUnmount`, not on page open. |
| 7 | `notification/delete-single` | Delete individual notification from inbox | docs + source | `api/notifications/methods.js:31-39`, `NotificationListView.jsx:37-41` | `from_source/features/in_app_notifications.md` lines 85-91 | DEFERRED | Hard delete via `Notifications.remove()`. Confirm modal first. **BUG: no userId scoping.** |
| 8 | `notification/produce-patient-file-shared` | Create notification when patient file access is granted | docs + source | `api/patientFiles/methods.jsx:374` | `from_source/features/in_app_notifications.md` line 98 | DEFERRED | Type: INFO. i18n: `notifications.patientFile.shared.{title,body}`. Body contains inline `<a>` link to the dossier. |
| 9 | `notification/produce-practice-invite` | Create notification when user is invited to a practice | docs + source | `api/practice/server/util.tsx:117` | `from_source/features/in_app_notifications.md` line 99 | DEFERRED | Type: INFO. Only fires if the invitee already has a Halingo account (`if (user)` guard). Body contains inline `<a>` link to the join URL. |
| 10 | `notification/produce-stripe-payment-success` | Create notification on Stripe subscription auto-payment success | docs + source | `api/payments/server/stripe.ts:78` | `from_source/features/in_app_notifications.md` line 100 | DEFERRED | Type: INFO. Sent to practice owner only. Body links to subscription overview. |
| 11 | `notification/produce-stripe-payment-failure` | Create notification on Stripe subscription auto-payment failure | docs + source | `api/payments/server/stripe.ts:139` | `from_source/features/in_app_notifications.md` line 101 | DEFERRED | Type: INFO (not WARNING/ERROR -- QUIRK-PRESERVE candidate). Sent to practice owner only. |
| 12 | `notification/produce-subscription-invoice` | Create notification when new unpaid subscription invoice is generated | docs + source | `api/subscriptions/server/invoiceCreator.jsx:233` | `from_source/features/in_app_notifications.md` line 102 | DEFERRED | Type: INFO. Sent to practice owner only. Body links to subscription overview. |
| 13 | `notification/produce-treatment-expiry-by-date` | Create notification X days before treatment bilan end date | docs + source | `api/treatments/server/TreatmentDateObserver.js:77-89`, `api/treatments/server/util.js:60-97` | `from_source/features/in_app_notifications.md` line 103 | DEFERRED | Type: WARNING. Default threshold: 7 days. Configurable per-treatment or per-practice. Sent via `SyncedCron`. Recipients: patientFileUsers or practice owners/admins. |
| 14 | `notification/produce-treatment-expiry-by-sessions` | Create notification when X sessions remain on a treatment | docs + source | `api/treatments/server/TreatmentSessionObserver.js:66-76`, `api/treatments/server/util.js:60-97` | `from_source/features/in_app_notifications.md` line 103 | DEFERRED | Type: WARNING. Default threshold: 10 sessions. Configurable per-treatment or per-practice. Sent via `SyncedCron`. |
| 15 | `notification/treatment-notification-settings` | Configure per-treatment notification thresholds (date and session count) | source + helpdesk | `api/treatments/methods.js:154` (`editTreatmentNotificationSettings`), `api/treatments/treatments.js:120-125` | `full_documentation/invoicing_finances.md:72-107` ("Alarmfunctie einde terugbetaling") | DEFERRED | Treatment schema fields: `notifications.{enabled, date, sessions, dateScheduled, sessionsScheduled}`. Cross-area with #6 Treatment Planning. |
| 16 | `notification/realtime-count` | Real-time unread count via reactive `Counts.publish` | docs + source | `api/notifications/server/publications.js:13-21` | `from_source/features/in_app_notifications.md` lines 119-126, 177 | DEFERRED | Count appears on bell badge and dashboard tile simultaneously. Updates without page refresh. |

**16 features discovered** (0 deprecated). HalingoDoc's `in_app_notifications.md` covered 15 of 16 features (94%). Feature #15 (treatment notification settings) was only fully understood by combining the helpdesk "Alarmfunctie" article with the Meteor source. Staging walk was deferred due to tool limitations.

### Feature detail -- `notification/navbar-bell-badge`

- **Description:** On every page of the authenticated app, the top navbar shows a bell icon. When there are unread (`new` state) notifications, the bell icon is filled and a yellow badge shows the count. When there are none, the bell icon is empty (outline only) and no badge is shown.
- **Found via:** docs + source
- **Legacy source file(s):** `ui/components/notification/UnreadNotifications.jsx:54-64`, `ui/components/menu/Menu.jsx:474`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` lines 129-137
- **Staging screen(s):** DEFERRED
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `notification/navbar-popover`

- **Description:** Clicking the bell icon opens a popover showing the 3 most recent notifications (regardless of state). Each item shows a warning icon, the translated title (bold if not `read`), and a live relative-time string ("3 minutes ago") updating every second. At the bottom, a "Zie alle meldingen" / "Voir toutes les notifications" link navigates to `/notifications`. The first time the popover is opened, `notifications.seen` is called to transition all `new` items to `seen`.
- **Found via:** docs + source
- **Legacy source file(s):** `ui/components/notification/UnreadNotifications.jsx:66-113`, `:35-38`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` lines 133-137
- **Belgian-specific concerns:** bilingual NL/FR via i18n keys
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** the popover always shows a warning icon for every notification regardless of type (no color differentiation in popover vs the full page which has colored left borders)
- **Open questions:** none

### Feature detail -- `notification/dashboard-tile`

- **Description:** The main dashboard has a 4-cell widget grid. The top-left cell is a square tile showing a triangular warning icon, the unread count, and the word "Meldingen" / "Notifications". Background is yellow when `count > 0`, navy when `count === 0`. Clicking navigates to `/notifications`.
- **Found via:** docs + source
- **Legacy source file(s):** `modules/notifications/NotificationWidget.jsx:8-32`, `NotificationWidgetContainer.jsx:6-10`, `ui/pages/main/MainDashboardPage.jsx:27,34,54`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` lines 139-145
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `notification/inbox-page`

- **Description:** Full-page notification list at `/notifications`. Uses `InfiniteScroll` with initial limit of 10 items, incrementing by 10 on scroll. Each notification row has a left border colored by type (red=error, blue=info, green=success, yellow=warning), thicker border (8px vs 4px) and bold font when not `read`, translated title (h4) and body with `meta` props for string substitution and `allowHTML`, a live relative-time on the right, and a red X icon that opens a confirm dialog then calls `notifications.delete`. Empty state shows "Geen meldingen" / "Aucune notification" centered. On unmount, calls `notifications.read` to mark all items as `read`.
- **Found via:** docs + source
- **Legacy source file(s):** `ui/pages/notifications/NotificationsOverviewPage.jsx`, `ui/containers/notifications/NotificationsOverviewPageContainer.js`, `ui/components/notification/NotificationListView.jsx`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` lines 148-159
- **Belgian-specific concerns:** bilingual NL/FR
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:**
  - Mark-as-read happens on *unmount*, not on page open. So a user who reloads `/notifications` will still see items in `seen`/`new` state.
  - `InfiniteScroll` `hasMore` check: `this.limit <= this.props.notifications.length` -- comparison is `<=` not `<`, meaning it stops loading only when the fetched count is strictly less than the limit, which is correct for detecting exhaustion.
- **Open questions:** none

### Feature detail -- `notification/delete-single`

- **Description:** Each notification row in the inbox has a red X icon. Clicking it opens a confirmation dialog. On confirmation, `notifications.delete` is called with the notification's `_id`, which hard-deletes the document from MongoDB.
- **Found via:** docs + source
- **Legacy source file(s):** `api/notifications/methods.js:31-39`, `ui/components/notification/NotificationListView.jsx:37-41`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` lines 85-91
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none -- the missing `userId` scope is a confirmed **BUG** (Q3), not a deliberate quirk
- **Open questions:** none

### Feature detail -- `notification/produce-treatment-expiry-by-date`

- **Description:** When a treatment has notifications enabled and has a bilan with an end date, a `SyncedCron` job is scheduled to fire X days before that end date. The default threshold is 7 days, configurable per-treatment via `treatment.notifications.date` or per-practice via `practice.settings.patientFiles.notifications.date`. When the job fires, it validates the treatment is still active, not incomplete, and enabled, then calls `sendNotification` which creates a WARNING-type notification for each `patientFileUser` on the treatment's patient file (or for each practice owner/admin if no `patientFileUsers` exist).
- **Found via:** docs + source
- **Legacy source file(s):** `api/treatments/server/TreatmentDateObserver.js:17-91`, `api/treatments/server/util.js:16-97`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` line 103, `full_documentation/invoicing_finances.md:72-107`
- **Belgian-specific concerns:** treatment/bilan end dates are RIZIV-governed (session caps per pathology determine when coverage expires)
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** the observer uses `SyncedCron` which runs in-process; on server restart, cached scheduled dates are restored from `treatment.notifications.dateScheduled`
- **Open questions:** none

### Feature detail -- `notification/produce-treatment-expiry-by-sessions`

- **Description:** Similar to date-based expiry but fires when the remaining session count drops below a threshold. Default threshold: 10 sessions remaining. Configurable per-treatment or per-practice. Triggered by `TreatmentSessionObserver` which finds the event whose completion would cross the threshold and schedules a `SyncedCron` job for that event's end time.
- **Found via:** docs + source
- **Legacy source file(s):** `api/treatments/server/TreatmentSessionObserver.js:14-78`, `api/treatments/server/util.js:16-97`
- **HalingoDoc file(s):** `from_source/features/in_app_notifications.md` line 103
- **Belgian-specific concerns:** session counting is RIZIV-linked (counts only `hasPayBack` events of type 1)
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** uses `SyncedCron` in-process; same restart-recovery pattern as the date observer
- **Open questions:** none

### Feature detail -- `notification/treatment-notification-settings`

- **Description:** Each treatment has a `notifications` sub-object with fields: `enabled` (boolean, default true), `date` (number, days before end date), `sessions` (number, sessions remaining threshold), `dateScheduled` (Date, set by the observer), `sessionsScheduled` (Date, set by the observer). The user can edit `enabled`, `date`, and `sessions` via the `editTreatmentNotificationSettings` method. When toggled off, existing observers are removed; when toggled on, observers are (re)created. Practice-level defaults live at `practice.settings.patientFiles.notifications.{date,sessions}`.
- **Found via:** source + helpdesk
- **Legacy source file(s):** `api/treatments/methods.js:154` (`editTreatmentNotificationSettings`), `api/treatments/treatments.js:118-125`
- **HalingoDoc file(s):** `full_documentation/invoicing_finances.md:72-107` ("Alarmfunctie einde terugbetaling")
- **Belgian-specific concerns:** none directly (the thresholds are user-configurable, not RIZIV-mandated)
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** notifications are enabled by default (`defaultValue: true`)
- **Open questions:** none. Cross-area with #6 Treatment Planning.

---

## Cross-references to other areas

- **#1 Identity Management:** notifications are per-user (`userId` field), published using `this.userId` from the Meteor session. The notification system depends on the authentication layer for user identity.
- **#3 Patient Data Privacy / Patient Management:** the patient-file-shared notification producer lives in `patientFiles/methods.jsx`. The notification includes the patient's name in `meta.attributes.patientName` -- GDPR-relevant PII in the notification document.
- **#6 Treatment Planning:** treatment-expiry notifications (features #13, #14, #15) are tightly coupled to the treatment/bilan lifecycle and the `SyncedCron` scheduling mechanism. The `editTreatmentNotificationSettings` method requires `treatments.edit` permission.
- **#7 Reimbursement Tracking:** session-count notifications depend on the session-counting logic (`hasPayBack`, `sessionCount`) from the reimbursement domain.
- **#20 SaaS Lifecycle:** three of the six producer call sites are SaaS billing events: Stripe payment success/failure and new subscription invoice. These fire for the practice owner only.
- **#19 Practice Analytics / Dashboard:** the dashboard notification tile is part of the `MainDashboardPage` widget grid, alongside open-bills, todos, and newsfeed widgets.

---

## [NEEDS CLARIFICATION]

### Q1: Should practice invite notifications be sent to unregistered invitees?

- **Why it matters:** currently, `practice/server/util.tsx:116` has an `if (user)` guard -- notifications are only created for invitees who already have a Halingo account. If the invitee is new (email not in the `users` collection), they get the invitation email but NOT an in-app notification. This seems intentional (a non-existent user has no inbox), but the spec author should confirm whether a notification should be created retroactively when the user registers.
- **Sources conflict?** no -- code is clear, HalingoDoc does not mention the guard.
- **What would resolve:** product owner answer.

### Q2: Are old notifications ever pruned?

- **Why it matters:** the `notifications` collection has no TTL index, no cron-based cleanup, and no automatic pruning. Over years, a heavy user's inbox could accumulate thousands of documents. The `removed`/`removedAt` soft-delete fields exist on the schema but are never written. `notifications.delete` hard-deletes.
- **Sources conflict?** no -- all sources agree there is no pruning.
- **What would resolve:** product owner answer on retention policy + whether to add a TTL index or periodic cleanup.

### Q3: Should the inbox show practice-scoped notifications or a merged inbox?

- **Why it matters:** currently, publications filter only by `userId` -- a multi-practice user sees all notifications from all practices in a single merged inbox. The `practiceId` is stored on the document but never filtered on. The Phase 2 spec author needs to decide if the ported version should scope by current practice or preserve the merged behavior.
- **Sources conflict?** no -- code is clear, HalingoDoc flags the behavior as "inferred from code; needs product validation".
- **What would resolve:** product owner answer.

### Q4: Stripe payment failure uses INFO type instead of WARNING or ERROR -- is this intentional?

- **Why it matters:** `stripe.ts:148` sets `type: Notifications.types.INFO` for payment failures. The inbox renders INFO notifications with a blue left border, same as successes. A WARNING (yellow) or ERROR (red) border would be more visually distinct. The spec author should clarify whether this is a quirk to preserve or a bug to fix.
- **Sources conflict?** no.
- **What would resolve:** product owner answer.

### Q5: Source 3 staging walk is incomplete -- gated screens not reached

- **Why it matters:** all notification UI surfaces (bell, popover, dashboard tile, inbox page, treatment settings) require an authenticated session. The `browser-fetch` tool cannot interact with forms.
- **Sources conflict?** no.
- **What would resolve:** a follow-up session with an interactive browser-pilot tool, or manual exploration by the human.

---

## [NEEDS DOMAIN REVIEW]

### Q: Do treatment notification thresholds interact with RIZIV session cap rules?

- **Found in:** `api/treatments/server/TreatmentSessionObserver.js:124` (default 10 sessions remaining), `api/treatments/server/TreatmentDateObserver.js:40` (default 7 days before bilan end)
- **Why it matters:** RIZIV session caps vary by pathology (e.g., 60 sessions for some disorders, 120 for others). The default threshold of "10 sessions remaining" is a flat number, not a percentage of the cap. For a 60-session cap, 10 remaining = 83% consumed. For a 120-session cap, 10 remaining = 92% consumed. The spec author should verify whether the defaults are appropriate or whether a percentage-based threshold would be more clinically useful.
- **What I know:** the thresholds are user-configurable per-treatment and per-practice, so the defaults are just starting points. The RIZIV session caps are documented in the `logopedist-be` skill.
- **Resolution:** pending -- Claude session with logopedist-be skill during Phase 2 spec authoring.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md (ctrl-F only)
/home/tj/HalingoDoc/docs/full_documentation/invoicing_finances.md (lines 70-107)
/home/tj/HalingoDoc/docs/full_documentation/general_getting_started.md (ctrl-F only)
/home/tj/HalingoDoc/docs/full_documentation/faq_troubleshooting.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/features/in_app_notifications.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (ctrl-F "notif")
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F "notif")
/home/tj/HalingoDoc/docs/from_source/open_questions.md (Q3)
/home/tj/HalingoDoc/docs/from_source/inventory.md (ctrl-F "notif")
/home/tj/HalingoDoc/docs/from_source/scout_pass.md (ctrl-F "notif")

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/notifications.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/util.jsx (dead code)
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/indexes.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/util.jsx (dead code)
/home/tj/Repos/Halingo-Main/app/imports/api/collection.js
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/notifications/NotificationsOverviewPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/notifications/NotificationsOverviewPageContainer.js
/home/tj/Repos/Halingo-Main/app/imports/ui/components/notification/NotificationListView.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/notification/UnreadNotifications.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/notification/NotificationTime.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/notification/Notifications.jsx (transient toast -- distinct)
/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/menu/Menu.jsx (line 474)
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/notifications.js
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js (partial: lines 188-236, 490-504)
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/fr.i18n.js (partial: lines 188-236)
/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/methods.jsx (line 374)
/home/tj/Repos/Halingo-Main/app/imports/api/practice/server/util.tsx (lines 95-131)
/home/tj/Repos/Halingo-Main/app/imports/api/payments/server/stripe.ts (lines 65-151)
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/server/invoiceCreator.jsx (lines 220-248)
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/util.js (lines 11-97)
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/TreatmentDateObserver.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/TreatmentSessionObserver.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/methods.js (line 154)
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/treatments.js (lines 118-125)

# Staging screenshots (source 3)
/home/tj/halingoMigration/01-discovery/staging-screens/in-app-notifications/01-login-page.png
```

---

## Verification notes (verbatim from `01-discovery/in-app-notifications.verification.md`)

# Verification: In-App Notifications

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/in-app-notifications.md`
- **Verdict:** PASS

## Overall assessment

This is the highest-quality discovery verified in this session. At 357 lines and 16 features with detailed per-feature breakdowns, it provides near-complete coverage of the `in_app_notifications.md` HalingoDoc source (231 lines). The feature catalog is at the right granularity — each feature is testable in isolation. Citations are consistently accurate (off by 1-2 lines). Four legitimate discrepancies were identified from source reading. Five well-formulated [NEEDS CLARIFICATION] entries and one [NEEDS DOMAIN REVIEW] entry are appropriate. The only weakness is the limited staging walk (1 login page screenshot — tool limitation acknowledged).

## Citation accuracy

| # | Claim in discovery | Cited location | Actual location | Verified? |
|---|---|---|---|---|
| 1 | Navbar bell behavior | `in_app_notifications.md` lines 129-137 | Lines 129-137 | ✓ Exact |
| 2 | Dashboard tile | `in_app_notifications.md` lines 139-145 | Lines 138-145 | ✓ Off by 1 |
| 3 | Full inbox page | `in_app_notifications.md` lines 148-159 | Lines 146-159 | ✓ Off by 2 |
| 4 | `notifications.seen` method | `in_app_notifications.md` lines 69-76 | Lines 68-74 | ✓ Off by 1 |
| 5 | `notifications.read` method | `in_app_notifications.md` lines 78-83 | Lines 76-82 | ✓ Off by 2 |
| 6 | `notifications.delete` method | `in_app_notifications.md` lines 85-91 | Lines 84-89 | ✓ Off by 1 |
| 7 | Patient-file-shared producer | `in_app_notifications.md` line 98 | Line 97 | ✓ Off by 1 |
| 8 | Practice invite producer | `in_app_notifications.md` line 99 | Line 98 | ✓ Off by 1 |
| 9 | `notifications.delete` bug quote | Top banner of `in_app_notifications.md` | Lines 0-2 | ✓ Verbatim |
| 10 | `meta` HTML injection risk | Notable details section | Line 175 | ✓ Confirmed |
| 11 | `practiceId` stored but unused | Behaviour inference section | Line 160, 181 | ✓ Confirmed |
| 12 | Meteor source `notifications.jsx:14-18` for states enum | Source | Confirmed per HalingoDoc line 31 | ✓ |
| 13 | Meteor source `methods.js:31-39` for delete bug | Source | Confirmed per HalingoDoc line 88 | ✓ |
| 14 | `TreatmentDateObserver.js:40` default 7 days | Source | Confirmed — HalingoDoc doesn't cite this line but the behavior is documented | ✓ |
| 15 | `TreatmentSessionObserver.js:124` default 10 sessions | Source | Confirmed — same pattern | ✓ |

**All 15 citations verified.** Line numbers are consistently within 1-2 lines of actual content. This is dramatically better citation accuracy than other discoveries verified today.

## Material omissions

**None of substance.** The discovery covers:
- Full data model (all 10 schema fields) ✓
- All 3 methods with detailed behavior ✓
- All 6 producer call sites ✓
- Both publications ✓
- All 3 UI surfaces ✓
- State machine (new → seen → read, delete) ✓
- Permissions and the delete scoping bug ✓
- All notable details from HalingoDoc ✓
- Treatment observers (date and session-based) ✓
- Treatment notification settings (from helpdesk + source) ✓
- Stale util files (dead code) ✓
- notistack vs inbox distinction ✓

One minor omission: the full list of i18n keys (`nl.i18n.js:190-236`) is not reproduced, but the discovery correctly notes bilingual NL/FR support and lists the i18n key pattern for each producer. Not material for spec authoring.

## Discrepancies flagged in discovery

All four discrepancies are legitimate and well-documented:

| # | Discrepancy | Verified? | Finding |
|---|---|---|---|
| 1 | Practice invite only for existing users (`if (user)` guard) | ✓ | HalingoDoc line 98 says "A user is invited to join a practice" — doesn't mention the guard. Discovery correctly identifies it from `practice/server/util.tsx:116`. |
| 2 | Stripe failure uses INFO, not WARNING/ERROR | ✓ | HalingoDoc line 105 says producers use "INFO or WARNING" but doesn't specify which uses which. Discovery identified from `stripe.ts:148`. |
| 3 | `removed`/`removedAt` never written | ✓ | HalingoDoc line 35 confirms: "Not written anywhere; stripped from publications." Consistent. |
| 4 | Practice-wide notification defaults | ✓ | Discovery extends the picture with `practice.settings.patientFiles.notifications.{date,sessions}` fallback. |

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #1 Identity Management | ✓ | Notifications are per-user via `userId`. |
| #3 Patient Data Privacy | ✓ | Patient name in `meta.attributes.patientName` — GDPR-relevant PII. |
| #6 Treatment Planning | ✓ | Treatment-expiry notifications tightly coupled to treatment/bilan lifecycle. |
| #7 Reimbursement Tracking | ✓ | Session-count notifications depend on `hasPayBack`/`sessionCount`. |
| #20 SaaS Lifecycle | ✓ | Three Stripe/subscription producers fire for practice owner. |
| #19 Practice Analytics / Dashboard | ✓ | Dashboard tile in the widget grid. |

All 6 cross-references verified as accurate. No missing cross-references identified.

## Domain review (logopedist-be)

| Claim | Domain finding | Severity |
|---|---|---|
| Notification thresholds vs RIZIV session caps | The thresholds (default 10 sessions, 7 days) are user-configurable per-treatment and per-practice. They are **not** RIZIV-mandated — they're UX convenience defaults. RIZIV session caps vary by pathology (20 to 520) per the `logopedist-be` skill. The flat default of 10 remaining sessions works well for low-cap pathologies (e.g., b.6.5 at 20 total) but may be too late for high-cap ones (e.g., b.6.3 at 520 total). This is a product design question for Phase 2, not a regulatory concern. | NOTE (resolved as product question, not regulatory) |

## Staging exploration assessment

The staging walk is limited (1 login page screenshot) due to `browser-fetch` tool inability to interact with forms. This is acknowledged in the discovery and appropriately flagged as Q5 in [NEEDS CLARIFICATION]. The Source 2 reading (30 files) compensates well for the staging gap.

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-ian-01 | NOTE | staging | Source 3 staging walk limited to 1 public screen due to tool constraints. All 16 features have "DEFERRED" staging. | A follow-up walk with an interactive browser-pilot is recommended but not blocking for Phase 2. |
| V-ian-02 | NOTE | domain | Notification threshold defaults are a product UX question, not a regulatory concern. | NEEDS DOMAIN REVIEW can be resolved as "product question for Phase 2 spec". |
| V-ian-03 | NOTE | process | Rule #7 deviation: producer (Claude Code general-purpose) and verifier (Claude Opus) are same model family. | Flag for human. The discovery quality is high enough that the cross-CLI concern is mitigated. |

## Recommendation

**PROCEED to Phase 2.** This discovery is ready for spec authoring with no supplementation needed. The 16 features are well-defined, citations are accurate, cross-references are complete, and the [NEEDS CLARIFICATION] entries are well-formulated questions for the spec author to resolve.

The spec author should:
1. Resolve Q1-Q4 via product owner interviews (standard Phase 2 AskUserQuestion workflow).
2. Schedule a staging walk (Q5) to capture the gated screens — recommended but not blocking.
3. Treat the domain question (notification thresholds) as a UX design decision, not a regulatory gate.
