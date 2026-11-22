"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reorder, motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWatchlistRepository } from "@/lib/watchlist/repository";
import { WatchlistItem } from "@/lib/watchlist/schema";
import { subscribeWatchlistChanges } from "@/lib/watchlist/broadcaster";
import { showToast } from "@/components/watchlist/Toast";

type FilterType = "all" | "unwatched" | "watched";
type SortType = "recent" | "rating" | "title" | "custom";

const EMPTY_WATCHLIST: WatchlistItem[] = [];

export function WatchlistSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-48 bg-theme-surface-subtle rounded mb-2" />
      <div className="h-4 w-72 bg-theme-surface-subtle rounded mb-6" />
      <div className="h-12 w-full bg-theme-surface-subtle rounded-xl mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full bg-theme-surface-subtle rounded-xl border border-theme-border/50"
          />
        ))}
      </div>
    </div>
  );
}

export default function WatchlistView() {
  const queryClient = useQueryClient();
  const repository = getWatchlistRepository();

  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Fetch watchlist items
  const { data: rawWatchlist = EMPTY_WATCHLIST, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => repository.list(),
  });

  // Keep local order state synchronized with query data
  useEffect(() => {
    setItems(rawWatchlist);
  }, [rawWatchlist]);

  // Subscribe to cross-tab modifications
  useEffect(() => {
    const unsubscribe = subscribeWatchlistChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // Mutation: Toggle watched status
  const toggleWatchedMutation = useMutation({
    mutationFn: async ({ id, watched }: { id: string; watched: boolean }) => {
      await repository.update(id, { watched });
    },
    onMutate: async ({ id, watched }) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]) || [];
      queryClient.setQueryData<WatchlistItem[]>(["watchlist"], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, watched } : item))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  // Mutation: Remove item with undo toast
  const removeMutation = useMutation({
    mutationFn: async (itemToRemove: WatchlistItem) => {
      await repository.remove(itemToRemove.id);
      return itemToRemove;
    },
    onMutate: async (itemToRemove) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]) || [];
      queryClient.setQueryData<WatchlistItem[]>(["watchlist"], (old = []) =>
        old.filter((i) => i.id !== itemToRemove.id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
      showToast({ message: "Failed to remove item from watchlist" });
    },
    onSuccess: (removedItem) => {
      showToast({
        message: `Removed "${removedItem.title}" from your Watchlist`,
        actionLabel: "Undo",
        onAction: async () => {
          await repository.add(removedItem);
          queryClient.invalidateQueries({ queryKey: ["watchlist"] });
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  // Counts for tabs
  const unwatchedCount = useMemo(
    () => rawWatchlist.filter((item) => !item.watched).length,
    [rawWatchlist]
  );
  const watchedCount = useMemo(
    () => rawWatchlist.filter((item) => !!item.watched).length,
    [rawWatchlist]
  );

  // Filter and sort items for display
  const displayedItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (filter === "unwatched") {
      result = result.filter((item) => !item.watched);
    } else if (filter === "watched") {
      result = result.filter((item) => !!item.watched);
    }

    // Sort
    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "recent") {
      result.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    }
    // "custom" preserves drag-and-drop order in result

    return result;
  }, [items, filter, sortBy]);

  const handleReorder = (newOrder: WatchlistItem[]) => {
    setSortBy("custom");
    setItems(newOrder);
  };

  if (isLoading) {
    return <WatchlistSkeleton />;
  }

  // Empty state when user has 0 saved movies
  if (rawWatchlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-theme-surface-subtle border border-theme-border flex items-center justify-center text-amber-400 text-2xl shadow-inner">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-fg mb-2">
          Your Watchlist is empty
        </h1>
        <p className="text-sm text-theme-fg-muted max-w-md mx-auto mb-8">
          Explore movies and click the bookmark icon on any movie to save titles you want to watch next.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-theme-accent text-zinc-950 hover:opacity-95 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
        >
          <span>Browse Popular Movies</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-fg">
            Your Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-theme-fg-muted mt-1">
            Track, reorder, and manage titles you want to watch. Saved offline in your browser.
          </p>
        </div>
        <span className="text-xs font-mono text-theme-fg-muted self-start sm:self-auto">
          {displayedItems.length} {displayedItems.length === 1 ? "title" : "titles"}
        </span>
      </div>

      {/* Filter Tabs and Sort Controls */}
      <div className="p-3 rounded-xl bg-theme-surface border border-theme-border shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer ${
              filter === "all"
                ? "bg-theme-accent text-zinc-950 font-bold"
                : "text-theme-fg-muted hover:text-theme-fg"
            }`}
          >
            All ({rawWatchlist.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unwatched")}
            aria-pressed={filter === "unwatched"}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer ${
              filter === "unwatched"
                ? "bg-theme-accent text-zinc-950 font-bold"
                : "text-theme-fg-muted hover:text-theme-fg"
            }`}
          >
            Unwatched ({unwatchedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("watched")}
            aria-pressed={filter === "watched"}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer ${
              filter === "watched"
                ? "bg-theme-accent text-zinc-950 font-bold"
                : "text-theme-fg-muted hover:text-theme-fg"
            }`}
          >
            Watched ({watchedCount})
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="watchlist-sort" className="text-xs text-theme-fg-muted sr-only">
            Sort by
          </label>
          <select
            id="watchlist-sort"
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="text-xs px-3 py-1.5 min-h-[36px] rounded-lg bg-theme-surface-subtle border border-theme-border text-theme-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title (A–Z)</option>
            <option value="custom">Custom Order (Drag to reorder)</option>
          </select>
        </div>
      </div>

      {/* Drag-and-Drop Reorderable List */}
      {displayedItems.length === 0 ? (
        <div className="p-8 rounded-xl bg-theme-surface border border-theme-border text-center text-sm text-theme-fg-muted">
          No titles found in this filter category.
        </div>
      ) : (
        <Reorder.Group
          as="ul"
          axis="y"
          values={displayedItems}
          onReorder={handleReorder}
          aria-label="Watchlist movies list"
          className="space-y-3"
        >
          {displayedItems.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              as="li"
              className="group flex items-center gap-3 p-3 rounded-xl bg-theme-surface border border-theme-border shadow-sm hover:border-theme-primary/50 transition-colors"
            >
              {/* Drag Handle Grip */}
              <div
                className="cursor-grab active:cursor-grabbing p-2 min-h-[40px] min-w-[36px] flex items-center justify-center text-theme-fg-muted hover:text-theme-fg shrink-0"
                aria-label={`Reorder ${item.title}`}
                tabIndex={0}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5a2 2 0 11-4 0 2 2 0 014 0zm0 7a2 2 0 11-4 0 2 2 0 014 0zm0 7a2 2 0 11-4 0 2 2 0 014 0zm10-14a2 2 0 11-4 0 2 2 0 014 0zm0 7a2 2 0 11-4 0 2 2 0 014 0zm0 7a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Poster Thumbnail */}
              <Link
                href={`/movie/${item.id}`}
                className="relative w-12 h-16 rounded overflow-hidden bg-theme-surface-subtle shrink-0 border border-theme-border"
                tabIndex={-1}
              >
                <Image
                  src={item.poster || "/placeholder-poster.svg"}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </Link>

              {/* Title, Year, Rating */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/movie/${item.id}`}
                  className="font-bold text-sm text-theme-fg hover:text-theme-primary transition-colors line-clamp-1 focus-visible:outline-none focus-visible:underline"
                >
                  {item.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-theme-fg-muted">
                  {item.year && <span>{item.year}</span>}
                  {item.rating && (
                    <span className="font-semibold text-theme-primary">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  )}
                  {item.watched && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Watched
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Watched Toggle & Remove */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    toggleWatchedMutation.mutate({
                      id: item.id,
                      watched: !item.watched,
                    })
                  }
                  aria-label={item.watched ? `Mark ${item.title} as unwatched` : `Mark ${item.title} as watched`}
                  className={`px-3 py-1.5 min-h-[36px] text-xs rounded-lg font-medium border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
                    item.watched
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-theme-surface-subtle border-theme-border text-theme-fg-muted hover:text-theme-fg"
                  }`}
                >
                  {item.watched ? "✓ Watched" : "Mark Watched"}
                </button>

                <button
                  type="button"
                  onClick={() => removeMutation.mutate(item)}
                  aria-label={`Remove ${item.title} from watchlist`}
                  className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-theme-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
