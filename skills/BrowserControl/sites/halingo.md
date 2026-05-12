# Halingo (dev.app.halingo.be)

**Status:** Phase A discovery completed 2026-05-08. Login + signup form structure verified. Phases B-F pending.

Halingo is a Belgian SaaS for logopedists (speech therapists) — patient management, agenda, RIZIV billing, eAttest/eFact, treatment plans, bilans. Stack: React (uses `react-select` for dropdowns), embeds Stripe (billing) + Segment (`ajs_*` cookies) + GA + Zendesk launcher + Facebook Pixel.

**Hard rule — STAGING ONLY.** Always `https://dev.app.halingo.be`. Production `https://halingo.be` is forbidden — it would corrupt real customer data and trigger real RIZIV billing.

## Chrome launch (always 1920×1080)

Halingo is a B2B desktop SaaS. Launch Chrome at full HD so screenshots match what real therapists see:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="C:\\ChromeDebug" \
  --window-size=1920,1080 \
  --window-position=0,0 \
  "https://dev.app.halingo.be/" &
```

Verify the actual viewport (window chrome eats ~135px on Windows):
```bash
node ~/.claude/skills/BrowserControl/eval.js --filter halingo "({w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio})"
```
Expect `{w: 1920, h: ≈945, dpr: 1}`.

## URL map

| Path | Purpose |
|---|---|
| `/` | Login page (redirect target after logout) |
| `/login` | Same as `/` — login form |
| `/register` | Signup form |
| `/forgot` | Password reset request |
| `/ToC` | Terms of service / gebruiksvoorwaarden |

Other routes will be discovered post-login in Phase D.

## Login page (`/`)

Pure email + password — **no eID, no itsme, no magic-link**, no captcha visible (may appear after N failed attempts; not yet probed).

Form structure (verified via `inspect.js`):
- `input[name="email"]` placeholder *"Vul je e-mailadres in"*
- `input[name="password"]` placeholder *"Vul je wachtwoord in"*
- `<button type="submit">` text *"AANMELDEN"* (Dutch for Sign in)
- Links: *"Nog geen account?"* → `/register` · *"Wachtwoord vergeten?"* → `/forgot`

Default locale on login is Dutch (NL-BE) — `<html>` has no `lang` attribute, locale is determined post-login from the user profile setting.

Login flow (Wicket-style typing isn't needed — Halingo is React, dispatch-event setter works):
```javascript
await page.evaluate((email, pwd) => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set('input[name="email"]', email);
  set('input[name="password"]', pwd);
}, EMAIL, PASSWORD);
await page.click('button[type="submit"]');
```
If that fails (e.g. React's controlled input rejects raw `value=`), fall back to `page.click(sel,{clickCount:3}); page.type(sel, val, {delay: 40})`.

## Signup page (`/register`)

Form fields (verified via `inspect.js`):
- `input[name="email"]` — placeholder *"Vul je e-mailadres in"*
- `input#react-select-2-input` — **language picker (react-select)**, not country/profession. Default *"Nederlands"*. Other option observed: *"Français"*. To pick Français, click the field, then click the option:
  ```javascript
  await page.click('#react-select-2-input');
  await new Promise(r => setTimeout(r, 500));
  // The dropdown opens; click the option by text
  await page.evaluate(() => {
    const opt = [...document.querySelectorAll('div[id^="react-select-2-option"]')]
      .find(d => /Français|Frans/i.test(d.innerText));
    if (opt) opt.click();
  });
  ```
- `input[name="password"]` — placeholder *"Vul je wachtwoord in"*
- `input[name="confirmPassword"]` — placeholder *"Herhaal je wachtwoord"*
- `input[type="checkbox"]` — Terms acceptance: *"Ik heb de gebruiksvoorwaarden gelezen en goedgekeurd"*. **Required** — submit will fail if unchecked. Use `el.click()` (not `el.checked = true`), since React listens for the change event.
- `<button type="submit">` text *"REGISTREER"*

After REGISTREER: expect a confirmation email to the entered address. Retrieve via the existing Proton recipe (`sites/proton.md`). Verification link probably routes back to a "complete your profile" page.

## Embedded third-party iframes (always present)

- `iframe[name^="__privateStripeMetricsController"]` — Stripe.js metrics on every page
- `iframe[id="launcher"]` — Zendesk help-launcher (the floating "?" widget); occupies a fixed position bottom-right and may overlap CTAs at smaller viewports
- `iframe[src="about:blank"]` — likely Stripe's hidden iframe parent

When using `inspect.js` always pass `--filter halingo` to avoid getting Stripe iframes as the inspected page.

## Tracking cookies on first load

`__stripe_mid`, `_gid`, `_ga_*`, `ajs_anonymous_id`, `ajs_user_id` (Segment), `ajs_group_id`, `__zlcmid` (Zendesk), `_fbp` (Facebook Pixel). Auth cookies will land after login — to be captured in Phase B.

## Test accounts

In `~/.claude/skills/BrowserControl/.env`:
- `TEST_CANDIDATE2_EMAIL` / `TEST_CANDIDATE2_PASSWORD` → display name **Nele Van den Broeck**, locale NL, role: practice owner. (User: Liam Castillo Proton inbox)
- `TEST_CANDIDATE_EMAIL`  / `TEST_CANDIDATE_PASSWORD`  → display name **Sophie Dubois**, locale FR, role: invited member. (User: Marcus Whitfield Proton inbox)

Confirmation emails arrive in those Proton inboxes. Use the existing `sites/proton.md` recipe to fetch verification links.

## Cleanup-identifier strategy (no synthetic prefix)

Display data is fully realistic (no `_BC_` prefix). Cleanup is via `manifest.json` written during the test run:
- Therapist accounts identified by Proton email (`*.proton.me`).
- Practice + patients + treatments + invoices scoped to those accounts.
- The manifest in `C:/Repos/halingo_uat_2026-05-08/manifest.json` lists every entity created with its in-app ID and creation timestamp; cleanup walks it in reverse.

## Pitfalls

- **`<html>` has no `lang` attribute.** Don't infer locale from that — read the user profile via `eval.js` after login.
- **`react-select` dropdowns** require click-then-click-option (see signup snippet). Setting `value` on the hidden input does nothing.
- **Stripe metrics iframe** generates background traffic on every page. When using CDP `Fetch` interception for downloads, scope `urlPattern` tightly (e.g. `*/api/*`) so the Stripe traffic doesn't dominate.
- **Zendesk launcher** is `position: fixed` and can overlap CTAs at the bottom-right of the viewport. If a click at the visible coordinates does nothing, the launcher iframe may be capturing it — scroll the target up first or hide the launcher with `document.getElementById('launcher').style.display='none'`.
- **No CAPTCHA observed yet** but signup may gate after repeat attempts from the same IP. If signup hangs with no error, take a `screenshot.js` and inspect for a Cloudflare/hCaptcha frame.

## Logout

The user-avatar pill in the header does NOT have a working dropdown menu — clicking it does nothing useful. **Two reliable logout methods:**

1. `page.goto('https://dev.app.halingo.be/logout')` — server-side redirect, clears session.
2. `await page.evaluate(() => window.Meteor.logout())` — client-side via Meteor's accounts package.

After logout, navigating to `/login` shows the login form fresh.

## Masked inputs — INSZ, DOB, phone

`name="SSN"` (INSZ on patient creation), `name="dob"` style fields, and phone fields use a JS mask library (likely `react-input-mask` or similar) that REJECTS `page.keyboard.press(digit)` and `page.type()` — keystrokes don't reach the underlying value. The mask placeholder `__.__.__-___.__` stays unchanged.

