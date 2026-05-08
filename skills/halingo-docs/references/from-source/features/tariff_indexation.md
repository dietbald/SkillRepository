# Tariff indexation

> **Confirmed by the product owner 2026-04-07** (Q43 of [`../open_questions.md`](../open_questions.md)): "Indexation happens through the dated pricing of the events." That is — there is no separate tariff indexation feature; the regulatory tariff history is encoded directly in the date-conditional cascade in `Events.getPrices()` documented below. Architecturally the values should eventually live in the database, but the migration is **deferred** (Q37: "These are correct, but these values should be stored in the database. Let's not do that yet for the migration."). See [`../deprecation_list.md` #22](../deprecation_list.md).
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: not relevant — tariff indexation is a regulatory cadence (RIZIV publishes new tariff sheets periodically), not a feature.

## Verdict: NOT a separate code feature — implemented inline in `Events.getPrices()`

> **Halingo has no first-class tariff version tracking, no tariff editor, no per-praktijk tariff override, and no admin UI for tariff updates. Tariff changes are made by editing the date-conditional cascade in `Events.getPrices()` and shipping a new release.** This is the intended pattern today — see the architecture note above.

This file documents the **absence** of tariff indexation as a code feature, the workarounds the codebase uses to approximate it, and the one place where the user-facing UI hints at a tariff feature that does not exist.

## What there is — `Events.getPrices(event)`

The price for a single event is computed by `Events.getPrices(event)` (`app/imports/api/events/events.jsx:244`). This is a **giant in-memory cascade of date-conditional `if` blocks**, one per regulatory tariff revision. The structure is:

```js
Events.getPrices = function getPrices(event) {
  const start = moment(event.start);

  if (start < moment("2018-01-01")) {
    return { SCHOOL: { SESSION: { 30: { price, payback, payback_with } } }, OTHER: { ... } };
  } else if (start < moment("2019-01-01")) {
    return { ... };  // 2018 tariffs
  } else if (start < moment("2020-04-01")) {
    return { ... };  // 2019 tariffs
  } else if (start < moment("2020-08-01")) {
    return { ... };  // April 2020 tariffs
  } // ... and so on
}
```

Each branch returns a fresh nested object literal with the per-tariff-period prices. The branches I see in the code start at `2018-01-01` and walk forward through every tariff revision since.

The price object's structure is:

```
{
  SCHOOL: {           // events with location === SCHOOL get a different (school-specific) tariff
    SESSION:        { 30: { price, payback, payback_with } },
    EVOLUTION_BILAN: { 60: { price, payback, payback_with } },
    BILAN_RELAPSE:   { 60: { price, payback, payback_with } },
  },
  OTHER: {            // every other location
    INITIAL_BILAN:  { INDEFINITE: { price, payback, payback_with } },
    SESSION:        { GROUP: { ... }, 30: { ... }, 60: { ... } },
    EVOLUTION_BILAN: { 60: { ... } },
    BILAN_RELAPSE:   { 60: { ... } },
    PARENT_SITTING:  { GROUP: { ... }, INDIVIDUAL: { ... } },
  },
}
```

Each leaf carries three integer fields, all in cents:

- `price` — gross price the therapist may charge.
- `payback` — base reimbursement (the share the Ziekenfonds pays back to a regular CG2 patient).
- `payback_with` — increased reimbursement (`hasIncreasedReimbursement()`, CG1) — for patients with verhoogde tegemoetkoming.

The `getInsurancePrices` helper on the event (`events.jsx:1379-1398`) reads `Events.getPrices(this)` then walks the path `${SCHOOL_or_OTHER}.${appointmentTypeText}.${duration}` to extract the row.

## How tariff updates ship

Each new tariff cycle requires:

1. A developer adds a new `else if (start < moment("YYYY-MM-DD"))` branch to `Events.getPrices`.
2. The new branch contains the freshly-published tariff numbers from the official RIZIV PDF.
3. The change is committed and a new Halingo release is deployed.

There is no migration step (the prices live entirely in code, not in the database), no admin tool, no off-cycle update path. A tariff that lands mid-month requires either:

- A patch release and immediate deploy, OR
- The therapist manually overriding `event.price` on individual events (the `event.price` field is settable, and `getInsurancePrices` honours it via `event.price = event.price || prices.price` in the create-invoice flow at `patientFileInvoices/server/util.js:142`).

## The "ownTariffs" dead toggle

`app/imports/lib/formSchemas/practices/accessibility.jsx:46-60` defines a form field labelled `practice.ownTariffs` ("Eigen tarieven gebruiken"):

```js
{
  className: 'row',
  elements: [
    { label: "practice.ownTariffs", className: 'col-sm-10', style: {marginTop: "5px"} },
    { className: 'col-sm-2', type: Switcher, name: "ownTariffs" }
  ]
}
```

This is a **broken / unwired feature**:
- The form's parent schema is `PatientFiles.schema` (sic — it's bound to the patient files schema, not the practice schema).
- The `PatientFiles.schema` has no `ownTariffs` field.
- The `Practices.schema` has no `ownTariffs` field.
- No code path checks `ownTariffs` anywhere in the codebase.
- The `submit` callback is an empty function `() => {}`.

