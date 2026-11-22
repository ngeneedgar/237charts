// 237 Charts — step 1.4: weekly YouTube snapshot.
// For every trusted artist channel, list uploads from the last 104 weeks and record
// each video's lifetime view count. Weekly views = this snapshot − previous snapshot.
// Cost: ~1 unit per 50 uploads listed + 1 unit per 50 videos' stats. No search calls.
// Usage: node collector/collect-youtube.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { yt, batched, quota } from './lib/youtube.mjs';
import { loadRoster } from './lib/roster.mjs';

const ELIGIBLE_MS = 104 * 7 * 864e5;
const MAX_PAGES = 4;               // ≤ 200 most recent uploads per channel
const MIN_SECONDS = 61;            // skip YouTube Shorts / teasers

// ---------- trusted channels ----------
const wikidata = await loadRoster();
const matches = JSON.parse(await readFile('collector/out/channel-matches.json', 'utf8').catch(() => '{}'));
const channels = new Map(); // channelId -> { artist, wikidata }
for (const a of wikidata) for (const id of a.youtube) channels.set(id, { artist: a.name, wikidata: a.wikidata });
for (const [qid, m] of Object.entries(matches)) if (m.status === 'auto') channels.set(m.best.channelId, { artist: m.name, wikidata: qid });

// Label channels (admin/labels.csv): one channel, many artists — each video is credited to the
// roster artist named in its title; videos naming no roster artist are skipped.
const labelIds = new Set((await readFile('admin/labels.csv', 'utf8').catch(() => '')).split(/\r?\n/).slice(1)
  .map((l) => l.split(',')[0].trim()).filter((id) => /^UC[\w-]{22}$/.test(id)));
for (const id of labelIds) channels.set(id, { label: true });
const fold = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rosterNames = wikidata.flatMap((a) => [a.name, ...(a.aliases ?? [])].filter((n) => n && n.length >= 3).map((n) => ({ n: fold(n), a })))
  .sort((x, y) => y.n.length - x.n.length); // longest names first ("Jovi Le Monstre" before "Jovi")
function creditFromTitle(title) {
  const t = fold(title);
  const hit = rosterNames.find(({ n }) => new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(t));
  return hit ? { artist: hit.a.name, wikidata: hit.a.wikidata } : null;
}
// Beat / instrumental / karaoke versions are not songs and never chart
const NOT_A_SONG = /\b(instrumental|karaoke)\b|(\(|\[|\s)beat(\)|\]|\s*$)|\bbeat (prod|version)\b/i;

// ---------- uploads ----------
const details = await batched('channels', [...channels.keys()], 'contentDetails');
const cutoff = Date.now() - ELIGIBLE_MS;
const videoMeta = new Map();
for (const c of details) {
  const uploads = c.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) continue;
  let pageToken, pages = 0, tooOld = false;
  do {
    let r;
    try { r = await yt('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 50, ...(pageToken && { pageToken }) }); }
    catch { break; }
    for (const it of r.items) {
      const published = it.contentDetails.videoPublishedAt;
      if (published && new Date(published) < cutoff) { tooOld = true; continue; }
      videoMeta.set(it.contentDetails.videoId, { channelId: c.id, ...channels.get(c.id) });
    }
    pageToken = r.nextPageToken;
  } while (pageToken && !tooOld && ++pages < MAX_PAGES);
}

// ---------- stats ----------
const dur = (iso) => { const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) ?? []; return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0); };
const stats = await batched('videos', [...videoMeta.keys()], 'snippet,statistics,contentDetails');
const snapshot = {};
let shorts = 0, nonMusic = 0, beats = 0, labelSkipped = 0;
for (const v of stats) {
  const seconds = dur(v.contentDetails?.duration);
  if (seconds < MIN_SECONDS) { shorts++; continue; }
  // Music only: YouTube "Music" category, or a title that clearly marks a release
  const isMusic = v.snippet.categoryId === '10' ||
    /clip|official|officiel|audio|lyric|visuali[sz]er|feat\.?|ft\.?|remix/i.test(v.snippet.title);
  if (!isMusic) { nonMusic++; continue; }
  if (NOT_A_SONG.test(v.snippet.title)) { beats++; continue; }
  let meta = videoMeta.get(v.id);
  if (meta.label) {
    const who = creditFromTitle(v.snippet.title);
    if (!who) { labelSkipped++; continue; }
    meta = { channelId: meta.channelId, ...who };
  }
  snapshot[v.id] = {
    ...meta,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    seconds,
    views: Number(v.statistics?.viewCount ?? 0),
  };
}

const takenAt = new Date().toISOString();
await mkdir('collector/out/snapshots', { recursive: true });
const file = `collector/out/snapshots/youtube-${takenAt.slice(0, 10)}.json`;
await writeFile(file, JSON.stringify({ takenAt, videos: snapshot }, null, 2));
console.log(`Channels: ${channels.size} (${labelIds.size} label) · eligible videos: ${Object.keys(snapshot).length} (skipped ${shorts} shorts, ${nonMusic} non-music, ${beats} beat/instrumental, ${labelSkipped} label videos naming no roster artist)`);
console.log(`Saved → ${file}`);
console.log(`Quota used: ${quota.used} / 10,000`);
