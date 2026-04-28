# SEEK Employer Portal — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Names, emails, passwords,
     API keys, account numbers, and PNRs belong in .env only. -->

## Status: ✅ Verified — 2026-04-28, extracted 4,097+ candidates across 57 jobs (active + expired) + incremental runs working

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
**Tokens expire after ~11 minutes.** Before running GraphQL calls for each job, navigate to that job's candidates page and **capture a fresh `Applications` request** — this refreshes both the auth token and the full query/variables template in one step:

```javascript
const freshReqs = [];
const refreshHandler = req => {
  if (req.url().includes('graphql') && req.method() === 'POST') {
    try {
      const p = JSON.parse(req.postData());
      if (p.operationName === 'Applications') freshReqs.push({ p, headers: req.headers() });
    } catch(e) {}
  }
  req.continue();
};
await page.setRequestInterception(true);
page.on('request', refreshHandler);
await page.goto(`https://ph.employer.seek.com/candidates?jobid=${job.id}`, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5000);
page.off('request', refreshHandler);
await page.setRequestInterception(false);

if (freshReqs.length > 0) {
  capturedHeaders      = freshReqs[0].headers;
  capturedQuery        = { query: freshReqs[0].p.query, operationName: freshReqs[0].p.operationName };
  capturedVarTemplate  = JSON.parse(JSON.stringify(freshReqs[0].p.variables));
}
```

**Why full re-capture instead of cookie-only:** The auth token is embedded in the request headers (`Authorization` or SEEK-specific header), not just in cookies. Re-capturing the full `Applications` request guarantees all auth material is fresh.

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
- Navigating to this URL opens the portal list view and opens the candidate panel on the right

### Download method — response interception (NOT page.pdf())

SEEK serves resume files as binary HTTP responses from `ph.employer.seek.com/attachment`. **Do NOT use `page.pdf()`** — it saves a screenshot of the browser UI (SEEK chrome + candidate panel), not the actual resume file.

The correct method is to intercept the `response` event for the attachment URL:

```javascript
async function downloadResume(page, jobId, prospectId) {
  return new Promise(async (resolve) => {
    let resolved = false;
    const done = (buf) => {
      if (!resolved) {
        resolved = true;
        page.off('response', responseHandler);
        resolve(buf);
      }
    };

    const responseHandler = async res => {
      const ct = res.headers()['content-type'] || '';
      const u = res.url();
      // SEEK uses application/pdf, application/octet-stream, OR binary/octet-stream
      const isPdf = ct.includes('application/pdf') || ct.includes('octet-stream');
      if (isPdf && u.includes('ph.employer.seek.com/attachment')) {
        try { done(await res.buffer()); } catch(e) { done(null); }
      }
    };

    page.on('response', responseHandler);

    try {
      await page.goto(
        `https://ph.employer.seek.com/candidates?jobid=${jobId}&selected=${prospectId}&tab=resume`,
        { waitUntil: 'networkidle2', timeout: 45000 }
      );
    } catch(e) {}

    if (!resolved) {
      // Wait for the candidate panel to render — waitForFunction IS reliable here
      try {
        await page.waitForFunction(
          () => {
            const t = document.body.innerText;
            return t.includes('went wrong') || t.includes('Resumé') || t.includes('Resume');
          },
          { timeout: 30000 }
        );
      } catch(e) {}
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!resolved) {
      // "Something went wrong displaying this file. Click here to download it"
      // The "here" link triggers a fresh attachment request — try clicking it
      try {
        const coords = await page.evaluate(() => {
          const link = [...document.querySelectorAll('a')].find(a =>
            a.innerText?.trim().toLowerCase() === 'here' &&
            document.body.innerText.includes('went wrong')
          );
          if (!link) return null;
          link.scrollIntoView({ block: 'center' });
          const r = link.getBoundingClientRect();
          return r.width > 0 ? { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) } : null;
        });
        if (coords) {
          await page.mouse.click(coords.x, coords.y);
          await new Promise(r => setTimeout(r, 15000));
        }
      } catch(e) {}
    }

    done(null);
  });
}
```

**Content-type variants** SEEK uses for attachment responses:
- `application/pdf` — most common
- `application/octet-stream` — used for some candidates
- `binary/octet-stream` — rare non-standard variant

Use `ct.includes('octet-stream')` to catch all three.

### "Something went wrong" — true failure vs. recoverable

The "Something went wrong displaying this file. Click **here** to download it" message means the embedded PDF viewer failed. Two outcomes:

- **Attachment URL returns 200** → the `here` click fires a PDF response → recoverable
- **Attachment URL returns 404** → file permanently deleted from SEEK servers → **true failure, unrecoverable**

HTTP 404 on `ph.employer.seek.com/attachment` = file is gone. Do not retry.

### Skip-on-fail, do NOT retry
If no PDF response is received, skip that candidate and move on. Retrying the same URL in the same session will fail again. A separate retry run may recover some failures — but if the attachment URL 404s, the file is deleted and no retry will work.

---

## SPA rendering quirks

- After `networkidle2`, the React candidate panel takes additional time to render. Use `waitForFunction` polling `document.body.innerText` for specific strings ("Resumé", "Resume", "went wrong") — it exits as soon as content appears, without wasting a fixed sleep.
- `waitForFunction` IS reliable on this portal when waiting for text to appear. Earlier guidance saying it was unreliable was incorrect.
- `networkidle2` is the correct `waitUntil` for `page.goto()` on this portal.

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

---

## Incremental extraction (new candidates only)

Use `applicationId` as the idempotency key. Any candidate whose `applicationId` already exists as a `profile.json` folder is skipped — no need to compare by name or date.

```javascript
function loadExistingAppIds(jobDir) {
  const ids = new Set();
  if (!fs.existsSync(jobDir)) return ids;
  for (const cDir of fs.readdirSync(jobDir).filter(d => fs.statSync(path.join(jobDir, d)).isDirectory())) {
    const pp = path.join(jobDir, cDir, 'profile.json');
    if (!fs.existsSync(pp)) continue;
    try {
      const p = JSON.parse(fs.readFileSync(pp, 'utf8'));
      if (p.applicationId) ids.add(String(p.applicationId));
    } catch {}
  }
  return ids;
}

// Then, after fetching allCandidates via GraphQL:
const existingIds = loadExistingAppIds(jobDir);
const newCandidates = allCandidates.filter(c => !existingIds.has(String(c.applicationId)));
```

Merge new entries into `candidates_raw.json` rather than overwriting — preserves the full history:
```javascript
let existingRaw = [];
if (fs.existsSync(rawPath)) {
  try { existingRaw = JSON.parse(fs.readFileSync(rawPath, 'utf8')); } catch {}
}
const existingRawIds = new Set(existingRaw.map(r => String(r.applicationId)));
for (const c of newCandidates) {
  if (!existingRawIds.has(String(c.applicationId))) existingRaw.push(c);
}
fs.writeFileSync(rawPath, JSON.stringify(existingRaw, null, 2));
```

**Outcome:** `applicationId` is stable — SEEK never reassigns it. A candidate who moves between status folders retains the same `applicationId`, so incrementals correctly skip them even if their folder changed.

Incremental script: `C:/Users/TJatBICC/Documents/JobstreetOdooLink/seek_incremental.js`
