# 02 — Prescription, Bilan, and Pathology-Bound Treatment Rules

> Last verified: 2026-04-06
> Scope: Clinical workflow rules that govern when logopedic treatment is reimbursable in Belgium under RIZIV/INAMI.
> Primary source: Article 36 of the Royal Decree of 14 September 1984 establishing the nomenclature of healthcare services (officieuze coördinatie / coordination officieuse, version in force since 01/08/2024), as amended by A.R. 4.6.2024 and the M.B. 15.01.2026 interpretation rules.

---

## 1. Overview — why this matters for billing and dossiers

Belgian compulsory health insurance (assurance obligatoire / verplichte verzekering) reimburses logopedic care only when a strict, document-bound chronology has been respected. Halingo's product team should treat the workflow as a state machine with hard gates: each session is reimbursable only if (a) a valid prescription preceded the assessment, (b) the assessment (bilan) preceded a valid treatment prescription, (c) a complete file reached the médecin-conseil / adviserend arts of the patient's mutuality on time, and (d) the médecin-conseil approved or — in renewal scenarios since 1 August 2024 — was notified.

The major regulatory event for the current product cycle is the **A.R. of 4 June 2024**, in force since **1 August 2024**, which restructured the entire approval cycle. The most important consequences are:

- The **bilan d'évolution / evolutiebilan** (the periodic re-assessment that used to be required mid-treatment) was abolished as a separate billable code. Codes 702015, 704012, 704115, 706016, 708013 and 710010 were all suppressed.
- A first treatment approval (accord initial) now covers a **continuous period of two years**, with two narrow exceptions (cleft-related disorders and Locked-In Syndrome, which keep one-year accord cycles).
- Renewals proceed via a **notification system (kennisgeving / notification de prolongation)** rather than a fresh accord. The médecin-conseil receives the notification — there is no second formal evaluation phase.
- A new optional **séance d'évaluation longue (codes 700991-701002)** was introduced for cases where the disorder worsens, results stagnate, or treatment was interrupted ≥12 months. This session is billed separately and does not count against the maximum number of treatment sessions.
- Test result thresholds were rephrased from "percentile / standard deviation" language to "valeurs de critères / criteriumwaarden" published on the limitative test list approved by the Conventiecommissie.
- Since **1 September 2024** patients with a performance IQ, non-verbal IQ, or developmental quotient **< 86** can be reimbursed for monodisciplinary speech therapy of language-development disorders and dysphasia (previously a 86 floor blocked them).
- An **interpretation rule for §3, 5°** published 02/10/2025 (M.B. 15/01/2026) clarifies that the multidisciplinary-treatment exclusion runs strictly from the first to the last session of the multidisciplinary treatment validated by the final bilan. Monodisciplinary logopedie can be reimbursed before the multidisciplinary phase begins, and after it ends if continuation is medically justified.

These dates matter because almost every secondary source online (mutuality pages, private practice FAQs, vvl.be sub-pages) is still partially out of sync with the August 2024 nomenclature. **Trust the official Article 36 PDF, not the FAQ pages.**

---

## 2. Prescription rules (per pathology category)

### 2.1 The two-prescription model

Article 36 enforces a **two-prescription rule** for almost every pathology:

1. **Voorschrift voor het aanvangsbilan / prescription pour le bilan initial** — written *before* the speech therapist performs the assessment. RIZIV explicitly refuses reimbursement for the bilan if the prescription post-dates the bilan (Art. 36 §4, 1° and Interpretation Rule 04).
2. **Voorschrift voor de behandeling / prescription pour le traitement** — written *after* the bilan, on the basis of the bilan results, by a specialist authorised for the specific pathology.

Interpretation Rule 04 (M.B. 19/01/2005) further specifies that a request to the médecin-conseil is "considered received" only on the date the *last* of the two documents (request form + medical prescription) arrives. The 60-day clock therefore restarts if the prescription arrives later than the application form.

Renewals after the first 2-year accord no longer require a fresh accord but still require a **prescription attached to the notification form** (Art. 36 §4, 6°).

### 2.2 Authorised prescribers per pathology

Source: Article 36 §4, 2° table "Voorschrijvers voor de eerste aanvraag van behandeling / Prescripteurs pour la première demande de traitement", in force since 01/08/2024 (officieuze coördinatie p.18).

The table is organised by 17 prescriber columns. Column groups (consolidated from the official PDF and cross-checked with VVL/voorschriftlogopedie.be pathology pages):

- ENT (NKO / ORL), Neurology, Neurosurgery, Pediatrics, Neuropediatrics (= pediatric neurology), Neuropsychiatry, Psychiatry, Stomatology, Physical Medicine & Rehabilitation, Internal Medicine, Oncology, Gastroenterology, Surgery (heelkunde), Geriatrics, GP (huisarts / médecin généraliste), Dentist (tandarts), Orthodontist.

