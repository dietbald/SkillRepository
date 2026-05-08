# Document Digitization

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Patient file documents (PDFs, images), upload, search.

## Spec contracts (Phase 2)

- **document-list-and-search** — Feature: document-digitization/document-list-and-search
  - Path: `02-specs/document-digitization/document-list-and-search/spec.md`
- **document-upload** — Feature: document-digitization/document-upload
  - Path: `02-specs/document-digitization/document-upload/spec.md`
- **document-view-and-edit** — Feature: document-digitization/document-view-and-edit
  - Path: `02-specs/document-digitization/document-view-and-edit/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/document-digitization.md`)

# Phase 1 Discovery — Area #10 Document Digitization

**Area definition:** Digitization and management of patient-related documents, including S3-backed binary storage, metadata tagging, and unified clinical document search.
**Competency #10** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/general_getting_started.md` | 2191 | §§ "Documenten" (lines ~1200-1350) | User-level upload, search, and tagging workflow in NL. |
| Curated | `functional/application_map.md` | — | § 2 competency 10 | Formal area definition. |
| Code-derived | `from_source/features/patient_documents.md` | 140 | full | S3 backend, FilesCollection schema, permission hooks, viewer logic. |
| Code-derived | `from_source/features/clinical_reports.md` | 175 | full | Interaction between binary uploads and in-app rich-text reports. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | 158 | full | `userId` leak in download URLs, Google Docs Viewer privacy risk. |
| Cross-cutting | `from_source/deprecation_list.md` | — | — | No direct deprecations for the core binary storage module. |

### What HalingoDoc covers for this area

HalingoDoc identifies that document management is built on `meteor/ostrio:files` and backed by **AWS S3**. It documents the "Documenten" tab's unified interface which lists both uploaded files and in-app reports. It covers the drag-and-drop upload flow, the tagging system, and the basic viewer components. It flags security concerns regarding `userId` exposure in download query parameters.

### What HalingoDoc does NOT cover

HalingoDoc helpdesk material focuses on the UI but misses technical details like the S3 bucket configuration (`Meteor.settings.AWSS3Bucket`), the lack of virus scanning, and the fact that soft-deleted documents are never physically removed from S3.

### Direct citations worth preserving

> "The patient's documents are never accessible via a presigned S3 URL — the user must be authenticated to Meteor and pass the `canUserViewPatientFile` check." — `from_source/features/patient_documents.md:55`

> "The Google Docs Viewer integration sends the document URL (with userId in query) to Google for rendering. This is the only way the app handles non-PDF, non-image office documents." — `from_source/features/patient_documents.md:110`

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/patientFiles/`
  - `Documents.js` — FilesCollection definition, blackbox metadata schema.
  - `server/documentsConfig.js` — S3 read/write hooks, permission callbacks.
  - `methods.jsx` — `editFile` (rename/tag), `deleteFile` (soft-remove).
- `app/imports/lib/upload/`
  - `FileCollectionBase.js` — Base class with Halingo's soft-delete schema overlay.
  - `aws/s3helpers.js` — `uploadToS3` and `downloadFromS3` streaming logic.
  - `aws/s3Client.js` — AWS SDK v2 client initialization.
- `app/imports/modules/patientfiles/reports/`
  - `PatientFileDocumentPage.jsx` — Document viewer with inline `iframe`/`img` logic.
  - `PatientFileReportsOverviewPage.jsx` — Grid list with `CircularProgress` for uploads.

### Key symbols per file

- `Documents` (`api/patientFiles/Documents.js:31`) — Main binary collection.
- `downloadFromS3` (`lib/upload/aws/s3helpers.js:58`) — Pipes S3 body into HTTP response.
- `onBeforeUpload` (`api/patientFiles/server/documentsConfig.js:23`) — Permission gate (requires `patientFile.update` + active sub).
- `interceptDownload` (`api/patientFiles/server/documentsConfig.js:21`) — Redirects standard download route to S3 streamer.

### Discrepancies found vs HalingoDoc

- **None found.** The source code strictly follows the `from_source` feature documentation. The `userId` leak was confirmed in `documentsConfig.js:19`.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 3 (Login, Patient Dossier, Documents Tab)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/document-digitization/`

### Per-screen catalog

| # | URL | Screen | Language | Findings | Screenshot |
|---|---|---|---|---|---|
| 01 | `/patients/:id` | Dossier Info | NL | Direct navigation to Sophie Janssens (XJbcHReM3q63hdXpR). | `01-dossier-direct-nav.png` |
| 02 | `/patients/:id?tabIndex=3`| Documenten | NL | Tab 3 shows empty document list, search bar, and "NIEUW DOCUMENT" button. | `02-documents-tab.png` |
| 03 | `/patients/:id?tabIndex=3`| Add Modal | NL | "Uploaden" tab with file drop zone and tag selector. | `03-add-document-modal.png` |

