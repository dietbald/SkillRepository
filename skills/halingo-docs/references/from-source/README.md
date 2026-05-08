# From Source — code-derived documentation

> **Provenance warning.** Everything in this folder was extracted by reading the **production source code** at `/home/tj/Repos/Halingo-Main` (Meteor + React + MongoDB), not the Zendesk helpdesk export in `../full_documentation/`. Do not merge content from this folder into `../manual/` without first verifying the behaviour against the running application — the code is authoritative for *what exists*, but not always for *how it is intended to be used*.

## Why this folder exists

`docs/full_documentation/` (the Zendesk helpdesk import) covers roughly 40% of the live SaaS. The product has grown well beyond what the helpdesk articles describe. To close that gap without polluting the curated `manual/` tree with un-validated content, code-derived documentation lives here in its own layer.

This is the **third layer** in the repo:

| Layer | Folder | Source | Editable? |
|---|---|---|---|
| 1. Helpdesk source | `../full_documentation/` | Zendesk scrape | No — re-importable, leave as-is |
| 2. Curated manual | `../manual/`, `../functional/`, etc. | Hand-written | Yes — authoritative |
| 3. **Code-derived** | **`./` (this folder)** | **Halingo-Main repo** | **Yes — but mark provenance** |

## Layout

```
from_source/
├── README.md           ← this file
├── inventory.md        ← master cross-reference: feature → source file → coverage status
├── features/           ← net-new features not present in any helpdesk article
├── gaps/               ← documentation for the "Not covered" entries in coverage_matrix.md, filled from code
└── technical/          ← code-level reference: collections, methods, routes, migrations
```

### `features/`
One Markdown file per discrete user-facing feature that the helpdesk does not mention at all. Examples discovered so far: in-app newsfeed, todos, in-app notification centre, practice chat thread store, earnings graph.

### `gaps/`
One Markdown file per "Not covered" entry in `../coverage_matrix.md`, named to match the functional grouping number, e.g. `03_patient_data_privacy.md`, `19_practice_analytics.md`. These are first-pass attempts at filling gaps from code observation; they need product validation before promotion to `manual/`.

### `technical/`
Code-level reference material that does not belong in the user manual: list of MongoDB collections and their fields, registered Meteor methods and publications, FlowRouter routes, the migrations history (which doubles as a feature timeline).

## Conventions

- **Always cite the source.** Every claim links to a file path in the Halingo-Main repo, ideally with a line number, like `app/imports/api/newsfeed/server/methods.js:42`.
- **Mark uncertainty.** Where the code shows a feature exists but the intended UX is unclear, write `> ⚠️ Behaviour inferred from code; needs product validation.` Do not invent intent.
- **Preserve domain language.** RIZIV / De Conventie / Verzamelstaat / Praktijkverantwoordelijke etc. stay in Dutch (or French where the code is French). See `../glossary.md`.
- **Heading style.** Sentence-case, matching the curated `manual/` layer (not the title-case of `full_documentation/`).
- **Do not re-translate.** If a code string or comment is in Dutch or French, quote it as-is.

## How this folder was built

1. A **scout pass** Explore agent indexed every file under `app/imports/api/`, `app/imports/modules/`, `app/imports/ui/pages/`, `app/imports/migrations/`, `app/lib/collections/`, and the i18n resources, producing the master list in `inventory.md`.
2. **Per-area deep-dive agents** then expanded each entry into a feature file under `features/` or `gaps/`, citing source files.
3. Findings were back-fed into `../coverage_matrix.md` so the gap list there reflects what is actually missing from the docs *and* the codebase, separately.

## Cross-references

- [`../coverage_matrix.md`](../coverage_matrix.md) — what the helpdesk covers and where the gaps are.
- [`../functional/application_map.md`](../functional/application_map.md) — the 20 functional groupings (stable taxonomy).
- [`../glossary.md`](../glossary.md) — Belgian healthcare terminology.
- [`../manual/README.md`](../manual/README.md) — the index for the curated end-user manual.
