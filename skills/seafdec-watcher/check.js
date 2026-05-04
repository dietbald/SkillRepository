'use strict';

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const BASE_URL = 'https://www.seafdec.org.ph/invitation-to-bid/';
const SEEN_F   = path.join(__dirname, 'seen.json');
const RES_DIR  = path.join(__dirname, 'results');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const { execFile } = require('child_process');
    // curl handles slow servers better than Node.js https module
    const curlPath = process.platform === 'win32'
      ? 'C:\\Windows\\System32\\curl.exe'
      : 'curl';
    execFile(curlPath, [
      '-sL', url, '--max-time', '45',
    ], { maxBuffer: 10 * 1024 * 1024, timeout: 50000 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

function parseBids(html) {
  // SEAFDEC page has a table: Job Request No. | Description | Pre-bid | Deadline | Budget | Download
  // Rows contain job numbers like "028-02-2026"
  const bids = [];

  // Find job request number pattern (e.g. 028-02-2026, 041-03-2026)
  const jobRe = /(\d{3}-\d{2}-\d{4})\s*([\s\S]*?)(?=\d{3}-\d{2}-\d{4}|For those who intend|$)/g;

  // Strip tags to get plain text for parsing
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ');

  // Find the bids section
  const bidSection = stripped.match(/Job Request No\.([\s\S]*?)(?:For those who intend|$)/i);
  if (!bidSection) return bids;

  const section = bidSection[1];
  let m;
  while ((m = jobRe.exec(section)) !== null) {
    const jobNo = m[1];
    const rest = m[2].trim();

    // Extract budget (PHP X,XXX,XXX.XX pattern)
    const budgetMatch = rest.match(/PHP\s*([\d,]+\.?\d*)/i);
    const budget = budgetMatch ? budgetMatch[0] : '';

    // Extract dates
    const dates = rest.match(/\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi) || [];

    // Description is the text before "PHP" or dates
    let desc = rest.replace(/PHP\s*[\d,]+\.?\d*/gi, '').replace(/\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi, '').trim();
    desc = desc.substring(0, 200).trim();

    // Check for download links
    const pdfRe = new RegExp(`(https?://[^\\s"]+\\.pdf[^\\s"]*)`, 'gi');
    const pdfs = [...html.matchAll(new RegExp(`(?:${jobNo})[\\s\\S]{0,500}?(https?://[^"\\s]+\\.pdf)`, 'gi'))].map(x => x[1]);

    bids.push({ jobNo, description: desc, budget, dates, pdfs });
  }

  return bids;
}

async function main() {
  fs.mkdirSync(RES_DIR, { recursive: true });
  const seen = fs.existsSync(SEEN_F) ? JSON.parse(fs.readFileSync(SEEN_F, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);

  console.log(`SEAFDEC AQD Watcher — ${today}`);
  console.log(`Fetching ${BASE_URL}`);

  let html;
  try {
    html = await fetchPage(BASE_URL);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    process.exit(1);
  }

  const bids = parseBids(html);
  console.log(`  ${bids.length} bids found on page`);

  const newBids = [];
  for (const bid of bids) {
    if (seen[bid.jobNo]) continue;
    console.log(`  NEW [CONSTRUCTION]: ${bid.jobNo} — ${bid.description.substring(0, 100)}`);
    console.log(`    Budget: ${bid.budget}`);
    if (bid.dates.length) console.log(`    Dates: ${bid.dates.join(', ')}`);
    newBids.push({ ...bid, foundDate: today });
    seen[bid.jobNo] = today;
  }

  fs.writeFileSync(SEEN_F, JSON.stringify(seen, null, 2));

  if (newBids.length === 0) {
    console.log('\nNo new bids.');
  } else {
    console.log(`\n=== ${newBids.length} NEW BID(S) ===`);
    console.log('Contact: BAC Office, AFD Building, Buyu-an, Tigbauan, Iloilo | (+63) 33 330-7004 | bac@aqd.seafdec.org.ph');
  }

  const outPath = path.join(RES_DIR, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ date: today, newCount: newBids.length, bids: newBids }, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
