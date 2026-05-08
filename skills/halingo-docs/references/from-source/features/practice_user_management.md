# Practice user management

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — "add a colleague to the practice" is described in `../../full_documentation/general_getting_started.md` but the per-user screen is not. Verify against running app before promoting to `manual/`.

## What it is

The two screens an owner or beheerder uses to manage the people in a practice: a roster page and a per-user detail page. From here they invite new members, remove existing ones, switch roles, transfer ownership, leave a free-text note about a staff member, and configure per-user commission rules. Only the commission sub-form is documented here in outline — the full commission lifecycle lives in `commissions.md`.

## Where it lives in the UI

Both routes are under the `/practices` group and require an active practice context (`requiresPractice: true`).

| Route | Name | Component | File:line |
|---|---|---|---|
| `/practices/users` | `practices.users` | `PracticeUsersContainer` | `app/imports/startup/client/routes/practice.jsx:46` |
| `/practices/users/:userId` | `practices.usermanagement` | `PracticeUserPageContainer` | `app/imports/startup/client/routes/practice.jsx:56` |

UI composition:

- `PracticeUsers` (roster) · `app/imports/ui/pages/practices/users/PracticeUsers.jsx:35` — card grid of active practice members plus pending invitations, "Invite" button.
- `PracticeUserRole` · `app/imports/ui/pages/practices/users/PracticeUserRole.jsx:24` — the pill showing a user's current role; for non-owners, an inline dropdown that calls `changeRole`.
- `PracticeInvitation` · `app/imports/ui/pages/practices/users/PracticeInvitation.jsx:27` — the card for a pending invitation (the yellow "invited" pill, resend, remove).
- `PracticeUserPage` (detail) · `app/imports/ui/pages/practices/users/PracticeUserPage.jsx:27` — left: contact card + free-text note + "make owner" + "remove" buttons; right: commission sub-form.
- `PracticeUsersContainer` (roster tracker) · `app/imports/ui/containers/practices/users/PracticeUsersContainer.jsx:15`.
- `PracticeUserPageContainer` (detail tracker) · `app/imports/ui/containers/practices/users/PracticeUserPageContainer.jsx:9`.

Both screens are gated by practice membership — there is no read-only "list of colleagues" variant for the `default` (lid) role, but the list *is* technically accessible to any member, because the `practiceUsers` publication only checks that the subscriber is a member of the practice (`app/imports/api/practiceUsers/server/publications.jsx:39`). What differs by role is which **actions** the UI exposes via `PermissionRender` guards.

## Data sources (publications)

- `practiceUsers` · `app/imports/api/practiceUsers/server/publications.jsx:30` — joined `PracticeUsers` + `Meteor.users` (public fields) for everyone in the practice. Owners can optionally include removed members by passing `includeRemoved=true`.
- `practiceInvitations` · `app/imports/api/invitations/server/publications.js:5` — the pending `Invitations` rows for this practice.
- `plans` · `app/imports/api/payments/server/publications.jsx:6` — needed to compute "is this practice at its user limit".
- `practiceUser` (detail page) · `app/imports/api/practiceUsers/server/publications.jsx:6` — gated by `practice.user.view`; only the owner and admin can subscribe to another user's record.

The roster container (`PracticeUsersContainer`) also calls `SubscriptionUtil.getActiveSubscriptionOfPractice(currentPracticeId)` synchronously inside `withTracker` to look up the current plan's `canAddUsers` predicate (`app/imports/ui/containers/practices/users/PracticeUsersContainer.jsx:19-20`).

## The roster page — `/practices/users`

Layout: a single row of Bootstrap cards. Each member card renders:

- Circular avatar (`user.image()`).
- Role pill (`PracticeUserRole`) — either a static label (for the owner) or an inline dropdown (for admin/default) that calls `changeRole`.
- Name (`user.name()`), phone, email, formatted IBAN bank account.
- A red ✗ icon in the top-right that triggers `confirmDelete().then(removeUser.call(...))`, only rendered when the user is **not** the owner and when the current user has `practice.user.remove` permission (via `PermissionRender`).

Then each pending invitation (`PracticeInvitation`) renders as:

- Placeholder avatar (`placeholderUser.image()`).
- Yellow "Uitgenodigd" pill (`practice.users.roles.invited`).
- Invited email address as the title.
- Resend icon (calls `inviteUser.call({email, practiceId})`) and remove icon (calls `removeInvitation.call({email, practiceId})`), both `PermissionRender`-gated on `practice.user.invite`.

Below the grid, a centred "Invite user" button opens a modal containing a single-field form (`email`) built from `app/imports/lib/formSchemas/practices/userAdd.jsx`. The form calls `inviteUser` on submit.

### Plan user-limit check

