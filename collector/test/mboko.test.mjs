import test from 'node:test';
import assert from 'node:assert/strict';
import { mbokoConfidence, mbokoScores, timeDecay, velocityBoost } from '../lib/mboko.mjs';

test('artist match is by exact credited name, never substring', () => {
  assert.ok(mbokoConfidence({ artist: 'Jovi', title: 'x' }).confidence >= 0.45);
  assert.equal(mbokoConfidence({ artist: 'Flore', title: 'x' }).confidence, 0);   // "lor" is not inside "Flore"
  assert.ok(mbokoConfidence({ artist: 'Tenor feat. Someone', title: 'x' }).confidence >= 0.45);
});
test('adjacent artists need a second signal', () => {
  assert.ok(mbokoConfidence({ artist: 'Daphne', title: 'Money' }).confidence < 0.45);
  assert.ok(mbokoConfidence({ artist: 'Daphne', title: 'Money', label: 'Blu Nation Recordingz' }).confidence >= 0.45);
});
test('team genre decisions win both ways', () => {
  assert.equal(mbokoConfidence({ artist: 'Nobody', title: 'x', teamGenre: 'mboko' }).confidence, 1);
  assert.equal(mbokoConfidence({ artist: 'Jovi', title: 'x', teamGenre: 'rap' }).confidence, 0);
});
test('time decay: a 2-week-old song beats a year-old one with the same numbers', () => {
  assert.ok(timeDecay(2) > 10 * timeDecay(52));
  const [a, b] = mbokoScores([
    { songId: 'old', artist: 'Jovi', title: 'a', ageWeeks: 52, counts: { youtube: 100000 } },
    { songId: 'new', artist: 'Jovi', title: 'b', ageWeeks: 2, counts: { youtube: 100000 } },
  ]);
  assert.ok(b.score > 10 * a.score);
});
test('velocity is smoothed, capped, and neutral when unknown', () => {
  assert.equal(velocityBoost(100000, null), 1);
  assert.equal(velocityBoost(100000, 0), 2);
  assert.equal(velocityBoost(10, 100000), 0.8);
});
test('non-Mboko songs are filtered out', () => {
  assert.deepEqual(mbokoScores([{ songId: 'z', artist: 'Generic Afropop', title: 'Douala Love', counts: { youtube: 90000 } }]), []); // one keyword = 0.15, below threshold
});
