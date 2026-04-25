# Verification pass 2026-04-06 — File 03 (eHealth, MyCareNet, eAttest, eFact)

This note resolves the four uncertainties forwarded from `03-ehealth-mycarenet-eattest-efact.md` after the first-pass research. Each item is tagged RESOLVED / PARTIAL / STILL OPEN, with the underlying primary sources and verbatim quotes where useful. Date of pass: 2026-04-06.

---

## Item 1 — eAttest / eFact opening date for the logopedist sector

**Status:** PARTIAL (no firm public date; "TBD" still on the books, see below)

### What we now know

1. **CIN/NIC has not opened the logopedist sector for eAttest or eFact in production as of 2026-04-06.** Direct evidence:
   - The eHealth-platform service page <https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest> still uses the eligibility wording: *"De dienst eAttest is alleen toegankelijk voor huisartsen (inclusief wachtdiensten), tandartsen, ziekenhuizen, fysiotherapeuten en hun erkende vertegenwoordigers."* Logopedisten are explicitly **not** in this list.
   - The MyCareNet sector menu at <https://ned.mycarenet.be> lists eleven sector pages (artsen, apothekers, beschut wonen, kinesitherapeuten, laboratoria, medische huizen, tandartsen, tariferingsdienst, verpleegkundigen, woonzorgcentra, ziekenhuizen, psychiatrisch verzorgingstehuis). **There is no logopedisten sector page.** Direct fetch of `/sectoren2/logopedisten` and `/sectoren2/logopedist` returns HTTP 404, and a `site:ned.mycarenet.be logopedist` query returns no indexed pages.
   - The general eAttest landing page <https://ned.mycarenet.be/algemene-diensten/eattest> only links to per-sector eAttest sub-pages for **artsen, kinesitherapeuten, tandartsen** — no logopedist link.
   - The general eFact "Inleiding facturatiedienst" page <https://ned.mycarenet.be/algemene-diensten/dienst-facturatie-derde-betaler/inleiding-facturatiedienst> mentions only the existing nine sectors (artsen, apothekers, kinesitherapeuten, laboratoria, medische huizen, tandartsen, verpleegkundigen, woonzorgcentra, ziekenhuizen). No logopedist mention.

2. **The official CIN/NIC roadmap commitment is "TBD" — and has been TBD for several years.** Buried inside the *Actieplan eGezondheid 2022-2024 / Plan d'actions eSanté 2022-2024* (PDF, 69 pages) is the only published government table that names the logopedist sector explicitly in the MyCareNet rollout plan. On page 53, the "Te realiseren / À réaliser" table for **Project MyCareNet** under Cluster 6 (Digitaliseren en optimaliseren van administratieve verwerkingen) reads:

   > *Analyse voor de logopedische sector — Q4/2022*
   > *Ontwikkeling en uitvoering voor de logopedische sector — TBD*

   The same table positions logopedists as one of the *"Nieuwe sectoren"* under MyCareNet expansion, alongside bandagisten, OT-apothekers, MRS Brussel/Wallonië, MSP/PVT, Reva-conventie, Reva-ziekenhuizen and mondhygiënisten.

   **The "Ontwikkeling en uitvoering" date has remained "TBD" through three subsequent action plans** (2022-2024, 2025-2027, 2026-2029). The 2025-2027 and 2026-2029 plans have moved to a more strategic "three-axes" structure (eHealth basic services / BIHR operationalization / alignment with content programs) and the per-sector implementation tables of the 2022-2024 plan are no longer reproduced verbatim in the public summary pages. Sources:
   - <https://www.riziv.fgov.be/SiteCollectionDocuments/actieplan_2022_2024_egezondheid.pdf> (page 53 of the PDF — verified by direct PDF text extraction).
   - <https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2025-2027>
   - <https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2026-2029>
   - <https://www.ehealth.fgov.be/nl/page/actieplan-egezondheid-2026-2029>
   - <https://www.health.belgium.be/fr/professionnels/professionnels-sante/sante-humaine/gestion-donnees/plan-daction-e-sante-2026-2029>

