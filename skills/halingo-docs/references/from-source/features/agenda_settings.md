# Agenda settings

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partially covered — see `../../full_documentation/calendar_appointments.md`. Verify against running app before promoting to `manual/`.

## What it is

Per-user calendar preferences. Each record in the `agendaSettings` collection is keyed by `userId` (not by practice — the same user has one preference set across all practices).

## Where it lives in the UI

- Route: `/agenda/settings`, name `agendaSettings` (`app/imports/startup/client/routes/agenda.jsx:29-39`).
- Page: `SettingsPage` (`app/imports/modules/calendar/page/SettingsPage.jsx`).
- Entry point: gear icon in the calendar toolbar (`CustomToolbar.jsx:121-124, 278-280`).
- The settings are loaded at calendar mount time (`CalendarPage.jsx:76-81`) via `agenda.settings.get`.

## Data model

`app/imports/api/agendaSettings/agendaSettings.jsx:12-28`

| Field | Type | Default | Purpose |
|---|---|---|---|
| `userId` | String (regEx Id) | — | One settings doc per user. |
| `useStartEnd` | Boolean | `false` | Whether to constrain the calendar to `[startHour, endHour]`. If `true`, events *outside* the range are filtered out of the calendar view (not just the grid scale) — see `Calendar.jsx:222-232`. |
| `startHour` | Date | — | Day-view start time. Only the `HH:mm` part is read (`CalendarPage.jsx:240-241`). |
| `endHour` | Date | — | Day-view end time. |
| `opensAt` | enum `"start" \| "current_time" \| "custom"` | `"start"` | Where the day/week view scrolls to when it loads. |
| `openHour` | Date | — | Only used when `opensAt === "custom"`. |
| `customRangeDays` | Number | `3` | How many days the `customRange` view shows (`CalendarPage.jsx:87-89`). The settings page dropdown offers 2-6 (`SettingsPage.jsx:92-97`). |
| `fadeEventsBefore` | Boolean | `false` | When true, events whose `end` is before "now" are rendered with reduced opacity (`Calendar.jsx:252, 269`). |
| `exportAgenda` | Boolean | `false` | Master switch for the iCal feed. When false, the REST endpoint returns 401 (`rest.jsx:35-38`). |
| `colorAppointment` | String (hex) | — | Default colour for newly created `type: 1` events. |
| `colorMeeting` | String (hex) | — | Default colour for newly created `type: 2` events. |
| `colorPrivate` | String (hex) | — | Default colour for newly created `type: 3` events. |
| `colorConsultation` | String (hex) | — | Default colour for newly created `type: 4` events. |
| `removed` | Boolean | — | Soft-delete flag (not exercised by the UI). |
| `createdAt` | Date | required | — |

The form uses a subset of these initial values (`SettingsPage.jsx:58-70`).

## Methods (Meteor)

`app/imports/api/agendaSettings/methods.js`

### `agenda.settings.get`
No arguments. Returns `AgendaSettings.findOne({userId: this.userId})` or `{ customRangeDays: 3 }` if none exists (`methods.js:57-64`).

### `agenda.settings.update`
Upserts the settings document. The payload is `AgendaSettings.schema` minus `userId`, `createdAt`, `removed`, plus an extra optional `confirmed: Boolean` flag.

**Out-of-range events guard** (`methods.js:17-48`): when `useStartEnd` is enabled for the first time (or start/end hours change), the method runs a MongoDB aggregation counting how many existing events have a start-hour outside the new `[startHour, endHour]`. If the count is non-zero and `confirmed !== true`, it throws `"events_outside_of_constraints"`. The client (`SettingsPage.jsx:176-189`) catches this error and shows a confirmation dialog (`SettingsPage.jsx:324-346`) asking the user whether to proceed. Submitting with `confirmed: true` skips the check and applies the setting anyway. The out-of-range events are not deleted — they are just hidden from the UI by the client-side filter.

## Publications

None dedicated to this collection. Settings are fetched via the `agenda.settings.get` method rather than a reactive subscription.

## User-visible behaviour

The settings page is organised into three `Box` panels (`SettingsPage.jsx:209-323`):

### 1. "Agenda view" (`AGENDA_VIEW`)
- Toggle: `USE_START_AND_END` — "Beperk het weergegeven uurbereik voor de dagweergave" (`nl.i18n.js:1207`).
- `TimePicker` for `startHour` and `endHour` (disabled unless `useStartEnd` is true — enforced at `SettingsPage.jsx:152-153`).
- `SelectWithSearch` for `opensAt` with options `START` / `CURRENT_TIME` / `CUSTOM` (`SettingsPage.jsx:77-90`).
- Conditional `TimePicker` for `openHour` (only when `opensAt === "custom"`).
- `SelectWithSearch` for `customRangeDays` — 2 to 6 days.

