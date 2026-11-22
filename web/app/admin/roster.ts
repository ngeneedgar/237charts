// The artist roster as the collector sees it (mirror of collector/lib/roster.mjs):
// Wikidata artists + accepted candidates + admin/artists-add.csv, minus admin/artists-remove.csv
// and minus anyone with another nationality (hard rule).
import { api, fold, parseCsv } from "./lib";

export type Artist = {
  id: string; name: string; aliases: string[]; basis: string[];
  genre: string | null; genreSource: string | null;
  channels: string[]; channelStatus: "official" | "suggested" | "none";
  suggestion: { channelId: string; title?: string; subscribers?: number | null; confidence: number } | null;
  via: "wikidata" | "discovered" | "added";
};
type Raw = { wikidata: string; name: string; aliases?: string[]; basis?: string[]; youtube?: string[] };
type Match = { name: string; status: "auto" | "review" | "none"; best?: { channelId: string; title?: string; subscribers?: number | null; confidence: number } };

export type RosterFiles = {
  genres: { content: string; sha: string | null };
  channels: { content: string; sha: string | null };
  add: { content: string; sha: string | null };
  remove: { content: string; sha: string | null };
};

export async function loadRoster(): Promise<{ artists: Artist[]; files: RosterFiles }> {
  const [base, extra, nat, genresAuto, matches, genres, channels, add, remove] = await Promise.all([
    api.json<Raw[]>("collector/out/wikidata-artists.json"),
    api.json<Raw[]>("collector/out/roster-extra.json").catch(() => [] as Raw[]),
    api.json<Record<string, { id: string }[]>>("collector/out/nationality.json").catch(() => ({} as Record<string, { id: string }[]>)),
    api.json<Record<string, { name: string; genre: string; source: string }>>("collector/out/artist-genres.json").catch(() => ({} as Record<string, { name: string; genre: string; source: string }>)),
    api.json<Record<string, Match>>("collector/out/channel-matches.json").catch(() => ({} as Record<string, Match>)),
    api.file("admin/genres.csv"), api.file("admin/channels.csv"), api.file("admin/artists-add.csv"), api.file("admin/artists-remove.csv"),
  ]);
  const added: Raw[] = parseCsv(add.content).rows.map(([name, basis]) => ({ wikidata: `X-${fold(name).replace(/ /g, "-")}`, name, basis: [basis ?? ""] }));
  const removed = new Set(parseCsv(remove.content).rows.map(([n]) => fold(n)));
  const other = new Set(Object.entries(nat ?? {}).filter(([, cs]) => cs.some((c) => c.id !== "Q1009")).map(([q]) => q));
  const teamGenre = new Map(parseCsv(genres.content).rows.map(([n, g]) => [fold(n), g]));
  const manualCh = parseCsv(channels.content).rows;

  const seen = new Set<string>();
  const artists: Artist[] = [];
  const groups: [Raw[], Artist["via"]][] = [[base ?? [], "wikidata"], [extra ?? [], "discovered"], [added, "added"]];
  for (const [list, via] of groups) for (const a of list) {
    const k = fold(a.name);
    if (seen.has(a.wikidata) || seen.has(k) || removed.has(k) || other.has(a.wikidata)) continue;
    seen.add(a.wikidata); seen.add(k);
    const names = [a.name, ...(a.aliases ?? [])].map(fold);
    const ch = [...(a.youtube ?? [])];
    for (const [artist, id] of manualCh) if (id && names.includes(fold(artist)) && !ch.includes(id)) ch.push(id);
    const m = matches?.[a.wikidata];
    if (m?.status === "auto" && m.best && !ch.includes(m.best.channelId)) ch.push(m.best.channelId);
    const tg = teamGenre.get(k);
    const ag = genresAuto?.[a.wikidata];
    artists.push({
      id: a.wikidata, name: a.name, aliases: a.aliases ?? [], basis: a.basis ?? [], via,
      genre: tg ?? ag?.genre ?? null, genreSource: tg ? "237 Charts team" : ag?.source ?? null,
      channels: ch, channelStatus: ch.length ? "official" : m?.status === "review" ? "suggested" : "none",
      suggestion: m?.status === "review" && m.best ? m.best : null,
    });
  }
  artists.sort((x, y) => x.name.localeCompare(y.name));
  return { artists, files: { genres, channels, add, remove } };
}

export const GENRES: { slug: string; label: string; color: string; priority?: boolean }[] = [
  { slug: "mbole", label: "Mbolé", color: "#FF5F6D", priority: true }, { slug: "mboko", label: "Mboko", color: "#9D4EDD", priority: true },
  { slug: "njang", label: "Njang", color: "#A8C256", priority: true }, { slug: "afro", label: "Afro", color: "#FF7EB3", priority: true },
  { slug: "makossa", label: "Makossa", color: "#11998E" }, { slug: "bikutsi", label: "Bikutsi", color: "#F7B733" },
  { slug: "rap", label: "Rap", color: "#9AA0A6" }, { slug: "dancehall", label: "Dancehall", color: "#F7C948" },
  { slug: "gospel", label: "Gospel", color: "#E0A526" },
];
export const genreLabel = (slug: string | null) => GENRES.find((g) => g.slug === slug)?.label ?? "Not set";

/** Set (or replace) one row keyed by the first column, keeping every other line as it was. */
export function upsertRow(text: string, key: string, values: string[], line: (v: string[]) => string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const i = lines.findIndex((l, n) => n > 0 && fold(l.split(",")[0].replace(/^"|"$/g, "")) === fold(key));
  if (i > 0) lines[i] = line(values);
  else { while (lines.length && lines[lines.length - 1] === "") lines.pop(); lines.push(line(values)); }
  return lines.join("\n").replace(/\n*$/, "\n");
}
