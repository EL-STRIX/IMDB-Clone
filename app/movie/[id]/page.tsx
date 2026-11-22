import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { movieProvider } from "@/lib/api/provider";
import { MovieDetails } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  "use cache";
  try {
    return await movieProvider.getMovie(id);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    notFound();
  }

  const hours = Math.floor(movie.runtime / 60);
  const minutes = movie.runtime % 60;
  const runtimeFormatted = movie.runtime
    ? `${hours > 0 ? `${hours}h ` : ""}${minutes}m`
    : "N/A";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to list link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#f5c518] transition-colors"
        >
          <span>&larr; Back to list</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Movie Poster */}
        <div className="relative w-full md:w-72 aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden shrink-0">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
              No Poster Available
            </div>
          )}
        </div>

        {/* Movie Details */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {movie.title}
            </h1>

            {/* Metadata (Release Date, Runtime, Rating) */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              {movie.releaseDate && <span>{movie.releaseDate}</span>}
              {movie.runtime > 0 && <span>•</span>}
              {movie.runtime > 0 && <span>{runtimeFormatted}</span>}
              {movie.rating > 0 && <span>•</span>}
              {movie.rating > 0 && (
                <span className="text-[#f5c518] font-semibold flex items-center gap-1">
                  ★ {movie.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          <div>
            <h2 className="text-base font-semibold text-zinc-200 mb-1">
              Overview
            </h2>
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">
              {movie.overview || "No overview available."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
