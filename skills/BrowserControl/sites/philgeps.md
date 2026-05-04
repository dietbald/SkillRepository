# PhilGEPS Notices (notices.philgeps.gov.ph)

Status: verified 2026-05-02 — login, navigate by ref number, place an order, download Associated Components, log out.

Credentials in `.env`:
- `PHILGEPS_USERID`
- `PHILGEPS_PASSWORD`

## Login

URL: `https://notices.philgeps.gov.ph/GEPS/log-in.aspx`

```
input#userName  ·  input#password  ·  input#btnLogin
```

Successful submit redirects to `/GEPS/Tender/PendingTaskUI.aspx?EPSSubMenuID=45` (Pending Tasks dashboard).

The Logged-in username appears at the top right (often the contact person on the org's PhilGEPS profile, NOT the company name) — useful as a logged-in marker for `ensureLoggedIn`.

## Top nav — image-based postback

The six top tabs are images wrapped in `<a href="javascript:__doPostBack('ctlNN$LoginMenu1','N')">`. **The `ctlNN` prefix changes between pages** (seen `ctl01` on the dashboard, `ctl03` on notice detail) — match by the stable `$LoginMenu1','N'` suffix, not the prefix.

| N | Tab | Image fragment |
|---|---|---|
| 1 | My PhilGEPS | `menu_mygeps_sel` |
| 2 | My Organization | `menu_myorg` |
| 3 | My Profile | `menu_myprofile` |
| 4 | Opportunities | `menu_opp` |
| 5 | Directory | `menu_dir` |
| 6 | About PhilGEPS | `menu_about` |

```javascript
// Robust across pages — find the live href and call its postback
const args = await page.evaluate((tabN) => {
  const a = [...document.querySelectorAll('a')]
    .find(x => new RegExp(`\\$LoginMenu1','${tabN}'`).test(x.getAttribute('href') || ''));
  if (!a) return null;
  const m = a.getAttribute('href').match(/__doPostBack\('([^']+)','([^']*)'\)/);
  return m ? [m[1], m[2]] : null;
}, '4');
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
  page.evaluate((t, a) => __doPostBack(t, a), ...args),
]);
```

(General "image-based nav" recipe is in skill.md.)

## Membership tier gates

Org Profile shows `Registration Type: Red | Blue | Platinum`. Most read features (View Certificate, View History, Bank Account, Document Library) require **Blue or Platinum** — Red accounts get an "Information Page" error popup. PCAB upload viewing is gated this way too.

## Finding a notice by reference number

1. Click Opportunities tab → lands on `OpportunitiesCatAgencySearchUI.aspx` (category browse).
2. Click the **Search** sub-link (top-right `Search | Detailed Search | View By Category | View By Agency`) — exposes a single-keyword search at the top of the results listing.
3. Type the numeric refID into that simple Search box and submit.
4. The matching row's title link href is the canonical notice URL:

   ```
   /GEPS/Tender/BidNoticeAbstractUI.aspx?DirectFrom=OpenOpp&refID=<N>&highlight=true
   ```

**Don't use Detailed Search** for ref-number lookup — the publish-date filter defaults narrow to the last 3 months and silently exclude older matches. Don't guess deep-link URLs either: `InitialBidGeneralInfoUI.aspx?refID=…` and `Notice_Abstract_UI.aspx?refID=…` both redirect to ErrorPage.aspx.

If a notice isn't in **Open Opportunities**, repeat the same search inside **Former Opportunities** (closed bids) and **Award Notices** (post-award).

**Detecting bid status from the abstract** — the `Status` cell on `BidNoticeAbstractUI.aspx` shows `Active` (open, can place orders) or `Closed` (must use the closed-bid extraction path below). Don't assume from the closing date — bid status is set by procurement workflow, not date arithmetic.

## Closed-bid extraction (NO order placement needed)

For bids with `Status: Closed`, the order flow is gone — clicking Continue/Submit will fail because `input#btnCont` doesn't exist. But documents are still accessible directly.

Path:
1. From the abstract, click `lbtnNosOfAssoc` postback (same as open bids)
2. Lands on `/GEPS/Tender/ViewBidNoticeAssocCompUI.aspx?DirectFrom=…&refID=N&...` (NOT the order basket)
3. Component name is rendered as a postback link `dgDocs$ctlNN$docNameLinkButton` — clicking streams the PDF directly

```javascript
// After login, on a closed bid abstract:
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
  page.evaluate(() => __doPostBack('lbtnNosOfAssoc', '')),
]);
await sleep(4000);
// Now on ViewBidNoticeAssocCompUI; click each component name
const before = new Set(fs.readdirSync(DOCS_DIR));
const coords = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')]
    .find(x => x.id?.startsWith('dgDocs') && x.id.endsWith('docNameLinkButton') && x.offsetParent !== null);
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
await page.mouse.click(coords.x, coords.y);
// File arrives named "<solicitation-number>.pdf" via Content-Disposition
```

