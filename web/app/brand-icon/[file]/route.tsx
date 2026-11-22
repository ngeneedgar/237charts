// App / home-screen icons made at build time from the official white logo on the brand dark green:
//   /brand-icon/apple-touch-icon.png (180) · icon-192.png · icon-512.png · icon-maskable-512.png
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

const SIZES: Record<string, { size: number; pad: number; round: number }> = {
  "apple-touch-icon.png": { size: 180, pad: 0.16, round: 0 },   // iOS rounds the corners itself
  "icon-192.png": { size: 192, pad: 0.16, round: 0.22 },
  "icon-512.png": { size: 512, pad: 0.16, round: 0.22 },
  "icon-maskable-512.png": { size: 512, pad: 0.26, round: 0 },  // Android crops a circle/squircle: keep the logo in the safe zone
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((file) => ({ file }));
}

const LOGO = "data:image/svg+xml;base64," + Buffer.from(
  readFileSync(path.join(process.cwd(), "public/brand/logo-white.svg"), "utf8").replace(/<defs>[\s\S]*?<\/defs>/, "").replace(/class="cls-1"/g, 'fill="#fff"'),
).toString("base64");

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const { size, pad, round } = SIZES[file] ?? SIZES["icon-192.png"];
  const h = Math.round(size * (1 - 2 * pad));
  const w = Math.round(h * 724 / 774);
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#062012", borderRadius: Math.round(size * round) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} width={w} height={h} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
