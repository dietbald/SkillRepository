# 05 — Flemish Community: Regional Rules and Support Systems Affecting Logopedists

> Last verified: 2026-04-06
> Scope: Flemish-community-level regulations and funding streams that sit alongside federal RIZIV rules. This document does not re-cover the federal nomenclature (see `01-riziv-nomenclature-and-tariffs.md`); it covers the Flemish layer that a logopedist working in Flanders or Dutch-speaking Brussels must understand for compliance, billing routing, and feature design in halingo.

---

## 1. Introduction — federal vs community layering for logopedic care

Belgian logopedic care is governed by two parallel legal orders:

- **Federal layer (RIZIV/INAMI).** Health insurance, professional recognition (visa, erkenning), and the logopedie nomenclature live here. A self-employed logopedist who is RIZIV-conventioneerd or non-conventioneerd bills sessions via the patient's ziekenfonds under the K-codes of the nomenclature. This is the dominant funding path for ambulatory care of typical pathologies (dyslexia, dyscalculie, ontwikkelingsdysfasie, stem-, slik- en afasiezorg, etc.).

- **Community layer (Flemish, French, German).** Disability support (handicap), prevention, family policy, education, elderly care, mobility aids, and ambulatory rehabilitation centres are *gemeenschapsmaterie* since the Sixth State Reform. For logopedists practising in the Flemish Community (Flanders + Dutch-language institutions in Brussels), this layer is operated by:
  - **VAPH** — Vlaams Agentschap voor Personen met een Handicap
  - **Departement Zorg** (formerly Zorg en Gezondheid) — including the **Vlaamse Sociale Bescherming** (VSB) and recognition of CAR centres
  - **Opgroeien** (formerly Kind en Gezin) — preventive care for 0-3-year-olds and the intersectorale toegangspoort (ITP) for non-directly accessible youth care
  - **Departement Onderwijs / AgODi** and the **CLB** network — school-based care, leersteun, special education
  - **VLAIO** — economic incentives for self-employed practitioners

**Why layering matters for halingo's billing engine.** The same logopedist may treat:
1. A child whose sessions are RIZIV-reimbursed via the ziekenfonds (K30 individual sessions, bilan via K15) — invoice path 1: eAttest/eFact via MyCareNet.
2. The same child enrolled in a Centrum voor Ambulante Revalidatie (CAR) — sessions billed by the centre to RIZIV; the independent logopedist cannot also bill the same days. **Strict cumulverbod** applies (see § 6).
3. A child in *buitengewoon onderwijs* — RIZIV reimbursement is **excluded** by the nomenclature for the duration of enrolment in BuO; care is provided in-school by school-employed logopedists or in a CAR.
4. An adult with a *persoonsvolgend budget* (PVB) buying logopedische begeleiding from a vergunde zorgaanbieder — paid in voucher or cash from the PVB; no RIZIV billing.
5. A patient who is *zwaar zorgbehoevend* receiving the monthly zorgbudget from their zorgkas — this is a flat lump-sum and does not interfere with RIZIV billing for individual logopedie.

The product team needs to know the funding source per dossier so the eAttest/eFact path, the third-party-payer flag, and the cumul-checks route correctly. This document maps the Flemish funding sources behind paths 2-5.

---

## 2. VAPH and person-following budgets

### 2.1 What VAPH is

The **Vlaams Agentschap voor Personen met een Handicap** is the agency of the Vlaamse Gemeenschap that finances and organises specialised disability support — both for minors and adults — that falls outside the federal health insurance scope. Its core mandate flows from the *decreet van 7 mei 2004 houdende oprichting van het intern verzelfstandigd agentschap met rechtspersoonlijkheid Vlaams Agentschap voor Personen met een Handicap* and was reshaped by the *decreet persoonsvolgende financiering* of 25 April 2014, which introduced the cash-budget model.

VAPH is funded through the Flemish budget. It does **not** have its own contribution flow comparable to the zorgpremie of the VSB (the two systems are legally distinct, even if both fall under the Flemish welfare ministry). VAPH-funded support is by definition *not-rechtstreeks toegankelijke zorg* (not-directly-accessible care, NRTH) when it concerns the major budgets, but VAPH also operates a parallel low-threshold envelope called *rechtstreeks toegankelijke hulp* (RTH).

### 2.2 The two main budgets

**Persoonlijke-assistentiebudget (PAB) — for minors**
- Cash budget for the parents of a minor with a (suspected) handicap to organise assistance at home and at school.
- Granted up to and including age 21, after which the holder transitions to the PVB.
- Five budget categories with internal "budget brackets" that adjust the base amount up or down depending on aggravating or mitigating factors (for example, comorbid sensory loss or severe behavioural problems).
- 2026 indexed range: roughly €12,873 to €60,077 per year (the bands are adjusted annually with the consumer price index).
- Application is filed via a VAPH-recognised **multidisciplinary team (MDT)** which prepares the *A-document* and submits it to the **intersectorale toegangspoort (ITP)** — the single intake gate for non-directly-accessible youth care, hosted by the agency Opgroeien.
- Once approved by the ITP, VAPH manages disbursement.

**Persoonsvolgend budget (PVB) — for adults**
- Cash and/or voucher budget for adults (18+) with a recognised handicap, allowing them to purchase woon-, dag- en individuele ondersteuning.
- 24 budget categories for applications submitted on or after 17 March 2020 (12 categories for older grandfathered files).
- The category corresponds to a number of *zorggebonden personeelspunten*; one point is worth roughly €1,059 in 2026 (the value is indexed annually). Maximum yearly budgets in 2026 range from approximately €8,200 (cat. 1) to €109,400 (cat. 24).
- Free expendable portion (*vrij besteedbaar deel*): €1,800/year for budgets up to 34.81 points or €3,600/year for budgets ≥ 34.81 points. This portion can be spent without justification.
- Costs are reported to VAPH by **1 April of the year following the budget year** (e.g. 2025 costs by 1 April 2026). Halingo should flag this calendar deadline if it ever stores PVB-funded sessions.
- Legal basis: *Besluit van de Vlaamse Regering van 27 november 2015* on the procedure, *BVR 24 juni 2016 houdende het vergunnen van aanbieders van niet-rechtstreeks toegankelijke zorg en ondersteuning* on licensing, and *BVR 30 november 2018 houdende de Vlaamse sociale bescherming* (for the elderly-care interface), all amended several times — most recently in February 2024 (definitive approval 23 February 2024, in force 1 March 2024).

### 2.3 Spending modalities — voucher vs cash vs combination

A PVB-holder must, after grant decision, draw up an *individuele dienstverleningsovereenkomst (IDO)* with each provider they engage. They can pay:

- **In voucher** — the price is expressed in *zorgpunten*. The provider invoices VAPH directly; the budget-holder receives no invoice. This path is reserved for **vergunde zorgaanbieders (VZA)** — providers licensed by VAPH.
- **In cash** — the price is in euro. The provider sends a monthly invoice to the budget-holder, who pays it from their own dedicated PVB account and submits the cost to VAPH for accounting.
- **Combination** of both.
- For cash spent on **non-VAPH-licensed** assistance (an individual mantelzorger, a thuiszorgdienst, household help…), the budget-holder receives an extra **11.94 %** on top of the budget as administrative compensation.

### 2.4 Where logopedists fit in — VZA, MDT, RTH

Three distinct roles a logopedist can play in the VAPH world:

1. **Vergunde zorgaanbieder (VZA).** A VZA is licensed by VAPH to provide non-directly-accessible support — woonondersteuning, dagondersteuning, individuele psychosociale begeleiding, individuele praktische hulp, ondersteund werken, oproepbare permanentie. The legal framework is the *BVR van 24 juni 2016 houdende het vergunnen van aanbieders van niet-rechtstreeks toegankelijke zorg en ondersteuning voor personen met een handicap*. In practice, **independent solo logopedists rarely become VZA**: the licensing standards (governance, kwaliteitssysteem cf. the *BVR kwaliteit van 4 februari 2011*, financial reporting, organisational structure) are calibrated to organisations, not single-handed practices. Logopedists are more commonly **employed by an existing VZA** (e.g. an MFC, a VZA active in autism support) or contracted as a freelancer paid out of the PVB-holder's cash portion (which does **not** require VZA status — the holder is free to engage any qualified self-employed therapist).
2. **Member of a multidisciplinair team (MDT).** An MDT is a service recognised by VAPH to assist persons with (a presumption of) handicap in submitting an application for VAPH support — preparing the multidisciplinary verslag, the A-document, the indicatiestelling. There are roughly fifty MDTs per province. The legal basis is the *BVR van 24 juli 1991*, repeatedly amended. Logopedists frequently sit on MDTs alongside artsen, psychologen, kinesitherapeuten, and ergotherapeuten — particularly for files concerning hearing loss, ontwikkelingsdysfasie/STOS, afasie, or slikstoornissen. Membership requires the team itself to be recognised, not the individual logopedist.
3. **Aanbieder van rechtstreeks toegankelijke hulp (RTH).** RTH is low-threshold, handicap-specific support (begeleiding, dagopvang, verblijf) that does **not** require an ITP/VAPH application. The user can spend up to **8 RTH-points per calendar year** at a recognised RTH-aanbieder. Recognition conditions for RTH-aanbieders are lighter than the VZA framework but still organisation-level. Logopedists working in RTH typically do so as employees of an RTH-organisation; an independent praktijk does not normally become an RTH-aanbieder on its own. RTH-aanbod is published on the *Zorgwijs* platform.