**Working pattern: React prototype-setter with the fully-formatted string:**
```javascript
await page.evaluate(() => {
  const inp = document.querySelector('input[name="SSN"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(inp, '08.05.15-042.31');   // pre-formatted with dots/dash
  inp.dispatchEvent(new Event('input',  { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  inp.dispatchEvent(new Event('blur',   { bubbles: true }));
});
```

For DOB, use DD/MM/YYYY format (Belgian convention). For phone fields with the +32 BE flag prefix, omit the country code — the auto-formatter inserts it.

## Stripe billing flow

Halingo uses **legacy Stripe Tokens API** (`tok_*`) — DDP method `practice.subscriptions.payment.change` accepts a `sourceId: tok_*` parameter. Test card `4242 4242 4242 4242` with expiry `12/30` and CVC `123` produces a valid token, and the DDP method returns success — but staging behavior currently does not reflect the saved card in the UI ("Geen selecteerd" persists). May indicate the Stripe `tok_` API is deprecated and the backend is silently failing the attach; suggest using Stripe Elements PaymentElement (`pm_*`) instead.

The Stripe Card Element lives in iframe with `name^="__privateStripeFrame"` — typing into it requires `frame.$(...).type()` against fields `input[name="cardnumber"]`, `input[name="exp-date"]`, `input[name="cvc"]`. Find the frame via `page.frames().find(f => /elements-inner-card/.test(f.url()))`.

## DDP method names captured

| Method | What it does |
|---|---|
| `users.register` | Create new user account from /register form |
| `login` | Authenticate user (followed by `users.register` for auto-login on signup) |
| `practice.add` | Create a new practice — payload includes `info.{contact, name, address, companyNumber, bankAccount, info}` |
| `practice.subscriptions.payment.change` | Change payment method on a subscription. Params: `{subscriptionId, method, sourceId}`. Currently silently failing. |
| `treatments.add` | Create a treatment for a patient. Params: `{hasInitialBilan, name, type, patientFileId}`. Returns `treatmentId`. Auto-creates `bilans[0]` with `type: "initial"`. |
| `treatment.can.be.removed` | Pre-flight check before allowing treatment delete. |
| `treatments.updateHalingoSessionCount` | Recompute session counter for a treatment. |
| `events.create` | Create an appointment. Params: `{title, patientFileId, treatmentId, userId, start, end, type, meta:{type, subType, location}}`. Returns eventId. Auto-creates a commission invoice (event document gets `commissionInvoiceId` populated). |
| `patientFiles.view` | Fetch patient details for the agenda autocomplete. |
| `patientFiles.get` | Fetch full patient docs by id list. |
| `events.get.uninvoiced` | List unbilled events for a user/practice — drives the invoice creation modal. |
| `invoices.add.all.therapists` | Generate patient invoices for selected events. Params: `{practiceId, eventIds[]}`. **Fails with `invoices.create.incompleteUser`** if user-level billing identity (name, address, IBAN, BTW, RIZIV) is missing — this data is per-user, NOT per-practice. |
| `invoices.search` | Search/filter invoices on /financial. |
| `invoices.statistics.earnings` | Drive the Inkomsten/Ontvangen monthly chart. |
| `invoices.mail` | Email an invoice. Params: `{invoiceId}`. **Fails with `invoices.mail.noText`** if the practice's mail-template is empty — set the template at Praktijk → INSTELLINGEN before testing email-send flows. |

## Invoice identity model — TWO numbers per invoice

Halingo issues each invoice with TWO identifiers (Belgian VAT compliance):

| Identifier | Format | Purpose |
|---|---|---|
| **Factuurnummer** | sequential integer (1, 2, 3, ...) — gap-free, per practice | Legally-required Belgian invoice number; rendered as `FACTUURNUMMER 1` on the invoice top-right |
| **Mededeling** | `<3-letter-uppercase-patient-surname-prefix>-<YYYYMMDD>-<3-digit-seq>` (e.g. `PEE-20260509-001`) | Freeform "vrije mededeling" / payment reference used on the bank transfer; rendered in the footer payment instruction |
| **DB `_id`** | 17-char Meteor ID (e.g. `72xu7jwThSfHJAccx`) | Invoice URL: `/financial/invoices/patient/<id>` |

Don't confuse them — auditors check the sequential `factuurnummer`; the patient sees the `mededeling` on their bank-transfer slip. Both are visible on the rendered invoice.

## Invoice download is NOT Fetch-interceptable

Clicking the download icon on `/financial/invoices/patient/<id>` (or in the kebab menu) does NOT trigger a Fetch-interceptable HTTP response — likely uses `window.print()` or a JS `blob:` URL or a click on a hidden `<a download>`. Three workaround options:

1. **`page.pdf()`** — saves the visible page as PDF including UI chrome. Visually equivalent to the rendered invoice but includes sidebar/breadcrumbs.
2. **Element screenshot** — `await page.$('.invoice-preview-selector').screenshot({ path: ... })` to clip just the right card.
3. **Probe for a direct route** — `/financial/invoices/patient/<id>/pdf` or similar; not yet verified.

## URL map (verified)

| Path | Purpose |
|---|---|
| `/` | Dashboard (after login) |
| `/login` | Login |
| `/register` | Signup |
| `/forgot` | Password reset |
| `/ToC` | Terms of service |
| `/logout` | Server-side logout |
| `/agenda` | Calendar week view |
| `/patients` | Patient list (filter via `?fullName=...`) |
| `/patients/:id` | Patient detail (tabs via `?tabIndex=N`) |
| `/financial` | Financial overview (4 tabs: FACTUREN/VERZAMELSTAATFACTUREN/COMMISSIE/OVERZICHT SESSIES) |
| `/riziv` | RIZIV R-Waarde tracker |
| `/rosa` | Rosa integration page |
| `/practices` | Practice info card with LEDEN/ABONNEMENT/INSTELLINGEN tiles |
| `/practices/users` | Practice members (LEDEN page) |
| `/practices/subscription` | Subscription/billing |
| `/practices/subscription/payment/change` | Change payment method (Stripe Card Element) |
| `/practices/settings` | Practice settings (Facturatie types, invoice templates) |
| `/practices/new` | Practice creation 3-step wizard |
| `/user/profile` | User profile + personal billing identity (REQUIRED for invoicing) |

## Three-gate invoice validation (regulatory)

Invoice generation (`/financial` → "+" → select sessions → FACTUREER) enforces **three progressive checks**:

1. **Therapist (user) billing identity** — `invoices.create.incompleteUser`. Set at `/user/profile`. Required: voornaam, achternaam, adres, RIZIV nummer, rekeningnummer, ondernemingsnummer.
2. **Patient file billing data** — `invoices.create.incompletePatientFile`. Set on patient INFO tab. Required: voornaam, achternaam, full adres (incl. Plaats), aanspreking. Ziekenfonds only for derde-betaler invoices.
3. **Bilan-coverage warning at event-creation time** — Halingo warns (but doesn't block) if no bilan covers the appointment date.

Invoice number format: `<3-letter-uppercase-patient-surname-prefix>-<YYYYMMDD>-<3-digit-seq>`. E.g., `PEE-20260509-001` for Peeters.

Auto-pricing (verified): a 30-min cabinet session for §2b.2 (taalontwikkeling) bills at €38.37 via RIZIV nomenclature 713311 — Halingo's De Conventie 2026 tariff is current.

## Aanspreking dropdown options (NL)

`Meneer`, `Mevrouw`, `Mejuffrouw`, `Ouders van` (Belgian paediatric-specific), `dr.`, `Prof`, `ir.`

## Verified pathology session-cap matrix

Halingo's auto-populated `Totaal aantal sessies` per pathology, verified against Belgian RIZIV regulation (`logopedist-be` skill):

| Halingo type | Pathology | Cap | RIZIV match |
|---|---|---|---|
| `b.1` | Afasie | 288 | ✅ |
| `b.2` | Stoornissen receptieve/expressieve taalontwikkeling | 190 | ✅ |
| `b.3` | Dyslexie/dysorthografie/dyscalculie | 140 | ⚠️ logopedist-be says 144; cross-check current RIZIV |
| `b.6.3` | Chronische spraakstoornissen | 520 | ✅ + infinite renewal |
| `f` | Dysfasie | 384 | ✅ (Neuropediatrician-only prescription) |

Other pathologies (a, b.4, b.5, b.6.1, b.6.2, b.6.4, b.6.5, c.1, c.2, d, e, g) — caps not yet verified.

## Form selectors differ between create-modal and detail-edit-mode

The Halingo patient INSZ field has different DOM shapes in different contexts:

| Context | Selector | Notes |
|---|---|---|
| New-patient modal (`/patients` → "+") | `input[name="SSN"]` | Plain `<input>` with mask `__.__.__-___.__` |
| Patient detail INFO tab (`/patients/:id?tabIndex=0`) | NOT `input[name="SSN"]` (returns `null`) | INSZ field is wrapped in a different React component; query the DOM via inspect.js to find the correct path |

Same caveat applies to other masked fields (DOB, phone). When extending automation to edit-mode, re-discover selectors via inspect.js per page rather than reusing the create-modal ones.

## Reading numeric values (caps, counters, prices) from treatment view

Treatment-view fields like "Totaal aantal sessies", "Aantal gebruikte sessies", "Sessies in halingo" are rendered as plain `<input type="text">` whose `.value` is the integer. The label-walk-up pattern often fails on React-MaterialUI wrappers — use value-pattern fallback:

```javascript
const numbers = [...document.querySelectorAll('input')]
  .filter(i => i.offsetParent && i.value && /^\d+$/.test(i.value))
  .map(i => i.value);
// On treatment view: numbers[0] = totaalAantalSessies (cap), [1] = used, [2] = halingo-count
```

## Pathology-specific nomenclature code series

| Pathology | Code series | Settings (suffixes -316/-333/-355/-370/-381 = cabinet/group/school/rehab/hospital) |
|---|---|---|
| `b.2` | 713xxx | 713311 cabinet, 713333 group, 713355 school, 713370 rehab, 713381 hospital |
| `b.3` | 714xxx | 714313 cabinet, 714335 group, 714350 school, 714372 rehab, 714383 hospital |
| (initial bilan) | 711xxx (varies) | per pathology |
| (shared) | 704115, 713016 | various |

Plus collection subscriptions: `users.profileData`, `practices`, `practice`, `practicechat`, `pending_invoices`, `practiceInvoices`, `notifications.new`, `kadira_settings`, `AnalyticsUsers`, `plans`, `subscriptions`, `practiceUsers`, `referrals`, `treatments`, `bilans`, `reportsOfTreatment`, `documentsOfTreatment`.

## RIZIV pathology types — Halingo's Type dropdown

When creating a Terugbetaling (treatment), the Type dropdown lists 18 categories (matching Belgian Article 36 Logopedie):

| Code | Pathology |
|---|---|
| `a` | Mondelinge taal/spraakstoornissen (occupational) |
| `b.1` | Afasie |
| `b.2` | Stoornissen receptieve/expressieve taalontwikkeling (190-session cap, age 18 cutoff) |
| `b.3` | Dyslexie/dysorthografie/dyscalculie |
| `b.4` | Gespleten lippen |
| `b.5` | Verworven stoornissen na radiotherapie/chirurgie |
| `b.6.1` | Dysglossieën |
| `b.6.2` | Dysartrieën |
| `b.6.3` | Chronische spraakstoornissen (infinite renewal) |
| `b.6.4` | Stotteren |
| `b.6.5` | Functionele stoornissen relatie ortho |
| `c.1` | Sequelen van laryngectomie |
| `c.2` | Dysfunctie larynx/stemplooien |
| `d` | Gehoorstoornissen |
| `e` | Dysfagie |
| `f` | Dysfasie (Neuropediatrician-only prescription) |
| `g` | Locked-In Syndroom |
| `Aanvullende verzekering` | Supplementary insurance category |

Halingo correctly enforces the 190-session cap for §2b.2 (verified by inspection of the treatment view).

## Invoice payment-recording (mark as paid)

The "mark as paid" UI is **row-level only** on `/financial` → FACTUREN tab — NOT exposed on the invoice detail page nor in the kebab menu.

**Mechanism:** Each invoice row shows a clickable status badge (e.g. "OPENSTAAND") at the right side of the row. Clicking it opens an inline dropdown with **6 status values**:

| Status | Meaning |
|---|---|
| `Openstaand` | Default after creation; outstanding |
| `Onbetaald` | Explicitly unpaid (post-due distinction TBD) |
| `Gedeeltelijk betaald` | Partial payment received |
| `Geprint` | Printed (auto-set after Print action?) |
| `Gemaild` | Emailed (auto-set after Verstuur via mail?) |
| `Betaald` | Paid in full |

Selecting any value flips the invoice status immediately — **no confirmation modal, no payment-amount or payment-date prompt**. The dashboard counters at the top of `/financial` (`Inkomsten`, `Ontvangen`, `Openstaand`) update in real-time.

```javascript
// 1. Click the row's status badge (find it by current text + offsetParent)
const badge = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find(b => b.offsetParent && /^(OPENSTAAND|ONBETAALD|GEPRINT|GEMAILD|BETAALD)$/i.test((b.innerText||'').trim()));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(badge.x, badge.y);
await new Promise(r => setTimeout(r, 1500));

// 2. Click target option in dropdown — use mouse coords (DOM .click() may match wrong element)
const opt = await page.evaluate(() => {
  const li = [...document.querySelectorAll('li')]
    .find(e => e.offsetParent && (e.innerText||'').trim() === 'Betaald');
  if (!li) return null;
  const r = li.getBoundingClientRect();
  return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) };
});
await page.mouse.click(opt.x, opt.y);
```

**Implication:** Halingo treats invoice status as a 6-state flag, not as a ledger of payment events. Practices needing payment-event auditing (date, amount, method per partial-payment) must use external accounting.

## Document upload (DOCUMENTEN tab)

`/patients/<patientId>?tabIndex=3` exposes a green circular "+" button (~(1353, 368) at 1920×1080) that triggers a hidden `<input type=file multiple>` with NO MIME filter (`accept=""`).

```javascript
// 1. Navigate to DOCUMENTEN tab and wait for load
await page.goto(`https://dev.app.halingo.be/patients/${patientId}?tabIndex=3`, { waitUntil: 'domcontentloaded' });
await sleep(7000);

// 2. Find the hidden file input and upload
const handles = await page.$$('input[type=file]');
await handles[0].uploadFile('/path/to/file.pdf');
await sleep(5000);  // Halingo POSTs, then auto-navigates

// 3. After upload, page.url() will be `/patients/<patientId>/treatments/documents/<documentId>`
//    Capture documentId from the URL.
```

**Caveat — malformed files:** The upload always succeeds (DB record created), but the document **detail view** renders a generic "Oeps, er is iets misgelopen" error page if the file body can't be parsed (e.g. malformed PDF). To verify the upload, navigate back to the list — the file IS there with a "N bestand" counter increment.

**URL pattern:** `/patients/<patientId>/treatments/documents/<documentId>` — note the `treatments/` segment even when no treatment was explicitly targeted. The upload is associated with a default treatment context.

## /financial 4-tab structure

| Tab | URL state | Purpose |
|---|---|---|
| FACTUREN | default | Patient invoice list with row-level inline status badge dropdown |
| VERZAMELSTAATFACTUREN | tab click | Mutuality batch invoices — GENEREER opens a 2-mode picker (Per ziekenfonds / Per patiënt) |
| COMMISSIE | tab click | Sub-contractor commission invoices (monthly aggregate) — GENEREER on empty practice shows "De commissies zijn al volledig up-to-date" |
| OVERZICHT SESSIES | tab click | Session-type analytics donut + table; month/year filter |

**Verzamelstaat eligibility (5 conditions surfaced by Halingo info-tooltip):**
1. Uninvoiced certificate exists (must be printed or saved first)
2. Mutuality name is NOT literally "ziekenfonds" (placeholder rejection)
3. Mutuality has not yet paid
4. Invoice is not cancelled
5. A therapist is selected at the top-left filter

## DDP method catalog discovery

To dump every registered Meteor method available to the current user, run in the page:

```javascript
Object.keys(Meteor.connection._methodHandlers).sort()
```

24 invoice-related methods exposed (full list in `halingo_uat_2026-05-08/_missing_docs.md`). Notable ones:

| Method | Params | Notes |
|---|---|---|
| `invoices.edit.state` | `{invoiceId, state}` | State enum: `open` / `unpaid` / `paid` / `mailed` / `printed` (lowercase English; gedeeltelijk variant TBD) |
| `invoices.edit.administrationCost` | `{invoiceId, administrationCost: <CENTS>}` | Set admin fee. **Unit is CENTS, not EUR** — pass `500` for €5.00 |
| `invoices.edit.structuredAnnouncement` | `{invoiceId, ...}` | Edit mededeling |
| `invoices.cancel` | `{invoiceId}` | Cancel invoice |
| `invoices.add.patient` | `{...}` | Single patient invoice |
| `invoices.add.all.therapists` | `{practiceId, eventIds[]}` | Bulk from events |
| `invoices.mail` | `{invoiceId}` | Email; needs mail-template |
| `invoices.print` / `invoices.prints` | `{...}` | Print |
| `invoices.certificates.generate/print` | `{...}` | Certificate flow (verzamelstaat prerequisite) |
| `invoices.insurance.*` | various | Mutuality batch flows |
| `invoices.commission.search` | `{...}` | Commission listing |

**State enum mapping:** UI labels are Dutch but DB values are lowercase English — `Openstaand=open`, `Betaald=paid`, `Geprint=printed`, `Gemaild=mailed`, `Onbetaald=unpaid`. Use the English values when calling `invoices.edit.state` directly.

**Bypass for state-machine UI restrictions:** The dropdown UI restricts BETAALD invoices to {Gemaild, Betaald}, but `Meteor.call('invoices.edit.state', {invoiceId, state: 'open'})` succeeds regardless — automation can revert state freely. The UI restriction is client-side only.

## Therapieplan goals (long-term kanban)

`/patients/<id>?tabIndex=4` → "Therapieplan op lange termijn" section is a **3-column Kanban**: `Te behandelen` → `In behandeling` → `Doel behaald`. The "+" add affordance only renders **on hover** of a column header, which is why empty-state UI looks like there's no add button.

**DDP methods:**
- `patientFile.therapies.long.add({patientFileId, category, goal, priority})` — returns new `_id`
  - Allowed `category` enum (3 confirmed so far): `communication`, `taal`, `stem` — others rejected with "X is not an allowed value"
  - Allowed `priority` enum: `high` / `medium` / `low` (string only — numeric rejected)
- `patientFile.therapies.long.edit({...})`
- `patientFile.therapies.long.delete({therapyId})`
- `patientFile.therapies.short.edit({...})` — short-term therapieplan uses a different shape (no `.add` / `.delete`; whole-blob edit)

**Mongo collection:** `longTherapy` (separate from `patientFiles`). Subscribed when on `/patients/<id>?tabIndex=4`.

## INSZ / SSN validation has gaps (regulatory defect on dev staging)

Halingo enforces only the textual format `\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}` in its `SSN` field. It does **NOT** enforce:
- mod-97 check digit math
- date plausibility (00.00.00-000.00 is accepted)
- required-field at schema level (patients can exist with no SSN)

Probed via `Meteor.call('patientFile.add', {SSN: <bad value>})`. Documented as a HIGH-severity defect in `_missing_docs.md`.

For automation: don't rely on Halingo's INSZ validation as a safety net — generate INSZ values that pass mod-97 yourself before injecting.

## Monetary values are stored as integer CENTS

All Halingo invoice/event amounts are integers in cents — `amount: 3837` = €38.37, `pricePatient: 550` = €5.50. Confirmed for `invoices.amount`, `events.price`, `events.pricePatient`, `administrationCost`. When calling DDP methods that take amounts, pass cents.

## User profile schema (Meteor.user().profile)

Fields exposed by `Meteor.user().profile`:

| Field | Type | Notes |
|---|---|---|
| `locale` | `'nl' / 'fr'` | UI language |
| `profession` | `'SPEECH_THERAPIST'` | Enum |
| `isDeconventioned` | boolean | **Multi-conventionneerd toggle** — per-user, not per-practice. Toggle in `/user/profile`. |
| `firstName`, `lastName` | string | Therapist name on invoices |
| `phoneNumber`, `gsmNumber` | string | Contact |
| `address` | `{street, postalCode, city, location}` | Practice address shown on invoices |
| `riziv` | string (8 digits) | NIHII / RIZIV nummer |
| `bankAccount` | string (IBAN, no spaces) | E.g. `BE68539007547034` — note no spaces |
| `companyNumber` | string | BTW / Ondernemingsnummer |
| `professionOther` | string | Free text for non-default profession |

## Regulatory check methods

- `events.canBePaidBack({eventId})` — returns boolean. Evaluates whether RIZIV would reimburse this event (date inside a bilan window, treatment cap not exceeded, patient eligible). **Informational only — Halingo does NOT use it as a hard gate** at invoice generation. Useful for compliance-dashboard automation.

## Title-wrapped icons need INNER button click

Many Halingo action icons (invoice detail, etc.) have DOM structure `<div title="X"><button>...</button></div>`. The `title` is on the wrapper for tooltip rendering but the click handler is on the inner `<button>`. Clicking the wrapper div via `.click()` or coord-based `mouse.click()` often misses (the div takes up more space than the button).

```javascript
// ❌ Doesn't fire — clicks wrapper div
const wrapper = [...document.querySelectorAll('div')].find(e => e.title === 'Annuleer');
wrapper.click();

