import { Movie, MovieDetails, Person, CursorResult } from "./types";
import { TmdbProvider } from "./tmdb";

export interface MovieProvider {
  getPopular(cursor?: string): Promise<CursorResult<Movie>>;
  search(query: string, cursor?: string): Promise<CursorResult<Movie>>;
  getMovie(id: string): Promise<MovieDetails | null>;
  getPerson(id: string): Promise<Person | null>;
}

export const movieProvider: MovieProvider = new TmdbProvider();
