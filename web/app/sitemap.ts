import type { MetadataRoute } from "next";
import chart from "@/data/chart.json";
import { SITE_URL } from "./site";

export const dynamic = "force-static";

type E = { slug: string; artistSlug: string };

// Every page in both languages, each pointing to its translation.
export default function sitemap(): MetadataRoute.Sitemap {
  const genres = chart.genres as { slug: string; entries: E[] }[];
  const entries = [...new Map([...(chart.entries as E[]), ...genres.flatMap((g) => g.entries)].map((e) => [e.slug, e])).values()];
  const paths = [
    "", "top-20/", "top-50/", "viral/", "search/", "settings/", "methodology/", "artists/", "embed/",
    ...genres.map((g) => `genre/${g.slug}/`),
    ...entries.map((e) => `song/${e.slug}/`),
    ...[...new Set(entries.map((e) => e.artistSlug))].map((a) => `artist/${a}/`),
  ];
  return paths.flatMap((p) => (["fr", "en"] as const).map((lang) => ({
    url: `${SITE_URL}/${lang}/${p}`,
    lastModified: new Date(chart.generatedAt),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "top-50/" ? 0.9 : 0.6,
    alternates: { languages: { fr: `${SITE_URL}/fr/${p}`, en: `${SITE_URL}/en/${p}` } },
  })));
}
