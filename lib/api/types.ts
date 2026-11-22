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
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages?: number;
  totalResults?: number;
}
