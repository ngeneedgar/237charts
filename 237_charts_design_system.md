---
name: "237 Charts — Bold Neon Night"
description: "High-contrast dark blue and neon orange design system for 237 Charts, Cameroon's weekly mobile-first music chart."
---

## Overview

**237 Charts** is Cameroon's weekly, code-computed music chart publishing the Top 50 overall and Top 20 per genre every Monday at 10:00 WAT. Built mobile-first for fans arriving from Facebook and WhatsApp links on everyday Android phones, the interface pairs a deep, commanding midnight-blue ground with electric neon-orange accents.

The visual language is **High-Contrast / Bold**: authoritative editorial data density tempered by punchy geometric display typography, crisp tabular numbers, and unmistakable movement indicators. Every number is attributed to its source, and every screen prioritizes fast scanning over decorative clutter.

## Colors

The palette anchors on a deep **Bold Navy** dark-mode canvas (`#0C1326`) that prevents text halation on OLED and budget LCD screens, layered with stepped blue-slate surface containers (`#141B2E` to `#2E3449`). **Neon Orange** (`#FF6B00`) is reserved for primary calls to action, #1 rank badges, active genre highlights, and key movement peaks.

- **Primary & Neon Orange:** Drives primary actions, #1 badges, and active tab indicators.
- **Secondary Blue:** Supports structural pills, platform links, and secondary actions.
- **Semantic Status:** Green (`#22C55E`) for upward rank movement, red (`#EF4444`) for downward movement, and neon orange (`#FF6B00`) for new entries and re-entries.

```yaml
colors:
  neon-orange: "#FF6B00"
  on-neon-orange: "#2D0E00"
  bold-navy: "#0C1326"
  chart-up: "#22C55E"
  chart-down: "#EF4444"
  chart-new: "#FF6B00"
  light:
    primary: "#A04100"
    on-primary: "#FFFFFF"
    primary-container: "#FF6B00"
    on-primary-container: "#572000"
    secondary: "#1D4ED8"
    on-secondary: "#FFFFFF"
    secondary-container: "#4069F2"
    on-secondary-container: "#FFFBFF"
    tertiary: "#0062A1"
    on-tertiary: "#FFFFFF"
    tertiary-container: "#059EFF"
    on-tertiary-container: "#003357"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
    error-container: "#FFDAD6"
    on-error-container: "#93000A"
    background: "#FAF8FF"
    on-background: "#141B2E"
    surface: "#FAF8FF"
    surface-dim: "#D3D9F4"
    surface-bright: "#FAF8FF"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F2F3FF"
    surface-container: "#EAEDFF"
    surface-container-high: "#E2E7FF"
    surface-container-highest: "#DBE1FD"
    on-surface: "#141B2E"
    surface-variant: "#FFDBCC"
    on-surface-variant: "#5A4136"
    outline: "#8E7164"
    outline-variant: "#E2BFB0"
  dark:
    primary: "#FFB693"
    on-primary: "#561F00"
    primary-container: "#FF6B00"
    on-primary-container: "#572000"
    secondary: "#B7C4FF"
    on-secondary: "#002682"
    secondary-container: "#0040CB"
    on-secondary-container: "#B2C0FF"
    tertiary: "#9CCAFF"
    on-tertiary: "#003257"
    tertiary-container: "#059EFF"
    on-tertiary-container: "#003357"
    error: "#FFB4AB"
    on-error: "#690005"
    error-container: "#93000A"
    on-error-container: "#FFDAD6"
    background: "#0C1326"
    on-background: "#DBE1FD"
    surface: "#0C1326"
    surface-dim: "#0C1326"
    surface-bright: "#32394D"
    surface-container-lowest: "#070D20"
    surface-container-low: "#141B2E"
    surface-container: "#181F33"
    surface-container-high: "#23293D"
    surface-container-highest: "#2E3449"
    on-surface: "#DBE1FD"
    surface-variant: "#5A4136"
    on-surface-variant: "#E2BFB0"
    outline: "#A98A7D"
    outline-variant: "#5A4136"
```

## Typography

**Red Hat Display** brings bold, geometric authority to chart titles, artist names, and #1 genre cards. **Commissioner** handles all body copy, methodology rules, and metadata with high legibility on compact viewports. **Red Hat Mono** anchors rank numerals, week codes (`2026-W47`), movement deltas, and embed snippets with `tabular-nums`.

```yaml
typography:
  display-lg:
    fontFamily: "Red Hat Display"
    fontSize: 44px
    fontWeight: 800
    lineHeight: 48px
    letterSpacing: -0.75px
  display-lg-mobile:
    fontFamily: "Red Hat Display"
    fontSize: 30px
    fontWeight: 800
    lineHeight: 34px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Red Hat Display"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 42px
    letterSpacing: -0.5px
  headline-lg-mobile:
    fontFamily: "Red Hat Display"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Red Hat Display"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 26px
    letterSpacing: -0.15px
  title-md:
    fontFamily: "Red Hat Display"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Commissioner"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: "Commissioner"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Commissioner"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: "Commissioner"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.4px
  mono-rank:
    fontFamily: "Red Hat Mono"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: -0.5px
  mono-sm:
    fontFamily: "Red Hat Mono"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0px
```

## Layout & Spacing

Mobile-first **Fluid Grid** targeting `390px` viewports with `16px` horizontal page margins and a `4px`/`8px` base spacing rhythm. Desktop expands into a centered `1200px` max-width container. Chart rows use tight vertical padding (`12px`) to keep Top 10 and Top 20 lists scannable without excessive scrolling.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 12px
  gutter-lg: 16px
  gutter-xl: 24px
  section: 32px
  page-margin: 16px
```

## Elevation & Depth

Hierarchy relies on **tonal surface layering** rather than heavy drop shadows. The base canvas (`#0C1326`) steps up to `surface-container-low` (`#141B2E`) for chart list containers, `surface-container` (`#181F33`) for interactive cards, and `surface-container-high` (`#23293D`) for active pills and sticky bars. Hairline borders use `outline-variant` at low visual weight only where rows or controls need crisp separation.

## Shapes

Cards and containers use crisp, modern corner radii (`12px` for feature cards, `8px` for chart rows and inputs, `9999px` for genre chips, language toggles, and movement pills).

```yaml
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
```

## Motion & Micro-interaction

Motion is crisp and immediate (`100ms` for tap feedback, chip switches, and row expansion; `200ms` for drawer or sheet entry). Only `transform`, `opacity`, and color properties animate.

```yaml
motion:
  state-change:
    duration: 100ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 200ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tone:** Proud, direct, transparent. Avoid hype or marketing fluff; let the data and movement speak.
- **Bilingual (FR / EN):** Every public screen supports instant French/English switching, with concise labels that fit mobile widths in both languages.
- **Source Attribution:** Every platform metric is explicitly labelled by source (e.g., `YouTube views this week`, `Audiomack plays`, `237 Charts points`). Spotify appears strictly as a `"Listen on Spotify"` link.
- **Global Audience Note:** Charts clearly state *"Cameroonian music, global audience"* so readers understand public platform counts are worldwide.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Tabs** → `@components/tabs.html`: `tabs-horizontal`, `tabs-with-icon`
