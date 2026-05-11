# Extraction Notes — DPWH RCCEM Skill

**Source:** `1005352503-DPWH-RCCEM.pdf` (87 MB, 250 pages, scanned)  
**Extraction date:** 2026-05-06  
**Method:** Poppler v25.07.0 pdftoppm at 150 DPI → PNG → Claude vision (claude-sonnet-4-6)  
**Tool:** 4 parallel general-purpose agents, each reading 50-70 pages

---

## Coverage Summary

| File | Pages Read | Items Captured |
|---|---|---|
| 01-general-provisions.md | 1-21 | All definitions, 7 general notes, 3 office procedures, 6 D.O. approval thresholds |
| 00-pay-item-master-index.md | 11-19 | ~200+ pay items, all 5 parts (C, D, E, F, H) |
| 02-earthworks.md | 20-71 | Items 100-105 (52 DUPA sheets) |
| 03-subbase-and-base-course.md | 71-79 | Items 200-206 (9 DUPA sheets) |
| 04-surface-course.md | 80-137 | Items 300-311 (57 DUPA sheets) |
| 05-drainage-and-slope-protection.md | 137-192 | Items 500-508 series (~55 DUPA sheets) |
| 06-structures-and-miscellaneous.md | 192-248 | Items 400-406, 600-622 (~56 DUPA sheets) |
| 07-computation-formulas.md | 248-249 | Appendix C: cycle time formulas, travel speed table |
| 08-appendices-and-conversion.md | 249-250 | Appendix D: labor rates, Appendix E: equipment list |

---

## Known Limitations / Uncertain Items

1. **150 DPI resolution**: Some fine print in table cells may have been misread. For high-stakes cost figures, verify against original PDF.
2. **Handwritten corrections**: The original PDF was modified in 2025 (ModDate: 2025-04-24). Any handwritten or stamped corrections on the scan may not have been captured.
3. **Hourly rates omitted**: Labor and equipment hourly rates are NOT stored in this skill — they change with each DPWH D.O. update. The skill stores crew compositions (how many workers/equipment of what type and for how many hours) but not the monetary rates themselves. Always get current rates from the latest DPWH Labor Rates D.O. and ACEL Guidebook.
4. **Materials unit costs omitted**: Similarly, unit costs for materials are NOT stored — they come from the CMPD which is updated quarterly. The skill stores material quantities/specifications.
5. **Page 15 was upside-down/mirrored** in the scan — the agent reading the summary table may have some entries from that page with reduced confidence.
6. **Derivation chains**: Items marked "See derivations for Item Nos. X to Y" are parent items whose cost is computed from sub-item costs. The sub-items are fully documented.

---

## How to Update This Skill

If a new RCCEM edition is released:
1. Copy the new PDF to the working directory
2. Re-run: `pdftoppm -r 150 -f 1 -l 250 -png [pdf] rccem-pages/page`
3. Re-run the 4 extraction agents with updated page ranges
4. Update the `SKILL.md` source note and this file's extraction date
5. Update `EXTRACTION-NOTES.md` with any new sections or item number changes
