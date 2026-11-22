"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { api, appendRow, canEdit, fold, parseCsv, type FileData } from "../lib";
import { GENRES, genreLabel } from "../roster";
import { GenreDot, ReasonDialog } from "../ui";
import { Icon } from "../icons";

const FIXES = "admin/song-fixes.csv";
type Song = { songId: string; rank: number | null; title: string; artist: string; genre: string | null; score: number; versions: number; adjusted: boolean; where: string[] };
type Action = "title" | "genre" | "date" | "hide" | "merge";
type Pending = { song: Song; action: Action } | null;
type Preview = { entries: (Omit<Song, "where" | "rank"> & { rank: number })[]; genreCharts: Record<string, (Omit<Song, "where" | "rank"> & { rank: number })[]> };

const ACTION_LABEL: Record<Action, string> = { title: "Fix title", genre: "Change genre", date: "Set release date", hide: "Hide (not a song)", merge: "Merge into another song" };

function issues(s: Song): string[] {
  const f: string[] = [];
  const core = s.title.replace(/\s*[([](feat|ft)\.?[^)\]]*[)\]]/gi, "");
  if (core.length > 40 || /official|video|clip|lyrics|\bby\b/i.test(core)) f.push("Messy title");
  if (/\b(beat|instrumental|karaok)/i.test(s.title)) f.push("Maybe instrumental");
  if (/\b(interview|teaser|trailer|behind the scenes|making of|live)\b/i.test(s.title)) f.push("Maybe not a song");
  if (s.adjusted) f.push("Capped");
  return f;
}

