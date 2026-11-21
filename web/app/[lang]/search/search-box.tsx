"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import s from "../home.module.css";

type Item = { kind: "song" | "artist"; href: string; title: string; sub: string; img: string | null; text: string };

const fold = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SearchBox({ items, placeholder, songsLabel, artistsLabel, empty, hint }: {
  items: Item[]; placeholder: string; songsLabel: string; artistsLabel: string; empty: string; hint: string;
}) {
  const [q, setQ] = useState("");
  const found = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items.filter((it) => words.every((w) => it.text.includes(w))).slice(0, 40);
  }, [q, items]);
  const artists = found.filter((f) => f.kind === "artist");
  const songs = found.filter((f) => f.kind === "song");

  const group = (label: string, list: Item[]) => list.length ? (
    <section>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}>{label}</h2></div>
      <ul className={s.list}>
        {list.map((it) => (
          <li key={it.href}>
            <Link className={s.row} href={it.href} style={{ gridTemplateColumns: "44px 1fr" }}>
              {it.img
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className={s.thumb} src={it.img} alt="" loading="lazy" />
                : <span className={s.thumb} aria-hidden="true">{it.title.slice(0, 2).toUpperCase()}</span>}
              <span className={s.rowText}>
                <span className={s.rowTitle}>{it.title}</span>
                <span className={s.rowArtist}>{it.sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  return (
    <>
      <label className={s.searchField}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
        <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoComplete="off" autoFocus aria-label={placeholder} />
      </label>
      {!q.trim() && <p className={s.note}>{hint}</p>}
      {q.trim() && !found.length && <p className={s.note}>{empty}</p>}
      {group(artistsLabel, artists)}
      {group(songsLabel, songs)}
    </>
  );
}
