import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getCachedMovieDetails,
  getCachedMovieCredits,
  getCachedMovieReviews,
  getCachedMovieTrailers,
} from "@/lib/api/cached";
import MovieCore, { MovieCoreSkeleton } from "@/components/movie/MovieCore";
import TrailersSection, { TrailerCarouselSkeleton } from "@/components/movie/TrailersSection";
import Credits, { CreditsSkeleton } from "@/components/movie/Credits";
import Reviews, { ReviewsSkeleton } from "@/components/movie/Reviews";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getCachedMovieDetails(id);

  if (!movie) {
    return {
      title: "Movie Not Found | IMDb Clone",
      description: "The requested movie could not be found.",
    };
  }

  const year = movie.releaseDate ? ` (${movie.releaseDate.split("-")[0]})` : "";
  const title = `${movie.title}${year} - IMDb Clone`;
  const description =
    movie.overview || `Ratings, cast, and user reviews for ${movie.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.movie",
      images: movie.posterUrl ? [{ url: movie.posterUrl, alt: movie.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: movie.posterUrl ? [movie.posterUrl] : [],
    },
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;

  // Start all fetches in parallel
  const corePromise = getCachedMovieDetails(id);
  const trailersPromise = getCachedMovieTrailers(id);
  const creditsPromise = getCachedMovieCredits(id);
  const reviewsPromise = getCachedMovieReviews(id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<MovieCoreSkeleton />}>
        <MovieCore promise={corePromise} />
      </Suspense>

      <Suspense fallback={<TrailerCarouselSkeleton />}>
        <TrailersSection promise={trailersPromise} />
      </Suspense>

      <Suspense fallback={<CreditsSkeleton />}>
        <Credits promise={creditsPromise} />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews promise={reviewsPromise} />
      </Suspense>
    </div>
  );
}