3. **No pilot is publicly visible.** Searches against `riziv.fgov.be`, `inami.fgov.be`, `ned.mycarenet.be`, `fra.mycarenet.be`, `cin-nic.be`, `mc.be`, `solidaris-vlaanderen.be`, `helan.be`, `caami-hziv.fgov.be` return zero hits for any pilot involving an mutuality and a logopedist software vendor for eAttest or eFact. Helan's logopedie agreement page <https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/> still describes a fully **paper-based** workflow ("Bezorg Helan hiervoor de nodige documenten" — list of three paper attachments).

4. **No mandatory dates.** RIZIV's mandatory eAttest/eFact press release <https://www.inami.fgov.be/nl/pers/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025> applies only to GPs, specialists and dentists (in force since 2025-09-01). The 2026-2027 logopedist convention (R/26, signed 2025-12-11) does **not** make electronic billing mandatory.

5. **The eGezondheid Roadmap 3.0 (2019-2021) did formally include logopedists in the eAttest and eFact target list** ("eAttest pour spécialistes, dentistes, kinés et logopèdes; eFact pour maisons médicales, kinés et logopèdes"), but that 2019-2021 roadmap has been superseded by the 2022-2024 plan in which logopedists slipped to "TBD". The two 2025-2027 / 2026-2029 plans are written at a strategic level and do not name the logopedist sector for either service.

### Bottom line for item 1

- The trade-press estimate of "by 2027" found in the first pass is **not** corroborated by any RIZIV / CIN / eHealth-platform document. The only formal statement of intent is the page-53 table of the 2022-2024 action plan, which lists the analysis as **completed (Q4/2022)** but the development and production rollout for the logopedist sector as **TBD with no quarter assigned**.
- The most likely vehicle for an official date will be either (a) a future RIZIV press release similar to the 2025-09-01 GP/dentist mandate, or (b) the next logopedist convention (2028-2029) negotiated late 2027. Halingo.be should not assume a hard date earlier than **2027-Q4 at the earliest**, and should plan for a slip into **2028-2029**.

### Sources for item 1

- eHealth platform — *Service MyCareNet eAttest* (NL): <https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest>
- MyCareNet (NL) — sector menu: <https://ned.mycarenet.be>
- MyCareNet (NL) — eAttest landing: <https://ned.mycarenet.be/algemene-diensten/eattest>
- MyCareNet (NL) — Inleiding facturatiedienst: <https://ned.mycarenet.be/algemene-diensten/dienst-facturatie-derde-betaler/inleiding-facturatiedienst>
- Actieplan eGezondheid 2022-2024 (PDF, page 53): <https://www.riziv.fgov.be/SiteCollectionDocuments/actieplan_2022_2024_egezondheid.pdf>
- Interfederaal actieplan eGezondheid 2025-2027: <https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2025-2027>
- Interfederaal actieplan eGezondheid 2026-2029: <https://www.riziv.fgov.be/nl/thema-s/egezondheid/interfederaal-actieplan-egezondheid-2026-2029>
- Helan — Medisch akkoord logopedie (still paper): <https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/>
- Verplichte elektronische facturatie artsen en tandartsen 2025-09-01: <https://www.inami.fgov.be/nl/pers/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025>
- Overeenkomst 2026-2027 voor de logopedisten (no e-billing clause): <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten>

---

## Item 2 — MyCareNet eAgreement / Claim Logo BE FHIR profile per-mutuality production-readiness

**Status:** PARTIAL — the FHIR profile is published and stable, but per-mutuality production deployment is **not** observable in any public source, and the practitioner-facing flow is still paper at the major mutualities checked.

### What we now know

1. **The FHIR profile exists, is stable and is not in flux.** The current Belgian MyCareNet FHIR profiles IG is **v2.1.2**, generated by the publication tool on **2025-07-10** but tagged with the same release date as v2.1.0/v2.1.1 (**2025-02-17**) per the changes.html log. All three v2.1.x point releases are FHIR R4 (4.0.1) and STU (Standards for Trial Use). The dedicated logopedist profile is:
   - **Profile**: `MyCareNet eAgreement Claim Logo BE` (StructureDefinition `be-eagreementclaim-logo`).
   - URL: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/StructureDefinition-be-eagreementclaim-logo.html>
   - Version: 2.1.2.
   - Conformance: status fixed `active`, use fixed `preauthorization`, mandatory patient/provider/insurance/enterer/created/priority, optional supportingInfo, optional referral, optional procedure-with-date, three custom rules on date consistency between billable period, created and procedure dates.
   - Code system bindings: `claim-type` (extensible), `processpriority` (example), `agreement-types` (eHealth standards), SNOMED-CT 386053000, and — most importantly — a **required** binding on `Claim.item.productOrService.coding` to the **Speech Therapy Pathology Situation Code** value set (see item 3 below for the full content).

