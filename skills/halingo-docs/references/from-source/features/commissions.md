# Commissions (configuration)

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — articles in `../../full_documentation/invoicing_finances.md` and `../../full_documentation/general_getting_started.md` describe how to *generate* commission invoices but the configuration model is fragmented across files. Verify against running app before promoting to `manual/`.

> **Scope.** This page documents the **per-user commission configuration** that lives on the `PracticeUsers` row. The `commissionInvoices` collection (the actual paid/open commission invoice documents) and the generation pipeline are out of scope here — they belong with the billing deep-dive.

## What it is

A commission rule attached to a member of a group practice. When the practice books and invoices an appointment performed by that member, the commission rule determines how much of the patient's payment is owed back to the therapist. Three rule types are supported: none (no commission), a flat monthly fixed amount, or a percentage of revenue, with optional per-disorder percentage overrides.

A commission is configured by an owner or admin from the per-user practice page. Once configured, the rule is consumed by the commission-invoice pipeline (a separate area in `commissionInvoices/`) which builds, on a monthly basis, an open commission invoice with the right amount.

## Where it lives in the UI

- `/practices/users/:userId` · `practices.usermanagement` (right column) — the commission `LiveEditableForm`. See `practice_user_management.md` for the page composition.
- The form is built from `app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx:23` (`Definition`), with the per-disorder repeating sub-form at `app/imports/lib/formSchemas/practices/commission/commissionPercentage.jsx:23`.
- The form's `submit` callback calls `updateCommission.call(data, cb)` (line 142 of `therapistCommission.jsx`).

## Data model

Commission configuration is stored on each `PracticeUsers` row in a sub-document called `commission`, typed by `CommissionSchema` from `app/imports/api/invoices/commissionInvoices/commission.jsx:20`:

```js
export const CommissionSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: _.values(CommissionTypes),
    defaultValue: CommissionTypes.NONE
  },
  amount: { type: Number, optional: true },
  modifiedAt: { type: Date, optional: true },
  percentage: { type: Number, optional: true },
  specificAmounts: { type: Array, optional: true },
  'specificAmounts.$': Object,
  'specificAmounts.$.id': String,
  'specificAmounts.$.amount': String
});
```

### Type enum

`CommissionTypes` (`app/imports/api/invoices/commissionInvoices/commission.jsx:14`):

| Constant | String value | Meaning |
|---|---|---|
| `NONE` | `"none"` | No commission. Default for new practice users. |
| `FIXED_AMOUNT` | `"fixedAmount"` | A flat monthly amount in EUR (cents) is owed regardless of revenue. |
| `PERCENTAGE` | `"percentage"` | A percentage of revenue is owed; `specificAmounts` may override the percentage per treatment type. |

The default for a fresh `PracticeUsers` row is `{type: "none"}`. The schema's outer `commission` field on `PracticeUsers` defaults to `{}` (`app/imports/api/practiceUsers/practiceUsers.jsx:165`).

### `commission.amount`

Used only when `type === "fixedAmount"`. Stored as a `Number`. The commission form labels the input "practice.users.commission.amount" with `min: 1, max: 9999999, icon: "fa-euro"` (`app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx:128`). Currency formatting via `Util.formatCurrency`. > ⚠️ The schema does not declare units (cents vs euros). The earnings graphs and `Util.formatCurrency` strongly suggest cents-based storage everywhere else; needs product validation.

### `commission.percentage`

Used only when `type === "percentage"`. A general percentage applied to all treatment types unless overridden. The form input has `min: 0, max: 100, icon: "fa-percent"` (`app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx:84`).

### `commission.specificAmounts`

Used only when `type === "percentage"`. An array of `{id, amount}` pairs where `id` is a treatment type code and `amount` is **a string holding a percentage value** (the schema declares it `String`, not `Number`, see `commission.jsx:32`).

The available `id` values come from `Treatments.getTypes()` (`app/imports/lib/formSchemas/practices/commission/commissionPercentage.jsx:38`) — the RIZIV nomenclature buckets defined in the treatments module (a, b.1–b.6.4, c.1–c.2, d, e, f, plus the special `supplementaryInsurance` bucket).

In the UI, the `RepetitiveAdd` component lets the user add as many overrides as they want, each picking a treatment type from a dropdown and entering a percentage in a number input. The `RepetitiveAdd` is at `app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx:99`.

### `commission.modifiedAt`

A `Date` that tracks **the start of the period from which this commission rule applies**. Critical for the commission-invoice pipeline below.

In the form (`therapistCommission.jsx:58`), the field is rendered as a `DatePicker` with `mode: DatePickerModes.MONTH` — i.e. the user picks a month, not an arbitrary day. The `renderValue` is `moment(v).format('MMMM Y')`.

