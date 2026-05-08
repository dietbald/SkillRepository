# Practice Branding & Practice Management

## What this area covers

Per-practice configuration that customises how Halingo presents the practice to patients and to its own members — logo, accent color, invoice template, mail templates, and the practice switcher used by people who belong to several practices.

## Features in this area

- Create practice — a new practice is created (typically by the founder / praktijkverantwoordelijke) and seeded with default branding.
- Practice info — name, address, contact details, BTW number, the RIZIV/INAMI numbers and bank accounts of the practice and its members.
- Mail settings — sender name, sender email, the email template used for outbound communications.
- Invoice settings — the invoice layout / template, default invoice locale (NL / FR), invoice numbering prefix, default footer comment.
- Practice switcher — for users who belong to multiple practices, a UI control to switch the active practice context.

## Key product behaviors

- Branding is **per practice**, not per user. A user who belongs to two practices sees the appropriate branding in each context.
- The invoice template selection drives the visual layout of patient invoices, certificate-accompanying documents, and verzamelstaten.
- The accent color is applied to the in-app navigation chrome so a therapist can tell at a glance which practice they are currently working in.
- The mail-template selection drives the look-and-feel of automated emails (e.g. invoice delivery emails) sent on the practice's behalf.
- Practice creation is the on-ramp to a Halingo subscription (see SaaS Lifecycle): a new practice typically starts on a free trial and converts to a paid plan on first successful charge.

## Settings versus user preferences

- **Practice-level** (this area): logo, accent color, invoice template, mail template, default invoice locale, footer comment, practice contact details.
- **User-level** (Identity): UI language, profile photo, personal email signature.

The two layers are independent: a French-speaking therapist working in a Dutch-language practice will see the Halingo UI in French while invoices to that practice's patients are issued in Dutch.

## Cross-references

- Identity — the practice switcher and per-practice role assignments.
- Smart Invoicing — invoice template, locale, and footer flow into every generated invoice.
- Patient Communication — mail template controls outbound email styling.
- SaaS Lifecycle — practice creation triggers subscription onboarding.
