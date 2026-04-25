# Answer — Can a logopedist send nomenclature codes electronically to eHealth?

> Executive summary of research findings, 2026-04-06
> Backing references: `../03-ehealth-mycarenet-eattest-efact.md`, `../verification-2026-04/03-ehealth.md`

## Bottom line

**No. A Belgian logopedist cannot, today, send nomenclature codes electronically via eAttest or eFact.** The logopedist sector is **not opened** at CIN/NIC, and the new **Overeenkomst 2026-2027 voor logopedisten (R/26)**, signed 11/12/2025, does **not** impose electronic billing. Realistic go-live: **not before 2027-Q4, likely slipping to 2028-2029**.

## What is NOT available for logopedists today

| Service | Status for logopedie | Evidence |
|---|---|---|
| **eAttest** (elektronisch getuigschrift voor verstrekte hulp) | ❌ Not opened for the sector | eHealth service page states the service is open only to *huisartsen, tandartsen, ziekenhuizen, fysiotherapeuten*. No logopedist sector page exists on `ned.mycarenet.be`. |
| **eFact** (electronic third-party-payer invoicing) | ❌ Not opened for the sector | MyCareNet `Inleiding facturatiedienst` lists 9 sectors — logopedie is not among them. No production endpoint, no pilot, no announced go-live. |

**Why not?** In the *Actieplan eGezondheid 2022-2024* (p. 53) the logopedist-sector MyCareNet rollout is listed under "Nieuwe sectoren" with the **analysis completed in Q4/2022** but development and production marked as **"TBD"**. That TBD has persisted unchanged through the 2025-2027 and 2026-2029 interfederal action plans. Compare to **artsen, tandartsen, specialisten**: eAttest/eFact **mandatory since 01/09/2025** per the RIZIV press release.

## What IS available for logopedists today

| Service | Status | What it delivers |
|---|---|---|
| **Generic Insurability + MDA (MemberData)** | ✅ Sector-agnostic, works | Real-time verzekerbaarheids- and BIM-check on the patient before a session |
| **eHealthBox** | ✅ Works | Secure messaging with prescribers, adviserend arts, other practitioners |
| **CSAM / STS authentication** | ✅ Works | eID / itsme login, eHealth certificate for machine-to-machine |
| **Consent + therapeutic relationship** | ✅ Works | Register patient consent, declare therapeutic relationship |
| **CoBRHA** (provider registry) | ✅ Partner contract only | Verify RIZIV numbers programmatically — no public REST API |
| **eAgreement Claim Logo BE (FHIR R4)** | ⚠️ Profile published (v2.1.2, 2025-07-10), per-mutuality deployment **opaque** | Future: electronic prior-approval from the médecin-conseil. Today: every mutuality checked (Helan, CM, Solidaris) still runs the flow on **paper**. |

## What logopedists actually do today (fallback workflows)

### Third-party-payer (derdebetaler / tiers payant)
1. Software stores the structured invoice line per session (RIZIV-nr therapist, RIZIV-nr prescriber, INSZ patient, mutuality code, nomencode, date, setting, honorarium, remgeld, eAgreement reference).
2. At month-end it generates a **paper monthly verzamelstaat per mutuality** — each mutuality has its own layout quirks, all 7 mutuality groups must be supported.
3. The praktijk posts the verzamelstaat; the mutuality pays the therapist 14–30 days later.

### Not-third-party-payer
1. The praktijk issues a **paper getuigschrift voor verstrekte hulp** from an officially numbered RIZIV booklet they bought.
2. The patient pays the therapist, then submits the paper getuigschrift to their mutuality for direct reimbursement.

## Implications for halingo (advisor recommendation)

1. **MVP must generate compliant paper verzamelstaten** per mutuality. This is not optional — it is the only legally operative derdebetaler channel for logopedie today. Get all 7 layout variants right.
2. **Pre-build eAttest** against the **kinesitherapeut WSDL** (MCN eAttest WS V3 Cookbook v1.2, 2022-08-04) as the nearest production analogue. Feature-flag it off until CIN/NIC opens the sector. When they flip the switch, halingo is ready same-day — that is a real competitive moat.
3. **Implement eAgreement Claim Logo BE FHIR v2.1.2** now. The profile is stable. **Feature-flag per mutuality** with paper fallback, because no mutuality has it observably live.
4. **Ship MDA (insurability check) immediately** — sector-agnostic, works today, drastically improves patient UX at session start. This is the single highest-ROI eHealth integration for a v1 logopedist SaaS.
5. **Do not assume any go-live date** for eAttest/eFact before 2027-Q4. Plan for slip to 2028-2029. Monitor:
   - RIZIV press releases (`riziv.fgov.be/nl/nieuws`)
   - The next logopedie convention cycle (2028-2029, negotiated late 2027)
   - CIN/NIC sector page appearance at `ned.mycarenet.be`
6. **Three-channel architecture, kept strictly separate in code:**
   - **Peppol** → B2B (see file 09)
   - **eFact / MyCareNet** → mutualities (today: paper)
   - **Plain invoice** → patients (B2C)

## Primary sources

- eHealth platform — Service MyCareNet eAttest (eligibility wording naming only artsen/tandartsen/ziekenhuizen/fysiotherapeuten): https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest
- MyCareNet NL sector menu: https://ned.mycarenet.be
- MyCareNet NL — Inleiding facturatiedienst: https://ned.mycarenet.be/algemene-diensten/dienst-facturatie-derde-betaler/inleiding-facturatiedienst
- Actieplan eGezondheid 2022-2024 (page 53 — "Analyse voor de logopedische sector — Q4/2022; Ontwikkeling en uitvoering — TBD"): https://www.riziv.fgov.be/SiteCollectionDocuments/actieplan_2022_2024_egezondheid.pdf
- Interfederaal actieplan eGezondheid 2025-2027: https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2025-2027
- Interfederaal actieplan eGezondheid 2026-2029: https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2026-2029
- Verplichte elektronische facturatie voor artsen en tandartsen vanaf 1 september 2025: https://www.inami.fgov.be/nl/pers/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025
- Overeenkomst 2026-2027 voor de logopedisten (no e-billing clause): https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten
- Helan — Medisch akkoord logopedie (still paper): https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/
- MyCareNet FHIR Profiles IG v2.1.2 — Claim Logo BE: https://www.ehealth.fgov.be/standards/fhir/mycarenet/StructureDefinition-be-eagreementclaim-logo.html
