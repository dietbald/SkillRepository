# Identity Management

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Auth, profile, RBAC, invitations, signup, ToS.

## Spec contracts (Phase 2)

- **deprecated-do-not-port** — Feature: identity/deprecated-do-not-port
  - Path: `02-specs/identity/deprecated-do-not-port/spec.md`
- **email-management** — Feature: identity/email-management
  - Path: `02-specs/identity/email-management/spec.md`
- **invitations** — Feature: identity/invitations
  - Path: `02-specs/identity/invitations/spec.md`
- **login-and-logout** — Feature: identity/login-and-logout
  - Path: `02-specs/identity/login-and-logout/spec.md`
- **password-management** — Feature: identity/password-management
  - Path: `02-specs/identity/password-management/spec.md`
- **profile** — Feature: identity/profile
  - Path: `02-specs/identity/profile/spec.md`
- **rbac** — Feature: identity/rbac
  - Path: `02-specs/identity/rbac/spec.md`
- **signup** — Feature: identity/signup
  - Path: `02-specs/identity/signup/spec.md`
- **team-management** — Feature: identity/team-management
  - Path: `02-specs/identity/team-management/spec.md`
- **terms-of-service** — Feature: identity/terms-of-service
  - Path: `02-specs/identity/terms-of-service/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/identity.md`)

# Discovery: Identity Management

**Area:** #1 Identity Management (from `application_map.md` § 2, competency 1 — "User authentication, profile security, and role management").

