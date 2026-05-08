# Client error logging

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none (infrastructure). Verify against running app before promoting to `manual/`.

## What it is

A very small server-side sink for JavaScript exceptions caught on the client. When a React component or a user action in the Halingo UI throws, the client can call the Meteor method `errors.client.log` with the serialized error, a label, and an arbitrary context blob; the server inserts a row into the `clientErrors` collection with the current `userId` and a timestamp. There is no aggregation, no UI, no notification, no publication — it is a write-only audit sink consumed by direct MongoDB access.

## Where it lives in the UI

N/A — this is infrastructure. Nothing in `app/imports/ui/pages/**` renders or reads `clientErrors`. The only code that touches the collection is:

- The top-level React `ErrorBoundary` (`app/imports/ui/components/error-boundary/ErrorBoundary.jsx`).
- A handful of try/catch blocks inside specific patient-file components (see Call sites below).

## Data model — `app/imports/api/clientErrors/clientErrors.jsx`

```js
export const ClientErrors = new Collection("clientErrors");

ClientErrors.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});

ClientErrors.schema = new SimpleSchema({
    createdAt: { type: Date },
    error:     { type: Object, blackbox: true },
    name:      String,
    params:    { type: Object, blackbox: true },
    userId:    { type: String, regEx: SimpleSchema.RegEx.Id }
});
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `createdAt` | `Date` | Server-side timestamp. **Not set by the method** (see below) — the field is required but the insert never populates it. |
| `error` | blackbox `Object` | The exception object. Whatever the client passes — typically `{name, message, stack, ...}` from a caught `Error`, or `err.toJSON()`. |
| `name` | `String` | Human-readable label for where the error was caught, chosen by the caller (e.g. `"Error boundary"`, `"ProfilePageUserInformation.changeEmail"`). |
| `params` | blackbox `Object` | Arbitrary contextual data — usually the props / form values that were in play when the error happened. |
| `userId` | Meteor id | Set server-side to `this.userId` from the method invocation. |

Deny-all insert/update/remove — clients cannot write to the collection directly. Writes only go through the method.

> ⚠️ **Bug**: `clientErrors.schema` declares `createdAt` as a required `Date`, but the only insert path omits it (see below). Inserts should in principle fail SimpleSchema validation. They either work because the collection's automatic-type handling fills in something, or the collection has been defined without auto-validation on insert. Flagging for product / engineering.

## Methods (Meteor)

### `logClientError` — `app/imports/api/clientErrors/methods.js`

```js
import {ClientErrors} from "./clientErrors";
import LoggedInValidatedMethod from "../../lib/permissions/LoggedInValidatedMethod";

export const logClientError = new LoggedInValidatedMethod({
    name: 'errors.client.log',
    validate: ClientErrors.schema
        .omit('createdAt', 'userId')
        .validator(),
    permissions: [],
    run(params) {
        if(!this.isSimulation) {
            this.unblock();
            ClientErrors.insert({
                ...params,
                userId: this.userId
            });
        }
    }
});
```

- `validate` is the full `ClientErrors.schema` with `createdAt` and `userId` omitted — so the client passes `{error, name, params}` and the server adds the `userId`.
- `createdAt` is omitted from the inserted document. See bug note above.
- `this.unblock()` lets other method calls on the same connection run in parallel — error logging should not delay the user.
- Requires a logged-in user (it's a `LoggedInValidatedMethod`); no other permissions.
- Because it extends `LoggedInValidatedMethod`, every call also goes through the method audit logger (`method_audit_log.md`) — but only if it throws, which it almost never will.

## Publications

None. Nothing in `app/imports/**/publications*` mentions `ClientErrors`. Grepping the codebase for `ClientErrors.find` returns zero matches outside of `clientErrors.jsx` itself. The collection is **pure write-only** from the application's perspective. To inspect entries you need MongoDB shell / admin access.

## Call sites — who actually calls it

Grepping `logClientError` turns up eight call sites:

| File | Label (`name`) | Triggered by |
|---|---|---|
| `app/imports/ui/components/error-boundary/ErrorBoundary.jsx:16` | `"Error boundary"` | React `componentDidCatch` — any component crash inside the wrapped subtree |
| `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx:196` | *(see file)* | try/catch around a patient profile edit |
| `app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx:93` | *(see file)* | try/catch around a bilan edit |
| `app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx:172` | *(see file)* | try/catch around a treatment edit |
| `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:72` | `"ProfilePageUserInformation.changeEmail"` | try/catch around form submission for email change |
| …plus a couple of other site-specific try/catches |

The `ErrorBoundary` is the only *blanket* catcher — it is mounted near the app root and captures any uncaught render error from a child component. The other call sites are scattered and inconsistent; there is no global `window.onerror`, no `unhandledrejection` listener, no Meteor connection-error hook.

### Typical payload shape

From `ChangeEmailModal.jsx:72-80`:

```js
logClientError.call({
    error: e.toJSON(),
    name: 'ProfilePageUserInformation.changeEmail',
    params: {
        ...this.props,
        ...values
    }
});
```

From `ErrorBoundary.jsx:16-20`:

```js
logClientError.call({
    error: error,
    name: "Error boundary",
    params: info || {},
});
```

- `error` can be a raw JS `Error` (serialised by Meteor EJSON to `{}` — only stack / message survive if the caller pre-serialises) or the output of `err.toJSON()`.
- `params` can contain **anything**, including React props — which may include patient PII (names, file ids, etc.). No scrubbing is performed server-side.

## User-visible behaviour

None. The error-boundary fallback UI renders a translated title from `errorBoundary.title` (`ErrorBoundary.jsx:26-29`) but does not tell the user whether the error was reported. Scattered try/catches typically set form state with an error message; logging to the server is a silent side effect.

## Permissions

- Method requires `LoggedInValidatedMethod` — any logged-in user can log their own errors.
- No permission check for who can read `clientErrors` — there is no read method or publication.
- Direct collection access from the server or MongoDB shell only.

## Notable details

- **No retention policy, no TTL index.** The `clientErrors` collection grows forever. There is no maintenance migration or scheduled cleanup.
- **No rate limiting.** A misbehaving client could spam the method with thousands of calls; nothing throttles `errors.client.log`.
- **No alerting.** Nothing pages a human when a row is inserted. Operators must tail the collection manually.
- **PII risk.** Because `params` is a blackbox object and call sites pass `{...this.props, ...values}`, patient data can end up in `clientErrors`. Relevant for GDPR — flag for product.
- **The `createdAt` omission.** Rows are inserted without `createdAt`. This means forensic queries by time don't work unless MongoDB's `_id` ObjectId is used as a time proxy. Bug.
- **`LoggedInValidatedMethod` means errors in the error logger get logged by the method audit logger.** If `logClientError` itself throws, `LoggedInValidatedMethod._execute` writes a row to `method-logs` with the stack — a fallback sink.
- **No client-side batching.** Each call is a separate DDP method invocation.

## Helpdesk overlap

None. The helpdesk does not mention client-side error reporting. Users are not expected to be aware of it.

## Source files

- `app/imports/api/clientErrors/clientErrors.jsx` — collection + schema
- `app/imports/api/clientErrors/methods.js` — `logClientError`
- `app/imports/api/clientErrors/server/index.js` — imports `../methods` so the method is registered server-side
- `app/imports/ui/components/error-boundary/ErrorBoundary.jsx` — the catch-all caller
- `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx:196`
- `app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx:93`
- `app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx:172`
- `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:72`
