# 07 — GDPR, Belgian Health-Data Law, Patient Rights, and Medical-Record Retention

> Last verified: 2026-04-06
> Scope: Data-protection and patient-rights rules that halingo.be and its users (Belgian logopedists / logopédistes) must comply with. Cites EU regulations, Belgian federal laws, and decisions of the Gegevensbeschermingsautoriteit (GBA / APD) and the Informatieveiligheidscomité (IVC / CSI).

This file is the legal spine for everything halingo touches: patient files, billing, exports, portals, sub-processors, retention, breaches. Where a fact is uncertain or jurisdictionally messy (e.g. solo practitioner DPO obligation, electronic-only retention), the file says so explicitly in section 17 and the relevant section.

---

## 1. GDPR — the articles that matter for a logopedist SaaS

The GDPR (Regulation (EU) 2016/679) is directly applicable in Belgium since 25 May 2018. The articles below are load-bearing for halingo.

**Art. 9 — special categories (health data).** Art. 9(1) prohibits processing of health/genetic/biometric data unless one of the Art. 9(2) exceptions applies. For a logopedist:
- **9(2)(a)** explicit consent — secondary basis (e.g. sending a bilan to a school).
- **9(2)(h)** "provision of health care or treatment" — the **main** basis. Read with **9(3)**: the processing must be done by a professional bound by professional secrecy under Member-State law (in Belgium: art. 458 Sw., see §6).
- **9(2)(c)** vital interests; **9(2)(i)** public-interest in public health.

Halingo (processor) never invokes these directly — the logopedist does — but the architecture must make 9(2)(h) provable: role-based access, audit logs, access bound to identified care providers.

**Art. 6 — lawful bases.** Art. 9 is the special-category gate; Art. 6 is the general door. Both must be passed:
- **6(1)(b)** therapy contract with patient (or parents);
- **6(1)(c)** legal obligation — keeping a patient file under art. 33 Kwaliteitswet, RIZIV obligations, accounting law;
- **6(1)(f)** legitimate interest — only for security/logging/fraud prevention, not for clinical data.

**Art. 13/14 — information duties.** Inform the data subject of controller/DPO identity, purposes, lawful basis, recipients (including processors/sub-processors), retention periods, rights, GBA complaint right. Halingo should ship a *template privacy notice* — solo practices routinely lack one.

**Art. 15-22 — data-subject rights.**
- **15 access**: GDPR access overlaps with the patient-rights law right of access (§4); the patient-rights regime is *stricter* (15-day deadline, free first copy) and applies to the patient file, while Art. 15 also covers metadata, billing and logs. The GBA has consistently held both can be invoked together.
- **16 rectification**: factually wrong data must be corrected; clinical *opinions* cannot be erased — they record what the therapist thought at a moment.
- **17 erasure**: limited where retention is legally required (§16 — 30-year duty almost always wins).
- **18 restriction**, **19 notification**, **20 portability** (limited for clinical files because the basis is 9(2)(h)/6(1)(c), not consent — but offer machine-readable export anyway for the patient-rights right to copy).
- **21 objection**, **22 automated decision-making** — relevant if halingo introduces AI-assisted scoring.

**Art. 32 security.** Pseudonymisation, encryption at rest and in transit, CIA, resilience, restore capability, regular testing. GBA treats encryption of health data as the floor.

**Art. 33/34 breach notification.** 72h to GBA; patient notification "without undue delay" if high risk. Operational detail in §13.

**Art. 35 DPIA.** Required where likely high risk, *and* mandatory for cases on the supervisory-authority list (GBA list — BS 22 March 2019 — includes large-scale health-data processing). See §10.

**Art. 37 DPO.** Mandatory if the core activity is "large-scale processing of special categories". A solo logopedist generally does **not** trip it; a SaaS like halingo *does*. See §10.

**Art. 28 processor.** Sets the contractual content for controller-processor agreements. See §11.

---

## 2. Belgian GDPR implementation law (30 July 2018)

The **Wet van 30 juli 2018 betreffende de bescherming van natuurlijke personen met betrekking tot de verwerking van persoonsgegevens** (FR: *Loi du 30 juillet 2018*), published BS 5 September 2018, is commonly called the **Kaderwet** or "GDPR-wet". It repealed the 1992 Data Protection Act and fills the Member-State margins left by the GDPR.

**Structure**: Title 1 (general — supplementing GDPR), Title 2 (LED transposition for criminal prevention/prosecution), Title 3 (intelligence services and armed forces), Title 4 (constitution of the GBA).

**Health-data specifics — Art. 9 of the Kaderwet** implements the margin in Art. 9(4) GDPR for genetic, biometric and health data. The controller (and processor) must:
1. **Designate categories of persons** with access, with a precise description of their function;
2. Keep that list available for the GBA;
3. Ensure those persons are bound by **a legal, statutory or equivalent contractual confidentiality obligation**.

