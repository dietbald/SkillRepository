# Methods

Reference for every Meteor method declared under `app/imports/api/`. Methods are organised by API module.

## Method declaration patterns

Halingo defines methods through three wrapper classes — never directly via `Meteor.methods({...})` for production code. The wrappers normalise auth, permission checks, validation, and audit logging.

| Wrapper | File | Purpose |
|---|---|---|
| `ValidatedMethod` (mdg) | `meteor/mdg:validated-method` | Standard validated method, no auth check. Used only for `users.register` (`api/users/methods.jsx:62`) and the email send/verify flow that runs before login. |
| `LoggedInValidatedMethod` | `app/imports/lib/permissions/LoggedInValidatedMethod.jsx` | Wraps `ValidatedMethod` with `if (!this.userId) throw NOT_AUTHORIZED`. The default for any logged-in action that does not require a per-resource permission. |
| `PermissionValidatedMethod` | `app/imports/lib/permissions/PermissionValidatedMethod.jsx` | Adds a `permissions: [...]` array (or implicit one derived from `name`) and a `getPermissionData(args)` resolver that returns `{ patientFileId, practiceId }`; the method body is only entered if `Permissions.checkPermission(...)` succeeds for every entry. |

There is exactly one bare `Meteor.methods({...})` call: `impersonateUser` in `app/imports/api/shared/methods.js:49`. It hand-checks the `roles` array on the current user.

The `subscription: true` option on a `PermissionValidatedMethod` (or a `LoggedInValidatedMethod`) gates the method on the practice having an active subscription — `app/imports/api/practice/util.jsx` exports the helper. A handful of methods (like `events.create`, `events.update`, `events.remove`) gate dynamically with `subscription({event}) { return event.type !== 3 }` so private appointments work even on a cancelled subscription.

The `log: false` option (only used for `users.email.change` at `methods.jsx:232`) suppresses audit logging into the `MethodLogger` collection — every other method is logged.

In what follows, **purpose** is a one-sentence summary; precise behaviour is in the cited source line.

---

## agendaSettings · `app/imports/api/agendaSettings/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `agenda.settings.update` | LoggedIn, both | `AgendaSettings.schema` minus (`userId`, `createdAt`, `removed`) plus `confirmed: Boolean?` | upsert result | Upserts the caller's `AgendaSettings`; if `useStartEnd` changes and existing events would fall outside the new bounds, throws `events_outside_of_constraints` unless `confirmed` is true. | `methods.js:5` |
| `agenda.settings.get` | LoggedIn, server | none | `{customRangeDays: 3}` or the doc | Returns the caller's `AgendaSettings` document. | `methods.js:57` |

---

## clientErrors · `app/imports/api/clientErrors/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `errors.client.log` | LoggedIn, server | `{name, error, params}` from `ClientErrors.schema` (createdAt/userId stripped) | — | Inserts a `ClientErrors` document attributed to the caller; uses `this.unblock()` so it never delays the client. | `methods.js:4` |

---

## emails · `app/imports/api/emails/methods.ts`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `patientFile.view.emails` | Permission `[patientFile.view]`, server | `{patientFileId: String}` | `Emails[]` sorted by `sentAt` desc | Returns all `emails` for a patient, scoped via `getPermissionData` resolving the patient's `practiceId`. | `methods.ts:7` |

---

