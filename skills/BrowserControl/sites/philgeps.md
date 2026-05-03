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
