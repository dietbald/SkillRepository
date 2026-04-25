# 01 — RIZIV/INAMI Nomenclature, Codes, and Tariffs for Belgian Logopedists

> Last verified: 2026-04-06
> Scope: Federal RIZIV/INAMI rules governing reimbursable logopedic acts in Belgium.
> Maintained for the halingo.be product team as the billing-core reference. When in doubt, the primary source is the RIZIV/INAMI website (`riziv.fgov.be` / `inami.fgov.be`) and the Belgisch Staatsblad / Moniteur belge (`ejustice.just.fgov.be`).

---

## 1. Overview of the nomenclature

In Belgium, reimbursement of logopedic (speech-language pathology) acts is governed by the **federal** health insurance system managed by **RIZIV** (Rijksinstituut voor Ziekte- en Invaliditeitsverzekering) in Dutch, **INAMI** (Institut national d'assurance maladie-invalidité) in French, and "NIHDI" in English contexts. The competent legal instrument is the **"nomenclatuur van de geneeskundige verstrekkingen" / "nomenclature des prestations de santé"**, originally fixed by the **Royal Decree of 14 September 1984** and repeatedly amended. Chapter X of that nomenclature is dedicated to logopedie and forms the subject of **Article 36** (full form: Art. 36 of the annex to the KB of 14.9.1984).

Key points:

- Logopedic nomenclature is **federal**, not regional — even though education, youth policy and school-based care are regional (Flemish/French/German Community competences). This matters because some patient groups (e.g. children in special education, or in a regional-level revalidatiecentrum) are **excluded** from reimbursement under federal Article 36 (see §3 of art. 36).
- The nomenclature is accompanied by a **"Compendium bij de nomenclatuur van de logopedische verstrekkingen"** (explanatory guide), by national **Conventions** between logopedists and the mutuality/insurance organisations (currently R/2026-2027), by yearly tariff circulars, and by "limitative test lists" approved by the Overeenkomstencommissie / Commission de conventions.
- Reimbursement of any act requires **prior agreement (akkoord) of the adviserend arts / médecin-conseil** of the beneficiary's mutuality, granted on the basis of a prescription from a qualifying physician plus an anamnestic bilan (see §4 of Art. 36). Billed acts performed more than 60 calendar days before the request reached the adviserend arts are refused.
- Since 01/08/2024 the rules were reorganised by the **KB of 04.06.2024** (entry into force 01.08.2024). The old "bilan d'évolution / evolutiebilan" was abolished, treatment agreements now run for an uninterrupted two-year period (one year for cleft palate cases and Locked-in Syndrome), and extensions go via a simple notification flow (kennisgeving) rather than a new full application.

### Canonical locations

| Resource | Dutch URL | French URL |
|---|---|---|
| Logopedist hub page | https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten | https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes |
| Article 36 text (official coordination) | https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf | https://webappsa.riziv-inami.fgov.be/Nomen/fr/724371/pdf/... |
| Article 36 interpretive rules | https://www.riziv.fgov.be/nl/nomenclatuur/nomen/Paginas/nomen-artikel36.aspx | https://www.riziv.fgov.be/fr/nomenclature/nomenclature/Pages/nomen-article36.aspx |
| Yearly tariff circular (logopedie) | https://www.riziv.fgov.be/nl/thema-s/verzorging-kosten-en-terugbetaling/wat-het-ziekenfonds-terugbetaalt/individuele-verzorging/honoraria-prijzen-en-vergoedingen/honoraria-prijzen-en-tegemoetkomingen-van-logopedisten | equivalent FR path |
| NomenSoft (nomenclature search) | https://webappsa.riziv-inami.fgov.be/Nomen/nl/search | https://webappsa.riziv-inami.fgov.be/Nomen/fr/search |
| National convention R/26-27 | https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2026_2027.pdf | (same FR document) |
| Compendium | https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/compendium-bij-de-nomenclatuur-van-de-logopedische-verstrekkingen | https://www.riziv.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes/compendium-a-la-nomenclature-des-prestations-de-logopedie |

---

## 2. Structure — article 36 and how it is organised

**Article 36 of the Annex to the KB of 14 September 1984** is the unique anchor for reimbursable logopedie in Belgium. Its structure in the current version (in force since 01/08/2024) is:

- **§ 1** — *Logopedisch onderzoek met schriftelijk verslag* (examination with written report): contains 2 codes (bilanzitting 701013/701083 and the new evaluatiezitting 700991/701002 introduced by KB 4.6.2024).
- **§ 2** — *Reimbursable treatment acts, subdivided by pathology:*
  - § 2, a), 1°-3°: mondelinge taal- en/of spraakstoornissen — adults where the disorder is a handicap for a profession / approved retraining / apprenticeship.
  - § 2, b), 1°: afasie (acquired language disorder — vascular, toxic, tumoral, infectious or traumatic origin).
  - § 2, b), 2°: ontwikkelingstaalstoornissen aangetoond met een taaltest (developmental language disorder demonstrated by a standardised test).
  - § 2, b), 3°: dyslexie en/of dysorthografie en/of dyscalculie.
  - § 2, b), 4°: stoornissen tgv gespleten lippen / gespleten gehemelte / gespleten tandkassen (cleft lip, palate, alveolus).
  - § 2, b), 5°: verworven stoornissen tgv radiotherapeutische of chirurgische behandeling (head & neck).
  - § 2, b), 6°: verworven spraakstoornissen, sub-groups:
    - 6.1 Traumatische of proliferatieve dysglossieën.
    - 6.2 Dysartrieën (neurologic motor speech disorders).
    - 6.3 Chronische spraakstoornissen tgv neuromusculaire aandoeningen / Parkinson / Huntington / demyeliniserende aandoeningen / hersenverlamming bij kinderen tot 3 jaar (neurologist-attested; dementia excluded).
    - 6.4 Stotteren (stuttering, measured by test from the limitative list).
    - 6.5 Veelvuldige functionele stoornissen in het raam van een interceptieve orthodontische behandeling (myofunctional therapy).
  - § 2, c), 1°: sequelen van laryngectomie.
  - § 2, c), 2°: dysfunctie van de larynx en/of stemplooien (objectivised by laryngoscopy/stroboscopy + perceptual/acoustic/aerodynamic tests + QoL impact tests from the limitative list).
  - § 2, d): gehoorstoornissen (average hearing loss ≥ 40 dB HL at the better ear; conditional on enrolment in a federated-level revalidation centre specialised in these patients).
  - § 2, e): dysfagie (with demonstrated risk to oral feeding/hydration or of aspiration; VFES or FEES report required, except children < 3 years where the file goes to the Commission).
  - § 2, f): dysfasie (severe persisting expressive/receptive disorder after age 5, IQ/performantial ≥ 86, etc.; prescription must come from a specialist in paediatric neurology).
  - § 2, g): Locked-in Syndrome (LIS) — post KB 14.2.2017; speech, swallow and language disorders linked to LIS.
- **§ 3** — Exclusion rules (see §8 below).
- **§ 3bis** — No 60-minute session is reimbursable for beneficiaries under 10 years of age, for any disorder.
- **§ 4** — Request procedure: prescription table (which specialism may prescribe what), 60-day retroactivity limit, content of aanvraagformulier (application form) and medical prescription.
- **§ 5** — Maximum number of sessions per pathology (see "containers" table in §3 below) and duration rules for the first agreement (akkoord).
- **§ 6** — Extension rules via notification (kennisgeving) — since 01.08.2024, normal two-year renewal is via a simple standardised notification.
- **§ 7** — Cumulation rules: only one individual or collective session per day per patient (except parental-guidance sessions which may be on the same day as a treatment session). A 60-minute session counts as two 30-minute sessions.
- **§ 8** — Conditions on the therapist (RIZIV-number, visa, data-retention obligations, obligation to provide quality care per the Conventiecommissie rules).
- **§ 9** — eAgreement application rules (digital equivalent of paper flux).

Structure of each pathology block in § 2: typically five codes per pathology matching the five settings defined by the nomenclature:

1. **Individual, 30 min, in the cabinet of the logopedist** (code ends in a digit such that the last letter-group corresponds to the "kabinet" position).
2. **Individual, 30 min, at the home of the beneficiary ("ten huize")**.
3. **Individual, 30 min, at the school of the beneficiary** (often with monthly caps and post-08/2024 restrictions — school sessions no longer allowed after the first 2-year agreement for dysfasia; max 5 per calendar month for dysfasia).
4. **Individual, 30 min, in the framework of a revalidation convention** ("revalidatie-overeenkomst") — a residual code for services in a federated-level revalidation context.
5. **Individual, 30 min, for a hospitalised beneficiary** (HOS).

Some pathologies additionally have **60-minute** and **collective-session** variants (see the tables below). Parental-guidance sessions (individual, 60 min / collective, 90 min, in the cabinet of the logopedist in the absence of the patient) are attached to selected pathology blocks.

### Structure of the document itself

