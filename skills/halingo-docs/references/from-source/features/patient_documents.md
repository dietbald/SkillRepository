# Patient documents

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for the user-visible upload / search / tag flow under `full_documentation/general_getting_started.md` "Documenten", but the storage backend (S3), the per-request permission callbacks, and the document data model are not. Verify against the running app before promoting to `manual/`.

## What it is

The "Documenten" tab on a patient dossier mixes two collections: in-app rich-text reports (`patientFileReports` — see `clinical_reports.md`) and **uploaded binary documents**. This document covers the latter — PDFs, images, audio, plain text, JSON — anything a therapist drags onto the upload widget. Storage is **AWS S3**, not local disk and not GridFS.

The collection is built on `meteor/ostrio:files` (`FilesCollection`), wrapped by `FileCollectionBase` to add Halingo's soft-delete fields, and configured with S3 read/write hooks via `documentsConfig.js`.

## Where it lives in the UI

- **Tab** — "Documenten" on the dossier dashboard, tab index 3 (`PatientFileTabs.jsx:96-108`).
- **Overview page** — `PatientFileReportsOverviewPage.jsx`. Same page that lists reports, with filter chips (`audio` / `doc` / `pic`) and sort by name or date (`PatientFileReportsOverviewPage.jsx:139-162`).
- **Drop zone** — the entire tab content acts as a `FileInput` drop target when the user has `patientFile.reports.add` (`PatientFileReportsOverviewPage.jsx:215-260`). Drag-and-drop bypasses the modal and uploads immediately.
- **Add modal** — `AddReportPopup.jsx` "Uploaden" tab, which is just a wrapper that calls the same `handleDrop` (`PatientFileReportsOverviewPage.jsx:57-94, AddReportPopup.jsx:176-200`).
- **Document viewer** — `app/imports/modules/patientfiles/reports/PatientFileDocumentPage.jsx`. Renders:
  - Images inline (`<img>`).
  - PDFs inline (`<iframe>`).
  - Other types via Google Docs Viewer (`https://docs.google.com/gview?url=...`) (`PatientFileDocumentPage.jsx:104-125`).

## Storage backend

`app/imports/api/patientFiles/Documents.js` defines the collection. Server-side configuration is merged in from `app/imports/api/patientFiles/server/documentsConfig.js`:

```js
const config = {
    downloadCallback(file) {
        if (!file) return false;
        const userId = this.userId || this.request.query.userId;
        return PatientFilesUtil.canUserViewPatientFile(userId, file.meta.patientFileId);
    },
    interceptDownload: downloadFromS3,
    onBeforeUpload(file) {
        const patientFileId = _.get(file, 'meta.patientFileId');
        const patientFile = PatientFiles.findOne(patientFileId);
        const sub = SubscriptionUtil.getActiveSubscriptionOfPractice(patientFile.practiceId);

        if (!sub || !sub.isActive()) return false;

        if (_.get(file, 'meta.tags')) {
            file.meta.tags = file.meta.tags.filter(el => typeof el === 'string');
        }

        return PermissionsUtil.checkPermission(updatePatientFile.name, this.userId, {
            patientFileId,
            practiceId: patientFile.practiceId
        });
    },
    onAfterUpload(file) {
        const s3Params = { Bucket: Meteor.settings.AWSS3Bucket };
        const { patientFileId, tags } = file.meta;
        const name = `${file.name.replace('.' + file.extension, '')}-${file._id}.${file.extension}`;
        const filename = `documents/patientfiles/${patientFileId}/${name}`;

        Documents.update(file._id, { $set: { createdAt: new Date() } });
        PatientFiles.update(patientFileId, { $addToSet: { "files.tags": { $each: tags || [] } } });

        uploadToS3(this, file, s3Params, filename);
    }
};
```

`documentsConfig.js:13-57`.

So:

