# Verification Pass — 2026-04-06

> A second-pass sweep that resolved the 31 uncertainties flagged during the initial 2026-04-06 research build.
>
> **Scope:** 8 parallel agents, one per source file, each verifying only its flagged items against primary sources.
> **Result:** **26 RESOLVED, 5 PARTIAL, 0 STILL OPEN.**

Per-item verification notes live in `verification-2026-04/` (8 files, ~22,000 words). This document is the consolidated index and headline findings.

---

## Tally per file

| File | Items | Resolved | Partial | Still open | Note |
|---|---|---|---|---|---|
| 01 — RIZIV Nomenclature | 5 | 5 | 0 | 0 | [01-riziv.md](verification-2026-04/01-riziv.md) |
| 02 — Prescription & Clinical | 3 | 3 | 0 | 0 | [02-clinical.md](verification-2026-04/02-clinical.md) |
| 03 — eHealth / MyCareNet | 4 | 2 | 2 | 0 | [03-ehealth.md](verification-2026-04/03-ehealth.md) |
| 04 — Recognition & Convention | 2 | 2 | 0 | 0 | [04-recognition.md](verification-2026-04/04-recognition.md) |
| 05 — Flemish Community | 3 | 3 | 0 | 0 | [05-flanders.md](verification-2026-04/05-flanders.md) |
| 06 — Other Communities | 5 | 3 | 2 | 0 | [06-other-regions.md](verification-2026-04/06-other-regions.md) |
| 07 — GDPR & Patient Rights | 4 | 4 | 0 | 0 | [07-privacy.md](verification-2026-04/07-privacy.md) |
| 08 — Business & Tax | 5 | 4 | 1 | 0 | [08-tax.md](verification-2026-04/08-tax.md) |
| **Totals** | **31** | **26** | **5** | **0** | |

---

## Headline findings — corrections pushed back into the source files

These are facts discovered during the verification pass that differed from — or sharpened — the first-pass text. The corresponding source files have been updated in place.

### File 01 — RIZIV Nomenclature
- **Article 36 §3 FR labels**: full set retrieved via NomenSoft and added to the code tables.
- **-25% non-convention reduction window**: exact convention dates and affected codes pinned from the RIZIV overeenkomst text and corresponding KB.
- **RIZIV Compendium**: full pass completed; no logopedie-specific rules the first pass missed, but a few interpretation notes (cumulation carve-outs, setting clarifications) have been added to file 01.
- **Bevoegdheidscodes for logopedisten**: the current list of qualification codes was extracted and added.
- **Home-visit supplement — key correction**: **there is no fixed supplement code and no fixed amount in cents.** Home-visit billing is handled through the setting-specific session codes themselves (cabinet vs home vs school vs institution vs collectivity), not through a separate "travel supplement" line item. Any product logic that assumed a separate travel-fee code must be corrected.

### File 02 — Prescription & Clinical Workflow
- **Silence-equals-consent / 45-day rule** (negative finding): verified that the general AMI-law silence-equals-consent rule is **not** automatically applicable to Article 36 logopedie prior-approval. Article 36 governs its own timelines. Halingo must **not** assume any silent approval — a positive decision from the médecin-conseil is required.
- **Cumulation with eerstelijnspsychologische zorg (ELPZ)**: resolved — no explicit cumulation ban in the current RIZIV convention text. A logopedist trajectory and an ELPZ trajectory can co-exist as long as they treat distinct problems. Per-mutuality FAQ guidance confirms.
- **Cancellation fees** (negative finding): no RIZIV convention or circular addresses patient cancellation fees. These are a purely civil-contract matter between therapist and patient, never reimbursable, and must be clearly documented in the praktijkreglement / règlement de cabinet.

### File 03 — eHealth / MyCareNet
- **eAttest/eFact go-live date for logopedists** (PARTIAL): no firm public date from CIN/NIC or RIZIV as of 2026-04-06. "Planned 2027" remains the best available statement. Halingo should treat this as a roadmap risk and not hard-code any go-live assumption.
- **eAgreement FHIR profile readiness** (PARTIAL): the **Claim Logo BE FHIR profile is published and stable**, but **per-mutuality production deployment is not observable in any public source**. Practitioner-facing flow at the major mutualities checked is still paper. Halingo should build the client against the published IG but plan for a staged enablement per mutuality.
- **Speech Therapy Pathology Situation Code value set**: retrieved from the current FHIR IG; added to file 03.
- **eHealth Software Register** (key correction): **registration is NOT strictly enforced** for logopedist-only software, and **there is currently no logopedist doelgroep** in the register. Halingo can ship without Software Register enrolment, but should monitor for future enforcement.

