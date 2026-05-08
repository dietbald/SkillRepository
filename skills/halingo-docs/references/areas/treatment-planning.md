# Treatment Planning

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Bilan lifecycle, long-term + short-term goals, treatment create, notifications.

## Spec contracts (Phase 2)

- **bilan-lifecycle** — Feature: treatment-planning/bilan-lifecycle
  - Path: `02-specs/treatment-planning/bilan-lifecycle/spec.md`
- **long-term-goals** — Feature: treatment-planning/long-term-goals
  - Path: `02-specs/treatment-planning/long-term-goals/spec.md`
- **short-term-goals** — Feature: treatment-planning/short-term-goals
  - Path: `02-specs/treatment-planning/short-term-goals/spec.md`
- **treatment-create** — Feature: treatment-planning/treatment-create
  - Path: `02-specs/treatment-planning/treatment-create/spec.md`
- **treatment-notifications** — Feature: treatment-planning/treatment-notifications
  - Path: `02-specs/treatment-planning/treatment-notifications/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/treatment-planning.md`)

# Phase 1 Discovery — Area #6 Treatment Planning

**Area definition:** Mapping treatments to Belgian RIZIV nomenclature codes and clinical goal setting.
**Competency #6** in `/home/tj/HalingoDoc/docs/functional/application_map.md`.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | Covered |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/patient_management.md` | 283 | §§ "Verschil tussen totaal sessies...", "Patiëntendossier verwijderen" | High-level RIZIV bracket concept and dossier deletion logic. |
| Curated | `functional/application_map.md` | — | § 2 competency 6 | Formal area definition. |
| Code-derived | `from_source/features/treatments_and_bilans.md` | 310 | full | Data model, nomenclature matrix, bilan ordering, and observers. |
| Code-derived | `from_source/features/long_term_therapy_plan.md` | 230 | full | Kanban board for therapy goals, 11 categories, parent/child hierarchy. |
| Cross-cutting | `from_source/deprecation_list.md` | — | Item 9, 11 | `LongTherapyPlan.therapistId` (Dead code), `treatment.can.be.removed` (Intentional). |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | ctrl-F treatment | No major functional bugs found for this area. |

### What HalingoDoc covers for this area

HalingoDoc provides a deep technical inventory of the treatment planning system. It documents the 18 treatment types (a, b.1...g) mapped to RIZIV Article 36, the complex three-level nomenclature matrix used for billing, and the rigid validation rules for bilan (assessment) ordering. It also describes the "Therapieplan" (long-term therapy plan) as a Kanban-style interface with 11 clinical categories.

### What HalingoDoc does NOT cover

- The recent August 2024 RIZIV changes (e.g., abolition of the separate "evolutiebilan" code) are not reflected in the legacy data model described, which still includes `evolution` as a bilan type.
- The specific UI interactions for dragging cards between Kanban columns (noted as code-inferred).

### Direct citations worth preserving

> "A *treatment* (`Treatments` collection) is a RIZIV-aligned therapy plan attached to a patient file... Everything on the `events` side linked by `event.treatmentId` is counted against one row here." — `from_source/features/treatments_and_bilans.md:12`

> "LongTherapyPlan.goals = ['afasie', 'articulatie', 'communication', 'dysfagie', 'hearing', 'leerstoornis', 'myofunction', 'schisis', 'stem', 'stutter', 'taal'];" — `from_source/features/long_term_therapy_plan.md:45`

---

## Source 2 — Meteor source slice

### Files read (8 total)

- `app/imports/api/treatments/`
  - `treatments.js` — Schema, nomenclature matrix, session ceilings.
  - `methods.js` — `treatments.add`, `bilans.add`, etc.
  - `server/util.js` — Removal validation and session counting.
  - `server/TreatmentSessionObserver.js` — Notification scheduling.
- `app/imports/api/patientFiles/`
  - `longTherapyPlan.jsx` — Goal categories, states, and icon mapping.
- `app/imports/modules/patientfiles/therapy/`
  - `PatientFileTherapyOverviewPage.jsx` — Container for both treatments and therapy plans.
  - `long-therapy/TherapyPanelLong.jsx` — Swimlane renderer.

### Key symbols per file

