# Smart Invoicing

## What this area covers

Generating, delivering, and tracking the invoices that a practice produces for its patients and the certificates / verzamelstaten that accompany them — plus the financial overview screen and the commission flow used by group practices.

## Features in this area

- Patient invoice generation — pick completed sessions and produce a patient invoice in one click.
- Patient invoice lifecycle — the states an invoice moves through (draft / open / partially paid / paid / printed / mailed / cancelled).
- Invoice delivery — print, save as PDF, or email to the patient.
- Certificate management — link the official Belgian *getuigschrift voor verstrekte hulp* paper certificate to the corresponding invoice; record certificate numbers used.
- Commission invoicing — for group practices, produce the monthly statement of money owed by the practice to a member therapist (or by the member to the practice).
- Verzamelstaat — produce the batched insurance statement (see Mutualistic Billing).
- Financial overview — single screen summarising the practice's financial position: open / paid amounts, recent invoices, KPIs.

## Key product behaviors

- Sessions become invoiceable once they are completed; the therapist selects which sessions to include and Halingo groups them by patient.
- Tariffs come from the De Conventie 2024 rules engine (see Compliance Monitoring) for *geconventioneerd* therapists, or from the practice's own tariff table for non-conventioned ones.
- An invoice records both the *terugbetaling* (the share due from the mutualiteit) and the *remgeld* (the patient's share). Halingo computes both automatically from the rules engine.
- The financial overview is the praktijkverantwoordelijke's daily landing for "what is open, what came in, what is overdue".
- A certificate number, once issued, cannot be re-used (see Precision Printing for numbering).

## Commission flow (group practices)

- Each member of a group practice has a commission rule: a fixed amount per session, a percentage of the session value, or a per-disorder percentage.
- At month-end, Halingo produces a commission statement summarising what the practice owes the member (or vice versa).
- The statement can be downloaded and stored for the practice's bookkeeping.

## Belgian / regulatory notes

- Patient invoices for paramedical care (logopedie) qualify for the art. 44 VAT exemption; Halingo invoices reflect the exemption text required by Belgian law.
- The *getuigschrift voor verstrekte hulp* is the official paper certificate that grants the patient the right to claim reimbursement from their mutualiteit; it must be physically printed onto pre-printed RIZIV stationery (see Precision Printing).
- Peppol e-invoicing obligations apply to B2B invoices in Belgium; B2C and clinical invoices to mutualiteiten are governed by separate rules and are out of Peppol scope.

## Cross-references

- Compliance Monitoring — tariff and code selection for each invoice line.
- Precision Printing — the certificate-printing flow for the paper *getuigschrift*.
- Mutualistic Billing — verzamelstaat aggregation for batched insurance billing.
- Payment Lifecycle — the state machine that moves an invoice through paid / overdue / cancelled.
- Reimbursement Tracking — sessions referenced on an invoice update the patient's session counters.
- Practice Branding — the invoice template and the practice logo come from the per-practice branding settings.
