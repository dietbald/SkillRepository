# Mutualistic Billing

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Verzamelstaten generation for Ziekenfondsen.

## Spec contracts (Phase 2)

- **generate-verzamelstaten** — Feature: mutualistic-billing/generate-verzamelstaten
  - Path: `02-specs/mutualistic-billing/generate-verzamelstaten/spec.md`
- **verzamelstaat-detail-view** — Feature: mutualistic-billing/verzamelstaat-detail-view
  - Path: `02-specs/mutualistic-billing/verzamelstaat-detail-view/spec.md`
- **verzamelstaat-lifecycle** — Feature: mutualistic-billing/verzamelstaat-lifecycle
  - Path: `02-specs/mutualistic-billing/verzamelstaat-lifecycle/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/mutualistic-billing.md`)

# Discovery: Mutualistic Billing

**Area:** #14 Mutualistic Billing (from `application_map.md` § 2, competency 14)

**Scope in one breath:** The generation and management of "Verzamelstaten" (Insurance Invoices) for the Belgian *derdebetaler* (third-party payer) scheme, aggregating printed patient certificates for bulk reimbursement from insurance funds.

**Date:** 2026-04-09
**Agent:** Gemini CLI (sources 1+2+3 dispatch)

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/invoicing_finances.md` | ~1500 | sections | Margin adjustment for matrix printers, general invoice flow |
| Curated | `functional/application_map.md` | — | § 2 #14 | Formal area definition |
| Code-derived | `from_source/features/insurance_invoices.md` | ~200 | full | Core generation logic, state transitions, technical entry points |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | full | General PDF generation and permission bugs |
| Cross-cutting | `from_source/deprecation_list.md` | — | full | Identification of related dead code (e.g. `getInvoiceStatistics`) |

### What HalingoDoc covers for this area

HalingoDoc accurately describes the "Verzamelstaat" concept as an aggregation of patient certificates. It documents the two generation modes (by insurance fund vs. by patient) and the strict dependency on certificates having been "printed" on a patient invoice first. It also catalogs the states (`OPEN`, `PRINTED`, `PAID`, `CANCELED`) and the cascading effect of reconciliation.

### What HalingoDoc does NOT cover

- The precise validation logic for practice/user completeness (discovered in Source 2).
- The exact layout of the generation menu in the UI (discovered in Source 3).
- The use of raw MongoDB collections for atomic cascading updates (found in Source 2).

### Direct citations worth preserving

> From `from_source/features/insurance_invoices.md`:
> > A Verzamelstaat is a bulk invoice sent to an insurance fund (*ziekenfonds*) to claim the third-party payer portion of treatment costs.

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/invoices/insuranceInvoices/`
  - `insuranceInvoices.js` — Schema defining `InsuranceInvoiceStates` and certificate grouping.
  - `methods.js` — Core methods: `generateInvoices`, `setState`, `printInvoice`, `cancelInvoice`.
  - `server/util.js` — Generation logic, completeness checks, and grouping math.
- `app/imports/modules/invoices/insurance/`
  - `InsuranceInvoicePage.jsx` — Detail view for individual insurance invoices.
  - `InsuranceInvoiceListView.jsx` — List view within the financial panel.
  - `InsuranceInvoicePrint.jsx` — PDF template for the Verzamelstaat.
- `app/imports/ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx` — Main UI container for the tab.

### Key symbols per file

- `InsuranceInvoiceStates` (`insuranceInvoices.js:11`): `canceled`, `open`, `printed`, `paid`.
- `generateInvoicesForUser` (`server/util.js:11`): Iterates over `PatientFileInvoices` with printed certificates and creates `InsuranceInvoices`.
- `setState` (`methods.js:65`): Uses `rawCollection().update` with `arrayFilters` to propagate state changes back to `PatientFileInvoices.certificates`.
- `structuredAnnouncement` (`server/util.js:155`): Generated using a format like `CHR-20260409-002` (3-char fund prefix + date + counter).

### Discrepancies found vs HalingoDoc

