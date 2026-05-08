# R-waarden

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: not covered. The helpdesk mentions R-waarde once as a regulatory metric but does not document Halingo's calculation. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

An *R-waarde* is the RIZIV time-equivalent metric used to quantify a logopedist's annual workload. Each nomenclatuurcode has an associated R-value (an integer or half-integer like `9`, `15`, `17.5`, `35`) that approximates how much "RIZIV-equivalent time" the act represents. RIZIV uses the per-therapist annual sum of R-values to enforce activity ceilings and to compute statistics that drive the convention.

In Halingo, the R-waarde is computed **per event**, summed per month and per year, and displayed on the `/riziv` page next to the count of nomenclature-coded vs. non-coded sessions. It is not stored anywhere on the event document — it is computed on the fly from the event's nomenclatuurcode every time the RIZIV page loads.

## Where it lives in the UI

| Surface | Path | Component | Source |
|---|---|---|---|
| RIZIV statistics page | `/riziv` | `RizivPage` | `modules/riziv/RizivPage.jsx` |
| Year-over-year graph | inside the page | `RizivPageGraph` | `modules/riziv/RizivPageGraph.jsx` |

The page (`RizivPage.jsx`) is a four-tile dashboard:

1. **RIZIV logo** (per-locale image).
2. **R-Waarde total** for the selected year — `data[year].rValue.total` (`RizivPage.jsx:111`).
3. **Verstrekkingen met nomenclatuur** — count of reimbursable sessions that have a code (`data[year].withCode.total`).
4. **Verstrekkingen zonder nomenclatuur** — count of sessions that have no code (`data[year].withoutCode.total`).

Below the tiles, `RizivPageGraph` shows a 12-month bar chart of the same data set with year-over-year overlay. Each tile has its own year-selector dropdown.

## The Meteor method

`getRValueStatistics` is defined at `app/imports/modules/riziv/methods/methods.js:13-59`:

```js
new LoggedInValidatedMethod({
  name: 'riziv.r-value.statistics',
  validate: new SimpleSchema({
    practiceId: { type: String, regEx: SimpleSchema.RegEx.Id },
    userId:     { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
    years:      { type: Array, optional: true },
    'years.$':  SimpleSchema.oneOf(String, Number),
  }).validator(),
  async run({ practiceId, userId, years }) {
    userId = userId || this.userId;
    if (userId !== this.userId) {
      if (!PracticeUserUtil.checkUserPermission('riziv.r-value.statistics', this.userId, practiceId))
        throw new Meteor.Error('errors.permissions.riziv.r-value.statistics');
    }
    // 1. Find all distinct years that have events
    // 2. If `years` was passed, compute for each
    // 3. Otherwise compute for the latest 5 years
    // Each year's payload is { rValue, withCode, withoutCode } each with `total` + 12 months
  }
});
```

The aggregation pipeline:
1. `Events.rawCollection().aggregate([{ $match: { practiceId, userId, removed: { $ne: true } } }, { $project: { year: { $year: '$start' } } }, { $group: { _id: null, years: { $addToSet: '$year' } } }])` to find every distinct year with events for this user.
2. For each requested year (or the latest 5), call `RizivUtil.getRValueStatistics(practiceId, userId, year)`.

The result shape:

```js
{
  years: [2024, 2025, 2026],
  2024: {
    rValue:    { total: 1234, 0: 100, 1: 110, ..., 11: 95 },
    withCode:  { total: 220, 0: 18, ... },
    withoutCode: { total: 12, 0: 1, ... },
  },
  2025: { ... },
}
```

## The compute function

`RizivUtil.getRValueStatistics` lives in `app/imports/modules/riziv/server/util.js:56-106`. It walks every Events row in the year and computes three numbers per month:

```js
function _getRValueStatistics(practiceId, userId, year) {
  const start = moment(0).year(year).toDate();
  const end   = moment(0).year(year + 1).toDate();
  const result = {
    withCode:    { total: 0 },
    withoutCode: { total: 0 },
    rValue:      { total: 0 },
  };
  // 12 month buckets
  
  Events.find({
    practiceId,
    start: { $gte: start, $lt: end },
    state: { $ne: Events.states.ABSENT.value },
    ...userId ? { userId } : {}
  }).forEach((event) => {
    const month = moment(event.start).month();
    const treatment = treatmentsCache[event.treatmentId] || Treatments.findOne(event.treatmentId);
    treatmentsCache[event.treatmentId] = treatment;
    
    const rValue = _getRValueForEvent(event, treatment);
    result.rValue[month] += rValue;
    result.rValue.total += rValue;
    
    const count = event.getSessionCount(treatment);
    if (rValue > 0) {
      result.withCode[month]   += count;
      result.withCode.total    += count;
    } else {
      result.withoutCode[month] += count;
      result.withoutCode.total  += count;
    }
  });
  
  return result;
}
```

