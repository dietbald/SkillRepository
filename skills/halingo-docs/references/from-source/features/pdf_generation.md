# PDF generation

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none (infrastructure — used by invoices, certificates, reports, but not described). Verify against running app before promoting to `manual/`.

## What it is

A single server helper — `SharedUtil.generatePDF(html, options)` — that renders an HTML fragment to an A4 PDF via the `html-pdf` npm package (which in turn drives PhantomJS under the hood). The helper is exposed to clients as the Meteor method `pdf.generate` and is also used directly from server code. There is no headless-Chrome pipeline, no Puppeteer, no external print service.

## Where it lives in the UI

N/A directly — but the pipeline is triggered by user actions on:

- **Patient invoice print** — `app/imports/modules/patientfiles/invoices/PrintPage.jsx:13` — invoice print builds an `InvoiceTemplate` React component, renders it to static HTML via `Util.componentToStaticHtml`, and hands it to `generatePDF`.
- **Patient invoice mail** — `app/imports/api/invoices/patientFileInvoices/server/util.js:661` — same pipeline, then the resulting Buffer is attached to a nodemailer message as `invoice.pdf`.
- **Patient file actions** — `app/imports/modules/invoices/patient/PatientFileActions.jsx:32,57` — invoice print and mail shortcuts.
- **Patient reports / documents** — report export paths use the same method.

The user experiences PDF generation as a short delay after clicking "Print" or "Mail" — there is no progress indicator beyond a spinner on the button.

## Data model

None. The PDF is a one-shot in-memory buffer:

- Input: HTML string (and an optional options blackbox).
- Output: Node `Buffer` containing the PDF bytes.
- Storage: **none**. The buffer is either returned to the client for download or attached to an outgoing email. Nothing is written to disk or GridFS by the helper itself.

Callers handle persistence themselves — invoice-mail attaches the Buffer to a nodemailer message and lets it go out with the email. Print paths stream the Buffer back to the client for immediate download.

## Methods (Meteor)

### `pdf.generate` — `app/imports/api/shared/methods.js:6-17`

```js
export const generatePDF = new LoggedInValidatedMethod({
    name: "pdf.generate",
    validate: new SimpleSchema({
        html: String,
        options: { type: Object, blackbox: true, optional: true }
    }).validator(),
    run({ html, options }) {
        if (!this.isSimulation) {
            return SharedUtil.generatePDF(html, options);
        }
    }
});
```

Signature: `({html: string, options?: object}) => Buffer`.

- Logged-in users only. No further permission check — any signed-in user can generate a PDF.
- `options` is blackbox, passed straight through to `html-pdf`.
- Simulation returns `undefined`; the real call runs server-side.

## Publications

None.

## The full pipeline — `app/imports/api/shared/server/util.js:1-66`

```js
import Future from "fibers/future";
import { Meteor } from "meteor/meteor";
import * as pdf from "html-pdf";

import zipCodes from "./zipcode-belgium";

export const SharedUtil = (function () {
  const _generatePDF = function (html, options) {
    const fut = new Future();

    // TODO FIX CSS SERVER SIDE!!
    html = `
      <html>
        <head>
          <style>
            * {
              -webkit-print-color-adjust: exact;
              -webkit-box-sizing: border-box;
              -moz-box-sizing: border-box;
              box-sizing: border-box;
            }

            .textColorRed {
              color: red !important;
              transform: rotate(-30deg);
              -webkit-transform: rotate(-30deg);
              -moz-transform: rotate(-30deg);
              -ms-transform: rotate(-30deg);
              -o-transform: rotate(-30deg);
            }

            table { border-collapse: collapse }
          </style>
          <link rel="stylesheet" type="text/css"
                href="${Meteor.absoluteUrl("/merged-stylesheets.css")}">
        </head>
        <body class="wrapper" style="padding-top:10px;padding-bottom:10px;">
          ${html}
        </body>
      </html>`;

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.log("ERR", err);
        throw new Error("pdf.generate.error");
      }
      fut.return(buffer);
    });

    return fut.wait();
  };

  return {
    generatePDF(html, options) {
      _.extend(options, { format: "A4", orientation: "portrait" });
      return _generatePDF(html, options);
    },
    // ... getZipCodesBy* helpers live here too
  };
})();
```

Steps, one by one:

1. **Wrap the HTML**. The caller passes just the body content; the helper prepends an `<html><head>` block with inline CSS (print-colour, box-sizing, an anti-pirate `.textColorRed` rotation class) and a `<link>` to `Meteor.absoluteUrl("/merged-stylesheets.css")` — the Meteor bundle's merged stylesheet. The body is wrapped in `<body class="wrapper" style="padding-top:10px;padding-bottom:10px;">`.
2. **Merge the options**. `generatePDF` always merges `{format: "A4", orientation: "portrait"}` into whatever the caller passed, so A4 portrait is the default and the caller can only add / override other options.
3. **Call `html-pdf`**. `pdf.create(html, options).toBuffer(callback)`. `html-pdf` spawns a **PhantomJS** process under the hood (this is what `html-pdf` v2+ does), loads the HTML, and returns the rendered PDF as a Buffer.
4. **Synchronise with Meteor's fiber**. The helper wraps the async callback in a `fibers/future` `Future`, so the caller's Meteor fiber blocks on `fut.wait()` until PhantomJS finishes. The effect is a synchronous API.
5. **Return the Buffer**. The Buffer is either sent back over DDP to the client (for print) or handed to nodemailer as an attachment (for mail).
6. **Error handling**. On a PhantomJS error, the helper `console.log`s `"ERR"` plus the error and throws `new Error("pdf.generate.error")`. The thrown error escapes `fut.wait()` up to the caller.

## User-visible behaviour

- Click "Print" on a patient invoice → a spinner → the browser downloads `invoice.pdf`.
- Click "Mail invoice" → the same pipeline runs but the Buffer goes out as an email attachment; the user never sees the file.
- Patient reports and clinical document exports follow the same pattern.
- On a PhantomJS failure, the user sees a generic error notification from the calling method — not a specific "PDF failed" message.

## Permissions

- `pdf.generate` is a `LoggedInValidatedMethod` with no extra permissions — any logged-in user can render arbitrary HTML to PDF on the server.
- Server-direct callers (`SharedUtil.generatePDF(...)`) check their own permissions before calling in — e.g. invoice-mail checks the patient-file permission first.

## Notable details

- **PhantomJS, not Chrome.** `html-pdf` is a very old package; it shells out to PhantomJS, which has been deprecated since 2018. This is the rendering engine whether you like it or not.
- **No headless-browser dance in Halingo's code.** The browser dance happens inside `html-pdf`'s own process, not in Halingo. Halingo just awaits a Buffer.
- **Synchronous fiber-blocking.** `fut.wait()` blocks the Meteor fiber for the caller's DDP session. For big PDFs (multi-page invoices with many events) this ties up the caller's method queue. No async / streaming variant exists.
- **CSS is fetched over HTTP** at render time: `Meteor.absoluteUrl("/merged-stylesheets.css")`. PhantomJS makes an HTTP GET to the same server from inside the render. Latency risk if the server is under load.
- **The `textColorRed` anti-piracy rotation class** is a curious artefact — it rotates red text 30° counter-clockwise. Probably used to render a "CANCELLED" / "VOID" watermark diagonally across cancelled invoices. Flag for product.
- **"TODO FIX CSS SERVER SIDE!!"** comment at `util.js:10` — long-standing known issue that the CSS inlining is not done server-side but via an HTTP round-trip.
- **The `print-color-adjust` CSS** ensures background colors (e.g. the practice colour band on invoice headers) are preserved in the PDF output.
- **No output caching.** Every print and every mail re-renders from scratch.
- **No page numbering helper.** Page numbers, if any, come from the template HTML itself.
- **Used by `patientFileReports` export, patient documents, and invoices (patient / insurance / commission / stripe).** The path through the codebase is always `template component → componentToStaticHtml(template, props, locale) → SharedUtil.generatePDF(html)`.

> ⚠️ Behaviour inferred from code; needs product validation — this pipeline probably predates the move to React function components and the broader `@aws-sdk` / modern-build world. A migration to Puppeteer / headless Chrome would be a noticeable win on reliability and output fidelity.

## Helpdesk overlap

None. The helpdesk describes "print" and "mail" invoice actions but does not describe the underlying pipeline, engine, or options.

## Source files

- `app/imports/api/shared/methods.js:6-17` — `pdf.generate` method
- `app/imports/api/shared/server/util.js:7-51` — `_generatePDF` server helper
- `app/imports/api/shared/server/index.js` — imports `../methods`
- `app/imports/api/shared/util.js` — client stub (no-op on client)
- `app/imports/api/invoices/patientFileInvoices/server/util.js:661` — invoice mail caller
- `app/imports/modules/patientfiles/invoices/PrintPage.jsx` — patient-file invoice print UI
- `app/imports/modules/invoices/patient/PatientFileActions.jsx:32,57` — action buttons
- `app/imports/modules/invoices/patient/PatientInvoicePage.jsx:61` — single-invoice viewer
