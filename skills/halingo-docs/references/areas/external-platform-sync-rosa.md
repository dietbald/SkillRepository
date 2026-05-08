# External Platform Sync (Rosa)

## What this area covers

The two-way connection between Halingo and Rosa.be — the Belgian online-booking platform widely used by paramedical professionals. When connected, patient bookings made on Rosa appear in Halingo, and changes made in Halingo flow back to Rosa.

## Features in this area

- Rosa connect — pair the therapist's Halingo account with their Rosa account using an integration token issued by Rosa.
- Rosa disconnect — remove the pairing; future sync stops.
- Rosa inbound sync — patients and bookings created on Rosa flow into Halingo automatically and on demand.
- Rosa outbound push — appointments created or modified in Halingo flow to Rosa so the patient sees the up-to-date schedule when they log into Rosa.
- Rosa patient merge — when an inbound Rosa patient matches an existing Halingo dossier, the therapist can merge them rather than creating a duplicate.
- Rosa review flow — inbound patients and appointments are flagged "needs review" so the therapist can attach the right treatment / dossier before they are billable.

## Connection flow

- The therapist creates an integration token from their Rosa professional dashboard.
- Inside Halingo, the therapist opens the Rosa integration page and pastes the token.
- Halingo calls Rosa to validate the token and lists the calendar(s) the token grants access to. If multiple calendars are exposed, the therapist picks one.
- Once connected, on-demand "sync now" actions are available alongside the automatic background sync.
- The integration page shows a clear connected / not-connected status and surfaces token-invalid errors when they occur.

## Key product behaviors

- Sync is **per user**, not per practice. Each therapist who wants Rosa integration pairs their own Rosa account.
- Inbound bookings without a treatment context are surfaced with a "needs review" marker on both the patient roster and the calendar; the therapist assigns the right treatment before the appointment is fully integrated.
- Inbound patients without a confidently-matching dossier are surfaced for manual matching or merge.
- A long backfill of historical data is intentionally avoided — the outbound push focuses on a recent rolling window rather than re-pushing the full history.
- The integration is dual-direction but **last write wins** is the conflict-resolution baseline for non-critical fields; therapists should treat Halingo as the source of truth for clinical data.

## Belgian / regulatory notes

- Rosa is a separate data controller; Halingo passes patient identity and appointment metadata to Rosa under the integration the therapist set up. The therapist's GDPR Art. 28 sub-processor diligence applies.
- Integration tokens grant API access to patient-adjacent data; therapists are responsible for revoking the token (Rosa disconnect) when an employee leaves the practice.
- The "needs review" flow is not just a UX nicety — it prevents non-compliant billing by ensuring every reimbursable appointment is bound to a valid treatment path before invoicing.

## Cross-references

- Identity — Rosa pairing is per user; the integration page is in the user's settings.
- Patient Data Privacy — Rosa receives identity and appointment data; transparency to the patient is the therapist's GDPR responsibility.
- Multi-View Scheduling — synced appointments appear on the calendar like any other; the calendar carries Rosa-origin markers and review flags.
- Treatment Planning — review-flow resolution requires picking the right treatment for the appointment.
