# Certificate printing

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: well covered for the user-visible printer alignment workflow ("hoe lijn ik mijn EPSON LX-350 uit"). Not covered: the schema of the certificate sub-document, the duplicate-detection rule, the difference between the two printer modes, the cash-payment toggle, the absolute-positioned coordinate system. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

Halingo's *getuigschrift* printing flow puts a Belgian RIZIV `Getuigschrift voor verstrekte hulp` certificate onto a sheet of paper. There are two delivery modes:

1. **Manual mode** (`Meteor.users.certificateModes.MANUAL`) — the user has hand-written or stamped the certificate book number and certificate number on a pre-printed RIZIV booklet, and Halingo just records that those numbers were used. There is no actual printing on paper from Halingo's side; the user fills in the rest of the booklet by hand.
2. **Printer mode** (`Meteor.users.certificateModes.PRINTER`) — Halingo renders the certificate as an HTML document and prints it directly onto a pre-printed RIZIV form. The reference printer is the EPSON LX-350 (24-pin matrix), and the alignment of the rendered fields on top of the pre-printed form is controlled by per-user `top` / `left` offset values in centimetres.

The pre-printed form is loaded as a background image (`/img/certificate_<locale>.jpg`) only in the *preview* state — when actually printing, the JPG is omitted and only the data fields render so that they overlay the user's physical pre-printed form.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| Certificate modal | overlay on the patient invoice page | `CertificateModal` | `modules/invoices/patient/certificate/CertificateModal.jsx` |
| Certificate render | inside the modal preview and as the print payload | `Certificate` | `modules/invoices/patient/certificate/Certificate.jsx` |
| Multiple-certificates picker | overlay on the patient invoice page | `MultipleCertificatesModal` | `modules/invoices/patient/list-view/MultipleCertificatesModal.jsx` |
| Single-certificate state badge | inline | `CertificateState` | `modules/invoices/patient/list-view/CertificateState.jsx` |

The flow:
1. The user opens a patient invoice that has at least one certificate.
2. They click the certificate state badge → `CertificateModal` opens.
3. The modal previews the certificate (with the JPG background) on the right and the form on the left.
4. The user picks **Manual** or **Printer** tab and fills in the required fields.
5. They click "Print" → the modal renders the same `Certificate` component with `isPrint: true` (which **drops the JPG background**), passes the HTML to `Util.printHTMLElement`, and on success calls `printCertificate.call(...)` to record the print in the database.

## The two modes side-by-side

| Aspect | Manual mode | Printer mode |
|---|---|---|
| Required input | `bookNumber` (regex `\d{2}\*\d{4}`) AND `certificateNumber` (1–50) | `printerNumber` (any positive number) |
| Background JPG in print | not applicable (no print) | omitted (`isPrint: true` removes it) |
| What gets recorded in `certificate.numbers` | `${bookNumber}/${certificateNumber}` | the bare `printerNumber` |
| Persisted in user profile | `profile.certificateNumber.bookNumber` and `.certificateNumber` for the next default | `profile.certificateNumber.printerNumber` |
| User settings persisted | `settings.certificates.mode = "manual"` | `settings.certificates.mode = "printer"` plus `settings.certificates.offset.{top, left}`, `settings.certificates.therapistInformation`, `settings.certificates.therapistInformationPractice` |
| Therapist info on certificate | not rendered | optional toggle, controlled by `therapistInformation` and `therapistInformationPractice` |
| Cash-paid override | not applicable | optional toggle (`cash`) which renders the patient amount instead of the literal `*0*` placeholder |

## The print method

`invoices.certificates.print` (`patientFileInvoices/methods.js:697-776`) is the database side. The validation schema is:

```js
// methods.js:671-696
printCertificateSchema = new SimpleSchema({
  bilanId: String,
  certificateNumber: Object,
  "certificateNumber.bookNumber":      { type: String, optional: true },
  "certificateNumber.certificateNumber": { type: Number, max: 50, optional: true },
  "certificateNumber.printerNumber":   { type: Number, optional: true },
  invoiceId: { type: String, regEx: SimpleSchema.RegEx.Id },
  mode: { type: String, allowedValues: Object.values(Meteor.users.certificateModes) },
  offset: Meteor.users.UserSettings.getObjectSchema("certificates.offset"),
  therapistInformation:         { type: Boolean, optional: true },
  therapistInformationPractice: { type: Boolean, optional: true },
  treatmentId: { type: String, regEx: SimpleSchema.RegEx.Id },
});
```

The method:

1. **Permission**: caller must be the invoice owner OR have `invoices.edit` (`methods.js:712-718`).
2. **Cancellation**: refuses if `invoice.isCanceled` (`methods.js:719-721`).
3. **Locate the certificate** by `(treatmentId, bilanId)`. If not found: `invoices.certificates.print.noCertificate`.
4. **Mode validation**:
   - In **printer mode**: requires `certificateNumber.printerNumber`. Else `invoices.certificates.print.printerNumberRequired`.
   - In **manual mode**: requires `bookNumber` matching `\d{2}*\d{4}` AND `certificateNumber`. Else `invoices.certificates.print.certificateAndBookNumberRequired`.
5. **Persist user settings** to `Meteor.users.update(this.userId, { $set: ... })`:
   - `settings.certificates.mode`
   - `settings.certificates.offset` (the two cm values)
   - `settings.certificates.therapistInformation`
   - `settings.certificates.therapistInformationPractice`
   - For manual mode: `profile.certificateNumber.{bookNumber, certificateNumber}`
   - For printer mode: `profile.certificateNumber.printerNumber`
6. **Append the printed number** to the certificate via:
   ```js
   PatientFileInvoices.update(
     { _id: invoiceId, certificates: { $elemMatch: { treatmentId, bilanId } } },
     { $addToSet: {
         "certificates.$.certificate.numbers": {
           createdAt: new Date(),
           number: isManuallyPrinted
             ? `${certificateNumber.bookNumber}/${certificateNumber.certificateNumber}`
             : certificateNumber.printerNumber,
         }
     }}
   );
   ```

This means:

- **Multiple prints accumulate.** Every print appends a new entry to `certificate.numbers`. The newest entry is the most recent number used.
- **Duplicates are detected, not prevented.** The `CertificateModal` checks `isDuplicate = certificate.numbers.length > 0` (`CertificateModal.jsx:237`) and shows a warning, but the `printCertificate` method itself does not refuse a duplicate — it just appends another number entry.
- **The `$addToSet` semantics** mean that if you somehow attempted to push the exact same `{createdAt, number}` object twice, it would be deduplicated; but `createdAt: new Date()` makes every call's payload unique by definition.

The "first" entry (sorted by `createdAt`) is what `Certificate.jsx:23-32` uses as the canonical certificate number on the printed document.

## The render — `Certificate.jsx`

The certificate is rendered as a fixed 484 × 1311 pixel `<div>` with absolute-positioned children at hand-tuned coordinates. The reference image is the per-locale JPG (`/img/certificate_nl.jpg` or `/img/certificate_fr.jpg`).

### Coordinate system

`Certificate.jsx:99-105`:

```js
const width  = 484;
const height = 1311;
const scale = this.props.isPrint
  ? 10.2 / 12.805833333
  : Math.min(Math.max(window.innerHeight || 0, 800) / height, 1);
```

The "print scale" `10.2 / 12.805833333 ≈ 0.7965` is the empirically calibrated ratio that maps the 484×1311 px canvas to the physical RIZIV form's printable area on an A4 sheet — `10.2 cm` is the form's printable width and `12.805833333 cm` is the equivalent at the chosen pixel-per-cm density. This is the constant the user does **not** configure.

The user-configurable margin offsets are `top` and `left`, both in centimetres, applied at the **wrapper** level:

```js
// Certificate.jsx:316-326
if (this.props.isPrint) {
  const offsetTop = +offset.top + (isFirefox ? 1.4 : 1.85);
  if (offsetTop > 0) {
    wrapperStyle.paddingTop = `${offsetTop}cm`;
  } else {
    wrapperStyle.marginTop = `${offsetTop}cm`;
  }
  wrapperStyle.marginLeft = `${+offset.left - (isFirefox ? 0.35 : 0)}cm`;
}
```

So the per-browser baseline offset is **1.85 cm top in Chrome** (and most), **1.4 cm top in Firefox**, **0.35 cm left lift in Firefox**. The user's `offset.top` and `offset.left` are added on top of these baselines. This encodes the empirical observation that Firefox renders the page slightly differently from Chrome on the same printer.

The choice of `paddingTop` vs `marginTop` based on `offsetTop > 0` is to handle the edge case where the user wants a *negative* offset (lifting the form upward from the baseline) — `paddingTop` cannot be negative, so `marginTop` is used instead.

### The data fields

The `Certificate` component renders these fields at hardcoded coordinates (`Certificate.jsx:142-303`):

| Coordinate (top, left) | Field | Source |
|---|---|---|
| `62, 25` (region) | Patient name | `invoice.patient.name` |
| `+40, +160` (relative) | Insurance name | `invoice.insuranceName` |
| `+65, +33` | Patient INSZ | `invoice.patient.SSN` |
| `+100, +125` | Patient address | `invoice.patient.address.street`, `postalCode city` |
| `284, 25` | Patient name (second occurrence) | `invoice.patient.name` |
| `341, 3` and `341, 243` | Two columns of reimbursable events | left half = first 17 events, right half = next 17 (using `MAX_TREATMENTS_PER_CERTIFICATE / 2` math) |
| Per event row: 3 columns | Date (`DD/MM/YYYY`), nomenclatuurcode (translated via `translate(event.code)`), optional video-consultation extra code (`Treatments.VideoConsultationCode = 792433`) | `getEventsOfCertificate` |
| `+1, +168` (relative to 681) | Prescriber name | `certificate.prescriberName` |
| `+21, +111` then `+0, +32` then `+0, +68` | Prescription date day / month / year | three separate divs to land on the form's three pre-printed boxes |
| `+61, +175` | Prescriber RIZIV | `certificate.prescriberRiziv` |
| `+81, +363` then `+32` / `+62` | Approval date day / month / year | three separate divs |
| `+101, +132` | Treatment start day | three divs |
| `+0, +29` / `+0, +53` | Treatment start month / year |
| `+0, +114` / `+145` / `+175` | Treatment end day / month / year |
| `907, 375` | Reimbursable amount in EUR | sum of `event.price` over reimbursable events |
| `950, 100` | One of: certificate number (manual mode) OR therapist info block (printer mode with `therapistInformation: true`) |
| `1100, 270` | Date stamp | first `numbers` entry's `createdAt`, formatted DD/MM/YYYY |
| `1189, 235` | User company number | `invoice.user.companyNumber` |
| `1288, 220` (print) or `1243, 160` (preview) | Cash amount or `*0*` | when `cash: true`, renders `(invoice.getAmountPatient() / 100).toFixed(2)`; otherwise the literal `*0*` |

The two-column event layout implements `MAX_TREATMENTS_PER_CERTIFICATE = 34` (max 17 per column, two columns = 34). The diagonal line drawn at the bottom of the events region (`Certificate.jsx:75-91`) is a strikethrough that fills any unused row space — the height of the unused space is computed as `340 - usedHeight`, the diagonal angle is `atan(offsetHeight / offsetWidth)`, and the line is rendered as a rotated 1px-tall border.

### Manual mode vs printer mode rendering

In **manual mode** (`isPrinterMode === false`), the `950, 100` slot renders `getCertificateNumber()`, which is:
- The first existing entry in `certificate.numbers` if any (so re-printing a previously-printed certificate shows the original number);
- Otherwise the input the user just typed (`bookNumber/certificateNumber`).

In **printer mode** with `therapistInformation: true`, the `950, 100` slot renders the therapist (or practice) identification block — a multi-line block with the therapist's name, RIZIV, address, and (if `therapistInformationPractice: true`) the practice's name and VAT.

