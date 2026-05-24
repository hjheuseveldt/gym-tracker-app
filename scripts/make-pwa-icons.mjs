/**
 * Renders navy-silver PWA / favicon PNGs from inline SVG via sharp.
 * Run: npm run generate-icons
 *
 * Dumbbell matches IconDumbbellMark (src/icons.jsx): stroke-only plates + horizontal bar,
 * viewBox 0 0 24 24 centered on the 512 canvas. Plates are drawn first; the center bar is
 * last with a thicker stroke so it survives rasterization at 48px / 180px.
 *
 * Palette: C.bg #0B0E14, sheet #141824, lift #1A1F2E, accent #C8CCD4, highlight #E8EAEF
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

var __dirname = path.dirname(fileURLToPath(import.meta.url));
var ROOT = path.join(__dirname, "..");
var PUB = path.join(ROOT, "public");

function svgIcon(opts) {
  var maskable = opts.maskable === true;
  /** Rounded-square tile; motif smaller for adaptive safe zone when maskable (~72%). */
  var rOuter = maskable ? 88 : 108;
  var rInner = rOuter - 10;
  var rInnerHi = rOuter - 16;

  /** User-space scale from 24×24 icon → centered on canvas */
  var motifScaleFull = 16;
  var motifScale = maskable ? motifScaleFull * 0.72 : motifScaleFull;
  /** Plate stroke (user units × motifScale → ~11px on 512 master) */
  var swPlateNum = 11 / motifScale;
  var swPlate = String(swPlateNum.toFixed(3));
  /** Bar: thicker so thin horizontals survive sharp resize to 48px / 180px */
  var swBarNum = Math.max(18 / motifScale, swPlateNum * 1.38);
  var swBar = String(swBarNum.toFixed(3));

  var gOpen = '<g transform="translate(256,256) scale(' + motifScale + ') translate(-12,-12)">';
  var gClose = "</g>";

  var silver = ' stroke="url(#silver)" fill="none" stroke-linecap="round" stroke-linejoin="round"';

  var g = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
    "<defs>",
    '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
    '<stop offset="0%" stop-color="#1A1F2E"/>',
    '<stop offset="48%" stop-color="#141824"/>',
    '<stop offset="100%" stop-color="#0B0E14"/>',
    "</linearGradient>",
    '<linearGradient id="silver" x1="0%" y1="0%" x2="0%" y2="100%">',
    '<stop offset="0%" stop-color="#E8EAEF"/>',
    '<stop offset="55%" stop-color="#C8CCD4"/>',
    '<stop offset="100%" stop-color="#9EA4AF"/>',
    "</linearGradient>",
    "</defs>",
    '<rect width="512" height="512" rx="' + String(rOuter) + '" ry="' + String(rOuter) + '" fill="url(#bg)"/>',
    '<rect x="10" y="10" width="492" height="492" rx="' + String(rInner) + '" fill="none" stroke="rgba(212,216,224,0.48)" stroke-width="2.5"/>',
    '<rect x="14" y="14" width="484" height="484" rx="' + String(rInnerHi) + '" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.75"/>',
    gOpen,
    /** Plates underneath (IconDumbbellMark rects) */
    '  <rect x="2" y="8" width="5" height="8" rx="1.5"' + silver + ' stroke-width="' + swPlate + '"/>',
    '  <rect x="17" y="8" width="5" height="8" rx="1.5"' + silver + ' stroke-width="' + swPlate + '"/>',
    /** Center bar on top — explicit line so it isn’t obscured */
    '  <line x1="5" y1="12" x2="19" y2="12"' + silver + ' stroke-width="' + swBar + '"/>',
    gClose,
    "</svg>",
  ].join("");

  return g;
}

async function writePng(rel, svgString, px) {
  var out = path.join(PUB, rel);
  await sharp(Buffer.from(svgString)).resize(px, px, { fit: "fill" }).png({ compressionLevel: 9 }).toFile(out);
  console.warn(" wrote " + rel + " (" + px + ")");
}

await fs.mkdir(PUB, { recursive: true });

var full = svgIcon({ maskable: false });
var mask512 = svgIcon({ maskable: true });

await writePng("icon-512.png", full, 512);
await writePng("icon-192.png", full, 192);
await writePng("apple-touch-icon.png", full, 180);
await writePng("favicon.png", full, 48);
await writePng("icon-512-maskable.png", mask512, 512);

console.warn("PWA icons written to public/");
