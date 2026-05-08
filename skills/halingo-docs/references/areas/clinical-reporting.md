# Clinical Reporting

## What this area covers

Authoring, editing, deleting, and generating clinical reports ("verslagen") inside a patient dossier, plus generation of pre-printed RIZIV demand-form PDFs from dossier and treatment data.

## Features in this area

- Create / edit a clinical report — rich-text editor inside the patient's *Documenten / Verslagen* tab. Auto-saves while the therapist types.
- Delete a clinical report — soft-delete from the patient view; the underlying record is retained for audit and Belgian retention obligations.
- Generate a RIZIV demand form — pre-fills the official RIZIV demand-form PDF (per pathology, per language) with patient demographics, treatment metadata, and prescriber information. The output appears in the dossier alongside other documents.

## Report types stored under the dossier's *Documenten / Verslagen* tab

1. **In-app rich-text reports** — authored directly in Halingo; one editable HTML body per report.
2. **Uploaded documents** — PDFs or images uploaded by the therapist (see Document Digitization area).
3. **Generated demand-form PDFs** — produced by the demand-form generator from RIZIV-mandated templates.

All three appear in a single, unified list with filtering and search by tag, treatment, and date.

## Demand form generator

- The therapist opens the *Formulieren* / *Aanvraag* action from a treatment context inside a dossier.
- Halingo selects the correct template based on the treatment type and the report language (NL / FR).
- Patient demographics, prescriber details, and treatment information are merged into the official RIZIV form.
- The result is filed under *Documenten*; the rich-text editor never opens for it (it is a generated PDF, not editable text).

## Behavioral notes

- Reports may be linked to a specific treatment so that the dossier's treatment view shows them in context. When linked, the tag picker is hidden — the treatment provides the categorisation.
- A new report's body is seeded with the practice name as a heading so the therapist starts from a branded blank page.
- Reports can be downloaded as a Word-compatible file from a download action on each report.

## Belgian / regulatory notes

- RIZIV demand-form templates are government-mandated and published per pathology on riziv.fgov.be. Halingo bundles the required versions; new RIZIV versions take effect on dated cut-offs and require updating the bundled templates.
- The Kwaliteitswet (22 April 2019) requires patient files to be retained for a minimum of 30 years (maximum 50) from last patient contact. Soft-deletion and the absence of a hard-delete path serve this obligation.
- Clinical content is health data under GDPR Art. 9; access is restricted to professionals bound by professional secrecy (art. 458 Strafwetboek) within the practice.

## Cross-references

- Document Digitization — uploaded files and generated PDFs share the same dossier surface and storage backend.
- Treatment Planning — reports are typically authored in the context of a specific treatment.
- Patient Data Privacy — clinical content is special-category data; access is governed by per-practice and per-dossier permissions.
