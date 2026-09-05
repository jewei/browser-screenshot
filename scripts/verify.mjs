import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import { launchBrave, root } from "./browser.mjs";

const github = process.argv.includes("--github");
const headed = process.argv.includes("--headed");
const output = path.join(root, "artifacts");
await mkdir(output, { recursive: true });
const fixture = await readFile(path.join(root, "tests/fixtures/long-page.html"));
const server = createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(fixture);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const fixtureUrl = `http://127.0.0.1:${server.address().port}/long-page`;
const browser = await launchBrave({ headless: !headed });
const { context, worker, extensionId } = browser;
const errors = [];
context.on("page", (page) => {
  page.on("pageerror", (error) => { if (page.url().startsWith("chrome-extension://")) errors.push(error.message); });
});

async function readState() {
  return worker.evaluate(async () => (await chrome.storage.session.get("captureState")).captureState);
}

async function openPopupFor(source) {
  const popup = await context.newPage();
  await source.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForFunction(() => !document.querySelector("#capture").disabled, null, { timeout: 10_000 });
  return popup;
}

async function captureFromPopup(source) {
  const popup = await openPopupFor(source);
  await popup.locator(".popup").screenshot({ path: path.join(output, "popup.png") });
  const previewPromise = context.waitForEvent("page", { predicate: (page) => page.url().includes("preview.html"), timeout: 60_000 });
  await popup.locator("#capture").click();
  const preview = await Promise.race([
    previewPromise,
    (async () => {
      for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const state = await readState();
        if (state?.status === "error") throw new Error(state.message);
        if (state?.status === "complete") return context.pages().find((page) => page.url() === state.previewUrl) || previewPromise;
      }
      throw new Error("Capture did not complete within 48 seconds.");
    })(),
  ]);
  await preview.waitForLoadState("domcontentloaded");
  await preview.locator("#download").waitFor({ state: "visible" });
  await popup.close();
  return preview;
}

async function download(preview, filename) {
  const event = preview.waitForEvent("download");
  await preview.locator("#download").click();
  const download = await event;
  assert.equal(await download.failure(), null);
  await download.saveAs(path.join(output, filename));
  const png = PNG.sync.read(await readFile(path.join(output, filename)));
  const natural = await preview.locator("#screenshot").evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
  assert.deepEqual({ width: png.width, height: png.height }, natural);
  return png;
}

function pixel(png, x, y) {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 3)];
}

