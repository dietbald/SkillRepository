# Client-side Error Logging

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Browser-side error capture and aggregation.

## Spec contracts (Phase 2)

_(No spec.md files in 02-specs/client-side-error-logging — area may be cross-cutting; see specs-index.md.)_

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/client-side-error-logging.md`)

# Discovery: Client-Side Error Logging

**Area:** #25 Client-Side Error Logging (net-new concept #12 from `coverage_matrix.md` -- not one of the 20 core competencies, but a cross-cutting infrastructure concern discovered during the code-read pass)

**Scope in one breath:** a write-only error-reporting mechanism where JavaScript exceptions caught on the client (via a React `ErrorBoundary` or scattered `try/catch` blocks) are sent to the server through the Meteor method `errors.client.log` and inserted into the `clientErrors` MongoDB collection, attributed to the logged-in user. There is no read path, no admin UI, no aggregation, no retention policy, no alerting. Operators inspect errors via direct MongoDB shell access.

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent handling all three sources in one session.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what is in `Halingo-MonoRepo/`, `libs/backend/*`, or any Nx-side symbol.

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Code-derived | `from_source/features/client_error_logging.md` | 162 | full | Complete feature doc: data model, method implementation, 8 call sites, bug notes, PII risk, no retention/rate-limiting/alerting |
| Code-derived | `from_source/bugs_and_security_findings.md` | ~158 | ctrl-F "clientErrors" | Item: "`clientErrors.createdAt` field bug -- field/index mismatch" |
| Code-derived | `from_source/deprecation_list.md` | ~184 | ctrl-F "clientErrors", "error" | No deprecation entries touch this area |
| Code-derived | `from_source/open_questions.md` | ~158 | ctrl-F "clientErrors", "error" | No open questions touch this area |
| Code-derived | `from_source/inventory.md` | ~371 | Net-new concept #17 row | Confirms: "Write-only, `createdAt` field bug" |
| Code-derived | `from_source/scout_pass.md` | first 100 lines | Section 2 `clientErrors` row | "Client-side exception logging -- capture, stack trace, user attribution, server aggregation" |
| Code-derived | `from_source/technical/collections.md` | 25 lines around line 47 | `ClientErrors` section | Schema fields, indexes: none, hooks: none |
| Code-derived | `from_source/technical/methods.md` | 15 lines around line 33 | `errors.client.log` row | Method signature, parameter shape, `unblock()` |
| Curated | `functional/application_map.md` | -- | searched for "error" | Not listed among the 20 competencies |
| Curated | `functional/user_stories.md` | -- | searched for "error", "logging", "crash", "debug" | No user stories for this area |
| Helpdesk | (all 8 files) | -- | ctrl-F "error" | No helpdesk file mentions client-side error logging |
| Cross-cutting | `coverage_matrix.md` | -- | Net-new concept #12 row | "Client-side error logging to a `clientErrors` collection" |

### What HalingoDoc covers for this area

HalingoDoc's code-derived layer (`from_source/features/client_error_logging.md`) provides **excellent** coverage -- 162 lines documenting the full data model, the single Meteor method, all 8 call sites with file:line citations, the `createdAt` omission bug, the PII risk in `params`, and the notable absences (no retention, no rate limit, no alerting, no admin UI). The bugs-and-security-findings file confirms the `createdAt` field/index mismatch. The technical reference files provide the schema and method signatures.

The helpdesk layer and curated functional docs have zero coverage, which is expected -- this is pure infrastructure invisible to end users.

### What HalingoDoc does NOT cover for this area

- The `Collection` base class auto-`createdAt` behavior at `api/collection.js:14` (`doc.createdAt = doc.createdAt || new Date()`) -- this means `createdAt` IS populated on insert despite the method not setting it. HalingoDoc's bug note ("the insert never populates it") is technically wrong about the _symptom_ (the field IS filled), though the omission from the method is real. The bugs-and-security-findings reference to a "field/index mismatch" is a separate claim that needs verification.
- The exact mounting points of `ErrorBoundary` in the layout hierarchy (3 layouts: `AppLayout`, `EmptyLayout`, `AuthenticationLayout` -- with `AppLayout` using nested `ErrorBoundary` wrappers at two levels).
- Whether SimpleSchema validation on `ClientErrors.attachSchema()` allows the insert to succeed despite the method not explicitly setting `createdAt` (the base `Collection` class fills it before Meteor's insert validation runs, so the insert succeeds).

### Direct citations worth preserving

> From `from_source/features/client_error_logging.md:127-128`:
>
> > `params` can contain **anything**, including React props -- which may include patient PII (names, file ids, etc.). No scrubbing is performed server-side.

> From `from_source/features/client_error_logging.md:140-141`:
>
> > **No retention policy, no TTL index.** The `clientErrors` collection grows forever. There is no maintenance migration or scheduled cleanup.

> From `from_source/features/client_error_logging.md:99`:
>
> > The `ErrorBoundary` is the only *blanket* catcher -- it is mounted near the app root and captures any uncaught render error from a child component. The other call sites are scattered and inconsistent; there is no global `window.onerror`, no `unhandledrejection` listener, no Meteor connection-error hook.

---

## Source 2 -- Meteor source slice

### Files read (14 total, excluding `code_export.txt` which is dead code)

- `app/imports/api/clientErrors/` (3 files)
  - `clientErrors.jsx` -- `ClientErrors` collection + SimpleSchema (5 fields: `createdAt`, `error`, `name`, `params`, `userId`); deny-all client-side insert/update/remove; `attachSchema()` call for server-side validation
  - `methods.js` -- `logClientError` `LoggedInValidatedMethod`, name `errors.client.log`; validates `{error, name, params}` (omits `createdAt` and `userId`); server-only insert with `this.unblock()`
  - `server/index.js` -- single line: `import '../methods'`; wires the method into the server-side Meteor runtime
- `app/imports/api/collection.js` (1 file) -- custom `Collection` base class; **key finding**: line 14 auto-sets `doc.createdAt = doc.createdAt || new Date()` on every insert. This means `createdAt` IS populated despite the method not setting it explicitly.
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx` (1 file) -- base class that (a) requires `this.userId` (logged-in check) and (b) wraps execution with `MethodLogger` error capture (writes to `method-logs` on error only)
- `app/imports/ui/components/error-boundary/ErrorBoundary.jsx` (1 file) -- React class component with `componentDidCatch`; calls `logClientError.call({error, name: "Error boundary", params: info || {}})` and renders a localized fallback title (`errorBoundary.title`)
- `app/imports/ui/layouts/AppLayout.jsx` (1 file, partial read lines 90-184) -- mounts `<ErrorBoundary>` at TWO nesting levels: outer (wraps entire theme+app shell) and inner (wraps the page content area inside the menu/scrollbar structure)
- `app/imports/ui/layouts/EmptyLayout.jsx` (1 file) -- mounts `<ErrorBoundary>` wrapping `this.props.main`
- `app/imports/modules/authentication/AuthenticationLayout.jsx` (1 file, partial read lines 240-264) -- mounts `<ErrorBoundary>` wrapping the authentication page content
- `app/imports/ui/pages/users/profile-page/ProfilePage.jsx` (1 file, lines 1-170) -- TWO `logClientError` call sites at lines 120 and 149: `ProfilePageUserInformation.update` and `ProfilePageUserInformation.updateSettings`; passes `{...this.props, ...values}` as params (PII risk)
- `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx` (1 file) -- ONE call site at line 72: `ProfilePageUserInformation.changeEmail`; passes `{...this.props, ...values}` (includes email + password in `params` -- credential leak into error log)
- `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx` (1 file, lines 185-209) -- ONE call site at line 196: `PatientFileProfileInformation.update`; passes a `_.pick` subset of form values (slightly more controlled than other sites)
- `app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx` (1 file, lines 160-184) -- ONE call site at line 172: `TreatmentPanel.update`; passes `{...this.props, ...this.formGroup.getValue()}`
- `app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx` (1 file, lines 80-104) -- ONE call site at line 93: `BilanPanel.update`; passes `{...this.props, ...this.formGroup.getValue()}`
- `app/imports/startup/server/registerApi.js` (1 file) -- line 1 imports `../../api/clientErrors/server/`, confirming the method is registered on server startup

### Key symbols per file

- `api/clientErrors/clientErrors.jsx:4` -- `ClientErrors` = `new Collection("clientErrors")` (extends custom base class)
- `api/clientErrors/clientErrors.jsx:6-10` -- deny-all rules: `insert`, `update`, `remove` all return `true` (blocked)
- `api/clientErrors/clientErrors.jsx:12-18` -- schema: `{createdAt: Date, error: Object blackbox, name: String, params: Object blackbox, userId: String RegEx.Id}`
- `api/clientErrors/clientErrors.jsx:20` -- `ClientErrors.attachSchema(ClientErrors.schema)` -- server-side schema validation on insert
- `api/clientErrors/methods.js:4-19` -- `logClientError` method named `errors.client.log`
- `api/clientErrors/methods.js:6-8` -- validation: `ClientErrors.schema.omit('createdAt', 'userId').validator()` -- client sends `{error, name, params}` only
- `api/clientErrors/methods.js:11` -- `this.unblock()` -- non-blocking so error logging doesn't slow the user
- `api/clientErrors/methods.js:13-16` -- server-side insert: `{...params, userId: this.userId}` -- NO `createdAt` set here (but `Collection.insert` fills it at `api/collection.js:14`)
- `api/collection.js:14` -- `doc.createdAt = doc.createdAt || new Date()` -- the auto-fill that resolves the apparent `createdAt` bug
- `ui/components/error-boundary/ErrorBoundary.jsx:12-21` -- `componentDidCatch(error, info)` -> `logClientError.call(...)` + `setState({hasError: true})`
- `ui/components/error-boundary/ErrorBoundary.jsx:24-29` -- fallback UI: `<Text resources='errorBoundary.title' component='h1'/>`
- `ui/layouts/AppLayout.jsx:99` -- outer `<ErrorBoundary>` wrapping full app shell
- `ui/layouts/AppLayout.jsx:122-173` -- inner `<ErrorBoundary>` wrapping page content only (nested inside the outer one)
- `ui/layouts/EmptyLayout.jsx:23-25` -- `<ErrorBoundary>` wrapping the main content
- `modules/authentication/AuthenticationLayout.jsx:248-258` -- `<ErrorBoundary>` wrapping auth page content

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust | Impact |
|---|---|---|---|---|---|
| 1 | `createdAt` omission severity | `from_source/features/client_error_logging.md:41`: "Not set by the method -- the field is required but the insert never populates it" and the bug note "Inserts should in principle fail SimpleSchema validation" | `api/collection.js:14`: the custom `Collection` base class auto-fills `createdAt = new Date()` on every insert before schema validation runs. The field IS populated. | Source -- the base class behavior was missed during the doc pass | HalingoDoc overstates the bug. `createdAt` IS set; the method just doesn't set it directly. The insert succeeds and the timestamp is accurate. |
| 2 | `bugs_and_security_findings.md` says "field/index mismatch" | "clientErrors.createdAt field/index mismatch" | No index on `clientErrors` at all (confirmed by `technical/collections.md:63`: "Indexes: none"). The mismatch claim is inaccurate -- there is no index to mismatch with. The actual issue is simply "no index exists." | Source | The bugs doc may be conflating two issues. The real bug is the absence of any index, not a mismatch. |
| 3 | Call site count | `from_source/features/client_error_logging.md` says "eight call sites" | Grep of non-`code_export.txt` files finds **7 distinct `logClientError.call(...)` invocations** across 6 files (ErrorBoundary x1, ProfilePage x2, ChangeEmailModal x1, PatientFileProfileInformation x1, TreatmentPanel x1, BilanPanel x1) | Source | Minor discrepancy. HalingoDoc may have counted a file twice or included `code_export.txt`. The practical count is 7 call sites in 6 files. |
| 4 | ErrorBoundary mounting | `from_source/features/client_error_logging.md` says "mounted near the app root" | `AppLayout.jsx` mounts TWO nested `ErrorBoundary` components: outer (line 99, wraps entire app shell) and inner (line 122, wraps page content). `EmptyLayout.jsx` and `AuthenticationLayout.jsx` each add their own. Total: 4 `ErrorBoundary` instances across 3 layouts. | Source | HalingoDoc understates the coverage. The nested pattern means the inner boundary catches content-area crashes while the outer catches shell-level crashes (menu, sidebar, etc.). |
| 5 | PII severity -- ChangeEmailModal | Not called out specifically | `ChangeEmailModal.jsx:72-79` passes `{...this.props, ...values}` as `params`, where `values` includes the new email AND the password field. This is worse than patient PII -- it's a **credential leak** into the error log. | Source | HalingoDoc mentions PII risk generically but does not flag the password-in-error-log case. |

---

## Source 3 -- Staging exploration

**N/A -- no user-visible UI.** This is a pure infrastructure mechanism with no admin dashboard, no error-list page, no notification center integration. The `ErrorBoundary` fallback UI (a localized "Something went wrong" title) is the only user-visible artifact, and it does not tell the user that the error was reported.

There is no staging walk to perform for this area. The feature operates entirely as a silent background write to MongoDB, readable only via direct database access.

---

## Features

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `client-error-logging/error-boundary-catch` | React ErrorBoundary catch-all error capture | docs + source | `ui/components/error-boundary/ErrorBoundary.jsx:12-21` | `from_source/features/client_error_logging.md:88` | N/A | Mounted in 3 layouts (4 instances); falls back to localized title |
| 2 | `client-error-logging/server-log-method` | Server-side `errors.client.log` method that inserts into `clientErrors` | docs + source | `api/clientErrors/methods.js:4-19` | `from_source/features/client_error_logging.md:52-73` | N/A | `LoggedInValidatedMethod`, `unblock()`, server-only insert |
| 3 | `client-error-logging/collection-schema` | `clientErrors` MongoDB collection schema and deny rules | docs + source | `api/clientErrors/clientErrors.jsx:1-20` | `from_source/features/client_error_logging.md:17-34`, `from_source/technical/collections.md:47-65` | N/A | 5 fields, deny-all client writes, no indexes, no TTL |
| 4 | `client-error-logging/scattered-try-catch` | Per-component try/catch call sites logging specific errors | docs + source | `ProfilePage.jsx:120,149`, `ChangeEmailModal.jsx:72`, `PatientFileProfileInformation.jsx:196`, `TreatmentPanel.jsx:172`, `BilanPanel.jsx:93` | `from_source/features/client_error_logging.md:88-98` | N/A | 6 scattered call sites with inconsistent `params` scrubbing; PII risk |

### Feature detail -- `client-error-logging/error-boundary-catch`

- **Description:** A React class component `ErrorBoundary` uses `componentDidCatch(error, info)` to catch any uncaught render error from its children. It sends the error and React's component-stack info to the server via `logClientError.call()`, then renders a fallback UI with a translated title (`errorBoundary.title`).
- **Found via:** docs + source
- **Legacy source file(s):** `app/imports/ui/components/error-boundary/ErrorBoundary.jsx:1-35`
- **HalingoDoc file(s):** `from_source/features/client_error_logging.md` lines 88-98 (call sites table), lines 115-124 (ErrorBoundary payload shape)
- **Staging screen(s):** N/A -- the fallback UI is only visible when a crash occurs
- **Belgian-specific concerns:** None
- **Deprecation status:** Not deprecated. Not in `deprecation_list.md`.
- **QUIRK-PRESERVE candidates:** The `error` parameter passed to `logClientError.call()` is the raw JS `Error` object. Meteor's EJSON serialization may strip non-standard fields, leaving only `name`, `message`, `stack`. This is technically a lossy serialization quirk but it is the intended behavior of the ErrorBoundary.
- **Open questions:** None

### Feature detail -- `client-error-logging/server-log-method`

- **Description:** The Meteor method `errors.client.log` validates incoming `{error, name, params}` against the `ClientErrors` schema (with `createdAt` and `userId` omitted from validation), calls `this.unblock()` to avoid blocking other DDP calls on the same connection, and inserts a document into the `clientErrors` collection with the server-side `this.userId` added. The `createdAt` field is auto-populated by the custom `Collection` base class at insert time.
- **Found via:** docs + source
- **Legacy source file(s):** `app/imports/api/clientErrors/methods.js:1-19`, `app/imports/api/collection.js:13-16`
- **HalingoDoc file(s):** `from_source/features/client_error_logging.md` lines 52-73, `from_source/technical/methods.md` line 34-38
- **Staging screen(s):** N/A
- **Belgian-specific concerns:** None
- **Deprecation status:** Not deprecated
- **QUIRK-PRESERVE candidates:**
  - Method requires a logged-in user (`LoggedInValidatedMethod`). Errors that occur BEFORE login (e.g., on the login page itself) cannot be captured because the user has no session. The `AuthenticationLayout.jsx` ErrorBoundary WILL catch render errors on the login page, but the `logClientError.call()` invocation will throw `errors.user.notLoggedIn` and silently fail. This is a coverage gap that exists by design (or by accident) in the legacy app.
  - `this.unblock()` is used so error logging does not delay the user's interactive operations. This is correct for a fire-and-forget mechanism.
- **Open questions:** None

### Feature detail -- `client-error-logging/collection-schema`

- **Description:** The `clientErrors` MongoDB collection stores error documents with 5 fields: `createdAt` (Date, auto-filled by `Collection.insert()`), `error` (blackbox Object -- serialized exception), `name` (String -- human-readable label for the catch site), `params` (blackbox Object -- arbitrary context data from the caller), and `userId` (String, Meteor Id format). Client-side writes are denied (insert/update/remove all return `true` in deny rules). No indexes exist. No TTL or retention policy.
- **Found via:** docs + source
- **Legacy source file(s):** `app/imports/api/clientErrors/clientErrors.jsx:1-20`
- **HalingoDoc file(s):** `from_source/features/client_error_logging.md` lines 17-34, `from_source/technical/collections.md` lines 47-65
- **Staging screen(s):** N/A
- **Belgian-specific concerns:** GDPR relevance -- `params` is blackbox and may contain patient PII or user credentials (see feature #4). No data-retention policy means this PII-tainted data persists indefinitely.
- **Deprecation status:** Not deprecated
- **QUIRK-PRESERVE candidates:** None
- **Open questions:** None

### Feature detail -- `client-error-logging/scattered-try-catch`

- **Description:** Six component files contain manual `try/catch` blocks that call `logClientError.call()` when specific form-editing operations fail. These are NOT blanket error catchers -- they wrap specific debounced form-update subscriptions or form-submission handlers. The `params` payloads vary by site: most pass `{...this.props, ...values}` (which includes all React props and current form values), while `PatientFileProfileInformation` uses `_.pick()` for a more targeted subset. The `ChangeEmailModal` site passes `values` that include the user's new email AND password fields.
- **Found via:** docs + source
- **Legacy source file(s):**
  - `app/imports/ui/pages/users/profile-page/ProfilePage.jsx:120` (name: `ProfilePageUserInformation.update`)
  - `app/imports/ui/pages/users/profile-page/ProfilePage.jsx:149` (name: `ProfilePageUserInformation.updateSettings`)
  - `app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx:72` (name: `ProfilePageUserInformation.changeEmail`)
  - `app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx:196` (name: `PatientFileProfileInformation.update`)
  - `app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx:172` (name: `TreatmentPanel.update`)
  - `app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx:93` (name: `BilanPanel.update`)
- **HalingoDoc file(s):** `from_source/features/client_error_logging.md` lines 88-98 (call sites table)
- **Staging screen(s):** N/A
- **Belgian-specific concerns:** Patient names, treatment data, and RIZIV-related bilan information may leak into the `clientErrors` collection via the blackbox `params` field. Under GDPR, this constitutes unintentional health-data processing without a lawful basis.
- **Deprecation status:** Not deprecated
- **QUIRK-PRESERVE candidates:**
  - The inconsistent scrubbing (most sites pass `{...this.props, ...values}`, one uses `_.pick()`) is clearly unintentional variation, not deliberate behavior. NOT a quirk to preserve.
  - The `ChangeEmailModal` passing password in `params` is a **credential leak** that should NOT be preserved.
- **Open questions:** None

**4 features in this area.** All found via docs + source. HalingoDoc's `from_source/features/client_error_logging.md` covered all 4 features at a high level, though source reading refined the ErrorBoundary mounting topology, corrected the `createdAt` bug severity, and identified the password-leak risk at `ChangeEmailModal`.

---

## Cross-references to other areas

- **#1 Identity Management:** The `logClientError` method extends `LoggedInValidatedMethod`, which means it shares the authentication infrastructure (JWT/session). Errors occurring before login (on the authentication layout's ErrorBoundary) silently fail because no `userId` is available. Also, the `ChangeEmailModal` and `ProfilePage` call sites are identity-area components.
- **#3 Patient Data Privacy (GDPR):** The `params` blackbox field in `clientErrors` may contain patient PII (names, national IDs) and user credentials (email + password from `ChangeEmailModal`). The collection has no retention policy and no TTL index. This is a GDPR concern that intersects with the patient data privacy gap documented in `from_source/gaps/03_patient_data_privacy.md`.
- **#6 Treatment Planning:** Two call sites (`TreatmentPanel.jsx:172`, `BilanPanel.jsx:93`) are in treatment-editing components. Error params include treatment and bilan form values.
- **#3 Patient Data Privacy / Patient Files:** The `PatientFileProfileInformation.jsx:196` call site is in the patient-file editing flow. Error params may include patient demographic data.

---

## [NEEDS CLARIFICATION]

### Q1: Is the `clientErrors` collection consulted by operators regularly, or is it purely passive?
- **Why it matters:** Determines whether to invest in an admin UI or aggregation tooling in the new app, or whether a simpler approach (e.g., structured logging to CloudWatch or a third-party error tracker like Sentry) would be more appropriate.
- **Sources conflict?** No -- all sources agree it is write-only with no read path. But neither source confirms whether operators actually query it via MongoDB shell.
- **What would resolve:** Product owner answer.

### Q2: Should the password-in-error-log leak at `ChangeEmailModal.jsx:72` be treated as a QUIRK-PRESERVE or a bug fix?
- **Why it matters:** The `params` object at this call site includes `values` which contains the user's password. If preserved in the new app's error logging, this would be a GDPR / security issue. If treated as a bug, the Phase 2 spec should mandate params scrubbing.
- **Sources conflict?** No -- all sources agree the password is passed. HalingoDoc does not call it out specifically.
- **What would resolve:** Product owner answer confirming this is a bug, not intentional.

### Q3: Should pre-login errors (ErrorBoundary catches on the authentication layout) be captured in the new app?
- **Why it matters:** The legacy app's `LoggedInValidatedMethod` requirement means errors on the login/register/forgot-password pages silently fail to log because no user is authenticated. This is a coverage gap. The new app could either (a) replicate the gap, (b) allow anonymous error logging, or (c) use a different mechanism (structured logging, Sentry) for pre-login errors.
- **Sources conflict?** No.
- **What would resolve:** Product owner + architect decision.

---

## [NEEDS DOMAIN REVIEW]

(Empty -- this area is pure infrastructure with no Belgian healthcare regulation touchpoints.)

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md (searched for "error")
/home/tj/HalingoDoc/docs/functional/user_stories.md (searched for "error", "logging", "crash", "debug")
/home/tj/HalingoDoc/docs/from_source/features/client_error_logging.md (full)
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F "clientErrors")
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (ctrl-F "clientErrors", "error")
/home/tj/HalingoDoc/docs/from_source/open_questions.md (ctrl-F "clientErrors", "error")
/home/tj/HalingoDoc/docs/from_source/inventory.md (net-new concept #17 row)
/home/tj/HalingoDoc/docs/from_source/scout_pass.md (section 2 clientErrors row)
/home/tj/HalingoDoc/docs/from_source/technical/collections.md (ClientErrors section, lines 47-65)
/home/tj/HalingoDoc/docs/from_source/technical/methods.md (errors.client.log row, lines 33-38)
/home/tj/HalingoDoc/docs/full_documentation/ (all 8 files ctrl-F "error" -- no matches)

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/clientErrors/clientErrors.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/clientErrors/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/clientErrors/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/api/collection.js
/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/LoggedInValidatedMethod.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/components/error-boundary/ErrorBoundary.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/layouts/AppLayout.jsx (partial: lines 90-184)
/home/tj/Repos/Halingo-Main/app/imports/ui/layouts/EmptyLayout.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/authentication/AuthenticationLayout.jsx (partial: lines 240-264)
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/ProfilePage.jsx (lines 1-170)
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/users/profile-page/email-validation/ChangeEmailModal.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/profile/PatientFileProfileInformation.jsx (lines 185-209)
/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/treatments/treatment-panel/TreatmentPanel.jsx (lines 160-184)
/home/tj/Repos/Halingo-Main/app/imports/modules/patientfiles/treatments/treatment-panel/BilanPanel.jsx (lines 80-104)
/home/tj/Repos/Halingo-Main/app/imports/startup/server/registerApi.js

# Staging (source 3)
N/A -- no user-visible UI
```

---

## Verification notes (verbatim from `01-discovery/client-side-error-logging.verification.md`)

# Verification: Client-Side Error Logging

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/client-side-error-logging.md`
- **Verdict:** PASS WITH NOTES

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Quote: "`params` can contain anything, including React props — which may include patient PII..." | `client_error_logging.md:127-128` | ✓ | Exact text confirmed at lines 126-127. One-line offset; content accurate. |
| 2 | Quote: "No retention policy, no TTL index. The `clientErrors` collection grows forever..." | `client_error_logging.md:140-141` | ✓ | Exact text confirmed at lines 140-141. |
| 3 | Quote: "The `ErrorBoundary` is the only *blanket* catcher..." | `client_error_logging.md:99` | ✓ | Exact text confirmed at line 99. |
| 4 | HalingoDoc says "eight call sites" | `client_error_logging.md:88` | ~ | HalingoDoc table shows 5 named rows then ellipsis. Discovery correctly finds 7 distinct invocations across 6 files. HalingoDoc is the imprecise party. |
| 5 | `bugs_and_security_findings.md` "field/index mismatch" for `createdAt` | `bugs_and_security_findings.md:88-91` | ~ | Bugs file contains TWO errors: (a) no index exists (`technical/collections.md` confirms "Indexes: none"); (b) says "`createdAt` is set client-side" — actually set server-side by `Collection` base class. Discovery caught error (a) but not (b). |
| 6 | `inventory.md` lists as "net-new concept #17" | `inventory.md` | ✓ | Confirmed as row #17 in inventory.md. |
| 7 | Header says "net-new concept #12 from `coverage_matrix.md`" | `coverage_matrix.md` | ✓ | Confirmed as item #12. Two different numbers (#12 in coverage_matrix, #17 in inventory) from different lists; both internally correct. |
| 8 | `technical/collections.md` ClientErrors section | `technical/collections.md:47-65` | ✓ | Confirmed. 5 fields, "Indexes: none", "Hooks: none." |
| 9 | `technical/methods.md` `errors.client.log` row | `technical/methods.md:34-38` | ✓ | Row at lines 36-38 (section header at 34). One-line offset; content accurate. |
| 10 | `deprecation_list.md` has no entries touching `clientErrors` | `deprecation_list.md` | ✓ | Confirmed. No deprecation entry references clientErrors. |

## Material omissions

1. **Rate-limiting absence not captured.** `client_error_logging.md:142` explicitly states: "**No rate limiting.** A misbehaving client could spam the method with thousands of calls; nothing throttles `errors.client.log`." The discovery omits this from all four feature descriptions. The Phase 2 spec author must decide whether the new app implements per-user rate limiting on the error-logging endpoint.

No other material omissions found. The discovery's coverage is otherwise comprehensive.

## Cross-area reference check

| Cross-reference | Verified? | Finding |
|---|---|---|
| #1 Identity Management — `LoggedInValidatedMethod` auth sharing | ✓ | Confirmed. Pre-login errors silently fail. `identity.md` discovery exists. |
| #3 Patient Data Privacy (GDPR) — `params` blackbox PII storage | ✓ | Confirmed. `patient-data-privacy.md` exists. PII risk and GDPR connection sound. ChangeEmailModal credential leak verified. |
| #6 Treatment Planning — TreatmentPanel and BilanPanel call sites | ✓ | Confirmed. Both files call `logClientError.call()` with treatment/bilan form data. `treatment-planning.md` exists. |
| "#3 Patient Data Privacy / Patient Files" — PatientFileProfileInformation call site | ~ | Imprecise labeling: "Patient Files" is not a separately numbered area. The substantive cross-reference to patient-data-privacy is correct. |

## Domain review (logopedist-be)

**The empty NEEDS DOMAIN REVIEW is correct.**

The 30-year retention obligation under art. 35 Kwaliteitswet applies to the *patientendossier* (prescriptions, bilans, session notes, INSZ identifiers) — not to infrastructure error logs. The `clientErrors` collection is not part of the statutory patient file. GDPR Art. 5(1)(c) data minimization and Art. 5(1)(e) storage limitation apply as general GDPR requirements but do not invoke Belgian healthcare-specific regulation (RIZIV, INAMI, eHealth, eAttest, Kwaliteitswet).

**One nuance the discovery does not raise:** if `clientErrors` stores patient names, INSZ numbers, or bilan data in `params` indefinitely, this creates a shadow patient-data store outside the 30-year retention scope. The patient could request erasure of the error logs under GDPR Art. 17 (the Art. 17(3)(b)/(c) carve-out covers the official patient file but NOT infrastructure error logs). This interaction warrants a CLARIFY for Phase 2.

## Escalated source checks (Step C)

| # | Claim | Source file | Verified? | Finding |
|---|---|---|---|---|
| 1 | Schema has 5 fields: `createdAt`, `error`, `name`, `params`, `userId` | `clientErrors.jsx:12-18` | ✓ | Exact match. Types correct. `attachSchema` at line 20. |
| 2 | `this.unblock()` in the method | `methods.js:11` | ✓ | At line 12 (inside `if(!this.isSimulation)` at line 11). Off by one; content accurate. |
| 3 | Auto-`createdAt` at `api/collection.js:14` | `collection.js:14` | ✓ | `doc.createdAt = doc.createdAt || new Date()` — exact match. |
| 4 | `componentDidCatch` calls `logClientError.call()` | `ErrorBoundary.jsx:12-21` | ✓ | `componentDidCatch` at line 12; `logClientError.call(...)` at lines 16-20. Exact match. |
| 5 | ChangeEmailModal credential leak at line 72 | `ChangeEmailModal.jsx:72` | ✓ | `params: {...this.props, ...values}` with email + password in `values`. Credential leak confirmed. |

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-csel-01 | NOTE | citation | `bugs_and_security_findings.md` bug description contains a second inaccuracy beyond what discovery documents: says "`createdAt` is set client-side" — actually set server-side by `Collection` base class. Discovery only caught the "no index to mismatch" part. | Record for Phase 2 spec. The correct statement: `createdAt` is auto-set server-side at `api/collection.js:14`; no index exists. |
| V-csel-02 | NOTE | omission | Rate-limiting absence not captured. `client_error_logging.md:142` explicitly notes "No rate limiting." Discovery omits this from all four features. | Add to NEEDS CLARIFICATION backlog for Phase 2: spec author must decide on rate limiting for the error-logging endpoint. |
| V-csel-03 | NOTE | citation | Line-number offsets: quote #1 is at lines 126-127 (not 127-128); `this.unblock()` is at line 12 (not 11). Both off by one. Content accurate. | No impact on Phase 2. |
| V-csel-04 | NOTE | cross-area | Second "#3" cross-reference label conflates "Patient Data Privacy" and "Patient Files" which is not a separately numbered area. | Imprecision only. Substantive cross-reference is correct. |
| V-csel-05 | CLARIFY | domain | GDPR retention interaction: `clientErrors` is not part of the statutory patient file and is subject to GDPR Art. 17 erasure requests. If the new app implements error logging, the controller must either (a) scrub PHI/credentials from `params`, or (b) define a retention/deletion schedule for the error log. Absent from the discovery's NEEDS CLARIFICATION list. | Add to Phase 2 NEEDS CLARIFICATION: params-scrubbing strategy and error-log retention period. |

## Recommendation

**PROCEED to Phase 2 spec authoring for Client-Side Error Logging.**

No BLOCKER findings. The discovery is accurate, well-sourced, and the five discrepancies it documents vs HalingoDoc are genuine findings (not errors in the discovery itself). All escalated source checks confirmed.

The Phase 2 spec author should be aware of:
1. The rate-limiting absence (V-csel-02) — decision needed on whether the new app throttles the error endpoint
2. The GDPR retention interaction (V-csel-05) — decision needed on params-scrubbing and error-log retention period
3. Q2 from discovery (ChangeEmailModal credential leak) — confirmed as real; spec must mandate scrubbing
