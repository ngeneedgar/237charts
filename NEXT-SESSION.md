# 237 Charts — hand-off for the next session (2026-11-22, evening)

Read ROADMAP.md, README.md and admin/README.md first. Live: https://237charts.pages.dev · repo: github.com/ngeneedgar/237charts
Weekly automation: GitHub Actions every Monday 07:00 UTC + on admin/code pushes. First real chart: Mon 30 Nov 2026.
Push with: `C:\Program Files\Git\cmd\git.exe` (+ `$env:GCM_INTERACTIVE='always'`). Don't poll the GitHub API repeatedly (60/h anonymous limit) — check the live site instead.
Edit files with the Edit tool, never PowerShell Get/Set-Content (it corrupted UTF-8 once); `node -e` with quotes fails in PowerShell — write a script file instead.
The user batches work: commit + push ONCE at the end of a session. The user is designing an admin dashboard in another chat — don't touch admin UI files.
Preview the static build with launch config `web-static` (port 3107, serves web/out after `npx next build`); port 3000 may be another chat's dev server.

## Done this session
- Hard rule wired in: `check-nationality.mjs` runs in `run-week.mjs`; user confirmed all 31 exclusions; methodology (site + seed.sql) says dual nationals are not eligible.
- 7 "not sure" artists → all `no` in `admin/eligibility.csv` (Dydyfat Ivorian, Obim1 likely Nigerian, 5 unconfirmed — can be flipped to yes if someone confirms they're Cameroonian).
- Gospel = 8th genre (genres.mjs, gold tile, seed.sql, methodology). Tagged: Tim Storm, Prosper & Zenobia Germoh, Prisca Benita (team) + AkuBai, Lab'l, Tubuo Evaristus, Queen Eteme (Wikidata; Queen Eteme is doubtful). Prisca Benita: one 2025 article calls her "from Canada" — nationality worth checking.
- ALL-CAPS titles: `fixCaps` / `bestTitle` in `lib/songs.mjs`; Deezer's spelling preferred when the YouTube title is ALL CAPS (`deezerTitle` in song-meta.json, backfilled). Tests in `collector/test/titles.test.mjs`.
- Privacy + Terms pages (`/privacy`, `/terms`, FR/EN, shared `legal.tsx`), in footer + sitemap. Unblocks ROADMAP 2.20 (YouTube quota extension).

## To do next
1. After Monday's run: check Jovi charts via New Bell Music; Gospel chart is filled; titles look right.
2. Channels for the 21 new artists: only La Santinelle (auto) + Ikardi Le Monument (review) so far. YouTube search quota hit 429 on 2026-11-22 — the weekly run does 25 searches; or find them by hand on YouTube and add to `admin/channels.csv`.
3. Share images (1200×630, 1080×1080, 1080×1920) — ROADMAP 2.12.
4. Apply for YouTube API quota extension (2.20) now that the privacy policy exists.
5. Domain (user buying it).
