// 237 Charts — build a chart week from the two most recent YouTube snapshots.
// weekly views = latest − previous (scaled to exactly 7 days if the gap differs).
// Needs ≥ 2 snapshots; the first real chart is possible one week after the first snapshot.
// Usage: node collector/build-week.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { scoreWeek, rankChart, shazamPoints } from './lib/scoring.mjs';
import { mergeVersions, songKey } from './lib/songs.mjs';
import { norm } from './lib/names.mjs';
import { GENRES, genreFromTitle } from './lib/genres.mjs';
import { applySongFixes, loadSongFixes } from './lib/song-fixes.mjs';
import { loadChartPins } from './lib/chart-overrides.mjs';
import { loadRoster } from './lib/roster.mjs';

const dir = 'collector/out/snapshots';
const files = (await readdir(dir).catch(() => [])).filter((f) => f.startsWith('youtube-')).sort();
// --dry: use one snapshot with lifetime views (to test joining before the 2nd snapshot exists)
const DRY = process.argv.includes('--dry');
if (files.length < 2 && !(DRY && files.length)) {
  console.log(`Only ${files.length} snapshot(s). Run collect-youtube.mjs again in 7 days to build the first chart.`);
  process.exit(0);
}
// Compare the latest snapshot with the most recent one taken ≥ 6 days earlier — extra mid-week runs
// (e.g. after an admin edit) must not shorten the chart week.
const day = (f) => new Date(f.match(/(\d{4}-\d{2}-\d{2})/)[1] + 'T00:00:00Z');
const curFile = files.at(-1);
const FIRST = !(await readdir('collector/out')).some((f) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(f) && f !== `chart-${curFile.slice(8, 18)}.json`); // first official chart (23 Nov 2026): short window allowed, oldest snapshot
const prevFile = DRY ? '__empty__' : [...files].reverse().find((f) => (day(curFile) - day(f)) / 864e5 >= 6) ?? (FIRST ? files[0] : files.at(-2));
const [prev, cur] = await Promise.all([prevFile, curFile].map(async (f) => f === '__empty__' ? null : JSON.parse(await readFile(`${dir}/${f}`, 'utf8'))));
if (DRY) Object.assign(prev ?? {}, {});
const prevSnap = prev ?? { takenAt: new Date(new Date(cur.takenAt) - 7 * 864e5).toISOString(), videos: {} };
const days = (new Date(cur.takenAt) - new Date(prevSnap.takenAt)) / 864e5;
const scale = 7 / days;
// A real chart needs (close to) a full week between snapshots — never publish a 3-day "week".
if (!DRY && days < (FIRST ? 1 : 6)) {
  console.log(`Snapshots are only ${days.toFixed(1)} days apart — no chart built. The next weekly run will build it.`);
  process.exit(0);
}

// Weekly views per video, then merge versions (clip, visualizer, lyric, audio) into songs
const aliases = Object.fromEntries(
  (await loadRoster()).map((a) => [a.wikidata, a.aliases ?? []]));
// Only artists still in the roster (researched exclusions are dropped even if an old snapshot has them)
/* A video missing from the previous snapshot is NOT automatically new: its channel may have been added since. Use the earliest later snapshot that has it (scaled to 7 days); count all its views only if it was really uploaded after the previous snapshot; otherwise leave it out this week (lifetime views are not weekly views). */ const between = DRY ? [] : await Promise.all(files.filter((f) => f > prevFile && f < curFile).map(async (f) => JSON.parse(await readFile(`${dir}/${f}`, 'utf8')))); const videos = Object.entries(cur.videos).filter(([, v]) => v.wikidata in aliases).map(([id, v]) => { let weekly; const before = prevSnap.videos[id]?.views; if (before != null) weekly = Math.max(0, v.views - before) * scale; else if (DRY || (v.publishedAt && v.publishedAt > prevSnap.takenAt)) weekly = v.views * (DRY ? 1 : scale); else { const s = between.find((x) => x.videos[id]?.views != null); const d = s ? (new Date(cur.takenAt) - new Date(s.takenAt)) / 864e5 : 0; if (!s || d < 0.5) return null; weekly = Math.max(0, v.views - s.videos[id].views) * 7 / d; } return { videoId: id, artistId: v.wikidata, artist: v.artist, aliases: aliases[v.wikidata], title: v.title, publishedAt: v.publishedAt, isTopic: false, weekly: Math.round(weekly) }; }).filter(Boolean);
const merged = mergeVersions(videos);
const songs = merged.map((s) => ({ songId: s.songId, releaseDate: s.releaseDate, counts: { youtube: s.weekly }, meta: s }));
const byKey = new Map(songs.map((s) => [s.songId, s]));

