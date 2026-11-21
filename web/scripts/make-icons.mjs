// Generates the app icons from one SVG: orange square, white "237" over a small chart mark.
// Usage (from web/): node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = (pad) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#FF7A00"/>
  <g transform="translate(256 256) scale(${pad ? 0.78 : 1}) translate(-256 -256)">
    <text x="256" y="292" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="190" fill="#FFFFFF" letter-spacing="-6">237</text>
    <g fill="#FFFFFF" opacity="0.9">
      <rect x="176" y="352" width="28" height="44" rx="6"/>
      <rect x="226" y="330" width="28" height="66" rx="6"/>
      <rect x="276" y="342" width="28" height="54" rx="6"/>
      <rect x="326" y="316" width="28" height="80" rx="6"/>
    </g>
  </g>
</svg>`);

await mkdir("public/icons", { recursive: true });
await sharp(svg(false)).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg(false)).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg(true)).resize(512).png().toFile("public/icons/icon-maskable-512.png");
await sharp(svg(false)).resize(180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(svg(false)).resize(1200, 630, { fit: "contain", background: "#FF7A00" }).png().toFile("public/icons/og-default.png");
console.log("icons written to public/icons/");
