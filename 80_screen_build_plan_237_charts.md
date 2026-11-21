# 237 Charts — 80% Screen Build Plan

**Theme:** Orange Neon (`#FF6B00`) + Bold Dark Blue (`#0C1326`)  
**Target Platform:** Mobile-first (`390px` primary, responsive to desktop)  
**Scope:** **9 of 11 screens (82%)** from the *Cameroon Weekly Music Charts* workflow brief.

---

## Screen Inventory & Build Order

### Foundation + Key Screen *(Delivered Now)*
1. **Design System (`DESIGN.md` + Component Kit)** — Bold dark-blue surface hierarchy, neon-orange primary accents, Red Hat Display / Commissioner / Red Hat Mono typography, FR/EN bilingual conventions.
2. **Home (`screens/home/Home.html`)** — Header with 237 Charts mark, FR/EN toggle, and week picker (`Week of 16 Nov 2026`); horizontal swipeable **No. 1 of Each Genre** typographic cards (Afro/Afropop, Rap/Urban, Makossa, Bikutsi, R&B/Afro-zouk, Gospel, Traditional & roots); **Overall Top 10** scannable rows with rank, movement delta, title, artist, and play action; *"Share this chart"* and *"Put this chart on your site"* CTAs; *"Cameroonian music, global audience"* attribution footer.

---

### Batch 1 — Core Chart Discovery & Entity Pages *(3 screens)*
3. **Genre Chart — Top 20 (`screens/genre-chart/GenreChart.html`)**
   - Full Top 20 list (e.g. *Top 20 Makossa*) with genre switcher tabs.
   - Row data: large mono rank, movement arrow (`▲ +3`, `▼ -1`, `NEW`, `RE`), `LW · Peak · Wks` stats, listen buttons (YouTube, Audiomack, Spotify), optional `"Adjusted for irregular activity"` badge.
   - Tap-to-expand row drawer showing source-labelled weekly numbers (`YouTube views`, `Audiomack plays`, `237 Charts points`).
   - Sticky bottom share bar (WhatsApp, Facebook, Copy Link).
4. **Song Detail (`screens/song-detail/SongDetail.html`)**
   - Rank history sparkline across weeks, current/peak/weeks-on-chart summary.
   - Per-platform breakdown strictly labelled by source (Spotify shown as *"Listen on Spotify"* link only).
   - Eligibility & anomaly adjustment status with link to Methodology.
5. **Artist Profile (`screens/artist-profile/ArtistProfile.html`)**
   - Verified Cameroonian artist badge + published eligibility basis.
   - Current charting entries, historical chart peaks, and official channel links.

---

### Batch 2 — Archive & Transparency *(2 screens)*
6. **Chart Archive (`screens/archive/Archive.html`)**
   - Week picker back to the first chart (`2026-W47` → `W01`), filterable by genre.
   - Quick-view No. 1 snapshot cards for each historical week.
7. **Methodology & Override Log (`screens/methodology/Methodology.html`)**
   - Versioned ranking formula (`Score = 10,000 × Σ w_p × share`), platform weights (`50/30/20` with Spotify, `60/40` without).
   - Eligibility rules (104-week window, 52-week recurrent rule, official channels only) & anti-manipulation rules.
   - Public human override log with timestamps and reasons.

---

### Batch 3 — Distribution, Embeds & Monetization *(3 screens)*
8. **Widget Builder (`screens/widget-builder/WidgetBuilder.html`)**
   - Controls for chart/genre, size (`Top 5 / 10 / 20`), theme (`Dark / Light`), and language (`FR / EN`).
   - Live interactive preview + one-tap copy `<iframe>` and WordPress `[237charts]` shortcode.
9. **Embed Widget (`screens/embed-widget/EmbedWidget.html`)**
   - Compact `300px` sidebar and full-width embed views showing ranks, movement, and listen links (no raw YouTube counts) + *"Chart by 237 Charts"* backlink.
10. **Pricing & Mobile Money Checkout (`screens/pricing-checkout/PricingCheckout.html`)**
    - Free (`0 FCFA`, Top 5/10, backlink) vs Pro (`3,500 FCFA/mo`, Top 20/50, custom colors, co-branding, JSON rank feed).
    - Instant MTN MoMo & Orange Money checkout flow via local aggregator.

---

## Remaining 20% *(Phase 2 — After Core 9)*
- **Social Share Image Templates** (`1200×630` OG link preview, `1080×1080` feed post, `1080×1920` story).
- **Admin Review Queue** (internal moderation screen for 0.60–0.89 confidence artist/genre/merge items).
