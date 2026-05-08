# Reimbursement Tracking

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Session counting, payback eligibility, low-session alerts.

## Spec contracts (Phase 2)

- **low-session-alert** — Feature: reimbursement-tracking/low-session-alert
  - Path: `02-specs/reimbursement-tracking/low-session-alert/spec.md`
- **payback-eligibility** — Feature: reimbursement-tracking/payback-eligibility
  - Path: `02-specs/reimbursement-tracking/payback-eligibility/spec.md`
- **payback-promotion-and-override** — Feature: reimbursement-tracking/payback-promotion-and-override
  - Path: `02-specs/reimbursement-tracking/payback-promotion-and-override/spec.md`
- **session-unit-calculation** — Feature: reimbursement-tracking/session-unit-calculation
  - Path: `02-specs/reimbursement-tracking/session-unit-calculation/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/reimbursement-tracking.md`)

# Discovery: Reimbursement Tracking

**Area:** #7 Reimbursement Tracking (from `application_map.md` § 2, competency 7)

**Scope in one breath:** Automatic calculation of RIZIV session units, enforcement of pathology-bound caps (the "bracket"), event-level reimbursement eligibility (`hasPayBack`), and automated promotion of sessions when earlier ones are demoted.

**Date:** 2026-04-09
**Agent:** Gemini CLI (parallel sources 1+2 dispatch)

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Curated | `docs/coverage_matrix.md` | — | Row 7 | Primary index for the area. |
| Curated | `docs/functional/application_map.md` | — | § 2, #7 | Area definition and scope. |
| Code-derived | `docs/from_source/features/session_counting.md` | ~200 | full | Precise math for `sessionCount` and bracket calculation. |
| Code-derived | `docs/from_source/features/event_payback.md` | ~250 | full | The `_canBePaidBack` decision tree and promotion cascade logic. |
| Cross-cutting | `docs/from_source/bugs_and_security_findings.md` | — | full | Identified schema drift and hygiene issues (e.g. `SynchedCron` silence). |
| Cross-cutting | `docs/from_source/deprecation_list.md` | — | full | Confirmed `Events.getPrices()` should eventually move to DB. |
| Cross-cutting | `docs/from_source/open_questions.md` | — | full | Validated that tariff indexation happens via hardcoded code cascades. |

### What HalingoDoc covers for this area

HalingoDoc provides exhaustive detail on the "internal" logic of reimbursement. It documents the exact formula for session counting (e.g., INITIAL_BILAN uses `Math.ceil`, BILAN_RELAPSE does not), the cascading promotion of non-paid events, and the hardcoded caps (1/day, 5/week). It also notes the "usedSessionsEvents" field which was previously thought to be dead but is actually a read-only UI field.

### What HalingoDoc does NOT cover for this area

- The **August 2024 RIZIV reform** impacts (e.g., abolition of *evolutiebilan*) which are present in domain knowledge but not fully reflected in the legacy code.
- The UI visuals for the "payback banner" in the calendar (deferred to Source 3).

---

## Source 2 — Meteor source slice

### Files read (12 total)

- `app/imports/api/events/`
  - `events.jsx` — `getAppointmentTypes` (math), `getPrices` (tariffs), schema fields.
  - `server/util.jsx` — `_canBePaidBack` (decision tree), `_updateOnEventChange` (cascade).
  - `methods.js` — `events.canBePaidBack`.
- `app/imports/api/treatments/`
  - `treatments.js` — `getDisorderSessions` (bracket caps), `bilans` helpers.
  - `server/util.js` — `getSessionsLeft`, `getSessionCount`.
  - `server/TreatmentSessionObserver.js` — SyncedCron for low-session alerts.
  - `methods.js` — `treatments.updateHalingoSessionCount`.
- `app/imports/modules/patientfiles/treatments/treatment-panel/`
  - `TreatmentPanel.jsx` — UI for `usedSessions` (backlog) and `usedSessionsEvents` (read-only).
- `app/imports/i18n/resources/client/nl.i18n.js` — Error strings for payback limits.

### Key symbols per file

- `api/events/events.jsx:49-119` — `Events.getAppointmentTypes` defines the `sessionCount` math per type.
- `api/events/server/util.jsx:21-214` — `_canBePaidBack` implements the complex Belgian RIZIV rule check.
- `api/treatments/treatments.js:328-348` — `getDisorderSessions` provides the RIZIV caps per pathology (e.g. `b.1: 288`).
- `api/treatments/server/util.js:108-117` — `getSessionsLeft` implements the core bracket formula.
- `api/treatments/server/TreatmentSessionObserver.js:30-70` — `SyncedCron.add` schedules the "expiring sessions" notification.

