// Thin wrapper over the 2Captcha API for image-CAPTCHA solving (the
// DTI BNRS uses an SVG-rendered text captcha that we screenshot to PNG).
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
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      cachedKey = readFileSync(p, 'utf8').trim();
      return cachedKey;
    }
  }
  return null;
}

export async function solveImageCaptchaPng(pngBuffer) {
  const key = getApiKey();
  if (!key) throw new Error('No 2Captcha API key (~/.config/2captcha/api-key)');
  log.dbg(`captcha PNG size: ${pngBuffer.length} bytes`);
  const fd = new FormData();
  fd.append('key', key);
  fd.append('method', 'post');
  fd.append('json', '1');
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  fd.append('file', blob, 'captcha.png');
  const submit = await fetch(`${API}/in.php`, { method: 'POST', body: fd });
  const sj = await submit.json();
  if (sj.status !== 1) throw new Error(`2Captcha submit: ${sj.request}`);
  const taskId = sj.request;
  log.info(`2Captcha task ${taskId} (image)`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${API}/res.php?key=${key}&action=get&id=${taskId}&json=1`);
    const rj = await res.json();
    if (rj.status === 1) return rj.request;
    if (rj.request !== 'CAPCHA_NOT_READY') throw new Error(`2Captcha poll: ${rj.request}`);
  }
  throw new Error('2Captcha image timeout');
}

export async function balance() {
  const key = getApiKey();
  if (!key) return null;
  const res = await fetch(`${API}/res.php?key=${key}&action=getbalance&json=1`);
  const data = await res.json();
  return data.status === 1 ? parseFloat(data.request) : null;
}
