import type { Metadata, Viewport } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "237 Charts Admin",
  robots: { index: false, follow: false },
  icons: { icon: "/icons/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#03100A" };

// The admin is its own root layout: dark only, separate from the public site.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@200..700&family=Open+Sans:wght@300..700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
