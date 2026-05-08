# Practice analytics (gap fill from code)

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. The helpdesk export contains no article on this topic; this document was assembled by reading the source. Functional grouping #19 in `../../functional/application_map.md`. Verify against running app before promoting to `manual/`.

## Summary

Halingo does not have a dedicated analytics module. There is no `/analytics`, `/reports`, or `/statistics` route, no "Reports" top-level navigation entry, and no i18n namespace for `analytics.*`, `reports.*`, or `kpi.*`. What exists instead is **inline statistics tiles, graphs and doughnut charts scattered across four existing screens**: the main dashboard (home), the financial overview, the practices overview, and the RIZIV overview. Each of those screens computes its own slice of numbers from raw collections (`events`, `patientFileInvoices`, `commissionInvoices`, `patientFiles`, `treatments`) on demand; there are no pre-aggregated metric tables and no scheduled roll-up jobs.

Five server-side aggregation methods power the entire analytics surface: `events.statistics` (session counts by month and type), `invoices.statistics.earnings` (revenue / receipt / km-compensation / commission by month), `invoices.statistics` (latest invoice date only), `riziv.r-value.statistics` (R-waarde and nomenclature provisions by month) and the publication `invoices.open.statistics` (sum and count of open bills). Two simpler per-collection methods complete the picture: `patientFile.count` (patient state counts) and `practice.commission.getOpenAmount` (open commission total). All year-over-year dimensions are capped at the five most recent years with events (`events/methods.js:583`, `invoices/patientFileInvoices/methods.js:831`, `riziv/methods/methods.js:51`).

There is no revenue forecasting, no KPI thresholding, no trend alerting, no therapist performance comparison, no per-disorder mix report, no patient-cohort analysis, no exportable report (no CSV / XLSX / scheduled email), and no "export to PDF" for any analytics view. What the helpdesk flags as a hard-zero gap is largely a hard-zero gap in the code as well; the surfaces that do exist are the four screens below.

## Dashboards and screens

| Screen | Route | Component | What it shows |
|---|---|---|---|
| Home / main dashboard | `/` (`routes-flow.jsx:43`) | `MainDashboardPage` (`ui/pages/main/MainDashboardPage.jsx:18`) | Header strip with welcome, today's event list, weekly bar chart of appointment count, busiest / quietest / average-per-day text; plus widget grid with notification count, open-bills amount, todos list, newsfeed. |
| Financial overview | `/financial` (`routes/financial.js:17`) | `FinancialPage` via `FinancialContainer` (`ui/pages/financial/overview/FinancialPage.jsx:56`, `ui/containers/financial/FinancialContainer.jsx:14`) | Earnings bar graph (revenue + receipt), earnings-detail card (revenue, km-compensation, receipt, commission, open, uninvoiced-session count), four tabs (Patient invoices, Verzamelstaat invoices, Commission, "Overzicht sessies"). The last tab hosts a second analytics sub-view with four doughnut charts. |
| Practices overview | `/practices/` (`routes/practice.jsx:25`) | `PracticesOverviewPage` → `PracticePatientFileStatistics` + `PracticePatientFileCommission` (`ui/pages/practices/PracticesOverviewPage.jsx:61-65`) | A patient-state tile (total / active / inactive / waitlist) and a commission open-amount tile, both filterable by therapist. |
| RIZIV overview | `/riziv` (`routes/riziv.js:13`) | `RizivPage` → `RizivPageGraph` (`modules/riziv/RizivPage.jsx:14`, `modules/riziv/RizivPageGraph.jsx:18`) | Four header tiles (RIZIV logo, R-waarde total, provisions with code, provisions without code) and a stacked bar chart by month with an info card on the right. |

## Metrics and calculations

### Session count bar chart (home header)

