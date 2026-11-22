import type { Metadata, Viewport } from "next";
import { SITE_URL } from "../site";
import chart from "@/data/chart.json";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, locales } from "./dictionaries";

const PREFS_SCRIPT = `try{var p=JSON.parse(localStorage.getItem('237prefs')||'{}'),r=document.documentElement;
if(p.theme==='light'||p.theme==='dark')r.dataset.theme=p.theme;
if(p.explicit==='hide')r.dataset.explicit='hide';}catch(e){}`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const description = lang === "en"
    ? "Cameroon's weekly music chart. Cameroonian music, global audience."
    : "Le classement hebdomadaire de la musique camerounaise. Musique camerounaise, audience mondiale.";
  return {
    metadataBase: new URL(SITE_URL),
    title: "237 Charts",
    description,
    applicationName: "237 Charts",
    icons: { icon: { url: "/icons/favicon.jpg", type: "image/jpeg" }, apple: "/icons/favicon.jpg" },
    openGraph: {
      siteName: "237 Charts", type: "website", locale: lang === "en" ? "en_GB" : "fr_CM",
      description, images: [{ url: "/icons/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    // Preview data must not be indexed
    ...(chart.preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#EEF4F0" }, { media: "(prefers-color-scheme: dark)", color: "#07170F" }],
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    // suppressHydrationWarning: the script below sets data-theme / data-explicit before React loads
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Apply saved Settings before first paint (no flash of the wrong theme) */}
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@200..700&family=Open+Sans:wght@300..700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
