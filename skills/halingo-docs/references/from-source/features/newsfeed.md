# Newsfeed

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: none. Verify against running app before promoting to `manual/`.

## What it is

A read-only, system-wide announcement stream that Halingo publishes to every signed-in user. Each item carries a bilingual title and body (NL / FR) plus an optional image, and items are shown as a scrollable feed on the main dashboard. End-users cannot post to the feed; entries are created out-of-band (direct database or an unexposed admin path) and published reactively to clients.

## Where it lives in the UI

- Widget on the main dashboard (`Dashboard` grid, layout cell `info`) · `NewsfeedWidgetContainer` · `app/imports/ui/pages/main/MainDashboardPage.jsx:14` and `:67-70`
- Widget presentation · `NewsfeedWidget` · `app/imports/modules/newsfeed/NewsfeedWidget.jsx:11`
- Data wiring · `NewsfeedWidgetContainer` · `app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx:16`

No standalone page or route exists; the newsfeed is only reachable as a dashboard widget.

## Data model

Collection: `newsfeed` · `app/imports/api/newsfeed/newsfeed.js:6`

| Field | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | Creation timestamp. Used as the sort key (descending) for the feed. `newsfeed.js:15` |
| `title` | `Object` | Bilingual title container. `newsfeed.js:18` |
| `title.nl` | `String` | Dutch title. `newsfeed.js:20` |
| `title.fr` | `String` | French title. `newsfeed.js:19` |
| `body` | `Object` | Bilingual body container. `newsfeed.js:16` |
| `body.nl` | `String` | Dutch body. Rendered with `allowHTML` on the client. `newsfeed.js:17`, widget `NewsfeedWidget.jsx:37` |
| `body.fr` | `String` | French body. `newsfeed.js:17` |
| `image` | `String` (optional) | Image URL. Falls back to `/img/logo_small.png` via `getImage()`. `newsfeed.js:19`, `newsfeed.js:33-35` |

Client insert / update / remove are denied outright:

```js
Newsfeed.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});
```
`newsfeed.js:8-12`

A soft-delete convention is implied by the `publicFields` projection (`removed: 0`, `removedAt: 0` are stripped from publications) but no method in the read code path writes those fields. `newsfeed.js:27-30`

## Methods (Meteor)

None. The `newsfeed` collection exposes no Meteor methods. All mutations are blocked by the client-side `deny` rules in `newsfeed.js:8-12`. Entries must be created server-side, outside of the application's method surface (for example by direct MongoDB insert or an admin tool not present in the repository).

## Publications

### `newsfeed`

- File · `app/imports/api/newsfeed/server/publications.js:11`
- Parameters · `{ limit: Number, locale: String }`
- Returns · The most recent `limit` newsfeed documents sorted by `createdAt` descending. For each document, only the `title` and `body` strings for the requested `locale` are sent to the client; the bilingual object is flattened before being pushed through `this.added` / `this.changed`. `publications.js:5-9`, `publications.js:16-23`
- The publication uses an `observeChanges` cursor so that newly inserted items appear in real time. `publications.js:13-24`
- `publicFields` (`{removed: 0, removedAt: 0}`) are stripped from the cursor projection. `publications.js:13`, `newsfeed.js:27-30`

## User-visible behaviour