The official "officieuze coördinatie" PDF (`nomenclatuurart36_20240801_01.pdf` / `nomenclatureart36_...pdf`) is a 25-page coordinated text showing the history of Royal Decrees that have amended each paragraph. Each line is tagged with the KB that introduced or most recently modified it (e.g. `K.B. 15.5.2003 + K.B. 4.6.2024`). This is the authoritative human-readable form — but it is not machine-readable. The machine-readable mirror is **NomenSoft** (see §7 below).

---

## 3. Full list of reimbursable logopedic codes

All codes below are from the nomenclature in force since **01/08/2024** (KB 04.06.2024) with **honoraria/tariffs as published in the RIZIV circular `Tarieven Logopedie 01-01-2026`** (Omzendbrief VI 2025/350 of 16.12.2025), applied as of 1 January 2026 after a linear indexation of **+2,72 %**.

### Column meaning (every table)

| Column | Meaning |
|---|---|
| Code AMB | Ambulatory verstrekkingsnummer (cabinet, home, school, revalidation convention) |
| Code HOS | Hospitalised verstrekkingsnummer (patient in acute hospital, specific suffix) |
| R | "Waarde R" (coefficient; always a fixed integer per act — 15, 17.5, 35 or 9 — multiplied by the per-category R-value to give the honorarium) |
| R-value | Current (2026-01-01) conversion factor, varies per category |
| Honorarium | Full fee charged by a **conventioned** logopedist (EUR) |
| Terugbet. BIM | Reimbursement to beneficiary with **verhoogde tegemoetkoming / régime préférentiel** (a.k.a. BIM/OMNIO) — applies regardless of the therapist's convention status |
| Terugbet. Std | Reimbursement to ordinary beneficiary treated by a **conventioned** logopedist |
| Terugbet. Std-NC | Reimbursement to ordinary beneficiary treated by a **non-conventioned** logopedist (= Terugbet. Std × 0.75 — the -25% reduction under the KB of 08/06/1967, applicable only when quorum > 60%; see §4) |
| Remgeld Std | Patient's out-of-pocket (honorarium − Terugbet. Std) when seeing a conventioned therapist |

**Tip for engineers:** All four money columns are derivable from the R-value and the pathology class, so in the database store (code, R-coefficient, R-value-category, pathology) and compute the money columns dynamically. This protects you against rounding drift. Always round half-up to 2 decimals; the RIZIV circular values match `round(R × R_value, 2)`.

### § 1 — Logopedisch onderzoek met schriftelijk verslag

| Code AMB | Code HOS | NL description | FR description | R | R-value (2026) | Honor. (€) | BIM (€) | Std (€) | Std-NC (€) | Remgeld Std (€) |
|---|---|---|---|---|---|---|---|---|---|---|
| **701013** | **701083** | Bilanzitting van ten minste 30 minuten vóór het begin van een logopedische behandeling | Séance de bilan d'au moins 30 minutes avant le début d'un traitement logopédique | 17,5 | 2,593102 | 45,38 | 42,38 | 37,88 | 28,41 | 7,50 |
| **700991** | **701002** | Evaluatiezitting van meer dan 30 minuten *(nieuw sinds 01/08/2024 — vervangt niet het aanvangsbilan; wordt uitgevoerd tijdens een lopend akkoord bij toename ernst, stagnatie of na ≥ 12 maanden onderbreking; max 5 per behandelde stoornis)* | Séance d'évaluation de plus de 30 minutes | 35 | 2,192167 | 76,73 | 72,23 | 65,73 | 49,30 | 11,00 |

Notes:
- The bilan (701013) has a **cap of 5 attestations per treated disorder**. It must be performed BEFORE the prescription of treatment, and the treatment must start within **60 calendar days** after the bilan.
- For dysfasie (§2, f), the prescription for 701013 must come from a specialist in paediatric neurology.
- No bilan in a school setting is reimbursable (explicitly forbidden).
- The bilan is not cumulable with a treatment session on the same day.
- The new 700991/701002 "evaluatiezitting" code is NOT deducted from the maximum container of treatment sessions (it is distinct from the in-session evaluations that live inside the container).

### § 2, a) — Mondeling taal- en/of spraakstoornissen (professional handicap) — individual 30 min

| Code | NL setting | R | R-value | Honor. | BIM | Std | Std-NC | Remgeld Std |
|---|---|---|---|---|---|---|---|---|
| **711314** | In het kabinet van de logopedist | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| **711336** | Ten huize van de rechthebbende | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| **711351** | Op de school van de rechthebbende | 17,5 | 2,117663 | 37,06 | 35,06 | 31,06 | 23,30 | 6,00 |
| **711373** | In het kader van een revalidatie-overeenkomst | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| **711384 (HOS)** | Voor een gehospitaliseerde rechthebbende | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |

No 60-min code, no collective code and no parental-guidance code for § 2, a).

### § 2, b), 1° — Afasie

| Code | Setting | Duration | R | R-value | Honor. | BIM | Std | Std-NC | Remgeld |
|---|---|---|---|---|---|---|---|---|---|
| 712316 | Cabinet | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| 712331 | Home | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| 712353 | School | 30 min | 17,5 | 2,117663 | 37,06 | 35,06 | 31,06 | 23,30 | 6,00 |
| 712375 | Revalidation | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| 712386 (HOS) | Hospital | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 | 5,50 |
| 712611 | Cabinet | 60 min | 35 | 2,201493 | 77,05 | 72,55 | 66,05 | 49,54 | 11,00 |
| 712633 | Home | 60 min | 35 | 2,201493 | 77,05 | 72,55 | 66,05 | 49,54 | 11,00 |
| 712670 | Revalidation | 60 min | 35 | 2,201493 | 77,05 | 72,55 | 66,05 | 49,54 | 11,00 |
| 712681 (HOS) | Hospital | 60 min | 35 | 2,201493 | 77,05 | 72,55 | 66,05 | 49,54 | 11,00 |
| 712412 | Cabinet collective | 60 min (per patient, max 4) | 9 | 2,195268 | 19,76 | 18,76 | 16,76 | 12,57 | 3,00 |
| 712471 | Revalidation collective | 60 min | 9 | 2,195268 | 19,76 | 18,76 | 16,76 | 12,57 | 3,00 |
| 712482 (HOS) | Hospital collective | 60 min | 9 | 2,195268 | 19,76 | 18,76 | 16,76 | 12,57 | 3,00 |

### § 2, b), 2° — Taalontwikkelingsstoornissen aangetoond door een taaltest

| Code | Setting | Duration | R | R-value | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|---|---|
| 711012 | Parental guidance, individual, cabinet, 60 min (no patient present) | — | 35 | 2,201493 | 77,05 | 72,55 | 66,05 | 49,54 |
| 713016 | Parental guidance, collective, cabinet, 90 min, 3–6 couples | — | 15 | 2,192383 | 32,89 | 30,89 | 27,39 | 20,55 |
| 713311 | Cabinet | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 |
| 713333 | Home | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 |
| 713355 | School | 30 min | 17,5 | 2,117663 | 37,06 | 35,06 | 31,06 | 23,30 |
| 713370 | Revalidation | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 |
| 713381 (HOS) | Hospital | 30 min | 17,5 | 2,192383 | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, b), 3° — Dyslexie, dysorthografie, dyscalculie

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 711115 | Parental guidance, individual, cabinet, 60 min | — | 77,05 | 72,55 | 66,05 | 49,54 |
| 713112 | Parental guidance, collective, cabinet, 90 min | — | 32,89 | 30,89 | 27,39 | 20,55 |
| 714313 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 714335 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 714350 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 714372 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 714383 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 714615 | Cabinet | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 714630 | Home | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 714674 | Revalidation | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 714685 (HOS) | Hospital | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |

### § 2, b), 4° — Gespleten lippen / gehemelte / tandkassen

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 717312 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 717334 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 717356 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 717371 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 717382 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

Age constraint: only treatable under § 2 b) 4° between 0 and ten volle 19 jaar; 0–2 jaar: single akkoord until the day before the 3rd birthday, max 30 sessions; 3–19 jaar: 8 akkoorden of up to 1 year each, max 75 sessions per akkoord (not transferable).

### § 2, b), 5° — Verworven stoornissen tgv radiotherapeutische of chirurgische behandeling (hoofd en hals)

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 718314 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 718336 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 718351 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 718373 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 718384 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 718410 | Cabinet collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 718476 | Revalidation collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 718480 (HOS) | Hospital collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |

### § 2, b), 6.1 — Traumatische/proliferatieve dysglossieën

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 719316 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 719331 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 719353 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 719375 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 719386 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, b), 6.2 — Dysartrieën

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 721313 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 721335 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 721350 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 721372 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 721383 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, b), 6.3 — Chronische spraakstoornissen tgv neuromusculaire aandoeningen

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 729315 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 729330 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 729374 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 729385 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

*Note: no school code exists for § 2, b), 6.3 — attest from a neurologist required. Prescription restricted to specific specialities (see prescriber table below).*

