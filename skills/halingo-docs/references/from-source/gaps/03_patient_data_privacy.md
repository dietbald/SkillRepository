# Patient data privacy (gap fill from code)

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. The helpdesk export contains no article on this topic. Functional grouping #3 in `../../functional/application_map.md`. **Verify against the running app and against legal/DPO before promoting to `manual/`.** This document is intentionally blunt about gaps because inventing GDPR compliance is worse than admitting it is missing.

## Summary

Halingo is a SaaS practice-management platform that holds full Belgian patient dossiers — demographics, INSZ (national social security number), insurance category codes (CG1/CG2), medical history free-text, contact persons, school metadata (`CLB`, teachers, coordinators) for pediatric patients, prescriber and family doctor identities, RIZIV billing certificates, clinical reports, uploaded medical documents, long-term therapy goals, and a full appointment / billing history. By any reading of GDPR, this is special-category personal data ("data concerning health", Art. 9(1) GDPR).

Reading the production source code at `/home/tj/Repos/Halingo-Main`, the GDPR-relevant feature surface is **very thin**. There is no data export endpoint, no retention policy, no consent capture in the patient creation flow, no per-record access audit log, no field-level encryption, no anonymisation routine, and no cascade from user account deletion to the patient files that user owns. Patient deletion is a soft delete that physically leaves every record in MongoDB and every uploaded binary in S3. Therapist account deletion is also a soft delete that does not touch patient files at all.

The product does have a few GDPR-adjacent affordances — practice-level access control for inter-therapist visibility, per-file granular sharing, the existence of a Terms of Service acceptance flag on `Meteor.users`, and TLS/HTTPS for the wire — but these are general-purpose security measures, not GDPR-specific implementations. None of the explicit GDPR data subject rights (access, rectification, erasure, portability, restriction, objection) is implemented in code as of this audit.

The third paragraph: in practice, a Halingo practice that needs to fulfil a Belgian patient's GDPR access or erasure request today would have to do it manually — either by hand-walking the patient through the dossier and manually exporting screenshots / PDFs, or by raising a support ticket to the Halingo team to perform a direct mongo update. Neither path is documented in the helpdesk and neither is implemented as an in-app feature.

## Data export / portability

**No machine-readable export of a patient's data exists in the code.**

A grep across `app/imports/api` for `export`, `dataExport`, `portability`, `gdpr`, `getPatientData`, `exportPatient`, `exportToCsv` finds:

- `exportAgenda` on `agendaSettings` (`agendaSettings/agendaSettings.jsx:16`) — a per-user toggle for the iCal **calendar** export feed (`events/server/rest.jsx:35`). Calendars only, no patient data, no clinical content.
- Test data files (`testData.js`) — irrelevant.
- ES module `import` / `export` keywords — false positives.

There is no Meteor method named `patientFile.export`, no REST endpoint that emits a patient bundle, no PDF generator that produces a "complete dossier" file, no JSON / XML / CSV export. The `addPatientFileDemandForm` method (`patientFileReports/methods.jsx:134-171`) generates RIZIV insurance demand-form PDFs, but that is a third-party-payer billing artifact, not a data-portability export.

The closest a user can get to "having a copy of the data" in-app is:

- Downloading individual uploaded documents one at a time via the document viewer (`PatientFileDocumentPage.jsx:148-153`).
- Downloading individual rich-text reports as `.doc`-extensioned HTML via the report editor (`PatientFileReportPage.jsx:163-173`).
- Printing individual invoices and certificates one at a time.

Each of these requires a full clickthrough per item; there is no batch export.

**Verdict: not implemented.** Any practice receiving an Art. 15 (right of access) or Art. 20 (right to data portability) request must satisfy it outside Halingo.

## Right to erasure

The right to erasure (Art. 17 GDPR) requires that a controller, on the data subject's request and absent overriding legal grounds, erases the personal data **without undue delay**. Halingo's implementation of "delete a patient" is a soft delete that does not erase anything in the literal sense.

### What `patientFile.remove` actually does

`app/imports/api/patientFiles/methods.jsx:231-273` → `PracticeUtil.removePatientFile` (`api/practice/server/util.tsx:192-224`):

