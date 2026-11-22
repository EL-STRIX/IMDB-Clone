export interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
  rating: number;
  releaseDate?: string;
  year?: string;
}

export interface MovieDetails {
  id: string;
  title: string;
  posterUrl: string | null;
  overview: string;
  releaseDate: string;
  genres: string[];
  runtime: number; // minutes
  rating: number;
}

export interface Person {
  id: string;
  name: string;
  profileUrl: string | null;
  knownFor?: string;
  biography?: string;
  birthday?: string;
  placeOfBirth?: string;
  popularity?: number;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface FilmographyCredit {
  id: string;
  title: string;
  role: string;
  department?: string;
  year?: string;
  posterUrl: string | null;
  rating?: number;
  popularity?: number;
  genreIds?: number[];
}

export interface Review {
  id: string;
  author: string;
  content: string;
  rating?: number;
  createdAt: string;
  url?: string;
}

export interface Trailer {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  thumbnailUrl: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages?: number;
  totalResults?: number;
}

export interface CursorResult<T> {
  items: T[];
  nextCursor?: string;
  totalResults?: number;
}
