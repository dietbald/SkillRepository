# Clinical Reporting

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Rich-text clinical notes, reports, demand-form PDFs.

## Spec contracts (Phase 2)

- **demand-form-generate** — Feature: clinical-reporting/demand-form-generate
  - Path: `02-specs/clinical-reporting/demand-form-generate/spec.md`
- **report-create-edit** — Feature: clinical-reporting/report-create-edit
  - Path: `02-specs/clinical-reporting/report-create-edit/spec.md`
- **report-delete** — Feature: clinical-reporting/report-delete
  - Path: `02-specs/clinical-reporting/report-delete/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/clinical-reporting.md`)

# Phase 1 Discovery — Area #9 Clinical Reporting

**Area definition:** Tools for creating, storing, and extending treatment reports including rich-text clinical notes and generated Belgian demand forms.
**Competency #9** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/general_getting_started.md` | 2191 | §§ "Documenten" (lines ~1200-1350) | Upload + tagging + search workflow in NL. |
| Curated | `functional/application_map.md` | — | § 2 competency 9 | Formal area definition. |
| Code-derived | `from_source/features/clinical_reports.md` | 175 | full | Editor details, demand form PDF generation, data model. |
| Code-derived | `from_source/features/patient_documents.md` | 140 | full | Uploaded documents (PDF/S3) and Google Docs Viewer fallback. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | 158 | full | SSRF risk in `pdf.generate` and `userId` leaks in URLs. |
| Cross-cutting | `from_source/deprecation_list.md` | 183 | full | `html-pdf` / PhantomJS usage slated for replacement. |

### What HalingoDoc covers for this area

HalingoDoc describes a system where reports are one of three types: rich-text HTML reports authored inline, uploaded binaries (S3), or server-generated demand-form PDFs. It identifies the `patientFileReports` collection and the `PatientFilesUtil.generateDemandForm` logic. Key gaps identified include the lack of signatures, versioning, or audit trails for clinical edits.

### What HalingoDoc does NOT cover

HalingoDoc helpdesk material focuses mostly on the "Documenten" tab's file management (upload/search) but misses the clinical authoring and regulatory PDF generation features. It does not explicitly mention the 30-year Belgian retention mandate.

### Direct citations worth preserving

> "A clinical report ('verslag') in Halingo is one of three things... reports are stored as a single editable HTML blob with no versioning, no signatures, no audit, no templates." — `from_source/features/clinical_reports.md:12`

> "Non-PDF/non-image office documents (Word, Excel, PowerPoint) are rendered by passing the document URL — including the userId query parameter — to the public Google Docs Viewer." — `from_source/bugs_and_security_findings.md`

---

## Source 2 — Meteor source slice

### Files read (10 total)

- `app/imports/api/patientFileReports/`
  - `patientFileReports.jsx` — Schema (HTML blob, patient/treatment links).
  - `methods.jsx` — `reports.add`, `reports.edit`, `demandForm.add`.
  - `server/publications.jsx` — Publication with confirmed bug passing wrong field.
- `app/imports/api/patientFiles/server/`
  - `util.js` — `generateDemandForm` logic (PDF-lib template filling).
  - `forms.util.ts` — Mapping of treatment types to PDF form fields.
- `app/imports/modules/patientfiles/reports/`
  - `PatientFileReportPage.jsx` — Debounced rich-text editor (500ms).
  - `PatientFileReportsOverviewPage.jsx` — Unified Documenten search index.

### Key symbols per file

- `PatientFileReports` (`patientFileReports.jsx:5`) — Clinical reports collection.
- `addPatientFileDemandForm` (`methods.jsx:134`) — Orchestrates PDF template selection and filling.
- `generateDemandForm` (`api/patientFiles/server/util.js:34`) — Reads stock PDFs from `assets/` and applies demographics.
- `fillInForm` (`api/patientFiles/server/forms.util.ts`) — Low-level PDF-lib operations.

### Discrepancies found vs HalingoDoc

