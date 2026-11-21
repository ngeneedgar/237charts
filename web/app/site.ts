// Public address of the site. Until 237charts.com is bought, builds set SITE_URL to the free
// Cloudflare address (https://237charts.pages.dev). Used in links, embed codes, sitemap, share previews.
export const SITE_URL = (process.env.SITE_URL ?? "https://237charts.com").replace(/\/$/, "");
