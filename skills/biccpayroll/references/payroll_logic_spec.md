# Payroll Logic Specification
## BICC Admin Payroll — Reverse-Engineered from Jan 2026, Updated April 2026

---

## 1. Cycle Overview

| Item | Cutoff A (1st–15th) | Cutoff B (16th–end) |
|------|---------------------|---------------------|
| Period | 1st – 15th of month | 16th – last day |
| Pay Date | 25th of the month | 10th of next month |
| D4 Flag | `"01-15"` | `"16-31"` or `"16-30"` |
| SSS/HDMF/PHIC | **0** (not deducted) | Deducted |
| Tax Withheld | **0** | Deducted |
| Attendance Incentive | **0** | Eligible employees get ₱1,000 |
| 2nd-half Allowance (col 23) | **Not included** in V | Included in V |

---

## 2. Sheet Map (12 sheets, Cutoff A)

| # | Sheet Name | Visibility | Purpose |
|---|-----------|------------|---------|
| 1 | EMPLOYEE INFO | Visible | Master employee data (168 rows, 102 cols) |
| 2 | REM | Visible | Remittance/premium computation (SSS, HDMF, PHIC) |
| 3 | WTC | Visible | Withholding tax computation |
| 4 | ATTENDANCE | Visible | Attendance summary copied from external file |
| 5 | Payroll [Month] [Day] | Visible | **Main payroll sheet** (45 cols, header row 8) |
| 6 | Payslip | Visible | Individual payslip template |
| 7 | SSS Table 2025 | **Hidden** | SSS contribution lookup table |
| 8 | Bank Details | Visible | Bank account listing for payroll disbursement |
| 9 | 1601C EFPS | Visible | BIR 1601C form data |
| 10 | Notes | Visible | Tax brackets, policies, notes |
| 11 | DV Attachment | Visible | Disbursement voucher attachment |
| 12 | Calculator | **Hidden** | Utility calculator |

**Cutoff B only:** May include an additional `Schedule 1 (Adj)` sheet.

---

## 3. Data Dictionary — Main Payroll Sheet

Header row: **8**. Data rows: **9 onwards**. Grand Total uses `SUBTOTAL(9,...)`.

