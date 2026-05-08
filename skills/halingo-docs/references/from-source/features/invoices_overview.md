# Invoices overview

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for the patient and Verzamelstaat surfaces, partial for commission, none for SaaS / Stripe invoices — see `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

Halingo's `invoices/` API module is a **compound module** of five independent sub-modules, each backed by its own MongoDB collection, its own state machine, and its own UI surface. The compound name is misleading: the five "invoices" share almost no schema and almost no code paths. They are grouped only because they all answer the question "money owed".

The five sub-modules:

| Sub-module | Collection | What it represents | Drives |
|---|---|---|---|
| `patientFileInvoices` | `invoices` | Invoice from a logopedist (or practice) to a *patient* for sessions delivered | The familiar B2C *factuur* |
| `insuranceInvoices` | `insuranceInvoices` | Verzamelstaat — batched derdebetaler claim from the practice to a Ziekenfonds | Grouped reimbursement claims |
| `commissionInvoices` | `commissionInvoices` | Internal monthly settlement from a group practice to one of its associated therapists | Practice payroll |
| `stripeInvoices` | `stripeInvoices` | Halingo's own SaaS subscription invoice to a praktijk customer | Halingo's revenue |
| `payments` | *(no collection — has `methods.jsx` of zero bytes)* | Stripe payment-source orchestration glue between `stripeInvoices` and `practice/server/util.tsx` | The Stripe webhook plumbing for the SaaS side |

> ⚠️ The `payments/` sub-module has an empty `methods.jsx` (`app/imports/api/invoices/payments/methods.jsx` is 0 bytes) and a `util.js` whose only `_createInvoice` function is for *stripe* invoices, not for patient payments. The "payments" name is a leftover and the actual SaaS-payment logic lives in `app/imports/api/practice/server/util.tsx` (`_createSourceForInvoice`, `_chargeSource`, `_setInvoiceStateFromCharge`).

The **collection name `invoices`** in MongoDB is `patientFileInvoices`, not `stripeInvoices`. The Stripe collection lives under `stripeInvoices`. This naming is the most confusing thing in the module — be careful when reading queries.

## Where it lives in the UI

| Surface | Path | What it shows |
|---|---|---|
| Financial overview page | `/financial` (`startup/client/routes/financial.js:17`) | Tabs: patient invoices, Verzamelstaten, commissions, sessions |
| Single patient invoice | `/financial/invoices/patient/:invoiceId` (`financial.js:29`) | Detail + print + cancel |
| Single Verzamelstaat | `/financial/invoices/insurance/:invoiceId` (`financial.js:41`) | Detail + state |
| Single commission statement | `/financial/invoices/commission/:invoiceId` (`financial.js:53`) | Print |
| Patient-file scoped invoice | `/patients/:patientId/invoices/:invoiceId` (`patientFile.js:113`) | Same `PatientInvoicePageContainer`, scoped under the dossier breadcrumb |
| SaaS subscription invoices | `/practices/subscription` and `/practices/invoices/:id/payment` (`practice.jsx:78`, `practice.jsx:114`) | Stripe / SaaS billing |
| Open-bills widget | `OpenBillsWidget.jsx` (`modules/invoices/OpenBillsWidget.jsx`) | Dashboard tile, fed by the `invoices.open.statistics.sum` and `invoices.open.statistics.count` count publications |

The financial overview page is `app/imports/ui/pages/financial/overview/FinancialPage.jsx` and uses `app/imports/ui/pages/financial/overview/FinancialPageTabs.jsx:54-89` to assemble the tabs. The tabs are conditional: the **commission** tab only renders if the active therapist `hasToPayCommission`, has any historical commission invoices, or the user has `practice.commission.view` (`FinancialPageTabs.jsx:75-83`).

## Module dependencies between the five

The sub-modules are not as independent as the directory layout suggests. The dependency arrows are:

```
events.invoiceId           ──▶  patientFileInvoices  ──▶  insuranceInvoices  (via certificates[].insuranceInvoiceId)
                                       │
                                       └─▶  emails  (PATIENT_INVOICE / PATIENT_INVOICE_REMINDER rows)

