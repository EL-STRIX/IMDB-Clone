import { WatchlistItem, WatchlistItemSchema } from "./schema";
import {
  WatchlistMutation,
  SyncBatchRequest,
  SyncBatchResponse,
  ServerWatchlistItem,
} from "./syncTypes";

// Authoritative server-side watchlist store with timestamps for Last-Write-Wins (LWW)
class ServerWatchlistStore {
  private items = new Map<string, ServerWatchlistItem>();

  constructor() {
    this.seedDefault();
  }

  seedDefault() {
    this.items.clear();
  }

  /**
   * Reconciles a batch of client mutations against the authoritative server store using Last-Write-Wins (LWW).
   * If client mutation timestamp > serverUpdatedAt -> client mutation wins.
   * If serverUpdatedAt >= client mutation timestamp -> server state wins (conflict resolved in favor of server).
   */
  reconcile(request: SyncBatchRequest): SyncBatchResponse {
    const applied: string[] = [];
    let conflictsResolved = 0;
    const now = Date.now();

    // Sort client mutations chronologically
    const sortedMutations = [...request.clientMutations].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    for (const mutation of sortedMutations) {
      const existing = this.items.get(mutation.movieId);
      const serverTimestamp = existing?.serverUpdatedAt || 0;

      // Last-Write-Wins (LWW): Client wins strictly if its timestamp is strictly greater
      if (mutation.timestamp > serverTimestamp) {
        if (mutation.type === "add" && mutation.item) {
          try {
            const validated = WatchlistItemSchema.parse(mutation.item);
            this.items.set(mutation.movieId, {
              ...validated,
              serverUpdatedAt: mutation.timestamp,
              isDeleted: false,
            });
            applied.push(mutation.id);
          } catch {
            // Invalid item schema rejected
          }
        } else if (mutation.type === "remove") {
          if (existing) {
            // Mark tombstone with deletion timestamp
            this.items.set(mutation.movieId, {
              ...existing,
              serverUpdatedAt: mutation.timestamp,
              isDeleted: true,
            });
          } else {
            // Record tombstone for unknown item
            this.items.set(mutation.movieId, {
              id: mutation.movieId,
              title: "Deleted Item",
              addedAt: new Date(mutation.timestamp).toISOString(),
              serverUpdatedAt: mutation.timestamp,
              isDeleted: true,
            });
          }
          applied.push(mutation.id);
        } else if (mutation.type === "update" && mutation.patch) {
          if (existing && !existing.isDeleted) {
            const updated = {
              ...existing,
              ...mutation.patch,
              id: existing.id,
              serverUpdatedAt: mutation.timestamp,
            };
            this.items.set(mutation.movieId, updated);
            applied.push(mutation.id);
          }
        }
      } else {
        // Server state is newer or equal: Server wins
        conflictsResolved += 1;
      }
    }

    // Filter out deleted tombstones for client sync payload
    const activeServerItems: WatchlistItem[] = Array.from(this.items.values())
      .filter((item) => !item.isDeleted)
      .map(({ serverUpdatedAt, isDeleted, ...cleanItem }) => cleanItem)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

    return {
      applied,
      conflictsResolved,
      serverItems: activeServerItems,
      syncTime: now,
    };
  }

  getServerItems(): WatchlistItem[] {
    return Array.from(this.items.values())
      .filter((item) => !item.isDeleted)
      .map(({ serverUpdatedAt, isDeleted, ...cleanItem }) => cleanItem);
  }

  getRawServerItems(): ServerWatchlistItem[] {
    return Array.from(this.items.values());
  }

  setServerItem(item: ServerWatchlistItem): void {
    this.items.set(item.id, item);
  }

  clear(): void {
    this.items.clear();
  }
}

export const serverWatchlistStore = new ServerWatchlistStore();
