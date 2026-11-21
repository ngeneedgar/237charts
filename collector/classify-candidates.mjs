// 237 Charts — decide automatically whether a candidate artist is Cameroonian.
// Candidates come from Shazam Cameroon (in-country hits) and the "feat." snowball.
// Signals (all free):
//   1. Wikidata citizenship (P27)            — strongest: Cameroon → accept, other country → reject
//   2. MusicBrainz artist country / area      — strong
//   3. Shazam presence abroad: charting in NG / CI / FR / SN / GH / ZA / US but the artist
//      is not Cameroonian-tagged → likely foreign star popular in Cameroon
//   4. Credited together with a verified Cameroonian artist on a Cameroon-charting song → +
//   5. Name looks like an uploader, not an artist ("… Studios", "… Animations", "lyrics …") → reject
// Output: collector/out/roster-extra.json (accepted) + collector/out/candidate-review.json (everything, with reasons)
// Usage: node collector/classify-candidates.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { norm, similarity } from './lib/names.mjs';

const UA = { 'User-Agent': '237Charts-discovery/0.1 (music chart research bot)', Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    // "await" inside try: a slow response body must not crash the run
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(6000) });
      if (r.ok) return await r.json();
      if (r.status === 429 || r.status >= 500) { await sleep(2000 * (i + 1)); continue; }
      return null;
    }
    catch { await sleep(1500 * (i + 1)); }
  }
  return null;
}

// ---------- candidates ----------
const wd = JSON.parse(await readFile('collector/out/wikidata-artists.json', 'utf8'));
const known = new Set(wd.flatMap((a) => [a.name, ...(a.aliases ?? [])]).map(norm));
const shazamC = JSON.parse(await readFile('collector/out/shazam-candidates.json', 'utf8').catch(() => '[]'));
const collabC = JSON.parse(await readFile('collector/out/collab-candidates.json', 'utf8').catch(() => '[]'));
const cands = new Map();
for (const c of shazamC) cands.set(norm(c.name), { name: c.name, sources: ['shazam-cm'], bestRank: c.bestRank, songs: c.songs });
for (const c of collabC) {
  const k = norm(c.name); if (!k || known.has(k)) continue;
  const e = cands.get(k) ?? { name: c.name, sources: [] };
  e.sources.push('collab'); e.collaborators = c.collaborators; cands.set(k, e);
}

// ---------- signal 3/4: Shazam charts abroad + co-credits in Cameroon ----------
const COUNTRIES = { NG: 'nigeria', CI: 'ivory-coast', FR: 'france', SN: 'senegal', GH: 'ghana', ZA: 'south-africa', US: 'united-states' };
const split = (s) => s.split(/\s*(?:,|&|\bx\b|\bfeat\.?)\s*/i).map((x) => x.trim()).filter(Boolean);
const abroad = new Map(); // norm name -> [country codes]
for (const [cc, slug] of Object.entries(COUNTRIES)) {
  console.log(`Shazam ${cc}…`);
  const r = await fetch(`https://www.shazam.com/services/charts/csv/top-200/${slug}`, { headers: UA, signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!r?.ok) { console.log(`  ${cc} unavailable, skipped`); continue; }
  for (const line of (await r.text()).split(/\r?\n/)) {
    const m = line.match(/^\d+,"?([^"]*)"?,/); if (!m) continue;
    for (const n of split(m[1])) { const k = norm(n); abroad.set(k, [...new Set([...(abroad.get(k) ?? []), cc])]); }
  }
}
const cm = JSON.parse(await readFile((await import('node:fs')).readdirSync('collector/out/snapshots').filter((f) => f.startsWith('shazam-cm-')).sort().map((f) => 'collector/out/snapshots/' + f).at(-1), 'utf8'));
const coCredit = new Map(); // norm name -> verified CM co-artists
for (const e of cm.entries) {
  const names = split(e.artist), verified = names.filter((n) => known.has(norm(n)));
  if (verified.length) for (const n of names) if (!known.has(norm(n))) coCredit.set(norm(n), verified);
}

// ---------- signal 1: Wikidata citizenship (search by name → claims) ----------
const MUSIC_JOBS = new Set(['Q639669', 'Q177220', 'Q2252262', 'Q36834', 'Q753110', 'Q488205', 'Q855091', 'Q130857', 'Q1259917', 'Q183945', 'Q1198887']);
async function wikidataNationality(name) {
  const s = await getJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=fr&uselang=fr&type=item&limit=5&search=${encodeURIComponent(name)}`);
  const ids = (s?.search ?? []).filter((x) => similarity(name, x.label ?? '') >= 0.9).map((x) => x.id);
  if (!ids.length) return null;
  const e = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${ids.join('|')}`);
  for (const id of ids) {
    const c = e?.entities?.[id]?.claims ?? {};
    const jobs = (c.P106 ?? []).map((x) => x.mainsnak?.datavalue?.value?.id);
    const isMusic = jobs.some((j) => MUSIC_JOBS.has(j)) || c.P2397 || c.P1902; // musician, or has YouTube/Spotify id
    if (!isMusic) continue;
    const citizen = (c.P27 ?? []).map((x) => x.mainsnak?.datavalue?.value?.id).filter(Boolean);
    return { qid: id, citizen, cameroonian: citizen.includes('Q1009'), youtube: (c.P2397 ?? []).map((x) => x.mainsnak?.datavalue?.value) };
  }
  return null;
}

