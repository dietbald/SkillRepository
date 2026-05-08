# Collections

Reference for every MongoDB collection defined in `app/imports/api/`. Sorted alphabetically by the JavaScript symbol used in source.

All collections in this application extend the custom base class `app/imports/api/collection.js:12`, which in turn extends `CollectionBaseServer` at `app/imports/api/server/collectionServer.js:18`. That base class implements two cross-cutting behaviours every collection inherits:

- **Automatic `createdAt`.** `insert()` sets `createdAt = new Date()` if not provided; `upsert()` sets `$setOnInsert.createdAt = new Date()` (`app/imports/api/collection.js:13-21`).
- **Soft delete.** `remove()` is rewritten to `update({$set: {removed: true, removedAt: new Date()}}, {multi: true})` and `find()` / `findOne()` inject `removed: {$ne: true}` into every query. Escape hatches `findUnsafe()`, `findOneUnsafe()`, `removeUnsafe()`, and `updateUnsafe()` bypass this (`app/imports/api/server/collectionServer.js:18-61`).

Every collection also installs client-side deny rules of the form `insert/update/remove: () => true`, forcing all writes through Meteor methods.

---

## AgendaSettings

- **File:** `app/imports/api/agendaSettings/agendaSettings.jsx:4`
- **MongoDB collection name:** `agendaSettings`
- **Purpose:** per-user calendar view preferences (one document per user).

