"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import s from "../home.module.css";
import { Icon } from "../../admin/icons";

type Prefs = { theme: "auto" | "light" | "dark"; explicit: "show" | "hide"; lang?: "fr" | "en" };
const KEY = "237prefs";
const read = (): Prefs => {
  try { return { theme: "auto", explicit: "show", ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { theme: "auto", explicit: "show" }; }
};
const save = (p: Prefs) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: applies to this visit only */ } };
function apply(p: Prefs) {
  const r = document.documentElement;
  if (p.theme === "auto") delete r.dataset.theme; else r.dataset.theme = p.theme;
  if (p.explicit === "hide") r.dataset.explicit = "hide"; else delete r.dataset.explicit;
}

type Copy = {
  language: string; languageNote: string;
  appearance: string; theme: string; auto: string; light: string; dark: string; autoNote: string;
  content: string; hideExplicit: string; hideExplicitNote: string;
  notifications: string; newChart: string; newChartNote: string; favArtists: string; appOnly: string;
  about: string; methodology: string; forArtists: string; embed: string; archive: string; version: string; versionValue: string;
  reset: string; resetDone: string; savedNote: string;
};

export function SettingsPanel({ c, lang }: { c: Copy; lang: "fr" | "en" }) {
  const [p, setP] = useState<Prefs>({ theme: "auto", explicit: "show" });
  const [msg, setMsg] = useState("");
  useEffect(() => { setP(read()); }, []);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...p, ...patch };
    setP(next); save(next); apply(next); setMsg("");
  };

  const seg = (id: string, value: string, opts: [string, string][], on: (v: string) => void, label: string) => (
    <div className={s.segWide} role="radiogroup" aria-label={label}>
      {opts.map(([v, l]) => (
        <button key={v} id={`${id}-${v}`} type="button" role="radio" aria-checked={value === v} onClick={() => on(v)}>{l}</button>
      ))}
    </div>
  );

  return (
    <>
      <section className={s.setGroup}>
        <h2 className={s.setTitle}><Icon name="globe" size={16} />{c.language}</h2>
        <div className={s.setCard}>
          <div className={s.setRow}>
            {seg("lang", lang, [["fr", "Français"], ["en", "English"]], (v) => {
              update({ lang: v as "fr" | "en" });
              window.location.href = `/${v}/settings/`;
            }, c.language)}
          </div>
        </div>
        <p className={s.setNote}>{c.languageNote}</p>
      </section>

      <section className={s.setGroup}>
        <h2 className={s.setTitle}><Icon name="sun" size={16} />{c.appearance}</h2>
        <div className={s.setCard}>
          <div className={s.setRow}>
            {seg("theme", p.theme, [["auto", c.auto], ["light", c.light], ["dark", c.dark]], (v) => update({ theme: v as Prefs["theme"] }), c.theme)}
          </div>
        </div>
        <p className={s.setNote}>{c.autoNote}</p>
      </section>

      <section className={s.setGroup}>
        <h2 className={s.setTitle}><Icon name="eye" size={16} />{c.content}</h2>
        <div className={s.setCard}>
          <label className={s.setRow} htmlFor="set-explicit">
            <span>{c.hideExplicit}</span>
            <input id="set-explicit" className={s.switch} type="checkbox" role="switch"
              checked={p.explicit === "hide"} onChange={(e) => update({ explicit: e.target.checked ? "hide" : "show" })} />
          </label>
        </div>
        <p className={s.setNote}>{c.hideExplicitNote}</p>
      </section>

      <section className={s.setGroup}>
        <h2 className={s.setTitle}><Icon name="bell" size={16} />{c.notifications}</h2>
        <div className={s.setCard}>
          <label className={`${s.setRow} ${s.setDisabled}`} htmlFor="set-newchart">
            <span><span className={s.setLabel}>{c.newChart}</span><span className={s.setSub}>{c.newChartNote}</span></span>
            <input id="set-newchart" className={s.switch} type="checkbox" role="switch" disabled />
          </label>
          <label className={`${s.setRow} ${s.setDisabled}`} htmlFor="set-fav">
            <span className={s.setLabel}>{c.favArtists}</span>
            <input id="set-fav" className={s.switch} type="checkbox" role="switch" disabled />
          </label>
        </div>
        <p className={s.setNote}>{c.appOnly}</p>
      </section>

      <section className={s.setGroup}>
        <h2 className={s.setTitle}><Icon name="info" size={16} />{c.about}</h2>
        <div className={s.setCard}>
          <Link className={s.setRow} href={`/${lang}/methodology/`}><span>{c.methodology}</span><span className={s.chevron} aria-hidden="true">›</span></Link>
          <Link className={s.setRow} href={`/${lang}/artists/`}><span>{c.forArtists}</span><span className={s.chevron} aria-hidden="true">›</span></Link>
          <Link className={s.setRow} href={`/${lang}/embed/`}><span>{c.embed}</span><span className={s.chevron} aria-hidden="true">›</span></Link>
          <div className={s.setRow}><span>{c.version}</span><span className={s.setValue}>{c.versionValue}</span></div>
        </div>
      </section>

      <section className={s.setGroup}>
        <button type="button" className={s.setDanger} onClick={() => { const d: Prefs = { theme: "auto", explicit: "show" }; save(d); apply(d); setP(d); setMsg(c.resetDone); }}>{c.reset}</button>
        <p className={s.setNote} role="status">{msg || c.savedNote}</p>
      </section>
    </>
  );
}
