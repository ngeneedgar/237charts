"use client";
import { useEffect, useState } from "react";
import { api, csvLine, parseCsv, type FileData } from "../lib";
import { genreLabel } from "../roster";
import { ReasonDialog } from "../ui";
import { Icon } from "../icons";

const FILE = "admin/chart-overrides.csv";
type P = { songId: string; rank: number; title: string; artist: string };
type Preview = { entries: P[]; genreCharts: Record<string, P[]> };

/** Edit a chart's order by hand. Saves the moved songs' positions to admin/chart-overrides.csv;
 *  the next run applies them (movement/peak recomputed) and the change is public in the corrections log. */
export function EditOrder({ chart, onClose, onSaved }: { chart: string; onClose: () => void; onSaved: (msg: string, link?: string) => void }) {
  const [list, setList] = useState<P[] | null>(null);
  const [orig, setOrig] = useState<string[]>([]);
  const [file, setFile] = useState<FileData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ask, setAsk] = useState<"save" | "clear" | null>(null);
  // Only songs the team actually moved get pinned; songs that merely shift around them keep following the data
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([api.json<Preview>("collector/out/chart-preview.json"), api.file(FILE)]).then(([p, f]) => {
      const l = chart === "top-50" ? p.entries : p.genreCharts?.[chart] ?? [];
      setList(l); setOrig(l.map((e) => e.songId)); setFile(f);
    }).catch((e) => setErr(e.message));
  }, [chart]);

  const move = (i: number, d: number) => setList((l) => {
    if (!l) return l;
    setTouched((t) => new Set(t).add(l[i].songId)); const j = i + d; if (j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const moved = (list ?? []).map((e, i) => ({ e, from: orig.indexOf(e.songId) + 1, to: i + 1 })).filter((x) => x.from !== x.to && touched.has(x.e.songId));
  const existing = parseCsv(file?.content ?? "").rows.filter((r) => r[0] === chart);
  const name = chart === "top-50" ? "Top 50" : genreLabel(chart);

  async function save(reason: string, clear: boolean) {
    if (!file) return;
    const keep = parseCsv(file.content).rows.filter((r) => r[0] !== chart || (!clear && !moved.some((m) => m.e.songId === r[1])));
    const add = clear ? [] : moved.map((m) => [chart, m.e.songId, String(m.to), reason]);
    const text = ["chart,songId,rank,reason", ...[...keep, ...add].map(csvLine)].join("\n") + "\n";
    const what = clear ? `${name}: manual positions removed` : `${name}: ${moved.map((m) => `${m.e.title} #${m.from}→#${m.to}`).join(", ")}`;
    try {
      const r = await api.save(FILE, text, file.sha, `${what} (${reason})`);
      onSaved(r.dry ? `Test mode — would commit: “${r.message?.split("\n")[0]}”` : `Saved. ${what}. Live after the next run (press Re-run now on Overview to apply now).`, r.commit);
      onClose();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <section className="card stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Edit order · {name}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {existing.length > 0 && <button className="btn neg" onClick={() => setAsk("clear")}>Remove {existing.length} manual position{existing.length > 1 ? "s" : ""}</button>}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={!moved.length} onClick={() => setAsk("save")}><Icon name="check" />Save {moved.length || ""} change{moved.length === 1 ? "" : "s"}</button>
        </div>
      </div>
      <div className="notice warn">Manual positions override the listening data. Use them only to correct a clear error; each one is published in the corrections log with your reason.</div>
      {err && <div className="notice bad">{err}</div>}
      {!list ? <div className="skeleton" style={{ height: 300 }} /> : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {list.map((e, i) => {
            const from = orig.indexOf(e.songId) + 1;
            return (
              <li key={e.songId} className="row" style={{ background: from !== i + 1 && touched.has(e.songId) ? "var(--warn-bg)" : undefined, borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                  <span style={{ width: 28, fontSize: 18, fontWeight: 300 }}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}><strong>{e.title}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{e.artist}{from !== i + 1 ? ` · was #${from}` : ""}</span></span>
                </span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button className="btn" style={{ minHeight: 34, padding: "4px 10px" }} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${e.title} up`}>▲</button>
                  <button className="btn" style={{ minHeight: 34, padding: "4px 10px" }} disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${e.title} down`}>▼</button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <ReasonDialog open={!!ask} title={ask === "clear" ? `Remove manual positions · ${name}` : `Save new order · ${name}`} danger={ask === "clear"}
        body={ask === "clear" ? "The chart goes back to the pure listening-data order at the next run." : <>{moved.map((m) => <div key={m.e.songId}>{m.e.title}: #{m.from} → #{m.to}</div>)}</>}
        confirm={ask === "clear" ? "Remove" : "Save"} onCancel={() => setAsk(null)} onConfirm={(r) => save(r, ask === "clear")} />
    </section>
  );
}
