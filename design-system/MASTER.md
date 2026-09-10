# GymTrack — Design system master

Apple Health / Fitness **Soft Health** UI in light mode: mint-wash canvas, opaque white grouped cards, turquoise accent. Source: ui-ux-pro-max (Health & Wellness + Spatial UI) applied as a visual-only restyle.

## Material tiers

| Class | Use | Treatment |
|-------|-----|-----------|
| `.gt-card` | Habit rows, stat tiles, list rows, settings | Opaque white + soft gray hairline |
| `.gt-card-elevated` | Hero KPIs, calendar dropdown, centered modals | Opaque white + slightly deeper shadow |
| `.gt-card-done` | Completed habit row | Mint wash + deeper-teal rim |
| `.gt-sheet` | Bottom sheets (workout log, cycles, habits) | Opaque white + top-corner sheet |
| `.gt-scrim` | Modal overlays | Soft slate scrim (may still blur) |
| `.gt-glass` / `.gt-glass-strong` | Tab picker, floating chrome | Opaque white chrome (class names kept) |

Implementation: [`src/theme.css`](../src/theme.css). JS helper: `glassCard()` in [`src/App.jsx`](../src/App.jsx) (class wiring only; fills come from CSS).

Do **not** put dark glass fills on the light canvas.

## Color tokens (semantic)

| Token | Value | Usage |
|-------|-------|--------|
| Page base | `#F7FFFC` | Mint-wash canvas, `gt-page-bg` |
| Surface | `#FFFFFF` | Cards, sheets, inputs |
| Text | `#1A2332` | Primary copy on cards (~15:1) |
| Muted | `#5C6570` | Labels, secondary (~5.9:1 on white) |
| Accent | `#2EC4B6` | CTAs, selected tabs, progress, links, icons |
| Accent deep | `#14756C` | Accent text that needs stronger contrast; success ink |
| Border / separator | `rgba(26,35,50,0.16–0.22)` | Grouped-list hairlines |
| Success (habit done) | `#14756C` fill / `#E8F8F5` wash | Deeper teal — not neon green |

Legacy `C.panel` in JS is an opaque white fallback; surfaces should use `gt-card*` classes.

## Surface recipe

- **Fill:** solid white (or mint `#E8F8F5` for done), not translucent navy
- **Border:** 1px soft gray separator
- **Depth:** light shadow `0 6px 20px rgba(26,35,50,0.05)` (elevated: 28px)
- **Backdrop:** `-webkit-backdrop-filter` still declared for iOS / reduced-motion parity; opaque fills mean no dark glass shows through
- **`@supports not (backdrop-filter)`:** same opaque `--gt-surface`

## Typography

- **Headings:** DM Serif Display — sections, habit titles
- **UI:** DM Sans — labels, tabs, forms (`11–14px`, weights 600/700)

## Radius & elevation

- **Cards:** `14–18px` (habits `18px`)
- **Sheets:** top corners `28px`
- **Pills / nav:** `9999px`
- **Charts / checkboxes:** solid fills — no glass (readability). Teal / deeper-teal tints on the light canvas.

## Accessibility

- Body text: `C.text` / `C.muted` — target **4.5:1** on card surfaces
- Bright accent `#2EC4B6` is for fills, progress, and large/bold metrics; prefer `#14756C` when accent is small running text
- `prefers-reduced-motion`: reduce blur to `6px`, disable shimmer rotation
- Focus: `.gt-focus-ring`, 44px min tap targets
- No emoji as UI icons — SVG only

## Anti-patterns

- Dark glass fills (`bg-white/10`, navy gradients) on the mint canvas
- Neon green habit-done washes
- Glass on chart bars or tiny controls
- Duplicate borders on elements that already use `.gt-glass-strong`

## Components (quick ref)

- **Habits:** `.gt-card` / `.gt-card-done` + `.hab` motion; done checkbox = deeper teal + white check
- **Bottom nav:** `.gt-glass-strong` picker; launcher uses turquoise CTA (not glass)
- **Forms:** `.gt-input` (white field, teal caret / focus)
- **Coach:** user bubbles = `gradCTA`; assistant = `.gt-card`
