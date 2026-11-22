"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

export type Week = { id: string; label: string; href: string; current: boolean };
type Sheet = null | "weeks" | "info";

/** Chart action bar (under the page title): 📅 choose week · ℹ about this chart · ⤴ share.
 *  Calendar and info open a bottom sheet; share uses the phone's share menu, or copies the link. */
export function ChartActions({ weeks, info, methodologyHref, shareTitle, labels }: {
  weeks: Week[];
  info: { title: string; paragraphs: string[] };
  methodologyHref: string;
  shareTitle: string;
  labels: { weeks: string; info: string; share: string; close: string; methodology: string; copied: string; copyFail: string; onlyWeek: string; current: string };
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (sheet && !d.open) d.showModal();
    if (!sheet && d.open) d.close();
  }, [sheet]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2500); return () => clearTimeout(t); }, [toast]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: shareTitle, url }); return; }
      await navigator.clipboard.writeText(url);
      setToast(labels.copied);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // viewer closed the share menu
      setToast(labels.copyFail);
    }
  }

  const icon = (d: React.ReactNode) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
  );

  return (
    <>
      <div className={s.actionBar} role="toolbar" aria-label={shareTitle}>
        <button type="button" className={s.actionBtn} onClick={() => setSheet("weeks")} aria-label={labels.weeks} title={labels.weeks}>
          {icon(<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>)}
        </button>
        <button type="button" className={s.actionBtn} onClick={() => setSheet("info")} aria-label={labels.info} title={labels.info}>
          {icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".6" fill="currentColor" /></>)}
        </button>
        <button type="button" className={s.actionBtn} onClick={share} aria-label={labels.share} title={labels.share}>
          {icon(<><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" /><path d="M6 11H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 19 11h-1" /></>)}
        </button>
      </div>
      {toast && <p className={s.toast} role="status">{toast}</p>}

      <dialog ref={dialog} className={s.sheet} onClose={() => setSheet(null)} onClick={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <div className={s.sheetInner}>
          <div className={s.sheetHead}>
            <span className={s.sheetGrab} aria-hidden="true" />
            <h2 className={s.sheetTitle}>{sheet === "weeks" ? labels.weeks : info.title}</h2>
            <button type="button" className={s.sheetClose} onClick={() => setSheet(null)}>{labels.close}</button>
          </div>

          {sheet === "weeks" && (
            <>
              <ul className={s.weekList}>
                {weeks.map((w) => (
                  <li key={w.id}>
                    <Link className={s.weekRow} href={w.href} aria-current={w.current ? "page" : undefined} onClick={() => setSheet(null)}>
                      <span>{w.label}</span>
                      {w.current && <span className={s.weekNow}>{labels.current}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {weeks.length < 2 && <p className={s.note}>{labels.onlyWeek}</p>}
            </>
          )}

          {sheet === "info" && (
            <div className={s.infoText}>
              {info.paragraphs.map((p) => <p key={p}>{p}</p>)}
              <Link href={methodologyHref} onClick={() => setSheet(null)}>{labels.methodology} ›</Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
