const sharp = require('sharp');
const path = require('path');

async function generateTransparentLogo() {
  const srcPath = 'C:/Users/taras/.gemini/antigravity/brain/6a3e46d7-8f8b-41b1-a4db-95a9e9f32d31/.user_uploaded/media_1789745554083.png';
  const outPath = path.join(__dirname, '../public/images/logo_yellow.png');

  const img = sharp(srcPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const getAlpha = (x, y) => {
    const idx = (y * width + x) * channels;
    const v = Math.max(data[idx], data[idx+1], data[idx+2]);
    if (v <= 25) return 0;
    if (v >= 180) return 255;
    return Math.round(((v - 25) / (180 - 25)) * 255);
  };

  const outCanvas = Buffer.alloc(width * height * 4);

  // 1. Copy trashcan and ZALUPA
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < 290 || x < 255) {
        const a = getAlpha(x, y);
        if (a > 0) {
          const outIdx = (y * width + x) * 4;
          outCanvas[outIdx] = 250;     // R
          outCanvas[outIdx+1] = 204;   // G
          outCanvas[outIdx+2] = 21;    // B
          outCanvas[outIdx+3] = a;     // Alpha
        }
      }
    }
  }

  // 2. Extract letters D, R, O, P
  const yTop = 295;
  const yBottom = 415;
  const h = yBottom - yTop + 1;

  const letterCoords = [
    { char: 'D', startX: 272, endX: 364 },
    { char: 'R', startX: 504, endX: 604 },
    { char: 'O', startX: 621, endX: 724 },
    { char: 'P', startX: 745, endX: 842 },
  ];

  const letterBitmaps = letterCoords.map(item => {
    const w = item.endX - item.startX + 1;
    const buf = Buffer.alloc(w * h);
    for (let ly = 0; ly < h; ly++) {
      const sy = yTop + ly;
      for (let lx = 0; lx < w; lx++) {
        const sx = item.startX + lx;
        buf[ly * w + lx] = getAlpha(sx, sy);
      }
    }
    return { ...item, w, h, buf };
  });

  // Placements with tight kerning (gap = 18px)
  const gap = 18;
  let curX = 272;
  for (const l of letterBitmaps) {
    const destX = curX;
    for (let ly = 0; ly < l.h; ly++) {
      const dy = yTop + ly;
      for (let lx = 0; lx < l.w; lx++) {
        const dx = destX + lx;
        const a = l.buf[ly * l.w + lx];
        if (a > 0) {
          const outIdx = (dy * width + dx) * 4;
          outCanvas[outIdx] = 250;
          outCanvas[outIdx+1] = 204;
          outCanvas[outIdx+2] = 21;
          outCanvas[outIdx+3] = a;
        }
      }
    }
    curX += l.w + gap;
  }

  // Bounding box crop with padding
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = outCanvas[(y * width + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 16;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

  await sharp(outCanvas, { raw: { width, height, channels: 4 } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png()
    .toFile(outPath);

  console.log('Saved transparent logo to', outPath, { cropW, cropH });
}

generateTransparentLogo().catch(console.error);
