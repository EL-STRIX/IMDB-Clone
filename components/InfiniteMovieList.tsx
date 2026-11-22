"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Movie } from "@/lib/api/types";
import { mergeMovies } from "@/lib/api/merge";
import { queryKeys } from "@/lib/queryKeys";

interface InfiniteMovieListProps {
  initialMovies: Movie[];
  initialCursor?: string;
}

export default function InfiniteMovieList({
  initialMovies,
  initialCursor,
}: InfiniteMovieListProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const handlePrefetch = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.movies.detail(id),
      queryFn: async () => {
        const res = await fetch(`/api/movies/${id}`);
        if (!res.ok) throw new Error("Failed to prefetch");
        return res.json();
      },
    });
  };

  useEffect(() => {
    if (!nextCursor || loading) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/movies/popular?cursor=${encodeURIComponent(nextCursor)}`
            );
            if (res.ok) {
              const data = await res.json();
              setMovies((prev) => mergeMovies(prev, data.items || []));
              setNextCursor(data.nextCursor);
            }
          } catch (err) {
            console.error("Error loading more movies:", err);
          } finally {
            setLoading(false);
          }
        }
      },
      { rootMargin: "200px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [nextCursor, loading]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {movies.map((movie) => (
          <div
            key={movie.id}
            onMouseEnter={() => handlePrefetch(movie.id)}
            onFocus={() => handlePrefetch(movie.id)}
            className="group flex flex-col rounded-lg bg-theme-card border border-theme-border overflow-hidden shadow-sm hover:border-theme-primary transition-all duration-200"
          >
            {/* Poster Link */}
            <Link href={`/movie/${movie.id}`} className="block">
              <div className="relative aspect-[2/3] w-full bg-theme-header flex items-center justify-center text-theme-fg/40 overflow-hidden">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs text-theme-fg/40">No Image</span>
                  </div>
                )}
                {movie.year && (
                  <div className="absolute top-2 left-2 bg-theme-bg/80 backdrop-blur-xs text-xs px-2 py-0.5 rounded text-theme-fg z-10 border border-theme-border">
                    {movie.year}
                  </div>
                )}
              </div>
            </Link>

            {/* Movie Info */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
              <Link href={`/movie/${movie.id}`} className="block">
                <div className="flex items-center gap-1.5 text-sm text-theme-primary mb-1 font-semibold">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{movie.rating ? movie.rating.toFixed(1) : "N/A"}</span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-theme-fg group-hover:text-theme-primary transition-colors line-clamp-1">
                  {movie.title}
                </h2>
              </Link>

              <button
                type="button"
                className="w-full py-1.5 px-3 bg-theme-header border border-theme-border hover:bg-theme-card text-theme-fg text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>+ Watchlist</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel Div for Infinite Scroll */}
      <div ref={sentinelRef} className="py-6 flex justify-center text-theme-fg/60 text-sm">
        {loading && <span>Loading more movies...</span>}
      </div>
    </>
  );
}
