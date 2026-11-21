# 237 Charts

Cameroon's weekly music chart. Cameroonian music, global audience.

Progress: see [ROADMAP.md](ROADMAP.md).

## Layout

```
supabase/
  migrations/   Database schema (Postgres / Supabase), applied in order
  seed.sql      Genres, methodology v1, first chart week
collector/      Weekly data jobs: YouTube, Audiomack, scoring (Phase 1.4+)
web/            Next.js website + embeds (Phase 2)
app/            Expo mobile app (Phase 3)
(root)          Design systems, mockups, Stitch screens (reference only)
```

## Stack (all free tiers)

| Part | Tool |
|---|---|
| Database + API | Supabase (Postgres, row-level security) |
| Weekly jobs | GitHub Actions (cron) |
| Website | Next.js on Cloudflare Pages |
| Mobile | Expo (React Native) |

## Security model

- The public (website, app, embeds) can only **read** published chart data.
- Only the weekly job and admins write, using the Supabase service key,
  which is stored as a GitHub secret and never in code.

## Website: update and deploy

Live at **https://237charts.pages.dev** (Cloudflare Pages project `237charts`).

```powershell
node collector/export-web.mjs
cd web; $env:SITE_URL='https://237charts.pages.dev'; npx next build
npx wrangler@3 pages deploy out --project-name 237charts --branch main --commit-dirty=true
```

When 237charts.com is bought: add it as a custom domain on the Pages project and build with `SITE_URL=https://237charts.com`.
If `wrangler login` times out on Windows, run it with `$env:NODE_OPTIONS='--dns-result-order=ipv4first'`.

## Applying the schema

In the Supabase dashboard → SQL Editor, run each file in `supabase/migrations/`
in order, then `supabase/seed.sql`.
