// DTI Business Name Registration Search — bnrs.dti.gov.ph/search
//
// CAPTCHA: SVG image-text (renders as <img src="...svg">). Solved via
//          2Captcha image-CAPTCHA API (~$0.001/solve).
//
// LIMITATIONS:
//   * Only "Exact Match" search is supported by DTI ("random searches not allowed").
//     Caller should pass a CANDIDATE full registered name (typically from DDG).
//   * If the candidate doesn't match exactly, returns null + 'no_result'.
//
// FLOW:
//   1. Load page
//   2. Type business name in #input_keyword
//   3. Wait for #divCaptcha .image-wrapper img to load
//   4. Screenshot the captcha image
//   5. Solve via 2Captcha image API
//   6. Type the solution in .input-text-code
//   7. Click .btn-submit (verify captcha)
//   8. Click main Search button
//   9. Parse results

import { newPage } from './browser.js';
import { getApiKey } from './captcha.js';
import { log } from './log.js';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DTI_URL = 'https://bnrs.dti.gov.ph/search';
const TWOCAPTCHA = 'https://2captcha.com';

async function solveImageCaptchaPng(pngBuffer) {
  const key = getApiKey();
  if (!key) throw new Error('No 2Captcha API key');
  log.dbg(`captcha PNG size: ${pngBuffer.length} bytes`);
  // 2captcha accepts multipart/form-data with the image file
  const fd = new FormData();
  fd.append('key', key);
  fd.append('method', 'post');
  fd.append('json', '1');
  // Construct a Blob from the PNG buffer
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  fd.append('file', blob, 'captcha.png');
  const submit = await fetch(`${TWOCAPTCHA}/in.php`, {
    method: 'POST', body: fd,
  });
  const sj = await submit.json();
  if (sj.status !== 1) throw new Error(`2Captcha submit: ${sj.request}`);
  const taskId = sj.request;
  log.info(`2Captcha task ${taskId} (image)`);
  // poll
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${TWOCAPTCHA}/res.php?key=${key}&action=get&id=${taskId}&json=1`);
    const rj = await res.json();
    if (rj.status === 1) return rj.request;
    if (rj.request !== 'CAPCHA_NOT_READY') throw new Error(`2Captcha poll: ${rj.request}`);
  }
  throw new Error('2Captcha image timeout');
}

function normalizeForDti(name) {
  // DTI's exact-match search rejects '&' — use 'AND' instead. Collapse whitespace.
  return name
    .replace(/&/g, 'AND')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDtiRow(cells) {
  // Schema observed: [name, territory, owner, cert_no, reg_date, status, scope]
  return {
    business_name: cells[0] || null,
    territory: cells[1] || null,
    owner_name: cells[2] || null,
    cert_no: cells[3] || null,
    registration_date: cells[4] || null,
    status: cells[5] || null,
    scope: cells[6] || null,
  };
}

export async function dtiSearch(name, _opts = {}) {
  const page = await newPage();
  page.setDefaultTimeout(60000);
  const queryName = normalizeForDti(name);
  const out = {
    source: 'dti_bnrs',
    query: queryName,
    original_query: name,
    full_name: null,
    candidates: [],
    note: null,
  };
  try {
    log.info(`DTI search: ${queryName}` + (queryName !== name ? ` (was "${name}")` : ''));
    await page.goto(DTI_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Type the business name
    await page.waitForSelector('#input_keyword', { visible: true });
    await page.click('#input_keyword', { clickCount: 3 });
    await page.type('#input_keyword', queryName, { delay: 30 });

    // Wait for CAPTCHA image to load
    await page.waitForSelector('#divCaptcha .image-wrapper img', { visible: true });
    await new Promise((r) => setTimeout(r, 1000)); // let SVG render

    // Screenshot the captcha image element to PNG
    const captchaEl = await page.$('#divCaptcha .image-wrapper img');
    if (!captchaEl) throw new Error('captcha image element not found');
    const pngBuf = await captchaEl.screenshot({ type: 'png', omitBackground: false });
    if (process.env.DEBUG_DTI) {
      const dbgPath = join(tmpdir(), `dti-captcha-${Date.now()}.png`);
      writeFileSync(dbgPath, pngBuf);
      log.info(`captcha PNG saved to ${dbgPath} (${pngBuf.length} bytes)`);
    }

    // Solve
    const answer = (await solveImageCaptchaPng(pngBuf)).trim();
    log.info(`DTI captcha solved: ${answer}`);

    // Type answer + click verify
    await page.click('#divCaptcha .input-text-code', { clickCount: 3 });
    await page.type('#divCaptcha .input-text-code', answer, { delay: 30 });
    const verifyBtn = await page.$('#divCaptcha .btn-submit');
    if (verifyBtn) {
      await verifyBtn.click().catch(() => {});
      await new Promise((r) => setTimeout(r, 800));
    }

    // Submit search
    await page.click('button[type="submit"]');
    await page.waitForNetworkIdle({ idleTime: 1500, timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    if (process.env.DEBUG_DTI) {
      const png2 = join(tmpdir(), `dti-after-submit-${Date.now()}.png`);
      await page.screenshot({ path: png2, fullPage: true });
      log.info(`post-submit screenshot: ${png2}`);
    }

    // Parse error / results
    const pageState = await page.evaluate(() => {
      // Filter out the close button '×' from error detection
      const cleanText = (el) => (el.innerText || '').replace(/×/g, '').replace(/\s+/g, ' ').trim();
      let errorText = '';
      for (const sel of ['.alert-danger', '.alert.alert-danger', '.text-danger']) {
        for (const el of document.querySelectorAll(sel)) {
          const t = cleanText(el);
          if (t && t.length > 1) { errorText = t; break; }
        }
        if (errorText) break;
      }
      const rows = [];
      document.querySelectorAll('table tbody tr').forEach((tr) => {
        const cells = [...tr.querySelectorAll('td')].map((td) => td.innerText.trim());
        if (cells.length >= 2 && !cells.every((c) => c === '')) rows.push(cells);
      });
      const panels = [];
      document.querySelectorAll('.panel, .card, .box, .result-item, [class*="result"]').forEach((p) => {
        const text = p.innerText.replace(/\s+/g, ' ').trim();
        if (text && text.length > 20 && text.length < 1000) panels.push(text);
      });
      const bodyText = document.body.innerText.toLowerCase();
      return { errorText, rows, panels, bodyText: bodyText.slice(0, 500) };
    });

    if (pageState.errorText) {
      log.warn(`DTI message: ${pageState.errorText}`);
      if (/captcha/i.test(pageState.errorText)) {
        out.note = 'captcha_failed';
      } else if (/no.*record|no.*result|not\s+found/i.test(pageState.errorText)) {
        out.note = 'no_result';
      } else {
        out.note = `dti_error: ${pageState.errorText}`;
      }
    }
    log.dbg(`DTI body sample: ${pageState.bodyText}`);

    // 0-results phrase from DTI: "0 search results found."
    if (/(\b0|no)\s+search\s+results?\s+found/i.test(pageState.bodyText) ||
        /no\s+record|nothing\s+found|not\s+found/i.test(pageState.bodyText)) {
      out.note = out.note || 'no_result';
    }
    if (pageState.rows.length > 0) {
      out.candidates = pageState.rows.map((cells) => parseDtiRow(cells));
      out.full_name = out.candidates[0].business_name || null;
      out.owner = out.candidates[0].owner_name || null;
      out.cert_no = out.candidates[0].cert_no || null;
      out.registration_date = out.candidates[0].registration_date || null;
      out.status = out.candidates[0].status || null;
      out.territory = out.candidates[0].territory || null;
      out.note = 'matched';
    }

    return out;
  } catch (e) {
    out.note = `error: ${e.message}`;
    log.warn(`DTI failed: ${e.message}`);
    return out;
  } finally {
    await page.close().catch(() => {});
  }
}
