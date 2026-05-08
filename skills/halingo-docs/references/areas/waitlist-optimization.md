# Waitlist Optimization

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Waitlist status flag, list filter, statistics.

## Spec contracts (Phase 2)

- **list-filter** — Feature: waitlist/list-filter
  - Path: `02-specs/waitlist/list-filter/spec.md`
- **statistics-count** — Feature: waitlist/statistics-count
  - Path: `02-specs/waitlist/statistics-count/spec.md`
- **status-flag** — Feature: waitlist/status-flag
  - Path: `02-specs/waitlist/status-flag/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/waitlist-optimization.md`)

# Discovery: Waitlist Optimization

**Area:** #4 Waitlist Optimization (from `application_map.md` § 2, competency 4)

**Scope in one breath:** The legacy application does NOT have a dedicated Waitlist module; "Waitlist Optimization" is achieved strictly through a `state: "pending"` flag on the Patient record, allowing for simple filtering and count-based statistics in the practice overview.

**Date:** 2026-04-09
**Agent:** Gemini CLI (parallel sources 1+2 dispatch)

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Master | `docs/coverage_matrix.md` | — | Row 4 | Confirmed as "Not covered" in helpdesk and "gap confirmed empty" in code. |
| Curated | `docs/functional/application_map.md` | — | § 2, #4 | Definition of the intended area. |
| Code-derived | `docs/from_source/inventory.md` | — | § 4 | Explicit confirmation that no separate `Waitlist` model exists. |
| Cross-cutting | `docs/from_source/gaps/19_practice_analytics.md` | — | Statistics | Mention of `pending` count mapping to "Wachtlijst". |
| Cross-cutting | `docs/from_source/scout_pass.md` | — | Namespaces | Confirmed no `waitlist.*` namespace exists. |

### What HalingoDoc covers for this area

HalingoDoc accurately identifies this area as a **hard gap** in the legacy codebase. While the `application_map.md` lists it as a competency, the code-read audit confirms that no dedicated waitlist, queue, or prioritization engine was ever implemented. The helpdesk material has zero articles on this topic.

### What HalingoDoc does NOT cover for this area

- The specific UI representation of the "Wachtlijst" filter (deferred to Source 3).
- The transition logic (if any) that triggers a move from `pending` to `active`.

---

## Source 2 — Meteor source slice

### Files read (6 total)

- `app/imports/api/patientFiles/patientFiles.jsx` — Collection schema, states, and defaults.
- `app/imports/api/patientFiles/methods.jsx` — `patientFile.count` (aggregation) and `patientFile.search`.
- `app/imports/ui/pages/practices/PracticePatientFileStatistics.jsx` — UI component aggregating status counts.
- `app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx` — Filter configuration for the patient list.
- `app/imports/i18n/resources/client/nl.i18n.js` / `fr.i18n.js` — Translation mappings for `pending` → `Wachtlijst`.

### Key symbols per file

- `api/patientFiles/patientFiles.jsx:32` — `PatientFiles.states.PENDING: "pending"`.
- `api/patientFiles/patientFiles.jsx:165` — `state` default value set to `PatientFiles.states.PENDING`.
- `api/patientFiles/methods.jsx:689` — `getPatientFileCounts` aggregates by `$state`.
- `ui/pages/practices/PracticePatientFileStatistics.jsx:64` — Labeled mapping of `counts.pending` to `practice.waitList`.
- `modules/patientfiles/main/PatientFilesMainPage.jsx:21` — `filter` object generation from all states.

### Discrepancies found vs HalingoDoc

None. Source 2 confirms HalingoDoc's assessment that this area is a bare-bones implementation using a status flag.

---

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Notes |
|---|---|---|---|---|---|---|
| 1 | `waitlist/status-flag` | Patient `pending` status | docs + source | `inventory.md` | `api/patientFiles/patientFiles.jsx:32` | Every new patient defaults to `pending` (waitlist). |
| 2 | `waitlist/list-filter` | Filter patient list by Waitlist status | docs + source | `application_map.md` | `modules/patientfiles/main/PatientFilesMainPage.jsx:21` | UI shows "Wachtlijst" as a filter option. |
| 3 | `waitlist/statistics-count` | Counter of waitlist patients per practice | docs + source | `gaps/19_practice_analytics.md` | `ui/pages/practices/PracticePatientFileStatistics.jsx` | Displayed on Practice Overview, filterable by therapist. |

