# Stripe (SaaS) invoices

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: not covered. The helpdesk treats SaaS billing as a black box ("you'll receive an invoice from Halingo"). See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

The `stripeInvoices` collection is **Halingo's own invoice to its praktijk customers** for SaaS subscription fees. It is the only one of the five invoice sub-modules that flows in the opposite direction of the others (Halingo → praktijk, not praktijk → patient/insurer/therapist). It is also the only one that is multi-currency, the only one with a globally sequential invoice number, and the only one that lives mostly outside the application's deny-all transactional API — most state changes come from Stripe webhooks.

This file documents the *patient-side* of the SaaS invoice surface only — the schema, the numbering scheme, the state transitions and the REST endpoint that renders a PDF. The full subscription lifecycle (plan change, payment-method change, trial, cancel, resume) is the identity / admin agent's territory and lives in `./saas_subscriptions.md`.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| Subscription overview (lists invoices) | `/practices/subscription` | `PracticeSubscription.page.jsx` | `modules/pages/practice-subscriptions/PracticeSubscription.page.jsx` |
| Pay an open SaaS invoice | `/practices/invoices/:id/payment` | `PracticeSubscriptionInvoicePaymentContainer` | `modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx` |
| PDF download (REST) | `GET /api/invoice/stripe/:id/pdf` (header `secret`) | n/a — server-side route | `app/imports/api/invoices/stripeInvoices/server/rest.js:12` |
| External state setter (REST) | `POST /api/invoice/stripe/:id/state` (header `secret`) | n/a | `rest.js:62` |
| Print template (HTML) | embedded into the PDF route | `StripeInvoicePrint` | `modules/invoices/stripe/StripeInvoicePrint.jsx` |

## Data model

### Custom collection class

Unlike the other four invoice collections, `stripeInvoices` uses a **subclass** of `Collection` called `StripeInvoiceCollection` (`stripeInvoices.jsx:7-59`) that hooks into `insert`, `upsert` and `update` to **auto-assign the next invoice number** the moment the row leaves the `OPEN` state for a non-zero amount. The number generation lives in `nextInvoiceNumber()`:

```js
// stripeInvoices.jsx:8-11
nextInvoiceNumber() {
  const last = this.findOne({}, { sort: { number: -1 }, limit: 1 });
  return (last ? last.number || 0 : 0) + 1;
}
```

This is a **single global counter** scoped to the entire `stripeInvoices` collection — there is no per-practice scope, no per-year reset. The mechanism:

```js
// stripeInvoices.jsx:13-22
insert(doc, cb) {
  const transDoc = this._transform(doc);
  doc.state !== STATES.OPEN
    && transDoc.getAmount()
    && !doc.number
    && (doc.number = this.nextInvoiceNumber());
  return super.insert(doc, cb);
}
```

The exact rule (insert path):
- If the inserted document's state is **anything other than `open`** AND `getAmount() > 0` AND `number` is not already set, assign the next sequential number.

The same rule applies on `upsert` (`stripeInvoices.jsx:24-40`) and `update` (`stripeInvoices.jsx:42-58`). On update there is also a special case:

```js
// stripeInvoices.jsx:52-54
if (newState && newState === STATES.PENDING && !doc.getAmount()) {
  _.set(modifier, "$set.state", STATES.PAID);
}
```

i.e. if you try to push an invoice to `PENDING` but its amount is `0`, the state is silently rewritten to `PAID`. This handles "free" months (e.g. consumed referral bonus).

### State enum

```js
// stripeInvoices.jsx:226-232
STATES = {
  OPEN:    "open",
  PAID:    "paid",
  PENDING: "pending",
  FAILED:  "failed",
  CLOSED:  "closed",
};
```

There is also a separate **payment** state enum (`stripeInvoices.jsx:74-80`):

```js
PAYMENT_STATES = {
  OPEN:     "open",
  PENDING:  "pending",
  CHARGING: "charging",
  FAILED:   "failed",
  SUCCESS:  "success",
};
```

The two enums are NOT the same. `STATES` is the lifecycle of the invoice itself (paid by the customer? open? closed?). `PAYMENT_STATES` is a sub-state of an in-flight payment attempt and lives inside `paymentStatus.status`. They are read by different helpers (`isPaid()` vs `isPaymentSuccess()` etc.).

