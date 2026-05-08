# Debt Collection

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Unpaid invoice tracking, manual reminders.

## Spec contracts (Phase 2)

- **dashboard-widget** — Feature: debt-collection/dashboard-widget
  - Path: `02-specs/debt-collection/dashboard-widget/spec.md`
- **manual-reminder** — Feature: debt-collection/manual-reminder
  - Path: `02-specs/debt-collection/manual-reminder/spec.md`
- **unpaid-filter** — Feature: debt-collection/unpaid-filter
  - Path: `02-specs/debt-collection/unpaid-filter/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/debt-collection.md`)

# Phase 1 Discovery: Debt Collection

- **Area:** #13 Debt Collection
- **Slug:** `debt-collection`
- **Status:** Complete (Sources 1 + 2 + 3)
- **Last Updated:** 2026-04-09

## Executive Summary

Debt Collection in the legacy Halingo app is a lightweight, manual process centered around email reminders. There is no automated escalation, formal notice (ingebrekestelling) automation, or integration with external collection agencies. The system relies on therapists manually identifying unpaid invoices through UI filters and triggering a "Reminder via mail" action. Reminders are tracked in an `emails` collection, allowing therapists to see when a reminder was last sent. The dashboard provides a high-level "Openstaand bedrag" (Open Amount) widget to highlight the practice's total exposure.

## Source 1 — HalingoDoc Audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/invoicing_finances.md` | ~150 | partial | High-level mention of mailing and reminders. |
| Curated | `functional/application_map.md` | ~120 | § 2 comp 13 | Formal area definition. |
| Code-derived | `from_source/features/patient_invoices.md` | ~300 | full | Technical breakdown of the `mailInvoice` method and reminder tracking. |
| Code-derived | `from_source/features/invoices_overview.md` | ~250 | full | UI filters for "Unpaid" and "Open" invoices. |
| Cross-cutting | `from_source/deprecation_list.md` | — | all | No specific deprecations for debt collection. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | all | No bugs identified in reminder delivery. |

### What HalingoDoc covers for this area

HalingoDoc covers the basic manual reminder flow. It describes the `invoices.mail` method and how it handles the `reminder: Boolean` flag. It also highlights that reminders are recorded in the `emails` collection with a specific type (`PATIENT_INVOICE_REMINDER`).

### What HalingoDoc does NOT cover

HalingoDoc does not explicitly confirm the absence of automated cron-based reminders, which was verified via Source 2. It also doesn't detail the email templates used for reminders versus initial dispatches.

### Direct citations worth preserving

> "Accepts reminder: Boolean. Records the dispatch in the emails collection as { entityType: 'PATIENT', type: 'PATIENT_INVOICE_REMINDER', status: 'UNKNOWN', invoiceId, ... }" (`from_source/features/patient_invoices.md`)

> "Reminder via mail action ... flips state to MAILED if not already PAID." (`from_source/features/patient_invoices.md`)

---

## Source 2 — Meteor source slice

### Files read (8 total)

- `app/imports/api/invoices/patientFileInvoices/`
  - `methods.js` — `invoices.mail` and `invoices.edit.state` methods.
  - `patientFileInvoices.js` — `InvoiceStates` and filter definitions.
  - `server/util.js` — `_mailInvoice` core logic.
  - `server/publications.js` — `invoices.open.statistics` publication.
- `app/imports/api/emails/`
  - `emails.ts` — Email schema including `PATIENT_INVOICE_REMINDER` type.
- `app/imports/lib/mails/mailTemplates/invoices/patient/`
  - `MailTemplate1.jsx` — Visual handling of the `reminder` flag.
- `app/imports/startup/server/`
  - `startup.jsx` — Verified only Halingo SaaS subscription crons exist.

### Key symbols per file

- `InvoiceStates.UNPAID`: `patientFileInvoices.js:15` — The state used to filter for debt collection.
- `mailInvoice`: `methods.js:568` — Method accepting `reminder: true` to trigger a reminder.
- `_mailInvoice`: `server/util.js:612` — Server-side implementation of email rendering and dispatch recording.
- `invoices.open.statistics`: `server/publications.js:31` — Aggregates unpaid amounts for the dashboard.

### Discrepancies found vs HalingoDoc