// ---------- Shazam Cameroon + Deezer: attach to the same songs (artist + normalised title) ----------
const latest = async (prefix) => {
  const f = (await readdir(dir)).filter((x) => x.startsWith(prefix)).sort().at(-1);
  return f ? JSON.parse(await readFile(`${dir}/${f}`, 'utf8')) : null;
};
const wd = await loadRoster();
const nameToQid = new Map();
for (const a of wd) for (const n of [a.name, ...(a.aliases ?? [])]) if (norm(n).length > 2) nameToQid.set(norm(n), a.wikidata);
const attach = (qid, title, platform, value) => {
  const key = songKey(qid, title, [ ...(wd.find((a) => a.wikidata === qid)?.aliases ?? []), wd.find((a) => a.wikidata === qid)?.name ?? '' ]);
  const s = key && byKey.get(key);
  if (!s) return false;
  s.counts[platform] = Math.max(s.counts[platform] ?? 0, value);
  return true;
};

const shazam = await latest('shazam-cm-');
let shazamMatched = 0, shazamAdded = 0;
for (const e of shazam?.entries ?? []) {
  const credited = e.artist.split(/\s*(?:,|&|\bx\b|\bfeat\.?)\s*/i).map((n) => nameToQid.get(norm(n))).filter(Boolean);
  if (credited.some((qid) => attach(qid, e.title, 'shazam', shazamPoints(e.rank)))) { shazamMatched++; continue; }
  // Charting in Cameroon by a verified artist but no YouTube match → still a song (never drop in-country hits)
  if (credited.length) {
    const qid = credited[0], a = wd.find((x) => x.wikidata === qid);
    const key = songKey(qid, e.title, [a.name, ...(a.aliases ?? [])]) ?? `${qid}::shazam-${e.rank}`;
    const s = { songId: key, releaseDate: null, counts: { shazam: shazamPoints(e.rank) },
      meta: { title: e.title, artist: e.artist, sources: [{ videoId: null }] } };
    songs.push(s); byKey.set(key, s); shazamAdded++;
  }
}

const deezer = await latest('deezer-');
let deezerMatched = 0;
for (const t of Object.values(deezer?.tracks ?? {})) if (attach(t.wikidata, t.title, 'deezer', t.rank)) deezerMatched++;
console.log(`Shazam CM: ${shazamMatched} matched to YouTube songs, ${shazamAdded} added as Shazam-only songs (of ${shazam?.entries.length ?? 0}) ·Deezer tracks matched: ${deezerMatched}/${Object.keys(deezer?.tracks ?? {}).length}`);

// ---------- release date = earliest evidence the song existed ----------
// YouTube upload date of the earliest version, or Deezer release date (any album, compilations included:
// a 2009 compilation proves the song existed in 2009). A later re-upload can never make an old song eligible.
const songMeta = JSON.parse(await readFile('collector/out/song-meta.json', 'utf8').catch(() => '{}'));
let olderFound = 0;
for (const s of songs) {
  const dz = songMeta[s.songId]?.releaseDate;
  const dates = [s.releaseDate, dz].filter(Boolean).sort();
  if (dates.length && dates[0] !== s.releaseDate) olderFound++;
  s.releaseDate = dates[0] ?? null;
  s.releaseSource = !dates.length ? 'unknown' : dates[0] === dz ? 'deezer' : 'youtube';
}
console.log(`Release dates: ${olderFound} songs got an earlier date from Deezer`);

// ---------- genre: song title tag wins, else the artist's main genre (Spotify's model) ----------
const artistGenres = JSON.parse(await readFile('collector/out/artist-genres.json', 'utf8').catch(() => '{}'));
for (const s of songs) {
  const qid = s.songId.split('::')[0];
  s.genre = genreFromTitle(s.meta.title ?? '') ?? artistGenres[qid]?.genre ?? null;
}

