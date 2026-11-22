import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { movieProvider } from "@/lib/api/provider";
import { Movie } from "@/lib/api/types";
import WatchlistButton from "@/components/watchlist/WatchlistButton";

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>;
}

async function searchMovies(query: string): Promise<Movie[]> {
  "use cache";
  if (!query.trim()) return [];
  try {
    const page = await movieProvider.search(query);
    return page.items;
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const { query = "" } = await searchParams;
  const movies = await searchMovies(query);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-theme-fg tracking-wide">
          {query ? `Search results for "${query}"` : "Search Movies"}
        </h1>
        {query && (
          <p className="text-sm text-theme-fg/70 mt-1">
            Found {movies.length} {movies.length === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      {movies.length === 0 ? (
        <div className="py-12 text-center text-theme-fg/60">
          <p className="text-base">
            {query ? `No movies found matching "${query}".` : "Enter a search term above."}
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-theme-primary hover:underline">
            &larr; Back to popular movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
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

                <WatchlistButton
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    posterUrl: movie.posterUrl,
                    year: movie.year,
                    rating: movie.rating,
                  }}
                  className="w-full text-xs min-h-[36px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 w-48 bg-theme-card rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-theme-card rounded-lg"
              />
            ))}
          </div>
        </div>
      }
    >
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}
