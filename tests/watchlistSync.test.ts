import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { NextRequest } from "next/server";
import { serverWatchlistStore } from "@/lib/watchlist/serverStore";
import { POST, GET } from "@/app/api/watchlist/sync/route";
import {
  enqueueMutation,
  getPendingMutations,
  removeMutations,
  flushMutationQueue,
  clearMutationQueue,
  registerOnlineSyncListener,
} from "@/lib/watchlist/mutationQueue";

describe("Watchlist Server Sync & Last-Write-Wins (LWW) (Day 36)", () => {
  beforeEach(() => {
    serverWatchlistStore.clear();
  });

  describe("Last-Write-Wins Conflict Resolution", () => {
    it("applies client mutation when client timestamp is newer than server state", () => {
      // Server currently has item updated at timestamp 1000
      serverWatchlistStore.setServerItem({
        id: "m-1",
        title: "Dune",
        addedAt: new Date(1000).toISOString(),
        serverUpdatedAt: 1000,
        notes: "Old server note",
      });

      // Client sends mutation with newer timestamp 2000
      const syncResult = serverWatchlistStore.reconcile({
        clientMutations: [
          {
            id: "mut-client-1",
            type: "update",
            movieId: "m-1",
            patch: { notes: "Newer client note" },
            timestamp: 2000,
          },
        ],
      });

      expect(syncResult.applied).toContain("mut-client-1");
      expect(syncResult.conflictsResolved).toBe(0);

      const updated = serverWatchlistStore.getServerItems().find((i) => i.id === "m-1");
      expect(updated?.notes).toBe("Newer client note");
    });

    it("rejects client mutation and retains server state when server state is newer (server wins)", () => {
      // Server has item updated at timestamp 5000
      serverWatchlistStore.setServerItem({
        id: "m-2",
        title: "Gladiator",
        addedAt: new Date(5000).toISOString(),
        serverUpdatedAt: 5000,
        notes: "Authoritative server note",
      });

      // Client sends stale mutation generated at timestamp 3000 (e.g. from an offline device)
      const syncResult = serverWatchlistStore.reconcile({
        clientMutations: [
          {
            id: "mut-client-stale",
            type: "update",
            movieId: "m-2",
            patch: { notes: "Stale offline note" },
            timestamp: 3000,
          },
        ],
      });

      // Stale mutation is not applied
      expect(syncResult.applied).not.toContain("mut-client-stale");
      // Conflict counted and resolved in favor of server
      expect(syncResult.conflictsResolved).toBe(1);

      const current = serverWatchlistStore.getServerItems().find((i) => i.id === "m-2");
      expect(current?.notes).toBe("Authoritative server note");
    });

    it("applies deletion tombstone when client removal is newer", () => {
      serverWatchlistStore.setServerItem({
        id: "m-3",
        title: "Memento",
        addedAt: new Date(1000).toISOString(),
        serverUpdatedAt: 1000,
      });

      const syncResult = serverWatchlistStore.reconcile({
        clientMutations: [
          {
            id: "mut-del",
            type: "remove",
            movieId: "m-3",
            timestamp: 2000,
          },
        ],
      });

      expect(syncResult.applied).toContain("mut-del");
      expect(serverWatchlistStore.getServerItems().find((i) => i.id === "m-3")).toBeUndefined();
    });
  });

  describe("Sync Route Handler (POST /api/watchlist/sync)", () => {
    it("handles batch sync requests and returns reconciled active items", async () => {
      const requestPayload = {
        clientMutations: [
          {
            id: "mut-1",
            type: "add" as const,
            movieId: "m-batman",
            item: {
              id: "m-batman",
              title: "The Batman",
              addedAt: new Date(1500).toISOString(),
              rating: 8.0,
            },
            timestamp: 1500,
          },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/watchlist/sync", {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.applied).toContain("mut-1");
      expect(data.serverItems.some((i: any) => i.id === "m-batman")).toBe(true);
      expect(data.syncTime).toBeDefined();
    });

    it("rejects invalid request payload with 400 Bad Request", async () => {
      const req = new NextRequest("http://localhost:3000/api/watchlist/sync", {
        method: "POST",
        body: JSON.stringify({ invalidField: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("GET endpoint returns current server items", async () => {
      serverWatchlistStore.setServerItem({
        id: "m-get-test",
        title: "Test Movie",
        addedAt: new Date().toISOString(),
        serverUpdatedAt: 1000,
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.count).toBe(1);
      expect(data.items[0].id).toBe("m-get-test");
    });
  });

  describe("Offline Mutation Queue in IndexedDB", () => {
    const testQueueDb = `test-queue-${Date.now()}`;

    afterEach(async () => {
      try {
        await clearMutationQueue(testQueueDb);
      } catch {
        // Ignore cleanup error
      }
    });

    it("enqueues mutations into IndexedDB pendingMutations store", async () => {
      const mut1 = await enqueueMutation(
        {
          type: "add",
          movieId: "m-offline-1",
          item: {
            id: "m-offline-1",
            title: "Offline Title",
            addedAt: new Date().toISOString(),
          },
          timestamp: 1000,
        },
        testQueueDb
      );

      expect(mut1.id).toBeDefined();

      const pending = await getPendingMutations(testQueueDb);
      expect(pending.length).toBe(1);
      expect(pending[0].movieId).toBe("m-offline-1");
    });

    it("removes committed mutations from the queue", async () => {
      const mut = await enqueueMutation(
        {
          type: "remove",
          movieId: "m-rem",
          timestamp: 2000,
        },
        testQueueDb
      );

      expect((await getPendingMutations(testQueueDb)).length).toBe(1);

      await removeMutations([mut.id], testQueueDb);
      expect((await getPendingMutations(testQueueDb)).length).toBe(0);
    });

    it("flushes mutation queue to sync endpoint and cleans up committed mutations", async () => {
      const mutation = await enqueueMutation(
        {
          type: "add",
          movieId: "m-sync-flush",
          item: {
            id: "m-sync-flush",
            title: "Flush Movie",
            addedAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        },
        testQueueDb
      );

      // Mock fetch response for sync endpoint
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          applied: [mutation.id],
          conflictsResolved: 0,
          serverItems: [],
          syncTime: Date.now(),
        }),
      });
      globalThis.fetch = mockFetch;

      const flushResult = await flushMutationQueue("/api/watchlist/sync", testQueueDb);
      expect(flushResult.success).toBe(true);
      expect(flushResult.flushed).toBe(1);

      // Queue should now be empty
      const remaining = await getPendingMutations(testQueueDb);
      expect(remaining.length).toBe(0);
    });

    it("registers and cleans up window online event listener", () => {
      const cleanup = registerOnlineSyncListener("/api/watchlist/sync", testQueueDb);
      expect(typeof cleanup).toBe("function");
      cleanup();
    });
  });
});
