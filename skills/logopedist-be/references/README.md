# Belgian Logopedist Knowledge Base

> A structured reference covering every federal, community, regional, clinical, technical, legal, and business rule that governs the practice of logopedie in Belgium, built for halingo.be — a SaaS serving Belgian logopedists.
>
> **Last verified:** 2026-04-06
> **Total size:** ~66,000 words across 8 reference documents
> **Use as:** internal knowledge base, product-compliance reference, and source pack for a future Claude "Belgian-logopedist-expert" skill.

---

## How to use this knowledge base

Each numbered file is a standalone, deep reference on one slice of the domain. The files cross-reference each other where topics overlap (e.g. VAT interacts with nomenclature billing, prescription rules interact with bilan submission via MyCareNet). Every file ends with:

- A **Freshness notes** section listing what is likely to change
- A **Sources** section with every URL the research was built on

When in doubt, treat the **primary source** (RIZIV/INAMI, ejustice, ehealth.fgov.be, the Staatsblad/Moniteur) as authoritative and this knowledge base as the navigation layer on top.

## Files in this knowledge base

| # | File | Scope | Words |
|---|---|---|---|
| 01 | [RIZIV Nomenclature & Tariffs](01-riziv-nomenclature-and-tariffs.md) | Federal reimbursement codes, tariffs, conventioned vs non-conventioned, indexation, machine-readable sources | ~11,900 |
| 02 | [Prescription, Bilan & Pathology Rules](02-prescription-bilan-and-pathology-rules.md) | Who may prescribe, bilan workflow, médecin-conseil approval, session caps per pathology, setting rules, appeals | ~7,300 |
| 03 | [eHealth, MyCareNet, eAttest, eFact](03-ehealth-mycarenet-eattest-efact.md) | Federal digital-health infrastructure, certification for SaaS vendors, eAttest/eFact/MDA flows, consent and therapeutic relationship | ~7,700 |
| 04 | [Recognition, Visa & Professional Bodies](04-recognition-visa-and-professional-bodies.md) | Diploma pathways, FOD/SPF recognition, RIZIV visa, EU/non-EU recognition, VVL/UPLF, ethics, CPD, liability insurance | ~6,500 |
| 05 | [Flemish Community](05-flemish-community.md) | VAPH, Vlaamse Sociale Bescherming, Leersteundecreet, buitengewoon onderwijs, CLB, Opgroeien, KMO-portefeuille | ~7,400 |
| 06 | [Wallonia, Brussels & German Community](06-french-brussels-german-communities.md) | AVIQ, Iriscare/COCOM, PHARE/COCOF, VGC, FWB + centres PMS + pôles territoriaux + ONE, DG/DSL, comparative summary | ~6,100 |
| 07 | [GDPR & Patient Rights](07-gdpr-and-patient-rights.md) | GDPR, 2018 implementation law, GBA/APD, IVC/CSI, Patient Rights Law 2002 + 2024 amendment, 30-year retention under Kwaliteitswet, shared secrecy, DPIA, controller/processor | ~5,200 |
| 08 | [Business, Tax, VAT, Mutualities](08-business-tax-and-mutualities.md) | Self-employed vs employed vs freelance, BV/SRL, schijnzelfstandigheid, article 44 WBTW + 2022 reform, sales of ancillary goods, kilometervergoeding, mutualities, bookkeeping, UBO | ~13,800 |
| 09 | [Peppol & B2B E-Invoicing](09-peppol-and-b2b-e-invoicing.md) ⚠️ **CONTEXT-ONLY, halingo does NOT implement Peppol** (decision 2026-04-07) — kept as background reference for support and sales conversations. The praktijk's accountant handles Peppol; halingo handles clinical + RIZIV billing only. | ~9,500 |

**Answers / executive summaries** — distilled advisory conclusions derived from the numbered reference files:

| File | Question |
|---|---|
| [answers/ehealth-nomencodes-for-logopedists.md](answers/ehealth-nomencodes-for-logopedists.md) | Can a logopedist send nomenclature codes electronically via eHealth? (short answer: no, not for eAttest/eFact — sector not opened at CIN/NIC; realistic go-live not before 2027-Q4) |

---

## Routing table — "I need to know about X, which file?"

