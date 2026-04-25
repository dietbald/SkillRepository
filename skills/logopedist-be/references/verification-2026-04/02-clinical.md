# Verification pass 2026-04-06 — File 02 (Prescription, Bilan & Pathology Rules)

Scope: pin down three uncertainties left open in the first pass against primary sources.
Method: full-text extraction of the consolidated Article 36 nomenclature (NL + FR), the AR du 3 juillet 1996 Title II (consolidated, last updated April 2025), the loi coordonnée du 14 juillet 1994 Title III, the convention nationale logopèdes-OA 2024-2025 and 2026-2027, the convention soins psychologiques de première ligne 2024 (RIZIV/INAMI), the Article 36 interpretative rules (M.B. 15.01.2026), the VVL deontological code, and a sample of mutuality / professional-body FAQs.

---

## Item 1 — Silence-equals-consent / 45-day rule for Article 36

**Status:** RESOLVED (negative finding).

**Finding:** There is **no silence-equals-consent rule applicable to Article 36 logopedie** in the current Belgian legal stack, whether at 15, 30, 45 or 60 days. The "approbation tacite" mechanism that does exist in Belgian AMI law is **sector-specific to dependency-care reimbursement in MR-MRS and centres de soins de jour** (forfait soins et assistance) and is **not** a general AMI rule cross-applicable to Article 36 prestations.

Concretely:

1. **Article 36 itself contains no tacit-acceptance rule.** Reading the consolidated nomenclature in force since 01/08/2024 (KB 4.6.2024) end-to-end, the only deadline is the 60-calendar-day backdating limit (§ 4 1° / § 6): the tegemoetkoming is refused for any bilan or treatment session performed more than 60 calendar days before the date the demand or kennisgeving is *received* by the adviserend arts. There is no provision saying that absence of a response by the adviserend arts within X days equals approval. § 8 explicitly says bilans and treatments are reimbursed only "after agreement, or after receipt of a valid extension notification by the adviserend arts" — i.e., the trigger is an actual positive act (akkoord) or, for kennisgevingen tot verlenging, mere receipt of a valid notification.

2. **The two-track post-01/08/2024 design is the reason.** Since KB 4.6.2024, only the *first* aanvraag (max 2 years) requires an explicit accord from the adviserend arts. Every subsequent verlenging is a *kennisgeving* — receipt of a valid kennisgevingsformulier in the adviserend arts's mailbox is itself the trigger for reimbursement (§ 6 — "is slechts verschuldigd indien de adviserend arts ... een geldige kennisgeving in zijn bezit heeft"). So the "silence" question only ever arises for the *first* application, and even there the law requires a positive accord, not a deemed accord.

3. **No general rule in the AR 3 juillet 1996 either.** The only "approbation tacite" wording in Title II of the AR du 3 juillet 1996 (consolidated, updated April 2025) is at art. 153 / 153bis, which deals with the *allocation pour soins et assistance dans les actes de la vie journalière* (the dependency-care forfait in MR-MRS and centres de soins de jour). There the rule is a 15-day deadline: the demand "est considérée comme approuvée" if the OA does not notify a motivated refusal or a request for additional information by the 15th day after receipt. This is sectorally limited to art. 152 / 153 (art. 34, 11°/12° loi coordonnée) and does not generalise.

4. **No general rule in the loi coordonnée du 14 juillet 1994 either.** Title III contains "tacite acceptation" mechanisms in Chapter II (art. 31sexies, 35bis, etc.) but these all relate to admission of pharmaceutical specialties and similar listing decisions — not to individual médecin-conseil decisions on prestations.

5. **Mutuality FAQs corroborate the silence.** The Helan FAQ on logopedie agreement (currently cited in the knowledge base) describes only the 60-day patient-side deadline and explicitly *does not* mention any tacit-acceptance rule.

