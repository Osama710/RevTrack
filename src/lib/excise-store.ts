import type { DocumentRow, Vehicle } from "@/types/db";

/** Offline copy of the wallet, kept in this browser only. */
export interface Snapshot {
  savedAt: string;
  vehicles: Vehicle[];
  documents: DocumentRow[];
  images: Record<string, Blob>;
}

const DB_NAME = "revtrack-excise";
const STORE = "snapshot";
const KEY = "current";
export const STATIC_CACHE = "revtrack-static-v2";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveSnapshot(s: Snapshot): Promise<void> {
  await run("readwrite", (store) => store.put(s, KEY));
}

export async function loadSnapshot(): Promise<Snapshot | null> {
  try {
    return ((await run("readonly", (store) => store.get(KEY))) as Snapshot | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(KEY));
  } catch {
    /* nothing stored */
  }
}

/** Caches this page and its scripts so /excise still opens with no signal. */
export async function warmOfflineCache(): Promise<void> {
  if (!("caches" in window)) return;
  const cache = await caches.open(STATIC_CACHE);
  const scripts = performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((u) => u.includes("/_next/static/"));
  await Promise.allSettled([cache.add("/excise"), ...scripts.map((u) => cache.add(u))]);
}
