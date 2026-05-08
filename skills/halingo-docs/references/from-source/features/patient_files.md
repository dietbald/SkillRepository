# Patient files

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the roster, tags, and therapist-assignment surface are in `../../full_documentation/patient_management.md`; creation, merge, deletion semantics, per-file permissions and the GDPR surface are not covered. Verify against the running app before promoting to `manual/`.

## What it is

The core patient dossier (in Dutch: *patiëntendossier*) is the master record that every appointment, treatment, invoice, certificate, clinical report, and long-term therapy goal in Halingo ultimately hangs off. A dossier belongs to exactly one practice (`practiceId`), has a state machine of four lifecycle stages (`starting / active / inactive / pending`), optional demographics, a Belgian social security number (`SSN` / INSZ), RIZIV insurance category codes, a third-payer flag, an assigned `healthInsurance` fund number, free-form tags, and sub-structures for contact persons, school / care coordinator (CLB) metadata, family doctor, prescriber, and extra medical information. Mutations go exclusively through Meteor methods on `app/imports/api/patientFiles/methods.jsx`; direct client writes are denied (`patientFiles.jsx:17-27`).

Dossiers also carry Rosa-integration bookkeeping (`rosaId`, `fromRosa`, `requiresReview`, `mergedFromRosaIds`, `mergedToRosaId`, `isMissingInRosa`, `deletedInRosa`) used by the bidirectional Rosa sync in `app/imports/api/patientFiles/server/rosa-patients.ts`.

## Where it lives in the UI

**Routes** (`app/imports/startup/client/routes/patientFile.js`):

| Path | Name | Container | Purpose |
|---|---|---|---|
| `/patients/` | `patientfiles.home` | `PatientFilesMainPageContainer` | Roster / search | `patientFile.js:21-31` |
| `/patients/:patientId` | `patientfiles.view` | `PatientFileDashboardContainer` | Dossier detail with tabs | `patientFile.js:33-43` |
| `/patients/:patientId/reports/:reportId` | `patientfiles.reports.view` | `PatientFileReportContainer` | Rich-text clinical report | `patientFile.js:45-60` |
| `/patients/:patientId/documents/:documentId` | `patientfiles.documents.view` | `PatientFileDocumentContainer` | PDF / image viewer | `patientFile.js:62-77` |
| `/patients/:patientId/treatments/reports/:reportId` | `patientfiles.treatments.reports.view` | `PatientFileReportContainer` | Same editor, under treatments tab | `patientFile.js:79-94` |
| `/patients/:patientId/treatments/documents/:documentId` | `patientfiles.treatments.documents.view` | `PatientFileDocumentContainer` | Same viewer, under treatments tab | `patientFile.js:96-111` |
| `/patients/:patientId/invoices/:invoiceId` | `patientfiles.invoices.view` | `PatientInvoicePageContainer` | Single invoice in patient scope | `patientFile.js:113-123` |

**Roster page** — `app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx`

- Infinite-scroll grid of patient cards (`PatientFilesGridItem`, 9 per page, `PatientFilesMainPage.jsx:132`).
- Search bar calls `searchPatientFiles` with a user-chosen sort / filter (`PatientFilesMainPage.jsx:77-90`).
- Four filter chips corresponding to each `PatientFiles.states` value; the placeholder query excludes `inactive` (`PatientFilesMainPage.jsx:132-134`).
- A therapist selector in the top-left lets owners / beheerders filter by assigned therapist; only rendered if the current user has the `patientFile.view` permission at the practice level (`PatientFilesMainPage.jsx:94-119`).
- A floating add button opens `PatientFilesAddModal` — only visible when the practice has an active subscription (`hasActiveSub`, `PatientFilesMainPage.jsx:150-167`).

**Dossier detail page** — `app/imports/modules/patientfiles/dashboard/PatientFileDashboard.jsx`

- Left column: `PatientFileDashboardInformation` (avatar, name, state selector, demographics, delete button) + `PatientFileTabs`.
- Right column: `PatientFileTags`, `PatientFileSharedContainer` (list + invite collaborators), `PatientFileImportantInformation` (next appointment, session count, absences, open invoices).
- `PatientFileTabs` (`app/imports/modules/patientfiles/tabs/PatientFileTabs.jsx`) renders up to five tabs:
  1. **Info** — `PatientFileProfileInformation` (profile form, auto-saved with 500 ms debounce, `PatientFileProfileInformation.jsx:160-205`)
  2. **Terugbetaling** — treatment plans (hidden for `UserProfessions.OTHER`, `PatientFileTabs.jsx:82-95`)
  3. **Facturatie** — invoice history
  4. **Documenten** — reports + uploaded files
  5. **Therapieplan** — long-term and short-term therapy (hidden for `UserProfessions.OTHER`)
