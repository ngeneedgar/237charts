import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import { getChart, weekLabel } from "./chart";
import { Art, ChartRow, Footer, Logo, Preview, TabBar } from "./ui";
import { ChartTile, TILE_BG } from "./chart-tile";
import s from "./home.module.css";

const year = (d: string | null) => (d ? d.slice(0, 4) : null);

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const chart = getChart();
  const no1 = chart.entries[0];
  const top10 = chart.entries.slice(0, 10);

  return (
    <>
      <main className={s.page}>
        <header className={s.nav}>
          <div className={s.navRow} style={{ justifyContent: "center" }}>
            {/* Logo beside the title and week, as one centred brand block */}
            <div className={s.brandBlock}>
              <Link href={`/${lang}/`} aria-label="237 Charts" className={s.brandLogo}><Logo height={56} /></Link>
              <div className={s.brandText}>
                <h1 className={s.title}>{t.charts}</h1>
                <p className={s.week}>{t.weekOf} {weekLabel(chart.weekEnd, lang)}</p>
              </div>
            </div>
          </div>
        </header>

        <Preview t={t} show={chart.preview} />

        {no1 && (
          // No. 1 hero: always the brand dark green (same in light and dark mode), artwork blurred behind.
          // Layout follows the card's own width (container query), so it also works inside the apps.
          <section className={s.hero} aria-label={t.no1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {no1.artwork && <img className={s.heroBlur} src={no1.artwork} alt="" aria-hidden="true" />}
            <div className={s.heroInner}>
              <Link className={s.heroArtLink} href={`/${lang}/song/${no1.slug}/`} aria-label={no1.title}>
                <Art e={no1} size="big" className={s.heroArt} />
              </Link>
              <div className={s.heroText}>
                <span className={s.heroBadge}><span className={s.heroOne} aria-hidden="true">1</span>{t.no1}</span>
                <h2 className={s.heroTitle}><Link href={`/${lang}/song/${no1.slug}/`}>{no1.title}</Link></h2>
                <span className={s.heroArtist}>{no1.artists.join(", ")}</span>
                <span className={s.heroChips}>
                  <span className={s.heroChip}>{no1.movement === "new" ? t.movement.new : no1.movement === "up" ? `▲ ${no1.delta}` : no1.movement === "down" ? `▼ ${Math.abs(no1.delta ?? 0)}` : no1.movement === "re" ? t.movement.re : "="}</span>
                  <span className={s.heroChip}>{t.peak} {no1.peak}</span>
                  <span className={s.heroChip}>{no1.weeks} {t.wks}</span>
                  {year(no1.releaseDate) && <span className={s.heroChip}>{year(no1.releaseDate)}</span>}
                </span>
                <span className={s.heroActions}>
                  {no1.youtube && <a className={s.heroPrimary} href={no1.youtube} target="_blank" rel="noopener">{t.listenOn("YouTube")}</a>}
                  {no1.deezer && <a className={s.heroGhost} href={no1.deezer} target="_blank" rel="noopener">Deezer</a>}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Top 3 of every genre, right under the No. 1 */}
        <section aria-label={t.genres}>
          <div className={s.sectionHead}><h2 className={s.sectionTitle}>{t.genres}</h2></div>
          <div className={s.genreGrid}>
            {chart.genres.filter((g) => g.entries.length).map((g) => (
              <section key={g.slug} className={s.genreCard} aria-label={g[lang]}>
                <Link href={`/${lang}/genre/${g.slug}/`} className={s.genreHead}>
                  <span className={s.genreSwatch} style={{ background: TILE_BG[g.slug] ?? TILE_BG["top-50"] }} aria-hidden="true" />
                  <span className={s.genreName}>{g[lang]}</span>
                  <span className={s.sectionLink}>{t.seeAll}</span>
                </Link>
                <ol className={s.list}>
                  {g.entries.slice(0, 3).map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}
                </ol>
              </section>
            ))}
          </div>
        </section>

        {/* Chart shelves: main charts first (3 across), genre charts below */}
        <section className={s.shelf} aria-label={t.mainCharts}>
          <div className={s.shelfRow}>
            <ChartTile kind="top-20" href={`/${lang}/top-20/`} title="Top 20" label={t.country}
              caption="Top 20" sub={lang === "fr" ? "Les 20 premiers" : "The top 20 songs"} />
            <ChartTile kind="top-50" href={`/${lang}/top-50/`} title="Top 50" label={t.country}
              caption="Top 50" sub={lang === "fr" ? "Le classement complet" : "The full chart"} />
            <ChartTile kind="viral" href={`/${lang}/viral/`} title="Viral" label={t.country}
              caption="Viral 20" sub={lang === "fr" ? "Titres qui décollent" : "Songs taking off"} />
          </div>
        </section>

        <section>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{t.top10}</h2>
            <Link className={s.sectionLink} href={`/${lang}/top-50/`}>{t.seeAll}</Link>
          </div>
          <ol className={s.list}>
            {top10.map((e) => <ChartRow key={e.slug} e={e} t={t} lang={lang} />)}
          </ol>
        </section>

        <div className={s.actions}>
          <a className={s.primary} href="#share">{t.share}</a>
          <Link className={s.textBtn} href={`/${lang}/embed/`}>{t.embed}</Link>
        </div>

        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