### Billing & reimbursement
- Nomenclature code, tariff, conventioned amount, BIM/OMNIO reimbursement, remgeld → **01**
- Per-session setting rules (cabinet / home / school / institution) → **01** + **02 §5**
- Third-party-payer (regeling derdebetaler / tiers payant) flow → **03 §5**
- eAttest vs eFact decision → **03 §4, §5**
- Mutuality supplementary coverage ("voordelen / avantages") → **08 §6**
- Travel-supplement / kilometervergoeding billing → **01 §6**, **08 §5**
- Insurability check before a session (MDA) → **03 §6**

### Clinical workflow
- Which specialist may prescribe for which pathology → **02 §2**
- Bilan content and format → **02 §3**
- Médecin-conseil / adviserend arts approval and deadlines → **02 §3**
- Session caps per pathology (dysphasia, dyslexia, stuttering, aphasia, etc.) → **02 §4**
- Renewal of treatment → **02 §3**, **02 §4**
- Setting-specific constraints → **02 §5**
- Combining logopedie with kinesitherapy / ergotherapy / neuropsychology → **02 §7**
- Refused prior-approval — appeal route → **02 §6**

### Technical integration (halingo engineering)
- eHealth certificate, identity, STS token → **03 §2**, **03 §8**
- MyCareNet services catalogue for logopedists → **03 §3**
- eAttest message format and flow → **03 §4**
- eFact message format and flow → **03 §5**
- Therapeutic relationship registration → **03 §7**
- Software-vendor certification / homologation → **03 §8**
- Developer-documentation URL map → **03 §9**

### Professional status & identity
- Diploma recognition (Belgian graduate) → **04 §2, §3**
- RIZIV number structure and application → **04 §4**
- EU diploma recognition (Directive 2005/36) → **04 §5**
- Verifying a user is a real logopedist programmatically → **04 §8**
- Professional bodies, CPD, ethics → **04 §9, §10, §11**
- Mandatory liability insurance → **04 §12**

### Regional (community / region) layer
- Flemish-community rules → **05**
- VAPH persoonsvolgend budget → **05 §2**
- Leersteundecreet (2023) and schools → **05 §4, §5**
- CLB and referral → **05 §6**
- Opgroeien / Kind en Gezin early-detection → **05 §7**
- Walloon AVIQ → **06 §2**
- Brussels (Iriscare / COCOM / COCOF / PHARE / VGC) → **06 §3**
- Fédération Wallonie-Bruxelles (centres PMS, pôles territoriaux, ONE) → **06 §4**
- German-speaking Community / Ostbelgien / DSL → **06 §5**
- Side-by-side comparison (Flanders / Wallonia / Brussels / DG) → **06 §6**

### Privacy, records, and patient rights
- GDPR fundamentals in a logopedist-SaaS context → **07 §1**
- Belgian GDPR implementation law (30 July 2018) → **07 §2**
- Authorities (GBA/APD, IVC/CSI) → **07 §3**
- Patient Rights Law (22 Aug 2002) and its 2024 amendment → **07 §4**
- 30-year medical-record retention (art. 35 Kwaliteitswet) → **07 §5**
- Professional secrecy + shared secrecy → **07 §6, §7**
- DPIA obligations for halingo → **07 §10**
- Controller vs processor (and DPA clauses) → **07 §11**
- Sub-processor / international transfer / Schrems → **07 §12**
- Breach notification → **07 §13**
- Patient-portal cookie / analytics rules → **07 §14**
- Right to erasure vs retention obligation → **07 §16**
- Accounting retention — 10 years since 2023 → **07 §15**, **08 §7.3**

### Peppol and B2B e-invoicing
- Is halingo affected by the wet 6 februari 2024 mandate? → **09**
- Art. 44 exempt logopedist without VAT number — send? receive? → **09 §3.2**
- Mixed taxable logopedist (sells books/toys, expert reports, lectures) → **09 §3.3**
- Praktijk BV / SRL obligations → **09 §3.4**
- Retrocessie and inter-praktijk flows → **09 §3.5**
- Format — Peppol BIS Billing 3.0, UBL, EN 16931 → **09 §4**
- Peppol participant ID schemes for Belgium → **09 §4.3**
- Belgian Peppol Authority (BOSA) → **09 §5**
- +120% cost deduction for e-invoicing software → **09 §6.1**
- +20% investment deduction → **09 §6.2**
- Belgian Access Point landscape (Billit, Unifiedpost, CodaBox, Isabel, Hermes) → **09 §7**
- Integration patterns for halingo → **09 §8**
- Three-channel data model (Peppol vs eFact vs plain) → **09 §9**
- Archiving, cross-border, enforcement → **09 §10**

