---
name: dpwh-rccem
description: >
  DPWH Road Construction Cost Estimation Manual (RCCEM) 2015 expert — Bureau of Construction.
  Use when the user asks about DPWH road construction pay items, DUPA sheets, cost estimation,
  computation formulas, labor/equipment/material breakdowns, or road construction specifications.
  Covers earthworks, subbase, base course, surface course, drainage, miscellaneous structures.
trigger: /dpwh-rccem
---

# DPWH Road Construction Cost Estimation Manual (RCCEM) 2015

**Source:** Document 1005352503-DPWH-RCCEM.pdf, Bureau of Construction, DPWH Philippines  
**Extracted:** 2026-05-06  
**Coverage:** 250 pages, ~240 DUPA sheets across Parts C, D, E, F, H

---

## How to Use This Skill

When the user asks a question, read the relevant reference file(s) listed in the routing table below. Do NOT rely on training-data recall for DPWH-specific computations — always read the reference file first.

---

## Routing Table

| Question Type | Reference File |
|---|---|
| "What are all pay items / complete list of work items" | `references/00-pay-item-master-index.md` |
| General rules, definitions, cost estimation process, DUPA format | `references/01-general-provisions.md` |
| Earthworks: clearing, grubbing, excavation, embankment, subgrade (items 100–105) | `references/02-earthworks.md` |
| Subbase & base course: aggregate, crushed, lime/cement/asphalt stabilized (items 200–206) | `references/03-subbase-and-base-course.md` |
| Surface course: gravel, bituminous, PCCP, ACBC, cold/hot mix (items 300–311) | `references/04-surface-course.md` |
| Drainage & slope protection: pipe culverts, RCBC, slope protection, riprap (items 500–508) | `references/05-drainage-and-slope-protection.md` |
| Structures & miscellaneous: concrete, reinforcing steel, signs, guardrails (items 400–406, 600+) | `references/06-structures-and-miscellaneous.md` |
| Formulas: cycle time, hauling computation, volume computation | `references/07-computation-formulas.md` |
| Labor rates, equipment rental rates, conversion factors | `references/08-appendices-and-conversion.md` |

---

## Critical Pinned Rules

These override training-data defaults — always apply:

1. **DUPA basis:** Standard DUPA is based on **one (1) gang of labor and equipment** with the specified output per day.
2. **Output adjustment:** To increase output, additional equipment and labor may be added.
3. **Labor rates:** Based on DPWH standard labor rates per D.O. No. 22, Series of 2015.
4. **Equipment rates:** From ACEL Guidebook 2014, Edition 25 (D.O. No. 22, Series of 2015).
5. **Materials price:** From DPWH District Engineering Office Construction Materials Price Data (CMPD), updated quarterly.
6. **Mark-up:** OCM and Profit applied per Total Estimated Direct Cost (EDC) per D.O. No. 22, Series of 2015.
7. **Capacity adjustment:** Equipment with capacity higher than standard lowers unit cost; lower capacity raises it.
8. **Haul distance:** Dump truck hours adjusted based on actual hauling cycle time analysis (see Appendix C).
9. **Payment basis:** Payment is per unit of completed and accepted work at the contract unit price.
10. **VAT:** Applied to total unit cost (Direct + OCM + Profit) at statutory rate.

---

## Scope

**USE** for: DPWH road construction cost estimation, ABC/POW preparation, DUPA verification, pay item quantity computation, contract cost review.

**DO NOT USE** for: Non-DPWH standards, foreign road specifications, building construction (separate manual), procurement rules (IRR/RA 9184), or structural design.

---

## Pay Item Series Summary

| Series | Part | Coverage |
|---|---|---|
| 100–105 | C — Earthworks | Clearing, removal, excavation, embankment, subgrade |
| 200–206 | D — Subbase & Base Course | Aggregate, crushed, stabilized base courses |
| 300–311 | E — Surface Course | Gravel, bituminous, PCCP, ACBC, cold/hot plant mix |
| 400–406 | (in Part H) | Reinforcing steel, structural concrete |
| 500–508 | F — Drainage & Slope Protection | Pipe culverts, RCBC, riprap, slope protection |
| 600+ | H — Miscellaneous | Signs, guardrails, road furniture |
