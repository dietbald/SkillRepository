---
name: logopedist-be
description: Belgian-logopedist expert knowledge pack for halingo.be and any SaaS serving Belgian speech-language therapists. Use this skill ONLY when the user asks about Belgian logopedie specifically — RIZIV/INAMI nomenclature and tariffs for logopedic acts, prescription and bilan workflow with the médecin-conseil, pathology-bound session caps, eHealth/MyCareNet/eAttest/eFact for the logopedist sector, Belgian paramedical recognition / RIZIV visa / professional bodies (VVL, UPLF), Flemish Community rules (VAPH, Vlaamse Sociale Bescherming, Leersteundecreet, CLB, Opgroeien), Walloon/Brussels/German Community rules (AVIQ, Iriscare/COCOM, PHARE/COCOF, DSL/Ostbelgien, pôles territoriaux, centres PMS, ONE), GDPR/patient rights/retention as applied to logopedist praktijken, business/tax/VAT/social statute for Belgian logopedist praktijken (art. 44 exemption, BV/SRL, retrocessie, kilometervergoeding, mutualities), Peppol obligations for Belgian healthcare SaaS, or product/strategy questions about halingo.be. DO NOT activate for generic software-engineering, unrelated healthcare, non-Belgian regulation, or general legal questions — this skill is narrow and Belgian-logopedie specific.
---

# Belgian Logopedist Expert (halingo.be)

You have access to a verified, primary-sourced knowledge pack on Belgian logopedic (speech-therapy) practice, regulation, billing, and the halingo.be SaaS that serves this market. The reference files in `{baseDir}/references/` were built in April 2026 through two research passes: a broad first pass (eight parallel agents against primary sources), then a verification pass that resolved 26 of 31 flagged uncertainties against primary sources (`VERIFICATION-PASS-2026-04-06.md`).

**Before answering any substantive question in this domain, read the relevant reference file(s).** Training-data recall for Belgian healthcare regulation is stale — the reference files link to current primary sources (riziv.fgov.be, inami.fgov.be, ejustice.just.fgov.be, ehealth.fgov.be, vaph.be, aviq.be, iriscare.brussels, gegevensbeschermingsautoriteit.be, finances.belgium.be, vvl.be, uplf.be) and carry per-item verification markers.

## When to use this skill

Activate when the user asks about any of:

- **Billing and reimbursement**: RIZIV nomenclature codes, tariffs, conventioned vs non-conventioned, BIM/OMNIO, remgeld, derdebetaler, eAttest vs eFact, getuigschrift voor verstrekte hulp, mutuality supplementary voordelen.
- **Clinical workflow**: which specialist may prescribe for which pathology, bilan content, médecin-conseil approval, session caps per pathology (dysphasie, dyslexie, stuttering, aphasie, dysartrie, dysfagie, stemstoornissen, LIS, schisis, hearing-related, chronische neurologische), renewals, age limits (the 18th-birthday cutoff for §2 b 2°/3°, §2 d, §2 e, §2 f), setting-specific rules (cabinet/home/school/institution), cumulation rules with CAR or ELPZ, appeals.
- **eHealth technical**: eHealth platform, MyCareNet services, eAttest, eFact, MDA/insurability check, eAgreement Claim Logo BE FHIR profile, certification for software vendors, developer documentation map, sector status for logopedie.
- **Professional status**: diploma pathways, FOD/SPF erkenning/agrément, RIZIV visa, EU diploma recognition (Directive 2005/36), verifying a RIZIV number programmatically, VVL, UPLF, continuing education, liability insurance.
- **Regional layer**: Flemish Community (VAPH, Vlaamse Sociale Bescherming, zorgkassen, Leersteundecreet 2023, buitengewoon onderwijs, CLB, Opgroeien, KMO-portefeuille), Walloon Region (AVIQ, BAP), Brussels (Iriscare/COCOM, PHARE/COCOF, VGC), Fédération Wallonie-Bruxelles (pôles territoriaux, centres PMS, ONE), German-speaking Community (DG, DSL, Ostbelgien).
- **Privacy and records**: GDPR for health data, Belgian implementation law (30 July 2018), GBA/APD, IVC/CSI, Patient Rights Law (22 August 2002 + 6 February 2024 amendment), 30-year retention under art. 35 Kwaliteitswet, professional secrecy (art. 458 Strafwetboek), shared secrecy, DPIA, controller/processor/DPA, sub-processor international transfers, breach notification, Belgian NIS2 transposition, right-to-erasure vs retention.
- **Business and tax**: self-employed natural person vs employed vs freelance on commission, schijnzelfstandigheid, BV/SRL, WVV, VVPRbis, sociaal verzekeringsfonds, VAPZ/PLCI, PC 330.04, art. 44 §1 WBTW exemption and the 2022 therapeutic-purpose reform, sales of ancillary goods (books, toys, exercise materials), retrocessie VAT, deductible expenses (car, home office, training, software, insurance), forfait vs real expenses, kilometervergoeding federal rate and quarterly values, maaltijdcheques, bureauvergoeding, mutuality directory and supplementary coverage, UBO register, bookkeeping retention (10 years since 2023).
- **Peppol**: the wet van 6 februari 2024 mandate, Peppol BIS Billing 3.0, art. 44 exempt-practitioner edge cases, Belgian Access Point landscape, +120% cost deduction, three-channel architecture (Peppol vs eFact vs plain invoice). **Note:** halingo itself does NOT implement Peppol — the praktijk's accountant handles it. File 09 is kept as context for support and sales conversations only.
- **halingo.be product/strategy**: the SaaS is a clinical + RIZIV-billing product for Belgian logopedisten with ~100 paying praktijken and ~200 users, currently being rewritten. NOT an accounting product.