2. **No public per-mutuality production status table.** The MyCareNet eAgreement landing page <https://ned.mycarenet.be/algemene-diensten/eagreement> lists eAgreement only under the kinesitherapeut and tandarts sub-pages (Chapter IV); there is no logopedist sub-page and there is no per-mutuality production matrix for the *logopedist* eAgreement. The MyCareNet portal navigation shows no logopedist sector page at all (see item 1).

3. **The practitioner-facing logopedist agreement workflow is still paper at every mutuality I could verify.** Spot checks:
   - **Helan**: <https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/> documents three paper attachments (logopedist verslag, behandelvoorschrift, RIZIV aanvraagformulier) sent to the medisch adviseur. No mention of MyCareNet, no mention of an electronic / FHIR submission.
   - **CM**: <https://www.cm.be/en/services-and-benefits/speech%20therapy> documents logopedist reimbursement in patient-facing terms; no electronic agreement flow exposed to providers.
   - **Solidaris Wallonie**: October 2025 reimbursement application form is a PDF (`Formulaire-de-demande-dintervention-Logopedie-version-octobre-2025.pdf`) — paper-only.
   - **CGM Oxygen** (the Corilus kine product) released eAgreement support in January 2025 (<https://www.cgm.com/bel_nl/magazine/articles/cgm-oxygen/2025/20250117-nieuwe-functionaliteit-eagreement.html>) — but the article frames eAgreement as a kinesitherapie feature, not a logopedist feature.

4. **RIZIV has updated the logopedist paper request forms in 2025**, *not* migrated them to an electronic flow. The page <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/logopedie-aanvraagformulieren-voor-een-tegemoetkoming-of-kennisgeving-van-verlenging> records new versions of the standard paper request and notification-of-extension forms valid from 2025-05-01 and 2025-09-01. The page contains no link to an electronic / MyCareNet submission channel.

### Bottom line for item 2

- The FHIR `Claim Logo BE` profile is **published and frozen at v2.1.2 since 2025-02-17**. It is technically callable. There are example instances ex16-ex27 in the IG covering assessment, treatment, cancellations, consultations, extensions, rejections and partial agreements.
- **No mutuality has published a production go-live for it**, and the field evidence (Helan, CM, Solidaris, CGM Oxygen, the RIZIV paper-form refresh) suggests no mutuality is currently consuming the profile at scale for logopedist agreements. The de facto live process is still paper.
- For halingo.be: implement against the profile in **acceptance** today (the WSDL/XSD/FHIR definitions are stable and the example instances let you build round-trip tests), but **do not** market eAgreement Logo as a production feature to customers until at least one mutuality publicly announces an integrator-test phase. Build a paper fallback into the agreement-request workflow as the default.

### Sources for item 2

- Belgian MyCareNet FHIR profiles IG ToC: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/toc.html>
- Belgian MyCareNet FHIR profiles IG changes.html: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/changes.html>
- Profile `be-eagreementclaim-logo`: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/StructureDefinition-be-eagreementclaim-logo.html>
- Profile definitions (with bindings): <https://www.ehealth.fgov.be/standards/fhir/mycarenet/2.1.2/StructureDefinition-be-eagreementclaim-logo-definitions.html>
- IG artifacts page: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/artifacts.html>
- MyCareNet eAgreement landing (NL): <https://ned.mycarenet.be/algemene-diensten/eagreement>
- Helan medisch akkoord logopedie: <https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/>
- CGM Oxygen eAgreement release: <https://www.cgm.com/bel_nl/magazine/articles/cgm-oxygen/2025/20250117-nieuwe-functionaliteit-eagreement.html>
- RIZIV updated logopedie request forms 2025: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/logopedie-aanvraagformulieren-voor-een-tegemoetkoming-of-kennisgeving-van-verlenging>

---

## Item 3 — Speech Therapy Pathology Situation Code value set (full content)

**Status:** RESOLVED.

### Identification

- **Value set canonical URL**: `https://www.ehealth.fgov.be/standards/fhir/nihdi-terminology/ValueSet/be-vs-speech-therapy-pathology-situation-code`
- **Version**: 1.0.0
- **Backing code system canonical URL**: `https://www.ehealth.fgov.be/standards/fhir/nihdi-terminology/CodeSystem/be-cs-speech-therapy-pathology-situation-code`
- **Computable name**: `BeCSSpeechTherapyPathologySituationCode`
- **Total concepts**: 17 (full enumeration below)
- **Bound on**: `Claim.item.productOrService.coding` in the `MyCareNet eAgreement Claim Logo BE` profile (binding strength: **required**).

The IG's table of contents reuses the file name `nihdi-physiotherapy-pathologysituationcode` for the *kine* code system, which is what tripped the first-pass scrape. The *speech therapy* equivalent lives in a separate, NIHDI-terminology-namespaced repo and is the one actually bound to the Claim Logo BE profile.

### Full code listing (extracted from the published HTML)

| Code  | Display (en) |
|-------|--------------|
| a     | Oral language and/or speech disorders |
| b1    | Aphasia |
| b2    | Development of receptive and/or expressive language |
| b3    | Dyslexia / dysorthography / dyscalculia |
| b4    | Cleft lip, palate or alveolar |
| b5    | Radiotherapy or surgery (head/neck) |
| b6-1  | Traumatic or proliferative dysglossias |
| b6-2  | Dysarthria |
| b6-3  | Chronic speech disorders |
| b6-4  | Stuttering |
| b6-5  | Interceptive orthodontic treatment |
| c1    | Laryngectomy |
| c2    | Dysfunction of the larynx and/or vocal chords |
| d     | Hearing problems |
| e     | Dysphagia |
| f     | Dysphasia |
| g     | Locked-in Syndrome |

The published HTML view does not currently expose the `nl-BE` and `fr-BE` displays in the rendered ValueSet/CodeSystem pages — the IG's underlying JSON/XML resources should carry them, but they are not surfaced in the human-friendly view as of the v2.1.2 publication on 2025-02-17. The English display is sufficient for the FHIR binding, and a halingo.be UI dropdown can be locally translated by mapping the codes to the RIZIV pathology-category labels in §§ 2 a) — § 2 g) of the logopedie nomenclature (file 01 §3-§5 of this knowledge base).

### Mapping note: how these 17 codes map to the RIZIV nomenclature pathology categories

The seven RIZIV pathology categories in Article 36 § 2 (used in file 01) correspond to the 17 FHIR codes as follows. This is *not* in the IG (the IG only gives the English display); it is reconstructed by halingo from the medical content of the labels and the matching RIZIV categories:

| FHIR codes | Maps to RIZIV § 2 ... |
|---|---|
| `a` | § 2 a) Troubles du langage oral et/ou de la parole / Mondelinge taal- en/of spraakstoornissen |
| `b1` | § 2 b) 1° Aphasie / Afasie |
| `b2` | § 2 b) 2° Troubles du développement du langage / Ontwikkelingstaalstoornissen (test-bewezen) |
| `b3` | § 2 b) 3° Dyslexie / dysorthographie / dyscalculie |
| `b4` | § 2 b) 4° Fente labiale, palatine ou alvéolaire |
| `b5` | § 2 b) 5° Radiothérapie ou chirurgie de la sphère ORL |
| `b6-1` ... `b6-5` | § 2 b) 6° (sub-bullets 1° to 5°) — dysglossies, dysarthrie, troubles chroniques de la parole, bégaiement, traitement orthodontique interceptif |
| `c1` | § 2 c) 1° Laryngectomie |
| `c2` | § 2 c) 2° Dysfonction du larynx et/ou des cordes vocales |
| `d`  | § 2 d) Troubles auditifs / Gehoorsstoornissen |
| `e`  | § 2 e) Dysphagie / Slikstoornissen |
| `f`  | § 2 f) Dysphasie |
| `g`  | § 2 g) Locked-in Syndrome |

