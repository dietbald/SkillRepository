# SaaS subscriptions

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered (see `../../full_documentation/general_getting_started.md` §plan/payment/cancel and the trial/aanbrengbonus references). Verify against running app before promoting to `manual/`.

## What it is

Halingo's per-practice SaaS billing layer. A subscription is owned by a **practice** (not by a user) and is the gate that allows the practice to use the bulk of the application's authenticated functionality. Each practice has at most one active subscription at a time and pays through one of two payment channels:

- **Bancontact** — invoice-on-period-end model. Halingo generates a monthly invoice; the user pays it manually via a Stripe-hosted Bancontact intent. Implemented as a "Halingo subscription" — managed entirely by Halingo's own job loop.
- **Card** — Stripe-managed recurring subscription. Stripe charges the saved card on schedule; webhooks keep the local mirror in sync.

A new practice gets a 30-day trial automatically (unless it has used one before). All plan changes and payment-method changes are deferred to the end of the current period — there is no immediate switching mid-period (with the exception of upgrades during a trial, which take effect immediately).

The owner role is the only role that can touch the subscription.

## Where it lives in the UI

Four routes under `/practices`. All require an active practice context (`requiresPractice: true`).

| Path | Name | Component | File:line |
|---|---|---|---|
| `/practices/subscription` | `practice.subscription` | `PracticeSubscriptionContainer` | `app/imports/startup/client/routes/practice.jsx:78` |
| `/practices/subscription/plan/change` | `practice.subscription.plan.change` | `PracticeSubscriptionPlanChangeContainer` | `app/imports/startup/client/routes/practice.jsx:89` |
| `/practices/subscription/payment/change` | `practice.subscription.payment.change` | `PracticeSubscriptionPaymentChangeContainer` | `app/imports/startup/client/routes/practice.jsx:101` |
| `/practices/invoices/:id/payment` | `practice.invoice.payment` | `PracticeSubscriptionInvoicePaymentContainer` | `app/imports/startup/client/routes/practice.jsx:114` |

UI composition:

- `PracticeSubscriptionPage` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscription.page.jsx:39` — overview box (plan name, renewal date, payment method, status), referral box, invoice list.
- `PracticeSubscriptionPlanChangePage` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionPlanChangePage.jsx:15` — plan grid + payment selector for newly-creating practices.
- `PracticeSubscriptionPaymentChangePage` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionPaymentChangePage.jsx:13` — payment method picker; loads current plan via `getPlan` method.
- `PracticeSubscriptionInvoicePaymentPage` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx:13` — animated check / cross while a Stripe payment is being processed; lives at `/practices/invoices/:id/payment` and is the redirect target after a Bancontact intent completes.
- `PracticeSubscriptionInvoiceBox` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoiceBox.jsx:22` — sortable table of all invoices for this practice.
- `PracticeSubscriptionInvoiceItem` · `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoiceItem.jsx` — single row, with download / pay actions.
- `PracticeReferralBox` · `app/imports/modules/pages/practice-subscriptions/PracticeReferralBox.jsx:88` — see `referral_programme.md`.
- `NewPracticePage` · `app/imports/ui/pages/practices/NewPracticePage.jsx:19` — the multi-step practice creation wizard, which is also where the *first* subscription is created. Uses the same `PlanSelect` and `PaymentSelect` components.

## Data model

Three collections together model the SaaS lifecycle.

### `subscriptions`

`app/imports/api/subscriptions/subscriptions.jsx:6`

```js
export const Subscriptions = new Collection("subscriptions");

