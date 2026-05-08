#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
BICC Payroll — STABLE configuration shared across all periods.
This file holds employee rosters, pay-type categories, and known patterns.
Edit only when employees join, leave, or change pay type — NOT every period.

Per-period config (dates, holidays, Tina's input) lives in the generation script.
"""

# ============================================================================
# Pay type categories (surname keys, normalized lowercase, ñ→n)
# ============================================================================
DAILY_EMPLOYEES = {"futotana", "penas", "tolentino", "ropero", "tumlos"}
MONTHLY_EMPLOYEES = {"cabunagan", "macoco", "modesto", "tiquison", "owa", "gatchon"}
EXEMPT_EMPLOYEES = {"judicq", "imbag"}
HABARADAS_LIKE = {"habaradas"}  # Functionally EXEMPT but FIXED in registry
# Everyone else (Obillos, Maquiling, Juayno, Lapizar, Penasa, Selidio, Lood,
# Pajar, Secugal, Espanola, Mosquera, Pangantihon, Esmeralda, Gabiano,
# Marmolejo, Prologo) is FIXED.

# ============================================================================
# Resigned employees — these get fully zeroed in payroll
# ============================================================================
# Resigned and still in roster, must be re-zeroed each period
RESIGNED_ZERO = {"oresco", "quebradero"}

# Already zeroed in prior periods, just keep them at zero
ALREADY_ZEROED = {"macunan", "marigondon"}

# Excluded from attendance computation (no biometric)
EXCLUDED_NAMES = RESIGNED_ZERO | ALREADY_ZEROED | {"azucena", "intong"}

# Known payroll-row positions for resigned employees (fallback if name lookup fails)
RESIGNED_ROW_MAP = {
    "oresco": 27,
    "quebradero": 16,
}

# ============================================================================
# Hardcoded rows that need V (allowance) formula restored after openpyxl edits
# These employees have V cells that were hardcoded literals, so when we edit
# their row Excel may not auto-restore the cross-sheet VLOOKUP.
# ============================================================================
V_FORMULA_ROWS = [35, 43, 44, 45]  # Selidio, Gabiano, Marmolejo, Prologo

# ============================================================================
# Constants
# ============================================================================
PASSWORD = "Monthly$24"
INCENTIVE_AMOUNT = 1000
LATE_THRESHOLD_MIN = 15  # Single late > 15 min disqualifies incentive
LATE_COUNT_LIMIT = 3     # More than 3 late instances per month disqualifies

START_TIME = 8.0 / 24.0   # 0.333333 = 8:00 AM (work day starts)
QUIT_TIME = 17.0 / 24.0   # 0.708333 = 5:00 PM (work day ends)
LUNCH_END = 13.0 / 24.0   # 0.541666 = 1:00 PM (end of lunch break)
# Note: "very-late = absent" is NOT a deterministic threshold — it's an HR judgment.
# Use compute_attendance.py's --force-absent CLI param to flag specific (employee, date) pairs.

# ============================================================================
# Base paths (Windows-specific — adjust BASE_PAYROLL for your machine)
# ============================================================================
BASE_PAYROLL = r"C:/Users/thiba/BICC/HR Payroll - Documents/Admin Payroll {year}"
WORK_DIR = r"C:/Users/thiba/Documents/Payroll/work"


# ============================================================================
# Helpers
# ============================================================================
def normalize_surname(s):
    """Normalize surname for matching — handles ñ encoding."""
    return s.lower().replace("ñ", "n").replace("\xf1", "n").strip()

def get_employee_type(surname):
    """Return DAILY / MONTHLY / FIXED / EXEMPT for a normalized surname."""
    sn = normalize_surname(surname)
    if sn in {normalize_surname(x) for x in DAILY_EMPLOYEES}:
        return "DAILY"
    if sn in {normalize_surname(x) for x in MONTHLY_EMPLOYEES}:
        return "MONTHLY"
    if sn in {normalize_surname(x) for x in EXEMPT_EMPLOYEES}:
        return "EXEMPT"
    if sn in {normalize_surname(x) for x in HABARADAS_LIKE}:
        return "EXEMPT"
    return "FIXED"

def is_daily(name):
    """Check if a TIME LOG full name is a DAILY employee."""
    normalized = name.lower().replace("ñ", "n").replace("Ñ", "n")
    words = [w.replace(".", "") for w in normalized.split()]
    return any(w in DAILY_EMPLOYEES for w in words)

def is_excluded(name):
    """Check if employee should be skipped from attendance computation."""
    words = [w.lower().replace(".", "") for w in name.split()]
    if any(w in EXCLUDED_NAMES for w in words):
        return "resigned"
    if any(w in EXEMPT_EMPLOYEES for w in words):
        return "exempt"
    return None

def get_surname(full_name):
    """Last word of TIME LOG name (after stripping periods)."""
    words = full_name.strip().replace(".", " ").split()
    return words[-1].lower() if words else ""

def names_match(tl_name, filed_name):
    """Word-boundary surname match (NOT substring — 'penas' must not match 'penasa')."""
    surname = get_surname(tl_name)
    filed_words = [w.lower().replace(".", "") for w in filed_name.split()]
    return surname in filed_words

def surname_from_payroll(name):
    """Extract surname from 'Surname, First Middle' format."""
    if not name:
        return ""
    return name.split(",")[0].strip().lower()
