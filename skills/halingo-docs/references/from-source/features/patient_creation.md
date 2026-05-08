# Patient creation

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: **none** — the helpdesk documents patient management but never the act of creating a dossier. Verify against the running app before promoting to `manual/`.

## What it is

The entry point to the patient-file lifecycle. A therapist opens the roster, clicks the floating **+** button in the top-right of `/patients/`, fills in a short modal form, and the new dossier lands with `state = 'pending'` by default. Creation is the only patient-file operation any practice member can perform regardless of role: every `PracticeUsers` role — including the plain `default` "lid" role — has `patientFile.add` in its permission list (`api/practiceUsers/practiceUsers.jsx:42, :107, :146`). Everything else (view, update, delete) is gated.

## Where it lives in the UI

- **Modal component** — `app/imports/modules/patientfiles/main/PatientFilesAddModal.jsx:61-257`
- **Mounted from** — `app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx:150-167` (the floating FAB at `top: 5, right: 10px`)
- **Auto-opens** when the roster is reached with a `?fullName=...` query param — so navigating from e.g. "create patient from calendar" deep-links straight into the modal with the name pre-split into first + last (`PatientFilesAddModal.jsx:80-88`, `PatientFilesMainPage.jsx:56-58`).
- **Gated by** an active subscription: the FAB and modal only render when `hasActiveSub` is true (`PatientFilesMainPage.jsx:150`).

No dedicated `/patients/new` route exists; creation is strictly a modal over the roster.

## The form

```
FormGroup:
  imageUrl       (ImageSelect, circle)                 — optional
  state          (Dropdown, default PENDING)           — optional, can be any of starting/active/inactive/pending
  firstName      (Input, required)
  lastName       (Input, required)
  gender         (SelectWithSearch: male | female)     — optional
  salutation     (SelectWithSearch: mister/misses/miss/parents/doctor/professor/engineer) — optional
  birthDate      (DatePicker, clearable)               — optional
  SSN            (MaskedInput: 99.99.99-999.99)        — optional
  address        (Address widget)                      — optional
  contactDetails.email    (Input)                      — optional
  contactDetails.gsmNumber (PhoneNumberInput)          — optional
```

`PatientFilesAddModal.jsx:62-76, :155-250`.

### Required fields (strict)

Only these two are schema-required on insert:

- `firstName` — `patientFiles.jsx:167`
- `lastName` — `patientFiles.jsx:184`

The server validator on `patientFile.add` is `PatientFiles.schema.omit("createdAt", "metaData", "removed").validator()` (`methods.jsx:215`). Because the schema is configured with `requiredByDefault: false`, only the two fields explicitly marked `required: true` in the schema matter at validate time. `practiceId` is marked required on the schema but is injected from the container (not user-entered).

### Client-side validation

The form uses `simpleSchemaValidator(PatientFiles.schema)` (`PatientFilesAddModal.jsx:76`). Before calling the method, the client does `this.formGroup.validate(...)` with the assembled object plus `createdAt: new Date()` and `practiceId` injected from props (`PatientFilesAddModal.jsx:95-101`). If validation fails, the submit is aborted and field errors are rendered inline.

The `SSN` mask enforces shape `dd.dd.dd-ddd.dd`; the schema then double-checks with `regEx: /^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/` (`patientFiles.jsx:213`). An invalid or missing INSZ does *not* block creation (the field is optional) but it will block downstream invoicing on the first certificate — see `invoices/patientFileInvoices/server/util.js:122-128` which throws `invoices.create.incompletePatientFile` if `isThirdPayer && !healthInsurance`.

### Pre-fill by deep link

Navigating to `/patients/?fullName=Jan Janssens` will:

1. Open the modal automatically (`PatientFilesMainPage.jsx:56-58`).
2. Split the string on the first whitespace and patch `firstName` / `lastName`:
    ```js
    const split = fullName.split(/ (.+)/);
    this.formGroup.get('firstName').setValue(split[0]);
    this.formGroup.get('lastName').setValue(split[1]);
    ```
    (`PatientFilesAddModal.jsx:81-87`)

This is the mechanism used when another screen (for instance the calendar) offers to create a patient on the fly.

## Submit flow

`PatientFilesAddModal.jsx:90-144`:

1. Validate the form group.
2. Separate `imageUrl` from the rest: if it is an object (freshly-picked file) the modal remembers to upload the avatar after the method returns.
3. Call `addPatientFile.call({...data, imageUrl: hasToUpload ? null : imageUrl, practiceId}, cb)`.
4. On success the modal either:
   - Uploads the avatar via `Avatars.insert({ file, meta: { patientFileId }, ... })` and then does `FlowRouter.go('patientfiles.view', { patientId: newId })`, or
   - Immediately navigates to `patientfiles.view` for the new id.

The `addPatientFile` method itself (`api/patientFiles/methods.jsx:213-229`) is a thin wrapper:

```js
const patientFileId = PracticeUtil.addPatientFile(this.userId, patientFile);
await RosaPatients.pushPatientsToRosa([patientFileId]);
await RosaPatients.updatePermissionsForPatientFileIds([patientFileId]);
return patientFileId;
```

Server implementation in `PracticeUtil.addPatientFile` (`api/practice/server/util.tsx:166-190`):

```js
const creator = Meteor.users.findOne(userId);
patientFile.metaData = { userId, email: creator.email() };
const patientFileId = PatientFiles.insert(patientFile);
if (patientFileId) {
  const practiceUser = PracticeUsers.find({ userId, practiceId: patientFile.practiceId });
  if (practiceUser.role !== PracticeUsersRoles.owner.id) {
    PatientFileUsers.insert({
      patientFileId,
      userId,
      role: PatientFileUserRoles.admin.id,
    });
  }
}
return patientFileId;
```

Post-conditions:

- `metaData.userId` on the new dossier equals the creator's userId — this is the only audit trail of who created the record (`api/patientFiles/patientFiles.jsx:246`).
- `metaData.email` captures the creator's email at creation time (stale if they later change email).
- For a non-owner creator, a `PatientFileUsers` row with `role: "admin"` is inserted so they have the full granular permission set on their own creation (`patientFileUsers/patientFileUsers.jsx:6-29`).
- For an owner creator, no explicit row is created — they already have all `patientFile.*` permissions at the practice level.
- `createdAt` is stamped by the base `Collection.insert` override (`api/collection.js:13-16`).
- The `state` defaults to `PatientFiles.states.PENDING` if the schema default kicks in (`patientFiles.jsx:214-218`), though the form dropdown lets the user override this at creation time to any of `starting / active / inactive / pending`.
- The dossier is pushed to Rosa via `RosaPatients.pushPatientsToRosa`; if it is not yet linked, Rosa creates a new patient record and stores the returned `rosaId` back on the Halingo dossier (`server/rosa-patients.ts:481-512`).
- Rosa per-record permissions are calculated for every therapist in the practice (`RosaPatients.updatePermissionsForPatientFileIds`, `rosa-patients.ts:258-370`).

### Post-create navigation

The user lands on `/patients/:patientId` regardless of whether an avatar upload is in flight; the image upload completes asynchronously via the `Avatars` collection (`PatientFilesAddModal.jsx:123-140`).

## Post-create state

A freshly created dossier has:

| Field | Default |
|---|---|
| `state` | `pending` unless the user changed the dropdown |
| `metaData.userId` | creator's userId |
| `metaData.email` | creator's email at creation time |
| `createdAt` | `new Date()` (base collection override, `collection.js:14`) |
| `tags`, `contactPersons`, `school`, `CLB`, `doctor`, `prescriber`, everything else | `undefined` / empty |
| `healthInsurance` | not set — must be filled via the info tab before an invoice can be generated |
| `insuranceStateCode1`, `insuranceStateCode2` | not set |
| `isThirdPayer` | not set — must be explicitly toggled (`updateIsThirdPayer`) or through the treatment panel |
| `rosaId` | set async after the Rosa push resolves |
| `PatientFileUsers` row for creator (non-owner only) | one row, `role: admin` |

None of the clinical extras — treatments, bilans, events, invoices, reports, documents, therapy goals — exist yet; they are all created from the detail page tabs.

## What is *not* captured at creation

None of the following has any UI entry during creation, and there is no consent capture anywhere in the flow:

- GDPR / data-processing consent (no field, no checkbox, no timestamp) — see `../gaps/03_patient_data_privacy.md`.
- Privacy policy acceptance by the patient.
- Signature of the patient or a legal guardian.
- Photo / video consent (for telehealth sessions).
- Identity verification (no check that the INSZ matches the name / birthdate; no eID integration).
- Mandate paperwork for third-payer (derdebetaler) direct billing.

