# Rosa integration

> **↪️ Architectural note (confirmed 2026-04-07):** the 5-minute pull `setInterval` registered in `app/imports/api/practice/server/hooks.js:72-139` is currently the live mechanism, but its architectural target is a **lambda function in the mono repo's backend-stack**. Q20 of [`../open_questions.md`](../open_questions.md): "atm ran on all servers, but we only have 1. This should be ran through a lambda function (backend-stack in the mono repo)". Production currently has a single server, so the singleton assumption holds; do not scale out without moving the cron first. See [`../deprecation_list.md` #21](../deprecation_list.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered (see `../../full_documentation/rosa_bidirectional_sync_and_patient_appointment_data_flow.md` et al.). The helpdesk's "bidirectional" claim was verified in code: pull paths exist in `rosa-patients.ts:100` (`pullPatientsForUser`) and `rosa-events.ts:53` (`pullEventsForUser`); push paths exist in `push-events-to-rosa.ts` and `push-patient-records-to-rosa.ts`. Auth is a long-lived integration token (not OAuth2).

## What it is

Two-way synchronisation between Halingo and Rosa.be, a Belgian practice-management / online booking platform for healthcare professionals (HPs). Rosa exposes a public integration API; Halingo calls that API under the authority of a per-user **integration token** that the user copies from Rosa and pastes into Halingo.

When the integration is set up, Halingo will push its patient files, calendar events and appointment motives into Rosa and pull back any patients or events that were created or edited directly inside Rosa (for example, an online booking by a patient on the Rosa public booking site). Each patient record and each event in Halingo tracks its corresponding `rosaId` so updates can be round-tripped without duplication.

This is the **only TypeScript module** in the Halingo codebase (`app/imports/api/rosa/**/*.ts`). Everything else is JavaScript / JSX.

## Where it lives in the UI

Route `/rosa` → `RosaPageContainer` → `RosaPage` (`app/imports/modules/rosa/rosa-page.jsx`). From the user's perspective this is a single screen under the main navigation that shows:

- a description of what Rosa is and links to `pro.rosa.be` and `hp-calendar.rosa.be` (`rosa-page.jsx:85-93`);
- the current connection state per practice, colour-coded green (Verbonden) / red (Niet verbonden / Token ongeldig) (`rosa-page.jsx:99-121`);
- the time of the last patient fetch and the last events fetch, highlighted red if older than 30 minutes (`rosa-page.jsx:70`, `rosa-page.jsx:131-159`);
- a token text input and `CONNECT` button when not connected (`rosa-page.jsx:177-196`);
- `SYNC_PATIENTS` and `SYNC_EVENTS` on-demand sync buttons when connected (`rosa-page.jsx:160-174`);
- a `DISCONNECT` icon in the status header (`rosa-page.jsx:110-116`).

A `SelectCalendarDialog` is shown as a modal if the Rosa API returns `FOUND_MULTIPLE_CALENDARS_FOR_HP` during connect, letting the user pick which Rosa calendar to bind (`rosa-page.jsx:32-40`, `select-calendar-dialog.jsx`).

## Data model

### On the `Meteor.users` document

A `rosaIntegrations` array with one entry per practice the user has connected to Rosa:

```ts
// inferred from users.type.ts / rosa-users.ts / rosa-events.ts usage
rosaIntegrations: [
  {
    practiceId: string;
    token: string;            // the integration token pasted by the user
    calendarId: string;       // selected Rosa calendar for this user
    hpId: string;             // Rosa healthcare-professional id
    isUserInput: boolean;     // true if the user pasted the token, false if it was seeded
    tokenInvalid?: boolean;   // set to true on 401 / "Wrong credentials" 403 responses
    isSyncingEvents?: boolean;
    lastEventsFetch?: Date;
    lastPatientsFetch?: Date;
  }
]
```

Sources: `app/imports/api/rosa/server/api/util.ts:4-13` (reads `integration.token`), `app/imports/api/users/server/rosa-users.ts:36-47` (writes `token`, `isUserInput`, `tokenInvalid`), `app/imports/api/events/server/rosa-events.ts:66-70` (writes `isSyncingEvents`, `lastEventsFetch`), `app/imports/api/events/server/rosa-events.ts:253-261` (clears `isSyncingEvents`, sets `lastEventsFetch`), `app/imports/api/patientFiles/server/rosa-patients.ts:234-237` (sets `lastPatientsFetch`), `app/imports/api/users/server/rosa-users.ts:110-123` (initial push of `hpId`, `calendarId`).