### § 2, b), 6.4 — Stotteren

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 711211 | Parental guidance, individual, cabinet, 60 min | — | 77,05 | 72,55 | 66,05 | 49,54 |
| 713215 | Parental guidance, collective, cabinet, 90 min | — | 32,89 | 30,89 | 27,39 | 20,55 |
| 723310 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 723332 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 723354 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 723376 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 723380 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 711616 | Cabinet | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 711631 | Home | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 711675 | Revalidation | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 711686 (HOS) | Hospital | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 723413 | Cabinet collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 723472 | Revalidation collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 723483 (HOS) | Hospital collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |

### § 2, b), 6.5 — Veelvuldige functionele stoornissen in het raam van een interceptieve orthodontische behandeling (myofunctional)

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 724312 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 724334 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 724356 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 724371 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 724382 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, c), 1° — Sequelen van laryngectomie

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 725314 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 725336 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 725351 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 725373 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 725384 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 725410 | Cabinet collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 725476 | Revalidation collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |
| 725480 (HOS) | Hospital collective | 60 min | 19,76 | 18,76 | 16,76 | 12,57 |

### § 2, c), 2° — Dysfunctie van de larynx en/of stemplooien

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 712014 | Parental guidance, individual, cabinet, 60 min | — | 77,05 | 72,55 | 66,05 | 49,54 |
| 714011 | Parental guidance, collective, cabinet, 90 min | — | 32,89 | 30,89 | 27,39 | 20,55 |
| 726316 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 726331 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 726353 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 726375 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 726386 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, d) — Gehoorstoornissen (≥ 40 dB HL better ear)

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 712110 | Parental guidance, individual, cabinet, 60 min | — | 77,05 | 72,55 | 66,05 | 49,54 |
| 714114 | Parental guidance, collective, cabinet, 90 min (3–4 couples) | — | 32,89 | 30,89 | 27,39 | 20,55 |
| 727311 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 727333 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 727355 | School | 30 min | 37,06 | 35,06 | 31,06 | 23,30 |
| 727370 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 727381 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

### § 2, e) — Dysfagie

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 728313 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 728335 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 728372 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 728383 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

*No school code for dysfagia. The prescription must be accompanied by a VFES or FEES report (children < 3 years excepted via the Commission).*

### § 2, f) — Dysfasie

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 712213 | Parental guidance, individual, cabinet, 60 min | — | 77,05 | 72,55 | 66,05 | 49,54 |
| 714210 | Parental guidance, collective, cabinet, 90 min | — | 32,89 | 30,89 | 27,39 | 20,55 |
| 733316 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 733331 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 733353 | School | 30 min (max 5 per calendar month, not allowed after the first 2-year akkoord) | 37,06 | 35,06 | 31,06 | 23,30 |
| 733375 | Revalidation | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 733386 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 733611 | Cabinet | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 733633 | Home | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 733670 | Revalidation | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |
| 733681 (HOS) | Hospital | 60 min | 77,05 | 72,55 | 66,05 | 49,54 |

### § 2, g) — Locked-in Syndrome (LIS)

| Code | Setting | Duration | Honor. | BIM | Std | Std-NC |
|---|---|---|---|---|---|---|
| 724415 | Cabinet | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 724430 | Home | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |
| 724485 (HOS) | Hospital | 30 min | 38,37 | 36,37 | 32,87 | 24,66 |

*No school, revalidation, 60 min, collective or parental-guidance codes for LIS.*

### Maximum containers per pathology (Art. 36, § 5)

These are the maximum numbers of 30-minute individual sessions attainable under the first agreement, and per subsequent 2-year extension-notification:

| Pathology | 1st akkoord (30-min sessions) | Duration | Notes / extension |
|---|---|---|---|
| § 2, a) professional handicap | 55 | until container depleted | Remainder usable via 2-year notifications |
| § 2, b), 1° afasie | 288 | 2 yr | Must start within 6 months of disorder onset |
| § 2, b), 2° taalontwikkeling | 190 | 2 yr | Extendable until age 17 if ordinary education; blocks later § 2, b), 3° or f) akkoord |
| § 2, b), 3° dyslexie/dysorthografie/dyscalculie | 140 | 2 yr | Extendable until age 17 if ordinary education |
| § 2, b), 4° cleft lip/palate | 30 (0–2 y, single akkoord till 3rd bday) or 75 per akkoord (3–19 y, up to 8 akkoorden) | 1 yr each | Unused sessions NOT transferable |
| § 2, b), 5° radiotherapy/surgery head&neck | 55 | 2 yr | |
| § 2, b), 6.1 dysglossies | 149 | 2 yr | |
| § 2, b), 6.2 dysartries | 176 | 2 yr | |
| § 2, b), 6.3 chronic neuromuscular | 520 | 2 yr | **Each** notification: 520 more |
| § 2, b), 6.4 stuttering | 128 | 2 yr | |
| § 2, b), 6.5 myofunctional ortho | 20 | 2 yr | |
| § 2, c), 1° laryngectomy | 90 | 2 yr | |
| § 2, c), 2° larynx/vocal folds | 80 | 2 yr | |
| § 2, d) hearing loss ≥ 40 dB | 520 | 2 yr | Each notification: 520 more, prescription from rehab specialist of approved centre |
| § 2, e) dysphagia | 65 | 2 yr | VFES/FEES required |
| § 2, f) dysfasie | 384 | 2 yr | Extendable until age 17 if ordinary education; per notification max 192 new |
| § 2, g) LIS | 150 (1 yr uninterrupted) | 1 yr | Lifelong 1-year extensions of 100 new sessions each |

**Important aggregation rules (§5, r):**
- Parental-guidance codes (711012, 711115, 711211, 712014, 712110, 712213, 713016, 713112, 713215, 714011, 714114, 714210) — together **maximum 10 attestations per disorder per child**, spread over the full treatment.
- An **individual** parental-guidance session counts as **2** 30-min individual sessions when deducted from the container.
- A **collective** parental-guidance session counts as **1** 30-min individual session when deducted.
- The maximum container must also be reduced by the number of 701013/701083 bilans already attested (each bilan = 1 session for the container).

### Exclusion rules (Art. 36, § 3) — no reimbursement when the patient…

1. Attends **special education** — restriction applies to § 2 b) 2°, § 2 b) 3° and § 2 f) treatments.
2. Is **treated or housed in a regionally recognised and subsidised institution** in which the function "logopedist" is part of the approval norms (e.g. certain MPI's, CGG's, CLB's, etc.).
3. Is **admitted to a hospital service labelled G, T, A, Sp or K**.
4. Resides in a PVT, ROB or RVT (psychiatric, nursing, residential elderly care).
5. Is revalidated in a RIZIV- or federated-level convention institution where logopedy is covered — **exception:** patients under § 2 b) 6.3 and § 2 d) may still be covered.

Also excluded by nature:
- Stoornissen tgv psychiatrische aandoeningen of emotionele toestanden, relatieproblemen, gebrekkig schoolbezoek (e.g. sickness), aanleren van andere taal dan moedertaal of meertalige opvoeding.
- Enkelvoudige stoornissen: sigmatisme (lisp), rhotacisme (R-issues), lambdacisme, kappacisme, cluttering (broddelen).
- Stemstoornissen zoals acute functionele afonie, fonastenie, stemwisselingsstoornissen.
- Stoornissen van § 2 b) 2° die volgen op een behandeling van dyslexie/dysorthografie/dyscalculie.

### Prescriber rights (Art. 36, § 4, 2°)

The right to prescribe the first bilan/treatment depends on the pathology. Simplified summary (JA = allowed, NEEN = not allowed):

| Pathology | NKO | Neurol. | Neuro-psy | Psych. | Ped. neurol. | Neuro-chir | Int. med. | Onco. | Gastro. | Pediatr. | Geriatr. | Stomat. | Fys. gen. | Heelk. | GP | Tandarts | Tandarts spec. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| § 2 a) professional | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 1° afasie | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 2° taalstoor. | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 3° leerstoor. | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 4° cleft lip | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 5° radio/chir | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 6.1 dysgloss. | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 6.2 dysartrie | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 6.3 chron. | NEEN | JA | JA | NEEN | JA | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN |
| § 2 b) 6.4 stotteren | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 b) 6.5 myofunct. | JA | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | JA | NEEN | NEEN | NEEN | JA | JA |
| § 2 c) 1° laryng. | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 c) 2° larynx/voice | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 d) gehoor | JA | JA | NEEN | NEEN | JA | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN |
| § 2 e) dysfagie | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | JA | NEEN | NEEN | NEEN |
| § 2 f) dysfasie | NEEN | NEEN | NEEN | NEEN | JA | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN |
| § 2 g) LIS | NEEN | JA | JA | NEEN | JA | JA | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN | NEEN |

**Extensions:** the GP (huisarts) may prescribe an extension for any pathology **except** § 2 d) gehoorstoornissen and § 2 f) dysfasie. First-time prescriptions from a GP are only accepted for the limited set above (mainly when already marked JA in the "Huisarts" column — currently none).

