# Patient Communication

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Invoice email send + history, template selection.

## Spec contracts (Phase 2)

- **email-history** — Feature: patient-communication/email-history
  - Path: `02-specs/patient-communication/email-history/spec.md`
- **invoice-email-send** — Feature: patient-communication/invoice-email-send
  - Path: `02-specs/patient-communication/invoice-email-send/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/patient-communication.md`)

# Phase 1 Discovery — Area #16 Patient Communication

**Area definition:** Automated and manual communication channels with patients, including invoice delivery, appointment reminders (gap), and email deliverability tracking.
**Competency #16** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Curated | `functional/application_map.md` | — | § 2 competency 16 | Formal area definition |
| Code-derived | `from_source/features/email_delivery.md` | 120 | full | AWS SES integration, `emails` collection, delivery tracking gaps |
| Code-derived | `from_source/features/email_templates.md` | 80 | full | React-based email templates, practice selection |
| Cross-cutting | `from_source/deprecation_list.md` | — | #1, #2, #18, #20 | `practiceChat` (fire), `users.delete` (fire), `practice.settings.invoices.locale` (legacy) |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | — | Email status schema inconsistencies, typo in regex constants |
| Helpdesk | `full_documentation/settings_practice_management.md` | — | §§ Email settings | Template selection overview |
| Helpdesk | `full_documentation/invoicing_finances.md` | — | §§ Mailing invoices | Manual invoice reminder flow |

### What HalingoDoc covers for this area

HalingoDoc identifies that patient communication is primarily limited to transactional emails sent via AWS SES. It documents the `emails` collection which persists records of sent patient invoices and reminders. It flags a major gap: no automated appointment reminders or SMS capabilities exist in the legacy app. It also notes that while email templates are React components, only four hardcoded versions are available for selection, with no end-user authoring capability.

### What HalingoDoc does NOT cover

HalingoDoc does not explicitly detail the "commented-out" state of the email history UI in the patient file, which was only discovered during the source code review. It also does not cover the specific i18n keys for email subjects across different locales.

### Direct citations worth preserving

> "Halingo sends transactional email via AWS Simple Email Service (SES) through a thin HalingoEmails façade... All other transactional email... is fire-and-forget and is not persisted." — `from_source/features/email_delivery.md:8-12`

> "No code path anywhere in the repo calls Emails.update... Rows are only ever inserted with status: 'UNKNOWN' and are never updated." — `from_source/features/email_delivery.md:45-48`

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/emails/`
  - `emails.ts` — `Emails` collection, schema with duplicate `BOUNCED` value and missing `DELIVERED`/`OPENED` status support
  - `methods.ts` — `patientFile.view.emails` method (fetch only)
- `app/imports/lib/mails/server/`
  - `mails.tsx` — `HalingoEmails` façade using `fibers/future` for sync/async toggle
  - `aws-ses.tsx` — AWS SDK v3 wrapper for SES
- `app/imports/api/invoices/patientFileInvoices/server/`
  - `util.js` — `_mailInvoice` function, the sole entry point for `Emails.insert`
- `app/imports/modules/patientfiles/tabs/`
  - `PatientFileTabs.jsx` — **Confirmed discovery:** "Emails" tab is commented out in code
- `app/imports/lib/mails/mailTemplates/invoices/patient/`
  - `MailTemplate1.jsx` through `MailTemplate4.jsx` — React-based server-side rendered templates
- `app/imports/api/treatments/server/`
  - `TreatmentSessionObserver.js` — Confirmed: only sends in-app therapist notifications

### Key symbols per file

- `Emails` (`api/emails/emails.ts:7`) — Persistence for invoice-related patient emails
- `HalingoEmails` (`lib/mails/server/mails.tsx:9`) — Singleton façade for all mail sending
- `_mailInvoice` (`api/invoices/patientFileInvoices/server/util.js:612`) — Orchestrates PDF generation and email delivery
- `PatientEmailsOverview` (`modules/patientfiles/emails/patient-emails-overview.tsx`) — Disconnected UI component for history

### Discrepancies found vs HalingoDoc

- **UI Gaps:** HalingoDoc implied per-patient email history was visible; source review confirmed the tab is commented out in `PatientFileTabs.jsx:125-128`.
- **Observer Scope:** HalingoDoc correctly noted no patient reminders; source review confirmed `TreatmentSessionObserver` targets internal `Notifications` only.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000`
**Screens visited:** 3 (Login, Practice Settings, Patient Detail)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/patient-communication/`

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/login` | Login | NL | Standard login | `01-login.png` |
| 2 | `/practices/settings` | Settings | NL | "Facturatie" accordion (inner fields hard to reach via script) | `01-practice-settings.png` |
| 3 | `/patients/:id` | Patient Info | NL | No "E-mails" tab visible (matches source find) | `02-patient-detail.png` |