### On `Practices`

- `rosaId` — Rosa `organizationId` for the practice (`rosa-practices.ts:245-248`).
- `rosaMotives[]` — per-practice list of Rosa motive ids paired with the Halingo `type` / `subType` / `location` they correspond to (`rosa-practices.ts:153-173`). Used to map both ways between Rosa motives and Halingo session types.

### On `PatientFiles`

- `rosaId` — Rosa patient-record id (`rosa-patients.ts:504-506`).
- `mergedFromRosaIds`, `mergedToRosaId` — Rosa-side merge pointers (`rosa-patients.ts:784-786`, `rosa-patients.ts:624-627`).
- `isMissingInRosa` — set to `true` when a sync attempt finds the Rosa id no longer exists (`rosa-patients.ts:819-822`).
- `deletedInRosa` — set after a delete has been propagated to Rosa (`rosa-patients.ts:577-580`).
- `fromRosa`, `requiresReview` — flags set on patients first seen via pull from Rosa (`rosa-patients.ts:180-183`, `rosa-patients.ts:211-213`).

### On `Events`

- `rosaId` — Rosa event id (`rosa-events.ts:453-457`).
- `rosaMotiveId` — the Rosa motive id when the event was created in Rosa under an unrecognised motive (`rosa-events.ts:692-694`).
- `fromRosa`, `requiresReview` — set on events pulled from Rosa (`rosa-events.ts:222-226`).

## Methods (Meteor)

**Connection / disconnection** (`app/imports/api/users/methods.jsx`):

| Method | Name | Args | Effect |
|---|---|---|---|
| `connectToRosa` | `users.rosa.connect` (`:355`) | `{ token, practiceId, calendarId? }` | Calls `RosaUsers.setIntegrationTokenToUserAndCheckPractice(user, practiceId, token, calendarId)`. |
| `disconnectFromRosa` | `users.rosa.disconnect` (`:385`) | `{ practiceId }` | Sets `rosaIntegrations.$.isUserInput = false` and `rosaIntegrations.$.tokenInvalid = true` (does **not** delete the entry, does **not** unregister on Rosa). |

**On-demand sync** (user-triggered from the Rosa page):

| Method | Name | Args | Effect |
|---|---|---|---|
| `syncPatientFiles` | `patientFile.sync.rosa` (`app/imports/api/patientFiles/methods.jsx:1001`) | `{ practiceId }` | `RosaPatients.syncPatientRecordsForUsers([user], practiceId)` — pull then push. |
| `syncEvents` | `events.sync.rosa` (`app/imports/api/events/methods.js:593`) | `{ practiceId }` | `RosaEvents.syncEventsForRosa([user], practiceId)` — pull then push. |

Both are `PermissionValidatedMethod` with empty `permissions: []` and `subscription: true` (i.e. require an active subscription).

Every event-mutating method (`events.create`, `events.remove`, `events.update`, bulk operations) calls `RosaEvents.pushEventsToRosa([eventIds])` after the mutation; see `app/imports/api/events/methods.js:39`, `:68`, `:75`, `:197`, `:251`, `:348`. `pushEventsToRosa` is a `setTimeout(1)`-scheduled fire-and-forget wrapper around `pushEventsToRosaSync` (`rosa-events.ts:324-328`) so the calling method returns immediately and the Rosa push runs asynchronously — failures are logged but do not bubble back to the user.

## Publications

None specific to Rosa. The Rosa page reads the current user document (which includes `rosaIntegrations`) from the standard user publication.

## Rosa API contracts (TypeScript DTOs)

All endpoints live under one of two base URLs configured in Meteor settings:

- `Meteor.settings.rosa.adminEndpoint` — internal admin stack, authenticated with header `x-api-key: ${Meteor.settings.rosa.adminToken}` (server-to-server, not per-user).
- `Meteor.settings.rosa.apiPublicIntegrationEndpoint` — public integration API, authenticated with header `Authorization: Bearer ${integrationToken}` (per-user).

All requests go through `axios`.

### Admin stack (`app/imports/api/rosa/server/api/admin-stack.ts`)

