// 237 Charts — find official YouTube channels for discovered artists that have none.
// Cheapest first:
//   1. MusicBrainz official links (0 YouTube units, 1 req/sec)
//   2. @handle guesses from name + stage names (1 unit each)
//   3. Channel search (100 units) — only for what is still unmatched, capped by LIMIT
// Resumable: results cached in collector/out/channel-matches.json.
// Usage: node collector/match-channels.mjs [searchLimit]
import { readFile, writeFile } from 'node:fs/promises';
import { yt, batched, quota } from './lib/youtube.mjs';
import { similarity, norm } from './lib/names.mjs';
import { loadRoster } from './lib/roster.mjs';

const SEARCH_LIMIT = Number(process.argv[2] ?? 30);
const CACHE = 'collector/out/channel-matches.json';
const UA = { 'User-Agent': '237Charts-discovery/0.1 (music chart research bot)', Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const artists = await loadRoster();
const cache = JSON.parse(await readFile(CACHE, 'utf8').catch(() => '{}'));
const done = (qid) => ['auto', 'review'].includes(cache[qid]?.status);
const todo = artists.filter((a) => !a.youtube.length && !done(a.wikidata));
const stats = { musicbrainz: 0, handle: 0, search: 0, 'song-search': 0 };

// ---------- scoring ----------
function score(names, c, base) {
  const title = c.snippet.title;
  const desc = (c.snippet.description ?? '').toLowerCase();
  const sim = Math.max(...names.map((n) => similarity(n, title)));
  let conf = base ?? sim * 0.7;
  if (base == null) {
    if (/ - Topic$/.test(title)) conf += 0.2;
    if (c.snippet.country === 'CM') conf += 0.15;
    if (/cameroun|cameroon|237|douala|yaound/.test(desc)) conf += 0.1;
    if (Number(c.statistics?.subscriberCount ?? 0) > 1000) conf += 0.05;
    if (sim < 0.6) conf = Math.min(conf, 0.5);
  }
  return {
    channelId: c.id, title, country: c.snippet.country ?? null,
    subscribers: Number(c.statistics?.subscriberCount ?? 0),
    similarity: +sim.toFixed(2), confidence: +Math.min(conf, 0.99).toFixed(2),
  };
}
const statusOf = (best) => (!best ? 'none' : best.confidence >= 0.9 ? 'auto' : best.confidence >= 0.6 ? 'review' : 'none');

// ---------- 1. MusicBrainz ----------
async function mb(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(1100 * (attempt + 1)); // MusicBrainz asks for max 1 request/second
    try {
      const r = await fetch(`https://musicbrainz.org/ws/2/${path}`, { headers: UA, signal: AbortSignal.timeout(15000) });
      return r.ok ? r.json() : null;
    } catch { /* network hiccup → retry */ }
  }
  return null;
}
async function musicbrainzChannels(qid) {
  const u = await mb(`url?resource=${encodeURIComponent('https://www.wikidata.org/wiki/' + qid)}&inc=artist-rels&fmt=json`);
  const mbid = u?.relations?.find((r) => r.artist)?.artist?.id;
  if (!mbid) return [];
  const a = await mb(`artist/${mbid}?inc=url-rels&fmt=json`);
  return (a?.relations ?? []).map((r) => r.url?.resource).filter((x) => /youtube\.com/.test(x ?? ''));
}
async function resolveYoutubeUrl(url) {
  let m;
  if ((m = url.match(/channel\/(UC[\w-]{22})/))) return (await batched('channels', [m[1]], 'snippet,statistics'))[0];
  if ((m = url.match(/youtube\.com\/@([\w.-]+)/))) return (await yt('channels', { part: 'snippet,statistics', forHandle: m[1] })).items?.[0];
  if ((m = url.match(/youtube\.com\/user\/([\w.-]+)/))) return (await yt('channels', { part: 'snippet,statistics', forUsername: m[1] })).items?.[0];
  return null; // /c/ custom URLs need a search; skip
}

// ---------- 2. @handle guesses ----------
function handleGuesses(names) {
  const out = new Set();
  for (const n of names) {
    const c = norm(n).replace(/ /g, '');
    if (c.length < 3) continue;
    for (const h of [c, c + 'officiel', c + 'official', c + 'music', c + 'tv']) out.add(h);
  }
  return [...out].slice(0, 8); // cap at 8 units per artist
}