Additional constraints:
- For § 2, b), 6.3, if the etiology is MS / neuromuscular / cerebral palsy, the prescription must be made in the framework of activity at a RIZIV- or federated-level approved rehabilitation centre specialised in these patients.
- For § 2, d), the prescriber must be connected to a federated-level approved rehabilitation centre.
- For § 2, b), 6.2, § 2, b), 6.3 and § 2, b), 1°, the prescription must state etiology + nature/scope of the disorder.
- For § 2, e), the prescription must include a VFES or FEES (or go to the Commission for children < 3 y).

---

## 4. Convention system (geconventioneerd / non-conventioneerd)

### Legal base

The logopedists' national convention is concluded by the **Overeenkomstencommissie logopedisten - verzekeringsinstellingen / Commission de conventions logopèdes - organismes assureurs** under the RIZIV Service des soins de santé. Each convention covers a fixed period of two calendar years, is **not tacitly renewable**, and binds the logopedists who adhere to it to the tariff schedule of Article 2 of the convention, in return for a social status payment and a few safeguards (see §2, §4 of the convention).

The logopedists' professional side is represented by **VVL** (Vlaamse Vereniging voor Logopedisten) and **UPLF** (Union Professionnelle des Logopèdes Francophones); the mutuality side is represented by the seven mutualist organisations (CM/MC, Solidaris, Helan/ODVVS, Liberale Mutualiteiten, Neutrale Ziekenfondsen, HR Rail/PSB, MLOZ/Onafhankelijke).

### Current convention: R/2026-2027

- Signed **11 December 2025**, published in the Belgisch Staatsblad / Moniteur belge on **9 February 2026**.
- Covers **2026 and 2027**.
- R-values (as of 01/01/2026):
  - Bilan initial: **R = 2,593102**
  - Evaluatiezitting: **R = 2,192167**
  - Individual 30-min treatment (outside school) + collective parental guidance: **R = 2,192383**
  - Individual 60-min treatment + individual parental guidance: **R = 2,201493**
  - Individual 30-min treatment at school: **R = 2,117663**
  - Collective treatment: **R = 2,195268**
- Annual budget objective for logopedie 2026: **€ 218,688 thousand** (€ 218.688 M).
- Adhesion percentage (confirmed by the Insurance Committee on **23 March 2026**): **84 %** — well above the 60 % quorum, so the **-25 % non-convention reduction applies from 1 April 2026**.

### How individual adhesion works

Logopedists who were conventioned on **31 December 2025** are automatically presumed to have adhered to R/2026-2027 **unless** they explicitly opt out via the secured electronic application (ProSanté, using eID) within **30 days** of publication in the BS/MB. New logopedists can adhere any time; adhesion can be cancelled:
- by the logopedist, before **15 December** of each year via ProSanté (effective 1 January following);
- collectively, before **1 December** of each year by ≥ 3/4 of the members of either side of the Commission, effective 1 January following.

### Partial convention — does it exist?

**No full partial/partial-time convention** exists for logopedists the way it does for physicians or dentists. A logopedist is either fully conventioned or fully non-conventioned. The convention does contain some **exceptions allowing supplements** even for conventioned therapists (Art. 4, § 2 of R/26-27), namely:

- At the patient's request, sessions **before 08:00** or **during weekend / legal holiday** (but not if the logopedist themselves schedules cabinet hours in those slots).
- At the patient's request, session **at the beneficiary's home without medical necessity** — the supplement corresponds to a "frais de déplacement raisonnable" which the patient pays out-of-pocket and which is NOT reimbursed.
- Special-hours supplements are NOT allowed if the logopedist himself sets consultation hours before 08:00 / after 19:00 / weekend / holiday — i.e. a logopedist can't generally charge night/weekend supplements for the hours they themselves chose to open.
- Weekend = Friday 19:00 → Monday 08:00.

### Financial implications for the patient of each status

For each reimbursable code the RIZIV circular prints **four money columns**: honorarium, reimbursement to ordinary beneficiary (treated by conventioned therapist), reimbursement to ordinary beneficiary treated by non-conventioned therapist, and reimbursement to preferential beneficiary (BIM/OMNIO). The -25 % rule works as follows:

| Scenario | Example with 30-min individual session, cabinet (€) |
|---|---|
| Conventioned therapist, ordinary beneficiary | Honorarium 38,37 → ZIV reimburses 32,87 → patient pays 5,50 remgeld |
| Conventioned therapist, BIM beneficiary | Honorarium 38,37 → ZIV reimburses 36,37 → patient pays 2,00 remgeld |
| **Non-conventioned** therapist, ordinary beneficiary | Honorarium = freely set by therapist (often ≈ 45–55 EUR) → ZIV reimburses **24,66** (= 32,87 × 0,75) → patient pays honorarium − 24,66 |
| **Non-conventioned** therapist, BIM beneficiary | Honorarium free → **ZIV reimburses 36,37** (same as conventioned — the -25 % does NOT apply to BIM/OMNIO) → patient pays honorarium − 36,37 |

The -25 % rule is grounded in **KB of 8 June 1967** and is only applied in the period in which the Insurance Committee has confirmed that the 60 % quorum is met for the running convention. For R/24-25 the quorum was confirmed on 11 March 2024 at **67.38 %** — so the -25 % was in force from around mid-2024 until the end of R/24-25. For R/26-27, the quorum was initially unmet (no -25 % between 1 January and 31 March 2026), then confirmed at **84 %** on 23 March 2026 and active from **1 April 2026** onward.

### Implications for halingo.be

**Per-therapist flags needed in your data model:**
- `convention_status`: `conventioned` | `non_conventioned` (boolean per convention period, plus the current state)
- `convention_active_from`, `convention_active_to`: always tied to a convention period (R/24-25, R/26-27, …)
- `allows_supplements_special_hours`, `allows_travel_fee`: boolean per session quote, derived from convention rules + patient request flag
- `riziv_number`: fixed 11-digit identifier for the logopedist
- Per session: store the four money columns computed at **the exact date of the session** (not at the date of billing) because tariffs are indexed on 1 January and 1 April.

**Patient-side UX:** show a clear "reimbursement ladder":
1. Honorarium (fee charged)
2. Reimbursement from the ziekenfonds (computed from convention status + BIM status + pathology code + setting)
3. Remgeld (patient's out-of-pocket)

Also flag where the logopedist is **entitled** to charge a supplement (weekend, early morning, home at patient's request without medical necessity) and whether a supplement was actually charged — for tiers-payant billing honesty.

---

## 5. Indexation and recent changes

### Mechanism

Per the **KB of 8 December 1997** (indexation rules for health-insurance services), the R-values can be updated on **1 January** of every year in line with the movement of the **gezondheidsindex** (health index), **provided** the Overeenkomstencommissie — voting by the same quorum as for concluding a convention — determines that there is sufficient budgetary margin. Concretely:

- Every year the **Algemene Raad / Conseil général** of the RIZIV votes the health-care budget around October (for the following year).
- In November/December the Overeenkomstencommissie Logopedisten decides the indexation rate (linear or selective) within the budgetary envelope.
- The **RIZIV Omzendbrief / Circulaire** "Tarieven Logopedie" is published before Christmas and takes effect on **1 January**.
- Occasionally a mid-year update follows (typically 1 April) if budget mechanics or a convention state change requires it.

### Recent indexations (verified from tariff circulars)

| Date | Rate | Trigger | Source doc |
|---|---|---|---|
| **1 Jan 2024** | partial (mainly R=2,442846 bilan, R=1,471503 evolutiebilan, R=2,065346 indiv 30 min, R=2,073929 indiv 60 min, R=1,994956 school 30 min, R=2,068065 collective) | Convention R/24-25 article 2 | tarief_logopedisten_20240101.pdf |
| 1 Apr 2024 | mid-year adjustment (post-adhesion) | | tarief_logopedisten_20240401.pdf |
| 1 Aug 2024 | **Structural re-write** — new codes, deleted codes, new container rules (not a tariff change per se but a nomenclature rewrite via KB 04.06.2024) | KB 04.06.2024 | tarief_logopedisten_20240801.pdf |
| **1 Jan 2025** | Linear +3,34 % | Convention R/24-25, Omzendbrief VI 2024/405 of 16.12.2024 | tarief_logopedisten_20250101.pdf |
| **1 Jan 2026** | Linear +2,72 % | Convention R/26-27, Omzendbrief VI 2025/350 of 16.12.2025 | tarief_logopedisten_20260101.pdf |
| 1 Jan 2026 corrigendum | minor correction | | tarief_logopedisten_20260101_corrigendum.pdf |
| **1 Apr 2026** | No tariff change, but **the -25 % non-convention reduction activated** (after quorum confirmed at 84 %) | Omzendbrief VI 2026/56 of 23.3.2026 | tarief_logopedisten_20260401.pdf |

### Recent structural change to watch: KB 04.06.2024 (in force 01.08.2024)

This was the biggest change in a decade. Main points:

1. **Bilan d'évolution abolished.** Codes 702015/702085, 704012/704082, 706016/706086, 708013/708083, 710010/710080, 704115/704126 were all **schrapt/abrogé** on 01.08.2024. Do not use them for any session after that date. (Old patient records may still contain them before that date.)
2. **New "evaluatiezitting" 700991/701002** introduced as a replacement, but with different rules: it runs during treatment (not before), is capped at 5 per disorder, and is triggered by aggravation / stagnation / ≥ 12 months interruption.
3. **Treatment akkoorden now always 2 years** (exception: § 2 b) 4° cleft lip = 1 year akkoorden; § 2 g) LIS = 1 year uninterrupted akkoord).
4. **Extensions via a simple kennisgeving** (standard form) — no longer requires explicit authorization of the adviserend arts.
5. **Wider-language of the school-session restriction** for dysfasie: max 5 per calendar month and forbidden after the first akkoord.
6. **eAgreement** explicitly recognised as an equivalent electronic flux (§ 9).
7. **Standardised aanvraagformulieren / extension notification forms** made mandatory.
8. **Quality-of-file requirements** (dossier de qualité) in the nomenclature — rolled out as a working-group project in the R/26-27 convention.

