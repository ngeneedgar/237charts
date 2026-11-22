# 237 Charts — hand-off for the next session (2026-11-22)

Read ROADMAP.md, README.md and admin/README.md first. Live: https://237charts.pages.dev · repo: github.com/ngeneedgar/237charts
Weekly automation: GitHub Actions every Monday 07:00 UTC + on admin/code pushes. First real chart: Mon 30 Nov 2026.
Push with: `C:\Program Files\Git\cmd\git.exe` (+ `$env:GCM_INTERACTIVE='always'`). Don't poll the GitHub API repeatedly (60/h anonymous limit) — check the live site instead.
Edit files with the Edit tool, never PowerShell Get/Set-Content (it corrupted UTF-8 once); `node -e` with quotes fails in PowerShell — write a script file instead.

## Done in this session (just before hand-off)
- Label channels: `admin/labels.csv` (New Bell Music: NewBellMusicChannel + New Bell Radio) — videos credited to the roster artist named in the title. Mumak dropped (Jovi left in 2013).
- Beat/instrumental/karaoke versions filtered in `collector/collect-youtube.mjs` ("BIG PAPA BEAT" out, "Big Papa" stays).
- HARD RULE (user, 2026-11-22): **Cameroonian nationals only; diaspora / dual nationals excluded.** `collector/check-nationality.mjs` → `collector/out/nationality.json`, applied in `lib/roster.mjs`. Dosseh, Yamê also in `admin/artists-remove.csv`.

## To do next (in order)
1. **Show the user the 31 artists the hard rule excluded** (output of `node collector/check-nationality.mjs`) — includes big names like Manu Dibango, Libianca, Henri Dikongué, Sally Nyolo, Tagne, Prince Nico Mbarga, Yannick Noah. User must confirm; add `check-nationality.mjs` to `run-week.mjs`; update methodology text (site `methodology/page.tsx` + `supabase/seed.sql`) with the hard rule.
2. **7 "not sure" artists** — RESEARCH THEM YOURSELF first (web search), then show the user a list with findings: Jiova Jiova, BALI ROOT, Momo Punchline, Khaly, Dydyfat, Winnerz, Obim1. Answers go in `admin/eligibility.csv`.
3. **Add a Gospel genre** (8th): `collector/lib/genres.mjs`, tile gradient in `web/app/[lang]/chart-tile.tsx`, seed.sql, methodology text. Tag gospel artists (Tim Storm, Zenobia Germoh…) in `admin/genres.csv`.
4. **Fix ALL-CAPS song titles** (e.g. "KIDNAPPE" → "Kidnappé"): prefer Deezer's title when available, else title-case in `lib/songs.mjs`.
5. Then: Jovi should now chart via New Bell Music — verify after the next run; channel song-search for the 21 new artists; privacy/terms pages; share images; domain.
