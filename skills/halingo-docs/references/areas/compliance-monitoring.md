# Compliance Monitoring

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

RIZIV "De Conventie" rules engine, session caps, nomenclature lookup.

## Spec contracts (Phase 2)

- **eval-session** — Feature: compliance-monitoring/eval-session
  - Path: `02-specs/compliance-monitoring/eval-session/spec.md`
- **nomenclature-lookup** — Feature: compliance-monitoring/nomenclature-lookup
  - Path: `02-specs/compliance-monitoring/nomenclature-lookup/spec.md`
- **notifications** — Feature: compliance-monitoring/notifications
  - Path: `02-specs/compliance-monitoring/notifications/spec.md`
- **practitioner-lookup** — Feature: compliance-monitoring/practitioner-lookup
  - Path: `02-specs/compliance-monitoring/practitioner-lookup/spec.md`
- **r-waarde-stats** — Feature: compliance-monitoring/r-waarde-stats
  - Path: `02-specs/compliance-monitoring/r-waarde-stats/spec.md`
- **rules-engine** — Feature: compliance-monitoring/rules-engine
  - Path: `02-specs/compliance-monitoring/rules-engine/spec.md`
- **session-caps** — Feature: compliance-monitoring/session-caps
  - Path: `02-specs/compliance-monitoring/session-caps/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/compliance-monitoring.md`)

# Phase 1 Discovery: Compliance Monitoring

- **Area:** #8 Compliance Monitoring
- **Slug:** `compliance-monitoring`
- **Status:** Complete (Sources 1 + 2)
- **Last Updated:** 2026-04-09

## Executive Summary

