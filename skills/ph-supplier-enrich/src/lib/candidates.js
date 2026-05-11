// Extract candidate "full registered name" strings from a piece of text
// (search-result title or snippet). Looks for chunks that contain a
// business-suffix keyword (Inc, Corp, Trading, Hardware, Lumber, etc.) and
// overlap with the query tokens.

const BUSINESS_SUFFIXES = [
  'INC', 'INCORPORATED', 'CORP', 'CORPORATION', 'CO', 'COMPANY',
  'LLC', 'LTD', 'LIMITED', 'OPC', 'ENTERPRISE', 'ENTERPRISES',
  'TRADING', 'MERCHANDISE', 'MERCHANDISING',
  'MARKETING', 'HARDWARE', 'SUPPLY', 'SUPPLIES',
  'LUMBER', 'CONSTRUCTION', 'BUILDERS', 'MART',
  'STEEL', 'CEMENT', 'GLASS', 'ALUMINUM', 'PAINT',
  'DEPOT', 'CENTER', 'ELECTRICAL', 'PLUMBING',
];

const SUFFIX_RE = new RegExp(
  `\\b(${BUSINESS_SUFFIXES.join('|')})\\b`,
  'i',
);

const STOP_TOKENS = new Set([
  'the', 'and', 'in', 'at', 'of', 'for', 'with', 'on', 'to',
  'a', 'an', 'is', 'are', 'was', 'were',
  'iloilo', 'philippines', 'phil', 'city', 'province',
  'philippines.', 'iloilo.',
]);

export function tokenize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 &]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP_TOKENS.has(t) && t.length > 1);
}

// Split a multiline blob into candidate "name lines" — at every line break,
// pipe, dash, or "·". Then keep only ones with a business suffix.
function chunks(text) {
  if (!text) return [];
  return text
    .split(/[\n\r|·•—–-]+/)
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter((c) => c.length >= 4 && c.length <= 120);
}

