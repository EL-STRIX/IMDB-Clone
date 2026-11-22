import {
  WatchlistItem,
  WatchlistItemSchema,
  AddWatchlistItemInput,
  AddWatchlistItemSchema,
  UpdateWatchlistItemInput,
  UpdateWatchlistItemSchema,
} from "./schema";
import { WatchlistRepository } from "./repository";

const STORAGE_KEY = "imdb_watchlist_storage";

export class LocalStorageWatchlistRepository implements WatchlistRepository {
  constructor(private storageKey: string = STORAGE_KEY) {}

  private getItemsMap(): Map<string, WatchlistItem> {
    if (typeof window === "undefined" || !window.localStorage) {
      return new Map();
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return new Map();
      const list: WatchlistItem[] = JSON.parse(raw);
      const map = new Map<string, WatchlistItem>();
      for (const item of list) {
        if (item && item.id) {
          map.set(item.id, item);
        }
      }
      return map;
    } catch {
      return new Map();
    }
  }

  private saveItemsMap(map: Map<string, WatchlistItem>): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      const list = Array.from(map.values());
      window.localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      // Storage quota exceeded or disabled
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
    const map = this.getItemsMap();
    map.set(validatedItem.id, validatedItem);
    this.saveItemsMap(map);
    return validatedItem;
  }

  async remove(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for removal");
    }

    const map = this.getItemsMap();
    const deleted = map.delete(id);
    if (deleted) {
      this.saveItemsMap(map);
    }
    return deleted;
  }

  async list(): Promise<WatchlistItem[]> {
    const map = this.getItemsMap();
    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.addedAt).getTime();
      const timeB = new Date(b.addedAt).getTime();
      return timeB - timeA;
    });
  }

  async update(id: string, patch: UpdateWatchlistItemInput): Promise<WatchlistItem | null> {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid id provided for update");
    }

    const map = this.getItemsMap();
    const existing = map.get(id);
    if (!existing) {
      return null;
    }

    const validatedPatch = UpdateWatchlistItemSchema.parse(patch);
    const updatedItem: WatchlistItem = {
      ...existing,
      ...validatedPatch,
    };

    const validatedItem = WatchlistItemSchema.parse(updatedItem);
    map.set(id, validatedItem);
    this.saveItemsMap(map);
    return validatedItem;
  }

  async get(id: string): Promise<WatchlistItem | null> {
    const map = this.getItemsMap();
    return map.get(id) || null;
  }

  async has(id: string): Promise<boolean> {
    const map = this.getItemsMap();
    return map.has(id);
  }

  async clear(): Promise<void> {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(this.storageKey);
    }
  }
}
