# OSINT Intelligence Report — Person, Company, Entity, or Political Figure

Comprehensive open-source intelligence report using every available tool, registry, database, and technique. Covers person research, corporate intelligence, beneficial ownership, financial filings, social media, digital infrastructure, political figure tracking, and more — structured by target type and country module.

Sources: PAI v4.0.3, Bellingcat, IntelTechniques, OSINT Framework, ctf-skills, joysafeter, riksdagsmonitor, TraceLabs.

---

## Usage

```
/person-intel "<Name or Company>" [type:person|company|political|both] [email:<email>] [phone:<phone>] [username:<handle>] [vat:<vat_number>] [countries:be,th,nl,fr,uk,us,de,lu,se] [output:/path/to/report.docx]
```

**Examples:**
```
/person-intel "John Smith" type:person email:john@example.com phone:+32478123456 countries:be,th
/person-intel "ACME NV" type:company vat:0401296522 countries:be,nl
/person-intel "Arno Pradolini" type:both username:arnopradolini countries:be,th
/person-intel "Fredrik Reinfeldt" type:political countries:se,eu
/person-intel "Shell BV" type:company countries:nl,uk,us output:/tmp/shell_report.docx
```

---

## Parse Arguments

Extract from `$ARGUMENTS`:
- **target**: name/company in quotes
- **type**: `person`, `company`, `political`, or `both` (default: `both`)
- **email**, **phone**, **username**, **vat**: seed identifiers
- **countries**: comma-separated ISO codes (default: `be,th,nl,fr,uk`)
- **output**: docx path (default: `/tmp/intel_<slug>.docx`)

Derive `firstname`, `lastname`, `slug`, `email_domain` from target.

---

## Source Reliability Rating (NATO Admiralty Code)

Apply to every finding in the final report:

**Source reliability (A–F):**
- A = Completely Reliable (official government records, primary registries)
- B = Usually Reliable (established media, verified aggregators like Northdata)
- C = Fairly Reliable (secondary sources with known limitations)
- D = Not Usually Reliable (unverified, single-source)
- E = Unreliable (known bias; use only when corroborated)
- F = Cannot Be Judged (new/unknown source)

**Information credibility (1–6):**
- 1 = Confirmed by multiple independent sources
- 2 = Probably true (corroborated)
- 3 = Possibly true (consistent with known facts)
- 4 = Doubtful (contradicts other information)
- 5 = Improbable
- 6 = Cannot be judged

---

## PIPELINE

Execute all phases. Skip phases not applicable to the target type.

---

### PHASE 0 — Install CLI Tools

```bash
which sherlock     2>/dev/null || pipx install sherlock-project
which maigret      2>/dev/null || pip install maigret --quiet
which holehe       2>/dev/null || pip3 install holehe --quiet
which h8mail       2>/dev/null || pip3 install h8mail --quiet
which phoneinfoga  2>/dev/null || pip3 install phoneinfoga --quiet 2>/dev/null || true
which theHarvester 2>/dev/null || pip3 install theHarvester --quiet 2>/dev/null || true
which exiftool     2>/dev/null || sudo apt-get install -y libimage-exiftool-perl 2>/dev/null || true
which subfinder    2>/dev/null || go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest 2>/dev/null || true
which httpx        2>/dev/null || go install github.com/projectdiscovery/httpx/cmd/httpx@latest 2>/dev/null || true
which nuclei       2>/dev/null || go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest 2>/dev/null || true
which amass        2>/dev/null || go install github.com/owasp-amass/amass/v4/...@master 2>/dev/null || true
which gau          2>/dev/null || go install github.com/lc/gau/v2/cmd/gau@latest 2>/dev/null || true
```

---

### PHASE 1 — CLI OSINT Tools (Person)

```bash
# Username search: 400+ social networks
sherlock "<username_or_firstnamelastname>" --output /tmp/sherlock_<slug>.txt 2>&1 | tail -30
sherlock "<firstname>.<lastname>"          --output /tmp/sherlock2_<slug>.txt 2>&1 | tail -10
sherlock "<firstname><lastname>"           --output /tmp/sherlock3_<slug>.txt 2>&1 | tail -10
sherlock "<firstname>_<lastname>"          --output /tmp/sherlock4_<slug>.txt 2>&1 | tail -10

# Username search: 3,000+ sites with metadata + report generation
maigret "<username>" --html --pdf -o /tmp/maigret_<slug>/ 2>&1 | tail -20

# Email: which 120+ platforms is this email registered on
holehe <email> 2>&1 | tee /tmp/holehe_<slug>.txt

# Email: breach hunting
h8mail -t <email> 2>&1 | tee /tmp/h8mail_<slug>.txt

# Domain: harvest emails, names, IPs from email domain
theHarvester -d <email_domain> -b duckduckgo,bing,linkedin -l 100 -f /tmp/harvester_<slug> 2>&1 | tail -20

# Phone: carrier, line type, OSINT footprinting
phoneinfoga scan -n "<phone>" 2>&1 | tee /tmp/phoneinfoga_<slug>.txt

# Image metadata extraction (run on any discovered photos)
exiftool <image_file> 2>/dev/null
```

---

### PHASE 2 — Free API Lookups

```bash
# GitHub: profile data (email, bio, location often exposed)
curl -s "https://api.github.com/users/<username>" | python3 -m json.tool

# GitHub: extract emails from public commits
curl -s "https://api.github.com/users/<username>/events/public" | python3 -c "
import json,sys; events=json.load(sys.stdin)
for e in events[:20]:
    if e.get('type')=='PushEvent':
        for c in e.get('payload',{}).get('commits',[]):
            print('commit email:', c.get('author',{}).get('email'),'name:', c.get('author',{}).get('name'))
"

# Reddit profile
curl -s "https://www.reddit.com/user/<username>/about.json" -A "osint-research" | python3 -m json.tool

# BlueSky (no auth required)
curl -s "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=<handle>.bsky.social" | python3 -m json.tool
curl -s "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=<target>&sort=latest" | python3 -m json.tool
curl -s "https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors?q=<name>" | python3 -m json.tool

# Email reputation
curl -s "https://emailrep.io/<email>" | python3 -m json.tool

# HIBP breach check
curl -s -H "hibp-api-key: <key_if_available>" \
  "https://haveibeenpwned.com/api/v3/breachedaccount/<email>" | python3 -m json.tool

# Tumblr: confirms blog existence even when API returns 401
curl -sI "https://<username>.tumblr.com" | grep -i "x-tumblr-user"
# Avatar (confirms account): https://<username>.tumblr.com/avatar/512

# Phone: carrier and line type
curl -s "http://apilayer.net/api/validate?access_key=<key_if_available>&number=<phone>&format=1" | python3 -m json.tool

# Global LEI lookup (free, no auth)
curl -s "https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=<company_name>" | python3 -m json.tool

# OpenCorporates officer + company search
curl -s "https://api.opencorporates.com/v0.4/officers/search?q=<name>" | python3 -m json.tool
curl -s "https://api.opencorporates.com/v0.4/companies/search?q=<company_name>" | python3 -m json.tool

# ICIJ Offshore Leaks (Panama/Pandora Papers)
curl -s "https://offshoreleaks.icij.org/api/search?q=<name>&c=&j=&d=" | python3 -m json.tool

# OpenSanctions (331+ sanctions lists aggregated)
curl -s "https://api.opensanctions.org/search?q=<name>&schema=Thing&limit=10" | python3 -m json.tool

# ProPublica Nonprofits (US IRS 990 data)
curl -s "https://projects.propublica.org/nonprofits/api/v2/search.json?q=<name>" | python3 -m json.tool

# VAT validation: EU VIES
curl -s "https://isvat.appspot.com/<cc>/<vat_number>" | python3 -m json.tool
# UK HMRC VAT lookup
curl -s "https://api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/<vat>" | python3 -m json.tool

# crt.sh: SSL certificates (reveals subdomains, related domains, organization names)
curl -s "https://crt.sh/?q=<domain_or_company>&output=json" | \
  python3 -c "import json,sys; certs=json.load(sys.stdin); [print(c.get('name_value')) for c in certs[:40]]"

# Wayback Machine CDX API: URL history, deleted pages, historical profile snapshots
curl -s "http://web.archive.org/cdx/search/cdx?url=<domain>/*&output=json&fl=original,timestamp,statuscode&limit=30"
# t.co shortlink recovery (find old Twitter usernames from archived tweets)
curl -s "http://web.archive.org/cdx/search/cdx?url=t.co/<shortcode>&output=json"
# Twitter profile image history
curl -s "http://web.archive.org/cdx/search/cdx?url=pbs.twimg.com/profile_images/<user_id>/*&output=json"

# IP geolocation
curl -s "http://ip-api.com/json/<ip_address>"
curl -s "https://ipinfo.io/<ip_address>/json"

# USAspending: US federal contracts
curl -s "https://api.usaspending.gov/api/v2/search/spending_by_award/" \
  -H "Content-Type: application/json" \
  -d '{"filters":{"keyword":"<name>"},"fields":["Recipient Name","Award Amount","Award Type"],"limit":10}' | python3 -m json.tool

# France SIRENE (free, no auth)
curl -s "https://recherche-entreprises.api.gouv.fr/search?q=<company_name>&per_page=5" | python3 -m json.tool

# GLEIF ownership chain (direct + ultimate parent)
curl -s "https://api.gleif.org/api/v1/lei-records/<lei>/direct-parents" | python3 -m json.tool
curl -s "https://api.gleif.org/api/v1/lei-records/<lei>/ultimate-parents" | python3 -m json.tool
```

