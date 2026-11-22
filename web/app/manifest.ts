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
    background_color: "#062012",
    theme_color: "#062012",
    icons: [
      { src: "/brand-icon/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand-icon/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand-icon/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
