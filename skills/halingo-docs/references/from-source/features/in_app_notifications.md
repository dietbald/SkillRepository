# In-app notification centre

> **🟠 Confirmed bug pending fix:** `notifications.delete` (`api/notifications/methods.js:36-38`) has no `userId` scoping in its selector. Confirmed by the product owner 2026-04-07 (Q3 of [`../open_questions.md`](../open_questions.md)): "should idd be scoped to userId". See [`../bugs_and_security_findings.md`](../bugs_and_security_findings.md). Until fixed, any logged-in user can delete any notification by submitting its `_id`.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none for the notification centre itself (the word "melding" in the helpdesk refers to generic UI toasts and error dialogs, not the `/notifications` inbox).

## What it is

An in-app message inbox, per user, that collects system-generated events such as "you've been given access to a patient file", "your subscription invoice failed", or "this treatment's coverage is almost exhausted". It has three surfaces: an unread badge and popover attached to the navbar bell icon, a square "alert" tile on the main dashboard linking to the inbox, and a full `/notifications` page listing all messages. Notifications are read-only from the user's perspective — they are created server-side by other modules; the user can only mark them seen / read and delete individual entries. A separate mechanism (`NotificationManager` / `notistack`) is used for transient toast snackbars and is not the same thing as the inbox.

## Where it lives in the UI

- Route `/notifications` · `NotificationsOverviewPageContainer` · `app/imports/startup/client/routes/notifications.js:12-20`
- Full-page list component · `NotificationsOverviewPage` · `app/imports/ui/pages/notifications/NotificationsOverviewPage.jsx:11`
- Container / tracker for the page · `NotificationsOverviewPageContainer` · `app/imports/ui/containers/notifications/NotificationsOverviewPageContainer.js:12`
- Single-item renderer (both the page and the popover reuse parts of this) · `NotificationListView` · `app/imports/ui/components/notification/NotificationListView.jsx:20`
- Navbar bell with unread counter and dropdown · `UnreadNotifications` · `app/imports/ui/components/notification/UnreadNotifications.jsx:26`, mounted in the top nav at `app/imports/ui/components/menu/Menu.jsx:474`
- Dashboard square widget (the yellow / navy alert tile) · `NotificationWidget` + `NotificationWidgetContainer` · `app/imports/modules/notifications/NotificationWidget.jsx:8`, `app/imports/modules/notifications/NotificationWidgetContainer.jsx:6`, rendered by `MainDashboardPage.jsx:11`, `:27`, `:34`, `:54-56`
- Relative-time renderer used inside both the popover and the list row · `NotificationTime` · `app/imports/ui/components/notification/NotificationTime.jsx:7`
- (Distinct, unrelated) transient toast system · `NotificationManager` / `Notifications` (`notistack`-backed) · `app/imports/ui/components/notification/Notifications.jsx:93`, mounted in `app/imports/ui/layouts/AppLayout.jsx:19`, `:102`, `:116`

## Data model

Collection: `notifications` · `app/imports/api/notifications/notifications.jsx:6`

| Field | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | Set by the base `Collection` on insert. Primary sort key (descending). `notifications.jsx:28`, `app/imports/api/collection.js:13-15` |
| `title` | `String` | i18n key (translated client-side). Example values: `"notifications.patientFile.shared.title"`, `"notifications.practice.invite.title"`, `"notifications.practice.newStripeInvoice.paid.title"`, `"notifications.practice.newStripeInvoice.failed.title"`, `"notifications.practice.newInvoice.title"`, `"patient.treatments.notifications.expiring.title"`. `notifications.jsx:51` |
| `body` | `String` | i18n key (translated client-side, rendered with `allowHTML`). `notifications.jsx:29`, `NotificationListView.jsx:32` |
| `type` | `String` (enum) | One of `'error'`, `'info'`, `'success'`, `'warning'`. Drives the left-border colour. `notifications.jsx:20-25`, `notifications.jsx:52`, `NotificationListView.jsx:13-18` |
| `state` | `String` (enum) | One of `'new'`, `'seen'`, `'read'`. Defaults to `'new'`. `notifications.jsx:14-18`, `notifications.jsx:46-50` |
| `meta` | `Object` (`blackbox: true`) | Arbitrary payload spread as props onto the `<Text resources=... />` component, so string substitution variables (e.g. `attributes: {patientName, practiceName, url}`) are resolved at render time. `notifications.jsx:30-33`, `NotificationListView.jsx:30-32`, `UnreadNotifications.jsx:79-80` |
| `userId` | `String` | Target user. Required. `notifications.jsx:53` |
| `practiceId` | `String` (optional) | Originating practice, if any. Stored but not filtered on at read time. `notifications.jsx:42-45` |
| `removed` | `Boolean` (optional) | Soft-delete scaffold. Not written anywhere; stripped from publications. `notifications.jsx:34-37`, `notifications.jsx:58-61` |
| `removedAt` | `Date` (optional) | Same as above. `notifications.jsx:38-41` |

