#!/usr/bin/env node
// Rich DOM snapshot of the currently-active page in the running Chrome (debug port 9222).
// Prefer this over page.screenshot() for structural questions — it surfaces IDs, names,
// hrefs, hidden state, disabled state, table headers, feedback messages.
//
// Usage:
//   node inspect.js                    # first non-chrome tab, default sections
//   node inspect.js <url-fragment>     # pick tab whose URL contains the fragment
//   node inspect.js --frame <idx>      # inspect the Nth iframe (0 = main page)
//   node inspect.js --html <selector>  # dump outerHTML of the first matching element
//   node inspect.js --port 9223        # connect to a different debug port

const puppeteer = require('puppeteer-core');

function parseArgs(argv) {
  const args = { port: 9222, frame: 0 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = parseInt(argv[++i], 10);
    else if (a === '--frame') args.frame = parseInt(argv[++i], 10);
    else if (a === '--html') args.html = argv[++i];
    else if (a.startsWith('--')) { /* ignore unknown */ }
    else args.urlFilter = a;
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${args.port}`,
    defaultViewport: null,
    protocolTimeout: 30000,
  });
  const pages = await browser.pages();
  const candidates = pages.filter(p => !/^chrome|^devtools/.test(p.url()));
  const page = args.urlFilter
    ? candidates.find(p => p.url().includes(args.urlFilter))
    : candidates[0];
  if (!page) {
    console.error('No matching tab found. Open tabs:');
    pages.forEach(p => console.error('  ' + p.url()));
    process.exit(1);
  }

  const target = args.frame === 0 ? page : page.frames()[args.frame];
  if (!target) {
    console.error(`No frame at index ${args.frame}. Available frames:`);
    page.frames().forEach((f, i) => console.error(`  [${i}] ${f.url()}`));
    process.exit(1);
  }

  // --html mode: dump outerHTML of one element
  if (args.html) {
    const html = await target.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.outerHTML : null;
    }, args.html);
    if (html === null) { console.error('No element matches selector: ' + args.html); process.exit(1); }
    console.log(html);
    return;
  }

  // Full snapshot
  const snap = await target.evaluate(() => {
    const visible = el => el && el.offsetParent !== null;
    const text = el => (el?.innerText ?? el?.value ?? '').replace(/\s+/g, ' ').trim();
    const tr = (s, n) => (s || '').length > n ? (s || '').slice(0, n) + '…' : (s || '');
    const cls = el => (el?.className?.toString() || '').slice(0, 80);

    const inputs = [...document.querySelectorAll('input, textarea')]
      .filter(i => i.type !== 'hidden')
      .map(i => ({
        tag: i.tagName, type: i.type, name: i.name || '', id: i.id || '',
        value: i.value ? '<has-value>' : '', placeholder: i.placeholder || '',
        visible: visible(i), disabled: !!i.disabled,
      }));

    const buttons = [...document.querySelectorAll('button, input[type="submit"], input[type="button"]')]
      .map(b => ({
        tag: b.tagName, type: b.type, name: b.name || '', id: b.id || '',
        text: tr(text(b) || b.value, 60),
        disabled: !!b.disabled,
        ariaDisabled: b.getAttribute('aria-disabled'),
        visible: visible(b),
      }));

    const links = [...document.querySelectorAll('a')]
      .map(a => ({
        text: tr(text(a), 80),
        href: tr(a.href, 200),
        id: a.id || '',
        cls: cls(a),
        visible: visible(a),
      }));

    const selects = [...document.querySelectorAll('select')].map(s => ({
      name: s.name || '', id: s.id || '',
      value: s.value, currentText: s.options[s.selectedIndex]?.text || null,
      optionCount: s.options.length,
      options: [...s.options].slice(0, 12).map(o => ({ value: tr(o.value, 80), text: tr(o.text, 80) })),
    }));

    const tables = [...document.querySelectorAll('table')].map(t => {
      const headers = [...t.querySelectorAll('thead th, thead td')].map(h => text(h)).filter(Boolean);
      const rows = [...t.querySelectorAll('tbody tr')];
      return {
        cls: cls(t), id: t.id || '',
        headers,
        rowCount: rows.length,
        sampleRow: rows[0] ? [...rows[0].querySelectorAll('td')].map(c => tr(text(c), 60)) : [],
      };
    });

    const feedback = [...document.querySelectorAll('[class*="feedback" i], [class*="error" i], [class*="warning" i], [class*="alert" i], li[class*="message" i]')]
      .filter(visible)
      .map(e => ({ cls: cls(e), text: tr(text(e), 200) }))
      .filter(f => f.text.length > 3);

    const frames = [...document.querySelectorAll('iframe')].map((f, i) => ({
      i, src: tr(f.src, 200), id: f.id || '', name: f.name || '',
    }));

    return {
      url: location.href,
      title: document.title,
      counts: {
        inputs: inputs.length, buttons: buttons.length, links: links.length,
        selects: selects.length, tables: tables.length, frames: frames.length,
      },
      inputs, buttons, links: links.slice(0, 120), selects, tables, feedback, frames,
    };
  });

  console.log(JSON.stringify(snap, null, 2));
})();