| HTTP | Path | Function | Request DTO | Response DTO |
|---|---|---|---|---|
| POST | `/setup-new-org ` (trailing space in code) | `createPracticeInRosa` (`:5-32`) | `SetupNewOrgRequestDto` (`setup-new-org-request.dto.ts`) | `SetupNewRogResultDto` (`setup-new-rog-result.dto.ts`) |
| GET | `/hps ` (trailing space in code) | `getHps` (`:34-49`) | query `emails=<csv>` | `GetHpsResultDto[]` (`get-hps-result.dto.ts`) |

`SetupNewOrgRequestDto` fields: `organizationName`, `siteName`, `siteAddress: AddressDto`, `siteContactInfos: ContactInfoDto[]`, `owner: ICustomer`, `customers: ICustomer[]`. `ICustomer` includes `email`, `firstName`, `lastName`, `language`, `legalGender`, `nihii`, `isHp`, `plan`, `softwareIntegration` (`i-customer.ts`).

`SetupNewRogResultDto` fields: `{ org: Organization, motives: Motive[], usersWithIntegration: { email, integrationToken }[] }`. Halingo uses `usersWithIntegration[*].integrationToken` to seed `rosaIntegrations.token` on each Halingo user (`rosa-practices.ts:250-260`).

### Organizations (`api/rosa/server/api/organizations.ts`)

| HTTP | Path | Function | Returns |
|---|---|---|---|
| GET | `/organizations/current` | `getOrganizationOfUser` (`:7-19`) | `OrganizationDto` |

Used during `connectToRosa` to verify that the token belongs to the Rosa organization already bound to the practice (`rosa-users.ts:23-34`, `rosa-users.ts:66-72`).

### HPs (`api/rosa/server/api/hps.ts`)

| HTTP | Path | Function | Returns |
|---|---|---|---|
| GET | `/hps/current` | `getCurrentHp` (`:7-16`) | `HpDto = { id, nihii?, firstName, lastName }` |

Used during `connectToRosa` to resolve the Rosa `hpId` for the current user.

### Calendars (`api/rosa/server/api/calendars.ts`)

| HTTP | Path | Function | Returns |
|---|---|---|---|
| GET | `/calendars?fromRequestingHp=true` | `getCalendarsOfUser` (`:9-21`) | `CalendarDto[]` |
| GET | `/calendars/:id` | `getCalendarOfUser` (`:23-36`) | `CalendarDto` |
| PUT | `/calendars/permissions/bulk` | `updateCalendarPermissionsOfUser` (`:38-55`) | `CalendarDto[]` |

`CalendarDto = { id, label, color, hpId, permissions? }`. If `getCalendarsOfUser` returns more than one calendar for the same `hpId`, `rosa-users.ts:85-87` throws `FOUND_MULTIPLE_CALENDARS_FOR_HP`, which the UI catches and opens the `SelectCalendarDialog` with the list so the user can pick one.

### Motives (`api/rosa/server/api/motives.ts`)

| HTTP | Path | Function | Purpose |
|---|---|---|---|
| POST | `/motives/bulk` | `createMotivesForUser` (`:7-20`) | Create the Halingo motive set for a practice |
| PATCH | `/motives/bulk` | `updateMotivesForUser` (`:22-35`) | Update / archive motives |

The motive set is fixed in `rosa-practices.ts:45-114` — 13 motives covering Session 30/60 min, Session 30 min - School, Session - Geen terugbetaling, Group session, Evolutiebilan (+ School variant), Hervalbilan (+ School variant), Aanvangsbilan, Ouderbegeleiding groep / individueel, Overleg. Each has an internal `HalingoEventAppointmentType` + `subType` + optional `location` that gets stored on `Practices.rosaMotives[]` alongside the Rosa `rosaId`.

### Patient records (`api/rosa/server/api/patient-records.ts`)

| HTTP | Path | Function | Request / purpose |
|---|---|---|---|
| GET | `/patients` | `getPatientRecordsOfUser` (`:8-22`) | `GetPatientRecordsRequestDto` (paging, `updatedSince`, `ids`) |
| POST | `/patients/bulk` | `createPatientRecordsForUser` (`:24-37`) | `PatientRecordDto[]` |
| PATCH | `/patients/bulk` | `updatePatientRecordsForUser` (`:39-52`) | `PatientRecordDto[]` |
| PUT | `/patients/permissions/bulk` | `updatePatientRecordPermissionsOfUser` (`:54-71`) | `PermissionUpdateDto[]` |
| POST | `/patients/merge` | `mergePatientRecordsForUser` (`:73-86`) | `MergePatientRecordsRequestDto = { mainPatientRecordId, secondaryPatientRecordId, mergedPatientRecord }` |
| DELETE | `/patients?ids=<csv>` | `deletePatientRecordsForUser` (`:88-104`) | — |

