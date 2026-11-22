import type { MetadataRoute } from "next";
import chart from "@/data/chart.json";
import { SITE_URL } from "./site";

export const dynamic = "force-static";

// While the site shows preview (test) data, keep search engines out so test rankings never appear on Google.
export default function robots(): MetadataRoute.Robots {
  if (chart.preview) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: "/admin/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
