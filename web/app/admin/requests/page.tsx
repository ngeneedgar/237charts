"use client";
import { useCallback, useEffect, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { ago, canEdit, wat } from "../lib";
import { Icon } from "../icons";

type Note = { at: string; by: string; text: string };
type Req = { id: string; created: string; type: string; artist: string; song: string; links: string; details: string; contact: string; lang: "fr" | "en"; status: "new" | "progress" | "done"; assignee: string | null; notes: Note[]; closed?: string | null };

const TYPE: Record<string, string> = { add: "Add a song or channel", fix: "Fix song details", merge: "Merge or split songs", elig: "Eligibility", remove: "Remove an unofficial channel", other: "Other" };
const STATUS: Record<Req["status"], string> = { new: "New", progress: "In progress", done: "Done" };
const TEMPLATES: Record<"fr" | "en", { label: string; text: string }[]> = {
  en: [
    { label: "Fixed", text: "Hello, thank you for your message. We have corrected this; it will show on the next chart (Monday 08:00 WAT). — 237 Charts" },
    { label: "Need proof", text: "Hello, thank you for your message. Could you send a link from your official channel or social account (or your label/distributor contact) so we can confirm? — 237 Charts" },
    { label: "Can't change", text: "Hello, thank you for your message. Rankings come only from listening data (YouTube, Shazam Cameroon, Deezer), so we can't change a position on request. The full method is on our Methodology page. — 237 Charts" },
  ],
  fr: [
    { label: "Corrigé", text: "Bonjour, merci pour votre message. C'est corrigé ; ce sera visible au prochain classement (lundi 8 h 00 WAT). — 237 Charts" },
    { label: "Preuve demandée", text: "Bonjour, merci pour votre message. Pouvez-vous envoyer un lien depuis votre chaîne ou compte officiel (ou le contact de votre label/distributeur) pour que nous puissions vérifier ? — 237 Charts" },
    { label: "Pas modifiable", text: "Bonjour, merci pour votre message. Les classements viennent uniquement des données d'écoute (YouTube, Shazam Cameroun, Deezer) : nous ne pouvons pas changer une position sur demande. La méthode complète est sur notre page Méthodologie. — 237 Charts" },
  ],
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/admin/${path}`, { ...init, headers: { "content-type": "application/json" } });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error ?? `Error ${r.status}`);
  return b as T;
}

/** wa.me link if the contact looks like a phone number, mailto if it looks like an email. */
function replyLink(contact: string, text: string) {
  const email = contact.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  if (email) return { href: `mailto:${email}?subject=${encodeURIComponent("237 Charts")}&body=${encodeURIComponent(text)}`, label: "Reply by email" };
  const digits = contact.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.length >= 8) return { href: `https://wa.me/${digits.length === 9 ? "237" + digits : digits}?text=${encodeURIComponent(text)}`, label: "Reply on WhatsApp" };
  return null;
}

function Requests() {
  const me = useMe();
  const editable = canEdit(me);
  const [items, setItems] = useState<Req[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "done" | "all">("open");
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const load = useCallback(() => call<{ items: Req[] }>("requests").then((r) => setItems(r.items)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const list = (items ?? []).filter((r) => tab === "all" || (tab === "done" ? r.status === "done" : r.status !== "done"));
  const cur = list.find((r) => r.id === selId) ?? list[0];
  useEffect(() => { setReply(""); setNote(""); }, [cur?.id]);

  async function update(body: Record<string, unknown>, msg: string) {
    if (!cur) return;
    setBusy(true);
    try {
      const r = await call<{ item: Req; dry?: boolean }>(`requests/${cur.id}`, { method: "PUT", body: JSON.stringify(body) });
      setItems((xs) => (xs ?? []).map((x) => (x.id === r.item.id ? r.item : x)));
      setToast({ kind: "ok", text: r.dry ? `Test mode — ${msg} (not saved)` : msg });
      setNote("");
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
    setBusy(false);
  }

  const openCount = (items ?? []).filter((r) => r.status !== "done").length;
  const link = cur && reply ? replyLink(cur.contact, reply) : null;

  if (err) return (
    <div className="content stack">
      <h1>Artist requests</h1>
      <div className="notice warn">{err}</div>
      <p className="muted">Requests from the “For artists” form are stored privately in Cloudflare. Once the storage is connected, they appear here.</p>
    </div>
  );

  return (
    <div className="queue">
      <div className="queue-list">
        <div style={{ padding: "8px 14px 12px" }}>
          <h1 style={{ fontSize: 22 }}>Artist requests</h1>
          <div className="muted" style={{ fontSize: 13 }}>From the “For artists” form · {openCount} open</div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {(["open", "done", "all"] as const).map((k) => <button key={k} className={`chip-btn${tab === k ? " on" : ""}`} onClick={() => { setTab(k); setSelId(null); }}>{k === "open" ? "Open" : k === "done" ? "Done" : "All"}</button>)}
          </div>
        </div>
        {!items ? <div className="skeleton" style={{ height: 200, margin: 12 }} /> : list.length === 0 ? <p className="muted" style={{ padding: 14 }}>No requests here.</p> : list.map((r) => (
          <button key={r.id} className={`qi${r === cur ? " on" : ""}`} onClick={() => setSelId(r.id)}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{TYPE[r.type] ?? r.type}</strong>
              <span className={`pill ${r.status === "new" ? "warn" : r.status === "done" ? "ok" : ""}`}>{STATUS[r.status]}</span>
            </span>
            <small>{r.artist}{r.song ? ` · ${r.song}` : ""} · {ago(r.created)}</small>
          </button>
        ))}
      </div>

      <div className="content stack" style={{ alignContent: "start" }}>
        {!cur ? (items && <div className="card"><h2>All caught up</h2><p className="muted" style={{ margin: 0 }}>New requests appear here as soon as an artist sends the form.</p></div>) : (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="lbl">#{cur.id.slice(-6).toUpperCase()} · {wat(cur.created)} · {cur.lang === "fr" ? "Français" : "English"}</div>
              <h1>{TYPE[cur.type] ?? cur.type}</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["new", "progress", "done"] as const).map((s) => (
                <button key={s} className={`chip-btn${cur.status === s ? " on" : ""}`} disabled={!editable || busy || cur.status === s} onClick={() => update({ status: s }, `Marked ${STATUS[s].toLowerCase()}.`)}>{STATUS[s]}</button>
              ))}
            </div>
          </div>

          <div className="grid2">
            <section className="card">
              <h2>Request</h2>
              <div className="fact"><span className="muted">Artist</span><strong>{cur.artist}</strong></div>
              {cur.song && <div className="fact"><span className="muted">Song</span><span>{cur.song}</span></div>}
              <div className="fact"><span className="muted">Contact</span><span>{cur.contact}</span></div>
              <div className="fact"><span className="muted">Assigned to</span><span>{cur.assignee ?? <button className="btn" style={{ minHeight: 30, padding: "4px 10px", fontSize: 13 }} disabled={!editable || busy} onClick={() => update({ take: true, status: cur.status === "new" ? "progress" : cur.status }, "Assigned to you.")}>Take it</button>}</span></div>
              <blockquote style={{ margin: "14px 0 0", padding: "12px 14px", background: "var(--raised)", borderRadius: 12, whiteSpace: "pre-wrap", fontSize: 15 }}>{cur.details}</blockquote>
              {cur.links && <p style={{ fontSize: 14, wordBreak: "break-all" }}>{cur.links.split(/\s+/).map((l, i) => /^https?:\/\//.test(l) ? <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>{l}</a> : <span key={i}>{l} </span>)}</p>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <a className="btn" href="/admin/songs/"><Icon name="songs" />Open Songs</a>
                <a className="btn" href="/admin/artists/"><Icon name="artists" />Open Artists</a>
              </div>
            </section>

            <section className="card stack">
              <h2 style={{ margin: 0 }}>Reply</h2>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TEMPLATES[cur.lang].map((t) => <button key={t.label} className="chip-btn" onClick={() => setReply(t.text)}>{t.label}</button>)}
              </div>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply, or pick a template" style={{ minHeight: 110 }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {link ? <a className="btn pri" href={link.href} target="_blank" rel="noopener"
                  onClick={() => editable && update({ note: `Replied: ${reply.slice(0, 300)}` }, "Reply opened and logged.")}>{link.label}</a>
                  : <span className="muted" style={{ fontSize: 13 }}>{reply ? "The contact isn't an email or phone number — copy the reply and send it yourself." : ""}</span>}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Replies open in your email or WhatsApp; nothing is sent from the dashboard.</p>
            </section>
          </div>

          <section className="card">
            <h2>Notes &amp; history</h2>
            {cur.notes.length === 0 ? <p className="muted">No notes yet.</p> : cur.notes.map((n, i) => (
              <div className="row" key={i} style={{ display: "block" }}><div>{n.text}</div><div className="muted" style={{ fontSize: 13 }}>{n.by} · {wat(n.at)}</div></div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note (not sent to the artist)" disabled={!editable} />
              <button className="btn" disabled={!editable || busy || !note.trim()} onClick={() => update({ note }, "Note saved.")}>Save note</button>
            </div>
          </section>
          <p className="muted" style={{ fontSize: 13 }}>Privacy: requests are kept only in Cloudflare (never in the public repo) and deleted 180 days after they are marked done.</p>
        </>)}
      </div>
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Requests"><Requests /></Shell>;
}
