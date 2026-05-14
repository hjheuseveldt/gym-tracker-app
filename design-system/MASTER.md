# GymTrack — Design system master

_Source: ui-ux-pro-max corpus (Fitness/Gym + Wellness blending, Soft UI Evolution), adapted for GymTrack’s pastel green aesthetic. Generated without running `search.py` (Python unavailable in environment); aligns with [.cursor/skills/ui-ux-pro-max/SKILL.md](../.cursor/skills/ui-ux-pro-max/SKILL.md) workflow._

## Product pattern

- **Pattern:** Feature-rich + data-forward (calendar, workouts, streaks, cycles).
- **Style priority:** Soft UI evolution + accessibility (readable contrast, clear focus).
- **Motion:** Micro-interactions 150–220ms; one primary celebratory canvas effect at a time; respect `prefers-reduced-motion`.

## Color tokens

| Token | Hex | Usage |
|-------|-----|--------|
| Background | `#FAF9F6` | App canvas |
| Surface | `#FFFFFF` | Cards, sheets |
| Text | `#1A2922` | Headings/body primary |
| Muted | `#526B60` | Secondary labels (WCAG-aware on `#FAF9F6`) |
| Border | `#D5E9DF` | Hairlines |
| Primary | `#4CC774` | Actions, fills |
| Primary dark | `#3AB860` | Gradients mid |
| Tint green | `#E8F9EE` | Completed row wash |
| Mid green | `#A8E6BC` | Borders, accents |
| Error bg | `#F2E4E4` | Alerts (optional) |

## Typography

- **Headings:** DM Serif Display — section titles (`26–28`), habit names prominent.
- **UI:** DM Sans — labels, pills, tabs (`11–14`), weights 600/700.

## Radius & elevation

- **Cards:** `16–22px`
- **Pills:** `9999px`
- **Nav bar picker:** Floating with `gap` from safe area (~18–24px from bottom).
- **Shadow (rest):** `0 2px 9–14px rgba(26, 41, 34, 0.06–0.09)`
- **Shadow (elevated FAB):** green-tint shadow with faint outer ring.

## Components

### Bottom navigation (`TabPicker`)

- Active: primary fill + white icon/text.
- Inactive: translucent with scale; **focus-visible**: 3px ring.
- Icons: SVG only (consistent 22px view box).

### Today / habits

- Row: checklist target **44×44**; title + streak hierarchy; emoji allowed as **habit avatar** only.
- Progress micro-bar under title for week visualization.

### Calendars (`CalView`, `UnifiedCalendar`)

- Today: outline ring (`2px primary`).
- Done: filled primary + **checkmark SVG** (not bare “v” text alone).
- Non-color cues: icons in layer pills/KPI strips.

### Forms (sheets)

- Labels associated with controls (`htmlFor` / `id`).
- Focus: visible ring `3px rgba(74,199,116,0.45)`.

## Icons policy

| Context | Treatment |
|---------|-----------|
| Tab bar, FAB, KPI pills, chrome | SVG only |
| Habit picker / habit row | Emoji allowed as user-facing “avatar” |

## Anti-patterns (avoid)

- Emoji as the only semantic marker in dashboard KPIs — use SVG + label.
- Neon orange/purple gradients (Fitness/Gym trope conflicts with GymTrack calm brand).
- Long UI transitions (>350ms).

## Page overrides

Add page-specific Markdown under [`pages/`](./pages/) only when a screen consciously diverges (not required for MVP).
