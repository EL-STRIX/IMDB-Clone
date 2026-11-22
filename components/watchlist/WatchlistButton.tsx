"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWatchlistRepository } from "@/lib/watchlist/repository";
import { WatchlistItem } from "@/lib/watchlist/schema";
import { showToast } from "./Toast";

interface WatchlistMovieInput {
  id: string;
  title: string;
  posterUrl?: string | null;
  year?: string;
  rating?: number;
}

interface WatchlistButtonProps {
  movie: WatchlistMovieInput;
  variant?: "button" | "icon";
  className?: string;
  onMutationError?: (error: Error) => void;
}

export default function WatchlistButton({
  movie,
  variant = "button",
  className = "",
  onMutationError,
}: WatchlistButtonProps) {
  const queryClient = useQueryClient();
  const repository = getWatchlistRepository();

  // Query cached watchlist
  const { data: watchlist = [] } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => repository.list(),
  });

  const isSaved = watchlist.some((item) => item.id === movie.id);

  // Optimistic mutation with rollback and undo toast
  const mutation = useMutation({
    mutationFn: async (shouldSave: boolean) => {
      if (shouldSave) {
        await repository.add({
          id: movie.id,
          title: movie.title,
          poster: movie.posterUrl ?? null,
          year: movie.year,
          rating: movie.rating,
        });
      } else {
        await repository.remove(movie.id);
      }
      return shouldSave;
    },
    onMutate: async (shouldSave: boolean) => {
      // Cancel ongoing refetches
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });

      // Snapshot previous watchlist state
      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]) || [];

      // Optimistically update cache
      queryClient.setQueryData<WatchlistItem[]>(["watchlist"], (old = []) => {
        if (shouldSave) {
          const optimisticItem: WatchlistItem = {
            id: movie.id,
            title: movie.title,
            poster: movie.posterUrl ?? null,
            year: movie.year,
            rating: movie.rating,
            addedAt: new Date().toISOString(),
          };
          return [optimisticItem, ...old.filter((item) => item.id !== movie.id)];
        } else {
          return old.filter((item) => item.id !== movie.id);
        }
      });

      return { previousWatchlist };
    },
    onError: (err: Error, _vars, context) => {
      // Rollback to previous state
      if (context?.previousWatchlist) {
        queryClient.setQueryData(["watchlist"], context.previousWatchlist);
      }
      showToast({
        message: `Failed to update watchlist: ${err.message || "Unknown error"}`,
      });
      onMutationError?.(err);
    },
    onSuccess: (saved) => {
      if (saved) {
        showToast({
          message: `Added "${movie.title}" to your Watchlist`,
          actionLabel: "Undo",
          onAction: () => {
            // Revert by removing
            mutation.mutate(false);
          },
        });
      } else {
        showToast({
          message: `Removed "${movie.title}" from your Watchlist`,
          actionLabel: "Undo",
          onAction: () => {
            // Revert by re-adding
            mutation.mutate(true);
          },
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mutation.mutate(!isSaved);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        suppressHydrationWarning
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
        className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
          isSaved
            ? "bg-amber-400/15 border-amber-400/40 text-amber-400 hover:bg-amber-400/25"
            : "bg-theme-surface border-theme-border text-theme-fg-muted hover:text-theme-fg hover:border-theme-primary/60"
        } ${className}`}
      >
        <motion.div
          animate={{ scale: isSaved ? 1.15 : 1, rotate: isSaved ? 10 : 0 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 450, damping: 18 }}
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isSaved ? (
              // Filled bookmark
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            ) : (
              // Outlined bookmark
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
            )}
          </svg>
        </motion.div>
      </button>
    );
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring shadow-sm ${
        isSaved
          ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 border border-amber-400"
          : "bg-theme-surface-subtle border border-theme-border text-theme-fg hover:border-theme-primary"
      } ${className}`}
    >
      <motion.div
        animate={{ scale: isSaved ? 1.15 : 1, rotate: isSaved ? 10 : 0 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 450, damping: 18 }}
        className="shrink-0"
      >
        <svg
          className="w-4 h-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {isSaved ? (
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          ) : (
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          )}
        </svg>
      </motion.div>
      <span>{isSaved ? "In Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
}