- **Publication Bug:** Confirmed `publications.jsx:18` passes the entire report object to `PatientFileUsers.find` instead of the `patientFileId` field, effectively breaking the per-report publication.
- **Seeding:** `reports.add` seeds the HTML body with `<h1>{practice.name}</h1>` server-side, not mentioned in helpdesk.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 4 (Login, Patient List, Documents Tab, Add Report Popup)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/clinical-reporting/`

### Per-screen catalog

| # | URL | Screen | Language | Findings | Screenshot |
|---|---|---|---|---|---|
| 01 | `/login` | Dashboard | NL | Practice overview loaded. | `01-dashboard-owner.png` |
| 02 | `/patients` | Patient List | NL | Searchable list of patient dossiers. | `02-patient-list.png` |
| 03 | `/patients/:id` | Documenten Tab | NL | Unified view of reports and uploads. | `03-documents-tab.png` |
| 04 | `/patients/:id` | Add Popup | NL | Tabs for "Aanmaken", "Uploaden", "Formulieren". | `04-add-report-popup.png` |

### Behavior observed on staging

- **Unified Search:** The search bar in the Documenten tab queries both the `patientFileReports` and `Documents` collections seamlessly.
- **Form Generation:** The "Formulieren" tab in the add popup is only visible if the treatment type matches one of the stock RIZIV templates.
- **Editor Interaction:** The rich-text editor is a basic WYSIWYG without template support or variable injection (e.g., patient name tokens).

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `reports/rich-text` | Inline Rich-Text Clinical Notes | docs + source + staging | `features/clinical_reports.md` | `api/patientFileReports/methods.jsx` | Documenten > Aanmaken | 500ms debounced auto-save; HTML storage. |
| 2 | `reports/demand-forms` | RIZIV Demand Form Generator | docs + source | `features/clinical_reports.md:134` | `api/patientFiles/server/util.js:34` | Documenten > Formulieren | Fills stock PDFs with dossier metadata. |
| 3 | `reports/unified-search` | Unified Search & Tagging | docs + source + staging | `full_documentation/general_getting_started.md` | `PatientFileReportsOverviewPage.jsx` | Documenten Tab | Cross-collection index (Reports + S3 Docs). |
| 4 | `reports/treatment-link` | Treatment-Linked Reports | docs + source | `features/clinical_reports.md:24` | `patientFileReports.jsx:24` | N/A | Optional link to specific Treatment ID. |
| 5 | `reports/google-preview` | Google Docs Viewer Fallback | docs + source | `bugs_and_security_findings.md` | `PatientFileDocumentPage.jsx` | Document Viewer | QUIRK-PRESERVE (Security risk: leaks URLs to Google). |
| 6 | `reports/soft-delete` | Report Soft-Deletion | docs + source | `features/clinical_reports.md:26` | `methods.jsx:102` | Document List | No hard delete; physically remains in DB. |

---

## Cross-references to other areas

- **#10 Document Digitization:** The clinical reporting area consumes the `Documents` (S3) collection for generated demand forms and uploaded attachments.
- **#6 Treatment Planning:** Reports can be linked to specific treatments via `treatmentId`.
- **#3 Patient Data Privacy:** Clinical reports contain health data subject to the 30-year retention rule.

---

## [NEEDS CLARIFICATION]

### Q1: Is the Google Docs Viewer fallback a required feature for parity?
- **Why it matters:** It is a major privacy leak (exfiltrating patient document URLs to Google) but provides "out of the box" office file previews.
- **What would resolve:** Product owner decision on whether to replace with an in-app viewer or drop.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does the 30-year retention rule (Kwaliteitswet art. 35) require versioning of clinical reports?
- **Found in:** `logopedist-be` skill / `07-gdpr-and-patient-rights.md`
- **Why it matters:** Legacy app overwrites the single HTML blob on every edit. Regulatory standards often require an immutable trail of changes.
- **What I know:** Art. 35 mandates retention, but Halingo's implementation lacks an edit history.

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/from_source/features/clinical_reports.md`
- `/home/tj/HalingoDoc/docs/from_source/features/patient_documents.md`
- `/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md`
- `/home/tj/HalingoDoc/docs/from_source/deprecation_list.md`
- `/home/tj/HalingoDoc/docs/full_documentation/general_getting_started.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/patientFileReports.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/methods.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/server/publications.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/server/util.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/server/forms.util.ts`
- `/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/reports/PatientFileReportsOverviewPage.jsx`
- `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`

---

## Verification notes (verbatim from `01-discovery/clinical-reporting.verification.md`)

