# Nomenclature codes

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: not covered. The helpdesk references nomenclatuurcodes by example (`700991`, `701002`) but does not document the full lookup matrix or the algorithm. See `../../coverage_matrix.md`. Verify against running app before promoting to `manual/`.

## What it is

A *nomenclatuurcode* is the official RIZIV billing code that identifies what kind of care was delivered. Every reimbursable session on a Halingo certificate carries one. The code depends on **four dimensions**:

1. The treatment's **disorder type** (`a`, `b.1`, ..., `f`, `g`).
2. The event's **appointment type** (`SESSION`, `INITIAL_BILAN`, `EVOLUTION_BILAN`, `PARENT_SITTING`, `BILAN_RELAPSE`, `EVALUATION_SESSION`).
3. The event's **duration / sub-type** (`30`, `60`, `INDEFINITE`, `INDIVIDUAL`, `GROUP`, ...).
4. The event's **location** (`OFFICE`, `HOME`, `SCHOOL`, `REVALIDATION`, `HOSPITALISATION`, `VIDEO_CONSULTATION`).

Halingo encodes the full lookup table as a static JavaScript object literal in `app/imports/api/treatments/treatments.js:354-846` and resolves it at *invoice creation* time via `Treatment.getCodeForEvent(event)`.

This file documents the full table and the resolution algorithm. **Quote nomenclatuurcodes verbatim** — they are official RIZIV codes and must not be paraphrased.

## Where the lookup happens

The single resolution call is in `Treatment.getCodeForEvent` (`treatments.js:170-178`):

```js
getCodeForEvent(event) {
  const codes = this.codes(true);  // includeDefault: true (overlay DEFAULT subtree)
  return typeof codes === "object"
    ? _.get(codes, `${event.getAppointmentType()}.${event.getDuration()}.${event.getLocation()}`)
    : this.isSupplementaryInsurance()
      ? codes || "patient.treatments.supplementaryInsurance.abbreviation"
      : codes;
}
```

Where:
- `event.getAppointmentType()` returns `meta.type` (the integer 1–6 that indexes `Events.getAppointmentTypes()`).
- `event.getDuration()` returns `meta.subType` (or computes minutes from start/end if not set, `events.jsx:1372-1378`).
- `event.getLocation()` returns the `text` of `Events.getLocations()[meta.location]` (`OFFICE`, `HOME`, ...).

So the path traversed is:

```
disorderCodes[treatment.type] [appointmentType] [subType] [location] = <code>
```

If the disorder-specific tree has no entry for that path, the `_.merge` with the `DEFAULT` subtree (`treatments.js:148-152`) provides a fallback for the bilan/examination-style appointment types (2, 3, 5, 6).

If the resolution fails, `_generateCertificates` marks the event `isReimbursable: false` (`patientFileInvoices/server/util.js:411-414`) and the event is dropped from the certificate.

## The dimensions

### Disorder type — `Treatments.getTypes()`

```
a       Handicap
b.1     Afasie
b.2     Taalstoornis
b.3     Dyslexie / dysorthografie / dyscalculie
b.4     Schisis
b.5     Radiotherapie / chirurgie
b.6.1   Dysglossieën
b.6.2   Dysartrieën
b.6.3   Neuromusculaire aandoeningen
b.6.4   Stotteren
b.6.5   Interceptive orthodontie
c.1     Laryngectomie
c.2     Larynx - stemstoornissen
d       Gehoorstoornissen
e       Dysfagie
f       Dysfasie
g       (no helpdesk name; codes are 724415/724430/724485 — likely interceptive orthodontie variant)
supplementaryInsurance   not RIZIV — private supplemental insurance
```

### Appointment type — `Events.getAppointmentTypes()` (`events.jsx:49-119`)

| Numeric | Text | RIZIV use |
|---|---|---|
| `1` | `SESSION` | Regular reimbursable session |
| `2` | `INITIAL_BILAN` | Aanvangsbilan — split into 30-min units at invoice time |
| `3` | `EVOLUTION_BILAN` | Evolutiebilan |
| `4` | `PARENT_SITTING` | Ouderbegeleiding |
| `5` | `BILAN_RELAPSE` | Hervalbilan |
| `6` | `EVALUATION_SESSION` | Evaluatiesessie |

### Sub-type — `Events.getAppointmentSubTypes()` (`events.jsx:178-204`)