1. **Refuses if any non-canceled invoice exists.** Throws `patient.remove.invoiceExists` (`util.tsx:194-201`). A patient with billing history cannot be removed at all until every invoice is cancelled first.
2. Soft-removes `Documents` for the dossier (`util.tsx:205`).
3. Soft-removes uninvoiced `Events` for the dossier (`util.tsx:206-209`). Invoiced events are left intact.
4. Pushes event removals to Rosa.
5. Soft-removes `LongTherapyPlan` entries.
6. Soft-removes `Notifications` referencing the dossier.
7. Soft-removes `PatientFileReports`.
8. Soft-removes `PatientFileUsers` rows.
9. Soft-removes `Treatments`.
10. Soft-removes the `PatientFiles` row itself.

### "Soft" means "the row stays"

The Halingo collection base class overrides `remove()` (`api/server/collectionServer.js:35-37`) to:

```js
return super.update(selector, { $set: { removed: true, removedAt: new Date() } }, { multi: true }, cb);
```

and rewrites `find()` / `findOne()` / `update()` to silently add `{ removed: { $ne: true } }` to every selector (`collectionServer.js:3-16, :19-33, :43-56`). The mongo document is **never deleted**. Three escape hatches exist — `findUnsafe`, `findOneUnsafe`, `removeUnsafe`, `updateUnsafe` — but the patient deletion path never uses them.

Concretely, after a "delete patient" click in the UI:

| Data | What happens |
|---|---|
| `PatientFiles` row | `removed: true, removedAt: <now>`. All fields including INSZ, name, address, medical history, school info still in mongo. |
| `Treatments`, `LongTherapyPlan`, `PatientFileReports`, `PatientFileUsers`, `Notifications` (referencing the dossier) | Same — soft-deleted, mongo rows remain. |
| `Documents` rows | Same — mongo row soft-deleted. |
| **S3 objects backing the documents** | **Untouched.** No cleanup hook in `documentsConfig.js` (`api/patientFiles/server/documentsConfig.js`), no S3 lifecycle policy in the code. The binaries (PDFs, scans, photos) remain in the `documents/patientfiles/<patientFileId>/` "folder" indefinitely. |
| `PatientFileInvoices` | **Not touched.** The pre-condition refuses deletion if any non-cancelled invoice exists, but cancelled invoices remain in place pointing at the now-soft-deleted patient. So a patient who is "removed" still has a complete invoice history with their full name and INSZ on it. |
| `Events` with an `invoiceId` | **Not touched.** Only uninvoiced events are removed. Invoiced events stay, with `patientFileId`, `start`, `end` and the price intact. |
| Rosa-side data | A `RosaApi.patientRecords.deletePatientRecordsForUser` call is fired post-deletion (`rosa-patients.ts:556-582`). Whether Rosa actually erases the data or merely flags it inactive is governed by Rosa's API and not by Halingo. |

### What erasure would actually look like

A GDPR-compliant erasure would need to:

1. Use `removeUnsafe` (or a raw mongo `deleteMany`) on every related collection.
2. Invoke `s3Client.deleteObject` for every S3 key under `documents/patientfiles/<patientFileId>/`.
3. Decide what to do about invoiced events and cancelled invoices. Belgian tax/RIZIV law requires keeping certain billing records for several years; erasure would have to be partial and trade against that legal retention basis.
4. Decide what to do about backups — there is no backup-aware erasure path in the code.

None of these is implemented.

**Verdict: not implemented.** "Delete patient" hides the dossier from the UI but does not erase the personal data.

## Retention policy

**No time-based automatic deletion of inactive records exists in the code.**

A grep across `app/imports/api` for `retention | purge | cleanup | expire` finds:

- `verifyEmailTokenExpired` in `users/server/util.jsx:125` — token TTL on email-verification tokens (30 minutes hardcoded). Not a data retention policy.
- A few i18n strings.

The `inactive` patient state (`PatientFiles.states.INACTIVE = "inactive"`) is a UI label only — there is no scheduled job that touches inactive patients, no archival mechanism that moves them out of the live collection, no automatic deletion after N months / years. The roster's default placeholder filter excludes `inactive` patients (`PatientFilesMainPage.jsx:133`), so they "disappear from view" but stay live.

There is no `RetentionPolicies` collection, no `app/imports/server/jobs/` directory implementing a scheduled cleanup, no Meteor Cron / `node-cron` registration, and no migration that sets up TTL indexes.

