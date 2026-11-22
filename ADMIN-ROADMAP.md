# 237 Charts — Admin Dashboard Roadmap

**Goal:** the 237 Charts team runs the chart from one private web dashboard instead of editing CSV files on github.com: reviewing new artists, fixing data, checking the weekly chart before it goes out, and answering artists.
**Status key:** `[ ]` to do · `[~]` in progress · `[x]` done
**Written:** 2026-11-22 · Design work happens in a separate chat. This file is the shared plan.

---

## Today: how admin work is done (what the dashboard replaces)

| Task today | Where | Pain |
|---|---|---|
| Is an artist Cameroonian? | `admin/eligibility.csv` | Hand-typed names; no evidence shown next to the decision |
| Artist genre | `admin/genres.csv` | Must remember genre codes; no preview |
| Add / remove artist | `admin/artists-add.csv`, `artists-remove.csv` | No search; typos create new artists |
| Official channels | `admin/channels.csv`, `admin/labels.csv` | Channel IDs found by hand on YouTube |
| Review queue (new names from Shazam etc.) | `collector/out/review-queue.csv` | Must download the CSV, answer, re-upload |
| Nationality exclusions (hard rule) | `collector/out/nationality.json` | Visible only by running a script |
| Contact for artist requests | `admin/contact.json` | — |
| Weekly run status | GitHub Actions + `last-run.log` | Technical; no "is this week's chart OK?" check |
| Corrections log | Methodology page text | Written by hand; no history |

---

## Key decision: architecture (decide first)

**Recommended: "Git-backed admin". The repo stays the database.**
- A private admin app (Next.js route group or separate Cloudflare Pages project) reads and writes the same `admin/*` files through the **GitHub API**. Every save becomes a commit, which already triggers the weekly run. You keep the full history and undo for free, with no new database to pay for or secure.
- Login: **Cloudflare Access** in front of the admin URL (free up to 50 users, email one-time code or Google). No passwords stored by us.
- Writes go through a small **Cloudflare Worker** that holds a GitHub token with access to this repo only, never in the browser.

Alternative: Supabase (schema already written in `supabase/migrations`). Better once there are many editors, real-time edits or app users, but it means moving the collector to a database first. Revisit in Phase D.

- [x] A0.1 Architecture: Git-backed + Cloudflare Access (built 2026-11-22)
- [ ] A0.2 List the team members and their roles (see Roles) — **you**
- [ ] A0.3 Admin URL (e.g. `admin.237charts.com` once the domain is bought) — **you**

---

## Roles

| Role | Can do |
|---|---|
| **Owner** | Everything, including team, methodology version, contact settings |
| **Editor** | Eligibility, genres, artists, channels, review queue, corrections |
| **Viewer** | See dashboard, chart preview and run status; no changes |

The hard rule (Cameroonian nationals only) is enforced by the system and **cannot be overridden** by any role. An editor can only add evidence that someone is a national.

---

## Go-live setup — done 2026-11-22 (GitHub token + ADMIN_TEAM secrets in Pages; Access app "237 Charts Admin" on team cold-sky-c44b protecting /admin and /api/admin)
The admin is built into the site at `/admin/`; it only works once these are set:
1. **GitHub token:** github.com → Settings → Developer settings → Fine-grained tokens → new token, repository *ngeneedgar/237charts* only, permissions **Contents: Read and write** + **Actions: Read and write**.
2. **Cloudflare Pages** → project *237charts* → Settings → Variables and secrets (Production):
   - `GITHUB_TOKEN` (secret) = the token above
   - `ADMIN_TEAM` (secret) = `[{"email":"you@example.com","name":"Edgar","role":"owner"}]` (add each member; roles: owner / editor / viewer)
   - `ACCESS_TEAM` = your Zero Trust team name, `ACCESS_AUD` = the application's audience tag (step 3)
3. **Cloudflare Zero Trust** → Access → Applications → Add → Self-hosted: domain `237charts.pages.dev`, paths `/admin` **and** `/api/admin`; policy "Allow" → emails of the team; login method one-time PIN (and/or Google). Copy the *Application Audience (AUD) tag*.
4. Push → the next deploy includes the admin. Open `https://237charts.pages.dev/admin/`.
Local testing: `web/.dev.vars` (not committed) signs you in as a test owner with saves in test mode; run the `admin-local` preview (port 8788) after `npx next build`.

## Phase A — Foundation (week 1)
- [x] A1 Design system for admin: reuse site tokens (green theme, light/dark), dense table layout, desktop-first but usable on phone
- [x] A2 App shell: sidebar (Overview, Review, Artists, Songs, Channels, Charts, Corrections, Requests, Settings), top bar with run status + user
- [x] A3 Cloudflare Access login + roles — code done (JWT verified in the function); roles live in the `ADMIN_TEAM` secret, **not** a repo file (the repo is public, emails must not be in it). Needs setup below
- [x] A4 Worker API (`web/functions/api/admin/[[path]].js`): read file, write file (one commit per save, message "Admin: <who> — <what>"), list recent admin commits
- [x] A5 Audit trail: every change shows who, when, what changed, and why (required reason field on every edit)

