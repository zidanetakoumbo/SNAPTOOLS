const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'icons', 'logo.png');
const BADGE = path.join(__dirname, 'logo-badge.png');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Bounding box of the square badge inside the wide logo.png (badge + "SNAP TOOLS" wordmark image).
const BADGE_CROP = { left: 216, top: 60, width: 245, height: 247 };

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  // Extract the square badge once at high resolution to use as the master source.
  await sharp(SRC)
    .extract(BADGE_CROP)
    .resize(1024, 1024)
    .png()
    .toFile(BADGE);

  for (const size of SIZES) {
    const out = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(BADGE).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }

  // favicon.ico from 16/32/48 renders
  const favSizes = [16, 32, 48];
  const buffers = await Promise.all(
    favSizes.map((size) => sharp(BADGE).resize(size, size).png().toBuffer())
  );
  const ico = await pngToIco(buffers);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), ico);
  console.log('wrote favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