Subscriptions.getDurations = () => ({
  LEEWAY: moment.duration(3, 'days'),
  SUBSCRIPTION: moment.duration(1, 'month'),
  TRIAL: moment.duration(30, 'days')
});
```

Schema (`app/imports/api/subscriptions/subscriptions.jsx:30`):

| Field | Type | Notes |
|---|---|---|
| `practiceId` | String | The owning practice. |
| `createdBy` | String, optional | The user who created the subscription. |
| `type` | String | The current plan name (e.g. `"halingo_solo"` — looked up by name in `Plans`). |
| `newPlanAtEndOfPeriod` | String, optional | If set, the plan to switch to at the end of the current period. |
| `cancelAtPeriodEnd` | Boolean, optional, default `false` | If true, the subscription will not renew. |
| `createdAt` | Date | |
| `start` | Number | Epoch ms — when the subscription first started. |
| `trialEnd` | Number, optional | Epoch ms — when the trial ends. |
| `periodStart` | Number | Epoch ms — start of the current billing period. |
| `periodEnd` | Number, optional | Epoch ms — end of the current billing period. |
| `stripeId` | String, optional | The Stripe subscription id, if this is a Stripe-managed subscription. |
| `activeUntil` | Number, optional | Epoch ms — `periodEnd + LEEWAY (3 days)` for active subs; `periodEnd` for cancelling subs. The "is this still functional" boundary. |
| `paymentInfo` | sub-doc | See below. |
| `status` | String | One of `"ACTIVE"`, `"TRIAL"`, `"CANCELLED"`. |
| `removed` / `removedAt` | soft delete | |

`paymentInfo` sub-schema:

| Field | Type | Notes |
|---|---|---|
| `type` | String | One of `"bancontact"`, `"card"`, `"none"`. `"none"` is the trial-only state. |
| `newTypeAtEndOfPeriod` | String, optional | One of `"bancontact"`, `"card"`. Pending payment-method change. |
| `repeatedAt` | String | One of `"monthly"`, `"yearly"`. |
| `startDate` | Date, optional | |
| `lastInvoiceDate` | Date, optional | |

Helpers (`app/imports/api/subscriptions/subscriptions.jsx:61`):

- `isActive()` — `!activeUntil || moment().isBefore(activeUntil)`.
- `isInPeriod()` — `moment().isBetween(periodStart, periodEnd)`.
- `getPaymentType()` — returns the **future** payment type if a change is pending, otherwise the current one.
- `getPlan()` — returns `newPlanAtEndOfPeriod || type`.
- `shouldBeCancelledOnStripe()` — `cancelAtPeriodEnd || newPlanAtEndOfPeriod || newTypeAtEndOfPeriod` — i.e. anything that requires the Stripe subscription to be torn down at period end.
- `canChangePayment()` — `status !== 'CANCELLED' && isActive() && !cancelAtPeriodEnd && periodEnd`.

### `plans`

`app/imports/api/payments/plans.jsx:5`

```js
export const Plans = new Collection("plans");
```

Schema:

| Field | Type | Notes |
|---|---|---|
| `name` | String | Plan key (e.g. `"halingo_solo"`); used as the lookup key. |
| `price` | Number | Cents. |
| `currency` | String | Three-letter ISO. |
| `repeatType` | String | (`"monthly"` etc.) |
| `features` | Array of String | i18n keys for the marketing bullets. |
| `maxUsers` | Number | The user cap; `-1` means unlimited. |
| `highlight` | Boolean, optional | Marks the recommended plan in the picker. |
| `removed` / `removedAt` | soft delete | |

Public fields: `name, price, currency, repeatType, features, highlight` — `maxUsers` is **not** in `publicFields`. The cap is enforced server-side via the helper `canAddUsers(currentUsersCount)`:

```js
canAddUsers(currentUsersCount) {
  if (this.maxUsers === -1) return true;
  return currentUsersCount < this.maxUsers;
}
```

`canSelectByUserCount` is `<=` instead of `<` (`app/imports/api/payments/plans.jsx:46`) — used when *changing to* a plan with the current user count, while `canAddUsers` is used when *inviting* a new user.

The plan-name → Stripe-price-id mapping is configured outside the database, in `Meteor.settings.stripe.planNameToPriceId` (`app/imports/api/subscriptions/server/util.jsx:24`).

### `stripeInvoices` (the SaaS invoice mirror)

`app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx:60`

This collection mirrors Stripe invoices and also stores Bancontact-flow invoices generated locally. Both flows write into the same collection.

Key states (`app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx:226`):

```js
STATES = {
  OPEN: "open",
  PAID: "paid",
  PENDING: "pending",
  FAILED: "failed",
  CLOSED: "closed"
};
```

A simple state machine:

- `open` — the rolling preview invoice for the current subscription period.
- `pending` — the period has ended; the invoice is closed and waiting to be paid.
- `paid` — fully paid.
- `failed` — the payment attempt failed.
- `closed` — finalised but not actively dunning.

Plus a separate `paymentStatus` sub-document for in-flight Stripe payment intents:

```js
PAYMENT_STATES = { OPEN, PENDING, CHARGING, FAILED, SUCCESS };
```

Helpers `isPaymentPending()`, `isPaymentFailed()`, `isPaymentSuccess()` (lines 145–157) are used by `PracticeSubscriptionInvoicePaymentPage` to render the loading / check / cross icon.

The collection has custom `insert`, `upsert`, and `update` methods that auto-assign sequential `number` values when an invoice transitions out of `OPEN` and has a non-zero amount (lines 13–58). Numbers are computed by `nextInvoiceNumber()` which finds the largest existing number + 1. > ⚠️ This is not race-safe across concurrent inserts; needs product validation.

There is a special case in `update`: if a transition to `PENDING` is attempted on an invoice with zero amount (e.g. a referral fully cancelled out the subscription line), the state is **flipped to `PAID`** instead (line 53).

Invoice items are typed by an `InvoiceItem` schema with `type, amount, currency, period (blackbox), plan` fields. Helpers compute `getSubtotal`, `getTotal`, `getTax`, `getNumber`, `getDate`, `getItems` and handle the difference between Stripe-managed (`isStripe()`, fields under `stripeInfo`) and locally-generated invoices.

## The two flows

### A. Halingo (Bancontact) flow

The practice owner picks Bancontact at signup. Implementation in `_createHalingoSubscription` (`app/imports/api/subscriptions/server/util.jsx:188`):

1. Refuse if the practice already has a `STATES.PENDING` invoice (line 189).
2. Compute `trialEnd`: 30 days from now if `practice.usedTrial !== true`, otherwise `now`.
3. `_addCustomerIdToPractice` — create a Stripe customer for this practice and store the id, even though we are not going to use Stripe for charging this subscription.
4. Insert a `Subscriptions` row with `paymentInfo: {type: onlyTrial ? "none" : "bancontact", repeatedAt: "monthly"}`, `status: onlyTrial ? "TRIAL" : "ACTIVE"`, `periodStart: now`, `periodEnd: trialEnd`, `activeUntil: trialEnd + LEEWAY` (or `trialEnd` for trial-only).
5. If this is the first time using a trial: insert a paid trial-summary invoice with one item `{type: "trial", amount: 0, ...}` so the practice has at least one row in its invoice history.
6. Insert an open "preview" invoice for the current period (line 248).
7. Set `practice.usedTrial = true`.
8. Return `practiceId`.

After this, an observer set up at startup (`app/imports/api/subscriptions/server/startup.jsx:6-19`):

```js
Subscriptions.find({status: "ACTIVE", "paymentInfo.type": "bancontact"}).observe({
  added(doc) { InvoiceCreator.addInvoiceJob(doc); },
  removed(doc) { InvoiceCreator.removeInvoiceJob(doc); }
});
```

picks up the new subscription and creates a `SyncedCron` job named `subscription_{id}` (`app/imports/api/subscriptions/server/invoiceCreator.jsx:36`) scheduled to fire on the `lastInvoice.periodEnd` (which is the *current* invoice's period end). When the job fires (or if the date is already in the past), `_createInvoiceAndCloseLast` runs:

1. Bail if the current invoice is somehow still active.
2. If the subscription is still `ACTIVE` and not `cancelAtPeriodEnd` and no payment-type change is queued:
   a. If the previous invoice is still `PENDING` (i.e. the prior Bancontact charge was never paid), mark the subscription as `CANCELLED` and abort.
   b. Otherwise, push a `{type: "subscription", plan, period: {start, end}, amount: plan.price}` line item onto the closing invoice.
   c. Check for a `PAID` referral on the practice owner; if found, push a `{type: "referral", amount: -plan.price, ...}` line item and mark the referral `CONSUMED` (see `referral_programme.md`).
   d. Flip the closing invoice to `PENDING` (i.e. "ready to pay"), and stamp `referralId` if applicable.
   e. Bump the subscription's `periodStart`/`periodEnd`/`activeUntil` forward by one month.
   f. Create the next preview invoice in `OPEN` state.
   g. Send the invoice email (`SubscriptionUtil.sendInvoiceEmail`) — a generated PDF attached to a `InvoiceToClientMail`.
   h. Insert a `Notifications` row "new invoice" for the owner.
   i. Schedule the next cron job for the new period end.
3. If the subscription is *not* still active (cancellation in flight), and a payment-type change to `card` is queued, kick off the Stripe sub creation as the new flow, then cancel the current Halingo flow (`_cancelSubscription` in the same file). Otherwise, plain cancel.

The result is a monthly cycle: every month, a new `STATES.PENDING` invoice is generated and emailed; the owner is notified in-app; the owner pays it via the Bancontact flow; the practice continues.

### B. Stripe (card) flow

The practice owner picks Card at signup. Implementation in `_createStripeSubscriptionForPractice` (`app/imports/api/subscriptions/server/util.jsx:27`):

1. Refuse if the practice has a `STATES.PENDING` Halingo invoice.
2. `_addCustomerIdToPractice` — find or create the Stripe customer record and store `practice.customerId`.
3. Build a Stripe `paymentMethod` from the supplied `sourceId` (a `tok_xxx` from Stripe.js), attach it to the customer, and stash it as `default_payment_method` on the new subscription.
4. **Referral consumption shortcut:** if the practice already used its trial (i.e. this is a re-subscribe after cancel), look for a `PAID` referral on the owner. If one exists, create a Stripe invoice item with `amount: -plan.price` and metadata `{referralId}`, then flip the referral to `CONSUMED`. (lines 60–101)
5. Otherwise (first subscription), set `trial_end` on the Stripe subscription to 30 days from now.
6. Call `stripe.subscriptions.create(...)`.
7. On success, mirror into the local `Subscriptions` collection: `{practiceId, trialEnd: subscription.trial_end * 1000, periodStart, periodEnd, activeUntil: periodEnd + LEEWAY, paymentInfo: {type: "card", repeatedAt: "monthly"}, stripeId: subscription.id, status: "ACTIVE"}`.
8. Set `practice.usedTrial = true`.
9. Invoke the optional callback with the new subscription id.

From this point, Stripe drives the cycle. The Stripe webhook handler (`app/imports/api/subscriptions/server/webhooks.jsx:18`) at `/api/webhooks/stripe` parses incoming events, verifies the signature, and dispatches to handlers in `app/imports/api/payments/server/stripe.ts:18`:

| Stripe event | Handler | What it does |
|---|---|---|
| `customer.subscription.updated` | `_onSubscriptionUpdated` | `SubscriptionsUtil.updateSubscriptionFromStripe(subscription)` — copies `trial_end`, `current_period_start`, `current_period_end`, recomputes `activeUntil`. |
| `customer.subscription.deleted` | `_onSubscriptionDeleted` | Sets local `status: CANCELLED, activeUntil: now`. If `cancelAtPeriodEnd === false` and a payment-type or plan change is queued, creates a new subscription (Halingo or Stripe) for the queued config. |
| `invoice.payment_succeeded` | `_onInvoicePaymentSucceeded` | Updates local sub from Stripe, mirrors invoice to local `STATES.PAID`, sends paid notification, calls `_handleReferralOnPay` to convert REGISTERED → PAID for any referral pointing at this practice. |
| `invoice.payment_failed` | `_onInvoicePaymentFailed` | Pulls the period back to "now" (effectively expires the subscription), creates a `STATES.FAILED` local invoice, sends failed notification. |
| `invoice.created` | `_onInvoiceCreated` | If a local mirror does not exist yet, creates one. If the practice owner has a `PAID` referral, creates a Stripe invoice item to apply the discount, marks the referral CONSUMED. |
| `source.chargeable` | `_onSourceChargeable` | `PracticeUtil.chargeSource` — for Bancontact intents from the patient-payment side. |
| `charge.succeeded` | `_onChargeSucceeded` | `PracticeUtil.setInvoiceStateFromCharge` — flips the local invoice to PAID and triggers `_handleReferralOnPay`. |
| `payment_intent.payment_failed` | `_onPaymentIntentFailed` | Sets `paymentStatus: {status: FAILED, reason: ...}` on the local invoice. |

### C. Trial-only state (`paymentInfo.type === "none"`)

`_createHalingoSubscription` can be called with `onlyTrial = true` (`app/imports/api/practice/server/util.tsx:76`). This creates a subscription with `paymentInfo.type = "none"` and `status = "TRIAL"`. No invoice loop is set up (the startup observer filters on `type: bancontact`); the trial is a static window with `activeUntil = trialEnd`.

When the trial expires, the practice loses the `isActive()` boolean and methods declared `subscription: true` start throwing `NO_ACTIVE_SUB_FOR_PRACTICE`. The practice must come back to `/practices/subscription` and select a payment method, which routes through `_changePaymentMethodOfSubscription` (see below).

## Plan changes

`changePlanOfSubscription` method (`app/imports/api/subscriptions/methods.jsx:33`) is a `LoggedInValidatedMethod` that does its own permission check inside `run()`:

```js
if (practiceUsersUtil.checkUserPermission("practice.subscriptions.plan.change", this.userId, sub.practiceId)) {
  return subscriptionsUtil.changePlanOfSubscription(sub, plan);
}
```

Server util `_changePlanOfSubscription` (`app/imports/api/subscriptions/server/util.jsx:351`):

1. Compute the **target plan** from `Plans.findOne({name: plan})`.
2. Count active practice users **plus pending invitations** on the practice. Refuse with `errors.plan.limit.users` if `!planObject.canAddUsers(numberOfUsers + invitedUsers - 1)`.
3. Refuse with `subscription.plan.change.error / subscription.ended` if `periodEnd < now`.
4. If the target plan is the same as the current plan but `newPlanAtEndOfPeriod` is set (i.e. the user is *cancelling* a queued plan change), clear `newPlanAtEndOfPeriod` via `_resumeSubscription` and return.
5. **Stripe-managed sub:**
   - Upgrade or still-in-trial: `stripe.subscriptions.update` with `proration_behavior: "create_prorations"` (post-trial) or `"none"` (in trial). The change takes effect immediately.
   - Downgrade post-trial: `stripe.subscriptions.del(sub.stripeId, {at_period_end: true})` and locally `$set: {newPlanAtEndOfPeriod: plan}`. The downgrade is deferred to period end. The Stripe `customer.subscription.deleted` webhook will then re-create a new sub for the queued plan.
6. **Halingo-managed sub:**
   - Still in trial: just `$set: {type: plan}`.
   - Upgrade post-trial: compute prorated `payback` and `toPay` amounts based on time remaining in the period, push two new line items onto the still-open invoice (`-payback`, `+toPay`), and `$set: {type: plan}`. Effective immediately.
   - Downgrade post-trial: `$set: {newPlanAtEndOfPeriod: plan}` only. Deferred to period end.

So **upgrades are immediate (with proration); downgrades are deferred to period end**. Trial users can switch freely.

## Payment method changes

`changePaymentOfSubscription` method (`app/imports/api/subscriptions/methods.jsx:55`) — same permission-check-inside-run pattern.

Server util `_changePaymentMethodOfSubscription` (`app/imports/api/subscriptions/server/util.jsx:544`):

| From → To | Behaviour |
|---|---|
| `card` → `bancontact` | `_cancelStripeSubscription(sub, ...)` (set `cancel_at_period_end = true` on Stripe), then `$set: {paymentInfo.newTypeAtEndOfPeriod: "bancontact"}`. Deferred to period end; the `customer.subscription.deleted` webhook then creates a new Halingo subscription for the queued plan. |
| `bancontact` → `card` (with pending change) | If `bancontact` was set with a pending switch, just clear the pending switch by `$set: {paymentInfo.newTypeAtEndOfPeriod: null}`. |
| `none` (trial) → `bancontact` | `$set: {paymentInfo.type: "bancontact", status: "ACTIVE"}`. Immediate. |
| `none` (trial) → `card` | Create a new Stripe customer source from the supplied `sourceId`, set as `default_source`, then immediately `stripe.subscriptions.create` with `trial_end` carried over. Effective immediately. |
| `bancontact` → `card` | Attach the new card source to the Stripe customer, set as default; `$set: {paymentInfo.newTypeAtEndOfPeriod: "card"}`. Deferred to period end. |

So **payment method changes are deferred to period end** in the common (post-trial) case. Trial-only subscriptions can flip immediately.

## Cancellation

`cancelSubscription` method (`app/imports/api/practice/methods.jsx:318`) — `LoggedInValidatedMethod`. Permission `practice.subscriptions.cancel` (owner only). Calls `subscriptionsUtil.cancelSubscription(sub, this.userId)`.

Server util `_cancelSubscription` (`app/imports/api/subscriptions/server/util.jsx:263`):

1. Refuse if `periodEnd < now` (already ended).
2. If `stripeId` exists: `stripe.subscriptions.update(stripeId, {cancel_at_period_end: true})` → on success, locally update `cancelAtPeriodEnd: true`.
3. Otherwise: `$set: {cancelAtPeriodEnd: true}` on the local sub.

The subscription continues to function until `periodEnd`, then `_createInvoiceAndCloseLast` (Halingo) or the Stripe `customer.subscription.deleted` webhook (Stripe) terminates it.

## Resume

`resumeSubscription` method (`app/imports/api/practice/methods.jsx:342`). Permission `practice.subscriptions.resume` (owner only). Calls `subscriptionsUtil.resumeSubscription(sub, this.userId)`.

Server util `_resumeSubscription` (`app/imports/api/subscriptions/server/util.jsx:307`):

1. Refuse if `periodEnd < now`.
2. Build the update payload: `{cancelAtPeriodEnd: false}` plus any extra fields.
3. If `stripeId` exists and `!shouldBeCancelledOnStripe()`: `stripe.subscriptions.update(stripeId, {cancel_at_period_end: false})`.
4. Otherwise: local `$set` only.

The "Stay" button on the subscription overview page (visible only when `cancelAtPeriodEnd` is true) calls `resumeSubscription`.

## SaaS invoice payment flow

The owner clicks "Pay" on a `STATES.PENDING` Bancontact invoice. The flow:

1. `createSourceForInvoice` method (`app/imports/api/practice/methods.jsx:396`) — permission `practice.invoices.pay` (owner + admin).
2. Server `_createSourceForInvoice` (`app/imports/api/practice/server/util.tsx:226`):
   a. Refuse if invoice is already PAID.
   b. `stripe.paymentIntents.create({amount, currency: "eur", customer, metadata: {invoiceId}, payment_method_types: ["bancontact", "card"]})`.
   c. Store the resulting `paymentIntent.id` in the invoice's `sourceId`, clear `paymentStatus`.
   d. Return `client_secret` to the client (synchronously, via a `Future`).
3. Client uses `client_secret` with Stripe.js to confirm the payment intent (Bancontact UI hosted by Stripe).
4. After the user completes the bank flow, Stripe redirects back to `/practices/invoices/:id/payment` (or it gets there via the `paymentStatus` polling mechanism).
5. `PracticeSubscriptionInvoicePaymentPage` (`app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx:13`) renders a loading spinner, then a check or cross icon based on `invoice.isPaymentSuccess()` / `isPaymentFailed()`, then auto-redirects back to `/practices/subscription` after 5 seconds on success.
6. Server-side: `charge.succeeded` webhook → `_setInvoiceStateFromCharge` → flip invoice to `STATES.PAID`, `paymentStatus.status = SUCCESS`, then call `_handleReferralOnPay` (see `referral_programme.md`).

The page hardcodes a Stripe public key `"pk_test_j7PcdvEVLYI36yYz88UtfXRP"` (`PracticeSubscriptionInvoicePaymentPage.jsx:17`). > ⚠️ Test key embedded in production source. Needs product validation that this is replaced at build/deploy time.

## NewPracticePage — first subscription creation

`app/imports/ui/pages/practices/NewPracticePage.jsx:19` is the only place where a brand-new subscription is born from the UI. It's a 3-step wizard:

1. **Practice details** — name, address, contact, etc. Validated against `addPracticeSchema` from `app/imports/api/practice/methods.jsx:71`.
2. **Plan select** — `PlanSelect` shows the plans publication and lets the user pick one.
3. **Payment select** — `PaymentSelect` shows Bancontact / card options. There is also a "trial only" path (`onlyTrial`) where `payment.method === null`.

On submit, `addPractice.call({info, plan, payment})` runs (`app/imports/api/practice/methods.jsx:85`). The server `_addPractice` (`app/imports/api/practice/server/util.tsx:39`):

1. Insert the `Practices` row, with the user's locale defaulted into `settings.invoices.locale`.
2. Insert a `PracticeUsers` row with `role: owner` for the creating user.
3. Dispatch on `payment.method`:
   - `"bancontact"` → `SubscriptionUtil.createHalingoSubscription(plan, practiceId, userId)`.
   - `"card"` → `SubscriptionUtil.createStripeSubscriptionForPractice(plan, practiceId, payment.info.id, userId, ...)` — uses a `Future` to wait for the Stripe sub before returning the practice id.
   - `null` (no method, trial-only) → `SubscriptionUtil.createHalingoSubscription(plan, practiceId, userId, true)` (with `onlyTrial = true`).

After success, the wizard redirects to `practices` and writes the new `currentPracticeId` into local storage.

## Methods (Meteor) — summary

| Method | File:line | Permission | Subscription required? |
|---|---|---|---|
| `practice.subscriptions.cancel` | `app/imports/api/practice/methods.jsx:318` | `practice.subscriptions.cancel` (owner only) | No |
| `practice.subscriptions.resume` | `app/imports/api/practice/methods.jsx:342` | `practice.subscriptions.resume` (owner only) | No |
| `practice.subscriptions.select` | `app/imports/api/practice/methods.jsx:366` | reuses `practice.subscriptions.resume` (owner only) — see *Notable details* | No |
| `practice.subscriptions.plan.change` | `app/imports/api/subscriptions/methods.jsx:33` | `practice.subscriptions.plan.change` (owner only) | No |
| `practice.subscriptions.payment.change` | `app/imports/api/subscriptions/methods.jsx:55` | `practice.subscriptions.payment.change` (owner only) | No |
| `plans.get` | `app/imports/api/subscriptions/methods.jsx:21` | `LoggedInValidatedMethod` (no role check) | No |
| `practice.invoices.pay` (`createSourceForInvoice`) | `app/imports/api/practice/methods.jsx:396` | `practice.invoices.pay` (owner + admin) | No |
| `practice.invoices.check` (`checkSourceForInvoice`) | `app/imports/api/practice/methods.jsx:420` | `practice.invoices.pay` (owner + admin) | No |
| `practice.add` (`addPractice`) | `app/imports/api/practice/methods.jsx:85` | `LoggedInValidatedMethod` | No (no practice yet) |

Note that none of the subscription methods declare `subscription: true` — that would create a chicken-and-egg problem, since you cancel/select/change a subscription precisely when you may not currently have an active one. The permission checks are done inside `run()` instead.

## Publications

- `plans` · `app/imports/api/payments/server/publications.jsx:6` — all plans, no filter, public.
- `app/imports/api/subscriptions/server/publications.jsx` is **empty**. Subscriptions and stripeInvoices are not published from this module — there is presumably a publication elsewhere (likely `app/imports/api/practice/server/publications.jsx`) that exposes them as part of the practice context. > ⚠️ Not verified in this scout pass.

## User-visible behaviour

### First-time signup

1. User registers (with optional referral query param).
2. Lands on `/practices` with no practice. Clicks "Create practice".
3. `NewPracticePage` wizard: details → plan → payment.
4. Picks Bancontact / Card / Trial only.
5. Practice is inserted; subscription is created in the appropriate flow; first invoice exists in PAID/OPEN state.
6. Lands on `/practices/` with the new practice as current.

### Daily usage

The user can ignore the subscription module entirely until something prompts them: a renewal notification, an admin asking them to pay an invoice, or a desire to upgrade.

### Subscription overview page

Shows:

- **Subscription type** row with the plan name, plus a "Cancel" button (if `ACTIVE` and not already cancelling) and a "Change" / "Stay" / "Select" button. "Change" routes to the plan-change page; "Stay" calls `resumeSubscription`; "Select" appears when there is no active sub.
- **Renews on** / **Ends on** row with the period end date.
- **Payment method** row with a "Change" button (if `canChangePayment()`).
- **Status** row showing `ACTIVE` or `CANCELLED`.
- The **referral box** on the right (see `referral_programme.md`).
- The **invoice list** at the bottom (`PracticeSubscriptionInvoiceBox`).

### Plan change

`PracticeSubscriptionPlanChangePage` shows `PlanSelect` with the current plan highlighted and the queued `newPlanAtEndOfPeriod` (if any). Picking a different plan triggers `confirm("ARE_YOU_SURE")`, then `changePlanOfSubscription`. On success, redirect to `practice.subscription`.

If there is no active sub, `PaymentSelect` is shown after a plan is picked, and `selectPlanForPractice` is called instead.

### Payment method change

`PracticeSubscriptionPaymentChangePage` first calls `getPlan` to fetch the current plan details, then renders `PaymentSelect`. Picking a method triggers `confirm`, then `changePaymentOfSubscription`.

### Pay an invoice

The invoice list row has a "Pay" button when `STATES.PENDING`. Clicking it routes to `/practices/invoices/:id/payment` after a Stripe confirm card / Bancontact intent flow. The page polls until success or failure.

### Cancel

"Cancel" → confirm → `cancelSubscription` → the subscription is now in `cancelAtPeriodEnd: true`. The status row shows `CANCELLED`, the change button now reads "Stay". Clicking "Stay" calls `resumeSubscription`.

## Permissions

| Action | Permission constant | Roles |
|---|---|---|
| Cancel subscription | `practice.subscriptions.cancel` | owner |
| Resume subscription | `practice.subscriptions.resume` | owner |
| Change plan | `practice.subscriptions.plan.change` | owner |
| Change payment method | `practice.subscriptions.payment.change` | owner |
| Make owner (i.e. transfer subscription control) | `practice.user.makeOwner` | owner |
| View subscription invoices | `practice.invoices.view` | owner + admin |
| Pay invoice | `practice.invoices.pay` | owner + admin |

So **only the owner can change anything about the subscription itself** — admin can pay invoices and view them, but cannot cancel, change plans, or change payment methods. To change subscription control, the current owner must use `makeOwner` to transfer ownership; there is no concurrent multi-owner state.

## Notable details

- **`practice.subscriptions.select` reuses `practice.subscriptions.resume` for its permission check** (`app/imports/api/practice/methods.jsx:377`) — almost certainly a copy-paste oversight. The method should arguably check `practice.subscriptions.plan.change` or its own dedicated permission. Practically, both permissions are owner-only, so the effect is the same.
- **`practice.subscriptions.change` is declared on owner but never used.** No code path checks it. Vestigial.
- **`changePaymentOfSubscription` has `console.log("WTF")` left in the code** at `app/imports/api/subscriptions/methods.jsx:76`. Cosmetic, but visible in server logs.
- **Test Stripe public key embedded** in `PracticeSubscriptionInvoicePaymentPage.jsx:17`. Almost certainly meant to be replaced at deploy time.
- **The `subscriptions.publications.jsx` file is empty.** Subscriptions are presumably published as part of the practice context elsewhere.
- **`addInvoiceJob` only fires for Bancontact subs.** The startup observer filters on `paymentInfo.type === "bancontact"`, so Stripe-managed subs do not get a SyncedCron job (Stripe handles their cycle).
- **`activeUntil` includes a 3-day leeway** for active subs (`Subscriptions.getDurations().LEEWAY`). So a subscription that ended yesterday is still considered "active" for 3 more days, giving a grace window for payment to settle. Cancelled subs do not get the leeway (`activeUntil = periodEnd`).
- **Trial-only subs lack a "convert" UI flow that's documented.** The conversion happens implicitly when the user selects a payment method via `_changePaymentMethodOfSubscription` from `none` to `bancontact` or `card`.
- **Halingo-managed downgrades** during trial just `$set: {type: plan}` immediately. Post-trial Halingo downgrades wait for period end.
- **Halingo-managed upgrades** during trial just `$set: {type: plan}` immediately. Post-trial Halingo upgrades push proration line items onto the open invoice.
- **Stripe trial → paid transitions** are handled by Stripe; the local mirror is updated by `customer.subscription.updated` webhook events.
- **Plan user limit on plan change is asymmetric.** `_changePlanOfSubscription` does `!planObject.canAddUsers(numberOfUsers + invitedUsers - 1)` (`app/imports/api/subscriptions/server/util.jsx:367`), i.e. it does `currentUsers - 1 < maxUsers`, which is the same as `currentUsers <= maxUsers`. This means you can downgrade *to* a plan whose `maxUsers` exactly equals your current user count, but not beyond.
- **A pending invoice blocks new subscription creation.** Both `_createStripeSubscriptionForPractice` (line 28) and `_createHalingoSubscription` (line 189) refuse with `practice.subscription.start.error.pending_invoice` if any invoice for this practice is in `STATES.PENDING`. So the previous failed-to-pay subscription must be cleared first.
- **Stripe subscription deletion auto-creates a successor sub** if `cancelAtPeriodEnd === false` and a plan or payment-type change is queued (`_onSubscriptionDeleted`, `app/imports/api/payments/server/stripe.ts:25`). This is how deferred plan changes downstream work after Stripe acks the cancellation.
- **`Plans.publicFields` excludes `maxUsers`.** Clients comparing plans see prices and features but not user limits. The cap is enforced server-side.
- **Practice creation bypasses the subscription requirement.** `addPractice` is `LoggedInValidatedMethod`, not `PermissionValidatedMethod` with `subscription: true`. This is correct: there is no subscription yet.
- **Invoice number assignment is per-collection, not per-practice.** `nextInvoiceNumber()` looks at the highest `number` across the *entire* `stripeInvoices` collection. So invoice numbers are globally sequential.
- **Zero-amount PENDING invoices are auto-flipped to PAID** (line 53 of stripeInvoices.jsx). This is what makes the "referral fully cancels out the bill" case Just Work — the invoice exists for audit but is immediately considered paid.
- **The `lastInvoiceDate` field on `paymentInfo` is in the schema but never written by any code path** in the files searched. > ⚠️ Possibly historical or only set in migrations.
- **`CYCLED` is not a state.** Subscriptions go from TRIAL or ACTIVE to CANCELLED only.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` documents plan selection, payment method choice, the 30-day trial, the cancellation/stay flow, and the referral discount at user-facing level.
- The deferred-vs-immediate semantics of plan changes are not explained in the helpdesk.
- The 3-day leeway after period end is not documented.
- The fact that owner-only roles can change subscriptions is implicit in the helpdesk via the "praktijkverantwoordelijke" role.
- The Bancontact-vs-Stripe internal split is not mentioned in the helpdesk; the user just sees "Bancontact / Card".