try {
  const source = context.pages()[0];
  await source.goto(fixtureUrl);
  await source.evaluate(() => scrollTo({ top: 450, behavior: "instant" }));
  const original = await source.evaluate(() => ({ x: scrollX, y: scrollY, height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth }));
  const preview = await captureFromPopup(source);
  const png = await download(preview, "test-full-page.png");
  const scale = png.width / original.width;
  assert.ok(scale >= 1 && scale <= 4, "The screenshot retains the browser pixel density");
  assert.equal(png.height, Math.round(original.height * scale));
  assert.ok(png.height > 2 * 900, "Capture extends beyond the viewport");
  assert.deepEqual(pixel(png, 10, png.height - 10), [215, 53, 69], "The last row includes the footer");
  const after = await source.evaluate(() => ({ x: scrollX, y: scrollY, style: Boolean(document.querySelector("[data-full-page-capture]")), loading: document.querySelector("img").getAttribute("loading"), lazy: document.querySelector("#lazy-status").textContent, behavior: getComputedStyle(document.documentElement).scrollBehavior }));
  assert.deepEqual(after, { x: original.x, y: original.y, style: false, loading: "lazy", lazy: "Image loaded", behavior: "smooth" });
  const greenRows = Array.from({ length: png.height }, (_, y) => pixel(png, Math.round(60 * scale), y)).filter((rgb) => rgb.join() === "24,153,88").length;
  assert.equal(greenRows, 120 * scale, "The image loaded on scroll appears in the PNG");
  const headerRows = Array.from({ length: png.height }, (_, y) => pixel(png, 10, y)).filter((rgb) => rgb.join() === "32,69,160").length;
  assert.equal(headerRows, 64 * scale, "The fixed header appears only once");
  const detached = await worker.evaluate(async (url) => {
    const target = (await chrome.debugger.getTargets()).find((target) => target.url === url);
    try {
      await chrome.debugger.sendCommand({ tabId: target.tabId }, "Page.getLayoutMetrics");
      return false;
    } catch (error) { return /not attached/i.test(error.message); }
  }, fixtureUrl);
  assert.equal(detached, true, "The extension debugger detaches after capture");
  console.log(`PASS full-page PNG: ${png.width} × ${png.height}; footer, lazy image, fixed header, cleanup, and download`);

  await preview.reload();
  await preview.locator("#download").waitFor({ state: "visible" });
  await preview.locator("#view-mode").selectOption("page");
  await preview.screenshot({ path: path.join(output, "preview.png") });
  await preview.locator("#view-mode").selectOption("actual");
  assert.equal(await preview.locator("#screenshot").evaluate((image) => image.getBoundingClientRect().width), png.width);
  await preview.locator("#view-mode").selectOption("width");
  for (const width of [320, 375, 414, 768]) {
    await preview.setViewportSize({ width, height: 900 });
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal page overflow at ${width}px`);
    const button = await preview.locator("#download").boundingBox();
    assert.ok(button.width >= 44 && button.height >= 44);
    await preview.screenshot({ path: path.join(output, `preview-${width}.png`) });
  }
  await preview.setViewportSize({ width: 1440, height: 900 });
  console.log("PASS saved preview reload, all view modes, and 320/375/414/768 px layouts");

  const invalid = await context.newPage();
  await invalid.goto(`chrome-extension://${extensionId}/preview.html?id=missing`);
  await invalid.locator("#empty-message").filter({ hasText: "no longer stored" }).waitFor();
  await invalid.close();
  const blockedPage = await context.newPage();
  await blockedPage.goto("brave://version");
  const blockedPopup = await context.newPage();
  await blockedPage.bringToFront();
  await blockedPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  await blockedPopup.locator("#status").filter({ hasText: "Open a website tab" }).waitFor();
  assert.equal(await blockedPopup.locator("#capture").isDisabled(), true);
  await blockedPopup.close();
  await blockedPage.close();
  console.log("PASS expired or missing preview and restricted page state");

  await source.evaluate(() => {
    document.body.style.minHeight = "40000px";
    scrollTo({ top: 450, behavior: "instant" });
  });
  const oversizedPopup = await openPopupFor(source);
  await oversizedPopup.locator("#capture").click();
  await oversizedPopup.locator('#status-box[data-state="error"]').waitFor({ state: "visible" });
  assert.match(await oversizedPopup.locator("#status").innerText(), /too large/);
  assert.equal(await oversizedPopup.locator("#capture").isEnabled(), true);
  assert.deepEqual(await source.evaluate(() => ({ y: scrollY, style: Boolean(document.querySelector("[data-full-page-capture]")) })), { y: 450, style: false });
  await oversizedPopup.close();
  await source.evaluate(() => {
    document.body.style.minHeight = "";
    document.body.style.minWidth = "1800px";
    scrollTo({ left: 120, top: 450, behavior: "instant" });
  });
  const widePreview = await captureFromPopup(source);
  const widePng = await download(widePreview, "test-wide-page.png");
  assert.equal(widePng.width, 1800 * scale);
  assert.deepEqual(pixel(widePng, widePng.width - 10, widePng.height - 10), [215, 53, 69]);
  assert.deepEqual(await source.evaluate(() => ({ x: scrollX, y: scrollY })), { x: 120, y: 450 });
  console.log("PASS size-limit error cleanup, retry, and horizontal page capture");

  let githubResult;
  if (github) {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("https://github.com/jewei", { waitUntil: "networkidle", timeout: 45_000 });
    assert.equal(response.status(), 200);
    assert.match(await page.title(), /jewei/i);
    await page.locator('footer').waitFor({ state: 'attached' });
    await page.evaluate(() => scrollTo({ top: 300, behavior: "instant" }));
    const githubPreview = await captureFromPopup(page);
    const githubPng = await download(githubPreview, "github-jewei-full-page.png");
    const capturedSize = await githubPreview.evaluate(async () => {
      const { getCapture } = await import("./lib/storage.js");
      const capture = await getCapture(new URL(location.href).searchParams.get("id"));
      return { width: capture.pageWidth, height: capture.pageHeight };
    });
    const dimensions = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, viewport: innerHeight, scroll: scrollY, footerBottom: document.querySelector("footer").getBoundingClientRect().bottom + scrollY }));
    const githubScale = githubPng.width / capturedSize.width;
    assert.ok(githubScale >= 1 && githubScale <= 4);
    assert.equal(githubPng.height, Math.round(capturedSize.height * githubScale));
    assert.ok(githubPng.height > dimensions.viewport);
    assert.ok(dimensions.footerBottom * githubScale <= githubPng.height + 1);
    assert.equal(dimensions.scroll, 300);
    await githubPreview.locator("#view-mode").selectOption("page");
    await githubPreview.screenshot({ path: path.join(output, "github-preview.png") });
    githubResult = { url: page.url(), title: await page.title(), pixelWidth: githubPng.width, pixelHeight: githubPng.height, capturedPage: capturedSize, restoredPage: dimensions };
    console.log(`PASS GitHub: ${githubPng.width} × ${githubPng.height}, footer included, scroll restored`);
  }
  assert.deepEqual(errors, [], "No uncaught extension page errors");
  await writeFile(path.join(output, "verification.json"), JSON.stringify({ testedAt: new Date().toISOString(), browser: await worker.evaluate(() => navigator.userAgent), fixture: { width: png.width, height: png.height }, github: githubResult, extensionErrors: errors }, null, 2) + "\n");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