For halingo: every role that touches health data must be listed, justified and confidentiality-bound (employment contract or NDA). The logopedist-controller must do the same for secretarial staff, interns and accountant access.

**Other Belgian specifics**: Art. 11 of the Kaderwet adds safeguards for health-data processing in scientific research/statistics; processing of the **Rijksregisternummer / numéro de Registre national** is governed by the law of 8 August 1983 (interacts with eHealth identifiers); Belgium used the Art. 8 GDPR derogation to set the **information-society-services** consent age at **13** (this is *not* the medical-treatment threshold — see §9).

---

## 3. Authorities — GBA/APD and IVC/CSI

Two distinct bodies with overlapping roles.

**Gegevensbeschermingsautoriteit / Autorité de protection des données (GBA / APD)** — the Belgian DPA, successor to the CBPL, created by the law of 3 December 2017. Lead GDPR supervisory authority in Belgium, with investigative, corrective (fines up to €20M or 4% global turnover) and advisory powers. Relevant outputs for logopedists/SaaS:
- Official **DPIA list** (BS 22 March 2019, in force 1 April 2019) — §10.
- FAQ brochures for SMEs; Cookie checklist (Oct 2023) + Nov 2023 update — §14.
- Multiple decisions on access to medical records (CMS-LawNow synthesis Dec 2022): the GBA confirmed the patient-rights law and GDPR can be invoked together; the controller must respond on whichever timeline is shorter (15 days under patient-rights, 1 month under Art. 12(3) GDPR).
- DPO supervision was a 2023 priority — fines have been imposed where DPOs were named on paper without resources or independence.

**Informatieveiligheidscomité / Comité de sécurité de l'information (IVC / CSI)** — established by the law of 5 September 2018 (in force 10 September 2018). Replaced the old sectoral committees of the CBPL (notably the *sectoraal comité sociale zekerheid en gezondheid*). Two chambers:
1. **Kamer Sociale Zekerheid en Gezondheid** — hosted at the Kruispuntbank van de Sociale Zekerheid (KSZ-BCSS) and the eHealth-platform.
2. **Kamer Federale Overheid** — hosted at FOD BOSA.

The IVC is **not** a GDPR supervisory authority. It issues **beraadslagingen / délibérations** authorising specific electronic exchanges of personal data (mostly social-security/health) where a Kaderwet protocol cannot be concluded, and gives sector-specific information-security guidance.

For logopedist flows the IVC matters when software exchanges data with eHealth Box, the KSZ, mutualities (eFact/MyCareNet) or regional vaults (Vitalink, Réseau Santé Bruxellois, Réseau Santé Wallon). Existing generic beraadslagingen cover MyCareNet's InsurabilityRequest, MemberData and the eHealth basisdiensten. The IVC does **not** "license" a SaaS — but the logopedist using halingo relies on those beraadslagingen, and halingo's integration must fit their conditions. Archive: ehealth.fgov.be/ehealthplatform/nl/sectoraal-comite/documenten.

---

## 4. Patient Rights Law (22 August 2002)

The **Wet van 22 augustus 2002 betreffende de rechten van de patiënt** (BS 26 September 2002) is the central patient-protection statute. It applies to every "beroepsbeoefenaar in de gezondheidszorg", which under the WUG / coordinated act of 10 May 2015 explicitly includes **logopedists**.

Substantially amended by the **Wet van 6 februari 2024** (in force **4 March 2024**), which strengthened information rights, formalised the *vertrouwenspersoon*, and added post-mortem access.

**Core rights** (now nine):
1. Quality service (art. 5);
2. Free choice of practitioner (art. 6);
3. Information about health status (art. 7);
4. Free, informed consent — withdrawable at any time (art. 8);
5. Right to a carefully kept and safely stored file (art. 9 §1);
6. **Right of access to the file within 15 days** (art. 9 §2). 2024 reaffirmed the deadline; access can only be restricted on the narrow "therapeutic exception" of art. 7 §4;
7. **Right to a copy** (art. 9 §3) — first copy free, further copies at reasonable cost; 2024 lets the practitioner refuse a copy where there are concrete indications of third-party pressure (insurer, employer);
8. Right to complain via hospital or federal ombudsman (art. 11/16);
9. Right to pain treatment (art. 11bis).

**Confidant vs representative — clarified in 2024**:
- **Vertrouwenspersoon / personne de confiance** (art. 7 §2 + new art. 11/1): chosen by the *capable* patient to assist them; can exercise information, access and copy rights with/for the patient.
- **Vertegenwoordiger / représentant** (art. 14): acts when the patient is *incapable*. Cascade: previously appointed mandate → court-appointed bewindvoerder over the person → cohabiting spouse → adult child → parent → sibling → multidisciplinary decision.

**File content** (cross-reference to art. 33 Kwaliteitswet, see §5): patient identifiers incl. INSZ, GP identity, practitioner and referrer, reason for contact, history, examination results (incl. bilans), conversation summaries, certificates and prescriptions, care plan.