| Value | Text | Notes |
|---|---|---|
| `30` | `30_MINUTES` | sessionCount: 1 |
| `60` | `60_MINUTES` | sessionCount: 2 |
| `GROUP` | `GROUP` | sessionCount: 1 |
| `INDEFINITE` | `INDEFINITE` | Used for `INITIAL_BILAN` of disorder `b.4` (schisis) and bilans more generally |
| `INDIVIDUAL` | `INDIVIDUAL` | sessionCount: 2 (for parent sitting) |

### Location — `Events.getLocations()` (`events.jsx:137-176`)

| Numeric | Text | Icon |
|---|---|---|
| `1` | `OFFICE` | briefcase |
| `2` | `HOME` | home |
| `3` | `SCHOOL` | graduation-cap |
| `4` | `REVALIDATION` | medkit |
| `5` | `HOSPITALISATION` | hospital |
| `6` | `VIDEO_CONSULTATION` | video_chat |

## The static code table

The full `Treatments.getDisorderCodes()` table from `treatments.js:354-846`. The path is `[disorder][appointmentType][subType][location]`.

### `a` — Handicap

```
1 (SESSION)
  30
    OFFICE: 711314
    HOME: 711336
    SCHOOL: 711351
    REVALIDATION: 711373
    HOSPITALISATION: 711384
    VIDEO_CONSULTATION: 711314
```

Only one path is defined for `a`: 30-min sessions in any location. No 60-min, no group, no bilans.

### `b.1` — Afasie

```
1 (SESSION)
  30
    OFFICE: 712316
    HOME: 712331
    SCHOOL: 712353
    REVALIDATION: 712375
    HOSPITALISATION: 712386
    VIDEO_CONSULTATION: 712316
  60
    OFFICE: 712611
    HOME: 712633
    REVALIDATION: 712670
    HOSPITALISATION: 712681
    VIDEO_CONSULTATION: 712611
  GROUP
    OFFICE: 712412
    REVALIDATION: 712471
    HOSPITALISATION: 712482
    VIDEO_CONSULTATION: 712412
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `b.2` — Taalstoornis

```
1 (SESSION)
  30
    OFFICE: 713311
    HOME: 713333
    SCHOOL: 713355
    REVALIDATION: 713370
    HOSPITALISATION: 713381
    VIDEO_CONSULTATION: 713311
  60
    OFFICE: 711012
    VIDEO_CONSULTATION: 711012
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 711012
    VIDEO_CONSULTATION: 711012
  GROUP
    OFFICE: 713016
    VIDEO_CONSULTATION: 713016
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `b.3` — Dyslexie / dysorthografie / dyscalculie

```
1 (SESSION)
  30
    OFFICE: 714313
    HOME: 714335
    SCHOOL: 714350
    REVALIDATION: 714372
    HOSPITALISATION: 714383
    VIDEO_CONSULTATION: 714313
  60
    OFFICE: 714615
    HOME: 714630
    REVALIDATION: 714674
    HOSPITALISATION: 714685
    VIDEO_CONSULTATION: 714615
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 711115
    VIDEO_CONSULTATION: 711115
  GROUP
    OFFICE: 713112
    VIDEO_CONSULTATION: 713112
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `b.4` — Schisis

```
1 (SESSION)
  30
    OFFICE: 717312
    HOME: 717334
    SCHOOL: 717356
    REVALIDATION: 717371
    HOSPITALISATION: 717382
    VIDEO_CONSULTATION: 717312
3 (EVOLUTION_BILAN)
  60
    (all locations): 701013
```

### `b.5` — Radiotherapie / chirurgie

```
1 (SESSION)
  30
    OFFICE: 718314
    HOME: 718336
    SCHOOL: 718351
    REVALIDATION: 718373
    HOSPITALISATION: 718384
    VIDEO_CONSULTATION: 718314
  GROUP
    OFFICE: 718410
    REVALIDATION: 718476
    HOSPITALISATION: 718480
    VIDEO_CONSULTATION: 718410
```

### `b.6.1` — Dysglossieën

```
1 (SESSION)
  30
    OFFICE: 719316
    HOME: 719331
    SCHOOL: 719353
    REVALIDATION: 719375
    HOSPITALISATION: 719386
    VIDEO_CONSULTATION: 719316
```

### `b.6.2` — Dysartrieën

```
1 (SESSION)
  30
    OFFICE: 721313
    HOME: 721335
    SCHOOL: 721350
    REVALIDATION: 721372
    HOSPITALISATION: 721383
    VIDEO_CONSULTATION: 721313
