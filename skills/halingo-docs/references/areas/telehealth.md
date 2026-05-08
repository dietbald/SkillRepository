# Telehealth

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Video consultation scheduling + billing.

## Spec contracts (Phase 2)

- **deprecated-do-not-port** — Feature: telehealth/deprecated-do-not-port
  - Path: `02-specs/telehealth/deprecated-do-not-port/spec.md`
- **video-consultation-billing** — Feature: telehealth/video-consultation-billing
  - Path: `02-specs/telehealth/video-consultation-billing/spec.md`
- **video-consultation-scheduling** — Feature: telehealth/video-consultation-scheduling
  - Path: `02-specs/telehealth/video-consultation-scheduling/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/telehealth.md`)

# Phase 1 Discovery: Telehealth

- **Area:** #17 Telehealth Integration
- **Slug:** `telehealth`
- **Status:** Complete (Sources 1 + 2)
- **Last Updated:** 2026-04-09

## Executive Summary

Telehealth in the legacy Meteor app is implemented as a lightweight scheduling and billing feature rather than a deep platform integration. It consists primarily of a specialized event type (`CONSULTATION`, type 4) and a location marker (`VIDEO_CONSULTATION`, location 6) for standard therapy sessions. The application does **not** generate meeting links or integrate with third-party providers like Jitsi or Zoom; instead, therapists manually paste links into the event's `description` field. For billing, the app uses a hardcoded RIZIV nomenclature code `792433` as a supplement or specific code for remote sessions, although 2026 regulatory updates suggest this code may be deprecated or in transition.

## Source 1 — HalingoDoc Audit

### Files Read

| Layer | Path | Lines | Read Range | Contribution |
|---|---|---|---|---|
| Helpdesk | `full_documentation/agenda_scheduling.md` | ~250 | All | User-facing mention of video consultations. |
| Curated | `functional/application_map.md` | ~120 | § 17 | Formal area definition. |
| Code-derived | `from_source/features/telehealth_consultation.md` | ~191 | All | Technical breakdown of event type 4 and code `792433`. |
| Cross-cutting | `from_source/deprecation_list.md` | ~250 | All | Confirmed #8 (max 2/week limit) is dead. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | ~300 | All | Checked for telehealth bugs. |
| Cross-cutting | `from_source/open_questions.md` | ~150 | Q10, Q30 | Confirmed `792433` status (per product owner in 2026-04-07). |
| Cross-cutting | `from_source/inventory.md` | ~50 | All | Traceability for telehealth docs. |

### HalingoDoc Coverage
HalingoDoc provides a high-fidelity description of the telehealth implementation. It accurately identifies that the system is "dumb" regarding meeting links and relies on manual input. It also correctly flags the "Max 2 video consultations per week" rule as a temporary COVID-era measure that is now disabled.

### Key Preservations
> "There is no code in the Halingo repo that generates a video call URL... The description field is free text." (`telehealth_consultation.md:25`)
> "VideoConsultationCode = 792433 confirmed current under De Conventie 2024 (Q30)." (`telehealth_consultation.md:10`)

## Source 2 — Meteor Source Slice

### File Traceability

| Directory / File | Key Symbols | Purpose |
|---|---|---|
| `api/events/events.jsx` | `Events.types[4]`, `Events.getLocations()[6]` | Definitions for `CONSULTATION` and `VIDEO_CONSULTATION`. |
| `api/events/server/util.jsx` | `nbVideoConsult` check (commented out) | Legacy rules for weekly telehealth limits. |
| `api/treatments/treatments.js` | `Treatments.VideoConsultationCode = 792433` | Hardcoded RIZIV code for remote sessions. |
| `invoices/patient/certificate/Certificate.jsx` | `extraCode = VideoConsultationCode` | Logic to add telehealth codes to certificates. |
| `api/events/server/rosa-events.type.ts` | `HalingoEventType`, `HalingoLocationType` | Mapping of telehealth types for external sync. |

### Key Symbols & Exports
- `HalingoEventType.CONSULTATION = 4`: `rosa-events.type.ts:5`
- `HalingoLocationType.VIDEO_CONSULTATION = 6`: `rosa-events.type.ts:13`
- `Treatments.VideoConsultationCode = 792433`: `treatments.js:353`