Notice the bucketing logic: an event with a positive R-value contributes its **session count** (not its R-value) to the `withCode` tally, and its R-value to the `rValue` tally. An event with no R-value (because no code) contributes its session count to `withoutCode`. So the three numbers are not on the same scale: `rValue.total` is a sum of half-integer R-values, while `withCode.total` and `withoutCode.total` are session counts.

## Per-event R-value derivation

`_getRValueForEvent` (`server/util.js:40-54`):

```js
function _getRValueForEvent(event, treatment) {
  if (!event.treatmentId
      || event.state === Events.states.ABSENT.value
      || !event.hasPayBack) return 0;

  treatment = treatment || Treatments.findOne(event.treatmentId);

  if (!treatment || treatment.isSupplementaryInsurance()) return 0;

  const code = treatment.getCodeForEvent(event);
  return code ? _getRValueForCode(code, event.start) : 0;
}
```

So the R-value is **zero** for any of:
- No treatment.
- Absent state.
- `hasPayBack: false`.
- Missing treatment record.
- Supplementary-insurance treatment (not RIZIV).
- The nomenclatuurcode lookup returned undefined.

For everything else, the code is dispatched to `_getRValueForCode(code, eventStart)`.

## Per-code R-value table

`_getRValueForCode` (`server/util.js:7-38`) is a hand-coded dispatch table that maps a nomenclatuurcode to an R-value:

```js
function _getRValueForCode(code, start) {
  const codeString = "" + code;
  const codeNumber = Number(code);

  if (codeString.startsWith("7010")) {
    return 17.5;
  } else if (codeNumber > 702000 && codeNumber < 710090) {
    return 35;
  } else if ([711012, 711115, 711211, 712014, 712110, 712213].indexOf(codeNumber) >= 0) {
    return 35;
  // Group sitting
  } else if ([713016, 713112, 713215, 714011, 714114, 714210].indexOf(codeNumber) >= 0) {
    if (start < moment("2023-05-01")) {
      return 17.5;
    } else {
      return 15;
    }
  } else if ([724415, 724430, 724485].indexOf(codeNumber) >= 0) {
    return 17.5;
  } else {
    switch (codeString.charAt(3)) {
      case "3": return 17.5;
      case "6": return 35;
      case "4": return 9;
      default:  return 0;
    }
  }
}
```

### What this means in plain English

| Rule | R-value | Example codes |
|---|---|---|
| Code starts with `7010` | `17.5` | `701013`, `701002` (initial bilan default, evaluation hospitalisation) |
| Code numerically in `(702000, 710090)` (exclusive) | `35` | `702015` (default evolution bilan), `704012`, `704115`, `706016` |
| Code is one of the 6 hardcoded **60-min individual session** codes | `35` | `711012`, `711115`, `711211`, `712014`, `712110`, `712213` |
| Code is one of the 6 hardcoded **group session** codes | `17.5` (before 2023-05-01) **or** `15` (from 2023-05-01) | `713016`, `713112`, `713215`, `714011`, `714114`, `714210` |
| Code is one of the 3 hardcoded **`g` disorder** codes | `17.5` | `724415`, `724430`, `724485` |
| Otherwise — **4th character of the code**: |  |  |
|     `3` | `17.5` | e.g. `712316` (b.1 30-min office), `713311` (b.2 30-min office) — every 30-min disorder session has its 4th char as `3` |
|     `6` | `35` | e.g. `712611`, `714615`, `733611`, `711616` — every 60-min disorder session has its 4th char as `6` |
|     `4` | `9` | e.g. `712412`, `714630`, `723413`, `712481` — wait, `714630` is 4th char `6`. Let me re-check: the rule is `codeString.charAt(3)`, where indexes are zero-based, so `charAt(3)` is the **fourth** character. For `712412`: `7-1-2-4-1-2`, charAt(3) = `4`. These are typically the GROUP session codes within the disorder-specific subtree. |
|     anything else | `0` |  |

So the **fourth digit of a 6-digit nomenclatuurcode** acts as a heuristic R-value classifier:

- `3` → 30-minute individual session → 17.5
- `4` → group session in the disorder tree → 9
- `6` → 60-minute individual session → 35

Combined with the explicit `(702000, 710090)` range (which catches the bilan codes) and the per-code overrides for group sessions and the special 60-min codes that don't follow the digit pattern.