| Pathology (Art. 36 §2 ref) | Authorised first-treatment prescribers | GP allowed for first treatment? | Notes |
|---|---|---|---|
| §2 a) Speech/voice problems hindering pursuit of an occupation | All specialists in the table **except** GP, Dentist, Orthodontist | NO | Adult/work context. |
| §2 b) 1° **Aphasia** | ENT, Neurology, Neurosurgery, Pediatrics, Neuropediatrics, Neuropsychiatry, Psychiatry, Stomatology, PM&R, Internal Medicine, Oncology, Gastroenterology, Surgery, **Geriatrics** | NO | Treatment must start within 6 months of the onset of the lesion (§5 b). |
| §2 b) 2° **Language-development disorders** | Same as aphasia minus Geriatrics | NO | Test must give score ≤ critère threshold; QI floor of 86 *abolished* since 01/09/2024 (see §1). |
| §2 b) 3° **Learning disorders (dyslexia, dysorthographia, dyscalculia)** | Same as 2° | NO | Child must be in ordinary primary or secondary school in the language of treatment for at least 6 months; max age 14 at constatation. |
| §2 b) 4° **Cleft lip / palate / alveolar process** | Same as 2° | NO | Special accord cycle (see §4 of this document). |
| §2 b) 5° **Acquired post-radiotherapy / post-surgical disorders (head & neck)** | Same as 2° | NO | |
| §2 b) 6.1 **Dysglossia (structural/traumatic anomalies of articulators)** | Same as 2° | NO | Etiology and severity must appear on the prescription. |
| §2 b) 6.2 **Dysarthria** | Same as aphasia (incl. Geriatrics) | NO | Etiology and severity required on the prescription (§4, 3°). |
| §2 b) 6.3 **Chronic speech disorders** (neuromuscular disease list, Parkinson, Huntington, demyelinating CNS disease, CP up to age 3) | **Only Neurology, Neurosurgery, Neuropediatrics**, plus **Neuropsychiatry** (re-added with retroactive effect to 01/05/2023 by A.R. 8.2.2023) | NO | Etiology obligatory; if MS / neuromuscular / cerebral palsy, the prescriber must be linked to a recognised rehabilitation centre conventioned with INAMI or with the federated entities. |
| §2 b) 6.4 **Stuttering** | Same as 2° | NO | Severity must be measured by a test from the Conventiecommissie limitative list and the score must appear in the bilan. |
| §2 b) 6.5 **Multiple functional myofunctional disorders linked to an orthodontic problem** | **Only ENT, Stomatology, Dentist, Orthodontist** | NO | Very narrow list; the 4 oral-cavity prescribers only. |
| §2 c) 1° **Sequelae of laryngectomy** | Same as 2° | NO | |
| §2 c) 2° **Voice / vocal-fold dysfunction** | Same as 2° | NO | Laryngoscopy + stroboscopy + acoustic/aerodynamic + impact-on-QoL test from the limitative list required. |
| §2 d) **Hearing-impairment-related speech disorders (≥40 dB HL average loss best ear)** | **Only ENT and Neuropediatrics**, and the prescriber must be **attached to a rehabilitation centre conventioned for integrated care of these patients** | NO | Patient must be enrolled (or have been enrolled) in a multidisciplinary rehabilitation programme that includes logopedie. |
| §2 e) **Dysphagia (compromising oral nutrition/hydration or aspiration risk)** | Same as aphasia (incl. Geriatrics) | NO | An objective examination — VFES (Video Fluoroscopic Evaluation of Swallowing) or FEES (Fiberoptic Endoscopic Evaluation of Swallowing) — must accompany the prescription. Children < 3 yrs unable to undergo either: file goes to the Conventiecommissie. |
| §2 f) **Dysphasia** (severe receptive/expressive language disorder persisting after 5th birthday, not explained by ASD/hearing/IQ) | **Only Neuropediatrics** (médecin spécialiste en neurologie pédiatrique) — applies even to the bilan prescription | NO | The bilan prescription itself must come from a neuropediatrician (A.R. 8.2.2023, §1 of Article 36). |
| §2 g) **Locked-In Syndrome (speech / language / swallowing)** | **Only Neurology, Neurosurgery, Neuropsychiatry, Neuropediatrics** | NO | Application must include an attestation by one of these specialists declaring LIS. |

#### Can a GP ever prescribe?

For the **first treatment** the GP is **excluded for every pathology** in the table above. Two GP-friendly carve-outs exist:

- **Bilan prescription** for most pathologies: the bilan can be prescribed by *any physician with an active INAMI/RIZIV number*, including a GP. Exception: for **dysphasia (§2 f)** the bilan prescription must be from a **neuropediatrician**.
- **Renewal prescription (prolongation)**: a GP **may** prescribe the renewal that accompanies the kennisgeving / notification de prolongation, **except** for §2 d) hearing disorders and §2 f) dysphasia where the GP remains excluded even at renewal stage.

### 2.3 What must be on the prescription

Mandatory elements derive from §4 of Article 36 and INAMI's Compendium:

- **Identification of the prescriber** (printed name + active RIZIV number + signature + stamp + date).
- **Identification of the patient** (name, date of birth, mutuality affiliation).
- **Type of prescription** (bilan vs treatment vs prolongation — usually pre-printed on the standardised forms hosted on voorschriftlogopedie.be and on the RIZIV "aanvraagformulieren" page).
- **Pathology category** named in the terminology of the nomenclature (e.g. "afasie", "dysfasie", "dyslexie/dysorthografie").
- **For §2 b) 6.3, b) 1° and b) 6.2**: prescription **must specify etiology, nature and severity** (Art. 36 §4, 3°).
- **For §2 e) (dysphagia)**: VFES or FEES report attached.
- **For §2 d) (hearing)**: confirmation that the prescriber is attached to a recognised rehabilitation centre.
- **For §2 g) (LIS)**: separate attestation of LIS diagnosis.
- **Number of sessions and exact period of intervention requested**, *only if the prescriber considers it medically necessary* (§4, 4°). When unspecified, the 30-minute individual session is the default unit; for therapeutic reasons the prescriber may indicate that some 30-minute sessions can be replaced by 60-minute sessions (one 60-minute session = two 30-minute sessions for billing purposes — §7).

### 2.4 Validity of the prescription

The Belgian rule is not "X months of pharmacy validity" but a **chain of deadlines**:

- The **bilan prescription** must be dated **before** the bilan is performed. If it is dated after, the bilan is non-reimbursable (Interpretation Rule 04).
- The **bilan must be followed within 60 calendar days by a treatment that is itself reimbursed by the insurance** (Art. 36 §1 condition for code 701013-701083). If treatment does not start within 60 days, the bilan loses reimbursability retroactively.
- The **request for intervention (bilan + first treatment)** must reach the médecin-conseil within **60 calendar days** of the bilan. Any session — bilan or treatment — performed more than 60 calendar days *before* the date of receipt by the médecin-conseil is refused (Art. 36 §4, 1°).
- For **renewal notifications (§4, 6° + §6)**: any treatment session performed more than 60 calendar days **before** the date of receipt of the notification is also refused.

There is no "X-month shelf-life" for an unused prescription comparable to physiotherapy. Practically, halingo should treat the prescription as expiring the moment the 60-day window between bilan and treatment-start closes.

---

## 3. The bilan workflow

### 3.1 Initial bilan (séance de bilan / bilan-objectief)

Code **701013-701083** — "Séance de bilan d'au moins 30 minutes avant le début d'un traitement logopédique" — fee R 17.5 (key letter R, see knowledge file 01 for actual euro amounts after coefficient).

Limits:
- May be attested **at most 5 times per treated disorder** (A.R. 4.6.2024 raised the cap from earlier limits).
- Cannot be billed on the same day as an individual or collective treatment session for the same patient.
- Cannot be performed at the patient's school.
- Reimbursement requires that an actually-reimbursed treatment starts **within 60 days** of the bilan.
- **Excluded** when the patient is concurrently undergoing a multidisciplinary bilan including logopedie in an INAMI-conventioned rehabilitation centre, except for §2 b) 6° 6.3 (chronic speech), §2 d) (hearing) and §2 e) (dysphagia).
- Each bilan billed reduces the maximum allowable treatment-session count for that pathology by 1 (§5 r).

### 3.2 Evolution bilan — abolished

