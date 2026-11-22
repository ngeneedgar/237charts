// 237 Charts — complete song data + official artwork for every charting song.
// Source: Deezer public API (no key) → official release artwork, album, release date, duration,
// ISRC, all credited artists, Deezer link. Fallback artwork: the official YouTube video thumbnail.
// Cached per song in collector/out/song-meta.json (only new songs are looked up).
// Usage: node collector/enrich-songs.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { similarity, norm } from './lib/names.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function dz(path) {
  for (let i = 0; i < 3; i++) {
    await sleep(150 * (i + 1));
    try {
      const r = await fetch(`https://api.deezer.com/${path}`, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      if (j.error?.code === 4) { await sleep(5000); continue; }
      return j.error ? null : j;
    } catch { /* retry */ }
  }
  return null;
}

const dir = 'collector/out';
const real = (await readdir(dir)).filter((f) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().at(-1);
const chart = JSON.parse(await readFile(`${dir}/${real ?? 'chart-preview.json'}`, 'utf8'));
const META = `${dir}/song-meta.json`;
const meta = JSON.parse(await readFile(META, 'utf8').catch(() => '{}'));

let looked = 0, matched = 0;
// Every song shown anywhere: Top 50 + genre charts
const allEntries = [...new Map([...chart.entries, ...Object.values(chart.genreCharts ?? {}).flat()].map((e) => [e.songId, e])).values()];
for (const e of allEntries) {
  const old = meta[e.songId];
  if (old?.deezerId && !('deezerTitle' in old)) { // backfill: Deezer's spelling of the title
    const t = await dz(`track/${old.deezerId}`);
    old.deezerTitle = t?.title_short ?? t?.title ?? null;
    await writeFile(META, JSON.stringify(meta, null, 2));
  }
  if (old?.checked) continue;
  looked++;
  const cleanTitle = e.title.replace(/\s*[([].*$/, '').trim();
  const artistMain = e.artist.split(/\s*(?:,|&|\bx\b|\bfeat\.?)\s*/i)[0];
  const r = await dz(`search/track?q=${encodeURIComponent(`artist:"${artistMain}" track:"${cleanTitle}"`)}&limit=8`)
        ?? { data: [] };
  let loose = r.data?.length ? r : await dz(`search/track?q=${encodeURIComponent(`${artistMain} ${cleanTitle}`)}&limit=8`) ?? { data: [] };
  const scored = (loose.data ?? []).map((t) => ({
    t,
    s: similarity(cleanTitle, t.title_short ?? t.title) * 0.6 + similarity(artistMain, t.artist?.name ?? '') * 0.4,
  })).sort((a, b) => b.s - a.s);
  const best = scored[0];
  const m = { checked: new Date().toISOString(), youtubeThumb: e.videoId ? `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg` : null };
  // Require a strong title AND artist match — a wrong cover is worse than none
  if (best && best.s >= 0.85 && similarity(artistMain, best.t.artist?.name ?? '') >= 0.8) {
    const full = await dz(`track/${best.t.id}`);
    const album = full?.album ?? best.t.album;
    Object.assign(m, {
      deezerId: best.t.id,
      deezer: best.t.link,
      deezerTitle: best.t.title_short ?? best.t.title ?? null,
      artwork: album?.cover_xl ?? album?.cover_big ?? null,
      artworkSmall: album?.cover_medium ?? null,
      album: album?.title ?? null,
      releaseDate: full?.release_date ?? null,
      durationSec: full?.duration ?? best.t.duration ?? null,
      isrc: full?.isrc ?? null,
      artists: (full?.contributors ?? [best.t.artist]).map((c) => c.name),
      explicit: !!(full?.explicit_lyrics ?? best.t.explicit_lyrics),
      matchScore: +best.s.toFixed(2),
    });
    matched++;
  }
  meta[e.songId] = m;
  await writeFile(META, JSON.stringify(meta, null, 2));
}

const inChart = allEntries.map((e) => meta[e.songId]);
console.log(`Looked up ${looked} new songs (${matched} matched on Deezer).`);
console.log(`Coverage (${allEntries.length} songs on all charts): official artwork ${inChart.filter((m) => m?.artwork).length} · YouTube thumbnail only ${inChart.filter((m) => !m?.artwork && m?.youtubeThumb).length} · nothing ${inChart.filter((m) => !m?.artwork && !m?.youtubeThumb).length}`);
