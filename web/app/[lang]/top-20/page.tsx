import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart, weekLabel } from "../chart";
import { ChartRow, Footer, NavBar, Preview, TabBar } from "../ui";
import s from "../home.module.css";

// Top 20 = the first 20 places of the Top 50 (same scores, shorter list).
export async function generateMetadata({ params }: PageProps<"/[lang]/top-20">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? getDictionary(lang).top20Title : "Top 20"} · 237 Charts` };
}

export default async function Top20({ params }: PageProps<"/[lang]/top-20">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="top-20/" title={t.top20Title} back={{ href: `/${lang}/`, label: t.back }} />
        <p className={s.week} style={{ marginTop: "calc(-1 * var(--s6))" }}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
        <Preview t={t} show={chart.preview} />
        <ol className={s.list}>
          {chart.entries.slice(0, 20).map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}
        </ol>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
