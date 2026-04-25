# Verification pass 2026-04-06 — File 04 (Recognition, visa and professional bodies)

This note resolves the two open uncertainties listed at the bottom of `04-recognition-visa-and-professional-bodies.md` after the first-pass research. Each item is tagged RESOLVED / PARTIAL / STILL OPEN with primary-source URLs and verbatim quotes where appropriate.

---

## Item 1 — Public API for verifying a RIZIV/INAMI provider number

**Status:** RESOLVED (the answer is "no public REST API for general use; structured access exists only via the eHealth-platform under partner contract")

### Finding A — RIZIV "Een zorgverlener zoeken" / "Trouver un dispensateur"

The RIZIV public search lives at:

- Landing page (NL): `https://www.riziv.fgov.be/nl/webtoepassingen/een-zorgverlener-zoeken`
- Application root (bilingual, hosted on the RIZIV web-applications domain): `https://webappsa.riziv-inami.fgov.be/silverpages/`

The application has been **rebuilt as a server-rendered HTMX form** (not a SPA, not a JSON API). Search is submitted by HTML form POST and the result fragment is swapped into the page. There is **no documented public REST/JSON endpoint**. The application does expose a few internal AJAX helpers used by the UI itself:

- `Home/SearchLocations` — location autocomplete
- `Home/SearchSpecialisations` — specialty dropdown
- `Home/GetAttributeValues` — qualification attribute lookup

These are **undocumented internal helpers** and are not contractual endpoints — RIZIV gives no SLA, no rate limit guarantee, no backwards-compatibility promise, and using them as if they were a public API is fragile.

Search criteria officially supported by the form:
- name + first name
- profession (24 categories incl. logopedist)
- specialty / qualification code (3 digits)
- contract status (geconventioneerd / gedeeltelijk / niet)
- location (postcode, gemeente, distance radius)
- INAMI number (first 8 digits — not the full 11)

`robots.txt` at `https://webappsa.riziv-inami.fgov.be/robots.txt` returns:

```
User-agent: *
Disallow: /docleg/
```

The `/silverpages/` tree is therefore **not blocked by robots.txt**, but the page footer carries the standard "© INAMI, tous droits réservés" notice and the Liability page (`/silverpages/Home/Liability`) disclaims accuracy without explicitly authorising or prohibiting scraping. There is no published rate limit and no API ToS. Treat this as **a tolerated grey-zone screen-scrape**: low-volume, server-side, with caching and back-off, mirroring the practice of every other Belgian healthtech vendor.

### Finding B — eCad public search (FOD Volksgezondheid)

`https://apps.health.belgium.be/ecad-public-search-engine-web/search` is the FOD Volksgezondheid public front-end on the eCad cadastre. It is again a server-rendered form with **no public REST/JSON API**. The eCad page on `health.belgium.be` (`/fr/outils/ecad-cadastre-professionnels-sante`) explicitly describes the back-office as "une application à usage interne". The public search returns visum/recognition status by name + profession only — it does **not** publish RIZIV numbers.

Sister application `apps.health.belgium.be/gestautor-public-search/` covers a similar lookup for some categories but again only as an HTML form.

### Finding C — eHealth platform: CoBRHA, AddressBook, I.AM

This is the **only structured, contractual** path to programmatic verification.

**CoBRHA — Common Base Registry for HealthCare Actors** is the consolidated authentic-source database operated by the eHealth platform that answers three questions about a healthcare actor: who they are, what activities they are recognised for, and what roles they hold. Authentic-source partners (RIZIV, FOD Volksgezondheid, the Communities) **publish** into CoBRHA; consumers **consult** it.

Web services exposed in the eHealth API Portal (`https://portal.api.ehealth.fgov.be/`):

