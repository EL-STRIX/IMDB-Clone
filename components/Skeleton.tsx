export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg bg-[#1a1a1a] border border-zinc-800 overflow-hidden animate-pulse">
      {/* Poster */}
      <div className="aspect-[2/3] w-full bg-zinc-800" />
      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="h-4 w-12 bg-zinc-800 rounded mb-2" />
          <div className="h-5 w-3/4 bg-zinc-800 rounded" />
        </div>
        <div className="h-7 w-full bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-5 w-24 bg-zinc-800 rounded mb-6" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-72 aspect-[2/3] bg-zinc-800 rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <div className="h-9 w-3/4 bg-zinc-800 rounded mb-3" />
            <div className="h-5 w-48 bg-zinc-800 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-20 w-full bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
