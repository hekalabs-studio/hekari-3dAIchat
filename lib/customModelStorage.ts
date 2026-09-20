// ──────────────────────────────────────────────
// Custom Model Storage (IndexedDB)
// Enables custom user 3D models (.glb / .vrm) from their
// local computer to persist across page reloads and browser sessions.
// ──────────────────────────────────────────────

const DB_NAME = "hekari_custom_models_db";
const DB_VERSION = 1;
const STORE_NAME = "models";
const KEY_ACTIVE_MODEL = "active_custom_avatar";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

export interface StoredModelRecord {
  blob: Blob;
  name: string;
  size: number;
  type: string;
  updatedAt: number;
}

/**
 * Save a custom 3D model File or Blob to IndexedDB and return a live Blob URL
 */
export async function saveCustomModelToStorage(
  file: File | Blob,
  name?: string
): Promise<{ blobUrl: string; record: StoredModelRecord }> {
  const db = await openDB();
  const fileName = name || (file instanceof File ? file.name : "custom-model.glb");
  const record: StoredModelRecord = {
    blob: file,
    name: fileName,
    size: file.size,
    type: file.type || "model/gltf-binary",
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record, KEY_ACTIVE_MODEL);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("Failed to store model in IndexedDB"));
  });

  const blobUrl = URL.createObjectURL(file);
  return { blobUrl, record };
}

/**
 * Retrieve the active custom model from IndexedDB and create a fresh Blob URL
 */
export async function loadCustomModelFromStorage(): Promise<{
  blobUrl: string;
  name: string;
  size: number;
} | null> {
  try {
    const db = await openDB();
    const record = await new Promise<StoredModelRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_ACTIVE_MODEL);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Failed to read model from IndexedDB"));
    });

    if (!record || !record.blob) {
      return null;
    }

    const blobUrl = URL.createObjectURL(record.blob);
    return {
      blobUrl,
      name: record.name,
      size: record.size,
    };
  } catch (err) {
    console.warn("[CustomModelStorage] Failed to load stored model from IndexedDB", err);
    return null;
  }
}

/**
 * Clear the stored custom model from IndexedDB
 */
export async function clearCustomModelFromStorage(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_ACTIVE_MODEL);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to delete model from IndexedDB"));
    });
  } catch (err) {
    console.warn("[CustomModelStorage] Failed to clear custom model", err);
  }
}