### 2.5 Funding flow — what comes from VAPH vs what stays with RIZIV

Practical decision rule for halingo's billing logic:

- **Pure logopedische therapy for an ambulatory pathology in the federal nomenclature** → RIZIV reimbursement remains the default. VAPH does not duplicate this.
- **Logopedische begeleiding embedded in a broader handicap-specific support package** (for example, communication training for a young adult with Downsyndroom living in a VZA, or speech rehabilitation in an MFC) → paid out of the PVB (as voucher/cash) or out of the dagprijs the VZA receives.
- **A child receiving services in an MFC or in a VZA-context** → care is part of the institutional package; the independent logopedist does not bill RIZIV for the same care.

The product team must therefore allow a dossier to be flagged with a *funding source* dimension: `riziv | vaph_pvb_voucher | vaph_pvb_cash | vaph_pab | vaph_rth | car_riziv | school | private`.

### 2.6 Documentation that follows a VAPH dossier

For an application:
- *A-document* (registration document)
- *Multidisciplinair verslag* (MDV)
- *Ondersteuningsplan persoonsvolgend budget* (OP-PVB)
- *Module D, P, Q* depending on the support requested
- *Inschalingsverslag zorgzwaarte* if the budget category needs objectification

For the budget-holder during use:
- *Individuele dienstverleningsovereenkomst* with each provider
- For cash: monthly invoices and proof of payment
- For voucher: the provider's voucher-claim is enough

Halingo, if it ever supports PVB workflows, will need to model the IDO and the cost-justification submission. The deadline of **1 April N+1** for cost reporting is hard-coded in the regulation.

---

## 3. Vlaamse Sociale Bescherming and zorgkassen

### 3.1 Legal basis and scope

The **Vlaamse Sociale Bescherming (VSB)** is the Flemish complement to federal social security. Its current legal frame is the **Decreet van 18 mei 2018 houdende de Vlaamse sociale bescherming** (*BS* 17 augustus 2018), executed by the *BVR van 30 november 2018*. The decree restructured several pre-existing schemes (notably the old *Vlaamse zorgverzekering* of 1999 and the *tegemoetkoming hulp aan bejaarden*) and added the residential elderly-care financing transferred under the Sixth State Reform.

The VSB consists of several "pillars":
1. **Zorgbudget voor zwaar zorgbehoevenden** (formerly Vlaamse zorgverzekering) — €140/month flat (2025) for people with a high level of need for care, regardless of age, established by a recognised indicatiestelling (BEL-profielschaal, KATZ, etc.).
2. **Zorgbudget voor ouderen met een zorgnood** (formerly THAB) — for 65+ with a low income and care need; up to €739/month (2025) in the highest category.
3. **Zorgbudget voor mensen met een handicap** (the *basisondersteuningsbudget*, BOB) — €330/month flat for adults and minors with a recognised handicap awaiting more intensive VAPH support.
4. **Mobiliteitshulpmiddelen** — wheelchairs, rollators, scooters.
5. **Residentiële ouderenzorg** — woonzorgcentra, centra voor kortverblijf, dagverzorgingscentra.
6. **Multidisciplinair overleg (MDO)** for chronic-care patients in the eerstelijnszones.
7. **Overeenkomsten met revalidatieziekenhuizen, herstelverblijven, psychiatrische verzorgingstehuizen, beschut wonen** and palliatieve teams (transferred RIZIV competences).
8. **Geriatrische dagziekenhuizen** etc.

VSB is funded by:
- **Zorgpremie** — annual contribution from every resident of the Flemish Region aged 26+, plus voluntary residents of the Brussels-Hoofdstedelijk Gewest. The premie was **€64** in 2025 (€32 with verhoogde tegemoetkoming) and was raised to **€100** (€35 with VT) starting 2026 by the Flemish Government decision of September 2025.
- **Dotation from the Flemish budget** — over €2 billion supplementing the premies, mostly for elderly-care personnel costs. Total VSB envelope is approximately €3.9 billion.

### 3.2 Role of the zorgkassen

A *zorgkas* is the operational counterparty that collects the premie and disburses the zorgbudgetten. Every resident of the Flemish Region must be affiliated with a zorgkas. There are **six** zorgkassen:
- Five mutualistic zorgkassen (one per landsbond: Christelijke Mutualiteiten, Socialistische Mutualiteiten, Liberale Mutualiteiten, Onafhankelijke Ziekenfondsen, Neutrale Ziekenfondsen).
- The **Vlaamse Zorgkas** (the public default, run by the Flemish Government for residents not affiliated with a mutualistic zorgkas).

The zorgkas is the **single window** for all VSB pillars: it informs the citizen, collects the premie, processes the application, monitors the dossier, evaluates conditions, decides on the right and pays out — operating in line with the 2018 decreet and its uitvoeringsbesluit. Zorgkassen sit *next to* (not inside) the federal mutualiteit: a citizen pays both the federal contribution (RSZ-employee or RSVZ-self-employed) and the Flemish zorgpremie.

### 3.3 What VSB means for logopedists

Direct interaction is **limited**. The VSB does *not* reimburse individual logopedische sessions — that remains a RIZIV nomenclature matter. However:

- A patient receiving the **zorgbudget zwaar zorgbehoevenden** is entitled to it on top of any RIZIV reimbursement. There is no offset against logopedie sessions. Halingo should not interpret receipt of a zorgbudget as affecting the third-party-payer status for K-code billing.
- A logopedist working in a **woonzorgcentrum (WZC)** providing slik- and stemtherapie to residents enters the VSB indirectly: the WZC is financed via the VSB envelope for residentiële ouderenzorg, and the logopedist is either paid by the WZC out of that envelope or bills RIZIV directly per session, depending on the contractual model.
- Logopedists participating in a **multidisciplinair overleg (MDO)** for a chronic patient in their eerstelijnszone can receive an MDO-honorarium from the VSB. In **2026** the deelnemer-vergoeding is **€30,64** (€29,61 in 2025); the *zorgbemiddelaar* receives **€49,02** (2026) and the *overlegorganisator* **€147,07** (2026). Maximum 4 deelnemende zorgverleners per overleg. Financiering loopt sinds 1 januari 2022 via de zorgkassen onder het VSB-kader (BVR 26.11.2021, decreet 18.06.2021, decreet VSB 18.05.2018). De bedragen worden jaarlijks geïndexeerd. **Belangrijk:** Minister Gennez heeft in haar antwoord op SV nr. 624 (2 april 2025) aangekondigd dat het MDO-systeem deze legislatuur wordt **uitgefaseerd** ten voordele van afzonderlijke vergoedingen voor zorgcoördinatie en casemanagement. De MDO-feature in halingo moet dus als *deprecated/transitioneel* worden ontworpen.
- The VSB also funds the *revalidatieziekenhuizen* and the *centra voor ambulante revalidatie* infrastructure that previously fell under RIZIV — see § 6 on the CAR.

### 3.4 Walloon and Brussels equivalents (brief)

For comparison only — halingo will need a separate dossier per region if it ever crosses the language border:

- **AVIQ** (Agence pour une Vie de Qualité, Walloon Region) is the rough analogue of VAPH + Departement Zorg, plus federal competences transferred to Wallonia. AVIQ runs *budgets d'assistance personnelle* and *services d'aide aux familles*.
- **Iriscare** in the Brussels-Hoofdstedelijk Gewest covers the bicommunal competences (mainly elderly care, family allowances, and persons with a handicap who do not opt into VAPH or AVIQ via the territorial criterion).
- **Phare** (Personne handicapée Autonomie recherchée) is the Cocof body for francophone Brussels residents with a handicap.
- **DSL** / Dienststelle für Selbstbestimmtes Leben for the German-speaking Community.

A halingo praktijk located in Brussels needs to know which agency a patient is affiliated with — VAPH, Phare, Iriscare or AVIQ — because the funding flows are not interoperable.

