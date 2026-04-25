# 09 — Peppol and the Belgian B2B E-Invoicing Mandate for Logopedist Praktijken

> Last verified: 2026-04-06
> Scope: The general Belgian B2B structured e-invoicing mandate via Peppol as it applies to logopedist praktijken and to a SaaS that serves them. Complements — and is distinct from — file 03 (eHealth/MyCareNet/eAttest/eFact), which covers the healthcare-specific billing channel.
> Audience: halingo.be engineering, product and compliance team

---

## ⚠️ Scope decision — 2026-04-07

**halingo does NOT implement Peppol.** This file is **context**, not a build spec.

Founder confirmed on 2026-04-07: halingo is a **clinical practice-management + RIZIV-billing SaaS**, not an accounting product. Every praktijk uses their own accountant or general accounting software (Octopus, Yuki, Exact, Billit, WinBooks, Horus, …) for general bookkeeping, VAT returns, payroll, and **Peppol B2B e-invoicing**. That tooling is the legal Peppol sender/receiver for the praktijk; halingo is not.

**What halingo does NOT do** (these belong to the praktijk's accountant or accounting software):
- Be a Peppol Access Point (sending or receiving)
- Issue B2B Peppol invoices for rent, retrocessie, B2B sales of materials, expert reports, lectures
- Receive supplier Peppol invoices (accounts payable)
- Look up counterparties in the SMP / SML
- File VAT returns, BTW-aangifte, or any general-ledger artefact
- Claim the +120% structured-invoicing-software cost deduction (it does not qualify, because it is not classified as structured-invoicing software for general B2B — it is a clinical SaaS)

**What halingo DOES support** (touchpoints with the accounting world):
- **Patient invoicing** (B2C — out of Peppol scope by definition)
- **Mutuality billing** (eFact/MyCareNet path — still paper for logopedie, see file 03 — completely separate from Peppol)
- **Tracking sales of ancillary materials to patients** (books, toys, exercise tools) inside the patient ledger
- **Structured export** of patient invoices, mutuality-receivables, and ancillary-sales data in a format the accountant can import (UBL, CSV, CODA-friendly references) so they can reconcile in their own tool
- **Payment marking** so the praktijk can flag patient/mutuality payments as received, with export

**Why this file is still in the KB even though halingo doesn't build Peppol:** Praktijk owners and their staff will ask the halingo support team about Peppol obligations. Halingo sales conversations will hit "do you do e-invoicing?" Sales reps and CS need to give an accurate answer ("no, your accountant does — and here's why that's correct"). This file is the source for that answer.

**Edge case worth flagging:** if a praktijk uses halingo to track outgoing sales of materials and some of those go to a B2B counterparty (a school, another praktijk), those specific invoices technically fall under the Peppol mandate. **The praktijk's accountant should issue them via the accounting software, not via halingo.** Halingo can expose those line items as a structured export the accountant pulls in.

The remainder of this file is the full reference on the Belgian Peppol mandate — kept for context, support, and understanding what the praktijk ecosystem actually has to do. **Treat sections 5–10 as background, not as a halingo build spec.**

---

This file fills a gap left by files 01–08: those cover RIZIV nomenclature, prescriptions, eHealth/MyCareNet, recognition, the regional regimes, GDPR, and general business/tax/VAT/mutuality topics. None of them cover the **general Belgian e-invoicing mandate** that applies to every Belgian VAT-taxable person from 1 January 2026, regardless of sector. That mandate is a horizontal piece of tax law (BTW-wetboek + WIB 1992 + a Royal Decree), not a healthcare rule, but it directly affects every logopedist praktijk in two ways:

1. Some of the praktijk's outgoing invoices (other practices, schools, employers, insurers, training centres) sit in the B2B perimeter and must be issued via Peppol from 1 January 2026.
2. **Every** praktijk — even a fully art. 44-exempt solo logopedist with no VAT number — will *receive* Peppol invoices from suppliers (accountant, software, telecom, landlord, training providers), because the suppliers are obliged to send that way.

Section 11 (Freshness notes) records the dates we verified each item and the items where the field is unsettled.

---

## 1. Why this file exists — Peppol vs eFact vs plain invoice

A logopedist praktijk in Belgium has, from 1 January 2026 onwards, **three structurally distinct billing channels** that must coexist in any practice-management SaaS:

| Channel | Counterparty | Legal regime | Network / format | Covered in |
|---|---|---|---|---|
| **Peppol BIS Billing 3.0** | Belgian VAT-taxable businesses (B2B) | Wet 6 februari 2024, KB 8 juli 2025, art. 53 §2bis WBTW | Peppol 4-corner network, EN 16931 / UBL 2.1 | **this file (09)** |
| **eFact / MyCareNet** | Mutualiteiten (third-party-payer / derdebetaler) | RIZIV/INAMI nomenclature + MyCareNet conventions | CIN/NIC, KMEHR, MyCareNet web services | file 03 |
| **Plain invoice (PDF, paper, getuigschrift)** | Patients (B2C), or any non-VAT-taxable person | BTW-wetboek invoice rules, getuigschrift voor verstrekte hulp | None mandated; PDF/paper is fine | files 01, 03, 08 |

These three channels are **legally distinct** and must remain distinct in halingo's data model. A patient invoice cannot be sent via Peppol (the patient is B2C and almost never has a Peppol participant ID); a derdebetaler claim to Christelijke Mutualiteit cannot be sent via Peppol (mutualities consume eFact/MyCareNet, not Peppol); and a B2B invoice to a school or to another praktijk cannot go via eFact (eFact only knows ziekenfondsen). Conflating any two of them is a compliance bug.

The most common mistake in early 2026 has been to assume that "the new Belgian e-invoicing rule applies to all my invoices" — it does not. It applies only to Belgian-domestic B2B between two parties that both have a BTW-status that brings them in scope. This file makes the line precise.

---

## 2. Legal foundation — wet van 6 februari 2024

### 2.1 The primary law

**Title (NL):** *Wet van 6 februari 2024 tot wijziging van het Wetboek van de belasting over de toegevoegde waarde en het Wetboek van de inkomstenbelastingen 1992 wat de invoering van de verplichting tot elektronische facturering betreft.*

**Title (FR):** *Loi du 6 février 2024 modifiant le Code de la taxe sur la valeur ajoutée et le Code des impôts sur les revenus 1992 en ce qui concerne l'introduction de l'obligation de facturation électronique.*

- **Promulgation:** 6 February 2024
- **Publication:** *Belgisch Staatsblad / Moniteur belge*, **20 February 2024**
- **NUMAC:** **2024001635**
- **Issuing authority:** Federale Overheidsdienst Financiën / Service Public Fédéral Finances
- **Consolidated text:** <https://etaamb.openjustice.be/nl/wet-van-06-februari-2024_n2024001635.html> (NL) and the matching FR URL.

### 2.2 What the law actually amended

The law has five operative articles. The two that matter for halingo are:

**Article 2** of the Wet — inserts a new definition into **Article 1, § 13 WBTW** of a *gestructureerde elektronische factuur*:

> *een elektronische factuur die is opgesteld, verzonden en ontvangen in een gestructureerde elektronische vorm die de automatische en elektronische verwerking ervan mogelijk maakt.*

This is the Belgian transposition of the EN 16931 definition. A PDF, even if delivered by email, is **not** a structured electronic invoice. A structured XML payload (such as Peppol BIS Billing 3.0 in UBL 2.1) is.

**Article 3** of the Wet — inserts a new **Article 53, § 2bis WBTW**: this is the central operative provision. It obliges every Belgian-established VAT-taxable person to *issue* a structured electronic invoice in those situations where Article 53, § 2 obliges them to issue an invoice **and** the customer is also a Belgian-established VAT-taxable person identified for VAT. Symmetrically it obliges the customer to *receive* such an invoice.

**Article 4** of the Wet — amends **Article 64ter WIB 1992**: this is the legal hook for the temporary +120% verhoogde kostenaftrek for SME e-invoicing software (see section 6.1 below).

**Article 5** of the Wet — amends **Article 194octies WIB 1992**: this scopes the small-company definition for the cost-deduction benefit.

### 2.3 The implementing Royal Decree

**Title (NL):** *Koninklijk besluit van 8 juli 2025 tot wijziging van koninklijk besluit nr. 1 van 29 december 1992 met betrekking tot de regeling voor de voldoening van de belasting over de toegevoegde waarde en koninklijk besluit nr. 44, wat betreft de elektronische facturering*.

- Published in *Belgisch Staatsblad* on **14 July 2025** (NUMAC 2025005169).
- This KB is the operational rulebook. It inserts a new **Article 13ter into KB nr. 1** which fixes:
  - the **technical standard**: every structured e-invoice must conform to the European norm **EN 16931** (semantic data model + Belgian CIUS);
  - the **format**: the default and reference format is **Peppol BIS Billing 3.0** in **UBL 2.1**;
  - the **transmission channel**: the default and reference channel is the **Peppol 4-corner network** operated under the **OpenPeppol** governance model;
  - an **opt-out** clause: the parties may agree on another EN 16931-compliant format and another channel, **provided that** both the format and the channel respect EN 16931 *and* both parties remain reachable on Peppol as a fallback;
  - **VAT-rounding rules** for structured invoices: rounding may only be applied to the total VAT amount, not per invoice line.
- The KB also amends **KB nr. 44** to insert the new fixed-amount fines (see section 10).

### 2.4 EU legal context

The Belgian B2B mandate required a derogation from the EU VAT Directive (2006/112/EC). Belgium received the **Council Implementing Decision (EU) 2024/2425** authorising it to deviate from articles 218 and 232 of the VAT Directive and to impose mandatory structured e-invoicing for B2B between Belgian-established taxpayers. The derogation is in force until the EU **VAT in the Digital Age (ViDA)** rules — adopted as Council Directive (EU) 2025/516 on 11 March 2025 — fully replace it. ViDA's intra-Community digital reporting requirement (DRR) and structured-invoice obligation kicks in on **1 July 2030**.

---

## 3. Scope — who must send, who must receive

### 3.1 The general rule

The mandate applies if **all** of the following are true at the moment the invoice is issued:

1. The **supplier** is a VAT-taxable person *established in Belgium* (or has a vaste inrichting in Belgium that takes part in the supply). A foreign company merely identified for Belgian VAT (e.g. a Dutch BV with a BE-number for distance selling) is **not** in scope.
2. The **customer** is a VAT-taxable person obliged to communicate its Belgian BTW-number to its suppliers — i.e. its activity is itself in scope of the BTW-wetboek.
3. The **transaction** is a domestic supply of goods or services that is *not* exempt under Article 44 WBTW.
4. The supplier is obliged to *issue* an invoice for that supply under Article 53, § 2 WBTW.

When all four are met, the supplier **must issue** a structured electronic invoice and the customer **must receive** it. Effective date: **1 January 2026**.

The FOD Financiën formulates the principle as:

> *Vanaf 1 januari 2026 moeten alle Belgische btw-plichtige ondernemingen tussen elkaar gestructureerde elektronische facturen gebruiken*. (efactuur.belgium.be)

The logical converse is the most useful operational rule: **if any of the four conditions fails, the mandate does not apply** to that specific transaction. This is how a single logopedist praktijk can have some invoices in scope and other invoices out of scope on the same day.

### 3.2 Article 44 §1 WBTW fully exempt practitioners — the logopedist edge case

**This is the central exemption for halingo's user base.** A solo logopedist whose entire activity consists of *therapeutische logopedische verstrekkingen* falls under the medical-care exemption of **Article 44, § 1, 2° WBTW** (and the patient-protection exemption in § 1, 1°). Such a logopedist:

- has **no Belgian BTW-nummer** (only a KBO/CBE enterprise number);
- does **not file BTW-aangiftes**;
- does **not charge BTW** on patient invoices and does not deduct BTW on incoming costs;
- is **not** a "btw-plichtige onderneming" in the operational sense that the mandate uses.

**Result:** an art. 44-only logopedist is **not obliged** to send Peppol invoices and is **not obliged** to receive Peppol invoices, *under the strict letter of the wet*. The FOD Financiën has confirmed this in plain language on the official FAQ page:

> *Er is geen verplichting om gestructureerde elektronische facturen te verzenden of te ontvangen als de handeling is vrijgesteld door artikel 44 van het Btw-Wetboek.* (efactuur.belgium.be — *Voor wie wordt e-facturatie verplicht?*)

EY confirms the same reading in its 2025 tax alert: persons "exclusively performing VAT-exempt transactions under Article 44" are excluded both as supplier and as recipient. Tiberghien's analysis (one of Belgium's leading tax-law firms) reaches the same conclusion.