### 2. "Appointment settings" (`APPOINTMENT_SETTINGS`)
- Toggle: `FADE_EVENTS_BEFORE`.
- Label `AUTOMATIC_APPOINTMENTS_COLOR` — "Standaard kleur per type afspraak".
- Four `ColorPicker`s with the same preset palette `[theme.primary, '#42a5f5', '#2ebaee', '#feb38d', '#ee6e73', '#6b79c4']` — one each for APPOINTMENT / MEETING / PRIVATE / CONSULTATION (`SettingsPage.jsx:276-291`).

### 3. "Agenda export settings" (`AGENDA_EXPORT_SETTINGS`)
- Toggle: `EXPORT_AGENDA` — "Agenda weergeven op andere apparaten mogelijk maken".
- Displays the user's personal `privateAgendaKey` URL: `{absoluteUrl}/api/agenda/private/{privateAgendaKey}`.
- If the user has `practice.user.update.publickeys` permission, also displays a `publicAgendaKey` link for each *other* user in the practice.

### Debounced auto-save
All changes auto-save on every form change (`SettingsPage.jsx:148-167`). There is no "Save" button.

### Export agenda (iCal feed)
`app/imports/api/events/server/rest.jsx` defines `GET /api/agenda/:type/:key` where `:type` is `"public"` or `"private"`:
- Looks up a `PracticeUsers` document by `publicAgendaKey` / `privateAgendaKey`.
- Refuses (401) unless the target user's `agendaSettings.exportAgenda === true` (`rest.jsx:35-39`).
- Fetches all events for `{practiceId, userId}`; the **public** feed excludes `type: 3` (PRIVATE) events (`rest.jsx:41-47`).
- Renders them as an `.ics` via the `ics` package, including title, location text, and the therapy plan body if present.
- Content-type: `text/calendar`.

The keys themselves are generated per-user per-practice on `PracticeUsers` records — see `updateAgendaKeys` / `updateMyAgendaKeys` in `app/imports/api/practiceUsers/methods.js`.

## Permissions

- Reading your own settings: any logged-in user.
- Writing: any logged-in user (only your own doc — the method uses `this.userId` as the upsert key).
- Regenerating another user's iCal keys: `practice.user.update.publickeys` (`SettingsPage.jsx:113-125`).

## Notable details

### Start/end hour filtering
The name `useStartEnd` is misleading. It does **not** only constrain the time axis — it also *hides* events whose start or end falls outside the window. This is `Calendar.jsx:225-232`:

```
const filteredEvents = settings.useStartEnd
  ? _.filter(events, (event) => this.isBetweenStartAndEnd(event, settings) || this.isStartAndEndTimeEqual(event))
  : events;
```

Combined with the `events_outside_of_constraints` confirmation dialog, this gives therapists a way to hide their own calendar to a narrower day without first deleting events — but it also means events created in full-day view may silently disappear from a narrowed view.

### Per-user, not per-practice
A user who belongs to multiple practices sees the same `startHour`, colours, iCal toggle, etc., everywhere. The per-practice axis sits on the `PracticeUsers` side (the agenda keys are per-practice), not on `agendaSettings`.

### Colour defaults
When no colour is set on an event, the calendar uses the theme primary (`EventAddBox.jsx:123-143`). When a colour *is* set via the settings page, new events of that type pick up the colour automatically at creation time. Existing events are not retroactively recoloured.

### Seeded defaults
A missing settings document is treated as `{ customRangeDays: 3 }` (`methods.js:62`). Other fields fall back to the schema defaults at the moment they are read (`useStartEnd: false`, `opensAt: 'start'`, etc.).

## Helpdesk overlap

The helpdesk export has partial coverage: the existence of the settings page and the iCal export link are mentioned in the general getting-started article, but the `events_outside_of_constraints` confirm flow, the permissions model around `publicAgendaKey`, and the public/private feed split are all undocumented.

## Source files

- `app/imports/api/agendaSettings/agendaSettings.jsx` — schema.
- `app/imports/api/agendaSettings/methods.js` — get/update methods.
- `app/imports/api/agendaSettings/server/index.js` — method loader.
- `app/imports/modules/calendar/page/SettingsPage.jsx` — settings form UI.
- `app/imports/modules/calendar/page/CalendarPage.jsx` — reads the settings at mount, applies `opensAt`, `useStartEnd`, `customRangeDays`.
- `app/imports/modules/calendar/calendar/Calendar.jsx` — applies `useStartEnd` filter and `fadeEventsBefore` opacity.
- `app/imports/api/events/server/rest.jsx` — iCal export endpoint.
