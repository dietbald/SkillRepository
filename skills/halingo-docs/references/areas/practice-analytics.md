# Practice Analytics

## What this area covers

The dashboards and overview screens that summarise the practice's clinical and financial activity over time — what the praktijkverantwoordelijke and individual therapists need to see to manage their workload and revenue.

## Features in this area

- Dashboard weekly activity — the weekly bar chart on the main dashboard with busiest / quietest / average annotations.
- Earnings overview — practice-level revenue over time, including cash-in vs invoiced.
- Session overview — counts of sessions per period, optionally per therapist for group practices.
- RIZIV overview — annual workload metrics aligned to RIZIV reporting (sessions per code, R-waarde totals).
- Practice patient stats — per-practice patient counts, intake / drop-off rates, active vs archived dossiers.

## Key product behaviors

- Analytics screens are read-only summaries; underlying data lives in the dossier, calendar, and invoicing surfaces.
- Most charts target a working-week view (Mon–Sat) by default and let the user pivot to a longer horizon (month, quarter, year) where relevant.
- Group practices split metrics per therapist where the viewer's role permits the breakdown; a regular member sees only their own numbers.
- The RIZIV overview is the surface a therapist consults when preparing the annual workload data they may need to communicate to mutualiteiten or for personal record-keeping.
- The product currently focuses on retrospective views; forecasting, scheduled exports, and aging buckets are not part of the surface.

## Belgian / regulatory notes

- R-waarde totals are RIZIV's measure of therapist workload; some convention rules and some mutualiteit dashboards use them as a sanity check on annual activity.
- Per-pathology session counts and per-mutualiteit revenue breakdowns matter when the therapist evaluates their patient mix and reimbursement reliability.

## Cross-references

- Main Dashboard — the weekly activity widget is the dashboard's first view of these analytics.
- Compliance Monitoring — code-level breakdowns rely on the rules engine's classification.
- Reimbursement Tracking — session counters feed the per-patient view of the same data.
- Smart Invoicing — earnings analytics aggregate the invoice surface.
- Identity — role gating determines whether a viewer sees their own numbers or the practice's totals.
