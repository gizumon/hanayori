#!/usr/bin/env node
'use strict';

/**
 * Generates PWA icons from public/logo.png using sharp (ships with Next.js).
 *
 * Outputs into public/icons/:
 *   - icon-192.png / icon-512.png  — transparent, purpose "any"
 *   - icon-192-maskable.png / icon-512-maskable.png — padded on a solid
 *     background so the logo survives the maskable safe-zone crop
 *   - apple-touch-icon.png (180) — opaque, padded (iOS has no maskable support)
 *
 * Regenerate after changing the logo: `npm run generate:icons`.
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('[icons] sharp is required. It normally ships with Next.js — run `npm install` first.');
  process.exit(1);
}

const SRC = path.join(__dirname, '..', 'public', 'logo.png');
const OUT = path.join(__dirname, '..', 'public', 'icons');

// Hanayori brand: warm cream background so the logo reads on any home screen.
const BG = { r: 0xff, g: 0xf9, b: 0xf5, alpha: 1 };

fs.mkdirSync(OUT, { recursive: true });

async function anyIcon(size) {
  // Slight inset keeps the mark off the very edge without a background.
  const inner = Math.round(size * 0.92);
  const logo = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function paddedIcon(size, pad, background) {
  // `pad` is the fraction of the canvas reserved as margin (per side sum).
  const inner = Math.round(size * (1 - pad));
  const logo = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  const jobs = [
    ['icon-192.png', await anyIcon(192)],
    ['icon-512.png', await anyIcon(512)],
    // Maskable safe zone is the centre 80%; keep ~30% total margin to be safe.
    ['icon-192-maskable.png', await paddedIcon(192, 0.3, BG)],
    ['icon-512-maskable.png', await paddedIcon(512, 0.3, BG)],
    ['apple-touch-icon.png', await paddedIcon(180, 0.18, BG)],
  ];
  for (const [name, buf] of jobs) {
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(`[icons] Generated ${name}`);
  }
}

main().catch((err) => {
  console.error('[icons] Failed:', err);
  process.exit(1);
});