// ---------- signal 2: MusicBrainz country ----------
async function musicbrainzCountry(name) {
  await sleep(1100);
  const r = await getJson(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(`artist:"${name}"`)}&limit=3&fmt=json`);
  const a = (r?.artists ?? []).find((x) => x.score >= 95 && similarity(name, x.name) >= 0.9);
  if (!a) return null;
  return { mbid: a.id, country: a.country ?? null, area: a.area?.name ?? null, begin: a['begin-area']?.name ?? null };
}

// ---------- classify ----------
const UPLOADER = /\b(studios?|animations?|lyrics?|records|entertainment|tv|media|vibes|creates|production|channel|worship team|choir)\b/i;
const CACHE = 'collector/out/classify-cache.json';

async function gather(name) {
  if (UPLOADER.test(name)) return { uploader: true };
  const sig = {};
  const w = await wikidataNationality(name);
  if (w) Object.assign(sig, { wdQid: w.qid, wdCitizen: w.citizen, wdCM: w.cameroonian, youtube: w.youtube });
  if (!sig.wdCM) {
    const m = await musicbrainzCountry(name);
    if (m) Object.assign(sig, { mbid: m.mbid, mbCountry: m.country, mbCM: m.country === 'CM' || /cameroon|cameroun|douala|yaound/i.test(`${m.area} ${m.begin}`) });
  }
  return sig;
}

// Convert results cached by the first version (reasons text) into raw signals
function sigFromReasons(old) {
  const sig = { wdQid: old.wikidata, mbid: old.musicbrainz, youtube: old.youtube };
  for (const r of old.reasons ?? []) {
    if (/uploader/.test(r)) sig.uploader = true;
    if (/Wikidata: Cameroonian/.test(r)) sig.wdCM = true;
    const wc = r.match(/Wikidata: citizenship (.+)/); if (wc) sig.wdCitizen = wc[1].split(',');
    const mc = r.match(/MusicBrainz: country (\w+)/); if (mc) sig.mbCountry = mc[1];
    else if (/MusicBrainz:/.test(r)) sig.mbCM = true;
  }
  return sig;
}

// Home-country chart codes for common nationalities (Wikidata QID → Shazam chart code)
const HOME = { Q142: 'FR', Q1033: 'NG', Q1008: 'CI', Q1041: 'SN', Q117: 'GH', Q258: 'ZA', Q30: 'US', Q974: 'CD', Q971: 'CG', Q1000: 'GA', Q145: 'GB', Q31: 'BE', Q16: 'CA' };
const DIASPORA = new Set(['FR', 'US', 'BE', 'CA', 'GB', 'DE', 'CH', 'IT', 'ES']); // where many Cameroonian artists hold citizenship

/** Rules (approved 2026-11-21): a foreign nationality alone is never proof of being foreign (diaspora). */
function decide(sig) {
  const reasons = [];
  if (sig.uploader) return { confidence: 0.05, status: 'reject', reasons: ['name looks like an uploader/label, not an artist'] };
  if (sig.wdCM) return { confidence: 0.95, status: 'accept', reasons: ['Wikidata: Cameroonian citizenship'] };
  if (sig.mbCM) return { confidence: 0.9, status: 'accept', reasons: ['MusicBrainz: Cameroon'] };

  const homes = [...new Set([...(sig.wdCitizen ?? []).map((q) => HOME[q] ?? q), sig.mbCountry].filter((x) => x && x !== 'CM'))];
  const cmLink = sig.coCreditCM.length > 0;
  let s = 0.5;

  if (homes.length) {
    const chartsAtHome = homes.some((h) => sig.abroad.includes(h));
    const diaspora = homes.some((h) => DIASPORA.has(h));
    if (!cmLink && !sig.onShazamCM) { s = 0.2; reasons.push(`nationality ${homes.join('/')}, no link to Cameroon (featured guest)`); }
    // Charting at home rejects only non-diaspora nationalities (charting in France proves nothing for a Franco-Cameroonian)
    else if (chartsAtHome && !cmLink && !diaspora) { s = 0.2; reasons.push(`nationality ${homes.join('/')} and charts at home`); }
    else if (!diaspora && !cmLink) { s = 0.25; reasons.push(`nationality ${homes.join('/')}`); }
    else { s = 0.55; reasons.push(`nationality ${homes.join('/')} — possibly diaspora`); }
  } else if (sig.abroad.length) {
    s -= 0.05; reasons.push(`also charts on Shazam in ${sig.abroad.join(', ')} (weak signal)`);
  }

  if (cmLink) { s += 0.3; reasons.push(`credited with verified artist(s) on a Cameroon-charting song: ${sig.coCreditCM.slice(0, 3).join(', ')}`); }
  if (sig.onShazamCM && !sig.abroad.length) { s += 0.1; reasons.push('charts on Shazam in Cameroon only'); }
  if (!sig.onShazamCM && sig.collabYT.length && !cmLink) { s = Math.min(s, 0.6); reasons.push(`featured on a verified artist's video: ${sig.collabYT.slice(0, 2).join(', ')}`); }

  const confidence = +Math.max(0, Math.min(s, 0.99)).toFixed(2);
  return { confidence, status: confidence >= 0.9 ? 'accept' : confidence <= 0.3 ? 'reject' : 'review', reasons };
}
const cache = JSON.parse(await readFile(CACHE, 'utf8').catch(() => '{}'));
const results = [];
let i = 0;
const t0 = Date.now();
for (const [k, c] of cands) {
  i++;
  // 1. Raw signals (network lookups) — cached; old cache entries are converted, not re-fetched
  let sig = cache[k]?.sig ?? (cache[k] ? sigFromReasons(cache[k]) : null);
  if (!sig) {
    if (i % 10 === 0 || i === 1) console.log(`[${new Date().toTimeString().slice(0, 8)}] ${i}/${cands.size} (${Math.round((Date.now() - t0) / 1000)}s)`);
    sig = await gather(c.name);
  }
  // 2. Chart-based signals (recomputed every run, free)
  sig.abroad = abroad.get(k) ?? [];
  sig.coCreditCM = coCredit.get(k) ?? [];
  sig.collabYT = c.collaborators ?? [];
  sig.onShazamCM = c.sources.includes('shazam-cm');
  // 3. Decision
  const d = decide(sig);
  results.push({ ...c, ...d, wikidata: sig.wdQid, musicbrainz: sig.mbid, youtube: sig.youtube ?? [] });
  cache[k] = { sig: { ...sig, abroad: undefined, coCreditCM: undefined, collabYT: undefined, onShazamCM: undefined } };
  await writeFile(CACHE, JSON.stringify(cache)); // resume-safe
}