## events · `app/imports/api/events/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `events.create` | Permission, both | dirty event object (no schema validation up-front) | — | Creates one or many events (handles repeats internally) and pushes them to Rosa. Cross-user creation requires `practice.events.add.otherUser` and forbids type 2 / 3. | `methods.js:15` |
| `events.remove` | LoggedIn, both | `{eventId?, repeatId?, groupId?}` | — | Removes a single event, all events of a `repeatId` from a date forward, or all events of a `groupId`. Refuses if any target has an `invoiceId`. | `methods.js:79` |
| `events.remove.between` | LoggedIn, both | `{userId, practiceId, start, end}` | — | Removes all uninvoiced events for a user in a window; cross-user requires `practice.events.add.otherUser`. | `methods.js:127` |
| `events.update.startAndEnd` | LoggedIn, both | `{eventId, start, end}` | update count | Drag-and-drop reschedule; pushes to Rosa. | `methods.js:203` |
| `events.update` | LoggedIn, both | `{eventId, repeatId?, groupId?, fields}` | update count | Generic event update; if `repeatId` is present, only the four cosmetic fields propagate to siblings. | `methods.js:258` |
| `events.add.patientFile` | LoggedIn, both | `{patientFileId, groupId}` | — | Adds a patient as an additional attendee on a group event. | `methods.js:355` |
| `events.get.between` | LoggedIn, both | `{start, end, limit}` (no schema) | `Events[]` with patient names | Returns the caller's events overlapping a date range. | `methods.js:402` |
| `events.get.uninvoiced` | LoggedIn, server | `{patientFileId?, practiceId?, userId?}` | `Events[]` | Returns events not yet billed; cross-user requires `invoices.statistics`. | `methods.js:430` |
| `events.get.previous` | LoggedIn, both | `{date, patientFileId}` (no schema) | `Event` or null | Last event for the patient before `date`. | `methods.js:478` |
| `events.canBePaidBack` | LoggedIn, server | `event` (no schema) | Boolean | Returns whether the event qualifies as reimbursable; throws if no valid bilan covers it. | `methods.js:493` |
| `patientFile.therapies.short.edit` | Permission, both | `{eventId, therapyPlan: String}` | update count | Updates the short-term therapy plan inline on a single event. | `methods.js:517` |
| `events.statistics` | LoggedIn, server | `{practiceId, userId?, years?}` | `{years, [year]: stats}` | Returns per-year session stats; cross-user requires `events.statistics`. | `methods.js:542` |
| `events.sync.rosa` | Permission, server | `{practiceId}` | — | Triggers an on-demand pull of events from Rosa for the caller. | `methods.js:593` |

---

## invitations · `app/imports/api/invitations/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `invitations.accept` | LoggedIn, server | `{token: String}` | `{redirect, message, sessionVariables}` | Resolves an invitation token, joins the practice, returns redirect details. Server-only via dynamic import. | `methods.jsx:15` |
| `invitations.remove` | Permission, both | `{invitationId}` | Boolean | Removes a pending invitation; permission resolved from the invitation's `data` (which holds `practiceId`). | `methods.jsx:29` |

---

## invoices.commissionInvoices · `app/imports/api/invoices/commissionInvoices/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `practice.commission.generate` | Permission, server | `{practiceId}` | `{success, error}` | Walks each `PracticeUser` and back-fills `CommissionInvoices` for every month since `commission.modifiedAt`; for percentage rates, attaches uncommissioned events. | `methods.js:17` |
| `invoices.commission.search` | LoggedIn, server | `{filter?, limit?, sort?, query?, practiceId}` | search result | Faceted search over `CommissionInvoices` for one practice. | `methods.js:88` |
| `practice.commission.update.amount` | (Permission, server) | `{invoiceId, amount}` | update count | Manually overrides a commission invoice's amount. | `methods.js:181` |
| `practice.commission.update.state` | (Permission, server) | `{invoiceId, status}` (`open`/`paid`) | update count | Marks commission invoice paid / re-opens. | `methods.js:192` |
| `practice.commission.remove` | (Permission, server) | `{invoiceId, practiceId}` | remove count | Removes a commission invoice and rolls its events back into the open pool. | `methods.js:207` |
| `practice.commission.getOpenAmount` | LoggedIn, server | `{practiceId, userId?}` | Number | Returns total `OPEN` commission amount for a (user, practice). | `methods.js:241` |
| `practice.commission.hasCommissionInvoices` | LoggedIn, server | `{practiceId}` | Boolean | Returns whether any commission invoices exist for this practice. | `methods.js:318` |

---

## invoices.insuranceInvoices · `app/imports/api/invoices/insuranceInvoices/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `invoices.insurance.add.all` | LoggedIn, server | `{splitOnPatient?, practiceId, userId}` | result | Builds Verzamelstaten from all open patient invoices for `userId` in `practiceId`; optionally one per patient instead of one per insurance fund. | `methods.js:19` |
| `invoices.insurance.edit.state` | LoggedIn, server | `{invoiceId, state}` (excludes `canceled`) | update count | Sets state and cascades to embedded certificates of the linked patient invoices via `arrayFilters`. | `methods.js:65` |
| `invoices.insurance.edit.structuredAnnouncement` | LoggedIn, server | `{invoiceId, structuredAnnouncement}` | update count | Edits the OGM. | `methods.js:117` |
| `invoices.insurance.search` | LoggedIn, server | `{filter?, limit?, sort?, query?, practiceId}` | search result | Search over `InsuranceInvoices`. | `methods.js:158` |
| `invoices.insurance.print` | LoggedIn, server | `{invoiceId}` | binary or path | Generates the printed Verzamelstaat PDF. | `methods.js:232` |
| `invoices.insurance.printInvoicesPractice` | LoggedIn, server | `{practiceId, ...}` | binary | Bulk prints all open insurance invoices for the practice. | `methods.js:275` |
| `invoices.insurance.cancel` | LoggedIn, server | `{invoiceId}` | update count | Marks an insurance invoice canceled and reverts certificate states. | `methods.js:318` |