---

## 4. Education: from GON/ION to the Leersteundecreet

### 4.1 Historical layers

Three regimes coexisted in Flemish education for pupils with specific needs before 2023:
- **GON** — geïntegreerd onderwijs, in place since the 1980s. A pupil enrolled in mainstream education with a *gemotiveerd verslag* (later *verslag*) could receive support from a *GON-begeleider* who was technically employed by a buitengewoon-onderwijs school.
- **ION** — inclusief onderwijs, a small extension of GON for pupils with a verstandelijke beperking. ION was phased out from 2017-2018 and folded into the M-decreet support model.
- **M-decreet** — *decreet maatregelen voor leerlingen met specifieke onderwijsbehoeften* of 21 March 2014. It introduced *redelijke aanpassingen*, the *verslag*-trajectories (gemeenschappelijk vs individueel aangepast curriculum, GC/IAC), and the *ondersteuningsnetwerken* in 2017. The M-decreet was widely criticised by teachers and special-education staff alike.

### 4.2 The Leersteundecreet (2023)

The **Decreet leersteun** was approved by the Vlaams Parlement on 3 May 2023 and bekrachtigd by the Vlaamse Regering on 5 May 2023. It entered into force on **1 September 2023**, replacing the M-decreet and definitively abolishing GON and ION as labels.

The decree creates **leersteuncentra**: standalone organisations that bundle the expertise previously dispersed across BuO-schools and ondersteuningsnetwerken, and that contract with mainstream schools. Maximum **40 generic leersteuncentra** plus **4 specifieke leersteuncentra** (one each for type 4 motorisch, type 6 visueel, type 7 auditief, and a fourth for STOS — *spraak- en taalontwikkelingsstoornis*) are set up. A mainstream school is **free** to choose which leersteuncentrum it works with, regardless of the historical net-affiliation. Each leersteuncentrum has an information point for schools and parents.

**Pupils covered.** Support is anchored to a *verslag*:
- **GC-verslag** — gemeenschappelijk curriculum (aanpassingen needed but the pupil follows the standard curriculum).
- **IAC-verslag** — individueel aangepast curriculum.
- **OV4-verslag** — opleidingsvorm 4 (secundair).
- Pupils with old *gemotiveerd verslag* keep their support rights until expiry.

**Leerondersteuners.** The decree gives the previously precarious GON-begeleider a formal job profile *leerondersteuner*: own statutory positie, possibility of vaste benoeming, bachelor- or master-niveau wedde at the discretion of the centrum, 36-hour werkweek defined by regulation. Leerondersteuners must hold expertise in (i) onderwijs, (ii) handicap-specifiek, (iii) inclusie, and (iv) coaching.

**Funding.** Two regimes:
- **Open-end financiering** for IAC- and OV4-trajectories in types 2, 4, 6, 7 — these receive funding equal to the equivalent special-education rate.
- **Enveloppefinanciering** for GC, IAC/OV4 basisaanbod and types 3 and 9 — a weighted lump sum based on the count of GC-verslagen.

### 4.3 Where the logopedist fits

Two distinct configurations:

**(a) Logopedist as leerondersteuner.** A leersteuncentrum can hire a logopedist as a leerondersteuner, especially in the specifiek leersteuncentrum type 7 (STOS / auditieve handicap), but also in generic centra for cases where speech-language coaching is the dominant need. The logopedist is then a salaried employee of the leersteuncentrum (paid out of the onderwijsdotatie), works in mainstream classrooms, and **does not bill RIZIV** for that work.

**(b) External logopedist parallel to school-based support.** A child can have:
- A leersteuncentrum-trajectory at school (paid by Onderwijs Vlaanderen)
- AND ambulatory logopedie at an independent praktijk reimbursed by RIZIV
*provided* the latter respects the federal cumul rules with CAR and BuO. The Leersteundecreet itself does not introduce a federal cumulverbod, but the **federal logopedie nomenclature** excludes RIZIV reimbursement when the same care is being delivered in a CAR or in BuO. The Leersteundecreet route is *neutral* in this respect — a child in mainstream education with a verslag can keep RIZIV ambulatory logopedie running.

**(c) Schools directly contracting logopedists?** Mainstream schools cannot themselves "buy logopedie sessions" with onderwijs-budgetten, except via the leersteuncentrum payroll. A mainstream school cannot bill the parents for logopedie. The exception is the *werkingsmiddelen* of buitengewoon onderwijs, where the school itself employs a paramedisch personeelsomkadering — see § 5.

**Practical billing rule for halingo.** If a logopedist is paid as a leerondersteuner via the leersteuncentrum, the sessions are part of an arbeidsovereenkomst with the centrum and have **no RIZIV side**. If the same logopedist also runs a private praktijk for other patients, the two streams must be kept separate in the praktijk software (different funding source, different invoicing logic).

### 4.4 Interaction with the federal RIZIV layer — the no-double-dip rule

The federal logopedie nomenclature contains a *cumulverbod*:

- A pupil in **buitengewoon onderwijs** (any type) is **excluded** from RIZIV reimbursement of logopedie sessions for the duration of enrolment. (See the federal nomenclatuurregels and the verzekeringscomité bilateral agreements.)
- A child being treated in a **CAR (Centrum voor Ambulante Revalidatie)** that has actually started treatment cannot, for the same indication, also receive RIZIV-reimbursed independent logopedie. The Verzekeringscomité van het RIZIV published an *interpretatieregel* on art. 36 § 3, 5° in the **Belgisch Staatsblad on 2 October 2025** that *initially tightened* the cumulverbod (treating the conclusion of the multidisciplinair CAR-bilan as the trigger), and then **refined** it in a second version: the cumulverbod now only takes effect once the **multidisciplinaire behandeling** in the CAR is **effectively started**. A child still on the CAR-wachtlijst, or in the period between bilan and first treatment session, can keep RIZIV-reimbursed independent logopedie running. The refinement is **retroactively applicable from 2 October 2025** — sessions that were wrongly denied between 2/10/2025 and the refinement can be regularised via the ziekenfonds. The exclusion in § 3, 5° does **not** apply to dysarthrieën (§ 2 b) 6.3) or to gehoorstoornissen (§ 2 d), which keep their right to parallel monodisciplinaire RIZIV-logopedie alongside CAR-revalidatie. See `verification-2026-04/05-flanders.md` item 3 for the verbatim wording and primary sources.
- Mainstream-education leersteun does **not** trigger the cumulverbod by itself.

Halingo's bilan workflow should ask the question: *Is the patient currently in BuO? In a CAR-traject? On a CAR wachtlijst?* and surface a warning when ticking yes against the wrong combination. The Nationale Hoge Raad voor Personen met een Handicap raised this exact issue in *Advies 2023/21*.

---

## 5. Buitengewoon onderwijs and school-based logopedic care

### 5.1 The types

Flemish *buitengewoon basisonderwijs* organises pupils into eight types:
- **Type basisaanbod** — for pupils whose needs cannot be met in mainstream education even with redelijke aanpassingen, with no specific diagnosis or IQ criterion. Replaces the old types 1 and 8 since the M-decreet. Not present in BuKO (kleuter).
- **Type 2** — pupils with a verstandelijke handicap (matig, ernstig of diep).
- **Type 3** — pupils with ernstige emotionele en/of gedragsproblemen.
- **Type 4** — pupils with a motorische handicap.
- **Type 5** — pupils opgenomen in een ziekenhuis or preventorium (school in a hospital).
- **Type 6** — pupils with a visuele handicap.
- **Type 7** — pupils with an auditieve handicap **of** a *spraak-/taalontwikkelingsstoornis* (STOS). Diagnosis requires a multidisciplinair team including at least *een logopedist, een audioloog en een NKO-arts*. Communicatie staat centraal; liplezen, auditieve training, gebarentaal, sociale interactie.
- **Type 9** — pupils with autismespectrumstoornis with normal cognitive functioning.

In *buitengewoon secundair onderwijs* the same types are used in combination with **opleidingsvormen** OV1 to OV4.

### 5.2 Logopedische omkadering inside BuO

BuO-scholen receive a *paramedische, sociale, psychologische en orthopedagogische omkadering* on top of the lestijdenpakket. This is established in the *Decreet basisonderwijs van 25 februari 1997* and the executieve besluiten on personeelsformatie van het buitengewoon onderwijs (notably the *BVR omkaderingsnormen buitengewoon basisonderwijs* and its amendments). The omkadering is calculated per type and per leerlingenaantal.

A BuO-school therefore typically employs **logopedisten as paramedisch personeel**, salaried by the school onder de Vlaamse onderwijsregeling, with a Vlaams onderwijsstatuut and access to vaste benoeming. The logopedist works inside the school, treats pupils as part of the school day, and the *cumulverbod* with RIZIV applies for those sessions (no double-billing).

