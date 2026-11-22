import test from 'node:test';
import assert from 'node:assert/strict';
import { expiredSnapshots } from '../lib/retention.mjs';

test('YouTube snapshots older than 30 days are expired; others and non-YouTube files are kept', () => {
  const files = ['youtube-2026-10-01.json', 'youtube-2026-10-23.json', 'youtube-2026-11-22.json', 'deezer-2026-10-01.json', 'shazam-cm-2026-10-01.json', 'notes.txt'];
  assert.deepEqual(expiredSnapshots(files, new Date('2026-11-22T07:00:00Z')), ['youtube-2026-10-01.json']);
});

test('the snapshot a week back is always kept', () => {
  assert.deepEqual(expiredSnapshots(['youtube-2026-11-15.json', 'youtube-2026-11-22.json'], new Date('2026-11-22T07:00:00Z')), []);
});

import { stripOldChannelData } from '../lib/retention.mjs';
test('channel matches: stamped on first sight, YouTube fields removed after 30 days, IDs kept', () => {
  const m = { a: { name: 'A', best: { channelId: 'UC1', title: 'A', subscribers: 5, confidence: 0.9 }, candidates: [{ channelId: 'UC1', title: 'A', subscribers: 5 }] },
              b: { name: 'B', checkedAt: '2026-10-01', best: { channelId: 'UC2', title: 'B', subscribers: 9, confidence: 0.7 }, candidates: [{ channelId: 'UC2', title: 'B' }] } };
  assert.equal(stripOldChannelData(m, new Date('2026-11-22T07:00:00Z')), 1);
  assert.equal(m.a.checkedAt, '2026-11-22');
  assert.equal(m.a.best.title, 'A');
  assert.deepEqual(m.b.best, { channelId: 'UC2', confidence: 0.7 });
  assert.deepEqual(m.b.candidates, [{ channelId: 'UC2' }]);
});
