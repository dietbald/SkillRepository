# Team meetings on the calendar (event type 2)

> **Triage notes (2026-04-07):**
> - The earlier draft flagged "MeetingEvent description on create is dropped" as a bug. Q9 of [`../open_questions.md`](../open_questions.md): "We don't use that". The description-on-create feature is unused and being removed; see [`../deprecation_list.md` #14](../deprecation_list.md).
> - The earlier draft flagged "hard 401 when creating an event on a colleague's calendar even with `practice.events.add.otherUser`" as a bug. Q8 confirmed this is intentional validation: "We still check on that field for validation". Not a bug.
> - Note: this page documents calendar **MEETING events** (`events.type === 2`). The unrelated `teammeeting` collection (a separate, abandoned scaffold) is documented in [`team_meetings.md`](team_meetings.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — see `../../full_documentation/general_getting_started.md` (the concept of "overzicht teamvergadering" appears in navigation but the calendar MEETING event page is not described).

## What it is

`event.type === 2` is the MEETING kind — a scheduled block on a therapist's calendar labelled as a team meeting, administrative block, training, or any other non-patient-facing commitment. It is the simplest billable-adjacent event: title + time + optional colour + optional description.

There is also a separate `teammeeting` MongoDB collection (`app/imports/api/practice/teammeeting.jsx`) that models a structured team meeting with agenda, date, participants, and location. The workflow agent documents that collection from a different angle. **This file focuses on the calendar `events` row with `type === 2` — the two are not linked.**

## Two parallel models

| | `events` collection (`type: 2`) | `teammeeting` collection |
|---|---|---|
| File | `app/imports/api/events/events.jsx` | `app/imports/api/practice/teammeeting.jsx` |
| Collection name | `events` | `teammeeting` |
| Purpose | Occupies a slot on a therapist's calendar | Tracks attendance and location of a practice-wide team meeting |
| Participants | Single `userId` | `participants: String[]` array of user ids |
| Agenda / notes | `description` (free text) | None visible in schema |
| Appears on the calendar grid | Yes | No direct linkage |
| Appears in "Overzicht teamvergadering" page | No | Yes (`TeamMeeting.filters = { done, tocome }`) |

> **Important:** nowhere in the codebase does a `teammeeting` row reference an `events._id` nor vice versa. They are independent. A practice that uses both has to create each side separately. No server-side hook mirrors one into the other.

Grep evidence: `TeamMeeting.` appears in `teammeeting.jsx`, `ui/pages/practices/PracticesOverviewPage.jsx`, `lib/search-indexes/teamMeeting.jsx`, and `startup/server/index.js`. It is never imported from anywhere under `app/imports/api/events`.

## Where it lives in the UI

- **Create** — `EventAddBox` modal (`EventAddBox.jsx:462-475`). The `SelectToggle` offers MEETING as option 2.
- **Detail/edit** — `MeetingEventPage` (`app/imports/modules/calendar/page/MeetingEventPage.jsx`), dispatched from `DefaultEventPage.jsx:40-42`:
  ```js
  case 2:
    eventPage = MeetingEventPage;
    break;
  ```
- **Grid rendering** — no special treatment. A MEETING event shows as an opaque block with the `title` on the grid, coloured by `event.color` or the fallback `agendaSettings.colorMeeting`.

## Data model

### Required
`events.jsx:1197-1205`:
- `title` is **required** for MEETING via the custom validator `if (type !== 1 && type !== 4) return "required"`.
- `start` / `end` — with the end-after-start check at lines 1212-1216.
- `type: 2`.
- `userId`, `createdAt`.

### Forbidden / ignored
The `requiredForAppointment` validator (`events.jsx:1183-1188`) does NOT require `patientFileId` or `practiceId` for MEETING. In practice `EventAddBox.getEvent()` still sets `practiceId` at line 356 so the event is scoped to the current practice, but a MEETING can theoretically exist without one.

`_cleanEvent` at `server/util.jsx:417-430`:
```js
if (event.type !== 1 && event.type !== 5) {
  cleanedEvent = _.pick(event, commonFields);
}
```
where `commonFields = ["title", "color", "start", "end", "type", "repeatId", "repeat", "createdAt", "userId", "rosaId", "rosaMotiveId", "fromRosa", "requiresReview"]` (line 401-415).

This means when a MEETING passes through `_createEvent`, **everything except those common fields is stripped**. `patientFileId`, `treatmentId`, `meta`, `price`, `kmCompensation`, `hasPayBack`, `sessionCount`, `description`, `practiceId`, `therapyPlan` — all dropped.

> ⚠️ Observation: the MeetingEventPage's form includes `description` (`MeetingEventPage.jsx:49-54`). But because `_cleanEvent` strips it on create, a description entered in the create dialog never persists. On *update*, `events.update` uses the full modifier so `description` does survive. The create-time bug is real and should be flagged.

## Methods (Meteor)

Standard `events.create`, `events.update`, `events.update.startAndEnd`, `events.remove`.

Permission branching on MEETING is the strictest of any type: `methods.js:22-31`
```js
if (this.userId !== dirtyEvent.userId && dirtyEvent.userId) {
  if (
    [2, 3].indexOf(dirtyEvent.type) > -1 ||
    !PracticeUsersUtil.checkUserPermission("practice.events.add.otherUser", ...)
  ) {
    throw new Meteor.Error(401);
  }
}
```

Type 2 (and type 3) are hard-blocked on another user's calendar. Even a user with `practice.events.add.otherUser` **cannot create a MEETING on a colleague's calendar** — they can only create it on their own. Updating and removing follow the same rule.

The subscription guard `subscription({ event }) { return event.type !== 3; }` (`methods.js:96, 143, 216, 277, 366`) — note this only excludes PRIVATE, not MEETING — means MEETING events still emit subscription events normally, so colleagues see them via `eventsBetweenPrivate` (see below).

## Publications

MEETING events on another user's calendar are served by `eventsBetweenPrivate` (`publications.js:34-49`):
```js
return Events.find(query, { fields: { start: 1, end: 1, userId: 1, type: 1 }});
```

So when you view a colleague's agenda, you see their MEETING blocks as opaque grey rectangles — visible *that* they are busy, invisible *why*. Title, description, and color are not published.

## User-visible behaviour

### `MeetingEventPage` form
`app/imports/modules/calendar/page/MeetingEventPage.jsx:44-54`:
```js
formGroup = new FormGroup({
  end: new FormControl(),
  start: new FormControl(),
  color: new FormControl(),
  title: new FormControl(),
  description: new FormControl(),
  meta: new FormGroup({
    location: new FormControl()
  })
}, simpleSchemaValidator(Events.schema));
```

The page renders a single `Box` ("EVENT_DETAILS") containing:
- Title input (`forms.events.title`).
- Start/end pickers.
- Colour picker.
- Description textarea.

`meta.location` is in the form group but has no rendered input. Unused field.

If `event.repeatId` is set, the top-of-page `EVENT_HAS_REPEAT_DESCRIPTION` toggle is rendered.

`RemoveButtons` at the bottom offers single + "remove repeated" as usual.

### Colour
Defaulted from `agendaSettings.colorMeeting` at create time (`EventAddBox.jsx:134-135`).

### No patient / no treatment selector
The create dialog hides the patient, treatment, appointment-type, appointment-subtype, location, price, km, and repeat sections for MEETING. Only title, start/end, colour stay visible. The `_cleanEvent` strip confirms the server treats meetings as lightweight blocks.

### Description save bug
The create dialog does not show a description field for MEETING (the textarea only appears on the edit page). Even if it did, `_cleanEvent`'s `_.pick` would drop it before insert. Opening a newly created meeting and typing a description there *does* save because update is exempt from the pick.

> ⚠️ Behaviour inferred from code; needs product validation.

## Permissions

- **Create**: only the target user can create a MEETING on their own calendar. `practice.events.add.otherUser` does NOT unlock this for MEETING (`methods.js:22-31`).
- **Update/remove**: same rule — even with the permission, you cannot touch a colleague's MEETING.
- **Read**: your own MEETING events are fully readable; a colleague's MEETING events are exposed only as opaque time blocks.

This is stricter than APPOINTMENT and CONSULTATION.

## Notable details

### Rosa mapping
`rosa-events.ts:24-29`:
```js
[HalingoEventType.MEETING]: RosaTypes.EventType.LEAVE,
```
— a MEETING appears in Rosa as a "leave" (absence) entry, not as an appointment. This is the same mapping as PRIVATE. Rosa cannot distinguish between the two.

### No link to the `teammeeting` collection
A MEETING calendar event is **not** the same thing as a `teammeeting` row. Creating a MEETING does not create a `teammeeting`, and scheduling a `teammeeting` does not create a MEETING on anyone's calendar. The navigation item "Overzicht teamvergadering" (`nl.i18n.js:178`) points at a team-meetings page that reads from the `teammeeting` collection; that page is not documented here because it is not a calendar event feature.

If a practice wants a team meeting to show on every participant's calendar, they must create N MEETING events manually (one per participant), because each user can only create a MEETING on their own calendar.

### Subscription guard
The `subscription` option on `events.update` et al. returns `event.type !== 3`. A MEETING therefore does *publish* over Meteor's pub/sub during update — but the publication `eventsBetweenPrivate` hides sensitive fields. PRIVATE events take an even harder route (no DDP emission to other users at all).

### Why MEETING and PRIVATE both have no `meta`
`_cleanEvent` collapses both to the `commonFields` pick. In theory you can set `meta.location` on a meeting and it will survive an *update*, but not a *create*. The form has a FormControl for it that is never rendered.

### `repeat` is supported
Unlike GROUP events, MEETING events can repeat (`RepeatForm` is not hidden in `EventAddBox` for MEETING). A recurring weekly staff meeting is legal.

### `title` is required but has no default
Creating a MEETING with an empty title fails the schema validation (`events.jsx:1200-1205`). The EventAddBox shows a title input for non-appointment types (`EventAddBox.jsx:477-481`).

## Helpdesk overlap

The helpdesk index includes "Overzicht teamvergadering" as a navigation item pointing at the team-meetings collection page. The calendar MEETING event type is not described as such. No helpdesk article explains the hard block on creating MEETING events on colleagues' calendars.

## Source files

- `app/imports/api/events/events.jsx:35-38` — `Events.types[2]`.
- `app/imports/api/events/events.jsx:1183-1205` — MEETING title-required / patient-not-required.
- `app/imports/api/events/server/util.jsx:401-430` — `commonFields` + `_cleanEvent` stripping for non-type-1/5.
- `app/imports/api/events/methods.js:22-31` — hard 401 for MEETING on another user.
- `app/imports/api/events/server/publications.js:34-49` — `eventsBetweenPrivate` opaque block for colleagues.
- `app/imports/api/events/server/rosa-events.ts:24-29` — MEETING → LEAVE Rosa mapping.
- `app/imports/modules/calendar/page/MeetingEventPage.jsx` — the edit form.
- `app/imports/modules/calendar/page/DefaultEventPage.jsx:40-42` — dispatch.
- `app/imports/api/practice/teammeeting.jsx` — unrelated structured team-meeting collection (distinct from MEETING events).
