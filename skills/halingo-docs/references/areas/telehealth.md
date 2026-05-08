# Telehealth

## What this area covers

Video-consultation appointments (*telelogopedie* / *vidéoconsultation*) — scheduling, billing, and the dedicated RIZIV nomenclature code that applies when therapy is delivered remotely.

## Features in this area

- Video-consultation scheduling — create an appointment of the *consultation* type (the fourth event kind, alongside individual session, group session, and private block).
- Video-consultation billing — generate an invoice for a video session using the dedicated RIZIV nomenclature code reserved for telehealth.

## Key product behaviors

- A video consultation is a distinct appointment type; the therapist marks the appointment as a video session at create time.
- Halingo routes video sessions to the dedicated RIZIV telehealth code rather than the equivalent in-person code; the patient receives the correct certificate for reimbursement.
- The product does not bundle a video-call provider — the therapist uses any meeting platform of their choice. Halingo records that the session was video, when it took place, and links it to the correct billing code.
- Session counting (Reimbursement Tracking) applies the same way as for in-person sessions: a video session uses one reimbursable slot in the bracket.

## Belgian / regulatory notes

- RIZIV reimburses telelogopedie under specific conditions defined by the convention; the dedicated code makes the telehealth nature of the session legible to the mutualiteit.
- The RIZIV rules around telehealth changed during and after COVID-19; the current convention sets out who is eligible (e.g. patients who cannot attend in person, follow-up sessions in established treatment paths).
- Other constraints — minimum frequency of in-person sessions, maximum proportion of video sessions per bracket — are governed by the convention text, not by Halingo policy.

## Cross-references

- Multi-View Scheduling — video sessions appear on the calendar like any other appointment, with a visual marker for the type.
- Compliance Monitoring — the rules engine selects the telehealth code automatically when the appointment type is video.
- Smart Invoicing — invoices for video sessions are produced through the standard invoice flow with the telehealth code on the line.
- Reimbursement Tracking — video sessions count against the patient's reimbursable bracket.
