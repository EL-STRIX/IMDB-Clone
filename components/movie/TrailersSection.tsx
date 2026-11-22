import TrailerCarousel, { TrailerCarouselSkeleton } from "./TrailerCarousel";
import { Trailer } from "@/lib/api/types";

export { TrailerCarouselSkeleton };

export default async function TrailersSection({
  promise,
  movieTitle,
}: {
  promise: Promise<Trailer[]>;
  movieTitle?: string;
}) {
  const trailers = await promise;
  return <TrailerCarousel trailers={trailers} movieTitle={movieTitle} />;
}
