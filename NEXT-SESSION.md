# 237 Charts — hand-off for the next session (2026-11-22, late)

Read ROADMAP.md, ADMIN-ROADMAP.md, README.md and admin/README.md first. Live: https://237charts.pages.dev · admin: https://237charts.pages.dev/admin/ (Cloudflare Access, team cold-sky-c44b) · repo: github.com/ngeneedgar/237charts
Push with: `C:\Program Files\Git\cmd\git.exe` (+ `$env:GCM_INTERACTIVE='always'`).

## Rules from the user (important)
- **Do NOT push until the user says "push".** Commit locally; every push triggers the weekly-run Action + deploy (GitHub limits). Before pushing: `git fetch; git rebase origin/main` (the bot commits "Weekly run" data).
- Cameroonian nationals only (hard rule). Research artist nationality yourself (web search) before asking the user; record decisions with a source in `admin/eligibility.csv`.
- Admin UI: neutral dark greys, green only for actions/status; font Google Sans Flex (Open Sans fallback), light weights. Public site uses the same font, weights and icon set (`web/app/admin/icons.tsx`).
- Edit files with Edit/Write tools; shell heredocs eat backslashes/template strings — write scripts to the scratchpad with the Write tool instead.

## State: 9 local commits NOT pushed (ahead 9, behind 1)
Includes: 23 researched + 143 sourced eligibility decisions (Tabaski & VANITY FAIR confirmed Cameroonian by the user; Cœurde de Noël → no) · public site font/icons · white text on green buttons (#237A40) · share images in brand dark green · No. 1 hero card · home order (hero → Top 10 → Top 20/50/Viral tiles → all 8 genres as cover + Top 3, per user sketch) · dedicated /genres page (Top 5 each) + Genres tab (4 tabs) · custom chart covers via Cloudflare R2.

## To do next
1. **Push when the user says so** (rebase first).
2. **R2 bucket for covers (user must do in Cloudflare, may ask for a card):** create bucket `237charts-covers`, then Pages → 237charts → Settings → Bindings → R2 bucket, variable `COVERS`. Code is ready: `web/functions/cover/[name].js` (public /cover/<chart>.jpg, transparent pixel when none), admin API `covers` routes, admin screen /admin/covers/ (crops to 1:1, 1080px). Until bound, site shows gradient covers.
3. **Open question to the user:** "manually update a chart" = (a) re-run now (exists on admin Overview; maybe add to Charts screen) or (b) edit positions by hand (conflicts with published methodology "never move a song on request").
4. Share images polish (suggested, not confirmed): use Google Sans Flex in images, less empty space in Story, highlight No. 1.
5. ~37 obscure names left in the review queue with no public source (see admin Review).
6. After Monday's run: check Jovi via New Bell Music, Gospel chart fills, Yamê gone from charts.
7. Audiomack Data API requested by email 2026-11-22 (support@audiomack.com) — when keys arrive: add AUDIOMACK_CONSUMER_KEY / _SECRET as GitHub secrets, test collect-audiomack.mjs, weights 40/25/20/15. Follow up ~2 Dec.
8. YouTube API quota extension form (privacy page exists now); domain (user buying).