### Discrepancies found vs HalingoDoc

- **`usedSessionsEvents` is NOT dead**: While not written to in the schema, it is used as a state variable in `TreatmentPanel.jsx` to display the Halingo-calculated session count to the therapist.
- **`BILAN_RELAPSE` math**: The code `duration / 30` returns a float, but the schema says `Number`. HalingoDoc flagged this as a "bug/verification item" — code confirms it's a potential rounding hazard.

---

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Notes |
|---|---|---|---|---|---|---|
| 1 | `reimb/session-units` | Automatic session unit calculation | docs + source | `session_counting.md` | `events.jsx:49` | 30m=1, 60m=2 (SESSION); dur/30 (BILAN). |
| 2 | `reimb/payback-logic` | RIZIV eligibility check (`hasPayBack`) | docs + source | `event_payback.md` | `server/util.jsx:21` | Enforces 1/day, 5/week, and pathology caps. |
| 3 | `reimb/promotion-cascade` | Automatic payback promotion | docs + source | `event_payback.md` | `server/util.jsx:322` | Cascades eligibility to next event when one is demoted. |
| 4 | `reimb/bracket-total` | Session bracket management | docs + source | `session_counting.md` | `treatments/server/util.js:108` | `total - used(manual) - used(halingo)`. |
| 5 | `reimb/low-session-alert` | Expiring sessions notification | docs + source | `session_counting.md` | `TreatmentSessionObserver.js` | SyncedCron job; default threshold = 10 sessions. |
| 6 | `reimb/age-limit-18` | Age 18 cutoff for b.2/b.3/f | docs + source | `event_payback.md` | `server/util.jsx:16, 67` | Hardcoded list of types with 18th-birthday limit. |
| 7 | `reimb/supp-insurance` | Supplementary insurance exception | docs + source | `event_payback.md` | `server/util.jsx:62` | Only SESSION (type 1) eligible; bilans excluded. |
| 8 | `reimb/bilan-dependency` | Active/Reimbursed bilan requirement | docs + source | `event_payback.md` | `server/util.jsx:77-85` | Payback requires a valid bilan covering the event date. |
| 9 | `reimb/manual-override` | Therapist payback toggle | docs + source | `event_payback.md` | `AppointmentEventPage.jsx:617` | Manual switch in UI; server re-validates on "ON" flip. |
| 10 | `reimb/invoiced-lock` | Invoiced event protection | docs + source | `event_payback.md` | `events.jsx:9-12` | Payback/State frozen once `invoiceId` is set. |

---

## Belgian domain knowledge — the `logopedist-be` skill

### Verified rules vs Code findings

- **Age 10 rule for 60m sessions**: The `logopedist-be` skill (§ 4.18) confirms that 60-minute sessions are NOT reimbursable for patients < 10 years old. **CRITICAL FINDING**: This rule is **MISSING** from the legacy Meteor implementation (`_canBePaidBack` check).
- **August 2024 Reform**: The *evolutiebilan* (type 3) was abolished by RIZIV in 2024. The legacy code still contains this type and its logic, which now serves only for historical data or practices trailing the reform.
- **Renewals**: New rules (August 2024) grant fresh sessions for chronic neurological (b.6.3) but the legacy app's `totalSessions` field is static. Therapists likely increment this field manually today.
- **CAR Cumulverbod**: The skill (§ 7) confirms monodisciplinary logopedie is allowed while on a CAR waitlist. The legacy app has no automated CAR-sync; therapists manage this via manual `hasPayBack` toggles.

---

## [NEEDS CLARIFICATION]

### Q1: Handling of abolished `evolutiebilan`
- **Why it matters:** Type 3 is still in the code but abolished by RIZIV.
- **Sources conflict?** Code has it; Domain skill says it's gone.
- **What would resolve:** Product owner decision on whether to support Type 3 in Nx for historical records only.

### Q2: Rounded vs Float session units
- **Why it matters:** `INITIAL_BILAN` uses `Math.ceil`, but `BILAN_RELAPSE` uses float division (`dur/30`).
- **Sources conflict?** Inconsistency within Source 2.
- **What would resolve:** Verification of accounting expectations for "relapse" bilans (should they be units or minutes?).

