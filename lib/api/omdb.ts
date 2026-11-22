import { MovieProvider } from "./provider";
import { Movie, MovieDetails, Person, CastMember, FilmographyCredit, Review, Trailer, CursorResult } from "./types";
import { encodeCursor, decodeCursor } from "./cursor";
import { defaultRateLimiter } from "@/lib/resilience/tokenBucket";
import { withRetry } from "@/lib/resilience/retry";

interface RawOmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface RawOmdbSearchResponse {
  Search?: RawOmdbSearchItem[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

interface RawOmdbMovieDetails {
  Title: string;
  Year: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Poster?: string;
  imdbRating?: string;
  imdbID: string;
  Response: string;
}

function mapRawOmdbMovie(raw: RawOmdbSearchItem): Movie {
  return {
    id: raw.imdbID,
    title: raw.Title,
    posterUrl: raw.Poster && raw.Poster !== "N/A" ? raw.Poster : null,
    rating: 0,
    releaseDate: raw.Year,
    year: raw.Year,
  };
}

function mapRawOmdbDetails(raw: RawOmdbMovieDetails): MovieDetails {
  return {
    id: raw.imdbID,
    title: raw.Title,
    posterUrl: raw.Poster && raw.Poster !== "N/A" ? raw.Poster : null,
    overview: raw.Plot && raw.Plot !== "N/A" ? raw.Plot : "",
    releaseDate: raw.Released && raw.Released !== "N/A" ? raw.Released : raw.Year,
    genres: raw.Genre && raw.Genre !== "N/A" ? raw.Genre.split(", ") : [],
    runtime: raw.Runtime ? parseInt(raw.Runtime, 10) || 0 : 0,
    rating: raw.imdbRating && raw.imdbRating !== "N/A" ? parseFloat(raw.imdbRating) || 0 : 0,
  };
}

export class OmdbProvider implements MovieProvider {
  private get apiKey(): string {
    const key = process.env.OMDB_API_KEY;
    if (!key) throw new Error("OMDB_API_KEY is not defined");
    return key;
  }

  async getPopular(cursor?: string): Promise<CursorResult<Movie>> {
    return this.search("Avengers", cursor);
  }

  async search(query: string, cursor?: string): Promise<CursorResult<Movie>> {
    if (!query.trim()) {
      return { items: [], totalResults: 0 };
    }
    const page = decodeCursor(cursor);

    return withRetry(async () => {
      await defaultRateLimiter.acquire();
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${this.apiKey}&s=${encodeURIComponent(
          query
        )}&page=${page}`
      );
      if (!res.ok) {
        const err: any = new Error(`OMDb HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const data: RawOmdbSearchResponse = await res.json();
      if (data.Response === "False" || !data.Search) {
        return { items: [], totalResults: 0 };
      }
      const totalResults = parseInt(data.totalResults || "0", 10);
      const hasNext = page * 10 < totalResults;
      return {
        items: data.Search.map(mapRawOmdbMovie),
        nextCursor: hasNext ? encodeCursor(page + 1) : undefined,
        totalResults,
      };
    });
  }

  async getMovie(id: string): Promise<MovieDetails | null> {
    try {
      return await withRetry(async () => {
        await defaultRateLimiter.acquire();
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${this.apiKey}&i=${id}&plot=full`
        );
        if (!res.ok) {
          const err: any = new Error(`OMDb HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
        const data: RawOmdbMovieDetails = await res.json();
        if (data.Response === "False") return null;
        return mapRawOmdbDetails(data);
      });
    } catch {
      return null;
    }
  }

  async getPerson(): Promise<Person | null> {
    return null;
  }

  async getCredits(): Promise<CastMember[]> {
    return [];
  }

  async getReviews(): Promise<Review[]> {
    return [];
  }

  async getTrailers(): Promise<Trailer[]> {
    return [];
  }

  async getSimilar(): Promise<Movie[]> {
    return [];
  }

  async getPopularPeople(): Promise<Array<{ id: string }>> {
    return [];
  }

  async getPersonCredits(): Promise<FilmographyCredit[]> {
    return [];
  }
}
