"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import s from "./home.module.css";

/** Back control: returns to the page you came from on this site; otherwise goes to `href`.
 *  Chevron icon + label, 44px tap target, label truncates instead of wrapping. */
export function BackLink({ href, label }: { href: string; label: string }) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    } catch { /* fall back to the link */ }
  }
  return (
    <Link className={s.back} href={href} onClick={onClick}>
      <svg viewBox="0 0 12 20" width="12" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2 2 10l8 8" /></svg>
      <span className={s.backLabel}>{label}</span>
    </Link>
  );
}
