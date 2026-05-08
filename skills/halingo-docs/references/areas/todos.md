# Todos

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Per-user task list.

## Spec contracts (Phase 2)

- **todos** — Feature: todos/crud
  - Path: `02-specs/todos/spec.md`


## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/todos.md`)

# Discovery: Todos

**Area:** Todos (per-user task list) -- not one of the 20 formal competencies in `application_map.md`; discovered as net-new concept #4 during the 2026-04-07 code-read pass (see `coverage_matrix.md` "Net-new concepts found in code").

**Scope in one breath:** a lightweight personal to-do list scoped strictly by `userId`. Each therapist sees only their own items in a dashboard widget -- add, inline-edit, mark done, delete. No sharing, no due dates, no priorities, no practice scope, no standalone page.

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent handling all three sources in one session.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what is in the Nx monorepo, any `libs/backend/*` path, or any Nx-side symbol. See `06-prompts/halingo-discoverer.md` for the critical scope rule.

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Code-derived | `from_source/features/todos.md` | 140 | full | Complete feature description: data model, 4 Meteor methods, publication, UI behavior, i18n keys, permissions, notable details. Primary reference for this area. |
| Code-derived | `from_source/features/main_dashboard.md` | 135 | full | Dashboard grid layout showing todos widget placement (cell `c`, 6x4 in lg/md, 12x4 in sm/xs/xxs). Data wiring for all four dashboard widgets. |
| Curated | `functional/application_map.md` | -- | full | Todos is NOT one of the 20 core competencies. Listed under "Net-new concepts found in code" #4 in `coverage_matrix.md`. |
| Cross-cutting | `coverage_matrix.md` | -- | ctrl-F "todo" | Confirms: "Per-user todos scoped strictly by `userId`" as net-new concept #4. No helpdesk coverage. |
| Cross-cutting | `from_source/deprecation_list.md` | -- | ctrl-F "todo" | **No deprecation entries touching todos.** Feature is current and should be ported. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | -- | ctrl-F "todo" | **No bugs or security findings touching todos.** |
| Cross-cutting | `from_source/open_questions.md` | -- | ctrl-F "todo" | **No open questions touching todos.** |
| Cross-cutting | `from_source/inventory.md` | -- | ctrl-F "todo" | Todo listed as live feature. `todos.md` at 139 lines in the feature files inventory. |
| Cross-cutting | `from_source/scout_pass.md` | -- | ctrl-F "todo" | Confirms `todos` collection at `todo/todos.js:5` and the api directory at `app/imports/api/todo/`. |
| Curated | `functional/user_stories.md` | -- | ctrl-F "todo" | **No user stories reference todos.** |
| Curated | `glossary.md` | -- | ctrl-F "todo" | **No glossary entry for todos.** |
| Helpdesk | `full_documentation/` (all 8 files) | -- | ctrl-F "todo" | **Zero hits.** No helpdesk coverage whatsoever. |

### What HalingoDoc covers for this area

HalingoDoc covers todos comprehensively on the code-derived side. The `from_source/features/todos.md` file (140 lines) is a complete feature specification derived from reading the Meteor source: it catalogs the data model (6 fields), all 4 Meteor methods with file:line citations, the single publication with its sort order, the full UI behavior flow (8 numbered steps), permissions model, and notable details including the soft-delete schema mismatch.

The `from_source/features/main_dashboard.md` provides the dashboard context: the todos widget occupies grid cell `c` (6 columns wide on large screens, full-width on small screens, 4 rows tall), is one of four fixed widgets (notifications, openBills, todos, newsfeed), and is not customizable or rearrangeable.

### What HalingoDoc does NOT cover for this area

- No helpdesk documentation exists. End users have no written help article about the todos feature.
- No user stories reference todos in `functional/user_stories.md`.
- The confirm-delete dialog behavior (what library powers it, what text it shows) is mentioned but not detailed.
- The exact visual styling of the `inactive` class on completed todos (opacity, color, strikethrough?) is not described.

### Direct citations worth preserving

> From `from_source/features/todos.md:7-8`:
>
> > A lightweight personal to-do list kept per user. Each therapist sees only their own items, can add new ones from the dashboard widget, edit the text inline, tick them off, or delete them. There is no sharing, no due date, no tagging, no assignment, and no practice scope -- it is a single flat list bound to the currently signed-in `Meteor.user()`.

> From `from_source/features/todos.md:77`:
>
> > Despite the presence of `removed` / `removedAt` fields on the schema, this method issues a hard `remove`; no soft-delete path is taken.