**Mapping to halingo product features**:
- Patient portal → art. 9 §2 access.
- PDF/CSV export → art. 9 §3 copy and GDPR Art. 15/20.
- Confidant feature (named third-party read-only access) → art. 11/1 vertrouwenspersoon.
- "Refuse-with-reason" flow on copy requests → 2024 art. 9 §3.
- Access log of every read/write → art. 9 Kaderwet and GDPR accountability.

---

## 5. Medical-record retention — the 30-year rule

**Source.** Historically the 30-year duty came from the Code van geneeskundige plichtenleer (art. 24) and from civil-liability prescription doctrine. Since **1 January 2022** it is a hard statutory obligation under **art. 35 of the Kwaliteitswet of 22 April 2019**, applicable to *every* healthcare professional including logopedists:

> *De gezondheidszorgbeoefenaar bewaart het patiëntendossier gedurende minimum 30 jaar en maximum 50 jaar te rekenen vanaf het laatste contact met de patiënt.*

So: **min. 30 years, max. 50 years, from the last contact**.

**"Last contact"** = the last *clinically meaningful* interaction, not the file-creation date and not a billing reminder. In a multi-episode logopedic treatment, the last session of the most recent episode resets the clock.

**What must be retained** (the full patiëntendossier per art. 33 Kwaliteitswet):
- medical prescription (medisch voorschrift / prescription),
- bilans (aanvangsbilan, evolutiebilan, eindbilan),
- session notes (anamnese, observations, exercises, results),
- correspondence with GP, school, mutuality, RIZIV, other practitioners,
- consent forms,
- ID copies, INSZ,
- reports sent to the medisch adviseur of the mutuality,
- care plan and follow-up.

Billing data follows a separate regime — see §15.