### Under discussion (R/26-27)

The projects article of R/26-27 mentions:
- Integration of a "quality patient file" into the nomenclature.
- Revision of the nomenclature for **taalontwikkelingsstoornissen en dysfasie** (§2, b), 2° and §2, f)) — these two categories are converging and overlap with the KB 21.06.2025 allowing treatment of patients with IQ < 86.
- Revision of **stemstoornissen (C1 and C2)** to better match clinical/scientific reality.
- Administrative simplification (further digital onboarding).
- Dialogue with federated entities on overlap of logopedie in education/youth care.

Expect further tariff-neutral structural updates in 2026–2027 affecting the § 2 b) 2° / § 2 f) overlap and the C1/C2 voice disorder definitions.

---

## 6. Supplements, travel fees, cancellation rules

### Travel / displacement fees (frais de déplacement / verplaatsingskosten)

- **Not part of the nomenclature.** There is no nomenclature code for a "verplaatsing" — the honorarium for a home or school visit is identical to the honorarium in the cabinet.
- When the patient *requests* a home visit for convenience reasons (no medical necessity), the conventioned logopedist may negotiate a **reasonable displacement supplement** with the patient (Art. 3 § 1 of R/26-27). This supplement is paid out-of-pocket by the patient and is **not reimbursed** by the mutuality. The logopedist must inform the patient **before** starting treatment; burden of proof lies with the logopedist.
- When the home visit is **medically necessary** (bedridden patient, etc.), no supplement is allowed beyond the nomenclature honorarium.
- In practice VVL/UPLF recommend anything from €0.30–0.40/km or a fixed small amount, but there is **no binding tariff** — that's for the therapist to set (and that is exactly what conscientious SaaS apps should help manage transparently).

### Supplements for special hours (conventioned therapists)

A conventioned logopedist may charge an (unregulated) supplement for prestations performed at the **patient's explicit request**:

- Before 08:00.
- During weekend (Fri 19:00 – Mon 08:00) or legal holiday, unless the doctor's prescription explicitly demands it.
- At the beneficiary's home without medical necessity (same as displacement above).

They may **NOT** charge a supplement if they themselves schedule their own consultation hours in that slot, nor for after-19:00 or before-08:00 services provided on their own initiative.

### Cancellation / no-show

The nomenclature and the national convention **do not regulate cancellation or no-show fees**. In practice:
- Most therapists set a house rule (e.g. 24 h or 48 h notice) and charge the patient for a missed session.
- These fees are **out of the nomenclature** and therefore **out-of-pocket** for the patient (never reimbursed).
- They cannot be billed via an "attestation de soins donnés" / getuigschrift — only real sessions can.
- VVL and UPLF publish model house rules with suggested amounts (often the full honorarium for the missed session).

### Group/collective sessions

- For afasie (§ 2, b) 1°), acquired disorders after radio/surgery head-and-neck (§ 2, b) 5°), stuttering (§ 2, b) 6.4) and post-laryngectomy (§ 2, c) 1°), a **collective 60-minute session** for up to 4 patients is reimbursable (codes 712412/712471/712482, 718410/718476/718480, 723413/723472/723483, 725410/725476/725480).
- Honorarium per patient = R 9 × 2,195268 = **€ 19,76** (as of 01/01/2026).
- One collective 60-min session = **1** 30-min individual session for the container deduction.
- Parental-guidance sessions (codes ending in 1012, 1115, 1211, 2014, 2110, 2213 individual / 3016, 3112, 3215, 4011, 4114, 4210 collective) — for groups of 3–6 (or 3–4 for hearing) parent couples, 90 min, in the cabinet in absence of the child. Max 10 attestations per disorder per child over the whole treatment.

### Tiers-payant (third-party payment)

- Logopedists **may** use tiers-payant (Art. 6 of R/26-27; Art. 53 § 1 of the coordinated ZIV law of 14.7.1994).
- When they do, they invoice the mutuality directly for the reimbursement part and only collect remgeld (+ any supplements) from the patient.
- Tiers-payant is **not mandatory** in logopedie (unlike GPs for BIM patients). Most logopedists still work via the "attestation de soins donnés" / "getuigschrift voor verstrekte hulp" that the patient submits to their mutuality.
- halingo.be must support both flows: direct-pay (patient submits attestation) and tiers-payant (via MyCareNet / eAttest flux to the mutualities).

---

## 7. How to get authoritative and machine-readable data

### The primary machine-readable source: RIZIV reference tables

Available from https://www.inami.fgov.be/fr/nomenclature/tableaux/Pages/default.aspx (Dutch equivalent under `/nl/`):

- **`XML.zip`** — full coordinated tables in XML (zip-compressed). URL pattern: `https://www.inami.fgov.be/SiteCollectionDocuments/XML.zip`. Contains tables with codes, labels, R values, honoraria, dates, article references.
- **`TXT.zip`** — same tables as pipe-delimited (`|`) text. URL: `https://www.inami.fgov.be/SiteCollectionDocuments/TXT.zip`.
- **`Honoraires_Prix_Remboursements_n.zip`** — dedicated fees / reimbursements file.
- **`UPD_XML.zip` / `UPD_TXT.zip`** — the delta updates between two reference releases.
- An **Excel schema file** (RIZIV terminology: "tableau des schémas") documents the field layout of the TXT/XML files.
- **Update notifications:** send an email to `nomen@inami.fgov.be` (subject: "Alert Tables NomenSoft") to be added to the alert list for new releases.
- The tables are extracts from the **Nomensoft** database and are regenerated at irregular intervals — the current dataset at time of writing is dated **application 01/06/2026, created 27/03/2026**.

**How to use:** Unzip → each table is a flat pipe-delimited file (e.g. `NOMEN_HON.txt`). Use the field layout in the schema Excel to parse. Import into PostgreSQL with a `COPY ... FROM STDIN (DELIMITER '|', FORMAT CSV)` after mild cleaning.

### The primary human-readable source: NomenSoft

- URL (NL): `https://webappsa.riziv-inami.fgov.be/Nomen/nl/search`
- URL (FR): `https://webappsa.riziv-inami.fgov.be/Nomen/fr/search`
- Lets you look up any code (e.g. `/Nomen/nl/701013`) and shows labels, article reference, R values, creation/amendment history, and links to PDFs.
- **There is no documented public REST API.** NomenSoft is a web application. URL pattern for individual codes (`/Nomen/{lang}/{code}`) is stable enough for light scraping but you must back off and honour their ToS.
- If you need to confirm a specific code, the NomenSoft lookup plus the tariff circular PDF is the gold standard.

### Secondary: yearly tariff circulars (RIZIV "Omzendbrieven")

- URL pattern NL: `https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_YYYYMMDD.pdf`
- URL pattern FR: `https://www.inami.fgov.be/SiteCollectionDocuments/tarif_logopedes_YYYYMMDD.pdf`
- These are small 5-page PDFs attached to an accompanying XLSX (`V1-Logo DD-MM-YYYY circ OA.xlsx`). The XLSX is embedded as an attachment to the RIZIV Omzendbrief — if you can scrape the RIZIV intranet you can get it directly, otherwise parse the PDF with pdfplumber/pymupdf.
- Archive all published PDFs in halingo.be's history so you can compute historical fees for back-office audits.

### Secondary: Article 36 coordinated text

- NL: `https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_YYYYMMDD_01.pdf`
- FR: `https://webappsa.riziv-inami.fgov.be/Nomen/fr/724371/pdf/...` and mirrors
- These are the full coordinated text including all amending KBs, prescriber table, containers, etc. Update roughly every time a KB amends art. 36.

### Tertiary: Belgisch Staatsblad / Moniteur belge

- URL: `https://www.ejustice.just.fgov.be/cgi/welcome.pl`
- Publishes the full text of every KB and convention. Use this when you need the legally authoritative source (e.g. to cite the date of entry into force). Search for "Overeenkomst logopedisten" or "Art. 36".

### Tertiary: mutuality sites

