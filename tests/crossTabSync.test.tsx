import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  broadcastWatchlistChange,
  subscribeWatchlistChanges,
  emitSyncStatus,
  WatchlistBroadcastEvent,
} from "@/lib/watchlist/broadcaster";
import SyncStatusIndicator from "@/components/watchlist/SyncStatusIndicator";

describe("Cross-Tab Watchlist Synchronization & Sync Indicator (Day 37)", () => {
  describe("Broadcaster & Fallback Mechanism", () => {
    it("broadcasts watchlist changes and notifies same-tab / cross-tab subscribers", () => {
      const received: WatchlistBroadcastEvent[] = [];
      const unsubscribe = subscribeWatchlistChanges((event) => {
        received.push(event);
      });

      broadcastWatchlistChange("add", "m-999");

      // Verify localStorage fallback key is populated
      const stored = window.localStorage.getItem("imdb_watchlist_sync_event");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.action).toBe("add");
      expect(parsed.movieId).toBe("m-999");

      // Simulate a storage event from another tab
      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "imdb_watchlist_sync_event",
          newValue: JSON.stringify({
            type: "WATCHLIST_CHANGE",
            action: "remove",
            movieId: "m-888",
            timestamp: Date.now(),
          }),
        });
        window.dispatchEvent(storageEvent);
      });

      expect(received.some((e) => e.movieId === "m-888" && e.action === "remove")).toBe(true);

      unsubscribe();
    });
  });

  describe("SyncStatusIndicator Component", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders default Synced status when online", () => {
      render(<SyncStatusIndicator />);
      const statusBadge = screen.getByRole("status");
      expect(statusBadge).toBeDefined();
      expect(screen.getByText("Synced")).toBeDefined();
    });

    it("transitions to Offline status when navigator is offline or window fires offline", () => {
      render(<SyncStatusIndicator />);

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(screen.getByText("Offline")).toBeDefined();
    });

    it("transitions to Syncing... on online event and then back to Synced", () => {
      render(<SyncStatusIndicator />);

      act(() => {
        window.dispatchEvent(new Event("online"));
      });

      expect(screen.getByText("Syncing...")).toBeDefined();

      // Advance timer for flush completion
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByText("Synced")).toBeDefined();
    });

    it("reacts to explicit emitSyncStatus updates", () => {
      render(<SyncStatusIndicator />);

      act(() => {
        emitSyncStatus("syncing");
      });
      expect(screen.getByText("Syncing...")).toBeDefined();

      act(() => {
        emitSyncStatus("synced");
      });
      expect(screen.getByText("Synced")).toBeDefined();
    });
  });
});
