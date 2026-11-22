import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import {
  IndexedDbRepository,
  LocalStorageWatchlistRepository,
  isIndexedDbSupported,
  getWatchlistRepository,
} from "@/lib/watchlist/repository";

describe("IndexedDB & Offline Watchlist Storage (Day 35)", () => {
  let idbRepo: IndexedDbRepository;

  beforeEach(async () => {
    // Generate a unique database name for each test iteration
    const dbName = `test-db-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    idbRepo = new IndexedDbRepository(dbName);
  });

  afterEach(async () => {
    try {
      await idbRepo.clear();
    } catch {
      // Ignore cleanup error
    }
  });

  describe("IndexedDbRepository Implementation", () => {
    it("adds and retrieves movies from IndexedDB with schema validation", async () => {
      const added = await idbRepo.add({
        id: "m-101",
        title: "Interstellar",
        poster: "https://image.tmdb.org/t/p/w500/interstellar.jpg",
        year: "2014",
        rating: 8.7,
      });

      expect(added.id).toBe("m-101");
      expect(added.title).toBe("Interstellar");
      expect(added.addedAt).toBeDefined();

      const fetched = await idbRepo.get("m-101");
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe("Interstellar");
      expect(await idbRepo.has("m-101")).toBe(true);
    });

    it("lists items sorted by addedAt descending from IndexedDB", async () => {
      await idbRepo.add({
        id: "m-first",
        title: "First Movie",
        addedAt: "2024-01-01T00:00:00.000Z",
      });
      await idbRepo.add({
        id: "m-second",
        title: "Second Movie",
        addedAt: "2026-01-01T00:00:00.000Z",
      });

      const list = await idbRepo.list();
      expect(list.length).toBe(2);
      expect(list[0].id).toBe("m-second");
      expect(list[1].id).toBe("m-first");
    });

    it("updates attributes in IndexedDB with schema validation", async () => {
      await idbRepo.add({ id: "m-update", title: "Original Title", rating: 7.0 });

      const updated = await idbRepo.update("m-update", {
        notes: "Rewatched in 4K HDR",
        rating: 8.5,
      });

      expect(updated?.notes).toBe("Rewatched in 4K HDR");
      expect(updated?.rating).toBe(8.5);

      const verified = await idbRepo.get("m-update");
      expect(verified?.rating).toBe(8.5);
    });

    it("removes movies from IndexedDB and reports boolean status", async () => {
      await idbRepo.add({ id: "m-del", title: "Delete Me" });
      expect(await idbRepo.has("m-del")).toBe(true);

      const removed = await idbRepo.remove("m-del");
      expect(removed).toBe(true);
      expect(await idbRepo.has("m-del")).toBe(false);

      const secondAttempt = await idbRepo.remove("m-del");
      expect(secondAttempt).toBe(false);
    });

    it("clears all items in the IndexedDB store", async () => {
      await idbRepo.add({ id: "m-1", title: "M1" });
      await idbRepo.add({ id: "m-2", title: "M2" });
      expect((await idbRepo.list()).length).toBe(2);

      await idbRepo.clear();
      expect((await idbRepo.list()).length).toBe(0);
    });
  });

  describe("LocalStorageWatchlistRepository Fallback", () => {
    let localRepo: LocalStorageWatchlistRepository;
    const testKey = "test_local_storage_watchlist";

    beforeEach(() => {
      window.localStorage.removeItem(testKey);
      localRepo = new LocalStorageWatchlistRepository(testKey);
    });

    afterEach(() => {
      window.localStorage.removeItem(testKey);
    });

    it("stores, updates, and retrieves items using localStorage fallback", async () => {
      await localRepo.add({
        id: "m-local-1",
        title: "Pulp Fiction",
        year: "1994",
        rating: 8.9,
      });

      expect(await localRepo.has("m-local-1")).toBe(true);
      const fetched = await localRepo.get("m-local-1");
      expect(fetched?.title).toBe("Pulp Fiction");

      await localRepo.update("m-local-1", { notes: "Favorite film" });
      const updated = await localRepo.get("m-local-1");
      expect(updated?.notes).toBe("Favorite film");

      const removed = await localRepo.remove("m-local-1");
      expect(removed).toBe(true);
      expect(await localRepo.has("m-local-1")).toBe(false);
    });
  });

  describe("Offline Resilience & Fallback Detection", () => {
    it("detects IndexedDB support correctly", () => {
      expect(isIndexedDbSupported()).toBe(true);
    });

    it("selects IndexedDB repository when available", () => {
      const repo = getWatchlistRepository();
      expect(repo).toBeInstanceOf(IndexedDbRepository);
    });

    it("persists and reads data completely offline (navigator.onLine = false)", async () => {
      // Simulate browser entering offline state (DevTools "Offline" preset)
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });

      expect(navigator.onLine).toBe(false);

      // Save movie while offline
      await idbRepo.add({
        id: "m-offline-1",
        title: "Offline Cinema",
        year: "2026",
      });

      // Query saved watchlist offline
      const offlineList = await idbRepo.list();
      expect(offlineList.length).toBe(1);
      expect(offlineList[0].title).toBe("Offline Cinema");

      // Restore online status
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
      expect(navigator.onLine).toBe(true);
    });
  });
});