---

## invoices.patientFileInvoices · `app/imports/api/invoices/patientFileInvoices/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `invoices.add.all.therapists` | LoggedIn, server | `{practiceId, eventIds[]}` | `{success, errors}` | Bulk-creates patient invoices from a set of event IDs, splitting on (patientFile, user) pairs and on `MAX_TREATMENTS_PER_CERTIFICATE = 34`. Cross-user creation requires `invoices.generate`. | `methods.js:22` |
| `invoices.add.patient` | LoggedIn, server | `{patientFileId, practiceId?, userId?}` | invoice id | Creates a single patient invoice from all open events for that patient. | `methods.js:116` |
| `invoices.edit.state` | LoggedIn, server | `{invoiceId, state?, stateInsurance?}` | update count | Updates either patient-side or insurance-side state; refuses if invoice is canceled. | `methods.js:160` |
| `invoices.certificate.edit.state` | (LoggedIn, server) | `{invoiceId, certificateId, state}` | update count | Edits state of a single embedded certificate. | `methods.js:223` |
| `invoices.edit.administrationCost` | (LoggedIn, server) | `{invoiceId, administrationCost}` | update count | Sets the per-invoice administration fee. | `methods.js:293` |
| `invoices.search` | LoggedIn, server | `{filter, limit, sort, practiceId, userId?, query?}` | search result | Faceted search across patient invoices for a practice. | `methods.js:330` |
| `invoices.edit.structuredAnnouncement` | (LoggedIn, server) | `{invoiceId, structuredAnnouncement}` | update count | Edits the OGM. | `methods.js:433` |
| `invoices.print` | (LoggedIn, server) | `{invoiceId}` | binary | Renders a single patient invoice PDF. | `methods.js:470` |
| `invoices.prints` | (LoggedIn, server) | `{invoiceIds[]}` | bundle | Bulk-renders multiple patient invoices. | `methods.js:497` |
| `invoices.printInvoicesPractice` | (LoggedIn, server) | `{practiceId, ...}` | bundle | Bulk-renders all open invoices for a practice. | `methods.js:526` |
| `invoices.mail` | (LoggedIn, server) | `{invoiceId, ...}` | — | Sends a patient invoice via email and writes the `Emails` audit row. | `methods.js:569` |
| `invoices.cancel` | (LoggedIn, server) | `{invoiceId, void?}` | — | Soft- or hard-cancels an invoice; releases its events. | `methods.js:603` |
| `invoices.certificates.generate` | (LoggedIn, server) | `{invoiceId}` | — | Allocates new certificate numbers from the user's `certificateNumber.bookNumber` sequence. | `methods.js:632` |
| `invoices.certificates.print` | (LoggedIn, server) | `{invoiceId}` | binary | Prints just the certificates (matrix-printer mode supported). | `methods.js:698` |
| `invoices.statistics.earnings` | LoggedIn, server | `{practiceId, userId?, years?}` | aggregate | Earnings stats per year for the EarningsGraph. | `methods.js:779` |
| `invoices.statistics` | LoggedIn, server | `{practiceId, userId?}` | aggregate | Open vs. closed invoice counts. | `methods.js:842` |
| `invoices.hasThirdPayer` | LoggedIn, server | `{patientFileId}` | Boolean | Returns whether the patient currently has any third-payer invoices. | `methods.js:873` |

---

## newsfeed

No methods file. The newsfeed is read-only client-side; admin writes happen via direct DB ops (or are not exposed). See `publications.md` for the publish.

---

## notifications · `app/imports/api/notifications/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `notifications.seen` | LoggedIn, both | none | Boolean | Bulk-marks all `NEW` notifications for the user as `SEEN`. | `methods.js:7` |
| `notifications.read` | LoggedIn, both | none | Boolean | Bulk-marks all non-`READ` notifications for the user as `READ`. | `methods.js:19` |
| `notifications.delete` | LoggedIn, both | `{notificationId}` | remove count | Soft-deletes a single notification. | `methods.js:31` |

---

