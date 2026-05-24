# Home screen / PWA icons

Design matches in-app navy–silver chrome (no legacy green/violet accents).

The mark uses **stroke-outline plates** (`fill="none"`) like **`IconDumbbellMark`**, plus a **filled rounded-rect shaft** (`fill="url(#silver)"`) drawn on top — the shaft spans roughly **x = 3→21** so it stays clearly visible after export at **48×48** and **180×180** (a thin stroke on the plate midline blended into the rims).

## Palette

| Token    | Hex / value |
|----------|-------------|
| Base     | `#0B0E14`   |
| Mid      | `#141824`   |
| Lift     | `#1A1F2E` → `#141824` (background gradient stops) |
| Accent   | `#C8CCD4`   |
| Highlight| `#E8EAEF`   |
| Rim      | `rgba(212,216,224,0.48)` |

Source graphic is programmatic SVG in **`scripts/make-pwa-icons.mjs`** (navy diagonal gradient, stroke plates + filled silver handle, inset rim).

Regenerate raster assets after editing the SVG:

```bash
npm run generate-icons
```

## Icon files (`public/`)

- `favicon.png` — 48×48
- `apple-touch-icon.png` — 180×180  
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — Manifest / adaptive

Adaptive `icon-512-maskable.png` uses the same motif at **~72%** scale for the maskable safe zone.

Manifest references `theme_color` / `background_color` **`#0B0E14`** (see `manifest.json`, `index.html`).

### After deploy — iOS

Safari aggressively caches shortcuts. Tell users **remove the old home screen icon and tap “Add to Home Screen” again** (or clear website data for the site).
