import test from 'node:test';
import assert from 'node:assert/strict';
import { applySongFixes } from '../lib/song-fixes.mjs';

const mk = () => [
  { songId: 'Q1::koulos', releaseDate: '2026-10-01', counts: { youtube: 100, shazam: 50 }, meta: { title: 'Koulos', sources: [{ videoId: 'a' }] }, genre: 'bikutsi' },
  { songId: 'Q1::koulos lyrics', releaseDate: '2026-09-20', counts: { youtube: 40, deezer: 30 }, meta: { title: 'Koulos (Lyrics)', sources: [{ videoId: 'b' }] }, genre: 'bikutsi' },
  { songId: 'Q2::messy', releaseDate: null, counts: { youtube: 10 }, meta: { title: 'VANISTER Je Ne Suis Pas Jesus Chakap', sources: [] }, genre: null },
  { songId: 'Q3::interview', releaseDate: null, counts: { youtube: 5 }, meta: { title: 'Interview', sources: [] }, genre: null },
];

test('merge adds YouTube views, keeps best Shazam/Deezer and the earliest date', () => {
  const { songs } = applySongFixes(mk(), [{ songId: 'Q1::koulos lyrics', action: 'merge', value: 'Q1::koulos' }]);
  const k = songs.find((s) => s.songId === 'Q1::koulos');
  assert.equal(songs.length, 3);
  assert.deepEqual(k.counts, { youtube: 140, shazam: 50, deezer: 30 });
  assert.equal(k.releaseDate, '2026-09-20');
  assert.equal(k.meta.sources.length, 2);
});

test('title, genre, date and hide', () => {
  const { songs, log } = applySongFixes(mk(), [
    { songId: 'Q2::messy', action: 'title', value: 'Je ne suis pas Jésus' },
    { songId: 'Q2::messy', action: 'genre', value: 'gospel' },
    { songId: 'Q2::messy', action: 'date', value: '2026-11-01' },
    { songId: 'Q3::interview', action: 'hide', value: '' },
  ], ['gospel', 'bikutsi']);
  const m = songs.find((s) => s.songId === 'Q2::messy');
  assert.equal(m.meta.title, 'Je ne suis pas Jésus');
  assert.equal(m.genre, 'gospel');
  assert.equal(m.releaseDate, '2026-11-01');
  assert.ok(!songs.some((s) => s.songId === 'Q3::interview'));
  assert.equal(log.length, 4);
});

test('unknown genre, unknown song and bad date are ignored; later line wins', () => {
  const { songs } = applySongFixes(mk(), [
    { songId: 'Q2::messy', action: 'genre', value: 'polka' },
    { songId: 'Q9::nope', action: 'hide', value: '' },
    { songId: 'Q2::messy', action: 'date', value: 'yesterday' },
    { songId: 'Q1::koulos', action: 'title', value: 'First' },
    { songId: 'Q1::koulos', action: 'title', value: 'Second' },
  ], ['gospel']);
  assert.equal(songs.length, 4);
  assert.equal(songs.find((s) => s.songId === 'Q2::messy').genre, null);
  assert.equal(songs.find((s) => s.songId === 'Q2::messy').releaseDate, null);
  assert.equal(songs.find((s) => s.songId === 'Q1::koulos').meta.title, 'Second');
});