---

### PHASE 3 — Puppeteer Scraping Script

Create `/tmp/scrape_intel_<slug>.js` with puppeteer-extra + stealth:

```js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const TIMEOUT = 45000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ddgSearch(browser, query, label) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(TIMEOUT);
  try {
    console.log(`\n=== DDG [${label}]: ${query} ===`);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await sleep(2500);
    console.log((await page.evaluate(() => document.body.innerText)).slice(0, 12000));
  } catch(e) { console.log(`FAILED: ${e.message}`); }
  finally { await page.close(); }
}

async function fetchPage(browser, url, label) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(TIMEOUT);
  try {
    console.log(`\n=== FETCH [${label}]: ${url} ===`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await sleep(4000);
    console.log('URL:', page.url());
    console.log((await page.evaluate(() => document.body.innerText)).slice(0, 20000));
  } catch(e) { console.log(`FAILED: ${e.message}`); }
  finally { await page.close(); }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
    protocolTimeout: 60000,
  });
  try {
    // INSERT ALL APPLICABLE BLOCKS BELOW
  } finally { await browser.close(); }
})();
```

Run: `node /tmp/scrape_intel_<slug>.js 2>&1 | tee /tmp/scrape_<slug>.log`

---

#### ALWAYS: General Web

```js
await ddgSearch(browser, '"Firstname Lastname"', 'name-raw');
await ddgSearch(browser, '"Firstname Lastname" company OR director OR CEO OR owner OR founder', 'name-professional');
await ddgSearch(browser, '"Firstname Lastname" family OR children OR spouse OR partner OR relative', 'name-family');
await ddgSearch(browser, '"Firstname Lastname" email OR phone OR contact OR address', 'name-contact');
await ddgSearch(browser, '"Lastname" genealogy OR ancestry OR "family tree" OR stamkunde', 'surname-genealogy');
await ddgSearch(browser, '"Firstname Lastname" lawsuit OR fraud OR investigation OR scandal OR conviction', 'name-risk');

// Bing — often surfaces more Facebook/LinkedIn than Google
await fetchPage(browser, 'https://www.bing.com/search?q=%22Firstname+Lastname%22', 'bing-name');

// Yandex — better for Eastern European content and face matching
await fetchPage(browser, 'https://yandex.com/search/?text=Firstname+Lastname', 'yandex-name');

// Wikidata + Wikisage
await fetchPage(browser, 'https://www.wikidata.org/w/index.php?search=Firstname+Lastname', 'wikidata');
await ddgSearch(browser, '"Firstname Lastname" site:wikisage.org', 'wikisage');
```

---

#### ALWAYS: Social Media (no-login public access)

```js
// LinkedIn
await ddgSearch(browser, '"Firstname Lastname" site:linkedin.com/in/', 'linkedin');
await ddgSearch(browser, '"Firstname Lastname" site:linkedin.com', 'linkedin-all');

// Facebook
await fetchPage(browser, 'https://www.facebook.com/public/Firstname-Lastname', 'facebook-public');
await ddgSearch(browser, '"Firstname Lastname" site:facebook.com', 'facebook-ddg');

// Instagram
await fetchPage(browser, 'https://www.instagram.com/firstnamelastname/', 'instagram-slug1');
await fetchPage(browser, 'https://www.instagram.com/firstname.lastname/', 'instagram-slug2');
await fetchPage(browser, 'https://www.instagram.com/firstname_lastname/', 'instagram-slug3');
await ddgSearch(browser, '"Firstname Lastname" site:instagram.com', 'instagram-ddg');

// TikTok
await fetchPage(browser, 'https://www.tiktok.com/@firstnamelastname', 'tiktok-direct');
await fetchPage(browser, 'https://www.tiktok.com/@firstname.lastname', 'tiktok-dot');
await ddgSearch(browser, '"Firstname Lastname" site:tiktok.com', 'tiktok-ddg');

// Twitter/X — use Nitter mirrors (no login required)
await fetchPage(browser, 'https://xcancel.com/firstnamelastname', 'twitter-nitter');
await ddgSearch(browser, '"Firstname Lastname" site:twitter.com OR site:x.com', 'twitter-ddg');

// Twitter username history recovery
await ddgSearch(browser, '"Firstname Lastname" site:memory.lol', 'twitter-username-history');
// Twitter Syndication API (no auth — returns public timeline data)
// curl -s "https://syndication.twitter.com/srv/timeline-profile/screen-name/<username>"

// BlueSky
await fetchPage(browser, 'https://bsky.app/profile/firstnamelastname.bsky.social', 'bluesky-direct');

// YouTube
await ddgSearch(browser, '"Firstname Lastname" site:youtube.com', 'youtube');

// Reddit
await fetchPage(browser, 'https://www.reddit.com/search/?q=%22Firstname+Lastname%22&type=user', 'reddit');
await ddgSearch(browser, '"Firstname Lastname" site:reddit.com', 'reddit-ddg');

// Snapchat, Pinterest
await fetchPage(browser, 'https://www.snapchat.com/add/firstnamelastname', 'snapchat');
await fetchPage(browser, 'https://www.pinterest.com/firstnamelastname/', 'pinterest');

// Tumblr
await fetchPage(browser, 'https://www.tumblr.com/search/firstname+lastname', 'tumblr-search');
await fetchPage(browser, 'https://firstnamelastname.tumblr.com', 'tumblr-direct');

// Mastodon search (federated)
await ddgSearch(browser, '"Firstname Lastname" site:mastodon.social OR site:fosstodon.org', 'mastodon');

// GitHub
await fetchPage(browser, 'https://github.com/search?q=Firstname+Lastname&type=users', 'github-users');
await ddgSearch(browser, '"Firstname Lastname" site:github.com', 'github-ddg');
```

---

#### ALWAYS: Dating Sites

```js
await fetchPage(browser, 'https://www.usersearch.org/search?username=firstnamelastname', 'usersearch-dating');
await fetchPage(browser, 'https://badoo.com/en/search/?q=Firstname+Lastname', 'badoo');
await ddgSearch(browser, '"Firstname Lastname" site:pof.com', 'pof');
await ddgSearch(browser, '"Firstname Lastname" site:okcupid.com', 'okcupid');
await ddgSearch(browser, '"Firstname Lastname" site:badoo.com OR site:tagged.com OR site:meetme.com', 'dating-multi');
// Also: Cheaterbuster (paid) for Tinder search by name/age/location
```

---

#### ALWAYS: People Search Aggregators

```js
await fetchPage(browser, 'https://www.whitepages.com/name/Firstname-Lastname', 'whitepages');
await fetchPage(browser, 'https://radaris.com/p/Firstname/Lastname/', 'radaris');
await fetchPage(browser, 'https://www.peekyou.com/Firstname_Lastname', 'peekyou');
await fetchPage(browser, 'https://www.fastpeoplesearch.com/name/Firstname-Lastname', 'fastpeoplesearch');
await fetchPage(browser, 'https://www.zabasearch.com/query.php?stype=1&sfirst=Firstname&slast=Lastname', 'zabasearch');
await fetchPage(browser, 'https://www.spokeo.com/Firstname-Lastname', 'spokeo-preview');
await fetchPage(browser, 'https://www.peoplefinders.com/name/Firstname-Lastname', 'peoplefinders');

// LocateFamily — CRITICAL for expats/retirees abroad (incl. Thailand, Philippines, SE Asia).
// URL pattern: first 3 letters of surname uppercased as directory, then full SURNAME.html
// e.g. "Pradolini" → /PRA/PRADOLINI.html ; "Smith" → /SMI/SMITH.html
await fetchPage(browser, 'https://www.locatefamily.com/[FIRST3]/[SURNAME_UPPER].html', 'locatefamily-surname');
// Also try Bing — LocateFamily pages rank highly on Bing but not always DDG
await fetchPage(browser, 'https://www.bing.com/search?q=%22Firstname+Lastname%22+site:locatefamily.com', 'bing-locatefamily');
```

---

#### ALWAYS: Company Global Research

