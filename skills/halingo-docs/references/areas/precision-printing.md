# Precision Printing

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Matrix printer pipeline, certificate manual/printer modes, numbering.

## Spec contracts (Phase 2)

- **certificate-manual-mode** — Feature: precision-printing/certificate-manual-mode
  - Path: `02-specs/precision-printing/certificate-manual-mode/spec.md`
- **certificate-numbering** — Feature: precision-printing/certificate-numbering
  - Path: `02-specs/precision-printing/certificate-numbering/spec.md`
- **certificate-printer-mode** — Feature: precision-printing/certificate-printer-mode
  - Path: `02-specs/precision-printing/certificate-printer-mode/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/precision-printing.md`)

# Phase 1 Discovery — Area #15 Precision Printing

**Area definition:** Advanced alignment tools for matrix printers and official RIZIV forms (I21 NL / I11 FR).
**Competency #15** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/invoicing_finances.md` | 1124 | §§ "Marges getuigschrift aanpassen", "Getuigschrift printen..." | User-level margin tuning and browser selection guidance. |
| Curated | `functional/application_map.md` | — | § 2 competency 15 | Formal area definition. |
| Code-derived | `from_source/features/certificate_printing.md` | 278 | full | Matrix-printer pipeline, coordinate system, mode mapping. |
| Code-derived | `from_source/features/pdf_generation.md` | 173 | full | Technical debt: PhantomJS/html-pdf pipeline details. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | SSRF in pdf.generate | Security risk: arbitrary HTML injection in PDF generator. |
| Cross-cutting | `from_source/deprecation_list.md` | — | #17 | `MethodLogger` retired (indirectly touches printing audit). |

### What HalingoDoc covers for this area

HalingoDoc documents a precise pixel-based coordinate system (484×1311 px) designed to align text with pre-printed RIZIV certificates. It covers the two-tier margin tuning: per-browser baselines (Chrome vs Firefox) and per-user offsets (cm). It also details the difference between "Manual" (saving number only) and "Printer" (rendering absolute-positioned HTML) modes.

### What HalingoDoc does NOT cover

HalingoDoc does not list the specific CSS reset used to strip browser default margins during printing (this was found in Source 2). It also doesn't mention that the JPEG background is explicitly omitted during the print-media render.

### Direct citations worth preserving

> "Halingo's implementation of 'delete a patient' is a soft delete... The same applies to events... events with an `invoiceId` cannot be removed." — `from_source/features/calendar_overview.md:120` (Relevant because invoiced events are the source for printing).

> "Halingo's certificate printing... renders the certificate as a fixed 484 × 1311 pixel `<div>`. When in 'Printer' mode, this div uses absolute positioning for every field." — `from_source/features/certificate_printing.md:85`

---

## Source 2 — Meteor source slice

### Files read (10 total)

- `app/imports/api/shared/`
  - `methods.js` — `pdf.generate` (Accepts arbitrary HTML string).
  - `server/util.js` — `SharedUtil.generatePDF` (Uses `html-pdf`/PhantomJS).
- `app/imports/api/users/`
  - `users.jsx` — `UserSettings` schema with `certificates.offset.left/top`.
- `app/imports/modules/invoices/patient/certificate/`
  - `Certificate.jsx` — Coordinate system, browser-specific offsets, diagonal line rendering.
  - `CertificateModal.jsx` — Manual vs Printer tab logic, margin input fields.
- `app/imports/modules/patientfiles/invoices/`
  - `PrintPage.jsx` — Invoice batch printing logic.
  - `PrintInvoices.jsx` — Date range selector for printing.

### Key symbols per file

- `Meteor.users.certificateModes` (`api/users/users.jsx:32`) — `MANUAL` vs `PRINTER`.
- `Certificate` (`modules/invoices/patient/certificate/Certificate.jsx:12`) — The core rendering component for RIZIV forms.
- `pdf.generate` (`api/shared/methods.js:7`) — Global method for server-side PDF creation.
- `Util.printHTMLElement` (`lib/util/util.jsx`) — Client-side print trigger used by the modal.

