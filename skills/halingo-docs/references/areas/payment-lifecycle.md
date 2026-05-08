# Payment Lifecycle

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Invoice state machine, manual + Stripe webhook reconciliation.

## Spec contracts (Phase 2)

- **commission-manual** — Feature: payment-lifecycle/commission-manual
  - Path: `02-specs/payment-lifecycle/commission-manual/spec.md`
- **insurance-cascade** — Feature: payment-lifecycle/insurance-cascade
  - Path: `02-specs/payment-lifecycle/insurance-cascade/spec.md`
- **invoice-cancel** — Feature: payment-lifecycle/invoice-cancel
  - Path: `02-specs/payment-lifecycle/invoice-cancel/spec.md`
- **patient-manual** — Feature: payment-lifecycle/patient-manual
  - Path: `02-specs/payment-lifecycle/patient-manual/spec.md`
- **print-mail-state** — Feature: payment-lifecycle/print-mail-state
  - Path: `02-specs/payment-lifecycle/print-mail-state/spec.md`
- **saas-stripe-sync** — Feature: payment-lifecycle/saas-stripe-sync
  - Path: `02-specs/payment-lifecycle/saas-stripe-sync/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/payment-lifecycle.md`)

# Discovery: Payment Lifecycle

**Area:** #12 Payment Lifecycle (from `application_map.md` § 2, competency 12)

**Scope in one breath:** The complete lifecycle of an invoice (Patient, Insurance, Commission, or SaaS) from "Open" through reconciliation to "Paid" or "Canceled," including cascading state transitions for third-payer billing and automated SaaS reconciliation via Stripe.

**Date:** 2026-04-09
**Agent:** Gemini CLI (sources 1+2+3 dispatch)

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/invoicing_finances.md` | ~800 | sections | Margin adjustment for matrix printers, basic invoice flows |
| Curated | `functional/application_map.md` | — | § 2 #12 | Formal area definition |
| Code-derived | `from_source/features/payment_reconciliation.md` | ~150 | full | Reconciliation paths (Patient, Insurance, Commission, SaaS) |
| Code-derived | `from_source/features/invoices_overview.md` | ~200 | full | Invoice states, sub-modules, routes |
| Code-derived | `from_source/features/patient_invoices.md` | ~250 | full | Patient-side creation and state management |
| Code-derived | `from_source/features/stripe_invoices.md` | ~150 | full | SaaS billing and Stripe webhook logic |
| Cross-cutting | `from_source/deprecation_list.md` | — | full | Items #13 (Statistics), #18 (Practice Locale) |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | full | `stripeInvoices` validation gap, `commissionInvoice` pub bug |

### What HalingoDoc covers for this area

HalingoDoc provides a strong architectural overview of the four distinct reconciliation paths. It catalogs the invoice states (`open`, `unpaid`, `partially_paid`, `printed`, `mailed`, `paid`) and their meanings across different invoice types. The `payment_reconciliation.md` file is particularly valuable for describing the cascading effect where paying an insurance invoice automatically marks linked patient certificates as paid.

### What HalingoDoc does NOT cover

- The precise UI interaction for the state dropdown (Source 3)
- The technical debt of the `html-pdf` renderer (found in Source 2)
- The exact field-level mapping for Stripe webhook events (verified in Source 2)

### Direct citations worth preserving

> From `from_source/features/payment_reconciliation.md`:
> > The Verzamelstaat cascade updates `certificates.$[elem].insuranceInvoiceState` but does NOT recompute `isPaid` on the parent patient invoice. This is a known behavior confirmed as QUIRK-PRESERVE by the product owner (see clarification-answers.md Q21).

---

## Source 2 — Meteor source slice

### Files read (18 total)

- `app/imports/api/invoices/`
  - `patientFileInvoices/methods.js` — Core state management (`setState`, `setCertificateState`).
  - `patientFileInvoices/patientFileInvoices.js` — Schema defining `InvoiceStates` and `isPaid` derivation.
  - `insuranceInvoices/methods.js` — Cascading reconciliation logic.
  - `stripeInvoices/stripeInvoices.jsx` — SaaS invoice schema (notably bypassed validation).
  - `payments/server/stripe.ts` — Automated SaaS reconciliation via webhooks.
- `app/imports/modules/invoices/`
  - `InvoiceState.jsx` — Shared UI component for state badges.
  - `patient/PatientInvoicePage.jsx` — UI for manual state overrides.
  - `insurance/InsuranceInvoicePage.jsx` — UI for mutualistic reconciliation.
- `app/imports/startup/client/routes/financial.js` — Financial routes.

### Key symbols per file

- `InvoiceStates` (`patientFileInvoices.js:13`): Enum for `open`, `unpaid`, `partially_paid`, `printed`, `mailed`, `paid`.
- `setState` (`patientFileInvoices/methods.js:145`): Server-side method that recomputes `isPaid` flag.
- `EventParser` (`payments/server/stripe.ts:20`): Dispatches Stripe webhooks to `_onInvoicePaymentSucceeded` etc.
- `arrayFilters` (`insuranceInvoices/methods.js:80`): Use of raw MongoDB collection to perform atomic cascading updates across linked collections.

### Discrepancies found vs HalingoDoc

- **`stripeInvoices` Validation**: HalingoDoc mentions the schema but source code reveals `attachSchema` is commented out (`stripeInvoices.jsx:131`), making the collection effectively schemaless.
- **Renderer Debt**: HalingoDoc focuses on the logic, but the source reveals a hard dependency on `html-pdf` / PhantomJS, which is FIBER-BLOCKING and unmaintained since 2018.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 5 (1 public + 4 gated)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/payment-lifecycle/`