- `Treatments` (`api/treatments/treatments.js:10`) — Main collection.
- `bilanSchema` (`api/treatments/treatments.js:62`) — Embedded assessment reports.
- `getDisorderCodes` (`api/treatments/treatments.js:354`) — The nomenclature matrix (TreatmentType -> ApptType -> SubType -> Location).
- `LongTherapyPlan` (`api/patientFiles/longTherapyPlan.jsx:4`) — Separate collection for Kanban goals.
- `TreatmentSessionObserver` (`api/treatments/server/TreatmentSessionObserver.js`) — Cron-based notification engine.

### Discrepancies found vs HalingoDoc

- **Bilan Ordering:** The code `treatments.js:99-116` enforces that only one `initial` bilan is allowed and all others must start AFTER it. This was briefly mentioned in docs but confirmed as a hard schema-level validation in code.
- **Dangling Children:** In `longTherapyPlan` deletion, children are not cascaded, leaving them with non-existent `parentId`s.

---

## Source 3 — Staging exploration

**Staging URL:** `http://localhost:3000` (Local Meteor)
**Screens visited:** 4
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/treatment-planning/`

### Per-screen catalog

| # | URL | Screen | Language | Findings | Screenshot |
|---|---|---|---|---|---|
| 01 | `/login` | Dashboard | NL | Practice overview, summary widgets. | `01-dashboard-owner.png` (not saved to final) |
| 02 | `/patients/:id` | Patient Info | NL | Core demographics for Sophie Janssens. | `01-patient-detail-sophie.png` |
| 03 | `/patients/:id?tabIndex=1` | Terugbetaling | NL | Treatment list, bilan details, session progress graph. | `02-treatment-tab-sophie.png` |
| 04 | `/patients/:id?tabIndex=4` | Therapieplan | NL | Kanban board with columns: "Te behandelen", "In behandeling", "Doel behaald". | `03-therapy-plan-tab-sophie.png` |

### Behavior observed on staging

- **Kanban Interaction:** Drag-and-drop between columns is fluid. Done items are automatically struck through.
- **Bilan Fields:** Prescriber RIZIV number and prescription date are mandatory for saving a bilan.
- **Session Progress:** A visual progress bar shows Halingo sessions vs. manual backlog (`usedSessions`) against the total bracket.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `treatment-planning/treatment-create` | Treatment Plan Assignment | docs + source + staging | `treatments_and_bilans.md:12` | `api/treatments/methods.js:35` | Terugbetaling Tab | Links patient to a RIZIV disorder type (a..g). |
| 2 | `treatment-planning/bilan-lifecycle` | Bilan (Assessment) Management | docs + source + staging | `treatments_and_bilans.md:62` | `api/treatments/treatments.js:62` | Bilan Modal | Tracks prescriber, validity dates, and approval state. |
| 3 | `treatment-planning/nomenclature-matrix` | Automatic RIZIV Code Mapping | docs + source | `treatments_and_bilans.md:354` | `api/treatments/treatments.js:354` | N/A | Complex lookup table for 100+ CNK codes. |
| 4 | `treatment-planning/long-term-kanban` | Long-term Therapy Goals (Kanban) | docs + source + staging | `long_term_therapy_plan.md:10` | `api/patientFiles/longTherapyPlan.jsx` | Therapieplan Tab | 11 categories, 3 status columns, drag-and-drop. |
| 5 | `treatment-planning/goal-hierarchy` | Goal Parent/Child Nesting | docs + source | `long_term_therapy_plan.md:57` | `api/patientFiles/longTherapyPlan.jsx:57` | Therapieplan Tab | Single-level nesting of goals. |
| 6 | `treatment-planning/short-term-goals` | Short-term Treatment Goals | docs + source | `long_term_therapy_plan.md:35` | `api/treatments/treatments.js:125` | Terugbetaling Tab | Simple text fields stored on the treatment row. |
| 7 | `treatment-planning/expiry-notifications` | Expiring Bilan/Session Alerts | docs + source | `treatments_and_bilans.md:observers` | `api/treatments/server/util.js:60` | N/A | In-app therapist alerts via SyncedCron. |

---

## Cross-references to other areas

- **#7 Reimbursement Tracking:** Area #6 sets the plan and limits; Area #7 performs the actual counting and `hasPayBack` gating.
- **#11 Smart Invoicing:** Uses the nomenclature codes mapped here to generate official certificates.
- **#15 Precision Printing:** Prescriber info from bilans is mapped to matrix-printed forms.

---

## [NEEDS CLARIFICATION]

### Q1: Handling of abolished "Evolutiebilan" codes.
- **Why it matters:** RIZIV abolished these in Aug 2024. Legacy app still supports them.
- **Sources conflict?** No, but regulatory reality shifted.
- **What would resolve:** Product decision on whether to block the "evolution" type in the new stack.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does the new "séance d'évaluation longue" need a dedicated UI slot?
- **Found in:** `logopedist-be` skill (not in legacy code).
- **Why it matters:** It's a new billable code (700991) that doesn't debit the treatment cap.
- **What I know:** Legacy app uses `DEFAULT.6` for evaluation, but the new code has specific triggers (worsening/stagnation).

---

## Traceability — Files read

- `/home/tj/HalingoDoc/docs/from_source/features/treatments_and_bilans.md`
- `/home/tj/HalingoDoc/docs/from_source/features/long_term_therapy_plan.md`
- `/home/tj/HalingoDoc/docs/full_documentation/patient_management.md`
- `/home/tj/Repos/Halingo-Main/app/imports/api/treatments/treatments.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/treatments/methods.js`
- `/home/tj/Repos/Halingo-Main/app/imports/api/patientFiles/longTherapyPlan.jsx`
- `/home/tj/.gemini/skills/logopedist-be/references/02-prescription-bilan-and-pathology-rules.md`

---

## Verification notes (verbatim from `01-discovery/treatment-planning.verification.md`)

# Verification: Treatment Planning (Area #6)

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/treatment-planning.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "A *treatment* (`Treatments` collection) is a RIZIV-aligned therapy plan attached to a patient file... Everything on the `events` side linked by `event.treatmentId` is counted against one row here." (direct quote) | `treatments_and_bilans.md:12` | ~ | Partially accurate. The discovery attributes this to line 12 of the HalingoDoc file. The actual text in `treatments_and_bilans.md` begins at line 7 (the "What it is" section). The sentence is an accurate paraphrase/composite but is not a verbatim quote. The HalingoDoc wording is: "A *treatment* (`Treatments` collection) is a RIZIV-aligned therapy plan attached to a patient file. It carries the treatment type... Everything on the `events` side linked by `event.treatmentId` is counted against one row here." The quote is accurate in substance. Line 12 in the actual file is `- Treatments and bilans are edited on the patient file overview:...` (the "Where it lives in the UI" bullet). The line number cited (`:12`) is incorrect — the quoted passage begins at line 7. |
| 2 | "LongTherapyPlan.goals = ['afasie', 'articulatie', 'communication', 'dysfagie', 'hearing', 'leerstoornis', 'myofunction', 'schisis', 'stem', 'stutter', 'taal'];" (direct quote) | `long_term_therapy_plan.md:45` | ~ | Quote is verbatim-accurate in substance. However, the actual location in the HalingoDoc file is lines 28-40 (the `LongTherapyPlan.goals = [...]` code block). Line 45 in `long_term_therapy_plan.md` is `LongTherapyPlan.STATES = {`. The line number cited (`:45`) is incorrect — the goals array starts at line 28. |
| 3 | "18 treatment types (a, b.1...g)" | `treatments_and_bilans.md:12` (and feature row citing `getTypes()`) | ✓ | Verified. The Meteor source `treatments.js:39-60` (also reflected in the HalingoDoc) shows exactly 18 string values: `a, b.1, b.2, b.3, b.4, b.5, b.6.1, b.6.2, b.6.3, b.6.4, b.6.5, c.1, c.2, d, e, f, g, supplementaryInsurance`. The count of 18 is correct. The HalingoDoc `treatments_and_bilans.md` lines 57-59 shows the same list. |
| 4 | "Complex lookup table for 100+ CNK codes" (feature #3, nomenclature-matrix) | `treatments_and_bilans.md:354` | ~ | The claim of "100+ CNK codes" is imprecise. The HalingoDoc describes `getDisorderCodes()` spanning `treatments.js:354-846` — which is ~492 lines and clearly contains many codes. However, these are RIZIV nomenclature codes, not CNK codes. CNK ("Centrale voor farmaceutische specialiteiten" / "Code national des kinesithérapeutes") is a pharmaceutical code system unrelated to logopedic RIZIV nomenclature. The codes in `getDisorderCodes()` are RIZIV treatment-act codes (6-digit numbers like 711314, 712316). This is a terminology error in the discovery. The "100+" count appears plausible given the matrix depth but was not precisely counted. |
| 5 | "bilanSchema (`api/treatments/treatments.js:62`)" | `treatments_and_bilans.md:62` | ✓ | Verified. The actual Meteor source `treatments.js:62` reads `Treatments.bilanSchema = new SimpleSchema(` — exactly matching the claimed symbol and line number. The HalingoDoc `treatments_and_bilans.md` also references this at lines 41-52 (`Treatments.bilanSchema` table). |
| 6 | "getDisorderCodes (`api/treatments/treatments.js:354`)" | `treatments_and_bilans.md:354` | ✓ | Verified. The actual Meteor source `treatments.js:354` reads `Treatments.getDisorderCodes = function getDisorderCodes() {` — exactly matching. |
| 7 | Bilan ordering hard validation "confirmed as a hard schema-level validation in code" at `treatments.js:99-116` | `treatments_and_bilans.md` (discrepancies section) | ✓ | Verified. The actual source `treatments.js:99-116` shows the custom validator on the `bilans` array: `if (initials.length > 1) return "tooMuchInitial"` and `if (invalidBilan) return "invalidBilanOrder"`. The HalingoDoc `treatments_and_bilans.md` line 54 also confirms: "Custom constraint: at most one `initial` bilan per treatment, and all other bilans must `start` after the initial bilan's `end`." |
| 8 | "Dangling Children: In `longTherapyPlan` deletion, children are not cascaded, leaving them with non-existent `parentId`s." | Discrepancies section (Meteor source) | ✓ | Verified. `long_term_therapy_plan.md` lines 144-146 confirms: "Children of a deleted parent are **not** cascaded — they are left dangling with a `parentId` pointing at the removed row." Also confirmed at `methods.jsx:900-922` description in the HalingoDoc. |
| 9 | Deprecation item #9: `LongTherapyPlan.therapistId` (Dead code) | `deprecation_list.md` item 9 | ✓ | Verified. `deprecation_list.md` item #9 (line 63-65) confirms: "schema field exists, methods accept it, the UI form control is committed-out." |
| 10 | Deprecation item #11: `treatment.can.be.removed` (Intentional) | `deprecation_list.md` item 11 | ✓ | Verified, with important nuance. `deprecation_list.md` item #11 (lines 72-74) states: "Status: the product owner said 'It's fine' — the framing as a bug was wrong... **Not for removal.** Listed here only because the earlier draft flagged it incorrectly." The discovery characterizes this as "treatment.can.be.removed (Intentional)" which matches. However, the discovery's description of this item in the Sources Consulted table is slightly misleading — the item is not about a "deprecation" but about a retraction of a previous bug report. Minor imprecision. |
| 11 | `long_term_therapy_plan.md:10` cited for feature #4 (long-term-kanban) | `long_term_therapy_plan.md` | ~ | Line 10 in the actual file reads "A per-dossier kanban-style therapy plan..." (the "What it is" section begins at line 9). The line number cited is functionally correct (within 1 line). No material error. |
| 12 | `long_term_therapy_plan.md:35` cited for feature #6 (short-term-goals) | `long_term_therapy_plan.md` | ✗ | Line 35 in `long_term_therapy_plan.md` is blank (or the closing of a data structure). The short-term goals section is found at lines 21-22 of the file: "Alongside the long-term panel, a **short-term** plan lives under the same tab... short-term goals are stored *on the treatment* (`Treatments.shortTherapy`)". Line 35 does not describe short-term therapy goals. **This line number is incorrect.** |
| 13 | `long_term_therapy_plan.md:57` cited for feature #5 (goal-hierarchy) | `long_term_therapy_plan.md` | ~ | Line 57 in the file is `\| `parentId` \| `String` (Id) \| no \| Id of another...`. This is the schema table row for `parentId`. The citation is relevant but the "goal parent/child nesting" feature is described more fully at lines 111-114. The citation is technically valid but points to a single schema-table row rather than the more informative prose description. |
| 14 | "11 categories" for therapy goals | `long_term_therapy_plan.md:45` | ✓ | Verified. The HalingoDoc `long_term_therapy_plan.md` lines 28-40 and lines 60-71 both confirm exactly 11 categories: afasie, articulatie, communication, dysfagie, hearing, leerstoornis, myofunction, schisis, stem, stutter, taal. The deprecation list's "Items NOT in this list" section line 150 also confirms: "11 therapy goal categories... all current." |
| 15 | "No major functional bugs found for this area" (bugs_and_security_findings.md ctrl-F treatment) | `bugs_and_security_findings.md` | ✓ | Verified. The `bugs_and_security_findings.md` file contains no entries specifically about the treatments API or therapy plans. The discovery's characterization is accurate. |
| 16 | "Competency #6" per application_map.md | `application_map.md` | ✓ | Verified. `application_map.md` line 47 reads: "6. **Treatment Planning**: Mapping treatments to Belgian RIZIV nomenclature codes." Exact match. |
| 17 | `api/treatments/methods.js:35` cited for feature #1 (treatment-create) | Meteor source (not HalingoDoc) | ~ | The HalingoDoc `treatments_and_bilans.md` describes `treatments.add` in the Methods section (around line 109-111) but does not cite a specific line number for `methods.js`. The discovery's citation of `:35` for `methods.js` is a Meteor source reference, not a HalingoDoc reference. Could not verify this line without a full source read (Step 4 spot-check would be needed). Minor — the method's existence is confirmed, only the line number is unverifiable from HalingoDoc alone. |

---

## Material omissions

Features or behaviors present in the cited HalingoDoc sources but not mentioned in the discovery:

1. **`approvalState: testing` is the default state** — The HalingoDoc `treatments_and_bilans.md` (line 201-203) contains an explicit "Notable details" call-out: "`approvalState: testing` is the default — A freshly-added treatment is neither `approved` nor `pending` — it starts at `testing`." The discovery does not mention this or the `approvalState` state machine at all. This is a load-bearing behavioral detail for any spec that covers treatment creation.

2. **`isActive()` depends on `getValidBilan()` — the silent inactive trap** — `treatments_and_bilans.md` (lines 206-208) explicitly warns: "A treatment with all its bilans expired silently becomes inactive and no events can be reimbursed against it until a new bilan is added." The discovery does not capture this critical behavior.

3. **`checkEventsOfBilanType` cascade when `isReimbursed` flips** — When a bilan's `isReimbursed` field changes, all linked events of that bilan type get their `hasPayBack` recomputed (described in `treatments_and_bilans.md` lines 133-135). The discovery mentions the bilan lifecycle (feature #2) but does not document this cascading re-evaluation behavior, which is load-bearing for Reimbursement Tracking (cross-area #7).

4. **`supplementaryInsurance` / "AV" code path** — The HalingoDoc `treatments_and_bilans.md` (lines 221-224) documents that `supplementaryInsurance.payback` is a cents amount and the codes table returns `"AV"` as the code for all combinations. The discovery's feature catalog does not include this as a separate feature or notable behavior, even though it is a distinct billing path with its own rules.

5. **`VideoConsultationCode = 792433` hard-coded constant** — Documented in `treatments_and_bilans.md` (lines 210-212) as a hard-coded constant. The discovery feature catalog mentions video consultation indirectly via `DEFAULT.6` but does not flag this as a separate constant or a portability concern.

6. **`removeBilan` is picky about date presence** — `treatments_and_bilans.md` (lines 225-227) notes that `_removeBilan` short-circuits removal validation if `bilan.start` or `bilan.end` is null, allowing unconfigured bilans to always be deleted. This is a behavioral quirk relevant to the bilan-lifecycle spec.

7. **Short-term goals live on `Treatments.shortTherapy`, not in a separate collection** — `long_term_therapy_plan.md` (lines 21-22) explicitly states short-term goals are stored on the treatment row. Feature #6 in the discovery ("Short-term Treatment Goals") correctly notes these are "simple text fields stored on the treatment row" but does not highlight that the discovery's own source (`long_term_therapy_plan.md`) explicitly says these are "out of scope for this document." The discovery pulls this feature from a source that deliberately excludes it.

8. **Permissions — long-term therapy write permissions are NOT in the `default` practice role** — `long_term_therapy_plan.md` (lines 180-190) documents that `patientFile.therapies.long.add/edit/delete` are absent from the practice-level `default` role. Only owners and admins can write therapy plans at the practice level. This permission detail is absent from the discovery and is significant for spec authoring.

9. **`bilan.prescriber.name` is uppercased on save** — `treatments_and_bilans.md` (line 49) documents that prescriber name is "uppercased on save." Feature #2 does not mention this QUIRK-PRESERVE behavior.

---

## Cross-area reference check

| Cross-reference in discovery | Claimed relationship | Verified? | Finding |
|---|---|---|---|
| #7 Reimbursement Tracking: "Area #6 sets the plan and limits; Area #7 performs the actual counting and `hasPayBack` gating." | Directional data flow | ✓ | Accurate. `treatments_and_bilans.md` confirms that `treatment.totalSessions` / `usedSessions` establish the cap, while `hasPayBack` gating lives in the events/reimbursement path. However, the discovery omits the important reverse dependency: changes to bilan `isReimbursed` in Area #6 trigger `checkEventsOfBilanType` cascades that affect Area #7's `hasPayBack` values. The relationship is bidirectional, not one-way. |
| #11 Smart Invoicing: "Uses the nomenclature codes mapped here to generate official certificates." | Directional code consumption | ✓ | Accurate. `getDisorderCodes()` / `getCodeForEvent()` provide the RIZIV codes consumed by invoice generation. |
| #15 Precision Printing: "Prescriber info from bilans is mapped to matrix-printed forms." | Data flow | ✓ | Accurate. Prescriber name and RIZIV number from `bilan.prescriber.*` are used in certificate printing. |
| Bidirectionality of #7 reference | Not mentioned | ✗ | The discovery states the #6→#7 relationship as one-directional. The actual relationship is bidirectional: the `isReimbursed` flip in Area #6 triggers re-evaluation in Area #7. The discovery for Reimbursement Tracking (#7) should confirm this cascade from its side. Flag for cross-check when #7's discovery is verified. |

---

## Domain review (logopedist-be)

Verified against `/home/tj/.claude/skills/logopedist-be/references/01-riziv-nomenclature-and-tariffs.md` and `02-prescription-bilan-and-pathology-rules.md`:

| Claim in discovery | Domain verdict | Finding |
|---|---|---|
| "18 treatment types mapped to RIZIV Article 36" | CLARIFY | The mapping of treatment types to Article 36 is broadly correct — Article 36 §2 of the nomenclature is the governing instrument. The 18 app types (a, b.1–b.6.5, c.1, c.2, d, e, f, g, supplementaryInsurance) do correspond to the Article 36 §2 pathology structure. However, the app types use a simplified naming scheme that does not always map 1:1 to the nomenclature's §2 sub-paragraphs: e.g., app type `b.6.1` through `b.6.5` correspond to §2 b) 6.1 through 6.5, and app types `c.1`/`c.2` correspond to §2 c) 1° and c) 2°. `supplementaryInsurance` is not an Article 36 disorder type — it is a billing path for mutuality supplementary coverage that lies outside Article 36 entirely. Saying all 18 are "mapped to RIZIV Article 36" is technically imprecise: 17 are §2 pathologies, 1 (`supplementaryInsurance`) is not. |
| "séance d'évaluation longue" code 700991 — does it need a dedicated UI slot? | CONFIRMED (domain) + CLARIFY (product) | The logopedist-be skill confirms code 700991/701002 exists since 01/08/2024 (KB 04.06.2024). It is the "Evaluatiezitting van meer dan 30 minuten" at fee R 35 (€76.73 conventioned). Key rules: (1) only during an ongoing reimbursed treatment period; (2) triggered by documented worsening, stagnation, or ≥12-month interruption; (3) does NOT count against the session cap; (4) max 5 per treated disorder; (5) followed within 60 days by a reimbursed session. The discovery's claim that it "doesn't debit the treatment cap" is confirmed. The discovery's note that legacy app uses `DEFAULT.6` for evaluation is also confirmed — the HalingoDoc shows `DEFAULT.6 (EVALUATION_SESSION)` uses codes `700991` and `701002`. Whether this needs a dedicated UI slot is a product decision (correctly flagged as NEEDS DOMAIN REVIEW in the discovery). |
| Abolished "Evolutiebilan" codes (Aug 2024) | CONFIRMED | The logopedist-be skill explicitly confirms: "The historic codes 702015 / 704012 / 706016 / 708013 / 710010 / 704115 (evolutiebilan / bilan d'évolution) were suppressed by A.R. 4.6.2024 as of 01/08/2024." The discovery's NEEDS CLARIFICATION item is correctly framed: the legacy app still carries `evolution` as a bilan type (`getBilanTypes()` returns `EVOLUTION`), but this code is no longer billable under the current nomenclature. The product decision on whether to block it in the new stack is genuine and unresolved. |
| Bilan ordering rules (initial bilan must come first) | CONFIRMED | Domain confirms the two-prescription model (Art. 36 §4): bilan prescription must precede the bilan, and the treatment prescription follows the bilan. The hard code validation (only one initial, others must start after initial ends) is consistent with regulatory requirements. |
| Session ceilings / brackets concept | CONFIRMED | The logopedist-be skill's file 02 §4 confirms per-pathology session caps that match the `getDisorderSessions()` values: a=55, b.1=288, b.2=190, b.3=140, b.4=30, b.5=55, b.6.1=149, b.6.2=176, b.6.3=520, b.6.4=128, b.6.5=20, c.1=90, c.2=80, d=520, e=65, f=384, g=150. All values in the discovery match the regulatory session caps exactly. |
| `DEFAULT.6` (EVALUATION_SESSION) uses codes 700991 and 701002 | CONFIRMED | The logopedist-be skill (file 01, §1 table) explicitly lists both codes: 700991 (AMB) and 701002 (HOS) as the "Evaluatiezitting van meer dan 30 minuten." |

---

## Escalated source checks (Step 4)

Three Meteor source locations were spot-checked directly. Step 4 cap: 3-5 claims per area.

### Check 1 — `getDisorderCodes` at `treatments.js:354`

**Claim:** Feature #3 cites `api/treatments/treatments.js:354` as the nomenclature matrix (`getDisorderCodes`).

**Finding:** VERIFIED. Line 354 reads `Treatments.getDisorderCodes = function getDisorderCodes() {`. The function begins at this exact line. The structure is a three-level dictionary keyed by `[treatmentType][event.meta.type][event.meta.subType][event.meta.location]`. The code at lines 354-390 (first entries for types `a` and `b.1`) confirms the structure exactly as described.

### Check 2 — `bilanSchema` at `treatments.js:62`

**Claim:** Feature #2 cites `api/treatments/treatments.js:62` as the location of `bilanSchema`.

**Finding:** VERIFIED. Line 62 reads `Treatments.bilanSchema = new SimpleSchema(`. The schema definition spans lines 62-87. The fields documented in the HalingoDoc and referenced by the discovery are confirmed present: `_id`, `approvedDate`, `createdAt`, `end`, `isReimbursed`, `prescriber`, `prescriber.name`, `prescriber.riziv`, `prescriptionDate`, `start`, `type`. The bilan type values (`initial`, `evolution`, `relapse`, `extension`) at line 84 confirm the `getBilanTypes()` object.

### Check 3 — Bilan ordering hard validation at `treatments.js:99-116`

**Claim:** The discovery states that `treatments.js:99-116` enforces "only one initial bilan is allowed and all others must start AFTER it."

**Finding:** VERIFIED. Lines 99-116 contain the custom validator on the `bilans` array field:
- Line 106: `if (initials.length > 1) { return "tooMuchInitial"; }` — enforces at-most-one-initial constraint
- Lines 110-113: `const invalidBilan = initials[0] && _.find(other, (b) => b.start < initials[0].end); if (invalidBilan) { return "invalidBilanOrder"; }` — enforces ordering

This is exactly as the discovery describes and as the HalingoDoc confirms. The validation is at the schema level (SimpleSchema custom validator), making it a hard server-side validation.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-TP-01 | NOTE | citation | Direct quote attributed to `treatments_and_bilans.md:12` — actual passage begins at line 7; line 12 is the "Where it lives in the UI" section. Quote content is accurate. | NOTE — does not affect Phase 2 correctness; correct line number when publishing |
| V-TP-02 | NOTE | citation | Direct quote attributed to `long_term_therapy_plan.md:45` — actual array begins at line 28; line 45 is `LongTherapyPlan.STATES`. Quote content is accurate. | NOTE — does not affect Phase 2 correctness |
| V-TP-03 | BLOCKER | citation | Feature #3 ("nomenclature-matrix") describes "100+ CNK codes." CNK codes are pharmaceutical codes, not RIZIV logopedic nomenclature codes. The codes in `getDisorderCodes()` are RIZIV verstrekkingsnummers. If a Phase 2 spec author takes "CNK" at face value, it produces incorrect domain terminology in the spec. | Must correct to "100+ RIZIV nomenclature codes (verstrekkingsnummers)" before Phase 2. |
| V-TP-04 | NOTE | citation | Feature #6 (short-term-goals) cites `long_term_therapy_plan.md:35`. Line 35 is not about short-term goals (it is a blank/closing line in the goals array). The correct reference in that file is lines 21-22. | NOTE — the feature's existence and description are correct; line number is wrong |
| V-TP-05 | CLARIFY | omission | `approvalState: testing` is the default for new treatments — load-bearing behavior for the treatment-create spec. A spec author assuming `approvalState` defaults to `pending` or `approved` would produce wrong Gherkin. | Add to area's NEEDS CLARIFICATION backlog |
| V-TP-06 | CLARIFY | omission | Silent inactive trap: a treatment with all bilans expired silently becomes inactive (`isActive()` = false) and events cannot be reimbursed. Load-bearing for reimbursement-tracking spec. | Add to area's NEEDS CLARIFICATION backlog |
| V-TP-07 | CLARIFY | omission | `checkEventsOfBilanType` cascade: flipping `bilan.isReimbursed` triggers re-evaluation of all linked events' `hasPayBack` flags. Load-bearing cross-area behavior; affects both Area #6 bilan-lifecycle spec and Area #7 reimbursement-tracking spec. | Add to Area #6 and Area #7 NEEDS CLARIFICATION backlogs |
| V-TP-08 | CLARIFY | omission | `supplementaryInsurance` / "AV" code path is a distinct billing branch. Not surfaced as a feature in the discovery's catalog. If Phase 2 treats all 18 treatment types as equivalent RIZIV paths, the spec will be wrong for supplementaryInsurance. | Add to area's NEEDS CLARIFICATION backlog |
| V-TP-09 | NOTE | omission | `bilan.prescriber.name` is uppercased on save — a QUIRK-PRESERVE candidate not mentioned in the discovery. | NOTE — add as a QUIRK-PRESERVE candidate when writing the bilan-lifecycle spec |
| V-TP-10 | NOTE | omission | `removeBilan` picky date-presence behavior (unconfigured bilans always removable; configured bilans blocked by overlapping events) — a behavioral quirk not documented in the discovery. | NOTE — add as QUIRK-PRESERVE candidate for bilan-lifecycle spec |
| V-TP-11 | CLARIFY | omission | Long-term therapy write permissions are absent from the practice-level `default` role. Only owner and admin can create/edit/delete therapy goals at the practice level. This is a significant permission constraint not mentioned in the discovery. | Add to area's NEEDS CLARIFICATION backlog |
| V-TP-12 | NOTE | cross-area | Cross-reference to Area #7 is described as one-directional (#6 sets plan, #7 counts). The actual relationship is bidirectional: `isReimbursed` changes in #6 cascade to `hasPayBack` recomputation in #7. | NOTE — flag when verifying Area #7 discovery |
| V-TP-13 | CLARIFY | domain | "18 treatment types mapped to RIZIV Article 36" — imprecise. 17 types map to Article 36 §2 pathologies; `supplementaryInsurance` is outside Article 36 (it is a mutuality supplementary coverage path). | CLARIFY — the distinction matters for billing spec correctness |
| V-TP-14 | CLARIFY | domain | "Evolutiebilan" abolition (Aug 2024): the legacy app retains `EVOLUTION` as a bilan type in `getBilanTypes()` and the schema still allows it. The discovery correctly flags this as NEEDS CLARIFICATION, but the product decision is confirmed as unresolved. BLOCKER for the bilan-lifecycle spec if not resolved. | CLARIFY — escalate to product owner before writing bilan-lifecycle spec (feature #2) |

---

## Recommendation

**PROCEED to Phase 2 for most features, with targeted holds.**

The discovery file is broadly accurate and well-sourced. The three escalated source checks all passed cleanly. The 11 therapy goal categories, the session cap values, and the bilan ordering rules are all correctly documented.

**Hold bilan-lifecycle spec (feature #2) until V-TP-14 is resolved:** the product owner must decide whether the `evolution` bilan type is blocked, hidden, or preserved in the new app. Writing a spec before this decision produces either a wrong Gherkin scenario or a forced QUIRK-PRESERVE that cannot be resolved without a product call.

**Fix before Phase 2 (BLOCKER):** V-TP-03 — correct "CNK codes" to "RIZIV nomenclature codes (verstrekkingsnummers)" in the discovery or in the Phase 2 spec intake.

**Add to spec author intake for this area (CLARIFY items):** V-TP-05 (`approvalState: testing` default), V-TP-06 (silent inactive trap), V-TP-07 (`isReimbursed` cascade), V-TP-08 (`supplementaryInsurance` path), V-TP-11 (therapy plan permissions).

**Note for spec author:** The discovery does not cover the `supplementaryInsurance` treatment type's distinct billing path. This should be treated as a separate feature or a notable variant in the treatment-create spec.
