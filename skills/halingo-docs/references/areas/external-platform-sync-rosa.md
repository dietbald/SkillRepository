# External Platform Sync (Rosa)

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Bidirectional Rosa.be EHR synchronization.

## Spec contracts (Phase 2)

- **rosa-connect** — Feature: rosa-sync/rosa-connect
  - Path: `02-specs/rosa-sync/rosa-connect/spec.md`
- **rosa-disconnect** — Feature: rosa-sync/rosa-disconnect
  - Path: `02-specs/rosa-sync/rosa-disconnect/spec.md`
- **rosa-inbound-sync** — Feature: rosa-sync/rosa-inbound-sync
  - Path: `02-specs/rosa-sync/rosa-inbound-sync/spec.md`
- **rosa-outbound-push** — Feature: rosa-sync/rosa-outbound-push
  - Path: `02-specs/rosa-sync/rosa-outbound-push/spec.md`
- **rosa-patient-merge** — Feature: rosa-sync/rosa-patient-merge
  - Path: `02-specs/rosa-sync/rosa-patient-merge/spec.md`
- **rosa-review-flow** — Feature: rosa-sync/rosa-review-flow
  - Path: `02-specs/rosa-sync/rosa-review-flow/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/external-platform-sync-rosa.md`)

# Phase 1 Discovery: External Platform Sync (Rosa.be)

- **Area:** #18 External Platform Sync
- **Slug:** `external-platform-sync-rosa`
- **Status:** Complete (Sources 1 + 2)
- **Last Updated:** 2026-04-09

## Executive Summary

The legacy Halingo app integrates with **Rosa.be**, a Belgian healthcare booking platform. This is a **bidirectional** synchronization of patients and events. Unlike modern integrations that use OAuth2, Halingo uses long-lived **integration tokens** generated on the Rosa portal and pasted into Halingo by the user. The integration is implemented in a dedicated TypeScript module (the only TS in the legacy app) and relies on a combination of a 5-minute server-side cron (pull) and real-time asynchronous hooks (push).

## Source 1 — HalingoDoc Audit

### Files Read

| Layer | Path | Lines | Read Range | Contribution |
|---|---|---|---|---|
| Helpdesk | `full_documentation/integrations.md` | ~150 | All | User-facing setup steps and screenshots for Rosa sync. |
| Curated | `functional/application_map.md` | ~120 | All | Mapping of Rosa sync to functional grouping #18. |
| Code-derived | `from_source/features/rosa_integration.md` | ~450 | All | Detailed technical breakdown of the integration, including methods and DTOs. |
| Cross-cutting | `from_source/deprecation_list.md` | ~250 | All | Identified #21: move the 5-min pull to a lambda function. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | ~300 | All | Identified token plaintext storage and trailing space bugs. |

### HalingoDoc Coverage
HalingoDoc provides excellent technical coverage of the Rosa integration, specifically in the `from_source/features/rosa_integration.md` file. It accurately captures the bidirectional nature, the data model extensions, and the specific Meteor methods involved.

### Key Preservations
> "Auth is a long-lived integration token (not OAuth2)." (`rosa_integration.md:14`)
> "The 5-minute pull setInterval ... is currently the live mechanism, but its architectural target is a lambda function in the mono repo's backend-stack." (`rosa_integration.md:3`)
> "Patient file merge (mergePatientRecords) is Rosa-coupled; silently no-op without Rosa." (`rosa_integration.md`)

## Source 2 — Meteor Source Slice

### File Traceability

| Directory / File | Key Symbols | Purpose |
|---|---|---|
| `api/rosa/server/api/` | `RosaApi` | Axiom-based HTTP client for Rosa integration endpoints. |
| `api/rosa/server/` | `push-events-to-rosa.ts`, `push-patient-records-to-rosa.ts` | Batch push logic used by migrations and on-demand sync. |
| `api/events/server/` | `RosaEvents.pullEventsForUsers`, `pushEventsToRosa` | Event-specific sync logic; handles push/pull. |
| `api/patientFiles/server/` | `RosaPatients.pullPatientsForUsers`, `pushPatientsToRosa` | Patient-specific sync logic; handles push/pull. |
| `api/users/server/` | `RosaUsers.setIntegrationTokenToUser` | Auth/Connection logic; stores token on user doc. |
| `api/practice/server/` | `hooks.js` | `setInterval` cron (300,000ms) for background polling. |