### Per-screen catalog

| # | Screen | URL | Fields/actions observed | Screenshot |
|---|---|---|---|---|
| 1 | Dashboard | `/` | Open bills widget (if data exists) | `01-dashboard.png` |
| 2 | Financial (Patient) | `/financial` | List of invoices with status chips | `01-financial-overview-patient.png` |
| 3 | Financial (Insurance) | `/financial` (tab) | Verzamelstaten list with bulk state actions | `02-financial-overview-insurance.png` |
| 4 | Financial (Commission) | `/financial` (tab) | Commission rows pending reconciliation | `03-financial-overview-commission.png` |
| 5 | Practice Subscriptions | `/practices/subscription` | Current SaaS plan and billing history | `04-practice-subscription.png` |

### Behavior observed on staging

- **Badge Consistency**: The `InvoiceState.jsx` component is used consistently across tabs to provide colored badges for states.
- **Manual Overrides**: In the patient invoice detail, the status is a simple dropdown that triggers a Meteor method call.
- **Empty States**: The local instance requires active data creation (events -> invoices) to see the full lifecycle UI; otherwise, tables are cleanly empty.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `pay/patient-manual` | Manual patient payment status | docs + source + staging | `patient_invoices.md` | `methods.js:145` | `/financial` detail | Dropdown flip to "Paid" |
| 2 | `pay/insurance-cascade` | Insurance cascade reconciliation | docs + source | `payment_reconciliation.md` | `insuranceInvoices/methods.js:80` | `/financial` (insurance tab) | Atomic update of all linked certificates |
| 3 | `pay/saas-stripe-sync` | Automated SaaS reconciliation | docs + source | `stripe_invoices.md` | `stripe.ts:45` | `/practices/subscription` | Triggered by Stripe webhooks |
| 4 | `pay/commission-manual` | Commission payment tracking | docs + source + staging | `invoices_overview.md` | `commissionInvoices/methods.js` | `/financial` (commission tab) | Separate from RIZIV billing |
| 5 | `pay/state-derivations` | Derived `isPaid` flag | source | — | `patientFileInvoices.js:145` | — | `isPaid` is a persisted flag recomputed on state changes |
| 6 | `pay/invoice-cancel` | Invoice cancellation/voiding | docs + source | `invoices_overview.md` | `methods.js:450` | detail page | Releases linked events back to "uninvoiced" state |
| 7 | `pay/print-to-status` | State change on print/mail | docs + source | `invoicing_finances.md` | `methods.js:380` | detail page | Printing an invoice automatically moves it to "printed" |

