// The artist roster = Wikidata discovery + automatically accepted candidates (roster-extra.json)
// + researched additions (collector/roster-add.csv), minus researched exclusions (roster-exclude.csv).
// Researched official channels (collector/channels-manual.csv) are attached to their artists.
// Every collector reads artists through here so these decisions flow everywhere.
import { readFile } from 'node:fs/promises';
import { norm } from './names.mjs';

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
const csv = async (path) => (await readFile(path, 'utf8').catch(() => ''))
  .replace(/^﻿/, '').split(/\r?\n/).slice(1).filter((l) => l.trim()).map(parseCsvLine);

export async function loadRoster() {
  const base = JSON.parse(await readFile('collector/out/wikidata-artists.json', 'utf8'));
  const extra = JSON.parse(await readFile('collector/out/roster-extra.json', 'utf8').catch(() => '[]'));
  const added = (await csv('admin/artists-add.csv')).map(([name, basis]) => ({
    wikidata: `X-${norm(name).replace(/ /g, '-')}`, name, aliases: [], youtube: [], spotify: [], basis: [basis], discoveredVia: ['research'],
  }));
  const excluded = new Set((await csv('admin/artists-remove.csv')).map(([n]) => norm(n)));
  // HARD RULE: Cameroonian nationals only — anyone with another recorded nationality is out
  const nat = JSON.parse(await readFile('collector/out/nationality.json', 'utf8').catch(() => '{}'));
  const otherNationality = new Set(Object.entries(nat).filter(([, cs]) => cs.some((c) => c.id !== 'Q1009')).map(([q]) => q));

  const seen = new Set();
  const roster = [...base, ...extra, ...added].filter((a) => {
    const k = norm(a.name);
    if (seen.has(a.wikidata) || seen.has(k) || excluded.has(k) || otherNationality.has(a.wikidata)) return false;
    seen.add(a.wikidata); seen.add(k);
    return true;
  }).map((a) => ({ ...a, youtube: [...(a.youtube ?? [])] }));

  for (const [artist, channelId] of await csv('admin/channels.csv')) {
    const a = roster.find((x) => [x.name, ...(x.aliases ?? [])].some((n) => norm(n) === norm(artist)));
    if (a && channelId && !a.youtube.includes(channelId)) a.youtube.push(channelId);
  }
  return roster;
}