function Songs() {
  const me = useMe();
  const editable = canEdit(me) && !!me?.canWrite;
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [fixes, setFixes] = useState<FileData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "flagged" | "dupes">("all");
  const [pending, setPending] = useState<Pending>(null);
  const [value, setValue] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string; link?: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, f] = await Promise.all([api.json<Preview>("collector/out/chart-preview.json"), api.file(FIXES)]);
      const map = new Map<string, Song>();
      const add = (e: Preview["entries"][number], where: string, top: boolean) => {
        const s = map.get(e.songId) ?? { ...e, rank: null, where: [] };
        if (top) s.rank = e.rank;
        s.where.push(where);
        map.set(e.songId, s);
      };
      p.entries.forEach((e) => add(e, `Top 50 #${e.rank}`, true));
      for (const [g, list] of Object.entries(p.genreCharts ?? {})) list.forEach((e) => add(e, `${genreLabel(g)} #${e.rank}`, false));
      setSongs([...map.values()].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || b.score - a.score));
      setFixes(f);
    } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const fixRows = useMemo(() => parseCsv(fixes?.content ?? "").rows, [fixes]);
  const dupeKeys = useMemo(() => {
    const seen = new Map<string, number>();
    for (const s of songs ?? []) { const k = fold(s.artist) + "|" + fold(s.title).replace(/\b(lyrics?|audio|video|clip|officiel|official|remix|version)\b/g, "").trim(); seen.set(k, (seen.get(k) ?? 0) + 1); }
    return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  }, [songs]);
  const isDupe = (s: Song) => dupeKeys.has(fold(s.artist) + "|" + fold(s.title).replace(/\b(lyrics?|audio|video|clip|officiel|official|remix|version)\b/g, "").trim());

  const shown = (songs ?? []).filter((s) =>
    (!q || fold(s.title).includes(fold(q)) || fold(s.artist).includes(fold(q))) &&
    (view === "all" || (view === "flagged" && issues(s).length > 0) || (view === "dupes" && isDupe(s))));

  function open(song: Song, action: Action) {
    setValue(action === "title" ? song.title : action === "genre" ? song.genre ?? "" : "");
    setPending({ song, action });
  }

  async function confirm(reason: string) {
    if (!pending || !fixes) return;
    const { song, action } = pending;
    const v = action === "hide" ? "" : value.trim();
    const what = action === "title" ? `title → “${v}”` : action === "genre" ? `genre → ${genreLabel(v)}` : action === "date" ? `release date → ${v}`
      : action === "hide" ? "hidden (not a song)" : `merged into ${songs?.find((s) => s.songId === v)?.title ?? v}`;
    try {
      const r = await api.save(FIXES, appendRow(fixes.content, [song.songId, action, v, reason]), fixes.sha, `${song.artist} – ${song.title}: ${what} (${reason})`);
      setToast({ kind: "ok", text: r.dry ? `Test mode — would commit: “${r.message?.split("\n")[0]}”` : `Saved: ${song.title} ${what}. Applies on the next run.`, link: r.commit });
      setPending(null);
      if (!r.dry) await load();
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
  }

  async function undo(row: string[], reason: string) {
    if (!fixes) return;
    const lines = fixes.content.replace(/\r\n/g, "\n").split("\n");
    const i = lines.findIndex((l, n) => n > 0 && l.startsWith(row[0]) && l.includes(`,${row[1]},`));
    if (i < 1) return;
    lines.splice(i, 1);
    try {
      const r = await api.save(FIXES, lines.join("\n"), fixes.sha, `Undo ${row[1]} fix on ${row[0]} (${reason})`);
      setToast({ kind: "ok", text: r.dry ? "Test mode — undo would be committed." : "Fix removed. Applies on the next run.", link: r.commit });
      if (!r.dry) await load();
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
  }
  const [undoRow, setUndoRow] = useState<string[] | null>(null);

  const valid = !pending ? false : pending.action === "hide" ? true : pending.action === "date" ? /^\d{4}-\d{2}-\d{2}$/.test(value) : pending.action === "genre" ? !!value : value.trim().length > 0 && value.trim() !== pending.song.title;
  const nameOf = (id: string) => songs?.find((s) => s.songId === id);

  return (
    <div className="content stack">
      <div>
        <h1>Songs</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Every song on this week&apos;s charts. Fixes are saved to <code>admin/song-fixes.csv</code> and applied on the next run.</p>
      </div>
      {err && <div className="notice bad">Couldn&apos;t load the songs: {err}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }}><Icon name="search" /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search song or artist…" style={{ paddingLeft: 40 }} aria-label="Search songs" />
        </div>
        {([["all", "All"], ["flagged", "To check"], ["dupes", "Possible duplicates"]] as const).map(([k, l]) => (
          <button key={k} className={`chip-btn${view === k ? " on" : ""}`} onClick={() => setView(k)}>{l} <span className="muted">{songs ? (k === "all" ? songs.length : k === "flagged" ? songs.filter((s) => issues(s).length).length : songs.filter(isDupe).length) : ""}</span></button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {!songs ? <div className="skeleton" style={{ height: 320, margin: 20 }} /> : (
          <table className="t">
            <thead><tr><th>Song</th><th>Charts</th><th>Genre</th><th>Versions</th><th>Check</th><th /></tr></thead>
            <tbody>
              {shown.map((s) => {
                const g = GENRES.find((x) => x.slug === s.genre);
                return (
                  <tr key={s.songId}>
                    <td><span style={{ fontWeight: 500 }}>{s.title}</span><br /><span className="muted" style={{ fontSize: 13 }}>{s.artist}</span></td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.where.join(" · ")}</td>
                    <td><span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>{g && <GenreDot color={g.color} />}{genreLabel(s.genre)}</span></td>
                    <td className="muted">{s.versions}</td>
                    <td>{[...issues(s), ...(isDupe(s) ? ["Possible duplicate"] : [])].map((f) => <span key={f} className="pill warn" style={{ marginRight: 4, display: "inline-block", marginBottom: 2 }}>{f}</span>)}</td>
                    <td style={{ textAlign: "right" }}>
                      <select value="" disabled={!editable} aria-label={`Fix ${s.title}`} onChange={(e) => e.target.value && open(s, e.target.value as Action)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="">Fix…</option>
                        {(Object.keys(ACTION_LABEL) as Action[]).map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={6} className="muted">Nothing here.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <section className="card">
        <h2>Active fixes</h2>
        {fixRows.length === 0 ? <p className="muted" style={{ margin: 0 }}>No song fixes yet.</p> : fixRows.map((r, i) => (
          <div className="row" key={i}>
            <span><strong>{nameOf(r[0])?.title ?? r[0]}</strong> <span className="muted">· {ACTION_LABEL[r[1] as Action] ?? r[1]}{r[2] ? `: ${r[1] === "merge" ? nameOf(r[2])?.title ?? r[2] : r[1] === "genre" ? genreLabel(r[2]) : r[2]}` : ""} · {r[3]}</span></span>
            <button className="btn" style={{ minHeight: 34, padding: "6px 12px", fontSize: 13 }} disabled={!editable} onClick={() => setUndoRow(r)}>Undo</button>
          </div>
        ))}
      </section>

      <ReasonDialog open={!!pending} title={pending ? ACTION_LABEL[pending.action] : ""} danger={pending?.action === "hide"}
        body={pending ? <><strong>{pending.song.title}</strong> · {pending.song.artist}</> : null}
        extra={pending && pending.action !== "hide" ? (
          pending.action === "genre" ? (
            <label className="f">Genre for this song only
              <select value={value} onChange={(e) => setValue(e.target.value)}><option value="">Pick a genre…</option>{GENRES.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}</select>
            </label>
          ) : pending.action === "merge" ? (
            <label className="f">Keep this song (its title and link stay; plays add up)
              <select value={value} onChange={(e) => setValue(e.target.value)}>
                <option value="">Pick the song to keep…</option>
                {(songs ?? []).filter((s) => s.songId !== pending.song.songId && fold(s.artist) === fold(pending.song.artist)).map((s) => <option key={s.songId} value={s.songId}>{s.title}</option>)}
                <optgroup label="Other artists">{(songs ?? []).filter((s) => s.songId !== pending.song.songId && fold(s.artist) !== fold(pending.song.artist)).map((s) => <option key={s.songId} value={s.songId}>{s.title} — {s.artist}</option>)}</optgroup>
              </select>
            </label>
          ) : pending.action === "date" ? (
            <label className="f">Release date (earliest proof the song existed)<input type="date" value={value} onChange={(e) => setValue(e.target.value)} /></label>
          ) : (
            <label className="f">Display title<input value={value} onChange={(e) => setValue(e.target.value)} /></label>
          )
        ) : null}
        confirm="Save fix" onCancel={() => setPending(null)} onConfirm={(r) => (valid ? confirm(r) : undefined)} />
      <ReasonDialog open={!!undoRow} title="Undo fix" body={undoRow ? <>Remove the {undoRow[1]} fix on <strong>{nameOf(undoRow[0])?.title ?? undoRow[0]}</strong>.</> : null}
        confirm="Undo" onCancel={() => setUndoRow(null)} onConfirm={async (r) => { if (undoRow) await undo(undoRow, r); setUndoRow(null); }} />
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Songs"><Songs /></Shell>;
}
