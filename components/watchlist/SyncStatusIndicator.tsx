"use client";

import React, { useState, useEffect } from "react";
import {
  SyncStatus,
  subscribeSyncStatus,
  subscribeWatchlistChanges,
  emitSyncStatus,
} from "@/lib/watchlist/broadcaster";

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>("synced");

  useEffect(() => {
    // Check initial online status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
    }

    const handleOnline = () => {
      setStatus("syncing");
      emitSyncStatus("syncing");
      // Settle to synced after flush completes
      setTimeout(() => {
        setStatus("synced");
        emitSyncStatus("synced");
      }, 1000);
    };

    const handleOffline = () => {
      setStatus("offline");
      emitSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to explicit sync status changes
    const unsubStatus = subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });

    // When other tabs make changes, briefly display "syncing" then "synced"
    const unsubChanges = subscribeWatchlistChanges(() => {
      if (navigator.onLine) {
        setStatus("syncing");
        setTimeout(() => setStatus("synced"), 600);
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubStatus();
      unsubChanges();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Watchlist sync status: ${status}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 select-none bg-theme-surface-subtle border-theme-border text-theme-fg"
    >
      {status === "synced" && (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-emerald-400">Synced</span>
        </>
      )}

      {status === "syncing" && (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-amber-300">Syncing...</span>
        </>
      )}

      {status === "offline" && (
        <>
          <span className="w-2 h-2 rounded-full bg-zinc-500" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-theme-fg-muted">Offline</span>
        </>
      )}
    </div>
  );
}