The default behaviour, if the client does not move the date, is set in `updateCommission` at `app/imports/api/practiceUsers/methods.jsx:40`:

```js
if (!oldPU.commission || !oldPU.commission.modifiedAt ||
    oldPU.commission.modifiedAt.getTime() === commission.modifiedAt.getTime()) {
  commission.modifiedAt = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
```

In other words: if the commission rule already had a `modifiedAt` and the client did not change it, the server **bumps it forward to the start of the current calendar month**. Combined with the form's month-only picker, this means commission rule changes always take effect at month boundaries.

> ⚠️ The condition is "previous and new are equal → bump to start of month". A user who explicitly clears the date or who changes the date to the *same value* gets a server-side reset to "now". Behaviour inferred from code; needs product validation.

## Methods (Meteor)

### `practice.user.update.commission` · `app/imports/api/practiceUsers/methods.jsx:32`

`PermissionValidatedMethod`, `subscription: true`. Permission: `practice.user.update.commission` (owner + admin). Validation: `updateCommissionSchema` (PracticeUsers schema picked down to `commission`, plus `practiceId` and `userId`).

Body:

```js
const oldPU = PracticeUsers.findOne({practiceId, userId});
if (!oldPU.commission || !oldPU.commission.modifiedAt ||
    oldPU.commission.modifiedAt.getTime() === commission.modifiedAt.getTime()) {
  commission.modifiedAt = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
return PracticeUsers.update({practiceId, userId}, {$set: {commission}}) > 0;
```

The method is invoked by the `LiveEditableForm`'s submit handler in `therapistCommission.jsx:142`. Auto-save fires on debounced field change.

There is **no separate** "update commission for one treatment type" method; the entire `commission` sub-document is replaced on every save.

## Hook: keep open commission invoices in sync

`app/imports/api/practiceUsers/server/hooks.js:48`

```js
PracticeUsers.after.update(function(userId, practiceUser) {
  debouncer.debounce(practiceUser._id, updateCommissions, 5000, this, userId, practiceUser);
});
```

The `updateCommissions` callback (`hooks.js:11`):

1. Bail out if the JSON of `commission` did not actually change between previous and current.
2. `practiceUser = context.transform()` — get the helper-bound view.
3. Compute `date = moment(commission.modifiedAt).startOf('month').toDate()`.
4. Build a selector `{date: {$gte: date}, practiceId, status: OPEN, userId}`.
5. Build a more specific "current month" selector that pins `date` exactly.
6. **If the new type is `FIXED_AMOUNT` and there is no current-month commission invoice yet**, insert one with `commission`, `userName`, `userImage` populated. (lines 34–43)
7. **Update all open commission invoices from `modifiedAt` onward** with the new `commission` sub-document via `CommissionInvoices.update(selector, ..., {multi: true})`.

The 5-second debounce on the hook ensures rapid form edits coalesce into a single rebuild.

The implication: changing a commission rule **retroactively rewrites every still-open commission invoice from `modifiedAt` onward**. Paid commission invoices (`status: PAID`) are not touched. The "validFrom" date in the form is therefore both an effective-from date for *future* invoicing and a re-stamp date for any still-open invoice in the same window.

> ⚠️ Subtle interaction: a commission rule that was changed mid-month will retroactively rewrite all open commission invoices from the **start of the month containing `modifiedAt`** onward. Behaviour inferred from code; needs product validation.

## Helpers

`PracticeUsers.helpers.hasToPayCommission()` (`app/imports/api/practiceUsers/practiceUsers.jsx:188`):

```js
hasToPayCommission() {
  return Boolean(_.get(this.commission, 'type') &&
                 this.commission.type !== CommissionTypes.NONE);
}
```

This is the canonical "is this user on the hook for commissions" check. Used by downstream invoicing code to decide whether to include the user in commission-invoice generation runs.

## User-visible behaviour

Walking through the form on `/practices/users/:userId`, right column:

1. **Type select.** The user picks `none` / `fixedAmount` / `percentage`. The other rows render conditionally based on the selected type.
2. **Valid from.** Hidden when `type === none`. A month picker. If the user does not change it, the server snaps it to "this month, day 1". This is the date from which the rule is effective.
3. **General percentage.** Hidden unless `type === percentage`. A number from 0 to 100, the default percentage applied to all treatment types not in `specificAmounts`.
4. **Per-disorder percentage list.** Hidden unless `type === percentage`. A `RepetitiveAdd` block where each row is `{treatment type, percentage}`. The treatment type dropdown is populated from `Treatments.getTypes()`.
5. **Fixed amount (€).** Hidden unless `type === fixedAmount`. A number from 1 to 9 999 999. Currency format via `Util.formatCurrency`.