This path is **faster than the open-bid order flow** (no Continue/Submit/OrderID round-trips) and is the right approach when archive-mining historical bids.

**`AwardNoticeLink` returning "No award notices found"** is NOT a signal that the bid is still open — many closed-but-not-yet-awarded notices show empty award lists. Use the `Status` field on the abstract instead.

## Per-agency upload completeness

Whether `Status: Closed` notices have a real PDF in `lbtnNosOfAssoc` depends on the **procuring agency**, not on PhilGEPS:

| Agency type | Typical behavior |
|---|---|
| **DPWH District Engineering Offices** | Stub component on PhilGEPS; real bid docs only on dpwh.gov.ph (see `dpwh.md`) |
| **Province / City / Municipal LGUs** (e.g. Province of Iloilo PEO, Municipality of Dumangas) | Full bid docs uploaded to PhilGEPS — the `dgDocs$ctl02$docNameLinkButton` link returns the real PDF |
| **DepEd / DOH / DOST regional offices** | Mixed — try PhilGEPS first |
| **National attached agencies (NIA, BPI)** | Usually full upload to PhilGEPS |

When uncertain, click the component name first; if you get HTML instead of `application/pdf` within 5s, fall back to the agency portal.

## Order Associated Components — full flow

On the notice abstract page, the "Associated Components" block has a single `Order` link:

```
javascript:__doPostBack('lbtnNosOfAssoc','')
```

Clicking it navigates to `/GEPS/R4/R3_BidSubmission_BidMatches.html?p=ob` — the **Order Basket**. Steps from there:

1. **Order Basket** — shows the line item with Price, Day(s) Left, etc. Click the title (which is an `<a>` with the notice title) to load the per-component details.
2. **Order Associated Documents** — lists each component (IB, ITB A, ITB B, ITB C, Bill of Quantities, etc.) with `Delivery Method = Download`. Click `Continue` (`input#btnCont`).
3. **Order Confirmation** — review summary + click `Submit` (the `input` whose value is `Submit`). This generates an `OrderID` (visible in the URL: `OrderConfirmationUI.aspx?...&OrderID=<NNNNNNNN>`). Save this — it's the order receipt number.
4. **Order Summary** (post-submit) — only NOW do the per-component links become real `__doPostBack('ctlNN','')` handlers that stream the file. Pre-Submit links are `javascript:PassValue(componentID, ...)` stubs that don't download.

```javascript
// CDP download capture before clicking
const client = await page.target().createCDPSession();
await client.send('Browser.setDownloadBehavior', {
  behavior: 'allow', downloadPath: DOCS_DIR, eventsEnabled: true,
});

for (const label of ['IB', 'ITB A', 'ITB B', 'ITB C', 'Bill of Quantities']) {
  const before = new Set(fs.readdirSync(DOCS_DIR));
  await page.evaluate((l) => {
    const a = [...document.querySelectorAll('a')].find(x => x.innerText?.trim() === l && x.offsetParent !== null);
    if (a) a.click();
  }, label);
  // Poll for the new .pdf — files arrive named "<Label>.pdf"
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const fresh = fs.readdirSync(DOCS_DIR).filter(f => !before.has(f) && !f.endsWith('.crdownload'));
    if (fresh.length) break;
  }
}
```

Files are served as PDFs named exactly after the label (`IB.pdf`, `ITB A.pdf`, `Bill of Quantities.pdf`).

## Document Request List (DRL) — who else ordered the docs

On the notice abstract page, the row labelled "Document Request List" has a number link (`<a id="lbtnNosOfDRL">N</a>`) where N is the count of bidders who've ordered. After your own order is submitted, N includes you — useful sanity-check that the order landed.

**Two ways to open the list — both work:**
- Postback: `await page.evaluate(() => __doPostBack('lbtnNosOfDRL', ''))`
- Direct URL: `https://notices.philgeps.gov.ph/GEPS/Tender/ViewDocumentRequestList.aspx?directFrom=OpenOpp&refID=<N>` (one of the rare PhilGEPS deep-links that actually works)

The `ViewDocumentRequestList.aspx` page is a single column showing only **Organization Name** — no contact, no PCAB class, no order timestamp, no address. The order numbers (1..N) reflect the order in which document requests were placed. To get more bidder detail, cross-reference org names against the public Directory tab (or the `services.dti.gov.ph/pcab` portal).

