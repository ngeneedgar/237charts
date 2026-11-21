// 237 Charts — discovery source 2: YouTube trending music in Cameroon.
// Cost: ~1 unit per 50 videos + 1 per 50 channels. Runs weekly.
// Usage: node collector/discover-youtube-trending.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { yt, batched, quota } from './lib/youtube.mjs';

const MUSIC_CATEGORY = '10';
// YouTube has no "mostPopular" chart for Cameroon (CM is not a supported trending region),
// so we search for the most-viewed music videos published in the last 14 days, as seen
// from Cameroon. search = 100 units per page; 4 pages = 400 units/week.
// regionCode alone returns global hits, so we search Cameroonian music terms instead.
// 8 queries × 100 units = 800 units/week.
const QUERIES = ['makossa', 'bikutsi', 'musique camerounaise', 'rap camerounais', 'afro cameroun', 'gospel camerounais', 'mbolé', '237 clip officiel'];
const since = new Date(Date.now() - 14 * 864e5).toISOString();
const ids = new Set();
for (const q of QUERIES) {
  const r = await yt('search', {
    part: 'id', q, type: 'video', videoCategoryId: MUSIC_CATEGORY,
    regionCode: 'CM', relevanceLanguage: 'fr', order: 'viewCount',
    publishedAfter: since, maxResults: 50,
  }, 100);
  r.items.forEach((it) => ids.add(it.id.videoId));
}
const videos = (await batched('videos', [...ids], 'snippet,statistics'))
  .sort((a, b) => Number(b.statistics?.viewCount ?? 0) - Number(a.statistics?.viewCount ?? 0));

// Channel details: country + "Topic" (auto-generated official music channel)
const channelIds = [...new Set(videos.map((v) => v.snippet.channelId))];
const channels = new Map((await batched('channels', channelIds, 'snippet,statistics')).map((c) => [c.id, c]));

const results = videos.map((v, i) => {
  const ch = channels.get(v.snippet.channelId);
  const country = ch?.snippet?.country ?? null;
  const isTopic = / - Topic$/.test(v.snippet.channelTitle);
  // Confidence that this is a Cameroonian artist (refined later by cross-checking Wikidata)
  // Channel country is a WEAK signal: most mainstream Cameroonian artists register
  // channels abroad (FR, US, CA…) because YouTube monetisation isn't available in CM.
  // So a foreign country is neutral; only CM adds a little.
  let confidence = 0.5;
  if (country === 'CM') confidence = 0.6;
  return {
    trendingRank: i + 1,
    videoId: v.id,
    title: v.snippet.title,
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
    channelCountry: country,
    isTopic,
    views: Number(v.statistics?.viewCount ?? 0),
    publishedAt: v.snippet.publishedAt,
    confidence,
  };
});

await mkdir('collector/out', { recursive: true });
await writeFile('collector/out/youtube-trending-cm.json', JSON.stringify(results, null, 2));
const by = (f) => results.filter(f).length;
console.log(`Trending music videos (CM): ${results.length} · channels: ${channels.size}`);
console.log(`Channel country CM: ${by((r) => r.channelCountry === 'CM')} · other country: ${by((r) => r.channelCountry && r.channelCountry !== 'CM')} · unknown: ${by((r) => !r.channelCountry)}`);
console.log(`Quota used: ${quota.used} / 10,000`);
