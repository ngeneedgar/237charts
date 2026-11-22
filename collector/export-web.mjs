// 237 Charts — export the latest charts for the website (web/data/chart.json):
// Top 50 + the seven genre Top 20s. Uses the newest real chart (chart-YYYY-MM-DD.json);
// falls back to the dry-run preview, flagged preview:true.
// Usage: node collector/export-web.mjs
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { GENRES } from './lib/genres.mjs';
import { bestTitle } from './lib/songs.mjs';

const dir = 'collector/out';
const real = (await readdir(dir)).filter((f) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().at(-1);
const src = real ?? 'chart-preview.json';
const chart = JSON.parse(await readFile(`${dir}/${src}`, 'utf8'));
const meta = JSON.parse(await readFile(`${dir}/song-meta.json`, 'utf8').catch(() => '{}'));

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'x';

function entry(e) {
  const m = meta[e.songId] ?? {};
  const primary = e.artist.split(/\s*(?:,|&|\bx\b|\bfeat\.?)\s*/i)[0].trim();
  return {
    slug: `${slug(primary)}-${slug(e.title)}`, artistSlug: slug(primary), primaryArtist: primary, genre: e.genre ?? null,
    rank: e.rank, title: bestTitle(e.title, m.deezerTitle), artist: e.artist, lastWeek: e.lastWeek ?? null, peak: e.peak,
    weeks: e.weeksOnChart, movement: e.movement, delta: e.delta ?? null, adjusted: !!e.adjusted,
    // Official release artwork (Deezer); otherwise the official video thumbnail; otherwise none
    artwork: m.artwork ?? m.youtubeThumb ?? null,
    artworkSmall: m.artworkSmall ?? m.youtubeThumb ?? null,
    artworkSource: m.artwork ? 'deezer' : m.youtubeThumb ? 'youtube' : null,
    artists: m.artists ?? [e.artist],
    album: m.album ?? null, releaseDate: m.releaseDate ?? null, durationSec: m.durationSec ?? null,
    isrc: m.isrc ?? null, explicit: !!m.explicit,
    youtube: e.videoId ? `https://www.youtube.com/watch?v=${e.videoId}` : null,
    deezer: m.deezer ?? null,
  };
}

const out = {
  weekEnd: chart.weekEnd,
  preview: !real,
  generatedAt: new Date().toISOString(),
  entries: chart.entries.slice(0, 50).map(entry),
  genres: GENRES.map((g) => ({ slug: g.slug, en: g.en, fr: g.fr, entries: (chart.genreCharts?.[g.slug] ?? []).map(entry) })),
};
await mkdir('web/data', { recursive: true });
await writeFile('web/data/chart.json', JSON.stringify(out, null, 2));
// Site settings edited by the team in admin/
await writeFile('web/data/contact.json', await readFile('admin/contact.json', 'utf8'));
console.log(`Exported Top 50 (${out.entries.length}) + genre charts (${out.genres.map((g) => `${g.en} ${g.entries.length}`).join(', ')}) from ${src}${out.preview ? ' (PREVIEW)' : ''}`);