| Col | Letter | Header | Source | Formula / Logic |
|-----|--------|--------|--------|-----------------|
| 2 | B | No. | Auto | Row 9: `=1`, subsequent: `=B{prev}+1` |
| 3 | C | Employee's Name | ATTENDANCE | `=ATTENDANCE!D{row}` (hardcoded row reference per employee) |
| 4 | D | Staff I.D No. | — | Empty (not populated in Cutoff A) |
| 5 | E | Class | WTC | `=VLOOKUP(C{r},WTC!C:T,18,FALSE)` → TAXABLE / NON TAXABLE / MWE |
| 6 | F | Position | EMPLOYEE INFO | `=VLOOKUP(C{r},'EMPLOYEE INFO'!C:F,4,FALSE)` |
| 7 | G | Employee Account No. | EMPLOYEE INFO | `=VLOOKUP(C{r},'EMPLOYEE INFO'!C:M,11,FALSE)` |
| 8 | H | Monthly Basic Rate | ATTENDANCE | `=VLOOKUP(C{r},ATTENDANCE!D:E,2,FALSE)` |
| 9 | I | No. of Days Work | ATTENDANCE | `=VLOOKUP(C{r},ATTENDANCE!D:M,4,FALSE)` |
| 10 | J | Rate / Day | Calculated | `=IF(sched="Mon - Fri", H*12/261, H*12/313)` |
| 11 | K | Rate / Hr | Calculated | `=ROUND(J/8, 2)` |
| 12 | L | Basic Pay | Calculated | See §4.1 |
| 13 | M | Rate / Hr (O.T) | Calculated | `=ROUND((J/8)*125%, 2)` |
| 14 | N | Hrs. of O.T | ATTENDANCE | `=VLOOKUP(C{r},ATTENDANCE!D:M,10,FALSE)` |
| 15 | O | Overtime Pay | Calculated | `=M*N` |
| 16 | P | Hrs. of Late/Undertime | ATTENDANCE | `=VLOOKUP(C{r},ATTENDANCE!D:M,5,FALSE)` |
| 17 | Q | No. of Absences | ATTENDANCE | `=VLOOKUP(C{r},ATTENDANCE!D:M,9,FALSE)` |
| 18 | R | Late / Undertime | Calculated | `=P*K` |
| 19 | S | Absences | Calculated | `=Q*J` |
| 20 | T | Holiday Pay | Calculated | `=AN{r}` (references Total Holiday) |
| 21 | U | Attendance Incentive | Conditional | `=IF(ATTENDANCE!$D$4="01-15", 0, VLOOKUP(C{r},ATTENDANCE!D:V,19,FALSE))` |
| 22 | V | Other Incentives | Conditional | See §4.3 |
| 23 | W | Adjustments | Manual | Usually 0; occasionally `=ROUND(J*2,2)+1000` for specific employees |
| 24 | X | Gross Pay | Calculated | `=ROUND((L+O+T+U+V+W)-(R+S), 0)` |
| 25 | Y | S.S.S Premiums (EE) | Conditional | `=IF(D4<>"01-15", VLOOKUP(C,REM!C:I,7,FALSE), 0)` |
| 26 | Z | S.S.S Loans (EE) | Manual | Hardcoded (usually 0) |
| 27 | AA | H.D.M.F Premiums (EE) | Conditional | `=IF(D4<>"01-15", VLOOKUP(C,REM!C:O,13,FALSE), 0)` |
| 28 | AB | H.D.M.F Loans (EE) | Manual | Hardcoded (usually 0) |
| 29 | AC | P.H.I.C Premium (EE) | Conditional | `=IF(D4<>"01-15", VLOOKUP(C,REM!C:R,16,FALSE), 0)` |
| 30 | AD | Tax Withheld* | Conditional | `=IFERROR(IF(D4="01-15", 0, VLOOKUP(C,WTC!C:S,17,FALSE)), 0)` |
| 31 | AE | Charges | Manual | Hardcoded (usually 0) |
| 32 | AF | Cash Advances | Manual | Hardcoded (usually 0, occasional amounts) |
| 33 | AG | Total Deductions | Calculated | `=SUM(Y:AF)` |
| 34 | AH | Net Pay | Calculated | `=ROUND(X-AG, 0)` |
| 36 | AJ | Duty (Regular) | Manual | Number of regular holiday days (usually 0) |
| 37 | AK | Regular 100% | Calculated | `=AJ*J*100%` |
| 38 | AL | Duty (Special) | Manual | Number of special holiday days (usually 0) |
| 39 | AM | Special 30% | Calculated | `=AL*J*30%` |
| 40 | AN | Total Holiday | Calculated | `=ROUND(AK+AM, 2)` |
| 42 | AP | 13th Month Pay | Calculated | `=(L-S)/12` |

---

## 4. Formula Details

### 4.1 Basic Pay (Column L)

**Regular employees (TAXABLE, NON TAXABLE):**
```
=IF(sched="Mon - Fri",
    ROUND(J * 261 / 12, 0) / 2,
    ROUND(J * 313 / 12, 0) / 2)
```
This effectively produces `Monthly Rate / 2` (half-month pay). The intermediate calculation via Rate/Day ensures consistency.

**MWE employees:**
```
=J * I    (Rate/Day × Days Worked)
```
MWE/DAILY employees are paid per day worked, not a fixed semi-monthly salary.

> **CRITICAL (Apr 2026):** For DAILY employees, column I (Days Worked, from ATTENDANCE G) **must include LWP (Leave With Pay) days**. Since L = Rate/Day × Days, if LWP is excluded from Days, the employee is not paid for their approved paid leave. Set ATTENDANCE G = `days_present + holiday_credit + LWP` for DAILY employees. For MONTHLY/FIXED, L = Monthly/2 regardless, so this doesn't affect their basic pay.

