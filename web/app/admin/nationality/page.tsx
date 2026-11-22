"use client";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "../shell";
import { api, fold } from "../lib";

type Country = { id: string; name: string };
const CAMEROON = "Q1009";

function Nationality() {
  const [rows, setRows] = useState<{ qid: string; name: string; countries: Country[] }[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.json<Record<string, Country[]>>("collector/out/nationality.json"),
      api.json<{ wikidata: string; name: string }[] | Record<string, { name: string }>>("collector/out/wikidata-artists.json"),
    ]).then(([nat, wd]) => {
      const names = new Map<string, string>(Array.isArray(wd) ? wd.map((a) => [a.wikidata, a.name]) : Object.entries(wd).map(([k, v]) => [k, v.name]));
      setRows(Object.entries(nat)
        .filter(([, c]) => c.some((x) => x.id !== CAMEROON))
        .map(([qid, countries]) => ({ qid, name: names.get(qid) ?? qid, countries }))
        .sort((a, b) => a.name.localeCompare(b.name)));
    }).catch((e) => setErr(e.message));
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => !q || fold(r.name).includes(fold(q))), [rows, q]);

  return (
    <div className="content stack">
      <div>
        <h1>Nationality exclusions</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Artists the hard rule keeps off the chart. Read-only.</p>
      </div>
      <div className="notice"><strong>Cameroonian nationals only. Dual nationals are excluded.</strong> No role can override this. If the data is wrong, correct it at the source (Wikidata) and the next run picks it up.</div>
      {err && <div className="notice bad">Couldn&apos;t load the list: {err}</div>}
      <input placeholder="Search excluded artists…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} aria-label="Search excluded artists" />
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {!rows ? <div className="skeleton" style={{ height: 200, margin: 20 }} /> : (
          <table className="t">
            <thead><tr><th>Artist</th><th>Citizenship(s)</th><th>Reason</th><th>Source</th><th /></tr></thead>
            <tbody>
              {shown.map((r) => {
                const dual = r.countries.some((c) => c.id === CAMEROON);
                return (
                  <tr key={r.qid}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>{r.countries.map((c) => c.name).join(", ")}</td>
                    <td><span className="pill bad">{dual ? "Dual national" : "Not Cameroonian"}</span></td>
                    <td><a href={`https://www.wikidata.org/wiki/${r.qid}`} target="_blank" rel="noopener">Wikidata</a></td>
                    <td style={{ textAlign: "right" }}><a href={`https://www.wikidata.org/wiki/${r.qid}#P27`} target="_blank" rel="noopener">Report wrong data ↗</a></td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={5} className="muted">No match.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>{rows ? `${rows.length} artists excluded. ` : ""}From <code>collector/out/nationality.json</code>, refreshed every run.</p>
    </div>
  );
}

export default function Page() {
  return <Shell active="Nationality"><Nationality /></Shell>;
}
