import Link from "next/link";
import type { Entry } from "./chart";
import type { Locale, getDictionary } from "./dictionaries";
import { BackLink } from "./back";
import s from "./home.module.css";

type Dict = ReturnType<typeof getDictionary>;

export const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** Official artwork when we have it; initials tile otherwise. */
export function Art({ e, size, className }: { e: Entry; size: "small" | "big"; className: string }) {
  const src = size === "big" ? e.artwork : e.artworkSmall;
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className={className} src={src} alt="" loading={size === "big" ? "eager" : "lazy"} decoding="async" />
    : <span className={className} aria-hidden="true">{initials(e.artist)}</span>;
}

export function Movement({ e, t }: { e: Entry; t: Dict }) {
  if (e.movement === "new") return <span className={`${s.mv} ${s.new}`}>{t.movement.new}</span>;
  if (e.movement === "re") return <span className={`${s.mv} ${s.new}`}>{t.movement.re}</span>;
  if (e.movement === "up") return <span className={`${s.mv} ${s.up}`}>▲ {e.delta}</span>;
  if (e.movement === "down") return <span className={`${s.mv} ${s.down}`}>▼ {Math.abs(e.delta ?? 0)}</span>;
  return <span className={`${s.mv} ${s.same}`}>{t.movement.same}</span>;
}

/** Chart row: whole row links to the song page. */
export function ChartRow({ e, t, lang }: { e: Entry; t: Dict; lang: Locale }) {
  return (
    <li>
      <Link className={s.row} href={`/${lang}/song/${e.slug}/`}>
        <span className={`${s.rank} ${e.rank === 1 ? s.rank1 : ""}`}>{e.rank}</span>
        <Art e={e} size="small" className={s.thumb} />
        <span className={s.rowText}>
          <span className={s.rowTitleLine}>
            <span className={s.rowTitle}>{e.title}</span>
            {e.explicit && <Explicit />}
          </span>
          <span className={s.rowArtist}>{e.artists.join(", ")}</span>
        </span>
        <Movement e={e} t={t} />
      </Link>
    </li>
  );
}

/** "E" badge: fixed size, centred on the text line (never baseline-shifted). */
export function Explicit() {
  return <span className={s.explicit} role="img" aria-label="Explicit" title="Explicit">E</span>;
}

/** Large title (home) or back link + title (sub-pages), with FR/EN switch keeping the same page. */
export function NavBar({ t, lang, path, title, back }: { t: Dict; lang: Locale; path: string; title: string; back?: { href: string; label: string } }) {
  return (
    <header className={s.nav}>
      <div className={s.navRow}>
        {back ? <BackLink href={back.href} label={back.label} /> : <span />}
        <nav className={s.seg} aria-label="Language">
          <Link href={`/en/${path}`} aria-current={lang === "en"} hrefLang="en">EN</Link>
          <Link href={`/fr/${path}`} aria-current={lang === "fr"} hrefLang="fr">FR</Link>
        </nav>
      </div>
      {title && <h1 className={s.title}>{title}</h1>}
    </header>
  );
}

export function Preview({ t, show }: { t: Dict; show: boolean }) {
  return show ? <p className={s.preview} role="note">{t.preview}</p> : null;
}

export function Footer({ t, lang }: { t: Dict; lang: Locale }) {
  return (
    <footer className={s.footer}>
      <span>{t.footer}</span>
      <Link href={`/${lang}/methodology/`}>{t.methodology}</Link>
      <Link href={`/${lang}/artists/`}>{t.forArtists}</Link>
    </footer>
  );
}

const icons = {
  charts: <path d="M5 20V10M10 20V4M15 20v-8M20 20v-5" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>,
  archive: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  embed: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
};

export function TabBar({ t, lang, active }: { t: Dict; lang: Locale; active: keyof typeof icons }) {
  return (
    <nav className={s.tabbar} aria-label="Main">
      {(Object.keys(icons) as (keyof typeof icons)[]).map((k) => (
        <Link key={k} href={k === "charts" ? `/${lang}/` : `/${lang}/${k}/`} className={`${s.tab} ${k === active ? s.tabOn : ""}`} aria-current={k === active ? "page" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[k]}</svg>
          {t.tabs[k]}
        </Link>
      ))}
    </nav>
  );
}
