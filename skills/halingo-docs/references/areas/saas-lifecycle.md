# SaaS Lifecycle

**Migration area** combining Phase 1 discovery, Phase 2 spec contracts, helpdesk references, and code-derived from_source notes.

## What this area covers

Subscription billing, plan management, Stripe webhooks, referral programme.

## Spec contracts (Phase 2)

- **billing** — Feature: saas/billing
  - Path: `02-specs/saas/billing/spec.md`
- **deprecated-do-not-port** — Feature: saas/deprecated-do-not-port
  - Path: `02-specs/saas/deprecated-do-not-port/spec.md`
- **referral-programme** — Feature: saas/referral-programme
  - Path: `02-specs/saas/referral-programme/spec.md`
- **stripe-webhooks** — Feature: saas/stripe-webhooks
  - Path: `02-specs/saas/stripe-webhooks/spec.md`
- **subscription-management** — Feature: saas/subscription-management
  - Path: `02-specs/saas/subscription-management/spec.md`

## Cross-references

- **Helpdesk articles:** see `references/helpdesk/` (NL/FR helpdesk dump split into 8 files; the Coverage Matrix at `references/03-coverage-matrix.md` maps each functional grouping to its primary helpdesk source).
- **From-source feature notes:** see `references/from-source/features/` and the master cross-reference at `references/from-source/inventory.md`.
- **From-source technical reference:** `references/from-source/technical/{collections,methods,routes,publications,background-jobs,migrations-timeline,rest-endpoints}.md`.
- **Bugs / security:** `references/from-source/bugs-and-security.md`.
- **Deprecation list:** `references/from-source/deprecation-list.md` (22 items).
- **Open questions answered:** `references/from-source/open-questions.md` (44 Q&A driving triage).

---

## Phase 1 discovery (verbatim from `01-discovery/saas-lifecycle.md`)

# Discovery: SaaS Lifecycle

**Area:** #20 SaaS Lifecycle (from `application_map.md` § 2, competency 20)

