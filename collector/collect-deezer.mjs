// 237 Charts — weekly Deezer snapshot (free public API, no key).
// For each trusted artist: find their Deezer profile (cached), record fans + top tracks' "rank"
// (Deezer's popularity score, 0–1,000,000, driven by recent streams).
// Usage: node collector/collect-deezer.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { similarity } from './lib/names.mjs';
import { loadRoster } from './lib/roster.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function dz(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(150 * (attempt + 1)); // Deezer limit: 50 requests / 5 s
    try {
      const r = await fetch(`https://api.deezer.com/${path}`, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.error?.code === 4) { await sleep(5000); continue; } // quota → wait
      if (j.error) return null;
      return j;
    } catch { /* retry */ }
  }
  return null;
}

const PROFILES = 'collector/out/deezer-profiles.json';
const wikidata = await loadRoster();
const matches = JSON.parse(await readFile('collector/out/channel-matches.json', 'utf8').catch(() => '{}'));
const profiles = JSON.parse(await readFile(PROFILES, 'utf8').catch(() => '{}'));
const trusted = wikidata.filter((a) => a.youtube.length || a.discoveredVia || matches[a.wikidata]?.status === 'auto');

// ---------- profile matching ----------
for (const a of trusted) {
  if (a.wikidata in profiles) continue;
  const names = [a.name, ...(a.aliases ?? [])];
  let best = null;
  for (const q of [...new Set([a.aliases?.[0], a.name].filter(Boolean))]) {
    const r = await dz(`search/artist?q=${encodeURIComponent(q)}&limit=5`);
    for (const p of r?.data ?? []) {
      const sim = Math.max(...names.map((n) => similarity(n, p.name)));
      // Exact name + some audience is strong; common names with no fans are not
      const conf = sim * 0.85 + (p.nb_fan > 500 ? 0.1 : 0) + (p.nb_fan > 5000 ? 0.05 : 0);
      if (!best || conf > best.confidence) best = { id: p.id, name: p.name, fans: p.nb_fan, similarity: +sim.toFixed(2), confidence: +Math.min(conf, 0.99).toFixed(2) };
    }
    if (best?.confidence >= 0.9) break;
  }
  profiles[a.wikidata] = { artist: a.name, ...best, status: !best ? 'none' : best.confidence >= 0.9 ? 'auto' : best.confidence >= 0.6 ? 'review' : 'none' };
}
await writeFile(PROFILES, JSON.stringify(profiles, null, 2));

// ---------- weekly data ----------
const artists = {}, tracks = {};
for (const [qid, p] of Object.entries(profiles)) {
  if (p.status !== 'auto') continue;
  const info = await dz(`artist/${p.id}`);
  const top = await dz(`artist/${p.id}/top?limit=50`);
  artists[qid] = { deezerId: p.id, name: p.name, fans: info?.nb_fan ?? p.fans };
  for (const t of top?.data ?? []) {
    tracks[t.id] = { wikidata: qid, artist: p.artist, title: t.title_short ?? t.title, rank: t.rank, albumId: t.album?.id, link: t.link };
  }
}

const takenAt = new Date().toISOString();
await mkdir('collector/out/snapshots', { recursive: true });
const file = `collector/out/snapshots/deezer-${takenAt.slice(0, 10)}.json`;
await writeFile(file, JSON.stringify({ takenAt, artists, tracks }, null, 2));
const st = (x) => Object.values(profiles).filter((p) => p.status === x).length;
console.log(`Deezer profiles → auto: ${st('auto')} · review: ${st('review')} · none: ${st('none')}`);
console.log(`Tracks recorded: ${Object.keys(tracks).length} → ${file}`);
