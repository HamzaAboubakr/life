// Generates PWA app icons from the user's icon artwork, used AS-IS.
// Source: ~/Documents/newicon.webp (falls back to ~/Downloads/newicon.png).
// Steps: detect the icon tile against its backdrop -> crop -> fill the rounded
// corners with the tile's own background color -> resize. No redrawing.
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const candidates = [
  join(homedir(), 'Documents', 'newicon.webp'),
  join(homedir(), 'Downloads', 'newicon.png'),
  join(homedir(), 'Downloads', 'newicon.webp'),
];
const src = candidates.find(existsSync);
if (!src) { console.error('No icon file found. Looked for:', candidates.join(', ')); process.exit(1); }
console.log('Using icon:', src);

// --- 1. find the tile's bounding box (pixels differing from the corner backdrop) ---
const img = sharp(src).ensureAlpha();
const { width, height } = await img.metadata();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;
const px = (x, y) => { const i = (y * info.width + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
const bg = px(2, 2);
const differs = (c) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > 24;

let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
for (let y = 0; y < info.height; y += 2) {
  for (let x = 0; x < info.width; x += 2) {
    if (differs(px(x, y))) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
// square it up around the detected tile
const w = maxX - minX, h = maxY - minY;
const size = Math.min(Math.max(w, h), Math.min(width, height));
const cx = minX + w / 2, cy = minY + h / 2;
const left = Math.max(0, Math.round(cx - size / 2));
const top = Math.max(0, Math.round(cy - size / 2));
const side = Math.min(size, width - left, height - top);
console.log(`detected tile: ${w}x${h} at (${minX},${minY}) -> crop ${side}x${side} at (${left},${top})`);

const cropped = await sharp(src).extract({ left, top, width: side, height: side }).png().toBuffer();

// --- 2. fill the rounded corners with the tile's own background color ---
const tile = await sharp(cropped).extract({ left: Math.round(side * 0.5), top: Math.round(side * 0.06), width: 4, height: 4 })
  .raw().toBuffer();
const fill = `rgb(${tile[0]},${tile[1]},${tile[2]})`;
const r = Math.round(side * 0.235);
const mask = Buffer.from(`<svg width="${side}" height="${side}"><rect width="${side}" height="${side}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
const masked = await sharp(cropped).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
const squared = await sharp({ create: { width: side, height: side, channels: 4, background: fill } })
  .composite([{ input: masked }]).png().toBuffer();
console.log('corner fill:', fill);

// --- 3. emit the icon set ---
mkdirSync('public', { recursive: true });
for (const [file, px2] of [
  ['public/icon-192.png', 192], ['public/icon-512.png', 512],
  ['public/icon-maskable.png', 512], ['public/apple-touch-icon.png', 180], ['public/favicon.png', 64],
]) {
  await sharp(squared).resize(px2, px2, { fit: 'cover' }).png().toFile(file);
  console.log('wrote', file);
}
console.log('done');
