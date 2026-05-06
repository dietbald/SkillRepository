---
name: biccpayroll
description: Generate BICC (Babasmas Industrial Construction Corp) semi-monthly payroll. Use when the user asks to "generate payroll", "make payroll for [period]", "process the [date] cutoff", "create the May 10 / Apr 25 / etc. payroll", or anything involving BICC's Admin Payroll workbook. Handles attendance computation from raw biometric+OBT+leave+OT sheets, generates the password-protected payroll xlsx, and runs an 11-check verification. Period-specific. Windows-only (Excel COM via win32com). Do NOT activate for non-BICC payroll, generic HR questions, or anything outside the `C:/Users/thiba/BICC/HR Payroll - Documents/` workbook structure.
---

# BICC Payroll

Generate a semi-monthly payroll for BICC (cutoff A = 1st-15th paid on 25th, cutoff B = 16th-end paid on 10th of next month).

## When to use

Triggers:
- "Generate payroll for [period]"
- "Process the [date] cutoff"
- "Make the May 10 / Apr 25 / Mar 25 payroll"
- "We need a new payroll for April 16-30"
- Anything pointing at `C:/Users/thiba/BICC/HR Payroll - Documents/Admin Payroll {year}/`

## When NOT to use

- Generic HR or payroll questions unrelated to BICC's specific workbook
- Non-Windows environments (this depends on `win32com` for Excel COM)
- Questions about Philippine labor law in general (only the specific BICC rules encoded here)

## Setup (one-time per machine)

```bash
# Python deps
pip install openpyxl pywin32 msoffcrypto-tool
```

The skill assumes the BICC workbook is at:
```
C:/Users/thiba/BICC/HR Payroll - Documents/Admin Payroll {year}/{date}_Payroll {month} {day} Cutoff/
```
Password for all encrypted xlsx: `Monthly$24`.

Working directory for intermediate files: `C:/Users/thiba/Documents/Payroll/work/`.

## Workflow

### Step 0 — Pre-flight (5 min)

Verify the period folder exists and contains:
- `BICC_Admin Attendance Sheet - {dates}.xlsx` (the raw biometric workbook)
- `Payroll_Input_Template/Payroll_Input_{start}_to_{end}.xlsx` filled in by Tina
- Supporting PDFs (OBT, Overtime, Leave, Logbook) — informational only

Read Tina's Payroll Input file and write down:
- **Section 1A New hires**: name, position, pay type, start date, allowance, bank
- **Section 1B Resignations**: name + last working day (LWD)
- **Section 1C Rate changes**
- **Section 1D Status changes** (probationary→permanent, bank updates)
- **Section 2 Loan updates** (SSS/HDMF — note: "Action: New" doesn't necessarily mean it's truly new; could be a confirmation of an existing one)
- **Section 3 Adjustments** (W column corrections)
- **Section 4 Cash advances** (AF column)
- **Section 5 Special allowances** (W column one-time)

### Step 1 — Surface ambiguities BEFORE writing code

Read EMPLOYEE INFO from the prior decrypted payroll for every employee in Tina's input:
- Allow_1st (col V=22), Allow_2nd (col W=23), Monthly Rate (col S=19) — ensure her adjustment doesn't double-count an EI change made in a prior generation
- Bank (col M=13)
- Status (col J=10)

Common gotchas to ask the user about:
- Section 3 adjustments that conflict with prior EI changes (e.g., Selidio +2,880 in May 10 was already absorbed into Allow_2nd from apr25 generation → double-count)
- Mid-period resignations: V allowance proration value (calendar days of month / total days in month, NOT work days)
- "Action: New" loans with old start dates — clarify retroactive vs going-forward
- Status changes effective mid-prior-period — clarify whether to catch up or start clean

### Step 2 — Compute attendance

```bash
python lib/compute_attendance.py \
    --attendance "C:/.../BICC_Admin Attendance Sheet - {dates}.xlsx" \
    --start 2026-04-16 --end 2026-04-30 \
    --output ../work/attendance_{paydate}_results.json \
    [--holidays 2026-04-09:regular,2026-04-04:special] \
    [--lwd "esmeralda=2026-04-25,lapizar=2026-04-25"] \
    [--new-hires "smith=2026-04-20"]
```

