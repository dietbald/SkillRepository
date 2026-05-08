# Telehealth consultation (event type 4)

> **Triage notes (2026-04-07):**
> - The earlier draft flagged the disabled "max 2 video consultations per week" rule as a bug. Q10 of [`../open_questions.md`](../open_questions.md): "That was only temporary". The rule is no longer in force; the i18n strings will be cleaned up separately.
> - `VideoConsultationCode = 792433` was confirmed as still current under De Conventie 2024 (Q30: "Same").
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: only the `VIDEO_CONSULTATION` *location* (a sub-field of regular sessions) is mentioned; the standalone `type === 4` page is undocumented.

## What it is

"Consultation" is the fourth event type in `Events.types` (`app/imports/api/events/events.jsx:43-46`) and exists alongside APPOINTMENT, MEETING, and PRIVATE. It is Halingo's concept for a scheduled video consultation (telelogopedie/vidéoconsultation) that does NOT link to a treatment plan — it lives in a thin, standalone calendar item dedicated to drop-in or first-contact teleconsults.

Confusingly, there are **two ways** to model a video session in Halingo:

1. **Regular APPOINTMENT (`type === 1`) with `meta.location === 6` (VIDEO_CONSULTATION)** — a normal session that counts against the bracket, uses the regular nomenclature codes mapped through `Treatments.getDisorderCodes()` for the `VIDEO_CONSULTATION` location key.
2. **CONSULTATION (`type === 4`)** — a standalone calendar block that is NOT tied to a treatment, has its own narrower form, and is billed through a different nomenclature code (`Treatments.VideoConsultationCode = 792433`, `treatments.js:353`).

This document covers the second form (`type === 4`).

## Where it lives in the UI

- **Create dialog** — `EventAddBox` (`app/imports/modules/calendar/components/infobox/EventAddBox.jsx`). The four-way `SelectToggle` at line 462 includes CONSULTATION. When selected:
  - Patient and therapist selects are still shown (lines 482-502).
  - **No** treatment dropdown (the `event.type === 1 && isSpeechTherapist` guard at line 504 excludes type 4).
  - **No** appointment-type dropdown (`event.type === 1` guard at line 517).
  - **No** appointment-subtype dropdown (same guard at line 540).
  - Location, price, km compensation, and colour are all still shown (the `event.type === 1 || event.type === 4` guards at lines 551, 562, 574).
- **Detail/edit page** — `ConsultationEventPage` (`app/imports/modules/calendar/page/ConsultationEventPage.jsx`), dispatched from `DefaultEventPage.jsx:46-48`:
  ```js
  case 4:
    eventPage = ConsulationEventPage;  // sic: typo in the export name
    break;
  ```

## Data model

Consultations reuse the `events` schema but only populate a subset:

- `type: 4`
- `patientFileId`, `practiceId` — required by `requiredForAppointment` validator (`events.jsx:1183-1188`) because 1 and 4 both need a patient.
- `userId`, `start`, `end`, `color`, `state`
- `meta.location` — single field, one of the six locations. In practice `VIDEO_CONSULTATION` is the intended value but the schema does not enforce it (any location is valid).
- `price`, `kmCompensation`
- `rosaId`, `rosaMotiveId`, `fromRosa`, `requiresReview` — Rosa integration breadcrumbs.

### Fields explicitly stripped from consultations
`_cleanEvent` at `server/util.jsx:417-430`:
```js
if (event.type === 4) {
  cleanedEvent = _.omit(event, "treatmentId");
}
```

And `_createEvent` at `server/util.jsx:523-527`:
```js
if (type === 4 && dirtyEvent.meta) {
  dirtyEvent.meta = {
    location: dirtyEvent.meta.location,
  };
}
```
— any other `meta.*` fields sent by the client are dropped. Consultations cannot carry `meta.type` or `meta.subType`.