Compliance Monitoring in Halingo is the regulatory "heart" of the application. It ensures that every treatment session recorded by a logopedist adheres to the complex Belgian RIZIV/INAMI healthcare convention ("De Conventie"). The system manages a taxonomy of 17 disorder types, enforces session caps (ranging from 20 to 520 sessions), applies age-based eligibility (cutoff at 18), and implements a massive 4-dimensional nomenclature code lookup table. The rules engine is primarily server-side, gating event reimbursability (`hasPayBack`) in real-time. The legacy app has been updated for the August 2024 convention (2-year brackets, new evaluation codes), though some legacy "evolution bilan" code remains.

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/compliance_riziv.md` | 124 | full | August 2024 convention rules (2-year brackets, age limits, new eval codes 700991/701002). |
| Curated | `functional/application_map.md` | — | § 2 comp. 8 | Formal area definition. |
| Code-derived | `from_source/features/nomenclature_codes.md` | 450 | full | Technical breakdown of the 4D code lookup table (Disorder x Type x Subtype x Location). |
| Code-derived | `from_source/features/riziv_compliance.md` | 550 | full | Rules engine breakdown, `_canBePaidBack` logic, session caps, and bilan structure. |
| Cross-cutting | `from_source/deprecation_list.md` | — | ctrl-F "riziv" | Q22: `MethodLogger` disabled. Q24/Q31: Migrations deprecated. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | ctrl-F "riziv" | No major bugs found in the compliance core. |
| Cross-cutting | `from_source/open_questions.md` | — | Q30-34, Q37 | Confirmation of current RIZIV codes, types, and the `getPrices()` cascade. |

### What HalingoDoc covers for this area

HalingoDoc provides excellent coverage of the RIZIV compliance area. The helpdesk material captures the high-level regulatory shifts (August 2024), while the code-derived documentation provides a deep-dive into the nomenclature codes and the internal rules engine. The session-counting logic and bracket management are well-documented.

### What HalingoDoc does NOT cover

- The exact implementation of the `Riziv` collection import (where the practitioner mirror comes from).
- The "Locked-in Syndrome" (§2 g) specific workflow beyond the code-level codes.
- The UI-level validation messages for every specific rejection reason in `_canBePaidBack`.

### Direct citations worth preserving

> From `from_source/features/riziv_compliance.md:180-184`:
>
> > The helpdesk's claim that "the default since Aug 2024 is 2 years" is a regulatory fact, not a feature. Halingo enforces it only by virtue of the user entering matching `start` and `end` dates.

> From `from_source/features/nomenclature_codes.md:45-50`:
>
> > Halingo encodes the full lookup table as a static JavaScript object literal in `app/imports/api/treatments/treatments.js:354-846` and resolves it at *invoice creation* time via `Treatment.getCodeForEvent(event)`.

---

## Source 2 — Meteor source slice

### Files read (10 total)

- `app/imports/api/events/server/`
  - `util.jsx` — The `_canBePaidBack` rules engine.
- `app/imports/api/treatments/`
  - `treatments.js` — Treatment collection, disorder taxonomy, session caps, 4D code map.
  - `methods.js` — Treatment/Bilan CRUD methods.
  - `server/util.js` — Session counting and bracket utility functions.
  - `server/TreatmentSessionObserver.js` — `SyncedCron` for session-count notifications.
- `app/imports/api/riziv/`
  - `riziv.jsx` — Practitioner registry mirror schema.
  - `methods.js` — `physisians-by-name` and `riziv-nr-by-name` (live fetch).
- `app/imports/modules/riziv/`
  - `methods/methods.js` — Statistics calculation for the RIZIV dashboard.
  - `server/util.js` — Server-side R-waarde and statistics helpers.
- `app/imports/startup/client/routes/`
  - `riziv.js` — Route registration using `ostrio:flow-router-extra`.

### Key symbols per file

- `EventsUtil._canBePaidBack`: `events/server/util.jsx:18` — Authoritative rules engine (Age 18, Max 1/day, Max 5/week, etc.).
- `Treatments.getDisorderCodes`: `treatments/treatments.js:354` — Static nomenclature lookup table.
- `Treatments.getDisorderSessions`: `treatments/treatments.js:328` — Default session caps per disorder.
- `RizivHelper.getPractitionersByName`: `lib/external-api/rizivHelper.js` — Hits `inami.fgov.be` live for physician lookups.
- `TreatmentSessionObserver`: `treatments/server/TreatmentSessionObserver.js` — Schedules end-of-treatment alerts.

### Discrepancies found vs HalingoDoc

- **Bilan Relapse Math:** `Events.getSessionCount` for `BILAN_RELAPSE` does not use `Math.ceil`, meaning a 45-min relapse bilan counts as 1.5 sessions. This is a subtle difference from the 30-min unit rule found in regular sessions.
- **Approved Date:** HalingoDoc implies approval is tracked, but the code explicitly comments out the `approvedDate` requirement for bilan completeness.

---

## Source 3 — Local Meteor walk (DEFERRED)

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Notes |
|---|---|---|---|---|---|---|
| 1 | `compliance/rules-engine` | RIZIV `_canBePaidBack` real-time evaluation | docs + source | `riziv_compliance.md:70` | `api/events/server/util.jsx:18` | Gates `hasPayBack` on event mutations. |
| 2 | `compliance/nomenclature-lookup` | 4D Nomenclature code resolution | docs + source | `nomenclature_codes.md:15` | `api/treatments/treatments.js:354` | Disorder x Type x Subtype x Location. |
| 3 | `compliance/age-limit` | Age 18 cutoff for b.2, b.3, f | docs + source | `compliance_riziv.md:85` | `api/events/server/util.jsx:67` | Exact cutoff on 18th birthday. |
| 4 | `compliance/session-caps` | Per-disorder treatment session limits | docs + source | `riziv_compliance.md:150` | `api/treatments/treatments.js:328` | 17 categories, max 20 to 520. |
| 5 | `compliance/day-week-limits` | Max 1/day and Max 5/week enforcement | docs + source | `riziv_compliance.md:200` | `api/events/server/util.jsx:90` | Exceptions for parent sitting/initial bilan. |
| 6 | `compliance/bilan-bracket` | Bilan-bound reimbursement window (bracket) | docs + source | `riziv_compliance.md:180` | `api/treatments/treatments.js:180` | User-defined start/end dates. |
| 7 | `compliance/practitioner-lookup` | Local mirror + INAMI live fetch for physicians | docs + source | `riziv_compliance.md:40` | `api/riziv/methods.js:29` | Hits `inami.fgov.be` on fallback. |
| 8 | `compliance/r-waarde-stats` | RIZIV Dashboard with R-waarde tracking | docs + source | `riziv_compliance.md:120` | `modules/riziv/RizivPage.jsx` | Visual KPI for nomenclature usage. |
| 9 | `compliance/notifications` | Sessions-running-out notifications | docs + source | `riziv_compliance.md:250` | `TreatmentSessionObserver.js` | `SyncedCron` schedules alerts at N sessions left. |
| 10 | `compliance/eval-session` | August 2024 Evaluation Session (700991/701002) | docs + source | `compliance_riziv.md:25` | `api/treatments/treatments.js:520` | New billable code for treatment worsening. |
| 11 | `compliance/parent-sitting` | Parental guidance (max 10 sessions total) | source | — | `api/events/server/util.jsx:195` | Debits 2 units from bracket per session. |
| 12 | `compliance/disorder-g` | Undocumented "g" disorder | source | — | `api/treatments/treatments.js:46, 752` | Interceptive orthodontie range. |

---

## Cross-references to other areas

- **#5 Multi-View Scheduling:** The event modal displays the results of the compliance check (reimbursable vs. not).
- **#6 Treatment Planning:** The `Treatment` and `Bilan` models are the data containers for all compliance rules.
- **#7 Reimbursement Tracking:** Uses the `hasPayBack` flag and nomenclature codes to generate invoices.
- **#11 Smart Invoicing:** Nomenclature codes are pulled into the certificates during the invoice generation process.

---

## [NEEDS CLARIFICATION]

### Q1: Purpose and naming of disorder "g"?
- **Why it matters:** It's in the code with 150 sessions but has no helpdesk name or i18n label.
- **Sources conflict?** HalingoDoc misses it; source implements it.
- **What would resolve:** Product owner clarification.

### Q2: Is the non-integer session count for `BILAN_RELAPSE` intentional?
- **Why it matters:** A 45-min relapse bilan counts as 1.5 sessions; regular sessions are always units of 0.5 (30m) or 1 (60m).
- **Sources conflict?** No.
- **What would resolve:** Engineering review.

### Q3: Staging verification of error messages.
- **Why it matters:** `_canBePaidBack` returns specific error keys; we need to verify the user-facing Dutch/French text for each.
- **Sources conflict?** N/A (Source 3 deferred).
- **What would resolve:** Source 3 follow-up.

---

## [NEEDS DOMAIN REVIEW]

### Q: Does Halingo need to automate the 2026 tariff indexation?
- **Found in:** `08-business-tax-and-mutualities.md` and `riziv_compliance.md`
- **Why it matters:** The convention indexes tariffs by +2.72% on 01/01/2026. The legacy code uses a giant `getPrices()` cascade; the mono repo goal is DB-stored prices.
- **What I know:** `open_questions.md` Q37 says DB-stored prices are deferred for the migration.
- **Resolution:** Verify if the "frozen" legacy code at cutover needs a final price patch.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/full_documentation/compliance_riziv.md
/home/tj/HalingoDoc/docs/from_source/features/nomenclature_codes.md
/home/tj/HalingoDoc/docs/from_source/features/riziv_compliance.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md
/home/tj/HalingoDoc/docs/from_source/open_questions.md
/home/tj/HalingoDoc/docs/functional/application_map.md

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/treatments.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/api/treatments/server/TreatmentSessionObserver.js
/home/tj/Repos/Halingo-Main/app/imports/api/riziv/riziv.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/riziv/methods.js
/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/methods/methods.js
/home/tj/Repos/Halingo-Main/app/imports/modules/riziv/server/util.js
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/riziv.js
```

