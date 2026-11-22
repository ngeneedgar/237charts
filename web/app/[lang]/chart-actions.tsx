"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

export type Week = { id: string; label: string; href: string; current: boolean };
type Sheet = null | "weeks" | "info" | "share" | "image";

/** Chart action bar (under the page title): 📅 choose week · ℹ about this chart · ⤴ share.
 *  Calendar and info open a bottom sheet; share uses the phone's share menu, or copies the link. */
export function ChartActions({ weeks, info, methodologyHref, shareTitle, image, labels }: {
  weeks: Week[];
  info: { title: string; paragraphs: string[] };
  methodologyHref: string;
  shareTitle: string;
  image: string | null;
  labels: { weeks: string; info: string; share: string; close: string; methodology: string; copied: string; copyFail: string; onlyWeek: string; current: string; copyLink: string; image: string; story: string; post: string; imageHint: string; downloaded: string };
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

  // Share: the device's own share menu (iPhone, Android, Windows, Mac — it already has "Copy link").
  // Only where a browser has none do we show our own share sheet.
  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: shareTitle, text: shareTitle, url }); return; }
      catch (e) { if ((e as Error)?.name === "AbortError") return; /* other errors → our sheet */ }
    }
    setSheet("share");
  }

  // Image: share the PNG itself where the phone allows (WhatsApp Status, Instagram…), else download it
  async function shareImage(kind: "story" | "square") {
    if (!image) return;
    const src = `/share/${image}/${kind}.png`;
    const name = `237charts-${image}-${kind}.png`;
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], name, { type: "image/png" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle, text: `${shareTitle} ${window.location.href}` });
      } else {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        setToast(labels.downloaded);
      }
      setSheet(null);
    } catch (e) { if ((e as Error)?.name !== "AbortError") setToast(labels.copyFail); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setToast(labels.copied); }
    catch { setToast(labels.copyFail); }
    setSheet(null);
  }

  const shareTargets = () => {
    const u = encodeURIComponent(typeof window === "undefined" ? "" : window.location.href);
    const t = encodeURIComponent(shareTitle);
    return [
      { name: "WhatsApp", bg: "#25D366", mark: "W", href: `https://wa.me/?text=${t}%20${u}` },
      { name: "Facebook", bg: "#1877F2", mark: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
      { name: "X", bg: "#000000", mark: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
      { name: "Telegram", bg: "#229ED9", mark: "T", href: `https://t.me/share/url?url=${u}&text=${t}` },
      { name: "E-mail", bg: "#6B7280", mark: "@", href: `mailto:?subject=${t}&body=${u}` },
    ];
  };

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
        {image && (
          <button type="button" className={s.actionBtn} onClick={() => setSheet("image")} aria-label={labels.image} title={labels.image}>
            {icon(<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8.5 8.5" /></>)}
          </button>
        )}
        <button type="button" className={s.actionBtn} onClick={share} aria-label={labels.share} title={labels.share}>
          {icon(<><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" /><path d="M6 11H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 19 11h-1" /></>)}
        </button>
      </div>
      {toast && <p className={s.toast} role="status">{toast}</p>}

      <dialog ref={dialog} className={s.sheet} onClose={() => setSheet(null)} onClick={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <div className={s.sheetInner}>
          <div className={s.sheetHead}>
            <span className={s.sheetGrab} aria-hidden="true" />
            <h2 className={s.sheetTitle}>{sheet === "weeks" ? labels.weeks : sheet === "share" ? labels.share : sheet === "image" ? labels.image : info.title}</h2>
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

          {sheet === "share" && (
            <div className={s.shareGrid}>
              {shareTargets().map((x) => (
                <a key={x.name} className={s.shareItem} href={x.href} target="_blank" rel="noopener" onClick={() => setSheet(null)}>
                  <span className={s.shareIcon} style={{ background: x.bg }} aria-hidden="true">{x.mark}</span>
                  {x.name}
                </a>
              ))}
              <button type="button" className={s.shareItem} onClick={copyLink}>
                <span className={s.shareIcon} style={{ background: "var(--fill)", color: "var(--label)" }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                </span>
                {labels.copyLink}
              </button>
            </div>
          )}

          {sheet === "image" && image && (
            <>
              <p className={s.note}>{labels.imageHint}</p>
              <div className={s.imageChoices}>
                {(["story", "square"] as const).map((k) => (
                  <button key={k} type="button" className={s.imageChoice} onClick={() => shareImage(k)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/share/${image}/${k}.png`} alt="" loading="lazy" className={k === "story" ? s.imageStory : s.imageSquare} />
                    <span>{k === "story" ? labels.story : labels.post}</span>
                  </button>
                ))}
              </div>
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