- **Metric**: Number of calendar events per weekday for the current week.
- **i18n keys on the tile**: `WELCOME`, `BUSIEST_DAY`, `QUIETEST_DAY`, `AVERAGE_PER_DAY`, plus day-name keys `MONDAY…SATURDAY`. Bar series label is hard-coded as `"Afspraken"` (`DashboardTopEventChart.jsx:20`).
- **Calculation**: Client-side over the `events.week` subscription. For each of 7 days in the current week it counts the events whose `start` falls inside the day window: `Events.find({start: {$gte: ..., $lt: ...}}).count()` (`DashboardTop.jsx:22`). Busiest day = `_.maxBy` over those counts, quietest = `_.minBy`, average = `_.mean(values).toFixed(2)` (`DashboardTop.jsx:44-58`).
- **Scope**: Current user's events only (the `events.week` publication filters on `userId: this.userId`, `events/server/publications.js:65-72`), current ISO week, no practice filter.
- **Source**: `DashboardTop.jsx:22-58`, publication `events/server/publications.js:65`.

### Open bills (home dashboard tile + financial overview feed)

- **Metrics**: `openAmount` (sum of unpaid balances in euro-cents) and `count` (number of unpaid invoices).
- **i18n keys**: `OPEN_AMOUNT`, `UNPAID_BILLS` with `zero/one/other` plural forms.
- **Calculation**: Publication `invoices.open.statistics` (`invoices/patientFileInvoices/server/publications.js:31`). Cursor is `PatientFileInvoices.find({userId, practiceId, isCanceled: false, isPaid: false})`. The sum is computed per invoice by `countFromField`: if invoice state is not `PAID`, add `invoice.getAmountPatient()`; if the invoice is third-payer and insurance state is not `PAID`, additionally add `invoice.getAmountInsurance()`. Count is the cursor length.
- **Scope**: Per practice, per user. The widget container passes the current `practiceId` but not a `userId`, so the server falls back to `this.userId` (`OpenBillsWidgetContainer.jsx:7`).
- **Source**: `invoices/patientFileInvoices/server/publications.js:31-58`, consumed via `Counts.get("invoices.open.statistics.sum")` and `Counts.get("invoices.open.statistics.count")` in `OpenBillsWidgetContainer.jsx:10-11`.

### Notification count (home dashboard tile)

- **Metric**: Unread notification count.
- **Calculation**: Publication `notifications.new` (`notifications/server/publications.js:12`) uses `Counts.publish` over `Notifications.find({userId: this.userId, state: Notifications.states.NEW})`.
- **Scope**: Per user, all practices.
- **Source**: Consumed via `Counts.get("notifications.new.count")` in `NotificationWidgetContainer.jsx:8`.

### Earnings graph — revenue (month and year view)

- **Metric**: Sum of billable event prices per month, including administration costs.
- **i18n keys on the card**: `financial.revenue` = "Inkomsten", `invoices.print.invoiceToPatient.events.KM_COMPENSATION` = "Kilometervergoeding", `financial.receipt` = "Ontvangen", `financial.commission` = "Commissie", `financial.open` = "Openstaand", `financial.uninvoicedSessions` = "Niet gefactureerde sessies".
- **Calculation** (`invoices/patientFileInvoices/server/util.js:477-609`, method wrapper `methods.js:778`):
  1. Select events in year range, joined to a patient file, for the practice (optionally filtered by `userId`).
  2. For each invoice that any of those events point to, walk `invoice.events`. Add `event.price / 100` to `revenue[eventMonth]` and `revenue.total`. Increment `invoices.total` once per invoice, and set `invoices[month] += 1` for each distinct month the invoice touches.
  3. Add any `administrationCost` on non-cancelled invoices in-year: to `revenue[month]` and `revenue.total` (`util.js:551-571`).
  4. Walk all events with `invoiceId: null` in year range and add their `event.getPrice() / 100` to `revenue[month]` and `revenue.total` (uninvoiced revenue is still counted as earnings) (`util.js:573-593`).
- **Scope**: Per practice; optionally per `userId`. Time range: one calendar year at a time; the graph can show up to 5 years, selected via the year dropdown (`FinancialGraph.jsx:27`, `methods.js:831`).
- **Source method**: `getEarningStatisticsFor` in `invoices/patientFileInvoices/methods.js:778`, util at `invoices/patientFileInvoices/server/util.js:477`.

