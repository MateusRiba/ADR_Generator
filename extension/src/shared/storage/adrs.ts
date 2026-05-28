// Storage Repository do ADR (componente do C4 no Background). IndexedDB nativo
// — preferido sobre lib `idb` para zero deps. Camada única de acesso ao banco
// local: popup e content scripts falam via runtime message, não tocam aqui.

import type { AdrJson } from "../gemini/types";

const DB_NAME = "adr-generator";
const DB_VERSION = 1;
const STORE = "adrs";
const INDEX_UPDATED_AT = "by-updatedAt";

export interface AdrRecord {
  id: string;
  title: string;
  content: AdrJson;
  createdAt: number;
  updatedAt: number;
}

export interface AdrPatch {
  title?: string;
  content?: AdrJson;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex(INDEX_UPDATED_AT, "updatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function awaitReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    return await fn(store);
  } finally {
    db.close();
  }
}

export async function saveAdr(adr: AdrJson): Promise<AdrRecord> {
  const now = Date.now();
  const record: AdrRecord = {
    id: crypto.randomUUID(),
    title: adr.titulo,
    content: adr,
    createdAt: now,
    updatedAt: now,
  };
  await withStore("readwrite", (store) => awaitReq(store.add(record)));
  return record;
}

export async function getAdr(id: string): Promise<AdrRecord | null> {
  const result = await withStore("readonly", (store) =>
    awaitReq(store.get(id)),
  );
  return (result as AdrRecord | undefined) ?? null;
}

export async function listAdrs(): Promise<AdrRecord[]> {
  return withStore("readonly", (store) => {
    const index = store.index(INDEX_UPDATED_AT);
    return new Promise<AdrRecord[]>((resolve, reject) => {
      const records: AdrRecord[] = [];
      const req = index.openCursor(null, "prev");
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          records.push(cursor.value as AdrRecord);
          cursor.continue();
        } else {
          resolve(records);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function updateAdr(
  id: string,
  patch: AdrPatch,
): Promise<AdrRecord> {
  return withStore("readwrite", async (store) => {
    const existing = (await awaitReq(store.get(id))) as AdrRecord | undefined;
    if (!existing) {
      throw new Error(`ADR ${id} não encontrado.`);
    }
    const next: AdrRecord = {
      ...existing,
      ...(patch.content ? { content: patch.content } : {}),
      title: patch.title ?? patch.content?.titulo ?? existing.title,
      updatedAt: Date.now(),
    };
    await awaitReq(store.put(next));
    return next;
  });
}

export async function deleteAdr(id: string): Promise<void> {
  await withStore("readwrite", (store) => awaitReq(store.delete(id)));
}
