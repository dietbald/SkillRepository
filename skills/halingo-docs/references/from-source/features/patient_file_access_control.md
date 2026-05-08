# Patient file access control

> **Important corrections (2026-04-07):**
> - The two-matrix design (`patientFileUsers` per-file ACL OR-combined with `practiceUsers` practice ACL) is **intentional**, not a bug. Per-file grants are additive on top of practice-level roles. See [`practice_user_roles.md`](practice_user_roles.md) for the corrected reading.
> - **`patientFileUsers.roles.owner` is unused and should be removed.** Q2 of [`../open_questions.md`](../open_questions.md): "owner is not used, can be removed". The earlier draft framed it as a "creator marker" — that framing was wrong; the role is genuinely dead. See [`../deprecation_list.md` #7](../deprecation_list.md).
> - **`patientFileUsers.admin` and `patientFileUsers.default` ARE identical at the role level — and that is a bug.** Q1 (clarified 2026-04-07): "the frontend blocks the .default as no button is available to do the action, the backend didnt block it thats a bug". The intended distinction is "admin manages ACL, default does not", but it is enforced only by hiding the buttons in the UI. A `default` per-file user can grant or revoke access by calling the underlying methods directly. See [`../bugs_and_security_findings.md`](../bugs_and_security_findings.md) §"Frontend-only access control on `patientFileUsers` ACL management".
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the three-tier practice role model (owner / beheerder / lid) and the "share a dossier" flow are in `full_documentation/general_getting_started.md` and `full_documentation/settings_practice_management.md`, but the granular per-file permission list and its interaction with practice-level roles are not.

## What it is

Halingo enforces patient-file access at two levels:

1. **Practice level** — via `practiceUsers` (one row per (user, practice) pair) with three coarse roles `owner / admin / default`. `owner` and `admin` ("beheerder") hold the full `patientFile.*` permission set at the practice scope, so they implicitly see every dossier in the practice. `default` ("lid") holds only `patientFile.add`.
2. **Per-file level** — via `patientFileUsers` (one row per (user, patientFile) pair) with three finer roles `admin / default / owner`. A `default` "lid" user must receive an explicit `patientFileUsers` row in order to view or manipulate a dossier.

A user has a given permission on a given dossier if **any** of the following is true:

- The user is an owner/admin at the practice level and the permission is in that practice role's list (`practiceUsers/practiceUsers.jsx:8-153`).
- The user has a per-file row whose role's permission list contains the permission (`patientFileUsers/patientFileUsers.jsx:6-57`).
- The user's id matches `patientFile.metaData.userId` — the implicit "I created this" relation — and the permission is in the dossier-level `owner` role list (`patientFileUsers/util.jsx:17-26`). Note that the dossier-level `owner` role only grants `patientFile.view`, so this path only earns you view.

Resolution logic: `app/imports/api/patientFileUsers/util.jsx:11-27`.

## Where it lives in the UI

- **Sharing box on the dossier dashboard** — `PatientFileShared.jsx` + `PatientFileSharedContainer.jsx` in `app/imports/modules/patientfiles/dashboard/`. Shows all users currently linked to the dossier via `patientFileUsers`, plus a "+" button that opens a modal listing therapists in the practice who do **not** already have practice-level `patientFile.view` — i.e. the lid users who need an explicit grant (`PatientFileSharedContainer.jsx:25-29`).
- **Revoke action** — inside the sharing box; opens a confirm dialog and calls `removeUserAccessToPatientFile` (`PatientFileShared.jsx:144-167`).
- **Practice user management page** — `app/imports/ui/pages/practices/users/PracticeUsers.jsx` (out of scope for this doc) is where the practice-level role of a user is changed.

There is no UI for bulk sharing one user to many files, though the method `patientFiles.grantAccess` exists and takes a `patientFileIds` array (`api/patientFiles/methods.jsx:440-509`).

## Data model

### Collection: `patientFileUsers`

`app/imports/api/patientFileUsers/patientFileUsers.jsx:59-82`. Client writes are denied; all mutations go through Meteor methods on the `patientFiles` module.

```js
PatientFileUsers.schema = new SimpleSchema({
  role: { type: String, defaultValue: "default", allowedValues: _.keys(roles) },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id },
  patientFileId: { type: String, regEx: SimpleSchema.RegEx.Id },
  createdAt: { type: Date },
  removed: { type: Boolean, optional: true },
  removedAt: { type: Date, optional: true },
});
```

Fields:

| Field | Purpose | Cite |
|---|---|---|
| `userId` | Practice user granted access | `patientFileUsers.jsx:75` |
| `patientFileId` | Target dossier | `patientFileUsers.jsx:76` |
| `role` | One of `admin / default / owner`. Defaults to `default`. | `patientFileUsers.jsx:74` |
| `createdAt` | Auto-stamped via base collection | `patientFileUsers.jsx:77`, `collection.js:13-16` |
| `removed` / `removedAt` | Soft-delete flags | `patientFileUsers.jsx:78-79` |

`PatientFileUsers.publicFields = { role, userId, patientFileId }` (`patientFileUsers.jsx:84-88`).

### Dossier-level roles (the critical matrix)

`app/imports/api/patientFileUsers/patientFileUsers.jsx:6-57`. All 17 permissions are listed verbatim:

```js
export const roles = {
  admin: {
    id: "admin",
    permissions: [
      "patientFile.remove",                         // 10
      "patientFile.update",                         // 11
      "patientFile.grantAccess",                    // 12
      "patientFile.view",                           // 13
      "patientFile.reports.add",                    // 14
      "patientFile.reports.delete",                 // 15
      "patientFile.reports.edit",                   // 16
      "patientFile.therapies.long.add",             // 17
      "patientFile.therapies.long.delete",          // 18
      "patientFile.therapies.long.edit",            // 19
      "patientFile.therapies.short.delete",         // 20
      "patientFile.therapies.short.edit",           // 21
      "treatments.add",                             // 22
      "treatments.edit",                            // 23
      "treatments.remove",                          // 24
      "treatments.bilans.add",                      // 25
      "treatments.bilans.edit",                     // 26
      "treatments.bilans.remove",                   // 27
    ],
  },
  default: {
    id: "default",
    permissions: [
      "patientFile.remove",                         // 33
      "patientFile.update",                         // 34
      "patientFile.grantAccess",                    // 35
      "patientFile.view",                           // 36
      "patientFile.reports.add",                    // 37
      "patientFile.reports.delete",                 // 38
      "patientFile.reports.edit",                   // 39
      "patientFile.therapies.long.add",             // 40
      "patientFile.therapies.long.delete",          // 41
      "patientFile.therapies.long.edit",            // 42
      "patientFile.therapies.short.delete",         // 43
      "patientFile.therapies.short.edit",           // 44
      "treatments.add",                             // 45
      "treatments.edit",                            // 46
      "treatments.remove",                          // 47
      "treatments.bilans.add",                      // 48
      "treatments.bilans.edit",                     // 49
      "treatments.bilans.remove",                   // 50
    ],
  },
  owner: {
    id: "owner",
    permissions: ["patientFile.view"],              // 55
  },
};
```

Line numbers in the comments refer to `app/imports/api/patientFileUsers/patientFileUsers.jsx`.

> ⚠️ Behaviour inferred from code; needs product validation. **`admin` and `default` per-file roles have the exact same permission list.** The code holds two roles with identical contents. There may historically have been a distinction that was later levelled (e.g. for Rosa permission mapping — see the Rosa section below). From the Halingo permission check path, `admin` and `default` are indistinguishable today.

### Full permission matrix (combined view)

Permissions a user can hold on a dossier, by role. The last column is the **implicit** `metaData.userId` path. `admin` and `default` rows are merged because they are equal:

| Permission | practice `owner` | practice `admin` | practice `default` (lid) | per-file `admin` / `default` | per-file `owner` | `metaData.userId` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `patientFile.view` | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `patientFile.add` | ✓ | ✓ | ✓ | — | — | — |
| `patientFile.count` | ✓ | ✓ | — | — | — | — |
| `patientFile.remove` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.update` | ✓ | ✓ | — | ✓ | — | — |
| `patientFiles.get` | ✓ | ✓ | — | — | — | — |
| `patientFile.grantAccess` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.removeAccess` | ✓ | ✓ | — | — | — | — |
| `patientFile.reports.add` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.reports.delete` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.reports.edit` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.therapies.long.add` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.therapies.long.delete` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.therapies.long.edit` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.therapies.short.delete` | ✓ | ✓ | — | ✓ | — | — |
| `patientFile.therapies.short.edit` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.add` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.edit` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.remove` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.bilans.add` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.bilans.edit` | ✓ | ✓ | — | ✓ | — | — |
| `treatments.bilans.remove` | ✓ | ✓ | — | ✓ | — | — |

Sources:

- Practice-level columns — `app/imports/api/practiceUsers/practiceUsers.jsx`: `owner` role permissions at lines 11-78, `admin` at 81-142, `default` at 143-153. The `patientFile.*` and `treatments.*` entries appear at lines 41-56 (owner), 106-121 (admin), 146-151 (default).
- Per-file columns — `app/imports/api/patientFileUsers/patientFileUsers.jsx:6-57`.
- `metaData.userId` column — implicit `owner` virtual relation at `patientFileUsers/util.jsx:17-26`.

Note that `patientFile.removeAccess` is **not** in the per-file `admin` permission set — only users with practice-level owner/admin can revoke another user's per-file access. Also `patientFile.count` and `patientFiles.get` (the bulk fetch) are practice-level-only.

### The "lid" scenario (plain practice member)

A `default` practice user has `patientFile.add` and nothing else at the practice level. For every dossier they want to touch, they must receive an explicit `PatientFileUsers` row. Two paths create that row:

1. They **created** the dossier themselves. `_addPatientFile` in `api/practice/server/util.tsx:176-186` checks the creator's practice role and, for any non-owner, inserts `{ patientFileId, userId, role: "admin" }` automatically.
2. Another user with `patientFile.grantAccess` explicitly shared the dossier with them via the sharing box (`PatientFileShared.jsx`), which calls `grantUserAccessToPatientFile` (`methods.jsx:406-438`).

Without one of those two, a lid cannot see the dossier — the roster `findPatientFiles` method filters with `PatientFileUsersUtil.filterPatientFilesOnPermission` (`methods.jsx:620-625`), and the streaming publication `patientFilesOfPractice` observes `PatientFileUsers` changes live and publishes the underlying `patientFiles` row only for dossiers the caller has access to (`server/publications.jsx:25-171`).

## Methods

Patient-file access methods live in `app/imports/api/patientFiles/methods.jsx` (not in the `patientFileUsers` module). All four methods are `PermissionValidatedMethod` with `subscription: true`.

### `patientFile.grantAccess` — share one dossier

`methods.jsx:406-438`.

- Inputs: `{ patientFileId, userId, role? }`.
- Calls the internal `sharePatientFile(practiceUser, patientFile, role, originUserId)` helper (`methods.jsx:351-390`).
- If the target user already has practice-level `patientFile.view`, returns `true` immediately without inserting a row (`methods.jsx:359-361`) — no-op, they already see it.
- Otherwise upserts `PatientFileUsers.upsert({ patientFileId, userId }, { $set: { role } })` (`methods.jsx:363-369`). The `role` argument is optional and defaults to the schema default `"default"`.
- On new-row success:
  - Sends an email to the target user via `PatientFileSharedMail` rendered by `HalingoEmails.sendEmail` with a link to the dossier (`server/util.js:108-126`).
  - Inserts an in-app `Notifications` row of type `INFO` with body `notifications.patientFile.shared.body` and meta `{ patientFileId, patientName }` (`methods.jsx:374-387`).
- Updates Rosa per-record permissions via `RosaPatients.updatePermissionsForPatientFileIds`.

### `patientFiles.grantAccess` — share many dossiers with one user

`methods.jsx:440-509`.

- Inputs: `{ patientFileIds, userId, role? }`.
- Validates that every dossier in the list belongs to the same practice (`methods.jsx:460-486`) — the permission check is run against only the first dossier.
- Iterates and calls the same `sharePatientFile` helper for each.
- Pushes a single bulk Rosa permission update at the end.

### `patientFile.removeAccess` — revoke one user

`methods.jsx:511-561`.

- Inputs: `{ patientFileId, userId }`.
- **Refuses** if any `Events` document exists with `{ userId, patientFileId }` — throws `USER_HAS_EVENTS_WITH_THIS_PATIENT` (`methods.jsx:550-552`). A user who has appointments scheduled with a patient cannot have their access revoked until those appointments are reassigned or removed.
- Otherwise physically removes (`PatientFileUsers.remove(patientFileUser._id)` — soft delete under the hood, `methods.jsx:554`).
- Re-syncs Rosa permissions.
- Requires practice-level `patientFile.removeAccess` — this permission is not in the per-file `admin` list, so a lid cannot revoke another user's access.

### Implicit checks on other methods

Every `patientFile.*` method enforces its own permission via `PermissionValidatedMethod._execute` (`lib/permissions/PermissionValidatedMethod.jsx:34-38`), which consults `PermissionsUtil.checkPermission`. The global `PermissionsUtil` is just a white/blacklist aggregator (`lib/permissions/Permissions.jsx`); the actual rule is supplied by the two util modules:

- `PatientFileUsersUtil.checkUserPermission` (`patientFileUsers/util.jsx:11-27`) — combines per-file and practice role.
- `PracticeUsersUtil.checkUserPermission` (`api/practiceUsers/util`, not shown) — practice-level only.

Whoever hooks these into the global `PermissionsUtil` is responsible for ordering.

## Rosa permission projection

`RosaPatients.updatePermissionsForPatientFileIds` (`server/rosa-patients.ts:258-370`) projects Halingo's patient-file access into Rosa's per-record individual permission model:

- Practice owners/admins get `UPDATE_DOCUMENT / READ_DOCUMENT / UPDATE_PERMISSION / DELETE_DOCUMENT` (the full set) via `ownersAndAdminHpIds`.
- Users with per-file `role === "admin"` get the full set too (`rosa-patients.ts:319-328, :343-352`).
- Users with per-file `role === "default"` get `READ_DOCUMENT / UPDATE_DOCUMENT` only — no delete, no permission management (`rosa-patients.ts:329-338, :353-356`).

This is the **only place in the code** where per-file `admin` vs `default` actually differ. On the Halingo side the permission lists are identical — the distinction only shows up when projecting to Rosa.

## Publications

- `usersOfPatientFile(patientId)` — lists the users linked to a dossier, joined with their `Meteor.users` documents for display. Requires the caller to be able to view the dossier. `server/publications.jsx:174-188`.
- `patientFile(patientId)` — the single-dossier publication includes the caller's own `PatientFileUsers` row so the client can cheaply check its own role (`server/publications.jsx:13-23`).
- `patientFilesOfPractice(practiceId)` — the streaming roster publication has two observer modes: if the caller has practice-level `patientFile.view`, observe all patient files of the practice; otherwise observe the caller's `PatientFileUsers` rows and reactively start/stop individual patient-file observers as rows appear and disappear (`server/publications.jsx:25-171`). This is what makes a newly-shared dossier appear in a lid user's roster live.

## Notable details

- **The dossier-level `owner` role is virtual only.** No `PatientFileUsers` row is ever written with `role: "owner"`; the `owner` branch only fires when `PatientFileUsers.findOne(...)` misses and `metaData.userId === userId` (`patientFileUsers/util.jsx:19-23`). This means the creator has view access through the metadata path, but they only have write access if they also received the automatic `admin` row (non-owners) or if they hold practice-level admin/owner (practice owners).
- **`admin` and `default` are identical on Halingo**, but different on Rosa. When creating a share, the `role` argument defaults to schema default `"default"` (`patientFileUsers.jsx:74`) — so freshly shared users get the Halingo-full but Rosa-limited permission set.
- **No concept of "read only" access.** There is no Halingo dossier-level role that grants view but not edit, except the virtual `owner` (which is only reachable via `metaData.userId`). In practice this means "share = full access".
- **No audit log of per-file permission changes.** The `method-logs` collection records the method invocation via the `LoggedInValidatedMethod` wrapper, but only on error (`lib/permissions/LoggedInValidatedMethod.jsx:14-33`). Successful grants and revokes leave no trace. See `../gaps/03_patient_data_privacy.md`.
- **No expiry / time-boxing.** Once granted, access lasts until either the row is soft-deleted via `removeUserAccessToPatientFile`, or the user is removed from the practice via `PracticeUtil._removeUser` (`api/practice/server/util.tsx:140-156`), which cascades to delete all `PatientFileUsers` rows for that user in that practice.
- **Granting is async with the Rosa push.** If Rosa is unreachable when `grantUserAccessToPatientFile` runs, the Halingo row is still created but the Rosa-side permission update may fail; there is no retry mechanism.
- **The `sharePatientFile` helper returns true for no-ops.** When the target user already has practice-level view, `sharePatientFile` returns `true` and neither inserts a row nor sends a notification (`methods.jsx:359-361`). The caller cannot distinguish "already had access" from "newly granted".
- **Shared-file email link is practice-agnostic.** The URL embedded in the email is `/patients/<id>?locale=<user-locale>`. A user who belongs to multiple practices will land on the current practice context, which may not be the one holding the dossier (`server/util.js:114-118` has a `TODO` comment noting this).

## Helpdesk overlap

`full_documentation/general_getting_started.md` and `full_documentation/settings_practice_management.md` describe:

- The three practice roles (owner, beheerder, lid) and who can see whose finances.
- Inviting a new therapist to a practice.
- The "share dossier" flow at a high level.

Gaps relative to the code:

- The 17-permission dossier-level granular model is not documented.
- The fact that practice-level "lid" users have zero patient access until explicitly shared is implicit but not stated.
- The interaction with Rosa permissions is not mentioned.
- The `USER_HAS_EVENTS_WITH_THIS_PATIENT` block on revoke is not mentioned.
- The automatic self-grant on creation for non-owners is not mentioned.
- The equality of `admin` and `default` per-file roles is not mentioned.

## Source files

- `app/imports/api/patientFileUsers/patientFileUsers.jsx` — collection, schema, the 3-role definition.
- `app/imports/api/patientFileUsers/util.jsx` — permission resolution, role check, filter helpers.
- `app/imports/api/patientFiles/methods.jsx:351-561` — `sharePatientFile` helper, `grantUserAccessToPatientFile`, `grantUserAccessToPatientFiles`, `removeUserAccessToPatientFile`.
- `app/imports/api/patientFiles/server/util.js:108-126` — `sendSharedPatientFileMail`.
- `app/imports/api/patientFiles/server/rosa-patients.ts:258-370` — Rosa permission projection.
- `app/imports/api/practice/server/util.tsx:140-156` — `_removeUser` cascade to patient-file access.
- `app/imports/api/practice/server/util.tsx:166-190` — `_addPatientFile` auto-grant to non-owner creator.
- `app/imports/api/practiceUsers/practiceUsers.jsx:8-153` — practice-level role definitions.
- `app/imports/modules/patientfiles/dashboard/PatientFileShared.jsx` + `PatientFileSharedContainer.jsx` — sharing UI.
- `app/imports/lib/permissions/PermissionValidatedMethod.jsx` — the permission-check wrapper every patient-file method extends.
- `app/imports/lib/permissions/Permissions.jsx` — global white/blacklist aggregator.