## patientFileReports · `app/imports/api/patientFileReports/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `patientFile.reports.add` | Permission, both | `{name, patientFileId, tags?, treatmentId?}` | report id | Inserts a `PatientFileReports`, seeds the report body with `<h1>{practice.name}</h1>`, and merges tags into `PatientFiles.files.tags`. | `methods.jsx:10` |
| `patientFile.reports.edit` | Permission, both | `{reportId, patientFileId, report: {name, report?, tags?, treatmentId?}}` | update count | Updates the report and re-syncs the patient's tag index via `PatientFilesUtil.updateTags`. | `methods.jsx:56` |
| `patientFile.reports.delete` | Permission, both | `{reportId}` | remove count | Removes a report. | `methods.jsx:102` |
| `patientFile.demandForm.add` | Permission `[patientFile.reports.add]`, server | `{fillInfo, patientFileId, startDate, tags?, treatmentId, type}` | demand form | Generates a "demand for reimbursement" form (first or extension) via `PatientFilesUtil.generateDemandForm`. | `methods.jsx:134` |

---

## patientFiles · `app/imports/api/patientFiles/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `patientFile.update` | Permission, both | `{patientFileId, fields}` (fields = `PatientFiles.schema` minus immutables) | update count | Updates the patient file, uppercases `doctor.name`/`prescriber.name`, pushes to Rosa, and cascades name/image changes to existing patient invoices. | `methods.jsx:27` |
| `patientFile.update.isThirdPayer` | Permission `[patientFile.update]`, both | `{isThirdPayer, patientFileId}` | update count | Toggles third-payer status. | `methods.jsx:94` |
| `patientFile.merge.patientFiles` | Permission `[patientFile.update]`, server | `{patientFileId, mergeIntoId}` | id | Merges one patient file into another via Rosa's merge endpoint; checks `patientFile.update` permission for both files and rejects same-id merges. | `methods.jsx:126` |
| `patientFile.update.tags` | Permission `[patientFile.update]`, both | `{patientFileId, tags[]}` | update count | Replaces tag list (de-duplicated). | `methods.jsx:181` |
| `patientFile.add` | Permission, server | `PatientFiles.schema` minus immutables | new id | Creates a patient file via `PracticeUtil.addPatientFile` and pushes to Rosa. | `methods.jsx:213` |
| `patientFile.remove` | Permission, server | `{patientFileId}` | Boolean | Soft-removes the patient file and pushes the deletion to Rosa. | `methods.jsx:231` |
| `patientFile.search` | LoggedIn, server | `{filter?, limit?, practiceId, sort?, userId?, query}` | search result | Faceted patient search; without `patientFile.view` permission, restricts to files the caller is linked to. | `methods.jsx:275` |
| `patientFile.grantAccess` | Permission, server | `{patientFileId, userId, role?}` | Boolean | Inserts a `PatientFileUsers` record, sends a share notification & email, refreshes Rosa permissions. | `methods.jsx:407` |
| `patientFiles.grantAccess` | Permission `[patientFile.grantAccess]`, server | `{patientFileIds[], userId, role?}` | Boolean[] | Bulk version of `grantAccess`. Permission is gated on the first file; rejects mixed practices. | `methods.jsx:441` |
| `patientFile.removeAccess` | Permission, server | `{patientFileId, userId}` | remove count | Removes a `PatientFileUsers` record; throws `USER_HAS_EVENTS_WITH_THIS_PATIENT` if the user still has events linked. | `methods.jsx:512` |
| `patientFiles.get` | LoggedIn, server | `{patientFileIds[], practiceId}` | `PatientFiles[]` | Returns multiple patient files filtered by permission. | `methods.jsx:564` |
| `patientFiles.view` | Permission `[]`, server | `{practiceId, query?, treatmentType?}` | `PatientFiles[]` | Lists patient files of a practice filtered by permission and optionally by treatment type / name. | `methods.jsx:598` |
| `patientFile.count` | LoggedIn, server | `{practiceId, userId?}` | `{state: count}` | Aggregates patient counts grouped by `state`; cross-user requires `patientFile.count`. | `methods.jsx:651` |
| `patientFile.documents.edit` | Permission `[patientFile.reports.edit]`, both | `{name, patientFileId, documentId, tags?, treatmentId?}` | update count | Edits a `Documents` (FilesCollection) entry's metadata. | `methods.jsx:720` |
| `patientFile.documents.delete` | Permission `[patientFile.reports.delete]`, both | `{documentId}` | remove count | Removes a document. | `methods.jsx:772` |
| `patientFile.therapies.long.add` | Permission, both | full `LongTherapyPlan` schema | id | Adds a long-term therapy goal. | `methods.jsx:808` |
| `patientFile.therapies.long.edit` | Permission, both | `{_id, ...full schema}` | update count | Edits a goal. | `methods.jsx:849` |
| `patientFile.therapies.long.delete` | Permission, both | `{therapyId}` | remove count | Removes a goal. | `methods.jsx:901` |
| `patientFile.importantInfo` | Permission `[patientFile.view]`, server | `{patientFileId}` | `{nextEvent, nbEvents, nbEventsAbsent, treatmentEndDate, nbInvoiceOpen, openAmount}` | Aggregates the "important info" widget on the patient dashboard. | `methods.jsx:928` |
| `patientFile.sync.rosa` | Permission `[]`, server | `{practiceId}` | — | On-demand patient pull from Rosa. | `methods.jsx:1002` |

