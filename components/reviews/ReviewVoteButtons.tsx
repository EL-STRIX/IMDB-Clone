"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/auth/SessionProvider";
import { Review } from "@/lib/reviews/schema";
import { showToast } from "@/components/watchlist/Toast";

interface ReviewVoteButtonsProps {
  review: Review;
  movieId: string;
}

export default function ReviewVoteButtons({ review, movieId }: ReviewVoteButtonsProps) {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  const upvotes = review.upvotes ?? review.helpfulVotes ?? 0;
  const downvotes = review.downvotes ?? 0;
  const userVote = review.userVote;

  const voteMutation = useMutation({
    mutationFn: async (targetVote: "up" | "down") => {
      const res = await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: targetVote }),
      });

      if (!res.ok) {
        throw new Error("Failed to record vote");
      }

      return res.json();
    },
    onMutate: async (targetVote) => {
      await queryClient.cancelQueries({ queryKey: ["movie-reviews", movieId] });

      const previousReviews =
        queryClient.getQueryData<Review[]>(["movie-reviews", movieId]) || [];

      // Calculate optimistic vote
      queryClient.setQueryData<Review[]>(["movie-reviews", movieId], (old = []) =>
        old.map((r) => {
          if (r.id !== review.id) return r;

          let curUp = r.upvotes ?? r.helpfulVotes ?? 0;
          let curDown = r.downvotes ?? 0;
          let newVote: "up" | "down" | null = null;

          if (r.userVote === targetVote) {
            // Toggle off
            if (targetVote === "up") curUp -= 1;
            if (targetVote === "down") curDown -= 1;
            newVote = null;
          } else {
            // Apply or switch
            if (r.userVote === "up") curUp -= 1;
            if (r.userVote === "down") curDown -= 1;

            if (targetVote === "up") curUp += 1;
            if (targetVote === "down") curDown += 1;
            newVote = targetVote;
          }

          return {
            ...r,
            upvotes: Math.max(0, curUp),
            downvotes: Math.max(0, curDown),
            helpfulVotes: Math.max(0, curUp),
            totalVotes: Math.max(0, curUp) + Math.max(0, curDown),
            userVote: newVote,
          };
        })
      );

      return { previousReviews };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(["movie-reviews", movieId], context.previousReviews);
      }
      showToast({ message: "Failed to record vote. Please try again." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
    },
  });

  const handleVote = (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      showToast({ message: "Please sign in via Navbar to vote on reviews." });
      return;
    }
    voteMutation.mutate(voteType);
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-theme-border/50 text-xs">
      <span className="text-theme-fg-muted font-medium">
        {upvotes} {upvotes === 1 ? "person" : "people"} found this helpful
      </span>

      <div className="flex items-center gap-1.5" role="group" aria-label="Vote on review helpfulness">
        {/* Helpful / Upvote button */}
        <button
          type="button"
          onClick={() => handleVote("up")}
          aria-label={`Mark as helpful, currently ${upvotes} upvotes`}
          aria-pressed={userVote === "up"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
            userVote === "up"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
              : "bg-theme-surface-subtle border-theme-border text-theme-fg-muted hover:text-theme-fg hover:bg-theme-border/40"
          }`}
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span>Helpful</span>
          <span className="font-mono text-[11px]">({upvotes})</span>
        </button>

        {/* Not helpful / Downvote button */}
        <button
          type="button"
          onClick={() => handleVote("down")}
          aria-label={`Mark as unhelpful, currently ${downvotes} downvotes`}
          aria-pressed={userVote === "down"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
            userVote === "down"
              ? "bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold"
              : "bg-theme-surface-subtle border-theme-border text-theme-fg-muted hover:text-theme-fg hover:bg-theme-border/40"
          }`}
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
          </svg>
          <span className="sr-only">Not helpful</span>
          {downvotes > 0 && <span className="font-mono text-[11px]">({downvotes})</span>}
        </button>
      </div>
    </div>
  );
}
