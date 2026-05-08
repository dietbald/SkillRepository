# Compliance Monitoring

## What this area covers

The rules engine and lookup surfaces that keep Halingo billing aligned with the current Belgian RIZIV / "De Conventie" regulations: nomenclature lookup, practitioner lookup, evaluation-session rules, session caps, R-waarde computation, and the convention rules engine itself.

## Features in this area

- Nomenclature lookup — search the RIZIV nomenclature catalogue for the right billing code.
- Practitioner lookup — find a practitioner by name or RIZIV/INAMI number, used when prescribing physicians need to be recorded on a dossier or a demand form.
- Evaluation session rules — the rules that govern how *aanvangsbilan* (initial assessment) sessions may be billed: duration, max units, who is allowed to perform them.
- Session caps — per-pathology maximum number of reimbursable sessions per treatment episode.
- R-waarde statistics — the RIZIV time-equivalent metric tracked alongside session counts; relevant for annual workload reporting.
- Notifications — surface compliance warnings to the therapist (e.g. about to exceed a session cap, missing prescriber on a dossier).
- Rules engine — the centralised set of dated rules that drive the above (per "De Conventie" 2024 and successors).

## Key product behaviors

- **De Conventie 2024.** Rules from the August 2024 convention are currently in force. Bracket length defaults to two years for most disorders, with documented exceptions (cleft palate, Locked-in syndrome).
- **Code routing by location.** The same care delivered in an ambulant setting versus during hospitalisation maps to different RIZIV codes; Halingo selects the correct code automatically.
- **Age-based eligibility.** Some treatment codes are only reimbursable up to or from a certain age; the rules engine flags these.
- **Time-bound.** Convention rules are dated. When RIZIV publishes a new convention or a tariff change, the rules engine must be updated to honour the new dates without invalidating historical billing.
- **Group-sitting rates.** Group sessions are billed at a different R-waarde than 1:1 sessions; the convention has revised these rates over time and the engine respects the historical date cascade.

## Belgian / regulatory notes

- The convention is a multi-year tariff agreement published by RIZIV that the therapist may opt into (*geconventioneerd*). Opt-in binds the therapist to convention tariffs in exchange for guaranteed reimbursement.
- A nomenclatuurcode identifies *what* care was delivered; an R-waarde quantifies *how much* therapist time the act represents for annual reporting.
- The convention text is the authoritative source for any rule-engine decision; the helpdesk article *compliance-riziv* mirrors the practical implications for end users.

## Cross-references

- Treatment Planning — every reimbursable treatment is tied to a nomenclatuurcode and the rules engine governs whether a planned treatment is allowed.
- Reimbursement Tracking — session counters consume the per-pathology caps from this area.
- Smart Invoicing — invoices are generated with the codes selected by this area's rules.
- Mutualistic Billing — verzamelstaten group invoices by code and by mutualiteit category (CG1 / CG2).
