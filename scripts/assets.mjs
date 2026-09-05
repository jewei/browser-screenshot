import { copyFile, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { PNG } from "pngjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(path.join(root, "fonts"), { recursive: true });
await mkdir(path.join(root, "icons"), { recursive: true });
for (const name of ["space-grotesk", "inter", "jetbrains-mono"]) {
  const source = path.join(root, "node_modules/@fontsource-variable", name);
  await copyFile(path.join(source, "files", `${name}-latin-wght-normal.woff2`), path.join(root, "fonts", `${name}.woff2`));
  await copyFile(path.join(source, "LICENSE"), path.join(root, "fonts", `${name}-LICENSE.txt`));
}

for (const size of [16, 32, 48, 128]) {
  const png = new PNG({ width: size, height: size });
  const padding = size === 128 ? 16 : 0;
  const scale = (size - 2 * padding) / 32;
  function rect(x, y, width, height, color) {
    for (let row = padding + Math.round(y * scale); row < padding + Math.round((y + height) * scale); row++) {
      for (let col = padding + Math.round(x * scale); col < padding + Math.round((x + width) * scale); col++) {
        const offset = (row * size + col) * 4;
        png.data.set(color, offset);
      }
    }
  }
  rect(0, 0, 32, 32, [36, 83, 199, 255]);
  const ink = [250, 252, 255, 255];
  rect(7, 5, 18, 2, ink);
  rect(7, 25, 18, 2, ink);
  rect(7, 5, 2, 6, ink);
  rect(23, 5, 2, 6, ink);
  rect(7, 21, 2, 6, ink);
  rect(23, 21, 2, 6, ink);
  rect(15, 10, 2, 10, ink);
  rect(12, 17, 8, 2, ink);
  rect(14, 19, 4, 2, ink);
  await finished(png.pack().pipe(createWriteStream(path.join(root, "icons", `${size}.png`))));
}
console.log("Local fonts and extension icons are ready.");
