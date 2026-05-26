/**
 * Renders navy-silver PWA / favicon PNGs from inline SVG via sharp.
 * Run: npm run generate-icons
 *
 * Uses the same dumbbell icon as the Gainz tab (IGainz from icons.jsx),
 * rendered as thick silver strokes on the CTA gradient background.
 *
 * Palette: CTA gradient #2A3040 → #1A1F2E → #121620
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
  var rOuter = maskable ? 88 : 108;
  var rInner = rOuter - 10;
  var rInnerHi = rOuter - 16;

  var motifScaleFull = 16;
  var motifScale = maskable ? motifScaleFull * 0.72 : motifScaleFull;

  var gOpen = '<g transform="translate(256,256) scale(' + motifScale + ') translate(-12,-12)" fill="url(#silver)" stroke="url(#silver)" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">';
  var gClose = "</g>";

  var g = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
    "<defs>",
    '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
    '<stop offset="0%" stop-color="#2A3040"/>',
    '<stop offset="50%" stop-color="#1A1F2E"/>',
    '<stop offset="100%" stop-color="#121620"/>',
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
    '  <rect x="1.5" y="9.5" width="3.5" height="5" rx="1.2"/>',
    '  <rect x="5" y="7" width="3" height="10" rx="1.2"/>',
    '  <rect x="7.5" y="10.5" width="9" height="3" rx="1.5"/>',
    '  <rect x="16" y="7" width="3" height="10" rx="1.2"/>',
    '  <rect x="19" y="9.5" width="3.5" height="5" rx="1.2"/>',
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