- Permission gate at upload — `patientFile.update` permission (the literal Meteor method name `patientFile.update`, used as a permission key) on the dossier, plus an active subscription on the practice. Reject silently otherwise.
- Permission gate at download — `PatientFilesUtil.canUserViewPatientFile(userId, file.meta.patientFileId)`.
- S3 key layout: `documents/patientfiles/<patientFileId>/<filename-without-ext>-<documentId>.<ext>`. So every patient gets their own "folder" in the bucket, and filenames embed the mongo `_id` to avoid collisions.
- The bucket is configured via `Meteor.settings.AWSS3Bucket`.
- After successful S3 upload (`uploadToS3` in `app/imports/lib/upload/aws/s3helpers.js:7-56`), the original file on the Meteor server's local filesystem is unlinked (`s3helpers.js:50-51`). The mongo row is updated with `versions.original.meta.awsS3Key` and `versions.original.meta.pipePath`.
- Downloads are streamed back through Meteor — they are not direct S3 URLs. The `interceptDownload` hook (`s3helpers.js:58-128`) issues an `s3Client.getObject` and pipes the response into the HTTP response. This means **the patient's documents are never accessible via a presigned S3 URL** — the user must be authenticated to Meteor and pass the `canUserViewPatientFile` check.

> ⚠️ Behaviour inferred from code; needs product validation. The download permission check accepts a `userId` from the URL query string (`documentsConfig.js:18-19`) — `this.userId || this.request.query.userId`. This is a `TODO` in the source code and is a potentially weak link if the URL leaks (the comment at `documentsConfig.js:17` says `TODO do not pass userId in URL, but use signed s3 url for downloading?`).

### Local fallback

If `Meteor.settings.storage.documents` is set, `documentsConfig.storagePath` falls back to a local filesystem path (`documentsConfig.js:59-61`). In production this should be unset and S3 should be the source of truth.

## Data model

Collection: `documents` (Mongo collection name) · `Documents` (export). Built from `FileCollectionBase`, which wraps `meteor/ostrio:files`.

`app/imports/api/patientFiles/Documents.js:8-31`:

```js
config = {
    allowClientCode: false,
    collectionName: 'documents',
    downloadRoute: '/files',
    onbeforeunloadMessage: () => translate('upload.cancelInProgress'),
    schema: {
        ...schema,                                                          // base schema
        meta: Object,
        'meta.data': {type: Object, blackbox: true, optional: true},
        'meta.patientFileId': {type: String, regEx: SimpleSchema.RegEx.Id},
        'meta.tags': {type: Array, optional: true},
        'meta.tags.$': String,
        'meta.treatmentId': {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    }
};
```

Plus the base schema from `app/imports/lib/upload/FileCollectionBase.js:79-93`:

| Field | Type | Meaning |
|---|---|---|
| `name` | String | Filename. |
| `size` | Number | Bytes. |
| `type` | String | MIME type. |
| `path` | String | Local FS path before S3 upload. |
| `extension` | String | File extension. |
| `isImage` / `isPDF` / `isAudio` / `isVideo` / `isText` / `isJSON` | Boolean | Inferred from MIME at upload time. Drives the filter chips and the viewer logic. |
| `_storagePath` / `_downloadRoute` / `_collectionName` | String | Internal `meteor/ostrio:files` plumbing. |
| `meta` | Object (blackbox) | See below. |
| `meta.patientFileId` | String (Id) | Owning dossier. |
| `meta.tags` | [String] | Tags. |
| `meta.treatmentId` | String (Id) | Optional link to a treatment. |
| `meta.data` | Object (blackbox) | Free-form blob — used by the demand-form generator to record `{ fillInfo, startDate, type }` for traceability (`patientFiles/server/util.js:82-87`). |
| `userId` | String | Uploader. |
| `versions` | Object (blackbox) | `versions.original.meta.awsS3Key`, `versions.original.meta.pipePath`. |
| `createdAt` | Date | Stamped in `onAfterUpload` (`documentsConfig.js:52`). |
| `updatedAt` | Date | (`FileCollectionBase.js:69-72`). |
| `removed` / `removedAt` | Boolean / Date | Soft-delete flags. |

The download URL is `/files/<id>?userId=<userId>` (the `downloadRoute` is `/files`, embedding the userId as a query string for download access).

## Methods

