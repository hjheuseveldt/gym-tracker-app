# Home screen / PWA icons

The mark is a **shiny silver arrow pointing up**, inside a **silver ring**, on a **white** square. Source artwork is `scripts/brand/ring-icon-source.jpg`.

`scripts/make-pwa-icons.mjs` crops that ring, flattens the JPEG background to pure white, and exports the sizes the manifest and `index.html` already reference.

Regenerate after replacing the source artwork:

```bash
npm run generate-icons
```

## Icon files (`public/`)

- `favicon.png` — 48×48
- `apple-touch-icon.png` — 180×180
- `icon-192.png`, `icon-512.png` — manifest `purpose: any` (ring ~84% of the canvas, so iOS's rounded mask keeps the metal intact)
- `icon-512-maskable.png` — same artwork at ~70% of the canvas so the ring stays inside Android's maskable safe zone; background is full-bleed white

Manifest `theme_color` / `background_color` stay `#F7FFFC` (see `manifest.json`, `index.html`). The icon squares themselves are white.

### After deploy — iOS

Safari aggressively caches shortcuts. Tell users **remove the old home screen icon and tap “Add to Home Screen” again** (or clear website data for the site).
