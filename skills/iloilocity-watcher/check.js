'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE_URL = 'https://iloilocity.gov.ph/bids-and-awards-committee/';
const SEEN_F   = path.join(__dirname, 'seen.json');
const RES_DIR  = path.join(__dirname, 'results');

const CONSTRUCTION_KW = [
  'rehabilitation', 'construction', 'civil works', 'repair', 'building',
  'infrastructure', 'perimeter', 'fence', 'guardhouse', 'gate', 'flooring',
  'roofing', 'painting', 'renovation', 'installation of', 'improvement',
  'concreting', 'drainage', 'road', 'pavement', 'electrical', 'plumbing',
  'walkway', 'esplanade', 'gym', 'classroom', 'school building', 'multi-purpose',
  'cemetery', 'niches', 'disaster', 'logistic center', 'community center',
];

function isConstruction(title) {
  const t = title.toLowerCase();
  return CONSTRUCTION_KW.some(k => t.includes(k));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject).setTimeout(20000, function() { this.destroy(); reject(new Error('Timeout')); });
  });
}

function parseRows(html) {
  // Table columns (8): Item No. | Document Type | Classification | P.R. No. | Title | Publish Date | Closing Date | File Name
  // Classification = "INFRA" for construction/infrastructure bids
  const results = [];

  const tableRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const row = m[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length < 6) continue;

    const txt = i => (cells[i]?.[1] || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim();

    const itemNo  = txt(0);
    const docType = txt(1);
    if (itemNo === 'Item No.' || itemNo === '#' || itemNo === '') continue;

    // 8-column rows (INFRA section): Item | DocType | Classification | PR No. | Title | Publish | Close | File
    // 7-column rows (other sections): Item | DocType | PR No. | Title | Publish | Close | File
    let classification, prNo, title, publishDate, closeDate;
    if (cells.length >= 8) {
      classification = txt(2);
      prNo           = txt(3);
      title          = txt(4);
      publishDate    = txt(5);
      closeDate      = txt(6);
    } else {
      classification = '';
      prNo           = txt(2);
      title          = txt(3);
      publishDate    = txt(4);
      closeDate      = txt(5);
    }

    const lastCell = cells[cells.length - 1]?.[1] || '';
    const driveLink = (lastCell.match(/href="(https:\/\/drive\.google\.com\/[^"]+)"/i) || [])[1] || '';

    if (!title || !prNo) continue;

    results.push({ itemNo, docType, classification, prNo, title, publishDate, closeDate, driveLink });
  }
  return results;
}

async function main() {
  fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Iloilo City BAC Watcher — ${today}`);
  console.log(`Fetching ${BASE_URL}`);

  let html;
  try {
    html = await fetchPage(BASE_URL);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    process.exit(1);
  }

  const rows = parseRows(html);
  console.log(`  ${rows.length} total entries parsed`);

  const newItems = [];
  for (const row of rows) {
    const key = row.prNo;
    if (!key || seen[key]) continue;

    // Classification "INFRA" means infrastructure/construction
    const construction = row.classification === 'INFRA' || isConstruction(row.title);
    const flag = construction ? ' [CONSTRUCTION]' : '';
    console.log(`  NEW${flag}: ${row.prNo} — ${row.title}`);
    if (row.publishDate) console.log(`    Published: ${row.publishDate}  Closes: ${row.closeDate}`);
    if (row.driveLink) console.log(`    PDF: ${row.driveLink}`);

    newItems.push({ ...row, foundDate: today, construction });
    seen[key] = today;
  }

  fs.writeFileSync(SEEN_F, JSON.stringify(seen, null, 2));

  if (newItems.length === 0) {
    console.log('\nNo new entries.');
  } else {
    console.log(`\n=== ${newItems.length} NEW ITEM(S) ===`);
    const construction = newItems.filter(i => i.construction);
    if (construction.length) {
      console.log(`\n** ${construction.length} CONSTRUCTION/INFRASTRUCTURE **`);
      construction.forEach(i => {
        console.log(`  ${i.prNo} — ${i.title}`);
        console.log(`  Closes: ${i.closeDate}`);
        if (i.driveLink) console.log(`  ${i.driveLink}`);
      });
    }
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newItems.length, items: newItems }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
