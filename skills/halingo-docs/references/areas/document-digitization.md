# Document Digitization

## What this area covers

The dossier surface for storing, retrieving, viewing, and editing patient-related documents (PDFs, images, scans, prescriptions) — separate from the in-app rich-text reports authored in Clinical Reporting.

## Features in this area

- Document upload — attach a PDF or image to a patient dossier; tag it; optionally link it to a specific treatment.
- Document list and search — browse the dossier's *Documenten* tab; filter by tag, treatment, or date; full-text search where applicable.
- Document view and edit — preview a document inline; rename / re-tag / move between treatments / soft-delete.

## Key product behaviors

- Documents live under the patient dossier's *Documenten* / *Verslagen* tab alongside in-app reports and generated demand-form PDFs (see Clinical Reporting); the unified list surfaces all three kinds.
- Tags are practice-defined strings the therapist applies for retrieval (e.g. "voorschrift", "scan", "ouderbrief").
- A document can be linked to a specific treatment so it appears in the treatment's context view.
- Soft-deletion: removing a document hides it from the dossier view but the record is retained for audit and Belgian retention obligations.
- Office files (Word, Excel, PowerPoint) are previewed inline; PDFs and images render in the browser.

## Belgian / regulatory notes

- Patient documents are health data under GDPR Art. 9 and clinical record content under the Kwaliteitswet — the 30-year minimum retention applies, which is why documents are soft-deleted rather than purged.
- Office-document inline previews that rely on public third-party rendering services raise a sub-processor question under GDPR Art. 28; previews ideally render in-app to avoid exporting URLs to third parties.

## Cross-references

- Clinical Reporting — generated demand-form PDFs and in-app reports share the dossier's *Documenten* tab.
- Patient Data Privacy — access to documents follows the per-practice and per-dossier permission model.
- Treatment Planning — documents may be scoped to a specific treatment for context.
- Smart Invoicing — uploaded prescriptions are the clinical evidence behind the invoiced sessions.
