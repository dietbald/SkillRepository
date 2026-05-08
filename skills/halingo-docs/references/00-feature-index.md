# Feature index — alphabetical

Every Halingo feature in one alphabetical list, with a short description and the product area it belongs to.

| Name | Area | Summary |
|---|---|---|
| **agenda-settings** | scheduling | Per-user calendar preferences (visible hour range, color coding, default duration). |
| **bilan-lifecycle** | treatment-planning | Lifecycle of the assessment reports that punctuate a treatment (aanvangs-, evolutie-, herval-, verlengingsbilan). |
| **billing** | saas | Halingo's own subscription billing — payment-method capture, recurring charges, billing history. |
| **calendar-views** | scheduling | Day, week, and month calendar layouts with configurable hour range. |
| **certificate-management** | smart-invoicing | Link the official paper *getuigschrift* to its invoice and track issued certificates. |
| **certificate-manual-mode** | precision-printing | Therapist fills the certificate booklet by hand using on-screen values. |
| **certificate-numbering** | precision-printing | Sequential per-booklet numbering with re-use prevention. |
| **certificate-printer-mode** | precision-printing | Print the certificate directly to a matrix printer pre-loaded with RIZIV booklets. |
| **commission-invoicing** | smart-invoicing | Monthly statement of money owed between a group practice and its members. |
| **commission-manual** | payment-lifecycle | Manually mark a commission settlement as paid. |
| **create-patient** | patient | Create a new patient dossier from scratch. |
| **create-practice** | practice | Create a new practice (typically by the founder / praktijkverantwoordelijke). |
| **dashboard-weekly-activity** | practice-analytics | Weekly bar chart with busiest / quietest / average-day annotations. |
| **dashboard-widget** | debt-collection | Count and total of unpaid / overdue patient invoices on the main dashboard. |
| **demand-form-generate** | clinical-reporting | Pre-fill the official RIZIV demand-form PDF with dossier and treatment data. |
| **document-list-and-search** | document-digitization | Browse, filter, and search the dossier's *Documenten* tab. |
| **document-upload** | document-digitization | Attach a PDF or image to a patient dossier; tag and link to a treatment. |
| **document-view-and-edit** | document-digitization | Preview, rename, re-tag, move, or soft-delete a dossier document. |
| **earnings-overview** | practice-analytics | Practice-level revenue over time — cash-in vs invoiced. |
| **email-history** | patient-communication | Per-patient and per-invoice log of every email sent, with delivery status. |
| **email-management** | identity | Change the email address on a user account, with verification. |
| **error-pages** | shared | User-facing not-found and unexpected-error pages. |
| **eval-session** | compliance-monitoring | Rules governing how *aanvangsbilan* sessions may be billed. |
| **event-crud** | scheduling | Create, read, update, delete an appointment with patient + treatment linking. |
| **event-deletion** | scheduling | Delete a single appointment or a recurring-series occurrence. |
| **event-edit-pages** | scheduling | Full-screen edit for richer changes than the modal supports. |
| **financial-overview** | smart-invoicing | Single-screen summary of the practice's financial position. |
| **generate-verzamelstaten** | mutualistic-billing | Produce a batched insurance statement for one mutualiteit or one patient. |
| **group-events** | scheduling | A single calendar slot attended by multiple patients; each is a separate billable session. |
| **ical-feed** | scheduling | Read-only iCal URL the therapist can paste into Google / Outlook. |
| **insurance-cascade** | payment-lifecycle | Insurance reimbursement reduces invoice balance; remaining *remgeld* stays open against the patient. |
| **invitations** | identity | Owner / admin sends a one-click invite by email; recipient joins the practice. |
| **invoice-cancel** | payment-lifecycle | Cancel an issued invoice; cancellation is recorded in the audit trail. |
| **invoice-delivery** | smart-invoicing | Print, save as PDF, or email an invoice to the patient. |
| **invoice-email-send** | patient-communication | Send an invoice by email with the practice's mail template. |
| **invoice-settings** | practice | Per-practice invoice template, locale, numbering prefix, footer comment. |
| **list-filter** | waitlist | Filter the patient roster to show only waitlisted patients. |
| **login-and-logout** | identity | Email + password sign-in and sign-out. |
| **long-term-goals** | treatment-planning | Main therapeutic goals organised in categories with optional sub-goals. |
| **low-session-alert** | reimbursement-tracking | Notification when a patient is approaching the bracket cap. |
| **mail-settings** | practice | Per-practice sender name, sender email, and outbound mail template. |
| **main-dashboard** | main-dashboard | Layout of the post-login widget grid. |
| **manual-reminder** | debt-collection | Therapist sends a reminder email to a patient for an unpaid invoice. |
| **newsfeed** | newsfeed | System-wide bilingual NL/FR announcement stream on the dashboard. |
| **nomenclature-lookup** | compliance-monitoring | Search the RIZIV nomenclature catalogue for the right billing code. |
| **notifications** (compliance) | compliance-monitoring | Compliance warnings (e.g. about to exceed a session cap). |
| **notifications** (inbox) | notifications | The notification inbox with new / seen / read states. |
| **password-management** | identity | Change password, request reset by email, set new password from reset link. |
| **patient-access-control** | patient | Per-dossier permission model layered additively on top of practice-level RBAC. |
| **patient-detail** | patient | Single-dossier overview: contact, demographics, treatment summary, recent activity. |
| **patient-edit** | patient | Edit contact details, demographics, pediatric metadata. |
| **patient-invoice-generation** | smart-invoicing | Pick completed sessions and produce a patient invoice in one click. |
| **patient-invoice-lifecycle** | smart-invoicing | The states an invoice moves through (draft / open / partially paid / paid / printed / mailed / cancelled). |
| **patient-list** | patient | Searchable roster of every patient in the active practice with status tags. |
| **patient-manual** | payment-lifecycle | Therapist records a patient payment (cash, transfer, card). |
| **payback-eligibility** | reimbursement-tracking | Determines whether a session counts against the patient's reimbursable bracket. |
| **payback-promotion-and-override** | reimbursement-tracking | Therapist manually marks a session as billable / non-billable. |
| **payback-rules** | scheduling | Per-event rule controlling whether the session counts against the bracket. |
| **practice-info** | practice | Name, address, contact details, BTW and RIZIV numbers, bank accounts. |
| **practice-patient-stats** | practice-analytics | Per-practice patient counts, intake / drop-off rates, active vs archived. |
| **practice-switcher** | practice | UI control to switch active practice context for users in multiple practices. |
| **practitioner-lookup** | compliance-monitoring | Find a practitioner by name or RIZIV/INAMI number. |
| **print-mail-state** | payment-lifecycle | Track whether an invoice has been printed, mailed, or both. |
| **profile** | identity | Manage personal details (name, gender, profile photo, UI language). |
| **r-waarde-stats** | compliance-monitoring | RIZIV time-equivalent metric tracked alongside session counts. |
| **rbac** | identity | Role-based access control: owner / administrator / member, scoped per practice. |
| **recurring-events** | scheduling | Weekly / bi-weekly / monthly recurring appointment series. |
| **referral-programme** | saas | *Aanbrengbonus*: free month for a successful referral that converts. |
| **report-create-edit** | clinical-reporting | Rich-text clinical report with auto-save inside the dossier. |
| **report-delete** | clinical-reporting | Soft-delete a clinical report; record retained for audit. |
| **riziv-overview** | practice-analytics | Annual workload metrics aligned to RIZIV reporting (sessions per code, R-waarde totals). |
| **rosa-connect** | rosa-sync | Pair the user's account with Rosa.be using an integration token. |
| **rosa-disconnect** | rosa-sync | Remove the Rosa pairing; future sync stops. |
| **rosa-inbound-sync** | rosa-sync | Patients and bookings created on Rosa flow into Halingo. |
| **rosa-integration** | scheduling | Calendar appointments synchronise with Rosa.be. |
| **rosa-outbound-push** | rosa-sync | Halingo appointment changes flow back to Rosa. |
| **rosa-patient-merge** | rosa-sync | Merge an inbound Rosa patient into an existing Halingo dossier. |
| **rosa-review-flow** | rosa-sync | "Needs review" markers on inbound Rosa data so the therapist can attach a treatment / dossier. |
| **rules-engine** | compliance-monitoring | Centralised set of dated rules driving the RIZIV / De Conventie 2024 logic. |
| **saas-stripe-sync** | payment-lifecycle | Card / online payments are reconciled automatically with the invoice state machine. |
| **session-caps** | compliance-monitoring | Per-pathology maximum reimbursable session count per treatment episode. |
| **session-overview** | practice-analytics | Counts of sessions per period, optionally per therapist for group practices. |
| **session-unit-calculation** | reimbursement-tracking | Convert each completed session into the number of reimbursement units it represents. |
| **short-term-goals** | treatment-planning | Concrete weekly / monthly objectives the therapist works on with the patient. |
| **signup** | identity | Create a new user account. |
| **statistics-count** | waitlist | Show how many patients are currently on the waitlist. |
| **status-flag** | waitlist | Mark a patient dossier as "on waitlist". |
| **stripe-webhooks** | saas | Synchronisation of payment events from the integrated payment processor. |
| **subscription-management** | saas | Pick a plan, change plans, cancel, restart. |
| **team-management** | identity | Owner / admin manages members of the practices they manage. |
| **terms-of-service** | identity | First-login acceptance flow; users cannot use the app until accepted. |
| **todos** | todos | Per-user lightweight task list. |
| **treatment-create** | treatment-planning | Start a new treatment for a patient; type drives RIZIV code, bracket, and cap. |
| **treatment-notifications** | treatment-planning | Alerts about treatment milestones (bracket exhaustion, bilan due, goal completed). |
| **unpaid-filter** | debt-collection | Saved view on the financial overview listing only open / partially-paid invoices. |
| **verzamelstaat** | smart-invoicing | Verzamelstaat as part of the invoicing surface (see also Mutualistic Billing). |
| **verzamelstaat-detail-view** | mutualistic-billing | Open a verzamelstaat to inspect the included invoices, totals, and per-patient breakdown. |
| **verzamelstaat-lifecycle** | mutualistic-billing | Track a verzamelstaat through its states and reconcile incoming bulk payments. |
| **video-consultation-billing** | telehealth | Generate an invoice for a video session using the dedicated RIZIV telehealth code. |
| **video-consultation-scheduling** | telehealth | Create a video-consultation appointment. |
| **zip-code-lookup** | shared | Auto-complete city / locality from a Belgian postal code. |
