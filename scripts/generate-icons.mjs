import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <!-- 배경 -->
  <rect width="180" height="180" rx="40" fill="#292524"/>

  <!-- 주사위 면 (흰색 둥근 사각형) -->
  <rect x="20" y="20" width="140" height="140" rx="24" fill="#f5f5f4"/>

  <!-- 눈 (5면: 가운데+네 모서리) -->
  <!-- 좌상 -->
  <circle cx="54" cy="54" r="13" fill="#1c1917"/>
  <!-- 우상 -->
  <circle cx="126" cy="54" r="13" fill="#1c1917"/>
  <!-- 중앙 -->
  <circle cx="90" cy="90" r="13" fill="#1c1917"/>
  <!-- 좌하 -->
  <circle cx="54" cy="126" r="13" fill="#1c1917"/>
  <!-- 우하 -->
  <circle cx="126" cy="126" r="13" fill="#1c1917"/>
</svg>`;

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192.png',      size: 192 },
  { name: 'favicon-512.png',      size: 512 },
];

for (const { name, size } of sizes) {
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
  const out = resolve(__dirname, `../public/${name}`);
  writeFileSync(out, buf);
  console.log(`✓ ${name} (${size}x${size})`);
}