### Behavior observed on staging

- **Drag-and-Drop:** The entire Documents tab content area is a drop target. Dropping a file immediately starts an upload with a progress circle in the bottom right.
- **Search Integration:** The search bar at the top of the tab supports name and tag filtering.
- **Tagging:** Tags added during upload are immediately unioned into the dossier's global tag list.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `docs/s3-storage` | S3 Binary Storage | docs + source | `patient_documents.md` | `s3helpers.js` | N/A | AWS S3 based; files unlinked from Meteor FS after upload. |
| 2 | `docs/streamed-download`| Streamed Proxy Downloads | docs + source | `patient_documents.md:55`| `documentsConfig.js:21` | Documents Tab | No direct S3 URLs; Meteor proxies binary via `s3.getObject`. |
| 3 | `docs/tagging` | Document Metadata Tagging | docs + source + staging | `general_getting_started.md` | `methods.jsx:719` | Add Modal | Recomputes `files.tags` union on dossier. |
| 4 | `docs/viewer` | Multi-format Document Viewer | docs + source | `patient_documents.md:104`| `PatientFileDocumentPage.jsx`| Viewer Screen | `iframe` for PDF, `img` for pics, Google Docs for Office. |
| 5 | `docs/soft-delete` | S3 Document Soft-Deletion | docs + source | `patient_documents.md:141-149`| `methods.jsx:771` | Document List | Soft-delete Mongo row only; binary remains in S3. |
| 6 | `docs/search` | Unified Document Search | docs + source + staging | `general_getting_started.md` | `PatientFileReportsOverviewPage.jsx`| Documents Tab | Searches across `Documents` and `PatientFileReports`. |

---

## Cross-references to other areas

- **#9 Clinical Reporting:** Generated demand forms are saved directly into the `Documents` collection.
- **#3 Patient Data Privacy:** `userId` leak in download URLs and S3 data retention.
- **#20 SaaS Lifecycle:** Uploads are gated by practice subscription status.

---

## [NEEDS CLARIFICATION]

