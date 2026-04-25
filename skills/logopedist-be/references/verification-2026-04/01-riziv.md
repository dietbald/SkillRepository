# Verification pass 2026-04-06 — File 01 (RIZIV Nomenclature)

This note resolves the five remaining uncertainties recorded at the bottom of `01-riziv-nomenclature-and-tariffs.md` after the first-pass research. Each item is tagged RESOLVED / PARTIAL / STILL OPEN with primary-source URLs and verbatim quotes where appropriate.

## Item 1 — Article 36 FR labels for individual-session codes beyond §1, §2 a) and §2 b) 1°/2°

**Status:** RESOLVED

**Finding:** The French labels for every individual-session code in §§ 2 b) 3°, 4°, 5°, 6.1, 6.2, 6.3, 6.4, 6.5, c) 1°, c) 2°, d), e), f), g) are available verbatim in the bilingual coordinated text embedded in the **RIZIV Compendium voor logopedie (PDF, version 24.04.2025)**, pages 6–19. They follow a fully predictable pattern tied only to the five session settings, independent of pathology. For every pathology, the 30-minute codes use these five labels:

| Setting | Dutch label | French label |
|---|---|---|
| Cabinet (kabinet) | Individuele zitting van ten minste 30 minuten in het kabinet van de logopedist | Séance individuelle d'au moins 30 minutes au cabinet du logopède |
| Home (ten huize) | Individuele zitting van ten minste 30 minuten ten huize van de rechthebbende | Séance individuelle d'au moins 30 minutes au domicile du bénéficiaire |
| School | Individuele zitting van ten minste 30 minuten op de school van de rechthebbende | Séance individuelle d'au moins 30 minutes à l'école du bénéficiaire |
| Revalidation framework | Individuele zitting van ten minste 30 minuten in het kader van een revalidatie-overeenkomst | Séance individuelle d'au moins 30 minutes dans le cadre d'une convention de rééducation fonctionnelle |
| Hospitalised (HOS) | Individuele zitting van ten minste 30 minuten voor een gehospitaliseerde rechthebbende | Séance individuelle d'au moins 30 minutes pour un bénéficiaire hospitalisé |

The 60-minute variants substitute "d'au moins 60 minutes" / "van ten minste 60 minuten". The collective 60-minute variants substitute "Séance collective" / "Collectieve zitting". Parental-guidance variants follow fixed labels shared across all pathologies:

- `711012 / 711115 / 711211 / 712014 / 712110 / 712213` — **"Séance individuelle de guidance parentale, d'au moins 60 minutes, au cabinet du logopède, en l'absence du patient"** / "Individuele zitting van ouderbegeleiding die ten minste 60 minuten duurt, in het kabinet van de logopedist, in afwezigheid van de patiënt"
- `713016 / 713112 / 713215 / 714011 / 714114 / 714210` — **"Séance collective de guidance parentale d'une durée d'au moins 90 minutes, par type de trouble, pour trois, quatre, cinq ou six couples de parents, au cabinet du logopède et en l'absence du patient par séance et par bénéficiaire"**

The §1 bilan code `701013/701083` has the label **"Séance de bilan d'au moins 30 minutes avant le début d'un traitement logopédique"** and the new evaluatiezitting `700991/701002` has the label **"Séance d'évaluation de plus de 30 minutes"** (in force since 01/08/2024).