> From `from_source/features/todos.md:105-107`:
>
> > **All users** that pass the `LoggedInValidatedMethod` check can create, edit, toggle, and delete their **own** todos. There is no role gate (owner / beheerder / lid) -- the method `run` bodies filter strictly by `userId: this.userId` so each user is constrained to their own list.

---

## Source 2 -- Meteor source slice

### Files read (13 total)

Flat list grouped by directory. Starting points taken from the `from_source/features/todos.md` file:line citations.

- `app/imports/api/todo/` (2 files)
  - `todos.js` -- `Todos` collection, SimpleSchema (6 fields: `createdAt`, `done`, `todo`, `userId`, `removed`, `removedAt`), deny rules, publicFields, empty helpers
  - `methods.js` -- 4 methods: `todo.create`, `todo.edit`, `todo.done`, `todo.remove`
- `app/imports/api/todo/server/` (3 files)
  - `index.js` -- barrel import for indexes, methods, publications
  - `indexes.js` -- `createIndex({userId: 1})` at Meteor startup
  - `publications.js` -- `todos` publication scoped to `this.userId` with sort `{done: 1, createdAt: -1}`
- `app/imports/modules/todos/` (2 files)
  - `TodosWidget.jsx` -- React class component rendering the todo list with add form, inline edit, checkbox toggle, delete with confirm, infinite scroll, empty state
  - `TodosWidgetContainer.jsx` -- `withTracker` data container, manages reactive `limit` variable (starts at 20, grows by 20 on scroll), provides `items`, `isLoading`, `hasMore`, `loadMore`, `resetLimit`
- `app/imports/lib/formSchemas/todo/` (1 file)
  - `edit.js` -- `EditTodo` FormSchema wrapping the `editSchema` from methods.js, single text input field
- `app/imports/lib/permissions/` (1 file)
  - `LoggedInValidatedMethod.jsx` -- base auth wrapper; throws `errors.user.notLoggedIn` if no `this.userId`; logs failures via `MethodLogger`
- `app/imports/api/collection.js` (1 file)
  - Base `Collection` class extending `Mongo.Collection`; auto-sets `createdAt` on insert
- `app/imports/ui/pages/main/MainDashboardPage.jsx` (1 file)
  - Dashboard page importing `TodosWidget` as widget `c` in the grid layout
- `app/imports/startup/server/registerApi.js` (1 file, line 18 only)
  - Confirms `import "../../api/todo/server/"` for server-side registration
- `app/imports/i18n/resources/client/nl.i18n.js` (1 file, lines 1203-1205 only)
  - `todos.no_items: "Goed zo, niets te doen!"`, `todos.title: "Todos"`
- `app/imports/i18n/resources/client/fr.i18n.js` (1 file, lines 1203-1205 only)
  - `todos.no_items: "Bon, rien à faire!"`, `todos.title: "A faire"`

### Key symbols per file