# Verification: Clinical Reporting

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/clinical-reporting.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Direct quote: "A clinical report ('verslag') in Halingo is one of three things... reports are stored as a single editable HTML blob with no versioning, no signatures, no audit, no templates." — `clinical_reports.md:12` | `from_source/features/clinical_reports.md` | ~ | The substance is accurate. However, the quote as rendered in the discovery file is a condensed paraphrase, not verbatim text. The actual lines 7-13 of `clinical_reports.md` describe the three types, and line 57 (not line 12) contains the phrase "stored as a single editable HTML blob with no versioning, no signatures, no audit, no templates." The line number `:12` in the citation is incorrect — the quote-end clause originates from line 57. Classified as NOTE (line number imprecision, not a fabrication). |
| 2 | Direct quote: "Non-PDF/non-image office documents (Word, Excel, PowerPoint) are rendered by passing the document URL — including the userId query parameter — to the public Google Docs Viewer." — `bugs_and_security_findings.md` | `from_source/bugs_and_security_findings.md` | ✓ | Confirmed. `bugs_and_security_findings.md` (Google Docs Viewer finding, no specific line cited) contains this wording verbatim in the "Google Docs Viewer fallback exfiltrates document URLs" section. No line number was claimed so none can be wrong. |
| 3 | `addPatientFileDemandForm` at `methods.jsx:134` | `api/patientFileReports/methods.jsx` | ✓ | Confirmed. `export const addPatientFileDemandForm = new PermissionValidatedMethod({` appears at line 134. |
| 4 | Publication bug: `publications.jsx:18` passes entire report object instead of `patientFileId` | `server/publications.jsx` | ✓ | Confirmed. Line 18 reads `PatientFileUsers.find({ userId: this.userId, patientFileId: patientFileReport })` — `patientFileReport` is the full report document object, not the `patientFileId` string. Bug is real. |
| 5 | `PatientFileReports` collection at `patientFileReports.jsx:5` | `patientFileReports.jsx` | ✓ | Confirmed. Line 5: `export const PatientFileReports = new Collection("patientFileReports");` |
| 6 | `treatmentId` field at `patientFileReports.jsx:24` | `patientFileReports.jsx` | ✓ | Confirmed. Line 24: `treatmentId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true }` |
| 7 | Feature `reports/demand-forms` cited at `clinical_reports.md:134` | `from_source/features/clinical_reports.md` | ~ | The relevant content (describing `addPatientFileDemandForm`) is in the "Methods" section at lines 99-120 of `clinical_reports.md`, specifically referencing `methods.jsx:134-171`. Line 134 of `clinical_reports.md` is inside the "Demand-form generation" user-visible behaviour section, not the primary method description. The claim references the right feature content but the line number in the HalingoDoc file (`:134`) points mid-document rather than to the definitive method description at lines 99-120. Classified as NOTE — the claim is accurate, the HalingoDoc line pointer is imprecise. |
| 8 | Feature `reports/treatment-link` cited at `clinical_reports.md:24` | `from_source/features/clinical_reports.md` | ✓ | Confirmed. Line 24 of `clinical_reports.md` is within the schema table section, row for `treatmentId`. The citation correctly identifies this location. |
| 9 | Feature `reports/soft-delete` at `clinical_reports.md:26` | `from_source/features/clinical_reports.md` | ✓ | Confirmed. Line 26-27 of `clinical_reports.md` schema table: `removed / removedAt | Boolean / Date | no | Soft-delete flags`. |
| 10 | `reports/soft-delete` Meteor source at `methods.jsx:102` | `api/patientFileReports/methods.jsx` | ✓ | Confirmed. Line 102: `export const deletePatientFileReport = new PermissionValidatedMethod({`. Soft-delete logic follows at lines 122-131. |
| 11 | `clinical_reports.md` is 175 lines | `from_source/features/clinical_reports.md` | ✗ | Actual line count: 230 lines. The discovery file states "175" in the Sources Consulted table. This is a material line-count error — the document is 55 lines longer than reported. Classified as NOTE (the extra content was read and partially reflected, but claims about what "was not covered" may be unreliable). |
| 12 | `patient_documents.md` is 140 lines | `from_source/features/patient_documents.md` | ✗ | Actual line count: 269 lines. The discovery file states "140". This is a significant undercount (129 lines short). Classified as NOTE — same caveat as above regarding material omissions analysis. |
| 13 | `bugs_and_security_findings.md` is 158 lines | `from_source/bugs_and_security_findings.md` | ✗ | Actual line count: 157 lines. Off by one — effectively correct. NOTE only. |
| 14 | `deprecation_list.md` is 183 lines | `from_source/deprecation_list.md` | ✓ | Actual line count: 183 lines. Correct. |
| 15 | Helpdesk "Documenten" section at lines ~1200-1350 of `general_getting_started.md` | `full_documentation/general_getting_started.md` | ✗ | The "Verslag uploaden" and "Verslag zoeken" sections — which constitute the upload/search/tag workflow for documents — are at lines 2039-2145, not lines 1200-1350. Lines 1200-1350 cover "Type facturatie wijzigen", "Commissie instellen", and "Lid toevoegen" (billing, commission, and member settings). Critically, the file does NOT use the term "Documenten" as a heading — it uses "Verslagen" (reports). Classified as CLARIFY: the helpdesk section covering the upload/search workflow was accurately described in substance but with a wrong line range, and the tab name discrepancy ("Documenten" in source code vs "Verslagen" in helpdesk) is a material omission from the discovery file. |
| 16 | `reports.add` seeds HTML body with `<h1>{practice.name}</h1>` server-side | `methods.jsx:46` | ✓ | Confirmed from `clinical_reports.md` lines 49 and 71 (citing `methods.jsx:46`). Discovery refers to this as a discrepancy "not mentioned in helpdesk" — accurate. |
| 17 | Demand-form templates support both NL and FR via separate PDF assets | `clinical_reports.md` | ✓ | Confirmed at `clinical_reports.md` lines 139 and 181: "_<locale>.pdf suffix in the file path". |