So the toggle renders, the user can flip it, and nothing happens. It is dead UI.

> ⚠️ Verify with product whether this toggle was ever functional or whether it represents a dropped scope. The label suggests an intended "let practices override the convention tariffs", but no implementation exists.

## The de-conventioned discount

The one piece of "tariff variation" that **does** exist in code is the de-conventioned discount applied at invoice creation time (`patientFileInvoices/server/util.js:152-158`):

```js
if (
  moment(event.start).isAfter(moment("2024-04-01")) &&
  user.profile.isDeconventioned &&
  !treatmentHasSupplementaryInsurance &&
  !patientFile.hasIncreasedReimbursement()
) {
  event.pricePatient = event.price - Math.ceil(prices.payback * 0.75);
}
```

This says: for a de-conventioned therapist, on events after `2024-04-01`, the patient's reimbursement is **75% of the convention payback**, not the full payback. The therapist's gross price (`event.price`) is unchanged — only the split between patient share and reimbursement share moves.

This is the code's only nod to "tariff varies by therapist convention status" and is a single hardcoded date constant + a single hardcoded percentage. It is not a tariff-versioning feature; it is a conditional patch on top of the static cascade.

## What's missing compared to a "real" tariff feature

A typical tariff-indexation feature in a healthcare practice management system would have:

| Feature | Halingo? |
|---|---|
| A `tariffs` collection with one row per tariff version | no |
| An admin UI to add/edit tariff versions | no |
| A per-praktijk override capability | no — the `ownTariffs` toggle is dead UI |
| A tariff diff/preview tool | no |
| Bulk re-pricing of historical events | no |
| Email notification on tariff change | no |
| Per-Ziekenfonds tariff variation | partial — only via the i18n `insurances/<code>` keys for address, no per-fund pricing |
| Automated tariff fetch from the RIZIV API | no — `lib/external-api/rizivHelper.js` only handles practitioner registry lookups |

## Notable details

- **The `getPrices` cascade is the only source of truth for tariffs.** No database, no settings, no per-praktijk override.
- **`getPrices` returns by reference**, so if any caller mutates the returned object it would mutate the function's literal — but the codebase treats the return value as read-only.
- **The `event.price` field is overrideable.** A user (or an admin) can manually edit an event's `price` field, and the create-invoice flow will honour it as-is (`patientFileInvoices/server/util.js:142`). This is the only escape hatch for "I disagreed with the convention price for this one session".
- **The `getInsurancePrices` helper does NOT do version negotiation across event create vs invoice create.** The price is computed at invoice creation from `event.start`, so an event scheduled before a tariff change but invoiced after gets the *event-date* tariff, not the *invoice-date* tariff. This is the correct behaviour for retroactive billing.
- **The `payback_with` (verhoogde tegemoetkoming) field is selected by `patientFile.hasIncreasedReimbursement()`** which is `insuranceStateCode1 % 2 === 1` (`patientFiles.jsx:320-322`) — i.e. an odd CG1 code means CG1 patient. This is also a regulatory shortcut: the convention encodes "verhoogde tegemoetkoming" patients with odd CG1 codes.
- **Initial bilans are billed by the unit.** A 60-minute initial bilan is split into two 30-minute child events at invoice time, each charged at the per-30-minute rate (`patientFileInvoices/server/util.js:97-110`). This means a 60-min initial bilan does not have its own tariff entry — it inherits from the 30-min cascade.
- **Group sessions have separate tariff entries.** The `GROUP` subType has its own price/payback/payback_with row in every cascade branch.
- **Parent sittings also have their own row** (`PARENT_SITTING.GROUP` and `PARENT_SITTING.INDIVIDUAL`).
- **The `R-waarde` group-sitting rate change on 2023-05-01** (in `modules/riziv/server/util.js:18-24`) is NOT mirrored by a price change in `Events.getPrices` — the R-value math is independent of the price math, even though both are "RIZIV stuff".

## Helpdesk overlap

The helpdesk discusses regulatory tariff changes ("the RIZIV updated the tariff in August 2024") but does not say anything about Halingo's storage / configurability — because there is none.

## Source files

- `app/imports/api/events/events.jsx:244-...` — `Events.getPrices` (the cascade).
- `app/imports/api/events/events.jsx:1379-1398` — `getInsurancePrices` (event helper).
- `app/imports/api/invoices/patientFileInvoices/server/util.js:130-161` — invoice-creation price + payback derivation, including the de-conventioned discount.
- `app/imports/api/patientFiles/patientFiles.jsx:320-322` — `hasIncreasedReimbursement()`.
- `app/imports/lib/formSchemas/practices/accessibility.jsx:46-60` — the dead `ownTariffs` form field.
- `app/imports/api/events/types.js` — a stand-alone test data file with one example tariff structure (not consumed by `getPrices`).