---

## Cross-references to other areas

- **#11 Smart Invoicing:** Invoicing creation logic precedes the payment lifecycle.
- **#14 Mutualistic Billing:** Generates the "Verzamelstaten" that the cascade reconciliation consumes.
- **#20 SaaS Lifecycle:** Owns the `subscriptions` collection that the Stripe webhook handler updates.

---

## [NEEDS CLARIFICATION]

### Q1: Derivation logic for `isPaid` in Third-Payer scenarios
- **Why it matters:** In Nx, we should decide if `isPaid` should be a computed property or a persisted flag (as it is in Meteor).
- **What would resolve:** Engineering decision in Phase 2.

### Q2: Retention of "Printed" and "Mailed" states
- **Why it matters:** These are "process states" rather than "financial states."
- **What would resolve:** Product owner answer on whether these should be separate metadata or part of the primary state machine.

---

## [NEEDS DOMAIN REVIEW]

### Q: VAT rules for Commission Invoices
- **Found in:** `commissionInvoices.md`
- **Why it matters:** Reconciliation of commissions between practice and therapist often involves VAT implications in Belgium.
- **Resolution:** `logopedist-be` skill confirms commissions are typically B2B and subject to standard VAT rules unless specific exemptions apply (Ref: 08-business-tax-and-mutualities.md).

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/from_source/features/payment_reconciliation.md
/home/tj/HalingoDoc/docs/from_source/features/invoices_overview.md
/home/tj/HalingoDoc/docs/from_source/features/patient_invoices.md
/home/tj/HalingoDoc/docs/from_source/features/stripe_invoices.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md

