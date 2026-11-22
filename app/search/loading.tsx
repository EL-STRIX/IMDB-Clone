import { MovieGridSkeleton } from "@/components/Skeleton";

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-48 bg-zinc-800 rounded mb-6" />
      <MovieGridSkeleton count={8} />
    </div>
  );
}
