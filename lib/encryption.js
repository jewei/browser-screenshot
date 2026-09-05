const encoder = new TextEncoder();
const decoder = new TextDecoder();

function parameters(record) {
  return {
    name: "AES-GCM",
    iv: record.iv,
    additionalData: encoder.encode(JSON.stringify([record.id, record.createdAt, record.sessionId])),
  };
}

export function importCaptureKey(bytes) {
  return crypto.subtle.importKey("raw", new Uint8Array(bytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptCapture(capture, key, sessionId) {
  const { blob, ...metadata } = capture;
  const header = encoder.encode(JSON.stringify(metadata));
  const payload = new Uint8Array(4 + header.byteLength + blob.size);
  new DataView(payload.buffer).setUint32(0, header.byteLength);
  payload.set(header, 4);
  payload.set(new Uint8Array(await blob.arrayBuffer()), 4 + header.byteLength);
  const record = {
    id: capture.id,
    createdAt: capture.createdAt,
    sessionId,
    iv: crypto.getRandomValues(new Uint8Array(12)),
  };
  record.encrypted = await crypto.subtle.encrypt(parameters(record), key, payload);
  return record;
}

export async function decryptCapture(record, key) {
  const payload = await crypto.subtle.decrypt(parameters(record), key, record.encrypted);
  const headerLength = new DataView(payload).getUint32(0);
  const metadata = JSON.parse(decoder.decode(new Uint8Array(payload, 4, headerLength)));
  return { ...metadata, blob: new Blob([payload.slice(4 + headerLength)], { type: "image/png" }) };
}
