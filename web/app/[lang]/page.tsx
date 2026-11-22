import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import { getChart, weekLabel } from "./chart";
import { Art, ChartRow, Footer, Logo, Preview, TabBar } from "./ui";
import { ChartTile } from "./chart-tile";
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

        <section className={s.shelf}>
          <div className={s.shelfHead}><h2 className={s.shelfTitle}>{t.genres}</h2></div>
          <div className={s.shelfRow}>
            {chart.genres.map((g) => (
              <ChartTile key={g.slug} kind={g.slug} href={`/${lang}/genre/${g.slug}/`} long
                title={g.slug === "afro" ? "Afro" : g.slug === "hiphop" ? (lang === "fr" ? "Hip-hop" : "Hip Hop") : g[lang]} label="Top 20"
                caption={g.entries[0]?.title ?? "—"} sub={g.entries[0]?.primaryArtist ?? ""} />
            ))}
          </div>
        </section>

        {no1 && (
          <section className={s.hero} aria-label={t.no1}>
            <Link href={`/${lang}/song/${no1.slug}/`} aria-label={no1.title}><Art e={no1} size="big" className={s.art} /></Link>
            <div className={s.heroText}>
              <span className={s.eyebrow}>{t.no1}</span>
              <h2 className={s.heroTitle}><Link href={`/${lang}/song/${no1.slug}/`} style={{ color: "inherit" }}>{no1.title}</Link></h2>
              <span className={s.heroArtist}>{no1.artists.join(", ")}</span>
              <span className={s.heroMeta}>
                {[no1.album !== no1.title ? no1.album : null, year(no1.releaseDate), `${t.peak} ${no1.peak}`, `${no1.weeks} ${t.wks}`].filter(Boolean).join(" · ")}
              </span>
              <span className={s.heroLinks}>
                {no1.youtube && <a href={no1.youtube} target="_blank" rel="noopener">YouTube</a>}
                {no1.deezer && <a href={no1.deezer} target="_blank" rel="noopener">Deezer</a>}
              </span>
            </div>
          </section>
        )}

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