The historic codes 702015 / 704012 / 706016 / 708013 / 710010 / 704115 (evolutiebilan / bilan d'évolution) were **suppressed by A.R. 4.6.2024** as of 01/08/2024. The product workflow should treat any "evolution bilan" as a non-reimbursable step under the new regime.

In its place, Article 36 §5 imposes a "**continuous evaluation**" obligation:

> "Une évaluation continue du traitement logopédique est nécessaire. Au cours de la période de traitement allouée de deux ans, au moins une évaluation formelle doit avoir lieu et être consignée dans le dossier du patient."

The formal evaluation uses tests from the limitative list (for pathologies that require listed tests) and focuses on the most relevant tests for the domains in which deficits were initially observed. The evaluation is **kept in the patient file** but **not separately billed** to the insurance.

### 3.3 Long evaluation session (700991-701002)

The new code **700991-701002** is a **séance d'évaluation > 30 minutes** at fee R 35. It can be billed only:
- by a logopedist meeting Art. 36 §8 quality conditions;
- **during** an ongoing reimbursed treatment period;
- when there is a documented *worsening of the disorder*, *stagnation of treatment results*, or *interruption of treatment ≥ 12 months*;
- followed within 60 calendar days by a reimbursed treatment session;
- not on the same day as another treatment session.

The reason for performing the long evaluation must be documented in the patient file. This code is **outside** the per-pathology session caps.

### 3.4 Content requirements for the initial bilan

Article 36 §4, 5° (consolidated text since 01/08/2024) requires the bilan kept in the patient file to include:

- Identification of the logopedist who performed the bilan;
- Identification of the patient (surname, first name, date of birth, address);
- Place where the bilan was performed;
- The disorder(s) for which treatment is proposed, named in the terminology of the nomenclature;
- Description of the problem illustrated by anamnestic data, observations, and examinations;
- Results of examinations performed with tests / scales / standardised tests (drawn from the limitative test lists when required), giving raw scores, normative interpretation (standard deviation, percentile, delay…), and qualitative+quantitative interpretation;
- Conclusion of the examination justifying the proposed treatment;
- A treatment proposal mentioning content characteristics, the treatment plan, the start date, frequency, duration, and place of treatment.

### 3.5 Submission to the médecin-conseil / adviserend arts

Procedural requirements (Art. 36 §4, 1°-6° + §8):

- The aanvraag is submitted on the standardised form approved by the Insurance Committee on the proposal of the Conventiecommissie. Forms are published per pathology on riziv.fgov.be ("Logopedie: Aanvraagformulieren voor een tegemoetkoming of kennisgeving van verlenging"). New form versions took effect 01/05/2025 (with transition until 30/06/2025); a dedicated orthodontic-disorder form took effect 01/09/2025.
- The form is **transmitted by the logopedist** to the médecin-conseil of the patient's organisme assureur. (The patient signs the consent block; the logopedist takes care of the actual submission. Practical mutuality pages such as Helan, CM and Solidaris confirm this is the standard route.)
- A medical prescription must be **annexed** to the form (§4, 2°). For dysphagia, an objective swallowing exam (VFES/FEES) must also be annexed.
- The signed form + prescription can be sent on **paper** or — and this is now the preferred channel — through the **eAgreement** digital service (§9 added by A.R. 4.6.2024). When eAgreement is used, the original prescription and original bilan stay with the logopedist; only an electronic copy travels.
- Each new treatment **and** each prolongation requires a separate eAgreement registration.
- "Reception by the médecin-conseil" date = the date the *latest* of the two documents (form + prescription) arrived (Interpretation Rule 04).

### 3.6 Approval timelines and silence-equals-consent

Article 36 itself does **not** define an explicit deadline by which the médecin-conseil must answer. Two empirical realities apply:

- Mutualities consistently process a complete logopedie file within a few weeks. CAAMI, Helan, CM and Solidaris pages all describe an active "the médecin-conseil examines the file and notifies the decision in writing".
- The general framework for prior approvals under the AMI-law / ZIV-wet treats a **45-calendar-day** absence of decision by the médecin-conseil as a tacit approval in many medication and special-care contexts. This rule is **not codified inside Article 36 for logopedie**, so halingo should not promise a hard "auto-approve at day 45" to its users. Document the case as "awaiting médecin-conseil decision" until a written accord/refus is received, and chase by day 30 if nothing has come back.
- The **60-calendar-day clock for retroactive sessions** is the hard rule that *is* in the nomenclature. As long as the file reaches the médecin-conseil within 60 days of the bilan, the bilan and the first sessions remain reimbursable even if the formal accord arrives later.

> Open question for legal counsel: confirm whether Belgian general administrative-law tacit-approval doctrine (or a Conventiecommissie circular) imposes a specific maximum response time for the médecin-conseil on logopedie files. The 45-day rule is robust for medication akkoord (Hoofdstuk IV) but not explicitly cross-applied to Article 36.

### 3.7 Evolution bilan and renewals (post-2024)

The renewal is now a **kennisgeving van verlenging / notification de prolongation**:

- The notification uses a **standardised form** approved by the Insurance Committee.
- A **medical prescription must be attached**. The GP can sign that prescription except for hearing disorders (§2 d) and dysphasia (§2 f).
- No fresh formal accord is given by the médecin-conseil — the law speaks of "réception d'une notification valable" (§6), not of approval.
- The notification still has to reach the médecin-conseil within 60 days of any session it covers; sessions performed > 60 days *before* the receipt of the notification are refused.
- For the pathologies that retain a one-year accord cycle (cleft & LIS), the renewal is still an *accord* and not a *notification* — it goes through the same approval workflow as the initial demand.

The product team should model the prolongation as a transition: state moves from "in approved 2-year window" → "kennisgeving sent" → "kennisgeving valid (deemed acknowledged)" once the form is logged in the mutuality system.

### 3.8 Difference between pathologies that need prior approval and those that do not

Under Article 36, **all** logopedic care that seeks reimbursement requires either an accord or a valid notification on file with the médecin-conseil. There is no "open access" pathology that is reimbursed without going through the médecin-conseil at all. The relevant cleavages are instead:

- **Accord** (initial 2-year, or 1-year for cleft / LIS) vs. **notification** (prolongations after the first accord, except cleft and LIS where you still need an accord per cycle).
- **Specialist prescription** for the first treatment vs. **GP prescription allowed** at renewal (with hearing/dysphasia exceptions).
- **Test list mandatory** (§2 b 2°, b 3°, b 6.4, c 2°, f) vs. test list not mandatory (the rest).

---

## 4. Pathology-bound session caps

All numbers below come from Article 36 §5, version in force since 01/08/2024 (officieuze coördinatie pp. 21-24). Each session is by default an **individual 30-minute treatment session**. One 60-minute session counts as two 30-minute sessions toward the cap (§7). Each billed bilan (701013) and each parental-guidance session also debits the cap (see §4.13 below).

### 4.1 §2 a) — Speech/voice impairment hindering occupational pursuit (adults)
- **Initial accord:** **55 sessions** of ≥30 min, over a continuous **2-year** period.
- **Unused sessions:** can be carried over into one or more notified 2-year prolongations (§5 a).
- **Renewal:** notification only.
- **Age limit:** none.
- **Setting:** cabinet, home, hospital, conventioned rehab; no school (occupational context).

### 4.2 §2 b) 1° — Aphasia
- **Initial accord:** **288 sessions** over **2 years**.
- **Treatment must start within 6 months of the onset of the disorder** (§5 b).
- **Renewal:** unused sessions can be carried over via notified 2-year prolongations.
- **Age limit:** none.
- **Settings:** cabinet, home, school (very rare in adults), hospital, rehab convention.

### 4.3 §2 b) 2° — Language-development disorders
- **Initial accord:** **190 sessions** over **2 years**.
- **Renewal:** notified 2-year prolongations until the **eve of the 18th birthday** ("17 ans révolus") **and only if the child attends ordinary education**.
- **Hard exclusion at renewal:** no prolongation if the child has meanwhile obtained an accord under §2 b) 3° (learning disorders) or §2 f) (dysphasia). I.e. you cannot have parallel accords across these three categories.
- **Test condition:** language test giving a score ≤ critère value, in the absence of a serious hearing disorder (mean loss ≤ 40 dB HL best ear).
- **IQ floor abolished** since 01/09/2024 — patients with QI/QD < 86 are now reimbursable for monodisciplinary treatment.
- **Setting:** cabinet, home, school; hospital and rehab convention codes also exist.