```js
await ddgSearch(browser, '"Company Name"', 'company-raw');
await ddgSearch(browser, '"Company Name" director OR owner OR shareholder OR founder', 'company-leadership');
await ddgSearch(browser, '"Company Name" annual report OR revenue OR turnover OR profit', 'company-financials');
await ddgSearch(browser, '"Company Name" lawsuit OR fraud OR investigation OR fine OR penalty', 'company-risk');
await ddgSearch(browser, '"Company Name" acquisition OR merger OR subsidiary OR holding', 'company-structure');
await ddgSearch(browser, '"Company Name" government contract OR tender OR awarded', 'company-contracts');

// Northdata global
await fetchPage(browser, 'https://www.northdata.com/search?query=Company+Name', 'northdata-global');

// OpenCorporates
await fetchPage(browser, 'https://opencorporates.com/companies?q=Company+Name', 'opencorporates-companies');
await fetchPage(browser, 'https://opencorporates.com/officers?q=Firstname+Lastname', 'opencorporates-officers');

// ICIJ Offshore Leaks (Panama/Pandora Papers, Bahamas Leaks)
await fetchPage(browser, 'https://offshoreleaks.icij.org/search?q=Company+Name', 'icij-company');
await fetchPage(browser, 'https://offshoreleaks.icij.org/search?q=Firstname+Lastname', 'icij-person');

// OpenSanctions
await fetchPage(browser, 'https://www.opensanctions.org/search/?q=Firstname+Lastname', 'opensanctions');

// Crunchbase + PitchBook
await fetchPage(browser, 'https://www.crunchbase.com/search/organizations/field/organizations/facet_ids/Company+Name', 'crunchbase');
await ddgSearch(browser, '"Company Name" site:crunchbase.com OR site:pitchbook.com OR site:angellist.com', 'vc-intel');

// LittleSis (US power mapping / corporate interlocks)
await fetchPage(browser, 'https://littlesis.org/search?q=Firstname+Lastname', 'littlesis');

// Business / tech profiling
await fetchPage(browser, 'https://builtwith.com/<company_domain>', 'builtwith');
await fetchPage(browser, 'https://www.similarweb.com/website/<company_domain>/', 'similarweb');
await ddgSearch(browser, '"Company Name" site:glassdoor.com review OR rating', 'glassdoor');

// Domain infrastructure
await fetchPage(browser, 'https://who.is/whois/<company_domain>', 'whois');
await fetchPage(browser, 'https://viewdns.info/reversewhois/?q=Company+Name', 'reverse-whois');
await fetchPage(browser, 'https://www.shodan.io/search?query=org%3A%22Company+Name%22', 'shodan');

// Sales intelligence previews
await fetchPage(browser, 'https://rocketreach.co/search?query=Firstname+Lastname', 'rocketreach');
await ddgSearch(browser, '"Firstname Lastname" site:apollo.io OR site:lusha.com OR site:contactout.com', 'sales-intel');
```

---

### PHASE 4 — 🇧🇪 Belgium (`be`)

```js
// Belgian Official Gazette — CRITICAL: use rech_res.pl NOT rech.pl
await fetchPage(browser,
  'https://www.ejustice.just.fgov.be/cgi_tsv/rech_res.pl?language=nl&naam=Lastname&type_zoek=eenvoudig&tri=dd+AS+RANK&page=1',
  'gazette-naam');
await fetchPage(browser,
  'https://www.ejustice.just.fgov.be/cgi_tsv/rech_res.pl?language=nl&btw=<vat_number>&type_zoek=eenvoudig&tri=dd+AS+RANK&page=1',
  'gazette-btw');

// Staatsbladmonitor
await fetchPage(browser, 'https://www.staatsbladmonitor.be/?q=Lastname', 'staatsbladmonitor');

// Northdata Belgium
await fetchPage(browser, 'https://www.northdata.com/search?query=Firstname+Lastname&country=be&type=person', 'northdata-be-person');
await fetchPage(browser, 'https://www.northdata.com/search?query=Company+Name&country=be', 'northdata-be-company');

// KBO phonetic search
await fetchPage(browser,
  'https://kbopub.economie.fgov.be/kbopub/zoeknaamfonetisch.html?searchWord=Lastname&actionNPRP=true',
  'kbo-phonetic');

// NBB annual accounts
await fetchPage(browser, 'https://consult.cbso.nbb.be/en/public/entity/<enterprise_number>', 'nbb-accounts');

// FSMA shareholding notifications
await ddgSearch(browser, '"Company Name" site:fsma.be', 'fsma-ddg');

// Belgium e-Procurement
await fetchPage(browser, 'https://www.publicprocurement.be/en/search?keywords=Company+Name', 'be-procurement');

await ddgSearch(browser, '"Firstname Lastname" Belgium company OR director OR bestuurder OR zaakvoerder', 'be-person');
await ddgSearch(browser, '"Company Name" "Belgisch Staatsblad"', 'be-gazette-ddg');
```

**Belgian gazette PDF pipeline** (when publications found):
```bash
# Download with curl (NOT puppeteer — Chrome wraps PDF in HTML)
curl -s -L -o /tmp/gazette_be.pdf "https://www.ejustice.just.fgov.be/tsv_pdf/YYYY/MM/DD/YY[numac].pdf"
file /tmp/gazette_be.pdf
# CCITT Fax scanned image — must OCR
gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 -dFirstPage=1 -dLastPage=2 \
   -sOutputFile=/tmp/gazette_be_p%d.png /tmp/gazette_be.pdf
tesseract /tmp/gazette_be_p1.png /tmp/gazette_be_ocr && cat /tmp/gazette_be_ocr.txt
```

---

### PHASE 5 — 🇳🇱 Netherlands (`nl`)

```js
await fetchPage(browser, 'https://www.kvk.nl/zoeken/?q=Firstname+Lastname', 'kvk-person');
await fetchPage(browser, 'https://www.kvk.nl/zoeken/?q=Company+Name', 'kvk-company');
await fetchPage(browser, 'https://api.openkvk.nl/json/?q=Company+Name&size=10', 'openkvk-api');
await fetchPage(browser, 'https://www.northdata.com/search?query=Firstname+Lastname&country=nl', 'northdata-nl');
await ddgSearch(browser, '"Firstname Lastname" site:kvk.nl OR "Kamer van Koophandel"', 'nl-ddg');
// Kadaster property (pay-per-search)
await fetchPage(browser, 'https://www.kadaster.nl/eigendomsinformatie', 'kadaster-preview');
// AFM shareholder notifications
await fetchPage(browser, 'https://www.afm.nl/en/sector/registers/meldingenregisters/substantiele-deelnemingen', 'afm');
```

```bash
curl -s "https://api.kvk.nl/api/v2/zoeken?naam=Company+Name" -H "apikey: <key_if_available>" | python3 -m json.tool
```

---

### PHASE 6 — 🇫🇷 France (`fr`)

```js
await fetchPage(browser, 'https://www.societe.com/cgi-bin/search?champs=Lastname+Firstname', 'societe-fr');
await fetchPage(browser, 'https://www.pappers.fr/recherche?q=Firstname+Lastname', 'pappers-fr');
await fetchPage(browser, 'https://www.infogreffe.fr/recherche-dirigeant', 'infogreffe');
await fetchPage(browser, 'https://www.northdata.com/search?query=Firstname+Lastname&country=fr', 'northdata-fr');
await ddgSearch(browser, '"Firstname Lastname" SIREN OR SIRET OR gérant France', 'fr-ddg');
```

```bash
curl -s "https://recherche-entreprises.api.gouv.fr/search?q=Company+Name&per_page=5" | python3 -m json.tool
```

---

### PHASE 7 — 🇬🇧 United Kingdom (`uk`)

```js
await fetchPage(browser,
  'https://find-and-update.company-information.service.gov.uk/search?q=Firstname+Lastname',
  'companies-house-person');
await fetchPage(browser,
  'https://find-and-update.company-information.service.gov.uk/search?q=Company+Name',
  'companies-house-company');
await fetchPage(browser, 'https://www.thegazette.co.uk/all-notices/content?text=Firstname+Lastname', 'gazette-uk');
await ddgSearch(browser, '"Firstname Lastname" OR "Company Name" site:bailii.org', 'bailii');
await fetchPage(browser, 'https://caselaw.nationalarchives.gov.uk/search?query=Firstname+Lastname', 'caselaw-uk');
await fetchPage(browser, 'https://www.northdata.com/search?query=Firstname+Lastname&country=gb', 'northdata-uk');
```

```bash
# Companies House free API
curl -s "https://api.company-information.service.gov.uk/search/officers?q=Firstname+Lastname" -u "<key>:" | python3 -m json.tool
curl -s "https://api.company-information.service.gov.uk/company/<number>/persons-with-significant-control" -u "<key>:" | python3 -m json.tool
curl -s "https://api.company-information.service.gov.uk/company/<number>/filing-history" -u "<key>:" | python3 -m json.tool
```

---

### PHASE 8 — 🇺🇸 United States (`us`)

```js
await fetchPage(browser, 'https://efts.sec.gov/LATEST/search-index?q=%22Company+Name%22&dateRange=custom&startdt=2015-01-01', 'edgar-company');
await fetchPage(browser, 'https://efts.sec.gov/LATEST/search-index?q=%22Firstname+Lastname%22', 'edgar-person');
await fetchPage(browser, 'https://www.courtlistener.com/?q=%22Firstname+Lastname%22+OR+%22Company+Name%22&type=r', 'courtlistener');
await fetchPage(browser, 'https://sam.gov/search/?keywords=Company+Name', 'sam-gov');
await fetchPage(browser, 'https://www.northdata.com/search?query=Company+Name&country=us', 'northdata-us');
await fetchPage(browser, 'https://opencorporates.com/companies?q=Company+Name&jurisdiction_code=us', 'opencorporates-us');
await ddgSearch(browser, '"Firstname Lastname" LLC OR Inc OR Corp director secretary USA', 'us-ddg');
```

