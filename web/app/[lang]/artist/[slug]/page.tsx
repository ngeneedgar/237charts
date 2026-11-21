import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { artistSlugs, getArtistSongs, getChart } from "../../chart";
import { Art, ChartRow, Footer, NavBar, Preview, TabBar } from "../../ui";
import s from "../../home.module.css";

export function generateStaticParams() {
  return artistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/artist/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const songs = getArtistSongs(slug);
  return songs[0] ? { title: `${songs[0].primaryArtist} · 237 Charts` } : {};
}

export default async function Artist({ params }: PageProps<"/[lang]/artist/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const songs = getArtistSongs(slug);
  if (!songs.length) notFound();
  const t = getDictionary(lang);
  const name = songs[0].primaryArtist;
  const best = Math.min(...songs.map((e) => e.peak));
  const withArt = songs.find((e) => e.artwork) ?? songs[0];

  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path={`artist/${slug}/`} title="" back={{ href: `/${lang}/top-50/`, label: t.top50Title }} />
        <Preview t={t} show={getChart().preview} />

        <section className={s.detailHero}>
          <Art e={withArt} size="big" className={s.detailArt} />
          <div>
            <h1 className={s.detailTitle}>{name}</h1>
            <span className={s.heroMeta}>{t.artistNote}</span>
          </div>
        </section>

        <section className={s.stats} style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className={s.stat}><span className={s.statValue}>{songs.length}</span><span className={s.statLabel}>{t.onChart}</span></div>
          <div className={s.stat}><span className={`${s.statValue} ${best === 1 ? s.rank1 : ""}`}>{best}</span><span className={s.statLabel}>{t.peak}</span></div>
        </section>

        <ol className={s.list}>
          {songs.map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}
        </ol>
        <Link className={s.textBtn} href={`/${lang}/artists/`}>{t.artistIssue}</Link>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
