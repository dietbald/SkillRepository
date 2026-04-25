# 03 — eHealth, MyCareNet, eAttest, eFact: Digital Infrastructure for Belgian Logopedists

> Last verified: 2026-04-06
> Scope: Federal digital-health infrastructure that a logopedist SaaS must integrate with
> Audience: halingo.be product, billing and compliance team

This document is the technical-integration reference for the Belgian federal digital-health stack as it applies to **logopedisten / logopèdes**. Where information is doctor- or kine-centric in primary sources (which is most of the time, because logopedists are still a low-priority sector for the federal rollout), the document explicitly flags it. Section 11 records the freshness state and known unknowns.

---

## 1. The federal eHealth platform — overview

The **eHealth-platform** (NL: *eGezondheid*, FR: *plate-forme eSanté*) is a federal public-sector institution created by the law of 21 August 2008. It is run as an *openbare instelling van sociale zekerheid* under the supervision of the Minister of Social Affairs and Public Health, and is housed at *Willebroekkaai 38, 1000 Brussel / Quai de Willebroeck 38, 1000 Bruxelles*. Its statutory mission is to provide a secure, federated and interoperable infrastructure on which all Belgian healthcare actors can exchange data.

It does **not** itself store medical records. It is an integration and identity layer that connects:

- The federal authentic sources (RIZIV/INAMI, Rijksregister, KBO/BCE, FOD Volksgezondheid).
- The seven **mutualiteiten / mutualités** via their joint operator CIN/NIC (see section 3).
- The five **regional health vaults / kluizen / coffres-forts**: Vitalink (Flanders), Réseau Santé Wallon (RSW), Réseau Santé Bruxellois (RSB / Abrumet / BruSafe+), Cozo, etc.
- ICT vendors that build provider-side software.

Service portfolio. The eHealth-platform exposes its services in two layers:

1. **Basic services**, free of charge and used by every healthcare actor. The list (as of the API portal at <https://portal.api.ehealth.fgov.be>) currently includes:
   - **IAM-STS** — Secure Token Service (issues SAML 2.0 *Holder-of-Key* assertions used by every backend service).
   - **CertRA / EtkRA** — eHealth certificate authority + ETK depot for end-to-end encryption keys.
   - **eHealthBox** — secure messaging mailbox (SOAP v3.0 and REST v1.2).
   - **Consent** — patient consent registry (SOAP v1.4 and REST v2.3).
   - **TherapeuticLink (TherLink)** — registration of therapeutic relationships and exclusions.
   - **AddressBook / CoBRHA** — authentic source for healthcare providers and organizations.
   - **eHealthConsult / Reference Directory** — index pointing to where a patient's data lives.
   - **Timestamping**, **Logging**, **Audit**.
   - **Software Register** — central catalogue of software packages that integrate with eHealth/CIN/RSW/RSB/Vitalink.

2. **Value-added services**, often built jointly with another partner. The most important ones for this project are the **MyCareNet** services (run with CIN/NIC, see section 3), **PARIS** (electronic prescription), **eHealthBox**, **Recip-e** (e-prescription back end), **SumEHR** publication via Vitalink/RSW/RSB, **Sumehr/KMEHR** standards, **ProGezondheid** (provider portal), and **MaSanté/MijnGezondheid** (citizen portal).

The official portal is <https://www.ehealth.fgov.be/ehealthplatform/nl/> (Dutch) / <https://www.ehealth.fgov.be/ehealthplatform/fr/> (French). The provider-facing landing page is <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg> / `…/fr/professionnels-de-la-sante`. The status dashboard is <https://status.ehealth.fgov.be>.

---

## 2. How a logopedist gets on the platform

### 2.1 Prerequisites

A Belgian logopedist needs three things before any software can talk to eHealth on their behalf:

1. A **RIZIV/INAMI number** (NIHII), 11 digits, with the discipline code reserved for logopedie. It is issued by RIZIV after the logopedist has obtained the FOD Volksgezondheid visa and the regional *erkenning* (Vlaamse Gemeenschap, FWB, etc.). Application is made via the form *Aanvraag tot inschrijving als logopedist bij het RIZIV* / *Demande d'inscription comme logopède auprès de l'INAMI*. Contact for logopedists: `logonl@riziv-inami.fgov.be` (NL) / `logonom@riziv-inami.fgov.be` (FR), tel. +32 2 739 74 79.
2. A **Belgian eID** (or, increasingly, an **itsme** account linked to the eID). This is what authenticates the natural person.
3. An **INSZ/NISS** social-security number (or BIS-number for non-residents). RIZIV registration uses INSZ as the identity anchor.

### 2.2 The eHealth certificate

For machine-to-machine access (i.e. SaaS integration), a logopedist must hold an **eHealth certificate**. This is a PKCS#12 keystore (`.p12` / `.acc-p12` file in acceptance) bound to the NIHII; it identifies the IT system, not the human. Properties:

- **Validity**: 3 years (36 months). Renewal can start 90 days before expiry.
- **Type**: there is an *individual* certificate (per natural-person care provider, keyed on NIHII or INSZ) and an *organization* certificate (per care institution, keyed on KBO/BCE number — used by group practices).
- **Issuance**: through the **eHealth Certificate Manager** (CertMan) web app at <https://www.ehealth.fgov.be/ehealthplatform/nl/service-ehealth-certificaten>. Strong authentication with eID is required. Non-Belgian providers without an eID can use the *hybride methode*. Issuance can take up to ~10 working days.
- **Underlying CA**: requests go through the **CertRA** (Certificate Registration Authority) basic service. The cookbook *eHealth platform Certificates Manager (CertRA-EtkRA) v2* documents the WSDL.
- **Pickup**: the certificate file is downloaded by the practitioner; the password is set during issuance and is also the private-key password for the encryption ETK published in **EtkDepot**. Vendors must store this securely (HSM-grade or password-encrypted keystore at minimum).

### 2.3 Authentication modes

Two distinct flows have to be implemented in any provider-side product:

- **Person-flow (web SSO)**: the logopedist logs in to a portal such as ProGezondheid, MyHealthViewer, MyCareNet portal, CoZo, RSW, etc. Authentication runs through **CSAM**, the federal IAM bus, and supports **eID + card reader**, **itsme**, and (sometimes) TOTP. The session is bound to the natural person's INSZ.
- **System-flow (SaaS / token-based)**: the back end requests a SAML 2.0 *Holder-of-Key* token from the **eHealth STS** (`/IAM/SecurityTokenService`) by signing the request with the NIHII-bound eHealth certificate. The returned assertion has identification attributes (`urn:be:fgov:person:ssin`, `urn:be:fgov:nihii11:…`) and certification attributes (e.g. `urn:be:fgov:certified-namespace:ehealth:profession:logopedist:nihii11:boolean=true`). All MyCareNet calls are then made by sending the SAML token in the SOAP header, signing the body and timestamp with the same certificate, and transporting over one-way TLS.

A SaaS like halingo.be needs to support **mandate / volmacht** flows: a logopedist (mandator) can grant a software vendor or a colleague a mandate (registered in the **Mandates** authentic source managed by the FOD/SPF Sociale Zekerheid via the Mandates web service). The vendor's certificate then carries a "mandate-holder" role and can call services on behalf of the logopedist. This is how multi-tenant SaaS architectures can issue calls per-NIHII without holding every individual practitioner's keystore.

### 2.4 Group practices

For a *groepspraktijk / cabinet de groupe* of logopedists, two patterns exist:

- **Multiple individual certificates**: each logopedist has their own NIHII and own eHealth certificate, and the SaaS holds (or has mandates for) all of them.
- **Organization certificate**: the praktijk is registered as a healthcare organization in the CoBRHA authentic source and obtains an organization-level eHealth certificate keyed on the KBO/BCE number. CoBRHA recognizes a number of organization types (group practice, *medisch huis*, *wijkgezondheidscentrum*, hospital, polyclinic, etc.). For pure logopedie group practices the maturity of this flow is patchy — most actually run on individual certificates plus mandates, because MyCareNet billing services are still keyed on the individual NIHII of the executing logopedist.

---

## 3. MyCareNet — architecture, services, certification

### 3.1 What it is

**MyCareNet (MCN)** is the joint service platform of the Belgian mutualities. It is operated by the **CIN/NIC** — *Collège Intermutualiste National / Nationaal Intermutualistisch College* — which is the umbrella body of the seven national mutualities (CM, Solidaris, NL/VL Mutualiteiten Liberale, Onafhankelijke Ziekenfondsen, Neutrale Ziekenfondsen, HZIV/CAAMI, *Caisse des soins de santé HR Rail*). Operational entity: NIC asbl/vzw, *Manhattan Center, Bolwerklaan 21 box 7, 1210 Sint-Joost-ten-Node*.

MyCareNet is the only sanctioned channel through which a care provider can talk to the mutualities for administrative and financial flows: insurability, billing, attestation, agreement requests, fee consultation. It runs **on top of** the eHealth platform: every MCN call passes through the eHealth Service Bus (ESB), which validates the SAML token from the STS, then forwards to the CIN/NIC backend.

Public sites:
- NL: <https://ned.mycarenet.be>
- FR: <https://fra.mycarenet.be>
- Production portal (legacy + new): <https://www.mycarenet.be> and <https://prod.mycarenet.be/portal/home.seam>
- Technical SharePoint for vendors: <https://share.intermut.be/home/MyCareNet/Extranet> (account required, requested via the contact form on ned/fra MyCareNet).

### 3.2 Services per sector

The MyCareNet site organizes its catalogue per *sector* (profession). The current matrix relevant to halingo.be:

| Sector | Insurability | Member Data | eAttest | eFact (tiers payant) | eAgreement | eTar |
|---|---|---|---|---|---|---|
| Artsen / Médecins | yes | yes | yes | yes | partial | yes |
| Tandartsen / Dentistes | yes | yes | yes (mand. 2025-09-01) | yes (mand. 2025-09-01) | yes (Ch. IV) | yes |
| Kinesitherapeuten | yes | yes | yes | yes | yes (Fa/Fb/E) | partial |
| Verpleegkundigen | yes | n/a | n/a | yes | n/a | n/a |
| Apothekers | yes | n/a | n/a | n/a | yes (Ch. IV) | n/a |
| **Logopedisten** | **via Generic Insurability + MDA** | **via MDA** | **not in production for the sector (as of 2026-04)** | **eFact track via sector "andere"; in practice still paper for many** | **eAgreement Logo profile published in MCN FHIR IG, see §3.5** | n/a |
| Laboratoria, Tariferingsdiensten, Ziekenhuizen, RVT/MRS, Medische Huizen | various | various | n/a | yes | partial | various |

This is the most consequential finding for halingo.be: **as of April 2026 the MyCareNet portal does not list eAttest or eFact tiles under a dedicated *Logopedisten* sector page**. The kinesitherapeut sector page (`https://fra.mycarenet.be/services-par-secteur/kinésithérapeutes`) explicitly lists *Assurabilité, Member data, Tiers Payant, Facturation, eAttest, eAgreement, Logiciels agréés*. The equivalent logopedist sector page is much thinner. CIN/NIC has *built* the FHIR profiles for logopedists (eAgreement Logo) and the underlying generic insurability and member-data services are profession-agnostic, but the full eAttest/eFact rollout for logopedists has not happened. In practice, logopedists still file paper monthly summary statements for the third-party-payer track (see section 5), and use the generic insurability check + the eAgreement Logo profile where their software supports it.

### 3.3 Technical architecture

- **Transport**: SOAP 1.1 over HTTPS (one-way TLS). Some newer services (eAgreement) are now also exposed as **FHIR R4 REST** profiles published as the *Belgian MyCareNet Profiles IG* (current version 2.1.2, see <https://www.ehealth.fgov.be/standards/fhir/mycarenet/toc.html>).
- **Security**: SAML 2.0 *Holder-of-Key* assertion in the SOAP header (from the eHealth STS). Body and timestamp signed with the certificate whose public key is in the SAML assertion. Payload often **encrypted end-to-end** to the CIN/NIC public key (KGSS / ETEE). Encryption is performed using ETK published in `EtkDepot` under the application id `MYCARENET` and the CBE id `0820563481` (this id appears in production, acceptance and integration environments).
- **WS-I**: requests must be WS-I Basic Profile 1.1 compliant.
- **Tracing**: as of cookbook v1.4 (2022-07-29), every request SHOULD carry a `User-Agent` header following the pattern `{product}/{version} {connector}/{version}` and a `From` header with an emergency-contact email. CIN/NIC uses these to call the right vendor when something melts down in production.
- **Endpoints** (illustrative for MemberData, the pattern is the same per service):
  - Acceptance: `https://services-acpt.ehealth.fgov.be/MyCareNet/MemberData/v1`
  - Production: `https://services.ehealth.fgov.be/MyCareNet/MemberData/v1`
- **Helpdesks**:
  - eHealth platform contact centre: `support@ehealth.fgov.be`, +32 2 788 51 55, working days 07:00-20:00.
  - eHealth acceptance: `acceptance-certificates@ehealth.fgov.be`, `integration-support@ehealth.fgov.be`.
  - MyCareNet business helpdesk (CIN/NIC): `support@intermut.be`, +32 2 891 72 56.
  - MyCareNet technical helpdesk: `ServiceDesk@MyCareNet.be`, +32 2 431 47 71.
  - eHealth status page: <https://status.ehealth.fgov.be>.

### 3.4 Test / acceptance environment

Each service has an **acceptance** environment that mirrors production. To use it, a vendor must:

1. Email `info@ehealth.fgov.be` with the *request test case* template available on the eHealth portal. This creates a test NIHII with the right service profile.
2. Request a **test eHealth certificate** for that NIHII through CertMan. The same certificate is used for STS authentication and for the Holder-of-Key signature.
3. Use the acceptance STS endpoint and acceptance MCN endpoints.
4. Run a documented set of test cases (per service the cookbook lists them). For MyCareNet services, vendors also need a SharePoint account (`https://share.intermut.be`) and CIN/NIC will provide test patient files.

The same certificate-based access rules apply in acceptance and in production. Vendors must keep test and production keystores strictly separated.

### 3.5 Where to find the technical specs

- **eHealth API portal** (production catalogue): <https://portal.api.ehealth.fgov.be>. WSDL/XSD contracts per service. Contains MyCareNet eAttest v3.2, eAgreement v2.0/v1.1, MemberData v1.0, GenericInsurability, plus eHealthBox (SOAP v3.0 / REST v1.2), Consent (SOAP v1.4 / REST v2.3), STS v1.3, AddressBook v1.2 and ~100 other APIs.
- **Acceptance portal**: <https://portal-acpt.api.in.ehealth.fgov.be>.
- **Cookbooks** (PDF, free, downloadable from the eHealth portal):
  - *MyCareNet MemberData Cookbook v1.4* (2022-07-29) — <https://www.ehealth.fgov.be/ehealthplatform/file/.../mcn-memberdata-v1.4-dd-29072022.pdf>.
  - *MyCareNet Generic Insurability Cookbook v1.4* (2022-07-29).
  - *MCN eAttest WS V3 Cookbook v1.2* (2022-08-04).
  - *eHealth SSO – MCN eAttest v3 v1.1* (2024-10-10).
  - *MCN Tarification (eTar) Cookbook v1.0*.
  - *eHealth STS — Holder of Key cookbook v1.5* (2022-07-13).
  - *eHealth Id Support WS Cookbook v1.5* (2022-07-19).
  - *eHealth platform Certificates Manager (CertRA-EtkRA) v2*.
  - *SOA – Error Guide v1.0* (2021-06-10).
- **Belgian MyCareNet FHIR profiles IG v2.1.2** — <https://www.ehealth.fgov.be/standards/fhir/mycarenet/toc.html>. Includes the **`MyCareNet eAgreement Claim Logo BE`** profile (`StructureDefinition-be-eagreementclaim-logo`) — the only FHIR profile in the catalogue specifically built for logopedists. It is a `Claim` resource with `status=active`, `use=preauthorization`, mandatory `patient`, `provider`, `insurance.focal=true`, optional `supportingInfo`, and a *Speech Therapy Pathology Situation Code* value set bound to the `item.productOrService`.
- **CIN-NIC SharePoint**: <https://share.intermut.be/home/MyCareNet/Extranet> — vendor-only, request via `https://ned.mycarenet.be/contact` or `https://fra.mycarenet.be/contact`. Holds the *FR-ADOC-MEMD-ALL Données du membre - Description du message*, *Service_Catalogue_iSocial_GenSync*, *NIPPIN GenSync V3 (ESB 2 NIPPIN)*, *MyCareNet Authentication Catalogue*, and per-service error tables (e.g. *BE-ADOC-MEMD-ALL Member Data - Matrix by sector*).
- **Open-source connectors**: vendors very often start from these even though they are unofficial:
  - **freehealth-connector** (Taktik / iCure) — <https://github.com/taktik/freehealth-connector>. Java/Kotlin. The de facto market connector; iCure claims 22 homologated e-services on top of it.
  - **e-Contract MyCareNet** — <https://github.com/e-Contract/mycarenet>. Java. Contains compiled WSDLs/XSDs for ehBoxPublication v3, EtkDepot v1, IntraHubService, gen_ins_services_core, kmehr-1_17, ehealth-certra schemas, plus consent and eHealthBox modules.
  - **HealthConnect "MyCarenet cookbook"** (HealthConnect public confluence) — <https://dev.healthconnect.be/confluence/display/PUB/MyCarenet+cookbook>. Vendor-internal but partially public.

### 3.6 Vendor on-boarding / certification

There is **no formal homologation label** (like ONC certification in the US) for connecting to MyCareNet, but a structured *test-and-release* process governs every service per sector:

1. **Initiation**: vendor signs the *Convention software vendor – CIN/NIC* (a contractual NDA-like document covering security, support obligations, helpdesks, escalation, response time SLAs and emergency contacts). Vendor receives credentials for the SharePoint, an *integrator id* and is added to the announcements / change-management mailing lists.
2. **Development and test phase**: vendor implements against acceptance, runs the documented test cases, exchanges sample messages with CIN/NIC.
3. **Release procedure**: CIN/NIC reviews logs of test cases and grants a "go for production" per service per sector. The vendor is then listed in the **erkende softwarepakketten** (recognized software packages) page on `ned.mycarenet.be` / `fra.mycarenet.be` for the relevant sector. Example: <https://ned.mycarenet.be/sectoren2/labo/erkende-softwarepakketten>, <https://ned.mycarenet.be/sectoren2/tariferingsdienst/erkende-softwarepakketten>.
4. **Operational follow-up**: vendor must keep the helpdesk reachable, must report incidents, and must respect the announced release windows for new schema versions.

In parallel, the eHealth platform itself maintains a **Software Register** (basic service) that aims to be a "single authentic source for software packages in the eHealth domain" covering eHealth, CIN, RSW, RSB, Vitalink. Registering there is the lightweight equivalent of declaring the product, the version and the certificates it uses.

For a logopedist SaaS specifically, halingo.be will need to:
- Sign the CIN/NIC vendor convention.
- Register the product in the eHealth Software Register.
- Get the relevant test cases set up for the *logopedist* profile (insurability, member data, eAgreement Logo, and eFact when CIN/NIC opens it for the sector).
- Pass the per-service release procedure with NIC.
- Optionally, re-use freehealth-connector or e-Contract MyCareNet under their respective open-source licenses.

---

## 4. eAttest — electronic attestation of care

### 4.1 What it is and what it replaces

**eAttest** is the electronic version of the paper *getuigschrift voor verstrekte hulp / attestation de soins donnés* (often shortened *eGVH*). It is the document by which a care provider certifies the services they have rendered to a patient and that the patient (or, in tiers payant, the mutuality) needs to obtain reimbursement.

Until eAttest, the workflow was paper: the provider filled in a numbered, secured form (RIZIV-issued *getuigschrift*), the patient handed it in to their mutuality, the mutuality input the data manually and reimbursed the patient by bank transfer. eAttest digitalizes the entire chain: no paper, sub-second submission, no manual rekey on the mutuality side.

### 4.2 When to use eAttest vs. eFact

The decision is taken **per patient, per encounter** based on the result of the insurability/member-data call (section 6):

- If the third-party-payer scheme is **mandatory or allowed** for the patient and the provider chooses to apply it → **eFact** (the mutuality pays the provider, the patient pays only the *remgeld / ticket modérateur*).
- If the third-party-payer scheme is **not applied** (patient pays the full fee out-of-pocket) → **eAttest** (the mutuality reimburses the patient directly after the electronic attestation is processed).
- If the third-party-payer scheme is **forbidden** for the encounter → **eAttest** is the only digital option.

The two services are mutually exclusive for one and the same encounter: the same nomenclature line cannot be both eFact'd and eAttest'd.

### 4.3 Patient flow (verified)

1. Logopedist provides the session.
2. Patient pays the full fee (cash, bank card, instant-payment QR, etc.). The software prints/issues a payment receipt (*bewijsstuk*) which **must contain** the amount paid plus the eAttest receipt number returned by the mutuality. This bewijsstuk has prescribed fiscal content (RIZIV / FOD Financiën rules; see the ned.mycarenet.be page *Verplichtingen uit de fiscale regelgeving en de regelgeving betreffende verzekering voor geneeskundige verzorging waaraan het bewijsstuk dient te voldoen in het kader van eAttest*).
3. Software submits the eGVH to the mutuality electronically over MCN eAttest WS v3.2. The body is encrypted to the CIN/NIC public key.
4. The mutuality runs **synchronous** validations (insurability still valid, nomenclature codes accepted for the discipline, no duplicate, etc.) and returns either a **receipt confirmation** with a unique reference, or a **rejection** with an error code (see *SOA Error Guide*).
5. The mutuality then performs the deeper checks asynchronously and **transfers the reimbursement to the patient's bank account**, typically within 1 to 5 working days. Per the Solidaris and CM provider documentation, the practical turnaround for GPs and dentists is "the same day or next day" for the simple cases.
6. The patient is notified by their mutuality (via eBox citizen, email, or app) when the refund is paid.

For GPs and dentists, the receipt has to be transmitted **on the date of the service**. Some sectors (notably orthodontics) may attest retroactively if at least one service is processed on the same day.

### 4.4 Eligibility per profession

This is the catch. The official eHealth-platform service page <https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest> is explicit: "*De eAttest dienst is enkel toegankelijk voor huisartsen (incl. wachtdiensten), tandartsen, ziekenhuizen, kinesitherapeuten en hun gemandateerde derden.*" In other words, the production-active sectors are **GPs (incl. wachtdiensten and HAIO trainees), specialists, dentists, hospitals and physiotherapists**. **Logopedisten are not in the eAttest scope as of 2026-04-06.**

This is consistent with the RIZIV September-2025 mandatory-billing announcement, which explicitly applies to *artsen and tandartsen* only and is silent on logopedists, kinesitherapeuten, verpleegkundigen, vroedvrouwen, etc. The general direction announced by RIZIV and the Verzekeringscomité is that all ambulant outpatient sectors will eventually be on mandatory eAttest/eFact, but **no firm sunset date for logopedists has been published** as of this writing. The kine-sector practitioner press talks about "expected by 2027".

**Implication for halingo.be**: design the billing module so that eAttest is wired in, fully tested in acceptance against the kine sector's WSDL (which is the closest analogue), and switched on for logopedists the day CIN/NIC opens the sector. Until then the module must fall back to printing a compliant paper *getuigschrift* with the RIZIV-issued numbering range that the logopedist has bought.

### 4.5 Mandatory dates

- **2025-09-01** — eAttest and eFact mandatory for **GPs, medical specialists, dentists** for all ambulant services reimbursed by the verplichte ziekteverzekering. Source: RIZIV news <https://www.riziv.fgov.be/nl/nieuws/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025>.
- **For logopedisten**: **no mandatory date set**. The **2026-2027 logopedist-mutualiteiten convention** (concluded 2025-12-11, R/26) does not impose electronic billing. It mentions only "voortzetting van administratieve vereenvoudiging" and "integratie van een kwalitatief patiëntendossier in de nomenclatuur" without setting a hard date. Source: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten>.

---

## 5. eFact — electronic invoicing (third-party-payer)

### 5.1 What it is

**eFact** is the electronic third-party-payer invoicing service exposed over MyCareNet. The provider sends a structured invoice (`facturatie / facturation`) to the mutuality; the mutuality pays the provider directly; the patient pays only the personal share (*remgeld / ticket modérateur*) at the cabinet.

For the mutualities, the receiving entity is internally called **Facturatie Tiers Payant** and exposes a SOAP service per sector (`MyCareNet/Facturation/v1` family of endpoints) with sector-specific business rules.

### 5.2 When a logopedist uses third-party-payer

Since **2022-01-01**, all healthcare providers (artsen, tandartsen, kinesitherapeuten, **logopedisten**, verpleegkundigen, ...) are *allowed* to apply the third-party-payer scheme to all their patients for all their services, regardless of where the service is provided. For logopedists this is documented at <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/verzorging-door-de-logopedist/logopedie-facturatie-via-de-derdebetalersregeling>.

In practice, the logopedist applies tiers payant most often when the patient has one of:
- **Verhoogde tegemoetkoming (VT)** — formerly BIM/OMNIO; for these patients tiers payant is mandatory for GPs and is in any case strongly used by other disciplines because the patient's remgeld drops to ~€2.
- A **chronic-illness statute** (`statuut chronische aandoening`) returned by the MDA call.
- A **MAF** (maximumfactuur) cap reached for the year.
- A **Globaal Medisch Dossier** at a *medisch huis / maison médicale* with capitation, which routes everything to the medisch huis.
- A specific reimbursement track such as the *limitatieve lijst voor patiënten met IQ < 86* or the convention bilingual-aphasia / autism conventies.

The logopedist must:
- Respect the tariffs from the convention (or, if they are *non-conventionné*, apply their declared fee).
- Indicate the *remgeld* in the K.B. 15.07.2002 box on the certificate of care.
- Provide the patient with a signed *bewijsstuk* showing the cost charged to the patient, the cost charged to the mutuality, the total cost, and the payment information.

### 5.3 Submission flow today (paper)

The current canonical flow for logopedists is **monthly paper invoicing**:

- **Per patient, per month**: send the RIZIV-numbered portion of the *getuigschrift voor verstrekte hulp* to the patient's mutuality, **no later than two months after the end of the month** in which the sessions were given.
- **Per mutuality, per month**: enclose two copies of a *maandelijkse verzamelstaat / état récapitulatif mensuel* listing patient names, *inschrijvingsnummers*, honoraria charged, total amount due, and payment information.
- **Mutuality payment turnaround**: per the RIZIV page, the mutuality pays "voor het einde van de maand die volgt op de maand waarin de documenten werden ingediend" — i.e. by the end of the month following the month of submission. So for sessions in January, submitted in early February, payment lands by end of March.

For halingo.be: the current MVP must support compliant *paper* monthly invoicing because that is still the de jure flow for logopedists. Generation of the monthly verzamelstaat per mutuality, with the right column layout, is a hard requirement. The mutualities each have minor variations on the layout — all seven need to be supported.

### 5.4 Submission flow tomorrow (eFact)

Once CIN/NIC opens eFact for the logopedist sector, the SaaS-side flow is the same as for kinesitherapeuten and verpleegkundigen:

1. After every session, store the structured invoice line (NIHII of the executing logopedist, NIHII of the prescribing doctor, INSZ of the patient, mutuality code, nomenclature code, date, place, fee charged, fee to mutuality, fee to patient, *opleg* if any, supporting agreement number from eAgreement Logo, etc.).
2. Once a **billing batch** is closed (typically monthly, but daily and weekly are allowed), the software generates a single MCN eFact message per mutuality and sends it over the eFact WS.
3. Synchronous response = receipt or syntax-level rejection.
4. Asynchronous response = the **Tarification 920** / accounting feedback once the mutuality has done content-level checks. This comes back through eHealthBox or via the same WS poll. It contains accepted lines, rejected lines with reason codes, and the bank-transfer reference under which the payment will be made.
5. Mutuality **pays to the logopedist's bank account**, typically within 14-30 calendar days for clean batches. Rejected lines need to be corrected and re-sent in the next batch.

### 5.5 Rejection handling

CIN/NIC defines two error layers, both exhaustively listed in *SOA – Error Guide v1.0* and the per-sector error matrices:

- **Synchronous rejections** at submission time: schema violations, expired certificate, missing SAML token, NIHII not authorized for service, body-level KMEHR errors. The whole batch is rejected.
- **Asynchronous rejections** at bookkeeping time (the *920* feedback): line-level rejections with codes such as *no insurability on date of service*, *not entitled to nomenclature code X*, *prescription expired*, *agreement not found in eAgreement registry*, *patient deceased*, *wrong mutuality*, *duplicate of a previously paid line*. The provider corrects the line and re-bills.

A robust SaaS must:
- Persist the full request/response pair for every call (legal evidence + audit + 10-year retention).
- Surface human-readable rejection messages translated to the logopedist's language.
- Provide a "credit and resubmit" workflow tied to the original line for traceability.

---

## 6. MDA / insurability check

### 6.1 What it is

**MDA** (*membership data attestation* / *attestation de consultation des données d'assurabilité*) is the canonical real-time call to the patient's mutuality to verify that the patient is currently insured and to retrieve the derived rights that determine billing. The MyCareNet web service is **MemberData** (the *MDA* acronym is used inside SAML AttributeQuery; it stands for "Member Data Attestation" in CIN/NIC documentation).

There is also a related and slightly older service, **GenericInsurability** (cookbook v1.4, 2022-07-29), which returns a simpler insurability dataset. In modern integrations the two are used together: GenericInsurability for the basic insurance check, MemberData for the rich derived-rights blob.

### 6.2 When it is called

Best practice (per CIN/NIC and per the GP/kine sector docs): **before every encounter**, ideally in the appointment-confirmation phase or at check-in. For a logopedist this means: when the parent of a child checks in for a session, the software runs MemberData by INSZ (or by mutuality registration number `…@mut`), and the response drives:

- The choice between eAttest and eFact (section 4.2).
- The exact tariff to charge (regular vs. VT).
- Whether a *prescription / voorschrift* check is still valid.
- Whether there is an active **eAgreement** for the running pathology number.

### 6.3 Data fields returned

The MemberData response is a SAML 2.0 `Response` containing several `Assertion` blocks, each with one or more `AttributeStatement`. The fields exposed (per the cookbook example) include:

- `urn:be:fgov:person:ssin` — the patient's INSZ.
- `urn:be:cin:nippin:careReceiver:name`, `:firstName`, `:birthDate`, `:gender`.
- `urn:be:cin:nippin:careReceiver:registrationNumber` — the mutuality registration number.
- `urn:be:cin:nippin:careReceiver:mutuality` — the mutuality code (e.g. `100` = CM, `130` = Solidaris, etc.).
- `urn:be:cin:nippin:cb1` and `:cb2` — *Codes-Titulaires* CT1 / CT2: the insurance status codes that drive the BIM / VT / regular distinction. These are formalized in the FHIR `CodeSystem-be-cs-holder-code-1` (see <https://www.ehealth.fgov.be/standards/fhir/mycarenet/2.1.2/CodeSystem-be-cs-holder-code-1.xml.html>).
- `urn:be:cin:nippin:communicationDate`.
- Plus, depending on the requested *Facets*:
  - `urn:be:cin:nippin:insurability` (`requestType=information`, `contactType=ambulatory|hospitalized|…`).
  - `urn:be:cin:nippin:carePath` (e.g. `carePathType=diabetes`).
  - `urn:be:cin:nippin:chronicCondition` — chronic-illness statute.
  - `urn:be:cin:nippin:referencePharmacy` (not relevant for logopedists).
  - `urn:be:cin:nippin:hospitalization` — for hospital-stay periods (relevant: a hospital stay can suspend ambulatory reimbursement of logopedie sessions during the stay).
  - Maximumfactuur reached / not reached.
  - Tiers-payer mandatory/allowed/forbidden flag.
  - BIM/VT (verhoogde tegemoetkoming) flag.

### 6.4 Endpoints and security

- **MemberData WS** has one operation, `MemberDataConsultation`. Endpoints:
  - Acceptance: `https://services-acpt.ehealth.fgov.be/MyCareNet/MemberData/v1`
  - Production: `https://services.ehealth.fgov.be/MyCareNet/MemberData/v1`
- **Security**: SAML HOK assertion in SOAP header (timestamp + body signed). Body may be encrypted to CIN/NIC public key (`@ContentEncryption=encryptedForKnownBED`, `@ETK` referencing the right key). The cookbook recommends putting an **XAdES** signature in the `EncryptedKnownContent` blob as legal proof of the request.
- **Identification of the requester**: `urn:be:cin:nippin:nihii11` (the logopedist's NIHII). The cookbook example uses NIHII `11530231003` (a test value).
- **Identification of the patient**: `Subject/NameID` with `Format="urn:be:cin:nippin:careReceiver:registrationNumber@mut"`, e.g. `880114092m65@100`. If the logopedist only has the INSZ, the GenericInsurability call lets you map INSZ → mutuality registration number first.
- **STS-side certification attributes**: the SAML token returned by the eHealth STS must contain `true` for all *boolean* certification attributes for the MemberData service (e.g. `…profession:logopedist:nihii11=true`). If those come back `false` or empty in acceptance, the test case has not been correctly configured by the eHealth platform, and the vendor must email `info@ehealth.fgov.be`.

### 6.5 Relevance for logopedists

MemberData is the **only** service in the MCN catalogue that is unambiguously available *today* to logopedists for production use. It is also the foundation of every later eFact/eAttest call. Halingo.be should treat it as the single source of truth for "what can I charge this patient and how" — and should refresh it not more than 24 hours before the session, with a hard fallback to "manual override + audit log" when MCN is down.

---

## 7. Consent and therapeutic relationship

### 7.1 eHealth patient consent

The **eHealthConsent** service is the federal registry where a patient's *informed consent for the electronic exchange of their health data* is recorded. With consent, healthcare providers with whom the patient has a therapeutic relationship can read the patient's data from the regional vaults, the SumEHR, the medication history, lab results and so on.

Key facts:
- Consent is **patient-facing**: it is set by the patient via masante.belgium.be / mijngezondheid.belgie.be / CoZo / RSW / RSB, by their doctor or pharmacist, by a *medisch huis*, or by a hospital admissions desk.
- It is **single-shot, opt-in**: once given, it stays valid until withdrawn. The patient can revoke or modify it at any time.
- It is **profession-agnostic**: it does not target a specific provider; it enables the network.
- The technical service: SOAP `Consent` v1.4 and REST `Consent` v2.3 on the eHealth API portal.
- For logopedists: the consent is rarely *initiated* by the logopedist (because their consultations don't typically include consent registration as a workflow step), but the logopedist *benefits* from it indirectly: it is the prerequisite for accessing any vault-stored document (Sumehr, voorschrift, ENT specialist report, etc.).

### 7.2 Therapeutic relationship (TherLink)

A **therapeutic relationship** (NL: *therapeutische relatie*; FR: *lien thérapeutique*) is a registered, time-bounded link between a specific patient and a specific care provider. It is registered via the **TherapeuticLink** basic service (`TherLink`). Without it, even a logopedist with consent on file cannot read the patient's data — the system will refuse the call.

Triggers for creating a therapeutic link, in order of preference:
1. **eID swipe** — patient inserts their eID at the cabinet; the software calls TherLink and creates a link valid for 15 months for an ambulatory provider.
2. **Manual creation by the provider**, with patient consent collected on paper; legally weaker.
3. **Inheritance**: certain links propagate (e.g. a hospital admission generates links to the treating team).

The patient can **exclude** specific providers (and specific *types* of providers) from accessing their data. The eHealth Basic Services wiki explicitly lists `logopedist` as one of the profession types that a citizen can exclude from data access via the *therapeutic exclusion* mechanism.

For logopedists in halingo.be:
- The product must include a "register therapeutic relationship" workflow with eID swipe at intake.
- The product must check the active TherLink before reading any vault document.
- The product must respect therapeutic exclusions returned by the call.
- Default link duration for ambulatory logopedie: 15 months (matches kine).

### 7.3 Sumehr relevance

The **Sumehr** (Summarized Electronic Health Record), defined in KMEHR, is the GP-curated minimal data set on a patient (active problems, medication, allergies, vaccinations, recent contacts). It is published by the GP to the regional vault (Vitalink in Flanders, RSW in Wallonia, BruSafe+/Abrumet in Brussels).

For a logopedist, Sumehr is **read-only and contextual**: it is useful background when starting therapy on a complex patient (medication, comorbidities, previous interventions), but the logopedist does not write into it. There is no plan announced for logopedists to publish their own treatment summaries into the regional vault as a structured KMEHR document. The closest thing is the **patiëntendossier** mentioned in the 2026-2027 logopedist convention, but that is a nomenclature/quality concept, not a KMEHR transaction.

---

## 8. Software-vendor integration — certification, security, logging

### 8.1 Is there a homologation?

There is **no single, government-issued homologation** label that an entire SaaS for logopedists must obtain. What exists, in layers:

1. **eHealth Software Register** — declarative registration in the central catalogue of software packages that integrate with eHealth/CIN/RSW/RSB/Vitalink. Mandatory for vendors who use base services.
2. **CIN/NIC service-by-service release procedure** — described in section 3.6. Granted per service, per sector. A vendor can be "released for kine eAttest" but not yet "released for logopedist eAgreement". For logopedists today this means: insurability, MemberData and eAgreement Logo can be released; eAttest and eFact cannot, because the sector is not yet open.
3. **GP-software label** — only relevant for general practitioners (the *EMR-label* historically issued by FOD Volksgezondheid for *erkende medische dossiers*). Not applicable to logopedists.
4. **CE marking under MDR** — only required if the SaaS meets the definition of a *medisch hulpmiddel*. A pure billing/dossier tool typically does not. As soon as halingo.be offers a clinical-decision-support feature (e.g. a screening algorithm or a test scoring engine), MDR Class I (or higher) starts to apply and FAMHP notification is required.

### 8.2 Minimum security & data-protection requirements

A vendor that integrates with eHealth/MyCareNet commits, contractually with CIN/NIC and via the eHealth platform's *Convention de coopération*, to:

- **Confidentiality and integrity** of all patient data, including end-to-end encryption with the CIN/NIC public key (ETEE / KGSS) for messages that contain sensitive content.
- **Authentication** of every system call with the NIHII-bound eHealth certificate. Storing the certificate on disk in clear is not acceptable; it must be encrypted at rest and access-controlled.
- **Authorization**: respect of role attributes returned by the STS. A SaaS may not call a service that the certificate's profile is not entitled to.
- **GDPR** — the vendor is *processor* (not controller); the logopedist or the praktijk is the *controller*. A DPA is mandatory between halingo.be and every customer.
- **CSIRT and incident reporting** — the vendor must report security incidents to the eHealth helpdesk and to CIN/NIC.

### 8.3 Logging and audit

The eHealth platform itself logs every call at the ESB level. Vendors must additionally:

- Log every business call (request id, NIHII of executing provider, INSZ of patient, service called, timestamp, response code, business reference returned).
- Persist request/response payloads (in encrypted form) long enough to satisfy the legal retention period for healthcare administration (10 years for billing; 30 years for patient files since the 22 April 2019 *Wet kwaliteitsvolle praktijkvoering / Loi sur la qualité de la pratique des soins de santé*).
- Respect the **tracing** convention added in cookbook v1.4: every MCN call must carry `User-Agent` and `From` HTTP headers per RFC 7231.
- Surface the audit trail to the controller (the logopedist) on demand; GDPR right-of-access response in 30 days.

### 8.4 SLA expectations

There is no formal monetary SLA between vendors and CIN/NIC, but:
- Production helpdesk: working days 07:00-20:00 for eHealth, business hours for CIN/NIC.
- Incidents: see <https://status.ehealth.fgov.be> for the live status. CIN/NIC announces planned maintenance via the SharePoint and the integrator mailing list.
- eHealth STS, MemberData and eAttest typically have <500 ms p95 in production. Vendors must build in retry-with-backoff and a graceful degradation mode (queue the call, fall back to paper, alert the user).

---

## 9. Developer documentation map (URLs)

Primary entry points (bookmark these):

- **eHealth platform portal (NL)**: <https://www.ehealth.fgov.be/ehealthplatform/nl/>
- **eHealth platform portal (FR)**: <https://www.ehealth.fgov.be/ehealthplatform/fr/>
- **eHealth services for healthcare providers (NL)**: <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg>
- **eHealth API portal (production catalogue)**: <https://portal.api.ehealth.fgov.be/>
- **eHealth API portal (acceptance)**: <https://portal-acpt.api.in.ehealth.fgov.be/>
- **eHealth status / monitoring**: <https://status.ehealth.fgov.be/>
- **eHealth standards portal**: <https://www.ehealth.fgov.be/standards/>
- **Belgian MyCareNet FHIR profiles IG**: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/toc.html>
- **eHealth Federal Core Profiles (FHIR)**: <https://build.fhir.org/ig/hl7-be/core/>
- **eHealth Certificate Manager (CertMan)**: <https://www.ehealth.fgov.be/ehealthplatform/nl/service-ehealth-certificaten>
- **ProGezondheid (provider portal)**: <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg/diensten/progezondheid> + <https://help.progezondheid.fgov.be>

MyCareNet:
- **MyCareNet (NL)**: <https://ned.mycarenet.be>
- **MyCareNet (FR)**: <https://fra.mycarenet.be>
- **MyCareNet portal (production)**: <https://prod.mycarenet.be/portal/home.seam>
- **MyCareNet eAttest service page**: <https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest>
- **MyCareNet MemberData cookbook v1.4**: <https://www.ehealth.fgov.be/ehealthplatform/file/.../mcn-memberdata-v1.4-dd-29072022.pdf>
- **MyCareNet Generic Insurability cookbook v1.4**: <https://ehealth.fgov.be/ehealthplatform/file/.../mcn-generic-insurability---cookbook-v1.4-dd-29072022.pdf>
- **CIN/NIC SharePoint (vendor-only)**: <https://share.intermut.be/home/MyCareNet/Extranet>
- **CIN/NIC contact**: <https://ned.mycarenet.be/contact> / <https://fra.mycarenet.be/contact>

RIZIV / INAMI:
- **Logopedisten (NL)**: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten>
- **Logopèdes (FR)**: <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes>
- **Logopedie tiers payant**: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/verzorging-door-de-logopedist/logopedie-facturatie-via-de-derdebetalersregeling>
- **Logopedist convention 2026-2027**: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten>
- **Mandatory eFact for GPs and dentists 2025-09-01**: <https://www.riziv.fgov.be/nl/nieuws/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025>

Open-source connectors and references:
- **freehealth-connector (Taktik)**: <https://github.com/taktik/freehealth-connector>
- **e-Contract MyCareNet**: <https://github.com/e-Contract/mycarenet>
- **HealthConnect MyCareNet cookbook (public)**: <https://dev.healthconnect.be/confluence/display/PUB/MyCarenet+cookbook>
- **HL7 BE MyCareNet (FHIR)**: <https://github.com/hl7-be/mycarenet>

Mutuality vendor pages:
- **CM eFact tiers payant**: <https://www.cm.be/en/third-party-payment-scheme-electronic-invoicing-efact>
- **CM speech therapists tiers payant**: <https://www.cm.be/en/careproviders/speech-therapists/third-party-payment-scheme>
- **Solidaris e-attest**: <https://corporate.solidaris-vlaanderen.be/info-voor-zorgverleners/e-attest/>
- **HZIV/CAAMI logopedisten tarieven**: <https://www.caami-hziv.fgov.be/nl/leden/terugbetaling-medische-kosten/tarieven/logopedisten>

Patient-facing portals (background only):
- **MijnGezondheid / MaSanté**: <https://www.mijngezondheid.belgie.be> / <https://www.masante.belgique.be>
- **MyHealth Belgium**: <https://www.myhealth.belgium.be>
- **CoZo**: <https://www.cozo.be>
- **Réseau Santé Bruxellois**: <https://brusselshealthnetwork.be>

---

## 10. Roadmap, deprecations, known gotchas

### 10.1 Roadmap as of April 2026

- **Mandatory eFact/eAttest for GPs, specialists, dentists** — already in force since 2025-09-01.
- **Mandatory eFact/eAttest for kinesitherapeuten, verpleegkundigen, logopedisten** — *announced in principle*, repeatedly described in trade press as "expected by 2027". The 2026-2027 logopedist convention does **not** make it mandatory; the next convention (2028-2029) is the realistic legal vehicle.
- **eAgreement** — already production-grade for kine, partial for logopedists via the *MyCareNet eAgreement Claim Logo BE* FHIR R4 profile (IG v2.1.2). Halingo.be should plan to support this profile for the *aanvragen tot terugbetaling van logopedische verstrekkingen* (the *aanvraag voor akkoord van de adviserend arts* with the dossier of bilan + tests). Pathology categories handled in logopedie: dyslalies, *taalstoornissen*, *stemstoornissen*, dysartrie, dysfagie, afasie, etc., each with a specific RIZIV pathology number that ends up as the `category` code in the FHIR `Claim` resource.
- **eHealth FHIR migration** — eHealth platform is gradually exposing services in FHIR R4 alongside the legacy SOAP. SOAP will not disappear in this decade, but new services will more often be FHIR-first.
- **PARIS / Recip-e** — electronic prescription. Logopedists do not prescribe medication, but they are *prescribed to* by GPs/ENT/neurologists. The prescription for logopedie is currently still on paper or as a free-form PDF in eHealthBox. There is no formal electronic *bestelbon logopedie* yet; this is an open hole that any logopedist EHR will have to manage manually.
- **Sumehr v2** — staying with the GP. Not for logopedists to publish.

### 10.2 Sunset of paper

- **eAttest paper getuigschriften**: still legal for logopedists, **deprecated for GPs, specialists, dentists** since 2025-09-01.
- **eFact paper monthly verzamelstaten**: still legal for logopedists. The RIZIV-issued numbered booklets (the green, blue, etc. *getuigschriften*) are still on sale; the per-2026 convention does not change this.

### 10.3 Known gotchas (battle scars)

- **Sector-not-open trap**: a logopedist software cannot just call MCN eAttest and expect it to work. The STS will issue a token, but the certification attribute `…profession:logopedist:eattest` will be `false`, and the call will fail at the ESB. Handle this in onboarding tests.
- **Encryption-by-known-BED**: vendors routinely forget that the body must be encrypted with the right ETK for `MYCARENET / CBE 0820563481`. The wrong ETK will produce a cryptic SOAP fault.
- **NIHII vs INSZ** confusion: requests are signed with the **NIHII** of the provider, but the patient is identified by a *registration number @ mutuality* (`880114092m65@100`) — not by the patient's INSZ. Use GenericInsurability to map INSZ → registration number first.
- **Mandate expiry**: eHealth mandates (between a logopedist and the SaaS vendor) have expiry dates. If the underlying mandate expires, all MCN calls start failing. Halingo.be must monitor the Mandates service for upcoming expirations.
- **Certificate renewal**: 90-day window before expiry. After expiry, every MCN call fails. The product must email/notify the logopedist 60, 30 and 7 days before expiry.
- **eAgreement Logo profile**: production rollout is uneven across mutualities. CM and Solidaris are usually first; smaller mutualities lag by months. Build a per-mutuality fallback to paper or to the legacy *aanvraag-formulier*.
- **Time zones**: the eHealth STS issues tokens with Brussels-local timestamps. Allow 2-minute clock skew to avoid `NotBefore` rejections.
- **Telelogopedie**: COVID-era special nomenclature codes for remote logopedie sessions are **withdrawn as of 2026-01-01**, replaced by new permanent codes for *verstrekkingen op afstand* during 2026. Source: 2026-2027 logopedist convention. Halingo.be must keep both code sets active for transition periods.

### 10.4 Strategic implication for halingo.be

- **Today** (Q2 2026): MemberData/insurability live; eAgreement Logo plumbed but optional; eAttest/eFact not yet open for the sector → SaaS billing module produces compliant **paper** eGVH and monthly verzamelstaten with the right RIZIV numbering, while logging everything in a structured, eFact-ready data model.
- **Tomorrow** (12-24 months): when CIN/NIC opens eAttest and eFact for the logopedist sector, halingo.be flips a feature flag and re-uses the same data model + the kine-style WSDL adapter (already built and tested).
- **Day-zero requirement**: do **not** ship without a working eHealth-certificate management story (creation, renewal, revocation) and without supporting the mandate flow. Customers will share keystores with you, and you must store them securely.

---

## 11. Freshness notes

- **Last verification date**: 2026-04-06.
- **Live document review status**: this document was assembled from primary sources (eHealth platform, RIZIV/INAMI, CIN/NIC, individual mutualities) and from cookbooks downloaded from the eHealth portal (MemberData cookbook v1.4 / 2022-07-29 was inspected page-by-page). It was cross-checked against the kinesitherapie sector pages for the bits where the logopedist sector is silent.
- **Confirmed as of 2026-04-06**:
  - Logopedist sector is **not** under the 2025-09-01 mandatory eFact/eAttest mandate.
  - The 2026-2027 logopedist-mutualiteiten convention contains **no** mandatory electronic-billing clause and **no** sunset date for paper.
  - Telelogopedie under COVID rules ended 2026-01-01; permanent remote nomenclature codes are coming during 2026.
  - eHealth STS, MemberData, GenericInsurability, eHealthBox, Consent, TherLink are all in stable production.
- **Open / uncertain items** that need re-verification before halingo.be commits to roadmap dates:
  1. **PARTIAL (verified 2026-04-06)** — **Exact date** at which CIN/NIC will open the eAttest and eFact tracks for the logopedist sector. The press uses "by 2027" but no formal RIZIV announcement exists. *Verification update*: confirmed there is no firm date in any government source. The 2022-2024 eGezondheid action plan (page 53 of the PDF) lists *"Analyse voor de logopedische sector — Q4/2022"* as completed and *"Ontwikkeling en uitvoering voor de logopedische sector — TBD"*. The 2025-2027 and 2026-2029 plans dropped the per-sector implementation tables and provide no replacement date. The 2025-09-01 mandatory eFact/eAttest mandate explicitly excludes logopedists. Field evidence (Helan, CM, Solidaris, RIZIV-issued paper forms refreshed in May/September 2025) confirms no migration is in flight. **Plan for halingo.be: assume no production opening before late 2027 at the earliest, with a likely slip into the 2028-2029 convention vehicle.** See `verification-2026-04/03-ehealth.md` item 1.
  2. **PARTIAL (verified 2026-04-06)** — The **production-readiness** of the *MyCareNet eAgreement Claim Logo BE* profile per individual mutuality. *Verification update*: the FHIR profile is **published, stable and frozen at v2.1.2 since 2025-02-17** (Belgian MyCareNet FHIR profiles IG, generated 2025-07-10). It is technically callable in acceptance, with example instances ex16-ex27 covering assessment / treatment / cancellation / extension / rejection / partial-agreement scenarios. **No mutuality has publicly announced a production go-live for this profile.** Spot checks at Helan, CM, Solidaris and CGM Oxygen show that the practitioner-facing logopedist agreement workflow is still **paper** at every mutuality checked. CGM Oxygen released eAgreement support in January 2025 but only for the kine sector. Halingo.be should treat the profile as *acceptance-ready* and *production-not-yet*. See `verification-2026-04/03-ehealth.md` item 2.
  3. Whether a future *electronic prescription for logopedie* will be added to PARIS / Recip-e or to a separate service. Currently a hole. *Not in scope of the 2026-04 verification pass.*
  4. **RESOLVED (verified 2026-04-06)** — The full list of *Speech Therapy Pathology Situation Codes* bound to the eAgreement Logo profile. *Verification update*: the value set is `https://www.ehealth.fgov.be/standards/fhir/nihdi-terminology/ValueSet/be-vs-speech-therapy-pathology-situation-code` (version 1.0.0, 17 codes), backed by code system `…/CodeSystem/be-cs-speech-therapy-pathology-situation-code`. Bound on `Claim.item.productOrService.coding` with **required** strength. Codes: `a`, `b1`, `b2`, `b3`, `b4`, `b5`, `b6-1`, `b6-2`, `b6-3`, `b6-4`, `b6-5`, `c1`, `c2`, `d`, `e`, `f`, `g`. See `verification-2026-04/03-ehealth.md` item 3 for the full table with English displays and the mapping to RIZIV Article 36 § 2 a)-g) pathology categories.
  5. **RESOLVED (verified 2026-04-06)** — Whether the **Software Register** is mandatory for non-GP packages. *Verification update*: registration is **NOT universally mandatory**. Per the RIZIV technical-info page for software vendors, web applications without integration only need a notification form; webcomponents/FHIR/hybrid integrations need a registration test. The register is organized **per *doelgroep*** (huisartsen, verpleegkundigen, tandartsen, kinesitherapeuten) and **there is no logopedist doelgroep** — the URL `/nl/software-registratie/logopedist` returns 404. The register is *de facto* tied to the RIZIV telematicapremie, and **logopedists do not have a telematicapremie**. Practical implication: a logopedist-only SaaS like halingo.be has no doelgroep to register against and **no formal "register and validate" gate** beyond the per-service CIN/NIC release procedure. The CIN/NIC vendor convention and per-service release procedures remain the only effective contractual obligations. See `verification-2026-04/03-ehealth.md` item 4.
  6. Whether the logopedist NIHII discipline code grants the STS certification attribute `…profession:logopedist:nihii11=true` *out of the box* or whether vendors must request a per-service profile activation. *Not in scope of the 2026-04 verification pass; the answer requires running an actual STS request against an acceptance NIHII, which can only be done after the test-case-request email to `info@ehealth.fgov.be`.*

When this document is next refreshed, run new searches against `riziv.fgov.be` / `inami.fgov.be` for any 2027 *logopedist convention* press release, against `ned.mycarenet.be` for new sector pages, and re-fetch the FHIR IG for any new logopedist profile.

**2026-04 verification pass status: 2 RESOLVED (items 4, 5), 2 PARTIAL with bounded answers (items 1, 2). Detailed verification note at `verification-2026-04/03-ehealth.md`.**

---

## 12. Sources

Primary government sources (most authoritative):

- eHealth platform — eHealth certificates: <https://www.ehealth.fgov.be/ehealthplatform/nl/service-ehealth-certificaten>
- eHealth platform — Beheer van de eHealth-certificaten: <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg/diensten/beheer-van-de-ehealth-certificaten>
- eHealth platform — MyCareNet eAttest service page: <https://www.ehealth.fgov.be/ehealthplatform/nl/service-mycarenet-eattest>
- eHealth platform — MyCareNet eAttest (provider page NL): <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg/diensten/mycarenet-eattest>
- eHealth platform — MyCareNet Tarification (eTar) (FR): <https://www.ehealth.fgov.be/ehealthplatform/fr/service-mycarenet-consultation-des-tarifs>
- eHealth platform — Hybride methode certificaataanvraag voor buitenlandse zorgverleners: <https://www.ehealth.fgov.be/ehealthplatform/nl/hybride-methode-ehealth-certificaataanvraag-voor-buitenlandse-zorgverleners-niet-woonachtig-in-belgie-zonder-eid-kaart-actief-in-de-belgische-gezondheidssector>
- eHealth platform — API portal: <https://portal.api.ehealth.fgov.be/>
- eHealth platform — ProGezondheid: <https://www.ehealth.fgov.be/nl/beroepsbeoefenaars-in-de-gezondheidszorg/diensten/progezondheid>
- eHealth platform — Standards portal: <https://www.ehealth.fgov.be/standards/>
- eHealth platform — KMEHR standards home: <https://www.ehealth.fgov.be/standards/kmehr/en>
- eHealth platform — Belgian MyCareNet FHIR profiles IG v2.1.2 ToC: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/toc.html>
- eHealth platform — `MyCareNet eAgreement Claim Logo BE` profile: <https://www.ehealth.fgov.be/standards/fhir/mycarenet/2.1.2/StructureDefinition-be-eagreementclaim-logo-definitions.html>
- eHealth platform — Insurability code CT1 (FHIR CodeSystem): <https://www.ehealth.fgov.be/standards/fhir/mycarenet/2.1.2/CodeSystem-be-cs-holder-code-1.xml.html>
- eHealth platform — Federal Core Profiles (FHIR): <https://build.fhir.org/ig/hl7-be/core/>
- eHealth platform — Toegang tot RIZIV toepassingen via eHealth (PDF): <https://www.inami.fgov.be/SiteCollectionDocuments/ehealth-toegang-webtoepassing.pdf>

Cookbooks (PDF, eHealth portal):

- *MyCareNet MemberData Cookbook v1.4* (2022-07-29): <https://www.ehealth.fgov.be/ehealthplatform/file/cc73d96153bbd5448a56f19d925d05b1379c7f21/b4c09ea875b59baef3dd84bd361d6c1aab01ffa4/mcn-memberdata-v1.4-dd-29072022.pdf>
- *MyCareNet Generic Insurability Cookbook v1.4* (2022-07-29): <https://ehealth.fgov.be/ehealthplatform/file/cc73d96153bbd5448a56f19d925d05b1379c7f21/b4adcdc407d6622e5efaa95c3dc75ee59078d262/mcn-generic-insurability---cookbook-v1.4-dd-29072022.pdf>
- *eHealth Id Support WS Cookbook v1.5* (2022-07-19): <https://www.ehealth.fgov.be/ehealthplatform/file/cc73d96153bbd5448a56f19d925d05b1379c7f21/58830c8cd44073e6b3717ebe62f3484ebbcf3ce0/idsupport-ws---cookbook-v1.5-dd-19072022.pdf>

CIN / NIC / MyCareNet:

- MyCareNet portal (NL): <https://ned.mycarenet.be>
- MyCareNet portal (FR): <https://fra.mycarenet.be>
- MyCareNet — eAttest (NL): <https://ned.mycarenet.be/algemene-diensten/eattest>
- MyCareNet — eAttest (FR): <https://fra.mycarenet.be/services-g%C3%A9n%C3%A9raux/eattest>
- MyCareNet — kinesitherapeut sector page (FR): <https://fra.mycarenet.be/services-par-secteur/kin%C3%A9sith%C3%A9rapeutes>
- MyCareNet — Member Data (NL): <https://ned.mycarenet.be/algemene-diensten/member-data-gegevens-van-het-lid>
- MyCareNet — Facturatie artsen tiers payant (NL): <https://ned.mycarenet.be/sectoren2/dokter/de-beschikbare-diensten/derde-betaler/specificiteiten-facturatie-dokter>
- MyCareNet — Erkende softwarepakketten tariferingsdienst: <https://ned.mycarenet.be/sectoren2/tariferingsdienst/erkende-softwarepakketten>
- MyCareNet — Erkende softwarepakketten labo: <https://ned.mycarenet.be/sectoren2/labo/erkende-softwarepakketten>
- MyCareNet production portal: <https://prod.mycarenet.be/portal/home.seam>
- MyCareNet root: <https://www.mycarenet.be/>

RIZIV / INAMI:

- Logopedisten landing page (NL): <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten>
- Logopèdes landing page (FR): <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes>
- Logopedie facturatie via derdebetalersregeling: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/verzorging-door-de-logopedist/logopedie-facturatie-via-de-derdebetalersregeling>
- Uw RIZIV-nummer als logopedist krijgen: <https://www.inami.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/uw-riziv-nummer-als-logopedist-krijgen>
- Overeenkomst 2026-2027 voor de logopedisten: <https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten>
- Convention 2026-2027 pour les logopèdes: <https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes/convention-2026-2027-pour-les-logopedes>
- Verplichte elektronische facturatie voor artsen en tandartsen vanaf 1 september 2025 (NL): <https://www.riziv.fgov.be/nl/nieuws/verplichte-elektronische-facturatie-voor-artsen-en-tandartsen-vanaf-1-september-2025>
- Mandatory e-billing announcement (FR): <https://www.inami.fgov.be/fr/actualites/medecins-et-dentistes-facturer-electroniquement-devient-obligatoire-ce-1er-septembre-2025>
- ProGezondheid: <https://www.riziv.fgov.be/nl/webtoepassingen/progezondheid>
- Derdebetalersregeling (general): <https://www.riziv.fgov.be/nl/thema-s/verzorging-kosten-en-terugbetaling/financiele-toegankelijkheid/derdebetalersregeling>

Mutuality-side documentation (provider channel):

- CM — Third party payment scheme for speech therapists: <https://www.cm.be/en/careproviders/speech-therapists/third-party-payment-scheme>
- CM — eAttest doctors: <https://www.cm.be/en/careproviders/doctors/eattest>
- CM — Third-party payment scheme electronic invoicing (eFact): <https://www.cm.be/en/third-party-payment-scheme-electronic-invoicing-efact>
- Solidaris Vlaanderen — e-attest: <https://corporate.solidaris-vlaanderen.be/info-voor-zorgverleners/e-attest/>
- HZIV / CAAMI — logopedisten tarieven: <https://www.caami-hziv.fgov.be/nl/leden/terugbetaling-medische-kosten/tarieven/logopedisten>
- Mutualité chrétienne — eAttest (FR): <https://www.mc.be/fr/professionnels/eattest>

Open-source connectors and developer-side references:

- Taktik freehealth-connector: <https://github.com/taktik/freehealth-connector>
- iCure freehealth-connector docs: <https://icure.gitbook.io/icure/interoperability/freehealth-connector>
- e-Contract MyCareNet (Java WSDLs / clients): <https://github.com/e-Contract/mycarenet>
- HL7 BE MyCareNet (FHIR profiles): <https://github.com/hl7-be/mycarenet>
- HealthConnect MyCarenet cookbook (vendor confluence): <https://dev.healthconnect.be/confluence/display/PUB/MyCarenet+cookbook>
- Belgian MyCareNet eAgreement profile (Simplifier mirror): <https://simplifier.net/belgianmycarenetprofiles/bemycareneteagreementclaim>
- Belgian MyCareNet eAgreement Claim Kine BE profile (Simplifier): <https://simplifier.net/belgianmycarenetprofiles/mybemycareneteagreementclaimkine>

Practitioner-press, vendor blogs and explainers:

- kine-start.be — eAttest, eFact et eAgreement en kinésithérapie: <https://kine-start.be/fr/s-organiser/attestations-facturation-et-demandes-d-accord-electroniques-ce-que-tout-kine-doit-savoir>
- Corilus — Elektronisch attesteren verplicht voor tandartsen vanaf 01/09/2025: <https://blog.corilus.be/dentist/elektronisch-attesteren-tandartsen-verplicht-2025>
- Corilus — Elektronische facturatie voor specialisten: <https://blog.corilus.be/specialist/elektronische-facturatie-voor-specialisten-dit-moet-je-weten>
- Corilus — Facturation électronique pour les généralistes dans CareConnect: <https://info.corilus.be/fr/gp/facturation-%C3%A9lectronique-pour-les-g%C3%A9n%C3%A9ralistes-dans-careconnect>
- Doctor Manager — Facturation électronique eAttest/eFact obligatoire dès septembre 2025: <https://doctormanager.be/blog/facturation-electronique-eattest-efact-obligatoire-des-septembre-2025>
- Mediportal — Facturation électronique obligatoire pour les médecins: <https://mediportal.be/fr/nouvelles/facturation-electronique-obligatoire-pour-les-medecins--etes-vous-pret/>
- Domus Medica — Verzekerbaarheid en facturatie: <https://www.domusmedica.be/expertisedomein/ict/verzekerbaarheid-en-facturatie>
- ASGB — eAttest: <https://asgb.be/node/15968>
- ABSyM/BVAS — Verplichte elektronische facturatie voor artsen verduidelijkingen: <https://www.absym-bvas.be/actualiteit/verplichte-elektronische-facturatie-voor-artsen-enkele-verduidelijkingen>
- KCE — Barriers and facilitators for eHealth adoption by general practitioners (PDF): <https://kce.fgov.be/sites/default/files/2021-11/KCE_337_eHealth_adoption_in_Belgium_Report_V2.pdf>
- Frank Robben — Electronic information exchange in the Belgian healthcare system: <https://www.frankrobben.be/electronic-information-exchange-in-the-belgian-healthcare-system/>
- G_NIUS (French esante) — eHealth in Belgium: <https://gnius.esante.gouv.fr/en/decode-ehealth-internationally/the-digital-in-health-in-belgium>
- Joinup (EU) — Software reuse in social security and health care, the Belgian eHealth-platform: <https://joinup.ec.europa.eu/collection/joinup/solution/software-reuse-social-security-and-health-care-belgian-ehealth-platform/about>
- ICLG — Digital Health Laws and Regulations Belgium 2025: <https://iclg.com/practice-areas/digital-health-laws-and-regulations/belgium>

Patient and regional vault documentation (background):

- Brussels Health Network — SumEHR for health professionals: <https://brusselshealthnetwork.be/en/health-professionals/i-am-enquiring/my-patients-health-records/the-sumehr/>
- Brussels Health Network — Who has access to my health record: <https://brusselshealthnetwork.be/en/patients/im-inquiring/my-shared-health-record/who-has-access-to-my-health-record/>
- eHealth — Patient consent (citizen-facing): <https://www.ehealth.fgov.be/sites/default/files/assets/patientconsent/index.html>
- MijnGezondheid: <https://www.mijngezondheid.belgie.be/>
- MyHealth Belgium: <https://www.myhealth.belgium.be/>