Client-side mutation is denied:

```js
Notifications.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});
```
`notifications.jsx:8-12`

Collection helper:

- `isRead()` — returns `true` when `this.state === 'read'`. `notifications.jsx:63-67`, used by `NotificationListView.jsx:21` and `UnreadNotifications.jsx:83`.

Mongo index on `userId` created at startup: `app/imports/api/notifications/server/indexes.js:5-7`.

### State transitions

| Transition | Triggered by | Effect |
|---|---|---|
| (create) → `new` | Server-side `Notifications.insert` from other modules (see Notable details) | Incremented `notifications.new.count` |
| `new` → `seen` | `notifications.seen` method, called when the user opens the navbar bell popover | Clears the unread counter without marking as fully read |
| any → `read` | `notifications.read` method, called when the user leaves `/notifications` | Marks every non-`read` item as `read` |
| (delete) | `notifications.delete` method, hard-removes the document | — |

## Methods (Meteor)

All three live in `app/imports/api/notifications/methods.js` and use `LoggedInValidatedMethod`.

### `notifications.seen`

- File · `methods.js:7-17`
- Parameters · none (`validate: null`)
- Effect · Bulk-updates all of the caller's notifications in state `'new'` to `'seen'`: `Notifications.update({userId: this.userId, state: Notifications.states.NEW}, {$set: {state: Notifications.states.SEEN}}, {multi: true})`.
- Return · `true` when at least one document was updated.
- Caller · `UnreadNotifications.togglePopover` — fired when the bell popover is opened for the first time. `UnreadNotifications.jsx:35-38`

### `notifications.read`

- File · `methods.js:19-29`
- Parameters · none (`validate: null`)
- Effect · Bulk-updates all of the caller's notifications that are not already `'read'` to `'read'`: `Notifications.update({userId: this.userId, state: {$ne: Notifications.states.READ}}, {$set: {state: Notifications.states.READ}}, {multi: true})`.
- Return · `true` when at least one document was updated.
- Caller · `NotificationsOverviewPage.componentWillUnmount` — fired when the user navigates away from `/notifications`. `NotificationsOverviewPage.jsx:20-23`

### `notifications.delete`

- File · `methods.js:31-39`
- Parameters · `{ notificationId: String }` (validated Mongo id)
- Effect · `Notifications.remove(notificationId)` — hard delete; the selector intentionally does **not** scope by `userId`, see Permissions below. `methods.js:37`
- Caller · `NotificationListView` · `NotificationListView.jsx:38-40`, wrapped in a `confirmDelete()` modal.

### Create

There is **no client-facing create method**. Notifications are inserted directly on the server by other modules. The call sites observed so far are:

| Source | Title / body key | Trigger |
|---|---|---|
| `app/imports/api/patientFiles/methods.jsx:374` | `notifications.patientFile.shared.title` / `.body` | Another user grants the current user access to a patient file. |
| `app/imports/api/practice/server/util.tsx:117` | `notifications.practice.invite.title` / `.body` | A user is invited to join a practice. |
| `app/imports/api/payments/server/stripe.ts:78` | `notifications.practice.newStripeInvoice.paid.title` / `.body` | A Stripe subscription invoice was auto-paid. Sent to the practice owner. |
| `app/imports/api/payments/server/stripe.ts:139` | `notifications.practice.newStripeInvoice.failed.title` / `.body` | A Stripe subscription invoice failed to auto-pay. Sent to the practice owner. |
| `app/imports/api/subscriptions/server/invoiceCreator.jsx:233` | `notifications.practice.newInvoice.title` / `.body` | A new unpaid subscription invoice was generated for the practice. |
| `app/imports/api/treatments/server/util.js:88` (via `sendNotification`) | `patient.treatments.notifications.expiring.title` / `.date` or `.sessions` | Treatment coverage is about to expire (by date or by session count). Sent to every `patientFileUser` of the treatment's patient file, or, if none, to every `owner` / `admin` of the practice. Triggers: `TreatmentDateObserver.js:77`, `TreatmentSessionObserver.js:66`. |

