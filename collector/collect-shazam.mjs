// 237 Charts — weekly Shazam Cameroon Top 200 (official public CSV, past 7 days).
// The only source measured INSIDE Cameroon. Gives rank, not counts.
// Usage: node collector/collect-shazam.mjs
import { writeFile, mkdir } from 'node:fs/promises';

const URL_CSV = 'https://www.shazam.com/services/charts/csv/top-200/cameroon';
const res = await fetch(URL_CSV, { headers: { 'User-Agent': '237Charts/0.1 (weekly music chart)' }, signal: AbortSignal.timeout(60000) });
if (!res.ok) throw new Error(`Shazam ${res.status}`);
const text = (await res.text()).replace(/^﻿/, '');

// Minimal CSV parser (handles quoted fields with commas and "" escapes)
function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

const lines = text.split(/\r?\n/).filter(Boolean);
const period = lines[0].replace(/"/g, '').trim();                 // e.g. "Saturday, 21 November 2026 [performance over the past 7 days]"
const header = lines.findIndex((l) => /^Rank,Artist,Title/i.test(l));
const entries = lines.slice(header + 1).map(parseCsvLine).filter((r) => r.length >= 3 && /^\d+$/.test(r[0]))
  .map(([rank, artist, title]) => ({ rank: Number(rank), artist, title }));

const takenAt = new Date().toISOString();
await mkdir('collector/out/snapshots', { recursive: true });
const file = `collector/out/snapshots/shazam-cm-${takenAt.slice(0, 10)}.json`;
await writeFile(file, JSON.stringify({ takenAt, period, source: URL_CSV, entries }, null, 2));
console.log(`Shazam Cameroon: ${entries.length} entries (${period}) → ${file}`);

// Discovery: artists charting in Cameroon who aren't in our roster yet → review candidates.
// Popular in CM ≠ Cameroonian (Fally Ipupa, Tiakola…), so these always go to human review.
const { readFile } = await import('node:fs/promises');
const { norm } = await import('./lib/names.mjs');
const { loadRoster } = await import('./lib/roster.mjs');
const wd = await loadRoster().catch(() => []);
const known = new Set(wd.flatMap((a) => [a.name, ...(a.aliases ?? [])]).map(norm));
const split = (s) => s.split(/\s*(?:,|&|\bx\b|\bfeat\.?)\s*/i).map((x) => x.trim()).filter(Boolean);
const cands = new Map();
for (const e of entries) for (const name of split(e.artist)) {
  const k = norm(name);
  if (!k || known.has(k)) continue;
  const c = cands.get(k) ?? { name, bestRank: e.rank, songs: [] };
  c.bestRank = Math.min(c.bestRank, e.rank);
  if (c.songs.length < 3) c.songs.push(`${e.title} (#${e.rank})`);
  cands.set(k, c);
}
const out = [...cands.values()].sort((a, b) => a.bestRank - b.bestRank).map((c) => ({ ...c, source: 'shazam-cm', confidence: 0.7 }));
await writeFile('collector/out/shazam-candidates.json', JSON.stringify(out, null, 2));
console.log(`New candidate artists from Shazam Cameroon (→ review): ${out.length}`);
