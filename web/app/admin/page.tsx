"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Toast, useMe } from "./shell";
import { ago, api, canEdit, fold, parseCsv, wat, type Run } from "./lib";
import { reviewQueue, type Candidate } from "./review/queue";

type History = Awaited<ReturnType<typeof api.history>>["items"];

/** Next automatic publish: Monday 07:00 UTC (08:00 WAT). */
function nextPublish(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7));
  const add = (1 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + add);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}
function countdown(to: Date) {
  const m = Math.max(0, Math.round((to.getTime() - Date.now()) / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m % 60}m`;
}

function Stat({ label, value, href, link }: { label: string; value: number | string | null; href: string; link: string }) {
  return (
    <div className="card">
      <div className="lbl">{label}</div>
      <div className="big">{value ?? <span className="skeleton" style={{ display: "block", width: 48, height: 36 }} />}</div>
      <Link href={href} style={{ fontSize: 14, fontWeight: 600 }}>{link} →</Link>
    </div>
  );
}

function Overview() {
  const me = useMe();
  const [queue, setQueue] = useState<Candidate[] | null>(null);
  const [noChannel, setNoChannel] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const pub = nextPublish();

  useEffect(() => {
    const err = (what: string) => (e: Error) => setErrors((x) => [...x, `${what}: ${e.message}`]);
    Promise.all([api.json<Candidate[]>("collector/out/candidate-review.json"), api.file("admin/eligibility.csv")])
      .then(([c, e]) => setQueue(reviewQueue(c, parseCsv(e.content).rows))).catch(err("Review queue"));
    api.json<Record<string, { status: string }>>("collector/out/channel-matches.json")
      .then((m) => setNoChannel(Object.values(m).filter((x) => x.status !== "auto").length)).catch(err("Channels"));
    api.json<Record<string, { id: string }[]>>("collector/out/nationality.json")
      .then((n) => setExcluded(Object.values(n).filter((c) => c.some((x) => x.id !== "Q1009")).length)).catch(err("Nationality"));
    api.runs().then((r) => setRuns(r.runs)).catch(err("Runs"));
    api.history().then((h) => setHistory(h.items)).catch(err("Changes"));
  }, []);

  async function startRun() {
    setStarting(true);
    try {
      const r = await api.startRun();
      setToast({ kind: "ok", text: r.dry ? "Test mode: a run would have started." : "Run started. The chart updates in about 2 minutes." });
    } catch (e) { setToast({ kind: "bad", text: (e as Error).message }); }
    setStarting(false);
  }

  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", hour12: false }));
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const failed = runs?.find((r) => r.status === "completed") ?? null;

  return (
    <div className="content stack" style={{ gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">Next chart · {wat(pub.toISOString())}</div>
          <h1>{greet}{me ? `, ${me.name}` : ""}</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={startRun} disabled={!canEdit(me) || starting}>{starting ? "Starting…" : "Re-run now"}</button>
          <a className="btn pri" href="/en/top-50/" target="_blank" rel="noopener">Open live chart ↗</a>
        </div>
      </div>

      {errors.length > 0 && <div className="notice bad">Some data couldn&apos;t load. {errors.join(" · ")}</div>}

      <div className="card" style={{ borderLeft: "4px solid var(--accent)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">Next publish</div>
          <div style={{ fontSize: 44, fontWeight: 200, letterSpacing: "-.02em" }}>{countdown(pub)}</div>
          <div className="muted" style={{ fontSize: 14 }}>Runs and publishes automatically every Monday, 08:00 WAT</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13 }}>
          {failed && failed.conclusion !== "success"
            ? <><span style={{ fontSize: 22, fontWeight: 300 }} className="bad-text">Last run failed</span><br /><a href={failed.url} target="_blank" rel="noopener">Open log ↗</a></>
            : <><span style={{ fontSize: 22, fontWeight: 300 }}>On track</span><br />Last run OK</>}
        </div>
      </div>

      <div className="grid4">
        <Stat label="Waiting for review" value={queue?.length ?? null} href="/admin/review/" link="Open queue" />
        <Stat label="Artists without channel" value={noChannel} href="/admin/channels/" link="Match channels" />
        <Stat label="Excluded by the hard rule" value={excluded} href="/admin/nationality/" link="See list" />
        <Stat label="Admin changes (recent)" value={history?.length ?? null} href="/admin/corrections/" link="Corrections log" />
      </div>

      <div className="grid2">
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}><h2>Recent runs</h2></div>
          {!runs ? <div className="skeleton" style={{ height: 120 }} /> : runs.length === 0 ? <p className="muted">No runs yet.</p> : runs.slice(0, 6).map((r) => (
            <div className="row" key={r.id}>
              <span><strong>{wat(r.started)}</strong> <span className="muted">· {r.event === "schedule" ? "scheduled" : r.event === "push" ? "after a save" : "started by hand"}</span></span>
              <a href={r.url} target="_blank" rel="noopener" className={r.status !== "completed" ? "warn-text" : r.conclusion === "success" ? "ok-text" : "bad-text"} style={{ textDecoration: "none" }}>
                {r.status !== "completed" ? "Running…" : r.conclusion === "success" ? "OK" : "Failed"} · {Math.max(1, Math.round((new Date(r.updated).getTime() - new Date(r.started).getTime()) / 60000))} min
              </a>
            </div>
          ))}
        </section>
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}><h2>Latest changes</h2><Link href="/admin/corrections/" style={{ fontSize: 14 }}>All changes</Link></div>
          {!history ? <div className="skeleton" style={{ height: 120 }} /> : history.length === 0 ? <p className="muted">No changes yet.</p> : history.slice(0, 5).map((h) => (
            <div className="row" key={h.sha} style={{ display: "block" }}>
              <div><strong>{h.message.startsWith("Admin: ") ? h.message.slice(7) : h.message}</strong></div>
              <div className="muted" style={{ fontSize: 13 }}>{fold(h.author) === "github actions" ? "automatic" : h.author} · {ago(h.date)}</div>
            </div>
          ))}
        </section>
      </div>
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function Page() {
  return <Shell active="Overview"><Overview /></Shell>;
}
