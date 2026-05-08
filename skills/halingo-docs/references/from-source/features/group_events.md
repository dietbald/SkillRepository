# Group events

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: **not mentioned** in the helpdesk export. Verify against running app before promoting to `manual/`.

## What it is

A group event is a single scheduled session attended by multiple patients. Under the hood there is **no** 1-to-many patient field on the `events` collection — instead Halingo creates N sibling event documents (one per patient), all sharing the same `groupId` string. The group page reassembles them into a single editor.

The trigger for creating a group event is choosing `meta.subType === "GROUP"` in the create dialog. The server then enters a dedicated branch that picks up every selected patient file, finds a matching treatment per patient, and fan-outs the event.

## Where it lives in the UI

- **Create** — `EventAddBox` (`app/imports/modules/calendar/components/infobox/EventAddBox.jsx`). When the selected treatment type allows a GROUP subtype (for example `b.1` where `1.GROUP.*` codes exist — see `treatments.js:385-390`), the `AppointmentTypeSelect` + `SelectWithSearch` combination offers `GROUP` as a subtype. When chosen, the `PatientFileSelect` flips to `multi` (line 496) so the user can pick several patients.
- **View / edit** — route `/agenda/groupevent/:groupId`, name `groupEventView` (`app/imports/startup/client/routes/agenda.jsx:53-63`). Component: `GroupEventPage` via `GroupEventPageContainer`.
- **On the calendar grid**, all siblings of a group render as a single visual block — `Calendar.jsx:233-278` groups by `groupId` and shows one entry titled `"GROUP_APPOINTMENT"` for each group.

## Data model

No dedicated collection. Group events are regular `events` rows with:

- `groupId: String, optional` (`events.jsx:1294-1297`). All siblings share the same value. Generated server-side as `new Mongo.ObjectID()._str` (`server/util.jsx:544`).
- `meta.subType: "GROUP"` on each sibling.
- Different `patientFileId` and `treatmentId` per sibling.
- `repeatId: null` — explicitly nulled (`server/util.jsx:545`) because recurring group events are not supported:

```js
// server/util.jsx:542-546
if (_.get(event, "meta.subType") === "GROUP") {
  _.assign(event, {
    groupId: new Mongo.ObjectID()._str,
    repeatId: null, // We do not want to add repeat to this event, would be a lot of extra work
  });
```

All other fields (start, end, userId, color, treatment type) are copied from the base event.

## Methods (Meteor)

### `events.create` — GROUP branch
`EventsUtil._createEvent` in `server/util.jsx:516-576`:

1. The dialog sends `patientFileId` as an array.
2. If `meta.subType === "GROUP"`, it generates `groupId`.
3. It fetches all `Treatments` with the base treatment's `type` for the given patient files.
4. For each patient id in the array, it finds the matching treatment and calls `_addEvent` with the clone. If a patient has no treatment of that type, it is silently skipped.
5. Returns an array of the created event ids.

> ⚠️ **Behaviour inferred from code; needs product validation.** Silently dropping a patient with no matching treatment means the user can tick 4 patients and end up with 3 siblings without any UI warning.

### `events.add.patientFile`
`methods.js:355-400` adds another patient to an existing group event *after* creation:

1. Fetches one event of the group (`Events.findOne({groupId})`).
2. Requires `practice.events.add.otherUser` if the event is on another user's calendar.
3. Finds a treatment on the new patient whose `type` matches the original group's treatment type.
4. Clones the event, overrides `patientFileId` and `treatmentId`, recomputes `hasPayBack`, and inserts.

The UI entry point is the "+" button in the patient list on `GroupEventPage` (`GroupEventPage.jsx:215-235`). `findPatientFiles.call({practiceId, treatmentType: treatment.type})` fetches eligible patients; those already in the group are filtered out.

### `events.update` — GROUP branch
`methods.js:313-338`:
- If `fields` contains `hasPayBack`, the update targets only the single event being edited — payback is per-sibling.
- Otherwise, it rewrites `query = { groupId }` and updates all siblings in one `Events.update({groupId}, $set, {multi: true})`. `patientFileId` and `treatmentId` are stripped from the `$set` so they cannot be accidentally unified across the group.

### `events.remove` — GROUP branch
`methods.js:115-118`:
```js
if (groupId) {
  _.each(Events.find({ groupId }).fetch(), (event) => {
    removeTheEvent(event);
  });
}
```
All siblings are removed. Each call to `removeTheEvent` will `Events.remove({_id})` (if not invoiced) and push the deletion to Rosa.

## Publications

`groupEventsAndPatientFilesAndTreatments` at `events/server/publications.js:102-133`. `publishComposite`:

1. Finds one event where `{groupId}` matches, to derive `userId`/`practiceId`.
2. Enforces `practice.events.add.otherUser` if the viewer is not the event owner.
3. Publishes:
   - `Events.find({groupId})` — all siblings.
   - For each sibling: its `PatientFiles` doc.
   - For each sibling: its `Treatments` doc.

Used by `GroupEventPageContainer.jsx:15`.

## User-visible behaviour

`GroupEventPage.jsx` renders a left-hand list of patients (`getPatientFilesView`, line 115) with a "+" FAB to add a new patient (`showPatientFileAdd`, line 141). Selecting a patient in the list loads that patient's `AppointmentEventInfo` on the right (which is the shared event-details form reused from `AppointmentEventPage`, and wires into `updateEvent` for any field changes).

Key interactions:

- **Adding a patient**: "+" button → popover → fetches eligible patients (same treatment type, not already in group) → clicking one calls `events.add.patientFile`.
- **Removing a patient**: a delete icon next to each patient row calls `removeEvent.call({eventId})` on just that sibling. If the sibling is invoiced, the delete icon is hidden.
- **Editing appointment details** (time, location, price, etc.): changes propagate to *all* siblings via `events.update` with `groupId` (above).
- **Editing `hasPayBack`**: per-sibling, so each patient can be marked reimbursable independently.
- **Removing the whole group**: `RemoveButtons.jsx:17` builds the `{eventId, repeatId, groupId}` payload from the currently-selected sibling. Because `groupId` is always set for a group, the server takes the group-delete branch.
- **If the array of events becomes empty** (e.g. after removing the last patient), the page redirects to `/agenda` (`GroupEventPage.jsx:103-107`).

## Permissions

- Read: whoever can see the event's owner's calendar (see publications).
- Add patient / edit / delete: same logic as a single event (needs `practice.events.add.otherUser` if acting on a colleague's event).

## Notable details

### Recurring groups are impossible
Because `repeatId` is explicitly forced to `null` on GROUP creation (`server/util.jsx:545`), there is no way to make a weekly group session through the standard UI. The recurrence panel in `EventAddBox` is hidden for GROUP too (`EventAddBox.jsx:600`):

```js
{_.get(event, "meta.subType") !== "GROUP" && ( <Switch formControl={hasRepeat} ... /> )}
```

### Patient mismatch on silent skip
If a patient selected in the create dialog does not have a treatment of the base patient's treatment `type`, the sibling for that patient is not created. No error is surfaced to the user. The returned `createdMappedEvents` is flattened with `_.flatten`, which drops `undefined` entries.

### `patientFileId` in `events.add.patientFile`
The server throws if the target patient has no matching treatment because `treatmentOfPatient._id` will be undefined (`methods.js:384-395`). There is no explicit user-facing error — the caller's callback receives a generic exception.

### Group and repeat are mutually exclusive
On the server, **create** forces `repeatId: null` for GROUP. On the server, **update** restricts modifier fields when `repeatId` is present (`methods.js:282-285`) but group logic is a different branch. Edit code cannot turn a normal recurring event into a group or vice versa.

### Group events bypass `canBePaidBack` per-sibling
`_canBePaidBack` in `server/util.jsx:21-214` is called with a single event and its treatment. For group creation, `hasPayBack` is computed per sibling in the fan-out loop (`server/util.jsx:557-569`). The 5-per-week and 1-per-day checks are per-patient, which is correct.

### Title on the calendar grid
Shows as translated `"GROUP_APPOINTMENT"` (`Calendar.jsx:268`), not the individual patient name.

## Helpdesk overlap

The helpdesk export does not describe group events. Sessions with multiple patients are not discussed in any of the scraped articles. `general_getting_started.md` mentions multi-patient appointments only in French passing references without walkthrough. This is a genuine documentation gap.

## Source files

- `app/imports/api/events/events.jsx` — `groupId` in schema.
- `app/imports/api/events/methods.js` — `events.create`, `events.update`, `events.remove`, `events.add.patientFile`.
- `app/imports/api/events/server/util.jsx` — `_createEvent` GROUP branch (lines 542-575).
- `app/imports/api/events/server/publications.js:102-133` — `groupEventsAndPatientFilesAndTreatments`.
- `app/imports/modules/calendar/page/GroupEventPage.jsx` — multi-patient editor.
- `app/imports/modules/calendar/page/GroupEventPageContainer.jsx` — withTracker wrapper.
- `app/imports/modules/calendar/calendar/Calendar.jsx:233-278` — grouping logic in the grid.
- `app/imports/modules/calendar/components/infobox/EventAddBox.jsx` — GROUP subtype handling in the create dialog.
- `app/imports/modules/calendar/page/RemoveButtons.jsx` — passes `groupId` to `events.remove`.
