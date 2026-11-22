import test from 'node:test';
import assert from 'node:assert/strict';
import { rankChart } from '../lib/scoring.mjs';

const rows = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ songId: id, score: 100 - i * 10, eligible: true, genre: 'makossa' }));
const prev = { a: { lastRank: 1, peak: 1, weeks: 2, everCharted: true }, d: { lastRank: 2, peak: 2, weeks: 1, everCharted: true } };

test('without pins the order follows the score', () => {
  assert.deepEqual(rankChart(rows, prev).map((e) => e.songId), ['a', 'b', 'c', 'd', 'e']);
});

test('a pinned song takes its position; the others keep their order', () => {
  const c = rankChart(rows, prev, 'overall', undefined, { d: 1 });
  assert.deepEqual(c.map((e) => e.songId), ['d', 'a', 'b', 'c', 'e']);
  assert.equal(c[0].manual, true);
  assert.equal(c[1].manual, undefined);
  // movement and peak are computed from the final position
  assert.equal(c[0].movement, 'up'); assert.equal(c[0].delta, 1); assert.equal(c[0].peak, 1);
  assert.equal(c[1].movement, 'down'); assert.equal(c[1].delta, -1);
});

test('pins in a genre chart, unknown songs ignored, rank past the end goes last', () => {
  const c = rankChart(rows, {}, 'makossa', undefined, { a: 4, zzz: 1 });
  assert.deepEqual(c.map((e) => e.songId), ['b', 'c', 'd', 'a', 'e']);
  const end = rankChart(rows, {}, 'overall', undefined, { a: 99 });
  assert.equal(end.at(-1).songId, 'a');
});
