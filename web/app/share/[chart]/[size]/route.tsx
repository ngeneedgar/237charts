// Share images, made at build time for every chart (static files in out/share/…):
//   /share/<chart>/og.png      1200×630   link previews (WhatsApp, Facebook, X)
//   /share/<chart>/square.png  1080×1080  Instagram / Facebook posts
//   /share/<chart>/story.png   1080×1920  Stories and WhatsApp Status
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import chart from "@/data/chart.json";
import { SITE_URL } from "../../../site";
// Team-uploaded covers are site-relative (/cover/…); the image renderer needs absolute URLs
const absolute = (u: string) => (u.startsWith("/") ? SITE_URL + u : u);
// Brand theme: very dark green background, light green accents (same as the site)
const LIGHT = "#A6E3B3";

export const dynamic = "force-static";

type E = { rank: number; title: string; artist: string; movement: string; delta: number | null; artworkSmall?: string | null };
const SIZES = { "og.png": [1200, 630], "square.png": [1080, 1080], "story.png": [1080, 1920] } as const;
type Size = keyof typeof SIZES;

const genres = chart.genres as { slug: string; en: string; entries: E[] }[];
const CHARTS: Record<string, { title: string; label: string; entries: E[] }> = {
  "top-50": { title: "Top 50", label: "CAMEROON", entries: chart.entries as E[] },
  "top-20": { title: "Top 20", label: "CAMEROON", entries: (chart.entries as E[]).slice(0, 20) },
  ...Object.fromEntries(genres.filter((g) => g.entries.length).map((g) => [g.slug, { title: g.en.replace(" & Afropop", "").replace(" & Dancehall", ""), label: "TOP 20", entries: g.entries }])),
};

export function generateStaticParams() {
  return Object.keys(CHARTS).flatMap((c) => (Object.keys(SIZES) as Size[]).map((size) => ({ chart: c, size })));
}

// White logo as an inline image (class-based fill → plain fill, which the renderer understands)
const LOGO = "data:image/svg+xml;base64," + Buffer.from(
  readFileSync(path.join(process.cwd(), "public/brand/logo-white.svg"), "utf8").replace(/<defs>[\s\S]*?<\/defs>/, "").replace(/class="cls-1"/g, 'fill="#fff"'),
).toString("base64");

// Open Sans (static files); if the download fails the build still works with the built-in font
const fontFile = (w: number) => fetch(`https://cdn.jsdelivr.net/fontsource/fonts/open-sans@5.0.28/latin-${w}-normal.woff`).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
const fontsP = Promise.all([fontFile(400), fontFile(700), fontFile(800)]);

// Same date as the chart pages: the first day of the chart week
const week = new Date(new Date(chart.weekEnd + "T00:00:00Z").getTime() - 6 * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const move = (e: E) => (e.movement === "new" ? "NEW" : e.movement === "re" ? "RE" : !e.delta ? "=" : e.delta > 0 ? `▲${e.delta}` : `▼${-e.delta}`);
const moveColor = (e: E) => (e.movement === "new" ? "#A6E3B3" : !e.delta ? "rgba(255,255,255,.6)" : e.delta > 0 ? LIGHT : "#FF8A8A");

function Row({ e, s }: { e: E; s: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 * s, padding: `${8 * s}px ${14 * s}px`, borderRadius: 16 * s, background: "rgba(166,227,179,.08)", border: "1px solid rgba(166,227,179,.16)" }}>
      <div style={{ width: 52 * s, fontSize: 34 * s, fontWeight: 800, color: "#fff", display: "flex", justifyContent: "center" }}>{e.rank}</div>
      {e.artworkSmall
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={absolute(e.artworkSmall)} width={64 * s} height={64 * s} style={{ borderRadius: 10 * s, objectFit: "cover" }} alt="" />
        : <div style={{ width: 64 * s, height: 64 * s, borderRadius: 10 * s, background: "rgba(255,255,255,.15)", display: "flex" }} />}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 28 * s, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title.replace(/\s*[([](feat|ft)\.?[^)\]]*[)\]]/gi, "")}</div>
        <div style={{ fontSize: 22 * s, color: "rgba(255,255,255,.78)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.artist}</div>
      </div>
      <div style={{ fontSize: 22 * s, fontWeight: 800, color: moveColor(e), display: "flex" }}>{move(e)}</div>
    </div>
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ chart: string; size: string }> }) {
  const { chart: slug, size } = await params;
  const c = CHARTS[slug] ?? CHARTS["top-50"];
  const [W, H] = SIZES[(size in SIZES ? size : "og.png") as Size];
  const bg = "radial-gradient(90% 60% at 85% 0%, rgba(166,227,179,.22) 0%, rgba(166,227,179,0) 70%), linear-gradient(165deg, #0E2D1B 0%, #062012 45%, #03100A 100%)";
  const og = size === "og.png";
  const story = size === "story.png";
  const n = og ? 5 : 10;
  const square = size === "square.png";
  const s = og ? 0.78 : story ? 1.25 : 0.7;
  const [f400, f700, f800] = await fontsP;
  const fonts = [[f400, 400], [f700, 700], [f800, 800]].filter(([d]) => d).map(([d, w]) => ({ name: "Open Sans", data: d as ArrayBuffer, weight: w as 400 | 700 | 800, style: "normal" as const }));

  const header = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 * s }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} height={og ? 64 : square ? 70 : 90 * s} width={(og ? 64 : square ? 70 : 90 * s) * 724 / 774} alt="" />
      <div style={{ fontSize: og ? 66 : square ? 76 : 120, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: -2 }}>{c.title}</div>
      <div style={{ fontSize: 24 * s, fontWeight: 700, letterSpacing: 6 * s, color: LIGHT }}>{c.label}</div>
      <div style={{ fontSize: 24 * s, color: "rgba(255,255,255,.85)", display: "flex" }}>{`Week of ${week}${chart.preview ? " · preview" : ""}`}</div>
    </div>
  );
  const footer = <div style={{ fontSize: 24 * s, fontWeight: 700, color: LIGHT, display: "flex" }}>237charts.pages.dev</div>;

  return new ImageResponse(
    og ? (
      <div style={{ width: W, height: H, display: "flex", background: bg, padding: 48, gap: 40, fontFamily: "Open Sans" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 380 }}>{header}{footer}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>{c.entries.slice(0, n).map((e) => <Row key={e.rank} e={e} s={s} />)}</div>
      </div>
    ) : (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: bg, padding: story ? 90 : 52, gap: story ? 48 : 16, fontFamily: "Open Sans" }}>
        {header}
        <div style={{ display: "flex", flexDirection: "column", gap: story ? 16 : 6, flex: 1, justifyContent: story ? "center" : "flex-start" }}>{c.entries.slice(0, n).map((e) => <Row key={e.rank} e={e} s={story ? 1.05 : 0.72} />)}</div>
        {footer}
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
}