**Storage format.** Art. 34 Kwaliteitswet introduces an electronic-only obligation, but its general entry into force depends on a Royal Decree per profession. As of April 2026 logopedists can still use either paper or electronic, or mixed. Halingo cannot tell users paper is forbidden (it isn't yet) but can position electronic as the de-facto best practice and the GBA-aligned default.

**Continuity on retirement / death.** The Kwaliteitswet (arts. 18-21) and the deontological codes oblige practitioners to ensure patient files remain accessible for the legal retention period even after they stop practising. Practical options: transfer to a successor, deposit with the professional college, or archiving by a contracted third party (a legitimate Art. 28 processor activity — halingo could offer an "after-life archive" tier). The DPA must specify what halingo does on (a) end of subscription, (b) practitioner death, (c) practice closure.

---

## 6. Professional secrecy — article 458 Penal Code

**Art. 458 of the Belgian Strafwetboek / Code pénal** punishes the disclosure of secrets entrusted to "geneesheren, heelkundigen, officieren van gezondheid, apothekers, vroedvrouwen en alle andere personen die uit hoofde van hun staat of beroep kennis dragen van geheimen". The list is *non-exhaustive*; Hof van Cassatie case law extends it to paramedical professionals including logopedists. Penalty: 1-3 years imprisonment + fine + disciplinary sanctions.

Scope: everything the patient confided, everything the practitioner observed/deduced through the therapeutic relationship, and the *fact* of being a patient. Exceptions: court testimony (art. 458), the art. 458bis authorisation to report crimes against minors/vulnerable persons, legal disclosure obligations, and the patient's own consent.

Halingo product implication: every employee, contractor and sub-processor with access to patient data must be **contractually bound** to secrecy equivalent to art. 458 (also required by art. 9 Kaderwet). The GBA has fined organisations that failed to demonstrate this contractual secrecy chain.

---

## 7. Shared secrecy and the care team

The doctrine of **gedeeld beroepsgeheim / secret professionnel partagé** lets secrecy holders share information *within* a team caring for the same patient without violating art. 458, on five conditions: (1) all recipients are themselves bound by professional secrecy; (2) all are involved in the same care mission for the same patient; (3) the information is strictly necessary (need-to-know); (4) it serves the patient's interest; (5) the patient has been informed and has not objected.

For a logopedist this is the basis for sharing a bilan with the prescribing physician (ENT, paediatrician, neurologist), with the GP, with school remediators bound by secrecy (CLB-medewerkers), and within a multidisciplinary practice. It is **not** a basis for sharing with insurers, employers, or non-care third parties — those need specific patient consent.

Halingo product implication: when a logopedist invites a colleague to a patient file, the system should record the colleague's professional status, the legal basis (shared secrecy or specific consent), the timestamp and scope; invitations must be revocable.

---

## 8. Health-data exchange via eHealth — legal basis

The **eHealth-platform** is a federal public institution established by the **wet van 21 augustus 2008**, last substantively amended by the **wet van 23 november 2023**. It is the trusted intermediary for electronic exchange of health data in Belgium.

**Key concepts**:
- **Therapeutische relatie / relation thérapeutique** — the documented care link between a specific patient and provider. Authorises consultation of the patient's shared health data on eHealth and via the regional vaults (Vitalink in Flanders, Réseau Santé Bruxellois, Réseau Santé Wallon).
- **Geïnformeerde toestemming / consentement éclairé** — the patient's opt-in to *electronic sharing* of their health data. Registered via eHealthConsent. Without it, providers cannot consult shared vaults (narrow emergency exceptions). With it, *only providers in a therapeutic relationship* may consult — necessary but not sufficient.
- **Reference directory** — added by the 2023 amendment: indicates which providers hold which types of patient data. Referencing requires only an *opt-out*, not informed consent.

**Logopedist context**: logopedists are listed zorgverleners (WUG / 10 May 2015). They can hold a therapeutic relationship and, within IVC beraadslagingen, consult/contribute to certain shared records. In practice they consume:
- **eHealth Box** for secure messaging with prescribers, mutuality medical advisors, schools;
- **MyCareNet** for insurability checks, eFact and eAttest (see `03-ehealth-mycarenet-eattest-efact.md`);
- **Sumehr** consultation where clinically relevant (currently mostly GP-authored).

**Interaction with GDPR Art. 9(2)(h)**: the eHealth-platform does **not** create a separate lawful basis. Every consultation rests on Art. 9(2)(h) + Art. 6(1)(c)/(b)/(e). The therapeutische relatie + geïnformeerde toestemming operationalise the Art. 9(2)(h)/9(3) conditions at the technical level.

---

## 9. Minors and incapacitated adults

**Minors.** The patient-rights law (art. 12) defaults to parental exercise of the rights, but art. 12 §2 says:

> *De patiënt wordt betrokken bij de uitoefening van zijn rechten rekening houdend met zijn leeftijd en maturiteit. De rechten kunnen door de minderjarige patiënt zelfstandig worden uitgeoefend indien hij in staat geacht wordt tot een redelijke beoordeling van zijn belangen.*

**No fixed age**. Practice and case law cluster around **12-14**, but it is a case-by-case assessment of "redelijke beoordeling van zijn belangen". Functional approach confirmed by the Vlaamse Kinderrechtencommissariaat and the Orde der artsen.

For a logopedist:
- **Below ~12**: parents have full access/consent rights (both parents jointly in joint custody).
- **~12-14**: the minor must be "betrokken" — informed, listened to, consent sought.
- **Above ~14**: generally autonomous, including right to refuse parental access. Document the maturity assessment.

**This is the medical-treatment threshold**, not the **information-society-services threshold** of Art. 8 GDPR / art. 7 Kaderwet, which Belgium set at **13**. For halingo's patient portal: a minor using the portal alone must be at least 13 *and* meet the patient-rights maturity test *and* the parents' rights apply — three layered rules.

**Incapacitated adults.** Art. 14 (reorganised 2024) sets the representative cascade (§4). The bescherming-van-personen / administration provisoire regime interacts: a court-appointed *bewindvoerder over de persoon* may be the representative for healthcare decisions.

Halingo implication: representative roles must be modelable, time-bounded, revocable. Access logs must distinguish patient, confidant and representative.

---

## 10. DPIA requirements

**When required.** Art. 35(1) GDPR — likely high risk. Art. 35(3) lists three automatic-trigger cases (systematic profiling with legal effect, large-scale processing of Art. 9 special categories, large-scale systematic public-area monitoring). The GBA's **official DPIA list** (BS 22 March 2019, in force 1 April 2019) is binding and adds 9 specific Belgian categories (large-scale biometric ID, third-party-sourced data for service decisions, active implantable medical devices, large-scale processing of vulnerable persons' data, etc.).

**For a solo logopedist**: GBA's FAQ position is that a solo healthcare practitioner is *normally not* obliged to run a DPIA — the processing is not "large-scale" in the GDPR sense. A **group practice** may cross the threshold (case-by-case).

**For halingo**: aggregating health data of many practices is unambiguously large-scale Art. 9 processing under Art. 35(3)(b) ⇒ **mandatory DPIA**. The DPIA must describe operations and purposes, assess necessity/proportionality, assess risks (CIA, secondary use, profiling), describe mitigations (encryption, RBAC, audit logs, sub-processor controls, breach plan), document residual risks, and be reviewed when processing changes materially. Methodology: GBA *Handleiding GEB* v4.0 (21 April 2021).

**DPO**:
- Halingo (processor) hits Art. 37(1)(c) ⇒ **must appoint a DPO**.
- Solo logopedist: *not* obliged. GBA recommends a designated contact point anyway.
- Group practice / network: case-by-case; once core activity is large-scale, DPO is mandatory. The GBA's 2023 priority on DPO supervision led to fines for "DPOs on paper" without resources or independence.

---

## 11. Controller vs processor — the logopedist and halingo

