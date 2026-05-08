# User profile

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for the high-level profile (see `../../full_documentation/general_getting_started.md` §profile/language/photo). Verify against running app before promoting to `manual/`.

## What it is

Everything the user manages about *themselves*, independent of which practice they are currently working in: name, gender, language, avatar, contact details, address, bank account, company number, RIZIV practitioner number, profession, conventioned flag, salutation, and certificate-numbering book. Plus one "settings" sub-document that governs how the user prints and presents their own certificates.

A Halingo user has exactly one profile document. Changing it propagates automatically to every practice the user belongs to — names and avatars on open commission invoices are updated by an `after.update` hook (`app/imports/api/users/server/hooks.js:6`).

## Where it lives in the UI

Single page: `/user/profile` · `user.profile` · `app/imports/startup/client/routes/user.js:12`

Composition:

- `ProfilePage` · `app/imports/ui/pages/users/profile-page/ProfilePage.jsx:64` — the full two-column grid, two `FormGroup`s (`formGroup` for profile, `settingsFormGroup` for settings), debounced auto-save on field change (500 ms, line 103 and 132).
- `ProfilePicture` · `app/imports/ui/pages/users/profile-page/ProfilePagePicture.jsx:13` — avatar uploader. Uses the `Avatars` collection (`app/imports/lib/upload/avatars/Avatars`) and `updateProfileImage` method.
- `ProfilePageUserInformation` · `app/imports/ui/pages/users/profile-page/ProfilePageUserInformation.jsx:13` — name, gender, salutation, birthday, locale.
- `ProfilePageAdditionalInformation` · `app/imports/ui/pages/users/profile-page/ProfilePageAdditionalInformation.jsx:9` — address, phone numbers, RIZIV number, bank account, company number.
- `ProfileEmails` · `app/imports/ui/pages/users/profile-page/email-validation/ProfileEmails.jsx:26` — email table + "change email" button + "reset password" button.
- `ChangeEmailModal` · `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:32` — email change form (covered in `identity_and_authentication.md`).

The data source is the `users.profileData` publication (`app/imports/api/users/server/publications.jsx:1`), which returns the current user only, with `publicFieldsDetailed`.

## Data model

All user-editable profile fields live inside `Meteor.users.profile`, typed by `Meteor.users.UserProfile` (`app/imports/api/users/users.jsx:40`):

| Field | Type | Notes |
|---|---|---|
| `firstName` | String | Free text. |
| `lastName` | String | Free text. |
| `salutation` | String | One of `Meteor.users.salutations`: `"mister" / "misses" / "miss"` (`app/imports/api/users/users.jsx:29`). UI labels via `patient.profile.salutation.*`. |
| `gender` | String | `"male" / "female"` only (`app/imports/api/users/users.jsx:58`). |
| `birthday` | Date | |
| `locale` | String | Must be in `locales` (`app/imports/i18n/index`); default `"nl"`. Changes the UI language and the default practice invoice language on practice creation. |
| `imageUrl` | String | Written only via `users.profile.update.image`. `updateProfile` explicitly `_.omit`s `imageUrl` (`app/imports/api/users/methods.jsx:280`). |
| `gsmNumber` | String | Mobile phone. |
| `phoneNumber` | String | Landline. |
| `address` | `addressSchema` | Standard street/postalCode/city/country sub-document from `app/imports/lib/simpleSchemas/util`. |
| `bankAccount` | String | Custom validator uses `iban.isValid(iban.electronicFormat(value))`. Error code `invalidIban` (`app/imports/api/users/users.jsx:45`). |
| `companyNumber` | String | Belgian KBO / BCE number. No format validator in the schema itself. |
| `riziv` | String | RIZIV practitioner number. Also used as the announcement number on the certificates. |
| `profession` | String | Enum `Meteor.users.UserProfessions`: `SPEECH_THERAPIST` or `OTHER` (`app/imports/api/users/users.jsx:11`). Default `SPEECH_THERAPIST`. |
| `professionOther` | String | Free text, shown only when `profession === "OTHER"` (`app/imports/ui/pages/users/profile-page/ProfilePage.jsx:249-260`). |
| `isDeconventioned` | Boolean | Default `false`. A "gedeconventioneerde" logopedist is not bound to De Conventie tariffs — see `../../glossary.md` §De Conventie. Used in certificate/invoice generation. |
| `pendingEmail` | String | Email regex. Set by `users.email.change`; cleared by `user.email.remove.pending` or by successful verification. |
| `certificateNumber` | Object | Pre-printed matrix-printer certificate booklet counter. Sub-fields: `bookNumber` (regex `/\d{2}\*\d{4}/`, e.g. `"01*0001"`), `certificateNumber` (Number, max 50 — one booklet = 50 certificates), `printerNumber` (Number). |