**Practical implication for halingo.be:** The first pass's caution was correct. The product must NOT show any "auto-approve" UI state for the first aanvraag. For verlengingen via kennisgeving, the design can rely on the §6 rule that valid receipt is itself the trigger, but this is *not* "silence equals consent" — it is a statutory shift from accord-required to notification-only, which is a different legal mechanism.

**Legal basis (negative):**
- Article 36, § 4, 1°; § 5; § 6; § 8 (KB 14.9.1984, consolidated KB 4.6.2024 in force 01/08/2024) — sets only the 60-day backdating limit and the post-akkoord / post-kennisgeving trigger.
- AR du 3 juillet 1996, art. 153, 153bis — the only "approbation tacite" provision in Title II, sectorally restricted to art. 34, 11°/12° loi coordonnée (dependency-care forfait).
- Loi coordonnée du 14 juillet 1994, Titre III — no general silence-equals-consent rule for individual médecin-conseil decisions on Article 36 prestations.

**Sources:**
- Officieuze coördinatie LOGOPEDIE Art. 36 NL (in werking 01.08.2024) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf
- Coordination officieuse LOGOPEDIE Art. 36 FR (en vigueur 01.08.2024) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatureart36_20240801_01.pdf
- AR 3 juillet 1996 portant exécution de la loi coordonnée du 14 juillet 1994 — Titre II (consolidé, mise à jour avril 2025) — https://www.inami.fgov.be/SiteCollectionDocuments/AR19960703-titre-II.pdf (art. 153 / 153bis at p. 141-145).
- Loi coordonnée du 14 juillet 1994, Titre III — https://www.inami.fgov.be/SiteCollectionDocuments/Loi19940714-titre-III.pdf
- Article 36 — Règles interprétatives 1 à 8 (M.B. 15.01.2026) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatureart36_interpretation.pdf
- Helan — Medisch akkoord voor logopedie — https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/

---

## Item 2 — Cumulation with eerstelijnspsychologische zorg (ELPZ)

**Status:** RESOLVED.

**Finding:** **There is no explicit cumulation ban (and no explicit allowance) in either the Article 36 nomenclature or the ELPZ convention.** Reading both texts in full, the only cumul rules are intra-system. As a matter of positive law, a child or adult in a reimbursed Article 36 logopedic trajectory may simultaneously receive reimbursed ELPZ sessions for a related but distinct problem (e.g. DLD + anxiety). The two financing systems live on separate budgetary tracks and target distinct prestations.

Specific findings:

1. **ELPZ side — convention 2024 (RIZIV-INAMI, in vigueur 01.04.2024, prolongée jusqu'au 31.12.2027 par 4e avenant).** Article 10 "Règles de cumul" governs only:
   - § 1: cumul between Function 2 (soutien psychologique de première ligne) and Function 3 (traitement psychologique de première ligne) — individual sessions cannot be done in parallel under both functions but can be done consecutively;
   - § 2: cumul without restriction between group sessions across Functions 1, 2, 3, and between group and individual sessions (group sessions don't count against the individual quota);
   - § 3: only one psychological session or group intervention per day per beneficiary is reimbursable (séances entourage excepted);
   - § 4: the multidisciplinary concertation indemnity at art. 9, 5° cannot be combined the same day with other concertation indemnities provided by federated entities or by the nomenclature of health prestations.
   
   Article 10 contains **no exclusion** of ELPZ care for patients already in a logopedic, kinésithérapie or other Article 34 trajectory. The only nomenclature touch-point is § 4, and that limits same-day *concertation* indemnities, not therapeutic sessions.

2. **Article 36 side — KB 4.6.2024 in force 01.08.2024.** The single cumul-with-other-care exclusion in Article 36 is the long-standing one (KB 14.2.2017 + 4.6.2024) that **excludes logopedic reimbursement when the patient is simultaneously undergoing or has just undergone a multidisciplinary bilan including logopedie, or follows intensive multidisciplinary rehabilitation, in an institution that has concluded a functional rehabilitation convention with RIZIV or with a federated entity** (with specified exceptions for § 2, b), 6°, 6.3; § 2, d); § 2, e)). This is a *functional rehabilitation convention* exclusion, not a mental-health-care exclusion. ELPZ is structured as community-network-based primary psychological care, not as a multidisciplinary functional rehabilitation convention, so the exclusion does not catch ELPZ.

