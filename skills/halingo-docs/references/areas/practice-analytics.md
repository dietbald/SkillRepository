# Practice Analytics

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Earnings, sessions, RIZIV stats, dashboard charts.

## Spec contracts (Phase 2)

- **dashboard-weekly-activity** — Feature: practice-analytics/dashboard-weekly-activity
  - Path: `02-specs/practice-analytics/dashboard-weekly-activity/spec.md`
- **earnings-overview** — Feature: practice-analytics/earnings-overview
  - Path: `02-specs/practice-analytics/earnings-overview/spec.md`
- **practice-patient-stats** — Feature: practice-analytics/practice-patient-stats
  - Path: `02-specs/practice-analytics/practice-patient-stats/spec.md`
- **riziv-overview** — Feature: practice-analytics/riziv-overview
  - Path: `02-specs/practice-analytics/riziv-overview/spec.md`
- **session-overview** — Feature: practice-analytics/session-overview
  - Path: `02-specs/practice-analytics/session-overview/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/practice-analytics.md`)

# Discovery: Practice Analytics

- **Area:** #19 Practice Analytics
- **Slug:** `practice-analytics`
- **Status:** Complete (Sources 1 + 2 + 3)
- **Last Updated:** 2026-04-09

## Executive Summary

Halingo does not have a dedicated, standalone analytics module. Instead, it features inline statistics tiles, bar graphs, and doughnut charts integrated directly into four core functional screens: the Main Dashboard, Financial Overview, Practices Overview, and RIZIV Overview. These visualizations are powered by five main server-side aggregation methods that compute metrics on-demand from raw collections (`events`, `patientFileInvoices`, `commissionInvoices`, `patientFiles`, `treatments`). 

The system relies on `chart.js@2.9.3` for visualization. While basic historical performance tracking (revenue, session counts, R-waarde) is supported, there is a significant functional gap regarding advanced analytics: there is no revenue forecasting, no KPI thresholding, no therapist side-by-side comparison, and no export capability (CSV/XLSX/PDF) for any statistical data.

## Source 1 — HalingoDoc Audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Curated | `functional/application_map.md` | — | § 2 competency 19 | Formal area definition |
| Code-derived | `from_source/gaps/19_practice_analytics.md` | 225 | full | Core metrics, calculations, data sources, and identified functional gaps. |
| Code-derived | `from_source/features/r_waarden.md` | 150 | full | R-waarde metric definition and historical changes. |
| Cross-cutting | `from_source/deprecation_list.md` | — | #13 | `getInvoiceStatistics` and `latestInvoiceDate` marked for removal. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | `DashboardTop` | Mon-Sat range with 7-day counts bug in header chart. |

### What HalingoDoc covers for this area

HalingoDoc (specifically the gap file) provides a comprehensive map of the scattered analytics surfaces. It details the five server-side methods (`events.statistics`, `invoices.statistics.earnings`, `riziv.r-value.statistics`, etc.) and the client-side logic for the four main dashboards. It also explicitly catalogs the "Gap inside the gap"—standard analytics features that are missing from the legacy code.

### What HalingoDoc does NOT cover

HalingoDoc does not describe the specific visual styling of the charts or the exact wording of all i18n keys used in chart legends, which required Source 3 verification.

### Direct citations worth preserving

> "Halingo does not have a dedicated analytics module. What exists instead is inline statistics tiles, graphs and doughnut charts scattered across four existing screens." (`from_source/gaps/19_practice_analytics.md:10`)

