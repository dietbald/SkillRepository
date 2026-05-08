# Main dashboard

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none. The functional spec lists "Main Dashboard" as a screen but the helpdesk export contains no article on it, so this page is built entirely from code.

## What it is

The landing screen immediately after login. Route `/` (`app/imports/startup/client/routes-flow.jsx:43-54`), mounted by `authenticatedMount(AppContainer, {main: <MainDashboardPage/>, hideBreadcrumb: true, removeWrapperClasses: true, requiresPractice: true})`. It is a two-band layout: a fixed top statistics band (`DashboardTop`) and a four-cell responsive widget grid (`Dashboard` + widgets). The page assumes a practice is active — if none is, routing falls through to the "no practice" flow because of `requiresPractice: true`.

Component: `MainDashboardPage` in `app/imports/ui/pages/main/MainDashboardPage.jsx:18`. It receives `currentPracticeId` from `AppContainer` (`app/imports/ui/containers/AppContainer.jsx:14`), which reads it from `RLocalStorage.getItem("currentPracticeId")`.

## Layout

```
+---------------------------------------------------------------+
| DashboardTop  (row, border-bottom, white-bg)                  |
|                                                               |
| [col-sm-3]                [col-sm-6]              [col-sm-3]  |
|  WELCOME %(firstName)      Bar chart of            Statistic  |
|  DashboardTopEventList     appointment count       box:       |
|  (today's next 5 events)   per weekday             - Drukste  |
|                            (Mon..Sat)                 dag     |
|                                                     - Rustigste|
|                                                        dag    |
|                                                     - Gemiddeld|
|                                                        per dag|
+---------------------------------------------------------------+
| Dashboard (react-grid-layout, isResizable=false,              |
|            isDraggable=false)                                 |
|                                                               |
|  lg/md (12 cols):                                             |
|   +---------+---------+-----------------+                     |
|   |   a     |    b    |        c        |                    |
|   | notif.  | openBil |     todos       |                    |
|   | (3x1)   | (3x1)   |     (6x4)       |                    |
|   +---------+---------+                 |                    |
|   |           d                         |                    |
|   |         info                        |                    |
|   |       (6x3)                         |                    |
|   +-------------------------------------+                    |
|                                                               |
|  sm/xs/xxs (6 cols, 2-row stack):                             |
|   +----------+----------+                                     |
|   |    a     |    b     |   notifications + openBills         |
|   +----------+----------+                                     |
|   |       c (todos, 12x4)|                                    |
|   +----------+----------+                                     |
|   |       d (info, 12x3) |                                    |
|   +----------+----------+                                     |
+---------------------------------------------------------------+
```

(Grid coordinates come directly from `MainDashboardPage.jsx:25-47`. Breakpoints and column counts from `Dashboard.jsx:74-77`: `lg: 1200 / md: 996 / sm: 768 / xs: 480 / xxs: 0`, `lg/md = 12 cols`, `sm/xs/xxs = 6 cols`.)

### DashboardTop band

| Slot | Source component | What it shows |
|---|---|---|
| Welcome + today list | `DashboardTopEventList` (`DashboardTopEventList.jsx:15`) | Translated `WELCOME` header with the user's `profile.firstName`, then the next 5 events starting between "now" and "now + 1 day" as a list with labels, time (`moment(event.start).format("LT")`) and index bullets. Empty state is `NO_EVENTS_DESCRIPTION_TODAY` + an "ADD_EVENT" button that routes to `/agenda`. |
| Weekly chart | `DashboardTopEventChart` (`DashboardTopEventChart.jsx:9`) | A 150px-high Bar chart ( `react-chartjs-2`) with x-axis labels `translate('MONDAY'..'SATURDAY')` (7 days, Sunday missing by construction — `DashboardTop.jsx:18`) and y = number of `Events` starting that day in the current ISO week. Single dataset hard-coded `label: "Afspraken"`. |
| Stats triple | inline in `DashboardTop.jsx:38-62` | Three labelled values:<br>- `BUSIEST_DAY` = "Drukste dag" → `_.maxBy` of the counts.<br>- `QUIETEST_DAY` = "Rustigste dag" → `_.minBy`.<br>- `AVERAGE_PER_DAY` = "Gemiddeld per dag" → `_.mean(values).toFixed(2)`. |