### Earnings graph — receipt (paid-amount)

- **Calculation**: Per invoice event loop (`util.js:529-544`):
  - If `invoice.state === InvoiceStates.PAID`, add the patient share (`event.getAmountPatient()` if `isThirdPayer`, otherwise `event.price`), divided by 100, to `receipt[eventMonth]` and `receipt.total`.
  - If `invoice.getInsuranceState() === InvoiceInsuranceStates.PAID`, add `(event.price - event.getAmountPatient()) / 100`.
  - Administration cost is added to receipt when invoice state is PAID (`util.js:567-570`).
- **Derived "Open" card value** (shown in the detail card): `revenue - receipt`, computed client-side (`EarningsGraph.jsx:107-111`). There is no server-side "open per year/month" metric — it is only a display subtraction.

### Earnings graph — km compensation

- **Calculation**: For every event in range (both invoiced and uninvoiced branches), `(event.kmCompensation || 0) / 100` is added to `kmCompensation[month]` and `kmCompensation.total` (`util.js:538-540`, `586-588`).
- **Scope**: same year/practice/user filter as revenue.

### Earnings graph — commission

- **Calculation**: Iterate `CommissionInvoices.find({practiceId, date: {$gte, $lt}, userId?})` and add `commissionInvoice.getAmount() / 100` to `commission[month]` and `commission.total` (`util.js:595-607`).
- **Scope**: Per practice, optionally per user, per year.

### Earnings graph — uninvoiced sessions count

- **Metric**: Count of events not yet invoiced, shown as a number on the earnings card.
- **Calculation**: Not part of `getEarningStatisticsFor`. It is computed by a separate call to `events.get.uninvoiced` (`getUninvoicedEvents`, `events/methods.js:430`), and the array length is passed into the graph as `eventsNotInvoiced` (`FinancialPage.jsx:215`, `EarningsGraph.jsx:116`).

### Session-overview doughnut — event type split

- **Metric**: Count of this month's (or year's) events split into four slices: session / bilan / absent / other.
- **i18n labels**: `patient.treatments.sessions`, `bilanTypes.name`, `ABSENT`, `OTHER` (`SessionOverview.jsx:178`).
- **Calculation** (client-side, over the response of `getEventStatistics`): `_.groupBy(events, 'state')` to split present vs absent (`state 1` = present, `state 2` = absent, `SessionOverview.jsx:155`), then within "present", `_.groupBy` on `meta.type`: `type === 1` → session, `type === 4` → other, undefined-type or non-`type===1` event → other, else → bilan (`SessionOverview.jsx:156-173`).
- **Source method**: `events.statistics` via `getEventStatistics` (`events/methods.js:542`). The util `_getEventsStatistics` (`events/server/util.jsx:247`) collects all events for the practice (+ optional user) with a patientFileId, in the year range, and bins them by month with fields `_id, type, meta, price, state, start, end, treatmentId` per event.

### Session-overview doughnut — by event type detail (right pane)

- **Metric**: Count of the selected slice, further broken down by `event.getFullType()` (the first dot-separated component).
- **UI**: When the user clicks a slice, the right-hand pane shows a sortable table via `SessionOverviewDetailBox` with columns `invoices.print.description` ("Omschrijving") and `NUMBER_SESSIONS` ("Aantal sessies"). The name is translated through `invoices.print.invoiceToPatient.events.{type}` (`SessionOverviewDetailBox.jsx:60-69`).

### Session-overview doughnut — by location (Plaats)

- **Metric**: Same event bucket, grouped by `meta.location`. Labels come from `Events.getLocations()` (`SessionOverview.jsx:225-241`).
- **Title**: `financial.session.place` = "Plaats".

### Session-overview doughnut — by price (Prijs)

- **Metric**: Same event bucket, grouped by `event.getPrice()`. Labels are formatted as currency (`Util.formatCurrency(p/100)`, `SessionOverview.jsx:243-261`).
- **Title**: `financial.session.price` = "Prijs".

### Patient-file counts tile (practices overview)

