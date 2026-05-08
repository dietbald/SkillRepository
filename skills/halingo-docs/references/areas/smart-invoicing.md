# Smart Invoicing

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Patient invoice generation, lifecycle, certificates, commissions, financial overview.

## Spec contracts (Phase 2)

- **certificate-management** — Feature: smart-invoicing/certificate-management
  - Path: `02-specs/smart-invoicing/certificate-management/spec.md`
- **commission-invoicing** — Feature: smart-invoicing/commission-invoicing
  - Path: `02-specs/smart-invoicing/commission-invoicing/spec.md`
- **financial-overview** — Feature: smart-invoicing/financial-overview
  - Path: `02-specs/smart-invoicing/financial-overview/spec.md`
- **invoice-delivery** — Feature: smart-invoicing/invoice-delivery
  - Path: `02-specs/smart-invoicing/invoice-delivery/spec.md`
- **patient-invoice-generation** — Feature: smart-invoicing/patient-invoice-generation
  - Path: `02-specs/smart-invoicing/patient-invoice-generation/spec.md`
- **patient-invoice-lifecycle** — Feature: smart-invoicing/patient-invoice-lifecycle
  - Path: `02-specs/smart-invoicing/patient-invoice-lifecycle/spec.md`
- **verzamelstaat** — Feature: smart-invoicing/verzamelstaat
  - Path: `02-specs/smart-invoicing/verzamelstaat/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/smart-invoicing.md`)

# Phase 1 Discovery — Area #11 Smart Invoicing (RE-DISCOVERY)

**Area definition:** Compound invoicing module for Belgian logopedist practices: patient invoices (B2C facturen), insurance invoices (Verzamelstaten / derdebetaler claims to Ziekenfondsen), therapist commission invoices (internal practice payroll), certificates (getuigschriften voor verstrekte hulp), structured announcements (vrije mededeling), and financial analytics.

**Competency #11** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent (re-discovery after BLOCKER verdict on first pass).

**Why re-discovery:** The first discovery captured ~10-15% of the area's features and contained a factual error on structured announcements. Verification report at `smart-invoicing.verification.md` lists 9 BLOCKER-level findings. This is a complete replacement.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what is in `Halingo-MonoRepo/`, `libs/backend/*`, or any Nx-side symbol.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/invoicing_finances.md` | 1124 | full | Certificate margin tuning, reimbursement alarms, invoice mailing, Verzamelstaat prose, EPSON LX-350 reference, 22 NL articles. |
| Curated | `functional/application_map.md` | — | § 2 competency 11 | Formal area definition. |
| Code-derived | `from_source/features/invoices_overview.md` | 172 | full | **Compound module architecture** (5 sub-modules), dependency arrows, shared `practice.invoiceNumber` counter, earnings statistics, session overview, 16-permission matrix, tab conditional logic. |
| Code-derived | `from_source/features/patient_invoices.md` | 434 | full | **Core patient invoice module**: 20+ schema fields, certificate sub-document, 14 Meteor methods, 10-step generation pipeline, `_generateCertificates` algorithm, state machine (6 patient states + 3 insurance states + void + isCanceled), structured announcement 4 formats, de-conventioned discount, INITIAL_BILAN expansion, 15+ helpers, filters, sort options, publication channels, mail flow, cancellation. |
| Code-derived | `from_source/features/insurance_invoices.md` | 282 | full | **Verzamelstaat module**: per-fund vs per-patient grouping, state propagation via `arrayFilters`, shared invoice numbering, certificate sub-document, SSN requirement, generation flow, 7 methods, cancellation non-destructive. |
| Code-derived | `from_source/features/commission_invoices.md` | 345 | full | **Commission module**: event-hook-driven auto-rebuild, 3 commission types (none/fixedAmount/percentage), per-disorder overrides (`specificAmounts`), `_cachedAmount` debouncer, `_computeAmount` isomorphic util, 7 methods, event-hook integration, fixed-amount empty-month creation, PAID-row mutation gap. |
| Code-derived | `from_source/features/certificate_printing.md` | 279 | full | **Certificate printing**: manual vs printer modes, 484x1311 px coordinate system, per-browser fudge factors, EPSON LX-350 reference, cash toggle, `*0*` notation, duplicate detection, `therapistInformation` toggle, video consultation extra code 792433, certificate state vs invoice state independence. |
| Code-derived | `from_source/features/financial_overview.md` | 186 | full | **Financial page**: earnings graph (revenue/receipt/km/commission), 4 tabs (Facturen/Verzamelstaatfacturen/Commissie/Overzicht sessies), therapist picker, session overview doughnuts, no CSV export. |
| Code-derived | `from_source/features/payment_reconciliation.md` | 219 | full | **Payment reconciliation**: 4 paths (manual patient, manual insurance cascade, manual commission, Stripe webhook), dual-track patient/insurance state, `isPaid` aggregate derivation, no transaction ledger, `partially_paid` is manual flag only, open-bills widget. |
| Code-derived | `from_source/features/pdf_generation.md` | 66 | full | `html-pdf` / PhantomJS pipeline, fiber-blocking, no headless-Chrome. |
| Cross-cutting | `from_source/deprecation_list.md` | 184 | full | **#13:** `getInvoiceStatistics` / `latestInvoiceDate` — abandoned, DO NOT PORT. **#18:** `practices.settings.invoices.locale` — deprecated, user locale is canonical. **#22:** `Events.getPrices()` cascade stays as-is for migration (tariffs to DB deferred). |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | 158 | full | `commissionInvoice` publication selector overwrites instead of `$or`-ing (functional bug). `pdf.generate` accepts arbitrary HTML with no admin check (security). |
| Cross-cutting | `from_source/open_questions.md` | 158 | Q11, Q15, Q25, Q27 | Q11: structured announcement uses user locale (confirmed correct). Q15: `getInvoiceStatistics` abandoned. Q25: practice locale deprecated. Q27: per-disorder commission overrides confirmed in active use. |

### What HalingoDoc covers for this area

HalingoDoc provides **exceptional coverage** of this area — the `from_source/features/` layer has 7 dedicated files totaling ~1700+ lines with file:line citations to every schema field, method, helper, and UI component. The code-derived documentation captures:

- The full compound module architecture (5 sub-modules, their dependencies, shared counters)
- Complete data models for all 3 non-Stripe invoice types plus certificate sub-documents
- All 28+ Meteor methods across the 3 sub-modules with parameter schemas and business logic
- The 10-step invoice generation pipeline and the `_generateCertificates` algorithm
- The complete state machines for patient invoices (6 states + void + isCanceled), insurance invoices (4 states), and commission invoices (2 states)
- The dual-track patient/insurance state propagation via `arrayFilters`
- The earnings statistics aggregation algorithm with 4 revenue streams
- The certificate rendering coordinate system and per-browser print offsets

The helpdesk (`full_documentation/invoicing_finances.md`, 1124 lines) covers the happy-path user flows for certificate margin tuning, invoice mailing, and Verzamelstaat creation, but omits all state-machine detail, structured-announcement formats, de-conventioned pricing, and the certificate-Verzamelstaat eligibility relationship.

### What HalingoDoc does NOT cover

- The `void` state: allowed by schema, rendered as "ONGELDIG" overlay, present in filters, but no method sets it. Likely a manual-DB-edit admin path.
- How `isPaid` auto-recomputation works after a Verzamelstaat cascade (it does NOT — the cascade updates `insuranceInvoiceState` but does not recompute `isPaid` on the parent invoice, creating a reconciliation gap).
- Event removal handler for commission invoices is wired but appears partially disabled (`// TODO: RE-ENABLE` comment).
- The `getInsuranceState()` worst-case computation returns the state with the **minimum** index in the `InvoiceStates` enum, meaning `open` outranks `paid`.

### Direct citations worth preserving

