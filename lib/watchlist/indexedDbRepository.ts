import { openDB, IDBPDatabase } from "idb";
import {
  WatchlistItem,
  WatchlistItemSchema,
  AddWatchlistItemInput,
  AddWatchlistItemSchema,
  UpdateWatchlistItemInput,
  UpdateWatchlistItemSchema,
} from "./schema";
import { WatchlistRepository } from "./repository";
import { enqueueMutation, flushMutationQueue } from "./mutationQueue";

const DB_NAME = "imdb-watchlist-db";
const DB_VERSION = 2;
const STORE_NAME = "watchlist";
const MUTATIONS_STORE = "pendingMutations";

export class IndexedDbRepository implements WatchlistRepository {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor(private customDbName: string = DB_NAME) {}

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      const storeName = STORE_NAME;
      const mutationStoreName = MUTATIONS_STORE;

      this.dbPromise = openDB(this.customDbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" });
            store.createIndex("addedAt", "addedAt");
          }
          if (!db.objectStoreNames.contains(mutationStoreName)) {
            const mStore = db.createObjectStore(mutationStoreName, { keyPath: "id" });
            mStore.createIndex("timestamp", "timestamp");
          }
        },
      });
    }
    return this.dbPromise;
  }

  private triggerBackgroundSync() {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushMutationQueue("/api/watchlist/sync", this.customDbName).catch(() => {});
    }
  }

  async add(input: AddWatchlistItemInput): Promise<WatchlistItem> {
    const validatedInput = AddWatchlistItemSchema.parse(input);
    const item: WatchlistItem = {
      ...validatedInput,
      poster: validatedInput.poster ?? null,
      addedAt: validatedInput.addedAt || new Date().toISOString(),
    };

    const validatedItem = WatchlistItemSchema.parse(item);
    const db = await this.getDb();
    await db.put(STORE_NAME, validatedItem);

    // Enqueue mutation for sync
    await enqueueMutation(
      {
        type: "add",
        movieId: validatedItem.id,
        item: validatedItem,
        timestamp: Date.now(),
      },
      this.customDbName
    );

    this.triggerBackgroundSync();
    return validatedItem;
  }

  async remove(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for removal");
    }

    const db = await this.getDb();
    const existing = await db.get(STORE_NAME, id);
    if (!existing) {
      return false;
    }

    await db.delete(STORE_NAME, id);

    // Enqueue mutation for sync
    await enqueueMutation(
      {
        type: "remove",
        movieId: id,
        timestamp: Date.now(),
      },
      this.customDbName
    );

    this.triggerBackgroundSync();
    return true;
  }

  async list(): Promise<WatchlistItem[]> {
    const db = await this.getDb();
    const items: WatchlistItem[] = await db.getAll(STORE_NAME);

    return items.sort((a, b) => {
      const timeA = new Date(a.addedAt).getTime();
      const timeB = new Date(b.addedAt).getTime();
      return timeB - timeA;
    });
  }

  async update(id: string, patch: UpdateWatchlistItemInput): Promise<WatchlistItem | null> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for update");
    }

    const db = await this.getDb();
    const existing = await db.get(STORE_NAME, id);
    if (!existing) {
      return null;
    }

    const validatedPatch = UpdateWatchlistItemSchema.parse(patch);
    const updatedItem: WatchlistItem = {
      ...existing,
      ...validatedPatch,
    };

    const validatedItem = WatchlistItemSchema.parse(updatedItem);
    await db.put(STORE_NAME, validatedItem);

    // Enqueue mutation for sync
    await enqueueMutation(
      {
        type: "update",
        movieId: id,
        patch: validatedPatch,
        timestamp: Date.now(),
      },
      this.customDbName
    );

    this.triggerBackgroundSync();
    return validatedItem;
  }

  async get(id: string): Promise<WatchlistItem | null> {
    const db = await this.getDb();
    const item = await db.get(STORE_NAME, id);
    return item || null;
  }

  async has(id: string): Promise<boolean> {
    const db = await this.getDb();
    const item = await db.get(STORE_NAME, id);
    return !!item;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE_NAME);
  }
}