// ---------- team fixes from the admin (admin/song-fixes.csv): titles, genres, merges, hidden uploads ----------
{
  const { songs: fixed, log } = applySongFixes(songs, await loadSongFixes(), GENRES.map((g) => g.slug));
  songs.splice(0, songs.length, ...fixed);
  if (log.length) console.log(`Song fixes applied (${log.length}): ${log.join(' · ')}`);
}

const weekEnd = cur.takenAt.slice(0, 10);
const { rows } = scoreWeek(songs, weekEnd);

// ---------- chart history: last week's rank, peak, weeks on chart, re-entries ----------
const pastCharts = [];
for (const f of (await readdir('collector/out')).filter((x) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort()) {
  const c = JSON.parse(await readFile(`collector/out/${f}`, 'utf8'));
  if (c.weekEnd < weekEnd) pastCharts.push(c);
}
function history(pick) {
  const prev = {};
  pastCharts.forEach((c, i) => {
    const last = i === pastCharts.length - 1;
    for (const e of pick(c) ?? []) {
      const h = prev[e.songId] ?? { lastRank: null, peak: Infinity, weeks: 0, everCharted: false };
      h.peak = Math.min(h.peak, e.rank); h.weeks += 1; h.everCharted = true;
      if (last) h.lastRank = e.rank;
      prev[e.songId] = h;
    }
  });
  return prev;
}
// Manual positions set by the team (admin/chart-overrides.csv), public in the corrections log
const pins = await loadChartPins();
if (Object.keys(pins).length) console.log(`Manual positions: ${Object.entries(pins).map(([c, p]) => `${c} ${Object.keys(p).length}`).join(' · ')}`);
const chart = rankChart(rows, history((c) => c.entries), 'overall', undefined, pins['top-50']);
const meta = Object.fromEntries(songs.map((s) => [s.songId, s.meta]));
const genreOf = Object.fromEntries(songs.map((s) => [s.songId, s.genre]));
const withMeta = (e) => ({
  ...e, title: meta[e.songId].title, artist: meta[e.songId].artist, genre: genreOf[e.songId],
  videoId: meta[e.songId].sources[0].videoId, versions: meta[e.songId].sources.length,
});
const out = chart.map(withMeta);
// Genre Top 20s (same scores, filtered by genre)
const genreCharts = Object.fromEntries(GENRES.map((g) => [g.slug, rankChart(rows, history((c) => c.genreCharts?.[g.slug]), g.slug, undefined, pins[g.slug]).map(withMeta)]));
console.log(`${videos.length} videos merged into ${merged.length} songs`);
console.log(`Genre coverage — Top 50: ${out.filter((e) => e.genre).length}/50 tagged · genre charts: ` +
  GENRES.map((g) => `${g.en} ${genreCharts[g.slug].length}`).join(' · '));

if (DRY) {
  await writeFile('collector/out/chart-preview.json', JSON.stringify({ weekEnd, preview: true, note: 'Dry run: YouTube lifetime views, not weekly — for building the site only', entries: out, genreCharts }, null, 2));
  console.log('DRY RUN (lifetime views, not a real chart):'); for (const e of out.slice(0, 15)) console.log(`${String(e.rank).padStart(2)}. ${e.artist} — ${e.title.slice(0, 50)}  yt=${rows.find((r) => r.songId === e.songId).counts.youtube} sz=${rows.find((r) => r.songId === e.songId).counts.shazam ?? 0} dz=${rows.find((r) => r.songId === e.songId).counts.deezer ?? 0}`); process.exit(0); }
await writeFile(`collector/out/chart-${weekEnd}.json`, JSON.stringify({ weekEnd, days: +days.toFixed(2), entries: out, genreCharts }, null, 2));
console.log(`Chart for week ending ${weekEnd} (${days.toFixed(1)}-day window, scaled to 7):`);
for (const e of out.slice(0, 10)) console.log(`${String(e.rank).padStart(2)}. ${e.artist} — ${e.title.slice(0, 60)}  (${e.score})`);
