# Calendar overview

> **Triage notes (2026-04-07):**
> - The earlier draft flagged "hard 401 when creating an event on a colleague's calendar even with `practice.events.add.otherUser`" as a bug. Q8 of [`../open_questions.md`](../open_questions.md) confirmed this is intentional validation: "We still check on that field for validation". Not a bug.
> - The earlier draft flagged the disabled "max 2 video consultations per week" rule as a bug. Q10 confirmed this was temporary: "That was only temporary". The rule is no longer in force; the i18n strings will be cleaned up separately.
> - Vacation / blocked-time is still a confirmed gap — no model exists in code; workaround is PRIVATE / MEETING events.
> - Patient appointment reminders are still a confirmed gap — no `APPOINTMENT_REMINDER` email type exists.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered — see `../../full_documentation/calendar_appointments.md`.

## What it is

The `agenda` screen is Halingo's operational heart: a day / week / month view of everything a therapist does (`Events.types`: APPOINTMENT, MEETING, PRIVATE, CONSULTATION). It is built on `react-big-calendar` with a drag-and-drop HOC (`app/imports/modules/calendar/calendar/Calendar.jsx:6-14`). The calendar view is per-user and per-practice: the currently selected *praktijk* (from the app top bar) scopes the data (`CalendarPageContainer.jsx:75-81`).

## Where it lives in the UI

- Route: `/agenda`, name `agenda` (`app/imports/startup/client/routes/agenda.jsx:16-27`).
- Page: `CalendarPage` (`app/imports/modules/calendar/page/CalendarPage.jsx`).
- Container: `CalendarPageContainer` (`app/imports/modules/calendar/page/CalendarPageContainer.jsx`).
- Wraps `HalingoCalendar` (`app/imports/modules/calendar/calendar/Calendar.jsx:409`), itself a `react-big-calendar` + `@nhn/react-big-calendar/dragAndDrop` wrapped view.
- Sub-routes:
  - `/agenda/settings` (`agendaSettings`), `SettingsPage`.
  - `/agenda/events/:eventId` (`eventView`), `DefaultEventPageContainer` which hands off to `AppointmentEventPage`, `MeetingEventPage`, `PrivateEventPage`, or `ConsultationEventPage` based on `event.type` (`DefaultEventPage.jsx:36-49`).
  - `/agenda/groupevent/:groupId` (`groupEventView`), `GroupEventPageContainer`.

## Data model

The calendar itself does not own data. It renders from the `events` collection, scoped by practice / user / time window. Fields consulted by the calendar UI include `start`, `end`, `type`, `meta.type`, `meta.subType`, `meta.location`, `patientFileId`, `groupId`, `repeatId`, `color`, `title`, `invoiceId`, and `hasPayBack`. Full schema in `app/imports/api/events/events.jsx:1196-1349` — see also [event_types.md](event_types.md).

## Methods (Meteor)

Used by the calendar overview (not including per-type edit flows):

| Method | File:line | Purpose |
|---|---|---|
| `events.create` | `app/imports/api/events/methods.js:15-42` | Create a new event. Routes through `EventsUtil.createEvent` and immediately triggers a Rosa push. |
| `events.update.startAndEnd` | `app/imports/api/events/methods.js:203-256` | Drag-and-drop on the calendar calls this. Updates `start` / `end`, runs payback / session-count recalculation, then pushes to Rosa. |
| `events.remove` | `app/imports/api/events/methods.js:79-125` | Remove a single event, an entire repeat series (`repeatId`), or a group event (`groupId`). |
| `events.remove.between` | `app/imports/api/events/methods.js:127-201` | Delete all events for a user in a date window. Used by the day-header popup "Remove all events of this day" (`CustomDayHeader.jsx:53-69`). |
| `events.get.between` | `app/imports/api/events/methods.js:402-428` | Server-side fetch for quick lookups (not the primary agenda subscription). |

## Publications

The calendar UI subscribes to three publications at once through `CalendarPageContainer.jsx:71-96`:

| Publication | File:line | Purpose |
|---|---|---|
| `patientFilesOfPractice` | — | Patient roster for the dragbox and event-add dialog. |
| `eventsBetween(practiceId, start, end, userId)` | `app/imports/api/events/server/publications.js:17-32` | All events for one user within the visible window. When viewing another therapist, the publication restricts to `type: 1` (APPOINTMENT) only. |
| `eventsBetweenPrivate(practiceId, start, end, userId)` | `app/imports/api/events/server/publications.js:34-49` | When browsing another therapist's calendar, supplements `eventsBetween` with opaque non-appointment blocks (`type: { $ne: 1 }`, fields limited to `start/end/userId/type`) — so you can see *that* your colleague is busy without seeing private content. |
| `practiceUsers(practiceId, true)` | — | List of therapists in the practice, for the user-switcher. |