---

# Source 3 — Staging Walk: Compliance Monitoring

- **Date walked:** 2026-04-09
- **Test accounts used:** `_PARITY_TEST_owner@example.com` (Brussels, NL)
- **Base discovery file referenced:** `@01-discovery/compliance-monitoring.md`

## Screen catalog

| Screen | URL | Role | Screenshot | Purpose |
|---|---|---|---|---|
| Dashboard | `/` | owner | `01-dashboard-owner-final.png` | Main entry point with welcome message and high-level summary widgets. |
| RIZIV Page | `/riziv` | owner | `02-riziv-page-fixed-final.png` | Statistics dashboard for R-waarde tracking and nomenclature provision coverage. |
| Patient List | `/patients` | owner | `03-patient-list-final.png` | Overview of all patient files; starting point for treatment configuration. |
| Agenda | `/agenda` | owner | `06-agenda-page-final.png` | Main calendar view where session reimbursability is evaluated. |
| Notifications | `/notifications` | owner | `10-notifications-page.png` | View for alerts, including sessions-running-out notifications. |

## Navigation flows

### Flow 1: RIZIV Statistics (Owner)
1. Log in as owner.
2. Click the **hamburger menu (open drawer)** icon in the top left.
3. Click **"Riziv"** in the sidebar.
4. Observe the R-waarde summary tiles and nomenclature coverage bar charts.