results.sort((a, b) => b.confidence - a.confidence);
await writeFile('collector/out/candidate-review.json', JSON.stringify(results, null, 2));
const slug = (s) => norm(s).replace(/ /g, '-');
const extra = results.filter((r) => r.status === 'accept').map((r) => ({
  wikidata: r.wikidata ?? `X-${slug(r.name)}`, name: r.name, basis: r.reasons, youtube: r.youtube ?? [], spotify: [], aliases: [],
  confidence: r.confidence, discoveredVia: r.sources,
}));
await writeFile('collector/out/roster-extra.json', JSON.stringify(extra, null, 2));
// ---------- human review list, by priority ----------
// Only names that can actually reach the chart: charting on Shazam in Cameroon. Ordered by best position.
// Team answers live in admin/eligibility.csv (name,cameroonian yes/no) and are applied on every run.
const decisionsFile = 'admin/eligibility.csv';
const decided = new Map(
  (await readFile(decisionsFile, 'utf8').catch(() => '')).split(/\r?\n/).slice(1)
    .map((l) => l.split(',')).filter((p) => p.length >= 2).map(([n, v]) => [norm(n), /^y/i.test(v.trim())]));
for (const r of results) {
  if (!decided.has(norm(r.name))) continue;
  const yes = decided.get(norm(r.name));
  r.status = yes ? 'accept' : 'reject'; r.confidence = yes ? 0.99 : 0;
  r.reasons = [`decided by 237 Charts team: ${yes ? 'Cameroonian' : 'not Cameroonian'}`, ...r.reasons];
}
const queue = results.filter((r) => r.status === 'review' && r.sources.includes('shazam-cm')).sort((a, b) => a.bestRank - b.bestRank);
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
await writeFile('collector/out/review-queue.csv',
  ['priority,name,best_shazam_cm_rank,songs,evidence,cameroonian (yes/no)',
   ...queue.map((r, i) => [i + 1, esc(r.name), r.bestRank, esc((r.songs ?? []).join(' / ')), esc(r.reasons.join('; ')), ''].join(','))].join('\n'));
console.log(`Review queue (charting in Cameroon, by priority): ${queue.length} → collector/out/review-queue.csv`);
// Re-write the roster now that team decisions are applied
await writeFile('collector/out/candidate-review.json', JSON.stringify(results, null, 2));
await writeFile('collector/out/roster-extra.json', JSON.stringify(results.filter((r) => r.status === 'accept').map((r) => ({
  wikidata: r.wikidata ?? `X-${slug(r.name)}`, name: r.name, basis: r.reasons, youtube: r.youtube ?? [], spotify: [], aliases: [],
  confidence: r.confidence, discoveredVia: r.sources,
  songs: (r.songs ?? []).map((s) => s.replace(/\s*\(#\d+\)$/, '')), // known charting songs → used to find the channel
})), null, 2));

const n = (s) => results.filter((r) => r.status === s).length;
console.log(`Candidates: ${results.length} → accept: ${n('accept')} · review: ${n('review')} · reject: ${n('reject')}`);
