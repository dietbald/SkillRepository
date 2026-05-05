# BICC Monthly Audit Skill

## Trigger
User types `/bicc-audit`

## What This Does
Runs a full monthly audit of two folders:
1. **Key Personnel** — checks for expired certificates, missing Excel entries, missing files, data errors
2. **Equipment** — checks for expired OR/CR, missing documents, empty folders, discrepancies between Excel and folder contents

Outputs two HTML files formatted for copy-paste into email, plus a short summary in the chat.

---

## Folder Paths

| Subject | Path |
|---------|------|
| Key Personnel folder | `C:\Users\TJatBICC\BICC\Bid Preparation - Documents\_Supporting Documents Technical\KEY PERSONNEL` |
| Key Personnel Excel | `_20251025 Overview of Key Personnel.xlsx` (root of above folder) |
| Equipment folder | `C:\Users\TJatBICC\BICC\Bid Preparation - Documents\_Supporting Documents Technical\EQUIPMENT\HEAVY EQUIPMENT\NEW EQ` |
| Equipment Summary | `C:\Users\TJatBICC\BICC\Bid Preparation - Documents\_Supporting Documents Technical\EQUIPMENT\HEAVY EQUIPMENT\HEAVY EQUIPMENT LIST SUMMARY.xlsx` |
| Equipment Overview | Most recently dated `*Vehicles and Equipments Overview*.xlsx` in the NEW EQ folder |
| Output folder | `C:\Users\TJatBICC\Documents\BidFilesAudit\` |

---

## Step-by-Step Instructions

### Step 1 — Get today's date
Read `currentDate` from the system context (format: YYYY-MM-DD). Use this for all expiry comparisons.

### Step 2 — Read the Excel files
The files are often open in Excel. Always copy them to `$env:TEMP` first, then read with the `ImportExcel` PowerShell module.

```powershell
Copy-Item "source.xlsx" "$env:TEMP\copy.xlsx" -Force
$pkg = Open-ExcelPackage -Path "$env:TEMP\copy.xlsx"
$ws = $pkg.Workbook.Worksheets["Sheet Name"]
# read $ws.Cells[$r, $c].Text
$pkg.Dispose()
```

For the Equipment Overview, identify the most recent file by the date prefix in the filename (e.g. `10062025` = Oct 6 2025). Read its `Equipments` sheet.
For the Equipment Summary, read the `equip owned5` sheet.
For the Personnel Excel, read the `Overview Personnel` sheet.

### Step 3 — Scan folder structure
Use the `Explore` subagent or direct `Glob`/`Bash` to list all files and subfolders recursively. Record:
- Which numbered subfolders exist and what files are in them
- Which folders are empty (contain only `desktop.ini` or nothing)
- Filenames that contain year references (e.g. `OR 2025.jpg`, `RMW-556 2023.pdf`)

---

## KEY PERSONNEL AUDIT RULES

### What to check in the Excel (`Overview Personnel` sheet)
Columns: `#` | `Position` | `Full Name` | `Address` | `DOB` | `Employed Since` | `General Exp` | `Relevant Exp` | `Previous Employment` | `Education` | `PRC License/Valid ID` | `Valid Until` | `Year Passed` | `Remarks`

**The `Valid Until` column means:**
- For COSH entries → expiry of COSH certificate
- For First Aid entries → expiry of First Aid certificate
- For Engineers/PMs → expiry of PRC license
- For others → expiry of the valid ID shown

**A. Expired credentials incorrectly marked as usable**
Flag any row where `Valid Until` < today AND `Remarks` says "Can be used in all projects" or "If needed". These are critical — mark as CRITICAL.

**B. Expired credentials correctly flagged**
Any row where `Remarks` already says "Expired" or "Do not use" — mark as OK, no action needed.

**C. Personnel with files in folder but no Excel entry**
Cross-reference names found in subfolders (bio data, key personnel forms, certificates) against names in the Excel. Anyone with files but no Excel row is CRITICAL — they are invisible at bid time.

**D. Personnel in Excel but no files in folder**
Check each Excel entry against the matching role folder (e.g., row saying "COSH" → check COSH folder). Flag as HIGH if no supporting files exist.

**E. Near-expiry (within 60 days of today)**
Flag any `Valid Until` date that is between today and today+60 days as HIGH.

**F. Data entry errors**
- Name typos (e.g. missing middle initial)
- Obviously wrong dates (year in the 1300s)
- Gaps in the `#` sequence
- Same person has conflicting data across multiple rows (e.g. different "Employed Since" dates)

**G. File organization issues**
- Files in the wrong role folder (e.g. bio data for a Project Engineer stored in the Project Manager folder)
- Unidentified files that cannot be matched to any person
- The MECHANICAL ENGINEER folder should not be empty if a Mechanical Engineer is listed in Excel

