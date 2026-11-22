import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MovieDetails } from "@/lib/api/types";
import OmdbRatingsStream, { RatingsSkeleton } from "@/components/OmdbRatingsStream";
import WatchlistButton from "@/components/watchlist/WatchlistButton";

export function MovieCoreSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 bg-theme-surface-subtle rounded mb-6" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-72 aspect-[2/3] bg-theme-surface-subtle border border-theme-border rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <div className="h-9 w-3/4 bg-theme-surface-subtle rounded mb-3" />
            <div className="h-5 w-48 bg-theme-surface-subtle rounded" />
          </div>
          <div className="h-5 w-32 bg-theme-surface-subtle rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-theme-surface-subtle rounded-full" />
            <div className="h-6 w-16 bg-theme-surface-subtle rounded-full" />
            <div className="h-6 w-16 bg-theme-surface-subtle rounded-full" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="h-4 w-20 bg-theme-surface-subtle rounded" />
            <div className="h-4 w-full bg-theme-surface-subtle rounded" />
            <div className="h-4 w-5/6 bg-theme-surface-subtle rounded" />
            <div className="h-4 w-2/3 bg-theme-surface-subtle rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MovieCore({
  promise,
}: {
  promise: Promise<MovieDetails | null>;
}) {
  const movie = await promise;

  if (!movie) {
    notFound();
  }

  const hours = Math.floor(movie.runtime / 60);
  const minutes = movie.runtime % 60;
  const runtimeFormatted = movie.runtime
    ? `${hours > 0 ? `${hours}h ` : ""}${minutes}m`
    : "N/A";

  return (
    <div>
      {/* Back to list link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-theme-fg-muted hover:text-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring rounded"
        >
          <span>&larr; Back to list</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Movie Poster */}
        <div className="relative w-full md:w-72 aspect-[2/3] bg-theme-surface border border-theme-border rounded-lg overflow-hidden shrink-0 shadow-md">
          <Image
            src={movie.posterUrl || "/placeholder-poster.svg"}
            alt={movie.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover"
          />
        </div>

        {/* Movie Details */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-theme-fg mb-2">
              {movie.title}
            </h1>

            {/* Metadata (Release Date, Runtime, TMDb Rating) */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-theme-fg-muted">
              {movie.releaseDate && <span>{movie.releaseDate}</span>}
              {movie.runtime > 0 && <span>•</span>}
              {movie.runtime > 0 && <span>{runtimeFormatted}</span>}
              {movie.rating > 0 && <span>•</span>}
              {movie.rating > 0 && (
                <span className="text-theme-primary font-semibold flex items-center gap-1">
                  ★ {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Slower OMDb streaming ratings wrapped in Suspense */}
            <Suspense fallback={<RatingsSkeleton />}>
              <OmdbRatingsStream
                title={movie.title}
                year={movie.releaseDate ? movie.releaseDate.split("-")[0] : undefined}
              />
            </Suspense>

            {/* Offline-First Watchlist Bookmark Action */}
            <div className="pt-2">
              <WatchlistButton
                movie={{
                  id: movie.id,
                  title: movie.title,
                  posterUrl: movie.posterUrl,
                  year: movie.releaseDate ? movie.releaseDate.split("-")[0] : undefined,
                  rating: movie.rating,
                }}
              />
            </div>
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-theme-surface-subtle text-theme-fg border border-theme-border"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          <div>
            <h2 className="text-base font-semibold text-theme-fg mb-1">
              Overview
            </h2>
            <p className="text-theme-fg-muted leading-relaxed text-sm sm:text-base">
              {movie.overview || "No overview available."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
