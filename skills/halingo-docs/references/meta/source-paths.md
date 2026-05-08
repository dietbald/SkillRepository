# Source paths — skill file → original source(s)

Every file in this skill traces back to one or more original source files. Use this to (a) verify a claim, (b) check whether a source has changed since the skill was built, or (c) re-run the build script if sources have moved.

## Top-level reference files

| Skill file | Original source(s) |
|---|---|
| `SKILL.md` | Hand-authored from the entire bundle |
| `references/00-feature-index.md` | All `02-specs/**/spec.md` (105 files) + all `HalingoDoc/docs/from_source/features/*.md` (51 files); built by Python script |
| `references/01-application-map.md` | `HalingoDoc/docs/functional/application_map.md` (verbatim) |
| `references/02-glossary.md` | `HalingoDoc/docs/glossary.md` (verbatim) |
| `references/03-coverage-matrix.md` | `HalingoDoc/docs/coverage_matrix.md` (verbatim) |
| `references/specs-index.md` | All `02-specs/**/spec.md` (105 files); built by Python script |

## Area files

Each `references/areas/<area>.md` is built from THREE inputs:

1. `01-discovery/<area>.md` (Phase 1 discovery, copied verbatim)
2. `01-discovery/<area>.verification.md` (Phase 1 verification, copied verbatim)
3. `02-specs/<spec-folder>/**/spec.md` (spec list synthesized from spec H1)

Mapping table (discovery name → spec folder name; some areas have different names because the migration workspace organizes specs by "implementation slice" not "discovery topic"):

| Area file | Discovery file | Spec folder |
|---|---|---|
| `areas/client-side-error-logging.md` | `01-discovery/client-side-error-logging.md` (+ verification) | (none — cross-cutting infra) |
| `areas/clinical-reporting.md` | `01-discovery/clinical-reporting.md` (+ verification) | `02-specs/clinical-reporting/` |
| `areas/compliance-monitoring.md` | `01-discovery/compliance-monitoring.md` (+ verification) | `02-specs/compliance-monitoring/` |
| `areas/debt-collection.md` | `01-discovery/debt-collection.md` (+ verification) | `02-specs/debt-collection/` |
| `areas/document-digitization.md` | `01-discovery/document-digitization.md` (+ verification) | `02-specs/document-digitization/` |
| `areas/external-platform-sync-rosa.md` | `01-discovery/external-platform-sync-rosa.md` (+ verification) | `02-specs/rosa-sync/` |
| `areas/identity.md` | `01-discovery/identity.md` (+ verification) | `02-specs/identity/` |
| `areas/in-app-notifications.md` | `01-discovery/in-app-notifications.md` (+ verification) | `02-specs/notifications/` |
| `areas/main-dashboard.md` | `01-discovery/main-dashboard.md` (+ verification) | `02-specs/main-dashboard/` |
| `areas/multi-view-scheduling.md` | `01-discovery/multi-view-scheduling.md` (+ verification) | `02-specs/scheduling/` |
| `areas/mutualistic-billing.md` | `01-discovery/mutualistic-billing.md` (+ verification) | `02-specs/mutualistic-billing/` |
| `areas/newsfeed.md` | `01-discovery/newsfeed.md` (+ verification) | `02-specs/newsfeed/` |
| `areas/patient-communication.md` | `01-discovery/patient-communication.md` (+ verification) | `02-specs/patient-communication/` |
| `areas/patient-data-privacy.md` | `01-discovery/patient-data-privacy.md` (+ verification) | `02-specs/patient/` |
| `areas/payment-lifecycle.md` | `01-discovery/payment-lifecycle.md` (+ verification) | `02-specs/payment-lifecycle/` |
| `areas/practice-analytics.md` | `01-discovery/practice-analytics.md` (+ verification) | `02-specs/practice-analytics/` |
| `areas/practice-branding.md` | `01-discovery/practice-branding.md` (+ verification) | `02-specs/practice/` |
| `areas/precision-printing.md` | `01-discovery/precision-printing.md` (+ verification) | `02-specs/precision-printing/` |
| `areas/reimbursement-tracking.md` | `01-discovery/reimbursement-tracking.md` (+ verification) | `02-specs/reimbursement-tracking/` |
| `areas/saas-lifecycle.md` | `01-discovery/saas-lifecycle.md` (+ verification) | `02-specs/saas/` |
| `areas/shared.md` | (no Phase 1 discovery; cross-cutting) | `02-specs/shared/` |
| `areas/smart-invoicing.md` | `01-discovery/smart-invoicing.md` (+ verification) | `02-specs/smart-invoicing/` |
| `areas/telehealth.md` | `01-discovery/telehealth.md` (+ verification) | `02-specs/telehealth/` |
| `areas/todos.md` | `01-discovery/todos.md` (+ verification) | `02-specs/todos/` |
| `areas/treatment-planning.md` | `01-discovery/treatment-planning.md` (+ verification) | `02-specs/treatment-planning/` |
| `areas/waitlist-optimization.md` | `01-discovery/waitlist-optimization.md` (+ verification) | `02-specs/waitlist/` |