> "All year-over-year dimensions are capped at the five most recent years with events." (`from_source/gaps/19_practice_analytics.md:15`)

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/events/`
  - `methods.js` — `events.statistics` method
  - `server/util.jsx` — `_getEventsStatistics` raw event collector
- `app/imports/api/invoices/patientFileInvoices/`
  - `methods.js` — `invoices.statistics.earnings`
  - `server/util.js` — `_getEarningStatisticsFor` complex aggregation logic
- `app/imports/modules/riziv/`
  - `methods/methods.js` — `riziv.r-value.statistics`
  - `server/util.js` — `_getRValueStatistics` logic including R-waarde rules
- `app/imports/ui/pages/main/`
  - `MainDashboardPage.jsx` — Widget grid assembly
- `app/imports/ui/components/advanced-components/dashboard/`
  - `DashboardTop.jsx` — Weekly chart calculation logic
- `app/imports/ui/pages/financial/overview/`
  - `FinancialPage.jsx` — Financial dashboard assembly
  - `SessionOverview.jsx` — Doughnut chart client-side grouping
- `app/imports/ui/pages/practices/`
  - `PracticePatientFileStatistics.jsx` — Patient state tile logic
- `app/imports/startup/client/bootstrap/`
  - `chart.js` — Global Chart.js configuration and plugins

### Key symbols per file

- `EventsUtil.getEventsStatistics`: `events/server/util.jsx:247` — Returns raw events for a year grouped by month.
- `InvoiceUtil.getEarningStatisticsFor`: `invoices/patientFileInvoices/server/util.js:477` — Main revenue/receipt aggregator.
- `RizivUtil.getRValueStatistics`: `modules/riziv/server/util.js:56` — Aggregates R-waarde and nomenclature coverage.
- `getPatientFileCounts`: `patientFiles/methods.jsx:650` — Aggregates patient counts by state.
- `DoughnutController` override: `bootstrap/chart.js:22` — Custom drawing for text in center of doughnut.

### Discrepancies found vs HalingoDoc

- **R-waarde Multiplier:** `modules/riziv/server/util.js:53` shows that multiplication by `event.sessionCount` is commented out (`/* * event.sessionCount*/`), suggesting R-waarde is currently calculated per act rather than per session-unit, which may differ from some users' expectations of "Total R".
- **Dashboard Date Range:** `DashboardTop.jsx:22` confirms the helpdesk finding that it iterates Mon-Sat but uses a 7-day count subscription, leading to potential visual mismatches.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000/` (Local Meteor)
**Screens visited:** 4 (Dashboard, Financial, Practices, RIZIV)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/practice-analytics/`

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/` | Main Dashboard | NL | Welcome banner, Weekly "Afspraken" bar chart, widget tiles for Openstaande facturen and Meldingen. | `01-dashboard-owner.png` |
| 2 | `/financial` | Financial Overview | NL | "Inkomsten" bar chart, Earnings card (Revenue, Receipt, Commission), Year selector. | `02-financial-overview.png` |
| 3 | `/financial` | Session Overview Tab | NL | Three doughnut charts: Event Type, Location (Plaats), Price (Prijs). Drill-down table on right. | `03-session-overview.png` |
| 4 | `/practices` | Practices Overview | NL | Patient Statistics tile (Active/Inactive/Waitlist), Open Commission tile. Therapist filter. | `04-practices-overview.png` |
| 5 | `/riziv` | RIZIV Overview | NL | R-waarde tile, Nomenclature coverage tiles, Stacked bar chart of provisions. | `05-riziv-overview.png` |

### Behavior observed on staging

- **Chart Interactivity:** Doughnut charts in "Overzicht sessies" are interactive; clicking a slice updates the detail table on the right. Bar charts in Financial/RIZIV are less interactive (only update the summary card).
- **Empty States:** Charts show a "Geen gegevens beschikbaar" overlay when no data is present for the selected year/therapist.
- **Role Scoping:** The owner account sees data for all therapists in the practice, but can filter down to specific ones.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `analytics/weekly-activity` | Weekly appointment bar chart | docs + source + staging | `gaps/19_practice_analytics.md:30` | `DashboardTop.jsx:22` | `/` (01) | Client-side count of `events.week`. |
| 2 | `analytics/earnings-graph` | Revenue vs Receipt bar chart | docs + source + staging | `gaps/19_practice_analytics.md:55` | `util.js:477` | `/financial` (02) | Server-side aggregation. Stacked/Grouped bar. |
| 3 | `analytics/session-split` | Event type distribution doughnut | docs + source + staging | `gaps/19_practice_analytics.md:95` | `SessionOverview.jsx:155` | `/financial` (03) | Split by session/bilan/absent/other. |
| 4 | `analytics/session-location` | Session location distribution | docs + source + staging | `gaps/19_practice_analytics.md:115` | `SessionOverview.jsx:225` | `/financial` (03) | Grouped by `meta.location`. |
| 5 | `analytics/session-price` | Session price distribution | docs + source + staging | `gaps/19_practice_analytics.md:120` | `SessionOverview.jsx:243` | `/financial` (03) | Grouped by `event.price`. |
| 6 | `analytics/patient-states` | Practice-wide patient status counts | docs + source + staging | `gaps/19_practice_analytics.md:125` | `methods.jsx:650` | `/practices` (04) | Total/Active/Inactive/Waitlist. |
| 7 | `analytics/open-commission` | Unpaid practice commission tracker | docs + source + staging | `gaps/19_practice_analytics.md:135` | `methods.js:240` | `/practices` (04) | Sum and count of open commission invoices. |
| 8 | `analytics/riziv-r-waarde` | Practice-wide R-waarde sum | docs + source + staging | `gaps/19_practice_analytics.md:145` | `util.js:56` | `/riziv` (05) | Complex R-value mapping based on codes. |
| 9 | `analytics/riziv-coverage` | Nomenclature coverage stacked bar | docs + source + staging | `gaps/19_practice_analytics.md:165` | `util.js:96` | `/riziv` (05) | Provisions with vs without code. |
| 10| `analytics/latest-invoice` | Recent invoicing activity check | docs + source | `deprecation_list.md:#13` | `methods.js:841` | N/A | **DEPRECATED — DO NOT PORT.** Orphan method. |

### Feature detail — `analytics/earnings-graph`

