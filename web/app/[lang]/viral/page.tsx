import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart } from "../chart";
import { Footer, NavBar, Preview, TabBar } from "../ui";
import s from "../home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/viral">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? getDictionary(lang).viral : "Viral 20"} · 237 Charts` };
}

// The Viral 20 needs week-over-week growth, so it only exists once three weekly snapshots do.
export default async function Viral({ params }: PageProps<"/[lang]/viral">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="viral/" title={t.viral} back={{ href: `/${lang}/`, label: t.back }} />
        <Preview t={t} show={getChart().preview} />
        <article className={s.prose}>
          <p>{t.viralIntro}</p>
          <p>{t.viralWaiting}</p>
          <p><Link href={`/${lang}/methodology/`}>{t.methodology}</Link></p>
        </article>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
