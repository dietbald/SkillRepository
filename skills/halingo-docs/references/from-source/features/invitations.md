# Invitations

> **🟠 Confirmed bug pending fix:** the `practiceInvitations` publication has no auth check. Anyone with a `practiceId` can list pending invitations and the invitee email addresses. Confirmed by the product owner 2026-04-07 (Q4 of [`../open_questions.md`](../open_questions.md)): "should idd be scoped". See [`../bugs_and_security_findings.md`](../bugs_and_security_findings.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — mentioned as part of "add colleague" in `../../full_documentation/general_getting_started.md` but the token lifecycle and mechanics are not documented.

## What it is

The machinery that lets an owner or beheerder generate a one-click link, send it by email, and — when the recipient clicks it after logging in — automatically bind them to the practice as a `default` (lid) role member. The feature is implemented as a generic "typed invitation" collection with exactly one type implemented (`joinPractice`), so it could host other invitation kinds later.

There is **no token expiration**, **no usage limit**, **no multi-use vs single-use distinction**, and **no explicit decline flow**. An invitation either sits pending in the database or is consumed/deleted.

## Where it lives in the UI

- Invitations collection data appears on the practice roster page `/practices/users` as a yellow "Uitgenodigd" card next to regular members — see `practice_user_management.md`.
- The accept route is at `/invitations/accept/:token` (`app/imports/api/invitations/routes.jsx:29`) — this is the link sent in the email.
- When a not-logged-in user clicks the accept link, an authentication container mounts a `LoadingPage` and a login/register overlay is triggered (`authenticatedMount(EmptyContainer, { showLoginConfirm: true, ...})`, line 50).
- There is **no dedicated "my invitations" page** for recipients to review before accepting, nor a "decline" button. The link *is* the flow.

## Data model

Collection: `invitations` · `app/imports/api/invitations/invitations.jsx:7`

```js
export const Invitations = new InvitationsCollection("invitations");
```

Schema (`app/imports/api/invitations/invitations.jsx:15`):

| Field | Type | Notes |
|---|---|---|
| `userId` | String (id) | The **inviter**'s user id — not the recipient. Used for the upsert key so one inviter ↔ one target ↔ one pending invitation. |
| `token` | String | A new `Random.secret()` value on every (re)generation. |
| `type` | String | `allowedValues: ["joinPractice"]`. Only one invitation type implemented. |
| `data` | Object, blackbox | Type-specific payload. For `joinPractice`: `{practiceId, email}`. |
| `createdAt` | Date | Bumped on every regeneration (`upsert` with `$set: {token, createdAt}`). |

Client-side insert/update/remove on `Invitations` is denied (`app/imports/api/invitations/invitations.jsx:9`) — all mutations go through methods or server-side utility functions.

`Invitations.publicFields` exposes only `data` and `createdAt` — `token` is never published to clients, so only the direct recipient (via the email URL) can consume a pending invitation.

## Methods (Meteor)

### `invitations.accept` · `app/imports/api/invitations/methods.jsx:15`

`LoggedInValidatedMethod`. Schema: `{token: String}`.

Body: calls the server-side `Util.acceptInvitation(Meteor.userId(), token)`.

Server implementation `_acceptInvitation` (`app/imports/api/invitations/server/util.jsx:34`):

1. Look up the invitation by token.
2. **Unconditionally delete it.** (`Invitations.remove({token})`) — so the token is single-use from this point on, even if the following steps fail.
3. If not found: throw `errors.token.notFound`.
4. Dispatch to `types[invitation.type].parse(userId, invitation.data)`.

For `joinPractice`, `types.joinPractice.parse` (`app/imports/api/invitations/server/util.jsx:11`):

1. Extract `practiceId` from `data`.
2. If the user is not already a `PracticeUsers` row for that practice, insert one with role `"default"` and `createdAt: new Date()`.
3. Return:
   ```js
   {
     redirect: "home",
     sessionVariables: { currentPracticeId: practiceId },
     message: "invites.practice.success"
   }
   ```

The `sessionVariables` are written into `RLocalStorage` by the `/invitations/accept/:token` route so the app lands on the newly-joined practice. The `message` is shown as a success notification.

### `invitations.remove` · `app/imports/api/invitations/methods.jsx:29`

`PermissionValidatedMethod`. Schema: `{invitationId}`.

`getPermissionData({invitationId})` returns the invitation's `data` object, so the permission check runs against the invitation's stored `practiceId`. The declared permission is the method name `invitations.remove`, which — surprisingly — is **not listed in any role's permission array** in `practiceUsers.jsx`. This means `invitations.remove` is effectively denied for everyone at the method level. It is not called from any UI code: the practice UI uses `removeInvitation` from `app/imports/api/practice/methods.jsx:177` instead (`practice.user.invite.remove`, correctly listed under owner and admin).

> ⚠️ The `invitations.remove` method appears to be dead code. The UI path uses `practice.user.invite.remove`. Behaviour inferred from code; needs product validation.

### Server-side utilities (not directly callable)

`app/imports/api/invitations/server/util.jsx:46`

- `generateLink(userId, type, data)` — creates or refreshes the token for `{userId, type, data}` and returns `Meteor.absoluteUrl("invitations/accept/" + token)`. This is an **upsert** on the `{userId, type, data}` triplet (line 49), not on `{email, practiceId}`; so if the same inviter invites the same email to the same practice twice, the second call reuses the same row and rotates the token.
- `acceptInvitation(userId, token)` — as above.
- `types` — the dispatch table. Only `joinPractice` is defined.

`generateLink` is called from `_inviteUser` in the practice util (`app/imports/api/practice/server/util.tsx:93`) — that is the only caller outside the invitations module.

## Publications

- `practiceInvitations(practiceId)` · `app/imports/api/invitations/server/publications.js:5` — `Invitations.find({"data.practiceId": practiceId, type: "joinPractice"}, {fields: Invitations.publicFields})`. No permission gating: any member of the practice who subscribes gets the full list of pending invitations. The only protection is that `token` is excluded by `publicFields`.

## Routes

`app/imports/api/invitations/routes.jsx:29`

```js
FlowRouter.route("/invitations/accept/:token", {
  triggersEnter: [function(router) {
    const token = router.params.token;
    AuthenticationUtil.addOnLoginAction(function() {
      acceptInvitation.call({ token }, (err, res) => {
        if (!err) {
          FlowRouter.go(res.redirect);
          NotificationManager.success(res.message);
          setTimeout(_.forEach(res.sessionVariables,
            (v, k) => RLocalStorage.set(k, v)));
        } else {
          FlowRouter.go('home');
          NotificationManager.error(err.error || err);
        }
      });
    });
  }],
  action: function() {
    authenticatedMount(EmptyContainer, {
      main: <LoadingPage/>,
      showLoginConfirm: true
    });
  }
});
```

Key points:

- **Login-gated via `addOnLoginAction`.** If the user is logged in already, the action runs immediately. If not, the login/register overlay is shown first and the `acceptInvitation` call is queued for after successful authentication.
- **`FlowRouter.go('home')` on error** — any error (bad token, already a member, etc.) redirects to the dashboard with a notification. The user sees the error briefly then lands in their normal app state.
- **`res.sessionVariables` promotion to local storage.** The server returns `{currentPracticeId: practiceId}`, which the client writes into `RLocalStorage` so the main app picks up the newly joined practice as the current context.

## Invitation lifecycle end-to-end

### Send

1. An owner/admin calls `practice.user.invite` via the invite modal (see `practice_user_management.md`).
2. The server method (`inviteUser` in `app/imports/api/practice/methods.jsx:153`) enforces the plan user limit, then delegates to `practicesUtil.inviteUser`.
3. `_inviteUser` (`app/imports/api/practice/server/util.tsx:80`) looks up whether the email is already a Halingo user and refuses if that user is already a member of this practice (`practice.inviteUser.alreadyMember`).
4. Calls `invitationsUtil.generateLink(inviterId, "joinPractice", {practiceId, email})` → returns an absolute URL.
5. Sends the `invitationForPractice` mail template (`app/imports/lib/mails/mailTemplates/practices/invitationForPractice.jsx`) to the target email, with:
   - `practiceName` (from `practices.name`),
   - `userName` (from `Meteor.users.findOne(inviterId).name()`),
   - `url` — the absolute invite link with `?locale=...` appended, locale taken from `practice.settings.invoices.locale`.
6. If the email send fails, throws `practice.inviteUser.mail.error`.
7. If the target is already a Halingo user (exists in `Meteor.users` but is not already a practice member), an in-app `Notifications` row is also inserted (`notifications.practice.invite.title`) so they see the invite next time they open Halingo.

### Pending state

The `Invitations` row now exists with `type: "joinPractice"`, `data: {practiceId, email}`, and a fresh `token`. The roster page of the inviting practice shows a pending card via the `practiceInvitations` publication. The token is not publicly visible via any publication.

### Resend

Clicking the resend icon on the pending card re-calls `practice.user.invite` with the same arguments. The server code path is identical, and `invitationsUtil.generateLink`'s `upsert` reuses the existing row, rotating the `token` and updating `createdAt`. The previous token is now invalid (the next accept attempt on the old URL will fail with `errors.token.notFound` because the token field has been overwritten). A fresh email goes out.

### Cancel

Clicking the ✗ icon calls `practice.user.invite.remove` (not `invitations.remove`). This executes `practicesUtil.removeInvitation` (`app/imports/api/practice/server/util.tsx:133`), which deletes by `{"data.email": email, "data.practiceId": practiceId}`. The pending card disappears immediately.

### Accept — first time

1. Recipient opens the link from their email inbox.
2. FlowRouter mounts `LoadingPage` and shows a login/register confirm if not signed in.
3. Recipient registers (normal register flow) or logs in.
4. `addOnLoginAction` fires: `acceptInvitation.call({token})`.
5. Server deletes the row, dispatches to `joinPractice.parse`, inserts a `PracticeUsers` row with role `default`, returns the `sessionVariables`.
6. Client redirects to `home`, writes `currentPracticeId` into `RLocalStorage`, and the app re-renders with the new practice as the current context.

### Accept — already-member race

If the user happened to already be a member at the time of accept (e.g. accepted via a different link), `joinPractice.parse` has a guard: `if (PracticeUsers.find({userId, practiceId}).count() === 0)` — only then does it insert. Otherwise it simply returns the redirect + session variables without inserting a duplicate row. So a double-click on the email link does not create a duplicate membership.

### Accept — token already consumed

`_acceptInvitation` does `Invitations.remove({token})` **before** looking at the result (`app/imports/api/invitations/server/util.jsx:37`). This is intentional: a subsequent call with the same token finds no row and throws `errors.token.notFound`. The side effect is that the very first successful call consumes the token atomically.

> ⚠️ There is a TODO comment at line 35: `"// TODO : MULTIPLE SERVERS : Make sure this isn't called twice by adding an extra field or removing"`. The current implementation is not atomic across servers — two servers processing concurrent accepts of the same token could both read-then-delete with a short race window. Behaviour inferred from code; needs product validation.

### Token rotation on regenerate

Because `generateLink` does `upsert` on `{userId, type, data}`, resending an invite **rotates the token**. Anyone holding an old link can no longer use it. There is no version history.

## Email template

`app/imports/lib/mails/mailTemplates/practices/invitationForPractice.jsx` — renders the invitation body and a primary button linking to `url`. The subject is `"mail.practice.inviteUser.subject"`. The email's locale is taken from `practice.settings.invoices.locale`, not from the recipient's profile (because the recipient may not even have a Halingo account yet).

## User-visible behaviour

1. **Inviter** types an email into the modal on `/practices/users`, clicks Save.
2. **Recipient** gets an email in the practice's configured language. The email has an "Accept" button.
3. Clicking the button lands on `/invitations/accept/:token`:
   - If logged in: the invitation is consumed immediately, the user is redirected to the home page, a success notification appears, and the app switches to the new practice context.
   - If not logged in: the authentication overlay appears. After login or register, the invitation is consumed and the rest of the flow runs.
4. **Inviter** sees the yellow "Uitgenodigd" card disappear from the roster and a regular member card replace it (after the next reactive update of the `practiceUsers` / `practiceInvitations` publications).

Edge cases:

- **Email not yet a Halingo user:** they register inside the auth overlay, then the invitation is accepted. The new account starts with `acceptedTerms` set (from register), a `Meteor.users` document, and an immediate `PracticeUsers` row with role `default`. No email verification is required first — registration does not block on that.
- **Email already has an account but is in a different practice:** they log in, the invitation is accepted, a new `PracticeUsers` row is inserted for the new practice. They can switch between practices using the practice switcher in the top navigation.
- **Email already has a Halingo account that is soft-deleted (`removed: true`):** login will throw `user.isRemoved` before the invitation can be accepted. The user cannot join. There is no "revive and attach" path.
- **Link was rotated by a resend:** the old link throws `errors.token.notFound` and the user is bounced to `/home` with an error notification.

## Permissions

- **Send:** `practice.user.invite` (owner + admin).
- **Resend:** same `practice.user.invite` (the UI uses the same `PermissionRender(inviteUser.name, ...)`).
- **Cancel pending:** `practice.user.invite.remove` (owner + admin) — though the current UI incorrectly renders the ✗ under the `practice.user.invite` permission guard, which is equivalent in effect because the two permissions are granted together.
- **Accept:** any logged-in user who knows a valid token. No role required.
- **View pending list:** the `practiceInvitations` publication is not permission-gated; any practice member who subscribes gets the list. In the current UI, only the roster page (which itself is not viewable by `default` users in a useful way) uses it.

## Notable details

- **Single invitation type, hard-wired.** `types` is a local object in `app/imports/api/invitations/server/util.jsx:8` with one key. Adding a new invitation type (e.g. "co-sign a report") would mean editing this file, the `type` allowed values in the schema, and the routing accept handler.
- **No TTL.** Invitations sit forever. There is no cleanup cron job. The only way a pending invitation goes away is accept or cancel. A years-old pending invitation is still valid.
- **`generateLink` stores the inviter's user id** but the client never uses it. It is surfaced only by the upsert key: one inviter can have at most one pending invitation per `(type, data)`. Two different owners inviting the same email to the same practice will produce two separate rows.
- **`invitations.accept` is not logged in `MethodLogger`?** It extends `LoggedInValidatedMethod` which does log, so yes, every accept is captured with the token and userId. Good for audit.
- **No decline link.** The email has only an Accept button. Declining is implicit — ignore the email, and the inviter can remove the pending row manually.
- **No expiry notice.** Because the server never expires invitations, there is no notification like "your invite is still waiting after N days". An admin's roster page will show ancient pending cards indefinitely.
- **`invitations.remove` method is dead.** The real cancel path is `practice.user.invite.remove` → `practicesUtil.removeInvitation`.
- **Race condition on multi-server accept.** See the TODO above. In single-server deployments this is not an issue.
- **The email's `locale` comes from the practice, not the recipient.** If a francophone practice invites a Dutch-speaking therapist, the email body is in French even though the recipient would prefer Dutch.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` mentions "invite colleague by email" at a high level.
- Token mechanics, upsert-on-resend, and the "no TTL" behaviour are not documented in the helpdesk.
- The fact that accepting an invitation writes a local-storage key and switches the current practice is not documented.

## Source files

- `app/imports/api/invitations/invitations.jsx` — collection, schema, public fields.
- `app/imports/api/invitations/methods.jsx` — `invitations.accept`, (dead) `invitations.remove`.
- `app/imports/api/invitations/routes.jsx` — `/invitations/accept/:token` FlowRouter route.
- `app/imports/api/invitations/server/util.jsx` — `generateLink`, `_acceptInvitation`, `types.joinPractice.parse`.
- `app/imports/api/invitations/server/publications.js` — `practiceInvitations`.
- `app/imports/api/invitations/server/index.js` — server-side module index.
- `app/imports/api/practice/methods.jsx:153` — `inviteUser` (the actual send method).
- `app/imports/api/practice/methods.jsx:177` — `removeInvitation` (the actual cancel method).
- `app/imports/api/practice/server/util.tsx:80` — `_inviteUser`, `_removeInvitation`.
- `app/imports/lib/mails/mailTemplates/practices/invitationForPractice.jsx` — email template.
- `app/imports/ui/pages/practices/users/PracticeInvitation.jsx` — pending-invite card (see `practice_user_management.md`).
- `app/imports/lib/authentication/util.jsx` — `addOnLoginAction`.