**Roles.** Controller = the logopedist (or the legal entity behind the practice) — decides means/purposes, what's in the file, when to share, when to delete, how long to retain. Processor = halingo — hosts the data and offers the tooling, processes only on documented controller instructions.

**Sub-processors.** Halingo's hosting, backup, e-mail relay, payment provider, error monitoring, analytics — all sub-processors. Each must be disclosed and bound by Art. 28-compliant contracts that flow down the controller's obligations.

**DPA — Art. 28(3) GDPR — must contain**:
1. Subject matter and duration.
2. Nature and purpose of the processing.
3. Type of personal data and categories of data subjects (here: patient identifiers, INSZ, contact data, health data, billing data; subjects = patients, prescribers, parents, representatives, school personnel).
4. Controller's obligations and rights.
5. Processor obligations:
   - process only on documented instructions, including for international transfers (28(3)(a));
   - ensure authorised persons are confidentiality-bound (28(3)(b)) — overlap with art. 9 Kaderwet and art. 458 Sw.;
   - implement Art. 32 security (28(3)(c));
   - respect sub-processor conditions, with prior general or specific authorisation (28(3)(d) + 28(2));
   - assist with data-subject rights (28(3)(e)) and Art. 32-36 compliance (28(3)(f));
   - on end of services, return or delete data at controller's choice (28(3)(g)) — *except* where law requires retention; the 30-year duty often forces "return", not "delete";
   - support audits and demonstrate compliance (28(3)(h)).

**Belgian specifics**: art. 9 Kaderwet requires the processor *also* to designate access categories and confidentiality-bind them. For eHealth flows the IVC may require an ISMS; halingo should align to **ISO/IEC 27001** and the **eHealth Information Security Policy** baseline ("minimale normen" of the KSZ-BCSS).

**Liability does not transfer**: even with a perfect DPA, the logopedist remains the controller and is the first contact for data-subject requests, breach notifications and the GBA. Halingo's job is to make the controller's life easy, not to absorb the controller role.

---

## 12. Sub-processors and international data transfers

**Rule.** Arts. 44-49 GDPR forbid transfers outside the EU/EEA unless a mechanism applies: **adequacy decision** (Art. 45 — UK, Switzerland, EU-US DPF), **SCCs** (Art. 46 — 2021 SCCs, Decision 2021/914), **BCRs** (Art. 47), or narrow **Art. 49 derogations**.

**Schrems II** (CJEU C-311/18, 16 July 2020) invalidated the Privacy Shield and held that SCCs alone are insufficient if the destination country's surveillance laws prevent the importer from honouring them. Controllers/processors must run a **Transfer Impact Assessment** (TIA) and adopt **supplementary measures** (EU-held keys, pseudonymisation, transparency reporting).

**EU-US Data Privacy Framework** (10 July 2023): adequacy for *certified* US organisations — brings DPF-certified AWS/GCP/Azure entities back under adequacy. Caveat: under legal challenge (Schrems III expected). Halingo should treat the DPF as a current basis but architect for the day it gets invalidated — keep the option to host fully in EU regions with EU-resident keys.

**Practical guidance for halingo (health data)**:
1. **EU regions by default** — AWS Frankfurt/Paris/Stockholm, GCP Belgium/Netherlands, Azure West Europe / Belgium. Pin storage, backups, replicas and logs to EU regions.
2. **Encrypt at rest with customer-managed keys** held in the EU, ideally in a different geographic zone from the data.
3. **TLS 1.2+** in transit (1.3 preferred).
4. **Public sub-processor inventory** with name/location/role/transfer mechanism; notify customers of changes (Art. 28(2)).
5. **TIA** for any non-EU sub-processor, *including* indirect transfers (e.g. EU sub-processor using US support staff).
6. **Health-sector reality**: no formal IVC ban on US clouds, but the IVC's *minimale normen* and the eHealth security baseline strongly prefer EU residency for personal health data. The safe default for a Belgian healthcare SaaS is "no data leaves the EU/EEA".

There is **no Belgian requirement** that health data be hosted in Belgium. EU/EEA hosting is the legal floor; Belgium-only is a marketing differentiator and risk-reduction choice, not a mandate.

---

## 13. Breach notification

**Timeline (Art. 33).** Controller must notify the GBA **without undue delay and, where feasible, within 72 hours** of becoming aware, unless the breach is unlikely to risk natural persons' rights. For health data, "unlikely" is almost never plausible. Notification content: nature of the breach (categories and approximate numbers), DPO or contact point, likely consequences, measures taken or proposed.

**Patient notification (Art. 34)**: when "high risk", inform affected data subjects in clear language without undue delay. For a leak of patient files, high risk is the default; partial exceptions only if data was strongly encrypted and keys remain safe.

**Processor's role**: halingo notifies the logopedist "without undue delay" (Art. 33(2)). The DPA should pin this to a concrete window (e.g. 24h) so the controller can still meet the 72h outer limit.

