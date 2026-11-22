"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Search page error:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-white mb-2">Search failed</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Could not complete your search. Please check your query or try again.
      </p>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-[#f5c518] text-black font-semibold text-sm rounded hover:bg-[#e4b612] transition-colors cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-800 text-zinc-200 font-semibold text-sm rounded hover:bg-zinc-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