- **Validation Rigidity**: Source 2 reveals that insurance invoice generation will fail silently or throw errors if the user's RIZIV, Bank Account, or Practice VAT info is missing, which is more strict than HalingoDoc implies.
- **Counter Sharing**: Code confirms that `InsuranceInvoices` and `PatientFileInvoices` share the `practice.invoiceNumber` counter, ensuring no gaps in the financial record.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 6 (1 public + 5 gated)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/mutualistic-billing/`

### Per-screen catalog

| # | Screen | URL | Fields/actions observed | Screenshot |
|---|---|---|---|---|
| 1 | Dashboard | `/` | Login successful as owner | `01-dashboard.png` |
| 2 | Financial Panel | `/financial` | Initial empty state | `02-financial-overview.png` |
| 3 | Verzamelstaten Tab | `/financial` (tab) | Tab is empty before data seeding | `03-verzamelstaten-empty.png` |
| 4 | Generation UI | `/financial` (tab) | "GENEREER" button appears after seeding sub + data | `04-verzamelstaten-with-genereer.png` |
| 5 | Invoice List | `/financial` (tab) | Generated invoice with state "OPENSTAAND" | `05-verzamelstaat-list.png` |
| 6 | Invoice Detail | `/financial/invoices/insurance/:id` | Action buttons (Download, Print, Annuleer) | `06-verzamelstaat-detail.png` |

### Behavior observed on staging

- **Gating**: The "GENEREER" button is hidden if `hasActiveSub` is false, even for owners.
- **Dropdown Logic**: The generation menu offers "Per ziekenfonds" and "Per patiënt" as promised in the docs.
- **Announcement Persistence**: The structured announcement is editable in the UI via an input field on the detail page.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `mut/generate-grouped` | Generate Verzamelstaten by fund | docs + source + staging | `insurance_invoices.md` | `methods.js:17` | `04-verzamelstaten-with-genereer.png` | Aggregates all patients into one fund invoice |
| 2 | `mut/generate-split` | Generate Verzamelstaten by patient | docs + source + staging | `insurance_invoices.md` | `methods.js:17` | `04-verzamelstaten-with-genereer.png` | One invoice per patient-fund pair |
| 3 | `mut/state-printed` | Mark as Printed | docs + source | `insurance_invoices.md` | `methods.js:181` | detail page | Triggers cascade to patient certificates |
| 4 | `mut/state-paid` | Mark as Paid (Reconciliation) | docs + source | `insurance_invoices.md` | `methods.js:65` | detail page | Propagates `PAID` state to all linked patient certificates |
| 5 | `mut/structured-announcement` | Auto-generate announcement | docs + source | `insurance_invoices.md` | `server/util.js:155` | `06-verzamelstaat-detail.png` | Format: `XXX-YYYYMMDD-NNN` |
| 6 | `mut/cancel-invoice` | Cancel insurance invoice | docs + source | `insurance_invoices.md` | `methods.js:255` | detail page | Unsets `insuranceInvoiceId` on patient certificates |
| 7 | `mut/data-completeness` | Practice/User data check | source | — | `server/util.js:25-60` | — | Blocks generation if RIZIV/Bank/VAT missing |

---

## Cross-references to other areas

- **#12 Payment Lifecycle:** Insurance reconciliation is a major sub-flow of the payment lifecycle.
- **#11 Smart Invoicing:** Patient invoices must be generated and "printed" first to provide the source certificates.
- **#20 SaaS Lifecycle:** Active subscription is required to see the "GENEREER" button.

---

## [NEEDS CLARIFICATION]

### Q1: Is the shared invoice counter desired in Nx?
- **Why it matters:** Currently, patient and insurance invoices share one sequence. It might be cleaner to separate them.
- **What would resolve:** Engineering decision in Phase 2.

### Q2: Handling of 11-digit RIZIV vs 8-digit.
- **Why it matters:** The seed script used 11 digits, some legacy docs mention 8.
- **What would resolve:** `logopedist-be` skill confirms 11-digit is the modern Belgian format (8 digits + 3 digit suffix).

---

## [NEEDS DOMAIN REVIEW]

### Q: Mandatory SSN (INSZ) for Verzamelstaten.
- **Found in:** `server/util.js:100`
- **Why it matters:** The code hard-blocks generation if a patient is missing an SSN.
- **Resolution:** `logopedist-be` skill confirms this is a strict RIZIV requirement for third-party billing.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/full_documentation/invoicing_finances.md
/home/tj/HalingoDoc/docs/from_source/features/insurance_invoices.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md

# Meteor source
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/insuranceInvoices/insuranceInvoices.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/insuranceInvoices/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/insuranceInvoices/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/insurance/InsuranceInvoicePage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/insurance/InsuranceInvoiceListView.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/insurance/InsuranceInvoicePrint.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/financial.js
/home/tj/Repos/Halingo-Main/app/imports/api/practice/practices.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/subscriptions.jsx
```

---

## Verification notes (verbatim from `01-discovery/mutualistic-billing.verification.md`)

