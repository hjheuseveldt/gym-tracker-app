# GymTrack — UX & React supplement (ui-ux-pro-max excerpts)

_Static excerpts synthesized from [.cursor/skills/ui-ux-pro-max/data/ux-guidelines.csv](../.cursor/skills/ui-ux-pro-max/data/ux-guidelines.csv) and [stacks/react.csv](../.cursor/skills/ui-ux-pro-max/data/stacks/react.csv) — use during implementation._

## UX priorities applied

| Topic | Guidance |
|-------|-----------|
| Reduced motion | `prefers-reduced-motion`: skip canvas confetti/ripple loops; shorten or disable entrance chains (`.hab`, `.glow`). |
| Focus | Visible `focus-visible` rings on tabs, pills, checklist, calendar days. Do not rely on `:focus { outline: none }` alone. |
| Touch | Minimum interactive targets ~44×44 where feasible; spacing between strips. |
| Contrast | Body/muted pairs meet ~4.5:1 where possible on warm off-white backgrounds. |
| Color-only meaning | Completed days + workout heat use shape/icon in addition to color. |

## React implementation notes

- Animations isolated in canvas `useEffect` with early exit when motion reduced — avoids unnecessary RAF.
- Preserve existing list keys; avoid re-sorting flicker during habit completion (`sortRdy` pattern kept).
- Heavy UI remains in single file intentionally; extraction optional per MASTER Phase 4.