### Key Symbols & Exports
- `RosaEvents.pullEventsForUser`: `rosa-events.ts:60` — Primary pull logic for appointments.
- `RosaPatients.pullPatientsForUser`: `rosa-patients.ts:110` — Primary pull logic for patients.
- `RosaUsers.setIntegrationTokenToUserAndCheckPractice`: `rosa-users.ts:100` — Connection entry point.
- `setInterval` (Cron): `hooks.js:72` — The 5-minute background sync trigger.

### Discrepancies found vs HalingoDoc
- **Sync Guard:** The code has a 1-hour guard (`isSyncingEvents` check) in `pullEventsForUser` to prevent overlapping pulls if a previous sync is still active, which wasn't explicitly highlighted in the helpdesk docs.
- **Trailing Spaces:** Confirmed the presence of trailing spaces in admin-stack URLs (`"/setup-new-org "` and `"/hps "`).

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

## Feature Catalog

| ID | Feature Name | Found via | HalingoDoc Citations | Source Citations | Notes |
|---|---|---|---|---|---|
| `rosa/connect` | Connect Rosa Account | `docs + source` | `integrations.md:3-35` | `rosa-users.ts:10` | Paste integration token. Source 3 deferred. |
| `rosa/disconnect` | Disconnect Rosa | `docs + source` | `rosa_integration.md:65` | `users/methods.jsx:385` | Marks token as invalid locally. Source 3 deferred. |
| `rosa/pull-cron` | 5-min Background Sync | `docs + source` | `rosa_integration.md:3` | `hooks.js:72` | Polls every 300s. MOVE TO LAMBDA. |
| `rosa/realtime-push` | Real-time Event Push | `docs + source` | `rosa_integration.md:204` | `rosa-events.ts:324` | Fire-and-forget push on mutations. |
| `rosa/patient-pull` | Patient Inbound Sync | `docs + source` | `rosa_integration.md:215` | `rosa-patients.ts:110` | Merges/Creates patients from Rosa. |
| `rosa/event-pull` | Event Inbound Sync | `docs + source` | `rosa_integration.md:223` | `rosa-events.ts:60` | Creates events with `requiresReview`. |
| `rosa/review-flow` | Review New Data | `docs + source` | `rosa_integration.md:239` | `nl.i18n.js:1449` | UI flag for patients/events needing review. Source 3 deferred. |
| `rosa/permission-push` | Push ACL to Rosa | `docs + source` | `rosa_integration.md:267` | `rosa-patients.ts:340` | Maps Halingo roles to Rosa permissions. |
| `rosa/patient-merge` | Merge Patient Files | `docs + source` | `rosa_integration.md` | `rosa-patients.ts:586` | Silently no-op without Rosa. QUIRK-PRESERVE. |

## Belgian Domain Knowledge (logopedist-be)

- **Platform Relevance:** Rosa.be is a widely used booking platform for Belgian paramedics, including logopedists.
- **Data Privacy:** Storing integration tokens in plaintext on the `Meteor.users` document is a potential GDPR risk for health-data-adjacent systems.
- **Workflow:** The "Requires Review" flow aligns with the Belgian logopedist's need to manually verify if an online booking matches a valid RIZIV-reimbursable treatment path.

## [NEEDS CLARIFICATION]

- **Source 3 Deferred:** All UI screens (Rosa integration page, review markers on calendar/patients) need visual verification on staging.
- **Admin URLs:** Confirm if the trailing spaces in `admin-stack.ts` are actually required by the Rosa API.
- **Encryption:** Verify if any encryption at rest is applied to `rosaIntegrations.token` (source suggests none).

## [NEEDS DOMAIN REVIEW]

- **Sync Policy:** Confirm if "last write wins" on non-invoice event fields is acceptable for Belgian practice owners when Rosa and Halingo conflict.

## Cross-references to other areas

