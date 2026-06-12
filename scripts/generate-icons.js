const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'logo-source.svg');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  const svg = fs.readFileSync(SRC);

  for (const size of SIZES) {
    const out = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }

  // favicon.ico from 16/32/48 renders
  const favSizes = [16, 32, 48];
  const buffers = await Promise.all(
    favSizes.map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer())
  );
  const ico = await pngToIco(buffers);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), ico);
  console.log('wrote favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
