# Todos

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none. Verify against running app before promoting to `manual/`.

## What it is

A lightweight personal to-do list kept per user. Each therapist sees only their own items, can add new ones from the dashboard widget, edit the text inline, tick them off, or delete them. There is no sharing, no due date, no tagging, no assignment, and no practice scope — it is a single flat list bound to the currently signed-in `Meteor.user()`.

## Where it lives in the UI

- Widget on the main dashboard (`Dashboard` grid, layout cell `todos`) · `TodosWidgetContainer` · `app/imports/ui/pages/main/MainDashboardPage.jsx:13`, `:29`, `:36`, `:64-66`
- Widget presentation · `TodosWidget` · `app/imports/modules/todos/TodosWidget.jsx:20`
- Data wiring · `TodosWidgetContainer` · `app/imports/modules/todos/TodosWidgetContainer.jsx:11`
- Inline edit form schema · `EditTodo` · `app/imports/lib/formSchemas/todo/edit.js:10`

There is no standalone todos page or route; the feature only exists as a dashboard widget.

## Data model

Collection: `todos` · `app/imports/api/todo/todos.js:5`

| Field | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | Insert timestamp (set automatically by the base `Collection` class). `todos.js:14`, `app/imports/api/collection.js:13-15` |
| `todo` | `String` | The task text. Required. `todos.js:16` |
| `done` | `Boolean` | Whether the task is marked completed. Defaults to `false`. `todos.js:15` |
| `userId` | `String` (Mongo `_id`) | Owner. Always set to the method caller's `this.userId`. `todos.js:17`, `methods.js:9`, `:21`, `:29`, `:37` |
| `removed` | `Boolean` (optional) | Part of a soft-delete scaffold but not written by any visible method. `todos.js:18`, `todos.js:24-27` |
| `removedAt` | `Date` (optional) | Same as above. `todos.js:19` |

Client-side `insert` / `update` / `remove` are all denied outright:

```js
Todos.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});
```
`todos.js:7-11`

All mutations must go through the Meteor methods below.

`publicFields` strips `removed` and `removedAt` from anything published. `todos.js:24-27`

A Mongo index is created on `userId` at startup: `Todos.rawCollection().createIndex({userId: 1})`. `app/imports/api/todo/server/indexes.js:5-7`

## Methods (Meteor)

All four methods are declared with `LoggedInValidatedMethod`, which throws `errors.user.notLoggedIn` if there is no `this.userId`. `app/imports/lib/permissions/LoggedInValidatedMethod.jsx:10-12`

### `todo.create`

- File · `app/imports/api/todo/methods.js:5-11`
- Parameters · `{ todo: String }`
- Inserts a new todo with the calling user's id: `Todos.insert({todo, userId: this.userId})`. `methods.js:9`
- Returns · the new document `_id` (from `Todos.insert`).

### `todo.edit`

- File · `app/imports/api/todo/methods.js:17-23`
- Parameters · `{ _id: String, todo: String }` — validated against `editSchema`. `methods.js:13-16`
- Updates only if the document's `userId` matches the caller: `Todos.update({_id, userId: this.userId}, {$set: {todo}})`. `methods.js:21`
- Text is shared with the "add" form through `EditTodo` / `editSchema`. `app/imports/lib/formSchemas/todo/edit.js`

### `todo.done`

- File · `app/imports/api/todo/methods.js:25-31`
- Parameters · `{ id: String, done: Boolean }`
- Toggles the `done` flag on an owned todo: `Todos.update({_id: id, userId: this.userId}, {$set: {done}})`. `methods.js:29`

### `todo.remove`

- File · `app/imports/api/todo/methods.js:33-39`
- Parameters · `{ id: String }`
- Hard-deletes an owned todo: `Todos.remove({_id: id, userId: this.userId})`. `methods.js:37`
- Despite the presence of `removed` / `removedAt` fields on the schema, this method issues a hard `remove`; no soft-delete path is taken.

## Publications

### `todos`

- File · `app/imports/api/todo/server/publications.js:5-7`
- Parameters · `{ limit: Number }`
- Returns · `Todos.find({userId: this.userId}, {limit, sort: {done: 1, createdAt: -1}})` — the current user's todos only, with undone items first (`done: 1`), then newest first within each group.
- There is no `userId` parameter honoured on the server side; the subscription is always implicitly scoped to `this.userId`, so clients cannot read another user's list. `publications.js:6`

## User-visible behaviour

