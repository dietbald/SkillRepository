# Event types

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for APPOINTMENT (`1`); partial for the other three — see `../../full_documentation/calendar_appointments.md`. Verify against running app before promoting to `manual/`.

## What it is

Everything in the `events` collection is one of four discrete *kinds* enumerated at `app/imports/api/events/events.jsx:30-47` (and mirrored as TypeScript enum `HalingoEventType` at `app/imports/api/events/server/rosa-events.type.ts:1-6`):

| `type` code | Constant | Text | UI page | Billable? | Patient linked? |
|---|---|---|---|---|---|
| `1` | `APPOINTMENT` | *afspraak* | `AppointmentEventPage` | yes | yes |
| `2` | `MEETING` | *vergadering* | `MeetingEventPage` | no | no |
| `3` | `PRIVATE` | *privé afspraak* | `PrivateEventPage` | no | no |
| `4` | `CONSULTATION` | *consultatie* (video) | `ConsultationEventPage` | yes | yes |

`Events.types = { 1: { value:1, text:"APPOINTMENT" }, 2: { value:2, text:"MEETING" }, 3: { value:3, text:"PRIVATE" }, 4: { value:4, text:"CONSULTATION" } }` (`events.jsx:30-47`).

Each type has its own dedicated **detail/edit page**. The router uses `DefaultEventPage` as a switch that delegates based on `event.type` (`DefaultEventPage.jsx:29-52`):

```js
case 1: eventPage = AppointmentEventPage; break;
case 2: eventPage = MeetingEventPage; break;
case 3: eventPage = PrivateEventPage; break;
case 4: eventPage = ConsulationEventPage; break;
```

The **create dialog** (`EventAddBox`) renders a `SelectToggle` with all four values (`EventAddBox.jsx:462-475`) and shows or hides sub-fields conditionally on `event.type === 1 || event.type === 4`.

## Where it lives in the UI

- Create: `EventAddBox` modal (`app/imports/modules/calendar/components/infobox/EventAddBox.jsx`), opened from the calendar grid or patient dragbox.
- Edit per type:
  - `app/imports/modules/calendar/page/AppointmentEventPage.jsx`
  - `app/imports/modules/calendar/page/MeetingEventPage.jsx`
  - `app/imports/modules/calendar/page/PrivateEventPage.jsx`
  - `app/imports/modules/calendar/page/ConsultationEventPage.jsx`
  - `app/imports/modules/calendar/page/GroupEventPage.jsx` (type 1 with `groupId`)

## Data model

### Fields common to all types

Schema at `app/imports/api/events/events.jsx:1196-1349`:

- `title` — required for types 2 and 3; optional for 1 and 4 (inherited from patient file name).
- `start`, `end` — `end` must be after `start` (`events.jsx:1212-1216`).
- `type` — the number above.
- `state` — 1 (`OK`) or 2 (`ABSENT`) from `Events.states` (`events.jsx:206-215`).
- `userId`, `practiceId` — therapist and practice context.
- `description`, `color`, `createdAt`, `removed`, `removedAt`.
- `rosaId`, `rosaMotiveId`, `fromRosa`, `requiresReview`, `deletedInRosa` — Rosa integration breadcrumbs.
- `repeatId`, `repeat`, `groupId` — see [recurring_events.md](recurring_events.md) and [group_events.md](group_events.md).

### Fields that depend on `type`

`requiredForAppointment` custom validator (`events.jsx:1183-1188`) enforces:
- `patientFileId` and `practiceId` are required when `type === 1 || type === 4`.
- `title` is required when `type !== 1 && type !== 4`.

The `meta` sub-object (blackbox in schema, but with allowed-value constraints) holds appointment typology:
- `meta.type` — the *appointment type* (SESSION=1, INITIAL_BILAN=2, EVOLUTION_BILAN=3, PARENT_SITTING=4, BILAN_RELAPSE=5, EVALUATION_SESSION=6). See [session_counting.md](session_counting.md). Required only when `type === 1` and a treatment is selected (`requiredForAppointmentAndTreatment`, `events.jsx:1190-1194`).
- `meta.subType` — `30` / `60` minutes, or `GROUP` / `INDEFINITE` / `INDIVIDUAL`. Required alongside `meta.type`.
- `meta.location` — `OFFICE` (1) / `HOME` (2) / `SCHOOL` (3) / `REVALIDATION` (4) / `HOSPITALISATION` (5) / `VIDEO_CONSULTATION` (6) from `Events.getLocations()` (`events.jsx:137-176`).