- https://www.cm.be (Christelijke Mutualiteit / CM) — publishes plain-language reimbursement pages.
- https://www.solidaris.be
- https://www.helan.be
- https://www.mloz.be (Mutualité Libre / MLOZ - Onafhankelijke Ziekenfondsen)
- https://www.lm.be / https://www.mut400.be (Liberale Mutualiteiten)
- https://www.nm.be (Neutrale)
- Useful for triangulation of what the patient actually sees and for tiers-payant specifics.

### Tertiary: professional bodies

- **VVL** — `https://www.vvl.be` — Flemish side, has practice-management advice, nomenclature explainers, model house rules, aanvraagformulieren templates.
- **UPLF** — `https://www.uplf.be` — French-speaking counterpart, same role.

### Recommended sync strategy for halingo.be

1. **Weekly cron** that downloads `XML.zip`, `TXT.zip`, `UPD_XML.zip`, `UPD_TXT.zip`, `Honoraires_Prix_Remboursements_n.zip` and hashes each file. If a hash changes, diff & stage for review.
2. **On every RIZIV tariff circular publication** (roughly twice a year), also refetch the Omzendbrief PDF and reconcile with the machine-readable feed.
3. Subscribe to the `nomen@inami.fgov.be` alert list.
4. Keep a **per-date tariff snapshot table** so that when a patient queries a session from 3 June 2025, you apply the tariff that was in force on that date, not the current one.
5. For the non-convention -25 % reduction: store the **reduction-active periods** as ranges (e.g. `[2024-05-??, 2025-12-31], [2026-04-01, ?]`) and look up the therapist's convention status **at the session date**.
6. Do NOT hard-code code labels — pull them from the feed every sync to catch KB amendments (the KB of 04.06.2024 renamed many labels subtly).

---

## 8. Common pitfalls and gotchas

1. **"Bilan d'évolution" is dead.** Codes 702015/702085, 704012/704082, 706016/706086, 708013/708083, 710010/710080, 704115/704126 no longer exist since **01.08.2024**. Old RIZIV PDFs and some third-party SaaS still show them; do NOT surface them in halingo.be's UI as selectable. Keep them for historical records.
2. **The 60-minute session for children under 10 is forbidden for every disorder** (§3bis). Your UI must refuse code 712611, 714615, 711616, 733611, etc. when the patient is < 10 years old.
3. **School codes (xxx35x) are cheaper and restricted.** They use R = 2,117663 instead of 2,192383. After the first 2-year akkoord for dysfasie, school sessions are forbidden (max 5 per calendar month during the first akkoord). Several pathologies have **no** school code (6.3 neuromuscular, e dysfagie, g LIS, "sequelen van laryngectomie" is one of the rare 6° that does have a school code).
4. **A 60-min individual session counts as 2 sessions** for the container cap (§7). Your counter must understand the equivalence.
5. **A 60-min individual session is not the same as two 30-min sessions financially.** The honorarium of 77,05 (60 min) ≠ 2 × 38,37 (30 min). Bill the correct single code.
6. **Parental-guidance code equivalence:** individual parental guidance (60 min) = 2 individual treatment sessions; collective parental guidance (90 min) = 1 individual treatment session. Max 10 parental-guidance attestations per disorder per child, combined.
7. **Only one treatment session per patient per day** (§7), except that parental guidance may be combined with a treatment session on the same day.
8. **Bilans (701013/701083) and evaluatiezittingen (700991/701002) cannot be combined on the same day with a treatment session**, and are mutually exclusive with a multidisciplinary bilan in a RIZIV-conventioned rehabilitation centre (except for § 2 b) 6.3, § 2 d) and § 2 e)).
9. **Settings are not interchangeable.** 711314 (cabinet), 711336 (home), 711351 (school) all describe the same 30-min individual session at the same pathology but are distinct codes with different honoraria (school is cheaper). Picking the wrong one is billing fraud.
10. **Hospitalised codes (xxx8x "HOS") are distinct.** They don't carry the ambulatory pseudo-number; they are used only when the patient is admitted to a hospital bed. Typically billed via the hospital, not the therapist's cabinet attestation.
11. **Revalidation codes (xxx7x) are reserved for activity under a revalidation-overeenkomst.** Using these outside that setting is fraud.
12. **Prescription → bilan → treatment is a one-way sequence.** The bilan must happen **after** the prescription and **before** the treatment; the treatment must start within 60 calendar days; the bilan-reimbursement request must reach the adviserend arts within 60 calendar days of the bilan date.
13. **Container exhaustion is per disorder (stoornis), not per patient.** A child can hold simultaneous containers for dyslexie and dysfasie (within rules); but must not be granted both § 2 b) 2° and § 2 b) 3° or § 2 f) on top of each other (see explicit blocking rules in § 5 a)–p)).
14. **GP as extension-prescriber is only for some pathologies.** § 2 d) gehoorstoornissen and § 2 f) dysfasie can never be extended by a GP, only by specialists.
15. **The -25 % reduction is NEVER applied to BIM/OMNIO patients.** Even if the therapist is not conventioned and the quorum is met, BIM patients get the full reimbursement. The patient still pays the difference between the therapist's free-set honorarium and that full reimbursement.
16. **Tariff changes at mid-year** can catch you off guard. Besides 1 January, watch 1 April and 1 August. Example: 1 April 2026 wasn't a tariff change but a convention-status change that altered the non-convention reimbursement column.
17. **The R-values differ per category** — a common bug is to apply the cabinet-R to a school-session honorarium. Store R-values tied to (setting, duration, type).
18. **Buitengewoon onderwijs / special education excludes reimbursement for § 2 b) 2°, b) 3° and f) only.** Other pathologies can still be reimbursed for a child in special education.
19. **"Enkelvoudige stoornissen" (simple articulation disorders)** — sigmatisme, rhotacisme, lambdacisme, kappacisme, cluttering — are **not reimbursable**, but are still treated by logopedists on a private-pay basis. Your UI should clearly distinguish private-pay services from ZIV-reimbursable ones.
20. **Dementia-associated spraakstoornissen** are excluded from § 2 b) 6.3 even if the etiology is neurological.
21. **Per-day code 701013 vs 700991** — easy to confuse: 701013 is the initial bilan *before* treatment; 700991 is the new within-treatment evaluation session. The RIZIV internal forms and the aanvraagformulier differ.
22. **The "VVL supplement" or "UPLF supplement"** that some therapists add is a professional-association fee, not a nomenclature fee. It is not reimbursed.
23. **Conventioned ≠ no supplements.** Conventioned therapists may still charge patient-request supplements (weekend, home without necessity). Non-conventioned therapists are not bound by the honoraria, so their invoice can be any amount.
24. **Partial adhesion does not exist** for logopedists (unlike for doctors). Don't expose a "partial" toggle in your onboarding flow.
25. **Cancellation fees are never on an attestation** — they are a private-contract matter, must be invoiced separately, and can never be presented as a reimbursable nomenclature code.

---

## 9. Terminology glossary (NL / FR / EN)