Every insert call sets `type` to one of the `Notifications.types` constants (`INFO` or `WARNING` in the cases inspected).

## Publications

Both live in `app/imports/api/notifications/server/publications.js`.

### `notifications.all`

- File · `publications.js:5-10`
- Parameters · `{ limit: Number }`
- Returns · `Notifications.find({userId: this.userId}, {sort: {createdAt: -1}, limit, fields: Notifications.publicFields})` — the current user's full inbox, newest first, capped by `limit`, with `removed` / `removedAt` stripped.
- Consumer · `NotificationsOverviewPageContainer.js:17`.

### `notifications.new`

- File · `publications.js:12-31`
- Parameters · none
- Returns · two data streams:
  1. A reactive `Counts.publish` of documents in state `'new'` under the name `notifications.new.count` — consumed by both the navbar bell (`UnreadNotifications.jsx:133`) and the dashboard alert tile (`NotificationWidgetContainer.jsx:8`). `publications.js:13-21`
  2. The three most-recent notifications for the current user (regardless of state), sorted newest first, with `publicFields` applied — rendered inside the popover. `publications.js:23-30`
- Consumer · `UnreadNotifications` (via `withTracker` in the same file). `UnreadNotifications.jsx:128-139`

## User-visible behaviour

### Navbar bell (`UnreadNotifications`)

1. On every page of the authenticated app, `Menu.jsx:474` mounts `UnreadNotifications`, which subscribes to `notifications.new`.
2. The bell icon renders as `'notification'` when `newCount > 0` and `'notification-none'` otherwise. A yellow badge showing the count sits on top of the icon. `UnreadNotifications.jsx:56-64`
3. Clicking the bell opens a `Popover` (`UnreadNotifications.jsx:66-114`). The **first** click also calls `notifications.seen`, so subsequent reloads no longer highlight the same entries as "new". `UnreadNotifications.jsx:35-38`
4. Inside the popover, the three most recent notifications are listed with a warning icon, the translated `title` (bold if not yet `read`), and a `NotificationTime` showing e.g. "3 minutes ago" updated every second. `UnreadNotifications.jsx:73-93`, `NotificationTime.jsx:8-9`
5. When there are no notifications the popover shows `notifications.noNotifications` (`"Geen meldingen"`). `UnreadNotifications.jsx:94-104`
6. A chevron link at the bottom reads `notifications.seeAll` (`"Zie alle meldingen"`) and navigates to `/notifications`. `UnreadNotifications.jsx:105-113`

### Dashboard tile (`NotificationWidget`)

1. The main dashboard grid reserves a small cell for a single alert tile. `MainDashboardPage.jsx:27`, `:34`, `:54-56`
2. The tile shows a triangular warning icon, the current `notifications.new.count`, and the translated label `notifications.name` (`"Meldingen"`). `NotificationWidget.jsx:26-28`
3. Background colour is yellow when `count > 0`, navy otherwise. `NotificationWidget.jsx:23-24`
4. Clicking the tile navigates to `/notifications`. `NotificationWidget.jsx:25`
5. The count comes from the `notifications.new.count` Counts stream, which is published by `notifications.new` — so the tile is only populated on pages that also subscribe to `notifications.new` (the navbar bell guarantees this throughout the authenticated app).

### Full inbox page (`/notifications`)

1. The page subscribes to `notifications.all` with an initial `limit` of 10. `NotificationsOverviewPageContainer.js:14`, `:17`
2. Items are rendered by `NotificationListView` inside an `InfiniteScroll`. Each row has:
   - A left border coloured by `type` (red / blue / green / yellow for error / info / success / warning). `NotificationListView.jsx:13-18`, `:26`
   - A thicker border and bold font when the notification has not yet been read (`!isRead`). `NotificationListView.jsx:21`, `:26`, `:28`
   - The translated `title` (as `h4`) with `meta` spread as props so `%(patientName)s`-style placeholders get substituted. `NotificationListView.jsx:30-31`
   - The translated `body`, again with `meta` spread, rendered with `allowHTML` so embedded `<a>` tags in the i18n string are clickable (for example the "Bekijk" link to the patient file). `NotificationListView.jsx:32`
   - A `NotificationTime` on the right showing a live `moment.fromNow()` string. `NotificationListView.jsx:34-36`, `NotificationTime.jsx:7-16`
   - A red `fa-times` icon that opens `confirmDelete()` and, on confirmation, calls `notifications.delete`. `NotificationListView.jsx:37-41`
