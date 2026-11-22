import Link from "next/link";
import type { Entry } from "./chart";
import type { Locale, getDictionary } from "./dictionaries";
import { CoverArt } from "./chart-tile";
import s from "./home.module.css";

type Dict = ReturnType<typeof getDictionary>;
type Genre = { slug: string; en: string; fr: string; entries: Entry[] };

export const genreShort = (g: Genre, lang: Locale) =>
  g.slug === "afro" ? "Afro" : g.slug === "hiphop" ? (lang === "fr" ? "Hip-hop" : "Hip Hop") : g[lang];

const cleanTitle = (t: string) => t.replace(/\s*[([](feat|ft)\.?[^)\]]*[)\]]/gi, "");

/** Every genre chart as one row: its square cover on the left, its top tracks on the right (team sketch).
 *  Used on the home page and on the Genres page. Genres without songs yet stay listed with a short note. */
export function GenreRows({ genres, t, lang, count = 3 }: { genres: Genre[]; t: Dict; lang: Locale; count?: number }) {
  return (
    <div className={s.genreGrid}>
      {genres.map((g) => (
        <section key={g.slug} className={s.genreBlock} aria-label={g[lang]}>
          <Link href={`/${lang}/genre/${g.slug}/`} className={s.genreCover} aria-label={`${g[lang]} Top 20`}>
            <CoverArt kind={g.slug} long title={genreShort(g, lang)} label="Top 20" />
          </Link>
          {g.entries.length ? (
            <ol className={s.genreTracks}>
              {g.entries.slice(0, count).map((e) => (
                <li key={e.slug} data-explicit={e.explicit ? "true" : undefined}>
                  <Link href={`/${lang}/song/${e.slug}/`} className={s.genreTrack}>
                    <span className={s.genreRank}>{e.rank}</span>
                    <span className={s.rowText}>
                      <span className={s.rowTitle}>{cleanTitle(e.title)}</span>
                      <span className={s.rowArtist}>{e.artists.join(", ")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className={s.genreEmpty}>{t.genreEmpty}</p>
          )}
        </section>
      ))}
    </div>
  );
}