### 4.4 §2 b) 3° — Learning disorders (dyslexia, dysorthographia, dyscalculia)
- **Initial accord:** **140 sessions** over **2 years**.
- **Age conditions:**
  - The disorder must be **constated in children up to 14 years revolus** (so on or before the 15th birthday — "tot en met de 14de verjaardag").
  - The child must have attended **ordinary primary or secondary education for at least 6 months** in the language in which the disorders are treated.
  - Renewal possible until **17 ans révolus** (eve of 18th birthday), provided the child still attends ordinary education.
- **Test condition:** **two scores ≤ critère value** on tests of reading, spelling and/or arithmetic; tests must be appropriate to the school year and drawn from the limitative list.
- **Bilan must report:** precision/speed (automatisation) level; phonological development (only for dyslexia/dysorthographia); compensation behaviours / negative attitudes / increased effort; aids already provided at school and at home.
- **Mutual exclusion at renewal:** no prolongation if the child has meanwhile obtained an accord under §2 f) (dysphasia). Inversely, Interpretation Rule 02 (M.B. 09/05/2002) — still applicable in spirit — clarifies that learning-disorder treatment is conceived globally: a single 2-year period across the lifetime for §2 b) 3° (so dyscalculie cannot trigger a fresh 2-year cycle after a dyslexia/dysorthographia cycle has already been used). The 2024 reform conserved the global-cycle logic.
- **Special exclusion (§3, last bullet):** patients receiving a §2 b) 2° (language-development) treatment cannot simultaneously receive a §2 b) 3° (learning) treatment if they are already in a dyslexia/dysorthographia/dyscalculia path. The categories are mutually exclusive.
- **Settings:** cabinet, home, school, hospital, rehab convention.

### 4.5 §2 b) 4° — Cleft lip / palate / alveolar disorders
- **Children 0-2 years (revolus):** **a single accord** valid until the eve of the 3rd birthday, with **max 30 individual ≥30-min sessions** for the whole period.
- **Children 3-19 years (revolus):** up to **8 successive accords of max 1 year each**, given according to therapeutic need and possibly spaced. Per accord: **max 75 sessions**. Unused sessions cannot be transferred between accord periods.
- **Renewal:** still operates as an accord cycle (1 year), **not** as a notification — even after 2024.
- **No age limit beyond 19** — at the end of the 8 cycles the patient is generally too old for §2 b) 4°.
- **Settings:** cabinet, home, school, hospital, rehab convention.

### 4.6 §2 b) 5° — Acquired post-radiotherapy / post-surgical disorders (head & neck)
- **Initial accord:** **55 sessions** over **2 years**.
- **Renewal:** notified 2-year prolongations for unused sessions.
- **Age limit:** none.
- **Settings:** all standard settings.

### 4.7 §2 b) 6.1 — Dysglossia (structural anomaly of articulators)
- **Initial accord:** **149 sessions** over **2 years**.
- **Renewal:** notified prolongations.
- **Age limit:** none.

### 4.8 §2 b) 6.2 — Dysarthria
- **Initial accord:** **176 sessions** over **2 years**.
- **Renewal:** notified prolongations.
- **Etiology and severity** must appear on the prescription (§4, 3°).
- **Age limit:** none.

### 4.9 §2 b) 6.3 — Chronic speech disorders (neuromuscular, Parkinson, Huntington, demyelinating CNS disease, infantile cerebral palsy ≤3 yrs)
- **Initial accord:** **520 sessions** over **2 years**.
- **Renewal:** **notified 2-year prolongations**, with **520 fresh sessions per renewal cycle**, each time the prescriber establishes that further treatment can significantly improve the dysarthria or its communicative consequences.
- **Lifetime cap:** none — chronic neurological is the only major category that can be renewed indefinitely with a fresh full cap each cycle (LIS is similar but on 1-year cycles).
- **No exclusion** when the patient is also in an INAMI-conventioned rehabilitation centre (§3, 5° carve-out).
- **Settings:** cabinet, home, hospital, conventioned rehab; no school code in the table for 6.3.

### 4.10 §2 b) 6.4 — Stuttering
- **Initial accord:** **128 sessions** over **2 years**.
- **Renewal:** notified prolongations for unused sessions.
- **Test:** stuttering severity measured with a test from the limitative list; the score must appear in the bilan.
- **Age limit:** none.

### 4.11 §2 b) 6.5 — Multiple functional / myofunctional disorders linked to an orthodontic problem
- **Initial accord:** **20 sessions** over **2 years**.
- **Renewal:** notified prolongations for unused sessions.
- **Prescribers:** ENT, stomatology, dentist, orthodontist only.
- **Age limit:** none formally; in practice this is mostly a pediatric/adolescent code.

### 4.12 §2 c) Voice disorders
- **§2 c) 1° Sequelae of laryngectomy:** **90 sessions** over **2 years**, notified prolongations possible.
- **§2 c) 2° Voice / vocal-fold dysfunction:** **80 sessions** over **2 years**, notified prolongations possible.
  - Required test bundle: laryngoscopy + stroboscopy + perceptive/acoustic/aerodynamic measures + impact on QoL, with tests/criteria from the limitative voice-disorders test list.
  - **Excluded** functional disorders: aphonia or acute functional dysphonia, phonasthenia, voice-mutation disorders (§3 final bullets).
