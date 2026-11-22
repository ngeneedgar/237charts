import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart, weekLabel } from "../chart";
import { ChartRow, Footer, NavBar, Preview, TabBar } from "../ui";
import { ChartActions } from "../chart-actions";
import { chartActionsProps } from "../chart-info";
import s from "../home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/top-50">): Promise<Metadata> {
  const { lang } = await params;
  const title = `${hasLocale(lang) ? getDictionary(lang).top50Title : "Top 50"} · 237 Charts`;
  return { title: title, openGraph: { title: title, siteName: "237 Charts", type: "website", images: [{ url: "/share/top-50/og.png", width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", images: ["/share/top-50/og.png"] } };
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
        <p className={s.week} style={{ marginTop: "calc(-1 * var(--s6))" }}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
        <ChartActions {...chartActionsProps(lang, "top-50", "top-50/")} />
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
