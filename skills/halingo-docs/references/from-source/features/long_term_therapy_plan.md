# Long-term therapy plan

> **🧹 Cleanup note (2026-04-07):** the `LongTherapyPlan.therapistId` schema field is unused. Q18 of [`../open_questions.md`](../open_questions.md): "That is not used atm". Schema field exists, methods accept it, the UI form control is committed-out. See [`../deprecation_list.md` #9](../deprecation_list.md). Q33 confirmed the 11 therapy goal categories are current as documented.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — `full_documentation/general_getting_started.md` mentions long-term and short-term goals at a high level but does not document categories, priorities, the parent/child sub-goal structure, or the swim-lane drag-and-drop state machine.

## What it is

A per-dossier kanban-style therapy plan made of hierarchical goals ("doelstellingen"). Each goal has a free-text `goal` summary, optional `description`, a clinical `category` (e.g. articulatie, stem, taal), a `priority` (high / medium / low), and a `status` (todo / inProgress / done). Goals can be nested one level deep via `parentId`; the UI renders parents and children as collapsible tree nodes inside three status-keyed swim lanes. The dashboard's "Therapieplan" tab drives the whole thing.

This collection is part of the `patientFiles` API module but lives in its own mongo collection `longTherapy`.

## Where it lives in the UI

- **Route** — `/patients/:patientId` tab index 4 (index 3 if the user's profession is `OTHER`, which hides both the treatments and therapy tabs). `PatientFileTabs.jsx:120-133`.
- **Overview container** — `PatientFileTherapyOverviewContainer.jsx` / `PatientFileTherapyOverviewPage.jsx` in `app/imports/modules/patientfiles/therapy/`.
- **Long-term panel** — `TherapyPanelLong.jsx` in `app/imports/modules/patientfiles/therapy/long-therapy/`. Renders a three-column grid (one per status) with drag-and-drop between columns via `SwimLane` + `Card`.
- **Goal editor modal** — `TherapyModal.jsx`. Form fields: `goal` (required), `category` (required), `priority` (required), `description` (optional). `therapistId` is declared on the schema but the UI form field is commented out (`TherapyModal.jsx:191-195`).
- **Sub-goal add** — clicking the "+" button inside a parent `Card` calls `add(parentId)`, which opens the modal with the parent's id prefilled (`TherapyPanelLong.jsx:136-141, 158-160`).

Alongside the long-term panel, a **short-term** plan lives under the same tab (`therapy/short-therapy/TherapyPanelShort.jsx`) — but short-term goals are stored *on the treatment* (`Treatments.shortTherapy`), not in their own collection, and are out of scope for this document.

## Data model

Collection: `longTherapy` · `app/imports/api/patientFiles/longTherapyPlan.jsx:4`. Client writes denied (`longTherapyPlan.jsx:6-10`).

```js
LongTherapyPlan.goals = [
  "afasie",
  "articulatie",
  "communication",
  "dysfagie",
  "hearing",
  "leerstoornis",
  "myofunction",
  "schisis",
  "stem",
  "stutter",
  "taal",
];

LongTherapyPlan.STATES = {
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  DONE: "done",
};

LongTherapyPlan.PRIORITIES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};
```

`longTherapyPlan.jsx:13-50`

### Categories (exact values from code)

Quoted verbatim from `longTherapyPlan.jsx:13-25`. These are the only allowed values for `category`:

- `afasie` — aphasia
- `articulatie` — articulation
- `communication` — communication
- `dysfagie` — dysphagia (swallowing disorder)
- `hearing` — hearing
- `leerstoornis` — learning disorder
- `myofunction` — myofunctional therapy
- `schisis` — cleft palate
- `stem` — voice
- `stutter` — stuttering
- `taal` — language

Each category has an icon mapping at `longTherapyPlan.jsx:26-38`:

```
afasie       → "communication-skill"
articulatie  → "comment"
communication→ "tablet"
dysfagie     → "water-bottle"
hearing      → "ear"
leerstoornis → "book"
myofunction  → "denture"
schisis      → "saliva-test"
stem         → "microphone"
stutter      → "talking"
taal         → "translate"
```

Categories map to i18n keys `goalTypes.<category>` (`TherapyModal.jsx:152-154`).

### Schema

`longTherapyPlan.jsx:52-72`:

| Field | Type | Required | Meaning |
|---|---|---|---|
| `patientFileId` | `String` (Id) | yes | Owning dossier. `longTherapyPlan.jsx:58` |
| `category` | `String` | yes | One of the 11 clinical categories above. `longTherapyPlan.jsx:53` |
| `goal` | `String` | yes | Goal summary / title (the primary user-visible text on the card). `longTherapyPlan.jsx:56` |
| `description` | `String` | no | Long-form description. `longTherapyPlan.jsx:55` |
| `priority` | `String` | default `high` | `high / medium / low`. `longTherapyPlan.jsx:59-63` |
| `status` | `String` | default `todo` | `todo / inProgress / done`. `longTherapyPlan.jsx:66-70` |
| `parentId` | `String` (Id) | no | Id of another `longTherapy` row in the same dossier. Used to nest sub-goals. `longTherapyPlan.jsx:57` |
| `therapistId` | `String` (Id) | no | Assigned therapist. Not used in the UI (form field commented out). `longTherapyPlan.jsx:71` |
| `createdAt` | `Date` | (auto) | `longTherapyPlan.jsx:54`, stamped by base Collection. |
| `removed` / `removedAt` | Boolean / Date | no | Soft-delete flags. `longTherapyPlan.jsx:64-65` |

`LongTherapyPlan.publicFields = { removed: 0, removedAt: 0 }` (everything else is published, `longTherapyPlan.jsx:74-77`).

### Hierarchy rules

- Only **one level deep** is supported by the UI. The swim-lane renderer treats goals with `children` as tree branches but only recurses one level (`TherapyPanelLong.jsx:166-183`).
- A goal's `parentId` is set at insert time and **is not editable** — there is no UI to re-parent or promote a sub-goal, and no `editLongTherapy` accepts a new `parentId` without it being frozen (the method allows the field on the schema, `methods.jsx:856-860`, but the UI does not pass it).
- When a parent has children with a different status than itself, the renderer injects a synthetic "header" row with `label` = parent's `goal` and `parentId` = parent's `parentId` into the child's lane (`TherapyPanelLong.jsx:210-234`). This produces the visual "ghost parent in the other column" effect when a parent and its children are in different status lanes.

## Methods

All in `app/imports/api/patientFiles/methods.jsx`.

### `patientFile.therapies.long.add`

`methods.jsx:807-846`.

- Inputs: `{ category, description?, goal, parentId?, patientFileId, priority, therapistId? }`.
- Permission: `patientFile.therapies.long.add`.
- `subscription: true`.
- Run: `LongTherapyPlan.insert(therapyPlan)` — nothing else. No side effects, no cascade, no Rosa.

### `patientFile.therapies.long.edit`

`methods.jsx:848-898`.

- Inputs: `{ _id, category, createdAt, description?, goal, parentId?, patientFileId, priority, status, therapistId? }`.
- Permission: `patientFile.therapies.long.edit`.
- Run: omits `_id`, `createdAt`, `patientFileId` from the update, `$set`s the rest. So the editable fields are `category`, `description`, `goal`, `parentId`, `priority`, `status`, `therapistId` (`methods.jsx:890-896`).
- This method is used both for form-based edit (from the modal) and for drag-and-drop status changes. The SwimLane's `onDrop` callback passes `{ ...therapy, status }` to `editLongTherapy` (`TherapyPanelLong.jsx:286-295`).

### `patientFile.therapies.long.delete`

`methods.jsx:900-922`.

- Inputs: `{ therapyId }`.
- Permission: `patientFile.therapies.long.delete`.
- Run: `LongTherapyPlan.remove(therapyId)` — soft-delete. Children of a deleted parent are **not** cascaded — they are left dangling with a `parentId` pointing at the removed row. Because `find()` filters out removed rows, the children will still render but their `parentId` will no longer resolve, so they will be laid out at the root level of their status column by `TherapyPanelLong.attachToParent` (`TherapyPanelLong.jsx:210-234`).

> ⚠️ Behaviour inferred from code; needs product validation. Dangling children are probably not the intended behaviour — a cascade delete of children when the parent is removed would make more sense.

## Publications

`Meteor.publish('patientFileLongTherapyPlan', patientFileId)` in `app/imports/api/patientFiles/server/publications.jsx:222-231`:

```js
if (!PatientFilesUtil.canUserViewPatientFile(this.userId, patientFileId)) {
  this.ready();
}

return [
  LongTherapyPlan.find({ patientFileId }),
  PatientFileUsers.find({ userId: this.userId, patientFileId })
];
```

Publishes the full goal set for the dossier plus the caller's own `PatientFileUsers` row so the client can cheaply check permissions.

## User-visible behaviour

- **Three columns, left to right: Te behandelen / In behandeling / Doel behaald** (i18n keys `patient.therapy.longTerm.todo / .inProgress / .done`, `client/nl.i18n.js:557, 553, 552`). Each column width is `12 / states.length` ≈ 4 columns, so on large screens the three lanes sit side by side.
- **Drag a card to another column** → `editLongTherapy` is called with the new `status`. Drag is disabled when the practice has no active subscription (`TherapyPanelLong.jsx:285-296`).
- **Priority colour codes**: high = red, medium = orange, low = green (`TherapyModal.jsx:28-32`).
- **Cards are sorted by priority within each lane**: high at top, medium, low at bottom (`TherapyPanelLong.jsx:198-204, 214`).
- **Parent cards are collapsible.** Clicking the chevron expands/collapses the children panel (`TherapyPanelLong.jsx:60-112`). A parent whose `status === done` collapses by default (`TherapyPanelLong.jsx:174`).
- **Adding a top-level goal** is the "+" button in the header of the "todo" column only (`TherapyPanelLong.jsx:267-282`). To add a sub-goal you click "+" on a parent card (`TherapyPanelLong.jsx:136-141`).
- **Editing a goal** — clicking a card opens the same modal with all fields pre-filled; the modal's title becomes the current `goal` text (`TherapyModal.jsx:128-138`).
- **Deleting a goal** — inside the edit modal, a red "REMOVE" button triggers `confirmDelete()` and then `deleteLongTherapy` (`TherapyModal.jsx:100-116, 205-212`).
- **Completed goals are struck through** via CSS `text-decoration: line-through` on the `done` lane cards (`TherapyPanelLong.jsx:34-38`).

## Permissions

All permission checks are at the dossier level. In the practice-level role model (`api/practiceUsers/practiceUsers.jsx`):

- `patientFile.therapies.long.add` — owner (52), admin (117). Not in `default`.
- `patientFile.therapies.long.edit` — owner (54), admin (119). Not in `default`.
- `patientFile.therapies.long.delete` — owner (53), admin (118). Not in `default`.

In the per-file role model (`api/patientFileUsers/patientFileUsers.jsx`):

- All three are in both `admin` (17-19) and `default` (40-42).
- **None** are in per-file `owner` (the virtual creator-only role) — so the creator-by-metaData path only earns view access, not therapy-plan mutation.

So a lid (`default` practice role) can add/edit/delete long-term therapy only on dossiers where they have an explicit `PatientFileUsers` row — which is automatic for dossiers they created (see `patient_file_access_control.md`).

## Notable details

- **`therapistId` is dead code in the UI.** The schema field exists, the methods accept it, and the UI form control is written but explicitly commented out (`TherapyModal.jsx:191-195`). So goals in the current product cannot be assigned to a specific therapist, even in multi-therapist practices.
- **Icons are UI-only.** Storing category icons as a client-side constant map (`longTherapyPlan.jsx:26-38`) rather than on the row means a new category would need a code change to get an icon.
- **No "completed" timestamp.** Goals track only the current `status`, not when they moved to `done`. Historical progress reporting on a patient's journey is not supported out of the box.
- **No audit trail on goal changes.** Drag-and-drop to `done` is a simple `editLongTherapy` call; no log of who moved it or when. `createdAt` is the only temporal field.
- **`parentId` is never validated to point at a same-dossier goal.** The `SimpleSchema` check is only `regEx: SimpleSchema.RegEx.Id` (`longTherapyPlan.jsx:57`). Cross-dossier nesting is mechanically possible if a caller supplies a foreign id; the UI never does this.
- **Category list is hardcoded.** `LongTherapyPlan.goals` is a frozen list of 11 values; adding one requires a code change and an i18n entry under `goalTypes.<key>`.
- **The category labels are in i18n** under `goalTypes.*`. Not quoted here — the code uses the category key internally.
- **Short-term therapy lives elsewhere.** It's on `Treatments.shortTherapy`, managed by `editShortTherapy` (see `api/treatments/methods.js`). The corresponding permissions `patientFile.therapies.short.edit / .delete` exist in the role lists but apply to short-term goals on treatments.

## Helpdesk overlap

`full_documentation/general_getting_started.md` contains an article about the therapy plan ("Je therapieplan") that describes the high-level concept of long-term vs short-term goals and mentions "categories", "priority" and "status" in passing. It does not enumerate the 11 categories, does not document the drag-and-drop interaction, and does not mention sub-goal nesting via `parentId`.

## Source files

### Data
- `app/imports/api/patientFiles/longTherapyPlan.jsx` — collection, categories, states, priorities, schema, icons.

### Methods & publications
- `app/imports/api/patientFiles/methods.jsx:807-922` — `addLongTherapy`, `editLongTherapy`, `deleteLongTherapy`.
- `app/imports/api/patientFiles/server/publications.jsx:222-231` — `patientFileLongTherapyPlan` publication.

### UI
- `app/imports/modules/patientfiles/therapy/long-therapy/TherapyPanelLong.jsx` — kanban renderer.
- `app/imports/modules/patientfiles/therapy/long-therapy/TherapyModal.jsx` — add / edit / delete modal.
- `app/imports/modules/patientfiles/therapy/long-therapy/Card.jsx` — individual goal card.
- `app/imports/modules/patientfiles/therapy/long-therapy/SwimLane.jsx` — drop-target column.
- `app/imports/modules/patientfiles/therapy/long-therapy/CanDropOverlay.jsx` — drag feedback.
- `app/imports/modules/patientfiles/therapy/PatientFileTherapyOverviewPage.jsx` — wrapping page.
- `app/imports/modules/patientfiles/therapy/PatientFileTherapyOverviewContainer.jsx` — data wiring.

### Permissions
- `app/imports/api/practiceUsers/practiceUsers.jsx:52-56, 117-121` — practice-level grants.
- `app/imports/api/patientFileUsers/patientFileUsers.jsx:17-19, 40-42` — per-file grants.