The pathology-category headers used on the French tariff circular (source for the category names in any product UI) are:
- § 2, a), 1°-3° — **"Troubles du langage oral et/ou de la parole"**
- § 2, b), 1° — **"Aphasie"**
- § 2, b), 2° — **"Troubles du développement du langage démontrés par un test du langage"**
- § 2, b), 3° — **"Dyslexie et/ou dysorthographie et/ou dyscalculie"**
- § 2, b), 4° — **"Troubles résultant de l'existence de fentes labiales, palatines ou alvéolaires"**
- § 2, b), 5° — **"Troubles acquis suite à une intervention radiothérapeutique ou chirurgicale (tête et cou)"**
- § 2, b), 6° — **"Troubles acquis de la parole"** (subdivided in 6.1 "Dysglossies traumatiques ou prolifératives"; 6.2 "Dysarthries"; 6.3 "Troubles chroniques de la parole consécutifs à des affections neuromusculaires"; 6.4 "Bégaiement"; 6.5 "Troubles fonctionnels multiples dans le cadre d'un traitement interceptif d'orthodontie")
- § 2, c), 1° — **"Séquelles de laryngectomie"**
- § 2, c), 2° — **"Dysfonctionnement du larynx et/ou des plis vocaux"**
- § 2, d) — **"Troubles de l'ouïe"**
- § 2, e) — **"Dysphagie"**
- § 2, f) — **"Dysphasie"**
- § 2, g) — **"Locked-in Syndrome (LIS)"**

**Note on §3 code labels:** The uncertainty was phrased as "§3 codes" in the hand-off. §3 of Art. 36 contains **exclusion rules** (no reimbursement if patient is in special education, hospitalised in G/T/A/Sp/K, in PVT/ROB/RVT, etc.), **not individual session codes**, so there is nothing to label in French for §3. The remaining FR labels needed were for all the individual session codes in §2 b) 3° through §2 g), which are resolved above.

Individual codes were spot-verified directly against NomenSoft to confirm the pattern:

- `714313` → "Séance individuelle d'au moins 30 minutes au cabinet du logopède" (§2 b) 3° cabinet)
- `717312` → "Séance individuelle d'au moins 30 minutes au cabinet du logopède" (§2 b) 4° cabinet)
- `711336` → "Séance individuelle d'au moins 30 minutes au domicile du bénéficiaire" (§2 a) home)
- `711351` → "Séance individuelle d'au moins 30 minutes à l'école du bénéficiaire" (§2 a) school)
- `711373` → "Séance individuelle d'au moins 30 minutes dans le cadre d'une convention de rééducation fonctionnelle" (§2 a) revalidation)
- `711384` → "Séance individuelle d'au moins 30 minutes pour un bénéficiaire hospitalisé" (§2 a) HOS)
- `712611 / 712633 / 712670 / 712681` → 60-min variants of the same four settings
- `712412` → "Séance collective d'au moins 60 minutes au cabinet du logopède"
- `700991` → "Séance d'évaluation de plus de 30 minutes"
- `711012` → "Séance individuelle de guidance parentale, d'au moins 60 minutes, au cabinet du logopède, en l'absence du patient"
- `713016` → "Séance collective de guidance parentale d'une durée d'au moins 90 minutes, par type de trouble, pour trois, quatre, cinq ou six couples de parents, au cabinet du logopède et en l'absence du patient"

Pattern is 100% consistent across all spot checks — the product-side implementation can treat FR labels as `{session-type-template}[+ suffix "avec un maximum de 5 par mois calendrier. Des séances à l'école ne sont plus autorisées au-delà de la période de 2 ans visée au § 5, p)." only for code 733353 — the dysfasie-school 30-min code]`. Exception: `733353` has an extended label because §5 p) restricts school sessions after the first 2-year akkoord.