- **Description:** A historical bar chart showing revenue (total price of sessions) vs receipts (actually paid amounts) per month for a selected year.
- **Found via:** `docs + source + staging`
- **Legacy source file(s):** `app/imports/api/invoices/patientFileInvoices/server/util.js:477-609`
- **HalingoDoc file(s):** `docs/from_source/gaps/19_practice_analytics.md:55`
- **Staging screen(s):** `/financial` (Screenshot `02-financial-overview.png`)
- **Belgian-specific concerns:** Correctly handles Third-Payer (Derdebetaler) split between patient amount and insurance amount.
- **QUIRK-PRESERVE candidates:** The "Open" value is a simple display-side subtraction of `receipt` from `revenue` and does not account for partial payments or credit notes in a robust way.

### Feature detail — `analytics/riziv-r-waarde`

- **Description:** Calculates the total "R-waarde" effort for the practice, which is a RIZIV-mandated metric where different nomenclature codes have different weight (e.g. 17.5, 35).
- **Found via:** `docs + source + staging`
- **Legacy source file(s):** `app/imports/modules/riziv/server/util.js:7-55`
- **HalingoDoc file(s):** `docs/from_source/gaps/19_practice_analytics.md:145`, `docs/from_source/features/r_waarden.md`
- **Staging screen(s):** `/riziv` (Screenshot `05-riziv-overview.png`)
- **Belgian-specific concerns:** Uses specific Belgian RIZIV rules for R-values, including the 2023-05-01 change for parental guidance collective sessions (ouderbegeleiding collectief) (17.5 -> 15).

---

## Cross-references to other areas

- **#11 Smart Invoicing:** Analytics consumes `patientFileInvoices` to compute earnings and open amounts.
- **#5 Multi-View Scheduling:** Dashboard activity chart is derived from the `events` collection.
- **#14 Mutualistic Billing:** Earnings receipt logic depends on knowing the state of insurance payments.
- **#8 Compliance Monitoring:** RIZIV R-waarde calculation depends on the nomenclature codes assigned during the compliance check.

---

## [NEEDS CLARIFICATION]

### Q1: Is the exclusion of `sessionCount` in R-waarde calculation intentional?
- **Why it matters:** Regulatory reporting might require R-waarde to be unit-based (R * sessions).
- **Sources conflict?** Source code has it commented out; HalingoDoc notes it as "R-waarde total".
- **What would resolve:** Domain expert confirmation.

### Q2: What happened to the "Print Overview" feature?
- **Why it matters:** There is a leftover i18n key `financial.printOverview` but no UI button.
- **Sources conflict?** HalingoDoc flags it as a missing export feature.
- **What would resolve:** Product owner confirmation on whether this was a removed feature or a failed start.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does the R-waarde historical transition (2023-05-01) need to be preserved for data older than 5 years?
- **Found in:** `app/imports/modules/riziv/server/util.js:23`
- **Why it matters:** Legacy caps stats at 5 years, but the new system might not. If older data is kept, the 2023 rule must remain.
- **What I know:** The rule reduced parental guidance collective session (ouderbegeleiding collectief) R-values from 17.5 to 15.
- **Resolution:** Invoke `logopedist-be` skill to verify if there are other such historical "cliffs" that Halingo legacy missed.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/from_source/gaps/19_practice_analytics.md
/home/tj/HalingoDoc/docs/from_source/features/r_waarden.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md