### Behavior observed on staging

- **UI Confirmation:** The patient file tabs definitively lack an "E-mails" or "Communicatie" section, validating the source code find that the feature is disabled.
- **Manual Reminders:** The invoice list includes an "email" icon action which triggers the `invoices.mail` method.

### Screens not reached (and why)

- **Email Delivery Tracking:** No UI exists for this feature in the legacy app.
- **Automated Reminders:** No UI or background job exists for this feature.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `communication/invoice-mail` | Manual Invoice Mailing | docs + source + staging | `invoicing_finances.md` | `util.js:612` | Invoice Actions | Sync delivery; attaches PDF |
| 2 | `communication/invoice-reminder` | Manual Invoice Reminder | docs + source + staging | `invoicing_finances.md` | `util.js:612` | Invoice Actions | Uses `reminder: true` flag |
| 3 | `communication/practice-branding` | Email Reply-To Branding | source | `email_delivery.md` | `mails.tsx:18` | Settings | Injects practice email into `replyTo` |
| 4 | `communication/templates` | Hardcoded Email Templates | docs + source | `email_templates.md` | `MailTemplate1.jsx` | Settings | 4 React templates; no user editing |
| 5 | `communication/custom-body` | Custom Email Body Text | docs + source | `email_templates.md` | `MailTemplate1.jsx:165` | Settings | Persisted in `practice.settings.invoices.mail.text` |
| 6 | `communication/history-tracking` | Sent Email Logging | docs + source | `email_delivery.md` | `emails.ts` | N/A | **QUIRK:** persisted but UI is disabled |

---

## Cross-references to other areas

- **#11 Smart Invoicing:** Patient Communication is tightly coupled with the invoicing lifecycle.
- **#1 Identity Management:** Password reset and verification emails use the same `HalingoEmails` façade but are not persisted.
- **#3 Patient Data Privacy:** Email history contains PII and health-data metadata (invoice links).

---

## [NEEDS CLARIFICATION]

### Q1: Should the "Emails" tab be re-enabled in the migration?
- **Why it matters:** The code exists in legacy but is disabled. We need to know if this is an intentional product decision or a feature that was "parked".
- **What would resolve:** Product owner decision.

### Q2: Is the "UNKNOWN" status on all emails a known bug?
- **Why it matters:** Affects parity requirements for delivery tracking.
- **What would resolve:** Verification if any production job or webhook ever updates the `emails` collection.

---

## [NEEDS DOMAIN REVIEW]