---

## Cross-references to other areas

- **#1 Identity Management:** Permission `patientFile.count` required to see waitlist totals.
- **#3 Patient Data Privacy:** Waitlist patients are `PatientFiles` and thus subject to the same privacy/retention (or lack thereof) rules.
- **#19 Practice Analytics:** The waitlist count is the only "optimization" metric available.

---

## Belgian domain knowledge — the `logopedist-be` skill

### CAR Cumulverbod Interaction

The `logopedist-be` skill (§ 5.11 / 14) clarifies a crucial reason for tracking "Waitlist" status in a Belgian context:
- **Rule:** A child on the waitlist for a **Centrum voor Ambulante Revalidatie (CAR)** can still receive and bill monodisciplinary logopedie sessions through a private therapist under the federal nomenclature.
- **Cumulverbod:** The prohibition of simultaneous billing only takes effect once the **multidisciplinary treatment** at the CAR has actually started.
- **Legacy Implementation:** The legacy app does **not** automate this check. It is a manual status for the therapist to manage.

---

## [NEEDS CLARIFICATION]

### Q1: Transition to Active
Is there a specific trigger or "intake" workflow that moves a patient from `pending` to `active`, or is it purely a manual dropdown change by the therapist? (Source 3 walk needed).

### Q2: Intake Date
Is the `createdAt` timestamp of the patient record considered the "intake date" for the waitlist, or is there a separate (hidden or meta) field for when they requested care? (Source 2 search found no other date).

### Q3: Source 3 deferred — add staging screen reference in follow-up pass.

---

## [NEEDS DOMAIN REVIEW]

