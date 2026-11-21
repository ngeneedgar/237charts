// 237 Charts — give every artist a main genre (Spotify's model: genre belongs to the artist,
// a song can override it). Sources, strongest first:
//   1. Team decision        collector/genre-decisions.csv   (artist,genre)
//   2. Song titles          "(Mbolé Bikutsi)", "Makossa" … → the artist's most frequent tagged genre
//   3. Wikidata             artist's genres (P136), mapped to our 7 genres
// Output: collector/out/artist-genres.json  { <artist id>: { name, genre, source } }
// Usage: node collector/tag-genres.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { loadRoster } from './lib/roster.mjs';
import { GENRES, genreFromTitle, genreFromWikidata } from './lib/genres.mjs';
import { norm } from './lib/names.mjs';

const roster = await loadRoster();
const out = {};

// ---------- 3. Wikidata genres (one query for all artists with a real Wikidata id) ----------
const qids = roster.map((a) => a.wikidata).filter((q) => /^Q\d+$/.test(q));
const wdGenres = {};
for (let i = 0; i < qids.length; i += 150) {
  const values = qids.slice(i, i + 150).map((q) => `wd:${q}`).join(' ');
  const query = `SELECT ?a ?gLabel WHERE { VALUES ?a { ${values} } ?a wdt:P136 ?g . SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". } }`;
  let r = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt || i) await new Promise((res) => setTimeout(res, 4000 * (attempt + 1))); // Wikidata rate limit: pause between batches
    r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query), {
      headers: { 'User-Agent': '237Charts-discovery/0.1 (music chart research bot)', Accept: 'application/sparql-results+json' },
      signal: AbortSignal.timeout(60000),
    }).catch(() => null);
    if (r?.ok) break;
  }
  if (!r?.ok) { console.log(`Wikidata batch ${i / 150 + 1} failed (${r?.status ?? 'network'}) — skipped`); continue; }
  for (const b of (await r.json()).results.bindings) {
    const q = b.a.value.split('/').pop();
    (wdGenres[q] ??= []).push(b.gLabel.value);
  }
}
for (const a of roster) {
  const g = wdGenres[a.wikidata] && genreFromWikidata(wdGenres[a.wikidata]);
  if (g) out[a.wikidata] = { name: a.name, genre: g, source: `Wikidata: ${wdGenres[a.wikidata].slice(0, 3).join(', ')}` };
}

// ---------- 2. Genre words in the artist's song titles (YouTube snapshot + Shazam) ----------
const snaps = (await readdir('collector/out/snapshots')).sort();
const yt = JSON.parse(await readFile(`collector/out/snapshots/${snaps.filter((f) => f.startsWith('youtube-')).at(-1)}`, 'utf8'));
const counts = {};
for (const v of Object.values(yt.videos)) {
  const g = genreFromTitle(v.title);
  if (g) ((counts[v.wikidata] ??= {})[g] = (counts[v.wikidata][g] ?? 0) + 1);
}
for (const [q, c] of Object.entries(counts)) {
  const [g, n] = Object.entries(c).sort((x, y) => y[1] - x[1])[0];
  const a = roster.find((x) => x.wikidata === q);
  if (a && n >= 2) out[q] = { name: a.name, genre: g, source: `${n} song titles say "${g}"` }; // 2+ titles = a pattern, not a one-off
}

// ---------- 1. Team decisions win ----------
const valid = new Set(GENRES.map((g) => g.slug));
const lines = (await readFile('admin/genres.csv', 'utf8').catch(() => 'artist,genre\n')).split(/\r?\n/).slice(1).filter(Boolean);
for (const line of lines) {
  const [name, genre] = line.split(',').map((s) => s.trim());
  if (!valid.has(genre)) { console.log(`Unknown genre "${genre}" for ${name} — use one of: ${[...valid].join(', ')}`); continue; }
  const a = roster.find((x) => [x.name, ...(x.aliases ?? [])].some((n) => norm(n) === norm(name)));
  if (a) out[a.wikidata] = { name: a.name, genre, source: '237 Charts team' };
  else console.log(`Team genre for "${name}": artist not in roster — skipped`);
}

await writeFile('collector/out/artist-genres.json', JSON.stringify(out, null, 2));
const by = {};
for (const v of Object.values(out)) by[v.genre] = (by[v.genre] ?? 0) + 1;
console.log(`Artists with a genre: ${Object.keys(out).length} of ${roster.length}`);
console.log(GENRES.map((g) => `${g.en}: ${by[g.slug] ?? 0}`).join(' · '));
