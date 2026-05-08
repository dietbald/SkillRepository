# Newsfeed

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

System-wide bilingual announcements (no author UI).

## Spec contracts (Phase 2)

- **newsfeed** — Feature: newsfeed/dashboard-widget
  - Path: `02-specs/newsfeed/spec.md`


## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/newsfeed.md`)

# Discovery: Newsfeed

**Area:** #23 Newsfeed (net-new concept from `coverage_matrix.md` — not one of the 20 core competencies in `application_map.md`)

**Scope in one breath:** a read-only, system-wide announcement feed from Halingo (the vendor) to every signed-in user, rendered as a dashboard widget with bilingual NL/FR content, infinite scroll pagination, per-locale server-side projection, and no author UI (content is seeded via direct MongoDB insert). No standalone page exists; no read/unread tracking; no per-practice targeting.

**Date:** 2026-04-10
**Agent:** Claude Code `general-purpose` subagent handling all three sources in one session.

> **Scope discipline reminder:** this file describes the legacy Meteor app ONLY. It contains **zero references** to what's in `Halingo-MonoRepo/`, `libs/backend/*`, `AuthenticationService`, or any Nx-side symbol. Phase 0 audit data belongs elsewhere. See `06-prompts/halingo-discoverer.md` -- "The ONE critical scope rule".

---

## Source 1 -- HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Code-derived | `from_source/features/newsfeed.md` | 108 | full | Definitive feature doc: data model, publication, UI behavior, permissions, i18n keys, source file list |
| Code-derived | `from_source/features/main_dashboard.md` | 134 | full | Dashboard layout context: newsfeed widget in grid cell `d` ("info"), data wiring, empty/loading states, personalization rules |
| Code-derived | `from_source/technical/publications.md` | — | line 43 | Publication signature: `newsfeed({limit, locale})`, global scope, `observeChanges`-based |
| Code-derived | `from_source/technical/methods.md` | — | lines 131-133 | Confirms: no methods file; read-only client-side; admin writes via direct DB ops |
| Code-derived | `from_source/technical/collections.md` | — | lines 488-497, 1276 | Collection schema confirmation: `newsfeed` collection, fields `createdAt`, `title.{nl,fr}`, `body.{nl,fr}`, `image` (optional) |
| Code-derived | `from_source/inventory.md` | — | line 165, 312 | Net-new concept #3: "System-wide newsfeed with bilingual NL/FR content. No author UI exists -- content is seeded outside the app." |
| Code-derived | `from_source/scout_pass.md` | — | line 74, 264 | Collection listed; `newsfeed.*` i18n namespace noted |
| Cross-cutting | `from_source/deprecation_list.md` | 184 | ctrl-F "newsfeed" | **Not deprecated.** Explicitly listed under "Items NOT in this list": "Newsfeed authoring via `meteor mongo` -- that *is* the workflow. Not a missing feature." |
| Cross-cutting | `from_source/open_questions.md` | — | Q19 | Q19 answered: "That is inserted through the db directly" -- confirms the workflow is direct MongoDB insert |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | ctrl-F "newsfeed" | No bugs or security findings reference newsfeed |
| Curated | `functional/application_map.md` | — | full | Newsfeed is NOT one of the 20 core competencies. Listed as net-new concept #3 in `coverage_matrix.md` |
| Curated | `functional/user_stories.md` | — | ctrl-F "newsfeed", "nieuws" | No user stories reference newsfeed |
| Curated | `coverage_matrix.md` | — | net-new concepts section | Net-new #3: "System-wide newsfeed with bilingual NL/FR content. **No author UI exists** -- content is seeded outside the app." |
| Helpdesk | `full_documentation/*` | — | ctrl-F "newsfeed", "nieuws", "fil d'actual" | **No helpdesk coverage at all.** Zero hits across all 8 helpdesk files. |

### What HalingoDoc covers for this area

HalingoDoc has excellent code-derived coverage of the newsfeed via `from_source/features/newsfeed.md` (108 lines). This file fully documents:
- The data model (collection schema with bilingual `title`/`body` objects, optional `image`, `createdAt` sort key)
- The server-side publication with locale-based field projection via `observeChanges`
- The client `deny` rules blocking all client mutations
- The widget UI behavior (infinite scroll, fallback image, `allowHTML` body rendering, loading/empty states)
- The permission model (any logged-in user can read; no practice filter, no role check)
- The i18n keys (`newsfeed.title`, `newsfeed.no_items` in NL and FR)

The `from_source/features/main_dashboard.md` adds dashboard context: the newsfeed occupies grid cell `d` ("info") in the 4-cell widget layout.

The `open_questions.md` Q19 and `deprecation_list.md` confirm that direct MongoDB insertion is the intended authoring workflow, not a missing feature.

### What HalingoDoc does NOT cover for this area

- **No helpdesk documentation at all.** The newsfeed is invisible to end-user-facing docs. This is expected -- users don't interact with the newsfeed beyond reading it; there is nothing to document from a "how to use" perspective.
- **Pagination behavior under load.** `newsfeed.md` documents the `limit` ReactiveVar and `loadMore` pattern but doesn't describe what happens with very large numbers of items (hundreds+). The code shows the limit increases by 5 on each scroll-bottom, with no upper bound.
- **Content authoring workflow details.** Q19 says "inserted through the db directly" but there's no documentation of what fields are required, how to format HTML bodies, or whether there's an admin script/tool used by the Halingo team.
- **`allowHTML` sanitization risk.** `newsfeed.md` flags `allowHTML` with a warning but no resolution. Since only Halingo staff can insert content (no client-side write path), this is a low risk -- but technically any HTML/JS in the body field would execute in every user's browser.

### Direct citations worth preserving

> From `from_source/features/newsfeed.md:1-3`:
>
> > **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none. Verify against running app before promoting to `manual/`.