---

## payments / subscriptions · `app/imports/api/subscriptions/methods.jsx`

(File location is in `subscriptions/`, but it lives near payment-related logic.)

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `plans.get` | LoggedIn, both | `{planName}` | `Plan` or null | Returns a plan by name. | `methods.jsx:21` |
| `practice.subscriptions.plan.change` | LoggedIn, both | `{subscriptionId, plan}` | result | Changes the plan of a subscription (gated on `practice.subscriptions.plan.change` permission). | `methods.jsx:33` |
| `practice.subscriptions.payment.change` | LoggedIn, both | `{subscriptionId, method, sourceId?}` | result | Changes payment method between `bancontact` and `card`; `sourceId` required for `card`. | `methods.jsx:55` |

---

## practice · `app/imports/api/practice/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `practice.chat` | Permission, both | `{message, practiceId}` | new id | Inserts a `PracticeChatCol` message. | `methods.jsx:24` |
| `practice.chat.read` | Permission, both | `{messages: blackbox, practiceId}` | — | Marks a set of messages as read by the caller. | `methods.jsx:48` |
| `practice.add` | LoggedIn, both | `{info: addPracticeSchema, plan, payment?}` | new practice id | Creates a new practice (and its first user, owner role) and starts a subscription. | `methods.jsx:85` |
| `practice.update` | Permission, both | `{_id, ...settable fields}` | update count | Updates branding / contact / address / VAT / IBAN. | `methods.jsx:103` |
| `practice.settings.update` | Permission, both | `{practiceId, ...settings subtree}` | update count | Updates the `settings.*` subtree (chat, invoices, patientFiles notifications). | `methods.jsx:131` |
| `practice.user.invite` | Permission, both | `{email, practiceId}` | invitation | Invites a new user; refuses if the plan's user limit is reached (counting active and pending). | `methods.jsx:153` |
| `practice.user.invite.remove` | Permission, both | `{email, practiceId}` | — | Cancels an outstanding invitation. | `methods.jsx:177` |
| `practice.user.remove` | Permission, both | `{userId, practiceId}` | — | Removes a user from a practice. (Rosa removal is currently commented out at lines 205-208.) | `methods.jsx:187` |
| `practice.user.role.change` | Permission, both | `{userId, practiceId, role}` | — | Changes a user's role; rejects `owner` (use `makeOwner` instead). Cascades Rosa permission updates. | `methods.jsx:215` |
| `practice.user.makeOwner` | Permission, both | `{userId, practiceId}` | — | Atomically transfers ownership: sets target to `owner`, demotes the caller to `admin`. | `methods.jsx:256` |
| `practice.therapists.view` | LoggedIn, both | `{practiceId, query}` | `User[]` | Returns therapists in a practice (publicFields only). | `methods.jsx:292` |
| `practice.subscriptions.cancel` | LoggedIn, both | `{subscriptionId}` | — | Cancels a subscription at end of period. | `methods.jsx:318` |
| `practice.subscriptions.resume` | LoggedIn, both | `{subscriptionId}` | — | Reverses a `cancelAtPeriodEnd` flag. | `methods.jsx:342` |
| `practice.subscriptions.select` | LoggedIn, both | `{practiceId, plan, payment?}` | new sub id | Selects a plan; routes to Bancontact (Halingo subscription job) or Stripe based on `payment.method`. | `methods.jsx:366` |
| `practice.invoices.pay` | LoggedIn, both | `{invoiceId}` | source | Creates a Stripe payment source for a Halingo SaaS invoice. | `methods.jsx:396` |
| `practice.invoices.check` | LoggedIn, both | `{invoiceId}` | source state | Re-checks the source for a SaaS invoice payment. | `methods.jsx:420` |
| `practice.certificate.get` | LoggedIn, both | `{practiceId}` | `{vatInfo, address, name}` | Returns the practice header used on certificates. | `methods.jsx:440` |
| `practice.vat.check` | LoggedIn, server | `{countryCode, vatNumber}` | VIES result | Validates a VAT number against the EU VIES service via `practicesUtil.checkVat`. | `methods.jsx:462` |

