# Financial overview screen

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the helpdesk covers per-invoice surfaces (patient invoices, Verzamelstaat, certificates, printing) well but says nothing about the earnings aggregation header or the "Overzicht sessies" analytics tab.

## Screen at a glance

Route: `/financial` (`app/imports/startup/client/routes/financial.js:17-27`). Container: `FinancialContainer` (`app/imports/ui/containers/financial/FinancialContainer.jsx:14`). Page component: `FinancialPage` (`app/imports/ui/pages/financial/overview/FinancialPage.jsx:56`). Navigation i18n: `financial` = "Financieel" (`i18n/resources/client/nl.i18n.js:186`).

The container subscribes to `practiceUsers` for the current practice, fetches the corresponding `Meteor.users`, and builds a list of therapist options. It also computes `hasToPayCommission` from the current user's `PracticeUsers` record. The selected therapist id is stored in a module-level `ReactiveVar` so that navigating away and back preserves the selection within a session (`FinancialContainer.jsx:12-17`).

Layout of `FinancialPage`:

1. **Top bar** (`FinancialPage.jsx:146-212`) — left column: practice/therapist picker with avatar, company number, bank account and (when a therapist is selected) RIZIV number. The picker only appears if the user has the `invoices.statistics` permission; otherwise only the current user's name is shown (`FinancialPage.jsx:162-178`, via `PermissionRender`).
2. **Earnings graph card** (`FinancialPage.jsx:213-219`) — the eight-wide `FinancialGraph` panel.
3. **Tabs panel** (`FinancialPage.jsx:220-228`) — `FinancialPageTabs` with four tabs built conditionally.

## Tabs / sections

`FinancialPageTabs` (`FinancialPageTabs.jsx:23`) constructs its tab list at render time. Tab index state is local (`tabIndex`, starts at 0, `FinancialPageTabs.jsx:24-27`).