```javascript
const drl = await page.evaluate(() => {
  const tbl = [...document.querySelectorAll('table')].find(t =>
    /Organization Name/i.test(t.querySelector('th, td')?.innerText || ''));
  return [...(tbl?.querySelectorAll('tr') || [])].slice(1)
    .map(tr => tr.querySelectorAll('td')[1]?.innerText?.trim())
    .filter(Boolean);
});
```

The same `lbtnNosOf<X>` pattern likely covers other counters on the abstract (`lbtnNosOfAssoc` for Associated Components, `lbtnNosOfBidSupp` for Bid Supplements). The numeric count IS the link text — don't filter for the label "Document Request List" when finding the anchor.

## "Bidding Documents" component is often a stub for DPWH notices

For DPWH District Engineering Office notices (especially Iloilo DEOs), the "Bidding Documents" / "BIDDING DOCUMENTS" entry under Associated Components frequently fails to stream — the postback fires, server returns the same HTML page (no `Content-Disposition: attachment`, no error), and no file lands. Smaller addenda (BAC Resolutions, supplements) on the same order DO download cleanly.

This is a server-side upload gap on PhilGEPS: DPWH only registers the notice metadata + small addenda there. The full bidding-documents PDF lives on the DPWH portal at:
```
https://www.dpwh.gov.ph/dpwh/sites/default/files/webform/civil_works/advertisement/<solnumber>_-_<slug>.pdf
```
Use `sites/dpwh.md` to retrieve it (Imperva-walled, needs hCaptcha solve). Discover the exact `<slug>` via Google `site:dpwh.gov.ph <solnumber>` — the DPWH listing pages are paginated and miss results.

Don't keep retrying the PhilGEPS postback with longer timeouts. A `200 text/html` (no attachment header) within 5 seconds means it's never coming.

**BAC Resolutions are often byte-identical across sibling solicitations.** A DEO that publishes 5 bid packages in the same week typically reuses the same `BAC Resolution No. NN.pdf` on all of them — same SHA, same size. If batch-downloading from one agency, dedupe by content hash to save bytes.

## One login covers many sequential orders

Inside a single PhilGEPS session you can place arbitrarily many orders without re-authentication or rate-limit. Verified across 9 sequential `BidNoticeAbstractUI → Order → Continue → Submit` flows on the same login. Only re-login if the script restarts Chrome — and remember the always-logout rule before exit.

## Award notice — full bid result extraction (winner, all bidders, DQ reasons)

When a bid is awarded, the Award Notice Abstract carries the high-level fields (awardee, contract amount, dates) and the **BAC Resolution PDFs** carry the full bid-opening abstract: every bidder who submitted, their bid amount, and any disqualifications with reasons.

### Step 1 — Get the AwardID from the notice abstract
On `BidNoticeAbstractUI.aspx?refID=N`, click the `Award Notice` link → lands on `ViewAwardNoticesListUI.aspx?refID=N`. The Title column has a link to:
```
/GEPS/R4/R3_AwardNotice_AwardAbstract.html?RefID=<ref>&LineItemID=1&OrgID=<org>&AwardID=<award>&DF=&uOrgId=
```

Empty award list (`No award notices found`) is **not** a reliable failure signal — bids may be in post-qualification with the award not yet posted. Wait or check iloilo.gov.ph (or equivalent procuring-entity portal) before declaring failure.

### Step 2 — Parse structured fields from the abstract page
`document.body.innerText` reveals every field as `Label:` followed by value on next line. Useful keys: `Awardee:`, `Address:`, `Contract Amount:`, `Award Date:`, `Proceed Date:`, `Contract End Date:`, `Contract No.:`, `Reason For Award:`, `Approved Budget:`.

### Step 3 — Get every attached document via the JSON tree endpoint

**Don't** click the "View Documents" count and harvest URLs — only the first row click fires a download URL; subsequent clicks update the inline PDF viewer without re-firing XHR.

**Don't** assume FileIDs are sequential from the first one — they are **globally sequential across all PhilGEPS uploads from all agencies**, so `+1, +2, +3` will land on unrelated agencies' files (verified: tried this and got DepEd-Bukidnon office supplies + Amang-Rodriguez Medical Center docs interleaved with the target award).

**Do** hit the JSON endpoint directly. Click the count once to trigger the AJAX, then capture the response, OR call the endpoint yourself:

```javascript
// Same-session in-page fetch — uses live cookies + xnode (sniff once to learn xnode-NN)
const treeJson = await page.evaluate(async (awardID) => {
  const u = `https://notices.philgeps.gov.ph/p4_webservices/GEPSR3_AwardNotice.asmx/AwardAbstract_GetListAwardDocAndCategory?awardID=${awardID}&module=%22all%22&node=xnode-180`;
  const r = await fetch(u, { credentials: 'include' });
  return await r.text();
}, awardID);

