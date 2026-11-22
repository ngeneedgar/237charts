"use client";
import { useCallback, useEffect, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { api, appendRow, canEdit, parseCsv, type FileData } from "../lib";
import { reviewQueue, type Candidate } from "./queue";

const ELIG = "admin/eligibility.csv";
const SOURCE_LABEL: Record<string, string> = { "shazam-cm": "Shazam Cameroon", collab: "Featured with a charting artist", youtube: "YouTube", deezer: "Deezer", wikidata: "Wikidata" };

function Review() {
  const me = useMe();
  const [file, setFile] = useState<FileData | null>(null);
  const [queue, setQueue] = useState<Candidate[] | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState(0);
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string; link?: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([api.json<Candidate[]>("collector/out/candidate-review.json"), api.file(ELIG)]);
      setFile(f);
      setQueue(reviewQueue(c ?? [], parseCsv(f.content).rows));
    } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = (queue ?? []).filter((c) => !skipped.has(c.name));
  const cur = visible[Math.min(sel, visible.length - 1)];
  const editable = canEdit(me) && !!me?.canWrite;

  async function decide(answer: "yes" | "no") {
    if (!cur || !file || !source.trim()) return;
    setSaving(true);
    try {
      let text = file.content;
      if (!/^name,cameroonian,source/.test(text)) text = text.replace(/^name,cameroonian[^\n]*/, "name,cameroonian,source");
      const reason = `${cur.name}: ${answer === "yes" ? "Cameroonian" : "not eligible"} (${source.trim()})`;
      const r = await api.save(ELIG, appendRow(text, [cur.name, answer, source.trim()]), file.sha, reason);
      setToast({ kind: "ok", text: r.dry ? `Test mode — would commit: “${r.message?.split("\n")[0]}”` : `Saved: ${cur.name} → ${answer === "yes" ? "Cameroonian" : "not eligible"}. Applies on the next run.`, link: r.commit });
      setSource("");
      if (r.dry) { setQueue((q) => (q ?? []).filter((c) => c.name !== cur.name)); }
      else await load();
    } catch (e) {
      setToast({ kind: "bad", text: (e as Error).message });
      if ((e as { status?: number }).status === 409) await load();
    }
    setSaving(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "s" || e.key === "S") { if (cur) setSkipped((s) => new Set(s).add(cur.name)); }
      if (e.key === "ArrowDown" || e.key === "j") setSel((i) => Math.min(i + 1, visible.length - 1));
      if (e.key === "ArrowUp" || e.key === "k") setSel((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, visible.length]);

  if (err) return <div className="content"><div className="notice bad">Couldn&apos;t load the review queue: {err}</div></div>;
  if (!queue) return <div className="content"><div className="skeleton" style={{ height: 300 }} /></div>;
  if (visible.length === 0) {
    return (
      <div className="content">
        <h1>Review queue</h1>
        <div className="card" style={{ marginTop: 20 }}><h2>All caught up</h2><p className="muted">No new names are waiting. New candidates appear after each weekly run.{skipped.size ? ` (${skipped.size} skipped for now — reload to see them again.)` : ""}</p></div>
      </div>
    );
  }

  const q = encodeURIComponent(`${cur.name} musician nationality`);
  return (
    <div className="queue">
      <div className="queue-list">
        <div style={{ padding: "8px 14px 12px" }}>
          <h1 style={{ fontSize: 20 }}>Review queue</h1>
          <div className="muted" style={{ fontSize: 13 }}>{visible.length} names waiting · keys: ↑↓ move · S skip</div>
        </div>
        {visible.map((c, i) => (
          <button key={c.name} className={`qi${c === cur ? " on" : ""}`} onClick={() => { setSel(i); setSource(""); }}>
            <strong>{c.name}</strong>
            <small>{c.songs?.length ? `${c.songs.length} song${c.songs.length > 1 ? "s" : ""}` : "feature"}{c.bestRank ? ` · best #${c.bestRank} Shazam CM` : ""}</small>
          </button>
        ))}
      </div>

      <div className="content stack" style={{ alignContent: "start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="avatar" style={{ width: 52, height: 52, borderRadius: 14, fontSize: 20 }}>{cur.name[0]}</span>
            <div><div className="lbl">Candidate {visible.indexOf(cur) + 1} of {visible.length}</div><h1>{cur.name}</h1></div>
          </div>
          <span className="pill warn">Nationality unknown</span>
        </div>

        <div className="grid2">
          <section className="card">
            <h2>Songs & chart ranks</h2>
            {cur.songs?.length ? cur.songs.map((s) => <div className="fact" key={s}><span>{s.replace(/\s*\(#\d+\)$/, "")}</span><span className="muted">{s.match(/\(#(\d+)\)$/)?.[0] ?? ""}</span></div>)
              : <p className="muted">No songs of their own on the charts yet.</p>}
            {cur.collaborators?.length ? <p style={{ fontSize: 14 }}>Featured with: {cur.collaborators.join(", ")}</p> : null}
            <div className="lbl" style={{ marginTop: 14 }}>Found through</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{cur.sources.map((s) => <span className="chip" key={s}>{SOURCE_LABEL[s] ?? s}</span>)}</div>
          </section>
          <section className="card">
            <h2>What the data says</h2>
            {(cur.reasons ?? []).map((r) => <div className="fact" key={r}><span>{r}</span></div>)}
            <div className="fact"><span>MusicBrainz</span><span>{cur.musicbrainz ? <a href={`https://musicbrainz.org/artist/${cur.musicbrainz}`} target="_blank" rel="noopener">Open ↗</a> : <span className="muted">No entry</span>}</span></div>
            <div className="fact"><span>YouTube channel</span><span className="muted">{cur.youtube?.length ? `${cur.youtube.length} found` : "None matched yet"}</span></div>
            <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 14, fontWeight: 600 }}>
              <a href={`https://www.google.com/search?q=${q}`} target="_blank" rel="noopener">Search the web ↗</a>
              <a href={`https://www.wikidata.org/w/index.php?search=${encodeURIComponent(cur.name)}`} target="_blank" rel="noopener">Wikidata ↗</a>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(cur.name)}`} target="_blank" rel="noopener">YouTube ↗</a>
            </div>
          </section>
        </div>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Your decision</h2>
          <label className="f">Source (link or note) — required
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. https://… interview, born in Douala" disabled={!editable} />
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn pri" disabled={!editable || saving || !source.trim()} onClick={() => decide("yes")}>Cameroonian</button>
            <button className="btn neg" disabled={!editable || saving || !source.trim()} onClick={() => decide("no")}>Not eligible</button>
            <button className="btn" onClick={() => setSkipped((s) => new Set(s).add(cur.name))}>Skip for now</button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {editable ? <>Saved to <code>admin/eligibility.csv</code> as a commit with your name. </> : <>You can look but not decide (your role: {me?.role ?? "…"}). </>}
            Cameroonian nationals only: if the data shows another citizenship too, the hard rule excludes the artist whatever is chosen here.
          </p>
        </section>
      </div>
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Review"><Review /></Shell>;
}
