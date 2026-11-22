// Manual chart positions set by the team in the admin (admin/chart-overrides.csv):
//   chart,songId,rank,reason      chart = top-50 or a genre slug
// Applied inside rankChart, so last week / peak / movement stay correct. Every line is a commit with a
// reason, listed in the public corrections log. Later lines win for the same chart + song.
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

/** → { 'top-50': { songId: rank }, makossa: { … } } */
export async function loadChartPins(path = 'admin/chart-overrides.csv') {
  const text = await readFile(path, 'utf8').catch(() => '');
  const pins = {};
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const [chart, songId, rank] = parseCsvLine(line);
    const n = Number(rank);
    if (!chart || !songId || !Number.isFinite(n) || n < 1) continue;
    (pins[chart] ??= {})[songId] = n;
  }
  return pins;
}