3. When there are no items the page shows `notifications.overview.noNotifications` (`"Geen meldingen"`). `NotificationsOverviewPage.jsx:40-45`
4. Scrolling past the current batch triggers `loadMore`, which bumps `this.limit` by 10 and calls `onLimitChange` to increase the subscription size. `NotificationsOverviewPage.jsx:25-28`, `NotificationsOverviewPageContainer.js:23-25`
5. On unmount, the page calls `notifications.read` (marking every item as fully `read`) and resets the shared `notificationsLimit` `ReactiveVar`. `NotificationsOverviewPage.jsx:20-23`, `NotificationsOverviewPageContainer.js:23-25`

> ⚠️ Behaviour inferred from code; needs product validation. Nothing in the codebase explicitly scopes notifications by `practiceId` at read time — a user who is a member of multiple practices will see a single merged inbox containing entries from all of them. The stored `practiceId` exists on the document but is not filtered on by the publications.

## Permissions

- **Read:** `notifications.all` and `notifications.new` both hard-filter on `userId: this.userId`, so a user can only ever see their own notifications. `publications.js:7`, `:17`, `:24`
- **Create:** Denied from the client (`notifications.jsx:8-12`). Inserted only by server code (see the "Create" table above).
- **Mark seen / read:** Bulk updates in `notifications.seen` and `notifications.read` are constrained by `userId: this.userId`, so a user cannot flip another user's state. `methods.js:11-15`, `:23-27`
- **Delete:** ⚠️ `notifications.delete` does **not** scope by `userId` — it passes `notificationId` straight to `Notifications.remove()`. `methods.js:36-38` Any signed-in user who can guess a document id could delete another user's notification. This looks like an oversight rather than an intentional design.
- No role gate (owner / beheerder / lid) is enforced anywhere in the notifications flow; see `app/imports/api/practiceUsers/util.jsx` for the permission surface — it does not mention notifications.

## Notable details

- **Two unrelated "notifications" concepts in the codebase.** The inbox documented here is `app/imports/api/notifications/` backed by a Mongo collection. `app/imports/ui/components/notification/Notifications.jsx` exports a `NotificationManager` that wraps `notistack` for transient toast snackbars (`NotificationManager.error`, `.info`, `.success`, `.warning`). Those toasts are not persisted and are not part of the inbox. The naming collision is unfortunate.
- **Stale `util.jsx` files.** Both `app/imports/api/notifications/util.jsx` and `app/imports/api/notifications/server/util.jsx` import `Events` (not `Notifications`) and export an empty object named `EventsUtil`. They are never imported anywhere and look like copy-paste detritus. `notifications/util.jsx:1-8`, `notifications/server/util.jsx:1-6`
- **Delete permission gap.** See Permissions, `methods.js:36-38`. Worth flagging to product / security.
- **`meta` is dangerously powerful.** Because `meta` is spread onto the `<Text resources=... />` component (`NotificationListView.jsx:30-32`, `UnreadNotifications.jsx:79-80`) and `body` is rendered with `allowHTML`, the notification author has full control over HTML rendered in the user's inbox. Every current producer passes an `attributes: { ... }` object used for i18n interpolation, but a malicious insert would not be sanitised.
- **Bilingual via i18n keys.** The `title` and `body` fields store i18n keys, not the rendered text. Translation happens on the client against the current user's locale, so switching language after a notification was created still yields a correctly-translated message. `NotificationListView.jsx:30-32`
- **Real-time counters.** `notifications.new.count` is published via `Counts.publish` and consumed by both the navbar badge and the dashboard tile. New notifications appear without a page refresh. `publications.js:13-21`
- **Reading happens on unmount, not on open.** Opening `/notifications` does not immediately mark items as read — only navigating away does (`componentWillUnmount` → `notifications.read`). So a user who reloads the page on `/notifications` will see the page with everything still in `seen` / `new`. `NotificationsOverviewPage.jsx:20-23`
- **Popover "seen" is also one-shot.** The first click on the bell marks everything as `seen` but does not mark it `read`. That's why a fourth state exists at all: `'seen'` corresponds to "the user noticed there are new items" and `'read'` corresponds to "the user opened the full list".
- **`NotificationTime` ticks once a second.** The relative time inside every notification card updates via `IntervalDataProvider` at 1000 ms. `NotificationTime.jsx:8-9`
- **`practiceId` is stored but unused at read time.** It is set on `Notifications.insert` calls from `patientFiles`, `treatments`, `payments/stripe`, and `subscriptions/invoiceCreator`, but never appears in a publication selector. `publications.js:6-8`, `:23-30`
- **Key i18n keys.** `nl.i18n.js:190-236`, matching `fr.i18n.js`:
  - `notifications.name` — `"Meldingen"`
  - `notifications.title` — `"Overzicht meldingen"`
  - `notifications.overview.title` — `"Overzicht huidige meldingen"`
  - `notifications.overview.noNotifications` — `"Geen meldingen"`
  - `notifications.noNotifications` — `"Geen meldingen"`
  - `notifications.seeAll` — `"Zie alle meldingen"`
  - `notifications.patientFile.shared.{title,body}` — patient-file share link with an inline `<a>` back to the dossier.
  - `notifications.practice.invite.{title,body}` — practice invitation with an inline `<a>` to the invite URL.
  - `notifications.practice.newInvoice.{title,body}` — new unpaid subscription invoice.
  - `notifications.practice.newStripeInvoice.paid.{title,body}` and `notifications.practice.newStripeInvoice.failed.{title,body}` — Stripe subscription payment outcomes.
  - `patient.treatments.notifications.expiring.title`, `.date`, `.sessions` — treatment coverage expiry warnings (in the `patient.treatments.*` namespace, not `notifications.*`). `nl.i18n.js:494-504`