```bash
# SEC EDGAR — free, no auth
curl -s "https://data.sec.gov/submissions/CIK0000000000.json" | python3 -m json.tool | head -60
curl -s "https://data.sec.gov/api/xbrl/companyfacts/CIK0000000000.json" | python3 -m json.tool | head -40
# 13D/13G beneficial ownership filings (>5% stake disclosures)
curl -s "https://efts.sec.gov/LATEST/search-index?q=%22Firstname+Lastname%22&forms=SC+13D,SC+13G" | python3 -m json.tool
# USAspending (no auth)
curl -s "https://api.usaspending.gov/api/v2/recipient/search/?value=Company+Name&limit=10" | python3 -m json.tool
```

---

### PHASE 9 — 🇩🇪 Germany (`de`)

```js
await fetchPage(browser, 'https://www.handelsregister.de/rp_web/search.do?schlagwoerter=Company+Name', 'handelsregister');
await fetchPage(browser, 'https://www.bundesanzeiger.de/pub/en/start?&fulltext=Company+Name', 'bundesanzeiger');
await fetchPage(browser, 'https://www.northdata.com/search?query=Company+Name&country=de', 'northdata-de');
await ddgSearch(browser, '"Company Name" site:unternehmensregister.de', 'de-register-ddg');
```

---

### PHASE 10 — 🇸🇪 Sweden (`se`) — Political & Corporate

```js
// Riksdag parliamentary data (32 tools via MCP — see Phase 19)
// Public API direct access
await fetchPage(browser, `http://data.riksdagen.se/personlista/?iid=&fnamn=Firstname&enamn=Lastname&f_ar=&kn=&parti=&valkrets=&rdlstatus=samtliga&org=&utformat=json&sort=sorteringsnamn&sortorder=asc&rapport=&bevakadPersonlista=`, 'riksdag-person');
await fetchPage(browser, `http://data.riksdagen.se/dokument/?sok=Firstname+Lastname&doktyp=mot&rm=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&utformat=json&limit=10`, 'riksdag-motions');

// Swedish companies
await fetchPage(browser, 'https://www.allabolag.se/search?q=Firstname+Lastname', 'allabolag');
await fetchPage(browser, 'https://www.northdata.com/search?query=Firstname+Lastname&country=se', 'northdata-se');

// Swedish property (Lantmäteriet)
await ddgSearch(browser, '"Firstname Lastname" fastighet OR property site:lantmateriet.se', 'se-property');

// Swedish agencies monitoring
await ddgSearch(browser, '"Firstname Lastname" Skatteverket OR Finansinspektionen OR SÄPO', 'se-agencies');
```

```bash
# Riksdag API — voting records for a politician
PERSON_ID="<riksdag_person_id>"
curl -s "http://data.riksdagen.se/voteringlista/?iid=${PERSON_ID}&rm=2024%2F25&sz=50&utformat=json" | python3 -m json.tool

# Riksdag API — speeches
curl -s "http://data.riksdagen.se/anforandelista/?iid=${PERSON_ID}&anftyp=&rm=2024%2F25&sz=50&utformat=json" | python3 -m json.tool

# Riksdag API — documents authored by person
curl -s "http://data.riksdagen.se/dokument/?iid=${PERSON_ID}&doktyp=mot&rm=&utformat=json&limit=50" | python3 -m json.tool
```

---

### PHASE 11 — 🇹🇭 Thailand (`th`) & 🇵🇭 Philippines (`ph`)

> **CRITICAL — Family / Multi-Subject Rule:** When research has identified multiple subjects (e.g., family members, business partners, associates), run this ENTIRE phase individually for EACH person — not just the primary target. Expat/retiree locations are commonly found for secondary subjects who were never the original search focus.

> **Name-variant rule:** Always search both the exact legal spelling AND common anglicised/variant spellings (e.g. `Christiaan` → `Christian`, `Björn` → `Bjorn`, `François` → `Francois`). LocateFamily and Bing people snippets index the variant that the person actually uses in daily life, which may differ from official records.

#### Thailand corporate registries

```js
await fetchPage(browser, 'https://matchlink.asia/search?q=Firstname+Lastname', 'matchlink-th-person');
await fetchPage(browser, 'https://matchlink.asia/search?q=Company+Name', 'matchlink-th-company');
await fetchPage(browser, 'https://creden.co/search?q=Firstname+Lastname', 'creden-th');
await fetchPage(browser, 'https://dataforthai.com/search?keyword=Company+Name', 'dataforthai');
await fetchPage(browser, 'https://www.northdata.com/search?query=Company+Name&country=th', 'northdata-th');
await ddgSearch(browser, '"Firstname Lastname" Thailand company OR director OR shareholder', 'th-professional');
await ddgSearch(browser, '"Firstname Lastname" Pattaya OR Bangkok OR "Ko Samui" OR Chiang Mai OR Phuket expat business', 'th-location');
// DBD Thailand company registry (erportal.dbd.go.th may not resolve — use main site)
await fetchPage(browser, 'https://www.dbd.go.th/dbdweb_en/main.php?filename=index_search_company', 'dbd-thailand');
```

#### Thailand expat & people search (apply to EVERY subject)

```js
// LocateFamily — best source for Western expats/retirees in Thailand. Cloudflare-protected;
// capture from Bing snippet if direct fetch blocked.
// URL: https://www.locatefamily.com/[FIRST3 of surname uppercased]/[SURNAME_UPPER].html
await fetchPage(browser, 'https://www.locatefamily.com/[FIRST3]/[SURNAME_UPPER].html', 'locatefamily-th');

// Bing surfaces LocateFamily and Belgian/Dutch news far better than DDG for expats
await fetchPage(browser, 'https://www.bing.com/search?q=%22Firstname+Lastname%22+Thailand', 'bing-th-exact');
await fetchPage(browser, 'https://www.bing.com/search?q=%22Firstname+Lastname%22+Pattaya+OR+Bangkok+OR+Phuket', 'bing-th-city');
// Also try common name variant on Bing
await fetchPage(browser, 'https://www.bing.com/search?q=%22AltSpelling+Lastname%22+Thailand', 'bing-th-altname');

// Expat forums & communities
await ddgSearch(browser, '"Firstname Lastname" OR "AltSpelling Lastname" Thailand expat OR retired OR living', 'th-expat-life');
await ddgSearch(browser, '"Lastname" Pattaya OR "Ko Samui" OR Phuket property OR villa OR condo expat Belgian OR Dutch OR British', 'th-property');
await fetchPage(browser, 'https://www.thaivisa.com/search/?q=Firstname+Lastname', 'thaivisa-forum');
await ddgSearch(browser, '"Firstname Lastname" site:thaivisa.com OR site:expatforum.com OR site:thaizer.com', 'th-expat-forums');

// Yandex — sometimes indexes Thai-language pages and expat directories
await fetchPage(browser, 'https://yandex.com/search/?text=Firstname+Lastname+Thailand', 'yandex-th');
```

#### Philippines corporate & expat search (apply when PH connection suspected or company has PH office)

```js
await fetchPage(browser,
  'https://www.sec.gov.ph/company-search/?search=Company+Name',
  'ph-sec-company');
await ddgSearch(browser, '"Firstname Lastname" Philippines OR Manila OR Cebu OR Paranaque company OR director OR shareholder', 'ph-professional');
await ddgSearch(browser, '"Firstname Lastname" Philippines OR Manila expat OR retired OR living', 'ph-expat');
await fetchPage(browser, 'https://www.bing.com/search?q=%22Firstname+Lastname%22+Philippines', 'bing-ph');

// LocateFamily Philippines
await fetchPage(browser, 'https://www.locatefamily.com/[FIRST3]/[SURNAME_UPPER].html', 'locatefamily-ph');
// (same page as Thailand fetch — one page covers all countries for that surname)

// Philippine business registry
await fetchPage(browser, 'https://www.philbizportal.gov.ph/search?q=Company+Name', 'ph-bizportal');
```

---

### PHASE 12 — Global Corporate Cross-Registry

```js
// OpenCorporates — global officer search across all jurisdictions
await fetchPage(browser, 'https://opencorporates.com/officers?q=Firstname+Lastname&per_page=30', 'opencorporates-global');

// GLEIF — global LEI register
await fetchPage(browser, 'https://search.gleif.org/#/search/entity/Company+Name', 'gleif-company');

// EU e-Justice insolvency register
await fetchPage(browser, 'https://e-justice.europa.eu/58/EN/european_insolvency_register', 'eu-insolvency');

// BORIS — EU UBO register interconnection
await fetchPage(browser,
  'https://e-justice.europa.eu/topics/registers-business-insolvency-land/beneficial-ownership-registers-interconnection-system-boris_en',
  'boris-ubo');

// EU TED procurement
await fetchPage(browser, 'https://ted.europa.eu/en/search/result?search-scope=NOTICE&query=Company+Name', 'ted-eu');

// Sanctions
await fetchPage(browser, 'https://sanctionssearch.ofac.treas.gov/?txt=Firstname+Lastname', 'ofac');
await fetchPage(browser, 'https://www.opensanctions.org/search/?q=Firstname+Lastname', 'opensanctions-web');
```

---

### PHASE 13 — Financial Filings

```bash
# Belgium NBB annual accounts
echo "NBB: https://consult.cbso.nbb.be/en/public/entity/<enterprise_number>"

