# RIZIV compliance

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for the user-visible parts (treatment types, bilan workflow, max sessions, brackets, age limits). Not covered: the actual session-counting math, the bilan/event matching algorithm, the static data tables in `treatments.js`, the lookup against the public RIZIV registry. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

Halingo's RIZIV compliance machinery is the **set of constants, enforcement rules and lookup tables that ensure every billable session is reimbursable under the Belgian convention**. It is split across four locations in the codebase:

1. **`api/riziv/`** — a tiny module with a `Riziv` collection holding the public RIZIV practitioner registry (firstName / lastName / nihdiNumber / qualificationCode), plus two methods: `physisians-by-name` (local lookup) and `riziv-nr-by-name` (live HTTP fetch from `inami.fgov.be`).
2. **`api/treatments/`** — the *Treatments* collection itself, which contains the disorder taxonomy (`Treatments.getTypes()`), the per-disorder session caps (`Treatments.getDisorderSessions()`), the static nomenclatuurcode lookup table (`Treatments.getDisorderCodes()`) and the bilan structure that bounds each treatment.
3. **`api/events/server/util.jsx`** — `_canBePaidBack`, the function that **gates every event** with the convention rules (max 1/day, max 5/week, max bilans by type, age limit, sessions-left check).
4. **`modules/riziv/`** — the `/riziv` page that displays the year's R-waarde and per-month session counts (covered separately in `./r_waarden.md`).

This file documents (1)–(3). The R-waarde graph and the nomenclatuurcode table have their own deep-dive files (`./r_waarden.md`, `./nomenclature_codes.md`) because they are large enough to need them.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| RIZIV statistics page | `/riziv` | `RizivPage` | `modules/riziv/RizivPage.jsx` |
| Bilan editor | inside `/patients/:patientId` treatment panel | `BilanPanel` | `modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx` |
| Prescriber lookup | inside the bilan editor | `getPhysisiansByName` autosuggest | same |
| Calendar payback banner | inside the event create/edit modal | `EventAddBoxCheckPayBack` | (in agenda module) |
| Treatment overview | per-patient, "Behandelingen" tab | `PatientFileTherapyOverviewPage` | `modules/patientfiles/therapy/...` |

The RIZIV page itself is the visible compliance dashboard. It shows three KPI boxes (R-waarde total, nomenclature-coded sessions, non-coded sessions) and a 12-month bar graph fed by `riziv.r-value.statistics`.

## The Riziv collection

`api/riziv/riziv.jsx:5-26`:

```js
Riziv.schema = new SimpleSchema({
  firstName: String,
  lastName:  String,
  riziv:     String,    // the NIHDI number
  qual:      String,    // the qualification code
});
```

This is a **read-only mirror** of the official RIZIV practitioner registry, populated by some out-of-band import that I did not locate in this pass. The `firstLast` and `lastFirst` denormalised search fields are queried but not declared in the schema (`api/riziv/methods.js:14-23`), suggesting the import job adds them as hidden fields.

### Methods

| Method | File | Purpose |
|---|---|---|
| `physisians-by-name` | `api/riziv/methods.js:6-27` | Local case-insensitive regex search across the four name fields. Used by the bilan editor's prescriber autocomplete. |
| `riziv-nr-by-name` | `api/riziv/methods.js:29-63` | Live HTTP fetch from `inami.fgov.be` via `RizivHelper.getPractitionersByName` (`lib/external-api/rizivHelper.js`). Returns `${Nihdi}${QualificationCode}`. Used as a fallback when the local mirror does not have a hit. |

`getPractitionersByName` (`lib/external-api/rizivHelper.js:3-31`) hits a real public endpoint:

```
https://www.inami.fgov.be/webprd/appl/psilverpages/api/Query
  ?FirstName=<f>&LastName=<l>&conventionstatus=&fake=0&nihdinumber=
  &pageSize=60&qualification=&skip=0&speciality=&what=&where=
```

It is the same backend that the public *psilverpages* search uses. The Halingo wrapper splits a comma-separated `name` into first and last, makes one HTTP call, and on failure retries with the parts swapped (`reverse: !options.reverse, retry: false`). This handles the "is 'Janssens, Eva' or 'Eva Janssens'?" question.

Both methods are defined as `LoggedInValidatedMethod` with `validate: null` — they accept any string input from any signed-in user.

## Treatment classification (the disorder taxonomy)

`api/treatments/treatments.js:39-60` defines the closed list of treatment types Halingo supports:

```js
Treatments.getTypes = () => [
  "a",          // Handicap
  "b.1",        // Afasie
  "b.2",        // Taalstoornis
  "b.3",        // Dyslexie / dysorthografie / dyscalculie
  "b.4",        // Schisis
  "b.5",        // Radiotherapie / chirurgie
  "b.6.1",      // Dysglossieën
  "b.6.2",      // Dysartrieën
  "b.6.3",      // Neuromusculaire aandoeningen
  "b.6.4",      // Stotteren
  "b.6.5",      // Interceptive orthodontie
  "c.1",        // Laryngectomie
  "c.2",        // Larynx - stemstoornissen
  "d",          // Gehoorstoornissen
  "e",          // Dysfagie
  "f",          // Dysfasie
  "g",          // (added later, no helpdesk name — see migration history)
  "supplementaryInsurance",  // not a RIZIV category; the patient is on private supplementary insurance
];
```

The Dutch / French names live in `migration-v1.js:6-23` (for the migration of the legacy "disorder" field) and in `i18n/resources/nl.i18n.js:151-205` for the user-facing labels. There is no `g` entry in `migration-v1.js` — `g` was added later, and as the helpdesk does not document it, only the codes table in `treatments.js:752-760` describes it (three nomenclatuurcodes: `724415`, `724430`, `724485`).

### Per-disorder session caps

`api/treatments/treatments.js:328-348`:

```js
Treatments.getDisorderSessions = () => ({
  a:       55,
  "b.1":   288,
  "b.2":   190,
  "b.3":   140,
  "b.4":   30,
  "b.5":   55,
  "b.6.1": 149,
  "b.6.2": 176,
  "b.6.3": 520,
  "b.6.4": 128,
  "b.6.5": 20,
  "c.1":   90,
  "c.2":   80,
  d:       520,
  e:       65,
  f:       384,
  g:       150,
});
```

These are the **default** maximum number of sessions a patient may have under each disorder over a treatment period. When a `Treatment` is created (`api/treatments/methods.js:73`), `totalSessions` is initialised from this table; the user can later edit it on a per-treatment basis (via `editTreatment`).

The current sessions consumed by an active treatment is computed by `TreatmentsUtil.getSessionsLeft` (`api/treatments/server/util.js:108-117`):

```js
getSessionsLeft = (treatment) => {
  const sessionCount = getSessionCount(treatment._id);   // sums sessionCount across hasPayBack events
  return Math.max(
    (treatment.totalSessions || Treatments.getDisorderSessions()[treatment.type])
      - treatment.usedSessions
      - sessionCount,
    0
  );
};
```

Notice the **two** components: `usedSessions` (a manual counter on the Treatment, used to record sessions consumed *before* Halingo started tracking them — pre-import / migration data) and `sessionCount` (the live sum across all reimbursable Halingo events, see `./session_counting.md`).

### Bilan structure and the implicit 2-year bracket

A `Treatment` has a `bilans: Array` field. Each bilan is a sub-document with the schema `Treatments.bilanSchema` (`treatments.js:62-87`):

```js
{
  _id:              String,
  approvedDate:     Date (optional),
  createdAt:        Date,
  end:              Date,                    // ← end of the reimbursement window
  isReimbursed:     Boolean,
  prescriber: {
    name:  String,
    riziv: String,
  },
  prescriptionDate: Date,
  start:            Date,                    // ← start of the reimbursement window
  type:             "initial" | "evolution" | "relapse" | "extension",
}
```

The `start` and `end` of each bilan define the **bracket** — the duration window during which events on this treatment are eligible for reimbursement. The user enters these dates manually based on the `aanvraagformulier` they sent to the Ziekenfonds. Halingo does **not** automatically compute "today + 2 years" and there is no constant or business rule like "the bracket is always 24 months" anywhere in the code I read.

> **Verdict on automatic 2-year brackets**: NOT in code. The bracket length is purely user input. The helpdesk's claim that "the default since Aug 2024 is 2 years" is a regulatory fact, not a feature. Halingo enforces it only by virtue of the user entering matching `start` and `end` dates.

The bilan custom validator (`treatments.js:99-115`) enforces:
- Only one `INITIAL` bilan per treatment.
- Every other bilan must `start >= initial.end` (no overlap with initial).

The treatment's `getValidBilan(date)` helper (`treatments.js:243-249`) finds the first bilan whose `[start, end]` window contains the given date. This is what `_generateCertificates` uses to attribute each event to the correct bilan at invoice time.