# Meteor source
/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/methods/methods.js
/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTop.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/FinancialPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/overview/SessionOverview.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticePatientFileStatistics.jsx
/home/tj/Repos/Halingo-Main/app/imports/startup/client/bootstrap/chart.js
```

---

## Verification notes (verbatim from `01-discovery/practice-analytics.verification.md`)

# Verification: Practice Analytics

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/practice-analytics.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "Halingo does not have a dedicated analytics module. What exists instead is inline statistics tiles, graphs and doughnut charts scattered across four existing screens." | `gaps/19_practice_analytics.md:10` | ✓ | Exact quote confirmed at line 8 of that file (the document has no line numbers but the content matches the Summary section verbatim). |
| 2 | "All year-over-year dimensions are capped at the five most recent years with events." | `gaps/19_practice_analytics.md:15` | ✓ | Confirmed at the same Summary section: "Five server-side aggregation methods power the entire analytics surface … All year-over-year dimensions are capped at the five most recent years with events." Source file also cross-references `events/methods.js:583`, `invoices/patientFileInvoices/methods.js:831`, `riziv/methods/methods.js:51`. |
| 3 | Five server-side aggregation methods: `events.statistics`, `invoices.statistics.earnings`, `invoices.statistics`, `riziv.r-value.statistics`, `invoices.open.statistics` | `gaps/19_practice_analytics.md` Summary | ✓ | Confirmed. HalingoDoc names: `events.statistics` (session counts by month/type), `invoices.statistics.earnings` (revenue/receipt/km/commission), `invoices.statistics` (latest invoice date only), `riziv.r-value.statistics` (R-waarde), `invoices.open.statistics` (open-bills publication). Plus two simpler per-collection methods (`patientFile.count`, `practice.commission.getOpenAmount`). Discovery correctly counts "five main" aggregation methods and separately notes the two simpler ones in the feature catalog. |
| 4 | Uses `chart.js@2.9.3` | `gaps/19_practice_analytics.md` Charts section | ✓ | Confirmed. HalingoDoc states: "The project uses `chart.js@2.9.3` with `react-chartjs-2@2.9.0`". |
| 5 | Custom DoughnutController override for center text at `bootstrap/chart.js:22` | `gaps/19_practice_analytics.md` Charts section | ✓ | Confirmed. HalingoDoc states "a doughnut controller override at `bootstrap/chart.js:22-65` supports centre-of-doughnut text and HTML overlays." |
| 6 | `analytics/weekly-activity` — client-side count of `events.week`, `DashboardTop.jsx:22` | `gaps/19_practice_analytics.md:30` | ~ | Content confirmed at HalingoDoc "Session count bar chart" section. Line 22 attribution: the actual source shows line 18 has the 6-day `days` array and line 22 has the `_.times(7, ...)` 7-day count. The discovery correctly references line 22 as the location of the problematic calculation. The HalingoDoc cites `DashboardTop.jsx:22-58` for the full calculation block. Minor inconsistency: the HalingoDoc calls the component `DashboardTop.jsx`, while the actual class is exported as `Dashboard` — not an error in the discovery, just a note. |
| 7 | `analytics/earnings-graph` — `server/util.js:477`, handles Third-Payer split | `gaps/19_practice_analytics.md:55` | ✓ | Confirmed by direct Meteor source read: `_getEarningStatisticsFor` begins at line 477. Third-Payer split confirmed at lines 531-535: `if (invoice.isThirdPayer ? event.getAmountPatient() : event.price)` and `if (invoice.getInsuranceState() === InvoiceInsuranceStates.PAID) receipt += (event.price - event.getAmountPatient())`. |
| 8 | "Open" value is naive subtraction (`revenue - receipt`) computed client-side | `gaps/19_practice_analytics.md:65` | ✓ | Confirmed. HalingoDoc explicitly states: "Derived 'Open' card value (shown in the detail card): `revenue - receipt`, computed client-side (`EarningsGraph.jsx:107-111`). There is no server-side 'open per year/month' metric — it is only a display subtraction." |
| 9 | `analytics/session-split` — `SessionOverview.jsx:155` | `gaps/19_practice_analytics.md:95` | ✓ | Confirmed. HalingoDoc states `_.groupBy(events, 'state')` split present vs absent at `state 1`/`state 2` at `SessionOverview.jsx:155`. |
| 10 | `analytics/session-location` — `SessionOverview.jsx:225` | `gaps/19_practice_analytics.md:115` | ✓ | Confirmed. HalingoDoc: "Metric: Same event bucket, grouped by `meta.location`. Labels come from `Events.getLocations()` (`SessionOverview.jsx:225-241`)." |
| 11 | `analytics/session-price` — `SessionOverview.jsx:243` | `gaps/19_practice_analytics.md:120` | ✓ | Confirmed. HalingoDoc: "grouped by `event.getPrice()` … `SessionOverview.jsx:243-261`." |
| 12 | `analytics/patient-states` — `methods.jsx:650` | `gaps/19_practice_analytics.md:125` | ✓ | Confirmed. HalingoDoc: "`patientFile.count` / `getPatientFileCounts` (`patientFiles/methods.jsx:650-714`)." |
| 13 | `analytics/open-commission` — `methods.js:240` | `gaps/19_practice_analytics.md:135` | ✓ | Confirmed. HalingoDoc: "`practice.commission.getOpenAmount` / `getOpenAmount` (`invoices/commissionInvoices/methods.js:240`)." |
| 14 | `analytics/riziv-r-waarde` — `util.js:56`, uses RIZIV rules including 2023-05-01 change (17.5→15 for group sittings) | `gaps/19_practice_analytics.md:145`, `features/r_waarden.md` | ✓ | Confirmed. Meteor source: `_getRValueStatistics` at `server/util.js:56`. `_getRValueForCode` at lines 7-38 with group-sitting date check `if (start < moment("2023-05-01")) return 17.5; else return 15;` confirmed at lines 18-23 of the actual source. |
| 15 | `analytics/riziv-coverage` — `util.js:96` | `gaps/19_practice_analytics.md:165` | ✓ | Confirmed. HalingoDoc: "`modules/riziv/server/util.js:96-98`" for withCode; "`server/util.js:99-101`" for withoutCode. Both confirmed in the actual source structure (lines 96-103 in the source). |
| 16 | `analytics/latest-invoice` — deprecated, no UI consumer, `methods.js:841` | `deprecation_list.md:#13` | ✓ | Confirmed. Deprecation list item #13 states: "`getInvoiceStatistics` and `latestInvoiceDate` — server methods defined, no UI consumer. Abandoned analytics feature." HalingoDoc gap file also confirms: "no component in `ui/` or `modules/` calls it." |
| 17 | DashboardTop Mon-Sat range with 7-day count bug | `bugs_and_security_findings.md` | ✓ | Confirmed. Bugs file entry: "`DashboardTop` Mon-Sat range with 7-day counts — busiest/quietest computation iterates Mon-Sat (6 days) but counts events for 7 days." Direct Meteor source confirms: line 18 `days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']` (6 elements), line 22 `_.times(7, ...)`. |
| 18 | R-waarde multiplier `event.sessionCount` is commented out at `server/util.js:53` | `r_waarden.md` Notable Details | ✓ | Confirmed. Direct Meteor source line 53: `return code ? _getRValueForCode(code, event.start) /* * event.sessionCount*/ : 0;` The comment is inside `_getRValueForEvent`, not inside `_getRValueForCode` as the function name in the discovery might imply, but the line number and effect are accurately described. |
| 19 | R-waarde RIZIV overview passes always `Meteor.userId()` — no therapist dropdown | `gaps/19_practice_analytics.md` Filters section | ✓ | Confirmed. HalingoDoc Filters section: "The RIZIV page does **not** expose a therapist dropdown — it always passes `Meteor.userId()` (`RizivPage.jsx:57`)." |
| 20 | `application_map.md` § 2, competency 19: "Practice Analytics" | `functional/application_map.md` | ✓ | Confirmed. The application map lists item 19 as "Practice Analytics: High-level financial and operational performance reporting." |