**Belgian portal**: GBA online portal at gegevensbeschermingsautoriteit.be / autoriteprotectiondonnees.be (EDPB template).

**Sector-specific notifications**:
- **RIZIV / INAMI**: no formal SaaS-breach regime, *but* if billing flows (eFact/MyCareNet) were affected, the practitioner may need to alert the mutuality and correct invoicing files.
- **Mutualities**: practical communication expected when insurability or invoicing data leaked.
- **NIS2**: the Belgian transposition (2024) classifies large healthcare providers as essential entities. A SaaS may qualify as "important" depending on size, with its own incident-reporting duty to the **CCB / Centre for Cyber Security Belgium** (24h early-warning, 72h notification, 1-month final report). *In addition* to GDPR notification, not a replacement.

**Documentation**: Art. 33(5) requires internal documentation of every breach (facts, effects, remedial action), even without notification. Halingo should keep an evergreen breach register.

---

## 14. Patient portal, cookies, analytics

**Cookies.** Art. **129 of the wet elektronische communicatie of 13 June 2005** transposes the ePrivacy Directive: every non-strictly-necessary cookie or tracker requires prior, freely given, specific, informed consent. Authority: GBA cookie checklist (October 2023) + November 2023 update.

Rules for a halingo patient portal:
- **Strictly necessary** (session, CSRF, auth): no consent.
- **Functionality** (language, theme): generally no consent if truly functional.
- **Analytics**: needs consent. Avoid US-routed Google Analytics; prefer **Plausible** or self-hosted **Matomo** in the EU, anonymised, no consent needed if no personal data leaves.
- **Marketing**: explicit consent — and arguably no place in a patient portal at all.

**Portal content**:
- Strong authentication, ideally **itsme** or eID; password + 2FA as fallback.
- Short sessions, idle-locked.
- Patient data over e-mail → "log in to view" link, not bare attachments. Bare attachments violate the Art. 32 floor for special-category data.

**Aggregated analytics**: out of GDPR scope only when fully anonymised and not re-identifiable, even probabilistically.

---

## 15. Retention of billing data and the tension with GDPR minimization

**Billing retention rule.** BTW / TVA + income tax + art. III.86 of the Wetboek van economisch recht: invoices and accounting books must be kept for **10 years** — extended from 7 by the **wet van 20 november 2022**, applicable to invoices from 1 January 2023 (aanslagjaar 2023). Pre-2023 invoices may still be on the 7-year track (verify with an accountant).

**Minimisation tension.** A patient's invoice contains identifiers (name, address, INSZ), date of service, RIZIV service code (and therefore an indirect pathology indication — codes 1141xx/1142xx etc.) and amount. Special-category data by inference. Yet the controller is *legally obliged* to retain it for 10 years.

**Reconciliation**:
- Billing data is a *separate* dataset from the clinical file. Different retention periods (10 vs 30 years) and arguably different access controls.
- Clinical retention is normally the longer one, so the file outlives its invoices; the converse rarely happens.
- After both periods elapse, data **must** be erased or fully anonymised (Art. 5(1)(e) storage limitation).
- Halingo product implication: distinguish "clinical record" and "financial record" with separate retention timers, separate purge jobs, separate access logs.

---

## 16. Right to erasure vs 30-year retention — how to reconcile

**The tension.** A patient invokes Art. 17 GDPR to erase their dossier. The practitioner is required by art. 35 Kwaliteitswet to retain it for at least 30 years from the last contact.

