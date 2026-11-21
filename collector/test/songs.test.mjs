import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songTitle, mergeVersions } from '../lib/songs.mjs';

test('songTitle strips artist prefix, version tags and features', () => {
  assert.equal(songTitle('Sabrina - Faraway (Official Music Video)', ['Sabrina']), 'Faraway');
  assert.equal(songTitle('Sabrina - Faraway (Visualizer)', ['Sabrina']), 'Faraway');
  assert.equal(songTitle('Kocee x KS Bloom - Stranger [Clip Officiel]', ['Kocee']), 'Stranger');
  assert.equal(songTitle('CYSOUL - KIDNAPPE FEAT LADY PONCE (CLIP OFFICIEL)', ['Cysoul']), 'KIDNAPPE');
  assert.equal(songTitle('Koulos', ['Cysoul']), 'Koulos'); // Topic-style plain title
  assert.equal(songTitle('Kocee - PDG [Official video]', ['Kocee']), 'PDG');
});

test('versions of one song merge; different songs stay apart', () => {
  const v = (videoId, title, weekly, publishedAt = '2026-05-01') =>
    ({ videoId, artistId: 'Q1', artist: 'Sabrina', title, weekly, publishedAt });
  const songs = mergeVersions([
    v('a', 'Sabrina - Faraway (Official Music Video)', 1000, '2026-03-10'),
    v('b', 'Sabrina - Faraway (Visualizer)', 300, '2026-03-01'),
    v('c', 'Faraway', 200),                                 // Topic audio
    v('d', 'Sabrina - Alone (Official Music Video)', 500),
  ]);
  const faraway = songs.find((s) => s.title === 'Faraway');
  assert.equal(songs.length, 2);
  assert.equal(faraway.weekly, 1500);
  assert.equal(faraway.releaseDate, '2026-03-01');           // earliest version
  assert.equal(faraway.sources[0].videoId, 'a');             // official clip is the main link
});

test('stage name is used for display and stripped from titles', () => {
  const [s] = mergeVersions([
    { videoId: 'p', artistId: 'Q9', artist: 'Adèle Ruffine Ngono', aliases: ['Lady Ponce'],
      title: 'Lady Ponce - Ngbakan (Clip Officiel)', weekly: 1, publishedAt: '2026-01-01' },
  ]);
  assert.equal(s.artist, 'Lady Ponce');
  assert.equal(s.title, 'Ngbakan');
});

test('same title by different artists does not merge', () => {
  const songs = mergeVersions([
    { videoId: 'x', artistId: 'Q1', artist: 'A', title: 'A - Love', weekly: 1, publishedAt: '2026-01-01' },
    { videoId: 'y', artistId: 'Q2', artist: 'B', title: 'B - Love', weekly: 1, publishedAt: '2026-01-01' },
  ]);
  assert.equal(songs.length, 2);
});