### Appointment-only fields (`type === 1`)

- `patientFileId`, `treatmentId` — link to patient dossier and treatment plan.
- `hasPayBack` — is this session reimbursable (counted toward the RIZIV bracket)? See [event_payback.md](event_payback.md).
- `sessionCount` — *cached* session count for this event. See [session_counting.md](session_counting.md).
- `price` (cents), `kmCompensation` (cents).
- `invoiceId`, `commissionInvoiceId` — when the event has been invoiced, these are set and the event becomes read-only (`events.jsx:9-12` removes invoiced events from deletion; `AppointmentEventPage.jsx:160-163` disables the form).
- `therapyPlan` — a per-session text note (see "short therapy" below).

### Consultation-only fields (`type === 4`)

`ConsultationEventPage.jsx:99-111` forms a narrower schema than appointment — it excludes `title`, `description`, `therapyPlan`, and `hasPayBack`; it only exposes `meta.location`. The `EventsUtil._cleanEvent` server-side (`server/util.jsx:417-430`) explicitly `_.omit(event, "treatmentId")` when `event.type === 4`, i.e. consultations are never linked to a treatment — their nomenclature is handled differently. See [telehealth_consultation.md](telehealth_consultation.md).

## Methods (Meteor)

All four types share the same methods (`events.create`, `events.update`, `events.update.startAndEnd`, `events.remove`). The permission checks branch on type:

- **Type 2 or 3 on another user's calendar** → flat 401 (`methods.js:22-31`). Only the event's own user can touch their MEETING / PRIVATE events, never a colleague even with `practice.events.add.otherUser`.
- **Type 1 or 4 on another user's calendar** → requires `practice.events.add.otherUser` permission.

`events.remove.between` and the subscription filter in `events.remove` (`methods.js:143-145, 216`) both gate on `event.type !== 3`.

## Publications

See `calendar_overview.md#publications`. The key distinction is `eventsBetweenPrivate` (`publications.js:34-49`) which exposes **only** `start / end / userId / type` for non-type-1 events when another user is looking at the calendar — so colleagues see an opaque "busy" block but no title or description.

## User-visible behaviour

### APPOINTMENT (`type === 1`)

The richest page (`AppointmentEventPage.jsx`, ~690 lines). Tabbed:
1. **Appointment info** — patient avatar, time pickers, therapist select (disabled), treatment name (readonly), `AppointmentTypeSelect` driving `meta.type`, `meta.subType` dropdown, location dropdown, price + km compensation, `hasPayBack` switch with `EventAddBoxCheckPayBack` warning block, colour picker.
2. **Therapy** — `therapyPlan` textarea + read-only view of the previous session's therapyPlan (`AppointmentEventPage.jsx:282-295`).

An `invoiceId` being set disables the entire form except the therapy plan (`AppointmentEventPage.jsx:160-163`) and shows a "linked to invoice — view" banner (lines 470-478).

If the event has `repeatId`, a toggle at the top — "Veranderingen maken voor alle herhaalde afspraken" (`EVENT_HAS_REPEAT_DESCRIPTION`, `nl.i18n.js:1297`) — expands the form update to the whole series (`AppointmentEventPage.jsx:346-356`).

If the patient or event is `requiresReview === true` (set by Rosa sync when an event arrives without a matching treatment), an Alert offers "Select treatment" → `SelectTreatmentDialog` (`AppointmentEventPage.jsx:358-419`).

### MEETING (`type === 2`)

Plain form (`MeetingEventPage.jsx`, ~150 lines): `title`, `start`, `end`, `color`, `description`. No patient, no treatment, no `meta`. Used for team meetings, admin blocks, training. Visible to colleagues as an opaque block on the shared-calendar view (via `eventsBetweenPrivate`).

> Note: this is the *calendar event* for a team meeting. There is also a separate `teammeeting` collection (`app/imports/api/practice/teammeeting.jsx`) that models a structured meeting with agenda and attendees — see [team_meetings_in_calendar.md](team_meetings_in_calendar.md).

### PRIVATE (`type === 3`)

Same shape as MEETING but the semantics are "this block is mine, colleagues should not see the title" (`PrivateEventPage.jsx`, ~150 lines). The `events.remove` method's subscription check uses `event.type !== 3` (`methods.js:96, 143, 216`) — meaning no permission check is run for deleting your own private events. Colleagues can still see the block via `eventsBetweenPrivate` but with only `start/end/userId/type` — no title, no description.

### CONSULTATION (`type === 4`)

