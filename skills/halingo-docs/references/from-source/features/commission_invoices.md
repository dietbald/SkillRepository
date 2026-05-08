# Commission invoices

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the helpdesk explains the three commission types (none / fixed amount / percentage) and that they are paid monthly. Not covered: per-disorder overrides via `specificAmounts`, the event-hook driven mutation of commission invoices, the `_cachedAmount` debouncer, the fact that commission invoices are *automatically* updated as events change. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

A commission invoice is the **monthly statement of money owed by a group practice (the *praktijkverantwoordelijke*) to one of its associated therapists (a *lid*)**. It is the practice's payroll record, expressed in the language of *commissie*.

Unlike patient and insurance invoices, commission invoices are not human-triggered for each event — they are **continuously rebuilt by the event create/update/remove hooks** so the open commission for the current month is always live. The "Genereer" button on the financial page is a fallback that walks all unprocessed events for all commissioned PracticeUsers and force-flushes the missing entries.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| Financial overview, "Commissie" tab | `/financial` | `CommissionBox` | `modules/invoices/commission/CommissionBox.jsx` |
| Single commission invoice | `/financial/invoices/commission/:invoiceId` | `CommissionInvoicePageContainer` | `modules/invoices/commission/CommissionInvoicePage.jsx` |
| Per-user commission setup | `/practices/users/:userId` | `PracticeUserPageContainer` | (practice users module — see `./practice_users.md`) |
| Print template | embedded into Print/Download actions | `CommissionInvoicePrint` | `modules/invoices/commission/CommissionInvoicePrint.jsx` |

The "Commissie" tab on the financial page only shows when the active therapist `hasToPayCommission`, has historical commission invoices, or the user has `practice.commission.view` (`FinancialPageTabs.jsx:75-83`).

The list-row inside `CommissionBox` (`CommissionBox.jsx:91-232`) presents one row per commission invoice with: avatar, user name, month/year, **editable amount**, commission type label (`Vast bedrag` or `<percentage>% commissie`), state dropdown, and a more-menu (download / print / remove). The amount field is editable inline via `EditCommissionPrice` for users with `practice.commission.update.amount`, but only while the row is in `OPEN` state.

## Data model

### Collection

`CommissionInvoices = new Collection("commissionInvoices")` (`commission.jsx:8`). Client `insert/update/remove` denied (`commission.jsx:35-39`).

### Enums

```js
// commission.jsx:9-18
CommissionStates = { OPEN: 'open', PAID: 'paid' };
CommissionTypes  = { NONE: 'none', FIXED_AMOUNT: 'fixedAmount', PERCENTAGE: 'percentage' };
```

The `NONE` type is implicitly the "no commission" state and is what `hasToPayCommission()` filters out (`practiceUsers.jsx:188-190`).

### `CommissionSchema` — the embedded commission rule (`commission.jsx:20-33`)

This is the *configuration* of how commission is computed for a practice user; it lives both inside `practiceUsers.commission` (the source of truth) and inside `commissionInvoices.commission` (a snapshot taken at invoice creation, so historical invoices keep their original rate even if the rate is later changed).

```js
CommissionSchema = new SimpleSchema({
  type:        { type: String, allowedValues: [none, fixedAmount, percentage], defaultValue: none },
  amount:      { type: Number, optional: true },          // for fixedAmount, in EUR (NOT cents — see _computeAmount)
  modifiedAt:  { type: Date, optional: true },             // last change date — used as the start cursor for generation
  percentage:  { type: Number, optional: true },           // for percentage, the general rate as a percent (e.g. 30)
  specificAmounts: { type: Array, optional: true },        // per-disorder overrides
  'specificAmounts.$': Object,
  'specificAmounts.$.id':     String,                       // the disorder code (a / b.1 / b.2 / ... / supplementaryInsurance)
  'specificAmounts.$.amount': String,                       // the override percentage as a STRING (parsed via _.toNumber)
});
```

The `specificAmounts` field is the **per-disorder override**: a practice can say "30% commission generally, but 50% on disorder b.1 (Afasie) and 25% on b.6.4 (Stotteren)". The shape is `[{ id: "b.1", amount: "50" }, { id: "b.6.4", amount: "25" }]`. Note that `amount` is typed as **String** in the schema and parsed at compute time.

### `CommissionInvoices.schema` (`commission.jsx:41-71`)

