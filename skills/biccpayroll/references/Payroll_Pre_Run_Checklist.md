# Payroll Pre-Run Checklist

**Purpose:** Run these checks BEFORE generating any payroll to catch discrepancies early.
**Updated:** April 2026

---

## Step 0: Gather Inputs

Before anything else, collect these two files:

| Input | Location | Notes |
|-------|----------|-------|
| **Attendance File** | `C:/Users/thiba/BICC/HR Payroll - Documents/Admin Payroll {year}/{date}_Payroll {month} {day} Cutoff/` | Contains TIME LOG, FILED LEAVE, FILED OT, FILED OBT sheets |
| **Payroll Input Template** | Same folder as attendance file | Excel file filled by Tina with: personnel changes, loans, adjustments, cash advances, special allowances |

**From the period dates, compute:**
| Item | How |
|------|-----|
| Period | Start date to end date (e.g., March 16-31, 2026) |
| Cutoff | A (1st-15th) or B (16th-end) |
| Pay Date | 25th for Cutoff A, 10th of next month for Cutoff B |
| Period Days | Count ALL Mon-Sat calendar days in period, **including holidays** |
| Holidays | List with dates, types (Regular/Special), from government proclamations |

---

## Step 1: Cross-Check Attendance vs Employee Registry

**Goal:** Ensure no employees are missing or appearing unexpectedly.

### 1.1 Read Attendance File Employee List
- Open TIME LOG sheet — read employee names from column B (rows 8+)
- This is the authoritative list of employees with biometric tracking

### 1.2 Compare Against Employee Registry
Load `output/BICC_Employee_Registry.md` and compare:

| Check | Action if Found |
|-------|-----------------|
| Employee in registry but MISSING from TIME LOG | Verify: Are they EXEMPT? (EXEMPT = no attendance.) If not EXEMPT, flag as issue. |
| Employee in TIME LOG but NOT in registry | New hire? Check Payroll Input Template Section 1A. Add to registry. |
| Employee in TIME LOG who is marked "Resigned" in registry | Should have been removed. Confirm with HR. |

### 1.3 Check FILED Sheets
Read FILED LEAVE, FILED OT, and FILED OBT sheets:
- Use word-boundary matching for names (NOT substring — "penas" matches "penasa" as substring)
- Verify every name maps to a known active employee
- Flag any entries for resigned/unknown employees

---

## Step 2: Cross-Check Against 201 Files

**Goal:** Verify employee data matches their employment contracts.

### 2.1 Check 201 Folder
**Location:** `C:/Users/thiba/BICC/HR Payroll - Documents/201 Employee Files Confidential/`

| Check | How |
|-------|-----|
| New employees have a 201 folder | Glob for folder matching their name |
| Employment agreement exists | Look for `*Employment Agreement*` or `*Employment Contract*` file |
| Contract type matches registry | Probationary/Permanent/Project-Based — check latest agreement |
| No active employees in `_Archive` folder | Archived = separated |
| No resigned employees still in active folders | Should be moved to `_Archive` |

### 2.2 Contract Expiry Check
For probationary and project-based employees:
- Check if contract end date falls within or before this payroll period
- If expired, flag for HR — need renewal or separation

### 2.3 Status Changes (from Payroll Input Template)
Check Section 1D of the Payroll Input Template for:
- Probationary → Regular transitions (affects SSS/HDMF/PHIC enrollment)
- Benefits enrollment changes
- Update Employee Registry accordingly

---

## Step 3: Validate Period Details

### 3.1 Count Period Days
**Rule: Period Days = ALL Mon-Sat calendar days, INCLUDING holidays.**

```python
from datetime import date, timedelta
period_days = 0
d = start_date
while d <= end_date:
    if d.weekday() < 6:  # Mon=0 through Sat=5
        period_days += 1
    d += timedelta(days=1)
```

Holidays are NOT subtracted. They are working days where employees may or may not be present.

### 3.2 Identify Holidays
- Check government proclamations for regular and special non-working holidays
- For each holiday, note:
  - Date and type (Regular or Special)
  - Which MONTHLY/DAILY employees worked (check TIME LOG for IN values on that date)
  - FIXED/EXEMPT employees get no holiday premium regardless

