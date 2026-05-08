# Glossary

Belgian healthcare and Halingo-specific terminology used throughout this documentation. Terms are kept in their original Dutch / French because they correspond to legal entities, regulatory codes, or product UI labels — translating them loses meaning.

## Regulatory and institutional

- **RIZIV** *(NL)* / **INAMI** *(FR)* — *Rijksinstituut voor Ziekte- en Invaliditeitsverzekering* / *Institut National d'Assurance Maladie-Invalidité*. The Belgian national health insurance institute. Sets tariffs, nomenclature, and reimbursement rules for healthcare providers.
- **De Conventie** — the multi-year tariff convention published by RIZIV that speech therapists may opt into ("geconventioneerd"). It binds them to standard tariffs in exchange for reimbursement guarantees. The Aug 1 2024 convention is currently in force; rule changes from that update are summarised in the helpdesk article `compliance-riziv.md`.
- **Ziekenfonds** *(NL)* / **Mutualité** *(FR)* — Belgian sickness fund / mutual health insurer. Patients are members of one; reimbursements flow through it.
- **Medattest** — third-party supplier of pre-printed RIZIV form booklets (I21 / I11 certificates). Referenced in printing articles.

## Billing and codes

- **Nomenclatuur / Nomenclatuurcode** — RIZIV-assigned billing code per treatment type. Examples seen in source material: `700991` (evaluation session, ambulant), `701002` (evaluation session, hospitalization).
- **Getuigschrift voor verstrekte hulp** — official paper certificate of care provided. Printed on a matrix printer onto pre-printed forms; the EPSON LX-350 (24-pin) is the reference model. Margin alignment is a recurring user pain point.
- **Verzamelstaat (derdebetaler)** — batched/aggregated invoice sent to a Ziekenfonds under the third-party-payer scheme, as opposed to invoicing the patient directly.
- **Terugbetaling** — reimbursement (the share paid by the Ziekenfonds).
- **Remgeld** — patient co-payment (the share the patient pays out of pocket).
- **CG1 / CG2** — RIZIV insurance category codes used on Verzamelstaten.
- **INSZ** *(NL)* / **NISS** *(FR)* — Belgian national social security number. Required on certificates and batch statements.
- **R-waarde** — RIZIV time-equivalent metric tracked alongside session counts; relevant for annual statistics.
- **Aanvullende verzekering** — supplemental (voluntary) insurance, on top of the mandatory Ziekenfonds coverage. Halingo supports separate reimbursement plans for this.

## Clinical workflow

- **Patiëntendossier** — patient file / dossier (clinical + administrative).
- **Aanvangsbilan** — initial assessment report at the start of treatment. Billed in 30-minute units, max 5 reimbursable units per episode.
- **Evolutiebilan** — progress / evolution report during treatment.
- **Hervalbilan** — relapse / re-evaluation report after a setback.
- **Verlengingsbilan** — extension report justifying continued treatment beyond the initial bracket.
- **Bracket** — the duration window granted by an approved reimbursement request. Default is 2 years (since Aug 2024) for most disorders; exceptions: cleft palate, Locked-in syndrome.
- **Telelogopedie** *(NL)* / **vidéoconsultation** *(FR)* — speech therapy by video consultation. Drives a different set of nomenclature codes on the certificate.
- **Zorgcoördinator** — care coordinator (e.g., school-based) recorded on pediatric patient dossiers.

## Halingo product concepts

- **Praktijk** — practice. A Halingo subscription is per-praktijk; one user can belong to several.
- **Praktijkverantwoordelijke** — practice owner (highest role).
- **Beheerder** — practice administrator (can manage members and view peers' invoices).
- **Lid** — practice member (regular therapist; cannot view peers' financials).
- **Commissie** — commission paid by a group practice to a therapist; configurable as a fixed amount, percentage, or per-disorder percentage.
- **Privé afspraak** — private appointment block; visible only to the therapist who created it, hidden from the praktijkverantwoordelijke.
- **Aanbrengbonus** — referral bonus (free month of subscription) when a referred therapist converts.
- **Rosa** — external booking platform ([rosa.be](https://www.rosa.be)) Halingo synchronizes with bidirectionally via a token exchange.