### Entity, tax, and employment
- Self-employed natural person (setup, VAPZ, social contributions) → **08 §1.1**
- Employed logopedist (PC, salary, benefits) → **08 §1.2**
- Freelance on commission / retrocessie split and schijnzelfstandigheid risk → **08 §1.3**
- BV / SRL structure (rates, dividends, VVPRbis) → **08 §2.1**
- Maatschap / société simple and other cost-sharing vehicles → **08 §2.2**
- Medical VAT exemption (art. 44 §1 WBTW) and the 2022 "therapeutic purpose" reform → **08 §3.1**
- When a logopedist must register for VAT → **08 §3.2**
- Sales of books / toys / exercise materials / digital content to patients → **08 §3.3**
- Rental and retrocession VAT between praktijk and freelancers → **08 §3.4**
- Deductible expenses (car, home office, training, insurance, software) → **08 §4.1**
- Kilometervergoeding federal rate and ceiling rules → **08 §5.1, §5.2**
- Home-visit billing to the patient → **08 §5.3**, **01 §6**
- Maaltijdcheques, eco-cheques, bureauvergoeding, telework → **08 §5.4**
- Mutuality supplementary coverage per mutuality → **08 §6.1**
- Private hospitalisation cover for logopedie → **08 §6.2**
- Bookkeeping regime per entity form → **08 §7.1**
- Invoicing rules for a healthcare praktijk → **08 §7.2**
- UBO register obligations → **08 §7.4**
- "Top 10 things halingo must get right" → **08 §8**

---

## Cross-cutting quick glossary (NL / FR / EN)

| NL | FR | EN / note |
|---|---|---|
| logopedist | logopède | speech-language therapist |
| praktijk | cabinet | private practice |
| nomenclatuur | nomenclature | fee-code schedule |
| geconventioneerd | conventionné | contracted at RIZIV tariffs |
| niet-geconventioneerd | non-conventionné | free tariffs |
| verstrekking | prestation | reimbursable act |
| getuigschrift voor verstrekte hulp | attestation de soins donnés | certificate of care (paper form) |
| eAttest | eAttest | electronic form of the above |
| regeling derdebetaler | régime du tiers payant | third-party-payer — mutuality pays the therapist directly |
| bilan / anamnesecharter | bilan | initial or evolution evaluation |
| adviserend arts | médecin-conseil | mutuality advising physician who approves treatment |
| voorafgaand akkoord | accord préalable | prior approval for a treatment episode |
| remgeld | ticket modérateur | patient's out-of-pocket share |
| BIM | BIM | beneficiary of increased reimbursement |
| ziekenfonds / mutualiteit | mutualité | health-insurance fund (CM, Solidaris, Partenamut, MLOZ, Neutrale, Liberale, HZIV/CAAMI, …) |
| RIZIV | INAMI | National Institute for Health and Disability Insurance |
| FOD Volksgezondheid | SPF Santé publique | Federal Public Service for Public Health |
| beroepsgeheim | secret professionnel | professional secrecy (Penal Code art. 458) |
| gedeeld beroepsgeheim | secret professionnel partagé | shared secrecy across the care team |
| Gegevensbeschermingsautoriteit (GBA) | Autorité de protection des données (APD) | Belgian data protection authority |
| Informatieveiligheidscomité (IVC) | Comité de sécurité de l'information (CSI) | health-data sharing authorisation committee |
| VAPH | — | Flemish agency for people with disabilities |
| AVIQ | AVIQ | Walloon equivalent of VAPH (Agence pour une Vie de Qualité) |
| Iriscare | Iriscare | Brussels bilingual (COCOM/GGC) health agency |
| PHARE | PHARE | Brussels COCOF service for people with disabilities |
| DSL | DSL | Ostbelgien service (Dienststelle für Selbstbestimmtes Leben) |
| leersteundecreet | décret pour un soutien à l'apprentissage | Flemish 2023 school-support framework |
| pôles territoriaux | — | FWB equivalent of leersteuncentra |
| CLB | — | Flemish pupil-guidance centres |
| centre PMS | centre PMS | FWB pupil-guidance centres |
| Kind en Gezin / Opgroeien | ONE | early-childhood agency |
| BTW / TVA | TVA | value-added tax |
| VAPZ | PLCI | tax-advantaged supplementary pension for self-employed |
| sociaal verzekeringsfonds | caisse d'assurances sociales | social-security fund for self-employed |
| KBO / BCE | BCE | Crossroads Bank for Enterprises |
| WVV | CSA | Companies & Associations Code (2019) |
| BV | SRL | limited-liability company (post-WVV form) |
| kilometervergoeding | indemnité kilométrique | mileage allowance |
| schijnzelfstandigheid | faux indépendant | sham-self-employment |
| retrocessie | rétrocession | share paid back to the praktijk by a freelancer |

