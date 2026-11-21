// 237 Charts — weekly Audiomack snapshot (official Data API).
// 1. Find each trusted artist's Audiomack profile (search by name / stage name, cached).
// 2. Record lifetime plays for their uploads from the last 104 weeks.
// Weekly plays = this snapshot − previous snapshot (done in build-week.mjs).
// Usage: node collector/collect-audiomack.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { am, playsOf, hasAudiomackKey } from './lib/audiomack.mjs';
import { similarity } from './lib/names.mjs';
import { loadRoster } from './lib/roster.mjs';

if (!hasAudiomackKey) {
  console.log('No Audiomack key yet → skipping. Add AUDIOMACK_CONSUMER_KEY and AUDIOMACK_CONSUMER_SECRET to .env');
  process.exit(0);
}

const ELIGIBLE_MS = 104 * 7 * 864e5;
const PROFILES = 'collector/out/audiomack-profiles.json';
const wikidata = await loadRoster();
const matches = JSON.parse(await readFile('collector/out/channel-matches.json', 'utf8').catch(() => '{}'));
const profiles = JSON.parse(await readFile(PROFILES, 'utf8').catch(() => '{}'));

// Same trusted set as YouTube: Wikidata-linked or auto-matched
const trusted = wikidata.filter((a) => a.youtube.length || a.discoveredVia || matches[a.wikidata]?.status === 'auto');

// ---------- 1. profile matching (cached; only new artists are searched) ----------
for (const a of trusted) {
  if (a.wikidata in profiles) continue;
  const names = [a.name, ...(a.aliases ?? [])];
  let best = null;
  for (const q of [a.aliases?.[0], a.name].filter(Boolean)) {
    const r = await am('search', { q, show: 'artists', limit: 5 }).catch(() => ({ results: [] }));
    for (const p of r.results ?? []) {
      const sim = Math.max(...names.map((n) => similarity(n, p.name ?? '')));
      const conf = sim * 0.8 + (p.verified === 'yes' || p.verified === true ? 0.15 : 0) + (Number(p.followers_count ?? 0) > 1000 ? 0.05 : 0);
      if (!best || conf > best.confidence) best = { slug: p.url_slug, name: p.name, similarity: +sim.toFixed(2), confidence: +conf.toFixed(2) };
    }
    if (best?.confidence >= 0.9) break;
  }
  profiles[a.wikidata] = { artist: a.name, ...best, status: !best ? 'none' : best.confidence >= 0.9 ? 'auto' : best.confidence >= 0.6 ? 'review' : 'none' };
  await writeFile(PROFILES, JSON.stringify(profiles, null, 2));
}

// ---------- 2. uploads + plays ----------
const cutoff = Date.now() - ELIGIBLE_MS;
const snapshot = {};
for (const [qid, p] of Object.entries(profiles)) {
  if (p.status !== 'auto') continue;
  for (let page = 1; page <= 4; page++) {
    const r = await am(`artist/${p.slug}/uploads`, { page, limit: 50 }).catch(() => null);
    const items = r?.results ?? [];
    for (const s of items) {
      if (s.type && s.type !== 'song') continue;              // albums/playlists listed separately
      const released = Number(s.released ?? s.uploaded ?? 0) * 1000;
      if (released && released < cutoff) continue;
      snapshot[s.id] = {
        wikidata: qid, artist: p.artist, title: s.title,
        publishedAt: new Date(released || Date.now()).toISOString(),
        plays: playsOf(s), slug: `${p.slug}/song/${s.url_slug}`,
      };
    }
    if (items.length < 50) break;
  }
}

const takenAt = new Date().toISOString();
await mkdir('collector/out/snapshots', { recursive: true });
const file = `collector/out/snapshots/audiomack-${takenAt.slice(0, 10)}.json`;
await writeFile(file, JSON.stringify({ takenAt, songs: snapshot }, null, 2));
const st = (x) => Object.values(profiles).filter((p) => p.status === x).length;
console.log(`Profiles → auto: ${st('auto')} · review: ${st('review')} · none: ${st('none')}`);
console.log(`Songs recorded: ${Object.keys(snapshot).length} → ${file}`);
