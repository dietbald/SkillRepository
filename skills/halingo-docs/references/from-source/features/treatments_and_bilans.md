# Treatments and bilans

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered at the user-story level — see `../../full_documentation/treatments_bilans.md`. The code level below includes details not in the helpdesk: state machine, nomenclature-code tables, notification cron jobs, and the `getHalingoSessionCount` path. Verify against running app before promoting to `manual/`.

## What it is

A *treatment* (`Treatments` collection) is a RIZIV-aligned therapy plan attached to a patient file. It carries the treatment type (a, b.1, …, f, g, supplementaryInsurance), the nomenclature codes that invoicing uses, the approval state, a list of **bilans** (assessment reports), and the reimbursable-sessions bracket. Everything on the `events` side linked by `event.treatmentId` is counted against one row here.

## Where it lives in the UI

- Treatments and bilans are edited on the patient file overview: `PatientFileTherapyOverviewPage` (`app/imports/modules/patientfiles/therapy/PatientFileTherapyOverviewPage.jsx`, not read in depth for this doc — the methods below are the authoritative API).
- RIZIV tracking and bracket exhaustion: `RizivPage` (`/riziv`).
- On the calendar: selected implicitly from the event create dialog (`TreatmentSelect` in `EventAddBox.jsx:504-516`, only shown when `event.type === 1 && isSpeechTherapist`) and from the "Select treatment" button on an appointment that requires review (`SelectTreatmentDialog` in `AppointmentEventPage.jsx:410-419`).

## Data model

### `Treatments` collection
`app/imports/api/treatments/treatments.js:89-141`:

| Field | Type | Purpose |
|---|---|---|
| `_id` | String (regEx Id) | — |
| `patientFileId` | String (regEx Id, required) | Owning patient file. |
| `name` | String (required) | Free-text display name (e.g. "Dyslexie - Jules"). |
| `type` | enum | One of `a, b.1, b.2, b.3, b.4, b.5, b.6.1, b.6.2, b.6.3, b.6.4, b.6.5, c.1, c.2, d, e, f, g, supplementaryInsurance` (`Treatments.getTypes()`, `treatments.js:39-60`). |
| `approvalState` | enum | `approved` / `declined` / `pending` / `testing`. Defaults to `testing` (`treatments.js:23-28, 92-96`). |
| `bilans` | `Array<bilanSchema>` | List of assessment reports (see below). |
| `totalSessions` | Number (min 0) | Bracket ceiling. Defaulted from `Treatments.getDisorderSessions()` at add time. |
| `usedSessions` | Number (min 0, default 0) | Sessions consumed **before** Halingo was adopted (manual backlog). |
| `usedSessionsEvents` | Number (min 0, default 0) | Declared but never written — likely legacy. See [session_counting.md](session_counting.md#treatmentsusedsessions-vs-the-cached-sessioncount). |
| `supplementaryInsurance` | Object | `code: String`, `isCertificateNeeded: Boolean`, `payback: Number (cents)` — only used for `type === "supplementaryInsurance"`. |
| `notifications.enabled` | Boolean (default true) | Master switch for the two cron notifications below. |
| `notifications.date` | Number (days) | How many days before bilan end date to notify the therapist. |
| `notifications.dateScheduled` | Date | Cache of the scheduled notification date. |
| `notifications.sessions` | Number | Notify the therapist when remaining reimbursable sessions drop below this number. |
| `notifications.sessionsScheduled` | Date | Cache of the scheduled session-threshold event's end date. |
| `createdAt` | Date | — |
| `removed`, `removedAt` | — | Soft delete. |

### `Treatments.bilanSchema`
`treatments.js:62-87`:

| Field | Type | Purpose |
|---|---|---|
| `_id` | String (regEx Id, required) | Random id. |
| `type` | enum (required) | `initial` / `evolution` / `relapse` / `extension` (`Treatments.getBilanTypes()`, `treatments.js:30-37`). |
| `start`, `end` | Date | The validity window of the bilan. `end` must be after `start`. |
| `prescriber.name`, `prescriber.riziv` | String | Prescribing physician's name (uppercased on save) and RIZIV number. |
| `prescriptionDate` | Date | When the prescription was issued. |
| `approvedDate` | Date (optional) | When the insurer approved it. |
| `isReimbursed` | Boolean | Whether the insurer acknowledged the bilan. Drives `_canBePaidBack` decisions for events that depend on this bilan type. |
| `createdAt` | Date | — |

Custom constraint: at most one `initial` bilan per treatment, and all other bilans must `start` after the initial bilan's `end` (`treatments.js:99-116`).

### `Treatments.getTypes()`
```js
["a", "b.1", "b.2", "b.3", "b.4", "b.5", "b.6.1", "b.6.2", "b.6.3", "b.6.4", "b.6.5", "c.1", "c.2", "d", "e", "f", "g", "supplementaryInsurance"]
```

### `Treatments.getDisorderSessions()`
Per-type default bracket ceiling (`treatments.js:328-348`):
```
a: 55, b.1: 288, b.2: 190, b.3: 140, b.4: 30, b.5: 55,
b.6.1: 149, b.6.2: 176, b.6.3: 520, b.6.4: 128, b.6.5: 20,
c.1: 90, c.2: 80, d: 520, e: 65, f: 384, g: 150
```
(no `supplementaryInsurance` — handled separately).

### `Treatments.getDisorderCodes()` — the nomenclature matrix
`treatments.js:354-846`. Three-level deep dictionary keyed by `[treatmentType][event.meta.type][event.meta.subType][event.meta.location]` that returns the RIZIV nomenclature code. There is a `DEFAULT` branch for types 2 (INITIAL_BILAN), 3 (EVOLUTION_BILAN), 5 (BILAN_RELAPSE), and 6 (EVALUATION_SESSION) since bilans share codes across disorder types.

Special entries:
- `supplementaryInsurance` uses the literal string `"AV"` as its "code" for every combination (`treatments.js:761-807`).
- `Treatments.VideoConsultationCode = 792433` is a separate constant at `treatments.js:353` for video-consult type 4 events.
- `DEFAULT.6` (EVALUATION_SESSION) uses codes `700991` and `701002` (`treatments.js:834-843`).

### `Treatments.approvalStates`
```js
{ APPROVED: "approved", DECLINED: "declined", PENDING: "pending", TESTING: "testing" }
```
Default is `testing`. A declined treatment is treated as `!isActive()` (`treatments.js:233-235`) and the payback path rejects events on it.

### `Treatments.getBilanTypes()`
```js
{ INITIAL: "initial", EVOLUTION: "evolution", RELAPSE: "relapse", EXTENSION: "extension" }
```

## Helpers (on Treatments documents)
`treatments.js:143-310`:

- `codes(includeDefault)` — return the disorder-code tree for this type, optionally merged with `DEFAULT`.
- `evolutionBilans()`, `extensionBilans()`, `relapseBilans()` — filter `bilans` by type and sort by start date.
- `initialBilan()` — find the single initial bilan.
- `getBilanByType(type)` — look up by type string.
- `getCodeForEvent(event)` — return the specific nomenclature code for a given event (by disorder type × appointment type × subtype × location). Falls back to `"patient.treatments.supplementaryInsurance.abbreviation"` for supplementaryInsurance without a code.
- `getValidBilan(date)` — find the bilan whose `[start, end]` window covers `date` (or *now* if no date). Used by `_canBePaidBack` to gate reimbursement on bilan validity.
- `getEndDateReimbursement()` — given the overlap of bilan intervals, compute the end of the currently-active reimbursement period; if none is active, the end of the most recently elapsed one (`treatments.js:180-227`).
- `isActive()` — truthy when not declined and a valid bilan exists.
- `isBilanIncomplete(bilanId)` — missing required fields `end`, `prescriber.name`, `prescriber.riziv`, `prescriptionDate`, `start`.
- `isIncomplete()` — missing required treatment-level or bilan-level fields.
- `isSupplementaryInsurance()` — `this.type === "supplementaryInsurance"`.
- `getDurations()` — set of subType values the type supports.

## Methods (Meteor)

`app/imports/api/treatments/methods.js`

### `treatments.add`
Creates a treatment and up to four empty bilans (one per flag). Requires at least one of `hasInitialBilan | hasEvolutionBilan | hasRelapseBilan | hasExtensionBilan` to be true, otherwise throws `forms.validation-errors.addTreatment.requireOneBilan`. Initial `totalSessions` is set from `Treatments.getDisorderSessions()[type]`.

### `treatments.get`
Returns `Treatments.find({patientFileId}).fetch()`. Gated by `patientFile.view` permission.

### `treatments.edit`
Updates the treatment document excluding `_id`, `bilans`, and `patientFileId`. Runs `Treatments.schema.validate` on the payload first (minus bilans, practiceId, hasActiveSub).

### `treatments.edit.notification.settings`
Updates `notifications.date` and/or `notifications.sessions`. Permission `treatments.edit`. Uses `flat()` to merge nested keys.

### `treatments.updateHalingoSessionCount` — `getHalingoSessionCount`
`treatments/methods.js:197-220`. Runs `TreatmentsUtil.getSessionCount(treatmentId)` which sums `sessionCount` across all linked events where `hasPayBack === true` (`server/util.js:99-106`). Permission: `treatments.edit`. This is the "recompute my RIZIV tally" button in the patient file.

### `treatments.remove`
Deletes the treatment if `canTreatmentBeRemoved(treatmentId)` — that is, no events reference it (`server/util.js:12-14`). Otherwise throws `errors.treatment_has_invoiced_events`.

### `treatment.can.be.removed`
Returns the same boolean without attempting the delete.

### `treatments.bilans.add`
Appends a new empty bilan `{_id, type, createdAt}`. Rejected if the schema validation breaks (in particular the "at most one initial" / "bilans ordered after initial" constraint).

### `treatments.bilans.edit`
Replaces the bilan subdoc. Validates the full treatment schema. Uppercases `bilan.prescriber.name` before save. After saving, if `isReimbursed` changed, calls `EventsUtil.checkEventsOfBilanType(treatmentId, dbBilan.type)` — which walks every linked event with the matching appointment-type code (`2` for initial, `3` for evolution, `5` for relapse) and runs `_updateOnEventChange` to re-evaluate each event's `hasPayBack` flag.

### `treatments.bilans.remove`
`server/util.js:31-49`. Refuses if any event's `[start, end]` window overlaps the bilan's `[start, end]` window — throws `errors.bilan_has_linked_events`. Otherwise `$pull`s the bilan from the array.

## Publications

`app/imports/api/treatments/server/publications.js`:

- `treatmentsForPatientFile(patientFileId)` — returns `Treatments.find({patientFileId})` joined with `PatientFileUsers` for permissions. Gated by `PatientFileUtil.canUserViewPatientFile`.
- `treatment(treatmentId)` — single treatment. Same permission gate.
- `documentsOfTreatment(treatmentId)` — `Documents` where `meta.treatmentId === treatmentId`.
- `reportsOfTreatment(treatmentId)` — `PatientFileReports` where `treatmentId` matches.

## Hooks and observers

### `Treatments.after.update` — `server/hooks.js`
- If the treatment just became `removed` or notifications were disabled → unregister both observers.
- If notifications were just enabled → register both observers.
- If `totalSessions` / `usedSessions` / `notifications.sessions` changed → re-register the session observer.
- If the valid bilan's `end` date or `notifications.date` changed → re-register the date observer.

### `TreatmentDateObserver` — `server/TreatmentDateObserver.js`
Schedules a `SyncedCron` job per treatment. The job runs at `bilan.end - notifications.date` days and pushes a `patient.treatments.notifications.expiring.date` notification (with the days-remaining and patient name) to:
- All users in `PatientFileUsers` for that patient file.
- Falling back to practice owner + admins if nobody is explicitly sharing the file.

### `TreatmentSessionObserver` — `server/TreatmentSessionObserver.js`
Schedules a `SyncedCron` job that fires at the END time of the *first* appointment after which the remaining session count would drop below `notifications.sessions` (default 10). Walks `Events.find({hasPayBack: true, treatmentId, type: 1})` sorted by start and picks the first whose inclusion exceeds the threshold. Body key `patient.treatments.notifications.expiring.sessions`.

Both observers are re-hydrated from the cached `notifications.*Scheduled` dates at server start-up (`server/startup.js`) so a process restart doesn't lose them.

### Debouncer on event changes
`app/imports/api/events/server/hooks.js` — every `Events.after.insert`/`update` enqueues a 5-second-debounced `TreatmentSessionObserver.addObserver(treatment)` call. Multiple rapid edits re-schedule the observer only once.

## User-visible behaviour

### Add a treatment
From the patient file, the user picks a treatment type, names it, ticks which bilan slots to create up front (initial / evolution / relapse / extension), and hits save. The new treatment starts in `approvalState: testing` (meaning "I'm not sure this is reimbursable yet"), with `totalSessions` populated from the type default and `usedSessions: 0`.

### Fill in a bilan
The therapist opens the bilan, enters prescriber details, start/end dates, prescription date, and toggles `isReimbursed` once the insurer approves. Saving uppercases the prescriber name. If `isReimbursed` flipped, all linked events of that bilan's type get their `hasPayBack` recomputed.

### Session counting and the RIZIV graph
See [session_counting.md](session_counting.md). The treatments side exposes:
- `treatment.totalSessions` — the cap.
- `treatment.usedSessions` — the pre-Halingo backlog.
- The effective "used by Halingo events" is computed on-the-fly as `getSessionCount(treatmentId)`.
- `getSessionsLeft(treatment)` returns `max(0, totalSessions - usedSessions - ΣeventSessionCount)`.

### Notifications
The therapist can enable/disable per-treatment notifications and set two thresholds: X days before bilan expiry, and Y sessions remaining. Both trigger an in-app notification (not email) via `Notifications.insert` (`server/util.js:60-97`) with type `WARNING`.

### Reminders go to the therapist, not the patient
The observers emit in-app notifications to users linked to the patient file (or practice admins as fallback). There is no patient-side reminder anywhere in the treatments codepath, nor anywhere else. See `calendar_overview.md#patient-facing-appointment-reminders---not-in-code`.

## Permissions

Granular, managed through both `patientFileUsers` (per-patient ACL) and `practiceUsers` (practice-wide roles):

- `treatments.add`, `treatments.edit`, `treatments.remove` — required on the patient file.
- `treatments.bilans.add`, `treatments.bilans.edit`, `treatments.bilans.remove` — separate permission keys (see the permissions table in `patientFileUsers`).

The methods use `PermissionValidatedMethod` which auto-wires the check via `getPermissionData({...}) → { patientFileId, practiceId }`.

## Notable details

### `approvalState: testing` is the default
A freshly-added treatment is neither `approved` nor `pending` — it starts at `testing` (`treatments.js:94-96`). A treatment in the `declined` state is treated as inactive. The codebase does not auto-flip `testing → approved`; the therapist has to edit the field manually.

### Bilan types have a strict order
`treatments.js:99-116` enforces: at most one initial bilan, and all other bilans must start **after** the initial bilan ends (`invalidBilanOrder` error). Evolution, relapse, and extension bilans can overlap each other — only the initial bilan is special.

### `isActive()` depends on `getValidBilan()`
A treatment is only active if the current date falls inside the `[start, end]` window of some bilan AND the treatment is not declined. This is a subtle trap: a treatment with all its bilans expired silently becomes inactive and no events can be reimbursed against it until a new bilan is added.

### VideoConsultationCode is hard-coded
`Treatments.VideoConsultationCode = 792433` (`treatments.js:353`). Only referenced from the invoice-generation side (not searched in depth here). A video-consultation event built as `type === 1, meta.location === 6` falls back through the `DEFAULT.6` branch in `getDisorderCodes`.

### `a` type only has the 30-min session code
Treatment type `a` in `getDisorderCodes()` (`treatments.js:355-367`) only defines `1.30.*` — a 30-minute session. No 60-min, no bilan codes. The DEFAULT branch is merged in via `codes(true)` to fill the gaps.

### `g` type has only a partial table
Treatment type `g` (`treatments.js:752-760`) only defines 30-min sessions in `OFFICE`, `HOME`, `HOSPITALISATION`. No SCHOOL, no REVALIDATION, no VIDEO_CONSULTATION. Any attempt to code a session in those combinations returns `undefined`.

### `totalSessions` is editable
Even though it is defaulted from `getDisorderSessions()`, the field is writable through `treatments.edit`. This is how therapists override the default bracket if the insurer approves a non-standard cap for a specific patient.

### `supplementaryInsurance.payback` is a cents amount
When an event is invoiced under a supplementary insurance treatment, the reimbursement amount is read from the treatment's `supplementaryInsurance.payback` field, not from `Events.getPrices()`. The codes table returns `"AV"` as the "code" for all combinations.

### `removeBilan` is picky
`_removeBilan` at `server/util.js:31-49` only runs when `bilan.start && bilan.end` are both set. If either is null (newly added, not yet filled in), the query short-circuits and the bilan is removed regardless. This is intentional — you can always delete an unconfigured bilan, but once dates are set, any overlapping event blocks removal.

### Two cron observers, one treatment
A single treatment can have up to two active `SyncedCron` jobs: `treatment_observer_${id}_date` and `treatment_observer_${id}_sessions`. They are independently scheduled, cached, and canceled. If either observer's prerequisites become invalid (notifications disabled, treatment removed, etc.), both are torn down.

### `usedSessionsEvents` never written
Declared in the schema with `defaultValue: 0` but never assigned to anywhere. Historical artefact — likely pre-dates the cached `sessionCount` on events.

## Helpdesk overlap

The helpdesk covers:
- How to add a treatment and bilans.
- The RIZIV bracket concept and how the "sessions used" graph reflects reality.
- The approval/declined states.

The helpdesk does **not** cover:
- The `testing` default state.
- The `notifications.*` cron jobs and their effective triggers.
- The `getHalingoSessionCount` recompute button.
- The bilan-order validation rule (initial must precede all others).
- The `checkEventsOfBilanType` cascade when flipping `isReimbursed`.
- The `supplementaryInsurance` + "AV" code path.
- The per-type max bracket values in `getDisorderSessions`.
- That `usedSessions` is the manual backlog, not the live counter.

## Source files

- `app/imports/api/treatments/treatments.js` — collection, schema, helpers, `getTypes`, `getDisorderSessions`, `getDisorderCodes`, `bilanSchema`, `approvalStates`, `getBilanTypes`.
- `app/imports/api/treatments/methods.js` — `treatments.add`, `treatments.get`, `treatments.edit`, `treatments.edit.notification.settings`, `treatments.updateHalingoSessionCount`, `treatments.remove`, `treatment.can.be.removed`, `treatments.bilans.add`, `treatments.bilans.edit`, `treatments.bilans.remove`.
- `app/imports/api/treatments/server/util.js` — `canTreatmentBeRemoved`, `_removeBilan`, `_removeTreatment`, `sendNotification`, `getSessionCount`, `getSessionsLeft`, `getNotificationSetting`.
- `app/imports/api/treatments/server/hooks.js` — `Treatments.after.update` / `Treatments.after.remove` to schedule observers.
- `app/imports/api/treatments/server/startup.js` — hydrate observers from cached schedule dates on server boot.
- `app/imports/api/treatments/server/TreatmentDateObserver.js` — "X days before bilan end" notification.
- `app/imports/api/treatments/server/TreatmentSessionObserver.js` — "Y sessions left" notification.
- `app/imports/api/treatments/server/publications.js` — `treatmentsForPatientFile`, `treatment`, `documentsOfTreatment`, `reportsOfTreatment`.
- `app/imports/api/events/server/util.jsx:358-372` — `_checkEventsOfBilanType` called by `editBilan`.
- `app/imports/api/events/server/util.jsx:21-214` — `_canBePaidBack` uses `treatment.getValidBilan`, `treatment.getBilanByType`, `treatment.isSupplementaryInsurance`.
