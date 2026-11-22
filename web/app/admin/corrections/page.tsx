"use client";
import { useEffect, useState } from "react";
import { Shell } from "../shell";
import { api, wat } from "../lib";

type Item = Awaited<ReturnType<typeof api.history>>["items"][number];

function Corrections() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.history().then((h) => setItems(h.items)).catch((e) => setErr(e.message)); }, []);
  const admin = (items ?? []).filter((i) => i.message.startsWith("Admin: "));
  const other = (items ?? []).filter((i) => !i.message.startsWith("Admin: "));

  return (
    <div className="content stack">
      <div>
        <h1>Corrections log</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Every change to the admin files, with who, when and why. Each one is a commit you can open on GitHub.</p>
      </div>
      {err && <div className="notice bad">Couldn&apos;t load the history: {err}</div>}
      {!items ? <div className="skeleton" style={{ height: 240 }} /> : (
        <>
          <section className="card">
            <h2>From the dashboard</h2>
            {admin.length === 0 ? <p className="muted" style={{ margin: 0 }}>No dashboard changes yet. Decisions you make in Review appear here.</p> : admin.map((i) => {
              const [who, why] = i.message.slice(7).split(" — ");
              return (
                <div className="row" key={i.sha}>
                  <span><strong>{why ?? who}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{who} · {wat(i.date)}</span></span>
                  <a href={i.url} target="_blank" rel="noopener" style={{ fontSize: 14 }}>Commit ↗</a>
                </div>
              );
            })}
          </section>
          <section className="card">
            <h2>Edited directly on GitHub</h2>
            {other.length === 0 ? <p className="muted" style={{ margin: 0 }}>None.</p> : other.map((i) => (
              <div className="row" key={i.sha}>
                <span><strong>{i.message}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{i.author} · {wat(i.date)}</span></span>
                <a href={i.url} target="_blank" rel="noopener" style={{ fontSize: 14 }}>Commit ↗</a>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <Shell active="Corrections"><Corrections /></Shell>;
}
