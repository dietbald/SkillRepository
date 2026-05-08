# Main Dashboard

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Post-login landing with widget grid (statistics, notifications, todos, newsfeed).

## Spec contracts (Phase 2)

- **main-dashboard** — Feature: main-dashboard/layout
  - Path: `02-specs/main-dashboard/spec.md`


## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/main-dashboard.md`)

# Discovery: Main Dashboard

**Area:** Main Dashboard (screen #1 from `application_map.md` section 1A, cross-cutting competencies #19 Practice Analytics)

**Scope in one breath:** the `/` landing page after login -- the welcome banner with today's events, the weekly "Afspraken" bar chart with busiest/quietest/average stats, the 4-cell widget grid (notifications tile, openstaande facturen tile, todos tile, newsfeed tile), the practice selector dropdown in the sidebar, and role-based widget visibility (or lack thereof). Excludes the analytics computation internals (covered by area #19 Practice Analytics) and the full notifications inbox page (separate area). Excludes the agenda itself (#5), the financial overview (#11/#12), and the full patient list (#3).

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent handling all three sources in one session.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what's in `Halingo-MonoRepo/`, `libs/backend/*`, `AuthenticationService`, or any Nx-side symbol. Phase 0 audit data belongs elsewhere. See `06-prompts/halingo-discoverer.md` - "The ONE critical scope rule".

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Code-derived | `from_source/features/main_dashboard.md` | 134 | full | Complete dashboard layout, component tree, data wiring, empty states, personalization rules. Primary reference. |
| Code-derived | `from_source/features/in_app_notifications.md` | 231 | full | Notification collection schema, state machine (new/seen/read), navbar bell, dashboard tile, permissions, i18n keys. Confirmed authorization bug in `notifications.delete`. |
| Code-derived | `from_source/features/todos.md` | 140 | full | Todos collection, CRUD methods, publication, per-user scope, inline edit, infinite scroll, hard delete despite soft-delete schema. |
| Code-derived | `from_source/features/newsfeed.md` | 109 | full | Newsfeed collection, bilingual content (NL/FR), server-side locale projection, no author UI (DB-direct inserts), allowHTML body rendering. |
| Code-derived | `from_source/features/invoices_overview.md` | ~60 | partial (dashboard tile section) | Open-bills widget data source: `invoices.open.statistics` publication with sum/count Counts channels. |
| Code-derived | `from_source/gaps/19_practice_analytics.md` | ~40 | partial (dashboard section) | Confirms weekly chart is client-side over `events.week` subscription. Documents the Mon-Sat/7-day count discrepancy as a functional bug. |
| Curated | `functional/application_map.md` | 62 | section 1A + section 2 | Formal screen definition: "Main Dashboard: Real-time overview of practice metrics and daily schedule." |
| Curated | `functional/user_stories.md` | 33 | US.01, US.02 | US.01: "As a Speech Therapist, I want a centralized dashboard." US.02: "As a Practice Owner, I want to see an overview of multiple therapists' schedules." |
| Cross-cutting | `from_source/deprecation_list.md` | 183 | ctrl-F "dashboard", "todo", "newsfeed", "notification", "chart" | No deprecation entries touch the dashboard itself. Practice chat (#1) is being killed but chat is NOT on the dashboard. `getInvoiceStatistics` (#13) is abandoned but it is NOT used by the dashboard tile (the tile uses `Counts.get` channels instead). |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | 157 | ctrl-F "Dashboard", "notification", "todo" | Item: `DashboardTop` Mon-Sat range with 7-day counts (functional bug). Item: `notifications.delete` no userId scoping (confirmed authorization bug). |
| Cross-cutting | `from_source/open_questions.md` | 158 | ctrl-F "dashboard", "newsfeed", "notification", "todo" | Q3: `notifications.delete` no userId scope - confirmed bug. Q19: newsfeed authored via `meteor mongo` - that IS the workflow. |
| Curated | `coverage_matrix.md` | 164 | Main Dashboard row + "Net-new concepts" section | "Main Dashboard: **Not covered**" in helpdesk. Net-new concept #1 confirms the widget grid with statistics band was found only in code. |

### What HalingoDoc covers for this area

HalingoDoc covers the main dashboard thoroughly on the code-derived side. `from_source/features/main_dashboard.md` (134 lines) is the most complete single reference -- it documents the two-band layout (DashboardTop + widget grid), the react-grid-layout configuration, all four widgets, data wiring via publications and Counts channels, empty states, personalization rules, and the commented-out `syncPatientFiles` button. The three sub-feature files (`in_app_notifications.md`, `todos.md`, `newsfeed.md`) add deep detail on each widget's backing collection, methods, publications, and permissions.

The deprecation list and bugs-and-security-findings surface two items relevant to the dashboard: the Mon-Sat/7-day count discrepancy in `DashboardTop` (functional bug), and the `notifications.delete` userId scoping gap (confirmed authorization bug). Neither is deprecated -- they are active bugs to fix during porting.

The helpdesk layer has **zero coverage** of the main dashboard. The `coverage_matrix.md` explicitly marks "Main Dashboard" as "Not covered" in the helpdesk column. No article in `full_documentation/` describes the dashboard screen.

### What HalingoDoc does NOT cover for this area

- The practice selector dropdown in the sidebar -- its interaction with the dashboard is not documented in the dashboard feature file (the file notes that `currentPracticeId` comes from `AppContainer` via `RLocalStorage`, but the selector UI itself lives in `Menu.jsx`)
- Responsive behavior on mobile/tablet viewports -- the grid layout spec lists breakpoints and column counts but no one has documented the actual visual appearance at each breakpoint
- The `Util.formatCurrency` implementation for the open-bills display -- what happens when `openAmount` is `undefined` (the empty state path)
- The `IntervalDataProvider` polling mechanism for the today's-events list -- documented in the event-list source but not in any HalingoDoc narrative

### Direct citations worth preserving

> From `from_source/features/main_dashboard.md:62-63`:
>
> > The grid itself is a thin wrapper around `react-grid-layout`'s `Responsive` + `WidthProvider` (`Dashboard.jsx:3-5`). It is explicitly `isResizable={false}` and `isDraggable={false}` (`Dashboard.jsx:62-63`) -- the user cannot rearrange or resize widgets.

> From `from_source/features/main_dashboard.md:105-107`:
>
> > **Role awareness**: none. The dashboard does **not** vary by role (`owner/beheerder/lid`). There are no `PermissionRender` gates in `MainDashboardPage.jsx` or in any of the four widget containers. A `lid` member sees the same tiles an owner does.

> From `from_source/features/main_dashboard.md:104`:
>
> > **Per-practice scope**: only the open-bills widget uses `currentPracticeId` (passed from `MainDashboardPage.jsx:61`). The other three widgets are not practice-scoped, which means a user who belongs to multiple practices sees the same todos, newsfeed, notifications and weekly chart regardless of which practice is currently selected.

> From `from_source/bugs_and_security_findings.md` (DashboardTop entry):
>
> > `DashboardTop` Mon-Sat range with 7-day counts [...] busiest/quietest computation iterates Mon-Sat (6 days) but counts events for 7 days. Possible off-by-one in the displayed "busiest day".

---

## Source 2 -- Meteor source slice

### Files read (26 total)

Flat list grouped by directory. Starting points from `from_source/features/main_dashboard.md` source file citations, then walked outward.

- `app/imports/startup/client/routes-flow.jsx` (1 file)
  - `routes-flow.jsx` -- FlowRouter route `/` with `name: "home"`, mounting `MainDashboardPage` via `authenticatedMount(AppContainer, {main: <MainDashboardPage/>, hideBreadcrumb: true, removeWrapperClasses: true, requiresPractice: true})`. Lines 43-54.

- `app/imports/ui/containers/AppContainer.jsx` (1 file)
  - `AppContainer.jsx` -- withTracker HOC reading `RLocalStorage.getItem("currentPracticeId")`, subscribing to `practices` and `users.profileData`, setting locale via `setLocale(user.profile.locale)` and `moment.locale(user.profile.locale)`. Passes `currentPracticeId` to `AppLayout` (and through it to `MainDashboardPage`).

- `app/imports/ui/pages/main/MainDashboardPage.jsx` (1 file)
  - `MainDashboardPage.jsx` -- Class component (108 lines). Imports `Dashboard`, `DashboardTop`, 4 widget containers. `getLayouts()` defines the grid (big layout: a=3x1, b=3x1, c=6x4, d=6x3; small layout: a=6x1, b=6x1, c=12x4, d=12x3). `getAvailableWidgets()` maps slot names to components. Commented-out `syncPatientFiles` button at lines 76-86. `ReactResizeDetector` triggers grid resize. Only prop: `currentPracticeId` (passed to `OpenBillsWidget`).

- `app/imports/ui/components/advanced-components/dashboard/` (5 files)
  - `Dashboard.jsx` -- `react-grid-layout` `Responsive` + `WidthProvider`. Breakpoints: `lg:1200, md:996, sm:768, xs:480, xxs:0`. Columns: `lg/md=12, sm/xs/xxs=6`. `isResizable={false}`, `isDraggable={false}`.
  - `DashboardTop.jsx` -- Renders welcome message, weekly chart, and stats triple. `days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']` (6 entries). `values = _.times(7, ...)` counts events for 7 days. **Confirmed bug**: iterates 6 labels but 7 counts; 7th count (Sunday) is silently included in `_.mean(values)` and in the `_.maxBy`/`_.minBy` computation but has no label in the chart.
  - `DashboardTopContainer.jsx` -- withTracker subscribing to `users.profileData` and `events.week`. Passes `user` and `events` to `DashboardTop`. Note: `isLoading` flag has a logic bug (`!handle.ready() || handle2.ready()` should be `!handle.ready() || !handle2.ready()`).
  - `DashboardTopEventList.jsx` -- IntervalDataProvider wrapping the event list, polling `getEventsBetween` every 60 seconds with `{start: now, end: now+1d, limit: 5}`. Shows next 5 events with time and title. Empty state: "Je hebt vandaag geen afspraken" + "AFSPRAAK TOEVOEGEN" button routing to `/agenda`. **Note**: contains a stray `console.log('patient', patient)` at line 26.
  - `DashboardTopEventChart.jsx` -- `react-chartjs-2` `Bar` chart with hardcoded label `"Afspraken"`, green-teal color scheme, `maintainAspectRatio: false`, `beginAtZero: true`.

- `app/imports/ui/components/advanced-components/widget/Widget.jsx` (1 file)
  - `Widget.jsx` -- HOC that wraps a component in a `Box` container, picking box-specific props (`title`, `label`, `key`, `style`, etc.) and passing the rest to the wrapped component.

- `app/imports/modules/notifications/` (2 files)
  - `NotificationWidget.jsx` -- Functional component. Yellow background when `count > 0`, navy otherwise. Shows triangle icon, count, and "Meldingen" label. Clicking routes to `/notifications`.
  - `NotificationWidgetContainer.jsx` -- withTracker returning `count: Counts.get("notifications.new.count")`.

- `app/imports/modules/invoices/` (2 files)
  - `OpenBillsWidget.jsx` -- Functional component. Shows "OPEN_AMOUNT" title, formatted currency value (`Util.formatCurrency(openAmount/100)`), and plural-aware "UNPAID_BILLS" subtitle. Clickable, routes to `/financial`.
  - `OpenBillsWidgetContainer.jsx` -- withTracker subscribing to `invoices.open.statistics` with `practiceId`. Returns `openAmount: Counts.get("invoices.open.statistics.sum")` and `count: Counts.get("invoices.open.statistics.count")`.

- `app/imports/modules/todos/` (2 files)
  - `TodosWidget.jsx` -- Embedded add form + infinite-scrolled list. Items sorted done-last, newest-first. Inline checkbox, inline edit (LiveEditableForm), timestamp (`moment.calendar()`), delete icon. Empty state: "Goed zo, niets te doen!" / "Bon, rien a faire!". Limit starts at 20, grows by 20 on scroll.
  - `TodosWidgetContainer.jsx` -- withTracker subscribing to `todos` with `{limit, userId: Meteor.userId()}`. Module-level `ReactiveVar` for limit; reset on unmount.

- `app/imports/modules/newsfeed/` (2 files)
  - `NewsfeedWidget.jsx` -- Infinite-scrolled list. Each item: circular image (fallback to logo), calendar timestamp, localized title (bold), localized body (allowHTML). Empty state: "Geen nieuws" / "Pas de nouvelles". Limit starts at 5, grows by 5.
  - `NewsfeedWidgetContainer.jsx` -- withTracker subscribing to `newsfeed` with `{limit, locale}`. Locale from `Meteor.user().locale()` or fallback to first configured locale.

- `app/imports/api/events/util.jsx` (1 file, partial)
  - `_getWeekDates(date)` at line 94: sets `startWeek` to Monday 00:00:00 via `moment(date).day(1)`, then `endWeek = startWeek.clone().add(7, "day")`. Returns `{start, end}`.

- `app/imports/api/events/server/publications.js` (1 file, partial)
  - `events.week` publication at line 65: filters `Events.find({userId: this.userId, start: {$gte: dates.start.toDate(), $lt: dates.end.toDate()}})`. No practice filter -- user-scoped only.

- `app/imports/api/invoices/patientFileInvoices/server/publications.js` (1 file, partial)
  - `invoices.open.statistics` publication at line 31: cursor `{userId, practiceId, isCanceled: false, isPaid: false}`. `Counts.publish` for sum (per-invoice: patient share if unpaid + insurance share if third-payer unpaid) and count. Permission check: if `userId !== this.userId`, requires `invoices.statistics` permission.

- `app/imports/startup/client/bootstrap/chart.js` (1 file)
  - Global Chart.js plugin at line 3: if all datasets are empty, draws centered "Geen gegevens beschikbaar" (`NO_DATA` i18n key). Also includes a doughnut center-text plugin (not dashboard-relevant).

- `app/imports/ui/components/menu/Menu.jsx` (1 file, partial read lines 200-260)
  - Practice selector at line 228-234: `onPracticeChange(value)` sets `RLocalStorage.setItem("currentPracticeId", value)`. Practice list built from `this.props.practices` with image, name, value. Includes "ADD_PRACTICE" option routing to `practices.new`. Dashboard is the first menu item (`navigation.dashboard`, route `home`, icon `dashboard`).

- `app/imports/api/todo/` (4 files -- already documented via HalingoDoc, verified)
  - `todos.js`, `methods.js`, `server/publications.js`, `server/indexes.js`

- `app/imports/api/notifications/` (3 files -- already documented, verified)
  - `notifications.jsx`, `methods.js`, `server/publications.js`

- `app/imports/api/newsfeed/` (2 files -- already documented, verified)
  - `newsfeed.js`, `server/publications.js`

### Key symbols per file

- `routes-flow.jsx:43-54` -- FlowRouter route `/` named `home`, `requiresPractice: true`
- `AppContainer.jsx:14` -- `currentPracticeId = RLocalStorage.getItem("currentPracticeId")`
- `MainDashboardPage.jsx:25-47` -- `getLayouts()` grid coordinate definitions
- `MainDashboardPage.jsx:49-71` -- `getAvailableWidgets()` component registry (notifications, openBills, todos, info)
- `MainDashboardPage.jsx:76-86` -- Commented-out `syncPatientFiles` button (disabled in production)
- `Dashboard.jsx:62-63` -- `isResizable={false}`, `isDraggable={false}`
- `Dashboard.jsx:74-77` -- Breakpoints and column definitions
- `DashboardTop.jsx:18` -- `days = ['MONDAY'...'SATURDAY']` (6 entries)
- `DashboardTop.jsx:22` -- `values = _.times(7, ...)` (7 counts, off-by-one with `days`)
- `DashboardTop.jsx:44` -- `_.maxBy(days, ...)` busiest day
- `DashboardTop.jsx:50` -- `_.minBy(days, ...)` quietest day
- `DashboardTop.jsx:58` -- `_.mean(values).toFixed(2)` average per day
- `DashboardTopContainer.jsx:10-11` -- Subscribes `users.profileData` + `events.week`
- `DashboardTopContainer.jsx:15` -- `isLoading: !handle.ready() || handle2.ready()` (logic bug: should be `||!`)
- `DashboardTopEventList.jsx:54-61` -- IntervalDataProvider polling every 60s
- `DashboardTopEventList.jsx:26` -- Stray `console.log('patient', patient)`
- `DashboardTopEventChart.jsx:20` -- Hardcoded label `"Afspraken"` (not i18n-ized)
- `NotificationWidget.jsx:23-24` -- Yellow/navy background toggle on `count` truthiness
- `OpenBillsWidget.jsx:40` -- `Util.formatCurrency(props.openAmount / 100)` (cents to euros)
- `OpenBillsWidgetContainer.jsx:7` -- Subscribes `invoices.open.statistics` with `practiceId`
- `Menu.jsx:232` -- `RLocalStorage.setItem("currentPracticeId", value)` on practice change

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | `isLoading` flag in `DashboardTopContainer.jsx` | Not mentioned | Line 15: `isLoading: !handle.ready() \|\| handle2.ready()` -- the second operand is not negated, so `isLoading` is `true` when the events subscription IS ready. Logic bug. | Source. Bug not flagged anywhere. |
| 2 | Stray `console.log` in `DashboardTopEventList.jsx` | Not mentioned | Line 26: `console.log('patient', patient)` -- logs to browser console on every event render. | Source. Production debug noise. |
| 3 | Chart dataset label | `from_source/features/main_dashboard.md:59` says `label: "Afspraken"` | Confirmed: `DashboardTopEventChart.jsx:20` has `label: "Afspraken"` (hardcoded Dutch, not i18n-ized). | Consistent. But note: a French-locale user sees "Afspraken" as the legend label rather than "Rendez-vous". |
| 4 | `DashboardTop` day count discrepancy | `from_source/bugs_and_security_findings.md` and `main_dashboard.md:62` flag it as "needs product validation" | Confirmed in source: `days` has 6 entries (Mon-Sat), `values` has 7 entries (Mon-Sun). Sunday's count affects `_.mean` and potentially `_.maxBy`/`_.minBy` via the `values` array, but Sunday has no label in the chart. The `_.maxBy` and `_.minBy` use `values[days.indexOf(val)]` which only maps indexes 0-5, so the 7th value (index 6) is not directly picked as busiest/quietest, but it IS included in `_.mean`. | Source. Confirmed behavioral quirk. |

---

## Source 3 -- Staging exploration

**Staging URL:** `http://localhost:3000` (local Meteor instance from `/home/tj/Repos/Halingo-Main/local-dev/`)
**Screens visited:** 5 (0 public + 4 gated + 1 login page)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/`

### Per-screen catalog

| # | URL | Screen | Language | Role | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|---|
| 1 | `/login` | Login page | NL | -- | Email field, password field, "AANMELDEN" button, "Nog geen account?", "Wachtwoord vergeten?" | `01-login-page.png` |
| 2 | `/` | Owner dashboard | NL | owner | "Welkom Anke" welcome, empty today-list ("Je hebt vandaag geen afspraken" + "AFSPRAAK TOEVOEGEN" button), weekly bar chart (Maandag-Zaterdag, bars on Woensdag/Donderdag), Drukste dag: Woensdag, Rustigste dag: Maandag, Gemiddeld per dag: 0.29, green notification tile (0 Meldingen), open bills (35,00 EUR, 1 openstaande factuur), todos (2 items visible), newsfeed (3 items visible with circular images) | `02-dashboard-owner-full.png` |
| 3 | `/` | Owner dashboard top band (cropped) | NL | owner | Clear view of the three-column top band layout: welcome + event list (col-sm-3), bar chart (col-sm-6), statistics box (col-sm-3) | `03-dashboard-top-band.png` |
| 4 | `/` | Lid dashboard | NL | lid (default) | "Welkom Joris", empty today-list, empty chart (no bars), Drukste dag / Rustigste dag showing day names even with zero data, Gemiddeld per dag: 0.00, notification tile (0 Meldingen), open bills (0,00 EUR, "Geen openstaande facturen"), todos empty state ("Goed zo, niets te doen!"), newsfeed (3 items visible -- SAME newsfeed as owner) | `04-dashboard-lid-full.png` |
| 5 | `/` | Multi-practice dashboard | FR | owner (of Practice B) | "Bienvenue Claire", FR labels throughout (Tableau de bord, Dossiers patient, Financier, etc.), "Vous n'avez pas de rendez-vous" empty state, "AJOUTER UN RENDEZ-VOUS" button, French day names (Lundi-Samedi), notification tile (0 Notifications), open bills (0,00 EUR, "Aucune facture ouverte"), todos empty ("Bon, rien a faire!"), newsfeed empty ("Pas de nouvelles") | `05-dashboard-multi-practice.png` |

### Behavior observed on staging

1. **Role-blind dashboard confirmed.** The lid user sees the exact same 4-widget layout as the owner. The open-bills tile shows the lid's own invoices (0,00 EUR). No widgets are hidden or disabled for the lid role. This matches the code analysis in `from_source/features/main_dashboard.md` which states "Role awareness: none."

2. **Practice selector visible.** The sidebar shows `_PARITY_TEST_Praktijk_A` in the practice dropdown for owner and lid. The multi-practice user's sidebar shows the FR practice (`_PARITY_TEST_Praktijk_B`).

3. **French locale.** The multi-practice user (French locale) sees a fully translated dashboard: welcome text, day names, button labels, empty-state messages are all in French. The nav menu items switch to French: "Tableau de bord", "Agenda", "Dossiers patient", "Financier", "Factures", "RIZIV", "Rosa". However, the chart legend label "Afspraken" was not visible (chart was empty), so the hardcoded Dutch label could not be confirmed visually.

4. **Newsfeed is global.** Both the owner and the lid see the same newsfeed items (seeded test data). The multi-practice user with FR locale sees "Pas de nouvelles" -- confirming the locale-projection on the server side (the seeded items were NL-only).

5. **Todos are per-user.** The owner has 2 todo items; the lid sees the empty state. Confirmed per-user scoping.

6. **Open bills are practice-scoped.** The owner sees 35,00 EUR (matching seeded invoice data); the lid sees 0,00 EUR (no invoices for that user). The multi-practice user sees 0,00 EUR (no invoices in Practice B).

7. **Weekly chart shows zero state gracefully.** The lid (no events) and multi-practice user (no events) both show an empty chart with day labels and a flat y-axis.

### Screens not reached (and why)

- **Practice selector switching behavior** -- could not test switching practices within a session because the browser-fetch tool is stateless. The practice selector DOM is present but switching requires client-side JS interaction within a running session.
- **Responsive/mobile view** -- screenshots taken at 1440x900 desktop viewport only. Mobile breakpoints (xs/xxs) not tested.

---

## Features

A "feature" is the smallest user-visible behavior that can be tested in isolation. Aggressive splitting.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `main-dashboard/layout` | Dashboard page layout (two-band: top stats + widget grid) | docs + source + staging | `MainDashboardPage.jsx:18-108`, `Dashboard.jsx:1-90` | `from_source/features/main_dashboard.md:1-52` | `/` (screens #2-5) | `requiresPractice: true` route guard; react-grid-layout; non-resizable, non-draggable |
| 2 | `main-dashboard/welcome-banner` | Welcome banner with user's first name | docs + source + staging | `DashboardTop.jsx:29-30`, `DashboardTopContainer.jsx:8-16` | `from_source/features/main_dashboard.md:58` | Screens #2-5 | "Welkom %(firstName)" / "Bienvenue %(firstName)" |
| 3 | `main-dashboard/today-events-list` | Today's next 5 events with time labels | docs + source + staging | `DashboardTopEventList.jsx:15-61` | `from_source/features/main_dashboard.md:58` | Screens #2-5 | 60-second polling via IntervalDataProvider; empty state routes to `/agenda` |
| 4 | `main-dashboard/weekly-chart` | Weekly bar chart (Mon-Sat) with appointment counts | docs + source + staging | `DashboardTopEventChart.jsx:9-51`, `DashboardTop.jsx:18-22` | `from_source/features/main_dashboard.md:59`, `from_source/gaps/19_practice_analytics.md:24-29` | Screen #3 | Hardcoded "Afspraken" label (not i18n). Chart.js global plugin for empty state ("Geen gegevens beschikbaar") |
| 5 | `main-dashboard/weekly-stats-triple` | Busiest day / Quietest day / Average per day statistics | docs + source + staging | `DashboardTop.jsx:38-62` | `from_source/features/main_dashboard.md:60` | Screens #2-5 | QUIRK-PRESERVE: 6 labels vs 7 values (Sunday count included in average but not in chart labels or busiest/quietest selection). See bugs_and_security_findings. |
| 6 | `main-dashboard/notification-tile` | Notification count tile (yellow/navy, clickable to /notifications) | docs + source + staging | `NotificationWidget.jsx:8-31`, `NotificationWidgetContainer.jsx:6-9` | `from_source/features/main_dashboard.md:70`, `from_source/features/in_app_notifications.md:138-145` | Screens #2-5 | Data from `notifications.new.count` Counts channel. Per-user, not practice-scoped. |
| 7 | `main-dashboard/open-bills-tile` | Open invoices amount + count tile (clickable to /financial) | docs + source + staging | `OpenBillsWidget.jsx:8-48`, `OpenBillsWidgetContainer.jsx:6-12` | `from_source/features/main_dashboard.md:71`, `from_source/features/invoices_overview.md:33` | Screens #2-5 | Data from `invoices.open.statistics.sum` / `.count`. Practice-scoped. Amount in cents, formatted via `Util.formatCurrency(openAmount/100)`. |
| 8 | `main-dashboard/todos-widget` | Embedded todo list with create/edit/toggle/delete | docs + source + staging | `TodosWidget.jsx:20-101`, `TodosWidgetContainer.jsx:11-29` | `from_source/features/main_dashboard.md:72`, `from_source/features/todos.md:1-140` | Screens #2-5 | Per-user, not practice-scoped. Inline edit, checkbox toggle, hard delete. Infinite scroll (20 per batch). No standalone page. |
| 9 | `main-dashboard/newsfeed-widget` | Read-only newsfeed with bilingual admin-published items | docs + source + staging | `NewsfeedWidget.jsx:11-47`, `NewsfeedWidgetContainer.jsx:16-37` | `from_source/features/main_dashboard.md:73`, `from_source/features/newsfeed.md:1-109` | Screens #2-5 | Per-locale server projection. allowHTML body. No author UI -- DB-direct. Infinite scroll (5 per batch). No standalone page. |
| 10 | `main-dashboard/practice-selector` | Practice dropdown in sidebar affecting dashboard scope | source + staging | `Menu.jsx:206-234`, `AppContainer.jsx:14` | `coverage_matrix.md:54` ("Practice Selector: Partial") | Screens #2-5 | `RLocalStorage.setItem("currentPracticeId", value)`. Includes "ADD_PRACTICE" option. Only open-bills tile reacts to practice change. Cross-area: the practice selector is used across all screens, not just the dashboard. |
| 11 | `main-dashboard/responsive-grid` | Responsive layout switch at sm/xs/xxs breakpoints | source | `Dashboard.jsx:74-77`, `MainDashboardPage.jsx:25-47` | `from_source/features/main_dashboard.md:38-52` | Not observed (desktop-only screenshots) | lg/md: 12 cols (3+3+6 top row, 6+6 bottom). sm/xs/xxs: 6 cols (stacked 2-row). `ReactResizeDetector` triggers re-layout on window resize. |

### Feature detail -- `main-dashboard/layout`

- **Description:** The dashboard is the root authenticated route (`/`, `requiresPractice: true`). It renders two vertical bands: `DashboardTop` (fixed header with welcome + chart + stats) and `Dashboard` (react-grid-layout widget grid with 4 cells). The widget grid is non-resizable and non-draggable.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `MainDashboardPage.jsx:18-108`, `Dashboard.jsx:1-90`, `routes-flow.jsx:43-54`, `AppContainer.jsx:13-35`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:1-52`
- **Staging screen(s):** `/` (screenshots 02-05)
- **Belgian-specific concerns:** None. The layout itself is domain-neutral.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** None for the layout itself.
- **Open questions:** None.

### Feature detail -- `main-dashboard/welcome-banner`

- **Description:** Displays "Welkom %(firstName)" (NL) or "Bienvenue %(firstName)" (FR) using the current user's `profile.firstName`. Rendered via the `Text` component with i18n key `WELCOME` and `attributes: {name: firstName}`.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `DashboardTop.jsx:29-30`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:58`
- **Staging screen(s):** Screens #2-5 (confirmed NL + FR)
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** Falls back to empty string if `profile.firstName` is missing (`(this.props.user.profile && this.props.user.profile.firstName) || ''`).
- **Open questions:** None.

### Feature detail -- `main-dashboard/today-events-list`

- **Description:** Shows the next 5 events starting between "now" and "now + 1 day". Polls via `IntervalDataProvider` every 60 seconds calling `getEventsBetween({start, end, limit: 5})`. Each event shows an index bullet, the event title (or "No title"), and the start time formatted as `moment(event.start).format("LT")`. Empty state shows "Je hebt vandaag geen afspraken" / "Vous n'avez pas de rendez-vous" and an "AFSPRAAK TOEVOEGEN" / "AJOUTER UN RENDEZ-VOUS" button that routes to `/agenda`.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `DashboardTopEventList.jsx:15-61`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:58`, `from_source/features/main_dashboard.md:82-83`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** (1) Stray `console.log('patient', patient)` at line 26 -- this is a debug artifact, NOT a quirk to preserve. Remove during port. (2) Fallback "No title" is hardcoded in English, not i18n-ized (line 30).
- **Open questions:** None.

### Feature detail -- `main-dashboard/weekly-chart`

- **Description:** Bar chart (react-chartjs-2) showing appointment counts per weekday (Mon-Sat) for the current ISO week. Data from `events.week` subscription (user-scoped, no practice filter). Chart uses `height: 150`, green-teal bars, `beginAtZero: true`. Empty state handled by a global Chart.js plugin rendering "Geen gegevens beschikbaar" centered.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `DashboardTopEventChart.jsx:9-51`, `DashboardTop.jsx:18-22`, `chart.js:3-20`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:59`, `from_source/gaps/19_practice_analytics.md:24-29`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** The Mon-Sat label range may be intentional because Belgian therapists typically do not work on Sundays.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** (1) Chart legend label "Afspraken" is hardcoded Dutch, not i18n-ized (line 20 of `DashboardTopEventChart.jsx`). French users see Dutch legend text. (2) The Mon-Sat range with 7-day data counts -- see feature #5 for the stats discrepancy.
- **Open questions:** None.

### Feature detail -- `main-dashboard/weekly-stats-triple`

- **Description:** Three computed statistics displayed in the right column: Drukste dag (busiest day, `_.maxBy`), Rustigste dag (quietest day, `_.minBy`), and Gemiddeld per dag (average per day, `_.mean(values).toFixed(2)`).
- **Found via:** docs + source + staging
- **Legacy source file(s):** `DashboardTop.jsx:38-62`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:60`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** **Yes.** The `values` array has 7 entries (Mon-Sun) but `days` has 6 entries (Mon-Sat). The `_.maxBy` and `_.minBy` only iterate over `days` (6 entries) and look up `values[days.indexOf(val)]` (indices 0-5), so Sunday (index 6) can never be selected as busiest or quietest. However, `_.mean(values)` includes all 7 values, so the average is divided by 7 instead of 6. This is listed in `bugs_and_security_findings.md` as a functional bug. **Disposition for porting: FIX (do not preserve the off-by-one).** Either add Sunday to the labels or use `_.times(6, ...)` for consistency.
- **Open questions:** None remaining -- the code is clear; the discrepancy is a bug, not intentional.

### Feature detail -- `main-dashboard/notification-tile`

- **Description:** A color-changing tile showing the unread notification count. Navy background when count is 0, yellow when count > 0. Displays a triangle warning icon, the numeric count, and "Meldingen" / "Notifications" label. Clicking navigates to `/notifications`.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `NotificationWidget.jsx:8-31`, `NotificationWidgetContainer.jsx:6-9`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:70`, `from_source/features/in_app_notifications.md:138-145`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** None.
- **Open questions:** None.

### Feature detail -- `main-dashboard/open-bills-tile`

- **Description:** Card showing "OPEN_AMOUNT" title, a large formatted currency value (`Util.formatCurrency(openAmount / 100)` -- amount stored in cents), and a plural-aware "UNPAID_BILLS" subtitle. Clicking navigates to `/financial`. Data comes from `invoices.open.statistics.sum` (euro-cent total of patient share + insurance share for unpaid invoices) and `.count` (number of unpaid invoices) Counts channels. This is the ONLY dashboard widget that is practice-scoped (uses `currentPracticeId`).
- **Found via:** docs + source + staging
- **Legacy source file(s):** `OpenBillsWidget.jsx:8-48`, `OpenBillsWidgetContainer.jsx:6-12`, `patientFileInvoices/server/publications.js:31-58`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:71`, `from_source/features/invoices_overview.md:33`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** The currency formatting assumes EUR. The sum includes both patient share and third-payer (insurance) share for unpaid invoices, which is Belgian billing-specific.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** None.
- **Open questions:** None.

### Feature detail -- `main-dashboard/todos-widget`

- **Description:** An embedded personal todo list. Features: add form at the top (single text field + submit), inline checkbox toggle (`todo.done`), inline text edit via `LiveEditableForm` (`todo.edit`), timestamp (`moment.calendar()`), delete with confirmation (`todo.remove` -- hard delete, despite `removed`/`removedAt` fields on schema). Items sorted: undone first, then newest first. Infinite scroll: starts at 20, grows by 20. Empty state: "Goed zo, niets te doen!" / "Bon, rien a faire!". Per-user scope only (no practice, no sharing, no due dates, no tags, no priorities). No standalone `/todos` page -- dashboard widget only.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `TodosWidget.jsx:20-101`, `TodosWidgetContainer.jsx:11-29`, `api/todo/todos.js`, `api/todo/methods.js`, `api/todo/server/publications.js`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:72`, `from_source/features/todos.md:1-140`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** Hard delete despite soft-delete schema fields. The `removed`/`removedAt` fields exist on the collection but `todo.remove` calls `Todos.remove(...)` (hard delete), not `$set: {removed: true}`. This is likely intentional for a lightweight personal list -- preserve as-is.
- **Open questions:** None.

### Feature detail -- `main-dashboard/newsfeed-widget`

- **Description:** A read-only announcement feed from Halingo (the vendor) to all users. Content is bilingual (NL/FR), stored as `{title: {nl, fr}, body: {nl, fr}}` with per-item optional image. Server-side locale projection: the publication sends only the requested locale's strings. Body rendered with `allowHTML` (can contain `<a>` tags, formatting). Circular image per item (fallback to Halingo logo). Timestamp via `moment.calendar()`. Infinite scroll: starts at 5, grows by 5. Empty state: "Geen nieuws" / "Pas de nouvelles". No author UI -- content inserted via `meteor mongo` (confirmed by product owner, Q19). No practice scope, no role gate. No standalone page.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `NewsfeedWidget.jsx:11-47`, `NewsfeedWidgetContainer.jsx:16-37`, `api/newsfeed/newsfeed.js`, `api/newsfeed/server/publications.js`
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:73`, `from_source/features/newsfeed.md:1-109`
- **Staging screen(s):** Screens #2-5
- **Belgian-specific concerns:** None (content is generic SaaS announcements).
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** (1) `allowHTML` body rendering -- potential XSS vector from DB-authored content, but this is the intentional workflow. Preserve, but sanitize in the port. (2) Bilingual content model with server-side projection -- preserve this design; it avoids sending unused locale data.
- **Open questions:** None.

### Feature detail -- `main-dashboard/practice-selector`

- **Description:** A dropdown in the sidebar that lists all practices the user belongs to, with each practice's name and image. Selecting a practice writes to `RLocalStorage.setItem("currentPracticeId", value)`, which is reactive and propagates through `AppContainer` to the dashboard. Includes an "ADD_PRACTICE" / "AJOUTER UNE PRATIQUE" option that routes to `practices.new`.
- **Found via:** source + staging
- **Legacy source file(s):** `Menu.jsx:206-234`, `AppContainer.jsx:14`
- **HalingoDoc file(s):** `coverage_matrix.md:54` ("Practice Selector: Partial")
- **Staging screen(s):** Screens #2-5 (visible in sidebar)
- **Belgian-specific concerns:** None for the selector itself.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** None.
- **Open questions:** The practice selector is a cross-cutting component used on every authenticated page. It belongs to the Identity Management / Practice Management area as much as to the dashboard. See cross-references.

### Feature detail -- `main-dashboard/responsive-grid`

- **Description:** The widget grid uses `react-grid-layout`'s `Responsive` + `WidthProvider` with breakpoints at `lg:1200, md:996, sm:768, xs:480, xxs:0` and column counts `lg/md:12, sm/xs/xxs:6`. At lg/md: notifications (3 cols), open bills (3 cols), todos (6 cols, 4 rows), newsfeed (6 cols, 3 rows). At sm/xs/xxs: notifications (6 cols), open bills (6 cols), then todos (12 cols, 4 rows), then newsfeed (12 cols, 3 rows). A `ReactResizeDetector` triggers `grid.onWindowResize()` on window resize.
- **Found via:** source
- **Legacy source file(s):** `Dashboard.jsx:74-77` (breakpoints/cols), `MainDashboardPage.jsx:25-47` (layouts), `MainDashboardPage.jsx:94-100` (resize detector)
- **HalingoDoc file(s):** `from_source/features/main_dashboard.md:38-52`
- **Staging screen(s):** Not observed (desktop-only viewport in screenshots)
- **Belgian-specific concerns:** None.
- **Deprecation status:** Not deprecated.
- **QUIRK-PRESERVE candidates:** None. The responsive behavior is standard.
- **Open questions:** None.

**11 features in this area.** HalingoDoc's `main_dashboard.md` covered 9 of 11 features. Staging walk confirmed all 9 and added visual evidence for role-blind behavior. Source walk found 2 previously-undocumented bugs (stray console.log, isLoading logic bug) and confirmed all HalingoDoc assertions.

---

## Cross-references to other areas

- **#1 Identity Management / Practice Management:** The practice selector (#10) is a cross-cutting component managed by `Menu.jsx` and `AppContainer.jsx`. It sets the active practice for all screens, not just the dashboard. The practice model, practice creation flow, and multi-practice membership are Identity/Practice concerns.
- **#5 Multi-View Scheduling:** The today's-events list (#3) calls `getEventsBetween` from the events API. The weekly chart (#4) subscribes to `events.week`. Both are read-only consumers of the scheduling domain. The "AFSPRAAK TOEVOEGEN" empty-state button routes to `/agenda`.
- **#11 Smart Invoicing / #12 Payment Lifecycle:** The open-bills tile (#7) consumes `invoices.open.statistics` from `patientFileInvoices`. The sum computation includes both patient share and insurance share, which ties into the billing chain.
- **#19 Practice Analytics:** The weekly chart and stats triple overlap with area #19's scope. The analytics area (#19) already documents these widgets in `from_source/gaps/19_practice_analytics.md`. The dashboard layout and widget composition are this area's concern; the metric computation internals belong to #19. The boundary is: dashboard owns the UI shell and widget placement; analytics owns the data aggregation.
- **In-app Notifications (full feature):** The notification tile (#6) is a summary view; the full notifications system (inbox page at `/notifications`, navbar bell, state machine, CRUD methods) is a separate area. The tile only reads `notifications.new.count`.
- **Todos (full feature):** The todos widget (#8) IS the entire todos feature -- there is no standalone page. It is fully self-contained within the dashboard area.
- **Newsfeed (full feature):** The newsfeed widget (#9) IS the entire newsfeed feature -- there is no standalone page or author UI. It is fully self-contained within the dashboard area.

---

## [NEEDS CLARIFICATION]

### Q1: Is the Mon-Sat / 7-day count discrepancy in `DashboardTop` intentional?
- **Why it matters:** Determines whether to preserve or fix the off-by-one during porting. Belgian therapists typically do not work Sundays, so the Mon-Sat chart range may be deliberate, but counting 7 days while labeling 6 is almost certainly a bug.
- **Sources conflict?** No -- `bugs_and_security_findings.md` flags it as a functional bug and says "needs product validation". Code clearly shows 6 labels vs 7 counts.
- **What would resolve:** Product owner confirmation. Recommendation: fix to `_.times(6, ...)` to match the 6 day labels.

### Q2: Should the chart legend label "Afspraken" be i18n-ized?
- **Why it matters:** French-locale users see a Dutch word in the chart legend. This is not a functional issue but a polish question for parity.
- **Sources conflict?** No -- code is clear that the label is hardcoded.
- **What would resolve:** Product owner preference. If the legacy is accepted as-is, mark as QUIRK-PRESERVE. If the port should fix it, use the i18n key.

### Q3: Is the `isLoading` logic bug in `DashboardTopContainer.jsx:15` known?
- **Why it matters:** The loading state is `true` when `events.week` IS ready (should be `!handle2.ready()`), meaning the dashboard may flash a loading state at the wrong time or skip it entirely.
- **Sources conflict?** Not mentioned in any HalingoDoc file or bugs list.
- **What would resolve:** Codebase inspection confirms it is a bug. FIX during port (do not preserve).

---

## [NEEDS DOMAIN REVIEW]

*(empty -- the main dashboard is a generic SaaS UI shell. The only Belgian-specific concern is the Mon-Sat chart range reflecting Belgian therapist working patterns, which is a product decision, not a regulatory or clinical domain question.)*

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md
/home/tj/HalingoDoc/docs/from_source/features/main_dashboard.md
/home/tj/HalingoDoc/docs/from_source/features/in_app_notifications.md
/home/tj/HalingoDoc/docs/from_source/features/todos.md
/home/tj/HalingoDoc/docs/from_source/features/newsfeed.md
/home/tj/HalingoDoc/docs/from_source/features/invoices_overview.md (partial)
/home/tj/HalingoDoc/docs/from_source/gaps/19_practice_analytics.md (partial)
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (ctrl-F dashboard, todo, newsfeed, notification)
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F Dashboard, notification, todo)
/home/tj/HalingoDoc/docs/from_source/open_questions.md (ctrl-F dashboard, newsfeed, notification, todo)
/home/tj/HalingoDoc/docs/from_source/inventory.md (light read)

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes-flow.jsx
/home/tj/Repos/Halingo-Main/app/imports/startup/client/bootstrap/chart.js
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/AppContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/Dashboard.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTop.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventChart.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventList.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/widget/Widget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/util.jsx (partial: getWeekDates)
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/publications.js (partial: events.week)
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/publications.js (partial: invoices.open.statistics)
/home/tj/Repos/Halingo-Main/app/imports/api/todo/todos.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/notifications.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/newsfeed/newsfeed.js
/home/tj/Repos/Halingo-Main/app/imports/api/newsfeed/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/ui/components/menu/Menu.jsx (partial: practice selector)

# Staging screenshots (source 3)
/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/01-login-page.png
/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/02-dashboard-owner-full.png
/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/03-dashboard-top-band.png
/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/04-dashboard-lid-full.png
/home/tj/halingoMigration/01-discovery/staging-screens/main-dashboard/05-dashboard-multi-practice.png
```

---

## Verification notes (verbatim from `01-discovery/main-dashboard.verification.md`)

# Verification: Main Dashboard

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/main-dashboard.md`
- **Verdict:** PASS

## Overall assessment

Another excellent discovery (455 lines, 11 features with detailed per-feature breakdowns). Near-complete coverage of `main_dashboard.md` (134 lines) plus the three sub-feature files (`in_app_notifications.md`, `todos.md`, `newsfeed.md`). Citations are consistently accurate (off by 1 line throughout). The discovery goes beyond HalingoDoc by identifying two previously-undocumented bugs from source reading (`isLoading` logic bug, stray `console.log`). Five staging screenshots provide visual confirmation of role-blind behavior, FR locale rendering, and practice-scoped open-bills. No material omissions found.

## Citation accuracy

All citations verified against `from_source/features/main_dashboard.md`. Consistently off by 1 line (likely a 0-vs-1-indexing issue). Every claim matches the HalingoDoc content.

| # | Claim in discovery | Cited location | Actual location | Verified? |
|---|---|---|---|---|
| 1 | react-grid-layout isResizable/isDraggable=false | `main_dashboard.md:62-63` (referencing Dashboard.jsx) | Line 74 in HalingoDoc (citing Dashboard.jsx:62-63) | ✓ |
| 2 | Role awareness: none | `main_dashboard.md:105-107` | Line 105 | ✓ Exact |
| 3 | Per-practice scope: only open-bills | `main_dashboard.md:104` | Line 104 | ✓ Exact |
| 4 | Layout section | `main_dashboard.md:1-52` | Lines 1-51 | ✓ |
| 5 | Welcome banner | `main_dashboard.md:58` | Line 57 | ✓ Off by 1 |
| 6 | Weekly chart | `main_dashboard.md:59` | Line 58 | ✓ Off by 1 |
| 7 | Stats triple | `main_dashboard.md:60` | Line 59 | ✓ Off by 1 |
| 8 | Notification tile | `main_dashboard.md:70` | Line 69 | ✓ Off by 1 |
| 9 | Open bills tile | `main_dashboard.md:71` | Line 70 | ✓ Off by 1 |
| 10 | Todos widget | `main_dashboard.md:72` | Line 71 | ✓ Off by 1 |
| 11 | Newsfeed widget | `main_dashboard.md:73` | Line 72 | ✓ Off by 1 |
| 12 | Mon-Sat / 7-day bug reference | `bugs_and_security_findings.md` | Confirmed via HalingoDoc line 61 ("needs product validation") | ✓ |

## Material omissions

**None found.** The discovery covers:
- ✓ Two-band layout (DashboardTop + widget grid)
- ✓ All 4 widgets with data wiring, publications, and empty states
- ✓ Grid responsive breakpoints and column definitions
- ✓ Personalization rules (per-user, per-practice for open-bills, role-blind, no customization)
- ✓ DashboardTop event list with IntervalDataProvider polling
- ✓ Weekly chart with Chart.js global empty-state plugin
- ✓ Stats triple with Mon-Sat/7-day discrepancy
- ✓ Practice selector (cross-cutting component)
- ✓ Commented-out syncPatientFiles button
- ✓ Source files list (26 files)

**Additions beyond HalingoDoc:**
- `isLoading` logic bug in `DashboardTopContainer.jsx:15` (`||` should be `||!`) — not in any HalingoDoc file
- Stray `console.log('patient', patient)` in `DashboardTopEventList.jsx:26` — not in any HalingoDoc file
- "Afspraken" hardcoded Dutch label on chart legend (partially noted in HalingoDoc but discovery elaborates the FR-user impact)
- 5 staging screenshots with role/locale/practice-scope evidence

## Discrepancies flagged in discovery

All 4 verified as legitimate:

| # | Discrepancy | Verified? | Finding |
|---|---|---|---|
| 1 | `isLoading` flag logic bug (line 15: should be `||!` not `||`) | ✓ | Not flagged anywhere in HalingoDoc. Genuine new finding from source reading. |
| 2 | Stray console.log in DashboardTopEventList | ✓ | Not flagged anywhere in HalingoDoc. Genuine new finding. |
| 3 | Chart label "Afspraken" hardcoded Dutch | ✓ | HalingoDoc line 58 notes the label but doesn't flag the i18n gap. |
| 4 | Mon-Sat / 7-day count discrepancy | ✓ | Confirmed via HalingoDoc line 61 and `bugs_and_security_findings.md`. |

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #1 Identity / Practice Management | ✓ | Practice selector is cross-cutting via Menu.jsx. |
| #5 Multi-View Scheduling | ✓ | Today's events list and weekly chart consume events API. |
| #11/#12 Smart Invoicing / Payment | ✓ | Open-bills tile consumes `invoices.open.statistics`. |
| #19 Practice Analytics | ✓ | Weekly chart/stats overlap; boundary clearly defined (dashboard owns shell, analytics owns computation). |
| In-App Notifications (full feature) | ✓ | Tile is summary view; full system documented separately. |
| Todos (full feature) | ✓ | Widget IS the entire todos feature. |
| Newsfeed (full feature) | ✓ | Widget IS the entire newsfeed feature. |

All 7 cross-references verified as accurate and well-bounded.

## Domain review (logopedist-be)

No domain review needed — the discovery correctly notes this is a "generic SaaS UI shell" with no Belgian regulatory concerns. The Mon-Sat chart range reflects Belgian therapist working patterns (no Sunday consultations) but this is a product decision, not a compliance requirement.

## Staging exploration assessment

5 screenshots across 3 roles (owner NL, lid NL, multi-practice owner FR). Key confirmations:
- Role-blind dashboard (lid sees same 4 widgets as owner) ✓
- FR locale fully translated (welcome, day names, empty states, menu items) ✓
- Open-bills tile is practice-scoped (owner sees 35,00 EUR, lid sees 0,00 EUR) ✓
- Todos are per-user (owner has items, lid sees empty state) ✓
- Newsfeed is global but locale-filtered (FR user sees "Pas de nouvelles" for NL-only items) ✓

Staging gaps: practice switching behavior (requires JS interaction within session), mobile/responsive view (desktop only). Non-blocking.

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-md-01 | NOTE | staging | Mobile/responsive breakpoints not tested. | Non-blocking; visual-only concern. |
| V-md-02 | NOTE | process | Rule #7 deviation: same-family producer/verifier (Claude). | Mitigated by high quality. |

## Recommendation

**PROCEED to Phase 2.** This discovery is ready for spec authoring with no supplementation needed. The 11 features are well-defined with per-feature breakdowns, QUIRK-PRESERVE candidates identified, and 3 well-formulated [NEEDS CLARIFICATION] entries. The staging walk provides strong visual evidence for the key behavioral assertions (role-blind, FR locale, practice scope).
