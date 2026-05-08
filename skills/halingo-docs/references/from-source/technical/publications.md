# Publications

Reference for every `Meteor.publish` and `Meteor.publishComposite` declaration under `app/imports/api/`. Sorted alphabetically by publication name.

Halingo uses standard `Meteor.publish` (and `meteor/reywood:publish-composite` for parent/child cursor sets) plus the `Counts.publish` helper from the `tmeasday:publish-counts` package for unread / open counters.

## Pattern notes

- Most publications gate access via either `PatientFilesUtil.canUserViewPatientFile` or `PracticeUsersUtil.checkUserPermission`. If access is denied, the handler calls `this.ready()` (signalling immediate completion) and returns nothing — clients see an empty cursor rather than an error.
- Publications generally publish only `publicFields` (or `publicFieldsDetailed` for the caller's own user), not the full document.
- Several publications include `// TODO make reactive` comments — these still publish a static cursor and never observe changes (`commissionInvoice`, `insuranceInvoice`, `patientFileInvoice`, `practiceUsers`, `practiceUser`).

## Counts publications

In addition to data publications, several handlers register named `Counts.publish` channels readable on the client via `Counts.get(name)`:

| Counts channel | Bound from | File:Line |
|---|---|---|
| `notifications.new.count` | `notifications.new` | `notifications/server/publications.js:14` |
| `chat.practice.new.count` | `practicechat` | `practice/server/publications.jsx:111` |
| `invoices.open.statistics.sum` | `invoices.open.statistics` | `invoices/patientFileInvoices/server/publications.js:42` |
| `invoices.open.statistics.count` | `invoices.open.statistics` | `invoices/patientFileInvoices/server/publications.js:58` |

## Publications table

| Name | Parameters | Returns / scope | File:line | Scope |
|---|---|---|---|---|
| `commissionInvoice` | `(invoiceId, practiceId)` | One `CommissionInvoices` doc; falls back to caller's own row if no `practice.commission.view` permission. Marked TODO non-reactive. | `invoices/commissionInvoices/server/publications.js:7` | per-user / per-practice |
| `documentsOfPatientFile` | `(patientId)` | `Documents` cursor for the patient (via `Documents.publicFields`). Gated on `canUserViewPatientFile`. | `patientFiles/server/publications.jsx:195` | per-patient |
| `documentsOfTreatment` | `(treatmentId)` | `Documents` filtered by `meta.patientFileId` and `meta.treatmentId`. Gated on view permission. | `treatments/server/publications.js:39` | per-treatment |
| `eventWithPatientFileAndTreatment` (composite) | `(eventId)` | `Events` + linked `PatientFiles` + linked `Treatments`. Gated on event ownership or `practice.events.add.otherUser`. | `events/server/publications.js:74` | per-event |
| `events` | none | All non-removed events for `this.userId`. Effectively "all my events ever". | `events/server/publications.js:13` | per-user |
| `events.week` | none | Events for the caller in the current week (computed via `EventsUtil.getWeekDates(new Date())`). | `events/server/publications.js:65` | per-user |
| `eventsAfterNowFor` | `(duration, limit)` | Caller's events whose start or end falls within `[now, now + duration]`, capped at `limit`. | `events/server/publications.js:53` | per-user |
| `eventsBetween` | `(practiceId, start, end, userId)` | Events for one user in a window; cross-user requires `practice.events.add.otherUser`. When viewing another user, restricts to `type: 1` (appointments). | `events/server/publications.js:17` | per-user, per-practice |
| `eventsBetweenPrivate` | `(practiceId, start, end, userId)` | Events of `type ≠ 1` (meeting / private / consultation) for one user in a window. | `events/server/publications.js:34` | per-user, per-practice |
| `eventsOfPatientFile` | `(patientFileId)` | Caller's events for one patient. **No permission check** beyond `userId: this.userId`. | `events/server/publications.js:142` | per-user, per-patient |
| `eventsWithRepeatId` | `(eventId)` | All caller events sharing the given event's `repeatId` (or `eventId` if not part of a series). | `events/server/publications.js:135` | per-user |
| `groupEventsAndPatientFilesAndTreatments` (composite) | `(groupId)` | All events of a group + their patient files + treatments. Validates `groupId` is a string. | `events/server/publications.js:102` | per-group |
| `insuranceInvoice` | `(invoiceId, practiceId)` | One `InsuranceInvoices` doc; broader scope if `invoices.view` permission. Marked TODO non-reactive. | `invoices/insuranceInvoices/server/publications.js:7` | per-user / per-practice |
| `invoice` | `(invoiceId)` | One `stripeInvoices` doc. Gated on `practice.invoices.view`. | `invoices/payments/server/publications.jsx:6` | per-practice |
| `invoices.open.statistics` | `(practiceId, uId)` | Open patient invoices for `(userId, practiceId)`; publishes two count channels (sum and count). Throws on cross-user without permission. | `invoices/patientFileInvoices/server/publications.js:31` | per-user / per-practice |
| `newsfeed` | `({limit, locale})` | Newsfeed entries projected to one locale (`body.fr`/`body.nl` collapsed to `body`). Manually re-publishes via `observeChanges` to apply the projection. | `newsfeed/server/publications.js:11` | global |
| `notifications.all` | `({limit})` | Caller's notifications, sorted desc, limited. | `notifications/server/publications.js:5` | per-user |
| `notifications.new` | none | Caller's three most-recent notifications + a `notifications.new.count` channel for the badge. | `notifications/server/publications.js:12` | per-user |
| `patientFile` | `(patientId)` | One `PatientFiles` doc + the caller's `PatientFileUsers` row. Gated on `canUserViewPatientFile`. | `patientFiles/server/publications.jsx:13` | per-patient |
| `patientFileDocument` | `(documentId)` | A `Documents` entry + the caller's `PatientFileUsers` row, gated on view permission. | `patientFiles/server/publications.jsx:203` | per-document |
| `patientFileLongTherapyPlan` | `(patientFileId)` | All `LongTherapyPlan` rows for the patient + caller's `PatientFileUsers`. | `patientFiles/server/publications.jsx:222` | per-patient |
| `patientFileReport` | `(reportId)` | One `PatientFileReports` doc + caller's `PatientFileUsers`. **Bug**: line 18 passes `patientFileId: patientFileReport` (the entire doc) instead of `patientFileReport.patientFileId`. | `patientFileReports/server/publications.jsx:8` | per-report |
| `patientFileReports` | `(patientId)` | All reports for a patient. Gated on view permission. | `patientFileReports/server/publications.jsx:22` | per-patient |
| `patientFileShortTherapyPlan` | `(patientFileId)` | Events with non-null `therapyPlan` for one patient (publishes only the `therapyPlan` field plus identifiers). | `events/server/publications.js:146` | per-patient |
| `patientFileInvoice` | `(invoiceId, practiceId)` | One patient invoice. Falls back to caller's own row without `invoices.view`. Marked TODO non-reactive. | `invoices/patientFileInvoices/server/publications.js:8` | per-user / per-practice |
| `patientFilesOfPractice` | `(practiceId)` | All visible patient files of a practice for the caller, with reactive observers that switch between "everything in practice" and "only files I have access to" depending on the caller's role. | `patientFiles/server/publications.jsx:25` | per-practice |
| `plans` | none | Every `Plans` document (no scoping). | `payments/server/publications.jsx:6` | global |
| `practice` | `(practiceId)` | One practice + the caller's `PracticeUsers` row + the most recent `Subscriptions` row. Gated on `isUserOfPractice`. | `practice/server/publications.jsx:59` | per-practice |
| `practiceInvitations` | `(practiceId)` | All `joinPractice` invitations for the practice. **No permission check.** | `invitations/server/publications.js:5` | per-practice |
| `practiceInvoices` | `(practiceId)` | `stripeInvoices` for the practice excluding state `open`. Gated on `practice.invoices.view`. | `practice/server/publications.jsx:75` | per-practice |
| `practiceUser` | `(practiceId, userId)` | One `PracticeUsers` row + linked user. Gated on `practice.user.view`. Marked TODO non-reactive. | `practiceUsers/server/publications.jsx:6` | per-practice |
| `practiceUsers` | `(practiceId, includeRemoved)` | All `PracticeUsers` of a practice + linked users; if owner and `includeRemoved`, includes soft-deleted rows via `findUnsafe`. | `practiceUsers/server/publications.jsx:30` | per-practice |
| `practicechat` (composite) | `({practiceId, limit})` | Most-recent `PracticeChatCol` messages + each message's author user, plus a `chat.practice.new.count` channel for unread badge. Gated on `practice.chat`. | `practice/server/publications.jsx:98` | per-practice |
| `practices` | none | Reactive list of practices the caller belongs to (driven by an inner observer on `PracticeUsers`). | `practice/server/publications.jsx:11` | per-user |
| `pending_invoices` | `(practiceId)` | `stripeInvoices` with `state: "pending"` for the practice. | `invoices/payments/server/publications.jsx:17` | per-practice |
| `reportsOfTreatment` | `(treatmentId)` | `PatientFileReports` for the treatment. Gated on view permission. | `treatments/server/publications.js:53` | per-treatment |
| `todos` | `({limit})` | Caller's todos, sorted by `done` then `createdAt` desc. | `todo/server/publications.js:5` | per-user |
| `treatment` | `(treatmentId)` | One `Treatments` doc. Gated on view permission. | `treatments/server/publications.js:26` | per-treatment |
| `treatmentsForPatientFile` | `(patientFileId)` | All `Treatments` for the patient + caller's `PatientFileUsers` row. Marked TODO not yet reactive. | `treatments/server/publications.js:13` | per-patient |
| `uninvoicedEvents` | `({patientFileId, userId, practiceId})` | Events that haven't been billed yet for one (user, patient, practice). Cross-user requires `invoices.statistics`. | `invoices/patientFileInvoices/server/publications.js:19` | per-user |
| `users.profileData` | none | The caller's own user document with `publicFieldsDetailed`. | `users/server/publications.jsx:1` | per-user |
| `usersOfPatientFile` | `(patientId)` | All `PatientFileUsers` of a patient + the linked users. Gated on view permission. | `patientFiles/server/publications.jsx:174` | per-patient |

## Total

40 publications across 17 files.

## Notable issues

- **Permission gap on `practiceInvitations`** (`invitations/server/publications.js:5`): no permission check at all — any logged-in user who knows a `practiceId` can list invitation tokens. The token itself is not in `publicFields` (`invitations.jsx:25-28`), but the invitee email and practice id are.
- **Bug in `patientFileReport`** (`patientFileReports/server/publications.jsx:18`): the `PatientFileUsers.find` call passes `patientFileId: patientFileReport` (the whole document) rather than `patientFileReport.patientFileId`. The cursor will never match, so the publication's secondary `PatientFileUsers` cursor is always empty. The primary `PatientFileReports` cursor still works.
- **No permission check on `eventsOfPatientFile`** (`events/server/publications.js:142`) — relies entirely on `userId: this.userId` filter. Safe in practice (user can only see their own events) but doesn't enforce that the caller has access to the patient file. A user who has been removed from a patient file but still has historical events linked to that patient will continue to receive them via this publication.
- **`commissionInvoice` selector merges incorrectly** when permission check passes (`invoices/commissionInvoices/server/publications.js:12`): it overwrites the per-user fallback selector instead of `$or`-ing them — meaning a user with `practice.commission.view` cannot see their own invoices unless they also share `practiceId`. Compare to `insuranceInvoice` (`insuranceInvoices/server/publications.js:12`) and `patientFileInvoice` (`patientFileInvoices/server/publications.js:13`), which use `$or`.
- **Static `events.week` window** (`events/server/publications.js:65`): the date range is computed at publish time only — once subscribed, it does not roll forward at midnight.
