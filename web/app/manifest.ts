import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Lets phones install the site like an app (Add to Home Screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "237 Charts",
    short_name: "237 Charts",
    description: "Le classement hebdomadaire de la musique camerounaise · Cameroon's weekly music chart",
    start_url: "/fr/",
    display: "standalone",
    background_color: "#F2F2F7",
    theme_color: "#FF7A00",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
