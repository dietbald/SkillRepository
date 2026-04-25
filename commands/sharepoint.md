# SharePoint — Access Files via Microsoft Graph API

Access files on iloiloconstruction.sharepoint.com using the Microsoft Graph API.

**CLI:** `/home/tj/sharepoint/sharepoint-cli.sh`
**Config:** `/home/tj/sharepoint/config.env`
**Tenant:** iloiloconstruction.sharepoint.com

---

## When to use this skill

Use automatically (without asking the user) whenever:
- User mentions a file on SharePoint
- User asks to read, find, or download a SharePoint document
- User references a document that likely lives in SharePoint (contracts, reports, spreadsheets)

---

## Commands

```bash
# List all sites
/home/tj/sharepoint/sharepoint-cli.sh sites

# List files in root or folder
/home/tj/sharepoint/sharepoint-cli.sh ls [site-id] [folder-path]

# Search for files
/home/tj/sharepoint/sharepoint-cli.sh find "query" [site-id]

# Download a file to current dir
/home/tj/sharepoint/sharepoint-cli.sh get "Documents/report.pdf" [site-id]

# Read text file contents directly
/home/tj/sharepoint/sharepoint-cli.sh read "Documents/notes.txt" [site-id]

# Get download URL
/home/tj/sharepoint/sharepoint-cli.sh url "Documents/report.pdf" [site-id]
```

---

## Workflow

1. Run `sites` first to get the site ID if needed
2. Use `ls` to browse folder structure
3. Use `find` to search by filename or keyword
4. Use `read` for text files (txt, csv, md), `get` for binary files (pdf, docx, xlsx)

---

## Notes
- Token is cached in /tmp for 55 minutes — no login needed per call
- File paths are relative to site root, e.g. `Documents/subfolder/file.pdf`
- For Excel/Word files, use `get` to download then process locally