> ⚠️ Behaviour inferred from code; needs product validation. The `days` array in `DashboardTop.jsx:18` only lists Monday through Saturday (six entries) but `values = _.times(7, ...)` builds seven day counts, so the seventh day's count is silently unused when determining busiest/quietest. Whether this is intentional (Belgian therapists typically do not work Sundays) or a bug has to be confirmed by product.

### Widget grid

Four cells, mapped to four distinct React components via the `availableWidgets` registry in `MainDashboardPage.jsx:49-71`:

| Slot | Widget | Component | Brief |
|---|---|---|---|
| a | `notifications` | `NotificationWidget` via `NotificationWidgetContainer` (`modules/notifications/NotificationWidgetContainer.jsx:8`) | Colour-changing tile with a triangle icon and the unread count. Navy when count is zero, yellow otherwise (`NotificationWidget.jsx:22-30`). Whole tile is clickable → `/notifications`. |
| b | `openBills` | `OpenBillsWidget` via `OpenBillsWidgetContainer` (`modules/invoices/OpenBillsWidgetContainer.jsx:7`) | Card with `OPEN_AMOUNT` title, a large `Util.formatCurrency(openAmount/100)` value and a plural-aware `UNPAID_BILLS` subtitle. Clicking routes to `/financial` (via the `onClick: () => FlowRouter.go("financial")` prop passed from `MainDashboardPage.jsx:61`). |
| c | `todos` | `TodosWidget` via `TodosWidgetContainer` (`modules/todos/TodosWidgetContainer.jsx:11`) | Embedded todo creator form + infinite-scrolled list of the user's own todos, sorted `{done: 1, createdAt: -1}` (done items sink to the bottom). Inline checkbox to mark done, inline delete button, inline edit form. |
| d | `info` | `NewsfeedWidget` via `NewsfeedWidgetContainer` (`modules/newsfeed/NewsfeedWidgetContainer.jsx:16`) | Infinite-scrolled list of admin-published newsfeed items, with per-item title, HTML body, circular image and `moment(createdAt).calendar()` timestamp. Items are fetched sorted by `createdAt: -1`, locale-scoped to `Meteor.user().locale()`. |

The grid itself is a thin wrapper around `react-grid-layout`'s `Responsive` + `WidthProvider` (`Dashboard.jsx:3-5`). It is explicitly `isResizable={false}` and `isDraggable={false}` (`Dashboard.jsx:62-63`) — the user cannot rearrange or resize widgets.

## Data wiring

| Slot | Collection | Publication / method | Aggregation site |
|---|---|---|---|
| DashboardTop welcome | `Meteor.users` | `Meteor.subscribe("users.profileData")` (`DashboardTopContainer.jsx:9`) | — |
| DashboardTop event list | `Events` | Method `events.get.between` / `getEventsBetween` (`api/events/methods.js:402-428`) on a 60-second interval via `IntervalDataProvider` (`DashboardTopEventList.jsx:54-61`), args `{start: now, end: now+1d, limit: 5}`. Filter: `userId === Meteor.userId` plus events straddling the window. | Client-side render. |
| DashboardTop chart + stats | `Events` | Publication `events.week` (`api/events/server/publications.js:65-72`) — pushes all current-week events for `this.userId`. | `DashboardTop.jsx:22` loops 7 days and calls `Events.find({start: {...day window}}).count()` for each. |
| notifications tile | `Notifications` | Publication `notifications.new` (`api/notifications/server/publications.js:12-21`) pushes the 3 most recent items plus `Counts.publish("notifications.new.count", ...)` over `{userId, state: NEW}`. | `Counts.get("notifications.new.count")` in `NotificationWidgetContainer.jsx:8`. |
| openBills tile | `PatientFileInvoices` | Publication `invoices.open.statistics` (`api/invoices/patientFileInvoices/server/publications.js:31-58`) + two `Counts.publish` calls: `invoices.open.statistics.sum` (per-invoice `countFromField` adds patient share if unpaid + insurance share if third-payer unpaid) and `invoices.open.statistics.count` (cursor length). Cursor is `{userId, practiceId, isCanceled: false, isPaid: false}`. | `Counts.get("invoices.open.statistics.sum")` and `.count` in `OpenBillsWidgetContainer.jsx:10-11`. |
| todos tile | `Todos` | `Meteor.subscribe('todos', {limit, userId: Meteor.userId()})` (`TodosWidgetContainer.jsx:16`). Reactive limit, starts at 20 and grows by 20 on scroll-end. | — |
| info tile | `Newsfeed` | `Meteor.subscribe('newsfeed', {limit, locale})` (`NewsfeedWidgetContainer.jsx:22-24`). Reactive limit, starts at 5. | — |