**Manually-entered employees (rows 38-39 in Jan):**
```
=H * I    (same per-day calculation, using H for daily rate)
```

### 4.2 Rate / Day (Column J)

```
=IF(VLOOKUP(C,'EMPLOYEE INFO'!C:T,18,FALSE) = "Mon - Fri",
    H * 12 / 261,
    H * 12 / 313)
```
- **261** = Mon-Fri working days per year (365 - 52 weekends × 2)
- **313** = Mon-Sat working days per year (365 - 52 Sundays)

### 4.3 Other Incentives (Column V)

**CORRECTED formula** (April 2026 — fixes double-paying of 1st-half allowance):

```
Cutoff A: V = Allowance_1st_half + (Daily_Allowance × (I - Q))
Cutoff B: V = Allowance_2nd_half + (Daily_Allowance × (I - Q))
```

> **BUG FOUND (Apr 2026):** The original Excel formula added `Allowance_1st_half` (EMPLOYEE INFO col 22, offset 20) unconditionally to BOTH cutoffs. This caused Selidio's V to be 10,380 in Cutoff B instead of 7,500. The 1st-half allowance was already paid in Cutoff A — paying it again in Cutoff B is double-paying. **Allow_1st is for Cutoff A only; Allow_2nd is for Cutoff B only.**

**VLOOKUP offset mapping (from EMPLOYEE INFO column C):**
| Offset | EMPLOYEE INFO Col | Header | Description |
|--------|-------------------|--------|-------------|
| 20 | 22 | Allowance (1st half) | Flat amount, **Cutoff A only** |
| 21 | 23 | Allowance (2nd half) | Flat amount, **Cutoff B only** |
| 23 | 25 | Daily Allowance | Per-day amount × (days worked − absences) |

**Cutoff A behavior:** `Allowance_1st_half + Daily_Allowance × (I-Q)`
**Cutoff B behavior:** `Allowance_2nd_half + Daily_Allowance × (I-Q)`

### 4.4 Attendance Incentive (Column U)

