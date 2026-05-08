# Payment reconciliation

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: not covered as a discrete topic. Mentioned in passing as "manually mark invoice paid". See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

"Payment reconciliation" in Halingo is **not a feature** so much as a side effect of `setState` mutations on the various invoice collections. Halingo does not store payment events as their own entities (no `payments` collection in the patient/insurance space, no transaction ledger), so reconciling a payment with an invoice is a one-step manual operation in the financial overview, with two automated paths layered on top:

1. **Manual mark-as-paid** — the user opens the invoice and changes its `state` dropdown to `paid` (and on derdebetaler invoices, separately changes `stateInsurance`). This is the dominant flow for patient and Verzamelstaat invoices.
2. **Stripe webhook reconciliation** — for SaaS invoices, the `invoice.payment_succeeded` webhook flips the `stripeInvoices` row to `PAID` server-side without user action.
3. **Stripe payment-intent reconciliation** — for one-off Bancontact payments of an open SaaS invoice, the `practice.invoices.pay` method creates a payment intent, the browser completes the flow against Stripe, and the older `source.chargeable` → `charge.succeeded` webhook chain (or the newer `payment_intent.succeeded` chain — see "Notable details") flips the row state.

There is **no** patient-facing payment portal. There is no Bancontact / Mollie / Payconiq integration on the patient invoice path. There are no transaction logs, no payment receipts, no partial-payment recording (the `partially_paid` state is a manual flag, not a derived state).

## Where it lives in the UI

| Surface | Path | What you do | Source |
|---|---|---|---|
| Single patient invoice page | `/financial/invoices/patient/:invoiceId` | Use the **State** dropdown to flip `open → unpaid → partially_paid → printed → mailed → paid` | `modules/invoices/patient/PatientInvoicePage.jsx:187-244` |
| Single patient invoice page | same | Use the **Status mutualiteit** dropdown to flip `stateInsurance` (only visible for `isThirdPayer && hasThirdPaid`) | `PatientInvoicePage.jsx:215-244` |
| Per-certificate state | invoice detail, in the certificates row | Use the per-certificate state pill via `MultipleCertificatesModal` or `CertificateState` | `modules/invoices/patient/list-view/CertificateState.jsx`, `MultipleCertificatesModal.jsx` |
| Single Verzamelstaat | `/financial/invoices/insurance/:invoiceId` | Use the **State** dropdown to flip `open → printed → paid` (not canceled) | `modules/invoices/insurance/InsuranceInvoicePage.jsx:111-128` |
| Single commission invoice row | `/financial` (commission tab) | Use the per-row dropdown to flip `open ↔ paid` | `modules/invoices/commission/CommissionBox.jsx:163-184` |
| SaaS pay-now page | `/practices/invoices/:id/payment` | Stripe Elements payment form | `modules/pages/practice-subscriptions/PracticeSubscriptionInvoicePaymentPage.jsx` |

There is no global "reconcile bank statement" page, no CSV import, no Bancontact CODA importer.

## The four reconciliation paths

### 1. Patient invoice — manual `setState`

The user picks `paid` from the state dropdown on the patient invoice page. The dropdown's `onChange` calls `setState.call({ invoiceId, state: "paid" })` (`PatientInvoicePage.jsx:200-205`). The method:

```js
// patientFileInvoices/methods.js:160-220 (paraphrased)
state.isPaid = state.state === InvoiceStates.PAID
  && (!invoice.isThirdPayer || invoice.getInsuranceState() === InvoiceInsuranceStates.PAID);
return PatientFileInvoices.update(invoiceId, { $set: state });
```

So `isPaid` (the aggregate flag used by listings, the open-bills widget, and the cancel guard) is **only true** when `state === PAID` *and either*:
- The invoice is not derdebetaler at all, OR
- The invoice is derdebetaler and the insurance side has also been marked paid (via `getInsuranceState()`).

For a derdebetaler invoice, the user therefore has to mark **both** the patient state (the remgeld portion) and the insurance state (the reimbursement portion) before `isPaid` becomes true.

The `partially_paid` state is a manual halfway flag — there is no per-event partial-payment tracking, no remaining-balance calculation. The user picks it when the patient has paid some but not all of the remgeld.

### 2. Insurance invoice — manual `setState` with cascade

Same flow on the Verzamelstaat side: the user picks `paid` from the dropdown, and `setState.call({ invoiceId, state: "paid" })` is called (`InsuranceInvoicePage.jsx:121`). The Verzamelstaat method (`insuranceInvoices/methods.js:65-110`) then **cascades the change down to every patient invoice** that fed certificates into this Verzamelstaat:

```js
// insuranceInvoices/methods.js:94-105
PatientFileInvoices.rawCollection().update(
  {},
  { $set: { "certificates.$[elem].insuranceInvoiceState": state } },
  { multi: true, arrayFilters: [{ "elem.insuranceInvoiceId": invoiceId }] }
);
```

This is the **only** way for a derdebetaler patient invoice's insurance side to become `paid` — the user does not (and cannot, in the normal flow) mark insurance state directly on the patient invoice; they mark it on the Verzamelstaat and the system propagates. After the cascade, the patient invoice's `getInsuranceState()` helper rolls up the worst-case state across all certificates, which is now `paid`. The next `setState` on the patient side checks this rollup to compute `isPaid`.

The dual path means a typical reconciliation for a derdebetaler invoice is:

1. Patient pays the remgeld → user opens the patient invoice → state `paid`. `isPaid` is **still false** because insurance is open.
2. Ziekenfonds pays the Verzamelstaat → user opens the Verzamelstaat → state `paid`. Cascade fires. The patient invoice's `getInsuranceState()` is now `paid`.
3. The patient invoice's `isPaid` becomes `true` only on the **next** `setState` call on the patient invoice, since `setState` is what re-computes the aggregate. The user therefore needs to re-touch the patient invoice's state dropdown (or trigger another mutation) to flip `isPaid`.

> ⚠️ This is a real reconciliation gap: the cascade updates `insuranceInvoiceState` on certificates but does **not** also recompute `isPaid` on the parent invoice. The result is that derdebetaler invoices can sit indefinitely with `state: paid, getInsuranceState(): paid, isPaid: false` until the user re-touches them. Verify with product whether this is intentional.

### 3. Commission — manual state flip

Commission state is flipped via the per-row dropdown that calls `updateState.call({ invoiceId, practiceId, status: "paid" })` (`CommissionBox.jsx:170-180`). There is no derived state, no underlying transaction, no propagation. Once the row is `paid`, it cannot be removed (`commissionInvoices/methods.js:221-223`) but can still be amount-edited and is still mutated by the event hooks if an underlying event is later edited (a known bug — see `./commission_invoices.md`).

### 4. SaaS Stripe webhook — automatic

This is the only **automated** reconciliation path in the system. It applies to `stripeInvoices` only.

`app/imports/api/payments/server/stripe.ts` registers a Stripe webhook event router. The relevant events:

| Stripe event | Handler | What it does |
|---|---|---|
| `invoice.created` | `_onInvoiceCreated` (`stripe.ts:154`) | `StripeInvoicesUtil.createInvoice(sub, inv, null, { state: PENDING })`. Also consumes a `Referrals.PAID` row by injecting a credit invoice item. |
| `invoice.payment_succeeded` | `_onInvoicePaymentSucceeded` (`stripe.ts:51`) | `StripeInvoicesUtil.createInvoice(sub, inv, null, { state: PAID })` (which is an `upsert`, so it updates the existing row). Notifies the practice owner via `Notifications.insert({ type: INFO, ... })`. Calls `PracticeUtil.handleReferralOnPay(sub.practiceId)` to flip a `REGISTERED` referral into `PAID`. |
| `invoice.payment_failed` | `_onInvoicePaymentFailed` (`stripe.ts:113`) | Sets `state: FAILED`. **Also resets the subscription** so the practice loses access immediately: `Subscriptions.update({ stripeId }, { $set: { trialEnd: null, periodEnd: now, activeUntil: now } })`. |
| `payment_intent.payment_failed` | `_onPaymentIntentFailed` (`stripe.ts:98`) | Writes `paymentStatus: { status: FAILED, reason }` to the invoice identified by `event.data.object.metadata.invoiceId`. |
| `source.chargeable` | `_onSourceChargeable` (`stripe.ts:228`) | Calls `PracticeUtil.chargeSource(source)` (legacy source path). |
| `charge.succeeded` | `_onChargeSucceeded` (`stripe.ts:234`) | Calls `PracticeUtil.setInvoiceStateFromCharge(charge)` which sets `state: PAID` and `paymentStatus: { status: SUCCESS }`. |

> ⚠️ The webhook router does **not** handle `payment_intent.succeeded`. This means a Bancontact payment via the new payment-intent path does not trigger the success branch of this router; instead, it flows through `source.chargeable` + `charge.succeeded` because the legacy `_chargeSource` path is what wires the actual `stripe.charges.create` call. This is consistent with the dual-stack noted in `./stripe_invoices.md`.

## The Bancontact / one-off charge path in detail

For an `OPEN` SaaS invoice (e.g. a failed recurring charge that the customer wants to retry), the flow is:

1. **User clicks Pay** on the open invoice in `/practices/subscription`. The page routes to `/practices/invoices/:id/payment`.
2. **`practice.invoices.pay`** Meteor method (`practice/methods.jsx:396`) calls `practicesUtil.createSourceForInvoice(invoice, this.userId)` which creates a Stripe payment intent:
   ```js
   stripe.paymentIntents.create({
     amount: Math.floor(invoice.getAmount()),
     currency: "eur",
     customer: practice.customerId,
     metadata: { invoiceId: invoice._id },
     payment_method_types: ["bancontact", "card"],
     payment_method_options: { bancontact: { preferred_language: "nl" } },
   })
   ```
   The `client_secret` is returned to the browser, the invoice row is updated with `sourceId: result.id, paymentStatus: {}`.
3. **Stripe Elements** in the browser collects the Bancontact details and confirms the payment intent against Stripe.
4. **Stripe webhooks fire**:
   - `payment_intent.payment_failed` → `paymentStatus: { status: FAILED, reason }` is set.
   - `charge.succeeded` → `_setInvoiceStateFromCharge` flips `state: PAID, paymentStatus: { status: SUCCESS }`.
5. **The practice page** polls (or reactively re-pulls via the `invoice` publication) and shows the new state.

The newer `paymentIntents` API and the older `sources` / `charges` API are partially co-mingled in the code: the *creation* path uses payment intents, but the *charge* path still uses `stripe.charges.create({ source })`. This is a known migration gap.

## What "open" / "unpaid" / "paid" actually mean

Across the four collections, the same words mean different things:

| Word | patientFileInvoices | insuranceInvoices | commissionInvoices | stripeInvoices |
|---|---|---|---|---|
| `open` | freshly created, not yet acted on | freshly created | freshly created | the row exists but no number assigned, awaiting Stripe `invoice.created` |
| `unpaid` | manually marked as "not paid" | n/a | n/a | n/a |
| `partially_paid` | manually marked | n/a | n/a | n/a |
| `printed` | invoice was printed (auto-set on print action) | Verzamelstaat was printed | n/a | n/a |
| `mailed` | invoice was emailed (auto-set on mailInvoice) | n/a | n/a | n/a |
| `paid` | manually marked | manually marked | manually marked | webhook-set |
| `pending` | n/a | n/a | n/a | invoice exists, waiting for payment attempt |
| `failed` | n/a | n/a | n/a | webhook-set on charge failure |
| `closed` | n/a | n/a | n/a | (defined but not used in code I read) |
| `canceled` (`isCanceled`) | soft-cancelled | soft-cancelled | n/a (rows are hard-removed) | n/a |
| `void` | rendered as "ONGELDIG" overlay (`InvoiceTemplate1.jsx:151-168`); **not set by any method** | n/a | n/a | n/a |

The `partially_paid` filter is in the patient invoice filters (`patientFileInvoices.js:185-191`) and shows up as a dropdown option, but the system has no notion of "remaining balance". The user can use it as a flag to remember "I got 30 EUR of the 50 EUR".

## Methods involved

| Method | Collection | Effect |
|---|---|---|
| `invoices.edit.state` | patientFileInvoices | Set `state` and/or `stateInsurance`, recompute `isPaid` |
| `invoices.certificate.edit.state` | patientFileInvoices | Set `certificates.$.state` for one bilan, recompute `isPaid` |
| `invoices.insurance.edit.state` | insuranceInvoices | Set `state`, cascade to all linked patient invoice certificates |
| `invoices.insurance.print` | insuranceInvoices | Set `state: PRINTED`, cascade |
| `invoices.print` | patientFileInvoices | Set `state: PRINTED` after browser print |
| `invoices.mail` | patientFileInvoices | Set `state: MAILED` after email send |
| `practice.commission.update.state` | commissionInvoices | Set `status: open` or `paid` |
| `practice.invoices.pay` | stripeInvoices | Create Stripe payment intent, update `sourceId` |
| (REST) `POST /api/invoice/stripe/:id/state` | stripeInvoices | External setter |

Plus the three Stripe webhook handlers in `payments/server/stripe.ts`.

## The earnings statistics view of payment

The `EarningsGraph` data set (computed by `getEarningStatisticsFor` → `_getEarningStatisticsFor` in `patientFileInvoices/server/util.js:477-610`) treats `paid` literally:

- **Revenue** (`result.revenue`) accumulates `event.price` for every event on every invoice plus all `administrationCost` plus all `event.price` for uninvoiced events. This is "money owed to me", not "money received".
- **Receipt** (`result.receipt`) only accumulates when the invoice is `state === PAID`. For derdebetaler invoices, the patient share counts when `state === PAID` and the insurance share counts when `getInsuranceState() === PAID` *separately*. So an invoice with the patient half paid but the insurance half open contributes `getAmountPatient() / 100` to the receipt (`server/util.js:529-536`).
- **Commission** is taken from `CommissionInvoices` as long as `date >= start && date < end`, regardless of `status`. So commission shown on the graph is "owed", not "paid".
- **kmCompensation** is added to revenue (and receipt only when paid).

