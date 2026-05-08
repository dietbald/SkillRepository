# Coverage matrix

A snapshot of how the user-facing helpdesk content covers Halingo's twenty functional groupings. Use this to find which helpdesk file documents which area, and where the helpdesk is thin (so a question may need to be answered from the area files in this skill rather than directly from the helpdesk).

## Helpdesk source files at a glance

| File | Language mix | Topics |
|---|---|---|
| `general-getting-started.md` | NL ~75% / FR ~22% | Catch-all: account, login, profile, dashboard, multi-praktijk, treatment plan, reimbursement, documents, GDPR-adjacent topics. |
| `invoicing-finances.md` | NL ~99% | Certificates, invoicing, verzamelstaten, payment statuses, commissions, matrix-printer set-up. |
| `patient-management.md` | NL ~95% | Patient roster overview (sparse). |
| `agenda-scheduling.md` | NL ~95% | Calendar use, appointments, recurring / group events, Rosa, color coding. |
| `settings-practice-management.md` | NL 100% | Practice configuration: logo, accent color, email templates. |
| `integrations.md` | NL 100% | Rosa connection setup. |
| `compliance-riziv.md` | NL ~98% | "De Conventie 2024" rules, brackets, code routing, age-based eligibility. |
| `faq-troubleshooting.md` | NL ~98% | FAQ-style answers to common user questions. |

## Functional groupings — coverage view

The twenty functional groupings of the Halingo product (see `01-application-map.md`) and where the helpdesk documents each one.

| # | Grouping | Coverage | Primary helpdesk source |
|---:|---|---|---|
| 1 | Identity Management | Well covered | `general-getting-started.md` |
| 2 | Practice Branding | Well covered | `settings-practice-management.md` |
| 3 | Patient Data Privacy | Not covered | — (no GDPR export / retention / right-to-erasure articles) |
| 4 | Waitlist Optimization | Not covered | — (no intake / prioritisation workflow) |
| 5 | Multi-View Scheduling | Well covered | `agenda-scheduling.md` + `general-getting-started.md` |
| 6 | Treatment Planning | Well covered | `general-getting-started.md` |
| 7 | Reimbursement Tracking | Well covered | `invoicing-finances.md` + `general-getting-started.md` |
| 8 | Compliance Monitoring | Well covered | `compliance-riziv.md` |
| 9 | Clinical Reporting | Partial | `general-getting-started.md` |
| 10 | Document Digitization | Well covered | `general-getting-started.md` |
| 11 | Smart Invoicing | Well covered | `invoicing-finances.md` |
| 12 | Payment Lifecycle | Well covered | `invoicing-finances.md` |
| 13 | Debt Collection | Partial | `invoicing-finances.md` |
| 14 | Mutualistic Billing | Well covered | `invoicing-finances.md` |
| 15 | Precision Printing | Well covered | `invoicing-finances.md` |
| 16 | Patient Communication | Partial | `settings-practice-management.md` + `invoicing-finances.md` |
| 17 | Telehealth Integration | Well covered | `agenda-scheduling.md` |
| 18 | External Platform Sync (Rosa) | Well covered | `integrations.md` |
| 19 | Practice Analytics | Partial | — (no dedicated helpdesk article) |
| 20 | SaaS Lifecycle | Well covered | `general-getting-started.md` |

**Score:** 15 well covered · 3 partial · 2 not covered.

## Areas covered by this skill but light in helpdesk

These areas have full coverage in the per-area files (see `references/areas/`) but the helpdesk is thin or silent. If a question maps to one of them, prefer the area file over a helpdesk grep.

- Patient Data Privacy & access control
- Waitlist Optimization
- Practice Analytics
- Patient Communication (specifically: appointment reminders are not part of the product)

## Concepts not in `01-application-map.md` but real product features

These exist in the product and have helpdesk articles but are not part of the canonical 20 functional groupings. They live under one of the 20 areas in this skill:

1. Matrix-printer hardware integration (Precision Printing).
2. RIZIV convention version tracking (Compliance Monitoring).
3. Tariff-indexation patient communication (Patient Communication).
4. School / care coordinator metadata on pediatric patient dossiers (Patient Data Privacy).
5. Therapeutic goal hierarchy with sub-goals (Treatment Planning).
6. Practice chat (an internal messaging surface; ask product-owner before relying on it — earmarked for retirement).
7. R-waarde tracking (Compliance Monitoring / Practice Analytics).
8. Private appointments — non-billable, hidden from peers (Multi-View Scheduling).
9. Per-disorder commission overrides (Smart Invoicing).
10. Appointment-type color coding (Multi-View Scheduling).
11. Read-only iCal export to Google Calendar / Outlook (Multi-View Scheduling).
12. Aanvullende verzekering as a separate reimbursement plan type (Reimbursement Tracking).
13. External session counting from other practices (Reimbursement Tracking).
14. Three-tier role model with differing financial visibility (Identity).
15. Two-level invoice comments (practice-level vs user-level) (Practice Branding / Smart Invoicing).
16. Aanbrengbonus referral programme (SaaS Lifecycle).
17. Per-praktijk invoice language separate from per-user UI language (Practice Branding).

## Helpdesk source quality notes

- Some helpdesk articles contain duplicate content (e.g. tariff-indexation in two files; commission articles scattered across three; the Chrome / Firefox / Edge printing articles overlap heavily).
- Source language is mostly Dutch; small French passages exist in `general-getting-started.md`.
- Some helpdesk articles contain broken image references (carried over from a previous CMS export). Treat illustrative images as nice-to-have, not load-bearing.
