// Thin wrapper over the 2Captcha API.
//
// Reads API key from env TWOCAPTCHA_API_KEY or ~/.config/2captcha/api-key.

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { log } from './log.js';

const API = 'https://2captcha.com';

let cachedKey = null;

export function getApiKey() {
  if (cachedKey) return cachedKey;
  if (process.env.TWOCAPTCHA_API_KEY) {
    cachedKey = process.env.TWOCAPTCHA_API_KEY.trim();
    return cachedKey;
  }
  const candidates = [
    join(homedir(), '.config', '2captcha', 'api-key'),
    'C:/Users/TJatBICC/.config/2captcha/api-key',
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      cachedKey = readFileSync(p, 'utf8').trim();
      return cachedKey;
    }
  }
  return null;
}

async function poll(taskId, opts = {}) {
  const key = getApiKey();
  const max = opts.maxSeconds ?? 300;
  const interval = opts.intervalSeconds ?? 5;
  const start = Date.now();
  while ((Date.now() - start) / 1000 < max) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    const url = `${API}/res.php?key=${key}&action=get&id=${taskId}&json=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 1) return data.request;
    if (data.request !== 'CAPCHA_NOT_READY') {
      throw new Error(`2Captcha: ${data.request}`);
    }
  }
  throw new Error(`2Captcha: timeout after ${max}s (taskId=${taskId})`);
}

// Solve a Cloudflare Turnstile challenge.
export async function solveTurnstile({ sitekey, pageurl }) {
  const key = getApiKey();
  if (!key) throw new Error('No 2Captcha API key');
  const url = `${API}/in.php?key=${key}&method=turnstile&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageurl)}&json=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 1) throw new Error(`2Captcha submit: ${data.request}`);
  log.info(`2Captcha task ${data.request} (turnstile)`);
  return poll(data.request);
}

// Solve a reCAPTCHA v2 challenge.
export async function solveRecaptchaV2({ sitekey, pageurl }) {
  const key = getApiKey();
  if (!key) throw new Error('No 2Captcha API key');
  const url = `${API}/in.php?key=${key}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${encodeURIComponent(pageurl)}&json=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 1) throw new Error(`2Captcha submit: ${data.request}`);
  log.info(`2Captcha task ${data.request} (recaptcha v2)`);
  return poll(data.request);
}

// Solve hCaptcha
export async function solveHCaptcha({ sitekey, pageurl }) {
  const key = getApiKey();
  if (!key) throw new Error('No 2Captcha API key');
  const url = `${API}/in.php?key=${key}&method=hcaptcha&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageurl)}&json=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 1) throw new Error(`2Captcha submit: ${data.request}`);
  log.info(`2Captcha task ${data.request} (hcaptcha)`);
  return poll(data.request);
}

export async function balance() {
  const key = getApiKey();
  if (!key) return null;
  const res = await fetch(`${API}/res.php?key=${key}&action=getbalance&json=1`);
  const data = await res.json();
  return data.status === 1 ? parseFloat(data.request) : null;
}