### 5.3 Funding flow

Three sources flowing through the school:
- **Werkingsmiddelen + omkaderingsmiddelen** from Onderwijs Vlaanderen (the dominant source).
- **Subsidies for specific modules** — e.g. extra middelen voor STOS-werking in type 7 scholen.
- **No RIZIV stream** — sessions delivered to enrolled pupils are excluded from RIZIV reimbursement.

CAR-care and BuO-care can run **in parallel** for the same child only when they treat distinct domains; the cumulverbod is read strictly. Most BuO-children are simply not eligible for separate RIZIV-reimbursed logopedie outside the school.

### 5.4 How this affects halingo's data model

For a praktijk software targeted at BuO-employed logopedists, the relevant features look very different from the ambulatory praktijk:
- No invoicing-to-mutualiteit module (the salary is paid by the school).
- A handelingsplan-gerelateerd dossier model (multidisciplinair klassenraadbeleid).
- Integration with the school's leerlingvolgsysteem (Discimus, Smartschool, LARS, etc.) rather than with MyCareNet.

Most halingo customers will be ambulatory praktijken; BuO-employed logopedists are on a payroll and rarely buy SaaS subscriptions personally. The product team should however be aware of mixed cases where a self-employed logopedist also does a few hours/week in a BuO-school as werknemer.

---

## 6. CLB and referral flows

### 6.1 Mandate

The **Centra voor Leerlingenbegeleiding** are the school-care backbone established by the *Decreet betreffende de centra voor leerlingenbegeleiding van 1 december 1998* and substantially updated by the *Decreet leerlingenbegeleiding van 27 april 2018* in basis-, secundair en deeltijds beroepssecundair onderwijs. CLBs are funded through Onderwijs Vlaanderen and run on a network basis: the *Vrij CLB Netwerk* (vrij gesubsidieerd), the *GO! CLBs* (gemeenschapsonderwijs), and the OVSG/POV CLBs (officieel gesubsidieerd).

CLBs work in **four domains**:
1. Leren en studeren
2. Onderwijsloopbaan
3. Psychisch en sociaal functioneren
4. Preventieve gezondheidszorg (taking over the medical schoolarts function)

### 6.2 Functions

- **Onthaal** of leerlingen, ouders en school
- **Vraagverheldering** and **handelingsgerichte diagnostiek**
- **Kortdurende begeleiding** of leerlingen
- **Draaischijffunctie** (signposting to external partners)
- **Signaalfunctie** to schools about systemic problems
- **Consultatieve leerlingenbegeleiding** to teachers and directies
- **Verplichte leerlingenbegeleiding** (three exceptions): systematische medische contacten en preventieve gezondheidsmaatregelen, leerplichtcontrole, signaal- en consultfunctie.

### 6.3 CLB and logopedie

Most CLBs no longer employ logopedisten as such (the historical *paramedisch werker* in CLB has largely disappeared), but the CLB plays the **screening and referral** role:

- The CLB performs the systematische medische contacten in kleuter- en lager onderwijs, including a *gehoor-* and *zicht*-screening at fixed leeftijden (typically 3 jaar 0-3 maanden, 5 jaar, 6 jaar, 9 jaar, 11 jaar, 14 jaar, 15 jaar — exact ages adjusted by the *uitvoeringsbesluit*). Findings of taal- of spraakproblemen lead to a **doorverwijzing** to an external logopedist.
- The CLB issues the **verslag** that anchors a leerlingen-traject under the Leersteundecreet (GC, IAC, OV4) and the **attest** for inschrijving in buitengewoon onderwijs. Without a CLB-verslag, no buitengewoon-onderwijs-pad is possible.
- The CLB delivers the **multidisciplinair onderzoek** that is required as evidence for an *aanvraag bijkomende stoornissen* (E-pathologie 8 and 9) under the federal RIZIV nomenclature for logopedie. For a child to receive RIZIV-reimbursed sessions for dyslexie or dyscalculie, a recent CLB-onderzoek with discrepantie-criteria is one of the bewijsstukken accepted.

### 6.4 Data-sharing implications for halingo

Two practical points:

- A CLB-verslag is a **privacy-sensitive document** under both GDPR and the *decreet leerlingenbegeleiding* (Art. on beroepsgeheim van CLB-medewerkers, expliciet gestoeld op art. 458 SW). A logopedist who receives a CLB-verslag from a parent is bound by *gedeeld beroepsgeheim*. Halingo should treat this as a sensitive attachment with restricted access.
- The CLB has its own digital backbone (LARS — Leerlingen-AdministratieRegistratieSysteem) and the Vlaams Leerlingen Volgsysteem; halingo should **not** assume any direct integration. Verslagen are exchanged either as PDF or via secure email; eHealth-MyCareNet does not connect to CLB infrastructure.

---

## 7. Kind en Gezin / Opgroeien and early detection

### 7.1 Opgroeien as the umbrella

Since 1 January 2019 the agencies **Kind en Gezin** and **Jongerenwelzijn** were merged into **Opgroeien regie** (formal name: *agentschap Opgroeien*), pursuant to the *decreet van 30 maart 2018 houdende de oprichting van het agentschap Opgroeien*. Kind en Gezin is now the citizen-facing brand for the 0-3 prevention work; Opgroeien is the legal entity. The agency also hosts the **intersectorale toegangspoort (ITP)** for non-directly-accessible jeugdhulp (relevant to PAB applications, see § 2).

### 7.2 Preventive screening pathway

Between birth and ~30 months of age a child in the Vlaamse Gemeenschap goes through approximately **ten contactmomenten** with a Kind en Gezin verpleegkundige in the consultatiebureau, supplemented by huisbezoeken in the first weeks. Screenings of relevance to logopedie:

- **Universele gehoortest** in the first weeks of life using AABR (automated auditory brainstem response). Performed by a Kind en Gezin verpleegkundige since 1998. In 2022, 64,199 newborns were screened. Detection of hearing loss is the single largest determinant of language delay; early intervention is decisive.
- **Oogtest** at ~12 months and at the **30-maandenconsult**.
- **Taalscreening / observatie van de communicatieve ontwikkeling** during the contactmomenten and the *Van Wiechenontwikkelingsonderzoek*. There is no separate "taalonderzoek 30 maanden" in the Kind en Gezin protocol — the language observation is integrated in the bredere ontwikkelingsobservatie. Concerns are flagged and the parents are referred to the huisarts, KNO-specialist, or directly to a logopedist.

### 7.3 Hand-off to external logopedists

A Kind en Gezin verpleegkundige cannot prescribe logopedie under the federal nomenclature (only artsen kunnen voorschrijven, see `02-prescription-bilan-and-pathology-rules.md`), but the Kind en Gezin huisarts/regiopediater can. In practice:
1. Kind en Gezin signaleert taalachterstand →
2. Verwijzing naar de huisarts of NKO-arts →
3. Voorschrift voor logopedisch bilan →
4. Bilan uitgevoerd door de logopedist →
5. Aanvraag tot tegemoetkoming bij de adviserend arts van het ziekenfonds.

This is the standard pathway for a 3-4-year-old presenting with phonological delay, fonologische stoornis, or vermoeden van ontwikkelingsdysfasie/STOS.

### 7.4 Huizen van het Kind

The **Huizen van het Kind** are local samenwerkingsverbanden of welzijns-, gezondheids- en gezinsorganisaties facilitating opvoedingsondersteuning, gezinsondersteuning en preventieve gezondheidszorg, established by the *decreet van 29 november 2013 houdende de organisatie van preventieve gezinsondersteuning*. There are now several hundred Huizen van het Kind across Vlaanderen and Brussels. They operate as physical and virtual one-stop-shops where parents can drop in for advice, a contactmoment, an opvoedingsvraag, peer-support groups, and informal screening.

The Huis van het Kind is therefore an **early-detection node** for taal- en spraakproblemen — without itself being a clinical setting. Logopedists can collaborate with a Huis van het Kind via *workshops*, *infoavonden*, or *outreachende observaties*, but cannot bill RIZIV for these activities (they are public-health-style outreach).

### 7.5 Geïntegreerd Breed Onthaal (GBO)

The **GBO** is a samenwerkingsverband, anchored in the *decreet betreffende het lokaal sociaal beleid van 9 februari 2018*, between minimaal:
- het **OCMW**
- het **CAW** (Centrum Algemeen Welzijnswerk)
- de **DMW** (dienst Maatschappelijk Werk van het ziekenfonds)

