import type { Metadata, Viewport } from "next";
import { SITE_URL } from "../site";
import chart from "@/data/chart.json";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, locales } from "./dictionaries";

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
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
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
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F2F2F7" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }],
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
