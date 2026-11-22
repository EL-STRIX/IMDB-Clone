import { unstable_cache } from "next/cache";
import { movieProvider } from "./provider";
import { Movie, MovieDetails, CursorResult } from "./types";

export const getCachedPopularMovies = (cursor?: string): Promise<CursorResult<Movie>> => {
  return unstable_cache(
    async () => movieProvider.getPopular(cursor),
    ["popular-movies", cursor || "1"],
    {
      tags: ["movies"],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieDetails = (id: string): Promise<MovieDetails | null> => {
  return unstable_cache(
    async () => movieProvider.getMovie(id),
    ["movie-details", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};