each with a wettelijke onthaalopdracht. The doel of GBO is to **counteract onderbescherming** (rechten die onbenut blijven) and to provide a *toegankelijke sociale dienstverlening*. GBO and Huizen van het Kind work side by side: the GBO is the *welzijns*-onthaalpunt, the Huis van het Kind is the *gezins*-onthaalpunt, and they coordinate via local working groups.

For a logopedist, the GBO is rarely a direct contractual partner, but it is the place to refer parents who need a financial-aid traject (verhoogde tegemoetkoming, OCMW-tussenkomst, derdebetaler) parallel to the logopedische behandeling.

---

## 8. Language-of-care obligations in Flanders

### 8.1 The basic rule

The **Bestuurstaalwet van 18 juli 1966** (gecoördineerd) and Article 4 of the Grondwet establish the language regime:
- The **Dutch language area** = the **Vlaams Gewest** (excluding the gemeenten met faciliteiten where a special regime applies).
- Public administrations and services ondergeschikt aan een openbare overheid in this area must communicate with citizens in **Dutch**.
- Private actors performing tasks "in opdracht of in plaats van" a public service inherit the language obligation for those tasks.

For zorginstellingen the rule is more nuanced:
- A *publieke* instelling in the Vlaams Gewest (e.g. een OCMW-ziekenhuis, een gemeentelijk woonzorgcentrum) **must** function in Dutch as administrative language.
- A *private* instelling in the Vlaams Gewest (most independent praktijken, vzw-ziekenhuizen) is not directly subject to the bestuurstaalwet for its private operations, but is bound by the **Vlaamse zorgregelgeving** that often requires Dutch as the working language for erkenningen — for example, the woonzorgdecreet and the kwaliteitsdecreet impose Dutch as the dossiertaal.
- Patient communication in private settings is in principle **language-free** (taalvrijheid in de relatie zorgverlener-patiënt), but the patient has rights under the *wet patiëntenrechten van 22 augustus 2002* to understand the information they receive.
- A logopedist working as a *zelfstandige* in a Vlaams-gewest praktijk is not legally obliged to speak Dutch with the patient — many logopedisten in de Vlaamse Rand or in Antwerpen treat anderstalige kinderen — but the **dossier, het bilan en de communicatie met de adviserend arts** are in practice in Dutch because the federal RIZIV-procedures and the Vlaamse instanties expect Dutch.

### 8.2 Brussels-Hoofdstedelijk Gewest

In Brussel:
- **Openbare ziekenhuizen** in Brussel-Hoofdstad fall under de tweetaligheidsverplichting: ze moeten in Nederlands én Frans dienstverlenen, en personeel dat met patiënten in contact komt moet kennis van de tweede taal aantonen.
- **Privé-ziekenhuizen** vallen in principe onder taalvrijheid, met uitzondering van de erkende spoeddiensten en de medische urgentiegroepen, die wel onder de bestuurstaalwet vallen.
- **Independent praktijken** (logopedie, kinesitherapie, huisartsen) in Brussels-Hoofdstad zijn taalvrij in de relatie met de patiënt. Ze kunnen in het Frans, Nederlands, Engels of een andere taal werken — keuze van de zorgverlener.
- The *Vlaams Meldpunt Taalklachten in de Brusselse ziekenhuizen* is operational and a frequent source of klachtendossiers.

### 8.3 Implications for halingo's UX

- **Default language for the Flemish Region**: Dutch. The dossier, the bilan, the verslagen, the eAttest-templates, the patient correspondence templates should default to Dutch.
- **Multilingual patient-facing modules** (uitnodigingsbrieven, oefenmateriaal voor anderstalige kinderen) are useful and **legally permitted** even in the Flemish Region. There is no rule against giving the parent a Franse of Engelse brief, as long as the logopedist's *officieel dossier* and *Vlaamse administratieve communicatie* (kwaliteitsdecreet, VAPH-stukken, CLB-verslagen, RIZIV-bilan) is in Dutch.
- **Brussels deployment**: halingo should let the praktijk choose between Dutch and French as primary UI language and let the praktijk store dossiers in the chosen language. Dutch remains required where a Vlaamse instantie is recipient (VAPH, CLB, AgODi, Departement Zorg).
- **German-speaking Community** (Eupen-area) is small but present; some logopedisten work in German there. halingo can defer this for now.

---

## 9. Subsidies, KMO-portefeuille, digital incentives

### 9.1 KMO-portefeuille

The **kmo-portefeuille** is a Vlaamse subsidie operated by **VLAIO** (Agentschap Innoveren en Ondernemen) under the *decreet van 16 maart 2012 betreffende het economisch ondersteuningsbeleid*. It supports SMEs and self-employed beoefenaars van een vrij beroep — including logopedisten — for opleiding en (until February 2026) advies.

Key parameters (2025-2026):
- **Eligibility**: kmo's, eenmanszaken, vrije beroepen (huisartsen, advocaten, accountants, **logopedisten**, kinesitherapeuten, psychologen…), zelfstandigen, zelfstandigen in bijberoep. Vzw's only if recognised as *werkplaats voor aangepast werk* with a Flemish vestiging.
- **Subsidy percentages**: kleine onderneming (KO) **30 %**, middelgrote onderneming (MO) **20 %**.
- For specific themes "duurzaamheid – energie-efficiëntie" en "digitalisering – cybersecurity", the percentages are uplifted to **45 % (KO)** and **35 % (MO)**.
- **Cap**: maximum **€7,500** subsidy per kalenderjaar per onderneming.
- **Themes covered**: bedrijfsstrategie, beroepsspecifieke competenties, digitalisering, duurzaamheid, financiële geletterdheid, innovatie, internationalisering, personeelsmanagement.
- **Important change**: as of **1 February 2026**, advies (except cybersecurity-advies) is removed from the kmo-portefeuille; only opleiding remains.

### 9.2 Is halingo (a SaaS subscription) eligible?

**Generally not directly.** A pure SaaS-abonnement is geen *opleiding* en geen *advies*; het is een dienstverlening die niet onder de kmo-portefeuille valt. However:
- An **opleiding** of a logopedist on how to use halingo (delivered by a *geregistreerde dienstverlener kmo-portefeuille*) **is** eligible. This means halingo or a partner could register as a dienstverlener (theme: digitalisering) and offer a paid implementation/onboarding training that the praktijk can subsidise via the portefeuille.
- An **advies-opdracht** about digitalisation of the praktijk delivered by a registered consultant **was** eligible until 1 February 2026 and is no longer afterwards (except cybersecurity).
- The praktijk's own opleidingen (bv. opleiding rond AI-toepassingen in logopedie, een datamanagementtraining) blijven volledig subsidieerbaar.

For halingo's go-to-market deck, this is a real lever: a kleine logopedie-praktijk paying €1,000 voor een onboardingstraining ziet daar maar €700 van op de eigen rekening, want VLAIO past €300 bij. Dit moet wel verlopen via de officiële kmo-portefeuille-flow op `kmo-portefeuille.be`, met een geregistreerde dienstverlener (registratienummer DV.O……).

### 9.3 Other Flemish incentives

- **Startplan** voor zelfstandige in bijberoep (VLAIO): aanmoediging voor bijberoepers om over te schakelen naar hoofdberoep. Eenmalige forfaitaire premie.
- **Transitiepremie voor zelfstandigen** (VLAIO): voor 45+ niet-werkende werkzoekenden die zich vestigen als zelfstandige. Tot €4.500 in twee schijven.
- **JobbonusPLUS voor startende zelfstandigen**: jaarlijkse premie voor zelfstandigen met een laag inkomen onder bepaalde voorwaarden.
- **Vlaamse Ondersteuningspremie (VOP) voor zelfstandigen**: voor zelfstandigen met een arbeidshandicap; tegemoetkoming in het inkomensverlies.
- **Federal layer (not Flemish, but interacts)**: RIZIV-praktijktoelage voor logopedisten, RIZIV-tegemoetkomingen voor telematica/MyCareNet/eDossier (gemeenschappelijk beheerd via de COBRHA-databank). Buiten het Vlaams budget.
- **Geen specifieke "openings-praktijk-subsidie"** voor logopedisten in Vlaanderen. De Vlaamse subsidies voor *huisartsenpraktijken* (Impulseo-opvolger, praktijkbeheer, jaarlijkse forfaitaire toelage tot eind 2025) zijn niet uitgebreid naar logopedisten.

### 9.4 Practical advice for halingo's marketing

- Offer (or partner with) a *geregistreerde dienstverlener kmo-portefeuille* for the onboarding-training. Communicate the 30 % korting in marketing materials.
- Be explicit that the **abonnement zelf** is not subsidieerbaar — to avoid Trustpilot complaints.
- Consider getting registered as **dienstverlener kmo-portefeuille** under the digitalisation theme: registratie verloopt via een externe certificatie (bv. ISO 9001, Qfor, CEDEO, ESF Kwaliteitslabel), wat een eenmalige investering is maar duurzaam waarde creëert.