| Field | Type | Notes |
|---|---|---|
| `_cachedAmount` | `Number` (optional) | Memoised result of `_computeAmount(this)`, refreshed by the `before.insert` and `after.update` hooks (`server/hooks.js:10-34`). |
| `amount` | `Number` (optional) | When set, **overrides** `_cachedAmount` and skips computation. Settable by `practice.commission.update.amount`. Used to manually pin a commission to a specific value. |
| `commission` | `CommissionSchema` | Snapshot of the practice user's commission config at the time of invoice creation. |
| `createdAt` | `Date` | |
| `data` | `Array<Object>` (blackbox) | The list of contributing events: `{ eventId, treatmentType, amount, ...event.meta }`. The `amount` here is `event.getPrice()` (not the commission share). |
| `date` | `Date` | The first day of the month this commission invoice is for, e.g. `2026-04-01T00:00:00`. |
| `practiceId` | `String` (optional) | |
| `removed` / `removedAt` | `Boolean` / `Date` | Soft-delete |
| `status` | `String` | One of `CommissionStates` |
| `userId` | `String` | The therapist receiving the commission |
| `userName` | `String` | Snapshot |
| `userImage` | `String` | Snapshot |

### Filters and sort options

```js
// commission.jsx:79-88
filters = { paid: { status: PAID }, open: { status: OPEN } };
sortOptions = { date_asc, date_desc, name_asc, name_desc };
```

### Helpers (`commission.jsx:93-108`)

- `getAmount(useCache = true)` — returns `this.amount` if pinned, else `_cachedAmount` if available, else recomputes via `CommissionInvoicesUtil.computeAmount(this)` and caches.

## The compute function

`CommissionInvoicesUtil.computeAmount` lives in `app/imports/api/invoices/commissionInvoices/util.js:5-45` and is **isomorphic** (runs both client and server). It's the single source of truth for "how much commission does this row produce":

```js
// commissionInvoices/util.js (paraphrased)
function _computeAmount(commissionInvoice) {
  switch (commissionInvoice.commission.type) {
    case PERCENTAGE: {
      let result = 0;
      const events = [...(commissionInvoice.data || [])];
      // First pass — per-disorder overrides
      commissionInvoice.commission.specificAmounts?.forEach((sc) => {
        const percentage = (_.toNumber(sc.amount) || 0) / 100;
        let total = 0;
        _.remove(events, e => e.treatmentType === sc.id)
          .forEach(e => total += _.toNumber(e.amount));
        result += total * percentage;
      });
      // Second pass — remaining events at the general percentage
      const generalPct = (_.toNumber(commissionInvoice.commission.percentage) || 0) / 100;
      let total = 0;
      events.forEach(e => total += _.toNumber(e.amount));
      result += total * generalPct;
      return result;
    }
    case FIXED_AMOUNT:
      const amount = _.toNumber(commissionInvoice.commission.amount);
      return _.isFinite(amount) ? amount * 100 : amount;
    default:
      return 0;
  }
}
```

Key things to notice:
- **Per-disorder overrides take precedence.** Events whose `treatmentType` matches a `specificAmounts.id` are *removed* from the working list and computed at the override rate; remaining events fall through to the general percentage.
- **Fixed-amount type returns `amount * 100`** (i.e. it converts EUR to cents), but the percentage path returns the result of `eventPriceCents * percentageAsFraction` which is **already in cents** because `event.amount` was stored as `event.getPrice()` (in cents). The two return-paths therefore agree on the units (cents).
- The `_.toNumber` calls are defensive against the `specificAmounts.$.amount` being typed as String in the schema.

## Methods (Meteor)

All in `app/imports/api/invoices/commissionInvoices/methods.js`.

### `practice.commission.generate` (`generateCommissionInvoices`, `methods.js:17`)
The bulk-rebuild method. Walks every `PracticeUser` of the practice and, for each that has `hasToPayCommission()`:

1. **For `FIXED_AMOUNT` users**, walks every month from `commission.modifiedAt` (start of month) to today and ensures a `CommissionInvoices` row exists with `(date, practiceId, userId)`. If missing, inserts one with the snapshotted commission and `status: OPEN`. This means a fixed-amount commission produces a row even in months where the user did zero events (`methods.js:33-66`).
2. **For all commissioned users**, walks `CommissionInvoicesUtil.getUncomissionedEvents(practiceId, { start: { $gte: commission.modifiedAt }, userId })` (`server/util.js:11-22` — finds events whose `commissionInvoiceId` is null) and runs `_updateCommissionNewEvent(event, practiceUser)` per event (`server/util.js:24-96`).