- If `requiresReview` is true (the dossier was pulled from Rosa and has not been reconciled) the tabs are replaced by a "Nieuwe patiënt van Rosa" box with **Merge** and **Keep** actions (`PatientFileDashboard.jsx:132-162`).

## Data model

Collection: `patientFiles` · `app/imports/api/patientFiles/patientFiles.jsx:15`. Client inserts/updates/removes are denied (`patientFiles.jsx:17-27`); all writes go through Meteor methods.

Schema is attached at `patientFiles.jsx:148-255` with `requiredByDefault: false`.

| Field | Type | Required | Meaning / cite |
|---|---|---|---|
| `firstName` | `String` | yes | `patientFiles.jsx:167` |
| `lastName` | `String` | yes | `patientFiles.jsx:184` |
| `practiceId` | `String` (Id) | yes | Owning practice. `patientFiles.jsx:186-190` |
| `createdAt` | `Date` | yes | Stamped on insert via base Collection. `patientFiles.jsx:250`, `collection.js:13-16` |
| `state` | `String` | default `pending` | One of `starting / active / inactive / pending`. `patientFiles.jsx:214-218`, states enum at `patientFiles.jsx:29-34` |
| `gender` | `String` | no | `male` or `female`. `patientFiles.jsx:168` |
| `salutation` | `String` | no | One of the values in `PatientFiles.salutations`: `mister / misses / miss / parents / doctor / professor / engineer`. `patientFiles.jsx:138-146`, `:200` |
| `birthDate` | `Date` | no | Drives `age()` helper and RIZIV age-eligibility logic. `patientFiles.jsx:151`, helper at `:280-302` |
| `SSN` | `String` (regex) | no | Belgian national number (INSZ), format `dd.dd.dd-ddd.dd`. `patientFiles.jsx:213` |
| `imageUrl` | `String` | no | Patient avatar. On update, cascades to `PatientFileInvoices.image` for historical invoice display. `patientFiles.jsx:170`, cascade at `methods.jsx:68-87` |
| `profession` | `String` | no | Free text; only rendered when `professionType === 'other'`. `patientFiles.jsx:195` |
| `professionType` | `String` | no | `pupil / student / other`. Enum at `patientFiles.jsx:132-136`, schema at `:196-199` |
| `address` | `addressSchema` | no | `street / postalCode / city / location (GeoJSON Point)`. `patientFiles.jsx:150`, schema at `lib/simpleSchemas/util.jsx:4-13` |
| `contactDetails` | `contactDetailsSchema(false)` | no | `phoneNumber / gsmNumber / email`. `patientFiles.jsx:156`, schema at `lib/simpleSchemas/util.jsx:15-77` |
| `contactPersons` | `[contactPersonSchema]` | no | Repetitive form: first/last name, relation, comment, address, phone(s), email. `patientFiles.jsx:157-158`, schema at `lib/simpleSchemas/util.jsx:179-189` |
| `doctor` | `Object` | no | Family doctor name / email / phone. `patientFiles.jsx:160-163`. On update, name is uppercased server-side (`methods.jsx:59`). |
| `prescriber` | `Object` | no | Prescribing physician. `patientFiles.jsx:191-194`. Also uppercased (`methods.jsx:60-61`). |
| `healthInsurance` | `Number` | no | Numeric fund identifier (Ziekenfonds). Used together with `isThirdPayer` as a precondition for invoice generation (`invoices/patientFileInvoices/server/util.js:125`). `patientFiles.jsx:169` |
| `insuranceStateCode1` | `String` | no | Primary RIZIV CG1 insurance-status code. Allowed values are the keys of `PatientFiles.getInsuranceStateCodes()`. `patientFiles.jsx:171-174` |
| `insuranceStateCode2` | `String` | no | Secondary CG2 code; allowed values depend on which CG1 was selected. `patientFiles.jsx:175-182`. The `hasIncreasedReimbursement()` helper returns `true` when CG1 is odd (`patientFiles.jsx:320-322`). |
| `isThirdPayer` | `Boolean` | no | Derdebetaler flag — when true, the practice invoices the Ziekenfonds directly via a Verzamelstaat instead of billing the patient. `patientFiles.jsx:183`. Toggled in-place by `updateIsThirdPayer` (`methods.jsx:94-124`). |
| `medicalInfo` | `String` | no | Medical history free-text. `patientFiles.jsx:185` |
| `extraInfo` | `String` | no | General notes free-text. `patientFiles.jsx:163` |
| `tags` | `[String]` | no | User-defined labels shown on the dossier right column; managed by `updateTags` (`methods.jsx:181-211`). `patientFiles.jsx:219-220` |
| `files.tags` | `[String]` | no | Derived set of all tags in use on this dossier's reports and uploaded documents. Recomputed by `PatientFilesUtil.updateTags` (`server/util.js:128-141`). `patientFiles.jsx:164-166` |
| `school` | `Object` | no | Name, address, CLB contact details, coordinators, teachers, class, studies. Only rendered for `professionType` pupil/student. `patientFiles.jsx:201-212` |
| `CLB` | `Object` | no | Centrum voor LeerlingenBegeleiding contact block: `contactPerson / email / phone`. `patientFiles.jsx:152-155`. Only rendered for pupils. |
| `rosaId` | `String` | optional | Stable id from Rosa after the patient has been pushed. `patientFiles.jsx:221-224` |
| `fromRosa` | `Boolean` | optional | True if the record was pulled from Rosa rather than created in Halingo. `patientFiles.jsx:225-228` |
| `requiresReview` | `Boolean` | optional | Set on Rosa-pulled patients that might duplicate an existing one — forces a merge/keep prompt on the dashboard. `patientFiles.jsx:229-232` |
| `mergedFromIds` | `[String]` | optional | Halingo ids that were merged into this one. `patientFiles.jsx:233-237` |
| `mergedFromRosaIds` | `[String]` | optional | Rosa ids merged into this one. `patientFiles.jsx:238-242` |
| `mergedToRosaId` | `String` | optional | Rosa id this record was merged into. `patientFiles.jsx:243` |
| `isMissingInRosa` | `Boolean` | optional | Detected during sync when Rosa no longer recognises the `rosaId`. `patientFiles.jsx:244` |
| `deletedInRosa` | `Boolean` | optional | Mirrored soft-delete flag from Rosa. `patientFiles.jsx:245` |
| `metaData` | `Object` (blackbox) | no | At insert time set to `{ userId, email }` of the creator. `patientFiles.jsx:246`, set at `api/practice/server/util.tsx:169-173` |
| `removed` | `Boolean` | no | Soft-delete flag — see "Deletion semantics" below. `patientFiles.jsx:248` |
| `removedAt` | `Date` | no | Soft-delete timestamp. `patientFiles.jsx:249` |