**Sources:**
- [RIZIV Compendium voor logopedie (PDF, 34 p., version approuvée 24.04.2025)](https://www.riziv.fgov.be/SiteCollectionDocuments/logopedes_compendium_20250424.pdf) — bilingual coordinated nomenclature text (pages 6–20 for the session codes).
- [Tarifs logopèdes 01-01-2026 (PDF, FR)](https://www.inami.fgov.be/SiteCollectionDocuments/tarif_logopedes_20260101.pdf) — French category headers, Omzendbrief VI 2025/350.
- NomenSoft per-code FR labels (spot-verified): https://webappsa.riziv-inami.fgov.be/Nomen/fr/714313, /717312, /711336, /711351, /711373, /711384, /712611, /712633, /712670, /712681, /712412, /700991, /711012, /713016

---

## Item 2 — -25% non-convention honorarium reduction: exact window during R/24-25

**Status:** RESOLVED

**Finding:** The -25% reduction (pursuant to KB 8 June 1967) was **activated on 1 April 2024** after the Verzekeringscomité confirmed the 67.38 % adhesion figure on 11 March 2024, and remained in force continuously until **31 December 2025** (end of R/24-25). For the first three months of R/24-25 (1 January 2024 – 31 March 2024) the reduction was **not** applied because the quorum had not yet been confirmed. The reduction is then reset at each new convention period: it was **NOT applied between 1 January 2026 and 31 March 2026** (quorum not yet confirmed for R/26-27), and was **reactivated on 1 April 2026** after the 23 March 2026 confirmation of the 84 % adhesion figure for R/26-27.

**Verbatim quotes (primary sources):**

From **Omzendbrief VI 2023/393 of 19-12-2023** (tariff circular for 1 January 2024):

> "De vermindering van de ZIV-tegemoetkoming (conform het Koninklijk Besluit van 8 juni 1967) is momenteel niet van toepassing voor verstrekkingen uitgevoerd door logopedisten die niet zijn toegetreden tot de nationale overeenkomst. Het Verzekeringscomité dient eerst vast te stellen of het toetredingspercentage het quorum van 60 procent bereikt."

From **Omzendbrief VI 2024/79 of 19-3-2024** (tariff circular for 1 April 2024):

> "Op 11 maart 2024 heeft het Verzekeringscomité vastgesteld dat het quorum van 60% van het aantal toetredingen bereikt is (67,38%). Vanaf 1 april 2024 is de vermindering van de ZIV-tegemoetkoming (conform het Koninklijk Besluit van 8 juni 1967) van toepassing voor verstrekkingen uitgevoerd door logopedisten die niet zijn toegetreden tot de nationale overeenkomst. Deze vermindering is niet van toepassing voor de rechthebbenden op de verhoogde tegemoetkoming."

The **Omzendbrief VI 2024/405 of 16-12-2024** for the 1 January 2025 indexation (+3,34 %) makes no change to this reduction, so the -25% remained continuously in force from 1 April 2024 through the end of R/24-25 on 31 December 2025.

From **Omzendbrief VI 2026/56 of 23-3-2026** (tariff circular for 1 April 2026):

> "Op 23 maart 2026 werd door het Verzekeringscomité vastgesteld dat het quorum van 60% van het aantal toetredingen bereikt is. De vermindering met 25% van de ZIV-tegemoetkoming (conform het koninklijk besluit van 8 juni 1967) is van toepassing vanaf 1 april 2026 voor verstrekkingen uitgevoerd door logopedisten die niet zijn toegetreden tot de nationale overeenkomst. Deze vermindering is niet van toepassing voor de rechthebbenden op de verhoogde tegemoetkoming."

**Affected codes:** The reduction applies to the ZIV-tegemoetkoming for **every reimbursable individual or collective logopedic act in Art. 36** (all bilans §1, all treatment sessions §2, all parental-guidance sessions), in all five settings (cabinet, home, school, revalidation, hospital). It does **not** apply to BIM/OMNIO patients ("rechthebbenden op de verhoogde tegemoetkoming").

**Reduction-active periods to encode:**

| Period | Non-convention -25% | Trigger |
|---|---|---|
| 2024-01-01 → 2024-03-31 | OFF | Quorum not yet confirmed for R/24-25 |
| 2024-04-01 → 2025-12-31 | ON | 67.38 % adhesion confirmed 11-03-2024 |
| 2026-01-01 → 2026-03-31 | OFF | Quorum not yet confirmed for R/26-27 |
| 2026-04-01 → 2027-12-31 | ON | 84 % adhesion confirmed 23-03-2026 |

(Product implementation: store these as an open range table keyed by date; end date of the 2026 range will be set once the next convention period is published.)

**Sources:**
- [Tarief logopedisten 01-01-2024 (Omzendbrief VI 2023/393, PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20240101.pdf)
- [Tarief logopedisten 01-04-2024 (Omzendbrief VI 2024/79, PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20240401.pdf)
- [Tarief logopedisten 01-01-2025 (Omzendbrief VI 2024/405, PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20250101.pdf)
- [Tarief logopedisten 01-04-2026 (Omzendbrief VI 2026/56, PDF)](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260401.pdf)
- [RIZIV — Overeenkomst 2024-2025 voor de logopedisten](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2024-2025-voor-de-logopedisten)

---

## Item 3 — RIZIV Compendium full pass for logopedie

**Status:** RESOLVED

**Finding:** The full 34-page **Compendium voor de nomenclatuur van de logopedische verstrekkingen (version approuvée 24.04.2025)** was downloaded, parsed, and read end-to-end. It is bilingual NL/FR on every page. Its structure is: the coordinated nomenclature text in white background, practical questions in gray background, and Commission responses in yellow background. File 01 already captures most of the primary rules from the Article 36 coordinated text, but the Compendium contains several interpretive clarifications that are **not** in the nomenclature itself and that the first-pass missed. Key additions:

**New clarifications to integrate in file 01:**

1. **60-day deadline — reception date of the LAST of two required documents.** The 60-day retroactivity deadline (§4, 1°) is computed against the date the adviserend arts receives the **last** of the two required documents (aanvraagformulier + voorschrift). If they arrive on different dates, the later date counts. Chronology is still mandatory: voorschrift → bilan → voorschrift voor behandeling → begin van behandeling. A Moniteur/BS interpretive rule of 19 January 2005 confirms this. (Compendium p. 21–22.)

2. **Two distinct pathologies in the same patient from one etiology = ONE application.** When a single etiology (e.g., CVA) causes two distinct reimbursable disorders (e.g. afasie + dysfagie), only **one** application is submitted — on the basis of the **most pronounced** disorder — and the patient is treated holistically under one administrative code. When two distinct etiologies produce two disorders (e.g. a learning disorder + an orthodontic-interceptive myofunctional disorder), two separate applications are submitted. In both cases, only one session per day is reimbursable (§7). (Compendium p. 22–23.)

3. **K30/K60 multidisciplinary cumulation exclusion.** Logopedie in nomenclature **cannot** be cumulated on the same day with a K30/K60 session (multidisciplinary revalidation in a hospital by a kinesitherapist/ergotherapist) — for both ambulatory and hospitalized patients. (Compendium p. 20; answer dated 24.10.2019.) File 01's §7 cumulation section should mention this.

4. **Internat (boarding-school) sessions outside school hours = use the "domicile" code.** Sessions provided at the boarding school outside school hours should be attested with the **home** code (e.g., 711336), NOT the school code. (Compendium p. 4.)

5. **School codes may also be used outside school periods.** Conversely, the school code may be used during school holidays for sessions actually provided at the school premises. (Compendium p. 4.)

6. **Ambulatory hospital-room sessions use the cabinet code.** When an ambulatory (non-admitted) patient receives treatment in a hospital-based logopedie room that is billable under nomenclature, the **"cabinet"** code must be used, not the hospital HOS code. (Compendium p. 7–8.)

7. **Formal evaluation within a 2-year akkoord is a mandatory in-container activity.** §5 now explicitly requires at least one formal evaluation during each 2-year akkoord, using a test from the limitative test list for the disorders that require it. This evaluation is **part of the maximum container of treatment sessions** — it is NOT the new 700991/701002 evaluatiezitting (which is outside the container). (Compendium p. 28.)

8. **Vocal-cord nodules — no new akkoord after 2 years.** A patient treated for 2 years for nodules cannot receive a new akkoord for the same indication unless the nodules were surgically removed and reappeared. Only then is it treated as a new organic lesion. (Compendium p. 16.)

9. **§ 2, a) akkoord duration = 2 years max.** Even though §2 a) (professional handicap) does not explicitly state duration in the nomenclature, the Commission confirms the 2-year cap applies: "La période totale maximale d'accord est, pour les troubles prévus au § 2, a) aussi, limitée à une période continue totale maximale de traitement de 2 années à partir du début du traitement remboursé par les organismes assureurs." (Compendium p. 6–7.)

10. **IQ test validity — 2-year minimum between re-measurements.** (Compendium p. 8.)

11. **Audiogram validity — unlimited, unless surgical intervention has occurred since.** (Compendium p. 8.)

12. **Audiogram must be provided by an ORL, audicien or audioloog** (not by the logopedist). (Compendium p. 8.)

13. **An akkoord for §2 b) 2° (TOS) cannot begin before the date of the total IQ measurement.** (Compendium p. 8.)

14. **ALDeQ parental questionnaire for multilingual children** — must be completed to evaluate language development in the non-tested mother tongue(s). Decision tree on RIZIV website. (Compendium p. 8–9.)

15. **If during a §2 b) 2° treatment a dysphasia diagnosis emerges, a new application for §2 f) must be filed.** (Compendium p. 18.)

