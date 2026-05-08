# Reimbursement Tracking

## What this area covers

The session-counting machinery that tells therapist and patient how many reimbursable sessions remain in the current treatment bracket, and the alerts that warn when a bracket is about to be exhausted.

## Features in this area

- Session unit calculation — converts each completed session into the number of reimbursement units it represents (sessions of 30 min vs 60 min count differently against the bracket).
- Payback eligibility — determines whether a given session counts against the bracket (the *hasPayBack* flag in user terms — "does this session use up one of the patient's reimbursable slots?").
- Payback promotion / override — therapist can manually mark a session as billable / non-billable when the default rule is wrong (e.g. for a missed session that is exceptionally not charged to the patient's bracket).
- Low-session alert — surfaces a notification when the patient's bracket is approaching exhaustion so the therapist can plan a *verlengingsbilan* if appropriate.

## Key product behaviors

- Each treatment bracket has a maximum number of reimbursable sessions per the De Conventie rules (per pathology, per age band).
- Halingo counts sessions across all of the patient's appointments in the active bracket — including sessions performed at a different practice if the patient has been transferred (external session counting).
- A session is by default *payback-eligible*; the therapist can override per-session if needed.
- The low-session alert fires both as an in-app notification and as a visual marker on the patient dossier.
- A new bracket starts when a new approved demand-form / prescription is filed.

## External session counting

When a patient transfers to a new practice mid-bracket, the previous practice's session count must be honoured. The therapist enters the number of sessions already performed elsewhere; Halingo includes those in the bracket count.

## Belgian / regulatory notes

- Per-pathology session caps are set by RIZIV in the convention. The cap is the *maximum reimbursable* count, not the maximum *clinically allowed* count — a patient may continue therapy beyond the cap, but additional sessions are not reimbursable unless a *verlengingsbilan* is approved.
- Brackets default to two years from the start date (since August 2024); pathological exceptions (cleft palate, Locked-in syndrome) have longer brackets.
- The therapist must produce a *verlengingsbilan* (extension report) to justify a new bracket; see Clinical Reporting.

## Cross-references

- Compliance Monitoring — the per-pathology caps and the bracket length come from the rules engine.
- Multi-View Scheduling — every appointment is the input to session counting.
- Treatment Planning — new brackets begin with a treatment-create flow that includes a fresh demand form.
- In-app Notifications — the low-session alert is delivered through the notifications surface.