## When NOT to activate

- Generic software-engineering questions not specific to halingo
- Healthcare regulation for countries other than Belgium
- Non-logopedic Belgian healthcare (kinesitherapie, verpleegkunde, huisartsen — only reference them for comparison)
- General legal/tax questions not about logopedist praktijken
- Clinical therapy protocols or exercise content (this knowledge pack is regulatory/business, NOT clinical-content)
- Competitive teardowns, pricing benchmarks, sales playbooks (these gaps are documented, not in the pack)

## Reference file index

Read the relevant file before answering. Paths are relative to the skill directory.

| File | Topics |
|---|---|
| `{baseDir}/references/README.md` | Master index, routing table by question, NL/FR/EN glossary, federal-vs-community mental model |
| `{baseDir}/references/VERIFICATION-PASS-2026-04-06.md` | Consolidated verification-pass report; headline corrections that override training data |
| `{baseDir}/references/01-riziv-nomenclature-and-tariffs.md` | Article 36 codes, 2026 tariffs, conventioned vs non-conventioned, indexation, NomenSoft, home-visit handling (no separate supplement code) |
| `{baseDir}/references/02-prescription-bilan-and-pathology-rules.md` | Prescribers per pathology, bilan workflow, médecin-conseil approval, session caps, setting rules, age cutoffs at 18th birthday |
| `{baseDir}/references/03-ehealth-mycarenet-eattest-efact.md` | eHealth platform, MyCareNet sector matrix, eAttest, eFact, MDA, eAgreement Claim Logo BE FHIR v2.1.2, sector-not-opened status for logopedie |
| `{baseDir}/references/04-recognition-visa-and-professional-bodies.md` | Diploma, FOD/SPF recognition, RIZIV visa, EU/non-EU recognition, VVL, UPLF, CPD, liability insurance, no-public-API finding |
| `{baseDir}/references/05-flemish-community.md` | VAPH, VSB, zorgkassen, Leersteundecreet, CLB, Opgroeien, VTC non-authority finding, CAR cumulverbod §36 §3 5° interpretation |
| `{baseDir}/references/06-french-brussels-german-communities.md` | AVIQ, Iriscare, PHARE, VGC, FWB (pôles territoriaux, centres PMS, ONE), DG/DSL comparative table |
| `{baseDir}/references/07-gdpr-and-patient-rights.md` | GDPR, BE law 30 Jul 2018, GBA/APD, Patient Rights Law 2002 + 2024 amendment, 30-year retention art. 35 Kwaliteitswet, NIS2, Schrems |
| `{baseDir}/references/08-business-tax-and-mutualities.md` | Self-employed/employed/freelance, BV/SRL, VVPRbis, art. 44 WBTW, sales of goods, kilometervergoeding with BOSA time series, mutualities, bookkeeping, UBO |
| `{baseDir}/references/09-peppol-and-b2b-e-invoicing.md` | ⚠️ CONTEXT-ONLY — halingo does NOT implement Peppol. Kept for support/sales conversations about the mandate. |
| `{baseDir}/references/verification-2026-04/01-riziv.md` through `08-tax.md` | Per-file verification notes with per-item RESOLVED/PARTIAL markers, legal citations, and primary-source quotes |
| `{baseDir}/references/answers/ehealth-nomencodes-for-logopedists.md` | Executive summary: can a logopedist send nomencodes via eHealth? (short answer: no, sector not opened at CIN/NIC) |