```

### `b.6.3` — Neuromusculaire aandoeningen

```
1 (SESSION)
  30
    OFFICE: 729315
    HOME: 729330
    REVALIDATION: 729374
    HOSPITALISATION: 729385
    VIDEO_CONSULTATION: 729315
3 (EVOLUTION_BILAN)
  60
    (all locations): 704012
```

### `b.6.4` — Stotteren

```
1 (SESSION)
  30
    OFFICE: 723310
    HOME: 723332
    SCHOOL: 723354
    REVALIDATION: 723376
    HOSPITALISATION: 723380
    VIDEO_CONSULTATION: 723310
  60
    OFFICE: 711616
    HOME: 711631
    REVALIDATION: 711675
    HOSPITALISATION: 711686
    VIDEO_CONSULTATION: 711616
  GROUP
    OFFICE: 723413
    REVALIDATION: 723472
    HOSPITALISATION: 723483
    VIDEO_CONSULTATION: 723413
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 711211
    VIDEO_CONSULTATION: 711211
  GROUP
    OFFICE: 713215
    VIDEO_CONSULTATION: 713215
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `b.6.5` — Interceptive orthodontie

```
1 (SESSION)
  30
    OFFICE: 724312
    HOME: 724334
    SCHOOL: 724356
    REVALIDATION: 724371
    HOSPITALISATION: 724382
    VIDEO_CONSULTATION: 724312
```

### `c.1` — Laryngectomie

```
1 (SESSION)
  30
    OFFICE: 725314
    HOME: 725336
    SCHOOL: 725351
    REVALIDATION: 725373
    HOSPITALISATION: 725384
    VIDEO_CONSULTATION: 725314
  GROUP
    OFFICE: 725410
    REVALIDATION: 725476
    HOSPITALISATION: 725480
    VIDEO_CONSULTATION: 725410
```

### `c.2` — Larynx / stemstoornissen

```
1 (SESSION)
  30
    OFFICE: 726316
    HOME: 726331
    SCHOOL: 726353
    REVALIDATION: 726375
    HOSPITALISATION: 726386
    VIDEO_CONSULTATION: 726316
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 712014
    VIDEO_CONSULTATION: 712014
  GROUP
    OFFICE: 714011
    VIDEO_CONSULTATION: 714011
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `d` — Gehoorstoornissen

```
1 (SESSION)
  30
    OFFICE: 727311
    HOME: 727333
    SCHOOL: 727355
    REVALIDATION: 727370
    HOSPITALISATION: 727381
    VIDEO_CONSULTATION: 727311
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 712110
    VIDEO_CONSULTATION: 712110
  GROUP
    OFFICE: 714114
    VIDEO_CONSULTATION: 714114
```

### `e` — Dysfagie

```
1 (SESSION)
  30
    OFFICE: 728313
    HOME: 728335
    REVALIDATION: 728372
    HOSPITALISATION: 728383
    VIDEO_CONSULTATION: 728313
3 (EVOLUTION_BILAN)
  60
    (all locations): 706016
5 (BILAN_RELAPSE)
  60
    (all locations): 704115
```

### `f` — Dysfasie

```
1 (SESSION)
  30
    OFFICE: 733316
    HOME: 733331
    SCHOOL: 733353
    REVALIDATION: 733375
    HOSPITALISATION: 733386
    VIDEO_CONSULTATION: 733316
  60
    OFFICE: 733611
    HOME: 733633
    REVALIDATION: 733670
    HOSPITALISATION: 733681
    VIDEO_CONSULTATION: 733611
3 (EVOLUTION_BILAN)
  60
    (all locations): 710010
4 (PARENT_SITTING)
  INDIVIDUAL
    OFFICE: 714210
    VIDEO_CONSULTATION: 714210
  GROUP
    OFFICE: 712213
    VIDEO_CONSULTATION: 712213
```

### `g` — (undocumented)

```
1 (SESSION)
  30
    OFFICE: 724415
    HOME: 724430
    HOSPITALISATION: 724485
