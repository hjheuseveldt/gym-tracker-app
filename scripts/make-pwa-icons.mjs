/**
 * Builds BrickByBrick PWA / favicon PNGs from the ring artwork.
 * Run: npm run generate-icons
 *
 * Source of truth: scripts/brand/ring-icon-source.jpg (1280×720).
 * Measured on that file: ring center (640, 349), outer metal edge ~218px.
 * Exports sit on a pure white square. The ring fills most of the canvas,
 * with padding so iOS's rounded mask does not clip the metal. The maskable
 * icon keeps the same artwork inside Android's 80% safe zone.
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const SOURCE = path.join(__dirname, "brand", "ring-icon-source.jpg");

const CENTER_X = 640;
const CENTER_Y = 349;
/** Crop radius. Includes the antialiased rim, then the rest is forced white. */
const CROP_RADIUS = 224;
/** Pixels farther than this from the ring center are background, not metal. */
const KEEP_RADIUS = 220;

/** Ring diameter as a fraction of the icon canvas (any-purpose / Apple). */
const STANDARD_FRACTION = 0.84;
/** Smaller so the full ring stays inside the maskable safe zone. */
const MASKABLE_FRACTION = 0.7;

async function loadRingSquare() {
  const side = CROP_RADIUS * 2;
  const left = CENTER_X - CROP_RADIUS;
  const top = CENTER_Y - CROP_RADIUS;
  const { data, info } = await sharp(SOURCE)
    .extract({ left, top, width: side, height: side })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== side || info.height !== side || info.channels !== 3) {
    throw new Error("Unexpected source crop " + info.width + "x" + info.height + " c" + info.channels);
  }

  const out = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const dist = Math.hypot(x - CROP_RADIUS, y - CROP_RADIUS);
      const src = (y * side + x) * 3;
      const dst = (y * side + x) * 4;
      let r = data[src];
      let g = data[src + 1];
      let b = data[src + 2];
      const outside = dist > KEEP_RADIUS;
      const paperWhite = r >= 252 && g >= 252 && b >= 252;
      if (outside || paperWhite) {
        r = 255;
        g = 255;
        b = 255;
      }
      out[dst] = r;
      out[dst + 1] = g;
      out[dst + 2] = b;
      out[dst + 3] = 255;
    }
  }

  return sharp(out, { raw: { width: side, height: side, channels: 4 } }).png().toBuffer();
}

async function renderIcon(ringPng, size, ringFraction) {
  const diameter = Math.round(size * ringFraction);
  const resized = await sharp(ringPng).resize(diameter, diameter, { fit: "fill", kernel: "lanczos3" }).png().toBuffer();
  const pad = Math.floor((size - diameter) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await fs.mkdir(PUB, { recursive: true });
const ring = await loadRingSquare();

const outputs = [
  ["icon-512.png", 512, STANDARD_FRACTION],
  ["icon-192.png", 192, STANDARD_FRACTION],
  ["apple-touch-icon.png", 180, STANDARD_FRACTION],
  ["favicon.png", 48, STANDARD_FRACTION],
  ["icon-512-maskable.png", 512, MASKABLE_FRACTION],
];

for (const [name, size, fraction] of outputs) {
  const buf = await renderIcon(ring, size, fraction);
  await fs.writeFile(path.join(PUB, name), buf);
  console.warn(" wrote " + name + " (" + size + ", ring " + Math.round(fraction * 100) + "%)");
}

console.warn("PWA icons written to public/");
