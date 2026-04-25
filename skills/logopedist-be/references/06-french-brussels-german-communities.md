# 06 — Non-Flemish Regional and Community Rules Affecting Belgian Logopedists

> Last verified: 2026-04-06
> Scope: Walloon Region (AVIQ), Brussels (Iriscare/COCOM, COCOF/PHARE, VGC), French Community (Fédération Wallonie-Bruxelles), and German-speaking Community (Deutschsprachige Gemeinschaft / Ostbelgien)
>
> Federal RIZIV/INAMI nomenclature, recognition rules, and electronic billing are documented separately in files 01–04. This file is the *non-Flemish* community/regional layer that an independent logopedist working outside Flanders must navigate alongside federal rules.

---

## 1. Introduction — the institutional map

Belgian logopedic care lives in three legal layers stacked on top of one another:

1. **Federal layer (RIZIV/INAMI).** The federal layer sets the nomenclature (codes, sessions, tariffs), authorises individual practitioners (visa, professional recognition through SPF Santé publique / FOD Volksgezondheid), and runs the conventional reimbursement scheme via the sickness funds. This applies *everywhere* in Belgium regardless of which community a patient lives in.
2. **Community layer (cultural and "personalisable" matters).** Education, school health (including PMS / CLB / Kaleido), youth care, family support, prevention, and most disability policy are community competences. For non-Dutch-speaking territory, this means three communities: the **Fédération Wallonie-Bruxelles** (French Community), the **Deutschsprachige Gemeinschaft** (German-speaking Community), and the **Vlaamse Gemeenschap** for Dutch-speaking Brussels education.
3. **Regional layer.** The Walloon Region holds health, well-being and family-policy competences transferred during the 6th State Reform (2014), and exercises them through **AVIQ**. In Brussels, those same "personalisable" competences are split between **COCOM** (bilingual, via **Iriscare** / Vivalis), **COCOF** (French-speaking, via **PHARE**) and **VGC** (Flemish-speaking).

The practical product-design implication for a SaaS serving logopedists is that the patient's community/region determines:

- which **disability-support agency** can fund individual aids, communication devices, or accompaniment services on top of RIZIV reimbursement (AVIQ in Wallonia, PHARE in French-speaking Brussels, Iriscare for COCOM matters, VAPH in Flanders, DSL in Ostbelgien);
- which **school-support framework** the patient encounters (pôles territoriaux + centres PMS in FWB, leersteuncentra + CLB in Flanders, Kaleido + Förderpädagogik in DG);
- the **language** the file, prescriptions, written reports, attestations and patient communication must be issued in;
- which **early-detection actor** is upstream of referral to a logopedist (ONE in FWB, Kind & Gezin / Opgroeien in Flanders, Kaleido in DG).

Brussels is the most fragile case: a single 19-commune city can simultaneously expose a logopedist to **four different community/regional authorities** (COCOM, COCOF, VGC, and the federal layer), and a patient's route through them depends on language choice and on whether the institution that helps them is "uni-communal" (FR-only or NL-only) or bicommunal.

---

## 2. Walloon Region — AVIQ (Agence pour une Vie de Qualité)

### 2.1 Legal basis and mission

AVIQ is the *Agence wallonne de la santé, de la protection sociale, du handicap et des familles*. It was created by the **decree of 3 December 2015** of the Walloon Parliament (Décret relatif à l'Agence wallonne de la santé, de la protection sociale, du handicap et des familles) and became operational on **1 January 2016**, absorbing the former **AWIPH** (Agence wallonne pour l'intégration des personnes handicapées) and absorbing competences transferred from the federal level after the 6th State Reform.

AVIQ is structured into three branches, each with its own management committee (*comité de branche*):

- **Bien-être et Santé** — reimbursement of health benefits in nursing/rest homes (MR/MRS), first-line care organisation (Proximus santé), prevention, health promotion, home-care aids.
- **Handicap** — accompaniment services, residential and day care, individual aids, employment, awareness, BAP.
- **Familles** — administration of family allowances ("allocations familiales") for the Walloon Region (including supplementary allowances when a child has a recognised handicap or chronic condition).

A General Council coordinates cross-cutting matters; the three branch committees handle branch-specific governance. Since 1 January 2024, those instances officially carry the consultative function.

### 2.2 AVIQ vs RIZIV — when is logopedic care funded by AVIQ?

This is the critical line for product/billing logic:

- **Curative, individual logopedic treatment** — the prescription-bilan-attestation chain — is **federal** and reimbursed by RIZIV/INAMI through the patient's mutuality. AVIQ does **not** pay logopedic sessions one-by-one the way RIZIV does. A logopedist invoices via eAttest/eFact under federal nomenclature regardless of the patient living in Wallonia.
- **Logopedic care embedded in an AVIQ-recognised service** is funded differently. AVIQ recognises and finances accompaniment services, day-care centres, residential centres, integration services and *services d'aide précoce* where logopedists work as salaried staff. In that setting, the logopedist's salary and the service's operating costs are paid through AVIQ subsidies, not RIZIV nomenclature codes. Double-billing (RIZIV nomenclature + AVIQ subsidy for the same act) is forbidden.
- **Material aids and communication devices** — historically a parallel AVIQ track. Important: since **1 January 2024**, most individual material aids that used to be funded by AVIQ (and PHARE in Brussels) for the disability sector have been transferred to the **federal mutualities/CAAMI** track for their general "aides matérielles" component. AVIQ retains residual competence for certain school/work integration aids and for services not covered federally.
- **Supplementary family allowances** for a child with a disability (the Walloon equivalent of the Flemish "verhoogde kinderbijslag") are managed by the AVIQ Familles branch. A logopedic diagnosis can support the medical assessment.

### 2.3 Budget d'assistance personnelle (BAP)