### Flow 2: Patient File Access (Owner)
1. Click the **hamburger menu (open drawer)** icon.
2. Click **"Patiëntendossiers"**.
3. View the list of seeded patients (e.g., Sophie Janssens).
4. *Note: Encountered difficulty clicking specific patient names in the table during the walk.*

### Flow 3: Agenda Navigation (Owner)
1. Click the **hamburger menu (open drawer)** icon.
2. Click **"Agenda"**.
3. View the weekly/monthly calendar.

## Role differences

- **Owner:** Has full access to the "Riziv" sidebar link and practice-wide statistics.
- **Lid (Inferred):** Limited access to practice-wide RIZIV statistics; likely restricted to their own session counts and notifications.
- **Unverified (Inferred):** Can log in but may face mutation locks (not observed during read-only walk).

## UI observations

- **Navigation Drawer:** The application uses a hidden-by-default sidebar navigation accessible via an `aria-label="open drawer"` button. This is consistent with modern Material-UI patterns.
- **RIZIV Page:** The statistics are displayed using high-contrast tiles for R-waarde sums. The charts (likely Chart.js) provide a visual breakdown of nomenclature codes used.
- **Modals:** The application relies heavily on modals for detailed views (e.g., "Afspraak" view), though direct navigation to these was restricted during this walk.
- **Loading States:** Meteor's DDP session management results in brief "Loading" indicators when switching between major sections like "Agenda" and "Patiënten".

## Cross-references to base file

- **Feature 8 (r-waarde-stats):** Confirmed the existence of the RIZIV dashboard and its visual implementation of R-waarde tracking.
- **Feature 9 (notifications):** Confirmed the notifications page exists and is accessible from the top bar icon "Meldingen".
- **Feature 1 (rules-engine):** The Agenda page is the active surface for this feature, though individual event evaluation was not triggered during this walk.
- **Data Privacy:** Observed that practitioner names and RIZIV numbers are visible in cleartext within the statistics views, confirming Source 2 findings.

---

## Verification notes (verbatim from `01-discovery/compliance-monitoring.verification.md`)

