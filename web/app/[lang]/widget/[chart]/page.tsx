import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { getChart, getGenre, weekLabel, type Entry } from "../../chart";
import { SITE_URL } from "../../../site";
import { WidgetOptions } from "./options";
import w from "./widget.module.css";

// Embeddable chart: /fr/widget/top-50/?n=10&theme=dark — shows ranks, movement, links (no raw counts).
export function generateStaticParams() {
  return [{ chart: "top-50" }, ...getChart().genres.map((g) => ({ chart: g.slug }))];
}

export const metadata: Metadata = { robots: { index: false } };

function chartData(slug: string, lang: "fr" | "en") {
  if (slug === "top-50") return { title: lang === "fr" ? "Top 50 Cameroun" : "Cameroon Top 50", entries: getChart().entries, page: "top-50/" };
  const g = getGenre(slug);
  return g ? { title: lang === "fr" ? `Top 20 ${g.fr}` : `${g.en} Top 20`, entries: g.entries, page: `genre/${slug}/` } : null;
}

function Mv({ e, t }: { e: Entry; t: ReturnType<typeof getDictionary> }) {
  if (e.movement === "new") return <span className={`${w.mv} ${w.new}`}>{t.movement.new}</span>;
  if (e.movement === "re") return <span className={`${w.mv} ${w.new}`}>{t.movement.re}</span>;
  if (e.movement === "up") return <span className={`${w.mv} ${w.up}`}>▲ {e.delta}</span>;
  if (e.movement === "down") return <span className={`${w.mv} ${w.down}`}>▼ {Math.abs(e.delta ?? 0)}</span>;
  return <span className={`${w.mv} ${w.same}`}>—</span>;
}

export default async function Widget({ params }: PageProps<"/[lang]/widget/[chart]">) {
  const { lang, chart: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const c = chartData(slug, lang);
  if (!c) notFound();
  const t = getDictionary(lang);
  const rootId = "w237";
  return (
    <div id={rootId} className={w.w} data-theme="light">
      <style>{`#${rootId}[data-theme="dark"]{${"--bg:#1C1C1E;--label:#FFFFFF;--label2:#EBEBF599;--label3:#EBEBF54D;--sep:#54545899;--fill:#7878803D;--accent:#FF8A1F;--up:#30D158;--down:#FF453A;color-scheme:dark"}} body{margin:0;background:transparent}`}</style>
      <div className={w.head}>
        <h1 className={w.title}>{c.title}</h1>
        <span className={w.week}>{t.weekOf} {weekLabel(getChart().weekEnd, lang)}</span>
      </div>
      <ol className={w.list}>
        {c.entries.slice(0, 10).map((e) => (
          <li key={e.slug} data-rank={e.rank} hidden={e.rank > 10}>
            <a className={w.row} href={`${SITE_URL}/${lang}/song/${e.slug}/`} target="_blank" rel="noopener">
              <span className={`${w.rank} ${e.rank === 1 ? w.rank1 : ""}`}>{e.rank}</span>
              {e.artworkSmall
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className={w.art} src={e.artworkSmall} alt="" loading="lazy" />
                : <span className={w.art} aria-hidden="true">{e.primaryArtist.slice(0, 2).toUpperCase()}</span>}
              <span className={w.text}><span className={w.t}>{e.title}</span><span className={w.a}>{e.artists.join(", ")}</span></span>
              <Mv e={e} t={t} />
            </a>
          </li>
        ))}
      </ol>
      <div className={w.foot}>
        <span>{lang === "fr" ? "Classement par" : "Chart by"} <a href={`${SITE_URL}/${lang}/`} target="_blank" rel="noopener">237 Charts</a></span>
        <a href={`${SITE_URL}/${lang}/${c.page}`} target="_blank" rel="noopener">{t.seeAll} ›</a>
      </div>
      <WidgetOptions rootId={rootId} />
    </div>
  );
}