The certificate number advancement logic is in `Meteor.users.getNextCertificateNumber()` (`app/imports/api/users/users.jsx:320`): when `certificateNumber` reaches 50 it rolls over to 1 and increments `bookNumber`; when the 4-digit within-book component (e.g. `9999`) rolls, the 2-digit prefix increments. `printerNumber` is a monotonic counter that ignores the booklet structure.

### User settings

Second sub-document: `Meteor.users.settings`, typed by `Meteor.users.UserSettings` (`app/imports/api/users/users.jsx:99`). Contains certificate print preferences and per-therapist invoice defaults.

| Field | Type | Purpose |
|---|---|---|
| `certificates.mode` | `"manual"` / `"printer"` | `Meteor.users.certificateModes` (`app/imports/api/users/users.jsx:35`). Whether the therapist prints certificates on a matrix printer onto pre-printed booklets, or manually (digital). |
| `certificates.offset.left` | Number | Horizontal offset (mm or px — not labelled in schema) applied when printing onto pre-printed forms to correct margin drift. |
| `certificates.offset.top` | Number | Vertical offset. |
| `certificates.therapistInformation` | Boolean | Include personal therapist info block on printed certificates. |
| `certificates.therapistInformationPractice` | Boolean | Include practice info block on printed certificates. |
| `invoices.rizivRequired` | Boolean | Default `true`. When `true`, invoice generation enforces a RIZIV number on the user. Note: `users.settings.update` short-circuits (`return false`) if `invoices.rizivRequired` is not set in the incoming payload (`app/imports/api/users/methods.jsx:320`). |
| `invoices.personalNote` | String | Free-text "personal note" appended to this user's generated invoices. |

### Reader helpers

Defined on `Meteor.users.helpers` (`app/imports/api/users/users.jsx:269`):

- `email()` — `emails[0].address`.
- `fullName()` — `firstName + " " + lastName`, trimmed.
- `name()` — `fullName()` or, as fallback, `email()`.
- `fullAddress()` — `"{street}, {postalCode} {city}"`.
- `image()` — `profile.imageUrl` or `/img/placeholder-user.png`.
- `phone()` — `gsmNumber || phoneNumber`.
- `locale()` — `profile.locale` (default `"nl"`).
- `roleInPractice(practiceId)` — joins through `PracticeUsers` and returns the role string (`app/imports/api/users/users.jsx:311`).
- `getCertificateMode()` — default `"manual"`.
- `getNextCertificateNumber()` — booklet rollover logic.
- `isVerified()` / `isLocked()` — see `identity_and_authentication.md`.

## Methods (Meteor)

### `users.profile.update` · `app/imports/api/users/methods.jsx:272`

`LoggedInValidatedMethod` validated against `Meteor.users.UserProfile.validator()`. Accepts any subset of profile fields. Body:

```js
const user = Meteor.users.findOne(this.userId);
UsersUtil.checkLocked(user);
_.omit(profile, "imageUrl");
return Meteor.users.update(this.userId, { $set: { profile } });
```