// ❌ Coord click can hit empty div area
await page.mouse.click(729, 648);

// ✅ Click inner button
await page.evaluate(() => {
  const w = [...document.querySelectorAll('div')].find(e => e.offsetParent && e.title === 'Annuleer');
  w?.querySelector('button')?.click();
});
```

Used by: invoice detail action icons (Download / Print / Verstuur via mail / Reken administratiekost aan / Herinnering via mail / Annuleer), and likely other icon rows. Locate via `title="X"` selector, click the inner `<button>`.

## Drag-and-drop event creation

`/agenda` has a sidebar with patient avatars (left) and a calendar grid (right). The primary event-creation UX is **drag a patient avatar onto a calendar slot** — Halingo opens the "Afspraak toevoegen" modal pre-filled with patient + treatment + type + 30-min duration. Click AANMAKEN to save.

```javascript
await page.mouse.move(patientX, patientY);
await page.mouse.down();
await page.mouse.move(patientX+150, patientY+50, {steps: 5});  // wiggle
await page.mouse.move(slotX, slotY, {steps: 8});
await page.mouse.up();
// Modal opens; click AANMAKEN
```

Clicking an empty calendar slot ALSO opens the modal, but with **empty Patiënt + Behandeling** — you'd need to fill these via react-select chevron-pick, which is fragile (typing into Patiënt is intercepted by global header search). **Prefer drag-and-drop.**

The modal has 4 tabs: AFSPRAAK / VERGADERING / PRIVÉ / OVERLEG. Default is AFSPRAAK. The bilan-coverage warning ("Geen bilan gevonden waar de datum van de afspraak binnenvalt") fires inline when the event date doesn't fall inside an existing bilan window.

## Bulk-invoice partitioning

`/financial` → "+" → "Selecteer alle afspraken" → FACTUREER produces **one invoice per patient** (not one combined). For 11 events across 5 patients = 5 invoices. The mededeling prefix is the patient's surname (3-letter uppercase): PEE, LEM, JAN, DEW, COO. The factuurnummer counter is **per-practice** (gap-free), not per-patient.

If one patient is missing aanspreking/address, the validation error TOAST surfaces inline (not blocking modal) and OTHER patients still get invoiced (partial success).

## Multi-user RBAC

Halingo enforces practice-scoped isolation correctly. A user without practice membership:
- Cannot access patient data via direct URL (`/patients/<id>` redirects to empty-state)
- Cannot access another practice via direct URL (`/practices/<id>` same)
- Sees an empty-state CTA on every list page: "Pas de cabinet / Vous n'avez pas de cabinet, créez un cabinet ou demandez à votre responsable de cabinet de vous inviter"

**Locale switching:** FR locale shows "Tableau de bord / Agenda / Dossiers patient / Financier / Cabinet / INAMI / Rosa" (where INAMI = French equivalent of Belgian RIZIV).

If a signed-up user hasn't filled their profile, the top-right user widget shows the raw email instead of a display name (e.g. `marcus.whitfield3931@proton.me`).

## Auth endpoint intermittent on dev staging (2026-05-09 to 2026-05-10)

Halingo dev staging exhibited auth instability — 5+ consecutive `/login` attempts returning "Internal server error" inline, then suddenly succeeding after a 2-minute back-off. Affects both test accounts independently. Implication: automation MUST retry-with-backoff on login attempts.

## Derde betaler toggle (PER-TREATMENT, not per-patient)

The Derde betaler (third-payer) toggle lives on the **expanded treatment row** inside the patient TERUGBETALING tab — NOT on the patient profile. Click chevron at right of treatment row to expand → toggle "Derde betaler" appears next to "Alarmfunctie einde terugbetaling". Default OFF. Auto-saves on click.

```javascript
// To toggle:
await page.mouse.click(/* Derde betaler switch coords on the expanded treatment row */);

