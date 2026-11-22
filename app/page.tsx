import { movieProvider } from "@/lib/api/provider";
import { Movie } from "@/lib/api/types";
import InfiniteMovieList from "@/components/InfiniteMovieList";

async function getInitialMovies(): Promise<{ items: Movie[]; nextCursor?: string }> {
  "use cache";
  try {
    return await movieProvider.getPopular();
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return { items: [] };
  }
}

export default async function Home() {
  const { items: movies, nextCursor } = await getInitialMovies();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Popular Movies
        </h1>
      </div>

      {/* Infinite Scroll Movie Grid */}
      <InfiniteMovieList initialMovies={movies} initialCursor={nextCursor} />
    </div>
  );
}
