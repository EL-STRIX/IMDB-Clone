import { Movie, MovieDetails, Person, PersonExternalIds, CastMember, FilmographyCredit, Review, Trailer, Genre, CursorResult } from "./types";
import { TmdbProvider } from "./tmdb";

export interface MovieProvider {
  getPopular(cursor?: string): Promise<CursorResult<Movie>>;
  search(query: string, cursor?: string): Promise<CursorResult<Movie>>;
  getMovie(id: string): Promise<MovieDetails | null>;
  getPerson(id: string): Promise<Person | null>;
  getCredits(id: string): Promise<CastMember[]>;
  getReviews(id: string): Promise<Review[]>;
  getTrailers(id: string): Promise<Trailer[]>;
  getSimilar(id: string): Promise<Movie[]>;
  getPopularPeople(): Promise<Array<{ id: string }>>;
  getPersonCredits(id: string): Promise<FilmographyCredit[]>;
  getPersonExternalIds(id: string): Promise<PersonExternalIds>;
  getGenres(): Promise<Genre[]>;
}

export const movieProvider: MovieProvider = new TmdbProvider();
