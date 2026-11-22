import RelatedMovies, { RelatedMoviesSkeleton } from "./RelatedMovies";
import { Movie } from "@/lib/api/types";

export { RelatedMoviesSkeleton };

export default async function RelatedMoviesSection({
  promise,
}: {
  promise: Promise<Movie[]>;
}) {
  const movies = await promise;
  return <RelatedMovies movies={movies} />;
}
