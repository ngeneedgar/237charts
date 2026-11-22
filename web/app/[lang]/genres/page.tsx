import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart, weekLabel } from "../chart";
import { Footer, NavBar, Preview, TabBar } from "../ui";
import Link from "next/link";
import { CoverArt } from "../chart-tile";
import { genreShort } from "../genre-rows";
import s from "../home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/genres">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? getDictionary(lang).genres : "Genres"} · 237 Charts` };
}

/** All genre charts as cover cards; tapping one opens that genre's full chart. */
export default async function Genres({ params }: PageProps<"/[lang]/genres">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="genres/" title={t.genres} back={{ href: `/${lang}/`, label: t.back }} />
        <p className={s.week} style={{ textAlign: "center", margin: 0 }}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
        <Preview t={t} show={chart.preview} />
        <p className={s.note} style={{ margin: 0 }}>{t.genresIntro}</p>
        {/* Covers only: each opens the full genre chart page (which can get its own look later) */}
        <div className={s.genreCards}>
          {chart.genres.map((g) => (
            <Link key={g.slug} href={`/${lang}/genre/${g.slug}/`} className={s.genreCardLink} aria-label={`${g[lang]} Top 20`}>
              <CoverArt kind={g.slug} long title={genreShort(g, lang)} label="Top 20" />
            </Link>
          ))}
        </div>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="genres" />
    </>
  );
}
