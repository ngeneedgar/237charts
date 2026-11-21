import chart from "@/data/chart.json";

export type Entry = {
  slug: string; artistSlug: string; primaryArtist: string; genre: string | null;
  rank: number; title: string; artist: string; lastWeek: number | null; peak: number; weeks: number;
  movement: "up" | "down" | "same" | "new" | "re"; delta: number | null; adjusted: boolean; youtube: string | null;
  artwork: string | null; artworkSmall: string | null; artworkSource: "deezer" | "youtube" | null;
  artists: string[]; album: string | null; releaseDate: string | null; durationSec: number | null;
  isrc: string | null; explicit: boolean; deezer: string | null;
};
export type GenreChart = { slug: string; en: string; fr: string; entries: Entry[] };
export type Chart = { weekEnd: string; preview: boolean; generatedAt: string; entries: Entry[]; genres: GenreChart[] };

export const getChart = (): Chart => chart as unknown as Chart;
export const getGenre = (slug: string) => getChart().genres.find((g) => g.slug === slug);

/** Every song shown anywhere (Top 50 + genre charts), once. Top 50 data wins (it carries the overall rank). */
export function allSongs(): Entry[] {
  const c = getChart();
  const map = new Map<string, Entry>();
  for (const g of c.genres) for (const e of g.entries) map.set(e.slug, e);
  for (const e of c.entries) map.set(e.slug, e);
  return [...map.values()];
}
export const top50Rank = (slug: string) => getChart().entries.find((e) => e.slug === slug)?.rank ?? null;
export const getSong = (slug: string) => allSongs().find((e) => e.slug === slug);
export const getArtistSongs = (artistSlug: string) => allSongs().filter((e) => e.artistSlug === artistSlug);
export const artistSlugs = () => [...new Set(allSongs().map((e) => e.artistSlug))];

export const duration = (sec: number | null) => (sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : null);
export const longDate = (d: string | null, lang: "fr" | "en") =>
  d ? new Date(d + "T00:00:00Z").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null;

/** "Semaine du 16 nov. 2026" / "Week of 16 Nov 2026" — chart week starts 6 days before weekEnd. */
export function weekLabel(weekEnd: string, lang: "fr" | "en") {
  const start = new Date(new Date(weekEnd + "T00:00:00Z").getTime() - 6 * 864e5);
  return start.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