Telehealth session. The create dialog still asks for patient, therapist, start/end, and location, but **no treatment dropdown, no `meta.type`, no `meta.subType`** — only `meta.location` (`EventAddBox.jsx:482-516`, only shows the treatment/subtype fields when `type === 1`). On the edit page the form is similarly narrower (`ConsultationEventPage.jsx:99-111`). See [telehealth_consultation.md](telehealth_consultation.md).

### GROUP (1 with `groupId`)

When the create dialog's `meta.subType === "GROUP"`, the server generates a `groupId`, splits the event into N siblings (one per selected patient file, all sharing the same `groupId`, each with its own `treatmentId`), and sets `repeatId: null` (`server/util.jsx:542-575`). The edit page for a group event is `GroupEventPage`. See [group_events.md](group_events.md).

## Permissions

`PracticeUsersUtil.checkUserPermission` is called three times in `methods.js`:
- `events.create` (`methods.js:22-31`): blocks create of type 2/3 on another user flat; blocks type 1/4 without `practice.events.add.otherUser`.
- `events.update*` (`methods.js:221-233, 293-305`): requires `practice.events.add.otherUser` to edit another user's events.
- `events.remove` (`methods.js:103-112, 164-172`): same.

## Notable details

### The four types are modelled in the same collection
There is no separate `Meetings` or `PrivateBlocks` collection. Everything is in `events`. The trade-off is simple UI routing at the cost of schema noise (every MEETING row has `patientFileId`, `treatmentId`, `hasPayBack`, `sessionCount` columns that are always null).

### EVALUATION_SESSION (`meta.type === 6`)
Events with `meta.type = 6` are rendered and counted as sessions but never count toward the RIZIV bracket — `sessionCount: () => 0` and `countsTowardsTotal: false` (`events.jsx:108-117`). Not exposed in the create dialog's subtype picker but legal in the schema. Likely a historical artefact.

### Rosa mapping
The Rosa integration maps Halingo types to Rosa types like this (`rosa-events.ts:24-29`):
```js
[HalingoEventType.APPOINTMENT]: RosaTypes.EventType.APPOINTMENT,
[HalingoEventType.MEETING]: RosaTypes.EventType.LEAVE,
[HalingoEventType.PRIVATE]: RosaTypes.EventType.LEAVE,
[HalingoEventType.CONSULTATION]: RosaTypes.EventType.APPOINTMENT,
```
— MEETING and PRIVATE both surface in Rosa as "leave". This is worth flagging: a private block in Halingo becomes indistinguishable from a holiday in Rosa.

### Title fallback
For type 1 and 4 events, if `title` is empty the UI substitutes `patientFile.name()` (`methods.js:421-426`; `rest.jsx:74`). This is why the title field disappears from the create dialog when type is 1 or 4 (`EventAddBox.jsx:477-481`).

### Required-field custom validators
- `requiredForAppointment` (`events.jsx:1183-1188`): `patientFileId`, `practiceId` required when `type === 1 || type === 4`.
- `requiredForAppointmentAndTreatment` (`events.jsx:1190-1194`): `meta.type`, `meta.subType`, `meta.location` required when `type === 1` AND `treatmentId` is set. So a type-1 event *without* a treatment (allowed for therapists whose profession is not `SPEECH_THERAPIST`) does not need to pick an appointment subtype.

## Helpdesk overlap

The helpdesk covers the APPOINTMENT flow end-to-end (create, bilan selection, price, reimbursement) but only mentions MEETING and PRIVATE in passing. CONSULTATION (telehealth) is mentioned as a location choice (`VIDEO_CONSULTATION`) but the `type === 4` variant with its separate page is not called out at all.

## Source files

- `app/imports/api/events/events.jsx` — `Events.types`, schema, helpers.
- `app/imports/api/events/server/rosa-events.type.ts` — enum definitions.
- `app/imports/api/events/methods.js` — create/update/remove with per-type permission checks.
- `app/imports/api/events/server/util.jsx` — `_cleanEvent` per-type field stripping.
- `app/imports/modules/calendar/page/DefaultEventPage.jsx` — type → page router.
- `app/imports/modules/calendar/page/AppointmentEventPage.jsx`
- `app/imports/modules/calendar/page/MeetingEventPage.jsx`
- `app/imports/modules/calendar/page/PrivateEventPage.jsx`
- `app/imports/modules/calendar/page/ConsultationEventPage.jsx`
- `app/imports/modules/calendar/page/GroupEventPage.jsx`
- `app/imports/modules/calendar/components/infobox/EventAddBox.jsx` — unified create dialog.