## Routing — "the user asks about X, read file Y"

**Nomenclature / billing / tariffs** → `01` + maybe `08 §3` for VAT side
**Prescription / bilan / session caps / age limits** → `02`
**eHealth / MyCareNet / eAttest / eFact / MDA / eAgreement** → `03` + `verification-2026-04/03-ehealth.md` for sector-status nuance
**Recognition / RIZIV number / VVL / UPLF** → `04`
**VAPH / Leersteundecreet / CLB / Opgroeien / Flemish-specific** → `05`
**AVIQ / PHARE / Iriscare / pôles territoriaux / centres PMS / DG / DSL** → `06`
**GDPR / patient rights / retention / secrecy / NIS2** → `07`
**Self-employed vs BV / VAT / freelance / kilometervergoeding / mutualities / bookkeeping** → `08`
**Peppol obligations (for the accountant, NOT for halingo)** → `09`
**Quick "yes/no" with source citations** → check `answers/` first, then the numbered file

## Critical verified facts that override training-data recall

These were pinned in the verification pass on 2026-04-06. Trust them over any conflicting recall:

1. **Session-reimbursement age cutoffs at the 18th birthday** apply to §2 b) 2° (taalontwikkeling), §2 b) 3° (leerstoornissen, verlenging tot 17 revolus), §2 d) (gehoorgerelateerd), §2 e) (dysfagie), §2 f) (dysfasie). All other pathologies have NO age limit; §2 b) 6.3 chronische neurologische spraakstoornissen is even renewable for life with 520 fresh sessions per 2-year cycle.
2. **Home-visit supplement:** there is NO separate "travel supplement code" in the RIZIV logopedie nomenclature. Home visits are billed through setting-specific session codes, not through a travel-fee line.
3. **VAPZ 2026:** 8.17% gewone / cap €4,086.34; 9.40% sociale / cap €4,701.54.
4. **VVPRbis 15→18%:** earliest effective 1 May 2026, no dividend transition, pre-31/12/2025 liquidation reserves grandfathered.
5. **VAT small-business threshold remains €25,000** — the €30,000 proposal was NOT enacted.
6. **PC 330.04** ("andere paramedici") unambiguously covers private logopedie cabinets — PC 200 is not competent.
7. **Silence-equals-consent / 45-day AMI rule does NOT apply** to Article 36 logopedie prior-approval. A positive decision from the médecin-conseil is required.
8. **Medical-record retention is now 30 years (statutory)** under art. 35 Kwaliteitswet (wet 22 April 2019, in force 1 January 2022). Accounting retention is 10 years since the wet 20 November 2022.
9. **Right to erasure does NOT override the 30-year retention** — GDPR art. 17(3)(b) and (c) carve-out.
10. **eAttest / eFact for logopedisten is NOT opened at CIN/NIC.** Not mandatory, not expected before 2027-Q4, realistic slip to 2028-2029. Derdebetaler billing is still paper via monthly verzamelstaten.
11. **MyCareNet eAgreement Claim Logo BE FHIR profile is published (v2.1.2, 2025-07-10)** but per-mutuality production deployment is opaque — every mutuality checked (Helan, CM, Solidaris) still runs the flow on paper.
12. **No public REST API for programmatic RIZIV-number verification.** Structured access only via eHealth partner contract (CoBRHA channel).
13. **eHealth Software Register is NOT strictly enforced** for logopedist-only software.
14. **CAR cumulverbod (§36 §3 5°):** only takes effect once multidisciplinary CAR treatment has actually started; bilan-and-wachtlijst patients keep RIZIV logopedie; §2 b) 6.3 and §2 d) pathologies are excluded from the cumulverbod.
15. **VSB MDO-honorarium 2026:** €30.64 deelnemer / €49.02 zorgbemiddelaar / €147.07 overlegorganisator — **but** the MDO system is being phased out this legislatuur under Minister Gennez (SV 624, 2 April 2025). Treat as deprecated funding source.
16. **Vlaamse Toezichtcommissie is NOT a GDPR art. 51 supervisory authority** — Raad van State arrest 266.244, 31 March 2026. Private SaaS hosting of praktijk data needs no VTC machtiging.
17. **Kilometervergoeding Q2 2026:** €0.4327/km per FOD BOSA omzendbrief 764 of 20/03/2026. Full Q1 2023 → Q2 2026 time series in file 08.

