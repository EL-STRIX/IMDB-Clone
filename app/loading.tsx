import { MovieGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
        <div className="h-7 w-44 bg-zinc-800 rounded animate-pulse" />
      </div>
      <MovieGridSkeleton count={8} />
    </div>
  );
}