Note the bug: `_.omit(profile, "imageUrl")` is not assigned — lodash's `_.omit` is pure, so this line has no effect. `imageUrl` in the payload **will** overwrite the profile's image. In practice the `ProfilePage` form does not include `imageUrl`, so it does not matter. > ⚠️ Latent bug; confirm that the client never sends `imageUrl` here.

The whole `profile` sub-document is replaced via `$set: {profile}`. Any field the UI does not send is **removed**. This is why the profile form pre-fills every field from `user.profile` before submitting (`app/imports/ui/pages/users/profile-page/ProfilePage.jsx:99`), and why the debounced auto-save always sends `this.formGroup.getValue()` — the full current view of the form.

### `users.profile.update.image` · `app/imports/api/users/methods.jsx:285`

Separate method so `updateProfile` does not have to carry images. Payload: `{imageUrl}`.

Behaviour:

1. `checkLocked`.
2. Skip if `previousImage === imageUrl`.
3. `$set: {"profile.imageUrl": imageUrl}`.
4. A dead block (`app/imports/api/users/methods.jsx:305-308`) intended to clean up the old avatar is commented out — the comment notes that avatars are referenced from commission invoices and cannot safely be deleted.

### `users.settings.update` · `app/imports/api/users/methods.jsx:315`

`LoggedInValidatedMethod` validated against `Meteor.users.UserSettings.validator()`. Short-circuits with `return false` if `invoices.rizivRequired` is not in the payload — the UI must always include that key, even unchanged. `$set: {settings}` replaces the whole settings sub-document.

### `users.profession` / `users.isDeconventioned`

These are **not** separate methods. Profession and `isDeconventioned` live inside `profile` and are saved through `users.profile.update`.

## Publications

- `users.profileData` (see `identity_and_authentication.md`) — only the current user, with `publicFieldsDetailed`.

Peer data is never exposed through a users-API publication; it flows through `practiceUser` and `practiceUsers` (see `practice_user_management.md`).

## User-visible behaviour

1. **Left column — personal identity.**
   - Avatar, first name, last name.
   - Gender (`male` / `female` only).
   - Salutation (`mister` / `misses` / `miss`).
   - Birthday date picker.
   - Interface language (`locale`) — changes affect the whole UI on next render via the `setLocale` call in `AuthenticationContainer`.
   - Emails table (primary + optional pending), with resend-verification and change-email buttons. Reset-password button sends a reset link to the primary address (the user is already logged in; this is a convenience for "change my password without typing the old one").
2. **Right column — professional identity.**
   - Address (auto-completes postal code via `getZipCodesByZipCode` — not visible in this file).
   - GSM and landline phone.
   - RIZIV number (required for generating RIZIV certificates from the invoicing module).
   - Bank account (validated as IBAN).
   - Company number (BCE/KBO).
   - "RIZIV required" checkbox (`settings.invoices.rizivRequired`) — stops invoice generation without a RIZIV number if ticked.
   - Personal note textarea (`settings.invoices.personalNote`) — free text displayed on this user's invoices.
   - Profession select (`SPEECH_THERAPIST` or `OTHER`); if `OTHER`, a free-text `professionOther` field appears.
   - `isDeconventioned` checkbox — marks the user as not adhering to De Conventie tariffs.
3. **All fields auto-save on change.** The `FormGroup.fieldChanges` observable is debounced by 500 ms, then calls `updateProfile.call` (or `updateSettings.call` for the settings group). There is no explicit "save" button. Failures are logged through `logClientError.call` — no user-facing notification for a failed auto-save.
4. **Save status** is shown globally via `startUpdate`/`endUpdate` in `app/imports/modules/status/saving/SavingStatus` — the top-of-screen saving indicator.

## Permissions

Profile editing is not permission-gated: a logged-in user can only edit *their own* profile, because every method writes to `this.userId`. There is no `users.profile.update.forUser` or admin impersonation in code (the `shared/` module has admin impersonation hooks per the scout pass, but they do not touch profile methods directly).

The `checkLocked` guard applies to all mutating profile methods: a user whose email verification grace period has lapsed cannot edit their profile until they verify.

