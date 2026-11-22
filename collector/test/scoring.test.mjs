import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreWeek, rankChart, adjustForAnomaly, shazamPoints, viralChart } from '../lib/scoring.mjs';
import { genreFromTitle, genreFromWikidata } from '../lib/genres.mjs';

test('viral: only songs ≤ 8 weeks old; growth not volume; newness multiplier', () => {
  const v = viralChart([
    { songId: 'big-old', releaseDate: '2026-06-01', youtubeThisWeek: 900000, youtubeLastWeek: 100000, shazamPoints: 200 }, // 24 wks old → out
    { songId: 'big-flat', releaseDate: '2026-11-01', youtubeThisWeek: 500000, youtubeLastWeek: 500000, shazamPoints: 0 },  // no growth, no Shazam → out
    { songId: 'rising', releaseDate: '2026-11-10', youtubeThisWeek: 60000, youtubeLastWeek: 10000, shazamPoints: 150 },
    { songId: 'older-riser', releaseDate: '2026-10-04', youtubeThisWeek: 60000, youtubeLastWeek: 10000, shazamPoints: 150 }, // same numbers, 7 wks old
    { songId: 'no-date', releaseDate: null, youtubeThisWeek: 90000, youtubeLastWeek: 0, shazamPoints: 190 },               // unprovable newness → out
  ], '2026-11-22');
  assert.deepEqual(v.map((r) => r.songId), ['rising', 'older-riser']);
  assert.equal(v[0].newness, 1);
  assert.equal(v[1].newness, 0.5);           // week 7 → 1 − 0.1×5
  assert.ok(v[0].viralScore > v[1].viralScore * 1.9);
});

test('history carried week to week: peak keeps the best, weeks accumulate', () => {
  const { rows } = scoreWeek([
    { songId: 'a', releaseDate: recent, counts: { youtube: 100 } },
    { songId: 'b', releaseDate: recent, counts: { youtube: 300 } },
  ], WEEK_END);
  // 'a' was No. 1 two weeks ago, No. 3 last week → now No. 2: up 1, peak stays 1, 3 weeks
  const e = Object.fromEntries(rankChart(rows, { a: { lastRank: 3, peak: 1, weeks: 2, everCharted: true } }).map((x) => [x.songId, x]));
  assert.deepEqual([e.a.rank, e.a.movement, e.a.delta, e.a.peak, e.a.weeksOnChart], [2, 'up', 1, 1, 3]);
  assert.equal(e.b.movement, 'new');
});

test('genres: from titles and Wikidata, most specific wins', () => {
  assert.equal(genreFromTitle('Yah (Mbolé Bikutsi)'), 'mbole');
  assert.equal(genreFromTitle('Best Makosa Mix'), null);        // misspelling isn't guessed
  assert.equal(genreFromTitle('Mboko Freestyle'), 'mboko');
  assert.equal(genreFromWikidata(['pop music', 'makossa']), 'makossa');
  assert.equal(genreFromWikidata(['hip hop music']), 'rap');
  assert.equal(genreFromWikidata(['reggae']), 'dancehall');
  assert.equal(genreFromWikidata(['jazz']), null);
});

const WEEK_END = '2026-11-22';
const recent = '2026-10-01';

test('weights 50/25/25 across YouTube, Shazam CM, Deezer; scores sum to 10,000', () => {
  const { rows, weights } = scoreWeek([
    { songId: 'a', releaseDate: recent, counts: { youtube: 300, shazam: 200, deezer: 100 } },
    { songId: 'b', releaseDate: recent, counts: { youtube: 100, shazam: 0, deezer: 300 } },
  ], WEEK_END);
  assert.deepEqual(weights, { youtube: 0.5, shazam: 0.25, deezer: 0.25 });
  // a: .5×.75 + .25×1 + .25×.25 = .6875 → 6875
  assert.equal(rows[0].score, 6875);
  assert.equal(rows[0].score + rows[1].score, 10000);
});

test('with Audiomack data the weights become 40/25/20/15', () => {
  const { weights } = scoreWeek([
    { songId: 'a', releaseDate: recent, counts: { youtube: 1, audiomack: 1, shazam: 1, deezer: 1 } },
  ], WEEK_END);
  assert.deepEqual(weights, { youtube: 0.4, audiomack: 0.25, shazam: 0.2, deezer: 0.15 });
});