### Q1: Is the lack of physical S3 deletion an intentional archival feature?
- **Why it matters:** S3 storage costs and GDPR data minimization requirements.
- **What would resolve:** Product owner decision on whether to implement S3 `deleteObject` on soft-delete.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does the 30-year retention rule (Kwaliteitswet art. 35) apply to all document types (e.g., voice recordings)?
- **Found in:** `logopedist-be` skill / `07-gdpr-and-patient-rights.md`
- **Why it matters:** Determines if non-textual patient media must be retained for three decades.
- **What I know:** Art. 35 applies to the "patient dossier," which usually includes all diagnostic data.

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/from_source/features/patient_documents.md`
- `/home/tj/HalingoDoc/docs/from_source/features/clinical_reports.md`
- `/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md`
- `/home/tj/HalingoDoc/docs/full_documentation/general_getting_started.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/Documents.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/server/documentsConfig.js`
- `/home/tj/Repos/Halingo-Main/app/imports/lib/upload/aws/s3helpers.js`
- `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`

---

## Verification notes (verbatim from `01-discovery/document-digitization.verification.md`)

# Verification: Document Digitization (Area #10)

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/document-digitization.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "Documents are never accessible via presigned S3 URL" | `patient_documents.md:55` | ~ | Claim accurate. Line number wrong — actual location is ~lines 73-74. |
| 2 | "Google Docs Viewer sends document URL with userId to Google" | `patient_documents.md:110` | ~ | Claim accurate. Actual location is ~lines 186-190, not 110. |
| 3 | Feature #1 notes: "AWS SES based" | `s3helpers.js` | ✗ | **BLOCKER typo.** Must be "AWS S3 based". SES is the email service. |
| 4 | Feature #5 HalingoDoc citation: `patient_documents.md:771` | `patient_documents.md` | ✗ | **BLOCKER.** File has only 269 lines. Correct reference is ~lines 141-149. |
| 5 | Feature #5 Meteor citation: `methods.jsx:771` | `methods.jsx` | ✓ | Verified. `deleteFile` method begins at exactly line 771. |
| 6 | `onBeforeUpload` at `documentsConfig.js:23` | `documentsConfig.js` | ~ | Off-by-one: actual is line 24. Claim accurate. |
| 7 | `interceptDownload` at `documentsConfig.js:21` | `documentsConfig.js` | ~ | Off-by-two: actual is line 23. Claim accurate. |
| 8 | `downloadFromS3` at `s3helpers.js:58` | `s3helpers.js` | ✓ | Verified exactly. |
| 9 | `Documents` FilesCollection at `Documents.js:31` | `Documents.js` | ✓ | Verified exactly. |
| 10 | `userId` leak at `documentsConfig.js:19` | `documentsConfig.js` | ~ | TODO at 19, assignment at 20. Claim accurate. |
| 11 | Feature #3 tagging: `methods.jsx:719` | `methods.jsx` | ✓ | Verified exactly. |
| 12 | "Searches across Documents and PatientFileReports" | `PatientFileReportsOverviewPage.jsx` | ✓ | Confirmed by both `clinical_reports.md` and `patient_documents.md`. |
| 13 | Cross-ref #9: "Demand forms saved into Documents collection" | `clinical_reports.md` | ✓ | Verified at lines 11-12 and 119-120. Bidirectional. |
| 14 | `onBeforeUpload` requires `patientFile.update` + active sub | `documentsConfig.js` | ✓ | Verified at lines 29-42. |

---

## Material omissions

Features or behaviors present in cited HalingoDoc sources but absent from the discovery:

1. **No file size limit documented.** `patient_documents.md` (lines 232-233) notes no file size limit visible. Relevant for Phase 2 spec.
2. **Local filesystem fallback.** `patient_documents.md` (lines 77-79) documents fallback to local FS via `Meteor.settings.storage.documents`. Only S3 mentioned in discovery.
3. **S3 key naming convention** (`documents/patientfiles/<patientFileId>/<name>-<docId>.<ext>`). Load-bearing for dual-write migration — existing S3 objects must remain accessible.
4. **Four-permission matrix** (view / upload / edit / delete) not fully captured. Phase 2 spec needs the complete matrix from `patient_documents.md` Permissions section.
5. **Tag editing hidden for treatment-linked documents** (`meta.treatmentId` set). Affects `docs/tagging` spec.
6. **`onbeforeunloadMessage` browser warning during upload.** UX requirement for `docs/s3-storage`.
7. **`files.tags` recomputed from scratch, not incrementally.** Performance implication on large dossiers.
8. **Tab name discrepancy.** Helpdesk says "verslagen"; source code says "Documenten". Historical naming inconsistency.

---

## Cross-area reference check

| Reference | Claim | Verified? | Finding |
|---|---|---|---|
| #9 Clinical Reporting | "Demand forms saved into Documents collection" | ✓ | Confirmed in `clinical_reports.md` lines 11-12, 119-120. Bidirectional. |
| #3 Patient Data Privacy | "`userId` leak + S3 data retention" | ✓ | Confirmed in `bugs_and_security_findings.md` lines 25-33 and `patient_documents.md` line 226. |
| #20 SaaS Lifecycle | "Uploads gated by subscription status" | ✓ | Confirmed in `documentsConfig.js` lines 29-32. One-directional (cannot verify #20 reciprocal without reading that discovery). |

---

## Domain review (logopedist-be)

### Kwaliteitswet art. 35 — 30-year retention

**Discovery claim (NEEDS DOMAIN REVIEW):** "Does the 30-year retention rule apply to all document types (e.g., voice recordings)?"

**Skill finding:** CONFIRMED. Art. 35 Kwaliteitswet (22 April 2019) requires 30-50 year retention of the "patientendossier." Art. 33 defines the dossier holistically — any diagnostic media (including voice recordings) made as part of clinical assessment is covered. The right to erasure (GDPR art. 17) does NOT override the 30-year retention (art. 17(3)(b) and (c) carve-outs).

**Implication:** S3 physical deletion of clinical documents may be *legally prohibited* during the retention window. Discovery's Q1 is partially a compliance question, not just cost/design.

### Google Docs Viewer privacy concern

**Discovery claim:** Flagged as security concern.

**Skill finding:** CONFIRMED as genuine compliance risk. Three overlapping issues:
1. **International data transfer (GDPR Art. 44-49):** Patient document content sent to US Google servers — special-category health data under Art. 9.
2. **Art. 32 security:** Document URLs (with userId) cached on Google CDN infrastructure.
3. **Art. 9 Kaderwet (Belgian):** Undeclared sub-processor relationship — Google not in any halingo DPA.

**Recommendation:** Phase 2 spec for `docs/viewer` must NOT port Google Docs Viewer without legal review. In-app viewer or on-prem rendering (LibreOffice headless) is the compliant path.

---

## Escalated source checks (Step 4)

| # | File | Claim | Finding |
|---|---|---|---|
| 1 | `Documents.js:31` | FilesCollection definition | ✓ Verified exactly. Schema includes `meta.patientFileId`, `meta.tags`, `meta.treatmentId`, `meta.data` (blackbox). |
| 2 | `documentsConfig.js:19-24` | Permission gate + interceptDownload + userId leak | ✓ All claims accurate. Line numbers off by 1-2 but behaviors confirmed. |
| 3 | `s3helpers.js:58` | `downloadFromS3` streaming | ✓ Verified exactly. S3 getObject → stream.PassThrough → serve. Returns true on success, false if S3 key not yet set. |
| 4 | `methods.jsx:719,771` | editFile (tagging) + deleteFile (soft-delete) | ✓ Both verified exactly. `Documents.remove(documentId)` at line 795 confirms no S3 cleanup. |

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-docdig-01 | BLOCKER | citation | Feature #1 notes says "AWS SES based" — must be "AWS S3 based". Would produce wrong spec if taken at face value. | Must correct before Phase 2. |
| V-docdig-02 | BLOCKER | citation | Feature #5 cites `patient_documents.md:771` — file has only 269 lines. Correct reference is ~lines 141-149. `methods.jsx:771` is correct. | Must correct before Phase 2. |
| V-docdig-03 | CLARIFY | domain | Art. 35 Kwaliteitswet 30-year retention likely prohibits S3 physical deletion of clinical documents. Q1 is a compliance question, not just cost/design. Distinguish clinical vs non-clinical documents. | Add to NEEDS CLARIFICATION backlog. |
| V-docdig-04 | CLARIFY | domain | Google Docs Viewer = undeclared sub-processor processing Belgian health data on Google servers. Art. 9 GDPR / Kaderwet violation risk. Phase 2 spec must block this pattern without legal review. | Escalate to spec author. |
| V-docdig-05 | CLARIFY | omission | S3 key naming convention (`documents/patientfiles/<patientFileId>/<name>-<docId>.<ext>`) missing from feature catalog. Load-bearing for dual-write migration. | Add to `docs/s3-storage` spec. |
| V-docdig-06 | CLARIFY | omission | Four-permission matrix (view / upload / edit / delete) not fully captured. Spec author needs the complete matrix. | Add to spec author reading list. |
| V-docdig-07 | NOTE | citation | `interceptDownload` (discovery `:21`, actual `:23`) and `onBeforeUpload` (discovery `:23`, actual `:24`) off by 1-2 lines. Claims accurate. | Record for completeness. |
| V-docdig-08 | NOTE | citation | `patient_documents.md:55` (actual ~73-74) and `:110` (actual ~186-190) — line numbers wrong, claims accurate. | Record for completeness. |
| V-docdig-09 | NOTE | citation | userId leak cited at `:19`; actual assignment at `:20`. | Record for completeness. |
| V-docdig-10 | NOTE | omission | Traceability section lists 8 files but Source 2 lists 12. Four Meteor files + `application_map.md` missing from traceability. Claims independently corroborated. | Record for completeness. |
| V-docdig-11 | NOTE | omission | Local filesystem fallback not mentioned. Dev-environment detail. | Add as dev-only note in spec. |
| V-docdig-12 | NOTE | omission | `files.tags` recomputed from scratch (not incremental) — performance implication not flagged. | Add as QUIRK-PRESERVE candidate. |
| V-docdig-13 | NOTE | omission | Tag editing conditionally hidden for treatment-linked documents. Not mentioned in `docs/tagging`. | Add to `docs/tagging` spec. |

---

## Recommendation

**PROCEED to Phase 2 with corrections required before spec authoring begins.**

Two BLOCKERs must be fixed in the discovery file:
1. **V-docdig-01:** Change "AWS SES based" to "AWS S3 based" in Feature #1 notes.
2. **V-docdig-02:** Correct Feature #5 HalingoDoc citation from `patient_documents.md:771` to `patient_documents.md:141-149`.

Four CLARIFYs should be added to the `[NEEDS CLARIFICATION]` backlog:
- V-docdig-03: S3 deletion is a compliance question (30-year retention) — human/product-owner decision needed.
- V-docdig-04: Google Docs Viewer must not be ported without legal review.
- V-docdig-05: S3 key layout is migration-critical and must be explicitly specified.
- V-docdig-06: Complete permission matrix needed for spec authoring.

Core behavioral claims — S3 backend, streaming proxy, soft-delete, tagging, permission structure, security findings — are all source-verified and accurate.
