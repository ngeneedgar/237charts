// 237 Charts — public "For artists" request form → POST /api/request
// Stored in Cloudflare KV (binding REQUESTS), never in the public repo: requests contain contact details.
// Read and answered in the admin (/admin/requests/). Spam: hidden honeypot field + max 5 requests per hour per visitor.

const TYPES = ['add', 'fix', 'merge', 'elig', 'remove', 'other'];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v, max) => (typeof v === 'string' ? v.replace(/\s+\n/g, '\n').trim().slice(0, max) : '');

async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.REQUESTS) return json({ error: 'not-configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad-request' }, 400); }
  if (b.website) return json({ ok: true }); // honeypot filled → silently drop (bots)

  const r = {
    type: TYPES.includes(b.type) ? b.type : 'other',
    artist: clean(b.artist, 120), song: clean(b.song, 200), links: clean(b.links, 1000),
    details: clean(b.details, 3000), contact: clean(b.contact, 200), lang: b.lang === 'en' ? 'en' : 'fr',
  };
  if (!r.artist || !r.details || !r.contact) return json({ error: 'missing-fields' }, 400);

  // Rate limit per visitor (hashed IP, kept 1 hour, never stored with the request)
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const rl = `rl:${await sha(ip + (env.RATE_SALT || '237'))}`;
  const n = Number(await env.REQUESTS.get(rl)) || 0;
  if (n >= 5) return json({ error: 'too-many' }, 429);
  await env.REQUESTS.put(rl, String(n + 1), { expirationTtl: 3600 });

  const created = new Date().toISOString();
  const id = `${created.replace(/\D/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 6)}`;
  await env.REQUESTS.put(`req:${id}`, JSON.stringify({ id, created, ...r, status: 'new', assignee: null, notes: [] }));
  return json({ ok: true, id });
}

export const onRequest = () => json({ error: 'method-not-allowed' }, 405);
