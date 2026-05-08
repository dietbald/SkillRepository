# Insurance invoices (Verzamelstaten)

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: covered at the prose level for "Aanmaken verzamelstaat", "Versturen aan ziekenfonds" and the third-party-payer concept. Not covered: the per-fund vs per-patient grouping option, the per-certificate state mirroring, the synchronous practice-counter sharing with patient invoices. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

A `Verzamelstaat (derdebetaler)` is the batched/aggregated invoice that a Belgian healthcare provider sends to a Ziekenfonds under the *derdebetaler* (third-payer) scheme: rather than billing the patient for the reimbursable share and waiting for them to claim it back, the provider lets the patient pay only the *remgeld* and bundles the reimbursable share into a periodic claim sent directly to the fund.

In Halingo, a Verzamelstaat is a row in the `insuranceInvoices` collection that wraps a copy of a slice of certificate data from one or more *patient* invoices that share an insurance fund. Each Verzamelstaat is signed-off as `OPEN → PRINTED → PAID` and **propagates its state changes back to every certificate it contains**, in every patient invoice it touched.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| Financial overview, "Verzamelstaatfacturen" tab | `/financial` | `FinanceInsuranceInvoicePanel` | `ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx` |
| Single Verzamelstaat view | `/financial/invoices/insurance/:invoiceId` | `InsuranceInvoicePageContainer` | `modules/invoices/insurance/InsuranceInvoicePage.jsx` |
| Bulk-print dialog | n/a (overlay shared with patient invoices) | `PrintInvoices` + `PrintPage` (with `insurance` flag) | `modules/patientfiles/invoices/PrintInvoices.jsx`, `PrintPage.jsx` |
| List item / row | inside the financial tab | `InsuranceInvoiceListView` | `modules/invoices/insurance/InsuranceInvoiceListView.jsx` |

The "Genereer" button on the financial tab opens a `Menu` with two options (`FinanceInsuranceInvoicePanel.jsx:166-178`):

- **`groupByInsurance`** ("Per ziekenfonds") — calls `generateInvoices.call({ practiceId, userId, splitOnPatient: false })`.
- **`groupByPatient`** ("Per patiënt") — same call with `splitOnPatient: true`.

The user must select an active therapist (`therapistId`) before the menu opens — clicking generate without one yields a notification `invoices.insurance.create.selectTherapist`.

## Data model

### Collection

`InsuranceInvoices = new Collection("insuranceInvoices")` (`insuranceInvoices.js:9`). Client `insert/update/remove` denied (`insuranceInvoices.js:18-22`).

### State enum

```js
// insuranceInvoices.js:11-16
InsuranceInvoiceStates = {
  CANCELED: 'canceled',
  OPEN:     'open',
  PRINTED:  'printed',
  PAID:     'paid',
};
```

### Schema (selected fields, `insuranceInvoices.js:24-57`)

| Field | Type | Notes |
|---|---|---|
| `address` | `addressSchema` | Sender — therapist or practice |
| `amount` | `Number` | Sum of `(event.price - event.pricePatient)` over every reimbursable event in every embedded certificate (`server/util.js:113-117, 139`) |
| `bankAccount` | `String` | Sender's IBAN |
| `certificates` | `Array<Object>` (`minCount: 1`) | The denormalised line items — see "Certificate sub-document" below |
| `createdAt` | `Date` | |
| `invoiceNumber` | `Number` | **Shares the same `practice.invoiceNumber` counter as patient invoices** (`server/util.js:76, 153, 187`) |
| `meta` | `Object` (blackbox, optional) | Snapshot of `practice.settings.invoices` |
| `practiceId` | `String` | |
| `practice` | `Object` | `{ image, name }` only |
| `state` | `String` | `defaultValue: open` |
| `structuredAnnouncement` | `String` | `<NAME-prefix>-<YYYYMMDD>-<NNN>` — see Generation |
| `insuranceAddress` | `addressSchema` (optional) | Snapshot of the Ziekenfonds address |
| `insuranceCode` | `Number` (optional) | |
| `insuranceName` | `String` | |
| `userId` | `String` | The therapist whose certificates are being claimed |
| `user` | `Object` | `{ name, riziv }` only |
| `removed` / `removedAt` | `Boolean` / `Date` (optional) | Soft-delete |

### Certificate sub-document

Each entry of `certificates` (`insuranceInvoices.js:28-39`) holds the *denormalised* line item:

```js
{
  amount,            // sum of (event.price - event.pricePatient) for the events of this bilan
  bilanId,           // optional
  invoiceId,         // ← link back to the source PatientFileInvoices document
  name,              // patient name (snapshot)
  nbOfEvents,        // count of reimbursable events on this bilan
  number,            // the latest printed certificate number for this bilan
  patientFileId,
  SSN,               // patient INSZ — required, throws if missing
  treatmentId,
}
```