16. **§3 exclusion for buitengewoon onderwijs includes holiday periods.** No exception for school-vacation periods — the exclusion from reimbursement applies year-round as long as the child is registered in buitengewoon onderwijs. (Compendium p. 19.)

17. **§3 exclusion for G-unit hospitalisation applies regardless of day/night/partial admission.** (Compendium p. 20.)

18. **Patient in a day-care centre recognised as 7.55 (erkend dagverzorgingscentrum)** — logopedie is included in the day-price and cannot be attested via nomenclature for the days the patient attends the centre. On days the patient does NOT attend, nomenclature treatment can be billed normally. (Compendium p. 20.)

19. **Logopedist in a CGG/health-mental-care centre cannot bill nomenclature for work performed in that role** because §3 excludes "stoornissen ten gevolge van psychiatrische aandoeningen". They can be subsidised by the Region as salaried staff. However, a patient already having a nomenclature akkoord for a non-psychiatric disorder may separately attend a CGG for a mental-health concern without losing the logopedie reimbursement. (Compendium p. 21.)

20. **Candidate specialist in training (stagiair) may sign prescriptions** without countersignature from the supervisor. (Compendium p. 26.)

21. **Dentists (general and orthodontic specialists) may only prescribe treatment sessions, NOT the bilan.** The bilan prescription for §2 b) 6.5 must come from a specialist listed in §1 of the nomenclature. (Compendium p. 27.)