> From `from_source/features/patient_invoices.md` (structured announcement):
> "The 'vrije mededeling' placed on the bottom of the invoice. Format depends on `practice.settings.invoices.communicationStructure`." The four formats are `FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE` — free-text convenience labels using patient name, date, and invoice number. **NOT the Belgian bank OGM format (`+++XXX/XXXX/XXXXX+++`).**

> From `from_source/features/patient_invoices.md` (de-conventioned discount):
> "if the event date is after `2024-04-01`, the user's `profile.isDeconventioned === true`, the treatment is *not* supplementary-insurance, and the patient does *not* have increased reimbursement, then `pricePatient = price - Math.ceil(prices.payback * 0.75)`"

> From `from_source/features/invoices_overview.md` (compound module):
> "Halingo's `invoices/` API module is a **compound module** of five independent sub-modules, each backed by its own MongoDB collection, its own state machine, and its own UI surface. The compound name is misleading: the five 'invoices' share almost no schema and almost no code paths."

> From `from_source/features/insurance_invoices.md` (shared counter):
> "The `practice.invoiceNumber` counter is shared between patient invoices and Verzamelstaten. A practice with 30 patient invoices and 5 Verzamelstaten will have `invoiceNumber = 35`."

---

## Source 2 — Meteor source slice

### Files read (30 total)

- `app/imports/api/invoices/patientFileInvoices/` (6 files)
  - `patientFileInvoices.js` — schema (287 lines), states, filters, sort options, 15 helpers
  - `methods.js` — 14 Meteor methods (~880 lines)
  - `util.js` — client/shared util
  - `server/util.js` — `_createInvoiceFromEvents` (242 lines), `_generateCertificates` (231 lines), `_getEarningStatisticsFor` (133 lines), `_mailInvoice` (87 lines) = 700 lines total
  - `server/publications.js` — 3 publications (`patientFileInvoice`, `uninvoicedEvents`, `invoices.open.statistics`)
  - `server/indexes.js` — indexes on `userId`, `practiceId`, `removed`

- `app/imports/api/invoices/insuranceInvoices/` (5 files)
  - `insuranceInvoices.js` — schema, 4 states, filters, 3 helpers
  - `methods.js` — 7 methods (generate, setState, editAnnouncement, search, print, printPractice, cancel)
  - `server/util.js` — `_generateInvoicesForUser` (202 lines)
  - `server/publications.js` — 1 publication (`insuranceInvoice`)
  - `util.js` — shared util

- `app/imports/api/invoices/commissionInvoices/` (6 files)
  - `commission.jsx` — schema, `CommissionTypes`, `CommissionStates`, `CommissionSchema`, helpers
  - `methods.js` — 7 methods (generate, search, updateAmount, updateState, remove, getOpenAmount, hasCommissionInvoices)
  - `util.js` — `_computeAmount` isomorphic (45 lines)
  - `server/util.js` — event-hook handlers (`_updateCommissionNewEvent`, `_updateCommissionNewEvents`, `_updateCommissionUpdateEvent`, `_updateCommissionRemoveEvent`)
  - `server/hooks.js` — `_cachedAmount` debouncer (500ms)
  - `server/publications.js` — 1 publication

- `app/imports/api/invoices/stripeInvoices/` (2 files)
  - `stripeInvoices.jsx` — schema, custom collection with auto-numbering
  - `server/rest.js` — REST endpoints for PDF and state

- `app/imports/api/invoices/payments/` (3 files)
  - `methods.jsx` — 0 bytes (empty file)
  - `server/util.js` — `StripeInvoicesUtil.createInvoice`
  - `server/publications.jsx` — `invoice` and `pending_invoices`

- `app/imports/modules/invoices/` (UI components — not individually listed, confirmed structure via HalingoDoc)
- `app/imports/ui/pages/financial/` (financial page + tabs + graphs — confirmed via HalingoDoc)

### Key symbols per file

**patientFileInvoices.js:11-28:**
- `PatientFileInvoices = new Collection("invoices")` — the MongoDB collection name is `invoices`, not `patientFileInvoices`
- `InvoiceStates = { OPEN, UNPAID, PARTIALLY_PAID, PRINTED, MAILED, PAID }` — 6 states
- `InvoiceInsuranceStates = { OPEN, PRINTED, PAID }` — 3 states
- `MAX_TREATMENTS_PER_CERTIFICATE = 34` — hard cap for matrix printer certificate lines

**patientFileInvoices.js:42-56:** `certificateSchema` — `approvalDate`, `numbers[{createdAt, number}]`, `prescriberName`, `prescriberRiziv`, `prescriptionDate`, `treatmentEnd`, `treatmentStart`

**patientFileInvoices.js:145-149:** `state` field allows `[...Object.values(InvoiceStates), "void"]` — confirms `void` is in the schema but not in the enum

**patientFileInvoices.js:175-212:** Filter and sort definitions — confirmed 9 filter presets. Note: `name_asc` sorts by `"patient.name": -1` (inverted) and `name_desc` by `"patient.name": 1` (also inverted). This is a QUIRK-PRESERVE candidate.

**server/util.js:21-242:** `_createInvoiceFromEvents` — the full 10-step generation pipeline. Confirmed:
- Step 4: INITIAL_BILAN expansion splits events into 30-min units (`meta.type === 2`), price divided by `getSessionCount()`, `kmCompensation = 0` for all but the first slice
- Step 6: De-conventioned discount at line 151-158: `if (moment(event.start).isAfter(moment("2024-04-01")) && user.profile.isDeconventioned && !treatmentHasSupplementaryInsurance && !patientFile.hasIncreasedReimbursement()) { event.pricePatient = event.price - (prices ? Math.ceil(prices.payback * 0.75) : 0); }`
- Step 7: Invoice numbering race at line 164: `// TODO not ok in case of multiple servers`
- Step 8: Structured announcement at lines 166-179: `communicationStructure` split by `-`, parts mapped from `{FULLNAME, DATE, MONTH, NAME, NUMBER}`

**server/util.js:244-475:** `_generateCertificates` — the full algorithm. Confirmed:
- No-treatment fallback: single placeholder certificate with `doesNotRequireCertificate: true`, throws `INVOICE_HAS_NO_EVENTS_WITH_TREATMENT`
- Pre-print refresh: SSN, companyNumber, insurance address pulled from live records if no certificate has been printed yet
- Per-treatment loop: loads `Treatment`, checks `approvalState !== DECLINED`, checks `isSupplementaryInsurance() && !isCertificateNeeded`
- Bilan matching: `treatment.getValidBilan(event.start)`, with EVALUATION_SESSION retroactive assignment to earliest bilan
- NO_BILAN synthetic bilan for supplementary insurance or `meta.type === 6`
- Printed-certificate lock: throws `invoices.certificates.generate.movedToPrintedCertificate`
- Per-event: `isReimbursable = hasPayBack && state !== ABSENT && getCodeForEvent(eventDoc)`
- 4 error types: `TREATMENT_NOT_REIMBURSED`, `BILAN_INCOMPLETE`, `TREATMENT_DOES_NOT_REQUIRE_CERTIFICATE`, `NO_REIMBURSABLE_EVENTS`

**server/util.js:612-699:** `_mailInvoice` — 8-step mail flow confirmed:
1. Load patient, get `contactDetails.email`
2. Load practice, get `settings.invoices.mail.text`
3. Pick `from` address (member vs practice type)
4. Render invoice to HTML via `InvoiceTemplates[meta.template || 0]`
5. Generate PDF via `SharedUtil.generatePDF(html)` (uses `html-pdf`/PhantomJS)
6. Send via `HalingoEmails.sendEmail` with `InvoiceMailTemplates[settings.invoices.mail.template || 0]`
7. Record in `emails` collection as `PATIENT_INVOICE` or `PATIENT_INVOICE_REMINDER`
8. Return success, caller flips state to `MAILED`