### 3.3 Determine Cutoff Type
| Period | Cutoff | D4 Value | SSS/HDMF/PHIC/Tax | Attendance Incentive | Allowance |
|--------|--------|----------|--------------------|-----------------------|-----------|
| 1st-15th | A | `"01-15"` | All = 0 | 0 | Allow_1st |
| 16th-end | B | `"16-31"` | Deducted | Eligible (1,000) | Allow_2nd |

---

## Step 4: Read Attendance Data (from Raw Sheets)

**IMPORTANT: Do NOT use the ATTENDANCE SUMMARY sheet.** Its formulas are broken. Compute everything from raw sheets.

### 4.1 Days Worked (from TIME LOG)
For each employee, count days with a non-empty IN value.

The TIME LOG has IN/OUT column pairs starting at column 5:
- Columns 5-6 = day 1 (IN/OUT)
- Columns 7-8 = day 2 (IN/OUT)
- etc.

Row 5 shows day numbers, Row 6 shows day-of-week. Match the period dates to find the correct column range for 2nd half (16-31) or 1st half (1-15).

**OBT = attendance.** OBT is treated as equivalent to being present at work. Merge biometric + OBT per day:
- `effective_in = min(biometric_in, obt_in)` — earliest arrival counts
- `effective_out = max(biometric_out, obt_out)` — latest departure counts
- If OBT-only (no biometric): employee is present, but no late/undertime computed (field work)
- If biometric exists: late/undertime computed from effective (merged) times

**FILED OBT structure:** Each row can have up to 4 IN/OUT pairs:
- Columns D-E = 1st OBT (IN/OUT)
- Columns F-G = 2nd OBT (IN/OUT)
- Columns H-I = 3rd OBT (IN/OUT)
- Columns J-K = 4th OBT (IN/OUT)
- **Must read ALL pairs** — afternoon/evening OBTs are commonly in the 2nd pair

### 4.2 Late & Undertime (from TIME LOG + FILED OBT)
For each day, merge biometric and OBT times, then compute:
```
effective_in = min(biometric_in, all_obt_ins)
effective_out = max(biometric_out, all_obt_outs)

if effective_in > 0.333333 (8:00 AM):
    late_minutes += (effective_in - 0.333333) * 24 * 60

if effective_out < 0.708333 (5:00 PM) and biometric exists:
    undertime_minutes += (0.708333 - effective_out) * 24 * 60

tardy = late_minutes + undertime_minutes
```

**Special holiday excusal:** Late AND undertime on SPECIAL holidays are excused (company closed, voluntary attendance). Regular holiday late still counts.

### 4.3 Leave Data (from FILED LEAVE)
Filter by date range. For each entry:
- Column F = WITH PAY flag (1 = LWP)
- Column G = LWOP flag (1 = LWOP)
- These are FLAGS, not counts — count working days (Mon-Sat) in Date From → Date To range
- Only FULLY APPROVED entries count

### 4.4 OT Hours (from FILED OT)
Filter by date range and approval status. For each entry:
- Column J (10) = Total Hours Filed
- Only count rows with "FULLY APPROVED"
- Sum per employee

### 4.5 AWOL Detection
```
AWOL = Period_Days - Days_Worked - LWP - LWOP
if AWOL < 0: AWOL = 0
```

Also cross-check: employees with 0 filed leave but fewer days than expected may have unfiled absences.

### 4.6 Holiday Workers (from TIME LOG)
For each holiday date, check which employees have IN values. Those employees worked on the holiday.
- MONTHLY/DAILY: Record in AJ (regular) or AL (special) for premium calculation
- FIXED/EXEMPT: No premium, skip

### 4.7 Name Matching Rules
FILED sheets use full names; payroll uses surname-first format.

```python
surname = payroll_name.split(",")[0].strip().lower()
filed_words = filed_name.lower().split()
match = surname in filed_words  # word boundary, NOT substring
```

---

## Step 5: Process Payroll Input Template

Read the Payroll Input Template filled by Tina:

| Section | What to Extract | Where it Goes |
|---------|----------------|---------------|
| 1A: New Hires | Name, position, pay type, rate, start date, allowance, bank | Add to payroll + Employee Registry |
| 1B: Resignations | Name, last working day | Remove from payroll (zero out) |
| 1C: Rate Changes | Name, old/new rate, effective date | Update H column + EMPLOYEE INFO |
| 1D: Status Changes | Benefits enrollment, contract changes | Update SSS/HDMF/PHIC flags |
| 2: Loan Updates | SSS/HDMF loan amounts | Update Z (SSS Loans) and AB (HDMF Loans) |
| 3: Adjustments | Prior-period corrections | Put in W (Adjustments) column |
| 4: Cash Advances | Current deductions | Put in AF (Cash Advances) column |
| 5: Special Allowances | One-time amounts | Put in W (Adjustments) column |

