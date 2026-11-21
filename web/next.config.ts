import type { NextConfig } from "next";

// Static export → plain HTML/CSS/JS in out/, hosted free on Cloudflare Pages.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