## Notable details

- **`updateProfile` replaces the whole `profile` sub-document.** If the UI ever submits only a subset of fields, anything missing is lost. The form guards against this by pre-populating every control from the published user document.
- **`invoices.rizivRequired` required on every settings save.** The method explicitly returns `false` if this key is missing, which silently discards the update.
- **Avatar cleanup is disabled.** The commented-out `Avatars.removeUnsafe` block notes that old avatars are referenced by historic commission invoices, so they are kept forever.
- **Name/image changes fan out to open commission invoices** via the `Meteor.users.after.update` hook (`app/imports/api/users/server/hooks.js:10`). When `name()` or `image()` differ pre/post, the hook updates every open `CommissionInvoices` row for every practice the user belongs to.
- **Deconventioned flag is new-ish.** `isDeconventioned` has `defaultValue: false` and an `optional: true` annotation, suggesting a recent addition. Not mentioned in any i18n key under `profile.additionalInformation.*` other than the literal `profile.additionalInformation.isDeconventioned`.
- **No phone number validation.** `gsmNumber` and `phoneNumber` are plain strings; the UI wraps them in `PhoneNumberInput` but the schema does not validate.
- **Certificate numbering is per-user**, not per-practice. Two therapists in the same practice keep independent booklets.
- **Profession is ambiguously specified.** The drop-down allows only `SPEECH_THERAPIST` / `OTHER`, but the helpdesk documents Halingo for speech therapists only; `OTHER` appears to exist as an escape hatch for ancillary staff who still need a login. No downstream code path was found that branches on `profession === "OTHER"` except the conditional `professionOther` text field.
- **Sending a reset-password mail from the profile page.** `ProfileEmails.handleResetPasswordClick` calls `users.password.reset.mail` with the current user's email (`app/imports/ui/pages/users/profile-page/email-validation/ProfileEmails.jsx:46`). This is redundant with `/forgot` but it lets an already-logged-in user rotate their password without remembering the old one.
- **`isLoading` prop on `ProfilePage`** is marked required but is **not passed** by `ProfilePageContainer`. The container exposes `user` and `isLoading` from the `users.profileData` subscription (`app/imports/ui/containers/users/ProfilePageContainer.jsx:7`). A `LoadingOverlay` is shown while the subscription is not ready.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` documents the profile page, photo upload, and language selection.
- Deconventioned flag, profession selector, and certificate numbering modes are **not** in the helpdesk.
- The "RIZIV required" toggle and "personal note" on invoices are not in the helpdesk.

## Source files

- `app/imports/api/users/users.jsx` — `UserProfile`, `UserSettings`, `salutations`, `certificateModes`, `UserProfessions`, `publicFields`, helpers.
- `app/imports/api/users/methods.jsx` — `updateProfile`, `updateProfileImage`, `updateSettings`.
- `app/imports/api/users/server/hooks.js` — commission-invoice sync on user update.
- `app/imports/api/users/server/publications.jsx` — `users.profileData`.
- `app/imports/startup/client/routes/user.js` — `/user/profile` route.
- `app/imports/ui/containers/users/ProfilePageContainer.jsx` — tracker wiring.
- `app/imports/ui/pages/users/profile-page/ProfilePage.jsx` — main page component with the two `FormGroup`s and the debounce logic.
- `app/imports/ui/pages/users/profile-page/ProfilePageUserInformation.jsx` — left column fields.
- `app/imports/ui/pages/users/profile-page/ProfilePageAdditionalInformation.jsx` — right column fields.
- `app/imports/ui/pages/users/profile-page/ProfilePagePicture.jsx` — avatar.
- `app/imports/ui/pages/users/profile-page/email-validation/ProfileEmails.jsx` — email rows + buttons.
- `app/imports/ui/pages/users/profile-page/email-validation/EmailValidationBox.jsx` — row component for one email.
- `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx` — change email form.
- `app/imports/lib/simpleSchemas/util.js` — `addressSchema`.
