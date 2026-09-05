import { copyFile, cp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { root } from "./browser.mjs";

await import("./package.mjs");
await import("./store-assets.mjs");
const { version } = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const output = path.join(root, "dist", `web-store-${version}`);
await mkdir(output, { recursive: true });
await copyFile(path.join(root, "dist", `full-page-${version}.zip`), path.join(output, `full-page-${version}.zip`));
await cp(path.join(root, "store/assets"), path.join(output, "images"), { recursive: true });
await copyFile(path.join(root, "docs/web-store.md"), path.join(output, "submission-guide.md"));
await copyFile(path.join(root, "store/listing.txt"), path.join(output, "listing.txt"));
await copyFile(path.join(root, "PRIVACY.md"), path.join(output, "PRIVACY.md"));
console.log(`Web Store upload folder: ${output}`);