---

## Material omissions

Features or behaviors present in cited sources but not mentioned in the discovery file:

### O1 — `react-chartjs-2@2.9.0` dependency not mentioned (NOTE)
HalingoDoc's Charts section states the project uses "chart.js@2.9.3 **with `react-chartjs-2@2.9.0`**". The discovery mentions only `chart.js@2.9.3`. The React wrapper is the actual entry point used by components and may affect the porting decision (chart.js 4.x breaking-changes + react-chartjs-2 v5 API differences). Not a blocking omission but the spec author will need both version numbers.

### O2 — `GraphBoxWithCard` shared layout component not mentioned (NOTE)
HalingoDoc documents `GraphBoxWithCard` (`ui/components/advanced-components/GraphBoxWithCard/GraphBoxWithCard.jsx:50-186`) as the shared two-column layout used by both `EarningsGraph` and `RizivPageGraph`. The discovery file does not mention this shared component. Not load-bearing for feature behavior but relevant for the porting spec's component architecture notes.

### O3 — "Geen gegevens beschikbaar" empty-state overlay behavior not mentioned (NOTE)
HalingoDoc documents a global Chart.js plugin at `startup/client/bootstrap/chart.js:3-20` that draws a centered "Geen gegevens beschikbaar" overlay when all datasets are empty. The discovery covers the DoughnutController override at line 22, but does not mention the empty-state plugin at lines 3-20. This is a QUIRK-PRESERVE candidate: the new UI must replicate empty-state messaging for charts.

### O4 — RIZIV nomenclature code 700991/701002 not present in R-waarde dispatch table (CLARIFY)
The `logopedist-be` skill's reference `01-riziv-nomenclature-and-tariffs.md` documents a **new evaluation session code 700991/701002** introduced by A.R. 4.6.2024 (in force 1 August 2024), with R=35. This code was not yet in the nomenclature when the legacy Halingo codebase was written. The `_getRValueForCode` dispatch table in `server/util.js` does not include 700991/701002. Neither the discovery file nor HalingoDoc mention this gap. The spec author needs to know whether the new system should handle this code or whether it will remain out of scope pending a product decision.