Returns `{ success, error: { count, errors } }`. UI translates the errors with the i18n key carried inside each `e.error`.

Permission: built into the method name via `PermissionValidatedMethod` (`methods.js:17`).

### `invoices.commission.search` (`searchCommissionInvoices`, `methods.js:88`)
The CollectionSearch backend. The base filter is more complex than the other invoice searches (`methods.js:127-146`) — it requires `date < now` AND one of:

- `amount` is set (manually pinned), OR
- `commission.type === PERCENTAGE` AND `commission.percentage !== 0` AND there is at least one `data.amount` entry that is `> 0` or `< 0`, OR
- `commission.type === FIXED_AMOUNT` AND `commission.amount !== 0`.

This filters out empty / future / zero-rate rows from the result list even though they still exist in the collection.

### `practice.commission.update.amount` (`updateAmount`, `methods.js:180`)
Pins the commission `amount` field directly. The next `getAmount()` call will return this value instead of computing.

### `practice.commission.update.state` (`updateState`, `methods.js:191`)
Sets `status` to `open` or `paid`.

### `practice.commission.remove` (`remove`, `methods.js:206`)
- Refuses if `status === PAID` (`methods.js:221-223`).
- Removes the row.
- **Unsets `commissionInvoiceId` on every event that linked to it** (`methods.js:228-232`).

This is symmetric with patient-invoice cancellation: events become available for re-tracking under a new commission invoice.

### `practice.commission.getOpenAmount` (`getOpenAmount`, `methods.js:240`)
Returns `{ count, sum }` of `OPEN` commission invoices for a user (or for the practice). The sum is computed in JavaScript by iterating each row's `getAmount()` rather than via aggregate (the aggregate path is commented out, `methods.js:297-303`).

### `practice.commission.hasCommissionInvoices` (`hasCommissionInvoices`, `methods.js:317`)
Boolean — used by `FinancialPageTabs` to decide whether to render the Commissie tab.

## The event-hook integration

The really important part of commission tracking is **not** in the methods — it's in the event hooks at `app/imports/api/events/server/hooks.js:13-21` and the helpers in `app/imports/api/invoices/commissionInvoices/server/util.js`.

Three hook handlers are wired in:

```js
// events/server/hooks.js:13-21
const boundNewEventCommission    = bindEnvironment(e => CommissionInvoicesUtil.updateCommissionNewEvent(e));
const boundUpdateEventCommission = bindEnvironment((prev, e) => CommissionInvoicesUtil.updateCommissionUpdateEvent(prev, e));
const boundRemoveEventCommission = bindEnvironment(e => CommissionInvoicesUtil.updateCommissionRemoveEvent(e));
```

They're called from:
- `Events.after.insert` — debounced 5s, then `_updateCommissionNewEvent`.
- `Events.after.update` — debounced 5s, then `_updateCommissionUpdateEvent`.
- (See note below on the remove case.)

> ⚠️ The remove handler is **wired but not actually firing on `Events.after.remove`**. `events/server/hooks.js:83-103` instead uses `Events.findUnsafe({ removedAt: { $gte: new Date() } }).observe({ added })` at startup, which is the soft-delete observer pattern, but the comment `// TODO: RE-ENABLE` next to it suggests this is broken or partially disabled. Verify with product whether commission rollback on event delete actually works in production.

### `_updateCommissionNewEvent` (`server/util.js:24-96`)

For one event:
1. Skip if no `patientFileId`, no PracticeUser, or PracticeUser has no commission, or `event.start < commission.modifiedAt` (the rate change cut-off).
2. Build the selector `{ date: startOfMonth(event.start), practiceId, userId, status: OPEN }`.
3. **Find or create** the commission invoice for that month.
4. Push a `dataEntry = { eventId, treatmentType, amount: event.getPrice(), ...event.meta }` into the row's `data` array.
5. Stamp `commissionInvoiceId` on the event itself.

### `_updateCommissionNewEvents` (`server/util.js:98-198`)

The batched version. Used by `_repeatEvent` (`events/server/util.jsx:432-499`) to handle a recurring-event creation in a single sweep without N round trips. Caches PracticeUsers, Treatments, and CommissionInvoices by month/user/practice, then commits one `Events.update($in: ids)` per resulting `commissionInvoiceId` group.

### `_updateCommissionUpdateEvent` (`server/util.js:200-247`)

Triggered on event edit. Computes three transition flags:
- `removed = !old.removed && new.removed`
- `movedToOtherUser = old.userId !== new.userId`
- `movedToOtherMonth = old.start.month !== new.start.month`

