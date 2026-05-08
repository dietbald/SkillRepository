# Patient Data Privacy + Patient Management

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Patient dossiers, GDPR (gap), access control, list/detail/edit.

## Spec contracts (Phase 2)

- **create-patient** — Feature: patient/create-patient
  - Path: `02-specs/patient/create-patient/spec.md`
- **patient-access-control** — Feature: patient/patient-access-control
  - Path: `02-specs/patient/patient-access-control/spec.md`
- **patient-detail** — Feature: patient/patient-detail
  - Path: `02-specs/patient/patient-detail/spec.md`
- **patient-edit** — Feature: patient/patient-edit
  - Path: `02-specs/patient/patient-edit/spec.md`
- **patient-list** — Feature: patient/patient-list
  - Path: `02-specs/patient/patient-list/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/patient-data-privacy.md`)

# Phase 1 Discovery — Area #3 Patient Data Privacy

**Area definition:** GDPR-compliant storage of sensitive medical and personal data.
**Competency #3** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Code-derived | `from_source/gaps/03_patient_data_privacy.md` | 267 | full | Extensive gap analysis confirming major missing GDPR features. |
| Code-derived | `from_source/features/patient_file_access_control.md` | 185 | full | Two-tier RBAC (practice and per-file) detailed matrix. |
| Code-derived | `from_source/features/patient_documents.md` | 154 | full | S3 storage, download pipe, and soft-delete semantics. |
| Code-derived | `from_source/features/patient_files.md` | 212 | full | Patient schema including SSN (INSZ) and clinical metadata. |
| Code-derived | `from_source/features/admin_impersonation.md` | 84 | full | Security risk: dormant impersonation bypassing audit logs. |
| Code-derived | `from_source/features/method_audit_log.md` | 118 | full | Failure-only audit log (`method-logs` collection). |
| Code-derived | `from_source/deprecation_list.md` | 183 | full | `users.delete`, `MethodLogger`, `admin_impersonation` slated for removal. |
| Code-derived | `from_source/bugs_and_security_findings.md` | 158 | full | SSRF in `pdf.generate`, `userId` leak in download URLs. |
| Helpdesk | `full_documentation/patient_management.md` | 283 | full | Basic patient roster and soft-deletion mentions. |

### What HalingoDoc covers for this area

HalingoDoc provides a brutal but thorough assessment of the legacy app's privacy posture. It confirms that the app is almost entirely missing explicit GDPR data subject rights implementations. It covers the two-tier RBAC system (practice-level vs. per-file ACL), the S3-backed document storage with its permission hooks, and the failure-only audit logging system. The "gaps" file is the primary source for the "not implemented" status of many features.

### What HalingoDoc does NOT cover

HalingoDoc does not describe any path for real data erasure (due to Belgian retention law conflict), and it notes the absence of any patient-facing consent capture or portal for data access. It does not provide the specific Belgian legal citations for the 30-year retention rule (though it mentions it exists).

### Direct citations worth preserving

> "Halingo's implementation of 'delete a patient' is a soft delete that does not erase anything in the literal sense... the mongo document is never deleted." — `from_source/gaps/03_patient_data_privacy.md:55-68`

> "The download permission check accepts a userId from the URL query string... This is a TODO in the source code and is a potentially weak link if the URL leaks." — `from_source/features/patient_documents.md:46`

> "A successful method call is invisible... the log row is written asynchronously in the .catch handler." — `from_source/features/method_audit_log.md:45`

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/patientFiles/`
  - `patientFiles.jsx` — Schema (Plaintext INSZ, demographics)
  - `methods.jsx` — Deletion cascade and sharing logic
  - `Documents.js` — FilesCollection definition
  - `server/documentsConfig.js` — S3 permission hooks and `userId` leak
  - `server/rosa-patients.ts` — Opaque third-party sync
- `app/imports/api/patientFileUsers/`
  - `patientFileUsers.jsx` — Per-file RBAC roles (`admin` == `default` in code)
  - `util.jsx` — Permission resolution (additive OR-logic)
- `app/imports/api/logger/`
  - `logger.js` — `method-logs` collection
- `app/imports/lib/permissions/`
  - `LoggedInValidatedMethod.jsx` — Failure-only logging logic
  - `PermissionValidatedMethod.jsx` — Permission wrapper
- `app/imports/api/users/`
  - `methods.jsx` — `users.delete` (Soft-delete only)

### Key symbols per file

- `PatientFiles` (`patientFiles.jsx:15`) — Main collection, soft-delete enabled.
- `PatientFileUsers` (`patientFileUsers.jsx:59`) — ACL collection.
- `roles` (`patientFileUsers.jsx:6`) — Identical `admin` and `default` permission lists.
- `deleteUser` (`api/users/methods.jsx:332`) — Slated for removal, only marks `removed: true`.
- `MethodLogger` (`api/logger/logger.js:5`) — Tracks method failures.

### Discrepancies found vs HalingoDoc

- **None found.** The HalingoDoc `from_source` layer accurately reflects the codebase. The `admin` vs `default` identicality was confirmed in the source as documented.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 5
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/patient-data-privacy/`

