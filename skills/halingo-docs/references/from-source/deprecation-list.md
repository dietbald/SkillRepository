# Deprecation list — confirmed cleanup backlog

> **Provenance:** assembled 2026-04-07 from the product owner's answers to [`open_questions.md`](open_questions.md). Each item below was either explicitly marked for removal, declared abandoned, or confirmed dead. This is the engineering team's cleanup backlog for `Halingo-Main`. Each entry links to the file:line where the dead/deprecated code lives, so removal can proceed mechanically.
>
> **Important context:** `Halingo-Main` is the legacy production codebase. Active work is moving to a separate **mono repo** with a `backend-stack` component. Some items below are not "delete in legacy" but "do not port to mono repo". Both are flagged.
>
> **Severity legend:**
> - 🔥 **Kill** — feature is being removed from the product entirely (not just from this codebase)
> - 🧹 **Dead code** — never wired up, never used, safe to delete
> - 🪦 **Legacy** — was used but is being retired; do not port to mono repo
> - ↪️ **Move** — currently in `Halingo-Main` but architecturally belongs in the mono repo's `backend-stack`

## 🔥 Features being killed product-wide

These are real product features that the owner has decided to remove. Helpdesk articles describing them should be flagged as obsolete; the curated `manual/` should not document them as current functionality.

### 1. Practice chat
- **Why killed:** barely used.
- **Code surface:**
  - Collection: `app/imports/api/practice/practiceChat.jsx` (`PracticeChatCol`)
  - Methods: see [`features/practice_chat.md`](features/practice_chat.md) — `practiceChat.add`, `practiceChat.read`, etc.
  - UI: floating chat bubble component, plus the `chat` permissions on all three roles in `practiceUsers.jsx`
  - i18n: `chat.*` namespace
  - Kill switch: `practices.settings.chat.disabled` (already exists; effectively a feature flag)
- **Helpdesk impact:** the helpdesk article documenting how to disable chat should be marked obsolete. The "practice chat" entry in [`coverage_matrix.md`](../coverage_matrix.md) §"Concepts present in helpdesk" #6 should be marked deprecated.
- **Removal strategy:** flip the kill switch on by default, then remove the collection, methods, publications, UI components, and i18n strings in a follow-up.

### 2. `users.delete` method
- **Why killed:** has no UI anywhere; the GDPR self-deletion flow it implies is not part of the current product roadmap.
- **Code surface:** the `users.delete` `LoggedInValidatedMethod` in `app/imports/api/users/methods.jsx`.
- **GDPR consequence:** **the patient-data-privacy gap stays empty.** The earlier draft of [`gaps/03_patient_data_privacy.md`](gaps/03_patient_data_privacy.md) listed `users.delete` as a planned feature waiting on a UI; it should now be reframed as "no self-service deletion is planned in `Halingo-Main`". GDPR right-to-erasure remains an open product question that is **not** addressed by this method.
- **Removal strategy:** delete the method, the i18n strings that reference it, and any test that calls it.

### 3. `admin_impersonation` (`api/shared/methods.js:49-71`)
- **Why killed:** product owner explicitly said "should be removed".
- **Security note:** until removed, the security warning in [`features/admin_impersonation.md`](features/admin_impersonation.md) still stands — the method bypasses the audit log, has no banner, and is gated only by a global `admin` role. Removal closes the gap.
- **Removal strategy:** delete the method, the i18n strings if any, the global `admin` role check helper if it has no other consumers.

## 🧹 Dead code — safe to delete

These were never wired up or are no longer reachable. Removing them does not change product behaviour.

### 4. `app/imports/modules/monkey-calendar/`
- **Confirmed dead.** The folder contains only `nl.js` (35 lines) and `fr.js` (37 lines), both jQuery UI datepicker locale files for `$.fullCalendar.datepickerLocale` that import a non-existent `./fullcalendar.min.js`. No file under `app/imports` imports the folder. Live calendar uses `react-big-calendar`.
- **Removal strategy:** `git rm -r app/imports/modules/monkey-calendar/`.

### 5. `app/imports/code_export.txt`
- **Confirmed dead.** Build artefact / source dump. Should be `.gitignore`-d at minimum, deleted ideally.
- **Removal strategy:** delete the file, add the path or pattern to `.gitignore`. Be aware that grep against `app/imports` will keep returning duplicate hits in this file until it's removed — the in-app workflow agent flagged this as a working hazard.

### 6. `app/lib/methods.js` and `app/lib/routes.jsx`
- **Confirmed dead.** Both are scaffolding stubs (`methods.js` is a 14-line placeholder, `routes.jsx` is empty). Neither is imported anywhere.
- **Removal strategy:** delete both files.

### 7. `patientFileUsers.roles.owner`
- **Confirmed dead.** Product owner: "owner is not used, can be removed". The role appears in `app/imports/api/patientFileUsers/patientFileUsers.jsx:53` with only `patientFile.view`. The earlier draft of [`features/practice_user_roles.md`](features/practice_user_roles.md) framed it as a "creator marker" — that framing was wrong; the role is genuinely unused.
- **Removal strategy:** delete the `owner` key from the `roles` object, then grep for `patientFileUsers.*owner` and remove any callers.