**Discovery → spec name renames** (where they differ):
- `external-platform-sync-rosa` (discovery) → `rosa-sync` (spec)
- `in-app-notifications` (discovery) → `notifications` (spec)
- `multi-view-scheduling` (discovery) → `scheduling` (spec)
- `patient-data-privacy` (discovery) → `patient` (spec) — the spec set covers patient management broadly; data privacy is a sub-topic
- `practice-branding` (discovery) → `practice` (spec) — same broadening
- `saas-lifecycle` (discovery) → `saas` (spec)
- `waitlist-optimization` (discovery) → `waitlist` (spec)

## Helpdesk files (8)

Verbatim copies, with helpdesk filenames hyphenated:

| Skill file | Original |
|---|---|
| `references/helpdesk/agenda-scheduling.md` | `HalingoDoc/docs/full_documentation/agenda_scheduling.md` |
| `references/helpdesk/compliance-riziv.md` | `HalingoDoc/docs/full_documentation/compliance_riziv.md` |
| `references/helpdesk/faq-troubleshooting.md` | `HalingoDoc/docs/full_documentation/faq_troubleshooting.md` |
| `references/helpdesk/general-getting-started.md` | `HalingoDoc/docs/full_documentation/general_getting_started.md` |
| `references/helpdesk/integrations.md` | `HalingoDoc/docs/full_documentation/integrations.md` |
| `references/helpdesk/invoicing-finances.md` | `HalingoDoc/docs/full_documentation/invoicing_finances.md` |
| `references/helpdesk/patient-management.md` | `HalingoDoc/docs/full_documentation/patient_management.md` |
| `references/helpdesk/settings-practice-management.md` | `HalingoDoc/docs/full_documentation/settings_practice_management.md` |

## From-source files

Verbatim mirror of `HalingoDoc/docs/from_source/`. Filename underscores preserved on per-feature files (so external links survive). Top-level files renamed to hyphenated for skill-style consistency.

| Skill file | Original |
|---|---|
| `references/from-source/README.md` | `HalingoDoc/docs/from_source/README.md` |
| `references/from-source/inventory.md` | `HalingoDoc/docs/from_source/inventory.md` |
| `references/from-source/scout-pass.md` | `HalingoDoc/docs/from_source/scout_pass.md` |
| `references/from-source/bugs-and-security.md` | `HalingoDoc/docs/from_source/bugs_and_security_findings.md` |
| `references/from-source/deprecation-list.md` | `HalingoDoc/docs/from_source/deprecation_list.md` |
| `references/from-source/open-questions.md` | `HalingoDoc/docs/from_source/open_questions.md` |
| `references/from-source/image-descriptions.md` | `HalingoDoc/docs/assets/image_descriptions.md` |
| `references/from-source/features/*.md` (51 files) | `HalingoDoc/docs/from_source/features/*.md` (verbatim, original filenames) |
| `references/from-source/gaps/*.md` (2 files) | `HalingoDoc/docs/from_source/gaps/*.md` (verbatim) |
| `references/from-source/technical/*.md` (7 files) | `HalingoDoc/docs/from_source/technical/*.md` (verbatim) |

## Functional files

| Skill file | Original |
|---|---|
| `references/functional/application-map.md` | `HalingoDoc/docs/functional/application_map.md` |
| `references/functional/user-stories.md` | `HalingoDoc/docs/functional/user_stories.md` |

## Files NOT bundled (intentional)

- `01-discovery/00-audit.md` — Nx-monorepo audit, not legacy product knowledge.
- `01-discovery/staging-screens/` — binary screenshot assets.
- `01-discovery/test-accounts-local.md` — operational secret.
- `HalingoDoc/docs/manual/`, `vision/`, `non-functional/`, `technical/README.md` — stub docs not yet populated.
- `HalingoDoc/docs/assets/<binary>` — image binaries; `image_descriptions.md` is included as the catalog.
- `02-specs/**/spec.md` — not copied (volatile / operational); see `specs-index.md` for the catalog.

## Verifying a single claim

If you need to verify a specific claim from this skill, the trace is:

1. The skill file references an area or feature.
2. That area's "Phase 1 discovery" section was copied from `01-discovery/<area>.md`.
3. The discovery file cites either:
   - A `from_source/features/<name>.md` page (which itself has `file:line` citations into `Halingo-Main`)
   - A line range in a `full_documentation/*.md` helpdesk article
   - A staging screenshot path
4. Follow the chain.
