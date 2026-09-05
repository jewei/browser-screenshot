import { test } from "bun:test";
import assert from "node:assert/strict";
import { encryptCapture, decryptCapture, importCaptureKey } from "../lib/encryption.js";

const capture = {
  id: "test-capture",
  createdAt: "2026-09-05T00:00:00.000Z",
  url: "https://example.com/account?token=private",
  title: "Private account details",
  filename: "account.png",
  width: 140,
  height: 320,
  blob: new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4])], { type: "image/png" }),
};

test("encrypted previews preserve metadata and PNG bytes without storing them in plain text", async () => {
  const key = await importCaptureKey(crypto.getRandomValues(new Uint8Array(32)));
  assert.equal(key.extractable, false);
  const record = await encryptCapture(capture, key, "session-1");
  assert.deepEqual(Object.keys(record).sort(), ["id", "createdAt", "sessionId", "iv", "encrypted"].sort());
  assert.ok(!new TextDecoder().decode(record.encrypted).includes(capture.title));
  const restored = await decryptCapture(record, key);
  assert.deepEqual({ ...restored, blob: undefined }, { ...capture, blob: undefined });
  assert.deepEqual(await restored.blob.arrayBuffer(), await capture.blob.arrayBuffer());
});

test("each encryption uses a fresh IV and rejects a wrong key or altered data", async () => {
  const key = await importCaptureKey(crypto.getRandomValues(new Uint8Array(32)));
  const first = await encryptCapture(capture, key, "session-1");
  const second = await encryptCapture(capture, key, "session-1");
  assert.notDeepEqual(first.iv, second.iv);
  assert.notDeepEqual(first.encrypted, second.encrypted);
  const otherKey = await importCaptureKey(crypto.getRandomValues(new Uint8Array(32)));
  await assert.rejects(decryptCapture(first, otherKey));
  for (const change of [{ id: "swapped" }, { createdAt: "2099-01-01" }, { sessionId: "swapped" }]) {
    await assert.rejects(decryptCapture({ ...first, ...change }, key));
  }
  const altered = structuredClone(first);
  new Uint8Array(altered.encrypted)[0] ^= 1;
  await assert.rejects(decryptCapture(altered, key));
});