**Which prevails — and why.** **Retention wins.** Art. 17(3)(b) GDPR disapplies the right to erasure where processing is necessary for compliance with a legal obligation under Union or Member-State law; Art. 17(3)(c) does the same for "public interest in the area of public health in accordance with points (h) and (i) of Article 9(2)". Belgian doctrine and GBA positions confirm: a patient cannot force erasure of relevant medical data from a properly kept file during the legal retention period. The patient *can*:
- request **rectification** of factually wrong identifiers or wrong observations (not opinions);
- request **annotation** of contested entries;
- request **restriction** of processing (Art. 18) — kept but not actively used;
- request **erasure of peripheral data** not part of the legally-mandated file (e.g. internal notes that didn't need to be there).

After the retention period expires, the controller **must** delete or anonymise — not as a right of erasure, but as storage limitation (Art. 5(1)(e)) + the 50-year upper bound of art. 35 Kwaliteitswet.

**Halingo implication**: build an erasure-request workflow that lets the practitioner triage what *can* legally be erased (peripheral notes, marketing consent, draft text) vs what must be retained, with written justification for the patient. Build a scheduled retention purge for files where last-contact + 30 years has been reached, with manual confirmation (because "last contact" is sometimes ambiguous).

---

## 17. Freshness notes

- **Patient-rights law 2024 reform** (Wet van 6 februari 2024): in force since **4 March 2024**. The text changes art. 7, 9, 11, 14 and adds 11/1 and 16/1 (verify exact numbering). This file reflects the *post-reform* state.
- **Kwaliteitswet (22 April 2019)**: art. 33 (file content) and art. 35 (30-year retention) are in force since **1 January 2022**. Art. 34 (electronic-only obligation) is *not yet in general force*; it depends on a Royal Decree per profession. Verify before stating that paper is forbidden.
- **EU-US Data Privacy Framework** (10 July 2023) is currently a valid adequacy basis but is being challenged. Schrems III is plausible.
- **NIS2 transposition**: the Belgian law (in 2024) classifies many healthcare actors as essential or important entities. A SaaS may fall in scope. Verify the exact thresholds (employees, turnover) and any sector-specific designations before claiming applicability.
- **Accounting retention 10 years**: applies from invoices dated 2023+. Pre-2023 invoices may still be on the 7-year track. Verify with an accountant.
- **DPO obligation for solo practitioners**: the GBA's published position is that a solo healthcare practitioner is *not* automatically obliged to appoint a DPO. This may evolve; track GBA news.
- **IVC beraadslagingen** specific to logopedists are scattered across the IVC archive at ehealth.fgov.be/ehealthplatform/nl/sectoraal-comite/documenten — none is the *single* "logopedist beraadslaging"; the relevant ones are the generic ones on MyCareNet, eHealth Box, the basisdiensten, and the kine/paramed flows. Re-search the archive periodically.
- **eHealth law** was substantively amended on **23 November 2023**, in particular regarding the reference directory and the relationship between consent and referencing.

### Verification pass 2026-04-06 — status of known uncertainties

Verification note: `verification-2026-04/07-privacy.md`. Resolved 4/4.

- **Art. 34 Kwaliteitswet electronic-only obligation — RESOLVED.** As of 2026-04-06, **no KB/AR** has been taken under art. 34 for any profession, including logopedists. Paper, electronic or mixed files remain lawful. The consolidated ejustice text (Justel cn=2019042220) still reads "Vanaf een door de Koning bij een besluit vastgesteld na overleg in de Ministerraad te bepalen datum...". No draft RD for logopedists has been identified in public consultation as of this date. Commentary pages that list "art. 34" in the 1 January 2022 bundle refer to original-draft numbering; the current art. 34 is *not* in that KB van 12 december 2021.
- **"Sufficiently mature minor" age threshold — RESOLVED.** The Wet van 6 februari 2024 did **not** add a statutory age. Art. 12 §2 of the Patient Rights Law still uses the case-by-case "redelijke beoordeling van zijn belangen" test. GBA Advies nr. 15/2023 van 20 oktober 2023 did not endorse a bright line. Ordomedic and Domus Medica 2024 commentary continue to cluster 12-14 as practice guidance. Halingo keeps the functional assessment approach; do not hardcode a single age.
- **Schrems III / DPF reliability — RESOLVED.** The DPF (Decision 2023/1795) **remains valid**. On **3 September 2025**, the **General Court dismissed** Case **T-553/23 Latombe v Commission** (press release CP 106/25). Latombe appealed on **31 October 2025**; the appeal is pending before the CJEU as **Case C-703/25 P**. No direct NOYB/Schrems challenge to the DPF adequacy decision is currently pending. EDPB's first DPF review report (2024) flagged concerns but did not recommend discontinuing use. The GBA treats DPF as a valid transfer basis. The eHealth baseline still prefers EU residency for health data. Architectural guidance unchanged: EU-region default, EU-resident customer-managed keys, DPF only where unavoidable and non-clinical.
- **Belgian NIS2 transposition — RESOLVED.** Exact citation: **Wet van 26 april 2024 tot vaststelling van een kader voor de cyberbeveiliging van netwerk- en informatiesystemen van algemeen belang voor de openbare veiligheid**, **BS 17 mei 2024** (numac 2024202344), entry into force **18 oktober 2024**; implementing KB van 9 juni 2024. Competent authority: **CCB** via **Safeonweb@work**. Registration deadline was **18 maart 2025**; proof of compliance by **18 april 2025**. Size thresholds (Rec. 2003/361/EC): essential ≥ 250 FTE / €50 M turnover / €43 M balance sheet in Bijlage I; important = medium enterprise in Bijlage I or medium/large in Bijlage II. Micro/small (< 50 FTE **AND** < €10 M turnover **AND** < €10 M balance sheet) are out-of-scope by default. **Halingo (~100 practices served, SME size, likely < 50 FTE) is not directly in scope as an entity** today, but may be drawn in (a) if scaled above 50 FTE / €10 M, (b) if classified as an MSP under Bijlage I point 8, or (c) indirectly via supply-chain obligations of its in-scope healthcare customers. Incident-notification timeline for in-scope entities: early warning 24h, notification 72h, final report 1 month. Management liability and mandatory training apply. Penalties up to €10 M or 2% (essential) / €7 M or 1.4% (important).

### Residual open items (not uncertainties — watch-list)
- Whether a *group logopedic practice* (3+ practitioners, several thousand patients) is "large-scale" enough to trigger the DPO obligation. Risk-based assessment — no GBA bright line.
- Exact catalogue of MyCareNet services authorised for logopedists under current IVC beraadslagingen — see `03-ehealth-mycarenet-eattest-efact.md` and re-verify with RIZIV.
- CJEU Case C-703/25 P Latombe — scheduling and judgment.
- Any future NOYB DPF challenge.
- Publication of a KB under art. 34 Kwaliteitswet for any profession (leading indicator for logopedists).
- halingo's own size — crossing 50 FTE or €10 M triggers direct NIS2 scope reassessment.

---

## 18. Sources

**EU primary law**
- Regulation (EU) 2016/679 (GDPR); Directive (EU) 2016/680 (LED); Directive 2002/58/EC (ePrivacy) art. 5(3).
- CJEU C-311/18 (Schrems II), 16 July 2020.
- Decision (EU) 2021/914 (2021 SCCs); Decision (EU) 2023/1795 (EU-US Data Privacy Framework, 10 July 2023).

**Belgian primary law (canonical: ejustice.just.fgov.be)**
- Wet 22 augustus 2002 betreffende de rechten van de patiënt (cn=2002082245).
- Wet 6 februari 2024 tot wijziging van de Wet Patiëntenrechten (etaamb.openjustice.be/nl/wet-van-06-februari-2024_n2024001224); in force 4 March 2024.
- Wet 30 juli 2018 (Kaderwet GDPR) — eli/wet/2018/07/30/2018040581/justel; economie.fgov.be/nl/legislation/wet-van-30-juli-2018.
- Wet 22 april 2019 inzake de kwaliteitsvolle praktijkvoering in de gezondheidszorg (Kwaliteitswet), cn=2019042220; arts. 33-35 in force 1 January 2022.
- Wet 21 augustus 2008 oprichting eHealth-platform; ehealth.fgov.be/ehealthplatform/nl/wet-van-21-augustus-2008.
- Wet 23 november 2023 tot wijziging van de eHealth-wet (etaamb.openjustice.be/nl/wet-van-23-november-2023_n2023047343).
- Wet 5 september 2018 tot oprichting van het Informatieveiligheidscomité.
- Strafwetboek art. 458; Wet 13 juni 2005 betreffende de elektronische communicatie, art. 129; Wetboek van economisch recht, art. III.86; Wet 20 november 2022 (accounting 7→10 years, from aanslagjaar 2023); Belgian NIS2 transposition law (2024 — verify exact citation).

**Authority guidance and decisions**
- GBA / APD — gegevensbeschermingsautoriteit.be: official DPIA list (BS 22 March 2019, in force 1 April 2019); Handleiding GEB v4.0 (21 April 2021); FAQ-brochure KMO's; Cookie checklist (Oct 2023) + Nov 2023 update; Recommendation 04/2017 (DPO); Nota over de verwerking van gegevens uit patiëntendossiers; access-to-records decisions summarised in CMS-LawNow ealert Dec 2022.
- IVC / CSI Kamer Sociale Zekerheid en Gezondheid: ksz-bcss.fgov.be/nl/page/ivc-in-het-kort; ehealth.fgov.be/ehealthplatform/nl/informatieveiligheidscomite; beraadslagingen archive at ehealth.fgov.be/ehealthplatform/nl/sectoraal-comite/documenten; activiteitenverslagen 2023-2025.
- eHealth-platform — eHealthConsent at ehealth.fgov.be/nl/egezondheid/beroepsbeoefenaars-in-de-gezondheidszorg/ehealthconsent; Domus Medica explainer.
- Vitalink — toestemming-van-en-band-met-de-patient and sumehr pages at vitalink.be.

**Practitioner / commentary**
- Ordomedic (bewaring patiëntendossiers; art. 458 advies); Vlaams Artsensyndicaat (bewaartermijnen; DPO/DPIA stap 9); FOD Volksgezondheid patient-rights pages; Vlaams Patiëntenplatform "Wet patiëntenrechten: wat is nieuw?"; Domus Medica "Hervorming van de Wet Patiëntenrechten".
- Eubelius "Two new privacy acts published and in force"; Sciensano paper aph66_137-157; ICLG Digital Health Belgium 2025; Brussels Health Network on diagnosis erasure.
- Schrems II / cloud: Sirius Legal blog; AWS whitepaper "Navigating Compliance with EU Data Transfer Requirements" (2023).
- Accounting retention 7→10: KMG Accountants, Embuild Antwerpen, Kantoor Feys, Fiskodata.

> Canonical sources: **ejustice.just.fgov.be** for law texts and **gegevensbeschermingsautoriteit.be** for guidance. Re-verify entry-into-force dates and Royal Decrees before using this file in production decisions.