**Scope in one breath:** Integrated subscription management, plan/billing lifecycle, trial management, and the "Aanbrengbonus" referral program for the Halingo platform itself. Excludes clinical patient billing (areas #11–14).

**Date:** 2026-04-09
**Agent:** Gemini CLI (parallel sources 1+2 dispatch)

---

## Source 1 — HalingoDoc audit

### Files read

| Layer | File | Lines | Read | What it contributed |
|---|---|---:|---|---|
| Helpdesk | `full_documentation/general_getting_started.md` | 2191 | §§ "SaaS lifecycle" (lines ~1800-2000) | Happy-path subscription, plan selection, and trial overview in NL/FR. |
| Curated | `functional/application_map.md` | — | § 2 competency 20 | Formal area definition. |
| Curated | `docs/coverage_matrix.md` | — | Row 20 | Mapping to helpdesk and code-derived docs. |
| Code-derived | `from_source/features/saas_subscriptions.md` | ~250 | full | Core subscription logic, data models, UI routes, and entity hardcoding. |
| Code-derived | `from_source/features/stripe_invoices.md` | ~300 | full | SaaS billing lifecycle, states, REST endpoints, and print template details. |
| Code-derived | `from_source/features/referral_programme.md` | ~200 | full | "Aanbrengbonus" state machine, methods, and known authorization bugs. |
| Cross-cutting | `from_source/deprecation_list.md` | — | ctrl-F "subscription", "referral" | Items #8, #12, #13, #18 — confirmed cleanup backlog. |
| Cross-cutting | `from_source/bugs_and_security_findings.md` | — | ctrl-F "stripe", "referral" | Identified test-key leak and referral auth gap. |
| Cross-cutting | `from_source/open_questions.md` | — | Q5, Q7, Q14, Q15, Q25 | Resolved ambiguities around referral auth, dead permissions, and locales. |

### What HalingoDoc covers for this area

HalingoDoc provides strong coverage of the SaaS Lifecycle. The helpdesk material (`general_getting_started.md`) covers the end-user perspective on plans and trials. The code-derived feature docs (`saas_subscriptions.md`, `stripe_invoices.md`, `referral_programme.md`) provide a deep dive into the Meteor implementation, including the dual-channel payment model (Bancontact vs. Card), the 17-char random ID requirement (crucial for parity), and the hardcoded Belgian vs. Singapore seller entities.

### What HalingoDoc does NOT cover for this area

- The exact UI components used for the Stripe Elements integration (mentioned as "not read in this pass" in `stripe_invoices.md`).
- The specific visual layout of the "Plan Change" grid on staging.
- The detailed state of `_PARITY_` test data for subscription flows (Source 3 deferred).

### Direct citations worth preserving

> From `from_source/features/saas_subscriptions.md`:
> > Halingo's per-practice SaaS billing layer. A subscription is owned by a **practice** (not by a user) and is the gate that allows the practice to use the bulk of the application's authenticated functionality.

> From `from_source/features/stripe_invoices.md`:
> > **Two hardcoded sender entities**:
> > - **Autopilot Pte Ltd** (Singapore) — used when `invoice.getTaxPercent() === 0` (i.e. zero VAT).
> > - **Nifiq BV** (Heverlee, BE) — used when there is a VAT percent.

---

## Source 2 — Meteor source slice

### Files read (21 total)

- `app/imports/api/subscriptions/`
  - `subscriptions.jsx` — Collection, schema (ACTIVE/TRIAL/CANCELLED), leeway logic.
  - `methods.jsx` — `plans.get`, `practice.subscriptions.plan.change`, `practice.subscriptions.payment.change`.
  - `util.jsx` — Client-side helpers.
  - `server/invoiceCreator.jsx` — The Bancontact billing loop (SyncedCron).
  - `server/util.jsx` — Stripe subscription creation, trial end logic, referral consumption.
  - `server/webhooks.jsx` — Stripe webhook entry point.
- `app/imports/api/payments/`
  - `plans.jsx` — Plans collection, user caps (`maxUsers`).
  - `server/stripe.ts` — EventParser for Stripe webhooks (`invoice.payment_succeeded`, etc.).
- `app/imports/api/invoices/stripeInvoices/`
  - `stripeInvoices.jsx` — SaaS invoice schema, states (OPEN/PENDING/PAID/FAILED).
  - `server/rest.js` — REST endpoints for PDF generation and state updates.
- `app/imports/api/referrals/`
  - `referrals.js` — Collection, states (INVITED/REGISTERED/PAID/CONSUMED).
  - `methods.js` / `server/methods.js` — `referrals.invite` (server-only send), `referrals` list.
  - `server/util.jsx` — `sendReferralToEmail` logic.
- `app/imports/modules/invoices/stripe/`
  - `StripeInvoicePrint.jsx` — The HTML/PDF template with hardcoded seller entities.
- `app/imports/api/practiceUsers/practiceUsers.jsx` — Role-permission mapping (Owner required for subs).

### Key symbols per file

- `api/subscriptions/subscriptions.jsx:30-60` — `Subscriptions` schema.
- `api/subscriptions/server/invoiceCreator.jsx:62-200` — `_createInvoiceAndCloseLast` (Bancontact loop).
- `api/subscriptions/server/util.jsx:27-105` — `_createStripeSubscriptionForPractice`.
- `api/payments/server/stripe.ts:20-220` — `EventParser` for Stripe webhooks.
- `api/referrals/referrals.js:19-25` — `Referrals.states` enum.
- `modules/invoices/stripe/StripeInvoicePrint.jsx:16-36` — Hardcoded `autoPilot` and `nifiq` entities.

### Discrepancies found vs HalingoDoc

| # | Discrepancy | HalingoDoc says | Source says | Trust |
|---|---|---|---|---|
| 1 | Referral Auth | Owner required | Bare `LoggedInValidatedMethod` (Q5 bug) | Source (Bug) |
| 2 | Dead permission | `practice.subscriptions.change` listed | No code references the constant | Source (Deprecation #8) |
| 3 | Plan user cap | Not detailed | `canAddUsers` uses `<` vs `canSelectByUserCount` uses `<=` | Source |

---

## Source 3 — Local Meteor walk (DEFERRED)

This run is a parallel Sources 1+2 dispatch; browser-pilot access is held exclusively by another Gemini instance running discovery for a different area. Source 3 for this area will be walked in a dedicated follow-up pass once the other Gemini finishes. Gated screens have been noted in the feature catalog's "Found via" column as `docs + source` only; they will become `docs + source + staging` after the follow-up pass.

---

## Features

| # | ID | Name | Found via | HalingoDoc | Meteor source | Notes |
|---|---|---|---|---|---|---|
| 1 | `saas/trial-start` | Automatic 30-day trial for new practices | docs + source | `saas_subscriptions.md`, `general_getting_started.md:1850` | `api/subscriptions/server/util.jsx:145` | `usedTrial` flag on Practice. |
| 2 | `saas/subscription-create-card` | Stripe card-backed subscription | docs + source | `saas_subscriptions.md` | `api/subscriptions/server/util.jsx:27` | Stripe Customer + Subscription creation. |
| 3 | `saas/subscription-create-bancontact` | Halingo-managed Bancontact subscription | docs + source | `saas_subscriptions.md` | `api/subscriptions/server/util.jsx:132` | Uses `InvoiceCreator` SyncedCron loop. |
| 4 | `saas/plan-change-deferred` | Plan change takes effect at end of period | docs + source | `saas_subscriptions.md` | `api/subscriptions/subscriptions.jsx:38` | `newPlanAtEndOfPeriod` field. |
| 5 | `saas/plan-upgrade-immediate` | Upgrade during trial takes effect immediately | docs + source | `saas_subscriptions.md` | `api/subscriptions/server/util.jsx:335` | Special case for trial upgrades. |
| 6 | `saas/plan-limit-users` | Enforcement of user caps per plan | docs + source | `saas_subscriptions.md` | `api/payments/plans.jsx:42` | `maxUsers` check in `canAddUsers`. |
| 7 | `saas/invoice-generate-bancontact` | Monthly invoice generation for Bancontact | docs + source | `stripe_invoices.md` | `api/subscriptions/server/invoiceCreator.jsx:163` | 3-day leeway applied. |
| 8 | `saas/invoice-pdf-render` | PDF generation with seller entity logic | docs + source | `stripe_invoices.md` | `modules/invoices/stripe/StripeInvoicePrint.jsx:43` | Hardcoded SG vs BE entities. |
| 9 | `saas/referral-invite` | Invite colleague via email | docs + source | `referral_programme.md` | `api/referrals/server/methods.js:14` | **Bug**: Missing Owner check. |
| 10 | `saas/referral-consume` | Apply free month on payout | docs + source | `referral_programme.md` | `api/subscriptions/server/invoiceCreator.jsx:178` | Negative line item equal to plan price. |
| 11 | `saas/subscription-cancel` | Cancel subscription at end of period | docs + source | `saas_subscriptions.md` | `api/subscriptions/server/util.jsx:212` | `cancelAtPeriodEnd: true`. |
| 12 | `saas/referral-stub-page` | Dead standalone /referrals/ page | docs + source | `deprecation_list.md` #12 | `modules/pages/referals/referrals.jsx` | **DO NOT PORT.** |

---

## Cross-references to other areas

- **#1 Identity Management:** Signup flow triggers trial start. `requiresPractice` middleware gates SaaS routes.
- **#2 Practice Branding:** Practice owner info (VAT/address) used in invoice PDF.
- **#19 Practice Analytics:** Financial overview charts read from `stripeInvoices` collection.

---

## [NEEDS CLARIFICATION]

### Q1: Is the 3-day Bancontact leeway (feature #7) still desired in the new stack?
- **Why it matters:** Affects the grace period for payment.
- **Sources conflict?** No, but it's a legacy heuristic.
- **What would resolve:** Product owner answer.

### Q2: Should the Singapore vs Belgium entity logic (feature #8) be moved to database settings?
- **Why it matters:** Hardcoded logic in React is brittle.
- **Sources conflict?** No, but it's a "surprising" code finding.
- **What would resolve:** Strategy call for Phase 2.

### Q3: Source 3 deferred — add staging screen reference in follow-up pass.
- **Why it matters:** Visual verification of plan grids and payment forms.
- **What would resolve:** Follow-up discovery pass with `browser-pilot`.

---

## [NEEDS DOMAIN REVIEW]

(Empty — SaaS Lifecycle is generic SaaS; Belgian VAT rules for Nifiq BV are hardcoded and verified.)

---

## Files in this slice (full list, for traceability)

```
# HalingoDoc (source 1)
/home/tj/HalingoDoc/docs/coverage_matrix.md
/home/tj/HalingoDoc/docs/functional/application_map.md
/home/tj/HalingoDoc/docs/from_source/features/saas_subscriptions.md
/home/tj/HalingoDoc/docs/from_source/features/stripe_invoices.md
/home/tj/HalingoDoc/docs/from_source/features/referral_programme.md
/home/tj/HalingoDoc/docs/from_source/deprecation_list.md
/home/tj/HalingoDoc/docs/from_source/bugs_and_security_findings.md
/home/tj/HalingoDoc/docs/from_source/open_questions.md

# Meteor source (source 2)
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/subscriptions.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/methods.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/server/invoiceCreator.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/server/util.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/payments/plans.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/payments/server/stripe.ts
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/stripeInvoices/stripeInvoices.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/invoices/stripeInvoices/server/rest.js
/home/tj/Repos/Halingo-Main/app/imports/api/referrals/referrals.js
/home/tj/Repos/Halingo-Main/app/imports/api/referrals/server/methods.js
/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/stripe/StripeInvoicePrint.jsx
/home/tj/Repos/Halingo-Main/app/imports/api/practiceUsers/practiceUsers.jsx
```

---

# Source 3 — Staging Walk: SaaS Lifecycle

**Date walked:** 2026-04-09
**Test accounts used:** owner, admin, lid
**Base discovery file referenced:** @01-discovery/saas-lifecycle.md

## Screen catalog

| Name | URL | Role | Screenshot Path | Purpose |
|---|---|---|---|---|
| Dashboard (Owner) | `/` | owner | `01-dashboard-owner.png` | Main entry point for practice owner. |
| Practice Tiles (Owner) | `/practices` | owner | `02-practice-tiles-owner.png` | Shows "ABONNEMENT" tile (after manual DB fix). |
| Subscription Detail | `/practices/subscription` | owner | `03-subscription-detail.png` | Core management page for plans, payment, and referrals. |
| Plan Selection | `/practices/subscription/plan/change` | owner | `04-plan-selection.png` | 3-column grid for Basic / Standard / Premium plans. |
| Referral UI | `/practices/subscription` | owner | `05-referral-ui.png` | Expanded section after clicking "DOE MEE". |
| SaaS Invoices | `/practices/subscription` | owner | `06-subscription-invoices.png` | History of Halingo platform invoices. |
| Dashboard (Admin) | `/` | admin | `07-dashboard-admin.png` | Dashboard for admin role. |
| Practice Tiles (Admin) | `/practices` | admin | `08-practice-admin-restricted.png` | Shows restricted tiles (no "ABONNEMENT"). |
| Dashboard (Lid) | `/` | lid | `09-dashboard-lid.png` | Dashboard for lid role. |
| Practice Tiles (Lid) | `/practices` | lid | `10-practice-lid-restricted.png` | Shows restricted tiles (no "ABONNEMENT"). |

## Navigation flows

### Owner: Managing Subscription
1.  **Drawer:** Click "Praktijk" -> takes to `/practices`.
2.  **Overview:** Click the "ABONNEMENT" tile.
3.  **Detail:** Observe plan status, "ZET STOP", "WIJZIG" (Plan/Payment), and "Facturen" buttons.
4.  **Plan Change:** Click "WIJZIG" -> takes to `/practices/subscription/plan/change`.
5.  **Referral:** Click "DOE MEE" on the Subscription page -> reveals "VERZEND" button.

### Admin/Lid: Access Restrictions
1.  **Drawer:** Click "Praktijk" -> takes to `/practices`.
2.  **Observation:** The "ABONNEMENT" tile is missing from the grid, confirming RBAC enforcement in the UI layer.

## Role differences

-   **Owner:** Has full visibility and write access to SaaS billing.
-   **Admin:** Can see practice settings but is blocked from the subscription management tile.
-   **Lid:** Has minimal access; only sees the "Praktijkinfo" and member-related tiles.

## UI observations

-   **Gated Tile Logic:** The "ABONNEMENT" tile in `/practices` is conditionally rendered based on `(!sub || sub.activeUntil)`. In the local dev seed, recurring subscriptions lack an `activeUntil` field, causing the tile to be HIDDEN even for owners. Setting `activeUntil` to a future date made the tile appear.
-   **Plan Grid:** Uses a simple 3-column responsive layout with "Kies" (Select) buttons.
-   **Inline Expansion:** The Referral UI ("DOE MEE") and Invoice History ("Facturen") expand content on the main subscription page rather than navigating away.
-   **Drawer Switcher:** The practice switcher in the drawer uses a custom button with a multi-line label (`_\n_PracticeName`).

## Cross-references to base file

-   **Confirms Feature #1 (Trial):** Trial status visible in practice overview.
-   **Confirms Feature #4/5 (Plan Change):** Verified the `/plan/change` route and grid layout.
-   **Extends Feature #8 (Invoice PDF):** Verified the invoice history list.
-   **Confirms Feature #9 (Referral):** Verified the "DOE MEE" expansion and "VERZEND" action.
-   **Identifies Quirk:** The `activeUntil` check in the UI grid might be a bug or undocumented behavior that hides the billing link for healthy recurring subscriptions.

---

## Verification notes (verbatim from `01-discovery/saas-lifecycle.verification.md`)

# Verification: SaaS Lifecycle

- **Verified by:** Claude Sonnet (halingo-discovery-verifier)
- **Date:** 2026-04-10
- **Discovery file:** `01-discovery/saas-lifecycle.md`
- **Verdict:** PASS WITH NOTES

---

## Citation accuracy

| # | Claim in discovery | Cited source | Verified? | Finding |
|---|---|---|---|---|
| 1 | "A subscription is owned by a **practice** (not by a user)" | `saas_subscriptions.md` | ✓ | Verified verbatim: "A subscription is owned by a **practice** (not by a user)". |
| 2 | Two payment channels: Bancontact (Halingo-managed) and Card (Stripe-managed) | `saas_subscriptions.md` | ✓ | Both channels confirmed. The Bancontact flow uses `_createHalingoSubscription`; card uses `_createStripeSubscriptionForPractice`. |
| 3 | Trial is 30 days; `usedTrial` flag prevents re-use | `saas_subscriptions.md` | ✓ | `Subscriptions.getDurations().TRIAL = moment.duration(30, 'days')`. `practice.usedTrial = true` is set in both creation paths. |
| 4 | `newPlanAtEndOfPeriod` field defers plan change | `saas_subscriptions.md` | ✓ | Schema field confirmed at `subscriptions.jsx:30`. Deferred plan resolution confirmed in `_createInvoiceAndCloseLast`. |
| 5 | Trial upgrades take effect immediately | `saas_subscriptions.md` | ✓ | Confirmed: "Still in trial: just `$set: {type: plan}`" (no deferral). Upgrades post-trial are also immediate with proration; only downgrades are deferred. **NOTE:** discovery says "plan upgrades during trial are immediate" which is correct but incomplete — post-trial upgrades are also immediate (with proration). |
| 6 | `cancelAtPeriodEnd: true` for cancellation | `saas_subscriptions.md` | ✓ | Confirmed in `_cancelSubscription`: both Stripe and Halingo paths set `cancelAtPeriodEnd: true`. |
| 7 | `maxUsers` cap with inconsistent `<` vs `<=` | `saas_subscriptions.md` | ✓ | Confirmed: `canAddUsers` uses `currentUsersCount < this.maxUsers`; `canSelectByUserCount` uses `<=`. Source file is `plans.jsx:46`. |
| 8 | Two hardcoded seller entities: Autopilot Pte Ltd (SG) and Nifiq BV (Heverlee) | `stripe_invoices.md` | ✓ | Verified. `StripeInvoicePrint.jsx:15-35` defines `autoPilot` (Singapore) and `nifiq` (Heverlee). |
| 9 | Entity selection: Autopilot when `getTaxPercent() === 0`; Nifiq when VAT percent exists | `stripe_invoices.md` | ✓ | Confirmed at `StripeInvoicePrint.jsx:53`: `const companyInfo = !invoice.getTaxPercent() ? autoPilot : nifiq`. |
| 10 | Invoice states: OPEN/PENDING/PAID/FAILED | `stripe_invoices.md` | ~ | Source has FIVE states: OPEN, PENDING, PAID, FAILED, **and CLOSED**. Discovery omits CLOSED. Material omission — see below. |
| 11 | Referral state machine: INVITED/REGISTERED/PAID/CONSUMED | `referral_programme.md` | ✓ | All four states confirmed at `referrals.js:19`. State transitions verified end-to-end. |
| 12 | Auth bug on `referrals.invite`: missing Owner check | `referral_programme.md`, `bugs_and_security_findings.md` | ✓ | Confirmed: both `referrals` and `referrals.invite` are `LoggedInValidatedMethod`, no permission check. Bug confirmed by product owner (Q5). |
| 13 | Dead permission: `practice.subscriptions.change` | `deprecation_list.md` #8 | ✓ | Confirmed as dead constant at deprecation item #8; Q7 answer: "For now it's dead". |
| 14 | Consume referral as negative line item equal to plan price | `referral_programme.md` | ✓ | Confirmed via three code paths (Bancontact loop, Stripe sub-creation, Stripe `invoice.created` webhook). Amount = `plan.price` (current plan at time of invoice). |
| 15 | Bancontact billing loop uses SyncedCron | `saas_subscriptions.md` | ✓ | Confirmed: startup observer calls `InvoiceCreator.addInvoiceJob(doc)` for each Bancontact ACTIVE subscription. Cron job named `subscription_{id}`. |
| 16 | Stub `/referrals/` page — DO NOT PORT | `deprecation_list.md` #12 | ✓ | Confirmed dead: 82-line component with empty `generateLink()`. Deprecation #12 explicitly says to delete it. |
| 17 | `getInvoiceStatistics` and `latestInvoiceDate` — referenced as deprecation items | `deprecation_list.md` #13 | ✓ | Confirmed: "Abandoned analytics feature". Discovery correctly links to #13. |
| 18 | `practices.settings.invoices.locale` — referenced as deprecation #18 | `deprecation_list.md` #18 | ✓ | Confirmed. Q25 answer: "We should not use practice locale". |
| 19 | 3-day LEEWAY: `activeUntil = periodEnd + 3 days` | `saas_subscriptions.md` | ✓ | Confirmed at `subscriptions.jsx:30`: `Subscriptions.getDurations().LEEWAY = moment.duration(3, 'days')`. |
| 20 | Source says 21 files read; traceability table lists only 12 files | Discovery file §§ "Files in this slice" | ✗ | Traceability table lists 12 Meteor files. The intro says 21 were read. Nine files cited in the narrative are missing from the traceability block (see Material Omissions below). |
| 21 | Q5 (`referrals.invite` auth bug) exists in `open_questions.md` | `open_questions.md` | ✓ | Q5 confirmed. Owner answer: "should idd be scoped to practice owner". |
| 22 | Q14 (stub `/referrals/` page) exists in `open_questions.md` | `open_questions.md` | ✓ | Q14 confirmed. Owner answer: "Can be removed". |
| 23 | Q15 (`getInvoiceStatistics`) in `open_questions.md` | `open_questions.md` | ✓ | Q15 confirmed. Owner answer: "Abandoned". |
| 24 | Q7 (dead `practice.subscriptions.change`) in `open_questions.md` | `open_questions.md` | ✓ | Q7 confirmed. Owner: "For now it's dead". |
| 25 | Q25 (practice locale deprecated) in `open_questions.md` | `open_questions.md` | ✓ | Q25 confirmed. |
| 26 | Stripe test key hardcoded in `PracticeSubscriptionInvoicePaymentPage.jsx:17` | `bugs_and_security_findings.md` | ✓ | Confirmed in bugs file and verified in `saas_subscriptions.md`: "pk_test_j7PcdvEVLYI36yYz88UtfXRP" — hardcoded test key. **NOTE:** discovery mentions this under discrepancy #1 as a "test-key leak" but does not explicitly flag the test key in the feature catalog. The bug is real and present in the HalingoDoc bugs file. |
| 27 | Competency #20 = SaaS Lifecycle | `application_map.md` | ✓ | Verified at line 61: "20. **SaaS Lifecycle**: Integrated subscription management and billing for the Halingo platform itself." |

---

## Material omissions

### O1 — CLOSED invoice state missing from discovery (CLARIFY)
The discovery file lists four `stripeInvoices` states (OPEN/PENDING/PAID/FAILED). The source `stripe_invoices.md` documents **five** states: OPEN, PENDING, PAID, FAILED, and **CLOSED** (`stripeInvoices.jsx:226-232`). The CLOSED state is distinct from PAID and is used to finalize invoices without marking them as actively paid. This is a state the Phase 2 spec author needs to model.

### O2 — Zero-amount invoice auto-PAID behavior missing from discovery (NOTE)
`stripe_invoices.md` documents a significant edge case: if an invoice's amount is 0 and a state transition to PENDING is attempted, the state is **silently coerced to PAID** (`stripeInvoices.jsx:52-54`). This handles the case where a referral bonus fully cancels the subscription line. Discovery mentions the consume-as-negative-line-item mechanic but does not document the resulting silent-PAID coercion behavior. Phase 2 spec authors need this rule for the `saas/referral-consume` feature.

### O3 — Separate PAYMENT_STATES enum on stripeInvoices not mentioned (NOTE)
In addition to `STATES`, `stripeInvoices` has a separate `PAYMENT_STATES` enum (`stripeInvoices.jsx:74-80`): OPEN, PENDING, CHARGING, FAILED, SUCCESS. These track the sub-state of an in-flight Stripe payment intent and are entirely distinct from the invoice lifecycle states. Discovery does not mention this dual-state model.

### O4 — Invoice number is globally sequential, not per-practice (NOTE)
`stripe_invoices.md` documents that the invoice number is a **single global counter** across the entire `stripeInvoices` collection — not scoped per practice or per year. Practice A's invoice 5 is followed by Practice B's invoice 6. The number is only assigned when leaving OPEN state with a non-zero amount. Discovery does not call this out; it matters for the Phase 2 invoice-numbering spec.

### O5 — `locale()` always returns `"nl"` hardcoded in `StripeInvoicePrint` (NOTE)
`stripe_invoices.md` documents that `isStripe().locale()` always returns `"nl"` — the Stripe invoice template is hardcoded Dutch. Discovery does not mention this. This is relevant for Phase 2 when deciding whether to add FR invoice support.

### O6 — Three referral CONSUMED paths documented in HalingoDoc but discovery presents it as one (CLARIFY)
`referral_programme.md` documents **three independent code paths** that consume PAID referrals: (a) Bancontact invoice loop (`invoiceCreator.jsx:163-194`), (b) Stripe subscription start with existing PAID referral (`server/util.jsx:60-101`), (c) Stripe `invoice.created` webhook (`stripe.ts:154-217`). Discovery Feature #10 (`saas/referral-consume`) cites only `invoiceCreator.jsx:178`. The spec author must design the consume mechanic to cover all three paths.

### O7 — Nine Meteor source files read but not in traceability list (NOTE)
Discovery intro says 21 files were read, but the traceability block lists only 12. Files cited in the narrative but absent from the traceability list:
- `app/imports/api/subscriptions/util.jsx`
- `app/imports/api/subscriptions/server/webhooks.jsx`
- `app/imports/api/referrals/server/util.jsx`
- `app/imports/api/practice/methods.jsx`
- `app/imports/api/practice/server/util.tsx`
- `app/imports/api/invoices/payments/server/util.js`
- `app/imports/api/invoices/payments/server/publications.jsx`
- `app/imports/startup/client/routes/practice.jsx`
- `app/imports/api/subscriptions/server/startup.jsx`

This is a traceability bookkeeping gap, not a factual error. Findings derived from these files appear verified by the HalingoDoc sources.

### O8 — SyncedCron silence hygiene finding not surfaced (NOTE)
`bugs_and_security_findings.md` flags that `SyncedCron` is configured with `log: false` — no logging of whether scheduled jobs ran, succeeded, or failed. Since the Bancontact billing loop is entirely SyncedCron-driven, this is operationally significant. Discovery does not mention it. Relevant for Phase 2 spec (observability requirement for the billing loop).

---

## Cross-area reference check

| Cross-reference | Claimed direction | Verified? | Finding |
|---|---|---|---|
| #1 Identity Management: signup triggers trial start | SaaS → Identity | ✓ | `_createHalingoSubscription` is called from `_addPractice` in `practice/server/util.tsx`. Identity area's signup flow is the entry point for trial creation. Bidirectional: identity creates the practice, SaaS creates the trial. |
| #2 Practice Branding: VAT/address used in invoice PDF | SaaS → Branding | ✓ | `StripeInvoicePrint` uses `practice.vatInfo` and `practice.address` from the practice snapshot on the invoice. Branding manages these fields. Bidirectional relationship exists via the `practice` snapshot stored on `stripeInvoices`. |
| #19 Practice Analytics: financial charts read from `stripeInvoices` | SaaS → Analytics | ~ | Discovery claims analytics reads from `stripeInvoices`. The `practice-analytics.md` discovery file (area #19) does confirm this linkage. However, deprecation item #13 (`getInvoiceStatistics`, `latestInvoiceDate`) says these server methods are "abandoned analytics features" with no UI consumer. The live analytics query path is not fully traced in either discovery file. Flag as CLARIFY. |

---

## Domain review (logopedist-be skill)

Five questions were submitted to the `logopedist-be` skill. Findings:

### D1 — Belgian VAT on SaaS subscriptions purchased by logopedists (CLARIFY)
The skill confirms that art. 44 §1 WBTW exempts **the logopedist's own therapeutic services** from VAT — it does not exempt purchases they make. A SaaS subscription (B2B software purchase) is a non-therapeutic business expense. When Nifiq BV (Belgian entity) sells a SaaS subscription to a Belgian logopedist, **21% BTW is in principle applicable** on the invoice. The discovery file's `[NEEDS DOMAIN REVIEW]` section is marked empty, stating "Belgian VAT rules for Nifiq BV are hardcoded and verified." This claim is **partially confirmed** for the Nifiq BV invoices (21% VAT is correct for Belgian B2B SaaS), but the discovery does not call out that many Belgian logopedist customers will be non-VAT-registered (fully exempt under art. 44 §1, no BTW number). The VAT is a cost to them, not reclaimable. This affects revenue modeling but is not a compliance error in the invoicing logic.

### D2 — Zero-VAT invoices via Singapore entity — Belgian fiscal compliance (CLARIFY)
The skill identifies this as material but does not contain a specific ruling. For a non-EU supplier (Autopilot Pte Ltd, Singapore) providing B2B digital services to a Belgian VAT-registered customer, EU/Belgian reverse-charge rules apply: the customer self-assesses 21% BTW. However, most small-practice logopedists are **not VAT-registered** (they are fully exempt under art. 44 §1 with no BTW number). For a non-VAT-registered Belgian customer receiving a B2B service from a non-EU supplier, the standard EU reverse-charge mechanism does not straightforwardly apply — the Belgian customer cannot self-assess because they have no VAT return. This creates a **potential compliance gap**: either the Singapore entity should register for Belgian VAT under the MOSS/OSS mechanism, or the customer should pay 21% VAT. The discovery marks this as CLARIFY (Q2) and the skill confirms this is a legitimate open question. **Disposition: CLARIFY** — the hardcoded entity-split logic has material Belgian fiscal compliance implications that have not been assessed against current law. The Phase 2 spec author should not encode this as a permanent rule without legal review.

### D3 — Invoice retention period (NOTE — discovery correct)
The skill confirms the retention period for accounting/tax records is **10 years** under the wet van 20 november 2022 (art. 315/354 WIB92). The 7-year figure that was previously standard has been superseded. Discovery does not state a specific retention period, so there is no conflict, but the Phase 2 spec for invoice archiving should encode 10 years, not 7.

### D4 — Deontological rules on referral programs for Belgian healthcare professionals (CLARIFY)
The logopedist-be skill does NOT contain specific VVL, UPLF, or BVLA deontological rules about aanbrengbonus programs for healthcare professionals. The skill's coverage of professional bodies (reference file 04) focuses on recognition, RIZIV visa, and CPD — not commercial referral ethics. The discovery's `[NEEDS DOMAIN REVIEW]` section is empty on this point. **Disposition: CLARIFY** — the Phase 2 spec for `saas/referral-invite` should note that deontological clearance for referral incentive programs aimed at healthcare professionals has not been verified against professional codes of conduct. This is a low-urgency item (the referral program is not a clinical recommendation and the incentive is modest), but worth human review.

### D5 — Discovery's claim that "Belgian VAT rules are hardcoded and verified" (NOTE)
The discovery states `[NEEDS DOMAIN REVIEW]` is empty because "SaaS Lifecycle is generic SaaS; Belgian VAT rules for Nifiq BV are hardcoded and verified." The logopedist-be skill confirms the 21% rate for Nifiq BV B2B SaaS is correct for the domestic Belgian entity path. However, the zero-VAT / Singapore path (D2 above) has unresolved compliance questions. The domain review section of the discovery file is not entirely warranted as empty. **This is a CLARIFY, not a BLOCKER**, because the current production behavior may already be legally acceptable (depending on how the Singapore entity is structured), but it has not been verified here.

---

## Escalated source checks (Step 4)

### EC1 — Bancontact billing loop SyncedCron and referral negative line item

**Claim verified against:** `/home/tj/Repos/Halingo-Main/app/imports/api/subscriptions/server/invoiceCreator.jsx` lines 60-204.

**Findings:**
- The `_createInvoiceAndCloseLast` function runs from a SyncedCron job (`addJob` schedules it at `lastInvoice.periodEnd`). **Confirmed.**
- The 3-day leeway is documented in `Subscriptions.getDurations().LEEWAY = moment.duration(3, 'days')` on the collection itself (not in `invoiceCreator.jsx` directly). The leeway is applied when computing `activeUntil` on the subscription, not inside `_createInvoiceAndCloseLast`. **Discovery's attribution to the invoiceCreator is slightly imprecise** but the leeway behavior is correct.
- Referral negative line item at lines 163-194: **confirmed exactly as described.** `PracticeUsers.findOne({ practiceId, role: roles.owner.id })` → `Referrals.findOne({ userId: owner.userId, status: Referrals.states.PAID })` → push `{type: "referral", amount: -plan.price, description: "referral"}` → `Referrals.update(referral._id, { $set: { amount, status: Referrals.states.CONSUMED } })`.
- **Additional finding:** discovery says referral consume is at `invoiceCreator.jsx:178` but in the read source the referral logic starts at line 163 and the push is at line 177. The line number is approximately correct, not exact. Minor discrepancy (NOTE only).

**Verdict:** Claim verified. One minor line-number imprecision (NOTE).

### EC2 — Hardcoded seller entity logic in StripeInvoicePrint

**Claim verified against:** `/home/tj/Repos/Halingo-Main/app/imports/modules/invoices/stripe/StripeInvoicePrint.jsx` lines 15-53.

**Findings:**
- `autoPilot` object defined at lines 15-24: entity named `"AUTOPILOT PTE. LTD."` (note the full-stop and period vs discovery's "Autopilot Pte Ltd" — same entity, minor capitalization difference).
- `nifiq` object defined at lines 26-35: entity named `"Nifiq BV"` at street `"Huttelaan 7"`, postal code `3001`, city `"Heverlee"`. **Confirmed.**
- Branching logic at line 53: `const companyInfo = !invoice.getTaxPercent() ? autoPilot : nifiq`. **Confirmed exactly.**
- **Additional finding:** The `autoPilot` object has `bankAccount: "BE08967106850213"` — a Belgian IBAN number despite the Singapore entity. And `companyNumber: ""` (empty). This is not mentioned in the discovery or HalingoDoc. It is a notable quirk: the Singapore entity bills with a Belgian bank account. This may have Belgian banking/AML implications. **Flag as NOTE.**

**Verdict:** Claim verified. One additional finding: the Singapore entity (Autopilot Pte Ltd) uses a Belgian IBAN (`BE08967106850213`) which the discovery does not mention.

### EC3 — Missing Owner check on `referrals.invite`

**Claim verified against:** `/home/tj/Repos/Halingo-Main/app/imports/api/referrals/server/methods.js` lines 0-23.

**Findings:**
- Line 6: `export const getReferrals = new LoggedInValidatedMethod(...)` — no permission check. **Confirmed.**
- Line 14: `export const inviteUserByEmail = new LoggedInValidatedMethod(...)` — no permission check. **Confirmed.**
- The `run({ practiceId, email, text })` destructures `practiceId` from arguments but **does not use it in any authorization check**. The `practiceId` appears to be accepted but silently ignored in the server implementation (`Util.sendReferralToEmail(this.userId, email, text)` — only `userId`, `email`, `text` are passed). This means not only is the Owner check missing, but the `practiceId` parameter is also silently dropped. **This is a slightly stronger finding than the discovery states.** Discovery says "Missing Owner check" — correct. The additional nuance is the ignored `practiceId` argument.
- **Verdict:** Discovery claim confirmed and slightly strengthened. The `practiceId` parameter is accepted but not used server-side. (NOTE — does not change the bug classification, but useful context for the fix.)

---

## Findings summary

| ID | Severity | Category | Description | Disposition |
|---|---|---|---|---|
| V-saas-01 | CLARIFY | omission | CLOSED state missing from invoice state machine; discovery lists 4 states, source has 5 | Add to `[NEEDS CLARIFICATION]` for Phase 2 |
| V-saas-02 | CLARIFY | domain | Zero-VAT / Singapore entity routing has unverified Belgian fiscal compliance implications; logopedist-be skill cannot confirm compliance; discovery left `[NEEDS DOMAIN REVIEW]` empty | Add to `[NEEDS CLARIFICATION]` for Phase 2 |
| V-saas-03 | CLARIFY | omission | Three independent referral CONSUME code paths exist; Feature #10 cites only one; Phase 2 spec must cover all three | Add to `[NEEDS CLARIFICATION]` for Phase 2 |
| V-saas-04 | CLARIFY | domain | Deontological rules for healthcare referral programs not verified by logopedist-be skill; `[NEEDS DOMAIN REVIEW]` was left empty without basis | Add to `[NEEDS CLARIFICATION]` for Phase 2 |
| V-saas-05 | CLARIFY | omission | Analytics cross-reference (#19) is imprecise: the `getInvoiceStatistics` methods are abandoned (deprecation #13); the live analytics query path from `stripeInvoices` is untraced in both discovery files | Verify during Phase 2 spec authoring for area #19 |
| V-saas-06 | NOTE | omission | Zero-amount invoice silently coerced to PAID state (when PENDING attempted on €0 invoice); critical edge case for referral-bonus-fully-cancels-invoice scenario; not in discovery | Add to `saas/referral-consume` spec notes |
| V-saas-07 | NOTE | omission | PAYMENT_STATES enum (OPEN/PENDING/CHARGING/FAILED/SUCCESS) is a separate dual-state model alongside STATES; not mentioned in discovery | Add to `saas/invoice-generate-bancontact` spec notes |
| V-saas-08 | NOTE | omission | Invoice number is globally sequential (not per-practice, not per-year); number only assigned when leaving OPEN with non-zero amount; 0-amount invoices never get a number | Add to `saas/invoice-pdf-render` spec notes |
| V-saas-09 | NOTE | omission | `locale()` on stripeInvoice hardcoded to `"nl"`; no FR path in invoice template | Add to `saas/invoice-pdf-render` spec notes |
| V-saas-10 | NOTE | citation | Discovery attributes 3-day leeway to `invoiceCreator.jsx`; leeway is actually computed when the subscription record is created/updated (`subscriptions.jsx:getDurations()`), not inside invoiceCreator | Minor attribution imprecision; does not affect behavior description |
| V-saas-11 | NOTE | citation | Feature #5 (trial upgrade immediate) is correct but incomplete: post-trial upgrades are also immediate (with proration); only downgrades are deferred | Does not affect spec correctness for the trial case |
| V-saas-12 | NOTE | citation | Discovery refers to "Autopilot Pte Ltd"; source code uses "AUTOPILOT PTE. LTD." — same entity, minor capitalization difference | Cosmetic only |
| V-saas-13 | NOTE | source | Autopilot Pte Ltd (Singapore entity) uses Belgian IBAN `BE08967106850213` on invoices; discovery does not mention this; may have Belgian banking/AML implications | Flag for human review alongside V-saas-02 |
| V-saas-14 | NOTE | citation | `referrals.invite` server method accepts `practiceId` parameter but silently ignores it (not passed to `sendReferralToEmail`); discovery says "Missing Owner check" which is correct but the ignored `practiceId` strengthens the bug | Supplement the bug description in Phase 2 spec for `saas/referral-invite` |
| V-saas-15 | NOTE | traceability | Traceability block lists 12 Meteor files; discovery intro says 21 were read; 9 files cited in narrative are absent from the traceability list | Bookkeeping gap; no factual impact |
| V-saas-16 | NOTE | omission | SyncedCron silence (`log: false`) not mentioned; no observability for the Bancontact billing loop; relevant for Phase 2 spec's observability requirements | Add to `saas/invoice-generate-bancontact` spec notes |
| V-saas-17 | NOTE | domain | Belgian invoice retention is 10 years (wet 20 november 2022, art. 315/354 WIB92), not 7; discovery does not state a retention period, so no conflict, but Phase 2 archive spec should use 10 years | Inform Phase 2 `saas/invoice-pdf-render` spec |

---

## Recommendation

**PROCEED to Phase 2** with the following conditions:

1. **V-saas-01 (CLOSED state)** must be resolved in the `saas/invoice-generate-bancontact` and `saas/invoice-pdf-render` specs before Gherkin scenarios are written. The spec author should confirm with the product owner whether CLOSED is still a live state or a legacy artifact.

2. **V-saas-02 and V-saas-13 (Singapore entity compliance)** should be escalated to the human owner for a legal/tax review before Phase 2 spec authoring for `saas/invoice-pdf-render`. If the Singapore entity routing is to be preserved in the new stack, a product decision is needed. This is currently in `[NEEDS CLARIFICATION]` Q2 — that is the right disposition, but it must be resolved, not deferred into Phase 3.

3. **V-saas-03 (three referral consume paths)** must be reflected in the `saas/referral-consume` spec. The spec author should model all three paths and verify with the product owner whether all three need to be ported or whether the new stack can use a single unified path.

4. **V-saas-04 (deontological review of referral program)** is LOW urgency — the program is modest in scope and the incentive is billing credit, not cash. Raise with the product owner in Phase 2 spec interview. Do not block Phase 2 on this.

5. The four NOTE-severity omissions (V-saas-06 through V-saas-09) should be added as supplementary notes in the relevant Phase 2 specs. They do not require re-discovery; the facts are confirmed from the HalingoDoc sources.

No BLOCKERs were found. The discovery file is factually accurate on all major claims verified. The four CLARIFY items are appropriate additions to the Phase 2 backlog, not corrections to the Phase 1 record.
