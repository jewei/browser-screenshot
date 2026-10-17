import { test } from "bun:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { captureBounds, isCapturableUrl, LIMITS, pngBlob, pngDimensions, screenshotFilename, readableError } from "../lib/shared.js";

test("only HTTP and HTTPS pages can be captured", () => {
  for (const url of ["https://github.com/jewei", "http://localhost:3000/path"]) assert.equal(isCapturableUrl(url), true);
  for (const url of ["brave://settings", "chrome://extensions", "file:///tmp/page.html", "data:text/html,hi", "javascript:alert(1)", "bad", undefined]) assert.equal(isCapturableUrl(url), false);
});

test("capture bounds include the last fractional pixel and scale large pages down to fit the limits", () => {
  assert.deepEqual(captureBounds({ width: 1440.25, height: 2900.2 }, 2), { x: 0, y: 0, width: 1441, height: 2901, scale: 1 });
  for (const [size, ratio] of [[{ width: 1440, height: 18000 }, 2], [{ width: 9000, height: 9000 }, 1], [{ width: 2000, height: 9000 }, 2], [{ width: 1440, height: 30000 }, 1]]) {
    const { scale } = captureBounds(size, ratio);
    assert.ok(scale < 1 && scale * ratio >= 0.5);
    const output = [Math.ceil(size.width * ratio * scale), Math.ceil(size.height * ratio * scale)];
    assert.ok(Math.max(...output) <= LIMITS.maxDimension && output[0] * output[1] <= LIMITS.maxPixels);
  }
  for (const ratio of [1, 2]) {
    const clip = captureBounds({ width: 1440, height: 80000 }, ratio);
    assert.equal(clip.height, LIMITS.maxDimension / LIMITS.minPixelRatio, "Very tall pages are cut at the minimum pixel ratio");
    assert.ok(Math.ceil(clip.height * ratio * clip.scale) <= LIMITS.maxDimension);
  }
  assert.throws(() => captureBounds({ width: 40000, height: 1000 }, 1), /too wide/);
  for (const height of [0, -1, NaN, Infinity]) assert.throws(() => captureBounds({ width: 100, height }), /valid size/);
});

test("PNG metadata and stored blob agree with actual encoded image", async () => {
  const png = new PNG({ width: 140, height: 320 });
  const buffer = PNG.sync.write(png);
  const base64 = buffer.toString("base64");
  assert.deepEqual(pngDimensions(base64), { width: 140, height: 320 });
  assert.deepEqual(Buffer.from(await pngBlob(base64).arrayBuffer()), buffer);
  assert.throws(() => pngDimensions(Buffer.from("not a PNG").toString("base64")), /did not return a PNG/);
});

test("filenames exclude query tokens, path separators, and special filename characters", () => {
  const date = new Date("2026-09-05T08:09:10.123Z");
  assert.equal(screenshotFilename("https://github.com/jewei?token=secret#private", date), "github.com-jewei-2026-09-05T08-09-10-123Z.png");
  const filename = screenshotFilename(`https://example.com/${"a".repeat(200)}`, date);
  assert.ok(filename.length < 150);
  assert.doesNotMatch(filename, /[\\/:?*<>|]/);
});

test("browser errors explain a recovery action", () => {
  assert.match(readableError(new Error("Another debugger is already attached")), /Close its developer tools/);
  assert.match(readableError(new Error("No tab with given id")), /Keep the page open/);
  assert.match(readableError(new Error("Host access is restricted by policy")), /Brave blocked capture/);
});