**H. Housekeeping**
- Files named "TO UPDATE" that still exist
- Project/non-personnel files stored inside the KEY PERSONNEL folder

---

## EQUIPMENT AUDIT RULES

### What to check in the Equipment Overview Excel (`Equipments` sheet)
Key columns: `ID` | `Designation` | `Model/Year` | `Plate No.` | `Condition` | `Proof of Ownership` | `With OR/CR` | `Renewal Date (2025)` | `Renewal Date (2026)` | `Renewed By` | `Remarks`

The two `Renewal Date` columns represent the year the OR/CR is due for renewal. If a date in either column is in the past and `Renewed By` is blank or the column after it says "No renewal", it is expired and unrenewed.

**A. Confirmed unrenewed OR/CR**
Any unit where the overview explicitly states "No renewal" or the `With OR/CR` column says "NO OR/CR" → CRITICAL.

**B. Renewal date passed, status unverified**
Any unit where `Renewal Date` < today but the most recent OR file in the folder is from a prior year → CRITICAL. The folder year is read from filenames (e.g. `OR 2025.jpg` = renewed for 2025, expires ~early 2026).

**C. Upcoming renewals (within 60 days)**
Any `Renewal Date` between today and today+60 days → HIGH.

**D. OR/CR document is too old**
If the most recent OR filename in the folder references a year more than 1 year ago (e.g. "OR 2023" when today is 2026) → flag as HIGH regardless of what the Excel says.

**E. Empty folders**
Any numbered equipment folder that contains zero meaningful files (only `desktop.ini` or a single loose photo with no ownership document) → HIGH. Note whether it appears in the Excel and what condition it shows.

**F. Plate number discrepancies**
If a folder name contains a plate number that differs from what the Excel shows for the same unit → CRITICAL. Must be verified against the physical CR.

**G. Units in Excel but no folder**
Equipment listed in the Overview with no corresponding folder → HIGH.

**H. Folders with only photos**
If a folder has only `.jpg`/`.jpeg`/`.png`/`.heic` files and no Deed of Sale, OR, CR, or docx → flag as MEDIUM. Photos alone cannot support a bid submission.

**I. Duplicate folder numbers**
If two folders share the same number prefix → flag as MEDIUM. Needs renumbering.

**J. Units in Summary but missing from Overview**
Cross-reference the `equip owned5` Summary sheet against the Overview. Any unit in the Summary not found in the Overview → MEDIUM.

**K. Sold/disposed equipment**
Verify that sold units are in the `SOFT COPY BUT SOLD, DISPOSAL, ABSENT, CAN'T BE USED IN BIDDING` subfolder and NOT still listed as active in the Overview.

**L. Multiple Excel versions**
Count the number of `*Vehicles*Overview*.xlsx` files in NEW EQ. If more than 1, flag as MEDIUM — recommend consolidating to one authoritative file.

---

## Output Instructions

### File 1 — Key Personnel Audit HTML
Save to: `C:\Users\TJatBICC\Documents\BidFilesAudit\KeyPersonnelAudit.html`

### File 2 — Equipment Audit HTML
Save to: `C:\Users\TJatBICC\Documents\BidFilesAudit\EquipmentAudit.html`

### HTML Format Rules (email-safe)
- White background, Arial font, 14px
- Email header block: To, Date, Subject
- `<hr>` separator
- Sections in order: CRITICAL (red `#c0392b`), HIGH (orange `#e67e22`), MEDIUM (yellow-brown `#b7950b`), OK/No Action (green `#27ae60`)
- Use `<table>` with `border:1px solid #ccc` and alternating `#fafafa` rows
- All styles must be **inline** (no `<style>` blocks — email clients strip them)
- No external fonts, no shadows, no rounded corners
- Section headers: `<p style="font-size:15px;font-weight:bold;color:[color];">&#9632; PRIORITY — Title</p>`

### Chat Summary
After saving both files, post a short chat summary:
- Total CRITICAL issues found (Key Personnel + Equipment)
- Total HIGH issues found
- The single most urgent action needed
- Confirm both HTML files are saved and ready to paste into email

---

## Notes
- Always use today's actual date for expiry calculations — do not hardcode dates
- If the Excel file cannot be opened (in use), copy it first with `Copy-Item` before reading
- The `ImportExcel` PowerShell module should already be installed; if not, run `Install-Module ImportExcel -Scope CurrentUser -Force` first
- If a file exists in the COSH folder named `COSH [Name] [Year].pdf`, check if that year is more recent than what the Excel shows — it may mean the cert was renewed but the Excel was never updated
- The MECHANICAL ENGINEER folder being empty while a Mechanical Engineer exists in the Excel is always a flag
- "Employed Since" inconsistencies for the same person across multiple rows are minor but should be noted