### Enumerations

```
PatientFiles.states          = { STARTING: "starting", ACTIVE: "active", INACTIVE: "inactive", PENDING: "pending" }
PatientFiles.professionTypes = { PUPIL: "pupil", STUDENT: "student", OTHER: "other" }
PatientFiles.salutations     = { MISTER, MISSES, MISS, PARENTS, DOCTOR, PROFESSOR, ENGINEER }
```

`patientFiles.jsx:29-146`

### Insurance state codes (`getInsuranceStateCodes()`)

`patientFiles.jsx:36-130`. This is a table from a CG1 (primary category) value to the list of CG2 (secondary) values it may combine with. Roughly:

- `100 / 101 / 110 / 111 / 120 / 121 / 130 / 131 / 140 / 141` — standard categories, each pairs with `000` plus itself.
- `150` — only pairs with itself.
- `4xx` — combined (WIGW, disabled, etc.) categories, which enumerate long lists of CG2 codes.

A patient is considered **verhoogde tegemoetkoming** (increased reimbursement rate) iff `insuranceStateCode1 % 2 === 1` — i.e. any odd CG1 code (`patientFiles.jsx:320-322`). This drives a downstream split of remgeld vs. terugbetaling on treatments and certificates.

### Helpers (`PatientFiles.helpers`, `patientFiles.jsx:279-336`)