`PatientRecordDto` has `id?, firstName?, lastName?, middleName?, ssin?, legalGender?, birthdate? (PartialDateDto), language?, contactInfos?: ContactInfoDto[], note?, address?, status?: PatientRecordStatus ("ACTIVE"|"INACTIVE"), permissions?, mergedFromIds?, mergedToId?` (`patient-record.dto.ts`).

### Events (`api/rosa/server/api/events.ts`)

| HTTP | Path | Function |
|---|---|---|
| GET | `/events` | `getEventsOfUser` (`:8-22`) |
| POST | `/events/bulk` | `createEventsForUser` (`:24-37`) |
| POST | `/events/bulk/recurring` | `createRecurringEventsForUser` (`:39-52`) |
| PATCH | `/events/bulk` | `updateEventsForUser` (`:54-67`) |
| PATCH | `/events/bulk/recurring` | `updateRecurringEventsForUser` (`:69-82`) |

`EventDto` (`event.dto.ts`): `{ id?, title?, status: EventStatus ("ACTIVE"|"CANCELED"|"DELETED"|"NO_SHOW"), calendarId, motiveId?, attendees?, description?, patientNote?, hpNote?, startAt, endAt?, type: EventType ("APPOINTMENT"|"PERSONAL"|"LEAVE"|"EXTERNAL_EVENT"), groupId? }`.

`RecurringEventDto = { recurrenceId, occurrences: EventDto[] }`.

### Shared helpers (`api/rosa/server/api/util.ts`)

- `getTokenFromUser(user, practiceId)` — finds the `rosaIntegrations` entry for the practice and returns `.token`; throws `"Integration does not exists"` if none.
- `invalidateTokenOn403(user, practiceId)` — `.catch` handler that on HTTP 401 **or** HTTP 403 with body `message: "Wrong credentials"` sets `rosaIntegrations.$.tokenInvalid = true` on the user and then rethrows. This is how an invalidated token surfaces as "Token ongeldig" in the UI.

## Sync direction — is Rosa bidirectional or push-only?

**Bidirectional.** The helpdesk's "bidirectional" claim is confirmed by the code. The scout pass's "push-only" note was wrong. Both directions exist and both run on a cron.

### Push Halingo → Rosa

- **Practice setup**: `RosaPractices.createPracticeInRosa` (`rosa-practices.ts:177-277`) creates the Rosa organization, seeds the user integration tokens, creates the fixed motive set, configures calendar permissions, and then calls `syncPatientRecordsForUsers` + `syncEventsForRosa` to push existing data. Invoked from `SetupPracticesInRosa` (migration v28) and from `linkPracticeInRosa` (new connections).
- **Patient records**: `RosaPatients.pushPatientsToRosaForUser` (`rosa-patients.ts:481-584`) — creates new Rosa records for `rosaId == null` Halingo patients, updates existing ones, deletes on Rosa when the Halingo patient is removed. Permissions on the Rosa patient record are computed from the Halingo `PatientFileUsers` + `PracticeUsers` table and pushed via `updatePatientRecordPermissionsOfUser`.
- **Events**: `RosaEvents.pushEventsToRosaForUser` (`rosa-events.ts:415-472`) splits events into repeating vs non-repeating, chunks non-repeating in batches of 50, and either creates (`POST /events/bulk` or `POST /events/bulk/recurring`) or updates (`PATCH`). Only events with `start >= now - 30 days` are considered (`rosa-events.ts:279-281`).
- **Real-time event push** on every `events.create`, `events.remove`, `events.update` etc. is an **asynchronous, fire-and-forget** `setTimeout(1)` (`rosa-events.ts:324-328`). The user-facing method returns immediately. Errors are `console.log`-ed inside `invalidateTokenOn403` but not surfaced to the UI.
- **Motive fixups**: `pushMissingMotiveToRosa` migration (v31) — adds the `SESSION_NO_PAYBACK` motive (`type: 6`) for practices that don't already have one (`push-missing-motive-to-rosa.ts`, filters on `"rosaMotives.type": { $ne: 6 }`).

### Pull Rosa → Halingo

Pulling happens in two places:

1. **On a 5-minute cron** started in `Meteor.startup` in `app/imports/api/practice/server/hooks.js:72-139`. Every 300 000 ms, for every practice with `rosaId` and every user with a non-`tokenInvalid` integration, the server runs:
   - `RosaPatients.pullPatientsForUsers(usersOfPractice, practice._id)` — `GET /patients` with `updatedSince = lastPatientsFetch`, then for each returned patient either updates the existing Halingo `PatientFile` matched by `rosaId`, creates a new one flagged `fromRosa: true, requiresReview: true`, or handles Rosa-side merges by consolidating the corresponding Halingo files (`rosa-patients.ts:100-238`).
   - `RosaEvents.pullEventsForUsers(usersOfPractice, practice._id)` — `GET /events` paged, then either updates an existing Halingo `Event` by `rosaId` (or same `patientFileId + start`), or creates a new event flagged `fromRosa: true, requiresReview: true`. A rate-limit guards against repeated pulls within 1 hour while a sync is still marked `isSyncingEvents` (`rosa-events.ts:53-262`).
   - The cron is skipped entirely when `Meteor.settings.disableRosaSync` is set (`hooks.js:75`).
2. **On user-triggered sync** from the Rosa page, via `syncPatientFiles` and `syncEvents`, which call the `syncPatientRecordsForUsers` and `syncEventsForRosa` helpers respectively; both do pull-then-push.

### Review flow for pulled-in data

When an event or patient comes back from Rosa, it is written with `requiresReview: true`. The Halingo UI surfaces this as:

- `PATIENT_NEEDS_REVIEW` / `REVIEW_PATIENT` ("Dit is een nieuwe patiënt van Rosa") — `nl.i18n.js:1449-1450`.
- `EVENT_NEEDS_REVIEW_NO_TREATMENT` ("Dit is een nieuwe afspraak van Rosa waarvoor geen behandeling kon gevonden worden, gelieve een behandeling te kiezen") — `nl.i18n.js:1451-1452`.

The user can then merge the patient into an existing file or pick a treatment for the event.

### Conflict resolution

No conflict resolution beyond:

- `rosaId` is the primary reconciliation key on both sides.
- Pulled event updates **refuse** to overwrite an event that is already linked to a Halingo invoice — `if (existingEvent.invoiceId) return;` (`rosa-events.ts:158-161`).
- On ambiguous matches the pulled event uses `patientFileId + start` as a fallback key (`rosa-events.ts:128-135`).
- When a Rosa update is POSTed but the Rosa patient no longer exists, Halingo calls `checkPatientRecordsExistsInRosa` which marks the missing ones with `isMissingInRosa: true` and retries only the ones that still exist (`rosa-patients.ts:532-553`, `:797-839`).

> ⚠️ Behaviour inferred from code; needs product validation — specifically whether "last write wins" on the non-invoice fields of an event is the intended UX.

## Authentication model — not OAuth2

Despite the term "token", the Rosa integration is **not OAuth2**. There is no authorisation code flow, no redirect back from Rosa, no refresh-token dance. The user goes to `hp-calendar.rosa.be/nl/settings/organization/integrations`, generates a long-lived **integration token** on the Rosa side, and pastes it into the `INPUT_TOKEN` text field on the Halingo `/rosa` page. `connectToRosa` then calls `RosaUsers.setIntegrationTokenToUserAndCheckPractice`, which:

1. Stores the raw token on `Meteor.users.rosaIntegrations[].token` (`rosa-users.ts:36-47`, `:110-123`).
2. Calls `GET /organizations/current` with the token to verify it belongs to the same Rosa organization already bound to `Practices.rosaId` (mismatch → `ORGANIZATION_DOES_NOT_MATCH_PRACTICE_ID`, unrelated practice → `ORGANIZATION_ALREADY_LINKED_TO_PRACTICE_ID`).
3. Calls `GET /hps/current` and `GET /calendars?fromRequestingHp=true` to resolve `hpId` and `calendarId` (wrong token → `INTEGRATIONS_WRONG_TOKEN`, multiple calendars → `FOUND_MULTIPLE_CALENDARS_FOR_HP`).
4. Runs an initial pull-then-push via `syncPatientRecordsForUsers` + `syncEventsForRosa`.

The token has **no refresh** — on invalidation the `tokenInvalid` flag is set and the UI prompts the user to paste a new one. `disconnectFromRosa` just marks the integration `tokenInvalid: true` locally; it does not call any Rosa endpoint to revoke.

