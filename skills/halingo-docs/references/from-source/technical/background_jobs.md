# Background jobs

Reference for every scheduled / interval job in the application. Halingo uses a mix of `percolate:synced-cron` (the `SyncedCron` global) for one-shot scheduled jobs and bare `setInterval` for recurring polling.

The orchestration entry point is `app/imports/startup/server/background_runners.js`, which is one line:

```js
import "../../api/subscriptions/server/startup";
```

That single import bootstraps `SyncedCron` (`subscriptions/server/startup.jsx:21-25`):

```js
SyncedCron.config({ log: false, logger: () => {} });
SyncedCron.start();
```

Note that logging is disabled — there is no audit trail of cron job executions in production.

## Per-subscription invoice job

**Location:** `app/imports/api/subscriptions/server/startup.jsx:6-26` plus `subscriptions/server/invoiceCreator.jsx:36-52`

On Meteor startup, an `observe()` is registered on every `Subscriptions` document with `status: "ACTIVE"` and `paymentInfo.type: "bancontact"`:

| Job name pattern | Schedule | What it does | Source |
|---|---|---|---|
| `subscription_<subscriptionId>` | One-shot, fires on `Date(lastInvoice.periodEnd)` | Closes the previous Stripe invoice with state `PENDING`, generates the next month's invoice, advances `subscription.periodEnd` and `activeUntil`, applies any pending plan/payment-method change, applies referral reductions, sends notification email, and re-schedules the next instance via `addJob`. | `subscriptions/server/invoiceCreator.jsx:36`, `:62` |

The handler is recursive: each invocation re-schedules itself for the new period end. If the date is already in the past on registration, it executes immediately rather than scheduling.

When a subscription is `removed` from the observed set, `_removeInvoiceJob` calls `SyncedCron.remove(...)` to deregister.

This is **the only Bancontact billing mechanism** in the codebase — Stripe-card subscriptions are billed automatically by Stripe itself via webhooks (`subscriptions/server/webhooks.jsx`).

## Per-treatment notification observers

**Locations:**

- `app/imports/api/treatments/server/TreatmentDateObserver.js:57`
- `app/imports/api/treatments/server/TreatmentSessionObserver.js:51`

These two observers are registered from the `Treatments.after.update` hook (`treatments/server/hooks.js:10-42`) and from the `Events.after.insert/update` hooks (`events/server/hooks.js:45-103`), debounced by 5000 ms.

### TreatmentDateObserver

| Job name pattern | Schedule | What it does | Source |
|---|---|---|---|
| `treatment_observer_<treatmentId>_date` | One-shot, fires `notifications.date` days before `bilan.end` | Inserts a `Notifications` document with body `patient.treatments.notifications.expiring.date` and the remaining days count. | `TreatmentDateObserver.js:57` |

The notification date is cached on the treatment as `notifications.dateScheduled` so that on Meteor restart the observer can be re-registered without recomputing.

### TreatmentSessionObserver

| Job name pattern | Schedule | What it does | Source |
|---|---|---|---|
| `treatment_observer_<treatmentId>_sessions` | One-shot, fires on the `end` time of the event that pushes `sessionsLeft` below `notifications.sessions` | Inserts a `Notifications` document with body `patient.treatments.notifications.expiring.sessions`, count = `notifications.sessions` (default 10). | `TreatmentSessionObserver.js:51` |

Both observers honour:

- `notifications.enabled` on the treatment (the entire mechanism is gated on this).
- `treatment.isActive() && !treatment.isIncomplete()`.
- The `DISABLE_TREATMENT_END_DATE_NOTIFICATIONS` / `DISABLE_TREATMENT_END_SESSION_NOTIFICATIONS` module-local flags, exposed via `disable()` / `enable()` on the observer object — used in tests but never called in production.

The `Practices.after.update` hook also re-registers these observers cascade when the practice-wide notification thresholds change (`practice/server/hooks.js:13-70`).

## Rosa pull interval

**Location:** `app/imports/api/practice/server/hooks.js:72-139`

Not a `SyncedCron` job — uses raw `setInterval`.

| Name | Schedule | What it does | Source |
|---|---|---|---|
| Rosa pull loop | Every 300000 ms (5 minutes) | For every `Practices` document with `rosaId` set, fetches the practice's users that have a valid `rosaIntegrations` token, then in parallel (with `pLimit(5)` concurrency cap) calls `RosaPatients.pullPatientsForUsers(...)` and `RosaEvents.pullEventsForUsers(...)`. Skipped entirely if `Meteor.settings.disableRosaSync` is truthy. Logs slow event syncs (>5000 ms). | `practice/server/hooks.js:73` |

This is the **only Rosa → Halingo pull mechanism** in the codebase. All other Rosa interactions are push-only (via the `RosaPatients.pushPatientsToRosa` / `RosaEvents.pushEventsToRosa` calls embedded in patient and event methods).

## Stripe webhook handler

Not a scheduled job — included here for completeness because it's part of the same billing pipeline.

**Location:** `app/imports/api/subscriptions/server/webhooks.jsx:18-45`

| Name | Trigger | What it does | Source |
|---|---|---|---|
| Stripe webhook listener | HTTP POST to `/api/webhooks/stripe` | Verifies `stripe-signature` header against `Meteor.settings.stripe.webhook`, then calls `EventParser.parseEvent(event)` (defined in `api/payments/server/stripe.js`) which dispatches on Stripe event type to update `Subscriptions` and `Invoices` collections. | `subscriptions/server/webhooks.jsx:18` |

## Other intervals (non-server)

For completeness — these are *not* scheduled jobs but are interval timers in the codebase:

| Location | Purpose |
|---|---|
| `app/imports/ui/components/providers/intervalDataProvider/IntervalDataProvider.jsx:57` | A client-side React component that polls a method on a configurable interval. Used by widgets that need periodic refresh. Not a server background job. |

## Summary

Five mechanisms run on the server in the background:

1. **`SyncedCron` global** — initialised once at startup (`subscriptions/server/startup.jsx:21`), logging disabled.
2. **One `subscription_*` cron job per active Bancontact subscription** — registered/removed reactively as `Subscriptions` documents come and go.
3. **One `treatment_observer_*_date` cron job per active treatment** with `notifications.enabled` and a valid bilan end date.
4. **One `treatment_observer_*_sessions` cron job per active treatment** with `notifications.enabled` and an upcoming "session N" event.
5. **One global 5-minute `setInterval`** for Rosa pull, polling all practices.

There are **no** other scheduled jobs in the codebase. Notable absences:

- No nightly cleanup of soft-deleted documents.
- No nightly e-mail digest (despite the `Emails` audit collection existing).
- No automated invoice-due-date reminder cron — `Emails` collection has only `PATIENT_INVOICE` and `PATIENT_INVOICE_REMINDER` types, but the `_REMINDER` flow is invoked manually from a method, not scheduled.
- No scheduled retention enforcement for GDPR purposes.
- No backup/export job.
