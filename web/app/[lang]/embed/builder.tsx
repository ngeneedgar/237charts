"use client";

import { useMemo, useState } from "react";
import s from "../home.module.css";

type Opt = { value: string; label: string };
type Copy = {
  chart: string; size: string; theme: string; language: string; light: string; dark: string;
  preview: string; code: string; copy: string; copied: string; copyFail: string; howTo: string;
};

export function EmbedBuilder({ c, charts, siteUrl, lang }: { c: Copy; charts: Opt[]; siteUrl: string; lang: "fr" | "en" }) {
  const [chart, setChart] = useState("top-50");
  const [n, setN] = useState("10");
  const [theme, setTheme] = useState("light");
  const [wl, setWl] = useState<string>(lang);
  const [status, setStatus] = useState("");

  const height = n === "5" ? 380 : 640;
  const path = `/${wl}/widget/${chart}/?n=${n}&theme=${theme}`;
  const title = charts.find((x) => x.value === chart)?.label ?? "237 Charts";
  const code = useMemo(
    () => `<iframe src="${siteUrl}${path}" title="${title} · 237 Charts" width="100%" height="${height}" style="max-width:420px;border:0;border-radius:12px" loading="lazy"></iframe>`,
    [siteUrl, path, title, height],
  );

  async function copy() {
    try { await navigator.clipboard.writeText(code); setStatus(c.copied); } catch { setStatus(c.copyFail); }
  }

  const select = (id: string, label: string, value: string, set: (v: string) => void, opts: Opt[]) => (
    <label className={s.field}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => { set(e.target.value); setStatus(""); }}>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className={s.prose}>
        <div className={s.form}>
          {select("embed-chart", c.chart, chart, setChart, charts)}
          {select("embed-size", c.size, n, setN, [{ value: "5", label: "Top 5" }, { value: "10", label: "Top 10" }])}
          {select("embed-theme", c.theme, theme, setTheme, [{ value: "light", label: c.light }, { value: "dark", label: c.dark }])}
          {select("embed-lang", c.language, wl, setWl, [{ value: "fr", label: "Français" }, { value: "en", label: "English" }])}
        </div>
      </div>

      <section>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}>{c.preview}</h2></div>
        <div className={s.embedPreview}>
          <iframe key={path} src={path} title={`${title} · 237 Charts`} width="100%" height={height} style={{ maxWidth: 420, border: 0, borderRadius: 12 }} />
        </div>
      </section>

      <section>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}>{c.code}</h2></div>
        <div className={s.prose}>
          <pre className={s.msg} id="embed-code">{code}</pre>
          <button type="button" className={s.primary} onClick={copy} style={{ width: "100%", cursor: "pointer" }}>{c.copy}</button>
          <p className={s.note} role="status" style={{ margin: 0 }}>{status}</p>
          <p className={s.note} style={{ margin: 0 }}>{c.howTo}</p>
        </div>
      </section>
    </>
  );
}
