'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Iloilo Provincial Government BAC - lists all procurement items, newest first
// Structure: div.item > div.title + div.date + div.link (Google Drive)
const BASE_URL = 'https://iloilo.gov.ph/en/bac-reports-view';
const SEEN_F   = path.join(__dirname, 'seen.json');
const RES_DIR  = path.join(__dirname, 'results');

const CONSTRUCTION_KW = [
  'rehabilitation', 'construction', 'civil works', 'repair', 'building',
  'infrastructure', 'perimeter', 'fence', 'guardhouse', 'gate', 'flooring',
  'roofing', 'painting', 'renovation', 'installation', 'improvement',
  'concreting', 'drainage', 'road', 'pavement', 'electrical', 'plumbing',
  'walkway', 'gymnasium', 'gym', 'classroom', 'school', 'multi-purpose',
  'slope protection', 'retaining wall', 'cistern', 'tank', 'water system',
  'bridge', 'culvert', 'canal', 'dike', 'seawall', 'grading', 'filling',
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
  // Each item: <div class="item"> containing title/date/link divs
  const results = [];
  const itemRe = /<div[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*item[^"]*"|$)/gi;
  let m;

  // Alternative: parse all .title and .date pairs
  // The page renders: title text, taxonomy tags, author, date, drive link
  const entries = html.match(/<div[^>]*class="[^"]*views-row[^"]*"[^>]*>[\s\S]*?<\/div>\s*(?=<div[^>]*class="[^"]*views-row|$)/gi) || [];

  if (entries.length === 0) {
    // Fallback: look for the title+date pattern directly in anchor tags
    // Each entry has a title link pointing to a node, and a date
    const rowRe = /class="views-field[^"]*views-field-title[^"]*"[^>]*>\s*<span[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    while ((m = rowRe.exec(html)) !== null) {
      const href  = m[1];
      const title = m[2].trim();
      // Extract date near this entry
      const dateM = html.substring(m.index, m.index + 300).match(/\d{4}-\d{2}-\d{2}/);
      const date  = dateM ? dateM[0] : '';
      // Extract drive link near this entry
      const driveM = html.substring(m.index, m.index + 500).match(/href="(https:\/\/drive\.google\.com\/[^"]+)"/i);
      const driveLink = driveM ? driveM[1] : '';
      const bidNo = title.match(/^([A-Z]+-\d+-\d+-[A-Z0-9()]+)/)?.[1] || '';
      results.push({ bidNo, title, date, driveLink, href: 'https://iloilo.gov.ph' + href });
    }
    return results;
  }

  return results;
}

function parseItemsSimple(html) {
  // Page structure: each entry has a bid number like "HMO-26-604-B MEDICAL EQUIPMENT"
  // followed by taxonomy tags, author, date (YYYY-MM-DD), and a Drive link.
  // Bid number pattern: 2-5 uppercase letters, dash, 2-digit year, dash, 3-4 digits, dash, suffix
  const results = [];
  const bidNoPattern = /[A-Z]{2,5}-\d{2}-\d{3,4}-[A-Z0-9]+(?:\([^)]*\))?(?:\s*\(REBID(?:\s+\d+)?\))?/;
  const bidRe = new RegExp(bidNoPattern.source, 'gi');

  // Strip to plain text for easier parsing
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ');

  // Find all bid number positions
  const matches = [];
  let m;
  const re2 = new RegExp(bidNoPattern.source, 'gi');
  while ((m = re2.exec(text)) !== null) {
    matches.push({ bidNo: m[0].trim(), index: m.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const { bidNo, index } = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : index + 400;
    const chunk = text.substring(index, Math.min(nextIndex, index + 400));

    // Description: everything after bidNo until "Bids and Awards" tag or date
    let desc = chunk.substring(bidNo.length).replace(/Bids and Awards.*$/, '').replace(/Bid Tender.*$/, '').replace(/Request for Quotation.*$/, '').trim();
    desc = desc.substring(0, 150).trim();
    const title = (bidNo + (desc ? ' ' + desc : '')).replace(/\s+/g, ' ').substring(0, 200);

    const dateM = chunk.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateM ? dateM[1] : '';

    // Find drive link in original html near this bid number
    const pos = html.indexOf(bidNo);
    const driveM = pos >= 0
      ? html.substring(pos, Math.min(html.length, pos + 600)).match(/href="(https:\/\/drive\.google\.com\/[^"]+)"/i)
      : null;
    const driveLink = driveM ? driveM[1] : '';

    // Skip duplicates from repeated mentions (dedupe on bidNo)
    if (results.some(r => r.bidNo === bidNo)) continue;

    results.push({ bidNo, title, date, driveLink });
  }
  return results;
}

async function main() {
  fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Iloilo Provincial BAC Watcher — ${today}`);
  console.log(`Fetching ${BASE_URL}`);

  let html;
  try {
    html = await fetchPage(BASE_URL);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    process.exit(1);
  }

  const items = parseItemsSimple(html);
  console.log(`  ${items.length} entries parsed (page 1)`);

  const newItems = [];
  for (const item of items) {
    const key = item.bidNo;
    if (!key || seen[key]) continue;

    const construction = isConstruction(item.title);
    const flag = construction ? ' [CONSTRUCTION]' : '';
    console.log(`  NEW${flag}: ${item.title.substring(0, 120)}`);
    if (item.date) console.log(`    Date: ${item.date}`);

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
        console.log(`  ${i.title}`);
        if (i.driveLink) console.log(`  ${i.driveLink}`);
      });
    }
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newItems.length, items: newItems }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
