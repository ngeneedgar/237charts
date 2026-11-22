# 237 Charts — Roadmap & Progress Tracker

**Theme:** v2 Quiet (light/dark, system font) + orange accent `#FF7A00`. Neon kept only for share images.
**Budget rule:** free tools only until store submission (Google $25, Apple $99/yr paid last).
**Status key:** `[ ]` to do · `[~]` in progress · `[x]` done
**Last updated:** 2026-11-21

---

## Phase 0 — Decisions & accounts (Week 0–1)
- [x] 0.1 Audit existing designs and docs
- [x] 0.2 Lock theme (v2 Quiet + orange accent)
- [x] 0.3 GitHub repo: https://github.com/ngeneedgar/237charts — project uploaded 2026-11-21
- [x] 0.4 ~~Supabase~~ not needed: the GitHub repo is the database/archive and admin/ is the admin panel
- [x] 0.5 Create free Cloudflare account (you) — connected 2026-11-21
- [x] 0.6 YouTube Data API key (in .env and GitHub secrets)
- [ ] 0.7 Buy domain — planned next week (you)

## Phase 1 — Data & backend (Week 1–4)
- [x] 1.1 Project setup: monorepo, folders, README
- [x] 1.2 Database schema: artists, songs, genres, channels, weeks, plays, scores, overrides (written; applied once Supabase exists)
- [x] 1.3 Seed data: genres (7) + methodology v1
- [~] 1.3a **Automatic artist discovery** (no manual lists)
  - [x] Source 1 — Wikidata: Cameroonian musicians + official YouTube/Spotify IDs (tested: 317 artists, 38 with YouTube)
  - [x] Source 2 — YouTube search (tested): YouTube has no Cameroon trending list, and genre-keyword search is noisy (content farms, e.g. "Amapiano x Makossa" channels from NG/ZA). Kept as **review-only, low confidence**
  - [x] Source 2b — Collaboration snowball (tested): 65 seed channels → 43 new candidates (e.g. Salatiel, missing from Wikidata). Mixed quality (also finds foreign features like Yemi Alade, Gunna) → **review queue**
  - [~] Source 3 — Channel matching, cheap-first (MusicBrainz → @handle → search): 279 checked · **72 auto-accepted · 43 review · 164 no match**; 141 still to search (daily search cap; resumes tomorrow)
  - [x] 3b — Wikidata stage names/aliases (175 artists, e.g. Adèle Ruffine Ngono = Lady Ponce)
  - [x] Rule: channel country is NOT an eligibility signal (~80% of mainstream artists register abroad for monetisation)
  - [ ] Source 4 — Audiomack Africa/Cameroon trending pages
  - [ ] Confidence routing: ≥ 0.90 auto-accept · 0.60–0.89 review queue · < 0.60 ignore
- [~] 1.3b **Candidate classifier** (`classify-candidates.mjs`): Wikidata/MusicBrainz nationality + Shazam charts in 7 other countries + co-credits. Diaspora-safe rules (foreign nationality never auto-rejects FR/US/BE/CA/GB/DE…)
  - Result on 218 candidates: 1 auto-accepted, 33 rejected (e.g. Fally Ipupa, uploader names), 184 undecidable from free data
  - [x] **Team review:** 134 of 143 answered (20 yes, 114 no) → saved in `collector/review-decisions.csv`, remembered forever. **21 new artists added to the roster** (`roster-extra.json`)
  - [x] Policy decided: **Cameroonian nationals only** (descent alone not eligible) → Yseult, Tayc = no. Written into methodology (FR/EN)
  - [ ] 7 still "not sure": Jiova Jiova, BALI ROOT, Momo Punchline, Khaly, Dydyfat, Winnerz, Obim1
  - [ ] "Cœurde de Noël" is a re-upload credit for Maman Nguéa Laroute → map to the real artist
  - [~] Find channels for the 21 new artists: cheap lookups found only La Santinelle (+ Ikardi Le Monument in review); a wrong match (VANITY FAIR → 4.9M-sub magazine channel) was blocked
  - [ ] **Song search** (built, not yet run): search "artist + charting song" → channel of that video. Needs search quota (resets overnight, ~2,100 units for 21 artists). Run: `node collector/match-channels.mjs 25`
- [x] 1.4 YouTube collector (`collect-youtube.mjs`): 109 channels → 883 eligible music videos, 178 units/run. Shorts + non-music skipped. First snapshot taken 2026-11-21
  - [ ] **First real chart: Monday 30 Nov 2026** (automatic run)
  - [ ] Known issue: a few channels post non-music videos tagged "Music" (e.g. Aurélien Bollevis Saniko) → needs artist-level review
  - [x] Merge versions of one song (clip, visualizer, lyric, audio) into one chart entry — 883 videos → 738 songs; stage names shown (Lady Ponce); 11/11 tests pass
  - [ ] Polish: ALL-CAPS titles ("KIDNAPPE" → "Kidnappé"); spot-check re-uploads of compilations
