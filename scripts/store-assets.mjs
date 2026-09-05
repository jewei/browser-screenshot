import assert from "node:assert/strict";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import { launchBrave, root } from "./browser.mjs";

const output = path.join(root, "store/assets");
await mkdir(output, { recursive: true });
const browser = await launchBrave({ viewport: { width: 1280, height: 800 } });
const { context, extensionId } = browser;
const files = new Map([
  ["/guide", ["store/demo.html", "text/html"]],
  ["/promo", ["store/promo.html", "text/html"]],
  ["/fonts/inter.woff2", ["fonts/inter.woff2", "font/woff2"]],
  ["/fonts/space-grotesk.woff2", ["fonts/space-grotesk.woff2", "font/woff2"]],
]);

try {
  // Reserved .test domain. All sample content comes from the files above.
  await context.route("https://sample.fullpage.test/**", async (route) => {
    const file = files.get(new URL(route.request().url()).pathname);
    if (!file) return route.fulfill({ status: 404, body: "" });
    await route.fulfill({ status: 200, contentType: file[1], body: await readFile(path.join(root, file[0])) });
  });
  const source = context.pages()[0];
  await source.goto("https://sample.fullpage.test/guide");
  await source.evaluate(() => document.fonts.ready);
  const popup = await context.newPage();
  await source.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator("#agree").click();
  await popup.waitForFunction(() => !document.querySelector("#capture").disabled);
  const previewOpened = context.waitForEvent("page", { predicate: (page) => page.url().includes("preview.html"), timeout: 60_000 });
  await popup.locator("#capture").click();
  const preview = await previewOpened;
  await preview.locator("#download").waitFor({ state: "visible" });
  await preview.bringToFront();
  // Keep the native window larger than the emulated viewport. Brave otherwise
  // repeats a strip at the bottom of viewport screenshots on macOS.
  const windowSession = await context.newCDPSession(preview);
  const { windowId } = await windowSession.send("Browser.getWindowForTarget");
  await windowSession.send("Browser.setWindowBounds", { windowId, bounds: { width: 1440, height: 1000 } });
  await windowSession.detach();
  await preview.setViewportSize({ width: 1280, height: 800 });
  await preview.evaluate(() => document.fonts.ready);
  await preview.locator("#view-mode").selectOption("page");
  await preview.screenshot({ path: path.join(output, "01-full-page.png") });
  await preview.locator("#view-mode").selectOption("width");
  await preview.screenshot({ path: path.join(output, "02-page-detail.png") });

  const promo = await context.newPage();
  await promo.setViewportSize({ width: 440, height: 280 });
  await promo.goto("https://sample.fullpage.test/promo");
  await promo.evaluate(() => document.fonts.ready);
  await promo.screenshot({ path: path.join(output, "small-promo.png") });
  await copyFile(path.join(root, "icons/128.png"), path.join(output, "icon-128.png"));

  for (const [file, width, height] of [
    ["01-full-page.png", 1280, 800], ["02-page-detail.png", 1280, 800],
    ["small-promo.png", 440, 280], ["icon-128.png", 128, 128],
  ]) {
    const png = PNG.sync.read(await readFile(path.join(output, file)));
    assert.equal(png.width, width);
    assert.equal(png.height, height);
    console.log(`Store asset: ${file} (${width} × ${height})`);
  }
} finally {
  await browser.close();
}