### Q3: Source 3 deferred — add staging screen reference in follow-up pass.

---

## [NEEDS DOMAIN REVIEW]

- **Missing Age 10 Limit**: The domain skill identifies a "no 60m sessions for < 10 yrs" rule which is absent in the legacy code. This needs to be confirmed as a gap to be closed in the new stack.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/from_source/features/session_counting.md
/home/tj/HalingoDoc/docs/from_source/features/event_payback.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/open_questions.md

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/events/events.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/treatments.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/TreatmentSessionObserver.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/methods.js
/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js
```

---

## Verification notes (verbatim from `01-discovery/reimbursement-tracking.verification.md`)

# Verification: Reimbursement Tracking

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/reimbursement-tracking.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | `events.jsx:49-119` — `Events.getAppointmentTypes` defines `sessionCount` math: 30m=1, 60m=2 (SESSION); `dur/30` (BILAN) | `session_counting.md`; `events.jsx:49-119` | ✓ | Source matches. SESSION uses `event.meta.subType + "" === "60" ? 2 : 1`; INITIAL_BILAN uses `Math.ceil(dur/30)`; BILAN_RELAPSE uses `dur/30` (no ceil). Verified directly in source. |
| 2 | `INITIAL_BILAN` uses `Math.ceil`, `BILAN_RELAPSE` does not | `session_counting.md` | ✓ | Confirmed. `events.jsx:69` has `Math.ceil(duration.asMinutes() / 30)` for type 2; `events.jsx:102` has `duration.asMinutes() / 30` (no ceil) for type 5. HalingoDoc flags this as a potential bug. |
| 3 | `server/util.jsx:21-214` — `_canBePaidBack` enforces 1/day, 5/week, age-18 | `event_payback.md`; `server/util.jsx:21-214` | ✓ | Confirmed. Age-18 check at line 67-71; 1/day at lines 91-128; 5/week at lines 133-171. Verified directly in source. |
| 4 | `treatments.js:328-348` — `getDisorderSessions` caps (e.g. b.1: 288) | `session_counting.md`; `treatments.js:328-348` | ✓ | Confirmed. Full map verified: `a:55, b.1:288, b.2:190, b.3:140, b.4:30, b.5:55, b.6.1:149, b.6.2:176, b.6.3:520, b.6.4:128, b.6.5:20, c.1:90, c.2:80, d:520, e:65, f:384, g:150`. |
| 5 | `treatments/server/util.js:108-117` — `getSessionsLeft` bracket formula: `max(0, total - used(manual) - used(halingo))` | `session_counting.md` | ✓ | Confirmed. Formula matches: `Math.max(0, (totalSessions or disorderDefault) - usedSessions - getSessionCount(id))`. |
| 6 | `TreatmentSessionObserver.js` — `SyncedCron` for low-session alerts, default threshold 10 | `session_counting.md`; `bugs_and_security_findings.md` | ✓ | Confirmed. `TreatmentUtil.getNotificationSetting(newTreatment, "sessions", 10)` at line 58. Default is 10. |
| 7 | `server/util.jsx:16` — `TreatmentTypesWithAgeLimit = ["b.2", "b.3", "f"]` | `event_payback.md` | ✓ | Confirmed. Exact constant at line 16 of `server/util.jsx`. |
| 8 | `supplementaryInsurance` covers only `meta.type === 1` SESSION | `event_payback.md` | ✓ | Confirmed. `server/util.jsx:62-64`: `if (treatment.type === "supplementaryInsurance" && appointmentType !== 1) { return false; }`. |
| 9 | Bilan-dependency check at `server/util.jsx:77-85` | `event_payback.md` | ✓ | Confirmed. Evolution bilan check at 77-79; initial/relapse/extension at 80-85. |
| 10 | Manual override switch at `AppointmentEventPage.jsx:617` | `event_payback.md` | ~ | HalingoDoc cites `:617-633`. Discovery says `:617`. Minor imprecision; the switch spans that range. No material error. |
| 11 | Invoiced-event protection via `invoiceId` at `events.jsx:9-12` | `event_payback.md` | ~ | HalingoDoc references `events.jsx:9-12` for `invoiceId` exclusion from `Events.remove`. Discovery is accurate in spirit but the invoiced-lock applies to both delete and edit flows per `event_payback.md`. Minor imprecision. |
| 12 | `usedSessionsEvents` is "NOT dead — used as read-only UI state" | `TreatmentPanel.jsx`; contradicts `session_counting.md` | ~ | **Nuance required.** The MongoDB schema field `treatments.usedSessionsEvents` (treatments.js:136) is never written to by any server code path — HalingoDoc `session_counting.md` correctly calls it "possibly a historical field." What `TreatmentPanel.jsx` uses is a React *component state* variable of the same name, initialized to `0` and populated via the `getHalingoSessionCount` Meteor method call (TreatmentPanel.jsx:207-211). These are two different entities sharing a name. The discovery conflates the schema field with the component state. The schema field IS dead. The component state is live. This distinction matters for Phase 2: the spec should port the server-computed value, not the schema field. |
| 13 | August 2024 reform: `evolutiebilan` (type 3) abolished by RIZIV | `open_questions.md`; domain skill | ✓ | Confirmed by logopedist-be skill ref 02. Codes 702015, 704012, 704115, 706016, 708013, 710010 suppressed by A.R. 4.6.2024, in force 01/08/2024. The legacy code retains type 3 for historical data. |
| 14 | Fresh sessions for b.6.3 (chronic neurological) under August 2024 reform | domain skill | ✓ | Confirmed. §2 b) 6.3 grants 520 fresh sessions per notified 2-year renewal cycle, indefinitely. This has been RIZIV convention since well before 2024 — the 2024 reform did not change this; it changed the approval mechanism to notification. Discovery framing is slightly misleading but not incorrect. |
| 15 | CAR cumulverbod: monodisciplinary logopedie allowed while on CAR waitlist | domain skill | ✓ | Confirmed. Logopedist-be skill ref 05 and Interpretation Rule 8 (M.B. 15/01/2026): exclusion runs only from first to last session of the conventioned multidisciplinary treatment. Waitlist patients are not yet in multidisciplinary treatment and keep RIZIV logopedie. |
| 16 | `Events.getPrices()` tariff cascade is hardcoded, deferred to DB | `open_questions.md` (Q37); `deprecation_list.md` #22 | ✓ | Confirmed. Q37 answer: "Let's not do that yet for the migration." Deprecation list #22 confirms it as a "move" item. |
| 17 | `SyncedCron.config({ log: false })` — no scheduled-job audit trail | `bugs_and_security_findings.md` | ✓ | Confirmed. Listed under "Operational hygiene" in bugs file. |
| 18 | Max 5/week cap is hardcoded literal `5` at `server/util.jsx:170` | `session_counting.md` | ✓ | Confirmed. Line 170: `if (events.length >= 5)`. |
| 19 | 1/day check uses Brussels timezone (`moment(...).tz("Europe/Brussels")`) | `session_counting.md` | ✓ | Confirmed. Line 93: `const startDay = moment(event.start).tz("Europe/Brussels").startOf("day")`. |
| 20 | Promotion cascade at `server/util.jsx:322-336` | `event_payback.md` | ✓ | Confirmed by HalingoDoc. Cascade fires on update but NOT on delete — correctly noted by discovery. |

---

## Material omissions

The following features or behaviors appear in the cited HalingoDoc sources but are absent from or insufficiently treated in the discovery file:

### O-1: Long evaluation session (EVALUATION_SESSION, type 6)
`session_counting.md` documents `EVALUATION_SESSION` (meta.type 6): `sessionCount: 0`, `countsTowardsTotal: false`. The discovery feature catalog includes the type in `getAppointmentTypes` code snippet but does NOT catalog it as a distinct feature (`reimb/evaluation-session`). The new A.R. 4.6.2024 introduced code 700991-701002 for a billable evaluation session. The Phase 2 spec author needs to know whether type 6 in legacy corresponds to the new 700991-701002 evaluation session or is a separate unrelated concept. **Severity: NOTE** (the discovery does not claim the list is exhaustive, and the feature is currently `sessionCount: 0`).

### O-2: Cascade DOES NOT fire on event removal
`event_payback.md` explicitly documents that when an event is *removed*, the payback cascade does NOT re-evaluate remaining events (only on update). The discovery correctly catalogs `reimb/promotion-cascade` but does NOT flag this gap, which means deleting a "max 5/week" blocker can strand later events at `hasPayBack: false` indefinitely. This is a load-bearing behavior for the Phase 2 spec (it is a QUIRK-PRESERVE candidate — the new app could fix it, or could intentionally replicate it). **Severity: CLARIFY**.

### O-3: No-cascade on REMOVE needs [NEEDS CLARIFICATION] entry
Following O-2: the discovery's [NEEDS CLARIFICATION] section has 3 items but does not include this behavioral gap. It should be added. **Severity: NOTE** (consequence of O-2).

### O-4: `events.canBePaidBack` method (UI pre-check)
`session_counting.md` and `event_payback.md` both document `events.canBePaidBack` (`methods.js:493-512`) as a dry-run of `_canBePaidBack` used by the UI to show the "will/will not be reimbursed" banner BEFORE the user saves. The discovery mentions this method in the files list but does not catalog it as a feature or note its "dry-run, throw-on-error" semantics. Phase 2 spec author needs this to write the pre-validation UX scenario. **Severity: NOTE**.

### O-5: Group event — per-sibling payback flag
`event_payback.md` explicitly documents that for group events, each sibling event has its own independent `hasPayBack` flag; toggling one does not cascade to others (`methods.js:314-320`). The discovery does not mention group-event reimbursement handling. Area #7 should cross-reference the group-event feature. **Severity: NOTE** (group events are a separate area, but the interaction is relevant to the spec).

### O-6: `PARENT_SITTING` is excluded from 1/day cap
`session_counting.md` and the source code both confirm that `PARENT_SITTING` (type 4) and `INITIAL_BILAN` (type 2) are excluded from the 1-per-day cap (`server/util.jsx:91`). The discovery states "Enforces 1/day, 5/week" under `reimb/payback-logic` without noting these exceptions. The Phase 2 spec must encode these exceptions in Gherkin scenarios. **Severity: CLARIFY**.

---

## Cross-area reference check

The discovery file lists **no formal cross-area references**. However several implicit cross-dependencies exist in the source and HalingoDoc that Phase 2 spec authors will need:

| Implicit reference | Discovery mentions it? | Status |
|---|---|---|
| Identity/RBAC — `events.update` permission governs `hasPayBack` toggle | No mention in discovery | No bidirectional reference. `event_payback.md` states "hasPayBack toggling is part of `events.update`; standard practice-events permission applies." Phase 2 spec needs an RBAC reference to Area #1. |
| Invoicing (Area #11) — invoiced events freeze `hasPayBack` | Discovery catalogs as `reimb/invoiced-lock` (feature #10) | Cross-reference with Area #11 (Smart Invoicing) is missing. The lock is currently in the discovery as an internal feature, but the triggering mechanism (invoice creation) belongs to another area. |
| Treatment Planning (Area #6) — treatment type and bilan state determine eligibility | Implicit via source references | No explicit cross-reference in the discovery. `_canBePaidBack` depends on `treatment.type`, `treatment.bilans`, and `treatment.totalSessions`, all of which are managed in Area #6. |

**Verdict:** No bidirectional cross-area references were verified because none were declared. The Phase 2 spec author should add explicit cross-references to Areas #1, #6, and #11 before authoring scenarios for this area.

---

## Domain review (logopedist-be)

All claims were verified against `/home/tj/.claude/skills/logopedist-be/references/02-prescription-bilan-and-pathology-rules.md` (verified 2026-04-06 against Article 36 A.R. 4.6.2024 in force since 01/08/2024).

### D-1: Age-18 cutoff for b.2, b.3, f
**Discovery claim:** "Age 18 cutoff for b.2/b.3/f pathologies" — confirmed by code constant `TreatmentTypesWithAgeLimit = ["b.2", "b.3", "f"]`.

**Skill verdict:** CONFIRMED WITH NUANCE.
- §2 b) 2° (language-development): reimbursement ends at the 18th birthday. ✓
- §2 b) 3° (learning disorders): renewal permitted until "17 ans révolus" (eve of 18th birthday), but the *disorder* must be constated before the 15th birthday. ✓
- §2 f) (dysphasia): reimbursement ends at 18th birthday. ✓

**However**, the skill ref 02 §4.13 and §4.14 also lists **§2 d) (hearing-related speech disorders)** and **§2 e) (dysphagia)** as pathologies with an 18th-birthday cutoff per the 2024 RIZIV summary of changes. The legacy code constant `["b.2", "b.3", "f"]` is **INCOMPLETE** — it omits `d` and `e`. This is a real gap in the legacy implementation, not a Gemini invention. The discovery file does not flag this second gap (only the b.2/b.3/f constant is mentioned). **Severity: CLARIFY** (the missing `d` and `e` age cutoffs should be added to [NEEDS DOMAIN REVIEW] for the Phase 2 spec).

### D-2: Age-10 rule for 60m sessions (the NEEDS DOMAIN REVIEW item)
**Discovery claim:** "logopedist-be skill (§ 4.18) confirms that 60-minute sessions are NOT reimbursable for patients < 10 years old. CRITICAL FINDING: This rule is MISSING from the legacy Meteor implementation."

**Skill verdict:** CONFIRMED AS CORRECT.
Ref 02 §4.18: "A 60-minute session counts as two 30-minute sessions for the cap and is **not reimbursable for patients < 10 years old** (§3bis, A.R. 10.11.2012)." This is statutory, not a policy preference. The legacy code has NO age-10 check in `_canBePaidBack` — confirmed by grep against `server/util.jsx` (no match for "10", "< 10", or "age.*10"). **Disposition: BLOCKER** — the new app must implement this check or it will permit non-reimbursable billings for children under 10. The discovery correctly flags this as [NEEDS DOMAIN REVIEW] but does not elevate it to BLOCKER severity; the verification pass does.

### D-3: August 2024 reform — evolutiebilan abolition
**Discovery claim:** "evolutiebilan (type 3) was abolished by RIZIV in 2024."

**Skill verdict:** CONFIRMED AS CORRECT.
Ref 02 §3.2: codes 702015, 704012, 704115, 706016, 708013, 710010 suppressed by A.R. 4.6.2024, in force 01/08/2024. Legacy type 3 (`EVOLUTION_BILAN`, `countsTowardsTotal: false`, `max: 1`) remains in code for historical records. The discovery's Q1 [NEEDS CLARIFICATION] about product-owner decision is valid.

### D-4: Fresh sessions for b.6.3 under August 2024 reform
**Discovery claim:** "New rules (August 2024) grant fresh sessions for chronic neurological (b.6.3) but the legacy app's `totalSessions` field is static."

**Skill verdict:** PARTIALLY CORRECT — the framing is misleading.
Ref 02 §4.9: b.6.3 has always had 520-session renewal cycles with fresh sessions per notified 2-year renewal. The August 2024 reform changed the *approval mechanism* (accord → notification) but the session-refresh model existed before. The discovery's statement implies the fresh-session concept is new in 2024, which is inaccurate. However, the factual consequence for the product (the `totalSessions` field needs to be updatable on renewal) is correct. **Severity: NOTE** (imprecise framing, correct consequence).

### D-5: 1/day and 5/week caps
**Discovery claim:** "Enforces 1/day, 5/week" as absolute caps.

**Skill verdict:** PARTIALLY CONFIRMED WITH IMPORTANT NUANCE.
Ref 02 §4.18: "At most one individual or collective treatment session per day per patient, with the parental-guidance exception." On the 5/week cap: "The nomenclature does **not** impose a fixed weekly maximum." The 5-per-week limit in legacy code is a hardcoded product rule, not a direct statutory RIZIV cap. The discovery does not make this distinction — it implies both caps are RIZIV-mandated equally. The Phase 2 spec should note that 1/day is statutory (§7) and the 5/week is a product-level enforcement that may or may not be correct under current convention. **Severity: CLARIFY**.

### D-6: CAR cumulverbod
**Discovery claim:** "monodisciplinary logopedie is allowed while on a CAR waitlist."

**Skill verdict:** CONFIRMED AS CORRECT.
Ref 02 §4.19 and skill ref 05: The cumulverbod only takes effect once multidisciplinary CAR treatment has actually started. Waitlist patients are not yet in treatment and retain RIZIV logopedie entitlement. b.6.3 and §2 d) pathologies are furthermore excluded from the cumulverbod even during active multidisciplinary treatment.

### D-7: Session bracket caps per pathology
**Discovery claims b.1: 288 as an example cap.**

**Skill verdict:** CONFIRMED. Full caps match skill ref 02 §4 table (Article 36 §5 as of 01/08/2024):
- a: 55 ✓, b.1: 288 ✓, b.2: 190 ✓, b.3: 140 ✓, b.4: 30 ✓, b.5: 55 ✓, b.6.1: 149 ✓, b.6.2: 176 ✓, b.6.3: 520 ✓, b.6.4: 128 ✓, b.6.5: 20 ✓, c.1: 90 ✓, c.2: 80 ✓, d: 520 ✓, e: 65 ✓, f: 384 ✓, g: 150 ✓.

---

## Escalated source checks (Step 4)

Three claims were load-bearing enough to require direct Meteor source verification.

### SC-1: `events.jsx:49-119` — session count math
**Claim:** `SESSION`: 30m=1, 60m=2; `INITIAL_BILAN`: `Math.ceil(dur/30)`; `BILAN_RELAPSE`: `dur/30`.
**Source read:** Lines 49-119 read directly.
**Finding:** CONFIRMED EXACTLY. The `getAppointmentTypes` object matches the discovery description and HalingoDoc word-for-word. `EVALUATION_SESSION` (type 6) returns `0` and `countsTowardsTotal: false`, confirming it does not affect the bracket.

### SC-2: `server/util.jsx:21-214` — `_canBePaidBack` decision tree
**Claim:** Age-18 check and 1/day + 5/week enforcement at stated lines.
**Source read:** Lines 1-220 read directly.
**Finding:** CONFIRMED. Constant at line 16; age-18 gate at lines 66-71; 1/day gate at 91-128 (with Brussels timezone); 5/week gate at 133-171 (literal `>= 5`). The commented-out video-max-2/week block is visible at lines 172-185.

**Additional finding:** The 1/day check correctly excludes `meta.type !== 4` (PARENT_SITTING) and `meta.type !== 6` (EVALUATION_SESSION via `$nin: [4, 6]`). The discovery feature #2 description "Enforces 1/day, 5/week" omits these exceptions. This is the same gap as O-6.

**Confirmation of age-10 absence:** No check for patient age < 10 anywhere in lines 1-214. The `TreatmentTypesWithAgeLimit` constant only contains `["b.2", "b.3", "f"]`. The age-10 block for 60m sessions is genuinely absent from the legacy implementation.

### SC-3: `treatments.js:328-348` — `getDisorderSessions` caps
**Claim:** Caps e.g. b.1: 288.
**Source read:** Lines 320-348 read directly.
**Finding:** CONFIRMED EXACTLY. Full map matches the logopedist-be skill ref 02 §4 table for all 17 pathology codes. No divergence found.

### SC-4: `usedSessionsEvents` naming collision (bonus check — triggered by O-7)
**Claim:** Discovery says `usedSessionsEvents` is "NOT dead — used as read-only UI state."
**Source read:** `TreatmentPanel.jsx` lines 107-212.
**Finding:** The discovery claim is technically true but materially misleading. `TreatmentPanel.jsx:114` initializes React component state `{ usedSessionsEvents: 0 }`. Line 207-211 populates it from `getHalingoSessionCount` method call. This is completely separate from the MongoDB schema field `treatments.usedSessionsEvents` (treatments.js:136) which HalingoDoc correctly states is "never written to." The component state uses the same name coincidentally. The Phase 2 spec author must understand: (1) the schema field is dead and should NOT be ported; (2) the UI display value should be computed fresh via a server call, not stored in the document.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-reimb-01 | BLOCKER | domain | The age-10 rule for 60-minute sessions (Art. 36 §3bis, A.R. 10.11.2012) is confirmed absent from legacy `_canBePaidBack`. The new app must implement this check. Phase 2 spec must add a Gherkin scenario: "Given patient is under 10 years old, When therapist creates a 60-minute SESSION event, Then hasPayBack is false with error PATIENT_TOO_YOUNG_FOR_60MIN." | Must be encoded in Phase 2 spec before authoring |
| V-reimb-02 | BLOCKER | domain | The age-18 cutoff for §2 d) (hearing disorders) and §2 e) (dysphagia) is absent from the legacy `TreatmentTypesWithAgeLimit` constant (`["b.2", "b.3", "f"]`). The skill ref 02 §4.13-4.14 confirms both have 18th-birthday cutoffs per RIZIV 2024 summary. The new app should add `d` and `e` to this constant (or make it configurable). Phase 2 spec must note this as a regulatory fix. | Must be addressed in Phase 2 spec |
| V-reimb-03 | CLARIFY | omission | Promotion cascade DOES NOT fire on event removal — only on update. Discovery feature #3 (`reimb/promotion-cascade`) does not flag this. The new app should make an explicit design decision: replicate the legacy gap (QUIRK-PRESERVE) or fix it (implement cascade on remove). Add to [NEEDS CLARIFICATION]. | Add to discovery Q4 |
| V-reimb-04 | CLARIFY | citation | `usedSessionsEvents` naming collision: the schema field is dead (never written); the React component state of the same name is live (computed via `getHalingoSessionCount`). Discovery saying "NOT dead" is misleading. Phase 2 spec must clarify: do not port the schema field; do port the server-computed fresh value shown in the UI. | Add clarification to Phase 2 spec scope |
| V-reimb-05 | CLARIFY | domain | 5/week cap is a product-level enforcement, not a direct RIZIV statutory cap per session-level rules. The nomenclature imposes 1/day (§7) as a statutory limit; the 5/week is a product rule. The discovery implies both are equal-weight RIZIV rules. Phase 2 spec should note the regulatory basis difference. | Add note to Phase 2 spec |
| V-reimb-06 | CLARIFY | omission | 1/day cap exceptions for PARENT_SITTING (type 4) and INITIAL_BILAN (type 2) are confirmed in source but not mentioned in discovery feature #2. Phase 2 Gherkin scenarios for the daily cap must encode these exceptions. | Add to Phase 2 spec scenarios |
| V-reimb-07 | CLARIFY | domain | Discovery framing that "New rules (August 2024) grant fresh sessions for b.6.3" is misleading. The 520-session-per-cycle renewal for b.6.3 predates 2024; the 2024 reform changed the approval mechanism from accord to notification. The factual product consequence (totalSessions needs to be updatable) is correct. Framing should be corrected in Phase 2 spec. | NOTE-level for Phase 2 spec author awareness |
| V-reimb-08 | NOTE | citation | Manual override switch: discovery cites `AppointmentEventPage.jsx:617`; HalingoDoc cites `:617-633`. Discovery is slightly imprecise (single line vs. range). No material error. | No action required |
| V-reimb-09 | NOTE | omission | EVALUATION_SESSION (type 6, sessionCount=0) is present in `getAppointmentTypes` and HalingoDoc but not cataloged as a distinct feature in the discovery. Relevant because new A.R. 4.6.2024 introduced a billable evaluation session code (700991-701002). Phase 2 should clarify whether type 6 maps to this or is independent. | Add to Phase 2 open questions |
| V-reimb-10 | NOTE | omission | Cross-area dependencies to Areas #1 (RBAC for toggle), #6 (treatment + bilan state), and #11 (invoice lock) are not declared in the discovery. No formal cross-reference section exists. Phase 2 spec author should add these. | Phase 2 spec author to address |
| V-reimb-11 | NOTE | omission | `events.canBePaidBack` method (dry-run pre-check used by UI banner) is listed in source files but not cataloged as a feature. Phase 2 spec needs a "pre-check before create" scenario. | Phase 2 spec author to address |

---

## Recommendation

**PROCEED to Phase 2 with the following conditions:**

1. **BLOCKER V-reimb-01 must be resolved before authoring the `reimb/payback-logic` spec.** The Phase 2 spec author must add a Gherkin scenario for the age-10 / 60-minute rule and mark it as a regulatory fix (not a QUIRK-PRESERVE — the legacy is wrong, the new app must comply).

2. **BLOCKER V-reimb-02 must be resolved before authoring `reimb/age-limit-18`.** The spec must expand `TreatmentTypesWithAgeLimit` to include `d` and `e` pathology types (dysphagia and hearing-related). A product-owner decision is needed on whether this is a phased fix or a launch-blocking fix; halingo operates under RIZIV obligations so compliance implications are material.

3. **CLARIFYs V-reimb-03, V-reimb-04, V-reimb-05, V-reimb-06 should be added to the area's [NEEDS CLARIFICATION] backlog** before Phase 2 spec authoring begins. They are not blocking discovery, but they are blocking complete scenario authoring.

4. **NOTEs V-reimb-07 through V-reimb-11** are Phase 2 spec author awareness items; they do not require a re-discovery pass.

5. **Source 3 (staging walk) remains deferred** per the discovery file. The verification cannot assess UI layout claims. This is acceptable for Phase 2 authoring of the logic-heavy scenarios; the staging walk should be completed before authoring UX-level Gherkin scenarios for the reimbursement tab.

**Overall: the discovery file is accurate and well-sourced for the logic it covers. Two regulatory compliance gaps (BLOCKERS) were uncovered by domain review that the Phase 2 spec must address before the area is safe to port.**