---

## 10. Data and privacy in the Flemish education and care sectors

### 10.1 Stacked legal frame

A logopedist in Vlaanderen handles personal data under at least four overlapping regimes:
1. **GDPR** (*verordening 2016/679*) and the Belgian *kaderwet GBA van 30 juli 2018*.
2. **Wet patiëntenrechten van 22 augustus 2002** for the patient relationship.
3. **Wet kwaliteitsvolle praktijkvoering van 22 april 2019** ("kwaliteitswet"), which defines the *patientendossier* requirements at federal level.
4. **Vlaamse sector-specifieke regels** for whoever interacts with the Flemish administration:
   - *Decreet leerlingenbegeleiding van 27 april 2018* (CLB) — beroepsgeheim van CLB-personeel, gedeeld beroepsgeheim met externe partners onder voorwaarden.
   - *Decreet basisonderwijs van 25 februari 1997* and *Codex Secundair Onderwijs* — kaderregels voor leerlingengegevens.
   - *Decreet houdende de oprichting van het agentschap Opgroeien* — gegevensverwerkingsregels voor Opgroeien-dossiers.
   - *Decreet rechtspositie minderjarige in de integrale jeugdhulp van 7 mei 2004* — toestemmingsregels voor minderjarigen in jeugdhulp en VAPH-traject.

### 10.2 AgODi, Mijn Onderwijs and digital identity

**AgODi** (Agentschap voor Onderwijsdiensten) is the Flemish onderwijsadministratie that processes pupil data under both GDPR and the federale en Vlaamse regelgeving inzake bescherming van natuurlijke personen. AgODi runs **Mijn Onderwijs** (the parents' and pupils' portal showing rapporten, attesten, leerlingenadministratie data, pseudoschoolgegevens) and the **Discimus** backend that schools push leerlingengegevens to.

For halingo, the relevant points are:
- **No direct integration is possible** with Mijn Onderwijs or Discimus from a private logopedie-praktijk. Schools push to AgODi, AgODi shows the parent. There is no API for praktijksoftware.
- **eHealth and MyCareNet** are the *federal* identity backbones for healthcare and have **no overlap** with AgODi. A logopedist authenticates against eHealth (using a Belgian eID, itsme, or een eHealth-token); a school authenticates against het *Vlaams gebruikersbeheer* (with eID/itsme) for AgODi-applicaties. The two worlds do not interconnect.
- **Two-factor authentication** for access to leerlingenadministratie or leerlingenvolgsystemen is mandated by AgODi for onderwijspersoneel since the security overhaul of the early 2020s.
- A **CLB-verslag** that comes into the praktijk is a *gedeelde beroepsgeheim*-document — store with restricted access, do not include in standard reporting exports.

### 10.3 Vlaamse Toezichtcommissie Informatieveiligheid

Beyond the federal *Gegevensbeschermingsautoriteit (GBA)*, Vlaanderen has a **Vlaamse Toezichtcommissie voor de verwerking van persoonsgegevens** (VTC), opgericht door art. 10/1 van het *decreet 18 juli 2008 betreffende het elektronische bestuurlijke gegevensverkeer*. The VTC verleent machtigingen voor gegevensuitwisseling **tussen Vlaamse instanties** (bv. uitwisseling tussen Opgroeien en AgODi over leerlingen). Een logopedist wordt zelden direct geconfronteerd met de VTC, en **een private SaaS zoals halingo heeft geen VTC-machtiging nodig** om patiëntgegevens van een Vlaamse logopedie-praktijk te hosten of verwerken — die relatie valt onder GDPR + kaderwet GBA + kwaliteitswet 22.04.2019, met de federale GBA als bevoegde toezichthouder. Het Raad van State-arrest **nr. 266.244 van 31 maart 2026** heeft bovendien definitief bevestigd dat de VTC niet kwalificeert als toezichthoudende autoriteit onder Art. 51 GDPR. Een Vlaamse machtiging zou enkel nodig zijn bij integratie met een Vlaamse overheidsbron (AgODi/Discimus, CLB/LARS, VAPH, Departement Zorg, Magda); zie `verification-2026-04/05-flanders.md` item 2 voor de volledige scope-analyse.

### 10.4 Practical privacy guidance for halingo

- Treat alle CLB-, Opgroeien-, VAPH- en BuO-stukken als bijzondere categorieën van persoonsgegevens (*gezondheidsgegevens* in de zin van art. 9 GDPR).
- Logging: every read/write of a CLB-verslag in the dossier must be auditable.
- Toestemmingsbeheer: de VAPH-context vereist soms toestemming van zowel het kind (vanaf 12 jaar in jeugdhulpdossiers, op grond van het decreet rechtspositie minderjarige) als beide ouders.
- Verwerkersovereenkomst (DPA) verplicht voor halingo als verwerker van een Vlaamse logopedie-praktijk.
- Hosting: GDPR vereist EU-hosting voor gezondheidsgegevens; halingo doet er goed aan **België of EU** als hosting-locatie te garanderen voor zorgklanten.

---

## 11. Freshness notes

- **Zorgpremie**: rises from €64 to €100 (and €32 to €35 for VT) **as of premium year 2026**, decided by the Flemish Government in September 2025. Note that the verhoging in de pers vaak werd voorgesteld als ingaand op 1 januari 2026 — in de praktijk gaat het over de premie die in 2026 aan de zorgkas verschuldigd is.
- **Cumulverbod CAR / RIZIV-logopedie** — *RESOLVED 2026-04-06* (zie `verification-2026-04/05-flanders.md`, item 3). Het instrument is een **interpretatieregel van het Verzekeringscomité van het RIZIV** op art. 36 § 3, 5° van de logopedie-nomenclatuur, gepubliceerd in het **Belgisch Staatsblad op 2 oktober 2025**, en daarna verfijnd in een tweede versie. De *eerste* versie verstrengde de regel (cumulverbod actief vanaf de conclusie van het multidisciplinair bilan); de *tweede* versie heeft de regel teruggebracht naar het pragmatische principe dat de cumul pas stopt zodra de **multidisciplinaire behandeling** in het CAR effectief is gestart (bilan en wachtlijst tellen niet mee). Retroactief van toepassing vanaf **2 oktober 2025**; ten onrechte geweigerde sessies kunnen worden geregulariseerd. Uitsluitingen blijven zoals in de nomenclatuur: pathologieën in **§ 2 b) 6.3** (dysarthrieën door neuromusculaire aandoeningen) en **§ 2 d)** (gehoorstoornissen) vallen buiten het cumulverbod en mogen wél parallel met CAR lopen. Halingo's bilan-flow moet vier vragen stellen: (a) is er een CAR-traject? (b) is het bilan al uitgevoerd? (c) is de behandeling al gestart? (d) onder welke pathologie-§? — en op basis daarvan automatisch waarschuwen of deblokkeren. Zie ook § 4.4 van dit document.
- **Kmo-portefeuille**: schrapping van het luik *advies* (behoudens cybersecurity-advies) op **1 februari 2026**. Opleidingen blijven onveranderd subsidieerbaar.
- **Leersteundecreet**: het decreet is van kracht sinds **1 september 2023**. De evaluatie op middellange termijn (door de Vlaamse Onderwijsraad / Vlor en het Rekenhof) is voorzien rond 2026-2027; eventueel wijzigingsdecreet daarna.
- **VAPH BVR vergunnen**: laatste materiële wijziging definitief goedgekeurd door de Vlaamse Regering op **23 februari 2024**, in werking sinds **1 maart 2024**.
- **Zorgbudget zwaar zorgbehoevenden**: blijft in 2025 op **€140/maand** (geen indexering toegezegd voor 2026 op het ogenblik van schrijven).
- **PVB puntwaarde**: in 2026 ongeveer **€1.059,29 per zorggebonden personeelspunt**; jaarlijks geïndexeerd in januari.
- **PAB jaarrange**: in 2026 ongeveer **€12.873 – €60.077** per jaar.
- **Leersteuncentra**: 40 generieke + 4 specifieke (type 4, 6, 7 en STOS).
- **MDO-honorarium binnen VSB** — *RESOLVED 2026-04-06* (zie `verification-2026-04/05-flanders.md`, item 1). Tarieven 2026: **€30,64** per deelnemer (max 4), **€49,02** zorgbemiddelaar, **€147,07** overlegorganisator (2025 was respectievelijk €29,61 / €47,37). Wettelijke grond: BVR 26.11.2021 + decreet 18.06.2021 in uitvoering van het VSB-decreet 18.05.2018; financiering door de zorgkassen sinds **1 januari 2022**. Jaarlijks geïndexeerd. **Belangrijk:** Minister Gennez heeft in haar antwoord op SV nr. 624 (2 april 2025) bevestigd dat het MDO-systeem deze legislatuur wordt **uitgefaseerd** ten voordele van vergoedingen voor zorgcoördinatie en casemanagement. Halingo moet de MDO-lijn als *deprecated* taggen tegen midden-legislatuur.
- **Vlaamse Toezichtcommissie machtiging voor halingo-hosting** — *RESOLVED 2026-04-06* (zie `verification-2026-04/05-flanders.md`, item 2). **Geen VTC-machtiging vereist.** De VTC-bevoegdheid (art. 10/1 e-govdecreet 18.07.2008) is beperkt tot gegevensuitwisselingen tussen Vlaamse instanties, niet tussen een private logopedist en een private SaaS-verwerker. Die relatie valt onder GDPR + kaderwet GBA 30.07.2018 + kwaliteitswet 22.04.2019, met de federale **GBA** als toezichthouder. Het Raad van State-arrest **nr. 266.244 van 31 maart 2026** heeft bovendien definitief vastgesteld dat de VTC niet kwalificeert als toezichthoudende autoriteit onder Art. 51 GDPR. Een Vlaamse machtiging zou enkel nodig zijn als halingo zou willen integreren met een Vlaamse overheidsbron (AgODi/Discimus, CLB/LARS, VAPH, Departement Zorg, Magda); dat is een product-roadmap-besluit, niet een vandaag-bestaande verplichting.
- **Onbekend / nog te valideren**:
  - exact aantal MDTs per provincie (de cijfers spreken van "ongeveer 50 per provincie" maar de officiële lijst op vaph.be moet gevalideerd worden bij implementatie);
  - de exacte tarieven en kwalificatieregels van het opvolgsysteem zorgcoördinatie/casemanagement zodra de mededeling aan de Vlaamse Regering van 4 april 2025 in regelgeving is omgezet.

