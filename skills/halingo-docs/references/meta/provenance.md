# Provenance — where each piece of data came from

This skill bundles content from three independent sources. Every claim in this skill traces back to one of them.

## The three sources

### 1. Phase 1 discovery — `/home/tj/halingoMigration/01-discovery/`
**What it is:** 25 area discovery files + 25 verification files, written between 2026-04-08 and 2026-04-11 by the `halingo-discoverer`, `halingo-discovery-verifier`, and `halingo-staging-explorer` agents.

**What it contains:** for each area:
- Source 1: HalingoDoc audit (what the helpdesk + curated docs say about this area)
- Source 2: Meteor source slice (file:line citations into `Halingo-Main`)
- Source 3: Staging exploration (live screen walkthrough with screenshots)
- A feature catalog table
- Cross-references to other areas
- `[NEEDS CLARIFICATION]` and `[NEEDS DOMAIN REVIEW]` blocks
- Traceability list of files read

**How it's used in this skill:** every `references/areas/<area>.md` file copies in the discovery + verification verbatim under "Phase 1 discovery" and "Verification notes" sections.

**Mapping:**

| Discovery file | Lands in skill at |
|---|---|
| `01-discovery/00-audit.md` | Not copied (this is the Nx-monorepo audit, not legacy product knowledge); see `references/from-source/inventory.md` for the equivalent legacy inventory |
| `01-discovery/<area>.md` | `references/areas/<area>.md` § Phase 1 discovery |
| `01-discovery/<area>.verification.md` | `references/areas/<area>.md` § Verification notes |
| `01-discovery/staging-screens/` | Not copied (binary screenshots; viewable in the source repo) |
| `01-discovery/test-accounts-local.md` | Not copied (operational secret; see `06-prompts/SECRETS.md`) |

### 2. HalingoDoc — `/home/tj/HalingoDoc/docs/`
**What it is:** ~16,200-line documentation set assembled before Phase 1 from the Halingo Zendesk helpdesk dump + a code-read pass over `Halingo-Main`. Three layers per its own `from_source/README.md`:

- Layer 1 — `full_documentation/` — the Zendesk scrape (8 NL/FR articles, ~4,400 lines)
- Layer 2 — `manual/`, `functional/`, `glossary.md`, `coverage_matrix.md` — curated/hand-written
- Layer 3 — `from_source/` — code-derived (51 feature files + 2 gap files + 7 technical reference files)

**How it's used in this skill:**

| HalingoDoc path | Lands in skill at |
|---|---|
| `glossary.md` | `references/02-glossary.md` (verbatim) |
| `coverage_matrix.md` | `references/03-coverage-matrix.md` (verbatim) |
| `functional/application_map.md` | `references/01-application-map.md` (verbatim) and `references/functional/application-map.md` (verbatim) |
| `functional/user_stories.md` | `references/functional/user-stories.md` (verbatim) |
| `from_source/README.md, inventory.md, scout_pass.md, bugs_and_security_findings.md, deprecation_list.md, open_questions.md` | `references/from-source/{README,inventory,scout-pass,bugs-and-security,deprecation-list,open-questions}.md` (verbatim, with hyphenated filenames) |
| `from_source/features/*.md` (51 files) | `references/from-source/features/*.md` (verbatim, original underscored filenames preserved) |
| `from_source/gaps/*.md` (2 files) | `references/from-source/gaps/*.md` (verbatim) |
| `from_source/technical/*.md` (7 files) | `references/from-source/technical/*.md` (verbatim) |
| `full_documentation/*.md` (8 files) | `references/helpdesk/*.md` (verbatim, with hyphenated filenames) |
| `assets/image_descriptions.md` | `references/from-source/image-descriptions.md` (verbatim) |
| `assets/<binary>` (image files) | Not copied (binaries; viewable in the source repo) |
| `manual/`, `vision/`, `non-functional/`, `technical/README.md` | Not copied (out-of-scope for this skill — they're stub product/vision docs) |

### 3. Per-feature spec contracts — `/home/tj/halingoMigration/02-specs/`
**What it is:** 105 Phase 2 spec.md files written by `halingo-spec-author` after each Phase 1 area was verified. Each spec is Spec Kit-shaped with embedded Gherkin scenarios, `QUIRK-PRESERVE` items, and resolved `[NEEDS CLARIFICATION]` blocks.

**How it's used in this skill:** specs are NOT copied in (they live in the migration workspace and are too operational/volatile). The skill provides indexes:

- `references/specs-index.md` — all 105 specs grouped by area with one-line summaries
- `references/00-feature-index.md` — alphabetical merge of spec features + from-source features
- `references/areas/<area>.md` § "Spec contracts (Phase 2)" — per-area spec list

Every spec entry in the skill cites the absolute path; jump to that file for the contract text.

## Indirect / synthesized files

| Skill file | Built from | How |
|---|---|---|
| `SKILL.md` | This entire bundle | Hand-authored navigation |
| `references/00-feature-index.md` | All spec.md + from-source/features/*.md | Python script reads first H1 + first paragraph |
| `references/specs-index.md` | All spec.md | Python script reads first H1 + first paragraph |
| `references/areas/<area>.md` | Discovery + verification + spec list | Bash + python build script |
| `references/areas/shared.md` | shared/ specs + from-source pointers | Hand-authored |
| `references/meta/provenance.md` | (this file) | Hand-authored |
| `references/meta/how-to-query.md` | Query patterns observation | Hand-authored |
| `references/meta/source-paths.md` | Cross-walk of skill → source | Hand-authored |

## Authority order when sources disagree

1. **The spec is the contract** (AGENTS.md rule #2). If a spec says X, the new code must do X regardless of what the legacy does or what the helpdesk says.
2. For *legacy* questions (what does Meteor actually do today), `from_source/` (Layer 3 code-derived) is more authoritative than `full_documentation/` (Zendesk Layer 1) when they disagree. The `coverage_matrix.md` § "Phantoms" table lists the known disagreements.
3. For Belgian regulatory questions (RIZIV, GDPR, eHealth), defer to the `logopedist-be` skill — it is primary-sourced and dated.
4. For staging behavior, the staging-screens directory + the most recent verification file is authoritative; the first-pass discovery may be stale if staging changed.

## Dates of the source data

- HalingoDoc helpdesk import: ~2026-04-06
- HalingoDoc code-read (`from_source/`): 2026-04-07
- Phase 1 discovery files: 2026-04-08 to 2026-04-11
- Phase 1 verification files: 2026-04-10 to 2026-04-12
- Phase 2 specs: 2026-04-10 to 2026-04-13

If you find a fresher version of any of these in `/home/tj/halingoMigration/` or `/home/tj/HalingoDoc/`, the original is authoritative — this skill should be rebuilt.