- **Metrics**: `total`, `active`, `pending` (labelled `practice.waitList` = "Wachtlijst" in the UI), `inactive`.
- **Calculation**: Method `patientFile.count` / `getPatientFileCounts` (`patientFiles/methods.jsx:650-714`). `PatientFiles.rawCollection().aggregate([{$match: {practiceId, removed:{$ne:true}}}, {$group:{_id:'$state', count:{$sum:1}}}])`. When a `userId` is passed, the `_id` set is first narrowed to patient files that user has access to via `PatientFileUsers` (`methods.jsx:692-698`). Total is computed client-side as `active + pending + inactive` (`PracticePatientFileStatistics.jsx:37`) — note that this intentionally excludes any other state (e.g. `starting`) from the "total".
- **Scope**: Per practice, optionally per user. No time range.
- **Source**: `patientFiles/methods.jsx:650`.

### Open commission tile (practices overview + financial tab indicator)

- **Metrics**: `sum` (euro-cents), `count` (number of open commission invoices).
- **Calculation**: Method `practice.commission.getOpenAmount` / `getOpenAmount` (`invoices/commissionInvoices/methods.js:240`). Selector `{date: {$lt: now}, practiceId, status: CommissionStates.OPEN}` optionally narrowed by `userId`. Iterates the matched `CommissionInvoices` cursor and accumulates `ci.getAmount()` and a running count (`methods.js:305-313`). A commented-out aggregate variant exists above at `methods.js:297-303`.
- **Scope**: Per practice, optionally per user. No time range (past-dated only).
- **Source**: `invoices/commissionInvoices/methods.js:240`.

### RIZIV — R-waarde

- **Metric**: Sum of R-waarden (RIZIV time-equivalent, numeric) for billable events in year range.
- **i18n**: `riziv.overview.r-value` = "R-Waarde" / "Valeur R".
- **Calculation** (`modules/riziv/server/util.js:7-55`):
  - For each event whose `state !== ABSENT` and whose treatment is not supplementary insurance and that has a `treatmentId`, resolve the nomenclature code via `treatment.getCodeForEvent(event)`.
  - Map code → R value via `_getRValueForCode` (`server/util.js:7-38`): `7010…` → 17.5; codes in `(702000, 710090)` or in an enumerated list of individual-session codes → 35; enumerated group-session codes → 17.5 pre-2023-05-01, 15 after; codes `724415/724430/724485` → 17.5; otherwise use the 4th digit: `3` → 17.5, `6` → 35, `4` → 9, else 0. The multiplication by `event.sessionCount` is present in the source but commented out (`server/util.js:53`).
- **Scope**: Per practice (always required), per user (optional), per year; stored as `{total, 0..11}` per month.
- **Source**: method `riziv.r-value.statistics` / `getRValueStatistics` (`modules/riziv/methods/methods.js:13`), util `modules/riziv/server/util.js:56`.

### RIZIV — provisions with code

- **Metric**: Session count (`event.getSessionCount(treatment)`) summed across events whose R-waarde resolved to > 0 (i.e. nomenclature found and reimbursable).
- **i18n**: `riziv.overview.provisions.withCode.name` = "Verstrekkingen met nomenclatuur" / "Prestation avec nomenclature".
- **Source**: `modules/riziv/server/util.js:96-98`.

### RIZIV — provisions without code

- **Metric**: Session count summed across events where R-waarde resolved to 0 (treatment has no nomenclature for that event, or is supplementary insurance, or no treatment link).
- **i18n**: `riziv.overview.provisions.withoutCode.name` = "Verstrekkingen zonder nomenclatuur" / "Prestations sans nomenclature".
- **Source**: `modules/riziv/server/util.js:99-101`.

### Latest invoice date (orphan)

- **Metric**: `latestInvoiceDate` — the `createdAt` of the most recent patient-file invoice for `(userId, practiceId)`.
- **Source method**: `invoices.statistics` / `getInvoiceStatistics` (`invoices/patientFileInvoices/methods.js:841-870`).
- **Where consumed**: no component in `ui/` or `modules/` calls it. The i18n key `financial.lastInvoice` ("Datum laatste factuur") also has no caller. This appears to be dead / not-yet-wired.
- **Source**: `invoices/patientFileInvoices/methods.js:841`.