22. **Prescription specifying "X sessions per week" is incorrect.** The mutuality can request a new prescription or compute equivalent deduction itself. (Compendium p. 27.)

23. **The bilan initial stored in the patient file must include: therapist ID, patient ID, setting, disorder per nomenclature terminology, anamnesis/observations/exams, test results with raw scores and normative interpretation, conclusion justifying proposed treatment, proposed treatment plan with start date, frequency, duration, location.** The aanvraagformulier model is fixed by the Verzekeringscomité. (Compendium p. 27–28.)

24. **eAgreement use is explicit since §9.** Each start or extension of a treatment must be registered via eAgreement when available; the original paper flux is still valid. Prescription + demand form must be attached in electronic format at each start. The obligation to keep the original paper prescription does NOT apply when the digital referral prescription service (law of 22.04.2019) is used. (Compendium p. 33–34.)

25. **For §2 b) 4° (cleft lip/palate)** — each of the 8 akkoorden in the 3–19 age range is **independent**, not extension-via-notification. A fresh akkoord-aanvraag is required for each one. The bilan initial is only required before the first application; subsequent applications can use a 700991 evaluatiezitting instead. (Compendium p. 30.)

26. **Container reduction from parental guidance — exact formula:** individual parental-guidance session (60 min) = **2** 30-min individual treatment sessions deducted; collective parental-guidance session (90 min) = **1** 30-min individual treatment session deducted. Total cap = **10** parental-guidance attestations per disorder per child. (Compendium p. 32, item r.)