---

## How the federal / community / regional layering works (one-paragraph mental model)

Logopedic **reimbursement** is federal (RIZIV/INAMI) — same tariffs, codes, prescription rules, and médecin-conseil workflow for a child in Ostend, Namur, or Eupen. Anything that changes across Belgium is **not reimbursement** but **support systems around it**: disability funding (VAPH in Flanders / AVIQ in Wallonia / PHARE-COCOF and Iriscare-COCOM in Brussels / DSL in Ostbelgien), **education-sector** support (Leersteundecreet + CLB in Flanders, pôles territoriaux + centres PMS in FWB, DG-specific arrangements in Ostbelgien), and **early detection** (Opgroeien in Flanders, ONE in FWB, the DG's own services). A patient may be RIZIV-reimbursed AND simultaneously receiving VAPH/AVIQ/PHARE/DSL support, but the same euro cannot be paid twice — cumulatie-verboden apply. halingo must track, per patient, **which funding stream pays for which part of the care** and never double-bill.

---

## Known uncertainties — verification pass 2026-04-06

The 31 items flagged during the initial research build have been resolved in a second-pass verification sweep (8 parallel agents, one per file). Full report and headline findings are in **[VERIFICATION-PASS-2026-04-06.md](VERIFICATION-PASS-2026-04-06.md)**; per-file notes are in [`verification-2026-04/`](verification-2026-04/).

**Result:** 26 RESOLVED, 5 PARTIAL, 0 STILL OPEN.

### The 5 items that remain PARTIAL (with actions)

1. **eAttest/eFact go-live date for logopedists** (file 03) — no firm public date from CIN/NIC. Build against the published IGs; plan staged per-mutuality enablement; monitor RIZIV/CIN-NIC news.
2. **eAgreement per-mutuality production readiness** (file 03) — Claim Logo BE FHIR profile is stable, per-mutuality deployment opaque. Implement the client but feature-flag per mutuality and keep paper fallback.
3. **DG inclusion / Förderpädagogik successor decree** (file 06) — foundational 1998 decree confirmed, reform agenda running, no single successor instrument yet. Monitor ostbelgienlive.be / dglive.be.
4. **BAP envelope figure** (file 06) — 2025/2026 budget not fully published at research time. Not product-critical; revisit at next audit.
5. **PC 330.04 — logopedist-specific FOD WASO ruling** (file 08) — the scope text of PC 330.04 ("andere paramedici") is unambiguous for private logopedie cabinets, but no ruling names logopedisten by name. Treat PC 330.04 as the operational answer; refer clients to a social secretariat for individual written confirmation if needed.

### Key corrections pushed back into source files during the verification pass

- **File 01 — Home-visit "supplement code" does not exist.** Home-visit billing is through the setting-specific session codes, not a separate travel-fee line item. Any first-pass assumption of a travel-supplement code must be corrected in product logic.
- **File 02 — No silent prior-approval.** The general AMI silence-equals-consent rule does **not** apply to Article 36 logopedie. Halingo must not assume silent approval from the médecin-conseil.
- **File 03 — eHealth Software Register is NOT strictly enforced** for logopedist-only software; no logopedist doelgroep exists in the register. Ship without enrolment but monitor for future enforcement.
- **File 04 — No public RIZIV verification API.** Structured access is only via the eHealth platform under a partner contract (CoBRHA channel).
- **File 05 — MDO honorarium 2026:** €30.64 deelnemer / €49.02 zorgbemiddelaar / €147.07 overlegorganisator. **BUT:** Minister Gennez has confirmed (answer to SV 624, 2 April 2025) that the MDO-system will be phased out this legislatuur in favour of zorgcoördinatie/casemanagement vergoedingen — treat MDO as a deprecated funding source.
- **File 05 — Vlaamse Toezichtcommissie does not qualify** as a GDPR Art. 51 supervisory authority (confirmed by Raad van State arrest nr. 266.244 van 31 maart 2026). No VTC machtiging is needed for private SaaS hosting of logopedist praktijk data — only if integrating with a Vlaamse overheidsbron.
- **File 05 — CAR cumulverbod** is now governed by a two-step Verzekeringscomité interpretatieregel on art. 36 §3, 5° published in the Staatsblad on 2 oktober 2025. The cumulverbod only takes effect once **multidisciplinary CAR treatment has actually started** — children on the wachtlijst keep RIZIV-monodisciplinary logopedie. Pathologies in §2 b) 6.3 (dysarthria) and §2 d) (hearing disorders) remain excluded from the cumulverbod.
- **File 08 — VAPZ 2026:** the correct values are **8.17% gewone / cap €4,086.34** and **9.40% sociale / cap €4,701.54.** The first-pass 8.5%/9.78% figures were factually wrong and have been corrected.
- **File 08 — PC 330.04** ("andere paramedici") unambiguously covers private logopedie cabinets; PC 200 is not competent.
- **File 08 — VVPRbis 15% → 18%:** programmawet DOC 56-1378/001; vote postponed; **earliest effective date 1 May 2026**; no dividend transition; pre-31 December 2025 liquidation reserves grandfathered.
- **File 08 — VAT small-business threshold** remains **€25,000**; the €30,000 proposal was not enacted. Do not design around a 30k threshold.
- **File 08 — Quarterly kilometervergoeding:** full time series Q1 2023 → Q2 2026 retrieved with FOD BOSA omzendbrief numbers. **Q2 2026 = €0.4327 per km (BOSA omzendbrief nr. 764 van 20/03/2026).**