```

> ⚠️ The `g` disorder is in the codes table and `getDisorderSessions()` (150 sessions) but has no Dutch name in `migration-v1.js` and no helpdesk reference. The codes are in the 724xxx range, suggesting an interceptive-orthodontie variant. Verify with product.

### `supplementaryInsurance`

For supplementary insurance, the static table maps every appointment type / subType / location to the literal string `"AV"` (`treatments.js:761-807`). At resolution time, `Treatment.codes(true)` returns `treatment.supplementaryInsurance.code` (the user-defined override) instead of the static `"AV"` (`treatments.js:144-147`). If the user has not entered a `supplementaryInsurance.code` on the treatment, `getCodeForEvent` falls back to the i18n key `patient.treatments.supplementaryInsurance.abbreviation` (`treatments.js:175-176`).

So **supplementary-insurance treatments use a per-treatment custom code**, not a static one.

### `DEFAULT` — fallback for bilans / examinations

The `DEFAULT` subtree (`treatments.js:808-844`) is merged on top of the disorder-specific tree by `Treatment.codes(includeDefault = true)` (`treatments.js:148-152`). It provides catch-all entries for the appointment types that are common across all disorders:

```
2 (INITIAL_BILAN)
  INDEFINITE
    OFFICE: 701013
    HOME: 701013
    REVALIDATION: 701013
    HOSPITALISATION: 701013
3 (EVOLUTION_BILAN)
  60
    OFFICE: 702015
    HOME: 702015
    SCHOOL: 702015
    REVALIDATION: 702015
    HOSPITALISATION: 702015
5 (BILAN_RELAPSE)
  60
    OFFICE: 704115
    HOME: 704115
    SCHOOL: 704115
    REVALIDATION: 704115
    HOSPITALISATION: 704115
6 (EVALUATION_SESSION)
  60
    OFFICE: 700991
    HOME: 700991
    SCHOOL: 700991
    REVALIDATION: 700991
    HOSPITALISATION: 701002
