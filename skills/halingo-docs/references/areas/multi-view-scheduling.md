# Multi-View Scheduling

## What this area covers

The therapist's calendar — Day / Week / Month views, the appointment editor, recurring and group bookings, private blocks, the iCal feed used to sync the calendar to Google / Outlook, and the integration hooks for the Rosa booking platform.

## Features in this area

- Calendar views — switch between day, week, and month layouts; configure the visible hour range; navigate forward / backward in time.
- Event create / read / update / delete (CRUD) — the standard modal that creates and edits appointments, with patient linking and treatment selection.
- Event edit pages — full-screen edit for richer changes than the modal supports.
- Event deletion — delete a single appointment, with confirmation; for recurring series there are additional options (this one only / from this one onward).
- Recurring events — create a series with weekly / bi-weekly / monthly cadence; edit the series with rules about what can be changed in bulk vs per-occurrence.
- Group events — a single calendar slot attended by multiple patients (e.g. group therapy); each attendee is a separate billable session.
- Payback rules — the per-event rule that determines whether the session counts against the patient's reimbursable bracket (see Reimbursement Tracking).
- iCal feed — read-only iCal URL the therapist can paste into Google Calendar / Outlook to mirror their schedule.
- Rosa integration — appointments can flow in from the Rosa.be booking platform and back out to it (see External Platform Sync).
- Agenda settings — per-user calendar preferences (visible hour range, color coding, default appointment duration).

## Appointment types

1. **Individual session** — 1:1 therapy with a single patient; the default reimbursable type.
2. **Group session** — one slot, multiple patients; each attendee is billed separately.
3. **Private block** — non-clinical time the therapist marks as busy; visible only to the therapist who created it (hidden from the practice owner).
4. **Video consultation** — telehealth session (see Telehealth).
5. **Team meeting** — calendar slot reserved for in-practice meetings.

## Key product behaviors

- Each user has their own calendar; the practice owner can see their own and (where role permits) their colleagues' schedules.
- Color coding per appointment type is configurable per user.
- The hour range visible on Day / Week views is configurable so a therapist with a short day does not waste vertical space.
- Recurring series record their occurrences individually so each one can carry its own attendance, billing, and notes.
- Group bookings count one slot on the calendar but produce one billable session per attendee.
- The iCal feed is read-only and authenticated by a personal feed key (regeneratable from settings); appointments coming through iCal cannot be edited from Google / Outlook.

## Cross-references

- Reimbursement Tracking — every reimbursable appointment increments session counters.
- Smart Invoicing — completed sessions become invoiceable lines.
- External Platform Sync (Rosa) — bidirectional appointment sync.
- Telehealth — video-session appointments are a sub-type with their own billing code.
- Patient Data Privacy — patient-linked appointments are health data; access is governed by per-practice and per-dossier permissions.