- **Age limit:** none.

### 4.13 §2 d) Hearing-related speech disorders (≥40 dB HL average loss best ear)
- **Initial accord:** **520 sessions** over **2 years**.
- **Renewal:** notified 2-year prolongations possible **only if the renewal prescription comes from a réadaptation specialist attached to a recognised conventioned rehabilitation centre**. Per renewal cycle: **520 fresh sessions**.
- **Age limit:** reimbursement ends at the **18th birthday** for hearing disorders, language-development disorders and dysphasia (per the 2024 RIZIV summary of changes).
- **Setting constraint:** patient must follow or have followed a multidisciplinary rehabilitation programme that includes logopedie at a federated-entities-conventioned rehabilitation centre integrated for these patients.
- **GP cannot prescribe** at renewal (carve-out).

### 4.14 §2 e) Dysphagia
- **Initial accord:** **65 sessions** over **2 years**.
- **Renewal:** notified prolongations for unused sessions.
- **Age limit:** reimbursement ends at the 18th birthday (RIZIV 2024 summary). For children < 3 yrs unable to undergo VFES/FEES the file is transferred to the Conventiecommissie for decision.
- **Settings:** cabinet, home, hospital, rehab convention; **no school code** (728353 absent from the nomenclature).

### 4.15 §2 f) Dysphasia (severe persistent receptive/expressive language disorder after 5 yrs)
- **Initial accord:** **384 sessions** over **2 years** (the largest "first cycle" cap among reimbursable pathologies).
- **Renewal:** prolongable until **17 ans révolus** (eve of 18th birthday) provided the child is in ordinary education. **Per notified 2-year renewal: max 192 fresh sessions** (half the initial cycle).
- **Age limit:** reimbursement ends at the 18th birthday.
- **Test condition:** test scores ≤ critère value in **at least one modality (expressive OR receptive)** in **at least three of the four domains** (phonology incl. metaphonology / lexicon-semantics / morphology / syntax). Tests from the limitative dysphasia test list.
- **IQ floor:** as for §2 b) 2°, the QI 86 floor was abolished from 01/09/2024.
- **Bilan prescription must come from a neuropediatrician** (this is the only pathology where the *bilan* prescriber is restricted at the level of §1).
- **School sessions (code 733353):** allowed at max 5 per calendar month, **and only during the first 2-year accord period**. School sessions are forbidden after the first prolongation.
- **GP cannot prescribe** at renewal (carve-out).

### 4.16 §2 g) Locked-In Syndrome
- **First accord:** **150 sessions** over a **continuous 1-year period**.
- **Renewal:** by **1-year cycles**, **for life**, with **max 100 fresh sessions per renewed year**.
- **Application** must include an attestation of LIS by a specialist in neurology, neuropsychiatry, neuropediatrics or neurosurgery.
- **Age limit:** none.
- **Settings:** cabinet, home, hospital. (No school or rehab-convention code in the LIS table.)

### 4.17 Parental guidance sessions (711012, 711115, 711211, 712014, 712110, 712213 and their collective counterparts 713016, 713112, 713215, 714011, 714114, 714210)
- **Cap:** **maximum 10 sessions of parental guidance per disorder, per child**, spread across the entire treatment.
- The parental-guidance count **debits the per-pathology session cap**:
  - 1 individual parental guidance session (≥60 min) = 2 individual 30-min treatment sessions.
  - 1 collective parental guidance session = 1 individual 30-min treatment session.
- Parental guidance is allowed on the same day as a regular treatment session for the same patient (exception to the one-session-per-day rule).

### 4.18 Frequency limits
- **At most one individual or collective treatment session per day per patient**, with the parental-guidance exception above (§7).
- The nomenclature does **not** impose a fixed weekly maximum, but the bilan must specify the proposed frequency, and the médecin-conseil can refuse a plan with an unrealistic frequency (e.g. 5 sessions/week for a learning disorder is generally not approved). In practice, mutualities expect 1-3 sessions/week for most reimbursable pathologies.
- A **60-minute session counts as two 30-minute sessions** for the cap and is **not reimbursable for patients < 10 years old** (§3bis, A.R. 10.11.2012).

### 4.19 Specific exclusions (§3 of Article 36)
The treatment is **never** reimbursed when the patient:
1. Follows special education (enseignement spécial / buitengewoon onderwijs). This exclusion applies **only** to §2 b) 2° (language-development), §2 b) 3° (learning) and §2 f) (dysphasia). It does **not** block aphasia, dysarthria, voice, dysphagia, etc. (Interpretation Rule 07.)
2. Is treated/lodged in an institution recognised and subsidised by the communities/regions where "logopedist" is part of the agréation norms.
3. Is hospitalised in a service indexed G, T, A, Sp or K.
4. Stays in MSP, MRPA or MRS (psychiatric/elderly nursing facility).
5. Is rehabilitated in an INAMI- or federated-entities-conventioned establishment that covers the speech-therapist treatment, **except** for §2 b) 6.3 (chronic speech) and §2 d) (hearing). Interpretation Rule 8 (M.B. 15/01/2026) clarifies the timing window: the exclusion runs from the **first** to the **last** session of the conventioned multidisciplinary treatment validated by the final bilan; once that ends, monodisciplinary logopedie can resume (or continue from the remaining container).

Also explicitly excluded by §3, regardless of category:
- Secondary disorders due to psychiatric conditions, emotional states, relational problems, neglected/insufficient schooling (e.g. illness), learning of a non-mother-tongue language, multilingual upbringing.
- Isolated disorders such as **sigmatism, rhotacism, lambdacism, capacism, cluttering** ("bredouillement").
- Voice disorders such as aphonia / acute functional dysphonia, phonasthenia, voice-mutation disorders.
- Patients undergoing dyslexia/dysorthographia/dyscalculia treatment cannot also be reimbursed under §2 b) 2° (language-development).

> **Pure learning delay without test-based qualifying criteria is not reimbursable.** Halingo's eligibility checker should treat the limitative-list test scores as a hard prerequisite for §2 b) 2°, b) 3°, b) 6.4, c) 2° and f).

---

## 5. Setting-dependent rules (cabinet / home / school / institution)

The nomenclature uses **distinct CNK codes** per setting per pathology. The matrix is as follows (extracted from §1 and the per-pathology code lists):

