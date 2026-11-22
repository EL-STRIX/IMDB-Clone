import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tmdbFetch } from "@/lib/api/tmdbFetch";

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number;
  vote_average: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  "use cache";
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    return await tmdbFetch<MovieDetails>(
      `/3/movie/${id}?api_key=${apiKey}&language=en-US`
    );
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

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

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
          {posterUrl ? (
            <Image
              src={posterUrl}
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
              {movie.release_date && <span>{movie.release_date}</span>}
              {movie.runtime > 0 && <span>•</span>}
              {movie.runtime > 0 && <span>{runtimeFormatted}</span>}
              {movie.vote_average > 0 && <span>•</span>}
              {movie.vote_average > 0 && (
                <span className="text-[#f5c518] font-semibold flex items-center gap-1">
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {genre.name}
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