### File 04 — Recognition & Convention
- **Public API for RIZIV-number verification** (key correction): there is **no public REST API for general use**. Structured access exists only via the eHealth-platform under a partner contract. For production, halingo should either (a) use the RIZIV public search page as a verified UI with user consent, or (b) integrate via eHealth under a signed agreement. A CoBRHA consumer contract is the programmatic path; file 04 updated with the procedure.
- **2026–2027 logopedie convention**: status and any CPD-sociaal-statuut coupling clarified. File 04 updated with the current overeenkomstencommissie state as of research time.

### File 05 — Flemish Community
- **MDO-honorarium inside VSB** (RESOLVED + important policy update): **2026 tariffs: €30.64 deelnemer (max 4 participants) / €49.02 zorgbemiddelaar / €147.07 overlegorganisator.** 2025 was €29.61 / €47.37. Legal basis: BVR 26 november 2021 + decreet 18 juni 2021, executing the VSB-decreet van 18 mei 2018; zorgkassen-financed since 1 januari 2022. **Critical policy update:** in her answer to SV nr. 624 (Van den Driessche, 2 april 2025), minister Gennez confirmed the MDO-system will be **uitgefaseerd** this legislatuur in favour of vergoedingen for zorgcoördinatie/casemanagement. **Halingo should treat MDO as a deprecated funding source by mid-legislatuur** and not invest heavily in MDO-specific billing UX.
- **Vlaamse Toezichtcommissie machtigingsplicht for private SaaS hosting** (RESOLVED — no authorisation required): the private logopedist↔halingo verwerker-relatie falls under GDPR + the kaderwet GBA + the Kwaliteitswet 22.04.2019, with the federal **GBA** as supervisory authority. The **Raad van State arrest nr. 266.244 van 31 maart 2026** definitively annulled a corrective VTC decision and confirmed the VTC does **not** qualify as Art. 51 GDPR supervisory authority. A Vlaamse machtiging is only required if halingo integrates with a Vlaamse overheidsbron (AgODi/Discimus, CLB/LARS, VAPH, Departement Zorg, Magda).
- **October 2025 CAR-cumulverbod interpretation rule** (RESOLVED): the instrument is a **two-step interpretatieregel from the Verzekeringscomité van het RIZIV** on art. 36 § 3, 5° of the federal logopedie-nomenclatuur, published in the **Belgisch Staatsblad on 2 oktober 2025**. The first version *tightened* the rule (cumulverbod active from the conclusion of the multidisciplinary bilan); a refined second version restored the practical reading: the cumulverbod only takes effect once **multidisciplinary CAR treatment has actually started**. Children on the wachtlijst — and patients in the bilan-to-first-session interval — keep their RIZIV-monodisciplinary logopedie. Retroactive from 2 October 2025; wrongly refused sessions can be regularised. **Pathologies in § 2 b) 6.3 (dysarthria) and § 2 d) (hearing disorders) remain excluded from the cumulverbod** and may run in parallel with CAR.

### File 06 — Other Communities
- **DG inclusion / Förderpädagogik decrees** (PARTIAL): foundational 1998 decree confirmed; no single successor "inclusion" decree has replaced it. Ongoing reform agenda for late-2024/2025/2026 captured in the verification note. Decree numbers and amendments inventoried to the extent publicly searchable.
- **Auxiliaires logopédiques in centres PMS** (RESOLVED): current FWB status documented with decree/arrêté references and the UPLF position.
- **Pôles territoriaux current count** (RESOLVED): the current (2025/2026) list and territorial coverage retrieved; file 06 updated.
- **Post-2024 residual material aids** (RESOLVED): categories still funded regionally vs. federalised were pinned against current PHARE / AVIQ / DSL pages.
- **BAP envelope figure** (PARTIAL): current 2025/2026 budget not fully published at research time; the most recent confirmed value is kept with a re-verify flag.

### File 07 — GDPR & Patient Rights
- **Art. 34 Kwaliteitswet electronic-only obligation for logopedists**: the current status of the RD specifically for logopedists was pinned. The verification note documents whether a RD has been published, whether a draft is in consultation, and the practical position for halingo. File 07 updated.
- **"Sufficiently mature minor" age threshold**: the 2024 amendment to the Patient Rights Law did **not** introduce a statutory age. Doctrine and GBA guidance continue to cluster around 12–14, assessed case-by-case on discernment. Halingo's product should expose a per-patient "mature minor" flag rather than enforce a hard age gate.
- **Schrems III**: status of pending CJEU challenges to the EU-US Data Privacy Framework documented. EDPB position and GBA stance on US DPF-certified processors for Belgian health data: halingo should treat DPF reliance as a transition measure, not a durable architectural assumption. Prefer EU-hosted sub-processors for Belgian patient data.
- **Belgian NIS2 transposition law**: exact citation of the Belgian NIS2 transposition act and publication date pinned. Applicability thresholds for a SaaS like halingo (health-sector digital service provider, SME size) documented — as well as the registration obligation with the CCB, incident-notification duties, and management-liability clauses.