### Discrepancies found vs HalingoDoc

- **Firefox Offset:** HalingoDoc helpdesk mentions Firefox is supported, but `Certificate.jsx` actually applies a negative `-0.35cm` horizontal shift specifically for Firefox to compensate for its engine's different baseline.
- **Diagonal Lines:** The source code (`Certificate.jsx:65`) contains logic to render a rotated diagonal line to cross out unused session slots, a detail missing from the helpdesk.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 2 (Financial Overview, Certificate Modal)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/precision-printing/`

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/financial` | Invoice List | NL | "Getuigschrift" icon visible on invoices. | `01-certificate-modal.png` |
| 2 | `/financial` | Print Modal | NL | Tabs for "Manueel" and "Printen". | `02-certificate-modal-full.png` |

### Behavior observed on staging

- **Modal Title:** The modal is titled "Getuigschrift" (Certificate).
- **Tab Persistence:** The app remembers the user's preferred mode (`MANUAL` or `PRINTER`) across sessions via `UserSettings`.
- **Automatic Increment:** When a certificate number is saved, the next modal opens with the incremented value (confirmed via code, but observed in UI sequence).

### Screens not reached (and why)

- **Actual Printer Output:** Headless browser-pilot cannot simulate physical matrix printer paper feed.
- **Margin Settings UI:** The fields for "Marge boven" and "Marge links" are nested inside the "Printen" tab of the modal, which was visually confirmed in the code but difficult to capture via headless accessibility scan.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `print/absolute-layout` | Fixed 484x1311 Coordinate System | docs + source | `certificate_printing.md:85` | `Certificate.jsx:130` | Modal | RIZIV-standard grid for I21/I11 forms. |
| 2 | `print/browser-baselines` | Browser-Specific Offsets | source | — | `Certificate.jsx:240` | N/A | Firefox: -0.35cm left, 1.4cm top. Chrome: 1.85cm top. |
| 3 | `print/user-margins` | Per-User Precision Tuning | docs + source | `invoicing_finances.md` | `users.jsx:130` | Modal | Stored in cm, applied on top of baselines. |
| 4 | `print/auto-numbering` | Incremental Certificate Tracker | docs + source | `invoicing_finances.md` | `users.jsx:105` | Modal | BookNumber (XX*XXXX) + CertificateNumber (1-50). |
| 5 | `print/duplicate-mark` | Duplicate Detection & Watermark | docs + source | `certificate_printing.md` | `CertificateModal.jsx:260`| Modal | Detects if invoice already printed; adds "DUPLICAAT". |
| 6 | `print/diagonal-cross` | Empty Slot Cancellation | source | — | `Certificate.jsx:65` | Modal | Renders CSS-rotated div to cross out unused slots. |
| 7 | `print/pdf-phantomjs` | PhantomJS PDF Pipeline | docs + source | `pdf_generation.md` | `server/util.js` | N/A | DEPRECATED (PhantomJS dead). SSRF risk. |

---

## Cross-references to other areas

- **#11 Smart Invoicing:** Precision Printing is the final step of the B2C invoicing lifecycle.
- **#14 Mutualistic Billing:** Uses the same RIZIV nomenclature but different (bulk) paper formats.
- **#20 SaaS Lifecycle:** Printing is gated by active subscription status.

---

## [NEEDS CLARIFICATION]

### Q1: Is the coordinate system (484x1311) consistent across all RIZIV form updates?
- **Why it matters:** Affects the longevity of the pixel-perfect layout.
- **What would resolve:** Domain expert check on recent form changes.

---

## [NEEDS DOMAIN REVIEW]