## Charts and visualizations

The project uses **`chart.js@2.9.3` with `react-chartjs-2@2.9.0`** (`app/package.json:34,73`). There are no Recharts, D3, Victory or Nivo imports. A global Chart.js plugin registered in `startup/client/bootstrap/chart.js:3-20` draws a centred "Geen gegevens beschikbaar" (`NO_DATA` i18n key) overlay whenever every dataset is empty, and a doughnut controller override at `bootstrap/chart.js:22-65` supports centre-of-doughnut text and HTML overlays.

Only five analytics chart sites exist in the app:

| Chart | File:line | Type | Data series | Axis labels (original) |
|---|---|---|---|---|
| Weekly event count (home header) | `DashboardTopEventChart.jsx:32-48` | Bar | One dataset hard-coded label `"Afspraken"`, backgroundColor `rgba(26,179,148,0.5)` | x = translated weekday names `MONDAY…SATURDAY`, y numeric (`beginAtZero: true`). |
| Earnings graph (financial overview) | `EarningsGraph.jsx:147-168` + `GraphBoxWithCard.jsx:132-175` | Stacked / grouped Bar | Two datasets: `translate('financial.revenue')` = "Inkomsten", color `rgba(146,208,196,0.6)`; `translate('financial.receipt')` = "Ontvangen", color `rgba(26,179,148,0.6)` | Month view: x = `moment.months(0..11)`, stacked x-axis (`EarningsGraph.jsx:180-184`). Year view: x = year labels. y formatted as currency with 0-precision via `Util.formatCurrency` tick callback. |
| Session overview — event types | `SessionOverview.jsx:195-206` (via `Doughnut.jsx`) | Doughnut | Four slices labelled `patient.treatments.sessions`, `bilanTypes.name`, `ABSENT`, `OTHER`. Slice colours are procedurally generated from `Colors.HALINGO` via `Color(...).lighten/darken()` (`Doughnut.jsx:13-23`). | Centre text shows selected label + count. `cutoutPercentage: 70`, legend off, tooltips off (`Doughnut.jsx:102-110`). |
| Session overview — location | `SessionOverview.jsx:240` | Doughnut | Labels from `Events.getLocations()`; title text `financial.session.place` = "Plaats". | Same Doughnut defaults. |
| Session overview — price | `SessionOverview.jsx:252-260` | Doughnut | Labels are formatted currency; title `financial.session.price` = "Prijs". | Same Doughnut defaults. |
| RIZIV provisions | `RizivPageGraph.jsx:69-92` + `GraphBoxWithCard.jsx` | Stacked Bar | Two datasets `riziv.overview.provisions.withCode.short` = "Met nomenclatuur" (darker green) and `riziv.overview.provisions.withoutCode.short` = "Zonder nomenclat." (lighter green) | Both x and y stacked; y tick callback returns integer-only values (`RizivPageGraph.jsx:99-108`); tooltips in `index` mode. |

`GraphBoxWithCard` (`ui/components/advanced-components/GraphBoxWithCard/GraphBoxWithCard.jsx:50-186`) is the shared two-column layout: an 8-column Bar chart on the left and a 4-column information panel on the right, with month/year/mode dropdowns on the header strip. It is used by both `EarningsGraph` and `RizivPageGraph`. Clicking a bar updates the right panel to that month/year (`GraphBoxWithCard.jsx:156-172`).

`Doughnut` (`modules/components/composed/Doughnut.jsx`) is the shared doughnut wrapper. It keeps a `selected` slice index, shows the selected slice's label and value in the centre, and supports `onSelect` for drill-down (used by `SessionOverview` to drive the detail table, `SessionOverview.jsx:197-205`).

## Filters and dimensions