### File 08 — Business & Tax
- **PC 330 vs PC 200** (PARTIAL, clear conclusion): **PC 330.04** ("andere paramedici") unambiguously covers private logopedie cabinets; PC 200 is not competent. No FOD WASO ruling specifically names logopedisten, but the scope text of PC 330.04 is unambiguous. File 08 hardened.
- **2026 VAPZ** (key correction): **8.17% gewone VAPZ, cap €4,086.34; 9.40% sociale VAPZ, cap €4,701.54.** The first-pass draft figure of 8.5%/9.78% was **factually wrong** and has been corrected.
- **VVPRbis 15% → 18%** (important timing): programmawet DOC 56-1378/001; the vote was **postponed**. **Earliest effective date: 1 May 2026.** **No transition for dividends.** Pre-31 December 2025 liquidation reserves are grandfathered. Logopedist BV owners planning distributions must factor this in.
- **€25,000 → €30,000 VAT threshold** (key correction): **€25,000 remains legally in force.** The increase to €30,000 was proposed but **not enacted**. Do not design product flows around a 30k threshold.
- **Quarterly kilometervergoeding 2023–Q2 2026** (RESOLVED): full table of federal rates retrieved with FOD BOSA omzendbrief numbers. **Q2 2026 = €0.4327 per km (BOSA omzendbrief nr. 764 van 20/03/2026).** The full time series is in file 08.

---

## The 5 items that remain PARTIAL — why and what halingo should do

1. **eAttest/eFact go-live date for logopedists** (file 03) — no primary-source firm date. **Do:** build against the published IGs, plan staged per-mutuality enablement, subscribe to RIZIV/CIN-NIC news for the announcement.
2. **eAgreement per-mutuality production readiness** (file 03) — profile is stable; deployment is opaque. **Do:** implement the client, but design for a feature flag per mutuality that can be flipped when each one goes live. Keep the paper fallback.
3. **DG inclusion / Förderpädagogik successor decree** (file 06) — reform agenda running but no single successor instrument yet. **Do:** monitor ostbelgienlive.be / dglive.be for the reform outcome; until then, the 1998 decree remains the legal basis.
4. **BAP envelope figure** (file 06) — budget for 2025/2026 not fully published. **Do:** not product-critical; revisit at next audit.
5. **PC 330.04 — logopedist-specific ruling** (file 08) — the scope text is clear but no published FOD WASO ruling names logopedisten by name. **Do:** treat PC 330.04 as the operational answer, document the reasoning in the HR module, and if a client praktijk wants belt-and-braces certainty, refer them to a social secretariat for a written confirmation on their specific employment structure.

---

## Files modified in this pass

**Source files (in-place Freshness notes updates):**
- `01-riziv-nomenclature-and-tariffs.md` — 5 items marked RESOLVED; home-visit code correction in §6
- `02-prescription-bilan-and-pathology-rules.md` — 3 items marked RESOLVED (incl. 2 negative findings)
- `03-ehealth-mycarenet-eattest-efact.md` — 2 RESOLVED, 2 PARTIAL; Software Register clarification added
- `04-recognition-visa-and-professional-bodies.md` — 2 items marked RESOLVED; no-public-API conclusion documented
- `05-flemish-community.md` — 3 items marked RESOLVED; MDO deprecation warning added; VTC clarification sharpened; CAR cumulverbod §3,5° text added
- `06-french-brussels-german-communities.md` — 3 RESOLVED, 2 PARTIAL; pôles territoriaux list updated
- `07-gdpr-and-patient-rights.md` — 4 items marked RESOLVED; NIS2 and Schrems III positions added
- `08-business-tax-and-mutualities.md` — 4 RESOLVED, 1 PARTIAL; VAPZ corrected, PC 330.04 hardened, VVPRbis timing, €25k confirmed, quarterly kilometervergoeding table added

**New files:**
- `verification-2026-04/01-riziv.md` through `08-tax.md` — per-file verification notes (~22,000 words)
- `VERIFICATION-PASS-2026-04-06.md` — this document

---

## Next re-verification checkpoints

Items that require an active watch between now and the next pass:

- **RIZIV news feed** for 2026–2027 overeenkomst publication (file 04)
- **CIN/NIC + RIZIV** for the logopedist eAttest/eFact go-live announcement (file 03)
- **Per-mutuality production enablement** of eAgreement Logo BE (file 03)
- **Programmawet VVPRbis 18%** — confirmation of 1 May 2026 effective date once published (file 08)
- **VSB MDO phase-out** — Minister Gennez's mededeling and successor zorgcoördinatie vergoeding (file 05)
- **Kwaliteitswet art. 34 RD** for logopedists if/when published (file 07)
- **CJEU Schrems-III judgments** on the DPF (file 07)

Recommended cadence: re-run the verification pass every 3–6 months, or immediately when RIZIV publishes a new convention or when a Staatsblad publication is flagged in one of the subscribe-to feeds listed in the README.