---

## 12. Sources

### VAPH (vaph.be)
- Persoonlijke budgetten — overzicht: <https://www.vaph.be/persoonlijke-budgetten>
- Zorg en ondersteuning op maat inkopen (PVB algemeen): <https://www.vaph.be/persoonlijke-budgetten/pvb/algemeen>
- Hoeveel bedraagt het persoonsvolgend budget?: <https://www.vaph.be/persoonlijke-budgetten/pvb/bedragen>
- PAB algemeen: <https://www.vaph.be/persoonlijke-budgetten/pab/algemeen>
- PAB aanvragen: <https://www.vaph.be/persoonlijke-budgetten/pab/aanvragen>
- Hoeveel bedraagt het PAB?: <https://www.vaph.be/persoonlijke-budgetten/pab/bedragen>
- Bestedingsregels persoonsvolgend budget: <https://www.vaph.be/documenten/bestedingsregels-persoonsvolgend-budget>
- Wat is een vergunde zorgaanbieder?: <https://www.vaph.be/professionelen/vza/vergunning>
- Vergunningsnormen VZA: <https://www.vaph.be/professionelen/vza/vergunning/vergunningsvoorwaarden>
- Aanpassingen aan het BVR vergunnen (feb 2024): <https://www.vaph.be/nieuws/2024/02/aanpassingen-aan-het-bvr-vergunnen>
- Wat is een multidisciplinair team (MDT)?: <https://www.vaph.be/professionelen/mdt/erkenning/wat>
- Erkenning aanvragen MDT: <https://www.vaph.be/professionelen/mdt/erkenning/aanvragen>
- Rechtstreeks toegankelijke hulp (RTH): <https://www.vaph.be/organisaties/rechtstreeks-toegankelijke-hulp>
- Aanbieder van RTH — erkenning: <https://www.vaph.be/professionelen/rth/erkenning>
- Drie ondersteuningsvormen (MFC): <https://www.vaph.be/organisaties/mfc/ondersteuning>
- Besteding stap 4 — voucher/cash/combinatie: <https://www.vaph.be/persoonlijke-budgetten/pvb/besteden/stap-vier>
- Besteding stap 5 — betalen in voucher of cash: <https://www.vaph.be/persoonlijke-budgetten/pvb/besteden/stap-vijf>
- Wat kost de ondersteuning bij een vergunde zorgaanbieder? (FAQ): <https://www.vaph.be/faq/wat-kost-de-ondersteuning-bij-een-vergunde-zorgaanbieder>
- Individuele dienstverleningsovereenkomst PVB: <https://www.vaph.be/individuele-dienstverleningsovereenkomst-persoonsvolgend-budget>
- Indexaanpassing PAB: <https://www.vaph.be/nieuws/indexaanpassing-persoonlijke-assistentiebudget>
- Stap 2 budgetcategorie bepalen: <https://www.vaph.be/professionelen/mdt/mdv/modules/stap-2-budgetcategorie-bepalen>
- Richtlijnen PVB-budgethouders (PDF): <https://www.vaph.be/sites/default/files/2025-06/Richtlijnen_pvb_december_2024.pdf>
- Besluit Vlaamse Regering 24 juni 2016 vergunnen aanbieders NRTH: <https://www.vaph.be/documenten/besluit-van-de-vlaamse-regering-van-24-juni-2016-2>

### Departement Zorg / Vlaamse Sociale Bescherming
- Over de Vlaamse Sociale Bescherming: <https://www.departementzorg.be/nl/over-de-vlaamse-sociale-bescherming>
- Het zorgbudget — overzicht: <https://www.departementzorg.be/nl/het-zorgbudget>
- Zorgbudget voor zwaar zorgbehoevenden: <https://www.departementzorg.be/nl/zorgbudget-voor-zwaar-zorgbehoevenden>
- Zorgbudget voor ouderen met een zorgnood: <https://www.departementzorg.be/nl/zorgbudget-voor-ouderen-met-een-zorgnood>
- Zorgpremie voor inwoners van het Vlaams Gewest: <https://www.departementzorg.be/nl/zorgpremie-voor-inwoners-van-het-vlaams-gewest>
- Financiering van zorg in VSB: <https://www.departementzorg.be/nl/financiering-van-zorg-vsb>
- Centra voor leerlingenbegeleiding (Departement Zorg-zicht): <https://www.departementzorg.be/nl/organisatie/centra-voor-leerlingenbegeleiding>
- Faciliteren lokaal geïntegreerd gezins- en jeugdhulpbeleid: <https://www.departementzorg.be/nl/het-faciliteren-en-ondersteunen-van-een-lokaal-geintegreerd-gezins-en-jeugdhulpbeleid>
- Meldpunt Taalklachten Brusselse ziekenhuizen: <https://www.departementzorg.be/nl/vlaams-meldpunt-taalklachten-de-brusselse-ziekenhuizen>
- Vlaamse Zorgkas: <https://www.vlaamsezorgkas.be/>
- Decreet 18 mei 2018 VSB (publicatie zorg-en-gezondheid.be): <https://www.zorg-en-gezondheid.be/publicaties-en-documenten/decreet-over-de-vlaamse-sociale-bescherming>
- Decreet 18 mei 2018 VSB op etaamb: <https://etaamb.openjustice.be/nl/decreet-van-18-mei-2018_n2018013215.html>
- BVR 30 nov 2018 uitvoeringsbesluit VSB (codex): <https://codex.vlaanderen.be/PrintDocument.ashx?id=1030063>
- Vlaamse Sociale Bescherming — multidisciplinair overleg: <https://www.vlaamsesocialebescherming.be/de-vlaamse-sociale-bescherming/multidisciplinair-overleg>

