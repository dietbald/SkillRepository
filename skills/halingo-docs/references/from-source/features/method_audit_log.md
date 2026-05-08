# Method audit log

> **🪦 Intentionally disabled — confirmed by the product owner 2026-04-07.** Q22 of [`../open_questions.md`](../open_questions.md): "That was disabled as we do not want to log all those actions anymore." The earlier draft of this page framed the failures-only behaviour as a bug; that framing was wrong. The collection still exists for historical / failure-capture purposes, but the silence on successful calls is by design. Do **not** port to the mono repo as-is — if audit logging is needed there, design from scratch in the backend-stack. See [`../deprecation_list.md` #17](../deprecation_list.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none (infrastructure).

## What it is

A server-side log of Meteor method invocations that **fail**. Every method defined with `LoggedInValidatedMethod` wraps its `_execute` in a try/catch; on a thrown synchronous exception — or a rejected promise from an `async run()` — it inserts a row into the `method-logs` MongoDB collection capturing the method name, user id, start / end timestamps, duration, arguments (stringified) and the error stack. **Successful invocations are not logged — this is intentional, not a bug.**

The collection name "method audit log" is therefore misleading for compliance use; the more accurate description is **method error log**. A successful `events.create` or `patientFile.update` deliberately leaves no trace.

## Where it lives in the UI

N/A — this is pure infrastructure. Nothing in `app/imports/ui/**` or `app/imports/modules/**` reads or renders `method-logs`. There is no admin page, no publication, no method to query it. Access is direct MongoDB only.

## Data model

### `MethodLogger` collection — `app/imports/api/logger/logger.js`

```js
import Collection from "../collection";
export const MethodLogger = new Collection("method-logs");
```

**No schema is attached.** `logger.js` imports `SimpleSchema` but does not call `attachSchema`. Document shape is defined implicitly by the single insert site.

### Document shape — `app/imports/lib/permissions/LoggedInValidatedMethod.jsx:14-34`

```js
const start = new Date();

const logEnd = (extra) => {
    if (this.connection.isServer) {
        const end = new Date();

        if (extra) {
            MethodLogger.insert({
                userId: methodInvocation.userId,
                methodName: this.name,
                start,
                end: new Date(),
                duration: end.getTime() - start.getTime(),
                arguments: _.mapValues(args, (el) =>
                    el && Object.keys(el).length ? JSON.stringify(el) : el
                ),
                ...extra,
            });
        }
    }
};
```

Fields:

| Field | Type | Source |
|---|---|---|
| `userId` | Meteor id | `methodInvocation.userId` |
| `methodName` | String | `this.name` — the registered method name (e.g. `"events.create"`) |
| `start` | Date | Captured before `super._execute` is called |
| `end` | Date | Captured inside `logEnd` |
| `duration` | Number | `end - start` in milliseconds |
| `arguments` | Object | Each arg value JSON-stringified if it's a non-empty object, otherwise passed through. Note: this means primitives stay primitive but nested objects become strings — the log mixes types per arg. |
| `error` | String | `JSON.stringify(error.stack)` — the stack trace |
| `errorType` | String | `error.errorType || error.name` |

### Indexes — `app/imports/api/logger/server/indexes.js`

```js
Meteor.startup(function() {
    MethodLogger.rawCollection().createIndex({userId: 1});
    MethodLogger.rawCollection().createIndex({methodName: 1});
    MethodLogger.rawCollection().createIndex({createdAt: 1});
});
```

Three single-field indexes. The `createdAt` index is on a field that **does not exist** in the document — the insert uses `start` and `end`, not `createdAt`. The index is therefore empty for every document; bug or leftover from a schema change.

## Methods (Meteor)

None for querying. The "audit" side is the wrapper in `LoggedInValidatedMethod`, which every permission-checked method inherits from.

### `LoggedInValidatedMethod` in full — `app/imports/lib/permissions/LoggedInValidatedMethod.jsx`

```js
import { ValidatedMethod } from "meteor/mdg:validated-method";
import { MethodLogger } from "../../api/logger/logger";

export default class LoggedInValidatedMethod extends ValidatedMethod {
  constructor(params) { super(params); }

  _execute(methodInvocation, args) {
    if (!methodInvocation.userId) {
      throw new Meteor.Error("errors.user.notLoggedIn");
    }

    const start = new Date();

    const logEnd = (extra) => {
      if (this.connection.isServer) {
        const end = new Date();
        if (extra) {
          MethodLogger.insert({
            userId: methodInvocation.userId,
            methodName: this.name,
            start,
            end: new Date(),
            duration: end.getTime() - start.getTime(),
            arguments: _.mapValues(args, (el) => el && Object.keys(el).length ? JSON.stringify(el) : el),
            ...extra,
          });
        }
      }
    };

    try {
      const res = super._execute(methodInvocation, args);
      if (res instanceof Promise) {
        res.catch((error) => {
          logEnd({ error: JSON.stringify(error.stack), errorType: error.errorType || error.name });
          throw error;
        });
      }
      return res;
    } catch (error) {
      logEnd({ error: JSON.stringify(error.stack), errorType: error.errorType || error.name });
      throw error;
    }
  }
}
```

Key behaviours:

- **Only logs on failure.** `logEnd` writes only when called with `extra`, and `extra` is only passed from the two error-handling branches. A successful method call is invisible.
- **Server-only.** `if (this.connection.isServer)` — simulation / optimistic-UI failures on the client are not logged.
- **Login check.** Every method refuses execution if `methodInvocation.userId` is falsy, throwing `"errors.user.notLoggedIn"` *before* starting the timer.
- **Async promise branch** catches rejections on a `.catch` and re-throws. This means the caller still gets the rejection, and the log row is written asynchronously in the `.catch` handler.
- **Re-throws.** After logging, the original error is re-thrown so the caller still sees the failure.
- **`PermissionValidatedMethod`** (`app/imports/lib/permissions/PermissionValidatedMethod.jsx`) is a separate wrapper for permission-checked methods; its own logging interaction with `MethodLogger` is not examined here but nearly every user-facing method in Halingo is one of `LoggedInValidatedMethod`, `PermissionValidatedMethod`, or raw `Meteor.methods({...})`. Only `LoggedInValidatedMethod` is instrumented.

## What is **not** logged

- **Successful method calls.** A successful `events.create` with 100 events in the argument never touches `method-logs`.
- **Raw `Meteor.methods({...})` calls.** `app/imports/api/shared/methods.js:49-71` (`impersonateUser`) is defined via raw `Meteor.methods`, not `LoggedInValidatedMethod`, so it bypasses the audit log entirely. See `admin_impersonation.md`.
- **Errors thrown from simulation (client-side).**
- **Webhook handlers and REST endpoints** (Stripe webhook at `app/imports/api/subscriptions/server/webhooks.jsx` is a WebApp connectHandler, not a method).

## Publications

None. Nothing publishes `method-logs` to any client. No admin UI exists. The collection is queried out-of-band via MongoDB shell or BI tooling.

## User-visible behaviour

None. End users and practice admins have no awareness of the method audit log.

## Permissions

- **Writes**: only from inside `LoggedInValidatedMethod._execute`, which runs server-side after userId is verified. Clients cannot insert directly — the collection has no `allow` rules and the default Meteor deny is sufficient.
- **Reads**: none, in code.
- No cleanup job, no retention policy.

## Notable details

- **"Method audit log" is a misnomer** — it's an error log. Use it to diagnose production exceptions, not to reconstruct who did what.
- **The `createdAt` index is orphaned.** Every row lacks the field (documents use `start`); the index contains no entries and costs a small amount per insert. Either the insert should populate `createdAt` or the index should be dropped.
- **The `arguments` field mixes types.** Per-key: non-empty objects become JSON strings, primitives and empty objects pass through. Querying is awkward.
- **No size cap, no TTL, unbounded growth.** Over time the collection grows with every production exception. Operators must clean up manually.
- **`this.unblock()` is not called.** A method that throws synchronously while holding the method queue for a session still holds it until the throw propagates. Probably not a real problem but noted.
- **`clientErrors` and `method-logs` are two separate collections.** `clientErrors` captures errors caught in the client by user code; `method-logs` captures method execution errors caught by `LoggedInValidatedMethod`'s wrapper. They do not cross-reference each other.

## Use cases — inferred

- **Production debugging.** Operator sees a user report of "I clicked save and nothing happened" and greps `method-logs` for `methodName: "events.update"` around the reported time.
- **Stack trace archive.** Gives operations a record of exception stacks without having to tail the Meteor process logs.
- **Not compliance.** Without successful-call logging, it cannot serve as an access log for GDPR "who viewed what" purposes — patient file views, for example, leave no trace.

> ⚠️ Behaviour inferred from code; needs product validation — the gap between "audit log" (successful + failed) and "error log" (failed only) may be intentional for cost reasons. If compliance / GDPR needs a real access log, this isn't it.

## Helpdesk overlap

None. The helpdesk never mentions method-logs or any audit logging.

## Source files

- `app/imports/api/logger/logger.js` — collection definition (no schema)
- `app/imports/api/logger/server/index.js` — imports `./indexes`
- `app/imports/api/logger/server/indexes.js` — three startup indexes
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx` — the only writer
- `app/imports/lib/permissions/PermissionValidatedMethod.jsx` — extends the logged-in method (for permission-checked methods)
- `app/imports/api/shared/methods.js:49-71` — the one counter-example: `impersonateUser` uses raw `Meteor.methods` and bypasses this log
