import { test } from "bun:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { captureBounds, isCapturableUrl, pngBlob, pngDimensions, screenshotFilename, readableError } from "../lib/shared.js";

test("only HTTP and HTTPS pages can be captured", () => {
  for (const url of ["https://github.com/jewei", "http://localhost:3000/path"]) assert.equal(isCapturableUrl(url), true);
  for (const url of ["brave://settings", "chrome://extensions", "file:///tmp/page.html", "data:text/html,hi", "javascript:alert(1)", "bad", undefined]) assert.equal(isCapturableUrl(url), false);
});

test("capture bounds include the last fractional pixel and enforce limits at device scale", () => {
  assert.deepEqual(captureBounds({ width: 1440.25, height: 2900.2 }, 2), { x: 0, y: 0, width: 1441, height: 2901, scale: 1 });
  assert.throws(() => captureBounds({ width: 1440, height: 18000 }, 2), /too large/);
  assert.throws(() => captureBounds({ width: 9000, height: 9000 }, 1), /too large/);
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