**Practical implication for halingo:** the *legal* obligation to receive Peppol does not bite on a typical solo logopedist. **The de facto need to receive Peppol bites on every solo logopedist anyway**, because:

- the praktijk's accountant is a btw-plichtig dienstverlener and must issue Peppol from 1 January 2026;
- the praktijk's landlord (when there is one with VAT-opted real estate), telecom provider, ICT supplier, training provider, professional liability insurer, etc. are all in scope;
- halingo *itself*, as a Belgian SaaS, will have to invoice its logopedist customers via Peppol if halingo carries any Belgian-established VAT-taxable customers — and the simplest way to handle this uniformly is to register every customer as a Peppol receiver via their KBO/CBE number.

So the engineering rule is:

> A pure-art. 44 logopedist has **no legal sending obligation** and **no legal receiving obligation**, but **must in practice be reachable as a Peppol receiver** because their own suppliers are obliged to address them by Peppol participant ID. halingo should default every customer to "Peppol-reachable as receiver" and only set the sending capability when the customer actually has a BTW-nummer.

### 3.3 Mixed taxable persons (gemengde belastingplichtigen)

Many logopedist praktijken have a small taxable side activity. Common cases:

- sale of speech/language exercise materials, books, board games, articulation cards;
- expert reports for insurance companies, schools, courts;
- paid lectures, workshops, train-the-trainer activities;
- speech coaching for executives or actors (not therapeutic, no medical purpose);
- VAT-opted office sublet to a colleague;
- writing for trade publications.

These activities are *not* exempt under art. 44 and force the praktijk into a **gemengde belastingplichtige** status. The praktijk holds a BTW-nummer, files quarterly or yearly BTW-aangiftes, and applies the *algemeen verhoudingsgetal* or *werkelijk gebruik* method to determine the VAT-deductible portion of mixed costs.

**For the e-invoicing mandate, this matters in a focused way:** the obligation to issue a Peppol invoice applies **only to the taxable side of the activity**, and only when the customer is a Belgian-established btw-plichtige. Concretely:

- A logopedist who sells board games to a school under VAT must issue a Peppol invoice for that sale.
- The same logopedist's therapeutic invoices to patients remain art. 44-exempt and stay outside Peppol.
- The same logopedist's expert report invoiced to an insurer (B2B, taxable, Belgian) goes via Peppol.

> *Gemengde btw-plichtigen moeten alleen een e-factuur uitreiken wanneer ze een btw-belaste prestatie verrichten, niet voor hun btw-vrijgestelde activiteiten.* (Tiberghien, *België verplicht B2B e-facturatie vanaf 1 januari 2026*)

**Once a logopedist holds a BTW-nummer — even for a small mixed activity — the receiving obligation activates fully**. They become a "Belgian-established VAT-taxable person" for the purposes of art. 53 §2bis, and any supplier targeting them as a B2B customer must address them via Peppol.

### 3.4 Praktijk BV / SRL

A logopedist who has incorporated as a *besloten vennootschap* (BV / SRL) — a common setup for higher-earning solo therapists or for group practices — is a **legal person** identified at the KBO/BCE. The corporate veil does not change the BTW analysis: if the BV is fully art. 44-exempt, the same conclusion as section 3.2 applies (no sending, no receiving obligation, but practical receiving capability needed). If the BV has any taxable activity, it is a gemengde belastingplichtige and section 3.3 applies.

**Important detail:** the **Belgian Peppol participant identifier of choice for a legal person is the KBO/BCE enterprise number** under scheme 0208 (see section 4.3). This is true whether or not the BV has a BTW-nummer. The KBO number is the universal Belgian business identifier; the BTW-number is a tax-administration label that may or may not be present.

### 3.5 Retrocessie and inter-praktijk flows

Two distinct retrocessie patterns occur in the Belgian logopedie field:

- **Retrocessie tussen logopedisten** for shared patients or onroerend-goed kostendelende vennootschappen. If both logopedists are art. 44-exempt without VAT number, the retrocessie is in principle a non-VAT flow and stays outside Peppol. If either side has a VAT number for a mixed activity, the analysis becomes case-by-case.
- **Honorariadelegatie via een groepspraktijk-vehikel** (often a kostendelende vereniging or a maatschap). The maatschap may itself be VAT-taxable or VAT-exempt depending on its function; check the BTW administration's circular 2017/C/61 on cost-sharing associations.

**Most logopedie cost-sharing structures end up out of Peppol scope** because the underlying medical exemption flows through. But this is a topic where halingo should not give blanket advice — the SaaS should expose the right toggles ("does this counterparty hold a BTW-nummer?", "is this transaction art. 44-exempt?") and let the praktijk's accountant make the call.

### 3.6 Other exclusions

The FOD Financiën page *Voor wie wordt e-facturatie verplicht?* lists the following groups as **outside** the obligation:

- **Forfaitaire btw-plichtigen** under art. 56 WBTW. The forfait scheme is being phased out and ends on 1 January 2028; until then it stays out.
- **Bijzondere landbouwregeling** (art. 57 WBTW): excluded from sending; receiving obligation applies only in a limited form.
- **Gefailleerde btw-plichtigen**: excluded as long as the bankruptcy procedure runs.
- **Niet in België gevestigde btw-plichtigen zonder vaste inrichting**, even if they hold a BE-VAT number.
- **B2C** (uitgaande facturen aan particuliere klanten): the supplier is **not** obliged to issue Peppol to a private individual. But the supplier of a B2C-only business **does** need to be able to *receive* Peppol because their own suppliers will address them that way.

The **kleine ondernemingsregeling** (vrijstellingsregeling for small businesses with turnover ≤ €25,000 under art. 56bis WBTW) is **in scope**. Small businesses under this regime are still VAT-taxable persons; they hold a BTW-nummer; they merely do not charge VAT and do not file periodic BTW-aangiftes. The FOD Financiën FAQ states explicitly:

> *De verplichting geldt als u gebruik maakt van de vrijstellingsregeling voor kleine ondernemingen (als het jaarlijks omzetcijfer van uw onderneming niet meer dan 25.000 euro bedraagt).* (efactuur.belgium.be)

This is a frequent source of confusion in the field. The Astro and OkiOki accounting-app FAQs both confirm that art. 56bis vrijgestelde ondernemingen ARE in scope — the threshold-exemption is from VAT collection, **not from the structured-invoicing obligation**.

### 3.7 Three-month tolerance period (Q1 2026)

For the period **1 January 2026 to 31 March 2026**, the FOD Financiën has announced a *tolerantieperiode*: no fines will be imposed for breaches of the new e-invoicing obligation specifically, **provided** that the taxpayer can demonstrate it has taken *redelijke en tijdige stappen* to come into compliance (active onboarding with an Access Point, contracts in place with software providers, training booked, etc.). The grace period was confirmed by KPMG, Loyens & Loeff and the Royal Decree no. 44 amendment.

**As of today (2026-04-06)** the tolerance period has just **ended**. Full enforcement applies from 1 April 2026. VATupdate confirms: "Belgium's 3-month grace period for penalties ends on 1 April 2026."

A separate longer tolerance, until **30 June 2026**, applies specifically to **self-billing** functionality where the company can show its software vendor is still implementing it.

---

## 4. Format and channel

### 4.1 Peppol BIS Billing 3.0 / EN 16931 / UBL 2.1

The mandatory format chain is:

1. **EN 16931** — the European core invoice semantic data model. Adopted by CEN; references CEN/TS 16931-2 for syntax bindings. This defines *which fields* a structured invoice must contain (seller, buyer, line items, totals, VAT breakdown, payment terms, etc.).
2. **Peppol BIS Billing 3.0** — the OpenPeppol *Business Interoperability Specification* that profiles EN 16931 for cross-border use. It is what you actually generate and send.
3. **UBL 2.1** — the OASIS Universal Business Language XML syntax in which Peppol BIS Billing 3.0 is serialised. The alternative CII (Cross Industry Invoice / UN/CEFACT) syntax is *technically* allowed by EN 16931 but is **not used by Peppol BIS** — UBL is the only syntax in practice.

**Belgium-specific CIUS:** Belgium has not (as of April 2026) published a national CIUS layered on top of Peppol BIS Billing 3.0. There is no extra mandatory Belgian field beyond the Peppol BIS core. The Belgian *gestructureerd gestandaardiseerde mededeling* (OGM/VCS) is supported via the standard Peppol payment-reference mechanism.

**Alternative formats:** The KB of 8 July 2025 allows the parties to *agree* on another format and another channel **only if** both the format and the channel comply with EN 16931 and only if the parties remain reachable via Peppol as the fallback. In practice the only widely-used non-Peppol B2B channels in Belgium are big-corporate EDI links (Factur-X / ZUGFeRD hybrid PDF/XML for cross-border with Germany and France, occasionally pure UBL via SFTP) — none are relevant for a logopedist praktijk SaaS.

**A PDF emailed by the logopedist is not a structured e-invoice**, even if the PDF is generated by halingo. The structured part of the e-invoice is the XML payload; a PDF preview is allowed as a *human-readable rendering* alongside the XML, but cannot replace it.

### 4.2 The 4-corner model

Peppol uses a *4-corner model*:

```
[Corner 1: Sender]  --->  [Corner 2: Sender's Access Point]
                                    |
                                    | (Peppol network — eDelivery / AS4)
                                    v
[Corner 4: Receiver]  <---  [Corner 3: Receiver's Access Point]
```

- **Corner 1**: the supplier's invoicing software (halingo, Billit, Odoo, Octopus, …).
- **Corner 2**: the supplier's *Peppol Access Point* (= Peppol Service Provider). It validates the UBL document, signs it, and ships it over the Peppol AS4 transport profile.
- **Corner 3**: the customer's Access Point. It receives the AS4 message, validates the signature, and hands the UBL to the customer's software.
- **Corner 4**: the customer's accounting/practice software.

The handover between Corner 2 and Corner 3 is governed by the **Peppol eDelivery Network** (formerly known as PEPPOL eDelivery). Routing happens via two lookup services:

- **SML** (Service Metadata Locator): a single global DNS-based directory that, given a participant ID, returns the URL of the SMP that knows that participant.
- **SMP** (Service Metadata Publisher): the per-Access-Point endpoint that returns the participant's supported document types, processes, and the AS4 endpoint to which messages should be delivered.

For Belgian-domestic routing, BOSA operates the **Belgian SMP** at <https://smp.belgium.be>. Belgian Access Points are required by BOSA's Peppol Authority Specific Requirements (PASR) to register every Belgian participant they service in this SMP.

### 4.3 Peppol participant ID schemes for Belgium

Peppol identifies network participants by an `(scheme, identifier)` tuple. The scheme is a 4-digit numeric code from the OpenPeppol *Participant Identifier Schemes* code list. For Belgium, the relevant codes are:

| Scheme | Name | Usage in Belgium |
|---|---|---|
| **0208** | Numéro d'entreprise / Ondernemingsnummer (KBO/BCE/CBE) | **Mandatory primary identifier**. BOSA's PASR requires every Belgian Peppol participant to be reachable via 0208. |
| **9925** | Belgium VAT number | Allowed as a *secondary* identifier. May exist *in parallel* with 0208 but **never instead of** 0208. |
| **0192** | Norwegian organisation number | Not applicable to Belgian participants. |
| **0184** | DK CVR | Not applicable. |

**Important rule (BOSA PASR):**

> *Belgian Peppol Service Providers must ensure that any Belgian Peppol Participant they service is identified on Peppol using its enterprise number, the identification scheme of the Belgian Crossroads Bank for Enterprises (ICD: 0208).*

**Examples for halingo's data model:**

- A solo logopedist with KBO/CBE 0712.345.678 → Peppol participant ID `0208:0712345678` (no `BE` prefix, no dots, no spaces, exactly 10 digits).
- The same logopedist's BTW-nummer (if any) is BE0712.345.678. The corresponding Peppol ID `9925:BE0712345678` is **optional** and may exist in parallel; it does not replace `0208:0712345678`.
- A praktijk BV with KBO 0876.543.210 → `0208:0876543210`.

**Schema validation rules:**
- The 0208 identifier is exactly 10 numeric digits, no separators, no `BE` prefix.
- Lookup of a Belgian participant should always be performed first against scheme 0208. Fall back to 9925 only if 0208 is missing.
- halingo should store the KBO number in a normalised form (10 digits, no separators) and *derive* the Peppol participant ID rather than storing the participant ID separately.

**Discovery / "is this counterparty Peppol-reachable?":**

A SaaS that wants to know whether a candidate counterparty can receive Peppol must perform an **SML/SMP lookup**. The simplest path is to:

1. Hash the participant ID (ID + scheme) using the Peppol-specified MD5 + base32 algorithm.
2. Resolve `<hash>.iso6523-actorid-upis.edelivery.tech.ec.europa.eu` in DNS — this returns the SMP URL.
3. Query the SMP's `/iso6523-actorid-upis::0208:0712345678` endpoint to fetch the participant's *ServiceGroup*.
4. Inspect the supported document types — for invoicing the relevant one is `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1`.