- [~] 1.5 Audiomack collector (`collect-audiomack.mjs`): built on the official Data API (profile matching + weekly plays). **Waiting on API access** — request emailed to support@audiomack.com on 2026-11-22 (follow up ~2 Dec if no reply). Docs show no lifetime play count on songs, only short-window metrics → play-data field to confirm with Audiomack; collector may need adapting
  - [ ] Add Audiomack plays to `build-week.mjs` (match songs to YouTube songs by artist + title)
  - [x] Fallback: scoring handles YouTube-only data (12/12 tests pass)
- [x] 1.5b **Shazam Cameroon Top 200** (`collect-shazam.mjs`): official public CSV, past 7 days, measured *inside Cameroon*. Tested: 200 entries, 10 by known artists, 177 new candidate artists → review
- [x] 1.5c **Deezer** (`collect-deezer.mjs`): free open API, no key. Tested: 54 artists auto-matched (51 review), 995 tracks with popularity rank
- [x] 1.5d Weights approved: **YouTube 50 · Shazam CM 25 · Deezer 25** (with Audiomack: 40/25/20/15); missing source → weights rescale. Shazam points #1=200…#200=1. All sources joined in `build-week.mjs` (13/13 tests)
  - [ ] Improve match rates: Deezer 77/995 tracks matched (much is old catalogue), Shazam 1/10 to YouTube songs (9 kept as Shazam-only songs)
- [x] Ruled out: Boomplay (blocks automated access), Spotify (no play counts, no CM chart), Apple Music feed (504, retry later)
- [x] 1.6 Scoring engine: `Score = 10,000 × Σ w_p × share`, weights 50/30/20 or 60/40 (`collector/lib/scoring.mjs`, 7 tests passing)
- [x] 1.7 Eligibility rules: 104-week window; recurrent (> 52 wks) songs stay on Overall only while in top 25 *(approved)*
- [x] 1.8 Anti-manipulation: spike > 5× the song's 4-week median (and ≥ 5,000) is capped at 3× and flagged "Adjusted for irregular activity" *(approved)*
- [x] 1.9 **Weekly automation on GitHub Actions** — every Monday 07:00 UTC (08:00 WAT) + on admin/code changes. Verified: run 44941163335 succeeded end-to-end (collect → build → tests → site → Cloudflare) in 112 s. Log saved to `collector/out/last-run.log`
  - [ ] Tidy: rename GitHub secret `CLOUDFLARE_API_TOKE` → `CLOUDFLARE_API_TOKEN` (workflow accepts both for now)
- [x] **Team admin without Claude:** `admin/` folder (eligibility, genres, add/remove artists, channels, contact) editable on github.com; edits trigger a run automatically
- [ ] 1.10 Public JSON feed: current chart, genre charts, song, artist, archive
- [x] 1.11 Admin without code: admin/ folder editable on github.com (eligibility, genres, artists, channels, contact); edits trigger a run
- [ ] 1.12 Dry run: generate first internal chart week and sanity-check it

## Phase 2 — Website (Week 3–7)
- [x] 2.1 Next.js 16 app (`web/`, static export for Cloudflare Pages) + v2 tokens (light/dark) + FR/EN routes (`/fr/`, `/en/`). Production build passes
- [~] 2.2 Home: No. 1 hero, Overall Top 10, share/embed buttons, tab bar, PREVIEW banner — built, checked at phone width (dark). Data from `collector/export-web.mjs`
  - [x] **Complete song data + official artwork** (`collector/enrich-songs.mjs`, Deezer API): 42/50 official covers, 3 YouTube thumbnails, 5 none. Adds all credited artists, album, release date, duration, ISRC, explicit flag, Deezer link. Matches checked by hand: correct
  - [ ] 5 songs without artwork (e.g. Tabaski, LES FRANGINS PONGO, LE DUO MAGIQUE) → retry after their YouTube channels are found
  - [x] **Eligibility from release dates:** release date = earliest of YouTube upload / Deezer release (compilations count as proof of age). 24 songs got an older date; "Coco carbure" (2015) and "You must calculer" now off the chart. Methodology text (FR/EN) updated
  - [ ] Artwork coverage after the change: 38/50 official, 4 YouTube thumbnail, 8 none (new entrants are smaller, less-catalogued songs)
  - [x] Genre charts as tiles on Home (7 genres, 3 per row)
  - [ ] Root `/` language redirect works only in the static build (404 in dev)
  - [ ] Week dates: align chart week to Mon–Sun (currently shows "15 nov.")