**Verdict: not implemented.** Patient data lives forever from the application's perspective.

## Consent capture

**No GDPR consent is captured in the patient creation flow.**

`app/imports/modules/patientfiles/main/PatientFilesAddModal.jsx` (the patient creation modal) has form controls for: avatar, state, firstName, lastName, gender, salutation, birthDate, SSN (INSZ), address, email, phone (`PatientFilesAddModal.jsx:62-76, :155-250`). There is no consent checkbox, no "patient agrees to data processing" toggle, no consent timestamp, no consent version, no link to a privacy notice.

The dossier schema (`api/patientFiles/patientFiles.jsx:148-255`) has no `consent`, `gdprConsent`, `dataProcessingConsent`, `consentAt`, `consentVersion`, or similar field. None of the methods in `api/patientFiles/methods.jsx` writes a consent timestamp.

The only consent-like flag in the entire codebase is `Meteor.users.acceptedTerms` (`api/users/users.jsx:152-155`), which is the **therapist's** acceptance of Halingo's Terms of Service at registration time (`api/users/methods.jsx:41-48, :77-78, :347-349`). Its value is the literal string `"3"` (the version number). This is the SaaS provider's TOS for its therapist customers, not patient consent for the underlying clinical data.

**Verdict: not implemented for patients.** The therapist accepts SaaS terms; the patient consents to nothing in Halingo.

## Audit trail

**No per-record access audit log for patient data exists.**

The `MethodLogger` collection (`app/imports/api/logger/logger.js:5`) records *Meteor method calls*, but only on **failure**. The wrapper at `app/imports/lib/permissions/LoggedInValidatedMethod.jsx:14-58` constructs a log entry only inside `logEnd(extra)` and only calls `logEnd` from the `catch` blocks (`:51-58`) and the promise-rejection handler (`:39-48`). The successful path returns the result without writing to `MethodLogger`. So a successful read or update of a patient record produces no log entry.

The `clientErrors` collection (`api/clientErrors/clientErrors.jsx`) is for client-side JavaScript exceptions, also failure-only.

There is no separate "access log" collection. The patient publications (`patientFile`, `patientFilesOfPractice`, `usersOfPatientFile`, `documentsOfPatientFile`, `patientFileDocument`, `patientFileLongTherapyPlan` in `api/patientFiles/server/publications.jsx`) stream live data to the client without writing any log of who subscribed when.

The closest Halingo gets to an audit field on patient files is:

- `metaData.userId` and `metaData.email` on `PatientFiles` — set at insert time, records *who created* the dossier (`api/practice/server/util.tsx:166-173`). One field, never updated, no rotation.
- `createdAt` and `updatedAt` on individual records — standard timestamps.
- `removedAt` set on soft-delete.
- `metaData.userId` on Rosa-pulled patients — records the Halingo user whose Rosa session pulled the record (`rosa-patients.ts:174-182, :205-213`).

What is **not** logged:

- Who viewed a patient file and when.
- Who edited a patient file (no `lastModifiedBy`, no diff).
- Who downloaded a patient document.
- Who exported a report.
- Who shared a patient file with whom (`grantUserAccessToPatientFile` writes a `Notifications` row visible to the recipient, `methods.jsx:374-387`, but no immutable audit row).
- Who revoked access.
- Who printed a certificate.
- Failed authorisation attempts (the `MethodLogger` records the method-name + error string, not the userId of the would-be attacker beyond what comes through `methodInvocation.userId`).

**Verdict: not implemented.** Halingo cannot today answer the question "who has accessed patient X's record in the last 90 days?" from its own data.

## Account deletion cascade

**Account deletion is a soft flag that does not cascade to patient files.**

`app/imports/api/users/methods.jsx:331-338`:

```js
export const deleteUser = new LoggedInValidatedMethod({
  name: "users.delete",
  validate: null,
  run() {
    UsersUtil.checkLocked(Meteor.users.findOne(this.userId));
    UsersUtil.deleteUser && UsersUtil.deleteUser(this.userId);
  },
});
```

`UsersUtil.deleteUser` (`api/users/server/util.jsx:20-30`):

```js
const _deleteUser = function(userId) {
  Meteor.users.update(userId, {
    $set: {
      removed: true,
      removedAt: new Date()
    }
  });

  // Logout user everywhere
  Meteor.users.update(userId, { $set: { "services.resume.loginTokens": [] } });
};
```

