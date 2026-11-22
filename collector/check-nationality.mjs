// 237 Charts — HARD RULE (approved 2026-11-22): Cameroonian nationals only.
// Any artist recorded on Wikidata with a nationality OTHER than Cameroon (dual nationals,
// diaspora born abroad) is excluded. Writes collector/out/nationality.json, read by lib/roster.mjs.
// Usage: node collector/check-nationality.mjs
import { readFile, writeFile } from 'node:fs/promises';

const base = JSON.parse(await readFile('collector/out/wikidata-artists.json', 'utf8'));
const extra = JSON.parse(await readFile('collector/out/roster-extra.json', 'utf8').catch(() => '[]'));
const qids = [...new Set([...base, ...extra].map((a) => a.wikidata).filter((q) => /^Q\d+$/.test(q)))];

const out = {};
for (let i = 0; i < qids.length; i += 150) {
  const values = qids.slice(i, i + 150).map((q) => `wd:${q}`).join(' ');
  const query = `SELECT ?a ?c ?cLabel WHERE { VALUES ?a { ${values} } ?a wdt:P27 ?c . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  let r = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt || i) await new Promise((res) => setTimeout(res, 4000 * (attempt + 1)));
    r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query), {
      headers: { 'User-Agent': '237Charts-discovery/0.1 (music chart research bot)', Accept: 'application/sparql-results+json' },
      signal: AbortSignal.timeout(60000),
    }).catch(() => null);
    if (r?.ok) break;
  }
  if (!r?.ok) throw new Error('Wikidata unavailable — nationality check NOT updated (previous file kept)');
  for (const b of (await r.json()).results.bindings) {
    const q = b.a.value.split('/').pop();
    (out[q] ??= []).push({ id: b.c.value.split('/').pop(), name: b.cLabel.value });
  }
}

await writeFile('collector/out/nationality.json', JSON.stringify(out, null, 2));
const names = Object.fromEntries([...base, ...extra].map((a) => [a.wikidata, a.name]));
const excluded = Object.entries(out).filter(([, cs]) => cs.some((c) => c.id !== 'Q1009'));
console.log(`Checked ${qids.length} artists · excluded by the hard rule: ${excluded.length}`);
for (const [q, cs] of excluded) console.log(`  ✗ ${names[q]} — ${cs.map((c) => c.name).join(' + ')}`);