- Cutoff A: Always **0**
- Cutoff B: `=VLOOKUP(C,ATTENDANCE!D:V,19,FALSE)`
  - ₱1,000 for eligible employees who comply with ALL three conditions for the whole month:
    1. No single late >15 minutes (any one instance disqualifies)
    2. No more than 3 late instances in the month (even 1 second late counts)
    3. No AWOL/absence — only approved leave (LWP, LWOP, sick leave with doctor's note) is acceptable
  - Excluded: Judicq, Imbag, Habaradas (EXEMPT — not in ATTENDANCE)

### 4.5 Gross Pay (Column X)
```
=ROUND((L + O + T + U + V + W) - (R + S), 0)
```
Components: Basic Pay + OT Pay + Holiday Pay + Attendance Incentive + Other Incentives + Adjustments − Late Deduction − Absence Deduction

### 4.6 Total Deductions (Column AG)
```
=SUM(Y:AF)
```
= SSS_EE + SSS_Loans + HDMF_EE + HDMF_Loans + PHIC_EE + Tax + Charges + Cash_Advances

### 4.7 Net Pay (Column AH)
```
=ROUND(X - AG, 0)
```

### 4.8 13th Month Pay (Column AP)
```
=(L - S) / 12
```
Monthly accrual = (Basic Pay − Absence Deduction) / 12

---

## 5. ATTENDANCE Sheet Structure

| Row | Content |
|-----|---------|
| 4 | Period info: C4=Month, D4=Period ("01-15" or "16-31"), E4=Year |
| 5 | Working days: E4=days for Mon-Sat, E5=days for Mon-Fri |
| 8 | Header row |
| 9+ | Employee data |

**Key columns in payroll ATTENDANCE sheet:**
| ATTENDANCE Col | Header | Data Source |
|----------------|--------|-------------|
| B | Employee No. | Employee Ref from attendance file |
| C | Employee | Full name from attendance file |
| D | Name on Payroll | Surname-first format |
| E | Monthly Rate | From EMPLOYEE INFO |
| G | No. of Days Work | **Computed from TIME LOG** (see §5A) |
| H | Late/Undertime (Hours) | **Computed from TIME LOG** (see §5A) |
| I | Leave with Pay | **From FILED LEAVE** (see §5A) |
| J | LWOP | **From FILED LEAVE** (see §5A) |
| K | AWOL | **Computed: Period Days - G - I - J** |
| L | Total Absences | `=J+K` |
| M | OT Hours | **From FILED OT** (see §5A) |

> **IMPORTANT (Apr 2026):** The ATTENDANCE SUMMARY sheet in the external attendance file has broken formulas — it shows wrong day counts (15 instead of 14), error codes (-2146826273) for new hires, and unreliable late/OT values. **Do NOT use ATTENDANCE SUMMARY.** Instead, compute all values directly from the raw sheets: TIME LOG, FILED LEAVE, FILED OT, FILED OBT.

---

## 5A. Raw Sheet Computation Logic

**Data sources** (all from the external attendance xlsx file):

| Sheet | Purpose | Key Columns |
|-------|---------|-------------|
| TIME LOG | Biometric clock-in/out times | Col A=Ref, B=Name, then IN/OUT column pairs per day |
| FILED LEAVE | Approved leave entries | A=Name, C=Date From, D=Date To, F=WITH PAY, G=LWOP |
| FILED OT | Approved overtime filings | A=Name, C=Date Covered, E=Approval, J=Total Hours Filed |
| FILED OBT | Official Business Trip entries | A=Name, B=Date Covered, C=Approval |

### 5A.1 Period Day Count

**Rule: Count ALL Monday-to-Saturday calendar days in the period, INCLUDING holidays.**

Holidays are still calendar working days — employees are either present, on leave, or absent. They do NOT reduce the period day count.

```
Period Days = count of Mon-Sat dates in [start_date, end_date]
```

Examples:
- Mar 16-31, 2026: 14 days (includes Mar 18 special holiday, Mar 20 regular holiday)
- Mar 1-15, 2026: 12 days (no holidays)
- Feb 1-15, 2026: 12 days (includes Feb 11 special holiday)

### 5A.2 Days Worked (from TIME LOG)

For each employee, count the number of days where they have a non-empty IN value in the TIME LOG sheet.

```python
days_present = 0
for each day_column_pair in period:
    if cell(employee_row, IN_column) is not None:
        days_present += 1
```

The TIME LOG has column pairs starting at column 5 (E): columns 5-6 = day 1 (IN/OUT), columns 7-8 = day 2, etc. Row 5 shows day numbers (1.0, 2.0, ...), Row 6 shows day-of-week names.

**OBT adjustment:** If an employee has a FILED OBT entry for a day but no TIME LOG entry, that day counts as present.

```
Days Worked (G) = days_present_in_timelog + obt_days_not_in_timelog
```

### 5A.3 Late Hours (from TIME LOG)

Late = minutes past 8:00 AM (0.3333... as Excel time fraction).

```python
late_minutes = 0
for each day the employee has an IN time:
    if IN_time > 0.333333:  # 8:00 AM
        late_minutes += (IN_time - 0.333333) * 24 * 60
late_hours = late_minutes / 60
```

**OBT exception:** If the employee has a FILED OBT for that day, the late may be excused (reviewer decision). OBT does NOT automatically cancel late — it depends on context.

**IMPORTANT:** Late values from the ATTENDANCE SUMMARY sheet are UNRELIABLE. They include undertime, formula errors, and inconsistencies. Always compute from TIME LOG directly, then cross-check with the reviewer's manual count.

### 5A.4 Leave (from FILED LEAVE)

Filter FILED LEAVE entries where Date From falls within the payroll period.

```python
lwp = 0  # Leave With Pay
lwop = 0  # Leave Without Pay
for each row in FILED LEAVE:
    if date_from is within period:
        days = (date_to - date_from).days + 1  # inclusive
        lwp += with_pay_value   # column F
        lwop += lwop_value      # column G
```

**Note:** FILED LEAVE only captures employees who FILE leave. Unfiled absences are AWOL, detected by comparing TIME LOG presence against period days.

### 5A.5 AWOL (computed)

```
AWOL = Period_Days - Days_Worked - LWP - LWOP
if AWOL < 0: AWOL = 0  # can happen with OBT adjustments
```

### 5A.6 Overtime Hours (from FILED OT)

Sum column J (Total Hours Filed) for entries where:
- Employee name matches (word-boundary matching)
- Date Covered falls within the payroll period
- Approval Level = "FULLY APPROVED"

```python
ot_hours = 0
for each row in FILED OT:
    if employee_matches AND date_in_period AND fully_approved:
        ot_hours += total_hours_filed  # column J (10)
```

**CRITICAL:** Only filed AND approved OT counts. Time LOG may show hours beyond 8, but if no OT filing exists, those extra hours are NOT compensated.

### 5A.7 Holiday Workers (from TIME LOG)

For each holiday in the period, check the TIME LOG for employees who have an IN value on that day. These employees worked on the holiday.

```
For MONTHLY/DAILY employees who worked:
  - Regular Holiday: AJ += 1 (pays 100% of daily rate)
  - Special Holiday: AL += 1 (pays 30% of daily rate)
For FIXED/EXEMPT employees: No premium (AJ=0, AL=0 regardless)
```

### 5A.8 Name Matching

FILED sheets use full names ("Mark Anthony Cordero Penas") while payroll uses surname-first ("Penas, Mark Anthony C.").

**Correct matching:** Extract surname from payroll name, split FILED name into words, check if surname appears as a WHOLE WORD:

```python
surname = payroll_name.split(",")[0].strip().lower()
filed_words = filed_name.lower().split()
match = surname in filed_words  # NOT substring — "penas" is substring of "penasa"
```

---

## 6. Payroll C Column (Employee Name) → ATTENDANCE Row Mapping

The C column references are **not sequential** — each employee maps to a specific ATTENDANCE row. This mapping changes when employees are added/removed.

**As of April 2026 (Mar 16-31 payroll, 30 employees):**

| Payroll Row | ATTENDANCE Row | Employee | Pay Type |
|-------------|---------------|----------|----------|
| 9 | — | Judicq, Thibault Pascal T. | EXEMPT |
| 10 | — | Imbag, Mary Grace M. | EXEMPT |
| 11 | 14 | Cabunagan, Neriza C. | MONTHLY |
| 12 | 24 | Lood, Ana Katrina B. | FIXED |
| 13 | 30 | Pangantihon, Loren P. | FIXED |
| 14 | 10 | Futotana, Edwyn F. | DAILY |
| 15 | 25 | Pajar, Aiko Jasmine | FIXED |
| 16 | 18 | Juayno, Marielle B. | FIXED |
| 17 | 19 | Lapizar, Neil Harold H. | FIXED |
| 18 | 26 | Secugal, Arjohn S. | FIXED |
| 19 | 15 | Macoco, Jenny A. | MONTHLY |
| 20 | 29 | Mosquera, Miles B. | FIXED |
| 21 | 11 | Maquiling, John S. | FIXED |
| 22 | 16 | Modesto, Charity Kaye F. | MONTHLY |
| 23 | 31 | Ropero, Elwin P. | DAILY |
| 24 | 9 | Obillos, Tina Joy S. | FIXED |
| 25 | 23 | Owa, Melanie C. | MONTHLY |
| 26 | 32 | Gatchon, Chlea Jeanery C. | MONTHLY |
| 27 | 12 | Penas, Mark Anthony C. | DAILY |
| 28 | 21 | Penasa, Edrose C. | FIXED |
| 29 | 28 | Espanola, Gerald E. | FIXED |
| 30 | 22 | Selidio, Xerxes F. | FIXED |
| 31 | 17 | Tiquison, Ria Marie R. | MONTHLY |
| 32 | 20 | Tolentino, Eduardo B. | DAILY |
| 33 | 37 | Tumlos, Ricky | DAILY |
| 34 | 38 | Esmeralda, Lucille Mhay R. | FIXED |
| 35 | 39 | Gabiano, Marigold A. | FIXED |
| 36 | 40 | Marmolejo, Joven T. | FIXED |
| 37 | 37 | Prologo, Eleazar S. | FIXED |
| 38 | — | HABARADAS, WILLIAM | EXEMPT |

*Removed since Jan 2026: Intong, Quebradero, Oresco, Macunan, Azucena, Marigondon*

---

## 7. Cutoff A vs Cutoff B Summary

**Columns that are always 0 in Cutoff A:**
- U (Attendance Incentive)
- Y (SSS Premiums EE)
- AA (HDMF Premiums EE)
- AC (PHIC Premium EE)
- AD (Tax Withheld)

**Columns that differ in V formula:**
- Cutoff A: V = Allow_1st + Daily_Allowance × (I-Q)
- Cutoff B: V = Allow_2nd + Daily_Allowance × (I-Q)

**Employee count:**
- Jan Cutoff A: 31 employees (29 formula-based + 2 manual)
- Jan Cutoff B: 32 employees (added Tumlos, Ricky as TEMP-ACT-019)

---

## 8. New Hire Proration Rules

When an employee starts mid-cutoff, their pay and allowances must be prorated.

### 8.1 Basic Pay

**MONTHLY/FIXED:** Basic Pay is still Monthly Rate / 2 (full half-month). The proration happens through absence deductions — record the days before their start date as AWOL.

```
AWOL = Period_Days - Days_Worked
Absence Deduction (S) = AWOL × Daily_Rate
Effective Basic Pay = (Monthly Rate / 2) - Absence Deduction
```

**DAILY:** Basic Pay = Daily Rate × Days Worked. Proration is automatic.

### 8.2 Allowance Proration

For new hires with allowances, prorate using **calendar days of the month**:

```
Prorated Allowance = Full Allowance × (calendar_days_worked / total_calendar_days_in_month)
```

Example: Employee hired March 23, allowance = 5,000/month
- Calendar days worked: Mar 23-31 = 9 days
- Total calendar days: 31
- Prorated: 5,000 × 9/31 = 1,451.61

**Put the prorated amount directly in the V column cell.** Do NOT modify EMPLOYEE INFO — that holds the full monthly amounts.

### 8.3 Attendance Incentive

New hires who start mid-period cannot meet the full-month attendance requirement and are therefore NOT eligible for the attendance incentive in their first month. Starting from the first full month, they are evaluated under the same 3 conditions as all other employees.

---

## 9. Grand Total Row

Uses `=SUBTOTAL(9, col9:col{last_data_row})` for all numeric columns. SUBTOTAL function 9 = SUM, which ignores hidden rows. The range must end BEFORE the Grand Total row itself to avoid circular reference.

---

## 10. Assumptions

1. Password for all payroll files: `Monthly$24`
2. Working days per year: Mon-Sat = 313, Mon-Fri = 261
3. OT rate = 125% of hourly rate
4. Regular holiday pay = 100% of daily rate per holiday day worked
5. Special holiday pay = 30% of daily rate per holiday day worked
6. **Period days = ALL Mon-Sat calendar days in the period, INCLUDING holidays** (holidays do NOT reduce the count)
7. Loan deductions (Z, AB) are manual entries from Payroll Input Template
8. DAILY employees use `Rate/Day × Days Worked` for basic pay
9. EXEMPT employees (Judicq, Imbag, Habaradas) are manual entries — no attendance tracking
10. The ATTENDANCE sheet D4 value controls all cutoff-conditional logic
11. **Do NOT use ATTENDANCE SUMMARY** from the external attendance file — compute from raw sheets (TIME LOG, FILED LEAVE, FILED OT, FILED OBT)
12. Allow_1st is Cutoff A only; Allow_2nd is Cutoff B only (never both in same cutoff)