# Verification: Mutualistic Billing

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/mutualistic-billing.md`
- **Producer:** Gemini CLI (rule #7 satisfied — different family from verifier)
- **Verdict:** PASS WITH NOTES

## Overall assessment

This discovery correctly scopes the Verzamelstaat (insurance invoice) area and identifies the key features (7 features, 161 lines). The producer was Gemini, satisfying rule #7 for cross-CLI verification. There are **no factual errors**. The features cover the main surface: both generation modes, state transitions, structured announcements, cancellation, and data completeness checks. However, the discovery lacks depth compared to the detailed `insurance_invoices.md` HalingoDoc source (~280 lines), and 2 of 4 Meteor source line-number citations are wrong.

## Citation accuracy

| # | Claim in discovery | Cited location | Actual location | Verified? | Finding |
|---|---|---|---|---|---|
| 1 | `InsuranceInvoiceStates: canceled, open, printed, paid` | `insuranceInvoices.js:11` | `insuranceInvoices.js:11-16` per HalingoDoc | ✓ | Confirmed. |
| 2 | `generateInvoicesForUser` | `server/util.js:11` | HalingoDoc says `server/util.js:13-202` | ✓ | Close enough. |
| 3 | `generateInvoices` method | `methods.js:17` | Actual line 18 in Meteor source | ✓ | Off by 1, acceptable. |
| 4 | `setState` method | `methods.js:65` | Actual line 65 in Meteor source | ✓ | Exact match. |
| 5 | `printInvoice` method | `methods.js:181` | Actual line 231 in Meteor source | ✗ | **Wrong by 50 lines.** |
| 6 | `cancelInvoice` method | `methods.js:255` | Actual line 317 in Meteor source | ✗ | **Wrong by 62 lines.** |
| 7 | Structured announcement format `XXX-YYYYMMDD-NNN` | `server/util.js:155` | HalingoDoc line 59: `<NAME-prefix>-<YYYYMMDD>-<NNN>` | ✓ | Matches. Discovery example `CHR-20260409-002` is plausible. |
| 8 | Shared invoice counter | Discrepancy section | HalingoDoc line 53: "Shares the same `practice.invoiceNumber` counter" | ✓ | Confirmed. |
| 9 | State propagation via rawCollection + arrayFilters | `methods.js:65` | HalingoDoc lines 141-153 | ✓ | Confirmed — `rawCollection().update` with `arrayFilters` on `PatientFileInvoices.certificates`. |
| 10 | Two generation modes (by fund vs by patient) | `insurance_invoices.md` | HalingoDoc lines 19-22 | ✓ | Confirmed. |

## Material omissions

### CLARIFY-level (depth omissions — the features are identified but detail is missing)

| # | Omitted content | Source | Impact |
|---|---|---|---|
| O-1 | **Data model.** Full schema has ~15 fields including `insuranceCode`, `insuranceName`, `insuranceAddress` (snapshots), `certificates` array, `invoiceNumber`, `meta`, `removed/removedAt`. Discovery mentions these contextually but doesn't enumerate. | `insurance_invoices.md` lines 44-65 | Spec author needs the full field list. |
| O-2 | **Certificate sub-document.** 9 fields per entry: `amount`, `bilanId`, `invoiceId` (back-link to patient invoice), `name`, `nbOfEvents`, `number` (printed certificate number), `patientFileId`, `SSN`, `treatmentId`. | `insurance_invoices.md` lines 67-83 | Critical for understanding what a Verzamelstaat aggregates. |
| O-3 | **Methods detail.** Discovery names 4 of 7 methods. Missing: `setStructuredAnnouncement` (OPEN-only edit), `searchInsuranceInvoices` (CollectionSearch backend), `printInvoicesPractice` (date-range bulk query). Listed methods lack behavioral detail. | `insurance_invoices.md` lines 106-173 | Spec author needs method signatures and constraints. |
| O-4 | **Generation flow detail.** The 8-step pipeline: completeness check → source query (isThirdPayer + isCanceled + stateInsurance + printed certificates) → grouping → per-group certificate walk → SSN skip-and-report → insert with structured announcement → back-link patient invoices → counter writeback. | `insurance_invoices.md` lines 117-136 | Core business logic — spec author needs this for test scenarios. |
| O-5 | **Permissions.** 6 permissions with self-allowed flags not listed: `invoices.insurance.add.all`, `.edit`, `.print`, `.cancel`, `.view`, `invoices.view`. Discovery mentions permissions briefly. | `insurance_invoices.md` lines 232-243 | RBAC spec needs this. |
| O-6 | **InsuranceInvoicePrint template layout.** Pixel-positioned print template with practice logo, sender/recipient blocks, 5-column table (patient name, INSZ, certificate number, nbOfEvents, amount), regulatory disclaimer, bank details. | `insurance_invoices.md` lines 219-230 | Needed for print parity testing. |
| O-7 | **Filters and sort.** 4 filter presets (paid, open, printed, canceled) and 6 sort options. | `insurance_invoices.md` lines 87-97 | Missing UI detail for the financial tab. |
| O-8 | **Notable behavioral details.** Verzamelstaat is the ONLY way insurance state progresses on patient invoices. Cancellation is non-destructive (certificates retained, back-links unset). SSN hard-required here but not at patient invoice creation. No mail dispatch (print-only). Amount from patient invoice snapshots, not live events. | `insurance_invoices.md` lines 246-255 | Several are QUIRK-PRESERVE candidates. |
| O-9 | **Helpers.** `canEdit()`, `getName()`, `locale()` not mentioned. | `insurance_invoices.md` lines 100-104 | Minor. |

### Missing cross-references

Discovery lists 3 (#11, #12, #20). Missing:
- **#8 Compliance Monitoring** — RIZIV nomenclature codes on certificates
- **#2 Practice Branding** — branding settings in `meta` snapshot
- **#1 Identity Management** — user RIZIV, bank account, companyNumber validation
- **#15 Precision Printing** — certificate printing prerequisite

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #12 Payment Lifecycle | ✓ | Insurance reconciliation is a sub-flow of payment lifecycle. |
| #11 Smart Invoicing | ✓ | Patient invoices must be generated and printed first — confirmed per `insurance_invoices.md` line 194. |
| #20 SaaS Lifecycle | ✓ | Active subscription required for GENEREER button — plausible. |

## Domain review (logopedist-be)

| Claim | Domain finding | Severity |
|---|---|---|
| SSN (INSZ) mandatory for Verzamelstaten | **Confirmed.** The `logopedist-be` skill confirms INSZ is required for derdebetaler billing to Ziekenfondsen. This is a strict RIZIV/INAMI requirement — the fund needs the patient's national registration number to process the reimbursement. The discovery's [NEEDS DOMAIN REVIEW] is correctly resolved. | NOTE (resolved) |
| RIZIV number format: 11-digit (8 + 3 suffix) | **Confirmed.** The `logopedist-be` skill reference file 04 describes the NIHDI/RIZIV number structure. The 11-digit format (8-digit base + 3-digit qualification code suffix) is the modern Belgian standard. The discovery's Q2 is correctly resolved. | NOTE (resolved) |

## Escalated source checks (Step C)

One Meteor source file checked:
- `app/imports/api/invoices/insuranceInvoices/methods.js` — grepped for method definitions. Confirmed `generateInvoices:18`, `setState:65`, `printInvoice:231`, `cancelInvoice:317`. Discovery's line numbers for `printInvoice` (181) and `cancelInvoice` (255) are wrong.

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-mb-01 | CLARIFY | citation | `printInvoice` method cited at `methods.js:181`, actual line is 231 (50 lines off). | Amend. |
| V-mb-02 | CLARIFY | citation | `cancelInvoice` method cited at `methods.js:255`, actual line is 317 (62 lines off). | Amend. |
| V-mb-03 | CLARIFY | omission | Certificate sub-document (9 fields) not described. Critical for understanding Verzamelstaat content. | Spec author must read `insurance_invoices.md` lines 67-83. |
| V-mb-04 | CLARIFY | omission | Generation flow detail (8-step pipeline) not described. Core business logic. | Spec author must read `insurance_invoices.md` lines 117-136. |
| V-mb-05 | CLARIFY | omission | 6 permissions with self-allowed flags not listed. | Spec author must read `insurance_invoices.md` lines 232-243. |
| V-mb-06 | CLARIFY | omission | InsuranceInvoicePrint template layout (pixel-positioned, 5-column table, regulatory disclaimer) missing. | Spec author must read `insurance_invoices.md` lines 219-230. |
| V-mb-07 | NOTE | omission | 3 of 7 methods not mentioned (search, structured announcement edit, bulk print). | Minor — spec author can discover. |
| V-mb-08 | NOTE | omission | Filters/sort (4 + 6), helpers (3), notable behavioral details (6 items) missing. | Minor depth gaps. |
| V-mb-09 | NOTE | domain | Both domain questions resolved: SSN mandatory confirmed, RIZIV 11-digit format confirmed. | Resolved. |
| V-mb-10 | NOTE | cross-area | 4 cross-references missing (#1, #2, #8, #15). | Add in supplementation. |

## Recommendation

**PROCEED to Phase 2 with supplementation.** The discovery correctly scopes the area and identifies all major features. No factual errors. Rule #7 is satisfied (Gemini producer, Claude verifier). The 6 staging screens provide good visual evidence of the UI.

The Phase 2 spec author MUST:
1. Read `insurance_invoices.md` directly — the discovery captures ~30% of the documented detail.
2. Add the certificate sub-document structure to the spec.
3. Document the full generation flow (8-step pipeline) with the source query predicates.
4. List the 6 permissions.
5. Document the print template layout for parity testing.
6. Correct the `printInvoice` (line 231, not 181) and `cancelInvoice` (line 317, not 255) citations.