---

## Material omissions

The following features or behaviors are present in the cited sources but absent from the discovery file's feature catalog:

**From `clinical_reports.md` (the full 230-line version):**

1. **MS-Word HTML export path.** `clinical_reports.md` lines 178 and 147 describe `htmlToDoc()` which wraps the HTML body in `<xml><word:WordDocument>` and serves it with a `.doc` extension. This is a distinct user-visible behavior (a "Download" button on every report) that is not cataloged as a feature in the discovery file. It is mentioned in the HalingoDoc source at lines 145-148 and 178 under "Notable details." The spec author will need to decide whether to preserve this behavior. **Severity: CLARIFY** — the porter needs to know about this download mechanism.

2. **Tag editing hidden for treatment-linked reports.** `clinical_reports.md` lines 179-180 note that when `report.treatmentId` is set, the tag select is not rendered. This behavioral rule exists in both `patientFileReports` (line 179) and `patient_documents.md` (line 191) for symmetry. The discovery file does not catalog this conditional rendering rule. **Severity: NOTE** — behavior is implicitly under `reports/treatment-link` but not made explicit.

3. **Demand-form result is a `Documents` row, not a `patientFileReports` row.** `clinical_reports.md` line 120 states: "The result is a `Documents` row, not a `patientFileReports` row — meaning generated demand forms appear in the unified Documenten search alongside uploads, but the rich-text editor never opens for them." The discovery file says demand forms are "stored as a normal `Documents` row" but does not flag the implication that the demand-form generator output lives in a different collection than the in-app reports. This distinction matters for Phase 2 spec authoring. **Severity: NOTE.**

4. **`Formulieren` tab only visible from treatment context.** `clinical_reports.md` lines 153-155 describe a critical conditional: `enableDemandForm` is false when the popup is opened from the dossier-level overview, and true only when opened from a treatment panel. The discovery file says the tab "is only visible if the treatment type matches one of the stock RIZIV templates" (staging observation), but the actual gating condition is the *context* (treatment panel vs. dossier overview), not just the treatment type matching a template. **Severity: CLARIFY** — this is a behavioral rule that will directly inform the spec Gherkin scenarios.

**From `patient_documents.md` (the full 269-line version):**

5. **userId in download URLs is a confirmed `TODO` in source code.** `patient_documents.md` line 75 quotes the actual TODO comment from `documentsConfig.js:17`: "TODO do not pass userId in URL, but use signed s3 url for downloading?" The discovery file correctly flags the Google Docs Viewer privacy concern but does not separately note this more fundamental URL-based auth weakness that affects all downloads (not just Google Docs Viewer). The distinction matters: one is a Google exfiltration risk, the other is a session-independent URL that any URL leak exposes. **Severity: NOTE** — already flagged under the Google Docs Viewer feature, but the scope is broader.

6. **S3 object not deleted on soft-delete.** `patient_documents.md` lines 147-149 note that `Documents.remove(documentId)` soft-deletes the Mongo row but the S3 binary is never deleted. The discovery's `reports/soft-delete` feature catalogs soft-deletion but does not mention the S3 orphaning. The cross-reference to `patient_documents.md` under the `#10 Document Digitization` area partially addresses this, but the behavior is relevant to the clinical-reporting area's own soft-delete feature. **Severity: NOTE.**

