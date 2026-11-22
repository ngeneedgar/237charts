"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { api, wat, type Me, type Run } from "./lib";
import { Icon } from "./icons";

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext);

const NAV: { href: string; label: string; ready: boolean }[] = [
  { href: "/admin/", label: "Overview", ready: true },
  { href: "/admin/review/", label: "Review", ready: true },
  { href: "/admin/nationality/", label: "Nationality", ready: true },
  { href: "/admin/artists/", label: "Artists", ready: false },
  { href: "/admin/songs/", label: "Songs", ready: false },
  { href: "/admin/channels/", label: "Channels", ready: false },
  { href: "/admin/charts/", label: "Charts", ready: false },
  { href: "/admin/corrections/", label: "Corrections", ready: true },
  { href: "/admin/requests/", label: "Requests", ready: false },
];

function RunStatus() {
  const [run, setRun] = useState<Run | null | undefined>(undefined);
  useEffect(() => { api.runs().then((r) => setRun(r.runs[0] ?? null)).catch(() => setRun(null)); }, []);
  if (run === undefined) return <span className="muted">Checking last run…</span>;
  if (!run) return <span className="muted">Run status unavailable</span>;
  const running = run.status !== "completed";
  const ok = run.conclusion === "success";
  return (
    <a href={run.url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--label)", textDecoration: "none" }}>
      <span className={`dot ${running ? "warn" : ok ? "" : "bad"}`} />
      <strong>{running ? "Run in progress" : ok ? "Last run OK" : "Last run failed"}</strong>
      <span className="muted">{wat(run.started)}</span>
    </a>
  );
}

export function Shell({ active, badges = {}, children }: { active: string; badges?: Record<string, number>; children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.me().then(setMe).catch((e) => setErr(e.message)); }, []);

  if (err) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div className="card" style={{ maxWidth: 420 }}>
          <h2>Can&apos;t open the admin</h2>
          <p className="muted">{err}</p>
          <p className="muted" style={{ fontSize: 13 }}>Only team members can sign in. Ask the owner to add your email.</p>
          <a className="btn" href="/">Back to 237 Charts</a>
        </div>
      </div>
    );
  }

  const links = NAV.map((n) => n.ready ? (
    <Link key={n.href} href={n.href} className={`nav${active === n.label ? " on" : ""}`}>
      <span className="nav-l"><Icon name={n.label.toLowerCase()} />{n.label}</span>{badges[n.label] ? <span className="cnt">{badges[n.label]}</span> : null}
    </Link>
  ) : <span key={n.href} className="nav soon" aria-disabled="true"><span className="nav-l"><Icon name={n.label.toLowerCase()} />{n.label}</span></span>);

  return (
    <MeContext.Provider value={me}>
      <div className="app">
        <aside className="side">
          <Link href="/admin/" className="brand" aria-label="237 Charts Admin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-white.svg" alt="237 Charts" height={34} style={{ height: 34, width: "auto", display: "block" }} />
            <small>Admin</small>
          </Link>
          {links}
          <div style={{ flex: 1 }} />
          <a className="nav" href="/" target="_blank" rel="noopener"><span className="nav-l"><Icon name="external" />Public site</span></a>
        </aside>
        <div className="main">
          <header className="top">
            <RunStatus />
            <div className="who">
              {me?.dry && <span className="pill warn">Test mode: saves are not committed</span>}
              {me ? <>{me.name} · {me.role[0].toUpperCase() + me.role.slice(1)}<span className="avatar">{me.name[0]}</span></> : <span className="skeleton" style={{ width: 120 }} />}
            </div>
          </header>
          <nav className="mnav" aria-label="Admin sections">{links}</nav>
          {/* Pages render only once the team member is known: no data or times are baked into the static build */}
          {me ? children : <div className="content"><div className="skeleton" style={{ height: 160 }} /></div>}
        </div>
      </div>
    </MeContext.Provider>
  );
}

/** Small "saved / error" message in the corner. */
export function Toast({ msg, onClose }: { msg: { kind: "ok" | "bad"; text: string; link?: string } | null; onClose: () => void }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 7000); return () => clearTimeout(t); } }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`notice toast ${msg.kind === "bad" ? "bad" : ""}`} role="status">
      {msg.text} {msg.link && <a href={msg.link} target="_blank" rel="noopener">View commit</a>}
    </div>
  );
}