- **No "Overdue" state:** While HalingoDoc mentions tracking overdue status, there is no literal `OVERDUE` state in `InvoiceStates`. "Overdue" is functionally equivalent to `UNPAID` or any non-paid state after a certain (manual) period.
- **Email Statuses:** The `Emails` collection schema has statuses like `DELIVERED` and `OPENED`, but the legacy code only ever writes `UNKNOWN` and never updates it via webhooks.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000/` (Local Meteor)
**Screens visited:** 3 (Dashboard, Financial Overview, Invoices Tab)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/debt-collection/`

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/` | Dashboard | NL | "Openstaand bedrag" widget with total cents and count. | `08-screenshot.png` |
| 2 | `/financial` | Financial Overview | NL | Tabs for "Facturen", "Verzamelstaten", "Commissie". | `06-screenshot.png` |
| 3 | `/financial` | Invoices Tab | NL | Filters for "Open", "Onbetaald", "Gemaild". "More" menu on rows. | `financial-invoices.png` |

### Behavior observed on staging

- **Manual Trigger:** The reminder is hidden inside the `MoreMenu` (triple dots) for each invoice row as "Herinnering via mail".
- **Dashboard Summary:** The dashboard widget provides an immediate look at unpaid patient debt, but clicking it just redirects to the main financial overview.
- **Bulk Reminders:** There is no UI for sending reminders in bulk; they must be sent one by one.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `debt/manual-reminder` | Manual email reminder | docs + source + staging | `patient_invoices.md:380` | `methods.js:568` | `/financial` (More menu) | One-by-one manual dispatch. |
| 2 | `debt/tracking` | Reminder history tracking | docs + source | `patient_invoices.md:380` | `server/util.js:685` | N/A | Recorded in `emails` collection. |
| 3 | `debt/dashboard-widget` | Open bills summary widget | source + staging | `invoicing_finances.md` | `server/publications.js:31` | `/` (Dashboard) | Aggregate sum of unpaid balances. |
| 4 | `debt/unpaid-filter` | Unpaid invoices UI filter | docs + source + staging | `invoices_overview.md` | `patientFileInvoices.js:180` | `/financial` (Filters) | Filter for `isPaid: false`. |
| 5 | `debt/template-variant` | Reminder-specific email header | source | N/A | `MailTemplate1.jsx:155` | N/A | Changes "Factuur" to "Herinneringsfactuur". |

### Feature detail — `debt/manual-reminder`

- **Description:** A therapist can click a button on an unpaid invoice to send a reminder email to the patient with the invoice PDF attached.
- **Found via:** `docs + source + staging`
- **Legacy source file(s):** `app/imports/api/invoices/patientFileInvoices/methods.js:568`
- **HalingoDoc file(s):** `docs/from_source/features/patient_invoices.md:380`
- **Staging screen(s):** `/financial` -> Invoice Row -> More Menu -> "Herinnering via mail"
- **Belgian-specific concerns:** Subject line translates to "Herinneringsfactuur" in NL.
- **QUIRK-PRESERVE candidates:** The system allows sending multiple reminders for the same invoice without any cooling-off period.

---

## Cross-references to other areas

- **#11 Smart Invoicing:** Invoices must be generated first.
- **#16 Patient Communication:** Delivery of emails via `HalingoEmails`.
- **#12 Payment Lifecycle:** Transition from `MAILED` to `PAID`.

---

## [NEEDS CLARIFICATION]

### Q1: Is there a legal requirement for formal notice (ingebrekestelling) formatting in Belgium?
- **Why it matters:** The current reminder is just a copy of the invoice with a "Herinnering" header. Formal escalations often require specific legal text.
- **Sources conflict?** No.
- **What would resolve:** Domain expert review.

### Q2: Why is the `status` field in the `emails` collection always `UNKNOWN`?
- **Why it matters:** Therapists might assume they can see if a reminder was opened or bounced.
- **Sources conflict?** Source has fields but no logic to update them.
- **What would resolve:** Engineering confirmation.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does the RIZIV convention restrict debt collection practices for logopedists?
- **Found in:** N/A.
- **Why it matters:** Some medical conventions have ethical or legal rules about how debt can be collected from patients.
- **What I know:** The current system is very passive.
- **Resolution:** Pending `logopedist-be` skill session.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/full_documentation/invoicing_finances.md
/home/tj/HalingoDoc/docs/from_source/features/patient_invoices.md
/home/tj/HalingoDoc/docs/from_source/features/invoices_overview.md

# Meteor source
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/patientFileInvoices/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/emails/emails.ts
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate1.jsx
```

