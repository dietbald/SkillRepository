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
