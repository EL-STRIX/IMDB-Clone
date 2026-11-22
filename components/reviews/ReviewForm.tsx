"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/auth/SessionProvider";
import { CreateReviewSchema, Review } from "@/lib/reviews/schema";
import { showToast } from "@/components/watchlist/Toast";

interface ReviewFormProps {
  movieId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ movieId, onSuccess }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useSession();

  const [rating, setRating] = useState<number>(8);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [spoiler, setSpoiler] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Optimistic Mutation using TanStack Query
  const mutation = useMutation({
    mutationFn: async (payload: {
      rating: number;
      title: string;
      content: string;
      spoiler: boolean;
      idempotencyKey: string;
    }) => {
      const res = await fetch(`/api/movies/${movieId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit review");
      }

      const data = await res.json();
      return data.review as Review;
    },
    onMutate: async (newReviewInput) => {
      // 1. Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["movie-reviews", movieId] });

      // 2. Snapshot current reviews
      const previousReviews =
        queryClient.getQueryData<Review[]>(["movie-reviews", movieId]) || [];

      // 3. Construct optimistic review
      const tempId = `optimistic-${Date.now()}`;
      const optimisticReview: Review & { isOptimistic?: boolean } = {
        id: tempId,
        movieId,
        authorId: user?.id || "temp-author",
        authorName: user?.name || "You",
        authorRole: user?.role || "user",
        authorAvatar: user?.image,
        rating: newReviewInput.rating,
        title: newReviewInput.title,
        content: newReviewInput.content,
        spoiler: newReviewInput.spoiler,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        helpfulVotes: 0,
        totalVotes: 0,
        deletedAt: null,
        isOptimistic: true,
      };

      // 4. Optimistically inject into query cache
      queryClient.setQueryData<Review[]>(["movie-reviews", movieId], (old = []) => [
        optimisticReview,
        ...old,
      ]);

      return { previousReviews, tempId };
    },
    onError: (err: Error, _variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousReviews) {
        queryClient.setQueryData(["movie-reviews", movieId], context.previousReviews);
      }
      showToast({ message: err.message || "Failed to submit review. Rolled back." });
    },
    onSuccess: (confirmedReview, _variables, context) => {
      // Reconcile temporary optimistic review with confirmed server response
      queryClient.setQueryData<Review[]>(["movie-reviews", movieId], (old = []) =>
        old.map((r) => (r.id === context?.tempId ? confirmedReview : r))
      );

      showToast({ message: "Review posted successfully!" });

      // Reset form
      setTitle("");
      setContent("");
      setRating(8);
      setSpoiler(false);
      setFieldErrors({});
      setIsOpen(false);

      if (onSuccess) onSuccess();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie-reviews", movieId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique UUID idempotency key to prevent duplicate submissions from retries
    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const validation = CreateReviewSchema.safeParse({
      rating,
      title,
      content,
      spoiler,
      idempotencyKey,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      const flat = validation.error.flatten().fieldErrors;
      if (flat.title) errors.title = flat.title[0];
      if (flat.content) errors.content = flat.content[0];
      if (flat.rating) errors.rating = flat.rating[0];
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(validation.data as any);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 rounded-xl bg-theme-surface border border-theme-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-theme-fg">Share your verdict</h3>
          <p className="text-xs text-theme-fg-muted mt-0.5">
            Sign in to post your review, rate this title, and help other cinephiles.
          </p>
        </div>
        <span className="text-xs font-semibold text-theme-primary px-3 py-1.5 rounded-lg bg-theme-primary/10 border border-theme-primary/20">
          Sign in via Navbar to write a review
        </span>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-primary/60 text-sm font-semibold text-theme-fg flex items-center justify-between transition-colors shadow-xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
      >
        <span className="flex items-center gap-2">
          <span className="text-amber-400 group-hover:scale-110 transition-transform">★</span>
          <span>Write a Review as {user?.name}</span>
        </span>
        <span className="text-xs text-theme-primary font-bold group-hover:underline">
          + Add Review
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Write a movie review"
      className="p-5 rounded-2xl bg-theme-surface border border-theme-border shadow-md space-y-4"
    >
      <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
        <h3 className="text-base font-extrabold text-theme-fg">Write a Review</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-theme-fg-muted hover:text-theme-fg transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Star / Rating Selector */}
      <div>
        <label htmlFor="review-rating" className="block text-xs font-bold text-theme-fg mb-1">
          Your Rating: <span className="text-theme-primary font-extrabold">{rating}/10</span>
        </label>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setRating(val)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
                val <= rating
                  ? "bg-theme-accent text-zinc-950 font-black shadow-xs scale-105"
                  : "bg-theme-surface-subtle text-theme-fg-muted hover:bg-theme-border/50"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        {fieldErrors.rating && (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.rating}</p>
        )}
      </div>

      {/* Review Title Input */}
      <div>
        <label htmlFor="review-title" className="block text-xs font-bold text-theme-fg mb-1">
          Headline
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review in a sentence..."
          maxLength={100}
          className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs sm:text-sm text-theme-fg placeholder:text-theme-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
        />
        {fieldErrors.title && (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.title}</p>
        )}
      </div>

      {/* Review Content Textarea */}
      <div>
        <label htmlFor="review-content" className="block text-xs font-bold text-theme-fg mb-1">
          Review Content
        </label>
        <textarea
          id="review-content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you think of the direction, screenplay, performances, and score? (Min 10 characters)"
          maxLength={5000}
          className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs sm:text-sm text-theme-fg placeholder:text-theme-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring resize-y"
        />
        <div className="flex items-center justify-between mt-1 text-[11px] text-theme-fg-muted">
          {fieldErrors.content ? (
            <p className="text-rose-400">{fieldErrors.content}</p>
          ) : (
            <span>Minimum 10 characters</span>
          )}
          <span>{content.length}/5000</span>
        </div>
      </div>

      {/* Spoilers Checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="review-spoiler"
          type="checkbox"
          checked={spoiler}
          onChange={(e) => setSpoiler(e.target.checked)}
          className="w-4 h-4 rounded border-theme-border text-theme-primary focus-visible:ring-theme-ring"
        />
        <label htmlFor="review-spoiler" className="text-xs text-theme-fg select-none cursor-pointer">
          This review contains spoilers
        </label>
      </div>

      {/* Form Submission Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-fg-muted hover:text-theme-fg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-zinc-950 hover:opacity-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring disabled:opacity-50 cursor-pointer"
        >
          {mutation.isPending ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