const data = JSON.parse(treeJson).d;   // .NET wraps in { d: [...] }
const files = [];
const walk = (nodes, parentCategory) => {
  for (const n of nodes) {
    if (n.leaf && n.FileID) files.push({
      category: parentCategory,        // 'Notice Of Award' | 'BAC Resolution' | 'Notice to Proceed' | 'Signed Contract'
      name: n.DocumentName,
      fileID: n.FileID,
      awardDocID: n.ANAwardDocID,
    });
    if (n.children) walk(n.children, n.DocumentName);
  }
};
walk(data, '(root)');
```

The endpoint returns nested `AwardNoticeDocumentsBO` records: top-level groups (NOA / BAC Resolution / NTP / Signed Contract) with `leaf:false`, each containing `children:[{leaf:true, FileID, DocumentName, ANAwardDocID}]`. Same agency may upload duplicate batches (BAC sometimes uploads RESO 1/2/3 twice with different FileIDs but identical bytes) — dedupe by content hash if storage matters.

### Step 4 — Fetch each FileID via the FileDownloadHandler

```javascript
for (const f of files) {
  const url = `https://notices.philgeps.gov.ph/p4_webservices/Handlers/GEPSR3_FileDownloadHandler.ashx?ID=${f.fileID}&Convert=1&Download=0&IsWatermarked=0`;
  const r = await page.evaluate(async (u) => {
    const resp = await fetch(u, { credentials: 'include' });
    const ab = await resp.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return { status: resp.status, b64: btoa(bin) };
  }, url);
  fs.writeFileSync(`${dir}/${f.category}__${f.name}`, Buffer.from(r.b64, 'base64'));
}
```

### Step 5 — BAC Resolution is image-only PDF — OCR to extract bidders

The BAC Resolution scans are JPG-converted-to-PDF (named `.jpg` but Content-Type `application/pdf`). PyMuPDF + tesseract recipe (in skill.md → "OCR image-only PDFs") gets you the structured fields:

- All firms that purchased bid documents
- All bidders who submitted at the bid opening + their bid amounts
- Bidders who failed at Opening of Bids (DQ reasons spelled out — e.g. "Omnibus Sworn Statement contains a discrepancy. The stated project title…")
- Post-qualified LCRB declared winner

The Resolution typically spans 2-3 pages: page 1 = list of doc-purchasers + bid-opening read-out + DQ reasons; page 2 = post-qualification result + LCRB declaration; page 3 = governor's approval.

## ALWAYS log out before disconnect

PhilGEPS rejects a fresh login while another session is open for the same user — the next BrowserControl run will fail to authenticate. Click `Log-out` (top-right, with hyphen) and confirm the redirect to `/GEPS/log-in.aspx` before `browser.disconnect()`.

```javascript
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
  page.evaluate(() => {
    const link = [...document.querySelectorAll('a')]
      .find(a => /^(»\s*)?Log[-\s]?out$/i.test((a.innerText || '').trim()));
    if (link) link.click();
  }),
]);
// Verify
if (!/log-in\.aspx/.test(page.url())) console.warn('[logout failed]', page.url());
```

## Notice page field map (for parsing)

The notice abstract is a key-value layout where labels and values are in separate cells. Useful keys:

| Field | Where | Notes |
|---|---|---|
| Reference Number | header | matches the `refID` query param |
| Solicitation Number | first key-value block | agency-issued label, e.g. `INFRA2026-009` |
| Procuring Entity | header | LGU / NGA name |
| Approved Budget for the Contract | first block | `PHP N,NNN,NNN.00` |
| Closing Date / Time | first block | `DD/MM/YYYY HH:MM AM/PM` (note PH date format) |
| Status | right column of header | `Active` / `Closed` / `Cancelled` |
| Document Request List | row near bottom-right | integer count of bidders who've ordered docs |
| Bid Supplements | row near bottom-right | integer; nonzero = amendments to fetch |

Whole body parses cleanly via `document.body.innerText` and line-splitting — no iframes.

## Gotchas

- **Auto Update checkbox** in the order basket is checked by default — leave it; it's how PhilGEPS notifies the bidder of bid supplements / amendments to this notice.
- **Submit a confirmation dialog**: the post-Continue Submit step may pop a `confirm()` dialog. Always register `page.on('dialog', d => d.accept())` before clicking.
- **Day(s) Left** on a notice counts calendar days to closing — if it shows 0 or negative, downloading still works but bidding is closed.
- **OrderID** is unique per Order, NOT per refID — re-ordering the same notice issues a new OrderID. The procuring entity sees one Document Request entry per OrderID, so don't spam orders.