The certificate-level `state` is **not** stored on the `insuranceInvoices.certificates` array; the parent `state` field is what changes, and the matching certificate's `insuranceInvoiceState` on the *source patient invoice* is updated in the same operation.

### Filters and sort options

```js
// insuranceInvoices.js:66-79
filters = {
  paid:     { state: PAID },
  open:     { state: OPEN },
  printed:  { state: PRINTED },
  canceled: { state: CANCELED },
};
sortOptions = { date_asc, date_desc, name_asc, name_desc, amount_asc, amount_desc };
```

### Helpers (`insuranceInvoices.js:81-94`)

- `canEdit()` — `state === OPEN`.
- `getName()` — practice name for practice-mode invoices, otherwise user name.
- `locale()` — `meta.locale ?? "nl"`.

## Methods (Meteor)

All in `app/imports/api/invoices/insuranceInvoices/methods.js`.

### `invoices.insurance.add.all` (`generateInvoices`, `methods.js:18`)
Bulk-creates Verzamelstaten for one therapist. Accepts:
- `practiceId`, `userId` — required.
- `splitOnPatient: Boolean` (optional) — if `true`, generate one Verzamelstaat per (insurance × patient); if `false`, group all eligible certificates by insurance only.

Permission: `invoices.insurance.add.all`. If the caller is acting on themselves and lacks the permission, the userId is silently coerced to `this.userId`. If acting on someone else without the permission, throws `errors.permissions.invoices.insurance.add.all`.

The implementation lives in `server/util.js:13-202` (`_generateInvoicesForUser`). Outline:

1. **Completeness check** of practice + user identical to the patient invoice flow (member-mode requires user RIZIV+IBAN+companyNumber, practice-mode requires practice RIZIV+IBAN+companyNumber).
2. **Source query.** Find all *patient* invoices that:
   - Belong to `(userId, practiceId)`.
   - Have `isThirdPayer: true`, `isCanceled: false`.
   - Have `stateInsurance` either `OPEN` or `null`.
   - Have `insuranceName` set.
   - Contain at least one certificate that has been printed (`certificate.numbers.0` exists) and has `insuranceInvoiceId: null` (i.e. not yet folded into a previous Verzamelstaat).
3. **Group** the patient invoices by `insuranceName` (default) or `insuranceName_patientFileId` (when `splitOnPatient`).
4. **Per group**, walk every patient invoice's certificates and pick the ones that:
   - Have at least one entry in `certificate.numbers`.
   - Are not yet linked to another Verzamelstaat.
   - For each, compute `amount = sum(event.price - event.pricePatient for events in this bilan)` (i.e. the reimbursable share).
5. **Throw an error per patient with no SSN.** Patients without `SSN` are skipped and the error is collected as `{ patient.<id>: { error: "invoices.insurance.create.incompletePatientFile", attributes: { name } } }`. The user gets a per-patient error list in the UI notification (`FinanceInsuranceInvoicePanel.jsx:118-136`).
6. **Insert** the new `InsuranceInvoices` row with the aggregated `amount`, the certificate denorm, the structured announcement (`<3-LETTER-PREFIX>-<YYYYMMDD>-<NNN>`), the insurance code/name/address from the first source invoice, and the `invoiceNumber = practice.invoiceNumber + 1` taken from the live counter and **incremented in-memory** for each successive group.
7. **Back-link** the source patient invoices: for every original certificate that was folded in, set `insuranceInvoiceId` on it, and write the modified patient invoice back via `PatientFileInvoices.update(invoice._id, { $set: _.omit(invoice, "_id") })`.
8. **Final** `Practices.update(practiceId, { $set: { invoiceNumber } })` once all groups are processed.

Returns `{ success: <count>, error: { count, errors: [...] } }`.

### `invoices.insurance.edit.state` (`setState`, `methods.js:65`)
Sets the parent state to `OPEN`, `PRINTED` or `PAID` (cannot set `CANCELED` here — cancellation has its own method). Permission: `invoices.insurance.edit` *or* own.

**Critically**, this method ALSO updates `certificates.$[elem].insuranceInvoiceState` on every linked patient invoice via the *raw* MongoDB driver and `arrayFilters` (`methods.js:94-105`):

```js
PatientFileInvoices.rawCollection().update(
  {},
  { $set: { "certificates.$[elem].insuranceInvoiceState": state } },
  { multi: true, arrayFilters: [{ "elem.insuranceInvoiceId": invoiceId }] }
);
```

This is the propagation channel: when a Verzamelstaat moves to `PRINTED`, every certificate on every patient invoice that the Verzamelstaat aggregated gets its `insuranceInvoiceState: "printed"`. When the Verzamelstaat is marked `PAID`, the same channel marks every linked patient certificate as paid on the insurance side. The patient invoice's helper `getInsuranceState()` reads these to compute the worst-case rollup (`patientFileInvoices.js:255-269`).