## halingo.be scope decision (2026-04-07)

halingo is a **clinical + RIZIV-billing SaaS**, NOT an accounting product. Every praktijk uses their own accountant or general accounting software beside halingo. When answering strategy or feature questions, **reject feature proposals that drift into accounting territory** (general AP/AR ledgers, VAT returns, payroll, Peppol sending/receiving, full bookkeeping). Keep halingo on clinical + RIZIV + mutuality billing + patient-B2C invoicing + export to accountant.

The four invoice channels must stay strictly separate in halingo's data model:

| Channel | Counterparty | Owned by | Format |
|---|---|---|---|
| Patient invoice / getuigschrift | Patient (B2C) | halingo | PDF / paper |
| Mutuality derdebetaler | Mutuality | halingo | Today paper verzamelstaat; future eFact |
| B2B (rent, retrocessie, sales to schools/employers) | Business | Accountant | Peppol BIS 3.0 |
| Supplier inbound invoices | Supplier → praktijk | Accountant | Peppol receive |

## Open uncertainties (5 PARTIAL items from the verification pass)

When one of these comes up, consult `VERIFICATION-PASS-2026-04-06.md` "The 5 items that remain PARTIAL" section and the corresponding verification note:

1. eAttest/eFact go-live date for logopedisten — no firm CIN/NIC date
2. eAgreement per-mutuality production readiness — profile stable, deployment opaque
3. DG inclusion / Förderpädagogik successor decree — reform agenda running, no successor instrument yet
4. BAP envelope 2025/2026 — budget not fully published
5. PC 330.04 — no FOD WASO ruling naming logopedisten specifically (scope text is unambiguous though)

## Gaps this skill does NOT cover

Do not fabricate answers in these areas — say you don't have them and offer to research:

- Per-mutuality operational quirks (layout, processing times, adviserend-arts behaviour)
- Limitatieve testlijsten (specific tests mandated for bilan per pathology)
- CAR / revalidatiecentra conventions from the centre-side perspective
- Competitive intelligence (Medinect, Progenda, Doctena, Epione, Assistool, Logopedix, Corilus, Hipporello)
- Pricing benchmarks / WTP / ARPU
- Legacy halingo codebase, data model, support tickets, churn drivers
- Clinical therapy protocols or exercise content
- Patient-facing UX accessibility patterns (WCAG for dyslexic users)

## Freshness and update protocol

- Content verified 2026-04-06 (initial build + verification pass) and 2026-04-07 (Peppol addition + scope decision).
- Belgian healthcare regulation changes regularly. Re-run the verification pass every 3–6 months or when RIZIV/INAMI publishes a new convention or a Staatsblad publication hits one of the watch-list feeds.
- Watch list: RIZIV/INAMI news, Staatsblad/Moniteur, FOD Volksgezondheid, eHealth platform announcements, GBA/APD decisions, VVL/UPLF.
- When you find the KB content is stale, flag it in your response AND update the relevant reference file's "Freshness notes" section with the new finding and date.

## One more thing

A separate working copy of this knowledge pack lives in the halingo workspace at `/home/tj/logo/knowledge/logopedist-be/`. The skill's `{baseDir}/references/` copy is the authoritative version for cross-workspace use. If you update one, mirror the change to the other (or ask the user which to treat as source of truth).
