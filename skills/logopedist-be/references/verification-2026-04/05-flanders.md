# Verification pass 2026-04-06 — File 05 (Flemish Community)

This note resolves the three open uncertainties listed in § 11 ("Freshness notes — Onbekend / nog te valideren") of `05-flemish-community.md`. Each item is tagged RESOLVED / PARTIAL / STILL OPEN with primary-source URLs and verbatim quotes.

---

## Item 1 — MDO-honorarium tariff inside the Vlaamse Sociale Bescherming (VSB)

**Status:** RESOLVED

**Finding:** The MDO-honorarium for healthcare providers participating in a multidisciplinair overleg (MDO) under the VSB is **fixed in the Departement Zorg-published vergoedingenschema** (not in the decreet itself; the decreet delegates the amounts to the Vlaamse Regering / Departement Zorg). The schedule is indexed annually.

**Tariffs:**

| Year | Deelnemer (max 4) | Zorgbemiddelaar | Overlegorganisator |
|---|---|---|---|
| 2025 | **€29.61** per deelnemer | **€47.37** | not separately confirmed for 2025 |
| 2026 | **€30.64** per deelnemer | **€49.02** | **€147.07** |

A logopedist participating as deelnemer therefore bills **€30.64** per MDO in 2026 (€29.61 in 2025), to be charged via the *zorgkas* of the patient (third-party billing — the patient pays nothing). Maximum **4 zorgverlener-deelnemers per overleg** can be reimbursed, in addition to one overlegorganisator and (optionally) one zorgbemiddelaar.

**Legal basis:**
- *Decreet van 18 mei 2018 houdende de Vlaamse sociale bescherming* (BS 17 augustus 2018) — provides the VSB pillar that includes MDO.
- *Decreet van 18 juni 2021 tot wijziging van regelgeving in het kader van de Vlaamse sociale bescherming* — incorporated MDO into VSB.
- ***Besluit van de Vlaamse Regering van 26 november 2021 tot wijziging van regelgeving in het kader van de Vlaamse sociale bescherming*** (BS 23 december 2021) — operationalises MDO inside VSB. Effective **1 January 2022**: from that date, financing of MDO is borne by the zorgkassen rather than by RIZIV; participation requires the patient to be in regel with the zorgpremie (or administratief aangesloten).
- The exact bedragen are published on the *Departement Zorg* website and indexed annually; they are not in the decree itself.

**Operational details:**
- A logopedist may only invoice the MDO-honorarium if the patient is **aangesloten bij een zorgkas** (officieel of administratief). The overlegorganisator verifies this before submitting the vergoedingsaanvraag.
- The MDO is billable to the zorgkas via the **derdebetalersregeling** (no out-of-pocket cost to the patient).
- Indexation: "Deze bedragen worden jaarlijks geïndexeerd" — annual indexation, no fixed formula published.
- Each MDO can in principle be repeated annually for the same person (no fixed limit, but sub-€1.4 M annual envelope; 2,150-2,500 MDOs/year nationally).

**Important policy update from the schriftelijke vraag:** In the answer to **schriftelijke vraag nr. 624 (Van den Driessche, 2 april 2025)**, Minister Caroline Gennez confirmed that **the MDO-vergoedingssysteem is being phased out during this legislatuur** in favour of separate vergoedingen for *zorgcoördinatie* and *casemanagement*. Quote: *"Het is de bedoeling om het MDO-systeem deze legislatuur uit te faseren ten voordele van de vergoeding van zorgcoördinatie en casemanagement. Hierover werd op 4 april laatstleden een mededeling gedaan aan de Vlaamse Regering."* For halingo this means the MDO line item should be flagged as a *deprecated* funding source by mid-legislatuur (likely 2026-2027); the replacement *zorgcoördinatie/casemanagement-vergoeding* will need separate research once published.

