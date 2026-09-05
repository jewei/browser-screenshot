const DATABASE = "full-page-captures";
const STORE = "captures";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_CAPTURES = 10;

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
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

export function saveCapture(capture) {
  return transaction("readwrite", (store) => { store.put(capture); });
}

export function getCapture(id) {
  return transaction("readonly", (store, done) => {
    store.get(id).onsuccess = (event) => done(event.target.result);
  });
}

export function pruneCaptures() {
  return transaction("readwrite", (store) => {
    let kept = 0;
    store.index("createdAt").openCursor(null, "prev").onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      kept++;
      if (kept > MAX_CAPTURES || Date.now() - Date.parse(cursor.value.createdAt) > MAX_AGE) cursor.delete();
      cursor.continue();
    };
  });
}