The Meteor minimongo driver does not pass `arrayFilters` through, so the code goes around it via `rawCollection()`.

### `invoices.insurance.edit.structuredAnnouncement` (`setStructuredAnnouncement`, `methods.js:116`)
Standard edit, **only allowed in `OPEN` state** (`methods.js:147-148`).

### `invoices.insurance.search` (`searchInsuranceInvoices`, `methods.js:157`)
CollectionSearch backend. Searches `insuranceName`, `structuredAnnouncement`, `amount`. Same lid-vs-admin scoping as the patient invoice search.

### `invoices.insurance.print` (`printInvoice`, `methods.js:231`)
Sets `state: PRINTED` if currently `OPEN`. Returns `1` if not OPEN. Same `arrayFilters` propagation as `setState`. Permission: `invoices.insurance.print`.

The actual rendering is browser-side: `PrintPage.jsx:84-87` calls `printInvoiceInsurance.call(...)` after `Util.printHTMLElement(InsuranceInvoicePrint(invoice))` for every selected invoice.

### `invoices.insurance.printInvoicesPractice` (`printInvoicesPractice`, `methods.js:274`)
Date-range query returning practice-wide insurance invoices for bulk printing. Excludes `state === canceled` (`methods.js:301-303`). Permission check is on `invoices.edit` (note: the patient-side permission, not the insurance one).

### `invoices.insurance.cancel` (`cancelInvoice`, `methods.js:317`)
- Refuses if `state === PAID` (`methods.js:346-348`).
- Sets `state: CANCELED`.
- **Unsets the back-link on every embedded certificate** via the same `rawCollection().update(... arrayFilters)` pattern: `$unset: { "certificates.$[elem].insuranceInvoiceId": true, "certificates.$[elem].insuranceInvoiceState": true }`. This makes the certificates re-eligible for inclusion in a future Verzamelstaat (`methods.js:351-362`).
- Permission: `invoices.insurance.cancel` *or* own.

## Publications

`app/imports/api/invoices/insuranceInvoices/server/publications.js`:

| Publication | Selector | Notes |
|---|---|---|
| `insuranceInvoice` | `{ _id: invoiceId, userId: this.userId }`, optionally OR'd with `{ _id: invoiceId, practiceId }` if caller has `invoices.view` | Single-document publication for the detail page. **Marked `// TODO make reactive`.** |

There is no list publication; the financial-tab list is fed entirely by the `invoices.insurance.search` method polled by `CollectionSearch`.

## User-visible behaviour

### Generation flow

The user picks a therapist on the financial overview page, clicks **Genereer**, and chooses one of:

- **Per ziekenfonds (`splitOnPatient = false`)** — produces one Verzamelstaat per insurance fund the therapist has open derdebetaler invoices for. Each Verzamelstaat may contain certificates from many patients.
- **Per patiënt (`splitOnPatient = true`)** — produces one Verzamelstaat per (fund, patient) pair, even if multiple patients share a fund.

A Verzamelstaat **only contains certificates that have already been printed at least once on a patient invoice**. The check is `certificate.numbers.0 exists` in the source query (`server/util.js:65-69`). This is the "you must hand the patient a getuigschrift first" workflow constraint.

Patients without an `SSN` (INSZ) are silently skipped and reported as errors in the UI notification.

### State machine

```
                    setState
                  ┌─────────┐
                  ▼         │
   open ─▶ printed ─▶ paid (terminal)
     │
     └─▶ canceled (terminal)
```

The state mutation is mirrored down to every linked certificate's `insuranceInvoiceState` via `arrayFilters` writes on `patientFileInvoices.certificates`.

### View

The single-Verzamelstaat page (`InsuranceInvoicePage.jsx`) shows:
- Insurance name in the header.
- Date, amount, number of unique patients (`_.uniqBy(certificates, 'patientFileId').length`), structured announcement, state.
- An action row with print, download, and cancel.
- The `InsuranceInvoicePrint` template on the right-hand side at 800×1131 px.

### `InsuranceInvoicePrint` layout

`modules/invoices/insurance/InsuranceInvoicePrint.jsx` is the print template. It draws (positions absolute, all in pixels):

- Top-left: practice logo (max 100×300).
- Top-right: invoice number.
- 120px from top, left: sender block (`user.name`, `address`, RIZIV, IBAN).
- 120px from top, right: recipient block — uses `insurances.<code>.invoiceName` from i18n if defined (otherwise the snapshot `insuranceName`), then the snapshot address.
- 270px: "FACTUUR" title and date.
- 320px: italic regulatory disclaimer string `invoices.print.insuranceInvoice.info`.
- 420px: a 5-column table — patient name, INSZ, certificate number, number of events, amount.
- Bottom: "TOTAAL" and the `invoices.print.invoiceToPatient.instructions` line with bank account, name, structured announcement.