> ⚠️ Behaviour inferred from code; needs security review — raw Rosa tokens are stored plaintext on the user document. There is no indication of encryption at rest.

## User-visible behaviour

- A user on a practice that has an active subscription and a `Practices.rosaId` (set during migration v28 or via `createPracticeInRosa`) sees the `/rosa` page with a "Niet verbonden" status and a text field to paste a token.
- After `CONNECT`, the status flips to "Verbonden" and the last-sync timestamps start updating.
- Any patient or event created, edited or removed in Halingo is pushed to Rosa asynchronously within one tick.
- Every 5 minutes, a cron pulls fresh data from Rosa. New patients / events arrive marked `requiresReview`.
- If the Rosa token is invalidated (HTTP 401 or HTTP 403 "Wrong credentials"), the status flips to "Token ongeldig" in red and the last-sync cells turn red after 30 minutes of staleness.
- The user can force an on-demand pull-and-push at any time via the `SYNC_PATIENTS` and `SYNC_EVENTS` buttons.

## Permissions

- `connectToRosa`, `disconnectFromRosa`, `syncPatientFiles`, `syncEvents` are `LoggedInValidatedMethod` / `PermissionValidatedMethod` with empty `permissions: []`, i.e. any logged-in user with an active subscription can use them against their own `userId`.
- The admin-stack endpoints (`setup-new-org`, `hps`) are authenticated with a server-wide `Meteor.settings.rosa.adminToken` and are only invoked from migration code (v28) and from the admin `createPracticeInRosa` flow — never from a user-facing method.
- Rosa-side patient permissions are computed from `practiceUsers.role` (`owner` / `admin` / `lid`) and `patientFileUsers.role` (`admin` / `default`) and pushed via `updatePatientRecordPermissionsOfUser`. Owners and admins get full `READ_DOCUMENT | UPDATE_DOCUMENT | UPDATE_PERMISSION | DELETE_DOCUMENT`; "default" users get `READ_DOCUMENT | UPDATE_DOCUMENT` only (`rosa-patients.ts:340-359`).

## Notable details

- **Hardcoded 30-day push window.** `pushEventsToRosaForPractice` only pushes events with `start >= now - 30 days`. Historical events older than that are excluded from scheduled / batched pushes (`rosa-events.ts:279-281`). Individual event mutations via `pushEventsToRosa` do not apply this filter.
- **One-by-one concurrency.** Almost every loop uses `pLimit(1)` — events per user, patients per user, recurring event chunks — meaning Rosa API calls for a single practice are fully serialised (`rosa-events.ts:284-285`, `rosa-patients.ts:84`, `push-events-to-rosa.ts:26`, etc.). The 5-minute cron uses `pLimit(5)` across practices (`hooks.js:95`).
- **Fire-and-forget push on mutation.** `RosaEvents.pushEventsToRosa` wraps `pushEventsToRosaSync` in a `setTimeout(() => ..., 1)` so the Meteor method returns immediately (`rosa-events.ts:324-328`). Errors are `console.log`-ed but never bubble up.
- **Trailing spaces in admin-stack URLs.** `admin-stack.ts:10` and `:38` end the path with a literal trailing space (`"/setup-new-org "` and `"/hps "`). This is either (a) a bug tolerated by the Rosa admin router or (b) intentional, presumably tolerated. Preserved here verbatim.
- **Typed but untyped.** The TypeScript files are heavily annotated with `@ts-ignore` when calling into plain-JS collection helpers (`Events.findUnsafe`, `PatientFiles.findUnsafe`, `Events.updateUnsafe`, etc.) — the `Unsafe` suffix refers to Meteor's `rawCollection`, not to type safety.
- **The `SESSION_NO_PAYBACK` motive special case.** Events whose Halingo type is `APPOINTMENT` but `treatmentId == null` are mapped to the Rosa "Sessie - Geen terugbetaling" motive (type 6), which is *not* subject to the treatment-bilan matching logic (`rosa-events.ts:696-707`, `rosa-events.ts:787-805`).

## Migrations — the Rosa rollout timeline

