# Practice user roles and permissions

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the three-tier model is mentioned in `../../full_documentation/general_getting_started.md` informally, but the exact permission matrix is not documented anywhere except the source. Verify against running app before promoting to `manual/`.

## What it is

Halingo has a three-tier role model scoped to a **practice**: each user, for each practice they belong to, has exactly one of three roles. The full list of permission constants and their role mapping is defined in a single object literal: `roles` in `app/imports/api/practiceUsers/practiceUsers.jsx:8-153`.

| Code constant | i18n label (NL) | Helpdesk / glossary term |
|---|---|---|
| `owner` | "Eigenaar" (`practice.users.roles.owner`) | **Praktijkverantwoordelijke** |
| `admin` | "Beheerder" (`practice.users.roles.admin`) | **Beheerder** |
| `default` | "Therapeut" (`practice.users.roles.default`) | **Lid** |

Source for labels: `app/imports/i18n/resources/client/nl.i18n.js:972-977`. There is a fourth value, `"invited"` (`practice.users.roles.invited`, "Uitgenodigd"), used only as a visual pill on a pending `Invitations` card — it is not a real role and does not appear in the `roles` object.

Role assignment lives on the `PracticeUsers` collection row for that `(userId, practiceId)` pair (`app/imports/api/practiceUsers/practiceUsers.jsx:170`):

```js
role: { type: String, defaultValue: "default", allowedValues: _.keys(roles) }
```

The default role for a new `PracticeUsers` insert is `"default"` — so accepted invitations land as members (see `invitations.md`).

## How permission checks are wired

A dispatcher in `app/imports/lib/permissions/Permissions.jsx` holds a whitelist of functions; at startup (`app/imports/startup/lib/bootstrap/permissions.jsx:6`), two checks are registered:

```js
PermissionsUtil.addWhiteListCheck((permission, userId, data) =>
  PracticeUsersUtil.checkUserPermission(permission, userId, data.practiceId));

PermissionsUtil.addWhiteListCheck((permission, userId, data) =>
  PatientFileUsersUtil.checkUserPermission(permission, userId, data.patientFileId));
```

A permission is granted if **either** whitelist function returns truthy — practice-level permission grants *or* patient-file-level permission grants are sufficient. See "Cross-matrix: practiceUsers vs patientFileUsers" below for the interactions.

`PracticeUsersUtil.checkUserPermission` (`app/imports/api/practiceUsers/util.jsx:6`) does a single MongoDB lookup on `{userId, practiceId}` and then checks `roles[relation.role].permissions` for membership.

The two callers of these checks are:

- **`PermissionValidatedMethod`** (`app/imports/lib/permissions/PermissionValidatedMethod.jsx:6`) — server-side method guard. Looks up the permission by method name (or an explicit `permissions` array), verifies it, and also checks that the practice has an active subscription if `subscription: true` is declared on the method.
- **`PermissionRender`** (`app/imports/lib/permissions/PermissionRender.js:4`) — client-side UI guard. Returns `allowed` or `disallowed` depending on the check result, passing the current `Meteor.userId()`.

## Permission matrix

Rows are the permission constants as they appear in `roles.owner.permissions`, `roles.admin.permissions`, `roles.default.permissions` at `app/imports/api/practiceUsers/practiceUsers.jsx:11-152`. Columns are the three roles. The rightmost column is the source line(s) where the permission is enforced (method name or `PermissionValidatedMethod` declaration). All rows cite `practiceUsers.jsx` for the assignment.

Cells:
- ✓ = listed in that role's `permissions` array
- ✗ = not listed

