"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import ReviewForm from "./ReviewForm";
import ReviewVoteButtons from "./ReviewVoteButtons";
import { Review } from "@/lib/reviews/schema";
import { sortReviews, ReviewSortOption } from "@/lib/reviews/ranking";

interface MovieReviewsSectionProps {
  movieId: string;
}

const EMPTY_REVIEWS: (Review & { isOptimistic?: boolean })[] = [];

export default function MovieReviewsSection({ movieId }: MovieReviewsSectionProps) {
  const [unmaskedSpoilers, setUnmaskedSpoilers] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("helpful");

  const { data: rawReviews = EMPTY_REVIEWS, isLoading } = useQuery<(Review & { isOptimistic?: boolean })[]>({
    queryKey: ["movie-reviews", movieId],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${movieId}/reviews`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.reviews || []) as Review[];
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border/60 pb-4">
        <div>
          <h2 id="user-reviews-heading" className="text-xl sm:text-2xl font-extrabold text-theme-fg">
            User Reviews
          </h2>
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

            return (
              <article
                key={rev.id}
                className={`p-5 rounded-2xl bg-theme-surface border transition-all ${
                  rev.isOptimistic
                    ? "border-theme-primary/60 opacity-85 shadow-md"
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
                      </div>
                      <time className="text-[11px] text-theme-fg-muted block">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs font-extrabold text-theme-fg">
                    <span className="text-amber-400">★</span>
                    <span>{rev.rating}/10</span>
                  </div>
                </div>

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

                {/* Vote Buttons & Helpfulness Counters */}
                <ReviewVoteButtons review={rev} movieId={movieId} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