In **printer mode** with `therapistInformation: false`, the slot is **empty** — because the user is supposed to be using a pre-stamped form on which the therapist info is already printed.

### The cash toggle

In printer mode, the modal exposes a `cash` switch (`CertificateModal.jsx:329-333`). When checked, the bottom-right of the certificate renders the patient amount (`(invoice.getAmountPatient() / 100).toFixed(2)`). When unchecked, the literal string `*0*` is rendered. The `*0*` form is what the convention requires when the patient is not paying remgeld at the moment of the visit (because it will be invoiced later or because the invoice is fully derdebetaler).

> ⚠️ The cash switch is **not persisted**. The next opening of the modal defaults back to unchecked. The two `therapistInformation*` switches **are** persisted to `settings.certificates.*`.

## The user settings

`Meteor.users.UserSettings` schema (`api/users/users.jsx:99-142`):

```js
certificates: {
  mode: String (allowedValues: ['manual', 'printer'], defaultValue: 'manual'),
  offset: {
    left: Number (optional),
    top:  Number (optional),
  },
  therapistInformation:         Boolean (optional),
  therapistInformationPractice: Boolean (optional),
}
```

And `Meteor.users.UserProfile`:

```js
certificateNumber: {
  bookNumber:        String (regex: /\d{2}\*\d{4}/),
  certificateNumber: Number (max: 50),
  printerNumber:     Number,
}
```

The "next certificate number" the user sees pre-filled in the modal is computed by `Meteor.users.getNextCertificateNumber()` (not read in detail this pass), called from `CertificateModal.jsx:124`. The simplest reasonable implementation is `certificateNumber + 1` for manual mode (rolling over the booklet) and `printerNumber + 1` for printer mode.

## Multiple-certificate flow

`MultipleCertificatesModal.jsx` is what the user sees when an invoice has multiple certificates (e.g. one patient with two treatments under different brackets, or one treatment with both an initial and an evolution bilan being invoiced together). It lists all certificates and lets the user open the print modal for each separately. There is **no bulk-print-all-certificates flow** — each certificate is printed individually, with its own number.

## State propagation

When a certificate is printed for the first time, two things happen:

1. The `certificate.numbers` array on the patient invoice grows by one entry.
2. **The certificate becomes eligible to be folded into a Verzamelstaat.** The Verzamelstaat generation query (`insuranceInvoices/server/util.js:65-69`) requires `certificate.numbers.0` to exist before the certificate can be aggregated.

The patient invoice's `state` does **not** automatically change to `printed` on certificate print. The "printed" status is for the *invoice as a whole*, set via `printInvoice` (`patientFileInvoices/methods.js:469-494`), and refers to printing the patient-facing PDF, not the certificate.

When the user later **prints again** (e.g. because the original was lost), a new entry is appended. The certificate displayed by `Certificate.jsx:23-32` always uses the **first** entry, so the original number stays visible. The "duplicaat" warning is shown by the modal (`CertificateModal.jsx:237`).

In printer mode, the modal also offers an "Opnieuw printen zonder duplicaat" link (`CertificateModal.jsx:301`) which calls `printOnly()` to render the certificate without registering the print in the DB. This is the workflow for re-printing the existing physical certificate without burning a new printer-counter number.

## Permissions

| Action | Permission |
|---|---|
| Generate the in-memory certificate metadata | (none — automatic on invoice creation) |
| Re-generate certificate metadata for a treatment | `invoices.edit` *or* invoice owner |
| Print certificate (record number) | `invoices.edit` *or* invoice owner |
| Set certificate state (open / printed / paid) | `invoices.edit` *or* invoice owner (via `setCertificateState`) |

## Notable details