# Meteor source
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/insuranceInvoices/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/payments/server/stripe.ts
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/InvoiceState.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/patient/PatientInvoicePage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/insurance/InsuranceInvoicePage.jsx
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/financial.js
```

---

## Verification notes (verbatim from `01-discovery/payment-lifecycle.verification.md`)

# Verification: Payment Lifecycle

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/payment-lifecycle.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Invoice states list: `open`, `unpaid`, `partially_paid`, `printed`, `mailed`, `paid` | `patientFileInvoices.js:13` | ✓ | Exact match — `InvoiceStates` enum at line 13 contains precisely these six values. The discovery omits mention of a parallel `InvoiceInsuranceStates` enum (`open`, `printed`, `paid`) at the same location, but this is a scoping choice, not a misrepresentation. |
| 2 | Direct quote: "Paying a Verzamelstaat (Insurance Invoice) has a **cascading effect**: it iterates through every linked PatientFileInvoice and recomputes its `isPaid` status based on the new insurance state." | `payment_reconciliation.md` (presented as a direct quote) | ✗ | **BLOCKER — fabricated quote.** This text does not appear verbatim in `payment_reconciliation.md`. The actual source says the cascade updates `certificates.$[elem].insuranceInvoiceState` but explicitly warns (with a ⚠️ flag) that it does NOT recompute `isPaid`. The discovery's "quote" inverts this: it says the cascade *recomputes* `isPaid`, which is precisely the reconciliation gap flagged in the real source. The discovery presents this fabricated text as a block-quoted direct citation, making it load-bearing misinformation for Phase 2 spec authoring. |
| 3 | `stripeInvoices` validation: `attachSchema` is commented out at `stripeInvoices.jsx:131` | `stripeInvoices.jsx:131` | ✓ | Confirmed. Line 131 reads `//PatientFileInvoices.attachSchema(PatientFileInvoices.schema);` — commented out, collection is effectively schemaless. |
| 4 | `InvoiceStates` enum at `patientFileInvoices.js:13` | `patientFileInvoices.js:13` | ✓ | Exact location confirmed. |
| 5 | `setState` method at `patientFileInvoices/methods.js:145` | `methods.js` | ~ | **NOTE — line number off.** The `setState` (`invoices.edit.state`) method definition begins at line 160, not line 145. Line 145 is inside the schema of a prior method. The method exists and works as described; the line number is incorrect. |
| 6 | Cascading update via `arrayFilters` at `insuranceInvoices/methods.js:80` | `methods.js:94-105` | ~ | **NOTE — line number off.** The `arrayFilters` cascade logic starts at line 94 (the `PatientFileInvoices.rawCollection().update(...)` call), not line 80. Line 80 is inside the method's validation/permission block. The logic and description are otherwise correct. |
| 7 | `EventParser` at `payments/server/stripe.ts:20` | `stripe.ts:18` | ~ | **NOTE — minor line offset.** `EventParser` is defined as an IIFE beginning at line 18, not 20. The `_onSubscriptionUpdated` inner function starts at line 19. Functionally correct. |
| 8 | Deprecation list item #13 (`getInvoiceStatistics`) | `deprecation_list.md` #13 | ✓ | Confirmed. Item #13 is titled "getInvoiceStatistics and latestInvoiceDate" — abandoned analytics feature, server methods defined, no UI consumer. |
| 9 | Deprecation list item #18 (Practice Locale) | `deprecation_list.md` #18 | ✓ | Confirmed. Item #18 is `practices.settings.invoices.locale` — legacy, do not port to mono repo. |
| 10 | `commissionInvoice` publication bug in `bugs_and_security_findings.md` | `bugs_and_security_findings.md` | ✓ | Confirmed. The file names this bug: "commissionInvoice publication selector overwrites instead of `$or`-ing". Owners with `practice.commission.view` cannot see their own rows. |
| 11 | `stripeInvoices` validation gap in `bugs_and_security_findings.md` | `bugs_and_security_findings.md` | ✓ | Confirmed under "Schema / validation drift" section. Described precisely as discovery states. |
| 12 | `html-pdf` / PhantomJS dependency, fiber-blocking | `bugs_and_security_findings.md` and `deprecation_list.md` | ✓ | Confirmed in `bugs_and_security_findings.md` under "Operational hygiene". Described as FIBER-BLOCKING and unmaintained since 2018. `deprecation_list.md` confirms "do not port `html-pdf`". |
| 13 | `pay/state-derivations` cites `isPaid` as a persisted flag recomputed on state changes, citing `patientFileInvoices.js:145` | `patientFileInvoices.js` | ~ | **NOTE — wrong file and line.** The `isPaid` field is defined as a schema field in `patientFileInvoices.js` (confirmed in the patient_invoices.md documentation and the schema around line 73), but line 145 is the `state` field definition, not the `isPaid` field. The `isPaid` *recomputation* logic lives in `methods.js` inside the `setState` method body, not in `patientFileInvoices.js:145`. Functionally the claim that `isPaid` is a persisted flag recomputed on state changes is correct. |
| 14 | Feature `pay/saas-stripe-sync` cites `stripe.ts:45` | `stripe.ts` | ~ | **NOTE — line number not verified.** The discovery mentions `stripe.ts:45` for the SaaS reconciliation feature row. The file I read shows webhook handlers throughout; the specific handler content at line 45 was not pinpointed. The description of webhook-driven reconciliation is accurate per `payment_reconciliation.md` and `stripe_invoices.md`. |
| 15 | Area #12 definition from `application_map.md` § 2, competency 12 | `functional/application_map.md` | ✓ | Confirmed. Competency 12 is "Payment Lifecycle Management: Tracking 'Open,' 'Paid,' and 'Overdue' statuses." |

---

## Material omissions

The following features and behaviors appear in the cited HalingoDoc sources but are absent or undersold in the discovery file:

**1. The `isPaid` two-track reconciliation gap (critical behavioral detail)**

`payment_reconciliation.md` contains a ⚠️-flagged finding at lines 64-70: the cascade from Verzamelstaat to patient invoice certificates updates `certificates.$[].insuranceInvoiceState` but does NOT also recompute `isPaid` on the parent patient invoice. The result is that a derdebetaler invoice can permanently sit with `state: paid`, `getInsuranceState(): paid`, but `isPaid: false` until the user re-touches the patient state dropdown. The discovery file does not mention this gap at all. Discovery feature `pay/insurance-cascade` describes the cascade as atomic and complete, which is misleading. This is material for the Phase 2 spec.