---

## practiceUsers · `app/imports/api/practiceUsers/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `practice.user.update.info` | Permission, both | `{info?, practiceId, userId}` | Boolean | Updates the free-text info field on a `PracticeUsers` row. | `methods.jsx:16` |
| `practice.user.update.commission` | Permission, both | `CommissionSchema + {practiceId, userId}` | Boolean | Updates a user's commission settings; auto-stamps `modifiedAt` to first of current month if previously unset. The `after.update` hook then back-fills `CommissionInvoices`. | `methods.jsx:32` |
| `practice.user.update.publickeys` | Permission, both | `{practiceId}` | true | Generates `publicAgendaKey` for any user missing one and `privateAgendaKey` for the caller (gated on permission). | `methods.jsx:54` |
| `practice.user.update.privateKey` | LoggedIn, both | `{practiceId}` | true | Sets `privateAgendaKey` for the caller's own row only. | `methods.jsx:75` |
| `practice.user.get.practiceusers` | Permission, both | `{practiceId}` | `PracticeUsers[]` merged with `Users` | Returns staff list for a practice. | `methods.jsx:92` |

Note that `updateInfoSchema`, `updateCommissionSchema`, and `updateAgendaKeysSchema` all use `SimpleSchema.RegEx.id` (lowercase `i`) at lines 13-14, 29-30, and 51, which is **not** a valid SimpleSchema regex (`SimpleSchema.RegEx.Id` with uppercase `I` is the canonical form). The schema validator therefore does not enforce the ID format on these parameters — a latent bug.

---

## referrals · `app/imports/api/referrals/methods.js` and `server/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `referrals` | LoggedIn, server | none | `Referrals[]` | Returns the caller's referral history. | `methods.js:6` |
| `referrals.invite` | LoggedIn, server | `{email, text?}` | — | Stub: validation only; the run body is empty (`{}`). The actual invite logic must live in `server/methods.js`. | `methods.js:14` |

`server/methods.js` is 24 lines and contains additional referral processing not surfaced in the wrapper.

---

## riziv · `app/imports/api/riziv/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `physisians-by-name` | LoggedIn, both | `name: String` (no schema) | `Riziv[]` | Searches the local `Riziv` collection by first/last name (case-insensitive regex). Note the typo `physisians`. | `methods.js:6` |
| `riziv-nr-by-name` | LoggedIn, server | `name: String` (no schema) | `String` | Calls the external RIZIV web service via `RizivHelper.getPractitionersByName`; resolves to `${Nihdi}${QualificationCode}` if exactly one match (retries with `reverse: true` once). | `methods.js:29` |

---

## shared · `app/imports/api/shared/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `pdf.generate` | LoggedIn, server | `{html, options?}` | PDF buffer | Renders arbitrary HTML to PDF via `SharedUtil.generatePDF`. | `methods.js:6` |
| `getZipCodesByZipCode` | LoggedIn, server | `{query?}` | results | Belgian postal-code lookup by zip. | `methods.js:19` |
| `getZipCodesByCounty` | LoggedIn, server | `{query?}` | results | Belgian postal-code lookup by county. | `methods.js:34` |
| `impersonateUser` | bare `Meteor.methods`, server | `userId` | — | Admin-only impersonation; checks `roles` array contains `'admin'` and calls `this.setUserId(userId)`. **Only method declared via raw `Meteor.methods({...})`.** | `methods.js:49` |

---

## todo · `app/imports/api/todo/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `todo.create` | LoggedIn, both | `{todo: String}` | new id | Creates a todo for the caller. | `methods.js:5` |
| `todo.edit` | LoggedIn, both | `{_id, todo}` | update count | Edits the text. | `methods.js:17` |
| `todo.done` | LoggedIn, both | `{id, done}` | update count | Toggles the `done` flag. | `methods.js:25` |
| `todo.remove` | LoggedIn, both | `{id}` | remove count | Soft-removes the todo. | `methods.js:33` |

All four scope writes via `userId: this.userId` so users can only mutate their own todos.

---

