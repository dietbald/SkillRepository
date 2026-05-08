# Belgian ZIP code lookup

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none (infrastructure). Verify against running app before promoting to `manual/`.

## What it is

A two-method autocomplete API backed by a static JSON file of every Belgian ZIP code, the city it belongs to, and its lat/lng. Used by the address fields throughout the app — patient profile, patient contact persons, practice address, user address — to let the user type either a ZIP or a city name and pick from a dropdown of matches.

The data is **bundled into the server build, not fetched from any external API and not stored in MongoDB**. Updates require shipping a new bundle.

## Where it lives in the UI

N/A directly — it backs autocomplete fields in:

- Patient file address (`PatientFileProfileInformation.jsx` and related forms).
- Patient file contact persons.
- Practice address (`NewPracticePage`, practice settings).
- User profile address.

The end-user sees a dropdown that filters as they type into a ZIP or city field; the dropdown is populated via the two methods documented here.

## Data model — `app/imports/api/shared/server/zipcode-belgium.json`

A 16 544-line JSON array. First element:

```json
{
  "zip": "1000",
  "city": "Bruxelles",
  "lng": 4.351697,
  "lat": 50.8465573
}
```

Each row: `{ zip: string, city: string, lng: number, lat: number }`. Around ~2700 entries (3 fields per row + brackets ≈ 16 544 lines / 6). Covers every Belgian postcode including the Brussels sub-municipalities (Laeken=1020, Schaerbeek=1030, etc.).

The JSON is `import`-ed at module load time:

```js
// app/imports/api/shared/server/util.js:5
import zipCodes from "./zipcode-belgium";
```

so the entire array sits in memory for the lifetime of the Meteor process.

**No MongoDB collection** is involved.

## Methods (Meteor)

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

Server implementation — `app/imports/api/shared/server/util.js:61-63`:

```js
getZipCodesByZipCode(query) {
    return _.filter(zipCodes, (zipCode) => zipCode.zip.indexOf(query) > -1);
},
```

Returns every row whose `zip` contains the query as a substring (case-sensitive — but ZIPs are digits so that doesn't matter). With `query = "10"` you get `1000`, `1020`, `1030`, …, `1080`, …, `1190`, `2100`, `2160`, …, `4100`, `5100`, `5101`, … — anything with a `10` anywhere in it. With `query = ""` or `undefined` you get the whole list (16 544-line response over DDP — see "Notable details").

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

Server implementation — `app/imports/api/shared/server/util.js:58-60`:

```js
getZipCodesByCounty(query) {
    return _.filter(zipCodes, (zipCode) => zipCode.city.indexOf(query) > -1);
},
```

Filters by **`city` substring**, not by county. The method name is a misnomer — there is no `county` field in the data and no county-level lookup. Treat this as "search by city name". The filter is case-sensitive: `query = "Bru"` returns `Bruxelles` but not `bruxelles`.

## Publications

None. ZIP data is not published; the methods are called on demand from the autocomplete component.

## User-visible behaviour

- Typing a ZIP into the ZIP field triggers `getZipCodesByZipCode` and the dropdown shows matching `{zip} {city}` rows.
- Typing a city into the city field triggers `getZipCodesByCounty` and the dropdown shows matching cities.
- Selecting a row fills both fields together (ZIP and city), so picking "1000 Bruxelles" populates both.
- Country is hard-coded to `"BE"` in every address sent over the wire (see e.g. `rosa-patients.ts:719` for the patient sync).

## Permissions

- Both methods are `LoggedInValidatedMethod` with no extra permissions — any logged-in user can hit them.

## Notable details

- **Bundled, not fetched.** The data ships with the app build. Belgian ZIPs do change occasionally (post merges, new municipalities); updates require a redeploy.
- **No external API.** No bpost call, no third-party geocoder, no fallback. The lat/lng fields are present in the JSON but Halingo's address forms do not appear to use them — they seem to be there for future map use.
- **Linear scan per call.** `_.filter` walks all ~2700 rows on every keystroke. Cheap because the array is small, but not free.
- **Case-sensitive city search** — `query.indexOf` is the JS `String.prototype.indexOf`, which is case-sensitive. Typing "bruxelles" returns nothing; typing "Bru" works. The autocomplete UI may compensate by capitalising on the client side, but this should be checked.
- **Substring vs prefix match.** Both methods do contains-search, not prefix-search. Typing "ux" matches "Bruxelles". This is occasionally surprising but works for users who type the middle of a word.
- **Empty query returns the whole dataset.** Both validators mark `query` as optional and the filter returns everything when there's no query. A misbehaving client could pull 16k rows over DDP per call. No rate limit.
- **Belgium only.** No equivalent for France, Netherlands, Luxembourg etc. International addresses must be entered manually. Halingo is a Belgian-market product so this is by design.
- **No language variant handling.** Brussels is in the data as `Bruxelles` (French), not `Brussel` (Dutch). Antwerp is presumably `Antwerpen` not `Anvers`. Bilingual cities have a single canonical entry in whatever the JSON shipped with.

> ⚠️ Behaviour inferred from code; needs product validation — case sensitivity and the city-only "by county" naming feel like accidents. Worth flagging to product before promoting any of this to the user manual.

## Helpdesk overlap

None. The helpdesk does not describe how address autocomplete works.

## Source files

- `app/imports/api/shared/server/zipcode-belgium.json` — the static dataset
- `app/imports/api/shared/server/util.js:58-63` — `getZipCodesByZipCode`, `getZipCodesByCounty`
- `app/imports/api/shared/methods.js:19-47` — Meteor methods
- `app/imports/api/shared/util.js` — client stub