Commented-out code in `MainDashboardPage.jsx:76-86` references a `syncPatientFiles` button — disabled in production, but indicates a manual patient-file sync action is wired up one level below.

## Empty states / loading states

- **Today's event list**: when `props.events` is empty, `getNoEventsContent()` shows a centred `NO_EVENTS_DESCRIPTION_TODAY` message ("Je hebt vandaag geen afspraken") and an "ADD_EVENT" button routing to `/agenda` (`DashboardTopEventList.jsx:36-43`).
- **Weekly chart**: no explicit empty handling in `DashboardTopEventChart`. The global Chart.js plugin in `app/imports/startup/client/bootstrap/chart.js:3-20` draws a centred "Geen gegevens beschikbaar" (`NO_DATA` i18n key) over any chart whose datasets have no non-empty rows, so an empty week yields that overlay.
- **Open bills tile**: when `count === 0`, the plural resolver chooses `UNPAID_BILLS.zero` = "Geen openstaande facturen". The numeric value is always rendered via `Util.formatCurrency(openAmount / 100)` — when `openAmount` is undefined this currency formatter determines the display.
- **Notifications tile**: shows the numeric count regardless (it will be `0` when nothing is unread). Background colour flips between navy and yellow based on count truthiness (`NotificationWidget.jsx:24`).
- **Todos**: `isLoading` triggers a `LoadingOverlay`; when `items.length === 0` and not loading, shows `todos.no_items` headline (`TodosWidget.jsx:44-71`).
- **Newsfeed**: identical pattern — `LoadingOverlay` while the subscription is not ready; `newsfeed.no_items` ("Er zijn momenteel geen nieuwsitems" or equivalent) when empty (`NewsfeedWidget.jsx:23-47`).
- **Whole page**: there is no unified loading spinner. Widgets load independently and the grid is rendered immediately. A resize listener (`ReactResizeDetector` in `MainDashboardPage.jsx:94-100`) re-triggers the grid layout on window resize by calling `this.refs.dashboard.refs.grid.onWindowResize()`.

## Personalization

- **Per-user scope**: all four widgets scope on `Meteor.userId`. Today's events, weekly chart, todos, and notifications are strictly the logged-in user's. Newsfeed is filtered by the user's preferred locale (`Meteor.user().locale()`, `NewsfeedWidgetContainer.jsx:23`).
- **Per-practice scope**: only the open-bills widget uses `currentPracticeId` (passed from `MainDashboardPage.jsx:61`). The other three widgets are not practice-scoped, which means a user who belongs to multiple practices sees the same todos, newsfeed, notifications and weekly chart regardless of which practice is currently selected.
- **Role awareness**: none. The dashboard does **not** vary by role (`owner/beheerder/lid`). There are no `PermissionRender` gates in `MainDashboardPage.jsx` or in any of the four widget containers. A `lid` member sees the same tiles an owner does. The open-bills tile will show that member's own open invoices because `OpenBillsWidgetContainer` does not pass a `userId` and the publication falls back to `this.userId`.
- **Recent activity / personalized suggestions**: none. There is no "recently opened patient file" tile, no "pick up where you left off" entry, no pinned patients.
- **Customization**: none. `Dashboard.jsx:62-63` sets `isResizable={false}` and `isDraggable={false}`, and there is no persistence layer for per-user dashboard configuration anywhere in `agendaSettings` or `practiceUsers`. The layout is hard-coded in `MainDashboardPage.jsx:25-47`.
- **Language**: the i18n layer kicks in globally. All labels on the dashboard come from `i18n/resources/client/nl.i18n.js` / `fr.i18n.js`; there is no NL-only or FR-only widget. `moment.locale()` is set in `AppContainer.jsx:23` from `user.profile.locale`, so the weekly chart's month names and the event list's time formatting follow the user preference.

## Source files

- `/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes-flow.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/startup/client/bootstrap/chart.js`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/containers/AppContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/Dashboard.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTop.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventChart.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventList.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/widget/Widget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js`
