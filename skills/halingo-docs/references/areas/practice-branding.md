# Practice Branding + Practice Management

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Logo, invoice templates, accent color, mail/invoice settings, switcher.

## Spec contracts (Phase 2)

- **create-practice** — Feature: practice/create-practice
  - Path: `02-specs/practice/create-practice/spec.md`
- **deprecated-do-not-port** — Feature: practice/deprecated-do-not-port
  - Path: `02-specs/practice/deprecated-do-not-port/spec.md`
- **invoice-settings** — Feature: practice/invoice-settings
  - Path: `02-specs/practice/invoice-settings/spec.md`
- **mail-settings** — Feature: practice/mail-settings
  - Path: `02-specs/practice/mail-settings/spec.md`
- **practice-info** — Feature: practice/practice-info
  - Path: `02-specs/practice/practice-info/spec.md`
- **practice-switcher** — Feature: practice/practice-switcher
  - Path: `02-specs/practice/practice-switcher/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/practice-branding.md`)

# Discovery: Practice Branding

**Area:** #2 Practice Branding (from `application_map.md` § 2, competency 2 — "Customizing the look and feel of outgoing documents (Invoices/Emails)").

**Scope in one breath:** everything that lets a praktijkverantwoordelijke (owner) or beheerder (admin) shape what a patient, a Ziekenfonds, or a colleague sees when they look at a document coming out of the practice — the practice's visible identity (name, logo, address, VAT/BTW, RIZIV company number, bank account, phone/email contact) plus the user-tunable knobs on the invoice print pipeline (template index 0–3, accent color, extra header text, footer remark, structured-announcement format) and on the patient-invoice email pipeline (mail template index 0–3, mail accent color, mail body paragraph), the practice logo upload, the new-practice wizard (step 1 "details"), and the topbar practice switcher. Excludes per-user billing identity (user profile RIZIV / bank account / invoice personal note — area #1 Identity Management), the SaaS subscription page and plan picker (area #20 SaaS Lifecycle — touched only to the extent the new-practice wizard's step 2/step 3 depend on it), the actual invoice generation pipeline and the PDF / mail content that consumes the branding (areas #11 Smart Invoicing / #12 Payment Lifecycle / #16 Patient Communication), patient-file notification defaults on the settings page (belongs to patient management / scheduling), practice chat (area #16 Patient Communication, and deprecated anyway), and practice user roster management (identity / area #1).

**Date:** 2026-04-09
**Agent:** Claude Code `general-purpose` subagent — **synthesis pass picking up after a previous dispatch hit a 529 Overloaded error ~18 min in**. The previous dispatch successfully captured **Source 3 (14 staging screen captures with companion JSON output logs)** before dying; this pass synthesizes them and does fresh reads for Source 1 (HalingoDoc) and Source 2 (Meteor source).
**Legacy baseline:** `/home/tj/Repos/Halingo-Main` at checkout from 2026-04-06.

> **Scope discipline reminder:** this file describes the **legacy Meteor app only**. It contains zero references to what exists in the Nx monorepo, no gap analysis, no coverage annotations, no implementation suggestions. Phase 2 spec authoring is where legacy descriptions get compared against the current Nx state; Phase 1 must stay correct in 6 months regardless of what the Nx app looks like today. See `06-prompts/halingo-discoverer.md` § "The ONE critical scope rule".

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Curated | `docs/coverage_matrix.md` | 163 | § "Functional groupings" row 2, § "Concepts present in helpdesk" #15 + #17 | Row 2 flags Practice Branding as **"Well covered"** with primary source `settings_practice_management.md`. Concept #17 flags per-praktijk invoice language as deprecated. Concept #15 flags "two-level invoice comments" as helpdesk-only fiction — code only supports practice-level (`settings.invoices.remark`) and user-level (`invoices.personalNote`); no per-dossier field. |
| Curated | `docs/functional/application_map.md` | 62 | § 2 competency 2, § 1.E "Settings & Practice Management" screens | Formal area definition: "Customizing the look and feel of outgoing documents (Invoices/Emails)". The screen list names three relevant screens: "General Practice Settings" (well covered), "Email Template Editor" (partial, selection + color only — no authoring), "Subscription Management" (well covered; adjacent to #20 SaaS Lifecycle). |
| Curated | `docs/functional/user_stories.md` | — | ctrl-F branding / practice / logo / invoice / template | **No dedicated user story for Practice Branding.** US.01/US.02 on dashboard + practice management touch adjacent concerns. Owner activities are implied throughout but never enumerated for branding. |
| Curated | `docs/glossary.md` | — | § Belgian terms | Confirms the three-tier role vocabulary: *praktijkverantwoordelijke* (owner) / *beheerder* (admin) / *lid*. Branding actions are owner/admin-only. |
| Helpdesk | **`full_documentation/settings_practice_management.md`** | 250 | full | The seven articles that cover this area in the helpdesk (NL only, all ~45 broken Zendesk image URLs): "Commissie genereren als praktijkverantwoordelijke", **"Instellingen automatisch mailen facturen"** (template picker + accentkleur + standaardtekst), **"Praktijk chat uitschakelen"** (deprecated), **"Taal praktijk wijzigen"** (per-praktijk invoice locale — **deprecated** per `deprecation_list.md` #18), **"Gegevens praktijk invullen/wijzigen"** (inline edit of praktijkinfo), **"Nieuwe praktijk aanmaken"** (three-step wizard: details → plan → payment with BTW check + trial explanation), **"Praktijklogo toevoegen/wijzigen"** (drag/drop or URL, cropper, skippable). |
| Code-derived | `from_source/README.md` | — | overview | Standard provenance warning — the `from_source/` tree was extracted 2026-04-07 and file:line citations may have drifted slightly. |
| Code-derived | `from_source/inventory.md` | — | ctrl-F branding / practice | Practice Branding has no dedicated feature file in `from_source/features/` — it's distributed across `email_templates.md` (the picker), `invoices_overview.md` + `patient_invoices.md` (how the stored settings flow into generated invoices), `main_dashboard.md` (practice switcher entry + `currentPracticeId` local-storage), and `saas_subscriptions.md` (the new-practice wizard step 2/3 flow). |
| Code-derived | **`from_source/features/email_templates.md`** | 146 | full | The canonical description of the picker-not-editor pattern. Four hard-coded React components (`MailTemplate1..4.jsx`), the practice can only pick one by index (`settings.invoices.mail.template` ∈ 0..3), fill the `invoices.mail.text` paragraph, and choose `invoices.mail.color` (hex). No in-app editor, no variable toolbar, no preview with merged text. Same picker-not-editor pattern applies to the print template (`settings.invoices.template` ∈ 0..3, four `InvoiceTemplate1..4` React components in `modules/invoices/patient/templates/`). Reminder variants are the same layout with a different title key (`invoices.mail.template1-3.titleRem`). Product owner confirmed Q44 2026-04-07: "Only template selection and some additional modification like body text or instructions text." |
| Code-derived | `from_source/features/invoices_overview.md` | — | § "Data model" § "Permissions matrix" § "What is not in this module" | Confirms: `meta` on every `patientFileInvoices` row is a snapshot of `practice.settings.invoices` merged over `user.settings.invoices` (`server/util.js:199-202`), so a branding change does **not** retroactively update already-issued invoices — the branding on a past invoice is frozen to what it was the moment the invoice was generated. Also confirms the ownTariffs switch in `accessibility.jsx:50` is dead. |
| Code-derived | `from_source/features/patient_invoices.md` | — | § "meta" field, § locale retraction banner | The branding fields the mail/print templates consume: `meta.template`, `meta.color`, `meta.extraHeader`, `meta.remark`, `meta.personalNote`, `meta.locale`, `meta.mail.template`, `meta.mail.color`, `meta.mail.text`, `meta.communicationStructure`, `meta.type` (one of `PRACTICE` / `MEMBER`). The locale retraction banner at the top of the file is authoritative: `practices.settings.invoices.locale` is the deprecated field; the user's own locale drives rendering. |
| Code-derived | `from_source/features/main_dashboard.md` | — | § Personalization → Per-practice scope | Confirms that the active practice is identified purely by `localStorage.currentPracticeId`, read once at layout boot time; cross-practice widget scope (notifications, todos, newsfeed, weekly chart) is user-scoped NOT practice-scoped, so switching practices affects only the open-bills widget. The topbar practice switcher (screen 14 in Source 3) is the only place in the app that writes `currentPracticeId`. |
| Code-derived | `from_source/features/saas_subscriptions.md` | — | §§ "Where it lives in the UI", `NewPracticePage`, trial | The three-step new-practice wizard: step 1 practice details (covered here), step 2 plan selection (cross-area #20), step 3 payment method (cross-area #20). A brand-new practice gets a 30-day trial automatically unless the owning user has used one before. The new-practice flow is the only path to creating a `Practices` row. |
| Code-derived | `from_source/features/practice_chat.md` | — | § "DO NOT MAINTAIN OR EXTEND" banner, § "Practice-level setting" | Confirms `settings.chat.disabled` still ships as a setting on `PracticeSettingsPage`, but the entire feature is retiring per `deprecation_list.md` #1. The chat toggle box is visually part of "practice branding/settings" but belongs to a deprecated feature — **flag the toggle as DO NOT PORT** even though it's still on the settings page. |
| Cross-cutting | **`from_source/deprecation_list.md`** | 183 | full, ctrl-F "practice", "chat", "locale", "ownTariffs", "template" | Four items directly relevant. **#1 Practice chat — 🔥 kill product-wide** (the `settings.chat.disabled` checkbox on `PracticeSettingsPage`). **#10 `practice.ownTariffs` toggle — 🧹 dead code** (`lib/formSchemas/practices/accessibility.jsx:46-60`, bound to the wrong schema with an empty submit callback; the form is not actually mounted on `PracticeSettingsPage` but the field exists). **#18 `practices.settings.invoices.locale` — 🪦 legacy — do not port** (Q25: "We should not use practice locale"; the field still populates via the Locale Select element on `practiceSettingsInvoices.jsx:46-57` and is set at new-practice creation time in `_addPractice:45`). Also tangentially: the helpdesk "Per-praktijk invoice language" article should be flagged obsolete. |
| Cross-cutting | **`from_source/bugs_and_security_findings.md`** | 158 | ctrl-F "practice", "settings", "template", "mail", "locale", "logo" | No bug directly flagged against the practice-branding surface. Adjacent: the `stripeInvoices` schema validation is commented out (§ 3.1) — affects the SaaS invoice row the new-practice wizard creates at step 3, but that's cross-area #20. The test Stripe `pk_test_...` key hardcoded in `PracticeSubscriptionInvoicePaymentPage.jsx:17` is adjacent but not on the branding surface proper. |
| Cross-cutting | `from_source/open_questions.md` | 161 | ctrl-F Q25, Q26, Q42, Q44 | Q25: "Does any production practice have `settings.invoices.locale === 'fr'`?" — unresolved; matters because the deprecated field may have live data. Q26: "Is the `settings.chat.disabled` toggle used?" — product owner said kill the chat entirely. Q42: "Practice chat helpdesk vs code" — covered by Q26. Q44: "Email template authoring?" — confirmed picker-only. |
| Cross-cutting | `from_source/inventory.md` | — | light read | Cross-reference confirmed there is no `from_source/features/practice_branding.md` or `practice_settings.md` — the area is assembled from pieces of the files above. |
| Cross-cutting | `from_source/scout_pass.md` | — | light read | First-pass scan findings; no contradictions. |
| Cross-cutting | `from_source/technical/collections.md` | — | ctrl-F Practices | Confirms `practices` is the collection; schema fields listed match `practices.jsx`. |
| Cross-cutting | `from_source/technical/routes.md` | — | ctrl-F practices | Confirms FlowRouter paths for the area: `/practices` (overview), `/practices/settings`, `/practices/new`, `/practices/users`, `/practices/subscription`. |
| Cross-cutting | `from_source/technical/methods.md` | — | ctrl-F practice.update / practice.settings.update / practice.add / practice.vat.check | Confirms the five Meteor method names that land on this area: `practice.add`, `practice.update`, `practice.settings.update`, `practice.vat.check`, `practice.certificate.get`. |

**Files-read count:** 1 helpdesk file read in full (`settings_practice_management.md`) + 5 curated files (coverage_matrix, application_map, user_stories, glossary, plus inventory references) + 6 code-derived feature files (email_templates full, invoices_overview/patient_invoices/main_dashboard/saas_subscriptions/practice_chat partial) + 2 code-derived cross-cutting lists (deprecation_list full, bugs_and_security_findings ctrl-F, open_questions ctrl-F) + 4 code-derived technical / inventory files (inventory, scout_pass, collections, routes, methods) = **~19 HalingoDoc files** touched.

### What HalingoDoc covers for this area

HalingoDoc covers practice branding **well on the helpdesk side**: `settings_practice_management.md` enumerates step-by-step NL screenshots-and-instructions flows for every user-visible branding action — edit praktijkinfo inline, upload/replace logo via drag-drop-or-URL with an optional cropper, select an invoice mail template (with color + body text), toggle chat off (deprecated), set the per-praktijk invoice locale (deprecated), and create a new practice end-to-end. The code-derived side complements with the picker-not-editor reality check (`email_templates.md` § "What it is"), the precise list of branding fields on the `Practices` schema (visible via the field listing on the feature files), and the crucial invoicing detail that `meta` on every `patientFileInvoices` row is a **frozen snapshot** of the branding at invoice-generation time, so branding changes never retroactively update past invoices (`invoices_overview.md` § "meta field"; `patient_invoices.md` § "meta" row on the schema table).

The **four deprecation flags that shape this area**:

1. **`practices.settings.invoices.locale`** (`deprecation_list.md` #18) — the field still populates (new-practice creation explicitly copies the owner user's locale into it at `_addPractice:45`; the settings form still has a Select for it at `practiceSettingsInvoices.jsx:46-57`), but product owner said "we should not use practice locale". **DO NOT PORT as a UI control.** Data migration question: Q25 of `open_questions.md` is unresolved — do any production practices have `fr` set?
2. **`practice chat` (`settings.chat.disabled`)** (`deprecation_list.md` #1) — the toggle still renders in the `PracticeSettingsPage` "Chat" box (screen 01 confirms), but the entire practice-chat feature is being killed. **DO NOT PORT the toggle or the feature.**
3. **`practice.ownTariffs` toggle** (`deprecation_list.md` #10) — dead form field in `accessibility.jsx:46-60`; not mounted on `PracticeSettingsPage` today, but the form field declaration still exists in the schema tree. **DO NOT PORT.**
4. **"Two-level invoice comments" concept #15 from the coverage matrix** — helpdesk fiction. No per-dossier invoice comment field exists in code; there is only `practice.settings.invoices.remark` (practice-level) and `user.settings.invoices.personalNote` (per-user). **Don't implement a per-dossier override when porting the remark field.**

### What HalingoDoc does NOT cover for this area

- **The full list of `Practices.schema` fields touched by the edit-info form vs the settings form.** The helpdesk article for "Gegevens praktijk invullen/wijzigen" says "click the line to edit" but does not enumerate the form fields. Source 2 (below) confirms: `praticeEdit.js` edits `name`, `address`, `contact.email`, `contact.phoneNumber`, `contact.gsmNumber`, `companyNumber`, `vatInfo` (via `VatBox`, with a side-button that calls `practice.vat.check`), `bankAccount` (with `iban.printFormat`), and `info` (textarea). This is the full edit surface and it is **not** reached from `/practices/settings` — it lives on `/practices` (the overview page, via `PracticeInfo_Form`).
- **That the logo upload and the edit-info form live on `/practices` (the overview page) while the invoice template / color / mail / chat / ownTariffs settings live on `/practices/settings`.** The helpdesk articles describe the two screens separately but don't make the route distinction explicit; the discovery needs to preserve it because a porter could easily collapse them. See Source 2 — the overview page is `PracticesOverviewPage.jsx` mounting `PictureContainer` + `FormContainer` from `PracticeInfoContainer`, while the settings page is `PracticeSettingsContainer` → `PracticeSettingsPage.jsx`.
- **That the `PracticeSettingsPage` form is fully hidden from `lid` users by a `PermissionRender('practice.settings.update', ...)` wrapper.** HalingoDoc does not spell out that a lid user sees an essentially blank page; Source 3 screen 04 confirms the body is ~270 bytes (vs. ~4920 for owner/admin).
- **That the settings form is additionally gated by `hasActiveSub`** — when the practice has no active subscription, `LiveEditableForm readOnly={!props.hasActiveSub}` makes the entire form read-only for owner/admin as well. This is documented on `PracticeSettingsPage.jsx:33,46,59` but not in HalingoDoc.
- **The `invoices.type` picker** (`Practices.invoiceTypes.PRACTICE` vs `MEMBER`) — `practiceSettingsInvoices.jsx:26-40` has a Select for this that determines whether the invoice sender block shows the practice identity or the individual therapist's identity. HalingoDoc does not mention it. It materially changes what the recipient sees on an invoice. Essential to preserve.
- **The `communicationStructure` picker** — `practiceSettingsInvoices.jsx:89-103` selects one of four formats (`FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`) for the invoice's structured announcement / OGM field. Default when absent is `NAME-DATE-NUMBER` (hard-coded fallback in `PracticeSettingsPage.jsx:21-22`). Not in HalingoDoc.
- **That the `extraHeader` field** on `settings.invoices.extraHeader` is a separate textarea from the `remark` field — both are rendered in the invoice print template at different positions. HalingoDoc does not distinguish them.
- **The new-practice wizard's `usedTrial` flag semantics** — `Practices.usedTrial` (`practices.jsx:115`) tracks whether a user has already consumed the 30-day free trial, so a second practice doesn't get a second trial. This is covered in `saas_subscriptions.md` but not in HalingoDoc's step-by-step article.
- **That inline editing on `PracticeInfo_Form` uses `LiveEditableForm` with debounce auto-save** (same 500ms pattern as user profile), not a manual save button. HalingoDoc shows "click and type" which is consistent with auto-save but doesn't explain the debounce semantics.
- **That the logo is uploaded through `ProfilePicture` — the same component used for user profile avatars** — and the back-end persistence is `updatePractice.call({imageUrl: url}, ...)` in `PracticeInfo.jsx:19`. The actual upload pipeline (cropper, S3 URL return) is shared with user avatars and lives outside this area.

### Direct citations worth preserving

> From `from_source/features/email_templates.md:8-14`:
>
> > Transactional email templates in Halingo are **React components authored in the source tree**, not documents stored in the database. The practice owner can only:
> >
> > 1. Pick one of the four hard-coded invoice-mail layouts; and
> > 2. Fill in a free-form body paragraph (`invoices.mail.text`) and a colour (`invoices.mail.color`) that the layout templates render in a fixed slot.
> >
> > There is **no in-app template editor, no rich-text mail editor, no per-email authoring**. To change anything beyond the body paragraph and the accent colour, a developer has to edit the JSX file and ship a new build.

> From `from_source/features/email_templates.md:43` (data model):
>
> > None of these hold HTML or a structured email document. They are a selected index, a colour, and a single plaintext paragraph.

> From `from_source/deprecation_list.md:108-112` (entry #18, `practices.settings.invoices.locale`):
>
> > **Why legacy:** product owner: "We should not use practice locale". The intended rule is to always use the user's locale. This is recorded as a memory (`halingo_locale_rule.md`).
> > **What this means for `Halingo-Main`:** do not propose a UI for setting the practice locale. Do not document it as a current product feature.

> From `from_source/deprecation_list.md:17-26` (entry #1, practice chat):
>
> > **Why killed:** barely used.
> > […]
> > - Kill switch: `practices.settings.chat.disabled` (already exists; effectively a feature flag)
> > […]
> > **Helpdesk impact:** the helpdesk article documenting how to disable chat should be marked obsolete.

> From `from_source/deprecation_list.md:67-70` (entry #10, `practice.ownTariffs`):
>
> > **Where:** `lib/formSchemas/practices/accessibility.jsx:46-60`. Bound to the wrong schema, no consumer, empty submit callback.
> > **Status:** "Got pulled" — was a per-practice tariff override feature that was abandoned.

> From `full_documentation/settings_practice_management.md:67-76` (NL helpdesk, invoice mail template article — the closest the helpdesk comes to describing the feature):
>
> > **Kies** een **sjabloon** voor de mail die uw patiënten ontvangen. **Klik** op het **sjabloon** van uw keuze. […] Indien u wenst, kan u de accentkleur van het sjabloon aanpassen. Selecteer hiervoor dan een andere kleur. […] **Formuleer** als laatste de **standaardtekst** die in de mail moet verschijnen.

> From `full_documentation/settings_practice_management.md:177` (NL helpdesk, new-practice wizard — trial semantics stated in user-facing language):
>
> > **LET OP!** Het aanmaken van een nieuwe praktijk betekent dat u een extra abonnement zal moeten aangaan. Een abonnement geldt immers per praktijk. Indien het u eerste praktijk is die u aanmaakt, hebt u recht op 1 maand gratis proefperiode.

---

## Source 2 — Meteor source slice

### Files read (14 total)

Flat list grouped by directory. Starting points taken from (a) the Meteor method names cited in `from_source/technical/methods.md` (`practice.add`, `practice.update`, `practice.settings.update`, `practice.vat.check`), (b) the form schema files cited by `email_templates.md`, and (c) the route table in `from_source/technical/routes.md` for `/practices/new`, `/practices/settings`, `/practices`. Walked outward from imports.

- `app/imports/api/practice/` (5 files)
  - `practices.jsx` — `Practices` collection + `Practices.communicationStructures` enum (4 values) + `Practices.invoiceTypes` enum (`PRACTICE`, `MEMBER`) + full SimpleSchema with every branding field + helpers `getCompanyNumber()`, `getVat()`, `image()` + `Practices.publicFields` + `placeholderPractice` (with `/img/placeholder-image.png` default logo).
  - `methods.jsx` — six branding-relevant methods: `addPractice` (name `practice.add`), `updatePractice` (`practice.update`, whitelists a short field list on update), `updateSettings` (`practice.settings.update`, spreads settings sub-schema, subscription-gated), `checkVat` (`practice.vat.check`, calls `validate-vat` npm + fallback to apilayer.net HTTP), `getPracticeCertificate` (`practice.certificate.get`, returns the subset of practice identity needed to render a certificate number block). Two more methods (`addChatMessage`, `updateRead`) are practice-chat — deprecated and cross-area.
  - `util.jsx` — thin client/server-shared wrapper; `isUserOfPractice`, `getPracticeIdsOfUser`.
  - `server/util.tsx` — the server-only brain. `_addPractice` (line 38-78) inserts the new practice, sets `settings.invoices.locale` from the creator's user locale at line 45, then creates the PracticeUsers row with `role: owner`, then delegates to `SubscriptionUtil` for payment/trial setup. Also `_createSourceForInvoice`, `_chargeSource`, `_setInvoiceStateFromCharge` (SaaS invoice payment — cross-area #20), `_checkVat`, `_handleReferralOnPay`.
  - `server/hooks.js` — `Practices.after.update` fires when `settings.patientFiles.notifications.date` or `.sessions` change, to rebind treatment observers (cross-area with scheduling). Also the 5-min Rosa pull `setInterval` deprecation-list #21 (cross-area #18).
  - `server/publications.jsx` — `practices` (all user's practices, via `PracticeUsers` tracking) + `practice` (single practice with ACL via `PracticeUtil.isUserOfPractice`) + `practiceInvoices` (SaaS invoices, cross-area #20) + `practicechat` (deprecated).

- `app/imports/api/practiceUsers/` (1 file, relevant lines only)
  - `practiceUsers.jsx:1-153` — the role permission matrix. `practice.settings.update` and `practice.update` are on both `owner` (lines 26-27) and `admin` (lines 92-93), **neither on `default` (lid)**.

- `app/imports/lib/formSchemas/practices/` (4 files)
  - `praticeAdd.jsx` — the new-practice wizard FormSchema orchestrator. Three steps: DETAILS (1) / PLAN_SELECT (2) / PAYMENT (3). Step 1 uses `DetailsDefinition` from `praticeEdit.js`. Step 2 uses `PlanSelectionDefinition`. Step 3 uses `PaymentsDefinition`. Terminal `addPractice.call(data, cb)`.
  - `praticeEdit.js` — the edit form schema used by both `PracticeInfo_Form` (inline edit on `/practices`) AND `NewPracticePage` step 1 (`DetailsDefinition`). Four columns: (1) `name` + `address` nested form, (2) `contact.email` + `contact.phoneNumber` + `contact.gsmNumber`, (3) `companyNumber` + `vatInfo` (via `VatBox` with the side-button VAT check), (4) `bankAccount` (IBAN-validated, rendered via `iban.printFormat`). Plus a bottom row with `info` textarea. Terminal: `updatePractice.call(_.omit(data, 'usedTrial'), cb)`.
  - `accessibility.jsx` — **DEAD**. Contains three switches (`invoiceNameTherapist`, `accessCalenderColleg`, `ownTariffs`) but is not mounted anywhere in the settings tree. The form's terminal callback is an empty arrow function (`(data, cb) => {}`). The `ownTariffs` field specifically is deprecation-list #10.
  - `settings/practiceSettingsInvoices.jsx` — the main practice branding form. Ten form elements in order:
    1. `invoices.type` Select (PRACTICE | MEMBER) — who appears as invoice sender.
    2. `invoices.locale` Select (NL | FR) — **deprecated** per #18 but still in the form.
    3. `invoices.template` → `InvoiceTemplatePicker` (four print-template thumbnails + eye-icon preview modals).
    4. `invoices.color` → `ColorPicker` (print-template accent color).
    5. `invoices.communicationStructure` Select (4 values) — structured announcement / OGM format.
    6. `invoices.remark` → `TextArea` — footer remark on printed invoices.
    7. `invoices.extraHeader` → `TextArea` — extra header block on printed invoices.
    8. `invoices.mail.template` → `InvoiceMailTemplatePicker` (four mail-template thumbnails + previews).
    9. `invoices.mail.color` → `ColorPicker` (mail accent color — labelled the SAME as `invoices.color` i18n key, which is a minor bug: same label for two different color fields).
    10. `invoices.mail.text` → `TextArea` — free-form body paragraph injected into the mail layout.
    All wired to `updateSettings` as the terminal method, using `updateSettingsSchema`.
  - `settings/practiceSettingsChat.jsx` — single `Checkbox` for `chat.disabled`. **Deprecated** per #1.
  - `settings/practiceSettingsPatientFileNotifications.jsx` — two number inputs for `patientFiles.notifications.sessions` (default 10) and `.date` (default 7). **Cross-area** (scheduling / patient-file notification defaults); listed here because it's the third box on `PracticeSettingsPage.jsx`.

- `app/imports/ui/pages/practices/` (5 files)
  - `PracticesOverviewPage.jsx` — the `/practices` page. Four tiles in a row (logo/picture tile with `PictureContainer`, users tile linking to `/practices/users`, subscription tile linking to `/practices/subscription` — gated by `practice.subscriptions.change` permission but that permission is dead per deprecation-list #8 so the gate is effectively no-op, and settings tile linking to `/practices/settings` gated by `practice.settings.update`). Below the tile row: `FormContainer` (the full `PracticeInfo_Form` inline edit). Further below: `PracticePatientFileStatistics` + `PracticePatientFileCommission` (cross-area). The commented-out `TeamMeetingBox` lives here under `ComingSoon` — deprecated #20.
  - `PracticeInfo.jsx` — exports two components: `PracticeInfo_Profilepicture` (the logo upload tile — mounts `ProfilePicture` with `cropperProps={{aspectRatio: null}}` and `canSkipCrop`; `onImage` callback saves via `updatePractice.call({imageUrl: url}, ...)`) and `PracticeInfo_Form` (the inline-editable `LiveEditableForm` with the `praticeEdit` definition). Both gated by `updatePractice.name` permission check via `PermissionRender` AND `hasActiveSub`.
  - `NewPracticePage.jsx` — the `/practices/new` wizard (199 lines). Component-local state machine with steps {1,2,3}. Step 1 renders an inline `Form` with the `praticeEdit` `Definition` (same definition as the inline edit). `onStepChanged` validates step 1 with `addPracticeSchema.validate(addPracticeSchema.clean(...))` before allowing advance to step 2. Step 2 renders `PlanSelect` (cross-area #20). Step 3 renders `PaymentSelect` with `showTrail={true}` which is the free-trial path. Terminal `createPractice()` calls `addPractice.call(...)`, on success writes the new `_id` to `RLocalStorage.setItem("currentPracticeId", ...)` and FlowRouter navigates to `practices`. The "only trail" button label is `practice.create.onlyTrail` (NL: proefperiode).
  - `settings/PracticeSettingsPage.jsx` — the `/practices/settings` page. Three boxes wrapped in a single `PermissionRender('practice.settings.update', <...>, null, {practiceId})` — so **lid users see essentially an empty page**. Box 1 "Factuurgegevens" (`practice.settings.invoice.title`) mounts `PracticeSettingsInvoices(props.practice)`. Box 2 "Patiëntdossier-meldingen" mounts `PracticeSettingsPatientFileNotifications` (cross-area). Box 3 "Chat" mounts `PracticeSettingsChat`. All three `LiveEditableForm`s carry `readOnly={!props.hasActiveSub}` — if the subscription is inactive, the whole form is read-only. Hard-coded fallback `NAME-DATE-NUMBER` for `communicationStructure` at lines 21-22.
  - `settings/InvoiceTemplatePicker.jsx` — the print-template picker. Builds a `placeholderInvoice` (five fake events from 2017 with EUR amounts in cents) plus a placeholder address / company / patient / practice block using translated placeholder strings. Delegates to `TemplatePicker` with the real `InvoiceTemplates` array.
  - `settings/InvoiceMailTemplatePicker.jsx` — the mail-template picker. Same placeholder construction with slightly different structured-announcement logic per `communicationStructure` value. Delegates to `TemplatePicker` with `InvoiceMailTemplates`.
  - `settings/TemplatePicker.jsx` — the shared picker component. Four thumbnails at 33.375% scale (800×1131 logical px → roughly 267×378 rendered). On-click sets the template index; eye-icon-click opens a `Modal` showing the same template full-size. `readOnly` locks click handlers. No edit / text inspector / form inside a template.

- `app/imports/ui/containers/practices/` (2 files)
  - `PracticesOverviewContainer.js` — data container for the overview page (reads subscription state to compute `hasActiveSub`, passes `currentPracticeId`, therapists list).
  - `settings/PracticeSettingsPageContainer.js` — thin `withTracker` that subscribes to `practice` and passes `{practice, isLoading}`. **Does NOT pass `currentPracticeId` or `hasActiveSub`** — these must come from a parent wrapper via props (observed in Source 3 as the source of the `currentPracticeId is null` PropType warning at first render).

- `app/imports/ui/components/menu/Menu.jsx` (relevant lines only)
  - Lines 207-234 — the practice switcher dropdown. `getPracticeList()` maps `this.props.practices` into `{image, name, value}` entries and appends a synthetic `{name: "ADD_PRACTICE", value: "ADD_PRACTICE"}` entry. `onPracticeChange(value)` either `FlowRouter.go("practices.new")` for the add-practice sentinel or `RLocalStorage.setItem("currentPracticeId", value)` for a real practice ID. **This is the only place in the app that sets `currentPracticeId`** (except `NewPracticePage` creating a fresh one).

- `app/imports/startup/client/routes/practice.jsx` — FlowRouter group at prefix `/practices`. Routes: `/` (overview), `/new` (wizard), `/users`, `/users/:userId`, `/settings`, `/subscription`, `/subscription/plan/change`, `/subscription/payment/change`, `/invoices/:id/payment`. Four of these are cross-area (users + subscription-family); three are in-area (`/`, `/new`, `/settings`).

- `app/imports/lib/mails/mailTemplates/invoices/patient/` (2 files, light read)
  - `index.js` — exports `InvoiceMailTemplates = [MailTemplate1, MailTemplate2, MailTemplate3, MailTemplate4]`.
  - `MailTemplate1.jsx` (first 60 lines) — stylesheet + layout contract; confirms the header band background is `practice.settings.invoices.mail.color` (implied via `meta.color` in the placeholder builder) and the body paragraph slot accepts `{practice.settings.invoices.mail.text}`.

- `app/imports/modules/invoices/patient/templates/index.js` — exports `InvoiceTemplates = [InvoiceTemplate1, InvoiceTemplate2, InvoiceTemplate3, InvoiceTemplate4]`.

### Key symbols per file

- `api/practice/practices.jsx:12` — `Practices = new Collection("practices")`.
- `api/practice/practices.jsx:26-31` — `Practices.communicationStructures` enum (4 values).
- `api/practice/practices.jsx:33-36` — `Practices.invoiceTypes` enum (`PRACTICE`, `MEMBER`).
- `api/practice/practices.jsx:38-143` — `Practices.schema` full SimpleSchema with every branding field. Key fields: `name`, `imageUrl` (logo), `address`, `contact.*`, `companyNumber`, `vatInfo.{vatNumber,address,companyName,countryCode}`, `bankAccount` (IBAN-validated), `info`, `settings.invoices.{color,locale(deprecated),mail.{color,template,text},remark,extraHeader,template,type,communicationStructure}`, `settings.chat.disabled` (deprecated), `settings.patientFiles.notifications.*` (cross-area), `invoiceNumber` (per-praktijk counter), `customerId` (Stripe — cross-area), `usedTrial` (SaaS — cross-area).
- `api/practice/practices.jsx:147-153` — `Practices.publicFields` hides `customerId`, `invoiceNumber`, `userId`, `removed`, `removedAt` from client.
- `api/practice/practices.jsx:155` — `placeholderImage = "/img/placeholder-image.png"` (default logo fallback).
- `api/practice/practices.jsx:157-175` — helpers: `getCompanyNumber()` returns `vatInfo.countryCode+vatInfo.vatNumber || companyNumber` (i.e. VAT takes precedence over company number); `getVat()`; `image()` returns `this.imageUrl`.
- `api/practice/methods.jsx:85-97` — `addPractice` = `new LoggedInValidatedMethod({name: "practice.add", ...})`. Takes `{info, plan, payment}`. Delegates to `practicesUtil.addPractice(info, userId)` on the server.
- `api/practice/methods.jsx:103-125` — `updatePractice` = `new PermissionValidatedMethod({name: "practice.update", ...})`. **Whitelists** the field list: `address`, `bankAccount`, `companyNumber`, `contact`, `info`, `imageUrl`, `name`, `vatInfo`. Other fields on the payload are silently discarded — so even though the `practiceEdit.js` form might submit other keys, only these update.
- `api/practice/methods.jsx:131-140` — `updateSettings` = `new PermissionValidatedMethod({name: "practice.settings.update", ..., subscription: true, ...})`. Spreads the whole `settings` sub-schema into `$set: {settings}` — replaces the entire settings sub-document on every save. ⚠ **QUIRK-PRESERVE candidate**: if a concurrent tab is editing a different settings box, the last writer wins the whole `settings` object, not just their field.
- `api/practice/methods.jsx:462-485` — `checkVat` = `new LoggedInValidatedMethod({name: "practice.vat.check", ...})`. Calls the `validate-vat` npm package against the official VIES service, with fallback to `apilayer.net` (key in `Meteor.settings.vatlayer.key`). Used by the `VatBox` component on `praticeEdit.js`.
- `api/practice/methods.jsx:440-460` — `getPracticeCertificate` = `new LoggedInValidatedMethod({name: "practice.certificate.get", ...})`. Returns `{vatInfo: practice.getCompanyNumber(), address, name}` for a given practiceId. This is the handshake used by the RIZIV certificate print pipeline (cross-area #15 Precision Printing) to fetch the practice identity block — but the method itself lives in this area.
- `api/practice/server/util.tsx:38-78` — `_addPractice`. **Critical branding quirk**: line 45 sets `settings.invoices.locale` to `user.locale()` at creation time. This is the **deprecated** field (#18). Data-migration question (Q25).
- `api/practiceUsers/practiceUsers.jsx:26-27` — `practice.settings.update` + `practice.update` on owner.
- `api/practiceUsers/practiceUsers.jsx:92-93` — same on admin.
- `api/practiceUsers/practiceUsers.jsx:143-153` — `default` (lid) has ONLY `patientFile.add`, `practice.therapists.view`, `practice.user.get.practiceusers`, `practice.chat`, `practice.chat.read`. No `practice.settings.update`, no `practice.update`.
- `lib/formSchemas/practices/praticeEdit.js:18-147` — `DetailsDefinition` form with the field list above. Bound to `updatePracticeSchema` with terminal `updatePractice.call(_.omit(data, 'usedTrial'), cb)`. ⚠ **Dropping `usedTrial`** at line 145 is a workaround for the schema inheriting that field from the Practices schema.
- `lib/formSchemas/practices/accessibility.jsx:46-60` — **DEAD FORM FIELD** `ownTariffs` (deprecation-list #10).
- `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:46-57` — `invoices.locale` Select — **deprecated** per #18 but still rendering.
- `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:62-73` — `invoices.template` → `InvoiceTemplatePicker`.
- `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:78-84` — `invoices.color` → `ColorPicker`.
- `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:127-138` — `invoices.mail.template` → `InvoiceMailTemplatePicker`.
- `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:142-149` — `invoices.mail.color` → `ColorPicker` with label `practice.settings.invoice.color` — ⚠ **same i18n key as the print color label** at line 81. Likely a minor copy bug but user-visible as two fields labelled "Accent color".
- `lib/formSchemas/practices/settings/practiceSettingsChat.jsx:14-20` — the `chat.disabled` Checkbox — **deprecated** per #1.
- `ui/pages/practices/settings/PracticeSettingsPage.jsx:21-22` — hard-coded default `Practices.communicationStructures["NAME-DATE-NUMBER"]` injected when the practice has no value yet. Silent default.
- `ui/pages/practices/settings/PracticeSettingsPage.jsx:27` — `PermissionRender('practice.settings.update', <…big tree…>, null, {practiceId})` — the single gate that hides the entire form from `lid` users.
- `ui/pages/practices/settings/PracticeSettingsPage.jsx:33,46,59` — `readOnly={!props.hasActiveSub}` on all three `LiveEditableForm`s.
- `ui/pages/practices/PracticeInfo.jsx:17-45` — `PracticeInfo_Profilepicture`: `saveImage(url, done)` → `updatePractice.call({imageUrl: url}, ...)`. Gated by `hasActiveSub && PermissionRender(updatePractice.name, true, false, {practiceId})`.
- `ui/pages/practices/PracticeInfo.jsx:48-64` — `PracticeInfo_Form`: `LiveEditableForm` mounting `praticeEdit` definition, same `hasActiveSub && permission` gating.
- `ui/pages/practices/NewPracticePage.jsx:19-48` — constructor with state machine {1,2,3}.
- `ui/pages/practices/NewPracticePage.jsx:56-82` — `createPractice()` terminal: `addPractice.call({info, plan.name, payment}, (err, practiceId) => ...)`, on success `RLocalStorage.setItem("currentPracticeId", practiceId)` then `FlowRouter.go("practices")`.
- `ui/pages/practices/NewPracticePage.jsx:92-94` — step 1 renders `praticeEdit` definition via a `Form` with `stopClear={true}`.
- `ui/pages/practices/NewPracticePage.jsx:114-122` — step 1 → step 2 validation call `addPracticeSchema.validate(addPracticeSchema.clean(...))`; on validation error, the user is held on step 1 with the error overlay.
- `ui/pages/practices/NewPracticePage.jsx:179-181` — the wizard's "next" button label says `practice.create.onlyTrail` on step 3 (i.e. "start free trial" in NL/FR).
- `ui/pages/practices/PracticesOverviewPage.jsx:14-91` — the four-tile layout, with the settings tile gated by `practice.settings.update` and the subscription tile gated by the deprecated `practice.subscriptions.change` permission.
- `ui/components/menu/Menu.jsx:207-222` — `getPracticeList()` builds the switcher entries with `image`, `name`, `value`; appends `ADD_PRACTICE` sentinel.
- `ui/components/menu/Menu.jsx:228-234` — `onPracticeChange(value)` handler.
- `startup/client/routes/practice.jsx:25-76` — the four in-area routes: `/practices` (PracticesOverviewContainer), `/practices/new` (NewPracticePage), `/practices/settings` (PracticeSettingsContainer), plus `/practices/users` + `/users/:userId` which are identity-cross-ref.

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | Which screen holds the logo upload + praktijkinfo | "Click in the menu on **praktijk**. Click the current logo / info lines to edit." | Logo + inline info edit live on **`/practices`** (the overview page, via `PracticesOverviewPage.jsx` → `PracticeInfo_Profilepicture` + `PracticeInfo_Form`). The `/practices/settings` page does NOT contain the logo or the praktijkinfo fields — only the invoice settings, chat toggle, and patient-file notification defaults. | Source. The helpdesk article is vague ("praktijk" could be overview or settings). |
| 2 | Where the edit-info fields live | Says "praktijkinfo box" with click-to-edit lines | `praticeEdit.js` exports a flat FormSchema with 9+ fields spread across 4 columns + a bottom `info` textarea row. The form is mounted via `LiveEditableForm` on `/practices` AND via a nested `Form` on step 1 of `/practices/new`. Same schema in two places. | Source |
| 3 | Per-praktijk invoice language | Documented as a current feature ("Taal praktijk wijzigen") | **Deprecated** per `deprecation_list.md` #18, but the Select is still on `practiceSettingsInvoices.jsx:46-57` and `_addPractice:45` still seeds it from the user locale at creation time. | Source (disagreement with helpdesk); DO NOT PORT as a user-facing control. |
| 4 | Practice chat toggle | Documented as a current feature ("Praktijk chat uitschakelen") | **Deprecated** per `deprecation_list.md` #1. The checkbox still renders in `PracticeSettingsPage` Box 3, sourced by `practiceSettingsChat.jsx:14-20`. | Source; DO NOT PORT. |
| 5 | Accent color field count | Describes "the accent color of the template" (singular) | Two separate fields with the SAME i18n label: `invoices.color` for the print template and `invoices.mail.color` for the mail template. They are distinct values; changing one does not change the other. The identical label is a minor copy bug. | Source. User-visible implication: a new porter could assume one field. |
| 6 | Invoice type selector (PRACTICE vs MEMBER) | Not mentioned at all | `practiceSettingsInvoices.jsx:26-40` has a Select for `invoices.type` with two allowed values from `Practices.invoiceTypes`. Materially changes who appears as invoice sender. Consumed downstream by `patientFileInvoices/server/util.js` and by `getName()` helper in `patientFileInvoices.js` which branches on `isInvoiceFromPractice()`. | Source — essential to preserve. |
| 7 | Communication structure format | Not mentioned | `practiceSettingsInvoices.jsx:89-103` has a Select for `invoices.communicationStructure` with 4 values (`FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`). Drives the invoice's OGM / structured-announcement format. Hard-coded fallback to `NAME-DATE-NUMBER` when absent (`PracticeSettingsPage.jsx:21-22`). | Source — essential to preserve. |
| 8 | Extra header vs remark | Describes just "standaardtekst" (a single text field) | Two distinct textareas: `invoices.extraHeader` (header block) + `invoices.remark` (footer block). Both land in the `meta` snapshot on generated invoices. | Source — essential to preserve (two fields, not one). |
| 9 | Two-level invoice comments (per-praktijk + per-dossier) | Described in `coverage_matrix.md` § Concepts #15 as a real feature | **Helpdesk fiction** (confirmed by coverage matrix's own ❌ annotation). No per-dossier invoice comment field exists in code. Only `practice.settings.invoices.remark` and `user.settings.invoices.personalNote`. | Coverage matrix (already flagged). |
| 10 | ownTariffs (per-praktijk tariff override) | Not mentioned | Form field exists at `accessibility.jsx:46-60` but is never mounted; the form's submit callback is empty. **Dead code** per deprecation-list #10. | Source. |
| 11 | `updatePractice` method strict whitelist | Not mentioned | `methods.jsx:111-121` whitelists only 8 fields: `address`, `bankAccount`, `companyNumber`, `contact`, `info`, `imageUrl`, `name`, `vatInfo`. **Not** `settings.*`, **not** `vatInfo.*` sub-fields individually (the whole object is replaced). Silently drops anything else. | Source — QUIRK-PRESERVE candidate for test scenarios. |
| 12 | `updateSettings` replaces the entire settings sub-doc | Not mentioned | `methods.jsx:135-138` does `$set: { settings }` with the whole settings object, not a dotted-path update. Means a concurrent tab editing a different settings box will lose its write. | Source — QUIRK-PRESERVE; test for concurrent-tab races. |
| 13 | Settings form is gated by BOTH RBAC (`practice.settings.update`) AND subscription state (`hasActiveSub`) | Mentions "only praktijkverantwoordelijke or beheerder" (RBAC) | Confirmed, **plus** the entire form is `readOnly={!hasActiveSub}` on `PracticeSettingsPage.jsx:33,46,59`. A practice with an expired or trial-over subscription still renders the form but all fields are locked. | Source — cross-area with #20 SaaS Lifecycle. |
| 14 | `meta` on past invoices is a frozen snapshot | Implicit / not stated | `patient_invoices.md` documents it explicitly; `invoices_overview.md` has it in the § What is not in this module. Branding changes do NOT retroactively update already-generated invoices — this is by design. | Source — essential user-visible behavior. |
| 15 | Logo upload uses the same component as the user avatar (`ProfilePicture`) | Describes a drag-drop-or-URL with a cropper | Confirmed: `PracticeInfo.jsx:17-45` instantiates the same `ProfilePicture` component the user profile uses, with `cropperProps={{aspectRatio: null}}` (freeform crop unlike the user avatar's 1:1), `canSkipCrop`, and a custom `imageComponent` that wraps an `<img>` with `maxHeight: 175`. The upload pipeline itself (S3 presign, etc.) is shared and out of scope. | Source. |

---

## Source 3 — Local Meteor walk (reused from previous dispatch)

**Local Meteor URL:** `http://localhost:3000` (local dev instance, port 3000; MongoDB at `mongodb://127.0.0.1:27117/halingo`).
**Screens visited:** 14 (0 public + 14 gated, all with seeded test accounts; no screens flagged inaccessible during the captured portion of the walk, but **several planned screens were never reached** because the previous dispatch died mid-walk — see § "Screens not reached" below).
**Screenshots:** `/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/` (14 numbered PNG pairs + 10 JSON logs).
**Provenance:** captured 2026-04-09 14:40–14:53 by the previous Claude Code dispatch. This synthesis pass **did not re-walk any screens** — all findings here are derived from the existing JSON and PNG artifacts.

**Seeded test accounts used** (from `test-accounts-local.md`): four of the six accounts were exercised — `owner@test.halingo.local` (T7evq8joMtpfkkfTw, Practice A, NL), `admin@test.halingo.local` (rvDkWnLuiso3PWJjd), `lid@test.halingo.local` (KC6ubt3ETEMSe9qPN), and `multi@test.halingo.local` (T8aoGbo7Kh7xYThNH, owner of Practice B which is FR-locale).

### Per-screen catalog

| # | URL | Screen | Account | Language | Login phase result | Screenshot(s) | Key findings from JSON |
|---|---|---|---|---|---|---|---|
| 1 | `/practices/settings` | Practice settings page as owner | owner (T7evq8joMtpfkkfTw) | NL | `meteorUserId` set, `bodyLen=4919` (rich) | `01-practice-settings-owner-load.png`, `01-practice-settings-owner-after-login.png` | Form renders fully. Critical console warning: `The prop 'currentPracticeId' is marked as required in PracticeSettingsPage, but its value is null` — **timing/wiring bug**: the first render has no `currentPracticeId` because the `withTracker` in `PracticeSettingsPageContainer.js` doesn't pass it, it comes from a higher wrapper. Also `TemplatePickerComponent` value prop is `undefined` at first render. Multiple MUI "key X provided to classes prop is not implemented" warnings for `Button`, `Fab`, `Dialog`, `Paper` — cosmetic-only (legacy React component styling). `Practices` = 1 for this account. |
| 2 | `/practices` | Practices overview page as owner | owner | NL | `meteorUserId` set, `bodyLen=146` (sparse — may indicate mostly icons + form loaded via portal) | `02-practices-overview-owner-load.png`, `02-practices-overview-owner-after-login.png` | Four-tile layout (logo, users, subscription, settings) + `PracticeInfo_Form` below. Logo tile is `PracticeInfo_Profilepicture` with a placeholder image. |
| 3 | `/practices/settings` | Practice settings page as admin | admin (rvDkWnLuiso3PWJjd) | NL | `bodyLen=4928` (same rich form as owner) | `03-practice-settings-admin-load.png`, `03-practice-settings-admin-after-login.png` | **RBAC confirmation: admin sees the full settings form identical to owner.** The `practice.settings.update` permission IS on admin per the role matrix. Same `currentPracticeId is null` warning, same template-value-undefined warning. `MailTemplate4` also fires a `validateDOMNesting: <div> cannot appear as a child of <table>` warning — minor layout bug in the template preview. |
| 4 | `/practices/settings` | Practice settings page as lid | lid (KC6ubt3ETEMSe9qPN) | NL | **`bodyLen=273` — SPARSE** | `04-practice-settings-lid-load.png`, `04-practice-settings-lid-after-login.png` | **The single most important RBAC finding in this area.** The `PermissionRender('practice.settings.update', ..., null, {practiceId})` wrapper at `PracticeSettingsPage.jsx:27` returns `null` for a lid, so the entire settings form is gone. The user sees an empty panel (topbar + menu + breadcrumb still render, hence ~270 bytes of body). Confirms the role matrix via direct UI evidence. |
| 5 | `/practices/settings` | Practice settings page as multi-practice owner (current = different practice, FR locale) | multi (T8aoGbo7Kh7xYThNH) | FR | `bodyLen=266` — SPARSE | `05-practice-settings-multi-load.png`, `05-practice-settings-multi-after-login.png` | ⚠ **Surprising**: the multi account is an owner of Practice B (FR), but at the moment of this capture the `currentPracticeId` pointer points at a practice where the multi account is NOT the owner (or the capture happened before any practice was selected). The sparse body and lack of form suggest the `PermissionRender` gate also failed for this user on whatever practice was active. Needs disambiguation — the capture log doesn't record which practice was active. Could indicate that multi-practice switching has a race or that the owner-of-Practice-B session defaulted to Practice A where multi is a `lid`. |
| 6 | `/practices/new` | New-practice wizard step 1 (FR) | multi (T8aoGbo7Kh7xYThNH) | FR | `bodyLen=406` | `06-new-practice-step1-fr-load.png`, `06-new-practice-step1-fr-after-login.png` | Three-step breadcrumb visible ("Détails" / "Plan" / "Paiement"). Step 1 renders the `praticeEdit` form with FR labels (nom, adresse, téléphone, gsm, numéro d'entreprise, numéro de TVA, IBAN, informations). VAT box with the check-button side-action visible. |
| 7 | `/practices/new` | New-practice wizard step 1 (NL) | owner (T7evq8joMtpfkkfTw) | NL | `bodyLen=366` | `07-new-practice-step1-nl-load.png`, `07-new-practice-step1-nl-after-login.png` | Same form, NL labels (naam, adres, telefoon, gsm, ondernemingsnummer, BTW-nummer, IBAN, info). FR/NL UIs are identical in structure; only the i18n strings differ. |
| 8 | `/practices` | Practices overview page as lid | lid (KC6ubt3ETEMSe9qPN) | NL | `bodyLen=145` — SPARSE | `08-practices-overview-lid-load.png`, `08-practices-overview-lid-after-login.png` | A lid user lands on `/practices` with NO settings tile (gated by `practice.settings.update`), NO subscription tile (gated by the dead `practice.subscriptions.change` permission which they don't have), and `PracticeInfo_Form` is read-only because the lid lacks `updatePractice` permission. Only the logo tile and the users tile appear. |
| 9 | `/dashboard` | Main dashboard as owner (topbar branding observation) | owner (T7evq8joMtpfkkfTw) | NL | `bodyLen=259` | `09-dashboard-owner-load.png`, `09-dashboard-owner-after-login.png` | Topbar shows the practice switcher with the active practice's name + logo. Confirms `getCurrentPractice()` from `Menu.jsx:224-226`. This screen was captured to see the topbar rendering of the branding (logo thumbnail + name). |
| 10 | `/practices/subscription` | Subscription page as owner (branding-adjacent, cross-area) | owner | NL | `bodyLen=431` | `10-practice-subscription-owner-load.png`, `10-practice-subscription-owner-after-login.png` | Captured to show the subscription page which is gated by the deprecated `practice.subscriptions.change` permission but still reachable via direct URL (cross-area #20). Not in-area but included for context of how the topbar navbar relates to practice identity. |
| 11 | `/practices/new` | New-practice wizard step 1 — blank + filled states | (as captured by previous dispatch) | NL | — | `11-new-practice-step1-blank.png`, `11-new-practice-step1-filled.png` | ⚠ **No companion JSON** — the previous dispatch appears to have captured these PNGs outside the browser-check harness, possibly via a raw screenshot call, before it died. Visual-only evidence of the blank form and a filled form mid-flow. |
| 12 | `/practices/new` | New-practice wizard step 1 — filled with values visible | (as captured by previous dispatch) | NL | — | `12-new-practice-step1-filled-values.png`, `12-new-practice-step1-filled.png` | Visual-only. Shows the form populated with test values across the four columns. |
| 13 | `/practices/new` | New-practice wizard step 2 — plan selection | (as captured by previous dispatch) | NL | — | `13-new-practice-step2-plan-select.png` | Visual-only. Cross-area #20 — plan picker grid. Captured for context of the wizard flow, not for in-area content. |
| 14 | `/practices` or `/dashboard` | Practice switcher dropdown opened | (as captured by previous dispatch) | — | — | `14-practice-switcher-open.png` | Visual-only. Shows the topbar dropdown with the practice list and the "Nieuwe praktijk" / "Ajouter une pratique" entry at the bottom — confirms `getPracticeList()` appending the `ADD_PRACTICE` sentinel from `Menu.jsx:216-219`. |

### Behavior observed on local Meteor

- **The RBAC spine of Practice Branding is `practice.settings.update` on the settings page and `practice.update` on the overview page** — both absent from `lid`. Screens 03 (admin, rich) vs 04 (lid, empty) vs 01 (owner, rich) give a clean three-way comparison. Body-length measurement (bytes of HTML after login) is a **crude but reliable signal for this comparison**: owner/admin ≈ 4920 bytes with the full form, lid/multi-on-foreign-practice ≈ 270 bytes with the form hidden.
- **NL ↔ FR UI parity is structural**: screens 06 (FR wizard) and 07 (NL wizard) show the same `praticeEdit` form with identical field layout; only the translated labels differ. The VAT-check button, the IBAN input, the structured-announcement picker (on the settings page) — all use pure i18n strings.
- **The multi-practice user's experience is asymmetric across practices**: screen 05 shows the multi account hitting `/practices/settings` and seeing an empty page, despite being an owner of Practice B. This likely reflects that the `currentPracticeId` in local storage pointed at Practice A (where multi is a lid / member without settings permission) at the moment of capture. This is consistent with the Meteor source pattern: the active practice is a session-scope local-storage variable, and the settings page runs its permission check against that active practice. A user can be an owner of one practice AND a lid of another — the RBAC evaluates against the currently active practice.
- **The new-practice wizard step 1 validates before advancing**: screens 11/12 show filled states; the JSON logs for screens 06/07 show that no validation error appears on the initial load. `NewPracticePage.jsx:114-122` is where the validation call happens on step-transition.
- **The wizard's step 2 plan selection (screen 13) and step 3 payment (not captured) are cross-area** (#20 SaaS Lifecycle). Cited here only because they are visually part of the "new practice" flow from the in-area branding perspective.
- **Console error noise is dominated by legacy React / MUI artifacts**: PropType failures (`color="white"` on SvgIcon, `Text` component prop mismatch), `Function components cannot be given refs` on `HalSelectComponent`, and many MUI "key X provided to classes prop is not implemented" warnings — none of these are user-visible, all are artifacts of mixing Material-UI v4 with `classnames`-heavy older code. The ONE console warning that is **practice-branding-specific** is the `TemplatePickerComponent` prop `value` = `undefined` at first render (screens 01 + 03). This means the picker receives no initial selection until the `withTracker` subscription resolves; visually this likely shows no thumbnail highlighted for a moment. Minor UX polish item.
- **The `MailTemplate4` DOM-nesting warning** (screen 03): `<div> cannot appear as a child of <table>`. This is an HTML structural bug in the legacy mail template — the preview renders it inline in the picker, the bug has been in production for as long as the templates have existed, and is therefore safe (it only affects the preview, not the sent HTML; email clients tolerate it). Not a QUIRK-PRESERVE (no user depends on the bug), but worth noting so a porter understands the preview artifact.
- **The `currentPracticeId is null at first render` warning** (screens 01, 03, 04): the `PracticeSettingsPage` receives `null` before the parent container resolves the active practice. The React tree continues past the warning and re-renders once the value arrives. This is a QUIRK-PRESERVE candidate in the sense that the new porter should NOT surface a "loading" spinner that hides the warning — the behavior is that the settings page flashes empty for a tick and then populates.

### Screens not reached (and why)

The previous dispatch died mid-walk after capturing 14 screens. Based on the original walk plan (inferred from the numbered artifact sequence and standard branding coverage), the following screens were **planned but never captured**:

- **Logo upload UI in action** — clicking the practice logo tile to open the upload + crop modal. The seeded Practice A has a placeholder image; the dispatch didn't capture the upload modal open, the drag-drop zone, the URL-input alternative path, or the cropper UI. `[NEEDS CLARIFICATION] Q1`.
- **Invoice template preview modal open (eye icon)** — `TemplatePicker.jsx:82-95` renders a full-size modal on eye-icon click. Screens 01/03 show the picker with four thumbnails but not the expanded modal. `[NEEDS CLARIFICATION] Q2`.
- **Invoice mail template preview modal open** — same as above, for the mail templates. Not captured.
- **Color picker open** — the `ColorPicker` component is present in both print and mail forms; not captured expanded.
- **New-practice wizard step 3 payment method picker** — screen 13 shows step 2 (plan), but step 3 (Bancontact / Card / only-trial button) is not captured. Cross-area #20, but the "only trail" button label is in-area-adjacent for the trial semantics.
- **FR version of the practice settings page** — screens 01/03 are NL-owner and NL-admin; screen 05 is the multi-owner case where the form was hidden due to active-practice mismatch. No FR-locale owner settings page capture exists. `[NEEDS CLARIFICATION] Q3`.
- **The inline edit form in action on `/practices`** — screen 02 shows the overview page from the owner's perspective but not the inline-edit box mid-typing, mid-save, or with a validation error.
- **The VAT check button in action** — pressing the VAT check side-button triggers `practice.vat.check` method against VIES; no capture exists of the loading state, success state, or error state.
- **Empty-logo state vs. uploaded-logo state** — the seeded Practice A uses the placeholder; the dispatch did not capture a practice with a real uploaded logo, so the aspect-ratio behavior of a real image (`maxHeight: 175, maxWidth: 100%`) is not confirmed.
- **A subscription-expired practice showing the read-only settings form** — the `readOnly={!hasActiveSub}` path was not exercised.
- **Chat box in the settings page** — screen 01 should include Box 3 (chat.disabled toggle) below the other two boxes, but the screenshots only show what fits in the viewport. Not confirmed visually whether the chat box is present or whether it's already hidden in the legacy UI by some feature flag.

**Disposition:** these gaps become `[NEEDS CLARIFICATION]` entries. Per the task rules, **do not re-walk**; a future dispatch (Claude Code staging-explorer or human) can fill them in. The existing 14 captures are sufficient to frame the feature catalog and the RBAC model of the area.

---

## Features

A "feature" is the smallest user-visible behavior that can be tested in isolation. Aggressive splitting.

| # | Feature ID | Name | Found via | Legacy source | HalingoDoc | Staging | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `practice-branding/info-edit-name` | Edit practice name inline | docs + source + staging | `api/practice/methods.jsx:103-125` (`updatePractice`), `lib/formSchemas/practices/praticeEdit.js:29-36`, `ui/pages/practices/PracticeInfo.jsx:48-64` | `full_documentation/settings_practice_management.md:137-158` "Gegevens praktijk invullen/wijzigen" | `/practices` screen 02 | Lives on `/practices` NOT `/practices/settings`. RBAC: owner/admin via `practice.update`. |
| 2 | `practice-branding/info-edit-address` | Edit practice address inline | docs + source + staging | `praticeEdit.js:38-49` (Form with `addressDefinition`), `api/practice/practices.jsx:39` | `settings_practice_management.md:137-158` | `/practices` screen 02 | Uses shared `addressDefinition` (street, postal code, city, country). |
| 3 | `practice-branding/info-edit-contact` | Edit practice contact (email / phone / gsm) | docs + source + staging | `praticeEdit.js:53-83`, `api/practice/practices.jsx:53-56` | `settings_practice_management.md:137-158` | `/practices` screen 02 | `contact.email` required by schema; `phoneNumber` and `gsmNumber` optional. Uses `PhoneNumberInput` composed component. |
| 4 | `practice-branding/info-edit-companyNumber` | Edit practice KBO ondernemingsnummer | docs + source + staging | `praticeEdit.js:87-97`, `api/practice/practices.jsx:52` | — | `/practices` screen 02 | Plain text input. No format validation. Used as fallback when no `vatInfo` is set (`getCompanyNumber()`). |
| 5 | `practice-branding/info-edit-vatInfo-with-viesCheck` | Enter BTW/VAT number with real-time VIES validation | docs + source + staging | `praticeEdit.js:99-111` (`VatBox`), `api/practice/methods.jsx:462-485` (`checkVat`), `api/practice/server/util.tsx:353-381` | `settings_practice_management.md:185-187` (mentions BTW check button) | `/practices` screen 02, `/practices/new` step 1 screens 06/07 | Belgian concern: calls VIES via `validate-vat` npm, fallback to `apilayer.net` with `Meteor.settings.vatlayer.key`. On success, auto-populates company name + address from the VIES response. |
| 6 | `practice-branding/info-edit-bankAccount-iban` | Edit practice bank account (IBAN) | docs + source + staging | `praticeEdit.js:114-124`, `api/practice/practices.jsx:40-51` (`iban.isValid(iban.electronicFormat(this.value))`) | — | `/practices` screen 02 | Belgian concern: IBAN validation via `iban` npm; `custom` validator returns `"invalidIban"` on failure. Render uses `iban.printFormat`. |
| 7 | `practice-branding/info-edit-freetext-info` | Edit free-text "info" textarea | docs + source + staging | `praticeEdit.js:127-141`, `api/practice/practices.jsx:59` | `settings_practice_management.md:137-158` | `/practices` screen 02 | Unconstrained String; may be shown as footer on internal views (not used by invoice templates). |
| 8 | `practice-branding/logo-upload-dragdrop-or-url` | Upload or replace practice logo (drag-drop, URL, optional crop) | docs + source + staging | `ui/pages/practices/PracticeInfo.jsx:17-45`, `api/practice/practices.jsx:60`, `api/practice/methods.jsx:115` (imageUrl whitelisted on `updatePractice`) | `settings_practice_management.md:210-239` "Praktijklogo toevoegen/wijzigen" | `/practices` screen 02 (logo tile visible with placeholder); **upload modal not captured — Q1** | Uses shared `ProfilePicture` component with `cropperProps={{aspectRatio: null}}` (freeform crop), `canSkipCrop`. Max rendered height 175px. Back end stores only the URL; actual upload pipeline is shared (S3 presign) and cross-cutting. |
| 9 | `practice-branding/logo-displayed-in-topbar-switcher` | Logo appears in the topbar practice switcher dropdown | source + staging | `ui/components/menu/Menu.jsx:207-214` (`getPracticeList()` maps `practice.imageUrl`) | — | screen 14 (switcher open) | QUIRK-PRESERVE candidate: a practice with no `imageUrl` falls back to a placeholder in the dropdown (observed in screen 14). |
| 10 | `practice-branding/practice-switch-topbar-dropdown` | Switch active practice via topbar dropdown | source + staging | `ui/components/menu/Menu.jsx:228-234` (`onPracticeChange`), `RLocalStorage.setItem("currentPracticeId", ...)` | `settings_practice_management.md:165-174` (briefly mentions the selectiemenu) | screen 14, cross-ref screens 09 + 02 | **Active practice is client-side only** — stored in `RLocalStorage` (reactive local-storage). Changing it reactively updates all `withTracker`-connected components. No server mutation on switch. |
| 11 | `practice-branding/practice-switch-add-new-sentinel` | Topbar "Add practice" sentinel entry navigates to wizard | source + staging | `ui/components/menu/Menu.jsx:216-219` (append `{name:"ADD_PRACTICE",value:"ADD_PRACTICE"}`), line 229-230 handler | — | screen 14 | The `ADD_PRACTICE` sentinel is hard-coded in every user's dropdown regardless of plan limits; route guard is the payment/trial flow on step 3, not the dropdown. |
| 12 | `practice-branding/new-practice-wizard-step1-details` | New-practice wizard step 1: enter practice details | docs + source + staging | `ui/pages/practices/NewPracticePage.jsx:92-94` (step 1 rendering), `praticeEdit.js` (same form as inline edit), `lib/formSchemas/practices/praticeAdd.jsx` | `settings_practice_management.md:160-205` "Nieuwe praktijk aanmaken" | `/practices/new` screens 06 (FR), 07 (NL), 11, 12 | Same `praticeEdit.js` form as the inline edit, wrapped in a `Form` with `stopClear={true}`. Advance-guarded by `addPracticeSchema.validate`. |
| 13 | `practice-branding/new-practice-wizard-step2-plan-select` | New-practice wizard step 2: plan selection | docs + source + staging | `NewPracticePage.jsx:95-96`, `PlanSelect` container | `settings_practice_management.md:189-192` | screen 13 | **CROSS-AREA #20 SaaS Lifecycle**. In-area only as a waypoint in the wizard flow. |
| 14 | `practice-branding/new-practice-wizard-step3-payment` | New-practice wizard step 3: payment method + trial button | docs + source | `NewPracticePage.jsx:97-103`, `PaymentSelect`, `showTrail={true}` | `settings_practice_management.md:194-201` | not captured | **CROSS-AREA #20 SaaS Lifecycle**. The `CREATE_PRACTICE` button label and the `practice.create.onlyTrail` trial button are branding-adjacent. |
| 15 | `practice-branding/new-practice-trial-semantics` | First-practice trial: 30-day free period auto-applied on first practice | docs + source | `server/util.tsx:75-77` (`createHalingoSubscription(..., true)` with trial flag), `practices.jsx:115` (`usedTrial` field) | `settings_practice_management.md:177, 201` | not captured | **CROSS-AREA #20**. A user who has already used a trial does not get a second one on a second practice. |
| 16 | `practice-branding/settings-invoice-type-select` | Choose invoice sender identity (practice vs member) | source + staging | `lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx:22-40`, `api/practice/practices.jsx:93-97`, `api/invoices/patientFileInvoices/server/util.js` consumer | — (**not in helpdesk**) | `/practices/settings` screen 01 (visible in form) | QUIRK-PRESERVE: the two values `PRACTICE` / `MEMBER` alter `patientFileInvoices.meta.type` snapshot and drive `isInvoiceFromPractice()` helper in `patientFileInvoices.js`. User-visible: invoice sender block shows practice name vs therapist name. |
| 17 | `practice-branding/settings-invoice-locale-select-DEPRECATED` | Choose per-praktijk invoice language (NL / FR) | docs + source + staging | `practiceSettingsInvoices.jsx:46-57`, `api/practice/practices.jsx:71-75`, `api/practice/server/util.tsx:45` (seeded from user locale on practice creation) | `settings_practice_management.md:108-134` "Taal praktijk wijzigen" | `/practices/settings` screen 01 (form visible, this field part of it) | **DEPRECATED — DO NOT PORT per `deprecation_list.md` #18**. The field still renders and still seeds on new-practice creation. Q25 of `open_questions.md` unresolved: do any production practices use `fr`? Must be resolved before data migration. The correct rule is "user locale is canonical" per `halingo_locale_rule.md`. |
| 18 | `practice-branding/settings-invoice-template-picker` | Select 1 of 4 print invoice templates (picker-only, no authoring) | docs + source + staging | `practiceSettingsInvoices.jsx:62-73`, `ui/pages/practices/settings/InvoiceTemplatePicker.jsx`, `ui/pages/practices/settings/TemplatePicker.jsx`, `modules/invoices/patient/templates/{index.js, InvoiceTemplate1-4.jsx}` | `settings_practice_management.md:56-76` (closest match — describes the invoice MAIL template picker but the pattern is identical), `from_source/features/email_templates.md` (full detail on the pattern) | `/practices/settings` screen 01 | **Picker-not-editor** (confirmed Q44). `invoices.template` is an integer 0..3 into the `InvoiceTemplates` array. Four React components baked into the source tree. |
| 19 | `practice-branding/settings-invoice-template-preview-modal` | Click eye icon to preview any of the 4 templates full-size | source + staging (partial) | `TemplatePicker.jsx:82-95` (`Modal` with `showTemplate` state) | — | form present in screen 01, **modal open state not captured — Q2** | Each thumbnail has its own Modal triggered by an Icon click; stops propagation so the click doesn't also select the template. |
| 20 | `practice-branding/settings-invoice-accent-color` | Set accent color for printed invoice | docs + source + staging | `practiceSettingsInvoices.jsx:78-84` (`ColorPicker`, name `invoices.color`), `api/practice/practices.jsx:70` | `settings_practice_management.md:67-70` (describes it in the mail context but the same pattern applies to print) | `/practices/settings` screen 01 | Hex string. Used as header band color in the print template. |
| 21 | `practice-branding/settings-invoice-communication-structure-select` | Choose structured announcement (OGM) format for invoices | source + staging | `practiceSettingsInvoices.jsx:89-103`, `api/practice/practices.jsx:26-31` (enum `Practices.communicationStructures`), `PracticeSettingsPage.jsx:21-22` (hard-coded `NAME-DATE-NUMBER` fallback) | — (**not in helpdesk**) | `/practices/settings` screen 01 | Four values: `FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`. Silent fallback to `NAME-DATE-NUMBER` when absent. Belgian concern (OGM format drives bank reconciliation). |
| 22 | `practice-branding/settings-invoice-remark-textarea` | Edit invoice footer remark | docs + source + staging | `practiceSettingsInvoices.jsx:107-113`, `api/practice/practices.jsx:85` | `settings_practice_management.md:73` (mentions "standaardtekst" which may conflate with mail.text) | `/practices/settings` screen 01 | Rendered at the bottom of the print invoice template. |
| 23 | `practice-branding/settings-invoice-extraHeader-textarea` | Edit invoice extra header block | source + staging | `practiceSettingsInvoices.jsx:115-123`, `api/practice/practices.jsx:86` | — (**not in helpdesk**) | `/practices/settings` screen 01 | Rendered at the top of the print invoice template. Distinct field from `remark`. |
| 24 | `practice-branding/settings-mail-template-picker` | Select 1 of 4 invoice mail templates (picker-only, no authoring) | docs + source + staging | `practiceSettingsInvoices.jsx:125-138`, `ui/pages/practices/settings/InvoiceMailTemplatePicker.jsx`, `lib/mails/mailTemplates/invoices/patient/{index.js, MailTemplate1-4.jsx}` | `settings_practice_management.md:38-78`, `from_source/features/email_templates.md` | `/practices/settings` screen 01 | Picker-only. Four React components. Reminder variant is the same layout with different title key (`titleRem`). |
| 25 | `practice-branding/settings-mail-accent-color` | Set accent color for invoice email header band | docs + source + staging | `practiceSettingsInvoices.jsx:142-149`, `api/practice/practices.jsx:77` | `settings_practice_management.md:67-70` | `/practices/settings` screen 01 | ⚠ **Copy bug**: labelled with the same i18n key (`practice.settings.invoice.color`) as the print color — two fields appear identically named in the UI. |
| 26 | `practice-branding/settings-mail-body-text` | Edit free-form invoice mail body paragraph | docs + source + staging | `practiceSettingsInvoices.jsx:151-159`, `api/practice/practices.jsx:84` | `settings_practice_management.md:73-76` ("standaardtekst") | `/practices/settings` screen 01 | `invoices.mail.text`, TextArea. Inserted verbatim into each mail template's fixed body slot. The only piece of email body content a practice can actually author. |
| 27 | `practice-branding/settings-chat-disable-toggle-DEPRECATED` | Toggle practice chat on/off | docs + source + staging | `lib/formSchemas/practices/settings/practiceSettingsChat.jsx:14-20`, `api/practice/practices.jsx:67-68` | `settings_practice_management.md:82-105` "Praktijk chat uitschakelen" | `/practices/settings` screen 01 (the form contains Box 3 per `PracticeSettingsPage.jsx:55-67`) | **DEPRECATED — DO NOT PORT per `deprecation_list.md` #1.** The whole practice chat feature is being killed. |
| 28 | `practice-branding/settings-ownTariffs-DEAD-CODE` | Per-praktijk tariff override switch | source | `lib/formSchemas/practices/accessibility.jsx:46-60` | — | — (**form not mounted**) | **DEAD CODE — DO NOT PORT per `deprecation_list.md` #10.** Form field exists but is not mounted; submit callback is empty. |
| 29 | `practice-branding/settings-rbac-gate-permissionRender` | Settings form hidden from `lid` by `PermissionRender('practice.settings.update')` | source + staging | `ui/pages/practices/settings/PracticeSettingsPage.jsx:27` | — | screen 04 (lid, empty body); screens 01 (owner) and 03 (admin) render fully | ⚠ **Cross-reference #1 Identity Management**. The single permission gates the entire form. |
| 30 | `practice-branding/settings-rbac-gate-hasActiveSub-readonly` | Settings form switches to read-only when subscription inactive | source | `PracticeSettingsPage.jsx:33,46,59` (`readOnly={!props.hasActiveSub}`) | — | not captured on an expired-sub practice — **Q4** | **Cross-reference #20 SaaS Lifecycle**. Expired subscription → read-only form. |
| 31 | `practice-branding/overview-rbac-gate-updatePractice` | `PracticeInfo_Form` on `/practices` hidden from edit for `lid`; logo upload gated too | source + staging | `PracticeInfo.jsx:25-27, 50-52` (`PermissionRender(updatePractice.name, ...)`) | — | screen 08 (lid on overview — logo tile + users tile only) | Logo tile still visible; edit interactions locked. |
| 32 | `practice-branding/past-invoices-frozen-meta-snapshot` | Branding changes do NOT update past invoices (meta snapshot) | source | `api/invoices/patientFileInvoices/server/util.js:199-202`, `api/invoices/patientFileInvoices/patientFileInvoices.js:75` | `from_source/features/invoices_overview.md` § "What is not in this module", `from_source/features/patient_invoices.md` § data model → `meta` | — | QUIRK-PRESERVE: the `meta` object is a frozen snapshot of branding at invoice-generation time. Cross-area with #11 Smart Invoicing, but the branding-freeze contract originates here. |
| 33 | `practice-branding/updatePractice-field-whitelist` | `practice.update` method whitelists exactly 8 fields | source | `api/practice/methods.jsx:109-124` | — | — | QUIRK-PRESERVE: fields NOT in the list (`address`, `bankAccount`, `companyNumber`, `contact`, `info`, `imageUrl`, `name`, `vatInfo`) are silently dropped. Tests should verify this. |
| 34 | `practice-branding/updateSettings-full-subdoc-replace` | `practice.settings.update` replaces the entire `settings` sub-document on every save | source | `api/practice/methods.jsx:135-138` (`$set: { settings }`) | — | — | QUIRK-PRESERVE: a concurrent-tab race can clobber a sibling box's write. Test scenario: open two tabs, edit Box 1 in one tab, edit Box 3 in the other, save Box 1 last — Box 3's change is lost. |
| 35 | `practice-branding/new-practice-addPractice-seeds-deprecated-locale` | On new-practice creation, `settings.invoices.locale` is seeded from the creator user's locale | source | `api/practice/server/util.tsx:45` (`_.set(practice, "settings.invoices.locale", user.locale())`) | — | — | Writes to the **deprecated** field #18. DO NOT replicate on port; the user locale is canonical. But existing data will have this field populated — Q25 resolution matters for migration. |
| 36 | `practice-branding/new-practice-creates-owner-practiceUser-row` | On new-practice creation, an owner `PracticeUsers` row is inserted for the creator | source | `api/practice/server/util.tsx:48-53` | — | — | **Cross-reference #1 Identity Management.** The wizard creates the Practice row AND the owner role row in sequence. |
| 37 | `practice-branding/new-practice-activePracticeId-writeback` | On wizard success, `currentPracticeId` local-storage is updated to the new ID | source | `ui/pages/practices/NewPracticePage.jsx:67` | — | — | Side-effect: the topbar switcher immediately reflects the new practice. |
| 38 | `practice-branding/template-picker-initial-value-undefined-flash` | Template picker briefly renders with `value=undefined` before the subscription resolves | source + staging | `ui/pages/practices/settings/TemplatePicker.jsx` (`value` required PropType), console warning in screen 01 + 03 JSON logs | — | screens 01, 03 | Minor UX polish: first render of the settings page shows no template selected until data arrives. |
| 39 | `practice-branding/mail-template4-dom-nesting-warning` | `MailTemplate4` preview emits `<div> inside <table>` DOM-nesting warning | source + staging | `lib/mails/mailTemplates/invoices/patient/MailTemplate4.jsx`, console warning in screen 03 JSON | — | screen 03 | Legacy HTML bug in the preview render; harmless in practice (email clients tolerate). Preview cosmetic only. Not a QUIRK-PRESERVE candidate — no user depends on it. |
| 40 | `practice-branding/getPracticeCertificate-method-for-print-handshake` | `practice.certificate.get` returns `{vatInfo, address, name}` for a practice ID (used by RIZIV certificate print pipeline) | source | `api/practice/methods.jsx:440-460` | — | — | **Cross-reference #15 Precision Printing.** The practice identity block on a RIZIV certificate is fetched via this method. In-area because the data it returns is pure practice branding. |

**40 features in this area** (including 3 deprecated/dead: #17 deprecated locale select, #27 deprecated chat toggle, #28 dead ownTariffs form field). Three features are cross-area with #20 SaaS Lifecycle (#13, #14, #15 on the wizard steps 2/3) but listed here for completeness of the wizard flow. HalingoDoc covered roughly 12 of 40 features (30% of user-visible behavior) — the gap is dominated by the invoice-type selector, the communication-structure selector, the extraHeader field, the new-practice wizard's internal flow mechanics, the RBAC gating, and the quirks.

---

## Cross-references to other areas

- **#1 Identity Management**: every branding action is RBAC-gated. `practice.settings.update` and `practice.update` are both owner+admin; `default` (lid) is excluded from both. Also: a new practice inserts an owner `PracticeUsers` row, which belongs to the identity RBAC layer. Screen 04 + screen 08 on lid are direct evidence.
- **#20 SaaS Lifecycle**: (a) the new-practice wizard step 2 (plan select) and step 3 (payment + 30-day trial) are wholly cross-area. (b) The settings form is gated by `hasActiveSub` — an expired subscription renders the form read-only. (c) The `practices.customerId` field (Stripe customer) and `practices.usedTrial` field live on the `Practices` collection but are purely SaaS. (d) `_addPractice` inserts into `Practices` AND calls `SubscriptionUtil.createHalingoSubscription` / `createStripeSubscriptionForPractice` in the same transaction.
- **#11 Smart Invoicing** and **#12 Payment Lifecycle**: the branding settings land on every generated invoice via the `meta` snapshot (`patientFileInvoices.js:75, server/util.js:199-202`). Branding fields consumed: `template`, `color`, `mail.template`, `mail.color`, `mail.text`, `remark`, `extraHeader`, `type`, `communicationStructure`, and the deprecated `locale`. A branding change does not retroactively update past invoices (feature #32).
- **#14 Mutualistic Billing** (Verzamelstaten): same `meta` snapshot pattern — the Verzamelstaat carries the practice's identity block at generation time.
- **#15 Precision Printing**: the RIZIV certificate print pipeline calls `practice.certificate.get` (feature #40) to fetch the practice identity block.
- **#16 Patient Communication**: practice chat — area #16's deprecated component, but the kill-switch checkbox (`settings.chat.disabled`) physically lives on the Practice Branding settings page. DO NOT PORT either the feature or the toggle.
- **#18 External Platform Sync**: Rosa integration. Practices have `rosaId` and `rosaMotives[]` fields on their schema, and `Practices.after.update` fires into the Rosa sync hook. These are NOT branding concerns but physically live on the same collection.

---

## [NEEDS CLARIFICATION]

### Q1: What does the practice logo upload modal actually look like in the legacy UI?
- **Why it matters:** feature #8 (`logo-upload-dragdrop-or-url`) is described in helpdesk prose but the previous dispatch didn't capture the modal state. Before the porter can write a parity test, they need to know whether it's a full-screen modal, a popover, whether the URL-input alternative is a tab or a link, what the cropper controls look like, and whether "skip crop" is a button next to "crop" or a secondary action.
- **Sources conflict?** no. Helpdesk describes it; source confirms `ProfilePicture` with `cropperProps={aspectRatio: null}` and `canSkipCrop`; staging didn't capture the modal open.
- **What would resolve:** one focused screenshot walk: log in as owner, click the placeholder logo on `/practices`, capture modal open state, capture drag-drop state, capture cropper state, capture URL-input state.

### Q2: Do the invoice template preview modals (eye-icon click) actually work today on the local Meteor instance?
- **Why it matters:** the previous dispatch captured the picker with four thumbnails but not the expanded modal. If the modal renders broken or with missing data (because the placeholder invoice is stale 2017 data — confirmed from reading `InvoiceTemplatePicker.jsx`), the porter needs to know whether that's a QUIRK-PRESERVE or just stale UI.
- **Sources conflict?** no.
- **What would resolve:** open `/practices/settings` as owner, click the eye icon on each of the 4 print templates and each of the 4 mail templates, capture 8 modal screenshots. Light task.

### Q3: Is there any material UI difference between NL and FR locale on the practice settings page (as opposed to the wizard)?
- **Why it matters:** screens 06 + 07 cover the wizard step 1 in both locales, but no screen captures `/practices/settings` in FR for a user who is an owner of an FR-locale practice. Given the deprecation of per-praktijk locale (#17), it's possible the settings page renders identically in both cases — but unconfirmed.
- **Sources conflict?** no.
- **What would resolve:** a Claude staging-explorer or human walk the FR-locale practice settings page. NOT re-walkable in this session per the rules.

### Q4: How does the settings form render for a practice with an expired/no subscription?
- **Why it matters:** feature #30 says `readOnly={!hasActiveSub}` makes the whole form locked. The visible implication is that owner/admin users with an expired sub can view but not change branding — a UX behavior that affects parity. But no screen exercised this.
- **Sources conflict?** no.
- **What would resolve:** either (a) let a seeded practice's trial expire past the LEEWAY, or (b) mutate a test-only subscription record into `CANCELLED` state and reload. (b) would violate write isolation; (a) is time-based. Deferred.

### Q5: Does any production practice actually have `settings.invoices.locale === "fr"`?
- **Why it matters:** feature #17 is deprecated but the field seeds on creation (#35). Data migration decision blocked on this count. This is `Q25` from `from_source/open_questions.md` and remains unresolved.
- **Sources conflict?** no.
- **What would resolve:** a read-only MongoDB query against staging: `db.practices.countDocuments({"settings.invoices.locale": "fr"})`. Must be run outside this session per the read-isolation rules.

### Q6: Does the `PracticesOverviewPage` show the subscription tile or hide it for practices on the deprecated `practice.subscriptions.change` permission gate?
- **Why it matters:** `PracticesOverviewPage.jsx:34` gates the subscription tile by `practice.subscriptions.change` which is listed in `deprecation_list.md` #8 as a dead permission constant. If dead, every user sees the tile hidden; if some role still has it, they see it. Screen 08 (lid) shows no subscription tile. Screen 02 (owner) — the screen is sparse (bodyLen=146) so hard to tell visually without reopening.
- **Sources conflict?** `practiceUsers.jsx:21` lists `practice.subscriptions.change` on `owner` — so the permission does exist on the role, but `deprecation_list.md` #8 says "dead constant, listed in the role matrix but no `checkPermission` call references it". That means the PERMISSION exists but the gate on the tile is the only checker. So an owner sees the tile, lid does not.
- **What would resolve:** confirm visually on screen 02 that the tile IS present (not a Q&A, just a note for the porter).

### Q7: What is the exact behavior of a multi-practice user (multi account) landing on `/practices/settings` when `currentPracticeId` points at a practice where they are NOT the owner?
- **Why it matters:** screen 05 shows body len ~266 (empty) for a multi user who IS an owner of Practice B — which means the active practice at the time of the capture was NOT Practice B. The expected behavior is that the user needs to switch practices first. But what does the settings page show in that case? Is there a "no permission on this practice" banner, or does it just render blank?
- **Sources conflict?** no.
- **What would resolve:** a focused capture of multi-user-on-settings-of-lid-practice with the dropdown visible showing the switch option.

### Q8: Does the `invoices.mail.color` field have a different label than `invoices.color` in the live UI, despite both using the same i18n key?
- **Why it matters:** discrepancy #5 / feature #25 — `practiceSettingsInvoices.jsx:81` and `:146` both use `practice.settings.invoice.color` as the label. Could render as "Kleur" twice. If so, it's a copy bug visible to users. If the translation dictionary silently disambiguates (plural keys?), maybe not.
- **Sources conflict?** no; source is clear.
- **What would resolve:** inspect the rendered `/practices/settings` page labels in both NL and FR — a light visual task on a future walk.

### Q9: Screens not captured by the previous dispatch (summary)
The previous dispatch died before capturing: logo upload modal (Q1), template preview modals (Q2), FR-owner settings page (Q3), expired-sub settings page (Q4), inline-edit-in-progress on `/practices`, VAT-check button pressed state, real-logo-uploaded state, the settings page chat box visible in viewport. All of these are walkable in a future session; none are blocking for downstream Phase 2 spec authoring provided the porter uses the captured 14 screens + Source 2 code reading.

---

## [NEEDS DOMAIN REVIEW]

### Q: Is the `structuredAnnouncement` format (communication structure) tied to any specific Belgian banking or RIZIV requirement beyond the generic OGM / "vrije mededeling"?
- **Found in:** feature #21, `api/practice/practices.jsx:26-31`, `api/practice/practices.jsx:98-102`
- **Why it matters:** Belgian banks recognize a structured communication format (`+++XXX/XXXX/XXXXX+++`) that auto-matches payments. Halingo's four formats (`FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`) do NOT appear to match this standard — they look like free-form text, not the `+++` OGM structure. Verify whether these are intended as free-text "mededeling" (notes field for the patient to recognize) and the true OGM is generated elsewhere, OR whether they're a non-standard replacement for OGM that doesn't trigger bank auto-matching.
- **What I know:** The glossary does not describe this. `from_source/features/patient_invoices.md` § "meta → communicationStructure" lists the field but doesn't explain the Belgian banking interaction. Possibly the practice is generating a free-text match hint and matching payments manually.
- **Resolution:** pending — Claude session with `logopedist-be` skill OR product owner question. For the discovery I am recording it as a Belgian-concern flag; the Phase 2 spec author should resolve it before porting.

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/functional/user_stories.md
/home/tj/HalingoDoc/docs/glossary.md
/home/tj/HalingoDoc/docs/full_documentation/settings_practice_management.md
/home/tj/HalingoDoc/docs/from_source/README.md
/home/tj/HalingoDoc/docs/from_source/inventory.md (ctrl-F)
/home/tj/HalingoDoc/docs/from_source/features/email_templates.md (full)
/home/tj/HalingoDoc/docs/from_source/features/invoices_overview.md (partial)
/home/tj/HalingoDoc/docs/from_source/features/patient_invoices.md (partial)
/home/tj/HalingoDoc/docs/from_source/features/main_dashboard.md (partial)
/home/tj/HalingoDoc/docs/from_source/features/saas_subscriptions.md (partial)
/home/tj/HalingoDoc/docs/from_source/features/practice_chat.md (partial — banner + settings only)
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md (full, ctrl-F)
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md (ctrl-F)
/home/tj/HalingoDoc/docs/from_source/open_questions.md (ctrl-F Q25/Q26/Q42/Q44)
/home/tj/HalingoDoc/docs/from_source/scout_pass.md (light read)
/home/tj/HalingoDoc/docs/from_source/technical/collections.md (ctrl-F)
/home/tj/HalingoDoc/docs/from_source/technical/routes.md (ctrl-F)
/home/tj/HalingoDoc/docs/from_source/technical/methods.md (ctrl-F)

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/practice/practices.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practice/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practice/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practice/server/util.tsx
/home/tj/Repos/Halingo-Main/app/imports/api/practice/server/hooks.js
/home/tj/Repos/Halingo-Main/app/imports/api/practice/server/publications.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/practiceUsers.jsx (lines 1-170)
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/praticeEdit.js
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/praticeAdd.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/accessibility.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/settings/practiceSettingsInvoices.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/settings/practiceSettingsChat.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/formSchemas/practices/settings/practiceSettingsPatientFileNotifications.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticesOverviewPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/PracticeInfo.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/NewPracticePage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/settings/PracticeSettingsPage.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/settings/InvoiceTemplatePicker.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/settings/InvoiceMailTemplatePicker.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/pages/practices/settings/TemplatePicker.jsx
/home/tj/Repos/Halingo-Main/app/imports/ui/containers/practices/settings/PracticeSettingsPageContainer.js
/home/tj/Repos/Halingo-Main/app/imports/ui/components/menu/Menu.jsx (lines 180-234)
/home/tj/Repos/Halingo-Main/app/imports/startup/client/routes/practice.jsx
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/invoices/patient/index.js
/home/tj/Repos/Halingo-Main/app/imports/lib/mails/mailTemplates/invoices/patient/MailTemplate1.jsx (partial)
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/patient/templates/index.js

# Local Meteor screen captures (source 3, reused from previous dispatch)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/01-practice-settings-owner.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/01-practice-settings-owner-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/01-practice-settings-owner-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/02-practices-overview-owner.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/02-practices-overview-owner-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/02-practices-overview-owner-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/03-practice-settings-admin.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/03-practice-settings-admin-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/03-practice-settings-admin-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/04-practice-settings-lid.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/04-practice-settings-lid-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/04-practice-settings-lid-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/05-practice-settings-multi.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/05-practice-settings-multi-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/05-practice-settings-multi-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/06-new-practice-step1-fr.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/06-new-practice-step1-fr-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/06-new-practice-step1-fr-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/07-new-practice-step1-nl.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/07-new-practice-step1-nl-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/07-new-practice-step1-nl-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/08-practices-overview-lid.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/08-practices-overview-lid-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/08-practices-overview-lid-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/09-dashboard-owner.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/09-dashboard-owner-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/09-dashboard-owner-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/10-practice-subscription-owner.json
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/10-practice-subscription-owner-load.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/10-practice-subscription-owner-after-login.png
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/11-new-practice-step1-blank.png (no JSON — previous dispatch interrupted)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/11-new-practice-step1-filled.png (no JSON — previous dispatch interrupted)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/12-new-practice-step1-filled-values.png (no JSON)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/12-new-practice-step1-filled.png (no JSON)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/13-new-practice-step2-plan-select.png (no JSON)
/home/tj/halingoMigration/01-discovery/staging-screens/practice-branding/14-practice-switcher-open.png (no JSON)
```

---

## Verification notes (verbatim from `01-discovery/practice-branding.verification.md`)

# Verification: Practice Branding

- **Verified by:** Claude Opus (halingo-discovery-verifier procedure, run manually after subagent timeout)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/practice-branding.md`
- **Verdict:** PASS WITH NOTES

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | Email templates are picker-not-editor: four hard-coded React components, no WYSIWYG | `from_source/features/email_templates.md:8-14` | ✓ | Verbatim match. Lines 8-13 say exactly this. Q44 confirmation also present. |
| 2 | `deprecation_list.md` #18: `practices.settings.invoices.locale` deprecated, product owner said "We should not use practice locale" | `from_source/deprecation_list.md:108-112` | ✓ | Verbatim match at lines 108-111. |
| 3 | `deprecation_list.md` #1: practice chat killed, `settings.chat.disabled` is the kill switch | `from_source/deprecation_list.md:17-26` | ✓ | Verbatim match. |
| 4 | `deprecation_list.md` #10: `practice.ownTariffs` dead code, empty submit callback | `from_source/deprecation_list.md:67-70` | ✓ | Verbatim match. |
| 5 | `coverage_matrix.md` #15: "two-level invoice comments" is helpdesk fiction, only practice-level + user-level exist | `docs/coverage_matrix.md:93` | ✓ | Line 93 says "❌ not in code. Only practice-level and user-level exist." |
| 6 | `updatePractice` method whitelists exactly 8 fields via `_.pick` | `api/practice/methods.jsx:109-124` | ✓ | **Meteor source verified.** Lines 111-121 show `_.pick(data, "address", "bankAccount", "companyNumber", "contact", "info", "imageUrl", "name", "vatInfo")`. Exact match. |
| 7 | `updateSettings` does `$set: { settings }` replacing the entire sub-document | `api/practice/methods.jsx:135-138` | ✓ | **Meteor source verified.** Line 137: `Practices.update(practiceId, { $set: { settings } })`. Exact match. |
| 8 | `PracticeSettingsPage` has `PermissionRender('practice.settings.update', ...)` gate, `readOnly={!props.hasActiveSub}` on all three forms, `NAME-DATE-NUMBER` default fallback | `PracticeSettingsPage.jsx:21-22, 27, 33, 46, 59` | ✓ | **Meteor source verified.** Line 21-22 set fallback, line 27 has PermissionRender, lines 33/46/59 all have `readOnly={!props.hasActiveSub}`. Exact match. |
| 9 | `communicationStructures` enum has 4 values | `api/practice/practices.jsx:26-31` | ✓ | **Meteor source verified.** Lines 26-31 define exactly `FULLNAME-MONTH-NUMBER`, `FULLNAME-MONTH`, `NAME-DATE-NUMBER`, `NAME-DATE`. |
| 10 | `invoiceTypes` enum has `PRACTICE` and `MEMBER` values | `api/practice/practices.jsx:33-36` | ✓ | **Meteor source verified.** Lines 33-36: `{ PRACTICE: "practice", MEMBER: "member" }`. |
| 11 | IBAN validation uses `iban.isValid(iban.electronicFormat(this.value))` with `"invalidIban"` custom error | `api/practice/practices.jsx:40-51` | ✓ | **Meteor source verified.** Lines 43-49 match exactly. |
| 12 | `email_templates.md` data model lists `remark` and `extraHeader` as separate fields | `from_source/features/email_templates.md:38-40` | ✓ | Lines 38-40 show both fields separately. |
| 13 | `communicationStructure` field "not in HalingoDoc" (discovery discrepancy table row #7) | Multiple HalingoDoc files | ~ | **Minor imprecision.** The field IS documented in `from_source/features/patient_invoices.md` (line 82: "Format depends on `practice.settings.invoices.communicationStructure`"; line 271: "Built from `practice.settings.invoices.communicationStructure` (default `NAME-DATE-NUMBER`)"). The discovery is correct that it's not in the *helpdesk* files, but the claim "Not mentioned" in the discrepancy table is too broad — it IS mentioned in code-derived HalingoDoc. |
| 14 | `invoices.type` selector "not mentioned" in HalingoDoc (discrepancy table row #6) | Multiple HalingoDoc files | ~ | **Minor imprecision.** `collections.md:321` documents `meta` holding `type (practice/member)`, and `insurance_invoices.md:119` describes "member-mode requires user RIZIV+IBAN+companyNumber, practice-mode requires practice RIZIV+IBAN+companyNumber". Not in the helpdesk, but present in code-derived docs. |
| 15 | `meta` on past invoices is a frozen snapshot — branding changes don't retroactively update | `from_source/features/invoices_overview.md`, `patient_invoices.md:75` | ✓ | `patient_invoices.md:75` confirms: "Snapshot of `practice.settings.invoices` merged over `user.settings.invoices` (`server/util.js:199-202`)". |

## Material omissions

1. **`structuredAnnouncement` generation logic.** `patient_invoices.md:271` documents the placeholder expansion for each of the four `communicationStructure` formats (`server/util.js:169-179`). The discovery mentions the four formats and notes they're consumed by the invoice pipeline, but does not reproduce the actual placeholder expansion rules (e.g., what `FULLNAME-MONTH-NUMBER` renders as). This is arguably cross-area (#11 Smart Invoicing), but the discovery could benefit from noting that the expansion logic is documented in `patient_invoices.md:271` so the Phase 2 spec author doesn't have to rediscover it.

2. **`invoices.edit.structuredAnnouncement` method** (`patient_invoices.md:183-184`) allows manually editing the structured announcement on an OPEN invoice. This crosses into area #11 but is relevant because it means the `communicationStructure` setting is a *default* — individual invoices can override it. The discovery doesn't mention this override capability.

3. No other material omissions found. The discovery is comprehensive for its stated scope.

## Cross-area reference check

| Cross-reference | Direction | Verified? | Finding |
|---|---|---|---|
| #1 Identity Management | practice-branding → identity | ✓ (one-directional) | Practice-branding correctly references identity for RBAC (owner/admin/lid). Identity discovery does not explicitly cross-reference back to practice-branding, but this is acceptable — the RBAC model is described fully in identity and merely consumed here. |
| #20 SaaS Lifecycle | practice-branding → SaaS | ✓ | Wizard steps 2/3, `hasActiveSub` gating, `usedTrial` flag — all plausible cross-area links. |
| #11 Smart Invoicing | practice-branding → invoicing | ✓ | `meta` snapshot link is accurate per `patient_invoices.md`. |
| #12 Payment Lifecycle | practice-branding → payment | ✓ | Same `meta` snapshot consumed downstream. |
| #14 Mutualistic Billing | practice-branding → Verzamelstaten | ✓ | Practice identity block on Verzamelstaat is plausible. |
| #15 Precision Printing | practice-branding → RIZIV cert print | ✓ | `practice.certificate.get` method confirmed in source. |
| #16 Patient Communication | practice-branding → practice chat | ✓ | Chat toggle on settings page, deprecated. |
| #18 External Platform Sync | practice-branding → Rosa | ✓ | Rosa fields on Practices collection, noted as out-of-scope. |

## Domain review (logopedist-be)

| Claim | Domain finding | Severity |
|---|---|---|
| `communicationStructure` four formats — are they regulated OGM? | **Resolved.** The four values (`FULLNAME-MONTH-NUMBER`, etc.) are free-text convenience labels for the "vrije mededeling" on patient invoices — NOT regulated OGM (gestructureerde mededeling +++XXX/XXXX/XXXXX+++). No Belgian banking or RIZIV regulation mandates a specific structured-announcement format for B2C logopedist invoices. The OGM format is for Belgian bank auto-matching on B2B; logopedist-to-patient invoices are B2C and art. 44 WBTW exempt. These are practice-defined labels that help patients recognize payments and help practices match manually. | NOTE (resolved) |
| VIES VAT validation via `validate-vat` npm package | This is a standard EU-wide VIES check, not a Belgian-specific regulatory requirement. Belgian practices may or may not have a BTW number (art. 44 exempt). The VAT check is a convenience, not a compliance gate. | NOTE |
| IBAN validation for practice bank account | Standard banking validation, not healthcare regulation. | NOTE |

No Belgian healthcare regulatory claims in this area that contradict the `logopedist-be` skill's references. The area is primarily a UI settings surface, not a compliance surface.

## Escalated source checks (Step C)

Three Meteor source files read to verify load-bearing claims:

| # | Claim | File | Lines | Verified? | Additive finding |
|---|---|---|---|---|---|
| 1 | `updatePractice` whitelists 8 fields via `_.pick` | `api/practice/methods.jsx` | 111-121 | ✓ | None — exact match. |
| 2 | `updateSettings` replaces entire `settings` sub-doc | `api/practice/methods.jsx` | 135-138 | ✓ | Confirmed `subscription: true` guard at line 134. |
| 3 | `PracticeSettingsPage` permission gate + readOnly + NAME-DATE-NUMBER fallback | `ui/pages/practices/settings/PracticeSettingsPage.jsx` | 16-64 | ✓ | Three `LiveEditableForm` instances confirmed (invoice box, notifications box, chat box). The chat box at lines 55-64 is the deprecated toggle. |

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-pb-01 | NOTE | citation | `communicationStructure` described as "Not mentioned" in HalingoDoc (discrepancy #7), but IS documented in `patient_invoices.md:82,271`. Correct that it's not in the helpdesk, but imprecise for code-derived docs. | Amend discrepancy table row #7 to say "Not in helpdesk; documented in `patient_invoices.md` but not in the practice-branding-focused HalingoDoc files." |
| V-pb-02 | NOTE | citation | `invoices.type` selector described as "Not mentioned at all" in HalingoDoc (discrepancy #6), but IS referenced in `collections.md:321` and `insurance_invoices.md:119`. | Same amendment: "Not in helpdesk; partially documented in code-derived files." |
| V-pb-03 | NOTE | omission | Structured announcement can be manually overridden per-invoice via `invoices.edit.structuredAnnouncement` method (`patient_invoices.md:183`). The `communicationStructure` setting is a default, not absolute. | Add a note to feature #21 pointing to the override path in area #11. |
| V-pb-04 | NOTE | omission | Placeholder expansion rules for the four `communicationStructure` formats are documented in `patient_invoices.md:271` (`server/util.js:169-179`). Discovery doesn't reproduce them. | Add a pointer from feature #21 to `patient_invoices.md:271` so Phase 2 spec author finds the expansion logic. |
| V-pb-05 | NOTE | domain | `communicationStructure` / OGM domain question resolved: free-text "vrije mededeling", not regulated OGM. B2C logopedist invoices are not subject to OGM requirements. | [NEEDS DOMAIN REVIEW] block in discovery can be marked RESOLVED. |
| V-pb-06 | NOTE | cross-area | Identity discovery (#1) does not cross-reference back to Practice Branding (#2). One-directional cross-reference. Acceptable — no information loss. | No action needed. |
| V-pb-07 | NOTE | process | Rule #7 deviation: producer (Claude Code general-purpose) and verifier (Claude Opus) are same model family. A lightweight Gemini spot-check of 2-3 load-bearing claims is advised before Phase 2 begins. | Flag for human. |

## Recommendation

**PROCEED to Phase 2.** The discovery is thorough (40 features, 14 staging screens, 15 discrepancies documented), accurately cited, and comprehensive for its scope. All seven findings are NOTEs — no BLOCKERs, no CLARIFYs. The [NEEDS DOMAIN REVIEW] question about `communicationStructure` / OGM is resolved (free-text, not regulated). The nine [NEEDS CLARIFICATION] items (Q1–Q9) are appropriately scoped and non-blocking for Phase 2 spec authoring.

Minor amendments suggested: update discrepancy table rows #6 and #7 to acknowledge the code-derived HalingoDoc coverage, and add pointers from feature #21 to the expansion logic in `patient_invoices.md`. These are editorial improvements, not correctness issues.

Note the rule #7 process deviation (same-family producer/verifier). Consider a lightweight Gemini cross-check before starting Phase 2 specs for this area.