### Q: Are there Belgian requirements for logging patient "no-show" communications?
- **Found in:** `user_stories.md` (US.06)
- **Why it matters:** Regulatory compliance for clinical record completeness.
- **What I know:** `logopedist-be` skill confirms medical records must be kept for 30 years (Art. 35 Kwaliteitswet), but doesn't specify if every *reminder* email must be in the dossier.

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/from_source/features/email_delivery.md`
- `/home/tj/HalingoDoc/docs/from_source/features/email_templates.md`
- `/home/tj/HalingoDoc/docs/from_source/deprecation_list.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/emails/emails.ts`
- `/home/tj/Repos/Halingo-Main/app/imports/lib/mails/server/mails.tsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/tabs/PatientFileTabs.jsx`
- `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`

---

## Verification notes (verbatim from `01-discovery/patient-communication.verification.md`)

# Verification: Patient Communication (Area #16)

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/patient-communication.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "Halingo sends transactional email via AWS SES through a thin HalingoEmails façade... All other transactional email... is fire-and-forget and is not persisted." (lines 8-12 of `email_delivery.md`) | `from_source/features/email_delivery.md` | ~ | Paraphrase is accurate but line attribution is imprecise. The actual prose begins at line 7 of `email_delivery.md`, not line 8. The quoted text is a condensation, not verbatim; the source file says "fire-and-forget and is **not** persisted in the `emails` collection." The substance is correct. |
| 2 | "No code path anywhere in the repo calls Emails.update... Rows are only ever inserted with status: 'UNKNOWN' and are never updated." (lines 45-48) | `from_source/features/email_delivery.md` | ✓ | Verbatim quote confirmed at line 47 of `email_delivery.md`. |
| 3 | `emails` collection has `DELIVERED`/`OPENED` status fields but only `UNKNOWN` is ever written; duplicate `BOUNCED` value | `from_source/features/email_delivery.md` + `from_source/bugs_and_security_findings.md` | ✓ | Confirmed by direct source read of `emails.ts`: `allowedValues: ["SENT", "BOUNCED", "BOUNCED", "FAILED", 'UNKNOWN']` — `DELIVERED` and `OPENED` are in the TypeScript union type but absent from the schema's `allowedValues`. Duplicate `BOUNCED` confirmed at line 32. The bugs file also documents this at "EmailType / EmailStatus TypeScript ↔ SimpleSchema drift". |
| 4 | "Emails" tab is commented out in `PatientFileTabs.jsx:125-128` | Meteor source `PatientFileTabs.jsx` | ~ | Confirmed as commented out, but the line numbers are wrong. The actual commented-out block is at lines 134-137, not 125-128. Discovery cites the wrong lines. The substance (tab is commented out) is correct. |
| 5 | `HalingoEmails` façade uses `fibers/future` for sync/async toggle | `lib/mails/server/mails.tsx:9` | ✓ | Confirmed. `Future` from `fibers/future` is imported at line 4; the `new Future()` pattern is at line 38; `options.async` toggle at line 58-64. |
| 6 | `replyTo` branding claim: practice email injected into `replyTo` (`mails.tsx:18`) | `lib/mails/server/mails.tsx:18` | ✓ | Confirmed. Lines 18-20 show `replyTo: options.from ? { address: options.from.email, name: options.from.name } : { address: "no-reply@halingo.be", name: "Halingo" }`. Line 18 is accurate. |
| 7 | Only 4 hardcoded React email templates, no user editing | `from_source/features/email_templates.md` | ✓ | Confirmed. File documents `MailTemplate1` through `MailTemplate4` as the exhaustive set. Quote from the source: "There is no in-app template editor, no rich-text mail editor, no per-email authoring." |
| 8 | `_mailInvoice` is the sole entry point for `Emails.insert`, cited at `util.js:612` | `api/invoices/patientFileInvoices/server/util.js:612` | ~ | The function definition for `_mailInvoice` begins at line 612 (confirmed). However, the actual `Emails.insert` call occurs at lines 686-695 inside that function — `email_delivery.md` correctly documents this as line 686. The discovery's `:612` refers to the function start, not the insert site. HalingoDoc's line 51 says "The only place that inserts into `Emails` is `util.js:686-696`". Both are accurate for different parts of the same function, but the discovery should clarify. |
| 9 | `TreatmentSessionObserver` targets internal Notifications only | `api/treatments/server/TreatmentSessionObserver.js` | ✓ | Confirmed by HalingoDoc's `email_delivery.md` table of all `HalingoEmails.sendEmail` call sites — `TreatmentSessionObserver.js` is not listed. Discovery conclusion is correct. |
| 10 | `communication/practice-branding` — From address is always `no-reply@halingo.be`; per-practice branding goes into `replyTo` | `email_delivery.md` + `mails.tsx` | ✓ | Confirmed in both sources. `email_delivery.md` says "From is always no-reply@halingo.be. Per-practice branding is put into replyTo instead". Source confirmed at `mails.tsx:14-16`. |
| 11 | Deprecation list items #1, #2, #18, #20 cited as relevant | `from_source/deprecation_list.md` | ~ | Items exist and are as described (practice chat, users.delete, invoice locale, team_meetings). However, #1, #2, and #20 have no direct relevance to patient communication; only #18 (locale rule for invoice emails) is load-bearing. The discovery uses them for context on i18n/locale handling but the connection is not explained. Low severity. |
| 12 | `application_map.md` § 2 competency 16: "Automated email notifications for appointments and invoices" | `functional/application_map.md` | ~ | The application map description is optimistic/aspirational — it says "Automated email notifications for **appointments** and invoices" but no appointment notification mechanism exists in the codebase. The discovery correctly identifies this gap, but does not explicitly flag that the `application_map.md` definition for area #16 overstates the current functionality. This is a material omission within the discovery's own claim validation. |
| 13 | Custom body text persisted in `practice.settings.invoices.mail.text` | `email_templates.md` | ✓ | Confirmed. Source: `practice.settings.invoices.mail.text` documented in the data model section of `email_templates.md`, and `MailTemplate1.jsx:232` inserts this field. |

---

## Material omissions

The following features or behaviors are present in the cited sources but either missing from or inadequately represented in the discovery file:

**M1 — Invoice mail requires `practice.settings.invoices.mail.text` to be set (hard gate)**
`email_delivery.md` and the verified source read of `util.js` make clear that `_mailInvoice` throws `"invoices.mail.noText"` if `practice.settings.invoices.mail.text` is not set. This is a precondition for the entire `communication/invoice-mail` feature. The discovery documents the custom body text as a feature (`communication/custom-body`) but does not note that it is a *required* precondition for invoice mailing — skipping the settings step makes invoice mailing fail silently. The Phase 2 spec for `communication/invoice-mail` must capture this dependency.

**M2 — Two distinct `from` address strategies depending on practice invoice type**
The `_mailInvoice` source code (lines 631-650) branches on `practice.settings.invoices.type === Practices.invoiceTypes.MEMBER`: if MEMBER, the from/replyTo is the individual therapist's name and email; otherwise it is the practice name and practice contact email. The discovery's `communication/practice-branding` feature describes only the `replyTo` mechanism generically, without capturing this branching logic. The distinction between MEMBER invoicing mode and practice-level invoicing mode is load-bearing for spec authoring.

**M3 — `X-SES-CONFIGURATION-SET` header and the incomplete SNS webhook pipeline**
`email_delivery.md` documents that a `X-SES-CONFIGURATION-SET` header is sent on every email, meaning AWS SES publishes bounce/complaint/delivery/open events to an SNS topic. There is no HTTP route in the legacy app to ingest these events, so the status update pipeline is structurally incomplete rather than simply unimplemented. The discovery notes the UNKNOWN status but does not capture the SNS-side infrastructure context. This matters for the Phase 2 spec on `communication/history-tracking` — the spec author needs to decide whether to implement the SNS webhook in the new app.

**M4 — `PatientEmailsOverview` and `EmailStatusIcon` as disconnected UI components**
The discovery mentions `PatientEmailsOverview` as a "Disconnected UI component for history" but does not note that `EmailStatusIcon` (at `modules/patientfiles/emails/email-status-icon.tsx`) is a fully implemented companion component that already handles the `DELIVERED`, `BOUNCED`, `FAILED`, `OPENED`, and `UNKNOWN` status states — all four non-UNKNOWN branches are currently dead code. This informs the spec for `communication/history-tracking`: the icon component exists and can be ported, but three of its five states will never activate under current data.

**M5 — No retry queue on failed sends**
`email_delivery.md` explicitly notes: "No retry queue. A failed `_sendEmail` returns `{success: false}`, the invoice row never gets inserted, and nothing retries." The discovery does not surface this as a behavioral characteristic of the send mechanism. It is relevant for spec authoring under `communication/invoice-mail`.

**M6 — Async send path returns success regardless of actual delivery outcome**
`email_delivery.md` notes that async sends (non-invoice emails) always return `{success: true}` to the caller, even on failure. The discovery correctly notes invoice mailing is sync, but the full behavioral contract of the async path is not captured. This affects the scope decision for `communication/history-tracking`.

**M7 — `application_map.md` area 16 definition overstates current capability**
Competency 16 is defined as "Automated email notifications for appointments **and** invoices." No automated appointment notification exists. The discovery correctly identifies the gap (no automated reminders) but does not explicitly flag that the area's own definition in `application_map.md` is aspirational, not descriptive of the current state. This distinction matters for scope decisions.

---

## Cross-area reference check

| Cross-reference | Claimed by discovery | Accuracy | Bidirectional? | Finding |
|---|---|---|---|---|
| #11 Smart Invoicing | "Patient Communication is tightly coupled with the invoicing lifecycle" | ✓ Accurate | Cannot verify — #11 discovery not read as part of this verification | The coupling is real: `_mailInvoice` is in the invoicing util file, called from invoice methods. Bidirectionality should be confirmed when #11 is verified. |
| #1 Identity Management | "Password reset and verification emails use the same HalingoEmails façade but are not persisted" | ✓ Accurate | Cannot verify — #1 discovery not read | Confirmed by `email_delivery.md` table of call sites (api/users/server/util.jsx:35, :52, :95 — all fire-and-forget). |
| #3 Patient Data Privacy | "Email history contains PII and health-data metadata (invoice links)" | ✓ Accurate | Cannot verify — #3 discovery not read | The `emails` collection stores patient email address, invoice ID, and sentAt timestamp. Invoice links would reveal financial details tied to RIZIV codes. The PII/health-metadata claim is correct. |

No bidirectional verification was possible within this verification session since the cross-referenced discovery files were not read. The Phase 2 spec author should confirm these references are bidirectional when reviewing areas #1, #3, and #11.

---

## Domain review (logopedist-be skill)

**Reference consulted:** `/home/tj/.claude/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`

### D1 — Belgian requirements for logging patient communications in the medical dossier

The discovery raises a `[NEEDS DOMAIN REVIEW]` question: "Are there Belgian requirements for logging patient 'no-show' communications?"

**Skill finding:** Art. 33 of the Kwaliteitswet defines the required contents of the patient dossier. The enumerated elements (prescription, bilan, session notes, correspondence with GP/school/mutuality/RIZIV, consent forms, care plan) do not include invoice emails or billing reminder correspondence. The 30-year retention obligation under art. 35 Kwaliteitswet applies to the *patiëntendossier* as defined in art. 33.

However, art. 33 does include "correspondence with ... mutuality" which might extend to billing-related correspondence if it pertains to RIZIV reimbursement decisions. Invoice-to-patient emails (the B2C channel) are not "correspondence with the mutuality" — they are administrative-financial communications. The skill's §15 explicitly distinguishes: "Billing data follows a **separate** regime" from clinical data, with a 10-year retention obligation (not 30 years) under BTW/tax law.

**Assessment on no-show communications:** The skill provides no authority establishing that no-show reminder emails must be retained in the patient dossier. No-show communications are administrative (not clinical) in nature. The 30-year rule applies to the clinical dossier; there is no identified authority requiring no-show notifications to be part of it.

**Verdict: CLARIFY** — The discovery's NEEDS DOMAIN REVIEW question about no-show communications is correctly flagged. The skill confirms: invoice emails are not part of the 30-year clinical dossier requirement. No-show reminders are even further removed. However, the discovery does not ask the more precise question raised by the source code: does the `emails` collection (which persists invoice email metadata) need to be retained for 10 years as billing correspondence? The skill's §15 implies yes — invoice emails are billing records subject to 10-year retention, not 30-year clinical retention. This distinction should be surfaced for the spec author.

### D2 — Whether invoice reminder emails must be retained as part of the patient dossier under Kwaliteitswet

**Skill finding:** Directly addressed by §15 of `07-gdpr-and-patient-rights.md`. Invoice emails/reminders are *billing data*, not *clinical data*. The 10-year retention rule (tax/BTW law, extended from 7 years by the wet of 20 November 2022) applies. They are not part of the 30-year patiëntendossier under Kwaliteitswet.

**Verdict:** The discovery's implicit assumption (that email logging may be a clinical record requirement) is not correct. Invoice emails are administrative-financial records, subject to 10-year accounting retention, not 30-year clinical retention. This is a **NOTE** — the discovery doesn't assert this incorrectly, but the spec for `communication/history-tracking` should distinguish between clinical and financial retention.

### D3 — Deontological rules from the Belgian logopedist professional order about patient billing communications

The skill does not document specific VVL/UPLF deontological rules about the content or form of patient billing communications beyond what is required by patient rights law (art. 9 §3 Patientenrechtenwet — right to a copy, first copy free). No specific prohibition or requirement about billing emails was identified.

**Verdict: CLARIFY** — Cannot confirm or contradict from primary sources. The spec author should verify with VVL/UPLF whether there are professional ethics guidelines governing the content of invoice emails (e.g., required mention of complaints procedure, privacy notice, etc.).

### D4 — Whether "no-show" communication logging is a regulatory requirement

**Skill finding:** Art. 33 Kwaliteitswet enumerates the dossier contents. No-show communications do not appear in this list. The skill does not identify any Belgian authority (RIZIV, FOD Volksgezondheid, GBA, VVL, UPLF) that mandates logging no-show communications as part of the patient record.

**Verdict: NOTE** — No regulatory requirement found. The discovery's NEEDS DOMAIN REVIEW is answered: no-show communication logging is not mandated by Belgian healthcare regulation. It may be good practice (audit trail for RIZIV disputes about session counts) but is not a compliance requirement. This can be noted in the spec as a practice recommendation rather than a regulatory requirement.

---

## Escalated source checks (Step 4)

Three claims were escalated to direct Meteor source reads.

### SC-1 — `emails.ts` schema: duplicate BOUNCED, DELIVERED/OPENED absent (load-bearing for `communication/history-tracking`)

**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/api/emails/emails.ts` (full file, 39 lines)