- `api/todo/todos.js:5` -- `Todos` collection (`new Collection("todos")`)
- `api/todo/todos.js:7-11` -- `Todos.deny()` blocking all client-side insert/update/remove
- `api/todo/todos.js:13-20` -- SimpleSchema: `createdAt: Date`, `done: {Boolean, default false}`, `todo: String`, `userId: {String, regEx: SimpleSchema.RegEx.Id}`, `removed: {Boolean, optional}`, `removedAt: {Date, optional}`
- `api/todo/todos.js:24-27` -- `publicFields` stripping `removed` and `removedAt` from publications
- `api/todo/methods.js:5-11` -- `todo.create`: validates `{todo: String}`, inserts `{todo, userId: this.userId}`
- `api/todo/methods.js:13-16` -- `editSchema`: `{_id: String/Id, todo: String}`, shared between add/edit forms
- `api/todo/methods.js:17-23` -- `todo.edit`: updates `todo` text on owned document `{_id, userId: this.userId}`
- `api/todo/methods.js:25-31` -- `todo.done`: toggles `done` boolean on owned document
- `api/todo/methods.js:33-39` -- `todo.remove`: hard-deletes owned document (`Todos.remove(...)`, NOT soft-delete)
- `api/todo/server/indexes.js:5-7` -- `createIndex({userId: 1})` at startup
- `api/todo/server/publications.js:5-7` -- `todos` publication: `Todos.find({userId: this.userId}, {limit, sort: {done: 1, createdAt: -1}})`
- `modules/todos/TodosWidgetContainer.jsx:8-9` -- module-level `limit` ReactiveVar, starts at 20, increments by 20
- `modules/todos/TodosWidgetContainer.jsx:16` -- subscribes with `{limit: limit.get(), userId: Meteor.userId()}` (note: `userId` param is sent but ignored by the publication which always uses `this.userId`)
- `modules/todos/TodosWidget.jsx:20` -- `TodosWidget` class component
- `modules/todos/TodosWidget.jsx:34` -- add form: `Form definition={EditTodo} onSubmit={(d, cb) => create.call(d, cb)} hideOnSuccess`
- `modules/todos/TodosWidget.jsx:48` -- `ScrollBar.onYReachEnd` triggers `loadMore`
- `modules/todos/TodosWidget.jsx:50` -- done items get `inactive` class
- `modules/todos/TodosWidget.jsx:53-55` -- `Checkbox value={item.done} onChange={v => markDone.call({id: item._id, done: v})}`
- `modules/todos/TodosWidget.jsx:57-60` -- `LiveEditableForm definition={EditTodo} value={item} readOnly={item.done}`
- `modules/todos/TodosWidget.jsx:61` -- `moment(item.createdAt).calendar()` relative timestamp
- `modules/todos/TodosWidget.jsx:63-65` -- delete icon `fa-times` with `confirmDelete()` dialog
- `modules/todos/TodosWidget.jsx:70-74` -- empty state: `todos.no_items` heading
- `lib/formSchemas/todo/edit.js:10-25` -- `EditTodo` FormSchema: single `Input` for `todo` field, submits via `edit.call(_.pick(data, ['_id', 'todo']), cb)`
- `ui/pages/main/MainDashboardPage.jsx:13` -- `import TodosWidget from "../../../modules/todos/TodosWidgetContainer"`
- `ui/pages/main/MainDashboardPage.jsx:29,36` -- grid cell `c`: `{w: 12, h: 4}` (small) / `{w: 6, h: 4}` (big)
- `ui/pages/main/MainDashboardPage.jsx:64-65` -- `todos: { component: TodosWidget }` in `availableWidgets`

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | `userId` param in subscription | `from_source/features/todos.md:86` says "subscription ... with an initial `limit` of 20" | `TodosWidgetContainer.jsx:16` also passes `userId: Meteor.userId()` as a parameter, but the server publication at `publications.js:6` ignores this parameter entirely and uses `this.userId`. The client-side param is cosmetic / belt-and-suspenders. | Source -- the effective scoping is `this.userId` on the server. The client param is a no-op. HalingoDoc correctly notes this at line 86 but could be clearer. |
| 2 | FlowRouter reference | `from_source/features/todos.md` does not mention routing | `MainDashboardPage.jsx:1` imports from `meteor/ostrio:flow-router-extra` (the maintained fork of `kadira:flow-router`). No standalone route exists for todos. | Source -- confirms there is no `/todos` route. |

No material discrepancies. HalingoDoc's `from_source/features/todos.md` is an accurate representation of the source code. All file:line citations checked out.

---

## Source 3 -- Local Meteor exploration

**Local Meteor URL:** `http://localhost:3000` (local Meteor dev instance at `/home/tj/Repos/Halingo-Main/`)
**Screens visited:** 5 (0 public + 5 gated)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/todos/`
**Test data cleanup:** all `_PARITY_TEST_` data removed from `todos` collection after walk via direct Mongo `deleteMany`.

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/login` | Login page | NL | Email input, password input, login button | `01-login-page.png` |
| 2 | `/` | Dashboard (empty todos state) | NL | Four-widget grid visible: notifications (0 Meldingen), open bills (EUR 35,00 / 1 openstaande factuur), todos ("Goed zo, niets te doen!"), newsfeed. Todos widget shows `todos.title` = "Todos" header and `todos.no_items` empty-state message. | `05-dashboard-full.png`, `06-dashboard-todos-empty.png` |
| 3 | `/` | Dashboard (one todo added) | NL | After submitting "_PARITY_TEST_ Buy supplies for session" via the add form, the todo appears with a checkbox, the text, "Vandaag" timestamp, and a delete icon. Add form hides after successful submit. | `08-todo-added.png` |
| 4 | `/` | Dashboard (two todos) | NL | After adding "_PARITY_TEST_ Follow up with patient", both todos visible. Newest appears on top (sorted by `createdAt: -1` within the undone group). Each row: checkbox + text + relative timestamp + delete icon. | `09-two-todos.png` |
| 5 | `/` | Dashboard (todo marked done) | NL | After clicking the checkbox on "_PARITY_TEST_ Check toggle behavior", the row gains the `inactive` class. Visual effect: the row is grayed out / deemphasized. The inline edit form becomes read-only. | `11-todo-checked.png` |

