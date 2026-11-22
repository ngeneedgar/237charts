import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { allSongs, duration, getChart, getGenre, getSong, longDate, top50Rank } from "../../chart";
import { Art, Explicit, Footer, Movement, NavBar, Preview, TabBar } from "../../ui";
import s from "../../home.module.css";

export function generateStaticParams() {
  return allSongs().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/song/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = getSong(slug);
  return e
    ? { title: `${e.title} · ${e.artists.join(", ")} · 237 Charts`, openGraph: { images: e.artwork ? [e.artwork] : [] } }
    : {};
}

export default async function Song({ params }: PageProps<"/[lang]/song/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const e = getSong(slug);
  if (!e) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  const genre = e.genre ? getGenre(e.genre) : null;
  const inTop50 = top50Rank(slug) != null;

  const info: [string, string | null][] = [
    [t.credits, e.artists.join(", ")],
    [t.genre, genre ? genre[lang] : null],
    [t.album, e.album],
    [t.released, longDate(e.releaseDate, lang)],
    [t.length, duration(e.durationSec)],
    [t.isrc, e.isrc],
  ];

  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path={`song/${slug}/`} title="" back={{ href: `/${lang}/top-50/`, label: t.top50Title }} />
        <Preview t={t} show={chart.preview} />

        <section className={s.detailHero}>
          <Art e={e} size="big" className={s.detailArt} />
          <div className={s.detailText}>
            <h1 className={`${s.detailTitle} ${s.detailTitleLine}`}><span>{e.title}</span>{e.explicit && <Explicit />}</h1>
            <Link className={s.detailSub} href={`/${lang}/artist/${e.artistSlug}/`}>{e.artists.join(", ")}</Link>
          </div>
        </section>

        <section className={s.stats} aria-label={t.onChart}>
          <div className={s.stat}><span className={`${s.statValue} ${e.rank === 1 ? s.rank1 : ""}`}>{e.rank}</span><span className={s.statLabel}>{inTop50 ? t.thisWeek : `${t.thisWeek} · ${genre ? genre[lang] : ""}`}</span></div>
          <div className={s.stat}><span className={s.statValue}>{e.lastWeek ?? "—"}</span><span className={s.statLabel}>{t.lastWeekLong}</span></div>
          <div className={s.stat}><span className={s.statValue}>{e.peak}</span><span className={s.statLabel}>{t.peak}</span></div>
          <div className={s.stat}><span className={s.statValue}>{e.weeks}</span><span className={s.statLabel}>{t.weeksOn}</span></div>
        </section>
        <p className={s.note} style={{ marginTop: "calc(-1 * var(--s6))" }}>
          {inTop50 ? t.top50Title : genre && <Link href={`/${lang}/genre/${genre.slug}/`}>{`Top 20 ${genre[lang]}`}</Link>}
          {" · "}<Movement e={e} t={t} />{e.adjusted && <> · {t.adjusted}</>}
        </p>

        <ul className={s.info}>
          {info.filter(([, v]) => v).map(([k, v]) => (
            <li key={k}><span className={s.infoKey}>{k}</span><span className={s.infoVal}>{v}</span></li>
          ))}
        </ul>

        <div className={s.links}>
          {e.youtube && <a className={s.primary} href={e.youtube} target="_blank" rel="noopener">{t.listenOn("YouTube")}</a>}
          {e.deezer && <a className={s.textBtn} href={e.deezer} target="_blank" rel="noopener">{t.listenOn("Deezer")}</a>}
        </div>

        <p className={s.note}>{t.sourcesNote}</p>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