- **By year**: Earnings graph, session overview doughnuts, RIZIV graph. The years dropdown is populated from the distinct `$year` of all events in the practice (`events/methods.js:562-571`, `invoices/patientFileInvoices/methods.js:810-819`, `riziv/methods/methods.js:33-42`), capped at the **five most recent years** when no explicit year list is passed (`events/methods.js:583`, `invoices/patientFileInvoices/methods.js:831`, `riziv/methods/methods.js:51`).
- **By month**: Same three graphs. Monthly/yearly view is switchable via a `modes` dropdown (`MONTH` / `YEAR`) in `GraphBoxWithCard.jsx:12-15`.
- **By therapist** (within a practice): Earnings graph and session overview both drive off `FinancialContainer`'s `therapistId` reactive var, exposed as a dropdown at the top of `FinancialPage.jsx:162-173` (gated on the `invoices.statistics` permission). The practices overview has its own per-tile therapist dropdown (`PracticePatientFileStatistics.jsx:54-67`, `PracticePatientFileCommission.jsx:53-66`). The RIZIV page does **not** expose a therapist dropdown — it always passes `Meteor.userId()` (`RizivPage.jsx:57`).
- **By practice**: Implicit — the current practice id comes from `RLocalStorage.getItem('currentPracticeId')` (`AppContainer.jsx:14`) and is passed down to every screen.
- **By patient / treatment / disorder / insurance fund**: No such dimension exists in any analytics surface. Filters at these granularities do not exist.
- **Drill-through on a chart**: Only in Session Overview (click doughnut slice → populate right-hand detail table, `SessionOverview.jsx:197-205`). The earnings graph bar click sets the month index for the right-hand card but does not open any sub-view (`GraphBoxWithCard.jsx:156-172`).

## Data sources

| Collection | Used for | Key fields read |
|---|---|---|
| `events` (`api/events/events.jsx:14`) | Session counts, earnings (revenue branch & uninvoiced branch), km compensation, R-waarde, session-overview doughnuts | `start`, `end`, `type`, `meta.type`, `meta.location`, `price`, `state`, `patientFileId`, `practiceId`, `userId`, `invoiceId`, `treatmentId`, `kmCompensation`, `hasPayBack`, `sessionCount`, `removed` |
| `patientFileInvoices` (`api/invoices/patientFileInvoices/patientFileInvoices.js:11`) | Earnings receipt branch, administration cost, open-bills tile, latest-invoice-date (orphan), open-bills publication | `events[]`, `state`, `isThirdPayer`, `administrationCost`, `createdAt`, `isCanceled`, `isPaid`, `userId`, `practiceId`, plus the computed helpers `getAmountPatient()`, `getAmountInsurance()`, `getInsuranceState()` |
| `commissionInvoices` (`api/invoices/commissionInvoices/commission.jsx:8`) | Commission total on earnings graph + open commission tile | `date`, `status`, `userId`, `practiceId`, `getAmount()` |
| `patientFiles` (`api/patientFiles/patientFiles.jsx:15`) | Patient state tile on practices overview | `state` (`starting/active/inactive/pending`), `practiceId`, `removed` |
| `patientFileUsers` (`api/patientFileUsers/patientFileUsers.jsx:4`) | Narrows patient-count by user when a therapist is selected | `userId`, `patientFileId` |
| `treatments` (`api/treatments/treatments.js:9`) | R-waarde code resolution (`treatment.getCodeForEvent`, `treatment.isSupplementaryInsurance`) | nomenclature code table, supplementary-insurance flag |
| `notifications` (`api/notifications/notifications.jsx:6`) | Home-dashboard notification count tile | `state`, `userId` |

No analytics aggregates are persisted — every request recomputes from raw rows. There is no materialised view, no roll-up collection, no MongoDB time-series collection, no external analytics store.

## Gap inside the gap