> From `from_source/features/newsfeed.md:6-7`:
>
> > A read-only, system-wide announcement stream that Halingo publishes to every signed-in user. Each item carries a bilingual title and body (NL / FR) plus an optional image, and items are shown as a scrollable feed on the main dashboard. End-users cannot post to the feed; entries are created out-of-band (direct database or an unexposed admin path) and published reactively to clients.

> From `from_source/features/newsfeed.md:84-86`:
>
> > **Bilingual with server-side projection.** Instead of sending both language variants and letting the client pick, the publication overwrites `fields.title` and `fields.body` with only the requested `locale` before publishing. This means a language switch forces a resubscription with the new `locale` parameter.

> From `from_source/features/newsfeed.md:86`:
>
> > **HTML in the body.** The widget renders the body with `allowHTML`. Styling and sanitisation are not handled here; whatever is in the database is rendered.

> From `from_source/deprecation_list.md` "Items NOT in this list":
>
> > **Newsfeed authoring via `meteor mongo`** -- that *is* the workflow. Not a missing feature.

> From `from_source/open_questions.md` Q19:
>
> > **Q19** Newsfeed has no author UI. Content must be inserted via DB or admin tool. Is there a separate admin panel, or are announcements written with `meteor mongo`? -- **Answer:** "That is inserted through the db directly"

---

## Source 2 -- Meteor source slice

### Files read (9 total)

All files confirmed to match the file:line citations in `from_source/features/newsfeed.md`. No additional newsfeed-related files found beyond what HalingoDoc documented.

- `app/imports/api/newsfeed/` (2 files)
  - `newsfeed.js` — `Newsfeed` collection definition, SimpleSchema (`createdAt`, `title.{nl,fr}`, `body.{nl,fr}`, `image`), client `deny` rules, `publicFields` projection stripping `removed`/`removedAt`, `getImage()` helper returning fallback `/img/logo_small.png`
  - `server/index.js` — single re-export of `./publications`
- `app/imports/api/newsfeed/server/` (1 file)
  - `publications.js` — `Meteor.publish('newsfeed', {limit, locale})` using `observeChanges` with `selectLanguage()` helper that flattens bilingual objects to single-locale strings before publishing
- `app/imports/modules/newsfeed/` (2 files)
  - `NewsfeedWidget.jsx` — React class component rendering the feed as a scrollable list with `InfiniteScroll`, `ScrollBar.onYReachEnd` triggering `loadMore`, empty state "Geen nieuws" / "Pas de nouvelles", `componentWillUnmount` calling `resetLimit()`
  - `NewsfeedWidgetContainer.jsx` — `withTracker` HOC managing the `ReactiveVar limit` (starts at 5, increments by 5), subscription to `newsfeed` publication, `hasMore` check (`items.length >= limit.get()`), `resetLimit` on unmount
- `app/imports/ui/pages/main/MainDashboardPage.jsx` — imports `NewsfeedWidgetContainer` as `NewsfeedWidget`, places it in grid cell `d` ("info") of the dashboard layout
- `app/imports/api/collection.js` — base `Collection` class that auto-sets `createdAt` on insert
- `app/imports/startup/server/registerApi.js` — line 9: `import "../../api/newsfeed/server/"` (server bootstrap)
- `app/imports/i18n/resources/client/nl.i18n.js` — lines 1199-1202: `newsfeed: { no_items: "Geen nieuws", title: "Nieuwsfeed" }`
- `app/imports/i18n/resources/client/fr.i18n.js` — lines 1199-1202: `newsfeed: { no_items: "Pas de nouvelles", title: "Fil d'actualites" }`

### Key symbols per file

- `api/newsfeed/newsfeed.js:6` — `Newsfeed = new Collection("newsfeed")` (MongoDB collection name: `newsfeed`)
- `api/newsfeed/newsfeed.js:8-12` — `Newsfeed.deny({ insert: true, update: true, remove: true })` — blocks all client-side mutations
- `api/newsfeed/newsfeed.js:14-23` — SimpleSchema: `createdAt` (Date), `body` (Object with `body.fr`/`body.nl` String), `title` (Object with `title.fr`/`title.nl` String), `image` (optional String)
- `api/newsfeed/newsfeed.js:27-30` — `publicFields = { removed: 0, removedAt: 0 }` — soft-delete fields stripped from publication
- `api/newsfeed/newsfeed.js:32-36` — `getImage()` helper: returns `this.image || '/img/logo_small.png'`
- `api/newsfeed/server/publications.js:5-9` — `selectLanguage(fields, locale)`: flattens `fields.body[locale]` and `fields.title[locale]` to scalar strings for the client
- `api/newsfeed/server/publications.js:11-29` — `Meteor.publish('newsfeed', {limit, locale})`: cursor with `sort: {createdAt: -1}`, `limit`, `fields: Newsfeed.publicFields`; uses `observeChanges` with `added`/`changed`/`removed` callbacks applying `selectLanguage` before `this.added`/`this.changed`
- `modules/newsfeed/NewsfeedWidgetContainer.jsx:13` — module-level `let limit; const limitIncrease = 5;` — the limit is a module-scoped `ReactiveVar`, not instance state
- `modules/newsfeed/NewsfeedWidgetContainer.jsx:16-38` — `withTracker` HOC: subscribes to `newsfeed` with `{ limit: limit.get(), locale: Meteor.user() ? Meteor.user().locale() : locales[0] }`; passes `hasMore`, `isLoading`, `items`, `loadMore`, `resetLimit` to widget
- `modules/newsfeed/NewsfeedWidget.jsx:11-53` — class component: `componentWillUnmount` calls `resetLimit()`; renders `LoadingOverlay` while loading, `.feed-element` rows when items exist, centered `newsfeed.no_items` when empty; each row has `ResponsiveImageCircular`, `moment(item.createdAt).calendar()` timestamp, bold title, `allowHTML` body
- `ui/pages/main/MainDashboardPage.jsx:14` — `import NewsfeedWidget from "../../../modules/newsfeed/NewsfeedWidgetContainer"`
- `ui/pages/main/MainDashboardPage.jsx:67-70` — `info: { component: NewsfeedWidget }` in `getAvailableWidgets()`

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| — | No discrepancies found | — | — | — |

