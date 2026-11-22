"use client";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "../shell";
import { api } from "../lib";
import { GENRES, genreLabel } from "../roster";
import { GenreDot } from "../ui";
import { Icon } from "../icons";

type Entry = { rank: number; title: string; artist: string; genre: string | null; movement: string; delta: number | null; lastWeek: number | null; peak: number; adjusted: boolean; artworkSmall?: string | null; youtube?: string; deezer?: string; slug: string };
type Chart = { weekEnd: string; preview: boolean; generatedAt: string; entries: Entry[]; genres: { slug: string; en: string; entries: Entry[] }[] };
type Scores = { entries: { rank: number; score: number; versions: number }[] };

function flags(e: Entry): string[] {
  const f: string[] = [];
  if (e.adjusted) f.push("Capped for irregular activity");
  if (!e.artworkSmall) f.push("No artwork");
  const core = e.title.replace(/\s*[([](feat|ft)\.?[^)\]]*[)\]]/gi, "");
  if (core.length > 40 || /official|video|clip|lyrics|\bby\b/i.test(core)) f.push("Messy title");
  if (/\b(beat|instrumental|karaok)/i.test(e.title)) f.push("Maybe instrumental");
  return f;
}

function Move({ e }: { e: Entry }) {
  if (e.movement === "new") return <span className="ok-text" style={{ fontSize: 12 }}>NEW</span>;
  if (e.movement === "re") return <span className="warn-text" style={{ fontSize: 12 }}>RE</span>;
  if (!e.delta) return <span className="muted">=</span>;
  return e.delta > 0 ? <span className="ok-text">▲{e.delta}</span> : <span className="bad-text">▼{-e.delta}</span>;
}

function Charts() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [scores, setScores] = useState<Map<number, number>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState("top50");
  const [onlyFlags, setOnlyFlags] = useState(false);

  useEffect(() => {
    api.json<Chart>("web/data/chart.json").then(setChart).catch((e) => setErr(e.message));
    api.json<Scores>("collector/out/chart-preview.json").then((s) => setScores(new Map(s.entries.map((x) => [x.rank, x.score])))).catch(() => {});
  }, []);

  const list = useMemo(() => {
    if (!chart) return [];
    const base = tab === "top50" ? chart.entries : tab === "top20" ? chart.entries.slice(0, 20) : chart.genres.find((g) => g.slug === tab)?.entries ?? [];
    return onlyFlags ? base.filter((e) => flags(e).length) : base;
  }, [chart, tab, onlyFlags]);
  const allFlags = useMemo(() => (chart?.entries ?? []).flatMap((e) => flags(e).map((f) => ({ e, f }))), [chart]);
  const top = scores.get(1) ?? 0;

  return (
    <div className="content stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">{chart ? `${chart.preview ? "Preview · test data" : "Published"} · week ending ${chart.weekEnd}` : "Loading…"}</div>
          <h1>Charts</h1>
        </div>
        <a className="btn" href="/en/top-50/" target="_blank" rel="noopener"><Icon name="external" />Open on the site</a>
      </div>
      {err && <div className="notice bad">Couldn&apos;t load the chart: {err}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[["top50", "Top 50"], ["top20", "Top 20"], ...GENRES.map((g) => [g.slug, g.label])].map(([k, l]) => (
          <button key={k} className={`chip-btn${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", fontSize: 14 }}>
          <input type="checkbox" checked={onlyFlags} onChange={(e) => setOnlyFlags(e.target.checked)} style={{ width: "auto" }} /> Only songs to check
        </label>
      </div>

      <div className="chart-grid">
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          {!chart ? <div className="skeleton" style={{ height: 400, margin: 20 }} /> : (
            <table className="t">
              <thead><tr><th style={{ width: 50 }}>#</th><th>Song</th><th>Genre</th><th>Move</th><th>Score</th><th>Check</th></tr></thead>
              <tbody>
                {list.map((e) => {
                  const g = GENRES.find((x) => x.slug === e.genre);
                  const s = tab === "top50" || tab === "top20" ? scores.get(e.rank) : undefined;
                  const fl = flags(e);
                  return (
                    <tr key={e.slug + e.rank} style={fl.length ? { background: "var(--warn-bg)" } : undefined}>
                      <td style={{ fontSize: 18, fontWeight: 300 }}>{e.rank}</td>
                      <td>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {e.artworkSmall ? <img src={e.artworkSmall} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} /> : <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--fill)", display: "inline-block" }} />}
                          <span><a href={`/en/song/${e.slug}/`} target="_blank" rel="noopener" style={{ fontWeight: 500, textDecoration: "none" }}>{e.title}</a><br /><span className="muted" style={{ fontSize: 13 }}>{e.artist}</span></span>
                        </div>
                      </td>
                      <td><span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>{g && <GenreDot color={g.color} />}{genreLabel(e.genre)}</span></td>
                      <td><Move e={e} /></td>
                      <td style={{ minWidth: 120 }}>{s ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="bar"><i style={{ width: `${Math.max(4, (s / top) * 100)}%` }} /></span><span className="muted" style={{ fontSize: 13 }}>{Math.round(s)}</span></div> : <span className="muted">—</span>}</td>
                      <td>{fl.map((f) => <span key={f} className="pill warn" style={{ marginRight: 4, display: "inline-block", marginBottom: 2 }}>{f}</span>)}</td>
                    </tr>
                  );
                })}
                {chart && list.length === 0 && <tr><td colSpan={6} className="muted">Nothing here this week.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <aside className="card" style={{ alignSelf: "start" }}>
          <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>Flags to check <span className="cnt">{allFlags.length}</span></h2>
          {allFlags.length === 0 ? <p className="muted">Nothing unusual in the Top 50.</p> : allFlags.slice(0, 12).map(({ e, f }) => (
            <div className="row" key={e.slug + f} style={{ display: "block" }}>
              <div><strong>#{e.rank} {e.title}</strong></div>
              <div className="muted" style={{ fontSize: 13 }}>{f} · {e.artist}</div>
            </div>
          ))}
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Fixing songs (titles, merges, hiding uploads) comes with the Songs screen.</p>
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  return <Shell active="Charts"><Charts /></Shell>;
}