**2. The two-track derdebetaler reconciliation (patient must trigger isPaid separately)**

`payment_reconciliation.md` lines 64-68 describes a three-step process for a derdebetaler invoice: (1) user marks patient state paid → `isPaid` is still false; (2) user marks Verzamelstaat paid → cascade fires; (3) `isPaid` only becomes true on the **next** `setState` call on the patient invoice. This two-touch requirement is not mentioned in the discovery file's Q1 NEEDS CLARIFICATION block (which frames it as an engineering decision, not a documented behavior).

**3. The `void` state**

`invoices_overview.md` and `patient_invoices.md` document a `void` state (rendered as "ONGELDIG" overlay, settable only by manual DB edit or unknown admin path, filter in `PatientFileInvoices.filters.void`). The discovery's invoice states list omits `void`. Since the spec will need to handle the display of legacy `void` invoices, this is a relevant omission.

**4. The stripeInvoices `STATES` vs `PAYMENT_STATES` dual-enum distinction**

`stripe_invoices.md` documents that `stripeInvoices` has TWO separate state enums: `STATES` (the invoice lifecycle: open, pending, paid, failed, closed) and `PAYMENT_STATES` (the in-flight payment attempt: open, pending, charging, failed, success). The discovery only mentions the lifecycle states and does not surface the `PAYMENT_STATES` enum. This matters because several helpers (`isPaymentPending`, `isPaymentFailed`, `isPaymentSuccess`) read `PAYMENT_STATES`, not `STATES`.

**5. The `closed` stripeInvoices state**

The `stripe_invoices.md` documents a `CLOSED` state in the stripeInvoices STATES enum ("defined but not used in code I read"). The discovery's state list for SaaS invoices does not mention it. Minor but complete.

**6. The hardcoded dual-entity invoicing logic in `StripeInvoicePrint.jsx`**

`stripe_invoices.md` documents that the SaaS invoice PDF template hardcodes two distinct legal entities as sender: **Autopilot Pte Ltd** (Singapore, for zero-VAT customers) and **Nifiq BV** (Heverlee, BE, for VAT-bearing customers). This is a major piece of business logic. The discovery makes no mention of this dual-entity design, which will affect Phase 2 spec authoring for the SaaS invoice PDF feature.

**7. The open-bills widget publication logic and partial-payment treatment**

`payment_reconciliation.md` documents the `invoices.open.statistics` publication in detail (lines 167-185), including the fact that a derdebetaler invoice with the patient half paid but insurance half open contributes only the insurance share to the open total. The discovery does not mention the open-bills widget at all.

**8. The earnings statistics `receipt` vs `revenue` distinction**

`payment_reconciliation.md` and `invoices_overview.md` describe an `EarningsGraph` that distinguishes "earned" (revenue) from "received" (receipt), where receipt only counts invoices with `state === PAID`. The commission stream counts as "owed" regardless of payment state. This is relevant to feature `pay/state-derivations` and the analytics area.

**9. The `mailInvoice` → `emails` collection connection**

`payment_reconciliation.md` documents that `mailInvoice` writes to the `emails` collection with `type: PATIENT_INVOICE` or `PATIENT_INVOICE_REMINDER`. Discovery feature `pay/print-to-status` mentions state changes on mail but does not mention the `emails` collection write or the `status` field lifecycle there.

**10. The cancellation asymmetry**

`invoices_overview.md` documents that cancellation behavior differs by invoice type: `patientFileInvoices` sets `isCanceled: true` (soft), `insuranceInvoices` sets `state: canceled` and unlinks certificates (soft), but `commissionInvoices` does a hard `remove()` (hard delete). Discovery feature `pay/invoice-cancel` does not distinguish the three cancellation behaviors.

---

## Cross-area reference check