3. **No mutuality-level FAQ or RIZIV circular adds an extra ban.** Cross-checking CM, Helan, Solidaris, Partenamut, VNZ, VVKP and the Vivel/PANGG ELPZ network resources, none state a cumul ban with logopedie. VVKP's analysis of the 2024 ELPZ convention is silent on cross-cumul with Article 34 prestations.

**Practical implication for halingo.be:** The product can confidently tell logopedists that a patient on a reimbursed Article 36 trajectory may also access reimbursed ELPZ sessions for a related problem, with the only cross-system constraint being the same-day concertation-indemnity rule (which mainly affects the psychologist's invoicing, not the logopedist's). What the logopedist *should* still do is the Article 36 § 4 5° "verwijzing/communicatie" duty: if the bilan flags emotional, behavioural or relational difficulties, those must be referred to the appropriate provider — this is a referral duty, not a cumul ban.

**Legal basis:**
- Convention soins psychologiques de première ligne (RIZIV/INAMI) 2024, art. 10 §§ 1-4. In vigueur 01.04.2024, valable jusqu'au 31.12.2027 (4e avenant).
- Article 36, § 2 (alinéa post-bilan opening, KB 14.2.2017 + KB 4.6.2024) — functional rehabilitation convention exclusion.

**Sources:**
- Convention RIZIV-réseau santé mentale (soins psychologiques de première ligne, 2024) — https://www.inami.fgov.be/SiteCollectionDocuments/convention_riziv_reseau_sante_mentale.pdf
- RIZIV — Eerstelijns psychologische zorg verlenen via netwerken voor geestelijke gezondheid vanaf 1 april 2024 — https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/klinisch-orthopedagogen/eerstelijns-psychologische-zorg-verlenen-via-netwerken-voor-geestelijke-gezondheid-vanaf-1-april-2024
- VVKP — RIZIV-conventie 2024 voor Eerstelijnspsychologische Zorg — https://vvkp.be/nieuws/riziv-conventie-2024-voor-eerstelijnspsychologische-zorg
- Officieuze coördinatie LOGOPEDIE Art. 36 NL (01.08.2024) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf

---

## Item 3 — Cancellation-fee legal basis

**Status:** RESOLVED (negative finding).

**Finding:** **No RIZIV/INAMI provision, convention article, or interpretative rule addresses cancellation fees for missed logopedic appointments.** No deontological text from VVL or UPLF prescribes either a maximum cancellation fee or a duty/right to charge one. Cancellation fees are entirely governed by (i) general Belgian contract law, (ii) the deontological "moderation and information" principles (VVL art. 3.5), and (iii) the practitioner's own algemene voorwaarden. They are **never** reimbursable by the verzekeringsinstelling, because they are not a "verstrekking" within the meaning of Article 36 — they are a contractual penalty for breach of an appointment agreement, not a logopedic prestation actually performed.

Specific findings:

1. **Article 36 nomenclature (consolidated 01.08.2024) — no provision.** The full text contains no occurrence of "annulation", "absence", "rendez-vous manqué", or any equivalent. Article 36 only knows reimbursable *prestations effectuées* (bilans and treatment sessions); a no-show is by definition not a prestation effectuée.

2. **Convention nationale logopèdes-OA 2024-2025 and 2026-2027 — no provision.** Both conventions are silent on cancellation fees. They cover only tariffs, indexation, social statute, the -25% rule, dispatch, and accession/withdrawal.

3. **Article 36 interpretative rules (M.B. 15.01.2026, IR 1-8) — no provision.** Searched in full; none of the eight interpretative rules mentions cancellation, no-show, or missed appointment.

4. **AR du 3 juillet 1996 — no provision.** No reference to cancellation fees for any healthcare prestation.

