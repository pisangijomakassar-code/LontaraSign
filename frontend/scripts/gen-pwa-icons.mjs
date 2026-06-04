// Generate PWA icons dari SVG branding LontaraSign.
// Jalankan: node scripts/gen-pwa-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public", { recursive: true });

const INDIGO = "#2A3A7A";

// Mark putih di tengah (dipakai untuk semua ikon). viewBox 40x40.
const mark = (s = 40) => `
  <path d="M20 8 L32 20 L20 32 L8 20 Z" fill="#ffffff" fill-opacity="0.10" stroke="#ffffff" stroke-width="1.2"/>
  <path d="M13.5 13.5 Q 20 9.8, 26.5 13.5 Q 30.2 20, 26.5 26.5 Q 20 30.2, 13.5 26.5"
        stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" fill="none"/>
  <circle cx="13.5" cy="13.5" r="1.6" fill="#E0B43A"/>
  <circle cx="26.5" cy="26.5" r="1.6" fill="#E0B43A"/>`;

// Ikon biasa: background rounded + mark mengisi ~80%
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${INDIGO}"/>
  <g transform="translate(96 96) scale(8)">${mark()}</g>
</svg>`;

// Maskable: background penuh (no radius), mark di safe-zone tengah ~60%
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INDIGO}"/>
  <g transform="translate(128 128) scale(6.4)">${mark()}</g>
</svg>`;

const jobs = [
  { svg: iconSvg, size: 192, out: "public/pwa-192x192.png" },
  { svg: iconSvg, size: 512, out: "public/pwa-512x512.png" },
  { svg: iconSvg, size: 180, out: "public/apple-touch-icon.png" },
  { svg: maskableSvg, size: 512, out: "public/maskable-512x512.png" },
];

for (const j of jobs) {
  await sharp(Buffer.from(j.svg)).resize(j.size, j.size).png().toFile(j.out);
  console.log("Generated", j.out);
}
console.log("Done.");
