# Event payback (hasPayBack flag)

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: mentioned tangentially when discussing sessions done at an external practice, but never as a named field. Verify against running app before promoting to `manual/`.

## What it is

`hasPayBack` is a boolean on every `events` row that answers the question: "should this session count against the patient's RIZIV session bracket and appear in the insurance statements?" In practice it is the single switch that decides whether an appointment is reimbursable under *De Conventie* for that patient.

The default is computed automatically at creation time based on a long chain of validation rules (`_canBePaidBack` — see below). The therapist can also toggle it manually in the appointment edit page; each flip cascades to re-evaluate the next eligible event in the same day/week.

## Where it lives in the UI

- **Create dialog** — `EventAddBoxCheckPayBack` (`app/imports/modules/calendar/components/infobox/EventAddBox.jsx:610-614`) shows a status banner explaining *why* an appointment will or will not be reimbursed. Only rendered for `type === 1` or `type === 4`.
- **Edit — appointment page** — `AppointmentEventPage.jsx:617-633` renders a `Switch` bound to `hasPayBack` (label: `forms.events.hasPayBack` → "Heeft terugbetaling", `nl.i18n.js:107`) when a treatment is linked. Below it, when the flag is true, `EventAddBoxCheckPayBack` shows the constraint summary.
- **Group event page** — each sibling event has its own payback switch (see [group_events.md](group_events.md)); updating one does not touch the others.

## Data model

```js
// events.jsx:1302-1306
hasPayBack: {
  type: Boolean,
  optional: true,
  defaultValue: false,
},
```

Only meaningful on `type === 1` APPOINTMENT events. For other types the field is either absent or ignored (MEETING, PRIVATE, CONSULTATION skip the `_canBePaidBack` path in `_createEvent`, `server/util.jsx:536`).

## Methods (Meteor)

### `events.canBePaidBack` — `methods.js:493-512`
Runs `_canBePaidBack(event, true, treatment)` and throws the first violated constraint as a `Meteor.Error`. Called by `EventAddBoxCheckPayBack` to render a human-readable explanation. Validates additionally that the treatment has a valid bilan covering the event's start (lines 499-507).

### Implicit — at every create/update/remove
`_createEvent` sets the initial value:
```js
// server/util.jsx:536
hasPayBack: treatment && event.type === 1 && _canBePaidBack(event),
```

`_updateOnEventChange` recomputes on every edit and, if the flag changed from true → false, looks for the **next** non-paid event in the same day/week window and re-runs the check on it (`server/util.jsx:322-336`). This is a cascading pre-emption: when an earlier event is demoted, the next one in line is "promoted" into its slot.

### `events.remove` / `events.remove.between` — no recomputation cascade
When an event is removed, the payback of remaining events is **not** recomputed (only commission / session-count observers fire). In principle this means deleting a "max 5 per week" blocker could leave a later event incorrectly flagged `hasPayBack: false`. This would only self-correct on the next edit of that later event.

> ⚠️ Behaviour inferred from code; needs product validation.

## What "payback" actually means

The term is overloaded in the Halingo codebase:

1. **`hasPayBack: boolean` on an event** — "counts toward the patient's RIZIV total" (this file).
2. **`payback` / `payback_with` inside `Events.getPrices()`** — the reimbursement *amount* (in cents) the insurer returns for a session at a given location and date, used to pre-fill the price on new appointments (`events.jsx:244-1180` — the big versioned price table).
3. **Helpdesk usage** — colloquially, "payback" refers to sessions completed at a different practice that still count for the same patient's bracket. In code this is modelled by creating an event that is NOT linked to a treatment at your practice but which still decrements the bracket. The `_canBePaidBack` function does not have a "foreign practice" flag; the mechanism in code is rather *always-on*: any `type === 1` event pointing at a treatment and passing the caps will count.

## The `_canBePaidBack` decision tree

`app/imports/api/events/server/util.jsx:21-214`. Ordered checks, short-circuits on the first failure:

### Absolute blockers
1. `data.state === 2` (ABSENT) or no `treatmentId` → `false` (line 23).
2. No `meta.type` (appointment type) → `false` (line 34).
3. No treatment found → `false` (line 57-59).
4. Treatment type is `supplementaryInsurance` and `meta.type !== 1` → `false`. Supplementary insurance covers only pure sessions (line 62-64).
5. Treatment type in `["b.2", "b.3", "f"]` AND patient age ≥ 18 at the event start → `false`, error `errors.payback.ageLimit` (line 67-72). Hard-coded list at `server/util.jsx:16`.

### Bilan-dependent checks
6. If `type.bilanType === "evolution"` → count reimbursed evolution bilans on the treatment; allow only as many evolution sessions as there are reimbursed evolution bilans (line 77-79).
7. If `type.bilanType` is any of `initial` / `relapse` / `extension` → look up that bilan on the treatment. If it is missing → `errors.bilan.notFound`; if it exists but `isReimbursed === false` → `errors.bilan.notReimbursed` (line 80-85).

### Per-day cap
8. Except for `PARENT_SITTING` (4) and `INITIAL_BILAN` (2), only **one** reimbursable event per patient+treatment per Brussels-local day. `meta.type` 4 and 6 are excluded from the counting. Exceeding → `errors.session.max1SessionPerDay` (line 91-128).

### Per-week cap
9. For all types, **at most 5** reimbursable events per patient+treatment per calendar week (Monday-Sunday). Exceeding → `errors.session.max5SessionsPerWeek` (line 133-171).

> A commented-out rule enforces a "max 2 video consultations per week" cap (lines 172-185). Not currently active.

### Per-type max
10. If the appointment type has a `max` (INITIAL_BILAN: 5, EVOLUTION_BILAN: 1, PARENT_SITTING: 10, BILAN_RELAPSE: 2), the sum of already-reimbursed events of that type must leave enough headroom for this event's `sessionCount`. Exceeding → `errors.session.maxSessionsOfTypeReached` (line 191-203).

### Bracket cap
11. `TreatmentsUtil.getSessionsLeft(treatment) >= (event._id ? 0 : event.getSessionCount(treatment, true))`. On create (no `_id`) the sessions-left must be at least as big as the new event's session count. On update (has `_id`) any non-negative remainder passes. Exceeding → `errors.session.maxSessionsReached` (line 205-211).

Only if **all** checks pass does the function return `true`.

## User-visible behaviour

### Automatic on create
The user does not toggle anything when first creating an event. The server decides based on the checks above. If the flag ends up `true`, the calendar grid UI has no special marker — it is implicit.

### Manual override on edit
`AppointmentEventPage.jsx:617-626` exposes a `Switch`:
```jsx
<Switch
  formControl={this.formGroup.get("hasPayBack")}
  space
  reverse
  label="forms.events.hasPayBack"
/>
```

Turning it off manually is always allowed. Turning it back on is constrained — when the user flips the switch, the server's `_updateOnEventChange` re-runs `_canBePaidBack`; if the checks would forbid it, the flag silently stays `false` and the next event may get promoted.

### Status banner
`EventAddBoxCheckPayBack` (not read above, but referenced in the create dialog and the appointment page) shows a localized message matching the raised `errors.session.*` keys. These are defined in `nl.i18n.js:1175-1186`:

```
max1SessionPerDay: "Maximum 1 afspraak per dag"
max5SessionsPerWeek: "Maximum 5 afspraken per week"
max2VideoSessionsPerWeek: "Maximum 2 video consultaties per week"
maxSessionsOfTypeReached: "Maximum bereikt van dit type afspraak"
maxSessionsReached: "Maximum aantal sessies bereikt voor deze stoornis"
```

### Invoiced events are pinned
Events with an `invoiceId` are excluded from the `Events.remove` override (`events.jsx:9-12`) and from the editable set on the edit page. Their `hasPayBack` can no longer be toggled — it is frozen as part of the invoice.