events.commissionInvoiceId ──▶  commissionInvoices  (rebuilt automatically by event hooks)

stripeInvoices             ◀──  Stripe webhooks (handled in api/payments/server/stripe.ts)
                            ◀── practice.invoices.pay  (manual one-off via payment intent)
```

Key cross-references:

- `Events.invoiceId` (`app/imports/api/events/events.jsx:1256-1260`) is set when a patient invoice is generated and **unset** when the invoice is cancelled (`patientFileInvoices/methods.js:622`). The Events collection's `remove()` is overridden to refuse deletion of an event that has an `invoiceId` (`events.jsx:9-12`).
- `Events.commissionInvoiceId` (`events.jsx:1251-1255`) is set when a commission invoice is generated and unset when the commission invoice is removed (`commissionInvoices/methods.js:228-232`).
- `PatientFileInvoices.certificates.$.insuranceInvoiceId` (`patientFileInvoices.js:85-89`) links a single getuigschrift on a patient invoice into the Verzamelstaat that has aggregated it. The link is what blocks cancellation of the patient invoice if it has been folded into a non-cancelled Verzamelstaat (`PatientFileActions.jsx:144-166`).
- `stripeInvoices` is created by `StripeInvoicesUtil.createInvoice` (`api/invoices/payments/server/util.js:5-25`), which is called from the Stripe webhook handlers in `api/payments/server/stripe.ts:51-225`.

## The five invoice types side-by-side

| Property | patientFileInvoices | insuranceInvoices | commissionInvoices | stripeInvoices |
|---|---|---|---|---|
| Collection name | `invoices` | `insuranceInvoices` | `commissionInvoices` | `stripeInvoices` |
| State machine | `open` → `unpaid` / `partially_paid` / `printed` / `mailed` / `paid` (+ `void` + `isCanceled`) | `open` → `printed` → `paid` (+ `canceled`) | `open` → `paid` | `open` / `pending` / `paid` / `failed` / `closed` |
| Defined in | `patientFileInvoices.js:13-26` | `insuranceInvoices.js:11-16` | `commission.jsx:9-12` | `stripeInvoices.jsx:226-232` |
| Numbering scope | Per-praktijk, sequential, monotonic (`practice.invoiceNumber`) | Per-praktijk, shares the same `practice.invoiceNumber` counter | None — keyed by `(userId, practiceId, date=startOfMonth)` | Globally sequential — `nextInvoiceNumber()` finds max in collection |
| Where the number is generated | `server/util.js:164` | `server/util.js:153, 187` | n/a | `stripeInvoices.jsx:8-11` |
| Currency | EUR (cents, all amounts × 100) | EUR (cents) | EUR (cents) | Multi-currency via `stripeInfo.currency` |
| Has certificates | Yes — one per `(treatmentId, bilanId)` | Yes — copied from patient invoices, plus `SSN` and `nbOfEvents` | No | No |
| Has structured announcement | Yes (`structuredAnnouncement`) | Yes (`structuredAnnouncement`) | No | No |
| Bulk-generate flow | `createInvoiceByEventIds` over selected events | `generateInvoices` from all open derdebetaler patient invoices | `generateCommissionInvoices` over all commissioned PracticeUsers | n/a — driven by Stripe |
| Mail to recipient | `mailInvoice` (`methods.js:568`) | None | None | None (printed only) |
| Print PDF action | `printInvoice` (sets state) + browser print of `InvoiceTemplate*` | `printInvoice` (sets state) + browser print of `InsuranceInvoicePrint` | Browser print of `CommissionInvoicePrint` | REST endpoint `/api/invoice/stripe/:id/pdf` (`stripeInvoices/server/rest.js:12`) |
| Cancellation behaviour | Sets `isCanceled: true`, unsets `events.invoiceId` for linked events | Sets `state: canceled`, unsets `insuranceInvoiceId` and `insuranceInvoiceState` on every embedded certificate | `Events.update(... $unset: { commissionInvoiceId })` then `CommissionInvoices.remove(...)` | n/a in Halingo (Stripe-side) |

## Permissions matrix

Permissions are role-mapped in `app/imports/api/practiceUsers/practiceUsers.jsx:8-153`. The relevant entries for invoicing:

| Permission | owner | admin | default (lid) |
|---|---|---|---|
| `invoices.generate` | yes | yes | own only |
| `invoices.edit` | yes | yes | own only |
| `invoices.view` | yes | yes | own only |
| `invoices.statistics` | yes | yes | no |
| `invoices.statistics.earnings` | yes | yes | no |
| `invoices.insurance.add.all` | yes | yes | no |
| `invoices.insurance.cancel` | yes | yes | no |
| `invoices.insurance.edit` | yes | yes | no |
| `invoices.insurance.print` | yes | yes | no |
| `invoices.insurance.view` | yes | yes | no |
| `invoices.commission.view` | yes | yes | no |
| `practice.commission.generate` | yes | yes | no |
| `practice.commission.update.amount` | yes | yes | no |
| `practice.commission.update.state` | yes | yes | no |
| `practice.commission.remove` | yes | yes | no |
| `practice.invoices.view` | yes | yes | no |
| `practice.invoices.pay` | yes | yes | no |

A *lid* (default role) can therefore generate, view and edit **only their own** patient invoices and Verzamelstaten and cannot see SaaS billing at all. An owner or admin can act on behalf of any therapist in the practice via the `userId` parameter on every method.

## Earnings statistics

`getEarningStatisticsFor` (`patientFileInvoices/methods.js:778`) returns a per-month breakdown for up to 5 years, fed to `EarningsGraph` (the analytics deep-dive covers the graph itself). The math is in `server/util.js:477-610` and aggregates four streams:

1. **Invoiced events** — events on a `patientFileInvoices` document, one row per event. Revenue counts always; receipt only counts if `state === PAID` for the patient share, plus if `getInsuranceState() === PAID` for the insurance share (`server/util.js:529-536`).
2. **Administration cost** — added to revenue at invoice creation date; added to receipt only when invoice state is PAID (`server/util.js:551-571`).
3. **Uninvoiced events** — events with no `invoiceId` are still counted as revenue but not as receipt (`server/util.js:573-593`).
4. **Commission invoices** — counted into a separate `commission` bucket from `CommissionInvoices.find(...)` (`server/util.js:595-607`).

All amounts are stored as integer cents and divided by 100 in the aggregator.

## What is *not* in this module

- **A patient-side payment portal** — no patient login route exists; the `setState` mutation flips an invoice to `paid` only after manual confirmation by the therapist (or by Stripe webhook for SaaS invoices).
- **Tariff version tracking** — `Events.getPrices(event)` (`events.jsx:244`) is a giant in-memory cascade of `if (start < moment("YYYY-MM-DD")) return { ... }` blocks. There is no tariff collection, no tariff editor, no per-praktijk override (the practice-settings form has an `ownTariffs` switch in `lib/formSchemas/practices/accessibility.jsx:50` but it is **not bound** to any field on the Practices schema and has no consumer in the codebase). See `./tariff_indexation.md`.
- **Per-praktijk invoice comments** with a separate per-dossier override. The practice has `settings.invoices.remark` (`practices.jsx:85`) and the user has `settings.invoices.personalNote` (`users.jsx:138-141`); the dossier's `extraInfo` field (`patientFiles.jsx:163`) is generic notes and is **not** consumed by any invoice template. See `./patient_invoices.md`.
- **GDPR / data retention** for invoices.

## Helpdesk overlap

The Zendesk export covers patient invoice generation, Verzamelstaat creation, certificate printing on a matrix printer and commission setup at the prose level. None of the helpdesk articles cover:

- The exact state machine and `partially_paid` state.
- The communication-structure formats (`FULLNAME-MONTH-NUMBER`, etc.).
- The relationship between `patientFileInvoices.certificates.$.insuranceInvoiceState` and the parent `InsuranceInvoices.state`.
- The de-conventionering price discount applied after `2024-04-01` (`server/util.js:152-158`).
- The administration cost flow.
- The Stripe SaaS invoice numbering rules.
- The R-waarde nomenclature math (`modules/riziv/server/util.js:7-38`).

## Source files

### API
- `app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js` — schema, helpers, filters, sort options.
- `app/imports/api/invoices/patientFileInvoices/methods.js` — 13 Meteor methods.
- `app/imports/api/invoices/patientFileInvoices/server/util.js` — invoice creation, certificate generation, mail-out, earnings stats.
- `app/imports/api/invoices/patientFileInvoices/server/publications.js` — `patientFileInvoice`, `uninvoicedEvents`, `invoices.open.statistics`.
- `app/imports/api/invoices/patientFileInvoices/server/indexes.js` — indexes on `userId`, `practiceId`, `removed`.
- `app/imports/api/invoices/insuranceInvoices/insuranceInvoices.js` — schema, states.
- `app/imports/api/invoices/insuranceInvoices/methods.js` — generate, set state, edit announcement, print, cancel.
- `app/imports/api/invoices/insuranceInvoices/server/util.js` — Verzamelstaat aggregation logic.
- `app/imports/api/invoices/insuranceInvoices/server/publications.js`.
- `app/imports/api/invoices/commissionInvoices/commission.jsx` — schema, types, states.
- `app/imports/api/invoices/commissionInvoices/methods.js` — generate, search, update amount, update state, remove, getOpenAmount, hasCommissionInvoices.
- `app/imports/api/invoices/commissionInvoices/util.js` — `_computeAmount` for percentage / fixedAmount / per-disorder.
- `app/imports/api/invoices/commissionInvoices/server/util.js` — event-level commission tracking on insert/update/remove.
- `app/imports/api/invoices/commissionInvoices/server/hooks.js` — debounced `_cachedAmount` recompute.
- `app/imports/api/invoices/commissionInvoices/server/publications.js`.
- `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx` — schema, custom collection class with auto-numbering.
- `app/imports/api/invoices/stripeInvoices/server/rest.js` — `/api/invoice/stripe/:id/pdf` and `/state` REST endpoints.
- `app/imports/api/invoices/payments/server/util.js` — `StripeInvoicesUtil.createInvoice`, called from Stripe webhook.
- `app/imports/api/invoices/payments/server/publications.jsx` — `invoice` and `pending_invoices`.
- `app/imports/api/payments/server/stripe.ts` — Stripe webhook event router.

### UI
- `app/imports/ui/pages/financial/overview/FinancialPage.jsx`
- `app/imports/ui/pages/financial/overview/FinancialPageTabs.jsx`
- `app/imports/ui/pages/financial/invoice/FinanceInvoicePanel.jsx`
- `app/imports/ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx`
- `app/imports/modules/invoices/AddInvoiceModal.jsx`
- `app/imports/modules/invoices/InvoiceState.jsx`
- `app/imports/modules/invoices/OpenBillsWidget.jsx`
- `app/imports/modules/invoices/OpenBillsWidgetContainer.jsx`
- `app/imports/modules/invoices/patient/...` — see `./patient_invoices.md`
- `app/imports/modules/invoices/insurance/...` — see `./insurance_invoices.md`
- `app/imports/modules/invoices/commission/...` — see `./commission_invoices.md`
- `app/imports/modules/invoices/stripe/StripeInvoicePrint.jsx`

### Routes
- `app/imports/startup/client/routes/financial.js`
