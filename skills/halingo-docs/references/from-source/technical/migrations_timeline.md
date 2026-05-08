# Migrations timeline

Reference for every migration file under `app/imports/migrations/`. Halingo uses the `percolate:migrations` package; all migrations are registered via `Migrations.add({version, up, down})` and run on Meteor startup via `Migrations.migrateTo("latest")` (`app/imports/startup/server/index.js:21-23`).

The migrations index file `app/imports/migrations/index.js` imports all 47 migration entries in order. Migrations 1–35 live as `migration-vNN.js` files at the top level of `migrations/`; migrations 36–47 each live in their own numbered subdirectory `migrations/NN/migration.js`.

## Migration table

| Version | Filename | What it does | Status | Related feature |
|---|---|---|---|---|
| 1 | `migration-v1.js` | Refactors patient files / treatments from the old `disorder` field to the new RIZIV `type` field (a, b.1–b.6.5, c.1–c.2, d, e, f); seeds names `Handicap`, `Afasie`, `Taalstoornis`, etc. and adds a `supplementaryInsurance` placeholder. | enabled | RIZIV nomenclature, treatments |
| 2 | `migration-v2.js` | Backfills `practice.*` snapshot and `user.*` snapshot fields onto every existing `PatientFileInvoices` document. | enabled | Invoices, denormalisation |
| 3 | `migration-v3.js` | Wipes all `CommissionInvoices` and unsets `commissionInvoiceId` from invoices, then re-runs commission generation. | enabled | Commissions |
| 4 | `migration-v4.js` | Removes the legacy `healthInsurance` field from every `PatientFiles` document. | enabled | Patient files cleanup |
| 5 | `migration-v5.js` | Backfills `practice.image` and `practice.name` snapshot onto `InsuranceInvoices`. | enabled | Insurance invoices, denormalisation |
| 6 | `migration-v6.js` | Backfills `practice` snapshot onto Stripe `Invoices`. | enabled | Stripe invoices |
| 7 | `migration-v7.js` | Renames subscription plan codes: `FREE → BASIC`, `SINGLE → STANDARD`, `PRACTICE → PREMIUM`. | enabled | Plans |
| 8 | `migration-v8.js` | Sets `status: "ACTIVE"` on every subscription with `activeUntil: null`. | enabled | Subscriptions |
| 9 | `migration-v9.js` | Removes the legacy `description` field from every `Plans` document. | enabled | Plans |
| 10 | `migration-v10.js` | Re-runs `CommissionInvoicesUtil.updateCommissionNewEvent` for events that have a `commissionInvoiceId` but no `treatmentId`. | enabled | Commissions |
| 11 | `migration-v11.js` | Runs `treatments.updateHalingoSessionCount` against every treatment. | enabled | Session counters |
| 12 | `migration-v12.js` | For every `notifications.patientFile.shared.title` notification, attempts to attach the matching `patientFileId` and `practiceId` based on the recipient's `PatientFileUsers`; logs errors when ambiguous. | enabled | Notifications |
| 13 | `migration-v13.js` | Sets `settings.invoices.rizivRequired = true` on every user (introducing the new opt-out). | enabled | User settings |
| 14 | `migration-v14.js` | Sets `profile.locale = 'nl'` on every user and `settings.invoices.locale = 'nl'` on every practice. | enabled | i18n |
| 15 | `migration-v15.js` | Backfills `patient.SSN` (INSZ) onto every `PatientFileInvoices` from the source patient file. | enabled | Invoices, INSZ |
| 16 | `migration-v16.js` | Migrates legacy `commissionRate` field on `CommissionInvoices` to the new `commission` sub-document with explicit `type` (PERCENTAGE / FIXED_AMOUNT) and recomputes `date` from year/month. | enabled | Commissions |
| 17 | `migration-v17.js` | Removes all open commission invoices and re-runs `generateCommissionInvoices` per practice. | enabled | Commissions cleanup |
| 18 | `migration-v18.js` | Backfills `settings.invoices.mail.color` (from the old `settings.invoices.color`) and `settings.invoices.mail.template = 0` on every practice. | enabled | Invoice email templates |
| 19 | `migration-v19.js` | Large clean-up of inconsistent events vs. patient invoices: re-attaches removed events that are referenced from a paid invoice; resets corrupted commission invoices; re-runs session counters. | enabled | Data integrity |
| 20 | `migration-v20.js` | Pre-existing Bancontact subscriptions: creates initial Stripe invoices via `StripeInvoicesUtil.createInvoice` for each active subscription. | enabled | Subscriptions / Stripe transition |
| 21 | `migration-v21.js` | Migrates legacy `stateInsurance` field on `PatientFileInvoices` into per-certificate `state` (or `insuranceInvoiceState`). | enabled | Invoices |
| 22 | `migration-v22.js` | Removes the legacy `repeat.numberSessions` field from events that still have it (uses raw `$where` JS predicate to find them). | enabled | Events / repeat events |
| 23 | `migration-v23.js` | For each patient file: splits `contactPersons.$.name` and `school.teachers/coordinators.$.name` into `firstName`/`lastName`. Renames `school.teacher` → `school.teachers`. | enabled | Patient files |
| 24 | `migration-v24.js` | Migrates the long-term therapy plan from `therapyGoal`/`description` to the new `category`/`goal` fields, defaulting `priority: HIGH`. | enabled | Long-term therapy plan |
| 25 | `migration-v25.js` | Re-shapes `Treatments.bilans.start`/`end` data — combines bilan dates that previously lived in separate documents. | enabled | Treatments / bilans |
| 26 | `migration-v26.js` | Sets `notifications.enabled: true` on every existing treatment. | enabled | Treatments / notifications |
| 27 | `migration-v27.js` | Maps free-text insurance fund names (NL and FR) on `PatientFileInvoices` to the structured numeric `insuranceCode` (e.g. `Liberale mutualiteit Brabant 403 → 403`, `FSMB → 306`). | enabled | Invoices / insurance lookup |
| 28 | `migration-v28.js` | **Rosa integration v1**: runs `SetupPracticesInRosa()` — pushes practice metadata to Rosa for the first time. | enabled | Rosa integration |
| 29 | `migration-v29.js` | **Rosa integration**: runs `pushPatientRecordsToRosa()` — initial patient sync. | enabled | Rosa integration |
| 30 | `migration-v30.js` | **Rosa integration**: runs `pushEventsToRosa()` — initial event sync. | enabled | Rosa integration |
| 31 | `migration-v31.js` | **Rosa integration**: runs `pushMissingMotiveToRosa()` — fills missing event-motive references. | enabled | Rosa integration |
| 32 | `migration-v32.js` | **Rosa integration**: re-runs `pushEventsToRosa()` (a fix-up pass for v30). | enabled | Rosa integration |
| 33 | `migration-v33.js` | **Stripe upgrade**: runs `subsToNewStripe()` (defined in `subs-to-new-stripe.ts`) — migrates legacy subscriptions to the new Stripe API model. | enabled | Stripe |
| 34 | `migration-v34.js` | Removes commission invoices since 1 Jan 2022 with `status: OPEN` and re-runs `generateCommissionInvoices` for affected practices. | enabled | Commissions cleanup |
| 35 | `migration-v35.js` | Runs `updateTreatmentSessionCount()` (defined in `update-treatment-session-count.ts`) — re-derives `usedSessions` for every treatment from event history. | enabled | Treatments / session counters |
| 36 | `36/migration.js` | Runs `addMissingMotives()` — backfills missing Rosa motives. | enabled | Rosa |
| 37 | `37/migration.js` | Runs `pushEventsSchoolRosa()` — pushes school-location events to Rosa. | enabled | Rosa |
| 38 | `38/migration.js` | Same shape as v34 — removes 2022+ open commission invoices and re-generates per practice. The `updateTreatmentSessionCount` import at line 5 is **commented out**. | enabled | Commissions cleanup |
| 39 | `39/migration.js` | Runs `updateTreatmentSessionCount()` again. | enabled | Treatments |
| 40 | `40/migration.js` | Runs `pushEventsSchoolRosa()` (again) and `addFreeMonth()` (defined in `40/add-free-month.ts`) — adds a free month to certain subscriptions. | enabled | Rosa, subscriptions |
| 41 | `41/migration.js` | **Hard-coded data fix.** For `userId: "FtiCso8brE5GWNu3W"`, removes Rosa-pulled events on/after 2022-11-01 that duplicate manually-created events. | enabled | Rosa data fix |
| 42 | `42/migration.js` | **Hard-coded data fix.** For `userId: "FtiCso8brE5GWNu3W"` and three specific patient file IDs, removes from-Rosa events on/after 2022-11-01. | enabled | Rosa data fix |
| 43 | `43/migration.js` | **Hard-coded data fix.** Same shape as 41, but for events on/after 2022-11-21. | enabled | Rosa data fix |
| 44 | `44/migration.js` | **Hard-coded data move.** Copies all patient files, reports, treatments, long-therapy plans of `originalUserId: "BeAkepCYwEAcKDDZE"` / `originalPracticeId: "Ka22K3W5xknoEtXvE"` to `newUserId: "eBJWj3KmT4pTTuRiP"` / `newPracticeId: "BH8p9GZTYjFKebq9R"` (a practice split). | enabled | Practice migration |
| 45 | `45/migration.js` | Runs `updateTreatmentSessionCount()` (third invocation of this helper). | enabled | Treatments |
| 46 | `46/migration.js` | Runs `addMissingInvoices()` (defined in `add-missing-invoices.ts`) — back-creates patient invoices for completed events that were never billed. | enabled | Invoices recovery |
| 47 | `47/migration.js` | **Empty.** `up()` is `async function () {}`. | enabled (no-op) | placeholder |

