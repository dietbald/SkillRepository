# Patient Data Privacy & Patient Management

## What this area covers

The patient dossier surface — list, detail, edit, create — plus the access-control model that governs who can see and modify which dossier.

## Features in this area

- Patient list — searchable roster of every patient in the active practice, with status tags (e.g. waitlist, active, archived).
- Patient detail — single-dossier overview: contact info, demographic data, treatment summary, recent activity.
- Patient edit — edit contact details, demographic fields, school / care coordinator metadata for pediatric patients.
- Create patient — new dossier from scratch.
- Patient access control — who in the practice can see and edit a given dossier.

## Access-control model

Halingo combines two layers of permission for any dossier action:

1. **Practice-level role** (Identity area). Owner / administrator / member; each role grants a base set of dossier permissions in that practice.
2. **Per-dossier grant**. The practice owner / administrator can additionally grant a specific user explicit access to a specific dossier (e.g. for a member who needs to cover a colleague's caseload temporarily).

The two layers combine **additively** — a per-dossier grant can *top up* access for a user whose role would not otherwise allow it; per-dossier grants do not revoke practice-level access.

A practice member who creates a dossier is automatically granted access to it.

## Soft-deletion

Removing a dossier marks it as deleted in the user view but does not purge the underlying record. This is a deliberate choice driven by the Belgian Kwaliteitswet's 30-year minimum retention obligation — clinical content cannot lawfully be purged early.

## Pediatric data

Patient dossiers may include pediatric metadata: school, *Centrum voor Leerlingenbegeleiding* (CLB), classroom teacher, *zorgcoördinator* (care coordinator). These are first-class fields on the dossier and apply special-protection considerations under Belgian and EU law for minors' data.

## Belgian / regulatory notes

- Patient data is GDPR Art. 9 special-category data; access must be bound to identified care providers and logged for accountability.
- The Kwaliteitswet (22 April 2019) requires patient files to be retained for 30 to 50 years from last patient contact. The right to erasure under GDPR does not override this retention obligation for clinical content.
- The Wet Patiëntenrechten gives patients rights of access (art. 9), rectification, and (within retention limits) annotation of contested entries.
- Professional secrecy under art. 458 of the Belgian Criminal Code binds every person with access to the dossier — including practice administrators and external sub-processors.

## Cross-references

- Identity — practice-level RBAC roles compose with per-dossier grants here.
- Clinical Reporting — clinical content is authored against this dossier surface.
- Document Digitization — uploaded files attach to this dossier surface.
- External Platform Sync (Rosa) — inbound Rosa patients are matched / merged into this dossier surface.
- Reimbursement Tracking — the patient's bracket and session counters live on the dossier.
