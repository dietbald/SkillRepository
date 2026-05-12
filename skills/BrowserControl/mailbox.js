// Throwaway mailbox helpers for receipt verification.
// Default provider: Mailinator (free public inbox API, no key). Falls back to 1secmail if requested.
//
// Library usage:
//   const { mkAddr, poll, getMessage, findVerifyLink, unwrapAwsTrack }
//     = require('/c/Users/<you>/.claude/skills/BrowserControl/mailbox.js');
//   // or relative if symlinked / copied into the project test dir
//
//   const addr = mkAddr('signup-test');
//   // trigger the action that sends mail to `addr`
//   const res = await poll(addr, { timeoutMs: 90000, subjectMatch: /verify|verif|confirm/i });
//   // res = { ok: true, msgs: [{ subject, fromfull, id, time, ... }], all: [...] }
//   if (res.ok) {
//     const body = await getMessage(addr, res.msgs[0].id);
//     const link = findVerifyLink(body, /your-app\.example\.com/);
//   }
//
// CLI usage (quick inspect):
//   node mailbox.js probe                                  # check mailinator is reachable
//   node mailbox.js make my-prefix                         # mint an address
//   node mailbox.js poll <local-part-or-address>           # list messages
//   node mailbox.js read <local-part-or-address> <id>      # dump full body
//   node mailbox.js link <local-part-or-address> <id> <regex>   # extract first matching link
//
// Caveats:
//   - Mailinator public inboxes are world-readable. Use only for throwaway/test mail.
//   - AWS SES tracking-wrapper links (`*.awstrack.me/L0/<encoded>/...`) are single-use. Always
//     unwrap to the direct URL before navigating (see unwrapAwsTrack / findVerifyLink).
//   - Mailinator's HTTP response body uses JSON-escaped slashes (`\/`); findVerifyLink handles both.

const https = require('https');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BrowserControl-mailbox/1.0', 'Accept': 'application/json', ...headers } }, res => {
      let buf = '';
      res.on('data', c => (buf += c));
      res.on('end', () => resolve({ status: res.statusCode, body: buf, headers: res.headers }));
    }).on('error', reject);
  });
}

const DOMAINS = {
  mailinator: 'mailinator.com',
  onesec: '1secmail.com',
};

function mkAddr(prefix = 'test', provider = 'mailinator') {
  const ts = Date.now();
  return `${prefix}-${ts}@${DOMAINS[provider] || DOMAINS.mailinator}`;
}

function splitAddr(addressOrLocal) {
  if (addressOrLocal.includes('@')) {
    const [local, domain] = addressOrLocal.split('@');
    return { local, domain, provider: domain === 'mailinator.com' ? 'mailinator' : domain === '1secmail.com' ? 'onesec' : 'unknown' };
  }
  return { local: addressOrLocal, domain: 'mailinator.com', provider: 'mailinator' };
}

async function listMailinator(local) {
  const url = `https://api.mailinator.com/api/v2/domains/public/inboxes/${encodeURIComponent(local)}`;
  const res = await get(url);
  if (res.status !== 200) return { ok: false, status: res.status, raw: res.body.slice(0, 200) };
  try {
    const j = JSON.parse(res.body);
    return { ok: true, msgs: j.msgs || [] };
  } catch { return { ok: false, error: 'parse' }; }
}

async function list1secmail(local, domain) {
  const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${encodeURIComponent(local)}&domain=${encodeURIComponent(domain)}`;
  const res = await get(url);
  if (res.status !== 200) return { ok: false, status: res.status };
  try { return { ok: true, msgs: JSON.parse(res.body) }; } catch { return { ok: false, error: 'parse' }; }
}

async function poll(address, opts = {}) {
  const timeoutMs = opts.timeoutMs || 90000;
  const intervalMs = opts.intervalMs || 5000;
  const { local, domain, provider } = splitAddr(address);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let res;
    if (provider === 'mailinator') res = await listMailinator(local);
    else if (provider === 'onesec') res = await list1secmail(local, domain);
    else res = { ok: false, error: 'unsupported provider for ' + domain };
    if (res.ok && res.msgs && res.msgs.length > 0) {
      const filtered = opts.subjectMatch
        ? res.msgs.filter(m => opts.subjectMatch.test(m.subject || ''))
        : res.msgs;
      if (filtered.length > 0) return { ok: true, msgs: filtered, all: res.msgs };
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { ok: false, error: 'timeout', address };
}

async function getMessage(address, msgId) {
  const { local, domain, provider } = splitAddr(address);
  if (provider === 'mailinator') {
    const url = `https://api.mailinator.com/api/v2/domains/public/inboxes/${encodeURIComponent(local)}/messages/${encodeURIComponent(msgId)}`;
    const res = await get(url);
    return res.body;
  }
  if (provider === 'onesec') {
    const url = `https://www.1secmail.com/api/v1/?action=readMessage&login=${encodeURIComponent(local)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msgId)}`;
    const res = await get(url);
    return res.body;
  }
  throw new Error('unsupported provider for ' + domain);
}