## Helper modules used by migrations

| File | Used by |
|---|---|
| `migrations/subs-to-new-stripe.ts` | v33 |
| `migrations/update-treatment-session-count.ts` | v35, v39, v45 (and conditionally v38) |
| `migrations/add-missing-invoices.ts` | v46 |
| `migrations/36/add-missing-motives.ts` | v36 |
| `migrations/37/push-events-school-rosa.ts` | v37, v40 |
| `migrations/40/add-free-month.ts` | v40 |

## Feature timeline

The migration history doubles as the closest thing this project has to a changelog. Reading them in order:

**v1 (RIZIV nomenclature foundation, ~2017)** is the oldest substantive migration: it establishes the `a / b.1 / b.2 / … / f` disorder taxonomy that is still hard-coded in `Treatments.getTypes()` and `Treatments.getDisorderCodes()` today, and it introduces `supplementaryInsurance` as a separate code.

**v2 — v6 (denormalisation pass)** flatten practice and user identity onto every kind of invoice. This is the moment Halingo committed to the "snapshot at issue time" model — historical invoices stop changing when the source documents change. v15 extends this to patient INSZ.

**v7 (plan rename)** renames `FREE/SINGLE/PRACTICE` to `BASIC/STANDARD/PREMIUM`. The new names are still in use.