| Dutch | French | English (informal) | Meaning |
|---|---|---|---|
| Logopedist | Logopède | Speech-language therapist / SLT / SLP | The profession |
| RIZIV | INAMI | NIHDI | The federal health insurance body |
| Nomenclatuur | Nomenclature | Nomenclature | The legal catalogue of reimbursable acts |
| Verstrekkingsnummer | Numéro de prestation | Act code / procedure code | The numeric code for each act |
| Honorarium | Honoraires | Fee | The gross fee charged |
| Tegemoetkoming | Intervention (de l'assurance) | Reimbursement | What the mutuality pays back |
| Terugbetaling | Remboursement | Reimbursement | Same |
| Remgeld | Ticket modérateur | Patient co-payment | What the patient pays out of pocket |
| Rechthebbende | Bénéficiaire | Insured person / beneficiary | The patient entitled to ZIV reimbursement |
| Verhoogde tegemoetkoming / BIM / OMNIO | Régime préférentiel / BIM-OMNIO | Preferential / low-income scheme | Higher-reimbursement status |
| Voorkeurregeling | Régime préférentiel | (same) | (same) |
| Adviserend arts | Médecin-conseil | Advising physician | Doctor of the mutuality who approves applications |
| Akkoord | Accord | Agreement (for a treatment period) | Authorisation from the adviserend arts |
| Kennisgeving (van verlenging) | Notification (de prolongation) | Extension notification | Simpler form for extending a treatment |
| Bilanzitting / aanvangsbilan | Séance de bilan / bilan initial | Initial assessment | The first diagnostic session (701013) |
| Evaluatiezitting | Séance d'évaluation | Mid-treatment evaluation | New since 2024 (700991) |
| Zitting | Séance | Session | A 30 or 60-min treatment unit |
| Individuele zitting | Séance individuelle | Individual session | One-to-one |
| Collectieve zitting | Séance collective | Group session | 2 or more patients (usually up to 4) |
| Ouderbegeleiding | Guidance parentale | Parental guidance | Sessions with parents, no child present |
| Kabinet (van de logopedist) | Cabinet (du logopède) | Office / practice | Main setting |
| Ten huize van de rechthebbende | Au domicile du bénéficiaire | At patient's home | Home visits |
| Op school | À l'école | At school | In-school sessions |
| Revalidatie-overeenkomst | Convention de rééducation fonctionnelle | Rehabilitation agreement | Federated-level rehab framework |
| Gehospitaliseerde rechthebbende | Bénéficiaire hospitalisé | Hospitalised patient | Inpatient |
| Overeenkomstencommissie | Commission de conventions | Convention Commission | RIZIV committee that negotiates the biennial convention |
| Geconventioneerd | Conventionné | Conventioned / accredited | Logopedist who has adhered to the national convention |
| Niet-geconventioneerd | Non-conventionné | Non-conventioned / not accredited | Logopedist who has opted out |
| Toetreding | Adhésion | Adhesion | Individual accession to the convention |
| Voorschrift | Prescription | Prescription / referral | Doctor's prescription for logopedic treatment |
| Attestation de soins donnés / getuigschrift voor verstrekte hulp | Attestation de soins donnés | Certificate of care | The paper form the patient submits to the mutuality |
| Tiers-payant | Tiers payant | Third-party payer | Therapist bills mutuality directly |
| Aanvraagformulier | Formulaire de demande | Application form | Form sent to the adviserend arts |
| Limitatieve lijst van tests | Liste limitative des tests | Approved-test list | The commission-approved list of standardised tests for each pathology |
| Stotteren | Bégaiement | Stuttering | § 2 b) 6.4 |
| Afasie | Aphasie | Aphasia | § 2 b) 1° |
| Dysartrie | Dysarthrie | Dysarthria | § 2 b) 6.2 |
| Dysglossie | Dysglossie | Dysglossia | § 2 b) 6.1 |
| Dysfasie | Dysphasie | Dysphasia / DLD | § 2 f) |
| Dysfagie | Dysphagie | Dysphagia | § 2 e) |
| Gehoorstoornis | Trouble auditif | Hearing impairment | § 2 d) |
| Gespleten lippen / gehemelte | Fente labiale / palatine | Cleft lip / palate | § 2 b) 4° |
| Laryngectomie | Laryngectomie | Laryngectomy | § 2 c) 1° |
| Stemstoornis | Trouble de la voix | Voice disorder | § 2 c) 2° |
| Locked-in Syndroom | Locked-in Syndrome | LIS | § 2 g) |
| VFES | VFES | Videofluoroscopic Evaluation of Swallowing | Dysphagia diagnostic |
| FEES | FEES | Fiberoptic Endoscopic Evaluation of Swallowing | Dysphagia diagnostic |

---

## 10. Freshness notes — what is likely to change

- **R-values update on 1 January every year** (linear health-index indexation). Expect a new tariff circular in mid-December 2026 for 1 January 2027 with an indexation percentage in the 1.5–3.5 % range depending on the index evolution.
- **R/26-27 expires 31 December 2027.** A new convention R/28-29 will be signed in late 2027. Between signature and 60-day-opt-out deadline, individual adhesion status may fluctuate. Between 1 January 2028 and the quorum confirmation (usually March), the -25 % non-convention reduction is not applied — **this is a recurring cliff that your engine must handle**.
- **Nomenclature revisions under R/26-27 working groups** (expected during 2026-2027): revision of § 2 b) 2° (taalontwikkelingsstoornissen) and § 2 f) (dysfasie) — possibly merged or renamed; revision of § 2 c) 2° (stemstoornissen); integration of a "quality patient file" in the nomenclature (could imply a new code or a conditional reimbursement).
- **KB 21.06.2025** opened reimbursement of § 2 b) 2° and f) for patients with IQ < 86. Implementation in the nomenclature may follow — watch RIZIV news.
- **Compendium updates** — the RIZIV Compendium is updated irregularly (the last significant update was after KB 4.6.2024). Re-download it when you see a "wijzigingen op DD/MM/YYYY" post on the RIZIV logopedist news page.
- **Limitatieve lijst van tests** — updated separately from the nomenclature; last reliable re-publication on 03/04/2026. Product must treat these as a separate reference dataset.
- **Social status amounts** for conventioned logopedists change yearly. Separate from tariffs but relevant for the therapist onboarding KYC.
- **Non-convention -25 % rule — applicability window** can move within a convention period. Treat it as a time-bounded flag, not a static convention-wide attribute.

### Verification pass 2026-04-06 — resolution of the five open items

(See the full verification note at [`verification-2026-04/01-riziv.md`](verification-2026-04/01-riziv.md).)

- **Item 1 — Art. 36 FR labels for individual-session codes beyond §1, §2 a) and §2 b) 1°/2° → RESOLVED.** All FR labels follow a fully predictable pattern tied only to the five session settings (cabinet / ten huize / school / revalidation / HOS) and duration (30 min / 60 min / collective 60 min / parental guidance 60 min ind. / parental guidance 90 min coll.). The bilingual coordinated text is in the RIZIV Compendium v24.04.2025, pp. 6–19. Only exception: `733353` (dysfasie-school 30 min) has an extended label referencing the "max 5 per kalendermaand" school-session restriction of § 5, p). See verification note for the full table and NomenSoft spot-check citations.
- **Item 2 — -25% non-convention honorarium reduction: R/24-25 window → RESOLVED.** The reduction was OFF from 2024-01-01 to 2024-03-31, ON from **2024-04-01** (after 67.38 % quorum confirmed 11-03-2024) through **2025-12-31** (end of R/24-25), OFF again from 2026-01-01 to 2026-03-31, and ON from **2026-04-01** (after 84 % quorum confirmed 23-03-2026) onward. Source: verbatim quotes from Omzendbrieven VI 2023/393, VI 2024/79, VI 2024/405 and VI 2026/56 — all archived in the verification note.
- **Item 3 — RIZIV Compendium full pass → RESOLVED.** The 34-page bilingual Compendium (version 24.04.2025) was parsed end-to-end. It adds ~30 interpretive clarifications not in bare Article 36, most notably: (a) the 60-day retroactivity clock runs from reception of the LAST of aanvraagformulier + voorschrift; (b) one etiology → one application on the most severe disorder; (c) K30/K60 multidisciplinary cumulation is explicitly forbidden on the same day; (d) internat sessions outside school hours must use the "domicile" code; (e) §2 a) akkoord is capped at 2 years even though the text does not state it; (f) §2 b) 4° uses independent akkoorden (NOT kennisgeving-extensions); (g) vocal-nodule re-treatment rule; (h) audiogram/IQ validity rules. See verification note §3 for the full list — these should be folded into file 01's "Common pitfalls and gotchas" in a subsequent pass.
- **Item 4 — Bevoegdheidscodes (qualification codes) for logopedisten → RESOLVED.** Exactly **two** codes: **801 = Gegradueerden in de logopedie**; **802 = Licentiaten in de logopedie**. Source: `bevoegdheidscodes_logopedisten.pdf` on the RIZIV Bevoegdheidscodes hub, parsed verbatim (1-page PDF, two-row table). No specialist sub-codes, no pathology-specific codes. Pathology-level recognition is handled per-patient via eAgreement/aanvraagformulier, not via a therapist-level code.
- **Item 5 — Home-visit supplement exact amount → RESOLVED.** There is **no nomenclature code and no fixed cent amount**. The legal basis is **Article 3 §1 of the national convention** (identical text in R/24-25 and R/26-27), which allows the logopedist to agree with the beneficiary on "**un montant supplémentaire raisonnable de frais de déplacement**" for out-of-cabinet sessions at the patient's request. Article 3 §2 states explicitly that "les frais de déplacement susvisés ne sont pas remboursés au bénéficiaire dans le cadre de l'assurance obligatoire soins de santé". Article 3 §3 imposes a **pre-treatment information** obligation. Honoraria for home/revalidation/hospital sessions are **identical** to the cabinet honorarium (home 711336 = cabinet 711314 = € 38,37 at 2026-01-01). Only school honoraria are different (lower: € 37,06), with R = 2,117663 vs 2,192383.

---

## 11. Sources

Primary (RIZIV / INAMI / BS):