### Schema (`stripeInvoices.jsx:90-129`)

| Field | Type | Notes |
|---|---|---|
| `number` | `Number` | Auto-assigned by the collection class. Globally sequential. |
| `practiceId` | `String` | |
| `practice` | `Object` | Snapshot: `{ address, companyNumber, name, vatInfo }` |
| `subscriptionId` | `String` | Foreign key to `subscriptions` |
| `stripeId` | `String` | Stripe's invoice ID (`in_xxx`) |
| `stripeInfo` | `Object` (blackbox) | Verbatim Stripe invoice payload at the moment of creation. Used by `isStripe()`. |
| `periodStart` | `Number` | Unix epoch ms — start of subscription period |
| `periodEnd` | `Number` | Unix epoch ms — end of subscription period |
| `invoiceItems` | `Array<InvoiceItem>` | Used when `stripeInfo` is absent. Each item: `{ type, amount, currency, period (blackbox), plan }`. |
| `state` | `String` | One of `STATES`. **Not enforced via `allowedValues`**. |
| `sourceId` | `String` | Stripe payment-source / payment-intent ID |
| `closed` | `Boolean` (optional, default `false`) | |
| `paid` | `Boolean` (optional, default `false`) | |
| `paymentStatus` | `Object` (optional) | `{ status, reason }` — both `Object` typed (loose) |
| `referralId` | `String` (optional) | Set when an `aanbrengbonus` was consumed for this invoice |
| `createdAt` | `Date` | |
| `taxPercent` | `Number` (default `0`) | Used for non-Stripe invoice paths |
| `removed` / `removedAt` | `Boolean` / `Date` | Soft-delete |

The `InvoiceItem` sub-schema (`stripeInvoices.jsx:82-88`):

```js
{
  type:     String,
  amount:   Number,
  currency: String,
  period:   { blackbox: true },   // start, end as Stripe period
  plan:     String,
}
```

### Helpers (`stripeInvoices.jsx:137-224`)

| Helper | Returns | Notes |
|---|---|---|
| `isActive()` | `Boolean` | `now is between periodStart and periodEnd` |
| `isPaid()` | `Boolean` | `getState() === PAID` |
| `isPaymentPending()` | `Boolean` | `paymentStatus.status` is `PENDING` or `CHARGING` |
| `isPaymentFailed()` | `Boolean` | `paymentStatus.status === FAILED` |
| `isPaymentSuccess()` | `Boolean` | `paymentStatus.status === SUCCESS` |
| `paymentReason()` | `String` | `paymentStatus.reason` |
| `getItems()` | `Array` | Stripe path: `stripeInfo.lines.data`. Manual path: `invoiceItems`. |
| `getAmount()` | `Number` | Alias for `getTotal()` |
| `getSubtotal()` | `Number` | Stripe: `stripeInfo.subtotal`. Manual: `sum(items.amount)`. |
| `getTotal()` | `Number` | Stripe: `stripeInfo.amount_due`. Manual: `subtotal * (100 + taxPercent) / 100`. |
| `getTax()` | `Number` | Stripe: `stripeInfo.tax`. Manual: `subtotal * taxPercent / 100`. |
| `getTaxPercent()` | `Number` | Stripe: `stripeInfo.tax_percent || 0`. Manual: `taxPercent`. |
| `getDate()` | `Date` | Stripe: `(stripeInfo.date || stripeInfo.created) * 1000`. Manual: `new Date(periodEnd)`. |
| `getState()` | `String` | `this.state` |
| `getNumber()` | `Number` | `this.number` |
| `isStripe()` | `Boolean` | `!!stripeInfo` — flips between the two computation paths above |
| `locale()` | `String` | Always returns `"nl"`. The Stripe invoice template is hardcoded NL. |

