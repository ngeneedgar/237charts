"use client";

import { useMemo, useState } from "react";
import s from "../home.module.css";

type Copy = {
  typeLabel: string; types: Record<string, string>;
  artist: string; song: string; links: string; linksHint: string; details: string; detailsHint: string;
  contactYou: string; contactHint: string;
  preview: string; copy: string; copied: string; copyFail: string;
  sendEmail: string; sendWhatsApp: string; noContact: string; required: string;
};

export function RequestForm({ c, email, whatsapp }: { c: Copy; email: string; whatsapp: string }) {
  const [type, setType] = useState(Object.keys(c.types)[0]);
  const [f, setF] = useState({ artist: "", song: "", links: "", details: "", contact: "" });
  const [status, setStatus] = useState("");
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  const ready = f.artist.trim() && f.details.trim() && f.contact.trim();
  const message = useMemo(() => [
    `237 Charts — ${c.types[type]}`,
    `${c.artist}: ${f.artist}`,
    f.song && `${c.song}: ${f.song}`,
    f.links && `${c.links}: ${f.links}`,
    `${c.details}: ${f.details}`,
    `${c.contactYou}: ${f.contact}`,
  ].filter(Boolean).join("\n"), [type, f, c]);

  async function copy() {
    try { await navigator.clipboard.writeText(message); setStatus(c.copied); }
    catch { setStatus(c.copyFail); }
  }

  return (
    <form className={s.form} onSubmit={(e) => e.preventDefault()}>
      <label className={s.field}>
        <span>{c.typeLabel}</span>
        <select id="req-type" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(c.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className={s.field}><span>{c.artist} *</span><input id="req-artist" value={f.artist} onChange={set("artist")} autoComplete="off" /></label>
      <label className={s.field}><span>{c.song}</span><input id="req-song" value={f.song} onChange={set("song")} autoComplete="off" /></label>
      <label className={s.field}><span>{c.links}</span><input id="req-links" value={f.links} onChange={set("links")} placeholder={c.linksHint} inputMode="url" /></label>
      <label className={s.field}><span>{c.details} *</span><textarea id="req-details" rows={4} value={f.details} onChange={set("details")} placeholder={c.detailsHint} /></label>
      <label className={s.field}><span>{c.contactYou} *</span><input id="req-contact" value={f.contact} onChange={set("contact")} placeholder={c.contactHint} /></label>

      {ready ? (
        <>
          <div className={s.field}><span>{c.preview}</span><pre className={s.msg}>{message}</pre></div>
          <div className={s.links}>
            {whatsapp && <a className={s.primary} href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">{c.sendWhatsApp}</a>}
            {email && <a className={whatsapp ? s.textBtn : s.primary} href={`mailto:${email}?subject=${encodeURIComponent(`237 Charts — ${c.types[type]}`)}&body=${encodeURIComponent(message)}`}>{c.sendEmail} ({email})</a>}
            <button type="button" className={s.textBtn} onClick={copy}>{c.copy}</button>
            {!email && !whatsapp && <p className={s.note}>{c.noContact}</p>}
          </div>
        </>
      ) : <p className={s.note}>{c.required}</p>}
      <p className={s.note} role="status">{status}</p>
    </form>
  );
}
