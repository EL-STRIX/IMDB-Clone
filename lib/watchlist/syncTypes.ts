import { WatchlistItem } from "./schema";

export type MutationType = "add" | "remove" | "update";

export interface WatchlistMutation {
  id: string; // Unique client mutation UUID/identifier
  type: MutationType;
  movieId: string;
  item?: WatchlistItem; // Provided on "add"
  patch?: Partial<WatchlistItem>; // Provided on "update"
  timestamp: number; // Client timestamp in milliseconds (epoch)
}

export interface SyncBatchRequest {
  clientMutations: WatchlistMutation[];
  lastSyncTime?: number;
}

export interface SyncBatchResponse {
  applied: string[]; // List of mutation IDs successfully committed
  conflictsResolved: number;
  serverItems: WatchlistItem[];
  syncTime: number; // Server timestamp in milliseconds
}

export interface ServerWatchlistItem extends WatchlistItem {
  serverUpdatedAt: number; // Epoch milliseconds for LWW comparison
  isDeleted?: boolean; // Tombstone for deleted items
}