**Finding:** VERIFIED CORRECT.
- Line 22: `EmailStatus = "SENT" | "DELIVERED" | "BOUNCED" | "FAILED" | 'OPENED' | "UNKNOWN"` — TypeScript type includes DELIVERED and OPENED.
- Line 32: `allowedValues: ["SENT", "BOUNCED", "BOUNCED", "FAILED", 'UNKNOWN'] as EmailStatus[]` — schema `allowedValues` has duplicate BOUNCED and is missing DELIVERED and OPENED.
- Lines 8-18: deny-all insert/update/remove confirmed.
- The discovery's claim that "status fields exist but only UNKNOWN is ever written" is consistent with the schema — inserting DELIVERED or OPENED would fail validation.

No discrepancy found. Discovery claim is accurate.

### SC-2 — `mails.tsx` lines 9-18: `HalingoEmails` facade and `replyTo` branding (load-bearing for `communication/practice-branding`)

**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/lib/mails/server/mails.tsx` (full file, 74 lines)

**Finding:** VERIFIED CORRECT WITH NUANCE.
- `HalingoEmails` is defined at line 10 (not line 9 as discovery claims, but close enough to not be material).
- `replyTo` is at lines 18-20, not 18 alone. The discovery says "mails.tsx:18" — accurate, since line 18 begins the replyTo block.
- The `fibers/future` import is at line 4; `new Future()` at line 38; the sync/async toggle at line 58.
- Discovery claim about sync mode for invoice sending (so `Emails.insert` can gate on `result.success`) is confirmed by the code structure.
- One additional finding not in the discovery: `HalingoEmails.sendEmail` is a no-op when `Meteor.isTest` is true (line 69). This means all email sending is bypassed in the test environment. This is relevant for the Phase 2 spec's test strategy but not a BLOCKER.

### SC-3 — `PatientFileTabs.jsx` lines 125-128: commented-out Emails tab (load-bearing for `communication/history-tracking` QUIRK)

**Source read:** Grep of `PatientFileTabs.jsx` for email-related content

**Finding:** VERIFIED WITH LINE NUMBER CORRECTION.
- The commented-out block is at lines 134-137, not lines 125-128 as the discovery states.
- Content: `// { component: () => <PatientEmailsOverview patientFileId={patientFile._id} />, // title: "patient.emails.title", // },`
- `PatientEmailsOverview` is imported at line 16 (the import is live, only the tab registration is commented out).
- The substance of the discovery claim is correct; only the line citation is wrong.

