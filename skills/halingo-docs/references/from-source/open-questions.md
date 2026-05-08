# Open questions for the product owner

> **✅ RESOLVED 2026-04-07.** All 44 questions were answered by the product owner. The answers drove a triage pass that:
> - **Created** [`deprecation_list.md`](deprecation_list.md) — 22-entry cleanup backlog (kill / dead-code / legacy / move).
> - **Re-triaged** [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — dropped from ~40 items to 14 (5 security, 3 confirmed authorization bugs, 4 functional bugs, 3 schema-drift, 3 hygiene). The retraction summary at the bottom of that file lists every dropped item.
> - **Updated** 16 feature files in `features/` with banners reflecting the answers (deprecation notices, retraction notices, locale rule corrections, etc.).
> - **Updated** [`inventory.md`](inventory.md) (master cross-reference) and [`../coverage_matrix.md`](../coverage_matrix.md) (the curated audit) with the post-triage state.
> - **Saved** three durable feedback memories: the disjunctive RBAC is intentional, the user locale is canonical, and Halingo is migrating to a mono repo with a backend-stack (cron → lambda, migrations → admin functions, prices eventually → DB).
>
> **How to use this file going forward:** the answers below are preserved verbatim for traceability. Each question's "→ Applied to" line points to where in the docs the answer landed. If any answer turns out to be wrong, update both the answer here and the downstream docs.

## Resolution summary by question

| Question | Owner answer (verbatim) | → Applied to |
|---:|---|---|
| **Q1** `patientFileUsers.admin` ≡ `default`? | Initial: "The admin is the only one who can remove/add access to the patient files". Clarified 2026-04-07: "the frontend blocks the .default as no button is available to do the action, the backend didnt block it thats a bug" | **NEW confirmed bug** added to [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — frontend-only access control on `patientFileUsers` ACL management; class of bug worth a focused audit. Updates in [`features/patient_file_access_control.md`](features/patient_file_access_control.md) and [`features/practice_user_roles.md`](features/practice_user_roles.md). |
| **Q2** `patientFileUsers.owner` only has view? | "owner is not used, can be removed" | [`deprecation_list.md` #7](deprecation_list.md) |
| **Q3** `notifications.delete` no userId scope? | "should idd be scoped to userId" | [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — confirmed bug |
| **Q4** `practiceInvitations` publication no auth? | "should idd be scoped" | [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — confirmed bug |
| **Q5** `referrals` permissions unenforced? | "should idd be scoped to practice owner" | [`bugs_and_security_findings.md`](bugs_and_security_findings.md) — confirmed bug |
| **Q6** `.select` checks `.resume`? | ".resume is fine" | retracted from bugs file |
| **Q7** `.change` permission unused? | "For now it's dead" | [`deprecation_list.md` #8](deprecation_list.md) |
| **Q8** Hard 401 on colleague calendar? | "We still check on that field for validation" | retracted from bugs file; noted in [`features/calendar_overview.md`](features/calendar_overview.md) and [`features/team_meetings_in_calendar.md`](features/team_meetings_in_calendar.md) |
| **Q9** MeetingEvent description dropped? | "We don't use that" | [`deprecation_list.md` #14](deprecation_list.md) |
| **Q10** Max 2 video disabled? | "That was only temporary" | retracted from bugs file; noted in [`features/telehealth_consultation.md`](features/telehealth_consultation.md) |
| **Q11** Structured announcement locale? | "It should always use locale of the user." | retracted from bugs file; [`halingo_locale_rule.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md), [`features/patient_invoices.md`](features/patient_invoices.md) |
| **Q12** Team meetings status? | "Abandoned" | [`deprecation_list.md` #20](deprecation_list.md), [`features/team_meetings.md`](features/team_meetings.md) |
| **Q13** `users.delete` status? | "That should be gone" | [`deprecation_list.md` #2](deprecation_list.md), [`features/identity_and_authentication.md`](features/identity_and_authentication.md), GDPR consequence in [`gaps/03_patient_data_privacy.md`](gaps/03_patient_data_privacy.md) |
| **Q14** Stub `/referrals/` page? | "Can be removed" | [`deprecation_list.md` #12](deprecation_list.md), [`features/referral_programme.md`](features/referral_programme.md) |
| **Q15** `getInvoiceStatistics`/`latestInvoiceDate`? | "Abandoned" | [`deprecation_list.md` #13](deprecation_list.md) |
| **Q16** `treatment.can.be.removed` mismatch? | "It's fine" | retracted from bugs / dead code lists |
| **Q17** `practice.ownTariffs` toggle? | "Got pulled" | [`deprecation_list.md` #10](deprecation_list.md) |
| **Q18** `LongTherapyPlan.therapistId`? | "That is not used atm" | [`deprecation_list.md` #9](deprecation_list.md), [`features/long_term_therapy_plan.md`](features/long_term_therapy_plan.md) |
| **Q19** Newsfeed authoring? | "That is inserted through the db directly" | confirmed as the workflow; [`inventory.md`](inventory.md) net-new table |
| **Q20** Rosa cron in production? | "atm ran on all servers, but we only have 1. This should be ran through a lambda function (backend-stack in the mono repo)" | [`deprecation_list.md` #21](deprecation_list.md), [`features/rosa_integration.md`](features/rosa_integration.md), [`halingo_architecture_direction.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_architecture_direction.md) |
| **Q21** Stripe webhook configured? | "Stripe does send them, can be easily tested through an exe file that stripe provides that tunnels the requests to local" | confirmed working; no doc change |
| **Q22** `MethodLogger` writing? | "That was disabled as we do not want to log all those actions anymore" | [`deprecation_list.md` #17](deprecation_list.md), [`features/method_audit_log.md`](features/method_audit_log.md) — reframed as intentional |
| **Q23** `admin_impersonation` used? | "That should be removed" | [`deprecation_list.md` #3](deprecation_list.md), [`features/admin_impersonation.md`](features/admin_impersonation.md) |
| **Q24** Hard-coded migrations applied? | "All migrations can be ignored. For those kind of functions, we should do that through an admin function" | [`deprecation_list.md` #16](deprecation_list.md), [`halingo_architecture_direction.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_architecture_direction.md) |
| **Q25** Practice locale `fr` in production? | "We should not use practice locale" | [`deprecation_list.md` #18](deprecation_list.md), [`halingo_locale_rule.md` memory](file:///home/tj/.claude/projects/-home-tj-HalingoDoc/memory/halingo_locale_rule.md) |
| **Q26** Practice chat kill switch used? | "Do not keep the chat, it's barely used" | [`deprecation_list.md` #1](deprecation_list.md), [`features/practice_chat.md`](features/practice_chat.md) |
| **Q27** Per-disorder commission overrides used? | "It's being used" | confirmed in active use; no doc change |
| **Q28** `code_export.txt`? | "That can be ignored/removed" | [`deprecation_list.md` #5](deprecation_list.md) |
| **Q29** `Meteor.settings.public` config? | "Those are not commited, so just assume the shape" | noted; no doc change |
| **Q30** `VideoConsultationCode` current? | "Same" | confirmed current; [`features/telehealth_consultation.md`](features/telehealth_consultation.md) |
| **Q31** Treatment type taxonomy? | "Migrations can be ignored" | covered by Q24 |
| **Q32** 18 treatment types current? | "They are" | confirmed; no doc change |
| **Q33** 11 therapy goal categories current? | "They should be, no user has asked for more." | confirmed; [`features/long_term_therapy_plan.md`](features/long_term_therapy_plan.md) |
| **Q34** R-waarde 2023-05-01 history? | "It does" | confirmed; no doc change |
| **Q35** 30-day SaaS trial? | "Product policy" | confirmed; no doc change |
| **Q36** 3-day account-lock? | "Correct, we lock the account after 3 days if they did not validate. But that can be removed. They should validate before they can access the app (should already be the case in the mono repo)" | [`deprecation_list.md` #19](deprecation_list.md), [`features/identity_and_authentication.md`](features/identity_and_authentication.md) |
| **Q37** `Events.getPrices()` cascade? | "They are correct, but these values should be stored in the database. Let's not do that yet for the migration." | [`deprecation_list.md` #22](deprecation_list.md), [`features/tariff_indexation.md`](features/tariff_indexation.md) |
| **Q38** `monkey-calendar/` dead? | "Dead code" | [`deprecation_list.md` #4](deprecation_list.md) |
| **Q39** Rosa bidirectional? | "It's biderecional, we poll every 5 mins for the data." | confirmed; [`features/rosa_integration.md`](features/rosa_integration.md) |
| **Q40** Counts (138/28/47) verified? | (no answer) | unchanged; counts updated to 138/28/47 in [`technical/`](technical/) reference |
| **Q41** `getZipCodesByCounty` misnomer? | (no answer) | unchanged |
| **Q42** Practice chat helpdesk vs code? | "It is meant as the owner can choose to disable/enable it. But we don't want chat anymore, it's not really used" | covered by Q26; [`inventory.md`](inventory.md) phantoms table updated |
| **Q43** Tariff indexation helpdesk vs code? | "Indexation happens through the dated pricing of the events" | [`features/tariff_indexation.md`](features/tariff_indexation.md), [`inventory.md`](inventory.md) phantoms table updated |
| **Q44** Email template authoring? | "Only template selection and some additional modification like body text or instructions text" | [`features/email_templates.md`](features/email_templates.md), [`inventory.md`](inventory.md) phantoms table updated |

## Original questionnaire (preserved verbatim for traceability)

> **Provenance:** assembled 2026-04-07 after the code-derived documentation pass over `/home/tj/Repos/Halingo-Main`. Each question is something the source code does not answer on its own. Categories are sorted by what input from the product owner would unlock the most downstream work.
>
> **How to use this file:** read top to bottom, mark answers inline (or in a copy), and the documentation in `from_source/` can be updated to match. The questions in §1, §2, and §3 are the highest leverage.

## 1. Things where intent is unclear

These are code patterns where the behaviour is observable but the intent is not.

### 1.1 RBAC follow-ups (after the disjunctive design was confirmed intentional)

1. **`patientFileUsers.admin` ≡ `patientFileUsers.default` (identical 18-permission lists.)** Given the additive design, this could be intentional — the per-file layer is essentially "do you have file access" once granted. Is it intentional, or is one of the two roles supposed to be narrower?
2. **`patientFileUsers.owner` has only `patientFile.view`.** Reads as a "creator marker" with read-only access. Intentional?

### 1.2 Authorization patterns that may be intentional

3. **`notifications.delete` has no `userId` scope** in the selector (`api/notifications/methods.js:36-38`). Earlier flagged as a security bug, but given the disjunctive RBAC was intentional, maybe deletions are deliberately practice-wide too?
4. **`practiceInvitations` publication has no auth check** at all. Anyone with a `practiceId` can list pending invitations and invitee email addresses. Bug, or intentional because invitation tokens are unguessable elsewhere?
5. **`referrals` / `referrals.invite` permissions are declared but never enforced** — referral programme is de facto open to all logged-in users. Is it meant to be open?
6. **`practice.subscriptions.select` checks `.resume` permission instead of `.select`** — typo, or intentional because the two are always granted together today?
7. **`practice.subscriptions.change` is declared but never used anywhere**. Placeholder for a planned UI change, or just dead?

### 1.3 Calendar / event quirks

8. **Hard 401 when creating an event on a colleague's calendar even with `practice.events.add.otherUser`**. The permission constant exists but the create-event method always returns 401 if `event.userId !== this.userId`. Future work, or is the permission semantically just for read?
9. **`MeetingEvent` description on create is dropped** on first save. Bug, or were meeting descriptions meant to be entered separately?
10. **"Max 2 video consultations per week" rule is disabled** in code but i18n strings still imply enforcement. Loosened on purpose or temporary?

### 1.4 Invoicing locale

11. **Structured-announcement uses `user.locale()` (therapist) instead of `practice.locale()` (per-praktijk invoice language)**. For therapists whose UI language differs from their practice's invoice language, the CG1/CG2 routing strings come out in the wrong language. Bug, or intentional for international therapists?

## 2. Dormant / scaffold features — future, paused, or abandoned?

12. **`team_meetings`** — collection, i18n strings, role permission, and a `TeamMeetingBox` component all exist. But no methods, no publications, no routes, and the `TeamMeetingBox` is commented out behind a `ComingSoon` overlay. **Active feature build, paused, or abandoned?**
13. **`users.delete`** — the method exists with full account-deletion language but has no UI anywhere. Planned GDPR feature waiting on a UI, or retired? *(This is the missing piece for closing the GDPR gap.)*
14. **Stub `/referrals/` page** — 82-line component with an empty `generateLink()` handler. The real referral UI lives in `PracticeReferralBox` on the subscription page. Is the standalone page going to be filled in, or should the route be removed?
15. **`getInvoiceStatistics` / `latestInvoiceDate`** — defined as server methods but never consumed by any UI. Aborted analytics feature, or held in reserve?
16. **`treatment.can.be.removed`** — validator parameter mismatch makes the permission check fall through. Was this an intentional kill-switch, or genuine bit-rot?
17. **`practice.ownTariffs` toggle** in `lib/formSchemas/practices/accessibility.jsx:46-60`. Dead UI today (bound to wrong schema, no consumer, empty submit callback). Was per-practice tariff override a feature that got pulled?
18. **`LongTherapyPlan.therapistId`** — schema field, methods accept it, UI form control is committed-out. Per-therapist goal assignment feature in flight?
19. **Newsfeed has no author UI**. Content must be inserted via DB or admin tool. Is there a separate admin panel, or are announcements written with `meteor mongo`?

## 3. Operational unknowns I cannot see from code alone

These depend on `settings.json`, environment variables, Stripe / AWS configuration, or production database state.

20. **Is the 5-minute Rosa pull `setInterval` actually running on every server in production**, or gated by an environment flag? The code in `practice/server/hooks.js:72-139` registers it unconditionally, but production may set `Meteor.settings.rosa.enabled` somewhere I did not trace.
21. **Is the Stripe webhook URL actually configured on the Stripe dashboard**? The endpoint is ready to receive events; I cannot tell from code if Stripe is sending them.
22. **Is `MethodLogger` writing to a real collection in production**, or to a TTL/capped collection that turns over fast?
23. **Is `admin_impersonation` actually used by support staff** via Meteor shell, or is it truly dormant? "Zero callers in source" does not tell me whether you (or operators) call it manually.
24. **Are the hard-coded data-fix migrations v41–v44** (which reference specific user / practice IDs) **already applied on production**? On a fresh deployment they no-op. I cannot tell if production is the deployment they were written for.
25. **Does any production practice actually have `settings.invoices.locale` set to `fr`**? Per-praktijk invoice language exists in code; I do not know if anyone uses it. Relevant because that is where the structured-announcement bug (Q11) would actually bite.
26. **Is the practice chat kill-switch (`settings.chat.disabled`) used by any practice in production**? Same shape of question.
27. **Are the per-disorder commission overrides (`specificAmounts`) actually used** by any practice today, or is this a feature you ship but nobody configures?
28. **What is in `app/imports/code_export.txt`** and does anything in production read it? It is a full-text dump of the source tree. Looks like a build artefact someone forgot to gitignore — but maybe it is used by something I did not trace.
29. **What `Meteor.settings.public` config do you ship to clients**? I can read settings shape from how it is accessed in code but not what values production gets.

## 4. Domain knowledge gaps — code is clear, real-world correctness is not

I documented these from code as-of-today, but I do not know if they match current RIZIV / legal reality.

30. **`VideoConsultationCode = 792433`** is hardcoded for telehealth. Is this still the current De Conventie 2024 code, or has it changed since the constant was written?
31. **The treatment type taxonomy** in `migration-v1.js` (a, b.1–b.6.4, c.1–c.2, d, e, f) — does this match the current RIZIV nomenclature, or has the convention added / renamed types since?
32. **The 18 treatment types** in `treatments_and_bilans.md` — current?
33. **The 11 therapy goal categories** in `long_term_therapy_plan.md` (afasie, articulatie, stem, etc.) — quoted verbatim from code; are they the canonical list, or has the profession added newer ones (e.g. dysphagia work)?
34. **The R-waarde 2023-05-01 group-sitting rate change** documented in `r_waarden.md` — does this match real RIZIV history?
35. **The 30-day SaaS trial** in `saas_subscriptions.md` — current product policy or legacy?
36. **The "3-day account-lock" heuristic** in `identity_and_authentication.md` — current?
37. **`Events.getPrices()` is a giant date-conditional cascade** documented as the tariff history, but I cannot tell if all the date branches are still legally correct or if some have been superseded.

## 5. Things I almost certainly got wrong somewhere

38. **The `monkey-calendar/` "dead code" verdict.** I found no imports under `app/imports`, so I called it dead. But maybe it is loaded via Meteor auto-load conventions, referenced from the `.meteor/` build, or imported from an HTML file I did not read. Worth double-checking before deletion.
39. **The "Rosa is bidirectional, scout was wrong" finding.** This came from the integrations agent's reading of `rosa-patients.ts:100` and `rosa-events.ts:53`, but the scout pass had it as push-only. Two readings, two answers — the integrations agent's reading is more thorough, but worth a sanity check against actual behaviour.
40. **The 138 method count, 28 collection count, 47 migration count** — all from the technical reference agent, not independently verified by me. Good enough for a docs index, not for a contractual claim.
41. **The `getZipCodesByCounty` is a misnomer / case-sensitive substring scan** finding — documented from the integrations agent's reading. Worth a 30-second double-check if anyone is about to use that method.

## 6. Helpdesk-vs-code disagreements where I picked the code

Whenever the helpdesk and the code disagreed, I gave priority to the code. But "the code does X" is sometimes a stale snapshot.

42. **Helpdesk says practice chat is owner/beheerder only.** Code says all three roles. I went with the code. Is the helpdesk just out of date, or does production have a settings check that hides chat from `lid` that I missed?
43. **Helpdesk implies tariff indexation is a feature.** Code shows no tariff editor. Is there a separate admin tool that does this, or is the helpdesk article aspirational?
44. **Helpdesk implies email template authoring exists.** Code shows only template selection (4 hard-coded React components). Same question — separate admin UI, or genuinely no authoring?

## 7. The highest-leverage subset

If you can answer only a handful, these are the ones whose answers unlock the most downstream documentation work:

- **Q3, Q4, Q5, Q8** — the four "intent unclear" auth findings. Determines whether they stay in `bugs_and_security_findings.md` or move to `practice_user_roles.md` as additional intentional design points.
- **Q12** — the `team_meetings` scaffold status. Determines whether it gets a stub doc, a "shipping soon" doc, or gets removed from the inventory.
- **Q13** — the `users.delete` GDPR question. This is the missing piece for the patient-data-privacy gap; with a UI it would close most of the GDPR gap, without one it stays a hard zero.
- **Q11** — the structured-announcement locale bug. Whether it bites in production depends entirely on Q25.
- **Q19** — newsfeed authoring. Right now the docs say "no author UI" which is technically true; if there is a separate admin tool, the docs should point at it.
- **Q42, Q43, Q44** — the three helpdesk-vs-code disagreements. These determine whether to update the helpdesk articles in `full_documentation/` or to leave them as historical record.