1. On sign-in, the user lands on the main dashboard (`MainDashboardPage`). The dashboard grid places the newsfeed in the `info` cell. `MainDashboardPage.jsx:30`, `:37`, `:67-70`
2. The widget subscribes to `newsfeed` with an initial `limit` of 5 items and the current user's `locale` (falling back to the first configured locale when no user is present). `NewsfeedWidgetContainer.jsx:14`, `:21-24`
3. While the subscription is loading, a `LoadingOverlay` covers the widget. `NewsfeedWidget.jsx:23-24`
4. Each loaded item is rendered as a `feed-element` row containing:
   - A circular image (either the document's `image` or the Halingo logo). `NewsfeedWidget.jsx:31`, `newsfeed.js:33-35`
   - A calendar-style relative timestamp via `moment(item.createdAt).calendar()`. `NewsfeedWidget.jsx:35`
   - The localised title (bold). `NewsfeedWidget.jsx:36`
   - The localised body, rendered with `allowHTML`, meaning the body may contain HTML markup. `NewsfeedWidget.jsx:37`
5. When the feed has no items the widget shows the `newsfeed.no_items` label centered. `NewsfeedWidget.jsx:44-46`
6. When the user scrolls to the bottom of the widget, `ScrollBar.onYReachEnd` fires `loadMore`, which increases the client-side `limit` by 5, triggering a larger subscription and additional items. `NewsfeedWidget.jsx:27`, `NewsfeedWidgetContainer.jsx:13-14`, `:32-34`
7. On unmount the container resets the shared `limit` `ReactiveVar` so a subsequent visit starts again at 5 items. `NewsfeedWidget.jsx:12-14`, `NewsfeedWidgetContainer.jsx:35-37`

> ⚠️ Behaviour inferred from code; needs product validation. The `allowHTML` body means administrators authoring newsfeed items directly in MongoDB can embed arbitrary markup. There is no author UI, no edit UI, no delete UI, and no per-practice targeting.

## Permissions

- Read: any logged-in client with a subscription handle can read the feed. There is no practice filter, no role check, and no owner-only gating. `publications.js:11`
- Write: denied for all clients via `Newsfeed.deny(...)`. `newsfeed.js:8-12`

The feed is therefore effectively a global announcement channel from Halingo (the vendor) to every user across every practice. No `practiceUsers/util.jsx` permission flag governs visibility.

## Notable details

- **Bilingual with server-side projection.** Instead of sending both language variants and letting the client pick, the publication overwrites `fields.title` and `fields.body` with only the requested `locale` before publishing. `publications.js:5-9`, `publications.js:16-23` This means a language switch forces a resubscription with the new `locale` parameter.
- **Real-time.** The `observeChanges`-based publication pushes newly inserted items to connected clients without polling. `publications.js:13-24`
- **HTML in the body.** The widget renders the body with `allowHTML`. `NewsfeedWidget.jsx:37` Styling and sanitisation are not handled here; whatever is in the database is rendered.
- **Soft-delete hooks exist but are unused at read time.** `publicFields` strips `removed` / `removedAt` but no method writes those fields in the inspected code. `newsfeed.js:27-30`
- **Shared `ReactiveVar` limit.** The `limit` variable is module-level (`NewsfeedWidgetContainer.jsx:13`) rather than instance state. If the widget unmounts and remounts without calling `resetLimit()` it would keep its previous limit; the `componentWillUnmount` guard mitigates this for the normal case. `NewsfeedWidget.jsx:12-14`
- **Fallback image.** `getImage()` on the collection helper returns `/img/logo_small.png` when no `image` field is set. `newsfeed.js:32-36`
- **i18n labels.**
  - `newsfeed.title` — `"Nieuwsfeed"` (NL) / `"Fil d'actualités"` (FR). `app/imports/i18n/resources/client/nl.i18n.js:1201`, `.../fr.i18n.js:1201`
  - `newsfeed.no_items` — `"Geen nieuws"` (NL) / `"Pas de nouvelles"` (FR). `nl.i18n.js:1200`, `fr.i18n.js:1200`

## Helpdesk overlap

No helpdesk article. A Grep of `full_documentation/` for `nieuws` / `newsfeed` returns no hits.

## Source files

- `app/imports/api/newsfeed/newsfeed.js`
- `app/imports/api/newsfeed/server/index.js`
- `app/imports/api/newsfeed/server/publications.js`
- `app/imports/modules/newsfeed/NewsfeedWidget.jsx`
- `app/imports/modules/newsfeed/NewsfeedWidgetContainer.jsx`
- `app/imports/ui/pages/main/MainDashboardPage.jsx`
- `app/imports/api/collection.js`
- `app/imports/i18n/resources/client/nl.i18n.js` (keys `newsfeed.title`, `newsfeed.no_items`)
- `app/imports/i18n/resources/client/fr.i18n.js` (keys `newsfeed.title`, `newsfeed.no_items`)