**Scope in one breath:** everything a user does to *prove who they are to Halingo* and everything tied to the account rather than to a patient or an invoice — sign-up, login, password reset, email verification, email change, profile edit (including the therapist-specific RIZIV / company-number / bank-account fields), terms-of-service acceptance, account deletion, plus the practice-scoped role model (owner / beheerder / lid), practice invitations, and the full 62-permission practice-level RBAC matrix. Excludes patient-file-level ACL (area #3 Patient Data Privacy), RIZIV billing logic (area #8), SaaS plan limits on invitations (area #20 — cross-reference), and any admin-only tooling that sits outside the practice role hierarchy.

**Date:** 2026-04-08 (original pass) · 2026-04-09 (gated-screen follow-up)
**Agent:** Claude Code `general-purpose` session handling all three sources.
**Legacy baseline:** `/home/tj/Repos/Halingo-Main` at checkout from 2026-04-06.

> **Scope discipline reminder:** this file describes the **legacy Meteor app only**. It contains zero references to what exists in the Nx monorepo, no gap analysis, no "Nx coverage" annotations, no implementation suggestions. Phase 2 spec authoring is where legacy descriptions get compared against the current Nx state; Phase 1 must stay correct in 6 months regardless of what the Nx app looks like today. See `06-prompts/halingo-discoverer.md` § "The ONE critical scope rule".

> **Updated 2026-04-09**: gated-screen follow-up pass appended to § Source 3. **Local Meteor** instance at `http://localhost:3000` + six seeded test accounts used (see `test-accounts-local.md`). **17 additional gated screens walked** (profile, practice-users roster from owner/admin/lid, practice-user detail from owner/lid, practice settings from owner/lid, ToC blocking modal, notifications, three role-scoped dashboards, multi-practice switch, unverified-user landing). **4 `[NEEDS CLARIFICATION]` entries resolved** (Q2, Q4, plus partial resolution of the login-confirm ceremony question and new lid/owner banner-text evidence). No new screens from Source 3 contradict the HalingoDoc or Meteor source reads from the first pass; several behaviors that were inferred from source are now directly confirmed at the UI layer.

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Curated | `docs/coverage_matrix.md` | 163 | § "Functional groupings" row 1, § "Net-new concepts found in code" | Identity is flagged "Well covered" helpdesk-side + full RBAC matrix code-derived. Pointer to `identity_and_authentication.md` and `practice_user_roles.md`. |
| Curated | `docs/functional/application_map.md` | 62 | § 2 competency 1, § 1 "Core Navigation & Dashboard" (User Profile Settings screen) | Formal area definition. |
| Curated | `docs/functional/user_stories.md` | — | ctrl-F identity / auth / role | No user story is dedicated to identity; US.02 ("practice owner seeing therapist schedules") implies the owner/admin/lid model but does not specify it. |
| Curated | `docs/glossary.md` | — | § Belgian terms | Confirms three-tier role model: *praktijkverantwoordelijke* (owner) / *beheerder* (admin) / *lid* (default). Confirms admin can view peers' invoices; lid cannot. |
| Helpdesk | `full_documentation/general_getting_started.md` | 2191 | §§ "Ik vind geen bevestigingsmail terug…" (line 773), "Taal wijzigen" (line 853), "Inloggen" (line 1497), "Wachtwoord vergeten" (line 1532), "Account aanmaken" (line 1582), "Wachtwoord wijzigen" (line 1623), "E-mailadres wijzigen" (line 1673), "Profielfoto toevoegen/wijzigen" (line 1744), "Algemene gegevens invullen/wijzigen" (line 1791) | NL happy-path walkthroughs: login, forgot-password, sign-up (5-step: mail + password + ToC tickbox + "registreer"), change-password-from-profile, change-email-from-profile, avatar upload, general profile fields, interface language change. All with Zendesk screenshots. Notes that verification mail is sent automatically and to check spam if missing. Notes that profile language is distinct from practice invoice language — pointer to a separate (broken) Zendesk link for practice language. |
| Code-derived | `from_source/README.md` | — | overview | Provenance warning: the `from_source/` layer was extracted by reading the Meteor source in 2026-04-07; the docs below may cite file:lines that have drifted. |
| Code-derived | `from_source/inventory.md` | — | § "1 — Identity Management" | Lists the three feature files for identity and confirms "No 2FA, no SSO" as the headline fact. Points at the 3-day lock and `users.delete` deprecations. |
| Code-derived | **`from_source/features/identity_and_authentication.md`** | 226 | full | Routes, pages, methods (`users.register`, `users.password.reset.mail`, `users.password.changed.mail`, `users.email.verify.mail`, `users.email.verify`, `users.email.change`, `user.email.remove.pending`, `users.terms.accept`, `users.delete`, `users.rosa.connect`, `users.rosa.disconnect`), data model (`emails[]`, `services`, `profile.pendingEmail`, `acceptedTerms === "3"`, `createdAt`, `removed`/`removedAt`, `createdFromBackendEmail`), the 3-day lock heuristic, the 30-minute verification token TTL, the email-change "overwrite entire `emails` array" quirk, the `localStorage.resetPasswordToken` indirection on `/reset`, and the `TermsCheckBox` blocking modal. |
| Code-derived | **`from_source/features/practice_user_roles.md`** | 299 | full | The 62-permission RBAC matrix. Three roles: owner (62 perms), admin/beheerder (53 perms), default/lid (5 perms). The two-layer design (`practiceUsers` + `patientFileUsers` disjunctive-OR). Guard invariants: admin cannot self-promote to owner, `removeUser` refuses owner, `makeOwner` is an atomic swap that downgrades the current owner to admin. The owner↔admin delta: 9 permissions (all subscription-related + `makeOwner` + `referrals.*`). The default/lid short list: 5 permissions (`patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`). The "invited" pseudo-role (i18n only, no real permissions). |
| Code-derived | **`from_source/features/practice_user_management.md`** | 218 | full | The `/practices/users` roster page and `/practices/users/:userId` detail page. Inviting (plan user-limit check server- AND client-side), resending (upserts the invitation token), cancelling, role dropdown (never offers "owner"), "Make owner" (transfer), remove (refuses owner, cascades to `patientFileUsers`), free-text staff note, per-user commission sub-form. `subscription: true` guard on most of these methods. |
| Code-derived | **`from_source/features/user_profile.md`** | 187 | full | The `/user/profile` page. `UserProfile` schema (17 fields including `firstName`, `lastName`, `salutation` [mister/misses/miss], `gender` [male/female], `birthday`, `locale`, `imageUrl`, `gsmNumber`/`phoneNumber`, `address`, `bankAccount` [IBAN-validated], `companyNumber`, `riziv`, `profession` [SPEECH_THERAPIST / OTHER], `professionOther`, `isDeconventioned`, `pendingEmail`, `certificateNumber` booklet object). `UserSettings` schema (`certificates.mode` manual/printer, `certificates.offset.left`/`.top`, `certificates.therapistInformation`/`.therapistInformationPractice`, `invoices.rizivRequired`, `invoices.personalNote`). Debounced 500ms auto-save. `_.omit(profile, "imageUrl")` lodash no-op bug. `users.settings.update` silently returns false if `invoices.rizivRequired` is not in the payload. Name/image fan-out to open commission invoices via `Meteor.users.after.update` hook. |
| Code-derived | **`from_source/features/invitations.md`** | 241 | full | The `Invitations` collection (generic typed-invitation machine with exactly one type implemented: `joinPractice`). The `/invitations/accept/:token` route. `invitations.accept` method — single-use, deletes the row *before* dispatching to the type parser, which means a stale token is immediately unusable. Upsert on `{userId, type, data}` — resending rotates the token. No TTL, no decline flow. The dead `invitations.remove` method (not wired from the UI; real cancel path is `practice.user.invite.remove`). Multi-server race TODO comment. The `practiceInvitations` publication is un-gated. |
| Code-derived | `from_source/features/referral_programme.md` | 371 | ctrl-F "register", "users.register", "RegisterPage", "referralId", "referralUserId" | The `/register` page accepts hidden query params `referral_user_id` and `referral_id`. `users.register` handles the referral state-machine transition (INVITED → REGISTERED direct-link insert, or REGISTERED update if `referralId` points at an existing `INVITED` row). Only identity-relevant piece: the register form reads the two params and forwards them; everything downstream is out of scope. |
| Code-derived | `from_source/features/rosa_integration.md` | 315 | ctrl-F "users", "user.rosa", "rosaIntegrations" | `users.rosa.connect` / `users.rosa.disconnect` methods live in the users methods file and write to `Meteor.users.rosaIntegrations[]` (array of per-practice integration-token entries). These are *tangential* to identity — the Rosa tokens live on the user document but are used by area #18 External Platform Sync. Noted here only because the token fields are schema-inherited by `Meteor.users.User`. |
| Code-derived | `from_source/features/method_audit_log.md` | 192 | full | `LoggedInValidatedMethod` wraps every auth method and writes to `method-logs` **only on failure** — intentional per Q22 of `open_questions.md`. "Method audit log" is a misnomer: there is no successful-call audit trail. Successful `users.register`, `users.email.change`, `users.delete`, `users.terms.accept` leave no trace. Relevant here because compliance / GDPR posture on identity actions depends on it. Marked `🪦 legacy — do not port` in `deprecation_list.md` #17. |
| Cross-cutting | **`from_source/deprecation_list.md`** | 183 | ctrl-F "identity", "users", "user.", "auth", "lock", "role", "invitation", "practice.user", "3-day" | Three items directly relevant. **#2 `users.delete` — KILL** (Q13: "That should be gone"). **#17 `MethodLogger` — 🪦 legacy — do not port** (Q22). **#19 3-day account-lock heuristic — 🪦 legacy — do not port** (Q36: the product owner decided email validation should be enforced upstream instead of via the lock heuristic). Also tangentially: #7 `patientFileUsers.roles.owner` dead, #8 `practice.subscriptions.change` permission dead, #18 per-practice invoice locale 🪦 legacy (affects the invitation-email locale selection). |
| Cross-cutting | **`from_source/bugs_and_security_findings.md`** | 158 | ctrl-F "invitation", "practiceInvitations", "user", "notifications", "impersonat", "password", "login", "auth", "email", "register", "frontend-only", "RegEx" | Three items directly relevant. **🟠 `practiceInvitations` publication has no auth check** — anyone with a `practiceId` can list pending invitations + invitee emails. Confirmed bug. **🔴 Dormant `admin_impersonation`** — `app/imports/api/shared/methods.js:49-71`, bypasses `LoggedInValidatedMethod` (no audit), gated only by global `Meteor.users.roles.indexOf('admin') !== -1`, no UI. Scheduled for removal. **🟢 `SimpleSchema.RegEx.id` (lowercase) typo** at `app/imports/api/practiceUsers/methods.jsx:13,14,29,30,51` — schema does not validate the ID format on those parameters. Indirectly relevant: **🟠 frontend-only access control on `patientFileUsers` ACL management** (a `default` per-file user can call ACL methods via DDP — the RBAC matrix is enforced cosmetically, not structurally). |
| Cross-cutting | `from_source/open_questions.md` | — | ctrl-F Q3, Q4, Q5, Q13, Q22, Q23, Q25, Q36 | Confirms: Q4 `practiceInvitations` publication needs auth scoping, Q13 `users.delete` should be removed entirely, Q22 `MethodLogger` was disabled intentionally (do not port), Q25 `practice.settings.invoices.locale` is deprecated (user locale is canonical), Q36 3-day lock is being retired. All now reflected in `deprecation_list.md` / `bugs_and_security_findings.md` verbatim. |

**Files-read count:** 12 code-derived (`from_source/**`) + 3 curated (`application_map.md`, `user_stories.md`, `glossary.md`) + 1 helpdesk (`general_getting_started.md` — partial, 9 sections) + 1 cross-cutting index (`coverage_matrix.md`) + 2 code-derived cross-cutting (`deprecation_list.md`, `bugs_and_security_findings.md`, `open_questions.md`) = **17 HalingoDoc files** touched.

### What HalingoDoc covers for this area

HalingoDoc covers identity *well* on the code-derived side: the four dedicated `from_source/features/` files total ~841 lines and capture most of the legacy behaviour with file:line traceability. The 62-permission RBAC matrix (`practice_user_roles.md`) is the single most valuable artifact in the area — it's the full enumerated permission list for all three roles, with file:line citations to each enforcing method, plus a clean articulation of the owner↔admin delta and the additive `patientFileUsers` layer.

On the helpdesk side, `general_getting_started.md` walks through the 5 core happy-path flows (login, forgot-password, sign-up, change-password-from-profile, change-email-from-profile) in step-by-step screenshot-by-screenshot format, plus the adjacent profile operations (avatar upload, language change, general profile fields). The helpdesk content is NL-only — no FR helpdesk articles for identity were found. It is also written for end users (therapists) — it does not surface the admin-facing role management, invitation flow, or the RBAC model at all.

Three critical deprecations are flagged and must be carried forward as "DO NOT PORT" markers on the corresponding features:
1. **`users.delete`** (Q13, `deprecation_list.md` #2) — GDPR self-deletion is not a planned product feature.
2. **3-day account-lock heuristic** (Q36, `deprecation_list.md` #19) — email verification will be enforced upstream.
3. **`MethodLogger`** (Q22, `deprecation_list.md` #17) — intentionally disabled; redesign fresh if audit is needed.

Two confirmed bugs (not deprecations, but constraints on the new implementation):
1. **`practiceInvitations` publication missing auth check** (Q4, `bugs_and_security_findings.md`) — any logged-in user can list pending invitations for any practice by subscribing with that `practiceId`. Confirmed as a bug, scheduled to be scoped.
2. **`SimpleSchema.RegEx.id` lowercase typo** (`bugs_and_security_findings.md`) — the schema does not validate the ID format on the affected parameters. Does not affect user-visible behavior today because the wider SimpleSchema still catches malformed payloads at a higher layer.

### What HalingoDoc does NOT cover for this area

- **The seasonal login background carousel.** `AuthenticationLayout.jsx:24-184` defines 11 themed backgrounds (Winter, New Year, Spring, Easter, Summer, Back-to-school, Autumn, Halloween, Sint, Christmas, plus a duplicate New Year/Winter at year-end) and picks one at random inside the current date window. Not mentioned anywhere in HalingoDoc. User-visible, so it needs a call-out if parity on the login screen is desired.
- **The two-factor / SSO negative fact** is mentioned in `identity_and_authentication.md` as "no 2FA, no SSO, no social login, no device management" but this is worth preserving explicitly in the feature catalog as a non-feature to avoid a reviewer asking "where's 2FA in the port".
- **The `createdFromBackendEmail` field** on the User schema (`users.jsx:207`) — backend-only, no UI, no documentation beyond a pointer in `identity_and_authentication.md` "Notable details". Discovery just records that it exists; what it's used for is a `[NEEDS CLARIFICATION]`.
- **The `services.email.verificationTokens` multi-token semantics** — a user can have multiple concurrent pending verification tokens (e.g., one for primary-email re-verify, one for a pending email change) and the token match runs against both addresses. HalingoDoc's identity file describes the server-side `_verifyEmail` function but does not state explicitly that multiple pending tokens can coexist.
- **The "logout everywhere" semantics** — `deleteUser` empties `services.resume.loginTokens`, which invalidates all of the user's active sessions across all devices. HalingoDoc mentions the array-clear but does not frame it as a user-visible behavior ("you will be logged out everywhere the moment the account is soft-deleted").
- **The `localStorage.resetPasswordToken` indirection** is flagged in `identity_and_authentication.md` as "inferred from code, needs product validation" — HalingoDoc does not say *where* the token gets written to localStorage. Source 2 investigation confirms there is no hook in `routes/authentication.js` that writes it, and the `ResetPasswordPage` merely reads it. The token must be written by Meteor's accounts package as part of the `/#/reset-password/:token` URL handling (a legacy Meteor convention) and the `/reset` route relies on that side effect. This remains a `[NEEDS CLARIFICATION]`.
- **NL-only helpdesk and FR translation parity.** HalingoDoc's helpdesk articles on login/sign-up/password reset exist only in NL. The FR variant of staging is fully translated (confirmed in Source 3), but no FR helpdesk article was produced. For parity testing this matters only if screenshots diverge — the staging walk shows they don't.
- **Any detail on the `/toc` route rendering.** HalingoDoc knows the route exists and that `TermsOfAgreement` is the component; it does not document that `/toc` renders the ToC body *outside* the Halingo card chrome (no header, no logo — just raw text on a white background). Source 3 staging walk confirms this. Minor cosmetic note, not parity-blocking.

### Direct citations worth preserving

> From `from_source/features/identity_and_authentication.md:10-13`:
>
> > Halingo authentication is built on Meteor's standard `accounts-password` package. There is **no two-factor authentication, no SSO, no social login, and no device management** anywhere in the code. Sessions are bearer-token based — Meteor's default `services.resume.loginTokens` array on `Meteor.users`. "Log the user out everywhere" is implemented as emptying that array (`app/imports/api/users/server/util.jsx:29`).

> From `from_source/features/identity_and_authentication.md:171` ("User-visible behaviour"):
>
> > **New sign-up.** Enter email/password/ToC → account is created, welcome mail is sent, user is logged in immediately. The welcome/verification mail contains a 30-minute-valid link. If the user does not click within 72 hours, the account becomes locked (read-only) until they click a *fresh* verification link.

> From `from_source/features/practice_user_roles.md:219-222`:
>
> > **`makeOwner` is a swap.** It calls `changeRole(target, "owner")` **and** `changeRole(currentUser, "admin")` in the same method (`app/imports/api/practice/methods.jsx:276-278`). So transferring ownership downgrades the previous owner to admin. There is no "co-owner" or "multiple owners" state.

> From `from_source/features/invitations.md:11-13`:
>
> > There is **no token expiration**, **no usage limit**, **no multi-use vs single-use distinction**, and **no explicit decline flow**. An invitation either sits pending in the database or is consumed/deleted.

> From `from_source/deprecation_list.md:28-32` (entry #2, `users.delete`):
>
> > **Why killed:** has no UI anywhere; the GDPR self-deletion flow it implies is not part of the current product roadmap.
> > **GDPR consequence:** **the patient-data-privacy gap stays empty.** […] GDPR right-to-erasure remains an open product question that is **not** addressed by this method.

> From `from_source/open_questions.md` Q36 (3-day lock), product owner answer:
>
> > "Correct, we lock the account after 3 days if they did not validate. But that can be removed. They should validate before they can access the app (should already be the case in the mono repo)."

> From `full_documentation/general_getting_started.md:1617` (sign-up happy path, NL):
>
> > U zult ook een e-mail van ons ontvangen om uw account te activeren. Gelieve de instructies in de mail op te volgen.

> From `full_documentation/general_getting_started.md:1646` (change password from profile, NL):
>
> > Er wordt vervolgens een mail naar uw e-mailadres gestuurd om uw wachtwoord te wijzigen.

---

## Source 2 — Meteor source slice

### Files read (27 total)

Flat list grouped by directory. All paths are relative to `/home/tj/Repos/Halingo-Main/`. Walked outward from the entry points cited in `from_source/features/identity_and_authentication.md` and from `practice_user_roles.md`. Stopped at cross-area boundaries (no reads under `api/patients/`, `api/events/`, etc.).

- `app/imports/api/users/` (5 files)
  - `users.jsx` (365 lines) — `Meteor.users.deny`, `salutations`, `certificateModes`, `UserProfessions`, `UserProfile` SimpleSchema (17 fields, `requiredByDefault: false`), `UserSettings` SimpleSchema (certificates + invoices sub-documents), `User` SimpleSchema wrapper (`emails`, `acceptedTerms`, `createdAt`, `profile`, `settings`, `removed`/`removedAt`, `services` blackbox, `roles` top-level string array, `heartbeat`, `createdFromBackendEmail`, `rosaIntegrations[]` with 8 sub-fields), `publicFields`, `publicFieldsDetailed`, helpers (`email`, `fullAddress`, `fullName`, `isVerified`, `isLocked`, `locale`, `name`, `image`, `phone`, `roleInPractice`, `getCertificateMode`, `getNextCertificateNumber`), exported `placeholderUser`.
  - `methods.jsx` (405 lines) — `RegisterSchema` + `register` (line 61, `ValidatedMethod`), `LoginSchema` (line 120, declared but no method), `ForgotPasswordSchema` + `sendResetPasswordMail` (line 141, `ValidatedMethod`), `ResetPasswordSchema` (line 156), `sendChangedPasswordMail` (line 172, `LoggedInValidatedMethod`), `sendVerificationMail` (line 186, `ValidatedMethod`), `verifyEmail` (line 197, `ValidatedMethod`), `ChangeEmailSchema` + `changeEmail` (line 229, `LoggedInValidatedMethod`, explicit `log: false`), `removePendingEmail` (line 262, `LoggedInValidatedMethod`), `updateProfile` (line 272, `LoggedInValidatedMethod` — the `_.omit(profile, "imageUrl")` no-op bug is at line 280), `updateProfileImage` (line 285, `LoggedInValidatedMethod`; the dead avatar-cleanup comment is at lines 305-308), `updateSettings` (line 315, `LoggedInValidatedMethod`; the `invoices.rizivRequired` short-circuit at line 320), `deleteUser` (line 331, `LoggedInValidatedMethod` — **DEPRECATED**), `acceptTerms` (line 341, `LoggedInValidatedMethod`), `connectToRosa` (line 354), `disconnectFromRosa` (line 384).
  - `util.jsx` (17 lines) — `UsersUtil.checkLocked(user)` that throws `user.isLocked` if `user.isLocked()` returns true. Server-side extension merged in from `./server/util`.
  - `userTestData.jsx` (22 lines) — test fixture helper. Listed for traceability, not read in detail.
  - `methods.tests.jsx` (82 lines) — Mocha tests for user methods. Listed for traceability, not read in detail.
- `app/imports/api/users/server/` (6 files)
  - `accounts.jsx` (29 lines) — `Accounts.validateLoginAttempt` hook. Collapses "User not found" and "Incorrect password" into a single `user.incorrectLoginInfo` error (lines 13-16). Refuses login for `removed === true` users with `user.isRemoved` (lines 22-25).
  - `util.jsx` (180 lines) — `_deleteUser` (sets `removed: true` + clears `services.resume.loginTokens`), `_sendChangedPasswordMail`, `_sendResetPasswordMail` (silent on unknown email, throws `user.resetPasswordMail.notSent` if the mail send fails but the user exists), `_sendEmailVerificationMail` (dual lookup: `Accounts.findUserByEmail(email)` OR `Meteor.users.findOne({"profile.pendingEmail": email})`, generates token via local `generateToken()` helper), `_verifyEmail` (the 30-minute TTL math is at line 124: `tokenRecord.when + 30*60000 < new Date()`; the "replace entire emails array on pendingEmail promotion" is at lines 137-146, returning `false` — see the TODO at line 148 about the sentinel).
  - `publications.jsx` (8 lines) — `users.profileData` publication. Publishes `Meteor.users.find({_id: this.userId})` with `publicFieldsDetailed`. Only one user publication; peer data comes through `practiceUser(s)` publications elsewhere.
  - `hooks.js` (18 lines) — `Meteor.users.after.update` hook. If `name()` or `image()` changed pre/post, updates every open `CommissionInvoices` row for the user (joining through `PracticeUsers` to get `practiceIds`).
  - `rosa-users.ts` (165 lines, not read in detail — Rosa integration is out of area)
  - `users.type.ts`, `methods.tests.jsx`, `accounts.tests.jsx`, `index.js` — listed for traceability, not read in detail.
- `app/imports/api/practiceUsers/` (4 files)
  - `practiceUsers.jsx` (192 lines) — the `roles` object literal defining the 62-permission RBAC matrix (owner: 62 perms at lines 9-79, admin: 53 perms at lines 80-142, default: 5 perms at lines 143-153). `PracticeUsers` Collection. Schema: `commission` (sub-document), `createdAt`, `info` (free-text staff note), `role` (defaultValue `"default"`, `allowedValues: _.keys(roles)`), `userId`, `practiceId`, `publicAgendaKey`, `privateAgendaKey`, `removed`/`removedAt`. `publicFields = {role, userId, practiceId}`. One helper: `hasToPayCommission()`.
  - `util.jsx` (47 lines) — `PracticeUsersUtil.checkUserPermission(permission, userId, practiceId)` (line 6, fail-closed on missing userId/practiceId), `checkRolePermission(role, permission)` (line 17, flat `_.includes` on the role's permissions array), `getPracticeUsersOfUser`, `getUsersOfPractice`. No caching; every call hits Mongo.
  - `methods.jsx` (107 lines) — `updateInfo` (line 16, `PermissionValidatedMethod` + `subscription: true`), `updateCommission` (line 32, same + auto-stamps `commission.modifiedAt`), `updateAgendaKeys` (line 54, regenerates missing `publicAgendaKey` / `privateAgendaKey` via `Random.id()`), `updateMyAgendaKeys` (line 75, `LoggedInValidatedMethod` — the one non-permission-guarded method), `getPracticeUsers` (line 92, `PermissionValidatedMethod`, joins `PracticeUsers` with `Meteor.users.profile`). **BUG CONFIRMED:** `SimpleSchema.RegEx.id` (lowercase) at lines 13, 14, 29, 30, 51 — the correct constant is `SimpleSchema.RegEx.Id` with capital I. The lowercase form does not exist.
- `app/imports/api/practiceUsers/server/` (4 files)
  - `publications.jsx` (54 lines) — `practiceUser(practiceId, userId)` publication (line 6, gated by `checkUserPermission('practice.user.view', …)`), `practiceUsers(practiceId, includeRemoved)` publication (line 30, gated only on "is the subscriber a member", with an `includeRemoved` flag that requires owner role). TODO comments at lines 31-34 admit "make reactive".
  - `hooks.js` (50 lines) — `PracticeUsers.after.update` hook with a `DebouncerById` (5000 ms) that rebuilds `CommissionInvoices` rows when the `commission` sub-document changes.
  - `indexes.js` (10 lines) — three single-field indexes: `practiceId`, `removed`, `userId`.
  - `index.js` — module wire-up, listed for traceability.
- `app/imports/api/invitations/` (3 files + server subdir)
  - `invitations.jsx` (32 lines) — `InvitationsCollection` extending `Mongo.Collection`. Schema: `userId` (inviter), `token` (`Random.secret()`), `type` (allowed `["joinPractice"]`), `data` (blackbox object), `createdAt`. All client writes denied. `publicFields = {data, createdAt}` — `token` is never published.
  - `methods.jsx` (52 lines) — `acceptInvitation` (line 15, `LoggedInValidatedMethod`, takes `{token}`, delegates to server `util.acceptInvitation`), `removeInvitation` (line 29, `PermissionValidatedMethod` against `invitations.remove` permission — but the permission constant is not listed in any role's permission array in `practiceUsers.jsx`, so this method is effectively denied for everyone; **dead** code path, the real cancel runs via `practice.user.invite.remove`).
  - `routes.jsx` (55 lines) — FlowRouter `/invitations/accept/:token` route. `triggersEnter` calls `AuthenticationUtil.addOnLoginAction` which queues `acceptInvitation.call({token}, cb)` to run post-login. The action mounts `EmptyContainer` with `<LoadingPage/>` and `showLoginConfirm: true` so anonymous visitors see the login form first.
- `app/imports/api/invitations/server/` (3 files)
  - `util.jsx` (72 lines) — `types.joinPractice.parse(userId, data)` (lines 9-31, idempotent insert of a `PracticeUsers` row with role `"default"` if not already a member, returns `{redirect: "home", sessionVariables: {currentPracticeId: practiceId}, message: "invites.practice.success"}`), `_acceptInvitation(userId, token)` (line 34, **deletes the invitation row before dispatching** — see TODO at line 35 about multi-server race), `_generateLink(userId, type, data)` (line 46, `upsert` on `{userId, type, data}` so resends rotate the token).
  - `publications.js` (10 lines) — `practiceInvitations(practiceId)` publication. **BUG CONFIRMED:** no auth check. Any logged-in user can subscribe with any `practiceId` and get the list of pending invitations (emails included, via `publicFields.data`). Scheduled to be fixed per Q4.
  - `index.js` — module wire-up.
- `app/imports/modules/authentication/` (8 files)
  - `AuthenticationContainer.jsx` (36 lines) — `withTracker` wrapper that subscribes to `users.profileData` and calls `setLocale(user.profile.locale)` and `moment.locale(user.profile.locale)` when the user loads. Exposes `loggedIn`, `loggingIn` to the layout. Also exports `addAuthenticationContainer(container)` wrapper used by the invitation / verify-email routes.
  - `AuthenticationLayout.jsx` (272 lines) — layout wrapper. **The seasonal background carousel lives here** (lines 24-184: 11 themed periods with 1-9 images each, picked at random inside the current date window). Also renders the "already logged in, confirm to continue" overlay when `showLoginConfirm` is true.
  - `AuthenticationOverlay.jsx` (73 lines, not fully read) — confirms "you are still logged in as X" banner on routes that require authentication.
  - `TermsOfAgreement.jsx` (13 lines) — thin component rendering the translated ToC text.
  - `termsCheck.jsx` (80 lines) — `TermsCheckBox` blocking modal. Opens when `user.acceptedTerms !== "3"`. Two buttons: `logout` (`Meteor.logout()`) and `modal.submit` (`acceptTerms.call`). Has a `canAccept` state flag wired to a `checkReachedBottom` scroll handler but the flag is not actually connected to the button's `disabled` prop — scrolling is cosmetic.
  - `index.js` — barrel export.
- `app/imports/modules/authentication/pages/` (5 files)
  - `LoginPage.jsx` (102 lines) — email + password form. Calls `Meteor.loginWithPassword(email, password, cb)` directly (not via a Halingo method). Schema-validates client-side against `LoginSchema`. On success, calls `props.onComplete(res)` or defaults to `FlowRouter.go("home")`. Links to `/register` and `/forgot`.
  - `RegisterPage.jsx` (208 lines) — email + locale dropdown + password + confirmPassword + `ToCAccepted` checkbox + two hidden `referralUserId` / `referralId` inputs (read from query params `referral_user_id` / `referral_id` at line 42-43). On submit, validates against `RegisterSchema`, calls `register.call(values, cb)`, then on success immediately calls `Meteor.loginWithPassword(email, password, cb)` (line 109). `defaultProps.onComplete` references an out-of-scope `res` variable at line 202 — latent bug, probably caught silently if the callback never runs.
  - `ForgotPasswordPage.jsx` (90 lines) — single email field + RESET button. Calls `sendResetPasswordMail.call({email}, cb)`. On success shows `NotificationManager.success('sendMail.success')` and clears the field. Always reports success shape to the UI — the server-side silence on unknown emails is preserved end-to-end.
  - `ResetPasswordPage.jsx` (108 lines) — two password fields. On submit calls `Accounts.resetPassword(localStorage.getItem('resetPasswordToken'), values.password, cb)` **directly** (not via a Halingo method). Then `localStorage.removeItem('resetPasswordToken')`. `defaultProps.onComplete` calls `sendChangedPasswordMail.call()` after success. A commented-out line 54 suggests a previous version used `Session.get("resetPasswordToken")`.
  - `styles.js` — shared withStyles helper, listed for traceability.
- `app/imports/ui/pages/users/profile-page/` (4 files)
  - `ProfilePage.jsx` (~270 lines, read lines 1-130) — Two `FormGroup` instances: `formGroup` (all 17 profile fields) and `settingsFormGroup` (nested `invoices: { personalNote, rizivRequired }`). `componentWillMount` patches the form values from the user document and wires `fieldChanges.pipe(debounceTime(500))` to call `updateProfile.call(values, cb)` (line 115). Same pattern for settings. Error path calls `logClientError.call(...)`. Auto-save, no explicit Save button.
  - `ProfilePageUserInformation.jsx` — left-column fields (name, gender, salutation, birthday, locale). Listed for traceability.
  - `ProfilePageAdditionalInformation.jsx` — right-column fields (address, phone, RIZIV, IBAN, company number, profession, etc.). Listed for traceability.
  - `ProfilePagePicture.jsx` — avatar uploader via `Avatars` CollectionFS. Listed for traceability.
- `app/imports/ui/pages/users/profile-page/email-validation/` (3 files)
  - `ProfileEmails.jsx` (97 lines) — renders the emails table + two buttons ("Change email" toggles `ChangeEmailModal`, "Reset password" calls `sendResetPasswordMail.call({email: user.email()}, cb)`). The reset-from-profile path is the convenience for "rotate my password without retyping the old one".
  - `EmailValidationBox.jsx` — row component for one email with "resend verification" and (optionally) "remove" icons. Listed for traceability.
  - `ChangeEmailModal.jsx` (80+ lines, read first 80) — form: email + confirmEmail + password. On submit calls `changeEmail.call({email, confirmEmail, password}, cb)`. No second verification step in the modal — the verification happens out-of-band via the email link.
- `app/imports/ui/pages/practices/users/` (5 files — files on disk but not read in detail; existence verified, file:line citations in HalingoDoc are taken as current)
  - `PracticeUsers.jsx`, `PracticeUserRole.jsx`, `PracticeInvitation.jsx`, `PracticeUserPage.jsx`, `PracticeUsersCarousel.jsx`.
- `app/imports/ui/containers/practices/users/` (3 files — listed for traceability)
  - `PracticeUsersContainer.jsx`, `PracticeUserPageContainer.jsx`, `PracticeUsersCarouselContainer.jsx`.
- `app/imports/ui/containers/users/` (3 files — listed for traceability)
  - `ProfilePageContainer.jsx`, `ProfilePicture.jsx`, `CurrentUserProfileCard.js`.
- `app/imports/api/practice/` (2 files, partially read — only the identity-relevant methods)
  - `methods.jsx` (485 lines) — read lines 145-290. `inviteUser` (line 153, `PermissionValidatedMethod` + `subscription: true`, enforces plan user-limit via `plan.canAddUsers(numberOfUsers + invitedUsers)` at lines 168-170, delegates to `practicesUtil.inviteUser`), `removeInvitation` (line 177, takes `{email, practiceId}`, delegates to `practicesUtil.removeInvitation`), `removeUser` (line 187, `async` — imports `RosaPractices` and has a commented-out "TODO: remove from Rosa" at lines 205-208), `changeRole` (line 215, **hard-refuses `role === "owner"`** at line 238, pushes to Rosa after success), `makeOwner` (line 256, **atomic role swap** at lines 276-278: target becomes owner, current user becomes admin, both via `practicesUtil.changeRole` without transactional guarantees).
  - `server/util.tsx` (468 lines) — read lines 75-165. `_inviteUser` (line 80, checks `isAlreadyUser` throws `practice.inviteUser.alreadyMember`, calls `invitationsUtil.generateLink`, sends `invitationForPractice` mail with `locale` from `practice.settings.invoices.locale` — note the deprecation on practice locale, see `deprecation_list.md` #18), `_removeInvitation` (line 133), `_removeUser` (line 140, selector `{role: {$ne: "owner"}}` refuses owner, cascades to `PatientFileUsers.remove` for all files in the practice at lines 148-153), `_changeRole` (line 158, validates `role` against `_.keys(PracticeUsersRoles)`).
- `app/imports/lib/permissions/` (3 files)
  - `Permissions.jsx` (53 lines) — `PermissionsUtil.addWhiteListCheck`, `addBlackListCheck`, `checkPermission`. Disjunctive whitelist, conjunctive blacklist. All checks fail-closed (empty whitelist returns `true` only if length is 0; with any checks registered, at least one must pass).
  - `LoggedInValidatedMethod.jsx` (61 lines) — base class. Enforces `methodInvocation.userId`. Wraps `super._execute` in try/catch and a Promise `.catch`, calling `logEnd({error, errorType})` on failure. **`logEnd` only writes on failure** — successful calls leave no trace. See `method_audit_log.md` for the broader context.
  - `PermissionValidatedMethod.jsx` (43 lines) — extends `LoggedInValidatedMethod`. Adds `getPermissionData`, `permissions` array (defaults to the method name), `requiresSubscription` flag. Before executing, checks subscription (throws `NO_ACTIVE_SUB_FOR_PRACTICE` if declared `subscription: true` and the practice has no active sub) and then checks every permission via `PermissionsUtil.checkPermission(permission, userId, data)` (throws `errors.permissions.<permission>` on failure).
- `app/imports/startup/client/routes/` (3 files relevant)
  - `authentication.js` (116 lines) — FlowRouter routes: `/login` → `LoginPage`, `/register` → `RegisterPage`, `/forgot` → `ForgotPasswordPage`, `/reset` → `ResetPasswordPage`, `/toc` → inline TermsOfAgreement component, `/verify-email/:token` → `LoadingPage` with a `triggersEnter` that queues `verifyEmail.call({token}, cb)` via `AuthenticationUtil.addOnLoginAction`. All routes use `FlowRouter.route(…)`.
  - `user.js` (21 lines) — single route `/user/profile` → `authenticatedMount(AppContainer, {main: <ProfilePageContainer/>})`.
  - `practice.jsx` (read lines 1-80) — `/practices/users` → `PracticeUsersContainer` (line 46) and `/practices/users/:userId` → `PracticeUserPageContainer` (line 56), both under `practiceRoutes` group with `requiresPractice: true`.
- `app/imports/startup/lib/bootstrap/permissions.jsx` (17 lines) — `Meteor.startup` registers the two whitelist checks at lines 6-11: `PracticeUsersUtil.checkUserPermission` against `data.practiceId` and `PatientFileUsersUtil.checkUserPermission` against `data.patientFileId`. Commented-out blacklist at lines 12-14 that would gate on active subscription — superseded by the per-method `subscription: true` flag.
- `app/imports/lib/mails/mailTemplates/accounts/` (4 files — existence verified, not read in detail)
  - `welcome.jsx`, `verifyEmail.jsx`, `resetPassword.jsx`, `passwordChanged.jsx`.
- `app/imports/lib/mails/mailTemplates/practices/` (relevant file)
  - `invitationForPractice.jsx` — email template used by `_inviteUser`. Existence confirmed; content not read in detail (Phase 2 spec author will inspect it per-feature).

### Key symbols per file

Consolidated so reviewers can trace any feature to its file:line.

- `api/users/methods.jsx:19-59` — `RegisterSchema` (email, password min 6, confirmPassword matches, locale in `locales` default `nl`, `ToCAccepted` must be truthy, optional `referralUserId` + `referralId`).
- `api/users/methods.jsx:61-114` — `register` method. On server: `Accounts.createUser`, stamps `acceptedTerms: "3"`, handles referral state-machine, calls `sendEmailVerificationMail(email, true)` for the welcome path, returns `{userId}` or `{userId, err}` on mail failure.
- `api/users/methods.jsx:120-128` — `LoginSchema` (declared, no method — login goes via `Meteor.loginWithPassword`).
- `api/users/methods.jsx:141-150` — `sendResetPasswordMail` method.
- `api/users/methods.jsx:172-180` — `sendChangedPasswordMail` method (called client-side after successful reset).
- `api/users/methods.jsx:186-195` — `sendVerificationMail` (resend).
- `api/users/methods.jsx:197-206` — `verifyEmail` method (consumes token).
- `api/users/methods.jsx:211-228` — `ChangeEmailSchema`.
- `api/users/methods.jsx:229-260` — `changeEmail` method. Re-auths via `Accounts._checkPassword` (Meteor-private API), throws `user.duplicateEmail` if taken, sets `profile.pendingEmail`, sends verification mail to the new address. Declared with `log: false`.
- `api/users/methods.jsx:262-270` — `removePendingEmail` method (`$unset` on `profile.pendingEmail`).
- `api/users/methods.jsx:272-284` — `updateProfile`. **Bug at line 280:** `_.omit(profile, "imageUrl")` is pure and the result is discarded — the `imageUrl` would overwrite if the client sent one, but in practice it doesn't.
- `api/users/methods.jsx:285-313` — `updateProfileImage`. Commented-out avatar-cleanup block at lines 305-308 notes avatars are referenced from commission invoices.
- `api/users/methods.jsx:315-329` — `updateSettings`. Silently returns `false` at line 320-322 if `invoices.rizivRequired` is not in the payload. `$set: {settings}` replaces the entire sub-document.
- `api/users/methods.jsx:331-338` — `deleteUser`. **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #2.
- `api/users/methods.jsx:341-351` — `acceptTerms` method. Hardcodes `acceptedTerms: "3"`.
- `api/users/users.jsx:17-27` — client-side deny-all on `Meteor.users`.
- `api/users/users.jsx:40-97` — `UserProfile` SimpleSchema.
- `api/users/users.jsx:99-142` — `UserSettings` SimpleSchema.
- `api/users/users.jsx:144-242` — `Meteor.users.User` SimpleSchema.
- `api/users/users.jsx:248-265` — `publicFields` and `publicFieldsDetailed`.
- `api/users/users.jsx:287-293` — `isVerified()` and `isLocked()` helpers. The 3-day lock logic is at line 291-293. **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #19.
- `api/users/util.jsx:4-8` — `checkLocked` guard.
- `api/users/server/util.jsx:20-30` — `_deleteUser`. **DEPRECATED — DO NOT PORT**.
- `api/users/server/util.jsx:41-66` — `_sendResetPasswordMail`. Silent on unknown email (no throw if `Accounts.findUserByEmail` returns nothing).
- `api/users/server/util.jsx:68-109` — `_sendEmailVerificationMail`. Dual lookup primary OR pending email.
- `api/users/server/util.jsx:111-160` — `_verifyEmail`. 30-min TTL at line 112 + 124. The "promote pendingEmail, replace entire emails array" branch at lines 137-146. Returns `true` for primary-email verify, `false` for pendingEmail promotion (sentinel; see TODO at line 148).
- `api/users/server/accounts.jsx:4-29` — `Accounts.validateLoginAttempt` hook. Collapses errors and blocks removed users.
- `api/users/server/publications.jsx:1-8` — `users.profileData` publication.
- `api/users/server/hooks.js:6-17` — `Meteor.users.after.update` fan-out to open commission invoices.
- `api/practiceUsers/practiceUsers.jsx:8-153` — the `roles` object (62 / 53 / 5 permissions).
- `api/practiceUsers/practiceUsers.jsx:163-177` — `PracticeUsers.schema`.
- `api/practiceUsers/util.jsx:6-14` — `_checkUserPermission` fail-closed on missing ids.
- `api/practiceUsers/methods.jsx:11-15` — `updateInfoSchema`. **BUG CONFIRMED:** `SimpleSchema.RegEx.id` lowercase at lines 13, 14.
- `api/practiceUsers/methods.jsx:16-25` — `updateInfo` (`PermissionValidatedMethod` + `subscription: true`).
- `api/practiceUsers/methods.jsx:27-48` — `updateCommission`. Auto-stamps `modifiedAt` if unchanged from the old value.
- `api/practiceUsers/methods.jsx:50-73` — `updateAgendaKeys`. Generates `publicAgendaKey` / `privateAgendaKey` via `Random.id()`.
- `api/practiceUsers/methods.jsx:75-90` — `updateMyAgendaKeys` (one-off `LoggedInValidatedMethod`, not `PermissionValidatedMethod`).
- `api/practiceUsers/methods.jsx:92-106` — `getPracticeUsers` (joined `PracticeUsers` + `Meteor.users.profile`).
- `api/practiceUsers/server/publications.jsx:6-28` — `practiceUser` publication (gated).
- `api/practiceUsers/server/publications.jsx:30-54` — `practiceUsers` publication (member-only, `includeRemoved` requires owner).
- `api/practiceUsers/server/hooks.js:48-50` — `PracticeUsers.after.update` → debounced `updateCommissions`.
- `api/practiceUsers/server/indexes.js:6-8` — three indexes.
- `api/invitations/invitations.jsx:7-28` — collection, deny-all, schema, public fields.
- `api/invitations/methods.jsx:15-27` — `acceptInvitation` (live).
- `api/invitations/methods.jsx:29-51` — `removeInvitation` (dead — permission never listed in any role).
- `api/invitations/routes.jsx:29-55` — `/invitations/accept/:token` route with `addOnLoginAction`.
- `api/invitations/server/util.jsx:8-32` — `types.joinPractice.parse` (idempotent insert).
- `api/invitations/server/util.jsx:34-44` — `_acceptInvitation` — **row removed before dispatch** (TODO line 35 about multi-server race).
- `api/invitations/server/util.jsx:46-61` — `_generateLink` (upsert rotates token).
- `api/invitations/server/publications.js:5-10` — `practiceInvitations` publication. **BUG CONFIRMED:** no auth check. Per Q4, needs scoping.
- `api/practice/methods.jsx:141-175` — `inviteUser` (plan-limit enforcement).
- `api/practice/methods.jsx:177-185` — `removeInvitation` (the one that's actually wired from the UI; distinct from `invitations.remove`).
- `api/practice/methods.jsx:187-213` — `removeUser` (cascade to patientFileUsers; commented-out Rosa removal).
- `api/practice/methods.jsx:215-254` — `changeRole` (refuses `"owner"`).
- `api/practice/methods.jsx:256-290` — `makeOwner` (atomic swap: target → owner, caller → admin).
- `api/practice/server/util.tsx:80-131` — `_inviteUser` (duplicate check, `generateLink`, mail send, in-app notification insert if target is already a user).
- `api/practice/server/util.tsx:140-156` — `_removeUser` (owner-refusing selector, cascade to `patientFileUsers`).
- `api/practice/server/util.tsx:158-164` — `_changeRole`.
- `startup/client/routes/authentication.js:35-116` — FlowRouter routes `/login`, `/register`, `/forgot`, `/reset`, `/toc`, `/verify-email/:token`.
- `startup/client/routes/user.js:12-21` — FlowRouter route `/user/profile`.
- `startup/client/routes/practice.jsx:46-65` — FlowRouter routes `/practices/users` and `/practices/users/:userId`.
- `startup/lib/bootstrap/permissions.jsx:5-16` — whitelist check registration.
- `lib/permissions/Permissions.jsx:1-52` — dispatcher.
- `lib/permissions/LoggedInValidatedMethod.jsx:9-59` — method wrapper with failure-only logging.
- `lib/permissions/PermissionValidatedMethod.jsx:6-42` — subscription guard + per-permission check.
- `modules/authentication/AuthenticationContainer.jsx:11-21` — withTracker wrapper with locale bootstrap.
- `modules/authentication/AuthenticationLayout.jsx:24-184` — **seasonal background carousel** (11 periods, 1-9 images each). Not in HalingoDoc.
- `modules/authentication/termsCheck.jsx:44-69` — blocking ToC modal.
- `modules/authentication/pages/LoginPage.jsx:43-54` — login submit calls `Meteor.loginWithPassword` directly.
- `modules/authentication/pages/RegisterPage.jsx:42-43` — hidden `referralUserId` / `referralId` form controls.
- `modules/authentication/pages/RegisterPage.jsx:100-121` — register submit, follows with auto-login.
- `modules/authentication/pages/RegisterPage.jsx:198-208` — `defaultProps.onComplete` with out-of-scope `res` reference (latent bug).
- `modules/authentication/pages/ForgotPasswordPage.jsx:45-56` — forgot submit.
- `modules/authentication/pages/ResetPasswordPage.jsx:47-60` — calls `Accounts.resetPassword(localStorage.getItem('resetPasswordToken'), values.password, cb)` directly.
- `modules/authentication/pages/ResetPasswordPage.jsx:101-108` — `defaultProps.onComplete` calls `sendChangedPasswordMail.call()` after success.
- `ui/pages/users/profile-page/ProfilePage.jsx:65-94` — two FormGroups.
- `ui/pages/users/profile-page/ProfilePage.jsx:96-130` — debounced auto-save wiring.
- `ui/pages/users/profile-page/email-validation/ProfileEmails.jsx:44-56` — "Reset password" button calls `sendResetPasswordMail` with current user's email.
- `ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:32-80` — change-email form.

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | `users.register` line number | `identity_and_authentication.md:71` cites `methods.jsx:62` | Source says line 61 | Source (minor — HalingoDoc was written before some earlier line) |
| 2 | Register returns | `identity_and_authentication.md:88` cites `sendEmailVerificationMail(email, true)` "as welcome" | Source matches — line 101 calls it inside try/catch, returns `{userId, err}` on mail failure | Confirmed |
| 3 | `changeEmail` logging | Not mentioned in HalingoDoc | Source has explicit `log: false` at line 232 | Additive — source is more specific. HalingoDoc implicitly assumes all methods log on failure but this one does not. Worth noting because the password re-auth via `Accounts._checkPassword` is a security-sensitive path that should arguably be audited. |
| 4 | `deleteUser` guard | `identity_and_authentication.md:148` says `LoggedInValidatedMethod`, no arguments | Source matches but also calls `UsersUtil.checkLocked` at line 335 before `UsersUtil.deleteUser` — a locked user cannot even self-delete | Source; HalingoDoc's prose is correct but drops the lock check |
| 5 | `practiceInvitations` auth check | `invitations.md:91-92` flags as "no permission gating" | Source confirms: `server/publications.js:5-10` has no auth check at all | Confirmed — bug, per Q4 |
| 6 | `SimpleSchema.RegEx.id` lowercase | `bugs_and_security_findings.md` §"Schema / validation drift" flags it at `practiceUsers/methods.jsx:13, 14, 29, 30, 51` | Source confirms: lines 13, 14 are in `updateInfoSchema`; lines 29, 30 are in `updateCommissionSchema.extend`; line 51 is in `updateAgendaKeysSchema` | Confirmed |
| 7 | Seasonal background carousel | **NOT MENTIONED** in any HalingoDoc file | Source: `AuthenticationLayout.jsx:24-184` — 11 themed periods + random pick + date window logic | Source; new finding. User-visible; needs a feature row. |
| 8 | `RegisterPage.defaultProps.onComplete` references undefined `res` | Not mentioned | Source line 202: `if (res.err) { … }` — but `res` is not in scope (it's in the `register.call` callback upstream, not at `defaultProps` level) | Source; latent bug worth flagging. Likely masked because `props.onComplete` is overridden by the caller in the invitation-accept flow, so the default is never actually executed. |
| 9 | `/reset` page token source | `identity_and_authentication.md:108` says "the reset token is therefore assumed to be already present in `localStorage` — presumably written by a `triggersEnter` hook on the `/reset` route that reads it from a URL, but that hook is not in the authentication routes file" | Source confirms: `authentication.js:62-69` has no `triggersEnter`, `ResetPasswordPage.jsx:55` reads from `localStorage` directly, and line 56 removes it after reading. **There is no visible hook in app code that writes the localStorage key.** The write must come from Meteor accounts-base's internal hash-route handler (`/#/reset-password/:token`), which is how the Meteor URL is normally routed. | Source confirms the ambiguity; this stays a `[NEEDS CLARIFICATION]` (Q1). |
| 10 | ToC checkbox "must scroll to bottom" flag | `identity_and_authentication.md:144` says "wires the flag into state but does not disable the submit button based on it" | Source confirms: `termsCheck.jsx:36-42, 55-69` — `canAccept` is updated but the Modal's buttons don't reference it | Confirmed |

---

## Source 3 — Staging exploration

**Staging URL (first pass, 2026-04-08):** `$STAGING_METEOR_URL` (resolved from `.halingo-staging.env`). Actual URL resolved: `https://dev.app.halingo.be`.
**Local instance (follow-up pass, 2026-04-09):** `http://localhost:3000` (Meteor 2.0 + bundled MongoDB 6.0 on port 27117 started by `/home/tj/Repos/Halingo-Main/local-dev/start.sh`). Six `_PARITY_TEST_` accounts seeded per `test-accounts-local.md`. Local was chosen over staging because (a) staging had no provisioned test accounts in `_PARITY_` namespace, (b) local is isolated from any shared state, (c) local mirrors the same legacy Meteor codebase at the same commit, and (d) the seed script is idempotent and fully scriptable.
**Screens captured:** 10 public + **17 gated** (owner/admin/lid dashboards, profile page, practice-users roster from three roles, practice-user detail from two roles, practice settings from two roles, ToC blocking modal, notifications view, practices overview for multi user, unverified-user dashboard, login-confirm probe) = **27 total**.
**Screens not reached:** 2 (logout redirect — no `/logout` route exists in `authentication.js`, logout is a programmatic `Meteor.logout()` call from the topbar menu and cannot be triggered via URL; login-confirm ceremony — requires a persistent session across two sequential page loads which `browser-check.js` fresh-session harness cannot replicate in one invocation).
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/identity/`

### Per-screen catalog

| # | URL | Screen | Language | Fields / actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/login` | Login | NL | Email field (placeholder "Vul je e-mailadres in"), password field ("Vul je wachtwoord in"), "AANMELDEN" button, "Nog geen account?" link to `/register`, "Wachtwoord vergeten?" link to `/forgot`. **Seasonal background confirmed** (spring / countryside scene). | `01-login-nl.png` |
| 2 | `/login?locale=fr` | Login (FR) | FR | Email field ("Entrez votre adresse email"), password field ("Mot de passe"), "CONNEXION" button, "Pas encore de compte?" link, "Mot de passe oublié?" link. **Different seasonal background** (pink blossoms — spring). FR locale via query param works. | `02-login-fr.png` |
| 3 | `/register` | Sign-up | NL | Email field, locale dropdown (defaulted to "Nederlands"), password, "Herhaal je wachtwoord" (confirm password), ToC checkbox labelled `Ik heb de **gebruiksvoorwaarden** gelezen en goedgekeurd` with `gebruiksvoorwaarden` as an inline link (opens the ToC modal), REGISTREER button, "Al een account?" link. **Tulip-field seasonal background** (spring). Form matches `RegisterSchema` fields from source. | `03-register-nl.png` |
| 4 | `/forgot` | Forgot password | NL | Single email field ("Vul je e-mailadres in"), RESET button, "Aanmelden" back-link. Robin on blossom-branch seasonal background. | `04-forgot-nl.png` |
| 5 | `/reset` | Reset password | NL | **Reached without a URL token.** Form renders anyway: two password fields ("Vul je wachtwoord in" + "Herhaal je wachtwoord"), RESET button, "Aanmelden" back-link. No pre-check for a token in localStorage — the page blindly renders and will fail server-side with `Accounts.resetPassword(null, …)` when submitted. Same blossom background as `/forgot`. Confirms Q9 discrepancy from Source 2. | `05-reset-nl.png` |
| 6 | `/toc` | Terms of agreement | NL | Raw legal text (`Artikel 1. Algemeen`, `Artikel 2. Definities` …) rendered **without the Halingo card chrome** — no logo, no background, just the ToC body on a white background. Not in HalingoDoc. | `06-toc-nl.png` |
| 7 | `/verify-email/FAKETOKEN_PARITY_PROBE_1744200000` | Verify email — invalid token | NL | Because the route is `authenticatedMount` with `showLoginConfirm: true`, an anonymous visitor sees the **login form** first. The `triggersEnter` queues `verifyEmail.call({token}, cb)` via `AuthenticationUtil.addOnLoginAction`, which fires only after a successful login. Tulip-field background with the login card overlay. Confirms the login-gated verify behavior from Source 2. | `07-verify-email-invalid.png` |
| 8 | `/register?locale=fr` | Sign-up (FR) | FR | Email ("Entrez votre adresse email"), locale dropdown ("Français"), "Mot de passe", "Répétez le mot de passe", ToC checkbox `J'ai lu et j'accepte les **Conditions d'utilisation**` with inline link, S'ENREGISTRER button, "Déjà un compte?" link. Tulip-field background (same locale-invariant backgrounds). | `08-register-fr.png` |
| 9 | `/invitations/accept/FAKETOKEN_PARITY_PROBE_1744200001` | Invitation accept — invalid token | NL | Same `authenticatedMount + showLoginConfirm: true` behavior: anonymous visitor sees the login form first. Dessert with raspberries seasonal background. After login, the `addOnLoginAction` would fire `acceptInvitation.call({token}, cb)` and throw `errors.token.notFound`, bouncing to `/home` per the route's error handler. | `09-invitation-accept-invalid.png` |
| 10 | `/register?referral_user_id=notarealid&locale=nl` | Sign-up with referral | NL | **Visually identical** to `/register` — the `referral_user_id` is a hidden `FormControl` (`RegisterPage.jsx:42`), invisible to the end user. Confirms that referral tracking is silent from the user's perspective. Blossom background. | `10-register-with-referral.png` |
| 11 | `/` (dashboard) | Home dashboard — owner | NL | **Auth: owner (`_PARITY_TEST_owner@example.com`).** Logged-in landing page. Topbar: HALINGO logo, hamburger, search box ("Zoeken..."), bell (notifications) icon, `?` (help) icon, user menu ("Anke Van Damme"). Left nav (full): `_PARITY_TEST_Praktijk_A` practice selector with green dot, Dashboard, Agenda, Patiëntendossiers, Financieel, Praktijk, Rizv, Rosa. Main area: yellow subscription-missing banner ("Deze praktijk heeft geen abonnement en u kunt dus geen aanpassingen maken, **klik hier om er één te selecteren**"), "Welkom Anke" heading, agenda bar chart for the week ("Je lijst vergaderingen vooraleer afspraken"), "Openstaand bedrag €0,00" card, "Taken" (Todos) empty card, "Reviews" section ("Geen nieuws"), chat bubble bottom-right. | `11-dashboard-owner.png` |
| 12 | `/user/profile` | User profile — owner | NL | **Auth: owner.** Breadcrumb Home › Profiel. Left column "Profiel" card with avatar placeholder, firstName "Anke", lastName "Van Damme", locale dropdown "Nederlands", salutation, gender, birthday "12/06/1985", email field. Right column: address ("Meirplein 12, 2000 Antwerpen, BE"), phone +32 4 4521-12-98, mobile +32 4 75 17 22 33, RIZIV number, company number, bank account IBAN. "Factuurnummering" / "Rizv vereist" settings checkbox visible in right card footer. No explicit Save button — matches debounced-autosave pattern from source (`ProfilePage.jsx:96-130`). | `12-profile-owner.png` |
| 13 | `/practices/users` | Practice users roster — owner | NL | **Auth: owner.** Breadcrumb Praktijk › Leden. Grid of 5 member cards (no soft-deleted user shown): Anke Van Damme (owner, green chip), Sofie Peeters (admin), Joris De Smet (lid), Claire Dubois (multi, lid on this practice), Marc Jansen (unverified, lid). Each card: avatar placeholder, name, phone number, email (`_PARITY_TEST_*@example.com`), role chip in card footer. Subscription banner = owner variant ("klik hier om er één te selecteren"). **No visible "Invite user" button or pending-invitations carousel** — likely gated on `subscription: true` (practice has no active sub, so `practice.user.invite` throws `NO_ACTIVE_SUB_FOR_PRACTICE` and the button is hidden). | `13-practice-users-owner.png` |
| 14 | `/practices/users` | Practice users roster — admin | NL | **Auth: admin (`_PARITY_TEST_admin@example.com`, "Sofie Peeters").** Identical layout, same 5 cards, same role chips. Left nav unchanged (full set Dashboard/Agenda/Patiëntendossiers/Financieel/Praktijk/Rizv/Rosa). Subscription banner = owner variant ("klik hier om er één te selecteren") — **the admin sees the same actionable banner as the owner**, not the lid variant. | `14-practice-users-admin.png` |
| 15 | `/practices/users` | Practice users roster — lid | NL | **Auth: lid (`_PARITY_TEST_lid@example.com`, "Joris De Smet").** Identical card grid (same 5 members visible — lid can read the roster via the un-permission-gated `practiceUsers` publication). Left nav unchanged. Subscription banner text differs: **"...gelieve de verantwoordelijke te contacteren"** (please contact the owner) instead of the owner/admin "klik hier om er één te selecteren". **RBAC-aware banner text, not just button-level gating** — important UI cue. | `15-practice-users-lid.png` |
| 16 | `/` (dashboard) | Home dashboard — admin | NL | **Auth: admin.** Same layout as screen 11, "Welkom Sofie" heading. Left nav identical to owner (Dashboard, Agenda, Patiëntendossiers, Financieel, Praktijk, Rizv, Rosa — **no RBAC-based menu hiding** at the top level). Same owner-variant subscription banner. Bell, help, user menu all visible. | `16-dashboard-admin.png` |
| 17 | `/` (dashboard) | Home dashboard — lid | NL | **Auth: lid.** Same layout, "Welkom Joris" heading. **Left nav is IDENTICAL** to owner/admin — all 7 items (Dashboard, Agenda, Patiëntendossiers, Financieel, Praktijk, Rizv, Rosa) visible to a 5-permission lid. RBAC enforcement happens per-page, not via menu hiding. Subscription banner = lid variant ("gelieve de verantwoordelijke te contacteren"). | `17-dashboard-lid.png` |
| 18 | `/practices/users/:userId` | Practice user detail — owner viewing admin | NL | **Auth: owner viewing Sofie Peeters (admin).** Breadcrumb Praktijk › Leden › Sofie Peeters. Left card "Info therapeut" with avatar placeholder, Sofie Peeters name, role chip "beheerder", address ("Grote Markt 5, 3000 Leuven"), phone +32 4 75 17 22 33, email `_PARITY_TEST_admin@example.com`, RIZIV number, company number, bank account. Right card "Praktijkcommissie" with "Type commissie: NONE" and "Geldig vanaf: april 2026". **The makeOwner / remove / role-change / info-note / commission-form controls are either below the fold OR gated away because the practice has no active subscription.** The page itself loaded (no 404), confirming `practice.user.view` permission for the owner. | `18-practice-user-detail-owner.png` |
| 19 | `/practices/settings` | Practice settings — owner | NL | **Auth: owner.** Breadcrumb Praktijk › Instellingen. "Instellingen" title. "Facturatie" section with Type factuurtie (normal), Taal factuur (Nederlands), **Sjabloon factuur: 4 invoice template thumbnails** (template chooser grid). Subscription banner = owner variant. Confirms the practice-settings page is one of the `subscription: true` methods gating the save path, but the GET-render is unblocked. | `19-practice-settings-owner.png` |
| 20 | `/` (dashboard) | Home dashboard — multi user on Practice B | **FR** | **Auth: multi (`_PARITY_TEST_multi@example.com`, "Claire Dubois").** Default active practice on login = Practice B (French). **Entire UI renders in French because `profile.locale = "fr"` on the user document** (locale is a user property, not a practice property — confirms `AuthenticationContainer.jsx:14-15` locale bootstrap). Left nav in French: Tableau de bord, Agenda, Dossiers patient, Finances, Cabinet (not "Praktijk"), Iniviti, Rosa. Main: "Bienvenue Claire" heading, French subscription banner ("Ce cabinet n'a pas d'abonnement..."), French agenda axis labels (Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche), "À faire" (Todos), "Pas de nouvelles" (No news). Practice selector top-left shows `_PARITY_TEST_Praktijk_B`. Confirms multi-practice membership: user is active on Practice B (the one where they are owner). | `20-dashboard-multi.png` |
| 21 | `/` (dashboard) | Home dashboard — unverified user | NL | **Auth: unverified (`_PARITY_TEST_unverified@example.com`, "Marc Jansen").** **Login succeeds and the user lands on a FULL dashboard, indistinguishable from a verified lid's dashboard.** No nag banner, no forced redirect, no email-verification reminder, no "verify your email" CTA. Left nav full (Dashboard, Agenda, Patiëntendossiers, Financieel, Praktijk, Rizv, Rosa). Welcome "Welkom Marc". Only warning shown is the standard subscription banner (lid variant). **This empirically resolves Q4**: the legacy Meteor app does NOT block login or surface any UI nag for unverified users. The 3-day lock (`UsersUtil.checkLocked`) is a backend mutation-time guard only; it has no UI manifestation at login or on the dashboard. | `21-dashboard-unverified.png` |
| 22 | `/` (dashboard) with blocking ToC modal | Terms-of-agreement blocking modal — owner | NL | **Auth: owner, with `acceptedTerms` temporarily backdated to `"1"` via direct Mongo update.** Dashboard renders underneath but is fully obscured by a centered modal overlay titled "Gebruiksvoorwaarden" (Terms of use) showing "Artikel 1: Algemeen" and "Artikel 2: Definities" visible ToC body. The dashboard "Welkom" heading is visible behind the modal. **Scroll-to-bottom button wiring is cosmetic** per source feature #14 — scroll state is tracked but not wired to the submit button's `disabled` prop. Modal buttons not visible in the captured viewport (likely below fold). **`acceptedTerms` restored to `"3"` immediately after capture — cleanup verified.** | `22-toc-modal-blocking.png` |
| 23 | `/notifications` | Notifications overview — owner | NL | **Auth: owner.** Breadcrumb Home › Overzicht meldingen. "Overzicht meldingen" title. Single card "Overzicht huidige meldingen" with centered "Geen meldingen" (No notifications) empty-state text. **No notifications seeded** — this is the canonical empty-state for an account with zero in-app notifications. The notifications bell icon in the topbar does not have any visible unread badge when count=0. | `23-notifications-owner.png` |
| 24 | `/verify-email/FAKETOKEN` with auth | Login-confirm ceremony — NOT reproduced | NL | **Auth: owner, URL target `/verify-email/FAKETOKEN_PARITY_PROBE_LOGINCONFIRM`.** `browser-check.js` harness logged in from a fresh session, the `triggersEnter` queued a `verifyEmail.call({token})` that ran during login, the verify threw on the fake token, and the user was redirected to `/` (dashboard) as the fallback. **The login-confirm ceremony (`showLoginConfirm: true` "continue as X / logout" overlay) was NOT reproduced** — it requires navigating to `/verify-email/:token` while ALREADY authenticated from a prior session, which the fresh-session harness cannot replicate in a single browser-check.js invocation. Screen shows the post-queued-verify dashboard landing, equivalent to screen 11. The ceremony itself (per `AuthenticationOverlay.jsx`) remains visually undocumented — Phase 2 spec author should exercise the flow manually via a persistent session. | `24-login-confirm-ceremony.png` |
| 25 | `/practices` | Practices overview — multi user | **FR** | **Auth: multi.** `/practices` (the group root, not `/practices/users`) renders `PracticesOverviewContainer`. **Interesting layout:** despite the user being on Practice B at login, the practices overview shows a single practice detail view with Practice A's info (name `_PARITY_TEST_Praktijk_A`, address Meirplein 12, 2000 Antwerpen, ondernemingsnummer, BTW). UI chrome is French ("Cabinet", "Information sur le cabinet", left nav in FR) but the shown practice data is NL. Big green "MEMBRES" button visible. **This screen is not the "practice switcher" per se** — the switcher lives in the top-left practice selector dropdown. What's captured here is the practices overview landing page that shows one practice's card. Phase 2 spec author will need to walk the dropdown interaction by manual click to capture the switcher dropdown state. | `25-practice-switcher-multi.png` |
| 26 | `/practices/users/:userId` | Practice user detail — lid | NL | **Auth: lid (Joris De Smet) attempting to view Sofie Peeters's detail page.** **Shows "De gevraagde pagina bestaat niet" (The requested page does not exist)** — the 404 page. Breadcrumb still shows Home › Praktijk › Leden › (empty). **Confirms the source-level `PermissionRender('practice.user.view', …, <NotFoundPage/>)` guard** on `PracticeUserPage` — a lid lacks `practice.user.view` permission and gets the 404 NotFoundPage fallback, not a "forbidden" error. Subscription banner = lid variant. **This is the canonical demonstration of PermissionRender-as-404 in the legacy UI.** | `26-practice-user-detail-lid.png` |
| 27 | `/practices/settings` | Practice settings — lid | NL | **Auth: lid.** Breadcrumb Praktijk › Instellingen, "Instellingen" title visible. **BUT the content area is completely empty** — no invoice template thumbnails, no form, no sections. The page renders just the title + breadcrumb + empty body. Different behavior from screen 26 (hard 404): here the route itself is accessible, but the internal page body is permission-gated section-by-section, and with 0 sections visible the lid effectively sees nothing. Subscription banner = lid variant. **Two distinct lid-rejection patterns observed: (a) hard 404 via `PermissionRender` wrapping the whole page (practice user detail), (b) silent empty body via per-section gating (practice settings).** | `27-practice-settings-lid.png` |

### Behavior observed on staging

- **Seasonal backgrounds are live.** Three distinct backgrounds were observed across 10 screenshots taken within minutes of each other (countryside / spring field, pink blossoms, tulip field, blossom with robin, dessert with raspberries). The code picks randomly per-render, so different navigations get different images. Confirms `AuthenticationLayout.jsx:24-184` is active on staging.
- **FR locale works via `?locale=fr` query param**, not just via a user setting. Both `/login?locale=fr` and `/register?locale=fr` render with FR translations. Anonymous users can switch locale without needing a profile.
- **`/reset` renders without a token** and does not show any indication that a token is missing. This is a UX gap: a user who navigates directly to `/reset` (e.g., via the nav link inside the forgot-password flow) is shown a form that cannot possibly succeed. The server-side `Accounts.resetPassword(null, …)` would throw, but the UI gives no guidance.
- **`/verify-email/:token` and `/invitations/accept/:token` are login-gated.** Anonymous visitors to these routes see the login form; only after authenticating does the `addOnLoginAction` callback fire. Confirms the queued-action design from Source 2.
- **`/toc` renders without the Halingo card chrome.** The page is just the ToC text on a white background. Inside `/register`, the same ToC component is embedded in a modal, so the two contexts render differently.
- **The register form's ToC link is inline**, not a separate "I have read" button — the ToC modal opens when the user clicks the `gebruiksvoorwaarden` / `Conditions d'utilisation` word within the checkbox label.
- **No CSRF token, no 2FA prompt, no rate-limit lockout banner.** All four identity routes are pure forms with no visible anti-bot or rate-limiting UI.

### Gated screen walk (2026-04-09 follow-up pass, using local Meteor + test accounts)

**17 gated screens walked** via `/home/tj/Repos/Halingo-Main/local-dev/browser-check.js` (headless Puppeteer + login automation) against a local Meteor 2.0 instance started by `local-dev/start.sh`. Local was used instead of staging because staging had no `_PARITY_` test accounts; local was seeded fresh via `06-prompts/tools/seed-local-test-accounts.mjs` per `test-accounts-local.md`. **No production, no staging writes.**

#### RBAC visibility findings — owner vs admin vs lid on Practice A

The 62/53/5-permission matrix is enforced **per-page and per-section**, not via top-level menu hiding. Key empirical findings:

1. **The left navigation is identical across all three roles.** Dashboard, Agenda, Patiëntendossiers, Financieel, Praktijk, Rizv, Rosa — all 7 items visible to owner, admin, AND lid. No RBAC menu trimming. Confirmed by comparing screenshots 11 (owner), 16 (admin), 17 (lid) side-by-side.
2. **The practice-users roster (`/practices/users`) is readable by all three roles**, showing the same 5 member cards with identical role chips. This matches the source: the `practiceUsers` publication at `api/practiceUsers/server/publications.jsx:30` is gated only on "is the subscriber a member", not on a permission. A lid sees the full roster. Confirmed by comparing screenshots 13 (owner), 14 (admin), 15 (lid).
3. **The subscription banner text varies by role.** Owner and admin see the actionable variant: *"Deze praktijk heeft geen abonnement en u kunt dus geen aanpassingen maken, **klik hier om er één te selecteren**"* (...click here to select one). Lid sees the advisory variant: *"Deze praktijk heeft geen abonnement en u kunt dus geen aanpassingen maken, **gelieve de verantwoordelijke te contacteren**"* (...please contact the owner). **This is RBAC-aware banner text, not just button-level gating** — a new finding not captured in the source read. The owner/admin text is linked ("klik hier") and navigates to the subscription page; the lid text is plain text (no link) since the lid lacks `practice.subscription.*` permissions.
4. **Practice-user detail (`/practices/users/:userId`) returns a hard 404 for the lid.** The `PermissionRender('practice.user.view', <PracticeUserPage/>, <NotFoundPage/>)` wrapper (documented in source feature #42) is confirmed empirically: the lid navigating directly to `/practices/users/rvDkWnLuiso3PWJjd` sees *"De gevraagde pagina bestaat niet"* on a blank page (screen 26), while the owner sees the full detail card (screen 18). The breadcrumb still renders "Home › Praktijk › Leden" for the lid but the content panel is the NotFoundPage.
5. **Practice settings (`/practices/settings`) uses a different rejection pattern.** The route itself is accessible to the lid (no 404), but the content body is COMPLETELY EMPTY — just the title and breadcrumb, no invoice template cards, no form sections (screen 27). The owner sees 4 invoice template thumbnails + the Facturatie form (screen 19). This is per-section `PermissionRender` gating rather than page-level 404. **Two distinct lid-rejection patterns thus coexist in the legacy UI:**
   - **Hard 404** via `PermissionRender` wrapping the entire page (practice-user detail)
   - **Silent empty body** via per-section `PermissionRender` gating (practice settings)
6. **The owner's practice-user-detail page did NOT show visible "Make owner" / "Remove user" / role-change controls in the captured viewport.** Those controls are either (a) below the fold at 1280×800, or (b) hidden because the practice has no active subscription and all those methods declare `subscription: true` (so they throw `NO_ACTIVE_SUB_FOR_PRACTICE` and the UI conditionally hides them). Worth confirming in Phase 2 spec authoring via a manual click-through on an active-subscription practice.

#### New QUIRK-PRESERVE candidates surfaced by the gated walk

- **Subscription banner text is RBAC-aware.** Not previously documented in source discovery — the banner's call-to-action phrase is different for owner/admin vs lid. Candidate: `identity/subscription-banner-rbac-aware-text` (if the Phase 2 spec author treats the text as parity-relevant).
- **Unverified user sees a fully unrestricted UI.** Empirically the unverified user's dashboard is visually indistinguishable from a verified lid's dashboard — no nag banner, no modal, no warning, no restriction. The 3-day lock is purely backend mutation-time enforcement. This empirically confirms deprecation #19's rationale ("should be enforced upstream") AND confirms that current legacy has zero UI affordance for the "your email is unverified" state. If parity wants a nag banner, that is NEW behavior, not a carry-over.
- **Left-nav uniformity across roles.** The legacy app does NOT trim menu items by role — a lid sees all 7 navigation entries. If a new implementation trims the nav, that is a divergence from legacy parity, not a bug fix.
- **`/practices` root renders a single practice card even for multi-practice users.** Screen 25 showed the multi user landing at `/practices` and seeing Practice A's card (not Practice B, which was the currently-active practice at login). The practices-overview-as-landing renders per-practice details rather than a switcher UI. The actual switcher is presumably in the top-left practice-selector dropdown (not captured via URL navigation).
- **User locale is the ONLY locale authority.** The multi user with `profile.locale = "fr"` sees the entire UI in French, including when viewing Practice A (NL practice). The practice's invoice-locale field is effectively unused for UI chrome — this empirically confirms `deprecation_list.md` #18 (per-practice invoice locale deprecated in favor of user locale).

#### Things that contradict NOTHING in the first pass

Every behavior observed during the gated walk either (a) confirms a source finding or (b) extends it with a new observable detail. Nothing in the gated walk contradicts HalingoDoc, the Meteor source read, or the staging public-screen walk. Specifically:
- The ToC blocking modal fires exactly as `termsCheck.jsx:44-69` describes when `acceptedTerms !== "3"`.
- The profile page uses debounced autosave (no visible Save button) matching `ProfilePage.jsx:96-130`.
- The practice-users roster reads via the un-permission-gated `practiceUsers` publication (all roles see it).
- The invitation carousel / invite button visibility matches `subscription: true` gating — not visible on a no-sub practice.
- The locale bootstrap via `AuthenticationContainer.jsx:14-15` (`setLocale(user.profile.locale)`) is confirmed by the multi user's all-French UI even on a NL practice.

### Screens not reached (and why)

- **Logout redirect flow** — no `/logout` URL route exists in `startup/client/routes/authentication.js`; logout is a programmatic `Meteor.logout()` call from the topbar menu. Capturing requires click automation on the user-menu dropdown, which `browser-check.js` does not expose. Documented behavior from source: `Meteor.logout()` clears `services.resume.loginTokens`, browser session cookie is removed, user is redirected to `/login`. Phase 3 test author will exercise the flow via Cypress click interactions.
- **Login-confirm ceremony (`AuthenticationOverlay.jsx` "continue as X / logout")** — requires navigating to `/verify-email/:token` or `/invitations/accept/:token` while ALREADY authenticated from a prior session. `browser-check.js` always runs a fresh-session login inside each invocation, so the queued-action fires during login itself rather than on a second page-load after auth. Screen 24 shows the fallback landing page. Phase 2 spec author should reproduce manually with a persistent browser session.
- **Practice switcher dropdown interaction** — the top-left practice selector opens a dropdown on click showing the list of practices the user belongs to. Capturing the dropdown requires click automation on the selector control. Screen 25 shows the `/practices` root landing page for the multi user but NOT the dropdown itself. Phase 2 spec author should capture the dropdown via manual click.
- **Invitation email content** — not a staging *screen* but the email template rendered by `invitationForPractice.jsx`. Cannot be captured without actually sending an invite from a logged-in owner session on a subscription-active practice. Phase 2 spec authoring can render it against a fixture.
- **Practice-user detail action buttons (makeOwner/remove/role-change)** — screen 18 captured the owner view of Sofie Peeters's detail page but did not surface the action controls in the 1280×800 viewport. Controls may be below the fold OR hidden by the `subscription: true` gating on all `practice.user.*` methods when the practice has no active subscription. Phase 2 spec author should re-walk on a subscription-active practice (or scroll the captured page in an interactive session) to confirm.

---

## Features

A feature is the smallest user-visible behaviour that can be tested in isolation. Aggressive splitting. Every row cites at least one source.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `identity/signup` | Self-service account creation (email + locale + password + ToC) | docs + source + staging | `api/users/methods.jsx:19-114` (`RegisterSchema`, `register` method); `modules/authentication/pages/RegisterPage.jsx` | `from_source/features/identity_and_authentication.md:71-92`; `full_documentation/general_getting_started.md:1582-1618` | `/register` (screenshots #3 NL, #8 FR) | ToCAccepted required, min-6 password, email-regex, auto-login after success via `Meteor.loginWithPassword`. Accepts `referralUserId` / `referralId` via hidden query-param form fields. Cross-references area #20 SaaS Lifecycle (referral programme). |
| 2 | `identity/login` | Email + password login | docs + source + staging | `api/users/server/accounts.jsx:4-29` (`validateLoginAttempt` hook); `modules/authentication/pages/LoginPage.jsx:43-54` | `from_source/features/identity_and_authentication.md:94-99`; `full_documentation/general_getting_started.md:1497-1526` | `/login` (screenshots #1 NL, #2 FR) | No `users.login` method — goes through `Meteor.loginWithPassword` directly. Both "user not found" and "bad password" collapse to `user.incorrectLoginInfo`. Soft-deleted users get distinct `user.isRemoved`. |
| 3 | `identity/logout` | Logout via the global session | source only | `modules/authentication/termsCheck.jsx:32-34` (`Meteor.logout()`); used throughout the nav bar | — (not in the files read) | — (gated screen, not reached) | Standard Meteor `Meteor.logout()`. The ToC blocking modal uses it as the "decline" path. No Halingo-specific wrapper. Not visible without auth. |
| 4 | `identity/password-forgot-request` | Request a reset link via email | docs + source + staging | `api/users/methods.jsx:134-150` (`ForgotPasswordSchema`, `sendResetPasswordMail`); `api/users/server/util.jsx:41-66` (`_sendResetPasswordMail`); `modules/authentication/pages/ForgotPasswordPage.jsx` | `from_source/features/identity_and_authentication.md:100-104`; `full_documentation/general_getting_started.md:1532-1577` | `/forgot` (screenshot #4) | **Silent on unknown email** — no throw, no hint, UI always shows success. Anti-enumeration. Token generated via `Accounts.generateResetToken`, URL built via `Accounts.urls.resetPassword` with `?locale=` appended. Email template: `ResetPasswordMail`. |
| 5 | `identity/password-reset-via-token` | Complete the reset by setting a new password | docs + source + staging (render-only) | `modules/authentication/pages/ResetPasswordPage.jsx:47-60` (`Accounts.resetPassword(localStorage.getItem('resetPasswordToken'), password, cb)`) | `from_source/features/identity_and_authentication.md:104-108` | `/reset` (screenshot #5) | **Does NOT call a Halingo method — calls Meteor's `Accounts.resetPassword` directly.** Token source is `localStorage.resetPasswordToken`. The write path of that localStorage key is NOT in Halingo app code — see [NEEDS CLARIFICATION] Q1. On success, the client also calls `sendChangedPasswordMail.call()` as a courtesy notification. |
| 6 | `identity/password-changed-notification` | After a successful reset, send a "your password changed" notification email | docs + source | `api/users/methods.jsx:172-180` (`sendChangedPasswordMail`); `api/users/server/util.jsx:32-39` (`_sendChangedPasswordMail`) | `from_source/features/identity_and_authentication.md:106` | — | Fire-and-forget. Server doesn't enforce it, the client calls it after `Accounts.resetPassword` success. If the client fails (network, etc.) the email is never sent. Template: `PasswordChangedEmail`. |
| 7 | `identity/password-reset-from-profile` | Logged-in user clicks "Reset password" on profile, receives a reset link | docs + source | `ui/pages/users/profile-page/email-validation/ProfileEmails.jsx:44-56` (`sendResetPasswordMail.call({email: user.email()}, …)`) | `from_source/features/user_profile.md:163`; `full_documentation/general_getting_started.md:1623-1669` | — (gated) | Convenience for "rotate password without remembering the old one". Reuses the same `users.password.reset.mail` method as the anonymous flow — no distinct "authenticated rotate" path. |
| 8 | `identity/email-verify-on-signup` | Send welcome + verification email immediately after sign-up | docs + source | `api/users/methods.jsx:100-107` (in `register`); `api/users/server/util.jsx:68-109` (`_sendEmailVerificationMail`); template `lib/mails/mailTemplates/accounts/welcome.jsx` | `from_source/features/identity_and_authentication.md:86-92`; `full_documentation/general_getting_started.md:773-778` | — | On signup, `isWelcome=true` routes through `WelcomeMail` instead of `VerifyEmailMail`. 30-minute token TTL. If the mail fails, `register` returns `{userId, err}` instead of throwing so the account is still created. Spam-folder fallback is in the helpdesk FAQ. |
| 9 | `identity/email-verify-via-token` | Click the verification link in the email to flip `emails.$.verified = true` | docs + source + staging (negative test) | `api/users/methods.jsx:197-206` (`verifyEmail`); `api/users/server/util.jsx:111-160` (`_verifyEmail`); `startup/client/routes/authentication.js:85-116` (the `/verify-email/:token` route) | `from_source/features/identity_and_authentication.md:111-126` | `/verify-email/:token` (screenshot #7 — fake token probe) | **Login-gated.** `triggersEnter` queues the call via `addOnLoginAction` — anonymous visitors see the login form first. 30-min TTL (throws `user.verifyEmailTokenExpired`). Invalid token throws `user.verifyEmailTokenInvalid`. Mismatched address throws `user.verifyEmailUnknownAddress`. |
| 10 | `identity/email-verify-resend` | Resend the verification email for an unverified address | docs + source | `api/users/methods.jsx:186-195` (`sendVerificationMail`); used by `EmailValidationBox` | `from_source/features/identity_and_authentication.md:115`; `full_documentation/general_getting_started.md:1729-1732` | — (gated) | The profile page has a "send verification mail" icon per-email row. |
| 11 | `identity/email-change` | Start changing the primary email (requires password re-auth) | docs + source | `api/users/methods.jsx:229-260` (`changeEmail`, takes `{email, confirmEmail, password}`); `ChangeEmailModal.jsx` | `from_source/features/identity_and_authentication.md:128-136`; `full_documentation/general_getting_started.md:1673-1732` | — (gated) | Declared with `log: false`. Uses Meteor's private `Accounts._checkPassword` for re-auth. Throws `user.invalidPassword` or `user.duplicateEmail`. Sets `profile.pendingEmail` and sends verification to the new address. **Note:** the password re-auth is security-sensitive but is deliberately not logged in `MethodLogger` (`log: false`). |
| 12 | `identity/email-change-verify-and-replace` | Clicking the verification link on a pending email **replaces the entire emails array** with just `[{address: pendingEmail, verified: true}]` and clears `pendingEmail` | docs + source | `api/users/server/util.jsx:137-148` (the `emails: [{…}]` replace block) | `from_source/features/identity_and_authentication.md:121-125` (flagged as "replaces entire emails array") | — | **Potential QUIRK-PRESERVE:** the full-array replace semantics mean any alternate email entries are lost on a pending-email confirmation. Halingo's UI only ever shows one primary email, so this is not observable as a data-loss bug today. Behavioural contract worth flagging because the legacy app conflates "change primary email" with "overwrite the entire emails array". |
| 13 | `identity/email-change-pending-cancel` | Remove a pending email change before it's verified | docs + source | `api/users/methods.jsx:262-270` (`removePendingEmail`) | `from_source/features/identity_and_authentication.md:138` | — (gated) | `$unset` on `profile.pendingEmail`. Invoked from a "remove" icon next to the pending-email row in the profile emails table. |
| 14 | `identity/terms-of-service-accept` | One-shot ToC acceptance via `users.terms.accept` | docs + source | `api/users/methods.jsx:341-351` (`acceptTerms`); `modules/authentication/termsCheck.jsx` | `from_source/features/identity_and_authentication.md:140-145` | — (gated — the blocking modal only appears after login when `acceptedTerms !== "3"`) | Sets `acceptedTerms: "3"` (hardcoded string sentinel). The `"3"` is the terms-version marker; bumping to v4 requires touching `methods.jsx:77, 347` and `termsCheck.jsx:51`. No migration / version table. **QUIRK-PRESERVE candidate:** the "scroll-to-bottom" flag on the modal is wired to state but not connected to the submit button — scrolling is cosmetic. |
| 15 | `identity/terms-of-service-inline-register` | ToC embedded in the `/register` form as an inline checkbox with a modal trigger | docs + source + staging | `modules/authentication/pages/RegisterPage.jsx:128-135, 166-174` (Modal + Checkbox with `url="/ToC"` attribute); link handler in `captureLink()` at lines 59-69 | `from_source/features/identity_and_authentication.md:33` | `/register` (screenshots #3, #8) | Different UX from feature #14 (which is the blocking modal). The register-page version is a modal that opens when the user clicks the `gebruiksvoorwaarden` word. |
| 16 | `identity/terms-of-service-standalone-page` | `/toc` route rendering the ToC body on a plain white background | source + staging | `startup/client/routes/authentication.js:71-83` (`/toc` FlowRouter route); `modules/authentication/TermsOfAgreement.jsx` | `from_source/features/identity_and_authentication.md:33` | `/toc` (screenshot #6) | Rendered outside the Halingo card chrome — just the ToC text. Not linked from the login / register pages (you reach it only via the inline link inside the register ToC checkbox, or directly). |
| 17 | `identity/account-deletion` | Soft-delete the current user's own account and log them out everywhere | docs + source | `api/users/methods.jsx:331-338` (`users.delete`); `api/users/server/util.jsx:20-30` (`_deleteUser`) | `from_source/features/identity_and_authentication.md:148-157`; `from_source/deprecation_list.md:28-33` | — (no UI) | **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #2 (Q13: "That should be gone"). No UI exists. Method has `checkLocked` guard on self. Does not cascade to `practiceUsers`, `patientFileUsers`, `events`, `commissionInvoices`, etc. — leaves orphaned references everywhere. GDPR right-to-erasure remains an open product question per `gaps/03_patient_data_privacy.md`. |
| 18 | `identity/account-lock-after-3-days` | A user who does not verify their email within 3 days of sign-up becomes read-only (locked) | docs + source | `api/users/users.jsx:291-293` (`isLocked()` helper); `api/users/util.jsx:4-8` (`checkLocked` guard); called from `methods.jsx:278, 294, 335` | `from_source/features/identity_and_authentication.md:52-63`; `from_source/deprecation_list.md:114-117` | — (would require waiting 3 days) | **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #19 (Q36: "that can be removed"). The heuristic stays live in Halingo-Main; the deprecation entry explains that future enforcement is expected to happen upstream of application access rather than via a lock. |
| 19 | `identity/profile-view-self` | View the current user's profile (the `users.profileData` publication) | source | `api/users/server/publications.jsx:1-8` (`users.profileData`); `ui/containers/users/ProfilePageContainer.jsx` | `from_source/features/user_profile.md:24`, ~186 | — (gated) | Only one user publication exists for self-view. Other users' data comes via `practiceUser(s)` publications (scoped to practice membership). |
| 20 | `identity/profile-edit-general-fields` | Edit name / gender / birthday / salutation / address / phone / RIZIV / IBAN / company-number / profession / deconventioned flag | docs + source | `api/users/methods.jsx:272-284` (`updateProfile`); `ui/pages/users/profile-page/ProfilePage.jsx:96-130` (debounced auto-save) | `from_source/features/user_profile.md:85-98`; `full_documentation/general_getting_started.md:1791-1816` | — (gated) | 500 ms debounce. Full `profile` sub-document replaced via `$set: {profile}` — any field not sent is lost. The form pre-populates from the user document to avoid data loss. `_.omit(profile, "imageUrl")` lodash no-op bug at line 280 — see `user_profile.md:96`. |
| 21 | `identity/profile-change-locale` | Change the interface language (`profile.locale`) | docs + source | part of `users.profile.update`; `modules/authentication/AuthenticationContainer.jsx:14-15` (`setLocale` + `moment.locale` on user document load) | `full_documentation/general_getting_started.md:853-876` | — (gated) | Only `nl` and `fr` supported (`locales` from `app/imports/i18n/index`). The helpdesk explicitly notes this is distinct from the practice invoice language (which is deprecated per `deprecation_list.md` #18). |
| 22 | `identity/profile-avatar-upload` | Upload / change profile picture | docs + source | `api/users/methods.jsx:285-313` (`updateProfileImage`); `ui/pages/users/profile-page/ProfilePagePicture.jsx` | `from_source/features/user_profile.md:100-109`; `full_documentation/general_getting_started.md:1744-1787` | — (gated) | Writes `profile.imageUrl` via a separate method (not via `updateProfile`). Dead avatar-cleanup block at lines 305-308 — old avatars are kept forever because they're referenced from commission invoices. Drag-and-drop + crop UI. |
| 23 | `identity/profile-update-propagates-to-commission-invoices` | When the user's `name()` or `image()` changes, open commission invoices are auto-updated | source | `api/users/server/hooks.js:6-17` (`Meteor.users.after.update` hook) | `from_source/features/user_profile.md:10, 158` | — | Cross-cuts with area #14 Mutualistic Billing. **QUIRK-PRESERVE candidate:** historic commission invoices keep their old `userName` / `userImage` snapshot; only "open" ones update. |
| 24 | `identity/profile-settings-certificate-numbering` | Manual vs printer mode + per-printer offsets + therapist info toggles | source | `api/users/users.jsx:99-142` (`UserSettings` schema); `api/users/methods.jsx:315-329` (`updateSettings`) | `from_source/features/user_profile.md:54-65` | — (gated) | Cross-cuts with area #15 Precision Printing. **Gotcha:** `updateSettings` silently returns `false` if `invoices.rizivRequired` is not in the payload — the UI must include that key on every save. |
| 25 | `identity/profile-settings-invoice-defaults` | `invoices.rizivRequired` toggle + `invoices.personalNote` text | source | `api/users/users.jsx:133-142` (schema); `api/users/methods.jsx:315-329` | `from_source/features/user_profile.md:64-66` | — (gated) | Cross-cuts with area #11 Smart Invoicing. Per-user defaults only — no practice-level equivalent. |
| 26 | `identity/profile-booklet-certificate-counter` | `profile.certificateNumber = { bookNumber, certificateNumber, printerNumber }` with roll-over math | source | `api/users/users.jsx:68-77` (schema); `api/users/users.jsx:320-345` (`getNextCertificateNumber` helper) | `from_source/features/user_profile.md:47-51` | — | Per-user booklet state. Two therapists in the same practice keep independent booklets. `certificateNumber` rolls at 50; `bookNumber` ("NN*NNNN") increments the high 2 or low 4 digits depending on which hits 9999 first. Cross-cuts with area #15. |
| 27 | `identity/practice-role-owner` | Owner role (`praktijkverantwoordelijke`) with 62 permissions | docs + source | `api/practiceUsers/practiceUsers.jsx:9-79` | `from_source/features/practice_user_roles.md:9-15, 54-121`; `glossary.md:38` | — | **The sole role that can touch subscription cancel / resume / plan-change / payment-change and `makeOwner`.** All other owner permissions are shared with admin. |
| 28 | `identity/practice-role-admin` | Admin role (`beheerder`) with 53 permissions | docs + source | `api/practiceUsers/practiceUsers.jsx:80-142` | `from_source/features/practice_user_roles.md:9-15, 54-121, 131-143`; `glossary.md:39` | — | Missing 9 owner permissions (5 subscription + `makeOwner` + `referrals` + `referrals.invite`). Everything else matches owner. |
| 29 | `identity/practice-role-default` | Default / lid role (`lid`) with exactly 5 permissions | docs + source | `api/practiceUsers/practiceUsers.jsx:143-153` | `from_source/features/practice_user_roles.md:147-158`; `glossary.md:40` | — | The 5 perms: `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`. Notable: lid CAN create patient files but cannot view existing ones unless a per-file `PatientFileUsers` row grants access. |
| 30 | `identity/practice-role-invited-pseudo` | Pending invitation pseudo-role (only an i18n label, no real permissions) | docs + source | `ui/pages/practices/users/PracticeInvitation.jsx:46-49` (yellow "Uitgenodigd" chip) | `from_source/features/practice_user_roles.md:228-230` | — | Not in the `roles` object. The label `practice.users.roles.invited` is hand-picked by the component. Once accepted, the user becomes a `default`. |
| 31 | `identity/practice-invitation-send` | Owner/admin sends an email invitation to a colleague | docs + source | `api/practice/methods.jsx:153-175` (`inviteUser`); `api/practice/server/util.tsx:80-131` (`_inviteUser`); `api/invitations/server/util.jsx:46-61` (`_generateLink`); `lib/mails/mailTemplates/practices/invitationForPractice.jsx` | `from_source/features/invitations.md:131-144`; `from_source/features/practice_user_management.md:116-128` | — (gated) | Plan user-limit check server-side (`plan.canAddUsers(numberOfUsers + invitedUsers)`). Sent email locale is pulled from `practice.settings.invoices.locale` (this per-practice locale field is flagged legacy in `deprecation_list.md` #18 — the canonical locale is the user's). If the target email already has an account, also inserts a `Notifications` row. Refuses if the target is already a member. Cross-references area #20 SaaS Lifecycle for the plan cap. |
| 32 | `identity/practice-invitation-resend` | Resend the invitation email (same method, rotated token) | docs + source | Same method (`inviteUser`); `_generateLink` upsert on `{userId, type, data}` | `from_source/features/invitations.md:150-152` | — (gated) | **QUIRK-PRESERVE candidate:** resending rotates the token, making the previous URL immediately invalid. No "view history" of past tokens. |
| 33 | `identity/practice-invitation-cancel` | Remove a pending invitation | docs + source | `api/practice/methods.jsx:177-185` (`removeInvitation`); `api/practice/server/util.tsx:133-138` (`_removeInvitation`) | `from_source/features/invitations.md:154-156` | — (gated) | Deletes by `{data.email, data.practiceId}`. The wired cancel uses `practice.user.invite.remove`; the `invitations.remove` method in `api/invitations/methods.jsx:29` is dead (permission not in any role). |
| 34 | `identity/practice-invitation-accept` | Click the email link, log in / register, auto-join the practice as `default` | docs + source + staging (negative test) | `api/invitations/routes.jsx:29-55`; `api/invitations/methods.jsx:15-27` (`acceptInvitation`); `api/invitations/server/util.jsx:8-44` (types dispatch + `_acceptInvitation`) | `from_source/features/invitations.md:159-175` | `/invitations/accept/:token` (screenshot #9 — invalid token probe) | Single-use. Deletes the invitation row before dispatching. Idempotent if the user is already a member. Redirects to `home` and writes `currentPracticeId` into `RLocalStorage` (via the `sessionVariables` mechanism). **Race TODO at `server/util.jsx:35`** — multi-server double-accept is a theoretical window. |
| 35 | `identity/practice-invitation-list-pending` | Owner/admin views pending invitations on `/practices/users` | docs + source | `api/invitations/server/publications.js:5-10` (`practiceInvitations` publication); `ui/pages/practices/users/PracticeInvitation.jsx` | `from_source/features/invitations.md:91-92`; `from_source/features/practice_user_management.md:29-35` | — (gated) | **BUG:** publication has no auth check — any logged-in user can subscribe with any `practiceId`. Per Q4, needs scoping to `practice.user.view`. |
| 36 | `identity/practice-invitation-no-ttl` | Pending invitations never expire | source | `api/invitations/server/util.jsx` (no TTL logic), `api/invitations/` (no cron job) | `from_source/features/invitations.md:11-12, 212` | — | Explicit non-feature in the legacy. **QUIRK-PRESERVE candidate** — recording as an invariant of current behaviour so the Phase 2 spec author can decide whether parity or a TTL is preferred. |
| 37 | `identity/practice-invitation-no-decline-flow` | Recipient has no "decline" button; ignoring the email is the only way | source | `api/invitations/routes.jsx` (no decline action); `api/invitations/methods.jsx` (no decline method) | `from_source/features/invitations.md:11-12, 214-215` | — | Explicit non-feature. |
| 38 | `identity/practice-user-remove` | Owner/admin removes a practice member | docs + source | `api/practice/methods.jsx:187-213` (`removeUser`); `api/practice/server/util.tsx:140-156` (`_removeUser`) | `from_source/features/practice_user_management.md:146-153` | — (gated) | Soft delete (`removed: true`). **Refuses to remove the owner** via `role: {$ne: "owner"}` selector at `server/util.tsx:144`. Cascades to `patientFileUsers` for all files in the practice at `server/util.tsx:148-153`. Rosa removal is a TODO (`methods.jsx:205-208`). |
| 39 | `identity/practice-user-change-role` | Owner/admin changes a member's role (limited to `admin` ↔ `default`) | docs + source | `api/practice/methods.jsx:215-254` (`changeRole`) | `from_source/features/practice_user_management.md:137-139`; `from_source/features/practice_user_roles.md:218` | — (gated) | **Hard-refuses `role === "owner"`** at line 238. Pushes calendar permissions + patient-file permissions to Rosa after success. No role-change audit trail (per the `MethodLogger` deprecation). |
| 40 | `identity/practice-user-transfer-ownership` | Owner transfers ownership to a non-owner member (atomic swap) | docs + source | `api/practice/methods.jsx:256-290` (`makeOwner`) | `from_source/features/practice_user_management.md:141-143`; `from_source/features/practice_user_roles.md:219-222` | — (gated) | Atomic-ish role swap at lines 276-278: target → owner AND caller → admin. **QUIRK-PRESERVE candidate:** there is no "co-owner" or "multi-owner" state. The swap is not in a Mongo transaction — if the second `changeRole` fails, the practice has no owner. Rosa push after success. |
| 41 | `identity/practice-user-staff-note` | Free-text note on a practice-user row (auto-saved via LiveEditableForm) | docs + source | `api/practiceUsers/methods.jsx:16-25` (`updateInfo`); `lib/formSchemas/practiceUsers/updateInfo.js` | `from_source/features/practice_user_management.md:90, 156-158` | — (gated) | Debounced. Purpose unspecified in code — probably "Jan works Mondays only" reminders. Schema has the lowercase `RegEx.id` typo bug. |
| 42 | `identity/practice-user-view-detail-page` | Owner/admin views a peer's detail page (contact / note / commission form / remove / make-owner buttons) | docs + source | `startup/client/routes/practice.jsx:56-65`; `ui/pages/practices/users/PracticeUserPage.jsx`; `api/practiceUsers/server/publications.jsx:6-28` | `from_source/features/practice_user_management.md:77-97` | — (gated) | Entire page wrapped in `PermissionRender('practice.user.view', …, <NotFoundPage/>)` — a `default` user gets a 404. `practiceUser` publication is separately gated on the same permission. |
| 43 | `identity/practice-user-roster-page` | Owner/admin (and implicitly any member) views the list of practice members + pending invitations | docs + source | `startup/client/routes/practice.jsx:46-55`; `ui/pages/practices/users/PracticeUsers.jsx` | `from_source/features/practice_user_management.md:38-56` | — (gated) | Practice members see the list (via `practiceUsers` publication which is not permission-gated). What differs by role is which actions are exposed via `PermissionRender` guards (invite button, remove icon, role dropdown, etc.). |
| 44 | `identity/practice-chat-legacy` | Three-role chat permissions (`practice.chat`, `practice.chat.read`) | source | `api/practiceUsers/practiceUsers.jsx:38-39, 103-104, 149-150` | `from_source/deprecation_list.md:17-26` | — | **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #1 (Q26: "Do not keep the chat, it's barely used"). All three roles have the perms today but the whole feature is being killed product-wide. Out of area in terms of UI (separate feature file `practice_chat.md`) but the permissions on practice-users are identity-adjacent. |
| 45 | `identity/subscription-gated-method-check` | `PermissionValidatedMethod` subclasses with `subscription: true` additionally check that the practice has an active `Subscriptions` row before the permission check runs | source | `lib/permissions/PermissionValidatedMethod.jsx:15-32` | `from_source/features/practice_user_roles.md:232-255` | — | Cross-cuts with area #20 SaaS Lifecycle. Affects identity because `practice.settings.update`, `practice.user.invite`, `practice.user.role.change`, `practice.user.makeOwner`, `practice.user.update.info`, `practice.user.update.commission`, `practice.user.update.publickeys`, `practice.user.update.privateKey`, `practice.user.get.practiceusers` all declare `subscription: true`. On a cancelled subscription, these throw `NO_ACTIVE_SUB_FOR_PRACTICE`. **Subscription-change methods themselves (cancel / resume / plan-change / payment-change) are `LoggedInValidatedMethod` and do NOT auto-block** on an already-cancelled sub — intentional, so the user can still manage their subscription. |
| 46 | `identity/login-background-carousel` | 11-period seasonal background system on all unauthenticated screens | source + staging | `modules/authentication/AuthenticationLayout.jsx:24-184` | **NOT IN HALINGODOC** | All public screens (screenshots #1-10) | **NEW FINDING not in HalingoDoc.** Periods include Winter, New Year, Spring, Easter (Apr 18-24), Summer, Back-to-school (Aug 24-Sep 8), Autumn, Halloween (Oct 28-Nov 3), Sint (Dec 3-9), Christmas (Dec 22-Mar 19), and duplicates. Image pool sizes 1-9 per period, picked at random inside the current date window. Preference for the shortest-duration matching period (tighter date windows win over broader seasonal ones). QUIRK-PRESERVE candidate if user-facing parity is desired; trivial to drop otherwise. |
| 47 | `identity/failure-only-method-audit-log` | Every `LoggedInValidatedMethod` call that fails (sync throw or Promise rejection) is written to `method-logs` with stack + arguments; successful calls leave no trace | source | `lib/permissions/LoggedInValidatedMethod.jsx:9-59` | `from_source/features/method_audit_log.md` (full); `from_source/deprecation_list.md:103-107` | — | **🪦 DEPRECATED LOGGING — DO NOT PORT** per `deprecation_list.md` #17 (Q22: "That was disabled as we do not want to log all those actions anymore"). The collection exists today and is still being written to on failures. `users.delete`, `users.email.change` (which has explicit `log: false`), `users.terms.accept`, `users.profile.update`, `practiceUsers.updateInfo`, etc. all participate. This is **not a GDPR access audit log** — it is a failure-only error log. Per Q22, the silence on successful calls is intentional, not a bug. |
| 48 | `identity/no-2fa-no-sso-no-social` | Explicit non-feature: no two-factor, no SSO, no social login, no device management anywhere in code | source | All of `api/users/**` (absence of any `services.{google,github,…}`, `services.two-factor`, etc.) | `from_source/features/identity_and_authentication.md:10-13, 207` | — | Recording as a feature row so Phase 2 spec authors cannot miss it. |
| 49 | `identity/admin-impersonation-dormant` | Global-admin-gated `impersonateUser` method exists but is dormant | source | `api/shared/methods.js:49-71` (not read in detail — out-of-area surface); referenced from `bugs_and_security_findings.md` | `from_source/deprecation_list.md:34-37`; `from_source/bugs_and_security_findings.md` (🔴 security section); `from_source/features/admin_impersonation.md` | — | **DEPRECATED — DO NOT PORT** per `deprecation_list.md` #3 (Q23: "should be removed"). Bypasses `LoggedInValidatedMethod` (zero audit trace). Gated only by `Meteor.users.roles.indexOf('admin') !== -1` — the top-level `roles` string array, not the practice-scoped RBAC. No UI, zero in-code callers. Must be invoked via browser console / Meteor shell. Flagged here because it touches the identity surface even though it lives in `api/shared/`. |
| 50 | `identity/createdFromBackendEmail-field` | Schema field `createdFromBackendEmail` on `Meteor.users.User` with no UI, no code reads | source | `api/users/users.jsx:207-210` | `from_source/features/identity_and_authentication.md:47, 197` | — | Presumably used by support staff importing users. Existence-only record. Purpose is a `[NEEDS CLARIFICATION]` Q3. |

**50 features in this area**, of which:
- **4 are marked DEPRECATED — DO NOT PORT**: #17 `users.delete` (deprecation #2), #18 3-day account lock (deprecation #19), #44 practice chat permissions (deprecation #1 — out of area in UI, in-area in role matrix), #47 failure-only method audit log (deprecation #17), #49 admin impersonation (deprecation #3). That's **5 deprecated features**, not 4 — revising.
- **2 are explicit non-features**: #37 no-decline-flow, #48 no-2FA-no-SSO-no-social.
- **1 is a new finding not in HalingoDoc**: #46 login background carousel.
- **Multiple QUIRK-PRESERVE candidates** flagged: #12 email-change-replace-array, #14 ToC scroll flag cosmetic, #23 commission invoice fan-out, #32 invitation resend rotates token, #36 invitations never expire, #40 ownership-transfer atomic swap, #46 seasonal backgrounds.

---

## Cross-references to other areas

- **#3 Patient Data Privacy.** The second RBAC layer (`patientFileUsers`) is documented in area #3's file (`gaps/03_patient_data_privacy.md` and `features/patient_file_access_control.md`); identity owns only the practice-level layer. The two are OR-combined at `api/patientFileUsers/util.jsx`, which means a lid who has a `patientFileUsers` row with any permission on a specific file can bypass the 5-permission limit on that file. GDPR right-to-erasure is not planned — see `gaps/03_patient_data_privacy.md` and the `users.delete` deprecation.
- **#5 Multi-View Scheduling.** Invitation accept writes `currentPracticeId` into `RLocalStorage`, which the agenda consumes as the current-practice context. Profile `agendaKeys` (`publicAgendaKey`, `privateAgendaKey`) are created via `updateAgendaKeys` (a `PermissionValidatedMethod` with `subscription: true`) and consumed by the iCal feed endpoint (area #18). Identity owns the write; scheduling owns the read.
- **#14 Mutualistic Billing.** The `Meteor.users.after.update` hook fans `name()` / `image()` changes out to open `CommissionInvoices`. Identity owns the source of truth; commission invoices consume the snapshot.
- **#15 Precision Printing.** Profile fields `certificateNumber.*` and `settings.certificates.*` (mode, offsets, therapist info toggles) are set here and consumed by the certificate print pipeline.
- **#18 External Platform Sync (Rosa).** `users.rosa.connect` / `users.rosa.disconnect` methods are declared in `api/users/methods.jsx` (for historical reasons) but semantically belong to Rosa. The user document's `rosaIntegrations[]` array is the storage; Rosa owns the business logic. Also, `changeRole` and `makeOwner` call `RosaPractices.setCalendarPermissionsInRosaForPracticeId` and `RosaPatients.updatePermissionsForPatientFilesOfPractice` on success — so role changes inside identity have a Rosa side effect.
- **#20 SaaS Lifecycle.** The `referralUserId` / `referralId` handling during `users.register`, the plan user-limit check on `inviteUser` (`plan.canAddUsers(numberOfUsers + invitedUsers)`), the `subscription: true` guard on most practice-user management methods, and the "subscription cancel / resume / plan-change / payment-change" owner-only permissions are all the identity-side surface of the SaaS subscription lifecycle. The actual subscription machinery lives in area #20.
- **Area adjacent but not in-area:** `#6 Treatment Planning` and `#9 Clinical Reporting` both rely on the `patientFileUsers` additive layer for per-file access grants, so the RBAC contract as described here has downstream consumers in those areas that Phase 2 spec authors for this area should be aware of.

---

## [NEEDS CLARIFICATION]

### Q1: Where does `localStorage.resetPasswordToken` get written?
- **Why it matters:** `ResetPasswordPage.jsx:55` reads the token from `localStorage.getItem('resetPasswordToken')` and `removeItem`s it after successful reset. But there is **no visible hook in Halingo app code that writes the key** — the `/reset` route in `startup/client/routes/authentication.js:62-69` has no `triggersEnter` that reads the URL and writes localStorage. The write must be coming from Meteor's `accounts-base` package via its legacy hash-route handler (`/#/reset-password/:token`), which is how the Meteor mail template would normally URL-encode the token. Parity testing will need the exact URL shape in the email body to construct a valid reset flow — the template file `lib/mails/mailTemplates/accounts/resetPassword.jsx` was not read in detail during this pass.
- **Sources conflict?** No — HalingoDoc's `identity_and_authentication.md:108` already flags the ambiguity, Source 2 confirms the hook doesn't exist, Source 3 confirms `/reset` renders without a token.
- **What would resolve:** inspect `lib/mails/mailTemplates/accounts/resetPassword.jsx` to see the URL shape in the email body, and inspect the Meteor `accounts-base` version pinned in `.meteor/versions` to confirm it still writes `localStorage.resetPasswordToken` on `/#/reset-password/:token` navigation. Phase 2 spec author should nail this down before writing the parity Cypress test for feature #5.

### Q2: Need a staging test account to reach gated identity screens
- **Why it matters:** 5 gated screens (profile page, practice users roster, practice user detail, blocking ToC modal, logged-in email management) could not be reached for Source 3. Parity testing will need a staging account with known email / password / practice membership in `_PARITY_` namespace. The same account can be used by every parity test going forward.
- **Sources conflict?** No — just missing input.
- **What would resolve:** provision a staging account (owner role in a disposable `_PARITY_` practice) and add its credentials to `.halingo-staging.env` per `06-prompts/SECRETS.md`. Second pass of the staging walk can then capture the 5 missing screens.
- **RESOLVED 2026-04-09:** local Meteor test accounts seeded instead of staging — see `01-discovery/test-accounts-local.md` and the six `_PARITY_TEST_*@example.com` accounts (owner/admin/lid/unverified/multi/removed). 17 gated screens captured (see § Source 3 gated screen walk, screenshots 11-27). Local was chosen over staging because (a) no staging `_PARITY_` accounts existed, (b) local is fully isolated, (c) local mirrors the same legacy Meteor codebase/commit, (d) the seed is idempotent and scriptable. Staging test-account provisioning remains open as a separate concern for Phase 3 parity testing, tracked in `06-prompts/SECRETS.md`.

### Q3: What is `profile` field `createdFromBackendEmail` used for?
- **Why it matters:** the field is on the schema (`users.jsx:207-210`) with no code references for display, no UI, no documentation beyond "presumably used by support staff importing users" in `identity_and_authentication.md:197`. Downstream phases will need to know whether it's a foreign-key reference to a "source user" (who did the import), a literal sentinel value ("created-by-script"), or a legacy leftover — the field has no observable user-visible behavior today.
- **Sources conflict?** No.
- **What would resolve:** product owner answer. Staging Mongo query (`db.users.find({createdFromBackendEmail: {$exists: true}}).count()`) would reveal whether any documents have the field populated.

### Q4: Does the 3-day account-lock heuristic actually bite in production?
- **Why it matters:** `deprecation_list.md` #19 flags the lock as retiring (quoting Q36: "they should validate before they can access the app"). But while Halingo-Main is the live legacy, the lock is enforced on every profile mutation. For parity testing, we need to know if any staging tests will trip it. If `_PARITY_` accounts are auto-verified or have a fresh `createdAt`, the lock is irrelevant. If not, parity tests need to handle `user.isLocked` errors.
- **Sources conflict?** No — Q36 answer confirms the lock is current behaviour.
- **What would resolve:** on the `_PARITY_` test account, verify the email within 3 days OR ensure the account is fresh enough. Document the constraint in `06-prompts/SECRETS.md`.
- **RESOLVED 2026-04-09:** the unverified test account (`_PARITY_TEST_unverified@example.com`) logs in successfully via both DDP (`login-user.js`) and the browser form (screen 21). The dashboard renders fully with NO visible nag banner, NO forced redirect, NO email-verification modal, NO disabled navigation. **The legacy Meteor app does NOT block login on an unverified email at all.** The 3-day lock is strictly a backend mutation-time guard (via `UsersUtil.checkLocked` called from specific write methods like `updateProfile`, `updateProfileImage`, `deleteUser`) and has zero UI manifestation at login time or at read-time. Fresh accounts (like the seeded `_PARITY_` ones) are well inside the 3-day window and will not trip the lock during normal test runs. Parity tests that exercise the signup + verify flow should either (a) keep the account under 3 days old throughout the test suite, or (b) set `services.email.verificationTokens` to a known-valid token in Mongo before exercising the verify endpoint.

### Q5: Does the `/register` form submit succeed against staging without a real verification path?
- **Why it matters:** parity tests that cover `identity/signup` will need to submit the form. `register` creates a real `Meteor.users` document on staging Mongo. Cleanup is required per `_PARITY_` namespace rules. Additionally, the form immediately calls `Meteor.loginWithPassword` after success — the parity test needs to handle the auto-login state.
- **Sources conflict?** No.
- **What would resolve:** Phase 3 test-author session with access to a staging Mongo tail for verifying the cleanup, plus the `_PARITY_` naming convention applied to the email address.

### Q6: The email-change method (`changeEmail`) has `log: false` — is that intentional?
- **Why it matters:** `changeEmail` is a security-sensitive operation (it uses `Accounts._checkPassword` for re-auth). Halingo has deliberately opted out of logging even failure cases for this method (explicit `log: false` at line 232). Given the broader deprecation of `MethodLogger` (#17), this may be moot, but it is a distinct editorial decision beyond the blanket deprecation and worth recording as an explicit choice.
- **Sources conflict?** No — Source 2 found `log: false` at line 232, HalingoDoc doesn't mention it.
- **What would resolve:** product owner answer. The answer shapes the Phase 2 spec's "auditability requirements" section for the email-change feature.

---

## [NEEDS DOMAIN REVIEW]

*(empty — Identity Management is generic SaaS. The Belgian domain touchpoints in this area are indirect: `profession === SPEECH_THERAPIST` is the only enum value in normal use and does not encode RIZIV rules; `profile.riziv` is stored as an opaque string with no format validation in the schema; `isDeconventioned` is a boolean flag consumed by certificate / invoice generation in other areas and does not carry identity semantics. If any Belgian-logopedist question surfaces during Phase 2 spec authoring — for example, "must a `SPEECH_THERAPIST` account require a RIZIV number at sign-up time?" — that question will be a `[NEEDS DOMAIN REVIEW]` for the spec-author to resolve via the `logopedist-be` skill, not for discovery.)*

---

## Files in this slice (full traceability list)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md
/home/tj/HalingoDoc/docs/glossary.md
/home/tj/HalingoDoc/docs/full_documentation/general_getting_started.md (partial: §§ around lines 773-778, 853-876, 1497-1732, 1744-1816)
/home/tj/HalingoDoc/docs/from_source/README.md (light read)
/home/tj/HalingoDoc/docs/from_source/inventory.md (§ Identity Management row + top metrics)
/home/tj/HalingoDoc/docs/from_source/features/identity_and_authentication.md (full)
/home/tj/HalingoDoc/docs/from_source/features/practice_user_roles.md (full)
/home/tj/HalingoDoc/docs/from_source/features/practice_user_management.md (full)
/home/tj/HalingoDoc/docs/from_source/features/user_profile.md (full)
/home/tj/HalingoDoc/docs/from_source/features/invitations.md (full)
/home/tj/HalingoDoc/docs/from_source/features/method_audit_log.md (full)
/home/tj/HalingoDoc/docs/from_source/features/referral_programme.md (ctrl-F for register / referral / users.register)
/home/tj/HalingoDoc/docs/from_source/features/rosa_integration.md (ctrl-F for users / rosaIntegrations)
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (full, ctrl-F identity/users/auth/lock/role/invitation)
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (full, ctrl-F identity/auth/user/invitation)
/home/tj/HalingoDoc/docs/from_source/open_questions.md (resolution table + Q3/Q4/Q5/Q13/Q22/Q23/Q25/Q36)

# Meteor source (source 2) — 27 files touched
/home/tj/Repos/Halingo-Main/app/imports/api/users/users.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/accounts.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/publications.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/hooks.js
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/practiceUsers.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/server/publications.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/server/hooks.js
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/server/indexes.js
/home/tj/Repos/Halingo-Main/app/imports/api/invitations/invitations.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invitations/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invitations/routes.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invitations/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invitations/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/api/practice/methods.jsx (partial: lines 145-290 — invite/remove/changeRole/makeOwner)
/home/tj/Repos/Halingo-Main/app/imports/api/practice/server/util.tsx (partial: lines 75-165 — _inviteUser/_removeUser/_changeRole)
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/AuthenticationContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/AuthenticationLayout.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/termsCheck.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/pages/LoginPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/pages/RegisterPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/pages/ForgotPasswordPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/pages/ResetPasswordPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/ProfilePage.jsx (partial: lines 1-130)
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/email-validation/ProfileEmails.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx (partial: lines 1-80)
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/authentication.js
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/user.js
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/practice.jsx (partial: lines 1-80 — practiceUsers routes)
/home/tj/Repos/Halingo-Main/app/imports/startup/lib/bootstrap/permissions.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/Permissions.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/LoggedInValidatedMethod.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/PermissionValidatedMethod.jsx
# Listed for traceability, not read in detail:
/home/tj/Repos/Halingo-Main/app/imports/api/users/methods.tests.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/methods.tests.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/accounts.tests.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/rosa-users.ts
/home/tj/Repos/Halingo-Main/app/imports/api/users/server/users.type.ts
/home/tj/Repos/Halingo-Main/app/imports/api/users/userTestData.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/users/PracticeUsers.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/users/PracticeUserRole.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/users/PracticeInvitation.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/users/PracticeUserPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/users/PracticeUsersCarousel.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/practices/users/PracticeUserPageContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/practices/users/PracticeUsersContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/practices/users/PracticeUsersCarouselContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/users/ProfilePageContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/users/ProfilePicture.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/users/CurrentUserProfileCard.js
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/ProfilePageUserInformation.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/ProfilePageAdditionalInformation.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/ProfilePagePicture.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/email-validation/EmailValidationBox.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/accounts/welcome.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/accounts/verifyEmail.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/accounts/resetPassword.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/accounts/passwordChanged.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/practices/invitationForPractice.jsx

# Staging screenshots (source 3 — original 2026-04-08 public-screen pass against staging)
/home/tj/halingoMigration/01-discovery/staging-screens/identity/01-login-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/02-login-fr.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/03-register-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/04-forgot-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/05-reset-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/06-toc-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/07-verify-email-invalid.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/08-register-fr.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/09-invitation-accept-invalid.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/10-register-with-referral.png

# Local Meteor gated-screen screenshots (source 3 — 2026-04-09 follow-up pass, local + seeded test accounts)
/home/tj/halingoMigration/01-discovery/staging-screens/identity/11-dashboard-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/12-profile-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/13-practice-users-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/14-practice-users-admin.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/15-practice-users-lid.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/16-dashboard-admin.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/17-dashboard-lid.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/18-practice-user-detail-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/19-practice-settings-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/20-dashboard-multi.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/21-dashboard-unverified.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/22-toc-modal-blocking.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/23-notifications-owner.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/24-login-confirm-ceremony.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/25-practice-switcher-multi.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/26-practice-user-detail-lid.png
/home/tj/halingoMigration/01-discovery/staging-screens/identity/27-practice-settings-lid.png
```

---

## Verification notes (verbatim from `01-discovery/identity.verification.md`)

# Verification: Identity Management

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/identity.md`
- **Producer:** Claude Code general-purpose session (not Gemini — noted for rule #7 tracking; same-family verification applies; see Recommendation)
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

Spot-checked the six priority HalingoDoc files cited in the discovery, plus three escalated Meteor source reads.

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "no two-factor authentication, no SSO, no social login, and no device management" | `identity_and_authentication.md:10-13` | ✓ | Verbatim quote confirmed. Exact text at lines 9-14 of the source file. |
| 2 | "The welcome/verification mail contains a 30-minute-valid link" | `identity_and_authentication.md:171` | ✓ | Source file line 171 matches. Escalated Meteor check also confirms: `util.jsx:112` sets `expirationTime = 30` and the math at line 124 is `tokenRecord.when.getTime() + expirationTime * 60000`. Discovery's description of the TTL math is accurate. |
| 3 | "`makeOwner` is a swap: calls `changeRole(target, 'owner')` AND `changeRole(currentUser, 'admin')` in the same method at `practice/methods.jsx:276-278`" | `practice_user_roles.md:219-222` | ✓ | Escalated Meteor check confirms. Actual code at `methods.jsx:276-278`: `practicesUtil.changeRole(userId, practiceId, "owner") && practicesUtil.changeRole(this.userId, practiceId, "admin")`. Precise. Caveat: the swap is not in a Mongo transaction, and the discovery correctly flags this as a QUIRK-PRESERVE candidate. |
| 4 | "`practiceInvitations` publication has no auth check — anyone with a `practiceId` can list pending invitations + invitee emails" | `invitations.md:91-92`; `bugs_and_security_findings.md` | ✓ | Escalated Meteor check confirms. The actual publication at `server/publications.js:5-10` is 7 lines with no `this.userId` check, no `checkUserPermission`, no guard of any kind. Exactly as described. |
| 5 | "Three roles: owner (62 perms), admin/beheerder (53 perms), default/lid (5 perms)" | `practice_user_roles.md` § Totals | ✓ | Confirmed. `practice_user_roles.md:125-127` states exactly "owner: 62 distinct permissions. admin: 53 distinct permissions. default: 5 distinct permissions." Count matches the table in the discovery. |
| 6 | "The owner↔admin delta: 9 permissions (all subscription-related + `makeOwner` + `referrals.*`)" | `practice_user_roles.md:131-143` | ~ | **Partially accurate, needs precision.** The cited source lists the delta as 8 enumerated items (the 9th comment "Everything else is identical" is not a permission). The 8 missing permissions are: `practice.subscriptions.cancel`, `.resume`, `.change`, `.plan.change`, `.payment.change`, `practice.user.makeOwner`, `referrals`, `referrals.invite`. Discovery says "9 permissions" which is the correct count (8 named + 1 dead `practice.subscriptions.change`). However the discovery text says "all subscription-related + `makeOwner` + `referrals.*`" which groups these as only 3 categories. That grouping is correct but the exact count of 9 vs 8 active perms is a subtle precision issue. `practice.subscriptions.change` is dead (deprecation #8) so the effective delta is 8 actionable permissions. This is a minor imprecision, not a material error. |
| 7 | "The 5 default/lid permissions: `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`" | `practice_user_roles.md:147-158` | ✓ | Confirmed verbatim. Source lists exactly these five in the same order. |
| 8 | "`users.delete` — KILL (DEPRECATED DO NOT PORT)" cited as `deprecation_list.md` #2 | `deprecation_list.md:28-32` | ✓ | Confirmed. `deprecation_list.md` entry #2 is headed "🔥 `users.delete` method" with the exact quote "has no UI anywhere; the GDPR self-deletion flow it implies is not part of the current product roadmap." Discovery quote of "GDPR right-to-erasure remains an open product question" also confirmed at line 30. |
| 9 | "`invitations.remove` method is dead — permission not listed in any role" | `invitations.md:71-77` | ✓ | Confirmed. `invitations.md:75` states: "This means `invitations.remove` is effectively denied for everyone at the method level. It is not called from any UI code." Discovery's characterization of the real cancel path as `practice.user.invite.remove` is also confirmed. |
| 10 | "MethodLogger (`deprecation_list.md` #17) — 🪦 legacy — do not port (Q22)" | `deprecation_list.md`; `method_audit_log.md` | ✓ | Confirmed. Source confirms Q22 answer that the MethodLogger was disabled intentionally ("do not want to log all those actions anymore"). |
| 11 | "The `_.omit(profile, 'imageUrl')` lodash no-op bug at `methods.jsx:280`" | `from_source/features/user_profile.md` | ✓ | Confirmed. `user_profile.md:37` states exactly: `updateProfile` explicitly `_.omit`s `imageUrl` and the citation matches `methods.jsx:280`. |
| 12 | "`practiceUsers` publication is NOT permission-gated (only checks subscriber is a member)" | `practice_user_roles.md:226`; `practice_user_management.md:26` | ✓ | Confirmed. Both sources state the `practiceUsers` publication at `publications.jsx:30` only checks that the subscriber is a member, not a permission. Consistent with staging observation (screen 15: lid sees full roster). |
| 13 | "The 3-day account-lock heuristic — DO NOT PORT (deprecation_list.md #19)" | `identity_and_authentication.md:52-63`; `deprecation_list.md` | ✓ | Confirmed. Source lines 52-63 describe `isLocked()` and `checkLocked` guard. `deprecation_list.md` does not have an explicit numbered entry #19 for the 3-day lock, BUT the discovery does cite a Q36 answer ("Correct, we lock...that can be removed") which is confirmed at `identity_and_authentication.md:4` in the legacy notes box at the top of that file. The "deprecation_list.md #19" numbering appears to be the discovery author's own numbering scheme (entries in the deprecation_list.md are identified by heading text, not sequential numbers). |
| 14 | "Admin impersonation dormant — `api/shared/methods.js:49-71`, no UI, scheduled for removal" | `bugs_and_security_findings.md` (🔴 section); `deprecation_list.md` #3 | ✓ | Confirmed. `bugs_and_security_findings.md:20-22` confirms the method at `methods.js:49-71`, the bypass of `LoggedInValidatedMethod`, and "scheduled for removal" via `deprecation_list.md #3`. |
| 15 | "`SimpleSchema.RegEx.id` (lowercase) typo at `practiceUsers/methods.jsx:13, 14, 29, 30, 51`" | `bugs_and_security_findings.md:101-103` | ✓ | Confirmed. Exact line numbers match. Discovery and source both agree that lines 13, 14 are `updateInfoSchema`, lines 29, 30 are `updateCommissionSchema`, line 51 is `updateAgendaKeysSchema`. |
| 16 | "seasonal background carousel — 11 themed periods with 1-9 images each — NOT IN HALINGODOC" | Source 2: `AuthenticationLayout.jsx:24-184`; Source 3: staging screenshots | ✓ | Confirmed. The discovery correctly notes this is absent from all HalingoDoc files. The source file is correctly cited. Staging screenshots 1, 2, 3, 4, 9 show distinct backgrounds. |
| 17 | "`updateSettings` silently returns `false` if `invoices.rizivRequired` not in payload" | `user_profile.md:63`; `methods.jsx:320` | ✓ | Confirmed. `user_profile.md:63` states exactly: "Note: `users.settings.update` short-circuits (`return false`) if `invoices.rizivRequired` is not set in the incoming payload." File:line citation matches. |

**17 citation checks: 15 confirmed (✓), 1 partially accurate (~), 1 with a numbering caveat (✓ with note).**

---

## Material omissions

The discovery file is unusually comprehensive. After reading the six priority HalingoDoc files end-to-end, only two material omissions were found:

### Omission 1 — `patientFileUsers.roles.owner` is DEAD (deprecation_list.md #7)

`deprecation_list.md:54-56` contains entry #7: **"`patientFileUsers.roles.owner` dead"** — confirmed by the product owner as "owner is not used, can be removed." The discovery correctly documents the `patientFileUsers` cross-matrix design (feature #29 and the cross-area reference to #3 Patient Data Privacy), but does NOT explicitly call out the `patientFileUsers.roles.owner` entry as deprecated/dead. This matters for Phase 2 spec authoring: the per-file "owner" role should NOT be ported. The discovery's cross-reference to area #3 handles the per-file access control design, but the deprecation status of the owner role within that layer is not noted in the identity discovery file.

**Severity: CLARIFY.** Phase 2 spec author for any feature touching `patientFileUsers` will need this. The omission is in the identity discovery because identity owns the RBAC matrix description, but the deprecation flag is missing.

### Omission 2 — `practice.subscriptions.change` permission is DEAD (deprecation_list.md #8)

`deprecation_list.md:58-60` contains entry #8: **"`practice.subscriptions.change` permission"** — "dead constant. Listed in the role matrix but no `checkPermission` call references it." The discovery includes `practice.subscriptions.change` in the owner-admin delta (feature #27, feature #28), and `practice_user_roles.md:64` itself notes it as dead with `> ⚠️ Dead or vestigial permission`. However, the discovery does not mark this permission as deprecated in the RBAC feature rows (#27, #28). A Phase 2 spec author counting the delta as "9 permissions" would include a dead one.

**Severity: NOTE.** The discovery's RBAC matrix is accurate — it lists all 62/53/5 permissions. The dead `practice.subscriptions.change` is included in the owner list (correctly, as it is still in the source). The omission is that its deprecation status is not surfaced in the feature catalog rows.

### Omission 3 — `practice_user_management.md` plan-limit client-side tooltip text not captured

`practice_user_management.md:56-57` describes a specific tooltip: "REACHED_LIMIT_USERS_OF_PLAN_UPGRADE_PLEASE" shown when the invite button is disabled by the plan user limit. The discovery covers the plan user-limit check (features #31, #45) but does not record the client-side tooltip i18n key. Minor UX parity item.

**Severity: NOTE.** Cosmetic. The Phase 2 spec author should inspect the tooltip wording. Not parity-blocking.

### Omission 4 — `practice_user_roles.md` explicitly notes `practice.chat` has `//subscription: true` commented out

`practice_user_roles.md:253` notes that `practice.chat` has a commented-out `subscription: true` at `practice/methods.jsx:26`, meaning **chat works during cancellation periods**. Feature #44 in the discovery correctly marks chat as deprecated ("DO NOT PORT"), but for completeness on the `subscription: true` mechanics described in feature #45, the fact that chat was explicitly exempted from the subscription gate is not noted. This is relevant if the Phase 2 spec author needs to document the exhaustive list of subscription-gated methods vs those that deliberately bypass the gate.

**Severity: NOTE.** Chat is deprecated, so this omission has no porting impact.

---

## Cross-area reference check

The discovery lists six cross-area references. Each is verified against the referenced discovery files.

| Cross-reference | Claim in identity discovery | Target area's discovery file | Accurate? | Bidirectional? |
|---|---|---|---|---|
| **#3 Patient Data Privacy** | "Second RBAC layer (`patientFileUsers`) documented in area #3; OR-combined at `api/patientFileUsers/util.jsx`; GDPR right-to-erasure is not planned — see `gaps/03_patient_data_privacy.md`" | `01-discovery/patient-data-privacy.md` reads `from_source/features/patient_file_access_control.md` (confirmed in its source list) and references `deprecation_list.md` `users.delete`. | ✓ Accurate | ~ Patient-data-privacy discovery does reference `patientFileUsers` and `admin_impersonation` but does not explicitly back-reference identity area #1 by name. Directional reference established but not formally reciprocal. |
| **#5 Multi-View Scheduling** | "Invitation accept writes `currentPracticeId` into `RLocalStorage`. Profile `agendaKeys` consumed by iCal feed (area #18). Identity owns the write; scheduling owns the read." | `01-discovery/multi-view-scheduling.md` — grep for `identity`, `agendaKey`, `currentPracticeId` returned no matches. | ~ Plausible but UNVERIFIED in the target file | ~ No bidirectional reference found. The scheduling discovery may cover this without using those exact terms, but the explicit back-reference is missing. |
| **#14 Mutualistic Billing** | "`Meteor.users.after.update` hook fans name/image changes to open `CommissionInvoices`. Identity owns source of truth; commission invoices consume the snapshot." | `01-discovery/mutualistic-billing.md` not checked in detail, but the hook at `api/users/server/hooks.js:6-17` is a code-confirmed fact from the HalingoDoc source. | ✓ Accurate (hook confirmed) | Not verified. |
| **#15 Precision Printing** | "Profile fields `certificateNumber.*` and `settings.certificates.*` set here, consumed by certificate print pipeline." | `01-discovery/precision-printing.md` not checked in detail. The schema facts are confirmed from `user_profile.md`. | ✓ Accurate (schema confirmed) | Not verified. |
| **#18 External Platform Sync (Rosa)** | "`users.rosa.connect/disconnect` in `api/users/methods.jsx`. `rosaIntegrations[]` array is storage; Rosa owns business logic. `changeRole` and `makeOwner` call Rosa after role changes." | `01-discovery/external-platform-sync-rosa.md` exists. Rosa side effects in `changeRole`/`makeOwner` confirmed in `practice_user_roles.md:223`. | ✓ Accurate | Not verified. |
| **#20 SaaS Lifecycle** | "Referral handling during `users.register`, plan user-limit on `inviteUser`, `subscription: true` guards, owner-only subscription permissions." | `01-discovery/saas-lifecycle.md` confirmed to reference `referral_programme.md` and the `referrals` authorization bug. | ✓ Accurate | ~ SaaS-lifecycle discovery references referrals and subscription but not identity area #1 explicitly. |

**Summary:** All six cross-area references are directionally accurate. The back-reference from multi-view scheduling (#5) to identity was not confirmed from the target file — this should be clarified by the Phase 2 spec author when working on agenda keys or the practice-switch mechanism. No cross-reference was found to be factually wrong.

---

## Domain review (logopedist-be)

The discovery file's `[NEEDS DOMAIN REVIEW]` section is **empty** — the author explicitly deferred Belgian healthcare domain questions to Phase 2. However, the task brief calls for active domain verification of any regulatory claim in the discovery. The following claims were submitted to the `logopedist-be` skill.

### Claim D1: `profession` enum has two values: `SPEECH_THERAPIST` / `OTHER`

**Skill finding (from `04-recognition-visa-and-professional-bodies.md`):** Belgian law (KB 20 oktober 1994) defines a single protected professional title "logopedist / logopède / Logopäde" for the entire profession. There are no legally-recognised sub-specialties or regulated sub-categories of logopedie that halingo would need to model as separate profession enum values. The `SPEECH_THERAPIST` / `OTHER` binary is sufficient from a Belgian regulatory standpoint for halingo's use case.

**Verdict: PASS.** The enum is adequate. The `OTHER` value correctly covers non-logopedist users (e.g., practice administrative staff who might use halingo for scheduling or billing support roles). No additional regulated profession types need to be in the enum for a logopedist-focused SaaS.

### Claim D2: `riziv` field stored as opaque string with no format validation

**Skill finding (from `04-recognition-visa-and-professional-bodies.md` §4.2):** A RIZIV number for an individual healthcare provider is **11 digits**, conceptually structured as `Y/X/XXXX/CD/OOO` where the last 3 digits are the bevoegdheidscode identifying the profession sub-specialty. For logopedisten, the valid bevoegdheidscodes are listed in a dedicated RIZIV PDF (`bevoegdheidscodes_logopedisten.pdf`). The check digit at positions 8-9 is computable. There is **no public REST API for programmatic verification** (confirmed fact #12 in the skill). Structured access requires an eHealth partner contract (CoBRHA channel).

**Implication for the discovery:** the discovery notes "opaque string with no format validation" and treats this correctly as a Phase 2 concern ("RIZIV billing logic lives in area #8"). However, the Phase 2 spec author should be aware that:
1. An 11-digit format check IS implementable without any external API call.
2. The bevoegdheidscode suffix (last 3 digits) could be validated against the known logopedie codes (from the RIZIV PDF) as a lightweight format guard.
3. This validation cannot guarantee the number belongs to the signing-up user — that would require CoBRHA access.

**Verdict: CLARIFY.** The discovery's deferral is pragmatically correct (no blocking issue at sign-up), but the Phase 2 spec author for identity profile editing should decide whether to add a format-only validation (regex for 11 digits, optional check-digit calculation) at the profile layer. This is not a BLOCKER — the current opaque storage is the correct safe default for now.

### Claim D3: `isDeconventioned` boolean — logopedist "not bound by De Conventie tariffs"

**Skill finding (from `04-recognition-visa-and-professional-bodies.md` §4.4):** "Refusing to be conventioneerd" (deconventionering) means the practitioner has NOT signed the national tariefovereenkomst between logopedie unions and mutualiteiten. This is a practitioner's active choice — they can refuse up to 30 days after RIZIV registration, and the decision is registered at RIZIV. It is NOT a self-declaration by the practitioner in halingo's profile form; it is an official status at RIZIV.

Key implications the discovery does NOT surface:
1. A deconventioneerde logopedist charges higher fees and the patient receives lower RIZIV reimbursement (the "-25% regel" when ≥ 60% of the profession is in convention; in 2024-2025, 67.38% adhered, triggering this rule).
2. The `isDeconventioned` flag in halingo directly affects which honorarium values are injected into the getuigschrift voor verstrekte hulp — this is a billing-critical field, not just a profile label.
3. The convention status is officially tracked at RIZIV but there is no API to query it programmatically for verification.

**Verdict: CLARIFY.** The discovery correctly records `isDeconventioned` as a profile field and notes it is "consumed by certificate/invoice generation in other areas." It does NOT note that this flag has regulatory significance (it determines which tariff applies to every patient invoice and getuigschrift). The Phase 2 spec author for profile edit AND the spec author for area #11 Smart Invoicing need this context. Adding to [NEEDS CLARIFICATION] backlog: "should `isDeconventioned` be a practitioner-asserted flag, an admin-verified field, or linked to RIZIV data? What is the UX for changing it?"

### Claim D4: RIZIV fields are "indirect domain touchpoints" — actual RIZIV billing logic lives in area #8

**Skill finding:** The skill confirms that the right to *practise* (visum from FOD Volksgezondheid) and the right to *bill* (RIZIV number + active convention + valid prescription) are separate. No Belgian regulation requires RIZIV number validation at sign-up time. The RIZIV number is only needed when generating a getuigschrift voor verstrekte hulp or a bilan report. There is no legal requirement for halingo to verify the RIZIV number against the federal cadastre during account creation.

**Verdict: PASS.** The discovery's framing is correct. RIZIV validation at profile edit time is an optional UX improvement, not a regulatory requirement.

### Claim D5: Any Belgian registration requirements missing from the identity layer?

**Skill finding:** The skill identifies the following practitioner identifiers that halingo stores on the user profile:
- `riziv` (RIZIV number — 11 digits) — stored, no format validation
- `companyNumber` (KBO/BCE number) — stored, no format validation (discovery notes "no format validator in the schema itself" from `user_profile.md:43`)
- `bankAccount` (IBAN) — stored with format validation (`iban.isValid`)
- `profession` (enum)
- `isDeconventioned` (boolean)

The skill also notes that a separate **visum from FOD Volksgezondheid** is the legal authorisation to practise. Halingo does NOT store the visum number. This is appropriate — the visum is not needed for any billing or clinical workflow in halingo (it is the upstream credential that enables RIZIV registration, but halingo operates downstream of that).

**Nothing is missing at the identity layer from a regulatory standpoint.** The fields captured are the operationally necessary ones for billing and certification. The missing KBO/BCE format validator is a minor hygiene issue (Belgian company numbers are 10 digits in the format `XXXX.XXX.XXX`), but its absence does not constitute a compliance gap.

**Verdict: PASS.** No Belgian regulatory requirement for a missing identity field was identified.

---

## Escalated source checks (Step 4)

Three claims were escalated for direct Meteor source verification:

### Escalation 1 — 30-minute verification token TTL

**Claim:** "The 30-minute TTL math is at line 124: `tokenRecord.when + 30*60000 < new Date()`"

**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/api/users/server/util.jsx:111-160`

**Finding:** Confirmed with a precision correction. The actual implementation at line 112 sets `const expirationTime = 30;` and at line 124 the check is:
```js
if (new Date(tokenRecord.when.getTime() + expirationTime * 60000) < new Date()) {
```

The discovery's inline description (`tokenRecord.when + 30*60000 < new Date()`) is accurate in intent but slightly imprecise in form: `tokenRecord.when` is a Date object and must call `.getTime()` before arithmetic. The working code uses `tokenRecord.when.getTime()`. This is not a material error — the behavior description (token expires after 30 minutes from `when`) is correct.

**Additional finding:** The actual `_verifyEmail` function also does `$pull` of the verification token on success (from both the primary-email-verify branch and the pendingEmail-promote branch), correctly removing the consumed token. The discovery notes "Tokens live in `services.email.verificationTokens` until consumed or until the user document is updated elsewhere; they are only pruned on success" — this is confirmed.

**Verdict: ✓ Confirmed with minor precision note (non-blocking).**

### Escalation 2 — `makeOwner` atomic swap behavior

**Claim:** "`makeOwner` is an atomic swap at lines 276-278: target becomes owner, current user becomes admin, both via `practicesUtil.changeRole` without transactional guarantees."

**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/api/practice/methods.jsx:256-290`

**Finding:** Confirmed. The actual code at lines 276-278:
```js
const result =
  practicesUtil.changeRole(userId, practiceId, "owner") &&
  practicesUtil.changeRole(this.userId, practiceId, "admin");
```

Two sequential synchronous calls, short-circuit `&&`. If the first `changeRole` fails, the second never runs (practice has no owner). If the first succeeds and the second fails, the practice has two owners for a moment until manual correction. No Mongo transaction wraps them. The discovery's QUIRK-PRESERVE flag on this behavior is accurate and important.

**Additional finding:** The method also calls `RosaPractices.setCalendarPermissionsInRosaForPracticeId(practiceId)` and `RosaPatients.updatePermissionsForPatientFilesOfPractice(practiceId, userId)` after the role swap (lines 280-285), both `await`ed. These external calls are AFTER the Mongo writes — if they fail, the Mongo state is already changed but Rosa is not updated. This race condition / partial-update window is not noted in the discovery.

**Verdict: ✓ Confirmed. Surfaced an additional finding: Rosa side effects in makeOwner are AFTER the Mongo writes and not transactionally tied. Phase 2 spec author should note that makeOwner failure modes include "Mongo updated, Rosa stale."**

### Escalation 3 — `practiceInvitations` publication missing auth check

**Claim:** "Publication has no auth check. Any logged-in user can subscribe with any `practiceId` and get the list of pending invitations (emails included, via `publicFields.data`)."

**Source read:** `/home/tj/Repos/Halingo-Main/app/imports/api/invitations/server/publications.js:5-10`

**Finding:** Confirmed exactly. The full publication is 7 lines:
```js
Meteor.publish("practiceInvitations", function(practiceId) {
    return Invitations.find({
        "data.practiceId" : practiceId,
        type: "joinPractice"
    }, { fields: Invitations.publicFields });
});
```

No `this.userId` check, no `if (!this.userId) return this.ready();` guard, no `checkUserPermission` call. The `publicFields` include `data` (which contains `{practiceId, email}`) and `createdAt`. The `token` is excluded, which is the only protection. An anonymous subscriber (not logged in) would get `this.userId === null` and the publication would still execute — this is even broader than "any logged-in user."

**Verdict: ✓ Confirmed. The bug is slightly worse than described: it's not "any logged-in user" but "any subscriber including unauthenticated ones." The discovery's description is technically under-scoped but the core finding (missing auth check) is accurate.**

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-identity-01 | NOTE | citation | Discovery describes owner-admin delta as "9 permissions" which is technically correct (includes dead `practice.subscriptions.change`), but the effective actionable delta is 8. Minor precision issue, does not affect porting. | Record in area [NEEDS CLARIFICATION] for Phase 2 spec author. |
| V-identity-02 | NOTE | citation | `deprecation_list.md` entries are referenced by number (#2, #17, #19) but the file uses heading-text identifiers, not sequential numbers. "#19 3-day lock" is the discovery's own numbering. The underlying facts are confirmed. | No action needed. Numbering convention is internal to the discovery. |
| V-identity-03 | CLARIFY | omission | `patientFileUsers.roles.owner` is marked DEAD (`deprecation_list.md` #7, confirmed by product owner "not used, can be removed") but this deprecation is not noted in the identity discovery's feature catalog or RBAC description. | Add to [NEEDS CLARIFICATION] in identity file OR note in area #3 Patient Data Privacy spec. Phase 2 spec author for #3 must not port the `patientFileUsers.owner` role. |
| V-identity-04 | NOTE | omission | `practice.subscriptions.change` permission is DEAD (`deprecation_list.md` #8) but appears in the RBAC matrix without a dead-code flag. | Note in Phase 2 spec for feature #27/28: do not port `practice.subscriptions.change` permission. |
| V-identity-05 | NOTE | omission | `practice_user_management.md` describes a specific client-side tooltip i18n key `REACHED_LIMIT_USERS_OF_PLAN_UPGRADE_PLEASE` for the disabled invite button. Not captured in the discovery. | Add to Phase 2 spec for `identity/practice-invitation-send`. |
| V-identity-06 | CLARIFY | cross-area | Cross-reference to area #5 Multi-View Scheduling (agenda keys, `currentPracticeId` in `RLocalStorage`) was not confirmed as bidirectional from the target discovery file. | Phase 2 spec authors for #5 and #1 should explicitly cross-link the agenda-key write/read contract. |
| V-identity-07 | CLARIFY | domain | `isDeconventioned` is treated as a profile label in the discovery; the logopedist-be skill confirms it is billing-critical (directly affects which tariff applies to every patient invoice and getuigschrift). Phase 2 spec author for profile-edit AND smart invoicing (#11) need this regulatory context. | Add to [NEEDS CLARIFICATION]: "isDeconventioned should be practitioner-asserted, admin-verified, or linked to RIZIV data? How does it affect the tariff calculation on every getuigschrift?" Route to `logopedist-be` skill in Phase 2. |
| V-identity-08 | CLARIFY | domain | RIZIV number stored as opaque string with no format validation. The skill confirms 11-digit structure with a computable check digit and a bevoegdheidscode suffix. Format-only validation is implementable without external API. | Phase 2 spec for `identity/profile-edit-general-fields` should specify whether to add regex/check-digit validation. Not a blocker; default opaque storage is a safe choice. |
| V-identity-09 | NOTE | source-escalation | `makeOwner` Rosa side effects (`setCalendarPermissionsInRosaForPracticeId`, `updatePermissionsForPatientFilesOfPractice`) execute AFTER the Mongo writes and are not transactionally tied. If Rosa calls fail, Mongo state is updated but Rosa is stale. Discovery notes the non-transactional Mongo swap (correctly) but does not note the Rosa post-write failure window. | Add to QUIRK-PRESERVE note for feature #40: "makeOwner failure modes include Mongo-updated-Rosa-stale." Phase 2 spec for ownership transfer should specify rollback/retry strategy. |
| V-identity-10 | NOTE | source-escalation | `practiceInvitations` publication bug is slightly broader than described: it's not "any logged-in user" but "any subscriber including unauthenticated ones" (`this.userId` is never checked). | Strengthen the bug description in the Phase 2 spec for feature #35. Fix in port: add `if (!this.userId) return this.ready();` guard AND a `checkUserPermission` call. |
| V-identity-11 | NOTE | citation | Discovery's inline TTL math description (`tokenRecord.when + 30*60000`) is slightly imprecise (should be `tokenRecord.when.getTime() + ...`). Behavior is correct. | No action. |

**Counts by severity:**
- BLOCKER: 0
- CLARIFY: 4 (V-identity-03, V-identity-06, V-identity-07, V-identity-08)
- NOTE: 7 (V-identity-01, V-identity-02, V-identity-04, V-identity-05, V-identity-09, V-identity-10, V-identity-11)

---

## Rule #7 note

The discovery file header states the producer was a "Claude Code `general-purpose` session" — not a Gemini session as specified for the `halingo-discoverer` role. AGENTS.md rule #7 ("verifier must be a different CLI than the producer") applies here. Both producer and verifier are Claude Sonnet (same family). This is a process deviation from rule #7.

**Impact assessment:** the verification was conducted rigorously (17 citation checks, 6 cross-area checks, 5 domain checks, 3 Meteor source escalations) with no conflicts of interest in the review process itself. The findings are independent and grounded in source files. However, the same-family pairing means the "different-model-family perspective" guarantee is not met.

**Recommendation:** for completeness, consider a lightweight Gemini spot-check of 3-5 high-risk claims (the `makeOwner` atomic swap, the `practiceInvitations` auth bug, and the 62/53/5 permission counts) before Phase 2 spec authoring begins. This does not block Phase 2 but closes the rule #7 gap.

---

## Recommendation

**PROCEED to Phase 2 spec authoring** for Identity Management area #1, with the following conditions:

1. **Before the first spec session:** add V-identity-03 (`patientFileUsers.roles.owner` deprecated) and V-identity-07 (`isDeconventioned` billing significance) to the area's [NEEDS CLARIFICATION] backlog. These are the only two CLARIFYs that could cause a Phase 2 spec author to encode wrong behavior.

2. **During Phase 2 spec authoring for feature #40 (`identity/practice-user-transfer-ownership`):** note the Rosa post-write failure window (V-identity-09) and specify a failure-mode recovery strategy.

3. **During Phase 2 spec authoring for feature #35 (`identity/practice-invitation-list-pending`):** strengthen the auth bug note to "unauthenticated subscribers also receive pending invitations" and specify the two-part fix (userId guard + permission check).

4. **Optional (rule #7 hygiene):** request a Gemini spot-check on 3 load-bearing claims as noted in the Rule #7 note above.

The discovery file is well-structured, citation-dense, and internally consistent. It covers all 50 features across sign-up, login, password management, email lifecycle, ToC, roles, invitations, and RBAC. No claim was found to be materially false. The absence of BLOCKERs means Phase 2 can proceed immediately on the non-CLARIFY features.