**insuranceInvoices/server/util.js:13-202:** `_generateInvoicesForUser` — confirmed:
- Source query requires `isThirdPayer: true`, `isCanceled: false`, `stateInsurance` either `OPEN` or `null`, `insuranceName` set, and at least one certificate with `numbers.0` existing and `insuranceInvoiceId: null`
- Group by `insuranceName` (default) or `insuranceName_patientFileId` (when `splitOnPatient`)
- Per-patient SSN check, errors collected per patient
- Amount: `_.reduce(events, (acc, e) => acc + e.price - e.pricePatient, 0)` per certificate
- Invoice numbering shares `practice.invoiceNumber` counter
- Back-link: sets `insuranceInvoiceId` on source patient invoice certificates

**insuranceInvoices/methods.js:94-105:** State propagation via `rawCollection().update` with `arrayFilters`:
```js
PatientFileInvoices.rawCollection().update(
  {},
  { $set: { "certificates.$[elem].insuranceInvoiceState": state } },
  { multi: true, arrayFilters: [{ "elem.insuranceInvoiceId": invoiceId }] }
);
```

**commissionInvoices/server/util.js:24-96:** `_updateCommissionNewEvent` — event-level commission tracking:
1. Skip if no `patientFileId`, no PracticeUser, no commission, or event before `commission.modifiedAt`
2. Find-or-create commission invoice for `{date: startOfMonth, practiceId, userId, status: OPEN}`
3. Push data entry `{eventId, treatmentType, amount: event.getPrice(), ...event.meta}`
4. Stamp `commissionInvoiceId` on the event

### Discrepancies found vs HalingoDoc

1. **`patientFileInvoices.js:208-209`**: HalingoDoc correctly notes that `name_asc` and `name_desc` sort orders are inverted. Confirmed in source: `name_asc: { "patient.name": -1 }` and `name_desc: { "patient.name": 1 }`. This is likely a copy-paste error from the original developer, now a QUIRK-PRESERVE item.

2. **`methods.js:22` (`invoices.add.all.therapists`)**: HalingoDoc says the bulk method "validates that each therapist on the list has a complete profile (address, bankAccount, riziv, name)". Source confirms but shows it's a weaker check than the per-patient method: missing `companyNumber` check, and an incomplete user causes a silent `return` with `{success: 0, errors: [...]}` rather than a throw.

3. **No discrepancy on structured announcement**: The source at `server/util.js:166-179` confirms the four `communicationStructure` formats are free-text, **not** OGM format. The first discovery's claim of `+++XXX/XXXX/XXXXX+++` was factually wrong.

---

## Source 3 — Staging exploration

**Status: DEFERRED.** Browser-pilot was not available for this session. The staging walk must be completed in a follow-up `halingo-staging-explorer` session.