**Consequences:**
- `_canBePaidBack` returns `false` immediately because `!data.treatmentId` is hit at `server/util.jsx:23`.
- `getSessionCount()` returns `0` because `this.type === 1` is false (`events.jsx:1443`).
- Consultations do **not** decrement any patient's RIZIV bracket.

## Methods (Meteor)

Standard `events.create` / `events.update` / `events.update.startAndEnd` / `events.remove`. No telehealth-specific method exists. The per-type permission branching in `methods.js:22-31` treats type 4 the same as type 1 (needs `practice.events.add.otherUser` to act on a colleague's event).

## Publications

Covered by the same `eventsBetween` and `eventWithPatientFileAndTreatment` publications as other event types. The Treatment child of the composite publication is empty for consultations (no `treatmentId`).

## User-visible behaviour

### The `ConsultationEventPage` form
`app/imports/modules/calendar/page/ConsultationEventPage.jsx:99-111`:
```js
formGroup = new FormGroup(
  {
    end: new FormControl(),
    color: new FormControl(),
    start: new FormControl(),
    userId: new FormControl(),
    price: new FormControl(),
    kmCompensation: new FormControl(),
    meta: new FormGroup({
      location: new FormControl()
    })
  },
  simpleSchemaValidator(Events.schema)
);
```

Just seven fields, no title, no description, no therapy plan, no appointment type/subtype, no `hasPayBack`, no treatment.

The page renders (`ConsultationEventPage.jsx:223-485`):
- Patient avatar and contact panel (left).
- `PatientFileEventsView` with the patient's other events (right).
- Time pickers.
- Location select (all 6 Halingo locations, not restricted to VIDEO_CONSULTATION).
- Price + km compensation.
- `RemoveButtons`.

There is no tab for therapy notes and no "this event has repeats" toggle either — the `repeatId` branch is still honoured via the top-level `event.repeatId &&` check (line 242) but the consultation form does not expose a create-time recurrence selector in the standard flow.

### Creation flow
From the calendar, clicking a slot opens `EventAddBox` with `type: 1` pre-selected. The user flips the `SelectToggle` to CONSULTATION, fills in patient + location + time, and saves. On submit, `EventAddBox.getEvent()` (lines 328-359) builds:
```js
return {
  title: data.title || "",
  patientFileId: ...,
  treatmentId: this.isSpeechTherapist() ? ... : null,
  userId: data.therapist,
  end, start,
  type: 4,
  meta: { location },
  price, kmCompensation, practiceId, color,
  repeat: data.hasRepeat ? this.repeat : null,
};
```

Note: `treatmentId` may be *set* in the payload — but the server's `_cleanEvent` will strip it.

### Meeting link / video call generation
There is **no** code in the Halingo repo that generates a video call URL, creates a Jitsi / Zoom / Google Meet session, or sends a join link. The `description` field is free text. If the therapist is using a telehealth tool, they put the URL there manually. This is confirmed by the absence of any telehealth-provider SDK import in `package.json` (no `twilio`, no `zoom`, no `daily.co`, no `dyte`, no `whereby`) and no meeting-link method in `app/imports/api/events/methods.js`.

> ⚠️ Behaviour inferred from code (absence of evidence); needs product validation.

### Code routing for billing
`Treatments.VideoConsultationCode = 792433` (`treatments.js:353`) is a single hard-coded nomenclature code used **only** when the consultation is expressed as a type-1 session with `meta.location = 6` against a treatment of type `a` (see `DEFAULT.6`, `treatments.js:834-843`). For the standalone `type === 4` consultation, the invoicing path goes through `event.getInsurancePrices()` like any other session, but because there is no treatment, no per-disorder code is looked up — the therapist must set `price` manually.

In the `invoices` module, `type === 4` events are included via the generic `{ patientFileId, invoiceId: null }` query in `_getUninvoicedEvents` (`util.jsx:70-92`), so they can be added to a patient invoice. They are not excluded anywhere. A consultation with `price > 0` shows up in the uninvoiced events list.

### Rosa mapping
`rosa-events.ts:24-29`:
```js
[HalingoEventType.CONSULTATION]: RosaTypes.EventType.APPOINTMENT,
```

So in Rosa, a Halingo CONSULTATION surfaces as a regular APPOINTMENT (not LEAVE). The reverse mapping in `mapRosaEventToHalingo` (lines 654-750) uses the practice's `rosaMotives`: if the Rosa motive's `type === SESSION_NO_PAYBACK` or if there is no configured motive at all, it maps back to a Halingo CONSULTATION rather than an APPOINTMENT (`rosa-events.ts:662-668`).

Selecting the motive id when pushing a consultation to Rosa (`rosa-events.ts:803-805`):
```js
event.type === HalingoEventType.CONSULTATION
  ? practice.rosaMotives.find((motive) => !motive.subType && !motive.type)?.rosaId
  : null;
```
— a "bare" motive with no subtype/type on the practice record.

## Permissions

Same as APPOINTMENT.

## Notable details

### `type === 4` ≠ "video consultation"
Naming is confusing. `Events.types[4].text = "CONSULTATION"`, and the HalingoEventType enum calls it `CONSULTATION`. `Events.getLocations()[6].text = "VIDEO_CONSULTATION"`. A Halingo APPOINTMENT held at `location === 6` is the common way to do a video session; `type === 4` is the less common "drop-in teleconsult without a treatment context".

### No session counting, no RIZIV bracket
Because `_cleanEvent` strips `treatmentId`, a consultation is invisible to the RIZIV ledger. Every consultation is effectively a private-pay session unless the practice links it to an invoice manually. See [session_counting.md](session_counting.md).

### Consultations on another user's calendar
`practice.events.add.otherUser` applies. There is no "consultation-only" permission.

### No repeat logic skipping
Consultations can technically use the recurrence form (`EventAddBox.jsx:600-614` — the switch is hidden for GROUP, not for CONSULTATION), but the create code path runs through `_repeatEvent` which only sets `hasPayBack` and `sessionCount` when `type === 1` and a treatment is set. So a recurring consultation is allowed and simply generates N payback-less events.

### `_cleanEvent` also retimes by duration
`server/util.jsx:425-428`:
```js
if (event.type === 1 && !isNaN(cleanedEvent.duration)) {
  cleanedEvent.end = moment(cleanedEvent.start).add(cleanedEvent.duration, "minutes").toDate();
}
```
This retime-by-duration block is explicitly `type === 1` only. Consultations use the literal `start` / `end` the client sent.

## Helpdesk overlap

The helpdesk export discusses *video consultation* as a `location` choice and walks through how to pick it on a session. The standalone `type === 4` CONSULTATION is not documented — it is unclear whether it is a legacy pathway, a fallback for non-speech-therapist users, or actively promoted as a distinct feature. This is a documentation gap worth raising with product.

## Source files

- `app/imports/api/events/events.jsx:43-46` — type enum.
- `app/imports/api/events/events.jsx:137-176` — `getLocations()` with VIDEO_CONSULTATION at 6.
- `app/imports/api/events/server/util.jsx:417-430` — `_cleanEvent` strips treatmentId for type 4.
- `app/imports/api/events/server/util.jsx:519-527` — `_createEvent` strips non-location meta for type 4.
- `app/imports/api/treatments/treatments.js:353` — `VideoConsultationCode` constant.
- `app/imports/modules/calendar/page/ConsultationEventPage.jsx` — full edit form.
- `app/imports/modules/calendar/page/DefaultEventPage.jsx:46-48` — type → page dispatch.
- `app/imports/modules/calendar/components/infobox/EventAddBox.jsx:482-585` — create dialog type-4 branches.
- `app/imports/api/events/server/rosa-events.ts:24-29, 662-668, 803-805` — Rosa mapping.
