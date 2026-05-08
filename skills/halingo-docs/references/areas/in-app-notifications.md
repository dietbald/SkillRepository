# In-app Notifications

## What this area covers

The notification inbox that collects system-generated events for the user — invitations accepted, dossier shares, low-session alerts, payment events, and similar — and surfaces them in the navbar bell, on the main dashboard, and on a dedicated notifications page.

## Features in this area

- Inbox — list every notification for the current user, newest first, with filters by category and by read / unread state.

## Notification states

- **New** — the notification has just arrived; bell shows a badge with the count.
- **Seen** — the user has opened the notifications surface; the badge clears, but each individual item is still marked unread.
- **Read** — the user has explicitly opened or dismissed the item.

The three-state model lets the bell badge clear once the user looks at the inbox while still surfacing which items they have actually engaged with.

## Where notifications surface

- **Navbar bell** — count of new notifications, accessible from every screen.
- **Dashboard tile** — quick view of the latest notifications on the main dashboard (see Main Dashboard).
- **Notifications page** — full inbox with filter, mark-all-read, and item detail.

## Notification kinds (non-exhaustive)

- Invitation accepted — when someone you invited joined the practice.
- Dossier shared with you — when a colleague granted you access to a patient dossier.
- Low-session alert — when a patient is approaching the bracket cap (see Reimbursement Tracking).
- Compliance warning — when a planned action would violate a convention rule (see Compliance Monitoring).
- Payment event — when an invoice is paid or a payment fails.

## Cross-references

- Main Dashboard — the dashboard tile and the bell badge consume the same inbox.
- Reimbursement Tracking — low-session alerts originate here.
- Compliance Monitoring — convention-rule warnings originate here.
- Identity — invitations and team-membership changes originate here.
- Payment Lifecycle — payment events originate here.
