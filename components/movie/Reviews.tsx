import { Review } from "@/lib/api/types";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";

export function ReviewsSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="h-7 w-40 bg-theme-surface-subtle rounded mb-6" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg bg-theme-surface border border-theme-border flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-theme-surface-subtle rounded" />
              <div className="h-4 w-20 bg-theme-surface-subtle rounded" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full bg-theme-surface-subtle rounded" />
              <div className="h-3 w-5/6 bg-theme-surface-subtle rounded" />
              <div className="h-3 w-4/6 bg-theme-surface-subtle rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Reviews({
  promise,
  movieId,
}: {
  promise: Promise<Review[]>;
  movieId?: string;
}) {
  const reviews = await promise;

  return (
    <div className="space-y-6">
      {movieId && <MovieReviewsSection movieId={movieId} />}
      <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-6">
        User Reviews
      </h2>

      {reviews.length === 0 ? (
        <div className="p-6 rounded-lg bg-theme-surface border border-theme-border text-center text-theme-fg-muted text-sm">
          No user reviews available yet for this title.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => {
            const dateStr = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <div
                key={review.id}
                className="p-5 rounded-lg bg-theme-surface border border-theme-border flex flex-col gap-3 shadow-sm hover:border-theme-border/80 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base text-theme-fg">
                      {review.author}
                    </span>
                    {review.rating && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-theme-accent text-zinc-950">
                        ★ {review.rating}/10
                      </span>
                    )}
                  </div>
                  {dateStr && (
                    <span className="text-xs text-theme-fg-muted">
                      {dateStr}
                    </span>
                  )}
                </div>

                <p className="text-sm text-theme-fg-muted leading-relaxed line-clamp-4 whitespace-pre-line">
                  {review.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