# UK Companies House accounts (filing list)
curl -s "https://api.company-information.service.gov.uk/company/<number>/filing-history?category=accounts" -u "<key>:" | python3 -m json.tool | head -60

# USA EDGAR XBRL structured financials
curl -s "https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d['facts'].get('us-gaap',{}).keys())[:20])"

# France SIRENE
curl -s "https://recherche-entreprises.api.gouv.fr/search?q=Company+Name&per_page=3" | python3 -m json.tool

# ProPublica IRS 990s (US nonprofits)
curl -s "https://projects.propublica.org/nonprofits/api/v2/search.json?q=Company+Name" | python3 -m json.tool

# Annual reports library
echo "annualreports.com: https://www.annualreports.com"
```

---

### PHASE 14 — Beneficial Ownership (UBO)

```bash
# UK PSC (free)
curl -s "https://api.company-information.service.gov.uk/company/<number>/persons-with-significant-control" -u "<key>:" | python3 -m json.tool

# GLEIF Level 2 ownership (direct + ultimate parents)
curl -s "https://api.gleif.org/api/v1/lei-records/<lei>/direct-parents" | python3 -m json.tool
curl -s "https://api.gleif.org/api/v1/lei-records/<lei>/ultimate-parents" | python3 -m json.tool

# OpenOwnership BODS bulk data
echo "https://bods-data.openownership.org"

# Belgium UBO Register (requires MyMinfin + legitimate interest)
echo "BE UBO: https://www.myminfin.be"

# EU BORIS cross-EU UBO search
echo "BORIS: https://e-justice.europa.eu/.../boris_en"
```

---

### PHASE 15 — Sanctions & PEP Screening

```bash
# OpenSanctions (331+ lists — free non-commercial)
curl -s "https://api.opensanctions.org/search?q=Firstname+Lastname&schema=Thing&limit=10" | python3 -m json.tool
curl -s "https://api.opensanctions.org/search?q=Company+Name&schema=Thing&limit=10" | python3 -m json.tool

# OFAC SDN bulk download (free)
echo "OFAC SDN: https://home.treasury.gov/policy-issues/financial-sanctions/sdn-and-consolidated-sanctions-list"

# EU consolidated sanctions XML
echo "EU list: https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList/content"

# UN sanctions
echo "UN list: https://www.un.org/securitycouncil/content/un-sc-consolidated-list"
```

---

### PHASE 16 — Trade / Import / Export

```js
await fetchPage(browser, 'https://www.importyeti.com/company/<company-slug>', 'importyeti');
await ddgSearch(browser, '"Company Name" import OR export site:importyeti.com OR site:panjiva.com', 'trade-ddg');
```

```bash
# EORI number lookup (EU import/export registration)
echo "EORI: https://ec.europa.eu/taxation_customs/dds2/eos/eori_validation.jsp"

# EU TED procurement contracts awarded
curl -s "https://api.ted.europa.eu/v3/notices/search?q=CAR%3D<company_name>&limit=10" | python3 -m json.tool 2>/dev/null | head -60
```

---

### PHASE 17 — Patents, Trademarks & IP

```bash
# Google Patents (free, global)
echo "https://patents.google.com/?assignee=Company+Name"

# EUIPO trademarks (EU)
curl -s "https://euipo.europa.eu/copla/trademark/data/search?wordmark=Company+Name&lang=en&size=10" | python3 -m json.tool 2>/dev/null | head -40

# BOIP (Benelux — Belgium/Netherlands/Luxembourg)
echo "https://www.boip.int/en/trademarks/search"

# WIPO Global Brand Database
echo "https://www.wipo.int/branddb/en/"
```

```js
await ddgSearch(browser, '"Company Name" OR "Firstname Lastname" site:patents.google.com', 'patents-ddg');
await ddgSearch(browser, '"Company Name" trademark site:euipo.europa.eu OR site:wipo.int', 'trademark-ddg');
```

---

### PHASE 18 — Court Records

```js
// USA: CourtListener (free federal records)
await fetchPage(browser, 'https://www.courtlistener.com/?q=%22Firstname+Lastname%22+OR+%22Company+Name%22&type=r', 'courtlistener');

// UK: Find Case Law + The Gazette (insolvency)
await fetchPage(browser, 'https://caselaw.nationalarchives.gov.uk/search?query=Firstname+Lastname', 'caselaw-uk');
await fetchPage(browser, 'https://www.thegazette.co.uk/all-notices/content?text=Company+Name&noticetypes=2100', 'gazette-uk-insolvency');

// EU: e-Justice insolvency register (cross-EU)
await fetchPage(browser, 'https://e-justice.europa.eu/58/EN/european_insolvency_register', 'eu-insolvency');

// Belgium, Netherlands, France via DDG
await ddgSearch(browser, '"Firstname Lastname" OR "Company Name" faillissement OR ontbinding Belgium', 'be-court');
await ddgSearch(browser, '"Firstname Lastname" OR "Company Name" site:rechtspraak.nl', 'nl-court');
await ddgSearch(browser, '"Firstname Lastname" OR "Company Name" site:legifrance.gouv.fr', 'fr-court');
```

---

### PHASE 19 — Political / Government Figure Tracking

*Run for type `political` or when subject is a known public official.*

**Sweden — Riksdag MCP Server (32 live tools, no install):**
```json
{
  "mcpServers": {
    "riksdag-regering": {
      "type": "http",
      "url": "https://riksdag-regering-ai.onrender.com/mcp",
      "tools": ["*"]
    }
  }
}
```

Key tools: `search_ledamoter`, `get_ledamot`, `search_voteringar`, `get_voting_group`, `search_anforanden`, `search_dokument_fulltext`, `get_motioner`, `get_propositioner`, `get_calendar_events`

```bash
# Riksdag API (free, no auth)
# Find MP by name
curl -s "http://data.riksdagen.se/personlista/?fnamn=Firstname&enamn=Lastname&utformat=json" | python3 -m json.tool

# Voting record
curl -s "http://data.riksdagen.se/voteringlista/?iid=<person_id>&rm=2024%2F25&sz=100&utformat=json" | python3 -m json.tool

# Speeches
curl -s "http://data.riksdagen.se/anforandelista/?iid=<person_id>&anftyp=&rm=2024%2F25&sz=50&utformat=json" | python3 -m json.tool

# All documents authored
curl -s "http://data.riksdagen.se/dokument/?iid=<person_id>&doktyp=mot&utformat=json&limit=100" | python3 -m json.tool
```

**European Parliament:**
```bash
# EP Open Data Portal (MEPs, votes, documents)
curl -s "https://data.europarl.europa.eu/api/v2/meps?format=application%2Fld%2Bjson" | python3 -m json.tool | head -60
```

```js
await fetchPage(browser, 'https://data.europarl.europa.eu/', 'ep-opendata');
await fetchPage(browser, 'https://oeil.secure.europarl.europa.eu/', 'ep-oeil-observatory');
await fetchPage(browser, 'https://eur-lex.europa.eu/', 'eurlex');
```

**Political donations (USA):**
```js
// FEC political donation data
await fetchPage(browser, 'https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=Firstname+Lastname', 'fec-donations');
// 501(c)(4) orgs can donate to Super PACs — check LittleSis for linkage
```

**General political figure tracking:**
```js
await ddgSearch(browser, '"Firstname Lastname" parliament OR senator OR minister OR MP OR MEP OR congress', 'political-role');
await ddgSearch(browser, '"Firstname Lastname" declaration OR assets OR property OR wealth OR lobbyist', 'political-assets');
await ddgSearch(browser, '"Firstname Lastname" lobbying OR campaign contribution OR donation', 'political-funding');
await fetchPage(browser, 'https://transparency-register.europa.eu/searchregister-or-update/search_en?display=1&keywords=Firstname+Lastname', 'eu-lobby-register');
await fetchPage(browser, 'https://lda.senate.gov/system/public/', 'us-lda-note');
```

---

### PHASE 20 — Digital Infrastructure & Domain Recon

```bash
# WHOIS
whois <company_domain> 2>/dev/null | head -40

# crt.sh: all SSL certificates (reveals subdomains, related org domains)
curl -s "https://crt.sh/?q=<company_domain>&output=json" | \
  python3 -c "import json,sys; certs=json.load(sys.stdin); [print(c.get('name_value')) for c in certs[:50]]"

# Also search by organization name
curl -s "https://crt.sh/?O=Company+Name&output=json" | \
  python3 -c "import json,sys; certs=json.load(sys.stdin); [print(c.get('name_value'),c.get('issuer_name')) for c in certs[:30]]"

# Subdomain enumeration
subfinder -d <company_domain> -silent 2>/dev/null | head -50
amass enum -passive -d <company_domain> 2>/dev/null | head -50

# HTTP probing — tech detection, status, title
echo "<company_domain>" | httpx -tech-detect -status-code -title -web-server -cdn -silent 2>/dev/null

# Historical URLs (all archived URLs for this domain)
gau <company_domain> --providers wayback,commoncrawl,otx,urlscan --subs 2>/dev/null | head -100

# Nuclei — tech/info discovery (passive, no attack)
echo "https://<company_domain>" | nuclei -tags tech,info -severity info -silent 2>/dev/null | head -30

