// Outline icons for the admin (24px grid, 1.8 stroke — same style as the public site's tab bar).
const P: Record<string, React.ReactNode> = {
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  review: <><path d="M9 11l2.5 2.5L16 9" /><rect x="3.5" y="3.5" width="17" height="17" rx="3" /></>,
  nationality: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  artists: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 15c1.6.6 2.6 2.2 3 5" /></>,
  songs: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  channels: <><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" /><path d="M10 9.5v5l4.5-2.5z" /></>,
  charts: <path d="M5 20V10M10 20V4M15 20v-8M20 20v-5" />,
  corrections: <><path d="M12 8v4l3 2" /><path d="M3.5 12a8.5 8.5 0 102.5-6" /><path d="M3 3v4h4" /></>,
  requests: <><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></>,
  run: <><path d="M20 12a8 8 0 11-2.3-5.6" /><path d="M20 4v5h-5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  skip: <><path d="M5 5l8 7-8 7z" /><path d="M17 5v14" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  inbox: <><path d="M3.5 13.5l2.5-8h12l2.5 8v5a1 1 0 01-1 1h-15a1 1 0 01-1-1z" /><path d="M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5" /></>,
  shield: <path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z" />,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 18, className }: { name: IconName | string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      {P[name]}
    </svg>
  );
}