| Tab index | Title key | Title (NL) | Component | Conditional on |
|---:|---|---|---|---|
| 0 | `financial.invoices.patient.title` | "Facturen" | `FinanceInvoicePanel` (`ui/pages/financial/invoice/FinanceInvoicePanel.jsx`) | always present. Per-patient-invoice list / search / generator. |
| 1 | `financial.invoices.insurance.title` | "Verzamelstaatfacturen" | `FinanceInsuranceInvoicePanel` (`ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx`) | unconditionally pushed (`FinancialPageTabs.jsx:66-72`). There is a commented-out gate `hasThirdPayerInvoices` (`FinancialPageTabs.jsx:66`) but it is disabled. |
| 2 | `practice.commission.title` | "Commissie" | `CommissionBox` (`modules/invoices/commission/CommissionBox.jsx`) | only shown if `hasToPayCommission` (from the container's own practice user), `hasCommissionInvoices` (fetched via `practice.commission.hasCommissionInvoices` method, `commissionInvoices/methods.js:317`), or `PermissionRender('practice.commission.view', ...)` returns true (`FinancialPageTabs.jsx:74-83`). |
| last | `financial.session.title` | "Overzicht sessies" | `SessionOverview` (`ui/pages/financial/overview/SessionOverview.jsx`) | always pushed (`FinancialPageTabs.jsx:85-89`). This is the analytics sub-tab documented under the earnings section below. |

On mount, the component fires `hasCommissionInvoices.call({practiceId}, ...)` (`FinancialPageTabs.jsx:30-34`) to decide whether to show the commission tab; the third-payer check is commented out (`FinancialPageTabs.jsx:36-37`).

## Earnings graph

### Component stack

```
FinancialPage
  └── FinancialGraph                 (loads data)
        └── EarningsGraph            (renders card)
              └── GraphBoxWithCard   (shared 8+4 layout)
                    └── Bar          (react-chartjs-2)
```

### Data

Source method: `invoices.statistics.earnings` / `getEarningStatisticsFor` (`api/invoices/patientFileInvoices/methods.js:778-839`), permission-gated on `invoices.statistics.earnings` when the caller requests a `userId` other than themselves.

Server util: `InvoiceUtil.getEarningStatisticsFor` (`api/invoices/patientFileInvoices/server/util.js:477-610`). Per year it returns a map:

```
{
  revenue:        { total, 0..11 },
  receipt:        { total, 0..11 },
  kmCompensation: { total, 0..11 },
  commission:     { total, 0..11 },
  invoices:       { total, 0..11 }
}
```

Plus `years` — the distinct set of years for which this practice/user has any event (`methods.js:810-819`).

Calculation breakdown:

- **Revenue** (`util.js:520-527`, `564-566`, `591-593`): sum of `event.price / 100` for every event belonging to a patient file (invoiced branch), plus `administrationCost / 100` for every non-cancelled invoice created in the year (`util.js:551-566`), plus `event.getPrice() / 100` for every uninvoiced event in the year range (`util.js:573-593`). Three branches add to the same totals.
- **Receipt** (`util.js:529-544`, `567-570`): for each invoiced event, if `invoice.state === InvoiceStates.PAID`, add the patient share (`event.getAmountPatient()` when third-payer, else `event.price`) divided by 100; if `invoice.getInsuranceState() === InvoiceInsuranceStates.PAID`, add the insurance share. Administration cost is added to receipt when the invoice state is PAID.
- **km compensation** (`util.js:538-540`, `586-588`): `(event.kmCompensation || 0) / 100` accumulated across both invoiced and uninvoiced branches.
- **Commission** (`util.js:595-607`): iterates `CommissionInvoices` with `{practiceId, date: {$gte, $lt}, userId?}` and adds `commissionInvoice.getAmount() / 100` to the matching month. Note that this is the commission *amount*, not whether it's been paid.
- **invoices** (`util.js:518`, `547`): invoice count per month (counted once per distinct touched month per invoice) and `invoices.total` (total invoice count in year). The UI does not currently display this counter.

Year list is capped at the **5 most recent years** when no explicit `years` argument is passed (`methods.js:831`).

### UI — left pane (the bar chart)

`EarningsGraph` (`EarningsGraph.jsx:125-170`) builds the Chart.js data:

- **labels**: `moment.months(0..11)` in month mode, year strings in year mode.
- **datasets**: two stacked bars:
  - `translate('financial.revenue')` = "Inkomsten", pale green `rgba(146,208,196,0.6)`.
  - `translate('financial.receipt')` = "Ontvangen", darker green `rgba(26,179,148,0.6)`.
- **options**: stacked x-axis (`EarningsGraph.jsx:180-184`), currency-formatted y-axis ticks via `Util.formatCurrency(label, null, null, {precision: 0})`, tooltip labels also currency-formatted.

`GraphBoxWithCard` (`GraphBoxWithCard.jsx:50-186`) provides the month / year / mode dropdowns in the header and makes bars clickable to select a month or year index on the right-hand card.

### UI — right pane (the detail card)

`EarningsGraph.jsx:44-123` renders a 3x2 grid inside the `GraphBoxWithCard` card slot. The selected row (month in month mode, year in year mode) drives a `path.format(...)` lookup into `props.data`:

| Cell | Label key | Label (NL) | Source |
|---|---|---|---|
| top-left | `financial.revenue` | "Inkomsten" | `revenue[month]` or `revenue.total` |
| top-right | `invoices.print.invoiceToPatient.events.KM_COMPENSATION` | "Kilometervergoeding" | `kmCompensation` |
| middle-left | `financial.receipt` | "Ontvangen" | `receipt` |
| middle-right | `financial.commission` | "Commissie" | `commission` |
| bottom-left | `financial.open` | "Openstaand" | computed client-side: `revenue - receipt` (`EarningsGraph.jsx:107-111`) |
| bottom-right | `financial.uninvoicedSessions` | "Niet gefactureerde sessies" | `eventsNotInvoiced` — not from the earnings method but from a separate `getUninvoicedEvents` call in `FinancialPage.fetchUninvoicedEvents` (`FinancialPage.jsx:69-95`), result length threaded through props (`FinancialPage.jsx:215`). |

### Periods and scope

- **Period unit**: calendar year, broken down into 12 month buckets. No sub-month (week/day) aggregation.
- **Range**: by default the current year; the dropdown lists up to 5 years. `FinancialGraph` calls `loadData` once on mount and again when the therapist prop changes (`FinancialGraph.jsx:26-36`).
- **Per therapist**: the top-bar dropdown (if the current user has the `invoices.statistics` permission) switches `therapistId`, which both reloads the earnings graph and refetches `getUninvoicedEvents` (`FinancialPage.jsx:99-108`).
- **Per practice**: always the current practice. There is no multi-practice earnings roll-up.

## Session overview (analytics tab)

Component: `SessionOverview` (`ui/pages/financial/overview/SessionOverview.jsx:68`). Lives inside the "Overzicht sessies" tab of `FinancialPageTabs`. This is the only drill-down-capable analytics surface in the app.

### Data

Source method: `events.statistics` / `getEventStatistics` (`api/events/methods.js:542-591`). Server util `EventsUtil.getEventsStatistics` (`api/events/server/util.jsx:247-274`) returns per year a map `{0..11: [eventArrayWithPick]}` where each element carries `_id, type, meta, price, state, start, end, treatmentId`. Like the earnings method, the years dropdown is capped at the 5 most recent years with events (`events/methods.js:583`).

### Header controls (`SessionOverview.jsx:268-302`)

- **Month dropdown** — only shown in `MONTH` mode; filters to months that actually have events via `_.filter(_.times(12), m => data[year][m].length)` so empty months are hidden.
- **Year dropdown** — loads the chosen year lazily via `loadData(value)` (`SessionOverview.jsx:286-290`).
- **Mode dropdown** — toggles between `modes.MONTH` and `modes.YEAR` (`SessionOverview.jsx:295-301`). Year mode flattens all months into a single concatenated array (`SessionOverview.jsx:142-150`).

### Doughnut 1 — event type split (`SessionOverview.jsx:152-207`)

- Title: `forms.events.type`.
- Client-side grouping: `_.groupBy(events, 'state')` to separate present from `2` = absent; within present, `_.groupBy` by `meta.type`: `type === 1` = session, `type === 4` = other, missing type or `e.type !== 1` = other, else = bilan.
- Labels: `["patient.treatments.sessions", "bilanTypes.name", "ABSENT", "OTHER"]` (translated at render).
- Click behaviour: `onSelect(i)` sets `eventIds` to the selected slice, which drives the detail box on the right (`SessionOverview.jsx:186-206`, `SessionOverviewDetailBox` below).

### Doughnut 2 — location (`SessionOverview.jsx:225-241`)

- Title: `financial.session.place` = "Plaats".
- Grouping: `_.groupBy(events, 'meta.location')`, keyed against the labels in `Events.getLocations()` (which contains the static list of Belgian location codes).

### Doughnut 3 — price (`SessionOverview.jsx:243-261`)

- Title: `financial.session.price` = "Prijs".
- Grouping: by the result of `event.getPrice()`; labels are the distinct prices formatted via `Util.formatCurrency(p / 100)`.

### Detail table — `SessionOverviewDetailBox`

File: `ui/pages/financial/overview/SessionOverviewDetailBox.jsx`. Renders a sortable `<Table>` (Material UI) with columns:

- `invoices.print.description` ("Omschrijving")
- `NUMBER_SESSIONS` = "Aantal sessies" (`SessionOverviewDetailBox.jsx:40-43`)

Rows come from `_.groupBy(events, e => e.getFullType().split('.')[0])`, with the group key translated through `invoices.print.invoiceToPatient.events.{key}` (`SessionOverviewDetailBox.jsx:60-69`). Click on a bar's legend slice swaps the grouped events, so the table updates reactively (`SessionOverview.jsx:186-223`).

Empty state: when `getData().length === 0`, the four-doughnut grid is replaced by a centred `NO_DATA` = "Geen gegevens beschikbaar" headline (`SessionOverview.jsx:321-324`).

## Commission view

Component: `CommissionBox` (`modules/invoices/commission/CommissionBox.jsx`, 303 lines). Only shown on the financial page as its own tab, gated on `hasToPayCommission || hasCommissionInvoices || PermissionRender('practice.commission.view')` (`FinancialPageTabs.jsx:74-83`).

The commission tab is a **commission-invoice list** with a "Genereer" generator button (`CommissionBox.jsx:48-89`), a searchable/sortable list via `CollectionSearch` (`CommissionBox.jsx:25-27`), per-row `MoreMenu` with edit/delete actions, and state badges. This is not a dedicated analytics view — it is a CRUD list with a total of open commissions at the top.

A second commission surface exists on `PracticesOverviewPage` via `PracticePatientFileCommission` (`ui/pages/practices/PracticePatientFileCommission.jsx`), which shows only the open-amount total (from method `practice.commission.getOpenAmount`, `commissionInvoices/methods.js:240`) and is filterable by therapist. That tile is documented in `../gaps/19_practice_analytics.md`.

Cross-reference: per-disorder commission overrides, commission types (`none/fixedAmount/percentage`, `commissionInvoices/commission.jsx:8`) and state transitions (`OPEN → PAID`) are handled by the commission invoice module and are out of scope for this financial-overview page.

## Export

**There is no export from this screen.** Grep for `exportCSV`, `\.csv`, `\.xlsx`, `downloadReport`, `generateReport` across `app/imports` returns no matches in the API layer. The i18n key `financial.printOverview` = "Overzicht printen" (`i18n/resources/client/nl.i18n.js:804`) exists but has **no caller** anywhere in the codebase — it is dead text.

What does exist adjacent to the screen but is not an "overview" export:

- **Per-invoice print / mail** — every individual invoice detail page (`modules/invoices/patient/PatientInvoicePage.jsx`, insurance, commission) can print and email one invoice via `InvoiceTemplates` + `generatePDF` (`api/invoices/patientFileInvoices/server/util.js:652-683`). This is invoice-level, not report-level.
- **iCal export for the agenda** — `exportAgenda` on `agendaSettings` (`api/agendaSettings/agendaSettings.jsx`) and the REST endpoint at `api/events/server/rest.jsx` — these serve calendar events, not financial data.

> ⚠️ If the running app shows an "Export CSV" or "Download report" button on the financial page, it is added by a component not present in this source tree — please confirm with product.

## Source files

- `/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/financial.js`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/containers/financial/FinancialContainer.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialPage.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialPageTabs.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialGraph.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/SessionOverview.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/SessionOverviewDetailBox.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/EarningsGraph.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/invoice/FinanceInvoicePanel.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/GraphBoxWithCard/GraphBoxWithCard.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/components/composed/Doughnut.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/commission/CommissionBox.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/commissionInvoices/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js`