The "Invite user" button is disabled and shows a tooltip (`REACHED_LIMIT_USERS_OF_PLAN_UPGRADE_PLEASE`) when:

```js
const userCount = users.length + invitations.length;
const canAddUser = plan.canAddUsers(userCount);
```

`canAddUsers(currentUsersCount)` returns `currentUsersCount < plan.maxUsers` (or always `true` if `maxUsers === -1`) — see `app/imports/api/payments/plans.jsx:39`.

The count includes pending invitations, so you cannot park extra invitations to route around the plan cap.

The server enforces the same rule inside `inviteUser` (`app/imports/api/practice/methods.jsx:168-170`): it throws `errors.plan.limit.users` if `numberOfUsers + invitedUsers >= plan.maxUsers`.

### "Disabled when no active subscription"

`canEdit = this.props.hasActiveSub` — if the practice has no active subscription, the invite button and the role dropdown are read-only. This is a UI courtesy; the server would throw `NO_ACTIVE_SUB_FOR_PRACTICE` anyway, because `inviteUser` and `changeRole` are declared `subscription: true`.

> ⚠️ `hasActiveSub` is not in the roster container props as of this scout; it is passed from the parent app container. Behaviour inferred from code; needs product validation.

## The detail page — `/practices/users/:userId`

Gated by `PermissionRender('practice.user.view', ..., <NotFoundPage/>)` — a `default` user who tries to navigate directly gets a 404.

Layout: two-column grid.

**Left (`Box` "therapistInfo"):**

- Circular avatar, name, role pill.
- Contact block: `user.fullAddress()`, `user.phone()`, `user.email()`.
- RIZIV number (read-only view of `user.profile.riziv`).
- Company number (`user.profile.companyNumber`).
- Bank account (`user.profile.bankAccount`).
- `LiveEditableForm` for the staff note — schema at `app/imports/lib/formSchemas/practiceUsers/updateInfo.js`, single textarea field `info`, bound to `practice.user.update.info`.
- Two action buttons at the bottom:
  - **"Make owner"** — `PermissionRender`'d on `practice.user.makeOwner`; only shown if the current target is **not** the owner. Confirmation dialog uses the string `practice.users.makeOwner.confirm` which, per i18n, reads `"Ben je zeker dat je %(name)s eigenaar wil maken van de praktijk? Je bent dan zelf geen eigenaar meer."` (`app/imports/i18n/resources/client/nl.i18n.js:980`).
  - **"Remove"** — `PermissionRender`'d on `practice.user.remove`; only shown if the target is not the owner. Calls `removeUser`, and on success navigates back to `practices.users`.

**Right (`Box` "practice.users.commission.title"):**

- `LiveEditableForm` with `therapistCommission` schema — `commission.type` select, `commission.modifiedAt` date picker, `commission.percentage` / `commission.amount` / `commission.specificAmounts` depending on type. See `commissions.md` for the full lifecycle.

## Methods touched by these screens

All declared in `app/imports/api/practice/methods.jsx` unless noted.

| Method name | Line | Permission | Subscription required? | Notes |
|---|---|---|---|---|
| `practice.user.invite` | 153 | `practice.user.invite` | Yes | Triggered by the "Invite user" modal and the pending-invitation resend icon. Enforces the plan's user limit server-side. |
| `practice.user.invite.remove` | 177 | `practice.user.invite.remove` | No | Triggered by the pending-invitation ✗ icon. Deletes the `Invitations` row keyed by `{data.email, data.practiceId}`. |
| `practice.user.remove` | 187 | `practice.user.remove` | No | Deletes the `PracticeUsers` row and, on success, all `patientFileUsers` rows for that user on any patient file in the practice (`app/imports/api/practice/server/util.tsx:148`). Refuses to remove the owner via `role: {$ne: "owner"}` in the selector. |
| `practice.user.role.change` | 215 | `practice.user.role.change` | Yes | Refuses `role === "owner"` with `errors.permissions.practice.user.role.change`. After success, pushes updated calendar permissions to Rosa. |
| `practice.user.makeOwner` | 256 | `practice.user.makeOwner` | Yes | Atomically sets the target's role to `owner` **and** the caller's role to `admin`. After success, pushes updated calendar permissions to Rosa. |
| `practice.user.update.info` | `app/imports/api/practiceUsers/methods.jsx:16` | `practice.user.update.info` | Yes | Writes `info` on the `PracticeUsers` row. |
| `practice.user.update.commission` | `app/imports/api/practiceUsers/methods.jsx:32` | `practice.user.update.commission` | Yes | Writes `commission` on the `PracticeUsers` row and stamps `commission.modifiedAt` if the client did not move it. See `commissions.md` for the debounced commission-invoice rebuild hook. |

## User-visible behaviour

### Inviting

