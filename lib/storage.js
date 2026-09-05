import { decryptCapture, encryptCapture, importCaptureKey } from "./encryption.js";

const DATABASE = "full-page-captures";
const STORE = "captures";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_CAPTURES = 10;

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      // Version 1 saved unencrypted previews. Remove them during the upgrade.
      if (request.result.objectStoreNames.contains(STORE)) request.result.deleteObjectStore(STORE);
      const store = request.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, run) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Local storage was interrupted."));
      run(tx.objectStore(STORE), (value) => { result = value; });
    });
  } finally {
    database.close();
  }
}

async function captureSession(create = false) {
  let { captureSession } = await chrome.storage.session.get("captureSession");
  if (!captureSession && create) {
    // Only the service worker creates keys, with captures serialized there.
    // Session storage keeps the key in memory, separate from the disk database.
    captureSession = { id: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32))) };
    await chrome.storage.session.set({ captureSession });
  }
  return captureSession;
}

export async function saveCapture(capture) {
  const session = await captureSession(true);
  const record = await encryptCapture(capture, await importCaptureKey(session.key), session.id);
  return transaction("readwrite", (store) => { store.put(record); });
}

export async function getCapture(id) {
  const session = await captureSession();
  const record = await transaction("readonly", (store, done) => {
    store.get(id).onsuccess = (event) => done(event.target.result);
  });
  if (!record) return;
  if (!session || record.sessionId !== session.id || Date.now() - Date.parse(record.createdAt) > MAX_AGE) {
    await transaction("readwrite", (store) => { store.delete(id); });
    return;
  }
  return decryptCapture(record, await importCaptureKey(session.key));
}

export async function pruneCaptures() {
  const session = await captureSession();
  return transaction("readwrite", (store) => {
    let kept = 0;
    store.index("createdAt").openCursor(null, "prev").onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      if (!session || cursor.value.sessionId !== session.id ||
          Date.now() - Date.parse(cursor.value.createdAt) > MAX_AGE || ++kept > MAX_CAPTURES) cursor.delete();
      cursor.continue();
    };
  });
}

export function clearCaptures() {
  return transaction("readwrite", (store) => { store.clear(); });
}