## treatments · `app/imports/api/treatments/methods.js`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `treatments.add` | Permission, both | `{name, type, hasInitialBilan?, hasEvolutionBilan?, hasRelapseBilan?, hasExtensionBilan?, patientFileId}` | new id | Creates a treatment with empty bilan placeholders; throws `requireOneBilan` if no bilan flag is set. `totalSessions` defaults from `Treatments.getDisorderSessions()`. | `methods.js:23` |
| `treatments.get` | LoggedIn, server | `{patientFileId}` | `Treatments[]` | Lists treatments for a patient (requires `patientFile.view`). | `methods.js:109` |
| `treatments.edit` | Permission, both | `{id, isThirdPayer?, treatment}` | update count | Updates a treatment except its bilans / patientFileId. | `methods.js:130` |
| `treatments.edit.notification.settings` | Permission `[treatments.edit]`, both | `{id, notifications.{date?, sessions?}}` | update count | Updates the per-treatment notification thresholds. | `methods.js:154` |
| `treatments.updateHalingoSessionCount` | Permission `[treatments.edit]`, server | `{treatmentId}` | session count | Recomputes `usedSessions` from event history. | `methods.js:197` |
| `treatments.remove` | Permission, server | `{treatmentId}` | result | Removes a treatment via `treatmentsUtil.removeTreatment`. | `methods.js:222` |
| `treatment.can.be.removed` | LoggedIn, server | `{treatmentId?}` | Boolean | Returns whether removing the treatment is safe. (Note: `getPermissionData` references `patientFileId` which isn't in the validator — dead code.) | `methods.js:246` |
| `treatments.bilans.add` | Permission, both | `{treatmentId, type}` | new bilan id | Pushes a new bilan onto a treatment after re-validating. | `methods.js:271` |
| `treatments.bilans.edit` | Permission, both | `{treatmentId, bilan}` | update count | Replaces a bilan; uppercases prescriber name; if `isReimbursed` changed, calls `EventsUtil.checkEventsOfBilanType` to retroactively flag events. | `methods.js:308` |
| `treatments.bilans.remove` | Permission, server | `{bilanId, treatmentId}` | result | Removes a bilan via `treatmentsUtil.removeBilan`. | `methods.js:357` |

---

## users · `app/imports/api/users/methods.jsx`

| Method | Type | Parameters | Returns | Purpose | Source |
|---|---|---|---|---|---|
| `users.register` | bare ValidatedMethod, server | `RegisterSchema {email, password, confirmPassword, locale, ToCAccepted, referralUserId?, referralId?}` | `{userId, err?}` | Creates a user via `Accounts.createUser`, accepts terms version `"3"`, registers a referral (either by userId or by id), sends email verification. | `methods.jsx:61` |
| `users.password.reset.mail` | bare ValidatedMethod, server | `{email}` | result | Sends password-reset email via `UsersUtil.sendResetPasswordMail`. | `methods.jsx:141` |
| `users.password.changed.mail` | LoggedIn, server | none | result | Sends "your password was changed" notification. | `methods.jsx:172` |
| `users.email.verify.mail` | bare ValidatedMethod, server | `{email}` | result | Re-sends the email verification mail. | `methods.jsx:186` |
| `users.email.verify` | bare ValidatedMethod, server | `{token}` (no schema) | Boolean | Confirms an email address from a verify token. | `methods.jsx:197` |
| `users.email.change` | LoggedIn, server, `log: false` | `ChangeEmailSchema {email, confirmEmail?, password}` | `{err?}` | Changes the user's email after re-validating the password; the new address is stored as `profile.pendingEmail` and a verification mail is sent. Logging suppressed because the password is in the args. | `methods.jsx:229` |
| `user.email.remove.pending` | LoggedIn, server | none | update count | Cancels a pending email change. | `methods.jsx:262` |
| `users.profile.update` | LoggedIn, server | `Meteor.users.UserProfile` | update count | Updates `profile.*` (omits `imageUrl`). Refuses if account is locked. | `methods.jsx:272` |
| `users.profile.update.image` | LoggedIn, server | `{imageUrl}` | update count | Updates `profile.imageUrl`. Old avatars are intentionally not removed (commented out at lines 305-308) because they are referenced by historical commission invoices. | `methods.jsx:285` |
| `users.settings.update` | LoggedIn, server | `Meteor.users.UserSettings` | Boolean | Updates `settings.*`; refuses if `invoices.rizivRequired` is null. | `methods.jsx:315` |
| `users.delete` | LoggedIn, server | none | — | Deletes the caller's account via `UsersUtil.deleteUser`. Note: `UsersUtil.deleteUser` is checked for existence (`UsersUtil.deleteUser && ...`), suggesting it may not always be loaded. | `methods.jsx:331` |
| `users.terms.accept` | LoggedIn, server | none | — | Sets `acceptedTerms = "3"`. | `methods.jsx:341` |
| `users.rosa.connect` | LoggedIn, server | `{token, practiceId, calendarId?}` | — | Stores a Rosa OAuth token on `rosaIntegrations` and validates the practice match via `RosaUsers.setIntegrationTokenToUserAndCheckPractice`. | `methods.jsx:354` |
| `users.rosa.disconnect` | LoggedIn, server | `{practiceId}` | — | Marks the integration as `tokenInvalid` and `isUserInput: false`. | `methods.jsx:384` |

---

## Cross-cutting observations

### Methods with no permissions check beyond "logged in"

Every `LoggedInValidatedMethod` enforces only that the caller is authenticated. The following do not perform any further authorisation check inside `run`, even though they touch shared data:

- `events.get.between` (`events/methods.js:402`) — returns events but **only filters on `userId: this.userId`**, so it's safe in practice; however, the method takes no `practiceId` argument so cross-practice leaking would only happen if `userId` were spoofable, which it isn't.
- `events.get.previous` (`events/methods.js:478`) — same.
- `physisians-by-name` and `riziv-nr-by-name` (`riziv/methods.js`) — RIZIV registry is public-ish data; no scoping needed.
- `getZipCodesByZipCode`, `getZipCodesByCounty` (`shared/methods.js`) — public reference data.
- `pdf.generate` (`shared/methods.js`) — accepts arbitrary HTML, can render anything; **not** restricted to admins. Worth flagging as a potential SSRF / data-exfiltration vector if HTML can include `<img src>` to internal hosts.
- `notifications.read`, `notifications.seen`, `notifications.delete` (`notifications/methods.js`) — only operate on the caller's own notifications.
- `todo.*` (`todo/methods.js`) — only operate on the caller's own todos.
- `agenda.settings.*` (`agendaSettings/methods.js`) — only operate on the caller's own settings.
- `users.profile.update`, `users.settings.update`, `users.delete`, `users.terms.accept` — caller only.

### Methods that defer permission to inline `checkUserPermission`

Many methods are declared as `LoggedInValidatedMethod` but do their permission check via `practiceUsersUtil.checkUserPermission(...)` inside `run`. Examples: `practice.subscriptions.cancel`, `practice.subscriptions.resume`, `practice.subscriptions.select`, `practice.invoices.pay`, `practice.invoices.check`, `events.statistics`, `events.get.uninvoiced`, `invoices.add.all.therapists`, `invoices.add.patient`, `invoices.edit.state`, `invoices.insurance.add.all`, `invoices.insurance.edit.state`. This is functionally equivalent to `PermissionValidatedMethod` but loses the wrapper's automatic permission audit.

### Dead method: `treatment.can.be.removed`

`treatments/methods.js:246` declares `getPermissionData({ patientFileId }) { ... }` but the validator only allows `treatmentId` — `patientFileId` is undefined and the resolver returns `{}`, so no permission constraint is actually enforced. Effectively logged-in only.

### Methods declared in `app/lib/methods.js`

`app/lib/methods.js` is a 16-line scaffolding stub containing one placeholder method `lib/method_name` that does nothing (`lib/methods.js:5`). It is not imported anywhere and has no effect.

### Stubs

- `referrals.invite` (`referrals/methods.js:14`) declares the method and validates input but has an empty `run() {}`. The real referral-invite logic is on the server in `referrals/server/methods.js`.

### Total method count

Counted from the verbatim `name:` strings inside `LoggedInValidatedMethod` / `PermissionValidatedMethod` / `ValidatedMethod` / `Meteor.methods` declarations:

| Module | Method count |
|---|---|
| agendaSettings | 2 |
| clientErrors | 1 |
| emails | 1 |
| events | 13 |
| invitations | 2 |
| invoices/commissionInvoices | 7 |
| invoices/insuranceInvoices | 7 |
| invoices/patientFileInvoices | 17 |
| notifications | 3 |
| patientFileReports | 4 |
| patientFiles | 19 |
| practice | 18 |
| practiceUsers | 5 |
| referrals | 2 (+server) |
| riziv | 2 |
| shared | 4 (incl. `impersonateUser`) |
| subscriptions | 3 |
| todo | 4 |
| treatments | 10 |
| users | 14 |
| **Total** | **138** |
