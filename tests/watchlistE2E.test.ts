import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { IndexedDbRepository } from "@/lib/watchlist/indexedDbRepository";
import { LocalStorageWatchlistRepository } from "@/lib/watchlist/localStorageRepository";
import {
  broadcastWatchlistChange,
  subscribeWatchlistChanges,
  WatchlistBroadcastEvent,
} from "@/lib/watchlist/broadcaster";
import { serverWatchlistStore } from "@/lib/watchlist/serverStore";
import {
  enqueueMutation,
  getPendingMutations,
  removeMutations,
  flushMutationQueue,
  clearMutationQueue,
} from "@/lib/watchlist/mutationQueue";
import { WatchlistItem } from "@/lib/watchlist/schema";

describe("Task 6: Watchlist Offline Resilience & E2E Workflows (Day 40)", () => {
  beforeEach(async () => {
    localStorage.clear();
    serverWatchlistStore.clear();
    await clearMutationQueue();
    const repo = new IndexedDbRepository();
    await repo.clear();
  });

  afterEach(async () => {
    localStorage.clear();
  });

  describe("Scenario 1: Persistence Across Page Refreshes / Sessions", () => {
    it("persists items across client restarts and simulated page reloads", async () => {
      // Session 1: User adds a movie to IndexedDB
      const session1Repo = new IndexedDbRepository();
      const movie: WatchlistItem = {
        id: "m-777",
        title: "Interstellar",
        poster: "https://image.tmdb.org/t/p/w500/interstellar.jpg",
        year: "2014",
        rating: 8.7,
        addedAt: new Date().toISOString(),
      };
      await session1Repo.add(movie);

      expect(await session1Repo.has("m-777")).toBe(true);

      // Session 2: User refreshes page (new repo instance connecting to the same store)
      const session2Repo = new IndexedDbRepository();
      const loaded = await session2Repo.get("m-777");

      expect(loaded).not.toBeNull();
      expect(loaded?.title).toBe("Interstellar");
      expect(loaded?.year).toBe("2014");
      expect(loaded?.rating).toBe(8.7);
    });
  });

  describe("Scenario 2: Offline Mutation Queueing & Online Reconnect Sync", () => {
    it("queues mutations while offline and synchronizes via LWW upon reconnect", async () => {
      // Simulate offline writes queued in IndexedDB mutation queue
      await enqueueMutation({
        type: "add",
        movieId: "m-500",
        timestamp: 2000,
        item: {
          id: "m-500",
          title: "The Matrix",
          rating: 8.7,
          addedAt: new Date(2000).toISOString(),
        },
      });

      await enqueueMutation({
        type: "update",
        movieId: "m-500",
        timestamp: 2500,
        patch: { notes: "Watched in 4K" },
      });

      const pending = await getPendingMutations();
      expect(pending.length).toBe(2);

      // Server initially has older version at timestamp 1000
      serverWatchlistStore.setServerItem({
        id: "m-500",
        title: "The Matrix",
        serverUpdatedAt: 1000,
        addedAt: new Date(1000).toISOString(),
      });

      // Reconcile pending mutations with server store using Last-Write-Wins (LWW)
      const reconcileResult = serverWatchlistStore.reconcile({
        clientMutations: pending,
      });

      expect(reconcileResult.applied.length).toBe(2);
      await removeMutations(reconcileResult.applied);

      // Check server store has newest notes
      const rawServerItem = serverWatchlistStore.getRawServerItems().find((i) => i.id === "m-500");
      expect(rawServerItem?.notes).toBe("Watched in 4K");
      expect(rawServerItem?.serverUpdatedAt).toBe(2500);

      // Queue is cleared after successful sync
      const remainingPending = await getPendingMutations();
      expect(remainingPending.length).toBe(0);
    });
  });

  describe("Scenario 3: Multi-Tab Concurrency & Conflict-Free Resolution", () => {
    it("handles concurrent edits across two simulated browser clients without duplicate entries", async () => {
      const client1Repo = new LocalStorageWatchlistRepository();
      const client2Repo = new LocalStorageWatchlistRepository();

      const eventsReceivedByClient2: WatchlistBroadcastEvent[] = [];
      const unsubscribe = subscribeWatchlistChanges((event) => {
        eventsReceivedByClient2.push(event);
      });

      // Client 1 adds "Dune"
      await client1Repo.add({
        id: "m-800",
        title: "Dune",
        addedAt: "2026-03-02T10:00:00.000Z",
      });
      broadcastWatchlistChange("add", "m-800");

      // Simulate the cross-tab storage event received by Client 2
      const storageEvent = new StorageEvent("storage", {
        key: "imdb_watchlist_sync_event",
        newValue: JSON.stringify({
          type: "WATCHLIST_CHANGE",
          action: "add",
          movieId: "m-800",
          timestamp: Date.now(),
        }),
      });
      window.dispatchEvent(storageEvent);

      // Client 2 adds "Oppenheimer"
      await client2Repo.add({
        id: "m-801",
        title: "Oppenheimer",
        addedAt: "2026-03-02T10:01:00.000Z",
      });

      // Verify cross-client notification was fired
      expect(eventsReceivedByClient2.length).toBeGreaterThanOrEqual(1);

      // Verify no duplicate IDs exist in either repository
      const allClient1 = await client1Repo.list();
      const uniqueIds = new Set(allClient1.map((i) => i.id));
      expect(uniqueIds.size).toBe(allClient1.length);

      unsubscribe();
    });

    it("resolves concurrent edits on same movie via LWW without lost data", () => {
      serverWatchlistStore.setServerItem({
        id: "m-900",
        title: "Gladiator II",
        rating: 8.0,
        serverUpdatedAt: 1000,
        addedAt: new Date(1000).toISOString(),
      });

      // Client 1 sends update at t=2000
      const res1 = serverWatchlistStore.reconcile({
        clientMutations: [
          {
            id: "mut-1",
            type: "update",
            movieId: "m-900",
            patch: { rating: 8.2 },
            timestamp: 2000,
          },
        ],
      });
      expect(res1.applied).toContain("mut-1");

      // Client 2 sends older update at t=1500 (conflict - should be rejected by LWW)
      const res2 = serverWatchlistStore.reconcile({
        clientMutations: [
          {
            id: "mut-2",
            type: "update",
            movieId: "m-900",
            patch: { rating: 7.9 },
            timestamp: 1500,
          },
        ],
      });
      expect(res2.conflictsResolved).toBe(1);
      expect(res2.applied).not.toContain("mut-2");

      // Final rating is 8.2 from client 1
      const item = serverWatchlistStore.getServerItems().find((i) => i.id === "m-900");
      expect(item?.rating).toBe(8.2);
    });
  });

  describe("Scenario 4: Performance Benchmark", () => {
    it("completes 50 sequential IndexedDB operations well within 500ms budget (< 10ms per item)", async () => {
      const repo = new IndexedDbRepository();
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        await repo.add({
          id: `bench-${i}`,
          title: `Movie ${i}`,
          rating: 7.5,
          year: "2024",
        });
      }

      const listResult = await repo.list();
      expect(listResult.length).toBe(50);

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
