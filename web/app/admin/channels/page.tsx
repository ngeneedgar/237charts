"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { api, appendRow, canEdit, fold, parseCsv } from "../lib";
import { loadRoster, type Artist, type RosterFiles } from "../roster";
import { ReasonDialog } from "../ui";
import { Icon } from "../icons";

/** Accepts a channel ID (UC…) or a youtube.com/channel/UC… link. @handles need the ID (YouTube → About → Share → Copy channel ID). */
function channelIdFrom(input: string): string | null {
  const s = input.trim();
  const m = s.match(/(UC[\w-]{22})/);
  return m ? m[1] : null;
}

type Pending = { artist: Artist; channelId: string; title?: string } | null;

function Channels() {
  const me = useMe();
  const editable = canEdit(me) && !!me?.canWrite;
  const [data, setData] = useState<{ artists: Artist[]; files: RosterFiles } | null>(null);
  const [labels, setLabels] = useState<string[][] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"suggested" | "none">("suggested");
  const [q, setQ] = useState("");
  const [paste, setPaste] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Pending>(null);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string; link?: string } | null>(null);

  const load = useCallback(() => {
    loadRoster().then(setData).catch((e) => setErr(e.message));
    api.file("admin/labels.csv").then((f) => setLabels(parseCsv(f.content).rows)).catch(() => setLabels([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const suggested = useMemo(() => (data?.artists ?? []).filter((a) => a.channelStatus === "suggested" && !rejected.has(a.id)), [data, rejected]);
  const none = useMemo(() => (data?.artists ?? []).filter((a) => a.channelStatus === "none" || rejected.has(a.id)).filter((a) => !q || fold(a.name).includes(fold(q))), [data, rejected, q]);

  async function confirm(reason: string) {
    if (!data || !pending) return;
    const f = data.files.channels;
    try {
      const r = await api.save("admin/channels.csv", appendRow(f.content, [pending.artist.name, pending.channelId, reason]), f.sha,
        `Channel for ${pending.artist.name}: ${pending.channelId} (${reason})`);
      setToast({ kind: "ok", text: r.dry ? `Test mode — would commit: “${r.message?.split("\n")[0]}”` : `Channel saved for ${pending.artist.name}. Their videos count from the next run.`, link: r.commit });
      setPending(null);
      if (!r.dry) load(); else setData((d) => d && { ...d, artists: d.artists.map((a) => a.id === pending.artist.id ? { ...a, channelStatus: "official", channels: [pending.channelId] } : a) });
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
  }

  function PasteBox({ a }: { a: Artist }) {
    const v = paste[a.id] ?? "";
    const id = channelIdFrom(v);
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 340 }}>
        <input value={v} onChange={(e) => setPaste((p) => ({ ...p, [a.id]: e.target.value }))} placeholder="Paste channel link or ID (UC…)" aria-label={`Channel for ${a.name}`} disabled={!editable} />
        <button className="btn" disabled={!editable || !id} onClick={() => id && setPending({ artist: a, channelId: id })}>Use</button>
      </div>
    );
  }

  return (
    <div className="content stack">
      <div>
        <h1>Channels &amp; labels</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Only official channels count. Saving writes <code>admin/channels.csv</code>.</p>
      </div>
      {err && <div className="notice bad">Couldn&apos;t load: {err}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className={`chip-btn${tab === "suggested" ? " on" : ""}`} onClick={() => setTab("suggested")}>Suggestions to check <span className="muted">{data ? suggested.length : ""}</span></button>
        <button className={`chip-btn${tab === "none" ? " on" : ""}`} onClick={() => setTab("none")}>No channel yet <span className="muted">{data ? none.length : ""}</span></button>
      </div>

      {!data ? <div className="skeleton" style={{ height: 300 }} /> : tab === "suggested" ? (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="t">
            <thead><tr><th>Artist</th><th>Suggested channel</th><th>Subscribers</th><th>Confidence</th><th /></tr></thead>
            <tbody>
              {suggested.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td><a href={`https://www.youtube.com/channel/${a.suggestion!.channelId}`} target="_blank" rel="noopener">{a.suggestion!.title} ↗</a></td>
                  <td className="muted">{a.suggestion!.subscribers?.toLocaleString("en") ?? "—"}</td>
                  <td><span className={`pill ${a.suggestion!.confidence >= 0.7 ? "ok" : "warn"}`}>{a.suggestion!.confidence >= 0.8 ? "High" : a.suggestion!.confidence >= 0.6 ? "Medium" : "Low"}</span></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn" style={{ minHeight: 36 }} onClick={() => setRejected((s) => new Set(s).add(a.id))}><Icon name="x" />Not theirs</button>{" "}
                    <button className="btn pri" style={{ minHeight: 36 }} disabled={!editable} onClick={() => setPending({ artist: a, channelId: a.suggestion!.channelId, title: a.suggestion!.title })}><Icon name="check" />Accept</button>
                  </td>
                </tr>
              ))}
              {suggested.length === 0 && <tr><td colSpan={5} className="muted">No suggestions waiting.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div style={{ position: "relative", maxWidth: 420 }}>
            <span style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }}><Icon name="search" /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists…" style={{ paddingLeft: 40 }} aria-label="Search artists without channel" />
          </div>
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="t">
              <thead><tr><th>Artist</th><th>Find it</th><th>Official channel</th></tr></thead>
              <tbody>
                {none.slice(0, 150).map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(a.name + " official")}&sp=EgIQAg%253D%253D`} target="_blank" rel="noopener">Search YouTube ↗</a></td>
                    <td><PasteBox a={a} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Tip: on the channel page, <strong>About → Share channel → Copy channel ID</strong>. Links with @handles don&apos;t contain the ID.</p>
        </>
      )}

      <section className="card">
        <h2>Label channels</h2>
        <p className="muted" style={{ marginTop: -6 }}>Videos on these channels count for the artist named in the title. Edit <code>admin/labels.csv</code> to add one.</p>
        {!labels ? <div className="skeleton" style={{ height: 60 }} /> : labels.length === 0 ? <p className="muted">None yet.</p> : labels.map(([id, label, source]) => (
          <div className="row" key={id}><span><strong>{label}</strong> <span className="muted">· {source}</span></span><a href={`https://www.youtube.com/channel/${id}`} target="_blank" rel="noopener">Open ↗</a></div>
        ))}
      </section>

      <ReasonDialog open={!!pending} title="Save official channel"
        body={pending ? <>Count <strong>{pending.title ?? pending.channelId}</strong> as the official channel of <strong>{pending.artist.name}</strong>. Check it is really theirs first.</> : null}
        confirm="Save channel" onCancel={() => setPending(null)} onConfirm={confirm} />
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Channels"><Channels /></Shell>;
}
