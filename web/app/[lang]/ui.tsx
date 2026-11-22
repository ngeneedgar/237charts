import Link from "next/link";
import type { Entry } from "./chart";
import type { Locale, getDictionary } from "./dictionaries";
import { BackLink } from "./back";
import s from "./home.module.css";
import { Icon } from "../admin/icons";

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
    <li data-explicit={e.explicit ? "true" : undefined}>
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

/** Official 237 Charts logo: white version in dark mode, black version in light mode (follows the device). */
export function Logo({ className, height = 40 }: { className?: string; height?: number }) {
  // Both versions are in the page; CSS shows the right one for the current theme (device or Settings choice)
  const st = { height, width: "auto" };
  return (
    <span className={className} style={{ display: "block" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-black" src="/brand/logo-black.svg" alt="237 Charts" height={height} style={{ ...st, display: "block" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-white" src="/brand/logo-white.svg" alt="237 Charts" height={height} style={st} />
    </span>
  );
}

/** "E" badge: fixed size, centred on the text line (never baseline-shifted). */
export function Explicit() {
  return <span className={s.explicit} role="img" aria-label="Explicit" title="Explicit">E</span>;
}

/** Page header: back control on the left, page title centred (language is chosen in Settings). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar({ t, lang, path, title, back }: { t: Dict; lang: Locale; path: string; title: string; back?: { href: string; label: string } }) {
  return (
    <header className={s.navBar}>
      <div className={s.navSide}>{back && <BackLink href={back.href} label={back.label} />}</div>
      <h1 className={s.navTitle}>{title}</h1>
      <div className={s.navSide} aria-hidden="true" />
    </header>
  );
}

export function Preview({ t, show }: { t: Dict; show: boolean }) {
  return show ? <p className={s.preview} role="note">{t.preview}</p> : null;
}

export function Footer({ t, lang }: { t: Dict; lang: Locale }) {
  return (
    <footer className={s.footer}>
      <Logo height={32} />
      <span>{t.footer}</span>
      <Link className={s.footLink} href={`/${lang}/methodology/`}><Icon name="charts" size={18} />{t.methodology}</Link>
      <Link className={s.footLink} href={`/${lang}/artists/`}><Icon name="requests" size={18} />{t.forArtists}</Link>
      <Link className={s.footLink} href={`/${lang}/privacy/`}><Icon name="shield" size={18} />{t.privacy}</Link>
      <Link className={s.footLink} href={`/${lang}/terms/`}><Icon name="doc" size={18} />{t.terms}</Link>
    </footer>
  );
}

const icons = {
  charts: <path d="M5 20V10M10 20V4M15 20v-8M20 20v-5" />,
  genres: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>,
  archive: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  embed: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /><circle cx="12" cy="12" r="7" /></>,
};

// Clean navigation: only the three main places. Archive and Embed live in Settings and the footer.
const TABS = ["charts", "genres", "search", "settings"] as const;

export function TabBar({ t, lang, active }: { t: Dict; lang: Locale; active: keyof typeof icons }) {
  return (
    <nav className={s.tabbar} aria-label="Main">
      {TABS.map((k) => (
        <Link key={k} href={k === "charts" ? `/${lang}/` : `/${lang}/${k}/`} className={`${s.tab} ${k === active ? s.tabOn : ""}`} aria-current={k === active ? "page" : undefined}>
          <Icon name={k} size={26} />
          {t.tabs[k]}
        </Link>
      ))}
    </nav>
  );
}
