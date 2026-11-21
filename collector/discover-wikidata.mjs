// 237 Charts — automatic artist discovery, source 1: Wikidata (free, no key).
// Finds musicians with Cameroonian citizenship or born in Cameroon,
// plus their official YouTube channel / Spotify IDs when Wikidata has them.
// Usage: node collector/discover-wikidata.mjs [out.json]

import { writeFile } from 'node:fs/promises';

const QUERY = `
SELECT ?artist ?artistLabel ?yt ?spotify ?basis ?alias WHERE {
  VALUES ?job { wd:Q639669 wd:Q177220 wd:Q2252262 wd:Q36834 wd:Q753110 wd:Q488205 wd:Q855091 wd:Q130857 }
  # musician, singer, rapper, composer, songwriter, singer-songwriter, guitarist, DJ
  ?artist wdt:P27 wd:Q1009 ; wdt:P106 ?job .         # Cameroonian citizenship
  BIND("citizenship" AS ?basis)
  OPTIONAL { ?artist wdt:P2397 ?yt . }               # YouTube channel ID
  OPTIONAL { ?artist wdt:P1902 ?spotify . }          # Spotify artist ID
  OPTIONAL { { ?artist wdt:P742 ?alias . }            # pseudonym / stage name
             UNION { ?artist skos:altLabel ?alias . FILTER(LANG(?alias) IN ("fr","en")) } }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}`;

const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(QUERY);
const res = await fetch(url, {
  headers: { 'User-Agent': '237Charts-discovery/0.1 (music chart research bot)', Accept: 'application/sparql-results+json' },
});
if (!res.ok) throw new Error(`Wikidata ${res.status}: ${await res.text()}`);
const { results } = await res.json();

// Merge rows per artist (one row per YouTube/Spotify combination)
const byId = new Map();
for (const b of results.bindings) {
  const qid = b.artist.value.split('/').pop();
  const a = byId.get(qid) ?? { wikidata: qid, name: b.artistLabel.value, basis: new Set(), youtube: new Set(), spotify: new Set(), aliases: new Set() };
  a.basis.add(b.basis.value);
  if (b.alias && b.alias.value !== a.name) a.aliases.add(b.alias.value);
  if (b.yt) a.youtube.add(b.yt.value);
  if (b.spotify) a.spotify.add(b.spotify.value);
  byId.set(qid, a);
}

const artists = [...byId.values()]
  .filter((a) => a.name !== a.wikidata) // drop entries with no label
  .map((a) => ({
    ...a,
    basis: [...a.basis],
    youtube: [...a.youtube],
    spotify: [...a.spotify],
    aliases: [...a.aliases],
    // Confidence: citizenship is strong; a linked official channel makes it trackable.
    confidence: a.basis.has('citizenship') ? 0.95 : 0.8,
  }))
  .sort((x, y) => x.name.localeCompare(y.name));

const out = process.argv[2] ?? 'collector/out/wikidata-artists.json';
await writeFile(out, JSON.stringify(artists, null, 2));
const withYt = artists.filter((a) => a.youtube.length).length;
console.log(`Artists: ${artists.length} · with YouTube channel: ${withYt} · auto-accept (≥0.90): ${artists.filter((a) => a.confidence >= 0.9).length}`);
console.log(`Saved → ${out}`);
