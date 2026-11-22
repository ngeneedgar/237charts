// Client helpers for the admin: API calls and CSV read/write (same rules as collector/lib/roster.mjs).

export type Role = "viewer" | "editor" | "owner";
export type Me = { name: string; role: Role; canWrite: boolean; dry: boolean };
export type FileData = { content: string; sha: string | null };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/admin/${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await r.json().catch(() => ({ error: `Unexpected answer (${r.status})` }));
  if (!r.ok) throw Object.assign(new Error(body.error ?? `Error ${r.status}`), { status: r.status });
  return body as T;
}

export const api = {
  me: () => call<Me>("me"),
  file: (path: string) => call<FileData>(`file?path=${encodeURIComponent(path)}`),
  json: async <T>(path: string): Promise<T> => JSON.parse((await api.file(path)).content || "null") as T,
  save: (path: string, content: string, sha: string | null, reason: string) =>
    call<{ ok?: boolean; dry?: boolean; message?: string; commit?: string }>("file", { method: "PUT", body: JSON.stringify({ path, content, sha, reason }) }),
  history: () => call<{ items: { sha: string; url: string; date: string; message: string; author: string }[] }>("history"),
  runs: () => call<{ runs: Run[] }>("runs"),
  startRun: () => call<{ ok?: boolean; dry?: boolean }>("run", { method: "POST" }),
};

export type Run = { id: number; url: string; event: string; status: string; conclusion: string | null; started: string; updated: string; title: string };

export const canEdit = (me: Me | null) => !!me && (me.role === "editor" || me.role === "owner");

// ---------- CSV ----------
export function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
export function parseCsv(text: string): { header: string; rows: string[][] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  return { header: lines[0] ?? "", rows: lines.slice(1).filter((l) => l.trim()).map(parseCsvLine) };
}
const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const csvLine = (values: string[]) => values.map((v) => cell(v.replace(/\s+/g, " ").trim())).join(",");

/** Append one row to a CSV file's text, keeping everything already there byte-for-byte. */
export const appendRow = (text: string, values: string[]) => (text && !text.endsWith("\n") ? text + "\n" : text) + csvLine(values) + "\n";

export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
export const wat = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " WAT";
