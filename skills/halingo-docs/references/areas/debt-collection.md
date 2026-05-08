# Debt Collection

## What this area covers

The therapist's tools for surfacing unpaid patient invoices and nudging patients to pay.

## Features in this area

- Dashboard widget — a count and total of unpaid / overdue patient invoices, surfaced on the main dashboard.
- Unpaid filter — a saved view on the financial overview that lists only invoices in open or partially-paid state.
- Manual reminder — the therapist sends a reminder email to the patient from the invoice's row; Halingo records that a reminder was sent and when.

## Key product behaviors

- Reminders are **manual** — the therapist chooses which invoices to remind and when. There is no automated escalation ladder, no SMS, and no third-party collection-agency hand-off in the current product.
- Each reminder send is logged on the invoice so the therapist can see the history of contact.
- The unpaid filter sorts overdue first, then by age of the oldest open invoice, so the therapist can prioritise.
- The dashboard widget links straight into the unpaid filter for fast triage.

## Belgian / regulatory notes

- Belgian consumer-protection rules limit the recovery costs and interest a creditor may charge a consumer for late payment of a B2C invoice; clinical invoices to private patients fall under these rules.
- A formal *ingebrekestelling* (notice of default) is the gateway to most collection escalations; Halingo's manual reminder is a friendly nudge, not a formal *ingebrekestelling*.

## Cross-references

- Payment Lifecycle — the open / partially-paid states drive what is eligible for reminding.
- Smart Invoicing — invoices originate here.
- Patient Communication — reminders are sent through the email surface.
- Main Dashboard — the unpaid widget lives on the dashboard grid.
