"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Shell, Toast, useMe } from "../shell";
import { ago, canEdit } from "../lib";
import { GENRES } from "../roster";
import { ReasonDialog } from "../ui";
import { Icon } from "../icons";
import { TILE_BG } from "../../[lang]/chart-tile";

const CHARTS = [
  { slug: "top-20", label: "Top 20" }, { slug: "top-50", label: "Top 50" }, { slug: "viral", label: "Viral 20" },
  ...GENRES.map((g) => ({ slug: g.slug, label: g.label })),
];
type Item = { slug: string; size: number; uploaded: string; by: string | null; reason: string | null };
const SIZE = 1080;

/** Center-crop any image to a square and resize to 1080×1080 JPEG (keeps uploads small and consistent). */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, side);
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't process the image."))), "image/jpeg", 0.88));
}

function Covers() {
  const me = useMe();
  const editable = canEdit(me);
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bust, setBust] = useState(() => Date.now());
  const [pending, setPending] = useState<{ slug: string; label: string; blob?: Blob; url?: string; remove?: boolean } | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<{ slug: string; label: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/covers").then(async (r) => {
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error ?? `Error ${r.status}`);
      setItems(b.items);
    }).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function picked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !target.current) return;
    try {
      const blob = await toSquareJpeg(f);
      setPending({ ...target.current, blob, url: URL.createObjectURL(blob) });
    } catch (x) { setToast({ kind: "bad", text: (x as Error).message }); }
  }

  async function confirm(reason: string) {
    if (!pending) return;
    const r = await fetch(`/api/admin/covers/${pending.slug}?reason=${encodeURIComponent(reason)}`, pending.remove
      ? { method: "DELETE" } : { method: "PUT", headers: { "content-type": "image/jpeg" }, body: pending.blob });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) { setToast({ kind: "bad", text: b.error ?? `Error ${r.status}` }); return; }
    setToast({ kind: "ok", text: pending.remove ? `${pending.label}: back to the standard cover.` : `${pending.label}: new cover saved. It shows on the site within about 5 minutes.` });
    if (pending.url) URL.revokeObjectURL(pending.url);
    setPending(null); setBust(Date.now()); load();
  }

  const custom = new Map((items ?? []).map((i) => [i.slug, i]));

  return (
    <div className="content stack">
      <div>
        <h1>Chart covers</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Upload a custom square cover for any chart. Any image works: it is cropped to 1:1 and resized to 1080×1080 automatically. Without one, the standard gradient cover is used.</p>
      </div>
      {err && <div className="notice warn">{err} Covers are stored in Cloudflare R2; once the storage is connected they can be uploaded here.</div>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={picked} />
      <div className="cover-grid">
        {CHARTS.map((c) => {
          const item = custom.get(c.slug);
          return (
            <div key={c.slug} className="card cover-card">
              <div className="cover-preview" style={{ background: TILE_BG[c.slug] ?? TILE_BG["top-50"] }}>
                {!item && <span className="cover-name">{c.label}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item && <img src={`/cover/${c.slug}.jpg?t=${bust}`} alt={`${c.label} cover`} />}
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                <strong>{c.label}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{item ? `Custom · ${item.by ?? "team"} · ${ago(item.uploaded)}` : "Standard cover"}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" disabled={!editable || !!err} onClick={() => { target.current = c; input.current?.click(); }}><Icon name="image" />{item ? "Replace" : "Upload"}</button>
                {item && <button className="btn neg" disabled={!editable} onClick={() => setPending({ ...c, remove: true })}>Remove</button>}
              </div>
            </div>
          );
        })}
      </div>

      <ReasonDialog open={!!pending} title={pending?.remove ? `Remove ${pending?.label} cover` : `New ${pending?.label} cover`} danger={pending?.remove}
        body={pending?.remove ? "The chart goes back to its standard gradient cover." : "This is how it will look (1:1, 1080×1080)."}
        extra={pending?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pending.url} alt="" style={{ width: 220, height: 220, borderRadius: 14, objectFit: "cover", justifySelf: "center" }} />
        ) : null}
        confirm={pending?.remove ? "Remove" : "Save cover"}
        onCancel={() => { if (pending?.url) URL.revokeObjectURL(pending.url); setPending(null); }} onConfirm={confirm} />
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Covers"><Covers /></Shell>;
}
