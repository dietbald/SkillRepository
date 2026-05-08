# Bugs, security findings, and dead code — surfaced during the code-read pass

> **Provenance:** items below were discovered while writing the per-feature pages in this folder by reading `/home/tj/Repos/Halingo-Main` end-to-end (2026-04-07). This is a triage list for the engineering team.
>
> **Triaged 2026-04-07** against the product owner's answers to [`open_questions.md`](open_questions.md). Items confirmed as intentional design were removed; items confirmed as scheduled for removal were moved to [`deprecation_list.md`](deprecation_list.md). What remains below is the genuine engineering backlog.
>
> **Severity legend:**
> - 🔴 **Security** — exploitable now, or could be in the wrong hands
> - 🟠 **Authorization** — broken or missing access checks; effects depend on threat model
> - 🟡 **Functional bug** — wrong behaviour, data corruption, or silent failure
> - 🟢 **Hygiene** — validation drift, audit gaps, technical debt

## 🔴 Security

### `pdf.generate` accepts arbitrary HTML with no admin check
- **Where:** `app/imports/api/shared/methods.js` (the `pdf.generate` Meteor method); pipeline in [`features/pdf_generation.md`](features/pdf_generation.md)
- **Risk:** SSRF — a logged-in user can submit HTML containing `<img src="http://internal-host/...">` and have the headless renderer fetch internal URLs. Could be used to probe the internal network or to exfiltrate data via timing/error responses.
- **Status:** unmitigated. No admin check, no URL allowlist, no `<img>` filter.