| Helper | Result |
|---|---|
| `age()` | `{ day, month, year }` derived from `birthDate`. |
| `name()` | `"<lastName> <firstName>"` with trimming. |
| `checkUserPermission(permission, userId)` | Delegates to `PatientFileUsersUtil.checkPermission`. |
| `fullAddress()` | `"street, postalCode city"` or `null`. |
| `fullBirthDate()` | `birthDate` formatted `D MMMM YYYY` (moment, UTC). |
| `image()` | `imageUrl` or `/img/placeholder-user.png`. |
| `hasIncreasedReimbursement()` | `insuranceStateCode1 % 2 === 1`. |
| `isStudent()` | `professionType ∈ { pupil, student }`. |
| `phone()` | `gsmNumber` or `phoneNumber` from contactDetails. |
| `users()` | Joined list of therapists that have explicit access via `PatientFileUsers`. |

### Public projections

- `PatientFiles.publicFields` — the slim projection used for roster-level subscriptions: `address, birthDate, contactDetails, createdAt, firstName, gender, imageUrl, isThirdPayer, lastName, practiceId, state, rosaId, fromRosa, requiresReview` (`patientFiles.jsx:257-272`).
- `PatientFiles.publicFieldsDetailed` — a **blacklist** used on the detail page: `{ metaData: 0, removed: 0 }` (`patientFiles.jsx:274-277`). Everything except the creator metadata and the soft-delete flag is published.

## Methods (Meteor)

All defined in `app/imports/api/patientFiles/methods.jsx`. Every writing method extends `PermissionValidatedMethod` (`lib/permissions/PermissionValidatedMethod.jsx`), which enforces the practice subscription check when `subscription: true` and runs `PermissionsUtil.checkPermission` for each listed permission name, throwing `errors.permissions.<permission>` on failure.

| Method name | Purpose | Cite |
|---|---|---|
| `patientFile.add` | Create a dossier. Delegates to `PracticeUtil.addPatientFile`, then `RosaPatients.pushPatientsToRosa` and `RosaPatients.updatePermissionsForPatientFileIds`. Returns the new `patientFileId`. | `methods.jsx:213-229` |
| `patientFile.update` | Patch an existing dossier. Validates against a reduced schema (no `createdAt`, `metaData`, `practiceId`, `removed`, `rosaId`, `fromRosa`). Required fields are ignored on update (`SimpleSchema.ErrorTypes.REQUIRED`). Uppercases `doctor.name` / `prescriber.name`. On name or image changes, cascades to `PatientFileInvoices` so historical invoice prints stay in sync. | `methods.jsx:27-92` |
| `patientFile.update.isThirdPayer` | Flip the `isThirdPayer` flag in isolation. Requires `patientFile.update`. | `methods.jsx:94-124` |
| `patientFile.update.tags` | Replace the `tags` array. Dedupes via `_.uniq`. Requires `patientFile.update`. | `methods.jsx:181-211` |
| `patientFile.merge.patientFiles` | Merge `patientFileId` *into* `mergeIntoId` — see `patient_merge.md`. Requires `patientFile.update` on **both** dossiers. | `methods.jsx:126-179` |
| `patientFile.remove` | Soft-delete the dossier — see "Deletion semantics" below. | `methods.jsx:231-273` |
| `patientFile.search` | Roster search — see `patient_creation.md` and below. | `methods.jsx:275-349` |
| `patientFile.grantAccess` | Share one dossier with one practice user. | `methods.jsx:392-438` |
| `patientFiles.grantAccess` | Share multiple dossiers with one user. All dossiers must belong to the same practice; permission is checked against the first. | `methods.jsx:440-509` |
| `patientFile.removeAccess` | Revoke one user's access to one dossier. **Throws `USER_HAS_EVENTS_WITH_THIS_PATIENT`** if any events exist linking that user to that dossier. | `methods.jsx:511-561` |
| `patientFiles.get` | Fetch a concrete list of dossiers by id. Filtered to those the caller can view. | `methods.jsx:563-595` |
| `patientFiles.view` | `findPatientFiles` — returns all dossiers of a practice the caller is allowed to see, with optional name substring and treatment-type filter. | `methods.jsx:597-648` |
| `patientFile.count` | Per-state count `{ starting, active, pending, inactive }` for a practice or a single therapist, via raw mongo aggregation on `state`. Throws on insufficient permission. | `methods.jsx:650-714` |
| `patientFile.importantInfo` | Returns `{ nextEvent, nbEvents, nbEventsAbsent, treatmentEndDate, nbInvoiceOpen, openAmount }` for the dashboard right rail. | `methods.jsx:927-999` |
| `patientFile.sync.rosa` | Two-way sync run on demand: pulls Rosa patients for the current user, then pushes Halingo patients back. | `methods.jsx:1001-1019` |
| `patientFile.documents.edit` | Rename / retag / relink a document; requires `patientFile.reports.edit`. Recomputes `files.tags`. | `methods.jsx:719-769` |
| `patientFile.documents.delete` | Soft-remove a document; requires `patientFile.reports.delete`. Recomputes `files.tags`. | `methods.jsx:771-802` |
| `patientFile.therapies.long.add` | Insert a long-term therapy goal. See `long_term_therapy_plan.md`. | `methods.jsx:807-846` |
| `patientFile.therapies.long.edit` | Edit a goal (status / priority / goal text / description / category / therapist). | `methods.jsx:848-898` |
| `patientFile.therapies.long.delete` | Soft-remove a goal. | `methods.jsx:900-922` |