### Per-screen catalog

| # | URL | Screen | Account | Findings | Screenshot |
|---|---|---|---|---|---|
| 01 | `/login` | Login | N/A | Logged in as `owner`. | `01-dashboard-owner.png` |
| 02 | `/patients` | Patient List | `owner` | List of 3 patients (Sophie, Thomas, Amélie). | `02-patient-list-owner.png` |
| 03 | `/patients/:id` | Patient Detail | `owner` | Overview tab shown, no privacy/consent fields. | `03-patient-detail-owner.png` |
| 04 | `/patients/:id/docs`| Documents | `owner` | Upload UI present, no specific document ACL UI. | `04-patient-documents-owner.png` |
| 05 | `/patients/:id/edit`| Edit Form | `owner` | SSN and clinical fields are bare text. | `05-patient-edit-owner.png` |

### Behavior observed on staging

- **Standard RBAC:** Practice `owner` sees all patients. `lid` user sees NO patients by default (confirmed via source read, manual walk was limited by interactive element detection).
- **Deletion:** The "Verwijder" button exists but triggers a soft-delete (observed via source code).
- **No Privacy indicators:** There are no GDPR labels, consent checkboxes, or export buttons anywhere in the patient management flow.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `patient-data-privacy/access-control` | Two-tier additive RBAC | docs + source | `features/patient_file_access_control.md` | `patientFileUsers/util.jsx:11-27` | Patient Dashboard | Practice role OR-combined with per-file ACL. |
| 2 | `patient-data-privacy/soft-delete` | Soft-deletion of patient data | docs + source | `gaps/03_patient_data_privacy.md:55` | `api/server/collectionServer.js:35` | Detail Page | DEPRECATED (Soft-delete only). Data lives forever. |
| 3 | `patient-data-privacy/doc-storage` | S3-backed document storage | docs + source | `features/patient_documents.md` | `api/patientFiles/Documents.js` | Documents Tab | Piped through Meteor with `userId` leak. |
| 4 | `patient-data-privacy/audit-failure` | Failure-only method logging | docs + source | `features/method_audit_log.md` | `lib/permissions/LoggedInValidatedMethod.jsx` | N/A | DEPRECATED — DO NOT PORT. |
| 5 | `patient-data-privacy/user-delete` | Soft-delete of user accounts | docs + source | `deprecation_list.md: #2` | `api/users/methods.jsx:332` | N/A | DEPRECATED — DO NOT PORT. No cascade. |
| 6 | `patient-data-privacy/doc-viewer` | Google Docs office rendering | docs + source | `features/patient_documents.md` | `PatientFileDocumentPage.jsx:104` | Document Viewer | Privacy risk: leaks doc URL to Google. |
| 7 | `patient-data-privacy/rosa-sync` | Opaque patient sync to Rosa | docs + source | `gaps/03_patient_data_privacy.md:200` | `server/rosa-patients.ts` | N/A | No opt-out or transparency for patient. |
| 8 | `patient-data-privacy/impersonation` | Admin impersonation | docs + source | `features/admin_impersonation.md` | `api/shared/methods.js:49` | N/A | DEPRECATED — DO NOT PORT. Security risk. |

---

## Cross-references to other areas

- **#1 Identity Management:** User deletion (`users.delete`) and practice-level RBAC definitions.
- **#10 Document Digitization:** The `Documents` collection and S3 upload pipeline.
- **#18 External Platform Sync:** Rosa patient projection and permission mapping.

---