This means the graph distinguishes "earned" from "received" but is bound to the same manual `state === PAID` flag — no real bank-side reconciliation.

## The open-bills widget

`OpenBillsWidget.jsx` and `OpenBillsWidgetContainer.jsx` show a single number on the main dashboard: the sum of "open" amount across all unpaid patient invoices for the user. The data comes from the `invoices.open.statistics` publication (`patientFileInvoices/server/publications.js:31-59`):

```js
// publications.js:42-55 (paraphrased)
Counts.publish(this, "invoices.open.statistics.sum", cursor, {
  countFromField(invoice) {
    let amount = 0;
    if (invoice.state !== InvoiceStates.PAID) {
      amount += invoice.getAmountPatient();
    }
    if (invoice.isThirdPayer && invoice.getInsuranceState() !== InvoiceInsuranceStates.PAID) {
      amount += invoice.getAmountInsurance();
    }
    return amount;
  },
});
```

So a derdebetaler invoice with the patient half paid but the insurance half open contributes only `getAmountInsurance()` to the open total — the patient share has been "received".

## Notable details

- **Halingo has no concept of a payment record.** A `paid` invoice records the *fact* of payment, not the *amount* received, the *date* of receipt, or the *method*. There is no audit trail of who flipped which invoice when.
- **The `partially_paid` state is manual only.** No subtraction, no remaining balance, no reminder of how much was actually received.
- **`mailInvoice` writes to the `emails` collection** (`patientFileInvoices/server/util.js:685-696`) with `type: PATIENT_INVOICE` or `PATIENT_INVOICE_REMINDER`. The `emails` collection has a `status` field (`SENT/BOUNCED/FAILED/UNKNOWN`) but I did not see a place in this billing module that updates that status — the integrations agent's email-delivery file should explain how the status gets resolved (likely by an SES or Mailgun webhook).
- **`practice.invoices.pay` is owner+admin only.** A regular practice member cannot retry a SaaS payment.
- **The Stripe webhook secret is in `Meteor.settings.stripe.key`** (`payments/server/stripe.ts:16`). The REST PDF/state endpoints use a separate secret in `Meteor.settings.rest.secret` (`stripeInvoices/server/rest.js:20, 70`).
- **Referral consumption happens at payment time.** When a SaaS invoice is paid, `_handleReferralOnPay` (`practice/server/util.tsx:383-423`) flips the referrer's `Referrals.REGISTERED` row to `PAID`, and on the *next* `invoice.created` event the referral is consumed by injecting a credit invoice item via `stripe.invoiceItems.create({ amount: -plan.price })` (`payments/server/stripe.ts:175-217`).
- **The reconciliation cascade is one-directional.** Cancelling a Verzamelstaat unsets `insuranceInvoiceId` and `insuranceInvoiceState` on every linked patient certificate, but does **not** roll back the parent patient invoice's `state` field if it had been manually marked paid.

## Helpdesk overlap

The Zendesk material instructs the user to "verander de status naar betaald" but does not document:
- The two-track patient/insurance state for derdebetaler invoices.
- The cascade from Verzamelstaat to patient invoice certificates.
- The aggregate `isPaid` derivation rule.
- The Stripe webhook reconciliation for SaaS invoices.

## Source files

- `app/imports/api/invoices/patientFileInvoices/methods.js:160-220` — `setState` (patient).
- `app/imports/api/invoices/patientFileInvoices/methods.js:222-286` — `setCertificateState` (per-certificate state).
- `app/imports/api/invoices/insuranceInvoices/methods.js:65-110` — `setState` with cascade (insurance).
- `app/imports/api/invoices/commissionInvoices/methods.js:191-204` — `updateState`.
- `app/imports/api/payments/server/stripe.ts` — Stripe webhook router.
- `app/imports/api/practice/methods.jsx:396-439` — `practice.invoices.pay`, `practice.invoices.check`.
- `app/imports/api/practice/server/util.tsx:226-351` — Stripe payment intent + legacy source/charge handlers.
- `app/imports/api/invoices/patientFileInvoices/server/util.js:477-610` — `_getEarningStatisticsFor`, the "earned vs received" logic.
- `app/imports/api/invoices/patientFileInvoices/server/publications.js:31-59` — open-bills widget data source.
- `app/imports/modules/invoices/patient/PatientInvoicePage.jsx:187-244` — patient state dropdown UI.
- `app/imports/modules/invoices/insurance/InsuranceInvoicePage.jsx:111-128` — insurance state dropdown UI.
- `app/imports/modules/invoices/commission/CommissionBox.jsx:163-184` — commission state dropdown UI.