**Screens to visit (prioritized):**
1. `/financial` — all 4 tabs (Facturen, Verzamelstaatfacturen, Commissie, Overzicht sessies)
2. `/financial/invoices/patient/:invoiceId` — single patient invoice detail + print preview
3. `/financial/invoices/insurance/:invoiceId` — single Verzamelstaat detail
4. `/financial/invoices/commission/:invoiceId` — single commission detail
5. Certificate modal flow on a patient invoice with certificates
6. AddInvoiceModal from the financial page
7. Bulk print dialog (`PrintInvoices` / `PrintPage`)
8. Dashboard → open-bills widget

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `smart-invoicing/compound-module-architecture` | Compound module architecture (5 sub-modules) | docs | `from_source/features/invoices_overview.md:6-17` | `api/invoices/` directory structure | DEFERRED | 5 collections, 5 state machines, shared numbering |
| 2 | `smart-invoicing/patient-invoice-generation` | Patient invoice generation (10-step pipeline) | docs + source | `from_source/features/patient_invoices.md:254-278` | `server/util.js:21-242` | DEFERRED | INITIAL_BILAN expansion, price computation, de-conventioned discount |
| 3 | `smart-invoicing/patient-invoice-generation-bulk` | Bulk invoice generation from event IDs | docs + source | `from_source/features/patient_invoices.md:165-167` | `methods.js:22-115` | DEFERRED | 34-event chunking, per-(patientFile, userId) grouping |
| 4 | `smart-invoicing/patient-invoice-generation-single` | Single-patient invoice generation | docs + source | `from_source/features/patient_invoices.md:168-169` | `methods.js:116-159` | DEFERRED | No chunking, throws if > 34 events |
| 5 | `smart-invoicing/patient-invoice-state-machine` | Patient invoice state machine | docs + source | `from_source/features/patient_invoices.md:302-325` | `patientFileInvoices.js:13-26, 145-149` | DEFERRED | 6 states + void + isCanceled, transitions not enforced |
| 6 | `smart-invoicing/insurance-state-machine` | Insurance state machine (dual-track) | docs + source | `from_source/features/patient_invoices.md:302-325` | `patientFileInvoices.js:150-153` | DEFERRED | 3 insurance states, propagated from Verzamelstaat |
| 7 | `smart-invoicing/isPaid-aggregate` | `isPaid` aggregate flag derivation | docs + source | `from_source/features/payment_reconciliation.md:36-45` | `methods.js:213-216` | DEFERRED | `state === PAID && (!isThirdPayer \|\| getInsuranceState() === PAID)` |
| 8 | `smart-invoicing/patient-invoice-data-model` | Patient invoice data model (20+ fields with frozen snapshots) | docs + source | `from_source/features/patient_invoices.md:58-89` | `patientFileInvoices.js:58-166` | DEFERRED | Snapshot-at-creation for patient, practice, user, events, insurance |
| 9 | `smart-invoicing/certificate-sub-document` | Certificate sub-document per (treatmentId, bilanId) | docs + source | `from_source/features/patient_invoices.md:90-119` | `patientFileInvoices.js:63-111` | DEFERRED | 12+ fields including prescriber, approval, treatment window |
| 10 | `smart-invoicing/certificate-generation` | Certificate generation algorithm (`_generateCertificates`) | docs + source | `from_source/features/patient_invoices.md:280-300` | `server/util.js:244-475` | DEFERRED | Per-treatment/bilan grouping, evaluation session retroactive, NO_BILAN synthetic, 4 error types |
| 11 | `smart-invoicing/certificate-printing-manual` | Certificate printing — manual mode | docs + source | `from_source/features/certificate_printing.md:31-39` | `methods.js:697-776` | DEFERRED | `bookNumber` regex `\d{2}\*\d{4}`, `certificateNumber` 1-50 |
| 12 | `smart-invoicing/certificate-printing-printer` | Certificate printing — printer mode | docs + source | `from_source/features/certificate_printing.md:31-39` | `methods.js:697-776` | DEFERRED | `printerNumber`, per-user offset in cm, per-browser fudge factors |
| 13 | `smart-invoicing/certificate-render` | Certificate HTML render (484x1311 px canvas) | docs + source | `from_source/features/certificate_printing.md:99-163` | `Certificate.jsx` | DEFERRED | Absolute-positioned fields, print scale 0.7965, diagonal strikethrough, video code 792433 |
| 14 | `smart-invoicing/certificate-cash-toggle` | Certificate cash toggle (`*0*` vs patient amount) | docs + source | `from_source/features/certificate_printing.md:176-178` | `CertificateModal.jsx:329-333` | DEFERRED | Not persisted, `*0*` is convention notation for deferred/derdebetaler payment |
| 15 | `smart-invoicing/certificate-state-management` | Per-certificate state management | docs + source | `from_source/features/patient_invoices.md:174-176` | `methods.js:222-286` | DEFERRED | Independent of invoice state, sets `certificates.$.state` |
| 16 | `smart-invoicing/certificate-duplicate-detection` | Certificate duplicate detection and re-print | docs + source | `from_source/features/certificate_printing.md:93-98, 222-226` | `CertificateModal.jsx:237, 301` | DEFERRED | Warning only, not blocked. "Opnieuw printen zonder duplicaat" link |
| 17 | `smart-invoicing/multiple-certificates-modal` | Multiple-certificates picker on a single invoice | docs + source | `from_source/features/certificate_printing.md:210-212` | `MultipleCertificatesModal.jsx` | DEFERRED | Per-certificate individual print, no bulk flow |
| 18 | `smart-invoicing/structured-announcement-build` | Structured announcement construction (4 formats) | docs + source | `from_source/features/patient_invoices.md:271-276` | `server/util.js:166-179` | DEFERRED | `FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`. **NOT OGM format.** |
| 19 | `smart-invoicing/structured-announcement-edit` | Edit structured announcement on open invoice | docs + source | `from_source/features/patient_invoices.md:183-184` | `methods.js:432-465` | DEFERRED | Refused unless state is OPEN |
| 20 | `smart-invoicing/administration-cost` | Administration cost surcharge | docs + source | `from_source/features/patient_invoices.md:177-179` | `methods.js:292-327` | DEFERRED | In cents, min 0, refused on canceled/paid |
| 21 | `smart-invoicing/invoice-search` | Patient invoice search (CollectionSearch) | docs + source | `from_source/features/patient_invoices.md:180-181` | `methods.js:329-430` | DEFERRED | Searches patient.name, structuredAnnouncement, certificate numbers, amount, invoiceNumber. Lid scoped to own. |
| 22 | `smart-invoicing/invoice-print` | Patient invoice print (sets state to PRINTED) | docs + source | `from_source/features/patient_invoices.md:186-188` | `methods.js:469-494` | DEFERRED | Browser-side print first, then DB state flip. Short-circuits if PAID or void. |
| 23 | `smart-invoicing/invoice-bulk-print-dossier` | Per-dossier bulk print (date range) | docs + source | `from_source/features/patient_invoices.md:189-190` | `methods.js:496-524` | DEFERRED | Returns invoices, caller flips state per-row |
| 24 | `smart-invoicing/invoice-bulk-print-practice` | Practice-wide bulk print (date range) | docs + source | `from_source/features/patient_invoices.md:191-193` | `methods.js:525-566` | DEFERRED | Optional userId filter |
| 25 | `smart-invoicing/invoice-mail` | Invoice email dispatch (8-step flow) | docs + source | `from_source/features/patient_invoices.md:195-207` | `server/util.js:612-699` | DEFERRED | PDF via html-pdf, from-address selection, email record in `emails` collection, state -> MAILED |
| 26 | `smart-invoicing/invoice-mail-reminder` | Invoice reminder email | docs + source | `from_source/features/patient_invoices.md:380` | `server/util.js:691` | DEFERRED | Same flow with `type: PATIENT_INVOICE_REMINDER` |
| 27 | `smart-invoicing/invoice-cancel` | Invoice cancellation | docs + source | `from_source/features/patient_invoices.md:209-210, 327-333` | `methods.js:602-630` | DEFERRED | Sets `isCanceled: true`, unsets `events.invoiceId`, refused if isPaid |
| 28 | `smart-invoicing/invoice-cancel-verzamelstaat-block` | UI-level Verzamelstaat block on patient invoice cancel | docs + source | `from_source/features/invoices_overview.md:56` | `PatientFileActions.jsx:144-166` | DEFERRED | Shows `notCancellableInsuranceInvoiceMsg` confirm dialog |
| 29 | `smart-invoicing/invoice-templates` | 4 invoice print templates | docs + source | `from_source/features/patient_invoices.md:344-346` | `InvoiceTemplate1-4.jsx` | DEFERRED | Configurable via `meta.template`, 800x1131 px |
| 30 | `smart-invoicing/invoice-void-overlay` | Void invoice "ONGELDIG" overlay | docs + source | `from_source/features/patient_invoices.md:54-56` | `InvoiceTemplate1.jsx:151-168` | DEFERRED | `state === "void"` renders giant red overlay. No method sets this. |
| 31 | `smart-invoicing/verzamelstaat-generation` | Verzamelstaat generation (per-fund or per-patient) | docs + source | `from_source/features/insurance_invoices.md:111-136` | `insuranceInvoices/server/util.js:13-202` | DEFERRED | Two grouping modes, SSN requirement, certificate must be printed first |
| 32 | `smart-invoicing/verzamelstaat-state-propagation` | Verzamelstaat state propagation to patient invoices | docs + source | `from_source/features/insurance_invoices.md:138-153` | `insuranceInvoices/methods.js:94-105` | DEFERRED | `rawCollection().update` with `arrayFilters` |
| 33 | `smart-invoicing/verzamelstaat-cancel` | Verzamelstaat cancellation (non-destructive) | docs + source | `from_source/features/insurance_invoices.md:168-173` | `insuranceInvoices/methods.js:317-362` | DEFERRED | Refused if PAID, unsets back-links, certificates become re-eligible |
| 34 | `smart-invoicing/verzamelstaat-print-layout` | Verzamelstaat print template (800x1131 px) | docs + source | `from_source/features/insurance_invoices.md:219-231` | `InsuranceInvoicePrint.jsx` | DEFERRED | 5-column table, per-fund i18n address lookup |
| 35 | `smart-invoicing/verzamelstaat-search` | Insurance invoice search | docs + source | `from_source/features/insurance_invoices.md:157-159` | `insuranceInvoices/methods.js:157-229` | DEFERRED | Searches insuranceName, structuredAnnouncement, amount |
| 36 | `smart-invoicing/commission-event-hook-tracking` | Commission auto-tracking via event hooks | docs + source | `from_source/features/commission_invoices.md:170-220` | `commissionInvoices/server/util.js:24-274` | DEFERRED | Insert/update/remove handlers, debounced 5s |
| 37 | `smart-invoicing/commission-bulk-generate` | Commission bulk generate ("Genereer" button) | docs + source | `from_source/features/commission_invoices.md:132-138` | `commissionInvoices/methods.js:17-86` | DEFERRED | Fixed-amount creates empty month rows, percentage walks uncommissioned events |
| 38 | `smart-invoicing/commission-compute-amount` | Commission amount computation (3 types + per-disorder overrides) | docs + source | `from_source/features/commission_invoices.md:89-127` | `commissionInvoices/util.js:5-45` | DEFERRED | Isomorphic, per-disorder `specificAmounts` override, String-typed amounts |
| 39 | `smart-invoicing/commission-inline-edit-amount` | Commission inline amount edit (pin override) | docs + source | `from_source/features/commission_invoices.md:270-272` | `commissionInvoices/methods.js:180-189` | DEFERRED | Sets `amount` field, overrides `_cachedAmount` permanently |
| 40 | `smart-invoicing/commission-state-flip` | Commission state flip (open / paid) | docs + source | `from_source/features/commission_invoices.md:275-279` | `commissionInvoices/methods.js:191-204` | DEFERRED | Paid blocks removal but not amount edit or event mutation |
| 41 | `smart-invoicing/commission-remove` | Commission invoice removal | docs + source | `from_source/features/commission_invoices.md:157-161` | `commissionInvoices/methods.js:206-238` | DEFERRED | Refused if PAID, unsets event commissionInvoiceId |
| 42 | `smart-invoicing/commission-setup-on-practice-user` | Commission rule setup per practice user | docs + source | `from_source/features/commission_invoices.md:260-268` | `practiceUsers.jsx:163-191` | DEFERRED | 3 types, `specificAmounts` per disorder, `modifiedAt` cursor. Cross-ref: #1 Identity Management. |
| 43 | `smart-invoicing/de-conventioned-discount` | De-conventioned price discount (post-2024-04-01) | docs + source | `from_source/features/patient_invoices.md:268` | `server/util.js:151-158` | DEFERRED | `pricePatient = price - Math.ceil(payback * 0.75)`. Belgian regulatory. Cross-ref: #8 Compliance Monitoring. |
| 44 | `smart-invoicing/initial-bilan-expansion` | INITIAL_BILAN expansion to 30-min units | docs + source | `from_source/features/patient_invoices.md:260` | `server/util.js:97-114` | DEFERRED | Price divided by session count, km only on first slice |
| 45 | `smart-invoicing/invoice-numbering` | Per-practice sequential invoice numbering (shared counter) | docs + source | `from_source/features/invoices_overview.md:66-67` | `server/util.js:164` | DEFERRED | Shared by patient invoices and Verzamelstaten, racey under multi-process |
| 46 | `smart-invoicing/open-bills-widget` | Open-bills dashboard widget | docs + source | `from_source/features/patient_invoices.md:22-23` | `OpenBillsWidgetContainer.jsx` | DEFERRED | Sum + count via `invoices.open.statistics` publication |
| 47 | `smart-invoicing/earnings-statistics` | Earnings statistics (revenue/receipt/km/commission per month) | docs + source | `from_source/features/financial_overview.md:44-66` | `server/util.js:477-610` | DEFERRED | 4 revenue streams, 5-year cap, earned vs received |
| 48 | `smart-invoicing/earnings-graph` | Earnings bar chart with detail card | docs + source | `from_source/features/financial_overview.md:71-93` | `EarningsGraph.jsx` | DEFERRED | Revenue (pale green) + Receipt (darker green), Chart.js stacked |
| 49 | `smart-invoicing/session-overview` | Session overview analytics tab (3 doughnuts + detail table) | docs + source | `from_source/features/financial_overview.md:102-141` | `SessionOverview.jsx` | DEFERRED | Event type, location, price grouping. Month/year mode toggle. |
| 50 | `smart-invoicing/financial-page-tabs` | Financial page tab assembly (conditional Commissie) | docs + source | `from_source/features/financial_overview.md:19-28` | `FinancialPageTabs.jsx:23-89` | DEFERRED | 4 tabs, Commissie conditionally shown |
| 51 | `smart-invoicing/therapist-picker` | Therapist picker on financial overview (per-user scope) | docs + source | `from_source/features/financial_overview.md:13-14` | `FinancialPage.jsx:146-212` | DEFERRED | Permission-gated, drives earnings + uninvoiced events refetch |
| 52 | `smart-invoicing/patient-invoice-filters` | Patient invoice filter presets (9 filters) | docs + source | `from_source/features/patient_invoices.md:121-137` | `patientFileInvoices.js:175-203` | DEFERRED | paid, open, unpaid, partially_paid, mailed, printed, isthirdpayer, canceled, void |
| 53 | `smart-invoicing/patient-invoice-helpers` | Patient invoice helper methods (15+) | docs + source | `from_source/features/patient_invoices.md:139-158` | `patientFileInvoices.js:214-286` | DEFERRED | getAmount, getAmountPatient, getInsuranceState (worst-case), locale, etc. |
| 54 | `smart-invoicing/derdebetaler-dual-track` | Derdebetaler (third-payer) dual-track billing concept | docs + source | `from_source/features/patient_invoices.md:69-71`, `from_source/features/invoices_overview.md:6` | `patientFileInvoices.js:73, 121-124` | DEFERRED | Patient pays remgeld, insurance pays reimbursable share. Drives entire Verzamelstaat flow. Cross-ref: #14 Mutualistic Billing. |

