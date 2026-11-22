import { OmdbProvider } from "@/lib/api/omdb";

interface OmdbRatingsProps {
  title: string;
  year?: string;
}

export function RatingsSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse mt-2">
      <div className="h-6 w-20 bg-zinc-800 rounded" />
      <div className="h-6 w-20 bg-zinc-800 rounded" />
      <div className="h-6 w-24 bg-zinc-800 rounded" />
    </div>
  );
}

export default async function OmdbRatingsStream({ title, year }: OmdbRatingsProps) {
  const omdb = new OmdbProvider();
  let details = null;

  try {
    const searchRes = await omdb.search(title, undefined);
    if (searchRes.items.length > 0) {
      details = await omdb.getMovie(searchRes.items[0].id);
    }
  } catch (e) {
    console.error("Failed to load OMDb ratings stream:", e);
  }

  if (!details || !details.rating) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mt-2">
      {/* IMDb Rating */}
      <span className="flex items-center gap-1 bg-[#f5c518] text-black px-2 py-0.5 rounded">
        IMDb {details.rating.toFixed(1)}/10
      </span>
      {/* Fallback indicator */}
      <span className="text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
        OMDb Verified
      </span>
    </div>
  );
}
