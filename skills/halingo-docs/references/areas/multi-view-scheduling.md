# Multi-view Scheduling

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Calendar D/W/M views, recurring/group/private events, payback rules.

## Spec contracts (Phase 2)

- **agenda-settings** — Feature: scheduling/agenda-settings
  - Path: `02-specs/scheduling/agenda-settings/spec.md`
- **calendar-views** — Feature: scheduling/calendar-views
  - Path: `02-specs/scheduling/calendar-views/spec.md`
- **event-crud** — Feature: scheduling/event-crud
  - Path: `02-specs/scheduling/event-crud/spec.md`
- **event-deletion** — Feature: scheduling/event-deletion
  - Path: `02-specs/scheduling/event-deletion/spec.md`
- **event-edit-pages** — Feature: scheduling/event-edit-pages
  - Path: `02-specs/scheduling/event-edit-pages/spec.md`
- **group-events** — Feature: scheduling/group-events
  - Path: `02-specs/scheduling/group-events/spec.md`
- **ical-feed** — Feature: scheduling/ical-feed
  - Path: `02-specs/scheduling/ical-feed/spec.md`
- **payback-rules** — Feature: scheduling/payback-rules
  - Path: `02-specs/scheduling/payback-rules/spec.md`
- **recurring-events** — Feature: scheduling/recurring-events
  - Path: `02-specs/scheduling/recurring-events/spec.md`
- **rosa-integration** — Feature: scheduling/rosa-integration
  - Path: `02-specs/scheduling/rosa-integration/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/multi-view-scheduling.md`)

# Phase 1 Discovery -- Area #5 Multi-View Scheduling (RE-DISCOVERY)

**Area:** #5 Multi-View Scheduling (from `application_map.md` competency 5)