Things the helpdesk-era taxonomy (`application_map.md` #19 "Practice Analytics") or common SaaS expectations would suggest should exist, but which **do not exist** in the code:

- **Revenue forecasting / projections**. No forecast calculation, no trend extrapolation, no seasonal adjustment. Earnings graph is strictly historical.
- **KPI dashboard with targets and thresholds**. No KPI definitions, no target storage, no red/yellow/green indicators, no alerting on KPI drift.
- **Therapist performance comparison**. The financial screen lets the viewer *pick* one therapist at a time, but cannot rank therapists side-by-side, cannot compare a therapist to the practice average, and has no leaderboard.
- **Patient-cohort / intake / drop-off metrics**. No retention curves, no intake-funnel counts, no "new patients this month" metric. The practices overview tile shows only the current-state snapshot (active / inactive / pending / total).
- **Outcome / clinical-impact metrics**. No report on goal completion rates, bilan outcomes, therapy duration averages, or anything derived from `patientFileReports` / `longTherapy`. The long-term-therapy collection has a `state: todo/inProgress/done` field but no aggregation surface reads it.
- **Per-disorder / per-nomenclature-code revenue mix**. The RIZIV graph splits provisions "with code" vs "without code" but does not show a breakdown by individual nomenclature code or by treatment type (a/b.1–b.6.4/c.1–c.2/d/e/f).
- **Per-Ziekenfonds (insurance fund) analytics**. No report on which funds pay the fastest, how much is owed per fund, or batch-level Verzamelstaat settlement lag.
- **Waitlist / intake queue analytics**. The `pending` count on the practices tile is labelled `practice.waitList` = "Wachtlijst" but is the only data point. No queue-length-over-time, no time-in-queue, no overdue-intake metric. Gap #4 in the coverage matrix is empty in code as well.
- **Debtor / aging report**. Open-bills widget gives a single sum and count; there is no age-bucketing (0-30 / 31-60 / 61-90 / 90+), no overdue flag in the analytics, no collection-priority list.
- **Appointment utilisation / no-show rate**. The session-overview doughnut has an "ABSENT" slice but does not show the no-show rate over time, nor a fill-rate percentage, nor chair-utilisation.
- **Exportable reports**. No `exportCSV` / `exportPDF` / `downloadReport` method anywhere in `app/imports`. Grep for `\.csv`, `\.xlsx`, `exportCSV`, `generateReport` returns nothing in the API layer. The i18n string `financial.printOverview` = "Overzicht printen" exists but has **no caller** — it appears to be leftover from a removed feature.
- **Scheduled / emailed reports**. No cron-like job, no `monthlyReport`, no email template for a report. Only invoice emails exist.
- **Drill-down from the home dashboard**. The weekly event chart on the home header is not clickable and has no drill-down; busiest-day / quietest-day are text only.
- **Per-practice aggregation across practices**. `currentPracticeId` is a single value in local storage (`AppContainer.jsx:14`); there is no multi-practice roll-up view for an owner who runs several praktijken.
- **Analytics module boundary**. There is no `api/analytics/`, no `api/reports/`, no `modules/analytics/`, no `ui/pages/analytics/`. The word "analytics" does not appear in any i18n namespace (`scout_pass.md` §6 confirms this). Every metric is entangled with the page that displays it.

Net: the Zendesk-era gap "Practice Analytics" reflects the code faithfully. The four existing surfaces (home header, financial overview, practices overview, RIZIV overview) together cover about what you can get by `_.groupBy`-ing the raw `events` and `patientFileInvoices` collections along a single dimension each. Anything beyond that — forecasting, cohorts, KPIs, export — is unbuilt.

## Source files

- `/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes-flow.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/startup/client/bootstrap/chart.js`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/containers/AppContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/containers/financial/FinancialContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/Dashboard.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTop.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventChart.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTopEventList.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/GraphBoxWithCard/GraphBoxWithCard.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/EarningsGraph.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialPageTabs.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialGraph.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/SessionOverview.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/SessionOverviewDetailBox.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticesOverviewPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticePatientFileStatistics.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticePatientFileCommission.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/components/composed/Doughnut.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/OpenBillsWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/commission/CommissionBox.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/notifications/NotificationWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/RizivPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/RizivPageGraph.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/methods/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/server/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/resources/client/nl.i18n.js`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/resources/client/fr.i18n.js`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidget.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidgetContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/commissionInvoices/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/methods.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/treatments/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/notifications/server/publications.js`
- `/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js`
- `/home/tj/Repos/Halingo-Main/app/package.json`
