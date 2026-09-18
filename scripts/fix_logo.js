const sharp = require('sharp');
const path = require('path');

async function fixLogo() {
  const srcPath = 'C:/Users/taras/.gemini/antigravity/brain/6a3e46d7-8f8b-41b1-a4db-95a9e9f32d31/.user_uploaded/media_1789748254673.png';
  const outPath = path.join(__dirname, '../public/images/logo_yellow.png');

  // Load image
  const baseImg = sharp(srcPath);
  const meta = await baseImg.metadata();
  const { width, height } = meta;

  // Extract letters D, R, O, P
  // D: x: 221, width: 66
  // R: x: 376, width: 68
  // O: x: 454, width: 70 (second O)
  // P: x: 532, width: 87
  const y = 108;
  const h = 110;

  const dBuf = await sharp(srcPath).extract({ left: 221, top: y, width: 66, height: h }).toBuffer();
  const rBuf = await sharp(srcPath).extract({ left: 376, top: y, width: 68, height: h }).toBuffer();
  const oBuf = await sharp(srcPath).extract({ left: 454, top: y, width: 70, height: h }).toBuffer();
  const pBuf = await sharp(srcPath).extract({ left: 532, top: y, width: 87, height: h }).toBuffer();

  // Create black patch to erase the old "DOROP" (x from 215 to 640, y from 105 to 225)
  const blackPatch = await sharp({
    create: {
      width: 440,
      height: 120,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    }
  }).png().toBuffer();

  // Now composite:
  // 1. Black patch over old DOROP
  // 2. D at x = 221
  // 3. R at x = 320
  // 4. O at x = 422
  // 5. P at x = 525
  const result = await sharp(srcPath)
    .composite([
      { input: blackPatch, left: 215, top: 105 },
      { input: dBuf, left: 221, top: y },
      { input: rBuf, left: 320, top: y },
      { input: oBuf, left: 422, top: y },
      { input: pBuf, left: 525, top: y },
    ])
    .png()
    .toFile(outPath);

  console.log('Fixed logo successfully saved to:', outPath);
}

fixLogo().catch(console.error);