Then:
- If removed → call `_updateCommissionRemoveEvent(old)`.
- Else if user changed → remove from old, add to new.
- Else if month changed → remove from old, add to new (preserving practiceUser ref).
- Else → in-place update of the matching `data.$` entry on the existing commission invoice (price / treatment type may have changed).

### `_updateCommissionRemoveEvent` (`server/util.js:249-274`)

- Pull the entry out of `data`.
- If the commission invoice is **percentage-based** (not fixed) and the resulting `data` is empty, also `CommissionInvoices.remove` the whole row.
- Always unset `commissionInvoiceId` on the event itself.

The `// TODO what to do in case of paid commission invoice?` comment at lines 201 and 250 indicates that the path does **not** check `status === PAID` before mutating — editing or deleting an event that has already been included in a paid commission invoice will mutate the paid row. This is a code-derived gap.

## The `_cachedAmount` debouncer

`app/imports/api/invoices/commissionInvoices/server/hooks.js:10-34` wires two collection hooks:

```js
CommissionInvoices.before.insert(function(userId, doc) {
  doc._cachedAmount = CommissionInvoicesUtil.computeAmount(doc);
});

CommissionInvoices.after.update(function(userId, doc) {
  debouncer.debounce(doc._id + "update", function(prev, doc) {
    const amount = CommissionInvoicesUtil.computeAmount(doc);
    if (prev._cachedAmount !== amount) {
      CommissionInvoices.update(doc._id, { $set: { _cachedAmount: amount } });
    }
  }, 500, this.previous, doc);
});
```

The 500ms debouncer prevents thrash when many events update one commission row in quick succession (e.g. during a recurring-event create). The cache is also bypassed any time `getAmount(useCache = false)` is called.

## Publications

`app/imports/api/invoices/commissionInvoices/server/publications.js`:

| Publication | Selector | Notes |
|---|---|---|
| `commissionInvoice` | `{ _id: invoiceId, userId: this.userId }` (own) or `{ _id: invoiceId, practiceId }` (with `practice.commission.view`) | Single-document publication. **Marked `// TODO make reactive`.** |

## User-visible behaviour

### Two ways to create a commission invoice

1. **Implicit (default)** — every event that goes through the calendar create/edit hook with a non-NONE commission triggers `_updateCommissionNewEvent`, which find-or-creates the row for that month and pushes the event into the `data` array. The user sees the commission accumulating live in the financial tab.
2. **Explicit ("Genereer" button)** — the user clicks the button, which calls `generateCommissionInvoices` and force-flushes any uncommissioned events plus any missing fixed-amount month rows.

### Setting up a commission rule

The commission rule is set on the practice user, not on the commission invoice. The screen at `/practices/users/:userId` exposes:
- Type: none / fixedAmount / percentage (i18n keys `practice.users.commission.{none, fixedAmount, percentage}`).
- Amount (for fixedAmount, in EUR).
- General percentage (for percentage).
- A "Specifeer per stoornis" toggle that opens a per-disorder override editor (i18n key `practice.users.commission.percentagePerTreatment`).

When the rule changes, the `commission.modifiedAt` field is updated. The next generate (and the next event hook) will pick up the new rate from this date forward; historical commission invoices keep the snapshot of the *previous* rate via the `commission` field on the row.

### Adjusting an open commission

The amount field on the row is **editable inline** via `EditCommissionPrice` (`modules/invoices/commission/EditCommissionPrice.jsx` — not read in this pass) for users with `practice.commission.update.amount`. The mutation calls `updateAmount` which sets the `amount` field. Once `amount` is set, it overrides `_cachedAmount` permanently — there is no "go back to computed" path other than removing the row.

### Marking as paid

The state dropdown on the row uses `updateState` to flip between `OPEN` and `PAID`. Once `PAID`:
- The row cannot be removed (`practice.commission.remove` refuses, `methods.js:221-223`).
- Adjusting the `amount` field is technically possible (no guard in `updateAmount`).
- Editing or removing an underlying event still mutates the paid row (no guard in the event hooks; see TODO comments).

### Print and download

`CommissionInvoiceActions.jsx:16-61` defines three actions:
- **Download** — `Util.componentToStaticHtml(CommissionInvoicePrint, { invoice, ... })` then `Util.downloadPDF(name, html)`. Filename is `${YYYY-MM} ${userName}`.
- **Print** — `Util.printHTMLElement` of the same HTML.
- **Remove** — refuses if `status === PAID` with a confirm dialog `practice.commission.notCancellablePaidMsg`.

