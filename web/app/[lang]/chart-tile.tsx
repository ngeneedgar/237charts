import Link from "next/link";
import s from "./home.module.css";

/** Square chart "cover" drawn in CSS (no image files): title, rule, country/genre label, 237 mark.
 *  Each chart has its own colour pair so rows read like a shelf of records. */
export const TILE_COLORS: Record<string, [string, string]> = {
  "top-50": ["#FF7A00", "#B83A00"],
  viral: ["#FF3D7F", "#7A1FA2"],
  makossa: ["#0E8C7A", "#06433F"],
  bikutsi: ["#E0A100", "#8A4B00"],
  mbole: ["#D93A2B", "#6E1414"],
  njang: ["#3F7D3A", "#1D3A1B"],
  afro: ["#2F6FE4", "#1A2F7A"],
  hiphop: ["#3A3A46", "#0D0D12"],
  mboko: ["#8B5CF6", "#3B1A80"],
};

export function ChartTile({ href, kind, title, label, caption, sub, long }: {
  href: string; kind: string; title: string; label: string; caption: string; sub: string; long?: boolean;
}) {
  const [a, b] = TILE_COLORS[kind] ?? TILE_COLORS["top-50"];
  return (
    <Link className={s.tile} href={href}>
      <span className={s.tileArt} style={{ background: `linear-gradient(150deg, ${a} 0%, ${b} 100%)` }} aria-hidden="true">
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
