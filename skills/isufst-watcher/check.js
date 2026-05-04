'use strict';

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const BASE_URL  = 'https://isufst.edu.ph/bids-and-awards/';
const SEEN_F    = path.join(__dirname, 'seen.json');
const RES_DIR   = path.join(__dirname, 'results');

const CONSTRUCTION_KW = [
  'rehabilitation', 'construction', 'civil works', 'repair', 'building',
  'infrastructure', 'perimeter', 'fence', 'guardhouse', 'gate', 'flooring',
  'roofing', 'painting', 'renovation', 'installation of', 'improvement',
  'concreting', 'drainage', 'road', 'pavement', 'electrical', 'plumbing',
];

function isConstruction(title) {
  const t = title.toLowerCase();
  return CONSTRUCTION_KW.some(k => t.includes(k));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
  // Each row: <tr class="row-N"><td class="column-1">Type</td>
  //   <td class="column-2">Title</td>
  //   <td class="column-3"><a href="...pdf">View</a></td>
  //   <td class="column-4">Year</td></tr>
  const re = /<tr[^>]*class="row-\d+"[^>]*>([\s\S]*?)<\/tr>/gi;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const row = m[1];
    const cols = [...row.matchAll(/<td[^>]*class="column-(\d+)"[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cols.length < 3) continue;
    const type  = cols[0]?.[2]?.replace(/<[^>]+>/g, '').trim() || '';
    const title = cols[1]?.[2]?.replace(/<[^>]+>/g, '').trim() || '';
    const fileCell = cols[2]?.[2] || '';
    const href  = (fileCell.match(/href="([^"]+\.pdf[^"]*)"/i) || [])[1] || '';
    const year  = cols[3]?.[2]?.replace(/<[^>]+>/g, '').trim() || '';
    if (!href || !title) continue;
    results.push({ type, title, href, year });
  }
  return results;
}

async function main() {
  fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);

  console.log(`ISUFST Watcher — ${today}`);
  console.log(`Fetching ${BASE_URL}`);

  let html;
  try {
    html = await fetchPage(BASE_URL);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    process.exit(1);
  }

  const rows = parseRows(html);
  console.log(`  ${rows.length} total entries`);

  const newItems = [];
  for (const row of rows) {
    const key = row.href;
    if (seen[key]) continue;

    const construction = isConstruction(row.title);
    const flag = construction ? ' [CONSTRUCTION]' : '';
    console.log(`  NEW${flag}: [${row.year}] ${row.type} — ${row.title}`);
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
        console.log(`  [${i.year}] ${i.title}`);
        console.log(`  ${i.href}`);
      });
    }
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newItems.length, items: newItems }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
