#!/usr/bin/env node
'use strict';

/**
 * Generates every brand icon from assets/logo-source.png using sharp (ships with Next.js).
 *
 * The source is the logo artwork on a transparent background. This script bakes it
 * onto the rose brand background, because the artwork itself is pale line art that
 * would disappear on a white browser tab or home screen.
 *
 * Outputs:
 *   public/logo.png                  — ブランドロゴ（ピンク円）
 *   public/icons/icon-{192,512}.png  — purpose "any"（ピンク円・背景は透過）
 *   public/icons/icon-*-maskable.png — purpose "maskable"（全面ピンク・セーフゾーン考慮）
 *   public/icons/apple-touch-icon.png (180) — 全面ピンク（iOS が角丸にする）
 *   public/icons/logo-mark.png       — 透過のマーク（アプリ内の BrandMark 用）
 *   src/app/favicon.ico              — 16/32/48。ロゴ全体は 16px で潰れるので花びらだけを使う
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

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'logo-source.png');
const ICONS = path.join(ROOT, 'public', 'icons');

// Brand rose (COLOR.accentPale → COLOR.accentRose). Keep in sync with src/lib/palette.ts.
const BG_FROM = '#E2B6C3';
const BG_TO = '#C393A5';

/** マークの高さがキャンバスに占める割合。 */
const RATIO = {
  /** ピンク円の内側に収まる上限 */
  circle: 0.62,
  /** maskable のセーフゾーン（中央 80%）に収まる値 */
  maskable: 0.55,
};

/**
 * マークの版面（1024x1024 の元画像座標）。
 *
 * 単純に trim すると右へ張り出した羽根ペンの分だけ枠が右に伸び、中央に置いたとき
 * マークが左へずれる。便箋の左右の罫（x=268 / x=756）と不透明度の重心はどちらも
 * x≒512 を指すので、そこを中心にした箱で切り出す。
 */
const MARK_BOX = { left: 231, top: 223, width: 562, height: 574 };

/** ロゴ全体のうち花びらだけを切り出す領域（同じく元画像座標）。 */
const PETALS_CROP = { left: 330, top: 305, width: 340, height: 330 };

const gradient = (size) => `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${BG_FROM}"/>
      <stop offset="100%" stop-color="${BG_TO}"/>
    </linearGradient>
  </defs>`;

function squareBg(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${gradient(size)}
    <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`;
  return Buffer.from(svg);
}

function circleBg(size) {
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${gradient(size)}
    <circle cx="${r}" cy="${r}" r="${r}" fill="url(#g)"/></svg>`;
  return Buffer.from(svg);
}

/**
 * 線画（便箋の罫・羽根ペン）かどうか。ベージュ = 橙寄りの色相で、
 * ピンクの花びらとは緑成分と青成分の差で見分けられる。
 */
function isLinePixel(r, g, b) {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return chroma > 4 && g - b > chroma * 0.35;
}

/** ピクセルごとに書き換える。`fn` が [r,g,b,a] を返す。 */
async function remap(src, fn) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += info.channels) {
    const px = fn(data[i], data[i + 1], data[i + 2], data[i + 3]);
    [out[i], out[i + 1], out[i + 2], out[i + 3]] = px;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer();
}

/**
 * ピンク地に載せるマークを白へ塗り替える。原画の淡いベージュ／ピンクのままだと
 * ピンク地に埋もれて線が読めないため。
 *
 * 線画は不透明な白にして輪郭を立たせ、花びらは元の濃さに応じた半透明の白にする。
 * こうすると二枚が重なった部分だけが濃く残り、ロゴの重なりのニュアンスが白でも生きる。
 */
function whiten(mark) {
  return remap(mark, (r, g, b, a) => {
    if (a === 0) return [255, 255, 255, 0];
    if (isLinePixel(r, g, b)) return [255, 255, 255, a];
    // 濃いピンクほど濃い白に。原画の階調（0.81〜0.94）を 0.65〜1.0 に伸ばす。
    const lightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const opacity = Math.min(1, Math.max(0.65, 0.65 + (0.93 - lightness) * 3));
    return [255, 255, 255, Math.round(a * opacity)];
  });
}