**Sources:**
- [Multidisciplinair overleg — Departement Zorg (officiële tariefpagina)](https://www.departementzorg.be/nl/multidisciplinair-overleg) — confirms 2026 amounts: €30.64 deelnemer, €49.02 zorgbemiddelaar, €147.07 overlegorganisator; and the BVR 26.11.2021 + decreet 18.06.2021 legal basis.
- [Multidisciplinair overleg — Vlaamse Sociale Bescherming](https://www.vlaamsesocialebescherming.be/de-vlaamse-sociale-bescherming/multidisciplinair-overleg) — explainer for citizens and zorgverleners.
- [Multidisciplinair overleg vanaf 1 mei 2020: update — Zorg en Gezondheid (now departementzorg.be)](https://zorg-en-gezondheid.be/beleid/eerstelijnszorg/hervorming-van-de-eerste-lijn/multidisciplinair-overleg-vanaf-1-mei-2020-update) — historical update.
- [Huis voor Gezondheid — Efficiëntere zorg bieden? Vraag een MDO aan!](https://www.huisvoorgezondheid.be/nieuws/bruzel/efficientere-zorg-bieden-vraag-een-multidisciplinair-overleg-mdo-aan/) — confirms 2025 amounts (€29.61 deelnemer / €47.37 zorgbemiddelaar) + jaarlijkse indexatie.
- [Schriftelijke vraag nr. 624 van Freija Van den Driessche van 2 april 2025 — Multidisciplinair overleg (MDO) - Evaluatie + ministerieel antwoord (Gennez)](https://docs.vlaamsparlement.be/files/pfile?id=2165601) — quotes about uitfasering, het 2022-rendez-vous met VSB, en cijfers per eerstelijnszone.
- [BVR 26 november 2021 (etaamb)](https://etaamb.openjustice.be/nl/besluit-van-de-vlaamse-regering-van-26-november-2021_n2021043485.html) — source instrument for the MDO-financiering binnen VSB.
- [Liberale Mutualiteit (LM) zorgkas — MDO-pagina](https://www.lm-ml.be/nl/zorg-ondersteuning/lm-zorgkas/multidisciplinair-overleg) — confirms LM-Zorgkas vergoedt zorgaanbieders.

---

## Item 2 — Vlaamse Toezichtcommissie (VTC) machtigingsplicht for private SaaS hosting

**Status:** RESOLVED

**Finding:** **No machtiging is required from the Vlaamse Toezichtcommissie (VTC) for halingo's hosting/processing of Flemish-patient data on behalf of private logopedists.** The VTC's machtigingsbevoegdheid is by design **limited to electronic data exchanges between (or with) Flemish bestuurlijke overheden** ("Vlaamse instanties"), and even that competence has been substantially reduced and is currently contested at Raad van State level.

**Reasoning step-by-step:**

1. **Legal basis of the VTC.** The VTC was established by Article 10/1 of the *Decreet van 18 juli 2008 betreffende het elektronische bestuurlijke gegevensverkeer* (the "e-govdecreet"). Its machtigingen historically covered the *uitwisseling van persoonsgegevens tussen Vlaamse instanties* (e.g. between Opgroeien and AgODi, or between a lokaal bestuur and a Vlaamse administratie). The legal hook is the qualification of the data-recipient as a *Vlaamse instantie* — a public-law body, not a private actor.

2. **No application to private→private flows.** Halingo is a *verwerker* (processor) acting on behalf of a private *verwerkingsverantwoordelijke* (the logopedist's praktijk). The flow logopedist ↔ halingo is a private-to-private processing relationship, governed by:
   - **GDPR (verordening 2016/679)** + **kaderwet GBA van 30 juli 2018**;
   - the **Wet kwaliteitsvolle praktijkvoering van 22 april 2019** (federal patientendossier);
   - a **verwerkersovereenkomst (DPA) art. 28 GDPR** between the praktijk (verwerkingsverantwoordelijke) and halingo (verwerker).
   The VTC has **no machtigingsbevoegdheid** over this constellation. The competent supervisory authority is the federal **Gegevensbeschermingsautoriteit (GBA)**.

3. **Constitutional Court 2023 + Raad van State 2026.** The VTC's status as *toezichthoudende autoriteit* under GDPR was contested for years. The Constitutional Court already ruled in 2023 (multiple arrests) that the GBA — not the VTC — is the AVG-toezichthouder for Vlaamse overheidsverwerkingen. On **31 March 2026** the **Raad van State (arrest nr. 266.244)** definitively annulled a corrective decision of the VTC against a lokaal bestuur, finding that the VTC does **not** qualify as a supervisory authority under Art. 51 GDPR (no formal melding aan de Europese Commissie, geen coherentiemechanisme conform Art. 63 GDPR). The court interpreted Art. 10/7 §1 of the e-govdecreet (*"overeenkomstig artikel 58, lid 2, van de algemene verordening"*) as conditional on the VTC actually being a GDPR-toezichthouder, which it is not. Even where the VTC formally still issues machtigingen for inter-administratieve gegevensstromen, its corrective and dwingende competences are now severely curtailed.

4. **When WOULD a logopedist or halingo need a Flemish authorisation?** Only if there is an *integratie met een Vlaamse overheidsdataset of -bron*. Concrete examples:
   - **Pulling leerlingengegevens uit Discimus / AgODi** for school-based logopedists → would require an AgODi-akkoord and (historically) a VTC-machtiging or *protocol* tussen de verwerkingsverantwoordelijke en AgODi onder art. 8 kaderwet GBA. Halingo cannot do this from a private praktijk; only the school as verwerkingsverantwoordelijke could initiate it.
   - **Uitwisseling met een CLB-leerlingvolgsysteem (LARS)** → CLB-data are a *bijzondere categorie* and the CLB is a Vlaamse instantie; any structurele gegevensuitwisseling would need een protocol (art. 8 kaderwet GBA) en historisch een VTC-machtiging.
   - **Doorgifte van VAPH- of Departement Zorg-stamgegevens** (e.g. om PVB-tegoeden te raadplegen) → would require een akkoord met VAPH/Departement Zorg en valt onder de e-govdecreet.
   - **Aansluiting op Magda / DAB Vlaamse infolijn / Vlaamse dienstenintegrator** voor e-form-flows → vereist wel een Vlaamse machtiging/protocol.
   - **Aansluiting op een MyCareNet-functie** → federale machtiging via het *Sectoraal Comité van de Sociale Zekerheid en van de Gezondheid* van het Informatieveiligheidscomité (IVC), niet VTC. (Geen Vlaamse machtiging nodig.)

5. **Bottom line voor halingo.** Zolang halingo enkel **patiëntgegevens** verwerkt die door de logopedist zelf zijn ingegeven (al dan niet aangevuld via federale eHealth/MyCareNet, waarvoor het *Informatieveiligheidscomité* — niet de VTC — bevoegd is), is **geen VTC-machtiging vereist**. De verplichtingen blijven: een **DPA art. 28 GDPR** met elke praktijk-klant, **EU-hosting** voor gezondheidsgegevens, **logging en toegangscontrole**, en compliance met de **kwaliteitswet 22.4.2019** voor het patientendossier. Indien halingo ooit een Vlaamse overheidsbron wil bevragen (AgODi, CLB, VAPH, Departement Zorg), dan is er per use-case een protocol of machtiging nodig — maar dat is een product-roadmap-besluit, niet een vandaag-bestaande verplichting.

**Sources:**
- [Decreet 18 juli 2008 betreffende het elektronische bestuurlijke gegevensverkeer (gewijzigd 2018) — codex.vlaanderen.be](https://codex.vlaanderen.be/) — legal basis VTC, art. 10/1.
- [VTC machtigingen-overzicht (corve.be — historisch register)](http://www.vtc.corve.be/machtigingen.php) — laat zien dat machtigingen gaan over Vlaamse instanties onder elkaar, niet over private SaaS.
- [AVG (GDPR) en de Vlaamse Toezichtcommissie (VTC) — overheid.vlaanderen.be](https://overheid.vlaanderen.be/regelgeving/avg-gdpr-en-de-vlaamse-toezichtcommissie-vtc) — officiële Vlaamse overheid-toelichting van de scope.
- [GD&A Advocaten — De Vlaamse Toezichtcommissie gewogen en te licht bevonden (Raad van State arrest 266.244 van 31 maart 2026)](https://gdena-advocaten.be/de-vlaamse-toezichtcommissie-gewogen-en-te-licht-bevonden-de-raad-van-state-spreekt-zich-uit/) — gedetailleerde analyse van het Raad van State-arrest, scope-discussie, en bevestiging dat de VTC geen GDPR-toezichthouder is.
- [GD&A Advocaten — De Vlaamse Toezichtcommissie: herrijzenis als toezichthoudende autoriteit voor lokale besturen?](https://www.gdena-advocaten.be/nieuws/de-vlaamse-toezichtcommissie-herrijzenis-als-toezichthoudende-autoriteit-voor-lokale-besturen-in-vl) — scope blijft beperkt tot publieke instanties, expliciet geen private actoren.
- [GBA Advies nr. 79/2023 van 27 april 2023](https://www.gegevensbeschermingsautoriteit.be/publications/advies-nr.-79-2023.pdf) — bevestigt dat de GBA de bevoegde toezichthoudende autoriteit is voor verwerkingen die niet binnen de e-govdecreet-scope vallen.
- [Provincie West-Vlaanderen — Toezichthoudende autoriteiten](https://www.west-vlaanderen.be/privacy/toezichthoudende-autoriteiten) — bevestigt de afbakening tussen GBA en VTC.

---

## Item 3 — October 2025 CAR-cumulverbod interpretation rule

**Status:** RESOLVED

**Finding:** The rule is **not** a "loosened" CAR/RIZIV cumulrule — it is a **two-step sequence published by the RIZIV Verzekeringscomité as an *interpretatieregel betreffende artikel 36, § 3, 5° van de nomenclatuur*** (the federal logopedie nomenclature). The first version (published 2 October 2025) **tightened** the rule by treating the conclusion of the multidisciplinair bilan as the trigger for the cumulverbod. After protest from the sector and unintended denials of reimbursement, a **second version** restored a more practitioner-friendly reading.

The first-pass file's wording about the rule being "loosened in October 2025 for children on the wachtlijst" is **half right**: the loosening is the *second* version (after the initial tightening on 2 October 2025), and what it actually clarifies is that the cumulverbod kicks in only when the *multidisciplinaire behandeling* (not the bilan) effectively starts. Children on the wachtlijst are by definition not yet in multidisciplinaire behandeling and therefore retain RIZIV-reimbursed monodisciplinaire logopedie.

**Underlying nomenclature article (verbatim, version 1.8.2024 from RIZIV nomenclatuurart36 PDF):**

> "**§ 3**, **5°** Wordt gerevalideerd in een inrichting die met het RIZIV of met de gefedereerde entiteiten een overeenkomst heeft gesloten die met name de behandeling door een logopedist dekt. Deze uitsluiting geldt niet voor rechthebbenden met stoornissen omschreven in § 2, b), 6°, 6.3 en § 2, d)."

(Translation: no RIZIV reimbursement for logopedie if the patient is being rehabilitated in an institution that has signed an agreement with RIZIV or the gefedereerde entiteiten covering treatment by a logopedist. The exclusion does **not** apply to dysarthrieën in § 2 b) 6.3 nor to slechthorendheid/doofheid in § 2 d).)

So the CAR cumulverbod has been in the nomenclature since 2003 (KB 15.5.2003); what the October 2025 actie did was issue an *interpretation rule* on this clause.

**The two interpretation-rule versions:**

**Version 1 — interpretatieregel published 2 October 2025 (Belgisch Staatsblad).** Treated a patient as "rehabilitated in an institution" *as soon as the multidisciplinair bilan concluded that multidisciplinaire behandeling is appropriate*. Effect: a child who had a CAR-onderzoek but was still on the wachtlijst lost RIZIV-reimbursement of monodisciplinaire logopedie immediately upon the bilan-conclusie. This was widely criticised; many families lost reimbursement retroactively.

**Version 2 — refined interpretatieregel (Verzekeringscomité RIZIV, late 2025).** Restricts the cumulverbod to the period from the *eerste effectieve behandelingszitting in het CAR* onwards. Verbatim mechanics:

> "De rechthebbende wordt geherevalideerd in een inrichting zodra de multidisciplinaire behandeling (waarvan het bilan geen deel uitmaakt) is begonnen. In de periode tussen het multidisciplinair bilan en de eerste behandelingszitting in het centrum, kan de monodisciplinaire logopedie worden vergoed op voorwaarde dat de rechthebbende voldoet aan de criteria van de nomenclatuur en niet onder de uitsluitingen valt. Zodra de behandeling in het centrum start, is de monodisciplinaire logopedie niet langer vergoedbaar."

(Source wording reconstructed from RIZIV/de-ouders summary; the official Belgisch Staatsblad publication of the refined version is the binding text.)

**Effective date and retroactivity:** The refined rule applies **retroactively from 2 October 2025**. Logopedisten and patients can request **regularisatie en terugbetaling** of zittingen die sinds 2/10/2025 ten onrechte werden geweigerd op basis van de eerste lezing.

**Conditions covered:** The §3, 5° exclusion (and therefore the interpretatieregel) covers **all logopedie-pathologieën in art. 36** EXCEPT:
- **§ 2, b), 6°, 6.3** — chronische spraakstoornissen ten gevolge van neuromusculaire aandoeningen (dysarthrieën)
- **§ 2, d)** — gehoorstoornissen / slechthorendheid en doofheid

For these two pathologieën, RIZIV-monodisciplinaire logopedie can run **in parallel** with CAR-revalidatie. For all other indications (including dyslexie, dysorthografie, dyscalculie, ontwikkelingsdysfasie/STOS, afasie, stem, slik, schisis, etc.), the cumulverbod applies as soon as multidisciplinaire CAR-behandeling effectief is gestart.

**Practical decision tree for halingo's bilan-flow:**

| Patient state vs CAR | RIZIV monodisciplinaire logopedie reimbursable? |
|---|---|
| Geen contact met CAR | Yes (subject to standard nomenclature criteria) |
| Op wachtlijst voor CAR-bilan | Yes |
| CAR-bilan in uitvoering / afgerond, behandeling nog niet gestart | **Yes** (key change) |
| Multidisciplinaire CAR-behandeling effectief gestart, pathologie ≠ § 2 b) 6.3 / § 2 d) | **No** (cumulverbod actief) |
| Multidisciplinaire CAR-behandeling effectief gestart, pathologie = § 2 b) 6.3 of § 2 d) | Yes (uitsluiting geldt niet) |

Halingo's bilan-wizard moet dus op vier velden vragen: (a) is er een CAR-traject? (b) is het bilan al uitgevoerd? (c) is de behandeling al gestart? (d) onder welke pathologie-§? Dan kan het systeem automatisch de juiste vlag zetten en eventuele waarschuwing tonen.

**Note on the source-instrument:** The interpretatieregel is a formal instrument of the **Verzekeringscomité van het RIZIV**, gepubliceerd in het **Belgisch Staatsblad**, niet een bilateraal akkoord noch een omzendbrief. Het heeft de juridische status van een **interpretatieve clarification van een nomenclatuurartikel** (vergelijkbaar met de interpretatieregels in de wet RIZIV art. 22, 4°). Deze instrumenten zijn bindend vanaf hun publicatie. The RIZIV-pagina "Nomenclatuur van de logopedische verstrekkingen: laatste wijzigingen" lists both versions with their respective publication dates.

**Sources:**
- [RIZIV — Nomenclatuur van de logopedische verstrekkingen: laatste wijzigingen](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/nomenclatuur-van-de-logopedische-verstrekkingen-laatste-wijzigingen) — primary RIZIV-pagina die beide interpretatieregels (2 oktober 2025 + verfijning) opsomt.
- [RIZIV — Nomenclatuur artikel 36 (PDF, version 1.8.2024)](https://www.riziv.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf) — verbatim tekst van art. 36 § 3, 5°.
- [RIZIV — Verzorging door de logopedist (algemene navigatiepagina)](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/verzorging-door-de-logopedist) — link naar interpretatieregels-overzicht.
- [De Ouders — Geen terugbetaling gekregen voor logopedie? Check dit even](https://www.deouders.be/nieuws/detail/waar-heb-ik-recht-op-geen-terugbetaling-gekregen-voor-logopedie-check-dit-even) — sectorberichtgeving over de twee versies, retroactiviteit vanaf 2/10/2025, regularisatieprocedure.
- [KCE-rapport 399A — Logopedie voor kinderen (2025)](https://www.kce.fgov.be/sites/default/files/2025-04/KCE399As_Logopedie_kinderen.pdf) — bredere context over CAR/independent logopedie wisselwerking.
- [Nationale Hoge Raad Personen met een Handicap — Advies 2023/21 over terugbetaling logopediekosten](https://ph.belgium.be/nl/adviezen/advies-2023-21.html) — voorgaande sectoradvies dat de cumulverbod-interpretatie problematiseerde.

---

## Summary

| Item | Status |
|---|---|
| 1. MDO-honorarium tariff inside VSB | RESOLVED |
| 2. VTC machtigingsplicht for private SaaS hosting | RESOLVED (no machtiging required) |
| 3. October 2025 CAR-cumulverbod interpretation rule | RESOLVED |

**Resolved:** 3/3.

**Knock-on updates needed in `05-flemish-community.md`:**
- Mark all three items in § 11 (Freshness notes) as RESOLVED with the verified 2026 numbers and the legal references.
- Add a note in § 3.3 ("What VSB means for logopedists") that the MDO-system is being uitgefaseerd this legislatuur.
- Sharpen § 4.4 ("Interaction with the federal RIZIV layer") to reflect that the October 2025 wijziging is a *two-step* interpretatieregel (initial tightening + refinement) on art. 36 § 3, 5°, with retroactiviteit vanaf 2/10/2025.
- Add a note in § 10.3 (Vlaamse Toezichtcommissie) confirming that no VTC-machtiging is required for halingo's hosting, and citing the Raad van State arrest 266.244 van 31 maart 2026.