### Dormant admin impersonation with no audit
- **Where:** `app/imports/api/shared/methods.js:49-71` (`impersonateUser`); see [`features/admin_impersonation.md`](features/admin_impersonation.md)
- **Risk:** the method is gated only by `Meteor.users.roles.indexOf('admin') !== -1`, **bypasses `LoggedInValidatedMethod`** (so it leaves no trace anywhere), has no UI, and has zero callers in the codebase. Operators must invoke via browser console / Meteor shell.
- **Status:** ✅ **scheduled for removal** — see [`deprecation_list.md` #3](deprecation_list.md). The security risk closes when the method is deleted; until then, the warning above stands.

### Document download URLs leak `userId` in query string
- **Where:** `documentsConfig.js` (self-acknowledged TODO comment); see [`features/patient_documents.md`](features/patient_documents.md)
- **Risk:** the user ID of the requester appears as a query parameter on every patient-document URL, which means it shows up in browser history, web server access logs, the Referer header on any subsequent request, and in any URL-shortener / preview / scanning service the user pastes it into.
- **Status:** acknowledged in code, not fixed.

### Google Docs Viewer fallback exfiltrates document URLs
- **Where:** see [`features/patient_documents.md`](features/patient_documents.md)
- **Risk:** non-PDF/non-image office documents (Word, Excel, PowerPoint) are rendered by passing the document URL — including the `userId` query parameter — to the public Google Docs Viewer. Google receives the patient's filename, the practice's S3 bucket structure, and the therapist's user ID.
- **Status:** unmitigated. Should be replaced with an in-app office viewer or removed.

### Embedded test Stripe public key in production-facing file
- **Where:** `PracticeSubscriptionInvoicePaymentPage.jsx:17`; see [`features/saas_subscriptions.md`](features/saas_subscriptions.md)
- **Risk:** test key is `pk_test_...`. If hit in production, payments fail silently or charge the test environment. The constant should come from settings.json.
- **Status:** hardcoded.

## 🟠 Authorization gaps — confirmed bugs to fix

> All three items below were **confirmed by the product owner** as bugs that need fixing.

### `notifications.delete` has no `userId` scoping
- **Where:** `app/imports/api/notifications/methods.js:36-38`; see [`features/in_app_notifications.md`](features/in_app_notifications.md)
- **Effect:** any logged-in user can delete any notification by submitting its `_id`. The selector does not include `{ userId: this.userId }`.
- **Owner verdict (Q3):** "should idd be scoped to userId".
- **Fix:** add `userId: this.userId` to the selector.

### `practiceInvitations` publication has no auth check
- **Where:** see the publications reference in [`technical/publications.md`](technical/publications.md)
- **Effect:** anyone with a `practiceId` can list pending invitations to that practice — including the invitee email addresses.
- **Owner verdict (Q4):** "should idd be scoped".
- **Fix:** add a permission check (probably `practice.users.invite` or `practice.users.view`) to the publication.

### `referrals` permissions are declared but never enforced
- **Where:** [`features/referral_programme.md`](features/referral_programme.md)
- **Effect:** the `referrals` and `referrals.invite` permissions are listed under `owner` but the methods are bare `LoggedInValidatedMethod`. Any logged-in user can invite anyone and trigger the referral state machine.
- **Owner verdict (Q5):** "should idd be scoped to practice owner".
- **Fix:** wrap the `referrals.*` methods in a `checkPermission('referrals' / 'referrals.invite', this.userId, practiceId)` and reject non-owners.

### Frontend-only access control on `patientFileUsers` ACL management
- **Where:** the methods that grant or revoke per-file access (look in `app/imports/api/patientFileUsers/methods.jsx` for `grantAccess`, `removeAccess`, or similar; and `app/imports/api/patientFiles/methods.jsx` for `grantUserAccessToPatientFile` / `grantUserAccessToPatientFiles`).
- **Effect:** the **frontend** only renders the "manage access" buttons for users with the per-file `admin` role, so a `default` per-file user appears not to be able to grant/revoke access. The **backend does not enforce this** — a `default` per-file user can call the underlying methods directly (DDP / browser console / scripted client) and successfully add or remove ACL rows.
- **Owner verdict (Q1, clarified 2026-04-07):** "the frontend blocks the .default as no button is available to do the action, the backend didnt block it thats a bug". This explains why the earlier `from_source/features/practice_user_roles.md` listing showed `patientFileUsers.admin` and `patientFileUsers.default` as having identical 18-permission lists — they really are identical in the role object. The intended distinction lives only in the UI.
- **Fix:** add an explicit `checkPermission(...)` (or equivalent guard) in the server method body that limits ACL grant/revoke to per-file `admin` (and the practice-level roles that already pass via the disjunctive whitelist). Until the fix lands, this is a **trust boundary issue** — the access-control matrix is enforced cosmetically, not structurally.
- **Generalization worth checking:** this is a *class* of bug. Any place in the codebase that hides a button on the frontend "because the user does not have permission X" but does not also `checkPermission(X, ...)` in the server method has the same shape. A grep for `permissions.checkPermission` against server methods, contrasted with the role lists in `practiceUsers.jsx` and `patientFileUsers.jsx`, would surface the rest. Worth a focused audit.

> **Removed from this section 2026-04-07:** the disjunctive `practiceUsers` ↔ `patientFileUsers` whitelist (intentional additive design — see [`features/practice_user_roles.md`](features/practice_user_roles.md)); `patientFileUsers.admin` ≡ `patientFileUsers.default` (admin actually has the access-management permission, see Q1 answer); `practice.subscriptions.select` checking `.resume` (Q6: ".resume is fine"); `practice.subscriptions.change` declared but never used (Q7: dead, see [`deprecation_list.md` #8](deprecation_list.md)).

## 🟡 Functional bugs

### `patientFileReports` publication passes the wrong field
- **Where:** `app/imports/api/patientFileReports/server/publications.jsx:18`; see [`technical/publications.md`](technical/publications.md)
- **Effect:** publication arguments are wrong — the entire report document is passed where a `patientFileId` is expected. Publication is broken.
- **Status:** unverified by owner; flagged for engineering review.

### `commissionInvoice` publication selector overwrites instead of `$or`-ing
- **Where:** see [`features/commission_invoices.md`](features/commission_invoices.md) and [`technical/publications.md`](technical/publications.md)
- **Effect:** owners with `practice.commission.view` cannot see their own commission rows because the conditional branch that adds the "view all in practice" filter overwrites the user-scoped filter instead of OR-ing it.
- **Status:** unverified by owner; flagged for engineering review.

### `DashboardTop` Mon-Sat range with 7-day counts
- **Where:** see [`features/main_dashboard.md`](features/main_dashboard.md)
- **Effect:** busiest/quietest computation iterates Mon-Sat (6 days) but counts events for 7 days. Possible off-by-one in the displayed "busiest day".
- **Status:** unverified by owner; flagged for engineering review.

### `clientErrors.createdAt` field bug
- **Where:** see [`features/client_error_logging.md`](features/client_error_logging.md)
- **Effect:** field/index mismatch — `createdAt` is set client-side but the index is on a different field. Errors may not be queryable in chronological order.
- **Status:** unverified by owner; flagged for engineering review.

> **Removed from this section 2026-04-07:** "Structured-announcement uses user locale" (Q11/Q25: user locale is canonical, the framing was wrong — see [`halingo_locale_rule.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md)); "MeetingEvent description on create dropped" (Q9: feature being killed, see [`deprecation_list.md` #14](deprecation_list.md)); "Cannot create event on colleague's calendar" (Q8: intentional validation); "Max 2 video consultations rule disabled" (Q10: was temporary); "TeamMeeting.filters static now" (Q12: feature abandoned, see [`deprecation_list.md` #20](deprecation_list.md)).

## 🟢 Schema / validation drift

### `stripeInvoices` SimpleSchema attachment is commented out
- **Where:** `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx:131`
- **Effect:** validation is silently bypassed for the entire Stripe invoice collection. Inserts and updates with malformed shape will succeed.

### `SimpleSchema.RegEx.id` typo (lowercase)
- **Where:** `app/imports/api/practiceUsers/methods.jsx` lines 13, 14, 29, 30, 51
- **Effect:** the correct constant is `SimpleSchema.RegEx.Id` (capital I). The lowercase form does not exist, so the schema does not validate the ID format on those parameters — any string passes.

### `EmailType` / `EmailStatus` TypeScript ↔ SimpleSchema drift
- **Where:** `app/imports/api/emails/emails.ts`; see [`features/email_delivery.md`](features/email_delivery.md)
- **Effect:** the TypeScript union types and the SimpleSchema `allowedValues` arrays for the same fields are different lists. New email types added to one will not validate against the other.

## 🟢 Operational hygiene

### `SyncedCron` is silent in production
- **Where:** see [`technical/background_jobs.md`](technical/background_jobs.md)
- **Effect:** `SyncedCron.config({ log: false, logger: () => {} })`. No record of whether scheduled jobs ran, succeeded, or failed.
- **Note:** distinct from `MethodLogger`, which was disabled intentionally (see retraction below). The `SyncedCron` silence has not been confirmed as intentional and is worth flagging for engineering review.

### `html-pdf` / PhantomJS for all PDF generation
- **Where:** see [`features/pdf_generation.md`](features/pdf_generation.md)
- **Effect:** PhantomJS has been unmaintained since 2018. The `html-pdf` wrapper is fiber-blocking (synchronous), so a slow PDF render blocks the Meteor event loop. Every certificate, every invoice, every demand form goes through this path.
- **Mono-repo note:** when designing the new PDF pipeline, do not port `html-pdf`. A modern headless-Chrome wrapper (Puppeteer / Playwright) is the conventional replacement.

### `console.log("WTF")` in production
- **Where:** `app/imports/api/subscriptions/methods.jsx:76`
- **Effect:** stray debug statement. Trivial to remove.

> **Removed from this section 2026-04-07:** "MethodLogger only logs failures" (Q22: was disabled intentionally — the owner does not want to log all those actions, see [`deprecation_list.md` #17](deprecation_list.md)); "Five hard-coded data-fix migrations" and "migration-v47.js empty" (Q24/Q31: migrations are deprecated entirely, see [`deprecation_list.md` #16](deprecation_list.md)).

## Dead code

All dead code findings have moved to [`deprecation_list.md`](deprecation_list.md) where they are organized into kill / dead-code / legacy / move categories with file:line pointers. The list there is the canonical cleanup backlog.

## Retraction summary (2026-04-07 triage)

For traceability, the items below appeared in earlier drafts of this file and were removed after the product owner's answers in [`open_questions.md`](open_questions.md). Each is now either intentional design (no action) or scheduled for removal (see [`deprecation_list.md`](deprecation_list.md)):

| Earlier finding | Verdict | Where now |
|---|---|---|
| Permission whitelist is disjunctive | Intentional design | [`features/practice_user_roles.md`](features/practice_user_roles.md) |
| `patientFileUsers.admin` ≡ `patientFileUsers.default` | Not equivalent — admin manages access | [`features/practice_user_roles.md`](features/practice_user_roles.md) |
| `practice.subscriptions.select` checks `.resume` | Intentional | — |
| `practice.subscriptions.change` declared but unused | Dead | [`deprecation_list.md` #8](deprecation_list.md) |
| Structured-announcement uses user locale | User locale is canonical, framing was wrong | [`halingo_locale_rule.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md) |
| MeetingEvent description on create dropped | Feature unused, being killed | [`deprecation_list.md` #14](deprecation_list.md) |
| 401 on colleague calendar | Intentional validation | — |
| Max 2 video disabled | Was temporary | — |
| TeamMeeting.filters static now | Feature abandoned | [`deprecation_list.md` #20](deprecation_list.md) |
| MethodLogger only failures | Disabled intentionally | [`deprecation_list.md` #17](deprecation_list.md) |
| Five hard-coded data-fix migrations | Migrations deprecated entirely | [`deprecation_list.md` #16](deprecation_list.md) |
| `treatment.can.be.removed` parameter mismatch | "It's fine" — no action | — |

## Cross-references

- [`deprecation_list.md`](deprecation_list.md) — canonical cleanup backlog with file:line for every item slated for removal.
- [`open_questions.md`](open_questions.md) — the answered questionnaire that drove this triage.
- [`inventory.md`](inventory.md) — master cross-reference for the `from_source/` folder.
- [`README.md`](README.md) — folder purpose and conventions.
- [`technical/methods.md`](technical/methods.md), [`technical/publications.md`](technical/publications.md), [`technical/collections.md`](technical/collections.md) — engineer-facing reference where most of these findings were originally noted.
- [`../coverage_matrix.md`](../coverage_matrix.md) — the curated audit, updated 2026-04-07.
