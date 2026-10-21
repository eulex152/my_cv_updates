// Crops source/photo.jpg to a square around the face and writes web-optimized copies.
// Usage: npm run build:photo
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'source/photo.jpg');
const out = path.join(root, 'assets/img');

const { width, height } = await sharp(src).metadata();
const side = Math.min(width, height);
// Portrait photo: keep a little headroom above the hair instead of a centered crop.
const top = Math.max(0, Math.min(height - side, Math.round((height - side) * 0.3)));
const left = Math.round((width - side) / 2);
const square = () => sharp(src).extract({ left, top, width: side, height: side });

await square().resize(320, 320, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(out, 'photo.webp'));
await square().resize(320, 320, { withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, 'photo.jpg'));
console.log(`photo: ${width}x${height} -> max 320x320 (crop top=${top})`);