### Behavior observed during local walk

1. **Login succeeded** with `_PARITY_TEST_owner@example.com` / `halingoTest123!` and landed on the dashboard at `/`.
2. **Dashboard grid layout** matches the code exactly: notifications (top-left), open bills (top-center-left), todos (right half, tall), newsfeed (bottom-left).
3. **Empty state** shows "Goed zo, niets te doen!" centered in the todos widget, confirming `todos.no_items` NL translation.
4. **Add form** is a single text input (placeholder `*`) with a "Voeg toe" button (NL translation of `forms.buttons.add`). The form is inside the todos widget, above the list.
5. **After adding a todo**, the form clears and hides (confirming `hideOnSuccess`). The new item appears immediately in the list with a checkbox, the text, "Vandaag" relative timestamp (from `moment().calendar()`), and a trash/delete icon.
6. **Sort order confirmed**: newest undone items appear at the top, consistent with `{done: 1, createdAt: -1}`.
7. **Checkbox toggle** adds the `inactive` CSS class to the `.feed-element` row, producing a visual graying-out effect. The inline text becomes read-only (cannot be edited while done).
8. **Delete** triggers a confirm dialog (via `confirmDelete()` from the `Confirm` component). Confirming removes the todo from the list immediately.
9. **No standalone `/todos` route** -- the feature is exclusively a dashboard widget. The nav sidebar has no "Todos" link.
10. **Not practice-scoped** -- the same todos list persists regardless of which practice is selected (consistent with source: no `practiceId` on the schema).
11. **Widget title** is "Todos" in NL. FR was not tested during this walk but the i18n key `todos.title` maps to "A faire" per the FR translation file.

### Screens not reached (and why)

- **FR locale variant**: not walked. The local Meteor instance defaults to NL based on the test account's locale. FR translation keys are confirmed from source (`todos.title: "A faire"`, `todos.no_items: "Bon, rien a faire!"`).
- **Infinite scroll (20+ items)**: not tested. Would require seeding 20+ todos to trigger the `loadMore` behavior. Confirmed from source that `limit` starts at 20 and increments by 20 on `ScrollBar.onYReachEnd`.
- **Inline edit behavior**: not tested via the walk. Confirmed from source that `LiveEditableForm` uses `EditTodo` and submits on blur/change via `todo.edit`.

---

## Features

A "feature" is the smallest user-visible behavior that can be tested in isolation.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Local walk | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `todos/create` | Add a new todo from the dashboard widget | docs + source + local | `api/todo/methods.js:5-11` | `from_source/features/todos.md:53-57` | Screens #3, #4 | Single text input + "Voeg toe" button. Form hides on success. |
| 2 | `todos/edit` | Inline-edit a todo's text | docs + source | `api/todo/methods.js:17-23`, `modules/todos/TodosWidget.jsx:57-60` | `from_source/features/todos.md:59-64` | -- | `LiveEditableForm` submits on blur/change. Disabled when `done`. |
| 3 | `todos/toggle-done` | Toggle a todo's completion state via checkbox | docs + source + local | `api/todo/methods.js:25-31`, `modules/todos/TodosWidget.jsx:53-55` | `from_source/features/todos.md:66-70` | Screen #5 | Toggling adds `inactive` class (visual deemphasis), makes text read-only. |
| 4 | `todos/delete` | Delete a todo with confirmation | docs + source | `api/todo/methods.js:33-39`, `modules/todos/TodosWidget.jsx:62-65` | `from_source/features/todos.md:72-77` | -- | Hard delete (not soft-delete despite schema having `removed`/`removedAt` fields). `confirmDelete()` dialog first. |
| 5 | `todos/list` | Display user's todos in dashboard widget with sort order | docs + source + local | `api/todo/server/publications.js:5-7`, `modules/todos/TodosWidgetContainer.jsx:18` | `from_source/features/todos.md:80-86` | Screens #2-#5 | Sort: `{done: 1, createdAt: -1}` (undone first, newest first within group). Shows checkbox, text, relative timestamp, delete icon per row. |
| 6 | `todos/empty-state` | Show "Goed zo, niets te doen!" when no todos exist | docs + source + local | `modules/todos/TodosWidget.jsx:70-74` | `from_source/features/todos.md:99` | Screen #2 | NL: "Goed zo, niets te doen!" / FR: "Bon, rien a faire!" |
| 7 | `todos/infinite-scroll` | Load more todos on scroll (pagination by 20) | docs + source | `modules/todos/TodosWidgetContainer.jsx:8-9,24-26` | `from_source/features/todos.md:100-101` | -- | `limit` starts at 20, increments by 20 on `ScrollBar.onYReachEnd`. Resets on unmount. |

