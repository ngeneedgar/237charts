import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart, weekLabel } from "../chart";
import { ChartRow, Footer, NavBar, Preview, TabBar } from "../ui";
import s from "../home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/top-50">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? getDictionary(lang).top50Title : "Top 50"} · 237 Charts` };
}

export default async function Top50({ params }: PageProps<"/[lang]/top-50">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="top-50/" title={t.top50Title} back={{ href: `/${lang}/`, label: t.back }} />
        <p className={s.week} style={{ marginTop: -16 }}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
        <Preview t={t} show={chart.preview} />
        <ol className={s.list}>
          {chart.entries.map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}
        </ol>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
