# Admin impersonation

> **🔥 Scheduled for removal — confirmed by the product owner 2026-04-07.** Q23 of [`../open_questions.md`](../open_questions.md): "That should be removed". See [`../deprecation_list.md` #3](../deprecation_list.md). Until removal, the security warnings below still apply. Do **not** port to the mono repo.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none. **Security-sensitive — read carefully.**

## Verdict — does admin impersonation exist?

**Yes, the method exists in code; no, there is no UI calling it.**

A `Meteor.methods({ impersonateUser })` definition is present at `app/imports/api/shared/methods.js:49-71`. It is server-registered via `app/imports/api/shared/server/index.js`. A grep for callers (`Meteor\.call\(['"]impersonateUser['"]`, `impersonateUser\.call`, etc.) returns **zero matches outside the definition itself**. No React component, no other server module, no migration calls it. It is dormant code that operators can invoke from the Meteor shell or from a browser console with `Meteor.call('impersonateUser', '<userId>')`.

## What it is

A method that lets a user with the global Meteor role `"admin"` switch the current DDP connection to act as any other user. Implementation is a thin wrapper around Meteor's built-in `this.setUserId(...)`.

## Where it lives in the UI

**Nowhere.** No screen, no menu item, no admin panel, no debug toolbar. There is no user-facing path to invoke this method in the current Halingo build.

If an operator wants to use it, they have to:

- Open the browser dev tools while logged in as a global admin and run `Meteor.call('impersonateUser', '<targetUserId>')`, or
- Open the Meteor server shell and call it manually.

## Data model

None. The method does not write to any collection. It only mutates the in-memory DDP session via `this.setUserId(userId)`.

## The method in full — `app/imports/api/shared/methods.js:49-71`

```js
Meteor.methods({
    impersonateUser: function(userId) {
        if (!this.isSimulation) {
            if (!Meteor.userId()) {
                throw new Meteor.Error('impersonateUser.unauthorized',
                    'Cannot impersonate user if not connected');
            }

            const user = Meteor.users.findOne(Meteor.userId());
            if (!user.roles || user.roles.indexOf('admin') === -1) {
                throw new Meteor.Error('impersonateUser.unauthorized',
                    'Unauthorized to impersonate user');
            }

            if (Meteor.users.find({_id: userId}, {limit: 1}).count() === 0) {
                throw new Meteor.Error('impersonateUser.userDoesntExist',
                    'Cannot impersonate user that does not exist');
            }

            this.setUserId(userId);
        }
    }
});
```

### Permission check, line by line

1. **Logged-in check** (`if (!Meteor.userId())`) — must be a logged-in caller. Throws `impersonateUser.unauthorized` "Cannot impersonate user if not connected".
2. **Admin role check** (`if (!user.roles || user.roles.indexOf('admin') === -1)`) — the calling user's `roles` array must contain the literal string `"admin"`. Throws `impersonateUser.unauthorized` "Unauthorized to impersonate user".
3. **Target exists check** (`Meteor.users.find({_id: userId}, {limit: 1}).count() === 0`) — refuses if no user with that id exists. Throws `impersonateUser.userDoesntExist`.
4. **Switch** — `this.setUserId(userId)` reassigns the userId on the current DDP connection. Subsequent method invocations on the same connection see `Meteor.userId() === userId`.

### Important details

- `user.roles` here is **the global Meteor.users `.roles` array**, not the per-practice `practiceUsers.role` ("owner" / "admin" / "lid"). The code does not use `alanning:roles` group scoping; it does a literal `.indexOf('admin')` on a top-level `roles` field of the user document. This is a separate concept from practice administration — operationally it means "Halingo platform admins" (presumably the developers / support staff at Halingo themselves), not "practice admins".
- The `'admin'` role is **not granted by any code path in this repository**. There is no `users.create.admin`, no migration that sets `roles: ['admin']`, no settings field that promotes a user. Operators set it manually in MongoDB: `db.users.update({_id: '...'}, {$set: {roles: ['admin']}})`.
- **Raw `Meteor.methods`, not `LoggedInValidatedMethod`.** The method is registered with `Meteor.methods({...})` directly. This means:
  - It does **not** go through `LoggedInValidatedMethod._execute`.
  - It is **not logged** in the `method-logs` collection (see `method_audit_log.md`) — even on failure.
  - It does **not** use `SimpleSchema` validation; the userId argument is consumed as a raw string with no shape checks.
- **No SimpleSchema validation on the target id**. A caller can pass any string. The existence check at step 3 catches typos, but there is no `regEx: SimpleSchema.RegEx.Id`.

## Methods (Meteor)

| Method | Name | Permission gate | Audit logged? |
|---|---|---|---|
| `impersonateUser` | `impersonateUser` | `Meteor.user().roles.indexOf('admin') !== -1` | **No** — bypasses `LoggedInValidatedMethod` |

## Publications

None.

## User-visible behaviour

Effectively none, since no UI invokes it. If an operator runs it from the browser console:

- All subsequent reactive subscriptions on the current connection will re-run as the target user.
- The page may not visibly refresh — Meteor's user tracker reactivity will push the new `Meteor.user()` into `useTracker` callers, which will re-render. Whether this is a clean re-render or a half-state depends on which page the operator is on at the time.
- There is **no banner**, **no warning** that "you are impersonating <user>". The screen will simply start showing the impersonated user's data.
- There is **no "stop impersonating" method**. To revert, the operator must log out and back in as themselves — `Meteor.logout()` then re-login.

## Permissions

- **Caller**: must have global `Meteor.users.roles` containing `"admin"`.
- **Target**: any existing user.
- **No scoping** — a global admin can impersonate any user across any practice.
- **No second factor**, no confirmation dialog, no time limit on the impersonation.

## Notable details — security review

- **No audit trail.** Because this method does not extend `LoggedInValidatedMethod`, the `method-logs` collection captures nothing — not the impersonation event, not who did it, not who they impersonated, not when. There is also no separate "audit log" collection. If an operator impersonates a practice owner to do something on their behalf, there is **no record** anywhere in MongoDB that this happened. The Meteor server stdout would show the method call if logging is enabled but production logs are usually time-bounded.
- **No reversibility.** No `unimpersonate` / `stopImpersonating` method. Logging out and back in is the only path back.
- **No "are you sure" guard.** The method takes a target id and runs.
- **No banner / visual indicator.** There is no UI surface for impersonation, so naturally there is no visual signal that you are impersonating someone. If someone copy-pasted the line into the console as part of a support call and forgot, they would not be reminded.
- **`'admin'` role is set out-of-band.** To grant impersonation rights, an operator has to write to `Meteor.users.roles` directly in MongoDB. There is no in-app way to grant or revoke this role. This is good (less attack surface) and bad (harder to track who has it).
- **Target user's session is unaffected.** Impersonation switches the *operator's* DDP session to act as the target — it does not invalidate or share the target's own session. The target may be logged in concurrently from another browser and won't notice.
- **Patient PII implications.** A successful impersonation gives the operator the same access as the impersonated user, which on a Halingo practice owner account is full access to every patient file, every invoice, every clinical report — direct PII exposure. This is the entire point of the method but the security implications must be made explicit in any operations procedure.
- **Token / session cookie not refreshed.** Meteor's accounts machinery uses login tokens stored in `Meteor.users.services.resume.loginTokens`. Calling `setUserId` does not touch those — it only changes the in-memory userId on the connection. Restarting the browser will revert. This bounds the blast radius slightly: if an operator impersonates and then closes the tab, the impersonation is gone.
- **Subscription replay.** After `setUserId`, Meteor tears down and replays all of the connection's publications. Patient publications, calendar publications etc. all rerun against the impersonated userId. This is fast but means in-flight method calls on the old userId may complete after the switch with stale userId references — the helper is not transactional.

> ⚠️ Behaviour inferred from code; needs product / security validation. The presence of an unaudited, no-confirmation impersonation method backed by a global role that is set manually in MongoDB is the kind of thing that should be on a security review checklist. Recommend either (a) wiring it through `LoggedInValidatedMethod` so it ends up in `method-logs`, (b) adding a dedicated audit collection that captures `{operatorId, impersonatedId, startedAt, endedAt}`, or (c) gating it behind a dedicated `Meteor.settings.allowImpersonation` flag that is off in production.

## Permissions documentation gap

Because the global `'admin'` role is invisible from the UI and not granted by any code path, there is no in-app or in-helpdesk concept of "Halingo platform admin". The role exists only as a string in a MongoDB array. Any future RBAC documentation needs to mention this separate role tier.

## Helpdesk overlap

None. The helpdesk has no concept of impersonation. Practice admins ("Beheerders") have role `"admin"` on their own `practiceUsers` document, but that is a different field on a different collection — they cannot impersonate. Only the global `Meteor.users.roles = ['admin']` flag enables it.

## Source files

- `app/imports/api/shared/methods.js:49-71` — the only definition
- `app/imports/api/shared/server/index.js` — registers the method server-side
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx` — the wrapper this method does **not** use
- (No callers — confirmed by grep across `app/imports/**` for `impersonateUser`)