| Setting | Code suffix | Available for |
|---|---|---|
| **At the logopedist's cabinet** | -316/-336 series ending in 6 ("au cabinet du logopède") | **All** reimbursable pathologies |
| **At the patient's home** | -331/-353 series ending in 1/3 ("au domicile du bénéficiaire") | All pathologies |
| **At the patient's school** | -353/-355 series ending in the third position ("à l'école du bénéficiaire") | §2 a, §2 b) 1°, 2°, 3°, 4°, 5°, 6.1, 6.2, 6.4, 6.5, §2 c) 1°, 2°, §2 d), §2 f). **Not available** for §2 b) 6.3 (chronic speech), §2 e) (dysphagia), or §2 g) (LIS). |
| **In the framework of a réadaptation convention** | -370/-374/-376 series | All pathologies (used when the treatment is delivered through a conventioned centre). |
| **For a hospitalised beneficiary** | -381/-383/-386 series | All pathologies. |
| **Collective session (≤4 patients, ≥60 min)** | -410/-471/-482 series | §2 a, §2 b) 1° (aphasia), §2 b) 5° (post-RT/surgery), §2 b) 6.4 (stuttering), §2 c) 1° (laryngectomy). Not available for most other categories. |

Setting-specific rules and constraints:

- **Bilan never at school.** "qu'elle ne soit pas effectuée à l'école du bénéficiaire" (§1, 701013-701083 conditions).
- **School sessions for dysphasia (§2 f) 733353**: max 5 per calendar month, **and only during the first 2-year accord** — forbidden once the first prolongation kicks in.
- **Sessions ≥60 minutes** are blocked for any patient < 10 years old, regardless of pathology (§3bis).
- **Rehab-convention codes** (-370 series) cannot be used in parallel with the §3, 5° exclusion: the patient must actually be in the conventioned centre and the logopedist must be on its team. Interpretation Rule 03 (M.B. 17/05/2004) confirms a logopedist working in a conventioned centre may bill monodisciplinary sessions only outside their convention working hours.
- **Justification on the bilan:** Article 36 §4, 5° requires the bilan to mention "le lieu du traitement" — the setting is part of the treatment proposal that the médecin-conseil approves. Switching settings mid-cycle (e.g. cabinet → home) should be accompanied by a documented justification in the patient file (transport difficulty, medical reason, severe motor impairment) — mutualities sometimes ask for clarification.
- **Home sessions** typically require a medical justification (mobility impairment, severe disability, very young age combined with caregiver constraints) — there is no formal RIZIV checkbox but the médecin-conseil may query.

---

## 6. Refusals, appeals, and contested cases

### 6.1 Why a file gets refused

Common refusal grounds (consolidated from mutuality practice and Article 36):
- File reached the médecin-conseil **> 60 days** after the bilan.
- Bilan prescription **post-dates** the bilan.
- Treatment prescription **predates** the bilan.
- Test scores not from the limitative list / not above the criterion threshold.
- Wrong prescriber for the pathology (e.g. a GP signed an aphasia treatment prescription).
- Required attached document missing (VFES/FEES for dysphagia, LIS attestation for §2 g, laryngostroboscopy for voice disorders).
- Patient is in an excluded setting (§3): special education + §2 b) 2°/3°/f, conventioned rehab + non-carve-out pathology, MRPA/MRS, etc.
- Disorder is on the explicit non-reimbursable list (sigmatism, lambdacism, etc.).
- Patient already used a §2 b) 3° lifetime cycle and is now requesting another for a different listed disorder.

### 6.2 Internal appeal — Conventiecommissie

Article 36 §8 explicitly contemplates the possibility that **the médecin-conseil transfers a file to the Conventiecommissie logopedie-organismes assureurs**. Examples in the text:
- Children < 3 yrs with dysphagia who cannot undergo VFES/FEES: the file is sent to the Commission for decision.
- Other borderline cases at the médecin-conseil's discretion.

This is a **first-line review** internal to the assurance system and is the most direct route when a file is contested on technical grounds. Halingo should track refusals tagged "transferred to Conventiecommissie" as a separate sub-state because the timeline can run into months.

### 6.3 Helan-style "consolation" tegemoetkoming

Some mutualities (Helan documented this explicitly) provide a **complementary insurance** payout when the médecin-conseil refuses the obligatory-insurance file: e.g. €10/session up to 150 sessions. These are *not* RIZIV reimbursements; they are funded from the mutuality's voordelen / avantages purse and vary per mutuality. Halingo should not model these as RIZIV-side cashflows.

### 6.4 External appeal — Arbeidsrechtbank / tribunal du travail

When the contestation is purely a denial of a reimbursement right under the Health Insurance Act, the patient can lodge a complaint with the **Arbeidsrechtbank / tribunal du travail** (the Belgian labour court has jurisdiction over disputes under the AMI/ZIV law). Deadline: **3 months from the notification of the contested decision**. Counsel is not mandatory. This is the route once the internal review through the médecin-conseil and the Conventiecommissie is exhausted.

### 6.5 Private treatment in parallel

Nothing in Article 36 prevents the patient from continuing treatment **at their own expense** while the file is contested. The logopedist's tariffs remain free in that case (no convention-tariff obligation when not invoking RIZIV reimbursement), and many private speech therapists do work this way for patients who do not meet the criterion thresholds. The product workflow should support a "private only" billing track that does not produce a request to the médecin-conseil.

---

## 7. Combination with other disciplines (kine, ergo, neuropsy)

Combination rules are **not** centralised in Article 36; they live in the §3 exclusions and in the conventions-réadaptation framework. Practical rules:

- **Logopedie + kinesitherapie (Article 7):** generally allowed in parallel. There is no Article 36 / Article 7 mutual exclusion. Both can be reimbursed for the same patient on the same day (different one-session-per-day rules apply per discipline). A child with cerebral palsy can simultaneously receive §2 b) 6.3 logopedie and Fa-list kinesitherapie.
- **Logopedie + ergotherapie:** monodisciplinary ergotherapy is generally **not reimbursed** by RIZIV outside the home-care convention introduced in 2011 for patients leaving a recognised rehab programme. Where ergotherapy is delivered through a **CAR / centre de référence** or a **conventioned multidisciplinary rehab centre**, this is the high-risk combination: §3, 5° kicks in and **monodisciplinary logopedie reimbursement is suspended for the duration** of the multidisciplinary treatment (carve-outs for §2 b) 6.3, §2 d), §2 e)). Interpretation Rule 8 (current text 2/10/2025) clarifies the temporal window — monodisciplinary logopedie is allowed up to the first multidisciplinary session and again after the last.
- **Logopedie + neuropsychology:** RIZIV does not reimburse private monodisciplinary neuropsychology. When neuropsychology is delivered through a CAR or rehab convention, the same §3, 5° rule applies. When delivered through the new Conventie Eerstelijnspsychologische Zorg, the question is open and should be flagged for verification.
- **Logopedie inside a CAR (Centrum voor Ambulante Revalidatie / Centre de Référence):** Patients enrolled in a CAR generally lose access to monodisciplinary RIZIV logopedie reimbursement for the duration of their CAR programme. This is a hard rule that mutualities enforce strictly and is the most common cause of cumulation refusals in pediatric language/learning disorders.
- **Logopedie + GGZ-trajecten (mental-health convention):** No automatic exclusion; verify per file.