(None identified. The CAR cumulverbod rule is verified via the `logopedist-be` skill.)

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/from_source/inventory.md
/home/tj/HalingoDoc/docs/from_source/gaps/19_practice_analytics.md
/home/tj/HalingoDoc/docs/from_source/scout_pass.md

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/patientFiles.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticePatientFileStatistics.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/fr.i18n.js
```

---

# Source 3 — Staging Walk: Waitlist Optimization

meta:
- Date walked: 2026-04-09
- Test accounts used: `owner` (_PARITY_TEST_owner@example.com)
- Base discovery file referenced: `@01-discovery/waitlist-optimization.md`

## Screen catalog

| Screen Name | URL | Role | Screenshot Path | Purpose |
|---|---|---|---|---|
| Dashboard | `/` | owner | `01-dashboard-owner.png` | Main entry point showing overview. |
| Patient List (Filters) | `/patients` | owner | `02-patient-list-filters.png` | Patient roster with filter toolbar. |
| Filter Dropdown | `/patients` | owner | `03-patient-list-filter-dropdown.png` | Selection of status-based filters including "Wachtlijst". |
| Waitlist Filtered | `/patients` | owner | `04-patient-list-waitlist-filtered.png` | View of patients with `pending` status. |
| Practice Overview Stats | `/practices` | owner | `05-practice-overview-deep-check.png` | Practice-level statistics including waitlist counts. |

## Navigation flows

### Owner / Admin Flow
1.  **Login**: User logs in and lands on the Dashboard.
2.  **Access Patient List**: Open the side drawer and click "Patiëntendossiers".
3.  **Filter by Waitlist**: Click the "FILTER" button in the patient list toolbar. Select "Wachtlijst" from the menu.
4.  **View Statistics**: Open the side drawer and click "Praktijk". Scroll to the "Patiëntenoverzicht" section to see aggregated counts by status.

### Lid Flow
- (Verified via source read) The `lid` role can see the patient list and use filters but has restricted access to practice-wide statistics unless granted `patientFile.count`.

## Role differences

- **Owner**: Full access to all waitlist filters and practice-wide statistics.
- **Admin**: Similar to owner, full visibility of waitlist data.
- **Lid**: Can filter the patient list but visibility of other therapists' waitlist patients depends on practice settings (typically restricted to own patients or shared dossier access).
- **Unverified**: (Verified via source) Can log in but blocked from most mutations until verified.

## UI observations

- **Modals**: The "NIEUW PATIËNTENDOSSIER" form defaults patients to the "pending" state (internally mapped to "Wachtlijst").
- **Empty States**: If no patients match the "Wachtlijst" filter, the list area simply shows the toolbar without an explicit "No patients found" empty-state graphic.
- **Transitions**: Moving a patient from the waitlist to "Active" is performed by editing the patient dossier and changing the "Status" dropdown. There is no automated "Promote to Active" intake wizard.
- **Loading States**: The patient list uses standard Meteor/DDP reactivity; filtering is near-instant as it updates the local subscription.

## Cross-references to base file

- **Confirms**: Feature #1 (`waitlist/status-flag`) is confirmed; patients are default-created as `pending`.
- **Confirms**: Feature #2 (`waitlist/list-filter`) is confirmed; "Wachtlijst" is a top-level filter option in the patient roster.
- **Confirms**: Feature #3 (`waitlist/statistics-count`) is confirmed; statistics are visible on the Practice page.
- **Extends**: Q1 (Transition to Active) is clarified as a manual status change in the patient edit form.
- **Extends**: Q2 (Intake Date) - confirmed that no separate "Intake Date" field exists in the UI; the waitlist order is typically based on `createdAt`.

---

## Verification notes (verbatim from `01-discovery/waitlist-optimization.verification.md`)

# Verification: Waitlist Optimization

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/waitlist-optimization.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Area #4 has NO dedicated waitlist module; "Confirmed as 'Not covered' and 'gap confirmed empty' in code." | `coverage_matrix.md` row 4 | ✓ | Verbatim: "gap confirmed empty — no `Waitlist`/`Queue`/`Intake`/`Priority` model exists in code." Exact match. |
| 2 | `application_map.md` § 2 #4 defines "Waitlist Optimization" as "Managing and prioritizing new patient inquiries." | `application_map.md` § 2 | ✓ | Verbatim match in the competency list. Correct. |
| 3 | `inventory.md` § 4 gives "Explicit confirmation that no separate `Waitlist` model exists." | `inventory.md` § "4 — Waitlist Optimization" | ✓ | Exact text found: "No code feature exists. Grep confirmed: no `Waitlist`, `Queue`, `Intake`, `Priority` model." |
| 4 | `gaps/19_practice_analytics.md` mentions `pending` count mapped to "Wachtlijst". | `gaps/19_practice_analytics.md` | ✓ | Confirmed at line 106: "Metrics: `total`, `active`, `pending` (labelled `practice.waitList` = 'Wachtlijst' in the UI), `inactive`." |
| 5 | `scout_pass.md` confirmed no `waitlist.*` namespace. | `scout_pass.md` § 6 | ✓ | Scout pass § 6 lists all i18n namespaces; `waitlist.*` is absent. Explicitly noted: "Missing namespaces: no `gdpr.*`, no `waitlist.*`, no `analytics.*`." |
| 6 | `patientFiles.jsx:32` — `PatientFiles.states.PENDING: "pending"` | `api/patientFiles/patientFiles.jsx` | ~ | Logic verified — `PENDING: "pending"` exists in the states enum. **Line number is off by one.** Actual line is 33, not 32. `INACTIVE` is on line 32; `PENDING` is on line 33. Minor citation inaccuracy. |
| 7 | `patientFiles.jsx:165` — `state` default value set to `PatientFiles.states.PENDING` | `api/patientFiles/patientFiles.jsx` | ~ | Logic verified — `defaultValue: PatientFiles.states.PENDING` exists in the schema. **Line number is materially wrong.** Actual line is 217, not 165. Line 165 is inside the `CLB` sub-schema block. The claim is correct; the line citation is off by ~52 lines. |
| 8 | `methods.jsx:689` — `getPatientFileCounts` aggregates by `$state` | `api/patientFiles/methods.jsx` | ~ | Method name verified: `getPatientFileCounts` / `patientFile.count`. Aggregate confirmed: `{ $group: { _id: "$state", count: { $sum: 1 } } }`. **Line number is off.** Method begins at line 650; the `rawCollection().aggregate(...)` call is at line 700, not 689. |
| 9 | `PracticePatientFileStatistics.jsx:64` — Labeled mapping of `counts.pending` to `practice.waitList` | `ui/pages/practices/PracticePatientFileStatistics.jsx` | ~ | Claim verified — `{this.state.counts.pending || 0}` is rendered with `<Text resources="practice.waitList"/>`. **Line number is off.** Actual mapping is at lines 74-75, not line 64. Line 64 is inside the therapist dropdown `onChange` handler. |
| 10 | `PatientFilesMainPage.jsx:21` — filter object generation from all states | `modules/patientfiles/main/PatientFilesMainPage.jsx` | ✓ | Verified: `const filter = {}` at line 20; `_.each(PatientFiles.states, (state) => { filter[state] = { state }; })` at lines 21-23. The `:21` citation is accurate within the block. |
| 11 | i18n files confirm `pending` → `Wachtlijst` | `i18n/resources/client/nl.i18n.js` | ✓ (indirect) | Confirmed via `patient_creation.md` which cites `client/nl.i18n.js:464` for `patient.state.pending = "Wachtlijst"`. Also confirmed by `19_practice_analytics.md` labelling. Not re-read directly but corroborated by two independent HalingoDoc deep-dives. |

---

## Material omissions

The following behaviors are documented in the cited sources but not mentioned in the discovery file. None are spec-blocking for the waitlist area itself, but they are relevant for downstream spec authoring.

### O1 — State dropdown is user-overridable at creation time (significant)

`patient_creation.md` (cross-cutting HalingoDoc file not in the discovery's cited sources) documents that the patient creation modal includes a **`state` dropdown that defaults to `PENDING` but can be changed at creation time** to any of `starting / active / inactive / pending`. The discovery file states "Every new patient defaults to `pending` (waitlist)" without noting the override. The spec author needs to know that the `pending` default is the schema-level default AND the form-level default, but the form allows immediate override to any state at creation time. This is a meaningful behavior difference from a "patient is always created as pending."

Source: `from_source/features/patient_creation.md` lines 23-24 (form field `state: Dropdown, default PENDING`) and line 113.

### O2 — Total in PracticePatientFileStatistics intentionally excludes `starting` state (spec nuance)

`19_practice_analytics.md` line 107 explicitly documents: "Total is computed client-side as `active + pending + inactive` (`PracticePatientFileStatistics.jsx:37`) — note that this intentionally excludes any other state (e.g. `starting`) from the 'total'." The discovery file's feature #3 (`waitlist/statistics-count`) describes the counter but does not mention this exclusion. The `starting` state is defined in `PatientFiles.states` and can exist on records, but it does not appear in the practice overview total.

### O3 — `patientFile.count` permission has a soft fallback behavior

The actual permission check in `methods.jsx:670-690` shows a nuanced fallback: if the caller does not have `patientFile.count` and no explicit `userId` is passed, the method silently scopes the query to the caller's own patient files (rather than returning an error). The discovery's cross-reference to identity (#1) says the permission is "required to see waitlist totals" — this overstates the restriction. Any logged-in practice member can call `patientFile.count` and will receive a count scoped to their own patients. Only cross-user counts require the permission.

### O4 — CAR cumulverbod pathology carve-out not mentioned

The discovery file's domain section correctly states the cumulverbod applies when multidisciplinary CAR treatment has started. It does not mention that §2 b) 6.3 (dysarthria / chronische neurologische spraakstoornissen) and §2 d) (hearing disorders) are **excluded from the cumulverbod entirely** — these pathologies may run in parallel with a CAR regardless of whether treatment has started. This is a verified fact from the `logopedist-be` skill (see Domain review section below).

---

## Cross-area reference check

| Referenced area | Claim in waitlist discovery | Back-reference in target file? | Finding |
|---|---|---|---|
| **#1 Identity Management** | "`patientFile.count` required to see waitlist totals" | No back-reference found in `01-discovery/identity.md` | Not bidirectional. The identity discovery does not contain `patientFile.count` or any reference to the waitlist area. The claim about the permission is directionally correct (the permission exists in the RBAC matrix) but understates the soft fallback behavior (see O3 above). CLARIFY for spec author. |
| **#3 Patient Data Privacy** | "Waitlist patients are `PatientFiles` and thus subject to the same privacy/retention rules." | No back-reference found in `01-discovery/patient-data-privacy.md` | Not bidirectional. The cross-reference is logically correct (all `PatientFile` records share the same GDPR gap documented in #3), but neither file references the other. NOTE only — the claim is accurate. |
| **#19 Practice Analytics** | "The waitlist count is the only 'optimization' metric available." | No back-reference found in `01-discovery/practice-analytics.md` | Not bidirectional. The practice-analytics discovery file does not reference area #4. The claim is accurate per the source material. NOTE only. |

All three cross-references are directionally correct. None are bidirectional. This is a systemic pattern across the Phase 1 discovery set (one-way references), not specific to this area.

---

## Domain review (logopedist-be)

The CAR cumulverbod claim was the only Belgian healthcare regulatory claim in the discovery file. It was verified against the `logopedist-be` skill.

**Skill reference consulted:** `/home/tj/.claude/skills/logopedist-be/references/05-flemish-community.md` and `references/VERIFICATION-PASS-2026-04-06.md` (File 05 item, "October 2025 CAR-cumulverbod interpretation rule").

**Primary source cited by the skill:** RIZIV Verzekeringscomité interpretation rule on art. 36 § 3, 5° of the federal logopedie nomenclature, published in the Belgisch Staatsblad on 2 October 2025. A refined second version of the rule confirmed: "the cumulverbod only takes effect once multidisciplinary CAR treatment has actually started. Children on the wachtlijst — and patients in the bilan-to-first-session interval — keep their RIZIV-monodisciplinary logopedie."

**Verdict on the discovery claim:** VERIFIED. The claim that "the prohibition of simultaneous billing only takes effect once the multidisciplinary treatment at the CAR has actually started" is confirmed by the primary-sourced skill knowledge (verified fact #14 in the skill header, RESOLVED in the 2026-04-06 verification pass).

**One finding to flag:** The discovery file does not mention that §2 b) 6.3 (dysarthria / chronische neurologische spraakstoornissen) and §2 d) (hearing disorders) are **excluded from the cumulverbod entirely** — these pathologies may run concurrent with a CAR at any stage. This is not an error in the discovery file (which correctly describes the general rule), but it is a material omission for any spec author who needs to model the cumulverbod interaction. Recorded as finding V-WO-06 (CLARIFY) below.

**Confirmation that legacy app does not automate this check:** Verified. The discovery file correctly states the legacy app does not automate the CAR cumulverbod check; it is purely a manual status for the therapist to manage. No `CAR` field, no cumulverbod-check method, and no related i18n key were found in the source inventory.

---

## Escalated source checks (Step 4)

Three claims were spot-checked against Meteor source files:

### Spot-check 1 — `PatientFiles.states.PENDING` default (Load-bearing for spec)

**Claim:** `patientFiles.jsx:32` defines `PENDING: "pending"` and `patientFiles.jsx:165` sets it as the default.

**Source read:** `app/imports/api/patientFiles/patientFiles.jsx` lines 29-34 (states enum) and lines 180-220 (schema).

**Finding:**
- `PENDING: "pending"` is at line **33**, not 32. Line 32 is `INACTIVE: "inactive"`. Off by one.
- `defaultValue: PatientFiles.states.PENDING` is at line **217**, not 165. Line 165 is inside the `CLB` sub-schema. Off by ~52 lines.
- The underlying claim — that `pending` is both defined as a state and is the schema-level default — is **correct**. The line citations are inaccurate but the behavior is verified.
- Additional verified fact: the form's dropdown also defaults to `PENDING` (confirmed via `patient_creation.md`), so the user must actively change the dropdown to create a non-pending patient. This corroborates the discovery's characterization.

### Spot-check 2 — `getPatientFileCounts` aggregation method (Load-bearing for spec)

**Claim:** `methods.jsx:689` — `getPatientFileCounts` aggregates by `$state`.

**Source read:** `app/imports/api/patientFiles/methods.jsx` lines 650-714.

**Finding:**
- Method `getPatientFileCounts` (Meteor method name `patientFile.count`) begins at line **650**, not 689.
- The `rawCollection().aggregate([{ $match: selector }, { $group: { _id: "$state", count: { $sum: 1 } } }])` call is at lines **700-703**, not 689.
- The behavioral claim — MongoDB aggregation grouping by `$state` — is **verified and correct**.
- Additional fact confirmed: when `userId` is passed, the selector is first narrowed to `_id: { $in: patientFilesUsers.map(pfu => pfu.patientFileId) }` via a `PatientFileUsers` lookup (lines 692-698). This per-user narrowing is mentioned in `19_practice_analytics.md` but not in the discovery file. Relevant for spec authoring of `waitlist/statistics-count`.

### Spot-check 3 — UI statistics component mapping `counts.pending` to `practice.waitList`

**Claim:** `PracticePatientFileStatistics.jsx:64` — Labeled mapping of `counts.pending` to `practice.waitList`.

**Source read:** `app/imports/ui/pages/practices/PracticePatientFileStatistics.jsx` lines 25-80.

**Finding:**
- The rendering of `{this.state.counts.pending || 0}` with `<Text resources="practice.waitList"/>` is at lines **74-75**, not line 64. Line 64 is inside the `onChange` handler of the therapist dropdown.
- The behavioral claim is **verified and correct**.
- Also confirmed: `res.total = res.active + res.pending + res.inactive` is at line **37** (client-side total computation that excludes `starting`). This confirms omission O2 above.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-WO-01 | NOTE | citation | `patientFiles.jsx:32` for `PENDING` state definition — actual line is 33. Off by one. Behavior is correct. | No impact on spec authoring. Note for traceability. |
| V-WO-02 | NOTE | citation | `patientFiles.jsx:165` for `state` default value — actual line is 217. Off by ~52 lines. Behavior is correct. | No impact on spec authoring. Note for traceability. |
| V-WO-03 | NOTE | citation | `methods.jsx:689` for `getPatientFileCounts` aggregate — method starts at line 650, aggregate at 700-703. Behavior is correct. | No impact on spec authoring. Note for traceability. |
| V-WO-04 | NOTE | citation | `PracticePatientFileStatistics.jsx:64` for `counts.pending` → `practice.waitList` — actual lines are 74-75. Behavior is correct. | No impact on spec authoring. Note for traceability. |
| V-WO-05 | CLARIFY | omission | State dropdown is user-overridable at creation time. The discovery says "every new patient defaults to `pending`" without noting the therapist can override to any state at the moment of creation. The spec for `waitlist/status-flag` should document: schema default is `pending`, form default is `pending`, but therapist can set any valid state at creation. | Add to `[NEEDS CLARIFICATION]` backlog for spec authoring. |
| V-WO-06 | CLARIFY | domain | CAR cumulverbod pathology carve-out missing. §2 b) 6.3 (dysarthria) and §2 d) (hearing disorders) are excluded from the cumulverbod entirely. If halingo ever surfaces a warning about CAR + RIZIV billing conflicts (as suggested by HalingoDoc Advies 2023/21), it must not show the warning for these two pathologies. | Add to `[NEEDS CLARIFICATION]` backlog. Flag for spec author of any future cumulverbod-warning feature. |
| V-WO-07 | CLARIFY | omission | `patientFile.count` permission has a soft fallback. Any logged-in practice member can receive counts scoped to their own patients; only cross-user counts require the permission. The cross-reference to identity #1 overstates the restriction. The spec for `waitlist/statistics-count` should document both the permissioned (cross-user) and the unpermissioned (own-patients-only) behavior. | Add to `[NEEDS CLARIFICATION]` backlog for spec authoring. |
| V-WO-08 | CLARIFY | omission | `total` in the practice overview tile intentionally excludes `starting` state patients from the denominator. Spec for `waitlist/statistics-count` should encode: total = active + pending + inactive (explicit exclusion of `starting`). | Add to `[NEEDS CLARIFICATION]` backlog for spec authoring. |
| V-WO-09 | NOTE | cross-area | No cross-reference is bidirectional. Areas #1, #3, and #19 do not back-reference area #4. This is a systemic gap across the Phase 1 set, not a correctness problem for this area's spec authoring. | Record for Phase 2 orchestrator awareness. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring** for this area.

The three features cataloged (`waitlist/status-flag`, `waitlist/list-filter`, `waitlist/statistics-count`) are correctly identified and the behavioral descriptions are accurate. The line-number citation inaccuracies (V-WO-01 through V-WO-04) are cosmetic — no behavior is mis-stated. The four CLARIFY items (V-WO-05 through V-WO-08) are genuine spec-authoring inputs that should be resolved by the Phase 2 spec author, either from the `patient_creation.md` HalingoDoc source (for V-WO-05 and V-WO-08) or from the `logopedist-be` skill (for V-WO-06) or from the `methods.jsx` source-check above (for V-WO-07).

No BLOCKER findings. No factually incorrect claims that would produce a wrong spec.

**Pre-conditions for Phase 2 spec author:**
1. Read `HalingoDoc/docs/from_source/features/patient_creation.md` in addition to the waitlist discovery file — it documents the creation flow including the state override behavior.
2. Note that Source 3 (staging walk) was completed and appended to the discovery file (lines 133-182), resolving Q1 (transition is manual status change) and Q2 (no separate intake date field, `createdAt` is the de facto queue order).
3. The CAR cumulverbod domain context (discovery file § "Belgian domain knowledge") is accurate but should be supplemented with the pathology carve-out (V-WO-06) before any cumulverbod-related spec work.
