# Task 6: Offline-First Watchlist Architecture & Synchronization

## Overview
A resilient, offline-first watchlist system providing seamless bookmarking, cross-tab synchronization, and optimistic UI transitions. The architecture guarantees zero data loss in offline states through local-first persistence (IndexedDB with LocalStorage fallback), conflict-free replication (Last-Write-Wins), and background mutation queueing.

---

## Key Deliverables & Implementation

1. **Typed Domain Schema & Validation (`lib/watchlist/schema.ts`)**:
   - `WatchlistItemSchema` (Zod v4) validating movie ID, title, poster URL, release year, numeric rating (0–10), watched flag, and optional notes (≤ 1000 chars).
   - Strict input validation contracts for insertion (`AddWatchlistItemSchema`), modification (`UpdateWatchlistItemSchema`), and sync payload schemas.

2. **Offline-First Storage Engine (`lib/watchlist/indexedDbRepository.ts`, `lib/watchlist/localStorageRepository.ts`)**:
   - Primary: **IndexedDB** using `idb` with two object stores:
     - `watchlist`: Stores movie items indexed by `id`, `addedAt`, and `rating`.
     - `pendingMutations`: FIFO queue of offline operations (`add`, `remove`, `update`) with auto-increment IDs.
   - Fallback: **LocalStorage** repository automatically engaged if IndexedDB is blocked (e.g. private browsing mode or storage quotas).
   - Factory abstraction `getWatchlistRepository()` dynamically resolving the optimal local backend.

3. **Optimistic UI with Rollback & Undo Notifications (`components/watchlist/WatchlistButton.tsx`, `components/watchlist/Toast.tsx`)**:
   - Instant UI feedback via TanStack Query optimistic updates (`onMutate` cache snapshots).
   - Dynamic rollback with error toast on mutation failures.
   - Framer Motion spring feedback animations (`whileTap={{ scale: 0.85 }}`).
   - Accessible undo toast notifications with `aria-live="polite"` announcing changes to screen readers and enabling one-click restoration.

4. **Multi-Tab Synchronization & Live Sync Status Indicator (`lib/watchlist/broadcaster.ts`, `components/watchlist/SyncStatusIndicator.tsx`)**:
   - Multi-tab communication using native `BroadcastChannel('imdb_watchlist_channel')`.
   - Redundant cross-tab propagation via `storage` event listeners for environments without `BroadcastChannel`.
   - Real-time `SyncStatusIndicator` badge in navigation header displaying live network transitions:
     - **Synced** (Emerald dot, fully up to date)
     - **Syncing** (Animated spinner, active batch payload flush)
     - **Offline** (Amber warning dot, queued writes in local store)

5. **Conflict Resolution & Batch Sync API (`lib/watchlist/syncEngine.ts`, `app/api/watchlist/sync/route.ts`)**:
   - Deterministic **Last-Write-Wins (LWW)** conflict resolution comparing ISO 8601 timestamps per record.
   - Next.js batch synchronization endpoint (`POST /api/watchlist/sync`) merging offline queues and returning reconciled datasets with `reconciledCount` metrics.
   - Automatic background sync drainage on `window.addEventListener('online')`.

6. **Watchlist Management & Interactive List (`app/watchlist/page.tsx`, `components/watchlist/WatchlistView.tsx`)**:
   - Filter tabs: **All**, **Unwatched**, **Watched** with live item count counters.
   - Sort dropdown: **Recently Added**, **Highest Rated**, **Title (A–Z)**, and **Custom Order**.
   - Framer Motion drag-and-drop reordering with `Reorder.Group` and `Reorder.Item`.
   - Accessible movie cards with poster thumbnails, title links, rating badges, watched toggles, and deletion controls.
   - Polished empty state with "Browse Popular Movies" CTA when no titles are saved.

---

## Test & Verification Suite

- **Repository Unit Tests (`tests/watchlistRepository.test.ts`)**: CRUD verification and boundary conditions for `InMemoryWatchlistRepository`.
- **IndexedDB Resilience Tests (`tests/indexedDbRepository.test.ts`)**: Verified store initialization, mutations queueing, batch drainage, and LocalStorage fallback.
- **Sync & Conflict Resolution Tests (`tests/watchlistSync.test.ts`)**: Tested LWW edge cases, conflicting edits, and `POST /api/watchlist/sync` API endpoint.
- **Cross-Tab Synchronization Tests (`tests/crossTabSync.test.tsx`)**: Tested `BroadcastChannel` messages, storage event fallbacks, and `SyncStatusIndicator` states.
- **Optimistic Button & Undo Tests (`tests/watchlistButton.test.tsx`)**: Verified optimistic cache update, mutation rollback, and toast restoration.
- **Watchlist Page & View Tests (`tests/watchlistPage.test.tsx`)**: Tested filtering, sorting, watched toggles, empty states, and item removals.
- **E2E & Resilience Workflows (`tests/watchlistE2E.test.ts`, `e2e/watchlist.spec.ts`)**:
  - Test 1: Item persistence across reloads / restarts.
  - Test 2: Offline mutation queueing and automatic sync flush on reconnect.
  - Test 3: Multi-tab concurrent edits without data loss or duplicates.
  - Test 4: IndexedDB sequential throughput (< 5ms per item benchmark).
