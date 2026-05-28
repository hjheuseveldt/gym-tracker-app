# GymTrack — Design system master

Apple-style **dark glass** UI on navy–silver chrome (`#0B0E14` / `#F5F5F7`). Source: ui-ux-pro-max (Glassmorphism + Spatial UI on OLED dark base).

## Material tiers

| Class | Use | Blur / vibrancy |
|-------|-----|-----------------|
| `.gt-card` | Habit rows, stat tiles, list rows, settings | `blur(20px) saturate(165%)` |
| `.gt-card-elevated` | Hero KPIs, calendar dropdown, centered modals | `blur(32px) saturate(165%)` |
| `.gt-card-done` | Completed habit row glass | Strong blur + success rim |
| `.gt-sheet` | Bottom sheets (workout log, cycles, habits) | `blur(32px)` + sheet fill |
| `.gt-scrim` | Modal overlays | `blur(8px)` + scrim color |
| `.gt-glass` / `.gt-glass-strong` | Tab picker, floating chrome | Nav / launcher |

Implementation: [`src/theme.css`](../src/theme.css). JS helper: `glassCard()` in [`src/App.jsx`](../src/App.jsx).

## Color tokens (semantic)

| Token | Value | Usage |
|-------|-------|--------|
| Page base | `#0B0E14` | Canvas, `gt-page-bg` gradient |
| Text | `#F5F5F7` | Primary copy |
| Muted | `#8E8E93` | Labels, secondary |
| Accent | `#C8CCD4` | Icons, links, chrome |
| Border / glass rim | `rgba(255,255,255,0.14–0.2)` | Card edges (CSS), not heavy 1.5px everywhere |
| Success (habit done) | Navy `#222836` + silver rim | No green hue |

Legacy `C.panel` in JS is fallback only; surfaces should use `gt-card*` classes.

## Glass recipe

- **Fill:** translucent white 10–14% on gradient navy wash
- **Border:** 1px light rim + `inset 0 1px 0 rgba(255,255,255,0.14)`
- **Depth:** soft shadow `0 8px 32px rgba(0,0,0,0.42)` (elevated: 40px spread)
- **Backdrop:** `-webkit-backdrop-filter` required for iOS Safari

## Typography

- **Headings:** DM Serif Display — sections, habit titles
- **UI:** DM Sans — labels, tabs, forms (`11–14px`, weights 600/700)

## Radius & elevation

- **Cards:** `14–18px` (habits `18px`)
- **Sheets:** top corners `28px`
- **Pills / nav:** `9999px`
- **Charts / checkboxes:** solid fills — no glass (readability)

## Accessibility

- Text on glass: `C.text` / `C.muted` — target **4.5:1** on card surfaces
- `prefers-reduced-motion`: reduce blur to `6px`, disable shimmer rotation
- `@supports not (backdrop-filter)`: opaque `--gt-surface` fallback
- Focus: `.gt-focus-ring`, 44px min tap targets
- No emoji as UI icons — SVG only

## Anti-patterns

- Glass on chart bars or tiny controls
- Replacing habit “done” semantics with green washes
- Light-mode `bg-white/10` cards on dark (too faint)
- Duplicate borders on elements that already use `.gt-glass-strong`

## Components (quick ref)

- **Habits:** `.gt-card` / `.gt-card-done` + `.hab` motion
- **Bottom nav:** `.gt-glass-strong` picker; launcher uses gradient CTA (not glass)
- **Forms:** `.gt-input` (frosted field)
- **Coach:** user bubbles = `gradCTA`; assistant = `.gt-card`
