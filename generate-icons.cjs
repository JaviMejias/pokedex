const fs = require('fs');
const path = require('path');
const https = require('https');

const publicDir = path.join(__dirname, 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function downloadIcon(size) {
  const url = `https://placehold.co/${size}x${size}/CC0000/FFFFFF.png?text=Pokedex`;
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function downloadScreenshot(name, width, height) {
  const url = `https://placehold.co/${width}x${height}/0A0A0F/CC0000.png?text=Pokedex+Pro`;
  const filePath = path.join(iconsDir, `${name}.png`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Downloading valid dimension PNGs...");
  for (const size of sizes) {
    await downloadIcon(size);
    console.log(`Downloaded icon-${size}.png`);
  }
  
  await downloadScreenshot('screenshot-wide', 1280, 720);
  await downloadScreenshot('screenshot-narrow', 750, 1334);
  console.log("Icons generated successfully with correct dimensions.");
}

main().catch(console.error);
