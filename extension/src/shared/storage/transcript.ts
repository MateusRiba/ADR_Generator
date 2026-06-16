// Persistência do buffer da transcrição da sessão corrente. Em MV3 o service
// worker é efêmero — pode ser reciclado no meio de uma reunião (risco S6 do
// checklist_analise_riscos_ia.md). O Transcription Orchestrator grava o buffer
// aqui periodicamente e o recupera ao reativar, sem perder o que já foi falado.
//
// DB próprio (separado de `adrs`) para não acoplar a versão do schema dos ADRs
// ao buffer volátil: cada módulo evolui seu IndexedDB de forma independente.

const DB_NAME = "adr-generator-transcript";
const DB_VERSION = 1;
const STORE = "buffer";
// Chave fixa: existe no máximo um buffer de sessão ativo por vez.
const BUFFER_KEY = "current";

interface BufferRecord {
  key: string;
  text: string;
  updatedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
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

/** Grava (substitui) o buffer corrente. */
export async function saveTranscriptBuffer(text: string): Promise<void> {
  const record: BufferRecord = { key: BUFFER_KEY, text, updatedAt: Date.now() };
  await withStore("readwrite", (store) => awaitReq(store.put(record)));
}

/** Recupera o buffer persistido; string vazia se não houver. */
export async function loadTranscriptBuffer(): Promise<string> {
  const record = await withStore("readonly", (store) =>
    awaitReq(store.get(BUFFER_KEY)),
  );
  return (record as BufferRecord | undefined)?.text ?? "";
}

/** Apaga o buffer da sessão (ao parar a captura ou após gerar o ADR — P3). */
export async function clearTranscriptBuffer(): Promise<void> {
  await withStore("readwrite", (store) => awaitReq(store.delete(BUFFER_KEY)));
}