1. Owner or admin clicks "Invite user" on `/practices/users`.
2. Modal opens with one field: email.
3. On submit, `inviteUser` runs:
   - Looks up the email in `Meteor.users`. If it exists and is already a member of this practice → throws `practice.inviteUser.alreadyMember`.
   - Generates an invitation token via `invitationsUtil.generateLink(inviterId, "joinPractice", {practiceId, email})` — see `invitations.md`.
   - Sends the `invitationForPractice` mail template to the target email with the accept-link.
   - If the target already has a Halingo account, also inserts an `Notifications` row (`notifications.practice.invite.title`) so they see the invitation in the in-app notification centre next time they open Halingo.
4. A new card with a yellow "Uitgenodigd" pill appears in the roster immediately (from the `practiceInvitations` publication).
5. Once the invitee clicks the link and accepts, the `Invitations` row is removed and a `PracticeUsers` row with role `default` is created (`app/imports/api/invitations/server/util.jsx:13`).

If the email fails to send, `inviteUser` throws `practice.inviteUser.mail.error` and the UI shows a notification.

### Resending an invitation

Click the resend icon on a pending-invitation card. This re-calls `inviteUser` with the same arguments; the server's `invitationsUtil.generateLink` does an `upsert` on `{userId, type, data}` (`app/imports/api/invitations/server/util.jsx:49`), so the existing `Invitations` row is reused with a refreshed `token` and `createdAt`. A fresh email goes out with the new link.

### Cancelling an invitation

Click the ✗ icon on a pending-invitation card. `removeInvitation` calls `Invitations.remove({"data.email": email, "data.practiceId": practiceId})`. The pending card disappears immediately.

### Changing a role

Click the role pill on a member card (non-owner only). A dropdown opens with the other available roles. Selecting one calls `changeRole.call({userId, practiceId, role})`. The server refuses `"owner"` explicitly.

### Transferring ownership

Navigate into a non-owner's detail page, click "Make owner", confirm. `makeOwner.call({userId, practiceId})` runs. The target becomes `owner`, the current user becomes `admin`. The UI state on the current user's page then immediately reflects the downgrade — the current user will lose access to subscription-related buttons on the subscription page (see `saas_subscriptions.md`).

### Removing a user

Click the red ✗ on the roster card, or the "Remove" button on the detail page. Confirms, then `removeUser.call({userId, practiceId})`:

1. `PracticeUsers.remove({userId, practiceId, role: {$ne: "owner"}})` — refuses owner.
2. If count > 0: finds all patient files in the practice and removes the target's `PatientFileUsers` rows for any of them.
3. Returns `count > 0`.

There is a Rosa TODO comment at `app/imports/api/practice/methods.jsx:205-208` noting that the removal is not mirrored to Rosa yet.

### Editing the free-text staff note

On the detail page, the textarea under the contact block is a `LiveEditableForm` — edits auto-save (debounced) via `updateInfo`. Purpose of the note is unspecified in code; likely for "Jan works Mondays only" reminders.

### Setting commission

The right-column commission form is a `LiveEditableForm` bound to the `therapistCommission` schema. Changing any value auto-saves via `updateCommission`. See `commissions.md` for fields, states, and the downstream commission-invoice rebuild.

## Permissions