- [RIZIV — Logopedisten hub (NL)](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten) — Index of all logopedist-related documents; last verified 2026-04-06.
- [INAMI — Logopèdes hub (FR)](https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes) — Index FR.
- [Nomenclatuurart36 coordinated text, in force 01.08.2024 (NL PDF)](https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf) — 25-page coordinated text of Art. 36; used to extract the full code list, the prescriber table, the container table, and the §§ 3, 4, 5, 6, 7, 8 rules.
- [RIZIV — Honoraria logopedisten (hub listing all tariff circulars)](https://www.riziv.fgov.be/nl/thema-s/verzorging-kosten-en-terugbetaling/wat-het-ziekenfonds-terugbetaalt/individuele-verzorging/honoraria-prijzen-en-vergoedingen/honoraria-prijzen-en-tegemoetkomingen-van-logopedisten) — List of all tariff circulars for logopedie, sorted newest first.
- [Tarieven logopedisten vanaf 01-01-2026 (PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260101.pdf) — Omzendbrief VI 2025/350 of 16.12.2025. Source for all the honorarium / reimbursement numbers used in the tables of section 3.
- [Tarifs logopèdes à partir du 01-01-2026 (PDF, FR)](https://www.inami.fgov.be/SiteCollectionDocuments/tarif_logopedes_20260101.pdf) — Used to verify French labels per pathology.
- [Tarieven logopedisten vanaf 01-04-2026 (PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260401.pdf) — Omzendbrief VI 2026/56 of 23.03.2026; confirms activation of -25 % reduction on 1 April 2026 after 84 % adhesion quorum.
- [Tarieven logopedisten vanaf 01-01-2025 (PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20250101.pdf) — Used for historic R-values and +3,34 % 2025 indexation.
- [Convention R/2026-2027 (PDF, FR)](https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2026_2027.pdf) — Full legal text of R/26-27 convention including R-values, adhesion rules, budget objective € 218.688 M.
- [Convention R/2024-2025 (PDF, FR)](https://www.riziv.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2024_2025.pdf) — Previous convention, used for historic R-values and comparing rules.
- [RIZIV — Overeenkomst 2026-2027 voor de logopedisten](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten) — Press page: signing date, 84 % adhesion, 25 %-reduction activation on 1 April 2026.
- [RIZIV — Overeenkomst 2024-2025 voor de logopedisten](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2024-2025-voor-de-logopedisten) — R/24-25 reference page.
- [RIZIV nieuws — Overeenkomsten met gezondheidssectoren voor 2026-2027](https://www.riziv.fgov.be/nl/nieuws/overeenkomsten-met-gezondheidssectoren-voor-2026-en-2027-onontbeerlijk-voor-betaalbare-en-kwalitatieve-zorg) — Press release on 2026-2027 conventions across all sectors.
- [RIZIV — Toetredingscijfers tariefakkoorden 2024-2025](https://www.riziv.fgov.be/nl/pers/toetredingscijfers-tariefakkoorden-beschikbaar-akkoorden-artsen-tandartsen-kinesitherapeuten-en-logopedisten-2024-2025) — Source for the 67.38 % adhesion figure for R/24-25 confirmed on 11 March 2024.
- [RIZIV — Nomenclatuur van de logopedische verstrekkingen: wijzigingen op 1 augustus 2024](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/nomenclatuur-van-de-logopedische-verstrekkingen-wijzigingen-op-1-augustus-2024) — Detail on KB 04.06.2024 changes (bilan d'évolution removal, akkoorden 2 years, extension via kennisgeving).
- [RIZIV — Nomenclatuur artikel 36 (hub)](https://www.riziv.fgov.be/nl/nomenclatuur/nomen/Paginas/nomen-artikel36.aspx) — Landing page with link to current PDF and interpretive rules.
- [NomenSoft (nl search)](https://webappsa.riziv-inami.fgov.be/Nomen/nl/search) — Primary human-readable lookup; used to verify label of 701013 and its R-values.
- [NomenSoft — code 701013](https://webappsa.riziv-inami.fgov.be/Nomen/nl/701013) — Verification of code 701013 label, article reference, creation/amendment KBs, R-value 2.593102.
- [INAMI — Tableaux avec des données de base de la nomenclature](https://www.inami.fgov.be/fr/nomenclature/tableaux/Pages/default.aspx) — Documentation of the XML / TXT downloads for the full nomenclature; source of the file URL patterns in §7.
- [INAMI — Quel est le contenu de NomenSoft](https://www.riziv.fgov.be/fr/programmes-web/quel-est-le-contenu-de-nomensoft) — NomenSoft contents and contact e-mail.
- [RIZIV — Compendium bij de nomenclatuur van de logopedische verstrekkingen](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/compendium-bij-de-nomenclatuur-van-de-logopedische-verstrekkingen) — Compendium landing page (document updated after KB 4.6.2024).
- [RIZIV — Limitatieve lijst van tests (toepassingsregels 01/08/2024)](https://www.riziv.fgov.be/SiteCollectionDocuments/lijst-logopedist-tests-toepassing-20240801.pdf) — The limitative-test list that governs which diagnostic tools must be used per pathology.
- [Belgisch Staatsblad / Moniteur belge](https://www.ejustice.just.fgov.be/cgi/welcome.pl) — Authoritative publication venue for every KB and for the conventions; used as the reference for publication dates.

Secondary / professional bodies / mutualities:

- [VVL — Vlaamse Vereniging voor Logopedisten](https://vvl.be/) — Flemish professional body; model house rules, tariff posters.
- [UPLF — Union Professionnelle des Logopèdes Francophones](https://uplf.be/) — French-speaking counterpart.
- [CM — Christelijke Mutualiteit — Speech therapy disorders](https://www.cm.be/en/speech-therapy-disorders) — Patient-facing explanation of reimbursement.
- [CM — Reimbursement for speech therapy treatment](https://www.cm.be/en/healthcare-providers/speech-therapists/treatment-reimbursement) — Patient-facing; restricted but referenced for structure. (Returned 403 to WebFetch on 2026-04-06 — re-verify manually.)
- [Slimmerik — Wijzigingen conventie logopedie](https://www.slimmerik.be/wijzigingen-conventie-logopedie/) — Third-party blog summarising the KB 4.6.2024 changes from a practice-management viewpoint. Used only for triangulation.
- [Vandenbroucke.belgium.be — Conventie logopedisten goedgekeurd](https://vandenbroucke.belgium.be/nl/conventie-logopedisten-goedgekeurd-door-de-ministerraad) — Ministerial press statement on convention approval.

Ministerial decrees referenced in Article 36 (all consolidated in the NL coordination PDF, published in the BS/MB):

- KB 14 september 1984 — original KB establishing the nomenclature of health services.
- KB 15 mei 2003 (in force 1.6.2003) — original basis for the current Chapter X (logopedie).
- KB 26 juli 2005 (in force 1.8.2005) — amendments to §§ 4, 7.
- KB 5 augustus 2006 (in force 1.10.2006) — amendments to 6.2, 6.4.
- KB 19 februari 2008 (in force 1.4.2008) — overhaul (added dysfasie, parental guidance first version).
- KB 21 oktober 2008 (in force 1.12.2008) — amendment to § 1.
- KB 6 juni 2012 (in force 1.8.2012) — amendments to 6.2, § 4, § 6.
- KB 10 november 2012 (in force 1.1.2013) — added § 3bis (no 60-min session for under-10s).
- KB 4 juli 2013 (in force 1.9.2013) — deletion of many "cabinet buitenuren" and "ten huize van de logopedist" codes.
- KB 14 februari 2017 (in force 1.4.2017) — introduction of Locked-in Syndrome, new parental guidance codes, amendments to § 1, § 4.
- KB 8 februari 2023 (in force 1.5.2023) — reworded numerous pathology definitions, expanded prescriber lists.
- KB 15 september 2023 (in force 1.12.2023 / 1.5.2023) — clarifications, exclusions on § 2 b) 2° after dyslexie treatment.
- **KB 4 juni 2024 (in force 1.8.2024)** — major reorganisation (bilan d'évolution abolished, 2-year akkoorden, evaluatiezitting 700991/701002, extension via kennisgeving, eAgreement).
- KB 17 juli 2024 / KB 21 juni 2025 — opened § 2 b) 2° and f) treatments to patients with IQ < 86.

---

### Key uncertainties / caveats as of 2026-04-06

- Exact French labels for each of the ~100 individual session codes were verified only for the bilan and the § 2 a) / § 2 b) 1° / § 2 b) 2° examples against the French tariff PDF. Other French labels in section 3 are back-translated from Dutch and should be re-verified against NomenSoft per code before going to production UI.
- The R-values shown for each category are from the convention R/26-27 Art. 2 and cross-verified against the 01/01/2026 tariff circular. They hold until the 1 January 2027 indexation.
- The 60 % quorum rule for the -25 % non-convention reduction is legally grounded in KB 08.06.1967 but the **exact window** of application during 2024 (between when the Commission confirmed the 67.38 % number on 11.03.2024 and any possible earlier retroactive application) should be double-checked against the RIZIV news page before billing retroactively.
- The claim that "conventioned ≠ no supplements" was verified from R/26-27 Art. 4 § 2 — the text explicitly allows special-hours and home-without-necessity supplements.
- The `Honoraires_Prix_Remboursements_n.zip` and `XML.zip` file URLs at `inami.fgov.be/SiteCollectionDocuments/` are stable as of 2026-03-27 (last generation date of the reference tables) but may be renamed by RIZIV without notice — re-verify on your weekly sync job.
- The "Compendium" contents (which is longer and more didactic than the Art. 36 coordination text) were not read in full for this document — do a thorough pass on the Compendium before shipping billing logic.
- Cancellation-fee practices are not part of the nomenclature and are not sourced from RIZIV at all — the guidance in §6 is practitioner-practice based, confirmed via VVL/UPLF general guidance but not backed by a legal norm.
