"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { api, canEdit, csvLine, appendRow, fold } from "../lib";
import { GENRES, genreLabel, loadRoster, upsertRow, type Artist, type RosterFiles } from "../roster";
import { GenreDot, ReasonDialog } from "../ui";
import { Icon } from "../icons";

type Filter = "all" | "nochannel" | "nogenre" | "added";
type Pending = { kind: "genre"; artist: Artist; genre: string } | { kind: "remove"; artist: Artist } | { kind: "add" } | null;

function Artists() {
  const me = useMe();
  const editable = canEdit(me) && !!me?.canWrite;
  const [data, setData] = useState<{ artists: Artist[]; files: RosterFiles } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [genre, setGenre] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string; link?: string } | null>(null);

  const load = useCallback(() => loadRoster().then(setData).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (data?.artists ?? []).filter((a) =>
    (!q || [a.name, ...a.aliases].some((n) => fold(n).includes(fold(q)))) &&
    (filter === "all" || (filter === "nochannel" && a.channelStatus !== "official") || (filter === "nogenre" && !a.genre) || (filter === "added" && a.via !== "wikidata")) &&
    (!genre || a.genre === genre)), [data, q, filter, genre]);

  const counts = useMemo(() => {
    const a = data?.artists ?? [];
    return { all: a.length, nochannel: a.filter((x) => x.channelStatus !== "official").length, nogenre: a.filter((x) => !x.genre).length, added: a.filter((x) => x.via !== "wikidata").length };
  }, [data]);

  async function save(path: string, content: string, sha: string | null, reason: string, done: string) {
    try {
      const r = await api.save(path, content, sha, reason);
      setToast({ kind: "ok", text: r.dry ? `Test mode — would commit: “${r.message?.split("\n")[0]}”` : `${done} Live after the Monday run, or press Re-run now on Overview.`, link: r.commit });
      setPending(null);
      if (!r.dry) await load();
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
  }

  async function confirm(reason: string) {
    if (!data || !pending) return;
    const f = data.files;
    if (pending.kind === "genre") {
      const { artist, genre: g } = pending;
      await save("admin/genres.csv", upsertRow(f.genres.content, artist.name, [artist.name, g], csvLine), f.genres.sha,
        `Genre of ${artist.name} → ${genreLabel(g)} (${reason})`, `${artist.name} is now ${genreLabel(g)}.`);
    } else if (pending.kind === "remove") {
      const { artist } = pending;
      await save("admin/artists-remove.csv", appendRow(f.remove.content, [artist.name, reason]), f.remove.sha,
        `Removed ${artist.name} (${reason})`, `${artist.name} removed from the roster.`);
    } else if (pending.kind === "add") {
      const name = newName.trim();
      await save("admin/artists-add.csv", appendRow(f.add.content, [name, reason]), f.add.sha,
        `Added ${name} (${reason})`, `${name} added to the roster.`);
      setNewName("");
    }
  }

  const similar = newName.trim().length > 1 ? (data?.artists ?? []).filter((a) => [a.name, ...a.aliases].some((n) => fold(n).includes(fold(newName)) || fold(newName).includes(fold(n)))).slice(0, 4) : [];

  return (
    <div className="content stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Artists</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>{data ? `${counts.all} artists in the roster — Cameroonian nationals only.` : "Loading the roster…"}</p>
        </div>
        <button className="btn pri" disabled={!editable} onClick={() => setPending({ kind: "add" })}><Icon name="artists" />Add artist</button>
      </div>
      {err && <div className="notice bad">Couldn&apos;t load the roster: {err}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }}><Icon name="search" /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or stage name…" style={{ paddingLeft: 40 }} aria-label="Search artists" />
        </div>
        {([["all", "All"], ["nochannel", "No channel"], ["nogenre", "No genre"], ["added", "Added by team / discovered"]] as [Filter, string][]).map(([k, l]) => (
          <button key={k} className={`chip-btn${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>{l} <span className="muted">{data ? counts[k] : ""}</span></button>
        ))}
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ width: "auto" }} aria-label="Filter by genre">
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {!data ? <div className="skeleton" style={{ height: 300, margin: 20 }} /> : (
          <table className="t">
            <thead><tr><th>Artist</th><th>Also known as</th><th>Genre</th><th>Channel</th><th>Source</th><th /></tr></thead>
            <tbody>
              {shown.slice(0, 300).map((a) => {
                const g = GENRES.find((x) => x.slug === a.genre);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td className="muted">{a.aliases.join(", ") || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {g && <GenreDot color={g.color} />}
                        <select value={a.genre ?? ""} disabled={!editable} aria-label={`Genre of ${a.name}`} title={a.genreSource ?? ""}
                          onChange={(e) => e.target.value && setPending({ kind: "genre", artist: a, genre: e.target.value })}
                          style={{ width: "auto", padding: "6px 10px", background: "transparent" }}>
                          <option value="">Not set</option>
                          {GENRES.map((x) => <option key={x.slug} value={x.slug}>{x.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>{a.channelStatus === "official"
                      ? <a href={`https://www.youtube.com/channel/${a.channels[0]}`} target="_blank" rel="noopener" className="pill ok" style={{ textDecoration: "none" }}>Official{a.channels.length > 1 ? ` ×${a.channels.length}` : ""}</a>
                      : a.channelStatus === "suggested" ? <span className="pill warn">Suggestion to check</span> : <span className="pill">None</span>}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{a.via === "wikidata" ? "Wikidata" : a.via === "added" ? "Added by team" : "Discovered"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn neg" style={{ minHeight: 34, padding: "6px 12px", fontSize: 13 }} disabled={!editable} onClick={() => setPending({ kind: "remove", artist: a })}>Remove</button>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={6} className="muted">No artist matches.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {shown.length > 300 && <p className="muted">Showing 300 of {shown.length}. Search to narrow down.</p>}

      <ReasonDialog open={pending?.kind === "genre"} title="Change genre"
        body={pending?.kind === "genre" ? <>Set <strong>{pending.artist.name}</strong> to <strong>{genreLabel(pending.genre)}</strong>. Their songs move to that genre chart on the next run.</> : null}
        confirm="Save genre" onCancel={() => setPending(null)} onConfirm={confirm} />
      <ReasonDialog open={pending?.kind === "remove"} title="Remove artist" danger
        body={pending?.kind === "remove" ? <>Take <strong>{pending.artist.name}</strong> off the roster for good (e.g. not a musician, wrong person). The reason is public in the corrections log.</> : null}
        confirm="Remove" onCancel={() => setPending(null)} onConfirm={confirm} />
      <ReasonDialog open={pending?.kind === "add"} title="Add artist"
        body="Only Cameroonian nationals. The reason should say how you know (source link)."
        extra={<>
          <label className="f">Artist name<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Stage name" /></label>
          {similar.length > 0 && <div className="notice warn">Already in the roster? {similar.map((s) => s.name).join(", ")}</div>}
        </>}
        confirm="Add artist" onCancel={() => setPending(null)} onConfirm={(r) => (newName.trim() ? confirm(r) : undefined)} />
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Artists"><Artists /></Shell>;
}