The **Budget d'assistance personnelle** is the Walloon equivalent of Flanders' *persoonsvolgend budget* (PVB) administered by VAPH, but it is materially smaller and more restrictive.

- **Beneficiaries.** Person with a recognised severe loss of autonomy. The applicant must either (a) hold a federal *allocation d'intégration* of category 4 (15–16 points) or 5 (17–18 points), or (b) demonstrate equivalent medical criteria, **and** meet a priority condition (one of the listed evolutive pathologies *or* at least 45 points on the AVIQ autonomy scale).
- **Amounts.** Between roughly **€5,000 and €35,000 per year** depending on assessed need.
- **Use.** Pays personal assistants who help with daily and domestic activities, mobility, communication, and coordination of the personalised intervention plan. It is **not** designed to pay logopedic sessions per se (those go through RIZIV); however, where a logopedist coordinates a communication-support plan or trains the personal assistant in alternative-and-augmentative-communication (AAC) routines, the link is real and relevant.
- **Volume.** The total annual envelope is small compared to Flanders' PVB (the budget line was about €4.4 million in 2024 for BAP), making waiting lists structurally long.

A logopedist working in Wallonia who has a patient already on a BAP track should expect to interact with AVIQ for written motivation letters and for AAC-equipment justifications, but the session-level reimbursement still travels via RIZIV.

### 2.4 AVIQ-approved (agrément) services for logopedic care

AVIQ "agrée et finance" several categories of service that may employ logopedists:

- **Services d'aide précoce (SAP)** — accompaniment of young children with a disability, from birth (or pre-birth) until age 8. AVIQ recognises around **19 SAPs** across Wallonia.
- **Services d'accompagnement pour jeunes en âge scolaire (SAJ)** — accompaniment for children and adolescents aged 6–20, around **31 services** approved.
- **Services d'accompagnement pour adultes**.
- **Centres de jour pour enfants scolarisés (CJES), centres de jour pour adultes (CJA), services résidentiels (SRA, SRJ, SRNA)**.
- **Centres de réadaptation fonctionnelle** (formerly federal "centres ORL/PSY/etc.") whose competence and conventionnement is split between RIZIV and AVIQ since the 6th State Reform.

A self-employed logopedist can hold a federal RIZIV number *and* simultaneously work part-time in an AVIQ-recognised service; the SaaS must keep the two billing tracks rigidly separate.

### 2.5 Bureaux régionaux and Handicontact

- **Bureaux régionaux (BR).** AVIQ runs **7 regional offices** in French-speaking Wallonia: Charleroi, Mons, Namur, Libramont (Luxembourg), Liège, Dinant, and Ottignies (Brabant wallon). Each multidisciplinary team (doctors, psychologists, social workers, occupational therapists, integration agents, administrative staff) handles intake, recognition, and individual aids requests for residents of its territory.
- **Handicontact.** A network of municipal contact points launched in **2004** so that people with disabilities can be guided locally inside their commune. The most recent published count is around **217 communes** participating, some with multiple Handicontact agents. Handicontacts are first-line referrers and frequently the entry door for families looking for a logopedist with AVIQ-funded coverage of related services.

### 2.6 AVIQ subsidies/incentives for healthcare practitioners

AVIQ also runs employment and training incentives for healthcare professionals in Wallonia, often co-managed with **Forem** and **Promemploi**. These are mostly aimed at salaried staff in MR/MRS and recognised services rather than self-employed practitioners; for an independent logopedist they matter only if (a) they hire a salaried colleague who qualifies for an Impulseo-style incentive or (b) they work part-time inside an AVIQ-funded structure.

---

## 3. Brussels — Iriscare / COCOM / COCOF / VGC

### 3.1 Why Brussels is a four-way maze

Brussels-Capital is officially bilingual (French/Dutch). For "personalisable matters" (health, aid to persons, family policy, disability), the legal frame is:

- **COCOM / GGC** (*Commission communautaire commune* / *Gemeenschappelijke Gemeenschapscommissie*) handles bicommunal matters — institutions and rules that cannot be classified as exclusively French or exclusively Dutch. COCOM is now run administratively by **Vivalis** (the public-service administration created in 2021) and operationally for social-protection benefits by **Iriscare**, the public-interest organisation (OIP) created in 2017 and operational since **1 January 2019**.
- **COCOF** (*Commission communautaire française*) is the French-speaking Brussels community commission. Following the **decree of 19 July 1993** transferring competences from the French Community to the Walloon Region and to COCOF, COCOF received its own competences in curative care and aid to persons in 1994, including disability policy. The COCOF disability arm is **Service PHARE**.
- **VGC** (*Vlaamse Gemeenschapscommissie*) is the Flemish-speaking Brussels community commission. Crucially, the Flemish Community **does not transfer the exercise of any competence** to VGC; VGC remains a decentralised body of the Flemish Community. This means that for a Dutch-speaking patient in Brussels, the operational competence sits *with the Flemish Community* (VAPH for disability, Opgroeien for early childhood, leersteuncentra for school support) rather than with VGC itself, which plays a complementary local-policy role.
- **Federal** RIZIV remains competent for nomenclature reimbursement.

The criterion that decides which authority a Brussels-based service belongs to is **the institution's choice of language régime, not the patient's residence**:

- A "uni-communal" institution that has registered itself as French-speaking falls under COCOF (and PHARE for disability).
- A "uni-communal" institution registered as Dutch-speaking falls under the Flemish Community (VGC complementarily).
- A bilingual / bicommunal institution falls under COCOM (Iriscare/Vivalis).

For a self-employed logopedist working from a private cabinet in Brussels, the question is moot for federal nomenclature billing. It becomes critical the moment the logopedist works *for* a recognised service or asks for a recognition / subsidy of their cabinet — they must first decide which language régime to register under.

### 3.2 Iriscare and COCOM

