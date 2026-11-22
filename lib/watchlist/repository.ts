import {
  WatchlistItem,
  WatchlistItemSchema,
  AddWatchlistItemInput,
  AddWatchlistItemSchema,
  UpdateWatchlistItemInput,
  UpdateWatchlistItemSchema,
} from "./schema";
import { IndexedDbRepository } from "./indexedDbRepository";
import { LocalStorageWatchlistRepository } from "./localStorageRepository";

export { IndexedDbRepository } from "./indexedDbRepository";
export { LocalStorageWatchlistRepository } from "./localStorageRepository";

export interface WatchlistRepository {
  add(item: AddWatchlistItemInput): Promise<WatchlistItem>;
  remove(id: string): Promise<boolean>;
  list(): Promise<WatchlistItem[]>;
  update(id: string, patch: UpdateWatchlistItemInput): Promise<WatchlistItem | null>;
  get(id: string): Promise<WatchlistItem | null>;
  has(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class InMemoryWatchlistRepository implements WatchlistRepository {
  private items = new Map<string, WatchlistItem>();

  async add(input: AddWatchlistItemInput): Promise<WatchlistItem> {
    const validatedInput = AddWatchlistItemSchema.parse(input);
    const item: WatchlistItem = {
      ...validatedInput,
      poster: validatedInput.poster ?? null,
      addedAt: validatedInput.addedAt || new Date().toISOString(),
    };

    // Validate full complete item against schema
    const validatedItem = WatchlistItemSchema.parse(item);
    this.items.set(validatedItem.id, validatedItem);
    return validatedItem;
  }

  async remove(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for removal");
    }
    return this.items.delete(id);
  }

  async list(): Promise<WatchlistItem[]> {
    return Array.from(this.items.values()).sort((a, b) => {
      const timeA = new Date(a.addedAt).getTime();
      const timeB = new Date(b.addedAt).getTime();
      return timeB - timeA;
    });
  }

  async update(id: string, patch: UpdateWatchlistItemInput): Promise<WatchlistItem | null> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for update");
    }

    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }

    const validatedPatch = UpdateWatchlistItemSchema.parse(patch);
    const updatedItem: WatchlistItem = {
      ...existing,
      ...validatedPatch,
    };

    const validatedItem = WatchlistItemSchema.parse(updatedItem);
    this.items.set(id, validatedItem);
    return validatedItem;
  }

  async get(id: string): Promise<WatchlistItem | null> {
    return this.items.get(id) || null;
  }

  async has(id: string): Promise<boolean> {
    return this.items.has(id);
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}

export const defaultWatchlistRepository = new InMemoryWatchlistRepository();

/**
 * Checks whether the current runtime environment supports IndexedDB.
 */
export function isIndexedDbSupported(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      "indexedDB" in window &&
      window.indexedDB !== null &&
      typeof window.indexedDB.open === "function"
    );
  } catch {
    return false;
  }
}

let activeRepository: WatchlistRepository | null = null;

/**
 * Resolves the optimal available WatchlistRepository:
 * 1. IndexedDbRepository (offline-first IndexedDB storage)
 * 2. LocalStorageWatchlistRepository (fallback for browsers where IDB is unavailable)
 * 3. InMemoryWatchlistRepository (SSR / test / fallback)
 */
export function getWatchlistRepository(): WatchlistRepository {
  if (activeRepository) {
    return activeRepository;
  }

  if (isIndexedDbSupported()) {
    activeRepository = new IndexedDbRepository();
    return activeRepository;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    activeRepository = new LocalStorageWatchlistRepository();
    return activeRepository;
  }

  return defaultWatchlistRepository;
}