# SecurityTrails
echo "SecurityTrails: https://securitytrails.com/domain/<domain>/history/a"

# ViewDNS reverse WHOIS
curl -s "https://viewdns.info/reversewhois/?q=<email_or_company_name>" 2>/dev/null | head -50

# Shodan (org search)
echo "Shodan: https://www.shodan.io/search?query=org%3A%22Company+Name%22"
```

---

### PHASE 21 — Email Deep Dive (if email known)

```bash
holehe <email> 2>&1 | tee /tmp/holehe_<slug>.txt
ghunt email <email> 2>&1 | tee /tmp/ghunt_<slug>.txt
h8mail -t <email> 2>&1 | tee /tmp/h8mail_<slug>.txt
curl -s "https://emailrep.io/<email>" | python3 -m json.tool
```

```js
await fetchPage(browser, 'https://epieos.com/?q=<email>&type=email', 'epieos-email');
await fetchPage(browser, 'https://intelx.io/?s=<email>', 'intelx-email');
await fetchPage(browser, 'https://hunter.io/domain-search/<email_domain>', 'hunter-domain');
await fetchPage(browser, 'https://dehashed.com/search?query=<email>', 'dehashed-email');
await fetchPage(browser, 'https://snusbase.com/', 'snusbase-note');
```

---

### PHASE 22 — Phone Deep Dive (if phone known)

```bash
phoneinfoga scan -n "<phone>" 2>&1 | tee /tmp/phoneinfoga_<slug>.txt
curl -s "http://apilayer.net/api/validate?access_key=<key>&number=<phone>&format=1" | python3 -m json.tool
```

```js
await fetchPage(browser, 'https://epieos.com/?q=<phone>&type=phone', 'epieos-phone');
await fetchPage(browser, 'https://www.numlookup.com/?number=<phone>', 'numlookup');
await fetchPage(browser, 'https://www.truecaller.com/search/us/<phone>', 'truecaller');
await ddgSearch(browser, '"<phone>"', 'phone-raw-ddg');
```

---

### PHASE 23 — Face / Image Reverse Search

```js
// Yandex — best free face recognition
await fetchPage(browser, 'https://yandex.com/images/search?rpt=imageview&url=<IMAGE_URL>', 'yandex-face');
// ImgOps — meta-tool (runs Google, Yandex, TinEye in one click)
await fetchPage(browser, 'https://imgops.com/<IMAGE_URL>', 'imgops');
// FaceCheck.ID
await fetchPage(browser, 'https://facecheck.id', 'facecheck');
// PimEyes (paid, best facial recognition)
await fetchPage(browser, 'https://pimeyes.com', 'pimeyes-note');
// Lenso.ai
await fetchPage(browser, 'https://lenso.ai', 'lenso-note');
```

```bash
# TinEye (if API key available)
curl -s "https://api.tineye.com/rest/search/?image_url=<IMAGE_URL>&api_key=<key>" | python3 -m json.tool

# Exiftool on downloaded images (EXIF reveals camera, GPS, timestamp)
exiftool <downloaded_image.jpg>
```

**Geolocation from images:**
- Railroad crossing signs: white X + red border = Canada; yellow X = USA
- Bollards with red reflectors = Netherlands; green = Germany
- Brown tourist road signs = France; blue + white = Germany Autobahn
- Kanji on signage = Japan; Cyrillic + wide boulevards = Russia/CIS
- MGRS grid references: convert at mgrs-to-coord.com
- Open Infrastructure Map (power lines): https://openinframap.org
- OpenRailwayMap: https://www.openrailwaymap.org/
- Street View panorama matching via OpenCV ORB feature detector

---

### PHASE 24 — Advanced Platform Tricks

```bash
# Twitter/X: recover old usernames (persistent user ID stays the same after renames)
# Access by numeric ID: https://x.com/i/user/<numeric_id>
# Decode Snowflake timestamp to account creation date:
python3 -c "print((SNOWFLAKE_ID >> 22) + 1288834974657)"  # gives Unix ms timestamp

# Twitter username history archives
echo "memory.lol — historical username tracker: https://memory.lol"
echo "twitter.lolarchiver.com — username history"

# Twitter CDX: find username from old archived profile images
curl -s "http://web.archive.org/cdx/search/cdx?url=pbs.twimg.com/profile_images/<user_id>/*&output=json"

# Twitter Syndication API (no auth — public timeline data)
curl -s "https://syndication.twitter.com/srv/timeline-profile/screen-name/<username>" | head -200

# Discord: guild/server intelligence
# (Requires user token — obtained from browser DevTools Network tab)
TOKEN="<discord_token>"
curl -H "Authorization: $TOKEN" "https://discord.com/api/v10/guilds/<GUILD_ID>/roles"
curl -H "Authorization: $TOKEN" "https://discord.com/api/v10/guilds/<GUILD_ID>/emojis"
curl -H "Authorization: $TOKEN" "https://discord.com/api/v10/users/<USER_ID>/profile"