5. **Loi coordonnée du 14 juillet 1994 — no provision.** No provision authorising or capping cancellation fees, and no provision making them eligible for verzekeringstegemoetkoming.

6. **VVL deontological code — only general moderation principle (art. 3.5).** "De logopedist moet gematigd en bescheiden zijn bij het vaststellen van het honorarium voor zijn prestaties. Bij het bepalen ervan mag hij rekening houden met de belangrijkheid van de geleverde prestaties, de economische toestand van de patiënt, zijn eigen faam en eventuele bijzondere omstandigheden. Hij moet de patiënt of diens vertegenwoordigers uitleg verstrekken over het bedrag van het honorarium voor zijn prestaties en over de terugbetalingsmogelijkheden." The code does not address cancellation fees as such. By implication, a cancellation fee that is "matig en bescheiden" and was clearly communicated in advance (algemene voorwaarden) is deontologically permissible; an excessive or undisclosed one would violate art. 3.5.

7. **UPLF FAQ and ethics page — no specific cancellation-fee rule.** UPLF's ethics page emphasises the same principles (moderation, information, prescription of fees in 2 years per civil rules), but contains no rule on cancellation fees as such.

8. **Mutuality FAQs uniformly silent on reimbursement.** No mutuality FAQ ever lists cancellation fees as reimbursable, and several practitioner sites (e.g. Aha-logopedie, Trekintaal, Logopediepeer) explicitly tell patients that a missed-or-late-cancelled session "moet vergoed worden zonder tussenkomst van de mutualiteit, behoudens doktersattest/overmacht" — i.e. a private no-show charge that the patient bears in full and that the OA will not refund.

**Reimbursability — short answer:** **Never.** A cancellation fee is a contractual penalty, not a verstrekking within Article 34/36 of the loi coordonnée; the verzekeringstegemoetkoming intervenes only in the cost of *effectively performed* prestations.

**Legal basis (negative): Articles 34 and 36 of the loi coordonnée du 14 juillet 1994 read together with KB 14.9.1984 art. 36 §§ 4-8 — reimbursement attaches to verstrekkingen actually performed; no prestation = no tegemoetkoming. VVL deontological code art. 3.5 sets a private-law moderation/information duty.**

**Sources:**
- Article 36 nomenclature NL (01.08.2024) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf
- Article 36 interpretative rules (M.B. 15.01.2026) — https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatureart36_interpretation.pdf
- Convention 2024-2025 logopèdes-OA — https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2024_2025.pdf
- Convention 2026-2027 logopèdes-OA — https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2026_2027.pdf
- VVL — Ethische en deontologische code van de logopedisten (art. 3.5) — https://www.de-piramide.be/sites/de-piramide/files/logopedisten-ethische-deontologische-code.pdf
- UPLF — Éthique et déontologie — https://www.uplf.be/ethique-et-deontologie/

---

## Summary

- **Resolved: 3 / 3**
- **Partial: 0**
- **Still open: 0**

All three uncertainties are resolved as *negative findings* of the strongest kind: the rule that file 02 hedged about does not exist in Belgian primary law for logopedie. Concretely:

1. There is no silence-equals-consent / 45-day rule for Article 36 logopedie. The "approbation tacite" mechanism in the AR du 3 juillet 1996 is sectorally limited to art. 153/153bis (dependency-care forfait in MR-MRS and centres de soins de jour) and does not cross-apply.
2. There is no cumulation ban between reimbursed Article 36 logopedie and reimbursed ELPZ. The ELPZ convention's art. 10 "Règles de cumul" is intra-system; Article 36's only cumul exclusion targets functional rehabilitation conventions, not ELPZ.
3. There is no RIZIV-level rule or VVL/UPLF deontological rule on cancellation fees. They are governed solely by general contract law, are practitioner-discretionary subject to the deontological moderation principle (VVL art. 3.5), and are never reimbursable.

**Action item for file 02:** the "watch-outs for monitoring" bullets in §9 should be rewritten to state these as resolved negative findings rather than open questions.