test('missing source one week → remaining weights rescale to 100%', () => {
  const { weights, rows } = scoreWeek([
    { songId: 'a', releaseDate: recent, counts: { youtube: 750, deezer: 100 } },
    { songId: 'b', releaseDate: recent, counts: { youtube: 250, deezer: 100 } },
  ], WEEK_END);
  assert.deepEqual(weights, { youtube: 0.666667, deezer: 0.333333 });
  assert.equal(Math.round(rows[0].score + rows[1].score), 10000);
});

test('Shazam points: #1 = 200, #200 = 1, outside chart = 0', () => {
  assert.equal(shazamPoints(1), 200);
  assert.equal(shazamPoints(200), 1);
  assert.equal(shazamPoints(0), 0);
  assert.equal(shazamPoints(201), 0);
});

test('songs older than 104 weeks are ineligible and do not dilute shares', () => {
  const { rows } = scoreWeek([
    { songId: 'old', releaseDate: '2023-01-01', counts: { youtube: 1e6 } },
    { songId: 'new', releaseDate: recent, counts: { youtube: 100 } },
  ], WEEK_END);
  assert.equal(rows[0].eligible, false);
  assert.equal(rows[0].score, 0);
  assert.equal(rows[1].score, 10000);
});

test('anomaly: spike > 5× median is capped at 3× and flagged', () => {
  assert.deepEqual(adjustForAnomaly(100000, [8000, 10000, 12000, 10000]), { count: 30000, adjusted: true, original: 100000 });
  assert.equal(adjustForAnomaly(40000, [8000, 10000, 12000, 10000]).adjusted, false);
  assert.equal(adjustForAnomaly(100000, []).adjusted, false);
  assert.equal(adjustForAnomaly(3000, [100, 100]).adjusted, false);
});

test('ranking: LW, peak, weeks, movement NEW / RE / up / down', () => {
  const { rows } = scoreWeek([
    { songId: 'a', releaseDate: recent, counts: { youtube: 400 } },
    { songId: 'b', releaseDate: recent, counts: { youtube: 300 } },
    { songId: 'c', releaseDate: recent, counts: { youtube: 200 } },
    { songId: 'd', releaseDate: recent, counts: { youtube: 100 } },
  ], WEEK_END);
  const prev = {
    a: { lastRank: 3, peak: 2, weeks: 5 },
    b: { lastRank: 1, peak: 1, weeks: 9 },
    d: { lastRank: null, peak: 4, weeks: 2, everCharted: true },
  };
  const e = Object.fromEntries(rankChart(rows, prev).map((x) => [x.songId, x]));
  assert.deepEqual([e.a.rank, e.a.movement, e.a.delta, e.a.peak, e.a.weeksOnChart], [1, 'up', 2, 1, 6]);
  assert.deepEqual([e.b.rank, e.b.movement, e.b.delta, e.b.peak], [2, 'down', -1, 1]);
  assert.equal(e.c.movement, 'new');
  assert.equal(e.d.movement, 're');
});

test('genre chart only includes that genre; chart size caps entries', () => {
  const songs = Array.from({ length: 30 }, (_, i) => ({
    songId: 's' + i, genre: i % 2 ? 'makossa' : 'bikutsi', releaseDate: recent, counts: { youtube: 100 + i },
  }));
  const { rows } = scoreWeek(songs, WEEK_END);
  const mk = rankChart(rows, {}, 'makossa');
  assert.ok(mk.every((x) => rows.find((r) => r.songId === x.songId).genre === 'makossa'));
  assert.equal(mk.length, 15);
  assert.equal(rankChart(rows, {}, 'overall').length, 30);
});

test('recurrent songs (> 52 weeks) drop off Overall below rank 25', () => {
  const songs = Array.from({ length: 30 }, (_, i) => ({
    songId: 's' + String(i).padStart(2, '0'), releaseDate: recent, counts: { youtube: 1000 - i },
  }));
  songs[27].releaseDate = '2025-06-01';
  songs[0].releaseDate = '2025-06-01';
  const { rows } = scoreWeek(songs, WEEK_END);
  const ids = rankChart(rows).map((x) => x.songId);
  assert.ok(ids.includes('s00'));
  assert.ok(!ids.includes('s27'));
});
