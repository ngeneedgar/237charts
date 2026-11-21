// Minimal YouTube Data API v3 client with quota tracking. Reads YOUTUBE_API_KEY from .env.
import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    for (const line of readFileSync(new URL('../../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY || KEY.startsWith('paste')) throw new Error('YOUTUBE_API_KEY missing in .env');

// Unit costs: list calls = 1, search = 100
export const quota = { used: 0 };

export async function yt(endpoint, params, cost = 1) {
  const qs = new URLSearchParams({ ...params, key: KEY });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${qs}`);
  quota.used += cost;
  const body = await res.json();
  if (!res.ok) throw new Error(`YouTube ${endpoint} ${res.status}: ${body.error?.message}`);
  return body;
}

// Fetch details for up to N ids in batches of 50 (1 unit per batch)
export async function batched(endpoint, ids, part) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await yt(endpoint, { part, id: ids.slice(i, i + 50).join(','), maxResults: 50 });
    out.push(...r.items);
  }
  return out;
}