## Permissions

`hasPayBack` toggling is part of `events.update`; standard practice-events permission applies. There is no separate permission for "override reimbursement".

## Notable details

### The cascade on demotion
When you toggle a reimbursable event to `hasPayBack: false`, the server tries to find the next non-paid event in the same day or week and sets *its* flag to the result of a fresh `_canBePaidBack` check (`server/util.jsx:326-333`). This keeps the maximum utilisation rolling forward without user intervention.

The cascade does not happen on *removal*, only on update. See "no recomputation cascade" above.

### Video consultation bookkeeping
Type-4 CONSULTATION events are explicitly excluded from the per-day cap via `meta.type !== 4` (`server/util.jsx:91, 105`). They are included in the per-week cap. But because `event.type === 4` events are never linked to a treatment (`_cleanEvent` strips `treatmentId` at `server/util.jsx:419`), they also never pass the "has treatmentId" gate — which means `hasPayBack` on a consultation is always `false`. Reimbursement for video consultations is handled via the `VIDEO_CONSULTATION` nomenclature codes on the patient's normal SESSION events instead of the consultation object.

### The supplementaryInsurance exception
`supplementaryInsurance` is a pseudo treatment type used when a patient has an extra private insurance policy (*aanvullende verzekering*) that pays on top of RIZIV. Only pure SESSION (`meta.type === 1`) events are eligible; bilans under supplementary insurance do not pay back (`server/util.jsx:62-64`). The nomenclature code is literally `"AV"` (`treatments.js:762-806`) instead of an integer RIZIV code.

### Sessions in another practice
The helpdesk term "payback" for externally-completed sessions is not modelled as a flag. In code, you create a normal APPOINTMENT at your practice, possibly with state ABSENT or with a manual `hasPayBack: true`, and the bracket decrements regardless of where it was actually performed. There is no "completed at another practice" field.

### `hasPayBack` on a group event is per-sibling
`events.update` with a `groupId` *and* a `hasPayBack` field in the modifier explicitly targets the single event by its `_id`, not the group (`methods.js:314-320`). This means each patient in a group can have its own reimbursement flag.

### The "max 2 video/week" rule is commented out
Note the disabled block at `server/util.jsx:172-185`. The code comment shows the cap existed in an earlier version but was removed. Therapists can currently do unlimited video sessions within the 5-per-week cap.

### `errors.payback.ageLimit` message
Hardcoded in `nl.i18n.js:1159-1162` as "De patiënt is ouder dan 18 jaar", matching the `TreatmentTypesWithAgeLimit = ["b.2", "b.3", "f"]` constant. A comment in the i18n file reads `// Translate to french: The patient is older than 18 years`, suggesting the French translation is still pending.

## Helpdesk overlap

The helpdesk mentions that completed sessions at another practice can be recorded in Halingo but does not name the `hasPayBack` field or describe the cascade/cap logic. The age restriction and the supplementary-insurance exception are also undocumented there.

## Source files

- `app/imports/api/events/events.jsx:1302-1306` — schema field.
- `app/imports/api/events/server/util.jsx:21-214` — `_canBePaidBack` decision tree.
- `app/imports/api/events/server/util.jsx:216-244` — `_getNextNonPaidEvent` cascade helper.
- `app/imports/api/events/server/util.jsx:291-356` — `_getStatsOfEvent`, `_updateOnEventChange` with cascade.
- `app/imports/api/events/methods.js:493-512` — `events.canBePaidBack` error-throwing wrapper.
- `app/imports/modules/calendar/page/AppointmentEventPage.jsx:617-633` — manual override switch.
- `app/imports/modules/calendar/components/infobox/EventAddBox.jsx:610-614` — create-dialog status banner.
- `app/imports/i18n/resources/client/nl.i18n.js:1158-1198` — `errors.payback.*`, `errors.session.*`, `errors.bilan.*`.