> Halingo design implication: model "active CAR enrolment" and "active rehab-convention enrolment" as flags on the patient that gate the eligibility check for §2 a), b)1°-2°-3°-4°-5°-6.1-6.2-6.4-6.5, c), and f).

---

## 8. Documentation retention for prescriptions and bilans

Two parallel obligations apply:

### 8.1 Patient file under the Quality Law (Wet Kwaliteitsvolle Praktijkvoering / Loi qualité)

The **Wet van 22 april 2019 inzake de kwaliteitsvolle praktijkvoering in de gezondheidszorg** (in force since 1 July 2022, with Article 35 in force since 1 January 2022) requires every healthcare professional — logopedists included — to keep the patient file:

- **Minimum 30 years** and **maximum 50 years** from the **last patient contact** (Art. 35).

This is the framework rule and supersedes any earlier shorter obligation. It covers the bilan, prescriptions, evaluations, treatment notes, and correspondence.

### 8.2 Documents kept for RIZIV verification

Article 36 §8 b) cross-refers to the data-conservation rules set under the law of 7 December 2005 (concerning ZIV documentation for the obligatory insurance). The standard practical interpretation:

- **Original prescription and original bilan** are kept by the **logopedist** (Art. 36 §9 explicitly when eAgreement is used: "Les prescriptions et le bilan original sont conservés par le logopède.").
- The exception: when the **digital service for prescription transmission** (electronic prescription) under articles 28 and 30 of the Quality Law of 22 April 2019 is used, the obligation to keep the *paper* original of the prescription is lifted.
- Pseudocode prestations and attestations for billing must be kept available for RIZIV inspection. The *practical* RIZIV inspection horizon for nomenclature controls is **2 years (mutuality processing) + 3 years (RIZIV control) = 5 years** for the billing-relevant subset. Since this is shorter than the Quality Law's 30 years, the Quality Law dominates the operational retention period.

### 8.3 GDPR layer

Patient data (test results, consents, contact details) are personal data under the GDPR. The legal basis is the treatment relationship + legal obligation (Art. 9 §2 h GDPR). Halingo's data model should map the 30-50 year retention to a **legal-hold** flag that prevents normal expiration deletion.

### 8.4 Practical product checklist

- Store the bilan as an immutable PDF + structured JSON (so the system can audit content against §4, 5°).
- Store both prescriptions (bilan + treatment, plus any prolongation prescription).
- Store the signed kennisgeving / aanvraag form, with timestamps for "sent to médecin-conseil" and "received accord/refus".
- Store the eAgreement transaction reference if the digital channel was used.
- Apply a 30-year minimum retention from "date of last session" with an explicit override field for legal hold up to 50 years.

---

## 9. Freshness notes

- All structural rules in this document reflect the version of Article 36 in force since **01/08/2024** (officieuze coördinatie published by RIZIV/INAMI), incorporating A.R. 4.6.2024.
- Interpretation Rule 8 was last updated by **M.B. 15/01/2026** with effective date 02/10/2025.
- New aanvraag/kennisgeving forms came into force **01/05/2025** (with transition until 30/06/2025), and a dedicated orthodontic-disorders form on **01/09/2025**.
- The 2026-2027 logopedist convention indexes tariffs by **+2.72% from 01/01/2026**.
- **From 01/01/2026** the COVID-era remote-care attestation possibility is abolished.
- The 86-IQ floor for §2 b) 2° and §2 f) was abolished from **01/09/2024**.
- The neuropsychiatrist was re-added as authorised prescriber for §2 b) 6.3 with retroactive effect to **01/05/2023** (A.R. 8.2.2023).
- **Watch-outs for monitoring:**
  - Several private practitioner sites (voorschriftlogopedie.be, individual mutuality FAQ pages) still cite the **pre-August-2024** durations (1 year accord, separate evolution bilan). Do not use them as the source of truth — the RIZIV PDF is canonical.

- **Verification pass 2026-04-06 (see `verification-2026-04/02-clinical.md`):**
  - **Silence-equals-consent / 45-day rule — RESOLVED (no such rule for Article 36).** Article 36 itself, the AR du 3 juillet 1996 Title II, and Title III of the loi coordonnée du 14 juillet 1994 contain no silence-equals-consent rule for logopedic prior approval. The only "approbation tacite" provision in Belgian AMI law (15-day rule, AR 3.7.1996 art. 153 / 153bis) is sectorally limited to the dependency-care forfait in MR-MRS and centres de soins de jour. Product UI must therefore NOT show an auto-approve state for the first aanvraag; for verlengingen, rely on the §6 rule that valid receipt of a kennisgeving is itself the trigger (a statutory shift to notification-only, not silence-equals-consent).
  - **Cumulation with eerstelijnspsychologische zorg (ELPZ) — RESOLVED (no ban).** A patient on a reimbursed Article 36 logopedic trajectory may simultaneously receive reimbursed ELPZ sessions. Article 10 of the 2024 ELPZ convention is intra-system only; Article 36's sole cross-care exclusion targets multidisciplinary functional rehabilitation conventions, not ELPZ. The only cross-system constraint is art. 10 §4 ELPZ on same-day concertation indemnities (affecting the psychologist's invoicing).
  - **Cancellation-fee legal basis — RESOLVED (no statutory rule, never reimbursable).** No RIZIV/INAMI provision, convention, or interpretative rule addresses cancellation fees. They are governed solely by general contract law and the VVL deontological "moderation and information" principle (art. 3.5 of the VVL ethics code), and are never reimbursable by the verzekeringsinstelling because a no-show is not a verstrekking effectivement performed.

---

## 10. Sources

### Primary (Belgian federal)