| UI action | Permission checked by the UI | Enforced by the server method |
|---|---|---|
| Render "Invite user" button | `practice.user.invite` | `practice.user.invite` |
| Render resend icon | `practice.user.invite` | same |
| Render remove-invitation icon | `practice.user.invite` | `practice.user.invite.remove` (note the UI uses `inviteUser.name` for the render guard, not `removeInvitation.name` — see *Notable details*) |
| Render ✗ on member card | `practice.user.remove` + hide if target is owner | `practice.user.remove` |
| Render role dropdown | `practice.user.role.change` (inside `PermissionRender` in `PracticeUserRole.jsx:40`) | `practice.user.role.change`, + refuses `"owner"` |
| Render "Make owner" button | `practice.user.makeOwner` | `practice.user.makeOwner` |
| Render whole detail page | `practice.user.view` (wraps the entire page tree in `PermissionRender`) | `practiceUser` publication gates on same |
| Commission form, staff-note form | No client-side guard (uses `LiveEditableForm`'s `readOnly={!canEdit}` only) | `practice.user.update.commission`, `practice.user.update.info` |

The `canEdit` flag is a single `hasActiveSub` boolean — it is not role-aware. A `default` user who somehow reached the detail page (e.g. deep-link attempt) is blocked by `practice.user.view` at render time.

## Notable details

- **`removeInvitation` UI guards use the wrong permission.** `PracticeInvitation.jsx:68, 73` wraps both the resend and the remove-invitation icons in `PermissionRender(inviteUser.name, ...)` — i.e. they check `practice.user.invite`, not the dedicated `practice.user.invite.remove`. Since owner and admin have both permissions, this is functionally equivalent, but semantically the two permissions should probably be split. Cosmetic, not a bug.
- **Inline role dropdown omits the current role and "owner".** `PracticeUserRole.jsx:15, 41` builds the dropdown from `_.pull(_.keys(roles), roles.owner.id)` (so the pool is `admin` and `default`) then filters out the role the user already has. So the dropdown never offers `owner` — you have to go to the detail page and use "Make owner".
- **The roster sort order is role-based.** `PracticeUsersContainer.jsx:25` sorts users by `roleNames.indexOf(...)` where `roleNames = _.keys(roles)` — so owner first, then admin, then default. New members appear last within their role bucket.
- **`hasActiveSub` is inherited from the app container.** It is not computed inside `PracticeUsersContainer`. Look up the parent for how it is set.
- **The invite modal calls `showMessage(res)`** which displays the error string from `res.err`/`res.error` if the server returned one, and otherwise `practice.inviteUser.mail.success`. It does not forward structured validation errors; the modal just closes.
- **`practiceInvitations` publication is not paginated.** Every pending invitation is streamed; for a large practice with a cleanup pipeline backlog this could be hundreds of rows.
- **The commission sub-form is wrapped in a `Box` titled `practice.users.commission.title`**, but there is no visual indication of whether the user is the owner or an admin editing their own commission record vs. editing a colleague's. The "make owner" button in the same layout is also visible when editing yourself (as long as you're not already the owner) — which is a no-op, since you cannot promote yourself.
- **The detail page has a commented-out "accessibility" box** (`app/imports/ui/pages/practices/users/PracticeUserPage.jsx:131-142`) referencing `DefinitionAccess`. This points to a planned but not shipped per-user practice-access restriction feature. > ⚠️ Inferred from commented code; not shippable.
- **`updateInfo` and `updateCommission` are `PermissionValidatedMethod`s with `subscription: true`.** Editing them on a cancelled practice will throw `NO_ACTIVE_SUB_FOR_PRACTICE`.
- **No audit log of role changes.** `MethodLogger` (see `app/imports/lib/permissions/LoggedInValidatedMethod.jsx:21`) records all method calls with arguments and duration, but there is no dedicated `roleChangeHistory` collection and no "who changed whose role when" view.
- **`changeRole` is debounced on the server** only through the generic `MethodLogger` — there is no throttling. A spammy client could flip a user's role repeatedly.
- **Removed practice users.** `_removeUser` calls `PracticeUsers.remove`, which is configured on the `Collection` base class to be a soft delete with `removed`/`removedAt` fields (see `app/imports/api/practiceUsers/practiceUsers.jsx:175`). The roster publication excludes removed rows by default but owners can view them with `includeRemoved=true`. The UI does not currently expose this switch.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` documents "adding a colleague to your practice" at an introductory level.
- The "make owner" transfer and the admin/lid distinction are not explained step by step.
- The per-user detail page is not screenshotted in the helpdesk.
- Invitation resend behaviour, and the plan-limit gate on invitations, are not documented.

## Source files

- `app/imports/startup/client/routes/practice.jsx:46-65` — route definitions.
- `app/imports/ui/pages/practices/users/PracticeUsers.jsx` — roster.
- `app/imports/ui/pages/practices/users/PracticeUserRole.jsx` — role pill & dropdown.
- `app/imports/ui/pages/practices/users/PracticeInvitation.jsx` — pending invite card.
- `app/imports/ui/pages/practices/users/PracticeUserPage.jsx` — detail page.
- `app/imports/ui/pages/practices/users/PracticeUsersCarousel.jsx` — carousel variant (not covered here; probably dashboard).
- `app/imports/ui/containers/practices/users/PracticeUsersContainer.jsx` — roster data.
- `app/imports/ui/containers/practices/users/PracticeUserPageContainer.jsx` — detail data.
- `app/imports/api/practice/methods.jsx` — `inviteUser`, `removeInvitation`, `removeUser`, `changeRole`, `makeOwner`.
- `app/imports/api/practice/server/util.tsx` — `_inviteUser`, `_removeUser`, `_changeRole`.
- `app/imports/api/practiceUsers/methods.jsx` — `updateInfo`, `updateCommission`, `updateAgendaKeys`, `getPracticeUsers`.
- `app/imports/api/practiceUsers/server/publications.jsx` — `practiceUser`, `practiceUsers` publications.
- `app/imports/api/invitations/server/publications.js` — `practiceInvitations` publication.
- `app/imports/lib/formSchemas/practices/userAdd.jsx` — invite modal form.
- `app/imports/lib/formSchemas/practiceUsers/updateInfo.js` — staff note textarea.
- `app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx` — per-user commission form.
- `app/imports/i18n/resources/client/nl.i18n.js` around line 972 — role labels, "make owner" confirmation strings.
