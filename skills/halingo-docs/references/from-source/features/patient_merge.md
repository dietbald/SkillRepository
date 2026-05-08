# Patient merge

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: **none**. Verify against the running app before promoting to `manual/`.

## What it is

A way to collapse two patient dossiers that refer to the same person into a single "winner" dossier. In Halingo this functionality exists primarily as a reconciliation mechanism for the Rosa integration — when Rosa pushes a patient that might be a duplicate of one already in Halingo, the dossier is flagged `requiresReview: true` and the user is shown a **Merge** / **Keep as is** prompt on the detail page. The actual merge is executed on Rosa, not on Halingo: the Halingo "merged-from" dossier is soft-removed and its Rosa id pointer is updated, while Rosa returns a merged record that becomes the new `rosaId` of the "merged-into" dossier.

> ⚠️ Behaviour inferred from code; needs product validation. Because merge is implemented on top of Rosa's merge API and explicitly throws `errors.merge.patients.not_allowed` on any Rosa error (`methods.jsx:172-176`), merge is effectively unavailable for practices that have not connected to Rosa. The UI button is disabled when no Rosa token exists (`PatientFileDashboard.jsx:140-146`).

## Where it lives in the UI

- **Entry point** — the "Nieuwe patiënt van Rosa" box on `PatientFileDashboard.jsx:132-162`, visible when `patientFile.requiresReview === true`. Two buttons:
  - `MERGE_PATIENT` — opens `MergePatientFileDialog`, disabled when the user has no active Rosa integration (`PatientFileDashboard.jsx:140-146`).
  - `KEEP_PATIENT_AS_IS` — calls `updatePatientFile` with `{ requiresReview: false }` and just flips the flag off (`PatientFileDashboard.jsx:81-95, :148-153`).
- **Merge dialog** — `MergePatientFileDialog` · `app/imports/modules/patientfiles/dashboard/merge-patient-file-dialog.jsx`
  - A single `PatientFileSelect` to pick the winner (`merge-patient-file-dialog.jsx:72-81`), filtered to exclude the source dossier.
  - A submit button that calls `mergePatientFileInto.call({ patientFileId, mergeIntoId })`.
  - On success navigates to `patientfiles.view` of the winner.

No other UI path to merge exists — the button only renders when `requiresReview` is set, which is only set by the Rosa pull path (`rosa-patients.ts:180-213`). A dossier created purely in Halingo is never flagged.

## The Meteor method — `patientFile.merge.patientFiles`

`app/imports/api/patientFiles/methods.jsx:126-179`:

- Inputs: `{ patientFileId, mergeIntoId }` — both `SimpleSchema.RegEx.Id`, both required.
- Requires `patientFile.update` permission on **both** dossiers independently (`methods.jsx:155-166`) — re-checks in the method body because the `PermissionValidatedMethod` wrapper only runs `getPermissionData` once for the source dossier.
- Throws `errors.merge.patients.same` if the two ids are identical (`methods.jsx:168-170`).
- Delegates to `RosaPatients.mergePatientRecords(this.userId, patientFileId, mergeIntoId)`.
- Catches **any** exception from the Rosa call and re-throws as `errors.merge.patients.not_allowed` (`methods.jsx:172-176`). This obscures the real Rosa error.

## What the server actually does — `RosaPatients.mergePatientRecords`

`app/imports/api/patientFiles/server/rosa-patients.ts:586-641`:

```ts
const [mergeIntoPatient, patient] = await Promise.all([
  PatientFiles.findOne(mergeIntoId),
  PatientFiles.findOne(patientRecordId),
]);

const user = await Meteor.users.findOne({
  _id: userId,
  "rosaIntegrations.practiceId": mergeIntoPatient.practiceId,
});

if (
  user &&
  user.rosaIntegrations?.some(
    (integration) =>
      integration.practiceId === mergeIntoPatient.practiceId && !integration.tokenInvalid
  ) &&
  patient.rosaId &&
  mergeIntoPatient.rosaId
) {
  const mergedPatientRecord = await RosaApi.patientRecords.mergePatientRecordsForUser(
    user,
    mergeIntoPatient.practiceId,
    {
      mainPatientRecordId: mergeIntoPatient.rosaId,
      secondaryPatientRecordId: patient.rosaId,
      mergedPatientRecord: {
        ...omit(this.mapHalingoPatientFileToRosa(mergeIntoPatient), ["id", "status"]),
      },
    }
  );

  await RosaEvents.moveEventsToNewPatientFileId([patientRecordId], mergeIntoId);
  await PatientFiles.update(
    { _id: patient._id },
    { $set: { mergedToRosaId: mergedPatientRecord.id } }
  );
  await PatientFiles.remove({ _id: patient._id });
  await PatientFiles.update(
    {
      _id: mergeIntoId,
    },
    {
      $set: {
        rosaId: mergedPatientRecord.id,
        mergedFromRosaIds: mergedPatientRecord.mergedFromIds,
      },
    }
  );
}
```

Step by step:

1. **Pre-conditions.** Both dossiers must exist. The caller must have a valid (non-`tokenInvalid`) Rosa integration on the target practice. Both dossiers must already have a `rosaId`. If any of these is false, **the method silently returns** without doing anything — no error is thrown, nothing is merged on the Halingo side (`rosa-patients.ts:602-610`).
2. **Call Rosa merge API** (`RosaApi.patientRecords.mergePatientRecordsForUser`). The body sent to Rosa contains the merged-into dossier mapped to a Rosa `PatientRecordDto` (minus `id` and `status`). Rosa is the source of truth for the merged record shape.
3. **Move events.** `RosaEvents.moveEventsToNewPatientFileId([patientRecordId], mergeIntoId)` moves every `Events` row with `patientFileId === patientRecordId` to the winner (`events/server/rosa-events.ts` is where this lives). This covers past and future appointments, group events, etc.
4. **Tombstone the loser.** The source dossier gets `mergedToRosaId` set to the new Rosa id, then is soft-deleted via `PatientFiles.remove({ _id: patient._id })`. Because `CollectionBaseServer.remove` is a soft delete, the row is still in mongo with `removed: true, removedAt: <now>` — it is not physically gone.
5. **Update the winner.** The winner's `rosaId` is overwritten with the new Rosa id returned by the merge API, and `mergedFromRosaIds` is updated with the list Rosa gives back.

### What does *not* get merged

- **Treatments.** Not moved. `Treatments` entries keep pointing at the old `patientFileId` — they remain, but because the loser is soft-removed, `find` queries filtered by the loser's id still return nothing via the normal (soft-delete-aware) path. The winner sees only its original treatments.
- **Invoices.** Not moved. `PatientFileInvoices` with the loser's `patientFileId` are untouched. If the loser had any invoices, they become orphaned references — the billing history is effectively "stuck" on the tombstoned record.
- **Reports, documents, long-term therapy goals.** Not moved. `PatientFileReports`, `Documents` (with `meta.patientFileId`), and `LongTherapyPlan` entries stay attached to the loser. None of the merge code touches them.
- **Contact persons, school metadata, CLB block, doctor, prescriber.** Not combined. The winner's values win wholesale — whatever is on `mergeIntoPatient` at the time of the click is what the merged record contains.
- **Tags.** Not unioned. The winner's `tags` and `files.tags` arrays are kept, the loser's are discarded.
- **`PatientFileUsers` rows.** Not migrated. The loser's sharing rows become orphans pointing at a soft-deleted patient file. In practice, this means therapists who had explicit access to the loser dossier via a `PatientFileUsers` row *lose access* after the merge unless they also have access to the winner (either via practice role or a separate row).
- **Notifications.** Not moved. `Notifications` with `meta.attributes.patientFileId === loserId` become orphans.

### What happens on failure