- [x] 2.3 Full chart Top 50 (`/fr/top-50/`) — every row links to its song page
- [~] 2.4 **Genre charts (Top 20 each)** — 7 genres: Makossa, Bikutsi, Mbolé, Njang, Afrobeats & Afropop, Hip Hop & Dancehall, Mboko
  - [x] Genre model (Spotify's approach: genre belongs to the artist, a song can override); auto-tagging from Wikidata + song titles + team list (`collector/genre-decisions.csv`); genre charts built in `build-week.mjs`
  - [x] Coverage: **50/50** Top-50 songs tagged (team list + research: Makounè → Makossa, Bend skin → Njang)
  - [x] Researched removals (`collector/roster-exclude.csv`): Aurélien Bollevis Saniko (not a musician), "Cœurde de Noël" (unverifiable credit)
  - [x] Researched additions: Maahlox (`roster-add.csv`); official channels for Jovi (@JoviLeMonstre) and Maahlox (`channels-manual.csv`)
  - [ ] **Jovi's label channels** (Mumak, New Bell Music) — find tomorrow with search allowance; his own channel alone (9.3M lifetime views) under-represents him
  - [ ] Instrumentals ("BIG PAPA BEAT") should not chart as songs → filter "beat/instrumental"
  - [ ] Dosseh: Wikidata says Cameroonian citizen; biographies say French, born in Orléans (Cameroonian/Togolese parents) → nationality unconfirmed under nationals-only rule
  - [ ] Decide: Gospel songs (no genre for them now — e.g. Tim Storm, Zenobia Germoh wrongly tagged Makossa by Wikidata)
  - [ ] Shey Lontum not in roster yet → research and add
  - [x] Genre pages on the website (`/fr/genre/<slug>/`, genre switcher chips) + Genres list on Home (each genre's No. 1) — build passes (346 pages)
  - [x] Embed page built (in Settings + Home button)
- [~] 2.4b **Viral chart (Top 20)** — scoring built + tested: songs ≤ 8 weeks old; 50% YouTube view growth + 50% Shazam Cameroon; newness multiplier (1.0 for weeks 0–2 → 0.4 at week 8). Based on Spotify's stated viral signals (growth, sharing, new listeners). **Approved 2026-11-21.** First viral chart needs 3 weekly snapshots (≈ 5 Dec). `/fr/viral/` page explains it until then; linked from Home
- [~] 2.5 Song detail (`/fr/song/<slug>/`, 100 pages): artwork, all artists, this week / last week / peak / weeks, album, release date, length, ISRC, YouTube + Deezer links. Checked on phone
  - [ ] Rank history sparkline + per-source numbers (needs more than one week of data)
- [~] 2.6 Artist profile (`/fr/artist/<slug>/`, 60 pages): charting songs, best peak. Bio/photo/official links not yet
- [x] 2.7 Archive page removed → calendar (week picker) on every chart page; past weeks appear from 30 Nov
- [x] 2.8 Search (`/fr/search/`): artists + songs on this week's chart, accent-insensitive, instant. Tested on phone (dark)
- [x] 2.9 Methodology v1.0 (FR/EN): formula, weights with bars, eligibility rules, irregular-activity rule, corrections log (empty). Checked on phone. Future plans removed: page states only rules in force
- [~] 2.9b **For artists** page (`/fr/artists/`): what artists can request, how requests are handled (7-day reply, proof, public corrections log, ranks never changed on request), request form that builds the message. Linked from footer, artist pages, methodology. Form tested on phone
  - [x] Contact set: WhatsApp +237 681 372 757 and corrections@237charts.com
  - [ ] **After buying 237charts.com:** set up free email forwarding (Cloudflare Email Routing) so corrections@237charts.com reaches your inbox — until then only WhatsApp works
- [x] 2.10 Settings page (language, theme, hide explicit, app notification placeholders, about) + chart info sheets
- [ ] 2.11 Empty, loading and error states
- [x] 2.12 Share: native share menu + fallback sheet ✔ · share images built every week (/share/<chart>/og|square|story.png), link previews per chart, "Share as image" button
- [x] 2.13 **Embed**: builder page (`/fr/embed/`: chart = Top 50 or any genre, Top 5/10, light/dark, FR/EN, live preview, copy code) + widget pages (`/fr/widget/<chart>/?n=&theme=`). Tested inside an outside test page (different origin): works. Every row links back to 237 Charts
  - [ ] WordPress shortcode needs a WordPress plugin — iframe code already works in WordPress "Custom HTML" block
  - [ ] Top 20/50 widgets, custom colours = Pro (Phase 4)
- [~] 2.14 SEO: page titles, descriptions, share previews (song pages use the official cover), sitemap.xml (172 URLs, FR/EN alternates), robots.txt, site address 237charts.com
  - [ ] Structured data (schema.org MusicRecording) — not done
- [~] 2.15 Installable app: manifest, app icons (192/512/maskable/Apple), theme colors. Offline mode not done
- [x] 2.16 Privacy policy + Terms pages (FR/EN) — /privacy, /terms, linked in footer + sitemap
- [x] 2.17 **Deployed: https://237charts.pages.dev** (Cloudflare Pages, 364 pages / 1,831 files). Checked live: home, Top 50, song, genre, widget, robots, manifest = 200; unknown page = 404; no console errors on phone. Hidden from Google while preview data is shown
- [ ] 2.18 Connect purchased domain
- [ ] 2.19 **Web launch (soft)**
- [ ] 2.20 Apply for YouTube API quota extension (free; needs live site + privacy policy)

## Phase 3 — Mobile app (Week 6–10)
- [ ] 3.1 Expo project, shared design tokens and feed client
- [ ] 3.2 Port core screens: Home, Charts, Song, Artist, Archive, Search, More
- [ ] 3.3 Push notification: "New chart is out" (weekly)
- [ ] 3.4 Offline cache of current chart
- [ ] 3.5 Deep links (site link opens app)
- [ ] 3.6 Home-screen widget (Top 5)
- [ ] 3.7 App icon + splash screen
- [ ] 3.8 Android test build (free, local)
- [ ] 3.9 iOS test build

## Phase 4 — Monetization, web only (Week 8–10, can follow launch)
- [ ] 4.1 Pricing page: Free vs Pro (3,500 FCFA/mo)
- [ ] 4.2 MoMo / Orange Money checkout via CinetPay or Notch Pay
- [ ] 4.3 Pro keys: Top 20/50 embeds, custom colours, JSON feed

## Phase 5 — Store submission (Week 10–12)
- [ ] 5.1 Pay Google Play ($25) and create the listing
- [ ] 5.2 Closed test with 12+ testers for 14 days (Google requirement)
- [ ] 5.3 Store assets: screenshots, feature graphic, FR/EN descriptions
- [ ] 5.4 Data safety form (Google) + privacy labels (Apple)
- [ ] 5.5 Pay Apple Developer ($99/yr) + TestFlight
- [ ] 5.6 Submit to Google Play
- [ ] 5.7 Submit to App Store
- [ ] 5.8 Fix review feedback, if any

## Phase 6 — Launch (Week 12)
- [ ] 6.1 Publish first official chart week
- [ ] 6.2 Share images on WhatsApp, Facebook, Instagram
- [ ] 6.3 Media/blog outreach with embed widget
- [ ] 6.4 Artist kit ("I'm on 237 Charts" graphics)

---

## Progress log
- **2026-11-21** — Audit done, theme locked (v2 Quiet), roadmap created.
- **2026-11-21** — Phase 1 started: README, database schema (`supabase/migrations/0001_schema.sql`), seed (genres + methodology v1).
- **2026-11-21** — Switched to automatic artist discovery. Wikidata source built and tested (317 Cameroonian artists found).
- **2026-11-21** — YouTube API key working. Tested YouTube search discovery: too noisy to auto-accept → review-only. Next: channel matching + collaboration snowball.
- **2026-11-21** — Built + tested channel matching (27/40 auto-matched) and collaboration snowball (43 candidates). 65 artists now have a trusted channel.
- **2026-11-21** — Cheap lookups added (stage names, MusicBrainz, @handle). Stricter scoring. **110 artists now have a trusted channel** (38 Wikidata + 72 matched). Channel country no longer penalised.
- **2026-11-21** — Scoring engine built: scores, eligibility, recurrent rule, anomaly capping, ranks with LW/Peak/Wks/NEW/RE. 7/7 tests pass.
- **2026-11-21** — Defaults approved. YouTube collector + chart builder built. First snapshot: 883 music videos from 109 channels. First real chart possible from 2026-11-28.
- **2026-11-21** — Song versions merged into single entries (883 videos → 738 songs); stage names used for display.
- **2026-11-21** — Audiomack collector built on the official API (no scraping). Needs a free API key to run.
- **2026-11-21** — Decided not to wait for Audiomack: chart launches YouTube-only (100% weight), Audiomack added later as a methodology update.
- **2026-11-21** — Found real second/third sources: Shazam Cameroon Top 200 (in-country) and Deezer (open API). Both collectors built and tested. Shazam reveals many current hit-makers missing from our roster.
- **2026-11-21** — Weights 50/25/25 approved and implemented; methodology text (FR/EN) updated; dry run combines all three sources.
- **2026-11-21** — Candidate classifier built (diaspora-safe). Team answered 134 names → 21 new Cameroonian artists added to roster.
- **2026-11-21** — Phase 2 started: Next.js site scaffolded, Home screen built with preview data, FR/EN, light/dark. Phase 1 still open: weekly automation (1.9), database/feed (1.10–1.11), song search for new artists.
