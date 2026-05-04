'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// University of the Philippines Visayas BAC
// ITB list: <li> items under "INVITATION TO BID" heading
// PDF links: /files/itb-YYYY-NNN.pdf
const BASE_URL = 'https://www.upv.edu.ph/index.php/bids-and-awards';
const SEEN_F   = path.join(__dirname, 'seen.json');
const RES_DIR  = path.join(__dirname, 'results');

const CONSTRUCTION_KW = [
  'rehabilitation', 'construction', 'civil works', 'repair', 'building',
  'infrastructure', 'perimeter', 'fence', 'guardhouse', 'flooring',
  'roofing', 'painting', 'renovation', 'installation', 'improvement',
  'concreting', 'drainage', 'road', 'pavement', 'electrical', 'plumbing',
  'marine biological station', 'research station', 'dorm', 'dormitory',
  'laboratory', 'lab renovation', 'fire safety', 'solar panel', 'generator',
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

function parseItems(html) {
  // Find the "INVITATION TO BID" section and parse <li> items
  const itbSection = html.match(/INVITATION TO BID([\s\S]*?)(?:REQUEST FOR QUOTATION|<\/section|<\/article|$)/i);
  const section = itbSection ? itbSection[1] : html;

  const results = [];
  // Each <li> has a PDF link and description text
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(section)) !== null) {
    const content = m[1];
    // Extract PDF href
    const hrefM = content.match(/href="([^"]+\.pdf[^"]*)"/i);
    if (!hrefM) continue;
    let href = hrefM[1];
    if (href.startsWith('/')) href = 'https://www.upv.edu.ph' + href;

    // Extract text (strip tags)
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract bid number from href: /files/itb-2025-008.pdf or /files/BD-23-025.pdf
    const idM = href.match(/\/(itb-\d{4}-\d+|BD-\d{2}-\d+|bd-\d{2}-\d+)/i);
    const bidId = idM ? idM[1].toUpperCase() : path.basename(href, '.pdf').toUpperCase();

    results.push({ bidId, title: text.substring(0, 250), href });
  }
  return results;
}

async function main() {
  fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);

  console.log(`UPV Bids and Awards Watcher — ${today}`);
  console.log(`Fetching ${BASE_URL}`);

  let html;
  try {
    html = await fetchPage(BASE_URL);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    process.exit(1);
  }

  const items = parseItems(html);
  console.log(`  ${items.length} ITB entries found`);

  const newItems = [];
  for (const item of items) {
    const key = item.href;
    if (seen[key]) continue;

    const construction = isConstruction(item.title);
    const flag = construction ? ' [CONSTRUCTION]' : '';
    console.log(`  NEW${flag}: ${item.bidId} — ${item.title.substring(0, 100)}`);
    console.log(`    ${item.href}`);

    newItems.push({ ...item, foundDate: today, construction });
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
        console.log(`  ${i.bidId} — ${i.title.substring(0, 120)}`);
        console.log(`  ${i.href}`);
      });
    }
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newItems.length, items: newItems }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
