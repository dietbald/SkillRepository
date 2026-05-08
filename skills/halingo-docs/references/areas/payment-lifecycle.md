# Payment Lifecycle

## What this area covers

The state machine that moves a patient invoice from issued to paid (or cancelled) — and the manual + automated paths the therapist uses to record payments and reconcile against the payment processor.

## Features in this area

- Insurance cascade — when an insurance reimbursement comes in for an invoice, the open balance is reduced first; the remaining *remgeld* stays open against the patient.
- Patient manual payment — the therapist records that the patient paid (cash, transfer, card) and Halingo updates the invoice state.
- Commission manual payment — for group practices, the therapist marks a commission settlement as paid.
- Print / mail state — the invoice tracks whether it has been printed, mailed, or both, so the therapist can see at a glance what still needs sending.
- Invoice cancel — cancel an issued invoice; the cancellation is recorded so the audit trail is preserved.
- Online payment sync — when invoices are paid via the integrated payment processor, the state machine moves automatically.

## Invoice states

- **Draft** — created but not yet issued.
- **Open** — issued, no payments recorded.
- **Partially paid** — at least one payment recorded but balance > 0.
- **Paid** — balance is zero.
- **Printed** — physical certificate / invoice has been printed.
- **Mailed** — invoice has been sent by email or post.
- **Cancelled** — voided after issue.

States are not strictly mutually exclusive — *printed* and *mailed* are flags layered on top of the open / paid states.

## Key product behaviors

- Reconciliation is therapist-driven for cash and bank-transfer payments — the therapist records the payment manually.
- Card / online payments captured through the integrated payment processor flow into the state machine via webhook events; the therapist does not need to record them by hand.
- The insurance cascade reflects how Belgian reimbursement actually works: the mutualiteit pays its share to the patient (or directly to the practice under derdebetaler) and the patient remains responsible for the *remgeld*.
- Cancelled invoices are kept on file (Belgian retention rules apply); they are visible in the audit history but excluded from KPIs of "open" or "overdue".

## Belgian / regulatory notes

- The patient's share (*remgeld*) is set by the convention; the therapist may not waive or vary it without breaching the convention.
- Belgian VAT exemption (art. 44) applies to clinical invoicing; the cancellation flow preserves the original numbering rather than re-using cancelled numbers.

## Cross-references

- Smart Invoicing — invoices are created here; this area governs their post-issue lifecycle.
- Mutualistic Billing — verzamelstaat-level payments cascade down to the individual invoices that compose the verzamelstaat.
- Debt Collection — overdue invoices feed the debt-collection workflow.
- SaaS Lifecycle — recurring SaaS subscription payments use the same processor integration.