## [NEEDS CLARIFICATION]

### Q1: Is the `userId` in download URLs truly a security vulnerability?
- **Why it matters:** Affects the security model of the migration.
- **Sources conflict?** No. Source code has a `TODO` acknowledging the leak.
- **What would resolve:** Confirmation from the product owner on whether this should be hardened in the new stack.

---

## [NEEDS DOMAIN REVIEW]

### Q1: Reconciling 30-year retention with Right to Erasure.
- **Found in:** `HalingoDoc/docs/from_source/07-gdpr-and-patient-rights.md`
- **Why it matters:** Belgian law (*Kwaliteitswet* Art. 35) mandates 30-year retention for medical records, which overrides GDPR's right to erasure (Art. 17(3)).
- **What I know:** The `logopedist-be` skill confirms retention wins. Halingo currently meets the minimum by never deleting, but lacks the 50-year upper bound.

### Q2: Is the failure-only audit log sufficient for Belgian healthcare?
- **Found in:** `from_source/features/method_audit_log.md`
- **Why it matters:** GDPR accountability and the Belgian *Kaderwet* (Art. 9) require access logs for health data.
- **What I know:** Failure-only logging is likely insufficient to prove who accessed a record for non-clinical reasons.

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/from_source/gaps/03_patient_data_privacy.md`
- `/home/tj/HalingoDoc/docs/from_source/features/patient_file_access_control.md`
- `/home/tj/HalingoDoc/docs/from_source/features/patient_documents.md`
- `/home/tj/HalingoDoc/docs/from_source/features/patient_files.md`
- `/home/tj/HalingoDoc/docs/from_source/features/admin_impersonation.md`
- `/home/tj/HalingoDoc/docs/from_source/features/method_audit_log.md`
- `/home/tj/HalingoDoc/docs/from_source/deprecation_list.md`
- `/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md`
- `/home/tj/HalingoDoc/docs/full_documentation/patient_management.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/patientFiles.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/methods.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFileUsers/patientFileUsers.jsx`
- `/home/tj/Repos/Halingo-Main/app/imports/api/logger/logger.js`
- `/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/LoggedInValidatedMethod.jsx`
- `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`

---

## Verification notes (verbatim from `01-discovery/patient-data-privacy.verification.md`)

# Verification: Patient Data Privacy (Area #3)

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/patient-data-privacy.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "Halingo's implementation of 'delete a patient' is a soft delete that does not erase anything in the literal sense... the mongo document is never deleted." | `from_source/gaps/03_patient_data_privacy.md:55-68` | ✓ | Verified. Source text at lines 39-89 confirms this verbatim. The quoted sentence appears at the start of the Right to Erasure section. Line range "55-68" is an approximation — in the actual file the content spans roughly lines 39-89. Slight inaccuracy in line numbers, not material. |
| 2 | "The download permission check accepts a userId from the URL query string... This is a TODO in the source code..." | `from_source/features/patient_documents.md:46` | ✓ | Verified. Source file at lines 75-76 contains this statement with the verbatim TODO note. Line 46 is imprecise — actual content is at lines 75-76. Not material. |
| 3 | "A successful method call is invisible... the log row is written asynchronously in the .catch handler." | `from_source/features/method_audit_log.md:45` | ~ | Partially verified. The source confirms that the log is written only on failure. The phrase "written asynchronously in the .catch handler" is confirmed by the code at `LoggedInValidatedMethod.jsx:119-122`. However, the statement in the discovery conflates the async promise-rejection branch with the synchronous catch branch — the synchronous path is not async. The discovery's description slightly oversimplifies by saying only the `.catch` handler writes. Not load-bearing for Phase 2. |
| 4 | `roles` (`patientFileUsers.jsx:6`) — Identical `admin` and `default` permission lists | `patientFileUsers.jsx:6` | ✓ | Verified by direct source read. Lines 6-57 confirmed: both `admin` and `default` list the same 18 permissions. Line number is accurate. |
| 5 | `deleteUser` (`api/users/methods.jsx:332`) — only marks `removed: true` | `api/users/methods.jsx:332` | ✓ | Verified by direct source read. `deleteUser` at line 331 calls `UsersUtil.deleteUser` which only sets `removed: true` and clears login tokens. Line number accurate (method starts at 331, body at 332). |
| 6 | `MethodLogger` (`api/logger/logger.js:5`) — tracks method failures | `api/logger/logger.js:5` | ~ | Partially verified. HalingoDoc `method_audit_log.md` confirms that `MethodLogger` is the `method-logs` collection and tracks failures only. Line 5 not independently verified (only the first ~60 lines of the logger were read via HalingoDoc). Not material — the functional claim is correct. |
| 7 | Feature #2 `soft-delete`: source cited as `api/server/collectionServer.js:35` | `api/server/collectionServer.js:35` | ✓ | Verified by direct source read. Line 35 is `remove(selector, cb)` which calls `super.update` with `{ $set: { removed: true, removedAt: new Date() } }`. Accurate. |
| 8 | Feature #8 `impersonation`: source cited as `api/shared/methods.js:49` | `from_source/features/admin_impersonation.md` | ✓ | Verified. `admin_impersonation.md` line 10 confirms "A `Meteor.methods({ impersonateUser })` definition is present at `app/imports/api/shared/methods.js:49-71`". |
| 9 | Feature #6 `doc-viewer`: Google Docs rendering leaks doc URL to Google | `from_source/features/patient_documents.md` | ✓ | Verified. `patient_documents.md` lines 186-189 confirm: "Other types via Google Docs Viewer (`https://docs.google.com/gview?url=...`)". The privacy risk is explicitly flagged in the source. |
| 10 | Feature #7 `rosa-sync`: cited as `gaps/03_patient_data_privacy.md:200` | `gaps/03_patient_data_privacy.md:200` | ~ | Partially verified. The Rosa sync transparency gap is discussed in the source at lines 237 (Rosa cross-border sync transparency bullet). Line 200 specifically lands near the "What is missing" header area — approximate but the claim is substantively correct. |
| 11 | `deprecation_list.md: #13` cited for `user-delete` (Feature #5) | `from_source/deprecation_list.md` | ✗ | **WRONG CITATION NUMBER.** `users.delete` is deprecation list entry **#2**, not #13. Entry #13 is `getInvoiceStatistics and latestInvoiceDate` — a completely different feature. The feature claim (deprecated, no cascade) is correct, but the citation number is wrong. |

---

## Material omissions

The following features or behaviors are described in cited sources but not mentioned in the discovery file:

**1. The `patientFileUsers.admin` vs `patientFileUsers.default` distinction is more nuanced than stated.**
The discovery (Feature #1 and Traceability) states the roles are "identical." This is technically correct at the role-object level (same 18 permissions), but `patient_file_access_control.md` and `bugs_and_security_findings.md` make clear that:
- The **distinction only surfaces on Rosa** — per-file `admin` gets full Rosa permissions, `default` gets READ+UPDATE only.
- The backend does NOT enforce the UI restriction — `default` users can call ACL-management methods directly. This is a **confirmed authorization bug** (Q1, flagged in `bugs_and_security_findings.md`).

The discovery notes the roles are "identical" but does not call out the Rosa-only distinction, which is relevant to Area #18 (External Platform Sync). This omission is relevant to Phase 2 spec authoring for the access control feature. Tagged as CLARIFY.

**2. `patientFile.removeAccess` is absent from the per-file `admin` permission list.**
`patient_file_access_control.md` line 160 states: "`patientFile.removeAccess` is NOT in the per-file `admin` permission set — only users with practice-level owner/admin can revoke another user's per-file access." The discovery summarizes the RBAC but does not mention this asymmetry. Tagged as NOTE (does not affect erasure/privacy spec directly, but affects the access-control spec in Phase 2).

**3. The `USER_HAS_EVENTS_WITH_THIS_PATIENT` block on `removeAccess` is not mentioned.**
`patient_file_access_control.md` line 202 states that revoking access is refused if any `Events` document exists with `{ userId, patientFileId }`. This is a behavioral constraint that will appear in the Phase 2 spec for access control. Tagged as NOTE.

**4. Automatic self-grant on dossier creation for non-owner users is not mentioned.**
`patient_file_access_control.md` line 167 states: for a non-owner lid who creates a dossier, `_addPatientFile` auto-inserts `{ patientFileId, userId, role: "admin" }`. This is part of the RBAC story and relevant to Phase 2. Tagged as NOTE.

**5. Encryption at rest findings from `gaps/03_patient_data_privacy.md` are omitted.**
The source document (lines 204-214) covers field-level encryption absence, S3 default encryption reliance, and the unused `publicKeys` plumbing on `practiceUsers`. The discovery does not include an encryption feature in its feature catalog. This is a material omission for a GDPR-area discovery — the new spec will need to address this. Tagged as CLARIFY.

**6. Children's data special treatment is omitted.**
`gaps/03_patient_data_privacy.md` (line 236) explicitly calls out that Halingo stores pediatric data (`pupil`, `student` profession types, `school`, `CLB`, teachers, coordinators) and that Belgian/EU law requires extra protection for minors' data, with no current implementation. This is relevant to Phase 2 spec for GDPR compliance. Tagged as CLARIFY.

**7. `MethodLogger` intentional-disable framing is not fully represented.**
The discovery labels Feature #4 ("Failure-only method logging") as "DEPRECATED — DO NOT PORT." This is correct per `deprecation_list.md` #17. However, the discovery's NEEDS DOMAIN REVIEW Q2 asks whether the failure-only log is "sufficient for Belgian healthcare" — this question is moot since the product owner explicitly said the log was disabled intentionally. The question should be reframed as: what replacement audit mechanism should the new stack implement? Tagged as NOTE (disposition of Q2 needs updating).

---

## Cross-area reference check

| Cross-reference claimed | Direction | Verified in target? | Finding |
|---|---|---|---|
| **#1 Identity Management** — user deletion + practice-level RBAC | patient-data-privacy → identity | Partial | `identity.md` does not cross-reference back to `patient-data-privacy` by name. The GDPR consequence of `users.delete` is mentioned in `identity.md` (lines 89-92: "the patient-data-privacy gap stays empty"). Cross-reference exists but is one-way in the identity file — the identity discovery quotes the gap but doesn't link back to Area #3 in its cross-references section. Not blocking. |
| **#10 Document Digitization** — `Documents` collection and S3 pipeline | patient-data-privacy → document-digitization | ✓ | `document-digitization.md` cross-references section (line 104) explicitly states: "**#3 Patient Data Privacy:** `userId` leak in download URLs and S3 data retention." Bidirectional. |
| **#18 External Platform Sync** — Rosa patient projection and permission mapping | patient-data-privacy → external-platform-sync-rosa | ✓ | `external-platform-sync-rosa.md` cross-references section (line 92) states: "**Patient Data Privacy (#3):** Security of Rosa integration tokens." Bidirectional. The framing differs slightly — the rosa file focuses on token security, while patient-data-privacy focuses on opt-out transparency — but the cross-reference is legitimate and present. |

---

## Domain review (logopedist-be)

Domain claims verified against `/home/tj/.claude/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`:

**Claim 1: Belgian law (*Kwaliteitswet* Art. 35) mandates 30-year retention for medical records, which overrides GDPR's right to erasure (Art. 17(3)).**

VERIFIED. The skill file at section 5 states verbatim:
> *De gezondheidszorgbeoefenaar bewaart het patiëntendossier gedurende minimum 30 jaar en maximum 50 jaar te rekenen vanaf het laatste contact met de patiënt.*

And: "Right to erasure does NOT override the 30-year retention — GDPR art. 17(3)(b) and (c) carve-out." The discovery correctly identifies the tension but understates one important dimension: the retention is **30 years minimum, 50 years maximum** — the discovery mentions 30 years but omits the 50-year upper bound. The discovery document at line 136 acknowledges "lacks the 50-year upper bound" — so the omission is noted but the underlying claim is correct.

The discovery also correctly states that "retention wins" — confirmed by the skill's verified fact #9.

**Assessment: PASS on the core claim. The 50-year ceiling is correctly identified as a gap in the original but not surfaced in the feature catalog.**

**Claim 2: Belgian *Kaderwet* (Art. 9) requires access logs for health data.**

PARTIALLY VERIFIED — claim is an overgeneralization. The skill file at section 2 (Belgian GDPR Kaderwet) states that Art. 9 of the Kaderwet requires controllers to:
1. Designate categories of persons with access;
2. Keep that list available for the GBA;
3. Ensure those persons are bound by a confidentiality obligation.

The requirement to keep "access logs" per se is not stated in Art. 9 of the Kaderwet. The access-log requirement comes from GDPR Art. 9(2)(h)/9(3) accountability + GDPR Art. 32 security obligations + the skill file's statement: "the architecture must make 9(2)(h) provable: role-based access, audit logs, access bound to identified care providers." The skill file also cites: "Access log of every read/write → art. 9 Kaderwet and GDPR accountability" in the Patient Rights Law mapping.

The discovery's formulation ("Belgian *Kaderwet* (Art. 9) requires access logs") is a reasonable practical inference but overstates the direct statutory text. The obligation emerges from GDPR accountability principles and GDPR Art. 32 applied to health data, not from a single explicit "you must log every access" provision in Art. 9 Kaderwet alone.

**Assessment: CLARIFY — the claim is directionally correct (audit logs are required to demonstrate GDPR compliance for health data) but the legal attribution is imprecise. Phase 2 spec author should cite GDPR Art. 32 + Art. 9(2)(h) accountability + the GBA's health-data guidance rather than "Kaderwet Art. 9" as the primary source for the access-log requirement.**

**Claim 3 (implicit): The discovery cites `HalingoDoc/docs/from_source/07-gdpr-and-patient-rights.md` as the source for NEEDS DOMAIN REVIEW Q1 (line 134).**

This file does NOT exist in HalingoDoc. The actual source is the logopedist-be skill at `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`. The Traceability section at the bottom of the discovery (line 161) correctly cites the skill path. The NEEDS DOMAIN REVIEW block incorrectly cites it as a HalingoDoc path.

**Assessment: BLOCKER (documentation integrity). The source path in NEEDS DOMAIN REVIEW Q1 is incorrect and would mislead the Phase 2 spec author trying to locate the cited material.**

---

## Escalated source checks (Step 4)

Three claims were checked against Meteor source directly:

**Check 1: `patientFileUsers.jsx:6` — roles `admin` and `default` having identical permission lists**

Read `app/imports/api/patientFileUsers/patientFileUsers.jsx` lines 1-57. CONFIRMED. Both roles list the same 18 permissions. The `owner` role has only `patientFile.view`. The discovery's claim is accurate.

**Check 2: `api/users/methods.jsx:332` — `deleteUser` only marks `removed: true`**

Read `app/imports/api/users/methods.jsx` lines 325-338. CONFIRMED. The method at line 331 (`deleteUser`) calls `UsersUtil.deleteUser && UsersUtil.deleteUser(this.userId)`. HalingoDoc `gaps/03_patient_data_privacy.md` confirms `_deleteUser` only sets `removed: true` and clears login tokens. No cascade to patient files. The discovery's claim is accurate.

**Check 3: `server/documentsConfig.js` — the `userId` leak in download URLs**

Read `app/imports/api/patientFiles/server/documentsConfig.js` lines 1-63. CONFIRMED. Line 20 shows: `const userId = this.userId || this.request.query.userId;`. The `TODO` comment at line 19 reads: "TODO do not pass userId in URL, but use signed s3 url for downloading?" The discovery's claim is accurate. The URL structure `/files/<id>?userId=<userId>` is confirmed by `patient_documents.md` line 127.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-PDP-01 | BLOCKER | citation | NEEDS DOMAIN REVIEW Q1 cites `HalingoDoc/docs/from_source/07-gdpr-and-patient-rights.md` — this file does not exist in HalingoDoc. The correct path is the logopedist-be skill file at `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md` (confirmed in the Traceability section at line 161, but the NEEDS DOMAIN REVIEW block body is wrong). A Phase 2 spec author following the NEEDS DOMAIN REVIEW citation will not find the file. | Must correct the path in the discovery file before Phase 2 authoring for this area. |
| V-PDP-02 | BLOCKER | citation | Feature #5 (`patient-data-privacy/user-delete`) cites `deprecation_list.md: #13` for `users.delete`. Entry #13 is `getInvoiceStatistics` — the correct entry is **#2**. The factual claim is correct but the citation number is wrong. | Must correct the citation number before Phase 2. |
| V-PDP-03 | CLARIFY | domain | NEEDS DOMAIN REVIEW Q2 frames the failure-only audit log as potentially "sufficient for Belgian healthcare" under "Kaderwet Art. 9." The legal attribution is imprecise — the access-log duty comes from GDPR Art. 32 + Art. 9(2)(h) accountability requirements, not a single explicit Kaderwet Art. 9 provision. Additionally, the question is partly moot: the product owner confirmed the MethodLogger was disabled intentionally. Q2 should be reframed: what positive obligation to log health-data access exists for the new stack? | Add to Area #3 NEEDS CLARIFICATION backlog for Phase 2 spec author. |
| V-PDP-04 | CLARIFY | omission | Field-level encryption gap is not cataloged as a feature. `gaps/03_patient_data_privacy.md` (lines 204-214) covers absence of application-level encryption for INSZ and medical history, S3 default-encryption reliance, and the unused `publicKeys` plumbing. This is a material privacy posture item that Phase 2 will need to spec. | Add as Feature #9 `patient-data-privacy/encryption-at-rest` in Phase 2 spec. |
| V-PDP-05 | CLARIFY | omission | Children's data special treatment is not cataloged. `gaps/03_patient_data_privacy.md` (line 236) explicitly calls out pediatric data handling (`pupil`/`student` with `school`, `CLB`, teacher, coordinator records) and the absence of required minors-data protections. Belgian patient rights law (art. 12) + GDPR apply specific rules for minors. | Add as Feature #10 `patient-data-privacy/minors-data` or merge into a GDPR-gaps spec in Phase 2. |
| V-PDP-06 | CLARIFY | omission | The Rosa permission distinction between per-file `admin` vs `default` (full Rosa permissions vs READ+UPDATE only) is not surfaced in the discovery. This is the only place the two roles actually differ (confirmed by `patient_file_access_control.md` lines 218-224). Phase 2 spec for access control must model this Rosa projection. | Surface in Phase 2 spec for Feature `patient-data-privacy/access-control` and in Area #18 spec. |
| V-PDP-07 | NOTE | omission | `patientFile.removeAccess` permission is absent from the per-file `admin` list — only practice-level owners/admins can revoke. Also: `USER_HAS_EVENTS_WITH_THIS_PATIENT` block prevents revocation when appointments exist. Neither is mentioned in the discovery. | Note for Phase 2 spec author when writing the access-control feature spec. |
| V-PDP-08 | NOTE | omission | Auto-grant of `role: "admin"` per-file row when a non-owner lid creates a dossier is not mentioned. This is a subtlety of the RBAC model that Phase 2 spec will need to preserve. | Note for Phase 2 spec author. |
| V-PDP-09 | NOTE | citation | Three direct citation line numbers are slightly imprecise (discovery lines 32-36): the cited line ranges are approximations rather than exact. The claims they support are all correct. | No action required for Phase 2. |
| V-PDP-10 | NOTE | omission | NEEDS DOMAIN REVIEW Q2 is partly moot because `method_audit_log.md` header and `deprecation_list.md` #17 both state the MethodLogger was intentionally disabled by the product owner. The question should be: "what audit mechanism should replace it?" not "is it sufficient?" | Reframe Q2 in Phase 2 clarification session. |
| V-PDP-11 | NOTE | cross-area | The `identity.md` discovery file does not have a formal cross-reference back to `patient-data-privacy` in its cross-references section, though it quotes the gap at lines 89-92. The link is present in prose but not in the structured cross-references section. | Not blocking; note for identity discovery file author if it is re-visited. |

---

## Recommendation

**PROCEED to Phase 2 with two mandatory corrections before the spec author starts:**

1. **V-PDP-01** (BLOCKER): Correct the source path in NEEDS DOMAIN REVIEW Q1 from `HalingoDoc/docs/from_source/07-gdpr-and-patient-rights.md` to `/home/tj/.gemini/skills/logopedist-be/references/07-gdpr-and-patient-rights.md`.

2. **V-PDP-02** (BLOCKER): Correct the deprecation list citation for Feature #5 from `#13` to `#2`.

Both corrections are one-line fixes in the discovery file. Once corrected, the discovery is substantively sound — all Meteor source citations were verified, all HalingoDoc citations are accurate on substance, and the Belgian healthcare domain claims are directionally correct (with the legal-attribution imprecision for the audit-log claim noted as CLARIFY, not BLOCKER).

The Phase 2 spec author should additionally pick up V-PDP-03 through V-PDP-06 as NEEDS CLARIFICATION items when authoring the GDPR-compliance and access-control feature specs for this area.