Most Access Points expose a wrapper REST/SOAP API around this so halingo does not need to implement the DNS dance directly. The **Peppol Directory** (<https://directory.peppol.eu>) also offers a free name-based UI search that is useful for support staff.

There is also a Belgian convenience tool, **PeppolCheck** (<https://www.peppolcheck.be>), and a public lookup at <https://peppol.helger.com/public/menuitem-tools-pid-check-be>, both of which let halingo's support team paste a KBO number and see whether the counterparty is registered.

---

## 5. The Belgian Peppol Authority (BOSA)

The **FOD/SPF BOSA** (*Federale Overheidsdienst Beleid en Ondersteuning* / *Service Public Fédéral Stratégie et Appui*) has been the Belgian Peppol Authority since **1 January 2016**. BOSA's role under the OpenPeppol governance model is:

- to **promote** the use of Peppol in Belgium (public communication, BOSA's e-invoice landing pages);
- to **enforce** the OpenPeppol *Peppol Authority Specific Requirements (PASR)* — Belgium's national addendum to the Peppol Service Provider Agreement;
- to **operate the Belgian SMP** at <https://smp.belgium.be>, which historically was used as a default SMP for any Belgian KBO that had not yet picked a private Access Point;
- to **register and supervise Access Points** that serve Belgian participants;
- to **operate the Mercurius platform** for B2G invoicing (see section 9.2).

BOSA's e-invoicing landing pages are <https://efactuur.belgium.be> (NL), <https://efacture.belgium.be> (FR) and the canonical FAQ portal at <https://einvoice.belgium.be> (multilingual).

**Hermes was BOSA's free fallback bridge** (a default Access Point that automatically registered every Belgian KBO as a Peppol receiver). It was decommissioned at **end of 2025** (31 December 2025), with consultation-only access kept open until **31 March 2026**. The reason for the shutdown: Hermes had auto-registered every Belgian company on Peppol pointing at itself, which created a friction barrier when companies wanted to move to a private Access Point. With the 2026 mandate landing, BOSA judged the private market mature enough to absorb everyone and pulled Hermes. **There is no direct successor**: micro-businesses must now sign up with a commercial Access Point (most of which offer free tiers — see section 7).

**Becoming a Belgian Access Point** requires:

1. Joining **OpenPeppol** as a Service Provider (annual fee ranging by tier; the *Service Provider* tier is currently around €3,000–€10,000 per year depending on transaction volume).
2. Signing the **Peppol Service Provider Agreement** with BOSA (the Belgian Peppol Authority).
3. Agreeing to and respecting the **PASR** — including the mandatory 0208 identifier rule (section 4.3).
4. Operating an **AS4 endpoint** that passes the OpenPeppol conformance suite.
5. Operating an **SMP** (or sub-letting one) that publishes the Service Group entries for serviced participants.
6. Appearing on the public **Belgian SMP register**.

This is a non-trivial certification effort that takes weeks and ongoing operational responsibility (24/7 uptime expectations, disaster-recovery plans, audit trails). For a vertical SaaS like halingo, **becoming an Access Point yourself is not the recommended pattern** — see section 8.1.

---

## 6. Tax incentives

### 6.1 +120% verhoogde kostenaftrek (temporary, 2024–2027)

**Legal basis:** Art. 64ter, eerste lid, 1° WIB 1992, as amended by Article 4 of the Wet van 6 februari 2024.

**What it grants:** Small companies and self-employed individuals may deduct **120%** of qualifying e-invoicing software subscription costs for income-tax purposes — i.e. they get an extra 20% on top of the normal 100% deduction.

**Time window:** Income years **2024 through 2027** (aanslagjaren 2025 t/m 2028). The measure is **temporary** by design, intended to subsidise the onboarding period.

> *In de belastbare tijdperken 2024 tot en met 2027 mogen kleine kmo's en zelfstandigen die abonnementsformules gebruiken, een verhoogde kostenaftrek van 120 % toepassen.* (efactuur.belgium.be — *Fiscale stimulansen*)

**Who qualifies:**
- Natuurlijke personen (eenmanszaken / sole-trader self-employed).
- *Kleine vennootschappen* per **art. 1:24, § 1 WVV** — companies that do not exceed more than one of the criteria: (i) ≤ 50 employees average, (ii) ≤ €11.25 million turnover (excl. VAT), (iii) ≤ €6 million balance-sheet total. Most logopedie-praktijk BVs sit comfortably below these thresholds.

**Qualifying expenses:**
- **Periodic subscription fees** for e-invoicing software (a SaaS like halingo, Billit, Yuki, …).
- **Advisory fees** specifically for preparation of e-invoicing compliance (consultancy hours from accountant or IT integrator, training).
- The **incremental e-invoicing premium** charged on top of an existing accounting-software subscription — provided that this premium is **separately stated on the invoice**.

**What is excluded:**
- **Depreciation / afschrijvingen** of capitalised invoicing software (i.e. one-off purchases entered as fixed assets). These do not qualify for the +120%; they fall under the +20% investeringsaftrek instead (section 6.2).

> *De verhoogde kostenaftrek betreft uitsluitend de rechtstreekse kosten met betrekking tot het voorbereiden van het voldoen aan de elektronische factureringsverplichtingen.*

**How it is claimed:** The +20% extra deduction is reported in the personal-income-tax return (Vak XVIII) for self-employed / eenmanszaak, or in the corporate-income-tax return (Vak — Verhoogde kostenaftrek elektronische facturatie) for kleine vennootschappen. The accountant adjusts the *boekhoudkundige kost* upward by 20% in the *fiscale aangifte* via a *verworpen uitgave / aftrek-correctie*.

### 6.2 +20% investeringsaftrek voor digitale investeringen

**Legal basis:** Art. 69 WIB 1992 (eenmalige investeringsaftrek) as reformed for **investments made from 1 January 2025**, with the digital investment category set at **20%** of the investment value.

**Effective date:** From 1 January 2025 onwards. **Permanent** (the 2025 reform turned digital investment deduction into a permanent baseline).

**Who qualifies:**
- Natuurlijke personen.
- *Kleine vennootschappen* per art. 1:24 § 1 WVV.

**Qualifying investments:** *Digitale vaste activa* in the new *vernieuwde lijst* of the Royal Decree of 20 December 2024 — including invoicing systems, payment-integration software, e-invoicing modules, EDI infrastructure, and the digital part of accounting integration. The investment must be **capitalised** (entered as a fixed asset and depreciated), not expensed.

**Combination with the +120%:** The two measures cover **different cost types** and are **complementary, not stacked**:
- Subscription / SaaS fees → expensed → +120% verhoogde kostenaftrek (until end 2027).
- Capitalised investment in software → depreciated → +20% investeringsaftrek (permanent).

The same euro of cost cannot benefit from both. In practice: if halingo is sold as a monthly SaaS subscription, every euro paid by a logopedist customer flows through the +120% mechanism. If a logopedist instead buys a perpetual licence and capitalises it, the +20% investeringsaftrek applies.

### 6.3 How halingo can pitch itself as qualifying

For halingo's marketing and sales pages aimed at Belgian logopedist customers, the following are accurate and verifiable claims that the customer's accountant will recognise:

1. *"halingo is a SaaS-abonnement. Voor kleine vennootschappen en zelfstandigen kwalificeert het halingo-abonnement voor de tijdelijke verhoogde kostenaftrek van 120 % uit artikel 64ter WIB 1992 (aanslagjaren 2025 t/m 2028)."*
2. *"Op uw halingo-factuur staat het e-facturatie-abonnement separaat gespecifieerd, zodat uw boekhouder het direct in Vak XVIII / vennootschapsaangifte kan opnemen."*
3. *"halingo levert uw uitgaande facturen naar btw-plichtige klanten in Peppol BIS Billing 3.0-formaat conform art. 53 §2bis WBTW en het KB van 8 juli 2025."*

The third claim is only valid once halingo actually has Peppol output working — see section 8.

---

## 7. Access Point landscape in Belgium

The Belgian Peppol Service Provider population numbered around **80–90 registered providers** as of early 2026. The ones a healthcare/paramedical SaaS is most likely to encounter, as customer-facing portals or as upstream Access Points:

| Name | Type | Pricing pattern (where public) | Integration | Healthcare-relevant notes |
|---|---|---|---|---|
| **Billit** | Invoicing SaaS + Access Point | Free *Lite* tier; *Pro* €15.50/month (varies); per-document fees on outgoing Peppol above bundle | REST API, web UI, 30+ accounting integrations | Heavily used by Belgian zelfstandigen, very common at logopedist accountants |
| **Unifiedpost / Banqup** | Access Point + financial-platform SaaS | Tiered SaaS (Banqup brand for SMEs); per-invoice fees for high volume | REST API, SFTP, web UI; large enterprise side via Unifiedpost Group | Operates the *Banqup* SME brand; was the historical default for many Belgian banks |
| **CodaBox** | Accounting-data infrastructure (CODA, SODA, e-invoices) | B2B contracted with accounting firms; not consumer-facing | Push to accounting software via *MyCodaBox* + native protocols | The dominant inbound channel for Belgian accountants. If a logopedist's accountant uses CodaBox, the inbound Peppol stream lands in CodaBox first. |
| **Isabel 6** | Banking + multibank platform with e-invoicing module | Subscription (Isabel 6 base + e-invoicing add-on) | Web UI, native ERP connectors | Common in mid-size and larger praktijken with multibank needs |
| **Basware** | Enterprise AP automation + Access Point | Enterprise pricing only | Connectors to SAP, Oracle, Microsoft Dynamics | Not relevant for solo logopedists; relevant if a praktijk invoices a Basware-using corporate customer |
| **Exact Online** | ERP/accounting SaaS with built-in Peppol | Per-user subscription | REST API, Exact Online UI | Some logopedist accountants run Exact Online as their primary tool |
| **Yuki** | Bookkeeping SaaS with Peppol integration | Per-client subscription billed to accountant | REST API + Yuki UI | Common in modern Belgian accounting firms; the accountant collects on behalf of the praktijk |
| **Octopus** | Accounting software (Octopus Boekhoudsoftware) with built-in Peppol UBL functionality | Per-licence pricing to accountants | Native UBL send/receive, file-based integrations | Long-standing Belgian accounting product |
| **WinBooks** | Accounting software with Peppol module | Per-licence to accountants | Native UBL, *Peppol Box* integration | Used by many Belgian accounting firms |
| **Storecove** | Pure-play Access Point for SaaS vendors | Subscription + per-document; competitive for SaaS multi-tenancy | REST API (JSON), 40+ countries | Best fit for a vertical SaaS like halingo that wants a clean multi-tenant API and does not want to go through accounting-software intermediaries |
| **e-invoice.be** | Pay-per-use Access Point | €0.25 per invoice, no monthly fee | REST API, SDKs (Python, Node.js, PHP, C#, Java), email-based workflow | Pragmatic option for low-volume praktijken |
| **Digiteal** | Payment + invoicing platform | Subscription | REST API, payment-integration first | Less common for healthcare |
| **Hermes** | (BOSA bridge — DECOMMISSIONED on 31 December 2025) | n/a | n/a | Do not build against. Consultation mode ends 31 March 2026. |

**Pricing transparency** is patchy: Billit and e-invoice.be publish numbers; Unifiedpost, CodaBox, Isabel and Basware do not. For a SaaS-vendor procurement exercise, **Storecove** is widely cited as the most SaaS-friendly Access Point in the BeNeLux because (a) its API is clean JSON not raw UBL, (b) it covers EU + UK + Singapore + Australia, and (c) its pricing is transparent at SME scale.

**Channels to the praktijk's accountant**: a very large fraction of Belgian small-business inbound invoices already flow through **CodaBox** — accountants use CodaBox as their unified inbox for CODA bank statements + SODA wage data + Peppol e-invoices. If halingo wants its outgoing Peppol invoices to land *automatically* in the customer's accountant's tooling, the best lever is to ship via any standard Access Point (Storecove, Billit, Unifiedpost, …); CodaBox will pick them up on the receiving accountant side without halingo needing a direct CodaBox integration.

---

## 8. Integration patterns for halingo

### 8.1 Pattern 1 — become an Access Point yourself (NOT recommended)

**What it means:** halingo joins OpenPeppol as a Service Provider, signs the Belgian PASR with BOSA, operates its own AS4 endpoint and SMP, and ships invoices directly onto the Peppol network.

**Pros:**
- Full control over the Peppol stack.
- No per-invoice fees to a third party.
- Direct operational ownership of compliance.

**Cons:**
- OpenPeppol Service Provider membership: ~€3,000–€10,000/year recurring.
- 24/7 operational responsibility for AS4 endpoint uptime; missed messages have legal consequences.
- Conformance suite + ongoing test event participation.
- BOSA PASR audit obligations.
- Compliance staff time: certification, monitoring, incident response.
- The Peppol AS4 + UBL plumbing is a non-trivial codebase that needs to track spec evolution.

**Verdict:** Only worth it for SaaS vendors handling tens of thousands of invoices per month. **Not recommended for halingo** until volume is well past the break-even point.

### 8.2 Pattern 2 — integrate with a 3rd-party Access Point via REST API (RECOMMENDED)

**What it means:** halingo signs a contract with a Peppol Access Point (Storecove, Unifiedpost, Billit, e-invoice.be, …), exposes a thin wrapper service inside halingo's backend that converts halingo's invoice domain object into the Access Point's API call (UBL or JSON-over-REST), and lets the AP do the heavy lifting (validation, SMP lookup, AS4 transport, retry, error handling, archival).

**Pros:**
- Zero certification work for halingo.
- Per-document or low-tier subscription pricing — predictable.
- Multi-tenancy support (one AP API key per halingo instance, with sender identifier override per logopedist customer).
- Built-in lookup APIs for "is this counterparty Peppol-reachable?".
- The AP handles spec drift.

**Cons:**
- Vendor lock-in to one AP — mitigated by writing a thin internal `peppol_gateway` interface that hides the AP-specific calls.
- Per-invoice pricing scales with volume.
- Errors at the AP layer are returned asynchronously and need to be surfaced in halingo's UI.

**Recommended Access Points for halingo (in order):**

1. **Storecove** — JSON API, multi-tenant friendly, transparent pricing, covers cross-border. Best technical fit.
2. **e-invoice.be** — €0.25 per invoice, no monthly fee, Belgian-focused. Best cost fit at low volume.
3. **Billit** — easy onboarding, Belgian-default, but the API is more invoicing-centric than send-only and may not fit a SaaS that just wants the transport layer.

### 8.3 Pattern 3 — delegate to the accountant

**What it means:** halingo does **not** ship Peppol itself. Instead, halingo exposes a clean **UBL 2.1 export** (Peppol BIS Billing 3.0-conformant) and a CSV/Excel digest, which the praktijk's accountant imports into their own accounting software (Octopus, WinBooks, Yuki, Exact Online, …). The accounting software then sends the invoice via its own Peppol Access Point.

**Pros:**
- Zero AP cost or compliance obligation for halingo.
- Aligns with the *accountant-centric* reality of Belgian small businesses: most logopedists already have an accountant who already runs an accounting platform with Peppol.
- Lowest engineering cost for halingo MVP.

**Cons:**
- Requires manual or semi-automated handover at the praktijk side.
- Halingo cannot guarantee the invoice was actually sent on time (the accountant becomes the bottleneck).
- Halingo cannot easily *receive* Peppol back from suppliers — there is no inbound channel.
- Logopedists who do not have an accountant (rare but real) cannot use Peppol at all.

### 8.4 Recommended architecture for halingo

A hybrid is the right answer:

1. **Phase 1 (MVP / launch):** Pattern 3. Ship a clean UBL 2.1 export from halingo. Document it. Make sure the export passes the **Peppol BIS Billing 3.0** schematron validation. Most Belgian logopedists can absorb this via their accountant's pipeline.
2. **Phase 2 (growth):** Pattern 2 with **Storecove** as the upstream AP. Build a `peppol_gateway` adapter that takes halingo's `Invoice` domain object and submits it to Storecove. Add a per-customer toggle so customers who prefer the accountant-handover route keep the Phase 1 export.
3. **Phase 3 (only if volume justifies it):** Re-evaluate Pattern 1. Almost certainly never the right answer for a vertical SaaS this size.

**Data-model invariants** that fall out of this:

- Every `Counterparty` row must carry a `counterparty_type` enum: `B2B_BE_VAT`, `B2B_BE_NO_VAT_ART44`, `B2B_FOREIGN`, `B2C_PRIVATE`, `MUTUALITY`.
- Every `Counterparty` of type `B2B_*` must carry a normalised `kbo_number` (10 digits) and an optional `vat_number`.
- The Peppol participant ID is **derived** from `kbo_number` as `0208:<digits>`.
- A `peppol_reachable` boolean is cached from the most recent SMP lookup, with a `peppol_reachable_checked_at` timestamp.
- An `Invoice` row carries a `channel` enum: `peppol`, `efact`, `pdf`, `paper`. The channel is selected by routing logic, *not* manually by the logopedist.
- A separate `peppol_send_attempts` table tracks delivery attempts and Access Point responses per invoice.

---

## 9. What invoices actually go where

### 9.1 Peppol (B2B) — concrete list for a logopedist

The following outgoing invoices are **in scope** of Peppol from 1 January 2026 (assuming the praktijk holds a BTW-nummer because of mixed activity, or because the supplier is a third party with VAT) and the customer is a Belgian-established btw-plichtige:

- **Inter-praktijk retrocessie** when both sides are VAT-taxable on the relevant transaction (rare in pure logopedie).
- **Room/office rental** to a colleague when the rental is VAT-opted (art. 44, § 3, 2°, d) WBTW).
- **Supervision and intervisie hours** invoiced from a senior to a junior praktijk on a B2B basis.
- **Contracted logopedische ondersteuning** invoiced to **schools / scholengroepen / scholengemeenschappen / CLB / CPMS** (where the school is a btw-plichtige onderneming or a Belgian publieke instelling) — note: most CLB/CPMS are public bodies and may follow B2G rules via Mercurius (see 9.2 below).
- **Occupational speech coaching** invoiced to an **employer** for executive vocal training, accent reduction, presentation skills.
- **Expert reports** invoiced to **insurance companies** (legal, automobile, health insurers).
- **Teaching hours** invoiced to **higher-education institutions** (universities, hogescholen) — typically btw-plichtig on the corporate side.
- **Workshops, lectures, train-the-trainer sessions** invoiced to a btw-plichtige opdrachtgever.
- **Sales of speech-therapy materials** (books, exercise cards, board games, articulation tools) to **other businesses** (other praktijken, schools, training centres).
- **Subcontracting / freelance hours** invoiced to a CRO, hospital, multidisciplinary practice on a B2B basis.

Each of these flows must be routed by halingo through the Peppol channel with channel = `peppol`. The counterparty must hold a KBO number; halingo derives the Peppol participant ID and ships via its Access Point of choice.

### 9.2 eFact / MyCareNet (mutualities) — reminder, see file 03

**Out of Peppol scope.** Logopedie verstrekkingen invoiced via the *derdebetalersregeling* to a ziekenfonds go through **eFact / MyCareNet**, the federal MyCareNet platform run by CIN/NIC. The mandate is the *Gecoördineerde Wet van 14 juli 1994 betreffende de verplichte verzekering voor geneeskundige verzorging en uitkeringen* and the technical RIZIV/INAMI billing instructions, **not** art. 53 § 2bis WBTW.

Even if logopedie eFact is technically supported by MyCareNet for some scenarios (and per file 03 the rollout for logopedie is still partial — many logopedists still send paper attests to mutualities), this is a separate channel. **Do not route mutuality claims via Peppol.** Mutualities do not consume Peppol-format invoices. The KBO of CM, Solidaris, Helan, Liantis-Mut, etc. is technically registered in the SMP, but addressing them via Peppol for derdebetaler claims will result in rejection or silent loss.

The full eFact/MyCareNet integration is documented in file 03.

### 9.3 Plain invoice (patients, B2C)

**Out of Peppol scope.** When a logopedist invoices a patient directly (most common case in non-derdebetaler workflows), the invoice is B2C. The legal form is the *getuigschrift voor verstrekte hulp* (RIZIV-formulier) plus a separate *kostennota* if any non-RIZIV component exists. PDF or paper is fine. The patient does not need to receive a Peppol invoice and almost never has a Peppol participant ID.

If a patient is in fact a self-employed person who wants the invoice on their own KBO for tax purposes, the praktijk should treat that as a B2B transaction *only if* the underlying service is not exempt under art. 44 — which it usually is for therapeutic logopedie. In other words: **billing a patient who happens to be a freelancer is still B2C in the BTW sense**, because the service is medical-care exempt.

### 9.4 Data model implications

The `channel` enum on the `Invoice` entity must be selected automatically by routing logic that runs at invoice-creation time. The decision tree:

```
1. Is the underlying service art. 44 medical-care therapy?
   YES -> if the payer is a mutuality   -> channel = efact   (file 03)
       -> else                          -> channel = pdf     (B2C or art 44 B2B)
   NO  -> proceed to step 2.

2. Is the counterparty a Belgian-established VAT-taxable person (has a Belgian KBO and either holds a BTW-nummer or is exempt only under art 56bis)?
   YES -> channel = peppol
   NO  -> if foreign                    -> channel = pdf     (cross-border B2B; see section 10)
       -> if Belgian private individual -> channel = pdf
       -> if Belgian public body        -> channel = peppol  (B2G via Mercurius — Peppol BIS works the same way)
```

**Counterparty type flag** drives the routing. Make it the single source of truth, not a derived calculation at every invoice send.

---

## 10. Gotchas, archiving, cross-border, enforcement posture

### 10.1 Archiving (10-year retention)

Belgian VAT law requires invoices to be retained for **10 years** counted from **1 January of the year following the invoice date** (Art. 60 § 4 WBTW). The retention rule is identical for paper, PDF and structured electronic invoices.

For structured e-invoices specifically:

- Retention must preserve **integrity, authenticity and legibility** throughout the 10-year period.
- The original **structured XML payload** must be retained, **not only** a PDF rendering. A PDF visualisation alongside is fine and expected, but the XML is the legally binding artefact and is what FOD Financiën inspectors will request during a controle.
- Storage may be located outside Belgium **provided that** the invoices remain accessible *from within Belgium* on demand.
- Format conversions (e.g. migrating from one storage system to another) are allowed as long as the content stays intact and verifiable. Re-signing or re-validating during conversion is allowed.
- A digital signature on the XML is not strictly required for legal validity (since the AS4 transport already provides authentication and non-repudiation), but most Access Points sign by default.

**Halingo's responsibility:** the SaaS must archive the *outgoing* UBL XML for every Peppol invoice it sends, plus the AS4 receipt confirmation, for at least 10 years. It must also archive the *incoming* UBL XML for every Peppol invoice it receives on behalf of the praktijk. The archive must support read access to FOD Financiën inspectors during a controle.

### 10.2 Cross-border B2B

The 2026 Belgian mandate is **strictly domestic**. A Belgian logopedist invoicing a Dutch, French, Luxembourgish, German or other foreign B2B customer is **out of scope** of art. 53 § 2bis WBTW. The supplier may still use Peppol voluntarily — and the receiver may still consume it via their own AP — but it is not legally compelled.

This will change in **2030** when the EU **VAT in the Digital Age (ViDA)** Digital Reporting Requirements (DRR) come into force. From 1 July 2030, all intra-Community B2B supplies will require structured e-invoicing in EN 16931 format and near-real-time digital reporting to the tax authority. France (September 2026), Germany (phased through 2027–2028), Italy (already live), Poland (KSeF, 2026) and the Netherlands (consultation expected late 2026, mandate from 2030+) are all in various stages of their own national mandates that will eventually converge on the ViDA framework.

**Practical advice for halingo right now:** treat cross-border B2B as PDF + voluntary Peppol if the counterparty is reachable. Do not implement mandatory routing rules until ViDA's exact technical specifications are published (expected 2027–2028).

### 10.3 Counterparty cannot or refuses Peppol

If a Belgian-established btw-plichtige customer is **not** Peppol-reachable on 1 January 2026, the supplier is in an awkward position: the law obliges the supplier to issue a Peppol invoice, but the customer has no inbox to receive it. The official FOD Financiën position is that the **customer is also obliged** to be reachable, and the supplier is **not exempted** from the obligation by the customer's failure.

The pragmatic resolution during the tolerance window (Q1 2026) was: send anyway via Peppol, and ship a PDF in parallel by email for the customer's records. After 1 April 2026, the customer faces fines for not being able to receive (€1,500 for a first offence — see 10.4) and the supplier should document its compliance attempt.

For halingo, the implementation rule:
- Always perform an SMP lookup before generating a Peppol invoice.
- If the counterparty is reachable → send Peppol, generate a PDF visualisation for the praktijk's records.
- If the counterparty is **not** reachable → log it, surface a warning to the logopedist user, send by PDF/email as a fallback, and queue the case for follow-up.

### 10.4 Sanctions and enforcement posture

The **KB van 8 juli 2025** amends **KB nr. 44** with a new non-proportional VAT-fine schedule for breaches of the structured e-invoicing obligation:

- **First infringement: €1,500** (fixed)
- **Second infringement (established more than 3 months after the first): €3,000**
- **Third and subsequent infringements: €5,000**

The fines apply per *infringement*, not per invoice — though "infringement" is loosely defined and may aggregate multiple invoices into a single enforcement action.

Beyond the fixed fines, **invalid invoicing can lead to denial of VAT deduction** for the customer, plus *proportionele boetes* under art. 70 WBTW (10% to 200% of the VAT amount, scaled by intent and recidivism).

**Tolerance period:**
- **1 January 2026 to 31 March 2026:** no fines for the new e-invoicing obligation specifically, **provided** the taxpayer can show *redelijke en tijdige inspanningen* to comply.
- **From 1 April 2026 onwards:** full enforcement.
- **Until 30 June 2026:** an extended tolerance applies specifically to **self-billing** functionality where the company can show its software vendor is still implementing it.

**As of today (2026-04-06)** the general tolerance has just ended (5 days ago). Fines are technically in force from this week. Historically, FOD Financiën's enforcement style on new digital rollouts has been *progressive and pragmatic* — initial enforcement targets repeat offenders and bad-faith non-compliance, not first-time honest attempts. We expect the first few quarters to see warning letters before fines for SMEs with documented good-faith effort.

### 10.5 Denial of VAT deduction at the customer side

A more painful indirect consequence than the fixed fines: if a customer receives a non-conforming invoice (e.g. a PDF when a Peppol structured invoice was required), the customer's **right to VAT deduction** for that invoice may be challenged by the controleur. CJEU case-law on VAT neutrality (e.g. *Senatex*, *Barlis 06*) holds that VAT deduction must be allowed when the substantive conditions are met, even if formal requirements are imperfect — but FOD Financiën has not committed in writing to apply this case-law indulgently for missed Peppol formalities. **Treat the deduction risk as real**, especially for B2B customers of halingo who themselves have full VAT-deduction rights.

### 10.6 The €5,000 + suspended-deduction scenario adds up

For a small praktijk with a mixed activity, getting this wrong can mean: (a) €1,500 fine on first detection, (b) €3,000 on second within a quarter, (c) €5,000 on third, (d) loss of VAT deduction on inputs related to the bad invoices, (e) accountant fees to clean up. The risk is concentrated, not dispersed: it bites in the controle, two or three years after the fact.

---

## 11. Freshness notes

Information in this file was verified against primary sources (FOD Financiën / SPF Finances pages, the wet of 6 February 2024, the KB of 8 July 2025) and against secondary sources (EY, Tiberghien, BDO, Loyens & Loeff, KPMG, Vlaio, Acerta, Practicali, Forum for the Future, OpenPeppol Belgian Service Providers Forum) on **2026-04-06**.

**Confirmed and stable as of 2026-04-06:**
- Wet van 6 februari 2024, NUMAC 2024001635, Belgisch Staatsblad 20/02/2024 — confirmed.
- Effective date 1 January 2026 — confirmed; no further postponement.
- KB van 8 juli 2025 (BS 14/07/2025) as the implementing decree — confirmed.
- Peppol BIS Billing 3.0 in UBL 2.1 over the Peppol 4-corner network as the default channel — confirmed.
- Belgian Peppol Authority = FOD/SPF BOSA — confirmed since 2016.
- Mandatory participant ID scheme = 0208 (KBO/CBE), with 9925 (BTW) as optional secondary — confirmed.
- Hermes decommissioned 31 December 2025; consultation-only access until 31 March 2026 — confirmed.
- Tolerance period 1 January 2026 to 31 March 2026 ended on 1 April 2026 — confirmed.
- Sanctions schedule €1,500 / €3,000 / €5,000 — confirmed via Loyens & Loeff and Nymus tax-alert breakdowns of the KB.
- 10-year archiving retention — confirmed (art. 60 § 4 WBTW).
- +120% verhoogde kostenaftrek for income years 2024–2027 under art. 64ter WIB 1992 — confirmed via FOD Financiën *Fiscale stimulansen* page and Vlaio.
- +20% investeringsaftrek for digital investments from 2025, permanent baseline — confirmed via Vlaio and Monard Law analysis of the 2025 reform.

**Settled but worth flagging:**
- Art. 44 fully exempt logopedists are **not legally obliged** to send or receive Peppol; this is the FOD Financiën position. Several secondary sources (Astro, peppol.nu, Tiberghien, EY) confirm. The unanimous practical advice is still to **be reachable as a Peppol receiver** because suppliers will address you that way.
- The **€25,000 KMO vrijstellingsregeling (art. 56bis)** is **in scope** of the e-invoicing mandate. This is the FOD Financiën's explicit position on efactuur.belgium.be: *"De verplichting geldt als u gebruik maakt van de vrijstellingsregeling voor kleine ondernemingen."* Confused secondary sources exist (some early Tiberghien commentary listed art. 56bis as exempt, which appears to be incorrect or outdated). Trust the FOD Financiën page.

**Still uncertain / worth re-verifying before halingo ships:**
- **Specific Belgian CIUS** on top of Peppol BIS Billing 3.0 — none published as of April 2026, but FOD Financiën may publish one later. Subscribe to BOSA's communications.
- **Nature of post-2030 ViDA changes** for cross-border invoicing — Council Directive (EU) 2025/516 published March 2025 but the technical specifications for the EN 16931 v2 + DRR data submission are still being elaborated; expect drafts late 2027.
- **Whether logopedie eFact/MyCareNet** (file 03) will eventually be wrapped into a Peppol-style transport — RIZIV has not published any signal in this direction. The two channels are likely to remain operationally separate for the foreseeable future.
- **Concrete enforcement style of the FOD Financiën controles in Q2 2026** — fines are technically in force from 1 April 2026 but the pragmatic application is still being calibrated. Watch for the first published controle decisions and any new FAQ updates.

---

## 12. Sources

**Primary law and decrees:**
- Wet van 6 februari 2024 tot wijziging van het Wetboek van de belasting over de toegevoegde waarde en het Wetboek van de inkomstenbelastingen 1992 wat de invoering van de verplichting tot elektronische facturering betreft — Belgisch Staatsblad 20/02/2024, NUMAC 2024001635. <https://etaamb.openjustice.be/nl/wet-van-06-februari-2024_n2024001635.html> (NL) and FR equivalent.
- Koninklijk besluit van 8 juli 2025 tot wijziging van koninklijk besluit nr. 1 en koninklijk besluit nr. 44, wat de elektronische facturering betreft — Belgisch Staatsblad 14/07/2025, NUMAC 2025005169. <https://www.ejustice.just.fgov.be/cgi/article.pl?numac_search=2025005169>
- BTW-wetboek / Code de la TVA — art. 1 § 13 (definitie gestructureerde elektronische factuur), art. 53 § 2bis (verplichting), art. 60 § 4 (bewaarplicht), art. 70 (sancties), art. 56bis (vrijstellingsregeling kleine ondernemingen).
- WIB 1992 / CIR 1992 — art. 64ter (verhoogde kostenaftrek e-facturatie), art. 69 (investeringsaftrek), art. 194octies, art. 1:24 §1 WVV (definitie kleine vennootschap).
- Council Implementing Decision (EU) 2024/2425 — derogation authorising Belgium's mandatory B2B e-invoicing.
- Council Directive (EU) 2025/516 — VAT in the Digital Age (ViDA), 11 March 2025.

**FOD Financiën / SPF Finances official portals:**
- <https://efactuur.belgium.be/> (NL landing for e-facturatie) — *Voor wie wordt e-facturatie verplicht?*, *Fiscale stimulansen voor het invoeren van e-facturatie*.
- <https://efacture.belgium.be/> (FR equivalent).
- <https://einvoice.belgium.be/> — multilingual FAQ portal: *General questions on the B2B obligation*, *General questions about Peppol*, *General questions about the storing of electronic invoices*, *How do I keep invoices received via electronic invoicing?*, *Mercurius: the electronic mail room for our public entities*.
- <https://finances.belgium.be/> / <https://financien.belgium.be/> — FPS Finance landing pages.
- <https://www.mercurius.belgium.be/> — B2G Peppol entry point.

**BOSA / Belgian Peppol Authority:**
- <https://bosa.belgium.be/> — FOD/SPF BOSA general portal.
- <https://smp.belgium.be/> — Belgian SMP.
- BOSA Peppol Authority Specific Requirements (PASR) for Belgium — published via OpenPeppol Belgian Service Providers Forum on Confluence.

**OpenPeppol and EU Peppol specs:**
- <https://peppol.org/learn-more/country-profiles/belgium/> — country profile.
- <https://docs.peppol.eu/> — Peppol BIS Billing 3.0 specifications.
- <https://docs.peppol.eu/edelivery/codelists/old/v8.0/Peppol%20Code%20Lists%20-%20Participant%20identifier%20schemes%20v8.0.html> — participant identifier schemes.
- <https://directory.peppol.eu/> — Peppol Directory (lookup).
- <https://openpeppol.atlassian.net/wiki/spaces/Belgium/> — Belgian Peppol Service Providers Forum (Confluence).
- <https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/eInvoicing> — EU eInvoicing portal.
- <https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108877/eInvoicing+in+Belgium> — EU country sheet for Belgium.

**Lookup tools:**
- <https://www.peppolcheck.be/> — Belgian Peppol participant lookup.
- <https://peppol.helger.com/public/menuitem-tools-pid-check-be> — Helger's PID checker for Belgium.

**Authoritative Belgian secondary sources (tax law firms and accountancy):**
- Tiberghien — *België verplicht B2B e-facturatie vanaf 1 januari 2026*. <https://www.tiberghien.com/nl/3859/belgie-verplicht-b2b-e-facturatie-vanaf-1-januari-2026>
- Loyens & Loeff — *Three-month grace period for mandatory B2B e-invoicing in Belgium*. <https://www.loyensloeff.com/insights/news--events/news/e-invoicing-in-belgium-as-from-1-january-2026-key-provisions-of-the-long-awaited-royal-decree/>
- BDO Belgium — *Royal Decree on electronic invoicing*. <https://www.bdo.be/en-gb/insights/news-alerts/2025/royal-decree-electronic-invoicing>
- KPMG Belgium — *Three-month tolerance period for e-invoicing mandate effective January 1, 2026*. <https://kpmg.com/us/en/taxnewsflash/news/2025/12/tnf-belgium-three-month-tolerance-period-for-e-invoicing-mandate-effective-january-1-2026.html>
- EY — *Belgium's mandatory e-invoicing to apply from 1 January 2026*. <https://www.ey.com/en_gl/technical/tax-alerts/belgium-s-mandatory-e-invoicing-to-apply-from-1-january-2026>
- Deloitte Belgium — *FAQs on Belgian e-invoicing requirements updated*. <https://www.deloitte.com/be/en/services/tax/blogs/update-on-belgian-e-invoicing-mandate.html>
- Vandelanotte — *Royal Decree mandates electronic invoicing from 2026*. <https://www.vandelanotte.be/en/news/royal-decree-mandates-electronic-invoicing-from-2026>
- VAT-Consult — *KB inzake e-facturatie*. <https://www.vat-consult.be/blog/kb-inzake-e-facturatie>
- RSM Belgium — *Belgische B2B e-facturatie: KB bevestigt praktische modaliteiten en sancties*. <https://www.rsm.global/belgium/nl/insights/belgische-b2b-e-facturatie-koninklijk-besluit-bevestigt-praktische-modaliteiten-en-sancties>
- Practicali — *Nieuwe 120% kostenaftrek e-facturatie (Peppol) vanaf 1 januari 2024*. <https://www.practicali.be/blog/fiscaal-voordeel-kostenaftrek-e-facturatie-peppol-vanaf-1-januari-2024>
- Wolters Kluwer — *120 procent kostenaftrek voor investeringen e-facturatie*. <https://www.wolterskluwer.com/nl-be/expert-insights/investment-tax-credit-einvoicing>
- Forum for the Future — *Koninklijk besluit van 8 juli 2025 over elektronische facturering onder de loep*. <https://blog.forumforthefuture.be/nl/article/koninklijk-besluit-van-8-juli-2025-over-elektronische-facturering-onder-de-loep/28448>
- Monard Law — *Hervormde investeringsaftrek vanaf 2025*. <https://monardlaw.be/nl/stories/ingelicht/hervormde-investeringsaftrek-vanaf-2025-hogere-percentages-aangepaste-formaliteiten-en-nieuwe-lijsten/>
- Vlaio — *Verhoogde fiscale aftrek voor bepaalde kosten*. <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/verhoogde-fiscale-aftrek-voor-bepaalde-kosten>
- Vlaio — *Investeringsaftrek*. <https://www.vlaio.be/nl/subsidies-financiering/subsidiedatabank/investeringsaftrek>
- UNIZO — *De transitie naar e-facturatie / e-invoicing*. <https://www.unizo.be/berichten/nieuws/de-transitie-naar-e-facturatie-e-invoicing>
- Acerta — *E-invoicing via Peppol vanaf 1 januari 2026*. <https://www.acerta.be/nl/zelfstandigen/digitale-facturatie>
- Liantis — *Meestgestelde vragen Peppol*. <https://www.liantis.be/nl/ik-ben-zelfstandige/peppol/faq>
- Orde van Vlaamse Balies — *E-facturatie, alles wat u praktisch moet weten*. <https://www.ordevanvlaamsebalies.be/nl/nieuws-en-events/e-facturatie-alles-wat-u-praktisch-moet-weten>

**Healthcare-specific commentary on Peppol & art. 44:**
- Astro — *Peppol voor artsen, tandartsen en kinesisten: geldt de verplichting voor jou?*. <https://help.astro.tax/nl/articles/12130531-peppol-voor-artsen-tandartsen-en-kinesisten-geldt-de-verplichting-voor-jou>
- Astro — *Kleine onderneming met omzet onder €25.000? Dan geldt de Peppol-verplichting ook voor jou*. <https://help.astro.tax/nl/articles/12130604-kleine-onderneming-met-omzet-onder-25-000-dan-geldt-de-peppol-verplichting-ook-voor-jou>
- peppol.nu — *E-facturering vrijgestelde beroepen België*. <https://www.peppol.nu/blog-items/e-facturering-vrijgestelde-beroepen/>
- e-invoice.be — *Peppol verplicht: voor wie wel en niet?*. <https://e-invoice.be/blog/peppol-verplicht-voor-wie>
- OkiOki — *Wie moet er voldoen aan de e-facturatie verplichting?*. <https://support.okioki.be/hc/nl-be/articles/31413817875730>
- Accountable — *Btw-vrijstelling volgens artikel 44*. <https://www.accountable.eu/nl-be/help-center/btw-vrijstelling-volgens-artikel-44/>

**Access Point provider documentation:**
- Billit — <https://www.billit.eu/en-int/peppol-access-point/peppol-e-invoicing-in-belgium/> and <https://www.billit.eu/nl-be/resources/nieuws/240220-verhoogde-kostenaftrek-van-120-voor-e-facturatiesoftware/>
- Unifiedpost / Banqup — <https://www.unifiedpost.be/products/billtobox>, <https://www.banqup.com/resources/blog/belgium-retires-the-hermes-platform-why-your-e-invoicing-strategy-must-change-before-2026>
- Storecove — <https://www.storecove.com/blog/en/belgiums-e-invoicing-key-insights/> and <https://www.storecove.com/blog/en/peppol-mercurius/>
- Basware — <https://www.basware.com/en/compliance-map/belgium>
- e-invoice.be — *Best Peppol Access Points 2026*. <https://e-invoice.be/blog/best-peppol-access-points>
- Dexxter — *List of Peppol platforms in Belgium*. <https://dexxter.be/en/list-of-peppol-platforms-in-belgium/>
- 4 Business Software — *E-facturen ontvangen via Peppol is voor (bijna) iedereen verplicht*. <https://4bs.com/nl/e-facturen-ontvangen-peppol-verplicht/> and *Verhoogde kostenaftrek 120%*. <https://4bs.com/nl/verhoogde-kostenaftrek-e-facturatie/>

**Other:**
- vatcalc.com — *Belgium B2B 2026 e-invoicing & 2028 e-reporting 3 month soft landing*. <https://www.vatcalc.com/belgium/belgium-b2b-e-invoicing-july-2024-update/>
- Vertex — *Belgium's 2026 e-invoicing regulations explained*. <https://www.vertexinc.com/resources/resource-library/belgiums-2026-e-invoicing-regulations-explained-scope-deadlines-and-penalties>
- Marosa VAT — *E-invoicing in Belgium: Complete Guide*. <https://marosavat.com/vat-news/e-invoicing-b2b-belgium-complete-guide-january-2026>
- Edicom — *Belgium: Electronic Invoicing in January 2026*. <https://edicomgroup.com/blog/belgium-will-make-b2b-electronic-invoice-mandatory>
- Tradeshift — *Belgium B2B E-Invoicing Mandate 2026: 3-Month Tolerance Period Explained*. <https://tradeshift.com/resources/compliance/belgium-b2b-e-invoicing-mandate-2026-tolerance-period/>
- Babelway — *Belgium E-Invoicing Grace Period 2026: SMB Peppol Guide*. <https://www.babelway.com/resources/blog/belgium-e-invoicing-grace-period-2026-smb-peppol-guide/>
- Sovos — *Belgium Sunsets Hermes E-Invoicing Platform by End of 2025*. <https://sovos.com/regulatory-updates/vat/belgium-sunsets-hermes-e-invoicing-platform-by-end-of-2025/>
- Pagero / Thomson Reuters — *Belgium e-invoicing compliance*. <https://www.pagero.com/compliance/regulatory-updates/belgium>
- VATupdate — *FAQ on E-Invoicing implementation in Belgium*. <https://www.vatupdate.com/2025/12/27/faq-on-e-invoicing-implementation-in-belgium/> and *Briefing Document: E-Invoicing in Belgium*. <https://www.vatupdate.com/2026/01/28/briefing-document-belgium-mandatory-b2b-e-invoicing/> and *Belgium's 3-month grace period for penalties ends on 1 April 2026*. <https://www.vatupdate.com/2026/04/01/belgiums-3-month-grace-period-for-penalties-ends-on-1-april-2026/>
- Nymus — *Fines of up to €5,000 for those not following e-invoicing rules*. <https://nymus.be/en/royal-decree-e-invoicing-2026/>
- VRT NWS — *Meer dan 250.000 bedrijven nog niet op Peppol* (29/01/2026). <https://www.vrt.be/vrtnws/nl/2026/01/29/weet-jij-of-je-peppol-moet-gebruiken-voor-je-inline-facturatie/>
