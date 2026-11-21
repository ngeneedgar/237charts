// Minimal Audiomack Data API client (OAuth 1.0a, consumer-only signing for public data).
// Needs AUDIOMACK_CONSUMER_KEY and AUDIOMACK_CONSUMER_SECRET in .env (free: https://audiomack.com/data-api/docs).
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const KEY = process.env.AUDIOMACK_CONSUMER_KEY;
const SECRET = process.env.AUDIOMACK_CONSUMER_SECRET;
export const hasAudiomackKey = Boolean(KEY && SECRET && !KEY.startsWith('paste'));

const BASE = 'https://api.audiomack.com/v1';
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function signRequest(method, url, params, key = KEY, secret = SECRET, nonce = randomBytes(16).toString('hex'), ts = Math.floor(Date.now() / 1000)) {
  const oauth = { oauth_consumer_key: key, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: String(ts), oauth_version: '1.0' };
  const all = { ...params, ...oauth };
  const paramStr = Object.keys(all).sort().map((k) => `${enc(k)}=${enc(all[k])}`).join('&');
  const base = [method.toUpperCase(), enc(url), enc(paramStr)].join('&');
  const signature = createHmac('sha1', `${enc(secret)}&`).update(base).digest('base64');
  return { ...all, oauth_signature: signature };
}

export async function am(path, params = {}) {
  if (!hasAudiomackKey) throw new Error('AUDIOMACK_CONSUMER_KEY / SECRET missing in .env');
  const url = `${BASE}/${path}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const qs = new URLSearchParams(signRequest('GET', url, params));
    const res = await fetch(`${url}?${qs}`, { signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (res?.status === 429 || !res) { await sleep(2000 * (attempt + 1)); continue; }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Audiomack ${path} ${res.status}: ${body.message ?? body.errorcode ?? ''}`);
    await sleep(250); // be polite
    return body;
  }
  throw new Error(`Audiomack ${path}: gave up after retries`);
}

/** Lifetime plays from a song object (the API has used several field names). */
export const playsOf = (song) =>
  Number(song?.stats?.['plays-raw'] ?? song?.stats?.plays ?? song?.plays ?? 0);