The app will happily create a dossier with only a first name and last name filled in. All the above are operational / legal obligations the practice must handle outside Halingo.

## Permissions

`patientFile.add` is required. It is granted to **every** practice role by default (`api/practiceUsers/practiceUsers.jsx:42, :107, :146`). The method does not take a `patientFileId` at the time of the call so there is no per-file check.

An active subscription on the practice is required — `addPatientFile` is declared with `subscription: true` (`api/patientFiles/methods.jsx:216`), which means `PermissionValidatedMethod._execute` refuses the call if no active subscription exists for the practice.

## Error modes

Known client-facing errors from the creation path:

| Error | Source | Meaning |
|---|---|---|
| `NO_ACTIVE_SUB_FOR_PRACTICE` | `PermissionValidatedMethod.jsx:28` | Practice subscription not active. |
| `errors.permissions.patientFile.add` | `PermissionValidatedMethod.jsx:36` | Caller has no role at all at the target practice, or the role does not list `patientFile.add`. |
| SimpleSchema validation errors | `PatientFiles.schema` | Missing `firstName` / `lastName`, malformed `SSN`, bad `gender`, etc. |
| Meteor.Error wrapping a RosaApi failure | `RosaPatients.pushPatientsToRosa` | The dossier was inserted in Halingo but the subsequent Rosa push threw. The Halingo write is not rolled back. |

## Notable details

- **Only two fields are strictly required** — first and last name. Everything else is optional at the mongo level. Practices should treat the profile tab as the real "complete dossier" form.
- **The state dropdown defaults to whatever the user leaves selected**, not to `active`. If the therapist doesn't touch it the patient stays in the `pending` ("Wachtlijst") bucket (`PatientFilesAddModal.jsx:75`, i18n key `patient.state.pending = "Wachtlijst"` at `client/nl.i18n.js:464`).
- **The modal cannot attach a photo by URL** — it always goes through `ImageSelect`, which produces a `File` object, which is then uploaded to `Avatars` (S3). There is no "paste image URL" path.
- **First-time creator bookkeeping is stealthy.** A non-owner creator gets an `admin` row in `PatientFileUsers` inserted for them automatically (`util.tsx:180-186`). The UI does not show this anywhere — it is only visible via the sharing box on the dashboard right rail. If practice admins later revoke that row (via `patientFile.removeAccess`) the creator loses everything except view access via practice role.
- **If the creator is a practice owner, no `PatientFileUsers` row is created** — so the dossier has zero explicit grants out of the gate, and only users with practice-level `patientFile.view` (owner + admin) can see it. Regular "lid" users cannot see it until someone shares it explicitly.
- **There is no retry on Rosa failure.** If the Rosa push throws, the user still lands on the detail page but `rosaId` is never set. `pushPatientsToRosa` relies on `deletedInRosa: null` and `isMissingInRosa: null` filter — so the next patient-file update attempt will retry the push (`rosa-patients.ts:431-479`).

## Helpdesk overlap

None. The imported Zendesk articles under `full_documentation/patient_management.md` do not contain a "create a patient" article. The closest adjacent articles cover filtering the existing roster and tagging dossiers.

## Source files

- `app/imports/modules/patientfiles/main/PatientFilesAddModal.jsx` — the modal form.
- `app/imports/modules/patientfiles/main/PatientFilesMainPage.jsx:150-167` — where the modal is mounted.
- `app/imports/api/patientFiles/methods.jsx:213-229` — `addPatientFile` Meteor method.
- `app/imports/api/practice/server/util.tsx:166-190` — server-side insert + creator-access wiring.
- `app/imports/api/patientFiles/patientFiles.jsx:148-255` — the SimpleSchema that validates the form on both client and server.
- `app/imports/api/patientFiles/server/rosa-patients.ts:431-512` — Rosa push on creation.
- `app/imports/api/practiceUsers/practiceUsers.jsx:42, :107, :146` — `patientFile.add` granted to every role.
- `app/imports/i18n/resources/client/nl.i18n.js:332-466` — Dutch i18n strings for `patient.add.*` and `patient.state.*`.
