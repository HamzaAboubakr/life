// Generates PWA app icons from an inline SVG. Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="36%" r="78%">
      <stop offset="0%" stop-color="#1B1E28"/>
      <stop offset="58%" stop-color="#0C0D12"/>
      <stop offset="100%" stop-color="#07080B"/>
    </radialGradient>
    <linearGradient id="ck" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6FE6F7"/>
      <stop offset="100%" stop-color="#26B2D6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <path d="M256 96 L394 176 L394 336 L256 416 L118 336 L118 176 Z"
        fill="none" stroke="rgba(52,206,233,0.16)" stroke-width="9"/>
  <path d="M172 258 L232 320 L346 192"
        fill="none" stroke="url(#ck)" stroke-width="40"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
</svg>`;

const buf = Buffer.from(svg);
mkdirSync('public', { recursive: true });
const jobs = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/icon-maskable.png', 512],
  ['public/apple-touch-icon.png', 180],
  ['public/favicon.png', 64],
];
for (const [file, size] of jobs) {
  await sharp(buf).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
console.log('done');