The form auto-saves on debounced change. Once saved:

- The new commission sub-document is written to the `PracticeUsers` row.
- 5 seconds later, the after-update hook fires and rewrites every still-open `commissionInvoices` row from this month onward, retroactively.
- For new fixed-amount rules with no current-month open invoice, the hook *creates* a current-month open invoice immediately.

The user does not see a confirmation modal — feedback is the global save status indicator.

## Permissions

| Action | Permission | Roles |
|---|---|---|
| Open the commission form | `practice.user.view` | owner + admin |
| Edit the commission form | `practice.user.update.commission` | owner + admin |
| (server-side enforcement) | `subscription: true` | requires active subscription |

A `default` (lid) user cannot open the per-user page (`practice.user.view` denied) and therefore cannot see, let alone edit, anyone's commission — including their own. To even know "what is my commission rate" they must ask their owner/admin.

## Notable details

- **`specificAmounts.$.amount` is a string.** The schema explicitly declares it `String` (`commission.jsx:32`). This is unusual — a percentage is a number. The form uses `<Input type="number">` which writes a number; SimpleSchema's coercion may turn that into a string. Calculations downstream presumably parse it back. Easy footgun if you want to do range validation.
- **No `min`/`max` on `commission.amount` in the schema.** The form constrains it; the schema does not.
- **No upper limit on `commission.percentage`.** The form has `max="100"` but the schema doesn't enforce it. A direct method call could write `200`.
- **`modifiedAt` is shifted by the server.** Clients trying to set arbitrary effective dates will be overridden if the date matches what was already there.
- **Open commission invoices from a *previous* month are also rewritten** if `modifiedAt` is moved backward. The selector is `{date: {$gte: modifiedAt-startOfMonth}}`. So if you change the rule and set `modifiedAt` to January, every open commission invoice from January onward gets the new sub-document — even paid commission invoices are excluded only because of `status: OPEN`. Be careful with backdated changes.
- **No history of past rules.** The new rule overwrites the old one in place. There is no `commissionHistory` collection. Past *invoices* are the only audit trail.
- **`commission.specificAmounts` overrides cannot reuse the same `id` more than once.** The form allows it, but downstream consumers (which `_.find` by id) will pick whichever entry happens to come first. > ⚠️ Behaviour inferred from code; needs product validation.
- **Currency mismatch with `commissionInvoicePrice` schema.** The `commissionInvoicePrice.jsx` schema (a sibling file) is for editing per-row amounts on a generated commission invoice; it is *not* the same surface as `commission.specificAmounts`. Don't confuse them.
- **`hasToPayCommission` only checks `type !== NONE`.** It does not validate that `amount` or `percentage` is set. A user with `{type: "percentage"}` and no percentage field set would still pass this check.
- **The hook is debounced per `practiceUser._id`** — fast successive edits across different users do not coalesce.
- **The hook's debouncer is in-memory.** A server restart between the edit and the 5-second window drops the rebuild silently. > ⚠️ Behaviour inferred from code; needs product validation.

## Helpdesk overlap

- `full_documentation/invoicing_finances.md` documents the commission **invoice** lifecycle (open → paid) and how to generate them.
- `full_documentation/general_getting_started.md` mentions associated-therapist commission setup briefly.
- The "per-disorder override" feature is not documented in the helpdesk.
- The retroactive rewrite behaviour is not documented anywhere outside this file.
- The month-snap of `modifiedAt` is not documented.

## Source files

- `app/imports/api/practiceUsers/practiceUsers.jsx` — `PracticeUsers.schema.commission` field (`CommissionSchema`).
- `app/imports/api/practiceUsers/methods.jsx:32` — `updateCommission` method, schema, server-side date snap.
- `app/imports/api/practiceUsers/server/hooks.js` — debounced after-update hook that rewrites open commission invoices.
- `app/imports/api/invoices/commissionInvoices/commission.jsx:14` — `CommissionTypes` enum.
- `app/imports/api/invoices/commissionInvoices/commission.jsx:20` — `CommissionSchema`.
- `app/imports/lib/formSchemas/practices/commission/therapistCommission.jsx` — the per-user commission form definition.
- `app/imports/lib/formSchemas/practices/commission/commissionPercentage.jsx` — the per-disorder repeating row schema.
- `app/imports/api/treatments/treatments.js` — `Treatments.getTypes()` (treatment type IDs that can be used as `specificAmounts.$.id`).
- `app/imports/lib/util/DebouncerById.js` — the debouncer used by the hook.