The `isStripe()` flag is the **branching pivot** for every getter: when `true`, every monetary value is read from `stripeInfo` (which contains Stripe's authoritative numbers in their currency). When `false`, the values come from the application-managed `invoiceItems` array and `taxPercent`. This dual-path design exists because Halingo migrated from a manual subscription billing model to Stripe in `migration-v33.js`.

## How rows are created

There is no `createInvoice` Meteor method on the client API. The collection is fed exclusively by **Stripe webhook handlers** in `app/imports/api/payments/server/stripe.ts` and the helper in `app/imports/api/invoices/payments/server/util.js`:

```js
// invoices/payments/server/util.js:5-25
const _createInvoice = function(subscription, stripeInfo, practice, invoiceData) {
  practice = practice || Practices.findOne(subscription.practiceId);
  const invoice = _.extend({
    practiceId: subscription.practiceId,
    practice: { address, companyNumber, name, vatInfo },
    subscriptionId: subscription._id,
    stripeInfo
  }, invoiceData);
  if (stripeInfo) {
    return Invoices.upsert({stripeId: stripeInfo.id}, {$set: invoice});
  } else {
    return Invoices.insert(invoice);
  }
};
```

This is called from three Stripe webhook event handlers in `payments/server/stripe.ts`:

| Stripe event | Halingo handler | Resulting state |
|---|---|---|
| `invoice.created` | `_onInvoiceCreated` (`stripe.ts:154`) | `state: PENDING` (`stripe.ts:222`); also handles consuming an unconsumed `Referrals.PAID` row by creating a Stripe `invoiceItems.create({ amount: -plan.price })` and re-fetching the invoice (`stripe.ts:175-217`). |
| `invoice.payment_succeeded` | `_onInvoicePaymentSucceeded` (`stripe.ts:51`) | `state: PAID` (`stripe.ts:68-70`); also notifies the practice owner and runs `PracticeUtil.handleReferralOnPay(sub.practiceId)` to flip a `REGISTERED` referral into `PAID`. |
| `invoice.payment_failed` | `_onInvoicePaymentFailed` (`stripe.ts:113`) | `state: FAILED` (`stripe.ts:130-132`); also resets `subscriptions.{trialEnd, periodEnd, activeUntil}` to "now" so the practice loses access immediately. |

There's also `payment_intent.payment_failed` (`stripe.ts:98-110`) which writes `paymentStatus.{status: FAILED, reason}` directly to the row identified by `event.data.object.metadata.invoiceId` (set when the payment intent was originally created via `practice.invoices.pay`).

## The Bancontact / one-off pay path

Halingo supports a **manual pay-now** flow alongside the recurring Stripe subscription. This is for cases where a recurring charge fails and the customer wants to retry through Bancontact. The pieces:

### `practice.invoices.pay` (`createSourceForInvoice`, `practice/methods.jsx:396-418`)

Looks up the `stripeInvoices` row, refuses if `state === PAID`, then calls the practice util to create a Stripe payment intent:

```js
// practice/server/util.tsx:226-275 (paraphrased)
stripe.paymentIntents.create({
  amount: Math.floor(invoice.getAmount()),
  currency: "eur",
  customer: practice.customerId,
  metadata: { invoiceId: invoice._id },
  payment_method_types: ["bancontact", "card"],
  payment_method_options: { bancontact: { preferred_language: "nl" } },
}).then((result) => {
  Invoices.update(invoice._id, { $set: { sourceId: result.id, paymentStatus: {} } });
  return result.client_secret;
});
```

The method **returns the Stripe `client_secret`** to the client. The browser-side payment page then uses Stripe Elements to collect the Bancontact / card details against that client secret. On success, Stripe fires `payment_intent.succeeded` which is **not** parsed by the event router — instead, the older `source.chargeable` and `charge.succeeded` event handlers manage the legacy source-based flow. See:

- `_chargeSource` (`practice/server/util.tsx:285-329`) — wraps `stripe.charges.create({ source, ... })`.
- `_setInvoiceStateFromCharge` (`practice/server/util.tsx:332-351`) — flips the invoice state to `PAID` and `paymentStatus = { status: SUCCESS }`.

> ⚠️ This dual-stack (`paymentIntents` AND `sources`) is partially migrated. The newer `practice.invoices.pay` method uses payment intents, but `_chargeSource` still references `stripe.charges.create({ source: source.id })`. Verify the actual production payment flow before relying on either path.

### `practice.invoices.check` (`checkSourceForInvoice`, `practice/methods.jsx:420-439`)

Polls Stripe for the source state and triggers a charge if `chargeable`. This is the legacy path.

## Methods (Meteor)

Methods on the collection itself:

| Method | File | Purpose |
|---|---|---|
| `practice.invoices.pay` | `practice/methods.jsx:396` | Create Stripe payment intent for an open invoice; return client secret. |
| `practice.invoices.check` | `practice/methods.jsx:420` | Poll Stripe source state; fire a charge if chargeable. |

That's it. There are no `setState`, `cancel`, `mail`, or `print` Meteor methods for `stripeInvoices`. State mutations come from Stripe webhooks, the REST endpoint, or the legacy source-charge path.

## Publications

`app/imports/api/invoices/payments/server/publications.jsx`:

| Publication | Selector | Notes |
|---|---|---|
| `invoice` | `{ _id: invoiceId }`, requires `practice.invoices.view` permission | Single-document publication. |
| `pending_invoices` | `{ practiceId, state: "pending" }`, requires `practice.invoices.view` | Used by the subscription overview to show the "you have an open invoice" banner. |

## REST endpoints

`app/imports/api/invoices/stripeInvoices/server/rest.js`:

### `GET /api/invoice/stripe/:id/pdf`

- **Auth**: header `secret` must equal `Meteor.settings.rest.secret`. No user session.
- **Query**: `?isCredit=true` to render as a credit note.
- **Body**: PDF binary (`Content-Type: application/pdf`).
- Pulls the invoice, runs `Util.componentToStaticHtml(StripeInvoicePrint, { isCredit, invoice, style: { zoom: 0.55, width: '100%' } })`, then `pdf.create(html).toBuffer(...)`.
- Returns 404 if the invoice does not exist.

### `POST /api/invoice/stripe/:id/state`

- **Auth**: same `secret` header.
- **Body**: JSON `{ state: <string> }`.
- Updates the invoice state, including `invoiceItems` in the modifier so that the auto-state-rewrite-to-PAID-when-empty rule does not fire (`rest.js:97`).

These endpoints are the integration surface for an external admin tool (or for accounting automation) — they bypass the Meteor session entirely and authenticate against a shared secret in `Meteor.settings.rest.secret`.

## The print template

`app/imports/modules/invoices/stripe/StripeInvoicePrint.jsx` is the HTML used for the PDF (and presumably for in-app display). Notable behaviour:

- **Two hardcoded sender entities** (`StripeInvoicePrint.jsx:16-36`):
  - **Autopilot Pte Ltd** (Singapore) — used when `invoice.getTaxPercent() === 0` (i.e. zero VAT).
  - **Nifiq BV** (Heverlee, BE) — used when there is a VAT percent.
  
  > ⚠️ This is a hardcoded business decision: zero-VAT customers (likely non-EU or reverse-charge) get billed by the Singapore entity, EU customers get billed by the Belgian one. This is a major piece of business logic that lives only in this React component.
- **Recipient block** uses `practice.vatInfo` if set (parsed from a multi-line `address` string), otherwise falls back to the simple `practice.address` snapshot.
- **Items table** maps each `invoice.getItems()` entry through the i18n key `invoices.print.invoiceToClient.invoiceItems.<description>` if `description` is set, otherwise `invoices.print.invoiceToClient.plans.<plan.name>` for Stripe items or `<plan>` for manual items. Special items like `referral`, `SUBSCRIPTION_UPGRADE_PAYBACK`, `SUBSCRIPTION_UPGRADE_TO_PAY` have their own i18n keys (`i18n/resources/nl.i18n.js:60-64`).
- **Credit note rendering** flips an `amountMultiplier` to `-1` and prefixes every description with `translate("invoices.print.creditDescription") + ": "`.
- **Terms and conditions** at the bottom are a long Dutch boilerplate from `invoices.print.invoiceToClient.terms` (`nl.i18n.js:73-74`).

## User-visible behaviour

### State transitions

```
   created (webhook invoice.created) ─▶ pending
                                          │
                                          ├─▶ paid     (webhook invoice.payment_succeeded)
                                          │
                                          ├─▶ failed   (webhook invoice.payment_failed)
                                          │
                                          └─▶ paid     (manual payment intent → _setInvoiceStateFromCharge)
   
   amount = 0 → state silently coerced to "paid" on update
```

### What the customer sees

- The **subscription overview** (`/practices/subscription`) lists current and historical SaaS invoices. Each row shows date, plan, amount, state.
- A **pending banner** appears at the top of the subscription overview when there is at least one `pending_invoices` row, with a "Pay now" button that routes to `/practices/invoices/:id/payment` (`practice.jsx:114`).
- The pay-now page collects Bancontact details via Stripe Elements (the Stripe Elements integration is in `modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx`, not read in this pass).
- The customer can **download** the PDF via the REST endpoint (the URL is built into the page).
- There is **no in-app cancel button** for SaaS invoices. They cannot be voided from the customer side.

## Permissions

| Action | Permission |
|---|---|
| View SaaS invoice | `practice.invoices.view` (owner, admin) |
| Pay an open SaaS invoice | `practice.invoices.pay` (owner, admin) |
| (REST) Download PDF | shared `Meteor.settings.rest.secret` |
| (REST) Set state | shared `Meteor.settings.rest.secret` |

A *lid* (default role) cannot see SaaS billing at all.

## Notable details

- **The number is global, not per-practice.** Practice A's invoice 5 is followed by Practice B's invoice 6. This is consistent with Halingo billing as the seller in all cases.
- **The number is only assigned at "leaving open" time.** A row that is inserted in `OPEN` state with a non-zero amount does not yet have a number; it gets one the moment its state changes to `pending`/`paid`/`failed`. Open invoices in the collection literally have no `number` field.
- **A 0-amount row never gets a number** and is silently auto-PAID on any update that would have moved it to `pending`.
- **Currency is per-item.** The `InvoiceItem.currency` field is a string and the print template formats each row in its own currency. Actual production data appears to be entirely EUR.
- **`practice.customerId`** (`practices.jsx:58`) is the Stripe customer ID. It's how Halingo finds the right Stripe customer to attach a payment intent to. This field is not in `publicFields` and is admin-only.
- **The PDF endpoint hardcodes `zoom: 0.55, width: '100%'`** and runs through `html-pdf` (Phantom-based). The `StripeInvoicePrint` template uses absolute positioning extensively, so the `zoom` is the alignment lever.
- **Migration v33** (`migrations/migration-v33.js`, `subs-to-new-stripe.ts`) was the cutover from a manual subscription billing model to Stripe's hosted subscriptions. Older rows in the collection may still have `invoiceItems` set with `stripeInfo` empty (the manual path).
- **The custom `StripeInvoiceCollection.update`** does NOT honor the second argument's modifier shape strictly — if you call `update(selector, { state: "paid" })` instead of `update(selector, { $set: { state: "paid" } })`, the auto-numbering logic in `_.get(modifier, "$set.state")` will silently see no state change. The REST `/state` endpoint correctly uses `$set` (`rest.js:96`).
- **No mail dispatch.** Halingo does not send the SaaS invoice as an email attachment from this code path (Stripe likely sends its own customer email through Stripe's billing settings).

## Helpdesk overlap

None — the helpdesk does not document SaaS billing internals.

## Source files

- `app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx` — schema, custom collection class, helpers, state enums.
- `app/imports/api/invoices/stripeInvoices/server/rest.js` — REST endpoints.
- `app/imports/api/invoices/payments/server/util.js` — `StripeInvoicesUtil.createInvoice` (called from webhook handlers).
- `app/imports/api/invoices/payments/server/publications.jsx` — `invoice` and `pending_invoices`.
- `app/imports/api/payments/server/stripe.ts` — webhook event router (subscription updates, invoice events, source/charge events, payment intent events).
- `app/imports/api/practice/methods.jsx:396-439` — `practice.invoices.pay`, `practice.invoices.check`.
- `app/imports/api/practice/server/util.tsx:226-351` — `_createSourceForInvoice`, `_chargeSource`, `_setInvoiceStateFromCharge`, `_handleReferralOnPay`.
- `app/imports/modules/invoices/stripe/StripeInvoicePrint.jsx` — print template.
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscription.page.jsx`
- `app/imports/modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx`
- `app/imports/migrations/migration-v33.js` — Stripe migration.
- `app/imports/migrations/subs-to-new-stripe.ts`