### Onderwijs / Leersteun / CLB
- Onderwijs Vlaanderen — naar een decreet leersteun: <https://www.onderwijs.vlaanderen.be/naar-een-decreet-leersteun-voor-leerlingen-met-specifieke-onderwijsbehoeften>
- Lijst leersteuncentra (PDF): <https://onderwijs.vlaanderen.be/sites/default/files/2023-02/Lijst_leersteuncentra.pdf>
- Klasse — Decreet leersteun: dit zijn de grote lijnen: <https://www.klasse.be/262679/decreet-leersteun-grote-lijnen/>
- Klasse — Decreet leersteun: veelgestelde vragen: <https://www.klasse.be/633851/decreet-leersteun-veelgestelde-vragen/>
- Vlaams Parlement — verslag plenaire 3 mei 2023 (goedkeuring leersteundecreet): <https://www.vlaamsparlement.be/nl/parlementair-werk/plenaire-vergaderingen/1730801/verslag/1733118>
- Katholiek Onderwijs Vlaanderen — leersteuncentra & specifieke leersteuncentra 4,6,7: <https://pro.katholiekonderwijs.vlaanderen/leersteuncentra>
- Specifiek Leersteuncentrum 467 — Type 7: <https://specifiekleersteuncentrum467.be/aanbod/type-7>
- Centra voor Leerlingenbegeleiding (algemeen): <https://onderwijs.vlaanderen.be/nl/centra-voor-leerlingenbegeleiding>
- Opdrachten van het CLB — voor CLB's: <https://www.vlaanderen.be/onderwijsprofessionals/lesgeven-en-begeleiden/leerlingenbegeleiding/werken-in-een-clb/opdrachten-van-het-clb>
- Vrij CLB Netwerk: <https://www.vrijclb.be/over-clb>
- Vrij CLB Netwerk — Buitengewoon onderwijs: <https://www.vrijclb.be/thema/buitengewoon-onderwijs>
- Buitengewoon basisonderwijs (data-onderwijs.vlaanderen.be): <https://data-onderwijs.vlaanderen.be/onderwijsaanbod/default.aspx/bao/buo>
- Onderwijskiezer — buitengewoon lager onderwijs type 7: <https://www.onderwijskiezer.be/v2/basis/basis_buo_detail.php?detail=20>
- AgODi — Privacyverklaring: <https://onderwijs.vlaanderen.be/nl/over-onderwijs-en-vorming/agodi-agentschap-voor-onderwijsdiensten/organisatie-en-werking-agodi/privacyverklaring-agodi>
- AgODi — Tweefactorauthenticatie leerlingengegevens: <https://www.agodi.be/leerlingengegevens-via-tweefactorauthenticatie>
- ACV/COC brandpunt — van GON/ION over M-decreet naar Leersteundecreet (PDF): <https://www.hetacv.be/docs/default-source/acv-csc-docsitemap/6000-centrales/6660-christelijke-onderwijscentrale-(coc)/6740-brandpunt/brandpunt-2022-20232/bp6_leersteundecreet.pdf>

### Opgroeien / Kind en Gezin / Huizen van het Kind / GBO
- Kind en Gezin — taalontwikkeling stimuleren: <https://www.kindengezin.be/nl/thema/ontwikkeling-en-gedrag/taal-en-meertaligheid/hoe-stimuleer-ik-taalontwikkeling-mijn-kind>
- Kind en Gezin — taalontwikkeling 0-3 jaar: <https://www.kindengezin.be/nl/thema/ontwikkeling-en-gedrag/taal-en-meertaligheid/taalontwikkeling-tussen-0-en-3-jaar>
- Kind en Gezin — gehoortest: <https://www.kindengezin.be/nl/kind-en-gezin-diensten/contactmomenten/gehoortest>
- Kind en Gezin — consult 30 maanden: <https://kindengezin.be/gezinsondersteuning/dienstverlening-door-kind-en-gezin/consulten/consult-30-maanden>
- Kind en Gezin — getuigenis oog- en gehoorscreening: <https://www.kindengezin.be/nl/kind-en-gezin-diensten/contactmomenten/getuigenis-oogscreening-gehoorscreening>
- Opgroeien — gehoor (achtergrond): <https://www.opgroeien.be/kennis/cijfers-en-onderzoek/gehoor>
- Persbericht Opgroeien — 25 jaar gehoortesten: <https://pers.opgroeien.be/al-25-jaar-gehoortesten-en-10-jaar-oogtesten-door-kind-en-gezin-ouders-zeer-tevreden-over-dienstverlening>
- EXPOO — Hoe kunnen Huizen van het Kind en GBO elkaar versterken: <https://www.expoo.be/hoe-kunnen-huizen-van-het-kind-en-het-samenwerkingsverband-ge%C3%AFntegreerd-breed-onthaal-elkaar>
- Departement Zorg — Huizen van het Kind en lokale loketten kinderopvang: <https://www.departementwvg.be/huizen-van-het-kind-en-lokale-loketten-kinderopvang>
- Eerstelijnszone — GBO: <https://www.eerstelijnszone.be/geintegreerd-breed-onthaal-1>
- Vlaamse ouderenraad — 10 wist-je-datjes GBO: <https://www.vlaamse-ouderenraad.be/actualiteit/welzijn-zorg/10-wist-je-datjes-over-het-geintegreerd-breed-onthaal>

### CAR / RIZIV-Vlaamse interface
- Federatie Centra voor Ambulante Revalidatie: <https://revalidatie.be/>
- RIZIV — geconventioneerde gespecialiseerde centra en revalidatiecentra: <https://www.riziv.fgov.be/nl/professionals/verzorgingsinstellingen-en-diensten/gespecialiseerde-centra>
- KCE-rapport 399A — Logopedie voor kinderen (2025) (PDF): <https://www.kce.fgov.be/sites/default/files/2025-04/KCE399As_Logopedie_kinderen.pdf>
- Nationale Hoge Raad Personen met een Handicap — Advies 2023/21 terugbetaling logopediekosten: <https://ph.belgium.be/nl/adviezen/advies-2023-21.html>
- RIZIV — terugbetaling logopedie patiënten met IQ < 86: <https://www.inami.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/logopedie-terugbetaling-van-zittingen-voor-patienten-met-een-iq-lager-dan-86>

### Taalwetgeving
- Taalwetwijzer (Vlaanderen): <https://www.vlaanderen.be/taalwetwijzer/>
- Taalwetwijzer — taalgebruik in ziekenhuizen Brussel-Hoofdstad: <https://www.vlaanderen.be/taalwetwijzer/taalwetwijzer/taalgebruik-in-ziekenhuizen-in-brussel-hoofdstad>
- Bestuurstaalwet 18 juli 1966 (gecoördineerd) — ejustice: <https://www.ejustice.just.fgov.be/cgi_loi/change_lg.pl?language=nl&la=N&table_name=wet&cn=1966071831>
- VVL — Vlaamse Vereniging voor Logopedisten: <https://www.vvl.be/zorgverlener>

### VLAIO / kmo-portefeuille / subsidies
- VLAIO — kmo-portefeuille: <https://www.vlaio.be/nl/subsidies-financiering/kmo-portefeuille>
- VLAIO — kmo-portefeuille steun voor opleiding en advies: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/kmo-portefeuille-steun-voor-opleiding-en-advies>
- VLAIO — Subsidiedatabank: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank>
- VLAIO — Zorgsector steunmogelijkheden: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/zorgsector-steunmogelijkheden>
- VLAIO — Transitiepremie zelfstandigen: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/transitiepremie-voor-zelfstandigen>
- VLAIO — JobbonusPLUS startende zelfstandigen: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/jobbonusplus-voor-startende-zelfstandigen>
- VLAIO — Vlaamse Ondersteuningspremie (VOP) voor zelfstandigen: <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/vlaamse-ondersteuningspremie-vop-voor-zelfstandigen>
- VVL — kmo-portefeuille (sectorinformatie): <https://www.vvl.be/vorming/kmo-portefeuille>

### Pers / nieuws (achtergrond)
- VRT NWS — Vlaamse zorgpremie verhoging (sept 2025): <https://www.vrt.be/vrtnws/nl/2025/09/22/wat-is-de-vlaamse-zorgpremie-en-waarom-wordt-ze-duurder/>
- VRT NWS — Goedkeuring Leersteundecreet (juli 2022): <https://www.vrt.be/vrtnws/nl/2022/07/10/vlaamse-regering-zet-licht-op-groen-voor-leersteundecreet/>
- Steunpunt Mantelzorg — zorgpremie 2026: <https://steunpuntmantelzorg.be/2025/09/24/de-zorgpremie-stijgt-in-2026-wat-betekent-dat-voor-jou/>

### Particuliere informatieve bronnen geconsulteerd
- Onafhankelijk Leven — PVB hoogte: <https://www.onafhankelijkleven.be/pvb/hoe-hoog-is-mijn-pvb>
- Onafhankelijk Leven — PAB voor minderjarigen: <https://www.onafhankelijkleven.be/pab>
- Helpper — alles over PAB: <https://www.helpper.be/nl/vaph-budget/pab/alles-over-het-persoonlijke-assistentiebudget>
- De Appelboom — terugbetaling logopedie overzicht: <https://www.de-appelboom.be/blog/terugbetaling-overzicht>
- Mieke Claes — terugbetaling logopedie: <https://www.miekeclaes.be/nieuws/de-terugbetaling-van-logopedie>
- KIDS vzw — logopedist BuO vacature: <https://www.kids.be/logopedist-buitengewoon-lager-onderwijs/>
- Arteveldehogeschool — beroep logopedist BuO: <https://www.arteveldehogeschool.be/nl/beroepen/logopedist-het-buitengewoon-onderwijs>