1. The user opens the main dashboard. The grid renders the `TodosWidget` in the `todos` cell (6 columns wide in the small layout, 6 columns wide in the big layout). `MainDashboardPage.jsx:29`, `:36`, `:64-66`
2. The widget subscribes to `todos` with an initial `limit` of 20. `TodosWidgetContainer.jsx:9`, `:16`
3. A single-field "add todo" form sits at the top of the widget. The user types the task text and submits; `todo.create` is called with `{todo}`; the form is hidden on success (`hideOnSuccess`). `TodosWidget.jsx:32-42`
4. Existing items render as a list ordered undone-first, newest-first within that ordering. Each row shows:
   - A checkbox bound to `item.done`; toggling it calls `todo.done` with `{id, done}`. `TodosWidget.jsx:52-56`
   - The task text inside a `LiveEditableForm` using `EditTodo`, which on blur / change submits `todo.edit` with `{_id, todo}`. `TodosWidget.jsx:57-60`, `app/imports/lib/formSchemas/todo/edit.js:23-25`
   - A `moment(item.createdAt).calendar()` relative timestamp. `TodosWidget.jsx:61`
   - A delete icon (`fa-times`) that opens a confirm dialog (`confirmDelete()`) and, if accepted, calls `todo.remove`. `TodosWidget.jsx:62-65`
5. When a row is `done`, the inline form becomes `readOnly` and the row is given the `inactive` class for visual deemphasis. `TodosWidget.jsx:50`, `:59`
6. If no todos exist the widget shows `todos.no_items` centered: `"Goed zo, niets te doen!"` (NL) / `"Bon, rien à faire!"` (FR). `TodosWidget.jsx:70-74`, `app/imports/i18n/resources/client/nl.i18n.js:1204`, `.../fr.i18n.js:1204`
7. When the user scrolls to the bottom of the list, `ScrollBar.onYReachEnd` fires `loadMore`, raising the shared `limit` `ReactiveVar` by 20 and triggering a larger resubscription. `TodosWidget.jsx:48`, `TodosWidgetContainer.jsx:8-9`, `:24-26`
8. On unmount, `resetLimit()` clears the module-level `limit`, so the next mount starts again at 20. `TodosWidget.jsx:21-23`, `TodosWidgetContainer.jsx:27-29`

## Permissions

- **All users** that pass the `LoggedInValidatedMethod` check can create, edit, toggle, and delete their **own** todos. There is no role gate (owner / beheerder / lid) — the method `run` bodies filter strictly by `userId: this.userId` so each user is constrained to their own list. `methods.js:9`, `:21`, `:29`, `:37`
- **Cross-user access is impossible** through the normal API: the publication returns only `this.userId`'s documents (`publications.js:6`) and every update / delete selector includes `userId: this.userId`.
- **Practice scope** is not modelled. A user who belongs to several practices sees the same single list in every practice.

## Notable details

- **Per-user sort order baked into the publication.** The server sorts `{done: 1, createdAt: -1}` (`publications.js:6`) and the client mirrors the same sort in its tracker (`TodosWidgetContainer.jsx:18`). Done items are pushed to the bottom.
- **`LoggedInValidatedMethod` logging.** Every call goes through `MethodLogger.insert` on failure, which writes an entry in the `method-logs` collection containing the user id, method name, duration, arguments and error. `LoggedInValidatedMethod.jsx:20-32`, `:40-48`
- **Shared edit schema.** The add form and the inline edit row both use `EditTodo`, which maps `onSubmit` to `todo.edit`; the widget overrides this for the "add" case by passing its own `onSubmit` that calls `todo.create`. `TodosWidget.jsx:34`, `app/imports/lib/formSchemas/todo/edit.js:22-25`
- **No due dates, tags, priorities, reminders, sharing or practice scope.** The schema has exactly `todo` / `done` / `userId` / `createdAt` plus the unused `removed` / `removedAt`. `todos.js:13-20`
- **Soft-delete hook present but unused.** `publicFields` hides `removed` / `removedAt` but `todo.remove` issues a hard Mongo `remove`; no method writes `removed: true`. `todos.js:24-27`, `methods.js:37`
- **`i18n` labels.**
  - `todos.title` — `"Todos"` (NL) / `"A faire"` (FR). `nl.i18n.js:1205`, `fr.i18n.js:1205`
  - `todos.no_items` — `"Goed zo, niets te doen!"` (NL) / `"Bon, rien à faire!"` (FR). `nl.i18n.js:1204`, `fr.i18n.js:1204`
  - `forms.buttons.add` — used for the add button label. `TodosWidget.jsx:39`

## Helpdesk overlap

No helpdesk article. A Grep of `full_documentation/` for `todo` returns no hits.

## Source files

- `app/imports/api/todo/todos.js`
- `app/imports/api/todo/methods.js`
- `app/imports/api/todo/server/index.js`
- `app/imports/api/todo/server/publications.js`
- `app/imports/api/todo/server/indexes.js`
- `app/imports/modules/todos/TodosWidget.jsx`
- `app/imports/modules/todos/TodosWidgetContainer.jsx`
- `app/imports/lib/formSchemas/todo/edit.js`
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx`
- `app/imports/ui/pages/main/MainDashboardPage.jsx`
- `app/imports/api/collection.js`
- `app/imports/i18n/resources/client/nl.i18n.js` (keys `todos.title`, `todos.no_items`)
- `app/imports/i18n/resources/client/fr.i18n.js` (keys `todos.title`, `todos.no_items`)