| Service | Protocol | Version | Network |
|---|---|---|---|
| `CoBRHA-Consultation` | SOAP | 1.7 | Internet |
| `CoBRHA-Publication` | SOAP | 1.7 | Internet (publishers only) |
| `CoBRHAplus-FullConsultation` | SOAP | 1.6 | — |
| `CoBRHAplus-HistoryConsultation` | SOAP | 1.6 | — |
| `CoBRHAplus-Notification` | REST | 1.0 | — |
| `AddressBook` | SOAP | 1.2 | — |
| `AddressBook` REST | REST | 1.2 | Internet |
| `IAM-Exchange` (token swap accessToken→SAML) | REST | 2.0 | Internet |
| `IAM-AttributeAuthority` (queries CoBRHA + mandates) | SOAP | 1.1 | — |
| `IAM-STS` (Secure Token Service) | SOAP | — | Internet |

Data exchange format: **eHealth-specific XML** (XSD v1.8, "CoBRHA Consultation Cookbook" v1.2 of 04/07/2018; "CoBRHA Publication Cookbook" v3.4 of 05/08/2022). SLA for CoBRHA was last refreshed v2.3 of 29/09/2025.

**Access conditions for a SaaS like halingo:**

1. The vendor must be onboarded as a **partner of the eHealth platform** under the framework of the law of 21 August 2008 establishing the eHealth-platform. Basic services (identification, certificate management, ETEE, secure messaging, timestamping) are free of charge; CoBRHA Consultation falls under that "basic services" umbrella when consumed by an authorised actor.
2. Onboarding requires a **contract with the eHealth platform** describing the use case and the data-protection basis. Smals (operator) checks the legal grounding under the GDPR and the law of 13 December 2006 on the processing of health data.
3. Technical prerequisites: an **eHealth certificate** for service-to-service authentication, and per-call **SAML assertions issued by I.AM STS** carrying the end-user's healthcare-actor role (the I.AM AttributeAuthority resolves the role against CoBRHA itself). For a halingo flow this means the end-user logopedist must authenticate via eID/itsme through the I.AM IDP, halingo trades the resulting accessToken via `IAM-Exchange` for a SAML token, and only then can call CoBRHA Consultation on behalf of that user.
4. Practical implication: **CoBRHA is not an "anonymous lookup API"**. Each call is bound to an authenticated end-user with a legitimate need-to-know. Bulk verification of arbitrary RIZIV numbers is not the use case the platform supports.

### Finding D — "Who's Who" / "Registre"

eHealth uses the term **"sources authentiques"** rather than "Who's Who". The closest functional match to a "Who's Who registry" is **AddressBook** (contact directory of healthcare professionals and organisations) plus CoBRHA (recognition + RIZIV link). Neither is public-internet-anonymous; both require eHealth partner status.

### Practical conclusion for halingo

| Path | What it verifies | Effort | Suitability |
|---|---|---|---|
| Form-driven scrape of RIZIV silverpages | RIZIV nr ↔ name ↔ profession ↔ convention status | low (1 dev-week) | **Recommended for v1**: low-volume, with caching, back-off, fallback. |
| Form-driven scrape of eCad public search | visum status by name + profession | low | Useful as a cross-check, no RIZIV link. |
| RIZIV CSV/Excel open-data extracts (logopedisten by NIS, by convention status) | bulk snapshot, refreshed periodically by RIZIV | low | Good for offline batch reconciliation. |
| eHealth CoBRHA-Consultation via I.AM | authoritative real-time status, per-end-user | high (months: contracting + Smals integration test + certificates) | **Right answer at scale**; mandatory if halingo wants to call MyCareNet under the user's identity anyway. |

The R/26 convention text (see Item 2) reinforces the medium-term direction: Article 11 explicitly mentions that adherence dénonciations now happen via **"l'application électronique sécurisée ProSanté"** using the eID, which is itself an I.AM-protected eHealth application. As soon as halingo integrates with MyCareNet for eAttest/eFact (file 03), it has the eHealth contract anyway, and CoBRHA Consultation becomes incremental.

### Sources

