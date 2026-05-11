#!/usr/bin/env node
// Find an image for a product. Reads JSON from stdin: { query, downloadAs }
// Outputs JSON to stdout: { image_url, image_b64, source_page, status }
//
// Uses Bing image search (simpler HTML structure than DDG), with Puppeteer
// to render and a single-shot HTTP fallback for the actual download.
//
// Stand-alone usage:
//   echo '{"query":"Generator 100kVA 3-phase Philippines"}' | node src/find-image.js

import { newPage } from './lib/browser.js';
import { log } from './lib/log.js';

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

async function findImage(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const page = await newPage();
  page.setDefaultTimeout(20000);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    // Bing image-search results are anchors with class 'iusc' carrying an `m`
    // attribute with JSON containing `murl` (image URL) and `purl` (page URL).
    const result = await page.evaluate(() => {
      const a = document.querySelector('a.iusc');
      if (!a) return null;
      const raw = a.getAttribute('m');
      if (!raw) return null;
      try {
        const m = JSON.parse(raw);
        return { image_url: m.murl || m.imgurl, source_page: m.purl || null };
      } catch { return null; }
    });
    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

async function downloadImage(url, maxBytes = 4_000_000) {
  // Native fetch with timeout
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length === 0 || buf.length > maxBytes) return null;
    return buf.toString('base64');
  } catch {
    return null;
  } finally { clearTimeout(t); }
}

(async () => {
  const input = await readStdin();
  let req;
  try { req = JSON.parse(input); }
  catch (e) {
    console.log(JSON.stringify({ status: 'bad_input', error: e.message }));
    process.exit(0);
  }
  const query = req.query;
  if (!query) {
    console.log(JSON.stringify({ status: 'no_query' }));
    process.exit(0);
  }

  let result;
  try {
    result = await findImage(query);
  } catch (e) {
    log.warn(`find_image error: ${e.message}`);
    console.log(JSON.stringify({ status: 'search_error', error: e.message }));
    process.exit(0);
  }

  if (!result || !result.image_url) {
    console.log(JSON.stringify({ status: 'no_results' }));
    process.exit(0);
  }

  const b64 = await downloadImage(result.image_url);
  if (!b64) {
    console.log(JSON.stringify({
      status: 'download_failed',
      image_url: result.image_url,
      source_page: result.source_page,
    }));
    process.exit(0);
  }
  console.log(JSON.stringify({
    status: 'ok',
    image_url: result.image_url,
    image_b64: b64,
    source_page: result.source_page,
  }));

  // Allow puppeteer to release
  setTimeout(() => process.exit(0), 50);
})();