/**
 * 線画を消してピンクの花びらだけを残す。favicon の切り出し矩形には羽根ペンの先が
 * わずかに掛かっていて、そのままだと 32px 以下でゴミにしか見えない。
 */
function petalsOnly(src) {
  return remap(src, (r, g, b, a) => (isLinePixel(r, g, b) ? [r, g, b, 0] : [r, g, b, a]));
}

/** 背景の中央にマークを重ねる。`ratio` はマークの高さ / キャンバス。 */
async function stamp(bg, mark, size, ratio) {
  const inner = await sharp(mark)
    .resize({ height: Math.round(size * ratio) })
    .toBuffer();
  return sharp(bg)
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toBuffer();
}

/**
 * PNG を格納した ICO を組み立てる。ICO は PNG をそのまま抱えられて、
 * 対応していないブラウザはもう存在しない。
 *
 * エントリは大きい順に並べる。Next.js は favicon.ico の先頭エントリを見て
 * `<link rel="icon" sizes="...">` を書き出すので、16 が先頭だと 16x16 と宣言され、
 * 高 DPI の環境で 16px 版を引き伸ばされてしまう。
 */
function buildIco(frames) {
  frames = [...frames].sort((a, b) => b.size - a.size);
  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  let offset = HEADER + ENTRY * frames.length;
  const entries = frames.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[icons] Source not found: ${path.relative(ROOT, SRC)}`);
    process.exit(1);
  }
  fs.mkdirSync(ICONS, { recursive: true });

  // 原画のマーク。淡いクリーム地に載る BrandMark はこの色のまま使う。
  const mark = await sharp(SRC).extract(MARK_BOX).png().toBuffer();
  // sharp は 1 パスの中で trim を extract より先に適用してしまうので、切り出しは 2 段に分ける。
  const cropped = await petalsOnly(await sharp(SRC).extract(PETALS_CROP).png().toBuffer());
  // ピンク地に載るアイコンは白版を使う。
  const markW = await whiten(mark);
  const petalsW = await whiten(await sharp(cropped).trim().png().toBuffer());

  const jobs = [
    ['public/logo.png', await stamp(circleBg(1024), markW, 1024, RATIO.circle)],
    ['public/icons/icon-192.png', await stamp(circleBg(192), markW, 192, RATIO.circle)],
    ['public/icons/icon-512.png', await stamp(circleBg(512), markW, 512, RATIO.circle)],
    ['public/icons/icon-192-maskable.png', await stamp(squareBg(192), markW, 192, RATIO.maskable)],
    ['public/icons/icon-512-maskable.png', await stamp(squareBg(512), markW, 512, RATIO.maskable)],
    ['public/icons/apple-touch-icon.png', await stamp(squareBg(180), markW, 180, RATIO.circle)],
    // BrandMark は最大 140px 表示なので 3x で十分。パレット PNG にして軽くする（40KB → 10KB）。
    [
      'public/icons/logo-mark.png',
      await sharp(mark).resize({ height: 420 }).png({ palette: true, colours: 128, effort: 10 }).toBuffer(),
    ],
  ];

  const frames = [];
  // 64 は高 DPI で 32px 枠に使われる。
  for (const size of [16, 32, 48, 64]) {
    frames.push({ size, data: await stamp(circleBg(size), petalsW, size, 0.52) });
  }
  jobs.push(['src/app/favicon.ico', buildIco(frames)]);

  for (const [rel, buf] of jobs) {
    fs.writeFileSync(path.join(ROOT, rel), buf);
    console.log(`[icons] Generated ${rel}`);
  }
}

main().catch((err) => {
  console.error('[icons] Failed:', err);
  process.exit(1);
});
