# SEEK Employer Portal — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Names, emails, passwords,
     API keys, account numbers, and PNRs belong in .env only. -->

## Status: ✅ Verified — 2026-04-25, extracted 189 candidates across 3 jobs

## Task
Extract all applicant profiles (name, email, phone, job title, company, screening questions) + resume PDFs from active job posts on ph.employer.seek.com.

## Portal URL
https://ph.employer.seek.com/candidates?jobid={jobId}

## Login
- Method: Email/password (standard form — NOT Google SSO)
- Login URL: ph.employer.seek.com (redirects to login if session expired)
- Session persists in ChromeDebug profile between runs

---

## Architecture: GraphQL API

SEEK employer portal is a React SPA backed by a GraphQL API at `https://ph.employer.seek.com/graphql`.
**All candidate data comes from GraphQL — do NOT try to scrape the HTML.**

### Operation name: `Applications`

Capture the query and auth headers by intercepting a real browser request:

```javascript
const capturedReqs = [];
const handler = req => {
  if (req.url().includes('graphql') && req.method() === 'POST') {
    try {
      const p = JSON.parse(req.postData());
      if (p.operationName === 'Applications') capturedReqs.push({ p, headers: req.headers() });
    } catch(e) {}
    req.continue();  // MUST call continue() even if capturing
  } else {
    req.continue();
  }
};
await page.setRequestInterception(true);
page.on('request', handler);
await page.goto('https://ph.employer.seek.com/candidates?jobid={anyJobId}', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5000);
page.off('request', handler);   // MUST remove named handler before disabling
await page.setRequestInterception(false);
```

**Critical: always use named handlers (`page.on('request', handler)` / `page.off('request', handler)`).** Re-enabling interception while a prior `req.continue()` handler is still registered causes "Request Interception is not enabled!" crash.

### Variables template
Captured from the real browser request. Key fields to override per query:
- `vars.input.jobId` — the job ID
- `vars.input.pagination.pageNumber` — page number (1-based)
- `vars.input.filters.statusFolders` — array, e.g. `["INBOX"]`
- `vars.nationalitiesInput2.jobId` — must also be set if present

### Status folders (all 7)
```javascript
const ALL_STATUS_FOLDERS = ['INBOX', 'PRESCREEN', 'SHORTLIST', 'INTERVIEW', 'OFFER', 'ACCEPT', 'NOT_SUITABLE'];
```

### Pagination
- Returns 20 results per page
- `keepGoing = results.length === 20` — stop when a page returns < 20
- Use `seenIds` set to deduplicate across status folders

### Making direct GraphQL calls (no browser needed after capture)
```javascript
const https = require('https');
function makeGraphQL(query, variables, headers) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ...query, variables });
    const reqHeaders = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!['host', 'content-length'].includes(k.toLowerCase())) reqHeaders[k] = v;
    }
    reqHeaders['Content-Length'] = Buffer.byteLength(body);
    const req = https.request({ hostname: 'ph.employer.seek.com', path: '/graphql', method: 'POST', headers: reqHeaders }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
```