### Patient creation flow (`patientFile.add`)

Client UI: `app/imports/modules/patientfiles/main/PatientFilesAddModal.jsx`. See `patient_creation.md` for the full form walkthrough.

Server entry: `methods.jsx:213-229` → `PracticeUtil.addPatientFile` (`api/practice/server/util.tsx:166-190`):

```
const creator = Meteor.users.findOne(userId);
patientFile.metaData = { userId, email: creator.email() };
const patientFileId = PatientFiles.insert(patientFile);
if (patientFileId) {
  const practiceUser = PracticeUsers.find({ userId, practiceId: patientFile.practiceId });
  if (practiceUser.role !== PracticeUsersRoles.owner.id) {
    PatientFileUsers.insert({ patientFileId, userId, role: PatientFileUserRoles.admin.id });
  }
}
return patientFileId;
```

So the creator is always recorded in `metaData.userId`, and for any non-owner creator an explicit `PatientFileUsers` row of role `admin` is inserted; owners don't need one because the owner role already implies `patientFile.view` at the practice level.

### Roster search (`patientFile.search`)

`methods.jsx:275-349`. Uses `searchCollection` helper (`lib/util/util`) with diacritic-insensitive matching on `firstName` / `lastName`. If the caller has practice-level `patientFile.view`, the filter is `{ practiceId, ...otherFilters }`; otherwise it is constrained to the `_id`s returned by `PatientFilesUtil.getPatientFileIdsOfUserInPractice` for that caller. If a `userId` arg is supplied to narrow by owning therapist, the caller must have practice-level `patientFile.view`.

Sort is flexible: a numeric sort becomes `{ lastName, firstName }` ascending/descending, an object is used verbatim.

## Publications

Defined in `app/imports/api/patientFiles/server/publications.jsx`:

- **`patientFile(patientId)`** — single dossier with `publicFieldsDetailed`, plus the caller's `PatientFileUsers` row for that dossier. Access-checked via `PatientFilesUtil.canUserViewPatientFile`. `publications.jsx:13-23`
- **`patientFilesOfPractice(practiceId)`** — streaming roster. Two observer strategies: if the caller is an owner/admin at the practice, it observes all `PatientFiles` of that practice with `publicFields`; otherwise it observes the caller's `PatientFileUsers` rows and publishes only the dossiers those rows grant access to. Role changes flip between strategies live. `publications.jsx:25-171`
- **`usersOfPatientFile(patientId)`** — list of therapists sharing this dossier + their user documents. `publications.jsx:174-188`
- **`documentsOfPatientFile(patientId)`** — uploaded documents for the file cabinet view. `publications.jsx:195-201`
- **`patientFileDocument(documentId)`** — single document for the viewer page. `publications.jsx:203-216`
- **`patientFileLongTherapyPlan(patientFileId)`** — all `LongTherapyPlan` rows for one dossier. `publications.jsx:222-231`

## User-visible behaviour