This is a **NOTE** — the wrong line numbers will not affect Phase 2 spec authoring but could cause confusion during a targeted source re-read.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-PC-01 | NOTE | citation | Discovery quotes `email_delivery.md:8-12` but the prose begins at line 7; also the quote is a condensation, not verbatim. Substance is accurate. | Record for traceability; no spec impact. |
| V-PC-02 | NOTE | citation | `PatientFileTabs.jsx:125-128` is cited for commented-out Emails tab; actual lines are 134-137. Import line 16 is live. | Correct the line reference before Phase 2 spec authoring targets this file. |
| V-PC-03 | NOTE | citation | `_mailInvoice` cited as `util.js:612` (function start); the `Emails.insert` call is at `util.js:686-695`. Both are defensible descriptions of different locations in the same function. `email_delivery.md` cites the insertion site (:686). | Add clarification in spec: `:612` is function definition; `:686` is the insert. |
| V-PC-04 | NOTE | citation | Deprecation items #1, #2, #20 cited as relevant to patient communication but connection to i18n/locale is not explained. Only #18 is directly load-bearing. | Clarify rationale in spec; no behavioral impact. |
| V-PC-05 | CLARIFY | omission | `practice.settings.invoices.mail.text` is a **hard precondition** for invoice mailing — `_mailInvoice` throws `invoices.mail.noText` if it is absent. Discovery documents this as a feature (`custom-body`) but not as a blocking precondition for `invoice-mail`. | Phase 2 spec for `communication/invoice-mail` MUST capture this dependency with a Gherkin negative scenario: "when mail text is not configured, sending fails with invoices.mail.noText." |
| V-PC-06 | CLARIFY | omission | Two distinct `from`/`replyTo` strategies based on `practice.settings.invoices.type === MEMBER` (individual therapist) vs. practice-level. Discovery describes only the generic `replyTo` mechanism. This branching is load-bearing for `communication/practice-branding` spec. | Add this branching to the feature catalog and spec for `communication/practice-branding`. |
| V-PC-07 | CLARIFY | omission | The SNS webhook pipeline context is missing: the `X-SES-CONFIGURATION-SET` header means AWS SES is already tracking events; there is no inbound SNS endpoint. The spec author for `communication/history-tracking` needs to decide: implement the webhook or close the gap differently. | Add as a NEEDS CLARIFICATION block for the spec author. |
| V-PC-08 | CLARIFY | omission | `EmailStatusIcon` component (dead code in three of its five branches) is not mentioned. Port decision for this component affects `communication/history-tracking` spec. | Note in spec that the icon component exists and can be ported; three non-UNKNOWN states are dead code pending SNS integration. |
| V-PC-09 | CLARIFY | omission | No retry queue on failed sends — discovery does not capture this behavioral characteristic. Relevant for `communication/invoice-mail` spec (what happens when SES rejects the message?). | Spec should include a Gherkin negative scenario covering send failure. |
| V-PC-10 | CLARIFY | domain | Invoice emails are billing records subject to **10-year** accounting retention, not 30-year clinical retention. The discovery's NEEDS DOMAIN REVIEW question conflates clinical dossier requirements with billing retention. The `emails` collection falls under the 10-year rule. | Spec for `communication/history-tracking` must set data retention category to "financial record / 10 years" not "clinical record / 30 years." |
| V-PC-11 | NOTE | domain | No-show communications are not mandated by Belgian regulation to be part of the patient dossier. The discovery's NEEDS DOMAIN REVIEW question is answered: this is good practice but not a regulatory requirement. | Remove from NEEDS DOMAIN REVIEW; note as practice recommendation in spec. |
| V-PC-12 | CLARIFY | domain | VVL/UPLF deontological rules on patient billing communications (required mentions, privacy notice in invoice emails) are not covered by the skill. May have implications for email template content. | Spec author should verify with VVL or UPLF before finalizing email template feature requirements. |
| V-PC-13 | NOTE | traceability | Discovery lists only 7 files in the Traceability section but claims 12 files were read in Source 2. Absent: `methods.ts`, `aws-ses.tsx`, `util.js`, `MailTemplate1-4.jsx` (4 files), `TreatmentSessionObserver.js`, `bugs_and_security_findings.md`, `settings_practice_management.md`, `invoicing_finances.md`, `application_map.md` — approximately 10 files missing from traceability. | Record for audit completeness. No spec impact — the claims derived from these files were verified correct. |
| V-PC-14 | NOTE | citation | `HalingoEmails` module path cited as `mails.tsx:9`; actual singleton export begins at line 10. Immaterial but imprecise. | No action required. |
| V-PC-15 | NOTE | omission | `HalingoEmails.sendEmail` is a no-op in test mode (`Meteor.isTest`, line 69). Not mentioned in discovery. Relevant for test strategy in Phase 3. | Note in Phase 3 test-author session: parity tests cannot exercise `HalingoEmails` directly against the legacy app; must use the staging UI. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring**, with the following mandatory resolutions before or during spec authoring:

1. **Required for `communication/invoice-mail` spec:** Add the `invoices.mail.noText` hard precondition (V-PC-05) and the no-retry behavior (V-PC-09) as explicit Gherkin negative scenarios.

2. **Required for `communication/practice-branding` spec:** Add the MEMBER-vs-practice invoice type branching for `from`/`replyTo` (V-PC-06) as a separate scenario pair.

3. **Required for `communication/history-tracking` spec:** (a) Clarify the SNS webhook gap and ask the product owner whether to implement it in the new app (V-PC-07). (b) Set retention category as "financial record / 10 years" not clinical (V-PC-10). (c) Document `EmailStatusIcon` port status (V-PC-08).

4. **Recommended before spec authoring:** Verify with VVL/UPLF whether invoice emails require specific mandatory mentions (V-PC-12).

The CLARIFYs (V-PC-05 through V-PC-10, V-PC-12) should all be added to the `[NEEDS CLARIFICATION]` backlog for this area. No BLOCKERs were found — no claim in the discovery is factually wrong in a way that would produce an incorrect spec. The NOTEs are cosmetic and do not affect Phase 2 correctness.