### Auth token expiry
**Tokens expire after ~11 minutes.** Before running GraphQL calls for each job, refresh cookies by navigating to that job's candidates page:
```javascript
await page.goto(`https://ph.employer.seek.com/candidates?jobid=${job.id}`, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5000);
const freshCookies = await page.cookies();
capturedHeaders = { ...capturedHeaders, cookie: freshCookies.map(c => `${c.name}=${c.value}`).join('; ') };
```
If you also capture a fresh `Applications` query from this navigation, update `capturedQuery` and `capturedVarTemplate` too.

---

## Key data fields from GraphQL response

Each result in `res.data.applications.result[]` contains:
- `firstName`, `lastName`
- `email`, `phone`
- `mostRecentJobTitle`, `mostRecentCompanyName`, `mostRecentRoleMonths`
- `appliedDateUtc`
- `statusFolder`
- `applicationId`, `candidateId`
- **`adcentreProspectId`** ← use this for the resume URL `selected` parameter (NOT `candidateId`)
- `metadata.result.hasResume`, `metadata.result.hasCoverLetter`
- `questionnaire.questions[]` — screening questions with `.text`, `.answers[]`, `.status` ('MATCH' = passed)
- `matchedQualities[]` — matched skill labels

---

## Resume downloads

### URL pattern (confirmed working)
```
https://ph.employer.seek.com/candidates?jobid={jobId}&selected={adcentreProspectId}&tab=resume
```
- `selected` = `adcentreProspectId` (NOT `applicationId`, NOT `candidateId`)
- This renders the candidate's full profile with resume tab active as an HTML page

### Page validation (REQUIRED before saving PDF)
The page is a React SPA — always validate before calling `page.pdf()`:
```javascript
async function navigateAndValidate(page, url, firstName, lastName) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(8000);  // React SPA needs ~8s to render — waitForFunction does NOT work here
  const text = await page.evaluate(() => document.body.innerText);
  const is404 = text.includes("couldn't find") || text.includes('Page not found');
  const hasName = text.includes(firstName) || text.includes(lastName);
  if (is404) return { ok: false, reason: '404 page' };
  if (!hasName) return { ok: false, reason: `name not found` };
  return { ok: true };
}
```

**Do NOT use `waitForFunction` on SEEK pages.** The SPA renders content client-side after network idle — `waitForFunction` times out even when the content is present. Use `sleep(8000)` instead.

### Saving as PDF
```javascript
await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
```

### Skip-on-fail, do NOT retry
If validation fails, skip that candidate and move on. Retrying the same URL in the same session will fail again (expired link, restricted profile). Retry separately after the main run.

---

## SPA rendering quirks

- After ANY navigation to a SEEK page, wait `sleep(8000)` before reading `document.body.innerText`
- `waitForFunction` is unreliable on this portal — the DOM updates happen after networkidle2
- `networkidle2` is fine as `waitUntil` for `page.goto()` — just add the 8s sleep after

---

## Caching pattern (for re-runs)

Save `candidates_raw.json` per job after GraphQL extraction. On subsequent runs, load from disk and skip re-extraction:
```javascript
const existingRaw = path.join(jobDir, 'candidates_raw.json');
if (fs.existsSync(existingRaw)) {
  allCandidates = JSON.parse(fs.readFileSync(existingRaw, 'utf8'));
} else {
  // ... GraphQL extraction ...
  fs.writeFileSync(existingRaw, JSON.stringify(allCandidates, null, 2));
}
```
**Caution:** If a previous run wrote an empty `candidates_raw.json` (due to auth failure), delete it before re-running.

---

## Output structure
```
applicants/
  {JobTitle}/
    candidates_raw.json        ← raw GraphQL results
    {Candidate_Name}/
      profile.json             ← structured candidate data
      profile.txt              ← human-readable summary
      resume.pdf               ← PDF of resume tab page
  extraction_log.json          ← summary: total, resumeOk, resumeSkipped, resumeFailed
```

---

## Edge cases
- **`hasResume: false`** — skip entirely, no resume URL will work
- **Name not found on page** — candidate profile may be restricted/expired; skip, retry later
- **`adcentreProspectId` missing from saved profile** — older script versions saved `adcentreCandidateId` instead. Re-fetch via GraphQL to get correct field.
- **All candidates in INBOX** — normal when jobs are newly posted and not yet triaged
- **Screening questions empty** — job may not have screening questions configured; not a bug

---

## How to re-run / add new jobs

1. Add job to `JOBS` array: `{ id: XXXXXXXX, title: 'Job_Title' }`
2. Delete `candidates_raw.json` for that job if you want fresh extraction
3. Chrome must be open at `http://127.0.0.1:9222` and logged into ph.employer.seek.com
4. Run: `node seek_final_extract.js`

Script is at: `C:/Users/TJatBICC/Documents/JobstreetOdooLink/seek_final_extract.js`
