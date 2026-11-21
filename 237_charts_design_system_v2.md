---
name: "237 Charts — Quiet"
description: "Apple-style design system for 237 Charts, Cameroon's weekly music chart. Content first, one accent, system type, light and dark."
---

# 237 Charts — Design System

## Principles

1. **Content is the interface.** Rank, title, artist. Everything else earns its place or goes.
2. **One accent.** Orange marks what you can tap and the No. 1. Nothing else is orange.
3. **Hierarchy through type, not boxes.** Size and weight do the work; cards and borders are rare.
4. **Native feel.** System fonts, grouped lists, hairline separators, large titles that collapse on scroll.
5. **Light by default, dark when the phone says so.** Follow `prefers-color-scheme`.

What we removed from v1: the 60-token Material palette, three typefaces, neon glows, pills on every label, tinted surfaces, icon fonts, decorative badges.

## Color

Eleven tokens. That is the whole palette.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F2F2F7` | `#000000` | Page background (grouped) |
| `surface` | `#FFFFFF` | `#1C1C1E` | Grouped list / card |
| `fill` | `#7878801F` | `#7878803D` | Segmented control, pressed state |
| `label` | `#000000` | `#FFFFFF` | Primary text |
| `label-2` | `#3C3C4399` | `#EBEBF599` | Secondary text (artist, meta) |
| `label-3` | `#3C3C434D` | `#EBEBF54D` | Tertiary (footnotes, "—") |
| `separator` | `#3C3C4349` | `#54545899` | 0.5px hairlines |
| `accent` | `#FF7A00` | `#FF8A1F` | Links, buttons, No. 1, selected state |
| `up` | `#34C759` | `#30D158` | Rank rose |
| `down` | `#FF3B30` | `#FF453A` | Rank fell |
| `new` | `= accent` | `= accent` | NEW / RE |

Rules: never put text on orange smaller than 17px semibold. Movement colors are only ever text, never fills.

## Typography

One family: the system stack. `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, system-ui, sans-serif`. Inter is the Android/Windows fallback (load 400/600/700 only). All numbers use `font-variant-numeric: tabular-nums`.

| Style | Size / Line | Weight | Tracking |
|---|---|---|---|
| Large Title | 34 / 41 | 700 | 0.37px |
| Title 2 | 22 / 28 | 700 | 0.35px |
| Headline | 17 / 22 | 600 | -0.41px |
| Body | 17 / 22 | 400 | -0.41px |
| Subhead | 15 / 20 | 400 | -0.24px |
| Footnote | 13 / 18 | 400 | -0.08px |
| Caption | 12 / 16 | 400 | 0 |
| Section header | 13 / 18, uppercase | 400 | 0 (`label-2`) |

No monospace. Ranks are Title 2 / Headline in tabular figures.

## Spacing & layout

8pt grid: `4 8 12 16 20 24 32 44`. Page margin 16 (20 at ≥ 390px). Grouped lists are inset 16 with 10px corner radius. Row minimum height 44; chart rows 60. Desktop: single column, max width 680, centered — a chart is a list, not a dashboard.

## Shape & depth

Radius: `10` grouped lists, `14` hero card, `8` artwork, `full` only for the segmented thumb. No shadows except the floating tab bar, which uses material blur: `backdrop-filter: saturate(180%) blur(20px)` over `surface` at 72% opacity, with a top hairline.

## Motion

Standard spring feel: `cubic-bezier(0.25, 0.1, 0.25, 1)`, 250ms. Pressed rows dim to `fill` instantly (no delay), release in 200ms. Respect `prefers-reduced-motion`.

## Components

**Navigation bar.** Large title ("Charts") left, a single control right (FR/EN as a two-segment control). Collapses to 17pt inline title with blur on scroll.

**Segmented control.** `fill` track, `surface` thumb with a soft 0 3px 8px rgba(0,0,0,.12) shadow, 13pt semibold labels. Used for week ‹ › and language.

**Hero (No. 1).** One card, not seven. Artwork 88px, "No. 1 this week" in accent Footnote, title in Title 2, artist in Subhead `label-2`, meta line in Footnote `label-3`. A single "Listen" text button.

**Grouped list row (chart row).** `rank (28px column, Headline, tabular) · artwork 44px r8 · title (Body) / artist (Subhead label-2) · movement (Footnote, right)`. Hairline separator inset to the title. Whole row is tappable; no play buttons per row.

**Movement.** Text only: `▲ 2`, `▼ 1`, `NEW`, `RE`, `—`. Colored per tokens above.

**Genre list.** A grouped list, not a carousel: genre name left, No. 1 song in `label-2` right, chevron. Seven rows read faster than seven swipe cards.

**Buttons.** Primary: filled accent, white 17 semibold, 50px tall, radius 12 — at most one per screen. Everything else is a plain accent text button.

**Tab bar.** 4 items, SF-style line icons (inline SVG, 1.5px stroke), 10pt labels, selected = accent.

**Footnote block.** Methodology and attribution live in `label-3` Footnote below the last group, like Settings footers.

## Voice

Short, factual, bilingual. "Week of 16 Nov" not "🔥 This week's HOTTEST". Every metric names its source ("YouTube views", "Audiomack plays"). "Cameroonian music, global audience" appears once, in the footer.

## Content realism

Sample data in mockups must be clearly fake (invented artists) or real data with a source. Do not pair real artists with invented song titles — it reads as misinformation in a chart product.
