import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.resolve('src/assets/images');
const PUBLIC_LOGOS_DIR = path.resolve('public/logos');
const PUBLIC_DIR = path.resolve('public');

if (!fs.existsSync(PUBLIC_LOGOS_DIR)) {
  fs.mkdirSync(PUBLIC_LOGOS_DIR, { recursive: true });
}

// Locate files
const files = fs.readdirSync(ASSETS_DIR);
const baseFile = files.find(f => f.startsWith('logo_base_') && f.endsWith('.jpg'));
const winterFile = files.find(f => f.startsWith('logo_winter_raw_') && f.endsWith('.jpg'));
const springFile = files.find(f => f.startsWith('logo_spring_raw_') && f.endsWith('.jpg'));
const summerFile = files.find(f => f.startsWith('logo_summer_raw_') && f.endsWith('.jpg'));
const fallFile = files.find(f => f.startsWith('logo_fall_raw_') && f.endsWith('.jpg'));

console.log('Found files:', { baseFile, winterFile, springFile, summerFile, fallFile });

/**
 * Remove background connected from borders
 */
async function processImage(inputPath, outputPath, bgType = 'black', threshold = 35, softness = 40) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const numPixels = width * height;
  
  const visited = new Uint8Array(numPixels);
  const queue = new Int32Array(numPixels);
  let head = 0;
  let tail = 0;

  function isBgColor(idx) {
    const r = data[idx * channels];
    const g = data[idx * channels + 1];
    const b = data[idx * channels + 2];
    
    if (bgType === 'black') {
      const maxC = Math.max(r, g, b);
      return maxC <= threshold + softness;
    } else {
      const minC = Math.min(r, g, b);
      return minC >= (255 - threshold - softness);
    }
  }

  // Push all border pixels that match background criteria
  for (let x = 0; x < width; x++) {
    const topIdx = x;
    const botIdx = (height - 1) * width + x;
    if (isBgColor(topIdx) && !visited[topIdx]) {
      visited[topIdx] = 1;
      queue[tail++] = topIdx;
    }
    if (isBgColor(botIdx) && !visited[botIdx]) {
      visited[botIdx] = 1;
      queue[tail++] = botIdx;
    }
  }

  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    const rightIdx = y * width + (width - 1);
    if (isBgColor(leftIdx) && !visited[leftIdx]) {
      visited[leftIdx] = 1;
      queue[tail++] = leftIdx;
    }
    if (isBgColor(rightIdx) && !visited[rightIdx]) {
      visited[rightIdx] = 1;
      queue[tail++] = rightIdx;
    }
  }

  // BFS to mark all connected outer background
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && isBgColor(nIdx)) {
          visited[nIdx] = 1;
          queue[tail++] = nIdx;
        }
      }
    }
  }

  // Apply alpha transparency to visited background pixels
  for (let i = 0; i < numPixels; i++) {
    const idx = i * channels;
    if (visited[i]) {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (bgType === 'black') {
        const brightness = Math.max(r, g, b);
        if (brightness <= threshold) {
          data[idx + 3] = 0; // Fully transparent
        } else {
          // Soft transition at borders
          const alpha = Math.min(255, Math.round(((brightness - threshold) / softness) * 255));
          data[idx + 3] = alpha;
        }
      } else {
        const darkness = 255 - Math.min(r, g, b);
        if (darkness <= threshold) {
          data[idx + 3] = 0;
        } else {
          const alpha = Math.min(255, Math.round(((darkness - threshold) / softness) * 255));
          data[idx + 3] = alpha;
        }
      }
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved transparent PNG: ${outputPath}`);
}

async function run() {
  if (baseFile) {
    await processImage(path.join(ASSETS_DIR, baseFile), path.join(PUBLIC_LOGOS_DIR, 'logo-base.png'), 'black', 25, 30);
  }
  if (winterFile) {
    await processImage(path.join(ASSETS_DIR, winterFile), path.join(PUBLIC_LOGOS_DIR, 'logo-winter.png'), 'black', 28, 35);
  }
  if (springFile) {
    await processImage(path.join(ASSETS_DIR, springFile), path.join(PUBLIC_LOGOS_DIR, 'logo-spring.png'), 'black', 28, 35);
  }
  if (summerFile) {
    await processImage(path.join(ASSETS_DIR, summerFile), path.join(PUBLIC_LOGOS_DIR, 'logo-summer.png'), 'black', 28, 35);
  }
  if (fallFile) {
    await processImage(path.join(ASSETS_DIR, fallFile), path.join(PUBLIC_LOGOS_DIR, 'logo-fall.png'), 'black', 28, 35);
  }

  if (fs.existsSync(path.join(PUBLIC_LOGOS_DIR, 'logo-base.png'))) {
    await sharp(path.join(PUBLIC_LOGOS_DIR, 'logo-base.png'))
      .resize(128, 128)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
    console.log('Saved favicon.png');
  }

  console.log('All PNG logos generated successfully!');
}

run().catch(console.error);