- [RIZIV Een zorgverlener zoeken — landing](https://www.riziv.fgov.be/nl/webtoepassingen/een-zorgverlener-zoeken)
- [SilverPages search application](https://webappsa.riziv-inami.fgov.be/silverpages/)
- [SilverPages liability/disclaimer](https://webappsa.riziv-inami.fgov.be/silverpages/Home/Liability)
- [eCad public search engine](https://apps.health.belgium.be/ecad-public-search-engine-web/search)
- [eHealth platform — service CoBRHA](https://www.ehealth.fgov.be/ehealthplatform/fr/service-cobrha-common-base-registry-for-healthcare-actor)
- [eHealth API Portal — catalog](https://portal.api.ehealth.fgov.be/?viewType=list)
- [eHealth platform — service I.AM](https://ehealth.fgov.be/ehealthplatform/fr/service-i.am-identity-access-management)
- [eHealth platform — sources authentiques](https://www.ehealth.fgov.be/ehealthplatform/fr/sources-authentiques)

---

## Item 2 — 2026–2027 logopedie convention and CPD coupling of the sociaal statuut

**Status:** RESOLVED

### Finding A — The convention exists, is signed, is in force

**Reference:** R/2026-2027 (the file's earlier "R/26-27" is correct; the document header in the PDF is `R/2026-2027`).

**Key dates:**

- **11 December 2025** — concluded by the Overeenkomstencommissie logopedisten – verzekeringsinstellingen, under the chair of Patrick VERLIEFDE (delegated by Mickaël DAUBIE, Fonctionnaire dirigeant Service des soins de santé).
- **22 December 2025** — approved by the organs of RIZIV (Verzekeringscomité).
- **23 March 2026** — Verzekeringscomité formally established the adhesion percentage at **84%**, exceeding the 60% quorum.
- **1 January 2026** — convention enters into force.
- **1 April 2026** — the **−25% reduction** for non-conventioneerde logopedisten applies (because adhesion exceeded 60% on 23 March 2026; the reduction is not retroactive to 1 January 2026, and was not in force during the 1 January – 31 March 2026 window).
- **31 December 2027** — convention expires; not tacitly renewable.

**Signatories:** the verzekeringsinstellingen on one side, and on the professional side **De Vlaamse Vereniging voor Logopedisten** and **L'Union Professionnelle des Logopèdes Francophones** (i.e. VVL and UPLF, no other unions).

### Finding B — Indexation and R-values

Article 2 §2 of the convention (in force from 1 January 2026):

| Service type | R |
|---|---|
| Bilan initial | 2.593102 |
| Évaluation | 2.192167 |
| Individual 30-min treatment outside school + collective parental guidance | 2.192383 |
| Individual 60-min treatment + individual parental guidance | 2.201493 |
| Individual 30-min treatment at school | 2.117663 |
| Collective treatment | 2.195268 |

This corresponds to the **+2.72 % linear indexation** announced in the RIZIV press release.

### Finding C — CPD coupling of the sociaal statuut

**The R/2026-2027 convention does NOT couple the sociaal statuut to CPD points, formation continue, accréditation, bijscholing or any equivalent training requirement.**

I extracted the full text of the convention PDF (6 pages, articles 1–12) and searched for every relevant token. **None of the following terms appear in the convention text at all**:

- `statut social`, `sociaal statuut`, `avantage social`, `subvention`, `toelage`
- `formation continue`, `permanente vorming`, `bijscholing`
- `accréditation`, `accreditatie`, `accreditering`, `points d'accréditation`, `accreditatiepunten`
- `CPD`, `CME`, `permanente educatie`

The only "engagements" articulated by the convention beyond honoraria are the five **"Projets" of Article 10**:

1. **Integration of a quality patient record** ("dossier patient de qualité" / "kwalitatief patiëntendossier") into the nomenclature — extension of the existing GT nomenclature, compatible with BIHR and other health-IT applications.
2. **Active dialogue between federal-level actors** (RIZIV, professional bodies, verzekeringsinstellingen) and the federated entities (Communities).
3. **Use of data** spanning federal and federated supply, including analysis of regional and per-trouble variability.
4. **Continued administrative simplification** — digitalisation of forms and prescriptions, reduction of administrative burden.
5. **Continued nomenclature revision** on evidence-based criteria, with priority on:
   - troubles du développement du langage / dysfasie
   - voice troubles (C1, C2)

**The sociaal statuut is governed by a separate KB (KB van 18 januari 2006 betreffende het sociaal statuut van bepaalde gezondheidszorgbeoefenaars, on the basis of art. 54 of the GVU-wet 14 juli 1994), not by the convention itself.** The RIZIV "Recht op het sociaal statuut als logopedist" page (`https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/sociaal-statuut`) lists the conditions for premium year 2025 (paid in 2026) as: full conventionering, activity threshold (≥ 900 verstrekkingen of ≥ 15.750 R-eenheden voor de halve toelage; ≥ 2.000 verstrekkingen of ≥ 35.000 R-eenheden voor de volle toelage; capped at ≤ 4.000 verstrekkingen of ≤ 70.000 R-eenheden), pension contract finalised by 31 December of the premium year, and absence of disciplinary sanctions. **No CPD/permanente vorming requirement is listed.** The 2025 amounts (€1,560.89 / €3,219.31) carry over until RIZIV publishes the 2026 amounts later in the premium year.

The remark in §11.2 of file 04 — "the Overeenkomstencommissie has discussed in recent years coupling part of the sociaal statuut to attended CPD, but as of the 2024–2025 convention this is not yet implemented for logopedie" — therefore **remains true for the 2026–2027 convention as well**. The discussion has not produced a regulatory change, and Article 10 of R/2026-2027 contains no project on the topic.

### Finding D — Other notable provisions of R/2026-2027 to flag for halingo

- **Article 9 §1** — partial budgetary objective for 2026 = **€218,688,000** (218.688 million).
- **Article 9 §2** — selective correction mechanisms apply on overrun, with carve-outs for the M-decreet/Leersteundecreet impact, the type-8 integration in FWB, and the IQ<86 extension introduced by KB 17/07/2024 → KB 21/06/2025 (which opens reimbursement of art. 36 §2 b) 2° and §2 f) treatments to patients with IQ < 86).
- **Article 11** — adhesion via **ProSanté** electronic application (eID) within 30 days of publication in the Belgisch Staatsblad; logopedisten conventioneerd at 31/12/2025 are deemed to remain conventioneerd unless they actively dénonce.
- **Article 12** — denominator for the 60% quorum = number of logopedisten with a dispensateur profile in 2024 + 2025 first-time RIZIV numbers, minus those whose RIZIV nr was deactivated in the meantime.

### Sources

- [RIZIV Overeenkomst 2026-2027 voor de logopedisten — landing](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten)
- [INAMI Convention 2026-2027 pour les logopèdes — landing](https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes/convention-2026-2027-pour-les-logopedes)
- [Convention R/2026-2027 — texte intégral PDF](https://www.inami.fgov.be/SiteCollectionDocuments/convention_logopedes_mutualites_2026_2027.pdf) (6 pages, signed Brussels 11/12/2025)
- [RIZIV — Overeenkomsten met gezondheidssectoren voor 2026 en 2027 (press release)](https://www.riziv.fgov.be/nl/nieuws/overeenkomsten-met-gezondheidssectoren-voor-2026-en-2027-onontbeerlijk-voor-betaalbare-en-kwalitatieve-zorg)
- [RIZIV — Toetredingscijfers nationale akkoorden vastgesteld door verzekeringscomité](https://www.riziv.fgov.be/nl/nieuws/toetredingscijfers-nationale-akkoorden-en-overeenkomsten-zorgverleners-ziekenfondsen-vastgesteld-door-verzekeringscomite)
- [RIZIV — Recht op het sociaal statuut als logopedist](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/sociaal-statuut)

---

## Summary

| Item | Status |
|---|---|
| 1 — Public API to verify a RIZIV/INAMI provider number | RESOLVED: no anonymous public REST API; only screen-scraping (RIZIV silverpages, eCad search) or eHealth-platform CoBRHA via partner contract + I.AM. |
| 2 — R/2026-2027 convention and CPD coupling of the sociaal statuut | RESOLVED: convention signed 11/12/2025, 84% adhesion, +2.72% indexation, −25% rule active from 01/04/2026; the convention text contains zero CPD-coupling clauses for the sociaal statuut. |

Resolved: **2/2**.