---

## Step 6: Validate Before Generation

### 6.1 Pre-Generation Summary
Print/review the following:

```
PERIOD: {month} {day range}, {year}
CUTOFF: {A or B}
PAY DATE: {date}
PERIOD DAYS: {count} (all Mon-Sat, including holidays)
HOLIDAYS: {list with types}

ACTIVE EMPLOYEES: {count}
  EXEMPT: {count} (no attendance)
  MONTHLY: {count}
  DAILY: {count}
  FIXED: {count}

NEW HIRES: {list with start dates and rates}
RESIGNATIONS: {list}
RATE CHANGES: {list}

ATTENDANCE DATA:
  {employee}: Days={d}, Late={l}h, LWP={lwp}, LWOP={lwop}, AWOL={awol}, OT={ot}h
  ...

LOANS: {employee}: SSS={z}, HDMF={ab}
ADJUSTMENTS: {employee}: W={amount} ({reason})
```

### 6.2 Sanity Checks
- [ ] Total employees in TIME LOG = total non-EXEMPT active employees
- [ ] No resigned employee appears in TIME LOG
- [ ] All new hires (who started in the period) appear in TIME LOG
- [ ] Late hours computed from TIME LOG, cross-checked with reviewer
- [ ] Holiday workers identified for MONTHLY/DAILY premium columns
- [ ] Loan deductions populated (Cutoff B only, unless specified)
- [ ] Period days verified manually against calendar

---

## Step 7: Post-Generation Verification (AUTOMATED)

After generating the payroll file, run ALL of these checks **programmatically via Excel COM** (not just visual review). Each check should print PASS/FAIL. Any FAIL must be investigated before release.

### 7.1 Formula Integrity
- Scan all Payroll cells (rows 9 to last data row, cols C-AS) for #REF!/#N/A/#VALUE!/#NAME?/#DIV/0!
- Check for Excel error codes (large negative numbers < -2000000000)
- Verify cross-sheet references point to correct employees

### 7.2 Per-Employee Formula Balance (CRITICAL — must be automated)
For EVERY active employee, verify these equations hold (tolerance ±0.50):

```
# Basic Pay
MONTHLY/FIXED/EXEMPT: L (12) = H (8) / 2
DAILY:                L (12) = J (10) × I (9)

# Days cross-check (DAILY only)
DAILY: I (9) must = days_present + holiday_credit + LWP  (from raw attendance)
       If I < expected → DAILY employee with LWP not being paid for leave

# Rate consistency
J (10) = H (8) × 12 / 313
K (11) = J (10) / 8
M (13) = K (11) × 1.25  (MONTHLY/DAILY only; FIXED/EXEMPT = 0 or empty)

# Deductions
R (18) ≈ K (11) × P (16)           (late/undertime deduction)
S (19) = J (10) × Q (17)           (absence deduction)
If Q > 0 and S = 0 → ERROR
If P > 0 and R = 0 → ERROR

# OT
O (15) = M (13) × N (14)           (MONTHLY/DAILY only)
FIXED/EXEMPT: O must = 0

# Holiday
T (20) = AK (37) + AM (39)  or  T = AN (40)

# Gross
X (24) = L + O + T + U + V + W - R - S

# Deductions total
AG (33) = Y + Z + AA + AB + AC + AD + AE + AF

# Net
AH (34) = X (24) - AG (33)
```

### 7.3 Cutoff-Specific Checks
**Cutoff A:** Columns Y, AA, AC, AD (SSS/HDMF/PHIC/Tax) must ALL be 0. U (Incentive) must be 0.
**Cutoff B:** SSS/HDMF/PHIC should be > 0 for enrolled employees. Verify against EMPLOYEE INFO enrollment.

### 7.4 Pay Type Checks
- **DAILY employees**: L = J × I (automated in 7.2) AND I includes LWP days
- **MONTHLY/FIXED**: L = H / 2 (automated in 7.2)
- **EXEMPT employees**: R=0, S=0, no attendance-based deductions
- **FIXED employees**: O=0 (no OT pay), T=0 (no holiday premium)
- **New hires**: AWOL correctly reflects days before start date

