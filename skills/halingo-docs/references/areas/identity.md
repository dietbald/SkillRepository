# Identity

## What this area covers

User account lifecycle: signup, login, logout, password management, email management, profile, multi-practice membership, role-based access control, invitations, terms-of-service acceptance, and team management within a practice.

## Features in this area

- Signup — new user creates an account.
- Login and logout — credentialed sign-in, with session lifetime appropriate to a clinical SaaS.
- Password management — change password, request reset by email, set new password from reset link.
- Email management — change the email address on a user account (with verification).
- Profile — manage personal details (name, gender, profile photo, preferred UI language).
- Terms of service — first-login acceptance flow; users cannot use the app until accepted.
- Invitations — practice owners and administrators send a one-click invite by email; the recipient creates an account or joins an existing one and lands inside the practice.
- Team management — practice owner / administrator can manage members (add, remove, edit role, view member detail) for the practices they manage.
- Role-based access control — each user holds one role per practice they belong to; the role governs what the user can see and do in that practice context.

## Roles in a practice

A user belongs to one or more practices. For each practice, the user has exactly one role:

- **Praktijkverantwoordelijke (owner)** — full administrative authority over the practice, including financial visibility across all members and the ability to manage subscriptions and integrations.
- **Beheerder (administrator)** — can manage members and view peers' invoices, but cannot change the subscription or transfer ownership.
- **Lid (member)** — regular therapist; sees their own work and dossiers but does not see peers' financials.

Roles are practice-scoped: the same person can be an owner in one practice and a member in another.

## Authentication notes

- Login is by email + password. There is no SSO in the current product.
- Password resets are email-based; reset links expire on use or after a short window.
- Multi-language UI: each user picks their preferred interface language (Dutch, French, German, English) on their profile. This preference is independent of any practice-level language setting (e.g. invoice locale).
- Multi-practice membership: a user with multiple practices uses an in-app practice switcher to choose which practice context to work in.

## Belgian / regulatory notes

- Therapists logging into Halingo are paramedical professionals with a RIZIV/INAMI number. The number is part of the user profile because it is required on every reimbursable certificate the therapist produces.
- Patient health data is accessed through these accounts; access is logged and bound to an identified care provider, in line with the GDPR Art. 9 (special-category data) and Belgian Patient Rights Law accountability requirements.
- The Belgian Kwaliteitswet treats clinical activity as the personal responsibility of the named therapist — accounts are personal, not shared between colleagues.

## Cross-references

- Practice Branding — practice-level settings (logo, accent color, invoice template) are scoped per practice and respected after the user switches practice context.
- Patient Data Privacy — RBAC at the practice level combines additively with per-dossier access control.
- SaaS Lifecycle — only the praktijkverantwoordelijke can manage the practice's subscription, payment method, and plan changes.
- In-app Notifications — invitation events and password-reset confirmations surface here.