27. **Bilans (701013/701083) also count against the container.** The maximum containers in §5 must be reduced by the number of bilans already attested for that disorder. (Compendium p. 32.)

28. **§6 extension kennisgeving — 60-day reception deadline applies.** Reimbursement is refused for sessions performed more than 60 calendar days before the kennisgeving reaches the adviserend arts. (Compendium p. 32.)

29. **§7 multi-session-per-day rule — additional sessions are billable to the patient but require pre-information.** Per day, only one individual or one collective session can be attested to the mutuality; any additional sessions the therapist actually provides may be charged to the patient, but the conventioned logopedist is required by Art. 5 §1 of the convention to inform the patient **in advance** of the out-of-pocket amount. (Compendium p. 33.)

30. **§8 quality-of-care obligation.** Reimbursement requires the therapist to "zich ertoe verbindt kwaliteitsvolle zorg te verlenen en de door de Overeenkomstencommissie goedgekeurde voorwaarden na te leven". (Compendium p. 33.)

**The Compendium contains no pricing, no R-values, and no tariff amounts** — that stays in the yearly circular. It is purely the coordinated legal text + Commission interpretations. The Compendium publication date "Version approuvée par la Commission le 24.04.2025" printed on every footer confirms its version.

**Sources:**
- [RIZIV Compendium voor logopedie, PDF, 34 p., 24.04.2025](https://www.riziv.fgov.be/SiteCollectionDocuments/logopedes_compendium_20250424.pdf)
- [RIZIV Compendium landing page (NL)](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/compendium-bij-de-nomenclatuur-van-de-logopedische-verstrekkingen)

---

## Item 4 — Bevoegdheidscodes (qualification codes) for logopedisten

**Status:** RESOLVED

**Finding:** RIZIV assigns exactly **two** qualification codes to logopedisten. The PDF `bevoegdheidscodes_logopedisten.pdf` on the RIZIV "Bevoegdheidscodes" hub page was downloaded and parsed. It is a 1-page document with a two-row table:

| Code | NL label |
|---|---|
| **801** | Gegradueerden in de logopedie |
| **802** | Licentiaten in de logopedie |

These are the last 3 digits of the 11-digit RIZIV provider number format for logopedisten. Code 801 applies to therapists holding a (former) gegradueerde / bachelor-level degree, and code 802 applies to those holding a (former) licentiaats / master-level degree. Any logopedist obtains exactly one of these two codes upon RIZIV recognition (via the erkenning procedure).

There are **no additional qualification codes** — no specialist sub-codes, no "junior/senior" split, no pathology-specific codes — the RIZIV number itself is the complete RIZIV credential. Recognition for a specific pathology is handled via the per-patient eAgreement / aanvraagformulier flow, not via a therapist-level code.

**Sources:**
- [Bevoegdheidscodes logopedisten (PDF, 1 page)](https://www.riziv.fgov.be/SiteCollectionDocuments/bevoegdheidscodes_logopedisten.pdf) — primary source, parsed verbatim.
- [RIZIV — Bevoegdheidscodes in het RIZIV-nummer en attributen van zorgverleners (hub page)](https://www.riziv.fgov.be/nl/professionals/info-voor-allen/bevoegdheidscodes) — hub page where the per-profession PDFs are indexed.

---

## Item 5 — Home-visit / travel supplement exact amount (in cents)

**Status:** RESOLVED — and the answer is: **there is no fixed supplement code and no fixed amount in cents**.

**Finding:** After a full parse of the RIZIV tariff circulars for 01-01-2024, 01-04-2024, 01-01-2025, 01-01-2026 and 01-04-2026, plus both the R/2024-2025 and the R/2026-2027 conventions, and cross-checked against the Compendium and NomenSoft:

1. **The Art. 36 nomenclature does not contain a "verplaatsingskosten" / "frais de déplacement" code.** The nomenclature only has the five setting-based codes per pathology (cabinet, home, school, revalidation, hospital), and for each the honorarium equals **the cabinet honorarium** when delivered at a home, revalidation or hospital setting (e.g., 711336 home = € 38,37, identical to 711314 cabinet = € 38,37). School sessions have a **lower** R-value (2,117663 vs 2,192383), leading to € 37,06 at the 1/1/2026 tariff, not a higher one.

2. **The travel-supplement legal basis is Article 3 of the convention**, not the nomenclature. Article 3 §1 of the R/26-27 convention reads verbatim (PDF p. 2):

   > "§1er. Sans préjudice des dispositions de l'article 5 pour toute prestation dispensée au domicile d'un bénéficiaire, dans le cadre d'une convention de rééducation fonctionnelle ou à l'hôpital, les honoraires sont les mêmes que ceux d'une prestation identique dispensée au cabinet du logopède.
   > Le cas échéant, pour des prestations dispensées à la demande du bénéficiaire en dehors du cabinet du logopède, le logopède peut convenir avec le bénéficiaire d'un montant supplémentaire raisonnable de frais de déplacement. En cas de litige la charge de la preuve incombe au logopède."

   And §2:
   > "Les frais de déplacement susvisés ne sont pas remboursés au bénéficiaire dans le cadre de l'assurance obligatoire soins de santé."

   And §3 imposes the **pre-information** obligation: the therapist must inform the beneficiary before treatment begins of the supplement and of the fact that it is not reimbursed.

   Article 3 of R/24-25 is **verbatim identical** in substance.

3. **The word used is "raisonnable" / "redelijk"** — the convention does **not** fix an amount, a percentage, a cents value, or a per-kilometre rate. This is a deliberate choice: VVL and UPLF publish non-binding recommendations (historically in the €0.30–0.40/km range or a small flat fee) but there is no legal cap or floor, and no nomenclature code to attest it on an electronic flux.

4. **Consequences for product:** halingo.be should model the displacement supplement as a **per-session, free-text, out-of-pocket amount** entered by the therapist, with a mandatory pre-treatment disclosure checkbox (to enforce Art. 3 §3 compliance). It is NOT a nomenclature-eligible reimbursable line and must NOT appear on the electronic attestation flux (MyCareNet / eAttest). It is billed to the patient directly, outside the mutuality. The billable setting is still the nomenclature home/school code; the travel fee is a separate line on the patient invoice with explicit labelling.

5. **Supplements for special hours** (before 08:00, weekend/holiday, home-at-request-without-medical-necessity) live in **Article 4 §2** of the convention, also with no fixed amount. Same free-amount, patient-pre-information regime.

**Sources:**
- [Convention R/2024-2025 (PDF, FR)](https://www.riziv.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2024_2025.pdf) — parsed locally, Article 3 and Article 4 extracted verbatim.
- [Convention R/2026-2027 (PDF, FR)](https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2026_2027.pdf) — parsed locally, Article 3 and Article 4 extracted verbatim.
- [Tarief logopedisten 01-01-2026](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260101.pdf) and [Tarief logopedisten 01-04-2026](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260401.pdf) — no supplement code present.
- [RIZIV Compendium voor logopedie (24.04.2025)](https://www.riziv.fgov.be/SiteCollectionDocuments/logopedes_compendium_20250424.pdf) — confirms no supplement code; reproduces the full nomenclature verbatim.
- NomenSoft per-code spot checks confirm setting codes = cabinet honorarium (no travel add-on embedded).

---

## Summary

- Resolved: **5 / 5**
- Partial: **0**
- Still open: **0**

All five uncertainties are closed against primary sources. The most consequential downstream implication is **Item 3**: the 30 interpretive rules from the Compendium that are not in the bare Article 36 text should be folded into file 01's "Common pitfalls and gotchas" section, and into the product-side billing-engine rules. Items 1, 2, 4 and 5 are fully codified and can be hardcoded in the product (with the tariff/rate columns computed on the fly from the per-date R-value snapshot as already planned).