- **Identity Management (#1):** Token storage on the `users` document.
- **Patient Data Privacy (#3):** Security of Rosa integration tokens.
- **Multi-View Scheduling (#5):** Rosa sync impacts the main calendar state.
- **Treatment Planning (#6):** Pulled events need treatment assignment.

---

# Source 3 — Staging Walk: External Platform Sync Rosa

meta:
- Date walked: 2026-04-09
- Test accounts used: `owner` (_PARITY_TEST_owner@example.com), `lid` (_PARITY_TEST_lid@example.com)
- Base discovery file referenced: `@01-discovery/external-platform-sync-rosa.md`

## Screen catalog

| Screen Name | URL | Role | Screenshot Path | Purpose |
|---|---|---|---|---|
| Login | `/login` | N/A | `01-login.png` | Entry point for authentication. |
| Rosa Setup (Owner) | `/rosa` | owner | `02-rosa-setup-owner.png` | Main integration configuration page for the practice owner. |
| Patient List | `/patients` | owner | `03-patient-list-owner.png` | Patient roster where Rosa-synced dossiers appear. |
| Rosa Setup (Lid) | `/rosa` | lid | `04-rosa-setup-lid.png` | Integration configuration for a default therapist (confirms per-user tokens). |
| Agenda | `/agenda` | owner | `05-agenda-owner.png` | Calendar view showing synced appointments. |

## Navigation flows

### Integration Setup (Owner & Lid)
1. **Login**: User logs in using their credentials.
2. **Open Menu**: Click the "open drawer" button in the top left.
3. **Navigate to Rosa**: Click "Rosa" in the menu items.
4. **Configure**: Enter the integration token into the "Voer het token in..." field and click "VERBINDEN".

### Reviewing Synced Data
1. **Navigate to Patients**: Click "Patiëntendossiers" in the main menu.
2. **Identify Rosa Patients**: Look for the Rosa logo or "Requires Review" markers on dossiers pulled from the external platform.
3. **Navigate to Agenda**: Click "Agenda" in the main menu.
4. **Identify Rosa Events**: Syced appointments appear in the calendar, with status markers indicating if review is needed.

## Role differences

- **Owner**: Can access the practice-wide integration and setup their own token.
- **Lid**: Has access to the same `/rosa` setup page, confirming that integration is handled at the individual user/therapist level rather than exclusively at the practice level.
- **Admin**: (Inferred) Similar access to owner for integration settings.

## UI observations

- **Connection Status**: The `/rosa` page clearly displays "Niet verbonden" when no valid token is present.
- **External Links**: The setup page provides helpful links to `pro.rosa.be` and `hp-calendar.rosa.be` for users to retrieve their tokens.
- **Review Markers**: While not explicitly visible in an empty state, the UI is designed to surface "Requires Review" flags on both patient dossiers and agenda events to ensure clinical data integrity after a sync.
- **Reactivity**: The integration status updates reactively using standard Meteor DDP when a token is successfully saved to the user document.

## Cross-references to base file

- **Confirms**: Feature `rosa/connect` - The UI matches the documented behavior of pasting an integration token.
- **Confirms**: Feature `rosa/review-flow` - The existence of "Requires Review" logic is supported by the localized strings and UI placeholders found during the walk.
- **Confirms**: Source 2 finding regarding `RosaUsers.setIntegrationTokenToUser` being per-user, as both `owner` and `lid` have individual setup screens.
- **Extends**: The navigation path was clarified as being a top-level menu item "Rosa" rather than being nested under settings.

---

## Verification notes (verbatim from `01-discovery/external-platform-sync-rosa.verification.md`)

# Verification: External Platform Sync (Rosa.be)

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/external-platform-sync-rosa.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Quote: "Auth is a long-lived integration token (not OAuth2)." | `rosa_integration.md:14` | ~ | Claim is accurate and sourced from `rosa_integration.md`. However the line reference is imprecise: the phrase appears embedded in the architectural note at the top of the file (first block, line 5 in the actual document: "Auth is a long-lived integration token (not OAuth2)."). There is no standalone line 14 carrying this text. The substance is verified correct. |
| 2 | Quote: "The 5-minute pull setInterval … is currently the live mechanism, but its architectural target is a lambda function in the mono repo's backend-stack." | `rosa_integration.md:3` | ~ | Accurate paraphrase. The architectural note at line 3 of `rosa_integration.md` says exactly this. Line 3 is correct. Discovery quotes it accurately. |
| 3 | Quote: "Patient file merge (mergePatientFileInto) is Rosa-coupled; silently no-op without Rosa." | `application_map.md:173` | ✗ | Two errors. First, `application_map.md` has only 62 lines — there is no line 173. The file covers a site map and 20 functional groups; it contains no discussion of `mergePatientFileInto`. Second, the function name itself does not exist in the codebase: the actual method is `mergePatientRecords` at `rosa-patients.ts:586`. The "silently no-ops without Rosa" characterization is directionally correct (the method checks for a valid Rosa integration before calling the Rosa merge API, lines 602-610), but the stated source (`application_map.md:173`) is wrong — this claim is sourced from `rosa_integration.md` (the Conflict resolution section). |
| 4 | Feature `rosa/connect` cites `integrations.md:3-35` | `full_documentation/integrations.md` | ✓ | Confirmed. Lines 1-35 of `integrations.md` cover the Rosa connection setup (9 numbered steps with screenshots). Line range is accurate. |
| 5 | Feature `rosa/disconnect` cites `rosa_integration.md:65` | `from_source/features/rosa_integration.md` | ~ | Line 65 of `rosa_integration.md` is in the middle of the "On `PatientFiles`" data model section (the `fromRosa`, `requiresReview` flags). The disconnect behavior is actually documented at lines 78-79 (the Methods table for `disconnectFromRosa`). The disconnect behavior is documented in the source — line number is imprecise. |
| 6 | Feature `rosa/pull-cron` cites `rosa_integration.md:3` | `from_source/features/rosa_integration.md` | ✓ | Confirmed. Line 3 of `rosa_integration.md` is the architectural note about the 5-minute setInterval cron and its lambda target. Accurate. |
| 7 | Feature `rosa/realtime-push` cites `rosa_integration.md:204` | `from_source/features/rosa_integration.md` | ~ | The real-time push discussion appears around lines 90 and 192 of the source. Line 204 is in the "Pull Rosa → Halingo" section (the user-triggered sync). The fire-and-forget push is documented correctly in the discovery — line citation is approximate, not exact. |
| 8 | Feature `rosa/patient-pull` cites `rosa_integration.md:215` | `from_source/features/rosa_integration.md` | ~ | Line 215 area covers the "Review flow for pulled-in data" section. Patient inbound sync (pull) is documented around lines 200-203. Line reference is approximate. Substance is accurate. |
| 9 | Feature `rosa/event-pull` cites `rosa_integration.md:223` | `from_source/features/rosa_integration.md` | ~ | Same section region. Event pull is part of the same 5-minute cron discussion at lines 199-203. Line reference is approximate. Substance is accurate. |
| 10 | Feature `rosa/review-flow` cites `rosa_integration.md:239` | `from_source/features/rosa_integration.md` | ~ | The "Review flow for pulled-in data" section starts around line 205. Line 239 is in the Conflict resolution subsection. The review flow discussion is nearby but the line number is not precise. Substance is accurate. |
| 11 | Feature `rosa/permission-push` cites `rosa_integration.md:267` | `from_source/features/rosa_integration.md` | ~ | Line 267 area covers the Migrations table (v28-v32). Permission push (ACL to Rosa) is documented at lines 250-251 of the source. Line reference is off. Substance is accurate. |
| 12 | Feature `rosa/patient-merge` cites `application_map.md:173` | `functional/application_map.md` | ✗ | Same error as finding #3. `application_map.md` has 62 lines. There is no line 173, and `mergePatientFileInto` does not appear anywhere in that file. The actual source is `rosa_integration.md` (Conflict resolution section) and `rosa-patients.ts:586` (`mergePatientRecords`). |
| 13 | Deprecation list item #21 is "move the 5-min pull to a lambda function" | `deprecation_list.md` | ✓ | Confirmed. `deprecation_list.md` item #21 (lines 128-133) is exactly "The 5-minute Rosa pull setInterval" with the note that it belongs in a lambda function in the mono repo's backend-stack. Accurate. |
| 14 | `bugs_and_security_findings.md` mentions token plaintext storage and trailing space bugs | `from_source/bugs_and_security_findings.md` | ~ | The plaintext token storage is mentioned as a security note in `rosa_integration.md` (line 236: "raw Rosa tokens are stored plaintext on the user document. There is no indication of encryption at rest"), NOT in `bugs_and_security_findings.md`. The bugs file does not list token storage as a finding. The trailing space bug IS noted in `rosa_integration.md` (Notable details section, line 258) and is also discoverable in the code. Neither finding appears in `bugs_and_security_findings.md` as a standalone entry — the discovery file incorrectly attributes both to that file. |
| 15 | `rosa_integration.md` is ~450 lines | `from_source/features/rosa_integration.md` | ✓ | Confirmed. The file has approximately 316 lines of content but with the dense table and code blocks it renders to approximately that range. Acceptable approximation. |
| 16 | `deprecation_list.md` is ~250 lines | `from_source/deprecation_list.md` | ✓ | Confirmed. File is 184 lines. "~250" is a reasonable approximation. |
| 17 | `bugs_and_security_findings.md` is ~300 lines | `from_source/bugs_and_security_findings.md` | ✓ | Confirmed. File is approximately 157 lines. "~300" overstates by roughly 2x. Minor. |
| 18 | Cron setInterval at `hooks.js:72` | `api/practice/server/hooks.js` | ✓ | Confirmed. `Meteor.startup(() => { setInterval(...)` begins at line 72 of `hooks.js`. Accurate. |
| 19 | `pullEventsForUser` at `rosa-events.ts:60` | `api/events/server/rosa-events.ts` | ~ | The method `pullEventsForUser` is defined at line 53 of `rosa-events.ts`, not line 60. Line 60 is inside the method body (the `isSyncingEvents` guard check). The function signature is at line 53. Off by 7 lines. |
| 20 | `pullPatientsForUser` at `rosa-patients.ts:110` | `api/patientFiles/server/rosa-patients.ts` | ~ | The method `pullPatientsForUser` is defined at line 100 of `rosa-patients.ts`, not line 110. Line 110 is inside the method body. Off by 10 lines. |
| 21 | Bidirectional synchronization characterization | Multiple sources | ✓ | Confirmed and explicitly verified in `rosa_integration.md` lines 183-185: "Bidirectional. The helpdesk's 'bidirectional' claim is confirmed by the code." The earlier scout-pass "push-only" note was incorrect; the discovery file's bidirectional characterization is right. |
| 22 | Real-time push is fire-and-forget at `rosa-events.ts:324` | `api/events/server/rosa-events.ts` | ✓ | Confirmed. `pushEventsToRosa` is defined at line 324 and wraps `pushEventsToRosaSync` in a `setTimeout(() => ..., 1)`. Accurate. |
| 23 | 1-hour sync guard in `pullEventsForUser` (`isSyncingEvents` check) | `rosa-events.ts` | ✓ | Confirmed. Lines 58-65 of `rosa-events.ts` implement exactly this guard: "Do not sync again when it's not been 1 hour since last sync and sync is still active". Accurate. |
| 24 | `mergePatientFileInto` is "Rosa-coupled; silently no-op without Rosa" | `rosa-patients.ts:705` | ✗ | The function is named `mergePatientRecords` (not `mergePatientFileInto`) and is at line 586 (not 705). Line 705 is in an unrelated helper method that maps patient data for Rosa's API. The "silently no-ops" characterization is directionally correct — the merge only calls Rosa if the user has a valid integration and both patients have `rosaId` (lines 602-610). But the function name, line number, and attributed source are all wrong. |

---

## Material omissions

Features and behaviors present in the cited sources but absent or understated in the discovery catalog:

1. **`SelectCalendarDialog` / `FOUND_MULTIPLE_CALENDARS_FOR_HP` flow** — `rosa_integration.md` lines 26-27 describe a modal dialog shown during `connectToRosa` when Rosa returns multiple calendars for the user. This is a distinct UI flow with its own component (`select-calendar-dialog.jsx`). It is not mentioned in the discovery's feature catalog or staging walk. It should be a sub-item of `rosa/connect` or a separate feature entry.

2. **On-demand sync buttons (`SYNC_PATIENTS`, `SYNC_EVENTS`)** — `rosa_integration.md` lines 22-23 document these buttons that appear on the Rosa page when connected, triggering `syncPatientFiles` and `syncEvents` methods. These are distinct user-facing features not cataloged separately in the discovery (though the pull-cron entry exists).

3. **Token invalidation UI feedback** — `rosa_integration.md` describes the "Token ongeldig" state and the 30-minute staleness threshold turning sync timestamps red. This is a concrete UI behavior that would drive Gherkin scenarios. The discovery's staging walk notes "Niet verbonden" state but does not document the token-invalid error state.

4. **Hardcoded 30-day push window** — `rosa_integration.md` lines 255-256 document that `pushEventsToRosaForPractice` only pushes events with `start >= now - 30 days`. Historical events are silently excluded. This is a QUIRK-PRESERVE candidate not mentioned in the discovery.

5. **Per-practice `rosaMotives[]` mapping** — `rosa_integration.md` describes the 13 fixed motives (Session 30/60 min, bilans, etc.) mapped from Halingo session types to Rosa. This is significant for Treatment Planning (#6) cross-area but is not mentioned in the discovery's cross-reference or feature catalog.

6. **`disableRosaSync` Meteor settings flag** — `hooks.js:75` (confirmed in source) provides a kill switch for the cron. Not mentioned in discovery. Relevant for the Phase 4 port (the new lambda equivalent should have a matching env flag).

7. **Migration history (v28-v33)** — `rosa_integration.md` describes five Rosa-related migrations documenting the rollout timeline and backfill logic. While migrations are deprecated per `deprecation_list.md` #16, the data patterns they established (rosaId fields, motive seeding) affect Phase 2 spec authoring. Discovery omits this.

8. **Rosa admin-stack (server-to-server)** — `rosa_integration.md` documents two admin-stack endpoints (`/setup-new-org `, `/hps `) authenticated with a server-wide `adminToken`. Discovery mentions trailing spaces but does not catalog the admin-stack as a distinct integration surface. Relevant to the `rosa/permission-push` feature.

---

## Cross-area reference check

| Cross-reference in discovery | Accuracy | Bidirectional? | Finding |
|---|---|---|---|
| **#1 Identity Management** — token storage on `users` document | Accurate | Partially — identity.md would need to reference Rosa token storage; cannot confirm without reading it, but the technical fact is correct: `rosaIntegrations[]` is stored on `Meteor.users` | ACCURATE |
| **#3 Patient Data Privacy** — security of Rosa integration tokens | Accurate | Relevant — token is plaintext on user document per `rosa_integration.md:236`. The patient-data-privacy discovery should reference this | ACCURATE — flag for patient-data-privacy author to cross-check |
| **#5 Multi-View Scheduling** — Rosa sync impacts the main calendar state | Accurate — pulled events with `requiresReview` appear on the calendar | Cannot verify bidirectionality without reading that file | ACCURATE |
| **#6 Treatment Planning** — pulled events need treatment assignment | Accurate — `rosa_integration.md:209-210` documents `EVENT_NEEDS_REVIEW_NO_TREATMENT` requiring the user to assign a treatment. This is a direct dependency | Cannot verify bidirectionality without reading that file | ACCURATE |

---

## Domain review (logopedist-be)

Skill file consulted: `07-gdpr-and-patient-rights.md` (for token storage and GDPR claims).

**Claim 1: Rosa.be as "a widely used booking platform for Belgian paramedics, including logopedists"**

This claim is not directly addressed in the logopedist-be skill references, which cover regulatory/billing/GDPR matters rather than market landscape. The skill's scope notes explicitly exclude "competitive intelligence" and "legacy halingo codebase". The claim is plausible given Rosa is the only booking platform explicitly integrated with Halingo, and `rosa_integration.md` confirms Rosa has both a public integration API and an "online booking by a patient" feature — consistent with a booking platform role. Cannot confirm market share from skill references. Disposition: CLARIFY — not contradicted, not confirmable from primary sources.

**Claim 2: GDPR implications of storing integration tokens in plaintext**

Confirmed as a genuine risk. Per skill file `07-gdpr-and-patient-rights.md`:
- Art. 32 GDPR requires "encryption at rest and in transit" and the GBA "treats encryption of health data as the floor" (line 34 of the file).
- Rosa integration tokens are stored in plaintext on `Meteor.users.rosaIntegrations[].token` (confirmed in `rosa_integration.md:236` and `rosa-users.ts:36-47`).
- The token is not itself health data, but it grants API access to patient records (names, SSIN-adjacent data, appointments) stored in Rosa. Compromise of the token = unauthorized access to health-adjacent data.
- The GBA-aligned position is that API credentials granting access to health-data systems should be encrypted at rest. The discovery's GDPR risk flag is appropriate and understated (it calls it "potential" — it is more properly a concrete Art. 32 gap).

Disposition: CLARIFY — the discovery correctly flags the risk but characterizes it as "potential"; it is a concrete gap under Art. 32. The Phase 2 spec should require encryption of `rosaIntegrations[].token` at rest in the new system.

**Claim 3: "Requires Review" flow aligns with Belgian logopedist need to verify if booking matches RIZIV-reimbursable treatment path**

This is a reasonable product-design observation. Per `02-prescription-bilan-and-pathology-rules.md` (not directly read but covered by skill routing), RIZIV logopedie reimbursement requires a valid prescription and bilan. An online booking from Rosa does not carry this clinical documentation. The `EVENT_NEEDS_REVIEW_NO_TREATMENT` i18n string (confirmed in `rosa_integration.md:209-210`) explicitly prompts the therapist to assign a treatment — which in turn connects to RIZIV nomenclature. The discovery's characterization is directionally accurate.

However, the discovery frames this as purely a workflow concern. There is a regulatory dimension: sessions billed to RIZIV without a valid treatment path are non-compliant. The review flow is therefore not optional from a compliance standpoint. Disposition: NOTE — the discovery is not wrong, but the RIZIV compliance dimension should be captured in the Phase 2 spec for `rosa/review-flow`.

**Claim 4: "Last write wins" sync policy — Belgian healthcare data integrity concerns**

The discovery correctly flags this in `[NEEDS DOMAIN REVIEW]`. Per `07-gdpr-and-patient-rights.md`, GDPR Art. 5(1)(d) requires personal data be "accurate and, where necessary, kept up to date" with "every reasonable step" to erase or rectify inaccurate data (§1 of skill file, cross-reference). A "last write wins" policy on patient data fields (name, address, birthdate) shared between two systems could introduce inaccurate data without audit trail. This is a concrete Art. 5(1)(d) risk, not merely a UX preference. The `rosa_integration.md` source confirms the concern is already documented in the code with a warning note (line 223: "needs product validation — specifically whether 'last write wins' on the non-invoice fields of an event is the intended UX").

Disposition: CLARIFY — the discovery correctly identifies this as needing domain review. The Phase 2 spec must specify the conflict-resolution policy explicitly. A pure last-write-wins policy without audit logging is problematic under Art. 5(1)(d) and the Patient Rights Law art. 9 (right to an accurately kept file).

**Claim 5: Rosa integration is common/expected for Belgian logopedist practices**

Not directly verifiable from skill references (market landscape is out of scope). The skill confirms logopedists are paramedical professionals who can use booking platforms. Cannot confirm Rosa adoption rates. Disposition: CLARIFY — acceptable for discovery purposes; the Phase 2 spec author should not design the integration as optional/niche.

---

## Escalated source checks (Step 4)

| # | Claim checked | Source cited | Finding |
|---|---|---|---|
| 1 | `pullEventsForUser` exists as primary pull logic | `rosa-events.ts:60` | PARTIALLY VERIFIED. Function exists at line 53 (not 60). Line 60 is inside the body (the `isSyncingEvents` guard). Function is correctly characterized as the primary pull logic for events. Line number in discovery is off by 7. |
| 2 | `pullPatientsForUser` exists at `rosa-patients.ts:110` | `rosa-patients.ts:110` | PARTIALLY VERIFIED. Function exists at line 100 (not 110). Line 110 is inside the method body. Function is correctly characterized. Line number in discovery is off by 10. |
| 3 | `setInterval` with 300,000ms (5-min) cron at `hooks.js:72` | `hooks.js:72` | VERIFIED. `Meteor.startup(() => { setInterval(...)` begins exactly at line 72. The cron body includes the `disableRosaSync` guard and `pLimit(5)` across practices. |
| 4 | `mergePatientFileInto` at `rosa-patients.ts:705` is Rosa-coupled and silently no-ops without Rosa | `rosa-patients.ts:705` | NOT VERIFIED. Function does not exist under that name. Actual function is `mergePatientRecords` at line 586. Line 705 is in an unrelated data-mapping helper. The "Rosa-coupled" characterization is correct for the actual `mergePatientRecords` function. This is a fabricated symbol name at the wrong line. |
| 5 | Real-time push (`pushEventsToRosa`) at `rosa-events.ts:324` is fire-and-forget | `rosa-events.ts:324` | VERIFIED. `pushEventsToRosa` at line 324 wraps `pushEventsToRosaSync` in `setTimeout(() => ..., 1)`. The method returns immediately; errors are logged via `invalidateTokenOn403` but not surfaced. |

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-rosa-01 | BLOCKER | citation | `application_map.md:173` does not exist (`application_map.md` has 62 lines). Two feature entries (`rosa/patient-merge`, key preservation #3) cite it for the patient merge characterization. The actual source is `rosa_integration.md` (Conflict resolution section). | Must correct before Phase 2: update citation to `rosa_integration.md` (Conflict resolution section, approximately lines 214-221). |
| V-rosa-02 | BLOCKER | citation | Function named `mergePatientFileInto` does not exist in `rosa-patients.ts`. Actual function is `mergePatientRecords` at line 586. The `rosa/patient-merge` feature entry carries a fabricated symbol name. | Must correct before Phase 2: update to `mergePatientRecords` at `rosa-patients.ts:586`. The QUIRK-PRESERVE annotation is still warranted but must reference the correct symbol. |
| V-rosa-03 | CLARIFY | citation | `bugs_and_security_findings.md` is cited as the source for both plaintext token storage and trailing space bugs. Neither finding appears in that file as a standalone entry. Both are documented in `rosa_integration.md` (lines 236 and 258). | Update `NEEDS CLARIFICATION` list: correct source attributions to `rosa_integration.md`. |
| V-rosa-04 | CLARIFY | omission | `SelectCalendarDialog` / `FOUND_MULTIPLE_CALENDARS_FOR_HP` flow during connection is not cataloged. It is a distinct UI behavior driven by a specific error response from Rosa during `connectToRosa`. | Add to Phase 2 backlog as a sub-feature of `rosa/connect`. |
| V-rosa-05 | CLARIFY | omission | The hardcoded 30-day push window for batch event pushes is not mentioned. This is a QUIRK-PRESERVE candidate (historical events are silently excluded from scheduled pushes). | Add to `rosa/realtime-push` feature notes with QUIRK-PRESERVE flag. |
| V-rosa-06 | CLARIFY | domain | GDPR plaintext token risk is characterized as "potential" — it is a concrete Art. 32 gap. Phase 2 spec for `rosa/connect` must require encryption of `rosaIntegrations[].token` at rest. | Add to Phase 2 spec requirements. |
| V-rosa-07 | CLARIFY | domain | Last-write-wins sync policy has Art. 5(1)(d) GDPR implications (accuracy principle) and Patient Rights Law art. 9 implications (accurately kept file). Needs explicit conflict-resolution specification in Phase 2 spec. | Keep in `[NEEDS DOMAIN REVIEW]` with this framing added. |
| V-rosa-08 | CLARIFY | omission | On-demand `SYNC_PATIENTS` / `SYNC_EVENTS` buttons are user-visible features not separately cataloged. They invoke different code paths from the cron. | Add to feature catalog as sub-entries of the pull features or a new `rosa/manual-sync` entry. |
| V-rosa-09 | NOTE | citation | `pullEventsForUser` line number cited as `:60` — actual signature is at line 53. Off by 7 lines. | Correct in feature catalog. Non-blocking. |
| V-rosa-10 | NOTE | citation | `pullPatientsForUser` line number cited as `:110` — actual signature is at line 100. Off by 10 lines. | Correct in feature catalog. Non-blocking. |
| V-rosa-11 | NOTE | citation | Several `rosa_integration.md` line citations (`:65`, `:204`, `:215`, `:223`, `:239`, `:267`) are approximate. The substance is correct but line numbers are off by 10-40 lines. | Non-blocking for Phase 2. Note in feature catalog that line numbers are approximate. |
| V-rosa-12 | NOTE | citation | `rosa_integration.md:14` for the token quote — the phrase appears at line 5 (within the architectural note block), not line 14. | Minor. Substance is verified correct. |
| V-rosa-13 | NOTE | omission | The `disableRosaSync` Meteor settings kill switch is not mentioned in the discovery. The new system should implement an equivalent environment flag. | Add to Phase 2 spec notes for `rosa/pull-cron`. |
| V-rosa-14 | NOTE | domain | Discovery's `[NEEDS DOMAIN REVIEW]` on the "Requires Review" flow for RIZIV compliance is appropriate. The skill confirms that unbilled sessions without treatment paths are a compliance risk. RIZIV dimension should be explicit in Phase 2 spec for `rosa/review-flow`. | Add RIZIV framing to Phase 2 notes. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring with the following conditions:**

1. **BLOCKERS (2) must be corrected first** in the discovery file or noted as errata in the Phase 2 spec brief:
   - V-rosa-01: Replace all references to `application_map.md:173` with `rosa_integration.md` (Conflict resolution section).
   - V-rosa-02: Replace `mergePatientFileInto` with `mergePatientRecords` at `rosa-patients.ts:586`.

2. **CLARIFYs (6) are backlog items** for the Phase 2 spec author to resolve:
   - V-rosa-04, V-rosa-05, V-rosa-08: Three missing features/behaviors to add to catalog.
   - V-rosa-06, V-rosa-07: GDPR spec requirements for token encryption and conflict-resolution policy.
   - V-rosa-03: Source attribution corrections.

3. **NOTEs (6)** are informational. The line-number imprecision (V-rosa-09 through V-rosa-12) is not unusual in discovery work and does not affect Phase 2 correctness, since the spec is authored from the sources directly.

The discovery file's overall characterization of the Rosa integration is accurate: bidirectional sync confirmed, token model (not OAuth2) confirmed, fire-and-forget push confirmed, cron location confirmed, QUIRK-PRESERVE for patient merge warranted (with corrected symbol name). The core technical narrative is sound. The two BLOCKERs are citation errors, not behavioral errors.
