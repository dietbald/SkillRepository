# Treatment Planning

## What this area covers

The clinical-planning surface inside a patient dossier — the *bilan* lifecycle, the long-term and short-term goal hierarchy that structures therapy, the create-treatment flow, and the notifications related to treatment progress.

## Features in this area

- Treatment create — start a new treatment for a patient, picking the treatment type (which determines the RIZIV code, the bracket length, and the cap on reimbursable sessions).
- Bilan lifecycle — the lifecycle of the assessment reports that punctuate a treatment: *aanvangsbilan* (initial), *evolutiebilan* (progress), *hervalbilan* (relapse), *verlengingsbilan* (extension).
- Long-term goals — main therapeutic goals organised in categories (e.g. articulation, language comprehension, fluency, voice); each goal can have sub-goals.
- Short-term goals — concrete weekly / monthly objectives the therapist works on with the patient, often laddered under a long-term goal.
- Treatment notifications — alerts the therapist receives about treatment milestones (bracket exhaustion approaching, bilan due, goal completed).

## Treatment types

Halingo recognises a fixed set of treatment types aligned to the RIZIV nomenclature (per pathology and per setting). When the therapist creates a treatment, picking the type sets:
- the applicable RIZIV nomenclatuurcode for billing,
- the bracket length (default two years for most pathologies, with documented exceptions),
- the maximum reimbursable session count for the bracket.

## Goal hierarchy

- **Long-term goals** group under product-defined categories (articulation, voice, language, fluency, swallowing, reading/writing, oral/written language comprehension, autism-spectrum communication, dyscalculia-related, neurogenic disorders, other).
- Each long-term goal can carry **sub-goals** so the therapist can break a broad clinical aim into trackable sub-objectives.
- **Short-term goals** are the concrete weekly / monthly steps; they may be linked to a long-term goal for context.

## Bilan flow

- An *aanvangsbilan* opens a new treatment and the corresponding RIZIV demand form (see Clinical Reporting).
- *Evolutiebilans* are written periodically through the treatment.
- A *hervalbilan* is written after a setback (return to a previous symptom level) and may justify additional sessions.
- A *verlengingsbilan* is written when the bracket is approaching its session cap and continued therapy is medically indicated; once approved, a new bracket begins.

## Belgian / regulatory notes

- Each bilan has RIZIV-defined billing rules: the *aanvangsbilan* is billed in 30-minute units up to a maximum of five reimbursable units per episode.
- Bracket length, cap, and bilan rules are dictated by the convention; therapists should consult the current convention text for exact values per pathology.

## Cross-references

- Compliance Monitoring — treatment type, bracket length, and session cap come from the rules engine.
- Reimbursement Tracking — bracket and session counters update as appointments are completed.
- Clinical Reporting — bilans and free-text notes are authored through the report surface.
- Patient Data Privacy — treatment plans contain health data; access is governed at the dossier level.
- External Platform Sync (Rosa) — inbound Rosa appointments must be assigned to a treatment in this area before they are billable.
