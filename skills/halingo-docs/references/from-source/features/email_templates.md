# Email templates

> **Confirmed by the product owner 2026-04-07** (Q44 of [`../open_questions.md`](../open_questions.md)): "Only template selection and some additional modification like body text or instructions text". So the picture is: picker over four hard-coded React components, plus per-template free-form body text and instruction text inputs. There is no full WYSIWYG / authoring UI and one is not planned.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the helpdesk describes the template **picker** in practice settings but the gap list in `../../coverage_matrix.md` notes that no template **authoring** is documented.

## What it is

Transactional email templates in Halingo are **React components authored in the source tree**, not documents stored in the database. The practice owner can only:

1. Pick one of the four hard-coded invoice-mail layouts; and
2. Fill in a free-form body paragraph (`invoices.mail.text`) and a colour (`invoices.mail.color`) that the layout templates render in a fixed slot.

There is **no in-app template editor, no rich-text mail editor, no per-email authoring**. To change anything beyond the body paragraph and the accent colour, a developer has to edit the JSX file and ship a new build.

## Where it lives in the UI

Practice settings → "Mail template" section (`app/imports/ui/pages/practices/settings/PracticeSettingsPage.jsx`). The form definition is `app/imports/lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx`. Relevant fields (lines `:125-160`):

```jsx
{ type: InvoiceMailTemplatePicker, name: 'invoices.mail.template', label: 'practice.settings.invoice.mail.template', ... }
{ type: ColorPicker,                name: 'invoices.mail.color',    label: 'practice.settings.invoice.color',    ... }
{ type: TextArea,                   name: 'invoices.mail.text',     label: 'practice.settings.invoice.mail.text',... }
```

The `InvoiceMailTemplatePicker` renders four template thumbnails side-by-side; the user clicks to select one. An eye icon on each thumbnail opens a full-size modal preview (`app/imports/ui/pages/practices/settings/TemplatePicker.jsx:62-100`). There is no edit button, no text inspector, no drag-and-drop.

The invoice **print** templates have their own `InvoiceTemplatePicker` with the same picker-not-editor pattern (`InvoiceTemplatePicker.jsx`) — also selection-only.

## Data model

On the `Practices` document:

```js
practice.settings.invoices.mail.template  // integer 0..3, index into InvoiceMailTemplates array
practice.settings.invoices.mail.color     // hex color, rendered as header band in the mail
practice.settings.invoices.mail.text      // free-form paragraph injected into the layout
practice.settings.invoices.template       // integer 0..3, index into InvoiceTemplates (PDF print templates)
practice.settings.invoices.remark         // PDF "remark" text — separate from mail.text
practice.settings.invoices.extraHeader    // extra PDF header
```

None of these hold HTML or a structured email document. They are a selected index, a colour, and a single plaintext paragraph.

## The four invoice-mail templates

File: `app/imports/lib/mails/mailTemplates/invoices/patient/index.js`

```js
export const InvoiceMailTemplates = [MailTemplate1, MailTemplate2, MailTemplate3, MailTemplate4];
```

Each template is a React functional component exported from its own file:

- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate1.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate2.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate3.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate4.jsx`

The layouts differ by styling but share the same content slots. For example, `MailTemplate1.jsx:129-252` renders:

1. A full-width coloured header band (background = `practice.settings.invoices.mail.color`) with the practice logo and name.
2. A title translated from `invoices.mail.template1-3.title` / `invoices.mail.template1-3.titleRem` (reminder variant).
3. A subtitle line with the invoice amount and date (`invoices.mail.subtitle`).
4. A greeting `{invoices.mail.greeting} {translated salutation} {patient.name}`.
5. **The user's free-form paragraph**: `{_.get(practice.settings, "invoices.mail.text")}` (`MailTemplate1.jsx:232`). This is the only piece of content the practice can actually change.
6. A closing line (`invoices.mail.closing`) and a signature line (`invoices.mail.teamOf` or user.name).
7. A footer with divider, invoice attachment reference, and contact info.

All the non-user-editable copy (title, subtitle, greeting, closing, footer) is pulled from the i18n resource bundles (`app/imports/i18n/resources/**/*.js`) and is translated at send time according to `invoice.locale()`.

## Other mail templates — none are user-authorable

Under `app/imports/lib/mails/mailTemplates/`:

```
accounts/            — password reset, password changed, email verification, welcome
info/                — generic notification layouts
invoices/patient/    — MailTemplate1..4 (the four invoice layouts)
invoices/stripe/     — SaaS-subscription invoice layouts
patientFiles/        — patient-file-related notifications
practices/           — practice invitation, commission notifications
referrals/           — referral invite layouts
default.jsx          — base layout
```

Every file in this tree is a `.jsx` React component, committed to source control, imported by name from the code that sends the email. None of them are selected by the user — the invoice mail template is the **only** user-selectable template anywhere in the app. All others are hard-coded per use-case.

## Methods (Meteor)

No template-management methods exist. The `updateSettings` method updates `practice.settings.invoices.mail.template` (an integer) as one field among many in the practice settings form; it does not accept or store any template markup (`practiceSettingsInvoices.jsx:162-166`, calling `updateSettings`).

## Publications

None specific to templates. Templates are bundled into the client JavaScript at build time.

## User-visible behaviour

- On practice settings, the user sees four thumbnail previews. Clicking a thumbnail selects it and debounce-saves to `practice.settings.invoices.mail.template`.
- A colour picker lets the user choose the header band colour.
- A plaintext `TextArea` lets the user write one or more paragraphs that will appear as the body of every invoice mail sent out by the practice.
- A language / locale picker is **not** part of this form — the email locale is chosen automatically based on the patient's or practice's preferred language.
- There is no WYSIWYG editor, no variable-insertion toolbar, no preview of how the final mail will look with the user's actual body text merged in (the picker previews use placeholder invoice data).
- The same pattern applies to invoice **print** templates: four layouts, colour + remark, no authoring.

## Permissions

- Editing practice settings requires `practice.settings.update` (`PracticeSettingsPage.jsx:27`).
- Only users with that permission see the mail template picker at all.

## Notable details

- **Four templates are the maximum**. Adding a fifth requires editing `index.js` to import a new `MailTemplate5.jsx` and push it onto the exported array, then rebuilding.
- **Reminder variants are the same layout with a different title key** (`invoices.mail.template1-3.titleRem`), not a separate template. The `invoice.reminder` prop flips the title.
- **Translation keys are fixed per template**. `MailTemplate1` and `MailTemplate3` share `invoices.mail.template1-3.title*`; templates 2 and 4 have their own keys. Copy edits happen by changing i18n resources, not by editing the template file.
- **The practice mail template picker appears in one place only** — `practiceSettingsInvoices.jsx`. There is no analogous picker for password reset / verification / practice invite / subscription mails.
- **PDF invoice templates follow the same pattern** — four `InvoiceTemplate1..4` React components selected by an index (`app/imports/modules/invoices/patient/templates/index.js:6`).

## Helpdesk overlap — confirming the gap

The helpdesk documents that the user can *pick* an invoice mail template in practice settings. The helpdesk gap list in `../../coverage_matrix.md` notes that **email template authoring** is not documented.

**Code confirms: there is no authoring UI.** Templates are React components in the source tree, selectable by index. The only free-form user content in an email is:

- `invoices.mail.text` — one paragraph of body copy (plaintext, inserted verbatim into a fixed slot in the layout).
- `invoices.mail.color` — the header band colour.

Everything else — layout, typography, copy around the body paragraph, footer, reminder-vs-normal wording — is committed code.

> If the product team wanted to let practices author their own templates, it would require a new collection (`mailTemplates` or similar), a new editor UI, a templating engine (Handlebars / MJML / similar), and migration of the hard-coded i18n copy out of the React components. None of that exists.

## Source files

- `app/imports/lib/mails/mailTemplates/invoices/patient/index.js`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate1.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate2.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate3.jsx`
- `app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate4.jsx`
- `app/imports/lib/mails/mailTemplates/` (every other per-use-case template tree, none user-selectable)
- `app/imports/ui/pages/practices/settings/InvoiceMailTemplatePicker.jsx`
- `app/imports/ui/pages/practices/settings/InvoiceTemplatePicker.jsx`
- `app/imports/ui/pages/practices/settings/TemplatePicker.jsx`
- `app/imports/ui/pages/practices/settings/PracticeSettingsPage.jsx`
- `app/imports/lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx`
- `app/imports/modules/invoices/patient/templates/index.js` (the print-template index)