This mapping is consistent with the structure of Article 36 § 2 of the logopedie nomenclature (cross-checked against file `01-riziv-nomenclature-and-tariffs.md` § 5 of this knowledge base).

### Sources for item 3

- ValueSet HTML: <https://www.ehealth.fgov.be/standards/fhir/nihdi-terminology/ValueSet-be-vs-speech-therapy-pathology-situation-code.html>
- CodeSystem HTML: <https://www.ehealth.fgov.be/standards/fhir/nihdi-terminology/CodeSystem-be-cs-speech-therapy-pathology-situation-code.html>
- Profile binding (item.productOrService → required, value set above): <https://www.ehealth.fgov.be/standards/fhir/mycarenet/2.1.2/StructureDefinition-be-eagreementclaim-logo-definitions.html>

---

## Item 4 — eHealth Software Register: enforcement status for non-GP packages (logopedist SaaS)

**Status:** RESOLVED — registration is **NOT strictly enforced** for logopedist-only software, and there is **no logopedist doelgroep** in the register.

### What we now know

1. **Registration in the eHealth Software Register is not universally mandatory.** The authoritative RIZIV page on technical info / registration for software vendors states the rule cleanly:
   - **Web applications without integration into an existing software package** → registration is *not* required; only a notification form must be filled in.
   - **Webcomponents, FHIR API or hybrid integration** → a registration test is required.

   Source quote (translated from NL): *"Registratie is het proces waarbij gecontroleerd wordt of softwarepakketten beantwoorden aan vastgelegde kwaliteitsvereisten."* The page does not use the word "verplicht / obligatoire" for the broad category of all eHealth-connected software; it explicitly differentiates by integration type. URL: <https://www.riziv.fgov.be/nl/thema-s/egezondheid/technische-informatie-en-registratie-voor-softwareleveranciers-van-softwarepakketten-voor-zorgverleners>

