export type WatchlistEventAction = "add" | "remove" | "update" | "sync";

export interface WatchlistBroadcastEvent {
  type: "WATCHLIST_CHANGE";
  action: WatchlistEventAction;
  movieId?: string;
  timestamp: number;
}

export type SyncStatus = "synced" | "syncing" | "offline";

const CHANNEL_NAME = "imdb_watchlist_channel";
const STORAGE_EVENT_KEY = "imdb_watchlist_sync_event";
const SYNC_STATUS_EVENT = "watchlist:sync-status";

let broadcastChannelInstance: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannelInstance = null;
    }
  }
  return broadcastChannelInstance;
}

/**
 * Broadcasts a watchlist modification across all open tabs.
 * Uses BroadcastChannel as primary mechanism with localStorage storage events as fallback.
 */
export function broadcastWatchlistChange(
  action: WatchlistEventAction,
  movieId?: string
): void {
  if (typeof window === "undefined") return;

  const event: WatchlistBroadcastEvent = {
    type: "WATCHLIST_CHANGE",
    action,
    movieId,
    timestamp: Date.now(),
  };

  // 1. Primary: BroadcastChannel
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(event);
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback: localStorage storage events for cross-tab communication
  try {
    window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
  } catch {
    // Storage quota or private mode
  }

  // 3. Same-tab listener notification
  try {
    window.dispatchEvent(new CustomEvent("watchlist:change", { detail: event }));
  } catch {
    // Ignore in non-browser
  }
}

/**
 * Subscribes to watchlist changes originating from other browser tabs or windows.
 */
export function subscribeWatchlistChanges(
  callback: (event: WatchlistBroadcastEvent) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // BroadcastChannel message handler
  const channel = getBroadcastChannel();
  const handleChannelMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === "WATCHLIST_CHANGE") {
      callback(e.data);
    }
  };

  if (channel) {
    channel.addEventListener("message", handleChannelMessage);
  }

  // Fallback: storage event listener for cross-tab updates
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_EVENT_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.type === "WATCHLIST_CHANGE") {
          callback(parsed);
        }
      } catch {
        // Ignore parse error
      }
    }
  };

  window.addEventListener("storage", handleStorage);

  // Return unsubscribe cleanup function
  return () => {
    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
    }
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Emits live sync status (Synced, Syncing, Offline)
 */
export function emitSyncStatus(status: SyncStatus): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: status }));
  } catch {
    // Ignore in non-DOM environments
  }
}

/**
 * Subscribes to live sync status transitions
 */
export function subscribeSyncStatus(
  callback: (status: SyncStatus) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (e: Event) => {
    const custom = e as CustomEvent<SyncStatus>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  window.addEventListener(SYNC_STATUS_EVENT, handler);
  return () => {
    window.removeEventListener(SYNC_STATUS_EVENT, handler);
  };
}