| Migration | File | What it did |
|---|---|---|
| v28 | `migrations/migration-v28.js` → `rosa/server/setup-practices-in-rosa.ts` | For every practice with an `ACTIVE` subscription and no `rosaId` yet, call `RosaPractices.createPracticeInRosa(practice)`. This created the Rosa organization, generated the integration tokens, seeded `rosaId` + motives + calendar permissions, and did an initial pull+push of patients and events. |
| v29 | `migrations/migration-v29.js` → `rosa/server/push-patient-records-to-rosa.ts` | Iterate every practice with a `rosaId` and every user on it, run `RosaPatients.pushPatientsToRosaForPracticeId(users, practice._id)`. Backfills any patient records missed during v28. Serialised `pLimit(1)` across practices. |
| v30 | `migrations/migration-v30.js` → `rosa/server/push-events-to-rosa.ts` | Same pattern for events: `RosaEvents.pushEventsToRosaForPractice(users, practice._id)`. Backfills events. |
| v31 | `migrations/migration-v31.js` → `rosa/server/push-missing-motive-to-rosa.ts` | Finds every practice with `rosaId` and `rosaMotives.type != 6` and adds the `SESSION_NO_PAYBACK` motive by calling `RosaPractices.initMissingMotiveForPractice`. This patched the missing "Sessie - Geen terugbetaling" motive onto practices created before that motive existed. |
| v32 | `migrations/migration-v32.js` → `rosa/server/push-events-to-rosa.ts` | Re-runs the v30 event-push script. Presumably a second pass after v31 added the missing motive, so events that could not previously be mapped now get a valid `motiveId`. |
| v33 | `migrations/migration-v33.js` → `./subs-to-new-stripe.js` | **Unrelated to Rosa.** One-off Stripe subscription migration (`subsToNewStripe`). Included here only because it sits in the same numerical window. |

Additional Rosa-adjacent migrations in `migrations/36/add-missing-motives.ts` and `migrations/37/push-events-school-rosa.ts` continue the pattern (add school-location motives, push affected events) but post-date the initial rollout.

## Helpdesk overlap

The helpdesk describes the Rosa integration as a "bidirectional sync" and the code **confirms** this. Both pull (every 5 minutes + on-demand) and push (on every mutation + on-demand) are implemented. This means the earlier scout-pass note "push-only in code" was incorrect — pull is in `app/imports/api/patientFiles/server/rosa-patients.ts` and `app/imports/api/events/server/rosa-events.ts`, not in the `app/imports/api/rosa/server/` subtree, which is probably why it was missed.

The helpdesk does not document:

- The "token" model (it refers vaguely to "connecting" Rosa). There is no OAuth flow.
- The fire-and-forget push timing on event mutations.
- The 30-day push window.
- The `requiresReview` review flow for incoming Rosa data.
- The raw admin-stack endpoints used by migrations.

## Source files

- `app/imports/api/rosa/server/api/index.ts`
- `app/imports/api/rosa/server/api/admin-stack.ts`
- `app/imports/api/rosa/server/api/calendars.ts`
- `app/imports/api/rosa/server/api/events.ts`
- `app/imports/api/rosa/server/api/hps.ts`
- `app/imports/api/rosa/server/api/motives.ts`
- `app/imports/api/rosa/server/api/organizations.ts`
- `app/imports/api/rosa/server/api/patient-records.ts`
- `app/imports/api/rosa/server/api/util.ts`
- `app/imports/api/rosa/server/types/*.ts` (20+ DTO files)
- `app/imports/api/rosa/server/push-events-to-rosa.ts`
- `app/imports/api/rosa/server/push-patient-records-to-rosa.ts`
- `app/imports/api/rosa/server/push-missing-motive-to-rosa.ts`
- `app/imports/api/rosa/server/setup-practices-in-rosa.ts`
- `app/imports/api/events/server/rosa-events.ts`
- `app/imports/api/patientFiles/server/rosa-patients.ts`
- `app/imports/api/practice/server/rosa-practices.ts`
- `app/imports/api/practice/server/hooks.js` (the 5-minute pull cron)
- `app/imports/api/users/server/rosa-users.ts`
- `app/imports/api/users/methods.jsx:354-404` (`connectToRosa`, `disconnectFromRosa`)
- `app/imports/api/events/methods.js:593-611` (`syncEvents`)
- `app/imports/api/patientFiles/methods.jsx:1001-1019` (`syncPatientFiles`)
- `app/imports/modules/rosa/rosa-page.jsx`
- `app/imports/modules/rosa/rosa-page.container.jsx`
- `app/imports/modules/rosa/select-calendar-dialog.jsx`
- `app/imports/migrations/migration-v28.js` through `migration-v32.js`
- `app/imports/i18n/resources/client/nl.i18n.js:1428-1460` (all `ROSA_*` keys)
