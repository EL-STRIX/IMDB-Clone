import { unstable_cache } from "next/cache";
import { movieProvider } from "./provider";
import { Movie, MovieDetails, Person, CastMember, FilmographyCredit, Review, Trailer, CursorResult } from "./types";

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

export const getCachedMovieCredits = (id: string): Promise<CastMember[]> => {
  return unstable_cache(
    async () => movieProvider.getCredits(id),
    ["movie-credits", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieReviews = (id: string): Promise<Review[]> => {
  return unstable_cache(
    async () => movieProvider.getReviews(id),
    ["movie-reviews", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieTrailers = (id: string): Promise<Trailer[]> => {
  return unstable_cache(
    async () => movieProvider.getTrailers(id),
    ["movie-trailers", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedSimilarMovies = (id: string): Promise<Movie[]> => {
  return unstable_cache(
    async () => movieProvider.getSimilar(id),
    ["similar-movies", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedPerson = (id: string): Promise<Person | null> => {
  return unstable_cache(
    async () => movieProvider.getPerson(id),
    ["actor-details", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedPopularPeople = (): Promise<Array<{ id: string }>> => {
  return unstable_cache(
    async () => movieProvider.getPopularPeople(),
    ["popular-actors"],
    {
      tags: ["actors", "popular-actors"],
      revalidate: 86400,
    }
  )();
};

export const getCachedPersonCredits = (id: string): Promise<FilmographyCredit[]> => {
  return unstable_cache(
    async () => movieProvider.getPersonCredits(id),
    ["actor-credits", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 3600,
    }
  )();
};