HalingoDoc `from_source/features/newsfeed.md` is fully accurate against the current source. All file:line citations verified.

---

## Source 3 -- Staging exploration

**Staging URL:** `http://localhost:3000` (local Meteor dev instance)
**Screens visited:** 5 (0 public + 5 gated)
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/`

### Per-screen catalog

| # | URL | Screen | Language | Fields/actions observed | Screenshot |
|---|---|---|---|---|---|
| 1 | `/` (redirects to `/login`) | Login page | NL | Email, password, "Aanmelden" button | `01-login-page.png` |
| 2 | `/` (post-login) | Dashboard with empty newsfeed | NL | Newsfeed widget in bottom-left grid cell, title "Nieuwsfeed", body "Geen nieuws" centered | `02-dashboard-full.png`, `05-newsfeed-widget-closeup.png` |
| 3 | `/` (post-login, test item inserted) | Dashboard with single newsfeed item | NL | Circular Halingo logo image, bold title, HTML body rendered, "Vandaag" relative timestamp | `06-dashboard-with-newsfeed-item.png`, `07-newsfeed-widget-populated.png` |
| 4 | `/` (post-login, 8 test items inserted) | Dashboard with multiple newsfeed items | NL | 8 items visible, relative timestamps: "Vandaag" / "Gisteren" / "Afgelopen woensdag" / "Afgelopen dinsdag" etc. | `08-dashboard-multi-items-nl.png`, `09-newsfeed-multi-nl-closeup.png` |
| 5 | `/` (logged in as FR user) | Dashboard with multiple newsfeed items | FR | Title "Fil d'actualites", FR content and timestamps: "Aujourd'hui a 11:26" / "Hier a 11:26" / "mercredi dernier a 11:26" | `10-dashboard-multi-items-fr.png`, `11-newsfeed-multi-fr-closeup.png` |

### Behavior observed on staging

- **Empty state confirmed:** When no newsfeed items exist in the database, the widget shows "Geen nieuws" (NL) centered in the widget body. The widget title "Nieuwsfeed" is always visible above.
- **Populated state confirmed:** Each feed item renders as a horizontal row with: (1) circular image on the left (Halingo logo fallback when `image` is null; broken/empty circle when `image` URL is unreachable), (2) bold title text, (3) body text (HTML rendered inline), (4) relative timestamp via `moment().calendar()` in the top-right corner.
- **Locale switching confirmed:** NL user sees Dutch titles/bodies/timestamps ("Vandaag", "Gisteren"); FR user sees French ("Aujourd'hui a 11:26", "Hier a 11:26"). The widget title itself also changes ("Nieuwsfeed" vs "Fil d'actualites"). This confirms the server-side locale projection works as documented.
- **Relative timestamps confirmed:** `moment().calendar()` produces locale-appropriate relative dates. NL: "Vandaag", "Gisteren", "Afgelopen woensdag". FR: "Aujourd'hui a 11:26", "Hier a 11:26", "mercredi dernier a 11:26".
- **No standalone `/newsfeed` page:** confirmed -- navigating to `/newsfeed` redirects to dashboard. The newsfeed is only reachable as a dashboard widget.
- **No read/unread state:** there is no visual indicator of which items have been read. No bold/unbold distinction, no unread badge, no "mark as read" action.
- **Grid position confirmed:** the newsfeed widget occupies the bottom-left cell of the 4-cell dashboard grid (slot `d` / "info"), below the notifications tile and open bills tile, beside the todos widget.
- **All test data cleaned up:** `_PARITY_TEST_` prefixed items inserted during exploration were deleted from MongoDB after screenshots were taken.

### Screens not reached (and why)

- No screens were unreachable. The newsfeed has no standalone page or admin UI to find -- it exists only as a dashboard widget, which was fully explored.

---

## Features

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `newsfeed/dashboard-widget` | Newsfeed dashboard widget (read-only feed display) | docs + source + staging | `modules/newsfeed/NewsfeedWidget.jsx`, `NewsfeedWidgetContainer.jsx`, `ui/pages/main/MainDashboardPage.jsx:67-70` | `from_source/features/newsfeed.md`, `from_source/features/main_dashboard.md` | `/` dashboard (screens #2-#5) | Core rendering: circular image + bold title + HTML body + relative timestamp per item |
| 2 | `newsfeed/infinite-scroll-pagination` | Infinite scroll loading of older items | docs + source + staging | `modules/newsfeed/NewsfeedWidgetContainer.jsx:13-14,32-34`, `modules/newsfeed/NewsfeedWidget.jsx:27` | `from_source/features/newsfeed.md:70-71` | Dashboard (screen #4: 8 items visible) | Limit starts at 5, increments by 5 on `ScrollBar.onYReachEnd`. Module-level `ReactiveVar`, reset on unmount. |
| 3 | `newsfeed/locale-projection` | Server-side bilingual content projection (NL/FR) | docs + source + staging | `api/newsfeed/server/publications.js:5-9,16-23` | `from_source/features/newsfeed.md:84-85` | Dashboard NL vs FR (screens #4 vs #5) | Publication flattens `title.{locale}` and `body.{locale}` to scalar strings before pushing to client. Language switch requires resubscription. |
| 4 | `newsfeed/empty-state` | Empty state display when no items exist | docs + source + staging | `modules/newsfeed/NewsfeedWidget.jsx:44-46` | `from_source/features/newsfeed.md:69` | Dashboard (screen #2) | Shows `newsfeed.no_items` label: "Geen nieuws" (NL) / "Pas de nouvelles" (FR) |
| 5 | `newsfeed/fallback-image` | Default Halingo logo when item has no image | docs + source + staging | `api/newsfeed/newsfeed.js:32-36` | `from_source/features/newsfeed.md:30-31` | Dashboard (screens #3-#5) | `getImage()` returns `/img/logo_small.png` when `image` field is absent |
| 6 | `newsfeed/real-time-push` | Reactive real-time delivery of new items | docs + source | `api/newsfeed/server/publications.js:13-24` | `from_source/features/newsfeed.md:85` | Not directly tested (would require concurrent insert while watching) | `observeChanges`-based publication pushes newly inserted items without polling |
| 7 | `newsfeed/html-body-rendering` | HTML markup in body field rendered directly | docs + source + staging | `modules/newsfeed/NewsfeedWidget.jsx:37` | `from_source/features/newsfeed.md:28,86` | Dashboard (screen #3: `<p>` tags rendered as paragraph) | `allowHTML` on `Text` component. No sanitization. Low risk since only admin can insert content. |
| 8 | `newsfeed/loading-state` | Loading overlay while subscription initializes | docs + source | `modules/newsfeed/NewsfeedWidget.jsx:23-24` | `from_source/features/newsfeed.md:63` | Not directly observed (too fast on local) | `LoadingOverlay` shown while `handle.ready()` is false |

### Feature detail -- `newsfeed/dashboard-widget`

- **Description:** The core newsfeed feature. A scrollable widget on the main dashboard displays a chronologically-sorted (newest first) list of system-wide announcement items. Each item shows a circular image, bold title, HTML body, and relative timestamp. The widget is read-only -- users cannot interact with items beyond scrolling.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `modules/newsfeed/NewsfeedWidget.jsx:11-53`, `modules/newsfeed/NewsfeedWidgetContainer.jsx:16-38`, `ui/pages/main/MainDashboardPage.jsx:14,67-70`
- **HalingoDoc file(s):** `from_source/features/newsfeed.md:59-71`, `from_source/features/main_dashboard.md:66-73`
- **Staging screen(s):** `/` post-login dashboard, screenshots `02-dashboard-full.png` through `11-newsfeed-multi-fr-closeup.png`
- **Belgian-specific concerns:** none. The newsfeed is generic vendor-to-user communication.
- **Deprecation status:** not deprecated. Explicitly confirmed as current in `deprecation_list.md`.
- **QUIRK-PRESERVE candidates:**
  - The module-level `ReactiveVar limit` (not instance state) means the limit persists if the component remounts without unmounting first. The `componentWillUnmount` guard resets it for the normal case. This is a design choice, not a bug.
  - `publicFields` strips `removed`/`removedAt` but no code path in the newsfeed module writes those fields. The soft-delete convention is implied but unused.
- **Open questions:** none

### Feature detail -- `newsfeed/infinite-scroll-pagination`

- **Description:** The subscription limit starts at 5 items and grows by 5 each time the user scrolls to the bottom of the widget. The `hasMore` flag is derived from `items.length >= limit.get()`. On widget unmount, the limit resets so a subsequent dashboard visit starts fresh.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `modules/newsfeed/NewsfeedWidgetContainer.jsx:13-14` (limit var), `:32-34` (loadMore), `modules/newsfeed/NewsfeedWidget.jsx:12-14` (resetLimit on unmount), `:27` (ScrollBar.onYReachEnd)
- **HalingoDoc file(s):** `from_source/features/newsfeed.md:70-71,88`
- **Staging screen(s):** Screen #4 (8 items visible -- all 8 items were rendered, suggesting the widget height allowed all items to display without triggering the paginator, or the `onYReachEnd` fired automatically as the scrollable area was populated)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** the `ReactiveVar` is module-scoped rather than component-instance state. HalingoDoc notes this as an intentional design choice with an unmount guard.
- **Open questions:** none

### Feature detail -- `newsfeed/locale-projection`

- **Description:** The `newsfeed` publication takes a `locale` parameter and server-side projects only the requested language variant of `title` and `body`. Instead of sending `{ title: { nl: "...", fr: "..." } }`, the client receives `{ title: "..." }` (flattened to the requested locale's string). This means switching locale forces a resubscription.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `api/newsfeed/server/publications.js:5-9` (selectLanguage helper), `:11-29` (publication with observeChanges)
- **HalingoDoc file(s):** `from_source/features/newsfeed.md:84-85`
- **Staging screen(s):** Screens #4 (NL) vs #5 (FR) confirm locale switching works
- **Belgian-specific concerns:** NL/FR bilingual content is a Belgian regulatory/UX requirement for the Flemish and Walloon user bases
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** none
- **Open questions:** none

### Feature detail -- `newsfeed/html-body-rendering`

- **Description:** The body field is rendered with `allowHTML` on the `Text` component, meaning raw HTML in the database field is executed in the browser. Since only Halingo staff can insert newsfeed items (all client mutations are denied), this is a trusted-content scenario. No sanitization is applied.
- **Found via:** docs + source + staging
- **Legacy source file(s):** `modules/newsfeed/NewsfeedWidget.jsx:37`
- **HalingoDoc file(s):** `from_source/features/newsfeed.md:28,86`
- **Staging screen(s):** Screen #3 (test item with `<p>` tags rendered correctly)
- **Belgian-specific concerns:** none
- **Deprecation status:** not deprecated
- **QUIRK-PRESERVE candidates:** the `allowHTML` rendering is intentional -- it allows rich formatting in announcements. However, the new implementation should consider using `dangerouslySetInnerHTML` with a sanitizer (e.g., DOMPurify) as a defense-in-depth measure, even though the insertion channel is admin-only.
- **Open questions:** none

---

## Cross-references to other areas

- **Main Dashboard (net-new concept #1 from `coverage_matrix.md`):** The newsfeed widget is one of four cells in the dashboard grid layout. The dashboard itself is a separate discovery area. The newsfeed depends on the dashboard container for mounting and layout but has no data dependency on the other three widgets (notifications, open bills, todos).
- **#1 Identity Management:** The newsfeed publication uses `Meteor.user().locale()` to determine which language variant to project. This depends on the user profile locale field managed by Identity Management.
- **#2 Practice Branding:** The fallback image is `/img/logo_small.png` (the Halingo vendor logo), not the practice logo. The newsfeed is vendor-to-user, not practice-specific.

---

## [NEEDS CLARIFICATION]

### Q1: Should the newsfeed support a standalone `/newsfeed` page in the new app, or remain widget-only?

- **Why it matters:** The legacy app has no standalone page -- the newsfeed is only accessible as a dashboard widget. The new app might want a full-page view for longer announcements or history browsing.
- **Sources conflict?** No -- all sources agree there is no standalone page today.
- **What would resolve:** Product owner answer on new-app UX intent.

### Q2: Should the new app add read/unread state tracking for newsfeed items?

- **Why it matters:** The legacy app has no read/unread tracking. Users cannot tell which items they have already seen. The new app might benefit from this (badge on dashboard, bold/unbold items) to improve engagement with announcements.
- **Sources conflict?** No -- all sources agree there is no read/unread tracking today.
- **What would resolve:** Product owner answer on new-app UX intent.

### Q3: What is the intended authoring workflow for the new app -- direct DB insert, admin API endpoint, or admin UI?

- **Why it matters:** The legacy workflow (direct MongoDB insert via `meteor mongo`) does not translate to the new architecture where direct DB access may be restricted. The new app needs an explicit content insertion mechanism.
- **Sources conflict?** No -- `open_questions.md` Q19 confirms direct DB insert is the current workflow.
- **What would resolve:** Product owner decision on admin tooling.

### Q4: How many newsfeed items exist in production, and how frequently are new ones published?

- **Why it matters:** Affects pagination strategy, data retention policy, and whether the infinite scroll pattern is sufficient or if a date-range filter is needed.
- **Sources conflict?** No data available from any source.
- **What would resolve:** Mongo query on production/staging data (one-line check: `db.newsfeed.countDocuments({})`).

---

## [NEEDS DOMAIN REVIEW]

*(empty -- the newsfeed is a generic vendor-to-user communication channel with no Belgian healthcare regulation touchpoints)*

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md (ctrl-F, no hits)
/home/tj/HalingoDoc/docs/from_source/features/newsfeed.md
/home/tj/HalingoDoc/docs/from_source/features/main_dashboard.md
/home/tj/HalingoDoc/docs/from_source/technical/publications.md (line 43)
/home/tj/HalingoDoc/docs/from_source/technical/methods.md (lines 131-133)
/home/tj/HalingoDoc/docs/from_source/technical/collections.md (lines 488-497, 1276)
/home/tj/HalingoDoc/docs/from_source/inventory.md (lines 165, 312)
/home/tj/HalingoDoc/docs/from_source/scout_pass.md (lines 74, 264)
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (ctrl-F "newsfeed")
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F "newsfeed", no hits)
/home/tj/HalingoDoc/docs/from_source/open_questions.md (Q19)

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/newsfeed/newsfeed.js
/home/tj/Repos/Halingo-Main/app/imports/api/newsfeed/server/index.js
/home/tj/Repos/Halingo-Main/app/imports/api/newsfeed/server/publications.js
/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidget.jsx
/home/tj/Repos/Halingo-Main/app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/main/MainDashboardPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/collection.js
/home/tj/Repos/Halingo-Main/app/imports/startup/server/registerApi.js (line 9)
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/nl.i18n.js (lines 1199-1202)
/home/tj/Repos/Halingo-Main/app/imports/i18n/resources/client/fr.i18n.js (lines 1199-1202)

# Staging screenshots (source 3)
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/01-login-page.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/02-dashboard-full.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/05-newsfeed-widget-closeup.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/06-dashboard-with-newsfeed-item.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/07-newsfeed-widget-populated.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/08-dashboard-multi-items-nl.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/09-newsfeed-multi-nl-closeup.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/10-dashboard-multi-items-fr.png
/home/tj/halingoMigration/01-discovery/staging-screens/newsfeed/11-newsfeed-multi-fr-closeup.png
```