That is the entire implementation. The function does the following and **only** the following:

1. Sets `removed: true, removedAt: <now>` on the `Meteor.users` document.
2. Empties `services.resume.loginTokens` to log the user out of all sessions.

It does **not**:

- Delete the user document.
- Touch `practiceUsers` (the user remains a member of every practice they belonged to, with their role intact, just hidden from the soft-delete-aware queries).
- Touch `patientFileUsers` (the user remains "shared" on every dossier they had access to).
- Touch `patientFiles` records they created (`metaData.userId` still points at them).
- Touch any `patientFileInvoices` they generated.
- Touch any `Events` they were assigned to as therapist.
- Notify any practice owner that one of their staff has self-deleted.
- Re-assign any patient files where the deleted user was the only sharee.
- Cancel any subscriptions, transfer ownership of any practice, or do anything to the SaaS lifecycle.
- Delete the user's avatar from S3.
- Erase the user's email address from `emails.0.address` (which is the address that received every welcome / verification / reset email and is referenced in `metaData.email` on every patient they created).

The separate `_removeUser(userId, practiceId)` (`api/practice/server/util.tsx:140-156`) is what runs when an **admin removes a colleague from a practice** — it removes the `practiceUsers` row and cascades to delete `patientFileUsers` rows for that user in that practice. But this is not invoked from `users.delete`.

**Verdict: not implemented.** A therapist who deletes their account leaves all the patient data they ever touched intact and visible to everyone else who has access. The link from patient files to the deleted user via `metaData.userId` remains.

## Encryption at rest

**No field-level encryption on patient data.**

A grep across `app/imports/api/patientFiles` for `encrypt | crypt` returns no matches. The patient file schema (`api/patientFiles/patientFiles.jsx:148-255`) declares INSZ, demographics, address, contact details, medical history, school info, and prescriber identity as plain `String` / `Date` / `Object` types. No `EncryptedString` wrapper, no `meteor/mongo-collection-instances` encryption hook, no field-level KMS integration.

Patient documents in S3 are stored under the bucket configured by `Meteor.settings.AWSS3Bucket` (`api/patientFiles/server/documentsConfig.js:46`). The `uploadToS3` call (`lib/upload/aws/s3helpers.js:7-56`) does not pass any `ServerSideEncryption` option, so unless the bucket has a default encryption policy configured at the AWS level (outside the codebase), the objects rely on whatever bucket-default S3 provides. SSE-S3 is now AWS's default for new buckets, but there is no in-code attestation. There is no client-side encryption before upload.

The `practiceUsers` collection has a `publicKeys` field (`practiceUsers.jsx`, see `users.update.publickeys` permission) — there is plumbing for storing user public keys, but no code path encrypts patient data with them. The keys are not used in any patient file or document method examined.

**Verdict: relies on infrastructure-level encryption (TLS in flight, S3 default encryption at rest) — no application-level encryption of patient data, no field-level encryption of INSZ or medical history.**

## What is missing

For a Belgian SaaS platform handling patient health data under GDPR + Belgian health data law (the *Wet betreffende de rechten van de patiënt*, the *Kaderwet betreffende de verwerking van persoonsgegevens*, and the relevant RIZIV / FOD Volksgezondheid rules), the code is missing:

- **Patient data export (Art. 15 access, Art. 20 portability).** No method, no REST endpoint, no UI button. A patient asking for "all my data" cannot be served from within the app.
- **Real erasure (Art. 17).** Soft delete is not erasure. No path physically removes patient records or S3 objects. No partial-erasure path that respects legal retention exceptions.
- **Retention policy.** No time-based archival, no scheduled cleanup, no `removed_at + N years` purge job.
- **Consent capture.** No patient consent field, no consent version, no consent timestamp, no consent withdrawal endpoint. No link to a patient-facing privacy notice from inside the dossier.
- **Per-record access audit log.** Successful reads, edits, downloads, prints are not logged. The `MethodLogger` is failure-only and lacks the granularity (no `entityId` field) to function as an access log.
- **Account deletion cascade.** `users.delete` does not touch any patient data or any practice membership.
- **Right of rectification with provenance.** Edits to patient files are not versioned or attributed. There is no "edit history" for a dossier.
- **Right to restriction of processing.** No "freeze this dossier" mode that disables all writes while preserving the data.
- **Right to object to specific processing.** No granular per-purpose toggles (e.g. "do not include this patient in Rosa sync").
- **Data subject identification.** No verification path for an inbound GDPR request — no token, no separate DSAR endpoint.
- **Anonymisation routine.** No method to anonymise a dossier in place (replace name, INSZ, address with placeholders while preserving the clinical record for research / aggregate stats).
- **Field-level encryption** of high-sensitivity fields like INSZ and medical history.
- **Document encryption** with practice-managed keys (the public-key plumbing on `practiceUsers` exists but is not wired up).
- **Backup-aware erasure.** No "erase from backups" coordination — backups are not even mentioned in the codebase.
- **Breach notification helpers.** No code path that lists patients affected by a particular user's access in a date range, which would be needed to satisfy Art. 33-34 in the event of a credential compromise.
- **Data Processing Agreement / sub-processor bookkeeping in-app.** Not Halingo-app material per se, but there is no in-app surface to register the practice's DPO or to manage DPA acceptance.
- **Children's data special treatment.** Halingo has explicit `pupil` and `student` profession types and stores `school`, `CLB`, teachers, coordinators (`patientFiles.jsx:201-212`). Belgian / EU law treats minors' data with extra requirements (parental consent for under-13s, etc.). No such handling exists.
- **Rosa cross-border sync transparency.** Patient data is pushed to Rosa via `RosaPatients.pushPatientsToRosa` from many code paths (creation, update, removal, sharing). There is no in-app indication to the *patient* (or to the therapist on behalf of the patient) that this push happened, no opt-out, no "do not share with Rosa" toggle on the dossier.
- **De-identified analytics.** No mechanism to surface aggregate analytics in a privacy-preserving way; the `MainDashboardPage` widgets directly query identified records.

## Source files

### What does exist (such as it is)
- `app/imports/api/server/collectionServer.js` — soft-delete base class. The single most consequential file for understanding what "delete" means in Halingo.
- `app/imports/api/patientFiles/patientFiles.jsx` — patient file schema. No GDPR fields.
- `app/imports/api/patientFiles/methods.jsx:231-273` — `removePatientFile` method (front of the deletion path).
- `app/imports/api/practice/server/util.tsx:192-224` — `_removePatientFile` cascade implementation.
- `app/imports/api/users/methods.jsx:331-338` — `deleteUser` Meteor method.
- `app/imports/api/users/server/util.jsx:20-30` — `_deleteUser` server implementation.
- `app/imports/api/users/users.jsx:152-155` — `acceptedTerms` field (SaaS TOS, not patient consent).
- `app/imports/api/users/methods.jsx:41-48, :77-78, :347-349` — TOS acceptance flow at registration.
- `app/imports/api/logger/logger.js` — `MethodLogger` collection.
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx:14-58` — wrapper that writes `MethodLogger` rows on failure only.
- `app/imports/api/patientFileUsers/util.jsx:11-27` — permission resolution (the access-control surface).
- `app/imports/api/patientFiles/server/documentsConfig.js` — S3 upload/download permission hooks. No encryption setup.
- `app/imports/lib/upload/aws/s3helpers.js:7-56` — S3 upload helper, no SSE option.
- `app/imports/api/patientFiles/server/rosa-patients.ts` — Rosa sync that pushes patient records to a third party.
- `app/imports/api/agendaSettings/agendaSettings.jsx:16` + `app/imports/api/events/server/rest.jsx:35` — the only `export*` feature in the API: iCal **agenda** export, not patient data.
- `app/imports/api/clientErrors/clientErrors.jsx` — client error logging, failure-only, not GDPR-relevant.

### What is conspicuously absent
- No `app/imports/api/gdpr/` module.
- No `app/imports/api/dataExport/` module.
- No `app/imports/api/audit/` module (besides `logger`, which is failure-only).
- No `consent` field on `PatientFiles` or any related collection.
- No `gdpr.*` namespace under `app/imports/i18n/resources/` (confirmed by grep against the i18n directory).
- No scheduled job / cron registration for retention.
- No reference to `crypto`, `encrypt`, or any KMS integration in `api/patientFiles/`.
