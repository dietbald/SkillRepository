# Shared utilities

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none (infrastructure). Verify against running app before promoting to `manual/`.

## What it is

`app/imports/api/shared/` is a catch-all for cross-cutting server helpers that do not belong to a specific API module. It exposes four Meteor methods — `pdf.generate`, `getZipCodesByZipCode`, `getZipCodesByCounty`, and the raw `impersonateUser` — backed by two server files (`server/util.js` + `server/zipcode-belgium.json`). The client-side `util.js` is a thin stub that re-exports the server helpers when run on the server only.

This file documents all of the shared module at once. Each of the bigger items has its own dedicated file:

- **`pdf_generation.md`** — the `generatePDF` pipeline.
- **`belgian_zip_code_lookup.md`** — the ZIP / county lookup.
- **`admin_impersonation.md`** — `impersonateUser`.

## Where it lives in the UI

N/A — infrastructure. Callers:

- `generatePDF` is called from invoice print / mail paths and from patient-file document generation.
- `getZipCodesByZipCode` / `getZipCodesByCounty` are called from address autocompletion fields in patient and practice forms.
- `impersonateUser` is **not called from the UI at all** in the current codebase — see `admin_impersonation.md`.

## Data model

- **`zipcode-belgium.json`** — a 16 544-line JSON array bundled under `app/imports/api/shared/server/`. Each element is `{ zip: string, city: string, lng: number, lat: number }`. No MongoDB collection; this is a static data file.
- No collections are defined in `api/shared/`.

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

Signature: `(html: string, options?: blackbox) => Buffer`. Takes a raw HTML fragment (just the body — the wrapper chrome is added in the server helper), passes it through `html-pdf` with `{format: "A4", orientation: "portrait"}` merged into the options, and returns a Node `Buffer` with the rendered PDF. See `pdf_generation.md` for the full pipeline.

### `getZipCodesByZipCode` — `app/imports/api/shared/methods.js:19-32`

```js
export const getZipCodesByZipCode = new LoggedInValidatedMethod({
    name: "getZipCodesByZipCode",
    validate: new SimpleSchema({
        query: { type: String, optional: true }
    }).validator(),
    run({ query }) {
        if (!this.isSimulation) {
            return SharedUtil.getZipCodesByZipCode(query);
        }
    }
});
```

Signature: `({query?: string}) => Array<{zip, city, lng, lat}>`. Returns every row in the bundled Belgian ZIP list whose `zip` contains the query substring. Backed by the in-memory JSON — no MongoDB, no external API. See `belgian_zip_code_lookup.md`.

### `getZipCodesByCounty` — `app/imports/api/shared/methods.js:34-47`

```js
export const getZipCodesByCounty = new LoggedInValidatedMethod({
    name: "getZipCodesByCounty",
    validate: new SimpleSchema({
        query: { type: String, optional: true }
    }).validator(),
    run({ query }) {
        if (!this.isSimulation) {
            return SharedUtil.getZipCodesByCounty(query);
        }
    }
});
```

Signature: `({query?: string}) => Array<{zip, city, lng, lat}>`. Despite the name, the server implementation filters by `city` substring match, not by "county":

```js
// server/util.js:58-60
getZipCodesByCounty(query) {
    return _.filter(zipCodes, (zipCode) => zipCode.city.indexOf(query) > -1);
},
```

So "by county" is a misnomer — this is a case-sensitive substring match on `city`. Callers use it as the city-autocomplete endpoint.

### `impersonateUser` — `app/imports/api/shared/methods.js:49-71`

```js
Meteor.methods({
    impersonateUser: function(userId) {
        if (!this.isSimulation) {
            if (!Meteor.userId()) {
                throw new Meteor.Error('impersonateUser.unauthorized',
                    'Cannot impersonate user if not connected');
            }

            const user = Meteor.users.findOne(Meteor.userId());
            if (!user.roles || user.roles.indexOf('admin') === -1) {
                throw new Meteor.Error('impersonateUser.unauthorized',
                    'Unauthorized to impersonate user');
            }

            if (Meteor.users.find({_id: userId}, {limit: 1}).count() === 0) {
                throw new Meteor.Error('impersonateUser.userDoesntExist',
                    'Cannot impersonate user that does not exist');
            }

            this.setUserId(userId);
        }
    }
});
```