### 8. `practice.subscriptions.change` permission
- **Status:** dead constant. Listed in the role matrix but no `checkPermission` call references it.
- **Removal strategy:** delete from the role matrix in `practiceUsers.jsx`; grep for any reference in i18n and remove.

### 9. `LongTherapyPlan.therapistId` schema field
- **Status:** schema field exists, methods accept it, the UI form control is committed-out. Per-therapist goal assignment is not used at the moment.
- **Removal strategy:** can be removed from the schema, the methods, and the commented-out UI. Be careful if any production data has populated this field — a migration may be needed to drop it (see the architecture note: prefer admin function over migration).

### 10. `practice.ownTariffs` toggle
- **Where:** `lib/formSchemas/practices/accessibility.jsx:46-60`. Bound to the wrong schema, no consumer, empty submit callback.
- **Status:** "Got pulled" — was a per-practice tariff override feature that was abandoned.
- **Removal strategy:** delete the form field; grep for `ownTariffs` and remove any references.

### 11. `treatment.can.be.removed` validator parameter mismatch
- **Status:** the product owner said "It's fine" — the framing as a bug was wrong. The mismatch is intentional or harmless. **Not for removal.** Listed here only because the earlier draft flagged it incorrectly; this entry exists to record the retraction.
- **Action:** none. Reframe the description in [`features/practice_user_roles.md`](features/practice_user_roles.md) from "dead code" to "intentional".

### 12. Stub `/referrals/` page
- **Where:** the 82-line component with empty `generateLink()` handler at the route declared in `app/imports/startup/client/routes/referals.jsx`.
- **Why dead:** the real referral UI lives in `PracticeReferralBox` on the subscription page. The standalone route exists but is non-functional.
- **Removal strategy:** delete the route from `referals.jsx`, delete the page component, leave `PracticeReferralBox` alone.

### 13. `getInvoiceStatistics` and `latestInvoiceDate`
- **Status:** server methods defined, no UI consumer. Abandoned analytics feature.
- **Removal strategy:** delete the methods, the helpers they call, and any related publications.

### 14. `MeetingEvent` description-on-create field
- **Status:** "We don't use that". The initial description entered when creating a MEETING-type event is dropped on first save and the feature is unused.
- **Removal strategy:** either remove the description input from the create modal, or persist it correctly. Owner's preference is removal since the feature is unused.

### 15. Two stale `util.jsx` files importing `Events` instead of `Notifications`
- **Where:** the in-app workflow agent flagged these in [`features/in_app_notifications.md`](features/in_app_notifications.md). Bit-rot from a refactor that didn't finish.
- **Removal strategy:** check whether the importing files are themselves dead; if so, delete them. If they have other live code, fix the import to point at `Notifications`.

## 🪦 Legacy — do not port to mono repo

These are functioning today in `Halingo-Main` but should not be ported to the mono repo. They will be retired as part of the migration.

### 16. The entire `app/imports/migrations/` folder
- **Why legacy:** product owner: "All migrations can be ignored. For those kind of functions, we should do that through an admin function."
- **What this means for `Halingo-Main`:** keep the existing migration files (they describe historical schema changes); do not write new ones. The five hard-coded data-fix migrations (v41–v44) and the empty `migration-v47.js` placeholder are all included in this directive.
- **What this means for the mono repo:** **do not port the migrations folder**. Replace the pattern with admin functions (short administrative scripts run on demand).
- **Documentation impact:** [`technical/migrations_timeline.md`](technical/migrations_timeline.md) should add a banner noting that migrations are historical record only.

### 17. `MethodLogger` (`app/imports/api/logger/`)
- **Why legacy:** product owner: "That was disabled as we do not want to log all those actions anymore." The earlier draft of [`features/method_audit_log.md`](features/method_audit_log.md) framed the failures-only behaviour as a bug — that framing was wrong; logging was disabled intentionally.
- **What this means for `Halingo-Main`:** the `method-logs` collection and the `MethodLogger` helper can be left in place but should be considered legacy. Do not rely on it for audit.
- **What this means for the mono repo:** if audit logging is needed, design it from scratch in the backend-stack — do not port `MethodLogger`.

### 18. `practices.settings.invoices.locale` (per-praktijk invoice language)
- **Why legacy:** product owner: "We should not use practice locale". The intended rule is to always use the user's locale. This is recorded as a memory ([`halingo_locale_rule.md`](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md)).
- **What this means for `Halingo-Main`:** do not propose a UI for setting the practice locale. Do not document it as a current product feature.
- **What this means for the mono repo:** do not port the field.
- **Helpdesk impact:** the "Per-praktijk invoice language" entry in [`coverage_matrix.md`](../coverage_matrix.md) §"Concepts present in helpdesk" #17 should be marked deprecated.