// AWS SES wraps every outbound link in https://<id>.r.<region>.awstrack.me/L0/<urlencoded-direct>/...
// These wrappers are SINGLE-USE — the first visit redirects, subsequent visits HTTP 400.
// unwrapAwsTrack returns the direct URL inside the wrapper, or the original URL if it isn't wrapped.
function unwrapAwsTrack(url) {
  if (!url || !/awstrack\.me\/L0\//.test(url)) return url;
  const m = url.match(/awstrack\.me\/L0\/(https?(?::|%3A)[^/]+(?:\/[^/]+)*?)\/\d+\//i);
  if (!m) return url;
  try { return decodeURIComponent(m[1]); } catch { return url; }
}

// findVerifyLink scans a raw message body (HTML or JSON-escaped) for the first link matching a domain regex.
// Handles JSON-escaped slashes (`\/`) from Mailinator's API and unwraps AWS SES tracking links.
// Returns the direct URL string, or null.
function findVerifyLink(body, domainRe) {
  if (!body) return null;
  if (!(domainRe instanceof RegExp)) domainRe = new RegExp(domainRe);
  // Normalise the input — collapse `\/` to `/` so a single set of patterns matches both forms.
  const normalized = body.replace(/\\\//g, '/');
  const domain = domainRe.source.replace(/^\^|\$$/g, '');
  // Direct URL matching the target domain (any path)
  const directRe = new RegExp(`https:\\/\\/${domain}\\/[^\\s"'<>\\\\]+`, 'i');
  const direct = normalized.match(directRe);
  if (direct) return unwrapAwsTrack(direct[0]);
  // AWS SES wrapper containing the target domain URL-encoded
  // Encode `:`, `/`, `.` segment-by-segment so we can match `https%3A%2F%2F<dotsAsLiterals>`
  const encDomain = domain.replace(/\\\./g, '.').replace(/\./g, '\\.');
  const wrappedRe = new RegExp(`https:\\/\\/[^\\s"'<>]*awstrack\\.me\\/L0\\/https(?::|%3A)(?://|%2F%2F)${encDomain}[^\\s"'<>]+`, 'i');
  const wrapped = normalized.match(wrappedRe);
  if (wrapped) return unwrapAwsTrack(wrapped[0]);
  return null;
}

async function probe(provider = 'mailinator') {
  const addr = mkAddr('probe', provider);
  const { local, domain } = splitAddr(addr);
  let res;
  if (provider === 'mailinator') res = await listMailinator(local);
  else if (provider === 'onesec') res = await list1secmail(local, domain);
  else res = { ok: false, error: 'unsupported' };
  return { addr, ok: res.ok, info: res };
}

module.exports = { mkAddr, poll, getMessage, findVerifyLink, unwrapAwsTrack, probe, splitAddr };

// CLI entry
if (require.main === module) {
  (async () => {
    const [, , cmd, ...args] = process.argv;
    if (cmd === 'probe') {
      const provider = args[0] || 'mailinator';
      console.log(JSON.stringify(await probe(provider), null, 2));
    } else if (cmd === 'make') {
      console.log(mkAddr(args[0] || 'test', args[1] || 'mailinator'));
    } else if (cmd === 'poll') {
      const addr = args[0];
      if (!addr) { console.error('usage: mailbox.js poll <address-or-local>'); process.exit(2); }
      const res = await poll(addr, { timeoutMs: parseInt(args[1] || '15000', 10), intervalMs: 3000 });
      console.log(JSON.stringify(res, null, 2));
    } else if (cmd === 'read') {
      const [addr, id] = args;
      if (!addr || !id) { console.error('usage: mailbox.js read <address-or-local> <msg-id>'); process.exit(2); }
      console.log(await getMessage(addr, id));
    } else if (cmd === 'link') {
      const [addr, id, re] = args;
      if (!addr || !id || !re) { console.error('usage: mailbox.js link <address-or-local> <msg-id> <domain-regex>'); process.exit(2); }
      const body = await getMessage(addr, id);
      console.log(findVerifyLink(body, new RegExp(re)) || '(no match)');
    } else {
      console.log('mailbox.js — throwaway mailbox helper');
      console.log('commands: probe | make <prefix> | poll <addr> [timeoutMs] | read <addr> <id> | link <addr> <id> <domain-regex>');
    }
  })().catch(e => { console.error(e); process.exit(1); });
}
