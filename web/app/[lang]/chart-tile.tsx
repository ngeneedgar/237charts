import Link from "next/link";
import s from "./home.module.css";

/** Square chart "cover" drawn in CSS (no image files): title, rule, label, white logo.
 *  Every chart has its OWN gradient — different hues, angles and shapes — all deep enough
 *  for white text (a soft dark veil on top guarantees contrast on the lighter stops). */
export const TILE_BG: Record<string, string> = {
  // Main charts
  "top-20": "linear-gradient(135deg, #FF9F1C 0%, #FF4E50 55%, #C9184A 100%)",            // sunset
  "top-50": "radial-gradient(120% 120% at 15% 10%, #F97316 0%, #9A3412 55%, #3B0A0A 100%)", // ember
  viral: "linear-gradient(200deg, #00D2FF 0%, #3A47D5 50%, #8E2DE2 100%)",               // electric
  // Genres
  makossa: "linear-gradient(160deg, #11998E 0%, #0B6E6E 50%, #073B4C 100%)",             // Wouri river teal
  bikutsi: "linear-gradient(145deg, #F7B733 0%, #E8590C 60%, #8A2C02 100%)",             // forest fire
  mbole: "radial-gradient(110% 110% at 85% 15%, #FF5F6D 0%, #B21F1F 50%, #3D0C11 100%)", // street red
  njang: "linear-gradient(120deg, #A8C256 0%, #4C8C2B 45%, #1B3A1A 100%)",               // grassfields
  afro: "linear-gradient(225deg, #FF7EB3 0%, #E0218A 45%, #7A0B3D 100%)",                // hot pink → wine (no purple)
  hiphop: "linear-gradient(170deg, #434343 0%, #1F1F1F 60%, #000000 100%), radial-gradient(80% 60% at 80% 90%, rgba(255,214,10,.35), transparent 70%)", // asphalt + streetlight
  mboko: "linear-gradient(160deg, #9D4EDD 0%, #5A189A 50%, #240046 100%)",               // royal purple (Afro is pink, never purple)
  gospel: "radial-gradient(120% 120% at 50% 0%, #FFE8A3 0%, #E0A526 40%, #7A4A06 100%)",    // morning light gold
};

export function ChartTile({ href, kind, title, label, caption, sub, long }: {
  href: string; kind: string; title: string; label: string; caption: string; sub: string; long?: boolean;
}) {
  const bg = TILE_BG[kind] ?? TILE_BG["top-50"];
  return (
    <Link className={s.tile} href={href}>
      <span className={s.tileArt} style={{ background: `linear-gradient(rgba(0,0,0,.14), rgba(0,0,0,.14)), ${bg}` }} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.tileMark} src="/brand/logo-white.svg" alt="" />
        <span className={`${s.tileTitle} ${long ? s.tileTitleLong : ""}`}>{title}</span>
        <span className={s.tileRule} />
        <span className={s.tileLabel}>{label}</span>
      </span>
      <span className={s.tileCaption}>{caption}</span>
      <span className={s.tileSub}>{sub}</span>
    </Link>
  );
}
