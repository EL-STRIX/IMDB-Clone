import { MovieProvider } from "./provider";
import { Movie, MovieDetails, Person, Page } from "./types";

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

  async getPopular(page = 1): Promise<Page<Movie>> {
    // OMDb has no popular list endpoint; search a popular term as fallback
    return this.search("Avengers", page);
  }

  async search(query: string, page = 1): Promise<Page<Movie>> {
    if (!query.trim()) {
      return { items: [], page: 1, totalPages: 0, totalResults: 0 };
    }
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${this.apiKey}&s=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    const data: RawOmdbSearchResponse = await res.json();
    if (data.Response === "False" || !data.Search) {
      return { items: [], page, totalPages: 0, totalResults: 0 };
    }
    const totalResults = parseInt(data.totalResults || "0", 10);
    return {
      items: data.Search.map(mapRawOmdbMovie),
      page,
      totalPages: Math.ceil(totalResults / 10),
      totalResults,
    };
  }

  async getMovie(id: string): Promise<MovieDetails | null> {
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${this.apiKey}&i=${id}&plot=full`
      );
      const data: RawOmdbMovieDetails = await res.json();
      if (data.Response === "False") return null;
      return mapRawOmdbDetails(data);
    } catch {
      return null;
    }
  }

  async getPerson(): Promise<Person | null> {
    // OMDb does not support a person/biography endpoint
    return null;
  }
}