**Schema** (`app/imports/api/agendaSettings/agendaSettings.jsx:12-28`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | String (Id) | yes | owner |
| `useStartEnd` | Boolean | no | default `false` |
| `fadeEventsBefore` | Boolean | no | default `false` |
| `exportAgenda` | Boolean | no | default `false`; gates the iCal REST endpoint |
| `startHour` | Date | no | lower bound of displayed hour range |
| `endHour` | Date | no | upper bound of displayed hour range |
| `opensAt` | String | no | allowed `start` / `current_time` / `custom`; default `start` |
| `openHour` | Date | no | custom open hour when `opensAt = 'custom'` |
| `customRangeDays` | Number | no | default `3`; week-view day count |
| `colorAppointment` | String | no | hex code for appointment events |
| `colorMeeting` | String | no | hex code for meeting events |
| `colorPrivate` | String | no | hex code for private events |
| `colorConsultation` | String | no | hex code for consultation events |
| `removed` | Boolean | no | soft-delete flag |
| `createdAt` | Date | yes |  |

**Public fields** (`agendaSettings.jsx:32-39`): `useStartEnd`, `startHour`, `endHour`, `opensAt`, `openHour`, `customRangeDays`.

**Indexes:** none.
**Hooks:** none.

---

## ClientErrors

- **File:** `app/imports/api/clientErrors/clientErrors.jsx:4`
- **MongoDB collection name:** `clientErrors`
- **Purpose:** server-side aggregation of client-side JavaScript exceptions, attributed to the caller's `userId`.

**Schema** (`app/imports/api/clientErrors/clientErrors.jsx:12-18`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `error` | Object (blackbox) | yes | serialized error payload |
| `name` | String | yes |  |
| `params` | Object (blackbox) | yes | method/page params at time of error |
| `userId` | String (Id) | yes |  |

**Indexes:** none.
**Hooks:** none.

---

## CommissionInvoices

- **File:** `app/imports/api/invoices/commissionInvoices/commission.jsx:8`
- **MongoDB collection name:** `commissionInvoices`
- **Purpose:** per-therapist commission statements owed to / paid by the practice.

**Enum constants** (`commission.jsx:9-18`):

```
CommissionStates = { OPEN: 'open', PAID: 'paid' }
CommissionTypes  = { NONE: 'none', FIXED_AMOUNT: 'fixedAmount', PERCENTAGE: 'percentage' }
```

**Embedded schema `CommissionSchema`** (`commission.jsx:20-33`) — used both by this collection and by `PracticeUsers.commission`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | String | yes | `none` / `fixedAmount` / `percentage`, default `none` |
| `amount` | Number | no | fixed-amount case |
| `modifiedAt` | Date | no |  |
| `percentage` | Number | no | percentage case |
| `specificAmounts` | Array | no | per-disorder overrides |
| `specificAmounts.$.id` | String | yes | disorder key (`a`, `b.1`, `c.2`, …) |
| `specificAmounts.$.amount` | String | yes |  |

**Top-level schema** (`commission.jsx:41-71`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_cachedAmount` | Number | no | computed by hooks |
| `amount` | Number | no | frozen amount at paid time |
| `commission` | `CommissionSchema` | yes | snapshot of rate at invoice date |
| `createdAt` | Date | yes |  |
| `data` | Array of blackbox objects | yes | line items |
| `date` | Date | yes | month/year the commission covers |
| `practiceId` | String | no |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `status` | String | yes | `open` / `paid` |
| `userId` | String | yes | therapist receiving commission |
| `userName` | String | yes | denormalised |
| `userImage` | String | yes | denormalised |

**Filters** (`commission.jsx:79-82`): `paid` / `open` by `status`.
**Sort options** (`commission.jsx:83-88`): `date_asc` / `date_desc` / `name_asc` / `name_desc`.

**Indexes** (`app/imports/api/invoices/commissionInvoices/server/indexes.js:5-8`):

- `{ userId: 1 }`
- `{ practiceId: 1 }`

**Hooks** (`app/imports/api/invoices/commissionInvoices/server/hooks.js`):

- `before.insert` (`hooks.js:10`): pre-computes `_cachedAmount` via `CommissionInvoicesUtil.computeAmount`.
- `after.update` (`hooks.js:16`): debounces (500 ms) a re-compute of `_cachedAmount` when the document changes.

Note that `CommissionInvoices` does **not** have deny rules (contrast every other collection) — writes still pass through methods, but the deny gate is missing in `commission.jsx:35-39` (hooks run regardless).

---

## Documents

- **File:** `app/imports/api/patientFiles/Documents.js:31` (via `FilesCollection` from `app/imports/lib/upload/FileCollectionBase`)
- **MongoDB collection name:** `documents`
- **Purpose:** patient file document attachments (PDF, images, scans). Uses the `meteor-files` package, stored on S3 via `server/documentsConfig`.

**Schema** (`Documents.js:8-22`) — extends the base `FileCollectionBase` schema with:

| Field | Type | Required | Notes |
|---|---|---|---|
| `meta` | Object | yes |  |
| `meta.data` | Object (blackbox) | no |  |
| `meta.patientFileId` | String (Id) | yes |  |
| `meta.tags` | Array of String | no |  |
| `meta.treatmentId` | String (Id) | no |  |

**Indexes** (`app/imports/api/patientFiles/server/indexes.js:7`): `{ 'meta.patientFileId': 1 }`.
**Hooks:** none.

---

## Emails

- **File:** `app/imports/api/emails/emails.ts:6`
- **MongoDB collection name:** `emails`
- **Purpose:** audit log of outbound emails, keyed by messageId for bounce / delivery tracking.

**TypeScript types** (`emails.ts:20-22`):

```ts
export type EmailEntityType = "PATIENT" | "USER";
export type EmailType = "PATIENT_SEND_INVOICE";
export type EmailStatus = "SENT" | "DELIVERED" | "BOUNCED" | "FAILED" | 'OPENED' | "UNKNOWN";
```

Note the `EmailStatus` type union in the source includes `DELIVERED` and `OPENED`, but the SimpleSchema `allowedValues` on the `status` field does not (`emails.ts:30-33`); the schema validator will reject any document with those two statuses even though the type system permits them. Also note `EmailType` in the type union (`PATIENT_SEND_INVOICE`) does not match the schema's allowed values (`PATIENT_INVOICE` / `PATIENT_INVOICE_REMINDER`) — a drift between types and schema.

**Schema** (`emails.ts:24-36`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `messageId` | String | yes |  |
| `entityId` | String | yes | `patientFileId` when `entityType = PATIENT` |
| `entityType` | String | yes | `PATIENT` / `USER` |
| `email` | String | yes | recipient address |
| `type` | String | yes | `PATIENT_INVOICE` / `PATIENT_INVOICE_REMINDER` |
| `status` | String | yes | see type note above |
| `sentAt` | Date | yes |  |
| `invoiceId` | String | no |  |

**Indexes:** none.
**Hooks:** none.

---

## Events

- **File:** `app/imports/api/events/events.jsx:14` (extends a custom subclass `EventsCollection`, `events.jsx:8-12`)
- **MongoDB collection name:** `events`
- **Purpose:** calendar events — appointments, meetings, private appointments, telehealth consultations.

`EventsCollection.remove` overrides the default to always append `invoiceId: { $exists: false }` to the selector, so invoiced events cannot be deleted via `Events.remove` (`events.jsx:9-11`).

**Enum constants**:

```js
Events.types = {
  1: { value: 1, text: "APPOINTMENT" },
  2: { value: 2, text: "MEETING" },
  3: { value: 3, text: "PRIVATE" },
  4: { value: 4, text: "CONSULTATION" },
}  // events.jsx:30-47

Events.states = {
  OK:     { value: 1, text: "OK" },
  ABSENT: { value: 2, text: "ABSENT" },
}  // events.jsx:206-215
```

Appointment types (`events.jsx:49-119`, via `Events.getAppointmentTypes()`):

| Value | Text | Counts towards total | Bilan type | Max per treatment |
|---|---|---|---|---|
| 1 | `SESSION` | yes | — | — |
| 2 | `INITIAL_BILAN` | yes | `initial` | 5 |
| 3 | `EVOLUTION_BILAN` | no | `evolution` | 1 |
| 4 | `PARENT_SITTING` | yes | — | 10 |
| 5 | `BILAN_RELAPSE` | yes | `relapse` | 2 |
| 6 | `EVALUATION_SESSION` | no | — | — |

Appointment sub-types (`events.jsx:178-204`): `30`, `60`, `GROUP`, `INDEFINITE`, `INDIVIDUAL`.

Locations (`events.jsx:137-176`):

| Value | Text | Icon |
|---|---|---|
| 1 | `OFFICE` | briefcase |
| 2 | `HOME` | home |
| 3 | `SCHOOL` | graduation-cap |
| 4 | `REVALIDATION` | medkit |
| 5 | `HOSPITALISATION` | hospital |
| 6 | `VIDEO_CONSULTATION` | video_chat |

`Events.getPrices(event)` contains date-bracketed RIZIV fee tables from 2018 onward (`events.jsx:244-1181`) — this is where reimbursement amounts per session type / location are hard-coded.

**Schema** (`events.jsx:1196-1349`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | String | conditional | required unless `type` is 1 or 4 |
| `start` | Date | yes |  |
| `end` | Date | yes | custom validator: must be > start |
| `type` | Number | yes | 1 / 2 / 3 / 4 |
| `meta` | Object (blackbox) | yes | default `{}` |
| `meta.type` | Number | conditional | appointment type when `type=1` and `treatmentId` set |
| `meta.subType` | Number | conditional | sub-type, same condition |
| `meta.location` | Number | conditional | location, same condition |
| `state` | Number | no | default `1` (OK) |
| `commissionInvoiceId` | String (Id) | no |  |
| `invoiceId` | String (Id) | no | set when event is billed |
| `userId` | String (Id) | yes |  |
| `patientFileId` | String (Id) | conditional | required for type 1 / 4 |
| `practiceId` | String (Id) | conditional | required for type 1 / 4 |
| `therapyPlan` | String | no | short-term plan note |
| `description` | String | no |  |
| `treatmentId` | String (Id) | no |  |
| `repeatId` | String | no | groups recurring events |
| `groupId` | String | no | groups multi-patient events |
| `repeat` | `repeatDateSchema` | no | recurrence rule |
| `hasPayBack` | Boolean | no | default `false`; counts toward bracket |
| `sessionCount` | Number | no |  |
| `price` | Number | no |  |
| `kmCompensation` | Number | no |  |
| `color` | String | no | override calendar colour |
| `rosaId` | String | no | external Rosa ID |
| `rosaMotiveId` | String | no |  |
| `fromRosa` | Boolean | no | imported from Rosa |
| `requiresReview` | Boolean | no |  |
| `deletedInRosa` | Boolean | no |  |
| `createdAt` | Date | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Public fields** (`events.jsx:1353-1360`): `title`, `end`, `start`, `rosaId`, `fromRosa`, `requiresReview`.

**Indexes** (`app/imports/api/events/server/indexes.js:6-11`):

- `{ userId: 1 }`
- `{ start: 1 }`
- `{ end: 1 }`
- `{ practiceId: 1 }`
- `{ treatmentId: 1 }`
- `{ removed: 1 }`

**Hooks** (`app/imports/api/events/server/hooks.js`):

- `after.insert` (line 45): debounces (5000 ms) commission recomputation and treatment session-observer refresh.
- `after.update` (line 62): same debounced flows for updates; accesses `this.previous`.
- `Meteor.startup` observer (line 83): observes soft-deleted events and re-runs commission / session-observer removal. Comment above reads `TODO: RE-ENABLE`.

---

## InsuranceInvoices

- **File:** `app/imports/api/invoices/insuranceInvoices/insuranceInvoices.js:9`
- **MongoDB collection name:** `insuranceInvoices`
- **Purpose:** Verzamelstaten — batched reimbursement claims to a single insurance fund, grouping multiple patient certificates.

**Enum constants** (`insuranceInvoices.js:11-16`):

```
InsuranceInvoiceStates = { CANCELED: 'canceled', OPEN: 'open', PRINTED: 'printed', PAID: 'paid' }
```

**Schema** (`insuranceInvoices.js:24-57`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `address` | `addressSchema` | yes | therapist / practice return address |
| `amount` | Number | yes | total claim |
| `bankAccount` | String | yes |  |
| `certificates` | Array | yes | min 1; each embeds patient certificate data |
| `certificates.$.amount` | Number | yes |  |
| `certificates.$.bilanId` | String | no |  |
| `certificates.$.invoiceId` | String (Id) | yes | originating patient invoice |
| `certificates.$.name` | String | yes | patient name |
| `certificates.$.nbOfEvents` | Number | yes |  |
| `certificates.$.number` | String | yes | certificate number |
| `certificates.$.patientFileId` | String (Id) | yes |  |
| `certificates.$.SSN` | String | yes | INSZ |
| `certificates.$.treatmentId` | String (Id) | yes |  |
| `createdAt` | Date | yes |  |
| `invoiceNumber` | Number | yes | practice-scoped sequence |
| `meta` | Object (blackbox) | no | holds `type` (practice/member), `locale` |
| `practiceId` | String (Id) | yes |  |
| `practice.image` | String | no |  |
| `practice.name` | String | yes |  |
| `state` | String | yes | default `open` |
| `structuredAnnouncement` | String | yes | Belgian OGM/structured payment reference |
| `insuranceAddress` | `addressSchema` | no |  |
| `insuranceCode` | Number | no | fund code |
| `insuranceName` | String | yes |  |
| `userId` | String (Id) | yes |  |
| `user.name` | String | yes |  |
| `user.riziv` | String | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Filters** (`insuranceInvoices.js:66-71`): `paid` / `open` / `printed` / `canceled`.
**Sort options** (`insuranceInvoices.js:72-79`): `date_asc`/`desc`, `name_asc`/`desc`, `amount_asc`/`desc`.

**Indexes:** none declared.
**Hooks:** none.

---

## Invitations

- **File:** `app/imports/api/invitations/invitations.jsx:7` (via custom subclass `InvitationsCollection`)
- **MongoDB collection name:** `invitations`
- **Purpose:** pending invite tokens for joining a practice.

**Schema** (`invitations.jsx:15-21`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | String (Id) | yes | inviter |
| `token` | String | yes | accept-URL token |
| `type` | String | yes | only `joinPractice` |
| `data` | Object (blackbox) | yes | includes `practiceId`, target email, role |
| `createdAt` | Date | yes |  |

**Public fields** (`invitations.jsx:25-28`): `data`, `createdAt`.

**Indexes:** none.
**Hooks:** none.

---

## Invoices (Stripe)

- **File:** `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx:60` (via custom subclass `StripeInvoiceCollection`, `stripeInvoices.jsx:7-59`)
- **MongoDB collection name:** `stripeInvoices`
- **JS symbol:** `Invoices` — note the name collision with `PatientFileInvoices`.

The subclass overrides `insert`, `upsert`, and `update` to auto-assign an incremental `number` when an invoice transitions out of state `open` and has a non-zero amount; it also auto-transitions `PENDING → PAID` when the amount is zero (`stripeInvoices.jsx:13-58`).

**Enum constants** (`stripeInvoices.jsx:74-80` and `:226-232`):

```js
PAYMENT_STATES = { OPEN, PENDING, CHARGING, FAILED, SUCCESS }
STATES = { OPEN: 'open', PAID: 'paid', PENDING: 'pending', FAILED: 'failed', CLOSED: 'closed' }
```

**Embedded `InvoiceItem` schema** (`stripeInvoices.jsx:82-88`)

| Field | Type | Notes |
|---|---|---|
| `type` | String |  |
| `amount` | Number | cents |
| `currency` | String |  |
| `period` | String (blackbox) | start/end timestamps |
| `plan` | String | plan name |

**Schema** (`stripeInvoices.jsx:90-129`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `number` | Number | yes | auto-assigned |
| `practiceId` | String | yes |  |
| `practice.address` | `addressSchema` | yes |  |
| `practice.companyNumber` | String | no |  |
| `practice.name` | String | yes |  |
| `practice.vatInfo.*` | Object | no | snapshot at invoice time |
| `subscriptionId` | String | yes |  |
| `stripeId` | String | yes |  |
| `stripeInfo` | Object (blackbox) | yes | raw Stripe invoice object |
| `periodStart` | Number | yes | unix ms |
| `periodEnd` | Number | yes | unix ms |
| `invoiceItems` | Array of `InvoiceItem` | yes |  |
| `state` | String | yes |  |
| `sourceId` | String | yes |  |
| `closed` | Boolean | no | default `false` |
| `paid` | Boolean | no | default `false` |
| `paymentStatus.status` | Object | no |  |
| `paymentStatus.reason` | Object | no |  |
| `referralId` | String | no | line-item reduction from referral program |
| `createdAt` | Date | yes |  |
| `taxPercent` | Number | no | default `0` |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

Note: `stripeInvoices.jsx:131` has a commented-out `attachSchema` call, meaning **this schema is never actually attached** to the collection. The schema exists but will not be enforced by SimpleSchema on write; `insert`, `update`, and `upsert` bypass SimpleSchema validation and rely on the subclass override logic instead.

**Public fields** (`stripeInvoices.jsx:133-135`): `name: 1` — but `name` is not a declared field. Effectively empty.

**Indexes:** none.
**Hooks:** none.

---

## LongTherapyPlan

- **File:** `app/imports/api/patientFiles/longTherapyPlan.jsx:4`
- **MongoDB collection name:** `longTherapy`
- **Purpose:** long-term treatment goals per patient file, with a tree hierarchy via `parentId`.

**Enum constants** (`longTherapyPlan.jsx:13-50`):

```js
LongTherapyPlan.goals = [
  "afasie", "articulatie", "communication", "dysfagie", "hearing",
  "leerstoornis", "myofunction", "schisis", "stem", "stutter", "taal"
]

LongTherapyPlan.STATES     = { TODO: 'todo', IN_PROGRESS: 'inProgress', DONE: 'done' }
LongTherapyPlan.PRIORITIES = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }
```

There is also an exported `icons` object mapping each goal to a FontAwesome-style icon name (`longTherapyPlan.jsx:26-38`).

**Schema** (`longTherapyPlan.jsx:52-72`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | String | yes | allowed values: the 11 `goals` |
| `createdAt` | Date | yes |  |
| `description` | String | no |  |
| `goal` | String | yes | the goal text |
| `parentId` | String (Id) | no | for sub-goals |
| `patientFileId` | String (Id) | yes |  |
| `priority` | String | yes | default `high` |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `status` | String | yes | default `todo` |
| `therapistId` | String (Id) | no |  |

**Indexes:** none.
**Hooks:** none.

---

## MethodLogger

- **File:** `app/imports/api/logger/logger.js:5`
- **MongoDB collection name:** `method-logs`
- **Purpose:** server-side audit trail of Meteor method invocations (populated elsewhere — schema-less).

**Schema:** none defined (`logger.js` is 5 lines long and only exports the collection). Based on index usage the expected fields are `userId`, `methodName`, and `createdAt` (see indexes below).

**Indexes** (`app/imports/api/logger/server/indexes.js:5-7`):

- `{ userId: 1 }`
- `{ methodName: 1 }`
- `{ createdAt: 1 }`

**Hooks:** none.

---

## Newsfeed

- **File:** `app/imports/api/newsfeed/newsfeed.js:6`
- **MongoDB collection name:** `newsfeed`
- **Purpose:** bilingual system-wide announcements shown on the main dashboard.

**Schema** (`newsfeed.js:14-23`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `body` | Object | yes |  |
| `body.fr` | String | yes |  |
| `body.nl` | String | yes |  |
| `image` | String | no | URL |
| `title` | Object | yes |  |
| `title.fr` | String | yes |  |
| `title.nl` | String | yes |  |

**Indexes:** none.
**Hooks:** none.

---

## Notifications

- **File:** `app/imports/api/notifications/notifications.jsx:6`
- **MongoDB collection name:** `notifications`
- **Purpose:** in-app notification centre per user, scoped optionally to a practice.

**Enum constants** (`notifications.jsx:14-25`):

```js
Notifications.states = { NEW: 'new', READ: 'read', SEEN: 'seen' }
Notifications.types  = { ERROR: 'error', INFO: 'info', SUCCESS: 'success', WARNING: 'warning' }
```

**Schema** (`notifications.jsx:27-54`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `body` | String | yes | i18n key |
| `meta` | Object (blackbox) | yes | i18n attributes, links |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `practiceId` | String | no |  |
| `state` | String | yes | default `new` |
| `title` | String | yes | i18n key |
| `type` | String | yes | `error` / `info` / `success` / `warning` |
| `userId` | String | yes |  |

**Indexes** (`app/imports/api/notifications/server/indexes.js:6`): `{ userId: 1 }`.
**Hooks:** none.

---

## PatientFileInvoices

- **File:** `app/imports/api/invoices/patientFileInvoices/patientFileInvoices.js:11`
- **MongoDB collection name:** `invoices` — note: this is *different* from the `stripeInvoices` collection whose JS symbol is also `Invoices`.
- **Purpose:** invoices issued to a patient for completed sessions, including embedded RIZIV certificates.

**Enum constants** (`patientFileInvoices.js:13-26`):

```js
InvoiceStates = {
  OPEN: 'open', UNPAID: 'unpaid', PARTIALLY_PAID: 'partially_paid',
  PRINTED: 'printed', MAILED: 'mailed', PAID: 'paid'
}
InvoiceInsuranceStates = { OPEN: 'open', PRINTED: 'printed', PAID: 'paid' }
```

Also `PatientFileInvoices.MAX_TREATMENTS_PER_CERTIFICATE = 34` (`patientFileInvoices.js:28`).

**Embedded `certificateSchema`** (`patientFileInvoices.js:42-56`): `approvalDate`, `numbers[]`, `prescriberName`, `prescriberRiziv`, `prescriptionDate`, `treatmentEnd`, `treatmentStart`.

**Schema** (`patientFileInvoices.js:58-166`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `address` | `addressSchema` | yes |  |
| `amount` | Number | yes |  |
| `administrationCost` | Number | no |  |
| `bankAccount` | String | yes |  |
| `certificates` | Array | yes | custom validator rejects duplicate `treatmentId-bilanId` pairs |
| `certificates.$.bilanId` | String | no |  |
| `certificates.$.bilanType` | String | no | from `Treatments.getBilanTypes()` |
| `certificates.$.certificate` | `certificateSchema` | no |  |
| `certificates.$.doesNotRequireCertificate` | Boolean | yes |  |
| `certificates.$.hasNoReimbursableEvents` | Boolean | no |  |
| `certificates.$.insuranceInvoiceId` | String (Id) | no |  |
| `certificates.$.insuranceInvoiceState` | String | no |  |
| `certificates.$.isTreatmentReimbursed` | Boolean | no |  |
| `certificates.$.state` | String | no |  |
| `certificates.$.treatmentId` | String (Id) | no |  |
| `certificates.$.treatmentName` | String | no |  |
| `certificates.$.treatmentType` | String | no | from `Treatments.getTypes()` |
| `companyNumber` | String | no |  |
| `createdAt` | Date | yes |  |
| `events` | Array of blackbox objects | yes | snapshot of billed events |
| `events.$._id` | String (Id) | yes |  |
| `events.$.code` | String | no | RIZIV nomenclature code |
| `events.$.isReimbursable` | Boolean | no |  |
| `events.$.price` | Number | yes |  |
| `events.$.pricePatient` | Number | no |  |
| `hasIncreasedReimbursement` | Boolean | yes |  |
| `isCanceled` | Boolean | no | default `false` |
| `isThirdPayer` | Boolean | yes |  |
| `isPaid` | Boolean | no | default `false` |
| `invoiceNumber` | Number | yes | practice-scoped sequence |
| `meta` | Object (blackbox) | no | `type`, `locale` |
| `patient.*` | Object | yes | snapshot of patient at invoice time |
| `patientFileId` | String (Id) | no |  |
| `practiceId` | String (Id) | yes |  |
| `practice.*` | Object | yes | snapshot of practice |
| `state` | String | yes | default `open`, plus `void` |
| `stateInsurance` | String | no | `open`/`printed`/`paid` |
| `structuredAnnouncement` | String | no | OGM |
| `insuranceAddress` | `addressSchema` | no |  |
| `insuranceCode` | Number | no |  |
| `insuranceName` | String | no |  |
| `userId` | String (Id) | yes |  |
| `user.companyNumber` / `user.name` / `user.riziv` | various | partial | snapshot |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Filters** (`patientFileInvoices.js:175-203`): `paid`, `open`, `unpaid`, `partially_paid`, `mailed`, `printed`, `isthirdpayer`, `canceled`, `void`.
**Sort options** (`patientFileInvoices.js:205-212`): `date_asc`/`desc`, `name_asc`/`desc`, `amount_asc`/`desc`.

**Indexes** (`app/imports/api/invoices/patientFileInvoices/server/indexes.js:6-8`):

- `{ userId: 1 }`
- `{ practiceId: 1 }`
- `{ removed: 1 }`

**Hooks:** none.

---

## PatientFileReports

- **File:** `app/imports/api/patientFileReports/patientFileReports.jsx:5`
- **MongoDB collection name:** `patientFileReports`
- **Purpose:** clinical reports / assessments (rich-text documents) attached to a patient file and optionally a treatment.

**Enum constants** (`patientFileReports.jsx:13-16`):

```js
PatientFileReports.demandFormTypes = { FIRST: 'first', EXTENSION: 'extension' }
```

**Schema** (`patientFileReports.jsx:18-28`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `patientFileId` | String (Id) | yes |  |
| `name` | String | yes |  |
| `report` | String | no | HTML/Markdown body |
| `tags` | Array of String | no |  |
| `treatmentId` | String (Id) | no |  |
| `createdAt` | Date | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Indexes** (`app/imports/api/patientFileReports/server/indexes.js:6`): `{ patientFileId: 1 }`.
**Hooks:** none.

---

## PatientFileUsers

- **File:** `app/imports/api/patientFileUsers/patientFileUsers.jsx:59`
- **MongoDB collection name:** `patientFileUsers`
- **Purpose:** per-patient-file RBAC — which users can access a given patient file, and under which role.

**Exported roles** (`patientFileUsers.jsx:6-57`): three roles — `admin`, `default`, `owner`. Note that `admin` and `default` currently hold **identical** permission lists (22 permissions each), and `owner` only has `patientFile.view`. Full per-role permission list can be read verbatim from lines 6-57.

**Schema** (`patientFileUsers.jsx:73-80`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | String | yes | default `default`; one of `admin`/`default`/`owner` |
| `userId` | String (Id) | yes |  |
| `patientFileId` | String (Id) | yes |  |
| `createdAt` | Date | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Public fields**: `role`, `userId`, `patientFileId`.

**Indexes** (`app/imports/api/patientFileUsers/server/indexes.js:6-8`):

- `{ patientFileId: 1 }`
- `{ removed: 1 }`
- `{ userId: 1 }`

**Hooks:** none.

---

## PatientFiles

- **File:** `app/imports/api/patientFiles/patientFiles.jsx:15`
- **MongoDB collection name:** `patientFiles`
- **Purpose:** patient dossier — the core master record.

**Enum constants** (`patientFiles.jsx:29-147`):

```js
PatientFiles.states = { STARTING: 'starting', ACTIVE: 'active', INACTIVE: 'inactive', PENDING: 'pending' }
PatientFiles.professionTypes = { PUPIL: 'pupil', STUDENT: 'student', OTHER: 'other' }
PatientFiles.salutations = {
  MISTER: 'mister', MISSES: 'misses', MISS: 'miss',
  PARENTS: 'parents', DOCTOR: 'doctor', PROFESSOR: 'professor', ENGINEER: 'engineer'
}
```

`PatientFiles.getInsuranceStateCodes()` (`patientFiles.jsx:36-130`) is a static table mapping each Belgian RIZIV `insuranceStateCode1` value (100 through 471) to the set of permissible `insuranceStateCode2` values — used by schema validation.

**Schema** (`patientFiles.jsx:148-253`, defined with `requiredByDefault: false`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `address` | `addressSchema` | no |  |
| `birthDate` | Date | no |  |
| `CLB.*` | Object | no | Belgian school counselling centre contact |
| `contactDetails` | `contactDetailsSchema(false)` | no |  |
| `contactPersons` | Array of `contactPersonSchema` | no |  |
| `doctor.*` | Object | no | referring doctor |
| `extraInfo` | String | no |  |
| `files.tags` | Array of String | no | document tags index |
| `firstName` | String | yes |  |
| `gender` | String | no | `male` / `female` |
| `healthInsurance` | Number | no | legacy — removed by `migration-v4` |
| `imageUrl` | String | no |  |
| `insuranceStateCode1` | String | no | allowed values = keys of `getInsuranceStateCodes()` |
| `insuranceStateCode2` | String | no | union of all values in `getInsuranceStateCodes()` |
| `isThirdPayer` | Boolean | no |  |
| `lastName` | String | yes |  |
| `medicalInfo` | String | no |  |
| `practiceId` | String (Id) | yes |  |
| `prescriber.*` | Object | no |  |
| `profession` | String | no |  |
| `professionType` | String | no | `pupil`/`student`/`other` |
| `salutation` | String | no |  |
| `school.*` | Object | no | includes coordinators, teachers |
| `SSN` | String | no | regex `/^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/` — Belgian INSZ format |
| `state` | String | no | default `pending` |
| `tags` | Array of String | no |  |
| `rosaId` | String | no |  |
| `fromRosa` | Boolean | no |  |
| `requiresReview` | Boolean | no |  |
| `mergedFromIds` | Array of String | no |  |
| `mergedFromRosaIds` | Array of String | no |  |
| `mergedToRosaId` | String | no |  |
| `isMissingInRosa` | Boolean | no |  |
| `deletedInRosa` | Boolean | no |  |
| `metaData` | Object (blackbox) | no |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `createdAt` | Date | yes |  |

**Public fields** (`patientFiles.jsx:257-272`): basic demographics, `rosaId`, `fromRosa`, `requiresReview`.
**Public fields detailed**: excludes `metaData`, `removed`.

**Indexes** (`app/imports/api/patientFiles/server/indexes.js:8`): `{ practiceId: 1 }`.
**Hooks:** none directly on PatientFiles; `Practices.after.update` cascades notification-setting changes to related treatments.

---

## Plans

- **File:** `app/imports/api/payments/plans.jsx:5`
- **MongoDB collection name:** `plans`
- **Purpose:** SaaS subscription tier definitions (Basic / Standard / Premium etc.).

**Schema** (`plans.jsx:13-25`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | yes |  |
| `price` | Number | yes | cents |
| `currency` | String | yes |  |
| `repeatType` | String | yes | `monthly` / `yearly` |
| `features` | Array of String | yes |  |
| `maxUsers` | Number | yes | `-1` = unlimited |
| `highlight` | Boolean | no |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `createdAt` | Date | yes |  |

**Public fields** (`plans.jsx:29-36`): `name`, `price`, `currency`, `repeatType`, `features`, `highlight`.

**Indexes:** none.
**Hooks:** none.

---

## PracticeChatCol

- **File:** `app/imports/api/practice/practiceChat.jsx:5`
- **MongoDB collection name:** `practicechat`
- **JS symbol:** `PracticeChatCol`
- **Purpose:** real-time messages inside a practice chat thread.

**Schema** (`practiceChat.jsx:13-22`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `message` | String | yes |  |
| `userId` | String (Id) | yes | author |
| `practiceId` | String (Id) | yes |  |
| `readBy` | Array of String | yes | user IDs who have read |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Public fields**: excludes `removed`, `removedAt`.

**Indexes:** none.
**Hooks:** none.

---

## PracticeUsers

- **File:** `app/imports/api/practiceUsers/practiceUsers.jsx:155`
- **MongoDB collection name:** `practiceUsers`
- **Purpose:** staff records linking a user to a practice, with role-based permissions and per-user commission rate.

**Exported roles** (`practiceUsers.jsx:8-153`): three roles — `owner`, `admin`, `default`. Permission lists are large (60+ entries on `owner`, slightly fewer on `admin`, and only 5 on `default`). See the full verbatim list in source — notable permissions include `practice.commission.*`, `practice.subscriptions.*`, `practice.user.*`, `patientFile.*`, `invoices.*`, `treatments.*`, `teamMeeting.add`, `referrals`.

Note that the `default` role only has: `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read` — a default member is intentionally low-privilege.

**Schema** (`practiceUsers.jsx:163-177`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `commission` | `CommissionSchema` | no | default `{}` |
| `createdAt` | Date | yes |  |
| `info` | String | no |  |
| `role` | String | yes | default `default`; allowed values = keys of `roles` |
| `userId` | String (Id) | yes |  |
| `practiceId` | String (Id) | yes |  |
| `publicAgendaKey` | String (Id) | no | iCal export key, public |
| `privateAgendaKey` | String (Id) | no | iCal export key, private |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Public fields**: `role`, `userId`, `practiceId`.

**Indexes** (`app/imports/api/practiceUsers/server/indexes.js:6-8`):

- `{ practiceId: 1 }`
- `{ removed: 1 }`
- `{ userId: 1 }`

**Hooks** (`app/imports/api/practiceUsers/server/hooks.js`):

- `after.update` (`hooks.js:48`): debounces (5000 ms) a recalculation of `CommissionInvoices` when a practice user's commission settings change. If `CommissionSchema.type` becomes `fixedAmount` and no open invoice exists for the current month, one is inserted; otherwise the rate snapshot is updated on open invoices from that month forward.

---

## Practices

- **File:** `app/imports/api/practice/practices.jsx:12`
- **MongoDB collection name:** `practices`
- **Purpose:** SaaS practice instance — the tenant container; holds branding, billing info, invoice settings, Rosa sync roster.

**Enum constants** (`practices.jsx:26-36`):

```js
Practices.communicationStructures = {
  "FULLNAME-MONTH-NUMBER": "FULLNAME-MONTH-NUMBER",
  "FULLNAME-MONTH":        "FULLNAME-MONTH",
  "NAME-DATE-NUMBER":      "NAME-DATE-NUMBER",
  "NAME-DATE":             "NAME-DATE",
}
Practices.invoiceTypes = { PRACTICE: 'practice', MEMBER: 'member' }
```

**Schema** (`practices.jsx:38-143`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `address` | `addressSchema` | no |  |
| `bankAccount` | String | no | custom IBAN validator |
| `companyNumber` | String | no |  |
| `contact.email` | String | yes |  |
| `contact.phoneNumber` | String | no |  |
| `contact.gsmNumber` | String | no |  |
| `createdAt` | Date | yes |  |
| `customerId` | String | no | Stripe customer ID |
| `info` | String | no |  |
| `imageUrl` | String | no | logo |
| `invoiceNumber` | Number | yes | default `0`; practice-scoped sequence |
| `name` | String | yes |  |
| `userId` | String | yes | original creator |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `settings.chat.disabled` | Boolean | no |  |
| `settings.invoices.color` | String | no |  |
| `settings.invoices.locale` | String | no | from `i18n/index.locales`; default first locale |
| `settings.invoices.mail.color` | String | no |  |
| `settings.invoices.mail.template` | Number | no | 0–3; default 0 |
| `settings.invoices.mail.text` | String | no |  |
| `settings.invoices.remark` | String | no |  |
| `settings.invoices.extraHeader` | String | no |  |
| `settings.invoices.template` | Number | no | 0–3; default 0 |
| `settings.invoices.type` | String | no | `practice` / `member`; default `member` |
| `settings.invoices.communicationStructure` | String | no |  |
| `settings.patientFiles.notifications.date` | Number | no | default `7` days |
| `settings.patientFiles.notifications.sessions` | Number | no | default `10` sessions |
| `usedTrial` | Boolean | no | default `false` |
| `vatInfo.vatNumber` | String | yes |  |
| `vatInfo.address` | String | yes |  |
| `vatInfo.companyName` | String | yes |  |
| `vatInfo.countryCode` | String | yes |  |
| `rosaId` | String | no |  |
| `rosaMotives` | Array | no | per-motive mapping to Halingo `type`/`subType`/`location` |

**Public fields**: everything except `customerId`, `invoiceNumber`, `userId`, `removed`, `removedAt`.

**Indexes:** none.
**Hooks** (`app/imports/api/practice/server/hooks.js`):

- `after.update` (`hooks.js:13`): when `settings.patientFiles.notifications.date` or `.sessions` changes, re-registers `TreatmentDateObserver` / `TreatmentSessionObserver` for all treatments under the practice that inherit (null or zero) notification settings.
- `Meteor.startup` (`hooks.js:72`): registers a **5-minute (300000 ms) interval** that pulls patients and events from Rosa for every practice with `rosaId` set, unless `Meteor.settings.disableRosaSync` is truthy. This is the primary Rosa → Halingo pull mechanism.

---

## Referrals

- **File:** `app/imports/api/referrals/referrals.js:5`
- **MongoDB collection name:** `referrals`
- **Purpose:** referral bonus program (aanbrengbonus) tracking.

**Enum constants** (`referrals.js:19-24`):

```js
Referrals.states = {
  INVITED:    'INVITED',
  REGISTERED: 'REGISTERED',
  PAID:       'PAID',
  CONSUMED:   'CONSUMED',
}
```

**Schema** (`referrals.js:26-35`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `status` | String | yes |  |
| `email` | String | no | invited email |
| `userId` | String (Id) | no | the referrer |
| `referredUserId` | String (Id) | no | the invitee |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `amount` | Number | no | reward amount, set when `PAID`/`CONSUMED` |

**Indexes:** none.
**Hooks:** none.

---

## Riziv

- **File:** `app/imports/api/riziv/riziv.jsx:5`
- **MongoDB collection name:** `riziv`
- **Purpose:** read-only RIZIV practitioner registry, used for looking up prescriber names by RIZIV number.

**Schema** (`riziv.jsx:13-18`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `firstName` | String | yes |  |
| `lastName` | String | yes |  |
| `riziv` | String | yes | RIZIV number |
| `qual` | String | yes | qualification code |

**Indexes:** none declared.
**Hooks:** none.

---

## Subscriptions

- **File:** `app/imports/api/subscriptions/subscriptions.jsx:6`
- **MongoDB collection name:** `subscriptions`
- **Purpose:** SaaS subscription lifecycle per practice.

**Durations** (`subscriptions.jsx:8-14`):

```js
Subscriptions.getDurations = () => ({
  LEEWAY:       moment.duration(3,  'days'),   // grace after periodEnd
  SUBSCRIPTION: moment.duration(1,  'month'),
  TRIAL:        moment.duration(30, 'days'),
})
```

**Embedded `paymentInfo` schema** (`subscriptions.jsx:22-28`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | String | yes | `bancontact` / `card` / `none` |
| `newTypeAtEndOfPeriod` | String | no | scheduled payment-method change |
| `repeatedAt` | String | yes | `monthly` / `yearly` |
| `startDate` | Date | no |  |
| `lastInvoiceDate` | Date | no |  |

**Schema** (`subscriptions.jsx:30-53`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `practiceId` | String | yes |  |
| `createdBy` | String | no |  |
| `type` | String | yes | plan name |
| `newPlanAtEndOfPeriod` | String | no | scheduled plan change |
| `cancelAtPeriodEnd` | Boolean | no | default `false` |
| `createdAt` | Date | yes |  |
| `start` | Number | yes | unix ms |
| `trialEnd` | Number | no |  |
| `periodStart` | Number | yes |  |
| `periodEnd` | Number | no |  |
| `stripeId` | String | no |  |
| `activeUntil` | Number | no | `periodEnd + LEEWAY` |
| `paymentInfo` | `paymentInfo` | yes |  |
| `status` | String | yes | `ACTIVE` / `TRIAL` / `CANCELLED` |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Indexes:** none.
**Hooks:** none.
(Subscription state transitions are driven from `app/imports/api/subscriptions/server/invoiceCreator.jsx`, hooking into `SyncedCron` per subscription — see `background_jobs.md`.)

---

## TeamMeeting

- **File:** `app/imports/api/practice/teammeeting.jsx:5`
- **MongoDB collection name:** `teammeeting`
- **Purpose:** scheduled team meetings inside a practice.

**Enum constants** (`teammeeting.jsx:25-28`, `:29-38`):

```js
TeamMeetingStates = { ATTEND: 'attend', ABSENT: 'absent' }  // exported separately
TeamMeeting.filters = {
  done:   { date: { $lt: new Date() } },
  tocome: { date: { $gt: new Date() } },
}
TeamMeeting.sortOptions = {
  date_asc: { date: 1 },  date_desc: { date: -1 },
  location_asc: { location: 1 }, location_desc: { location: -1 },
}
```

Note that the `filters.done` / `filters.tocome` `new Date()` values are captured at module-load time, so they effectively only reflect "server-boot time" unless re-evaluated. A call site that uses these verbatim has a subtle time-drift bug.

**Schema** (`teammeeting.jsx:14-23`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `practiceId` | String | no |  |
| `date` | Date | yes |  |
| `participants` | Array of String | yes |  |
| `location` | String | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Indexes:** none.
**Hooks:** none.

---

## Todos

- **File:** `app/imports/api/todo/todos.js:5`
- **MongoDB collection name:** `todos`
- **Purpose:** per-user task list.

**Schema** (`todos.js:13-20`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `createdAt` | Date | yes |  |
| `done` | Boolean | yes | default `false` |
| `todo` | String | yes | task text |
| `userId` | String (Id) | yes |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |

**Indexes** (`app/imports/api/todo/server/indexes.js:6`): `{ userId: 1 }`.
**Hooks:** none.

---

## Treatments

- **File:** `app/imports/api/treatments/treatments.js:9`
- **MongoDB collection name:** `treatments`
- **Purpose:** treatment plans bound to a patient file; hold the RIZIV disorder code, bilans, and session counters.

**Enum constants** (`treatments.js:23-60`):

```js
Treatments.approvalStates = { APPROVED: 'approved', DECLINED: 'declined', PENDING: 'pending', TESTING: 'testing' }
Treatments.getBilanTypes() = { INITIAL: 'initial', EVOLUTION: 'evolution', RELAPSE: 'relapse', EXTENSION: 'extension' }
Treatments.getTypes() = [
  'a', 'b.1', 'b.2', 'b.3', 'b.4', 'b.5',
  'b.6.1', 'b.6.2', 'b.6.3', 'b.6.4', 'b.6.5',
  'c.1', 'c.2', 'd', 'e', 'f', 'g', 'supplementaryInsurance'
]
```

`Treatments.getDisorderCodes()` (`treatments.js:354+`) is a 500+ line static map of RIZIV nomenclature codes keyed by `[treatmentType][appointmentType][duration][location]`. This is the authoritative nomenclature table in the application and is used by `Treatments.helpers.getCodeForEvent()`.

`Treatments.VideoConsultationCode = 792433` (`treatments.js:353`) is the nomenclature code applied when `location === VIDEO_CONSULTATION`.

**`bilanSchema`** (`treatments.js:62-87`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | String (Id) | yes |  |
| `approvedDate` | Date | no |  |
| `createdAt` | Date | yes |  |
| `end` | Date | yes | custom validator: must be > start |
| `isReimbursed` | Boolean | yes |  |
| `prescriber.name` | String | yes |  |
| `prescriber.riziv` | String | yes |  |
| `prescriptionDate` | Date | yes |  |
| `start` | Date | yes |  |
| `type` | String | yes | one of the bilan types |

**Main schema** (`treatments.js:89-139`, `requiredByDefault: false`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | String (Id) | yes |  |
| `approvalState` | String | yes | default `testing` |
| `bilans` | Array of `bilanSchema` | yes | custom validator rejects >1 initial bilan and out-of-order bilans |
| `createdAt` | Date | yes |  |
| `name` | String | yes |  |
| `notifications.date` | Number | no | days before expiry to warn |
| `notifications.dateScheduled` | Date | no | cached by `TreatmentDateObserver` |
| `notifications.enabled` | Boolean | yes | default `true` |
| `notifications.sessions` | Number | no | sessions-left threshold |
| `notifications.sessionsScheduled` | Date | no |  |
| `patientFileId` | String (Id) | yes |  |
| `removed` | Boolean | yes |  |
| `removedAt` | Date | yes |  |
| `supplementaryInsurance.code` | String | yes |  |
| `supplementaryInsurance.isCertificateNeeded` | Boolean | yes | default `false` |
| `supplementaryInsurance.payback` | Number | yes |  |
| `totalSessions` | Number | yes |  |
| `type` | String | yes | from `Treatments.getTypes()` |
| `usedSessions` | Number | yes | default `0` |
| `usedSessionsEvents` | Number | yes | default `0` |

**Indexes** (`app/imports/api/treatments/server/indexes.js:6`): `{ patientFileId: 1 }`.

**Hooks** (`app/imports/api/treatments/server/hooks.js`):

- `after.update` (`hooks.js:10`): synchronises `TreatmentDateObserver` and `TreatmentSessionObserver` based on changes to `notifications.enabled`, `bilans.end`, `notifications.date`, `notifications.sessions`, `totalSessions`, `usedSessions`. The observers are the mechanism that drives the "treatment expiring soon" notifications.
- `after.remove` (`hooks.js:44`): removes both observers.

---

## Meteor.users

- **File:** `app/imports/api/users/users.jsx` (no `new Collection(...)` — extends `Meteor.users` directly)
- **MongoDB collection name:** `users`
- **Purpose:** user accounts with Halingo-specific profile, settings, and Rosa integration.

**Enum constants** (`users.jsx:11-38`):

```js
UserProfessions               = { SPEECH_THERAPIST: 'SPEECH_THERAPIST', OTHER: 'OTHER' }
Meteor.users.salutations      = { MISTER: 'mister', MISSES: 'misses', MISS: 'miss' }
Meteor.users.certificateModes = { MANUAL: 'manual', PRINTER: 'printer' }
```

**`UserProfile` schema** (`users.jsx:40-97`, `requiredByDefault: false`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `address` | `addressSchema` | no |  |
| `bankAccount` | String | no | IBAN validator |
| `birthday` | Date | no |  |
| `companyNumber` | String | no |  |
| `firstName` / `lastName` | String | no |  |
| `locale` | String | no | default `nl` |
| `gender` | String | no | `male` / `female` |
| `imageUrl` | String | no |  |
| `gsmNumber` / `phoneNumber` | String | no |  |
| `pendingEmail` | String | no | email-change pending |
| `salutation` | String | no |  |
| `certificateNumber.bookNumber` | String | no | regex `/\d{2}\*\d{4}/` |
| `certificateNumber.certificateNumber` | Number | no | max 50 |
| `certificateNumber.printerNumber` | Number | no |  |
| `riziv` | String | no |  |
| `profession` | String | no | default `SPEECH_THERAPIST` |
| `isDeconventioned` | Boolean | no | default `false` |
| `professionOther` | String | no |  |

**`UserSettings` schema** (`users.jsx:99-142`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `certificates.mode` | String | yes | default `manual` |
| `certificates.offset.left` | Number | no |  |
| `certificates.offset.top` | Number | no |  |
| `certificates.therapistInformation` | Boolean | no |  |
| `certificates.therapistInformationPractice` | Boolean | no |  |
| `invoices.rizivRequired` | Boolean | no | default `true` |
| `invoices.personalNote` | String | no |  |

**Top-level `User` schema** (`users.jsx:144-242`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `emails` | Array of `{address, verified}` | yes |  |
| `acceptedTerms` | String | no | ToC version number |
| `createdAt` | Date | yes |  |
| `profile` | `UserProfile` | no |  |
| `settings` | `UserSettings` | no |  |
| `removed` | Boolean | no |  |
| `removedAt` | Date | no |  |
| `services` | Object (blackbox) | no | accounts-base data |
| `roles` | Array of String | no | global roles |
| `heartbeat` | Date | no |  |
| `createdFromBackendEmail` | String | no |  |
| `rosaIntegrations` | Array | no | one entry per connected Rosa calendar |
| `rosaIntegrations.$.calendarId` | String | yes |  |
| `rosaIntegrations.$.hpId` | String | yes | Rosa HealthPro ID |
| `rosaIntegrations.$.token` | String | yes | OAuth token |
| `rosaIntegrations.$.practiceId` | String | yes |  |
| `rosaIntegrations.$.isUserInput` | Boolean | no |  |
| `rosaIntegrations.$.tokenInvalid` | Boolean | no |  |
| `rosaIntegrations.$.lastPatientsFetch` | Date | no |  |
| `rosaIntegrations.$.lastEventsFetch` | Date | no |  |
| `rosaIntegrations.$.isSyncingEvents` | Boolean | no |  |

**Public fields** (`users.jsx:248-253`): `emails`, `createdAt`, `profile`, `settings`.
**Public fields detailed** (`users.jsx:254-265`): adds `acceptedTerms` and a subset of the `rosaIntegrations` sub-fields.

**Indexes:** none.
**Hooks** (`app/imports/api/users/server/hooks.js:6`):

- `Meteor.users.after.update`: when `name()` or `image()` changes, cascade-updates `userName` / `userImage` on all `CommissionInvoices` for this user across all practices.

---

## Avatars

- **File:** `app/imports/lib/upload/avatars/Avatars.js:36` (via `FilesCollection`)
- **MongoDB collection name:** `avatars`
- **Purpose:** uploaded user profile pictures.

**Constraints**: `onBeforeUpload` rejects non-png/jpg/jpeg files and files >10 MB (`Avatars.js:13-28`).

**Indexes:** none.
**Hooks:** none.

---

## Summary

Total: **25 collections** defined via `new Collection(...)` / `new Mongo.Collection(...)` / `new FilesCollection(...)`, plus `Meteor.users`.

| # | JS symbol | Mongo name | File |
|---|---|---|---|
| 1 | `AgendaSettings` | `agendaSettings` | `agendaSettings/agendaSettings.jsx` |
| 2 | `Avatars` | `avatars` | `lib/upload/avatars/Avatars.js` |
| 3 | `ClientErrors` | `clientErrors` | `clientErrors/clientErrors.jsx` |
| 4 | `CommissionInvoices` | `commissionInvoices` | `invoices/commissionInvoices/commission.jsx` |
| 5 | `Documents` | `documents` | `patientFiles/Documents.js` |
| 6 | `Emails` | `emails` | `emails/emails.ts` |
| 7 | `Events` | `events` | `events/events.jsx` |
| 8 | `InsuranceInvoices` | `insuranceInvoices` | `invoices/insuranceInvoices/insuranceInvoices.js` |
| 9 | `Invitations` | `invitations` | `invitations/invitations.jsx` |
| 10 | `Invoices` (Stripe) | `stripeInvoices` | `invoices/stripeInvoices/stripeInvoices.jsx` |
| 11 | `LongTherapyPlan` | `longTherapy` | `patientFiles/longTherapyPlan.jsx` |
| 12 | `MethodLogger` | `method-logs` | `logger/logger.js` |
| 13 | `Newsfeed` | `newsfeed` | `newsfeed/newsfeed.js` |
| 14 | `Notifications` | `notifications` | `notifications/notifications.jsx` |
| 15 | `PatientFileInvoices` | `invoices` | `invoices/patientFileInvoices/patientFileInvoices.js` |
| 16 | `PatientFileReports` | `patientFileReports` | `patientFileReports/patientFileReports.jsx` |
| 17 | `PatientFileUsers` | `patientFileUsers` | `patientFileUsers/patientFileUsers.jsx` |
| 18 | `PatientFiles` | `patientFiles` | `patientFiles/patientFiles.jsx` |
| 19 | `Plans` | `plans` | `payments/plans.jsx` |
| 20 | `PracticeChatCol` | `practicechat` | `practice/practiceChat.jsx` |
| 21 | `Practices` | `practices` | `practice/practices.jsx` |
| 22 | `PracticeUsers` | `practiceUsers` | `practiceUsers/practiceUsers.jsx` |
| 23 | `Referrals` | `referrals` | `referrals/referrals.js` |
| 24 | `Riziv` | `riziv` | `riziv/riziv.jsx` |
| 25 | `Subscriptions` | `subscriptions` | `subscriptions/subscriptions.jsx` |
| 26 | `TeamMeeting` | `teammeeting` | `practice/teammeeting.jsx` |
| 27 | `Todos` | `todos` | `todo/todos.js` |
| 28 | `Treatments` | `treatments` | `treatments/treatments.js` |
| — | `Meteor.users` | `users` | `users/users.jsx` |

Collision alert: both `PatientFileInvoices` (Mongo `invoices`) and `Invoices` (Mongo `stripeInvoices`) are imported as `Invoices` in some call sites — always check which module an import resolves through.