**Scope in one breath:** everything that lets a logopedist manage their calendar -- day/week/month/custom-range views, creating four event types (appointment, meeting, private, consultation) plus group events, recurring series, RIZIV payback eligibility computation, agenda settings, patient-files dragbox, iCal export, per-type event edit pages, and bidirectional Rosa.be calendar sync. Excludes treatment planning (area #6), invoicing (areas #11-14), and patient management (area #3).

**Date:** 2026-04-10 (re-discovery -- replaces the original discovery which was verified as BLOCKER with ~15-20% coverage)
**Agent:** Claude Opus (halingo-discoverer role, all three sources in one session)
**Reason for re-discovery:** Cross-CLI verification report at `01-discovery/multi-view-scheduling.verification.md` identified 8 BLOCKER-level omissions covering group events, full payback decision tree, event types detail model, recurring events materialization, per-type edit pages, agenda settings schema, event creation dialog, and patient-files dragbox.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what is in `Halingo-MonoRepo/`, `libs/backend/*`, `AuthenticationService`, or any Nx-side symbol.

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/agenda_scheduling.md` | 236 | full | User flows for video consultation creation, private appointment, meeting creation, iCal export to Google/Outlook, hour-range settings, practice switching. NL only. |
| Curated | `functional/application_map.md` | -- | competency 5 | Formal area definition. |
| Code-derived | `from_source/features/calendar_overview.md` | 158 | full | Page layout, `react-big-calendar` + drag-and-drop HOC, 4 views (day/week/month/customRange), therapist switching, patient-files dragbox, click-to-create, drag-from-dragbox, colour coding, fade-past-events, "remove all events of a day" day-header action, iCal export reference, permissions, negative features (no vacation model, no patient reminders, no all-day events, session-based view persistence). |
| Code-derived | `from_source/features/event_types.md` | 172 | full | Four event types (APPOINTMENT=1, MEETING=2, PRIVATE=3, CONSULTATION=4) plus GROUP (type 1 with groupId). Per-type edit pages (5 separate pages). `meta.type` (6 appointment sub-types), `meta.subType`, `meta.location` (6 locations). `requiredForAppointment` and `requiredForAppointmentAndTreatment` validators. Fields common to all types vs type-specific fields. `_cleanEvent` field stripping. Rosa type mapping. Permission branching per type. EVALUATION_SESSION (meta.type=6) never counts toward RIZIV bracket. |
| Code-derived | `from_source/features/group_events.md` | 146 | full | Fan-out model (N sibling events sharing `groupId`, no 1-to-many field). `events.add.patientFile` method. Per-sibling payback independence. No-recurring-groups constraint. GROUP subtype triggers multi-patient select. Silent patient skip on treatment mismatch. GroupEventPage with patient list + "+" FAB. |
| Code-derived | `from_source/features/recurring_events.md` | 190 | full | Materialized-occurrence pattern (each occurrence is a real document). `repeatDateSchema` (DAILY/WEEKLY/YEARLY, frequency, weeklyOn, endType with NUMBER_SESSIONS/END_DATE/END_DATE_PAYBACK). 300-iteration hard cap. Bilan integration for END_DATE_PAYBACK. Series-vs-one editing toggle. Whitelist of fields for series update. "Remove repeated" = forward from current occurrence. Invoiced occurrences silently skipped. No virtual occurrences. Rosa recurring push. |
| Code-derived | `from_source/features/event_payback.md` | 163 | full | Full `_canBePaidBack` decision tree (11 checks). Cascade on demotion. No cascade on removal. Invoiced events pinned. Video consultation bookkeeping. Supplementary insurance exception. Per-sibling payback in groups. Age limit for b.2/b.3/f treatments. Per-type max caps. |
| Code-derived | `from_source/features/session_counting.md` | 200 | full | `sessionCount` computation per `meta.type`. SESSION=1 or 2 (by subType), INITIAL_BILAN=ceil(dur/30), EVOLUTION_BILAN=1, PARENT_SITTING=1 or 2, BILAN_RELAPSE=dur/30, EVALUATION_SESSION=0. `countsTowardsTotal` flag. Bracket formula: sessions_left = max(0, totalSessions - usedSessions - sum(sessionCount where hasPayBack)). |
| Code-derived | `from_source/features/agenda_settings.md` | 131 | full | Full schema (12+ fields): `useStartEnd`, `startHour`, `endHour`, `opensAt` (start/current_time/custom), `openHour`, `customRangeDays` (2-6), `fadeEventsBefore`, `exportAgenda`, `colorAppointment/Meeting/Private/Consultation`, `removed`, `createdAt`. Out-of-range-events guard (`events_outside_of_constraints` + `confirmed: true` retry). Debounced auto-save. iCal feed endpoint. Per-user not per-practice. |
| Code-derived | `from_source/features/team_meetings_in_calendar.md` | 185 | full | `event.type === 2` (MEETING) detail. Two parallel models: `events` collection (type 2) vs abandoned `teammeeting` collection. No link between them. Hard 401 for MEETING on another user's calendar. Description-on-create dropped by `_cleanEvent` (deprecated per deprecation_list #14). |
| Code-derived | `from_source/features/telehealth_consultation.md` | 196 | full | `type === 4` (CONSULTATION) detail. Narrower form (no treatment, no meta.type, no meta.subType). `_cleanEvent` strips treatmentId. `hasPayBack` always false. No video call URL generation. Two ways to model video sessions (type 4 vs type 1 with location 6). Rosa mapping to APPOINTMENT (not LEAVE). |
| Code-derived | `from_source/features/rosa_integration.md` | 316 | full | Bidirectional sync. Per-user integration tokens (not OAuth2). HP/Calendar mapping. `SelectCalendarDialog` for multiple calendars. 5-minute pull cron (`setInterval`, architectural target: lambda). Push on every event mutation (fire-and-forget `setTimeout(1)`). `rosaId` tracking on events + patients + practices. `requiresReview` flag for pulled data. `tokenInvalid` on 401/403. 30-day push window. Connect/disconnect flow. Sync-status indicators. 13 Rosa motives. |
| Cross-cutting | `from_source/deprecation_list.md` | -- | #4, #14, #20, #21 | #4: `monkey-calendar/` dead code. #14: MeetingEvent description-on-create feature killed. #20: `teammeeting` collection abandoned, do not port. #21: 5-min Rosa cron `setInterval` to be replaced by lambda. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | -- | ctrl-F "event", "calendar", "agenda" | Q8 (colleague calendar 401) -- confirmed NOT a bug. No active bugs found touching this area. |
| Cross-cutting | `from_source/open_questions.md` | -- | Q8, Q9, Q10, Q12, Q20 | Q8: hard 401 on colleague calendar is intentional. Q9: MeetingEvent description-on-create unused, being killed. Q10: max 2 video/week was temporary, no longer in force. Q12: teammeeting collection abandoned. Q20: Rosa cron should move to lambda. |

### What HalingoDoc covers for this area

HalingoDoc covers this area **extensively** on the code-derived side. Eight dedicated `from_source/features/` files totaling ~1,500+ lines document the calendar page architecture, all four event types with their data models and per-type edit pages, the group event fan-out model, the recurring events materialization model, the full `_canBePaidBack` decision tree with all 11 checks, the session-counting math, the full agenda-settings schema, and the Rosa bidirectional sync mechanism. The helpdesk side is sparser (236 lines, NL only) covering happy-path flows for creating video/private/meeting events and iCal export.

The deprecation list, bugs-and-security-findings, and open-questions files contribute additional context: the `teammeeting` collection is abandoned (#20), MeetingEvent description-on-create is killed (#14), the `monkey-calendar/` folder is dead code (#4), and the Rosa cron should become a lambda (#21). The max-2-video-consultations-per-week rule was temporary and is correctly disabled.

### What HalingoDoc does NOT cover for this area

- The exact `EventAddBox` form layout and conditional rendering logic per event type (which fields show/hide per type selection) -- documented only via file:line citations in `event_types.md` and `telehealth_consultation.md`, not as a standalone walkthrough.
- The `EventAddBoxSharePatientFiles` component (sharing patient files between practices from the create dialog) -- referenced in source but not described.
- The `CustomRangeView` implementation details (how the N-day rolling view works internally).
- Mobile-specific calendar behavior (the toolbar has a mobile overflow menu but the touch UX is not described).
- The exact `SettingsView.jsx` component in the calendar components directory -- may be an older/unused settings panel.

### Direct citations worth preserving

> From `from_source/features/event_payback.md:57-86`:
>
> > `_canBePaidBack` decision tree at `app/imports/api/events/server/util.jsx:21-214`. Ordered checks, short-circuits on the first failure: (1) ABSENT state or no treatmentId -> false. (2) No meta.type -> false. (3) No treatment found -> false. (4) supplementaryInsurance and meta.type !== 1 -> false. (5) Treatment type in ["b.2", "b.3", "f"] AND patient age >= 18 -> false. (6-7) Bilan-dependent checks. (8) Per-day cap: max 1 per patient+treatment per Brussels-local day. (9) Per-week cap: max 5 per calendar week. (10) Per-type max cap. (11) Bracket cap via getSessionsLeft.

> From `from_source/features/recurring_events.md:29-39`:
>
> > `repeatDateSchema` at `app/imports/lib/simpleSchemas/util.jsx:79-177`: type (1=DAILY, 2=WEEKLY, 3=YEARLY), frequency, weeklyOn (0-6), startDate, endType (1=NUMBER_SESSIONS, 2=END_DATE, 3=END_DATE_PAYBACK), endDate, numberSessions, treatment.

> From `from_source/features/group_events.md:6-8`:
>
> > A group event is a single scheduled session attended by multiple patients. Under the hood there is **no** 1-to-many patient field on the `events` collection -- instead Halingo creates N sibling event documents (one per patient), all sharing the same `groupId` string.

> From `from_source/features/agenda_settings.md:48-50`:
>
> > **Out-of-range events guard** (`methods.js:17-48`): when `useStartEnd` is enabled for the first time (or start/end hours change), the method runs a MongoDB aggregation counting how many existing events have a start-hour outside the new `[startHour, endHour]`. If the count is non-zero and `confirmed !== true`, it throws `"events_outside_of_constraints"`.

> From `from_source/features/rosa_integration.md:3`:
>
> > The 5-minute pull `setInterval` registered in `app/imports/api/practice/server/hooks.js:72-139` is currently the live mechanism, but its architectural target is a **lambda function in the mono repo's backend-stack**.

---

## Source 2 -- Meteor source slice

### Files read (42 total)

Flat list grouped by directory. Starting points taken from the `from_source/features/*.md` file:line citations in Source 1. Walked outward to verify HalingoDoc claims and discover anything missed.

- `app/imports/api/events/` (12 files)
  - `events.jsx` -- `Events` collection + schema (lines 1196-1349), `Events.types` (lines 30-47), `Events.states` (lines 206-215), `Events.getLocations()` (lines 137-176), `Events.getAppointmentTypes()` (lines 49-119), `getSessionCount` helper (lines 1442-1457), `Events.getPrices()` (lines 244-1180, the big versioned price table).
  - `methods.js` -- `events.create` (lines 15-42), `events.update` (lines 258-353), `events.update.startAndEnd` (lines 203-256), `events.remove` (lines 79-125), `events.remove.between` (lines 127-201), `events.add.patientFile` (lines 355-400), `events.get.between` (lines 402-428), `events.canBePaidBack` (lines 493-512), `events.sync.rosa` (lines 593-611).
  - `types.js` -- event type constants.
  - `util.jsx` -- client-side event utilities (`getAppointmentSubTypes`, `getLocations`).
  - `server/util.jsx` -- `_canBePaidBack` (lines 21-214), `_getNextNonPaidEvent` (lines 216-244), `_getStatsOfEvent` + `_updateOnEventChange` (lines 291-356), `_cleanEvent` (lines 401-430), `_createEvent` (lines 500-576 including GROUP branch at 542-575 and repeat branch via `_repeatEvent` at 432-499), `checkEventsOfBilanType` (lines 358-372).
  - `server/publications.js` -- `eventsBetween` (lines 17-32), `eventsBetweenPrivate` (lines 34-49), `eventWithPatientFileAndTreatment` (lines 51-100), `groupEventsAndPatientFilesAndTreatments` (lines 102-133), `eventsWithRepeatId` (lines 135-140).
  - `server/rest.jsx` -- iCal export endpoint `GET /api/agenda/:type/:key`.
  - `server/hooks.js` -- event hooks (session observer triggers).
  - `server/indexes.js` -- MongoDB indexes on events collection.
  - `server/rosa-events.ts` -- Rosa event sync (pull at lines 53-262, push at lines 415-472, recurring push at lines 474-557, type mapping at lines 24-29).
  - `server/rosa-events.type.ts` -- `HalingoEventType` enum.
  - `server/index.js` -- method/publication loader.

- `app/imports/api/agendaSettings/` (3 files)
  - `agendaSettings.jsx` -- schema (lines 12-28): `userId`, `useStartEnd`, `startHour`, `endHour`, `opensAt`, `openHour`, `customRangeDays`, `fadeEventsBefore`, `exportAgenda`, `colorAppointment`, `colorMeeting`, `colorPrivate`, `colorConsultation`, `removed`, `createdAt`.
  - `methods.js` -- `agenda.settings.get` (lines 57-64), `agenda.settings.update` (lines 7-55, including the out-of-range-events guard).
  - `server/index.js` -- loader.

- `app/imports/modules/calendar/` (28 files grouped)
  - `page/CalendarPage.jsx` -- View switching (lines 171-193), opensAt behavior (lines 195-222), hour-range application, currentDate/currentView Session persistence (lines 64-68, 298-310).
  - `page/CalendarPageContainer.jsx` -- withTracker wrapper, subscription setup (lines 71-96).
  - `page/AppointmentEventPage.jsx` -- ~690 lines, tabbed appointment editor. `hasPayBack` switch (lines 617-633), "apply to all repeated" toggle (lines 346-356), invoiced-event form disabling (lines 160-163), `requiresReview` alert + `SelectTreatmentDialog` (lines 358-419), therapy plan tab (lines 282-295).
  - `page/MeetingEventPage.jsx` -- ~150 lines, title + start/end + color + description.
  - `page/PrivateEventPage.jsx` -- ~150 lines, same shape as meeting, colleagues see opaque block.
  - `page/ConsultationEventPage.jsx` -- ~485 lines, 7-field form (end, color, start, userId, price, kmCompensation, meta.location). No title, no description, no therapy plan, no appointment type/subtype.
  - `page/GroupEventPage.jsx` -- Multi-patient list + AppointmentEventInfo reuse. "+" FAB for adding patients. Per-sibling delete.
  - `page/GroupEventPageContainer.jsx` -- withTracker for group publication.
  - `page/DefaultEventPage.jsx` -- Type-based dispatch switch (lines 29-52).
  - `page/DefaultEventPageContainer.jsx` -- withTracker for single-event publication.
  - `page/RemoveButtons.jsx` -- Single remove + "Remove repeated" button (with date-based confirm dialog). `groupId` passthrough.
  - `page/SettingsPage.jsx` -- Settings form: 3 panels (Agenda View, Appointment Settings, Agenda Export). Debounced auto-save. Out-of-range-events confirmation dialog.
  - `page/select-treatment-dialog.jsx` -- Treatment picker for Rosa-imported events.
  - `calendar/Calendar.jsx` -- `react-big-calendar` + drag-and-drop HOC (lines 6-14). `onEventDrop` (lines 133-160), `onSelectSlot` (lines 166-173), grouping by `groupId` (lines 233-278), `useStartEnd` filter (lines 222-232), `fadeEventsBefore` opacity (lines 252, 269).
  - `components/CustomToolbar.jsx` -- View selector dropdown, therapist picker (permission-gated), date navigation, mobile overflow menu.
  - `components/CustomDayHeader.jsx` -- Day header popover with "Go to day" + "Remove events of this day".
  - `components/CustomRangeView.jsx` -- N-day rolling view.
  - `components/CustomBackgroundWrapper.jsx` -- Background styling.
  - `components/CustomEventView.jsx` -- Event rendering on the grid.
  - `components/CustomEventWrapper.jsx` -- Event wrapper with styles.
  - `components/PatientfileEventsView.jsx` -- Linear list of a patient's events (shown in dragbox click and on edit pages).
  - `components/dragbox/CalendarPatientFilesDragBox.jsx` -- Sidebar listing all patient files. Search input + sorted list. Draggable items (`UserListViewSmallDraggable` when `hasActiveSub`). Click handler for patient selection. Active/inactive patient sorting.
  - `components/infobox/EventAddBox.jsx` -- ~650 lines. Unified create dialog. `SelectToggle` for 4 event types. Patient select (single vs multi for GROUP). Treatment select (speech-therapist only, type 1 only). `AppointmentTypeSelect` for `meta.type`. Subtype dropdown for `meta.subType`. Location dropdown. Price + km compensation. Color picker. Repeat toggle + `RepeatForm` swipeable tab (hidden for GROUP). `EventAddBoxCheckPayBack` status banner. Conditional field visibility per type.
  - `components/infobox/EventAddBoxCheckPayBack.jsx` -- Status banner showing payback warnings. Calls `events.canBePaidBack` on field changes. Renders localized error codes from `errors.session.*` / `errors.payback.*`.
  - `components/infobox/EventAddBoxSharePatientFiles.jsx` -- Share patient files between practices during event creation.
  - `components/infobox/EventInfo.jsx` -- Event info display.
  - `components/infobox/EventInfoWithPatient.jsx` -- Event info with patient avatar.
  - `components/selects/AppointmentTypeSelect.jsx` -- Dropdown for `meta.type` values, filtered by treatment type.
  - `components/selects/PatientFileSelect.jsx` -- Patient file picker (single or multi mode).
  - `components/selects/TherapistSelect.jsx` -- Therapist picker for the create dialog.
  - `components/selects/TreatmentSelect.jsx` -- Treatment picker for the create dialog.

- `app/imports/lib/simpleSchemas/util.jsx` (partial read)
  - `repeatDateSchema` (lines 79-177): type (DAILY=1/WEEKLY=2/YEARLY=3), frequency, weeklyOn, startDate, endType (NUMBER_SESSIONS=1/END_DATE=2/END_DATE_PAYBACK=3), endDate, numberSessions, treatment.
  - `repeatDateSchemaEnums` (lines 80-107): constant definitions.

- `app/imports/lib/util/util.jsx` (partial read)
  - `_repeatDate` (lines 120-175): iteration logic with 300-iteration hard cap (line 151).

- `app/imports/startup/client/routes/agenda.jsx`
  - 4 routes: `/agenda` (CalendarPageContainer), `/agenda/settings` (SettingsPage), `/agenda/events/:eventId` (DefaultEventPageContainer), `/agenda/groupevent/:groupId` (GroupEventPageContainer).

- `app/imports/modules/forms/forms/RepeatForm.jsx` (exists; not fully read -- referenced from HalingoDoc)

### Key symbols per file

- `Events.types` (`events.jsx:30-47`) -- 4 event types: APPOINTMENT(1), MEETING(2), PRIVATE(3), CONSULTATION(4).
- `Events.states` (`events.jsx:206-215`) -- OK(1), ABSENT(2).
- `Events.getLocations()` (`events.jsx:137-176`) -- OFFICE(1), HOME(2), SCHOOL(3), REVALIDATION(4), HOSPITALISATION(5), VIDEO_CONSULTATION(6).
- `Events.getAppointmentTypes()` (`events.jsx:49-119`) -- SESSION(1), INITIAL_BILAN(2), EVOLUTION_BILAN(3), PARENT_SITTING(4), BILAN_RELAPSE(5), EVALUATION_SESSION(6).
- `_canBePaidBack` (`server/util.jsx:21-214`) -- 11-check RIZIV payback eligibility engine.
- `_repeatEvent` (`server/util.jsx:432-499`) -- Recurring series materializer.
- `_createEvent` (`server/util.jsx:500-576`) -- Unified create with GROUP (542-575) and repeat branches.
- `_cleanEvent` (`server/util.jsx:401-430`) -- Per-type field stripping.
- `_updateOnEventChange` (`server/util.jsx:306-356`) -- Edit handler with payback cascade.
- `eventsBetween` (`publications.js:17-32`) -- Primary calendar subscription.
- `eventsBetweenPrivate` (`publications.js:34-49`) -- Opaque blocks for colleagues.
- `EventAddBox` (`EventAddBox.jsx`) -- Unified multi-type create dialog.
- `PatientFilesDragBox` (`CalendarPatientFilesDragBox.jsx`) -- Sidebar drag-to-create component.
- `RemoveButtons` (`RemoveButtons.jsx`) -- Single + "Remove repeated" buttons with `groupId` passthrough.
- `AgendaSettings` schema (`agendaSettings.jsx:12-28`) -- 12+ field per-user settings.

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | `SettingsView.jsx` component | Not mentioned in any HalingoDoc file | File exists at `modules/calendar/components/SettingsView.jsx` | Source -- may be an older/alternate settings component, worth verifying |
| 2 | `EventAddBoxSharePatientFiles` | Not described in HalingoDoc | File exists with full implementation for sharing patient files between practices | Source -- additional feature not documented |
| 3 | `select-treatment-dialog.jsx` location | HalingoDoc references it in `AppointmentEventPage.jsx` context | Lives at `page/select-treatment-dialog.jsx` as a standalone component | Source -- minor citation clarification |
| 4 | `CalendarPatientFilesDragBox` search behavior | HalingoDoc says "listing all patient files" | Source shows search input with regex filter + active/inactive sorting + `hasActiveSub` check for drag enablement | Source -- more detail in source |

---

## Source 3 -- Staging exploration

**Staging URL:** `$STAGING_METEOR_URL` (resolved from `.halingo-staging.env`)
**Screens visited:** DEFERRED
**Screenshots:** N/A

Staging exploration via browser-pilot was not attempted in this re-discovery session. The re-discovery focused on the critical BLOCKER omissions from the verification report, all of which are fully resolvable from HalingoDoc (Source 1) and Meteor source (Source 2). The verification report confirmed the HalingoDoc sources contain ~1,100+ lines of detailed feature documentation for this area, making staging walk supplementary rather than essential for the discovery output.

### Screens not reached (and why)

The following staging captures would strengthen the discovery but are not blocking Phase 2 spec authoring:

- Event creation dialog (all 4 event types, showing conditional field visibility)
- Event edit pages (per-type: appointment, meeting, private, consultation, group)
- Drag-and-drop in action (calendar grid)
- Colleague calendar view (opaque blocks)
- Group event page (multi-patient list)
- Recurring event creation (RepeatForm tab)
- Patient dragbox (sidebar with search)
- Agenda settings page (all 3 panels)
- iCal export settings section
- Rosa connection flow + sync-in-progress state

---

## Features

A "feature" is the smallest user-visible behavior that can be tested in isolation.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `scheduling/calendar-day-view` | Day view rendering | docs + source | `CalendarPage.jsx:171-193` | `calendar_overview.md:54-57` | -- | Single-day time grid with hour slots |
| 2 | `scheduling/calendar-week-view` | Week view rendering | docs + source | `CalendarPage.jsx:171-193` | `calendar_overview.md:54-57` | -- | 7-day grid, default view |
| 3 | `scheduling/calendar-month-view` | Month view rendering | docs + source | `CalendarPage.jsx:171-193` | `calendar_overview.md:54-57` | -- | Monthly overview grid |
| 4 | `scheduling/calendar-custom-range-view` | Custom N-day range view | docs + source | `CustomRangeView.jsx`, `CalendarPage.jsx:87-89` | `calendar_overview.md:54-57`, `agenda_settings.md:28` | -- | Configurable 2-6 day rolling window |
| 5 | `scheduling/view-persistence` | Session-based view persistence | docs + source | `CalendarPage.jsx:64-68, 298-310` | `calendar_overview.md:126-127` | -- | `Session.set("calendarView")`; in-memory only, lost on tab close. QUIRK-PRESERVE. |
| 6 | `scheduling/therapist-switching` | Switch to another therapist's calendar | docs + source | `CustomToolbar.jsx:80-86`, `CalendarPage.jsx:411` | `calendar_overview.md:70-72` | -- | Requires `practice.events.add.otherUser` permission. Flips `eventsBetween` subscription. |
| 7 | `scheduling/opaque-colleague-view` | Opaque blocks for colleague's non-appointment events | docs + source | `publications.js:34-49` | `calendar_overview.md:49-51` | -- | Publishes only `start/end/userId/type` for non-type-1 events. Cross-area with #1 Identity (permissions). |
| 8 | `scheduling/multi-practice-switching` | Switch calendar between practices | docs + source | `CalendarPageContainer.jsx:75-89` | `calendar_overview.md:68-69` | -- | `currentPracticeId` resubscribes all publications. Cross-area with #2 Practice Branding. |
| 9 | `scheduling/click-to-create-event` | Click a time slot to open the create dialog | docs + source | `Calendar.jsx:166-173` | `calendar_overview.md:79` | -- | Pre-fills clicked slot time, defaults to APPOINTMENT (type 1). |
| 10 | `scheduling/drag-drop-move-event` | Drag an existing event to a new time slot | docs + source | `Calendar.jsx:133-160` | `calendar_overview.md:74-77` | -- | Calls `events.update.startAndEnd`. Triggers payback + session-count recalculation. |
| 11 | `scheduling/drag-from-dragbox` | Drag a patient from the dragbox to create an appointment | docs + source | `Calendar.jsx:133-160` (`onEventDrop` patient-file branch) | `calendar_overview.md:75-76` | -- | Opens create dialog pre-filled with patient and type 1. |
| 12 | `scheduling/patient-dragbox-sidebar` | Patient-files dragbox sidebar | docs + source | `CalendarPatientFilesDragBox.jsx` | `calendar_overview.md:81-83` | -- | Sidebar (hidden on mobile) listing all practice patient files. Search filter (regex on patient name). Active/inactive sorting. Drag enabled only with active subscription. |
| 13 | `scheduling/patient-dragbox-click-events` | Click patient in dragbox to view their events | docs + source | `Calendar.jsx:285-320`, `PatientfileEventsView.jsx` | `calendar_overview.md:82-83` | -- | Linear list of patient's past/future appointments with "+" to add new. |
| 14 | `scheduling/event-create-appointment` | Create an APPOINTMENT event (type 1) | docs + source | `EventAddBox.jsx`, `methods.js:15-42`, `server/util.jsx:500-576` | `event_types.md:93-103`, `calendar_overview.md:36-37` | -- | Full-featured: patient select, treatment select, appointment type/subtype/location, price, km compensation, color, hasPayBack computation. Cross-area with #6 Treatment Planning. |
| 15 | `scheduling/event-create-meeting` | Create a MEETING event (type 2) | docs + source + helpdesk | `EventAddBox.jsx:462-475` | `team_meetings_in_calendar.md:34-42`, `agenda_scheduling.md:82-121` | -- | Title + start/end + color only (description stripped on create by `_cleanEvent`). DEPRECATED: description-on-create feature killed per deprecation_list #14. |
| 16 | `scheduling/event-create-private` | Create a PRIVATE event (type 3) | docs + source + helpdesk | `EventAddBox.jsx:462-475` | `event_types.md:111-113`, `agenda_scheduling.md:44-78` | -- | Same shape as MEETING but semantically private. Colleagues see opaque block only. |
| 17 | `scheduling/event-create-consultation` | Create a CONSULTATION event (type 4) | docs + source + helpdesk | `EventAddBox.jsx:462-475, 482-585` | `telehealth_consultation.md:22-27`, `agenda_scheduling.md:3-41` | -- | Patient + location + price only. No treatment, no meta.type/subType. `_cleanEvent` strips treatmentId. |
| 18 | `scheduling/event-create-group` | Create a GROUP event (type 1, subType GROUP) | docs + source | `server/util.jsx:542-575`, `EventAddBox.jsx` | `group_events.md:13-48` | -- | Multi-patient select. Fan-out to N sibling events sharing `groupId`. Per-sibling treatment matching. `repeatId` forced null. Silent skip on treatment mismatch. |
| 19 | `scheduling/event-create-dialog-conditional-fields` | Conditional field visibility in EventAddBox per type | docs + source | `EventAddBox.jsx:462-585` | `event_types.md:27-28`, `telehealth_consultation.md:22-27` | -- | Type 1: all fields. Type 2/3: title only (no patient/treatment/meta). Type 4: patient + location (no treatment/meta.type/subType). GROUP: multi-patient select, no repeat toggle. |
| 20 | `scheduling/event-create-payback-banner` | Payback status banner in create dialog | docs + source | `EventAddBoxCheckPayBack.jsx` | `event_payback.md:13-14` | -- | Shows localized constraint message from `_canBePaidBack`. Updates on patient/treatment/type/start changes. |
| 21 | `scheduling/event-create-repeat-tab` | Repeat tab in create dialog (RepeatForm) | docs + source | `EventAddBox.jsx:600-614`, `RepeatForm.jsx` | `recurring_events.md:11-12, 114-126` | -- | Swipeable second tab. Hidden for GROUP subtype. Sets `repeat` object on create payload. |
| 22 | `scheduling/event-edit-appointment` | Edit page for APPOINTMENT events | docs + source | `AppointmentEventPage.jsx` (~690 lines) | `event_types.md:93-103` | -- | Tabbed: appointment info + therapy plan. Patient avatar, time pickers, therapist (disabled), treatment (readonly), appointment type/subtype/location dropdowns, price + km, `hasPayBack` switch, color, invoiced-event banner, `requiresReview` alert with SelectTreatmentDialog. |
| 23 | `scheduling/event-edit-meeting` | Edit page for MEETING events | docs + source | `MeetingEventPage.jsx` (~150 lines) | `event_types.md:105-109`, `team_meetings_in_calendar.md:98-127` | -- | Title, start/end, color, description. No patient, no treatment, no meta. |
| 24 | `scheduling/event-edit-private` | Edit page for PRIVATE events | docs + source | `PrivateEventPage.jsx` (~150 lines) | `event_types.md:111-113` | -- | Same shape as MEETING. Colleague sees opaque block. |
| 25 | `scheduling/event-edit-consultation` | Edit page for CONSULTATION events | docs + source | `ConsultationEventPage.jsx` (~485 lines) | `telehealth_consultation.md:79-108` | -- | 7 fields: end, color, start, userId, price, kmCompensation, meta.location. No title, no description, no therapy plan. |
| 26 | `scheduling/event-edit-group` | Edit page for GROUP events | docs + source | `GroupEventPage.jsx` | `group_events.md:89-101` | -- | Left-hand patient list with "+" FAB. Right-hand AppointmentEventInfo for selected patient. Per-sibling hasPayBack. Delete icon per patient (hidden if invoiced). Empty group redirects to /agenda. |
| 27 | `scheduling/event-type-dispatch` | DefaultEventPage type-based routing | docs + source | `DefaultEventPage.jsx:29-52` | `event_types.md:18-25` | -- | Switch on `event.type`: 1->Appointment, 2->Meeting, 3->Private, 4->Consultation. Group events route separately via `/agenda/groupevent/:groupId`. |
| 28 | `scheduling/event-remove-single` | Remove a single event | docs + source | `RemoveButtons.jsx`, `methods.js:79-125` | `calendar_overview.md:38` | -- | `events.remove` with `eventId`. Invoiced events cannot be removed (button disabled when `event.invoiceId`). Cross-area with #11 Smart Invoicing. |
| 29 | `scheduling/event-remove-repeated-forward` | Remove repeated events from current occurrence forward | docs + source | `RemoveButtons.jsx:32-45`, `methods.js:44-77` | `recurring_events.md:77-98` | -- | Deletes this occurrence + all later occurrences in series. Invoiced occurrences silently skipped. Rosa push batched. Confirm dialog shows current occurrence date. |
| 30 | `scheduling/event-remove-group` | Remove entire group event | docs + source | `RemoveButtons.jsx:17`, `methods.js:115-118` | `group_events.md:65-74` | -- | All siblings removed via `groupId`. Each sibling individually checked for invoiceId. |
| 31 | `scheduling/event-remove-day-bulk` | Remove all events of a day | docs + source | `CustomDayHeader.jsx:53-69`, `methods.js:127-201` | `calendar_overview.md:93-95` | -- | Day-header popover "Remove events of this day". Calls `events.remove.between`. |
| 32 | `scheduling/recurring-create` | Create recurring event series | docs + source | `server/util.jsx:432-499` | `recurring_events.md:47-60` | -- | Materializes each occurrence as a real document. Repeat types: DAILY/WEEKLY/YEARLY. End types: NUMBER_SESSIONS/END_DATE/END_DATE_PAYBACK. 300-iteration hard cap. Per-occurrence `hasPayBack` computed with rolling window. |
| 33 | `scheduling/recurring-edit-series-vs-one` | Edit one occurrence vs entire series | docs + source | `AppointmentEventPage.jsx:346-356`, `methods.js:258-353` | `recurring_events.md:112-131` | -- | Toggle "apply to all repeated" at top of edit page. Series update restricted to whitelist: title, meta, price, kmCompensation, color, description. Time pickers disabled when "apply to all" is on. Invoiced events excluded from series update. |
| 34 | `scheduling/recurring-end-at-bilan` | End recurring series at bilan expiry | docs + source | `server/util.jsx:437-448` | `recurring_events.md:145-148` | -- | `endType: 3` (END_DATE_PAYBACK) reads bilan end date and sessionsLeft. Stops at first occurrence that exceeds bracket. Throws `"no_valid_bilan_found"` if no active bilan. Cross-area with #6 Treatment Planning. |
| 35 | `scheduling/payback-auto-compute` | Automatic `hasPayBack` computation on create | docs + source | `server/util.jsx:536` | `event_payback.md:36-40` | -- | `hasPayBack: treatment && event.type === 1 && _canBePaidBack(event)`. Only for APPOINTMENT type with treatment. |
| 36 | `scheduling/payback-decision-tree` | Full `_canBePaidBack` 11-check decision tree | docs + source | `server/util.jsx:21-214` | `event_payback.md:57-86` | -- | Belgian RIZIV checks: (1) ABSENT/no treatment, (2) no meta.type, (3) no treatment found, (4) supplementary insurance + non-SESSION, (5) age >= 18 for b.2/b.3/f, (6) evolution bilan count, (7) missing/unreimbursed bilan, (8) 1/day cap (Brussels timezone), (9) 5/week cap, (10) per-type max (INITIAL_BILAN:5, EVOLUTION_BILAN:1, PARENT_SITTING:10, BILAN_RELAPSE:2), (11) bracket cap via sessionsLeft. Cross-area with #7 Reimbursement Tracking and #14 Mutualistic Billing. |
| 37 | `scheduling/payback-manual-override` | Manual `hasPayBack` toggle on edit page | docs + source | `AppointmentEventPage.jsx:617-633` | `event_payback.md:92-104` | -- | Switch on appointment edit page. Re-runs `_canBePaidBack` on server. Turning off always allowed; turning on constrained. |
| 38 | `scheduling/payback-cascade-on-demotion` | Cascade promote next event when hasPayBack flipped off | docs + source | `server/util.jsx:322-336` | `event_payback.md:126-129` | -- | When true->false, server finds next non-paid event in same day/week and re-evaluates. Does NOT cascade on removal. QUIRK-PRESERVE: deletion leaving stale `hasPayBack: false` is known behavior. |
| 39 | `scheduling/payback-invoiced-pinning` | Invoiced events pinned (hasPayBack frozen) | docs + source | `events.jsx:9-12`, `AppointmentEventPage.jsx:160-163` | `event_payback.md:117-118` | -- | `invoiceId` prevents deletion AND edit of most fields. `hasPayBack` frozen. Cross-area with #11 Smart Invoicing. |
| 40 | `scheduling/session-counting` | Session count computation per event | docs + source | `events.jsx:49-119, 1442-1457` | `session_counting.md:18-39` | -- | SESSION: 1 (30min subType) or 2 (60min subType). INITIAL_BILAN: ceil(duration/30). EVOLUTION_BILAN: 1. PARENT_SITTING: 1 (GROUP) or 2 (INDIVIDUAL). BILAN_RELAPSE: duration/30 (no ceil). EVALUATION_SESSION: 0. Cross-area with #7 Reimbursement Tracking. |
| 41 | `scheduling/colour-coding-per-type` | Default color from agenda settings per event type | docs + source | `EventAddBox.jsx:123-143` | `calendar_overview.md:87-88`, `agenda_settings.md:32-34` | -- | New events inherit color from `agendaSettings.colorAppointment/Meeting/Private/Consultation`. Fallback to theme primary. |
| 42 | `scheduling/colour-override-per-event` | Per-event color override | docs + source | `EventAddBox.jsx`, all edit pages | `calendar_overview.md:87-88` | -- | Color picker on create dialog and every edit page. |
| 43 | `scheduling/fade-past-events` | Fade past events (opacity toggle) | docs + source | `Calendar.jsx:252, 269` | `calendar_overview.md:91-92`, `agenda_settings.md:29` | -- | When `agendaSettings.fadeEventsBefore` is true, past events rendered with reduced opacity. |
| 44 | `scheduling/agenda-settings-hour-range` | Hour range display filter | docs + source | `Calendar.jsx:222-232`, `CalendarPage.jsx:246-260` | `calendar_overview.md:58-60`, `agenda_settings.md:23-24` | -- | `useStartEnd` + `startHour` + `endHour`. HIDES events outside range (not just constrains the grid). Out-of-range-events guard on settings change. |
| 45 | `scheduling/agenda-settings-opens-at` | Calendar scroll position on load | docs + source | `CalendarPage.jsx:195-222` | `calendar_overview.md:62-66`, `agenda_settings.md:26-27` | -- | Three modes: start (scroll to min), current_time (scroll to now), custom (scroll to openHour). |
| 46 | `scheduling/agenda-settings-custom-range-days` | Custom range days (2-6) | docs + source | `CalendarPage.jsx:87-89`, `SettingsPage.jsx:92-97` | `agenda_settings.md:28` | -- | Dropdown on settings page. |
| 47 | `scheduling/agenda-settings-export-ical` | iCal feed export | docs + source + helpdesk | `server/rest.jsx`, `SettingsPage.jsx:113-125` | `agenda_settings.md:80-88`, `agenda_scheduling.md:127-167` | -- | Master switch `exportAgenda`. Private/public feed split. Per-user `privateAgendaKey` / `publicAgendaKey` on PracticeUsers. Public feed excludes type 3 (PRIVATE). Content-type `text/calendar` via `ics` package. |
| 48 | `scheduling/agenda-settings-out-of-range-guard` | Out-of-range events confirmation guard | docs + source | `agendaSettings/methods.js:17-48`, `SettingsPage.jsx:176-189, 324-346` | `agenda_settings.md:48-50` | -- | When `useStartEnd` changes, counts events outside new range. If non-zero and `confirmed !== true`, throws `"events_outside_of_constraints"`. Client shows confirmation dialog. |
| 49 | `scheduling/agenda-settings-autosave` | Debounced auto-save on settings page | docs + source | `SettingsPage.jsx:148-167` | `agenda_settings.md:78` | -- | No "Save" button. All changes auto-save on form change. |
| 50 | `scheduling/rosa-connect` | Connect to Rosa with integration token | docs + source | `users/methods.jsx:355-384`, `rosa-users.ts` | `rosa_integration.md:226-234` | -- | Paste token, verify organization match, resolve hpId + calendarId, initial pull+push. NOT OAuth2. Cross-area with #18 External Platform Sync. |
| 51 | `scheduling/rosa-disconnect` | Disconnect from Rosa | docs + source | `users/methods.jsx:385-404` | `rosa_integration.md:79` | -- | Sets `tokenInvalid: true` locally. Does NOT call any Rosa endpoint to revoke. |
| 52 | `scheduling/rosa-multi-calendar-select` | SelectCalendarDialog for multiple Rosa calendars | docs + source | `select-calendar-dialog.jsx`, `rosa-users.ts:85-87` | `rosa_integration.md:26-27, 140-141` | -- | Shown when Rosa returns `FOUND_MULTIPLE_CALENDARS_FOR_HP`. User picks one. |
| 53 | `scheduling/rosa-sync-patients-ondemand` | On-demand patient sync with Rosa | docs + source | `patientFiles/methods.jsx:1001-1019` | `rosa_integration.md:83-84` | -- | Button on Rosa page. Pull then push. |
| 54 | `scheduling/rosa-sync-events-ondemand` | On-demand event sync with Rosa | docs + source | `events/methods.js:593-611` | `rosa_integration.md:85-86` | -- | Button on Rosa page. Pull then push. |
| 55 | `scheduling/rosa-cron-pull` | 5-minute cron pull from Rosa | docs + source | `practice/server/hooks.js:72-139` | `rosa_integration.md:198-203` | -- | `setInterval` every 300,000ms. Per-practice, per-user. Skipped when `Meteor.settings.disableRosaSync`. Architectural target: lambda (deprecation_list #21). |
| 56 | `scheduling/rosa-push-on-mutation` | Real-time push to Rosa on every event mutation | docs + source | `methods.js:39,68,75,197,251,348`, `rosa-events.ts:324-328` | `rosa_integration.md:90, 120-121` | -- | Fire-and-forget `setTimeout(1)`. Errors logged, not surfaced to UI. |
| 57 | `scheduling/rosa-requires-review` | Review flow for pulled-in Rosa data | docs + source | `rosa-events.ts:222-226` | `rosa_integration.md:205-212` | -- | `requiresReview: true` on imported events. UI shows alert on AppointmentEventPage with SelectTreatmentDialog. |
| 58 | `scheduling/rosa-token-invalidation` | Token invalidation on 401/403 | docs + source | `rosa/server/api/util.ts` | `rosa_integration.md:181-182` | -- | Sets `tokenInvalid: true`. Status flips to "Token ongeldig" (red). |
| 59 | `scheduling/rosa-status-indicators` | Rosa page status display | docs + source | `rosa-page.jsx:99-159` | `rosa_integration.md:17-24` | -- | Green/red connection status. Last sync timestamps (red if >30 min stale). Token input when disconnected. |
| 60 | `scheduling/event-state-absent` | Mark event as ABSENT | docs + source | `events.jsx:206-215` | `event_payback.md:62` | -- | `state: 2` (ABSENT). Blocks `hasPayBack` (first check in `_canBePaidBack`). |
| 61 | `scheduling/permission-create-colleague-event` | Permission: create event on colleague's calendar | docs + source | `methods.js:22-31` | `event_types.md:80-85`, `calendar_overview.md:96-101` | -- | Type 1/4: requires `practice.events.add.otherUser`. Type 2/3: flat 401 (cannot create on colleague's calendar even with permission). |
| 62 | `scheduling/permission-subscription-gate` | Active subscription required for event creation | docs + source | `Calendar.jsx:180-182` | `calendar_overview.md:99` | -- | `openAddEvent` silently short-circuits when `hasActiveSub === false`. Cross-area with #20 SaaS Lifecycle. |
| 63 | `scheduling/group-add-patient` | Add patient to existing group event | docs + source | `methods.js:355-400`, `GroupEventPage.jsx:215-235` | `group_events.md:50-58` | -- | "+" button on GroupEventPage. Fetches eligible patients (same treatment type, not already in group). Clones event, overrides patientFileId and treatmentId, recomputes hasPayBack. |
| 64 | `scheduling/group-per-sibling-payback` | Per-sibling independent hasPayBack in groups | docs + source | `methods.js:313-320` | `group_events.md:62-63`, `event_payback.md:140-141` | -- | `hasPayBack` update targets single event by `_id`, not group. Each patient can be independently reimbursable. |
| 65 | `scheduling/group-edit-propagation` | Group edit propagates to all siblings (except payback/patient/treatment) | docs + source | `methods.js:313-338` | `group_events.md:60-63` | -- | `Events.update({groupId}, $set, {multi: true})`. `patientFileId` and `treatmentId` stripped from $set. |
| 66 | `scheduling/group-no-recurring` | Group events cannot recur | docs + source | `server/util.jsx:545`, `EventAddBox.jsx:600` | `group_events.md:109-113` | -- | `repeatId` forced to null on create. Repeat toggle hidden for GROUP subtype. |
| 67 | `scheduling/group-calendar-rendering` | Group events render as single block on calendar | docs + source | `Calendar.jsx:233-278` | `group_events.md:15-16` | -- | Groups by `groupId`, shows one entry titled "GROUP_APPOINTMENT". |
| 68 | `scheduling/event-title-fallback` | Title fallback to patient name for type 1/4 | docs + source | `methods.js:421-426`, `rest.jsx:74` | `event_types.md:148-149` | -- | If `title` is empty, UI substitutes `patientFile.name()`. Title field hidden in create dialog for type 1/4. |
| 69 | `scheduling/teammeeting-collection-abandoned` | `teammeeting` collection is independent and abandoned | docs + source | `practice/teammeeting.jsx` | `team_meetings_in_calendar.md:14-29`, `deprecation_list.md #20` | -- | Two parallel models with no link. `teammeeting` is deprecated. **DO NOT PORT** per deprecation_list #20. |
| 70 | `scheduling/monkey-calendar-dead` | `monkey-calendar/` folder is dead code | docs + source | `modules/monkey-calendar/` | `deprecation_list.md #4` | -- | jQuery UI datepicker locale files for non-existent `fullcalendar.min.js`. **DEAD CODE -- DO NOT PORT** per deprecation_list #4. |

**70 features in this area** (including 2 deprecated/dead). HalingoDoc's 8 dedicated feature files + helpdesk provided ~90% of feature discovery. Meteor source walk verified all HalingoDoc claims and uncovered 2 minor undocumented items (`SettingsView.jsx` component, `EventAddBoxSharePatientFiles`).

---

## Cross-references to other areas

- **#1 Identity Management:** the RBAC permission `practice.events.add.otherUser` gates colleague calendar access, therapist switching, and cross-user event creation. The `practiceUsers` publication feeds the therapist picker in the toolbar.
- **#2 Practice Branding:** `currentPracticeId` set in the practice context scopes the entire calendar. Practice switching re-subscribes all publications.
- **#3 Patient Data Privacy:** patient file linking on events (`patientFileId`). The dragbox lists all practice patient files. Event creation dialog selects patient files. GroupEventPage shows patient list per sibling.
- **#6 Treatment Planning:** treatment-linked events via `treatmentId`. Bilan-dependent payback checks (checks #6, #7 in `_canBePaidBack`). Treatment type drives appointment type/subtype/location dropdown options. `END_DATE_PAYBACK` recurrence type reads bilan end date and sessionsLeft. `requiresReview` events need treatment selection.
- **#7 Reimbursement Tracking:** `hasPayBack` is the bridge between events and the RIZIV bracket. Session counting (`sessionCount` field) decrements the per-treatment allowance. The `_canBePaidBack` decision tree encodes RIZIV convention rules. Cross-area with mutualistic billing.
- **#9 Clinical Reporting:** session counts derived from events feed the RIZIV session graph and practice analytics.
- **#11 Smart Invoicing:** `invoiceId` on events creates a hard linkage. Invoiced events cannot be deleted or edited (form disabled, delete button disabled). `commissionInvoiceId` for commission invoicing. Events surface in the uninvoiced events list for patient invoicing.
- **#14 Mutualistic Billing:** RIZIV session caps per pathology (`Events.getAppointmentTypes()` max values), session counting toward brackets, and the `hasPayBack` flag directly feed verzamelstaat generation.
- **#15 Precision Printing:** certificates/getuigschriften linked to events/invoices require event data.
- **#18 External Platform Sync:** Rosa bidirectional sync for events (push on mutation, pull on cron). Per-user integration tokens. Motive mapping between Halingo and Rosa event types. `requiresReview` flow for imported events.
- **#20 SaaS Lifecycle:** active subscription required for event creation (`hasActiveSub` gate), Rosa sync methods require active subscription, Rosa connect requires subscription.

---

## [NEEDS CLARIFICATION]

### Q1: `SettingsView.jsx` -- is this an older/unused component?
- **Why it matters:** `SettingsView.jsx` exists at `modules/calendar/components/SettingsView.jsx` but is not referenced in any HalingoDoc file. The current settings page is `SettingsPage.jsx` at `modules/calendar/page/SettingsPage.jsx`. If `SettingsView.jsx` is dead code, it should be flagged as such. If it is used somewhere, it needs documentation.
- **Sources conflict?** No conflict -- HalingoDoc simply does not mention it.
- **What would resolve:** Check if any import references `SettingsView.jsx`. If none, it is dead code.

### Q2: `EventAddBoxSharePatientFiles` -- what is the sharing flow?
- **Why it matters:** This component exists in the create dialog but is not described in any HalingoDoc file. It appears to allow sharing patient files between practices during event creation. Understanding its behavior is needed for the Phase 2 spec.
- **Sources conflict?** No -- HalingoDoc simply does not document it.
- **What would resolve:** Read the component source in detail and/or staging walk with a multi-practice user.

### Q3: Group event -- silent skip on treatment mismatch: is this intentional?
- **Why it matters:** When creating a group event, if a selected patient has no matching treatment type, that patient's sibling event is silently not created. No UI warning. The user can tick 4 patients and get 3 siblings.
- **Sources conflict?** No -- `group_events.md` flags this as needing product validation.
- **What would resolve:** Product owner confirmation.

### Q4: `_canBePaidBack` removal cascade gap -- is the stale `hasPayBack: false` on deletion intentional?
- **Why it matters:** When an event is removed, remaining events are NOT re-evaluated for payback. This can leave a later event incorrectly flagged `hasPayBack: false` that would self-correct on edit. The cascade only fires on update (demotion), not on removal.
- **Sources conflict?** No -- `event_payback.md` flags this as needing product validation.
- **What would resolve:** Product owner confirmation.

### Q5: Invoiced events silently skipped during "remove repeated" -- should the user be warned?
- **Why it matters:** When a user clicks "remove repeated from occurrence X onward", invoiced occurrences in the range are silently untouched (no error, no warning). The user may expect all future events to be deleted but some remain because they are invoiced.
- **Sources conflict?** No -- `recurring_events.md` documents the behavior.
- **What would resolve:** Product owner decision on whether a warning should be shown.

---

## [NEEDS DOMAIN REVIEW]

### DR1: RIZIV "max 5 per week" -- is this a RIZIV rule or a Halingo-specific guardrail?
- **Found in:** `server/util.jsx:133-171` (hard-coded `5`), `event_payback.md:74-76`
- **Why it matters:** The `logopedist-be` skill's reference file `02-prescription-bilan-and-pathology-rules.md` section 4.18 states: "The nomenclature does NOT impose a fixed weekly maximum, but the bilan must specify the proposed frequency, and the medecin-conseil can refuse a plan with an unrealistic frequency (e.g. 5 sessions/week for a learning disorder is generally not approved). In practice, mutualities expect 1-3 sessions/week for most reimbursable pathologies." This suggests the "max 5 per week" is a Halingo product decision, not a hard RIZIV rule. The per-day max of 1 IS codified in Article 36 paragraph 7.
- **What I know:** Article 36 paragraph 7 codifies max 1 individual/collective session per day (with parental-guidance exception). The 5/week appears to be a practical cap. Halingo's implementation treats it as a hard gate in `_canBePaidBack`.
- **Resolution:** The spec should document the 5/week as a **product-level guardrail** (not a RIZIV-mandated cap). The Phase 2 spec author should verify with the product owner whether this should remain a hard gate or become a configurable warning.

### DR2: Evolution bilan -- still billable or abolished?
- **Found in:** `events.jsx:80` (`EVOLUTION_BILAN = 3, sessionCount: 1, max: 1`)
- **Why it matters:** The RIZIV A.R. 4.6.2024 (in force 01/08/2024) **abolished** the evolution bilan as a separately billable code. Codes 702015, 704012, 704115, 706016, 708013 and 710010 were all suppressed. In place, a mandatory "continuous evaluation" occurs during the 2-year treatment period (kept in patient file, not billed). A new code 700991-701002 (long evaluation session, R 35) was introduced for worsening/stagnation/interruption cases.
- **What I know:** Halingo's code still has `EVOLUTION_BILAN` as `meta.type = 3` with `max: 1` and `countsTowardsTotal: false`. This may be stale code that should be deprecated in the port.
- **Resolution:** The spec should flag evolution bilan as **potentially obsolete under current RIZIV rules** and confirm with the product owner whether to keep the type for historical data display or remove it from the create flow.

### DR3: "max 2 video consultations per week" -- confirmed abolished
- **Found in:** `server/util.jsx:172-185` (commented out)
- **Why it matters:** Regulatory compliance.
- **What I know:** The `logopedist-be` skill confirms this was a COVID-era temporary rule, **abolished as of 2026-01-01**. The commented-out code in Halingo is correctly disabled. **Do NOT re-enable.**
- **Resolution:** RESOLVED. Do not port this rule. Remove the commented-out code during migration.

### DR4: Age limit for b.2/b.3/f -- confirm exact cutoff
- **Found in:** `server/util.jsx:67-72`, `event_payback.md:66`
- **Why it matters:** The code uses "patient age >= 18 at event start" as the cutoff. The RIZIV rule says "17 ans revolus" (eve of 18th birthday) for b.2 and b.3 (renewal only -- initial accord has no age limit for b.2), and the same for f (dysphasia). The distinction between "age >= 18" and "17 revolus" is the difference between the birthday itself and the day before.
- **What I know:** Per `02-prescription-bilan-and-pathology-rules.md`: b.2 renewal ends at 18th birthday, b.3 renewal ends at "17 ans revolus" (eve of 18th birthday), f renewal ends at 18th birthday. The code check `age >= 18` effectively means "on or after the 18th birthday", which is correct for "17 revolus" (= reached age 17, i.e., up to the day before the 18th birthday the patient is still eligible).
- **Resolution:** The implementation appears correct. The spec should document the exact cutoff clearly.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/full_documentation/agenda_scheduling.md
/home/tj/HalingoDoc/docs/functional/application_map.md (competency 5)
/home/tj/HalingoDoc/docs/from_source/features/calendar_overview.md
/home/tj/HalingoDoc/docs/from_source/features/event_types.md
/home/tj/HalingoDoc/docs/from_source/features/group_events.md
/home/tj/HalingoDoc/docs/from_source/features/recurring_events.md
/home/tj/HalingoDoc/docs/from_source/features/event_payback.md
/home/tj/HalingoDoc/docs/from_source/features/session_counting.md
/home/tj/HalingoDoc/docs/from_source/features/agenda_settings.md
/home/tj/HalingoDoc/docs/from_source/features/team_meetings_in_calendar.md
/home/tj/HalingoDoc/docs/from_source/features/telehealth_consultation.md
/home/tj/HalingoDoc/docs/from_source/features/rosa_integration.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md
/home/tj/HalingoDoc/docs/from_source/open_questions.md

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/events/events.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/types.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/rest.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/hooks.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/indexes.js
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/rosa-events.ts
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/rosa-events.type.ts
/home/tj/Repos/Halingo-Main/app/imports/api/events/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/api/agendaSettings/agendaSettings.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/agendaSettings/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/agendaSettings/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/CalendarPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/CalendarPageContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/AppointmentEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/MeetingEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/PrivateEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/ConsultationEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/GroupEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/GroupEventPageContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/DefaultEventPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/DefaultEventPageContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/RemoveButtons.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/SettingsPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/page/select-treatment-dialog.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/calendar/Calendar.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomToolbar.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomDayHeader.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomRangeView.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomBackgroundWrapper.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomEventView.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/CustomEventWrapper.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/PatientfileEventsView.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/SettingsView.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/dragbox/CalendarPatientFilesDragBox.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/infobox/EventAddBox.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/infobox/EventAddBoxCheckPayBack.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/infobox/EventAddBoxSharePatientFiles.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/selects/AppointmentTypeSelect.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/selects/PatientFileSelect.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/selects/TherapistSelect.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/calendar/components/selects/TreatmentSelect.jsx
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/agenda.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/simpleSchemas/util.jsx (partial: lines 79-177)
/home/tj/Repos/Halingo-Main/app/imports/lib/util/util.jsx (partial: lines 120-175)
/home/tj/Repos/Halingo-Main/app/imports/modules/forms/forms/RepeatForm.jsx (exists; referenced)
```

---

## Verification notes (verbatim from `01-discovery/multi-view-scheduling.verification.md`)

# Verification: Multi-View Scheduling

- **Verified by:** Codex (cross-CLI verifier per AGENTS.md rule #7)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/multi-view-scheduling.md`
- **Verdict:** PASS WITH NOTES

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Calendar area includes day/week/month/custom-range views, therapist switching, dragbox, opaque colleague view, day-header bulk delete, and session-only view persistence | `calendar_overview.md` | ✓ | Matches the cited HalingoDoc file closely, including the intentional hard-401 note and the negative features (no vacation model, no reminders, no all-day event type). |
| 2 | Event model consists of four core event types plus group events, per-type edit pages, `meta.type/subType/location`, `_cleanEvent`, and `EVALUATION_SESSION` not counting toward brackets | `event_types.md` | ✓ | Accurately reflected. The discovery’s feature inventory maps cleanly onto the HalingoDoc breakdown. |
| 3 | Group events use a fan-out model with `groupId`, multi-patient selection, per-sibling payback, no recurring groups, and silent skip on treatment mismatch | `group_events.md` | ✓ | Fully supported by the cited file. The silent-skip quirk is documented in HalingoDoc and correctly surfaced as a clarification item. |
| 4 | Recurrence is materialized as real event documents linked by `repeatId`, with `repeatDateSchema`, three end types, 300-iteration cap, series-vs-one editing, and invoiced-occurrence skips | `recurring_events.md` | ✓ | Verified. The discovery accurately carries forward the materialized-occurrence model and the invoiced-occurrence behavior. |
| 5 | Agenda settings schema includes `useStartEnd`, open/scroll settings, custom-range days, fade toggle, export toggle, per-type colors, and out-of-range confirmation guard | `agenda_settings.md` | ✓ | Verified. Discovery language is consistent with the HalingoDoc file, including the important “hidden, not deleted” consequence of narrowed hours. |
| 6 | Meeting events are distinct from the abandoned `teammeeting` collection; description-on-create is deprecated; colleague-calendar create/update/remove is a hard 401 | `team_meetings_in_calendar.md`, `deprecation_list.md`, `open_questions.md` | ✓ | Verified. The discovery correctly distinguishes live calendar MEETING events from abandoned `teammeeting` scaffolding. |
| 7 | CONSULTATION (`type === 4`) is narrower than APPOINTMENT, strips `treatmentId`, never contributes to payback, has no treatment selector, and maps to Rosa APPOINTMENT | `telehealth_consultation.md` | ✓ | Verified. The discovery’s distinction between `type === 4` and `location === VIDEO_CONSULTATION` on type-1 events is accurate. |
| 8 | Rosa integration is bidirectional, token-based not OAuth2, supports multi-calendar selection, marks pulled data `requiresReview`, invalidates tokens on 401/403, uses a 5-minute pull cron, and has a 30-day push window | `rosa_integration.md` | ✓ | Verified. The discovery’s Rosa claims are aligned with the HalingoDoc feature file. |
| 9 | `_canBePaidBack` is a load-bearing 11-check gate used by the area and includes day cap, week cap, type caps, bracket cap, supplementary-insurance gate, and age-limit logic | `event_payback.md` | ~ | Verified as legacy-product behavior. One framing issue remains: the discovery sometimes labels the 5/week rule as a Belgian RIZIV rule, while the domain pack supports treating it as a Halingo product guardrail, not a codified Article 36 weekly maximum. |
| 10 | Session counting rules for `SESSION`, `INITIAL_BILAN`, `EVOLUTION_BILAN`, `PARENT_SITTING`, `BILAN_RELAPSE`, and `EVALUATION_SESSION` match the feature inventory | `session_counting.md` | ✓ | Verified. The discovery accurately carries the mixed duration-based and subtype-based counting model. |
| 11 | `EventAddBoxSharePatientFiles` and `SettingsView.jsx` are source-only additions not described in HalingoDoc | Meteor source only | ✓ | Step C source checks confirm both files exist. The discovery correctly keeps them outside the cited HalingoDoc claims and flags them for clarification instead of overstating documentation coverage. |
| 12 | Out-of-range agenda-settings confirmation and create-dialog conditional rendering are implemented as described | `agenda_settings.md`, `event_types.md`, `telehealth_consultation.md` + Meteor spot-check | ✓ | Step C confirmed the cited behavior in source and the discovery did not over-claim beyond what the docs and source support. |

## Material omissions

No material omissions were found in the rewritten discovery for the load-bearing scheduling behaviors that are needed for Phase 2 spec authoring.

The previously missing areas called out in the older verification state are now covered:

- group-event fan-out and edit model
- recurring-event materialization and series semantics
- agenda-settings schema and out-of-range guard
- create-dialog conditional rendering
- per-type edit pages
- patient dragbox behavior
- payback decision tree and session-count math

The remaining gaps are already explicitly isolated in the discovery under `[NEEDS CLARIFICATION]` rather than silently omitted.

## Cross-area reference check

Accuracy:

- `#1 Identity Management` — accurate. [`identity.md`] now explicitly notes agenda-key ownership and current-practice context consumed by scheduling.
- `#6 Treatment Planning` — accurate in substance. Treatment ownership of `treatmentId`, bilan validity, and recurrence end-at-payback are real dependencies.
- `#7 Reimbursement Tracking` — accurate and strongly mirrored. The reimbursement discovery is effectively the same event/payback/session-count seam from the adjacent area.
- `#11 Smart Invoicing` — accurate and mirrored. `invoiceId`, invoiced-event locking, and event-driven invoice generation are covered on both sides.
- `#18 External Platform Sync` — accurate and mirrored. Rosa event sync and review flow are covered bidirectionally.
- `#20 SaaS Lifecycle` — accurate. Scheduling’s `hasActiveSub` gate is real and the SaaS discovery covers subscription gating elsewhere.

Bidirectionality:

- Bidirectional coverage is **not uniform** across all referenced areas.
- `#3 Patient Data Privacy`, `#9 Clinical Reporting`, `#14 Mutualistic Billing`, and `#15 Precision Printing` do not currently mirror this area’s dependency as explicitly as the scheduling discovery mirrors them.
- This is a documentation-network issue, not a factual error in `multi-view-scheduling.md`.

## Domain review (logopedist-be)

Reviewed against:

- `/home/tj/.claude/skills/logopedist-be/references/01-riziv-nomenclature-and-tariffs.md`
- `/home/tj/.claude/skills/logopedist-be/references/02-prescription-bilan-and-pathology-rules.md`

Results:

1. **Per-day cap**
   - The discovery’s “max 1 per day” treatment is consistent with the domain pack’s reading of Article 36 §7.
   - Verified as a plausible regulatory-backed rule.

2. **Age limit for treatment types `b.2`, `b.3`, `f`**
   - The discovery correctly surfaces the legacy code’s `age >= 18` cutoff and separately notes the “17 ans revolus” nuance.
   - This is acceptable as written; the discovery’s own domain-review note handles the nuance correctly.

3. **Max 5 per week**
   - The discovery correctly identifies this in legacy behavior, but its feature note and some summary wording risk implying it is a codified Belgian/RIZIV rule.
   - The domain pack says Article 36 does **not** impose a fixed weekly maximum; this is better treated as a Halingo product guardrail.
   - Disposition: **CLARIFY**, not blocker, because the discovery itself already raises DR1 and does not hide the uncertainty.

4. **Evolution bilan**
   - The discovery correctly reflects the legacy code and HalingoDoc behavior.
   - The domain pack confirms separate billable evolution-bilan codes were abolished by the 2024 reform.
   - This is a Phase 2 spec concern: preserve for historical parity vs suppress in future-state behavior.
   - Disposition: **CLARIFY**.

5. **Disabled “max 2 video consultations per week”**
   - The discovery correctly states this is disabled and should not be re-enabled.
   - Consistent with the domain pack and HalingoDoc Q10 triage note.

## Escalated source checks (Step C)

Step C was used selectively for claims that were load-bearing and stronger than the HalingoDoc prose alone.

1. **`app/imports/api/events/server/util.jsx`**
   - Confirmed `_canBePaidBack` structure, Brussels-local day cap, 5/week hard gate, age cutoff, supplementary-insurance rule, group fan-out branch, `repeatId: null` for GROUP, and `_cleanEvent` stripping behavior.

2. **`app/imports/api/events/methods.js`**
   - Confirmed hard-401 behavior for MEETING/PRIVATE on colleague calendars, group delete branch, recurring-delete skip of invoiced occurrences, and colleague-permission checks.

3. **`app/imports/modules/calendar/components/infobox/EventAddBox.jsx`**
   - Confirmed default color selection, conditional field rendering by event type, and repeat-toggle hiding for GROUP.

4. **`app/imports/api/agendaSettings/methods.js`**
   - Confirmed the `events_outside_of_constraints` guard and the exact triggering condition when `useStartEnd` or range bounds change.

No Step C check contradicted the discovery.

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-multi-view-scheduling-01 | CLARIFY | domain | The discovery accurately documents the legacy 5/week payback gate, but some phrasing risks presenting it as a codified Belgian/RIZIV rule. The domain pack supports treating it as a Halingo product guardrail instead. | Keep discovery; Phase 2 spec must label 5/week as legacy-product behavior unless product/domain review says otherwise. |
| V-multi-view-scheduling-02 | CLARIFY | domain | `EVOLUTION_BILAN` is correctly documented as legacy behavior, but current Belgian rules abolished the separately billable evolution bilan. | Phase 2 spec must decide whether this remains historical-display behavior only or stays user-creatable for parity. |
| V-multi-view-scheduling-03 | NOTE | cross-area | Cross-area references from this discovery are accurate, but bidirectional linking is incomplete in several peer discovery files (`#3`, `#9`, `#14`, `#15`). | No block on Phase 2 for this area; tighten the linked areas opportunistically. |

## Recommendation

**PROCEED to Phase 2** for this area.

The rewritten discovery is materially sound and covers the load-bearing scheduling behaviors needed for spec authoring. Phase 2 should carry forward two explicit domain clarifications:

- treat the legacy 5/week cap as a **legacy product rule**, not automatically as a RIZIV-mandated rule
- treat `EVOLUTION_BILAN` as **legacy behavior requiring an explicit parity-vs-modernization decision**