# Telegram: extract URLs from browser SQLite history (Edge/Chrome)
python3 -c "
import sqlite3
conn = sqlite3.connect('/path/to/History')
cur = conn.cursor()
cur.execute(\"SELECT url FROM urls WHERE url LIKE '%t.me/%' OR url LIKE '%telegram%'\")
for row in cur.fetchall(): print(row[0])
"

# Keybase: lookup by username, email, Twitter, GitHub, Reddit handles
curl -s "https://keybase.io/_/api/1.0/user/lookup.json?username=<username>"
curl -s "https://keybase.io/_/api/1.0/user/lookup.json?twitter=<twitter_handle>"

# Gravatar: profile tied to email MD5 hash
python3 -c "import hashlib; email='<email>'.lower().strip(); print(hashlib.md5(email.encode()).hexdigest())"
# Then: https://www.gravatar.com/<md5_hash>.json

# Google Docs/Sheets: extract data from shared docs
# Public export URLs:
# /export?format=csv  |  /pub  |  /gviz/tq?tqx=out:csv  |  /htmlview

# GitHub: SSH public keys (sometimes reveals identity)
curl -s "https://github.com/<username>.keys"
# GitHub: star/fork activity reveals interests and network
curl -s "https://api.github.com/users/<username>/starred?per_page=30" | python3 -c "import json,sys; [print(r['full_name']) for r in json.load(sys.stdin)]"

# DNS: dig all record types
dig -t txt <domain>
dig -t any <domain>
dig -t mx <domain>
dig axfr @<nameserver> <domain>  # zone transfer (if misconfigured)
dig TXT _dmarc.<domain>

# Tor relay lookup (if target is Tor operator)
echo "https://metrics.torproject.org/rs.html#simple/<40_char_fingerprint>"

# FEC (US political donations)
curl -s "https://api.open.fec.gov/v1/schedules/schedule_a/?contributor_name=Firstname+Lastname&api_key=DEMO_KEY" | python3 -m json.tool | head -60
```

---

### PHASE 25 — Property / Real Estate

```js
await fetchPage(browser, 'https://www.kadaster.nl/eigendomsinformatie', 'kadaster-nl');
await fetchPage(browser, 'https://search-property-information.service.gov.uk/', 'land-registry-uk');
await ddgSearch(browser, '"Firstname Lastname" eigendom OR vastgoed OR woning Belgium', 'be-property');
await ddgSearch(browser, '"Firstname Lastname" property owner OR homeowner county assessor', 'us-property');
```

---

### PHASE 26 — Lobbying, Memberships & Environmental

```js
await fetchPage(browser,
  'https://transparency-register.europa.eu/searchregister-or-update/search_en?display=1&keywords=Company+Name',
  'eu-lobby');
await fetchPage(browser, 'https://www.dekamer.be/kvvcr/lobbyregister', 'be-lobby');
await ddgSearch(browser, '"Company Name" member OR membership OR sectorfederatie OR "trade association"', 'memberships');
await ddgSearch(browser, '"Firstname Lastname" board member OR trustee OR association Agoria OR Voka OR FEB', 'be-associations');
// Environmental violations (USA)
await fetchPage(browser, 'https://echo.epa.gov/facilities/facility-search/results?p_fn=Company+Name', 'epa-echo');
```

---

### PHASE 27 — PDF & Document Extraction

```bash
# ALWAYS use curl (not puppeteer — Chrome wraps PDFs in HTML)
curl -s -L -o /tmp/doc_<label>.pdf "<url>"
file /tmp/doc_<label>.pdf  # verify it's a real PDF

# Try text extraction first (text-based PDFs)
pdftotext /tmp/doc_<label>.pdf - 2>/dev/null | head -200
strings /tmp/doc_<label>.pdf | grep -i "name\|director\|owner\|address\|phone" | head -30

# Scanned / CCITT Fax PDF (Belgian gazette): ghostscript + tesseract OCR
gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 \
   -dFirstPage=1 -dLastPage=3 \
   -sOutputFile=/tmp/doc_<label>_page%d.png /tmp/doc_<label>.pdf

for i in 1 2 3; do
  [ -f /tmp/doc_<label>_page${i}.png ] && \
    tesseract /tmp/doc_<label>_page${i}.png /tmp/doc_<label>_p${i}
done
cat /tmp/doc_<label>_p*.txt

# Extract metadata from any file type
exiftool /tmp/doc_<label>.pdf
```

---

### PHASE 27b — Genealogy & Family Relationship Tracking

*Run when family members, ancestors, descendants, or surname origin research is needed.*

```bash
# FamilySearch (LDS Church — 8B+ records, free with account)
# Collections: birth, marriage, death, immigration, census, military
echo "FamilySearch: https://www.familysearch.org/search/record/results?q.surname=<SURNAME>&q.birthPlace=<COUNTRY>"
echo "FamilySearch person search: https://www.familysearch.org/search/tree/results?q.surname=<SURNAME>&q.residencePlace=<CITY>"

# Ancestry.com — largest genealogy database (paid, but previews free)
echo "Ancestry: https://www.ancestry.com/search/?name=Firstname+Lastname"

# MyHeritage — strong European coverage
echo "MyHeritage: https://www.myheritage.com/research?action=query&formId=1&s=1&q.first=Firstname&q.last=Lastname"

# Geneanet — best for Belgian/French/European genealogy records (free search)
echo "Geneanet: https://www.geneanet.org/search/?lang=en&name=<SURNAME>&firstname=<FIRSTNAME>"

# Geni — collaborative family tree (free)
echo "Geni: https://www.geni.com/search?search_type=people&names=Firstname+Lastname"

# WikiTree — free, source-cited collaborative tree
echo "WikiTree: https://www.wikitree.com/index.php?title=Special:SearchPerson&action=searchform&name=Lastname&first_name=Firstname"

# Find A Grave — death records + cemetery photos (free)
echo "Find A Grave: https://www.findagrave.com/memorial/search?firstname=Firstname&lastname=Lastname"

# BillionGraves — GPS-tagged grave records (free)
echo "BillionGraves: https://billiongraves.com/search/results/Firstname-Lastname"

# Belgium-specific genealogy
# Rijksarchief Belgium (national archives — civil records, census, notarial acts)
echo "Rijksarchief: https://search.arch.be/en/zoeken-naar-archieven/zoekresultaten?zoekterm=<SURNAME>"
# Stadsarchief Antwerp
echo "Stadsarchief Antwerpen: https://www.stamkunde.be"

# Netherlands genealogy
# CBG (Centraal Bureau voor Genealogie)
echo "CBG Nederland: https://www.cbgfamilienamen.nl/nfb/?operator=eq&naam=<SURNAME>"
# Tresoar (Friesland)
echo "All Dutch archives: https://www.wiewaswie.nl/en/search/?q=<SURNAME>+<FIRSTNAME>"

# Italy (for tracing Italian immigrant roots)
echo "Antenati (Italian civil records): https://antenati.cultura.gov.it/"
echo "Cognomix (Italian surname origin map): https://www.cognomix.it/mappe-dei-cognomi-italiani/<SURNAME>"
echo "Gens (Italian genealogy): http://www.gens.info/italia/<SURNAME>.html"

# Immigration records (Ellis Island, Antwerp departures)
echo "Ellis Island: https://heritage.statueofliberty.org/passenger"
echo "Ancestry immigration: https://www.ancestry.com/search/collections/7488/"
# Antwerp passenger lists (ship departures)
echo "FamilySearch Antwerp departures: https://www.familysearch.org/search/catalog/131410"

# DNA genealogy (when physical samples available — note for report as avenue)
echo "GEDmatch: https://www.gedmatch.com (upload DNA raw data — cross-database matching)"
echo "23andMe / AncestryDNA: database matching for family discovery"
```

```js
// Geneanet — best free European genealogy search
await fetchPage(browser,
  'https://www.geneanet.org/search/?lang=en&name=<SURNAME>&firstname=<FIRSTNAME>',
  'geneanet');

// WikiTree
await fetchPage(browser,
  'https://www.wikitree.com/index.php?title=Special:SearchPerson&action=searchform&name=Lastname&first_name=Firstname',
  'wikitree');

// FamilySearch (public tree search — no account needed for index)
await fetchPage(browser,
  'https://www.familysearch.org/search/tree/results?q.surname=<SURNAME>&q.residencePlace=Belgium',
  'familysearch-be');

// Find A Grave
await fetchPage(browser,
  'https://www.findagrave.com/memorial/search?firstname=Firstname&lastname=Lastname',
  'findagrave');

// CBG Dutch surname distribution map
await fetchPage(browser,
  'https://www.cbgfamilienamen.nl/nfb/?operator=eq&naam=<SURNAME>',
  'cbg-nl-surname');

// DDG genealogy searches
await ddgSearch(browser, '"Lastname" genealogy OR ancestry OR stamboom Belgium', 'genealogy-be');
await ddgSearch(browser, '"Lastname" Italy OR Italian origin OR origine italienne', 'italian-origin');
await ddgSearch(browser, '"Lastname" immigrant Belgium coal mines OR mijnwerker OR Wallonia', 'immigration-history');
await ddgSearch(browser, '"Lastname" birth OR born OR death OR married OR marriage certificate', 'vital-records');

// Belgian civil registration & archives
await fetchPage(browser, 'https://search.arch.be/en/', 'rijksarchief-be');
await fetchPage(browser, 'https://www.wiewaswie.nl/en/search/?q=Lastname+Firstname', 'wiewaswie-nl');

// Italian surname origin (useful for tracing immigrant families)
await fetchPage(browser, `https://www.cognomix.it/mappe-dei-cognomi-italiani/<SURNAME>`, 'cognomix-it');

// Geni collaborative tree (public profiles visible without login)
await fetchPage(browser, 'https://www.geni.com/search?search_type=people&names=Firstname+Lastname', 'geni');
```

**Genealogy cross-referencing strategy:**
1. Start with surname distribution maps (CBG for NL, Cognomix for IT) — establishes geographic origin
2. FamilySearch for immigration/emigration records (ship manifests, border crossings)
3. Geneanet + WikiTree for collaborative trees that may already have the family mapped
4. Belgian Rijksarchief for civil registration (births, marriages, deaths 1796–present)
5. Find A Grave + BillionGraves for death dates and family plots (often shows relationships)
6. Cross-reference Italian commune of origin → Italian Antenati civil records (pre-immigration births)
7. Map the family network: grandparents → parents → siblings → children → cousins
8. Use surname rarity to identify all Belgian/Dutch bearers of an unusual surname as likely relatives

### PHASE 28 — Synthesis & Analysis of Competing Hypotheses

After all data collection, organize findings:

| Section | Content |
|---------|---------|
| **A** | Subject Identity — name variants, DOB, nationality, addresses, photos |
| **B** | Family & Associates — relatives, co-directors, linked individuals |
| **C** | Corporate Entities — all companies, jurisdictions, roles, dates, status |
| **D** | Beneficial Ownership — UBOs, shareholder structure, parent companies |
| **E** | Financial Profile — revenue, assets, employees, accounts |
| **F** | Registry Findings — gazette publications, official records per country |
| **G** | Digital Footprint — web presence, social platforms, email registrations |
| **H** | Risk Indicators — sanctions, court records, insolvency, adverse media |
| **I** | Trade & Procurement — import/export, government contracts |
| **J** | IP & Technology — patents, trademarks, domain portfolio |
| **K** | Political Activity — voting records, donations, lobbying, memberships |
| **L** | Connection Assessment — entity relationships, timeline, influence network |
| **M** | Negative Findings — what returned nothing (document explicitly) |
| **N** | Source Reference Table |

**Analysis of Competing Hypotheses (ACH)** for complex investigations:
1. Define competing hypotheses (e.g., beneficial ownership scenarios)
2. List all evidence found
3. Rate each evidence item against each hypothesis (++ / + / N / - / --)
4. Score hypotheses by diagnostic evidence
5. Identify the most diagnostic (discriminating) evidence items
6. Rank hypotheses by consistency score

Apply NATO Admiralty source ratings (A-F / 1-6) to every significant finding.

---

### PHASE 29 — Word Document Generation

Create `/tmp/generate_intel_<slug>.py` with python-docx:

```python
#!/usr/bin/env python3
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

DARK_BLUE  = RGBColor(0x1F, 0x39, 0x64)
MID_BLUE   = RGBColor(0x2E, 0x75, 0xB6)
GOLD       = RGBColor(0xBF, 0x8F, 0x00)
LIGHT_BLUE = RGBColor(0x9D, 0xC3, 0xE6)
GREY_BG    = RGBColor(0xF2, 0xF2, 0xF2)

# Document must include:
# 1. Cover page: target, date, type, countries, seed identifiers, classification
# 2. Research methodology (sources, confidence model, limitations)
# 3. Sections A–M — all findings with source ratings and confidence levels
# 4. Section N: Source Reference Table (60+ rows minimum)
#    columns: #, Source, URL/Command, Module, Country, Type, NATO rating, Result
```

Run: `python3 /tmp/generate_intel_<slug>.py`

---

## Technical Reference

### Critical Rules (hard-won from real investigations)

**Belgian Official Gazette:**
- `rech_res.pl` GET requests work directly — NEVER use `rech.pl` (always returns blank form)
- Working URL: `https://www.ejustice.just.fgov.be/cgi_tsv/rech_res.pl?language=nl&naam=SURNAME&type_zoek=eenvoudig&tri=dd+AS+RANK&page=1`
- Also search by VAT: `...&btw=0401296522&...`
- Gazette submit button is `<button type="submit">` — NOT `<input type="submit">` (puppeteer `page.$('input[type="submit"]')` fails)
- Gazette PDF URL format: `tsv_pdf/YYYY/MM/DD/YY[numac].pdf` — e.g. publication date 2022-04-01 / numac 22042652 → `tsv_pdf/2022/04/01/22042652.pdf`
- Gazette PDFs are CCITT Group 3/4 Fax bitonal scanned images — PyPDF2 and pdfminer extract only garbled text; always use ghostscript → PNG → tesseract pipeline
- Gazette **NEVER** use puppeteer to download PDFs — Chrome PDF viewer wraps PDF in HTML; use `curl -s -L -o file.pdf <url>` for actual binary

**KBO Belgium:**
- URL parameters alone do NOT trigger the search — form must be submitted via puppeteer
- Correct form fields: `searchWord` (text), `ondNP` (natural person checkbox), `ondRP` (legal entity checkbox), `actionNPRP` (submit)
- Phonetic search URL that works directly: `https://kbopub.economie.fgov.be/kbopub/zoeknaamfonetisch.html?searchWord=LASTNAME&actionNPRP=true`
- Rare surnames (e.g. Italian immigrant names) return "Geen gegevens gevonden" — also search via gazette `naam=` parameter which is more complete

**Northdata Belgium/Europe:**
- Company full page shows complete board history with appointment/dismissal dates — far more useful than just current officers
- Use `/publications` sub-path with caution: sometimes returns incorrect content (searches for companies in city rather than showing publication history); use the main company page instead
- Format: `https://www.northdata.com/Company+Name,+City/KBO+0401.296.522`

**Thai Corporate Registries:**
- matchlink.asia, dataforthai.com, creden.co, companieshouse.co.th all show company names in search results but require login for director/shareholder details
- Focus on DDG searches and Northdata for Thai entities; only matchlink/creden worth scraping for company name confirmation
- Use DDG with Thai city names: `"Name" Pattaya OR "Ko Samui" OR Bangkok OR Phuket business expat`
- DBD erportal (`erportal.dbd.go.th`) may not resolve — fall back to `www.dbd.go.th` main site

**LocateFamily (locatefamily.com):**
- Indexes Western expats and retirees living abroad, especially SE Asia (Thailand, Philippines), Spain, France
- URL pattern: `https://www.locatefamily.com/[FIRST3_UPPER]/[SURNAME_UPPER].html` — e.g. "Pradolini" → `/PRA/PRADOLINI.html`, "Smith" → `/SMI/SMITH.html`
- Site is Cloudflare-protected — if direct fetch blocked, capture the address from the Bing snippet (Bing indexes these pages aggressively)
- **Always search with common name variants** — the person may have registered under an anglicised spelling (Christiaan→Christian, etc.)
- Apply to EVERY identified subject in a family/group investigation, not just the primary target
- Confirmed real-world result: Christiaan Pradolini found at `64/38 Moo 4 Pornprapanimit 32, Nong Prue, Bang Lamung, Pattaya, Chon Buri` via Bing snippet `"Christian Pradolini" site:locatefamily.com` — would have been missed with exact legal spelling only

**Thailand/Philippines — Multi-Subject Rule:**
- Run Phase 11 for EACH identified family member / associate individually
- Use Bing (not just DDG) — Bing surfaces LocateFamily, HLN.be, and Belgian/Dutch newspaper articles about expats far more reliably than DuckDuckGo
- Belgian/Dutch news snippets on Bing often contain home-country origin city + current country: "X, afkomstig uit [city], woont al jaren in Thailand"

**Gazette publication types (Belgian):**
- "HERBENOEMING RAAD VAN BESTUUR" = re-appointment of board (routine)
- "BENOEMING BESTUURDER" = new director appointment (significant)
- "ONTSLAG BESTUURDER" = director resignation (significant)
- "ONTBINDING" = dissolution
- "OPRICHTING" = incorporation
- A person absent from ALL gazette publications is likely an employee (niet-statutaire functie), not a statutory director — this distinction matters for linking persons to companies

**General PDF handling:**
- Always `file /tmp/doc.pdf` first — confirms if it's a real PDF or HTML wrapper
- `pdftotext` works for text-based PDFs; fallback to ghostscript + tesseract for scanned
- Only `eng` + `osd` tesseract language packs are typically installed — sufficient for Belgian Dutch/French official text
- For multi-page gazette PDFs, process pages 1-3 only (relevant content is always at top)

**Puppeteer:**
- Always use `puppeteer-extra` + `puppeteer-extra-plugin-stealth` — bare puppeteer gets blocked
- `sleep(2500–4000ms)` after `page.goto()` for JS-heavy pages
- `page.evaluate(() => document.body.innerText).slice(0, 20000)` — always slice to avoid memory issues
- `protocolTimeout: 60000` in launch options prevents CDP timeout on slow pages

### Free API Quick Reference

| API | Endpoint | Returns |
|-----|----------|---------|
| SEC EDGAR submissions | `data.sec.gov/submissions/CIK{10d}.json` | All filings |
| SEC EDGAR XBRL | `data.sec.gov/api/xbrl/companyfacts/CIK{n}.json` | Structured financials |
| GLEIF LEI search | `api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}` | Global corporate identity |
| GLEIF ownership | `api.gleif.org/api/v1/lei-records/{lei}/direct-parents` | Parent chain |
| OpenCorporates | `api.opencorporates.com/v0.4/officers/search?q={name}` | 140+ jurisdictions |
| BlueSky (no auth) | `public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor={handle}` | Profile + posts |
| crt.sh | `crt.sh/?q={domain}&output=json` | SSL certs, subdomains |
| EU VIES VAT | `isvat.appspot.com/{cc}/{vat}` | VAT validation |
| UK HMRC VAT | `api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/{vat}` | Name + address |
| France SIRENE | `recherche-entreprises.api.gouv.fr/search?q={name}` | Company data |
| USAspending | `api.usaspending.gov/api/v2/` | Federal contracts/grants |
| ProPublica 990 | `projects.propublica.org/nonprofits/api/v2/search.json?q={name}` | Nonprofit financials |
| ICIJ Leaks | `offshoreleaks.icij.org/api/search?q={name}` | Panama/Pandora Papers |
| OpenSanctions | `api.opensanctions.org/search?q={name}` | 331+ sanctions lists |
| GitHub | `api.github.com/users/{username}` | Profile, email, bio |
| Reddit | `reddit.com/user/{username}/about.json` | Account info |
| Emailrep.io | `emailrep.io/{email}` | Reputation score |
| Wayback CDX | `web.archive.org/cdx/search/cdx?url={domain}/*&output=json` | Historical snapshots |
| Riksdag API | `data.riksdagen.se/personlista/?fnamn=&enamn=&utformat=json` | Swedish MPs |
| FEC donations | `api.open.fec.gov/v1/schedules/schedule_a/?contributor_name={name}&api_key=DEMO_KEY` | US political donations |
| Keybase | `keybase.io/_/api/1.0/user/lookup.json?username={user}` | Verified identity links |
| Gravatar | `gravatar.com/{md5_of_email}.json` | Profile linked to email |

### Notable Paid/Enterprise Tools

| Tool | Strength | Cost |
|------|----------|------|
| Orbis (BvD/Moody's) | Private company ownership chains globally | Enterprise |
| Sayari Graph | Shell company networks, sanctions evasion, 36B records | Enterprise |
| Pipl | Identity resolution | ~$58K/yr |
| PimEyes | Best face recognition search | ~$30/mo |
| Panjiva/ImportGenius | Global trade manifest data (sea freight) | $189+/mo |
| Factiva | Global news archive 1944+ | Enterprise |
| PitchBook | VC/PE funding, investors, deal terms | $20K+/yr |
| World-Check | AML/KYC PEP + sanctions standard | Enterprise |

### Source Reference Table Format

| # | Source | URL / Command | Module | Country | Type | NATO | Result |
|---|--------|---------------|--------|---------|------|------|--------|
| 1 | Belgian Gazette | rech_res.pl?naam=Smith | Registry | BE | Corporate | A1 | 3 publications |
| 2 | Companies House | /officers?q=Smith | Registry | UK | Corporate | A1 | 2 directorships |
| 3 | OpenCorporates | /officers?q=Smith | Registry | Global | Corporate | B2 | 5 roles / 3 jurisdictions |
| 4 | ICIJ Offshore Leaks | offshoreleaks.icij.org | Leaks | Global | Offshore | A2 | No match |
| 5 | OpenSanctions | api.opensanctions.org | Sanctions | Global | AML | A1 | No match |
| 6 | Sherlock | sherlock "jsmith" | CLI | General | Username | A1 | GitHub, Instagram, Reddit |
| 7 | Holehe | holehe jsmith@gmail.com | CLI | Email | Accounts | A1 | Spotify, Amazon, GitHub |
| 8 | HIBP | haveibeenpwned.com | Email | Breach | Data | A1 | LinkedIn 2016, Adobe 2013 |
| 9 | BlueSky API | public.api.bsky.app | Social | General | Profile | A1 | Active profile found |
| 10 | memory.lol | memory.lol | Social | General | History | B2 | 2 previous usernames |