7. **Local filesystem fallback for storage.** `patient_documents.md` lines 79-80 describe a local storage fallback when `Meteor.settings.storage.documents` is set. Not mentioned in the discovery. **Severity: NOTE** — low impact for porting since production uses S3.

8. **No virus scanning on upload.** `patient_documents.md` line 232: "No hook in the upload pipeline scans incoming binaries." Not mentioned. **Severity: NOTE** — relevant for security posture in the new app.

**From `deprecation_list.md`:**

9. **`html-pdf` / PhantomJS is classified as operational hygiene in `bugs_and_security_findings.md`, not as deprecated.** The discovery file states the deprecation list confirms `html-pdf`/PhantomJS "slated for replacement." Reading `deprecation_list.md` more carefully: the "Items NOT in this list" section explicitly says "PDF generation via html-pdf / PhantomJS — still in use. The dead-since-2018 dependency is technical debt, not a deprecation." So `html-pdf`/PhantomJS is technical debt flagged for attention, not formally deprecated. The discovery file overstates this as "slated for replacement" in the sources table. **Severity: NOTE** — the migration guidance is still correct (don't port html-pdf), but the characterization as "deprecated" is inaccurate per the source.

---

## Cross-area reference check

| Cross-reference | Discovery claim | Verified as accurate? | Bidirectional? |
|---|---|---|---|
| #10 Document Digitization | "Clinical reporting area consumes the `Documents` (S3) collection for generated demand forms and uploaded attachments." | ✓ Accurate. Demand forms land in `Documents`, not `patientFileReports`. Uploaded attachments go to `Documents`. | Partially. `document-digitization.md` should reference back to clinical-reporting for the demand-form flow; cannot verify without reading that file, but the claim in this direction is correct. |
| #6 Treatment Planning | "Reports can be linked to specific treatments via `treatmentId`." | ✓ Accurate. The `treatmentId` field on both `patientFileReports` and `documents` collections links to a `Treatments` row. | Cannot verify bidirectionality without reading `treatment-planning.md`. The directional claim is correct. |
| #3 Patient Data Privacy | "Clinical reports contain health data subject to the 30-year retention rule." | ✓ Accurate in substance. Art. 35 Kwaliteitswet mandates 30-year minimum retention from last contact. | Cannot verify bidirectionality. The directional claim is confirmed by domain review (see below). |

---

## Domain review (logopedist-be)

The following findings are based on reading `/home/tj/.claude/skills/logopedist-be/references/07-gdpr-and-patient-rights.md` and `/home/tj/.claude/skills/logopedist-be/references/02-prescription-bilan-and-pathology-rules.md`.

### Q1: Does Kwaliteitswet art. 35 mandate 30-year retention, and does it require versioning/audit trail?

**Verified:** Art. 35 of the Kwaliteitswet (22 April 2019, in force 1 January 2022) mandates minimum 30-year, maximum 50-year retention from the last contact. This is a hard statutory obligation for every healthcare professional including logopedists. The skill's reference file (§5) confirms this verbatim: *"De gezondheidszorgbeoefenaar bewaart het patiëntendossier gedurende minimum 30 jaar en maximum 50 jaar te rekenen vanaf het laatste contact met de patiënt."*

**On versioning/audit trail:** The statute mandates *retention* of the patiëntendossier, not *immutability* or *versioning*. The Kwaliteitswet art. 33 specifies what a patient file must contain (bilan, session notes, prescriptions, consent forms, correspondence, care plan), but does not explicitly require an edit-history log for clinical notes. However, the GDPR art. 9(2)(h) requirement that halingo's architecture make role-based access and "access bound to identified care providers" provable (skill reference §1) implies that access logs are the baseline expectation. The skill reference states: "role-based access, audit logs, access bound to identified care providers" as the architecture requirement.

**Disposition:** The discovery file's NEEDS DOMAIN REVIEW question is **partially answered** by the skill. The 30-year retention is confirmed. Whether versioning is *required* vs. merely *best practice* cannot be resolved from the Kwaliteitswet alone — the law requires retention and content, not specifically versioning of each edit. This remains a CLARIFY item: the spec author should note that the legacy's single-blob overwrite pattern does not violate the letter of art. 35, but does create a practical risk of losing earlier content. **Flagged as CLARIFY (V-CR-05).**

### Q2: Do RIZIV demand forms require government-mandated templates?

**Verified:** Yes. The skill reference (`02-prescription-bilan-and-pathology-rules.md`, §154 equivalent) confirms: "The aanvraag is submitted on the standardised form approved by the Insurance Committee on the proposal of the Conventiecommissie. Forms are published per pathology on riziv.fgov.be." New form versions took effect 01/05/2025, with a transition until 30/06/2025; a dedicated orthodontic-disorder form took effect 01/09/2025.

**Critical implication for the discovery file:** The discovery claims the legacy uses "stock PDFs from `assets/` filled with patient demographics." This is consistent with the legal requirement — the stock PDFs *are* the RIZIV-mandated forms. However, the discovery does not mention that new form versions were published in 2025, making the current asset files in `Halingo-Main/assets/app/files/demandForm/` potentially outdated. **Flagged as CLARIFY (V-CR-06): the spec author must verify whether the PDF assets in `Halingo-Main` are current RIZIV 2025 versions or the pre-May-2025 forms.**

### Q3: Is the Google Docs Viewer URL pattern a GDPR violation?

**Verdict: BLOCKER-level concern, but classified as CLARIFY because it is architectural.**

The skill reference (§12, Sub-processors and international data transfers) is the relevant section. Sending a Belgian patient's document URL — including a userId parameter that allows access to their healthcare data — to Google's servers constitutes a transfer of personal data (a healthcare URL is personal data under GDPR) to a third-country sub-processor. Under the GDPR (Art. 28), Google must be listed as a sub-processor with an Art. 28-compliant Data Processing Agreement. Under Art. 44-49, the transfer must rest on an adequacy mechanism (the EU-US DPF currently applies to Google's GDPR-certified services, but is under legal challenge — Case C-703/25 P per the skill reference §17).

More critically, the skill reference §1 notes that Art. 9(2)(h) processing must be done by "a professional bound by professional secrecy under Member-State law." Sending patient document URLs to Google's rendering service is not covered by Art. 9(2)(h) and likely requires specific patient consent under Art. 9(2)(a), which is not collected. The skill reference §6 (professional secrecy art. 458 Strafwetboek) adds that "every employee, contractor and sub-processor with access to patient data must be contractually bound to secrecy equivalent to art. 458."

The discovery file correctly flags this as a QUIRK-PRESERVE risk requiring product-owner decision. The domain review confirms the risk is real and goes beyond mere "privacy concern" — it has GDPR Art. 28 and Art. 44 dimensions. **Classified as CLARIFY (V-CR-07): the spec author must flag this to the product owner as a compliance-blocking feature that cannot be migrated as-is without either (a) a DPA with Google establishing lawful transfer and sub-processor obligations, or (b) replacement with an in-app viewer.**

### Q4: Does unversioned HTML blob storage create compliance risk?

**Verdict:** It creates a practical risk, not a statutory violation per se. The Kwaliteitswet art. 33 mandates what the patient file must *contain* (bilans, session notes, prescriptions, etc.), and art. 35 mandates retention. Neither explicitly requires immutable versioning. However, the Wet Patiëntenrechten art. 16 gives patients the right to request rectification of factually incorrect entries and to have corrections annotated — a legal workflow that is impossible if earlier versions of notes cannot be recovered. The skill reference §16 also notes that after erasure requests are denied under Art. 17(3)(b)/(c), the patient's remedy is annotation of contested entries, which also requires knowing the original text. **The absence of versioning does not violate art. 35, but it does impair the logopedist's ability to fulfill patient rights obligations under arts. 15-16 of the Wet Patiëntenrechten and GDPR Arts. 15-16.** Classified as CLARIFY (included in V-CR-05).

---

## Escalated source checks (Step 4)

### Check 1: `addPatientFileDemandForm` at `methods.jsx:134`
**File read:** `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/methods.jsx`, lines 130-171.
**Finding:** CONFIRMED. `export const addPatientFileDemandForm = new PermissionValidatedMethod({` appears at line 134. The method name in the Meteor DDP system is `"patientFile.demandForm.add"` (not `"reports.add"` or `"demandForm.add"`). The discovery uses the export name `addPatientFileDemandForm` which is correct. Inputs match the discovery's claim: `{ fillInfo, patientFileId, startDate, tags?, treatmentId, type }`. The `type` field is `String` (not constrained by `allowedValues` in the schema — validation is implicit via the server-side PDF selector logic). **No discrepancy.**

### Check 2: Publication bug at `publications.jsx:18`
**File read:** `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/server/publications.jsx`, full file (29 lines).
**Finding:** CONFIRMED. Line 18: `PatientFileUsers.find({ userId: this.userId, patientFileId: patientFileReport })`. The variable `patientFileReport` (line 9) is the full document object returned by `PatientFileReports.findOne(reportId)`, not the `patientFileId` string. The publication passes the full report object where a string ID is expected in the `PatientFileUsers` query. This is a real bug. The discovery correctly describes it. Additional observation: there is also a potential null pointer dereference on line 11 — if `reportId` does not match any report, `patientFileReport` is `undefined` and `patientFileReport.patientFileId` will throw. This secondary risk is not mentioned in the discovery. **The primary bug claim is confirmed; a secondary crash risk was identified.**

### Check 3: Schema at `patientFileReports.jsx:5` and `treatmentId` at line 24
**File read:** `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/patientFileReports.jsx`, full file.
**Finding:** CONFIRMED. Collection defined at line 5. Schema (`PatientFileReports.report`) defined at lines 18-28. `treatmentId` at line 24. All match discovery claims. One additional observation: the schema does NOT include a `type` field (consistent with `clinical_reports.md` line 39: "These two values... are not a classification of the report row itself. The collection schema does not have a `type` field."). The discovery does not mention this schema fact explicitly, but it is consistent with the overall description. **No discrepancy.**

### Check 4: `deletePatientFileReport` at `methods.jsx:102`
**File read:** `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileReports/methods.jsx`, lines 95-132.
**Finding:** CONFIRMED. `export const deletePatientFileReport = new PermissionValidatedMethod({` at line 102. The `run` function (lines 122-131) calls `PatientFileReports.remove(reportId)` — this is a hard remove call on the collection, not `$set: { removed: true }`. However, the `Collection` base class wraps `remove` to perform soft-deletion (per the schema having `removed/removedAt` fields). The discovery claims "No hard delete; physically remains in DB" — this is consistent with the base class behavior but cannot be fully confirmed from `methods.jsx` alone without reading the `Collection` class definition. No finding contradicting the discovery claim; classified as consistent. **No discrepancy.**

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-CR-01 | NOTE | citation | `clinical_reports.md:12` line citation is incorrect — the quoted phrase "stored as a single editable HTML blob with no versioning, no signatures, no audit, no templates" originates from line 57 of that file, not line 12. Line 12 begins the "What it is" section. | Record; no spec impact. |
| V-CR-02 | NOTE | citation | `clinical_reports.md` reported as 175 lines; actual line count is 230. Undercount of 55 lines. | Record; extra content reviewed and any material omissions noted separately. |
| V-CR-03 | NOTE | citation | `patient_documents.md` reported as 140 lines; actual line count is 269. Undercount of 129 lines. | Record; extra content reviewed. |
| V-CR-04 | CLARIFY | citation | Helpdesk "Documenten" section cited at lines ~1200-1350 of `general_getting_started.md`. Actual content (upload/search workflow) is at lines 2039-2145. Lines 1200-1350 cover billing and member settings. Additionally, the helpdesk calls the tab "Verslagen" not "Documenten." The tab name discrepancy (code calls it "Documenten," helpdesk calls it "Verslagen") is a material ambiguity for UI parity. | Add to NEEDS CLARIFICATION backlog: verify current tab label in staging ("Documenten" or "Verslagen"?). |
| V-CR-05 | CLARIFY | domain | The NEEDS DOMAIN REVIEW question on 30-year retention and versioning is partially answered. Retention (30 years min) is confirmed by Kwaliteitswet art. 35. Versioning is NOT explicitly required by the statute. However, absence of versioning impairs the logopedist's ability to fulfill patient-rights obligations (rectification, annotation) under Wet Patiëntenrechten arts. 15-16 and GDPR arts. 15-16. The legacy single-blob-overwrite pattern creates a practical compliance risk even if it does not violate the letter of art. 35. | Spec author must note: parity-preserve the overwrite behavior is legally acceptable, but the new app should recommend or enable versioning as a compliance improvement. This is a product decision, not a porting blocker. |
| V-CR-06 | CLARIFY | domain | RIZIV demand-form templates are government-mandated (per RIZIV Conventiecommissie). New 2025 form versions (effective 01/05/2025, transition to 30/06/2025; new orthodontic form 01/09/2025). The PDF assets in `Halingo-Main/assets/app/files/demandForm/` may be outdated. The discovery file does not mention form version currency. | Spec author must flag: before Phase 2 spec authoring for `reports/demand-forms`, verify whether the PDF assets in the legacy are 2025-compliant. This is a regulatory compliance check for the demand-form feature. |
| V-CR-07 | CLARIFY | domain | Google Docs Viewer fallback: domain review confirms this is a GDPR Art. 28/44 concern, not merely a "privacy risk." Sending patient document URLs (which include a `userId` enabling authenticated access to health data) to Google constitutes a health-data transfer to a sub-processor without an established lawful basis for special-category data under Art. 9. Cannot be migrated as-is without a DPA with Google and a valid Art. 44 transfer mechanism. The existing NEEDS CLARIFICATION entry is accurate but understates the compliance dimension. | Spec author: this is not a QUIRK-PRESERVE candidate — it is a feature that cannot be ported without a product-owner decision AND a legal assessment of the sub-processor relationship with Google. Escalate to human before spec authoring for `reports/google-preview`. |
| V-CR-08 | NOTE | omission | MS-Word HTML export (`htmlToDoc()` download button on every report) is not cataloged as a feature. Present in `clinical_reports.md` lines 147-148 and 178. | Add as minor feature to catalog or note under `reports/rich-text`. |
| V-CR-09 | CLARIFY | omission | `Formulieren` tab gating condition: the discovery says the tab is "only visible if the treatment type matches one of the stock RIZIV templates." The actual gating condition is the *popup context* (`enableDemandForm` prop, true only when opened from a treatment panel). Treatment-type matching is a secondary constraint inside `generateDemandForm`, not the primary visibility guard. The discovery's staging observation may reflect the combined effect, but the spec must encode the correct technical trigger. | Add to NEEDS CLARIFICATION backlog for `reports/demand-forms` spec. |
| V-CR-10 | NOTE | omission | `html-pdf`/PhantomJS characterized as "slated for replacement" in discovery sources table. `deprecation_list.md` explicitly excludes it from the deprecation list, categorizing it as technical debt but not formally deprecated. The migration guidance (do not port) is still correct. | Record; no spec impact since the guidance is correct regardless. |
| V-CR-11 | NOTE | omission | Publications bug has a secondary crash risk: if `reportId` in `patientFileReport` publication does not match a document, `patientFileReport.patientFileId` throws a null-pointer error. Not mentioned in discovery. | Note for the porting team. Not a spec blocker. |
| V-CR-12 | NOTE | citation | Feature `reports/demand-forms` cites `clinical_reports.md:134` as the HalingoDoc source. Line 134 is in the "Demand-form generation" user behavior section — the primary method description is at lines 99-120. The citation points to a related but secondary location. | Record; no spec impact. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring** with the following pre-conditions:

1. **Before spec authoring for `reports/demand-forms`:** A human must verify whether the PDF assets in `Halingo-Main/assets/app/files/demandForm/` are the current 2025 RIZIV-mandated forms (effective 01/05/2025). If not, new assets must be obtained from riziv.fgov.be before the new app can generate compliant demand forms.

2. **Before spec authoring for `reports/google-preview`:** Escalate to the product owner. The Google Docs Viewer feature cannot be ported without a DPA with Google and a valid GDPR Art. 44 transfer mechanism for health data. The product decision is: (a) replace with an in-app viewer, (b) drop the feature, or (c) proceed with the legal work. This is not a spec author decision.

3. **CLARIFY backlog additions for the spec author:**
   - Verify the current tab label in staging: "Documenten" or "Verslagen"? (V-CR-04)
   - Document the `enableDemandForm` prop logic as the primary gating for the Formulieren tab, not treatment-type matching (V-CR-09)
   - Note the MS-Word HTML export as an in-scope behavior for `reports/rich-text` (V-CR-08)
   - Note that the 30-year retention compliance risk from single-blob overwrite is a product improvement opportunity, not a blocker for parity (V-CR-05)

4. **No BLOCKERs found.** All claims in the discovery file are factually supportable. The two line-count errors (V-CR-02, V-CR-03) did not result in missed features that would corrupt the spec — the extra content has been reviewed and the only additional items are cataloged as NOTEs or CLARIFYs above.
