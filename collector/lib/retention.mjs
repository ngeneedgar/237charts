// YouTube API Services policy: stored API data must be refreshed or deleted within 30 days.
// Weekly views only need the latest snapshot and the one ~7 days earlier, so older YouTube
// snapshots are deleted every run. Published charts keep only our own rankings.
import { readdir, unlink } from 'node:fs/promises';

const DAY = 864e5;

/** File names of YouTube snapshots older than `maxDays` (by the date in the name), relative to `today`. */
export function expiredSnapshots(files, today = new Date(), maxDays = 30) {
  const cutoff = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - maxDays * DAY;
  return files.filter((f) => {
    const m = f.match(/^youtube-(\d{4}-\d{2}-\d{2})\.json$/);
    return m && Date.parse(`${m[1]}T00:00:00Z`) < cutoff;
  });
}

/** Channel matches cache YouTube channel titles / subscriber counts. Channel IDs may be kept; after 30 days the
 *  other YouTube fields are removed (each entry gets a `checkedAt` date the first time it is seen). Mutates + returns count. */
export function stripOldChannelData(matches, today = new Date(), maxDays = 30) {
  const now = today.toISOString().slice(0, 10);
  const cutoff = today.getTime() - maxDays * DAY;
  let stripped = 0;
  for (const e of Object.values(matches)) {
    if (!e.checkedAt) { e.checkedAt = now; continue; }
    if (Date.parse(`${e.checkedAt}T00:00:00Z`) >= cutoff || e.stripped) continue;
    if (e.best) e.best = { channelId: e.best.channelId, confidence: e.best.confidence };
    if (Array.isArray(e.candidates)) e.candidates = e.candidates.map((c) => ({ channelId: c.channelId }));
    e.stripped = true; stripped++;
  }
  return stripped;
}

export async function pruneYoutubeSnapshots(dir = 'collector/out/snapshots', today = new Date()) {
  const gone = expiredSnapshots(await readdir(dir).catch(() => []), today);
  for (const f of gone) await unlink(`${dir}/${f}`);
  return gone;
}
