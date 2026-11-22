export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-6 w-28 bg-zinc-800 rounded mb-8" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-80 aspect-[2/3] bg-zinc-800 rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="h-10 w-3/4 bg-zinc-800 rounded" />
          <div className="h-5 w-40 bg-zinc-800 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-zinc-800 rounded" />
            <div className="h-6 w-16 bg-zinc-800 rounded" />
          </div>
          <div className="h-24 w-full bg-zinc-800 rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
