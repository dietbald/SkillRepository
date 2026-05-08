# Mutualistic Billing

## What this area covers

Generation, viewing, and lifecycle management of *verzamelstaten* — the batched invoices a Belgian healthcare practice sends to a *Ziekenfonds* (mutualiteit) under the *derdebetaler* (third-party payer) scheme.

## Features in this area

- Generate verzamelstaten — produce a batched statement covering many patient sessions at once, grouped either by patient or by mutualiteit.
- Verzamelstaat detail view — open a verzamelstaat to inspect the included invoices, totals, and per-patient breakdown.
- Verzamelstaat lifecycle — track the verzamelstaat through its states (draft, issued, sent, paid, cancelled) and reconcile incoming bulk payments against it.

## Key product behaviors

- A verzamelstaat is the *summary* invoice the mutualiteit pays; the per-patient reimbursable amounts are aggregated rows on it.
- The therapist picks the period and either a single patient (for that patient's whole reimbursable batch) or a single mutualiteit (for all of that mutualiteit's patients in the period).
- Each line on the verzamelstaat carries the patient's INSZ, the RIZIV nomenclatuurcode, the date of the act, and the reimbursable amount.
- Insurance category codes (CG1 / CG2) are computed per patient and rendered on the verzamelstaat — they tell the mutualiteit which reimbursement schedule to apply.
- When the mutualiteit pays the verzamelstaat, the payment cascades to the individual patient invoices it covered, marking the *terugbetaling* portion of each as paid (the patient's *remgeld* remains open against the patient).
- A verzamelstaat can be cancelled and re-issued if errors are caught after issue; the original numbering is preserved for audit.

## Belgian / regulatory notes

- *Derdebetaler* is the Belgian regime where the mutualiteit pays the practice directly for its share of the cost; the patient pays only the *remgeld*.
- The verzamelstaat format and required fields (INSZ, code, date, amount, CG category) are dictated by the mutualiteiten and RIZIV; the practice may not invent its own format.
- Some mutualiteiten accept verzamelstaten via MyCareNet eAttest / eFact electronic submission; others still require paper / email; Halingo currently produces the document in a format the practice can submit through whichever channel the mutualiteit accepts.

## Cross-references

- Smart Invoicing — patient invoices are the building blocks aggregated into a verzamelstaat.
- Compliance Monitoring — code selection and CG category come from the rules engine.
- Payment Lifecycle — verzamelstaat-level payment cascades into the constituent patient invoices.
- Patient Data Privacy — INSZ and treatment codes are health data; verzamelstaat exports are subject to the same access control.
