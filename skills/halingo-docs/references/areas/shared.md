# Shared / cross-cutting features

**Migration area** for spec contracts that don't fit a single product area: shared error pages, shared utilities (zip-code lookup, etc.).

## What this area covers

Cross-cutting helpers used by many areas — error/404/500 pages, ZIP code lookup (Belgian postal codes bundled JSON), shared widgets.

## Spec contracts (Phase 2)

- **error-pages** — Feature: shared/error-pages
  - Path: `02-specs/shared/error-pages/spec.md`
- **zip-code-lookup** — Feature: shared/zip-code-lookup
  - Path: `02-specs/shared/zip-code-lookup/spec.md`

## Cross-references

- **Belgian ZIP code lookup**: see `references/from-source/features/belgian_zip_code_lookup.md` — bundled ~2700-row JSON, case-sensitive substring scan.
- **Shared utilities**: `references/from-source/features/shared_utilities.md` — generatePDF (HTML→PDF), zip-code lookup, admin impersonation.
- **PDF generation**: `references/from-source/features/pdf_generation.md` — `html-pdf` (PhantomJS) pipeline, do NOT port to mono repo.

## Phase 1 discovery

_No standalone Phase 1 discovery file for the shared area; ZIP lookup is documented under `references/from-source/features/belgian_zip_code_lookup.md`. Error pages are not separately documented in Phase 1._