Inspect the JSON output. Cross-check against ATTENDANCE SUMMARY for sanity (but DO NOT use ATTENDANCE SUMMARY values — its formulas are broken).

Key rules the script enforces (don't skip):
- **TIME LOG columns**: `in_col = 5 + 2*(d-1)` (full month layout, regardless of cutoff)
- **DAILY: ATTENDANCE L (col 12) = 0** (Q-deduction guard — Tumlos case)
- **FIXED/EXEMPT: OT hours forced to 0** even if FILED OT approved (Peñasa case)
- **`is_daily()` normalizes ñ→n** (Peñas case)
- **OBT "IN--" extension**: OBT IN with no OUT = lower bound for eff_out (Pangantihon case)

### Step 3 — Generate payroll

Copy `lib/generate_payroll_template.py` to `work/generate_payroll_{paydate}.py`.

Edit the "EDIT PER PERIOD" block at top:
- Period dates, holidays, file paths, sheet names
- LWD_RESIGNATIONS, ADJUSTMENTS, CASH_ADVANCES, SSS_LOANS, HDMF_LOANS, BANK_UPDATES
- HOLIDAY_PREMIUM (only MONTHLY/DAILY workers who worked holidays)
- V_OVERRIDES (for mid-period resignations: prorated by calendar days / month total)

Run the script. It will:
1. Read template (prior decrypted payroll) state via Excel COM
2. Copy + rename payroll sheet, fix cross-sheet refs
3. Update ATTENDANCE sheet (G-M for current, P-V for incentive)
4. Update EMPLOYEE INFO (bank changes)
5. Update Payroll sheet (W adjustments, Z/AB loans, AF cash advances, AJ/AL holiday premium, V overrides)
6. Update Bank Details (zero resigned, fix TOTAL formula range)
7. Save decrypted, encrypt with `msoffcrypto`, copy to output folder

### Step 4 — Verify (FULL checklist)

```bash
python lib/verify_payroll.py \
    --payroll work/current_payroll_{paydate}_dec.xlsx \
    --sheet "Payroll {Month} {Day}" \
    --attendance-json work/attendance_{paydate}_results.json \
    --prior-json work/attendance_{prior}_results.json
```

This runs all 11 checks (read-only, MD5 verifies file unchanged):
- 7.1 Formula integrity (#REF!/#N/A scan)
- 7.2 Per-employee balance (X = L+O+T+U+V+W-R-S; AG sum; AH = X-AG; DAILY L=J×I; FIXED L=H/2; R=K×P; S=J×Q)
- 7.3 Cutoff-specific (A: Y/AA/AC/AD/U all 0; B: deductions for enrolled permanent)
- 7.4 Pay type (FIXED O=0,T=0; EXEMPT R=0,S=0)
- 7.5 Incentive (combine cur+prior late_instances; verify ≤15min, ≤3 lates, no AWOL)
- 7.7 Bank Details = Grand Total
- 7.8 GT independent recalc
- 7.9 Resigned zeroed
- 7.10 Cross-sheet (Payroll I = ATTENDANCE G)
- 7.11 Reasonableness (no negative net, days ≤ period_days)
- 9.5b JSON ↔ Payroll I cross-check (catches encoding bugs)
- 9.5c DAILY Q=0 guard
- 9.7 Bank account validation

If any FAIL: investigate, fix the source (compute_attendance or generate config), re-run from that step. Do NOT declare success on FAIL.

### Step 5 — Compare to prior period (optional but recommended)

For Cutoff B → compare to previous Cutoff B; for Cutoff A → previous Cutoff A. Surface big movers and explain each.

### Step 6 — Report to user

- Grand Total Net
- Bank Details total (must match)
- Per-employee summary if asked
- Any FAILs that couldn't be resolved
- Notable absences/anomalies (e.g. heavy AWOL employees worth flagging to HR — but don't assume resignation without confirmation)

## Pay types (BICC roster)

- **MONTHLY** (6): Cabunagan, Macoco, Modesto, Tiquison, Owa, Gatchon — get OT pay, can earn incentive
- **DAILY** (5): Futotana, Penas, Tolentino, Ropero, Tumlos — paid per day worked, get OT, no work no pay on special holidays
- **FIXED** (16): Obillos, Maquiling, Juayno, Lapizar, Penasa, Selidio, Lood, Pajar, Secugal, Espanola, Mosquera, Pangantihon, Esmeralda, Gabiano, Marmolejo, Prologo — fixed semi-monthly pay, **NO OT pay**, no holiday premium
- **EXEMPT** (3): Judicq (Director), Imbag (Consultant), Habaradas — no attendance tracking, no deductions, fixed pay

## Critical rules

| Rule | Why |
|---|---|
| Period Days = ALL Mon-Sat including holidays | Holidays don't subtract; they're working days that may or may not be worked |
| Cutoff A: SSS/HDMF/PHIC/Tax/Incentive all = 0 | Standard semi-monthly split |
| Cutoff B: V uses Allow_2nd; Cutoff A: Allow_1st | But formula always adds Allow_1st (col 20 in C:Y range), so Allow_1st should be 0 for everyone except special cases |
| DAILY ATTENDANCE L = 0 | Else S = J×Q double-deducts (already excluded from I) |
| FIXED no OT pay | Even if FILED OT approved, force ATTENDANCE M = 0 |
| Mid-period resignation V proration | calendar days of month / total month days (e.g. 25/30 × 3000 = 2500) |
| Holidays excuse late + UT | All holidays (regular and special); confirmed Apr 2026 |
| OBT = attendance | Merge bio+OBT per day; eff_in = min, eff_out = max |
| ñ → n normalization | For surname matching (Peñas, Peñasa) |
| TIME LOG covers full month | Always `5 + 2*(d-1)`, regardless of cutoff |

## Key files in this skill

```
biccpayroll/
├── SKILL.md                          # This file
├── lib/
│   ├── biccpayroll_config.py         # Stable employee rosters + helpers
│   ├── compute_attendance.py         # Parameterized attendance computer (CLI)
│   ├── generate_payroll_template.py  # COPY + EDIT per period
│   └── verify_payroll.py             # Parameterized full-checklist verifier (CLI)
├── references/
│   ├── BICC_Pay_Types_and_Rules.md   # Detailed pay type rules
│   ├── Payroll_Pre_Run_Checklist.md  # Step 7 checklist source-of-truth
│   ├── BICC_Employee_Registry.md     # Current employee list
│   └── payroll_logic_spec.md         # Full formula documentation
└── templates/
    └── Payroll_Input_Template.xlsx   # Empty template Tina fills each period
```

## Lessons learned (Apr-May 2026)

When something feels off, check these first:
1. **TIME LOG column formula** is `5 + 2*(d-1)`, not `5 + 2*(d-START.day)` — full month layout.
2. **DAILY Q=0** guard prevents double-deduction (Tumlos case, Apr 1-15).
3. **ñ→n normalization** in is_daily() is critical (Peñas case, Apr 1-15).
4. **FIXED employees get no OT pay** even on filed approved OT (Peñasa case, Apr 16-30).
5. **Mid-period resignation V** prorates by calendar days of month, not work days (Lapizar case, Apr 16-30).
6. **Tina's adjustments** may double-count if EI was already updated (Selidio case, Apr 16-30).
7. **Verification must run all 11 checks** in one shot — don't ship a partial Step 9.

## References

- See `references/Payroll_Pre_Run_Checklist.md` for the authoritative Step 7 checklist
- See `references/BICC_Pay_Types_and_Rules.md` for detailed pay-type behavior
- See `references/payroll_logic_spec.md` for all Excel formulas
- The user's auto-memory at `~/.claude/projects/.../memory/MEMORY.md` has additional lessons that update over time