Patient documents have only two custom Meteor methods (the rest of the lifecycle goes through `meteor/ostrio:files`'s built-in upload protocol):

### `patientFile.documents.edit`

`app/imports/api/patientFiles/methods.jsx:719-769`.

- Inputs: `{ name, patientFileId, documentId, tags?, treatmentId? }`.
- Permission: `patientFile.reports.edit`.
- Run: updates `name`, `meta.tags` (sorted), `meta.treatmentId`. Recomputes `files.tags`.

### `patientFile.documents.delete`

`methods.jsx:771-802`.

- Inputs: `{ documentId }`.
- Permission: `patientFile.reports.delete`.
- Run: `Documents.remove(documentId)` — soft-deletes the row. **The S3 object is not deleted.** Recomputes `files.tags`.

> ⚠️ Behaviour inferred from code; needs product validation. The S3 object lifecycle is independent of the mongo soft-delete flag. There is no S3 lifecycle policy in the code, and no scheduled job to clean up orphaned objects. Soft-deleting a document leaves the binary in S3 indefinitely.

## Publications

`app/imports/api/patientFiles/server/publications.jsx`:

- **`documentsOfPatientFile(patientId)`** — all documents for a dossier (cursor-only, file collection style). `publications.jsx:195-201`
- **`patientFileDocument(documentId)`** — single document. `publications.jsx:203-216`

## User-visible behaviour

### Upload

Two paths, both end up calling `Documents.insert({ file, meta: { patientFileId, tags } })`:

1. **Drag-and-drop** — drop a file or files anywhere on the Documenten tab. The page renders a per-file circular progress indicator in the bottom-right corner (`PatientFileReportsOverviewPage.jsx:262-273`).
2. **Modal** — open the "+" modal, switch to the "Uploaden" tab, pick files via the OS file dialog, optionally select existing tags or create new ones, click upload.

Each `Documents.insert` triggers:

- `onbeforeunloadMessage` — if the user tries to close the tab mid-upload, browser shows a "you have an in-progress upload" warning.
- `onBeforeUpload` server-side check — subscription must be active and caller must have `patientFile.update` on the dossier.
- Stream upload to the Meteor server's local filesystem.
- `onAfterUpload` — sets `createdAt`, unions tags into `files.tags`, then `uploadToS3` to push to S3 and update `versions.original.meta`. After S3 upload succeeds, the local file is unlinked.

### View

Routes (`app/imports/startup/client/routes/patientFile.js`):

- `/patients/:patientId/documents/:documentId` — top-level view.
- `/patients/:patientId/treatments/documents/:documentId` — same component, treatments breadcrumb.

The viewer (`PatientFileDocumentPage.jsx`) chooses based on the file flags:

- `isImage` → inline `<img src={document.link()}>`.
- `isPDF` → inline `<iframe src={document.link()}>`.
- everything else → Google Docs Viewer iframe (`https://docs.google.com/gview?url=<link>?userId=<userId>&embedded=true`).

The Google Docs Viewer fallback **leaks the file URL to Google's servers** as a query parameter. For sensitive Belgian patient data this is worth flagging.

> ⚠️ Behaviour inferred from code; needs product validation. The Google Docs Viewer integration sends the document URL (with userId in query) to Google for rendering. This is the only way the app handles non-PDF, non-image office documents (Word, Excel, etc.).

The viewer also offers a name editor (debounced 500 ms auto-save via `editFile`), a tag select (only shown when `meta.treatmentId` is unset, mirroring the report editor pattern), a download button, and a delete button.

### Search and filter

The "Documenten" overview combines documents with reports into a single search. Filter chips:

- `audio` → `{ isAudio: true }` (`PatientFileReportsOverviewPage.jsx:140`)
- `doc` → `{ $or: [{ isText: true }, { isPDF: true }, { report: { $exists: true } }] }` — text/PDF documents and any `patientFileReports` row (which has a `report` HTML field) (`:141-143`)
- `pic` → `{ isImage: true }` (`:144`)

Tag filter via `TagSelect` driven from `patientFile.files.tags` (the dossier-level cached union). Selected tags are passed to the search index via `searchProps.tags`.

Sort options via dropdown:

- `name.ascending`, `name.descending`, `date.ascending`, `date.descending` (`PatientFileReportsOverviewPage.jsx:157-162`).

The custom transform sorts items by how many tags match the selected tag filter, descending (`:163-168`).

## Permissions

- **View / download** — `patientFile.view` resolved via `PatientFilesUtil.canUserViewPatientFile`.
- **Upload** — `patientFile.update` (the Meteor method name used as a permission key, see `documentsConfig.js:39`) plus active subscription on the practice.
- **Edit metadata** (rename, retag) — `patientFile.reports.edit`.
- **Delete** — `patientFile.reports.delete`.

In the role tables:

- Practice owner / admin have `patientFile.update`, `patientFile.reports.edit`, `patientFile.reports.delete`.
- Per-file `admin` and `default` have `patientFile.update`, `patientFile.reports.edit`, `patientFile.reports.delete` — both grant the full set.
- Per-file `owner` (creator-by-metaData) has only `patientFile.view`, so the creator can read but not upload / edit / delete.

## Notable details

- **Storage is S3, not local FS.** Production setups should always have `Meteor.settings.AWSS3Bucket` set; the local fallback is for development.
- **Downloads are not presigned.** Files stream through Meteor; the auth gate is the Meteor method-style permission check, not an S3 URL signature.
- **Soft delete leaves binaries on S3.** There is no S3 cleanup hook in the code. Deleting a patient with `removePatientFile` cascades a soft-delete on the `Documents` rows but does **not** delete the S3 objects (`api/practice/server/util.tsx:205`). See `../gaps/03_patient_data_privacy.md`.
- **The userId leaks into download URLs.** A self-referenced `TODO` in the code acknowledges this (`documentsConfig.js:17`): "TODO do not pass userId in URL, but use signed s3 url for downloading". The userId-in-query-string allows out-of-session downloads if the URL is shared.
- **Non-PDF / non-image office docs are rendered through Google Docs Viewer.** The file URL (with userId) is sent to Google. There is no on-prem renderer fallback.
- **Filename embeds the mongo id.** The S3 key is `documents/patientfiles/<patientFileId>/<originalNameNoExt>-<documentId>.<ext>`. This avoids collisions when a user uploads two files with the same name.
- **`files.tags` is recomputed from scratch** on every edit/delete, not incremented. Fast for small dossiers, potentially slow on dossiers with many documents and reports.
- **Demand forms are stored as ordinary documents.** A demand form generated from `addPatientFileDemandForm` lands in the same `documents` collection as a manual upload, with `meta.data = { fillInfo, startDate, type }` recording the generator parameters and `meta.treatmentId` linking back to the originating treatment.
- **No virus scanning.** No hook in the upload pipeline scans incoming binaries.
- **No file size limit visible.** `meteor/ostrio:files` enforces its own defaults; the project does not override them in `documentsConfig.js`.

## Helpdesk overlap

`full_documentation/general_getting_started.md` covers the upload + tag + filter + search workflow. Gaps:

- S3 backend, key layout, bucket name source.
- The fact that downloads stream through Meteor with the userId in the query string.
- The Google Docs Viewer fallback for office docs.
- The fact that soft-deleted documents stay in S3.
- Permission distinctions (`patientFile.update` for upload vs `patientFile.reports.edit` for rename).
- The non-presigned URL design.

## Source files

### Data
- `app/imports/api/patientFiles/Documents.js` — collection definition + per-doc schema overlay.
- `app/imports/lib/upload/FileCollectionBase.js` — base schema and class.

### Server
- `app/imports/api/patientFiles/server/documentsConfig.js` — upload/download permission hooks, S3 key layout.
- `app/imports/lib/upload/aws/s3helpers.js` — `uploadToS3`, `downloadFromS3` (intercept hook).
- `app/imports/lib/upload/aws/s3Client.js` — S3 client construction.
- `app/imports/lib/upload/server/FileCollectionBaseServer.js` — server-side base class.
- `app/imports/api/server/collectionServer.js` — soft-delete base.

### Methods
- `app/imports/api/patientFiles/methods.jsx:719-802` — `editFile`, `deleteFile`.
- `app/imports/api/patientFiles/server/publications.jsx:195-216` — `documentsOfPatientFile`, `patientFileDocument`.

### UI
- `app/imports/modules/patientfiles/reports/PatientFileReportsOverviewPage.jsx` — combined search/list + drag-and-drop drop zone.
- `app/imports/modules/patientfiles/reports/PatientFileDocumentPage.jsx` — viewer (image / PDF / Google Docs Viewer fallback).
- `app/imports/modules/patientfiles/reports/PatientFileDocumentContainer.js` — data wiring.
- `app/imports/modules/patientfiles/reports/AddReportPopup.jsx` — upload sub-tab.
- `app/imports/modules/patientfiles/reports/ReportListView.jsx` — single-card render of either a report or a document.
- `app/imports/lib/search-indexes/patientFilesDocuments.js` — search index for documents.