| Cross-area reference | Claim in discovery | Verified bidirectional? | Finding |
|---|---|---|---|
| #11 Smart Invoicing | "Invoicing creation logic precedes the payment lifecycle." | ~ | The reference direction is correct (creation → payment). However, no corresponding back-reference from #11 to #12 was verified (the smart-invoicing discovery file was not read in this session). Flag for the #11 verifier to confirm bidirectionality. |
| #14 Mutualistic Billing | "Generates the 'Verzamelstaten' that the cascade reconciliation consumes." | ✓ | `insuranceInvoices` is explicitly the bridge between mutualistic billing (#14) and payment lifecycle (#12). The `payment_reconciliation.md` source confirms Verzamelstaat state-changes are the input to the cascade. Accurate description. |
| #20 SaaS Lifecycle | "Owns the `subscriptions` collection that the Stripe webhook handler updates." | ✓ | `payment_reconciliation.md` confirms the Stripe webhook resets `Subscriptions.{trialEnd, periodEnd, activeUntil}` on payment failure, and `stripe_invoices.md` confirms subscription state is consumed by the SaaS reconciliation path. Accurate. |

---

## Domain review (logopedist-be)

The skill's reference file `08-business-tax-and-mutualities.md` was consulted against sections 1.3, 3.1, 3.4, and the mutualities content.

**1. VAT rules for Commission Invoices — verified**

The discovery file states (in NEEDS DOMAIN REVIEW): "commissions are typically B2B and subject to standard VAT rules unless specific exemptions apply (Ref: 08-business-tax-and-mutualities.md)."

The skill confirms this is conditionally correct but oversimplified. Key nuance from `08-business-tax-and-mutualities.md` §1.3 and §3.4:

- The VAT treatment of commission/retrocession invoices depends critically on the **invoicing direction**.
- **Praktijk → freelancer** (room + admin fee): 21% VAT in principle on the non-therapeutic services bundle. The freelancer cannot reclaim this VAT if they are art. 44 exempt, making it a real cost.
- **Freelancer → praktijk** (therapeutic sub-contracting): VAT-exempt under art. 44 §1 WBTW if the praktijk uses the service to deliver therapeutic care to the patient. No VAT flows.
- The discovery's NEEDS DOMAIN REVIEW block claims to have already resolved this via the skill ("Resolution: `logopedist-be` skill confirms..."). This is problematic: the block both flags and purports to resolve the question within the discovery file itself, but the actual resolution does not capture the directional dependency. The Phase 2 spec author needs to know which direction halingo's commission model uses.

**Verdict:** CLARIFY — the domain review block in the discovery file is partially correct but structurally incomplete. The Phase 2 spec author must establish which of the two invoicing directions halingo's commission model implements, then apply the correct VAT rule.

**2. Verzamelstaat cascade — Belgian practice match**

The skill confirms (via `references/03-ehealth-mycarenet-eattest-efact.md` and the billing model context) that derdebetaler billing through monthly Verzamelstaten to the Ziekenfonds is correct Belgian mutualistic billing practice. Paper-based Verzamelstaten remain the current mechanism (eAttest/eFact not yet open for logopedisten). The cascade reconciliation model (user marks Verzamelstaat paid → patient invoice insurance side updated) matches the Belgian workflow: the Ziekenfonds pays the practice, the practice marks the batch as settled, individual patient-side invoices are updated accordingly. No RIZIV regulatory implications to the cascade itself — it is an administrative tracking mechanism, not a billing act.

**Verdict:** PASS — accurate description of Belgian mutualistic billing practice.

**3. Mandatory fields for Belgian healthcare invoices**

The skill does not enumerate mandatory fields for patient invoices to patients (B2C), but `patient_invoices.md` documents `structuredAnnouncement` as the structured communication field. Belgian law (Code of Economic Law) requires invoices to include: identification of issuer (name, address, VAT/KBO number), patient identification, date, amount, and a unique invoice number. The `patientFileInvoices` schema captures all of these. No gap identified. Commission invoices between practice and therapist are B2B and follow standard Belgian B2B invoice rules (art. 53 WBTW) but are NOT healthcare invoices in the RIZIV sense.

**Verdict:** PASS — no mandatory field gap identified from the domain perspective.

**4. RIZIV regulatory implications of commission reconciliation**