## Source files

- `app/imports/api/subscriptions/subscriptions.jsx` — collection, schema, helpers, durations.
- `app/imports/api/subscriptions/util.jsx` — isomorphic shim, `getActiveSubscriptionOfPractice`.
- `app/imports/api/subscriptions/methods.jsx` — `getPlan`, `changePlanOfSubscription`, `changePaymentOfSubscription`.
- `app/imports/api/subscriptions/server/util.jsx` — `_createStripeSubscriptionForPractice`, `_createHalingoSubscription`, `_cancelSubscription`, `_resumeSubscription`, `_changePlanOfSubscription`, `_changePaymentMethodOfSubscription`, `_updateSubscriptionFromStripe`, `_isPlanUpgrade`, `_sendInvoiceEmail`.
- `app/imports/api/subscriptions/server/invoiceCreator.jsx` — Bancontact monthly cron loop and referral consumption.
- `app/imports/api/subscriptions/server/startup.jsx` — observer that adds/removes invoice jobs as subscriptions come and go.
- `app/imports/api/subscriptions/server/webhooks.jsx` — Stripe webhook endpoint at `/api/webhooks/stripe`, signature verification, dispatch into `EventParser`.
- `app/imports/api/subscriptions/server/publications.jsx` — empty (currently).
- `app/imports/api/payments/plans.jsx` — `Plans` collection, `canAddUsers`, `canSelectByUserCount`.
- `app/imports/api/payments/server/publications.jsx` — `plans` publication.
- `app/imports/api/payments/server/stripe.ts` — Stripe client setup, `EventParser`, all webhook handlers.
- `app/imports/api/practice/methods.jsx` — `addPractice`, `cancelSubscription`, `resumeSubscription`, `selectPlanForPractice`, `createSourceForInvoice`, `checkSourceForInvoice`.
- `app/imports/api/practice/server/util.tsx` — `_addPractice`, `_createSourceForInvoice`, `_checkSourceForInvoice`, `_chargeSource`, `_setInvoiceStateFromCharge`.
- `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx` — `Invoices` (alias `StripeInvoices`), `STATES`, `PAYMENT_STATES`, custom insert/update/upsert that auto-numbers and zero-amount-PENDING-flips-PAID.
- `app/imports/api/invoices/payments/server/util.js` — `StripeInvoicesUtil.createInvoice` (referenced throughout but not deeply read in this scout).
- `app/imports/startup/client/routes/practice.jsx:78-124` — the four subscription routes.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscription.page.jsx` — overview page.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscription.page.container.js` — overview tracker.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionPlanChangePage.jsx` — plan change page.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionPaymentChangePage.jsx` — payment method change page.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx` — invoice payment status page (animated icon, embedded Stripe public key).
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoiceBox.jsx` — sortable invoice table.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoiceItem.jsx` — single row.
- `app/imports/modules/pages/practice-subscriptions/PracticeReferralBox.jsx` — referral statistics box (see `referral_programme.md`).
- `app/imports/ui/pages/practices/NewPracticePage.jsx` — practice + subscription creation wizard.
- `app/imports/ui/components/payments/PlanSelect.jsx`, `PlanSelectContainer.jsx`, `PaymentSelect.jsx` — shared plan / payment UI components used by both signup and change flows.