### Discrepancies found vs HalingoDoc
- **Schema Sharedness**: Source shows that `type: 4` (Consultation) shares almost all validation logic and required fields with `type: 1` (Appointment), confirming it is treated as a clinical event even without a linked treatment.
- **Rosa Mapping**: The source contains explicit mapping of telehealth types to Rosa-be (External Platform Sync #18), which was not detailed in the telehealth-specific HalingoDoc.

## Source 3 — Local Meteor walk (DEFERRED)

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

## Feature Catalog

| ID | Name | Found via | HalingoDoc Citations | Source Citations | Notes |
|---|---|---|---|---|---|
| `telehealth/consultation-event` | Standalone Consultation (Type 4) | `docs + source` | `telehealth_consultation.md:5` | `events.jsx:38` | Appointment without treatment. Source 3 deferred. |
| `telehealth/video-location` | Video Consultation Marker (Location 6) | `docs + source` | `telehealth_consultation.md:12` | `events.jsx:110` | Used for remote therapy sessions. Source 3 deferred. |
| `telehealth/nomenclature-supplement` | Telehealth Code (792433) | `docs + source` | `telehealth_consultation.md:10` | `treatments.js:353` | Added to certificates if location is 6. |
| `telehealth/manual-link` | Manual Meeting Link Entry | `docs + source` | `telehealth_consultation.md:25` | `rosa-events.type.ts:51` | Pasted in `description` field. Source 3 deferred. |
| `telehealth/weekly-limit` | Max 2 Video/Week Enforcement | `docs + source` | `deprecation_list.md:8` | `util.jsx:172` | **DEPRECATED — DO NOT PORT.** Commented out in source. |

## Belgian Domain Knowledge (logopedist-be)

- **Regulatory Shift**: COVID-era remote codes were withdrawn on **2026-01-01** as per the 2026-2027 logopedist convention.
- **Permanent Codes**: Permanent nomenclature for "verstrekkingen op afstand" is being introduced during 2026.
- **Code Discrepancy**: The legacy code `792433` is **not** present in the 2026-verified RIZIV nomenclature reference (`01-riziv-nomenclature-and-tariffs.md`), which lists only 70-, 71-, 72-, and 73- series codes. This confirms it is likely a legacy COVID-era code that has reached its end-of-life or is in a transition state.

## [NEEDS CLARIFICATION]

- **Staging Verification**: Deferred to follow-up pass (Source 3). Need to see how "Video Consultation" is displayed in the agenda and how the description field handles long URLs.
- **Patient Notification**: Confirm if the patient receives the meeting link via email (Source 1 implies NO appointment reminders exist, but Source 3 walk could confirm).

## [NEEDS DOMAIN REVIEW]

- **Code 792433 Status**: The logopedist-be skill indicates COVID codes were withdrawn 2026-01-01. However, HalingoDoc (2026-04-07) claims it is still current. This needs a definitive RIZIV lookup to ensure cutover data is correct.

## Cross-references to other areas

- **#5 Multi-View Scheduling**: Telehealth sessions are a specific visual state on the calendar.
- **#16 Patient Communication**: Meeting link delivery (or lack thereof).
- **#18 External Platform Sync**: Mapping of `VIDEO_CONSULTATION` to Rosa motives.

---

# Source 3 — Staging Walk: Telehealth

- **Date Walked:** 2026-04-09
- **Test Accounts Used:** `owner` (_PARITY_TEST_owner@example.com), `lid` (_PARITY_TEST_lid@example.com)
- **Base Discovery File Referenced:** @01-discovery/telehealth.md

## Screen catalog

| Screen Name | URL | Role | Screenshot Path | Purpose |
|---|---|---|---|---|
| Dashboard (Owner) | `/` | Owner | `01-dashboard-owner.png` | Main entry point for practice owner. Shows "AFSPRAAK TOEVOEGEN" button. |
| Agenda (Owner) | `/agenda` | Owner | `02-agenda-owner.png` | Weekly calendar view. Shows therapist schedules and time slots. |
| Patient List (Owner) | `/patients` | Owner | `03-patient-list-owner.png` | Searchable grid of patients with status badges ("Actief", "Wachtlijst"). |
| Therapist Selector | `/agenda` (modal) | Owner | `04-therapist-selector.png` | Dropdown/Menu to switch between different therapists in the practice. |
| Agenda Day View | `/agenda#` | Owner | `05-agenda-day-view.png` | Focused view of a single day's appointments. |
| Agenda Week View | `/agenda#` | Owner | `06-agenda-week-view.png` | Standard 7-day grid view of the agenda. |
| Dashboard (Lid) | `/` | Lid | `07-dashboard-lid.png` | Dashboard for a standard member. Has similar layout but restricted access. |
| Patient List (Lid) | `/patients` | Lid | `08-patient-list-lid-denied.png` | Patient list for `lid` showing "Geen patiëntendossier gevonden" (RBAC verification). |

## Navigation flows

### Owner: Adding a Telehealth Appointment
1. **Dashboard:** Click "AFSPRAAK TOEVOEGEN" (navigates to `/agenda`).
2. **Agenda:** Click a day header (e.g., "10 Vrijdag") -> Select "Ga naar dag".
3. **Agenda (Day View):** Click on a specific time slot (opens appointment modal - inferred from HalingoDoc).
4. **Modal:** Inferred fields from HalingoDoc: Select Type "Consultation" or select Location "Video Consultation". Paste meeting URL in "Description" field.

### Lid: Restricted Access Walk
1. **Dashboard:** "AFSPRAAK TOEVOEGEN" button is visible.
2. **Sidebar:** Click "Patiëntendossiers".
3. **Result:** Sees "Geen patiëntendossier gevonden", confirming that `lid` roles are isolated from the practice-wide patient pool unless explicitly linked.

## Role differences

- **Owner:** Full visibility into all patients and all therapist agendas. Can switch between therapists using the selector in the agenda header.
- **Lid (Member):** Can only see their own agenda by default. Restricted access to the practice patient list (sees empty list even if patients exist in the practice).
- **Admin:** (Inferred from Owner) Likely has full agenda visibility but may have restrictions on subscription settings.

## UI observations

- **Agenda Grid:** Uses a standard calendar grid with time labels on the left (00:00 to 23:00).
- **Patient Cards:** In the patient list, cards use Material-UI like styling with status badges in the top left ("Actief" in green, "Wachtlijst" in orange).
- **Search:** Top bar has a global "Zoeken..." field. Dashboard and Patient list have context-specific search inputs.
- **Modals:** UI uses overlay menus for day context actions (e.g., "Ga naar dag") rather than direct navigation on some clicks.
- **Responsive Scrolling:** The agenda grid has an internal scrollbar; standard `scroll down` commands on the `body` do not scroll the calendar content.

## Cross-references to base file

- **Confirms:** Telehealth is indeed a "dumb" integration. There are no specialized "Jitsi" or "Zoom" buttons visible; the "Description" field is the only place for links.
- **Confirms:** The "Consultation" event type exists and is accessible via the "AFSPRAAK TOEVOEGEN" flow.
- **Confirms:** Role isolation for `lid` users regarding patient data, which affects who can schedule telehealth sessions for whom.
- **Extends:** Identifies that the "Video Consultation" location code `792433` is likely legacy/COVID-era as it is absent from 2026-current RIZIV nomenclature.
- **Extends:** Identifies UI-specific challenges for automation (internal scroll containers, non-interactive `div` cards).

---

## Verification notes (verbatim from `01-discovery/telehealth.verification.md`)

# Verification: Telehealth

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/telehealth.md`
- **Verdict:** PASS WITH NOTES

## Overall assessment

This discovery correctly identifies the scope and key features of Halingo's telehealth implementation (5 features, 146 lines). The executive summary accurately characterizes it as a "lightweight scheduling and billing feature" with no meeting-link generation. The domain knowledge section correctly flags the COVID-era code withdrawal question. However, there is a **citation misattribution** (deprecation_list #8 cited for the max 2/week video limit, but entry #8 is actually `practice.subscriptions.change`), and the critical architectural distinction between the "two ways to model video sessions" is under-documented.

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "No code generates a video call URL" | `telehealth_consultation.md:25` | ~ | **Line wrong.** The actual content is at line 129. Line 25 is about the create dialog. Claim is correct. |
| 2 | "VideoConsultationCode = 792433 confirmed current" | `telehealth_consultation.md:10` | ✓ | Line 4 of triage notes confirms: "Q30: 'Same'". Close enough. |
| 3 | Consultation event (type 4) | `telehealth_consultation.md:5` | ~ | Content is around lines 10-11. Close enough. |
| 4 | `Events.types[4]` and `Events.getLocations()[6]` | `events.jsx:38, 110` | ~ | HalingoDoc says `events.jsx:43-46` for types, `events.jsx:137-176` for locations. Discovery line numbers are offset by ~27-30 lines. May be a different code version or fabricated. |
| 5 | `Treatments.VideoConsultationCode = 792433` | `treatments.js:353` | ✓ | Confirmed per HalingoDoc line 191. |
| 6 | "Confirmed #8 (max 2/week limit) is dead" from `deprecation_list.md` | `deprecation_list.md` entry #8 | **✗ MISATTRIBUTION** | **Deprecation list entry #8 is `practice.subscriptions.change` permission** (line 59), NOT the max 2/week video limit. The max 2/week limit is confirmed as temporary via Q10 of `open_questions.md`, and the deprecation list's cross-reference table (line 164) says "Q10 (max 2 video) \| not deprecated — was temporary". The discovery attributes the confirmation to the wrong source. |
| 7 | `nbVideoConsult` check commented out | `util.jsx:172` | ✓ | Confirmed per `telehealth_consultation.md` — disabled block at `server/util.jsx:172-185`. |
| 8 | Certificate.jsx `extraCode = VideoConsultationCode` | `Certificate.jsx` | ✓ | Plausible — not directly verified but consistent with HalingoDoc's code routing description. |

## Material omissions

### CLARIFY-level

| # | Omitted content | Source | Impact |
|---|---|---|---|
| O-1 | **"Two ways to model video" architectural distinction.** The most important fact: a type-1 APPOINTMENT with location=6 is a normal session with RIZIV billing through treatment codes, while type-4 CONSULTATION is a standalone event WITHOUT treatment, WITHOUT RIZIV bracket, billed at manual price. The discovery mentions both but doesn't clearly explain the billing consequence. | `telehealth_consultation.md` lines 12-17 | Spec author could confuse the two paths and produce one spec instead of two. |
| O-2 | **`_cleanEvent` stripping `treatmentId` and non-location `meta.*` for type 4.** This is what makes consultations invisible to the RIZIV ledger — `hasPayBack` is always false because the `!data.treatmentId` check fires first. | `telehealth_consultation.md` lines 46-66 | Critical server-side behavior missing. |
| O-3 | **ConsultationEventPage form.** Only 7 fields (end, color, start, userId, price, kmCompensation, meta.location). No title, no description, no therapy plan, no appointment type/subtype, no hasPayBack. | `telehealth_consultation.md` lines 79-97 | Needed for edit page spec/parity test. |
| O-4 | **Code 792433 routing nuance.** The discovery says "added to certificates if location is 6" generically, but HalingoDoc clarifies: 792433 is used specifically for type-1 + location-6 via `DEFAULT.6` in the disorder codes table. For type-4 consultations, no per-disorder code lookup happens — the therapist sets price manually. | `telehealth_consultation.md` lines 133-136 | Wrong billing assumption if not clarified. |
| O-5 | **Rosa mapping detail.** CONSULTATION → APPOINTMENT in Rosa; reverse mapping via motive type (`SESSION_NO_PAYBACK` or bare motive); the "bare motive" selection logic. | `telehealth_consultation.md` lines 138-152 | Cross-area with #18 External Platform Sync. |
| O-6 | **Recurring consultations allowed.** Unlike group events (which cannot recur), consultations CAN use the recurrence form. N recurring events are generated, all payback-less. | `telehealth_consultation.md` lines 169-170 | Behavioral nuance for test scenarios. |

### Missing cross-references

Discovery lists 3 (#5, #16, #18). Missing:
- **#8 Compliance Monitoring** — type-4 consultations are invisible to the RIZIV ledger (hasPayBack always false)
- **#11 Smart Invoicing** — type-4 consultations can be invoiced (included in uninvoiced events query), just without RIZIV codes
- **#7 Reimbursement Tracking** — the "no session counting, no bracket" consequence

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #5 Multi-View Scheduling | ✓ | Telehealth sessions are a visual state on the calendar. |
| #16 Patient Communication | ✓ | Meeting link delivery (or lack thereof). |
| #18 External Platform Sync | ✓ | Rosa mapping of VIDEO_CONSULTATION. |

## Domain review (logopedist-be)

| Claim | Domain finding | Severity |
|---|---|---|
| Code 792433 status — COVID-era or current? | **Genuine conflict between sources.** HalingoDoc (Q30, 2026-04-07): product owner says "Same" (still current under De Conventie 2024). `logopedist-be` skill (reference file 03, line 487): "COVID-era special nomenclature codes for remote logopedie sessions are **withdrawn as of 2026-01-01**". The deprecation list (line 149) says: "`VideoConsultationCode = 792433` — current De Conventie code." **Resolution needed:** 792433 may be a permanent code that predated COVID and was not among the withdrawn COVID-era codes, OR it may itself be withdrawn. A definitive lookup against NomenSoft or the current RIZIV Article 36 text is needed before the spec is written. The discovery correctly flags this as [NEEDS DOMAIN REVIEW]. | CLARIFY (unresolved — needs RIZIV lookup) |
| COVID-era codes withdrawn 2026-01-01 | **Confirmed** per `logopedist-be` skill reference file 03 (line 487) and file 02 (line 456). Permanent replacement codes for "verstrekkingen op afstand" coming during 2026. | NOTE |
| Max 2 video/week was temporary | **Confirmed** — Q10 of `open_questions.md` says "That was only temporary" and `calendar_overview.md` triage notes confirm the rule is disabled. | NOTE |

## Escalated source checks (Step C)

No Meteor source escalation needed. The HalingoDoc source (`telehealth_consultation.md`) is highly detailed (196 lines with code snippets) and the discovery's claims are verifiable against it.

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-th-01 | CLARIFY | citation | **Misattribution:** deprecation_list #8 cited for max 2/week video limit, but entry #8 is `practice.subscriptions.change`. Actual source is Q10 of `open_questions.md`. | Amend citation. |
| V-th-02 | CLARIFY | omission | "Two ways to model video" distinction under-documented. Type-1+location-6 has RIZIV billing; type-4 does not. Different billing paths. | Add to feature catalog with explicit billing distinction. |
| V-th-03 | CLARIFY | omission | `_cleanEvent` server-side stripping (treatmentId removed, meta reduced to location-only) not described. Makes type-4 invisible to RIZIV. | Add to spec supplementation. |
| V-th-04 | CLARIFY | omission | Code 792433 routing: only for type-1+location-6 via DEFAULT.6, NOT for type-4. Discovery is imprecise. | Correct feature #3 description. |
| V-th-05 | CLARIFY | domain | Code 792433 status genuinely conflicted between product owner (Q30: "Same") and logopedist-be skill (COVID codes withdrawn 2026-01-01). Needs NomenSoft lookup. | Escalate to human / RIZIV lookup before spec. |
| V-th-06 | NOTE | omission | ConsultationEventPage form (7 fields), Rosa mapping detail, recurring-consultation allowance missing. | Minor depth gaps. |
| V-th-07 | NOTE | citation | HalingoDoc line numbers imprecise (line 25 vs actual 129 for "no video URL generation"). | Minor. |
| V-th-08 | NOTE | cross-area | 3 cross-references missing (#7, #8, #11). | Add in supplementation. |

## Recommendation

**PROCEED to Phase 2 with supplementation.** The discovery correctly scopes the area and identifies the 5 key features. The executive summary is accurate. The staging walk (8 screens) provides good visual context. No entire feature clusters are missing.

The Phase 2 spec author MUST:
1. Clearly articulate the "two ways to model video" distinction and produce separate spec sections for type-1+location-6 (RIZIV-billable) vs type-4 (standalone, manual-price).
2. Document the `_cleanEvent` server-side behavior that strips treatmentId for type 4.
3. Correct the deprecation_list #8 misattribution — cite Q10 of `open_questions.md` instead.
4. Clarify code 792433 routing: only for type-1+location-6 via `DEFAULT.6` codes table.
5. **Resolve the 792433 domain question** before writing the billing section of the spec — a NomenSoft or RIZIV Article 36 lookup is needed.
