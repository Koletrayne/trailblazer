import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "public", "logo.png");
const dest = join(root, "public", "icons");

mkdirSync(dest, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 247, g: 241, b: 227, alpha: 1 } })
    .png()
    .toFile(join(dest, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log("All icons generated.");
