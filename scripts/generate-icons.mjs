import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const svg = readFileSync(join(rootDir, 'public', 'icon.svg'));

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(rootDir, 'public', `icon-${size}.png`));
  console.log(`Created icon-${size}.png`);
}

console.log('Done!');
