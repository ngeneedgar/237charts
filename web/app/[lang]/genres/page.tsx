import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart, weekLabel } from "../chart";
import { Footer, NavBar, Preview, TabBar } from "../ui";
import { GenreRows } from "../genre-rows";
import s from "../home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/genres">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? getDictionary(lang).genres : "Genres"} · 237 Charts` };
}

/** All genre charts on one page: each genre's cover with its Top 5. */
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
        <GenreRows genres={chart.genres} t={t} lang={lang} count={5} />
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="genres" />
    </>
  );
}
