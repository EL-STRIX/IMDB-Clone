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
      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-theme-border bg-theme-card transition-colors select-none"
      title={`Watchlist: ${status}`}
    >
      {status === "synced" && (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" aria-hidden="true" />
          <span className="sr-only">Synced</span>
        </>
      )}

      {status === "syncing" && (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
          <span className="sr-only">Syncing...</span>
        </>
      )}

      {status === "offline" && (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" aria-hidden="true" />
          <span className="sr-only">Offline</span>
        </>
      )}
    </div>
  );
}