`getEndDateReimbursement()` (`treatments.js:180-227`) merges overlapping bilan windows into reimbursement *periods* and returns the end of the period that contains "now" (or the most recently ended period). This is what the patient overview uses to show "your reimbursement runs out on YYYY-MM-DD".

### Approval state

`treatments.js:23-28`:

```js
Treatments.approvalStates = {
  APPROVED: "approved",
  DECLINED: "declined",
  PENDING:  "pending",
  TESTING:  "testing",
};
```

`TESTING` is the default. `DECLINED` is the only state that gates reimbursement: `_generateCertificates` sets `isTreatmentReimbursed = treatment.approvalState !== DECLINED` (`patientFileInvoices/server/util.js:304`). All other states (including `PENDING`) are treated as reimbursable.

### Treatment helpers (`treatments.js:143-310`)

| Helper | Purpose |
|---|---|
| `codes(includeDefault)` | Returns the per-disorder code subtree from `Treatments.getDisorderCodes()`. With `includeDefault: true`, merges the `DEFAULT` subtree on top (so the catch-all evolution-bilan codes apply). For supplementary-insurance treatments, returns the user-defined `supplementaryInsurance.code` instead. |
| `evolutionBilans()`, `relapseBilans()`, `extensionBilans()`, `initialBilan()` | Filtered/sorted views of `bilans` |
| `getBilanByType(type)` | First bilan matching the type |
| `getCodeForEvent(event)` | The single most important method — see "Code lookup" below |
| `getEndDateReimbursement()` | Returns the end-of-bracket date |
| `getValidBilan(date)` | Find the bilan whose window covers the date |
| `isActive()` | `approvalState !== DECLINED && getValidBilan() !== undefined` |
| `isBilanIncomplete(bilanId)` | `true` if the bilan is missing `end`, `prescriber.name`, `prescriber.riziv`, `prescriptionDate`, `start`. **`approvedDate` is intentionally commented out** (`treatments.js:258`) — i.e. a bilan can be reimbursable without being formally approved yet. |
| `isIncomplete()` | `true` if the treatment is missing `bilans, totalSessions, type, usedSessions` or has any incomplete bilan |
| `isSupplementaryInsurance()` | `type === "supplementaryInsurance"` |
| `getDurations()` | Returns the appointment subtypes (30 / 60 / GROUP) that have a code defined for this disorder |

### Code lookup

`treatments.js:170-178`:

```js
getCodeForEvent(event) {
  const codes = this.codes(true);  // includeDefault: true
  return typeof codes === "object"
    ? _.get(codes, `${event.getAppointmentType()}.${event.getDuration()}.${event.getLocation()}`)
    : this.isSupplementaryInsurance()
      ? codes || "patient.treatments.supplementaryInsurance.abbreviation"
      : codes;
}
```

Where:
- `event.getAppointmentType()` is `meta.type` (a number 1–6 from `Events.getAppointmentTypes()`).
- `event.getDuration()` is `meta.subType` (or computed from start/end if not set).
- `event.getLocation()` is the `text` of `Events.getLocations()[meta.location]` (`OFFICE`, `HOME`, `SCHOOL`, `REVALIDATION`, `HOSPITALISATION`, `VIDEO_CONSULTATION`).

So the lookup is the path `appointmentType → subType → location` in the `Treatments.getDisorderCodes()` map. The full table is in `./nomenclature_codes.md`.

If the path doesn't resolve, the `_.merge` with the `DEFAULT` table (`treatments.js:150`) provides catch-all values for the bilan / examination appointment types (2, 3, 5, 6).

If the result is still `undefined`, the event is marked `isReimbursable: false` by `_generateCertificates` (`patientFileInvoices/server/util.js:411-414`) and is omitted from the certificate.

## The convention rules engine

