import { getCachedPopularMovies } from "@/lib/api/cached";
import { Movie } from "@/lib/api/types";
import InfiniteMovieList from "@/components/InfiniteMovieList";

async function getInitialMovies(): Promise<{ items: Movie[]; nextCursor?: string }> {
  try {
    return await getCachedPopularMovies();
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return { items: [] };
  }
}

export default async function Home() {
  const { items: movies, nextCursor } = await getInitialMovies();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-theme-primary rounded-full" />
        <h1 className="text-2xl font-bold text-theme-fg tracking-wide">
          Popular Movies
        </h1>
      </div>

      {/* Infinite Scroll Movie Grid */}
      <InfiniteMovieList initialMovies={movies} initialCursor={nextCursor} />
    </div>
  );
}