2. **The register is organized per *doelgroep* (target group / profession), and there is no logopedist doelgroep.** The eHealth Software Register service page <https://www.ehealth.fgov.be/ehealthplatform/nl/service-registratie-van-de-softwarepakketten> says: *"Softwarepakketten kunnen geregistreerd worden voor bepaalde doelgroepen zoals huisartsen of verpleegkundigen, op voorwaarde dat deze voldoen aan alle functionele én modulaire criteria die voor die doelgroep gelden."* The doelgroepen with documented functional+modular criteria, as referenced on the eHealth-platform pages I could verify, are:
   - Huisartsen (general practitioners)
   - Verpleegkundigen (nurses)
   - Tandartsen (dentists)
   - Fysiotherapeuten / kinesitherapeuten (physiotherapists)

   **Logopedisten are not listed as a doelgroep.** The page <https://www.ehealth.fgov.be/nl/software-registratie/dokter> exists for the dokter (GP) doelgroep; the equivalent `…/logopedist` page returns HTTP 404. The same is true at the eHealth-platform's *Pagina niet gevonden* templates for kinesitherapeut (which used to exist when the static URL was `…/softwares/kin` and is now archived).

3. **The register is *de facto* tied to the RIZIV telematicapremie**, which is a per-discipline financial incentive. The introductory blurb on every register page is consistent: *"Het eHealth-platform heeft een evaluatiesysteem van softwarepakketten ingevoerd waarop het RIZIV zich tevens baseert om eventuele telematicapremies toe te kennen."* The disciplines that have a telematicapremie (and therefore a doelgroep in the register) are huisartsen, tandartsen, kinesitherapeuten, verpleegkundigen and (since 2024) vroedvrouwen. **Logopedisten do not have a telematicapremie.** Searches against `inami.fgov.be` for `prime télématique logopedes` and against `riziv.fgov.be` for `telematicapremie logopedist` return zero hits. The 2026-2027 logopedist convention does not mention a telematicapremie.

