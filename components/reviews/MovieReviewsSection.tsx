"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/auth/SessionProvider";
import ReviewForm from "./ReviewForm";
import ReviewVoteButtons from "./ReviewVoteButtons";
import ReviewHistoryModal from "./ReviewHistoryModal";
import { Review } from "@/lib/reviews/schema";
import { sortReviews, ReviewSortOption } from "@/lib/reviews/ranking";
import { showToast } from "@/components/watchlist/Toast";

interface MovieReviewsSectionProps {
  movieId: string;
}

const EMPTY_REVIEWS: (Review & { isOptimistic?: boolean })[] = [];

export default function MovieReviewsSection({ movieId }: MovieReviewsSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const [unmaskedSpoilers, setUnmaskedSpoilers] = useState<Record<string, boolean>>({});
  const [unmaskedFlagged, setUnmaskedFlagged] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("helpful");
  const [historyModalReview, setHistoryModalReview] = useState<Review | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Live updates via Server-Sent Events (SSE)
  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/movies/${movieId}/reviews/stream`);

      eventSource.addEventListener("connected", () => {
        setIsLiveConnected(true);
      });

      eventSource.addEventListener("review-update", () => {
        setIsLiveConnected(true);
        // Automatically refresh reviews without full page reload
        queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
      });

      eventSource.onmessage = () => {
        setIsLiveConnected(true);
        queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch {
      setIsLiveConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [movieId, queryClient]);

  const { data: rawReviews = EMPTY_REVIEWS, isLoading } = useQuery<(Review & { isOptimistic?: boolean })[]>({
    queryKey: ["movie-reviews", movieId],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${movieId}/reviews`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.reviews || []) as Review[];
    },
  });

  // Flag/Report mutation
  const flagMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason?: string }) => {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "inappropriate" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to flag review");
      }
      return data;
    },
    onSuccess: () => {
      showToast({ message: "Review reported for moderation. Thank you!" });
      queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
    },
    onError: (err: Error) => {
      showToast({ message: err.message || "Could not report review" });
    },
  });

  const handleFlagReview = (review: Review) => {
    if (!user) {
      showToast({ message: "Please sign in to report reviews." });
      return;
    }
    if (user.id === review.authorId) {
      showToast({ message: "You cannot report your own review." });
      return;
    }
    flagMutation.mutate({ reviewId: review.id });
  };

  const toggleFlaggedContent = (id: string) => {
    setUnmaskedFlagged((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete mutation with timed Undo toast
  const deleteMutation = useMutation({
    mutationFn: async (reviewToDelete: Review) => {
      const res = await fetch(`/api/reviews/${reviewToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      return reviewToDelete;
    },
    onMutate: async (reviewToDelete) => {
      await queryClient.cancelQueries({ queryKey: ["movie-reviews", movieId] });
      const previousReviews =
        queryClient.getQueryData<Review[]>(["movie-reviews", movieId]) || [];

      // Optimistically remove from list
      queryClient.setQueryData<Review[]>(["movie-reviews", movieId], (old = []) =>
        old.filter((r) => r.id !== reviewToDelete.id)
      );

      return { previousReviews };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(["movie-reviews", movieId], context.previousReviews);
      }
      showToast({ message: "Failed to delete review" });
    },
    onSuccess: (deletedReview) => {
      // Trigger timed Undo toast
      showToast({
        message: `Deleted "${deletedReview.title}"`,
        actionLabel: "Undo",
        onAction: async () => {
          try {
            const res = await fetch(`/api/reviews/${deletedReview.id}/restore`, {
              method: "POST",
            });
            if (res.ok) {
              queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
              showToast({ message: "Review restored successfully!" });
            }
          } catch {
            showToast({ message: "Failed to restore review" });
          }
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
    },
  });

  // Apply ranking strategy (Helpful via Wilson score, Recent, or Controversial)
  const reviews = useMemo(() => {
    return sortReviews(rawReviews, sortBy);
  }, [rawReviews, sortBy]);

  const toggleSpoiler = (id: string) => {
    setUnmaskedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-labelledby="user-reviews-heading" className="mt-12 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="user-reviews-heading" className="text-xl sm:text-2xl font-extrabold text-theme-fg">
              User Reviews
            </h2>
            {isLiveConnected && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title="Live Server-Sent Events updates enabled"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-theme-fg-muted mt-0.5">
            Real verdicts from verified critics and community cinephiles.
          </p>
        </div>

        {/* Sort Controls & Count */}
        <div className="flex items-center gap-3">
          <label htmlFor="reviews-sort-by" className="text-xs text-theme-fg-muted sr-only">
            Sort reviews by
          </label>
          <select
            id="reviews-sort-by"
            aria-label="Sort reviews by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
            className="text-xs px-3 py-1.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-theme-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
          >
            <option value="helpful">Most Helpful (Wilson Score)</option>
            <option value="recent">Most Recent</option>
            <option value="controversial">Most Controversial</option>
          </select>

          <span className="text-xs font-mono text-theme-fg-muted">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* Interactive Review Submission Form with Optimistic UI & Autosave */}
      <ReviewForm movieId={movieId} />

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-theme-surface-subtle border border-theme-border/50" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-theme-surface border border-theme-border text-center text-sm text-theme-fg-muted">
          No reviews yet. Be the first to share your thoughts on this title!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const hasSpoiler = rev.spoiler && !unmaskedSpoilers[rev.id];
            const isAuthor = user?.id === rev.authorId || user?.role === "admin";
            const hasRevisions = (rev.revisions && rev.revisions.length > 0) || rev.updatedAt !== rev.createdAt;
            const isCommunityFlagged = !!rev.isFlagged || (rev.flagCount ?? 0) >= 3;
            const isFlaggedRevealed = !!unmaskedFlagged[rev.id];

            return (
              <article
                key={rev.id}
                className={`p-5 rounded-2xl bg-theme-surface border transition-all ${
                  rev.isOptimistic
                    ? "border-theme-primary/60 opacity-85 shadow-md"
                    : isCommunityFlagged
                    ? "border-rose-500/40 bg-rose-500/5 shadow-xs"
                    : "border-theme-border hover:border-theme-border/80 shadow-xs"
                }`}
              >
                {/* Header: Author, Rating, Date */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {rev.authorAvatar ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-theme-border shrink-0">
                        <Image
                          src={rev.authorAvatar}
                          alt={rev.authorName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-theme-surface-subtle border border-theme-border flex items-center justify-center text-xs font-bold text-theme-fg shrink-0">
                        {rev.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-theme-fg">{rev.authorName}</span>
                        {rev.authorRole === "critic" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-amber-400/15 text-amber-400 border border-amber-400/30">
                            ★ Top Critic
                          </span>
                        )}
                        {rev.isOptimistic && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-theme-accent text-zinc-950 animate-pulse">
                            Posting...
                          </span>
                        )}
                        {isCommunityFlagged && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Flagged for Review
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-theme-fg-muted">
                        <time>
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                        {hasRevisions && (
                          <button
                            type="button"
                            onClick={() => setHistoryModalReview(rev)}
                            className="text-theme-primary hover:underline font-mono text-[10px] cursor-pointer"
                          >
                            (edited)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge & Author / Report Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs font-extrabold text-theme-fg">
                      <span className="text-amber-400">★</span>
                      <span>{rev.rating}/10</span>
                    </div>

                    {/* Report / Flag button for non-authors */}
                    {!isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleFlagReview(rev)}
                        disabled={flagMutation.isPending}
                        aria-label={`Report review by ${rev.authorName}`}
                        title="Report this review for moderation"
                        className="p-1.5 rounded-lg text-theme-fg-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                    )}

                    {/* Delete button for author/admin */}
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(rev)}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete review "${rev.title}"`}
                        className="p-1.5 rounded-lg text-theme-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Flagged Content Warning Overlay */}
                {isCommunityFlagged && !isFlaggedRevealed ? (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <p className="font-bold text-rose-200">Flagged for moderation</p>
                        <p className="text-[11px] text-rose-300/80">Multiple community members reported this review for content violations.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlaggedContent(rev.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer shrink-0"
                    >
                      Show Review
                    </button>
                  </div>
                ) : (
                  <>
                    {isCommunityFlagged && isFlaggedRevealed && (
                      <div className="mb-2 flex items-center justify-between text-[11px] text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                        <span>⚠️ Content under moderation review</span>
                        <button
                          type="button"
                          onClick={() => toggleFlaggedContent(rev.id)}
                          className="underline hover:text-rose-200 cursor-pointer"
                        >
                          Hide Review
                        </button>
                      </div>
                    )}

                    {/* Review Title / Headline */}
                    <h3 className="text-sm sm:text-base font-extrabold text-theme-fg mb-2">
                      {rev.title}
                    </h3>

                    {/* Spoiler Masking */}
                    {hasSpoiler ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between mb-3">
                        <span>⚠️ Warning: This review contains spoilers.</span>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(rev.id)}
                          className="font-bold underline hover:text-amber-200 cursor-pointer"
                        >
                          Reveal Review
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-theme-fg/80 leading-relaxed whitespace-pre-line mb-3">
                        {rev.content}
                      </p>
                    )}
                  </>
                )}

                {/* Vote Buttons & Helpfulness Counters */}
                <ReviewVoteButtons review={rev} movieId={movieId} />
              </article>
            );
          })}
        </div>
      )}

      {/* Revision History Modal */}
      {historyModalReview && (
        <ReviewHistoryModal
          review={historyModalReview}
          onClose={() => setHistoryModalReview(null)}
        />
      )}
    </section>
  );
}