// To verify:
await page.evaluate(() => {
  const lbl = [...document.querySelectorAll('label, p, div, span')].find(e => e.offsetParent && (e.innerText||'').trim() === 'Derde betaler');
  return lbl?.parentElement?.querySelector('input[type=checkbox]')?.checked;
});
```

A patient with multiple treatments can have one in derde-betaler and another in tiers-garant — the flag is treatment-scoped.

**Important: NOT retroactive.** Toggling Derde betaler ON for a treatment AFTER sessions have been billed as patient invoices does NOT cancel + re-issue those invoices to verzamelstaat. The toggle only affects FUTURE invoice generation. To migrate existing invoices, manually Annuleer them and re-bill.

## Ziekenfonds picker (Belgian RIZIV mutuality codes)

Patient INFO tab → Medische gegevens accordion → click chevron to expand → "Ziekenfonds" field shows a 95-option autocomplete picker with real RIZIV codes:

```
(100) Landsbond der Christelijke Mutualiteiten — Haachtsesteenweg 579, 1031 Brussel
(107) Verbond M.R.B. - Verbond van mutualiteiten, Ziekteverzekering, Alle risico's in België
(120) Christelijke Mutualiteit Vlaanderen
(134) Mutualité chrétienne (FR equivalent of 100)
(200) Landsbond van de Neutrale Ziekenfondsen
... (95 total)
```

Click the option (mouse coords on the LI element); DOM `.click()` does NOT register react-select changes. After picking, the field shows "(NNN) <name>" instead of the placeholder.

## Verzamelstaat full prerequisite chain (corrected)

The 5 conditions surfaced in the GENEREER info-tooltip are necessary BUT NOT SUFFICIENT. The full chain is:

1. **Treatment-level**: Derde betaler toggle ON (on the expanded treatment row).
2. **Patient-level**: Ziekenfonds field set (95-option picker; pick a real mutuality code, not literal "ziekenfonds").
3. **Session-level**: Each event under that treatment has a **certificate (getuigschrift) generated**. Halingo creates the certificate from the bilan-content; if the bilan is empty/incomplete, the certificate-warning icon shows on each invoice and the verzamelstaat won't batch.
4. **Bilan-level**: The bilan must be saved AND printed (status flag).
5. **GENEREER per ziekenfonds**: only at this point does Halingo bundle eligible certificates into a verzamelstaatfactuur per mutuality.

If steps 1-2 are met but 3-4 are missing, GENEREER runs silently (no 5-condition tooltip) and produces 0 facturen.

## /financial FACTUREN filter (9 statuses, 6 sort options)

Click FILTER on /financial → FACTUREN tab → modal with:
- 6 sort options: Datum oud→nieuw, Datum nieuw→oud, Naam oplopend, Naam aflopend, Bedrag oplopend, Bedrag aflopend
- 9 status checkboxes: Betaald, Openstaand, Onbetaald, Gedeeltelijk betaald, Gemaild, **Afgeprint**, **Derde betaler**, Geannuleerd, **Ongeldig**

The 3 bold statuses (Afgeprint / Derde betaler / Ongeldig) are NOT in the inline-row dropdown — they're filter-only. So the full state-machine has 8 reachable states (Openstaand, Onbetaald, Gedeeltelijk betaald, Geprint/Afgeprint, Gemaild, Betaald, Geannuleerd, Ongeldig) plus the Derde betaler flag.

## /riziv R-Waarde tracker

Annual RIZIV-points tracker. Shows total R-Waarde (sum of per-code R-points across all sessions) + breakdown by month + verstrekkingen met/zonder nomenclatuur. Year + Maand filters. Useful for therapist accreditation compliance — Belgian RIZIV requires therapists to maintain a minimum annual R-Waarde threshold.

## Rosa external sync (`/rosa`)

Token-based connection to pro.rosa.be (Belgian online appointment platform). Login at hp-calendar.rosa.be. Status field shows "Niet verbonden" / "Verbonden". User pastes token from Rosa; clicks VERBINDEN. Allows publishing public agenda for online patient bookings.

## Plan-tier user limits (BASIC=1 / STANDARD=2-5 / PREMIUM=5+)

`/practices/users` "Lid toevoegen" button is `<button disabled title="Praktijk heeft het limiet van toegelaten gebruikers bereikt, verhoog het plan indien u meer gebruikers wilt uitnodigen">` on BASIC. To enable invitations, upgrade to STANDARD (€495/yr, 2-5 users) or PREMIUM (€715/yr, 5+ users).

Plan tiers (verified at `/practices/subscription/change`):

| Tier | Monthly | Yearly | Users |
|---|---|---|---|
| Basis | €24.2/Maand | €220/Yr | 1 |
| Standaard | €54.45/Maand | €495/Yr | 2-5 |
| Premium | €78.65/Maand | €715/Yr | 5+ |

Yearly ≈ 10× monthly (2-month discount). All tiers have full feature access — only user-limit differs.

## Agenda — 4 event types

| Type | Fields |
|---|---|
| AFSPRAAK (default) | Therapeut, Patiënt, Behandeling, Type, Subtype, Start, Einde, Locatie, Prijs, Kilometer, Herhalen |
| VERGADERING | Titel, Start, Einde, Herhalen |
| PRIVÉ | Titel (required), Start, Einde, Herhalen |
| OVERLEG | Start, Einde, Locatie, Prijs, Kilometer (no Patiënt — inter-professional case meeting; billable) |

## Locatie picker (6 options including telehealth)

`Praktijk / Kabinet / Thuis / School / Revalidatie / Video consultatie`. Picking Video consultatie shows a video icon in the field; no link input — link auto-generates server-side. Each locatie maps to a different RIZIV nomenclature suffix per pathology.

## Bilan expiration auto-flag

Each treatment row on patient TERUGBETALING tab shows a clipboard-! icon next to the treatment name. Hover tooltip: "De terugbetaling is verlopen" — auto-flags expired bilans (Belgian 180-day rule: bilan validity expires 180 days after creation).

## Tags widget toggle pattern

Patient profile right-card "Tags" header has a bookmark-shaped icon at top-right. Click toggles edit mode: input field + clear-X button. Free-text tag entry, save-on-blur. Same pattern likely on other inline-edit widgets.

## Agenda settings + iCal feed

`/agenda` → gear icon (top-right) → settings page. iCal feed URL only generates when "Agenda weergeven op andere apparaten" toggle is ON: `https://dev.app.halingo.be/api/agenda/private/<17-char-token>` — paste into Google Calendar / Outlook for read-only sync.