Download and print are `allowPermission: true` (any user can do them), while remove requires the explicit permission.

## Permissions

| Action | Permission |
|---|---|
| Generate commissions | `practice.commission.generate` |
| View commissions | `practice.commission.view` (or own) |
| Update amount | `practice.commission.update.amount` |
| Update state | `practice.commission.update.state` |
| Remove | `practice.commission.remove` |
| Get open amount | `practice.commission.getOpenAmount` (or own) |
| Update commission rule on a user | `practice.user.update.commission` |

## Notable details

- **The commission row's `date` is always the first millisecond of the month** (`startOf("month").toDate()`, used both as a key for find-or-create and as the human-readable label). Multiple events in the same month cluster into one row.
- **Fixed-amount commissions create empty rows.** For a fixed-amount commission, `generateCommissionInvoices` creates rows for *every* month from `modifiedAt` to today, even if the therapist did zero events in that month. The amount is computed as `commission.amount * 100` (cents) regardless of `data` content.
- **Percentage commissions don't create empty rows.** A percentage row is only inserted on the first event-hook fire that finds no existing row for the month.
- **`hasToPayCommission()` is the gate.** A practice user with `commission.type === NONE` (or no commission at all) is skipped by both the bulk generate and the event hooks (`practiceUsers.jsx:188-190`).
- **The `data.amount` field stores `event.getPrice()`**, which is the gross event price in cents (`events.jsx:1426-1428`), not the commission share. The commission share is recomputed on every read via `getAmount()`.
- **`treatmentType` is captured per-data-entry** at the time the event is folded in. If a treatment's type is later changed (rare), historical commission rows do not retroactively re-bucket.
- **Per-disorder overrides** are matched by exact equality on the disorder code (`a`, `b.1`, ..., `supplementaryInsurance`). There is no fallback / wildcard.
- **Commission invoices are not "invoices" in the legal sense.** They have no number, no structured announcement, no PDF that goes to a third party — they are a private settlement record. The `CommissionInvoicePrint` template is for the practice's internal use.
- **The commissionInvoice for a *paid* event still updates** if the event is edited. The TODO at `server/util.js:201, 250` is a known gap in the model.
- **The user-facing search does not include `_cachedAmount` text matching** — only `userName` and `amount` (`methods.js:160-170`). Searching by amount uses the same `$where` regex trick as the other invoice searches.

## Helpdesk overlap

The Zendesk material covers:
- Setting commission per therapist with the three types.
- The monthly cadence.
- The "Genereer" button.

It does **not** cover:
- Per-disorder overrides (`specificAmounts`).
- The fact that commissions update live as events are added.
- The behaviour around event edits/removals on PAID rows.
- The fixed-amount empty-month behaviour.
- The download/print actions.

## Source files

- `app/imports/api/invoices/commissionInvoices/commission.jsx` — schema, types, states, helpers.
- `app/imports/api/invoices/commissionInvoices/methods.js` — generate, search, update, remove.
- `app/imports/api/invoices/commissionInvoices/util.js` — `_computeAmount` (isomorphic).
- `app/imports/api/invoices/commissionInvoices/server/util.js` — `_updateCommissionNewEvent`, `_updateCommissionUpdateEvent`, `_updateCommissionRemoveEvent`, `_updateCommissionNewEvents`.
- `app/imports/api/invoices/commissionInvoices/server/hooks.js` — `_cachedAmount` debouncer.
- `app/imports/api/invoices/commissionInvoices/server/publications.js`.
- `app/imports/api/events/server/hooks.js` — wires event create/update/remove into the commission utils.
- `app/imports/api/practiceUsers/practiceUsers.jsx:163-191` — the `commission` field embedded into PracticeUsers, plus `hasToPayCommission()`.
- `app/imports/modules/invoices/commission/CommissionBox.jsx` — the financial tab list view.
- `app/imports/modules/invoices/commission/CommissionInvoicePage.jsx` — single-row detail page.
- `app/imports/modules/invoices/commission/CommissionInvoicePrint.jsx` — print template.
- `app/imports/modules/invoices/commission/CommissionInvoiceActions.jsx` — download / print / remove actions.
- `app/imports/modules/invoices/commission/EditCommissionPrice.jsx` — inline amount editor.
- `app/imports/modules/invoices/InvoiceState.jsx` — shared state-pill component.