// ---------- run ----------
let searches = 0;
for (const a of todo) {
  const names = [a.name, ...(a.aliases ?? [])];
  const prev = cache[a.wikidata];
  let best = null, method = null;

  // 1. MusicBrainz (official links → high confidence)
  if (!prev?.triedMusicbrainz) {
    for (const url of await musicbrainzChannels(a.wikidata)) {
      const c = await resolveYoutubeUrl(url).catch(() => null);
      if (c) { best = score(names, c, 0.95); method = 'musicbrainz'; break; }
    }
  }

  // 2. Handle guesses
  if (!best && !prev?.triedHandles) {
    const found = [];
    for (const h of handleGuesses(names)) {
      const c = (await yt('channels', { part: 'snippet,statistics', forHandle: h }).catch(() => ({}))).items?.[0];
      if (c) found.push(score(names, c));
    }
    found.sort((x, y) => y.confidence - x.confidence);
    if (found[0]?.confidence >= 0.6) { best = found[0]; method = 'handle'; }
  }

  // 2b. Song search (100 units): for artists we know by a charting song (Shazam Cameroon),
  // find that song's video — the channel it sits on is the artist's (or their label's).
  let searchedNow = false, songSearched = false;
  if ((!best || best.confidence < 0.9) && a.songs?.length && !prev?.triedSongSearch && searches < SEARCH_LIMIT) {
    searches++; searchedNow = true;
    const song = a.songs[0];
    let s = { items: [] };
    try { s = await yt('search', { part: 'snippet', q: `${a.name} ${song}`, type: 'video', maxResults: 5 }, 100); }
    catch (err) { console.log(`Search stopped: ${err.message.slice(0, 80)}… (resumes next run)`); searches = SEARCH_LIMIT; searchedNow = false; }
    const hit = s.items.find((it) => {
      const t = norm(it.snippet.title);
      return t.includes(norm(song).split(' ').slice(0, 3).join(' ')) && names.some((n) => t.includes(norm(n)) || norm(it.snippet.channelTitle).includes(norm(n)));
    });
    if (hit && !(prev?.blocked ?? []).includes(hit.snippet.channelId)) {
      const [c] = await batched('channels', [hit.snippet.channelId], 'snippet,statistics');
      if (c) {
        const sc = score(names, c);
        // The channel carries this artist's charting song under their name → strong evidence even with a different channel name
        sc.confidence = Math.max(sc.confidence, sc.similarity >= 0.6 ? 0.92 : 0.75);
        sc.viaSong = song;
        best = sc; method = 'song-search';
      }
    }
    songSearched = searchedNow;
    searchedNow = false; // a song search doesn't use up the name search
  }

  // 3. Search fallback (expensive), only if never searched before
  if (!best && !searchedNow && !prev?.triedSearch && !prev?.candidates && searches < SEARCH_LIMIT) {
    searches++; searchedNow = true;
    const q = a.aliases?.[0] ?? a.name; // stage name usually matches the channel better
    let s;
    try { s = await yt('search', { part: 'snippet', q, type: 'channel', maxResults: 5 }, 100); }
    catch (err) {
      console.log(`Search stopped: ${err.message.slice(0, 80)}… (resumes next run)`);
      searches = SEARCH_LIMIT; searchedNow = false; s = { items: [] };
    }
    const ids = s.items.map((i) => i.snippet.channelId);
    const chans = ids.length ? await batched('channels', ids, 'snippet,statistics') : [];
    const scored = chans.map((c) => score(names, c)).sort((x, y) => y.confidence - x.confidence);
    if (scored[0]) { best = scored[0]; method = 'search'; }
  }

  if (method) stats[method]++;
  const keepPrev = prev?.best && (!best || prev.best.confidence > best.confidence);
  const finalBest = keepPrev ? prev.best : best;
  cache[a.wikidata] = {
    name: a.name, aliases: a.aliases ?? [],
    best: finalBest, method: keepPrev ? prev.method ?? 'search' : method,
    status: statusOf(finalBest),
    triedMusicbrainz: true, triedHandles: true,
    triedSearch: Boolean(prev?.triedSearch || prev?.candidates || searchedNow),
    triedSongSearch: Boolean(prev?.triedSongSearch || songSearched),
    blocked: prev?.blocked ?? [],
  };
  await writeFile(CACHE, JSON.stringify(cache, null, 2)); // save as we go
}

// ---------- final pass: stricter rules on every cached match ----------
// MusicBrainz links are curated → keep. Otherwise drop empty/fan channels and weak
// name matches; promote exact-name channels with a real audience.
for (const e of Object.values(cache)) {
  const b = e.best;
  if (!b || e.method === 'musicbrainz') continue;
  const official = / - Topic$|officiel|official/i.test(b.title);
  if (b.subscribers < 50 || b.similarity < 0.8) e.status = 'none';
  else if (b.similarity >= 0.9 && (b.subscribers >= 5000 || (official && b.subscribers >= 500))) e.status = 'auto';
  else if (b.confidence >= 0.9) e.status = 'auto';
  else e.status = 'review';
}
await writeFile(CACHE, JSON.stringify(cache, null, 2));

const vals = Object.values(cache);
const count = (st) => vals.filter((v) => v.status === st).length;
const noChannel = artists.filter((a) => !a.youtube.length).length;
const left = vals.filter((v) => v.status === 'none' && !v.triedSearch).length + (noChannel - vals.length);
console.log(`Checked now: ${todo.length} · found via MusicBrainz: ${stats.musicbrainz} · @handle: ${stats.handle} · search: ${stats.search}`);
console.log(`Totals → auto-accept: ${count('auto')} · review: ${count('review')} · no match: ${count('none')} · still to search: ${left}`);
console.log(`Quota used: ${quota.used} / 10,000`);