- **The 484 × 1311 px canvas size is hardcoded** and matches the proportions of a Belgian RIZIV `getuigschrift voor verstrekte hulp` form when scaled by `10.2/12.805833333 ≈ 0.7965` to fit a 10.2 cm wide printable area on A4. Changing the form layout requires recoding the absolute positions.
- **The per-browser fudge factors** (`1.4 cm` Firefox top vs `1.85 cm` Chrome top, `0.35 cm` Firefox left lift) are baked into the print path — see `Certificate.jsx:316-326`. They cannot be configured per-user.
- **There is no per-printer profile.** All printer-mode users share the same baseline; only the `top`/`left` offsets are per-user.
- **The reference printer is the EPSON LX-350** (24-pin matrix). The codebase does not check the printer model — it relies on the browser's print dialog to send the rendered HTML to whatever printer the user picked.
- **The diagonal strikethrough line** that fills unused event rows is computed via trigonometry (`Certificate.jsx:65-91`) and rotated with `transform: rotate(-${angle}rad)`. This is the visual cue the convention requires to show that the unused rows are intentionally blank.
- **The video consultation marker code (`792433`)** is rendered as a third inline column next to the regular code on every event row whose `meta.location === 6` (`Certificate.jsx:48-62`).
- **`translate(event.code, ...)`** is called on the nomenclatuurcode itself (`Certificate.jsx:59`). Since codes are integers, this is unlikely to find an i18n key — the i18n library presumably echoes the input back. Verify in the running app whether codes render as bare numbers.
- **The certificate JPG background is omitted in print mode** (`Certificate.jsx:144-151`) so that the data fields can overlay a physical pre-printed form. If the user accidentally picks "print to PDF" instead of an actual printer, they get a blank page with only the data — *not* a renderable certificate. This is a known footgun; the helpdesk has a section about it.
- **There is no "preview before print" guarantee** — the modal preview uses the JPG background, but the print path drops it. So the alignment the user sees in the preview is not exactly what comes out of the printer; the offset has to be tuned by trial and error against the actual physical form.
- **Duplicates are *recorded* but not blocked.** The system trusts the user to know what they are doing.
- **The `cash` toggle in printer mode is not persisted** but the `therapistInformation*` toggles are. The asymmetry is by design — the cash status is per-invoice while the therapist info is a per-user preference.
- **Certificate state is independent of patient invoice state.** A patient invoice can be `paid` while one of its certificates is still `open` on the insurance side, and vice versa.

## Helpdesk overlap

The Zendesk material on certificate printing is among the most extensive in the helpdesk. It covers:
- The EPSON LX-350 reference and the existence of the offset adjustments.
- The Manual vs Printer mode distinction.
- The "stamp the form first" workflow for printer mode without `therapistInformation`.
- The Medattest booklet supplier.
- The duplicate warning.

The helpdesk does **not** cover:
- The `\d{2}*\d{4}` book-number regex.
- The 1–50 certificate-number cap (the convention's "50 certificates per booklet" rule).
- The browser-specific top/left baselines.
- The cash-toggle behaviour and what `*0*` means.
- The relationship between certificate state and Verzamelstaat eligibility.
- The `Treatments.VideoConsultationCode` extra-column rendering for telelogopedie.

## Source files

- `app/imports/api/invoices/patientFileInvoices/methods.js:631-776` — `generateCertificate`, `printCertificate`, `printCertificateSchema`.
- `app/imports/api/invoices/patientFileInvoices/server/util.js:244-475` — `_generateCertificates` (the upstream that creates the certificate sub-document on every invoice).
- `app/imports/api/users/users.jsx:35-142` — `certificateModes` enum, UserProfile.certificateNumber, UserSettings.certificates.
- `app/imports/api/practice/methods.jsx:440-475` — `getPracticeCertificate` (used by the modal to fetch practice info for the therapist-information block).
- `app/imports/modules/invoices/patient/certificate/Certificate.jsx` — render component.
- `app/imports/modules/invoices/patient/certificate/CertificateModal.jsx` — print modal.
- `app/imports/modules/invoices/patient/list-view/MultipleCertificatesModal.jsx`
- `app/imports/modules/invoices/patient/list-view/CertificateState.jsx`
- `public/img/certificate_nl.jpg`, `public/img/certificate_fr.jpg` — pre-printed form background images for the preview.
