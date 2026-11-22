import { openDB, IDBPDatabase } from "idb";
import { WatchlistMutation, SyncBatchResponse } from "./syncTypes";

const DB_NAME = "imdb-watchlist-db";
const DB_VERSION = 2;
const MUTATIONS_STORE = "pendingMutations";

let queueDbPromise: Promise<IDBPDatabase> | null = null;

export async function getQueueDb(customDbName: string = DB_NAME): Promise<IDBPDatabase> {
  return openDB(customDbName, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("watchlist")) {
        const store = db.createObjectStore("watchlist", { keyPath: "id" });
        store.createIndex("addedAt", "addedAt");
      }
      if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
        const mutationStore = db.createObjectStore(MUTATIONS_STORE, { keyPath: "id" });
        mutationStore.createIndex("timestamp", "timestamp");
      }
    },
  });
}

/**
 * Enqueue a mutation into IndexedDB pendingMutations store.
 */
export async function enqueueMutation(
  mutationInput: Omit<WatchlistMutation, "id">,
  customDbName: string = DB_NAME
): Promise<WatchlistMutation> {
  const mutation: WatchlistMutation = {
    ...mutationInput,
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  const db = await getQueueDb(customDbName);
  await db.put(MUTATIONS_STORE, mutation);
  return mutation;
}

/**
 * Retrieve all pending mutations sorted chronologically.
 */
export async function getPendingMutations(
  customDbName: string = DB_NAME
): Promise<WatchlistMutation[]> {
  const db = await getQueueDb(customDbName);
  const mutations: WatchlistMutation[] = await db.getAll(MUTATIONS_STORE);
  return mutations.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove committed mutations from the queue.
 */
export async function removeMutations(
  ids: string[],
  customDbName: string = DB_NAME
): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await getQueueDb(customDbName);
  const tx = db.transaction(MUTATIONS_STORE, "readwrite");
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}

/**
 * Clear the entire mutation queue.
 */
export async function clearMutationQueue(customDbName: string = DB_NAME): Promise<void> {
  const db = await getQueueDb(customDbName);
  await db.clear(MUTATIONS_STORE);
}

/**
 * Flush all pending mutations to the sync endpoint.
 */
export async function flushMutationQueue(
  endpoint: string = "/api/watchlist/sync",
  customDbName: string = DB_NAME
): Promise<{ flushed: number; conflicts: number; success: boolean }> {
  const pending = await getPendingMutations(customDbName);
  if (pending.length === 0) {
    return { flushed: 0, conflicts: 0, success: true };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientMutations: pending }),
    });

    if (!res.ok) {
      return { flushed: 0, conflicts: 0, success: false };
    }

    const data: SyncBatchResponse = await res.json();
    if (data.applied && data.applied.length > 0) {
      await removeMutations(data.applied, customDbName);
    }

    return {
      flushed: data.applied?.length || 0,
      conflicts: data.conflictsResolved || 0,
      success: true,
    };
  } catch {
    return { flushed: 0, conflicts: 0, success: false };
  }
}

/**
 * Registers an online event listener that automatically triggers queue flush when connection is restored.
 */
export function registerOnlineSyncListener(
  endpoint: string = "/api/watchlist/sync",
  customDbName: string = DB_NAME
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    flushMutationQueue(endpoint, customDbName).catch(() => {});
  };

  window.addEventListener("online", handleOnline);
  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
