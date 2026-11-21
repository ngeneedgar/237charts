"use client";

import { useEffect } from "react";

/** Reads ?n=5|10 and ?theme=light|dark from the iframe URL and applies them (static site: no server). */
export function WidgetOptions({ rootId }: { rootId: string }) {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const root = document.getElementById(rootId);
    if (!root) return;
    const n = p.get("n") === "5" ? 5 : 10;
    root.querySelectorAll<HTMLElement>("[data-rank]").forEach((li) => { li.hidden = Number(li.dataset.rank) > n; });
    if (p.get("theme") === "dark") root.dataset.theme = "dark";
    if (p.get("theme") === "light") root.dataset.theme = "light";
  }, [rootId]);
  return null;
}