- **State lifecycle.** The dropdown on the dashboard (`PatientFileDashboardInformation.jsx:172-188`) lets any user with `patientFile.update` permission flip between the four states. There is no workflow enforcing transitions — any state can jump to any other. The roster placeholder filter excludes `inactive` by default (`PatientFilesMainPage.jsx:133`). State colour codes: `active` = Halingo blue, `inactive` = red, `pending` = yellow, `starting` = blue (`PatientFileState.jsx:15-20`).
- **Avatar.** Upload via the circle button on the dashboard. Uses the `Avatars` collection with S3 storage (`PatientFileDashboardInformation.jsx:90-101`); when `updatePatientFile` fires with a new `imageUrl`, existing `PatientFileInvoices` have their `image` updated for historic consistency (`methods.jsx:68-87`).
- **Tags.** Added via a pencil-style input on the right rail (`PatientFileTags.jsx`). Translated when the tag matches the i18n regex `/^[A-Za-z.]+$/` (`PatientFileTags.jsx:115`). Deduped server-side via `_.uniq`.
- **Sharing.** "Dossier gedeeld met" block on the right rail (`PatientFileSharedContainer.jsx`) lists therapists who have explicit `PatientFileUsers` rows. The selector to add new sharees filters out those who already have practice-level `patientFile.view` (they don't need a row, `PatientFileSharedContainer.jsx:26-29`). Sharing triggers the `patientFile.shared` in-app notification plus an email rendered by `PatientFileSharedMail` (`methods.jsx:371-386`, `server/util.js:108-126`).
- **Requires-review banner.** When `requiresReview === true`, the tabs are replaced by a one-choice box: merge into another dossier or mark as unique (`PatientFileDashboard.jsx:132-162`). "Merge" requires an active Rosa integration token (`PatientFileDashboard.jsx:104-109`).
- **Rosa sync status.** A `RosaSyncStatus` chip renders under the avatar based on `rosaId`, `isMissingInRosa`, `deletedInRosa`, `mergedToRosaId` (`PatientFileDashboardInformation.jsx:165`).

### Patient creation

See `patient_creation.md`.

### Patient merge

See `patient_merge.md`.

### Deletion semantics

**All custom collections in Halingo soft-delete.** `app/imports/api/server/collectionServer.js:35-37` overrides `remove()` to:

```
return super.update(selector, { $set: { removed: true, removedAt: new Date() } }, { multi: true }, cb);
```

and `find()` / `findOne()` / `update()` transparently add `{ removed: { $ne: true } }` to every selector (`collectionServer.js:3-16, :19-33, :43-56`). `removeUnsafe`, `findUnsafe`, `findOneUnsafe`, and `updateUnsafe` are the only escape hatches; they bypass the soft-delete filter entirely.

So `PatientFiles.remove(id)` does **not** delete the mongo document — it sets `removed: true, removedAt: new Date()` and the document becomes invisible to normal reads.

`patientFile.remove` method (`methods.jsx:231-273`) → `PracticeUtil.removePatientFile` (`api/practice/server/util.tsx:192-224`) does:

1. **Refuses if any non-canceled `PatientFileInvoices` exists** for the dossier — throws `patient.remove.invoiceExists` (`util.tsx:194-201`).
2. Soft-removes `Documents` with `"meta.patientFileId": patientFileId` (`util.tsx:205`).
3. Finds all `Events` for the dossier with no `invoiceId` and soft-removes them. Events that were already billed are left intact. (`util.tsx:206-209`)
4. Pushes the event removals to Rosa (`util.tsx:211-213`).
5. Soft-removes `LongTherapyPlan` entries for the dossier (`util.tsx:215`).
6. Soft-removes `Notifications` with `meta.attributes.patientFileId === patientFileId` (`util.tsx:216-218`).
7. Soft-removes `PatientFileReports`, `PatientFileUsers`, and `Treatments` for the dossier (`util.tsx:219-221`).
8. Finally soft-removes the `PatientFiles` row itself (`util.tsx:223`).
9. After return, the now-removed patient is pushed to Rosa for the deleting user (`methods.jsx:258-268`), which in Rosa means calling `RosaApi.patientRecords.deletePatientRecordsForUser` (`rosa-patients.ts:556-582`).

> ⚠️ Behaviour inferred from code; needs product validation. Because soft-delete sets `removed: true` but the records never get physically deleted, restoring a dossier is a one-line mongo update. There is no user-visible "restore" button in the scanned UI.

## Permissions

Patient-file permissions are stored in two places:

1. **Per-practice** — roles in `app/imports/api/practiceUsers/practiceUsers.jsx:8-153`.
2. **Per-dossier** — roles in `app/imports/api/patientFileUsers/patientFileUsers.jsx:6-57`. See `patient_file_access_control.md` for the full per-file matrix.

Resolution logic (`patientFileUsers/util.jsx:11-27`):

```
relation = PatientFileUsers.findOne({ userId, patientFileId })
if !relation && patientFile.metaData.userId === userId:
    relation = { role: "owner" }   // virtual — the creator is implicitly owner
return (relation && roles[relation.role].permissions.includes(permission))
    || PracticeUsersUtil.checkUserPermission(permission, userId, patientFile.practiceId)
```

So a user has a permission on a dossier if **either**:

- they hold it at the practice level (owner / admin), **or**
- they have an explicit `PatientFileUsers` row whose role grants it, **or**
- they created the dossier (implicit `owner` relation) — but note the `owner` dossier-role only grants `patientFile.view`, so creators do *not* automatically get write access via this path alone; they get write access via the explicit `admin` row that `_addPatientFile` inserts for non-practice-owners.

### Permission matrix (practiceUsers × patientFile.*)

From `practiceUsers.jsx`:

| Permission | `owner` | `admin` (beheerder) | `default` (lid) |
|---|:---:|:---:|:---:|
| `patientFile.view` | ✓ (41) | ✓ (106) | ✗ |
| `patientFile.add` | ✓ (42) | ✓ (107) | ✓ (146) |
| `patientFile.count` | ✓ (43) | ✓ (108) | ✗ |
| `patientFile.remove` | ✓ (44) | ✓ (109) | ✗ |
| `patientFile.update` | ✓ (45) | ✓ (110) | ✗ |
| `patientFiles.get` | ✓ (46) | ✓ (111) | ✗ |
| `patientFile.grantAccess` | ✓ (47) | ✓ (112) | ✗ |
| `patientFile.removeAccess` | ✓ (48) | ✓ (113) | ✗ |
| `patientFile.reports.add` | ✓ (49) | ✓ (114) | ✗ |
| `patientFile.reports.delete` | ✓ (50) | ✓ (115) | ✗ |
| `patientFile.reports.edit` | ✓ (51) | ✓ (116) | ✗ |
| `patientFile.therapies.long.add` | ✓ (52) | ✓ (117) | ✗ |
| `patientFile.therapies.long.delete` | ✓ (53) | ✓ (118) | ✗ |
| `patientFile.therapies.long.edit` | ✓ (54) | ✓ (119) | ✗ |
| `patientFile.therapies.short.delete` | ✓ (55) | ✓ (120) | ✗ |
| `patientFile.therapies.short.edit` | ✓ (56) | ✓ (121) | ✗ |

Line numbers cite `app/imports/api/practiceUsers/practiceUsers.jsx`. A plain `default` (lid) user has **only** `patientFile.add` at the practice level; any other action must be authorised by a `PatientFileUsers` row.

### Subscription gating

Every method decorated with `subscription: true` throws `NO_ACTIVE_SUB_FOR_PRACTICE` if the owning practice has no active subscription (`PermissionValidatedMethod.jsx:18-32`). That applies to almost every patient-file write except the `get` / `search` / `view` methods.

## Notable details

- **Client-side writes are denied** on the collection itself (`patientFiles.jsx:17-27`). All mutations come through Meteor methods.
- **Merged records are kept as tombstones.** `mergePatientFileInto` soft-removes the merged-from record so that its `rosaId` and `mergedToRosaId` can still be looked up during future Rosa syncs (`rosa-patients.ts:586-641`).
- **Creator audit trail is a single field.** `metaData.userId` records *who* created the dossier, but there is no log of *who* subsequently viewed or edited it. See `../gaps/03_patient_data_privacy.md`.
- **The `files.tags` field is a derived index.** It's the union of tags across this dossier's documents and reports, recomputed whenever a report / document is edited / added / deleted (`server/util.js:128-141`, used at `methods.jsx:765, 797` and `patientFileReports/methods.jsx:95, 127`).
- **Name uppercase mangling.** `updatePatientFile` uppercases `doctor.name` and `prescriber.name` before persisting (`methods.jsx:59-61`); first/last name are not touched.
- **Invoice cascade on rename.** If `firstName` / `lastName` / `imageUrl` change, all the dossier's historical `PatientFileInvoices` are updated so the printed PDF shows the new name / image (`methods.jsx:68-87`). This rewrites history.
- **`PatientFileInvoices.remove()` is never cascaded into by `patientFile.remove`** — in fact, the presence of any non-canceled invoice blocks deletion entirely (`api/practice/server/util.tsx:194-201`). To remove a patient with invoices, the user must cancel every invoice first.
- **Rosa integration is pervasive.** `patientFile.add`, `patientFile.update`, `patientFile.remove`, `patientFile.merge.patientFiles`, `patientFile.grantAccess`, `patientFile.removeAccess`, and `patientFile.sync.rosa` all trigger Rosa calls on the server side (`methods.jsx:65-66, :222-223, :260-263, :172, :432-433, :554-555, :1013-1017`).

## Helpdesk overlap

`full_documentation/patient_management.md` covers the following surfaces at a high level:

- Filter-by-therapist on the roster (the therapist selector above the search bar).
- Adding tags to a dossier.
- Tariff-indexation patient communication (templates for price-change letters).
- Sharing a dossier with another therapist and the resulting notification/email.

Gaps relative to the code:

- **Creation flow** — not covered. `addPatientFile` exists; the helpdesk shows no article explaining what fields are required, what is auto-filled, or what the state machine means.
- **Merge** — not covered. `mergePatientFileInto` is tightly coupled to Rosa.
- **Deletion semantics** — not covered. The helpdesk does not mention the invoice-blocks-delete rule nor the cascade to events / reports / documents / therapy plan.
- **Insurance state codes (CG1 / CG2)** — the code defines a 17×N matrix of legal combinations; the helpdesk shows only the CG1 values in passing in `compliance_riziv.md`.
- **Per-file sharing permissions** — not covered. See `patient_file_access_control.md`.
- **GDPR surface** — not covered at all. See `../gaps/03_patient_data_privacy.md`.

## Source files

### API
- `app/imports/api/patientFiles/patientFiles.jsx` — collection, schema, enums, helpers.
- `app/imports/api/patientFiles/methods.jsx` — all Meteor methods.
- `app/imports/api/patientFiles/util.jsx` — client-safe permission helpers.
- `app/imports/api/patientFiles/server/util.js` — demand-form PDF generation, shared-patient email, `files.tags` recompute.
- `app/imports/api/patientFiles/server/publications.jsx` — reactive publications.
- `app/imports/api/patientFiles/server/rosa-patients.ts` — push / pull / merge / permission updates against Rosa.
- `app/imports/api/patientFiles/Documents.js` — document (upload) collection configured with S3 storage.
- `app/imports/api/patientFiles/server/documentsConfig.js` — per-request upload / download permission callbacks + S3 key layout `documents/patientfiles/<patientFileId>/<file>`.
- `app/imports/api/patientFiles/longTherapyPlan.jsx` — long-term goal collection. See `long_term_therapy_plan.md`.
- `app/imports/api/practice/server/util.tsx:140-224` — `removeUser`, `addPatientFile`, `removePatientFile` cascade implementation.
- `app/imports/api/patientFileUsers/patientFileUsers.jsx` — dossier-level roles. See `patient_file_access_control.md`.
- `app/imports/api/patientFileUsers/util.jsx` — permission resolution.
- `app/imports/api/practiceUsers/practiceUsers.jsx:8-153` — practice-level role permission lists.
- `app/imports/api/server/collectionServer.js` — soft-delete base class; critical for understanding deletion semantics.
- `app/imports/lib/permissions/PermissionValidatedMethod.jsx` — subscription gate + permission check wrapper.

### UI
- `app/imports/startup/client/routes/patientFile.js` — 7 routes.
- `app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx` — roster.
- `app/imports/modules/patientfiles/main/PatientFilesMainPageContainer.jsx` — roster data wiring.
- `app/imports/modules/patientfiles/main/PatientFilesGridItem.jsx` — card rendering.
- `app/imports/modules/patientfiles/main/PatientFilesAddModal.jsx` — creation modal. See `patient_creation.md`.
- `app/imports/modules/patientfiles/dashboard/PatientFileDashboard.jsx` — detail layout.
- `app/imports/modules/patientfiles/dashboard/PatientFileDashboardInformation.jsx` — header card with avatar / state / delete.
- `app/imports/modules/patientfiles/dashboard/PatientFileImportantInformation.jsx` — right-rail stats box.
- `app/imports/modules/patientfiles/dashboard/PatientFileTags.jsx` — tag editor.
- `app/imports/modules/patientfiles/dashboard/PatientFileShared.jsx` + `PatientFileSharedContainer.jsx` — sharing UI.
- `app/imports/modules/patientfiles/dashboard/merge-patient-file-dialog.jsx` — merge modal.
- `app/imports/modules/patientfiles/PatientFileState.jsx` — state chip colouring.
- `app/imports/modules/patientfiles/tabs/PatientFileTabs.jsx` — tab strip.
- `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx` — long profile form (info tab).
- `app/imports/modules/patientfiles/profile/PatientFileContactPerson.jsx` + `PatientFileContactPersonSmall.jsx` — contact person sub-forms.
