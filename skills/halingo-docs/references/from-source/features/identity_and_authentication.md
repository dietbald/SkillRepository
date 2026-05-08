# Identity and authentication

> **🪦 Legacy notes (2026-04-07):**
> - The **3-day account-lock heuristic** (lock if email not validated within 3 days) is current behaviour in `Halingo-Main` but is being retired. Q36 of [`../open_questions.md`](../open_questions.md): "Correct, we lock the account after 3 days if they did not validate. But that can be removed. They should validate before they can access the app (should already be the case in the mono repo)." Do **not** port to the mono repo.
> - **`users.delete` method** has no UI and is being removed entirely. Q13: "That should be gone". This means GDPR self-service deletion is **not** a planned feature in `Halingo-Main`. See [`../deprecation_list.md` #2](../deprecation_list.md) and the consequence in [`../gaps/03_patient_data_privacy.md`](../gaps/03_patient_data_privacy.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered (see `../../full_documentation/general_getting_started.md` §login/register/password).

## What it is

Everything the user does to prove who they are to Halingo, from first sign-up through day-to-day login, plus the lifecycle operations that attach to a person's account rather than to a practice: email verification, email change, password reset, terms-of-service acceptance, and account deletion.

Halingo authentication is built on Meteor's standard `accounts-password` package. There is **no two-factor authentication, no SSO, no social login, and no device management** anywhere in the code. Sessions are bearer-token based — Meteor's default `services.resume.loginTokens` array on `Meteor.users`. "Log the user out everywhere" is implemented as emptying that array (`app/imports/api/users/server/util.jsx:29`).

## Where it lives in the UI

All authentication pages mount under `AuthenticationContainer` (`app/imports/modules/authentication/AuthenticationContainer.jsx:11`), which handles locale bootstrapping from the logged-in user's profile.

| Route | Name | Page component | File:line |
|---|---|---|---|
| `/login` | `login` | `LoginPage` | `app/imports/startup/client/routes/authentication.js:35` |
| `/register` | `register` | `RegisterPage` | `app/imports/startup/client/routes/authentication.js:44` |
| `/forgot` | `user.password.forgot` | `ForgotPasswordPage` | `app/imports/startup/client/routes/authentication.js:53` |
| `/reset` | `user.password.reset` | `ResetPasswordPage` | `app/imports/startup/client/routes/authentication.js:62` |
| `/toc` | `toc` | `TermsOfAgreement` | `app/imports/startup/client/routes/authentication.js:71` |
| `/verify-email/:token` | `verify` | `LoadingPage` + `verifyEmail.call` | `app/imports/startup/client/routes/authentication.js:85` |
| `/invitations/accept/:token` | (unnamed) | `LoadingPage` + `acceptInvitation.call` | `app/imports/api/invitations/routes.jsx:29` |

- `LoginPage` · `app/imports/modules/authentication/pages/LoginPage.jsx:18` — email + password form, calls `Meteor.loginWithPassword` directly.
- `RegisterPage` · `app/imports/modules/authentication/pages/RegisterPage.jsx:23` — email, locale, password, confirm password, ToC checkbox; also reads `referral_user_id` / `referral_id` from the query string.
- `ForgotPasswordPage` · `app/imports/modules/authentication/pages/ForgotPasswordPage.jsx:18` — single-field form, calls `users.password.reset.mail`.
- `ResetPasswordPage` · `app/imports/modules/authentication/pages/ResetPasswordPage.jsx:20` — reads the reset token from `localStorage.resetPasswordToken` and calls `Accounts.resetPassword` directly, then `users.password.changed.mail`.
- `TermsOfAgreement` · `app/imports/modules/authentication/TermsOfAgreement.jsx:7` — rendered on `/toc`, inside a modal on `/register`, and inside `TermsCheckBox` (`app/imports/modules/authentication/termsCheck.jsx:13`) which blocks the whole app if `acceptedTerms !== "3"`.

## Data model

Authentication state lives on `Meteor.users` (`app/imports/api/users/users.jsx`). Only the authentication-related fields are covered here; see `user_profile.md` for the profile sub-document.

- `emails` — array, each `{address, verified}`. Halingo treats `emails[0]` as the single canonical email; there is no multi-address UI.
  - `Meteor.users` helper `email()` returns `emails[0].address` (`app/imports/api/users/users.jsx:270`).
  - `isVerified()` returns `this.emails[0].verified` (`app/imports/api/users/users.jsx:287`).
- `services` — blackbox; Meteor stores password hash, `resume.loginTokens`, `email.verificationTokens`, and `password.reset` here.
- `profile.pendingEmail` — when a user requests an email change, the new address lands here until the verification link on it is clicked (`app/imports/api/users/methods.jsx:248`).
- `acceptedTerms` — string; compared against the literal `"3"` throughout the code (`app/imports/api/users/methods.jsx:77`, `app/imports/api/users/methods.jsx:347`, `app/imports/modules/authentication/termsCheck.jsx:51`). The `"3"` appears to be the terms version marker; any other value triggers the blocking modal. > ⚠️ The value `"3"` is hardcoded in three places; there is no terms-version table. Behaviour inferred from code; needs product validation.
- `createdAt` — used by the account-lock heuristic.
- `removed` / `removedAt` — soft delete markers (`app/imports/api/users/users.jsx:165-172`).
- `createdFromBackendEmail` — optional String, set when a user was provisioned from an admin backend script rather than by self-registration (`app/imports/api/users/users.jsx:207`). Not exposed in UI.

Client-side inserts/updates/removes on `Meteor.users` are denied (`app/imports/api/users/users.jsx:17-27`); all mutations must go through methods.

### Account locking

A user is considered locked if they are not verified **and** more than three days have passed since `createdAt` (`app/imports/api/users/users.jsx:291-293`):

```js
isLocked() {
  return !this.isVerified() && moment() > moment(this.createdAt).add(3, "days");
}
```

The `UsersUtil.checkLocked` guard (`app/imports/api/users/util.jsx:4`) throws `user.isLocked` and is called before every profile update, settings update, email change, profile-image update, and account deletion (`app/imports/api/users/methods.jsx:237, 278, 294, 325, 335`). A locked user can still log in — Meteor's login attempt hook in `app/imports/api/users/server/accounts.jsx` checks for `removed`, not `isLocked` — but cannot mutate anything.

> ⚠️ The practical effect is that if a user registers and never verifies their email within three days they become a "read-only" account. There is no UI message explaining this; the user just sees `user.isLocked` errors. Needs product validation.

## Methods (Meteor)

All exported from `app/imports/api/users/methods.jsx`. All but `users.register`, `users.password.reset.mail`, `users.email.verify.mail`, and `users.email.verify` are `LoggedInValidatedMethod`s (require a session).

### Registration

`users.register` · `app/imports/api/users/methods.jsx:62`

Schema (`RegisterSchema`, line 19):

- `email` — required, email regex.
- `password` — required, min 6 characters.
- `confirmPassword` — custom validator `passwordMismatch` (line 30).
- `locale` — required, must be in `locales`; default `"nl"`.
- `ToCAccepted` — required, must be truthy; custom error `ToCNotAccepted` (line 43).
- `referralUserId` — optional Mongo ID.
- `referralId` — optional Mongo ID.

Behaviour (line 65):

1. `Accounts.createUser({email, password, profile: {locale}})`.
2. Set `acceptedTerms: "3"` on the new user.
3. If `referralUserId` is provided and points to an existing user, insert a `Referrals` row with status `REGISTERED`. Otherwise if `referralId` is provided, transition that referral from `INVITED` → `REGISTERED`. See `referral_programme.md`.
4. Call `UsersUtil.sendEmailVerificationMail(email, true)` — the `true` routes it through `WelcomeMail` instead of the plain `VerifyEmailMail` (`app/imports/api/users/server/util.jsx:96`).
5. Return `{userId}`, or `{userId, err}` if the verification email failed.

`RegisterPage` then immediately calls `Meteor.loginWithPassword` to sign the new user in (`app/imports/modules/authentication/pages/RegisterPage.jsx:109`).

### Login

There is **no `users.login` method.** The `LoginSchema` is exported (`app/imports/api/users/methods.jsx:120`) and validated client-side, but authentication goes straight through `Meteor.loginWithPassword`. The only server-side interception is `Accounts.validateLoginAttempt` in `app/imports/api/users/server/accounts.jsx:4`, which:

- Collapses `"User not found"` and `"Incorrect password"` into a single `user.incorrectLoginInfo` error so an attacker cannot distinguish unknown-email from bad-password (lines 13–16).
- Refuses login for soft-deleted users (`removed === true`) with `user.isRemoved` (lines 22–25).

### Password reset

`users.password.reset.mail` · `app/imports/api/users/methods.jsx:142` — takes `{email}`; validates against `ForgotPasswordSchema`; calls `UsersUtil.sendResetPasswordMail(email)`. Silent if the email is unknown (`app/imports/api/users/server/util.jsx:42`): the user is looked up via `Accounts.findUserByEmail`, and if nothing matches the function returns without throwing. This prevents account enumeration.

Token generation: `Accounts.generateResetToken` with reason `"resetPassword"` (`app/imports/api/users/server/util.jsx:45`). The reset URL is built via `Accounts.urls.resetPassword(token)` with the user's locale appended as a query parameter. The email template is `ResetPasswordMail` (`app/imports/lib/mails/mailTemplates/accounts/resetPassword`).

`users.password.changed.mail` · `app/imports/api/users/methods.jsx:173` — notifies the user *after* they have completed a reset. Called from `ResetPasswordPage.defaultProps.onComplete` (`app/imports/modules/authentication/pages/ResetPasswordPage.jsx:106`).

> ⚠️ The actual password change does **not** happen through a Halingo method. `ResetPasswordPage` calls `Accounts.resetPassword(localStorage.getItem('resetPasswordToken'), values.password, ...)` directly (line 55). The reset token is therefore assumed to be already present in `localStorage` under the key `resetPasswordToken` — presumably written by a `triggersEnter` hook on the `/reset` route that reads it from a URL, but that hook is not in the authentication routes file. Behaviour inferred from code; needs product validation.

### Email verification and change

`users.email.verify.mail` · `app/imports/api/users/methods.jsx:187` — resend verification email for a given address (either the primary or a pending change).

`users.email.verify` · `app/imports/api/users/methods.jsx:198` — consumes a verification token and marks the address verified.

Token mechanics (`_verifyEmail`, `app/imports/api/users/server/util.jsx:111`):

1. Look up user via `services.email.verificationTokens.token`.
2. Token expiration: **30 minutes** from `when` timestamp (line 112). Throws `user.verifyEmailTokenExpired`.
3. If the token address matches an entry in `user.emails`, flip `emails.$.verified = true` and return `true`.
4. If the token address matches `profile.pendingEmail` (an email change confirmation), **replace** `emails` with a single `[{address: tokenRecord.address, verified: true}]` and clear `pendingEmail`. Returns `false` — a sentinel meaning "was not primary but succeeded" (line 148 has `//TODO better way to communicate whether is was primary email or not?`).
5. On any invalid/unknown token, throws `user.verifyEmailTokenInvalid` or `user.verifyEmailUnknownAddress`.

> ⚠️ Step 4 **overwrites the entire emails array** with exactly one element, so any alternate email entries are lost on a change confirmation. Behaviour inferred from code; needs product validation.

The verification URL is built by removing the `#/` fragment from `Accounts.urls.verifyEmail` and appending the locale (`app/imports/api/users/server/util.jsx:91`). The template is `WelcomeMail` for first-time registration (as a welcome), otherwise `VerifyEmailMail`.

`users.email.change` · `app/imports/api/users/methods.jsx:230` — takes `{email, confirmEmail, password}`. Not logged. Steps:

1. `checkLocked` guard.
2. `Accounts._checkPassword(user, password)` — re-authentication. On mismatch throws `user.invalidPassword`.
3. Check `Accounts.findUserByEmail(email)` — if the new address is already taken, throws `user.duplicateEmail`.
4. Set `profile.pendingEmail = email`.
5. Send verification mail to the new address.

UI lives in `ChangeEmailModal` (`app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:32`).

`user.email.remove.pending` · `app/imports/api/users/methods.jsx:263` — `LoggedInValidatedMethod`, no arguments. Clears `profile.pendingEmail`. Invoked from the "remove" icon next to a pending email row (`app/imports/ui/pages/users/profile-page/email-validation/EmailValidationBox.jsx:67`).

### Terms of service

`users.terms.accept` · `app/imports/api/users/methods.jsx:342` — `LoggedInValidatedMethod`, no arguments. Sets `acceptedTerms: "3"`. Called by `TermsCheckBox.acceptTerms()` (`app/imports/modules/authentication/termsCheck.jsx:25`).

`TermsCheckBox` is mounted near the root of the authenticated app and shows a blocking modal whenever `user.acceptedTerms !== "3"` (`app/imports/modules/authentication/termsCheck.jsx:49-51`). The modal has only two buttons: `logout` (calls `Meteor.logout()`) and `modal.submit` (calls the `users.terms.accept` method). There is a "must scroll to bottom" flag (`canAccept`) but the code wires it into state yet does not actually disable the submit button based on it, so scrolling is cosmetic.

### Account deletion

`users.delete` · `app/imports/api/users/methods.jsx:331` — `LoggedInValidatedMethod`, no arguments. Calls `UsersUtil.deleteUser(this.userId)`.

Server implementation (`_deleteUser`, `app/imports/api/users/server/util.jsx:20`):

1. `Meteor.users.update(userId, {$set: {removed: true, removedAt: new Date()}})`.
2. `Meteor.users.update(userId, {$set: {"services.resume.loginTokens": []}})` — immediately logs the user out from every device.

**Nothing else is cleaned up.** `practiceUsers`, `patientFiles`, `commissionInvoices`, `events` and so on are left intact. Subsequent login attempts are blocked by `accounts.jsx:22` (`user.isRemoved`). There is no hard-delete, no GDPR export, no admin undo.

> ⚠️ There is no UI for `users.delete` anywhere in the codebase — no button, no confirmation modal, no profile page menu item. The method exists only as a backend entry point. Behaviour inferred from code; needs product validation.

### Rosa connection (tangential)

`users.rosa.connect` and `users.rosa.disconnect` (`app/imports/api/users/methods.jsx:354, 384`) associate a Rosa OAuth token with a user's `rosaIntegrations` array for a given practice. Covered in the Rosa deep-dive; listed here because they live in the users methods file.

## Publications

- `users.profileData` · `app/imports/api/users/server/publications.jsx:1` — publishes `Meteor.users.find({_id: this.userId}, {fields: Meteor.users.publicFieldsDetailed})`. This is the only user publication. `publicFieldsDetailed` is `emails, createdAt, profile, settings, acceptedTerms, rosaIntegrations.practiceId, .lastPatientsFetch, .lastEventsFetch, .tokenInvalid, .isUserInput` (`app/imports/api/users/users.jsx:254`).

There is no publication that exposes other users' authentication state (verification, roles, etc.) — peer data comes through `practiceUsers` and `practiceUser` publications which join `Meteor.users` with `publicFields` (`app/imports/api/practiceUsers/server/publications.jsx:22`).

## User-visible behaviour

1. **New sign-up.** Enter email/password/ToC → account is created, welcome mail is sent, user is logged in immediately. The welcome/verification mail contains a 30-minute-valid link. If the user does not click within 72 hours, the account becomes locked (read-only) until they click a *fresh* verification link.
2. **Login.** Single form. Any error collapses to "login info incorrect" — the user cannot tell if the email is unknown. Soft-deleted accounts get a distinct "account removed" error.
3. **Forgot password.** Asks for email. The page *always* reports success, even if the email is not in the database. The reset link uses Meteor's default token mechanism (expiration configured at the framework level, not in Halingo code).
4. **Reset password.** User pastes the reset link; the landing page reads the token from `localStorage` (pre-populated by another hook) and calls `Accounts.resetPassword`. On success it also sends a "password changed" confirmation email to the user. The "forgot password" link on the form redirects back to login.
5. **Change primary email.** Profile page → "change email" modal → requires current password. The new address becomes `pendingEmail` and receives a verification link. Clicking that link *replaces* the primary email entirely and clears `pendingEmail`.
6. **Resend verification.** Each unverified email (primary or pending) has a "send" icon in the profile emails table that re-triggers the verification mail.
7. **Terms of service.** Every request to the authenticated app first subscribes to `users.profileData`. As soon as the user document arrives, if `acceptedTerms !== "3"` a blocking modal shows; the user must either log out or accept. Register also embeds ToC in-line.
8. **Account deletion.** Not reachable from the UI.

## Permissions

Authentication methods are not permission-checked; they are `ValidatedMethod` or `LoggedInValidatedMethod`. The only authorization layer is:

- `checkLocked` guard (self-lock after 3 days unverified).
- `accounts.validateLoginAttempt` for the `removed` flag.
- Password re-entry for email change.

There is no admin role that can impersonate or reset another user's password from inside Halingo.

## Notable details

- **The acceptedTerms === "3" sentinel** is duplicated in three places (`users/methods.jsx:77, 347` and `authentication/termsCheck.jsx:51`). Bumping to ToC v4 requires touching all three. No migration exists.
- **Reset password message is fire-and-forget.** `users.password.reset.mail` returns whatever `_sendResetPasswordMail` returns — which is undefined when the user is not found, and throws `user.resetPasswordMail.notSent` when the email send fails but the user exists. The UI always notifies "success" regardless.
- **`_checkPassword` private API.** Email change re-auth uses the private `Accounts._checkPassword` (`app/imports/api/users/methods.jsx:238`), which is a Meteor-internal.
- **`Meteor.logout()` after terms decline.** The "logout" button in the terms modal is the only supported way out — there is no "remind me later".
- **Email verification tokens are not invalidated on logout.** Tokens live in `services.email.verificationTokens` until consumed or until the user document is updated elsewhere; they are only pruned on success (`$pull` in `_verifyEmail`).
- **The `createdFromBackendEmail` field** exists on the User schema (`app/imports/api/users/users.jsx:207`) but has no UI. Presumably used by support staff importing users; no code references it for display.
- **No rate limiting** is applied to login, registration, verification, or reset endpoints in the code searched. Meteor's DDPRateLimiter may be configured globally elsewhere. > ⚠️ Needs product validation.
- **Hook on `Meteor.users.after.update`** (`app/imports/api/users/server/hooks.js:6`) keeps `userName` and `userImage` on open `commissionInvoices` in sync whenever a user renames or changes their avatar. Not an auth hook per se, but it is the only side effect on user updates.

## Helpdesk overlap

- Account creation, login, and password reset are documented in `docs/full_documentation/general_getting_started.md`.
- Two-factor is not mentioned in the helpdesk because it does not exist in code.
- Account deletion is not in the helpdesk and has no UI, so users cannot discover it.
- The 30-minute verification token expiry and 3-day account lock are **not** in the helpdesk.

## Source files

- `app/imports/api/users/users.jsx` — collection schemas, helpers, public fields, placeholder user.
- `app/imports/api/users/methods.jsx` — all auth-related Validated/LoggedInValidated methods.
- `app/imports/api/users/util.jsx` — `checkLocked` shared util.
- `app/imports/api/users/server/util.jsx` — server-side `deleteUser`, `verifyEmail`, `sendResetPasswordMail`, `sendEmailVerificationMail`, `sendChangedPasswordMail`.
- `app/imports/api/users/server/accounts.jsx` — `validateLoginAttempt` hook.
- `app/imports/api/users/server/hooks.js` — after-update hook syncing `commissionInvoices` display fields.
- `app/imports/api/users/server/publications.jsx` — `users.profileData`.
- `app/imports/modules/authentication/AuthenticationContainer.jsx` — layout wrapper.
- `app/imports/modules/authentication/pages/LoginPage.jsx` — login form.
- `app/imports/modules/authentication/pages/RegisterPage.jsx` — register form, reads referral query params.
- `app/imports/modules/authentication/pages/ForgotPasswordPage.jsx` — forgot password form.
- `app/imports/modules/authentication/pages/ResetPasswordPage.jsx` — reset password form.
- `app/imports/modules/authentication/TermsOfAgreement.jsx` — ToC body.
- `app/imports/modules/authentication/termsCheck.jsx` — blocking ToC modal for unaccepted terms.
- `app/imports/startup/client/routes/authentication.js` — route definitions.
- `app/imports/ui/pages/users/profile-page/email-validation/*` — email row rendering, change modal, resend/remove icons.
- `app/imports/lib/mails/mailTemplates/accounts/*` — `welcome`, `verifyEmail`, `resetPassword`, `passwordChanged` mail templates.
