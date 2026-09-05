import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { root } from "./browser.mjs";

const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const files = ["manifest.json", "background.js", "popup.html", "popup.js", "preview.html", "preview.js", "styles.css", "tokens.css", "lib", "fonts", "icons", "README.md", "PRIVACY.md"];
const archive = path.join(root, "dist", `full-page-${manifest.version}.zip`);
await mkdir(path.dirname(archive), { recursive: true });
await rm(archive, { force: true });
await promisify(execFile)("zip", ["-q", "-r", archive, ...files], { cwd: root });
console.log(`Extension package: ${archive}`);
