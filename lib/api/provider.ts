import { Movie, MovieDetails, Person, Page } from "./types";
import { TmdbProvider } from "./tmdb";

export interface MovieProvider {
  getPopular(page?: number): Promise<Page<Movie>>;
  search(query: string, page?: number): Promise<Page<Movie>>;
  getMovie(id: string): Promise<MovieDetails | null>;
  getPerson(id: string): Promise<Person | null>;
}

export const movieProvider: MovieProvider = new TmdbProvider();
