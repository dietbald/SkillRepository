"""
PhilGEPS merchant lookup.

Single mode:
    python lookup.py "BELGIAN"
    python lookup.py "BELGIAN ILOILO CONSTRUCTION"

Batch mode (CSV in, CSV out):
    python lookup.py --batch in.csv --name-column capitol_name --output out.csv
    python lookup.py --batch in.csv --output out.csv          # auto-pick name col

Endpoint behaviour (as of 2026-05-13):
  POST https://open.philgeps.gov.ph/analytics/merchant/load/
       template=AHVTN1F3VXxQEwI2BmZVOA8zXndRSAZpUW0Aaw==
       keyword=<search string>
Returns HTML containing <tbody><tr>…</tr>…</tbody> with one row per matching merchant.
We parse it deterministically. No 3rd-party deps (urllib + html.parser).

Author: Claude (Anthropic) for TJ @ BICC, 2026-05-13.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html.parser
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

ENDPOINT = "https://open.philgeps.gov.ph/analytics/merchant/load/"
TEMPLATE = "AHVTN1F3VXxQEwI2BmZVOA8zXndRSAZpUW0Aaw=="
HEADERS = {
    "User-Agent": "Mozilla/5.0 (philgeps-merchant skill; contact: tj@bicc.ph)",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "text/html, */*; q=0.01",
    "Referer": "https://open.philgeps.gov.ph/analytics/load/merchantInfo",
}
CACHE_DIR = Path.home() / ".cache" / "philgeps"
RATE_LIMIT_SECONDS = 1.0
RETRY_BACKOFFS = [2, 5, 12]  # seconds


# ──────────────────────────────────────────────────────────────────
# Data model
# ──────────────────────────────────────────────────────────────────
@dataclass
class Merchant:
    name: str
    type: str
    certification_level: str
    philgeps_reg_no: Optional[str] = None
    philgeps_reg_expiry: Optional[str] = None
    mayors_permit_no: Optional[str] = None
    mayors_permit_expiry: Optional[str] = None
    tax_clearance_no: Optional[str] = None
    tax_clearance_expiry: Optional[str] = None
    sec_number: Optional[str] = None


# ──────────────────────────────────────────────────────────────────
# Network
# ──────────────────────────────────────────────────────────────────
_last_request_time = 0.0


def _throttle():
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < RATE_LIMIT_SECONDS:
        time.sleep(RATE_LIMIT_SECONDS - elapsed)
    _last_request_time = time.time()


def _cache_key(keyword: str) -> Path:
    h = hashlib.sha1(keyword.upper().encode("utf-8")).hexdigest()[:16]
    return CACHE_DIR / f"{h}_{re.sub(r'[^a-zA-Z0-9]+', '_', keyword)[:60]}.json"


def _post(keyword: str) -> str:
    data = urllib.parse.urlencode({"template": TEMPLATE, "keyword": keyword}).encode()
    req = urllib.request.Request(ENDPOINT, data=data, headers=HEADERS, method="POST")
    for attempt, backoff in enumerate([0] + RETRY_BACKOFFS):
        if backoff:
            time.sleep(backoff)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            if attempt == len(RETRY_BACKOFFS):
                raise
            print(f"  retry {attempt + 1}/{len(RETRY_BACKOFFS)}: {e}", file=sys.stderr)
    return ""


def fetch_html(keyword: str, *, force: bool = False) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = _cache_key(keyword)
    if cache_path.exists() and not force:
        try:
            return json.loads(cache_path.read_text(encoding="utf-8"))["html"]
        except Exception:
            pass
    _throttle()
    html_text = _post(keyword)
    cache_path.write_text(
        json.dumps({"keyword": keyword, "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"), "html": html_text}, ensure_ascii=False),
        encoding="utf-8",
    )
    return html_text


# ──────────────────────────────────────────────────────────────────
# HTML parsing
# ──────────────────────────────────────────────────────────────────
ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.IGNORECASE | re.DOTALL)
TD_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.IGNORECASE | re.DOTALL)
TH_RE = re.compile(r"<th[^>]*>(.*?)</th>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")


def _strip_tags(s: str) -> str:
    return TAG_RE.sub("", s)


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("&amp;", "&").replace("&nbsp;", " ")).strip()


def parse_merchant_rows(html_text: str) -> list[Merchant]:
    if not html_text or "merchant-tbl" not in html_text:
        return []
    body_match = re.search(r"<tbody[^>]*>(.*?)</tbody>", html_text, re.IGNORECASE | re.DOTALL)
    if not body_match:
        return []
    body = body_match.group(1)

    out: list[Merchant] = []
    for row_match in ROW_RE.finditer(body):
        row = row_match.group(1)
        tds = [_clean(_strip_tags(m.group(1))) for m in TD_RE.finditer(row)]
        ths = [m.group(1) for m in TH_RE.finditer(row)]  # keep HTML — we need <p> structure
        if len(tds) < 1 or len(ths) < 1:
            continue

        # Name+type
        name_cell = tds[0]
        # Heuristic split: trailing "Corporation" / "Sole Proprietorship" / "Partnership"
        type_match = re.search(r"\s+(Corporation|Sole Proprietorship|Single Proprietorship|Partnership|Cooperative|One Person Corporation)\s*$", name_cell)
        if type_match:
            org_type = type_match.group(1)
            name = name_cell[: type_match.start()].strip()
        else:
            org_type = ""
            name = name_cell

        # Registration details cell
        details_raw = ths[0]
        # First text node before any <p> is the certification level
        cert_match = re.match(r"\s*([A-Za-z]+)", _strip_tags(details_raw))
        cert = cert_match.group(1).strip() if cert_match else ""

        # Pull each <p>…</p> as a separate line
        ps = [
            _clean(_strip_tags(m.group(1)))
            for m in re.finditer(r"<p[^>]*>(.*?)</p>", details_raw, re.IGNORECASE | re.DOTALL)
        ]

        # Common patterns:
        #   <reg_no> (Exp:<date>)
        #   Mayor's Permit: <no> (Exp:<date>)
        #   Tax Clearance: <no> (Exp: <date>)
        #   SEC: <no>
        m = Merchant(name=name, type=org_type, certification_level=cert)
        for p in ps:
            if p.lower().startswith("mayor"):
                mm = re.search(r"Mayor.*?:\s*(\S+)\s*\(Exp:\s*([^)]+)\)", p)
                if mm:
                    m.mayors_permit_no = mm.group(1)
                    m.mayors_permit_expiry = mm.group(2).strip()
            elif p.lower().startswith("tax"):
                mm = re.search(r"Tax Clearance:\s*(\S+)\s*\(Exp:\s*([^)]+)\)", p)
                if mm:
                    m.tax_clearance_no = mm.group(1)
                    m.tax_clearance_expiry = mm.group(2).strip()
            elif p.upper().startswith("SEC"):
                mm = re.search(r"SEC:\s*(\S+)", p)
                if mm:
                    m.sec_number = mm.group(1)
            else:
                # Likely the philgeps reg line
                mm = re.search(r"(\S+)\s*\(Exp:\s*([^)]+)\)", p)
                if mm and not m.philgeps_reg_no:
                    m.philgeps_reg_no = mm.group(1)
                    m.philgeps_reg_expiry = mm.group(2).strip()

        if m.name:
            out.append(m)
    return out


# ──────────────────────────────────────────────────────────────────
# Lookup logic — strip suffixes to widen matches
# ──────────────────────────────────────────────────────────────────
SUFFIX_TOKENS = {
    "INC", "INC.", "CORP", "CORP.", "CORPORATION", "INCORPORATED", "CO", "CO.", "COMPANY",
    "LTD", "LTD.", "LIMITED", "TRADING", "MARKETING", "ENTERPRISES", "ENTERPRISE",
    "SUPPLY", "SUPPLIES", "HARDWARE", "CONSTRUCTION", "&", "AND",
}


def normalize_keyword(name: str) -> list[str]:
    """Return a prioritized list of keyword variations to try for one supplier name."""
    base = re.sub(r"[^A-Za-z0-9 ]+", " ", name).strip().upper()
    base = re.sub(r"\s+", " ", base)
    tokens = base.split()
    out = [base]
    # Try progressively-shorter prefixes
    while tokens and tokens[-1] in SUFFIX_TOKENS:
        tokens.pop()
        cand = " ".join(tokens)
        if cand and cand not in out:
            out.append(cand)
    # First strong token alone (last resort, only if first token is >=4 chars)
    if tokens and len(tokens[0]) >= 4 and tokens[0] not in out:
        out.append(tokens[0])
    return out


def lookup(name: str, *, max_keywords: int = 3, force: bool = False) -> dict:
    tried = []
    for keyword in normalize_keyword(name)[:max_keywords]:
        html_text = fetch_html(keyword, force=force)
        merchants = parse_merchant_rows(html_text)
        tried.append({"keyword": keyword, "hits": len(merchants), "merchants": [asdict(m) for m in merchants]})
        if merchants:
            break
    return {"input": name, "queries": tried, "best_keyword": tried[-1]["keyword"] if tried else None}


# ──────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="PhilGEPS merchant registry lookup")
    ap.add_argument("name", nargs="?", help="Single supplier name to look up")
    ap.add_argument("--batch", metavar="CSV", help="Path to CSV with names to enrich")
    ap.add_argument("--name-column", default=None,
                    help="Column in --batch CSV containing the supplier name (auto-detect if not given)")
    ap.add_argument("--output", default=None, help="Output CSV for --batch mode")
    ap.add_argument("--force", action="store_true", help="Bypass cache")
    ap.add_argument("--max-keywords", type=int, default=3, help="Max keyword variants per name (default 3)")
    args = ap.parse_args()

    if args.batch:
        if not args.output:
            print("--output is required with --batch", file=sys.stderr)
            sys.exit(2)
        with open(args.batch, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            fieldnames = reader.fieldnames or []
        name_col = args.name_column
        if not name_col:
            for c in ("supplier_name", "capitol_name", "name", "company", "vendor"):
                if c in fieldnames:
                    name_col = c
                    break
            if not name_col:
                print(f"Could not auto-detect name column. Got columns: {fieldnames}", file=sys.stderr)
                sys.exit(2)

        extra_cols = [
            "philgeps_hit_count", "philgeps_match_name", "philgeps_type", "philgeps_cert",
            "philgeps_reg_no", "philgeps_reg_expiry", "philgeps_mayors_permit_no", "philgeps_mayors_permit_expiry",
            "philgeps_tax_clearance_no", "philgeps_tax_clearance_expiry", "philgeps_sec_number",
            "philgeps_keyword_used",
        ]
        out_fields = list(fieldnames) + [c for c in extra_cols if c not in fieldnames]
        os.makedirs(os.path.dirname(os.path.abspath(args.output)) or ".", exist_ok=True)
        with open(args.output, "w", encoding="utf-8", newline="") as fo:
            writer = csv.DictWriter(fo, fieldnames=out_fields)
            writer.writeheader()
            for i, row in enumerate(rows, 1):
                name = row.get(name_col, "").strip()
                if not name:
                    writer.writerow(row)
                    continue
                result = lookup(name, max_keywords=args.max_keywords, force=args.force)
                merchants = []
                used_keyword = None
                for q in result["queries"]:
                    if q["merchants"]:
                        merchants = q["merchants"]
                        used_keyword = q["keyword"]
                        break
                row["philgeps_hit_count"] = len(merchants)
                row["philgeps_keyword_used"] = used_keyword or result["queries"][-1]["keyword"] if result["queries"] else ""
                if merchants:
                    best = merchants[0]
                    row["philgeps_match_name"] = best["name"]
                    row["philgeps_type"] = best["type"]
                    row["philgeps_cert"] = best["certification_level"]
                    row["philgeps_reg_no"] = best.get("philgeps_reg_no") or ""
                    row["philgeps_reg_expiry"] = best.get("philgeps_reg_expiry") or ""
                    row["philgeps_mayors_permit_no"] = best.get("mayors_permit_no") or ""
                    row["philgeps_mayors_permit_expiry"] = best.get("mayors_permit_expiry") or ""
                    row["philgeps_tax_clearance_no"] = best.get("tax_clearance_no") or ""
                    row["philgeps_tax_clearance_expiry"] = best.get("tax_clearance_expiry") or ""
                    row["philgeps_sec_number"] = best.get("sec_number") or ""
                writer.writerow(row)
                if i % 10 == 0:
                    print(f"  {i}/{len(rows)} processed", file=sys.stderr)
        print(f"Wrote {args.output} ({len(rows)} rows)", file=sys.stderr)
        return

    if not args.name:
        ap.print_help()
        sys.exit(2)

    result = lookup(args.name, max_keywords=args.max_keywords, force=args.force)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