## User-visible behaviour

### View switching
`CalendarPage.jsx:171-193` exposes four views: `month`, `week`, `day`, and `customRange` (a configurable N-day rolling window, 2-6 days, default 3; see `agenda_settings.md`). The current view is persisted via Meteor's `Session.set("calendarView", view)` (`CalendarPage.jsx:306`). Selection happens in `CustomToolbar.jsx:93-111` (desktop dropdown) or the mobile overflow menu (`CustomToolbar.jsx:350-360`).

### Hour range
If `agendaSettings.useStartEnd` is true, events outside `[startHour, endHour]` are **filtered out of the UI** by `Calendar.jsx:222-232`. The calendar itself is constrained by `react-big-calendar` via the `min`/`max` options derived from the same setting (`CalendarPage.jsx:246-260`).

### Opens-at behaviour
On first render the calendar scrolls to a time depending on `agendaSettings.opensAt` (`CalendarPage.jsx:195-222`):
- `start`: scrolls to `min` (the configured start hour).
- `current_time`: scrolls to `new Date()`.
- `custom`: scrolls to the per-user `openHour`.

### Multi-praktijk switching
The `currentPracticeId` prop is injected from the global practice context. When the user changes practice in the top bar, the container resubscribes (`CalendarPageContainer.jsx:75-89`) so the agenda refreshes.

### Switching to another therapist
If the current user has the `practice.events.add.otherUser` permission (`CustomToolbar.jsx:80-86`), a therapist picker appears in the toolbar. Selecting a colleague calls `setUserId` (`CalendarPage.jsx:411`) which flips the `eventsBetween` subscription to that other user. Private content is hidden (see publications above).

### Drag and drop
`Calendar.jsx:133-160` handles `onEventDrop`:
- If the dropped thing is a patient file from the dragbox → open the "add event" dialog pre-filled with that patient, type 1 (APPOINTMENT), selected therapist.
- If the dropped thing is an existing event that was moved → `updateStartAndEndEvent.call({eventId, start, end})`.

### Click-to-create
`onSelectSlot` (`Calendar.jsx:166-173`) opens the `EventAddBox` dialog pre-filled with the clicked slot, `type: 1` (APPOINTMENT) by default.

### Patient-files dragbox
`PatientFilesDragBox` is a sidebar (hidden on mobile) listing all patient files of the current practice. Dragging a patient onto a time slot creates an appointment. Clicking a patient in the dragbox opens the `PatientFileEventsView` — a linear list of that patient's past and future appointments with a "+" button to add a new one (`Calendar.jsx:285-320`).

### Search
No free-text search is wired into the calendar page itself. Filtering by therapist (see above) and by patient (via the dragbox click) is the only built-in narrowing. Full-patient search lives on `/patients`.

### Colour coding
Every event has an optional `color` field. When a new event is created from `EventAddBox`, the default colour is read from `agendaSettings.colorAppointment` / `colorMeeting` / `colorPrivate` / `colorConsultation` based on the selected `type` (`EventAddBox.jsx:123-143`).

### Fade past events
If `agendaSettings.fadeEventsBefore` is true, events whose `end` is before "now" are rendered with a `faded: true` flag (`Calendar.jsx:252, 269`) which reduces their opacity.

### Remove all events of a day
Clicking a day header opens a popover with "Go to day" and "Remove events of this day" (`CustomDayHeader.jsx:95-100`). The latter calls `events.remove.between` for the full day.

## Permissions

- Viewing another therapist's calendar requires `practice.events.add.otherUser` (`CustomToolbar.jsx:80-86`, publications `eventsBetween` / `eventsBetweenPrivate` at `publications.js:19, 36`).
- The practice must have an active subscription for creating new events: `Calendar.jsx:180-182` silently short-circuits `openAddEvent` when `hasActiveSub === false`.
- Moving / deleting events created by another user also goes through `practice.events.add.otherUser` (`methods.js:23-31, 103-112`).

## Notable details