### Feature detail

#### `smart-invoicing/patient-invoice-generation` (#2)

- **Description:** The 10-step pipeline that creates a patient invoice from a set of events. The most complex business logic in the module.
- **Found via:** docs + source
- **Legacy source file(s):** `api/invoices/patientFileInvoices/server/util.js:21-242`
- **HalingoDoc file(s):** `from_source/features/patient_invoices.md:254-278`
- **Belgian-specific concerns:** De-conventioned discount (post-2024-04-01), `hasIncreasedReimbursement` (CG1 odd = verhoogde tegemoetkoming), RIZIV nomenclature code routing via `treatment.getCodeForEvent()`, insurance address lookup from i18n keys
- **Deprecation status:** Active. The practice invoice locale is deprecated (#18 in deprecation list) — user locale is canonical.
- **QUIRK-PRESERVE candidates:**
  - `name_asc` / `name_desc` sort order inversion (`patientFileInvoices.js:208-209`)
  - Invoice numbering race condition (`server/util.js:164`)
  - `setLocale(user.locale())` before structured announcement (not `practice.locale()`)
- **Open questions:** Is `void` state set by any admin path not visible in the source?

#### `smart-invoicing/certificate-generation` (#10)

- **Description:** `_generateCertificates(invoiceId, treatmentIds?)` creates or refreshes the certificate sub-documents on a patient invoice. Called at creation and on-demand.
- **Found via:** docs + source
- **Legacy source file(s):** `api/invoices/patientFileInvoices/server/util.js:244-475`
- **Belgian-specific concerns:** RIZIV getuigschrift requirements (34 lines per certificate = max events per booklet page), bilan-based treatment windows, evaluation session retroactive assignment, reimbursability computation
- **QUIRK-PRESERVE candidates:**
  - EVALUATION_SESSION retroactive assignment to earliest bilan even when outside window
  - NO_BILAN synthetic bilan for supplementary insurance or `meta.type === 6`
  - Printed-certificate lock prevents events from being moved to already-printed certificates

#### `smart-invoicing/structured-announcement-build` (#18)

- **Description:** Builds the "vrije mededeling" (free-text structured communication) from the practice's `communicationStructure` setting. **NOT the Belgian bank OGM format (`+++XXX/XXXX/XXXXX+++`).**
- **Found via:** docs + source
- **Legacy source file(s):** `api/invoices/patientFileInvoices/server/util.js:166-179`, `api/practice/practices.jsx:26-31`
- **The 4 formats:**
  - `NAME-DATE-NUMBER` (default) — e.g. `PEE-20260410-036`
  - `NAME-DATE` — e.g. `PEE-20260410`
  - `FULLNAME-MONTH-NUMBER` — e.g. `PEETERS SOPHIE-APR-036`
  - `FULLNAME-MONTH` — e.g. `PEETERS SOPHIE-APR`
- **Placeholders:** `FULLNAME = patientFile.name().toUpperCase()`, `DATE = moment().format("YYYYMMDD")`, `MONTH = moment(firstEvent.start).format("MMM").replace(".","").toUpperCase()`, `NAME = lastName.substr(0,3).toUpperCase()`, `NUMBER = invoiceNumber padded to 3 digits`
- **QUIRK-PRESERVE candidates:** `MONTH` uses `firstEvent.start` but `DATE` uses `moment()` (today), so the month in the announcement may differ from the date component.

#### `smart-invoicing/de-conventioned-discount` (#43)

- **Description:** After 2024-04-01, non-conventioned therapists (`user.profile.isDeconventioned === true`) apply a reduced patient price: `pricePatient = price - Math.ceil(payback * 0.75)`. This means the patient pays 25% less of the payback amount.
- **Found via:** docs + source
- **Legacy source file(s):** `api/invoices/patientFileInvoices/server/util.js:151-158`
- **Belgian-specific concerns:** This implements the RIZIV rule for non-conventioned logopedists where the patient's reimbursement is reduced to 75% of the conventioned payback rate. Only applies when: (a) event after 2024-04-01, (b) therapist is de-conventioned, (c) treatment is NOT supplementary insurance, (d) patient does NOT have increased reimbursement (verhoogde tegemoetkoming).
- **QUIRK-PRESERVE candidates:** The `Math.ceil` rounding direction (always rounds up the deduction, meaning the patient pays slightly less).

#### `smart-invoicing/commission-compute-amount` (#38)

- **Description:** The isomorphic function that computes commission amounts. Three paths: PERCENTAGE (with per-disorder overrides), FIXED_AMOUNT, and NONE.
- **Found via:** docs + source
- **Legacy source file(s):** `api/invoices/commissionInvoices/util.js:5-45`
- **QUIRK-PRESERVE candidates:**
  - Per-disorder overrides use `_.remove()` to extract matching events before the general rate, so override events are NOT double-counted
  - `specificAmounts.$.amount` is typed as String but parsed via `_.toNumber()` at compute time
  - FIXED_AMOUNT returns `amount * 100` (EUR to cents), PERCENTAGE returns result already in cents
  - Commission invoices are internal records, not legal invoices — no number, no structured announcement

---

## Permissions matrix

| # | Permission | owner | admin | lid | Scope |
|---|---|---|---|---|---|
| 1 | `invoices.generate` | yes | yes | own only | Patient invoice generation |
| 2 | `invoices.edit` | yes | yes | own only | Patient invoice state, cancel, cert state, admin cost, structured announcement, print |
| 3 | `invoices.view` | yes | yes | own only | Patient invoice detail view |
| 4 | `invoices.statistics` | yes | yes | no | Earnings statistics for other users, therapist picker |
| 5 | `invoices.statistics.earnings` | yes | yes | no | Earnings graph data |
| 6 | `invoices.insurance.add.all` | yes | yes | no | Verzamelstaat generation |
| 7 | `invoices.insurance.cancel` | yes | yes | no | Verzamelstaat cancellation |
| 8 | `invoices.insurance.edit` | yes | yes | no | Verzamelstaat state changes |
| 9 | `invoices.insurance.print` | yes | yes | no | Verzamelstaat print |
| 10 | `invoices.insurance.view` | yes | yes | no | Verzamelstaat detail view |
| 11 | `practice.commission.generate` | yes | yes | no | Commission bulk generate |
| 12 | `practice.commission.view` | yes | yes | no | Commission tab visibility |
| 13 | `practice.commission.update.amount` | yes | yes | no | Commission amount pin |
| 14 | `practice.commission.update.state` | yes | yes | no | Commission state flip |
| 15 | `practice.commission.remove` | yes | yes | no | Commission invoice removal |
| 16 | `practice.commission.getOpenAmount` | yes | yes | own only | Open commission amount query |
| 17 | `practice.user.update.commission` | yes | yes | no | Commission rule setup on practice user |
| 18 | `practice.invoices.view` | yes | yes | no | SaaS invoice view |
| 19 | `practice.invoices.pay` | yes | yes | no | SaaS invoice payment |

Note: A lid (default role) can generate, view, and edit **only their own** patient invoices. They cannot see any insurance, commission, or SaaS billing. Self-allowed actions are checked with the "or own" pattern in the method implementations.

---

## Cross-references to other areas

- **#2 Practice Branding** — `practice.settings.invoices` (template, color, extraHeader, remark, personalNote, locale, mail, communicationStructure, type) flows into the `meta` snapshot on every invoice. Logo and accent color drive the print templates.
- **#5 Multi-View Scheduling** — Events are the source of truth for invoiceable items. `event.invoiceId` links to the patient invoice. `event.commissionInvoiceId` links to the commission invoice. `event.canBeInvoiced()` gates the flow.
- **#7 Reimbursement Tracking** — `hasPayBack`, session caps, `isReimbursable`, treatment `approvalState` — all consumed by certificate generation to determine which events produce reimbursable certificate lines.
- **#8 Compliance Monitoring** — Nomenclature codes (`treatment.getCodeForEvent()`), the de-conventioned discount rule, `hasIncreasedReimbursement()` (CG1/CG2 routing), pricing via `event.getInsurancePrices()`.
- **#12 Payment Lifecycle** — Invoice state machine, `setState`, `isPaid` derivation, `partially_paid` manual flag, Stripe webhook for SaaS invoices.
- **#14 Mutualistic Billing** — Derdebetaler concept, Verzamelstaat generation, SSN requirement, `isThirdPayer`, insurance address lookup from i18n.
- **#15 Precision Printing** — Certificate 484x1311 px coordinate system, per-browser fudge factors, EPSON LX-350, offset per-user settings.
- **#16 Patient Communication** — Invoice mailing (8-step flow), reminder emails, `emails` collection recording.
- **#3 Patient Data Privacy** — INSZ (SSN) on certificates and Verzamelstaten.
- **#19 Practice Analytics** — Earnings statistics, session overview doughnuts, open-bills widget.
- **#20 SaaS Lifecycle** — Stripe invoices in same module directory, SaaS payment via `practice.invoices.pay`.

---

## [NEEDS CLARIFICATION]

### Q1: What sets the `void` state on a patient invoice?

- **Why it matters:** The `void` state is in the schema, in the filters, and renders as "ONGELDIG" overlay, but no Meteor method sets it. If there's an admin path or database script, the spec needs to document it.
- **Sources conflict?** No — all sources agree it exists but no method sets it.
- **What would resolve:** Product owner answer or admin-tool inventory.

### Q2: Is the `isPaid` non-recomputation after Verzamelstaat cascade intentional?

- **Why it matters:** After marking a Verzamelstaat as PAID, the cascade updates `insuranceInvoiceState` on certificates but does NOT recompute `isPaid` on the parent patient invoice. The user must re-touch the patient invoice's state dropdown to trigger `isPaid` recomputation. This creates invoices that are effectively paid but show as unpaid.
- **Sources conflict?** No — the gap is documented in `from_source/features/payment_reconciliation.md:68-70`.
- **What would resolve:** Product owner answer: is this a known quirk to preserve or a bug to fix in the port?

### Q3: Is the commission remove-event handler actually firing?

- **Why it matters:** `events/server/hooks.js:83-103` uses a startup observer on soft-deleted events with a `// TODO: RE-ENABLE` comment. If not firing, commission rollback on event delete is broken.
- **Sources conflict?** No — both HalingoDoc and source agree.
- **What would resolve:** Staging test: delete an event that's part of a commission invoice, check if the commission updates.

### Q4: Is `getInvoiceStatistics` (`latestInvoiceDate`) actually abandoned?

- **Why it matters:** Deprecation list #13 says abandoned. If it has an unreachable UI or is used by any admin tool, the spec should mention it.
- **Sources conflict?** No — product owner confirmed "Abandoned" (Q15).
- **What would resolve:** Already resolved. **DO NOT PORT.**

---

## [NEEDS DOMAIN REVIEW]

### Q1: De-conventioned discount — is `Math.ceil(payback * 0.75)` the correct formula?

- **Found in:** `server/util.js:157`
- **Why it matters:** This is a Belgian regulatory computation. The patient pays `price - Math.ceil(payback * 0.75)` when the therapist is non-conventioned. The standard RIZIV rule for non-conventioned logopedists reduces reimbursement to 75% of the conventioned rate (column "Std-NC" in the tariff tables). The implementation here takes 75% of `payback` (the reimbursement amount) and rounds up.
- **What I know:** The `logopedist-be` skill confirms: for non-conventioned logopedists, when the quorum is >60%, the ordinary-beneficiary reimbursement is reduced to 75% of the conventioned amount (i.e. `Terugbet. Std-NC = Terugbet. Std * 0.75`). The code's `Math.ceil(prices.payback * 0.75)` appears to compute the reduced payback amount, not the reduced reimbursement. Whether `prices.payback` equals the reimbursement or the full tariff matters for correctness.
- **Resolution:** Verify that `prices.payback` from `event.getInsurancePrices()` is the conventioned reimbursement amount (the column "Terugbet. Std" from the RIZIV tariff tables), not the full honorarium. If so, `Math.ceil(payback * 0.75)` correctly implements the 75% rule.

### Q2: Paper certificates still the only billing channel for logopedisten?

- **Found in:** `from_source/features/certificate_printing.md` (entire file)
- **Why it matters:** If eAttest/eFact opens for logopedisten during the migration, the certificate-printing module becomes legacy faster than expected.
- **What I know:** The `logopedist-be` skill confirms: eAttest/eFact for logopedisten is NOT opened at CIN/NIC. Not mandatory, not expected before 2027-Q4, realistic slip to 2028-2029. Paper getuigschriften remain the standard for logopedisten. The certificate printing module is essential for the foreseeable future.
- **Resolution:** Resolved. Port the certificate printing module in full. Monitor RIZIV/CIN announcements for sector opening.

### Q3: Is `VideoConsultationCode = 792433` still current?

- **Found in:** `Certificate.jsx:48-62`
- **Why it matters:** This is a hardcoded RIZIV nomenclature code for teleconsultation. If the convention code has changed, the certificate renders the wrong code.
- **What I know:** Product owner confirmed "Same" (Q30 in open_questions.md). The code is current as of Convention R/2026-2027.
- **Resolution:** Resolved. QUIRK-PRESERVE — keep the constant, consider making it configurable.

---

## Deprecated features — DO NOT PORT

| # | Feature | Deprecation entry | Citation |
|---|---|---|---|
| 1 | `getInvoiceStatistics` / `latestInvoiceDate` methods | `from_source/deprecation_list.md` #13 | Q15: "Abandoned" |
| 2 | `practices.settings.invoices.locale` (per-practice invoice language) | `from_source/deprecation_list.md` #18 | Q25: "We should not use practice locale." User locale is canonical. |
| 3 | `hasThirdPayerInvoices` tab gate | Commented out in code | `FinancialPageTabs.jsx:36-37` — the insurance tab is always shown |

---

## File-read traceability

### HalingoDoc (Source 1)

- `/home/tj/HalingoDoc/docs/full_documentation/invoicing_finances.md` — 1124 lines, full
- `/home/tj/HalingoDoc/docs/functional/application_map.md` — § 2 competency 11
- `/home/tj/HalingoDoc/docs/from_source/features/invoices_overview.md` — 172 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/patient_invoices.md` — 434 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/insurance_invoices.md` — 282 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/commission_invoices.md` — 345 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/certificate_printing.md` — 279 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/financial_overview.md` — 186 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/payment_reconciliation.md` — 219 lines, full
- `/home/tj/HalingoDoc/docs/from_source/features/pdf_generation.md` — 66 lines, full
- `/home/tj/HalingoDoc/docs/from_source/deprecation_list.md` — 184 lines, full
- `/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md` — 158 lines, full
- `/home/tj/HalingoDoc/docs/from_source/open_questions.md` — 158 lines, Q11/Q15/Q25/Q27
- `/home/tj/HalingoDoc/docs/coverage_matrix.md` — 60 lines, area #11 row

### Meteor source (Source 2)

- `app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js` — 287 lines, full
- `app/imports/api/invoices/patientFileInvoices/methods.js` — ~880 lines, first 100 + HalingoDoc citations
- `app/imports/api/invoices/patientFileInvoices/server/util.js` — ~700 lines, full
- `app/imports/api/invoices/patientFileInvoices/server/publications.js` — via HalingoDoc
- `app/imports/api/invoices/patientFileInvoices/server/indexes.js` — via HalingoDoc
- `app/imports/api/invoices/insuranceInvoices/insuranceInvoices.js` — via HalingoDoc
- `app/imports/api/invoices/insuranceInvoices/methods.js` — via HalingoDoc
- `app/imports/api/invoices/insuranceInvoices/server/util.js` — via HalingoDoc
- `app/imports/api/invoices/insuranceInvoices/server/publications.js` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/commission.jsx` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/methods.js` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/util.js` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/server/util.js` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/server/hooks.js` — via HalingoDoc
- `app/imports/api/invoices/commissionInvoices/server/publications.js` — via HalingoDoc
- `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx` — via HalingoDoc
- `app/imports/api/invoices/stripeInvoices/server/rest.js` — via HalingoDoc
- `app/imports/api/invoices/payments/methods.jsx` — 0 bytes (empty file)
- `app/imports/api/invoices/payments/server/util.js` — via HalingoDoc
- `app/imports/api/invoices/payments/server/publications.jsx` — via HalingoDoc
- UI components verified via HalingoDoc file:line citations

---

## Verification notes (verbatim from `01-discovery/smart-invoicing.verification.md`)

# Verification: Smart Invoicing

- **Verified by:** Codex (halingo-discovery-verifier procedure, cross-CLI from Claude producer)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/smart-invoicing.md`
- **Verdict:** PASS WITH NOTES

## Overall assessment

The rewritten discovery is materially sound and fixes the prior blocker about structured announcements. I read the discovery end-to-end, checked every cited HalingoDoc source family it relies on, used the `logopedist-be` references for Belgian billing/regulatory claims, and escalated a small set of load-bearing claims to Meteor source spot-checks.

The file is substantially better than the original shallow pass:

- The module split, patient-invoice pipeline, certificate printing, Verzamelstaat flow, commission logic, and financial analytics all match the cited HalingoDoc sources.
- The correction from Belgian bank OGM format to free-text `communicationStructure` is **confirmed** by both HalingoDoc and Meteor source.
- The Belgian domain framing is mostly accurate, especially on paper certificates remaining current and on eAttest/eFact not being opened for logopedists yet.

No factual blocker remains that would force a re-discovery before Phase 2. The remaining issues are specification-shaping clarifications and a couple of cross-area hygiene notes.

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Smart Invoicing is a compound module of five sub-modules with weak schema/code sharing | `from_source/features/invoices_overview.md` | ✓ | Confirmed. The discovery's module framing matches the source's "compound module" description. |
| 2 | Structured announcement uses four free-text `communicationStructure` formats and is **not** OGM format | `from_source/features/patient_invoices.md:271-276` | ✓ | Confirmed from HalingoDoc and Meteor `patientFileInvoices/server/util.js:166-179`. Previous OGM claim is correctly removed. |
| 3 | User locale is canonical; practice invoice locale is deprecated | `from_source/features/patient_invoices.md`, `from_source/deprecation_list.md` #18, `from_source/open_questions.md` Q11/Q25 | ✓ | Confirmed. HalingoDoc explicitly retracts the earlier "practice locale" framing. |
| 4 | Patient invoice generation uses a 10-step pipeline including INITIAL_BILAN expansion, de-conventioned logic, numbering, announcement build, snapshots, side effects, and certificate generation | `from_source/features/patient_invoices.md:254-278` | ✓ | Confirmed. Discovery summary matches the source. |
| 5 | `void` exists in schema and UI but is not in the enum and no method visibly sets it | `from_source/features/patient_invoices.md:54-56`, `:302-325` | ✓ | Confirmed. HalingoDoc says the same. |
| 6 | Certificate generation uses per-treatment/per-bilan grouping, EVALUATION_SESSION retroactive assignment, and `NO_BILAN` synthetic placeholder | `from_source/features/patient_invoices.md:280-300` | ✓ | Confirmed. |
| 7 | Certificate printing has manual vs printer modes, 484x1311 px render, browser-specific print offsets, duplicate warning, cash toggle, and independent certificate state | `from_source/features/certificate_printing.md` | ✓ | Confirmed. |
| 8 | Verzamelstaat generation supports per-fund and per-patient grouping, requires printed certificates first, and shares the practice invoice counter | `from_source/features/insurance_invoices.md` | ✓ | Confirmed. |
| 9 | Commission invoices support `none` / `fixedAmount` / `percentage` plus per-disorder overrides via `specificAmounts` | `from_source/features/commission_invoices.md` | ✓ | Confirmed. |
| 10 | Financial overview has 4 tabs, therapist picker, earnings graph, session overview, and no CSV export | `from_source/features/financial_overview.md` | ✓ | Confirmed. |
| 11 | `getInvoiceStatistics` / `latestInvoiceDate` is abandoned and should not be ported | `from_source/deprecation_list.md` #13, `from_source/open_questions.md` Q15 | ✓ | Confirmed. |
| 12 | `practice.settings.invoices.locale` is deprecated and should not be ported | `from_source/deprecation_list.md` #18, `from_source/open_questions.md` Q25 | ✓ | Confirmed. |
| 13 | `Events.getPrices()` dated tariff cascade stays as-is for migration | `from_source/deprecation_list.md` #22 | ✓ | Confirmed. |
| 14 | `commissionInvoice` publication selector overwrite bug and `pdf.generate` arbitrary HTML exposure are relevant backlog items | `from_source/bugs_and_security_findings.md` | ✓ | Confirmed. |
| 15 | Line-numbered HalingoDoc anchors in this rewritten discovery are internally consistent | All cited `from_source/...md:<line>` anchors | ✓ | I ran a line-range sanity check over all HalingoDoc anchors in this file; none point past the end of their cited documents. |

## Material omissions

No blocker-level omission was found in the rewritten discovery. Relative to the cited HalingoDoc sources, the discovery now covers the major functional surfaces and the most important quirks:

- patient invoice generation
- state machines
- certificates
- printing
- structured announcements
- Verzamelstaten
- commissions
- reconciliation
- financial analytics
- deprecations

Minor depth omissions remain, but they are acceptable for Phase 1:

- The discovery does not call out that both `practice.commission.view` and `invoices.commission.view` exist in the legacy permission surface; it foregrounds the UI gate (`practice.commission.view`) but not the duplicated invoicing permission constant.
- The area-level cross-reference section could more explicitly tie Smart Invoicing back to Identity Management, because `user.profile.riziv`, `companyNumber`, `certificate settings`, and `isDeconventioned` all materially affect invoice/certificate behavior.

## Cross-area reference check

| Cross-reference in discovery | Accurate? | Bidirectional? | Finding |
|---|---|---|---|
| #2 Practice Branding | ✓ | ✓ | Practice Branding discovery explicitly documents invoice meta snapshots and branding freeze on past invoices. |
| #5 Multi-View Scheduling | ✓ | ✓ | Scheduling discovery explicitly links `invoiceId` / `commissionInvoiceId` to invoicing. |
| #7 Reimbursement Tracking | ✓ | ✓ | Reimbursement/compliance discoveries both tie payback and nomenclature logic into invoicing/certificates. |
| #8 Compliance Monitoring | ✓ | ✓ | Compliance discovery explicitly says nomenclature codes are pulled into certificates at invoice generation. |
| #12 Payment Lifecycle | ✓ | ✓ | Payment Lifecycle discovery centers invoice-state and reconciliation behavior. |
| #14 Mutualistic Billing | ✓ | ✓ | Mutualistic Billing discovery is the sibling Verzamelstaat area and clearly points back to patient invoices. |
| #15 Precision Printing | ✓ | ✓ | Precision Printing discovery explicitly positions itself as the print/output stage of invoice/certificate flows. |
| #16 Patient Communication | ✓ | ✓ | Patient Communication discovery points back to invoice mail/reminder flows and settings. |
| #19 Practice Analytics | ✓ | ✓ | Practice Analytics discovery explicitly consumes `patientFileInvoices` and commission data. |
| #20 SaaS Lifecycle | ✓ | ✓ | SaaS Lifecycle discovery covers the Stripe invoice side of the same compound module. |
| #3 Patient Data Privacy | ✓ | ✗ | Smart Invoicing correctly points to privacy risk around INSZ/SSN and invoice-linked patient data, but `patient-data-privacy.md` does not point back to invoicing/billing surfaces. |

## Domain review (`logopedist-be`)

| Claim | Domain finding | Severity |
|---|---|---|
| Structured announcement is not Belgian bank OGM format | Confirmed as an application-level free-text convenience string, not a regulated banking format. No domain contradiction. | NOTE |
| De-conventioned rule reduces ordinary reimbursement for non-conventioned logopedists to 75% of the conventioned reimbursement | Confirmed from `01-riziv-nomenclature-and-tariffs.md`: `Terugbet. Std-NC = Terugbet. Std × 0.75` during active reduction windows. | NOTE |
| Legacy code applies this from `2024-04-01` for de-conventioned therapists without increased reimbursement and outside supplementary insurance | The date logic is plausible and matches the verified reduction window in the domain pack. | NOTE |
| Paper certificates remain a live, required billing channel for logopedists | Confirmed from `03-ehealth-mycarenet-eattest-efact.md`: logopedists are still effectively paper for this channel; eAttest/eFact is not production-open for the sector. | NOTE |
| eAttest/eFact for logopedists is not open yet and should not be assumed in product behavior | Confirmed. This remains a roadmap risk, not current live behavior. | NOTE |
| `792433` video-consultation extra code is still current | Discovery aligns with the verified knowledge pack and the product-owner answer captured in HalingoDoc open questions. | NOTE |

### Domain caution

One claim remains **partially verified rather than fully proven**:

- The discovery correctly identifies the **legacy formula** for the de-conventioned patient-price calculation.
- The domain pack confirms the **regulatory principle** behind the 75% reduction.
- What is **not** independently proven from the cited docs is whether legacy `prices.payback` always maps exactly to the current RIZIV `Terugbet. Std` column in every billing branch.

That means the formula should be treated in Phase 2 as:

- a **legacy behavior to preserve**, and
- a **regulatory rationale that is directionally correct**,

but not as a clean room recomputation from regulation without checking the upstream tariff helper semantics.

## Escalated source checks (Step C)

I used targeted Meteor spot-checks on load-bearing claims only.

| Claim checked | Meteor source | Finding |
|---|---|---|
| Structured announcement build and correction away from OGM | `app/imports/api/invoices/patientFileInvoices/server/util.js:155-179` | Confirmed. The code builds the string by splitting `communicationStructure` and mapping `FULLNAME`, `DATE`, `MONTH`, `NAME`, `NUMBER`. No OGM/structured-bank-reference logic exists. |
| De-conventioned discount implementation | `app/imports/api/invoices/patientFileInvoices/server/util.js:141-151` | Confirmed. Code applies `price - Math.ceil(prices.payback * 0.75)` behind the expected guards. |
| Shared communication-structure enum | `app/imports/api/practice/practices.jsx:22-27` | Confirmed. Exactly four allowed values exist. |
| Insurance-state propagation via `arrayFilters` | `app/imports/api/invoices/insuranceInvoices/methods.js:82-98` | Confirmed. State changes on Verzamelstaten propagate to `certificates.$[elem].insuranceInvoiceState` via raw Mongo update. |
| Commission event-mutation gap on paid rows / remove handler logic | `app/imports/api/invoices/commissionInvoices/server/util.js:194-263` | Confirmed. Both update/remove paths carry TODO comments and can mutate commission rows without a paid-state guard. |
| Certificate print validation and persistence | `app/imports/api/invoices/patientFileInvoices/methods.js:669-765` | Confirmed. Manual mode regex, printer mode requirement, and `$addToSet` numbering behavior all match the discovery. |

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-smart-invoicing-01 | CLARIFY | domain | The discovery correctly describes the **legacy** de-conventioned formula and the underlying 75% RIZIV principle, but the cited sources do not independently prove that legacy `prices.payback` always equals the tariff-table reimbursement column in every branch. Phase 2 should preserve the behavior first, then re-derive only after tariff-helper semantics are pinned. | Keep in `[NEEDS DOMAIN REVIEW]` / Phase 2 clarification backlog. |
| V-smart-invoicing-02 | NOTE | cross-area | The cross-reference to **#3 Patient Data Privacy** is accurate but not bidirectional. `patient-data-privacy.md` does not point back to the invoice/billing surfaces even though this area stores SSN/INSZ, insurance data, invoice IDs, and email-linked metadata. | Add bidirectional cross-link when that area is next touched. |
| V-smart-invoicing-03 | NOTE | cross-area | Area-level cross-references omit **#1 Identity Management** even though user RIZIV, company number, certificate settings, and `isDeconventioned` are load-bearing for invoicing and certificate output. | Add cross-link on next edit; not blocking Phase 2. |
| V-smart-invoicing-04 | NOTE | omission | The discovery foregrounds the commission tab's `practice.commission.view` UI gate but does not mention the parallel `invoices.commission.view` permission constant also present in the role matrix. This matters if Phase 2 collapses permission naming too aggressively. | Keep as an RBAC nuance for commission/spec work. |

## Recommendation

**PROCEED to Phase 2.**

Use `01-discovery/smart-invoicing.md` as the discovery contract for spec authoring, with two cautions:

1. Treat the de-conventioned pricing formula as a **legacy behavior to preserve first**, not as a regulation-only reimplementation.
2. Keep the structured-announcement correction as settled: it is **free-text communicationStructure**, not OGM.

No re-discovery is needed for this area.
