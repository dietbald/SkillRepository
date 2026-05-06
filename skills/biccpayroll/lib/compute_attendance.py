#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
BICC Attendance Computation — generic, parameterized.

Reads raw sheets (TIME LOG, FILED LEAVE, FILED OT, FILED OBT) from the BICC
Admin Attendance Sheet and produces a JSON output usable by generate_payroll.py.

Usage:
    python compute_attendance.py \\
        --attendance "C:/path/to/BICC_Admin Attendance Sheet ....xlsx" \\
        --start 2026-04-16 --end 2026-04-30 \\
        --output attendance_results.json \\
        [--holidays 2026-04-09:regular,2026-04-04:special] \\
        [--lwd "esmeralda=2026-04-25,lapizar=2026-04-25"] \\
        [--new-hires "smith=2026-04-20"]

Key invariants enforced:
- TIME LOG columns: in_col = 5 + 2*(day - 1)  — full month layout
- DAILY: ATTENDANCE L (abs) MUST be 0 (Q-deduction guard)
- FIXED: OT hours forced to 0 regardless of FILED OT
- ñ→n normalization for is_daily() match
"""

import argparse
import json
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import win32com.client

# Import shared config (employee rosters, helpers)
sys.path.insert(0, str(Path(__file__).parent))
from biccpayroll_config import (
    DAILY_EMPLOYEES, MONTHLY_EMPLOYEES, EXEMPT_EMPLOYEES, HABARADAS_LIKE,
    EXCLUDED_NAMES, START_TIME, QUIT_TIME,
    normalize_surname, get_employee_type, is_daily, is_excluded,
    get_surname, names_match,
)


def parse_date_arg(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def parse_holidays(s):
    """Parse '2026-04-09:regular,2026-04-04:special'."""
    if not s:
        return {}
    out = {}
    for item in s.split(","):
        d_str, kind = item.split(":")
        out[parse_date_arg(d_str)] = kind.strip()
    return out


def parse_kv_dates(s):
    """Parse 'name=YYYY-MM-DD,name=YYYY-MM-DD' into {name: date}."""
    if not s:
        return {}
    out = {}
    for item in s.split(","):
        k, v = item.split("=")
        out[k.strip().lower()] = parse_date_arg(v.strip())
    return out


def safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def fmt_time(frac):
    if frac is None:
        return "--:--"
    h = int(frac * 24)
    m = int((frac * 24 - h) * 60)
    return f"{h:02d}:{m:02d}"


def count_working_days(d_from, d_to):
    count = 0
    d = d_from
    while d <= d_to:
        if d.weekday() < 6:
            count += 1
        d += timedelta(days=1)
    return count


def compute(attendance_file, start, end, holidays, lwd_resignations, new_hire_starts):
    """Main computation. Returns dict keyed by surname."""
    all_dates = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    workdays = [d for d in all_dates if d.weekday() < 6]
    period_days = len(workdays)

    print(f"Period: {start} to {end} | workdays: {period_days}")
    print(f"Holidays: {holidays or '(none)'}")
    print(f"LWD resignations: {lwd_resignations or '(none)'}")
    print(f"New hires: {new_hire_starts or '(none)'}")

    excel = win32com.client.Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False

    print(f"\nOpening: {Path(attendance_file).name}")
    sys.stdout.flush()
    wb = excel.Workbooks.Open(str(Path(attendance_file).absolute()))
    time.sleep(3)

    # 1. TIME LOG
    ws_tl = wb.Worksheets("TIME LOG")
    tl_last = ws_tl.UsedRange.Row + ws_tl.UsedRange.Rows.Count - 1
    employees = {}

    for row in range(8, min(tl_last + 1, 60)):
        name = ws_tl.Cells(row, 2).Value
        if name is None:
            continue
        name = str(name).strip()
        if not name or len(name) < 3:
            continue
        try:
            float(name)  # skip phantom numeric rows
            continue
        except (ValueError, TypeError):
            pass
        if is_excluded(name):
            continue

        bio = {}
        for wd in workdays:
            # CRITICAL: TIME LOG covers full month — column = 5 + 2*(d-1)
            in_col = 5 + 2 * (wd.day - 1)
            out_col = in_col + 1
            bio_in = safe_float(ws_tl.Cells(row, in_col).Value)
            bio_out = safe_float(ws_tl.Cells(row, out_col).Value)
            bio[wd] = (bio_in, bio_out)

        employees[name] = {"row": row, "bio": bio}

    print(f"  TIME LOG: {len(employees)} active employees")

    # 2. FILED LEAVE
    ws_fl = wb.Worksheets("FILED LEAVE")
    fl_last = ws_fl.UsedRange.Row + ws_fl.UsedRange.Rows.Count - 1
    leave_data = {}
    seen = set()

    for row in range(8, fl_last + 1):
        name = ws_fl.Cells(row, 1).Value
        if not name or not str(name).strip():
            continue
        name = str(name).strip()
        date_from = ws_fl.Cells(row, 3).Value
        date_to = ws_fl.Cells(row, 4).Value
        if date_from is None:
            continue

        try:
            df = date(date_from.year, date_from.month, date_from.day) if hasattr(date_from, 'year') else date.fromisoformat(str(date_from)[:10])
            dt = (date(date_to.year, date_to.month, date_to.day) if (date_to and hasattr(date_to, 'year'))
                  else (date.fromisoformat(str(date_to)[:10]) if date_to else df))
        except Exception:
            continue

        if dt < start or df > end:
            continue
        df_c = max(df, start)
        dt_c = min(dt, end)
        approval = ws_fl.Cells(row, 5).Value
        if approval and "NO APPROVAL" in str(approval).upper():
            continue

        col6 = ws_fl.Cells(row, 6).Value
        col7 = ws_fl.Cells(row, 7).Value
        key = (name.lower(), str(df), str(dt), str(col6), str(col7))
        if key in seen:
            continue
        seen.add(key)

        wdays = count_working_days(df_c, dt_c)
        is_lwp = col6 is not None and float(col6) > 0
        leave_data.setdefault(name, {"lwp": 0, "lwop": 0})
        if is_lwp:
            leave_data[name]["lwp"] += wdays
        else:
            leave_data[name]["lwop"] += wdays

    # 3. FILED OT
    ws_ot = wb.Worksheets("FILED OT")
    ot_last = ws_ot.UsedRange.Row + ws_ot.UsedRange.Rows.Count - 1
    ot_data = {}

    for row in range(8, ot_last + 1):
        name = ws_ot.Cells(row, 1).Value
        if not name or not str(name).strip():
            continue
        name = str(name).strip()
        dc_raw = ws_ot.Cells(row, 3).Value
        approval = ws_ot.Cells(row, 5).Value
        hours_filed = ws_ot.Cells(row, 10).Value
        if dc_raw is None:
            continue
        try:
            dc = (date(dc_raw.year, dc_raw.month, dc_raw.day) if hasattr(dc_raw, 'year')
                  else date.fromisoformat(str(dc_raw)[:10]))
        except Exception:
            continue
        if dc < start or dc > end:
            continue
        if not approval or "FULLY APPROVED" not in str(approval).upper():
            continue

        h = safe_float(hours_filed)
        if h is None:
            am_from = safe_float(ws_ot.Cells(row, 6).Value)
            am_to = safe_float(ws_ot.Cells(row, 7).Value)
            pm_from = safe_float(ws_ot.Cells(row, 8).Value)
            pm_to = safe_float(ws_ot.Cells(row, 9).Value)
            h = 0.0
            if am_from is not None and am_to is not None:
                h += (am_to - am_from) * 24
            if pm_from is not None and pm_to is not None:
                h += (pm_to - pm_from) * 24
        ot_data.setdefault(name, 0.0)
        ot_data[name] += h

    # 4. FILED OBT
    ws_obt = wb.Worksheets("FILED OBT")
    obt_last = ws_obt.UsedRange.Row + ws_obt.UsedRange.Rows.Count - 1
    obt_data = {}

    for row in range(8, obt_last + 1):
        name = ws_obt.Cells(row, 1).Value
        if not name or not str(name).strip():
            continue
        name = str(name).strip()
        dc_raw = ws_obt.Cells(row, 2).Value
        if dc_raw is None:
            continue
        try:
            dc = (date(dc_raw.year, dc_raw.month, dc_raw.day) if hasattr(dc_raw, 'year')
                  else date.fromisoformat(str(dc_raw)[:10]))
        except Exception:
            continue
        if dc < start or dc > end:
            continue
        approval = ws_obt.Cells(row, 3).Value
        if approval and "NO APPROVAL" in str(approval).upper():
            continue

        obt_data.setdefault(name, {}).setdefault(dc, [])
        # Up to 4 IN/OUT pairs per row: cols 4-5, 6-7, 8-9, 10-11
        for pair_col in range(4, 12, 2):
            obt_in = ws_obt.Cells(row, pair_col).Value
            obt_out = ws_obt.Cells(row, pair_col + 1).Value
            if obt_in is not None or obt_out is not None:
                obt_data[name][dc].append((safe_float(obt_in), safe_float(obt_out)))

    # 5. COMBINE
    results = []
    for tl_name in sorted(employees.keys(), key=lambda n: employees[n]["row"]):
        emp = employees[tl_name]
        surname = get_surname(tl_name)
        emp_is_daily = is_daily(tl_name)
        emp_type = get_employee_type(surname)

        last_wd = lwd_resignations.get(normalize_surname(surname))
        hire_date = new_hire_starts.get(normalize_surname(surname))

        lwp = lwop = 0
        for fl_name, fl_d in leave_data.items():
            if names_match(tl_name, fl_name):
                lwp = fl_d["lwp"]
                lwop = fl_d["lwop"]
                break

        ot = 0.0
        for ot_name, ot_h in ot_data.items():
            if names_match(tl_name, ot_name):
                ot = round(ot_h, 2)
                break

        # ENFORCE: FIXED/EXEMPT employees do NOT get OT pay (Peñasa case)
        if emp_type in ("FIXED", "EXEMPT"):
            if ot > 0:
                print(f"  [FIXED OT zeroed] {tl_name}: filed {ot}h → 0 (FIXED policy)")
            ot = 0.0

        emp_obt = {}
        for obt_name, obt_dates in obt_data.items():
            if names_match(tl_name, obt_name):
                emp_obt = obt_dates
                break

        # Iterate workdays, capping at last_working_day for resigned mid-period
        iter_days = workdays if last_wd is None else [d for d in workdays if d <= last_wd]
        lost_days = len(workdays) - len(iter_days)

        days_present = 0
        hol_worked = {}
        absent_days = []
        total_late = total_ut = 0.0
        late_instances = []

        for wd in iter_days:
            bio_in, bio_out = emp["bio"][wd]
            obt_entries = emp_obt.get(wd, [])

            all_ins = [bio_in] if bio_in is not None else []
            for (oi, _) in obt_entries:
                if oi is not None:
                    all_ins.append(oi)
            eff_in = min(all_ins) if all_ins else None

            has_bio = bio_in is not None
            all_outs = [bio_out] if bio_out is not None else []
            for (oi, oo) in obt_entries:
                if oo is not None:
                    all_outs.append(oo)
                elif oi is not None:
                    all_outs.append(oi)
            eff_out = max(all_outs) if all_outs else None

            present = eff_in is not None
            late_m = ut_m = 0.0

            if present:
                days_present += 1
                is_hol = wd in holidays
                # ALL holidays excuse late + UT (Apr 2026 confirmed via Obillos Apr 2)
                if not is_hol:
                    if eff_in > START_TIME + 0.0001:
                        late_m = (eff_in - START_TIME) * 24 * 60
                    if has_bio and eff_out is not None and eff_out < QUIT_TIME - 0.0001:
                        ut_m = (QUIT_TIME - eff_out) * 24 * 60
                total_late += late_m
                total_ut += ut_m
                if late_m > 0:
                    late_instances.append({"date": wd, "minutes": round(late_m, 1)})
                if wd in holidays:
                    hol_worked[wd] = holidays[wd]
            else:
                absent_days.append(wd)

        # Holiday credit
        holidays_not_worked = 0
        daily_spec_hol_no_credit = 0
        for hd in holidays:
            if hd in absent_days:
                if hire_date and hd < hire_date:
                    continue
                if last_wd and hd > last_wd:
                    continue
                if emp_is_daily and holidays[hd] == "special":
                    daily_spec_hol_no_credit += 1
                    continue
                holidays_not_worked += 1

        days = days_present + holidays_not_worked
        tardy = round(total_late + total_ut, 1)
        # AWOL within employed period
        awol = max(0, len(iter_days) - days_present - holidays_not_worked - lwp - lwop - daily_spec_hol_no_credit)
        # Total deductible-day count (Q in payroll formula) = LWOP + AWOL + lost (post-LWD)
        abs_deduct = lwop + awol + lost_days
        # DAILY LWP rule: payroll_days includes LWP for DAILY (so L = J × payroll_days credits paid leave)
        payroll_days = days + lwp if emp_is_daily else days

        results.append({
            "name": tl_name,
            "surname": surname,
            "row": emp["row"],
            "is_daily": emp_is_daily,
            "type": emp_type,
            "last_working_day": last_wd,
            "lost_days": lost_days,
            "days_present": days_present,
            "days": days,
            "payroll_days": payroll_days,
            "tardy": tardy,
            "lwp": lwp,
            "lwop": lwop,
            "awol": awol,
            "abs": abs_deduct,
            "ot": ot,
            "hol_credit": holidays_not_worked,
            "hol_worked": hol_worked,
            "late_instances": late_instances,
        })

    # Print summary table
    print(f"\n{'Employee':<35s} {'Type':>5s} {'Days':>4s} {'Prl':>4s} {'Tardy':>6s} {'LWP':>3s} {'LWOP':>4s} {'AWOL':>4s} {'Lost':>4s} {'OT':>6s}")
    print("-" * 110)
    for r in results:
        pt = "DAILY" if r["is_daily"] else r["type"][:5]
        print(f"{r['name'][:35]:<35s} {pt:>5s} {r['days']:>4d} {r['payroll_days']:>4d} {r['tardy']:>6.0f} {r['lwp']:>3d} {r['lwop']:>4d} {r['awol']:>4d} {r['lost_days']:>4d} {r['ot']:>6.2f}")

    wb.Close(False)
    excel.Quit()

    # Build JSON
    json_results = {}
    for r in results:
        json_results[r["surname"]] = {
            "name": r["name"],
            "days": r["payroll_days"],
            "tardy_min": r["tardy"],
            "tardy_hrs": round(r["tardy"] / 60, 2),
            "lwp": r["lwp"],
            "lwop": r["lwop"],
            "awol": r["awol"],
            "abs": r["abs"],
            "lost_days": r["lost_days"],
            "ot": r["ot"],
            "hol_worked": {d.isoformat(): t for d, t in r["hol_worked"].items()},
            "days_present": r["days_present"],
            "hol_credit": r["hol_credit"],
            "is_daily": r["is_daily"],
            "type": r["type"],
            "last_working_day": r["last_working_day"].isoformat() if r["last_working_day"] else None,
            "late_instances": [{"date": li["date"].isoformat(), "minutes": li["minutes"]} for li in r["late_instances"]],
        }
    return json_results


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--attendance", required=True, help="Path to BICC Admin Attendance Sheet xlsx")
    p.add_argument("--start", required=True, type=parse_date_arg, help="Period start YYYY-MM-DD")
    p.add_argument("--end", required=True, type=parse_date_arg, help="Period end YYYY-MM-DD")
    p.add_argument("--output", required=True, help="Output JSON path")
    p.add_argument("--holidays", default="", help="Comma list 'YYYY-MM-DD:regular' or ':special'")
    p.add_argument("--lwd", default="", help="Mid-period resignations 'name=YYYY-MM-DD,...'")
    p.add_argument("--new-hires", default="", help="New hires 'name=YYYY-MM-DD,...'")
    args = p.parse_args()

    holidays = parse_holidays(args.holidays)
    lwd = parse_kv_dates(args.lwd)
    new_hires = parse_kv_dates(args.new_hires)

    results = compute(args.attendance, args.start, args.end, holidays, lwd, new_hires)
    with open(args.output, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved: {args.output}")


if __name__ == "__main__":
    main()
