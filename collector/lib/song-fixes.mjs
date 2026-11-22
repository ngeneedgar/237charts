// Manual song fixes from the admin (admin/song-fixes.csv): songId,action,value,reason
//   title  → display title            e.g.  Q123::je ne suis pas jesus,title,Je ne suis pas Jésus,messy upload title
//   genre  → genre slug for this song  e.g.  Q123::alleluia,genre,gospel,gospel song by a makossa artist
//   hide   → not a song (interview, teaser…); value empty
//   merge  → add this song's counts into another song; value = the songId to keep
//   date   → release date YYYY-MM-DD
// Every fix is a commit with a reason (public corrections log). Later lines win over earlier ones for the same song+action.
import { readFile } from 'node:fs/promises';

function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export async function loadSongFixes(path = 'admin/song-fixes.csv') {
  const text = await readFile(path, 'utf8').catch(() => '');
  return text.replace(/^﻿/, '').split(/\r?\n/).slice(1).filter((l) => l.trim()).map(parseCsvLine)
    .map(([songId, action, value = '', reason = '']) => ({ songId, action: (action ?? '').toLowerCase(), value, reason }))
    .filter((f) => f.songId && ['title', 'genre', 'hide', 'merge', 'date'].includes(f.action));
}

/**
 * Apply fixes to the week's songs (before scoring). Songs: { songId, releaseDate, counts:{youtube,shazam,deezer}, meta:{title,sources}, genre }.
 * Returns the new song list and a log of what was applied.
 */
export function applySongFixes(songs, fixes, validGenres = []) {
  const byId = new Map(songs.map((s) => [s.songId, s]));
  const log = [];
  const last = new Map();
  for (const f of fixes) last.set(`${f.songId}|${f.action}`, f); // later lines win

  for (const f of last.values()) {
    const s = byId.get(f.songId);
    if (!s) continue; // song not in this week's data
    if (f.action === 'title' && f.value) { s.meta = { ...s.meta, title: f.value }; s.titleFixed = true; log.push(`title: ${f.songId} → ${f.value}`); }
    if (f.action === 'genre' && (!validGenres.length || validGenres.includes(f.value))) { s.genre = f.value; log.push(`genre: ${f.songId} → ${f.value}`); }
    if (f.action === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(f.value)) { s.releaseDate = f.value; s.releaseSource = 'team'; log.push(`date: ${f.songId} → ${f.value}`); }
  }
  for (const f of last.values()) {
    if (f.action !== 'merge') continue;
    const from = byId.get(f.songId), to = byId.get(f.value);
    if (!from || !to || from === to) continue;
    to.counts = {
      ...to.counts,
      youtube: (to.counts.youtube ?? 0) + (from.counts.youtube ?? 0) || undefined,
      shazam: Math.max(to.counts.shazam ?? 0, from.counts.shazam ?? 0) || undefined,
      deezer: Math.max(to.counts.deezer ?? 0, from.counts.deezer ?? 0) || undefined,
    };
    for (const k of Object.keys(to.counts)) if (to.counts[k] === undefined) delete to.counts[k];
    to.meta = { ...to.meta, sources: [...(to.meta.sources ?? []), ...(from.meta.sources ?? [])] };
    const dates = [to.releaseDate, from.releaseDate].filter(Boolean).sort();
    to.releaseDate = dates[0] ?? null;
    byId.delete(f.songId);
    log.push(`merge: ${f.songId} → ${f.value}`);
  }
  for (const f of last.values()) {
    if (f.action === 'hide' && byId.delete(f.songId)) log.push(`hide: ${f.songId}`);
  }
  return { songs: [...byId.values()], log };
}