### The 2023-05-01 group-sitting rate change

The only date-conditional rule in the entire R-value computation is the group-sitting rate change on 2023-05-01:

```js
} else if ([713016, 713112, 713215, 714011, 714114, 714210].indexOf(codeNumber) >= 0) {
  if (start < moment("2023-05-01")) return 17.5;
  else return 15;
}
```

This is **the only code path that knows about a regulatory date**. All other R-values are date-independent. Other R-value changes (e.g. from a future RIZIV update) would require new branches with new date pivots.

## Permissions

| Action | Permission |
|---|---|
| View own R-waarde | (none — always allowed) |
| View another therapist's R-waarde | `riziv.r-value.statistics` |

The permission is held by owner and admin.

## User-visible behaviour

- The user navigates to `/riziv`.
- The page calls `getRValueStatistics({ practiceId, userId, years: [currentYear] })`.
- The four tiles render with the result.
- The graph below renders 12 month bars based on the same data.
- The user can switch the year via the dropdown in any tile (or the graph), which fires the same call with a different year.
- For older years (>5 years ago), the user has to explicitly request them — the initial load only fetches the latest 5.

## Notable details

- **R-values are not stored.** The computation is done on every page load from the live `Events` and `Treatments` collections. There is no cached field, no nightly job, no aggregate.
- **The treatment cache is local to one call.** Inside `_getRValueStatistics`, a `treatments` map keyed by `treatmentId` reuses the `Treatments.findOne` result across events for the same treatment. The cache is discarded at the end of the call.
- **The session count is taken from `event.getSessionCount(treatment)`** which can return 1 or 2 for a regular session (depending on subType), or `Math.ceil(durationMinutes / 30)` for an initial bilan, or `1` for a parent sitting GROUP / 2 for INDIVIDUAL, etc. (`events.jsx:1442-1457`). So the `withCode` and `withoutCode` totals are weighted by the same `sessionCount` that drives the bracket-consumption math in `_canBePaidBack`.
- **Absent events are excluded.** The aggregate query has `state: { $ne: Events.states.ABSENT.value }` (`server/util.js:77`).
- **Cancelled invoices do not affect R-waarde.** The R-waarde is computed from events, not from invoices. An event with `invoiceId` set on a cancelled invoice still has `invoiceId` cleared (`patientFileInvoices/methods.js:622`) but its R-waarde was already attributed to the year by virtue of having `hasPayBack: true`.
- **Supplementary-insurance treatments contribute zero R-waarde.** `_getRValueForEvent` returns 0 for `treatment.isSupplementaryInsurance()` because supplementary insurance is not part of the RIZIV convention.
- **The `* event.sessionCount` multiplier is commented out.** `_getRValueForCode(code, event.start)` is called as `_getRValueForCode(code, event.start) /* * event.sessionCount*/` (`server/util.js:53`). The `// commented out` comment suggests there was once an intention to multiply the per-session R-value by the event's session count, but this is currently not done. So a 60-min session contributes its single R-value (35) not (35 * 2 = 70). Verify with product whether this is intentional.
- **The `RizivUtil` is imported from `modules/riziv/util.js`** which is a small isomorphic shim that re-exports the server util on the server (`modules/riziv/util.js:1-12`).
- **The graph is fed by the same data shape**, with the year-axis dropdown re-fetching individual years on demand (`RizivPage.jsx:55-72`).

## Helpdesk overlap

The helpdesk does not document R-waarde computation in any depth. The glossary (`docs/glossary.md:21`) describes R-waarde generically as "RIZIV time-equivalent metric tracked alongside session counts; relevant for annual statistics".

## Source files

- `app/imports/modules/riziv/RizivPage.jsx` — UI page.
- `app/imports/modules/riziv/RizivPageGraph.jsx` — graph component.
- `app/imports/modules/riziv/RizivPageContainer.js` — container.
- `app/imports/modules/riziv/methods/methods.js` — `riziv.r-value.statistics` Meteor method.
- `app/imports/modules/riziv/util.js` — isomorphic shim.
- `app/imports/modules/riziv/server/util.js` — `_getRValueForCode`, `_getRValueForEvent`, `_getRValueStatistics`.
- `app/imports/modules/riziv/resources/client/nl.i18n.js` — `riziv.overview.r-value` and the two provision tiles.
- `app/imports/api/events/events.jsx:1442-1457` — `getSessionCount`.
- `app/imports/api/treatments/treatments.js:170-178` — `getCodeForEvent` (the upstream).
- `app/imports/startup/client/routes/riziv.js` — route.