### Items to watch — re-verification checkpoints

- **RIZIV news** for 2026–2027 overeenkomst logopedisten publication (file 04)
- **CIN/NIC + RIZIV** for the logopedist eAttest/eFact go-live announcement (file 03)
- **Per-mutuality production enablement** of eAgreement Logo BE (file 03)
- **Programmawet VVPRbis 18%** — confirmation of the 1 May 2026 effective date (file 08)
- **VSB MDO phase-out** — successor zorgcoördinatie vergoeding details (file 05)
- **Kwaliteitswet art. 34 RD** for logopedists if/when published (file 07)
- **CJEU Schrems-III judgments** on the EU-US DPF (file 07)

---

## Update protocol

When these files are updated:

1. Update the **Last verified** date in the file header.
2. Add the change to the file's **Freshness notes** section if it affects ongoing relevance.
3. Update this README's routing table if sections were added or renumbered.
4. If you rely on this knowledge base for a production feature, run a fresh research pass on the specific section every 6 months or whenever a RIZIV circular is announced.

Primary-source feeds to subscribe to for early-warning:
- **RIZIV/INAMI news**: https://www.riziv.fgov.be/nl/nieuws and https://www.inami.fgov.be/fr/nouvelles
- **Belgisch Staatsblad / Moniteur belge**: https://www.ejustice.just.fgov.be
- **FOD Volksgezondheid / SPF Santé publique**: https://www.health.belgium.be
- **eHealth platform announcements**: https://www.ehealth.fgov.be
- **GBA/APD decisions**: https://www.gegevensbeschermingsautoriteit.be / https://www.autoriteprotectiondonnees.be
- **VVL**: https://www.vvl.be — **UPLF**: https://www.uplf.be