4. **Practical consequence for halingo.be**: a SaaS product targeting only logopedists has *no doelgroep* to register against in the eHealth Software Register. The vendor still has obligations:
   - Sign the *Convention software vendor – CIN/NIC* before connecting any test NIHII to MyCareNet acceptance (this is a contractual prerequisite, separate from the Software Register).
   - Use the *integrator notification form* to record the product / version / certificates / contact emergency information with the eHealth platform when first connecting to acceptance and then to production.
   - Pass the per-service release procedure with CIN/NIC for each MyCareNet service the SaaS uses (today: MemberData, GenericInsurability; tomorrow: eAgreement Logo, eAttest, eFact when CIN/NIC opens these for the logopedist sector).
   - There is **no formal "register and validate" gate that halingo.be must pass through before going live**, beyond the per-service CIN/NIC release procedure. There is no risk of being rejected for not appearing in the eHealth Software Register.

### Bottom line for item 4

- The Software Register is **structurally optional for a logopedist-only SaaS** as of 2026-04-06: there is no logopedist doelgroep, no logopedist functional/modular criteria, and no logopedist telematicapremie that would create a *de facto* registration requirement.
- The contractual obligations (CIN/NIC vendor convention, per-service release procedure) **do** apply.
- If halingo.be ever extends to support kinesitherapeuten or verpleegkundigen (e.g. as a multi-discipline group practice EHR), then the relevant doelgroep registrations would become applicable, and the kinesitherapie / verpleegkunde criteria would need to be met to qualify customers for their telematicapremies.

### Sources for item 4

- RIZIV — *Technische informatie en registratie voor softwareleveranciers*: <https://www.riziv.fgov.be/nl/thema-s/egezondheid/technische-informatie-en-registratie-voor-softwareleveranciers-van-softwarepakketten-voor-zorgverleners>
- eHealth platform — *Service registratie van de softwarepakketten*: <https://www.ehealth.fgov.be/ehealthplatform/nl/service-registratie-van-de-softwarepakketten>
- eHealth platform — *Registratie van de medische softwarepakketten*: <https://www.ehealth.fgov.be/ehealthplatform/nl/registratie-van-de-medische-softwarepakketten>
- eHealth platform — *Software-registratie / dokter*: <https://www.ehealth.fgov.be/nl/software-registratie/dokter>
- INAMI — *Prime télématique infirmiers*: <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/infirmiers/prime-telematique-soins-infirmiers>
- INAMI — *Prime télématique dentistes*: <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/dentistes/prime-telematique-pour-les-dentistes>
- INAMI — *Prime télématique kinésithérapeutes*: <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/kinesitherapeutes/prime-telematique>
- (No equivalent INAMI/RIZIV page exists for "prime télématique logopèdes" / "telematicapremie logopedist".)

---

## Summary table

| # | Topic | Status | Headline finding |
|---|---|---|---|
| 1 | eAttest/eFact opening date for logopedist sector | PARTIAL | Still officially "TBD" since the 2022-2024 action plan; no firm date in any source; "by 2027" trade-press estimate has *no* primary-source backing. Field workflows (Helan, CM, Solidaris, RIZIV paper forms) confirm no migration in flight. |
| 2 | eAgreement Claim Logo BE per-mutuality production | PARTIAL | FHIR profile v2.1.2 published 2025-02-17 and stable; no public per-mutuality go-live; field evidence shows the agreement workflow is still paper at every mutuality checked. |
| 3 | Speech Therapy Pathology Situation Code value set | RESOLVED | 17 codes (`a`, `b1`-`b5`, `b6-1`-`b6-5`, `c1`, `c2`, `d`, `e`, `f`, `g`), version 1.0.0, full table extracted from the canonical CodeSystem URL and mapped to RIZIV § 2 a)-g) categories. |
| 4 | eHealth Software Register enforcement for non-GP packages | RESOLVED | NOT mandatory for logopedist-only SaaS. Register is per-doelgroep, no logopedist doelgroep exists, no telematicapremie for logopedists. CIN/NIC per-service release procedure remains the only effective gate. |

**Resolved: 2 of 4. Partial: 2 of 4. Still open: 0 of 4.**

The two PARTIAL items are partial in the sense that the *primary-source government commitment* is missing (no firm public date for the logopedist eAttest/eFact rollout, no per-mutuality production matrix for eAgreement Logo). They are however *bounded*: I am now confident there is **no** firm date and **no** per-mutuality go-live as of 2026-04-06. The next refresh should re-check these items quarterly against the eHealth roadmap dashboard, the CIN news page, and the kine/log sector pages on `ned.mycarenet.be`.