### Vacation / blocked time — not in code
> The Halingo calendar does not have a first-class concept of vacation, holidays, "blocked time", or working-hours availability beyond the global `startHour`/`endHour` display filter in `agendaSettings`. There is no `Vacation` collection, no `Holiday` model, no recurring-unavailability pattern. The closest workaround visible in the code is to create `type: 2` MEETING or `type: 3` PRIVATE events that occupy the slot.

Grep evidence: no matches for `vacation | blockedTime | blockOut | holiday | outOfOffice | unavailable` anywhere under `app/imports` (case-insensitive).

### Patient-facing appointment reminders — not in code
> There is no scheduled job that emails patients an appointment reminder before the session. The only cron jobs in the codebase are:
> - `TreatmentDateObserver` — notifies the *therapist* when a patient's bilan expiry is approaching (`app/imports/api/treatments/server/TreatmentDateObserver.js`).
> - `TreatmentSessionObserver` — notifies the *therapist* when a treatment has few RIZIV sessions remaining (`app/imports/api/treatments/server/TreatmentSessionObserver.js`).
> - Subscription invoice creator (`app/imports/api/subscriptions/server/invoiceCreator.jsx`).
>
> The `Emails` collection (`app/imports/api/emails/emails.ts`) defines only two `EmailType` values: `PATIENT_INVOICE` and `PATIENT_INVOICE_REMINDER` — both invoice-related, neither is an appointment reminder.

Grep evidence: no matches for `appointmentReminder | patientReminder | reminderSchedul | sendReminder` anywhere under `app/imports`. The only `reminder` references are invoice-related (`PatientFileActions.jsx:123,140`).

### Real-time push to Rosa
Every `events.create`, `events.update`, `events.update.startAndEnd`, `events.remove`, and `events.remove.between` ends with a call to `RosaEvents.pushEventsToRosa([...ids])` (`app/imports/api/events/server/rosa-events.ts:324-413`). This is *push-only*: Halingo is the source of truth for its events, Rosa is mirrored from it. A separate pull pass (`pullEventsForUser`, `rosa-events.ts:53-262`) runs on explicit sync only; it does not run on calendar navigation.

### All-day events
There is no distinct "all-day" event type in the schema. The allDay message comes from `ALL_DAY: "Dag"` (`nl.i18n.js:1223`) and maps to react-big-calendar's default all-day lane behaviour. A quirk in `Calendar.jsx:186-189` bumps `seconds` by 1 on slot creation to prevent react-big-calendar from misinterpreting equal-start-and-end as an all-day event.

### Session-based view persistence
`currentDate` and `currentView` are stored in `Session.get/set('calendarDate'/'calendarView')` (`CalendarPage.jsx:64-68, 298-310`). This is in-memory only; closing the tab loses the state.

### iCal export
See [agenda_settings.md](agenda_settings.md#export-agenda-ical-feed).

## Helpdesk overlap

The helpdesk articles at `full_documentation/calendar_appointments.md` cover the day/week/month switching, creating appointments, drag-drop, and event colours at a surface level. They do not document:
- The multi-therapist view and the `eventsBetweenPrivate` privacy split.
- The "remove all events of this day" day-header action.
- The fact that the iCal export key is per-user and unique (`PracticeUsers.privateAgendaKey`).
- The absence of vacation blocking and patient reminders.

## Source files

- `app/imports/modules/calendar/page/CalendarPage.jsx`
- `app/imports/modules/calendar/page/CalendarPageContainer.jsx`
- `app/imports/modules/calendar/calendar/Calendar.jsx`
- `app/imports/modules/calendar/components/CustomToolbar.jsx`
- `app/imports/modules/calendar/components/CustomDayHeader.jsx`
- `app/imports/modules/calendar/components/CustomRangeView.jsx`
- `app/imports/modules/calendar/components/CustomBackgroundWrapper.jsx`
- `app/imports/modules/calendar/components/CustomEventView.jsx`
- `app/imports/modules/calendar/components/CustomEventWrapper.jsx`
- `app/imports/modules/calendar/components/CustomDragAndDropCalendar.jsx`
- `app/imports/modules/calendar/components/PatientfileEventsView.jsx`
- `app/imports/modules/calendar/components/infobox/EventAddBox.jsx`
- `app/imports/modules/calendar/components/dragbox/CalendarPatientFilesDragBox.jsx`
- `app/imports/api/events/events.jsx`
- `app/imports/api/events/methods.js`
- `app/imports/api/events/server/publications.js`
- `app/imports/startup/client/routes/agenda.jsx`
