// 237 Charts — discovery source 2b: collaboration snowball.
// Reads recent uploads of trusted artists' channels and collects "feat. X" names
// that are not yet known. Cheap: ~1 unit per channel per 50 uploads.
// Usage: node collector/discover-collabs.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { yt, batched, quota } from './lib/youtube.mjs';
import { norm, featuredNames } from './lib/names.mjs';
import { loadRoster } from './lib/roster.mjs';

const wikidata = await loadRoster();
const matches = JSON.parse(await readFile('collector/out/channel-matches.json', 'utf8').catch(() => '{}'));

// Trusted seed channels: Wikidata-linked + auto-accepted matches
const seeds = new Map(); // channelId -> artist name
for (const a of wikidata) for (const id of a.youtube) seeds.set(id, a.name);
for (const m of Object.values(matches)) if (m.status === 'auto') seeds.set(m.best.channelId, m.name);

const known = new Set(wikidata.map((a) => norm(a.name)));

// Uploads playlist per channel (1 unit / 50 channels)
const chans = await batched('channels', [...seeds.keys()], 'contentDetails');
const candidates = new Map(); // norm name -> { name, collaborators:Set, videos:[] }

for (const c of chans) {
  const uploads = c.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) continue;
  let r;
  try { r = await yt('playlistItems', { part: 'snippet', playlistId: uploads, maxResults: 50 }); }
  catch { continue; } // channel with hidden/empty uploads
  for (const it of r.items) {
    for (const name of featuredNames(it.snippet.title)) {
      const key = norm(name);
      if (!key || known.has(key)) continue;
      const self = norm(seeds.get(c.id));
      if (key.startsWith(self) || self.startsWith(key)) continue; // artist crediting themselves
      const cand = candidates.get(key) ?? { name, collaborators: new Set(), videos: [] };
      cand.collaborators.add(seeds.get(c.id));
      if (cand.videos.length < 3) cand.videos.push({ title: it.snippet.title, videoId: it.snippet.resourceId.videoId });
      candidates.set(key, cand);
    }
  }
}

// Confidence grows with the number of distinct verified collaborators; always review (< 0.90)
const out = [...candidates.values()]
  .map((c) => ({
    name: c.name,
    collaborators: [...c.collaborators],
    confidence: +Math.min(0.6 + 0.1 * c.collaborators.size, 0.85).toFixed(2),
    videos: c.videos,
  }))
  .sort((a, b) => b.collaborators.length - a.collaborators.length);

await writeFile('collector/out/collab-candidates.json', JSON.stringify(out, null, 2));
console.log(`Seed channels: ${seeds.size} · new candidate artists: ${out.length} · with 2+ collaborators: ${out.filter((c) => c.collaborators.length > 1).length}`);
console.log(`Quota used: ${quota.used} / 10,000`);