- [Nomenclatuur artikel 36 — officieuze coördinatie LOGOPEDIE Art. 36 (NL, in force 01/08/2024)](https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatuurart36_20240801_01.pdf)
- [Nomenclature article 36 — coordination officieuse LOGOPEDIE Art. 36 (FR, en vigueur 01/08/2024)](https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatureart36_20240801_01.pdf)
- [Article 36 — Règles interprétatives 1 à 8 (M.B. 15/01/2026)](https://www.inami.fgov.be/SiteCollectionDocuments/nomenclatureart36_interpretation.pdf)
- [RIZIV — Nomenclatuur van de logopedische verstrekkingen: laatste wijzigingen](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/nomenclatuur-van-de-logopedische-verstrekkingen-laatste-wijzigingen)
- [INAMI — Nomenclature des prestations de logopédie : dernières modifications](https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes/nomenclature-des-prestations-de-logopedie-dernieres-modifications)
- [RIZIV — Verzorging door de logopedist](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/verzorging-door-de-logopedist)
- [INAMI — Soins par le logopède](https://www.inami.fgov.be/fr/professionnels/professionnels-de-la-sante/logopedes/soins-par-le-logopede)
- [RIZIV — Logopedie: Aanvraagformulieren voor een tegemoetkoming of kennisgeving van verlenging](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/logopedie-aanvraagformulieren-voor-een-tegemoetkoming-of-kennisgeving-van-verlenging)
- [RIZIV — Logopedie: terugbetaling van zittingen voor patiënten met een IQ lager dan 86 (01/09/2024)](https://www.inami.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/logopedie-terugbetaling-van-zittingen-voor-patienten-met-een-iq-lager-dan-86)
- [RIZIV — Limitatieve lijst taaltests (van toepassing vanaf 01/08/2024)](https://www.riziv.fgov.be/SiteCollectionDocuments/lijst-logopedist-taaltest-dysfasie-20240801.pdf)
- [RIZIV — Limitatieve lijst van tests — toepassingsregels vanaf 01/08/2024](https://www.riziv.fgov.be/SiteCollectionDocuments/lijst-logopedist-tests-toepassing-20240801.pdf)
- [INAMI — Comment demander un remboursement pour un traitement de logopédie ?](https://www.inami.fgov.be/fr/themes/soins-de-sante-cout-et-remboursement/les-prestations-de-sante-que-vous-rembourse-votre-mutualite/comment-demander-un-remboursement-pour-un-traitement-de-logopedie)
- [RIZIV — Hoe vraag ik een terugbetaling voor een logopediebehandeling aan?](https://www.riziv.fgov.be/nl/thema-s/verzorging-kosten-en-terugbetaling/wat-het-ziekenfonds-terugbetaalt/hoe-vraag-ik-een-terugbetaling-voor-een-logopediebehandeling-aan)
- [Wet van 22 april 2019 inzake de kwaliteitsvolle praktijkvoering in de gezondheidszorg](https://etaamb.openjustice.be/nl/wet-van-22-april-2019_n2019041141.html)

### Secondary (mutualities)

- [Helan — Medisch akkoord voor logopedie](https://www.helan.be/nl/wat-te-doen-bij/praktische-vragen/terugbetalingen/medisch-akkoord/medisch-akkoord-logopedie/)
- [CM — Demande d'accord pour un traitement de logopédie (médecin-conseil)](https://www.mc.be/fr/professionnels/procedure-accord-logopedes)
- [CM — Speech therapy reimbursement](https://www.cm.be/en/services-and-benefits/speech%20therapy)
- [Solidaris Wallonie — Remboursement logopédie](https://www.solidaris-wallonie.be/avantages/logopedie)
- [Partenamut — Logopédie : comment demander un remboursement ?](https://www.partenamut.be/fr/remboursements-avantages/enfants/logopedie/demarche)
- [HZIV / CAAMI — Logopedie (member info)](https://www.caami-hziv.fgov.be/nl/leden/terugbetaling-medische-kosten/terugbetalingen/logopedie)
- [HZIV — Akkoord adviserend arts](https://www.caami-hziv.fgov.be/nl/zeevarenden/terugbetaling-medische-kosten/akkoord-adviserend-arts)
- [VNZ — Terugbetaling logopedie](https://www.vnz.be/voordelen-terugbetalingen/terugbetaling-medische-kosten/logopedie/)
- [NZVL — Terugbetaling logopedie](https://www.nzvl.be/ons-aanbod/ziekenfonds/diensten-en-voordelen-van-a-z/terugbetaling-logopedie)

### Secondary (professional bodies and reference sites)

- [VVL — Spraakstoornissen / Taalstoornissen / Afasie](https://www.vvl.be/zorgverlener/spraakstoornissen)
- [VVL — Bewaartermijnen / patiëntendossier](https://www.vvl.be/)
- [Voorschriftlogopedie.be — Afasie](https://www.voorschriftlogopedie.be/afasie)
- [Voorschriftlogopedie.be — Taalstoornissen](https://www.voorschriftlogopedie.be/taalstoornissen)
- [Voorschriftlogopedie.be — Dysfasie](https://www.voorschriftlogopedie.be/dysfasie)
- [Voorschriftlogopedie.be — Stotteren](https://www.voorschriftlogopedie.be/stotteren)
- [Voorschriftlogopedie.be — Dysartrie](https://www.voorschriftlogopedie.be/dysartrie)
- [Voorschriftlogopedie.be — Stemstoornissen](https://www.voorschriftlogopedie.be/stemstoornissen)
- [Voorschriftlogopedie.be — Gehoorstoornis](https://www.voorschriftlogopedie.be/gehoorstoornis)
- [Vlaams Artsensyndicaat — Bewaartermijnen](https://www.vlaamsartsensyndicaat.be/bewaartermijnen)
- [Ordomedic — Bewaring van de medische dossiers (2024)](https://ordomedic.be/nl/provinciale-raden/vlaams-brabant-en-brussel/nieuwsbrieven/nieuwsbrief-2024-1/bewaring-van-de-medische-dossiers)
- [Aha-logopedie — Algemene voorwaarden](https://aha-logopedie.be/algemene-voorwaarden/)
- [Hetletterpunt — Logopedisch dossier voor terugbetaling mutualiteit](https://hetletterpunt.be/bijleren/dossier-voor-logopedische-terugbetaling/)

### Cross-discipline references

- [RIZIV — Terugbetaling kinesitherapie Fa/Fb-lijst](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/kinesitherapeuten/terugbetaling-van-kinesitherapie-voor-de-aandoeningen-op-de-lijsten-fa-en-fb)
- [RIZIV — Ergotherapie tegemoetkoming](https://www.riziv.fgov.be/nl/thema-s/verzorging-kosten-en-terugbetaling/wat-het-ziekenfonds-terugbetaalt/verzorging-in-gespecialiseerde-centra/ergotherapie)
- [RIZIV — Overeenkomst 2026-2027 voor de logopedisten](https://www.riziv.fgov.be/nl/professionals/individuele-zorgverleners/logopedisten/overeenkomst-2026-2027-voor-de-logopedisten)
- [RIZIV — Tarieven logopedie 01-01-2026](https://www.riziv.fgov.be/SiteCollectionDocuments/tarief_logopedisten_20260101.pdf)