**v12 — v14 (notification + i18n bootstrap)** adds locale to users and practices, and back-fills the practice-id linkage on existing notifications. The default locale is `'nl'`.

**v16 — v17 (commission overhaul)** is the largest commission re-write: the legacy flat `commissionRate` becomes the structured `commission.{type, percentage, amount}` sub-document, and all open commission invoices are wiped and re-generated.

**v19 (data integrity sweep)** is by far the largest single migration (153 lines). It walks every event and patient invoice, re-attaches accidentally-removed events that paid invoices still reference, resets corrupted commission invoices, and re-runs session counters. This was a one-shot recovery from a production data incident.

**v20 (Stripe transition init)** writes initial Stripe invoice records for all pre-existing Bancontact subscriptions, paving the way for v33.

**v21 — v23 (schema reshapes)** are routine — moving fields around as the patient-file and invoice models firmed up.

**v24 — v26 (long-term therapy + bilan dates + treatment notifications)** introduces three features in three migrations: the long-term therapy plan with `category`/`goal`/`priority`, structured bilan start/end dates, and the per-treatment notification toggle.

**v27 (insurance fund lookup)** turns free-text insurance names into a structured `insuranceCode` numeric. This is when `Verzamelstaten` could start grouping reliably.

**v28 — v32 (Rosa rollout, the most significant integration)** is the Rosa.be EHR integration arriving in five linked migrations:

- v28 — push practice metadata to Rosa
- v29 — push patient records to Rosa
- v30 — push events to Rosa
- v31 — push missing motive references
- v32 — re-push events as a fix-up

The integration is push-only at this point (Rosa pull is added later via the `Practices.after.update` 5-minute interval, see `background_jobs.md`). After v32, Rosa is the canonical event store and Halingo is "sync'd to Rosa".

**v33 (Stripe upgrade)** migrates all subscriptions to the new Stripe Customer/Subscription API model. The actual transformation lives in `migrations/subs-to-new-stripe.ts`.

**v34 — v35 (post-Stripe / commission cleanup)** another open-commission wipe + regenerate, plus a session-count rebuild via `update-treatment-session-count.ts`.

**v36 — v40 (Rosa fix-ups, free-month promo)** five smaller migrations layered on top of the Rosa integration: missing motives, school-location events (twice), session counts, and a one-off "free month" promotion via `add-free-month.ts`.

**v41 — v43 (Rosa data incident, late 2022)** three hard-coded migrations targeting specifically `userId: "FtiCso8brE5GWNu3W"`. The pattern is identical: events that were pulled from Rosa got duplicated against manually-created events when the push retry logic failed. These migrations delete the `fromRosa: true` duplicates. Worth noting these are *non-portable* migrations — they will silently no-op on any deployment that doesn't contain that user ID.

**v44 (practice split)** another hard-coded migration: copies the patient data of one therapist to a new user/practice pair. This is the one-time setup for a practitioner who left a group practice.

**v45 — v46 (recovery sweeps)** another `updateTreatmentSessionCount` run and `addMissingInvoices` to back-create invoices for billable events that fell through the cracks.

**v47 (empty)** placeholder. The presence of an empty `up()` indicates the next migration version was bumped but not yet implemented.

## Provenance & operational notes

- **Multiple `updateTreatmentSessionCount` runs** (v35, v39, v45 — and conditionally a fourth via v38's commented-out import) suggest that session-count drift is a recurring symptom; either the live update path has gaps or the helper itself is idempotent and safe to re-run as a remediation.
- **Hard-coded user/practice IDs in v41–v44** mean these migrations are environment-coupled. Anyone re-running the migration set against a fresh database (e.g. for development) will get warnings/no-ops but no failures.
- **`down()` is empty for nearly every migration** (`down() {}` or `down: function() {}`). The schema rewrites are not reversible.
- **Legacy comment `//import Migrations from 'percolate:migrations';`** appears at the top of v1–v27. It's commented out because `Migrations` is provided as a global by the package; the historical pattern suggests the code originally tried to import explicitly and was later switched to globals.
