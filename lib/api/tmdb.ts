import { MovieProvider } from "./provider";
import { Movie, MovieDetails, Person, CursorResult } from "./types";
import { tmdbFetch } from "./tmdbFetch";
import { encodeCursor, decodeCursor } from "./cursor";
import { defaultCircuitBreaker } from "@/lib/resilience/circuitBreaker";

interface RawTmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
}

interface RawTmdbMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number;
  vote_average: number;
}

interface RawTmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  biography?: string;
}

interface RawTmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

function mapRawMovie(raw: RawTmdbMovie): Movie {
  return {
    id: String(raw.id),
    title: raw.title,
    posterUrl: raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : null,
    rating: raw.vote_average || 0,
    releaseDate: raw.release_date || "",
    year: raw.release_date ? raw.release_date.split("-")[0] : "",
  };
}

function mapRawMovieDetails(raw: RawTmdbMovieDetails): MovieDetails {
  return {
    id: String(raw.id),
    title: raw.title,
    posterUrl: raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : null,
    overview: raw.overview || "",
    releaseDate: raw.release_date || "",
    genres: raw.genres ? raw.genres.map((g) => g.name) : [],
    runtime: raw.runtime || 0,
    rating: raw.vote_average || 0,
  };
}

function mapRawPerson(raw: RawTmdbPerson): Person {
  return {
    id: String(raw.id),
    name: raw.name,
    profileUrl: raw.profile_path
      ? `https://image.tmdb.org/t/p/w500${raw.profile_path}`
      : null,
    knownFor: raw.known_for_department,
    biography: raw.biography,
  };
}

export class TmdbProvider implements MovieProvider {
  private get apiKey(): string {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error("TMDB_API_KEY is not defined");
    return key;
  }

  async getPopular(cursor?: string): Promise<CursorResult<Movie>> {
    return defaultCircuitBreaker.execute(
      async () => {
        const page = decodeCursor(cursor);
        const raw = await tmdbFetch<RawTmdbPage<RawTmdbMovie>>(
          `/3/movie/popular?api_key=${this.apiKey}&language=en-US&page=${page}`
        );
        const hasNext = raw.page < raw.total_pages;
        return {
          items: (raw.results || []).map(mapRawMovie),
          nextCursor: hasNext ? encodeCursor(raw.page + 1) : undefined,
          totalResults: raw.total_results,
        };
      },
      "popular"
    );
  }

  async search(query: string, cursor?: string): Promise<CursorResult<Movie>> {
    if (!query.trim()) {
      return { items: [], totalResults: 0 };
    }
    const cacheKey = `search:${query}:${cursor || "1"}`;
    return defaultCircuitBreaker.execute(
      async () => {
        const page = decodeCursor(cursor);
        const raw = await tmdbFetch<RawTmdbPage<RawTmdbMovie>>(
          `/3/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(
            query
          )}&language=en-US&page=${page}`
        );
        const hasNext = raw.page < raw.total_pages;
        return {
          items: (raw.results || []).map(mapRawMovie),
          nextCursor: hasNext ? encodeCursor(raw.page + 1) : undefined,
          totalResults: raw.total_results,
        };
      },
      cacheKey
    );
  }

  async getMovie(id: string): Promise<MovieDetails | null> {
    const cacheKey = `movie:${id}`;
    return defaultCircuitBreaker.execute(
      async () => {
        const raw = await tmdbFetch<RawTmdbMovieDetails>(
          `/3/movie/${id}?api_key=${this.apiKey}&language=en-US`
        );
        return mapRawMovieDetails(raw);
      },
      cacheKey
    ).catch(() => null);
  }

  async getPerson(id: string): Promise<Person | null> {
    const cacheKey = `person:${id}`;
    return defaultCircuitBreaker.execute(
      async () => {
        const raw = await tmdbFetch<RawTmdbPerson>(
          `/3/person/${id}?api_key=${this.apiKey}&language=en-US`
        );
        return mapRawPerson(raw);
      },
      cacheKey
    ).catch(() => null);
  }
}
