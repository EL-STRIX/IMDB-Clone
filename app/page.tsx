import Image from "next/image";
import Link from "next/link";
import { movieProvider } from "@/lib/api/provider";
import { Movie } from "@/lib/api/types";

async function getPopularMovies(): Promise<Movie[]> {
  "use cache";
  try {
    const page = await movieProvider.getPopular(1);
    return page.items;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
}

export default async function Home() {
  const movies = await getPopularMovies();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Popular Movies
        </h1>
      </div>

      {/* Responsive Grid of Movie Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="group flex flex-col rounded-lg bg-[#1a1a1a] border border-zinc-800 overflow-hidden shadow-sm hover:border-zinc-700 transition-all duration-200"
          >
            {/* Poster Link */}
            <Link href={`/movie/${movie.id}`} className="block">
              <div className="relative aspect-[2/3] w-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden">
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
                    <span className="text-xs text-zinc-400">No Image</span>
                  </div>
                )}
                {movie.year && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-xs px-2 py-0.5 rounded text-zinc-300 z-10">
                    {movie.year}
                  </div>
                )}
              </div>
            </Link>

            {/* Movie Info */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
              <Link href={`/movie/${movie.id}`} className="block">
                <div className="flex items-center gap-1.5 text-sm text-[#f5c518] mb-1 font-semibold">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{movie.rating ? movie.rating.toFixed(1) : "N/A"}</span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-[#f5c518] transition-colors line-clamp-1">
                  {movie.title}
                </h2>
              </Link>

              <button
                type="button"
                className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>+ Watchlist</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