| Permission constant | owner | admin (beheerder) | default (lid) | Enforced by (file:line) |
|---|:---:|:---:|:---:|---|
| `events.statistics` | ✓ | ✓ | ✗ | — (not referenced as a Validated method name; referenced as the permission list entry in `practiceUsers.jsx:12, 83`) |
| `practice.commission.generate` | ✓ | ✓ | ✗ | `practice.commission.generate` method in `app/imports/api/invoices/commissionInvoices/methods.jsx` (not read in this pass) |
| `practice.commission.getOpenAmount` | ✓ | ✓ | ✗ | Commission open-amount method |
| `practice.commission.remove` | ✓ | ✓ | ✗ | Commission removal method |
| `practice.commission.update.amount` | ✓ | ✓ | ✗ | Commission amount method |
| `practice.commission.update.state` | ✓ | ✓ | ✗ | Commission state transition |
| `practice.commission.view` | ✓ | ✓ | ✗ | Commission view |
| `practice.subscriptions.cancel` | ✓ | ✗ | ✗ | `cancelSubscription` · `app/imports/api/practice/methods.jsx:318` (runtime check via `checkUserPermission`) |
| `practice.subscriptions.resume` | ✓ | ✗ | ✗ | `resumeSubscription` · `app/imports/api/practice/methods.jsx:342`, also used as fallback for `selectPlanForPractice` at `app/imports/api/practice/methods.jsx:377` |
| `practice.subscriptions.change` | ✓ | ✗ | ✗ | Declared on owner only; not referenced by any method body. > ⚠️ Dead or vestigial permission; may be a placeholder for a feature not implemented. |
| `practice.subscriptions.plan.change` | ✓ | ✗ | ✗ | `changePlanOfSubscription` · `app/imports/api/subscriptions/methods.jsx:33` (runtime check at line 48) |
| `practice.subscriptions.payment.change` | ✓ | ✗ | ✗ | `changePaymentOfSubscription` · `app/imports/api/subscriptions/methods.jsx:55` (runtime check at line 80) |
| `practice.invoices.view` | ✓ | ✓ | ✗ | SaaS subscription invoice publications (verify with publications) |
| `practice.invoices.pay` | ✓ | ✓ | ✗ | `createSourceForInvoice` · `app/imports/api/practice/methods.jsx:396` (and `checkSourceForInvoice` line 420) |
| `practice.settings.update` | ✓ | ✓ | ✗ | `updateSettings` · `app/imports/api/practice/methods.jsx:131` (declared as `PermissionValidatedMethod`, `subscription: true`) |
| `practice.update` | ✓ | ✓ | ✗ | `updatePractice` · `app/imports/api/practice/methods.jsx:103` |
| `practice.user.invite` | ✓ | ✓ | ✗ | `inviteUser` · `app/imports/api/practice/methods.jsx:153` |
| `practice.user.invite.remove` | ✓ | ✓ | ✗ | `removeInvitation` · `app/imports/api/practice/methods.jsx:177` |
| `practice.user.remove` | ✓ | ✓ | ✗ | `removeUser` · `app/imports/api/practice/methods.jsx:187` |
| `practice.user.role.change` | ✓ | ✓ | ✗ | `changeRole` · `app/imports/api/practice/methods.jsx:215` (hard-wired refusal to change to `owner` at line 239) |
| `practice.user.makeOwner` | ✓ | ✗ | ✗ | `makeOwner` · `app/imports/api/practice/methods.jsx:256` |
| `practice.user.update.commission` | ✓ | ✓ | ✗ | `updateCommission` · `app/imports/api/practiceUsers/methods.jsx:32` |
| `practice.user.update.info` | ✓ | ✓ | ✗ | `updateInfo` · `app/imports/api/practiceUsers/methods.jsx:16` |
| `practice.user.view` | ✓ | ✓ | ✗ | `practiceUser` publication · `app/imports/api/practiceUsers/server/publications.jsx:11` (gates whether another user's detail can be subscribed to) |
| `practice.user.update.publickeys` | ✓ | ✓ | ✗ | `updateAgendaKeys` · `app/imports/api/practiceUsers/methods.jsx:54` |
| `practice.user.get.practiceusers` | ✓ | ✓ | ✓ | `getPracticeUsers` · `app/imports/api/practiceUsers/methods.jsx:92` |
| `practice.chat` | ✓ | ✓ | ✓ | `addChatMessage` · `app/imports/api/practice/methods.jsx:24` |
| `practice.chat.read` | ✓ | ✓ | ✓ | `updateRead` · `app/imports/api/practice/methods.jsx:48` |
| `practice.events.add.otherUser` | ✓ | ✓ | ✗ | Events module (not read in this pass) — controls whether a user can book appointments on someone else's calendar |
| `patientFile.view` | ✓ | ✓ | ✗ | Patient file module; **also granted at the file level** via `PatientFileUsers` (see cross-matrix) |
| `patientFile.add` | ✓ | ✓ | ✓ | Patient file add method |
| `patientFile.count` | ✓ | ✓ | ✗ | Patient file count query |
| `patientFile.remove` | ✓ | ✓ | ✗ | Patient file remove |
| `patientFile.update` | ✓ | ✓ | ✗ | Patient file update |
| `patientFiles.get` | ✓ | ✓ | ✗ | Patient file list query |
| `patientFile.grantAccess` | ✓ | ✓ | ✗ | Patient file ACL modification |
| `patientFile.removeAccess` | ✓ | ✓ | ✗ | Patient file ACL modification |
| `patientFile.reports.add` | ✓ | ✓ | ✗ | Patient file report module |
| `patientFile.reports.delete` | ✓ | ✓ | ✗ | Patient file report module |
| `patientFile.reports.edit` | ✓ | ✓ | ✗ | Patient file report module |
| `patientFile.therapies.long.add` | ✓ | ✓ | ✗ | Long-term therapy plan |
| `patientFile.therapies.long.delete` | ✓ | ✓ | ✗ | Long-term therapy plan |
| `patientFile.therapies.long.edit` | ✓ | ✓ | ✗ | Long-term therapy plan |
| `patientFile.therapies.short.delete` | ✓ | ✓ | ✗ | Short-term therapy plan |
| `patientFile.therapies.short.edit` | ✓ | ✓ | ✗ | Short-term therapy plan |
| `practice.therapists.view` | ✓ | ✓ | ✓ | `findTherapistOfPractice` · `app/imports/api/practice/methods.jsx:292` (note: permission name is reused both as the method name and as the check) |
| `invoices.commission.view` | ✓ | ✓ | ✗ | Commission invoices view |
| `invoices.edit` | ✓ | ✓ | ✗ | Patient invoice edit |
| `invoices.generate` | ✓ | ✓ | ✗ | Patient invoice generate |
| `invoices.insurance.add.all` | ✓ | ✓ | ✗ | Insurance invoice (Verzamelstaat) |
| `invoices.insurance.edit` | ✓ | ✓ | ✗ | Insurance invoice edit |
| `invoices.insurance.print` | ✓ | ✓ | ✗ | Insurance invoice print |
| `invoices.insurance.cancel` | ✓ | ✓ | ✗ | Insurance invoice cancel |
| `invoices.insurance.view` | ✓ | ✓ | ✗ | Insurance invoice view |
| `invoices.statistics` | ✓ | ✓ | ✗ | Practice financial statistics |
| `invoices.statistics.earnings` | ✓ | ✓ | ✗ | Practice earnings graph |
| `invoices.view` | ✓ | ✓ | ✗ | Patient invoice view |
| `teamMeeting.add` | ✓ | ✓ | ✗ | Team meeting creation |
| `treatments.add` | ✓ | ✓ | ✗ | Treatment create |
| `treatments.edit` | ✓ | ✓ | ✗ | Treatment edit |
| `treatments.remove` | ✓ | ✓ | ✗ | Treatment remove |
| `treatments.bilans.add` | ✓ | ✓ | ✗ | Bilan add |
| `treatments.bilans.edit` | ✓ | ✓ | ✗ | Bilan edit |
| `treatments.bilans.remove` | ✓ | ✓ | ✗ | Bilan remove |
| `referrals` | ✓ | ✗ | ✗ | `getReferrals` · `app/imports/api/referrals/methods.js:6` — but the method is declared as `LoggedInValidatedMethod`, **not** `PermissionValidatedMethod`, so the permission constant is never checked at the method level. The permission is purely decorative. |
| `referrals.invite` | ✓ | ✗ | ✗ | `inviteUserByEmail` · `app/imports/api/referrals/methods.js:14` — also `LoggedInValidatedMethod`; permission not enforced. |

### Totals

- `owner`: 62 distinct permissions.
- `admin`: 53 distinct permissions (owner minus the 9 subscription-ownership / make-owner / referrals rows).
- `default`: 5 distinct permissions: `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`.

### The owner/admin delta — exactly what owner can do that admin cannot

From the matrix above, an `admin` is missing **nine** permissions compared to `owner`:

1. `practice.subscriptions.cancel`
2. `practice.subscriptions.resume`
3. `practice.subscriptions.change`
4. `practice.subscriptions.plan.change`
5. `practice.subscriptions.payment.change`
6. `practice.user.makeOwner`
7. `referrals`
8. `referrals.invite`
9. (Everything else is identical between owner and admin.)

In practice, this means **only the owner can touch the SaaS subscription** (cancel, resume, change plan, change payment method) and only the owner can transfer ownership. Everything else an owner can do, an admin can too.

However: because `referrals` and `referrals.invite` are declarative-only (their methods use `LoggedInValidatedMethod`), the referral programme is **effectively open to all logged-in users regardless of role**. This is an inconsistency between the declared permission and the runtime check.

### The default (lid) role — the short list

A `default` user has exactly these five permissions:

1. `patientFile.add` — may create new patient files (but cannot view existing ones owned by others unless explicitly granted access).
2. `practice.therapists.view` — may list the therapists of their practice.
3. `practice.user.get.practiceusers` — may fetch the practice user roster (used by the agenda key management).
4. `practice.chat` — may post into practice chat.
5. `practice.chat.read` — may mark chat messages read.

A `default` user **cannot** view patient files, invoices, commissions, statistics, treatments, bilans, reports, or any administrative surface — unless access is granted on a per-file basis through the `PatientFileUsers` row (see cross-matrix below).

## Cross-matrix: practiceUsers vs patientFileUsers

A second, separate permission matrix exists on the `patientFileUsers` collection (`app/imports/api/patientFileUsers/patientFileUsers.jsx:6-57`), with confusingly overlapping role names.

| patientFileUsers role | Permissions |
|---|---|
| `admin` | `patientFile.remove`, `patientFile.update`, `patientFile.grantAccess`, `patientFile.view`, `patientFile.reports.add/delete/edit`, `patientFile.therapies.long.add/delete/edit`, `patientFile.therapies.short.delete/edit`, `treatments.add/edit/remove`, `treatments.bilans.add/edit/remove` (18 permissions) |
| `default` | **identical** to `admin` (18 permissions) |
| `owner` | `patientFile.view` only |

And the fall-through rule in `PatientFileUsersUtil.checkUserPermission` (`app/imports/api/patientFileUsers/util.jsx:11`):

```js
const patientFile = PatientFiles.findOne(patientFileId);
let relation = PatientFileUsers.findOne({ userId, patientFileId });

if (!relation && _.get(patientFile, 'metaData.userId') === userId) {
  relation = { role: "owner" };
}

return (relation && _checkPermission(relation.role, permission)) ||
       PracticeUsersUtil.checkUserPermission(permission, userId, patientFile.practiceId);
```

**Important — this two-matrix design is intentional, not a bug.** Confirmed by the product owner 2026-04-07. The two matrices serve different purposes and are combined disjunctively (OR) by design. The earlier draft of this page framed the differences as contradictions; that framing was wrong. The corrected reading:

### Design 1 — the two matrices are layered, not redundant

`practiceUsers` defines the **practice-wide** role hierarchy: who can do what across all files in the practice, plus who can manage the practice itself. `patientFileUsers` defines **per-file** access grants: who has been let into a specific dossier outside the normal practice hierarchy. The two are combined with OR — a user gets a permission if **either** matrix grants it.

Consequence: the per-file matrix is **purely additive**. It can grant access to users who would not otherwise have it. It cannot revoke access from users who already have it via their practice role.

### Design 2 — `patientFileUsers.owner` means "the user who created this file"

In `patientFileUsers.roles.owner` (`patientFileUsers.jsx:53`), `owner` carries only `patientFile.view`. This is **not** an under-permissioned version of `practiceUsers.roles.owner` — it is a different thing entirely. It is the marker for "the user who originally created this patient file". That marker only needs to grant read access, because the creator (being a practice member) already has whatever practice-level permissions their practice role gives them. The file-level "owner" entry exists so the creator can be identified, not so that creation grants extra power.

When reading the code, do not equate `patientFileUsers.roles.owner` with `practiceUsers.roles.owner`. They are unrelated keys that happen to share a name.

### Design 3 — `patientFileUsers.admin` and `patientFileUsers.default` having identical 18 permissions

In `patientFileUsers.jsx:30-52`, both `default` and `admin` list the same 18 permissions. **The intended distinction is "admin can grant/revoke per-file access; default cannot", but it is enforced only on the frontend** (the manage-access buttons are hidden for `default` users). The backend does not enforce it. Confirmed by the product owner 2026-04-07 (Q1, clarified): "the frontend blocks the .default as no button is available to do the action, the backend didnt block it thats a bug".

This is a **trust boundary issue** — see [`../bugs_and_security_findings.md`](../bugs_and_security_findings.md) §"Frontend-only access control on `patientFileUsers` ACL management". The ACL grant/revoke methods need a server-side `checkPermission` guard. Until that lands, the per-file `admin` vs `default` distinction is cosmetic; a `default` per-file user can call the underlying methods directly via DDP / browser console.

### Design 4 — practice role dominates, per-file ACL adds

A user who is a practice-level `default` (5 permissions) but has a `patientFileUsers` row with role `admin` or `default` on a specific file can:

- view, update, and **remove** that patient file,
- add / edit / remove treatments on it,
- add / edit / remove reports on it,
- add / edit / remove bilans on it.

Conversely, a practice-level `admin` (beheerder) who does **not** have a `patientFileUsers` row for a specific patient file can still touch it via the practice-level permission. This is by design and matches the "beheerder sees everything in the practice" mental model from the helpdesk.

The fall-through on line 26 of `patientFileUsers/util.jsx` means the **practice role dominates**: if the practice-level check grants the permission, the lack of (or restricted) file-level ACL does not matter.

## Notable invariants and guard rails

- **An `admin` cannot promote themselves to `owner`.** The `changeRole` method hard-refuses `role === "owner"` at `app/imports/api/practice/methods.jsx:239` with error `errors.permissions.practice.user.role.change`. The only way to become owner is `makeOwner`, which requires the current owner to run it.
- **`makeOwner` is a swap.** It calls `changeRole(target, "owner")` **and** `changeRole(currentUser, "admin")` in the same method (`app/imports/api/practice/methods.jsx:276-278`). So transferring ownership downgrades the previous owner to admin. There is no "co-owner" or "multiple owners" state.
- **`changeRole` refuses unknown roles** via `_.includes(_.keys(PracticeUsersRoles), role)` (`app/imports/api/practice/server/util.tsx:159`).
- **`removeUser` refuses to remove the owner.** The selector in `_removeUser` filters `role: { $ne: "owner" }` (`app/imports/api/practice/server/util.tsx:141`). So even if a method permission check granted it, the owner cannot be removed through this method — the only way is `makeOwner` to another user first, then remove.
- **Removing a user also removes their `patientFileUsers` rows** for every patient file in that practice (`app/imports/api/practice/server/util.tsx:148-153`).
- **Practice-level role changes are reflected in Rosa.** `changeRole` and `makeOwner` both call `RosaPractices.setCalendarPermissionsInRosaForPracticeId` and `RosaPatients.updatePermissionsForPatientFilesOfPractice` after mutating (`app/imports/api/practice/methods.jsx:244-249, 280-285`).
- **`checkUserPermission` returns false on missing userId/practiceId** (`app/imports/api/practiceUsers/util.jsx:7`) — i.e. a not-signed-in user or an unscoped check fails closed.
- **`practiceUser` publication gates itself on `practice.user.view`** (`app/imports/api/practiceUsers/server/publications.jsx:11`). So a `default` user cannot even subscribe to another user's detail — the publication just calls `this.ready()` with no data.
- **`practiceUsers` publication** (`app/imports/api/practiceUsers/server/publications.jsx:30`) is not gated by permission; it requires only that the subscriber is a practice member. An `includeRemoved=true` flag additionally requires the subscriber to be `owner`.

## The "invited" pseudo-role

A pending invitation is represented as an `Invitations` row (see `invitations.md`) and is rendered in the UI with a yellow "invited" chip (`app/imports/ui/pages/practices/users/PracticeInvitation.jsx:46-49`). The i18n key `practice.users.roles.invited` ("Uitgenodigd") is hand-picked by the component; it is not in the `roles` object, not in `nl.i18n.js:roles`, and not enforced anywhere. A pending invitation has no permissions at all until the user accepts it, at which point a `PracticeUsers` row is created with role `"default"` (`app/imports/api/invitations/server/util.jsx:17`).

## Interaction with the SaaS subscription state

Many `PermissionValidatedMethod`s declare `subscription: true`, which means the method additionally checks that the practice has an active `Subscriptions` row before the permission check even runs (`app/imports/lib/permissions/PermissionValidatedMethod.jsx:17-31`):

```js
if (!sub || !sub.isActive()) {
  throw new Meteor.Error("NO_ACTIVE_SUB_FOR_PRACTICE");
}
```

Methods that require a subscription (`subscription: true`) include:

- `practice.settings.update` (`app/imports/api/practice/methods.jsx:134`)
- `practice.user.invite` (`app/imports/api/practice/methods.jsx:156`)
- `practice.user.role.change` (`app/imports/api/practice/methods.jsx:230`)
- `practice.user.makeOwner` (`app/imports/api/practice/methods.jsx:268`)
- `practice.user.update.info` (`app/imports/api/practiceUsers/methods.jsx:19`)
- `practice.user.update.commission` (`app/imports/api/practiceUsers/methods.jsx:35`)
- `practice.user.update.publickeys` (`app/imports/api/practiceUsers/methods.jsx:57`)
- `practice.user.update.privateKey` (`app/imports/api/practiceUsers/methods.jsx:78`)
- `practice.user.get.practiceusers` (`app/imports/api/practiceUsers/methods.jsx:95`)
- `practice.chat` — **not** declared `subscription: true` (the comment `//subscription: true` at `app/imports/api/practice/methods.jsx:26` is commented out, so chat works during cancellation periods).

Subscription-related methods (`cancelSubscription`, `resumeSubscription`, `changePlanOfSubscription`, `changePaymentOfSubscription`) are **not** `PermissionValidatedMethod` — they are `LoggedInValidatedMethod` and do their permission check *inside* `run()` by calling `practiceUsersUtil.checkUserPermission(permission, this.userId, sub.practiceId)`. So the `subscription: true` auto-block does not apply to them. This is intentional: you still need to be able to cancel a subscription even when it is still technically active.

## Methods (summary — see `practice_user_management.md` for the UI side)

The practice-level staff management methods, grouped by role requirement:

- **Owner-only:** `practice.subscriptions.cancel`, `practice.subscriptions.resume`, `practice.subscriptions.change` (dead), `practice.subscriptions.plan.change`, `practice.subscriptions.payment.change`, `practice.user.makeOwner`, `referrals` (not enforced), `referrals.invite` (not enforced).
- **Owner + admin:** `practice.update`, `practice.settings.update`, `practice.user.invite`, `practice.user.invite.remove`, `practice.user.remove`, `practice.user.role.change`, `practice.user.update.commission`, `practice.user.update.info`, `practice.user.view`, `practice.user.update.publickeys`, `practice.invoices.view`, `practice.invoices.pay`, `practice.commission.*`, `practice.events.add.otherUser`, `patientFile.*`, `patientFiles.get`, `patientFile.therapies.*`, `patientFile.reports.*`, `invoices.*`, `treatments.*`, `teamMeeting.add`, `events.statistics`.
- **All three roles:** `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`.

## Notable details

- **Role strings are used both as role IDs and as method names.** The `roles.*.id` field is redundant with the object key; everywhere the code uses string literals like `"owner"`, `"admin"`, `"default"` directly.
- **No "removed" role.** Once a user is removed from a practice, the `PracticeUsers` row is either deleted or marked with `removed: true` and `removedAt`. The `practiceUsers` publication surfaces removed rows only to owners who explicitly ask for them (`includeRemoved=true`).
- **The `practiceUsers` publication is not reactive in the usual sense.** Line 31 of `app/imports/api/practiceUsers/server/publications.jsx` has the comment `// TODO make reactive`, suggesting the code predates the current Meteor publication semantics and still iterates `fetch()` in places.
- **Permissions are checked by flat array `.includes`**, not a lookup table. Adding a new permission constant means editing the arrays on every role that should have it — there is no inheritance.
- **No permission versioning.** Changing the role matrix ships immediately; there is no migration for existing sessions or for users who happen to be mid-action.
- **No fine-grained editing of permissions per user.** A user is their role; the role is their permissions. You cannot give one specific admin the right to cancel a subscription without making them owner.
- **`referrals` / `referrals.invite` are the only two permissions declared on owner that are not enforced.** Every other permission in owner's list is checked somewhere in code.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` describes the three tiers informally as "praktijkverantwoordelijke / beheerder / lid" but does not list the capabilities of each.
- The glossary in `docs/glossary.md` describes beheerder as "can manage members and view peers' invoices" and lid as "cannot view peers' financials" — which matches the code (admin has `invoices.view`, default does not).
- The helpdesk does not document file-level patient access grants.
- The helpdesk does not explain that subscription management is owner-only.

## Source files

- `app/imports/api/practiceUsers/practiceUsers.jsx` — `roles` constants, `PracticeUsers` collection, schema, helpers.
- `app/imports/api/practiceUsers/util.jsx` — `checkUserPermission`, `checkRolePermission`, `getPracticeUsersOfUser`, `getUsersOfPractice`.
- `app/imports/api/practiceUsers/methods.jsx` — `updateInfo`, `updateCommission`, `updateAgendaKeys`, `getPracticeUsers`, `updateMyAgendaKeys`.
- `app/imports/api/practiceUsers/server/publications.jsx` — `practiceUser` and `practiceUsers`.
- `app/imports/api/practiceUsers/server/hooks.js` — commission invoice rebuild on practiceUser update.
- `app/imports/api/practiceUsers/server/indexes.js` — `practiceId`, `userId`, `removed` indexes.
- `app/imports/api/patientFileUsers/patientFileUsers.jsx` — the **other** roles object (additive per-file layer; see "Design 1" above).
- `app/imports/api/patientFileUsers/util.jsx` — fall-through check function.
- `app/imports/api/practice/methods.jsx` — practice-level methods that enforce these permissions: `updatePractice`, `updateSettings`, `inviteUser`, `removeInvitation`, `removeUser`, `changeRole`, `makeOwner`, `findTherapistOfPractice`, `cancelSubscription`, `resumeSubscription`, `selectPlanForPractice`, `createSourceForInvoice`, etc.
- `app/imports/api/practice/server/util.tsx` — server implementation of `_changeRole`, `_removeUser`, `_addPractice`.
- `app/imports/lib/permissions/Permissions.jsx` — dispatcher.
- `app/imports/lib/permissions/PermissionValidatedMethod.jsx` — server-side method guard, subscription requirement.
- `app/imports/lib/permissions/PermissionRender.js` — client-side UI guard.
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx` — base class; wraps `super._execute` with method audit logging.
- `app/imports/startup/lib/bootstrap/permissions.jsx` — startup registration of the two whitelist checks.
- `app/imports/i18n/resources/client/nl.i18n.js` around line 972 — `practice.users.roles.*` labels.
