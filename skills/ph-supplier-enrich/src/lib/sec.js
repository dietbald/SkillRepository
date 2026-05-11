// SEC company search via OpenCorporates Philippine jurisdiction.
//
// Why not the official SEC portal: efast.sec.gov.ph/companies/search is 404
// (deprecated), www.sec.gov.ph/company-data is Cloudflare 403, and the new
// eSECURE portal requires login. OpenCorporates aggregates SEC data and
// exposes a public search.
//
// Protection: HAProxy challenge with hCaptcha (sitekey
// 5ddae562-c25e-4910-85ae-e758f8841672). Solved via 2captcha (~$0.003/solve).
// After solving once, the session cookie is good for a while, so subsequent
// queries from the same browser instance are CAPTCHA-free.

import { newPage } from './browser.js';
import { solveHCaptcha } from './captcha.js';
import { log } from './log.js';

const OC_BASE = 'https://opencorporates.com';
const HCAPTCHA_SITEKEY = '5ddae562-c25e-4910-85ae-e758f8841672';

async function bypassHCaptchaIfPresent(page) {
  const challenged = await page.evaluate(() => {
    return document.title.includes('Challenge') ||
           !!document.querySelector('.h-captcha, iframe[src*="hcaptcha"]');
  });
  if (!challenged) return false;
  log.info('OpenCorporates: hCaptcha challenge detected, inspecting form...');

  // Inspect the form so we can submit it correctly
  const formInfo = await page.evaluate(() => {
    const f = document.querySelector('form');
    if (!f) return null;
    const ta = f.querySelector('textarea[name="h-captcha-response"]') ||
               document.querySelector('textarea[name="h-captcha-response"]');
    return {
      action: f.action,
      method: f.method,
      hasResponseField: !!ta,
      onsubmit: !!f.onsubmit,
      inputs: [...f.querySelectorAll('input,textarea')].map((i) =>
        ({ name: i.name, type: i.type, value: (i.value || '').slice(0, 40) })),
    };
  });
  log.dbg(`form info: ${JSON.stringify(formInfo)}`);

  const url = page.url();
  const token = await solveHCaptcha({ sitekey: HCAPTCHA_SITEKEY, pageurl: url });
  log.info('hCaptcha solved, submitting...');

  await page.evaluate((tok) => {
    // Set both input and textarea variants
    document.querySelectorAll(
      'input[name="h-captcha-response"], textarea[name="h-captcha-response"], '
      + 'input[name="g-recaptcha-response"], textarea[name="g-recaptcha-response"]'
    ).forEach((el) => { el.value = tok; });
    if (typeof window.hcaptchaCallback === 'function') {
      try { window.hcaptchaCallback(tok); } catch {}
    }
    const f = document.querySelector('form');
    if (f) HTMLFormElement.prototype.submit.call(f);
  }, token);
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  return true;
}

function parseSearchResults(htmlExtract) {
  // Parse rows extracted by page.evaluate inside secSearch.
  // We expect each row: { name, registration_no, jurisdiction, status, incorp_date, url }
  return htmlExtract;
}

export async function secSearch(name, _opts = {}) {
  const page = await newPage();
  page.setDefaultTimeout(60000);
  const out = {
    source: 'sec',  // semantic; underlying source is OpenCorporates → SEC PH
    underlying_source: 'opencorporates',
    query: name,
    full_name: null,
    candidates: [],
    note: null,
  };
  try {
    log.info(`SEC (opencorp) search: ${name}`);
    const q = encodeURIComponent(name);
    await page.goto(`${OC_BASE}/companies/ph?q=${q}`, {
      waitUntil: 'domcontentloaded', timeout: 60000,
    });
    // Solve challenge if present
    await bypassHCaptchaIfPresent(page);

    // Sometimes the challenge bounces back to the URL, sometimes to a path
    // without the query — re-navigate if needed.
    if (!page.url().includes('/companies/ph')) {
      await page.goto(`${OC_BASE}/companies/ph?q=${q}`, {
        waitUntil: 'domcontentloaded', timeout: 60000,
      });
      await bypassHCaptchaIfPresent(page);
    }

    // Parse results — OpenCorporates uses .search_results > li.company
    const results = await page.evaluate(() => {
      const out = [];
      const blocks = document.querySelectorAll('li.company, li.search-result, .company-search-result');
      for (const b of blocks) {
        const a = b.querySelector('a.company_search_result, a.company, h3 a, a[href*="/companies/ph/"]');
        if (!a) continue;
        const href = a.getAttribute('href') || '';
        const fullName = (a.innerText || '').trim();
        const text = b.innerText.replace(/\s+/g, ' ').trim();
        // Heuristic field extraction from row text
        const status = (text.match(/Status:\s*([^\n,•]+)/i) || [])[1]?.trim() || null;
        const inc = (text.match(/Incorporated\s+on\s+([0-9A-Za-z ,]+?)(?:\s|$)/i) || [])[1]?.trim() || null;
        const reg = (text.match(/Company\s+Number\s+([A-Z0-9\-]+)/i) || [])[1] ||
                    (text.match(/(?:^|\W)([A-Z]{2}\d{6,12})\b/) || [])[1] || null;
        out.push({
          full_name: fullName,
          opencorp_url: href.startsWith('http') ? href : 'https://opencorporates.com' + href,
          registration_no: reg,
          status,
          incorporation_date: inc,
          raw: text.slice(0, 400),
        });
      }
      return out;
    });

    if (results.length > 0) {
      out.candidates = results;
      out.full_name = results[0].full_name;
      out.registration_no = results[0].registration_no;
      out.status = results[0].status;
      out.incorporation_date = results[0].incorporation_date;
      out.note = 'matched';
    } else {
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 800));
      if (/no\s+companies\s+found|0\s+result/i.test(bodyText)) {
        out.note = 'no_result';
      } else {
        out.note = 'no_visible_results';
      }
      if (process.env.DEBUG_SEC) {
        out._debug_body = bodyText;
        out._debug_url = page.url();
        out._debug_title = await page.title();
      }
    }
    return out;
  } catch (e) {
    out.note = `error: ${e.message}`;
    log.warn(`SEC (opencorp) failed: ${e.message}`);
    return out;
  } finally {
    await page.close().catch(() => {});
  }
}
