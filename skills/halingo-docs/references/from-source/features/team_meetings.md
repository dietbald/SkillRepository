# Team meetings

> **🪦 Abandoned — confirmed by the product owner 2026-04-07.** Q12 of [`../open_questions.md`](../open_questions.md): "Abandoned". The collection, i18n strings, role permission, and `TeamMeetingBox` component are all safe to delete. See [`../deprecation_list.md` #20](../deprecation_list.md). Do **not** port to the mono repo. If team meetings come back as a feature, design fresh.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none for this specific feature. (The helpdesk does describe a "vergadering" workflow in `../../full_documentation/agenda_scheduling.md` but that article is about calendar meeting events — `events.type === 2` in the `events` collection — and is unrelated to the `teammeeting` collection documented here.)

## What it is

A dormant feature scaffold for planning in-practice team meetings (teamvergaderingen / réunions d'équipe) separately from the normal calendar. The collection, search index, server startup hook, role permission, and a small vocabulary of i18n strings all exist in the codebase, but there is **no visible UI**, **no Meteor method**, **no publication**, and **no route**. The only place that would have rendered a team-meeting widget — `PracticesOverviewPage` — has the widget wrapped in a `ComingSoon` overlay and commented out of the render tree.

> ⚠️ Behaviour inferred from code; needs product validation. Everything below the "Data model" section is code-present-but-not-reachable. Treat this file as a reference for what the scaffold defines, not as a description of something an end-user can currently use.

## Where it lives in the UI

There is no live surface. The traces left behind are:

- Commented-out `TeamMeetingBox` widget on the practice overview page, wrapped in `<ComingSoon/>` · `app/imports/ui/pages/practices/PracticesOverviewPage.jsx:70-86`
- `ComingSoon` component definition · `app/imports/ui/components/coming-soon/ComingSoon.jsx:7`
- i18n labels in navigation, practice, and search-meeting namespaces (see Notable details) but with no consumer inside a mounted component.

Grepping the whole `app/imports/` tree for `TeamMeetingBox`, `TeamMeetingContainer`, or any route matching `team` / `meeting` / `vergadering` returns nothing outside the commented block above and the code export dump. The feature is effectively invisible in the running application.

## Data model

Collection: `teammeeting` · `app/imports/api/practice/teammeeting.jsx:5`

Exported as `TeamMeeting`.

| Field | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | Set by the base `Collection` on insert. `teammeeting.jsx:15`, `app/imports/api/collection.js:13-15` |
| `practiceId` | `String` (optional) | The praktijk the meeting belongs to. Marked optional despite the feature clearly being per-praktijk. `teammeeting.jsx:16` |
| `date` | `Date` | When the meeting takes place. Used by the `filters` (see below). `teammeeting.jsx:17` |
| `participants` | `Array<String>` | User ids of attendees. `teammeeting.jsx:18-19` |
| `location` | `String` | Location, free-text. The single searchable field in the Easy Search index. `teammeeting.jsx:20`, `app/imports/lib/search-indexes/teamMeeting.jsx:30` |
| `removed` | `Boolean` (optional) | Soft-delete scaffold. Unused. `teammeeting.jsx:21` |
| `removedAt` | `Date` (optional) | Same as above. `teammeeting.jsx:22` |

Client-side writes are denied:

```js
TeamMeeting.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});
```
`teammeeting.jsx:8-12`

### Enums and constants defined on the collection

- `TeamMeetingStates = { ATTEND: 'attend', ABSENT: 'absent' }` — exported alongside the collection. `teammeeting.jsx:25-28`. Intended (presumably) to be stored per participant to record attendance, but the schema has no `attendance` field, so the enum is unused by the schema.
- `TeamMeeting.filters = { done: {date: {$lt: new Date()}}, tocome: {date: {$gt: new Date()}} }` — Mongo-selector shortcuts for past vs. future meetings. `teammeeting.jsx:29-32`. Evaluated once at module load, so `new Date()` is fixed at server startup — if these filters were ever wired up, they would need to be re-evaluated per request.
- `TeamMeeting.sortOptions = { date_asc, date_desc, location_asc, location_desc }` — Mongo sort specifications keyed by human-readable ids. `teammeeting.jsx:33-38`
- `TeamMeeting.helpers({})` — empty block. `teammeeting.jsx:43-45`

### Easy Search index

`TeamMeetingIndex` · `app/imports/lib/search-indexes/teamMeeting.jsx:7-37`

- Name: `"TeamMeetingIndex"`
- Engine: `MongoDBEngine`
- Fields: `['location']` — i.e., search matches on `location` only
- Selector: scoped to `practiceId: options.search.props.practiceId` so callers are expected to pass the praktijk id when searching
- Sort: honours `options.search.props.sort` or defaults to `{createdAt: 1}`
- Default limit: 10
- Permission: `() => true` — wide open
- Registered at server startup via `import "../../lib/search-indexes/teamMeeting.jsx"` in `app/imports/startup/server/index.js:12`

The index is created and wired to the server, so a client that knows the name could run searches against it, but no UI component instantiates a cursor against it.

## Methods (Meteor)

**None.** `app/imports/api/practice/methods.jsx` imports `PracticeChatCol` but never imports or references `TeamMeeting`. No `teamMeeting.add`, `teamMeeting.edit`, or `teamMeeting.remove` method exists anywhere in the repository despite a `teamMeeting.add` permission being declared (see Permissions).

Client-side inserts / updates / removes are denied by the collection (`teammeeting.jsx:8-12`), and since no server method wraps the collection either, the only way to write a document is direct server-side code — which does not exist either.

## Publications

**None.** No `Meteor.publish` call with name `teammeeting` (or similar) exists. The collection is therefore never shipped to clients through the standard Meteor DDP path. A hypothetical future publication would need to exist before the commented-out `TeamMeetingBox` in `PracticesOverviewPage` could render.

The Easy Search index does its own publication under the hood (via `easysearch_core`), but nothing subscribes to it.

## User-visible behaviour

None. The `ChatWidget` and dashboard surfaces do not reference `TeamMeeting`. The only place a user would theoretically encounter it is the commented-out block on `PracticesOverviewPage`:

```jsx
{/*<div className="row" style={{marginTop: "100px"}}>
    <div className="col-sm-12">
        <div style={{position: 'relative'}}>
            <div className="blur">
                <Box isLoading={false} header={
                    <div>
                        <Text component="strong" resources="practice.teamMeeting" />
                    </div>
                }>
                    <TeamMeetingBox latestMeeting={props.latestMeeting}
                                    practiceId={props.currentPracticeId}/>
                </Box>
            </div>
            <ComingSoon/>
        </div>
    </div>
</div>*/}
```
`PracticesOverviewPage.jsx:70-86`

This block shows the intended layout: a blurred `TeamMeetingBox` under a header reading `practice.teamMeeting` (`"Teamvergadering"`), with a `ComingSoon` overlay on top. Nothing here is rendered — the entire block is inside a `{/* ... */}` JSX comment. `TeamMeetingBox` is not imported at the top of the file and does not exist as a component file in the repository.

## Permissions

One permission name is declared in `app/imports/api/practiceUsers/practiceUsers.jsx`:

- `teamMeeting.add` — granted to `owner` (line 69) and `admin` (line 134). **Not** granted to `default` (`lid`).

Mapping to product language:

- `owner` = **Praktijkverantwoordelijke**
- `admin` = **Beheerder**
- `default` = **Lid** (excluded)

So the permission table suggests the feature was intended to be creatable only by the praktijkverantwoordelijke or beheerder, with regular members presumably having read-only access (but no `teamMeeting.view` or `teamMeeting.edit` permission is defined). Because no method checks the permission and no publication exists, `teamMeeting.add` is an unreachable permission at the moment.

## Notable details

- **Dead / dormant code.** Four pieces of the scaffold exist: the collection (`api/practice/teammeeting.jsx`), the search index (`lib/search-indexes/teamMeeting.jsx`), the role permission (`practiceUsers.jsx:69`, `:134`), and i18n strings (`nl.i18n.js:178`, `:887-889`, `:993-1000`; mirrored in `fr.i18n.js`). Everything else — methods, publications, UI container, UI page, route — is missing.
- **Collection is still wired to the server.** `app/imports/startup/server/index.js:12` imports `lib/search-indexes/teamMeeting.jsx`, which creates the Mongo collection on the server. A production database will have a `teammeeting` collection even though nothing writes to it through the app.
- **`TeamMeeting.filters` uses a captured `new Date()`.** Because the filter object is constructed once at module load time, the `done` and `tocome` shortcuts freeze "now" at server startup. If this scaffold is revived, these need to become functions. `teammeeting.jsx:29-32`
- **`TeamMeetingStates` enum is defined but not referenced by the schema.** Attendance would presumably be stored as a participant-level sub-document, but the current schema has `participants` as a flat `Array<String>` of user ids with no per-participant state. `teammeeting.jsx:18-19`, `:25-28`
- **The `teammeeting` navigation label exists too.** `navigation.teammeeting` — `"Overzicht teamvergadering"` (NL) / `"Vue d'ensemble de la réunion d'équipe"` (FR). `nl.i18n.js:178`, `fr.i18n.js:178` — suggesting a left-nav entry was planned as well, but no route is registered.
- **Search results strings are ready.** `practice.searchMeeting` namespace: `amount.one` = `"1 vergadering"`, `amount.other` = `"%(count)s vergaderingen"`, `noResults` = `"Geen teamvergaderingen teruggevonden"`, `placeholder` = `"Zoek in teamvergaderingen"`. `nl.i18n.js:993-1000`
- **Feature-complete copy in Dutch and French.** `practice.newMeeting` (`"Nieuwe teamvergadering"` / `"Nouvelle réunion d'équipe"`), `practice.addTeamMeeting` (`"Nieuwe teamvergadering plannen"` / `"Planifier une nouvelle réunion d'équipe"`), `practice.teamMeeting` (`"Teamvergadering"` / `"Réunion d'équipe"`), `practice.participants` / `practice.details`. `nl.i18n.js:884-889`, `fr.i18n.js:884-889`
- **Distinct from calendar meeting events.** Halingo's calendar also has a "meeting" event type (`events.type === 2`, see `app/imports/api/events/events.jsx` via the scout pass). That is unrelated to this collection: calendar meetings are stored in `events` and surface as appointments, whereas `teammeeting` is a separate, never-wired-up collection intended for formal practice-wide staff meetings with attendance tracking.
- **No migration creates teammeeting rows.** A scan of the migrations directory shows none of `migration-v*` seeds this collection.

## Helpdesk overlap

No helpdesk article covers the `teammeeting` feature. The closest match is `../../full_documentation/agenda_scheduling.md` §"Een vergadering inplannen" (lines 82+), which documents scheduling a `vergadering` via the calendar pop-up — that is the `events` collection's `type === 2` ("meeting") appointment sub-type, not the `teammeeting` collection. Keep the two separate when writing about them: the calendar meeting is a time-boxed visible slot on the agenda, the `teammeeting` scaffold is a separate roster of past/future staff meetings with searchable locations and attendance states.

## Source files

- `app/imports/api/practice/teammeeting.jsx`
- `app/imports/lib/search-indexes/teamMeeting.jsx`
- `app/imports/startup/server/index.js` (imports the search index at startup)
- `app/imports/api/practiceUsers/practiceUsers.jsx` (declares the `teamMeeting.add` permission)
- `app/imports/ui/pages/practices/PracticesOverviewPage.jsx` (commented-out `TeamMeetingBox` + `ComingSoon` block)
- `app/imports/ui/components/coming-soon/ComingSoon.jsx`
- `app/imports/api/collection.js`
- `app/imports/i18n/resources/client/nl.i18n.js` (keys `navigation.teammeeting`, `practice.newMeeting`, `practice.addTeamMeeting`, `practice.teamMeeting`, `practice.searchMeeting.*`, `practice.details`, `practice.participants`)
- `app/imports/i18n/resources/client/fr.i18n.js` (same keys in French)