---

## Verification notes (verbatim from `01-discovery/debt-collection.verification.md`)

# Verification: Debt Collection (#13)

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/debt-collection.md`
- **Verdict:** PASS WITH NOTES (2 BLOCKERs on citation accuracy — no behavioral claims are wrong, but two HalingoDoc line-number citations are fabricated and must be corrected before Phase 2 relies on them as source anchors)

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Feature `debt/manual-reminder` cites `patient_invoices.md:568` as HalingoDoc source | `from_source/features/patient_invoices.md:568` | ✗ | **BLOCKER.** `patient_invoices.md` has only 438 lines. Line 568 does not exist in that file. The number 568 is the line number in the Meteor source file `methods.js` where `mailInvoice` is declared — it was copied into the HalingoDoc column by mistake. |
| 2 | Feature `debt/tracking` cites `patient_invoices.md:685` as HalingoDoc source | `from_source/features/patient_invoices.md:685` | ✗ | **BLOCKER.** `patient_invoices.md` has only 438 lines. Line 685 does not exist. The actual HalingoDoc mention of reminder tracking is at `patient_invoices.md:380` ("Reminder mails are tracked separately in the `emails` collection as `type: "PATIENT_INVOICE_REMINDER"` (`server/util.js:691`)"). The number 685 again appears to be a Meteor source line number leaked into the doc column. |
| 3 | `mailInvoice` method at `methods.js:568` accepts `reminder: Boolean` | `methods.js:568` | ✓ | Confirmed. `mailInvoice = new LoggedInValidatedMethod` begins at line 568. `validate: new SimpleSchema({ ..., reminder: { type: Boolean, optional: true } })` is present at lines 570-573. |
| 4 | `_mailInvoice` implementation at `server/util.js:612` | `server/util.js:612` | ✓ | Confirmed. `const _mailInvoice = function (invoice, reminder) {` is at line 612. |
| 5 | Reminder records `{ entityType: 'PATIENT', type: 'PATIENT_INVOICE_REMINDER', status: 'UNKNOWN', invoiceId, ... }` in `emails` collection | `from_source/features/patient_invoices.md` (general citation) | ✓ | Confirmed from Meteor source `server/util.js:686-695`. The `Emails.insert` block at line 685 writes exactly this shape when `result.success` is true. The `type` field at line 691 conditionally sets `PATIENT_INVOICE_REMINDER` when `reminder` is truthy. |
| 6 | `invoices.open.statistics` publication at `server/publications.js:31` | `server/publications.js:31` | ✓ | Confirmed. `Meteor.publish("invoices.open.statistics", ...)` begins at line 31. |
| 7 | `InvoiceStates.UNPAID` at `patientFileInvoices.js:15` | `patientFileInvoices.js:15` | ✓ | Confirmed. `UNPAID: "unpaid"` is at line 15 within the `InvoiceStates` object. |
| 8 | No `OVERDUE` state exists in `InvoiceStates` | `patientFileInvoices.js` | ✓ | Confirmed. `InvoiceStates` (lines 13-20) defines: OPEN, UNPAID, PARTIALLY_PAID, PRINTED, MAILED, PAID. No OVERDUE. Also no OVERDUE in the HalingoDoc `invoices_overview.md` state machine table. |
| 9 | Feature `debt/unpaid-filter` cites `patientFileInvoices.js:180` and uses `isPaid: false` selector | `patientFileInvoices.js:180` | ~ | **NOTE.** The file location is approximately correct — `PatientFileInvoices.filters` is defined starting at line 175. However the `unpaid` filter (lines 181-184) uses `{ $or: [{ state: InvoiceStates.UNPAID }, { stateInsurance: InvoiceStates.UNPAID }], isCanceled: false }`, NOT `{ isPaid: false }`. The `isPaid: false` selector is used by the dashboard widget publication (`invoices.open.statistics` at `server/publications.js:40`) and the stats aggregation, not by the UI filter. The discovery conflates two different selectors. |
| 10 | Feature `debt/template-variant` cites `MailTemplate1.jsx:155` for "Herinneringsfactuur" | `MailTemplate1.jsx:155` | ✗ | **NOTE.** Line 155 in `MailTemplate1.jsx` is a `<td>` cell style declaration inside the email header block — it has nothing to do with the reminder variant. The conditional `invoice.reminder === true` check that produces the "Herinneringsfactuur" rendering is at **line 188**, not 155. The behavioral claim (that the template changes to "Herinneringsfactuur" on reminder) is directionally correct, but the line citation is wrong. |
| 11 | `emails` collection has `DELIVERED`/`OPENED` statuses but code only ever writes `UNKNOWN` | `emails.ts` (general) | ✓ | Confirmed indirectly. Meteor source `server/util.js:692` writes `status: "UNKNOWN"` unconditionally. HalingoDoc `coverage_matrix.md` item 11 ("Email delivery tracking") lists `SENT/BOUNCED/FAILED/UNKNOWN` as the status values, with only invoice emails tracked. The bugs_and_security_findings.md item "EmailType / EmailStatus TypeScript ↔ SimpleSchema drift" confirms the union types and SimpleSchema allowedValues are inconsistent. No code path was found that updates status to DELIVERED or OPENED. |
| 12 | Coverage matrix row 13 describes Debt Collection as "Partial — reminder email automation only. No escalation, no SMS, no collection agency hooks." | `coverage_matrix.md` row 13 | ✓ | Confirmed. The matrix at line 37 reads: `| 13 | Debt Collection | **Partial** | invoicing_finances.md | Reminder email automation only. No escalation, no SMS, no collection agency hooks.` |
| 13 | HalingoDoc `invoicing_finances.md` provides "high-level mention of mailing and reminders" | `full_documentation/invoicing_finances.md` | ~ | Partially confirmed. The file is 1124 lines (the discovery reads only the first portion which covers matrix printer setup and reimbursement alarm articles). The file does cover invoicing broadly. No specific "reminders" section was found in the first 100 lines read, but the coverage_matrix.md confirms it as the primary source for the area. |
| 14 | No bugs in debt collection per `bugs_and_security_findings.md` | `bugs_and_security_findings.md` | ✓ | Confirmed. The bugs file lists 14 items (4 categories). None relate to the reminder flow, the `emails` collection reminder records, or the dashboard widget. The schema drift item on `EmailType`/`EmailStatus` is a validation gap, not a runtime bug in reminder sending. |
| 15 | No deprecations for debt collection per `deprecation_list.md` | `deprecation_list.md` | ✓ | Confirmed. None of the 22 deprecation entries touch the reminder flow, `_mailInvoice`, `invoices.open.statistics`, or the `emails` collection reminder path. |

---

## Material omissions

The following items are present in cited sources but not mentioned in the discovery file:

1. **`void` state and `isCanceled` filter**: `patientFileInvoices.js` defines a `void` filter (`state: "void", isCanceled: true`) and a `canceled` filter. These affect what "unpaid" actually means in the UI filter context — a `void` invoice would not appear in the `unpaid` filter. The discovery does not mention that `isCanceled: false` is always part of the `unpaid` filter, which is relevant when describing the scope of `debt/unpaid-filter`.

2. **`PARTIALLY_PAID` state**: The state machine (confirmed in HalingoDoc `patient_invoices.md` line 310) includes `PARTIALLY_PAID`. An invoice in `PARTIALLY_PAID` state is not fully paid but also not in the `UNPAID` state. The discovery's description of debt as "UNPAID invoices" slightly understates the picture — `PARTIALLY_PAID` invoices are also outstanding debt and may be visible through the "open" filter. Phase 2 spec authors should decide whether `debt/tracking` covers partially-paid reminders.

3. **`mailInvoice` short-circuits when `state === PAID`**: HalingoDoc `patient_invoices.md` (line 323) notes that `mailInvoice` returns `1` without writing when the invoice is already `PAID`. This is a behavioral guard the discovery does not mention, but it is load-bearing for spec authoring (a reminder cannot be sent to a paid invoice).

4. **`mailInvoice` throws on canceled invoice**: Meteor source `methods.js:585-587` shows `if (invoice.isCanceled) throw new Meteor.Error("invoices.mail.canceled")`. Reminders cannot be sent on canceled invoices. Not mentioned in discovery.

5. **Permission check on `mailInvoice`**: The method checks `invoice.userId !== this.userId && !checkPermission("invoices.edit", ...)` (lines 580-583). A `lid` (default role) can only reminder-mail their own invoices. Not mentioned in the discovery's permission model.

6. **`state` transition on mail**: `mailInvoice` sets `state: InvoiceStates.MAILED` when sending any mail (line 595-597), including a reminder. This means a reminder re-mailing also updates the invoice state. HalingoDoc `patient_invoices.md` (line 323) confirms this. The discovery says "flips state to MAILED if not already PAID" which is correct but the discovery does not flag this as a quirk that interacts with the `UNPAID` filter — after a reminder is sent, the invoice moves from `UNPAID` to `MAILED` and disappears from the `unpaid` filter. This is probably a QUIRK-PRESERVE candidate for Phase 2.

7. **Startup.jsx**: The source 2 section of the discovery lists `startup.jsx` as one of 8 files read, and the discovery correctly states "Verified only Halingo SaaS subscription crons exist." However `startup.jsx` is omitted from the traceability "Files in this slice" list. This is a documentation gap only (the finding is correct).

---

## Cross-area reference check

| Reference | Claim in discovery | Verified? | Finding |
|---|---|---|---|
| #11 Smart Invoicing | "Invoices must be generated first" | ✓ | Accurate and bidirectional. `patient_invoices.md` and `invoices_overview.md` confirm that `mailInvoice` operates on an existing invoice document. The #11 discovery would be expected to reference #13 as a downstream consumer of invoice generation. |
| #16 Patient Communication | "Delivery of emails via `HalingoEmails`" | ✓ | Accurate. `server/util.js:663` calls `HalingoEmails.sendEmail(...)`. The `emails` collection tracking and the `HalingoEmails` transport are documented in `coverage_matrix.md` item 11 ("Email delivery tracking — only invoice emails are tracked"). The #16 area would cover the underlying email delivery mechanism; the cross-reference is directionally correct. |
| #12 Payment Lifecycle | "Transition from `MAILED` to `PAID`" | ✓ | Accurate. `InvoiceStates` confirms MAILED is a valid state before PAID. The state machine diagram in `patient_invoices.md` (lines 306-318) confirms MAILED can transition to PAID via `setState`. |

No bidirectionality issues were found in the three cross-references. However the discovery does not reference **#3 Patient Data Privacy**, which is relevant because the `emails` collection stores patient contact email, `patientFileId`, and `invoiceId` — all personal health-related data. This omission is minor (the data privacy area is confirmed empty in the current codebase per `coverage_matrix.md`) but the Phase 2 spec author should flag the GDPR retention implications for the `emails` collection.

---

## Domain review (logopedist-be skill)

The `logopedist-be` skill was invoked. Reference files consulted: `01-riziv-nomenclature-and-tariffs.md`, `04-recognition-visa-and-professional-bodies.md`, `08-business-tax-and-mutualities.md`, and a full grep of the `references/` directory for debt-collection, ingebrekestelling, aanmaning, and related terms.

| Domain claim | Skill verdict | Finding |
|---|---|---|
| RIZIV convention restricts debt collection practices for logopedists | NOT CONFIRMED — outside skill scope for regulation, but inference possible | The RIZIV convention R/2026-2027 and Article 36 nomenclature govern billing acts and reimbursement eligibility. They do not regulate how practitioners follow up on unpaid patient invoices. No restriction found. The discovery's [NEEDS DOMAIN REVIEW] flag is correctly placed but the answer is likely "no restriction." Flag as **CLARIFY** — require confirmation from a Belgian legal source before Phase 2 encodes this as a firm behavioral guarantee. |
| Deontological constraints on billing reminders | PARTIAL — skill has sourced material on the deontological code | The VVL/UPLF Ethische en Deontologische Code requires "honest billing" and "respect for human dignity and patient autonomy." No specific rule on reminder frequency or mandatory cooling-off periods exists in the skill's sourced material. An aggressive, repetitive reminder cadence would likely be viewed as problematic by the EDC, but no quantified limit is documented. Flag as **CLARIFY**. |
| Belgian rules around ingebrekestelling format for healthcare providers | NOT IN SKILL SCOPE | The skill knowledge pack contains no sourced material on the Belgian Wet betalingsachterstand or WER provisions for B2C healthcare debt. This is a legal question requiring a Belgian lawyer or the VVL legal desk. The discovery's Q1 ("Is there a legal requirement for formal notice formatting?") is correctly flagged as [NEEDS CLARIFICATION]. Flag as **CLARIFY** — do not encode any specific ingebrekestelling format requirement in Phase 2 without legal confirmation. |
| Legally mandated cooling-off periods between reminders | NOT IN SKILL SCOPE | No sourced material found. The Belgian Wet betalingsachterstand (transposing Directive 2011/7/EU) primarily covers B2B; B2C healthcare reminders are governed by general WER rules not covered in the skill. Flag as **CLARIFY**. |
| Halingo's passive reminder approach matches cultural norms | CONSISTENT WITH SKILL CONTEXT | The skill confirms that logopedie has no statutory Order and that disciplinary action for billing conduct is very rare. The absence of any RIZIV or statutory constraint on reminder frequency is consistent with the passive, manual approach documented in the discovery. |

---

## Escalated source checks (Step 4)

Four claims were escalated to direct Meteor source reading.

| # | Claim | Source checked | Finding |
|---|---|---|---|
| E1 | `invoices.mail` method at `methods.js:568` accepts `reminder: true` | `methods.js:550-600` | **Confirmed.** Method declaration begins at line 568. Schema includes `reminder: { type: Boolean, optional: true }`. Server-side body calls `InvoiceUtil.mailInvoice(invoice, reminder)` at line 589 and then `$set: { state: InvoiceStates.MAILED }` at line 596. Short-circuit return of `1` when already `PAID` at line 591-593. |
| E2 | `_mailInvoice` at `server/util.js:612` and reminder tracking in `emails` collection | `server/util.js:600-699` | **Confirmed with precision correction.** `_mailInvoice` begins at line 612. The `Emails.insert` is at line 686, inside `if (result.success) {` at line 685. The `type` field writing `PATIENT_INVOICE_REMINDER` is at line 691 (not 685). Discovery's claim of `server/util.js:685` as the `_mailInvoice` location is wrong — 685 is inside `_mailInvoice`, not where it starts. Start is 612, which the discovery correctly states elsewhere. |
| E3 | No `OVERDUE` state in `InvoiceStates` at `patientFileInvoices.js:13-20` | `patientFileInvoices.js:1-50` | **Confirmed.** States are: OPEN, UNPAID, PARTIALLY_PAID, PRINTED, MAILED, PAID. No OVERDUE. |
| E4 | `MailTemplate1.jsx:155` renders the "Herinneringsfactuur" variant | `MailTemplate1.jsx:140-200` | **Not confirmed at line 155.** Line 155 is a `<td>` style attribute. The reminder conditional is at line 188: `invoice.reminder === true`. The behavioral claim is correct (there is a reminder-specific header variant), but the line citation is wrong by 33 lines. |

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-DC-01 | BLOCKER | Citation — fabricated line number | `patient_invoices.md:568` does not exist (file has 438 lines). Feature table row for `debt/manual-reminder` cites this as the HalingoDoc source anchor. The number 568 is the Meteor `methods.js` line, mistakenly placed in the HalingoDoc column. | Correct in discovery file: replace `patient_invoices.md:568` with `patient_invoices.md:380` (where the `mailInvoice` method behavior is described) before Phase 2 spec authoring. |
| V-DC-02 | BLOCKER | Citation — fabricated line number | `patient_invoices.md:685` does not exist (file has 438 lines). Feature table row for `debt/tracking` cites this as the HalingoDoc source. The correct HalingoDoc reference is `patient_invoices.md:380`. | Correct in discovery file: replace `patient_invoices.md:685` with `patient_invoices.md:380` before Phase 2 spec authoring. |
| V-DC-03 | CLARIFY | Citation — imprecise filter semantics | Feature `debt/unpaid-filter` states the filter uses `isPaid: false`. Actual `PatientFileInvoices.filters.unpaid` (lines 181-184) uses `{ $or: [{ state: UNPAID }, { stateInsurance: UNPAID }], isCanceled: false }`. The `isPaid: false` selector is used by the dashboard widget publication, not the UI filter. These are different: `PARTIALLY_PAID` and `MAILED` invoices have `isPaid: false` but do NOT appear in the `unpaid` filter. Phase 2 spec must decide which selector drives the debt collection view. | Add to discovery file's [NEEDS CLARIFICATION] backlog. Phase 2 spec author must choose between state-based filter (current legacy behavior) and `isPaid: false` aggregate flag. |
| V-DC-04 | NOTE | Citation — wrong line number | `MailTemplate1.jsx:155` cited for "Herinneringsfactuur" header variant. Actual line is 188. Behavioral claim is correct. | Low priority fix: update line number in discovery file to 188. |
| V-DC-05 | NOTE | Omission — behavioral guard | `mailInvoice` throws `invoices.mail.canceled` if the invoice is canceled (`methods.js:585-587`). Discovery does not mention this guard. Load-bearing for spec authoring (the spec must include an error scenario for reminders on canceled invoices). | Add to Phase 2 spec scenario catalog as an error path. |
| V-DC-06 | NOTE | Omission — state transition side effect | Sending a reminder via `mailInvoice` transitions the invoice state from `UNPAID` to `MAILED`. After a reminder the invoice disappears from the `unpaid` filter. This is a QUIRK-PRESERVE candidate. Not mentioned in the discovery. | Flag for Phase 2 spec as QUIRK-PRESERVE: "sending a reminder changes state from UNPAID to MAILED." |
| V-DC-07 | NOTE | Omission — permission scope | `mailInvoice` enforces that a `lid` (default role) can only send reminders for their own invoices (`methods.js:580-583`). Discovery does not describe the permission model for this feature. | Add permission matrix to Phase 2 spec for `debt/manual-reminder`. |
| V-DC-08 | CLARIFY | Domain — ingebrekestelling format | Discovery Q1 asks whether Belgian law requires specific legal text for a formal notice. The `logopedist-be` skill has no sourced material on B2C healthcare ingebrekestelling requirements. Cannot confirm or deny. | Hold Q1 open. Do not encode any ingebrekestelling format requirement in the Phase 2 spec without Belgian legal confirmation (VVL legal desk or specialist lawyer). |
| V-DC-09 | CLARIFY | Domain — cooling-off periods | Discovery Q1 implicitly includes the question of mandatory waiting periods between reminders. The skill has no sourced material on this. | Hold open alongside V-DC-08. |
| V-DC-10 | NOTE | Traceability gap | `startup.jsx` is listed as one of 8 files read in Source 2, and a finding from it is mentioned in the key-symbols section, but it is absent from the "Files in this slice" traceability list. | Minor documentation tidiness: add `startup.jsx` to the traceability list. |
| V-DC-11 | NOTE | Omission — GDPR / data retention for emails collection | The `emails` collection rows inserted by `_mailInvoice` contain `patientFileId`, `email` (patient email), and `invoiceId` — personal health data. The discovery does not cross-reference #3 Patient Data Privacy. | Note for Phase 2: the `emails` collection retention policy is undefined in the legacy codebase. The new spec should define a retention period consistent with the 30-year medical records rule (art. 35 Kwaliteitswet) or a shorter period appropriate for billing correspondence audit trails. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring for this area, with the following preconditions:**

1. **Before Phase 2 starts:** correct V-DC-01 and V-DC-02 (fabricated HalingoDoc line numbers) in the discovery file. The Phase 2 spec author must be told that `patient_invoices.md:380` is the correct anchor for both the `mailInvoice` behavior description and the reminder tracking note. The actual Meteor source line numbers (methods.js:568 and server/util.js:612) are accurate and can be used as Meteor source citations.

2. **CLARIFY items for Phase 2 spec author to resolve before writing Gherkin scenarios:**
   - V-DC-03: Which selector drives the "unpaid" debt collection view — the state-based filter or `isPaid: false`?
   - V-DC-08 / V-DC-09: Belgian legal constraints on ingebrekestelling format and cooling-off periods (consult VVL legal desk or Belgian lawyer).

3. **QUIRK-PRESERVE candidate to encode explicitly:** the `UNPAID → MAILED` state transition triggered by sending a reminder (V-DC-06). This is load-bearing: a practice that sends multiple reminders will see the invoice cycle through MAILED on each send, and the invoice will not appear in the `UNPAID` filter after the first reminder. Phase 2 spec should decide whether to preserve or change this behavior.

The five core behavioral claims of the discovery (manual trigger, reminder tracking in `emails` collection, dashboard widget, no OVERDUE state, `emails` status always UNKNOWN) are **factually correct** and verified against both HalingoDoc and Meteor source. The BLOCKER findings are citation quality issues, not behavioral errors — they do not make the discovery wrong about what the system does, only about where the HalingoDoc describes it.