Iriscare manages, on behalf of COCOM, a wide block of competences transferred during the 6th State Reform: family allowances for Brussels residents, MR/MRS funding, certain home-care services, and notably the **centres for sensory disabilities** (deafness, hearing impairment, visual impairment) where multidisciplinary teams of doctors, **logopèdes**, and social workers carry out assessments and treatment programmes for Brussels residents. Vivalis handles administration, advisory functions, and policy coordination; Iriscare runs the operational and benefit-payment functions.

For logopedic care specifically:

- Iriscare reimburses logopedic interventions inside its accredited *centres handicaps sensoriels* (hearing/deaf children's centres in Brussels), as part of the multidisciplinary care contract.
- Family allowances paid by Iriscare include the supplementary allowance for children with recognised disability or chronic conditions; logopedic reports can support that medical evaluation.
- Iriscare-accredited rehabilitation centres in Brussels are the bicommunal counterpart to Walloon AVIQ-recognised centres.

### 3.3 COCOF / Service PHARE

**Service PHARE** (*Personne Handicapée Autonomie Recherchée*) is a directorate of administration of the COCOF Public Service. Its core missions are:

- **Recognition** ("admission") of persons with disabilities domiciled in one of the 19 Brussels communes (general residence/age/nationality/disability conditions). The dossier is signed by professionals in volet B of the application — and **logopèdes** are explicitly listed among the professionals (alongside physicians, psychologists, social workers, kinésithérapeutes, ergothérapeutes, psychomotriciens, special educators) authorised to fill in the *volet psycho-médico-social* of the demand.
- **Direct individual aid** — financial interventions for material aids, employment integration, transport costs, and a Brussels variant of the *budget d'assistance personnelle*. PHARE-funded material aids historically included communication devices, AAC tablets and software, hearing-related equipment and accessibility tools.
- **Approval and subsidies** — recognition and funding of *services d'accompagnement à l'inclusion scolaire* (SAIS), centres d'activités de jour (CAJ), entreprises de travail adapté (ETA), services d'aide à l'inclusion, services d'accueil familial (SAF), etc., several of which employ logopedists.

**Important procedural change of 1 January 2024.** Most "aides individuelles matérielles" that were previously requested directly from PHARE (and from AVIQ in Wallonia) for general material aid are now processed through the patient's **mutualité** or **CAAMI**. PHARE retains direct competence for a defined residual list: pedagogical accompaniment, course transcription, certain school-only video-magnifier devices, and individual aids strictly for work or training adaptation. A logopedist filling out aid requests in 2026 should route material-aid demands through the mutualité by default, and only fall back on PHARE for the residual list. Communication devices and AAC tools generally now travel through the mutualité track.

For requests above **€500 (excl. VAT)** PHARE traditionally requires **two cost estimates (devis)** and a **trial period** (essai préalable) is mandatory for certain device categories including dynamic communication devices.

### 3.4 VGC (Vlaamse Gemeenschapscommissie)

VGC is the Flemish-speaking Brussels community commission. It supports Dutch-language education in Brussels through the **Onderwijscentrum Brussel (OCB)**, but in personalisable matters (health, disability, early-childhood) the operational competences flow through the Flemish Community proper: **VAPH** for disability, **Opgroeien** (formerly Kind & Gezin) for 0–3, **CLB** for school health, **leersteuncentra** for school-based learning support. VGC plays a *complementary* local-policy role: subsidising small-scale local initiatives, running the *vacaturebank* for Dutch-speaking school staff in Brussels (including logopedist vacancies in CLB or schools), and coordinating Dutch-language well-being services.

A logopedist working in Brussels who treats Dutch-speaking children essentially navigates **federal RIZIV + Flemish Community rules** the same way as a colleague in Flanders, despite being physically in Brussels. The VGC layer is mostly upstream/policy and rarely surfaces in the day-to-day billing flow.

### 3.5 Why this matters for a SaaS

Three concrete failure modes the product team should plan for:

1. A patient is "Brussels resident" but the logopedist's recognised service is registered French-speaking — the entire dossier must be handled by COCOF/PHARE, not Iriscare, and not VAPH. Patient residence alone is not enough to route the request.
2. A material-aid request submitted to PHARE in 2025/2026 will be returned if it falls under the post-1-January-2024 mutualité track. The product should include the cut-off and the residual list.
3. A Dutch-speaking child whose parents request school accompaniment in Brussels will follow VAPH/leersteuncentrum rules even though they live two streets from a COCOF-funded service.

---

## 4. Fédération Wallonie-Bruxelles — education, ONE, centres PMS, pôles territoriaux

### 4.1 FWB overview

The **Fédération Wallonie-Bruxelles** is the operational name of the *Communauté française de Belgique*. It is competent for education (compulsory, higher, special), culture, audiovisual, sports, youth, youth aid (*aide à la jeunesse*), and health promotion / preventive health (the curative-care side having largely been transferred to the Walloon Region and COCOF in 1993). For a logopedist, the FWB matters mainly through:

- the **education system** (regular and specialised, plus the inclusive overlay of pôles territoriaux);
- the **centres PMS** (Psycho-Médico-Sociaux), as front-line school health and referral services;
- the **ONE** for early childhood (0–6) screening and family support;
- the **aide à la jeunesse** when paramedical care is reimbursed by the youth-protection administration for youth in placement.

### 4.2 The Pacte pour un Enseignement d'excellence

The *Pacte pour un Enseignement d'excellence* is a long-running structural reform of the FWB compulsory-education system, designed in three phases since 2015 and gradually implemented through a series of decrees from 2018 onwards. Three components matter for logopedic care:

- **Tronc commun.** A new common, longer (M1 → S3) and reinforced curriculum, rolled out progressively. Starting in **September 2026**, the *tronc commun* extends fully into secondary. Co-intervention with a second teacher or a **logopède** in the classroom is one of the differentiation tools provided to teachers.
- **Quality of kindergarten / maternel.** Since 2019, a *Français Langue d'Apprentissage (FLA)* support programme exists for kindergarten students whose teachers identify insufficient mastery of the language of instruction. This is upstream of language-disorder screening and creates a structured referral context to logopedists.
- **Inclusive school**, anchored on the *pôles territoriaux* (see 4.3) and the **DAccE** (*Dossier d'Accompagnement de l'Élève*), a digital file that follows individual support along the schooling trajectory.

### 4.3 Pôles territoriaux

The **pôles territoriaux** are the FWB equivalent of Flanders' *leersteuncentra*. They were created by the **decree of 17 June 2021** (*Décret portant création des pôles territoriaux chargés de soutenir les écoles de l'enseignement ordinaire dans la mise en œuvre des aménagements raisonnables et de l'intégration permanente totale*) and started operating in the **2022–2023 school year** (operational date 29 August 2022).

Key facts:

- A pôle territorial is a structure **attached to a specialised-education school**.
- Each pôle is a **multidisciplinary team of at least 15 staff**: teachers, educators, **logopèdes**, kinésithérapeutes, ergothérapeutes, psychologues, all specialised in learning disorders (dyslexia, dysorthographia, dysphasia, dyspraxia, dysgraphia, dyscalculia, ADHD, high potential, etc.) and/or in disability support.
- There are about **48 pôles** across the **10 education zones** of FWB.
- Every mainstream school signs a **convention de coopération** with one pôle in its zone. The pôle then provides both *missions collectives* (training, advice on differentiation and reasonable accommodations) and *missions individuelles* (direct accompaniment of pupils with specific needs) without requiring those pupils to enrol in specialised education.

For the SaaS, the implication is that a child receiving private logopedic care reimbursed by RIZIV may simultaneously receive school-time support from a salaried pôle territorial logopedist. The two are not mutually exclusive in principle, but the federal nomenclature does not let the same act be billed twice and the logopedist should document the perimeter of their session (curative one-on-one in cabinet vs collective/in-school support).

### 4.4 Enseignement spécialisé (special education)

FWB special education is organised around **8 types** that match the historical Belgian classification (the Flemish *buitengewoon onderwijs* uses the same numbering, although Flanders has been migrating its types under the M-decree since 2015):

| Type | Public visé |
|------|-------------|
| 1 | Retard mental léger |
| 2 | Retard mental modéré ou sévère |
| 3 | Troubles du comportement et/ou de la personnalité |
| 4 | Déficiences physiques |
| 5 | Élèves malades ou convalescents (en hôpital, en convalescence) |
| 6 | Déficiences visuelles |
| 7 | Déficiences auditives — étendu aux élèves aphasiques et dysphasiques |
| 8 | Troubles d'apprentissage (uniquement primaire) |

Notes:

- Types 1 and 8 are not organised at maternal level. Type 8 is not organised at secondary level.
- **Type 7** explicitly covers aphasic and dysphasic pupils, which makes it the type with the densest in-school logopedic staffing.
- Across all types, *séances de rééducation* organised inside the school include logopédie, kinésithérapie, psychomotricité, graphomotricité.

The pôles territoriaux reform aims to **reduce the share of pupils placed in *enseignement spécialisé*** to roughly the 2004 level by **2030**, by providing equivalent support inside mainstream schools.

### 4.5 Centres PMS (Psycho-Médico-Sociaux)

The **centres PMS** are the FWB counterpart of the Flemish CLB. Around **171 centres** operate across the federation (figure cited in 2016, broadly stable since), free of charge, organised across the three networks (WBE/officiel, libre subventionné, officiel subventionné). Their mission is to support the optimal development of students by addressing psychological, medical and social aspects influencing learning and personal development.

For logopedic referral specifically:

- Centres PMS run **early-detection observation in maternal/primary** for language, motor, cognitive and socio-emotional development.
- Since **2019**, the Communauté française has progressively introduced **auxiliaires logopédiques** (logopedic auxiliaries) inside the centres PMS, financed through *soutien à la réussite scolaire en maternel*. Their mission is to observe, identify, and prevent learning difficulties — they do not deliver curative therapy. The introduction of this new profile was politically contested by **UPLF** (the FR professional body), which questioned the auxiliaire status and the boundary with the regulated logopedic profession.

For a logopedist receiving a patient referred by a PMS, the SaaS should expect a written PMS observation as part of the dossier and should treat the PMS as a recurring correspondent (with the parents' consent).

### 4.6 ONE (Office de la Naissance et de l'Enfance)

The **ONE** is the FWB equivalent of the Flemish *Opgroeien* (formerly Kind & Gezin). It is a public-interest organisation (OIP) of type B, originally created by the **decree of 30 March 1983** of the French Community and most importantly **reformed by the decree of 17 July 2002** which redefined its missions. ONE acts in French-speaking territory and in the bilingual Brussels region. Its current management contract (*contrat de gestion*) covers 2021–2025.

ONE missions relevant to logopedic care:

- **Universal pre- and post-natal monitoring** of children 0–6, through *consultations pour enfants* (*consultations PEPS*) staffed by paediatricians and *travailleurs médico-sociaux*.
- **Early detection of developmental delays** including **language acquisition**. ONE has worked with academic researchers (notably Anne-Lise Leclercq, Sophie Kern, David Magis and Christelle Maillart, ULiège/Lyon teams) to develop **rapid large-scale language-screening tools** for use in routine consultations.
- **Referral to logopedists** when developmental concerns are identified ("le médecin évalue si votre enfant a besoin d'un suivi plus spécifique avec une visite chez le médecin traitant, chez un spécialiste — par exemple le logopède").
- **Approval / subsidisation of childcare facilities** (*milieux d'accueil*, crèches, MCAE, *accueillantes conventionnées*) with quality standards and inspections.

For a logopedist, ONE is the upstream funnel: many young patients arrive at the cabinet because an ONE médecin or TMS flagged a language delay during a routine consultation.

### 4.7 Language of care and administration in FWB

- **General rule.** French is the language of administrative and care exchange in FWB territory. Written reports, prescriptions, attestations, and communications with administrations must be in French.
- **Communes à facilités.** Belgium has 27 communes with linguistic facilities (12 NL-language with FR facilities, 4 FR-language with NL facilities, plus communes with German facilities). The legal framework is the **laws of 8 November 1962 and 2 August 1963** on linguistic use in administrative matters. In a Walloon commune with German or Dutch facilities (e.g. Comines-Warneton, Mouscron, Enghien, Flobecq, Malmedy, Waimes for German), inhabitants of the linguistic minority can request administrative documents in their own language. Health-care delivery itself is not regulated as strictly as administration, but a self-employed logopedist who works in such a commune should be ready to provide reports in the requested language for administrative purposes.
- **Brussels.** In bilingual Brussels, the patient chooses the language of interaction; institutions registered as bicommunal (under COCOM/Iriscare) must serve patients in both French and Dutch, while uni-communal institutions only operate in their registered language.

### 4.8 Aide à la jeunesse (youth aid)

The FWB *aide à la jeunesse* is structured by the **decree of 4 March 1991** which created **13 SAJ** (Services de l'aide à la jeunesse) and **13 SPJ** (Services de la protection de la jeunesse) — one of each per judicial district in the French Community. The SAJ acts on a voluntary basis at the request of families or referrers; the SPJ implements decisions of the Tribunal de la Jeunesse. The general administration is **AGAJ** (Administration générale de l'aide à la jeunesse).

For a logopedist:

- A child placed by SAJ/SPJ in a recognised institution (or in an *accueil familial*) may receive logopedic care reimbursed by AGAJ when the placement service requests **prior approval** from AGAJ for paramedical treatments. Logopédie is on the list of reimbursable paramedical care alongside kinésithérapie, psychomotricité and psychothérapie.
- The reimbursement track is *not* the federal RIZIV mutualité track in this case — it goes through the placement service, which then claims back from AGAJ. The SaaS should support an alternative invoicing path for these patients (recipient = placement service, not the patient or the mutuality).

---

## 5. German-speaking Community — DG / Ostbelgien and DSL

### 5.1 The DG's unique constitutional position

The **Deutschsprachige Gemeinschaft Belgiens** (DG, also branded *Ostbelgien*) is Belgium's smallest federated entity, covering the 9 communes of the German-language region in the Eupen-Sankt Vith area. By a series of agreements with the Walloon Region, the DG has progressively absorbed Walloon-Region competences for its own territory in matters such as **employment, monuments and sites, local governance**, and notably (since 1 January 2020) **family allowances** and **disability policy**, which is what makes the DG functionally autonomous from AVIQ for its residents.

This means a logopedist treating a patient resident in the DG navigates:

- **Federal RIZIV** for nomenclature reimbursement (same rules as everywhere else),
- **DG community** for education, school health (Kaleido), youth aid, family allowances,
- **DG-as-Region** (via competence transfer) for disability policy, through DSL.

### 5.2 Dienststelle für Selbstbestimmtes Leben (DSL)

The **Dienststelle für Selbstbestimmtes Leben** (DSL — "Office for Self-Determined Living") is the DG's disability-policy agency, the equivalent of VAPH in Flanders, AVIQ-Handicap in Wallonia, and PHARE in COCOF Brussels. DSL is a *Dienststelle* of the Ministry of the German-speaking Community, headquartered in **Sankt Vith** (with a branch in Eupen).

Key functions:

- **Single intake point** for help/care needs (*zentrale Anlaufstelle bei Hilfe- und Pflegebedarf*) for children, adolescents, adults and seniors.
- **Need assessment** using the **BelRAI Screener** (the Belgian RAI-derived assessment instrument), which gives DSL its priority allocation.
- **Funding of accompaniment, day care, residential care** services for persons with disabilities.
- **Individual budgets and material aids**, broadly analogous to PHARE's individual aids in Brussels and to AVIQ's *aides matérielles* in Wallonia (with the same 1 January 2024 federal-mutualité shift for many material aids).
- **Recognition of multidisciplinary therapy services** that can include logopedic care as part of a comprehensive package.

For logopedic care specifically: in the DG, **independent logopedists are scarce** — published reports mention waiting lists of around **6 months** for an independent logopedist, and multidisciplinary therapy programmes for children/adolescents typically include **Logopädie as part of a package** rather than as a standalone service. This makes the federal nomenclature flow rarer in proportion than in Wallonia or Flanders, and the DSL/Kaleido/multidisciplinary-centre flow proportionally more important.

### 5.3 DG education system

The DG education system is organised around three networks: **Gemeinschaftsunterrichtswesen (GUW)** (community-organised), **offiziell subventioniertes Unterrichtswesen (OSUW)** (official subsidised), and **frei subventioniertes Unterrichtswesen (FSUW)** (free subsidised — mainly catholic). The Parliament of the DG enacts education decrees; a foundational text is the **decree of 31 August 1998** on education, school project and society.

Inclusion policy in the DG:

- The DG operates a **Zentrum für Förderpädagogik (ZFP)** in Eupen, which is the DG's specialised-education and inclusion-support hub.
- Mainstream schools collaborate with **Kaleido** for individual support plans for pupils with disabilities or learning difficulties.
- The DG has been an active participant in EU inclusion projects (e.g. the "I AM" Inclusive Assessment Map, 2021).
- Schools in the DG operate under German-language pedagogy and teacher-training rules; logopedists working *in* schools as ZFP staff are typically German-trained or German-speaking Belgian-trained.

### 5.4 Kaleido Ostbelgien — early detection and screening

**Kaleido Ostbelgien** is the DG's integrated child- and youth-development centre, created in **September 2014** through the merger of:

- the former PMS centres of the German-speaking Community,
- the *Dienst für Kind und Familie* (DKF — the DG counterpart of ONE / Kind & Gezin),
- the *Gesundheitszentren*,
- the school dental care services,
- the AIDS prevention service.

Kaleido covers children 0–20 and provides developmental support, prevention, observation and consultation. Its multidisciplinary teams include staff in **Logopädie, Ergotherapie, Pädagogik, Kinesithérapie**. Crucially, Kaleido does **not** issue medical diagnoses — it screens, observes, and refers to appropriate diagnostic and therapeutic services.

For logopedic referral, Kaleido is the single most important upstream actor in the DG: it combines the early-childhood role of ONE and the school-age role of the centres PMS into one institution.

### 5.5 DG language obligation

**German is the administrative language** of the DG. Decrees of the DG Parliament are German-language; communications with DG administrations (Ministerium der Deutschsprachigen Gemeinschaft, DSL, Kaleido, ZFP) must be in German. Patient files, recognition requests, individual-aid demands, and school-related documents must be issued in German.

Practical points for a SaaS:

- Patient-facing UI for DG patients should be German.
- Written reports for DSL or Kaleido must be German.
- Federal RIZIV documents (prescription, attestation, eAttest) can remain in any of the national languages, but a German-language version is normal practice for German-speaking patients.
- A logopedist not professionally fluent in German cannot reasonably operate as a primary care provider to DG patients.

### 5.6 Logopedist training and professional bodies in the DG

There is **no autonomous logopedist training pathway organised by the DG**. German-speaking Belgian logopedists either:

- complete training in **French-speaking Belgium** (Haute École or Master at universities such as ULiège, UCLouvain, ULB) and seek German linguistic mastery to work in the DG;
- complete training in **German-speaking Belgium border programmes** at hochschulen across the border (Aachen, Cologne) or in dedicated *Logopädieschulen* in Germany, then have their diploma recognised in Belgium via the federal recognition route (NARIC or SPF Santé publique equivalence procedure);
- or, more rarely, complete training in **Flanders** (Dutch-language Bachelor in *logopedie*) and operate trilingually.

There is **no DG-specific professional order or chamber** for logopedists. The federally recognised professional bodies remain **UPLF** (Union professionnelle des logopèdes francophones) on the French side and **VVL** (Vlaamse Vereniging voor Logopedisten) on the Dutch side. UPLF is the de-facto reference body for German-speaking-Belgian logopedists working in or near the DG, given the strong historical link to ULiège and the French Community framework, but DG colleagues frequently maintain dual ties.

---

## 6. Comparative summary table (Flanders / Wallonia / Brussels / DG)

| Dimension | Flanders | Wallonia | Brussels | German-speaking Community (DG) |
|---|---|---|---|---|
| **Disability-support agency** | VAPH (Vlaams Agentschap voor Personen met een Handicap) | AVIQ-Handicap | COCOF: Service PHARE / COCOM: Iriscare / Flemish patients: VAPH | DSL (Dienststelle für Selbstbestimmtes Leben) |
| **Person-following budget** | Persoonsvolgend budget (PVB), large envelope | Budget d'assistance personnelle (BAP), much smaller envelope (~€5k–€35k) | PHARE has its own BAP-equivalent for FR Brussels; NL Brussels routes through VAPH-PVB | DSL individual budgets via BelRAI screener |
| **Material aids (post-1-Jan-2024)** | Largely federalised to mutualités, residual VAPH list | Largely federalised to mutualités, residual AVIQ list | Largely federalised to mutualités/CAAMI, residual PHARE list | Federalised to mutualités, residual DSL list |
| **School-based learning support** | Leersteuncentra (M-decree, 2014; reform 2023) | Pôles territoriaux (Décret 17 juin 2021, opérationnels 2022) | FR schools: pôles territoriaux (FWB) / NL schools: leersteuncentra (Flemish) | Zentrum für Förderpädagogik (ZFP) + Kaleido |
| **Special education** | Buitengewoon onderwijs, types 1–9 (Flemish numbering after M-decree) | Enseignement spécialisé, types 1–8 | Same FR or NL system depending on language régime of school | DG-organised special education, German-language |
| **School psycho-medico-social** | CLB (Centra voor Leerlingenbegeleiding) | Centres PMS (PMS), with auxiliaires logopédiques since 2019 | FR schools: PMS / NL schools: CLB | Kaleido (integrated PMS + DKF + health centres) |
| **Early-childhood agency (0–6)** | Opgroeien (formerly Kind & Gezin) | ONE (Office de la Naissance et de l'Enfance) | ONE (FR) and Opgroeien (NL) operate in parallel | Kaleido (also covers DKF function) |
| **Language of care/admin** | Dutch | French | French and Dutch (institution-dependent) | German |
| **Where logopedic curative care fits** | Federal RIZIV nomenclature primary, Flemish add-ons secondary | Federal RIZIV primary, AVIQ-recognised services secondary | Federal RIZIV primary, COCOF/COCOM/VAPH secondary depending on language régime | Federal RIZIV primary, DSL/Kaleido/multidisciplinary packages secondary |
| **Youth-aid paramedical reimbursement** | Jeugdhulp / Agentschap Opgroeien Regie | AGAJ via SAJ/SPJ (decree 4 March 1991) | AGAJ FR / Jeugdhulp NL | DG Jugendhilfsdienst (JHD) |

---

## 7. Freshness notes

- **AVIQ branches and consultative function** changed on 1 January 2024 (general council and three branch committees now exercise the consultative function under their new statutes). Verify current composition annually.
- **Material aids transferred from AVIQ/PHARE to mutualités on 1 January 2024.** This is the single most important recent change for SaaS workflows. If a feature lets a logopedist generate an "aide matérielle" request for a patient, it must default to the mutualité track and only fall back to AVIQ/PHARE/DSL for the residual list.
  - **[2026-04-06 RESOLVED]** Verification pass confirmed the strict residual PHARE list (4 categories): pedagogical accompaniment, course transcriptions, school-only video-loupes with double camera, and workplace/training-post adaptation aids. All other categories — including communication devices and AAC tablets/software — go through the mutualité / CAAMI / Iriscare nomenclature route. The Service PHARE website (`phare.irisnet.be`) closed permanently on **4 November 2025**; canonical sources are now `ccf.brussels` (COCOF/PHARE rules and forms) and `handicap.brussels` (cross-cutting Brussels disability portal). See `verification-2026-04/06-other-regions.md` item 4.
- **Pôles territoriaux** were created by decree of 17 June 2021 and started operating in 2022–2023; the reform is still consolidating, and the *liste des pôles* has been adjusted in successive ministerial decisions. Always re-fetch the current pôle list from `enseignement.be` or `wbe.be` when integrating.
  - **[2026-04-06 RESOLVED]** Verification pass confirmed **48 pôles across 10 zones** is stable for school year 2024–2025 and 2025–2026. The official PDF list still bears its 20 December 2022 date stamp; updates are propagated through ministerial circulars (notably 8985/2023, 9202/2024, 9357/2024 and 9466/2025). No pôle has been added or suppressed since 2023. See `verification-2026-04/06-other-regions.md` item 3.
- **Auxiliaires logopédiques in centres PMS — [2026-04-06 RESOLVED]** verified that the function is **still in force** in 2025–2026, with active recruitment notices from PMS centres (Liège, Wavre, Jodoigne, Charleroi, etc.). Created by the FWB Parliament reform of centres PMS adopted on **2 May 2019**, operational from 1 June 2019. UPLF maintains its opposition (restricted to bachelor-level recruitment, exclusion of master-level logopèdes), but no successor decree or court decision has abolished or restricted the function. See `verification-2026-04/06-other-regions.md` item 2.
- **BAP envelope — [2026-04-06 PARTIAL]** the 2024 figure of ~€4.4M is not contradicted by current sources but no fresh AVIQ headline confirms a 2025 figure either. The **2026 Walloon Budget** explicitly cuts the BAP line by **−€1.5M** (justified by ~30% structural under-consumption) and reinforces a separate "situations prioritaires" line by **+€5M**. AVIQ-wide cuts in 2026: €28.3M mission refocusing + €5.6M operating-allocation freeze. Re-verify against the AVIQ *Manuel des subventions* and annual report. See `verification-2026-04/06-other-regions.md` item 5.
- **DG inclusion / Förderpädagogik decrees — [2026-04-06 PARTIAL]** the foundational text remains the **Dekret vom 11. Mai 2009** *über das Zentrum für Förderpädagogik* (which created the ZFP and the *Kompetenzzentrum* model). No separate "inclusion decree" replaced it; updates flow through annual *Dekrete über Maßnahmen im Unterrichtswesen* (most recent: 2023 in third reading 17 May 2023; 2024 in third reading 28 March 2024). The **DG government's planned reform** of the ZFP into a network-neutral *Einrichtung öffentlichen Rechts* (announced December 2021, originally targeted for 2024) has either slipped or completed silently — re-verify before publishing customer-facing material. See `verification-2026-04/06-other-regions.md` item 1.
- **Tronc commun** rolls out further in **September 2026** in secondary; if the SaaS surfaces school-context information for adolescent patients, prepare for the new curriculum's classification of pupils with specific needs.
- **DAccE** (Dossier d'Accompagnement de l'Élève) — the digital pupil-support file — is a moving target; the FWB continues to refine inter-actor data exchange and consent rules.
- **DG family allowances and DSL competences** were transferred from the Walloon Region in steps culminating in 2020. Cross-checks for DG residents should never assume AVIQ competence.
- **PHARE 2024 reform of admission rules** — re-verify the current admission procedure on `ccf.brussels` and `handicap.brussels` before integrating PHARE-related forms into the SaaS. (The legacy `phare.irisnet.be` site was decommissioned 4 November 2025.)

---

## 8. Sources

**Walloon Region — AVIQ**
- AVIQ — Accueil, Missions et vision, Histoire de l'AVIQ — https://www.aviq.be/fr
- AVIQ — Comités de branche — https://www.aviq.be/fr/organes-de-gestion/comites-de-branche
- AVIQ — Adresses (bureaux régionaux) — https://www.aviq.be/fr/adresses
- AVIQ — Budget d'assistance personnelle (BAP) — https://www.aviq.be/fr/vie-quotidienne/aides-la-vie-quotidienne/budget-dassistance-personnelle-bap
- Wikiwiph (AVIQ) — BAP, bureaux régionaux, critères d'admissibilité, PHARE — https://wikiwiph.aviq.be
- AVIQ — Services d'accompagnement (jeunes enfants, jeunes en âge scolaire) — https://www.aviq.be/fr/scolarite-et-formation/scolarite/soutien-a-la-scolarite/accompagnement-des-jeunes-enfants
- Décret du 3 décembre 2015 relatif à l'AVIQ — https://wallex.wallonie.be/contents/acts/6/6151/1.html
- Wallonie.be — Bureau régional AVIQ — https://www.wallonie.be/fr/demarches/me-renseigner-aupres-de-mon-bureau-regional-de-laviq
- Sabine Roberty — Le développement des points Handicontact — https://sabineroberty.be/le-developpement-des-points-handicontact/

**Brussels — Iriscare / COCOM / COCOF / PHARE / VGC**
- Iriscare — Citoyens / Personnes en situation de handicap — https://www.iriscare.brussels/fr
- Iriscare — Centres handicaps sensoriels — https://www.iriscare.brussels/fr/citoyens/personnes-en-situation-de-handicap/centres-handicaps-sensoriels/
- COCOM / GGC — Compétences, historique, exercice des matières personnalisables — https://www.ccc-ggc.brussels/fr/qui-sommes-nous/competences
- Vivalis — Compétences et histoire — https://www.vivalis.brussels/fr/competences
- Service PHARE (COCOF) — https://phare.irisnet.be
- COCOF / Francophones Bruxelles — Service PHARE — https://ccf.brussels/nos-services/personnes-handicapees/
- handicap.brussels — Reconnaissance par PHARE et par Iriscare — https://www.handicap.brussels/fr/themes/linformation-et-la-reconnaissance-du-handicap
- handicap.brussels — Aides individuelles, BAP, services d'accompagnement à l'inclusion scolaire — https://www.handicap.brussels
- PHARE — Aides individuelles 2024 (transfert vers mutualités/CAAMI) — https://phare.irisnet.be/aides-individuelles-2024/
- VGC — Wie zijn wij, Onderwijscentrum Brussel — https://www.vgc.be
- CRISP / Jean Faniel — Santé : une répartition complexe des compétences (2021) — https://www.crisp.be
- Fédération des maisons médicales — Une répartition complexe des compétences — https://www.maisonmedicale.org/Une-repartition-complexe-des-competences/

**Fédération Wallonie-Bruxelles — education, ONE, PMS, pôles territoriaux**
- Pacte pour un Enseignement d'excellence — https://pactepourunenseignementdexcellence.cfwb.be
- Pacte excellence — Pôles territoriaux pour une école inclusive — https://pactepourunenseignementdexcellence.cfwb.be/mesures/des-poles-territoriaux-pour-une-ecole-inclusive/
- Pacte excellence — Tronc commun, qualité du maternel — https://pactepourunenseignementdexcellence.cfwb.be/mesures/le-tronc-commun-un-nouveau-parcours/
- Décret du 17 juin 2021 — pôles territoriaux — https://etaamb.openjustice.be/fr/decret-du-17-juin-2021_n2021031947.html
- Gallilex / cfwb — Texte du décret 17 juin 2021 — https://gallilex.cfwb.be/sites/default/files/imports/50856_000.pdf
- Vademecum Pôles territoriaux (CECP, mars 2022) — https://www.cecp.be/refeos/wp-content/uploads/2022/03/VADEMECUM-Poles-territoriaux-Version-finale.pdf
- Enseignement.be — Pôles territoriaux — http://www.enseignement.be/index.php?page=28585
- WBE — Centres psycho-médico-sociaux (CPMS) — https://www.wbe.be/soutien/centres-psycho-medico-sociaux-cpms/
- Guide social (UPLF) — Auxiliaires logopédiques dans les CPMS, la grogne de l'UPLF — https://pro.guidesocial.be/articles/actualites/auxiliaires-logopediques-dans-les-centres-pms-la-grogne-de-l-uplf
- ONE — Missions, dépistages, langage — https://www.one.be
- ONE — Décret du 17 juillet 2002 portant réforme de l'ONE — https://www.pfwb.be/documents-parlementaires/document-pjd-000331680
- Contrat de gestion ONE 2021–2025 — https://www.one.be/fileadmin/user_upload/siteone/PRESENTATION/C_est_quoi_l_ONE/Contrat-de-gestion-2021-2025-signature.pdf
- Belgium.be — Enseignement spécialisé — https://www.belgium.be/fr/formation/enseignement/specialise
- Aide à la jeunesse FWB — https://www.aidealajeunesse.cfwb.be
- Décret du 4 mars 1991 — Aide à la jeunesse — https://www.aidealajeunesse.cfwb.be
- Wikipédia — Facilités linguistiques en Belgique — https://fr.wikipedia.org/wiki/Facilit%C3%A9s_linguistiques_en_Belgique
- Adjoint du gouverneur — Le régime des facilités — https://www.adjunctvandegouverneur.be/fr/les-facilites/le-regime-des-facilites

**German-speaking Community — DG / Ostbelgien**
- Dienststelle für Selbstbestimmtes Leben (DSL) — https://selbstbestimmt.be
- Ostbelgien Live — DSL, BelRAI Einstufung — https://ostbelgienlive.be/desktopdefault.aspx/tabid-7513/
- Ostbelgienfamilie — DSL Beratungsstelle — https://ostbelgienfamilie.be
- Kaleido Ostbelgien — https://www.kaleido-ostbelgien.be
- Info Integration — Kaleido Ostbelgien Zentrum — https://info-integration.be
- Ostbelgien Bildung — Schulnetze und Bildungssystem — https://ostbelgienbildung.be
- Ministerium der DG — Organisation des Bildungssystems in der Deutschsprachigen Gemeinschaft Belgiens (publication) — https://ostbelgienstatistik.be
- Stadt Eupen — Inklusion und Förderung — https://www.eupen.be/leben-in-eupen/bildung-und-schule/inklusion-und-foerderung/
- Zentrum für Förderpädagogik (ZFP) Eupen — http://www.zfp.be
- Antoniadis — Die Angebote im Bereich Logopädie in der Deutschsprachigen Gemeinschaft — http://www.antoniadis.be/cms/?p=5894

**Cross-cutting / professional**
- UPLF — Domaines d'intervention — https://www.uplf.be
- INAMI / RIZIV — Logopédie tests et nomenclature — https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes
- ejustice.just.fgov.be — search interface for FWB, DG and Walloon decrees
