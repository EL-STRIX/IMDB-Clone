import { MovieProvider } from "./provider";
import { Movie, MovieDetails, Person, PersonExternalIds, CastMember, FilmographyCredit, Review, Trailer, Genre, CursorResult } from "./types";
import { tmdbFetch } from "./tmdbFetch";
import { encodeCursor, decodeCursor } from "./cursor";
import { defaultCircuitBreaker } from "@/lib/resilience/circuitBreaker";
import { withRetry } from "@/lib/resilience/retry";

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
  birthday?: string;
  place_of_birth?: string;
  popularity?: number;
  also_known_as?: string[];
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
    birthday: raw.birthday,
    placeOfBirth: raw.place_of_birth,
    popularity: raw.popularity,
    alsoKnownAs: raw.also_known_as || [],
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
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<RawTmdbMovieDetails>(
            `/3/movie/${id}?api_key=${this.apiKey}&language=en-US`
          );
          return mapRawMovieDetails(raw);
        }),
      cacheKey
    ).catch(() => null);
  }

  async getPerson(id: string): Promise<Person | null> {
    const cacheKey = `person:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<RawTmdbPerson>(
            `/3/person/${id}?api_key=${this.apiKey}&language=en-US`
          );
          return mapRawPerson(raw);
        }),
      cacheKey
    ).catch(() => null);
  }

  async getCredits(id: string): Promise<CastMember[]> {
    const cacheKey = `credits:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            id: number;
            cast: Array<{
              id: number;
              name: string;
              character: string;
              profile_path: string | null;
            }>;
          }>(`/3/movie/${id}/credits?api_key=${this.apiKey}&language=en-US`);
          return (raw.cast || []).slice(0, 12).map((c) => ({
            id: String(c.id),
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path
              ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
              : null,
          }));
        }),
      cacheKey
    ).catch(() => []);
  }

  async getReviews(id: string): Promise<Review[]> {
    const cacheKey = `reviews:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            id: number;
            results: Array<{
              id: string;
              author: string;
              content: string;
              created_at: string;
              url?: string;
              author_details?: {
                rating: number | null;
              };
            }>;
          }>(`/3/movie/${id}/reviews?api_key=${this.apiKey}&language=en-US&page=1`);
          return (raw.results || []).slice(0, 6).map((r) => ({
            id: r.id,
            author: r.author,
            content: r.content,
            rating: r.author_details?.rating ?? undefined,
            createdAt: r.created_at,
            url: r.url,
          }));
        }),
      cacheKey
    ).catch(() => []);
  }

  async getTrailers(id: string): Promise<Trailer[]> {
    const cacheKey = `trailers:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            id: number;
            results: Array<{
              id: string;
              key: string;
              name: string;
              site: string;
              type: string;
            }>;
          }>(`/3/movie/${id}/videos?api_key=${this.apiKey}&language=en-US`);
          const valid = (raw.results || []).filter(
            (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser" || v.type === "Clip")
          );
          return valid.slice(0, 8).map((v) => ({
            id: v.id,
            name: v.name,
            key: v.key,
            site: v.site,
            type: v.type,
            thumbnailUrl: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
          }));
        }),
      cacheKey
    ).catch(() => []);
  }

  async getSimilar(id: string): Promise<Movie[]> {
    const cacheKey = `similar:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<RawTmdbPage<RawTmdbMovie>>(
            `/3/movie/${id}/similar?api_key=${this.apiKey}&language=en-US&page=1`
          );
          return (raw.results || []).slice(0, 6).map(mapRawMovie);
        }),
      cacheKey
    ).catch(() => []);
  }

  async getPopularPeople(): Promise<Array<{ id: string }>> {
    const cacheKey = "popular-people";
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<RawTmdbPage<RawTmdbPerson>>(
            `/3/person/popular?api_key=${this.apiKey}&language=en-US&page=1`
          );
          return (raw.results || []).slice(0, 10).map((p) => ({ id: String(p.id) }));
        }),
      cacheKey
    ).catch(() => []);
  }

  async getPersonCredits(id: string): Promise<FilmographyCredit[]> {
    const cacheKey = `person-credits:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            id: number;
            cast: Array<{
              id: number;
              title: string;
              character: string;
              release_date?: string;
              poster_path: string | null;
              vote_average?: number;
              popularity?: number;
              genre_ids?: number[];
            }>;
            crew: Array<{
              id: number;
              title: string;
              job: string;
              department: string;
              release_date?: string;
              poster_path: string | null;
              vote_average?: number;
              popularity?: number;
              genre_ids?: number[];
            }>;
          }>(`/3/person/${id}/movie_credits?api_key=${this.apiKey}&language=en-US`);

          const castCredits: FilmographyCredit[] = (raw.cast || []).map((c) => ({
            id: String(c.id),
            title: c.title,
            role: c.character || "Self",
            department: "Cast",
            year: c.release_date ? c.release_date.split("-")[0] : "",
            posterUrl: c.poster_path
              ? `https://image.tmdb.org/t/p/w185${c.poster_path}`
              : null,
            rating: c.vote_average || 0,
            popularity: c.popularity || 0,
            genreIds: c.genre_ids || [],
          }));

          const crewCredits: FilmographyCredit[] = (raw.crew || []).map((c) => ({
            id: String(c.id),
            title: c.title,
            role: c.job || c.department,
            department: c.department || "Crew",
            year: c.release_date ? c.release_date.split("-")[0] : "",
            posterUrl: c.poster_path
              ? `https://image.tmdb.org/t/p/w185${c.poster_path}`
              : null,
            rating: c.vote_average || 0,
            popularity: c.popularity || 0,
            genreIds: c.genre_ids || [],
          }));

          // Sort by year descending (most recent first)
          return [...castCredits, ...crewCredits].sort((a, b) => {
            const yearA = parseInt(a.year || "0", 10);
            const yearB = parseInt(b.year || "0", 10);
            return yearB - yearA;
          });
        }),
      cacheKey
    ).catch(() => []);
  }

  async getPersonExternalIds(id: string): Promise<PersonExternalIds> {
    const cacheKey = `person-external-ids:${id}`;
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            id: number;
            imdb_id?: string | null;
            facebook_id?: string | null;
            instagram_id?: string | null;
            twitter_id?: string | null;
            tiktok_id?: string | null;
            youtube_id?: string | null;
            wikidata_id?: string | null;
          }>(`/3/person/${id}/external_ids?api_key=${this.apiKey}`);
          return {
            imdbId: raw.imdb_id || null,
            facebookId: raw.facebook_id || null,
            instagramId: raw.instagram_id || null,
            twitterId: raw.twitter_id || null,
            tiktokId: raw.tiktok_id || null,
            youtubeId: raw.youtube_id || null,
            wikidataId: raw.wikidata_id || null,
          };
        }),
      cacheKey
    ).catch(() => ({}));
  }

  async getGenres(): Promise<Genre[]> {
    const cacheKey = "genres-list";
    return defaultCircuitBreaker.execute(
      () =>
        withRetry(async () => {
          const raw = await tmdbFetch<{
            genres: Array<{ id: number; name: string }>;
          }>(`/3/genre/movie/list?api_key=${this.apiKey}&language=en-US`);
          return raw.genres || [];
        }),
      cacheKey
    ).catch(() => []);
  }
}