### 19. 3-day account-lock heuristic (in `users` API)
- **Why legacy:** the mono repo's intent is to enforce email validation **before** the user can access the app at all. The lock becomes unnecessary.
- **What this means for `Halingo-Main`:** the lock should already work as documented in [`features/identity_and_authentication.md`](features/identity_and_authentication.md); leave it alone.
- **What this means for the mono repo:** do not port the lock; instead enforce validation upstream.

### 20. `team_meetings` (collection + i18n + role permission + commented-out `TeamMeetingBox`)
- **Why legacy:** abandoned. Never reached production status.
- **What this means for `Halingo-Main`:** safe to delete the collection, the i18n strings, the role permission, and the `ComingSoon`-gated `TeamMeetingBox`. The `team-meeting.*` i18n namespace can be removed entirely.
- **What this means for the mono repo:** do not port. If team meetings come back as a feature, design fresh.

## ↪️ Move to mono repo backend-stack

Currently in `Halingo-Main` but architecturally belongs in the mono repo's `backend-stack`.

### 21. The 5-minute Rosa pull `setInterval`
- **Where today:** `app/imports/api/practice/server/hooks.js:72-139`. Runs unconditionally on every server start.
- **Where it belongs:** a lambda function in the mono repo's `backend-stack`.
- **Operational note:** "atm ran on all servers, but we only have 1." Production currently has a single server, so the interval is effectively a singleton — but the design assumes scale-out, where it would over-poll.
- **Migration strategy:** when the lambda is in place, remove the `setInterval` registration from `hooks.js` and verify with logs that the lambda is the sole source of pulls.
- **Documentation impact:** [`features/rosa_integration.md`](features/rosa_integration.md) should note that the 5-minute pull is scheduled to move to a lambda function; until then, the `setInterval` is the live mechanism.

### 22. Tariff history (`Events.getPrices()`)
- **Where today:** a giant date-conditional `if (start < moment("YYYY-MM-DD"))` cascade in source code. Tariff updates currently ship as code releases.
- **Where it belongs:** a database table.
- **Migration strategy:** **deferred.** The product owner explicitly said "Let's not do that yet for the migration". For now, document the cascade as the live mechanism in [`features/tariff_indexation.md`](features/tariff_indexation.md) and note that the architectural target is DB-stored prices, but the migration is not in scope.

## Items NOT in this list (and why)

To prevent confusion: these items were considered for the deprecation list but **excluded** because the product owner confirmed they are intentional or current:

- **Disjunctive RBAC** (`practiceUsers` OR `patientFileUsers`) — intentional design.
- **`patientFileUsers.admin` ≡ `patientFileUsers.default` apparent equivalence** — admin actually has the access-management permission that default does not. The two are not equivalent; the earlier draft of [`features/practice_user_roles.md`](features/practice_user_roles.md) was missing this distinction. Re-verification of the role objects is needed.
- **`practice.subscriptions.select` checking `.resume`** — the owner said `.resume` is fine. Not a bug, not for removal.
- **The hard 401 when creating an event on a colleague's calendar** — intentional validation. The permission constant is checked elsewhere.
- **Per-disorder commission overrides (`specificAmounts`)** — confirmed in active use.
- **`VideoConsultationCode = 792433`** — current De Conventie code.
- **18 treatment types, 11 therapy goal categories, R-waarde 2023-05-01 history** — all current.
- **30-day SaaS trial** — current product policy.
- **Newsfeed authoring via `meteor mongo`** — that *is* the workflow. Not a missing feature.
- **PDF generation via `html-pdf` / PhantomJS** — still in use. The dead-since-2018 dependency is technical debt, not a deprecation, but worth flagging when planning the mono repo PDF pipeline.

## How this list was assembled

Each line above is traceable to a specific answer in [`open_questions.md`](open_questions.md). The mapping:

| Open question | Deprecation entry |
|---|---|
| Q2 (`patientFileUsers.owner`) | #7 |
| Q7 (`practice.subscriptions.change`) | #8 |
| Q9 (MeetingEvent description) | #14 |
| Q10 (max 2 video) | not deprecated — was temporary, see open_questions answer |
| Q12 (team_meetings) | #20 |
| Q13 (`users.delete`) | #2 |
| Q14 (stub /referrals/ page) | #12 |
| Q15 (getInvoiceStatistics) | #13 |
| Q16 (treatment.can.be.removed) | #11 (retraction) |
| Q17 (`practice.ownTariffs`) | #10 |
| Q18 (`LongTherapyPlan.therapistId`) | #9 |
| Q20 (Rosa cron) | #21 |
| Q22 (MethodLogger) | #17 |
| Q23 (admin_impersonation) | #3 |
| Q24 (migrations) | #16 |
| Q25 (practice locale) | #18 |
| Q26 (chat kill switch) | #1 |
| Q28 (code_export.txt) | #5 |
| Q31 (migrations) | #16 |
| Q36 (3-day lock) | #19 |
| Q37 (Events.getPrices) | #22 |
| Q38 (monkey-calendar) | #4 |
| Q42 (chat) | #1 |
