import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { getChart, getGenre, weekLabel } from "../../chart";
import { ChartRow, Footer, NavBar, Preview, TabBar } from "../../ui";
import s from "../../home.module.css";

export function generateStaticParams() {
  return getChart().genres.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/genre/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const g = getGenre(slug);
  if (!g || !hasLocale(lang)) return {};
  return { title: `${getDictionary(lang).genreTop(g[lang])} · 237 Charts` };
}

export default async function Genre({ params }: PageProps<"/[lang]/genre/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const g = getGenre(slug);
  if (!g) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path={`genre/${slug}/`} title={t.genreTop(g[lang])} back={{ href: `/${lang}/`, label: t.back }} />
        <p className={s.week} style={{ marginTop: -16 }}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
        <Preview t={t} show={chart.preview} />
        <nav className={s.chips} aria-label={t.genres}>
          {chart.genres.map((x) => (
            <Link key={x.slug} href={`/${lang}/genre/${x.slug}/`} aria-current={x.slug === slug ? "page" : undefined}>{x[lang]}</Link>
          ))}
        </nav>
        {g.entries.length
          ? <ol className={s.list}>{g.entries.map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}</ol>
          : <p className={s.prose}>{t.genreEmpty}</p>}
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