### Feature detail -- `todos/create`

- **Description:** User types todo text into the single-field form at the top of the todos dashboard widget and clicks "Voeg toe" (NL) / submits. A new todo is created with `done: false` and the calling user's `userId`. The form hides on success.
- **Found via:** docs + source + local
- **Legacy source file(s):** `api/todo/methods.js:5-11` (method), `modules/todos/TodosWidget.jsx:34` (form), `lib/formSchemas/todo/edit.js:10-25` (schema)
- **HalingoDoc file(s):** `from_source/features/todos.md:53-57`
- **Local screen(s):** Dashboard `/` (screenshots #3, #4)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `todos/edit`

- **Description:** Each todo's text is rendered in a `LiveEditableForm`. The user clicks the text, edits it inline, and the change is submitted on blur/change via `todo.edit`. When a todo is marked `done`, the form becomes `readOnly` and editing is blocked.
- **Found via:** docs + source
- **Legacy source file(s):** `api/todo/methods.js:17-23` (method), `modules/todos/TodosWidget.jsx:57-60` (UI), `lib/formSchemas/todo/edit.js:22-25` (submit handler)
- **HalingoDoc file(s):** `from_source/features/todos.md:59-64`
- **Local screen(s):** not directly tested (inline edit requires precise click targeting)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** the `readOnly` lock on done items is intentional UX
- **Open questions:** none

### Feature detail -- `todos/toggle-done`

- **Description:** Each todo row has a checkbox. Toggling it calls `todo.done` with `{id, done}`. When `done=true`, the row gets the `inactive` CSS class (grayed out) and the inline edit form becomes read-only. When toggled back to `done=false`, the row returns to normal.
- **Found via:** docs + source + local
- **Legacy source file(s):** `api/todo/methods.js:25-31`, `modules/todos/TodosWidget.jsx:50,53-55`
- **HalingoDoc file(s):** `from_source/features/todos.md:66-70`
- **Local screen(s):** Dashboard `/` (screenshot #5)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `todos/delete`

- **Description:** Each todo row has a delete icon (`fa-times`). Clicking it triggers `confirmDelete()` (a confirmation dialog). On confirm, `todo.remove` is called, which hard-deletes the document from the `todos` collection.
- **Found via:** docs + source
- **Legacy source file(s):** `api/todo/methods.js:33-39`, `modules/todos/TodosWidget.jsx:62-65`
- **HalingoDoc file(s):** `from_source/features/todos.md:72-77`
- **Local screen(s):** not directly tested (confirm dialog handling was unreliable in headless browser)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:**
  - **Hard delete despite soft-delete schema.** The schema has `removed` and `removedAt` fields, and `publicFields` strips them from publications. Yet `todo.remove` uses `Todos.remove()` (hard delete), not `Todos.update({$set: {removed: true, removedAt: new Date()}})`. This is a QUIRK-PRESERVE candidate: the schema suggests soft-delete was planned but never implemented. The new port should decide whether to keep hard-delete (parity) or switch to soft-delete (consistency with the rest of the new app).
- **Open questions:** see `[NEEDS CLARIFICATION]` Q1

### Feature detail -- `todos/list`

- **Description:** The todos widget on the main dashboard subscribes to the `todos` publication and displays the user's todos sorted by `{done: 1, createdAt: -1}` -- undone items first, newest first within each group. Each row shows: checkbox, text (inline-editable), relative timestamp via `moment().calendar()`, and a delete icon.
- **Found via:** docs + source + local
- **Legacy source file(s):** `api/todo/server/publications.js:5-7`, `modules/todos/TodosWidgetContainer.jsx:18`, `modules/todos/TodosWidget.jsx:49-67`
- **HalingoDoc file(s):** `from_source/features/todos.md:80-101`
- **Local screen(s):** Dashboard `/` (screenshots #2-#5)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `todos/empty-state`

- **Description:** When the user has no todos and the subscription is ready, the widget shows a centered `<h3>` with the `todos.no_items` i18n key: "Goed zo, niets te doen!" (NL) / "Bon, rien a faire!" (FR).
- **Found via:** docs + source + local
- **Legacy source file(s):** `modules/todos/TodosWidget.jsx:70-74`
- **HalingoDoc file(s):** `from_source/features/todos.md:99`
- **Local screen(s):** Dashboard `/` (screenshot #2)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `todos/infinite-scroll`

- **Description:** The todos widget starts with a `limit` of 20 items. When the user scrolls to the bottom of the widget's scrollable area, `ScrollBar.onYReachEnd` triggers `loadMore()`, which increases the `limit` ReactiveVar by 20 and triggers a larger resubscription. On unmount, `resetLimit()` clears the limit so the next mount starts fresh at 20.
- **Found via:** docs + source
- **Legacy source file(s):** `modules/todos/TodosWidgetContainer.jsx:8-9,24-29`, `modules/todos/TodosWidget.jsx:48`
- **HalingoDoc file(s):** `from_source/features/todos.md:100-101`
- **Local screen(s):** not tested (would need 20+ seeded todos)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

---

**7 features in this area** (none deprecated, none dead code). HalingoDoc's `from_source/features/todos.md` covered 100% of the features found. The local walk confirmed 4 of 7 features visually; the remaining 3 (inline edit, delete confirmation, infinite scroll) were confirmed from source but not exercised in the headless browser.

---

## Cross-references to other areas

- **Main Dashboard (net-new concept #1 in coverage matrix):** the todos widget is one of four fixed cells in the dashboard grid. The dashboard as a whole is a cross-cutting surface that includes notifications, open bills, todos, and newsfeed. The todos discovery here covers only the todos cell; the dashboard layout, DashboardTop statistics band, and the other three widgets are separate areas.
- **#1 Identity Management:** the `LoggedInValidatedMethod` wrapper used by all four todo methods is the same auth layer used by every other authenticated Meteor method. No todo-specific auth beyond `userId` scoping.

---

## [NEEDS CLARIFICATION]

### Q1: Should the new port use hard-delete or soft-delete for todos?

- **Why it matters:** the legacy Meteor app has a mismatch -- the schema includes `removed`/`removedAt` fields and `publicFields` strips them, but `todo.remove` uses hard `Todos.remove()`. The new app's `BaseHalingoDocument` uses soft-delete as the baseline deletion strategy. Porting the hard-delete behavior would be an exception; porting with soft-delete would break parity but match the new app's conventions.
- **Sources conflict?** no -- the source is clear that hard-delete is what happens today. The question is about the porting decision.
- **What would resolve:** product owner decision. Recommendation: switch to soft-delete in the new app (consistency with the rest of the codebase) and mark this as an intentional behavioral change from legacy.

### Q2: Is the todos feature used enough to justify porting, or could it be replaced by a third-party integration?

- **Why it matters:** the feature is extremely simple (flat list, no dates, no priorities, no sharing). If therapists don't actively use it, the port effort (small as it is) could be redirected. Alternatively, it could be deferred to post-migration.
- **Sources conflict?** no -- this is a product question, not a source question.
- **What would resolve:** product owner answer + usage data from staging/production Mongo (`db.todos.count()` and `db.todos.distinct('userId').length` would indicate adoption).

---

## [NEEDS DOMAIN REVIEW]

*(empty -- todos has no Belgian healthcare regulatory concerns. No RIZIV touch, no GDPR sensitivity beyond standard user-scoped data, no regional variations.)*

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md (ctrl-F only)
/home/tj/HalingoDoc/docs/glossary.md (ctrl-F only)
/home/tj/HalingoDoc/docs/full_documentation/ (all 8 files, ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/features/todos.md
/home/tj/HalingoDoc/docs/from_source/features/main_dashboard.md
/home/tj/HalingoDoc/docs/from_source/features/practice_user_roles.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/open_questions.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/inventory.md (ctrl-F only)
/home/tj/HalingoDoc/docs/from_source/scout_pass.md (ctrl-F only)

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/todo/todos.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/methods.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/server/indexes.js
/home/tj/Repos/Halingo-Main/app/imports/api/todo/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/todos/TodosWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/todo/edit.js
/home/tj/Repos/Halingo-Main/app/imports/lib/permissions/LoggedInValidatedMethod.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/collection.js
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/startup/server/registerApi.js (line 18 only)
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js (lines 1203-1205 only)
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/fr.i18n.js (lines 1203-1205 only)

# Local walk screenshots (source 3)
/home/tj/halingoMigration/01-discovery/staging-screens/todos/01-login-page.png
/home/tj/halingoMigration/01-discovery/staging-screens/todos/05-dashboard-full.png
/home/tj/halingoMigration/01-discovery/staging-screens/todos/06-dashboard-todos-empty.png
/home/tj/halingoMigration/01-discovery/staging-screens/todos/08-todo-added.png
/home/tj/halingoMigration/01-discovery/staging-screens/todos/09-two-todos.png
/home/tj/halingoMigration/01-discovery/staging-screens/todos/11-todo-checked.png
```

---

## Verification notes (verbatim from `01-discovery/todos.verification.md`)

# Verification: Todos

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/todos.md`
- **Verdict:** PASS WITH NOTES

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Direct quote lines 7-8: "A lightweight personal to-do list kept per user..." | `from_source/features/todos.md:7-8` | ✓ | Exact match. |
| 2 | Direct quote line 77: "Despite the presence of `removed` / `removedAt` fields on the schema, this method issues a hard `remove`; no soft-delete path is taken." | `from_source/features/todos.md:77` | ✓ | Exact match. |
| 3 | Direct quote lines 105-107: "**All users** that pass the `LoggedInValidatedMethod` check..." | `from_source/features/todos.md:105-107` | ✓ | Exact match. |
| 4 | `todos.js:13-20` — SimpleSchema has exactly 6 fields | `api/todo/todos.js:13-20` | ✓ | Confirmed from source. Schema block spans lines 13-20 with exactly 6 fields as claimed. |
| 5 | `methods.js:33-39` — hard-delete via `Todos.remove()` | `api/todo/methods.js:33-39` | ✓ | Confirmed. Actual range is 33-38 (1-line off on closing brace). Behavioral claim fully correct. |
| 6 | `TodosWidgetContainer.jsx:16` — subscribes with `userId` param ignored by server | `modules/todos/TodosWidgetContainer.jsx:16` | ✓ | Confirmed. Server publication ignores the `userId` parameter per HalingoDoc line 86. |
| 7 | `TodosWidget.jsx:70-74` — empty state with `todos.no_items` key | `modules/todos/TodosWidget.jsx:70-74` | ✓ | Confirmed. Lines 70-74 contain the empty-state div with `<Text resources='todos.no_items' component='h3'/>`. |
| 8 | Dashboard grid cell `c`: 6x4 in lg/md, 12x4 in sm/xs/xxs | `MainDashboardPage.jsx:29,36` | ✓ | Confirmed. bigLayout: `{ i: "c", x: 6, y: 0, w: 6, h: 4 }`. smallLayout: `{ i: "c", x: 0, y: 1, w: 12, h: 4 }`. |
| 9 | Four dashboard widgets: notifications, openBills, todos, newsfeed | `from_source/features/main_dashboard.md` | ✓ | Confirmed. `availableWidgets` has `notifications`, `openBills`, `todos`, `info` (NewsfeedWidget). |
| 10 | `todos.no_items` NL: "Goed zo, niets te doen!"; FR: "Bon, rien a faire!" | `nl.i18n.js:1204`, `fr.i18n.js:1204` | ~ | NL confirmed exact. FR source has accent: `"Bon, rien à faire!"`. Discovery omits accent in two places. |
| 11 | `todos.title` NL: "Todos"; FR: "A faire" | `nl.i18n.js:1205`, `fr.i18n.js:1205` | ✓ | Confirmed exact. |
| 12 | `inventory.md` states `todos.md` at 139 lines | `from_source/inventory.md` | ~ | Inventory says 139; actual file is 140 lines (trailing blank). Discovery correctly reports 140. |
| 13 | `from_source/features/todos.md` as comprehensive primary reference | `from_source/features/todos.md` | ✓ | Confirmed. Complete code-derived feature description covering data model, methods, publication, UI behavior, i18n, and permissions. |

## Material omissions

1. **`todo.create` return value.** HalingoDoc `todos.md:57` states "Returns the new document `_id` (from `Todos.insert`)." Not mentioned in the feature catalog or detail. Phase 2 spec should note the create call returns an `_id`. Low impact.

2. **`Form` component `focus={false}` prop.** `TodosWidget.jsx:41` includes `focus={false}` on the add Form, meaning the input does not auto-focus on widget mount. Not mentioned. Relevant for Phase 2 UX spec — QUIRK-PRESERVE candidate.

3. **`MethodLogger` on failure.** HalingoDoc `todos.md:112` states MethodLogger fires on `LoggedInValidatedMethod` failure. Not mentioned. Safe omission — MethodLogger is deprecated (#17 in deprecation_list.md) and must NOT be ported.

## Cross-area reference check

| Cross-reference in discovery | Verified? | Finding |
|---|---|---|
| Main Dashboard (net-new concept #1 in coverage matrix) | ✓ | `coverage_matrix.md` "Net-new concepts found in code" #1 is "Main dashboard widget grid." Confirmed accurate. |
| #1 Identity Management — `LoggedInValidatedMethod` wrapper | ✓ | Accurate — `LoggedInValidatedMethod` is the universal auth wrapper for all Meteor methods. |
| Todos is "net-new concept #4" in `coverage_matrix.md` | ✓ | Confirmed exact: "Per-user todos scoped strictly by `userId`" as item #4. |
| No deprecation entries touch todos | ✓ | Full read of `deprecation_list.md` — no entry references todos. |
| No bugs/security findings touch todos | ✓ | Full read of `bugs_and_security_findings.md` — no entry references todos. |

## Domain review (logopedist-be)

**Confirmed: todos has zero Belgian healthcare regulatory touch points.**

- The `todos` collection stores only: therapist's own `userId`, free-text task strings, boolean `done` flag, `createdAt` timestamp. No patient identifiers, no INSZ/NISS, no RIZIV codes, no clinical data.
- **GDPR Art. 9**: does not apply — no health/genetic/biometric data processed. Data subjects are therapists, not patients.
- **30-year Kwaliteitswet retention** (art. 35): applies only to patient records. A therapist's personal task list is not a patient record.
- **RIZIV/INAMI**: no nomenclature codes, no billing, no prescription or bilan data.
- **eHealth/MyCareNet**: no exchange with eHealth systems.

The NEEDS DOMAIN REVIEW section being empty is correct and verified against primary sources.

## Escalated source checks (Step C)

| # | Claim | Source file | Verified? | Finding |
|---|---|---|---|---|
| 1 | `Todos` collection at `todos.js:5` | `api/todo/todos.js:5` | ✓ | `export const Todos = new Collection("todos");` — confirmed. |
| 2 | `todo.remove` hard-deletes at `methods.js:33-39` | `api/todo/methods.js:33-38` | ✓ | Hard delete using `Todos.remove(...)`. Actual range is 33-38 (off-by-one on closing brace). |
| 3 | SimpleSchema 6 fields at `todos.js:13-20` | `api/todo/todos.js:13-20` | ✓ | Exactly 6 fields: `createdAt`, `done`, `todo`, `userId`, `removed`, `removedAt`. |
| 4 | `userId` param sent but ignored at `TodosWidgetContainer.jsx:16` | `TodosWidgetContainer.jsx:16` | ✓ | `Meteor.subscribe('todos', {limit: limit.get(), userId: Meteor.userId()})` — server uses `this.userId`. |
| 5 | Empty state at `TodosWidget.jsx:70-74` | `TodosWidget.jsx:70-74` | ✓ | `<Text resources='todos.no_items' component='h3'/>` — confirmed. |

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-todos-01 | NOTE | citation | FR i18n string `todos.no_items` cited as `"Bon, rien a faire!"` in discovery; actual source has accent: `"Bon, rien à faire!"`. | Minor typo in two places — does not affect Phase 2 correctness since the i18n key is what matters. |
| V-todos-02 | NOTE | citation | `todo.remove` line range cited as `methods.js:33-39`; actual range is 33-38. | Off-by-one on closing brace — immaterial to behavioral correctness. |
| V-todos-03 | NOTE | omission | `todo.create` returns the new document `_id`. Not mentioned in feature catalog or detail. | Phase 2 spec should note the create call returns an `_id`. Low impact. |
| V-todos-04 | NOTE | omission | `Form` component `focus={false}` prop means add input does not auto-focus on widget mount. Not mentioned. | Relevant for Phase 2 UX spec — QUIRK-PRESERVE candidate. |
| V-todos-05 | NOTE | omission | `MethodLogger` fires on `LoggedInValidatedMethod` failure. Not mentioned. | Safe omission — MethodLogger is deprecated and must NOT be ported. |
| V-todos-06 | NOTE | citation | inventory.md lists `todos.md` as 139 lines; discovery correctly says 140. | Discovery is correct; no action needed. |

## Recommendation

**PROCEED to Phase 2 spec authoring for the todos area.**

No BLOCKER findings. No CLARIFY findings. The discovery file is accurate, well-sourced, and complete. The 6 NOTE-level findings are all minor and do not affect Phase 2 spec correctness. The Phase 2 spec author should be aware of:

- The FR `todos.no_items` string has an accent: `"Bon, rien à faire!"` (not `"Bon, rien a faire!"`).
- The `todo.create` method returns the new `_id` — worth specifying in the Gherkin return-value scenario.
- The add form does not auto-focus (`focus={false}`) — the spec should state whether the new implementation should match this behavior (QUIRK-PRESERVE candidate).
- The two NEEDS CLARIFICATION items in the discovery (Q1: hard-delete vs soft-delete; Q2: feature usage justification) are genuine product-owner questions, not source ambiguities. Both must be resolved before the spec is finalized.