### 7.5 Attendance Incentive Verification (Cutoff B only)
Three conditions must ALL be met for the whole month (both cutoff periods) to earn ₱1,000:
1. No single late instance > 15 minutes
2. No more than 3 late instances in the month (even 1 second late counts)
3. No AWOL/absence — only approved leave (LWP, LWOP, sick with doctor's note) is acceptable

For each employee with U=1000:
- Verify no single late > 15 minutes (check per-day late data from both cutoffs)
- Verify total late count ≤ 3 instances for the month
- Verify AWOL = 0 for both cutoffs (K=0 in both ATTENDANCE periods)
- If any condition fails and U=1000 → FAIL: ineligible employee getting incentive
For each employee with U=0 who is in the eligible list:
- Verify at least one condition failed (confirming they are correctly excluded)
Note: New hires mid-period are NOT eligible in their first month (cannot meet full-month requirement).

### 7.6 V Column Checks
- Cutoff A: V = Allow_1st + Daily_Allowance × (I - Q). NO Allow_2nd.
- Cutoff B: V = Allow_2nd + Daily_Allowance × (I - Q). NO Allow_1st.
- New hires: V prorated by calendar days of month

### 7.7 Bank Details vs Payroll (CRITICAL)
```
Bank Details total (col D sum) must = Payroll Grand Total AH (Net Pay)
Bank Details employee count must = Payroll active employee count
Each Bank Details employee net must match their Payroll AH
```
**Any mismatch here means employees will receive wrong bank transfers.**

### 7.8 Grand Total Checks
- Grand Total SUBTOTAL ranges include ALL employee rows (first to last data row)
- Grand Total ranges end BEFORE the Grand Total row itself
- Independently sum each column and compare to Grand Total row values

### 7.9 Resigned Employee Checks
- Zeroed employees (left before period): ALL columns L through AH = 0
- Partial-period employees: days + abs = period_days
- **No holiday credit for holidays AFTER their last working day**

### 7.10 Cross-Sheet Consistency
- Payroll I (days) matches ATTENDANCE G for each employee (via VLOOKUP or direct row match)
- Payroll name in col C matches EMPLOYEE INFO name in col A for corresponding employee number
- REM enrollment status matches EMPLOYEE INFO contract status cascade

### 7.11 Reasonableness Checks
- No negative Net Pay for any employee
- No Net Pay > Gross Pay
- Basic Pay > 0 for all active employees
- 13th month (AP) ≈ Gross (X) / 12 (tolerance ±15% for employees with OT/adjustments)
- No employee with Days > Period Days

---

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Using ATTENDANCE SUMMARY | NEVER use it. Compute from raw sheets (TIME LOG, FILED). |
| Excluding holidays from period days | Period days = ALL Mon-Sat days INCLUDING holidays. |
| DAILY employee LWP not counted in days | ATTENDANCE G for DAILY must = days_present + holiday_credit + LWP. Otherwise L underpays. |
| Allow_1st paid in both cutoffs | Allow_1st = Cutoff A only. Allow_2nd = Cutoff B only. |
| Prorated incentives in EMPLOYEE INFO | NEVER put period-specific values in EMPLOYEE INFO. Put directly in Payroll V column. |
| openpyxl insert_rows breaking formulas | After ANY row operation, audit ALL self-references. Use Excel COM for deletions. |
| Grand Total range too short/long | Always verify SUBTOTAL ranges after row changes. Must end BEFORE the Grand Total row. |
| Substring name matching | "penas" matches "penasa". Use word-boundary matching. ñ → normalize to n. |
| Zeroing after inserting rows | Always zero/remove resigned employees BEFORE inserting new rows. |
| Bank Details #REF! after Payroll row deletion | Bank formulas reference Payroll rows directly. Must rebuild after deletions. |
| Bank Details total not matching Payroll Net | ALWAYS verify Bank Details total = Payroll Grand Total AH after generation. |
| New hire AWOL not set | Record days before start date as AWOL for MONTHLY/FIXED new hires. |
| Resigned employee holiday credit | NO holiday credit for holidays after last working day. |
| Incentive for ineligible employee | Verify ALL 3 conditions: no single late >15min, ≤3 late instances/month, no AWOL. |
