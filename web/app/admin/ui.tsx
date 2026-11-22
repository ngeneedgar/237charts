"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/** Confirmation dialog that always asks for a reason (it goes into the commit and the corrections log). */
export function ReasonDialog({ open, title, body, confirm, danger, extra, onCancel, onConfirm }: {
  open: boolean; title: string; body?: React.ReactNode; confirm: string; danger?: boolean; extra?: React.ReactNode;
  onCancel: () => void; onConfirm: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) { setReason(""); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="scrim" onClick={onCancel}>
      <div className="dialog card stack" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn" style={{ minHeight: 36, padding: 8 }} onClick={onCancel} aria-label="Close"><Icon name="x" /></button>
        </div>
        {body && <div className="muted" style={{ fontSize: 15 }}>{body}</div>}
        {extra}
        <label className="f">Reason (required — saved with the change)
          <textarea ref={ref} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. artist request, source link…" />
        </label>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "neg" : "pri"}`} disabled={busy || reason.trim().length < 3}
            onClick={async () => { setBusy(true); try { await onConfirm(reason.trim()); } finally { setBusy(false); } }}>
            {busy ? "Saving…" : confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GenreDot({ color }: { color: string }) {
  return <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block", flex: "none" }} />;
}