## Aanbrengbonus referral link format

`/practices/subscription` → DOE MEE on Aanbrengbonus → modal exposes referral link: `https://dev.app.halingo.be/register?referral_user_id=<userId>&locale=<nl|fr>`. Each successful conversion = 1 free month for the referring user.

## Common interaction pitfalls

- **Patient autocomplete typing intercepted by global search** — when an open modal has a `react-select` for Patiënt, do NOT type into it; the header search bar captures the keystrokes and navigates the page (dismissing the modal). Work around by clicking options with mouse or by setting the underlying React state programmatically.
- **Modals close on outside click** — clicking elsewhere (including the global search bar) dismisses any open modal.
- **iCheck checkbox state may persist** — toggling WACHTLIJST in one patient-create modal MAY carry over to subsequent modals (suspect, to verify). Always explicitly toggle to desired state.
- **List view UI lag** — patient list shows "Geen terugbetaling" badge even after a treatment is created; reload to refresh.

## Status by phase

- ✅ Phase A — login + signup structure captured, recipe written
- ✅ Phase B1 — Liam (Nele Van den Broeck) signed up, userId `nrBKA6xYo9jCL8SjY`
- ✅ Phase B2 — Marcus (Sophie Dubois) signed up via direct /register, userId `XdJvrzr9pFF93GDBd`, FR locale
- ✅ Phase C — Practice "Praktijk Van den Broeck" created on free trial, practiceId `rkdDPLXHh54cnLYD3`
- 🚧 Phase D — Identity ✅, practice-mgmt mostly ✅, patient-mgmt: **5/5 patients created** (Lien, Mathias, Emma, Lucas, Margaux), treatment-creation ✅ (1 treatment for Lien with §2b.2, 190 cap), agenda modal documented (event creation deferred). Subscription: card token saved but UI defect.
- 🚧 Phase E — pathology dropdown captured (interleaved with D); §2b.2 session cap verified; Evolutiebilan defect surfaced
- ⏳ Phase F — reporting + commit

Working directory for outputs: `C:/Repos/halingo_uat_2026-05-08/`

---

## Session 3 addenda (2026-05-11) — recipes that override the above

### Bilan write+save round-trip — RESOLVED (was deferred)

**Voorschrijvende arts typeahead accepts brand-new (unknown) physician names**, contradicting earlier #189 finding. The full save gesture:

1. Patient `?tabIndex=1` (TERUGBETALING) → wait for treatment card render.
2. `clickInnerButton(page, 'Klap open')` on the treatment.
3. Wait until `document.body.innerText` contains "Voorschrijvende arts" (poll up to ~30s — staging is slow).
4. Find the label's coords (`label.getBoundingClientRect()`) and **mouse-click ~80px right + 30px down** of the label top-left — the input itself sits below the label inside a react-select container.
5. **Type** the new physician name (e.g. `Dr. UAT Test 1778502424463`) at delay ~30 ms/char.
6. Press **Enter** → the typed text appears in the field with an X-clear icon (as if a real option was selected).
7. Press **Tab** → commits the selection.
8. **Click elsewhere on the page** (e.g. `page.mouse.click(800, 200)`) to blur.
9. Wait **5 s** for the debounced auto-save (no Opslaan button is involved on Mathias's bilan — auto-save fires invisibly; DDP frame capture often misses it because the CDP listener attaches after the save method goes out).
10. Reload the patient page; the physician name is in the DOM.

**Pitfall the previous recipe missed:** focusing the react-select input via `document.getElementById('react-select-N-input').focus()` does NOT keep keyboard focus — typed characters end up in the **global Zoeken... search bar** at the top of the chrome instead. Always click the field's bounding-rect coords with `page.mouse.click()` first, then type.

Reference: `test-scripts/315-bilan-save-opslaan.js`.

### Email-field selector pattern (avoid the global search trap)

The same global-search trap applies to **every** form input that lives on a patient detail page. To target a labeled input safely:

```javascript
await page.evaluate((value) => {
  const lbl = [...document.querySelectorAll('label')]
    .find(e => e.offsetParent && /^E-mailadres$/i.test((e.innerText||'').trim()));
  let wrapper = lbl.parentElement;
  let inp = wrapper.querySelector('input');
  // walk up until the wrapper contains EXACTLY one input (the labelled one)
  while (inp && wrapper.querySelectorAll('input').length > 1) {
    wrapper = wrapper.parentElement; inp = wrapper.querySelector('input');
  }
  inp.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, value);
  inp.dispatchEvent(new Event('input',  { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  inp.blur();
}, throwawayEmail);
```

`<label>.parentElement` is the field wrapper; if it contains more than one input (because Material UI sometimes nests several labels into a single Grid row), keep walking up until you find an isolating wrapper. The previous naive `label.closest('div').parentElement.querySelector('input')` returned the FIRST input in the form (usually Voornaam) and silently corrupted the wrong field.

### Throwaway mailbox: Mailinator works

Halingo delivers to `*@mailinator.com` for invitations, Aanbrengbonus, and WIJZIG E-MAILADRES verification mails (all confirmed). **1secmail / Ethereal / Mailpit / Mailtrap don't apply** — Halingo is the sender, not us, so SMTP-capture services are useless here.

Helper at `C:/Repos/halingo_uat_2026-05-08/test-scripts/_mailbox.js`:

```javascript
const { mkAddr, poll } = require('./_mailbox');
const addr = mkAddr('uat-something');   // → uat-something-<ts>@mailinator.com
// trigger flow that sends mail to `addr`
const res = await poll(addr, { timeoutMs: 90000, intervalMs: 5000 });
// res = { ok: true, msgs: [{ subject, fromfull, time, ... }] }
```

The Mailinator public API is `https://api.mailinator.com/api/v2/domains/public/inboxes/<local-part>` — no auth needed.

### DDP method addenda

| Method | Notes / payload |
|---|---|
| `patientFile.update` | Auto-save on field blur (~3-6 s debounce). Params: `{patientFileId, fields:{contactDetails:{email}, firstName, lastName, address:{...}, ...}}`. Server responds with `{msg:"changed", collection:"patientFiles", fields:{...}}`. |
| `invoices.mail` | **Behaves badly even with a non-empty mail template (see below).** Previous recipe entry says "Fails with `invoices.mail.noText` if template empty" — that's only one failure mode. With Liam's setup we observed a **silent hang**: method fires, no `{"msg":"result"}` arrives in 30+ s, no SMTP delivery, no UI feedback. Bug is server-side in the handler. Tracked as defect #310. |
| `practices.invite` (inferred) | Triggered by Praktijk → Leden → Lid toevoegen → Opslaan (modal: "Nodig iemand uit tot deze praktijk"). Sends mail with subject **"Praktijkuitnodiging"** in ~8 s. Mailinator-friendly. Disabled on BASIC plan (1-user limit) — must upgrade plan first. |
| (Aanbrengbonus VERZEND path) | Method name not captured (likely HTTP POST, not DDP method). Confirmed mail-send works — recipient gets `"Nele Van den Broeck heeft je uitgenodigd!"` — but UI gives **no toast / modal stays open**. Defect #178 is a UX defect, not functional. |

### Plan upgrade DDP shape

Clicking **Kies** on a plan tile at `/practices/subscription/plan/change` and confirming **JA** sends a method that flips the `subscriptions` collection field `planId`. The reactive subscription `plans` returns three docs:

```
{name:"BASIC",    price:2420, maxUsers:1}
{name:"STANDARD", price:5445, maxUsers:5,  highlight:true}
{name:"PREMIUM",  price:7865, maxUsers:-1, highlight:false}
```

`maxUsers: -1` means unlimited. Prices are in **cents** (€ ×100). Upgrade does NOT require re-entering a card if one is already on file (the Stripe customer carries over).

### /financial — 4 tabs (not 1)

Earlier recipe sections mention `/financial FACTUREN` only. The page actually exposes 4 tabs:

| Tab | Content |
|---|---|
| `FACTUREN` | Per-patient invoices list. 9-status FILTER (already documented above). |
| `VERZAMELSTAATFACTUREN` | Bundled mutuality batches. Empty until verzamelstaat prereqs met. GENEREER opens the per-ziekenfonds chooser. |
| `COMMISSIE` | Commission invoices (events.create auto-generates one per appointment). No mark-paid affordance — that's a gap. |
| `OVERZICHT SESSIES` | Aggregated session counts by Beschrijving (e.g. "Logopedische therapie: 30 min"), PLAATS (Kabinet/Thuis), PRIJS. Top-right shows "Niet gefactureerde sessies" counter. Useful for verifying invoice-completeness before VERZAMELSTAAT batch. |

### /agenda/settings full content

The existing "Agenda settings + iCal feed" section understates what's there. Full page:

- **Gepersonaliseerde weergave** card: Beperk weergegeven uurbereik toggle + Beginuur/Einduur dropdowns (default 08:00–20:00), Start kalenderweergave dropdown (`Bovenaan` / others), **Gepersonaliseerde weergave** dropdown = **`3 Dagen`** (custom-N-day view, in addition to Day/Week/Month).
- **Afspraakinstellingen** card: brightness toggle "De helderheid van vroegere afspraken lichter weergeven" + **Standaard kleur per type afspraak** matrix (4 event types × 7 colors = 28 swatches).
- **Instellingen voor delen van agenda** card: toggle + iCal URL (already documented).

### Patient FILTER popup

Click `FILTER` on `/patients` opens a popup with:

- **2 sort options**: Oplopend / Aflopend
- **4 status checkboxes**: `In opstart` · `Actief` · `Inactief` · `Wachtlijst`

Wachtlijst is also a per-patient badge (set via the WACHTLIJST button on the patient detail header). Inactief filtering surfaces archived patients; the actual archive-toggle gesture (to flip a patient INTO Inactief) is not yet documented and warrants a probe.

### Per-invoice kebab — 7 items

Earlier recipe mentions "5 actions on row icons" loosely; the kebab (⋮) on each invoice row in patient FACTURATIE actually exposes **7 items**:

`Bekijk · Download · Print · Verstuur via mail · Reken administratiekost aan · Herinnering via mail · Annuleer`

For GEANNULEERD invoices the menu **incorrectly still shows all 7** including Annuleer + Reken administratiekost (defect #225). Verstuur via mail + Herinnering via mail both inherit the `invoices.mail` hang defect (#310).

### Active defect catalog (as of 2026-05-12)

| # | Sev | Defect |
|---|---|---|
| 178 | LOW | Aanbrengbonus VERZEND has no UI feedback (toast/modal-close). Mail IS actually sent. UX-only. |
| 181 | LOW | Global search non-functional. |
| 182 | MED | Newsfeed "hier" links go to Zendesk EDITOR (admin-only) URLs. |
| 193 | HIGH | Patient DOCUMENTEN accepts arbitrary file types (.txt, .exe) — no MIME validation. |
| 220 | MED | /financial Openstaand vs Dashboard aggregator inconsistency (€460,44 vs €306,96). |
| 225 | MED | GEANNULEERD invoice kebab still shows all 7 items including Annuleer + Reken admin. |
| 226 | HIGH | INSZ `99.99.99-999.99` accepted (no mod-97, no DOB check). |
| 249 | HIGH | Signup auto-login without email verification ("Niet gevalideerd" persists). |
| 310 | HIGH | `invoices.mail` DDP method hangs — no response in 25+ s, no mail delivered, no UI feedback. Tested with valid mail template assumed; needs retest after explicitly setting one at Praktijk → INSTELLINGEN. |
| 317 | HIGH | Pathology session cap NOT enforced server-side. `events.create` accepted 195 events at §2b.2 treatment (cap 190) without rejection. Regulatory: should block at the cap. |
| 319 | HIGH | Unverified-email auto-block after ~3 days. Escalation of #249. Liam blocked 2026-05-11, Marcus blocked 2026-05-12. |
| 320 | **CRITICAL** | Block-screen recovery button DEAD in both NL and FR locales — `Stuur validatie e-mail` / `Envoyer un email de validation` fires zero DDP, zero HTTP, no UI change. Customer hitting auto-block has no in-app recovery. |
| 363 | **CRITICAL** | Even retrieving a valid verify-email link via Proton inbox + visiting the URL while logged in + clicking GA VERDER does NOT clear the account-blocked state. Page redirects back to the block screen. Together with #320, this means a customer hitting the unverified-email auto-block is fully stranded — admin DB fix required. |
| 365 | **HIGH** | `events.create` silently hangs under rapid repeat use — same pattern as #310 `invoices.mail`. DDP frame sent, no `result` reply, treatment `usedSessions` stays 0, callback returns `{err:null, res:undefined}` — caller can't distinguish from success. Regression #401 hit this after creating 3 fresh patients on an already-active account. |
| — | INFO | Halingo throttles new `/register` signups from a single IP after a few successes (submit fires zero DDP, no mail). Workaround: rotate IP or reuse verified accounts. |
| 420 | **HIGH** | WIJZIG WACHTWOORD button on /user/profile is dead — same shape as #320. Mouse-click on its bbox fires zero handlers, no password modal, no DDP. WIJZIG E-MAILADRES right next to it works fine despite sharing identical Halingo class names. Users cannot change their password through the UI. |
| 430 | MEDIUM | Patient VERWIJDER → JA confirm fires nothing. Click JA on the "Verwijderen" modal → no DDP, no record removed. Modal closes silently. Same silent-fail-open family. Likely guarded-block (patient has events/invoices) without an error UX. |

### Image uploads (avatar + logo) — they DO exist, click the placeholder image

Both profile picture and practice logo uploads are functional, contrary to earlier "feature gap" notes:

- **User avatar** (`/user/profile`) — click the **circular** `.img-circle` placeholder (~150px wide). File picker opens, then a modal titled **"Afbeelding bijsnijden"** with a square crop overlay. Click **BIJSNIJDEN** to commit. Avatar persists across reload + shows in the top-right user pill.
- **Practice logo** (`/practices` — NOT `/practices/settings`) — click the **square** placeholder image at top-left of the practice info card. Same cropper flow. Logo persists in the left-sidebar practice indicator + the practice header.

```js
const target = [...document.querySelectorAll('.img-circle, .img-square')].filter(e => e.offsetParent && e.getBoundingClientRect().width >= 80)[0];
// click center of target → file picker → uploadFile → BIJSNIJDEN
```

The image is NOT stored in `Meteor.user().profile.avatar` or `practice.logo` directly — it's served via a different URL (avatars are likely uploaded to a CDN/asset store, referenced indirectly). `window.Meteor.connection._stores.avatars._getCollection()` is also empty even after a successful upload — so don't rely on Minimongo to verify; verify by reloading and screenshotting.

### Aanspreking 7-option enumeration — click the dropdown ARROW

Earlier notes said only 5 of 7 options surface. Wrong — clicking the dropdown ARROW (right edge of the react-select control, ~10px from the right) opens the full list. All 7 appear at once: **Meneer / Mevrouw / Mejuffrouw / Ouders van / dr. / Prof / ir.**

```js
const inp = document.getElementById('react-select-4-input');  // or whichever react-select-N has Aanspreking
// find the control container's right edge:
let n = inp; for (let i=0; i<6 && n; i++) { if ((n.className||'').toLowerCase().includes('control')) break; n = n.parentElement; }
const r = (n || inp.parentElement).getBoundingClientRect();
await page.mouse.click(Math.round(r.x + r.width - 12), Math.round(r.y + r.height/2));
// Now options render as [id^="react-select-"][id*="-option-"]
```

### Bekijk sjabloon — Font Awesome eye icon

The "Bekijk sjabloon" preview toggle is a `<i class="fa fa-eye">` Font Awesome icon at the bottom of each template card (at y ≈ 863 on a 1080-tall viewport with the section in view). NOT an SVG — that's why a generic SVG search misses it. Click toggles an expanded preview of the rendered invoice template inline.

### Verify-email URL patterns

- Halingo sends verification mail with subject `Nieuw e-mailadres verifiëren` (NL) / `Vérifier la nouvelle adresse email` (FR).
- All outbound links are wrapped in **AWS SES tracking redirect**: `https://zyhwcnl.r.eu-west-3.awstrack.me/L0/<urlencoded-direct>/...`. The wrapper is **single-use** — second visit returns HTTP 400.
- Always extract the **direct URL** from inside the wrapper: regex `(https:%2F%2Fdev\.app\.halingo\.be%2Fverify-email%2F[^%]+%3Flocale=[a-z]+)` then `decodeURIComponent()`.
- Each "Stuur validatie e-mail" trigger sends a NEW mail with a NEW token. Older tokens may or may not still be valid; always pick the most recent thread message.
- The verify URL only works if the user is logged in to Halingo. Visiting while logged-out lands on `AANMELDEN`. Visiting while logged-in as the same user shows `Momenteel ingelogd als: <name>` + `GA VERDER` + `LOG UIT`.
- **CAVEAT (defect #363)**: clicking GA VERDER on a blocked account does NOT unblock — the verify succeeds but the block flag stays. Don't rely on this flow to recover blocked accounts.

### Proton inbox helper for Liam/Marcus

When the verify mail goes to `*@proton.me` (Liam, Marcus), log into Proton via `account.proton.me/login` → navigate to `mail.proton.me`, dismiss the onboarding gauntlet (see `sites/proton.md`), match the email row by subject `Nieuw e-mailadres verifiëren` (not just sender "Halingo" — there will be multiple Halingo emails), open it, then extract the link from the `about:blank` iframe (NOT the `mail.proton.me/...` chrome frame, which only has mailto links).

For fresh test accounts using Mailinator, poll the public API: `https://api.mailinator.com/api/v2/domains/public/inboxes/<local-part>` returns `{msgs}`, then `/messages/<id>` returns the full body. The message body's `href` values are JSON-escaped (`\/`) — match against the escaped form first.

### Session 4 addenda (2026-05-12) — fresh-account onboarding, full chain proofs

- **Fresh signup → verification → full test-bed bootstrap** in `_fresh_account.json`. The flow `/register` → auto-login → poll Mailinator for "Nieuw e-mailadres verifiëren" → visit direct `/verify-email/<token>` link (not the awstrack.me wrapper, which 400s on second use) → click `GA VERDER` → badge cleared. Saved to `~/.claude/projects/.../memory/halingo_fresh_account_setup.md`.
- **Three onboarding wizards documented end-to-end** (#327-#340): Practice create (3 steps), Patient add modal, Treatment add modal. See `halingo_wizard_recipes.md` memory. **§2b.3 cap = 140** sessions (earlier docs said 144 — RIZIV update).
- **Bilan write+save resolved on second practice** (#340): gesture is type → Enter → Tab → blur → wait (no Opslaan needed). Persists across reload. See `halingo_bilan_save_gesture.md` memory.
- **Events → invoice DDP chain proven** (#341-#349): `events.create` shape `{title, patientFileId, treatmentId, userId, start:Date, end:Date, type:1, meta:{type:1, subType:30, location:1}, practiceId, repeat:null, color:'#18a689'}`. Then `invoices.add.all.therapists({practiceId, eventIds})` returns `{success: N, errors: [...]}`. Failures: `incompleteUser` or `incompletePatientFile` until the required fields are filled. See `halingo_invoice_chain_recipe.md` memory.
- **Ziekenfonds typeahead** (#350): scrollIntoView + 80px right of label + type "100" + click `(100) Landsbond der Christelijke Mutualiteiten` option from list. Saves `patient.healthInsurance = 100`.
- **Invoice mededeling format**: `<PracticePrefix>-<YYYYMMDD>-<NNN>` (e.g. `UAT-20260512-001` where `UAT` = first 3 caps of practice name).
- **Patient archive via DDP only** (#356): `patientFile.update({state: 'inactive'})` works. UI exposes only WACHTLIJST + VERWIJDER on the patient detail page; no Archiveer button. States: pending / active / inactive / waitlist.
- **Aanspreking enumeration** (#355): 5 of 7 surfaced via 26-letter probe — Meneer / Mevrouw / Mejuffrouw / Ouders van / Prof. `dr.` and `ir.` did not surface — likely typeahead requires ≥2 chars for period-containing options.
- **Practice settings store shape** (#358): `settings.invoices = {locale, template, type: 'member', mail: {template}}`, `settings.patientFiles.notifications = {date: 7, sessions: 10}`. Sjabloon factuur tile-click does not persist via DDP — needs explicit save.
- **Schema additions** (#360): `practiceUsers = {userId, practiceId, role: 'owner'|'member', commission: {type: 'none'|...}}`. `subscriptions = {practiceId, trialEnd, start, periodStart/End, activeUntil, type: 'BASIC', paymentInfo: {type: 'none', repeatedAt: 'monthly'}}` — 30-day trial.
- **Drag-resize/move events** — confirmed wired (`rbc-addons-dnd`) but Puppeteer CDP errors out on the multi-step mouse-move during DnD. Defer to manual verification or Playwright.
