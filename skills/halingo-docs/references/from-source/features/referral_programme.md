# Referral programme (aanbrengbonus)

> **🟠 Confirmed bug pending fix:** the `referrals` and `referrals.invite` permissions are declared on the `owner` role but the methods are bare `LoggedInValidatedMethod` — any logged-in user can invite anyone and trigger the referral state machine. Confirmed by the product owner 2026-04-07 (Q5 of [`../open_questions.md`](../open_questions.md)): "should idd be scoped to practice owner". See [`../bugs_and_security_findings.md`](../bugs_and_security_findings.md). Also: the standalone `/referrals/` page (with empty `generateLink()` handler) is dead code — see [`../deprecation_list.md` #12](../deprecation_list.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered (see `../../full_documentation/general_getting_started.md` §referral / aanbrengbonus).

## What it is

The "aanbrengbonus" — Halingo's word-of-mouth bounty. An existing customer (the **referrer**) sends a personal invitation to a colleague. If the colleague registers, creates a practice, and pays a first SaaS invoice, the referrer earns one **free month** of subscription that is automatically applied to their next invoice.

The bounty is in the form of a negative-amount line item on the referrer's next subscription invoice — equal in value to the referrer's current plan price. There is no cap on the number of bonuses one user can earn, but only one bonus is consumed per invoice (referrals queue up in `PAID` state and are consumed one at a time as the referrer is invoiced).

The referral programme is implemented entirely on top of the existing user/practice/invoice machinery. There is no commission paid in cash; everything is settled through invoice line items.

## Where it lives in the UI

Two surfaces, plus the registration form's hidden field.

| Surface | Component | File:line |
|---|---|---|
| Standalone page at `/referrals/` (link in main nav) | `Referrals` (stub) → `ReferralsContainer` | `app/imports/modules/pages/referals/referrals.jsx:19`, `app/imports/modules/pages/referals/referrals.container.jsx:7` |
| Box on `/practices/subscription` page | `PracticeReferralBox` | `app/imports/modules/pages/practice-subscriptions/PracticeReferralBox.jsx:88` |
| Hidden referral_id / referral_user_id query params on `/register` | `RegisterPage.formGroup` | `app/imports/modules/authentication/pages/RegisterPage.jsx:42-43` |

> ⚠️ The standalone page at `/referrals/` is essentially **a stub**. `referrals.jsx` (`app/imports/modules/pages/referals/referrals.jsx`) is an 82-line `React.PureComponent` with hard-coded state (`isLoadingLink`, `link: null`, `isGeneratingLink`) and an empty `generateLink()` method body (line 33). The container `referrals.container.jsx` returns an empty `withTracker` object (line 8). The page renders a "REFERRALS" card with a "Generate link" button that does nothing. The actual functional referral UI is the `PracticeReferralBox` shown on the subscription page. Behaviour inferred from code; needs product validation.

The functional `PracticeReferralBox` shows:

- A "REFERRAL_BONUS" header.
- A "JOIN_WITH" button that opens the referrals modal.
- Three statistics tiles: amount already saved (€), free months left (queued PAID referrals), colleagues persuaded.
- The modal contains an email input + textarea + Send button (calls `referrals.invite`) and a copyable URL of the form `/register?referral_user_id={userId}&locale={locale}`.

## Data model

Collection: `referrals` · `app/imports/api/referrals/referrals.js:5`

Schema (`app/imports/api/referrals/referrals.js:26`):

| Field | Type | Notes |
|---|---|---|
| `createdAt` | Date | |
| `status` | String | One of `Referrals.states` (see below). |
| `email` | String, optional | The invited email address (when known — set on email-link sends and on `register` referral consumption). |
| `userId` | String (id), optional | The **referrer**'s user id. |
| `referredUserId` | String (id), optional | The **referred** user's user id, set once they register. |
| `amount` | Number, optional | The bonus amount in cents, set once `CONSUMED`. |
| `removed` / `removedAt` | soft delete | |

Public fields: everything except `removed` / `removedAt`.

Client-side insert/update/remove on `Referrals` is denied (`app/imports/api/referrals/referrals.js:7`).

### States

`Referrals.states` (`app/imports/api/referrals/referrals.js:19`):

| Constant | String value | Meaning |
|---|---|---|
| `INVITED` | `"INVITED"` | The referrer sent an email invite to a known address. The referred user has not yet registered. |
| `REGISTERED` | `"REGISTERED"` | The referred user has registered an account, citing this referral. They have not yet paid their first invoice. |
| `PAID` | `"PAID"` | The referred user's practice has paid its first SaaS invoice. The referrer is now eligible for a bonus on their next invoice but it has not been applied yet. |
| `CONSUMED` | `"CONSUMED"` | The bonus was applied as a negative line item on the referrer's next invoice. The `amount` field is populated. |

### State transitions

- `INVITED` → `REGISTERED` — when the referred user registers using `referral_id` in the query string (`app/imports/api/users/methods.jsx:88`).
- `REGISTERED` → `PAID` — when the referred user's practice pays its first SaaS invoice. Triggered from the `_handleReferralOnPay` server hook (`app/imports/api/practice/server/util.tsx:383`).
- `PAID` → `CONSUMED` — when the referrer's next subscription invoice is generated and consumes the queued referral (`app/imports/api/subscriptions/server/util.jsx:67-100`, `app/imports/api/subscriptions/server/invoiceCreator.jsx:163-194`, `app/imports/api/payments/server/stripe.ts:163-217`).

### Note: there are two ways into `REGISTERED`

1. **Email invite path:** referrer sends an invite email → an `INVITED` row is created → referred user registers with `referral_id` query param → row is updated from `INVITED` to `REGISTERED`.
2. **Direct link path:** referrer copies their unique URL `/register?referral_user_id={userId}&locale={locale}` → referred user registers with `referral_user_id` query param → no `INVITED` row exists, so a fresh row with `status: REGISTERED` is inserted.

The two paths use different query params: `referral_id` (the invitation row ID) versus `referral_user_id` (the referrer's user ID). Both are wired into `RegisterPage.formGroup` (`app/imports/modules/authentication/pages/RegisterPage.jsx:42-43`) and forwarded to `users.register`.

## Methods (Meteor)

Both methods are declared **twice**: once in `app/imports/api/referrals/methods.js` (the universal isomorphic version) and once in `app/imports/api/referrals/server/methods.js` (the server-only version with the email send).

### `referrals` · `app/imports/api/referrals/methods.js:6`

`LoggedInValidatedMethod`. No arguments.

Body: `Referrals.find({userId: this.userId}).fetch()` — returns every referral row owned by the current user.

This is a *method*, not a publication; the data is fetched once on `componentDidMount` of `PracticeReferralBox` (`app/imports/modules/pages/practice-subscriptions/PracticeReferralBox.jsx:104`) and the result is grouped by `status` to compute the three statistics tiles. The data is therefore not reactive — newly added referrals do not update the UI until the page is refreshed.

> ⚠️ The `referrals` permission constant is listed under `roles.owner.permissions` in `app/imports/api/practiceUsers/practiceUsers.jsx:76`, but the method itself is `LoggedInValidatedMethod`, **not** `PermissionValidatedMethod`. So the permission constant is decorative — any logged-in user can call `referrals`. Behaviour inferred from code; needs product validation.

### `referrals.invite` · `app/imports/api/referrals/server/methods.js:14`

`LoggedInValidatedMethod`. Schema:

```js
new SimpleSchema({
  email: { type: String },
  text: { type: String, optional: true }
})
```

Body (server-side, `app/imports/api/referrals/server/methods.js:21`):

```js
Util.sendReferralToEmail(this.userId, email, text);
```

The client-side stub at `app/imports/api/referrals/methods.js:14` has an empty `run() {}`. So the method is a no-op on the client and only fully implemented on the server.

`sendReferralToEmail` (`app/imports/api/referrals/server/util.jsx:8`):

1. Look up all `Referrals` rows for the target email.
2. If any of those rows are in a status other than `INVITED` (i.e. `REGISTERED`, `PAID`, or `CONSUMED`), return `false` — refuse to re-invite an already-converted email.
3. Look for an existing `INVITED` row from this same referrer to this same email. If one exists, reuse it; otherwise insert a new `INVITED` row with `{userId, email, status: INVITED}`.
4. Send the `ReferralInviteMail` to the email with `{body: text, referrerName: user.name(), url: Meteor.absoluteUrl('register?referral_id={id}&locale={locale}')}`.

So the same email can be `INVITED` by multiple distinct referrers (each gets their own row), but never re-invited by the same referrer if it has already converted.

Like `referrals`, the `referrals.invite` permission is listed on owner only but never enforced — any logged-in user can call it.

## Publications

There is **no** `Referrals.find().fetch()`-based publication. The data flows entirely via the `referrals` method.

## State machine in detail

### 1. INVITED — created

Two ways:

- **Email invite from PracticeReferralBox:** user opens the modal, types an email, clicks Send. `inviteUserByEmail.call({email, text})` → server `sendReferralToEmail` → `Referrals.insert({userId, email, status: INVITED})` → email sent with the invite URL.
- **Implicit:** never. The direct-link path never creates an `INVITED` row.

### 2. INVITED → REGISTERED

When the referred person clicks the email link, they land on `/register?referral_id={id}&locale={locale}`. `RegisterPage` reads this from the URL into the hidden form field `referralId` (`app/imports/modules/authentication/pages/RegisterPage.jsx:43`).

On submit, `users.register` runs (`app/imports/api/users/methods.jsx:65`). After the new user is created and terms accepted, the relevant block is at line 81:

```js
if (referralUserId && Meteor.users.find(referralUserId).count() > 0) {
  // direct-link path
  Referrals.insert({
    email,
    referredUserId: userId,
    userId: referralUserId,
    status: Referrals.states.REGISTERED
  });
} else if (referralId) {
  // email-invite path
  Referrals.update(
    { _id: referralId, status: Referrals.states.INVITED },
    {
      $set: {
        status: Referrals.states.REGISTERED,
        referredUserId: userId
      }
    }
  );
}
```

Notice: the email-invite path **only updates** if the row is still in `INVITED`. If somehow it has already moved on, the update is a no-op and the new user has no referral attached. This means a stale link from an old invitation that has already been converted (e.g. by re-sharing) will silently fail to attach.

Notice also: the direct-link path inserts a brand-new row with `status: REGISTERED` and the referred user's email — there is no `INVITED` step. The check `Meteor.users.find(referralUserId).count() > 0` is the only validation — any plausible Mongo ID for an existing user works.

### 3. REGISTERED → PAID

This transition happens **per practice**, not per user. When the referred user creates their first practice and pays its first SaaS invoice:

- `_handleReferralOnPay(practiceId)` (`app/imports/api/practice/server/util.tsx:383`) runs.
- It finds the practice's owner (i.e. the referred user, who is the `practice.userId`).
- It does an atomic `findOneAndUpdate` on `Referrals` for `{referredUserId: practice.userId, status: REGISTERED}` → set `{status: PAID}`. (lines 391–404)
- If a row was matched, it sends a `ReferralSuccessMail` to the **referrer** congratulating them (lines 406–422).

`_handleReferralOnPay` is called from two places:

- `_setInvoiceStateFromCharge` (`app/imports/api/practice/server/util.tsx:349`) — when a Bancontact charge succeeds for a SaaS invoice.
- `_onInvoicePaymentSucceeded` Stripe webhook handler (`app/imports/api/payments/server/stripe.ts:92`) — when a Stripe card payment succeeds for a SaaS invoice.

The `findOneAndUpdate` is atomic (`Meteor.wrapAsync(Referrals.rawCollection().findOneAndUpdate, Referrals.rawCollection())` at lines 387–390), so concurrent invoice payments do not double-trigger.

### 4. PAID → CONSUMED

When the referrer's next subscription invoice is generated, the system checks for queued PAID referrals owned by the referrer and applies one bonus.

There are **three** code paths that consume PAID referrals — one per subscription mode and one per code branch:

#### a. Bancontact / Halingo subscription invoice loop

`InvoiceCreator._createInvoiceAndCloseLast` (`app/imports/api/subscriptions/server/invoiceCreator.jsx:62`) is the cron-triggered function that closes the current subscription invoice and creates the next one.

Around line 163:

```js
const owner = PracticeUsers.findOne({
  practiceId: subscription.practiceId,
  role: roles.owner.id,
});

const referral = Referrals.findOne({
  userId: owner.userId,
  status: Referrals.states.PAID,
});

if (referral) {
  const amount = plan.price;

  items.push({
    type: "referral",
    plan: plan.name,
    amount: -amount,
    period: { start: ..., end: ... },
    description: "referral",
  });

  Referrals.update(referral._id, {
    $set: { amount, status: Referrals.states.CONSUMED }
  });
}
```

A negative line item equal to the plan price (in cents) is added to the now-closing invoice, and the referral row is flipped to `CONSUMED` with the `amount` recorded.

Then the invoice is closed (`STATES.PENDING`), the next month's open invoice is created, and an "INFO" notification is sent to the owner.

#### b. Stripe subscription start (when there is an existing PAID referral)

`_createStripeSubscriptionForPractice` (`app/imports/api/subscriptions/server/util.jsx:27`) — when the practice owner creates a new Stripe-backed subscription for a practice that has already used its trial.

Around line 60:

```js
if (practice.usedTrial) {
  const owner = PracticeUsers.findOne({ practiceId, role: PracticeUserRoles.owner.id });
  referral = Referrals.findOne({ userId: owner.userId, status: Referrals.states.PAID });

  if (referral) {
    const planHalingo = Plans.findOne({ name: plan });
    await stripe.invoiceItems.create({
      amount: -planHalingo.price,
      currency: "eur",
      customer: practice.customerId,
      description: "referral",
      metadata: { referralId: referral._id }
    }).then(() => {
      Referrals.update(referral._id, {
        $set: { amount: planHalingo.price, status: Referrals.states.CONSUMED }
      });
    });
  }
}
```

The bonus is applied as a Stripe invoice item linked to the customer's next invoice.

#### c. Stripe `invoice.created` webhook

`_onInvoiceCreated` (`app/imports/api/payments/server/stripe.ts:154`) — runs when Stripe creates a new invoice for a subscription.

Around line 162:

```js
const owner = PracticeUsers.findOne({ practiceId: sub.practiceId, role: PracticeUserRoles.owner.id });
const referral = Referrals.findOne({ userId: owner.userId, status: Referrals.states.PAID });
const currentInvoice = Invoices.findOne({ stripeId: inv.id });

if (referral && !currentInvoice) {
  const plan = Plans.findOne({ name: sub.newPlanAtEndOfPeriod || sub.type });
  stripe.invoiceItems.create({
    amount: -plan.price,
    currency: inv.currency,
    customer: inv.customer,
    description: "referral",
    metadata: { referralId: referral._id }
  }).then(() => {
    stripe.invoices.retrieve(inv.id, ...);
    Referrals.update(referral._id, { $set: { amount: plan.price, status: Referrals.states.CONSUMED }});
    StripeInvoicesUtil.createInvoice(sub, updatedInv, null, { referralId: referral._id, state: STATES.PENDING });
  });
}
```

So a brand-new Stripe-generated invoice picks up any queued PAID referral, applies a negative invoice item, and stamps the local mirror invoice with `referralId`.

> ⚠️ Both (b) and (c) only consume **one** referral per invoice. If the owner has multiple PAID referrals queued, the second one will be consumed on the next invoice in the same way. There is no batched application. Verified by reading code; behaviour matches the helpdesk's "1 free month per converted colleague" framing.

### Bonus amount math

The bonus is always equal to the **current** plan price (`plan.price`) at the moment the referrer is invoiced. So if the referrer signs up at €30/month, refers a colleague who pays, then upgrades to a €60/month plan, the bonus eventually applied is **€60**. Conversely, downgrading reduces the bonus value.

The amount is stored on `Referrals.amount` after consumption.

## User-visible behaviour

### Referrer (sending)

1. Open `/practices/subscription`. A box on the right shows the referral stats and a "JOIN_WITH" button.
2. Click "JOIN_WITH" — modal opens.
3. Either:
   - Type an email address and an optional message. Click Send. The recipient gets a `ReferralInviteMail` with a personalized link `/register?referral_id={id}&locale={locale}`.
   - Or copy the displayed direct URL `/register?referral_user_id={userId}&locale={locale}` and share it manually.
4. The "Free months left" tile shows how many `PAID` referrals are queued.
5. The "Already saved" tile shows the sum of `amount` across all `CONSUMED` referrals (in euros).
6. The "Colleagues persuaded" tile shows the count of referrals that have moved past `INVITED` and `REGISTERED` (i.e. PAID + CONSUMED).
7. There is **no** in-app way to revoke a sent referral, see who is in `INVITED` state, or retry a failed email send. The data exists in `Referrals` but the UI does not surface it.

### Referrer (receiving the bonus)

1. The referred colleague's first payment triggers `_handleReferralOnPay`. The referrer's row moves from `REGISTERED` to `PAID` and the referrer gets a `ReferralSuccessMail` ("congrats, your colleague signed up").
2. On the referrer's next subscription invoice (whether Bancontact or Stripe), a negative line item equal to the current plan price is appended. The referral row moves to `CONSUMED` and the `amount` is recorded.
3. The referrer's next invoice has a €0 (or near-zero) total.

### Referred (clicking a link)

1. The colleague clicks the personalized invite link. They land on `/register` with `referral_id` (or `referral_user_id`) in the URL.
2. They register normally — the referral metadata is sent along with `users.register`.
3. The referral is recorded in `REGISTERED` state on the server.
4. The new user is logged in, gets the welcome/verification email, and starts the normal practice creation flow.
5. When their practice is created and the first SaaS invoice is paid, the cascade fires (`_handleReferralOnPay`), the referrer is rewarded.

The referred user does not see anything in their UI indicating that they were referred — the referral data is not exposed to them.

## Permissions

- `referrals` and `referrals.invite` are listed in `roles.owner.permissions` only (`app/imports/api/practiceUsers/practiceUsers.jsx:76-77`), but **neither method actually checks the permission** — both are `LoggedInValidatedMethod`. So in practice **any logged-in user** can list and create referrals. The UI only renders the `PracticeReferralBox` on `/practices/subscription`, which any practice member can navigate to, so this is consistent with "everyone can refer".
- The `_handleReferralOnPay` cascade and the consumption hooks are server-side and do not check user permissions — they fire whenever a SaaS invoice is paid, regardless of who triggered the payment.

## Notable details

- **`referrals` is a method, not a publication** → the UI is not reactive to referral state changes. A user looking at `PracticeReferralBox` while their colleague pays will not see the "free months left" counter tick up until they refresh.
- **Two distinct registration query params** with different semantics: `referral_id` (the invitation row id, INVITED → REGISTERED update path) and `referral_user_id` (the referrer's user id, fresh insert path). Sharing a personal URL bypasses the INVITED state entirely.
- **Three independent code paths** consume PAID referrals — one for Bancontact loop, one for Stripe sub-creation, one for Stripe `invoice.created` webhook. Bug fixes need to be applied to all three.
- **Stale invitation links silently fail to attach** if they have already been converted (because the update selector requires `status: INVITED`).
- **No UI for managing pending referrals.** Cannot revoke, cannot resend.
- **Bonus amount is the current plan price**, not the plan price at the time of invitation. Plan changes between invite and payout shift the bonus value.
- **`Referrals.find` returns soft-deleted rows by default** unless filtered. The `referrals` method does not filter on `removed`. > ⚠️ Behaviour inferred from code; needs product validation.
- **The standalone `/referrals/` page is a stub.** It renders a "Generate link" button but the click handler is empty (`app/imports/modules/pages/referals/referrals.jsx:33`). The actual referral UI is the `PracticeReferralBox` on `/practices/subscription`. Either the page is half-built or the route was deprecated and forgotten.
- **`PracticeReferralBox.render` includes a stray "W" character on line 297** — probably a typo / unfinished translation. Cosmetic, but visible to users.
- **The success email goes to the referrer with `referredName: referred.name()`**, so the referrer sees the colleague's full name in their congratulations email.
- **No fraud / abuse checks.** A single user could create dozens of practices, each registered with a `referral_user_id` query param pointing back to themselves, and rack up free months. There is no IP, payment-method, or per-user uniqueness check.
- **Referral consumption uses an atomic Mongo `findOneAndUpdate`** for the REGISTERED → PAID transition, so concurrent practice payments don't double-promote a referral. The PAID → CONSUMED transitions are not atomic in the same way.

## Helpdesk overlap

- `full_documentation/general_getting_started.md` documents the aanbrengbonus at the user level: "share your link, get a free month per converted colleague".
- The "1 referral per invoice" pacing is not explained in the helpdesk.
- The "bonus = current plan price" rule is not explained.
- The two link formats (`referral_id` vs `referral_user_id`) are not differentiated.
- The dead `/referrals/` page is not mentioned anywhere.

## Source files

- `app/imports/api/referrals/referrals.js` — collection, `Referrals.states`, schema.
- `app/imports/api/referrals/methods.js` — isomorphic stubs (server stub of `inviteUserByEmail` is a no-op).
- `app/imports/api/referrals/server/methods.js` — server-side methods that actually call the email util.
- `app/imports/api/referrals/server/util.jsx` — `sendReferralToEmail`.
- `app/imports/api/users/methods.jsx:81-98` — referral row creation/transition during `users.register`.
- `app/imports/api/practice/server/util.tsx:383-423` — `_handleReferralOnPay`, REGISTERED → PAID atomic transition, success email.
- `app/imports/api/payments/server/stripe.ts:92` — `_onInvoicePaymentSucceeded` calls `handleReferralOnPay`.
- `app/imports/api/payments/server/stripe.ts:154` — `_onInvoiceCreated` consumes PAID referrals on Stripe invoices.
- `app/imports/api/subscriptions/server/util.jsx:60-101` — Stripe sub creation with referral consumption.
- `app/imports/api/subscriptions/server/invoiceCreator.jsx:163-194` — Bancontact loop with referral consumption.
- `app/imports/modules/pages/practice-subscriptions/PracticeReferralBox.jsx` — the functional UI on the subscription page.
- `app/imports/modules/pages/referals/referrals.jsx` — the stub `/referrals/` page.
- `app/imports/modules/pages/referals/referrals.container.jsx` — empty tracker container.
- `app/imports/startup/client/routes/referals.jsx` — `/referrals/` route.
- `app/imports/modules/authentication/pages/RegisterPage.jsx:42-43` — hidden referral form fields.
- `app/imports/lib/mails/mailTemplates/referrals/ReferralInviteMail.jsx` — invite email template.
- `app/imports/lib/mails/mailTemplates/referrals/ReferralSuccessMail.jsx` — success email template.
