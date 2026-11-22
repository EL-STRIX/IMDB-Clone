"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Movie } from "@/lib/api/types";
import { queryKeys } from "@/lib/queryKeys";

interface RelatedMoviesProps {
  movies: Movie[];
}

export function RelatedMoviesSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="h-7 w-44 bg-theme-surface-subtle rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg bg-theme-surface border border-theme-border overflow-hidden"
          >
            <div className="aspect-[2/3] w-full bg-theme-surface-subtle" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-theme-surface-subtle rounded" />
              <div className="h-3 w-1/3 bg-theme-surface-subtle rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RelatedMovies({ movies }: RelatedMoviesProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefetchedIds = useRef<Set<string>>(new Set());

  if (!movies || movies.length === 0) {
    return null;
  }

  const handlePrefetch = (movieId: string) => {
    // Keyed by movie id so each is only prefetched once
    if (prefetchedIds.current.has(movieId)) return;
    prefetchedIds.current.add(movieId);

    // 1. Next.js router prefetch
    router.prefetch(`/movie/${movieId}`);

    // 2. TanStack Query prefetch
    queryClient.prefetchQuery({
      queryKey: queryKeys.movies.detail(movieId),
      queryFn: async () => {
        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) throw new Error("Failed to prefetch");
        return res.json();
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <section className="mt-12">
      <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-6">
        More Like This
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <div
            key={movie.id}
            onMouseEnter={() => handlePrefetch(movie.id)}
            onFocus={() => handlePrefetch(movie.id)}
            className="group flex flex-col rounded-lg bg-theme-surface border border-theme-border overflow-hidden shadow-sm hover:border-theme-primary transition-all duration-200"
          >
            <Link
              href={`/movie/${movie.id}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring rounded-t-lg"
            >
              <div className="relative aspect-[2/3] w-full bg-theme-surface-subtle flex items-center justify-center overflow-hidden">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex items-center justify-center text-xs text-theme-fg-muted p-2 text-center">
                    No Poster
                  </div>
                )}
                {movie.year && (
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-[10px] px-1.5 py-0.5 rounded text-white border border-white/10 z-10">
                    {movie.year}
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col justify-between flex-1 gap-1">
                <h3 className="font-semibold text-xs sm:text-sm text-theme-fg line-clamp-1 group-hover:text-theme-primary transition-colors">
                  {movie.title}
                </h3>
                {movie.rating > 0 && (
                  <span className="text-theme-primary text-xs font-semibold flex items-center gap-1">
                    ★ {movie.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