## Permissions

| Action | Permission | Self-allowed? |
|---|---|---|
| Generate Verzamelstaten | `invoices.insurance.add.all` | yes (for self only) |
| Set state | `invoices.insurance.edit` *or* own | yes |
| Print | `invoices.insurance.print` *or* own | yes |
| Cancel | `invoices.insurance.cancel` *or* own | yes |
| Edit structured announcement | `invoices.insurance.edit` *or* own | yes |
| View | `invoices.insurance.view` *or* own | yes |

`generateInvoices` requires a `PracticeUsers` membership for the calling user even when acting on themselves (`methods.js:50-58`).

## Notable details

- **The `practice.invoiceNumber` counter is shared** between patient invoices and Verzamelstaten. A practice with 30 patient invoices and 5 Verzamelstaten will have `invoiceNumber = 35` and the next of either type will be number `36`. There is no separate Verzamelstaat numbering scope.
- **The `generateInvoices` race window is wider than the patient-invoice one** because the in-memory `invoiceNumber++` happens *across* group iterations before the `Practices.update` writeback, meaning a parallel generate from another therapist is even more likely to collide.
- **An Verzamelstaat is the *only* way** an underlying patient invoice's `getInsuranceState()` becomes anything other than `open` — there is no per-certificate "I got paid by the fund" mutation that bypasses Verzamelstaten.
- **Cancelling a Verzamelstaat is non-destructive of the parent patient invoices.** The patient invoice retains the certificates and the printed certificate numbers; only the back-links are unset, and the certificates become eligible for a new Verzamelstaat run.
- **`SSN` is hard-required** at Verzamelstaat generation but not at patient-invoice creation. A practice can therefore have a stack of patient invoices for an SSN-less patient that simply never appear on a Verzamelstaat run.
- **No mail dispatch.** Verzamelstaten are print-only — no `mailInvoice` equivalent. The user prints the PDF and sends it through the regulatory channel manually.
- **Per-event amount is computed at Verzamelstaat creation time, not snapshotted from the patient invoice's event row.** The line `_.reduce(events, (acc, e) => acc + e.price - e.pricePatient, 0)` (`server/util.js:113-117`) reads from the patient invoice's snapshotted events, which themselves were snapshotted from live events at *patient invoice* creation time. So the amount is correct for the convention that was in force at patient-invoice creation, not at Verzamelstaat creation.
- **The 'Verzamelstaat' word is not used in the schema.** The collection is `insuranceInvoices`, the i18n keys are `financial.invoices.insurance.*`, and the print template title is `invoices.print.insuranceInvoice.invoice` which renders the Dutch `FACTUUR - VERZAMELSTAAT DERDEBETALERS` (`i18n/resources/nl.i18n.js:116`).
- **`hasThirdPayerInvoices` exists but is unused.** The `FinancialPageTabs.jsx:36-37` call to it is commented out and the insurance tab is always shown.

## Helpdesk overlap

The Zendesk material covers the prose "click Genereer, choose Per Ziekenfonds, get a Verzamelstaat per fund" workflow and the printed paper output expectation. It does not cover:
- The `splitOnPatient` toggle.
- The `arrayFilters` propagation back to patient invoices.
- The `state = PAID` blocker on cancel.
- The shared invoice-number counter with patient invoices.
- The "must be printed first" precondition.

## Source files

- `app/imports/api/invoices/insuranceInvoices/insuranceInvoices.js`
- `app/imports/api/invoices/insuranceInvoices/methods.js`
- `app/imports/api/invoices/insuranceInvoices/server/util.js`
- `app/imports/api/invoices/insuranceInvoices/server/publications.js`
- `app/imports/api/invoices/insuranceInvoices/util.js`
- `app/imports/modules/invoices/insurance/InsuranceInvoicePage.jsx`
- `app/imports/modules/invoices/insurance/InsuranceInvoicePageContainer.js`
- `app/imports/modules/invoices/insurance/InsuranceInvoicePrint.jsx`
- `app/imports/modules/invoices/insurance/InsuranceInvoiceListView.jsx`
- `app/imports/modules/invoices/insurance/InsuranceInvoiceActions.jsx`
- `app/imports/modules/invoices/insurance/EditStructuredAnnouncement.jsx`
- `app/imports/ui/pages/financial/invoice/FinanceInsuranceInvoicePanel.jsx`
- `app/imports/modules/patientfiles/invoices/PrintPage.jsx` (shared bulk-print dialog)
- `app/imports/i18n/resources/insurances/nl.i18n.js` (per-fund address/name registry)