---

## Verification notes (verbatim from `01-discovery/newsfeed.verification.md`)

# Verification: Newsfeed (#23)

- **Verified by:** Claude Sonnet 4.6 (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/newsfeed.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

Each claim checked against its cited HalingoDoc source.

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "Net-new concept #3 from coverage_matrix.md — not one of the 20 core competencies" | `coverage_matrix.md` net-new section | ~ | Confirmed. `inventory.md:165` lists it as net-new #3: "System-wide newsfeed... No author UI exists — content is seeded outside the app." `application_map.md` does not list newsfeed among the 20 competencies. Numbering "#3" verified in `inventory.md`. |
| 2 | "Read-only, system-wide announcement feed from Halingo to every signed-in user" | `from_source/features/newsfeed.md:6-7` | ✓ | Exact wording confirmed at lines 6-7 of HalingoDoc. Publication has no `practiceId` or `userId` filter (`publications.js:11`). |
| 3 | "Dashboard widget only — no standalone page, no read/unread tracking, no per-practice targeting" | `from_source/features/newsfeed.md:11,15` | ✓ | HalingoDoc line 15: "No standalone page or route exists." Permissions section confirms no practice filter and no role check. Read/unread: no mechanism exists in the code or docs. |
| 4 | "Content seeded via direct MongoDB insert (confirmed by open_questions.md Q19)" | `from_source/open_questions.md:Q19` | ✓ | Q19 confirmed: "That is inserted through the db directly." Also corroborated by `deprecation_list.md` "Items NOT in this list" section at line 152: "Newsfeed authoring via `meteor mongo` — that *is* the workflow. Not a missing feature." |
| 5 | "Not deprecated. Explicitly listed under 'Items NOT in this list'" | `from_source/deprecation_list.md` | ✓ | Grep of deprecation_list.md for "newsfeed" returns zero hits in the main deprecation entries (as expected for a live feature). The "Items NOT in this list" section at line 152 contains the exact text cited. |
| 6 | "No bugs or security findings reference newsfeed" | `from_source/bugs_and_security_findings.md` ctrl-F | ✓ | Grep confirms zero hits for "newsfeed" in bugs_and_security_findings.md. |
| 7 | "Collection schema: `createdAt` (Date), `body` (Object with `body.fr`/`body.nl` String), `title` (Object with `title.fr`/`title.nl` String), `image` (optional String)" | `from_source/technical/collections.md:488-497` | ✓ | Collections.md lines 488-509 match exactly. Meteor source `newsfeed.js:14-23` also verified directly. |
| 8 | "`Newsfeed` collection, MongoDB name `newsfeed`, listed at collections.md:1276" | `from_source/technical/collections.md:1276` | ✓ | Line 1276 confirmed: `| 13 | Newsfeed | newsfeed | newsfeed/newsfeed.js |` |
| 9 | "Publication signature: `newsfeed({limit, locale})`; global scope; observeChanges-based" | `from_source/technical/publications.md:43` | ✓ | Line 43: `| newsfeed | ({limit, locale}) | Newsfeed entries projected to one locale... Manually re-publishes via observeChanges... | newsfeed/server/publications.js:11 | global |` — exact match. |
| 10 | "No methods file; read-only client-side; admin writes via direct DB ops" | `from_source/technical/methods.md:131-133` | ✓ | Lines 131-133: "## newsfeed — No methods file. The newsfeed is read-only client-side; admin writes happen via direct DB ops (or are not exposed). See `publications.md` for the publish." |
| 11 | "Publication lines 5-9: `selectLanguage(fields, locale)` flattens bilingual objects" | `from_source/features/newsfeed.md:55`, Meteor source | ✓ | HalingoDoc and Meteor source agree. Verified in actual `publications.js:5-9`. |
| 12 | "`publicFields = { removed: 0, removedAt: 0 }` strips soft-delete fields" | `from_source/features/newsfeed.md:43` | ✓ | HalingoDoc line 43 and `newsfeed.js:27-30` confirmed. |
| 13 | "`getImage()` returns `this.image || '/img/logo_small.png'`" | `from_source/features/newsfeed.md:30-31` | ✓ | HalingoDoc line 30-31 and `newsfeed.js:32-36` confirmed. |
| 14 | "Widget in grid cell `d` ('info') of main dashboard" | `from_source/features/main_dashboard.md:66-73` | ✓ | Lines 66-73 of main_dashboard.md: "d | info | NewsfeedWidget via NewsfeedWidgetContainer..." confirmed. |
| 15 | "Limit starts at 5, increments by 5, module-scoped ReactiveVar, reset on unmount" | `from_source/features/newsfeed.md:70-71,88` | ✓ | HalingoDoc lines 70-71, 88. Verified in `NewsfeedWidgetContainer.jsx:13-14,32-38`. |
| 16 | "`allowHTML` body rendering with no sanitization" | `from_source/features/newsfeed.md:28,86` | ✓ | HalingoDoc line 28 (body.nl rendered with allowHTML) and line 86 confirmed. Verified in `NewsfeedWidget.jsx:37`. |
| 17 | "Bilingual with server-side projection; language switch forces resubscription" | `from_source/features/newsfeed.md:84-85` | ✓ | HalingoDoc lines 84-85 confirmed. |
| 18 | "i18n keys: `newsfeed.title` ('Nieuwsfeed'/'Fil d'actualités'); `newsfeed.no_items` ('Geen nieuws'/'Pas de nouvelles')" | `from_source/features/newsfeed.md:91-92` | ~ | The claim is correct for the i18n values. However, the Source 3 staging screen description in the discovery file (line 102) renders the FR title as `"Fil d'actualites"` (missing the accent on 'e'). The actual source and HalingoDoc both have `"Fil d'actualités"`. This is a transcription artifact in the staging screen description only. See V-newsfeed-01. |
| 19 | "`newsfeed.*` i18n namespace noted in scout_pass.md:264" | `from_source/scout_pass.md:264` | ✓ | Line 264 of scout_pass.md lists `newsfeed.*` among the top-level i18n namespaces. |
| 20 | "Collection listed in scout_pass.md:74" | `from_source/scout_pass.md:74` | ✓ | Line 74: `| newsfeed | newsfeed/newsfeed.js:6 | System-wide announcements | title/body in nl/fr; optional image; timestamps |` — confirmed. |
| 21 | "`NewsfeedWidgetContainer.jsx:13` — module-level `let limit; const limitIncrease = 5;`" | Meteor source | ~ | Line 13 is `let limit;` only. `const limitIncrease = 5;` is line 14. The discovery bundles both into the `:13` citation. Logic is correct; line number citation is imprecise by one line. See V-newsfeed-02. |
| 22 | "Client `deny` rules: `insert: true, update: true, remove: true`" at lines 8-12 | `from_source/features/newsfeed.md:34-41` and Meteor source | ✓ | Confirmed exactly in both HalingoDoc and `newsfeed.js:8-12`. |
| 23 | "No user stories reference newsfeed (ctrl-F in user_stories.md)" | `functional/user_stories.md` | ✓ | No user stories for newsfeed or nieuws. Consistent with vendor-to-user communication model. |
| 24 | "No helpdesk coverage across all 8 helpdesk files" | `full_documentation/*` | ✓ | Corroborated by HalingoDoc `from_source/features/newsfeed.md:94-96`: "No helpdesk article. A Grep of `full_documentation/` for `nieuws` / `newsfeed` returns no hits." |
| 25 | "9 Meteor source files, all confirmed matching" | Source 2 traceability | ✓ | All 9 files exist and their cited line numbers verified against the 3 files directly read. Server `index.js` (re-export only) not read directly but is trivially verifiable from the discovery description. |

---

## Material omissions

Features or behaviors present in the cited sources but absent or understated in the discovery file.

**M1 — main_dashboard.md empty-state description conflict (CLARIFY)**

`main_dashboard.md` line 98 describes the newsfeed empty state as showing `"Er zijn momenteel geen nieuwsitems"`. This differs from what the actual Meteor source renders: `NewsfeedWidget.jsx:44-46` uses the i18n key `newsfeed.no_items` which resolves to `"Geen nieuws"` (NL), confirmed in `nl.i18n.js:1200`. The discovery file correctly cites `"Geen nieuws"` from the actual source. However, the discrepancy in `main_dashboard.md` is a latent error in HalingoDoc that could mislead the Main Dashboard area's Phase 2 spec author. This is a HalingoDoc authoring error, not a discovery error, but it should be flagged because the Main Dashboard discovery (`main-dashboard.md`) may reproduce it.

**M2 — `resetLimit()` implementation detail**

`NewsfeedWidgetContainer.jsx:35-37` implements `resetLimit()` as `limit = undefined` — it destroys the ReactiveVar rather than resetting its value to 5. The guard `if (!limit || !limit.get())` on line 17-18 lazily recreates it on next render as `new ReactiveVar(limitIncrease)`. The discovery states it "resets the shared `limit` ReactiveVar" and "a subsequent visit starts again at 5 items" — both are functionally correct. The precise implementation (destroy-and-recreate vs set-to-initial) is not captured. This matters slightly for the Phase 2 spec because the new implementation may use component state instead of a module-level variable, and understanding the destroy pattern helps clarify why the initial value is reliably 5 on next mount. This is NOTE level.

**M3 — `withTracker` guard for stale module-level ReactiveVar**

Lines 17-19 of `NewsfeedWidgetContainer.jsx` contain a guard `if (!limit || !limit.get()) { limit = new ReactiveVar(limitIncrease); }` that handles both the first-mount case and the reset case. The discovery describes the module-scoped limit but does not explicitly document this conditional initialization guard. The TODO comment on line 12 ("TODO move to getInitialState once...") gives important context: the module-scoped pattern is a workaround for a Meteor/React integration bug, not a deliberate architectural choice. The new implementation is free to use instance state. This context is present in the discovery's QUIRK-PRESERVE discussion but not explicitly linked to the TODO comment.

---

## Cross-area reference check

| Cross-reference in discovery | Verified accurate? | Bidirectional? | Finding |
|---|---|---|---|
| Main Dashboard (net-new concept #1) — newsfeed occupies grid cell `d` | ✓ Accurate | Partial — `main-dashboard.md` discovery file should reference newsfeed; not verified whether it does. The HalingoDoc `main_dashboard.md` cross-references newsfeed fully at lines 66-73, 87, 103. | NOTE: the existing `main-dashboard.md` discovery file in `01-discovery/` exists but was not read for this verification. The HalingoDoc source is bidirectional. |
| #1 Identity Management — publication uses `Meteor.user().locale()` | ✓ Accurate | Partial — Identity Management area should document the `locale()` accessor as a dependency surface. | Confirmed in `NewsfeedWidgetContainer.jsx:23`: `Meteor.user() ? Meteor.user().locale() : locales[0]`. |
| #2 Practice Branding — fallback image is Halingo vendor logo, not practice logo | ~ Slightly imprecise | N/A | The cross-reference to Practice Branding is included to clarify that the fallback is NOT a practice logo. The connection to Practice Branding as an area is weak: the discovery correctly notes the distinction, but Practice Branding has no actual dependency relationship with the newsfeed. The cross-reference is informational rather than load-bearing. See V-newsfeed-06. |

---

## Domain review (logopedist-be)

The discovery file marks `[NEEDS DOMAIN REVIEW]` as empty, asserting there are no Belgian healthcare regulation touchpoints.

The `logopedist-be` skill was consulted against `references/07-gdpr-and-patient-rights.md`.

**Findings:**

1. **User locale (NL/FR) as PII:** The user's locale preference is personal data under GDPR Art. 4(1) (any information relating to an identified or identifiable natural person). However, it is NOT a special category under Art. 9 (health data, genetic data, etc.). Standard GDPR Art. 6(1)(b) (contract performance) or Art. 6(1)(f) (legitimate interest for UX personalisation) provides the lawful basis for storing and using locale preference. No enhanced measures, DPIA, or IVC/CSI beraadslaging is required for this field alone.

2. **RIZIV/INAMI/eHealth implications:** None. The newsfeed is a read-only vendor-to-user communication channel. It carries no patient data, no clinical content, no nomenclature codes. It does not interact with MyCareNet, eAttest, eFact, or any eHealth platform service.

3. **Content GDPR risk:** Newsfeed items as stored in MongoDB (title, body, image URL, createdAt) contain no personal data about patients or users. If Halingo staff accidentally embedded personal data in an announcement body (e.g., a named user in a changelog note), that would be a GDPR incident — but this is an operational risk for content authors, not a structural system risk.

**Verdict:** The discovery's empty `[NEEDS DOMAIN REVIEW]` section is correct. No Belgian healthcare regulation touchpoints exist for this feature.

---

## Escalated source checks (Step 4)

Three claims read directly against Meteor source.

### Escalation 1 — `newsfeed.js` collection definition, deny rules, schema, publicFields, getImage

**Claim:** Collection at line 6, deny rules at lines 8-12, SimpleSchema at lines 14-23, publicFields at lines 27-30, getImage at lines 32-36.

**Finding:** All verified exactly. `newsfeed.js` is 37 lines total. Schema field order in the source is `createdAt, body, body.fr, body.nl, image, title, title.fr, title.nl` (line 14-23). The discovery's schema table correctly lists all fields. The discovery's line citations are accurate.

One observation: the schema has `title.fr` before `title.nl` in the source (line 21-22), and `body.fr` before `body.nl` (lines 17-18). This field ordering is schema-only and has no functional implication; the discovery does not claim a specific order. No issue.

### Escalation 2 — `publications.js` `selectLanguage` and `observeChanges`

**Claim:** `selectLanguage(fields, locale)` at lines 5-9, `observeChanges` publication at lines 11-29.

**Finding:** Verified exactly. The file is 30 lines total. `selectLanguage` at lines 5-9 uses in-place mutation (`fields.body && (fields.body = fields.body[locale])`). The publication at lines 11-29 uses `observeChanges` with `added`, `changed`, `removed` callbacks — each applying `selectLanguage` before `this.added`/`this.changed`. The `this.ready()` call is at line 26 (after the observer is set up), and `this.onStop(() => subHandle.stop())` is at lines 27-29. The discovery claims lines 11-29 — the file ends at line 30 (closing brace), so lines 11-29 is accurate.

One nuance not captured in the discovery: `selectLanguage` mutates its `fields` argument in-place rather than returning a copy. This means if Meteor's `observeChanges` reuses the same `fields` object across callbacks (it doesn't — each callback gets a fresh delta), the mutation could be destructive. In practice, `observeChanges` provides a fresh fields object per callback, so this is safe. Worth noting as QUIRK-PRESERVE context for the new implementation: the new pub/sub or REST equivalent should project the locale without relying on in-place mutation.

### Escalation 3 — `NewsfeedWidgetContainer.jsx` module-level ReactiveVar and withTracker

**Claim:** Module-scoped `limit` at line 13, `limitIncrease` of 5, `withTracker` HOC at lines 16-38.

**Finding:** Verified. Line 13 is `let limit;`, line 14 is `const limitIncrease = 5;`. The discovery citations bundle these as `:13` — a one-line imprecision (see V-newsfeed-02). The `withTracker` HOC spans lines 16-39 (not 16-38; line 39 is `)(NewsfeedWidget);`). The discovery says `:16-38` — the closing line is 39, not 38. Minor citation imprecision.

Additional finding from direct read: `resetLimit()` sets `limit = undefined` (line 36), not `limit.set(limitIncrease)`. The guard on line 17 `if (!limit || !limit.get())` handles the subsequent re-creation. This is a destroy-and-recreate pattern. The discovery's description ("resets the shared `limit` ReactiveVar so a subsequent visit starts again at 5 items") is functionally accurate but technically imprecise. See M2.

Also noted: the TODO comment at line 12 (`// TODO move to getInitialState once https://github.com/meteor/react-packages/pull/213 is merged`) documents that the module-scoped pattern is a workaround for a known Meteor/React packages bug. The pull request referenced is from 2017 and was never merged in the form described. The new implementation is explicitly free to use standard component state or hooks.

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-newsfeed-01 | NOTE | citation | FR widget title rendered as `"Fil d'actualites"` in the Source 3 staging screen description (line 102 of discovery). Actual i18n value and HalingoDoc both have `"Fil d'actualités"` (with accent). Transcription artifact in the screen catalog only; the functional claim is unaffected. | NOTE — does not affect Phase 2 spec authoring. The i18n string in HalingoDoc and source is correct. |
| V-newsfeed-02 | NOTE | citation | `NewsfeedWidgetContainer.jsx:13` cited for both `let limit;` and `const limitIncrease = 5;`. Actual source: line 13 = `let limit;`, line 14 = `const limitIncrease = 5;`. `withTracker` HOC ends at line 39, not line 38. All logic claims correct; line numbers off by 1. | NOTE — does not affect Phase 2 spec authoring. |
| V-newsfeed-03 | CLARIFY | omission | `main_dashboard.md` (HalingoDoc, not the discovery file) describes the newsfeed empty state as `"Er zijn momenteel geen nieuwsitems"` at line 98. The actual source renders `"Geen nieuws"` via `newsfeed.no_items` i18n key. The discovery file correctly follows the source. The Main Dashboard discovery area may reproduce the `main_dashboard.md` error. | CLARIFY — flag to Main Dashboard area spec author: use `"Geen nieuws"`, not `"Er zijn momenteel geen nieuwsitems"`, as the NL empty-state string. |
| V-newsfeed-04 | NOTE | citation | `resetLimit()` sets `limit = undefined` (destroys the ReactiveVar), not `limit.set(5)`. Re-creation happens lazily on next render via the guard `if (!limit || !limit.get())`. The discovery describes the outcome correctly ("starts again at 5 items") but not the mechanism. | NOTE — document as QUIRK-PRESERVE context: new implementation should use component state or a hook-managed value to avoid the module-scope destroy-and-recreate pattern. |
| V-newsfeed-05 | NOTE | domain | `selectLanguage()` in `publications.js` mutates its `fields` argument in-place. Safe in current Meteor context (fresh delta per callback). New REST/WebSocket publication equivalent should project locale without in-place mutation. | NOTE — add to QUIRK-PRESERVE candidates for `newsfeed/locale-projection` spec. |
| V-newsfeed-06 | NOTE | cross-area | Cross-reference to "#2 Practice Branding" is informational rather than a true dependency: the newsfeed fallback is the Halingo vendor logo, not a practice logo, and Practice Branding has no role in the newsfeed flow. The intent (clarifying distinction) is valid but the area reference could be dropped without loss. | NOTE — no action required; the clarification is useful context even if the dependency link is weak. |

---

## Recommendation

**PROCEED to Phase 2 spec authoring** for the Newsfeed area.

All 8 features are correctly identified and accurately described. The discovery's HalingoDoc citations are accurate. The Meteor source citations are accurate (minor line-number imprecisions are non-material). The `[NEEDS DOMAIN REVIEW]` section is correctly empty — no Belgian healthcare regulatory touchpoints exist for this feature.

**One item requires forwarding to the Main Dashboard area:** V-newsfeed-03 documents that `main_dashboard.md` carries an incorrect empty-state string for the newsfeed widget. The Main Dashboard Phase 2 spec author should be informed to use `"Geen nieuws"` (from the actual source) not `"Er zijn momenteel geen nieuwsitems"` (from `main_dashboard.md` line 98).

**For the Newsfeed Phase 2 spec author:** the four `[NEEDS CLARIFICATION]` entries (Q1: standalone page?, Q2: read/unread tracking?, Q3: authoring workflow for new app?, Q4: production item count?) are all genuine product decisions that require human/product owner input before the spec can be finalized. None of these is resolvable from the existing sources. The spec author should interview the product owner on all four before writing Gherkin scenarios for authoring-related features.