## Helpdesk overlap

No helpdesk article describes the notification centre. Grepping `full_documentation/` for `melding` or `notificatie` surfaces only generic system-error messages (for example `../../full_documentation/general_getting_started.md` line 367 `## Melding "oeps er is iets misgelopen"` and `../../full_documentation/invoicing_finances.md` line 95 referring to treatment expiry reminders) and the treatment notification settings feature (`Alarmfunctie einde terugbetaling`) which describes the *configuration* of treatment expiry alerts but not the inbox they land in.

## Source files

- `app/imports/api/notifications/notifications.jsx`
- `app/imports/api/notifications/methods.js`
- `app/imports/api/notifications/util.jsx` (stale / dead)
- `app/imports/api/notifications/server/index.js`
- `app/imports/api/notifications/server/publications.js`
- `app/imports/api/notifications/server/indexes.js`
- `app/imports/api/notifications/server/util.jsx` (stale / dead)
- `app/imports/api/collection.js`
- `app/imports/ui/pages/notifications/NotificationsOverviewPage.jsx`
- `app/imports/ui/containers/notifications/NotificationsOverviewPageContainer.js`
- `app/imports/ui/components/notification/NotificationListView.jsx`
- `app/imports/ui/components/notification/UnreadNotifications.jsx`
- `app/imports/ui/components/notification/NotificationTime.jsx`
- `app/imports/ui/components/notification/Notifications.jsx` (transient-toast system, distinct)
- `app/imports/ui/components/menu/Menu.jsx` (mounts `UnreadNotifications`)
- `app/imports/ui/layouts/AppLayout.jsx` (mounts `Notifications` snackbar provider)
- `app/imports/modules/notifications/NotificationWidget.jsx`
- `app/imports/modules/notifications/NotificationWidgetContainer.jsx`
- `app/imports/ui/pages/main/MainDashboardPage.jsx`
- `app/imports/startup/client/routes/notifications.js`
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx`
- `app/imports/api/patientFiles/methods.jsx` (producer of `patientFile.shared` notifications)
- `app/imports/api/practice/server/util.tsx` (producer of `practice.invite` notifications)
- `app/imports/api/payments/server/stripe.ts` (producer of `newStripeInvoice.paid` / `.failed` notifications)
- `app/imports/api/subscriptions/server/invoiceCreator.jsx` (producer of `practice.newInvoice` notifications)
- `app/imports/api/treatments/server/util.js` (producer of treatment-expiry notifications)
- `app/imports/api/treatments/server/TreatmentDateObserver.js` (caller of the treatment notification helper)
- `app/imports/api/treatments/server/TreatmentSessionObserver.js` (caller of the treatment notification helper)
- `app/imports/i18n/resources/client/nl.i18n.js` (namespace `notifications.*` and `patient.treatments.notifications.*`)
- `app/imports/i18n/resources/client/fr.i18n.js` (same namespaces in French)