### Q: Are the I21 (NL) and I11 (FR) forms still the sole valid matrix-printable RIZIV forms?
- **Found in:** `full_documentation/invoicing_finances.md`
- **Why it matters:** Determines if additional templates are needed for 2026+.
- **What I know:** `logopedist-be` skill confirms these are standard, but RIZIV August 2024 changes might have affected field positioning.

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/full_documentation/invoicing_finances.md`
- `/home/tj/HalingoDoc/docs/from_source/features/certificate_printing.md`
- `/home/tj/HalingoDoc/docs/from_source/features/pdf_generation.md`
- `/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md`
- `/home/tj/HalingoDoc/docs/from_source/deprecation_list.md`
- `/home/tj/HalingoDoc/docs/functional/application_map.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/shared/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/shared/server/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/users/users.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/patient/certificate/Certificate.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/patient/certificate/CertificateModal.jsx`
- `/home/tj/.gemini/skills/logopedist-be/references/01-riziv-nomenclature-and-tariffs.md`

---

## Verification notes (verbatim from `01-discovery/precision-printing.verification.md`)

# Verification: Precision Printing (Area #15)

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/precision-printing.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "fixed 484 × 1311 pixel `<div>`" coordinate system | `certificate_printing.md:85` | ~ | The claim is accurate but the line number is wrong. The 484×1311 text first appears at line 103 of certificate_printing.md ("The certificate is rendered as a fixed 484 × 1311 pixel `<div>`"). Line 85 of certificate_printing.md is mid-code-block (the `$addToSet` update inside the `printCertificate` method). The claim itself is verified correct against the source. |
| 2 | Quote attributed to `calendar_overview.md:120` about soft delete and events with `invoiceId` | `calendar_overview.md:120` | ✗ | FABRICATED CITATION. Line 120 of calendar_overview.md reads "Every `events.create`, `events.update`... ends with a call to `RosaEvents.pushEventsToRosa`" — Rosa push, not soft delete. No soft-delete claim appears anywhere in calendar_overview.md. The soft-delete content is in `patient_files.md` (lines 216–238). Furthermore, calendar_overview.md is NOT listed in the "Files read" table of the discovery file — making it a citation from a source the discoverer did not admit to reading. The exact quoted text ("events with an `invoiceId` cannot be removed") does not appear verbatim in either file. |
| 3 | Firefox: -0.35cm left, 1.4cm top; Chrome: 1.85cm top offsets | `Certificate.jsx:240` | ✓ | Verified directly in Meteor source (Certificate.jsx:316-326). Values match exactly: `isFirefox ? 1.4 : 1.85` for top, `isFirefox ? 0.35 : 0` for left lift. The source line number cited (240) is approximate — the actual code is at 315-325 — but the claim content is correct. |
| 4 | Diagonal line drawn to cross out unused session slots | `Certificate.jsx:65` | ✓ | Verified at Certificate.jsx:66-91. A CSS-rotated 1px border-top div computed via `atan(offsetHeight / offsetWidth)` fills unused row space. Claim and approximate source line are both accurate. |
| 5 | "Manual" vs "Printer" modes; mode persisted in `UserSettings` | `certificate_printing.md`, `users.jsx:130` | ✓ | Confirmed. certificate_printing.md documents both modes in detail. The settings schema is at api/users/users.jsx:99-142 (not :130 exactly, but close enough — the schema spans that range). |
| 6 | `pdf.generate` accepts arbitrary HTML; SSRF risk | `bugs_and_security_findings.md` | ✓ | bugs_and_security_findings.md § "🔴 Security" first item confirms this verbatim: "SSRF — a logged-in user can submit HTML containing `<img src="http://internal-host/...">` and have the headless renderer fetch internal URLs." Source is `api/shared/methods.js`. Verified also against Meteor source: methods.js:6-17 shows no permission check beyond `LoggedInValidatedMethod`. |
| 7 | `MethodLogger` is item #17 in deprecation_list.md | `deprecation_list.md` | ✓ | Confirmed. deprecation_list.md §17 reads "MethodLogger (`app/imports/api/logger/`) — why legacy: product owner: 'That was disabled as we do not want to log all those actions anymore.'" This is under the "🪦 Legacy — do not port to mono repo" section. The discovery's characterisation of it as "MethodLogger retired" is accurate in spirit. |
| 8 | Two-tier margin tuning: per-browser baselines + per-user cm offsets | `invoicing_finances.md` | ✓ | Confirmed. invoicing_finances.md §"Marges getuigschrift aanpassen" describes the user-configurable cm offsets ("marge boven", "marge links"). The per-browser baseline offsets are not mentioned in the helpdesk (they are code-only, as the discovery correctly notes). |
| 9 | BookNumber (XX*XXXX) + CertificateNumber (1-50) format | `invoicing_finances.md`, `users.jsx:105` | ~ | The XX*XXXX format and 1-50 cap appear in the certificate_printing.md source document (regex `\d{2}*\d{4}`, max 50) but NOT in invoicing_finances.md. The helpdesk only mentions auto-increment ("wordt dit nummer automatisch met 1 opgeteld"). Discovery attributes this to invoicing_finances.md which is partially wrong — the precise format comes from source code only. |
| 10 | invoicing_finances.md is 2191 lines | `full_documentation/invoicing_finances.md` | ✗ | WRONG. The file has 1124 lines (`wc -l` result). The claimed 2191 line count is incorrect by nearly a factor of 2. |
| 11 | `pdf.generate` at `api/shared/methods.js:7` | `api/shared/methods.js` | ✓ | Confirmed. The `generatePDF` LoggedInValidatedMethod declaration begins at line 6 (the export declaration) with the `name: "pdf.generate"` on line 7. Claim is accurate. |
| 12 | Duplicate detection: `isDuplicate = certificate.numbers.length > 0` at `CertificateModal.jsx:260` | `CertificateModal.jsx:260` | ~ | The logic is accurate. `CertificateModal.jsx:237` has `const isDuplicate = _.get(certificate, "certificate.numbers.length", 0) > 0`. The cited line number (260) is off — the actual line is 237. The behaviour described is correct. |
| 13 | I21 (NL) / I11 (FR) forms as standard matrix-printable RIZIV certificate types | `invoicing_finances.md` | ✓ | Confirmed at invoicing_finances.md lines 214, 321, and 466: "Hiervoor hebt u getuigschriften nodig van het type I21 (NL) of I11 (FR). Deze kunt u bestellen via Medattest." Claim is accurate and well-sourced. |
| 14 | `print/pdf-phantomjs` feature: PhantomJS pipeline, DEPRECATED | `pdf_generation.md` | ✓ | pdf_generation.md fully confirms: `html-pdf` npm package driving PhantomJS, deprecated since 2018, blocking fiber. The discovery correctly marks it DEPRECATED. |
| 15 | Competency #15 is "Precision Printing" | `application_map.md` | ✓ | application_map.md §2 competency 15: "Precision Printing: Advanced alignment tools for matrix printers and official RIZIV forms." Exact match. |

---

## Material omissions

The following features or behaviors appear in the cited sources but are absent from the discovery catalog:

1. **Cash-toggle behaviour and `*0*` placeholder** — certificate_printing.md documents an important cash switch in printer mode: when unchecked, the literal string `*0*` is rendered in the patient-amount field (the conventional placeholder for "not paying at moment of visit"). The discovery does not mention this anywhere. This is load-bearing for the Phase 2 spec because the `*0*` convention is required by RIZIV booklet conventions and the behaviour is non-obvious (the switch is not persisted across modal opens).

2. **"Opnieuw printen zonder duplicaat" re-print-without-recording flow** — certificate_printing.md (line 225) documents a second button ("Opnieuw printen zonder duplicaat") that calls `printOnly()` to render the certificate without writing a new number to the DB. This is a distinct user flow from the standard duplicate-print path. Not mentioned in the discovery.

3. **Video consultation extra code (792433 / `Treatments.VideoConsultationCode`)** — certificate_printing.md documents that events with `meta.location === 6` get a third column with the telelogopedie code 792433. This is a named constant with regulatory relevance. Not in the discovery feature catalog.

4. **The `MultipleCertificatesModal` component** — certificate_printing.md mentions this as a distinct surface for invoices with multiple certificates. Each certificate is printed individually. Not in the discovery feature catalog.

5. **Therapist information block with VAT number** — printer mode with `therapistInformation: true` renders a multi-line block including practice VAT number. The toggle for `therapistInformationPractice` controls whether the practice vs individual info shows. Not in the discovery feature catalog.

6. **State propagation: Verzamelstaat eligibility gate** — certificate_printing.md (line 219) states that a certificate becomes eligible for inclusion in a Verzamelstaat only after `certificate.numbers.0` exists (i.e., after the first print). This is a cross-area data dependency that the discovery does not flag.

7. **The `translate(event.code)` nomenclatuurcode rendering** — certificate_printing.md notes this is an open question (codes render as bare integers since i18n lookup fails). Flagged in the source as "verify in running app". Not in the discovery.

---

## Cross-area reference check

| Cross-ref in discovery | Claim | Verified? | Finding |
|---|---|---|---|
| #11 Smart Invoicing | "Precision Printing is the final step of the B2C invoicing lifecycle" | ✓ | Accurate. Certificate printing occurs after an invoice is generated. The Verzamelstaat eligibility dependency (material omission #6 above) confirms the relationship is deeper than the discovery states — printing gates the insurance billing flow. |
| #14 Mutualistic Billing | "Uses the same RIZIV nomenclature but different (bulk) paper formats" | ✓ | Plausible. The insurance-side billing (Verzamelstaten) uses the same nomenclature codes but produces a different paper format. Bidirectionality: area #14 should cross-reference #15 — that reciprocal reference should be confirmed in the #14 discovery file. Not verified here as that file is out of scope. |
| #20 SaaS Lifecycle | "Printing is gated by active subscription status" | ✓ | Partially confirmed. calendar_overview.md documents that event creation is gated on `hasActiveSub === false` (Calendar.jsx:180-182). The same subscription gate likely applies to printing but was not directly observed in the certificate code during this verification pass. This is marked CLARIFY in findings. |

---

## Domain review (logopedist-be)

### Claim: I21 (NL) and I11 (FR) are the sole valid matrix-printable RIZIV forms

**Skill verdict: CLARIFY**

The `logopedist-be` skill confirms that the standard patient-side billing instrument is the "getuigschrift voor verstrekte hulp" (attestation de soins donnés), issued from officially numbered RIZIV booklets available from Medattest. The invoicing_finances.md confirms the specific Medattest form types I21 (NL) and I11 (FR). However:

- The skill does not explicitly enumerate I21/I11 as the sole valid form designations — this naming convention is product/commercial, not RIZIV-regulatory. RIZIV mandates the getuigschrift format; Medattest sells specific product SKUs (I21, I11) that comply.
- The skill confirms these physical paper forms are still the operative channel for patient-side reimbursement as of 2026, since eAttest is NOT opened for logopedisten at CIN/NIC and is not expected before 2027-Q4 at the earliest.
- Therefore: I21/I11 remain valid for the foreseeable planning horizon. The discovery's NEEDS DOMAIN REVIEW concern is partially resolved — the forms are still operative — but the question of whether additional form SKUs exist from other vendors (not just Medattest) cannot be answered from the skill alone.

### Claim: August 2024 RIZIV changes might have affected field positioning

**Skill verdict: CLARIFY**

The skill confirms KB of 04.06.2024 (in force 01.08.2024) substantially restructured Article 36 — it abolished the evolutiebilan codes, introduced 2-year accord cycles, and added a new evaluation session code (700991/701002). However:

- These are nomenclature changes (what sessions are reimbursable and under what workflow), NOT form layout changes. The physical paper form (I21/I11) layout is determined by RIZIV separately from the nomenclature text.
- The skill does not have a specific finding on whether the August 2024 KB triggered a re-issue of the physical I21/I11 forms with different field positioning.
- This remains a genuine NEEDS CLARIFICATION for Phase 2: if RIZIV issued a new form version with repositioned fields, the hardcoded pixel coordinates in Certificate.jsx would need updating for the new form generation.

### Claim: BookNumber (XX*XXXX) + CertificateNumber (1-50) format

**Skill verdict: CLARIFY (not domain-confirmable)**

The skill references the "getuigschrift voor verstrekte hulp from an officially numbered RIZIV booklet" but does not specify the internal booklet-number format (the XX*XXXX regex) or the 50-certificates-per-booklet convention. These are operational details of the Medattest product, not a RIZIV regulatory mandate. The discovery's claim that this format is "RIZIV-mandated" is not verifiable from the skill. The regex and cap are confirmed in the Meteor source code (certificate_printing.md documents `\d{2}*\d{4}` and max: 50), but their basis in RIZIV or Medattest product specification is not established.

### Claim: Matrix printers still the expected medium in 2025-2026

**Skill verdict: CONFIRMED (with nuance)**

The skill explicitly states: "eFact paper monthly verzamelstaten: still legal for logopedists. The RIZIV-issued numbered booklets (the green, blue, etc. getuigschriften) are still on sale; the per-2026 convention does not change this." The 2026-2027 Convention does not mandate eAttest/eFact. Paper getuigschriften via matrix printer remain the primary patient-side billing instrument for non-derdebetaler practices through at least 2027-Q4.

---

## Escalated source checks (Step C)

Spot-checks executed against Meteor source for load-bearing claims:

| # | Claim | File:line checked | Finding |
|---|---|---|---|
| SC-1 | "484x1311 pixel coordinate system" — discovery cites Certificate.jsx:130 | Certificate.jsx:99-101 | Verified. `const width = 484; const height = 1311;` at lines 100-101. The discovery's cited line (130) is off — line 130 is inside the render method at `isPrinterMode` assignment — but the claim is factually correct. |
| SC-2 | "Diagonal line rendering" — Certificate.jsx:65 | Certificate.jsx:66-91 | Verified. Diagonal strikethrough computed via trigonometry (`atan(offsetHeight/offsetWidth)`), rendered as rotated border-top. Discovery line number is accurate (65 is where the height variable is set). |
| SC-3 | "Firefox: -0.35cm left, 1.4cm top; Chrome: 1.85cm top" — Certificate.jsx:240 | Certificate.jsx:315-325 | Verified. `+_.get(this.props.offset, "top", 0) + (isFirefox ? 1.4 : 1.85)` and `+_.get(this.props.offset, "left", 0) - (isFirefox ? 0.35 : 0)`. Cited line (240) is off — the code is at 315-325 — but values are exact. |
| SC-4 | `pdf.generate` accepts arbitrary HTML | api/shared/methods.js:6-17 | Verified. `validate: new SimpleSchema({ html: String, options: { type: Object, blackbox: true, optional: true }})` with no URL filtering or admin permission check. SSRF risk is correctly stated. |
| SC-5 | Duplicate detection at CertificateModal.jsx:260 | CertificateModal.jsx:237 | Verified. `const isDuplicate = _.get(certificate, "certificate.numbers.length", 0) > 0` at line 237, not 260. The StatusBox warning renders when `isDuplicate` is true. Claim is correct; line number is wrong by 23 lines. |

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-PP-01 | BLOCKER | citation | First direct quote attributed to `calendar_overview.md:120` about soft-delete and events with invoiceId. That line discusses Rosa event push, not soft delete. calendar_overview.md is not listed in the "Files read" table — suggesting the citation is fabricated or cross-contaminated from another area's discovery session. The quoted text does not appear verbatim in any cited source. If taken at face value by a Phase 2 spec author, they would read the wrong file for the wrong claim. | Correct before Phase 2: remove the quote or re-attribute it to the correct source (patient_files.md covers soft delete). |
| V-PP-02 | BLOCKER | citation | invoicing_finances.md claimed as 2191 lines. Actual file is 1124 lines. The 2191 figure appears in multiple Gemini discovery files for different areas — this is a systematic inflation of this file's line count. The inflation suggests a copy-paste error or Gemini fabricating consistent-but-wrong metadata across sessions. | Correct the line count. Notify verifiers of other areas that cite this same number for the same file. |
| V-PP-03 | CLARIFY | omission | Cash-toggle (`*0*` vs patient-amount) is not in the feature catalog. This is load-bearing for the Phase 2 spec: the `*0*` literal is a RIZIV booklet convention the spec author must preserve. | Add `print/cash-toggle` to the feature catalog. |
| V-PP-04 | CLARIFY | omission | "Opnieuw printen zonder duplicaat" flow (re-print without DB write) absent from feature catalog. Distinct user flow from the standard duplicate path. | Add `print/reprint-without-recording` to the feature catalog. |
| V-PP-05 | CLARIFY | omission | Video consultation extra code (792433) rendering on certificate is absent. This is a telelogopedie regulatory detail. | Add note to `print/absolute-layout` feature or create `print/video-consult-code` entry. |
| V-PP-06 | CLARIFY | omission | Verzamelstaat eligibility gate (certificate must have `numbers.0` before it can be aggregated) is absent. This is a cross-area dependency that Phase 2 specs for both #14 and #15 must capture. | Flag cross-area dependency between #15 and #14 explicitly. |
| V-PP-07 | CLARIFY | domain | Whether August 2024 KB triggered a re-issue of I21/I11 forms with new field positioning is unresolved. If the form was re-issued, the hardcoded pixel coordinates in Certificate.jsx are stale. | Requires human domain check: contact RIZIV or Medattest to confirm whether current I21/I11 form is the same physical layout as the version the coordinate system was calibrated for. |
| V-PP-08 | CLARIFY | citation | BookNumber (XX*XXXX) format and 1-50 cap attributed partly to invoicing_finances.md. The helpdesk only documents auto-increment; the precise format comes from source code only. Not domain-confirmable from the logopedist-be skill. | Re-attribute this claim to source code only (`users.jsx` schema, `certificate_printing.md`). |
| V-PP-09 | NOTE | citation | certificate_printing.md:85 cited for the 484×1311 coordinate system quote. Actual location is line 103. Line 85 is mid-code-block. Off by 18 lines. Does not affect correctness. | Correct line reference for precision. |
| V-PP-10 | NOTE | citation | CertificateModal.jsx:260 cited for duplicate detection. Actual line is 237. Off by 23 lines. Does not affect correctness. | Correct line reference for precision. |
| V-PP-11 | NOTE | citation | Certificate.jsx:240 cited for browser-specific offsets. Actual code is at lines 315-325. Off by 75+ lines. Does not affect correctness. | Correct line reference for precision. |
| V-PP-12 | NOTE | omission | MultipleCertificatesModal surface absent from feature catalog. Low impact — the discovery covers the primary single-certificate flow, and the multi-cert modal is a nav wrapper. | Consider adding as a sub-feature note under `print/duplicate-mark`. |

---

## Recommendation

**PASS WITH NOTES — PROCEED to Phase 2 with targeted corrections.**

Two BLOCKERs must be corrected before the Phase 2 spec author reads this discovery file:

1. **V-PP-01**: The `calendar_overview.md:120` direct quote must be removed or correctly re-attributed. A Phase 2 spec author who follows that citation will read the wrong source and draw wrong conclusions about soft-delete and invoiced event protection. Replace with a reference to `patient_files.md` §"Deletion semantics" for the soft-delete claim, and to `certificate_printing.md` §"The print method" step 2 ("Cancellation: refuses if `invoice.isCanceled`") for the invoice-protection claim.

2. **V-PP-02**: The 2191-line count for invoicing_finances.md is wrong (actual: 1124). This should be corrected in the discovery file and the same correction applied to every other area discovery file that cites this number — this appears to be a systematic Gemini error across multiple discovery sessions.

The four CLARIFY items (V-PP-03 through V-PP-06) represent genuine missing features that the Phase 2 spec author needs. They should be added to the discovery file's `[NEEDS CLARIFICATION]` backlog. The domain CLARIFY (V-PP-07) requires a human check on whether RIZIV re-issued the I21/I11 form layout after August 2024.

The seven NOTE items are line-number imprecisions that do not affect correctness and can be corrected opportunistically.

The core behavioral content of the discovery — the coordinate system, the two-tier margin model, the browser offsets, the mode distinction, the PhantomJS pipeline, and the SSRF risk — is accurately discovered and well-sourced.