// Detect if candidate looks like a clean registered name (vs. snippet text):
// starts with capital, no @, no # hashtag, no excessive punctuation.
function looksClean(candidate) {
  if (/^[a-z]/.test(candidate)) return false;
  if (/[@#]/.test(candidate)) return false;
  if (/\b(likes|talking|followers|reviews|map|directions|posts)\b/i.test(candidate)) return false;
  if (/\b(was founded|provides|offers|works in|is located|is working|is a)\b/i.test(candidate)) return false;
  if (/\d{4,}/.test(candidate)) return false; // long numbers often indicate addresses/phones
  return true;
}

// Score a candidate against the query.
function scoreCandidate(candidate, queryTokens) {
  if (!SUFFIX_RE.test(candidate)) return 0;
  const candTokens = tokenize(candidate);
  if (candTokens.length === 0) return 0;
  const overlap = candTokens.filter((t) => queryTokens.includes(t)).length;
  if (overlap === 0) return 0;
  const containment = overlap / queryTokens.length;
  const extraBusiness = candTokens.some((t) =>
    BUSINESS_SUFFIXES.includes(t.toUpperCase()) && !queryTokens.includes(t),
  );
  let score = 0.7 * containment + (extraBusiness ? 0.25 : 0);
  if (candidate.length > 80) score *= 0.6;
  if (candidate.length > 50) score *= 0.85;
  if (looksClean(candidate)) score *= 1.0;
  else score *= 0.55;
  // Prefer shorter (registered names are usually 3-7 words)
  if (candTokens.length >= 2 && candTokens.length <= 7) score *= 1.1;
  return Math.min(1, score);
}

// ----------------------------------------------------------------------------
// Contact extractors — pull address, TIN, phone, email, website, Facebook from
// search result snippets/titles/URLs.
// ----------------------------------------------------------------------------

const PH_PHONE_RE = /(?:\+?63\s?|0)(?:9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|\d{2,3}[\s\-]?\d{3}[\s\-]?\d{4,7})/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// PH TIN: 3-3-3 or 3-3-3-3 digits or 9–12 digits straight
const TIN_RE = /\bTIN\s*[:#]?\s*(\d{3}[\s\-]\d{3}[\s\-]\d{3}(?:[\s\-]\d{3,5})?)/gi;
// Address heuristic: street/road/highway/avenue + Iloilo
const ADDR_RE = /(?:#?\s*[\w.\-]+\s+)?(?:[\w. ,'\/]+?)\s*(?:Street|Str?\.|St\.?|Road|Rd\.?|Avenue|Ave\.?|Highway|Hwy\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Brgy\.?|Barangay)\s*,?[\w. ,'\-]*?(?:Iloilo|Pavia|Jaro|Lapaz|La Paz|Mandurriao|Molo|Arevalo|Oton|San Miguel|Leganes)[\w. ,'\-]*/gi;
const FB_URL_RE = /https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/[^\s)\"'<>]+/gi;
const SOCIAL_DOMAINS = new Set([
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
  'youtube.com', 'tiktok.com', 'pinterest.com', 'wa.me', 'whatsapp.com',
  'duckduckgo.com', 'bing.com', 'google.com', 'yelp.com', 'yellowpages.com',
  'tripadvisor.com', 'klook.com', 'lazada.com.ph', 'shopee.ph',
  'cybo.com', '99nearby.com', 'iloilodirectory.com', 'hardware1000.com',
  'databasesets.com', 'mapcarta.com', 'wikipedia.org',
]);

function uniq(arr) {
  return [...new Set(arr)];
}

function isLikelyAddress(s) {
  if (s.length < 12 || s.length > 160) return false;
  if (/\b(likes|talking|followers|reviews|listings|business hours|welcome|find|owned|located|provides|see this|search|incorporated is|company)\b/i.test(s)) return false;
  // Must start with a number, #, or known PH address prefix
  if (!/^(?:#?\s*\d+|Brgy\.?|Barangay|Block|Bldg|Building|Lot)\b/i.test(s)) return false;
  // Must contain a street/road keyword
  if (!/\b(Street|Str?\.|St\.?|Road|Rd\.?|Avenue|Ave\.?|Highway|Hwy\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Brgy\.?|Barangay)\b/i.test(s)) return false;
  return true;
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}

function looksLikeOwnSite(url, queryTokens) {
  const host = hostnameOf(url);
  if (!host) return false;
  if (SOCIAL_DOMAINS.has(host)) return false;
  // Hostname starts/ends with one of the query tokens
  const noTld = host.replace(/\.[a-z.]{2,}$/, '').toLowerCase();
  return queryTokens.some(
    (t) => t.length >= 4 && (noTld.startsWith(t) || noTld.includes(t)),
  );
}

export function extractContacts(query, results) {
  const queryTokens = tokenize(query);
  const out = {
    addresses: [],
    phones: [],
    tins: [],
    emails: [],
    websites: [],
    facebook: [],
    instagram: [],
  };
  for (const r of results) {
    const text = `${r.title || ''}\n${r.snippet || ''}`;
    // Phones
    for (const m of text.matchAll(PH_PHONE_RE)) {
      out.phones.push(m[0].replace(/\s+/g, ' ').trim());
    }
    // Emails
    for (const m of text.matchAll(EMAIL_RE)) {
      out.emails.push(m[0]);
    }
    // TINs
    for (const m of text.matchAll(TIN_RE)) {
      out.tins.push(m[1]);
    }
    // Addresses (heuristic; require a number/street prefix and reject snippet noise)
    for (const m of text.matchAll(ADDR_RE)) {
      let a = m[0].replace(/\s+/g, ' ').trim();
      a = a.replace(/\s+(Tel(?:\.|ephone)?\s*(?:No\.|Number)?:?.*)$/i, '');
      a = a.replace(/\s+(See\s+.+|Get\s+directions.*|Directions.*|Open\s+today.*)$/i, '');
      a = a.replace(/[.,;:\-]+$/, '').trim();
      if (!isLikelyAddress(a)) continue;
      out.addresses.push(a);
    }
    // Facebook URLs in results
    for (const m of text.matchAll(FB_URL_RE)) out.facebook.push(m[0]);
    if (r.url) {
      const host = hostnameOf(r.url);
      if (host === 'facebook.com' || host === 'web.facebook.com' || host === 'm.facebook.com') {
        out.facebook.push(r.url.split('?')[0]);
      }
      if (host === 'instagram.com') {
        out.instagram.push(r.url.split('?')[0]);
      }
      if (looksLikeOwnSite(r.url, queryTokens)) {
        try {
          const u = new URL(r.url);
          out.websites.push(`${u.protocol}//${u.hostname}`);
        } catch {}
      }
    }
  }
  // Dedup
  for (const k of Object.keys(out)) out[k] = uniq(out[k]).slice(0, 5);
  return out;
}

// Extract candidates from a list of search results [{title, snippet, url}].
// Returns dedup'd list sorted by score desc.
export function extractCandidates(query, results) {
  const queryTokens = tokenize(query);
  const seen = new Map(); // upperCaseTrimmed -> {name, score, sources[]}
  for (const r of results) {
    for (const text of [r.title, r.snippet]) {
      for (const c of chunks(text)) {
        const score = scoreCandidate(c, queryTokens);
        if (score < 0.3) continue;
        const key = c.toUpperCase().replace(/[.,]+$/, '').trim();
        const existing = seen.get(key);
        if (!existing || existing.score < score) {
          seen.set(key, {
            full_name: c.replace(/[.,]+$/, '').trim(),
            score,
            url: r.url,
            from: text === r.title ? 'title' : 'snippet',
          });
        }
      }
    }
  }
  return [...seen.values()].sort((a, b) => b.score - a.score);
}

// "Discovered" candidates: chunks in search results that look like business
// names but don't overlap with the query (i.e. some other supplier surfaced
// alongside the query).
export function extractDiscoveries(query, results) {
  const queryTokens = new Set(tokenize(query));
  const seen = new Map();
  for (const r of results) {
    for (const text of [r.title, r.snippet]) {
      for (const c of chunks(text)) {
        if (!SUFFIX_RE.test(c)) continue;
        if (!looksClean(c)) continue;
        const candTokens = tokenize(c);
        if (candTokens.length < 2 || candTokens.length > 8) continue;
        const overlap = candTokens.filter((t) => queryTokens.has(t)).length;
        if (overlap > 0) continue;
        // Must have at least 2 substantive tokens (not just a suffix word)
        const substantive = candTokens.filter(
          (t) => !BUSINESS_SUFFIXES.includes(t.toUpperCase()),
        );
        if (substantive.length < 2) continue;
        // Must start with a capital letter (proper-noun-like)
        if (!/^[A-Z]/.test(c)) continue;
        const key = c.toUpperCase().replace(/[.,]+$/, '').trim();
        if (!seen.has(key)) {
          seen.set(key, {
            full_name: c.replace(/[.,]+$/, '').trim(),
            url: r.url,
            seen_in_query: query,
            from: text === r.title ? 'title' : 'snippet',
          });
        }
      }
    }
  }
  return [...seen.values()];
}