### O5 — Notification count tile on home dashboard not cataloged as an analytics feature (NOTE)
HalingoDoc covers the notification count publication as part of the dashboard analytics surface. The discovery omits it from the 10-feature catalog. This is justified — the discovery correctly categorizes it as part of the in-app notifications area (#N) — but it should be flagged so the feature catalog stays consistent with the gap file's scope definition.

### O6 — Commission tab indicator on financial page not mentioned (NOTE)
HalingoDoc's "Open commission tile" section notes: "The `practice.commission.getOpenAmount` indicator also appears on the commission tab in the financial page." The discovery catalogs `analytics/open-commission` at the practices overview only. The financial page indicator may be a separate display instance that needs porting.

### O7 — `patientFile.count` total computation detail (NOTE)
HalingoDoc at "Patient-file counts tile" notes: "Total is computed client-side as `active + pending + inactive` (`PracticePatientFileStatistics.jsx:37`) — **note that this intentionally excludes any other state (e.g. `starting`) from the 'total'.**" The discovery file records the Total/Active/Inactive/Waitlist tiles but does not flag the intentional exclusion of the `starting` state from the total. This is a QUIRK-PRESERVE candidate.

---

## Cross-area reference check

| Cross-reference | Direction (analytics → other) | Other area mentions analytics? | Status |
|---|---|---|---|
| #11 Smart Invoicing — "Analytics consumes `patientFileInvoices`" | Accurate. The earnings graph and open-bills tile directly use the invoice collections. | Not found in `smart-invoicing.md`. | NOT BIDIRECTIONAL — NOTE only, other areas are not required to back-reference. |
| #5 Multi-View Scheduling — "Dashboard activity chart derived from `events`" | Accurate. The weekly bar chart and session-overview doughnuts consume the `events` collection. | Not found in `multi-view-scheduling.md`. | NOT BIDIRECTIONAL — NOTE only. |
| #14 Mutualistic Billing — "Earnings receipt logic depends on insurance payment state" | Accurate. The receipt branch in `_getEarningStatisticsFor` checks `invoice.getInsuranceState() === InvoiceInsuranceStates.PAID`. | Not found in `mutualistic-billing.md`. | NOT BIDIRECTIONAL — NOTE only. |
| #8 Compliance Monitoring — "R-waarde depends on nomenclature codes from compliance check" | Accurate. `_getRValueForEvent` resolves the code via `treatment.getCodeForEvent(event)`, which is set during treatment planning (compliance context). | Not found in `compliance-monitoring.md`. | NOT BIDIRECTIONAL — NOTE only. |

None of the four cross-references are bidirectional in the current discovery file set. This is expected at this stage of Phase 1 — other areas were discovered before this area and did not know to back-reference it. No finding raised; recorded for awareness. When the spec author works on these other areas, the analytics dependency should be noted in their specs.

---

## Domain review (logopedist-be)

### DR1 — R-waarde definition and regulatory significance

**Claim:** "R-waarde is a RIZIV-mandated metric where different nomenclature codes have different weight (e.g. 17.5, 35)."

**Skill verification:** CONFIRMED AND ENRICHED. The skill's `01-riziv-nomenclature-and-tariffs.md` confirms that the "R" column in the RIZIV tariff tables is described as "Waarde R (coefficient; always a fixed integer per act — 15, 17.5, 35 or 9)." The R-value is the RIZIV time-equivalent metric. The discovery correctly identifies the known weights. The skill also confirms that R-values differ per category/setting — a detail noted as "important" in the skill file ("A common bug is to apply the cabinet-R to a school-session honorarium. Store R-values tied to (setting, duration, type).") The legacy code's `_getRValueForCode` only maps R by code, not by setting — which is architecturally correct for the Halingo display use case (it is computing the R-coefficient from the code, not the euro honorarium). No blocker.

**Disposition:** PASS

### DR2 — The 2023-05-01 R-waarde change for group sittings (17.5 → 15)

**Claim:** "The 2023-05-01 R-waarde change for group sittings: group sitting R-values from 17.5 to 15."

**Skill verification:** CONFIRMED. The skill's reference file shows that codes 713016, 713112, 713215, 714011, 714114, 714210 currently have R=15 (as of the 2026 tariff circular). The 2023 change is the only date-conditional rule in the R-value computation. The skill's file `01-riziv-nomenclature-and-tariffs.md` shows code 713016 with current R=15. This is consistent with the legacy code: `if (start < moment("2023-05-01")) return 17.5; else return 15;`

**HOWEVER — critical label finding:** the Meteor source comment says "Group sitting" for these codes. The skill's reference confirms these codes (711012/113xxx/714xxx) are in fact **parental guidance** codes (ouderbegeleiding), not peer-group therapy sessions:
- 711012: "Parental guidance, individual, cabinet, 60 min (no patient present)"
- 713016: "Parental guidance, collective, cabinet, 90 min, 3–6 couples"

The discovery file propagates the Meteor comment's label "group sittings" without correction. For regulatory accuracy, the spec author must use "ouderbegeleiding collectief / guidance parentale collective" terminology, not "groepszitting / group sitting." This distinction matters for UI labeling and for understanding the regulatory context of the 2023 change. See finding V-practice-analytics-01.

**Disposition:** BLOCKER (label inaccuracy propagated from source comment)

### DR3 — Other historical R-waarde "cliffs" not in the legacy code

**Claim (NEEDS DOMAIN REVIEW):** "Does the R-waarde historical transition (2023-05-01) need to be preserved for data older than 5 years? Are there other historical 'cliffs' that the legacy missed?"

**Skill verification:** The skill's reference file `01-riziv-nomenclature-and-tariffs.md` states: "R-values update on 1 January every year (linear health-index indexation)." The annual indexation changes the **R-value** (euro conversion factor) but NOT the **R-coefficient** (the fixed integer per act — 15, 17.5, 35, 9). The discovery conflates these: the 2023-05-01 change was to the R-coefficient for group-sitting codes (17.5→15), not to the R-value (euro factor). This is the only coefficient change in the legacy code and the skill confirms it was the only one introduced in that period.

The skill also notes: "Other R-value changes (e.g. from a future RIZIV update) would require new branches with new date pivots." This confirms the code's architecture is correct — date pivots are baked in as code branches, not DB-stored.

Known cliff not in legacy code: **Code 700991/701002** (new evaluation session code, R=35, introduced 1 August 2024 by A.R. 4.6.2024). The legacy `_getRValueForCode` has no branch for this code. Its 6-digit code is 700991; `charAt(3)` is `9` which falls to the `default: return 0` case, so the legacy code would compute R=0 for this code even if used. This is a gap for the new system to address. See finding V-practice-analytics-02.

**Disposition:** CLARIFY (the 5-year cap question) + NOTE (700991 gap, see O4)

### DR4 — RIZIV formal reporting obligation for R-waarde

**Claim:** Discovery presents R-waarde as a practice self-monitoring metric.

**Skill verification:** The skill's references do not describe a formal RIZIV obligation for logopedists to self-report R-waarde totals. R-waarde totals are computed by RIZIV internally from the getuigschriften/verzamelstaten submitted by the practice. Halingo's R-waarde display is a convenience tracker, not a regulatory submission surface. The discovery correctly treats this as an analytics/monitoring feature. PASS.

**Disposition:** PASS

### DR5 — 5-year historical analytics cap vs 30-year clinical retention obligation

**Claim:** "5-year cap on historical data" (referring to the analytics display cap in the UI).

**Skill verification:** The skill confirms 30-year clinical record retention under art. 35 Kwaliteitswet, 10-year billing record retention under accounting law. The discovery's "5-year cap" refers to the analytics display cap in the UI (the year-selector dropdown populates only from the 5 most recent years with events). This is a UI limitation, not a data-deletion policy. The discovery does not claim that data older than 5 years is deleted. No conflict. However, the spec author should be alerted that the new system's analytics display cap and data retention policy must remain separate design decisions. The new system may choose to retain data beyond 5 years and allow access to older analytics.

**Disposition:** PASS (no false claim; CLARIFY added to flag the design decision for the spec author — see V-practice-analytics-04)

---

## Escalated source checks (Step C)

Three claims verified directly against Meteor source files:

### SC1 — R-waarde utility: commented-out `sessionCount` multiplier (util.js lines 7-56)
**Claim:** "multiplication by `event.sessionCount` is commented out (`server/util.js:53`)"
**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/server/util.js` lines 1-113.
**Finding:** CONFIRMED. Line 53: `return code ? _getRValueForCode(code, event.start) /* * event.sessionCount*/ : 0;` The comment is inside `_getRValueForEvent` (lines 40-54), not inside `_getRValueForCode` (lines 7-38). The discovery's claim that the function is at `util.js:7-55` is correct (the range covers both functions). The 2023-05-01 date check is at lines 18-23 (discovery claims "line 23" for the date check — slightly off, the check spans lines 18-23, but not a material error). The full R-value code table (`_getRValueForCode`) occupies lines 7-38 exactly as described.

**Additional finding from source read:** The `_getRValueForEvent` function has a guard `!event.hasPayBack` that returns 0. This means events where `hasPayBack` is false contribute zero R-waarde. HalingoDoc (`r_waarden.md`) documents this correctly. The discovery file does not mention the `hasPayBack` guard — this is a CLARIFY for the spec author: the new R-waarde calculation must preserve the `hasPayBack` gate.

**Verdict:** CONFIRMED with minor note. See finding V-practice-analytics-03.

### SC2 — DashboardTop Mon-Sat / 7-day mismatch bug (DashboardTop.jsx line 22)
**Claim:** "DashboardTop.jsx:22 confirms the helpdesk finding that it iterates Mon-Sat but uses a 7-day count subscription, leading to potential visual mismatches."
**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/ui/components/advanced-components/dashboard/DashboardTop.jsx` lines 1-67.
**Finding:** CONFIRMED. Line 18: `const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']` — 6 days. Line 22: `const values = _.times(7, (idx) => Events.find({...}).count())` — 7 iterations. The 7th value (index 6 = Sunday) is computed but not labeled in the `labels` array derived from `days`. The `DashboardTopEventChart` receives both arrays — the chart rendering would show 7 bars but the x-axis would only have 6 labels (or an empty label for the 7th bar). The visual mismatch is real. The `busiest/quietest` logic uses `days.indexOf(val)` as the index into `values`, so Sunday's count (index 6) is never considered for busiest/quietest computation. 

**Verdict:** CONFIRMED exactly as described.

### SC3 — Earnings aggregation with Third-Payer split (`_getEarningStatisticsFor` line 477)
**Claim:** "`_getEarningStatisticsFor` complex aggregation logic and the Third-Payer split handled in earnings graph"
**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/util.js` lines 477-609.
**Finding:** CONFIRMED. Function begins at line 477. Third-Payer split logic at lines 529-543: `if (invoice.isThirdPayer ? event.getAmountPatient() : event.price)` for patient portion, and `if (invoice.getInsuranceState() === InvoiceInsuranceStates.PAID) receipt += (event.price - event.getAmountPatient()) / 100` for insurance portion. Administration costs handled at lines 551-571, uninvoiced events at lines 573-593, commission at lines 595-607.

**Additional finding:** The commission selector at line 595 has no `status` filter — it includes ALL commission invoices for the practice/year including open ones, not just paid ones. HalingoDoc confirms this: "Iterate `CommissionInvoices.find({practiceId, date: {$gte, $lt}, userId?})`" with no status filter. The discovery correctly notes commission is in the earnings graph; it does not claim commission represents only paid commission. No error. But the spec author should note this means commission in the earnings chart is "accrual" style (billed, not paid). This aligns with the `getAmount()` computation which returns the billed amount.

**Verdict:** CONFIRMED. One additional nuance worth noting in the spec (commission is billed-amount, not paid-amount).

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-practice-analytics-01 | BLOCKER | domain / label | Discovery file propagates the Meteor source comment's label "group sittings" for codes 713016/713112/713215/714011/714114/714210. These are in fact **parental guidance collective sessions** (ouderbegeleiding collectief / guidance parentale collective) — sessions with the parents in absence of the child, max 90 min, 3-6 couples. The 2023-05-01 R change (17.5→15) applied to this parental-guidance collective category, not to peer-group therapy. The spec author must use correct RIZIV terminology. If UI labels are ported with "group session" wording, they will misrepresent the session type to therapists. | Correct in Phase 2 spec authoring. |
| V-practice-analytics-02 | CLARIFY | domain / omission | Code 700991/701002 (new "evaluatiezitting" introduced 1 August 2024, R=35) is not in the legacy `_getRValueForCode` dispatch table. Its code passes to the `default: return 0` branch, so the legacy system silently attributes R=0 to this session type. The new system needs a product decision: (a) add the code to the dispatch table, (b) document it as out of scope pending full nomenclature sync, or (c) make the dispatch table data-driven. This is a NEEDS CLARIFICATION for the spec. Added to NEEDS CLARIFICATION backlog. | Add to Phase 2 NEEDS CLARIFICATION. |
| V-practice-analytics-03 | CLARIFY | omission | The `hasPayBack: false` guard in `_getRValueForEvent` means events without payback entitlement contribute zero R-waarde, regardless of their nomenclature code. HalingoDoc documents this; discovery does not. The spec for `analytics/riziv-r-waarde` must include this guard as a required behavior. | Add to Phase 2 feature detail spec. |
| V-practice-analytics-04 | CLARIFY | domain | The 5-year analytics display cap and the 30-year clinical data retention requirement are separate design decisions. The discovery correctly describes the UI cap but does not alert the spec author that the new system's analytics could expose older data (since clinical records must be retained for 30 years). The spec author should explicitly decide whether the 5-year UI cap should be lifted, preserved, or made configurable. | Add to Phase 2 NEEDS CLARIFICATION. |
| V-practice-analytics-05 | NOTE | omission | `react-chartjs-2@2.9.0` is missing from the discovery's library catalog. HalingoDoc documents it alongside chart.js. The porting spec will need both packages. | Note in spec preamble. |
| V-practice-analytics-06 | NOTE | omission | The global "Geen gegevens beschikbaar" Chart.js empty-state plugin (at `bootstrap/chart.js:3-20`) is documented in HalingoDoc but not in the discovery. This is a QUIRK-PRESERVE candidate for the new UI. | Note in spec QUIRK-PRESERVE section. |
| V-practice-analytics-07 | NOTE | omission | `patientFile.count` total intentionally excludes the `starting` state — total = `active + pending + inactive`. Discovery catalogs the tile but not this QUIRK-PRESERVE detail. | Note in spec QUIRK-PRESERVE section. |
| V-practice-analytics-08 | NOTE | cross-area | None of the four cross-references (#11, #5, #14, #8) are bidirectional in the current discovery file set. The referenced areas' discovery files do not mention the analytics area as a consumer. Not a blocker — cross-references in a discovery file are from this area's perspective. | No action required; spec authors for those areas should reference analytics as a consumer. |
| V-practice-analytics-09 | NOTE | citation | Commission in the `analytics/earnings-graph` is billed-amount (accrual) not paid-amount. The commission selector has no status filter. HalingoDoc confirms but the discovery description of the commission tile ("Sum and count of open commission invoices" for `analytics/open-commission`) could be confused with the earnings graph's commission line. The two commission metrics are different: one is the earnings-graph accrual total, the other is the open-invoice count/sum for the practices tile. The discovery correctly catalogs them as separate features but the spec author should be explicit about this distinction. | Clarify in Phase 2 spec. |

---

## Recommendation

**PROCEED to Phase 2 with fixes for the BLOCKER.**

The discovery file is well-researched, accurately cites its sources, and correctly catalogs the 10 features in scope. The Meteor source checks confirm the three escalated claims exactly. The HalingoDoc alignment is strong.

**One BLOCKER must be addressed before the spec author writes scenario Gherkin for `analytics/riziv-r-waarde`:** the "group sittings" label (V-practice-analytics-01) is factually wrong — these are parental guidance collective sessions. The spec author must use correct terminology and must understand the correct regulatory context when writing the R-waarde feature spec.

The two CLARIFY items (V-practice-analytics-02 and V-practice-analytics-04) should be promoted to the area's NEEDS CLARIFICATION backlog and resolved with the product owner before Phase 2 spec authoring for `analytics/riziv-r-waarde`.

The five NOTE items are minor quality improvements that the spec author should incorporate without blocking progress.

The existing NEEDS CLARIFICATION entries in the discovery (Q1 re sessionCount exclusion, Q2 re Print Overview) remain valid and unresolved — they should carry forward to Phase 2 as-is.