The skill confirms that commission invoices between practice and therapist are NOT RIZIV billing acts. RIZIV billing flows between the logopedist (M-number holder) and the Ziekenfonds/patient. Commission reconciliation is a private B2B arrangement between practice and therapist. No RIZIV regulatory implications.

**Verdict:** PASS — the discovery file does not claim any RIZIV implications for commission invoices (the NEEDS DOMAIN REVIEW is about VAT only), which is correct.

---

## Escalated source checks (Step C)

Five claims were spot-checked against Meteor source:

**1. `InvoiceStates` at `patientFileInvoices.js:13`** — CONFIRMED. The enum is at line 13, exactly as cited, with all six values (`open`, `unpaid`, `partially_paid`, `printed`, `mailed`, `paid`).

**2. `setState` at `patientFileInvoices/methods.js:145`** — INCORRECT LINE. The `setState` method (`invoices.edit.state`) begins at line 160, not 145. Line 145 is a schema field definition. The method works as described; the line number is wrong.

**3. `attachSchema` commented out at `stripeInvoices.jsx:131`** — CONFIRMED. Line 131 reads `//PatientFileInvoices.attachSchema(PatientFileInvoices.schema);`. Note: the variable name used in the comment is `PatientFileInvoices` (not `StripeInvoices`), suggesting this comment may be copy-pasted from the patient invoice file, but the effect is the same: schema validation is disabled for the collection.

**4. `arrayFilters` cascade at `insuranceInvoices/methods.js:80`** — LOGIC CONFIRMED, LINE INCORRECT. The `rawCollection().update(...)` with `arrayFilters` is at lines 94-105, not line 80. The logic is exactly as described: sets `certificates.$[elem].insuranceInvoiceState` for all certificates whose `insuranceInvoiceId` matches. The cascade does NOT recompute `isPaid` (confirmed as a reconciliation gap).