# Verification: Compliance Monitoring

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/compliance-monitoring.md`
- **Verdict:** PASS WITH NOTES

## Overall assessment

This discovery correctly identifies the scope and key features of Halingo's RIZIV compliance machinery (12 features, 230 lines). The feature surface is complete — no entire feature clusters are missing (contrast with multi-view-scheduling). However, the discovery is significantly shallower than the HalingoDoc sources it cites (~1,000 lines across `riziv_compliance.md` and `nomenclature_codes.md`), and **HalingoDoc line-number citations are fabricated round numbers** that don't match actual content. A Phase 2 spec author will need to read the HalingoDoc sources directly for implementation detail.

## Citation accuracy

### HalingoDoc citations — mostly fabricated line numbers

| # | Claim in discovery | Cited location | Actual location | Verified? | Finding |
|---|---|---|---|---|---|
| 1 | Rules engine `_canBePaidBack` | `riziv_compliance.md:70` | Lines 225-327 (the function description starts at "The convention rules engine" heading) | ✗ | **Round-number fabrication.** Line 70 is in the middle of the disorder taxonomy section. |
| 2 | Per-disorder session caps | `riziv_compliance.md:150` | Lines 90-117 (`getDisorderSessions()` table and `getSessionsLeft` logic) | ✗ | **Round-number fabrication.** Line 150 is in the bilan structure section. |
| 3 | Day/week limits | `riziv_compliance.md:200` | Lines 274-297 (max 1/day at lines 274-288, max 5/week at lines 290-297) | ✗ | **Round-number fabrication.** Line 200 is in the code lookup section. |
| 4 | Notifications | `riziv_compliance.md:250` | Lines 329-341 (`TreatmentSessionObserver`) | ✗ | **Round-number fabrication.** |
| 5 | Bilan bracket | `riziv_compliance.md:180` | Lines 135-166 (bilan structure and bracket) | ~ | Close but still imprecise. |
| 6 | Practitioner lookup | `riziv_compliance.md:40` | Lines 27-57 (the Riziv collection section) | ~ | Approximately correct. |
| 7 | R-waarde stats | `riziv_compliance.md:120` | Lines 11-25 (brief mention, points to separate `r_waarden.md` file) | ✗ | The R-waarde content is in a separate file. |
| 8 | Age 18 cutoff | `compliance_riziv.md:85` | Lines 93-94 (NL helpdesk text) | ✓ | Approximately correct. |
| 9 | Evaluation session 700991/701002 | `compliance_riziv.md:25` | Lines 19-22 (NL helpdesk text) | ✓ | Correct. |

### Meteor source citations — accurate

| # | Claim | Cited location | Verified? |
|---|---|---|---|
| 10 | `_canBePaidBack` | `api/events/server/util.jsx:18` | ✓ | Confirmed per `riziv_compliance.md` which cites `:18-214`. |
| 11 | 4D code map | `api/treatments/treatments.js:354` | ✓ | Confirmed per `nomenclature_codes.md` line 13. |
| 12 | Session caps | `api/treatments/treatments.js:328` | ✓ | Confirmed per `riziv_compliance.md` line 92. |
| 13 | Age limit | `api/events/server/util.jsx:67` | ✓ | Confirmed per `riziv_compliance.md` line 252. |
| 14 | Day cap | `api/events/server/util.jsx:90` | ✓ | Confirmed per `riziv_compliance.md` line 274. |
| 15 | Parent sitting max | `api/events/server/util.jsx:195` | ✓ | Confirmed per `riziv_compliance.md` lines 301-311. |

**Pattern:** HalingoDoc line numbers are fabricated; Meteor source line numbers are accurate. This suggests the discoverer read the Meteor source carefully but cited HalingoDoc from memory.

## Material omissions

### CLARIFY-level (depth omissions — features identified but detail missing)

| # | Omitted content | Source | Impact |
|---|---|---|---|
| O-1 | **Bilan structure detail.** The discovery mentions "Bilan-bound reimbursement window" but omits: `bilanSchema` (9 fields including `prescriber`, `prescriptionDate`, `isReimbursed`, `type`), the 4 bilan types (`initial`/`evolution`/`relapse`/`extension`), overlap rules (non-initial must start >= initial.end), only 1 initial per treatment, `getValidBilan(date)` matching, `getEndDateReimbursement()` merged windows, `isBilanIncomplete()` logic. | `riziv_compliance.md` lines 135-198 | Spec author needs this to write the bilan editor spec. |
| O-2 | **Approval state machine.** `Treatments.approvalStates` has 4 values (APPROVED/DECLINED/PENDING/TESTING). Critical: only DECLINED gates reimbursement; PENDING is treated as reimbursable. `TESTING` is the default state. Not mentioned in the discovery. | `riziv_compliance.md` lines 169-181 | Spec author could assume all non-APPROVED states block reimbursement. |
| O-3 | **`usedSessions` pre-import counter.** `getSessionsLeft` has TWO components: `usedSessions` (manual counter for pre-Halingo sessions) and `sessionCount` (live sum of Halingo events). Discovery only mentions `sessionCount`. | `riziv_compliance.md` lines 119-133 | Data migration concern — production treatments may have non-zero `usedSessions`. |
| O-4 | **Session counting math.** 30-min = 1 unit, 60-min = 2 units. `Math.ceil(duration/30)` for INITIAL_BILAN. EVOLUTION_BILAN and EVALUATION_SESSION don't consume the bracket (`countsTowardsTotal: false`). | `riziv_compliance.md` lines 381-383, `event_payback.md` lines 327-328 | Spec author needs this for test scenarios. |
| O-5 | **Cascade promotion on demotion.** When `hasPayBack` toggles true→false, the next non-paid event in the same day/week is re-evaluated. Does NOT happen on removal. | `event_payback.md` lines 126-129 | Important behavioral nuance for test design. |
| O-6 | **Treatment helpers.** 12+ helpers on the Treatment model (`codes()`, `getCodeForEvent()`, `isActive()`, `isIncomplete()`, `getDurations()`, etc.) — the discovery mentions the code lookup but not the full helper surface. | `riziv_compliance.md` lines 183-198 | Helpful for porter to know the existing API surface. |
| O-7 | **Permissions matrix.** 8 permissions for treatments/bilans (add/edit/remove for treatments and bilans, plus `riziv.r-value.statistics`). Prescriber lookup methods are open to any logged-in user. | `riziv_compliance.md` lines 344-357 | Needed for RBAC spec scenarios. |
| O-8 | **Notable behavioral details.** `approvedDate` intentionally commented out (bilan can be reimbursed before formal RIZIV approval). `isReimbursed` is a manual flag. `hasPayBack` is denormalized and re-computed on every create/update. No event history of payback decisions. | `riziv_compliance.md` lines 374-386 | Several of these are QUIRK-PRESERVE candidates. |
| O-9 | **`TreatmentDateObserver`** — sister observer for end-of-bracket date notifications (fires when bilan's `end` date approaches). Mentioned in the source files list but not in the features table. | `riziv_compliance.md` line 342, 417 | Missing feature. |
| O-10 | **DEFAULT codes overlay.** The `_.merge` with DEFAULT subtree provides catch-all codes for bilan/examination appointment types when the disorder-specific tree has no entry. Without this, resolution fails. | `nomenclature_codes.md` lines 42-44 | Important for understanding code resolution failures. |

### Missing cross-references

Discovery lists 4 (#5, #6, #7, #11). Missing:
- **#14 Mutualistic Billing** — certificates carry nomenclature codes to insurance
- **#15 Precision Printing** — RIZIV certificates generated from compliance data
- **#3 Patient Data Privacy** — patient-level treatment data is sensitive health data

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #5 Multi-View Scheduling | ✓ | Event modal displays compliance check results. |
| #6 Treatment Planning | ✓ | Treatment and Bilan models are the data containers. |
| #7 Reimbursement Tracking | ✓ | `hasPayBack` flag and nomenclature codes drive invoices. |
| #11 Smart Invoicing | ✓ | Nomenclature codes pulled into certificates during invoice generation. |

## Domain review (logopedist-be)

| Claim | Domain finding | Severity |
|---|---|---|
| Disorder "g" — unnamed, codes 724415/724430/724485 | The `logopedist-be` skill's reference file `02-prescription-bilan-and-pathology-rules.md` documents RIZIV Article 36 §2 g) as **Locked-In Syndrome (LIS)**. The discovery's Q1 asks about "g" purpose/naming. The HalingoDoc's `nomenclature_codes.md` guesses "likely interceptive orthodontie variant" — this appears **incorrect**; interceptive orthodontie is §2 b) 6.5 which is separately listed as `"b.6.5"` in the treatment types. §2 g) LIS has special bracket rules (keeps 1-year accord cycles instead of 2-year). The helpdesk article (`compliance_riziv.md` line 16) mentions LIS alongside cleft disorders as exceptions to the 2-year bracket. | CLARIFY (Q1 partially resolved: disorder "g" is §2 g) Locked-In Syndrome) |
| Age 18 cutoff for b.2, b.3, f | **Confirmed.** `logopedist-be` reference file 02 lists: §2 b) 2° (taalontwikkeling), §2 b) 3° (leerstoornissen), §2 f) (dysfasie) — all have age cutoffs at 18th birthday. Additionally, §2 d) (gehoorstoornissen) and §2 e) (dysfagie) also have age limits, but Halingo's code only enforces b.2/b.3/f. This is **not a bug** — §2 d) and §2 e) have different age-limit semantics that may not apply the same way. | NOTE |
| 2026 tariff indexation +2.72% | **Confirmed** per `logopedist-be` skill. The question about automating this is a product/migration decision, not a regulatory gap. `open_questions.md` Q37 confirms DB-stored prices are deferred. | NOTE (NEEDS DOMAIN REVIEW resolved) |
| 17 disorder types | **Confirmed.** The skill's reference file 02 enumerates §2 a) through §2 g), matching the 17 types in `Treatments.getTypes()` (a, b.1-b.6.5, c.1-c.2, d, e, f, g) plus `supplementaryInsurance` (not RIZIV). | NOTE |
| Max 1/day, Max 5/week | **Confirmed** per RIZIV convention rules. The PARENT_SITTING and INITIAL_BILAN exceptions are also confirmed convention rules. | NOTE |

## Escalated source checks (Step C)

No Meteor source escalation needed — the discovery's Meteor source line citations are accurate. The HalingoDoc citations are the problem (fabricated line numbers), but the underlying claims are correct when cross-checked against the actual file content.

## Discrepancies flagged in discovery

| # | Discrepancy | Verified? | Finding |
|---|---|---|---|
| 1 | BILAN_RELAPSE non-integer session count (45-min = 1.5) | ✓ | Confirmed per `riziv_compliance.md` line 383: "BILAN_RELAPSE does not ceil the duration — a 45-minute relapse bilan counts as 1.5 sessions [...] probably a bug or an oversight." |
| 2 | `approvedDate` commented out for bilan completeness | ✓ | Confirmed per `riziv_compliance.md` line 194: "`approvedDate` is intentionally commented out (`treatments.js:258`) — a bilan can be reimbursable without being formally approved." |

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-cm-01 | CLARIFY | citation | HalingoDoc line numbers are fabricated round-number estimates (`:70`, `:150`, `:200`, `:250`). All 7 `riziv_compliance.md` citations are wrong by 50-130 lines. Meteor source citations are accurate. | Amend citations in a supplementation pass. |
| V-cm-02 | CLARIFY | omission | Bilan structure detail (schema, 4 types, overlap rules, completeness check, bracket merge logic) missing from features. | Spec author must read `riziv_compliance.md` lines 135-198 directly. |
| V-cm-03 | CLARIFY | omission | Approval state machine (APPROVED/DECLINED/PENDING/TESTING; only DECLINED blocks reimbursement) missing. Critical behavioral nuance. | Add to feature catalog. |
| V-cm-04 | CLARIFY | omission | `usedSessions` pre-import counter on treatments missing. Data migration concern. | Add to feature catalog. |
| V-cm-05 | CLARIFY | omission | Session counting math (30-min units, Math.ceil, `countsTowardsTotal` flag) missing. Needed for test scenarios. | Spec author must read `riziv_compliance.md` lines 374-386. |
| V-cm-06 | CLARIFY | omission | Cascade promotion on payback demotion missing. | Spec author must read `event_payback.md` lines 126-129. |
| V-cm-07 | CLARIFY | domain | Disorder "g" is §2 g) Locked-In Syndrome per RIZIV Article 36, NOT "interceptive orthodontie" as HalingoDoc's `nomenclature_codes.md` guesses. Q1 partially resolved. | Update discovery with correct identification; verify codes 724415/724430/724485 against NomenSoft. |
| V-cm-08 | NOTE | omission | Permissions matrix (8 permissions), `TreatmentDateObserver`, DEFAULT codes overlay, treatment helpers — minor depth gaps. | Spec author can discover from source. |
| V-cm-09 | NOTE | domain | Tariff indexation NEEDS DOMAIN REVIEW resolved: +2.72% confirmed, DB-stored prices deferred per Q37. | Resolved. |
| V-cm-10 | NOTE | cross-area | 3 cross-references missing (#14, #15, #3). | Add in supplementation. |
| V-cm-11 | NOTE | process | Rule #7 deviation: producer and verifier are same model family (Claude). | Flag for human. |

## Recommendation

**PROCEED to Phase 2 with supplementation.** The discovery correctly scopes the area and identifies all major features (12 features covering the rules engine, nomenclature lookup, age limits, session caps, day/week limits, bilan brackets, practitioner lookup, R-waarde stats, notifications, evaluation sessions, parent sitting, and disorder "g"). No entire feature clusters are missing.

However, the Phase 2 spec author MUST:
1. Read `riziv_compliance.md` and `nomenclature_codes.md` directly — do NOT rely on the discovery's HalingoDoc line numbers (they are fabricated).
2. Add the approval state machine, bilan structure, `usedSessions`, session counting math, and cascade promotion to the per-feature specs.
3. Use "Locked-In Syndrome" (§2 g) as the identification for disorder "g", pending code verification against NomenSoft.
4. Consult the `logopedist-be` skill for any RIZIV convention questions — the discovery's domain coverage is thin.
