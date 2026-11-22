import { unstable_cache } from "next/cache";
import { movieProvider } from "./provider";
import {
  Movie,
  MovieDetails,
  Person,
  PersonExternalIds,
  ActorAwardsData,
  CastMember,
  FilmographyCredit,
  Review,
  Trailer,
  Genre,
  CursorResult,
} from "./types";
import { getAwardsForActor } from "@/lib/data/awards";

export const getCachedPopularMovies = (cursor?: string): Promise<CursorResult<Movie>> => {
  return unstable_cache(
    async () => movieProvider.getPopular(cursor),
    ["popular-movies", cursor || "1"],
    {
      tags: ["movies"],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieDetails = (id: string): Promise<MovieDetails | null> => {
  return unstable_cache(
    async () => movieProvider.getMovie(id),
    ["movie-details", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieCredits = (id: string): Promise<CastMember[]> => {
  return unstable_cache(
    async () => movieProvider.getCredits(id),
    ["movie-credits", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieReviews = (id: string): Promise<Review[]> => {
  return unstable_cache(
    async () => movieProvider.getReviews(id),
    ["movie-reviews", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedMovieTrailers = (id: string): Promise<Trailer[]> => {
  return unstable_cache(
    async () => movieProvider.getTrailers(id),
    ["movie-trailers", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedSimilarMovies = (id: string): Promise<Movie[]> => {
  return unstable_cache(
    async () => movieProvider.getSimilar(id),
    ["similar-movies", id],
    {
      tags: ["movies", `movie-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedPerson = (id: string): Promise<Person | null> => {
  return unstable_cache(
    async () => movieProvider.getPerson(id),
    ["actor-details", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedPopularPeople = (): Promise<Array<{ id: string }>> => {
  return unstable_cache(
    async () => movieProvider.getPopularPeople(),
    ["popular-actors"],
    {
      tags: ["actors", "popular-actors"],
      revalidate: 86400,
    }
  )();
};

export const getCachedPersonCredits = (id: string): Promise<FilmographyCredit[]> => {
  return unstable_cache(
    async () => movieProvider.getPersonCredits(id),
    ["actor-credits", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 3600,
    }
  )();
};

export const getCachedGenres = (): Promise<Genre[]> => {
  return unstable_cache(
    async () => movieProvider.getGenres(),
    ["movie-genres"],
    {
      tags: ["genres"],
      revalidate: 86400,
    }
  )();
};

export const getCachedPersonExternalIds = (id: string): Promise<PersonExternalIds> => {
  return unstable_cache(
    async () => movieProvider.getPersonExternalIds(id),
    ["actor-external-ids", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 86400,
    }
  )();
};

export const getCachedSimilarActors = async (id: string): Promise<CastMember[]> => {
  return unstable_cache(
    async () => {
      try {
        const credits = await movieProvider.getPersonCredits(id);
        if (!credits || credits.length === 0) return [];

        // Select top credits by popularity / rating
        const topCredits = [...credits]
          .filter((c) => c.id)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 4);

        if (topCredits.length === 0) return [];

        // Fetch co-stars from top movies in parallel
        const movieCreditsList = await Promise.all(
          topCredits.map((c) => movieProvider.getCredits(c.id).catch(() => []))
        );

        // Count occurrences of co-stars
        const coStarMap = new Map<string, { member: CastMember; count: number }>();
        for (const castList of movieCreditsList) {
          for (const member of castList) {
            if (member.id === id) continue; // exclude the actor themselves
            const existing = coStarMap.get(member.id);
            if (existing) {
              existing.count += 1;
            } else {
              coStarMap.set(member.id, { member, count: 1 });
            }
          }
        }

        // Sort by frequency of collaboration, then return top 6
        return Array.from(coStarMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map((entry) => entry.member);
      } catch {
        return [];
      }
    },
    ["actor-similar-actors", id],
    {
      tags: ["actors", `actor-${id}`],
      revalidate: 86400,
    }
  )();
};

export const getCachedActorAwards = (id: string): Promise<ActorAwardsData> => {
  return unstable_cache(
    async () => getAwardsForActor(id),
    ["actor-awards", id],
    {
      tags: ["actors", `actor-${id}`, "awards"],
      revalidate: 3600,
    }
  )();
};