**5. `EventParser` at `payments/server/stripe.ts:20`** — SUBSTANTIALLY CONFIRMED, MINOR LINE OFFSET. `EventParser` begins as an IIFE at line 18. The dispatcher correctly routes Stripe events. The claim that it dispatches to `_onInvoicePaymentSucceeded` etc. is accurate from context.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-PL-01 | BLOCKER | Citation | The discovery file presents a fabricated direct quote from `payment_reconciliation.md`: "it iterates through every linked PatientFileInvoice and recomputes its `isPaid` status based on the new insurance state." The actual source says the cascade does NOT recompute `isPaid` and flags this as a reconciliation bug. The discovery inverts the real behavior and misrepresents it as a verified source quote. | Must correct before Phase 2 spec authoring for `pay/insurance-cascade` |
| V-PL-02 | BLOCKER | Omission | The `isPaid` two-touch gap (cascade fires but `isPaid` only recomputes on next manual `setState`) is absent from the discovery. Feature `pay/insurance-cascade` will produce an incorrect spec if written from the discovery file alone. | Must add to discovery or flag in spec |
| V-PL-03 | CLARIFY | Domain | The commission invoice VAT resolution in the NEEDS DOMAIN REVIEW block is incomplete: it does not capture the invoicing-direction dependency (praktijk→freelancer = 21% VAT; freelancer→praktijk = art. 44 exempt). Phase 2 spec author must determine which direction halingo's commission model uses. | Add to NEEDS CLARIFICATION backlog |
| V-PL-04 | CLARIFY | Omission | The `void` state on `patientFileInvoices` is not mentioned anywhere in the discovery. Legacy data in the `invoices` collection may have `state: "void"`, and the spec needs to handle display of these records. | Add to NEEDS CLARIFICATION backlog |
| V-PL-05 | CLARIFY | Omission | The dual-entity sender logic in `StripeInvoicePrint.jsx` (Autopilot Pte Ltd for zero-VAT vs Nifiq BV for VAT-bearing customers) is absent from the discovery. This is business-critical for the SaaS invoice PDF feature spec. | Add to NEEDS CLARIFICATION backlog |
| V-PL-06 | CLARIFY | Omission | The `stripeInvoices` dual-enum (`STATES` vs `PAYMENT_STATES`) is not surfaced. Several payment status helpers rely on `PAYMENT_STATES`; the spec must model both enums separately. | Add to NEEDS CLARIFICATION backlog |
| V-PL-07 | CLARIFY | Omission | Commission invoice cancellation behavior (hard `remove()`, not soft cancel) is not distinguished from the soft-cancel behaviors of patient and insurance invoices in feature `pay/invoice-cancel`. | Add to NEEDS CLARIFICATION backlog |
| V-PL-08 | CLARIFY | Omission | The derdebetaler two-track reconciliation three-step sequence (patient paid → isPaid still false → Verzamelstaat paid → cascade → re-touch patient dropdown → isPaid true) is not in the discovery. Q1 in NEEDS CLARIFICATION frames this as an engineering decision, but it is documented existing behavior. | Reframe Q1 from engineering question to behavioral requirement |
| V-PL-09 | NOTE | Citation | `setState` line number cited as `:145` in feature table; actual location is line 160. Does not affect behavior description. | Cosmetic correction |
| V-PL-10 | NOTE | Citation | `arrayFilters` cascade cited at `methods.js:80`; actual location is lines 94-105. Does not affect behavior description. | Cosmetic correction |
| V-PL-11 | NOTE | Citation | `EventParser` cited at `stripe.ts:20`; actual start is line 18. Does not affect behavior description. | Cosmetic correction |
| V-PL-12 | NOTE | Citation | Feature `pay/state-derivations` cites `patientFileInvoices.js:145` for the `isPaid` flag; line 145 is the `state` field, not `isPaid`. The `isPaid` field is at an earlier line in the schema, and the recomputation logic is in `methods.js`. | Cosmetic correction |
| V-PL-13 | NOTE | Omission | The `closed` state in `stripeInvoices.STATES` enum is not mentioned (documented as defined but unused in source). Minor completeness gap. | Record for completeness |
| V-PL-14 | NOTE | Omission | The open-bills widget (`OpenBillsWidget.jsx`) and its `invoices.open.statistics` publication are not mentioned in the discovery despite being documented in `payment_reconciliation.md`. Relevant to the dashboard feature area. | Mention in spec under cross-area references |
| V-PL-15 | NOTE | Omission | The earnings statistics `revenue` vs `receipt` distinction (and commission counted as "owed" regardless of payment state) is not mentioned. Relevant to `pay/state-derivations`. | Record for completeness |

---

## Recommendation

**HOLD for targeted corrections on V-PL-01 and V-PL-02 before Phase 2 spec authoring for `pay/insurance-cascade`.**

The two BLOCKERs are related and stem from the same root cause: Gemini generated a plausible-sounding but incorrect summary of the Verzamelstaat cascade behavior, then wrapped it in fabricated block-quote formatting. This will produce a wrong Gherkin scenario if taken at face value by the spec author.

All other features in the discovery (`pay/patient-manual`, `pay/saas-stripe-sync`, `pay/commission-manual`, `pay/invoice-cancel`, `pay/print-to-status`) are accurately described and can proceed to Phase 2 spec authoring.

Recommended actions before Phase 2:

1. Replace the fabricated quote in the discovery file with the accurate description from `payment_reconciliation.md` (cascade updates certificate insurance state, does NOT recompute `isPaid`; this is a documented reconciliation gap).
2. Add the two-touch `isPaid` gap as a NEEDS CLARIFICATION entry with a product owner question: "Should the Nx implementation automatically recompute `isPaid` when the cascade completes, closing the Meteor gap, or should the existing behavior be preserved as a QUIRK-PRESERVE?"
3. Add a NEEDS CLARIFICATION entry for the commission VAT direction.
4. Add a NEEDS CLARIFICATION entry for the `void` state handling in the Nx UI.
5. Add a note about the `StripeInvoicePrint.jsx` dual-entity business logic for the SaaS invoice spec author.

The remaining CLARIFY and NOTE items are lower priority and can be handled by the Phase 2 spec author during normal spec authoring without re-running discovery.