The actual *rules* that the convention imposes on a single appointment live in `_canBePaidBack` in `app/imports/api/events/server/util.jsx:18-214`. Every event create / edit calls this function to compute the new `hasPayBack` flag (which then drives whether the event counts toward the patient's bracket and whether it shows up on a certificate).

### Inputs

```js
_canBePaidBack(data, throwError = false, treatmentObj, allEvents)
```

- `data` — the event document being inserted/updated.
- `throwError` — when true (used by the bilan editor pre-flight), the function throws on the first violation; otherwise it returns `false` silently.
- `treatmentObj` — optional, optimisation pass-through to avoid a second `Treatments.findOne`.
- `allEvents` — optional pre-fetched event collection for batch paths (used by `_repeatEvent`).

### Pre-checks

```js
// events/server/util.jsx:21-65
if (data.state === 2) return false;            // ABSENT — never reimbursable
if (!data.treatmentId) return false;            // No treatment, no payback
if (!appointmentType) return false;             // No appointment type, no payback
if (!treatment) return false;                   // Treatment was removed, no payback
if (treatment.type === "supplementaryInsurance" && appointmentType !== 1) return false;
                                                // Supplementary insurance only covers regular sessions, not bilans
```

### Age limit (`util.jsx:67-72`)

```js
const TreatmentTypesWithAgeLimit = ["b.2", "b.3", "f"];

if (TreatmentTypesWithAgeLimit.includes(treatment.type)
    && patient.birthDate
    && moment(event.start).diff(moment(patient.birthDate), "years") >= 18) {
  setPayBack(false, "errors.payback.ageLimit");
}
```

So **Taalstoornis (b.2), Dyslexie/dysorthografie/dyscalculie (b.3), and Dysfasie (f) are only reimbursable up to age 18**. The other treatment types have no age restriction.

### Bilan-specific gates (`util.jsx:74-86`)

For `EVOLUTION_BILAN` (type 3): the number of evolution bilans already on the treatment that have `isReimbursed: true` must be **strictly greater** than the number of payback'd evolution-bilan events already created. Otherwise the user has scheduled an evolution bilan that has no corresponding `isReimbursed` bilan to consume, and the payback is denied with `errors.bilan.evolution.insufficient`.

For `INITIAL_BILAN` (type 2) and `BILAN_RELAPSE` (type 5): the matching bilan must exist on the treatment AND its `isReimbursed` flag must be true. Otherwise: `errors.bilan.notFound` or `errors.bilan.notReimbursed`.

The `EXTENSION_BILAN` (`extension`) does not appear in `bilanType` checks here; the schedule of extension events is bound by the `bilans` array's window mechanism instead.

### Max 1 per day rule (`util.jsx:90-129`)

```js
// Max 1 reimbursable session per day per treatment, EXCEPT for PARENT_SITTING (4) and INITIAL_BILAN (2)
if (hasPayBack && appointmentType !== 4 && appointmentType !== 2) {
  // count events on the same day for the same patient + treatment with hasPayBack: true
  // exclude meta.type === 4 (PARENT_SITTING) and meta.type === 6 (EVALUATION_SESSION)
  // if any exist, set hasPayBack = false
}
```

So a patient can have:
- 1 reimbursable regular session per day, OR
- 1 reimbursable session + 1 reimbursable parent sitting on the same day, OR
- multiple initial bilan slices on the same day (because the initial bilan splits into 30-min chunks at invoice time).

### Max 5 per week rule (`util.jsx:131-186`)

```js
// Count events with hasPayBack: true in the same Mon→Sun week (week starts day(1))
if (events.length >= 5) setPayBack(false, "errors.session.max5SessionsPerWeek");
```

The week boundary is `moment(event.start).day(1)` (Monday) → +7 days.

There is **commented-out** logic for a "max 2 video consultations per week" rule (`util.jsx:172-185`). It is dead code in the current revision.

### Max sessions of type rule (`util.jsx:188-203`)

For each appointment type with a `max` constant in `Events.getAppointmentTypes()`:

```js
1: SESSION         — no max
2: INITIAL_BILAN   — max 5 (sessionCount-aware: a 60-min initial bilan counts as 2 sessions)
3: EVOLUTION_BILAN — max 1 (sessionCount: 1)
4: PARENT_SITTING  — max 10 (sessionCount-aware: INDIVIDUAL counts as 2)
5: BILAN_RELAPSE   — max 2 (sessionCount: dur / 30)
6: EVALUATION_SESSION — no max
```

These max values are convention-derived. When the type's `sessionCount` is a function (i.e. the count depends on the event duration), the rule sums the sessionCount across all existing reimbursable events of this type and asserts `max - sum >= newEvent.getSessionCount()`. When the `sessionCount` is a constant, it's a simple count-based check.

### Total sessions left rule (`util.jsx:205-211`)

```js
setPayBack(
  TreatmentsUtil.getSessionsLeft(treatment) >= (event._id ? 0 : event.getSessionCount(treatment, true)),
  "errors.session.maxSessionsReached"
);
```

If the treatment is out of sessions, the new event is denied. Note that an *update* to an existing event uses `>= 0` (so the existing reservation is not double-counted), while a *new* event uses `>= newEvent.getSessionCount(treatment, true)`.

The `forTotal: true` argument to `getSessionCount` (`events.jsx:1442-1457`) returns 0 for appointment types where `countsTowardsTotal === false` — i.e. EVOLUTION_BILAN and EVALUATION_SESSION do not consume the patient's bracket.

## Notification scheduling for end-of-treatment

`api/treatments/server/TreatmentSessionObserver.js` is a SyncedCron-based scheduler that runs whenever a Treatment is added/updated/removed:

1. `findEventForNotification(treatment)` walks the treatment's `hasPayBack: true, type: 1` events in order.
2. The first event whose execution leaves `getSessionsLeft(treatment) < notifications.sessions` (default 10, configurable per-treatment or per-praktijk) is the notification trigger.
3. A `SyncedCron.add({ name: "treatment_observer_<id>_sessions", schedule: ..., job: () => sendNotification(...) })` job is registered to fire on that event's end time.
4. The job inserts a `Notifications` row of type `WARNING` for every user who has access to the patient file (`patientFileUsers`), or — if no one has access — for every owner/admin of the practice.

This is the "almost out of sessions!" warning surfaced on the in-app notification centre. The scheduling is event-driven (not date-driven): it always points at the *next event* that would push the patient under the threshold, not at a fixed date.

There is a **per-praktijk default** for the threshold in `Practices.settings.patientFiles.notifications.sessions` (default `10`, `practices.jsx:110-114`). The per-treatment override lives in `Treatments.notifications.sessions` (`treatments.js:120-124`).

There is a sister observer for end-of-bracket date notifications (`TreatmentDateObserver.js`, not read in this pass), which fires when the bilan's `end` date is approaching.

## Permissions

| Action | Permission |
|---|---|
| View RIZIV statistics for self | (none) |
| View RIZIV statistics for another therapist | `riziv.r-value.statistics` |
| Add treatment | `treatments.add` |
| Edit treatment | `treatments.edit` |
| Remove treatment | `treatments.remove` |
| Add bilan | `treatments.bilans.add` |
| Edit bilan | `treatments.bilans.edit` |
| Remove bilan | `treatments.bilans.remove` |

Lookup methods (`physisians-by-name`, `riziv-nr-by-name`) are open to any logged-in user.

## User-visible behaviour

- The therapist creates a `Treatment` for a patient picking one of the 17 disorder codes (or `supplementaryInsurance`). `totalSessions` is initialised from `getDisorderSessions()`.
- They add at least one `Bilan` (typically initial), enter the prescriber name (autocompleted via `physisians-by-name` against the local Riziv mirror, or via `riziv-nr-by-name` against the live INAMI registry), the prescription date, the bracket window (`start` / `end`), and mark `isReimbursed`.
- When the user schedules an appointment, the `_canBePaidBack` rules engine evaluates the new event against:
  - The age limit (b.2/b.3/f only).
  - The bilan-type prerequisites.
  - The max-1-per-day rule.
  - The max-5-per-week rule.
  - The max-N-of-type rule.
  - The sessions-left rule.
- If any rule fails, the calendar UI shows the failure reason and the event is created with `hasPayBack: false`. The therapist can still hold the session — it just won't generate a reimbursable line.
- As sessions accumulate, `TreatmentSessionObserver` re-schedules a "sessions running out" notification.
- At invoice creation, `_generateCertificates` walks each treatment's bilans, attributes events to them via `getValidBilan(event.start)`, and generates one certificate per `(treatmentId, bilanId)` pair containing the codes from `getCodeForEvent(event)`.

## Notable details

- **`g` is undocumented.** The `g` treatment type appears in `Treatments.getTypes()`, in `getDisorderSessions()` (150 sessions), and in `getDisorderCodes()` (three codes: `724415`, `724430`, `724485`). It has no Dutch name in `migration-v1.js`, no entry in the helpdesk, and no i18n label that I located. Verify with product what `g` is. The codes match the RIZIV "interceptive orthodontie / preventieve logopedie" range.
- **`approvedDate` is not enforced.** The bilan completeness check explicitly comments out the `approvedDate` field (`treatments.js:258, 284`). A bilan can be processed for reimbursement before the formal RIZIV approval comes back; the `approvedDate` field is captured if entered but not gated on.
- **`isReimbursed` on a bilan is a manual flag**. The user toggles it once they have confirmation from the Ziekenfonds. The system does not auto-set it.
- **The age cutoff is exactly 18 years on the event start date.** Calculation: `moment(event.start).diff(moment(patient.birthDate), "years") >= 18` — using `moment.diff` with `years` truncates, so it flips on the patient's 18th birthday.
- **`PARENT_SITTING` (type 4) and `EVALUATION_SESSION` (type 6) do not consume the same-day rule.** They are explicitly excluded from the `meta.type: { $nin: [4, 6] }` filter (`util.jsx:115-116`).
- **The 60-minute SESSION counts as 2 sessions** toward the bracket (`events.jsx:56-58`). This is the convention's "1 unit = 30 min" rule embedded in code.
- **The 60-minute INITIAL_BILAN counts as 2** because of the `Math.ceil(durationMinutes / 30)` formula (`events.jsx:67-69`); a 90-minute initial bilan would count as 3.
- **`BILAN_RELAPSE` does not ceil the duration** (`events.jsx:99-103`) — a 45-minute relapse bilan counts as 1.5 sessions, which is then treated as a non-integer in the `max - sum >= newCount` comparison. This is probably a bug or an oversight, but it works because the `max` for relapse is 2 and the typical durations are 30 or 60 minutes.
- **The riziv-nr-by-name fallback to the live INAMI endpoint** is the only outbound HTTP call from this entire compliance module. The endpoint is unauthenticated and rate-limited at the INAMI side. There is no caching layer.
- **The Riziv collection mirror is read-only** — there is no admin import method exposed via Meteor methods. It must be populated by an out-of-band job.
- **`hasPayBack` is denormalised on the event** and re-computed on every event create/update. The current value is what `_generateCertificates` reads at invoice time. There is no event history of payback decisions.

## Helpdesk overlap

The Zendesk material covers:
- The 17 disorder types and their session caps.
- The bilan workflow (initial / evolution / relapse / extension).
- The "max 1 session per day" rule and the "max 5 per week" rule.
- The age 18 limit for "certain disorders" (without listing them).
- The bracket / aanvraagformulier flow.

The helpdesk does **not** cover:
- The exact age-limit list (`b.2 / b.3 / f`).
- The bilan/event matching algorithm (`getValidBilan`).
- The `EVALUATION_SESSION` exemption from the same-day rule.
- The `PARENT_SITTING` exemption from the same-day rule.
- The `g` disorder.
- The `inami.fgov.be` lookup fallback.
- The `TreatmentSessionObserver` notification scheduling.
- The non-enforced `approvedDate`.

## Source files

### API
- `app/imports/api/riziv/riziv.jsx` — collection schema.
- `app/imports/api/riziv/methods.js` — `getPhysisiansByName`, `getRizivNbByName`.
- `app/imports/lib/external-api/rizivHelper.js` — INAMI HTTP wrapper.
- `app/imports/api/treatments/treatments.js` — Treatments collection, disorder taxonomy, session caps, code map.
- `app/imports/api/treatments/methods.js` — addTreatment, editTreatment, removeTreatment, addBilan, editBilan, removeBilan, etc.
- `app/imports/api/treatments/server/util.js` — getSessionCount, getSessionsLeft, removeBilan, removeTreatment.
- `app/imports/api/treatments/server/TreatmentSessionObserver.js` — SyncedCron-based "sessions running out" notification scheduler.
- `app/imports/api/treatments/server/TreatmentDateObserver.js` — sister observer for end-of-bracket date notifications.
- `app/imports/api/events/server/util.jsx:18-214` — `_canBePaidBack`, the rules engine.
- `app/imports/api/events/events.jsx:49-204` — Events.getAppointmentTypes, getAppointmentSubTypes, getLocations.
- `app/imports/migrations/migration-v1.js` — disorder name mapping (NL).

### UI
- `app/imports/modules/riziv/RizivPage.jsx`
- `app/imports/modules/riziv/RizivPageGraph.jsx`
- `app/imports/modules/riziv/RizivPageContainer.js`
- `app/imports/modules/riziv/methods/methods.js` — `riziv.r-value.statistics`
- `app/imports/modules/riziv/server/util.js` — `getRValueStatistics` and `_getRValueForCode`
- `app/imports/modules/riziv/resources/client/nl.i18n.js` — RIZIV page i18n
- `app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx` — bilan editor
- `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx` — uses physician lookup for prescriber
- `app/imports/i18n/resources/nl.i18n.js:151-205` — disorder type labels in NL

### Routes
- `app/imports/startup/client/routes/riziv.js`