## Phase B — Daily work screens (weeks 2–3)
- [x] **B1 Overview** (`/admin/`; YouTube quota not shown yet — not tracked by the run): next run countdown, last run result (OK / failed + reason), items waiting for review, artists without a channel, YouTube quota used
- [x] **B2 Review queue** (`/admin/review/`): one card per candidate showing songs, chart ranks, countries it charts in, Wikidata/MusicBrainz facts, web links. Buttons: *Cameroonian* / *Not eligible* / *Skip*, with a source field. Replaces `review-queue.csv` → writes `eligibility.csv`
- [x] **B3 Artists** (`/admin/artists/`: search, filters, genre change, add/remove; artist detail page not yet): searchable table (name, stage names, genre, nationality status, channels, songs charting). Artist page: edit genre, aliases, channels; add/remove with reason
- [x] **B4 Nationality panel** (`/admin/nationality/`): list of artists excluded by the hard rule with their citizenships and source. Read-only, with "report wrong data" that opens a correction on Wikidata
- [x] **B5 Channels** (`/admin/channels/`; paste only resolves UC… IDs, not @handles): artists without a channel, suggested matches from `channel-matches.json` (accept / reject), label channels (`labels.csv`), paste-a-URL to get the channel ID automatically
- [~] **B6 Genres** (artist genre on Artists, song genre on Songs; no separate Genres page): genre list with artist counts; drag or pick genre per artist; song-level override (e.g. a gospel song by a makossa artist)

## Phase C — Chart control (weeks 3–4)
- [~] **C1 Chart preview** (`/admin/charts/`: shows the current chart with scores; a held draft before publish needs the run split into collect/publish): this week's Top 50 / genre / Viral charts as they will appear, with movement vs last week and each song's score breakdown (YouTube / Shazam / Deezer)
- [x] **C2 Flags to check**: songs capped for irregular activity, new entries from unverified channels, beat/instrumental versions, ALL-CAPS or messy titles, missing artwork
- [x] **C3 Song fixes** (`/admin/songs/` → `admin/song-fixes.csv`, applied in build-week; split not built): edit display title, merge duplicate songs, split wrongly merged ones, set release date, hide a non-song upload. Each fix is a logged correction
- [ ] **C4 Publish control**: "Approve & publish" (or auto-publish Monday 08:00 WAT if nobody blocks), "Re-run now", "Hold this week" with a public notice
- [~] **C5 Corrections log** — admin page done (`/admin/corrections/`); public Methodology version not yet: generated from the audit trail and published automatically on the Methodology page (replaces the hand-written text)

## Phase D — Artists & growth (weeks 5–6)
- [x] **D1 Artist requests inbox** (`/admin/requests/`, Cloudflare KV `237charts-requests` bound as REQUESTS; deleted 180 days after done): requests from the "For artists" page (wrong song, missing channel, wrong genre) in one list with status (new → in progress → done) and reply template
- [x] **D2 Request form on the site** (Send button on For artists; WhatsApp/email kept as fallback) that feeds D1 (replaces email/WhatsApp only)
- [ ] **D3 Data health**: Deezer/Shazam match rates, sources down this week, quota trends
- [ ] **D4 Revisit Supabase** if there are >5 editors or the app needs live data

## Phase E — Business (with monetization, Phase 4 of ROADMAP.md)
- [ ] E1 Pro widget customers (colours, domains) and invoices
- [ ] E2 Basic analytics (page views per chart, shares), privacy-friendly, update the Privacy page first
- [ ] E3 Methodology versions: draft → review → publish with changelog (owner only)

---

## Screens checklist for the design chat

| # | Screen | Phase | Main data |
|---|---|---|---|
| 1 | Login (Cloudflare Access) | A | — |
| 2 | Overview | B | run log, review count, quota |
| 3 | Review queue (card view) | B | review-queue, candidate-review.json |
| 4 | Artists list | B | roster, eligibility, genres |
| 5 | Artist detail | B | roster, channels, songs |
| 6 | Nationality exclusions | B | nationality.json |
| 7 | Channels & labels | B | channels.csv, labels.csv, channel-matches.json |
| 8 | Genres | B | genres.mjs, genres.csv |
| 9 | Chart preview + flags | C | chart-preview.json, song-meta.json |
| 10 | Song detail / fix | C | chart + song-meta |
| 11 | Publish / run control | C | GitHub Actions |
| 12 | Corrections log | C | audit trail |
| 13 | Artist requests inbox | D | request form |
| 14 | Settings (team, contact, roles) | A/D | team.json, contact.json |

**States to design for every screen:** loading, empty, error (GitHub/API down), saving, saved (with undo), no permission (viewer).

---

## Rules the dashboard must respect
1. Cameroonian nationals only; dual nationals are excluded. This can't be changed in the UI.
2. Ranking weights and windows are the published methodology and can't be edited (only Owner can start a new version, Phase E).
3. Every manual change needs a reason and becomes public in the corrections log.
4. Never store passwords or API keys in the browser.
5. Keep the `admin/` files readable by hand. GitHub editing must keep working as a fallback.