```

So:
- **Every initial bilan** (across all disorders, except where the disorder defines its own override) maps to `701013` for ambulant locations and `701013` for hospitalisation. The `INDEFINITE` subType is used because the bilan event is split into 30-minute slices at invoice time (see `./patient_invoices.md`).
- **Every evolution bilan** falls through to `702015`.
- **Every relapse bilan** falls through to `704115`.
- **Every evaluation session** maps to `700991` (ambulant) or `701002` (hospitalisation). These are the two codes the helpdesk uses as canonical examples — the helpdesk's `700991` for "evaluation session, ambulant" and `701002` for "evaluation session, hospitalisation" come from this exact `DEFAULT[6][60]` entry.

The `_.merge` semantics mean that **a disorder's own subtree wins** over the `DEFAULT` for the same path. So `b.4`'s `evolution_bilan.60.OFFICE: 701013` (`treatments.js:485-494`) overrides `DEFAULT.evolution_bilan.60.OFFICE: 702015`, and likewise `b.6.3`'s evolution_bilan code `704012` and `e`'s `706016` and `f`'s `710010`.

### `VideoConsultationCode` — the extra code

```js
// treatments.js:353
Treatments.VideoConsultationCode = 792433;
```

This is the **secondary code** appended to a certificate row when the event location is `VIDEO_CONSULTATION` (`meta.location === 6`). The certificate template renders it as a third column next to the regular code (`Certificate.jsx:48-62`):

```js
let extraCode = null;
if (event.meta.location === 6) {
  extraCode = Treatments.VideoConsultationCode;
}
// renders: <date> <code> <extraCode>
```

So a video-consultation 30-minute b.1 session shows up on the certificate as two codes: `712316` (the per-disorder code, which is the same as the office one for video) and `792433` (the video-marker). This is the convention's way of distinguishing telelogopedie sessions from in-person ones for the same nomenclature.

## Resolution algorithm walk-through

For an event:
- `treatmentId = T1` where `Treatments.findOne(T1).type = "b.1"` (Afasie)
- `meta.type = 1` (SESSION)
- `meta.subType = 60` (60_MINUTES)
- `meta.location = 1` (OFFICE)

`getCodeForEvent` walks:
1. `codes = this.codes(true)` →
   `_.merge({}, getDisorderCodes().DEFAULT, getDisorderCodes()["b.1"])`.
2. Path: `1.60.OFFICE`.
3. `getDisorderCodes()["b.1"][1][60]["OFFICE"] = 712611`.
4. Return `712611`.

For the same event with `meta.location = 6` (VIDEO_CONSULTATION):
- Path: `1.60.VIDEO_CONSULTATION` → `712611` (the table maps video → office code for SESSION 60).
- Return `712611`.
- The certificate renderer separately appends `Treatments.VideoConsultationCode = 792433` because `meta.location === 6`.

For an `INITIAL_BILAN` 60-minute event of disorder `b.1`:
1. `codes` is the merged tree.
2. Path: `2.60.OFFICE`.
3. `b.1` does not have `[2]`, so `_.merge` falls back to `DEFAULT[2]`.
4. `DEFAULT[2]` only has `INDEFINITE`, not `60`.
5. Resolution returns `undefined`.
6. The event is marked `isReimbursable: false`.

> ⚠️ This means that an `INITIAL_BILAN` event with `meta.subType = 60` is **not reimbursable** through the static table. In practice the bilan-splitting at invoice creation (`patientFileInvoices/server/util.js:97-110`) replaces a 60-minute initial bilan with two 30-minute child events whose `meta.subType` is still `60` (not changed). After splitting, the resolution is the same broken path. The actual code that ends up on the certificate appears to be picked up from the child events' `getDuration()` which falls back to a computed `(end - start)` minutes value of `30`. Verify with product whether the initial-bilan flow really works for 60-min sources or whether it relies on the user always entering 30-min initial bilans.

## Notable details

- **The table is hardcoded.** There is no admin UI, no per-praktijk override, no migration to update it. Any RIZIV nomenclature change requires a code release. The "ownTariffs" toggle in `lib/formSchemas/practices/accessibility.jsx:50` is **dead code** — see `./tariff_indexation.md`.
- **`SCHOOL` is missing from many disorder × subtype combinations.** For example, `b.1` SESSION 60 has no `SCHOOL` entry — only OFFICE, HOME, REVALIDATION, HOSPITALISATION, VIDEO_CONSULTATION. A 60-minute Afasie session at school therefore returns `undefined` and is not reimbursable.
- **`VIDEO_CONSULTATION` always maps to the same code as `OFFICE`** in the per-disorder tree. The video distinction is carried by the secondary `Treatments.VideoConsultationCode` rendered alongside.
- **The `DEFAULT` overlay is the *fallback*, not the *override*.** `_.merge({}, DEFAULT, disorderTree)` means the disorder-specific tree wins. The overlay only fills in gaps.
- **`b.4` overrides `evolution_bilan` with code `701013`** — the same code that `DEFAULT.initial_bilan` uses. This is unusual and worth flagging to product: a `b.4` evolution bilan reuses the initial-bilan code.
- **`b.6.3` (neuromusculaire aandoeningen) overrides evolution_bilan with `704012`**, which is not the same as the default `702015`. This is the only disorder with a four-digit code distinction in this slot.
- **`e` (dysfagie) overrides evolution_bilan with `706016`.** Different from default.
- **`f` (dysfasie) overrides evolution_bilan with `710010`.** Different from default.
- **The `g` disorder only defines a session path, no bilans.** Bilan events for `g` would fall through to the `DEFAULT` subtree.
- **The `supplementaryInsurance` codes are the literal string `"AV"`** in the static table, which is a placeholder that gets *replaced* by the user-entered `supplementaryInsurance.code` at runtime. If the user enters nothing, the certificate shows the i18n abbreviation key.
- **The codes are stored as integers, except for supplementary insurance** (`"AV"` is a string). The `_getRValueForCode` function in the R-waarde computation handles both via `Number(code)` (`modules/riziv/server/util.js:9`).
- **Codes are not validated** against any external registry. The table is the single source of truth and is checked-in to the repo.
- **The codes are quoted by `Certificate.jsx:59`** as `translate(event.code, ...)`. This is suspicious — if the code is a numeric integer, `translate(792433)` is unlikely to find an i18n key. The fallback behaviour of the i18n library is presumably to return the input unchanged. Verify in the running app whether codes render as bare numbers or as translated text.

## Helpdesk overlap

The helpdesk references `700991` and `701002` for evaluation sessions and otherwise treats nomenclatuurcodes as opaque. It does not list any other codes and does not document the lookup matrix.

## Source files

- `app/imports/api/treatments/treatments.js:39-60` — `Treatments.getTypes()`
- `app/imports/api/treatments/treatments.js:143-178` — `codes()` and `getCodeForEvent()`
- `app/imports/api/treatments/treatments.js:328-348` — `getDisorderSessions()`
- `app/imports/api/treatments/treatments.js:353` — `Treatments.VideoConsultationCode`
- `app/imports/api/treatments/treatments.js:354-846` — `getDisorderCodes()` (the full static table)
- `app/imports/api/events/events.jsx:49-204` — appointment types, sub-types, locations, durations
- `app/imports/api/invoices/patientFileInvoices/server/util.js:294-461` — `_generateCertificates` (consumer)
- `app/imports/modules/invoices/patient/certificate/Certificate.jsx:34-94` — certificate row renderer (uses `event.code` and `Treatments.VideoConsultationCode`)
- `app/imports/migrations/migration-v1.js` — historical disorder-name migration (not the codes table)
