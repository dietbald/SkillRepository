# Session counting

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: only described end-user-side ("bilans count toward your bracket"). The exact math is **not** covered — see `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

Belgian RIZIV conventions cap the number of reimbursable speech-therapy sessions per patient per treatment type (the *bracket*). Halingo enforces these caps by computing a `sessionCount` per calendar event and subtracting from the per-treatment allowance. This file explains exactly how the number is computed from the event's subtype, duration, and state — information that is business-critical and not in the helpdesk.

The integer `sessionCount` is stored directly on the event (schema `sessionCount: Number, optional` — `app/imports/api/events/events.jsx:1307-1310`) and is the single number that `Treatments.usedSessions` / the RIZIV graph counts against.

## Where it lives in the UI

- Displayed indirectly on `RizivPage` (`/riziv`), on the patient treatments overview, and on the `EventAddBoxCheckPayBack` banner inside the calendar create/edit dialog.
- Calculated entirely server-side, cached on the event, and re-calculated on every edit that changes start/end, subType, or appointment type.

## The math

All computation is anchored on `Events.getAppointmentTypes()` (`events.jsx:49-119`). The returned object maps `meta.type` (appointment type code) to a `sessionCount` function or constant:

```js
// events.jsx:49-119
1: { text: "SESSION",          sessionCount(event) { return event.meta.subType + "" === "60" ? 2 : 1; }, countsTowardsTotal: true },
2: { text: "INITIAL_BILAN",    sessionCount(event) { const dur = moment.duration(moment(event.end).diff(moment(event.start))); return Math.ceil(dur.asMinutes() / 30); }, countsTowardsTotal: true, max: 5,  bilanType: "initial" },
3: { text: "EVOLUTION_BILAN",  sessionCount: 1,                                                                                     countsTowardsTotal: false, max: 1, bilanType: "evolution" },
4: { text: "PARENT_SITTING",   sessionCount(event) { return event.meta.subType === "INDIVIDUAL" ? 2 : 1; },                            countsTowardsTotal: true,  max: 10 },
5: { text: "BILAN_RELAPSE",    sessionCount(event) { const dur = moment.duration(moment(event.end).diff(moment(event.start))); return dur.asMinutes() / 30; }, countsTowardsTotal: true, max: 2, bilanType: "relapse" },
6: { text: "EVALUATION_SESSION", sessionCount() { return 0; }, countsTowardsTotal: false },
```

### Rules per appointment type

| `meta.type` | Constant | How `sessionCount` is computed | Counts toward RIZIV total? |
|---|---|---|---|
| `1` | `SESSION` | `1` for a 30-min subtype, `2` for a 60-min subtype (`events.jsx:56-58`). GROUP subtype → `1`. | yes |
| `2` | `INITIAL_BILAN` (*aanvangsbilan*) | `Math.ceil(durationMinutes / 30)` — so a 60-min event counts `2`, a 90-min event counts `3`, a 120-min event counts `4`. Capped at 5 via `type.max = 5`. | yes |
| `3` | `EVOLUTION_BILAN` (*evolutiebilan*) | Always `1` (`events.jsx:80`). Capped at 1 via `type.max = 1`. | **no** (`countsTowardsTotal: false`) |
| `4` | `PARENT_SITTING` | `2` if `subType === "INDIVIDUAL"`, `1` if `"GROUP"` (`events.jsx:89-91`). Capped at 10. | yes |
| `5` | `BILAN_RELAPSE` (*hervalbilan*) | `durationMinutes / 30` (no ceiling) (`events.jsx:99-103`). Capped at 2. | yes |
| `6` | `EVALUATION_SESSION` | Always `0`. Not counted. | no |

### Bilans scale by duration

For `INITIAL_BILAN` and `BILAN_RELAPSE`, the session count is driven by the *duration* of the calendar event, in 30-minute increments. This is how the helpdesk description "bilans are billed in 30-minute units" translates in code.

> **INITIAL_BILAN uses `Math.ceil`, RELAPSE does not.** `events.jsx:67` vs `events.jsx:102`. A 31-minute initial bilan counts as 2 slots; a 31-minute relapse bilan counts as 1.033. Only the initial case has a ceiling. Whether this is deliberate or a bug should be verified with product — the glossary entry for *aanvangsbilan* says "max 5 reimbursable units per episode", matching `type.max = 5`.

### Sessions scale by subtype (not duration)

For `meta.type === 1` SESSION, the session count is purely a function of `meta.subType`:

```js
events.jsx:56-58
sessionCount(event) { return event.meta.subType + "" === "60" ? 2 : 1; }
```

A 60-minute session counts as **2** sessions against the bracket, a 30-minute session counts as **1**. A `GROUP` subtype also counts as 1.

A consequence: if you change the event's `end` to make it longer without changing `meta.subType`, the session count does **not** change. The subType is authoritative.

### PARENT_SITTING is a special case

`meta.type === 4` uses `meta.subType` but with a different mapping: `INDIVIDUAL` is 2, `GROUP` is 1. Possible subtypes here are NOT `30` / `60` but `INDIVIDUAL` / `GROUP` (`events.jsx:178-204`).

## The computed `sessionCount` field

`eventHelpers.getSessionCount(treatment, forTotal)` at `events.jsx:1442-1457` wraps the above:

```js
getSessionCount(treatment, forTotal) {
  if (this.type === 1) {
    const type = Events.getAppointmentTypes()[this.meta.type];
    if (!type) { return 0; }
    if (!type.countsTowardsTotal && forTotal) { return 0; }
    return typeof type.sessionCount === "function"
      ? type.sessionCount(this, treatment)
      : type.sessionCount;
  }
  return 0;
}
```

Key points:
- Only `event.type === 1` (APPOINTMENT) yields a non-zero count. MEETING, PRIVATE, CONSULTATION all return 0.
- The `forTotal` flag (used only from `_canBePaidBack` at `server/util.jsx:208`) strips out types where `countsTowardsTotal === false` (EVOLUTION_BILAN, EVALUATION_SESSION).
- On create, `_createEvent` caches the result on the document (`server/util.jsx:538`: `sessionCount: treatment ? event.getSessionCount() : null`).
- On update, `_updateOnEventChange` recomputes the diff and, if it has changed, does `Events.update(event._id, {$set: { sessionCount: originFields.sessionCount }})` (`server/util.jsx:346-353`).

### Cache consistency
`migration-v35` is named `updateTreatmentSessionCount` and likely did a one-time rebuild of this cached field across the entire database. A manual recompute is exposed to the UI as `treatments.updateHalingoSessionCount` (`treatments/methods.js:197-220`) which calls `TreatmentsUtil.getSessionCount(treatmentId)`.

## The bracket total

### `getSessionsLeft`
`app/imports/api/treatments/server/util.js:108-117`:
```js
const getSessionsLeft = (treatment) => {
  const sessionCount = getSessionCount(treatment._id);
  return Math.max(
    (treatment.totalSessions || Treatments.getDisorderSessions()[treatment.type])
      - treatment.usedSessions
      - sessionCount,
    0
  );
};
```

And `getSessionCount` in the same file:
```js
const getSessionCount = (treatmentId) => {
  const events = Events.find(
    { treatmentId, hasPayBack: true },
    { fields: { sessionCount: 1 } }
  ).fetch();
  return events.reduce((sum, e) => sum + e.sessionCount, 0);
};
```

So the formula is:

> **sessions_left = max(0, totalSessions − usedSessions − Σ event.sessionCount where event.treatmentId = T and event.hasPayBack = true)**

- `totalSessions` defaults to the RIZIV cap per disorder type (`Treatments.getDisorderSessions()`, `treatments.js:328-348` — e.g. `a: 55, b.1: 288, ...`).
- `usedSessions` is the **pre-Halingo backlog**: sessions already consumed before the patient was added to Halingo. The therapist enters this manually on the treatment.
- The sum is only over events with `hasPayBack === true` — i.e. events that actually count against insurance (see [event_payback.md](event_payback.md)).

### Payback caps per type
When an event is created or edited, `_canBePaidBack` (`server/util.jsx:21-214`) verifies that allowing it to reimburse would not breach a per-type ceiling. For types with a function-valued `sessionCount`, the server totals already-reimbursed sessions and checks `type.max - sessionCount >= event.getSessionCount()` (`server/util.jsx:192-201`). For types with a scalar `sessionCount`, it uses `(count+1) * sessionCount <= type.max`.

### Other limits enforced by `_canBePaidBack`
- **Max 1 per day** for all subtypes except `PARENT_SITTING` and `INITIAL_BILAN` (`server/util.jsx:91-129`). A VIDEO_CONSULTATION location (6) is excluded from the "max 1/day" check.
- **Max 5 per week** across all types (`server/util.jsx:133-171`).
- **Treatment must have a valid bilan** active on the event's date (`server/util.jsx:205-211`, via `getSessionsLeft >= event.getSessionCount(...)`).
- **Supplementary insurance only accepts type-1 SESSION events** (`server/util.jsx:62-64`).
- **Age limit**: for treatment types `b.2`, `b.3`, `f`, the patient must be under 18 at the event start (`server/util.jsx:16-72`, throws `errors.payback.ageLimit`).

All of these trigger `setPayBack(false, errorCode)` if violated — meaning the event is still **created**, but `hasPayBack: false`, so its `sessionCount` will not be summed against the bracket.

## Re-computation triggers

### On create
`_createEvent` sets `sessionCount: treatment ? event.getSessionCount() : null` (`server/util.jsx:538`).

### On update
`_updateOnEventChange` (`server/util.jsx:306-356`) is called from `events.update` and `events.update.startAndEnd`. It:
1. Transforms the event with the new fields.
2. Computes `fullUpdatedEvent.getSessionCount()` as the new cached value.
3. Diffs against the previous via `_getStatsDifferenceBetweenEvents`.
4. If `hasPayBack` changed, re-runs the payback check on the *next* non-paid event in the same day/week, to "promote" it into a reimbursable slot.
5. If `sessionCount` changed, writes it to the document.

### On bilan edit
`EventsUtil.checkEventsOfBilanType(treatmentId, type)` (`server/util.jsx:358-372`) is called from `treatments.bilans.edit` (`treatments/methods.js:349`). It finds all events linked to that treatment with the matching `meta.type` (3 for evolution, 5 for relapse, 2 for initial) and calls `_updateOnEventChange({}, {})` on each. This re-runs payback logic when a bilan's `isReimbursed` flag flips.

### On treatment session observer
The `TreatmentSessionObserver` recomputes the "sessions remaining" every time an event is inserted/updated/removed (debounced by 5s in `hooks.js:11-103`) and schedules a therapist notification if the remaining count drops below the configured threshold.

## `Treatments.usedSessions` vs the cached `sessionCount`

Two independent numbers live on the treatment:
- `treatment.totalSessions` — the bracket ceiling.
- `treatment.usedSessions` — the backlog (editable by therapist).
- `treatment.usedSessionsEvents` — declared in the schema (`treatments.js:136`) with `defaultValue: 0` but **never written to** by any code path visible in `treatments/**` or `events/**`. Possibly a historical field.

## Methods (Meteor)

- `treatments.updateHalingoSessionCount` (`treatments/methods.js:197-220`) — forces a recompute. Returns the fresh session count.
- `events.canBePaidBack` (`events/methods.js:493-512`) — run the payback check without creating/updating; useful for the UI to show the "this will / will not be reimbursed" warning before submit.

## Notable details

### What happens if meta.subType and the duration disagree
There is **no validation** that `(end - start)` matches `meta.subType`. A user can create an event with `subType: 30` that spans 60 minutes in the calendar; the session count will still be 1 (because SESSION counts off subType, not duration). Rendering is not affected.

### A session with no treatment
If the user creates a type-1 event without selecting a treatment (e.g. for a non-speech-therapist profession), `_createEvent` skips the `hasPayBack` and `sessionCount` computation (`server/util.jsx:536-538`): `sessionCount: treatment ? event.getSessionCount() : null`. The event is bookkept for invoicing but never touches the RIZIV bracket.

### Why `EVOLUTION_BILAN` has `countsTowardsTotal: false`
An evolutiebilan is reimbursed but not counted against the per-treatment session ceiling — it is a separate budget line. The flag `countsTowardsTotal: false` is read only by `forTotal` branch inside `getSessionCount`, which is used when enforcing `max sessionsReached` — evolution bilans can use their own bucket (`type.max = 1`, only one per treatment).

### Max 5 sessions per week is **hard-coded**
The 5-per-week limit is a literal `5` at `server/util.jsx:170`. It is not user-configurable. This matches RIZIV convention but is worth noting for any practice in a jurisdiction that allows more.

### Timezone
The "max 1 per day" check uses `moment(event.start).tz("Europe/Brussels").startOf("day")` (`server/util.jsx:93`) explicitly, so a user in a different timezone still gets Brussels-day boundaries.

## Helpdesk overlap

The helpdesk tells users "bilans count in 30-min units, sessions are 1 or 2 per slot" without going into the subtype/duration mechanics, the payback-flag cache, the 5-per-week limit, or the age cap for b.2/b.3/f treatments. This file is the authoritative code-level reference.

## Source files

- `app/imports/api/events/events.jsx` — `getAppointmentTypes`, `getSessionCount` helper, schema.
- `app/imports/api/events/server/util.jsx` — `_canBePaidBack`, `_updateOnEventChange`, `_createEvent`, `_checkEventsOfBilanType`.
- `app/imports/api/treatments/treatments.js` — `getDisorderSessions`, `bilans` helpers.
- `app/imports/api/treatments/server/util.js` — `getSessionsLeft`, `getSessionCount`.
- `app/imports/api/treatments/server/TreatmentSessionObserver.js` — scheduled "sessions almost used up" notification.
- `app/imports/api/treatments/methods.js` — `treatments.updateHalingoSessionCount`.
- `app/imports/api/events/methods.js` — `events.canBePaidBack`.
- `app/imports/migrations/migration-v35.js` — `updateTreatmentSessionCount` backfill.