Any thrown error from `RosaApi.patientRecords.mergePatientRecordsForUser` or downstream propagates back to `mergePatientFileInto.run`, which swallows it and re-throws `errors.merge.patients.not_allowed` (`methods.jsx:172-176`). There is **no partial-merge rollback** — if `moveEventsToNewPatientFileId` succeeded before `PatientFiles.remove` failed, you end up in a half-merged state with events pointing at the winner and the loser still visible. Because all the Halingo-side updates are soft-flag toggles, cleanup is conceptually a mongo update, but there is no built-in script for it.

## Automatic merge during Rosa pull

A separate path in `RosaPatients.pullPatientsForUser` (`rosa-patients.ts:100-238`) performs automatic merges when Rosa returns a patient record that has `mergedFromIds` pointing to records Halingo already knows about:

1. For each Rosa patient with `!mergedToId && mergedFromIds?.length`, find all existing Halingo patients whose `rosaId` is in `mergedFromIds` and are not `removedAt`.
2. Pick a "primary" — the first non-`fromRosa` one if any, otherwise the first in the list.
3. Move events from the other relevant patients to the primary: `RosaEvents.moveEventsToNewPatientFileId(childIds, primary._id)`.
4. Soft-remove the others.
5. Update the primary with the merged Rosa data.

This automatic path has the **same limitations** as the interactive merge — only events are moved; treatments, invoices, reports, documents, therapy plans, sharing rows are not consolidated.

## Permissions

- `patientFile.update` on the source dossier (wrapper check via `getPermissionData` at `methods.jsx:140-148`).
- `patientFile.update` on the target dossier (in-method re-check at `methods.jsx:155-166`).
- Active Rosa integration on the target dossier's practice (silent skip otherwise, `rosa-patients.ts:602-610`).
- Active practice subscription — `mergePatientFileInto` is declared `subscription: true` (`methods.jsx:129`).

## Notable details

- **Rosa is required.** A practice that has never connected to Rosa cannot merge. The `mergePatientRecords` function silently returns without doing anything if `user.rosaIntegrations` is empty or invalid, or if either dossier lacks a `rosaId` (`rosa-patients.ts:602-610`). The client sees the dialog close successfully but nothing happens. The UI button is also disabled when no Rosa integration is present (`PatientFileDashboard.jsx:140-146`), which is the user-facing mitigation.
- **The merge dialog only appears on Rosa-pulled dossiers.** The `MergePatientFileDialog` is only mounted inside the `requiresReview` branch of `PatientFileDashboard` (`PatientFileDashboard.jsx:156-161`). There is no "merge these two dossiers" button elsewhere in the UI, so you cannot merge two manually-created Halingo dossiers except via direct method invocation.
- **"Keep as is" just flips the flag.** Clicking `KEEP_PATIENT_AS_IS` fires `updatePatientFile` with `{ requiresReview: false }` and does nothing else (`PatientFileDashboard.jsx:81-95`). Nothing about the dossier is altered.
- **The Rosa merge call sends the winner's mapped DTO** — so the merged patient's identity in Rosa reflects the Halingo winner at the time of the click. Any drift between the two (e.g. the loser having a more accurate SSN) is lost.
- **`mergedFromIds` on the Halingo schema is present but never written by the merge code.** It is set by the Rosa pull code when reconciling merged patient records that are new to Halingo (`rosa-patients.ts:130-185`).

## Helpdesk overlap

None. Merge is not mentioned anywhere in `full_documentation/`.

## Source files

- `app/imports/api/patientFiles/methods.jsx:126-179` — the `mergePatientFileInto` Meteor method.
- `app/imports/api/patientFiles/server/rosa-patients.ts:586-641` — server-side merge implementation (Rosa API call + tombstoning).
- `app/imports/api/patientFiles/server/rosa-patients.ts:100-238` — automatic merge during Rosa pull.
- `app/imports/modules/patientfiles/dashboard/merge-patient-file-dialog.jsx` — merge dialog UI.
- `app/imports/modules/patientfiles/dashboard/PatientFileDashboard.jsx:74-162` — the `requiresReview` banner and `markComplete`.
- `app/imports/api/events/server/rosa-events.ts` — `moveEventsToNewPatientFileId` (the only cross-reference mutation the merge performs beyond patient files).