This is a raw `Meteor.methods({...})` call, **not** a `LoggedInValidatedMethod` or `PermissionValidatedMethod`. It therefore bypasses the method audit log wrapper. See `admin_impersonation.md` for the full treatment.

## Publications

None. `api/shared/` does not publish anything.

## Server helpers — `app/imports/api/shared/server/util.js`

```js
import Future from "fibers/future";
import { Meteor } from "meteor/meteor";
import * as pdf from "html-pdf";

import zipCodes from "./zipcode-belgium";

export const SharedUtil = (function () {
  const _generatePDF = function (html, options) {
    const fut = new Future();
    html = `
      <html>
        <head>
          <style>
            * { -webkit-print-color-adjust: exact; ... box-sizing: border-box; }
            .textColorRed { color: red !important; transform: rotate(-30deg); ... }
            table{border-collapse: collapse}
          </style>
          <link rel="stylesheet" type="text/css" href="${Meteor.absoluteUrl("/merged-stylesheets.css")}">
        </head>
        <body class="wrapper" style="padding-top:10px;padding-bottom:10px;">${html}</body>
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
    getZipCodesByCounty(query) {
      return _.filter(zipCodes, (zipCode) => zipCode.city.indexOf(query) > -1);
    },
    getZipCodesByZipCode(query) {
      return _.filter(zipCodes, (zipCode) => zipCode.zip.indexOf(query) > -1);
    },
  };
})();
```

Three functions on one IIFE object. No dependencies between them.

## Client stub — `app/imports/api/shared/util.js`

```js
export const SharedUtil = (function() {
    return {}
})();

if (Meteor.isServer) {
    import _ from 'lodash';
    import {SharedUtil as util} from "./server/util";
    _.extend(SharedUtil, util);
}
```

On the client, `SharedUtil` is an empty object — any attempt to call `SharedUtil.generatePDF` on the client is a silent no-op. The Meteor methods `pdf.generate` / `getZipCodesByZipCode` / `getZipCodesByCounty` all route through `if (!this.isSimulation)` so optimistic-UI simulation returns undefined and the real work happens only on the server.

## User-visible behaviour

- Any time a PDF is generated (invoice print, invoice mail, patient report export), the user sees a short delay while `html-pdf` renders.
- Address fields in the patient profile, patient contact, and practice address forms autocomplete against the ZIP JSON — both "type a ZIP to get the city" and "type a city to get the ZIP" are wired.
- `impersonateUser` has no UI surface; no screen calls it.

## Permissions

- `generatePDF`, `getZipCodesByZipCode`, `getZipCodesByCounty` require a logged-in user but no further role — they extend `LoggedInValidatedMethod`.
- `impersonateUser` requires `Meteor.user().roles` to contain the literal string `"admin"` — not the practice `"admin"` role, but a **global Meteor.users `.roles` array**. See `admin_impersonation.md`.

## Notable details

- **Title-case method vs sentence-case method.** `pdf.generate` uses dotted-lowercase naming (Halingo convention), but `getZipCodesByZipCode` / `getZipCodesByCounty` use camelCase naming. Neither is wrong; noted for consistency.
- **`getZipCodesByCounty` searches by city, not county.** Noted because the name would mislead you.
- **Zip lookup is a full linear scan** of ~16 000 rows per call. No index, no trie. Fast enough in practice because the dataset is small; still O(n) per keystroke on the autocomplete.
- **`generatePDF` is synchronous** inside a Meteor fiber — the caller blocks until `html-pdf` returns. For big documents this ties up the Meteor method queue for the caller's session. See `pdf_generation.md`.
- **No rate limiting** on any of the four methods. A misbehaving client can pound `getZipCodesByZipCode` with thousands of calls.
- **`impersonateUser` doesn't reverse itself.** There is no "stop impersonating" method — see `admin_impersonation.md`.

## Helpdesk overlap

None. The helpdesk does not describe ZIP autocomplete, PDF generation mechanics, or impersonation.

## Source files

- `app/imports/api/shared/methods.js` — the four method definitions
- `app/imports/api/shared/util.js` — client stub
- `app/imports/api/shared/server/index.js` — imports `../methods`
- `app/imports/api/shared/server/util.js` — server implementations
- `app/imports/api/shared/server/zipcode-belgium.json` — static data
