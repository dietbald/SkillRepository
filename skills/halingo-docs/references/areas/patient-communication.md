# Patient Communication

## What this area covers

The outbound-email surface used to send invoices and related documents to patients, plus the history of what was sent.

## Features in this area

- Invoice email send — send an invoice (and its accompanying certificate / verzamelstaat where applicable) to the patient by email, with a customisable subject and body and the practice's mail template.
- Email history — per-patient and per-invoice log of every email sent, with status (queued / sent / bounced / failed).

## Key product behaviors

- The therapist composes the email from the invoice's row; the practice's mail template provides the styling and the default body.
- The patient's email address is pulled from the dossier; the therapist can override it for a one-off send.
- Send status is shown in the history so the therapist can see if a delivery bounced and follow up.
- The product does **not** include automated appointment-reminder emails. Reminders to patients (e.g. "you have a session tomorrow") are not part of the patient-communication surface.
- Reminders for unpaid invoices are sent through the Debt Collection workflow, not from this surface.

## Belgian / regulatory notes

- Sending health-related correspondence by email requires the patient to have consented to that channel; the therapist is responsible for that consent.
- The email template is part of the practice's branding (see Practice Branding); the practice's BTW / RIZIV identification is rendered in the footer.

## Cross-references

- Smart Invoicing — invoice emails are sent from the invoice surface.
- Practice Branding — the mail template comes from per-practice settings.
- Debt Collection — payment-reminder emails are sent through the debt-collection flow, not from here.
- Patient Data Privacy — email content includes patient-identifying data; consent and access control apply.
